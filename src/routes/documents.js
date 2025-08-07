const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { upload, handleUploadError } = require('../middleware/upload');

/**
 * @route POST /api/documents/upload
 * @desc 上传文档
 * @access Public
 */
router.post('/upload', 
  upload.single('document'), 
  handleUploadError,
  documentController.uploadDocument.bind(documentController)
);

/**
 * @route GET /api/documents
 * @desc 获取文档列表
 * @access Public
 * @query {string} status - 处理状态 (pending, processing, completed, failed)
 * @query {string} fileType - 文件类型 (.pdf, .docx, .md)
 * @query {number} page - 页码 (默认: 1)
 * @query {number} limit - 每页数量 (默认: 20)
 * @query {string} orderBy - 排序字段 (默认: created_at)
 * @query {string} orderDir - 排序方向 (ASC, DESC, 默认: DESC)
 */
router.get('/', documentController.getDocuments.bind(documentController));

/**
 * @route GET /api/documents/search
 * @desc 搜索文档
 * @access Public
 * @query {string} q - 搜索关键词
 * @query {number} page - 页码 (默认: 1)
 * @query {number} limit - 每页数量 (默认: 10)
 */
router.get('/search', documentController.searchDocuments.bind(documentController));

/**
 * @route GET /api/documents/statistics
 * @desc 获取文档统计信息
 * @access Public
 */
router.get('/statistics', documentController.getStatistics.bind(documentController));

/**
 * @route GET /api/documents/:id
 * @desc 获取文档详情
 * @access Public
 * @param {number} id - 文档ID
 */
router.get('/:id', documentController.getDocument.bind(documentController));

/**
 * @route GET /api/documents/:id/chunks/:chunkId
 * @desc 获取文档块内容
 * @access Public
 * @param {number} id - 文档ID
 * @param {number} chunkId - 文档块ID
 */
router.get('/:id/chunks/:chunkId', documentController.getDocumentChunk.bind(documentController));

/**
 * @route POST /api/documents/:id/reprocess
 * @desc 重新处理文档
 * @access Public
 * @param {number} id - 文档ID
 */
router.post('/:id/reprocess', documentController.reprocessDocument.bind(documentController));

/**
 * @route DELETE /api/documents/:id
 * @desc 删除文档
 * @access Public
 * @param {number} id - 文档ID
 */
router.delete('/:id', documentController.deleteDocument.bind(documentController));

module.exports = router;
