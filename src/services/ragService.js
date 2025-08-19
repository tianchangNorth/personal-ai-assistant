const llmService = require('./llmService');
const thirdPartyAPIService = require('./thirdPartyAPIService');
const semanticSearchService = require('./semanticSearchService');
const config = require('../config');

/**
 * RAG问答服务 - 检索增强生成
 */
class RAGService {
  constructor() {
    this.isInitialized = false;
    this.defaultTopK = 5;
    this.defaultThreshold = 0.3;
    this.useThirdPartyAPI = false;
    this.thirdPartyProvider = null;
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
      
      // 检查是否使用第三方API
      await this.checkThirdPartyAPI();
      
      // 初始化依赖服务
      const initPromises = [semanticSearchService.initialize()];
      
      if (this.useThirdPartyAPI) {
        initPromises.push(thirdPartyAPIService.initialize());
      } else {
        initPromises.push(llmService.initialize());
      }
      
      await Promise.all(initPromises);
      
      this.isInitialized = true;
      console.log('✅ RAG问答服务初始化完成');
    } catch (error) {
      console.error('❌ RAG问答服务初始化失败:', error);
      throw new Error(`RAG问答服务初始化失败: ${error.message}`);
    }
  }

  /**
   * 检查是否使用第三方API
   */
  async checkThirdPartyAPI() {
    try {
      // 确保第三方API服务已初始化
      if (!thirdPartyAPIService.initialized) {
        await thirdPartyAPIService.initialize();
      }
      
      // 检查是否有可用的第三方API配置
      const availableProviders = thirdPartyAPIService.getAvailableProviders();
      
      if (availableProviders.length > 0) {
        this.useThirdPartyAPI = true;
        const defaultProvider = config.thirdParty.defaultProvider;
        
        // 尝试设置默认提供商
        try {
          thirdPartyAPIService.setActiveProvider(defaultProvider);
          this.thirdPartyProvider = defaultProvider;
          console.log(`🔗 使用第三方API提供商: ${defaultProvider}`);
        } catch (error) {
          // 如果默认提供商不可用，使用第一个可用的
          const firstAvailable = availableProviders[0].name;
          thirdPartyAPIService.setActiveProvider(firstAvailable);
          this.thirdPartyProvider = firstAvailable;
          console.log(`🔗 使用第三方API提供商: ${firstAvailable} (默认提供商 ${defaultProvider} 不可用)`);
        }
      } else {
        this.useThirdPartyAPI = false;
        console.log('🔗 未找到可用的第三方API配置，将使用本地LM Studio');
      }
    } catch (error) {
      this.useThirdPartyAPI = false;
      console.log('🔗 第三方API检查失败，将使用本地LM Studio:', error.message);
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
      let llmResult;
      
      if (this.useThirdPartyAPI) {
        llmResult = await thirdPartyAPIService.generateAnswer(prompt, {
          maxTokens: options.maxTokens,
          temperature: options.temperature
        });
      } else {
        llmResult = await llmService.generateAnswer(prompt, {
          maxTokens: options.maxTokens,
          temperature: options.temperature
        });
      }

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
          options: searchOptions,
          provider: this.useThirdPartyAPI ? this.thirdPartyProvider : 'local'
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
  let prompt = `你是一名专业AI助手，请基于文档和你的知识回答问题。

## 回答规则
1. 优先使用文档内容，保持准确。
2. 在文档基础上做总结、分析与延伸，必要时补充专业知识。
3. 当文档不足或无关时，说明情况，并基于知识提供可靠解答。
4. 回答要条理清晰，重点突出，语言简洁。
5. **重要**: 引用文档时必须使用具体的文档名称（如"项目计划书"、"技术文档"等），禁止使用"文档1"、"文档2"这样的通用引用。
`;

  if (contexts && contexts.length > 0) {
    prompt += `\n## 参考文档\n`;
    contexts.forEach((context, index) => {
      // 使用文档名称而不是编号
      const docName = context.documentName || `文档${index + 1}`;
      prompt += `### ${docName}\n`;
      prompt += `片段${context.chunkIndex + 1}\n`;
      prompt += `${context.content}\n\n`;
    });

    prompt += `## 任务\n请结合以上文档和你的知识，全面回答用户问题。\n`;
    prompt += `**重要**: 在回答中引用文档时，请使用具体的文档名称（如"${contexts[0]?.documentName || '相关文档'}"），而不是"文档1"、"文档2"这样的通用引用。\n`;
  } else {
    prompt += `\n⚠️ 未找到相关文档。\n请在回答开头说明："以下回答基于我的知识库，未在提供的文档中找到相关内容。" 并基于你的知识解答。\n`;
  }

  prompt += `\n## 用户问题\n${question}\n\n## 请开始回答`;

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
      const statusPromises = [semanticSearchService.getStatus()];
      
      if (this.useThirdPartyAPI) {
        statusPromises.push(thirdPartyAPIService.getStatus());
      } else {
        statusPromises.push(llmService.getStatus());
      }
      
      const [searchStatus, llmStatus] = await Promise.all(statusPromises);

      return {
        status: this.isInitialized ? 'running' : 'not_initialized',
        isInitialized: this.isInitialized,
        useThirdPartyAPI: this.useThirdPartyAPI,
        thirdPartyProvider: this.thirdPartyProvider,
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
        isInitialized: this.isInitialized,
        useThirdPartyAPI: this.useThirdPartyAPI,
        thirdPartyProvider: this.thirdPartyProvider
      };
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      const healthPromises = [semanticSearchService.healthCheck()];
      
      if (this.useThirdPartyAPI) {
        // 对于第三方API，健康检查就是检查状态
        healthPromises.push(Promise.resolve({ healthy: true }));
      } else {
        healthPromises.push(llmService.healthCheck());
      }
      
      const [searchHealth, llmHealth] = await Promise.all(healthPromises);

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
    const cleanupPromises = [semanticSearchService.cleanup()];
    
    if (this.useThirdPartyAPI) {
      cleanupPromises.push(thirdPartyAPIService.cleanup());
    } else {
      cleanupPromises.push(llmService.cleanup());
    }
    
    await Promise.all(cleanupPromises);
    
    this.isInitialized = false;
    console.log('RAG问答服务资源已清理');
  }

  /**
   * 切换API提供商
   */
  async switchProvider(providerName) {
    try {
      // 检查第三方API服务是否已初始化
      if (!thirdPartyAPIService.initialized) {
        await thirdPartyAPIService.initialize();
      }

      // 尝试切换到指定的提供商
      thirdPartyAPIService.setActiveProvider(providerName);
      
      // 如果成功切换，更新状态
      this.useThirdPartyAPI = true;
      this.thirdPartyProvider = providerName;
      
      console.log(`✅ 已切换到第三方API提供商: ${providerName}`);
      
      // 如果之前使用的是本地LLM，现在切换到第三方API
      if (!this.isInitialized) {
        await this.initialize();
      }
    } catch (error) {
      console.error(`❌ 切换API提供商失败:`, error.message);
      throw error;
    }
  }

  /**
   * 获取可用的API提供商
   */
  getAvailableProviders() {
    if (this.useThirdPartyAPI) {
      return thirdPartyAPIService.getAvailableProviders();
    } else {
      return [{
        name: 'local',
        displayName: '本地LM Studio',
        model: 'local-model',
        maxTokens: 2048,
        temperature: 0.7
      }];
    }
  }
}

module.exports = new RAGService();
