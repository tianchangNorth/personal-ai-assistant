# 企业微信RAG智能问答机器人

基于RAG（检索增强生成）技术的企业微信智能问答机器人，支持企业规章制度文档智能问答。

## 🚀 功能特性

- 📄 多格式文档支持（PDF、Word、Markdown）
- 🔍 智能语义检索（基于BGE中文向量模型）
- 🤖 本地LLM推理（支持Qwen等开源模型）
- 💬 企业微信无缝集成
- 🛡️ 数据安全可控（本地部署）
- 📊 Web管理界面

## 📁 项目结构

```
wecombot/
├── src/                    # 后端源码
│   ├── app.js             # 应用入口
│   ├── config/            # 配置文件
│   ├── controllers/       # 控制器
│   ├── services/          # 业务逻辑
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
│   └── database/          # SQLite数据库
├── models/                # AI模型文件
├── uploads/               # 文件上传目录
├── logs/                  # 日志文件
├── tests/                 # 测试用例
├── docker/                # Docker配置
└── docs/                  # 项目文档
```

## 🛠️ 技术栈

**后端**:
- Node.js + Express
- SQLite数据库
- FAISS向量检索
- BGE中文向量模型
- llama.cpp + Qwen模型

**前端**:
- Vue.js 3
- Element Plus
- Vite构建工具

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

4. 初始化数据库
```bash
npm run init:db
```

5. 启动服务
```bash
npm run dev
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
