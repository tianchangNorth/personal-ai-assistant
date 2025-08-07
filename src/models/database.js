const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const config = require('../config');

class Database {
  constructor() {
    this.db = null;
    this.dbPath = config.database.path;
  }

  /**
   * 初始化数据库连接
   */
  async initialize() {
    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(this.dbPath);
      await fs.mkdir(dbDir, { recursive: true });

      // 创建数据库连接
      this.db = new sqlite3.Database(this.dbPath);
      
      // 启用外键约束
      await this.run('PRAGMA foreign_keys = ON');
      
      // 创建表结构
      await this.createTables();
      
      console.log('数据库初始化成功:', this.dbPath);
    } catch (error) {
      console.error('数据库初始化失败:', error);
      throw error;
    }
  }

  /**
   * 创建数据库表
   */
  async createTables() {
    // 文档表
    await this.run(`
      CREATE TABLE IF NOT EXISTS documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT,
        upload_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        processed_time DATETIME,
        processing_status TEXT DEFAULT 'pending',
        processing_error TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 文档块表
    await this.run(`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        document_id INTEGER NOT NULL,
        chunk_index INTEGER NOT NULL,
        content TEXT NOT NULL,
        start_pos INTEGER,
        end_pos INTEGER,
        chunk_size INTEGER,
        metadata TEXT,
        vector_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (document_id) REFERENCES documents (id) ON DELETE CASCADE
      )
    `);

    // 向量索引表
    await this.run(`
      CREATE TABLE IF NOT EXISTS vector_index (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        chunk_id INTEGER NOT NULL,
        vector_data BLOB,
        dimension INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chunk_id) REFERENCES document_chunks (id) ON DELETE CASCADE
      )
    `);

    // 查询历史表
    await this.run(`
      CREATE TABLE IF NOT EXISTS query_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT,
        question TEXT NOT NULL,
        answer TEXT,
        matched_chunks TEXT,
        response_time INTEGER,
        satisfaction_score INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 创建索引
    await this.run('CREATE INDEX IF NOT EXISTS idx_documents_status ON documents (processing_status)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_chunks_document ON document_chunks (document_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_query_history_user ON query_history (user_id)');
    await this.run('CREATE INDEX IF NOT EXISTS idx_query_history_time ON query_history (created_at)');
  }

  /**
   * 执行SQL语句
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise} 执行结果
   */
  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, changes: this.changes });
        }
      });
    });
  }

  /**
   * 查询单条记录
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise} 查询结果
   */
  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  /**
   * 查询多条记录
   * @param {string} sql - SQL语句
   * @param {Array} params - 参数
   * @returns {Promise} 查询结果
   */
  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      });
    });
  }

  /**
   * 开始事务
   */
  async beginTransaction() {
    await this.run('BEGIN TRANSACTION');
  }

  /**
   * 提交事务
   */
  async commit() {
    await this.run('COMMIT');
  }

  /**
   * 回滚事务
   */
  async rollback() {
    await this.run('ROLLBACK');
  }

  /**
   * 关闭数据库连接
   */
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('数据库连接已关闭');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

// 创建单例实例
const database = new Database();

module.exports = database;
