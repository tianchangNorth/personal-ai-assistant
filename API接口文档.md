# WeComBot API 接口文档

## 📋 概述

WeComBot是一个基于RAG（检索增强生成）技术的企业微信智能问答机器人API服务。本文档详细描述了所有可用的API接口。

**基础信息**
- **Base URL**: `http://localhost:3000`
- **API版本**: v1.0.0
- **内容类型**: `application/json`
- **字符编码**: UTF-8

---

## 🏥 系统接口

### 健康检查

#### GET /health
获取系统健康状态

**响应示例**:
```json
{
  "status": "ok",
  "timestamp": "2025-08-07T10:30:00.000Z",
  "version": "1.0.0",
  "environment": "development"
}
```

#### GET /
获取API基本信息

**响应示例**:
```json
{
  "message": "企业微信RAG智能问答机器人 API",
  "version": "1.0.0",
  "docs": "/api/docs",
  "health": "/health"
}
```

#### GET /api/docs
获取API文档信息

**响应示例**:
```json
{
  "title": "WeComBot API Documentation",
  "version": "1.0.0",
  "endpoints": {
    "documents": { ... },
    "search": { ... }
  }
}
```

---

## 📄 文档管理接口

### 文档上传

#### POST /api/documents/upload
上传并处理文档

**请求参数**:
- **Content-Type**: `multipart/form-data`
- **document** (file, required): 文档文件 (支持PDF、DOCX、MD格式)
- **description** (string, optional): 文档描述
- **uploadedBy** (string, optional): 上传者标识
- **tags** (string, optional): 标签，逗号分隔

**文件限制**:
- 最大文件大小: 10MB
- 支持格式: `.pdf`, `.docx`, `.md`
- 最多同时上传: 5个文件

**响应示例**:
```json
{
  "success": true,
  "message": "文档上传成功，正在处理中",
  "data": {
    "documentId": 123,
    "filename": "company-rules.pdf",
    "size": 1048576,
    "type": ".pdf"
  }
}
```

**错误响应**:
```json
{
  "success": false,
  "error": "不支持的文件类型: txt。支持的类型: pdf, docx, md"
}
```

### 文档列表

#### GET /api/documents
获取文档列表

**查询参数**:
- **status** (string, optional): 处理状态
  - `pending`: 待处理
  - `processing`: 处理中
  - `completed`: 已完成
  - `failed`: 处理失败
- **fileType** (string, optional): 文件类型 (`.pdf`, `.docx`, `.md`)
- **page** (number, optional): 页码，默认1
- **limit** (number, optional): 每页数量，默认20
- **orderBy** (string, optional): 排序字段，默认`created_at`
- **orderDir** (string, optional): 排序方向，默认`DESC`

**请求示例**:
```
GET /api/documents?status=completed&page=1&limit=10
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "documents": [
      {
        "id": 123,
        "filename": "company-rules-1735123456789.pdf",
        "original_name": "company-rules.pdf",
        "file_type": ".pdf",
        "file_size": 1048576,
        "processing_status": "completed",
        "upload_time": "2025-08-07T10:00:00.000Z",
        "processed_time": "2025-08-07T10:01:30.000Z",
        "metadata": {
          "description": "公司规章制度",
          "uploadedBy": "admin"
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 1
    }
  }
}
```

### 文档详情

#### GET /api/documents/:id
获取指定文档的详细信息

