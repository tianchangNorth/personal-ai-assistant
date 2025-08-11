const express = require('express');
const router = express.Router();
const qaController = require('../controllers/qaController');

/**
 * @route POST /api/qa/ask
 * @desc RAG问答
 * @access Public
 */
router.post('/ask', qaController.ask);

/**
 * @route POST /api/qa/batch
 * @desc 批量问答
 * @access Public
 */
router.post('/batch', qaController.batchAsk);

/**
 * @route POST /api/qa/chat
 * @desc 直接LLM对话 (不使用RAG)
 * @access Public
 */
router.post('/chat', qaController.chat);

/**
 * @route GET /api/qa/llm/status
 * @desc 获取LLM服务状态
 * @access Public
 */
router.get('/llm/status', qaController.getLLMStatus);

/**
 * @route GET /api/qa/third-party/status
 * @desc 获取第三方API服务状态
 * @access Public
 */
router.get('/third-party/status', qaController.getThirdPartyAPIStatus);

/**
 * @route GET /api/qa/providers
 * @desc 获取可用的API提供商
 * @access Public
 */
router.get('/providers', qaController.getAvailableProviders);

/**
 * @route POST /api/qa/providers/switch
 * @desc 切换API提供商
 * @access Public
 */
router.post('/providers/switch', qaController.switchProvider);

/**
 * @route GET /api/qa/rag/status
 * @desc 获取RAG服务状态
 * @access Public
 */
router.get('/rag/status', qaController.getRAGStatus);

/**
 * @route GET /api/qa/health
 * @desc RAG服务健康检查
 * @access Public
 */
router.get('/health', qaController.healthCheck);

module.exports = router;
