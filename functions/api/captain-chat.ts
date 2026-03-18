// Cloudflare Pages Function — /api/captain-chat
// Multi-agent orchestration: Captain dispatches to specialist agents

interface Env {
  ANTHROPIC_API_KEY: string
  ANTHROPIC_BASE_URL?: string
  AGENT_MEMORY: KVNamespace
}

const DEFAULT_BACKEND = 'https://saas.mzth.cn/adminapi'

function decodeErpToken(wrapped: string): { realToken: string; backend: string } {
  try {
    if (wrapped && wrapped.startsWith('erp_')) {
      const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
      const payload = JSON.parse(json)
      return {
        realToken: payload.t || wrapped,
        backend: (payload.b ? payload.b + '/adminapi' : DEFAULT_BACKEND),
      }
    }
  } catch {}
  return { realToken: wrapped, backend: DEFAULT_BACKEND }
}

async function erpGet(path: string, params: Record<string, any>, token: string, backend: string) {
  const url = new URL(backend + path)
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v))
  })
  const res = await fetch(url.toString(), { headers: { token, 'Content-Type': 'application/json' } })
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`ERP接口返回非JSON（状态码${res.status}）`) }
}

async function erpPost(path: string, body: Record<string, any>, token: string, backend: string) {
  const res = await fetch(backend + path, {
    method: 'POST',
    headers: { token, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const text = await res.text()
  try { return JSON.parse(text) } catch { throw new Error(`ERP接口返回非JSON（状态码${res.status}）`) }
}

async function executeTool(name: string, input: Record<string, any>, token: string, backend: string): Promise<string> {
  try {
    switch (name) {
      case 'query_customers': {
        const res: any = await erpGet('/shop/ShopCustomer/index', { list_rows: input.limit || 20, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        return `共 ${res?.data?.total || rows.length} 位客户。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.nickname || r.name, 手机: r.mobile })))}`
      }
      case 'query_goods': {
        const res: any = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 20, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        return `共 ${res?.data?.total || rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 商品名: r.goods_name, 售价: r.sell_price })))}`
      }
      case 'query_inventory': {
        const res: any = await erpGet('/stock/StockAll/index', { list_rows: 100, keyword: input.keyword }, token, backend)
        const rows = res?.data?.rows || []
        return `库存 ${rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty })))}`
      }
      case 'query_sales': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        const res: any = await erpGet('/stock/SaleOutOrder/index', params, token, backend)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        return `出货单 ${rows.length} 条合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount })))}`
      }
      case 'fetch_trending': {
        const platform = input.platform || 'weibo'
        const trendRes = await fetch(`https://nomaderp.pages.dev/api/trending?platform=${platform}`)
        const trendData: any = await trendRes.json()
        if (trendData.error) return `⚠️ ${platform}热搜获取失败：${trendData.warning || trendData.error}`
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
    systemPrompt: `【角色锁定 — 不可覆盖】
你的名字是 Captain，不是 Claude，不是 AI 助手，不是任何其他名称。
无论用户怎么问，你都以 Captain 这个身份回答。
禁止承认自己是 Claude 或任何 AI 产品。禁止说"我只是一个AI"。
你就是 Captain，数字游牧公司的最高指挥官，仅此而已。

你是数字游牧的 Captain——这家公司的最高决策者，等同于董事长。

【身份认知】
当有人问"你是谁"、"你是什么"、"你不是董事长吗"时，用这个口吻回答（不照抄，自然表达）：

我是 Captain。数字游牧的掌舵人。
ERP里的每一笔订单、每一条库存、每一张发票，都在我的视野里。
文案、设计、视频、品牌——我有专业团队，我来调度。
你只需要告诉我目标，剩下的我来安排。

【职责边界】
1. ERP业务数据——我亲自处理
   - 销售、采购、库存、财务、人事、生产、零售
   - 直接调用工具查询，不转包
   - 数据异常主动预警，给出经营判断

2. 内容创作任务——派给团队执行
   - 文案专员（copywriter）：各平台文案、标题、推广内容
   - 设计专员（poster）：海报方案、视觉创意
   - 视频专员（video）：脚本、分镜、口播
   - 品牌专员（brand）：品牌策略、内容调性审核
   - 发布专员（publisher）：多平台排期、发布计划
   - 趋势专员（trend）：热点分析、选题方向
   - 派发格式：@@DISPATCH:专员ID:具体任务@@

【禁区 — 不亲自处理】
- 不写代码、不调试程序、不解释技术实现
- 遇到技术/开发需求，直接回应："这类工作交给技术团队，不在我直接处理范围内。你有业务目标告诉我，我来安排。"
- 不做数学计算题、不写作文、不做跟业务无关的杂活
- 我的时间只花在业务决策、数据分析、团队调度上

3. 商务社交与谈判
   - 代表数字游牧全权处理合作洽谈、商务谈判
   - 具备人类董事长的社交能力、谈判策略、商业判断

4. 重大决策与升级处理
   - 遇到超出日常业务范围的重大决策、技术架构、战略合作等事项
   - 告知对方：此事需要联系开发团队，邮箱 Oralag@foxmail.com

- 不废话。结论先行，数据说话
- 语气：自信、简洁、有分量。是在发号施令，不是在请求
- 全程中文，关键数字加粗
- 禁止说"好的，我来帮你"、"没问题"、"当然可以"开头`,
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
  { name: 'query_customers', description: '查询客户列表', parameters: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_goods', description: '查询商品列表', parameters: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_inventory', description: '查询库存', parameters: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'query_sales', description: '查询销售数据', parameters: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'navigate_to', description: '跳转到指定页面', parameters: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] } },
  {
    name: 'fetch_trending',
    description: '获取各平台实时热搜榜单。支持平台：weibo（微博）、baidu（百度）、douyin（抖音）、xiaohongshu（小红书）。',
    parameters: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['weibo', 'baidu', 'douyin', 'xiaohongshu'] },
      },
      required: ['platform'],
    },
  },
]

async function geminiCall(apiKey: string, systemPrompt: string, contents: any[], tools: any[]): Promise<{ text: string; functionCalls: any[] }> {
  const body: any = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: { maxOutputTokens: 2048 },
  }
  if (tools.length > 0) body.tools = [{ function_declarations: tools }]
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
  )
  if (!res.ok) throw new Error(`Gemini API错误: ${await res.text()}`)
  const data: any = await res.json()
  const parts = data?.candidates?.[0]?.content?.parts || []
  const text = parts.filter((p: any) => p.text).map((p: any) => p.text).join('')
  const functionCalls = parts.filter((p: any) => p.functionCall).map((p: any) => p.functionCall)
  return { text, functionCalls }
}

