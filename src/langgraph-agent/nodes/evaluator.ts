/**
 * evaluator node
 */
import { ChatDeepSeek } from "@langchain/deepseek";
import * as z from 'zod'

import { AgentStateAnnotation } from '../state'

const evaluateResSchema = z.object({
  grade: z.enum(["good", "normal", "bad"]).describe(
    "Decide if the llm result is ok or not."
  ),
})
export const routeEvaluate = (evaluatorRes: typeof AgentStateAnnotation.State) => {
  console.log(`evaluator 评价结果为 :: ${evaluatorRes.llmResEvaRes}`)
  return evaluatorRes.llmResEvaRes
}

export const createEvaluatorNode = () => {
  const llm = new ChatDeepSeek({
    model: process.env.MODEL_NAME,
    temperature: 0.1,
    apiKey: process.env.OPENAI_API_KEY,
  });

  const evaluator = llm.withStructuredOutput(evaluateResSchema)
  return async (state: typeof AgentStateAnnotation.State) => {
    const { messages } = state

    const evaluatorRes = await evaluator.invoke([
      { role: "system", content: "You should evaluate the response of the question" },
      ...messages
    ]);
  
    return { llmResEvaRes: evaluatorRes.grade };
  }
}