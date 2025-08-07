const database = require('./database');

class DocumentModel {
  /**
   * 创建文档记录
   * @param {Object} documentData - 文档数据
   * @returns {Promise<number>} 文档ID
   */
  async createDocument(documentData) {
    const {
      filename,
      originalName,
      filePath,
      fileType,
      fileSize,
      mimeType,
      metadata = {}
    } = documentData;

    const sql = `
      INSERT INTO documents (
        filename, original_name, file_path, file_type, 
        file_size, mime_type, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await database.run(sql, [
      filename,
      originalName,
      filePath,
      fileType,
      fileSize,
      mimeType,
      JSON.stringify(metadata)
    ]);

    return result.id;
  }

  /**
   * 更新文档处理状态
   * @param {number} documentId - 文档ID
   * @param {string} status - 处理状态
   * @param {string} error - 错误信息（可选）
   */
  async updateProcessingStatus(documentId, status, error = null) {
    const sql = `
      UPDATE documents 
      SET processing_status = ?, 
          processing_error = ?,
          processed_time = CASE WHEN ? = 'completed' THEN CURRENT_TIMESTAMP ELSE processed_time END,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await database.run(sql, [status, error, status, documentId]);
  }

  /**
   * 获取文档信息
   * @param {number} documentId - 文档ID
   * @returns {Promise<Object>} 文档信息
   */
  async getDocument(documentId) {
    const sql = 'SELECT * FROM documents WHERE id = ?';
    const document = await database.get(sql, [documentId]);
    
    if (document && document.metadata) {
      document.metadata = JSON.parse(document.metadata);
    }
    
    return document;
  }

  /**
   * 获取文档列表
   * @param {Object} options - 查询选项
   * @returns {Promise<Array>} 文档列表
   */
  async getDocuments(options = {}) {
    const {
      status,
      fileType,
      limit = 50,
      offset = 0,
      orderBy = 'created_at',
      orderDir = 'DESC'
    } = options;

    let sql = 'SELECT * FROM documents WHERE 1=1';
    const params = [];

    if (status) {
      sql += ' AND processing_status = ?';
      params.push(status);
    }

    if (fileType) {
      sql += ' AND file_type = ?';
      params.push(fileType);
    }

    sql += ` ORDER BY ${orderBy} ${orderDir} LIMIT ? OFFSET ?`;
    params.push(limit, offset);

    const documents = await database.all(sql, params);
    
    return documents.map(doc => {
      if (doc.metadata) {
        doc.metadata = JSON.parse(doc.metadata);
      }
      return doc;
    });
  }

  /**
   * 删除文档
   * @param {number} documentId - 文档ID
   */
  async deleteDocument(documentId) {
    // 由于外键约束，删除文档时会自动删除相关的块和向量索引
    // 简化为直接删除，避免事务问题
    try {
      // 删除文档记录（外键约束会自动删除相关数据）
      await database.run('DELETE FROM documents WHERE id = ?', [documentId]);
    } catch (error) {
      console.error('删除文档失败:', error);
      throw error;
    }
  }

  /**
   * 保存文档块
   * @param {number} documentId - 文档ID
   * @param {Array} chunks - 文档块数组
   */
  async saveDocumentChunks(documentId, chunks) {
    try {
      // 先删除已存在的块
      await database.run('DELETE FROM document_chunks WHERE document_id = ?', [documentId]);

      // 插入新的块
      const sql = `
        INSERT INTO document_chunks (
          document_id, chunk_index, content, start_pos,
          end_pos, chunk_size, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `;

      for (const chunk of chunks) {
        await database.run(sql, [
          documentId,
          chunk.index,
          chunk.text,
          chunk.startPos,
          chunk.endPos,
          chunk.text.length,
          JSON.stringify(chunk.metadata || {})
        ]);
      }
    } catch (error) {
      console.error('保存文档块失败:', error);
      throw error;
    }
  }