**路径参数**:
- **id** (number, required): 文档ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "document": {
      "id": 123,
      "filename": "company-rules-1735123456789.pdf",
      "original_name": "company-rules.pdf",
      "file_type": ".pdf",
      "file_size": 1048576,
      "processing_status": "completed",
      "upload_time": "2025-08-07T10:00:00.000Z",
      "processed_time": "2025-08-07T10:01:30.000Z",
      "metadata": {
        "wordCount": 5000,
        "pageCount": 10
      }
    },
    "chunks": [
      {
        "id": 456,
        "index": 0,
        "size": 298,
        "preview": "第一章 总则\n\n第一条 为了规范公司管理..."
      }
    ]
  }
}
```

### 文档块内容

#### GET /api/documents/:id/chunks/:chunkId
获取指定文档块的完整内容

**路径参数**:
- **id** (number, required): 文档ID
- **chunkId** (number, required): 文档块ID

**响应示例**:
```json
{
  "success": true,
  "data": {
    "id": 456,
    "document_id": 123,
    "chunk_index": 0,
    "content": "第一章 总则\n\n第一条 为了规范公司管理，制定本制度。\n\n第二条 本制度适用于公司全体员工。",
    "start_pos": 0,
    "end_pos": 298,
    "chunk_size": 298,
    "metadata": {
      "chunkSize": 298,
      "isComplete": false
    },
    "created_at": "2025-08-07T10:01:30.000Z"
  }
}
```

### 文档搜索

#### GET /api/documents/search
搜索文档（基于文件名和内容的全文搜索）

**查询参数**:
- **q** (string, required): 搜索关键词
- **page** (number, optional): 页码，默认1
- **limit** (number, optional): 每页数量，默认10

**请求示例**:
```
GET /api/documents/search?q=规章制度&page=1&limit=5
```

**响应示例**:
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "id": 123,
        "filename": "company-rules.pdf",
        "original_name": "company-rules.pdf",
        "snippet": "...公司<mark>规章制度</mark>管理办法...",
        "file_type": ".pdf",
        "upload_time": "2025-08-07T10:00:00.000Z"
      }
    ],
    "query": "规章制度",
    "pagination": {
      "page": 1,
      "limit": 5,
      "total": 1
    }
  }
}
```

### 统计信息

#### GET /api/documents/statistics
获取文档统计信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "totalDocuments": 25,
    "processedDocuments": 23,
    "totalChunks": 1250,
    "averageChunkSize": 287,
    "fileTypeDistribution": [
      { "file_type": ".pdf", "count": 15 },
      { "file_type": ".docx", "count": 8 },
      { "file_type": ".md", "count": 2 }
    ],
    "statusDistribution": [
      { "processing_status": "completed", "count": 23 },
      { "processing_status": "processing", "count": 1 },
      { "processing_status": "failed", "count": 1 }
    ]
  }
}
```

### 重新处理文档

#### POST /api/documents/:id/reprocess
重新处理指定文档

**路径参数**:
- **id** (number, required): 文档ID

**响应示例**:
```json
{
  "success": true,
  "message": "文档重新处理已开始"
}
```

### 删除文档

#### DELETE /api/documents/:id
删除指定文档及其所有相关数据

**路径参数**:
- **id** (number, required): 文档ID

**响应示例**:
```json
{
  "success": true,
  "message": "文档删除成功"
}
```

---

## 🔍 语义搜索接口

### 语义搜索

#### POST /api/search/semantic
执行基于向量相似度的语义搜索

**请求体**:
```json
{
  "query": "工作时间是什么时候",
  "topK": 5,
  "threshold": 0.3,
  "includeContent": true,
  "documentIds": [123, 456]
}
```

**参数说明**:
- **query** (string, required): 查询文本
- **topK** (number, optional): 返回结果数量，默认5，最大20
- **threshold** (number, optional): 相似度阈值，默认0.3，范围0-1
- **includeContent** (boolean, optional): 是否包含内容，默认true
- **documentIds** (array, optional): 限制搜索的文档ID列表

**响应示例**:
```json
{
  "success": true,
  "data": {
    "query": "工作时间是什么时候",
    "results": [
      {
        "chunkId": 789,
        "similarity": 0.8756,
        "distance": 0.2488,
        "documentId": 123,
        "documentName": "company-rules.pdf",
        "chunkIndex": 5,
        "content": "第三条 工作时间\n员工应当按时上下班，工作时间为上午9点到下午6点。",
        "preview": "...员工应当按时上下班，<mark>工作时间</mark>为上午9点到下午6点...",
        "metadata": {
          "chunkSize": 298
        }
      }
    ],
    "total": 1,
    "options": {
      "topK": 5,
      "threshold": 0.3,
      "includeContent": true
    },
    "responseTime": 156
  }
}
```

### 构建向量索引

#### POST /api/search/build-index
为所有已处理的文档构建向量索引

**响应示例**:
```json
{
  "success": true,
  "message": "向量索引构建完成",
  "data": {
    "success": true,
    "indexed": 1250,
    "total": 1250,
    "stats": {
      "totalVectors": 1250,
      "dimension": 512,
      "isInitialized": true
    }
  }
}
```

### 重建向量索引

#### POST /api/search/rebuild-index
重建整个向量索引

**响应示例**:
```json
{
  "success": true,
  "message": "向量索引重建完成",
  "data": {
    "success": true,
    "rebuilt": 1250,
    "stats": {
      "totalVectors": 1250,
      "dimension": 512
    }
  }
}
```

### 文本向量化

#### POST /api/search/vectorize
将文本转换为向量表示

**请求体**:
```json
{
  "text": "这是一个测试文本"
}
```

或批量向量化:
```json
{
  "texts": ["文本一", "文本二", "文本三"]
}
```

**参数说明**:
- **text** (string): 单个文本（与texts二选一）
- **texts** (array): 文本数组，最多100个（与text二选一）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "vectors": [
      [0.1234, -0.5678, 0.9012, ...]
    ],
    "dimension": 512,
    "count": 1,
    "responseTime": 234
  }
}
```

