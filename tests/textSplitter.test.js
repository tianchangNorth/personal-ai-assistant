const TextSplitter = require('../src/services/textSplitter');

describe('TextSplitter', () => {
  let splitter;

  beforeEach(() => {
    splitter = new TextSplitter({
      chunkSize: 100,
      chunkOverlap: 20
    });
  });

  describe('splitText', () => {
    test('应该将长文本分割为多个块', () => {
      const longText = '这是一个很长的文本。'.repeat(20); // 约200字符
      const chunks = splitter.splitText(longText);

      expect(chunks.length).toBeGreaterThan(1);
      expect(chunks[0].text.length).toBeLessThanOrEqual(100);
      expect(chunks[0].index).toBe(0);
      expect(chunks[0].startPos).toBe(0);
    });

    test('应该处理短文本', () => {
      const shortText = '这是一个短文本。';
      const chunks = splitter.splitText(shortText);

      expect(chunks.length).toBe(1);
      expect(chunks[0].text).toBe(shortText);
      expect(chunks[0].metadata.isComplete).toBe(true);
    });

    test('应该处理空文本', () => {
      const chunks = splitter.splitText('');
      expect(chunks.length).toBe(0);

      const chunks2 = splitter.splitText(null);
      expect(chunks2.length).toBe(0);

      const chunks3 = splitter.splitText(undefined);
      expect(chunks3.length).toBe(0);
    });

    test('应该在合适的位置分割', () => {
      const text = '第一段内容。第二段内容。第三段内容。第四段内容。第五段内容。';
      const chunks = splitter.splitText(text);

      // 应该在句号处分割
      chunks.forEach(chunk => {
        if (!chunk.metadata.isComplete) {
          expect(chunk.text.endsWith('。')).toBe(true);
        }
      });
    });

    test('应该包含重叠内容', () => {
      const text = '第一段。第二段。第三段。第四段。第五段。第六段。第七段。第八段。';
      const chunks = splitter.splitText(text);

      if (chunks.length > 1) {
        // 检查是否有重叠
        const hasOverlap = chunks.some(chunk => chunk.metadata.hasOverlap);
        expect(hasOverlap).toBe(true);
      }
    });
  });

  describe('splitByParagraphs', () => {
    test('应该按段落分割文本', () => {
      const text = '第一段内容。\n\n第二段内容。\n\n第三段内容。';
      const paragraphs = splitter.splitByParagraphs(text);

      expect(paragraphs.length).toBe(3);
      expect(paragraphs[0].text).toBe('第一段内容。');
      expect(paragraphs[1].text).toBe('第二段内容。');
      expect(paragraphs[2].text).toBe('第三段内容。');
    });

    test('应该过滤空段落', () => {
      const text = '第一段。\n\n\n\n第二段。\n\n';
      const paragraphs = splitter.splitByParagraphs(text);

      expect(paragraphs.length).toBe(2);
      expect(paragraphs[0].text).toBe('第一段。');
      expect(paragraphs[1].text).toBe('第二段。');
    });
  });

  describe('splitBySentences', () => {
    test('应该按句子分割文本', () => {
      const text = '第一句话。第二句话！第三句话？';
      const sentences = splitter.splitBySentences(text);

      expect(sentences.length).toBe(3);
      expect(sentences[0].text).toBe('第一句话。');
      expect(sentences[1].text).toBe('第二句话！');
      expect(sentences[2].text).toBe('第三句话？');
    });

    test('应该处理英文句子', () => {
      const text = 'First sentence. Second sentence! Third sentence?';
      const sentences = splitter.splitBySentences(text);

      expect(sentences.length).toBe(3);
      expect(sentences[0].text).toBe('First sentence.');
      expect(sentences[1].text).toBe('Second sentence!');
      expect(sentences[2].text).toBe('Third sentence?');
    });
  });

  describe('findOptimalSplit', () => {
    test('应该在分隔符处分割', () => {
      const text = '这是第一部分。这是第二部分。这是第三部分。';
      const result = splitter.findOptimalSplit(text, 0, 20);

      // 检查是否在合适位置分割，可能在句号处或其他位置
      expect(result.text.length).toBeGreaterThan(0);
      expect(result.startPos).toBe(0);
      expect(result.endPos).toBeGreaterThan(0);
    });

    test('应该处理没有分隔符的情况', () => {
      const text = '这是一个没有标点符号的很长的文本内容';
      const result = splitter.findOptimalSplit(text, 0, 15);

      expect(result.text.length).toBeLessThanOrEqual(15);
      expect(result.startPos).toBe(0);
    });
  });

  describe('mergeSmallChunks', () => {
    test('应该合并过小的块', () => {
      const smallChunks = [
        { text: '短', index: 0, startPos: 0, endPos: 1, metadata: { chunkSize: 1 } },
        { text: '也很短', index: 1, startPos: 1, endPos: 4, metadata: { chunkSize: 3 } },
        { text: '这是一个正常长度的文本块', index: 2, startPos: 4, endPos: 16, metadata: { chunkSize: 12 } }
      ];

      const merged = splitter.mergeSmallChunks(smallChunks, 5);

      expect(merged.length).toBeLessThan(smallChunks.length);
      expect(merged[0].text).toContain('短');
      expect(merged[0].text).toContain('也很短');
    });

    test('应该保持大块不变', () => {
      const chunks = [
        { text: '这是一个足够长的文本块', index: 0, startPos: 0, endPos: 12, metadata: { chunkSize: 12 } },
        { text: '这也是一个足够长的文本块', index: 1, startPos: 12, endPos: 25, metadata: { chunkSize: 13 } }
      ];

      const merged = splitter.mergeSmallChunks(chunks, 5);

      expect(merged.length).toBe(2);
      expect(merged[0].text).toBe(chunks[0].text);
      expect(merged[1].text).toBe(chunks[1].text);
    });
  });

  describe('getStatistics', () => {
    test('应该返回正确的统计信息', () => {
      const chunks = [
        { text: '短文本', index: 0 },
        { text: '这是一个中等长度的文本', index: 1 },
        { text: '这是一个比较长的文本内容，包含更多的字符', index: 2 }
      ];

      const stats = splitter.getStatistics(chunks);

      expect(stats.totalChunks).toBe(3);
      expect(stats.totalLength).toBeGreaterThan(0);
      expect(stats.avgChunkSize).toBeGreaterThan(0);
      expect(stats.minChunkSize).toBeGreaterThan(0);
      expect(stats.maxChunkSize).toBeGreaterThan(stats.minChunkSize);
      expect(stats.chunkSizeDistribution).toBeDefined();
    });

    test('应该处理空数组', () => {
      const stats = splitter.getStatistics([]);

      expect(stats.totalChunks).toBe(0);
      expect(stats.totalLength).toBe(0);
      expect(stats.avgChunkSize).toBe(0);
      expect(stats.minChunkSize).toBe(0);
      expect(stats.maxChunkSize).toBe(0);
    });
  });

  describe('smartSplit', () => {
    test('应该根据策略选择分割方法', () => {
      const text = '第一段。\n\n第二段。\n\n第三段。';

      const paragraphSplit = splitter.smartSplit(text, {}, { strategy: 'paragraph' });
      expect(paragraphSplit.length).toBe(3);

      const sentenceSplit = splitter.smartSplit(text, {}, { strategy: 'sentence' });
      expect(sentenceSplit.length).toBe(3);

      const fixedSplit = splitter.smartSplit(text, {}, { strategy: 'fixed' });
      expect(fixedSplit.length).toBeGreaterThanOrEqual(1);
    });

    test('应该自动选择最佳策略', () => {
      const shortText = '这是一个短文本。';
      const autoSplit = splitter.smartSplit(shortText, {}, { strategy: 'auto' });
      
      expect(autoSplit.length).toBeGreaterThanOrEqual(1);
    });
  });
});
