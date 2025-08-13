# 个人AI助手 API 接口文档

## 📋 概述

个人AI助手是一个基于RAG（检索增强生成）技术的智能问答系统API服务。本文档详细描述了所有可用的API接口。

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
  "message": "个人AI助手 RAG智能问答系统 API",
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
  "title": "个人AI助手 API Documentation",
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

## 🤖 RAG问答接口

### RAG智能问答

#### POST /api/qa/ask
基于文档内容的智能问答，结合语义检索和大语言模型

**请求体**:
```json
{
  "question": "企业微信自建应用是什么？",
  "topK": 5,
  "threshold": 0.3,
  "maxTokens": 2048,
  "temperature": 0.7,
  "documentIds": [123, 456]
}
```

**参数说明**:
- **question** (string, required): 用户问题
- **topK** (number, optional): 检索文档数量，默认5，最大20
- **threshold** (number, optional): 相似度阈值，默认0.3，范围0-1
- **maxTokens** (number, optional): 最大生成Token数，默认2048，最大4096
- **temperature** (number, optional): 生成温度，默认0.7，范围0-2
- **documentIds** (array, optional): 限制搜索的文档ID列表

**响应示例**:
```json
{
  "success": true,
  "data": {
    "question": "企业微信自建应用是什么？",
    "answer": "企业微信自建应用是企业在企业微信管理后台创建的应用程序，用于满足企业内部的特定业务需求...",
    "contexts": [
      {
        "content": "企业微信自建应用开发指南...",
        "similarity": 0.8756,
        "documentName": "wecom-dev-guide.md",
        "chunkIndex": 3
      }
    ],
    "searchResults": [
      {
        "chunkId": 789,
        "similarity": 0.8756,
        "documentName": "wecom-dev-guide.md",
        "content": "企业微信自建应用开发指南..."
      }
    ],
    "metadata": {
      "searchTime": null,
      "llmTime": 2179,
      "totalTime": 2190,
      "model": "deepseek-coder-v2-lite-instruct",
      "usage": {
        "prompt_tokens": 118,
        "completion_tokens": 36,
        "total_tokens": 154
      },
      "searchCount": 1
    }
  }
}
```

### 批量问答

#### POST /api/qa/batch
批量处理多个问题

**请求体**:
```json
{
  "questions": [
    "企业微信自建应用是什么？",
    "如何创建企业微信应用？",
    "企业微信API有哪些限制？"
  ],
  "topK": 5,
  "threshold": 0.3
}
```

**参数说明**:
- **questions** (array, required): 问题列表，最多10个
- 其他参数同单个问答接口

**响应示例**:
```json
{
  "success": true,
  "data": {
    "questions": ["问题1", "问题2", "问题3"],
    "results": [
      {
        "question": "问题1",
        "answer": "回答1",
        "contexts": [...],
        "metadata": {...}
      }
    ],
    "total": 3,
    "successful": 3,
    "failed": 0
  }
}
```

### 直接LLM对话

#### POST /api/qa/chat
直接与LLM对话，不使用RAG检索

**请求体**:
```json
{
  "message": "你好，请介绍一下自己",
  "maxTokens": 1024,
  "temperature": 0.7
}
```

**参数说明**:
- **message** (string, required): 对话消息
- **maxTokens** (number, optional): 最大生成Token数
- **temperature** (number, optional): 生成温度

**响应示例**:
```json
{
  "success": true,
  "data": {
    "message": "你好，请介绍一下自己",
    "answer": "你好！我是一个AI助手，专门为企业微信相关问题提供帮助...",
    "metadata": {
      "model": "deepseek-coder-v2-lite-instruct",
      "usage": {
        "prompt_tokens": 15,
        "completion_tokens": 45,
        "total_tokens": 60
      },
      "responseTime": 1234
    }
  }
}
```

### LLM服务状态

#### GET /api/qa/llm/status
获取LM Studio服务状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "isInitialized": true,
    "baseURL": "http://localhost:1234/v1",
    "currentModel": "deepseek-coder-v2-lite-instruct",
    "availableModels": [
      "deepseek-coder-v2-lite-instruct",
      "text-embedding-bge-small-zh-v1.5",
      "text-embedding-nomic-embed-text-v1.5"
    ],
    "config": {
      "maxTokens": 2048,
      "temperature": 0.7
    }
  }
}
```

### RAG服务状态

#### GET /api/qa/rag/status
获取RAG服务整体状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "status": "running",
    "isInitialized": true,
    "services": {
      "llm": {
        "status": "running",
        "currentModel": "deepseek-coder-v2-lite-instruct"
      },
      "search": {
        "status": "running",
        "totalVectors": 57,
        "dimension": 512
      }
    },
    "config": {
      "defaultTopK": 5,
      "defaultThreshold": 0.3
    }
  }
}
```

