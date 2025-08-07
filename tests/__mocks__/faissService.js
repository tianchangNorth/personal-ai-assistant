// Mock版本的FAISS服务，用于测试
class MockFaissService {
  constructor() {
    this.vectors = new Map(); // chunkId -> vector
    this.metadata = new Map(); // chunkId -> metadata
    this.dimension = 512;
    this.isInitialized = false;
  }

  async initialize() {
    this.isInitialized = true;
    console.log('Mock FAISS服务已初始化');
  }

  async indexExists() {
    return this.vectors.size > 0;
  }

  async createNewIndex() {
    this.vectors.clear();
    this.metadata.clear();
  }

  async loadIndex() {
    // Mock加载，实际上什么都不做
    console.log(`Mock加载了包含 ${this.vectors.size} 个向量的索引`);
  }

  async saveIndex() {
    console.log(`Mock索引已保存，包含 ${this.vectors.size} 个向量`);
  }

  async addVectors(vectors) {
    if (!vectors || vectors.length === 0) {
      return;
    }

    let addedCount = 0;
    for (const item of vectors) {
      if (!item.chunkId || !item.vector) {
        continue;
      }

      if (!Array.isArray(item.vector) || item.vector.length !== this.dimension) {
        continue;
      }

      if (this.vectors.has(item.chunkId)) {
        continue;
      }

      this.vectors.set(item.chunkId, item.vector);
      this.metadata.set(item.chunkId, {
        text: item.text || '',
        metadata: item.metadata || {}
      });
      addedCount++;
    }

    console.log(`Mock成功添加 ${addedCount} 个向量到索引`);
  }

  async search(queryVector, k = 5, threshold = null) {
    if (!Array.isArray(queryVector) || queryVector.length !== this.dimension) {
      throw new Error(`查询向量维度不匹配，期望 ${this.dimension}，实际 ${queryVector?.length}`);
    }

    if (this.vectors.size === 0) {
      return [];
    }

    const results = [];
    
    // 计算所有向量的相似度
    for (const [chunkId, vector] of this.vectors.entries()) {
      const similarity = this.cosineSimilarity(queryVector, vector);
      const distance = 2 * (1 - similarity); // 模拟L2距离
      
      if (threshold !== null && similarity < threshold) {
        continue;
      }

      results.push({
        chunkId,
        similarity,
        distance,
        indexPosition: Array.from(this.vectors.keys()).indexOf(chunkId)
      });
    }

    // 按相似度排序并限制结果数量
    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, k);
  }

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

  async removeVector(chunkId) {
    const removed = this.vectors.delete(chunkId);
    this.metadata.delete(chunkId);
    if (removed) {
      console.log(`Mock删除了向量 ${chunkId}`);
    }
  }

  getStats() {
    return {
      totalVectors: this.vectors.size,
      dimension: this.dimension,
      indexPath: 'mock://faiss_index',
      isInitialized: this.isInitialized,
      chunkCount: this.vectors.size
    };
  }

  async rebuildIndex(allVectors) {
    console.log('Mock开始重建FAISS索引...');
    this.vectors.clear();
    this.metadata.clear();
    
    if (allVectors && allVectors.length > 0) {
      await this.addVectors(allVectors);
    }
    
    console.log('Mock索引重建完成');
  }

  async cleanup() {
    this.vectors.clear();
    this.metadata.clear();
    this.isInitialized = false;
    console.log('Mock FAISS服务资源已清理');
  }
}

module.exports = new MockFaissService();
