module.exports = {
  // 测试环境
  testEnvironment: 'node',

  // 测试文件匹配模式
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js'
  ],

  // 忽略的文件和目录
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/'
  ],

  // 转换忽略模式 - 允许转换某些ES模块
  transformIgnorePatterns: [
    'node_modules/(?!(@xenova/transformers)/)'
  ],

  // 覆盖率收集
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/app.js', // 排除应用入口文件
    '!src/config/**',
    '!**/node_modules/**',
    '!**/tests/**'
  ],

  // 覆盖率报告格式
  coverageReporters: [
    'text',
    'lcov',
    'html'
  ],

  // 覆盖率输出目录
  coverageDirectory: 'coverage',

  // 覆盖率阈值
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },

  // 设置超时时间
  testTimeout: 30000,

  // 测试前的设置
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],

  // 模块路径映射
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^../services/vectorService$': '<rootDir>/tests/__mocks__/vectorService.js',
    '^../services/faissService$': '<rootDir>/tests/__mocks__/faissService.js'
  },

  // 详细输出
  verbose: true,

  // 在测试失败时显示错误详情
  errorOnDeprecated: true,

  // 清除模拟调用和实例
  clearMocks: true,

  // 每次测试后恢复模拟状态
  restoreMocks: true
};
