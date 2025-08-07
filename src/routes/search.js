const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

/**
 * @route POST /api/search/semantic
 * @desc 语义搜索
 * @access Public
 * @body {string} query - 查询文本
 * @body {number} topK - 返回结果数量 (默认: 5, 最大: 20)
 * @body {number} threshold - 相似度阈值 (默认: 0.3, 范围: 0-1)
 * @body {boolean} includeContent - 是否包含内容 (默认: true)
 * @body {Array} documentIds - 限制搜索的文档ID列表 (可选)
 */
router.post('/semantic', searchController.semanticSearch.bind(searchController));

/**
 * @route POST /api/search/build-index
 * @desc 构建向量索引
 * @access Public
 */
router.post('/build-index', searchController.buildIndex.bind(searchController));

/**
 * @route POST /api/search/rebuild-index
 * @desc 重建向量索引
 * @access Public
 */
router.post('/rebuild-index', searchController.rebuildIndex.bind(searchController));

/**
 * @route GET /api/search/status
 * @desc 获取向量服务状态
 * @access Public
 */
router.get('/status', searchController.getStatus.bind(searchController));

/**
 * @route POST /api/search/vectorize
 * @desc 文本向量化
 * @access Public
 * @body {string} text - 单个文本
 * @body {Array} texts - 文本数组
 */
router.post('/vectorize', searchController.vectorize.bind(searchController));

/**
 * @route POST /api/search/similarity
 * @desc 计算向量相似度
 * @access Public
 * @body {Array} vector1 - 第一个向量
 * @body {Array} vector2 - 第二个向量 (与vectors二选一)
 * @body {Array} vectors - 向量数组 (与vector2二选一)
 */
router.post('/similarity', searchController.similarity.bind(searchController));

/**
 * @route GET /api/search/index-stats
 * @desc 获取索引统计信息
 * @access Public
 */
router.get('/index-stats', searchController.getIndexStats.bind(searchController));

/**
 * @route GET /api/search/health
 * @desc 向量服务健康检查
 * @access Public
 */
router.get('/health', searchController.healthCheck.bind(searchController));

/**
 * @route POST /api/search/initialize
 * @desc 初始化向量服务
 * @access Public
 */
router.post('/initialize', searchController.initialize.bind(searchController));

module.exports = router;
