#!/usr/bin/env node

/**
 * 自定义向量模型管理工具
 * 允许用户下载和使用其他兼容的向量模型
 */

const { pipeline } = require('@xenova/transformers');
const path = require('path');
const fs = require('fs').promises;

// 推荐的向量模型列表
const RECOMMENDED_MODELS = [
    {
        name: 'Xenova/bge-small-zh-v1.5',
        description: 'BGE中文模型 (推荐)',
        dimension: 512,
        size: '~130MB',
        language: '中文'
    },
    {
        name: 'Xenova/bge-base-zh-v1.5',
        description: 'BGE中文基础版',
        dimension: 768,
        size: '~400MB',
        language: '中文'
    },
    {
        name: 'Xenova/bge-large-zh-v1.5',
        description: 'BGE中文大型版',
        dimension: 1024,
        size: '~1.2GB',
        language: '中文'
    },
    {
        name: 'Xenova/all-MiniLM-L6-v2',
        description: '多语言轻量模型',
        dimension: 384,
        size: '~25MB',
        language: '多语言'
    },
    {
        name: 'Xenova/paraphrase-multilingual-MiniLM-L12-v2',
        description: '多语言句子相似度模型',
        dimension: 384,
        size: '~100MB',
        language: '多语言'
    },
    {
        name: 'Xenova/e5-small-v2',
        description: 'E5英文小型模型',
        dimension: 384,
        size: '~35MB',
        language: '英文'
    },
    {
        name: 'Xenova/e5-base-v2',
        description: 'E5英文基础模型',
        dimension: 768,
        size: '~110MB',
        language: '英文'
    }
];

/**
 * 下载指定的向量模型
 */
async function downloadCustomModel(modelName, cacheDir) {
    try {
        console.log(`🚀 开始下载模型: ${modelName}`);
        console.log('📝 模型信息:');
        
        const modelInfo = RECOMMENDED_MODELS.find(m => m.name === modelName);
        if (modelInfo) {
            console.log(`   - 描述: ${modelInfo.description}`);
            console.log(`   - 维度: ${modelInfo.dimension}`);
            console.log(`   - 大小: ${modelInfo.size}`);
            console.log(`   - 语言: ${modelInfo.language}`);
        }
        
        console.log('⏳ 下载可能需要几分钟，请耐心等待...\n');

        // 下载模型
        const model = await pipeline('feature-extraction', modelName, {
            cache_dir: cacheDir,
            local_files_only: false
        });
        
        console.log('✅ 模型下载完成!');
        
        // 测试模型
        console.log('🧪 测试模型...');
        const testVector = await model('测试文本');
        console.log(`✅ 模型测试成功! 向量维度: ${testVector.data.length}`);
        
        return {
            success: true,
            modelName,
            dimension: testVector.data.length,
            message: '模型下载并测试成功'
        };
        
    } catch (error) {
        console.error(`❌ 模型下载失败: ${error.message}`);
        return {
            success: false,
            modelName,
            error: error.message
        };
    }
}

/**
 * 列出所有可用的模型
 */
async function listAvailableModels(cacheDir) {
    console.log('📋 可用模型列表:\n');
    
    for (const model of RECOMMENDED_MODELS) {
        try {
            const testModel = await pipeline('feature-extraction', model.name, {
                cache_dir: cacheDir,
                local_files_only: true
            });
            
            console.log(`✅ ${model.description}`);
            console.log(`   模型: ${model.name}`);
            console.log(`   维度: ${model.dimension} | 大小: ${model.size} | 语言: ${model.language}`);
            console.log(`   状态: 已安装\n`);
            
        } catch (error) {
            console.log(`❌ ${model.description}`);
            console.log(`   模型: ${model.name}`);
            console.log(`   维度: ${model.dimension} | 大小: ${model.size} | 语言: ${model.language}`);
            console.log(`   状态: 未安装\n`);
        }
    }
}

/**
 * 设置自定义模型为默认模型
 */