### 计算向量相似度

#### POST /api/search/similarity
计算向量间的余弦相似度

**请求体**:
```json
{
  "vector1": [0.1, 0.2, 0.3, ...],
  "vector2": [0.4, 0.5, 0.6, ...]
}
```

或批量计算:
```json
{
  "vector1": [0.1, 0.2, 0.3, ...],
  "vectors": [
    [0.4, 0.5, 0.6, ...],
    [0.7, 0.8, 0.9, ...]
  ]
}
```

**参数说明**:
- **vector1** (array, required): 第一个向量
- **vector2** (array): 第二个向量（与vectors二选一）
- **vectors** (array): 向量数组（与vector2二选一）

**响应示例**:
```json
{
  "success": true,
  "data": {
    "similarities": [0.8756],
    "count": 1
  }
}
```

### 获取向量服务状态

#### GET /api/search/status
获取向量服务的详细状态信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "isInitialized": true,
    "vectorService": {
      "name": "BAAI/bge-small-zh-v1.5",
      "dimension": 512,
      "isInitialized": true
    },
    "faissService": {
      "totalVectors": 1250,
      "dimension": 512,
      "indexPath": "./data/vectors/faiss_index",
      "isInitialized": true,
      "chunkCount": 1250
    },
    "defaultTopK": 5,
    "defaultThreshold": 0.3,
    "timestamp": "2025-08-07T10:30:00.000Z"
  }
}
```

### 获取索引统计信息

#### GET /api/search/index-stats
获取FAISS索引和向量模型的统计信息

**响应示例**:
```json
{
  "success": true,
  "data": {
    "faiss": {
      "totalVectors": 1250,
      "dimension": 512,
      "indexPath": "./data/vectors/faiss_index",
      "isInitialized": true,
      "chunkCount": 1250
    },
    "vector": {
      "name": "BAAI/bge-small-zh-v1.5",
      "dimension": 512,
      "isInitialized": true
    },
    "timestamp": "2025-08-07T10:30:00.000Z"
  }
}
```

### 向量服务健康检查

#### GET /api/search/health
检查向量服务各组件的健康状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "services": {
      "vectorService": true,
      "faissService": true,
      "semanticSearch": true
    },
    "timestamp": "2025-08-07T10:30:00.000Z"
  }
}
```

