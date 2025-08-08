const llmService = require('./llmService');
const semanticSearchService = require('./semanticSearchService');

/**
 * RAG问答服务 - 检索增强生成
 */
class RAGService {
  constructor() {
    this.isInitialized = false;
    this.defaultTopK = 5;
    this.defaultThreshold = 0.3;
  }

  /**
   * 初始化RAG服务
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('正在初始化RAG问答服务...');
      
      // 初始化依赖服务
      await Promise.all([
        llmService.initialize(),
        semanticSearchService.initialize()
      ]);
      
      this.isInitialized = true;
      console.log('✅ RAG问答服务初始化完成');
    } catch (error) {
      console.error('❌ RAG问答服务初始化失败:', error);
      throw new Error(`RAG问答服务初始化失败: ${error.message}`);
    }
  }

  /**
   * 执行RAG问答
   * @param {string} question - 用户问题
   * @param {Object} options - 选项
   * @returns {Promise<Object>} 问答结果
   */
  async ask(question, options = {}) {
    await this.initialize();

    try {
      console.log(`🔍 RAG问答: "${question}"`);
      const startTime = Date.now();

      // 1. 语义检索相关文档
      console.log('📚 检索相关文档...');
      const searchOptions = {
        topK: options.topK || this.defaultTopK,
        threshold: options.threshold || this.defaultThreshold,
        includeContent: true,
        documentIds: options.documentIds
      };

      const searchResults = await semanticSearchService.search(question, searchOptions);

      // semanticSearchService.search直接返回结果数组
      const results = Array.isArray(searchResults) ? searchResults : [];
      console.log(`✅ 找到 ${results.length} 个相关文档片段`);

      // 2. 构建上下文
      const contexts = results.map(result => ({
        content: result.content,
        similarity: result.similarity,
        documentName: result.documentName,
        chunkIndex: result.chunkIndex
      }));

      // 3. 构建RAG提示词
      const prompt = this.buildRAGPrompt(question, contexts);
      
      // 4. 生成回答
      console.log('🤖 生成AI回答...');
      const llmResult = await llmService.generateAnswer(prompt, {
        maxTokens: options.maxTokens,
        temperature: options.temperature
      });

      const endTime = Date.now();
      const totalTime = endTime - startTime;

      console.log(`✅ RAG问答完成 (总耗时: ${totalTime}ms)`);

      return {
        question,
        answer: llmResult.answer,
        contexts: contexts,
        searchResults: results,
        metadata: {
          searchTime: null, // semanticSearchService不返回responseTime
          llmTime: llmResult.responseTime,
          totalTime,
          model: llmResult.model,
          usage: llmResult.usage,
          searchCount: results.length,
          options: searchOptions
        }
      };

    } catch (error) {
      console.error('❌ RAG问答失败:', error);
      throw new Error(`RAG问答失败: ${error.message}`);
    }
  }

  /**
   * 构建RAG提示词
   * @param {string} question - 用户问题
   * @param {Array} contexts - 检索到的上下文
   * @returns {string} 构建的提示词
   */
  buildRAGPrompt(question, contexts = []) {
    let prompt = `你是一个专业的AI助手，请根据提供的文档内容回答用户问题。

回答要求：
1. 基于提供的文档内容进行回答
2. 如果文档中没有相关信息，请明确说明
3. 回答要准确、简洁、有条理
4. 可以适当引用文档中的具体内容

`;

    if (contexts && contexts.length > 0) {
      prompt += `参考文档内容：\n\n`;
      contexts.forEach((context, index) => {
        prompt += `【文档${index + 1}】(相似度: ${context.similarity.toFixed(3)})\n`;
        prompt += `来源: ${context.documentName}\n`;
        prompt += `内容: ${context.content}\n\n`;
      });
    } else {
      prompt += `注意：没有找到相关的文档内容，请基于你的知识回答，并说明这不是基于特定文档的回答。\n\n`;
    }

    prompt += `用户问题：${question}\n\n请基于上述文档内容回答：`;

    return prompt;
  }

  /**
   * 批量问答
   * @param {Array} questions - 问题列表
   * @param {Object} options - 选项
   * @returns {Promise<Array>} 问答结果列表
   */
  async batchAsk(questions, options = {}) {
    await this.initialize();

    const results = [];
    
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      console.log(`处理问题 ${i + 1}/${questions.length}: ${question}`);
      
      try {
        const result = await this.ask(question, options);
        results.push(result);
      } catch (error) {
        console.error(`问题 ${i + 1} 处理失败:`, error.message);
        results.push({
          question,
          error: error.message,
          answer: null
        });
      }

      // 避免过快请求
      if (i < questions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * 获取服务状态
   */
  async getStatus() {
    try {
      const [llmStatus, searchStatus] = await Promise.all([
        llmService.getStatus(),
        semanticSearchService.getStatus()
      ]);

      return {
        status: this.isInitialized ? 'running' : 'not_initialized',
        isInitialized: this.isInitialized,
        services: {
          llm: llmStatus,
          search: searchStatus
        },
        config: {
          defaultTopK: this.defaultTopK,
          defaultThreshold: this.defaultThreshold
        }
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        isInitialized: this.isInitialized
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const [llmHealth, searchHealth] = await Promise.all([
        llmService.healthCheck(),
        semanticSearchService.healthCheck()
      ]);

      const isHealthy = llmHealth.healthy && searchHealth.healthy;

      return {
        healthy: isHealthy,
        services: {
          llm: llmHealth,
          search: searchHealth
        }
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message
      };
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    await Promise.all([
      llmService.cleanup(),
      semanticSearchService.cleanup()
    ]);
    
    this.isInitialized = false;
    console.log('RAG问答服务资源已清理');
  }
}

module.exports = new RAGService();
