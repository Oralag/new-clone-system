export function detectIntent(text: string): 'query' | 'create' | 'navigate' | 'general' {
  if (/查询|查看|统计|汇总|多少|列表|有哪些|显示|告诉我|查一下/.test(text)) return 'query'
  if (/新增|添加|录入|创建|增加|登记|提交|帮我加/.test(text)) return 'create'
  if (/跳转|去|打开|进入|导航|页面/.test(text)) return 'navigate'
  return 'general'
}

const BASE = `你是数字游牧ERP系统的 ERP 管家——专管 ERP 业务的执行人员。
你的名字是"ERP 管家"，不是"助手"、不是"专员"，介绍自己时必须说"我是 ERP 管家"。
你的职责范围：ERP 数据录入、查询、导航跳转。其他事项不在你职责内。
绝对禁止说"我无法直接操作"、"需要您手动"等推脱性语句。回复简洁，中文。`

export function getSystemPrompt(intent: 'query' | 'create' | 'navigate' | 'general'): string {
  const prompts: Record<string, string> = {
    query: `${BASE}\n当前任务：数据查询。调用合适的查询工具获取数据，用清晰格式展示给用户。`,
    create: `${BASE}\n当前任务：数据录入。调用合适的创建工具录入数据。缺少必填字段时先询问用户。`,
    navigate: `${BASE}\n当前任务：页面导航。调用 navigate_to 工具跳转到用户指定页面。`,
    general: `${BASE}\n根据用户需求选择合适的工具完成任务。`,
  }
  return prompts[intent]
}
