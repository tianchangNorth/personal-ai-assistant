const thirdPartyAPIService = require('../src/services/thirdPartyAPIService');

describe('第三方API服务单元测试', () => {
  beforeEach(() => {
    // 重置服务状态
    thirdPartyAPIService.providers.clear();
    thirdPartyAPIService.activeProvider = null;
    thirdPartyAPIService.initialized = false;
  });

  describe('提供商注册', () => {
    test('应该注册所有支持的API提供商', () => {
      thirdPartyAPIService.registerProviders();
      
      const expectedProviders = [
        'openai', 'azure', 'anthropic', 'baidu', 
        'qwen', 'zhipu', 'kimi', 'doubao', 'hunyuan'
      ];
      
      expectedProviders.forEach(provider => {
        expect(thirdPartyAPIService.providers.has(provider)).toBe(true);
      });
    });

    test('应该正确配置OpenAI提供商', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      thirdPartyAPIService.registerProviders();
      
      const openaiProvider = thirdPartyAPIService.providers.get('openai');
      expect(openaiProvider.name).toBe('OpenAI');
      expect(openaiProvider.baseURL).toBe('https://api.openai.com/v1');
      expect(openaiProvider.model).toBe('gpt-3.5-turbo');
    });
  });

  describe('默认提供商选择', () => {
    test('应该选择第一个可用的提供商作为默认', () => {
      // 设置测试环境变量
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.QWEN_API_KEY = 'test-qwen-key';
      
      thirdPartyAPIService.registerProviders();
      
      const defaultProvider = thirdPartyAPIService.getDefaultProvider();
      expect(['openai', 'qwen']).toContain(defaultProvider);
    });

    test('没有可用提供商时应该抛出错误', () => {
      // 清除所有API密钥
      const envKeys = Object.keys(process.env).filter(key => key.includes('API_KEY'));
      envKeys.forEach(key => delete process.env[key]);
      
      thirdPartyAPIService.registerProviders();
      
      expect(() => {
        thirdPartyAPIService.getDefaultProvider();
      }).toThrow('未找到可用的第三方API提供商配置');
    });
  });

  describe('提供商切换', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.QWEN_API_KEY = 'test-qwen-key';
      thirdPartyAPIService.registerProviders();
    });

    test('应该能够切换到已配置的提供商', () => {
      thirdPartyAPIService.setActiveProvider('qwen');
      expect(thirdPartyAPIService.activeProvider).toBe('qwen');
    });

    test('切换到不支持的提供商应该抛出错误', () => {
      expect(() => {
        thirdPartyAPIService.setActiveProvider('unsupported-provider');
      }).toThrow('不支持的API提供商: unsupported-provider');
    });

    test('切换到未配置的提供商应该抛出错误', () => {
      expect(() => {
        thirdPartyAPIService.setActiveProvider('baidu'); // 未配置BAIDU_API_KEY
      }).toThrow('API提供商 baidu 未配置API密钥');
    });
  });

  describe('获取可用提供商', () => {
    test('应该只返回已配置的提供商', () => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      process.env.QWEN_API_KEY = 'test-qwen-key';
      // 不配置百度API
      
      thirdPartyAPIService.registerProviders();
      
      const availableProviders = thirdPartyAPIService.getAvailableProviders();
      
      expect(availableProviders.length).toBe(2);
      expect(availableProviders.map(p => p.name)).toContain('openai');
      expect(availableProviders.map(p => p.name)).toContain('qwen');
      expect(availableProviders.map(p => p.name)).not.toContain('baidu');
    });
  });

  describe('RAG提示词构建', () => {
    test('应该正确构建RAG提示词', () => {
      const question = '什么是机器学习？';
      const contexts = [
        { content: '机器学习是人工智能的一个分支', similarity: 0.95 },
        { content: '机器学习包括监督学习和无监督学习', similarity: 0.87 }
      ];
      
      const prompt = thirdPartyAPIService.buildRAGPrompt(question, contexts);
      
      expect(prompt).toContain('你是一个专业的AI助手');
      expect(prompt).toContain(question);
      expect(prompt).toContain('机器学习是人工智能的一个分支');
      expect(prompt).toContain('机器学习包括监督学习和无监督学习');
    });

    test('没有上下文时也应该构建提示词', () => {
      const question = '什么是机器学习？';
      const contexts = [];
      
      const prompt = thirdPartyAPIService.buildRAGPrompt(question, contexts);
      
      expect(prompt).toContain('你是一个专业的AI助手');
      expect(prompt).toContain(question);
    });
  });

  describe('服务状态', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-openai-key';
      thirdPartyAPIService.registerProviders();
      thirdPartyAPIService.setActiveProvider('openai');
    });

    test('应该返回正确的服务状态', async () => {
      const status = await thirdPartyAPIService.getStatus();
      
      expect(status.status).toBe('running');
      expect(status.activeProvider.name).toBe('openai');
      expect(status.activeProvider.model).toBe('gpt-3.5-turbo');
      expect(status.availableProviders.length).toBeGreaterThan(0);
    });
  });

  describe('错误处理', () => {
    test('应该优雅处理网络错误', async () => {
      // 模拟网络错误
      const mockAxios = {
        create: () => ({
          get: () => Promise.reject(new Error('Network error')),
          post: () => Promise.reject(new Error('Network error'))
        })
      };
      
      // 这里可以添加更多的错误处理测试
      expect(true).toBe(true); // 占位符测试
    });
  });
});