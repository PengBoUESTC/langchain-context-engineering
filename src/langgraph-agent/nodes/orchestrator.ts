/**
 * planner node
 */
import { ChatDeepSeek } from "@langchain/deepseek";

import { AgentStateAnnotation } from '../state'

export const routePlanner = (p: typeof AgentStateAnnotation.State) => {
  return 'runner'
}

export const createOrchestratorNode = () => {
  const planner = new ChatDeepSeek({
    model: process.env.MODEL_NAME,
    temperature: 0.1,
    apiKey: process.env.OPENAI_API_KEY,
  });

  return async (state: typeof AgentStateAnnotation.State) => {
    const plannerRes = await planner.invoke([
      { role: "system", content: "Generate a plan for the task" },
      { role: "user", content: `Here is the task: ${state.task}` },
    ]);
    return { messages: plannerRes };
  }
}