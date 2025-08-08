const axios = require('axios');

/**
 * LLM服务 - 基于LM Studio的本地大语言模型服务
 */
class LLMService {
  constructor() {
    this.baseURL = 'http://localhost:1234/v1'; // LM Studio默认地址
    this.model = 'local-model'; // 将自动检测可用模型
    this.maxTokens = 2048;
    this.temperature = 0.7;
    this.isInitialized = false;
    this.client = null;
  }

  /**
   * 初始化LLM服务
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log('正在初始化LM Studio服务...');
      console.log(`连接地址: ${this.baseURL}`);

      // 创建HTTP客户端
      this.client = axios.create({
        baseURL: this.baseURL,
        timeout: 60000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // 测试连接并获取模型
      await this.detectModel();

      this.isInitialized = true;
      console.log('✅ LM Studio服务初始化完成');
    } catch (error) {
      console.error('❌ LM Studio服务初始化失败:', error.message);
      throw new Error(`LM Studio服务初始化失败: ${error.message}`);
    }
  }

  /**
   * 检测可用模型
   */
  async detectModel() {
    try {
      console.log('🔍 检测LM Studio中的模型...');

      const response = await this.client.get('/models');
      const models = response.data.data || [];

      if (models.length === 0) {
        throw new Error('LM Studio中没有加载任何模型，请先在LM Studio中加载一个模型');
      }

      // 使用第一个可用模型
      this.model = models[0].id;

      console.log(`✅ 发现 ${models.length} 个可用模型:`);
      models.forEach((model, index) => {
        const marker = index === 0 ? '👉' : '  ';
        console.log(`${marker} ${model.id}`);
      });
      console.log(`📝 使用模型: ${this.model}`);

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
      const requestData = {
        model: this.model,
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

      console.log(`🤖 正在生成回答... (模型: ${this.model})`);
      const startTime = Date.now();

      const response = await this.client.post('/chat/completions', requestData);

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('LM Studio返回了空响应');
      }

      const answer = response.data.choices[0].message.content;
      const usage = response.data.usage || {};

      console.log(`✅ 回答生成完成 (${responseTime}ms)`);
      console.log(`📊 Token使用: 输入${usage.prompt_tokens || 0}, 输出${usage.completion_tokens || 0}`);

      return {
        answer: answer.trim(),
        usage,
        responseTime,
        model: this.model
      };

    } catch (error) {
      console.error('❌ 回答生成失败:', error.message);

      if (error.response?.data) {
        console.error('API错误详情:', error.response.data);
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
      const requestData = {
        model: options.model || this.model,
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

      console.log(`🌊 开始流式生成回答... (模型: ${requestData.model})`);

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
            model: requestData.model
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
          baseURL: this.baseURL,
          model: this.model
        };
      }

      const response = await this.client.get('/models');
      const models = response.data.data || [];

      return {
        status: 'running',
        isInitialized: true,
        baseURL: this.baseURL,
        model: this.model,
        availableModels: models.map(m => m.id),
        config: {
          maxTokens: this.maxTokens,
          temperature: this.temperature
        }
      };
    } catch (error) {
      return {
        status: 'error',
        isInitialized: this.isInitialized,
        error: error.message,
        baseURL: this.baseURL
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
