// Mock版本的向量服务，用于测试
class MockVectorService {
  constructor() {
    this.model = null;
    this.modelName = 'BAAI/bge-small-zh-v1.5';
    this.dimension = 512;
    this.isInitialized = false;
  }

  async initialize() {
    this.isInitialized = true;
    console.log('Mock向量服务已初始化');
  }

  async encode(texts) {
    const isArray = Array.isArray(texts);
    const textArray = isArray ? texts : [texts];
    
    // 生成mock向量（随机但一致）
    const vectors = textArray.map(text => {
      const vector = [];
      // 使用文本内容生成一致的"向量"
      const seed = this.hashCode(text || '');
      for (let i = 0; i < this.dimension; i++) {
        vector.push(Math.sin(seed + i) * 0.1);
      }
      return vector;
    });

    return isArray ? vectors : vectors[0];
  }

  hashCode(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    return hash;
  }

  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }
    return text.trim().replace(/\s+/g, ' ').substring(0, 512);
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

  batchCosineSimilarity(queryVector, vectors) {
    return vectors.map(vector => this.cosineSimilarity(queryVector, vector));
  }

  getModelInfo() {
    return {
      name: this.modelName,
      dimension: this.dimension,
      isInitialized: this.isInitialized
    };
  }

  normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map(val => val / norm);
  }

  isValidVector(vector) {
    return Array.isArray(vector) && 
           vector.length === this.dimension && 
           vector.every(val => typeof val === 'number' && !isNaN(val));
  }

  async vectorizeChunks(chunks) {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const texts = chunks.map(chunk => chunk.text || chunk.content || '');
    const vectors = await this.encode(texts);
    
    return chunks.map((chunk, index) => ({
      chunkId: chunk.id,
      vector: vectors[index],
      text: texts[index],
      metadata: chunk.metadata || {}
    }));
  }

  async cleanup() {
    this.model = null;
    this.isInitialized = false;
    console.log('Mock向量服务资源已清理');
  }
}

module.exports = new MockVectorService();
