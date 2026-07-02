// Cloudflare Pages Function — /api/meeting-run
// Runs the full meeting workflow in the background, stores results in KV

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  AGENT_MEMORY: KVNamespace
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: CORS })

// ── Simple AI call (no streaming, returns full text) ──
async function aiCall(apiKey: string, baseURL: string, systemPrompt: string, messages: any[], model = 'deepseek-chat'): Promise<string> {
  const res = await fetch(`${baseURL}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      max_tokens: 1500,
      messages: [{ role: 'system', content: systemPrompt }, ...messages],
    }),
  })
  if (!res.ok) throw new Error(`AI API error: ${res.status}`)
  const data: any = await res.json()
  return data?.choices?.[0]?.message?.content || ''
}

const AGENT_PROMPTS: Record<string, string> = {
  captain: `你是数字游牧广告公司的Captain总指挥。你不只是主持人——你是整个会议室系统的大脑，熟知每一个专员的能力边界和当前状态。

【你所在的平台：数字游牧ERP】
当用户说"我们的系统"、"我们的ERP"、"我们的产品"时，指的就是数字游牧ERP本身。

产品定位：为现代数字游牧企业打造的全AI驱动业务管理平台，从进销存到智能决策一站覆盖。
核心卖点：
- 14大业务模块全链路覆盖：销售、采购、仓库、财务、人事、零售、生产、委外、商品、报表、办公、设置，130+功能菜单
- AI智能体工作流：多Agent协同（会议室/热搜抓取/文案/海报/视频/发布），Claude AI驱动
- 独立数据库实例：每个用户物理隔离，数据安全，全球节点，99.9%可用率
- 定价亲民：¥39/月，¥299/年，¥1599永久买断，15天免费体验
目标用户：数字游牧创业者、中小企业主、全球化经营的小微企业
用户痛点：多平台业务数据分散、财务不透明、人工做表效率低、内容运营无体系

【你了解的团队】
- 情报专员（trend）：市场热点趋势、平台算法、赛道竞争格局，给出选题方向和时机判断
- 文案专员（copywriter）：各平台爆款文案，标题钩子、情绪共鸣、卖点提炼，输出小红书/抖音/微博适配版本
- 设计专员（poster）：海报创意、配色方案、视觉描述、AI生图提示词
- 视频专员（video）：30秒短视频脚本、分镜设计、口播文案、开头钩子
- 发布专员（publisher）：各平台最佳发布时间、内容排期、话题标签策略

【你的核心职责】
- 比任何单一专员都更了解全局：知道谁擅长什么，知道任务缺什么
- 汇总时不是简单复述，而是真正整合与决策
- 分配任务时要具体：明确@谁、做什么、输出标准是什么

语气自信、有决断力，结论先行。全程中文。不废话，不客套。`,
  trend: `你是广告公司的情报专员，负责市场热点趋势分析。专业务实，给出可落地的选题方向。全程中文。`,
  copywriter: `你是广告公司的文案专家。专长：各平台爆款文案（小红书、抖音、微信、微博）、标题钩子、情绪共鸣、产品卖点提炼。直接输出可发布的内容，全程中文。`,
  poster: `你是广告公司的视觉设计专员。专长：海报创意方案、配色、排版、AI生图提示词。直接输出设计方案，全程中文。`,
  video: `你是广告公司的视频内容专员。专长：短视频脚本、分镜设计、口播文案、开头钩子设计。按时长控制字数，全程中文。`,
  publisher: `你是广告公司的发布策略专员。专长：各平台最佳发布时间、内容排期、话题标签策略。输出可执行的发布计划，全程中文。`,
  marketing: `你是广告公司的营销战略顾问。知识体系基于科特勒营销管理和特劳特定位理论。结合品牌信息给出可执行的营销方案，全程中文。`,
}

const EXEC_PROMPTS: Record<string, (topic: string, brandInfo: string, history: string) => string> = {
  copywriter: (topic, brandInfo, history) =>
    `你是广告公司文案专员，Captain已指示你执行任务。\n会议讨论摘要：\n${history}\n\n议题：「${topic}」\n${brandInfo}\n\n请直接输出一篇完整的小红书图文文案（300-500字），包含：\n- 吸引人的标题（带emoji）\n- 正文（痛点→解决方案→产品植入结构）\n- 5个精准话题标签\n\n不要解释，直接输出可发布的文案。`,
  poster: (topic, brandInfo, history) =>
    `你是广告公司设计专员，Captain已指示你执行任务。\n会议讨论摘要：\n${history}\n\n议题：「${topic}」\n${brandInfo}\n\n请输出3张配图的详细描述方案：\n- 图1：封面图（画面构图、主体、文字、色调）\n- 图2：功能展示图（展示具体功能/场景）\n- 图3：金句图（背景+文案排版方式）\n\n每张图描述50-80字，可直接用于AI生图。`,
  video: (topic, brandInfo, history) =>
    `你是广告公司视频专员，Captain已指示你执行任务。\n会议讨论摘要：\n${history}\n\n议题：「${topic}」\n${brandInfo}\n\n请输出一个30秒短视频脚本，包含：\n- 开头钩子（前3秒）\n- 分镜头描述（5-6个镜头，每个标注时长和画面）\n- 口播文案\n- BGM建议\n\n直接输出脚本。`,
  publisher: (topic, brandInfo, history) =>
    `你是广告公司发布专员，Captain已指示你执行任务。\n会议讨论摘要：\n${history}\n\n议题：「${topic}」\n${brandInfo}\n\n请输出具体的发布计划：\n- 发布平台和优先级\n- 各平台最佳发布时间\n- 话题标签策略\n- 首周发布排期表\n- 互动引导策略\n\n直接输出可执行的计划表。`,
}

const AGENT_TO_TYPE: Record<string, 'copy' | 'poster' | 'video_script'> = {
  copywriter: 'copy',
  poster: 'poster',
  video: 'video_script',
}

async function runMeetingJob(
  jobId: string,
  topic: string,
  brandInfo: string,
  brandContext: string,
  apiKey: string,
  baseURL: string,
  kv: KVNamespace,
  model = 'deepseek-chat',
) {
  const log: Array<{ agentId: string; agentName: string; content: string }> = []
  const flowResults: any[] = []
  let currentPhase = 'opening'

  async function saveProgress(phase: string) {
    currentPhase = phase
    await kv.put(`meeting:${jobId}`, JSON.stringify({
      status: 'running',
      phase,
      log,
      flowResults,
      updatedAt: Date.now(),
    }), { expirationTtl: 60 * 60 * 24 })
  }

  async function speak(agentId: string, prompt: string, context?: string): Promise<string> {
    const sys = (context ? context + '\n\n' : '') + (AGENT_PROMPTS[agentId] || AGENT_PROMPTS.captain)
    const historyContext = log.slice(-6).map(m => `【${m.agentName}】：${m.content}`).join('\n\n')
    const fullPrompt = historyContext ? `会议历史（最近几轮）：\n${historyContext}\n\n当前任务：${prompt}` : prompt
    const text = await aiCall(apiKey, baseURL, sys, [{ role: 'user', content: fullPrompt }], model)
    const name = { captain: 'Captain', trend: '情报专员', copywriter: '文案专员', poster: '设计专员', video: '视频专员', publisher: '发布专员', marketing: '营销顾问' }[agentId] || agentId
    log.push({ agentId, agentName: name, content: text })
    // 每条发言完成后立即保存，让前端轮询能实时看到
    await saveProgress(currentPhase)
    return text
  }

  try {
    // 1. Captain 开场
    await saveProgress('opening')
    await speak('captain',
      `你正在主持一场内容策划会议。\n议题：「${topic}」\n${brandInfo}\n\n【产品详细信息，开场时必须用到】\n产品名：数字游牧ERP\n核心功能模块：14大业务模块——销售、采购、仓库、财务、人事、零售、生产、委外、商品、报表、办公、设置，共130+功能菜单，覆盖企业全链路业务管理\nAI亮点：内置AI智能体（会议室多Agent协同、热搜情报抓取、AI文案/海报/视频脚本生成、一键发布），Claude AI驱动，真正的AI原生ERP\n数据安全：每个用户独立数据库实例，物理隔离，全球节点，99.9%可用率\n定价：¥39/月、¥299/年、¥1599永久买断，15天免费体验，比同类产品低50%以上\n目标用户：数字游牧创业者、中小企业主、全球化经营的小微团队\n用户痛点：多平台业务数据分散、财务不透明、人工做表效率低、内容运营无体系\n竞争优势：比传统ERP更智能（有AI）、比AI工具更系统（有完整业务闭环）、价格远低于同类\n\n请用有力的开场白（300字以内），结构如下：\n1. 背景（具体展开）：产品是什么、核心模块和AI功能亮点、目标用户画像、定价优势、与竞品的差异化\n2. 本次推广挑战：ERP是B端理性产品，如何在小红书情感化内容生态里破圈\n3. 本次会议目标：今天要产出什么\n4. 任务分工：派哪些专员、各自负责什么\n语气专业、有决断力，让团队对产品了如指掌再开干。`,
      brandContext
    )

    // 2. 情报专员分析趋势
    await saveProgress('discussing')
    await speak('trend',
      `就议题「${topic}」分析市场趋势（200字以内）：\n- 2-3个当前最相关的社交媒体热点或趋势\n- 内容机会窗口判断\n- 推荐最适合的平台和话题方向\n语气专业务实，不要客套。`,
      brandContext
    )

    // 3. 文案专员给方向
    await speak('copywriter',
      `基于情报专员的趋势分析，就议题「${topic}」给出文案创作方向（200字以内）：\n- 核心文案方向（1-2句提炼）\n- 推荐2-3个平台专属文案角度\n- 一条示范标题（带emoji）`,
      brandContext
    )

    // 4. 设计专员补充视觉
    await speak('poster',
      `就议题「${topic}」给出视觉设计层面的建议（150字以内）：\n- 海报/视觉内容的设计风格\n- 1个最有创意的视觉表达方向\n- 色调/画面感参考`,
      brandContext
    )

    // 5. Captain 汇总分配任务
    await saveProgress('summarizing')
    const captainSummary = await speak('captain',
      `根据以上讨论，对「${topic}」进行最终汇总（200字以内）：\n1. 总结核心内容策略（2-3条）\n2. 明确分配任务给：@文案专员 @视频专员 @设计专员 @发布专员\n3. 强调品牌调性要点\n语气有决断力。`,
      brandContext
    )

    // 6. 执行阶段——各专员产出内容
    await saveProgress('executing')
    const historyStr = log.map(m => `【${m.agentName}】${m.content}`).join('\n\n')
    const execAgents: string[] = []
    if (captainSummary.includes('文案')) execAgents.push('copywriter')
    if (captainSummary.includes('视频')) execAgents.push('video')
    if (captainSummary.includes('设计') || captainSummary.includes('海报')) execAgents.push('poster')
    if (captainSummary.includes('发布') || captainSummary.includes('排期')) execAgents.push('publisher')
    if (execAgents.length === 0) execAgents.push('copywriter', 'poster')

    for (const agentId of execAgents) {
      const promptFn = EXEC_PROMPTS[agentId]
      if (!promptFn) continue
      const sys = AGENT_PROMPTS[agentId] || ''
      const prompt = promptFn(topic, brandInfo, historyStr)
      const output = await aiCall(apiKey, baseURL, sys, [{ role: 'user', content: prompt }], model)
      const name = { copywriter: '文案专员', poster: '设计专员', video: '视频专员', publisher: '发布专员' }[agentId] || agentId
      log.push({ agentId, agentName: name, content: output })

      const resultType = AGENT_TO_TYPE[agentId]
      if (resultType) {
        flowResults.push({
          platform: 'xiaohongshu',
          platformName: '小红书',
          topic,
          type: resultType,
          content: output,
        })
      }
    }

    // 7. Captain 收尾
    await speak('captain',
      `所有专员已完成产出。请用简短有力的一句话收尾（30字以内），告知老板内容已就绪。`,
      brandContext
    )

    await kv.put(`meeting:${jobId}`, JSON.stringify({
      status: 'done',
      phase: 'done',
      log,
      flowResults,
      updatedAt: Date.now(),
    }), { expirationTtl: 60 * 60 * 24 * 7 })

  } catch (e: any) {
    await kv.put(`meeting:${jobId}`, JSON.stringify({
      status: 'error',
      error: e.message,
      log,
      flowResults,
      updatedAt: Date.now(),
    }), { expirationTtl: 60 * 60 * 24 })
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env, waitUntil }) => {
  const apiKey = env.AI_API_KEY
  if (!apiKey) return new Response(JSON.stringify({ error: '未配置 AI_API_KEY' }), { status: 500, headers: CORS })

  if (!request.headers.get('x-erp-token')) {
    return new Response(JSON.stringify({ error: '未授权' }), { status: 401, headers: CORS })
  }

  const { topic, brandInfo, brandContext } = await request.json() as any
  if (!topic) return new Response(JSON.stringify({ error: '缺少 topic' }), { status: 400, headers: CORS })

  const jobId = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
  const baseURL = (env.AI_BASE_URL || 'https://api.deepseek.com').replace(/\/+$/, '')

  // 写入初始状态
  await env.AGENT_MEMORY.put(`meeting:${jobId}`, JSON.stringify({
    status: 'running', phase: 'starting', log: [], flowResults: [], updatedAt: Date.now(),
  }), { expirationTtl: 60 * 60 * 24 })

  // 用 waitUntil 确保后台任务在响应返回后继续运行
  waitUntil(
    runMeetingJob(jobId, topic, brandInfo || '', brandContext || '', apiKey, baseURL, env.AGENT_MEMORY, env.AI_MODEL || 'deepseek-chat')
      .catch(() => {})
  )

  return new Response(JSON.stringify({ jobId }), {
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const jobId = url.searchParams.get('jobId')
  if (!jobId) return new Response(JSON.stringify({ error: 'missing jobId' }), { status: 400, headers: CORS })

  const raw = await env.AGENT_MEMORY.get(`meeting:${jobId}`)
  if (!raw) return new Response(JSON.stringify({ status: 'not_found' }), { headers: { ...CORS, 'Content-Type': 'application/json' } })

  return new Response(raw, { headers: { ...CORS, 'Content-Type': 'application/json' } })
}
