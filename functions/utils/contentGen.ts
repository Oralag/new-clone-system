// 共享内容生成流水线：品牌配置 → AI 生成 N 条图文 → FlowResult 数组
// 唯一入口：scheduled-run（定时）和 quick-generate（一键）都调这里，禁止各自复制实现

export interface GenEnv {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  USERS_KV: KVNamespace
}

export const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手',
  weibo: '微博', bilibili: 'B站', zhihu: '知乎',
}

async function aiCall(env: GenEnv, systemPrompt: string, userMsg: string): Promise<string> {
  const baseURL = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${env.AI_API_KEY}` },
    body: JSON.stringify({
      model: env.AI_MODEL || 'deepseek-chat',
      max_tokens: 3000,
      messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userMsg }],
    }),
  })
  if (!res.ok) throw new Error(`AI API ${res.status}`)
  const data: any = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

function buildBrandInfo(profiles: any[], activeId: string): string {
  const p = profiles.find((x: any) => x?.id === activeId) || profiles[0]
  if (!p) return '（未配置品牌，按通用消费品处理）'
  const pick = ['name', 'industry', 'slogan', 'description', 'intro', 'tone', 'tones', 'audience', 'audienceDesc', 'audiencePain', 'sellingPoints', 'products', 'mainPlatforms', 'taboos']
  const parts: string[] = []
  for (const k of pick) {
    const v = (p as any)[k]
    if (v) parts.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
  }
  return parts.join('\n') || JSON.stringify(p).slice(0, 800)
}

/** 生成 N 条可发布图文（FlowResult 形状，直接可进发布队列） */
export async function generateContentBundle(
  env: GenEnv, userKey: string, instruction: string, count: number, dateLabel: string,
): Promise<any[]> {
  const [profiles, activeId] = await Promise.all([
    env.USERS_KV.get(`brand:${userKey}:profiles`, 'json') as Promise<any[]>,
    env.USERS_KV.get(`brand:${userKey}:active`) as Promise<string>,
  ])
  const brandInfo = buildBrandInfo(profiles || [], activeId || '')

  const n = Math.min(Math.max(count || 3, 1), 10)
  const raw = await aiCall(env,
    `你是广告公司的内容生产流水线。根据任务指令和品牌信息，生成 ${n} 条可直接发布的内容。
严格输出 JSON 数组（不要 markdown 代码块），每项字段：
{"platform":"xiaohongshu|douyin|weibo 之一","topic":"选题（15字内）","title":"标题（带钩子）","content":"正文（按平台规范，含话题标签）","image_prompt":"英文生图提示词，具体描述画面/产品/风格"}`,
    `任务指令：${instruction}\n\n品牌信息：\n${brandInfo}\n\n今天日期：${dateLabel}`)

  let items: any[] = []
  try {
    items = JSON.parse(raw.replace(/```json|```/g, '').trim())
  } catch { throw new Error('AI输出JSON解析失败') }
  if (!Array.isArray(items) || !items.length) throw new Error('AI未生成内容')

  return items.slice(0, n).map((it: any) => {
    const platform = PLATFORM_LABELS[it.platform] ? it.platform : 'xiaohongshu'
    const imgPrompt = String(it.image_prompt || it.topic || instruction)
    return {
      platform,
      platformName: PLATFORM_LABELS[platform],
      topic: `${it.topic || '内容'}（${dateLabel}）`,
      type: 'copy',
      content: [it.title, it.content].filter(Boolean).join('\n\n'),
      imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(imgPrompt)}?width=768&height=1024&nologo=true&model=flux&seed=${Date.now() + Math.floor(Math.random() * 1e5)}`,
      published: false,
      createdAt: Date.now(),
    }
  })
}
