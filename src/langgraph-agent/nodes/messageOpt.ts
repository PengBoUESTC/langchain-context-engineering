import { ChatDeepSeek } from "@langchain/deepseek";

import { AgentStateAnnotation } from '../state'

export const createdMessageOptNode = () => {
  const llm = new ChatDeepSeek({
    model: process.env.MODEL_NAME,
    temperature: 0.1,
    apiKey: process.env.OPENAI_API_KEY,
  });

  return async (state: typeof AgentStateAnnotation.State) => {
    const { messages } = state

    const messageOptRes = await llm.invoke([
      ...messages
    ]);
  
    return { messages: messageOptRes };
  }
}