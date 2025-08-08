const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs').promises;

/**
 * @route GET /api/docs/interactive
 * @desc 获取交互式API文档页面
 * @access Public
 */
router.get('/interactive', async (req, res) => {
  try {
    const htmlContent = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WeComBot API 文档</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f8f9fa;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 10px;
            margin-bottom: 2rem;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }
        
        .header p {
            font-size: 1.1rem;
            opacity: 0.9;
        }
        
        .nav-tabs {
            display: flex;
            background: white;
            border-radius: 10px;
            padding: 0.5rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .nav-tab {
            flex: 1;
            padding: 1rem;
            text-align: center;
            background: transparent;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1rem;
            transition: all 0.3s ease;
        }
        
        .nav-tab.active {
            background: #667eea;
            color: white;
        }
        
        .nav-tab:hover:not(.active) {
            background: #f0f0f0;
        }
        
        .content-section {
            display: none;
            background: white;
            border-radius: 10px;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .content-section.active {
            display: block;
        }
        
        .endpoint {
            margin-bottom: 2rem;
            border: 1px solid #e9ecef;
            border-radius: 8px;
            overflow: hidden;
        }
        
        .endpoint-header {
            background: #f8f9fa;
            padding: 1rem;
            border-bottom: 1px solid #e9ecef;
        }
        
        .endpoint-method {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-weight: bold;
            font-size: 0.875rem;
            margin-right: 1rem;
        }
        
        .method-get { background: #28a745; color: white; }
        .method-post { background: #007bff; color: white; }
        .method-delete { background: #dc3545; color: white; }
        
        .endpoint-path {
            font-family: 'Courier New', monospace;
            font-size: 1.1rem;
            font-weight: bold;
        }
        
        .endpoint-body {
            padding: 1rem;
        }
        
        .endpoint-description {
            margin-bottom: 1rem;
            color: #666;
        }
        
        .code-block {
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
            padding: 1rem;
            margin: 1rem 0;
            overflow-x: auto;
        }
        
        .code-block pre {
            margin: 0;
            font-family: 'Courier New', monospace;
            font-size: 0.875rem;
        }
        
        .try-it-btn {
            background: #28a745;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.875rem;
            margin-top: 1rem;
        }
        
        .try-it-btn:hover {
            background: #218838;
        }
        
        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 0.5rem;
        }
        
        .status-online { background: #28a745; }
        .status-offline { background: #dc3545; }
        
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            margin-top: 2rem;
        }
        
        .stat-card {
            background: white;
            padding: 1.5rem;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            text-align: center;
        }
        
        .stat-value {
            font-size: 2rem;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 0.5rem;
        }
        
        .stat-label {
            color: #666;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>WeComBot API 文档</h1>
            <p>企业微信RAG智能问答机器人 - 接口文档与测试工具</p>
            <div style="margin-top: 1rem;">
                <span class="status-indicator" id="statusIndicator"></span>
                <span id="statusText">检查服务状态中...</span>
            </div>
        </div>
        
        <div class="nav-tabs">
            <button class="nav-tab active" onclick="showSection('overview')">概览</button>
            <button class="nav-tab" onclick="showSection('documents')">文档管理</button>
            <button class="nav-tab" onclick="showSection('search')">语义搜索</button>
            <button class="nav-tab" onclick="showSection('qa')">RAG问答</button>
            <button class="nav-tab" onclick="showSection('testing')">接口测试</button>
        </div>
        
        <div id="overview" class="content-section active">
            <h2>API 概览</h2>
            <p>WeComBot提供完整的文档管理和语义搜索功能，支持PDF、Word、Markdown文档的上传、处理和智能检索。</p>
            
            <div class="stats-grid" id="statsGrid">
                <div class="stat-card">
                    <div class="stat-value" id="totalDocs">-</div>
                    <div class="stat-label">总文档数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="totalChunks">-</div>
                    <div class="stat-label">文档块数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="vectorCount">-</div>
                    <div class="stat-label">向量索引数</div>
                </div>
                <div class="stat-card">
                    <div class="stat-value" id="avgResponseTime">-</div>
                    <div class="stat-label">平均响应时间(ms)</div>
                </div>
            </div>
            
            <h3 style="margin-top: 2rem;">基础信息</h3>
            <div class="code-block">
                <pre>Base URL: http://localhost:3000
API Version: v1.0.0
Content-Type: application/json
Character Encoding: UTF-8</pre>
            </div>
        </div>
        
        <div id="documents" class="content-section">
            <h2>文档管理接口</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-post">POST</span>
                    <span class="endpoint-path">/api/documents/upload</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">上传并处理文档文件</div>
                    <div class="code-block">
                        <pre>Content-Type: multipart/form-data

参数:
- document (file, required): 文档文件
- description (string, optional): 文档描述
- uploadedBy (string, optional): 上传者</pre>
                    </div>
                    <button class="try-it-btn" onclick="testUpload()">测试上传</button>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-get">GET</span>
                    <span class="endpoint-path">/api/documents</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">获取文档列表</div>
                    <div class="code-block">
                        <pre>查询参数:
- status: 处理状态 (pending/processing/completed/failed)
- fileType: 文件类型 (.pdf/.docx/.md)
- page: 页码 (默认1)
- limit: 每页数量 (默认20)</pre>
                    </div>
                    <button class="try-it-btn" onclick="testGetDocuments()">测试获取</button>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-get">GET</span>
                    <span class="endpoint-path">/api/documents/statistics</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">获取文档统计信息</div>
                    <button class="try-it-btn" onclick="testGetStats()">测试统计</button>
                </div>
            </div>
        </div>
        
        <div id="search" class="content-section">
            <h2>语义搜索接口</h2>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-post">POST</span>
                    <span class="endpoint-path">/api/search/semantic</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">执行语义搜索</div>
                    <div class="code-block">
                        <pre>{
  "query": "工作时间是什么时候",
  "topK": 5,
  "threshold": 0.3,
  "includeContent": true
}</pre>
                    </div>
                    <button class="try-it-btn" onclick="testSemanticSearch()">测试搜索</button>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-post">POST</span>
                    <span class="endpoint-path">/api/search/vectorize</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">文本向量化</div>
                    <div class="code-block">
                        <pre>{
  "text": "这是一个测试文本"
}</pre>
                    </div>
                    <button class="try-it-btn" onclick="testVectorize()">测试向量化</button>
                </div>
            </div>
            
            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-get">GET</span>
                    <span class="endpoint-path">/api/search/health</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">检查向量服务健康状态</div>
                    <button class="try-it-btn" onclick="testSearchHealth()">测试健康检查</button>
                </div>
            </div>
        </div>
        
        <div id="qa" class="content-section">
            <h2>RAG问答接口</h2>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-post">POST</span>
                    <span class="endpoint-path">/api/qa/ask</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">RAG智能问答 - 基于文档内容的智能问答</div>
                    <div class="code-block">
                        <pre>{
  "question": "企业微信自建应用是什么？",
  "topK": 5,
  "threshold": 0.3,
  "maxTokens": 2048,
  "temperature": 0.7
}</pre>
                    </div>
                    <button class="try-it-btn" onclick="testRAGAsk()">测试问答</button>
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-post">POST</span>
                    <span class="endpoint-path">/api/qa/batch</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">批量问答</div>
                    <div class="code-block">
                        <pre>{
  "questions": [
    "企业微信自建应用是什么？",
    "如何创建企业微信应用？"
  ]
}</pre>
                    </div>
                    <button class="try-it-btn" onclick="testBatchAsk()">测试批量问答</button>
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-post">POST</span>
                    <span class="endpoint-path">/api/qa/chat</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">直接LLM对话</div>
                    <div class="code-block">
                        <pre>{
  "message": "你好，请介绍一下企业微信的主要功能"
}</pre>
                    </div>
                    <button class="try-it-btn" onclick="testLLMChat()">测试对话</button>
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-get">GET</span>
                    <span class="endpoint-path">/api/qa/rag/status</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">获取RAG服务状态</div>
                    <button class="try-it-btn" onclick="testRAGStatus()">测试状态</button>
                </div>
            </div>

            <div class="endpoint">
                <div class="endpoint-header">
                    <span class="endpoint-method method-get">GET</span>
                    <span class="endpoint-path">/api/qa/health</span>
                </div>
                <div class="endpoint-body">
                    <div class="endpoint-description">RAG服务健康检查</div>
                    <button class="try-it-btn" onclick="testRAGHealth()">测试健康检查</button>
                </div>
            </div>
        </div>

        <div id="testing" class="content-section">
            <h2>接口测试工具</h2>
            <div style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin-bottom: 1rem;">
                <h3>测试结果</h3>
                <div id="testResults" style="font-family: 'Courier New', monospace; white-space: pre-wrap; max-height: 400px; overflow-y: auto;"></div>
            </div>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                <button class="try-it-btn" onclick="testHealth()">健康检查</button>
                <button class="try-it-btn" onclick="testGetDocuments()">获取文档列表</button>
                <button class="try-it-btn" onclick="testGetStats()">获取统计信息</button>
                <button class="try-it-btn" onclick="testSearchHealth()">搜索服务状态</button>
                <button class="try-it-btn" onclick="testRAGAsk()">RAG问答</button>
                <button class="try-it-btn" onclick="testLLMChat()">LLM对话</button>
                <button class="try-it-btn" onclick="testRAGStatus()">RAG状态</button>
                <button class="try-it-btn" onclick="testRAGHealth()">RAG健康检查</button>
            </div>
        </div>
    </div>

    <script>
        let testResults = document.getElementById('testResults');
        
        function showSection(sectionId) {
            // 隐藏所有内容区域
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // 移除所有标签的active状态
            document.querySelectorAll('.nav-tab').forEach(tab => {
                tab.classList.remove('active');
            });
            
            // 显示选中的内容区域
            document.getElementById(sectionId).classList.add('active');
            
            // 激活对应的标签
            event.target.classList.add('active');
        }
        
        function logResult(message) {
            const timestamp = new Date().toLocaleTimeString();
            testResults.textContent += \`[\${timestamp}] \${message}\\n\`;
            testResults.scrollTop = testResults.scrollHeight;
        }
        
        async function apiCall(url, options = {}) {
            try {
                const response = await fetch(url, options);
                const data = await response.json();
                return { success: response.ok, data, status: response.status };
            } catch (error) {
                return { success: false, error: error.message };
            }
        }
        
        async function testHealth() {
            logResult('测试健康检查...');
            const result = await apiCall('/health');
            logResult(JSON.stringify(result, null, 2));
        }
        
        async function testGetDocuments() {
            logResult('测试获取文档列表...');
            const result = await apiCall('/api/documents');
            logResult(JSON.stringify(result, null, 2));
        }
        
        async function testGetStats() {
            logResult('测试获取统计信息...');
            const result = await apiCall('/api/documents/statistics');
            logResult(JSON.stringify(result, null, 2));
            
            if (result.success && result.data.success) {
                updateStats(result.data.data);
            }
        }
        
        async function testSemanticSearch() {
            logResult('测试语义搜索...');
            const result = await apiCall('/api/search/semantic', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: '工作时间是什么时候',
                    topK: 3,
                    threshold: 0.3
                })
            });
            logResult(JSON.stringify(result, null, 2));
        }
        
        async function testVectorize() {
            logResult('测试文本向量化...');
            const result = await apiCall('/api/search/vectorize', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: '这是一个测试文本'
                })
            });
            logResult(JSON.stringify(result, null, 2));
        }
        
        async function testSearchHealth() {
            logResult('测试搜索服务健康状态...');
            const result = await apiCall('/api/search/health');
            logResult(JSON.stringify(result, null, 2));
        }

        async function testRAGAsk() {
            logResult('测试RAG智能问答...');
            const result = await apiCall('/api/qa/ask', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    question: '企业微信自建应用是什么？',
                    topK: 3,
                    threshold: 0.3
                })
            });
            logResult(JSON.stringify(result, null, 2));
        }

        async function testBatchAsk() {
            logResult('测试批量问答...');
            const result = await apiCall('/api/qa/batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    questions: [
                        '企业微信自建应用是什么？',
                        '如何创建企业微信应用？'
                    ]
                })
            });
            logResult(JSON.stringify(result, null, 2));
        }

        async function testLLMChat() {
            logResult('测试LLM直接对话...');
            const result = await apiCall('/api/qa/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: '你好，请简单介绍一下自己'
                })
            });
            logResult(JSON.stringify(result, null, 2));
        }

        async function testRAGStatus() {
            logResult('测试RAG服务状态...');
            const result = await apiCall('/api/qa/rag/status');
            logResult(JSON.stringify(result, null, 2));
        }

        async function testRAGHealth() {
            logResult('测试RAG服务健康检查...');
            const result = await apiCall('/api/qa/health');
            logResult(JSON.stringify(result, null, 2));
        }
        
        async function testUpload() {
            alert('文件上传需要通过文件选择器，请使用其他HTTP客户端工具测试');
        }
        
        function updateStats(stats) {
            document.getElementById('totalDocs').textContent = stats.totalDocuments || 0;
            document.getElementById('totalChunks').textContent = stats.totalChunks || 0;
            document.getElementById('vectorCount').textContent = stats.totalChunks || 0;
            document.getElementById('avgResponseTime').textContent = '< 200';
        }
        
        async function checkServiceStatus() {
            const result = await apiCall('/health');
            const statusIndicator = document.getElementById('statusIndicator');
            const statusText = document.getElementById('statusText');
            
            if (result.success) {
                statusIndicator.className = 'status-indicator status-online';
                statusText.textContent = '服务在线';
            } else {
                statusIndicator.className = 'status-indicator status-offline';
                statusText.textContent = '服务离线';
            }
        }
        
        // 页面加载时检查服务状态和获取统计信息
        window.addEventListener('load', () => {
            checkServiceStatus();
            testGetStats();
            // 检查RAG服务状态
            testRAGStatus();
        });
        
        // 每30秒检查一次服务状态
        setInterval(checkServiceStatus, 30000);
    </script>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(htmlContent);
  } catch (error) {
    console.error('生成API文档页面失败:', error);
    res.status(500).json({
      success: false,
      error: '生成API文档页面失败',
      details: error.message
    });
  }
});

/**
 * @route GET /api/docs/markdown
 * @desc 获取Markdown格式的API文档
 * @access Public
 */
router.get('/markdown', async (req, res) => {
  try {
    const docPath = path.join(__dirname, '../../API接口文档.md');
    const content = await fs.readFile(docPath, 'utf-8');
    
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.send(content);
  } catch (error) {
    console.error('读取API文档失败:', error);
    res.status(500).json({
      success: false,
      error: '读取API文档失败',
      details: error.message
    });
  }
});

/**
 * @route GET /api/docs/json
 * @desc 获取JSON格式的API文档结构
 * @access Public
 */
router.get('/json', (req, res) => {
  const apiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'WeComBot API',
      version: '1.0.0',
      description: '企业微信RAG智能问答机器人API',
      contact: {
        name: 'WeComBot Team'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: '开发服务器'
      }
    ],
    paths: {
      '/health': {
        get: {
          summary: '健康检查',
          responses: {
            '200': {
              description: '服务正常',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string' },
                      timestamp: { type: 'string' },
                      version: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/documents/upload': {
        post: {
          summary: '上传文档',
          requestBody: {
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    document: {
                      type: 'string',
                      format: 'binary'
                    },
                    description: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '上传成功'
            }
          }
        }
      },
      '/api/search/semantic': {
        post: {
          summary: '语义搜索',
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    query: { type: 'string' },
                    topK: { type: 'integer' },
                    threshold: { type: 'number' }
                  }
                }
              }
            }
          },
          responses: {
            '200': {
              description: '搜索成功'
            }
          }
        }
      }
    }
  };

  res.json(apiSpec);
});

module.exports = router;
