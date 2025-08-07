const DocumentParser = require('../src/services/documentParser');
const fs = require('fs').promises;
const path = require('path');

describe('DocumentParser', () => {
  let parser;
  const testDataDir = path.join(__dirname, 'testData');

  beforeAll(async () => {
    parser = new DocumentParser();
    
    // 创建测试数据目录
    await fs.mkdir(testDataDir, { recursive: true });
    
    // 创建测试文件
    await createTestFiles();
  });

  afterAll(async () => {
    // 清理测试文件
    try {
      await fs.rm(testDataDir, { recursive: true, force: true });
    } catch (error) {
      console.warn('清理测试文件失败:', error.message);
    }
  });

  async function createTestFiles() {
    // 创建测试Markdown文件
    const markdownContent = `# 测试文档

## 第一章 介绍

这是一个测试文档，用于验证Markdown解析功能。

### 1.1 基本信息

- 文档类型：测试文档
- 创建时间：2025年
- 用途：单元测试

## 第二章 内容

这里是文档的主要内容。包含了多个段落和不同的格式。

### 2.1 规章制度

员工应当遵守以下规定：

1. 按时上下班
2. 保持工作环境整洁
3. 遵守公司保密制度

### 2.2 注意事项

请注意以下几点：
- 文档格式要规范
- 内容要准确完整
- 及时更新信息
`;

    await fs.writeFile(path.join(testDataDir, 'test.md'), markdownContent, 'utf-8');
  }

  describe('parseDocument', () => {
    test('应该成功解析Markdown文档', async () => {
      const filePath = path.join(testDataDir, 'test.md');
      const result = await parser.parseDocument(filePath, { testFile: true });

      expect(result.success).toBe(true);
      expect(result.content).toContain('测试文档');
      expect(result.content).toContain('规章制度');
      expect(result.metadata.fileName).toBe('test.md');
      expect(result.metadata.fileType).toBe('.md');
      expect(result.wordCount).toBeGreaterThan(0);
    });

    test('应该处理不存在的文件', async () => {
      const filePath = path.join(testDataDir, 'nonexistent.md');
      const result = await parser.parseDocument(filePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('ENOENT');
    });

    test('应该拒绝不支持的文件类型', async () => {
      const filePath = path.join(testDataDir, 'test.txt');
      await fs.writeFile(filePath, 'test content');
      
      const result = await parser.parseDocument(filePath);

      expect(result.success).toBe(false);
      expect(result.error).toContain('不支持的文件类型');
    });
  });

  describe('parseMarkdown', () => {
    test('应该正确解析Markdown内容', async () => {
      const content = '# 标题\n\n这是内容。\n\n## 子标题\n\n更多内容。';
      const buffer = Buffer.from(content, 'utf-8');
      
      const result = await parser.parseMarkdown(buffer, 'test.md');

      expect(result.text).toContain('标题');
      expect(result.text).toContain('这是内容');
      expect(result.structure).toHaveLength(2);
      expect(result.structure[0].type).toBe('heading');
      expect(result.structure[0].level).toBe(1);
      expect(result.structure[0].content).toBe('标题');
    });

    test('应该处理空的Markdown文档', async () => {
      const buffer = Buffer.from('', 'utf-8');
      
      const result = await parser.parseMarkdown(buffer, 'empty.md');

      expect(result.text).toBe('');
      expect(result.structure).toHaveLength(0);
    });
  });

  describe('cleanText', () => {
    test('应该清理多余的空白字符', () => {
      const dirtyText = '  这是   一个\n\n\n测试   文本  \n  ';
      const cleanedText = parser.cleanText(dirtyText);

      expect(cleanedText).toBe('这是 一个\n\n测试 文本');
    });

    test('应该移除特殊字符', () => {
      const textWithSpecialChars = '正常文本\x00\x08特殊字符\x1F结束';
      const cleanedText = parser.cleanText(textWithSpecialChars);

      expect(cleanedText).toBe('正常文本特殊字符结束');
    });

    test('应该处理null和undefined', () => {
      expect(parser.cleanText(null)).toBe('');
      expect(parser.cleanText(undefined)).toBe('');
      expect(parser.cleanText('')).toBe('');
    });
  });

  describe('isLikelyTitle', () => {
    test('应该识别可能的标题', () => {
      expect(parser.isLikelyTitle('第一章 介绍')).toBe(true);
      expect(parser.isLikelyTitle('1.1 基本信息')).toBe(true);
      expect(parser.isLikelyTitle('规章制度管理办法')).toBe(true);
    });

    test('应该拒绝不像标题的文本', () => {
      expect(parser.isLikelyTitle('这是一个很长的段落，包含了很多内容，显然不是标题。')).toBe(false);
      expect(parser.isLikelyTitle('句子以句号结尾。')).toBe(false);
      expect(parser.isLikelyTitle('短')).toBe(false);
      expect(parser.isLikelyTitle('')).toBe(false);
    });
  });

  describe('countWords', () => {
    test('应该正确统计中文字符', () => {
      const chineseText = '这是中文测试文本';
      const count = parser.countWords(chineseText);
      expect(count).toBe(8); // 8个中文字符
    });

    test('应该正确统计英文单词', () => {
      const englishText = 'This is English test text';
      const count = parser.countWords(englishText);
      expect(count).toBe(5); // 5个英文单词
    });

    test('应该正确统计混合文本', () => {
      const mixedText = '这是 mixed 文本 test';
      const count = parser.countWords(mixedText);
      expect(count).toBe(6); // 4个中文字符 + 2个英文单词
    });

    test('应该处理空文本', () => {
      expect(parser.countWords('')).toBe(0);
      expect(parser.countWords(null)).toBe(0);
      expect(parser.countWords(undefined)).toBe(0);
    });
  });

  describe('getSupportedTypes', () => {
    test('应该返回支持的文件类型', () => {
      const supportedTypes = parser.getSupportedTypes();
      
      expect(supportedTypes).toContain('.pdf');
      expect(supportedTypes).toContain('.docx');
      expect(supportedTypes).toContain('.md');
      expect(supportedTypes).toContain('.markdown');
      expect(supportedTypes.length).toBeGreaterThan(0);
    });
  });

  describe('htmlToText', () => {
    test('应该移除HTML标签', () => {
      const html = '<h1>标题</h1><p>这是<strong>粗体</strong>文本。</p>';
      const text = parser.htmlToText(html);
      
      expect(text).toBe('标题这是粗体文本。');
    });

    test('应该转换HTML实体', () => {
      const html = '&lt;标签&gt;&nbsp;空格&amp;符号&quot;引号&quot;';
      const text = parser.htmlToText(html);
      
      expect(text).toBe('<标签> 空格&符号"引号"');
    });
  });
});
