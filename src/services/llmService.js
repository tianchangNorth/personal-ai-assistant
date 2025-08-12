const axios = require('axios');
const config = require('../config');

/**
 * LLM服务 - 支持第三方API和本地模型的统一大语言模型服务
 */
class LLMService {
  constructor() {
    // 优先使用第三方API配置
    this.apiKey = config.llm.apiKey;
    this.baseURL = config.llm.baseURL;
    this.model = config.llm.model;
    this.maxTokens = config.llm.maxTokens;
    this.temperature = config.llm.temperature;
    this.fallbackToLocal = config.llm.fallbackToLocal;
    this.provider = config.llm.provider;
    
    // 本地模型配置（备用）
    this.localBaseURL = 'http://localhost:1234/v1';
    this.localModel = 'local-model';
    
    this.isInitialized = false;
    this.client = null;
    this.usingLocalModel = false;
  }

  /**
   * 初始化LLM服务
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // 优先尝试第三方API
      if (this.apiKey && this.baseURL) {
        console.log(`🌐 正在初始化第三方API服务 (${this.provider})...`);
        console.log(`连接地址: ${this.baseURL}`);
        console.log(`使用模型: ${this.model}`);

        // 创建HTTP客户端
        const headers = {
          'Content-Type': 'application/json'
        };

        // 智谱AI使用特殊的认证方式
        if (this.provider === 'zhipu') {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        } else {
          headers['Authorization'] = `Bearer ${this.apiKey}`;
        }

        this.client = axios.create({
          baseURL: this.baseURL,
          timeout: 60000,
          headers
        });

        // 测试第三方API连接
        await this.testThirdPartyAPI();
        this.usingLocalModel = false;
        
        this.isInitialized = true;
        console.log(`✅ 第三方API服务初始化完成 (${this.provider})`);
        return;
      }
    } catch (error) {
      console.warn(`⚠️  第三方API初始化失败: ${error.message}`);
      
      // 如果配置了回退到本地模型
      if (this.fallbackToLocal) {
        console.log('🔄 尝试回退到本地模型...');
        try {
          await this.initializeLocalModel();
          return;
        } catch (localError) {
          console.error('❌ 本地模型也初始化失败:', localError.message);
        }
      }
      
      throw new Error(`第三方API初始化失败且无法回退: ${error.message}`);
    }

    // 如果没有配置第三方API，直接使用本地模型
    if (!this.apiKey || !this.baseURL) {
      console.log('🏠 未配置第三方API，使用本地模型...');
      await this.initializeLocalModel();
    }
  }

  /**
   * 初始化本地模型
   */
  async initializeLocalModel() {
    console.log('正在初始化本地LM Studio服务...');
    console.log(`连接地址: ${this.localBaseURL}`);

    // 创建HTTP客户端
    this.client = axios.create({
      baseURL: this.localBaseURL,
      timeout: 60000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 测试连接并获取模型
    await this.detectLocalModel();

    this.usingLocalModel = true;
    this.isInitialized = true;
    console.log('✅ 本地LM Studio服务初始化完成');
  }

  /**
   * 测试第三方API连接
   */
  async testThirdPartyAPI() {
    try {
      // 根据不同供应商进行测试
      if (this.provider === 'openai' || this.provider === 'kimi') {
        // 这些供应商支持 /models 端点
        const response = await this.client.get('/models');
        console.log(`✅ ${this.provider} API连接测试成功`);
      } else if (this.provider === 'zhipu') {
        // 智谱AI直接测试聊天功能
        await this.testChatCompletion();
      } else {
        // 其他供应商，直接测试聊天功能
        await this.testChatCompletion();
      }
    } catch (error) {
      console.error(`❌ ${this.provider} API连接测试失败:`, error.message);
      throw error;
    }
  }

  /**
   * 测试聊天完成功能
   */
  async testChatCompletion() {
    const testData = {
      model: this.model,
      messages: [{ role: 'user', content: '测试' }],
      max_tokens: 10
    };

    try {
      const response = await this.client.post('/chat/completions', testData);
      console.log('✅ 聊天完成功能测试成功');
      
      // 如果是智谱AI，记录一些额外信息
      if (this.provider === 'zhipu') {
        console.log(`📝 智谱AI响应状态: ${response.status}`);
        if (response.data?.usage) {
          console.log(`📊 测试请求Token使用: ${JSON.stringify(response.data.usage)}`);
        }
      }
    } catch (error) {
      if (error.response) {
        console.error(`❌ API错误 (${error.response.status}):`, error.response.data);
        throw new Error(`API调用失败 (${error.response.status}): ${error.response.data?.error?.message || error.message}`);
      } else {
        throw new Error(`聊天完成功能测试失败: ${error.message}`);
      }
    }
  }

  /**
   * 检测本地可用模型
   */
  async detectLocalModel() {
    try {
      console.log('🔍 检测LM Studio中的模型...');

      const response = await this.client.get('/models');
      const models = response.data.data || [];

      if (models.length === 0) {
        throw new Error('LM Studio中没有加载任何模型，请先在LM Studio中加载一个模型');
      }

      // 使用第一个可用模型
      this.localModel = models[0].id;

      console.log(`✅ 发现 ${models.length} 个可用模型:`);
      models.forEach((model, index) => {
        const marker = index === 0 ? '👉' : '  ';
        console.log(`${marker} ${model.id}`);
      });
      console.log(`📝 使用模型: ${this.localModel}`);

    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('无法连接到LM Studio，请确保：\n1. LM Studio已启动\n2. 已加载一个模型\n3. 服务器正在运行 (默认端口1234)');
      }
      throw error;
    }
  }

  /**
   * 生成回答
   * @param {string} prompt - 提示词
   * @param {Object} options - 生成选项
   * @returns {Promise<Object>} 生成结果
   */
  async generateAnswer(prompt, options = {}) {
    await this.initialize();

    try {
      const currentModel = this.usingLocalModel ? this.localModel : this.model;
      const requestData = {
        model: currentModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        stream: false
      };

      // 为不同供应商调整请求格式
      if (this.provider === 'anthropic') {
        // Anthropic 使用不同的格式
        requestData.max_tokens = requestData.max_tokens || 1000;
      } else if (this.provider === 'baidu') {
        // 百度文心一言格式调整
        requestData.messages = [{
          role: 'user',
          content: prompt
        }];
      }

      const serviceType = this.usingLocalModel ? '本地模型' : this.provider;
      console.log(`🤖 正在生成回答... (${serviceType}: ${currentModel})`);
      const startTime = Date.now();

      const response = await this.client.post('/chat/completions', requestData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error(`${serviceType}返回了空响应`);
      }

      const answer = response.data.choices[0].message.content;
      const usage = response.data.usage || {};

      console.log(`✅ 回答生成完成 (${responseTime}ms)`);
      console.log(`📊 Token使用: 输入${usage.prompt_tokens || 0}, 输出${usage.completion_tokens || 0}`);

      return {
        answer: answer.trim(),
        usage,
        responseTime,
        model: currentModel,
        provider: this.usingLocalModel ? 'local' : this.provider
      };

    } catch (error) {
      console.error('❌ 回答生成失败:', error.message);

      if (error.response?.data) {
        console.error('API错误详情:', error.response.data);
      }

      // 如果是第三方API失败且配置了回退，尝试本地模型
      if (!this.usingLocalModel && this.fallbackToLocal) {
        console.log('🔄 第三方API失败，尝试回退到本地模型...');
        try {
          this.usingLocalModel = true;
          await this.initializeLocalModel();
          return await this.generateAnswer(prompt, options);
        } catch (fallbackError) {
          console.error('❌ 回退到本地模型也失败:', fallbackError.message);
        }
      }

      throw new Error(`回答生成失败: ${error.message}`);
    }
  }

  /**
   * 流式生成回答
   * @param {string} prompt - 提示词
   * @param {Function} onChunk - 接收数据块的回调函数
   * @param {Object} options - 生成选项
   */
  async generateAnswerStream(prompt, onChunk, options = {}) {
    await this.initialize();

    try {
      const currentModel = this.usingLocalModel ? this.localModel : this.model;
      const requestData = {
        model: options.model || currentModel,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        stream: true
      };

      const serviceType = this.usingLocalModel ? '本地模型' : this.provider;
      console.log(`🌊 开始流式生成回答... (${serviceType}: ${requestData.model})`);

      const response = await this.client.post('/chat/completions', requestData, {
        responseType: 'stream'
      });

      let fullAnswer = '';
      
      response.data.on('data', (chunk) => {
        const lines = chunk.toString().split('\n');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            if (data === '[DONE]') {
              console.log('✅ 流式生成完成');
              return;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices?.[0]?.delta?.content;
              
              if (content) {
                fullAnswer += content;
                onChunk(content, fullAnswer);
              }
            } catch (parseError) {
              // 忽略解析错误
            }
          }
        }
      });

      return new Promise((resolve, reject) => {
        response.data.on('end', () => {
          resolve({
            answer: fullAnswer,
            model: requestData.model,
            provider: this.usingLocalModel ? 'local' : this.provider
          });
        });

        response.data.on('error', (error) => {
          reject(new Error(`流式生成失败: ${error.message}`));
        });
      });

    } catch (error) {
      console.error('❌ 流式生成失败:', error.message);
      throw new Error(`流式生成失败: ${error.message}`);
    }
  }

  /**
   * 构建RAG提示词
   * @param {string} question - 用户问题
   * @param {Array} contexts - 检索到的上下文
   * @param {Object} options - 选项
   * @returns {string} 构建的提示词
   */
  buildRAGPrompt(question, contexts, options = {}) {
    const systemPrompt = options.systemPrompt || `你是一个专业的AI助手，专门回答基于提供文档的问题。请根据以下文档内容回答用户的问题。

回答要求：
1. 基于提供的文档内容进行回答
2. 如果文档中没有相关信息，请明确说明
3. 回答要准确、简洁、有条理
4. 可以适当引用文档中的具体内容`;

    let contextText = '';
    if (contexts && contexts.length > 0) {
      contextText = '参考文档：\n\n';
      contexts.forEach((context, index) => {
        contextText += `文档${index + 1}：\n${context.content}\n\n`;
      });
    }

    const prompt = `${systemPrompt}

${contextText}

用户问题：${question}

请基于上述文档内容回答用户问题：`;

    return prompt;
  }

  /**
   * 获取服务状态
   */
  async getStatus() {
    try {
      if (!this.isInitialized) {
        return {
          status: 'not_initialized',
          isInitialized: false,
          provider: this.provider,
          baseURL: this.baseURL,
          model: this.model,
          usingLocalModel: this.usingLocalModel
        };
      }

      let models = [];
      let currentBaseURL = this.usingLocalModel ? this.localBaseURL : this.baseURL;
      let currentModel = this.usingLocalModel ? this.localModel : this.model;

      // 只有本地模型支持获取模型列表
      if (this.usingLocalModel) {
        try {
          const response = await this.client.get('/models');
          models = response.data.data || [];
        } catch (error) {
          // 忽略本地模型列表获取错误
        }
      }

      return {
        status: 'running',
        isInitialized: true,
        provider: this.usingLocalModel ? 'local' : this.provider,
        baseURL: currentBaseURL,
        model: currentModel,
        availableModels: models.map(m => m.id),
        usingLocalModel: this.usingLocalModel,
        config: {
          maxTokens: this.maxTokens,
          temperature: this.temperature,
          fallbackToLocal: this.fallbackToLocal
        }
      };
    } catch (error) {
      return {
        status: 'error',
        isInitialized: this.isInitialized,
        provider: this.provider,
        error: error.message,
        baseURL: this.baseURL,
        usingLocalModel: this.usingLocalModel
      };
    }
  }

  /**
   * 清理资源
   */
  async cleanup() {
    this.client = null;
    this.isInitialized = false;
    console.log('LLM服务资源已清理');
  }
}

module.exports = new LLMService();
