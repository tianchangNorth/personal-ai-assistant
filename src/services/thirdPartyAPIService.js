const axios = require('axios');
const crypto = require('crypto');
require('dotenv').config();

/**
 * 第三方API服务管理器
 * 支持多种LLM服务提供商的统一接口
 */
class ThirdPartyAPIService {
  constructor() {
    this.providers = new Map();
    this.activeProvider = null;
    this.initialized = false;
  }

  /**
   * 初始化第三方API服务
   */
  async initialize() {
    if (this.initialized) return;

    try {
      // 注册支持的API提供商
      await this.registerProviders();
      
      // 设置默认活跃提供商（如果有可用的）
      try {
        this.activeProvider = this.getDefaultProvider();
      } catch (error) {
        console.log('⚠️  未找到可用的第三方API提供商，但服务已初始化');
        this.activeProvider = null;
      }
      
      this.initialized = true;
      console.log('✅ 第三方API服务初始化完成');
    } catch (error) {
      console.error('❌ 第三方API服务初始化失败:', error.message);
      throw error;
    }
  }

  /**
   * 注册支持的API提供商
   */
  async registerProviders() {
    // OpenAI
    this.providers.set('openai', {
      name: 'OpenAI',
      baseURL: process.env.OPENAI_API_BASE_URL || 'https://api.openai.com/v1',
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.OPENAI_TEMPERATURE) || 0.7,
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // Azure OpenAI
    this.providers.set('azure', {
      name: 'Azure OpenAI',
      baseURL: process.env.AZURE_OPENAI_ENDPOINT,
      apiKey: process.env.AZURE_OPENAI_API_KEY,
      model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      maxTokens: parseInt(process.env.AZURE_OPENAI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.AZURE_OPENAI_TEMPERATURE) || 0.7,
      headers: {
        'api-key': process.env.AZURE_OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      isAzure: true
    });

    // Anthropic Claude
    this.providers.set('anthropic', {
      name: 'Anthropic Claude',
      baseURL: process.env.ANTHROPIC_API_BASE_URL || 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
      maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE) || 0.7,
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01'
      }
    });

    // 百度文心一言
    this.providers.set('baidu', {
      name: '百度文心一言',
      baseURL: process.env.BAIDU_API_BASE_URL || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat',
      apiKey: process.env.BAIDU_API_KEY,
      secretKey: process.env.BAIDU_SECRET_KEY,
      model: process.env.BAIDU_MODEL || 'ernie-speed-128k',
      maxTokens: parseInt(process.env.BAIDU_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.BAIDU_TEMPERATURE) || 0.7,
      headers: {
        'Content-Type': 'application/json'
      },
      needAccessToken: true
    });

    // 阿里云通义千问
    this.providers.set('qwen', {
      name: '阿里云通义千问',
      baseURL: process.env.QWEN_API_BASE_URL || 'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      apiKey: process.env.QWEN_API_KEY,
      model: process.env.QWEN_MODEL || 'qwen-turbo',
      maxTokens: parseInt(process.env.QWEN_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.QWEN_TEMPERATURE) || 0.7,
      headers: {
        'Authorization': `Bearer ${process.env.QWEN_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 智谱AI GLM
    this.providers.set('zhipu', {
      name: '智谱AI GLM',
      baseURL: process.env.ZHIPU_API_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4',
      apiKey: process.env.ZHIPU_API_KEY,
      model: process.env.ZHIPU_MODEL || 'glm-4-flash',
      maxTokens: parseInt(process.env.ZHIPU_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.ZHIPU_TEMPERATURE) || 0.7,
      headers: {
        'Authorization': `Bearer ${process.env.ZHIPU_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 月之暗面 Kimi
    this.providers.set('kimi', {
      name: '月之暗面 Kimi',
      baseURL: process.env.KIMI_API_BASE_URL || 'https://api.moonshot.cn/v1/chat/completions',
      apiKey: process.env.KIMI_API_KEY,
      model: process.env.KIMI_MODEL || 'moonshot-v1-8k',
      maxTokens: parseInt(process.env.KIMI_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.KIMI_TEMPERATURE) || 0.7,
      headers: {
        'Authorization': `Bearer ${process.env.KIMI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 字节跳动豆包
    this.providers.set('doubao', {
      name: '字节跳动豆包',
      baseURL: process.env.DOUBAO_API_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions',
      apiKey: process.env.DOUBAO_API_KEY,
      model: process.env.DOUBAO_MODEL || 'doubao-pro-4k',
      maxTokens: parseInt(process.env.DOUBAO_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.DOUBAO_TEMPERATURE) || 0.7,
      headers: {
        'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 腾讯混元
    this.providers.set('hunyuan', {
      name: '腾讯混元',
      baseURL: process.env.HUNYUAN_API_BASE_URL || 'https://hunyuan.tencentcloudapi.com',
      apiKey: process.env.HUNYUAN_SECRET_ID,
      secretKey: process.env.HUNYUAN_SECRET_KEY,
      model: process.env.HUNYUAN_MODEL || 'hunyuan-pro',
      maxTokens: parseInt(process.env.HUNYUAN_MAX_TOKENS) || 4096,
      temperature: parseFloat(process.env.HUNYUAN_TEMPERATURE) || 0.7,
      headers: {
        'Content-Type': 'application/json'
      },
      needSignature: true
    });
  }

  /**
   * 获取默认提供商
   */
  getDefaultProvider() {
    const priority = ['openai', 'azure', 'anthropic', 'qwen', 'zhipu', 'kimi', 'baidu', 'doubao', 'hunyuan'];
    
    for (const providerName of priority) {
      const provider = this.providers.get(providerName);
      if (provider && provider.apiKey && this.isValidApiKey(provider.apiKey)) {
        console.log(`🎯 使用默认API提供商: ${provider.name}`);
        return providerName;
      }
    }
    
    throw new Error('未找到可用的第三方API提供商配置');
  }

  /**
   * 检查API密钥是否有效（不是占位符）
   */
  isValidApiKey(apiKey) {
    if (!apiKey || typeof apiKey !== 'string') {
      return false;
    }
    
    // 检查是否是常见的占位符模式
    const placeholderPatterns = [
      /^your_.*_here$/,        // your_api_key_here
      /^your_.*_api_key$/,     // your_openai_api_key
      /^your_.*_key$/,         // your_secret_key
      /^your_.*_id$/,          // your_secret_id
      /^placeholder_.*$/,       // placeholder_key
      /^test_.*$/,             // test_key
      /^dummy_.*$/,            // dummy_key
      /^api_.*_key$/           // api_key (过于通用)
    ];
    
    // 如果匹配任何占位符模式，则认为无效
    return !placeholderPatterns.some(pattern => pattern.test(apiKey.toLowerCase()));
  }

  /**
   * 设置活跃提供商
   */
  setActiveProvider(providerName) {
    if (!this.providers.has(providerName)) {
      throw new Error(`不支持的API提供商: ${providerName}`);
    }
    
    const provider = this.providers.get(providerName);
    if (!provider.apiKey) {
      throw new Error(`API提供商 ${providerName} 未配置API密钥`);
    }
    
    this.activeProvider = providerName;
    console.log(`🔄 切换API提供商: ${provider.name}`);
  }

  /**
   * 获取活跃提供商
   */
  getActiveProvider() {
    if (!this.activeProvider) {
      throw new Error('未设置活跃的API提供商');
    }
    return this.providers.get(this.activeProvider);
  }

  /**
   * 获取所有可用的提供商
   */
  getAvailableProviders() {
    const available = [];
    for (const [name, provider] of this.providers) {
      if (provider.apiKey && this.isValidApiKey(provider.apiKey)) {
        available.push({
          name,
          displayName: provider.name,
          model: provider.model,
          maxTokens: provider.maxTokens,
          temperature: provider.temperature
        });
      }
    }
    return available;
  }

  /**
   * 生成回答
   */
  async generateAnswer(prompt, options = {}) {
    await this.initialize();
    
    const provider = this.getActiveProvider();
    const client = this.createClient(provider);
    
    try {
      console.log(`🤖 正在通过 ${provider.name} 生成回答...`);
      const startTime = Date.now();
      
      let result;
      if (provider.needAccessToken) {
        result = await this.generateWithBaidu(client, provider, prompt, options);
      } else if (provider.needSignature) {
        result = await this.generateWithTencent(client, provider, prompt, options);
      } else if (provider.isAzure) {
        result = await this.generateWithAzure(client, provider, prompt, options);
      } else if (provider.name.includes('Anthropic')) {
        result = await this.generateWithAnthropic(client, provider, prompt, options);
      } else {
        result = await this.generateWithOpenAICompatible(client, provider, prompt, options);
      }
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`✅ ${provider.name} 回答生成完成 (${responseTime}ms)`);
      
      return {
        answer: result.answer,
        usage: result.usage || {},
        responseTime,
        provider: this.activeProvider,
        model: provider.model
      };
      
    } catch (error) {
      console.error(`❌ ${provider.name} 回答生成失败:`, error.message);
      throw new Error(`${provider.name} API调用失败: ${error.message}`);
    }
  }

  /**
   * 创建HTTP客户端
   */
  createClient(provider) {
    return axios.create({
      baseURL: provider.baseURL,
      timeout: 60000,
      headers: provider.headers
    });
  }

  /**
   * OpenAI兼容的API调用
   */
  async generateWithOpenAICompatible(client, provider, prompt, options) {
    const requestData = {
      model: options.model || provider.model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || provider.maxTokens,
      temperature: options.temperature || provider.temperature,
      stream: false
    };

    const response = await client.post('/chat/completions', requestData);
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('API返回了空响应');
    }

    return {
      answer: response.data.choices[0].message.content.trim(),
      usage: response.data.usage || {}
    };
  }

  /**
   * Azure OpenAI API调用
   */
  async generateWithAzure(client, provider, prompt, options) {
    const requestData = {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || provider.maxTokens,
      temperature: options.temperature || provider.temperature,
      stream: false
    };

    const response = await client.post(`/openai/deployments/${provider.model}/chat/completions?api-version=2023-12-01-preview`, requestData);
    
    if (!response.data?.choices?.[0]?.message?.content) {
      throw new Error('Azure OpenAI返回了空响应');
    }

    return {
      answer: response.data.choices[0].message.content.trim(),
      usage: response.data.usage || {}
    };
  }

  /**
   * Anthropic Claude API调用
   */
  async generateWithAnthropic(client, provider, prompt, options) {
    const requestData = {
      model: provider.model,
      max_tokens: options.maxTokens || provider.maxTokens,
      temperature: options.temperature || provider.temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    };

    const response = await client.post('/v1/messages', requestData);
    
    if (!response.data?.content?.[0]?.text) {
      throw new Error('Anthropic API返回了空响应');
    }

    return {
      answer: response.data.content[0].text.trim(),
      usage: response.data.usage || {}
    };
  }

  /**
   * 百度文心一言API调用
   */
  async generateWithBaidu(client, provider, prompt, options) {
    // 获取access token
    const accessToken = await this.getBaiduAccessToken(provider);
    
    const requestData = {
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.maxTokens || provider.maxTokens,
      temperature: options.temperature || provider.temperature,
      stream: false
    };

    const response = await client.post(`/chat/completions?access_token=${accessToken}`, requestData);
    
    if (!response.data?.result) {
      throw new Error('百度API返回了空响应');
    }

    return {
      answer: response.data.result.trim(),
      usage: response.data.usage || {}
    };
  }

  /**
   * 获取百度access token
   */
  async getBaiduAccessToken(provider) {
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${provider.apiKey}&client_secret=${provider.secretKey}`;
    
    const response = await axios.post(tokenUrl);
    return response.data.access_token;
  }

  /**
   * 腾讯混元API调用
   */
  async generateWithTencent(client, provider, prompt, options) {
    const timestamp = Math.floor(Date.now() / 1000);
    const payload = {
      Model: provider.model,
      Messages: [
        {
          Role: 'user',
          Content: prompt
        }
      ],
      MaxTokens: options.maxTokens || provider.maxTokens,
      Temperature: options.temperature || provider.temperature
    };

    const signature = this.generateTencentSignature(provider, timestamp, payload);
    
    const response = await client.post('', payload, {
      headers: {
        ...client.defaults.headers,
        'X-TC-Action': 'ChatCompletion',
        'X-TC-Version': '2023-09-01',
        'X-TC-Timestamp': timestamp,
        'X-TC-Signature': signature
      }
    });
    
    if (!response.data?.Response?.Choices?.[0]?.Message?.Content) {
      throw new Error('腾讯混元API返回了空响应');
    }

    return {
      answer: response.data.Response.Choices[0].Message.Content.trim(),
      usage: response.data.Response.Usage || {}
    };
  }

  /**
   * 生成腾讯混元签名
   */
  generateTencentSignature(provider, timestamp, payload) {
    const secretKey = provider.secretKey;
    const message = `POST\n/\n\nX-TC-Action:ChatCompletion\nX-TC-Timestamp:${timestamp}\nX-TC-Version:2023-09-01\n${JSON.stringify(payload)}`;
    
    return crypto.createHmac('sha256', secretKey).update(message).digest('hex');
  }

  /**
   * 构建RAG提示词
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
    await this.initialize();
    
    const provider = this.getActiveProvider();
    const availableProviders = this.getAvailableProviders();
    
    return {
      status: 'running',
      activeProvider: {
        name: this.activeProvider,
        displayName: provider.name,
        model: provider.model,
        config: {
          maxTokens: provider.maxTokens,
          temperature: provider.temperature
        }
      },
      availableProviders: availableProviders,
      totalProviders: availableProviders.length
    };
  }

  /**
   * 清理资源
   */
  async cleanup() {
    this.providers.clear();
    this.activeProvider = null;
    this.initialized = false;
    console.log('第三方API服务资源已清理');
  }
}

module.exports = new ThirdPartyAPIService();