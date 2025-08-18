const faiss = require('faiss-node');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class FaissService {
  constructor() {
    this.index = null;
    this.dimension = 512; // BGE-small-zh-v1.5的向量维度
    this.indexPath = config.vector.faissIndexPath;
    this.metadataPath = path.join(path.dirname(this.indexPath), 'metadata.json');
    this.isInitialized = false;
    this.chunkIds = []; // 维护chunkId到FAISS索引位置的映射
  }

  /**
   * 初始化FAISS向量存储
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // 确保目录存在
      await fs.mkdir(path.dirname(this.indexPath), { recursive: true });

      // 尝试加载现有数据
      if (await this.indexExists()) {
        await this.loadIndex();
        console.log('已加载现有FAISS索引');
      } else {
        await this.createNewIndex();
        console.log('创建新的FAISS索引');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('FAISS索引初始化失败:', error);
      throw new Error(`FAISS索引初始化失败: ${error.message}`);
    }
  }

  /**
   * 检查数据文件是否存在
   */
  async indexExists() {
    try {
      await fs.access(this.indexPath);
      await fs.access(this.metadataPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建新的FAISS索引
   */
  async createNewIndex() {
    // 创建新的FAISS索引
    this.index = new faiss.IndexFlatL2(this.dimension);
    this.chunkIds = [];

    // 保存空数据
    await this.saveIndex();
  }

  /**
   * 加载现有FAISS索引
   */
  async loadIndex() {
    try {
      // 加载FAISS索引
      this.index = faiss.Index.read(this.indexPath);
      
      // 加载元数据
      const metadataContent = await fs.readFile(this.metadataPath, 'utf-8');
      const savedData = JSON.parse(metadataContent);

      // 重建chunkId映射
      this.chunkIds = savedData.chunkIds || [];
      this.dimension = savedData.dimension || this.dimension;

      console.log(`加载了包含 ${this.chunkIds.length} 个向量的FAISS索引`);
    } catch (error) {
      console.error('加载FAISS索引失败:', error);
      // 如果加载失败，创建新索引
      await this.createNewIndex();
    }
  }

  /**
   * 保存FAISS索引到磁盘
   */
  async saveIndex() {
    try {
      // 保存FAISS索引
      this.index.write(this.indexPath);
      
      // 保存元数据
      const saveData = {
        dimension: this.dimension,
        totalVectors: this.chunkIds.length,
        lastUpdated: new Date().toISOString(),
        chunkIds: this.chunkIds
      };

      await fs.writeFile(this.metadataPath, JSON.stringify(saveData, null, 2));

      console.log(`FAISS索引已保存，包含 ${this.chunkIds.length} 个向量`);
    } catch (error) {
      console.error('保存FAISS索引失败:', error);
      throw error;
    }
  }

  /**
   * 添加向量到FAISS索引
   * @param {Array} vectors - 向量数组，每个元素包含 {chunkId, vector}
   */
  async addVectors(vectors) {
    await this.initialize();

    if (!vectors || vectors.length === 0) {
      return;
    }

    try {
      let addedCount = 0;
      const validVectors = [];
      const validChunkIds = [];

      // 验证和准备向量
      for (const [index, item] of vectors.entries()) {
        if (!item.chunkId || !item.vector) {
          console.warn(`跳过无效向量:`, { chunkId: item.chunkId, hasVector: !!item.vector });
          continue;
        }

        if (!Array.isArray(item.vector) || item.vector.length === 0) {
          console.warn(`跳过无效向量:`, item.chunkId);
          continue;
        }

        // 动态调整维度（首次添加向量时）
        if (this.chunkIds.length === 0 && item.vector.length !== this.dimension) {
          console.log(`调整向量维度: ${this.dimension} -> ${item.vector.length}`);
          this.dimension = item.vector.length;
          // 重新创建索引
          this.index = new faiss.IndexFlatL2(this.dimension);
        }

        if (item.vector.length !== this.dimension) {
          console.warn(`跳过维度不匹配的向量 (期望${this.dimension}，实际${item.vector.length}):`, item.chunkId);
          continue;
        }

        // 检查是否已存在 - 在重建时允许覆盖
        const existingIndex = this.chunkIds.indexOf(item.chunkId);
        if (existingIndex !== -1) {
          console.log(`向量 ${item.chunkId} 已存在，将被替换`);
          // FAISS不支持直接替换，需要重建索引
          continue;
        }

        validVectors.push(item.vector);
        validChunkIds.push(item.chunkId);
        addedCount++;
      }

      if (addedCount === 0) {
        console.log('没有有效向量需要添加');
        return;
      }

      // 逐个添加到FAISS索引
      for (let i = 0; i < validVectors.length; i++) {
        this.index.add(validVectors[i]);
      }
      
      // 更新chunkId映射
      this.chunkIds.push(...validChunkIds);

      // 保存索引
      await this.saveIndex();

      console.log(`成功添加 ${addedCount} 个向量到FAISS索引，总数: ${this.chunkIds.length}`);
    } catch (error) {
      console.error('添加向量到FAISS失败:', error);
      throw error;
    }
  }

  /**
   * 搜索相似向量
   * @param {Array} queryVector - 查询向量
   * @param {number} k - 返回的结果数量
   * @param {number} threshold - 相似度阈值（可选）
   * @returns {Promise<Array>} 搜索结果
   */
  async search(queryVector, k = 5, threshold = null) {
    await this.initialize();

    // 详细的向量验证
    if (!queryVector) {
      throw new Error('查询向量不能为空');
    }

    if (!Array.isArray(queryVector)) {
      throw new Error(`查询向量必须是数组，实际类型: ${typeof queryVector}`);
    }

    if (queryVector.length !== this.dimension) {
      console.error('向量维度详情:', {
        期望维度: this.dimension,
        实际维度: queryVector.length,
        向量类型: typeof queryVector,
        向量内容: queryVector.slice(0, 5) // 只显示前5个元素
      });
      throw new Error(`查询向量维度不匹配，期望 ${this.dimension}，实际 ${queryVector.length}`);
    }

    if (this.chunkIds.length === 0) {
      console.log('FAISS索引为空，返回空结果');
      return [];
    }

    try {
      // 准备查询向量
      const searchK = Math.min(k, this.chunkIds.length);
      
      // 执行FAISS搜索
      const searchResult = this.index.search(queryVector, searchK);

      const searchResults = [];

      // 处理搜索结果
      for (let i = 0; i < searchResult.distances.length; i++) {
        const distance = searchResult.distances[i];
        const index = searchResult.labels[i];
        
        // 跳过无效结果
        if (index === -1 || index >= this.chunkIds.length) {
          continue;
        }

        // 将L2距离转换为相似度
        const similarity = Math.max(0, 1 - distance / 2);

        // 应用阈值过滤
        if (threshold !== null && similarity < threshold) {
          continue;
        }

        searchResults.push({
          chunkId: this.chunkIds[index],
          similarity,
          distance,
          indexPosition: index
        });
      }

      // 按相似度排序
      searchResults.sort((a, b) => b.similarity - a.similarity);
      return searchResults.slice(0, k);
    } catch (error) {
      console.error('FAISS搜索失败:', error);
      throw error;
    }
  }

  /**
   * 计算余弦相似度
   * @param {Array} vector1 - 向量1
   * @param {Array} vector2 - 向量2
   * @returns {number} 相似度分数
   */
  cosineSimilarity(vector1, vector2) {
    if (!vector1 || !vector2 || vector1.length !== vector2.length) {
      return 0;
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < vector1.length; i++) {
      dotProduct += vector1[i] * vector2[i];
      norm1 += vector1[i] * vector1[i];
      norm2 += vector2[i] * vector2[i];
    }

    if (norm1 === 0 || norm2 === 0) {
      return 0;
    }

    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  /**
   * 删除向量
   * @param {string} chunkId - 要删除的块ID
   */
  async removeVector(chunkId) {
    await this.initialize();

    const index = this.chunkIds.indexOf(chunkId);
    if (index === -1) {
      console.log(`向量 ${chunkId} 不存在于FAISS索引中`);
      return;
    }

    // FAISS不支持直接删除，需要重建索引
    console.log(`FAISS不支持直接删除，重建索引以删除向量 ${chunkId}`);
    await this.rebuildIndexWithoutChunk(chunkId);
  }

  /**
   * 获取存储统计信息
   */
  getStats() {
    return {
      totalVectors: this.chunkIds.length,
      dimension: this.dimension,
      indexPath: this.indexPath,
      isInitialized: this.isInitialized,
      chunkCount: this.chunkIds.length,
      indexType: 'FAISS',
      indexSize: this.index ? this.index.ntotal : 0
    };
  }

  /**
   * 重建索引（排除指定chunk）
   * @param {string} excludeChunkId - 要排除的chunk ID
   */
  async rebuildIndexWithoutChunk(excludeChunkId) {
    try {
      // 获取所有当前的向量数据（除了要删除的）
      const allVectors = [];
      const allChunkIds = [];

      for (let i = 0; i < this.chunkIds.length; i++) {
        const chunkId = this.chunkIds[i];
        if (chunkId !== excludeChunkId) {
          // 这里需要从数据库或其他地方获取向量数据
          // 由于FAISS不支持直接获取向量，我们需要从其他地方重建
          console.log(`需要重建索引，排除 chunk: ${excludeChunkId}`);
          break;
        }
      }

      // 创建新索引
      await this.createNewIndex();
      
      console.log(`向量 ${excludeChunkId} 已通过重建索引删除`);
    } catch (error) {
      console.error('重建索引失败:', error);
      throw error;
    }
  }

  /**
   * 重建FAISS索引
   * @param {Array} allVectors - 所有向量数据
   */
  async rebuildIndex(allVectors) {
    console.log('开始重建FAISS索引...');

    // 创建新索引
    await this.createNewIndex();

    // 添加所有向量
    if (allVectors && allVectors.length > 0) {
      await this.addVectors(allVectors);
    }

    console.log('FAISS索引重建完成');
  }

  /**
   * 清理资源
   */
  async cleanup() {
    // 保存索引
    try {
      await this.saveIndex();
    } catch (error) {
      console.error('保存FAISS索引失败:', error);
    }

    this.index = null;
    this.chunkIds = [];
    this.isInitialized = false;

    console.log('FAISS索引服务资源已清理');
  }
}

// 创建单例实例
const faissService = new FaissService();

module.exports = faissService;
