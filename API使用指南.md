# WeComBot API 使用指南

## 🚀 快速开始

### 1. 启动服务
```bash
cd wecombot
npm install
npm start
```

服务启动后，访问 http://localhost:3000 查看API信息。

### 2. 查看API文档

#### 交互式文档（推荐）
访问 http://localhost:3000/api/docs/interactive 查看交互式API文档，支持在线测试。

#### Markdown文档
访问 http://localhost:3000/api/docs/markdown 查看完整的Markdown格式文档。

#### JSON格式
访问 http://localhost:3000/api/docs/json 获取OpenAPI规范的JSON文档。

---

## 📋 基本使用流程

### 步骤1: 上传文档
```bash
curl -X POST http://localhost:3000/api/documents/upload \
  -F "document=@your-document.pdf" \
  -F "description=公司规章制度" \
  -F "uploadedBy=admin"
```

**响应示例**:
```json
{
  "success": true,
  "message": "文档上传成功，正在处理中",
  "data": {
    "documentId": 123,
    "filename": "your-document.pdf",
    "size": 1048576,
    "type": ".pdf"
  }
}
```

### 步骤2: 等待文档处理
文档上传后会自动进行解析、切分和向量化处理。可以通过以下接口查看处理状态：

```bash
curl http://localhost:3000/api/documents/123
```

当 `processing_status` 为 `completed` 时，表示处理完成。

### 步骤3: 构建向量索引（可选）
如果需要重新构建索引：

```bash
curl -X POST http://localhost:3000/api/search/build-index
```

### 步骤4: 执行语义搜索
```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "请假制度是什么",
    "topK": 5,
    "threshold": 0.3,
    "includeContent": true
  }'
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "query": "请假制度是什么",
    "results": [
      {
        "chunkId": 456,
        "similarity": 0.8756,
        "documentName": "company-rules.pdf",
        "content": "第四条 请假制度\n员工请假需要提前申请...",
        "preview": "...员工<mark>请假</mark>需要提前申请..."
      }
    ],
    "total": 1,
    "responseTime": 156
  }
}
```

---

## 🛠️ 常用API接口

### 文档管理

#### 获取文档列表
```bash
# 获取所有已完成处理的文档
curl "http://localhost:3000/api/documents?status=completed&page=1&limit=10"

# 按文件类型过滤
curl "http://localhost:3000/api/documents?fileType=.pdf"
```

#### 获取文档统计
```bash
curl http://localhost:3000/api/documents/statistics
```

#### 搜索文档（关键词搜索）
```bash
curl "http://localhost:3000/api/documents/search?q=规章制度"
```

#### 删除文档
```bash
curl -X DELETE http://localhost:3000/api/documents/123
```

### 语义搜索

#### 文本向量化
```bash
# 单个文本
curl -X POST http://localhost:3000/api/search/vectorize \
  -H "Content-Type: application/json" \
  -d '{"text": "这是一个测试文本"}'

# 批量文本
curl -X POST http://localhost:3000/api/search/vectorize \
  -H "Content-Type: application/json" \
  -d '{"texts": ["文本一", "文本二", "文本三"]}'
```

#### 计算相似度
```bash
curl -X POST http://localhost:3000/api/search/similarity \
  -H "Content-Type: application/json" \
  -d '{
    "vector1": [0.1, 0.2, 0.3, ...],
    "vector2": [0.4, 0.5, 0.6, ...]
  }'
```

#### 检查服务状态
```bash
# 系统健康检查
curl http://localhost:3000/health

# 向量服务状态
curl http://localhost:3000/api/search/status

# 向量服务健康检查
curl http://localhost:3000/api/search/health
```

---

## 🔧 高级用法

### 1. 限制搜索范围
```bash
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "工作时间",
    "topK": 3,
    "threshold": 0.5,
    "documentIds": [123, 456]
  }'
```

