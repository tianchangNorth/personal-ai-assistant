const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const config = require('./config');
const database = require('./models/database');

// 导入路由
const documentRoutes = require('./routes/documents');
const searchRoutes = require('./routes/search');
const docsRoutes = require('./routes/docs');
const qaRoutes = require('./routes/qa');

class App {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * 设置中间件
   */
  setupMiddleware() {
    // 安全中间件
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          scriptSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "http://localhost:3000", "https://localhost:3000"]
        }
      }
    }));
    
    // CORS配置
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' 
        ? ['https://your-domain.com'] 
        : ['http://localhost:3000', 'http://localhost:8080'],
      credentials: true
    }));

    // 日志中间件
    this.app.use(morgan(config.server.env === 'production' ? 'combined' : 'dev'));

    // 解析JSON和URL编码的请求体
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 静态文件服务
    this.app.use('/uploads', express.static(config.upload.dir));
    this.app.use(express.static(path.join(__dirname, '../public')));
    
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: process.env.npm_package_version || '1.0.0',
        environment: config.server.env
      });
    });
  }

  /**
   * 设置路由
   */
  setupRoutes() {
    // API路由
    this.app.use('/api/documents', documentRoutes);
    this.app.use('/api/search', searchRoutes);
    this.app.use('/api/docs', docsRoutes);
    this.app.use('/api/qa', qaRoutes);

    // 根路径 - 返回前端页面
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../public/index.html'));
    });

    // API文档路由（简单版本）
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'RAG API Documentation',
        version: '1.0.0',
        endpoints: {
          documents: {
            'POST /api/documents/upload': '上传文档',
            'GET /api/documents': '获取文档列表',
            'GET /api/documents/search': '搜索文档',
            'GET /api/documents/statistics': '获取统计信息',
            'GET /api/documents/:id': '获取文档详情',
            'GET /api/documents/:id/chunks/:chunkId': '获取文档块内容',
            'POST /api/documents/:id/reprocess': '重新处理文档',
            'DELETE /api/documents/:id': '删除文档'
          },
          search: {
            'POST /api/search/semantic': '语义搜索',
            'POST /api/search/build-index': '构建向量索引',
            'POST /api/search/rebuild-index': '重建向量索引',
            'GET /api/search/status': '获取向量服务状态',
            'POST /api/search/vectorize': '文本向量化',
            'POST /api/search/similarity': '计算向量相似度',
            'GET /api/search/index-stats': '获取索引统计信息',
            'GET /api/search/health': '向量服务健康检查',
            'POST /api/search/initialize': '初始化向量服务'
          }
        }
      });
    });

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: '接口不存在',
        path: req.originalUrl,
        method: req.method
      });
    });
  }

  /**
   * 设置错误处理
   */
  setupErrorHandling() {
    // 全局错误处理中间件
    this.app.use((error, req, res, next) => {
      console.error('全局错误:', error);

      // 开发环境返回详细错误信息
      const isDev = config.server.env === 'development';
      
      res.status(error.status || 500).json({
        success: false,
        error: error.message || '服务器内部错误',
        ...(isDev && { 
          stack: error.stack,
          details: error 
        })
      });
    });

    // 未捕获的Promise拒绝
    process.on('unhandledRejection', (reason, promise) => {
      console.error('未处理的Promise拒绝:', reason);
      // 在生产环境中，可能需要优雅地关闭服务器
    });

    // 未捕获的异常
    process.on('uncaughtException', (error) => {
      console.error('未捕获的异常:', error);
      // 在生产环境中，应该优雅地关闭服务器
      process.exit(1);
    });
  }

  /**
   * 初始化应用
   */
  async initialize() {
    try {
      // 检查向量模型状态
      await this.checkVectorModel();

      // 初始化数据库
      await database.initialize();
      console.log('数据库初始化完成');

      // 确保必要的目录存在
      const fs = require('fs').promises;
      await fs.mkdir(config.upload.dir, { recursive: true });
      await fs.mkdir(path.dirname(config.logging.file), { recursive: true });
      await fs.mkdir(path.join(__dirname, '../models/cache'), { recursive: true });

      console.log('应用初始化完成');
    } catch (error) {
      console.error('应用初始化失败:', error);
      throw error;
    }
  }

  /**
   * 检查向量模型状态
   */
  async checkVectorModel() {
    try {
      const { pipeline } = require('@xenova/transformers');
      const modelName = 'Xenova/bge-small-zh-v1.5';
      const cacheDir = path.join(__dirname, '../models/cache');

      console.log('🔍 检查BGE向量模型状态...');

      // 尝试加载本地模型
      await pipeline('feature-extraction', modelName, {
        cache_dir: cacheDir,
        local_files_only: true
      });

      console.log('✅ BGE向量模型已就绪，将使用真实语义搜索');
    } catch (error) {
      console.log('⚠️  BGE向量模型未找');
      console.log('💡 运行 "npm run download-model" 下载真实模型以获得更好的语义搜索效果');
      console.log('📖 详细说明请查看: 模型下载说明.md');
    }
  }

  /**
   * 启动服务器
   */
  async start() {
    try {
      await this.initialize();
      
      const server = this.app.listen(config.server.port, config.server.host, () => {
        console.log(`
🚀 个人AI助手 API Server 启动成功!
📍 地址: http://${config.server.host}:${config.server.port}
🌍 环境: ${config.server.env}
📚 API文档: http://${config.server.host}:${config.server.port}/api/docs
💚 健康检查: http://${config.server.host}:${config.server.port}/health
        `);
      });

      // 优雅关闭
      const gracefulShutdown = async (signal) => {
        console.log(`\n收到 ${signal} 信号，开始优雅关闭...`);
        
        server.close(async () => {
          console.log('HTTP服务器已关闭');
          
          try {
            await database.close();
            console.log('数据库连接已关闭');
          } catch (error) {
            console.error('关闭数据库连接失败:', error);
          }
          
          console.log('应用已优雅关闭');
          process.exit(0);
        });
      };

      process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
      process.on('SIGINT', () => gracefulShutdown('SIGINT'));

      return server;
    } catch (error) {
      console.error('启动服务器失败:', error);
      process.exit(1);
    }
  }

  /**
   * 获取Express应用实例
   */
  getApp() {
    return this.app;
  }
}

// 如果直接运行此文件，启动服务器
if (require.main === module) {
  const app = new App();
  app.start();
}

module.exports = App;
