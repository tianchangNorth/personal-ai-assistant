const path = require('path');
require('dotenv').config();

const config = {
  // 服务器配置
  server: {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    host: process.env.HOST || 'localhost'
  },

  // 数据库配置
  database: {
    path: process.env.DB_PATH || path.join(__dirname, '../../data/database/personal-ai-assistant.db')
  },

  // 文件上传配置
  upload: {
    dir: process.env.UPLOAD_DIR || path.join(__dirname, '../../uploads'),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
    allowedTypes: (process.env.ALLOWED_FILE_TYPES || 'pdf,docx,md').split(',')
  },

  // 向量模型配置
  vector: {
    modelPath: process.env.VECTOR_MODEL_PATH || path.join(__dirname, '../../models/bge-small-zh-v1.5'),
    dimension: parseInt(process.env.VECTOR_DIMENSION) || 512,
    faissIndexPath: process.env.FAISS_INDEX_PATH || path.join(__dirname, '../../data/vectors/vector_data.json')
  },

  // LLM配置
  llm: {
    modelPath: process.env.LLM_MODEL_PATH || path.join(__dirname, '../../models/qwen-0.5b'),
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 2048,
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7
  },

  
  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/personal-ai-assistant.log')
  },

  // 文本处理配置
  textProcessing: {
    chunkSize: parseInt(process.env.CHUNK_SIZE) || 300,
    chunkOverlap: parseInt(process.env.CHUNK_OVERLAP) || 50,
    maxChunksPerQuery: parseInt(process.env.MAX_CHUNKS_PER_QUERY) || 5
  },

  // API配置
  api: {
    rateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
    timeout: parseInt(process.env.API_TIMEOUT) || 30000
  },

  // 第三方LLM配置（自动识别供应商）
  llm: {
    apiKey: process.env.LLM_API_KEY,
    model: process.env.LLM_MODEL || 'gpt-3.5-turbo',
    baseURL: process.env.LLM_BASE_URL || 'https://api.openai.com/v1',
    maxTokens: parseInt(process.env.LLM_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.LLM_TEMPERATURE) || 0.7,
    fallbackToLocal: process.env.LLM_FALLBACK_TO_LOCAL === 'true',
    retryAttempts: 3,
    
    // 根据baseURL自动识别供应商
    get provider() {
      const url = this.baseURL.toLowerCase();
      if (url.includes('openai.com')) return 'openai';
      if (url.includes('anthropic.com')) return 'anthropic';
      if (url.includes('baidubce.com')) return 'baidu';
      if (url.includes('dashscope.aliyuncs.com')) return 'qwen';
      if (url.includes('bigmodel.cn')) return 'zhipu';
      if (url.includes('moonshot.cn')) return 'kimi';
      if (url.includes('volces.com')) return 'doubao';
      if (url.includes('tencentcloudapi.com')) return 'hunyuan';
      if (url.includes('azure.com')) return 'azure';
      return 'unknown';
    }
  }
};

module.exports = config;
