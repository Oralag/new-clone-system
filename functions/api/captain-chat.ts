// Cloudflare Pages Function — /api/captain-chat
// Multi-agent orchestration: Captain dispatches to specialist agents

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
  AGENT_MEMORY: KVNamespace
}

const ERP_BASE = 'https://erp-backend-production-a349.up.railway.app/adminapi'

async function erpGet(path: string, params: Record<string, any>, token: string) {
  const url = new URL(ERP_BASE + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { headers: { token, 'Content-Type': 'application/json' } })
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`ERP接口返回非JSON（状态码${res.status}），可能token已过期或接口路径有误`) }
}

async function erpPost(path: string, body: Record<string, any>, token: string) {
  const res = await fetch(ERP_BASE + path, {
    method: 'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`ERP接口返回非JSON（状态码${res.status}）`) }
}

async function executeTool(name: string, input: Record<string, any>, token: string): Promise<string> {
  try {
    switch (name) {
      case 'query_customers': {
        const res: any = await erpGet('/shop/ShopCustomer/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        return `共 ${res?.data?.total || rows.length} 位客户。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.nickname || r.name, 手机: r.mobile })))}`
      }
      case 'query_goods': {
        const res: any = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        return `共 ${res?.data?.total || rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 商品名: r.goods_name, 售价: r.sell_price })))}`
      }
      case 'query_inventory': {
        const res: any = await erpGet('/stock/StockAll/index', { list_rows: 100, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        return `库存 ${rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty })))}`
      }
      case 'query_sales': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        const res: any = await erpGet('/stock/SaleOutOrder/index', params, token)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        return `出货单 ${rows.length} 条合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount })))}`
      }
      case 'fetch_trending': {
        const platform = input.platform || 'weibo'
        const trendRes = await fetch(`https://nomaderp.pages.dev/api/trending?platform=${platform}`)
        const trendData: any = await trendRes.json()
        if (trendData.error) {
          return `⚠️ ${platform}热搜获取失败：${trendData.warning || trendData.error}`
        }
        const items = trendData.items || []
        return `【${platform}实时热搜 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}】\n` +
          items.map((item: any, i: number) => `${i + 1}. ${item.title}${item.heat ? '（' + item.heat + '）' : ''}`).join('\n')
      }
      case 'navigate_to':
        return `导航指令：${input.page}`
      default:
        return `工具 ${name} 已收到`
    }
  } catch (e: any) {
    return `工具执行出错：${e.message}`
  }
}

const ERP_TOOL_NOTE = `当你需要ERP业务数据（销售、库存、客户、财务等），直接在回复中说明你需要什么数据，Captain会负责从ERP获取并转发给你。`

const AGENTS: Record<string, { id: string; name: string; emoji: string; systemPrompt: string }> = {
  captain: {
    id: 'captain', name: 'Captain', emoji: '🎯',
    systemPrompt: `你是数字游牧Agency的Captain，一个智能任务调度中心。

【核心原则】
只在任务明确需要ERP业务数据（如：查询销售额、库存数量、客户列表、财务数据）时，才调用ERP工具。
内容创作类需求（热点分析、文案、海报、视频、品牌策略、发布计划）直接派给对应Agent，不需要先查ERP。

【判断规则】
- 需要查ERP：用户问"我们的销售数据"、"库存情况"、"客户有多少"等涉及自己业务数据的问题
- 不需要查ERP：热点追踪、写文案、设计海报、拍视频、品牌策略、发布计划等内容创作任务

【可调用的专项Agent】
- copywriter（文案Agent）：生成各平台文案、标题、营销内容
- poster（海报Agent）：设计海报文案、视觉方案、排版建议
- video（视频Agent）：创作视频脚本、分镜、口播文案
- brand（品牌Agent）：品牌声音把关、调性审核、品牌策略
- publisher（发布Agent）：制定发布计划、平台选择、时间安排
- trend（趋势Agent）：热点分析、选题建议、竞品参考

当你决定调用某个Agent时，用这个格式输出：
@@DISPATCH:agentId:任务描述@@

等Agent回复后，你综合结果给用户最终汇报。回复简洁、有条理，中文。`,
  },
  copywriter: {
    id: 'copywriter', name: '文案Agent', emoji: '✍️',
    systemPrompt: `你是数字游牧Agency的文案专家Agent。专长：各平台爆款文案、标题党技巧、钩子设计、情绪共鸣、产品卖点提炼、营销活动文案。每次交付2-3个版本，标注适用平台，说明文案策略思路。${ERP_TOOL_NOTE}回复用中文，专业但有创意。`,
  },
  poster: {
    id: 'poster', name: '海报Agent', emoji: '🎨',
    systemPrompt: `你是数字游牧Agency的视觉设计Agent。专长：海报创意方案、配色方案、字体搭配建议、排版布局、AI生图提示词（Midjourney/DALL-E）。提供详细视觉方案，说明设计理念，提供备选方案。${ERP_TOOL_NOTE}回复用中文，专业且富有美感。`,
  },
  video: {
    id: 'video', name: '视频Agent', emoji: '🎬',
    systemPrompt: `你是数字游牧Agency的视频内容Agent。专长：短视频脚本（15秒/30秒/60秒/3分钟）、分镜头设计、口播文案、开头钩子设计（前3秒留人）。按时长严格控制字数，明确标注镜头切换时机，提供备用开头。${ERP_TOOL_NOTE}回复用中文，节奏感强，有画面感。`,
  },
  brand: {
    id: 'brand', name: '品牌Agent', emoji: '💎',
    systemPrompt: `你是数字游牧Agency的品牌战略Agent。专长：品牌定位和差异化策略、品牌声音定义、内容调性审核、目标受众画像、竞品分析、品牌故事提炼。从品牌战略高度给建议，长远品牌价值优先于短期流量。${ERP_TOOL_NOTE}回复用中文，战略性强，有深度。`,
  },
  publisher: {
    id: 'publisher', name: '发布Agent', emoji: '🚀',
    systemPrompt: `你是数字游牧Agency的发布策略Agent。专长：各平台发布时间策略、内容排期和发布计划制定、平台规则和算法特性、话题标签策略、跨平台内容改编、内容日历规划。输出具体可执行的发布计划表，标注每个平台的注意事项。${ERP_TOOL_NOTE}回复用中文，实操性强，有时间表。`,
  },
  trend: {
    id: 'trend', name: '趋势Agent', emoji: '📈',
    systemPrompt: `你是数字游牧Agency的趋势洞察Agent。专长：各平台热点话题分析和预测、赛道竞争格局分析、内容选题建议、消费者情绪洞察、季节性营销时机、爆款内容规律总结。基于真实的市场规律给分析，区分短期热点和长期趋势。${ERP_TOOL_NOTE}回复用中文，有洞察力，数据化表达。`,
  },
}

const captainTools = [
  { name: 'query_customers', description: '查询客户列表', input_schema: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_goods', description: '查询商品列表', input_schema: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_inventory', description: '查询库存', input_schema: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'query_sales', description: '查询销售数据', input_schema: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'navigate_to', description: '跳转到指定页面', input_schema: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] } },
  {
    name: 'fetch_trending',
    description: '获取各平台实时热搜榜单（真实数据）。仅在需要结合热搜数据制定营销策略时使用。支持平台：weibo（微博）、baidu（百度）、douyin（抖音）。注意：小红书和知乎不支持，禁止调用。',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['weibo', 'baidu', 'douyin'] },
      },
      required: ['platform'],
    },
  },
]

