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
  },

  // 第三方API配置
  thirdParty: {
    defaultProvider: process.env.THIRD_PARTY_DEFAULT_PROVIDER || 'openai',
    fallbackToLocal: process.env.THIRD_PARTY_FALLBACK_TO_LOCAL === 'true',
    retryAttempts: parseInt(process.env.THIRD_PARTY_RETRY_ATTEMPTS) || 3
  },

  // OpenAI配置
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
    model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7
  },

  // Azure OpenAI配置
  azure: {
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    endpoint: process.env.AZURE_OPENAI_ENDPOINT,
    deploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE) || 0.7
  },

  // Anthropic配置
  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: process.env.ANTHROPIC_API_BASE_URL || 'https://api.anthropic.com',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7
  },

  // 百度配置
  baidu: {
    apiKey: process.env.BAIDU_API_KEY,
    secretKey: process.env.BAIDU_SECRET_KEY,
    baseURL: process.env.BAIDU_API_BASE_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
    model: process.env.BAIDU_MODEL || 'ernie-speed-128k',
    maxTokens: parseInt(process.env.BAIDU_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.BAIDU_TEMPERATURE) || 0.7
  },

  // 阿里云配置
  qwen: {
    apiKey: process.env.QWEN_API_KEY,
    baseURL: process.env.QWEN_API_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
    model: process.env.QWEN_MODEL || 'qwen-turbo',
    maxTokens: parseInt(process.env.QWEN_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.QWEN_TEMPERATURE) || 0.7
  },

  // 智谱AI配置
  zhipu: {
    apiKey: process.env.ZHIPU_API_KEY,
    baseURL: process.env.ZHIPU_API_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
    model: process.env.ZHIPU_MODEL || 'glm-4-flash',
    maxTokens: parseInt(process.env.ZHIPU_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.ZHIPU_TEMPERATURE) || 0.7
  },

  // 月之暗面配置
  kimi: {
    apiKey: process.env.KIMI_API_KEY,
    baseURL: process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1/chat/completions',
    model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
    maxTokens: parseInt(process.env.KIMI_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.KIMI_TEMPERATURE) || 0.7
  },

  // 字节跳动配置
  doubao: {
    apiKey: process.env.DOUBAO_API_KEY,
    baseURL: process.env.DOUBAO_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
    model: process.env.DOUBAO_MODEL || 'doubao-pro-4k',
    maxTokens: parseInt(process.env.DOUBAO_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.DOUBAO_TEMPERATURE) || 0.7
  },

  // 腾讯混元配置
  hunyuan: {
    secretId: process.env.HUNYUAN_SECRET_ID,
    secretKey: process.env.HUNYUAN_SECRET_KEY,
    baseURL: process.env.HUNYUAN_API_BASE_URL || 'https://hunyuan.tencentcloudapi.com',
    model: process.env.HUNYUAN_MODEL || 'hunyuan-pro',
    maxTokens: parseInt(process.env.HUNYUAN_MAX_TOKENS) || 4096,
    temperature: parseFloat(process.env.HUNYUAN_TEMPERATURE) || 0.7
  }
};

module.exports = config;
