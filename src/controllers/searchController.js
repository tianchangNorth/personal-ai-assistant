const semanticSearchService = require('../services/semanticSearchService');
const vectorService = require('../services/vectorService');
const faissService = require('../services/faissService');

class SearchController {
  /**
   * 语义搜索
   */
  async semanticSearch(req, res) {
    try {
      const { 
        query, 
        topK = 5, 
        threshold = 0.3,
        includeContent = true,
        documentIds 
      } = req.body;

      if (!query || typeof query !== 'string' || query.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '查询内容不能为空'
        });
      }

      const options = {
        topK: Math.min(Math.max(parseInt(topK), 1), 20), // 限制在1-20之间
        threshold: Math.max(Math.min(parseFloat(threshold), 1), 0), // 限制在0-1之间
        includeContent: Boolean(includeContent),
        documentIds: documentIds ? (Array.isArray(documentIds) ? documentIds : [documentIds]) : null
      };

      const startTime = Date.now();
      const results = await semanticSearchService.search(query.trim(), options);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          query: query.trim(),
          results,
          total: results.length,
          options,
          responseTime
        }
      });
    } catch (error) {
      console.error('语义搜索失败:', error);
      res.status(500).json({
        success: false,
        error: '语义搜索失败',
        details: error.message
      });
    }
  }

  /**
   * 构建向量索引
   */
  async buildIndex(req, res) {
    try {
      console.log('开始构建向量索引...');
      const result = await semanticSearchService.buildIndex();

      res.json({
        success: true,
        message: '向量索引构建完成',
        data: result
      });
    } catch (error) {
      console.error('构建向量索引失败:', error);
      res.status(500).json({
        success: false,
        error: '构建向量索引失败',
        details: error.message
      });
    }
  }

  /**
   * 重建向量索引
   */
  async rebuildIndex(req, res) {
    try {
      console.log('开始重建向量索引...');
      const result = await semanticSearchService.rebuildIndex();

      res.json({
        success: true,
        message: '向量索引重建完成',
        data: result
      });
    } catch (error) {
      console.error('重建向量索引失败:', error);
      res.status(500).json({
        success: false,
        error: '重建向量索引失败',
        details: error.message
      });
    }
  }

  /**
   * 获取向量服务状态
   */
  async getStatus(req, res) {
    try {
      const stats = semanticSearchService.getStats();
      
      res.json({
        success: true,
        data: {
          status: 'running',
          ...stats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('获取向量服务状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取状态失败',
        details: error.message
      });
    }
  }

  /**
   * 文本向量化
   */
  async vectorize(req, res) {
    try {
      const { text, texts } = req.body;

      if (!text && !texts) {
        return res.status(400).json({
          success: false,
          error: '请提供text或texts参数'
        });
      }

      const input = text || texts;
      const isArray = Array.isArray(input);

      if (isArray && input.length > 100) {
        return res.status(400).json({
          success: false,
          error: '批量向量化最多支持100个文本'
        });
      }

      const startTime = Date.now();
      const vectors = await vectorService.encode(input);
      const responseTime = Date.now() - startTime;

      res.json({
        success: true,
        data: {
          vectors: isArray ? vectors : [vectors],
          dimension: vectorService.dimension,
          count: isArray ? vectors.length : 1,
          responseTime
        }
      });
    } catch (error) {
      console.error('文本向量化失败:', error);
      res.status(500).json({
        success: false,
        error: '文本向量化失败',
        details: error.message
      });
    }
  }

  /**
   * 计算相似度
   */
  async similarity(req, res) {
    try {
      const { vector1, vector2, vectors } = req.body;

      if (!vector1) {
        return res.status(400).json({
          success: false,
          error: '请提供vector1参数'
        });
      }

      if (!vector2 && !vectors) {
        return res.status(400).json({
          success: false,
          error: '请提供vector2或vectors参数'
        });
      }

      let similarities;
      if (vector2) {
        // 计算两个向量的相似度
        similarities = vectorService.cosineSimilarity(vector1, vector2);
      } else {
        // 批量计算相似度
        similarities = vectorService.batchCosineSimilarity(vector1, vectors);
      }

      res.json({
        success: true,
        data: {
          similarities: Array.isArray(similarities) ? similarities : [similarities],
          count: Array.isArray(similarities) ? similarities.length : 1
        }
      });
    } catch (error) {
      console.error('计算相似度失败:', error);
      res.status(500).json({
        success: false,
        error: '计算相似度失败',
        details: error.message
      });
    }
  }

  /**
   * 获取索引统计信息
   */
  async getIndexStats(req, res) {
    try {
      const faissStats = faissService.getStats();
      const vectorStats = vectorService.getModelInfo();

      res.json({
        success: true,
        data: {
          faiss: faissStats,
          vector: vectorStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('获取索引统计失败:', error);
      res.status(500).json({
        success: false,
        error: '获取索引统计失败',
        details: error.message
      });
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(req, res) {
    try {
      // 检查各个服务的状态
      const checks = {
        vectorService: vectorService.isInitialized,
        faissService: faissService.isInitialized,
        semanticSearch: semanticSearchService.isInitialized
      };

      const allHealthy = Object.values(checks).every(status => status);

      res.status(allHealthy ? 200 : 503).json({
        success: allHealthy,
        data: {
          status: allHealthy ? 'healthy' : 'unhealthy',
          services: checks,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('健康检查失败:', error);
      res.status(503).json({
        success: false,
        error: '健康检查失败',
        details: error.message
      });
    }
  }

  /**
   * 初始化向量服务
   */
  async initialize(req, res) {
    try {
      await semanticSearchService.initialize();

      res.json({
        success: true,
        message: '向量服务初始化完成',
        data: semanticSearchService.getStats()
      });
    } catch (error) {
      console.error('初始化向量服务失败:', error);
      res.status(500).json({
        success: false,
        error: '初始化向量服务失败',
        details: error.message
      });
    }
  }
}

module.exports = new SearchController();
