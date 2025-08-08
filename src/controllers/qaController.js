const ragService = require('../services/ragService');
const llmService = require('../services/llmService');

/**
 * 问答控制器
 */
class QAController {
  /**
   * RAG问答
   */
  async ask(req, res) {
    try {
      const { question, topK, threshold, maxTokens, temperature, documentIds } = req.body;

      // 参数验证
      if (!question || typeof question !== 'string' || question.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '问题不能为空'
        });
      }

      if (question.length > 1000) {
        return res.status(400).json({
          success: false,
          error: '问题长度不能超过1000字符'
        });
      }

      const options = {
        topK: topK && Number.isInteger(topK) && topK > 0 ? Math.min(topK, 20) : undefined,
        threshold: threshold && typeof threshold === 'number' ? Math.max(0, Math.min(threshold, 1)) : undefined,
        maxTokens: maxTokens && Number.isInteger(maxTokens) && maxTokens > 0 ? Math.min(maxTokens, 4096) : undefined,
        temperature: temperature && typeof temperature === 'number' ? Math.max(0, Math.min(temperature, 2)) : undefined,
        documentIds: Array.isArray(documentIds) ? documentIds : undefined
      };

      console.log(`收到问答请求: "${question}"`);

      const result = await ragService.ask(question, options);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('RAG问答失败:', error);
      res.status(500).json({
        success: false,
        error: '问答处理失败',
        details: error.message
      });
    }
  }

  /**
   * 批量问答
   */
  async batchAsk(req, res) {
    try {
      const { questions, ...options } = req.body;

      // 参数验证
      if (!Array.isArray(questions) || questions.length === 0) {
        return res.status(400).json({
          success: false,
          error: '问题列表不能为空'
        });
      }

      if (questions.length > 10) {
        return res.status(400).json({
          success: false,
          error: '批量问答最多支持10个问题'
        });
      }

      for (const question of questions) {
        if (!question || typeof question !== 'string' || question.trim().length === 0) {
          return res.status(400).json({
            success: false,
            error: '所有问题都必须是非空字符串'
          });
        }
      }

      console.log(`收到批量问答请求: ${questions.length} 个问题`);

      const results = await ragService.batchAsk(questions, options);

      res.json({
        success: true,
        data: {
          questions: questions,
          results: results,
          total: results.length,
          successful: results.filter(r => !r.error).length,
          failed: results.filter(r => r.error).length
        }
      });

    } catch (error) {
      console.error('批量问答失败:', error);
      res.status(500).json({
        success: false,
        error: '批量问答处理失败',
        details: error.message
      });
    }
  }

  /**
   * 获取LLM服务状态
   */
  async getLLMStatus(req, res) {
    try {
      const status = await llmService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('获取LLM状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取LLM状态失败',
        details: error.message
      });
    }
  }

  /**
   * 获取RAG服务状态
   */
  async getRAGStatus(req, res) {
    try {
      const status = await ragService.getStatus();
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('获取RAG状态失败:', error);
      res.status(500).json({
        success: false,
        error: '获取RAG状态失败',
        details: error.message
      });
    }
  }

  /**
   * 健康检查
   */
  async healthCheck(req, res) {
    try {
      const health = await ragService.healthCheck();
      
      if (health.healthy) {
        res.json({
          success: true,
          data: health
        });
      } else {
        res.status(503).json({
          success: false,
          data: health
        });
      }
    } catch (error) {
      console.error('RAG健康检查失败:', error);
      res.status(503).json({
        success: false,
        error: '健康检查失败',
        details: error.message
      });
    }
  }

  /**
   * 直接LLM对话 (不使用RAG)
   */
  async chat(req, res) {
    try {
      const { message, maxTokens, temperature } = req.body;

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          error: '消息不能为空'
        });
      }

      const options = {
        maxTokens: maxTokens && Number.isInteger(maxTokens) && maxTokens > 0 ? Math.min(maxTokens, 4096) : undefined,
        temperature: temperature && typeof temperature === 'number' ? Math.max(0, Math.min(temperature, 2)) : undefined
      };

      console.log(`收到直接对话请求: "${message}"`);

      const result = await llmService.generateAnswer(message, options);

      res.json({
        success: true,
        data: {
          message,
          answer: result.answer,
          metadata: {
            model: result.model,
            usage: result.usage,
            responseTime: result.responseTime
          }
        }
      });

    } catch (error) {
      console.error('直接对话失败:', error);
      res.status(500).json({
        success: false,
        error: '对话处理失败',
        details: error.message
      });
    }
  }
}

module.exports = new QAController();
