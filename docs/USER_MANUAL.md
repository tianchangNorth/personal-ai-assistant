# 个人AI助手用户手册

## 📖 目录

- [快速开始](#快速开始)
- [系统要求](#系统要求)
- [安装步骤](#安装步骤)
- [功能使用](#功能使用)
  - [文档上传](#文档上传)
  - [智能问答](#智能问答)
  - [文档管理](#文档管理)
  - [向量索引管理](#向量索引管理)
- [配置说明](#配置说明)
- [故障排除](#故障排除)
- [常见问题](#常见问题)

## 🚀 快速开始

个人AI助手是一个基于RAG（检索增强生成）技术的智能问答系统，可以帮助您管理和查询个人文档知识库。

### 系统要求

- **操作系统**: Windows/Linux/macOS
- **Node.js**: >= 16.0.0
- **Python**: >= 3.8（用于向量模型）
- **内存**: >= 8GB
- **磁盘空间**: >= 10GB

## 📦 安装步骤

### 1. 克隆项目

```bash
git clone <repository-url>
cd wecombot
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
# 编辑.env文件，根据需要配置参数
```

### 4. 下载AI模型

```bash
# 下载模型
npm run download-model
```

### 5. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

### 6. 访问系统

打开浏览器访问：`http://localhost:3000`

## 🎯 功能使用

### 文档上传

1. **支持格式**：
   - PDF文档
   - Word文档（.docx）
   - Markdown文件（.md）

2. **上传步骤**：
   - 点击"上传文档"按钮
   - 选择要上传的文件
   - 系统自动解析和处理文档
   - 文档处理完成后可用于问答

3. **注意事项**：
   - 单个文件大小不超过10MB
   - 支持批量上传
   - 上传后系统会自动生成向量索引

### 智能问答

1. **提问方式**：
   - 在问答框中输入问题
   - 系统基于上传的文档内容回答
   - 支持自然语言提问

2. **回答特点**：
   - 基于文档内容的准确回答
   - 引用相关文档来源
   - 支持上下文对话

3. **使用技巧**：
   - 问题要具体明确
   - 可以追问相关细节
   - 支持多轮对话

### 文档管理

1. **查看文档列表**：
   - 显示所有已上传的文档
   - 包含文档名称、类型、上传时间等信息

2. **文档操作**：
   - 删除文档：点击删除按钮移除文档
   - 查看详情：点击文档查看详细信息
   - 重新索引：对文档重新生成向量索引

3. **文档状态**：
   - ✅ 已处理：文档已成功解析和索引
   - 🔄 处理中：文档正在处理中
   - ❌ 处理失败：文档处理失败，需要重新上传

### 向量索引管理

1. **索引重建**：
   - 当文档内容更新时需要重建索引
   - 系统提供一键重建功能
   - 重建过程可能需要几分钟

2. **索引优化**：
   - 定期优化索引提高检索效率
   - 支持增量更新
   - 自动维护索引健康状态

## ⚙️ 配置说明

### 环境变量配置

编辑`.env`文件，配置以下参数：

```bash
# 服务器配置
PORT=3000
NODE_ENV=development

# 数据库配置
DB_PATH=./data/database/personal-ai-assistant.db

# 文件存储配置
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=pdf,docx,md

# 向量模型配置
VECTOR_MODEL_PATH=./models/bge-small-zh-v1.5
VECTOR_DIMENSION=512
FAISS_INDEX_PATH=./data/vectors/vector_data.json

# LLM配置
LLM_MODEL_PATH=./models/qwen-0.5b
LLM_MAX_TOKENS=2048
LLM_TEMPERATURE=0.7

# 日志配置
LOG_LEVEL=info
LOG_FILE=./logs/personal-ai-assistant.log

# 文本处理配置
CHUNK_SIZE=300
CHUNK_OVERLAP=50
MAX_CHUNKS_PER_QUERY=5
```

### 第三方API配置

如果需要使用第三方API，可以在`.env`文件中配置相应的API密钥：

```bash
# OpenAI配置
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-3.5-turbo

# 百度文心一言配置
BAIDU_API_KEY=your_baidu_api_key_here
BAIDU_SECRET_KEY=your_baidu_secret_key_here

# 阿里云通义千问配置
QWEN_API_KEY=your_qwen_api_key_here
```

## 🔧 故障排除

### 常见问题

#### 1. 模型下载失败

**问题**: AI模型下载速度慢或失败

**解决方案**:
- 检查网络连接
- 使用 `npm run download-backup` 下载备份模型
- 手动下载模型文件到 `models/` 目录

#### 2. 文档上传失败

**问题**: 文档上传失败或处理失败

**解决方案**:
- 检查文件格式是否支持
- 确认文件大小不超过10MB
- 查看日志文件 `logs/personal-ai-assistant.log` 了解详细错误

#### 3. 回答质量不佳

**问题**: 系统回答不准确或不相关

**解决方案**:
- 确保上传了相关文档
- 重建向量索引
- 调整文本处理参数（CHUNK_SIZE, CHUNK_OVERLAP）
- 优化提问方式

#### 4. 内存不足

**问题**: 系统运行缓慢或崩溃

**解决方案**:
- 增加系统内存
- 关闭不必要的程序
- 调整LLM模型参数（降低MAX_TOKENS）
- 使用更小的模型

### 日志查看

查看系统日志了解运行状态：

```bash
# 查看实时日志
tail -f logs/personal-ai-assistant.log

# 查看错误日志
grep "ERROR" logs/personal-ai-assistant.log
```

### 数据库管理

```bash
# 备份数据库
cp data/database/personal-ai-assistant.db backup/personal-ai-assistant-$(date +%Y%m%d).db

# 重置数据库（谨慎操作）
rm data/database/personal-ai-assistant.db
npm run init:db
```

## 📚 常见问题

### Q: 支持哪些文档格式？

A: 目前支持PDF、Word（.docx）和Markdown（.md）格式。

### Q: 如何提高回答质量？

A: 
- 上传更多相关文档
- 使用高质量的文档
- 重建向量索引
- 优化提问方式

### Q: 系统是否需要联网？

A: 
- 基础功能完全本地运行，无需联网
- 如需使用第三方API（如OpenAI），需要联网

### Q: 如何备份数据？

A: 
- 备份数据库文件：`data/database/personal-ai-assistant.db`
- 备份上传的文档：`uploads/` 目录
- 备份向量索引：`data/vectors/` 目录

### Q: 系统资源占用情况？

A: 
- 内存：约4-8GB（取决于模型大小）
- 磁盘：约5-10GB（模型文件+数据）
- CPU：中等占用（推理时较高）

## 📞 技术支持

如果遇到问题，可以通过以下方式获取帮助：

1. 查看系统日志文件
2. 检查配置文件是否正确
3. 参考故障排除部分
4. 联系开发团队

## 🔄 更新维护

### 定期维护

- 定期备份数据
- 更新AI模型
- 清理临时文件
- 检查系统日志

### 版本更新

```bash
# 更新代码
git pull origin main

# 更新依赖
npm install

# 重新下载模型（如有更新）
npm run download-model
```

---

*最后更新：2025年8月*