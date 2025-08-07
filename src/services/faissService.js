// 由于faiss-node库存在兼容性问题，我们使用内存存储替代
// const faiss = require('faiss-node');
const fs = require('fs').promises;
const path = require('path');
const config = require('../config');

class FaissService {
  constructor() {
    // 使用内存存储替代FAISS，避免依赖问题
    this.vectors = new Map(); // chunkId -> vector
    this.metadata = new Map(); // chunkId -> metadata
    this.dimension = 512; // BGE-small-zh-v1.5的向量维度
    this.indexPath = config.vector.faissIndexPath;
    this.metadataPath = path.join(path.dirname(this.indexPath), 'metadata.json');
    this.isInitialized = false;
  }

  /**
   * 初始化内存向量存储
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
        console.log('已加载现有向量数据');
      } else {
        await this.createNewIndex();
        console.log('创建新的向量存储');
      }

      this.isInitialized = true;
    } catch (error) {
      console.error('向量存储初始化失败:', error);
      throw new Error(`向量存储初始化失败: ${error.message}`);
    }
  }

  /**
   * 检查数据文件是否存在
   */
  async indexExists() {
    try {
      await fs.access(this.metadataPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 创建新的存储
   */
  async createNewIndex() {
    // 清空内存存储
    this.vectors.clear();
    this.metadata.clear();

    // 保存空数据
    await this.saveIndex();
  }

  /**
   * 加载现有数据
   */
  async loadIndex() {
    try {
      // 加载元数据
      const metadataContent = await fs.readFile(this.metadataPath, 'utf-8');
      const savedData = JSON.parse(metadataContent);

      // 重建内存存储
      this.vectors.clear();
      this.metadata.clear();

      if (savedData.vectors) {
        for (const [chunkId, vectorData] of Object.entries(savedData.vectors)) {
          this.vectors.set(chunkId, vectorData.vector);
          this.metadata.set(chunkId, vectorData.metadata);
        }
      }

      console.log(`加载了包含 ${this.vectors.size} 个向量的数据`);
    } catch (error) {
      console.error('加载数据失败:', error);
      // 如果加载失败，创建新存储
      await this.createNewIndex();
    }
  }

  /**
   * 保存数据到磁盘
   */
  async saveIndex() {
    try {
      // 准备保存的数据
      const saveData = {
        dimension: this.dimension,
        totalVectors: this.vectors.size,
        lastUpdated: new Date().toISOString(),
        vectors: {}
      };

      // 保存向量和元数据
      for (const [chunkId, vector] of this.vectors.entries()) {
        saveData.vectors[chunkId] = {
          vector: vector,
          metadata: this.metadata.get(chunkId) || {}
        };
      }

      await fs.writeFile(this.metadataPath, JSON.stringify(saveData, null, 2));

      console.log(`数据已保存，包含 ${this.vectors.size} 个向量`);
    } catch (error) {
      console.error('保存数据失败:', error);
      throw error;
    }
  }

  /**
   * 添加向量到存储
   * @param {Array} vectors - 向量数组，每个元素包含 {chunkId, vector}
   */
  async addVectors(vectors) {
    await this.initialize();

    if (!vectors || vectors.length === 0) {
      return;
    }

    try {
      let addedCount = 0;

      // 验证和添加向量
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
        if (this.vectors.size === 0 && item.vector.length !== this.dimension) {
          console.log(`调整向量维度: ${this.dimension} -> ${item.vector.length}`);
          this.dimension = item.vector.length;
        }

        if (item.vector.length !== this.dimension) {
          console.warn(`跳过维度不匹配的向量 (期望${this.dimension}，实际${item.vector.length}):`, item.chunkId);
          continue;
        }

        // 检查是否已存在 - 在重建时允许覆盖
        if (this.vectors.has(item.chunkId)) {
          // 在重建时，覆盖现有向量
        }

        // 添加到内存存储
        this.vectors.set(item.chunkId, item.vector);
        this.metadata.set(item.chunkId, {
          text: item.text || '',
          metadata: item.metadata || {}
        });
        addedCount++;
      }

      if (addedCount === 0) {
        console.log('没有有效向量需要添加');
        return;
      }

      // 保存数据
      await this.saveIndex();

      console.log(`成功添加 ${addedCount} 个向量到存储，总数: ${this.vectors.size}`);
    } catch (error) {
      console.error('添加向量失败:', error);
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

    if (this.vectors.size === 0) {
      console.log('向量存储为空，返回空结果');
      return [];
    }

    try {
      const searchResults = [];

      // 计算所有向量的相似度
      for (const [chunkId, vector] of this.vectors.entries()) {
        const similarity = this.cosineSimilarity(queryVector, vector);
        const distance = 2 * (1 - similarity); // 模拟L2距离

        // 应用阈值过滤
        if (threshold !== null && similarity < threshold) {
          continue;
        }

        searchResults.push({
          chunkId,
          similarity,
          distance,
          indexPosition: Array.from(this.vectors.keys()).indexOf(chunkId)
        });
      }

      // 按相似度排序并限制结果数量
      searchResults.sort((a, b) => b.similarity - a.similarity);
      return searchResults.slice(0, k);
    } catch (error) {
      console.error('向量搜索失败:', error);
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

    if (!this.vectors.has(chunkId)) {
      console.log(`向量 ${chunkId} 不存在于存储中`);
      return;
    }

    // 从内存中删除
    this.vectors.delete(chunkId);
    this.metadata.delete(chunkId);

    // 保存更新
    await this.saveIndex();
    console.log(`向量 ${chunkId} 已删除`);
  }

  /**
   * 获取存储统计信息
   */
  getStats() {
    return {
      totalVectors: this.vectors.size,
      dimension: this.dimension,
      indexPath: this.indexPath,
      isInitialized: this.isInitialized,
      chunkCount: this.vectors.size
    };
  }

  /**
   * 重建存储
   * @param {Array} allVectors - 所有向量数据
   */
  async rebuildIndex(allVectors) {
    console.log('开始重建向量存储...');

    // 创建新存储
    await this.createNewIndex();

    // 添加所有向量
    if (allVectors && allVectors.length > 0) {
      await this.addVectors(allVectors);
    }

    console.log('向量存储重建完成');
  }

  /**
   * 清理资源
   */
  async cleanup() {
    // 保存数据
    try {
      await this.saveIndex();
    } catch (error) {
      console.error('保存数据失败:', error);
    }

    this.vectors.clear();
    this.metadata.clear();
    this.isInitialized = false;

    console.log('向量存储服务资源已清理');
  }
}

// 创建单例实例
const faissService = new FaissService();

module.exports = faissService;
