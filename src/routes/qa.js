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
