const vectorService = require('./vectorService');
const faissService = require('./faissService');
const documentModel = require('../models/documentModel');
const config = require('../config');

class SemanticSearchService {
  constructor() {
    this.isInitialized = false;
    this.defaultTopK = config.textProcessing.maxChunksPerQuery || 5;
    this.defaultThreshold = 0.3; // 最小相似度阈值
  }

  /**
   * 初始化语义搜索服务
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('正在初始化语义搜索服务...');
      
      // 初始化向量服务和FAISS服务
      await Promise.all([
        vectorService.initialize(),
        faissService.initialize()
      ]);

      this.isInitialized = true;
      console.log('语义搜索服务初始化完成');
    } catch (error) {
      console.error('语义搜索服务初始化失败:', error);
      throw error;
    }
  }

  /**
   * 为所有文档块建立向量索引
   */
  async buildIndex() {
    await this.initialize();

    try {
      console.log('开始构建向量索引...');
      
      // 确保数据库已初始化
      const database = require('../models/database');
      if (!database.db) {
        await database.initialize();
      }
      
      // 获取所有已处理的文档块
      const chunks = await documentModel.getAllChunks();
      
      if (chunks.length === 0) {
        console.log('没有文档块需要索引');
        return { success: true, indexed: 0 };
      }

      console.log(`找到 ${chunks.length} 个文档块，开始向量化...`);

      // 批量向量化
      const batchSize = 50; // 批处理大小
      const vectorResults = [];
      
      for (let i = 0; i < chunks.length; i += batchSize) {
        const batch = chunks.slice(i, i + batchSize);
        console.log(`处理批次 ${Math.floor(i/batchSize) + 1}/${Math.ceil(chunks.length/batchSize)}`);
        
        const batchVectors = await vectorService.vectorizeChunks(batch);
        vectorResults.push(...batchVectors);
        
        // 避免内存过载，小批量休息
        if (i % (batchSize * 4) === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      // 添加到FAISS索引
      console.log('将向量添加到FAISS索引...');
      await faissService.addVectors(vectorResults);

      // 更新数据库中的向量ID
      for (const result of vectorResults) {
        await documentModel.updateChunkVectorId(result.chunkId, `faiss_${result.chunkId}`);
      }

      console.log(`向量索引构建完成，索引了 ${vectorResults.length} 个文档块`);
      
      return {
        success: true,
        indexed: vectorResults.length,
        total: chunks.length,
        stats: faissService.getStats()
      };
    } catch (error) {
      console.error('构建向量索引失败:', error);
      throw error;
    }
  }

  /**
   * 为新文档块添加向量索引
   * @param {Array} chunks - 新的文档块
   */
  async addChunksToIndex(chunks) {
    await this.initialize();

    if (!chunks || chunks.length === 0) {
      return { success: true, indexed: 0 };
    }

    try {
      console.log(`为 ${chunks.length} 个新文档块添加向量索引...`);

      // 向量化新块
      const vectorResults = await vectorService.vectorizeChunks(chunks);

      // 添加到FAISS索引
      await faissService.addVectors(vectorResults);

      // 更新数据库
      for (const result of vectorResults) {
        await documentModel.updateChunkVectorId(result.chunkId, `faiss_${result.chunkId}`);
      }

      console.log(`成功为 ${vectorResults.length} 个文档块添加了向量索引`);
      
      return {
        success: true,
        indexed: vectorResults.length,
        stats: faissService.getStats()
      };
    } catch (error) {
      console.error('添加向量索引失败:', error);
      throw error;
    }
  }

  /**
   * 语义搜索
   * @param {string} query - 查询文本
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async search(query, options = {}) {
    await this.initialize();

    const {
      topK = this.defaultTopK,
      threshold = this.defaultThreshold,
      includeContent = true,
      documentIds = null // 限制搜索范围到特定文档
    } = options;

    try {
      console.log(`执行语义搜索: "${query}"`);

      // 将查询文本向量化
      console.log(`正在向量化查询文本: "${query}"`);
      const queryVector = await vectorService.encode(query);

      // 验证查询向量
      if (!queryVector) {
        throw new Error('查询向量生成失败');
      }

      if (!Array.isArray(queryVector)) {
        throw new Error(`查询向量格式错误，期望数组，实际: ${typeof queryVector}`);
      }

      console.log(`查询向量生成成功，维度: ${queryVector.length}`);

      // 在FAISS索引中搜索
      const faissResults = await faissService.search(queryVector, topK * 2, threshold);

      if (faissResults.length === 0) {
        return [];
      }

      // 获取文档块详细信息
      const results = [];
      for (const faissResult of faissResults) {
        try {
          // 从数据库获取块信息
          const chunkInfo = await this.getChunkInfo(faissResult.chunkId);
          
          if (!chunkInfo) {
            console.warn(`找不到块信息: ${faissResult.chunkId}`);
            continue;
          }

          // 如果指定了文档ID过滤
          if (documentIds && !documentIds.includes(chunkInfo.document_id)) {
            continue;
          }

          const result = {
            chunkId: faissResult.chunkId,
            similarity: faissResult.similarity,
            distance: faissResult.distance,
            documentId: chunkInfo.document_id,
            documentName: chunkInfo.filename || chunkInfo.original_name,
            chunkIndex: chunkInfo.chunk_index,
            metadata: chunkInfo.metadata ? JSON.parse(chunkInfo.metadata) : {}
          };

          // 是否包含内容
          if (includeContent) {
            result.content = chunkInfo.content;
            result.preview = this.generatePreview(chunkInfo.content, query);
          }

          results.push(result);
        } catch (error) {
          console.error(`处理搜索结果失败 ${faissResult.chunkId}:`, error);
        }
      }

      // 按相似度排序并限制结果数量
      results.sort((a, b) => b.similarity - a.similarity);
      const finalResults = results.slice(0, topK);

      console.log(`语义搜索完成，返回 ${finalResults.length} 个结果`);
      
      return finalResults;
    } catch (error) {
      console.error('语义搜索失败:', error);
      throw error;
    }
  }

  /**
   * 获取文档块信息
   * @param {string} chunkId - 块ID
   * @returns {Promise<Object>} 块信息
   */
  async getChunkInfo(chunkId) {
    try {
      // 这里需要一个新的数据库查询方法
      const query = `
        SELECT dc.*, d.filename, d.original_name, d.file_type
        FROM document_chunks dc
        JOIN documents d ON dc.document_id = d.id
        WHERE dc.id = ?
      `;
      
      const database = require('../models/database');
      return await database.get(query, [chunkId]);
    } catch (error) {
      console.error(`获取块信息失败 ${chunkId}:`, error);
      return null;
    }
  }

  /**
   * 生成内容预览
   * @param {string} content - 完整内容
   * @param {string} query - 查询词
   * @param {number} maxLength - 最大长度
   * @returns {string} 预览文本
   */
  generatePreview(content, query, maxLength = 200) {
    if (!content) return '';

    // 简单的关键词高亮预览
    const queryWords = query.toLowerCase().split(/\s+/);
    const contentLower = content.toLowerCase();
    
    // 找到第一个匹配的位置
    let bestStart = 0;
    let bestScore = 0;
    
    for (const word of queryWords) {
      const index = contentLower.indexOf(word);
      if (index !== -1) {
        const score = queryWords.filter(w => 
          contentLower.substring(Math.max(0, index - 50), index + 50).includes(w)
        ).length;
        
        if (score > bestScore) {
          bestScore = score;
          bestStart = Math.max(0, index - 50);
        }
      }
    }

    // 生成预览
    const preview = content.substring(bestStart, bestStart + maxLength);
    return bestStart > 0 ? '...' + preview + '...' : preview + '...';
  }

  /**
   * 重建整个索引
   */
  async rebuildIndex() {
    await this.initialize();

    try {
      console.log('开始重建向量索引...');
      
      // 确保数据库已初始化
      const database = require('../models/database');
      if (!database.db) {
        await database.initialize();
      }
      
      // 获取所有文档块
      const chunks = await documentModel.getAllChunks();
      
      // 向量化所有块
      const vectorResults = await vectorService.vectorizeChunks(chunks);
      
      // 重建FAISS索引
      await faissService.rebuildIndex(vectorResults);
      
      // 更新数据库
      for (const result of vectorResults) {
        await documentModel.updateChunkVectorId(result.chunkId, `faiss_${result.chunkId}`);
      }

      console.log('向量索引重建完成');
      
      return {
        success: true,
        rebuilt: vectorResults.length,
        stats: faissService.getStats()
      };
    } catch (error) {
      console.error('重建索引失败:', error);
      throw error;
    }
  }

  /**
   * 获取搜索服务统计信息
   */
  getStats() {
    return {
      isInitialized: this.isInitialized,
      vectorService: vectorService.getModelInfo(),
      faissService: faissService.getStats(),
      defaultTopK: this.defaultTopK,
      defaultThreshold: this.defaultThreshold
    };
  }

  /**
   * 清理资源
   */
  async cleanup() {
    await Promise.all([
      vectorService.cleanup(),
      faissService.cleanup()
    ]);
    
    this.isInitialized = false;
    console.log('语义搜索服务资源已清理');
  }
}

// 创建单例实例
const semanticSearchService = new SemanticSearchService();

module.exports = semanticSearchService;
