# 个人AI助手

基于RAG（检索增强生成）技术的个人AI助手，支持个人文档智能问答和知识管理。集成第三方API调用、文档处理、向量检索和本地LLM推理功能。

## 🚀 功能特性

- 📄 多格式文档支持（PDF、Word、Markdown）
- 🔍 智能语义检索（基于BGE中文向量模型）
- 🤖 本地LLM推理（支持Qwen等开源模型）
- 💬 智能对话交互
- 🛡️ 数据安全可控（本地部署）
- 📊 Web管理界面
- 🔌 第三方API集成（微信开发者文档等）
- 🔄 向量索引重建功能
- 🎯 增强的RAG提示词构建
- 📈 查询历史记录管理
- 🛠️ 权限配置管理

## 📁 项目结构

```
wecombot/
├── src/                    # 后端源码
│   ├── app.js             # 应用入口
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   │   ├── documentController.js
│   │   ├── qaController.js
│   │   └── searchController.js
│   ├── services/          # 业务逻辑
│   │   ├── documentParser.js    # 文档解析服务
│   │   ├── faissService.js      # FAISS向量检索服务
│   │   ├── llmService.js        # LLM推理服务
│   │   ├── ragService.js        # RAG服务
│   │   ├── semanticSearchService.js  # 语义搜索服务
│   │   ├── textSplitter.js      # 文本分割服务
│   │   ├── thirdPartyAPIService.js  # 第三方API服务
│   │   └── vectorService.js     # 向量服务
│   ├── models/            # 数据模型
│   ├── middleware/        # 中间件
│   ├── routes/            # 路由定义
│   └── utils/             # 工具函数
├── frontend/              # 前端管理界面
│   ├── src/               # Vue.js源码
│   ├── public/            # 静态资源
│   └── dist/              # 构建输出
├── data/                  # 数据存储
│   ├── documents/         # 文档存储
│   ├── vectors/           # 向量索引
│   ├── database/          # SQLite数据库
│   └── metadata.json      # 元数据
├── models/                # AI模型文件
│   └── cache/             # 模型缓存
├── uploads/               # 文件上传目录
├── logs/                  # 日志文件
├── tests/                 # 测试用例
├── scripts/               # 脚本文件
├── docker/                # Docker配置
└── docs/                  # 项目文档
```

## 🛠️ 技术栈

**后端**:
- Node.js + Express
- SQLite数据库
- FAISS向量检索
- BGE中文向量模型 (@xenova/transformers)
- llama.cpp + Qwen模型
- 第三方API集成 (axios)
- 文档解析 (pdf-parse, mammoth, markdown-it)
- 日志管理 (winston)
- 数据验证 (joi)
- 安全中间件 (helmet, cors)

**前端**:
- Vue.js 3
- Element Plus
- Vite构建工具

**测试**:
- Jest测试框架
- Supertest API测试
- 代码覆盖率报告

## 📦 安装部署

### 环境要求
- Node.js >= 16.0.0
- Python >= 3.8（用于向量模型）
- 内存 >= 8GB
- 磁盘空间 >= 10GB

### 快速开始

1. 克隆项目
```bash
git clone <repository-url>
cd wecombot
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，填入相应配置
```

4. 下载AI模型
```bash
# 下载基础模型
npm run download-model-simple

# 或下载完整模型
npm run download-model
```

5. 初始化数据库
```bash
npm run init:db
```

6. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 模型管理

```bash
# 检查模型状态
npm run check-all-models

# 下载备份模型
npm run download-backup

# 一键安装
npm run setup
```

## 📖 API文档

### 文档处理接口

- `POST /api/documents/upload` - 上传文档
- `GET /api/documents` - 获取文档列表
- `DELETE /api/documents/:id` - 删除文档

### 问答接口

- `POST /api/query` - 智能问答
- `GET /api/query/history` - 查询历史

## 🧪 测试

```bash
# 运行所有测试
npm test

# 运行测试并监听变化
npm run test:watch
```

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📞 联系我们

如有问题，请联系开发团队。
