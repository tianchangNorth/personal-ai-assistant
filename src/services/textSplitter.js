const config = require('../config');

class TextSplitter {
  constructor(options = {}) {
    this.chunkSize = options.chunkSize || config.textProcessing.chunkSize;
    this.chunkOverlap = options.chunkOverlap || config.textProcessing.chunkOverlap;
    this.separators = options.separators || ['\n\n', '\n', '。', '！', '？', ';', '；', '.', '!', '?'];
  }

  /**
   * 将文本分割为语义完整的块
   * @param {string} text - 输入文本
   * @param {Object} metadata - 文档元数据
   * @returns {Array} 文本块数组
   */
  splitText(text, metadata = {}) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const chunks = [];
    const textLength = text.length;
    
    // 如果文本长度小于chunk大小，直接返回
    if (textLength <= this.chunkSize) {
      return [{
        text: text.trim(),
        index: 0,
        startPos: 0,
        endPos: textLength,
        metadata: {
          ...metadata,
          chunkSize: textLength,
          isComplete: true
        }
      }];
    }

    let startPos = 0;
    let chunkIndex = 0;

    while (startPos < textLength) {
      const endPos = Math.min(startPos + this.chunkSize, textLength);
      
      // 尝试在合适的位置分割
      const chunk = this.findOptimalSplit(text, startPos, endPos);
      
      if (chunk.text.trim().length > 0) {
        chunks.push({
          text: chunk.text.trim(),
          index: chunkIndex++,
          startPos: chunk.startPos,
          endPos: chunk.endPos,
          metadata: {
            ...metadata,
            chunkSize: chunk.text.length,
            isComplete: chunk.endPos >= textLength,
            hasOverlap: chunk.startPos > 0 && chunk.startPos < startPos + this.chunkOverlap
          }
        });
      }

      // 计算下一个块的起始位置（考虑重叠）
      const nextStart = Math.max(
        chunk.endPos - this.chunkOverlap,
        chunk.startPos + 1
      );
      
      if (nextStart >= textLength || nextStart <= startPos) {
        break;
      }
      
      startPos = nextStart;
    }

