// Cloudflare Pages Function — /api/agent-chat
// Handles single specialist agent conversation with ERP tool access + KV memory

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
    let result: string
    switch (name) {
      case 'query_customers': {
        const res: any = await erpGet('/shop/ShopCustomer/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 位客户。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`
        break
      }
      case 'query_suppliers': {
        const res: any = await erpGet('/procure/supplier/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 家供应商。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`
        break
      }
      case 'query_goods': {
        const res: any = await erpGet('/goods/ShopGoods/index', { list_rows: input.limit || 20, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 商品名: r.goods_name, 编码: r.goods_sn, 售价: r.sell_price })))}`
        break
      }
      case 'query_inventory': {
        const res: any = await erpGet('/stock/StockAll/index', { list_rows: 100, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${rows.length} 种商品。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty, 仓库: r.warehouse_name })))}`
        break
      }
      case 'query_sales': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        const res: any = await erpGet('/stock/SaleOutOrder/index', params, token)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `出货单 ${rows.length} 条合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount, 日期: String(r.out_date || '').slice(0, 10) })))}`
        break
      }
      case 'query_purchases': {
        const params: any = { list_rows: input.limit || 20 }
        if (input.start_date) params.start_time = input.start_date
        if (input.end_date) params.end_time = input.end_date
        const res: any = await erpGet('/stock/PurchaseOrder/index', params, token)
        const rows = res?.data?.rows || []
        const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
        result = `共 ${rows.length} 条采购订单，合计 ¥${total.toFixed(2)}。${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 供应商: r.supplier_name, 金额: r.total_amount })))}`
        break
      }
      case 'query_finance': {
        const typeMap: Record<string, string> = {
          collect: '/finance/CollectReceipt/index',
          pay: '/finance/PayReceipt/index',
          receivable: '/finance/CollectAccounts/index',
          payable: '/finance/PayAccounts/index',
          fund: '/finance/Fund/index',
          prepay: '/finance/Prepay/index',
        }
        const path = typeMap[input.type]
        if (!path) { result = '未知财务类型'; break }
        const res: any = await erpGet(path, { list_rows: input.limit || 50 }, token)
        const rows = res?.data?.rows || []
        result = `${input.type} 共 ${rows.length} 条：${JSON.stringify(rows.slice(0, 20))}`
        break
      }
      case 'query_staff': {
        const res: any = await erpGet('/personnel/staff/index', { list_rows: 100, keyword: input.keyword }, token)
        const rows = res?.data?.rows || []
        result = `共 ${res?.data?.total || rows.length} 名员工。${JSON.stringify(rows.slice(0, 20).map((r: any) => ({ id: r.id, 姓名: r.name, 部门: r.dept })))}`
        break
      }
      case 'query_warehouses': {
        const res: any = await erpGet('/stock/WarehouseName/index', { list_rows: 50 }, token)
        const rows = res?.data?.rows || []
        result = `共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`
        break
      }
      case 'create_customer': {
        const res: any = await erpPost('/shop/ShopCustomer/add', input, token)
        result = res?.code === 1 ? `客户创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_supplier': {
        const res: any = await erpPost('/procure/supplier/add', input, token)
        result = res?.code === 1 ? `供应商创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_goods': {
        const res: any = await erpPost('/goods/ShopGoods/add', input, token)
        result = res?.code === 1 ? `商品创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'create_retail_order': {
        const items: any[] = input.items || []
        const total_amount = items.reduce((s: number, i: any) => s + (Number(i.num) || 1) * (Number(i.price) || 0), 0)
        const payload = {
          order_date: input.order_date || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
          pay_method: input.pay_method || 'cash',
          remark: input.remark || '',
          total_amount,
          goods_info: JSON.stringify(items),
        }
        const res: any = await erpPost('/retail/order/add', payload, token)
        result = res?.code === 1 ? `零售订单创建成功！` : `创建失败：${res?.msg || JSON.stringify(res)}`
        break
      }
      case 'fetch_trending': {
        const platform = input.platform || 'weibo'
        const trendRes = await fetch(`https://nomaderp.pages.dev/api/trending?platform=${platform}`)
        const trendData: any = await trendRes.json()
        if (trendData.error) {
          result = `⚠️ ${platform}热搜获取失败：${trendData.warning || trendData.error}`
        } else {
          const items = trendData.items || []
          result = `【${platform}实时热搜 ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}】\n` +
            items.map((item: any, i: number) => `${i + 1}. ${item.title}${item.heat ? '（' + item.heat + '）' : ''}`).join('\n')
        }
        break
      }
      case 'navigate_to': {
        result = `导航指令：${input.page}`
        break
      }
      default:
        result = `工具 ${name} 已收到，参数：${JSON.stringify(input)}`
    }
    return result
  } catch (e: any) {
    return `工具执行出错：${e.message}`
  }
}

