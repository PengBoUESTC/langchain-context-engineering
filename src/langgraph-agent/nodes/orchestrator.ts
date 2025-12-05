/**
 * planner node
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import { AIMessage } from "@langchain/core/messages";
import * as z from 'zod'

import { AgentStateAnnotation } from '../state'

const plannerRes = z.object({
  node: z.enum(['runner', 'historyMessages']).describe('next graph node name')
})

export const routePlanner = (state: typeof AgentStateAnnotation.State) => {
  const { messages } = state
  const nextNode = messages[messages.length - 1].content as string
  console.log('routePlanner :: ', nextNode)
  return nextNode
}

export const createOrchestratorNode = () => {
  const llm = new ChatDeepSeek({
    model: process.env.MODEL_NAME,
    temperature: 0.1,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const planner = llm.withStructuredOutput(plannerRes)

  return async (state: typeof AgentStateAnnotation.State) => {
    const plannerRes = await planner.invoke([
      { role: "system", content: `根据用户提出的任务，选中接下来要执行的节点; 当前只有一个可用节点 runner` },
      { role: "user", content: `Here is the task: ${state.task}` },
    ]);

    return { messages: new AIMessage(plannerRes.node) };
  }
}