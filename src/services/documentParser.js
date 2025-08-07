const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const mammoth = require('mammoth');
const MarkdownIt = require('markdown-it');
const config = require('../config');

class DocumentParser {
  constructor() {
    this.md = new MarkdownIt();
    this.supportedTypes = {
      '.pdf': this.parsePDF.bind(this),
      '.docx': this.parseWord.bind(this),
      '.md': this.parseMarkdown.bind(this),
      '.markdown': this.parseMarkdown.bind(this)
    };
  }

  /**
   * 解析文档的主入口方法
   * @param {string} filePath - 文件路径
   * @param {Object} metadata - 文件元数据
   * @returns {Promise<Object>} 解析结果
   */
  async parseDocument(filePath, metadata = {}) {
    try {
      const ext = path.extname(filePath).toLowerCase();
      
      if (!this.supportedTypes[ext]) {
        throw new Error(`不支持的文件类型: ${ext}`);
      }

      const startTime = Date.now();
      const buffer = await fs.readFile(filePath);
      
      // 调用对应的解析方法
      const parseResult = await this.supportedTypes[ext](buffer, filePath);
      
      const processingTime = Date.now() - startTime;
      
      return {
        success: true,
        metadata: {
          ...metadata,
          fileName: path.basename(filePath),
          fileSize: buffer.length,
          fileType: ext,
          processingTime,
          parsedAt: new Date().toISOString()
        },
        content: parseResult.text,
        structure: parseResult.structure || null,
        pageCount: parseResult.pageCount || 1,
        wordCount: this.countWords(parseResult.text)
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        metadata: {
          ...metadata,
          fileName: path.basename(filePath),
          parsedAt: new Date().toISOString()
        }
      };
    }
  }

  /**
   * 解析PDF文档
   * @param {Buffer} buffer - 文件缓冲区
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parsePDF(buffer, filePath) {
    try {
      const data = await pdfParse(buffer, {
        // PDF解析选项
        max: 0, // 解析所有页面
        version: 'v1.10.100'
      });

      // 清理文本内容
      const cleanText = this.cleanText(data.text);
      
      return {
        text: cleanText,
        pageCount: data.numpages,
        structure: this.extractPDFStructure(data.text),
        info: data.info
      };
    } catch (error) {
      throw new Error(`PDF解析失败: ${error.message}`);
    }
  }

  /**
   * 解析Word文档
   * @param {Buffer} buffer - 文件缓冲区
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parseWord(buffer, filePath) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      
      if (result.messages && result.messages.length > 0) {
        console.warn('Word解析警告:', result.messages);
      }

      const cleanText = this.cleanText(result.value);
      
      return {
        text: cleanText,
        structure: this.extractWordStructure(cleanText),
        warnings: result.messages
      };
    } catch (error) {
      throw new Error(`Word文档解析失败: ${error.message}`);
    }
  }

  /**
   * 解析Markdown文档
   * @param {Buffer} buffer - 文件缓冲区
   * @param {string} filePath - 文件路径
   * @returns {Promise<Object>} 解析结果
   */
  async parseMarkdown(buffer, filePath) {
    try {
      const content = buffer.toString('utf-8');
      
      // 解析Markdown结构
      const tokens = this.md.parse(content, {});
      const structure = this.extractMarkdownStructure(tokens);
      
      // 转换为纯文本
      const htmlContent = this.md.render(content);
      const plainText = this.htmlToText(htmlContent);
      const cleanText = this.cleanText(plainText);
      
      return {
        text: cleanText,
        structure,
        originalContent: content,
        tokens
      };
    } catch (error) {
      throw new Error(`Markdown解析失败: ${error.message}`);
    }
  }

  /**
   * 清理文本内容
   * @param {string} text - 原始文本
   * @returns {string} 清理后的文本
   */
  cleanText(text) {
    if (!text) return '';

    return text
      // 移除特殊字符
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
      // 规范化换行符
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // 移除多余的换行
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      // 移除多余的空白字符（但保留换行）
      .replace(/[ \t]+/g, ' ')
      // 去除首尾空白
      .trim();
  }

  /**
   * 提取PDF文档结构
   * @param {string} text - PDF文本内容
   * @returns {Array} 文档结构
   */
  extractPDFStructure(text) {
    const structure = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0) {
        // 简单的标题识别（可以根据需要改进）
        if (this.isLikelyTitle(trimmedLine)) {
          structure.push({
            type: 'heading',
            content: trimmedLine,
            line: index + 1
          });
        }
      }
    });
    
    return structure;
  }

  /**
   * 提取Word文档结构
   * @param {string} text - Word文本内容
   * @returns {Array} 文档结构
   */
  extractWordStructure(text) {
    const structure = [];
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (trimmedLine.length > 0 && this.isLikelyTitle(trimmedLine)) {
        structure.push({
          type: 'heading',
          content: trimmedLine,
          line: index + 1
        });
      }
    });
    
    return structure;
  }

  /**
   * 提取Markdown文档结构
   * @param {Array} tokens - Markdown tokens
   * @returns {Array} 文档结构
   */
  extractMarkdownStructure(tokens) {
    const structure = [];
    
    tokens.forEach((token, index) => {
      if (token.type === 'heading_open') {
        const contentToken = tokens[index + 1];
        if (contentToken && contentToken.type === 'inline') {
          structure.push({
            type: 'heading',
            level: parseInt(token.tag.substring(1)), // h1 -> 1, h2 -> 2, etc.
            content: contentToken.content,
            line: token.map ? token.map[0] + 1 : null
          });
        }
      }
    });
    
    return structure;
  }

  /**
   * 判断是否可能是标题
   * @param {string} text - 文本内容
   * @returns {boolean} 是否是标题
   */
  isLikelyTitle(text) {
    // 简单的标题识别规则
    return (
      text.length < 100 && // 标题通常较短
      text.length > 2 && // 但不能太短
      !/[.。]$/.test(text) && // 不以句号结尾
      /^[\u4e00-\u9fa5\w\s\d第一二三四五六七八九十章节条款]+/.test(text) // 包含中文或数字编号
    );
  }

  /**
   * HTML转纯文本
   * @param {string} html - HTML内容
   * @returns {string} 纯文本
   */
  htmlToText(html) {
    return html
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ') // 替换HTML实体
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"');
  }

  /**
   * 统计字数
   * @param {string} text - 文本内容
   * @returns {number} 字数
   */
  countWords(text) {
    if (!text) return 0;
    
    // 中文字符统计
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文单词统计
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    
    return chineseChars + englishWords;
  }

  /**
   * 获取支持的文件类型
   * @returns {Array} 支持的文件扩展名
   */
  getSupportedTypes() {
    return Object.keys(this.supportedTypes);
  }
}

module.exports = DocumentParser;