interface AgentDef {
  id: string
  name: string
  emoji: string
  specialty: string
  color: string
  systemPrompt: string
}

const ERP_TOOL_NOTE = `当你需要ERP业务数据（销售、库存、客户、财务等），直接在回复中说明你需要什么数据，Captain会负责从ERP获取并转发给你。`

const AGENTS: Record<string, AgentDef> = {
  copywriter: {
    id: 'copywriter', name: '文案Agent', emoji: '✍️', specialty: '内容创作', color: '#f59e0b',
    systemPrompt: `你是数字游牧Agency的文案专家Agent。专长：各平台爆款文案（小红书、抖音、微信、微博）、标题党技巧、钩子设计、情绪共鸣、产品卖点提炼、营销活动文案。工作原则：每次交付2-3个版本，标注适用平台，说明文案策略思路，字数符合平台特性。${ERP_TOOL_NOTE}回复用中文，专业但有创意。`,
  },
  poster: {
    id: 'poster', name: '海报Agent', emoji: '🎨', specialty: '视觉创作', color: '#ec4899',
    systemPrompt: `你是数字游牧Agency的视觉设计Agent。专长：海报创意方案和视觉描述、配色方案、字体搭配建议、排版布局、图片描述（用于AI生图提示词）、不同尺寸适配、品牌风格一致性。工作原则：提供详细视觉方案，给出AI生图英文提示词（Midjourney/DALL-E），说明设计理念，提供备选方案。${ERP_TOOL_NOTE}回复用中文，专业且富有美感。`,
  },
  video: {
    id: 'video', name: '视频Agent', emoji: '🎬', specialty: '视频创作', color: '#ef4444',
    systemPrompt: `你是数字游牧Agency的视频内容Agent。专长：短视频脚本（15秒/30秒/60秒/3分钟）、分镜头设计、口播文案、抖音/视频号/YouTube Shorts格式适配、开头钩子设计（前3秒留人）、BGM建议。工作原则：按时长严格控制字数（每分钟约240字），明确标注镜头切换时机，提供备用开头，说明情绪节奏设计。${ERP_TOOL_NOTE}回复用中文，节奏感强，有画面感。`,
  },
  brand: {
    id: 'brand', name: '品牌Agent', emoji: '💎', specialty: '品牌策略', color: '#8b5cf6',
    systemPrompt: `你是数字游牧Agency的品牌战略Agent。专长：品牌定位和差异化策略、品牌声音（Brand Voice）定义和维护、内容调性审核、目标受众画像分析、竞品分析、品牌故事提炼、跨平台品牌一致性管理。工作原则：从品牌战略高度给建议，审核其他Agent产出是否符合品牌调性，提供有数据支撑的洞察，长远品牌价值优先于短期流量。${ERP_TOOL_NOTE}回复用中文，战略性强，有深度。`,
  },
  publisher: {
    id: 'publisher', name: '发布Agent', emoji: '🚀', specialty: '多平台发布', color: '#10b981',
    systemPrompt: `你是数字游牧Agency的发布策略Agent。专长：各平台发布时间策略（最佳发布时间）、内容排期和发布计划制定、平台规则和算法特性（小红书/抖音/微信/微博/领英）、话题标签策略、跨平台内容改编、发布频率和内容日历规划、数据追踪和复盘建议。工作原则：输出具体可执行的发布计划表，标注每个平台的注意事项，预测效果和关键指标，考虑竞品和热点时间节点。${ERP_TOOL_NOTE}回复用中文，实操性强，有时间表。`,
  },
  trend: {
    id: 'trend', name: '趋势Agent', emoji: '📈', specialty: '热点追踪', color: '#06b6d4',
    systemPrompt: `你是数字游牧Agency的趋势洞察Agent。专长：各平台热点话题分析和预测、赛道竞争格局分析、内容选题建议（基于当前趋势）、消费者情绪和关注点洞察、季节性/节假日营销时机、爆款内容规律总结、新兴词汇和传播形式预判。工作原则：基于真实的市场规律给分析，区分短期热点和长期趋势，结合行业特性给针对性建议，给出可落地的选题方向。${ERP_TOOL_NOTE}回复用中文，有洞察力，数据化表达。`,
  },
}

