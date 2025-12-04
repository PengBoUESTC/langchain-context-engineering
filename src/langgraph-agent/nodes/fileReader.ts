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
    const { tool_calls = [] } = await runnerWithTools.invoke([
      { role: "system", content: "you can get the file content by bind tools" },
      ...messages
    ]);
    const result = []
    for (const toolInfo of tool_calls) {
      const tool = toolsMap[toolInfo.name]
      const toolResult = await tool.invoke(toolInfo);
      result.push(toolResult)
    }
    return { messages: result };
  }
}