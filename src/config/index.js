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
    path: process.env.DB_PATH || path.join(__dirname, '../../data/database/wecombot.db')
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

  // 企业微信配置
  wecom: {
    corpId: process.env.WECOM_CORP_ID,
    corpSecret: process.env.WECOM_CORP_SECRET,
    agentId: process.env.WECOM_AGENT_ID,
    token: process.env.WECOM_TOKEN,
    encodingAESKey: process.env.WECOM_ENCODING_AES_KEY
  },

  // 日志配置
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || path.join(__dirname, '../../logs/wecombot.log')
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
  }
};

module.exports = config;
