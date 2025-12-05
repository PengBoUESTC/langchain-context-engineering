/**
 * Context Engineering Agent Demo
 * 基于 LangGraph 和 Context Engineering 架构的智能 Agent 示例
 */
import * as dotenv from 'dotenv';
import { ContextEngineeringAgent } from './langgraph-agent/graph';

// 加载环境变量
dotenv.config();

/**
 * 主函数 - Agent 调用示例
 */
async function main() {
  console.log('🚀 启动 Context Engineering Agent...\n');

  // 检查环境变量
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ 错误: 请设置 OPENAI_API_KEY 环境变量');
    console.log('提示: 创建 .env 文件并添加 OPENAI_API_KEY=your_key');
    process.exit(1);
  }

  try {
    // 初始化 Agent
    console.log('📦 正在初始化 Agent...');
    const agent = new ContextEngineeringAgent({
      modelName: process.env.MODEL_NAME || 'gpt-4',
      temperature: 0.1,
      maxTokens: 8000,
      notesDirectory: './notes',
    });
    console.log('✅ Agent 初始化完成\n');

    // 解析命令行参数
    const args = process.argv.slice(2);
    
    if (args.length === 0) {
      // 交互式模式
      await runInteractiveMode(agent);
    } else {
      // 单次查询模式
      const query = args.join(' ');
      await runSingleQuery(agent, query);
    }
  } catch (error: any) {
    console.error('❌ 发生错误:', error.message);
    console.error(error);
    process.exit(1);
  }
}

/**
 * 交互式模式
 */
async function runInteractiveMode(agent: ContextEngineeringAgent) {
  console.log('💬 进入交互式模式 \n');

  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: '🤖 > ',
  });

  rl.prompt();

  rl.on('line', async (input: string) => {
    const query = input.trim();

    if (query === 'exit' || query === 'quit') {
      console.log('\n👋 再见！');
      rl.close();
      return;
    }

    if(query === 'png') {
      console.log('\n🧐 流程图');
      const picPath = await agent.png()
      console.log('\n🧐 ', picPath);
    }

    if (query === '') {
      rl.prompt();
      return;
    }

    try {
      console.log('\n⏳ 正在处理...\n');

      // 运行 Agent
      const result = await agent.run(query);

      // 显示结果
      console.log('📤 Agent 响应:');
      console.log('─'.repeat(100));
      console.log(result.response);
      console.log('─'.repeat(100));
      console.log('\n');
    } catch (error: any) {
      console.error(`\n❌ 处理失败: ${error.message}\n`);
    }

    rl.prompt();
  });

  rl.on('close', () => {
    process.exit(0);
  });
}

/**
 * 单次查询模式
 */
async function runSingleQuery(agent: ContextEngineeringAgent, query: string) {
  console.log(`📝 查询: ${query}\n`);
  console.log('⏳ 正在处理...\n');

  try {
    // 运行 Agent
    const result = await agent.run(query);

    // 显示结果
    console.log('📤 Agent 响应:');
    console.log('═'.repeat(100));
    console.log(result.response);
    console.log('═'.repeat(100));


    console.log('\n✅ 完成！\n');
  } catch (error: any) {
    console.error(`❌ 处理失败: ${error.message}`);
    console.error(error);
    process.exit(1);
  }
}

main().catch(console.error);

export { main, runInteractiveMode, runSingleQuery };