    return chunks;
  }

  /**
   * 寻找最佳分割点
   * @param {string} text - 文本
   * @param {number} startPos - 起始位置
   * @param {number} endPos - 结束位置
   * @returns {Object} 分割结果
   */
  findOptimalSplit(text, startPos, endPos) {
    const originalEndPos = endPos;
    
    // 如果已经到达文本末尾，直接返回
    if (endPos >= text.length) {
      return {
        text: text.substring(startPos),
        startPos,
        endPos: text.length
      };
    }

    // 尝试在分隔符处分割
    for (const separator of this.separators) {
      const splitPos = this.findLastSeparator(text, startPos, endPos, separator);
      if (splitPos > startPos) {
        // 确保分割后的文本不会太短
        const chunkText = text.substring(startPos, splitPos + separator.length);
        if (chunkText.trim().length >= this.chunkSize * 0.3) {
          return {
            text: chunkText,
            startPos,
            endPos: splitPos + separator.length
          };
        }
      }
    }

    // 如果找不到合适的分隔符，尝试在空格处分割
    const spacePos = this.findLastSpace(text, startPos, endPos);
    if (spacePos > startPos) {
      return {
        text: text.substring(startPos, spacePos),
        startPos,
        endPos: spacePos
      };
    }

    // 如果都找不到，在字符边界强制分割
    return {
      text: text.substring(startPos, originalEndPos),
      startPos,
      endPos: originalEndPos
    };
  }

  /**
   * 查找最后一个分隔符的位置
   * @param {string} text - 文本
   * @param {number} startPos - 起始位置
   * @param {number} endPos - 结束位置
   * @param {string} separator - 分隔符
   * @returns {number} 分隔符位置，-1表示未找到
   */
  findLastSeparator(text, startPos, endPos, separator) {
    const searchText = text.substring(startPos, endPos);
    const lastIndex = searchText.lastIndexOf(separator);
    
    if (lastIndex === -1) {
      return -1;
    }
    
    return startPos + lastIndex;
  }

  /**
   * 查找最后一个空格的位置
   * @param {string} text - 文本
   * @param {number} startPos - 起始位置
   * @param {number} endPos - 结束位置
   * @returns {number} 空格位置，-1表示未找到
   */
  findLastSpace(text, startPos, endPos) {
    for (let i = endPos - 1; i > startPos; i--) {
      if (/\s/.test(text[i])) {
        return i;
      }
    }
    return -1;
  }

  /**
   * 按段落分割文本
   * @param {string} text - 输入文本
   * @param {Object} metadata - 文档元数据
   * @returns {Array} 段落数组
   */
  splitByParagraphs(text, metadata = {}) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    const paragraphs = text
      .split(/\n\s*\n/) // 按双换行分割段落
      .map((paragraph, index) => paragraph.trim())
      .filter(paragraph => paragraph.length > 0)
      .map((paragraph, index) => ({
        text: paragraph,
        index,
        metadata: {
          ...metadata,
          type: 'paragraph',
          length: paragraph.length
        }
      }));

    return paragraphs;
  }

  /**
   * 按句子分割文本
   * @param {string} text - 输入文本
   * @param {Object} metadata - 文档元数据
   * @returns {Array} 句子数组
   */
  splitBySentences(text, metadata = {}) {
    if (!text || text.trim().length === 0) {
      return [];
    }

    // 中文和英文句子分割的正则表达式
    const sentenceRegex = /[^。！？.!?]*[。！？.!?]+/g;
    const sentences = text.match(sentenceRegex) || [];

    return sentences
      .map((sentence, index) => sentence.trim())
      .filter(sentence => sentence.length > 0)
      .map((sentence, index) => ({
        text: sentence,
        index,
        metadata: {
          ...metadata,
          type: 'sentence',
          length: sentence.length
        }
      }));
  }

  /**
   * 智能分割：结合多种策略
   * @param {string} text - 输入文本
   * @param {Object} metadata - 文档元数据
   * @param {Object} options - 分割选项
   * @returns {Array} 文本块数组
   */
  smartSplit(text, metadata = {}, options = {}) {
    const strategy = options.strategy || 'auto';
    
    switch (strategy) {
      case 'paragraph':
        return this.splitByParagraphs(text, metadata);
      case 'sentence':
        return this.splitBySentences(text, metadata);
      case 'fixed':
        return this.splitText(text, metadata);
      case 'auto':
      default:
        // 自动选择最佳策略
        return this.autoSelectStrategy(text, metadata);
    }
  }

  /**
   * 自动选择分割策略
   * @param {string} text - 输入文本
   * @param {Object} metadata - 文档元数据
   * @returns {Array} 文本块数组
   */
  autoSelectStrategy(text, metadata = {}) {
    const textLength = text.length;
    const paragraphCount = (text.match(/\n\s*\n/g) || []).length + 1;
    const avgParagraphLength = textLength / paragraphCount;

    // 如果平均段落长度接近chunk大小，使用段落分割
    if (avgParagraphLength >= this.chunkSize * 0.7 && avgParagraphLength <= this.chunkSize * 1.3) {
      return this.splitByParagraphs(text, metadata);
    }

    // 如果文本较短，使用句子分割
    if (textLength < this.chunkSize * 2) {
      return this.splitBySentences(text, metadata);
    }

    // 默认使用固定大小分割
    return this.splitText(text, metadata);
  }

  /**
   * 合并小块
   * @param {Array} chunks - 文本块数组
   * @param {number} minSize - 最小块大小
   * @returns {Array} 合并后的文本块数组
   */
  mergeSmallChunks(chunks, minSize = null) {
    if (!minSize) {
      minSize = Math.floor(this.chunkSize * 0.3);
    }

    const mergedChunks = [];
    let currentChunk = null;

    for (const chunk of chunks) {
      if (!currentChunk) {
        currentChunk = { ...chunk };
        continue;
      }

      // 如果当前块太小，尝试与下一块合并
      if (currentChunk.text.length < minSize && 
          currentChunk.text.length + chunk.text.length <= this.chunkSize) {
        currentChunk.text += '\n' + chunk.text;
        currentChunk.endPos = chunk.endPos;
        currentChunk.metadata.chunkSize = currentChunk.text.length;
      } else {
        mergedChunks.push(currentChunk);
        currentChunk = { ...chunk };
      }
    }

    if (currentChunk) {
      mergedChunks.push(currentChunk);
    }

    // 重新编号
    return mergedChunks.map((chunk, index) => ({
      ...chunk,
      index
    }));
  }

  /**
   * 获取分割统计信息
   * @param {Array} chunks - 文本块数组
   * @returns {Object} 统计信息
   */
  getStatistics(chunks) {
    if (!chunks || chunks.length === 0) {
      return {
        totalChunks: 0,
        totalLength: 0,
        avgChunkSize: 0,
        minChunkSize: 0,
        maxChunkSize: 0
      };
    }

    const lengths = chunks.map(chunk => chunk.text.length);
    const totalLength = lengths.reduce((sum, len) => sum + len, 0);

    return {
      totalChunks: chunks.length,
      totalLength,
      avgChunkSize: Math.round(totalLength / chunks.length),
      minChunkSize: Math.min(...lengths),
      maxChunkSize: Math.max(...lengths),
      chunkSizeDistribution: this.getChunkSizeDistribution(lengths)
    };
  }

  /**
   * 获取块大小分布
   * @param {Array} lengths - 长度数组
   * @returns {Object} 分布统计
   */
  getChunkSizeDistribution(lengths) {
    const ranges = [
      { min: 0, max: 100, count: 0 },
      { min: 100, max: 200, count: 0 },
      { min: 200, max: 300, count: 0 },
      { min: 300, max: 400, count: 0 },
      { min: 400, max: Infinity, count: 0 }
    ];

    lengths.forEach(length => {
      for (const range of ranges) {
        if (length >= range.min && length < range.max) {
          range.count++;
          break;
        }
      }
    });

    return ranges;
  }
}

module.exports = TextSplitter;