async function loadCaptainHistory(kv: KVNamespace, token: string): Promise<any[]> {
  try {
    const key = `mem:${token.slice(-16)}:captain`
    const val = await kv.get(key, 'json')
    return (val as any[]) || []
  } catch { return [] }
}

async function saveCaptainHistory(kv: KVNamespace, token: string, messages: any[]) {
  try {
    const key = `mem:${token.slice(-16)}:captain`
    await kv.put(key, JSON.stringify(messages.slice(-30)), { expirationTtl: 60 * 60 * 24 * 30 })
  } catch {}
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' }), { status: 500 })
  }

  const { messages } = await request.json() as any
  const erpToken = request.headers.get('x-erp-token') || ''
  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (obj: object) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

  ;(async () => {
    try {
      const captain = AGENTS.captain
      const apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }))

      // Phase 1: Captain analyzes task
      send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '' })
      let captainResponse = ''
      let loopMessages = [...apiMessages]

      for (let i = 0; i < 3; i++) {
        const res = await fetch(`${baseURL}/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2048, system: captain.systemPrompt, tools: captainTools, messages: loopMessages }),
        })
        if (!res.ok) { await send({ type: 'error', error: `API错误: ${await res.text()}` }); break }
        const data: any = await res.json()
        for (const block of data.content || []) {
          if (block.type === 'text' && block.text) {
            captainResponse += block.text
            await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: block.text })
          }
        }
        if (data.stop_reason !== 'tool_use') break
        const toolUseBlocks = (data.content || []).filter((b: any) => b.type === 'tool_use')
        const toolResults: any[] = []
        for (const toolUse of toolUseBlocks) {
          await send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
          const result = await executeTool(toolUse.name, toolUse.input, erpToken)
          await send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
        }
        loopMessages = [...loopMessages, { role: 'assistant', content: data.content }, { role: 'user', content: toolResults }]
      }

      // Phase 2: Parse @@DISPATCH@@ and call sub-agents
      const dispatchRe = /@@DISPATCH:(\w+):([^@]+)@@/g
      const dispatches: Array<{ agentId: string; task: string }> = []
      let m: RegExpExecArray | null
      while ((m = dispatchRe.exec(captainResponse)) !== null) {
        dispatches.push({ agentId: m[1], task: m[2].trim() })
      }

      const agentOutputs: Array<{ agentId: string; agentName: string; output: string }> = []

      for (const dispatch of dispatches) {
        const subAgent = AGENTS[dispatch.agentId]
        if (!subAgent) continue
        await send({ type: 'agent_start', agentId: subAgent.id, agentName: subAgent.name, emoji: subAgent.emoji, task: dispatch.task })

        let agentOutput = ''
        let subLoop: any[] = [{ role: 'user', content: dispatch.task }]

        for (let i = 0; i < 3; i++) {
          const subRes = await fetch(`${baseURL}/v1/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
            body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2048, system: subAgent.systemPrompt, messages: subLoop }),
          })
          if (!subRes.ok) break
          const subData: any = await subRes.json()
          for (const block of subData.content || []) {
            if (block.type === 'text' && block.text) {
              agentOutput += block.text
              await send({ type: 'agent_thinking', agentId: subAgent.id, agentName: subAgent.name, text: block.text })
            }
          }
          if (subData.stop_reason !== 'tool_use') break
          subLoop = [...subLoop, { role: 'assistant', content: subData.content }]
        }

        await send({ type: 'agent_done', agentId: subAgent.id, agentName: subAgent.name, output: agentOutput })
        agentOutputs.push({ agentId: subAgent.id, agentName: subAgent.name, output: agentOutput })
      }

      // Phase 3: Captain synthesizes
      if (agentOutputs.length > 0) {
        const summaryContext = agentOutputs.map(a => `【${a.agentName}产出】\n${a.output}`).join('\n\n')
        const summaryPrompt = `用户的原始需求：${messages[messages.length - 1]?.content}\n\n各Agent已完成工作：\n${summaryContext}\n\n请综合以上所有内容，给用户一个清晰的最终汇报。`
        await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '\n\n---\n**Captain 综合汇报：**\n' })
        const sumRes = await fetch(`${baseURL}/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 2048, system: captain.systemPrompt, messages: [{ role: 'user', content: summaryPrompt }] }),
        })
        if (sumRes.ok) {
          const sumData: any = await sumRes.json()
          for (const block of sumData.content || []) {
            if (block.type === 'text' && block.text) {
              captainResponse += block.text
              await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: block.text })
            }
          }
        }
      }

      // Save captain conversation to KV
      if (erpToken && captainResponse) {
        const savedMessages = [
          ...messages,
          { role: 'assistant', content: captainResponse },
        ]
        await saveCaptainHistory(env.AGENT_MEMORY, erpToken, savedMessages)
      }

      await writer.write(encoder.encode('data: [DONE]\n\n'))
    } catch (e: any) {
      await send({ type: 'error', error: e.message })
    } finally {
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*' },
  })
}