### 2. 批量处理
```javascript
// JavaScript示例：批量上传文档
const files = ['doc1.pdf', 'doc2.docx', 'doc3.md'];

for (const file of files) {
  const formData = new FormData();
  formData.append('document', fs.createReadStream(file));
  formData.append('description', `批量上传: ${file}`);
  
  const response = await fetch('/api/documents/upload', {
    method: 'POST',
    body: formData
  });
  
  console.log(`${file} 上传结果:`, await response.json());
}
```

### 3. 监控和统计
```bash
# 获取详细统计信息
curl http://localhost:3000/api/documents/statistics

# 获取索引统计
curl http://localhost:3000/api/search/index-stats

# 监控脚本示例
while true; do
  echo "=== $(date) ==="
  curl -s http://localhost:3000/health | jq '.status'
  curl -s http://localhost:3000/api/search/health | jq '.data.status'
  sleep 30
done
```

---

## 📱 使用工具

### 1. Postman集合
导入项目根目录下的 `WeComBot-API.postman_collection.json` 文件到Postman中，包含所有API接口的预配置请求。

### 2. 交互式文档
访问 http://localhost:3000/api/docs/interactive 使用内置的API测试工具。

### 3. cURL脚本
```bash
# 创建测试脚本
cat > test-api.sh << 'EOF'
#!/bin/bash

BASE_URL="http://localhost:3000"

echo "1. 检查服务状态..."
curl -s $BASE_URL/health | jq

echo -e "\n2. 获取文档统计..."
curl -s $BASE_URL/api/documents/statistics | jq

echo -e "\n3. 检查向量服务..."
curl -s $BASE_URL/api/search/health | jq

echo -e "\n4. 测试向量化..."
curl -s -X POST $BASE_URL/api/search/vectorize \
  -H "Content-Type: application/json" \
  -d '{"text": "测试文本"}' | jq '.data.dimension'

echo -e "\n测试完成！"
EOF

chmod +x test-api.sh
./test-api.sh
```

---

## ⚠️ 注意事项

### 文件上传限制
- **最大文件大小**: 10MB
- **支持格式**: PDF (.pdf), Word (.docx), Markdown (.md)
- **同时上传**: 最多5个文件

### 性能建议
- **批量操作**: 使用批量接口提高效率
- **缓存结果**: 相同查询的结果可以缓存
- **分页查询**: 大量数据使用分页避免超时

### 错误处理
```javascript
// JavaScript错误处理示例
async function safeApiCall(url, options) {
  try {
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(`API错误 ${response.status}: ${data.error}`);
    }
    
    return data;
  } catch (error) {
    console.error('API调用失败:', error.message);
    throw error;
  }
}
```

### 调试技巧
1. **查看日志**: 检查服务器控制台输出
2. **使用健康检查**: 定期检查服务状态
3. **验证参数**: 确保请求参数格式正确
4. **检查网络**: 确认服务器地址和端口

---

## 🔍 故障排除

### 常见问题

#### 1. 文档上传失败
```bash
# 检查文件格式和大小
file your-document.pdf
ls -lh your-document.pdf

# 检查服务状态
curl http://localhost:3000/health
```

#### 2. 语义搜索无结果
```bash
# 检查向量服务状态
curl http://localhost:3000/api/search/health

# 检查索引统计
curl http://localhost:3000/api/search/index-stats

# 重建索引
curl -X POST http://localhost:3000/api/search/rebuild-index
```

#### 3. 服务响应慢
```bash
# 检查文档数量
curl http://localhost:3000/api/documents/statistics

# 监控响应时间
time curl http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{"query": "测试查询"}'
```

### 获取帮助
- 查看服务器日志输出
- 使用交互式文档测试接口
- 检查API响应中的错误信息
- 参考完整的API文档

---

## 📞 技术支持

如有问题或建议，请：
1. 查看完整API文档
2. 使用交互式测试工具
3. 检查服务器日志
4. 联系开发团队

**文档版本**: v1.0.0  
**最后更新**: 2025-08-07
