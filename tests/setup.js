// Jest测试环境设置文件

// 设置测试环境变量
process.env.NODE_ENV = 'test';
process.env.DB_PATH = ':memory:'; // 使用内存数据库进行测试
process.env.UPLOAD_DIR = './tests/uploads';
process.env.LOG_LEVEL = 'error'; // 减少测试时的日志输出

// 全局测试超时设置
jest.setTimeout(30000);

// 全局测试前的设置
beforeAll(async () => {
  // 创建测试所需的目录
  const fs = require('fs').promises;
  const path = require('path');
  
  const testDirs = [
    './tests/uploads',
    './tests/testData',
    './tests/temp'
  ];

  for (const dir of testDirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      // 目录已存在，忽略错误
    }
  }
});

// 全局测试后的清理
afterAll(async () => {
  // 清理测试文件
  const fs = require('fs').promises;

  const testDirs = [
    './tests/uploads',
    './tests/testData',
    './tests/temp'
  ];

  for (const dir of testDirs) {
    try {
      await fs.rm(dir, { recursive: true, force: true });
    } catch (error) {
      // 忽略清理错误
    }
  }
});

// 捕获未处理的Promise拒绝
process.on('unhandledRejection', (reason, promise) => {
  console.error('测试中的未处理Promise拒绝:', reason);
});

// 捕获未处理的异常
process.on('uncaughtException', (error) => {
  console.error('测试中的未捕获异常:', error);
});

// 模拟console方法以减少测试输出
const originalConsole = { ...console };

beforeEach(() => {
  // 在测试期间静默某些console输出
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  // 保留error输出用于调试
});

afterEach(() => {
  // 恢复console方法
  Object.assign(console, originalConsole);
});
