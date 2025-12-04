/**
 * planner node
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import * as z from 'zod'

import { AgentStateAnnotation } from '../state'

const plannerResult = z.object({
  node: z.enum(['runner']).describe('next agent node')
})

export const routePlanner = (p: typeof AgentStateAnnotation.State) => {
  console.log('routePlanner call input = ', p)
  return 'runner'
}

export const createOrchestratorNode = () => {
  const llm = new ChatDeepSeek({
    model: process.env.MODEL_NAME,
    temperature: 0.1,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const planner = llm.withStructuredOutput(plannerResult)

  return async (state: typeof AgentStateAnnotation.State) => {
    const plannerRes = await planner.invoke([
      { role: "system", content: "Generate a plan for the question" },
      { role: "user", content: `Here is the question: ${state.question}` },
    ]);
    console.log('OrchestratorNode call result = ', plannerRes)
    return plannerRes;
  }
}