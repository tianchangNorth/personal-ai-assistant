# 个人AI助手

基于RAG（检索增强生成）技术的个人AI助手，支持个人文档智能问答和知识管理。集成第三方API调用、文档处理、向量检索和本地LLM推理功能。

## 🚀 功能特性

- 📄 多格式文档支持（PDF、Word、Markdown）
- 🔍 智能语义检索（基于BGE中文向量模型 + FAISS）
- 🤖 本地LLM推理（支持Qwen等开源模型）
- 💬 智能对话交互
- 🛡️ 数据安全可控（本地部署）
- 📊 Web管理界面
- 🔌 第三方API集成（微信开发者文档等）
- 🔄 向量索引重建功能
- 🎯 增强的RAG提示词构建
- 📈 查询历史记录管理
- 🛠️ 权限配置管理
- 🔧 **自定义向量模型支持**（7+种推荐模型，一键切换）
- ⚡ **高性能FAISS向量搜索**（0.08ms搜索时间，支持大规模文档）

## 📁 项目结构

```
personal-ai-assistant/
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
├── data/                  # 数据存储
│   ├── documents/         # 文档存储
│   ├── vectors/           # 向量索引
│   ├── database/          # SQLite数据库
│   └── metadata.json      # 元数据
├── models/                # AI模型文件
│   └── cache/             # 模型缓存
├── uploads/               # 文件上传目录
├── logs/                  # 日志文件
├── scripts/               # 脚本文件
└── docs/                  # 项目文档
```

## 🛠️ 技术栈

**后端**:
- Node.js + Express
- SQLite数据库
- **可扩展向量模型**（支持Transformers.js兼容模型）
- BGE中文向量模型 (@xenova/transformers)
- **FAISS高性能向量搜索** (faiss-node)
- llama.cpp + Qwen模型
- 第三方API集成 (axios)
- 文档解析 (pdf-parse, mammoth, markdown-it)
- 日志管理 (winston)
- 数据验证 (joi)
- 安全中间件 (helmet, cors)

## 📦 安装部署

### 环境要求
- Node.js >= 16.0.0
- Python >= 3.8（用于向量模型）
- 内存 >= 8GB
- 磁盘空间 >= 10GB

### 快速开始

1. 克隆项目
```bash
git clone https://github.com/tianchangNorth/personal-ai-assistant
cd personal-ai-assistant
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

4. 下载向量模型
```bash
# 下载模型
npm run download-model
```

5. 启动服务
```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 模型管理

```bash
# 查看所有可用模型
npm run custom-model list

# 下载默认模型
npm run download-model

# 下载指定模型
npm run custom-model download <模型名称>

# 检查默认模型状态
npm run check-model

# 设置为默认模型
npm run custom-model set-default <模型名称>

# 一键安装
npm run setup
```

## 🎛️ 自定义向量模型

### 支持的模型
系统支持多种Transformers.js兼容的向量模型，包括：

| 模型名称 | 描述 | 维度 | 大小 | 语言 |
|---------|------|------|------|------|
| `Xenova/bge-small-zh-v1.5` | BGE中文小型版（默认） | 3072 | ~130MB | 中文 |
| `Xenova/bge-base-zh-v1.5` | BGE中文基础版 | 768 | ~400MB | 中文 |
| `Xenova/bge-large-zh-v1.5` | BGE中文大型版 | 1024 | ~1.2GB | 中文 |
| `Xenova/all-MiniLM-L6-v2` | 多语言轻量模型 | 384 | ~25MB | 多语言 |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 多语言句子相似度 | 384 | ~100MB | 多语言 |
| `Xenova/e5-small-v2` | E5英文小型版 | 384 | ~35MB | 英文 |
| `Xenova/e5-base-v2` | E5英文基础版 | 768 | ~110MB | 英文 |

### 模型管理命令

```bash
# 查看所有可用模型
npm run custom-model list

# 下载指定模型
npm run custom-model download Xenova/bge-base-zh-v1.5

# 设置为默认模型
npm run custom-model set-default Xenova/bge-base-zh-v1.5

# 检查模型状态
npm run custom-model check Xenova/bge-base-zh-v1.5

# 自动设置默认模型（单个模型时）
npm run custom-model auto-set

# 显示帮助信息
npm run custom-model help
```

### 模型选择建议

- **中文场景**: `Xenova/bge-small-zh-v1.5` → `Xenova/bge-base-zh-v1.5` → `Xenova/bge-large-zh-v1.5`
- **多语言场景**: `Xenova/all-MiniLM-L6-v2` 或 `Xenova/paraphrase-multilingual-MiniLM-L12-v2`
- **英文场景**: `Xenova/e5-small-v2` 或 `Xenova/e5-base-v2`

**注意**: 切换模型后需要重建向量索引，系统会自动检测模型维度。当系统中只有一个向量模型时，系统会自动将其设置为默认模型。

## 🗄️ 向量数据库管理

### 支持的向量数据库

- **FAISS**: 高性能向量搜索（默认，0.08ms搜索时间）
- **Memory**: 内存存储（轻量级，开发环境）
- **Redis**: 分布式内存数据库
- **PostgreSQL + pgvector**: 关系型向量数据库

### 数据库管理命令

```bash
# 列出支持的数据库
npm run vector-db list

# 切换数据库
npm run vector-db switch redis

# 查看当前数据库信息
npm run vector-db info

# 测试数据库连接
npm run vector-db test postgres
```

### 配置示例

```bash
# 使用Redis作为向量数据库
export VECTOR_DB_TYPE=redis
export REDIS_URL=redis://localhost:6379

# 使用PostgreSQL
export VECTOR_DB_TYPE=postgres
export POSTGRES_URL=postgresql://localhost:5432/vectordb
```

## 📖 API文档

详细的API接口文档请参考：[API文档](docs/API_DOCUMENTATION.md)

主要接口包括：
- 文档处理：上传、列表、删除
- 智能问答：查询、历史记录
- 向量搜索：语义检索、相似度匹配

## 📄 许可证

MIT License

## 🤝 贡献指南

欢迎提交Issue和Pull Request！

## 📚 用户手册

详细的使用说明请参考：[用户手册](docs/USER_MANUAL.md)

## 📞 联系我们

如有问题，请联系开发团队。