  /**
   * 获取文档块
   * @param {number} documentId - 文档ID
   * @returns {Promise<Array>} 文档块列表
   */
  async getDocumentChunks(documentId) {
    const sql = `
      SELECT * FROM document_chunks 
      WHERE document_id = ? 
      ORDER BY chunk_index
    `;
    
    const chunks = await database.all(sql, [documentId]);
    
    return chunks.map(chunk => {
      if (chunk.metadata) {
        chunk.metadata = JSON.parse(chunk.metadata);
      }
      return chunk;
    });
  }

  /**
   * 获取所有文档块（用于向量化）
   * @returns {Promise<Array>} 所有文档块
   */
  async getAllChunks() {
    const sql = `
      SELECT dc.*, d.filename, d.original_name, d.file_type
      FROM document_chunks dc
      JOIN documents d ON dc.document_id = d.id
      WHERE d.processing_status = 'completed'
      ORDER BY dc.document_id, dc.chunk_index
    `;
    
    const chunks = await database.all(sql);
    
    return chunks.map(chunk => {
      if (chunk.metadata) {
        chunk.metadata = JSON.parse(chunk.metadata);
      }
      return chunk;
    });
  }

  /**
   * 更新块的向量ID
   * @param {number} chunkId - 块ID
   * @param {string} vectorId - 向量ID
   */
  async updateChunkVectorId(chunkId, vectorId) {
    const sql = 'UPDATE document_chunks SET vector_id = ? WHERE id = ?';
    await database.run(sql, [vectorId, chunkId]);
  }

  /**
   * 获取文档统计信息
   * @returns {Promise<Object>} 统计信息
   */
  async getStatistics() {
    const totalDocs = await database.get('SELECT COUNT(*) as count FROM documents');
    const processedDocs = await database.get('SELECT COUNT(*) as count FROM documents WHERE processing_status = "completed"');
    const totalChunks = await database.get('SELECT COUNT(*) as count FROM document_chunks');
    const avgChunkSize = await database.get('SELECT AVG(chunk_size) as avg FROM document_chunks');
    
    const fileTypeStats = await database.all(`
      SELECT file_type, COUNT(*) as count 
      FROM documents 
      GROUP BY file_type
    `);

    const statusStats = await database.all(`
      SELECT processing_status, COUNT(*) as count 
      FROM documents 
      GROUP BY processing_status
    `);

    return {
      totalDocuments: totalDocs.count,
      processedDocuments: processedDocs.count,
      totalChunks: totalChunks.count,
      averageChunkSize: Math.round(avgChunkSize.avg || 0),
      fileTypeDistribution: fileTypeStats,
      statusDistribution: statusStats
    };
  }

  /**
   * 搜索文档
   * @param {string} query - 搜索关键词
   * @param {Object} options - 搜索选项
   * @returns {Promise<Array>} 搜索结果
   */
  async searchDocuments(query, options = {}) {
    const { limit = 10, offset = 0 } = options;
    
    const sql = `
      SELECT DISTINCT d.*, 
             snippet(documents_fts, 1, '<mark>', '</mark>', '...', 32) as snippet
      FROM documents d
      JOIN documents_fts ON d.id = documents_fts.rowid
      WHERE documents_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `;
    
    // 创建FTS表（如果不存在）
    await this.createFTSTable();
    
    const results = await database.all(sql, [query, limit, offset]);
    
    return results.map(doc => {
      if (doc.metadata) {
        doc.metadata = JSON.parse(doc.metadata);
      }
      return doc;
    });
  }

  /**
   * 创建全文搜索表
   */
  async createFTSTable() {
    try {
      await database.run(`
        CREATE VIRTUAL TABLE IF NOT EXISTS documents_fts USING fts5(
          filename, original_name, content='documents', content_rowid='id'
        )
      `);
      
      // 同步数据
      await database.run(`
        INSERT OR REPLACE INTO documents_fts(rowid, filename, original_name)
        SELECT id, filename, original_name FROM documents
      `);
    } catch (error) {
      console.warn('FTS表创建失败:', error.message);
    }
  }
}

module.exports = new DocumentModel();