### RAG服务健康检查

#### GET /api/qa/health
检查RAG服务各组件健康状态

**响应示例**:
```json
{
  "success": true,
  "data": {
    "healthy": true,
    "services": {
      "llm": {
        "healthy": true,
        "message": "LM Studio连接正常"
      },
      "search": {
        "healthy": true,
        "message": "语义搜索服务正常"
      }
    }
  }
}
```

**不健康状态响应** (HTTP 503):
```json
{
  "success": false,
  "data": {
    "healthy": false,
    "services": {
      "llm": {
        "healthy": false,
        "message": "LM Studio连接失败: ECONNREFUSED"
      },
      "search": {
        "healthy": true,
        "message": "语义搜索服务正常"
      }
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

// RAG智能问答
const qaResponse = await fetch('/api/qa/ask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    question: '企业微信自建应用是什么？',
    topK: 5,
    threshold: 0.3
  })
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

// 直接LLM对话
const chatResponse = await fetch('/api/qa/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    message: '你好，请介绍一下企业微信的主要功能'
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

# RAG智能问答
qa_data = {
    'question': '企业微信自建应用是什么？',
    'topK': 5,
    'threshold': 0.3,
    'maxTokens': 2048
}
qa_response = requests.post('http://localhost:3000/api/qa/ask',
                           json=qa_data)

# 批量问答
batch_data = {
    'questions': [
        '企业微信自建应用是什么？',
        '如何创建企业微信应用？',
        '企业微信API有哪些限制？'
    ],
    'topK': 3
}
batch_response = requests.post('http://localhost:3000/api/qa/batch',
                              json=batch_data)

# 语义搜索
search_data = {
    'query': '请假制度是什么',
    'topK': 5,
    'threshold': 0.3
}
search_response = requests.post('http://localhost:3000/api/search/semantic',
                               json=search_data)

# 直接LLM对话
chat_data = {
    'message': '你好，请介绍一下企业微信的主要功能',
    'temperature': 0.7
}
chat_response = requests.post('http://localhost:3000/api/qa/chat',
                             json=chat_data)
```

### cURL
```bash
# 上传文档
curl -X POST http://localhost:3000/api/documents/upload \
  -F "document=@company-rules.pdf" \
  -F "description=公司规章制度"

# RAG智能问答
curl -X POST http://localhost:3000/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{
    "question": "企业微信自建应用是什么？",
    "topK": 5,
    "threshold": 0.3,
    "maxTokens": 2048
  }'

# 批量问答
curl -X POST http://localhost:3000/api/qa/batch \
  -H "Content-Type: application/json" \
  -d '{
    "questions": [
      "企业微信自建应用是什么？",
      "如何创建企业微信应用？"
    ]
  }'

# 直接LLM对话
curl -X POST http://localhost:3000/api/qa/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "你好，请介绍一下企业微信的主要功能"
  }'

# 语义搜索
curl -X POST http://localhost:3000/api/search/semantic \
  -H "Content-Type: application/json" \
  -d '{
    "query": "请假制度是什么",
    "topK": 5,
    "threshold": 0.3
  }'

# 检查RAG服务状态
curl http://localhost:3000/api/qa/rag/status

# 检查LLM服务状态
curl http://localhost:3000/api/qa/llm/status

# RAG健康检查
curl http://localhost:3000/api/qa/health
```

---

## 📊 性能指标

### 响应时间
- **文档上传**: < 1秒（不包括处理时间）
- **文档列表**: < 200ms
- **语义搜索**: < 500ms
- **文本向量化**: < 2秒（单文本）
- **RAG问答**: 2-10秒（取决于LLM模型）
- **直接LLM对话**: 1-5秒
- **批量问答**: 10-60秒（取决于问题数量）

### 并发支持
- **最大并发连接**: 100
- **文件上传并发**: 10
- **搜索请求并发**: 50
- **RAG问答并发**: 5（受LLM性能限制）

### 限制说明
- **文件大小限制**: 10MB
- **批量向量化**: 最多100个文本
- **搜索结果数量**: 最多20个
- **批量问答**: 最多10个问题
- **问题长度**: 最多1000字符
- **LLM最大Token**: 4096
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
- **项目地址**: 个人AI助手
- **文档版本**: v1.0.0
- **最后更新**: 2025-08-07
