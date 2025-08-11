# 第三方API集成功能

## 概述

WeComBot 现已支持多种第三方AI模型API提供商，用户可以根据需要选择不同的AI服务进行问答。

## 支持的API提供商

### 国际服务商
- **OpenAI** - GPT-3.5, GPT-4 等模型
- **Azure OpenAI** - 微软Azure OpenAI服务
- **Anthropic Claude** - Claude 3系列模型

### 国内服务商
- **百度文心一言** - ERNIE系列模型
- **阿里云通义千问** - Qwen系列模型
- **智谱AI GLM** - GLM系列模型
- **月之暗面 Kimi** - Moonshot系列模型
- **字节跳动豆包** - Doubao系列模型
- **腾讯混元** - Hunyuan系列模型

## 配置方式

### 1. 环境变量配置

复制配置文件模板：
```bash
cp .env.third-party.example .env
```

然后在 `.env` 文件中配置相应的API密钥：

#### OpenAI配置示例
```env
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-3.5-turbo
OPENAI_MAX_TOKENS=4096
OPENAI_TEMPERATURE=0.7
```

#### 百度文心一言配置示例
```env
BAIDU_API_KEY=your-baidu-api-key
BAIDU_SECRET_KEY=your-baidu-secret-key
BAIDU_MODEL=ernie-speed-128k
```

#### 阿里云通义千问配置示例
```env
QWEN_API_KEY=your-qwen-api-key
QWEN_MODEL=qwen-turbo
```

### 2. 默认提供商设置

```env
THIRD_PARTY_DEFAULT_PROVIDER=openai
THIRD_PARTY_FALLBACK_TO_LOCAL=true
```

## 使用方式

### 1. 自动选择

系统启动时会自动检测配置的API密钥，按优先级选择第一个可用的提供商：

1. OpenAI
2. Azure OpenAI
3. Anthropic
4. 阿里云通义千问
5. 智谱AI GLM
6. 月之暗面 Kimi
7. 百度文心一言
8. 字节跳动豆包
9. 腾讯混元

如果没有配置任何第三方API，系统会自动回退到本地LM Studio。

### 2. 手动切换API

#### 获取可用提供商列表
```bash
curl http://localhost:3000/api/qa/providers
```

#### 切换API提供商
```bash
curl -X POST http://localhost:3000/api/qa/providers/switch \
  -H "Content-Type: application/json" \
  -d '{"provider": "qwen"}'
```

#### 查看当前状态
```bash
curl http://localhost:3000/api/qa/rag/status
```

## API接口

### 第三方API状态查询
- **GET** `/api/qa/third-party/status`
- **描述**: 获取第三方API服务状态

### 获取可用提供商
- **GET** `/api/qa/providers`
- **描述**: 获取所有可用的API提供商列表

### 切换提供商
- **POST** `/api/qa/providers/switch`
- **描述**: 切换到指定的API提供商
- **请求体**: `{"provider": "provider_name"}`

### RAG问答
- **POST** `/api/qa/ask`
- **描述**: 使用当前配置的API提供商进行RAG问答

## 错误处理

### API调用失败
- 系统会自动重试（默认3次）
- 如果第三方API失败且配置了回退到本地，会自动使用LM Studio
- 详细的错误信息会在响应中返回

### 配置错误
- 缺少API密钥时，相应的提供商会被标记为不可用
- 无效的配置会在启动时检测并报告

## 性能优化

### 并发处理
- 支持并发API调用
- 批量问答时自动控制请求频率

### 缓存机制
- API调用结果可缓存（需配置）
- 减少重复请求

### 超时控制
- 默认超时时间：60秒
- 可通过环境变量配置

## 监控和日志

### 状态监控
- 实时API提供商状态
- 调用成功率统计
- 响应时间监控

### 日志记录
- 详细的API调用日志
- 错误日志和调试信息
- 性能指标记录

## 测试

运行第三方API集成测试：
```bash
npm test -- tests/thirdPartyAPIService.test.js
```

## 故障排除

### 常见问题

1. **API密钥无效**
   - 检查环境变量配置
   - 验证API密钥是否有效
   - 确认账户余额充足

2. **网络连接问题**
   - 检查网络连接
   - 确认API地址可访问
   - 考虑使用代理

3. **模型不可用**
   - 确认模型名称正确
   - 检查模型是否在当前区域可用
   - 尝试切换其他模型

### 调试模式

启用详细日志：
```env
LOG_LEVEL=debug
```

查看服务状态：
```bash
curl http://localhost:3000/api/qa/rag/status
```

## 最佳实践

1. **密钥管理**
   - 使用环境变量存储API密钥
   - 定期更换API密钥
   - 监控API使用量和费用

2. **性能优化**
   - 根据使用场景选择合适的模型
   - 合理设置超时时间
   - 使用缓存减少API调用

3. **错误处理**
   - 实现重试机制
   - 配置备用API提供商
   - 监控API健康状况

4. **成本控制**
   - 监控Token使用量
   - 设置使用限制
   - 选择性价比高的模型