#!/usr/bin/env node

const { pipeline } = require('@xenova/transformers');
const path = require('path');
const fs = require('fs').promises;

/**
 * 模型下载和管理脚本
 */
class ModelDownloader {
  constructor() {
    this.modelsDir = path.join(__dirname, '../models/cache');
    this.models = [
      {
        name: 'BGE中文向量模型',
        id: 'BAAI/bge-small-zh-v1.5',
        type: 'feature-extraction',
        dimension: 512,
        size: '~100MB',
        description: '最佳中文语义向量模型，推荐用于生产环境'
      },
      {
        name: 'MiniLM多语言模型',
        id: 'Xenova/all-MiniLM-L6-v2',
        type: 'feature-extraction',
        dimension: 384,
        size: '~25MB',
        description: '轻量级多语言模型，适合开发和测试'
      },
      {
        name: 'DistilBERT基础模型',
        id: 'Xenova/distilbert-base-uncased',
        type: 'feature-extraction',
        dimension: 768,
        size: '~70MB',
        description: '英文模型，速度较快'
      }
    ];
  }

  async ensureModelsDir() {
    try {
      await fs.mkdir(this.modelsDir, { recursive: true });
      console.log(`📁 模型目录: ${this.modelsDir}`);
    } catch (error) {
      console.error('创建模型目录失败:', error);
      throw error;
    }
  }

  async listAvailableModels() {
    console.log('\n📋 可用模型列表:\n');
    this.models.forEach((model, index) => {
      console.log(`${index + 1}. ${model.name}`);
      console.log(`   ID: ${model.id}`);
      console.log(`   维度: ${model.dimension}`);
      console.log(`   大小: ${model.size}`);
      console.log(`   说明: ${model.description}`);
      console.log('');
    });
  }

  async checkModelExists(modelId) {
    try {
      // 检查缓存目录中是否存在模型文件
      const modelPath = path.join(this.modelsDir, modelId.replace('/', '--'));
      const stats = await fs.stat(modelPath);
      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  async downloadModel(modelId, options = {}) {
    console.log(`\n🚀 开始下载模型: ${modelId}`);
    console.log('⏳ 这可能需要几分钟时间，请耐心等待...\n');

    try {
      const startTime = Date.now();
      
      // 使用pipeline自动下载模型
      const model = await pipeline('feature-extraction', modelId, {
        quantized: options.quantized || false,
        local_files_only: false,
        cache_dir: this.modelsDir,
        progress_callback: (progress) => {
          if (progress.status === 'downloading') {
            const percent = ((progress.loaded / progress.total) * 100).toFixed(1);
            process.stdout.write(`\r📥 下载进度: ${percent}% (${this.formatBytes(progress.loaded)}/${this.formatBytes(progress.total)})`);
          }
        }
      });

      const endTime = Date.now();
      const duration = ((endTime - startTime) / 1000).toFixed(1);
      
      console.log(`\n✅ 模型下载完成! 耗时: ${duration}秒`);
      
      // 测试模型
      console.log('🧪 测试模型...');
      const testResult = await model('测试文本');
      console.log(`✅ 模型测试成功! 向量维度: ${testResult.data.length}`);
      
      return true;
    } catch (error) {
      console.error(`\n❌ 模型下载失败: ${error.message}`);
      return false;
    }
  }

  async downloadAllModels() {
    console.log('🎯 开始下载所有推荐模型...\n');
    
    const results = [];
    for (const model of this.models) {
      const exists = await this.checkModelExists(model.id);
      if (exists) {
        console.log(`✅ 模型 ${model.name} 已存在，跳过下载`);
        results.push({ model: model.name, status: 'exists' });
        continue;
      }

      const success = await this.downloadModel(model.id);
      results.push({ 
        model: model.name, 
        status: success ? 'success' : 'failed' 
      });
    }

    console.log('\n📊 下载结果汇总:');
    results.forEach(result => {
      const status = result.status === 'success' ? '✅' : 
                    result.status === 'exists' ? '📁' : '❌';
      console.log(`${status} ${result.model}: ${result.status}`);
    });
  }

  async testModel(modelId) {
    console.log(`\n🧪 测试模型: ${modelId}`);
    
    try {
      const model = await pipeline('feature-extraction', modelId, {
        local_files_only: true,
        cache_dir: this.modelsDir
      });

      const testTexts = [
        '这是一个测试文本',
        '工作时间规定',
        'This is a test sentence'
      ];

      console.log('📝 测试文本:');
      for (const text of testTexts) {
        const vector = await model(text);
        console.log(`"${text}" -> 向量维度: ${vector.data.length}`);
      }

      console.log('✅ 模型测试完成!');
      return true;
    } catch (error) {
      console.error(`❌ 模型测试失败: ${error.message}`);
      return false;
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async run() {
    console.log('🤖 WeComBot 模型下载工具\n');
    
    await this.ensureModelsDir();
    
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'list':
        await this.listAvailableModels();
        break;
        
      case 'download':
        const modelIndex = parseInt(args[1]) - 1;
        if (modelIndex >= 0 && modelIndex < this.models.length) {
          const model = this.models[modelIndex];
          await this.downloadModel(model.id);
        } else {
          console.log('❌ 无效的模型编号');
          await this.listAvailableModels();
        }
        break;
        
      case 'download-all':
        await this.downloadAllModels();
        break;
        
      case 'test':
        const testModelIndex = parseInt(args[1]) - 1;
        if (testModelIndex >= 0 && testModelIndex < this.models.length) {
          const model = this.models[testModelIndex];
          await this.testModel(model.id);
        } else {
          console.log('❌ 无效的模型编号');
          await this.listAvailableModels();
        }
        break;
        
      default:
        console.log('📖 使用说明:');
        console.log('  node scripts/download-models.js list          # 列出可用模型');
        console.log('  node scripts/download-models.js download 1    # 下载指定模型');
        console.log('  node scripts/download-models.js download-all  # 下载所有模型');
        console.log('  node scripts/download-models.js test 1        # 测试指定模型');
        console.log('');
        await this.listAvailableModels();
        break;
    }
  }
}

// 运行脚本
if (require.main === module) {
  const downloader = new ModelDownloader();
  downloader.run().catch(console.error);
}

module.exports = ModelDownloader;
