const { pipeline } = require('@xenova/transformers');
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

class VectorService {
  constructor() {
    this.model = null;
    this.modelName = 'Xenova/bge-small-zh-v1.5';
    this.dimension = 512; // BGE-small-zh-v1.5的向量维度
    this.isInitialized = false;
    this.initPromise = null;
  }

  /**
   * 初始化向量模型
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = this._doInitialize();
    return this.initPromise;
  }

  async _doInitialize() {
    try {
      console.log('正在初始化BGE中文向量模型...');

      // 尝试多种模型加载策略
      await this.tryLoadModel();

      this.isInitialized = true;
      console.log('✅ BGE中文向量模型初始化完成');
      console.log(`📊 模型信息: ${this.modelName}, 维度: ${this.dimension}`);
    } catch (error) {
      console.error('❌ 向量模型初始化失败:', error);
      throw error;
    }
  }

  async tryLoadModel() {
    const modelCacheDir = path.join(__dirname, '../../models/cache');

    try {
      console.log('尝试加载本地BGE PyTorch模型...');

      // 直接使用PyTorch模型，不使用ONNX或量化
      this.model = await pipeline('feature-extraction', this.modelName, {
        local_files_only: true,
        cache_dir: modelCacheDir
        // 移除所有quantized和ONNX相关配置
      });

      console.log('✅ 成功加载本地BGE PyTorch模型');

      // 测试模型并自动检测维度
      await this.detectModelDimension();
      return;
    } catch (error) {
      console.log('❌ 本地BGE模型加载失败:', error.message);

      // 尝试备用模型
      try {
        console.log('尝试加载备用多语言模型...');
        this.model = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', {
          local_files_only: true,
          cache_dir: modelCacheDir
        });

        // 更新模型配置
        this.modelName = 'Xenova/all-MiniLM-L6-v2';
        this.dimension = 384;

        console.log('✅ 成功加载备用多语言模型');

        // 测试备用模型并检测维度
        await this.detectModelDimension();
        return;
      } catch (backupError) {
        console.log('❌ 备用模型也加载失败:', backupError.message);
      }

      console.log(`💡 请确保模型文件已下载到: ${modelCacheDir}`);
      console.log('💡 运行 "npm run download-model-simple" 下载PyTorch模型');
      throw new Error('本地模型文件不存在或损坏');
    }
  }

  /**
   * 检测模型的实际向量维度
   */
  async detectModelDimension() {
    if (!this.model) {
      return;
    }

    try {
      console.log('🔍 检测模型向量维度...');
      const testVector = await this.model('测试文本', {
        pooling: 'mean',
        normalize: true
      });

      let actualDimension = 0;
      if (Array.isArray(testVector) && testVector[0] && testVector[0].data) {
        actualDimension = testVector[0].data.length;
      } else if (testVector && testVector.data) {
        actualDimension = testVector.data.length;
      } else if (Array.isArray(testVector)) {
        actualDimension = testVector.length;
      }

      if (actualDimension > 0 && actualDimension !== this.dimension) {
        console.log(`📊 更新向量维度: ${this.dimension} -> ${actualDimension}`);
        this.dimension = actualDimension;
      }

      console.log(`✅ 模型向量维度确认: ${this.dimension}`);
    } catch (error) {
      console.warn('⚠️  维度检测失败，使用默认维度:', error.message);
    }
  }

  /**
   * 将文本转换为向量
   * @param {string|Array} texts - 单个文本或文本数组
   * @returns {Promise<Array>} 向量数组
   */
  async encode(texts) {
    await this.initialize();

    try {
      const isArray = Array.isArray(texts);
      const textArray = isArray ? texts : [texts];

      // 预处理文本
      const processedTexts = textArray.map(text => this.preprocessText(text));

      if (!this.model) {
        throw new Error('向量模型未初始化，请确保模型已正确下载和加载');
      }

      // 使用真实模型编码
      console.log(`正在向量化 ${processedTexts.length} 个文本...`);
      const embeddings = await this.model(processedTexts, {
        pooling: 'mean',
        normalize: true
      });

      // 检查embeddings结构并转换为普通数组格式
      const vectors = [];
      
      console.log(`embeddings类型: ${typeof embeddings}, 是否为数组: ${Array.isArray(embeddings)}`);
      
      if (Array.isArray(embeddings)) {
        // 如果embeddings是数组
        console.log(`embeddings数组长度: ${embeddings.length}`);
        for (let i = 0; i < embeddings.length; i++) {
          console.log(`处理embeddings[${i}], 类型: ${typeof embeddings[i]}, 有data: ${!!embeddings[i]?.data}`);
          if (embeddings[i] && embeddings[i].data) {
            vectors.push(Array.from(embeddings[i].data));
          } else if (Array.isArray(embeddings[i])) {
            vectors.push(embeddings[i]);
          } else {
            throw new Error(`无效的embedding格式: ${typeof embeddings[i]}`);
          }
        }
      } else if (embeddings && embeddings.data) {
        // 如果embeddings是单个tensor
        console.log(`单个embeddings.data长度: ${embeddings.data.length}`);
        const singleVector = Array.from(embeddings.data);
        
        // 检查是否需要按批次拆分
        if (processedTexts.length > 1) {
          console.log(`需要拆分为${processedTexts.length}个向量，每个${singleVector.length / processedTexts.length}维`);
          const vectorDim = singleVector.length / processedTexts.length;
          for (let i = 0; i < processedTexts.length; i++) {
            const start = i * vectorDim;
            const end = start + vectorDim;
            vectors.push(singleVector.slice(start, end));
          }
        } else {
          vectors.push(singleVector);
        }
      } else {
        throw new Error(`无效的embeddings格式: ${typeof embeddings}`);
      }

      // 验证向量维度
      for (const vector of vectors) {
        if (!Array.isArray(vector) || vector.length !== this.dimension) {
          console.warn(`向量维度不匹配: 期望${this.dimension}, 实际${vector?.length}`);
        }
      }

      console.log(`✅ 成功生成 ${vectors.length} 个 ${vectors[0]?.length} 维向量`);
      return isArray ? vectors : vectors[0];
    } catch (error) {
      console.error('文本向量化失败:', error);
      throw error;
    }
  }


