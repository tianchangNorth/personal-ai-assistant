#!/usr/bin/env node

/**
 * 简化版BGE模型下载脚本
 * 使用更稳定的下载策略
 */

const { pipeline } = require('@xenova/transformers');
const path = require('path');
const fs = require('fs').promises;

async function downloadModelSimple() {
  console.log('🤖 WeComBot BGE模型简化下载工具\n');
  
  const modelName = 'Xenova/bge-small-zh-v1.5';
  const cacheDir = path.join(__dirname, '..', 'models', 'cache');
  
  try {
    // 确保目录存在
    await fs.mkdir(cacheDir, { recursive: true });
    console.log(`📁 模型目录: ${cacheDir}`);
    
    // 检查现有模型
    try {
      console.log('🔍 检查现有模型...');
      const existingModel = await pipeline('feature-extraction', modelName, {
        cache_dir: cacheDir,
        local_files_only: true
      });
      
      const testVector = await existingModel('测试');
      console.log(`✅ 现有模型正常工作! 向量维度: ${testVector.data.length}`);
      console.log('🎉 无需重新下载');
      return;
    } catch (error) {
      console.log('📥 需要下载模型...');
    }
    
    // 下载BGE PyTorch模型
    console.log('🚀 开始下载BGE PyTorch模型...');
    console.log('📝 使用原生PyTorch模型，获得最佳性能和兼容性');
    console.log('⏳ 预计需要2-5分钟，请耐心等待...\n');

    // 使用纯PyTorch模型配置
    const model = await pipeline('feature-extraction', modelName, {
      cache_dir: cacheDir,
      local_files_only: false
      // 完全移除quantized等ONNX相关配置，使用原生PyTorch
    });
    
    console.log('✅ 模型下载完成!');
    
    // 测试模型
    console.log('🧪 测试模型...');
    const testVector = await model('测试文本');
    console.log(`✅ 模型测试成功! 向量维度: ${testVector.data.length}`);
    
    console.log('\n🎉 BGE模型安装完成!');
    console.log('💡 现在可以启动ai-assistant服务使用真实的语义搜索功能');
    
  } catch (error) {
    console.error('\n❌ 模型下载失败:', error.message);
    
    // 提供更详细的错误分析
    if (error.message.includes('Could not locate file')) {
      console.log('\n🔧 可能的解决方案:');
      console.log('1. 网络连接问题 - 检查网络或使用VPN');
      console.log('2. HuggingFace服务问题 - 稍后重试');
      console.log('3. 模型文件不存在 - 尝试使用备用模型');
      
      // 尝试备用模型
      console.log('\n🔄 尝试下载备用模型...');
      try {
        await downloadBackupModel(cacheDir);
      } catch (backupError) {
        console.error('❌ 备用模型下载也失败:', backupError.message);
      }
    } else {
      console.log('\n🔧 故障排除建议:');
      console.log('1. 检查磁盘空间是否充足 (需要至少200MB)');
      console.log('2. 检查网络连接是否稳定');
      console.log('3. 尝试重新运行下载命令');
    }
    
    console.log('\n⚠️  如果下载失败，WeComBot将无法启动，请确保网络连接正常');
    process.exit(1);
  }
}

/**
 * 下载备用模型
 */
async function downloadBackupModel(cacheDir) {
  console.log('📦 尝试下载轻量级备用模型...');
  
  const backupModelName = 'Xenova/all-MiniLM-L6-v2';
  
  try {
    const model = await pipeline('feature-extraction', backupModelName, {
      cache_dir: cacheDir,
      local_files_only: false
      // 备用模型也使用PyTorch版本，不使用量化
    });
    
    console.log('✅ 备用模型下载成功!');
    console.log('📊 备用模型信息:');
    console.log('   - 名称: all-MiniLM-L6-v2');
    console.log('   - 大小: ~25MB');
    console.log('   - 维度: 384');
    console.log('   - 语言: 多语言支持');
    
    // 测试备用模型
    const testVector = await model('测试文本');
    console.log(`✅ 备用模型测试成功! 向量维度: ${testVector.data.length}`);
    
    console.log('\n💡 备用模型已安装，可以提供基本的语义搜索功能');
    console.log('💡 如需更好的中文支持，请稍后重试下载BGE模型');
    
  } catch (error) {
    throw new Error(`备用模型下载失败: ${error.message}`);
  }
}

/**
 * 检查所有可用模型
 */
async function checkAllModels() {
  const cacheDir = path.join(__dirname, '..', 'models', 'cache');
  const models = [
    { name: 'Xenova/bge-small-zh-v1.5', description: 'BGE中文模型' },
    { name: 'Xenova/all-MiniLM-L6-v2', description: '多语言轻量模型' }
  ];
  
  console.log('🔍 检查所有模型状态:\n');
  
  for (const modelInfo of models) {
    try {
      const model = await pipeline('feature-extraction', modelInfo.name, {
        cache_dir: cacheDir,
        local_files_only: true
      });
      
      const testVector = await model('测试');
      console.log(`✅ ${modelInfo.description} (${modelInfo.name})`);
      console.log(`   向量维度: ${testVector.data.length}`);
    } catch (error) {
      console.log(`❌ ${modelInfo.description} (${modelInfo.name}) - 未安装`);
    }
    console.log('');
  }
}

// 主函数
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  switch (command) {
    case 'check':
      await checkAllModels();
      break;
    case 'backup':
      const cacheDir = path.join(__dirname, '..', 'models', 'cache');
      await fs.mkdir(cacheDir, { recursive: true });
      await downloadBackupModel(cacheDir);
      break;
    case 'download':
    default:
      await downloadModelSimple();
      break;
  }
}

// 运行脚本
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadModelSimple, downloadBackupModel, checkAllModels };