**不健康状态响应** (HTTP 503):
```json
{
  "success": false,
  "data": {
    "status": "unhealthy",
    "services": {
      "vectorService": false,
      "faissService": true,
      "semanticSearch": false
    },
    "timestamp": "2025-08-07T10:30:00.000Z"
  }
}
```

### 初始化向量服务

#### POST /api/search/initialize
手动初始化向量服务（通常在系统启动时自动执行）

**响应示例**:
```json
{
  "success": true,
  "message": "向量服务初始化完成",
  "data": {
    "isInitialized": true,
    "vectorService": {
      "name": "BAAI/bge-small-zh-v1.5",
      "dimension": 512,
      "isInitialized": true
    },
    "faissService": {
      "totalVectors": 0,
      "dimension": 512,
      "isInitialized": true
    }
  }
}
```

---

## 📝 通用响应格式

### 成功响应
所有成功的API响应都遵循以下格式：
```json
{
  "success": true,
  "message": "操作描述（可选）",
  "data": {
    // 具体的响应数据
  }
}
```

### 错误响应
所有错误响应都遵循以下格式：
```json
{
  "success": false,
  "error": "错误描述",
  "details": "详细错误信息（可选）"
}
```

### 常见HTTP状态码
- **200 OK**: 请求成功
- **400 Bad Request**: 请求参数错误
- **404 Not Found**: 资源不存在
- **500 Internal Server Error**: 服务器内部错误
- **503 Service Unavailable**: 服务不可用

---

## 🔧 使用示例

### JavaScript/Node.js
```javascript
// 上传文档
const formData = new FormData();
formData.append('document', fileInput.files[0]);
formData.append('description', '公司规章制度');

const response = await fetch('/api/documents/upload', {
  method: 'POST',
  body: formData
});

// 语义搜索
const searchResponse = await fetch('/api/search/semantic', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: '请假制度是什么',
    topK: 5,
    threshold: 0.3
  })
});
```

### Python
```python
import requests

# 上传文档
files = {'document': open('company-rules.pdf', 'rb')}
data = {'description': '公司规章制度'}
response = requests.post('http://localhost:3000/api/documents/upload',
                        files=files, data=data)

# 语义搜索
search_data = {
    'query': '请假制度是什么',
    'topK': 5,
    'threshold': 0.3
}
search_response = requests.post('http://localhost:3000/api/search/semantic',
                               json=search_data)
```

### cURL
```bash
# 上传文档
curl -X POST http://localhost:3000/api/documents/upload \
  -F "document=@company-rules.pdf" \
  -F "description=公司规章制度"

# 语义搜索
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "请假制度是什么",
    "topK": 5,
    "threshold": 0.3
  }'
```

---

## 📊 性能指标

### 响应时间
- **文档上传**: < 1秒（不包括处理时间）
- **文档列表**: < 200ms
- **语义搜索**: < 500ms
- **文本向量化**: < 2秒（单文本）

### 并发支持
- **最大并发连接**: 100
- **文件上传并发**: 10
- **搜索请求并发**: 50

### 限制说明
- **文件大小限制**: 10MB
- **批量向量化**: 最多100个文本
- **搜索结果数量**: 最多20个
- **API调用频率**: 100次/分钟

---

## 🔒 安全说明

### 文件安全
- 支持的文件类型限制
- 文件大小限制
- 文件内容扫描（计划中）

### 数据安全
- 本地存储，不上传到外部服务
- 数据库访问控制
- 日志记录和审计

### API安全
- 请求频率限制
- 输入参数验证
- 错误信息脱敏

---

## 📞 技术支持

如有问题或建议，请联系开发团队：
- **项目地址**: WeComBot
- **文档版本**: v1.0.0
- **最后更新**: 2025-08-07