  /**
   * 预处理文本
   * @param {string} text - 输入文本
   * @returns {string} 处理后的文本
   */
  preprocessText(text) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    return text
      .trim()
      .replace(/\s+/g, ' ') // 规范化空白字符
      .substring(0, 512); // 限制长度，避免超出模型限制
  }

  /**
   * 计算两个向量的余弦相似度
   * @param {Array} vector1 - 向量1
   * @param {Array} vector2 - 向量2
   * @returns {number} 相似度分数 (0-1)
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
   * 批量计算相似度
   * @param {Array} queryVector - 查询向量
   * @param {Array} vectors - 候选向量数组
   * @returns {Array} 相似度分数数组
   */
  batchCosineSimilarity(queryVector, vectors) {
    return vectors.map(vector => this.cosineSimilarity(queryVector, vector));
  }

  /**
   * 获取模型信息
   * @returns {Object} 模型信息
   */
  getModelInfo() {
    return {
      name: this.modelName,
      dimension: this.dimension,
      isInitialized: this.isInitialized
    };
  }

  /**
   * 向量归一化
   * @param {Array} vector - 输入向量
   * @returns {Array} 归一化后的向量
   */
  normalize(vector) {
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    if (norm === 0) return vector;
    return vector.map(val => val / norm);
  }

  /**
   * 检查向量维度是否正确
   * @param {Array} vector - 向量
   * @returns {boolean} 是否有效
   */
  isValidVector(vector) {
    return Array.isArray(vector) && 
           vector.length === this.dimension && 
           vector.every(val => typeof val === 'number' && !isNaN(val));
  }

  /**
   * 批量向量化文档块
   * @param {Array} chunks - 文档块数组
   * @returns {Promise<Array>} 向量化结果
   */
  async vectorizeChunks(chunks) {
    if (!chunks || chunks.length === 0) {
      console.log('⚠️  没有文档块需要向量化');
      return [];
    }

    try {
      console.log(`开始向量化 ${chunks.length} 个文档块...`);
      console.log(`向量服务状态: 初始化=${this.isInitialized}`);

      // 提取文本内容
      const texts = chunks.map(chunk => chunk.text || chunk.content || '');
      console.log(`提取了 ${texts.length} 个文本，前3个文本长度: [${texts.slice(0, 3).map(t => t.length).join(', ')}]`);

      // 批量向量化
      const vectors = await this.encode(texts);
      console.log(`编码结果类型: ${typeof vectors}, 是否为数组: ${Array.isArray(vectors)}`);

      if (Array.isArray(vectors)) {
        console.log(`生成了 ${vectors.length} 个向量，第一个向量维度: ${vectors[0]?.length}`);
      }

      // 组合结果
      const results = chunks.map((chunk, index) => {
        const result = {
          chunkId: chunk.id,
          vector: vectors[index],
          text: texts[index],
          metadata: chunk.metadata || {}
        };

        // 验证结果
        if (!result.chunkId) {
          console.warn(`⚠️  块 ${index} 缺少ID`);
        }
        if (!result.vector || !Array.isArray(result.vector)) {
          console.warn(`⚠️  块 ${chunk.id} 向量无效: ${typeof result.vector}`);
        }

        return result;
      });

      console.log(`✅ 向量化完成，生成 ${results.length} 个向量结果`);
      console.log(`有效向量数量: ${results.filter(r => r.vector && Array.isArray(r.vector)).length}`);

      return results;
    } catch (error) {
      console.error('❌ 批量向量化失败:', error);
      console.error('错误堆栈:', error.stack);
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    if (this.model) {
      // Transformers.js 模型通常不需要显式清理
      this.model = null;
    }
    this.isInitialized = false;
    this.initPromise = null;
    console.log('向量服务资源已清理');
  }
}

// 创建单例实例
const vectorService = new VectorService();

module.exports = vectorService;
