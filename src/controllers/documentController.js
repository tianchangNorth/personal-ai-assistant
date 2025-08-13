const path = require('path');
const fs = require('fs').promises;
const DocumentParser = require('../services/documentParser');
const TextSplitter = require('../services/textSplitter');
const documentModel = require('../models/documentModel');
const semanticSearchService = require('../services/semanticSearchService');
const config = require('../config');

class DocumentController {
  constructor() {
    this.parser = new DocumentParser();
    this.splitter = new TextSplitter();
    
    // 索引重建管理
    this.rebuildPending = false;
    this.rebuildTimer = null;
    this.rebuildDelay = 5000; // 5秒延迟
    this.lastRebuildTime = 0;
    this.minRebuildInterval = 30000; // 最小重建间隔30秒
  }

  /**
   * 上传文档
   */
  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: '没有上传文件'
        });
      }

      const file = req.file;
      const metadata = {
        uploadedBy: req.body.uploadedBy || 'anonymous',
        description: req.body.description || '',
        tags: req.body.tags ? req.body.tags.split(',').map(tag => tag.trim()) : []
      };

      // 保存文档记录到数据库
      const documentId = await documentModel.createDocument({
        filename: file.filename,
        originalName: file.originalname,
        filePath: file.path,
        fileType: path.extname(file.originalname).toLowerCase(),
        fileSize: file.size,
        mimeType: file.mimetype,
        metadata
      });

      // 异步处理文档
      this.processDocumentAsync(documentId, file.path, metadata);

      res.json({
        success: true,
        message: '文档上传成功，正在处理中',
        data: {
          documentId,
          filename: file.originalname,
          size: file.size,
          type: path.extname(file.originalname).toLowerCase()
        }
      });
    } catch (error) {
      console.error('文档上传失败:', error);
      res.status(500).json({
        success: false,
        error: '文档上传失败',
        details: error.message
      });
    }
  }

  /**
   * 异步处理文档
   */
  async processDocumentAsync(documentId, filePath, metadata) {
    try {
      // 更新状态为处理中
      await documentModel.updateProcessingStatus(documentId, 'processing');

      // 解析文档
      const parseResult = await this.parser.parseDocument(filePath, metadata);
      
      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      // 文本切分
      const chunks = this.splitter.splitText(parseResult.content, {
        ...parseResult.metadata,
        documentId
      });

      // 保存文档块
      await documentModel.saveDocumentChunks(documentId, chunks);

      // 更新状态为完成
      await documentModel.updateProcessingStatus(documentId, 'completed');

      // 防抖重建向量索引以确保数据一致性
      try {
        console.log(`文档 ${documentId} 处理完成，计划重建向量索引...`);
        // 添加延迟确保数据库事务完全提交
        await new Promise(resolve => setTimeout(resolve, 500));
        await this.scheduleRebuildIndex();
      } catch (vectorError) {
        console.error(`调度重建向量索引失败 ${documentId}:`, vectorError);
        // 不影响文档处理流程，继续执行
      }

      console.log(`文档处理完成: ${documentId}, 生成 ${chunks.length} 个文本块`);
    } catch (error) {
      console.error(`文档处理失败 ${documentId}:`, error);
      await documentModel.updateProcessingStatus(documentId, 'failed', error.message);
    }
  }

  /**
   * 获取文档列表
   */
  async getDocuments(req, res) {
    try {
      const {
        status,
        fileType,
        page = 1,
        limit = 20,
        orderBy = 'created_at',
        orderDir = 'DESC'
      } = req.query;

      const offset = (page - 1) * limit;
      
      const documents = await documentModel.getDocuments({
        status,
        fileType,
        limit: parseInt(limit),
        offset,
        orderBy,
        orderDir
      });

      res.json({
        success: true,
        data: {
          documents,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: documents.length
          }
        }
      });
    } catch (error) {
      console.error('获取文档列表失败:', error);
      res.status(500).json({
        success: false,
        error: '获取文档列表失败',
        details: error.message
      });
    }
  }

  /**
   * 获取文档详情
   */
  async getDocument(req, res) {
    try {
      const { id } = req.params;
      
      const document = await documentModel.getDocument(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }

      // 获取文档块信息
      const chunks = await documentModel.getDocumentChunks(id);
      
      res.json({
        success: true,
        data: {
          document,
          chunks: chunks.map(chunk => ({
            id: chunk.id,
            index: chunk.chunk_index,
            size: chunk.chunk_size,
            preview: chunk.content.substring(0, 100) + (chunk.content.length > 100 ? '...' : '')
          }))
        }
      });
    } catch (error) {
      console.error('获取文档详情失败:', error);
      res.status(500).json({
        success: false,
        error: '获取文档详情失败',
        details: error.message
      });
    }
  }

  /**
   * 获取文档块内容
   */
  async getDocumentChunk(req, res) {
    try {
      const { id, chunkId } = req.params;
      
      const chunks = await documentModel.getDocumentChunks(id);
      const chunk = chunks.find(c => c.id == chunkId);
      
      if (!chunk) {
        return res.status(404).json({
          success: false,
          error: '文档块不存在'
        });
      }

      res.json({
        success: true,
        data: chunk
      });
    } catch (error) {
      console.error('获取文档块失败:', error);
      res.status(500).json({
        success: false,
        error: '获取文档块失败',
        details: error.message
      });
    }
  }

  /**
   * 删除文档
   */
  async deleteDocument(req, res) {
    try {
      const { id } = req.params;
      
      // 获取文档信息
      const document = await documentModel.getDocument(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }

      // 删除文件
      try {
        await fs.unlink(document.file_path);
      } catch (error) {
        console.warn('删除文件失败:', error.message);
      }

      // 删除数据库记录
      await documentModel.deleteDocument(id);

      res.json({
        success: true,
        message: '文档删除成功'
      });
    } catch (error) {
      console.error('删除文档失败:', error);
      res.status(500).json({
        success: false,
        error: '删除文档失败',
        details: error.message
      });
    }
  }

  /**
   * 防抖调度重建向量索引
   */
  async scheduleRebuildIndex() {
    const now = Date.now();
    
    // 检查是否在最小重建间隔内
    if (now - this.lastRebuildTime < this.minRebuildInterval) {
      const nextAllowedTime = this.lastRebuildTime + this.minRebuildInterval;
      const delay = Math.max(this.rebuildDelay, nextAllowedTime - now);
      
      console.log(`距离上次重建时间过短，将在 ${Math.round(delay/1000)} 秒后重建`);
      
      // 清除之前的定时器
      if (this.rebuildTimer) {
        clearTimeout(this.rebuildTimer);
      }
      
      // 设置新的定时器
      return new Promise((resolve) => {
        this.rebuildTimer = setTimeout(async () => {
          try {
            const result = await this.rebuildVectorIndex();
            resolve(result);
          } catch (error) {
            console.error('防抖重建失败:', error);
            resolve(null);
          }
        }, delay);
      });
    }
    
    // 如果没有等待中的重建任务，立即重建
    if (!this.rebuildPending) {
      return this.rebuildVectorIndex();
    }
    
    // 否则设置延迟重建
    return new Promise((resolve) => {
      if (this.rebuildTimer) {
        clearTimeout(this.rebuildTimer);
      }
      
      this.rebuildTimer = setTimeout(async () => {
        try {
          const result = await this.rebuildVectorIndex();
          resolve(result);
        } catch (error) {
          console.error('防抖重建失败:', error);
          resolve(null);
        }
      }, this.rebuildDelay);
    });
  }

  /**
   * 重建向量索引
   */
  async rebuildVectorIndex() {
    try {
      const now = Date.now();
      
      // 检查是否正在重建
      if (this.rebuildPending) {
        console.log('索引重建正在进行中，跳过本次重建');
        return { success: true, rebuilt: 0, message: '重建正在进行中' };
      }
      
      // 检查是否在最小重建间隔内
      if (now - this.lastRebuildTime < this.minRebuildInterval) {
        console.log(`距离上次重建时间过短，跳过本次重建`);
        return { success: true, rebuilt: 0, message: '重建间隔过短' };
      }
      
      this.rebuildPending = true;
      console.log('开始重建向量索引...');
      
      // 初始化语义搜索服务
      await semanticSearchService.initialize();
      
      // 重建索引
      const result = await semanticSearchService.rebuildIndex();
      
      this.lastRebuildTime = now;
      this.rebuildPending = false;
      
      console.log(`向量索引重建完成，共重建 ${result.rebuilt} 个向量`);
      return result;
    } catch (error) {
      this.rebuildPending = false;
      console.error('重建向量索引失败:', error);
      throw error;
    }
  }

  /**
   * 重新处理文档
   */
  async reprocessDocument(req, res) {
    try {
      const { id } = req.params;
      
      const document = await documentModel.getDocument(id);
      if (!document) {
        return res.status(404).json({
          success: false,
          error: '文档不存在'
        });
      }

      // 检查文件是否存在
      try {
        await fs.access(document.file_path);
      } catch (error) {
        return res.status(400).json({
          success: false,
          error: '文档文件不存在，无法重新处理'
        });
      }

      // 异步重新处理
      this.processDocumentAsync(id, document.file_path, document.metadata);

      res.json({
        success: true,
        message: '文档重新处理已开始'
      });
    } catch (error) {
      console.error('重新处理文档失败:', error);
      res.status(500).json({
        success: false,
        error: '重新处理文档失败',
        details: error.message
      });
    }
  }

  /**
   * 手动重建向量索引
   */
  async rebuildIndex(req, res) {
    try {
      console.log('收到手动重建向量索引请求');
      
      const result = await this.rebuildVectorIndex();
      
      res.json({
        success: true,
        message: '向量索引重建完成',
        data: {
          rebuilt: result.rebuilt,
          stats: result.stats
        }
      });
    } catch (error) {
      console.error('手动重建向量索引失败:', error);
      res.status(500).json({
        success: false,
        error: '重建向量索引失败',
        details: error.message
      });
    }
  }

  /**
   * 获取文档统计信息
   */
  async getStatistics(req, res) {
    try {
      const stats = await documentModel.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('获取统计信息失败:', error);
      res.status(500).json({
        success: false,
        error: '获取统计信息失败',
        details: error.message
      });
    }
  }

  /**
   * 搜索文档
   */
  async searchDocuments(req, res) {
    try {
      const { q: query, page = 1, limit = 10 } = req.query;
      
      if (!query) {
        return res.status(400).json({
          success: false,
          error: '搜索关键词不能为空'
        });
      }

      const offset = (page - 1) * limit;
      const results = await documentModel.searchDocuments(query, {
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          results,
          query,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: results.length
          }
        }
      });
    } catch (error) {
      console.error('搜索文档失败:', error);
      res.status(500).json({
        success: false,
        error: '搜索文档失败',
        details: error.message
      });
    }
  }
}

module.exports = new DocumentController();
