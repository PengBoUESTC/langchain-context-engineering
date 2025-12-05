/**
 * LangGraph Agent 状态定义
 * 基于 Context Engineering 架构的状态管理
 */
import { BaseMessage } from "@langchain/core/messages";
import { Annotation } from "@langchain/langgraph";

/**
 * 状态注解对象
 * 提供 State 属性用于类型推导
 * 用于 LangGraph 状态图的类型定义
 */
export const AgentStateAnnotation = Annotation.Root({
  task: Annotation<string>,
  llmResEvaRes: Annotation<string>,
  messages: Annotation<BaseMessage[]>({
    reducer: (left: BaseMessage[], right: BaseMessage | BaseMessage[]) => {
      if (Array.isArray(right)) {
        return left.concat(right);
      }
      return left.concat([right]);
    },
    default: () => []
  }),
})

/**
 * 创建默认状态
 */
export function createDefaultState(): typeof AgentStateAnnotation.State {
  return {
    task: '',
    llmResEvaRes: '',
    messages: [],
  };
}
