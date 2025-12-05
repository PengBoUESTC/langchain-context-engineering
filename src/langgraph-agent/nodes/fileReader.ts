import { ChatDeepSeek } from "@langchain/deepseek";
import { AgentStateAnnotation } from '../state'
import { fileReadTool } from '../tools'


export const createRunnerNode = (runner: ChatDeepSeek) => {
  const toolsMap = [fileReadTool].reduce<Record<string, any>>((res, tool) => {
    res[tool.getName()] = tool
    return res
  }, {})
  const runnerWithTools = runner.bindTools([fileReadTool])
  return async (state: typeof AgentStateAnnotation.State) => {
    const { messages } = state
    const runnerRes = await runnerWithTools.invoke([
      { role: "system", content: "you can get the file content by bind tools" },
      ...messages
    ]);
    const { tool_calls = [] } = runnerRes
    const result = [runnerRes]
    for (const toolInfo of tool_calls) {
      const tool = toolsMap[toolInfo.name]
      const toolResult = await tool.invoke(toolInfo);
      result.push(toolResult)
    }
    return { messages: result };
  }
}