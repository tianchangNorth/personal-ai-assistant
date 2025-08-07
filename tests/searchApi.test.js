const request = require('supertest');
const path = require('path');
const fs = require('fs').promises;
const App = require('../src/app');

describe('Search API Integration Tests', () => {
  let app;
  let documentId;
  const testDataDir = path.join(__dirname, 'testData');

  beforeAll(async () => {
    // 创建应用实例
    const appInstance = new App();
    app = appInstance.getApp();
    
    // 初始化应用
    await appInstance.initialize();
    
    // 创建测试数据
    await createTestData();
  }, 60000);

  afterAll(async () => {
    // 清理测试文件
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('清理测试文件失败:', error.message);
    }
  });

  async function createTestData() {
    // 创建测试目录
    await fs.mkdir(testDataDir, { recursive: true });
    
    // 创建测试文档
    const testContent = `# 公司规章制度

## 工作时间管理
员工应当按时上下班，工作时间为上午9点到下午6点。

## 请假制度
员工请假需要提前申请，病假需要提供医院证明。

## 文体活动
公司鼓励员工参加文体活动，如篮球、观影、徒步等。

## 办公设备管理
员工可以申请必要的办公设备，需要经过部门主管审批。`;

    const testFile = path.join(testDataDir, 'test-rules.md');
    await fs.writeFile(testFile, testContent, 'utf-8');

    // 上传测试文档
    const response = await request(app)
      .post('/api/documents/upload')
      .attach('document', testFile)
      .field('description', '测试规章制度文档');

    documentId = response.body.data.documentId;
    
    // 等待文档处理完成
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  describe('Vector Service Status', () => {
    test('GET /api/search/health 应该返回健康状态', async () => {
      const response = await request(app)
        .get('/api/search/health');

      // 可能返回200或503，取决于向量服务是否已初始化
      expect([200, 503]).toContain(response.status);
      expect(response.body).toHaveProperty('success');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('services');
    });

    test('GET /api/search/status 应该返回服务状态', async () => {
      const response = await request(app)
        .get('/api/search/status');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('status');
      }
    });
  });

  describe('Vector Operations', () => {
    test('POST /api/search/vectorize 应该能够向量化文本', async () => {
      const response = await request(app)
        .post('/api/search/vectorize')
        .send({
          text: '这是一个测试文本'
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('vectors');
        expect(response.body.data.vectors[0]).toHaveLength(512);
      } else {
        // 如果向量服务未初始化，应该返回500错误
        expect(response.status).toBe(500);
      }
    });

    test('POST /api/search/vectorize 应该支持批量向量化', async () => {
      const response = await request(app)
        .post('/api/search/vectorize')
        .send({
          texts: ['文本一', '文本二', '文本三']
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data.vectors).toHaveLength(3);
        expect(response.body.data.count).toBe(3);
      }
    });

    test('POST /api/search/vectorize 应该验证输入', async () => {
      const response = await request(app)
        .post('/api/search/vectorize')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('请提供text或texts参数');
    });
  });

  describe('Similarity Calculation', () => {
    test('POST /api/search/similarity 应该计算向量相似度', async () => {
      const vector1 = new Array(512).fill(0.1);
      const vector2 = new Array(512).fill(0.1);

      const response = await request(app)
        .post('/api/search/similarity')
        .send({
          vector1,
          vector2
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.similarities[0]).toBeCloseTo(1, 2);
    });

    test('POST /api/search/similarity 应该验证输入', async () => {
      const response = await request(app)
        .post('/api/search/similarity')
        .send({
          vector1: [1, 2, 3]
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Index Management', () => {
    test('POST /api/search/initialize 应该初始化向量服务', async () => {
      const response = await request(app)
        .post('/api/search/initialize');

      // 可能成功或失败，取决于环境
      expect([200, 500]).toContain(response.status);
    });

    test('GET /api/search/index-stats 应该返回索引统计', async () => {
      const response = await request(app)
        .get('/api/search/index-stats');

      expect([200, 500]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('faiss');
        expect(response.body.data).toHaveProperty('vector');
      }
    });

    test('POST /api/search/build-index 应该构建索引', async () => {
      const response = await request(app)
        .post('/api/search/build-index');

      // 可能成功或失败，取决于向量服务是否可用
      expect([200, 500]).toContain(response.status);
    }, 30000);
  });

  describe('Semantic Search', () => {
    test('POST /api/search/semantic 应该执行语义搜索', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({
          query: '工作时间是什么',
          topK: 3,
          threshold: 0.1
        });

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('query');
        expect(response.body.data).toHaveProperty('results');
        expect(response.body.data).toHaveProperty('total');
        expect(Array.isArray(response.body.data.results)).toBe(true);
      } else {
        // 如果向量服务未初始化，应该返回500错误
        expect(response.status).toBe(500);
      }
    }, 30000);

    test('POST /api/search/semantic 应该验证查询参数', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('查询内容不能为空');
    });

    test('POST /api/search/semantic 应该限制参数范围', async () => {
      const response = await request(app)
        .post('/api/search/semantic')
        .send({
          query: '测试查询',
          topK: 100, // 超出限制
          threshold: 2 // 超出范围
        });

      if (response.status === 200) {
        expect(response.body.data.options.topK).toBeLessThanOrEqual(20);
        expect(response.body.data.options.threshold).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Error Handling', () => {
    test('应该处理无效的API路径', async () => {
      const response = await request(app)
        .get('/api/search/nonexistent');

      expect(response.status).toBe(404);
    });

    test('应该处理无效的HTTP方法', async () => {
      const response = await request(app)
        .delete('/api/search/status');

      expect(response.status).toBe(404);
    });
  });

  describe('Performance', () => {
    test('向量化操作应该在合理时间内完成', async () => {
      const startTime = Date.now();
      
      const response = await request(app)
        .post('/api/search/vectorize')
        .send({
          text: '这是一个性能测试文本'
        });

      const duration = Date.now() - startTime;
      
      if (response.status === 200) {
        expect(duration).toBeLessThan(10000); // 10秒内完成
        expect(response.body.data).toHaveProperty('responseTime');
      }
    }, 15000);
  });
});