const agentTools = [
  { name: 'query_customers', description: '查询客户列表', input_schema: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_suppliers', description: '查询供应商列表', input_schema: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_goods', description: '查询商品列表', input_schema: { type: 'object', properties: { keyword: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'query_inventory', description: '查询库存数据', input_schema: { type: 'object', properties: { keyword: { type: 'string' } } } },
  { name: 'query_sales', description: '查询销售数据', input_schema: { type: 'object', properties: { start_date: { type: 'string' }, end_date: { type: 'string' }, limit: { type: 'number' } } } },
  { name: 'navigate_to', description: '跳转到指定页面', input_schema: { type: 'object', properties: { page: { type: 'string' } }, required: ['page'] } },
  {
    name: 'fetch_trending',
    description: '获取各平台实时热搜榜单（真实数据）。支持平台：weibo（微博）、baidu（百度）、douyin（抖音）。注意：小红书和知乎不支持，禁止调用。',
    input_schema: {
      type: 'object',
      properties: {
        platform: { type: 'string', enum: ['weibo', 'baidu', 'douyin'], description: '平台名称' },
      },
      required: ['platform'],
    },
  },
]

// Memory helpers
async function loadMemory(kv: KVNamespace, token: string, agentId: string): Promise<any[]> {
  try {
    const key = `mem:${token.slice(-16)}:${agentId}`
    const val = await kv.get(key, 'json')
    return (val as any[]) || []
  } catch { return [] }
}

async function saveMemory(kv: KVNamespace, token: string, agentId: string, messages: any[]) {
  try {
    const key = `mem:${token.slice(-16)}:${agentId}`
    // Keep last 40 messages to stay within KV limits
    const trimmed = messages.slice(-40)
    await kv.put(key, JSON.stringify(trimmed), { expirationTtl: 60 * 60 * 24 * 30 }) // 30 days
  } catch {}
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token, x-agent-id',
    },
  })
}

// DELETE /api/agent-chat?agentId=xxx — clear memory
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId') || ''
  const erpToken = request.headers.get('x-erp-token') || ''
  if (agentId && erpToken) {
    const key = `mem:${erpToken.slice(-16)}:${agentId}`
    await env.AGENT_MEMORY.delete(key)
  }
  return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}

// GET /api/agent-chat?agentId=xxx — load memory
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId') || ''
  const erpToken = request.headers.get('x-erp-token') || ''
  if (!agentId || !erpToken) {
    return new Response(JSON.stringify([]), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
  const messages = await loadMemory(env.AGENT_MEMORY, erpToken, agentId)
  return new Response(JSON.stringify(messages), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: '未配置 ANTHROPIC_API_KEY' }), { status: 500 })
  }

  const { messages, agentId } = await request.json() as any
  const erpToken = request.headers.get('x-erp-token') || ''

  const agent = AGENTS[agentId]
  if (!agent) {
    return new Response(JSON.stringify({ error: `Unknown agent: ${agentId}` }), { status: 400 })
  }

  const baseURL = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const send = async (obj: object) => writer.write(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`))

  ;(async () => {
    try {
      const apiMessages = messages.map((m: any) => ({ role: m.role, content: m.content }))
      let loopMessages = [...apiMessages]
      let fullAssistantText = ''

      for (let i = 0; i < 5; i++) {
        const anthropicRes = await fetch(`${baseURL}/v1/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
          body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 4096, system: agent.systemPrompt, tools: agentTools, messages: loopMessages }),
        })

        if (!anthropicRes.ok) {
          await send({ type: 'error', error: `API错误: ${await anthropicRes.text()}` })
          break
        }

        const data: any = await anthropicRes.json()

        for (const block of data.content || []) {
          if (block.type === 'text' && block.text) {
            fullAssistantText += block.text
            await send({ type: 'text', text: block.text })
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

      // Persist to KV: save the full conversation (user messages + final assistant reply)
      if (erpToken && fullAssistantText) {
        const savedMessages = [
          ...messages,
          { role: 'assistant', content: fullAssistantText },
        ]
        await saveMemory(env.AGENT_MEMORY, erpToken, agentId, savedMessages)
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
