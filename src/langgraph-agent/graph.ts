/**
 * LangGraph Agent 主图
 * 实现基于 Context Engineering 的智能 Agent
 * https://www.promptingguide.ai/guides/context-engineering-guide
 * https://arxiv.org/html/2510.04618v1
 */
import { writeFile } from "node:fs/promises";
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { StateGraph, START, END, MemorySaver, AnnotationRoot } from "@langchain/langgraph";
import { RunnableConfig } from "@langchain/core/runnables";
import { HumanMessage } from '@langchain/core/messages'
import * as dotenv from 'dotenv';

import { AgentStateAnnotation, createDefaultState } from './state';

import { routePlanner, createOrchestratorNode } from './nodes/orchestrator'
import { createRunnerNode } from './nodes/fileReader'
import { routeEvaluate, createEvaluatorNode } from './nodes/evaluator'
import { createdMessageOptNode } from './nodes/messageOpt'

dotenv.config();

// 记录持久化
/** short-term memory */
const checkpointer = new MemorySaver()

/**
 * Context Engineering Agent
 * 基于 LangGraph 和 Context Engineering 架构的智能 Agent
 */
export class ContextEngineeringAgent {
  private agent;
  private runtimeConfig: RunnableConfig

  constructor() {
    // 构建图
    this.agent = this.buildGraph();
    // runtime config
    this.runtimeConfig = { configurable: { thread_id: randomUUID() } };
  }

  private async getHistoryMessages(state: typeof AgentStateAnnotation.State, runtimeConfig: RunnableConfig) {
    const { messages } = state
    const { values = [] } = await this.agent.getState(runtimeConfig)

    return [...messages, ...values]
  }

  /**
   * 构建 LangGraph 状态图
   */
  private buildGraph() {
    const graph = new StateGraph(AgentStateAnnotation);

    const plannerNode = createOrchestratorNode()
    const runnerNode = createRunnerNode()
    const evaluatorNode = createEvaluatorNode()
    const messageOptNode = createdMessageOptNode()

    // 添加节点
    graph
      .addNode('plannerNode', plannerNode)    
      .addNode('runner', runnerNode)    
      .addNode('evaluator', evaluatorNode)    
      .addNode('historyMessages', this.getHistoryMessages)
      .addNode('messageOpt', messageOptNode)
      // 添加边
      .addEdge(START, 'plannerNode')
      .addConditionalEdges('plannerNode', routePlanner, {
        runner: 'runner',
        historyMessages: 'historyMessages'
      })
      .addEdge('runner', 'evaluator')
      .addEdge('historyMessages', 'messageOpt')
      .addEdge('messageOpt', 'evaluator')
      .addConditionalEdges('evaluator', routeEvaluate, {
        "good": END,
        "normal": END,
        "bad": 'plannerNode'
      })

    return graph.compile({
      checkpointer
    });
  }

  /** 获取图 */
  async png() {
    const drawableGraph = await this.agent.getGraphAsync();
    const image = await drawableGraph.drawMermaidPng();
    const imageBuffer = new Uint8Array(await image.arrayBuffer());
    const picPath = join(import.meta.dirname, 'agent.png')
    await writeFile(picPath, imageBuffer);
    return picPath
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

    // 运行图
    const finalState = await this.agent.invoke(initialState, this.runtimeConfig);

    // 提取响应
    const lastMessage = finalState.messages[finalState.messages.length - 1];
    const response = lastMessage?.content as string || '';

    return {
      response,
    };
  }
}
