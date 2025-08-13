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
cd personal-ai-assistant
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
# 下载默认模型
npm run download-model

# 查看所有可用模型
npm run custom-model list

# 下载其他模型（可选）
npm run custom-model download Xenova/bge-base-zh-v1.5

# 下载备份模型（轻量级）
npm run download-backup
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

## 🎛️ 向量模型管理

### 支持的向量模型

系统支持多种Transformers.js兼容的向量模型，您可以根据需求选择最适合的模型：

| 模型名称 | 描述 | 维度 | 大小 | 适用场景 |
|---------|------|------|------|----------|
| `Xenova/bge-small-zh-v1.5` | BGE中文小型版 | 512 | ~130MB | 中文文档，默认选择 |
| `Xenova/bge-base-zh-v1.5` | BGE中文基础版 | 768 | ~400MB | 中文文档，更高精度 |
| `Xenova/bge-large-zh-v1.5` | BGE中文大型版 | 1024 | ~1.2GB | 中文文档，最高精度 |
| `Xenova/all-MiniLM-L6-v2` | 多语言轻量模型 | 384 | ~25MB | 多语言文档，资源受限 |
| `Xenova/paraphrase-multilingual-MiniLM-L12-v2` | 多语言句子相似度 | 384 | ~100MB | 多语言文档，高质量 |
| `Xenova/e5-small-v2` | E5英文小型版 | 384 | ~35MB | 英文文档，轻量级 |
| `Xenova/e5-base-v2` | E5英文基础版 | 768 | ~110MB | 英文文档，平衡性能 |

### 模型管理命令

```bash
# 查看所有可用模型
npm run custom-model list

# 下载指定模型
npm run custom-model download Xenova/bge-base-zh-v1.5

# 检查模型状态
npm run custom-model check Xenova/bge-base-zh-v1.5

# 设置为默认模型
npm run custom-model set-default Xenova/bge-base-zh-v1.5

# 自动设置默认模型（单个模型时）
npm run custom-model auto-set

# 显示帮助信息
npm run custom-model help
```

### 模型选择建议

**中文文档处理**：
- 轻量级：`Xenova/bge-small-zh-v1.5`（默认）
- 平衡性：`Xenova/bge-base-zh-v1.5`
- 高精度：`Xenova/bge-large-zh-v1.5`

**多语言文档处理**：
- 轻量级：`Xenova/all-MiniLM-L6-v2`
- 高质量：`Xenova/paraphrase-multilingual-MiniLM-L12-v2`

**英文文档处理**：
- 轻量级：`Xenova/e5-small-v2`
- 平衡性：`Xenova/e5-base-v2`

### 模型切换注意事项

1. **向量维度一致性**：切换模型后，所有现有的向量索引需要重建
2. **系统自动检测**：系统会自动检测新模型的维度并更新配置
3. **重启服务**：切换模型后需要重启服务以应用新配置
4. **存储空间**：大型模型需要更多磁盘空间，请确保有足够空间

### 自动默认模型设置

系统提供智能的默认模型自动设置功能：

**自动设置规则**：
- 当系统中只有一个已安装的向量模型时，系统会自动将其设置为默认模型
- 系统会检查并更新 `.env` 文件中的 `VECTOR_MODEL_PATH` 和 `VECTOR_DIMENSION` 配置
- 如果默认模型已正确配置，系统不会重复设置

**触发时机**：
- 下载新模型完成后自动检查并设置
- 手动运行 `npm run custom-model auto-set` 命令
- 系统启动时会自动检测默认模型配置

**使用示例**：
```bash
# 手动触发自动设置
npm run custom-model auto-set

# 下载模型后自动设置（无需手动操作）
npm run custom-model download Xenova/bge-base-zh-v1.5

# 查看所有模型状态
npm run custom-model list
```

**优势**：
- 减少手动配置步骤
- 避免配置错误
- 提供更好的用户体验

### 手动配置（高级用户）

您也可以直接编辑`.env`文件来配置自定义模型：

```bash
# 设置自定义模型路径
VECTOR_MODEL_PATH=./models/cache/your-custom-model-name
VECTOR_DIMENSION=768  # 根据模型实际维度设置
```

## 🗄️ 向量数据库管理

### 支持的向量数据库

系统支持多种向量数据库后端，您可以根据性能和扩展性需求选择：

- **Memory**: 内存存储（默认，轻量级，适合小型部署）
- **FAISS**: 高性能向量搜索（适合中等规模数据）
- **Redis**: 分布式内存数据库（适合高并发场景）
- **PostgreSQL + pgvector**: 关系型向量数据库（适合企业级部署）
```

### 数据库配置示例

```bash
# 使用Redis作为向量数据库
export VECTOR_DB_TYPE=redis
export REDIS_URL=redis://localhost:6379

# 使用PostgreSQL
export VECTOR_DB_TYPE=postgres
export POSTGRES_URL=postgresql://localhost:5432/vectordb

