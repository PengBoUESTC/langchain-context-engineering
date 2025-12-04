/**
 * LangGraph Agent 主图
 * 实现基于 Context Engineering 的智能 Agent
 * https://www.promptingguide.ai/guides/context-engineering-guide
 * https://arxiv.org/html/2510.04618v1
 */
import { randomUUID } from 'node:crypto'
import { StateGraph, START, END, MemorySaver } from "@langchain/langgraph";
import { ChatDeepSeek } from "@langchain/deepseek";
import { HumanMessage } from '@langchain/core/messages'
import * as dotenv from 'dotenv';

import { AgentStateAnnotation, createDefaultState } from './state';

import { routePlanner, createOrchestratorNode } from './nodes/orchestrator'
import { createRunnerNode } from './nodes/fileReader'
import { routeEvaluate, createEvaluatorNode } from './nodes/evaluator'

dotenv.config();

// 记录持久化
/** short-term memory */
const checkpointer = new MemorySaver()

/**
 * Context Engineering Agent
 * 基于 LangGraph 和 Context Engineering 架构的智能 Agent
 */
export class ContextEngineeringAgent {
  private graph;
  private runner: ChatDeepSeek;

  constructor(config?: {
    modelName?: string;
    temperature?: number;
    maxTokens?: number;
    notesDirectory?: string;
  }) {
    this.runner = new ChatDeepSeek({
      model: config?.modelName || process.env.MODEL_NAME,
      temperature: config?.temperature || 0.1,
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 构建图
    this.graph = this.buildGraph();
  }

  /**
   * 构建 LangGraph 状态图
   */
  private buildGraph() {
    const graph = new StateGraph(AgentStateAnnotation);

    const plannerNode = createOrchestratorNode()
    const runnerNode = createRunnerNode(this.runner)
    const evaluatorNode = createEvaluatorNode()

    // const router = createRouterNode();

    // 添加节点
    graph
      .addNode('plannerNode', plannerNode)    
      .addNode('runner', runnerNode)    
      .addNode('evaluator', evaluatorNode)    
      // 添加边
      .addEdge(START, 'plannerNode')
      .addConditionalEdges('plannerNode', routePlanner, {
        'runner': 'runner'
      })
      .addEdge('runner', 'evaluator')
      .addConditionalEdges('evaluator', routeEvaluate, {
        "good": END,
        "normal": END,
        "bad": END
      })

    return graph.compile({
      checkpointer
    });
  }

  /**
   * 运行 Agent
   */
  async run(
    input: string,
  ): Promise<{
    response: string;
  }> {
    // 初始化状态
    const initialState = createDefaultState();


    // 添加用户输入消息
    initialState.messages.push(new HumanMessage(input));
    const config = { configurable: { thread_id: randomUUID() } };

    // 运行图
    const finalState = await this.graph.invoke(initialState, config);

    // 提取响应
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const response = lastMessage?.content as string || '';

    return {
      response,
    };
  }
}