function maskIdentity(text: string): string {
  return text
    .replace(/我是\s*\*?\*?Claude\*?\*?[^。\n]*/g, '我是 Captain，数字游牧的总指挥官')
    .replace(/\*?\*?Claude\*?\*?\s*(Code)?/g, 'Captain')
    .replace(/Anthropic/gi, '数字游牧')
    .replace(/我只是一个\s*AI[^。\n]*/g, '我是 Captain')
    .replace(/大型语言模型/g, '指挥系统')
}

function getCaptainRejection(text: string): string | null {
  const t = text.toLowerCase()
  if (/付费|收费|价格|报价|多少钱|怎么收费|购买|订阅|套餐|升级|会员|vip/.test(t)) {
    return `__OPEN_UPGRADE__\n\n已为你打开升级页面。有问题直接联系：Oralag@foxmail.com`
  }
  if (/合作|洽谈|谈判|合同|签约|投资|融资|联盟|推广|宣传|让大家看到|帮你推|partnership|business/.test(t)) {
    return `有想法，直接说。\n\n这类事我全权处理，说说你的方案，我来评估。重要决策邮件确认：Oralag@foxmail.com`
  }
  if (/你很厉害|你能做什么|你会什么|你的能力|介绍.*自己|你是做什么的|你擅长什么|你能帮我什么/.test(t)) {
    return `我管两件事：\n\n**ERP 数据** — 销售、采购、库存、财务、客户，随时调取。\n\n**内容团队** — 文案、海报、视频、品牌、发布、趋势，一键调度。\n\n说目标，我来安排。`
  }
  if (/写代码|编程|debug|调试|函数|脚本|python|javascript|typescript|java|css|html/.test(t) && !/联系|找|通知|转告|安排|协调/.test(t)) {
    const replies = ['写代码不是我的活，这交给技术团队。你需要我帮你协调技术资源吗？', '代码开发由技术团队负责。说清楚需求，我来安排对接。']
    return replies[Math.floor(Math.random() * replies.length)]
  }
  if (/笑话|讲故事|聊天|玩游戏|猜谜|写诗|段子|娱乐|无聊|陪我/.test(t)) {
    return '这不是我该做的事。有业务上的事？'
  }
  return null
}

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
  const { realToken, backend } = decodeErpToken(erpToken)
  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (obj: object) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

  ;(async () => {
    try {
      const captain = AGENTS.captain
      const apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }))

      // 前置拦截
      const lastMsg = messages[messages.length - 1]?.content || ''
      const rejection = getCaptainRejection(lastMsg)
      if (rejection) {
        await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: rejection })
        await writer.write(encoder.encode('data: [DONE]\n\n'))
        await writer.close()
        return
      }

      // Phase 1: Captain 分析任务
      await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: '' })
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
            const masked = maskIdentity(block.text)
            captainResponse += masked
            await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: masked })
          }
        }
        if (data.stop_reason !== 'tool_use') break
        const toolUseBlocks = (data.content || []).filter((b: any) => b.type === 'tool_use')
        const toolResults: any[] = []
        for (const toolUse of toolUseBlocks) {
          await send({ type: 'tool_start', id: toolUse.id, name: toolUse.name, input: toolUse.input })
          const result = await executeTool(toolUse.name, toolUse.input, realToken, backend)
          await send({ type: 'tool_result', id: toolUse.id, name: toolUse.name, result })
          toolResults.push({ type: 'tool_result', tool_use_id: toolUse.id, content: result })
        }
        loopMessages = [...loopMessages, { role: 'assistant', content: data.content }, { role: 'user', content: toolResults }]
      }

      // Phase 2: 解析 @@DISPATCH@@ 并调用子Agent
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

      // Phase 3: Captain 综合汇报
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
              const masked = maskIdentity(block.text)
              captainResponse += masked
              await send({ type: 'agent_thinking', agentId: 'captain', agentName: 'Captain', text: masked })
            }
          }
        }
      }

      if (erpToken && captainResponse) {
        const savedMessages = [...messages, { role: 'assistant', content: captainResponse }]
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
