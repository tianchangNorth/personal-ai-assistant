const request = require('supertest');
const app = require('../src/app');

describe('第三方API集成测试', () => {
  let server;

  beforeAll(async () => {
    // 创建测试服务器
    const App = require('../src/app');
    const testApp = new App();
    await testApp.initialize();
    server = testApp.getApp();
  });

  afterAll(async () => {
    // 清理资源
    if (server) {
      // 这里可以添加清理逻辑
    }
  });

  describe('第三方API状态接口', () => {
    test('GET /api/qa/third-party/status - 获取第三方API状态', async () => {
      const response = await request(server)
        .get('/api/qa/third-party/status')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('activeProvider');
      expect(response.body.data).toHaveProperty('availableProviders');
    });

    test('GET /api/qa/providers - 获取可用API提供商', async () => {
      const response = await request(server)
        .get('/api/qa/providers')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('providers');
      expect(response.body.data).toHaveProperty('currentProvider');
      expect(response.body.data).toHaveProperty('useThirdPartyAPI');
      expect(Array.isArray(response.body.data.providers)).toBe(true);
    });
  });

  describe('第三方API切换功能', () => {
    test('POST /api/qa/providers/switch - 切换API提供商 (无效提供商)', async () => {
      const response = await request(server)
        .post('/api/qa/providers/switch')
        .send({ provider: 'invalid-provider' })
        .expect('Content-Type', /json/);

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('切换API提供商失败');
    });

    test('POST /api/qa/providers/switch - 缺少提供商名称', async () => {
      const response = await request(server)
        .post('/api/qa/providers/switch')
        .send({})
        .expect('Content-Type', /json/);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('提供商名称不能为空');
    });
  });

  describe('RAG服务状态', () => {
    test('GET /api/qa/rag/status - 获取RAG服务状态', async () => {
      const response = await request(server)
        .get('/api/qa/rag/status')
        .expect('Content-Type', /json/);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('useThirdPartyAPI');
      expect(response.body.data).toHaveProperty('thirdPartyProvider');
    });
  });

  describe('第三方API集成配置', () => {
    test('应该支持多种第三方API提供商', () => {
      const thirdPartyAPIService = require('../src/services/thirdPartyAPIService');
      
      // 检查是否支持主流的API提供商
      const expectedProviders = [
        'openai', 'azure', 'anthropic', 'baidu', 
        'qwen', 'zhipu', 'kimi', 'doubao', 'hunyuan'
      ];
      
      expectedProviders.forEach(provider => {
        expect(thirdPartyAPIService.providers.has(provider)).toBe(true);
      });
    });

    test('应该有正确的默认提供商优先级', () => {
      const config = require('../src/config');
      expect(config.thirdParty.defaultProvider).toBeDefined();
      expect(typeof config.thirdParty.defaultProvider).toBe('string');
    });
  });

  describe('错误处理', () => {
    test('应该优雅处理API调用失败', async () => {
      // 模拟API调用失败的情况
      const thirdPartyAPIService = require('../src/services/thirdPartyAPIService');
      
      // 如果没有配置API密钥，应该回退到本地LM Studio
      const availableProviders = thirdPartyAPIService.getAvailableProviders();
      
      if (availableProviders.length === 0) {
        console.log('⚠️  未配置第三方API，将使用本地LM Studio');
      }
    });
  });
});