# 使用FAISS（默认）
export VECTOR_DB_TYPE=faiss
```

### 数据库选择建议

- **开发/测试环境**：Memory（最简单）
- **中小型生产环境**：FAISS（性能好）
- **高并发生产环境**：Redis（分布式）
- **企业级部署**：PostgreSQL（稳定性好）

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

### 第三方AI配置

系统支持多种第三方AI服务，通过BASE_URL自动识别供应商：

```bash
# 第三方AI配置（最简格式）
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-3.5-turbo

# 可选配置
LLM_MAX_TOKENS=4096
LLM_TEMPERATURE=0.7
LLM_FALLBACK_TO_LOCAL=true
```

**支持的供应商（系统自动识别）：**

| 供应商 | BASE_URL示例 | 默认模型 |
|--------|-------------|----------|
| OpenAI | `https://api.openai.com/v1` | gpt-3.5-turbo |
| Anthropic | `https://api.anthropic.com` | claude-3-sonnet-20240229 |
| 百度文心一言 | `https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat` | ernie-speed-128k |
| 阿里云通义千问 | `https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation` | qwen-turbo |
| 智谱AI GLM | `https://open.bigmodel.cn/api/paas/v4/chat/completions` | glm-4-flash |
| 月之暗面 Kimi | `https://api.moonshot.cn/v1/chat/completions` | moonshot-v1-8k |
| 字节跳动豆包 | `https://ark.cn-beijing.volces.com/api/v3/chat/completions` | doubao-pro-4k |
| 腾讯混元 | `https://hunyuan.tencentcloudapi.com` | hunyuan-pro |
| Azure OpenAI | `https://your-resource.openai.azure.com/` | your-deployment-name |

**使用说明：**
1. 获取对应服务商的API密钥
2. 设置 `LLM_API_KEY` 和 `LLM_BASE_URL`
3. 系统会自动识别供应商并应用相应的配置
4. 开启 `LLM_FALLBACK_TO_LOCAL=true` 可在API失败时回退到本地模型

**配置示例：**
```bash
# 使用OpenAI
LLM_API_KEY=sk-your-openai-key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL=gpt-4

# 使用百度文心一言
LLM_API_KEY=your-baidu-api-key
LLM_BASE_URL=https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop/chat
LLM_MODEL=ernie-speed-128k
```

## 🔧 故障排除

### 常见问题

#### 1. 模型下载失败

**问题**: AI模型下载速度慢或失败

**解决方案**:
- 检查网络连接
- 使用 `npm run download-backup` 下载轻量级备份模型
- 使用 `npm run custom-model download Xenova/all-MiniLM-L6-v2` 下载其他可用模型
- 手动下载模型文件到 `models/` 目录
- 确保有足够的磁盘空间（至少200MB）

#### 2. 向量模型相关问题

**问题**: 自定义向量模型无法加载

**解决方案**:
```bash
# 检查模型状态
npm run custom-model check your-model-name

# 查看所有可用模型
npm run custom-model list

# 清理缓存并重新下载
rm -rf ./models/cache/*
npm run custom-model download your-model-name

# 检查网络连接
ping huggingface.co

# 使用代理（如果需要）
export HTTP_PROXY=http://proxy:port
export HTTPS_PROXY=http://proxy:port
```

**问题**: 模型切换后向量检索失败

**解决方案**:
- 重建向量索引：删除现有索引文件，让系统重新生成
- 检查模型维度配置：`VECTOR_DIMENSION` 应与实际模型维度匹配
- 重启服务应用新配置
- 查看日志文件了解详细错误信息

**问题**: 向量模型内存占用过高

**解决方案**:
- 使用更小的模型（如 `Xenova/all-MiniLM-L6-v2`）
- 调整系统参数减少并发处理
- 增加系统内存
- 使用向量数据库分担内存压力

#### 3. 文档上传失败

**问题**: 文档上传失败或处理失败

**解决方案**:
- 检查文件格式是否支持
- 确认文件大小不超过10MB
- 查看日志文件 `logs/personal-ai-assistant.log` 了解详细错误

#### 4. 回答质量不佳

**问题**: 系统回答不准确或不相关

**解决方案**:
- 确保上传了相关文档
- 重建向量索引
- 调整文本处理参数（CHUNK_SIZE, CHUNK_OVERLAP）
- 优化提问方式
- 尝试使用更高质量的向量模型

#### 5. 内存不足

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

### Q: 支持哪些向量模型？

A: 支持多种Transformers.js兼容的向量模型，包括：
- BGE系列中文模型（small/base/large）
- 多语言模型（all-MiniLM-L6-v2等）
- E5系列英文模型
- 可通过 `npm run custom-model list` 查看完整列表

### Q: 如何提高回答质量？

A: 
- 上传更多相关文档
- 使用高质量的文档
- 重建向量索引
- 优化提问方式
- 尝试使用更高质量的向量模型（如 `Xenova/bge-base-zh-v1.5`）
- 调整文本处理参数（CHUNK_SIZE, CHUNK_OVERLAP）

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
  - 小型模型（all-MiniLM-L6-v2）：~2-4GB
  - 中型模型（bge-small-zh-v1.5）：~4-6GB
  - 大型模型（bge-large-zh-v1.5）：~6-8GB
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

# 检查模型状态
npm run custom-model list
```

---

*最后更新：2025年8月*