async function setDefaultModel(modelName) {
    try {
        const envPath = path.join(__dirname, '..', '.env');
        let envContent = '';
        
        // 读取现有.env文件
        try {
            envContent = await fs.readFile(envPath, 'utf8');
        } catch (error) {
            // .env文件不存在，创建新的
            envContent = '';
        }
        
        // 更新或添加VECTOR_MODEL_PATH配置
        const modelPathLine = `VECTOR_MODEL_PATH=./models/cache/${modelName}`;
        const modelInfo = RECOMMENDED_MODELS.find(m => m.name === modelName);
        const dimensionLine = modelInfo ? `VECTOR_DIMENSION=${modelInfo.dimension}` : '';
        
        // 使用正则表达式替换现有配置
        const updatedEnvContent = envContent
            .replace(/^VECTOR_MODEL_PATH=.*$/m, modelPathLine)
            .replace(/^VECTOR_DIMENSION=.*$/m, dimensionLine);
        
        // 如果配置不存在，添加到文件末尾
        let finalEnvContent = updatedEnvContent;
        if (!finalEnvContent.includes('VECTOR_MODEL_PATH=')) {
            finalEnvContent += `\n${modelPathLine}`;
        }
        if (dimensionLine && !finalEnvContent.includes('VECTOR_DIMENSION=')) {
            finalEnvContent += `\n${dimensionLine}`;
        }
        
        // 写入.env文件
        await fs.writeFile(envPath, finalEnvContent.trim() + '\n');
        
        console.log(`✅ 已设置默认模型: ${modelName}`);
        if (modelInfo) {
            console.log(`📊 向量维度: ${modelInfo.dimension}`);
        }
        console.log('💡 请重启服务以应用新模型配置');
        
        return { success: true, modelName };
        
    } catch (error) {
        console.error(`❌ 设置默认模型失败: ${error.message}`);
        return { success: false, error: error.message };
    }
}

/**
 * 检查指定模型的状态
 */
async function checkModelStatus(modelName, cacheDir) {
    try {
        const model = await pipeline('feature-extraction', modelName, {
            cache_dir: cacheDir,
            local_files_only: true
        });
        
        const testVector = await model('测试文本');
        const modelInfo = RECOMMENDED_MODELS.find(m => m.name === modelName);
        
        console.log(`✅ 模型状态正常: ${modelName}`);
        console.log(`📊 向量维度: ${testVector.data.length}`);
        if (modelInfo) {
            console.log(`📝 描述: ${modelInfo.description}`);
            console.log(`🌐 语言: ${modelInfo.language}`);
        }
        
        return { 
            success: true, 
            modelName, 
            dimension: testVector.data.length,
            status: 'installed' 
        };
        
    } catch (error) {
        console.log(`❌ 模型未安装: ${modelName}`);
        return { 
            success: false, 
            modelName, 
            error: error.message,
            status: 'not_installed' 
        };
    }
}

// 主函数
async function main() {
    const args = process.argv.slice(2);
    const command = args[0];
    const modelName = args[1];
    const cacheDir = path.join(__dirname, '..', 'models', 'cache');
    
    // 确保缓存目录存在
    await fs.mkdir(cacheDir, { recursive: true });
    
    switch (command) {
        case 'list':
            await listAvailableModels(cacheDir);
            break;
            
        case 'download':
            if (!modelName) {
                console.error('❌ 请指定要下载的模型名称');
                console.log('💡 使用 "npm run custom-model list" 查看可用模型');
                process.exit(1);
            }
            await downloadCustomModel(modelName, cacheDir);
            break;
            
        case 'set-default':
            if (!modelName) {
                console.error('❌ 请指定要设置为默认的模型名称');
                process.exit(1);
            }
            await setDefaultModel(modelName);
            break;
            
        case 'check':
            if (!modelName) {
                console.error('❌ 请指定要检查的模型名称');
                process.exit(1);
            }
            await checkModelStatus(modelName, cacheDir);
            break;
            
        case 'help':
        default:
            console.log('🤖 自定义向量模型管理工具\n');
            console.log('用法:');
            console.log('  npm run custom-model list              # 列出所有可用模型');
            console.log('  npm run custom-model download <model>  # 下载指定模型');
            console.log('  npm run custom-model set-default <model> # 设置为默认模型');
            console.log('  npm run custom-model check <model>     # 检查模型状态');
            console.log('  npm run custom-model help              # 显示帮助信息\n');
            console.log('推荐的模型:');
            RECOMMENDED_MODELS.forEach(model => {
                console.log(`  ${model.name} - ${model.description} (${model.dimension}维)`);
            });
            break;
    }
}

// 运行脚本
if (require.main === module) {
    main().catch(console.error);
}

module.exports = {
    downloadCustomModel,
    listAvailableModels,
    setDefaultModel,
    checkModelStatus,
    RECOMMENDED_MODELS
};