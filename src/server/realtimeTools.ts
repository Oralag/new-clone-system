/**
 * 将 erpTools.ts 的 Google FunctionDeclaration[] 转为 OpenAI Realtime API tool 格式
 */
import { queryTools, createTools, editTools, deleteTools } from './tools/erpTools'

interface RealtimeTool {
  type: 'function'
  name: string
  description: string
  parameters: Record<string, any>
}

function convertTool(t: any): RealtimeTool {
  return {
    type: 'function',
    name: t.name,
    description: t.description || '',
    parameters: {
      type: t.parameters?.type || 'object',
      properties: t.parameters?.properties || {},
      ...(t.parameters?.required ? { required: t.parameters.required } : {}),
    },
  }
}

// 语音模式排除 navigate_to（语音中跳转页面没意义）
const voiceTools = [...queryTools, ...createTools, ...editTools, ...deleteTools]

export const realtimeTools: RealtimeTool[] = voiceTools.map(convertTool)
