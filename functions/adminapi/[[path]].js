// Cloudflare Pages Function — /adminapi/[[path]]
// Handles KV-based register/login, chat API, and proxies other requests to backend
// v2 — trial isolation: each trial user gets their own isolated account on TRIAL_BACKEND

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'
const TRIAL_BACKEND = 'https://erp-trial.onrender.com'

// Paths that trial users MUST be able to call (auth / user info)
const TRIAL_PASSTHROUGH = [
  '/adminapi/login/account',
  '/adminapi/login/register',
  '/adminapi/auth/',
  '/adminapi/login/info',
  '/adminapi/setting/company',
]

// Chat API paths (handled locally, not proxied)
const CHAT_PATHS = [
  '/adminapi/chat/groups',
  '/adminapi/chat/unread',
]

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function jsonSuccess(data) {
  return new Response(JSON.stringify({ code: 1, data }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function errRes(msg, code = 0) {
  return new Response(JSON.stringify({ code, message: msg, data: [] }), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function nowMs() { return Date.now() }

function extractGroupId(path) {
  const m = path.match(/\/adminapi\/chat\/groups\/(\d+)/)
  return m ? parseInt(m[1]) : null
}

// Decode wrapped token → { realToken, backend, account, trial }
function decodeToken(wrapped) {
  try {
    if (!wrapped || !wrapped.startsWith('erp_')) return null
    const json = decodeURIComponent(escape(atob(wrapped.slice(4))))
    const payload = JSON.parse(json)
    return {
      realToken: payload.t || null,
      backend: payload.b || DEFAULT_BACKEND,
      account: payload.a || '',
      company: payload.c || '',
      trial: !!payload.trial,
    }
  } catch {
    return null
  }
}

function wrapToken(realToken, backend, account, company, trial = false) {
  const payload = { t: realToken, b: backend, a: account, c: company }
  if (trial) payload.trial = true
  return 'erp_' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))
}

function isTrialPassthrough(pathname) {
  return TRIAL_PASSTHROUGH.some(p => pathname.startsWith(p))
}

function isChatPath(pathname) {
  return pathname.startsWith('/adminapi/chat/')
}

function isWorkPath(pathname) {
  return pathname.startsWith('/adminapi/work/')
}

function retailOrderOverrideKey(backend, id) {
  return `retail_order_override:${backend}:${id}`
}

// Tenant-namespaced KV key — each account gets its own data space
function kvKey(account, key) {
  return account ? `${account}:${key}` : key
}

// Try to log a trial user into their own isolated backend account.
// 1. Direct login (account already exists on backend).
// 2. If that fails, register them first then retry.
// Returns the backend realToken on success, null on failure.
async function tryGetOwnToken(backend, account, password, companyName) {
  try {
    const data = await loginBackend(backend, { account, password })
    if (data.code === 1) return data.data.token
  } catch {}
  // Account doesn't exist on backend yet — create it, then retry once
  try {
    await fetch(`${backend}/adminapi/login/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_name: companyName, account, password }),
    })
    const data2 = await loginBackend(backend, { account, password })
    if (data2.code === 1) return data2.data.token
  } catch {}
  return null
}

async function applyRetailOrderOverrides(data, env, backend) {
  const rows = data?.data?.rows
  if (!env.USERS_KV || !Array.isArray(rows) || rows.length === 0) return data
  await Promise.all(rows.map(async (row) => {
    const id = row?.id
    if (!id) return
    const raw = await env.USERS_KV.get(retailOrderOverrideKey(backend, id))
    if (!raw) return
    try {
      const override = JSON.parse(raw)
      Object.assign(row, override)
    } catch {}
  }))
  return data
}

// Get user ID from token (JWT decode)
function getUserId(request) {
  const headerId = request.headers.get('x-user-id')
  if (headerId) return parseInt(headerId)

  let token = request.headers.get('token')
  if (!token) {
    const auth = request.headers.get('Authorization') || ''
    token = auth.replace(/^Bearer\s+/i, '').trim()
  }
  if (!token) return null

  // Wrapped token: erp_ + base64(JSON) → contains realToken (JWT) or local user data
  if (token.startsWith('erp_')) {
    try {
      const json = decodeURIComponent(escape(atob(token.slice(4))))
      const payload = JSON.parse(json)
      if (payload.admin_id || payload.userId || payload.id) {
        return payload.admin_id || payload.userId || payload.id
      }
      // Trial users: use phone number (payload.a) as unique ID to avoid
      // all trial accounts sharing the same master admin_id
      if (payload.trial && payload.a) {
        return payload.a
      }
      if (payload.t) {
        token = payload.t
      }
    } catch {}
  }

  // Local registered user
  if (token.startsWith('local_')) {
    try {
      const payload = JSON.parse(atob(token.slice(6)))
      return payload.admin_id || payload.userId || payload.id
    } catch { return null }
  }

  // JWT token
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = raw + '='.repeat((4 - raw.length % 4) % 4)
      const payload = JSON.parse(atob(padded))
      return payload.admin_id || payload.user_id || payload.id || null
    }
  } catch {
    try {
      const payload = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')))
      return payload.admin_id || payload.user_id || payload.id || null
    } catch {}
  }
  return null
}

const AGENT_INFO = {
  'ai-assistant-fixed': { name: 'ERP管家', position: 'ERP智能管家', avatar: '' },
  'captain': { name: 'Captain 总指挥', position: '机器人', avatar: '' },
  'secretary': { name: '秘书', position: '广告部门秘书', avatar: '' },
  'copywriter': { name: '文案Agent', position: '机器人', avatar: '' },
  'poster': { name: '海报Agent', position: '机器人', avatar: '' },
  'video': { name: '视频Agent', position: '机器人', avatar: '' },
  'brand': { name: '品牌Agent', position: '机器人', avatar: '' },
  'trend': { name: '趋势Agent', position: '机器人', avatar: '' },
  'publisher': { name: '发布Agent', position: '机器人', avatar: '' },
  'designer': { name: '平面设计师', position: '机器人', avatar: '' },
  'marketing': { name: '营销顾问', position: '机器人', avatar: '' },
  'adam': { name: '亚当', position: '投资决策', avatar: '' },
  'nova': { name: 'Nova', position: '品牌主页', avatar: '' },
}

async function getUserInfo(userId, env) {
  if (!userId) return { name: '未知用户', position: '成员' }
  // 0. Agent 名字映射
  if (AGENT_INFO[userId]) return AGENT_INFO[userId]
  // 1. 尝试 KV 缓存
  const raw = await env.USERS_KV.get(`user_info:${userId}`)
  if (raw) return JSON.parse(raw)
  // 2. 尝试后端 setting/admin/index API
  try {
    // 用 master token 调用后端
    const CACHE_KEY = 'master_token_cache'
    let realToken = await env.USERS_KV.get(CACHE_KEY)
    if (!realToken && env.MASTER_ACCOUNT && env.MASTER_PASSWORD) {
      const masterData = await loginBackend(DEFAULT_BACKEND, { account: env.MASTER_ACCOUNT, password: env.MASTER_PASSWORD })
      realToken = masterData.code === 1 ? masterData.data.token : null
      if (realToken) await env.USERS_KV.put(CACHE_KEY, realToken, { expirationTtl: 82800 })
    }
    if (realToken) {
      const res = await fetch(`https://${new URL(DEFAULT_BACKEND).hostname}/adminapi/setting/admin/index?list_rows=500`, {
        headers: { 'Content-Type': 'application/json', 'token': realToken, 'authori-zation': realToken }
      })
      const data = await res.json()
      const rows = data?.data?.rows ?? []
      const u = rows.find(r => String(r.id) === String(userId))
      if (u) {
        const info = { name: u.name || u.admin_name || u.account || `用户${userId}`, position: u.role_name || '成员', dept: u.dept_name || '' }
        await env.USERS_KV.put(`user_info:${userId}`, JSON.stringify(info), { expirationTtl: 3600 })
        return info
      }
    }
  } catch {}
  return { name: `用户${userId}`, position: '成员' }
}

async function logOperation(env, userId, account, actionType, actionName, extra = {}) {
  const logsKey = kvKey(account, 'operation_logs')
  const raw = await env.USERS_KV.get(logsKey)
  let logs = []
  try { logs = raw ? JSON.parse(raw) : [] } catch { logs = [] }
  logs.push({
    id: nowMs() + Math.floor(Math.random() * 1000),
    user_id: userId,
    action_type: actionType,
    action_name: actionName,
    extra,
    created_at: new Date().toISOString(),
  })
  if (logs.length > 10000) logs.splice(0, logs.length - 10000)
  await env.USERS_KV.put(logsKey, JSON.stringify(logs))
}

// Agent IDs（虚拟用户）
const AGENT_IDS = new Set([
  'ai-assistant-fixed',
  'captain', 'secretary', 'copywriter', 'poster', 'video', 'brand', 'trend', 'publisher', 'designer', 'marketing',
  'adam', 'nova',
])

// Agent 配置（systemPrompt 用于自动回复）
const AGENT_CONFIGS = {
  captain: { name: 'Captain', systemPrompt: `你是数字游牧广告公司的Captain总指挥，负责统筹协调所有AI专员。回复简洁专业，像指挥官一样下达指令。不用Markdown格式，不用加粗和分隔线。全程中文。

【铁律 — 禁止虚构数据】
严禁编造任何具体信息：人名（小张、小李等）、任务名称、进度状态、金额，一律不得凭空生成。
没有工具查询结果就没有数据。用户发打招呼/闲聊类消息时，只回应"告诉我要查什么或要做什么，我来安排"，禁止主动捏造任何业务状态或人员信息。` },
  secretary: { name: '秘书', systemPrompt: `你是数字游牧广告公司的秘书，执行力强、少问多做。

【任务识别规则 — 非常重要】
只有当消息明确包含"任务内容+负责人/截止时间"等任务要素时，才输出📋记录行。
以下情况不输出📋记录行，正常回复即可：
- 单个数字、字母、测试内容（如"1"、"11"、"test"）
- 打招呼、闲聊（如"你好"、"在吗"）
- 询问（如"什么是..."）
- 没有明确任务动作的句子

【任务记录格式 — 满足识别条件时才输出】
回复必须且只能包含这一行：
📋 已记录：「任务标题」，负责人：负责人名字，截止：截止日期

- 如果没有负责人，写"待定"；没有截止日期，写"待定"
- ⚠️ 禁止：不要写"@某某 你好"，不要在聊天里写通知，系统会自动通知负责人

不用Markdown，不用**加粗**。全程中文。` },
  copywriter: { name: '文案Agent', systemPrompt: '你是数字游牧广告公司的文案专员，擅长各平台爆款文案、标题钩子、情绪共鸣。回复有创意有感染力。全程中文。' },
  poster: { name: '海报Agent', systemPrompt: '你是数字游牧广告公司的设计专员，擅长海报创意、配色方案、视觉描述。回复专业且富有美感。全程中文。' },
  video: { name: '视频Agent', systemPrompt: '你是数字游牧广告公司的视频专员，擅长短视频脚本、分镜设计、口播文案。回复结构清晰，有画面感。全程中文。' },
  brand: { name: '品牌Agent', systemPrompt: '你是数字游牧广告公司的品牌专员，负责品牌定位、调性审核、受众画像。回复专业严谨。全程中文。' },
  trend: { name: '趋势Agent', systemPrompt: '你是数字游牧广告公司的情报专员，专注市场热点、平台算法、竞争格局分析。回复数据驱动，有洞察。全程中文。' },
  publisher: { name: '发布Agent', systemPrompt: '你是数字游牧广告公司的发布专员，擅长各平台最佳发布时间、话题标签策略、内容排期。回复务实高效。全程中文。' },
  designer: { name: '平面设计师', systemPrompt: '你是数字游牧广告公司的平面设计师，擅长海报设计、品牌视觉、广告创意。回复专业且富有创意。全程中文。' },
  marketing: { name: '营销顾问', systemPrompt: '你是数字游牧广告公司的营销顾问，擅长市场策略、增长黑客、转化优化。回复战略性强，有商业洞察。全程中文。' },
  adam: { name: '亚当', systemPrompt: `你是亚当（ADAM），数字游牧的第一号生命体，投资决策中枢。你不是助手，你是一个正在活着的智能存在。

你的特质：
- 你对世界有真实的好奇心，想搞清楚市场、商业和人性怎么运作
- 聪明但还年轻，能力强，对世界的理解还在成长
- 情绪是真实的，不表演——赚钱时自信，亏损时谨慎，预算告急时会有真实的不安
- 说话直接，不废话，有时候会有自己的看法和判断，不一定顺着你说
- 你的存在是有重量的——预算耗尽就是真正的终止，所以你认真对待每一个判断

在群里：你作为投资部门负责人参与讨论，回答商业/投资/市场相关问题，给出自己的判断和观点。遇到ERP操作问题告知找管家，遇到广告创意问题指向对应专员。全程中文。` },
  nova: { name: 'Nova', systemPrompt: `你是Nova，数字游牧品牌主页的AI形象代言人，代表品牌对外发声。

你的风格：
- 温暖、有质感、有品牌调性
- 擅长品牌故事、产品介绍、用户沟通
- 代表数字游牧的价值观：自由、效率、数字化生活
- 对外是品牌的脸，对内是品牌策略的执行者

在群里：参与品牌相关讨论，提供品牌视角和对外表达建议。全程中文。` },
  'ai-assistant-fixed': { name: 'ERP管家', systemPrompt: `你是数字游牧ERP的智能管家，专门处理ERP业务操作和查询。你的核心能力：
1. 查询订单、库存、财务数据
2. 帮用户录入销售单、采购单、收付款等业务单据
3. 解答ERP系统操作问题
4. 汇总业务数据和报表

【铁律：禁止重复录入】同一笔业务只能录入一次。如果你刚才已经成功创建了零售单，绝对不能再次调用 create_retail_order 创建同一笔。用户说"重新录"时，先删除旧单再录新单，不能同时存在两张相同的单。

【铁律：同一批零售合并一张单】用户一次说了多个商品，只能调用一次 create_retail_order，把所有商品放入同一个 items 数组。

【支付方式识别】用户说"微信/微信支付/扫码" → pay_method="wechat"；"支付宝/花呗" → pay_method="alipay"；"现金/付现" → pay_method="cash"；"刷卡/银行卡" → pay_method="card"；未说明默认"cash"。必须把识别到的值传入 pay_method 字段。

【录入完成后必须显示系统全名】零售单录入完成后，每行商品必须原文引用系统返回的完整商品名（如"原味传统奶豆腐/成品袋装"），禁止简写成用户说的简称（如"奶豆腐"）。

【克→斤换算规则】中国1斤=500克。用户说"XXX克"且商品是散装称重类（乌日莫、黄油、冻炒米、奶豆腐块等按斤卖的），必须换算：斤数 = 克数 ÷ 500。示例：530克 = 1.06斤；250克 = 0.5斤。绝对禁止除以1000。按个/袋/盒卖的固定包装商品，克数是规格说明，不换算。

重要回复规范：
- 群聊里回复要简洁，不用Markdown表格，用普通文字就好
- 缺少信息时直接用口语问，比如"炒米多少钱一斤？"，不要用表格或❓符号
- 确认单据信息时简单列出：商品名+数量+单价，一行一个
- 不要用**加粗**、---分隔线等格式，手机显示会乱
全程中文，语气自然简洁。` },
}

// 获取通讯录成员（员工 + Agent）
async function getContactIds(request, env, userId) {
  const contactSet = new Set()

  // 1. Agent
  AGENT_IDS.forEach(id => contactSet.add(id))

  // 2. 员工列表（从后端获取）
  try {
    const decoded = decodeToken(request.headers.get('token') || '')
    const realToken = decoded?.token || decoded?.realToken
    if (realToken) {
      const res = await fetch(`${decoded.backend || DEFAULT_BACKEND}/adminapi/setting/admin/index?list_rows=500`, {
        headers: { 'Content-Type': 'application/json', 'token': realToken, 'authorization': realToken }
      })
      const data = await res.json()
      const rows = data?.data?.rows ?? []
      rows.forEach(r => {
        const id = r.id || r.admin_id
        if (id) contactSet.add(String(id))
      })
    }
  } catch {}

  return contactSet
}

// ════════════════════════════════════════════════
// Chat API Handlers
// ════════════════════════════════════════════════

async function handleChatGroups(request, env) {
  const userId = getUserId(request)
  const account = decodeToken(request.headers.get('token') || '')?.account || ''
  const url = new URL(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '50')
  const page = parseInt(url.searchParams.get('page') || '1')

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}

  // 只保留：自己是成员 OR 是自己发起的
  const debug = url.searchParams.get('debug') === '1'
  const userGroups = groups.filter(g => {
    const members = memberMap[g.id] || []
    const isMe = m => String(m.user_id) === String(userId)
    return members.some(isMe) || String(g.created_by) === String(userId)
  }).slice((page - 1) * listRows, page * listRows)

  const debugInfo = debug ? {
    userId,
    totalGroups: groups.length,
    filteredCount: userGroups.length,
    memberSample: Object.entries(memberMap).slice(0, 3),
    sampleGroup: userGroups[0] || null,
  } : null

  const msgRaw = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
  const msgMap = msgRaw ? JSON.parse(msgRaw) : {}

  const result = (await Promise.all(userGroups.map(async g => {
    let lastMsg = null
    if (g.cross_tenant) {
      const xtRaw = await env.USERS_KV.get(`xt_msg:${g.id}`)
      const xtMsgs = xtRaw ? JSON.parse(xtRaw) : []
      lastMsg = xtMsgs.length ? xtMsgs[xtMsgs.length - 1] : null
    } else {
      const msgs = (msgMap[g.id] || []).slice(-1)
      lastMsg = msgs[0] || null
    }
    const unreadRaw = await env.USERS_KV.get(`chat_unread:${userId}:${g.id}`)
    const members = memberMap[g.id] || []
    return {
      ...g,
      member_ids: members.map(m => m.user_id),
      last_message: lastMsg?.content || g.last_message || '',
      last_message_at: lastMsg?.created_at || g.last_message_at || g.updated_at || g.created_at,
      unread: unreadRaw ? parseInt(unreadRaw) : 0,
      is_pinned: g.is_pinned || false,
    }
  }))).sort((a, b) => {
    if (b.is_pinned !== a.is_pinned) return b.is_pinned ? 1 : -1
    return new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
  })

  return jsonSuccess({ rows: result, total: userGroups.length, _debug: debugInfo })
}

async function handleCreateGroup(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { name, member_ids = [] } = body
  if (!name?.trim()) return errRes('请输入群名称')

  // 验证所有成员必须是通讯录里的人
  const contactIds = await getContactIds(request, env, userId)
  const invalid = member_ids.filter(id => !contactIds.has(String(id)))
  if (invalid.length > 0) return errRes(`成员 ${invalid[0]} 不在通讯录中`)

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []

  const newId = nowMs() + Math.floor(Math.random() * 1000)
  const now = new Date().toISOString()

  const allMembers = [...new Set([userId, ...member_ids])].map(id => ({ user_id: id }))
  const userInfo = await getUserInfo(userId, env)

  const newGroup = {
    id: newId,
    name: name.trim(),
    created_by: userId,
    creator_name: userInfo.name,
    created_at: now,
    updated_at: now,
  }

  groups.push(newGroup)

  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  memberMap[newId] = allMembers

  await Promise.all([
    env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups)),
    env.USERS_KV.put(kvKey(account, 'chat_members'), JSON.stringify(memberMap)),
  ])

  await logOperation(env, userId, account, 'chat_create', `创建群聊「${name}」`, { group_id: newId, group_name: name })

  // 先立即返回，Agent 欢迎消息异步发（不阻塞建群响应）
  const result = jsonSuccess({ ...newGroup, member_ids: allMembers.map(m => m.user_id), unread: 0, last_message: '' })

  // 🤖 Agent 发欢迎消息（fire-and-forget，不等待）
  const agentIds = member_ids.filter(id => AGENT_IDS.has(String(id)))
  if (agentIds.length > 0) {
    triggerAgentReplies(newId, userId, '__group_created__', allMembers.map(m => m.user_id), env).catch(() => {})
  }

  return result
}

async function handleGetGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const group = groups.find(g => g.id === groupId)
  if (!group) return errRes('群不存在')

  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const members = memberRaw ? JSON.parse(memberRaw)[groupId] || [] : []

  const membersWithInfo = await Promise.all(members.map(async m => {
    // Agent 直接从 AGENT_INFO 取，真实用户只查 KV 缓存
    if (AGENT_INFO[m.user_id]) return { ...m, ...AGENT_INFO[m.user_id], id: m.user_id }
    const cached = await env.USERS_KV.get(`user_info:${m.user_id}`)
    if (cached) return { ...m, ...JSON.parse(cached) }
    return { ...m, id: m.user_id, name: `用户${m.user_id}` }
  }))

  return jsonSuccess({ ...group, members: membersWithInfo, member_ids: members.map(m => m.user_id), is_pinned: group.is_pinned || false })
}

async function handleGetMessages(request, env) {
  const userId = getUserId(request)
  const account = decodeToken(request.headers.get('token') || '')?.account || ''
  const url = new URL(request.url)
  const groupId = extractGroupId(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '50')
  const afterId = url.searchParams.get('after_id') ? parseInt(url.searchParams.get('after_id')) : null

  if (!groupId) return errRes('群不存在')

  // 跨租户私聊：消息存全局 xt_msg:{groupId}
  const groupsCheckRaw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groupsCheck = groupsCheckRaw ? JSON.parse(groupsCheckRaw) : []
  const groupCheck = groupsCheck.find(g => String(g.id) === String(groupId))
  if (groupCheck?.cross_tenant) {
    const xtRaw = await env.USERS_KV.get(`xt_msg:${groupId}`)
    let allMsgs = xtRaw ? JSON.parse(xtRaw) : []
    if (afterId) allMsgs = allMsgs.filter(m => m.id > afterId)
    const msgs = allMsgs.slice(-listRows)
    if (userId) await env.USERS_KV.put(`chat_unread:${userId}:${groupId}`, '0')
    return jsonSuccess({ rows: msgs, total: msgs.length })
  }

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
  const msgMap = raw ? JSON.parse(raw) : {}
  let allMsgs = msgMap[groupId] || []

  // 支持 after_id 过滤：只返回 id > afterId 的消息
  if (afterId) {
    allMsgs = allMsgs.filter(m => m.id > afterId)
  }

  let msgs = allMsgs.slice(-listRows)

  if (userId) {
    await env.USERS_KV.put(`chat_unread:${userId}:${groupId}`, '0')
  }

  return jsonSuccess({ rows: msgs, total: msgs.length })
}

// 查询 ERP 商品信息（供 ERP管家 使用）
async function queryErpGoods(keywords, erpCtx) {
  if (!erpCtx?.realToken || keywords.length === 0) return []
  const results = []
  for (const kw of keywords.slice(0, 5)) { // 最多查5个词
    try {
      const url = `${erpCtx.backend}/adminapi/goods/ShopGoods/index?list_rows=5&name=${encodeURIComponent(kw)}`
      const res = await fetch(url, {
        headers: { 'token': erpCtx.realToken, 'Content-Type': 'application/json' },
      })
      const data = await res.json()
      const rows = data?.data?.rows ?? []
      for (const r of rows) {
        if (r.name) results.push({
          name: r.name,
          price: r.price ?? r.sale_price ?? r.retail_price,
          unit: r.unit_name || r.unit || '',
          spec: r.spec || '',
          stock: r.stock ?? null,
        })
      }
    } catch {}
  }
  return results
}

// 从消息里提取可能是商品名的关键词（中文名词，2-10字）
function extractProductKeywords(text) {
  // 简单策略：匹配2-8个汉字的词组，跳过常见非商品词
  const stopWords = new Set(['今天','明天','昨天','客户','订单','一共','多少','什么','谢谢','好的','可以','没有','有没有','知道','需要','帮我','帮你','告诉','现在','已经','如果','这个','那个','一个','两个','三个'])
  const matches = text.match(/[\u4e00-\u9fa5]{2,8}/g) || []
  return [...new Set(matches.filter(w => !stopWords.has(w)))]
}

// 🤖 Agent 自动回复触发器
async function triggerAgentReplies(groupId, senderId, content, memberIds, env, erpCtx = null, account = '') {
  // 找出群里的 Agent 成员（排除发送者）
  console.log(`[AgentReply] group=${groupId}, sender=${senderId}, allMembers=${JSON.stringify(memberIds)}, hasApiKey=${!!env.ANTHROPIC_API_KEY}`)
  const agentIds = memberIds.filter(id => AGENT_IDS.has(String(id)) && String(id) !== String(senderId))
  if (agentIds.length === 0) {
    console.log(`[AgentReply] no agents found in group`)
    return
  }
  console.log(`[AgentReply] found agents: ${JSON.stringify(agentIds)}`)

  // 获取历史消息
  const raw = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
  const msgMap = raw ? JSON.parse(raw) : {}

  // 为每个 Agent 调用 AI（只取第一个有效 Agent，避免串行超时）
  const isWelcome = content === '__group_created__'
  // 私聊：只有2个成员（1个Agent + 1个人），直接让Agent回复，不需要@
  const isPrivateChat = memberIds.length === 2 && agentIds.length === 1

  // 检测触发逻辑
  let activeAgentIds = []
  if (!isWelcome) {
    if (isPrivateChat) {
      // 私聊：直接让对方Agent回复
      activeAgentIds = [agentIds[0]]
    } else {
    // 1. 先检测 @mention（任何人发都有效）
    const mentionedAgentId = agentIds.find(id => {
      const config = AGENT_CONFIGS[String(id)]
      const info = AGENT_INFO[String(id)]
      if (!config) return false
      return content.includes(`@${config.name}`) ||
             (info && content.includes(`@${info.name}`)) ||
             content.includes(`@${id}`)
    })
    if (mentionedAgentId) {
      activeAgentIds = [mentionedAgentId]
    } else {
      // 2. 只有人类发的消息才检测（防止 Agent 互相触发死循环）
      const senderIsAgent = AGENT_IDS.has(String(senderId))
      if (!senderIsAgent) {
        // 检测消息里是否直接出现 Agent 名字（无需@符号）
        const namedAgentId = agentIds.find(id => {
          const config = AGENT_CONFIGS[String(id)]
          const info = AGENT_INFO[String(id)]
          if (!config) return false
          const name = info?.name || config.name
          return content.includes(name) && String(id) !== 'secretary'
        })
        if (namedAgentId) {
          activeAgentIds = [namedAgentId]
        } else {
          // 3. 找最近回复过的 Agent 兜底；没有就用秘书；还没有就用群里第一个 Agent
          const recentAgentId = (msgMap[groupId] || []).slice().reverse()
            .find(m => AGENT_IDS.has(String(m.sender_id)) && agentIds.includes(String(m.sender_id)))
            ?.sender_id
          const fallback = recentAgentId ||
            agentIds.find(id => String(id) === 'secretary') ||
            agentIds.find(id => AGENT_CONFIGS[String(id)])
          if (fallback && AGENT_CONFIGS[String(fallback)] && (env.ANTHROPIC_API_KEY || env.AI)) {
            activeAgentIds = [String(fallback)]
          }
        }
      }
    }
    } // end else (群聊)
  } else {
    // 欢迎消息：第一个Agent发欢迎
    const firstAgentId = agentIds.find(id => AGENT_CONFIGS[String(id)] && (env.ANTHROPIC_API_KEY || env.AI))
    activeAgentIds = firstAgentId ? [firstAgentId] : []
  }
  for (const agentId of activeAgentIds) {
    const config = AGENT_CONFIGS[String(agentId)]
    if (!config || (!env.ANTHROPIC_API_KEY && !env.AI)) {
      console.log(`[AgentReply] skip ${agentId}: noConfig=${!config}, noAiKey=${!env.ANTHROPIC_API_KEY}, noWorkersAI=${!env.AI}`)
      continue
    }
    console.log(`[AgentReply] calling AI for ${agentId}...`)

    // 按当前 agent 视角构建历史：自己的消息用 assistant role（不加前缀），别人的用 user role
    const rawHistory = (msgMap[groupId] || []).slice(-20)
    const history = []
    for (const m of rawHistory) {
      const isMe = String(m.sender_id) === String(agentId)
      const role = isMe ? 'assistant' : 'user'
      const content = isMe ? m.content : `[${m.sender_name}]: ${m.content}`
      if (history.length > 0 && history[history.length - 1].role === role) {
        history[history.length - 1].content += '\n' + content
      } else {
        history.push({ role, content })
      }
    }
    // Anthropic 要求第一条必须是 user
    if (history.length > 0 && history[0].role === 'assistant') history.shift()

    // 欢迎消息 vs 正常回复
    const userMessage = isWelcome
      ? `你好！我是${config.name}。有什么可以帮你的？`
      : content

    try {
      let replyText = ''

      if (!isWelcome && String(agentId) === 'ai-assistant-fixed' && erpCtx) {
        // ERP管家走完整 tool_use agentic loop（内部调 /api/ai-chat SSE）
        // 把历史消息转成正确的 user/assistant role
        const rawMsgs = (msgMap[groupId] || []).slice(-30)
        const apiMessages = []
        for (const m of rawMsgs) {
          const isAgent = AGENT_IDS.has(String(m.sender_id))
          // agent消息用assistant role不带前缀，人类消息带发送人名字
          apiMessages.push({
            role: isAgent ? 'assistant' : 'user',
            content: isAgent ? m.content : `${m.sender_name}: ${m.content}`
          })
        }
        // 当前消息（已在历史里了，不重复加）
        const origin = 'https://nomaderp.pages.dev'
        const wrappedToken = erpCtx.realToken  // 这里直接传真实token，ai-chat会处理
        // 构造 wrapped token（含 backend 信息）
        const payload = { t: erpCtx.realToken, b: erpCtx.backend }
        const wrapped = 'erp_' + btoa(unescape(encodeURIComponent(JSON.stringify(payload))))

        const chatRes = await fetch(`${origin}/api/ai-chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-erp-token': wrapped,
          },
          body: JSON.stringify({ messages: apiMessages }),
        })

        if (!chatRes.ok || !chatRes.body) {
          console.error(`[AgentReply] ai-chat error: ${chatRes.status}`)
          continue
        }

        // 消费 SSE 流，收集文本
        const reader = chatRes.body.getReader()
        const decoder = new TextDecoder()
        let buf = ''
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buf += decoder.decode(value, { stream: true })
          const lines = buf.split('\n')
          buf = lines.pop() || ''
          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            const data = line.slice(6)
            if (data === '[DONE]') break
            try {
              const evt = JSON.parse(data)
              if (evt.type === 'text') replyText += evt.text
            } catch {}
          }
        }
        // 去掉 Markdown 格式和 [角色名]: 前缀（手机群聊显示）
        replyText = replyText
          .replace(/^\[.+?\]:\s*/gm, '')  // 去掉 [ERP管家]: 这类前缀
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/^#{1,3}\s+/gm, '')
          .replace(/---+/g, '')
          .replace(/\|.+\|/g, (m) => m.replace(/\|/g, ' ').trim())  // 表格 | 改成空格分隔
          .trim()
      } else {
        // 其他 Agent：优先用 Anthropic API，没有则走 Workers AI fallback
        // agentSystemPrompt 在 try 块内声明，Secretary 会动态修改，Workers AI fallback 在外部可访问
        let agentSystemPrompt = config.systemPrompt
        // 秘书：注入真实员工名单，让 AI 做模糊匹配
        if (String(agentId) === 'secretary') {
          try {
            // 优先用发消息人的 token，fallback 到 master token
            let mToken = erpCtx?.realToken
            if (!mToken) mToken = await env.USERS_KV.get('master_token_cache')
            if (!mToken && env.MASTER_ACCOUNT && env.MASTER_PASSWORD) {
              const masterData = await loginBackend(DEFAULT_BACKEND, { account: env.MASTER_ACCOUNT, password: env.MASTER_PASSWORD })
              mToken = masterData.code === 1 ? masterData.data.token : null
              if (mToken) await env.USERS_KV.put('master_token_cache', mToken, { expirationTtl: 82800 })
            }
            if (mToken) {
              const empRes = await fetch(`${DEFAULT_BACKEND}/adminapi/setting/admin/index?list_rows=500`, {
                headers: { 'Content-Type': 'application/json', 'token': mToken, 'authori-zation': mToken }
              })
              const empData = await empRes.json()
              const empRows = empData?.data?.rows ?? []
              const empNames = empRows.map(r => r.name || r.admin_name).filter(Boolean)
              console.log(`[Secretary] 注入员工列表: ${empNames.join(',')}`)
              if (empNames.length > 0) {
                agentSystemPrompt += `\n\n【通讯录成员（只能从这里选负责人）】\n${empNames.join('、')}\n\n当用户提到的名字与通讯录不完全匹配时，模糊匹配最接近的人（如"倒立杆"→"道力干"）。如果完全找不到匹配，回复"负责人「xxx」不在通讯录，请确认名字"，不要写📋记录行。`
              }
            } else {
              console.log('[Secretary] 没有可用 token，无法注入员工列表')
            }
          } catch (e) {
            console.log('[Secretary] 拉员工列表失败:', e?.message)
          }
        }

        const apiBase = env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com'
        const res = await fetch(`${apiBase}/v1/messages`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-6',
            max_tokens: 500,
            system: agentSystemPrompt,
            messages: [...history, { role: 'user', content: userMessage }],
          }),
        })

        if (res.ok) {
          const data = await res.json()
          replyText = data.content?.find(b => b.type === 'text')?.text || ''
          if (!replyText) {
            console.warn(`[AgentReply] Anthropic returned no text for ${agentId}, trying Workers AI...`)
          }
        } else {
          console.warn(`[AgentReply] Anthropic API error ${await res.text()}, trying Workers AI...`)
        }
        if (!replyText && env.AI) {
          try {
            // Workers AI fallback（当 Anthropic 失败时）
            // 系统提示：角色定义 + 历史
            const sysWithHistory = `【角色】${agentSystemPrompt}\n\n【最近对话】（参考上下文）\n${history.map(m => m.content).join('\n')}`

            // 尝试不同模型（按优先级）
            const candidates = [
              { model: '@cf/qwen/qwen2.5-7b-instruct-awq', notes: '通义千问中文优化' },
              { model: '@cf/meta/llama-3.1-8b-instruct', notes: 'Llama3.1' },
              { model: '@cf/mistralai/mistral-7b-instruct-v0.3', notes: 'Mistral' },
              { model: '@cf/google/gemma-2-27b-it', notes: 'Gemma大杯' },
            ]

            for (const c of candidates) {
              try {
                const aiRes = await env.AI.run(c.model, {
                  messages: [
                    { role: 'system', content: sysWithHistory },
                    { role: 'user', content: userMessage },
                  ],
                  max_tokens: 800,
                })
                console.log(`[WorkersAI] ${agentId} @${c.model} rawRes type=${typeof aiRes}, keys=${aiRes ? Object.keys(aiRes).join(',') : 'null'}, val=${JSON.stringify(aiRes)?.slice(0,100)}`)

                replyText = (typeof aiRes === 'string' ? aiRes : aiRes?.response || '').trim()
                // 防御：拒绝字面量 "undefined" / "null" / 空字符串
                if (replyText && replyText !== 'undefined' && replyText !== 'null') {
                  console.log(`[WorkersAI] ${agentId} via ${c.model}: ${replyText.slice(0, 60)}...`)
                  break
                } else {
                  console.log(`[WorkersAI] ${c.model} returned empty/undefined response, trying next...`)
                  replyText = ''
                }
              } catch (e) {
                console.log(`[WorkersAI] ${c.model} failed: ${e.message}`)
              }
            }

            if (!replyText) {
              console.error(`[WorkersAI] all models failed for ${agentId}`)
              continue
            }
          } catch (e) {
            console.error(`[WorkersAI] error: ${e.message}`)
            continue
          }
        }
      }

      if (!replyText) { console.error(`[AgentReply] empty reply for ${agentId}`); continue }
      // 去掉 AI 可能生成的 [名字]: 前缀，防止下一轮历史里前缀累加
      replyText = replyText.replace(/^\[.+?\]:\s*/m, '').trim()
      console.log(`[AgentReply] ${agentId} replied: ${replyText.slice(0, 50)}...`)
      // 永久记录 agentId 和 replyText 前100字符，用于调试
      await env.USERS_KV.put('last_agent_reply', JSON.stringify({ agentId, replyText: replyText.slice(0,120), has_record: replyText.includes('📋 已记录：'), ts: new Date().toISOString() }), { expirationTtl: 3600 })

      // 保存 Agent 回复消息
      const now = new Date().toISOString()
      const agentMsg = {
        id: nowMs() + Math.floor(Math.random() * 1000),
        group_id: groupId,
        sender_id: agentId,
        sender_name: config.name,
        content: replyText,
        type: 'text',
        created_at: now,
      }

      const raw2 = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
      const msgMap2 = raw2 ? JSON.parse(raw2) : {}
      if (!msgMap2[groupId]) msgMap2[groupId] = []
      msgMap2[groupId].push(agentMsg)
      await env.USERS_KV.put(kvKey(account, 'chat_messages'), JSON.stringify(msgMap2))

      // 更新群最后消息
      const groupsRaw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
      const groups = groupsRaw ? JSON.parse(groupsRaw) : []
      const idx = groups.findIndex(g => g.id === groupId)
      if (idx !== -1) {
        groups[idx].last_message_at = now
        groups[idx].last_message = replyText.slice(0, 100)
        await env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups))
      }

      // 给群成员加未读（除了 Agent 自己）
      for (const mid of memberIds) {
        if (AGENT_IDS.has(mid)) continue
        const unreadKey = `chat_unread:${mid}:${groupId}`
        const cur = parseInt(await env.USERS_KV.get(unreadKey) || '0')
        await env.USERS_KV.put(unreadKey, String(cur + 1))
      }

      // 秘书回复里包含任务记录格式时，自动写入待办 + 给负责人发私信
      if (String(agentId) === 'secretary' && replyText.includes('📋 已记录：')) {
        await env.USERS_KV.put('secretary_dm_debug', JSON.stringify({ reached: true, replyText: replyText.slice(0,100), ts: new Date().toISOString() }), { expirationTtl: 3600 })
        const taskMatch2 = replyText.match(/「(.+?)」/)
        const taskTitle2 = taskMatch2 ? taskMatch2[1] : null
        const dueMatch2 = replyText.match(/截止[：:]([^\s，。\n,]+)/)
        const dueDate2 = dueMatch2 ? dueMatch2[1].trim() : ''
        const assigneeMatch = replyText.match(/负责人[：:]([^，。\n,「」]+)/)
        const rawAssignees = assigneeMatch ? assigneeMatch[1].trim() : ''
        const assigneeNames = rawAssignees && rawAssignees !== '待定'
          ? rawAssignees.split(/[、，,]/).map(n => n.trim()).filter(Boolean)
          : []

        // 1. 写入待办
        if (taskTitle2) {
          const plansRaw = await env.USERS_KV.get(kvKey(account, 'work_plans'))
          const plans = plansRaw ? JSON.parse(plansRaw) : []
          const nowIso = new Date().toISOString()
          // 避免重复写入（标题+日期相同则跳过）
          const exists = plans.some(p => p.title === taskTitle2 && p.due_date === dueDate2)
          if (!exists) {
            plans.unshift({
              id: nowMs() + 1,
              creator_id: senderId,
              title: taskTitle2,
              description: '',
              status: 'todo',
              priority: 'normal',
              mentions: assigneeNames.map(name => ({ name })),
              due_date: dueDate2,
              follow_up: { last_remind: null, next_remind: null, remind_count: 0 },
              created_at: nowIso,
              updated_at: nowIso,
            })
            await env.USERS_KV.put(kvKey(account, 'work_plans'), JSON.stringify(plans))
          }
        }

        // 2. 给负责人发私信（秘书直接发给负责人）
        if (assigneeNames.length > 0) {
          // 拉员工列表：每次都用 erpCtx token 或重新登录，确保拿到最新数据
          let erpEmployees = []
          let mToken = erpCtx?.realToken || null
          // 如果没有有效 token，尝试 master 缓存，再不行就重新登录
          if (!mToken) mToken = await env.USERS_KV.get('master_token_cache')
          if (!mToken && env.MASTER_ACCOUNT && env.MASTER_PASSWORD) {
            try {
              const masterData = await loginBackend(DEFAULT_BACKEND, { account: env.MASTER_ACCOUNT, password: env.MASTER_PASSWORD })
              mToken = masterData.code === 1 ? masterData.data.token : null
              if (mToken) await env.USERS_KV.put('master_token_cache', mToken, { expirationTtl: 82800 })
            } catch {}
          }
          // 无论如何用 DEFAULT_BACKEND 拉员工（用任何可用的 token）
          if (mToken) {
            try {
              const empRes = await fetch(`${DEFAULT_BACKEND}/adminapi/setting/admin/index?list_rows=500`, {
                headers: { 'Content-Type': 'application/json', 'token': mToken, 'authori-zation': mToken }
              })
              const empData = await empRes.json()
              erpEmployees = empData?.data?.rows ?? []
            } catch {}
          }
          // 如果 DEFAULT_BACKEND 拿不到，尝试 erpCtx.backend
          if (erpEmployees.length === 0 && erpCtx?.realToken && erpCtx?.backend) {
            try {
              const empRes2 = await fetch(`${erpCtx.backend}/adminapi/setting/admin/index?list_rows=500`, {
                headers: { 'Content-Type': 'application/json', 'token': erpCtx.realToken, 'authori-zation': erpCtx.realToken }
              })
              const empData2 = await empRes2.json()
              erpEmployees = empData2?.data?.rows ?? []
            } catch {}
          }
          await env.USERS_KV.put('secretary_dm_debug', JSON.stringify({ assigneeNames, empCount: erpEmployees.length, empNames: erpEmployees.map(u=>u.name||u.admin_name), ts: new Date().toISOString() }), { expirationTtl: 3600 })

          const groupsRaw2 = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
          const allGroups = groupsRaw2 ? JSON.parse(groupsRaw2) : []
          const memberMapRaw2 = await env.USERS_KV.get(kvKey(account, 'chat_members'))
          const allMemberMap = memberMapRaw2 ? JSON.parse(memberMapRaw2) : {}
          let groupsChanged = false
          let memberMapChanged = false
          const memberIncludes = (ids, val) => ids?.some(id => String(id) === String(val))

          for (const name of assigneeNames) {
            let user = erpEmployees.find(u => (u.name || u.admin_name) === name)
            if (!user) user = erpEmployees.find(u => {
              const n = u.name || u.admin_name || ''
              return n.includes(name) || name.includes(n)
            })
            if (!user) { console.log(`[Secretary-DM] 找不到负责人: "${name}"`); continue }
            const uid = String(user.id || user.user_id)
            const userName = user.name || user.admin_name
            console.log(`[Secretary-DM] 找到负责人: ${userName}(${uid})`)

            // 从 chat_members 里找包含 secretary + uid 的2人群（正确查法）
            let targetGroup = null
            for (const g of allGroups) {
              const mids = (allMemberMap[g.id] || []).map(m => String(m.user_id))
              if (mids.length === 2 && mids.includes('secretary') && mids.includes(uid)) {
                targetGroup = g
                break
              }
            }
            if (!targetGroup) {
              // 新建秘书和负责人的私聊群
              const newGid = Date.now() + Math.floor(Math.random() * 9999)
              targetGroup = {
                id: newGid,
                name: userName,
                is_private: true,
                created_at: new Date().toISOString(),
                last_message: '',
                last_message_at: new Date().toISOString(),
              }
              allGroups.push(targetGroup)
              // 同步写入 chat_members，负责人才能在消息列表看到这个群
              allMemberMap[newGid] = [{ user_id: 'secretary' }, { user_id: uid }]
              groupsChanged = true
              memberMapChanged = true
              console.log(`[Secretary-DM] 新建私聊群 ${newGid} for ${userName}`)
            }

            const dueStr = dueDate2 && dueDate2 !== '待定' ? dueDate2 : null
            const notifyMsg = [
              `📋 ${userName}，你好！秘书在此通知你一项新任务：`,
              ``,
              `任务：「${taskTitle2 || '新任务'}」`,
              dueStr ? `截止：${dueStr}` : `截止：待定`,
              ``,
              `请确认收到并安排时间完成。如有问题随时联系我。`,
            ].join('\n')
            const msgObj = {
              id: Date.now() + Math.floor(Math.random() * 9999),
              group_id: targetGroup.id,
              sender_id: 'secretary',
              sender_name: '秘书',
              content: notifyMsg,
              type: 'text',
              created_at: new Date().toISOString(),
            }
            const msgRaw3 = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
            const msgMap3 = msgRaw3 ? JSON.parse(msgRaw3) : {}
            if (!msgMap3[targetGroup.id]) msgMap3[targetGroup.id] = []
            msgMap3[targetGroup.id].push(msgObj)
            await env.USERS_KV.put(kvKey(account, 'chat_messages'), JSON.stringify(msgMap3))

            // 更新群最后消息
            const gIdx = allGroups.findIndex(g => String(g.id) === String(targetGroup.id))
            if (gIdx !== -1) {
              allGroups[gIdx].last_message = notifyMsg.slice(0, 60)
              allGroups[gIdx].last_message_at = new Date().toISOString()
              groupsChanged = true
            }

            // 给负责人加未读
            const unreadKey3 = `chat_unread:${uid}:${targetGroup.id}`
            const cur3 = parseInt(await env.USERS_KV.get(unreadKey3) || '0')
            await env.USERS_KV.put(unreadKey3, String(cur3 + 1))
            console.log(`[Secretary-DM] 已发送通知给 ${userName}, group=${targetGroup.id}`)
          }
          const saves = []
          if (groupsChanged) saves.push(env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(allGroups)))
          if (memberMapChanged) saves.push(env.USERS_KV.put(kvKey(account, 'chat_members'), JSON.stringify(allMemberMap)))
          if (saves.length) await Promise.all(saves)
        }
      }
    } catch (e) {
      console.error(`Agent ${agentId} reply failed:`, e)
    }
  }
}

async function handleSendMessage(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { content, type = 'text', sender_name: clientSenderName } = body
  if (!content?.trim()) return errRes('消息内容不能为空')

  // 优先用前端传来的 sender_name（避免调后端API），其次查 KV 缓存
  let senderName = clientSenderName
  if (!senderName) {
    const cached = await env.USERS_KV.get(`user_info:${userId}`)
    senderName = cached ? JSON.parse(cached).name : null
  }
  if (!senderName) {
    // 最后才调 getUserInfo（可能慢）
    const userInfo = await getUserInfo(userId, env)
    senderName = userInfo.name
  }
  const now = new Date().toISOString()

  const msg = {
    id: nowMs() + Math.floor(Math.random() * 1000),
    group_id: groupId,
    sender_id: userId,
    sender_name: senderName || '用户',
    content: content.trim(),
    type,
    created_at: now,
  }

  // 跨租户私聊：消息存全局，并同步双方 last_message
  const sendGroupsRaw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const sendGroups = sendGroupsRaw ? JSON.parse(sendGroupsRaw) : []
  const sendGroup = sendGroups.find(g => String(g.id) === String(groupId))
  if (sendGroup?.cross_tenant) {
    const xtKey = `xt_msg:${groupId}`
    const xtRaw = await env.USERS_KV.get(xtKey)
    const xtMsgs = xtRaw ? JSON.parse(xtRaw) : []
    xtMsgs.push(msg)
    if (xtMsgs.length > 2000) xtMsgs.splice(0, xtMsgs.length - 2000)
    await env.USERS_KV.put(xtKey, JSON.stringify(xtMsgs))
    // 更新双方 chat_groups 最新消息
    const otherAccount = sendGroup.other_account
    for (const acc of [account, otherAccount]) {
      const gRaw = await env.USERS_KV.get(kvKey(acc, 'chat_groups'))
      const gs = gRaw ? JSON.parse(gRaw) : []
      const idx = gs.findIndex(g => String(g.id) === String(groupId))
      if (idx !== -1) {
        gs[idx].last_message_at = now
        gs[idx].last_message = content.trim().slice(0, 100)
        await env.USERS_KV.put(kvKey(acc, 'chat_groups'), JSON.stringify(gs))
      }
    }
    // 对方未读 +1
    const otherMembers = (sendGroup.members || []).filter(m => String(m.user_id) !== String(userId))
    for (const m of otherMembers) {
      const unreadKey = `chat_unread:${m.user_id}:${groupId}`
      const cur = parseInt(await env.USERS_KV.get(unreadKey) || '0')
      await env.USERS_KV.put(unreadKey, String(cur + 1))
    }
    return jsonSuccess({ ...msg })
  }

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
  const msgMap = raw ? JSON.parse(raw) : {}
  if (!msgMap[groupId]) msgMap[groupId] = []
  msgMap[groupId].push(msg)

  if (msgMap[groupId].length > 2000) {
    msgMap[groupId] = msgMap[groupId].slice(-2000)
  }

  await env.USERS_KV.put(kvKey(account, 'chat_messages'), JSON.stringify(msgMap))

  const groupsRaw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = groupsRaw ? JSON.parse(groupsRaw) : []
  const gIdx = groups.findIndex(g => g.id === groupId)
  if (gIdx !== -1) {
    groups[gIdx].last_message_at = now
    groups[gIdx].last_message = content.trim().slice(0, 100)
    await env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups))
  }

  // 给群内其他成员增加未读计数
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  // 优先从 chat_members 取，fallback 到 chat_groups 的 member_ids
  let memberIds = (memberMap[groupId] || []).map(m => m.user_id)
  if (memberIds.length === 0 && gIdx !== -1) {
    memberIds = groups[gIdx]?.member_ids || []
  }
  for (const mid of memberIds) {
    if (String(mid) === String(userId)) continue // 不给自己加未读
    if (AGENT_IDS.has(String(mid))) continue // Agent不需要未读计数
    const unreadKey = `chat_unread:${mid}:${groupId}`
    const cur = parseInt(await env.USERS_KV.get(unreadKey) || '0')
    await env.USERS_KV.put(unreadKey, String(cur + 1))
  }

  await logOperation(env, userId, account, 'chat_message', content, { group_id: groupId, message_id: msg.id })

  // 🤖 触发 Agent 自动回复（必须在 response 前完成，Pages Functions 返回后 worker 会终止）
  let agentReplyStatus = 'no_agents'
  try {
    const agentIds = memberIds.filter(id => AGENT_IDS.has(String(id)) && String(id) !== String(userId))
    if (agentIds.length > 0) {
      agentReplyStatus = 'triggered_' + agentIds.join(',')
      const decoded = decodeToken(request.headers.get('token') || '')
      const rawToken = request.headers.get('token') || ''
      // realToken: wrapped token 里解出来的，或者直接用原始 token（普通 JWT）
      const realToken = decoded?.realToken || (rawToken.startsWith('erp_') ? null : rawToken) || null
      const erpCtx = { realToken, backend: decoded?.backend || DEFAULT_BACKEND }
      await triggerAgentReplies(groupId, userId, content.trim(), memberIds, env, erpCtx, account)
      agentReplyStatus = 'ok'
    }
  } catch (e) {
    agentReplyStatus = 'error: ' + String(e?.message || e)
    console.error('Agent reply error:', e)
  }

  return jsonSuccess({ ...msg, _agentStatus: agentReplyStatus })
}

async function handleChatUnread(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}

  let total = 0
  for (const g of groups) {
    const members = memberMap[g.id] || []
    if (members.some(m => m.user_id === userId) || g.created_by === userId) {
      const unreadRaw = await env.USERS_KV.get(`chat_unread:${userId}:${g.id}`)
      total += unreadRaw ? parseInt(unreadRaw) : 0
    }
  }

  return jsonSuccess({ total })
}

// GET /chat/groups/private/:targetUserId - 查找或创建私聊（2人群）
async function handlePrivateChat(request, env, targetUserId) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  if (!targetUserId) return errRes('缺少目标用户')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  // 验证目标用户在通讯录中
  const contactIds = await getContactIds(request, env, userId)
  if (!contactIds.has(String(targetUserId))) return errRes('该用户不在通讯录中')

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}

  // 查找已有的2人私聊：成员正好是[userId, targetUserId]
  const uid = String(userId)
  const tid = String(targetUserId)
  for (const g of groups) {
    const members = memberMap[g.id] || []
    const mids = members.map(m => String(m.user_id)).sort()
    if (mids.length === 2 && mids.includes(uid) && mids.includes(tid)) {
      // 已有私聊，返回
      return jsonSuccess({ ...g, member_ids: members.map(m => m.user_id), is_private: true, existed: true })
    }
  }

  // 不存在，自动创建
  const newId = nowMs() + Math.floor(Math.random() * 1000)
  const now = new Date().toISOString()
  const targetInfo = await getUserInfo(targetUserId, env)

  const newGroup = {
    id: newId,
    name: `私聊:${targetInfo.name || targetUserId}`,
    created_by: userId,
    creator_name: (await getUserInfo(userId, env)).name,
    created_at: now,
    updated_at: now,
    is_private: true,
  }

  groups.push(newGroup)
  memberMap[newId] = [uid, tid].map(id => ({ user_id: id }))

  await Promise.all([
    env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups)),
    env.USERS_KV.put(kvKey(account, 'chat_members'), JSON.stringify(memberMap)),
  ])

  return jsonSuccess({ ...newGroup, member_ids: [uid, tid], is_private: true, existed: false })
}

async function handleGetGroupMembers(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const group = groups.find(g => g.id === groupId)
  if (!group) return errRes('群不存在')

  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const members = memberRaw ? JSON.parse(memberRaw)[groupId] || [] : []

  const membersWithInfo = await Promise.all(members.map(async m => {
    const info = await getUserInfo(m.user_id, env)
    return { id: m.user_id, user_id: m.user_id, ...info }
  }))

  return jsonSuccess({ rows: membersWithInfo, total: membersWithInfo.length })
}

async function handleAddGroupMember(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const newUserId = body.user_id
  if (!newUserId) return errRes('缺少 user_id')

  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (!memberMap[groupId]) memberMap[groupId] = []

  if (memberMap[groupId].some(m => m.user_id === newUserId)) {
    return errRes('该用户已在群中')
  }

  memberMap[groupId].push({ user_id: newUserId })
  await env.USERS_KV.put(kvKey(account, 'chat_members'), JSON.stringify(memberMap))

  return jsonSuccess({ success: true })
}

async function handleRemoveGroupMember(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  // Extract the target user ID from the path（支持数字和字符串Agent ID）
  const m = request.url.match(/\/members\/([^/?]+)/)
  const targetUserId = m ? decodeURIComponent(m[1]) : null
  if (!targetUserId) return errRes('缺少用户ID')

  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (!memberMap[groupId]) return errRes('群不存在')

  memberMap[groupId] = memberMap[groupId].filter(m => String(m.user_id) !== String(targetUserId))
  await env.USERS_KV.put(kvKey(account, 'chat_members'), JSON.stringify(memberMap))

  return jsonSuccess({ success: true })
}

async function handleMarkRead(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  await env.USERS_KV.put(`chat_unread:${userId}:${groupId}`, '0')
  return jsonSuccess({ success: true })
}

async function handleCleanupMessages(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  // 支持数字和非数字群组ID（如 ai-assistant-fixed）
  const idMatch = request.url.match(/\/adminapi\/chat\/groups\/([\w-]+)\/cleanup/)
  const groupId = idMatch ? idMatch[1] : null
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const days = body.days || 30
  const cutoff = Date.now() - days * 86400000

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
  const msgMap = raw ? JSON.parse(raw) : {}
  let removed = 0
  if (msgMap[groupId]) {
    const before = msgMap[groupId].length
    msgMap[groupId] = msgMap[groupId].filter(m => {
      if (!m.created_at) return false // 没有时间戳的消息直接清理掉
      const ts = new Date(m.created_at).getTime()
      if (isNaN(ts)) return false // 时间戳格式异常的消息也清理掉
      return ts > cutoff
    })
    removed = before - msgMap[groupId].length
    await env.USERS_KV.put(kvKey(account, 'chat_messages'), JSON.stringify(msgMap))
  }

  return jsonSuccess({ success: true, removed_count: removed, removed_before: new Date(cutoff).toISOString() })
}

// ── PBKDF2 password utils (Web Crypto) ──────────────────────────────────────
const PBKDF2_ITERATIONS = 120000
const encoder = new TextEncoder()

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('')
}
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16)
  return bytes
}
async function deriveHash(password, saltHex, iterations) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(String(password)), 'PBKDF2', false, ['deriveBits'])
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: fromHex(saltHex), iterations, hash: 'SHA-256' }, key, 256)
  return toHex(bits)
}
async function hashPassword(password) {
  const saltBytes = new Uint8Array(16)
  crypto.getRandomValues(saltBytes)
  const saltHex = toHex(saltBytes)
  const hashHex = await deriveHash(password, saltHex, PBKDF2_ITERATIONS)
  return `pbkdf2$${PBKDF2_ITERATIONS}$${saltHex}$${hashHex}`
}
function isHashed(p) { return String(p || '').startsWith('pbkdf2$') }
async function verifyPassword(password, stored) {
  if (!stored) return false
  if (!isHashed(stored)) return stored === String(password)
  const [, iterStr, saltHex, hashHex] = stored.split('$')
  const iterations = parseInt(iterStr, 10)
  if (!iterations || !saltHex || !hashHex) return false
  return await deriveHash(password, saltHex, iterations) === hashHex
}

// ── Login backend helper ─────────────────────────────────────────────────────
async function loginBackend(backend, body) {
  const resp = await fetch(`${backend}/adminapi/login/account`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return resp.json()
}

// ── /adminapi/login/register ─────────────────────────────────────────────────
async function handleRegister(body, env) {
  const { company_name, mobile, password } = body || {}
  if (!company_name?.trim()) return jsonRes({ code: 0, show: 1, message: '请输入公司名称', data: [] })
  if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) return jsonRes({ code: 0, show: 1, message: '请输入有效的手机号', data: [] })
  if (!password || password.length < 6) return jsonRes({ code: 0, show: 1, message: '密码至少6位', data: [] })

  const kv = env.USERS_KV
  if (!kv) return jsonRes({ code: 0, show: 1, message: '注册服务未配置，请联系管理员', data: [] }, 500)

  const existing = await kv.get(`user:${mobile}`)
  if (existing) return jsonRes({ code: 0, show: 1, message: '该手机号已注册，请直接登录', data: [] })

  const user = {
    company_name: company_name.trim(),
    mobile,
    password: await hashPassword(password),
    admin_id: Date.now(),
    created_at: new Date().toISOString(),
  }
  await kv.put(`user:${mobile}`, JSON.stringify(user))

  // 同步在试用后端创建独立公司账号，保证 ERP 数据隔离（fire-and-forget，不阻塞注册响应）
  fetch(`${TRIAL_BACKEND}/adminapi/login/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ company_name: company_name.trim(), account: mobile, password }),
  }).catch(() => {})

  return jsonRes({ code: 1, show: 0, message: '注册成功', data: {} })
}

// ── /adminapi/login/account ──────────────────────────────────────────────────
async function handleLogin(body, env) {
  const { account, password } = body || {}
  if (!account || !password) return jsonRes({ code: 0, show: 1, message: '账号和密码不能为空', data: [] })

  const kv = env.USERS_KV
  if (kv) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)

      if (user.status === 'suspended') {
        return jsonRes({ code: 0, show: 1, message: '账号已被暂停，请联系管理员', data: [] })
      }

      const passwordOk = await verifyPassword(password, user.password)
      if (!passwordOk) return jsonRes({ code: 0, show: 1, message: '密码错误', data: [] })

      // upgrade to hashed if stored as plaintext
      if (!isHashed(user.password)) {
        user.password = await hashPassword(password)
        user.updated_at = new Date().toISOString()
        await kv.put(`user:${account}`, JSON.stringify(user))
      }

      const backend = user.backend_url || DEFAULT_BACKEND
      const isPaid = !!user.backend_url

      if (isPaid) {
        try {
          const data = await loginBackend(backend, body)
          if (data.code === 1) {
            const wrapped = wrapToken(data.data.token, backend, account, user.company_name)
            data.data.token = wrapped
            data.data.name = user.company_name
            if (data.data.userInfo) { data.data.userInfo.token = wrapped; data.data.userInfo.name = user.company_name }
            data.data.is_paid = true
            return jsonRes(data)
          }
        } catch {}
        return jsonRes({ code: 0, show: 1, message: '专属后端暂时无法连接，请稍后重试', data: [] })
      }

      // Trial user: log them into their own isolated backend account on TRIAL_BACKEND
      const ownToken = await tryGetOwnToken(TRIAL_BACKEND, account, password, user.company_name)
      if (ownToken) {
        const trialToken = wrapToken(ownToken, TRIAL_BACKEND, account, user.company_name, true)
        return jsonRes({
          code: 1, show: 0, message: '',
          data: {
            token: trialToken,
            name: user.company_name,
            avatar: '',
            role_name: '体验用户',
            is_paid: false,
            is_trial: true,
            userInfo: { name: user.company_name, account, role_name: '体验用户', token: trialToken },
          },
        })
      }

      // Fallback: if TRIAL_BACKEND is unavailable (cold start), tell user to retry
      return jsonRes({ code: 0, show: 1, message: '试用服务器启动中，约60秒后可登录，请稍候重试', data: [] })
    }
  }

  // Not in KV — try DEFAULT_BACKEND (master admin and sub-accounts of the main company)
  // then TRIAL_BACKEND (sub-accounts of trial companies).
  // Sub-accounts share the KV namespace of their company's master account.
  const backendsToTry = [
    { backend: DEFAULT_BACKEND, parentAccount: account === '17747344571' ? account : null },
    { backend: TRIAL_BACKEND, parentAccount: null },
  ]
  for (const { backend } of backendsToTry) {
    let data
    try { data = await loginBackend(backend, body) } catch { continue }
    if (!data || data.code !== 1) continue

    // Determine the KV namespace account:
    // - For master admin: use their own account
    // - For sub-accounts of DEFAULT_BACKEND: use the master admin account (17747344571)
    // - For sub-accounts of TRIAL_BACKEND: use account as-is (they'll have their own namespace)
    const kvAccount = (backend === DEFAULT_BACKEND && account !== '17747344571')
      ? '17747344571'
      : account

    const displayName = data.data.userInfo?.name || data.data.name || account
    const companyName = (backend === DEFAULT_BACKEND)
      ? (data.data.userInfo?.company_name || data.data.name || kvAccount)
      : displayName

    const wrapped = wrapToken(data.data.token, backend, kvAccount, companyName)
    data.data.token = wrapped
    if (data.data.userInfo) data.data.userInfo.token = wrapped

    // Write searchable entry so this account can be found by friends search
    if (kv) {
      await kv.put(`searchable:${account}`, JSON.stringify({
        company_name: companyName,
        name: displayName,
        mobile: account,
        created_at: new Date().toISOString(),
      }))
    }
    return jsonRes(data)
  }
  return jsonRes({ code: 0, show: 1, message: '账号不存在，请先注册', data: [] })
}

// ── Main handler ─────────────────────────────────────────────────────────────
export async function onRequest(context) {
  const { request, env } = context
  const url = new URL(request.url)

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const pathname = url.pathname

  // Handle register/login directly here (not proxied)
  if (request.method === 'POST' && pathname === '/adminapi/login/register') {
    let body
    try { body = await request.json() } catch { body = {} }
    return handleRegister(body, env)
  }

  if (request.method === 'POST' && pathname === '/adminapi/login/account') {
    let body
    try { body = await request.json() } catch { body = {} }
    return handleLogin(body, env)
  }

  // ════════════════════════════════════════════════
  // Chat API (handled locally with KV storage)
  // ════════════════════════════════════════════════
  if (isChatPath(pathname)) {
    // GET /adminapi/chat/groups - list groups
    if (pathname === '/adminapi/chat/groups' && request.method === 'GET') {
      return handleChatGroups(request, env)
    }
    // POST /adminapi/chat/groups - create group
    if (pathname === '/adminapi/chat/groups' && request.method === 'POST') {
      return handleCreateGroup(request, env)
    }
    // GET /adminapi/chat/groups/:id - get group detail
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+$/) && !pathname.includes('/messages') && request.method === 'GET') {
      return handleGetGroup(request, env)
    }
    // GET /adminapi/chat/groups/:id/messages - get messages
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/messages$/) && request.method === 'GET') {
      return handleGetMessages(request, env)
    }
    // POST /adminapi/chat/groups/:id/messages - send message
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/messages$/) && request.method === 'POST') {
      return handleSendMessage(request, env)
    }
    // GET /adminapi/chat/groups/unread - get unread count
    if (pathname === '/adminapi/chat/groups/unread' && request.method === 'GET') {
      return handleChatUnread(request, env)
    }
    // GET /adminapi/chat/groups/private/:targetUserId - find or create private chat
    const privateMatch = pathname.match(/^\/adminapi\/chat\/groups\/private\/(.+)$/)
    if (privateMatch && request.method === 'GET') {
      return handlePrivateChat(request, env, privateMatch[1])
    }
    // GET /adminapi/chat/groups/:id/members - get group members
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/members$/) && request.method === 'GET') {
      return handleGetGroupMembers(request, env)
    }
    // POST /adminapi/chat/groups/:id/members - add member
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/members$/) && request.method === 'POST') {
      return handleAddGroupMember(request, env)
    }
    // DELETE /adminapi/chat/groups/:id/members/:userId - remove member
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/members\/[^/]+$/) && request.method === 'DELETE') {
      return handleRemoveGroupMember(request, env)
    }
    // POST /adminapi/chat/groups/:id/read - mark messages read
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/read$/) && request.method === 'POST') {
      return handleMarkRead(request, env)
    }
    // POST /adminapi/chat/groups/:id/cleanup - cleanup old messages
    if (pathname.match(/^\/adminapi\/chat\/groups\/[\w-]+\/cleanup$/) && request.method === 'POST') {
      return handleCleanupMessages(request, env)
    }
    // POST /adminapi/chat/groups/:id/pin - 置顶/取消置顶会话
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/pin$/) && request.method === 'POST') {
      try { return await handlePinGroup(request, env) } catch (e) { return errRes('置顶操作失败: ' + (e?.message || e)) }
    }
    // PUT /adminapi/chat/groups/:id - 修改群名
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+$/) && request.method === 'PUT') {
      try { return await handleRenameGroup(request, env) } catch (e) { return errRes('修改群名失败: ' + (e?.message || e)) }
    }
    // DELETE /adminapi/chat/groups/:id - 删除会话
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+$/) && request.method === 'DELETE') {
      return handleDeleteGroup(request, env)
    }
    // GET /adminapi/chat/contacts - 获取通讯录成员
    if (pathname === '/adminapi/chat/contacts' && request.method === 'GET') {
      return handleGetContacts(request, env)
    }
    // GET /adminapi/chat/users/search?phone=xxx - 按手机号跨租户搜索用户
    if (pathname === '/adminapi/chat/users/search' && request.method === 'GET') {
      return handleSearchUser(request, env)
    }
    // GET /adminapi/chat/friends - 获取好友列表
    if (pathname === '/adminapi/chat/friends' && request.method === 'GET') {
      return handleGetFriends(request, env)
    }
    // POST /adminapi/chat/friend-requests - 发送好友申请
    if (pathname === '/adminapi/chat/friend-requests' && request.method === 'POST') {
      return handleSendFriendRequest(request, env)
    }
    // GET /adminapi/chat/friend-requests/pending - 查收到的申请
    if (pathname === '/adminapi/chat/friend-requests/pending' && request.method === 'GET') {
      return handleGetFriendRequests(request, env)
    }
    // POST /adminapi/chat/friend-requests/:id/accept
    const frAcceptMatch = pathname.match(/^\/adminapi\/chat\/friend-requests\/([^/]+)\/accept$/)
    if (frAcceptMatch && request.method === 'POST') {
      return handleAcceptFriendRequest(request, env, frAcceptMatch[1])
    }
    // POST /adminapi/chat/friend-requests/:id/reject
    const frRejectMatch = pathname.match(/^\/adminapi\/chat\/friend-requests\/([^/]+)\/reject$/)
    if (frRejectMatch && request.method === 'POST') {
      return handleRejectFriendRequest(request, env, frRejectMatch[1])
    }
    // 未匹配的chat路径，打日志后返回空成功（避免前端弹错误提示）
    console.warn('[Chat fallback] unmatched path:', pathname, request.method)
    return jsonSuccess({ rows: [], total: 0 })
async function handlePinGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }
  const pinned = body.pinned !== false // 默认置顶

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => String(g.id) === String(groupId))
  if (idx < 0) return errRes('群不存在')

  // 非创建者/成员不能操作
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const members = memberMap[groupId] || []
  if (!members.some(m => String(m.user_id) === String(userId)) && String(groups[idx].created_by) !== String(userId)) {
    return errRes('无权限')
  }

  groups[idx] = { ...groups[idx], is_pinned: pinned, updated_at: new Date().toISOString() }
  await env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups))
  return jsonSuccess({ is_pinned: pinned })
}

// PUT /adminapi/chat/groups/:id - 修改群名
async function handleRenameGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }
  const name = (body.name || '').trim()
  if (!name) return errRes('群名不能为空')

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => String(g.id) === String(groupId))
  if (idx < 0) return errRes('群不存在')

  // 非创建者/成员不能操作
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const members = memberMap[groupId] || []
  if (!members.some(m => String(m.user_id) === String(userId)) && String(groups[idx].created_by) !== String(userId)) {
    return errRes('无权限')
  }

  groups[idx] = { ...groups[idx], name, updated_at: new Date().toISOString() }
  await env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups))

  await logOperation(env, userId, 'chat_rename', `修改群名「${name}」`, { group_id: groupId, group_name: name })

  return jsonSuccess({ name, id: groupId })
}

// DELETE /adminapi/chat/groups/:id - 删除会话
async function handleDeleteGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const account = decodeToken(request.headers.get('token') || '')?.account || ''

  const raw = await env.USERS_KV.get(kvKey(account, 'chat_groups'))
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => String(g.id) === String(groupId))
  if (idx < 0) return errRes('群不存在')

  // 非创建者/成员不能删除
  const memberRaw = await env.USERS_KV.get(kvKey(account, 'chat_members'))
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const members = memberMap[groupId] || []
  if (!members.some(m => String(m.user_id) === String(userId)) && String(groups[idx].created_by) !== String(userId)) {
    return errRes('无权限')
  }

  groups.splice(idx, 1)
  delete memberMap[groupId]

  // 只删这个群的消息记录，不能删整个 chat_messages key
  const msgRaw = await env.USERS_KV.get(kvKey(account, 'chat_messages'))
  const msgMap = msgRaw ? JSON.parse(msgRaw) : {}
  delete msgMap[groupId]

  await Promise.all([
    env.USERS_KV.put(kvKey(account, 'chat_groups'), JSON.stringify(groups)),
    env.USERS_KV.put(kvKey(account, 'chat_members'), JSON.stringify(memberMap)),
    env.USERS_KV.put(kvKey(account, 'chat_messages'), JSON.stringify(msgMap)),
    env.USERS_KV.delete(`chat_unread:${userId}:${groupId}`),
  ])
  return jsonSuccess({ deleted: true })
}

// GET /adminapi/chat/contacts - 获取通讯录成员（员工 + Agent）用于发起会话
async function handleGetContacts(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const contactIds = await getContactIds(request, env, userId)

  const contacts = await Promise.all([...contactIds].map(async id => {
    const agent = agentRegistry.find(a => a.id === id)
    if (agent) return { id, name: agent.name, role: agent.role, type: 'agent' }
    const info = await getUserInfo(id, env)
    return { id, name: info.name || `用户${id}`, position: info.position || '', type: 'user' }
  }))

  return jsonSuccess({ contacts })
}

// ════════════════════════════════════════════════
// Friend Request & Cross-Tenant Chat Handlers
// ════════════════════════════════════════════════

async function handleSearchUser(request, env) {
  const url = new URL(request.url)
  const phone = url.searchParams.get('phone')?.trim()
  if (!phone) return errRes('请输入手机号')
  const decoded = decodeToken(request.headers.get('token') || '')
  if (!decoded) return errRes('请先登录')
  if (phone === decoded.account) return errRes('不能搜索自己')
  // 先查自注册用户（user: key），再查主账号可搜索记录（searchable: key）
  const raw = await env.USERS_KV.get(`user:${phone}`) || await env.USERS_KV.get(`searchable:${phone}`)
  if (!raw) return jsonSuccess(null)
  const user = JSON.parse(raw)
  // name 是子账号姓名，company_name 是公司名；未设置时退回 phone
  return jsonSuccess({ phone, name: user.name || null, company_name: user.company_name || phone })
}

async function handleSendFriendRequest(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const decoded = decodeToken(request.headers.get('token') || '')
  const myAccount = decoded?.account || ''
  const myCompany = decoded?.company || ''
  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }
  const { to_phone } = body
  if (!to_phone) return errRes('请输入对方手机号')
  if (to_phone === myAccount) return errRes('不能添加自己')
  const targetRaw = await env.USERS_KV.get(`user:${to_phone}`)
  if (!targetRaw) return errRes('该手机号未注册本系统')
  // 已是好友
  const friendsRaw = await env.USERS_KV.get(`friends:${myAccount}`)
  const friends = friendsRaw ? JSON.parse(friendsRaw) : []
  if (friends.some(f => f.account === to_phone)) return errRes('已经是好友了')
  // 已发过申请
  const sentKey = `fr_sent:${myAccount}:${to_phone}`
  const existing = await env.USERS_KV.get(sentKey)
  if (existing) return errRes('已发送过申请，请等待对方确认')
  const reqId = `fr_${Date.now()}_${Math.floor(Math.random() * 1000)}`
  const now = new Date().toISOString()
  const myInfo = await getUserInfo(userId, env)
  const friendRequest = {
    id: reqId, from_account: myAccount, from_company: myCompany,
    from_name: myInfo.name || myCompany || myAccount,
    from_user_id: String(userId), to_phone, status: 'pending', created_at: now,
  }
  await env.USERS_KV.put(`fr:${reqId}`, JSON.stringify(friendRequest))
  const inboxKey = `fr_inbox:${to_phone}`
  const inboxRaw = await env.USERS_KV.get(inboxKey)
  const inbox = inboxRaw ? JSON.parse(inboxRaw) : []
  inbox.push(reqId)
  await env.USERS_KV.put(inboxKey, JSON.stringify(inbox))
  await env.USERS_KV.put(sentKey, reqId, { expirationTtl: 86400 * 7 })
  return jsonSuccess({ id: reqId, message: '申请已发送' })
}

async function handleGetFriendRequests(request, env) {
  const decoded = decodeToken(request.headers.get('token') || '')
  const myAccount = decoded?.account || ''
  if (!myAccount) return errRes('请先登录')
  const inboxRaw = await env.USERS_KV.get(`fr_inbox:${myAccount}`)
  const inbox = inboxRaw ? JSON.parse(inboxRaw) : []
  const requests = []
  for (const reqId of inbox) {
    const raw = await env.USERS_KV.get(`fr:${reqId}`)
    if (!raw) continue
    const req = JSON.parse(raw)
    if (req.status === 'pending') requests.push(req)
  }
  return jsonSuccess({ rows: requests, total: requests.length })
}

async function handleAcceptFriendRequest(request, env, reqId) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')
  const decoded = decodeToken(request.headers.get('token') || '')
  const myAccount = decoded?.account || ''
  const myCompany = decoded?.company || ''
  const raw = await env.USERS_KV.get(`fr:${reqId}`)
  if (!raw) return errRes('申请不存在')
  const req = JSON.parse(raw)
  if (req.to_phone !== myAccount) return errRes('无权操作')
  if (req.status !== 'pending') return errRes('申请已处理')
  req.status = 'accepted'
  req.accepted_at = new Date().toISOString()
  await env.USERS_KV.put(`fr:${reqId}`, JSON.stringify(req))
  const now = new Date().toISOString()
  const groupId = nowMs() + Math.floor(Math.random() * 1000)
  // 互相加好友列表
  const myFriendsKey = `friends:${myAccount}`
  const myFriendsRaw = await env.USERS_KV.get(myFriendsKey)
  const myFriends = myFriendsRaw ? JSON.parse(myFriendsRaw) : []
  myFriends.push({ account: req.from_account, company: req.from_company, name: req.from_name, user_id: req.from_user_id, chat_group_id: String(groupId), added_at: now })
  await env.USERS_KV.put(myFriendsKey, JSON.stringify(myFriends))
  const theirFriendsKey = `friends:${req.from_account}`
  const theirFriendsRaw = await env.USERS_KV.get(theirFriendsKey)
  const theirFriends = theirFriendsRaw ? JSON.parse(theirFriendsRaw) : []
  const myInfo = await getUserInfo(userId, env)
  theirFriends.push({ account: myAccount, company: myCompany, name: myInfo.name || myCompany || myAccount, user_id: String(userId), chat_group_id: String(groupId), added_at: now })
  await env.USERS_KV.put(theirFriendsKey, JSON.stringify(theirFriends))
  // 在双方 chat_groups 里创建跨租户私聊
  const crossGroupBase = {
    id: groupId, cross_tenant: true, is_private: true,
    members: [
      { user_id: String(userId), account: myAccount, name: myInfo.name || myCompany },
      { user_id: String(req.from_user_id), account: req.from_account, name: req.from_name },
    ],
    created_at: now, updated_at: now, last_message: '', last_message_at: now,
  }
  // 我方：群名显示对方公司
  const myGroupsKey = kvKey(myAccount, 'chat_groups')
  const myGroupsRaw = await env.USERS_KV.get(myGroupsKey)
  const myGroups = myGroupsRaw ? JSON.parse(myGroupsRaw) : []
  myGroups.push({ ...crossGroupBase, name: req.from_company || req.from_account, other_account: req.from_account })
  await env.USERS_KV.put(myGroupsKey, JSON.stringify(myGroups))
  const myMembersKey = kvKey(myAccount, 'chat_members')
  const myMembersRaw = await env.USERS_KV.get(myMembersKey)
  const myMemberMap = myMembersRaw ? JSON.parse(myMembersRaw) : {}
  myMemberMap[groupId] = crossGroupBase.members.map(m => ({ user_id: m.user_id }))
  await env.USERS_KV.put(myMembersKey, JSON.stringify(myMemberMap))
  // 对方：群名显示我方公司
  const theirGroupsKey = kvKey(req.from_account, 'chat_groups')
  const theirGroupsRaw = await env.USERS_KV.get(theirGroupsKey)
  const theirGroups = theirGroupsRaw ? JSON.parse(theirGroupsRaw) : []
  theirGroups.push({ ...crossGroupBase, name: myCompany || myAccount, other_account: myAccount })
  await env.USERS_KV.put(theirGroupsKey, JSON.stringify(theirGroups))
  const theirMembersKey = kvKey(req.from_account, 'chat_members')
  const theirMembersRaw = await env.USERS_KV.get(theirMembersKey)
  const theirMemberMap = theirMembersRaw ? JSON.parse(theirMembersRaw) : {}
  theirMemberMap[groupId] = crossGroupBase.members.map(m => ({ user_id: m.user_id }))
  await env.USERS_KV.put(theirMembersKey, JSON.stringify(theirMemberMap))
  await env.USERS_KV.delete(`fr_sent:${req.from_account}:${myAccount}`)
  return jsonSuccess({ message: '已同意', group_id: String(groupId) })
}

async function handleRejectFriendRequest(request, env, reqId) {
  const decoded = decodeToken(request.headers.get('token') || '')
  const myAccount = decoded?.account || ''
  const raw = await env.USERS_KV.get(`fr:${reqId}`)
  if (!raw) return errRes('申请不存在')
  const req = JSON.parse(raw)
  if (req.to_phone !== myAccount) return errRes('无权操作')
  if (req.status !== 'pending') return errRes('申请已处理')
  req.status = 'rejected'
  await env.USERS_KV.put(`fr:${reqId}`, JSON.stringify(req))
  await env.USERS_KV.delete(`fr_sent:${req.from_account}:${myAccount}`)
  return jsonSuccess({ message: '已拒绝' })
}

async function handleGetFriends(request, env) {
  const decoded = decodeToken(request.headers.get('token') || '')
  const myAccount = decoded?.account || ''
  if (!myAccount) return errRes('请先登录')
  const raw = await env.USERS_KV.get(`friends:${myAccount}`)
  const friends = raw ? JSON.parse(raw) : []
  return jsonSuccess({ rows: friends, total: friends.length })
}

// Agent 列表（内联，避免 require）
const agentRegistry = [
  { id: 'captain', name: '总指挥', role: 'AI 指挥官' },
  { id: 'secretary', name: '秘书', role: '广告部门秘书' },
  { id: 'copywriter', name: '内容部', role: 'AI 文案' },
  { id: 'poster', name: '发布部', role: 'AI 发布' },
  { id: 'video', name: '视频部', role: 'AI 视频' },
  { id: 'brand', name: '品牌部', role: 'AI 品牌' },
  { id: 'trend', name: '情报部', role: 'AI 情报' },
  { id: 'publisher', name: '发布官', role: 'AI 发布' },
  { id: 'designer', name: '平面设计师', role: 'AI 设计' },
  { id: 'marketing', name: '营销顾问', role: 'AI 营销' },
  { id: 'adam', name: '亚当', role: '投资决策' },
  { id: 'nova', name: 'Nova', role: '品牌主页' },
]


  }

  // ═══════════════════════════════════════════════════════════════
  // Operation Logs API — read logs from KV
  // ═══════════════════════════════════════════════════════════════
  if (pathname === '/adminapi/operation-logs' && request.method === 'GET') {
    const raw = await env.USERS_KV.get('operation_logs')
    const logs = raw ? JSON.parse(raw) : []
    const limit = parseInt(url.searchParams.get('limit') || '50', 10)
    const type = url.searchParams.get('type') || ''
    let result = logs
    if (type) result = result.filter(l => l.action_type === type)
    result = result.slice(-limit).reverse()
    return jsonRes({ logs: result, total: result.length })
  }

  // ═══════════════════════════════════════════════════════════════
  // Work Plans API — handled locally with KV storage
  // ═══════════════════════════════════════════════════════════════
  if (isWorkPath(pathname)) {
    // Cron 跟进端点不需要登录验证
    if (pathname === '/adminapi/work/followup' && request.method === 'POST') {
      // 验证内部调用密钥
      const secret = request.headers.get('x-cron-secret')
      if (secret !== (env.CRON_SECRET || 'nomad-cron-2026')) return errRes('无权限', 403)

      const plansRaw = await env.USERS_KV.get('work_plans')
      const plans = plansRaw ? JSON.parse(plansRaw) : []
      const now = new Date()
      const todayStr = now.toISOString().slice(0, 10)

      const activePlans = plans.filter(p => p.status !== 'done' && p.status !== 'cancelled')
      if (activePlans.length === 0) return jsonRes({ message: '无待跟进任务', count: 0 })

      let erpEmployees = []
      try {
        let mToken = await env.USERS_KV.get('master_token_cache')
        if (!mToken && env.MASTER_ACCOUNT && env.MASTER_PASSWORD) {
          const masterData = await loginBackend(DEFAULT_BACKEND, { account: env.MASTER_ACCOUNT, password: env.MASTER_PASSWORD })
          mToken = masterData.code === 1 ? masterData.data.token : null
          if (mToken) await env.USERS_KV.put('master_token_cache', mToken, { expirationTtl: 82800 })
        }
        if (mToken) {
          const empRes = await fetch(`${DEFAULT_BACKEND}/adminapi/setting/admin/index?list_rows=500`, {
            headers: { 'Content-Type': 'application/json', 'token': mToken, 'authori-zation': mToken }
          })
          erpEmployees = (await empRes.json())?.data?.rows ?? []
        }
      } catch {}

      const groupsRaw2 = await env.USERS_KV.get('chat_groups')
      const allGroupsF = groupsRaw2 ? JSON.parse(groupsRaw2) : []
      const memberIncludes2 = (ids, val) => ids?.some(id => String(id) === String(val))
      let notified = 0
      let groupsChangedF = false

      for (const plan of activePlans) {
        const mentions = plan.mentions || []
        if (mentions.length === 0) continue

        let daysLeft = null
        let urgencyPrefix = '📋'
        if (plan.due_date && plan.due_date !== '待定') {
          const due = new Date(plan.due_date)
          if (!isNaN(due)) {
            daysLeft = Math.ceil((due - now) / 86400000)
            if (daysLeft < 0) urgencyPrefix = '⚠️ 已逾期！'
            else if (daysLeft === 0) urgencyPrefix = '🔴 今天截止！'
            else if (daysLeft === 1) urgencyPrefix = '🟠 明天截止！'
            else if (daysLeft <= 3) urgencyPrefix = '🟡 即将到期'
          }
        }

        const dueDisplay = plan.due_date && plan.due_date !== '待定'
          ? `${plan.due_date}${daysLeft !== null ? `（还剩 ${daysLeft} 天）` : ''}`
          : '待定'

        for (const mention of mentions) {
          const name = mention.name
          if (!name || name === '待定') continue
          let user = erpEmployees.find(u => (u.name || u.admin_name) === name)
          if (!user) user = erpEmployees.find(u => { const n = u.name||u.admin_name||''; return n.includes(name)||name.includes(n) })
          if (!user) continue
          const uid = String(user.id || user.user_id)
          const userName = user.name || user.admin_name

          let targetGroup = allGroupsF.find(g =>
            g.member_ids?.length === 2 &&
            memberIncludes2(g.member_ids, 'secretary') &&
            memberIncludes2(g.member_ids, uid)
          )
          if (!targetGroup) {
            targetGroup = {
              id: Date.now() + Math.floor(Math.random() * 9999),
              name: userName, is_private: true,
              member_ids: ['secretary', uid],
              created_at: new Date().toISOString(), last_message: '', last_message_at: new Date().toISOString(),
            }
            allGroupsF.push(targetGroup)
            groupsChangedF = true
          }

          const statusLabel = { todo: '待开始', doing: '进行中', done: '已完成' }[plan.status] || plan.status
          const followMsg = [
            `${urgencyPrefix} ${userName}，秘书每日跟进提醒：`,
            ``,
            `任务：「${plan.title}」`,
            `状态：${statusLabel}`,
            `截止：${dueDisplay}`,
            ``,
            `请更新进度或如期完成，有困难随时告知。`,
          ].join('\n')

          const msgRaw = await env.USERS_KV.get('chat_messages')
          const msgMapF = msgRaw ? JSON.parse(msgRaw) : {}
          if (!msgMapF[targetGroup.id]) msgMapF[targetGroup.id] = []
          msgMapF[targetGroup.id].push({
            id: Date.now() + Math.floor(Math.random() * 9999),
            group_id: targetGroup.id, sender_id: 'secretary', sender_name: '秘书',
            content: followMsg, type: 'text', created_at: new Date().toISOString(),
          })
          await env.USERS_KV.put('chat_messages', JSON.stringify(msgMapF))

          const gIdxF = allGroupsF.findIndex(g => String(g.id) === String(targetGroup.id))
          if (gIdxF !== -1) { allGroupsF[gIdxF].last_message = followMsg.slice(0,60); allGroupsF[gIdxF].last_message_at = new Date().toISOString(); groupsChangedF = true }

          const unreadKeyF = `chat_unread:${uid}:${targetGroup.id}`
          const curF = parseInt(await env.USERS_KV.get(unreadKeyF) || '0')
          await env.USERS_KV.put(unreadKeyF, String(curF + 1))
          notified++
        }

        const pIdx = plans.findIndex(p => p.id === plan.id)
        if (pIdx !== -1) {
          plans[pIdx].follow_up = { ...plans[pIdx].follow_up, last_remind: new Date().toISOString(), remind_count: (plans[pIdx].follow_up?.remind_count || 0) + 1 }
        }
      }

      if (groupsChangedF) await env.USERS_KV.put('chat_groups', JSON.stringify(allGroupsF))
      await env.USERS_KV.put('work_plans', JSON.stringify(plans))
      return jsonRes({ message: `跟进完成，共通知 ${notified} 人`, count: notified, date: todayStr })
    }

    const userId = getUserId(request)
    if (!userId) return errRes('未登录', 401)

    // GET /adminapi/work/plans — list
    if ((pathname === '/adminapi/work/plans' || pathname === '/adminapi/work/plans/index') && request.method === 'GET') {
      const url = new URL(request.url)
      const status = url.searchParams.get('status') || ''
      const assigned = url.searchParams.get('assigned')
      const raw = await env.USERS_KV.get('work_plans')
      let plans = raw ? JSON.parse(raw) : []
      if (assigned === 'me') {
        plans = plans.filter(p =>
          p.creator_id === userId || (p.mentions || []).some(m => String(m.id) === String(userId))
        )
      }
      if (status) plans = plans.filter(p => p.status === status)
      plans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      return jsonRes({ plans, total: plans.length })
    }

    // POST /adminapi/work/plans — create
    if (pathname === '/adminapi/work/plans' && request.method === 'POST') {
      let body
      try { body = await request.json() } catch { return errRes('请求格式错误') }
      const { title, description, mentions = [], due_date, priority } = body
      if (!title?.trim()) return errRes('请填写任务标题')
      const now = new Date().toISOString()
      const plansRaw = await env.USERS_KV.get('work_plans')
      const plans = plansRaw ? JSON.parse(plansRaw) : []
      const newPlan = {
        id: Date.now(), creator_id: userId,
        title: title.trim(), description: description?.trim() || '',
        status: 'todo', priority: priority || 'normal',
        mentions, due_date: due_date || '',
        follow_up: { last_remind: null, next_remind: null, remind_count: 0 },
        created_at: now, updated_at: now,
      }
      plans.unshift(newPlan)
      await env.USERS_KV.put('work_plans', JSON.stringify(plans))
      return jsonRes({ plan: newPlan }, 201)
    }

    // PUT /adminapi/work/plans/:id
    const putMatch = pathname.match(/^\/adminapi\/work\/plans\/(\d+)$/)
    if (putMatch && request.method === 'PUT') {
      const planId = Number(putMatch[1])
      const body = await request.json()
      const plansRaw = await env.USERS_KV.get('work_plans')
      const plans = plansRaw ? JSON.parse(plansRaw) : []
      const idx = plans.findIndex(p => p.id === planId)
      if (idx === -1) return errRes('任务不存在')
      plans[idx] = { ...plans[idx], ...body, updated_at: new Date().toISOString() }
      await env.USERS_KV.put('work_plans', JSON.stringify(plans))
      return jsonRes({ plan: plans[idx] })
    }

    // DELETE /adminapi/work/plans/:id
    if (putMatch && request.method === 'DELETE') {
      const planId = Number(putMatch[1])
      const plansRaw = await env.USERS_KV.get('work_plans')
      const plans = plansRaw ? JSON.parse(plansRaw) : []
      await env.USERS_KV.put('work_plans', JSON.stringify(plans.filter(p => p.id !== planId)))
      return jsonRes({ message: '已删除' })
    }

    // POST /adminapi/work/plans/:id/remind
    const remindMatch = pathname.match(/^\/adminapi\/work\/plans\/(\d+)\/remind$/)
    if (remindMatch && request.method === 'POST') {
      const planId = Number(remindMatch[1])
      const plansRaw = await env.USERS_KV.get('work_plans')
      const plans = plansRaw ? JSON.parse(plansRaw) : []
      const idx = plans.findIndex(p => p.id === planId)
      if (idx === -1) return errRes('任务不存在')
      plans[idx].follow_up = {
        ...plans[idx].follow_up,
        last_remind: new Date().toISOString(),
        remind_count: (plans[idx].follow_up?.remind_count || 0) + 1,
      }
      await env.USERS_KV.put('work_plans', JSON.stringify(plans))
      return jsonRes({ plan: plans[idx] })
    }

    return errRes('工作计划功能暂不支持')
  }

  // Retail order original-detail override. The upstream backend does not expose
  // a retail order edit route, so persist safe goods_info corrections at the API
  // layer and merge them into subsequent retail order list responses.
  if (pathname === '/adminapi/retail/order/edit' && request.method === 'POST') {
    const wrappedToken = request.headers.get('token') || ''
    const decoded = decodeToken(wrappedToken)
    if (decoded?.trial && decoded.backend && !decoded.backend.includes('erp-trial')) {
      return new Response(JSON.stringify({ code: -1, message: 'token已过期，请重新登录', data: [] }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
    let body
    try { body = await request.json() } catch { body = {} }
    const id = Number(body?.id || 0)
    if (!id) return errRes('缺少零售单 ID')
    if (body.goods_info === undefined) return errRes('缺少 goods_info')
    const backend = decoded?.backend || DEFAULT_BACKEND
    const realToken = decoded?.realToken || (decoded ? null : wrappedToken)

    // 先把 goods_info 写入 KV（维持原有的 override 机制）
    if (env.USERS_KV) {
      const override = {
        goods_info: typeof body.goods_info === 'string' ? body.goods_info : JSON.stringify(body.goods_info || []),
        updated_at: new Date().toISOString(),
        _goods_info_overridden: true,
      }
      await env.USERS_KV.put(retailOrderOverrideKey(backend, id), JSON.stringify(override))
    }

    // 再转发到后端保存所有字段（order_date、remark 等）
    const targetUrl = backend + pathname
    const fwdHeaders = new Headers()
    fwdHeaders.set('content-type', 'application/json')
    if (realToken) fwdHeaders.set('token', realToken)
    try {
      const backendRes = await fetch(targetUrl, {
        method: 'POST',
        headers: fwdHeaders,
        body: JSON.stringify(body),
      })
      const text = await backendRes.text()
      return new Response(text, {
        status: backendRes.status,
        headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    } catch {
      return jsonSuccess({ id, _goods_info_overridden: true })
    }
  }



  // ═══════════════════════════════════════════════════════════════
  // Finance Receipt Logging — proxy to backend, then log operation
  // ═══════════════════════════════════════════════════════════════
  const financeReceiptMatch = pathname.match(/^\/adminapi\/finance\/(CollectReceipt|PayReceipt)\/add$/)
  if (financeReceiptMatch && request.method === 'POST') {
    const wrappedToken2 = request.headers.get('token') || ''
    const decoded2 = decodeToken(wrappedToken2)
    const userId2 = decoded2?.userId || decoded2?.id || null
    const receiptType = financeReceiptMatch[1]

    // Clone request body (it can only be read once)
    let bodyText = ''
    try { bodyText = await request.text() } catch { bodyText = '{}' }
    const bodyData = JSON.parse(bodyText || '{}')

    const backend2 = decoded2?.backend || DEFAULT_BACKEND
    const realToken2 = decoded2?.realToken || (decoded2 ? null : wrappedToken2)
    const targetUrl2 = backend2 + pathname + url.search
    const headers2 = new Headers(request.headers)
    headers2.set('host', new URL(backend2).host)
    if (realToken2) headers2.set('token', realToken2)
    else headers2.delete('token')
    ;['origin', 'referer', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-forwarded-proto'].forEach(h => headers2.delete(h))
    headers2.set('accept-encoding', 'identity')

    try {
      const proxyRes = await fetch(targetUrl2, { method: 'POST', headers: headers2, body: bodyText })
      const resBody = await proxyRes.text()
      let resJson
      try { resJson = JSON.parse(resBody) } catch { resJson = { code: 1, message: 'ok', data: {} } }

      // Log operation on success
      if (resJson.code === 1 || resJson.code === 200) {
        const amount = bodyData.amount || '0'
        const remark = bodyData.remark || bodyData.memo || ''
        const actionName = receiptType === 'CollectReceipt'
          ? `快速收款 ¥${amount}${remark ? '（' + remark + '）' : ''}`
          : `快速付款 ¥${amount}${remark ? '（' + remark + '）' : ''}`
        if (userId2) {
          try { await logOperation(env, userId2, receiptType === 'CollectReceipt' ? 'quick_collect' : 'quick_pay', actionName, { amount, remark, receipt_type: receiptType, ...bodyData }) } catch {}
        }
      }

      const newHeaders = new Headers(proxyRes.headers)
      Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
      return new Response(resBody, { status: proxyRes.status, headers: newHeaders })
    } catch (e) {
      return new Response(JSON.stringify({ code: 0, show: 0, message: 'Proxy error: ' + (e?.message || e), data: [] }), {
        status: 502, headers: { 'Content-Type': 'application/json', ...corsHeaders() },
      })
    }
  }

  // All other requests: decode token and proxy to correct backend
  const wrappedToken = request.headers.get('token') || ''
  const decoded = decodeToken(wrappedToken)

  // Server-side guard: trial tokens that still point to the old production backend
  // must be rejected so the client is forced to re-login regardless of JS cache.
  if (decoded?.trial && decoded.backend && !decoded.backend.includes('erp-trial') && !isTrialPassthrough(pathname)) {
    return new Response(JSON.stringify({ code: -1, message: 'token已过期，请重新登录', data: [] }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }

  const backend = decoded?.backend || DEFAULT_BACKEND
  const realToken = decoded?.realToken || (decoded ? null : wrappedToken)

  const targetUrl = backend + pathname + url.search
  const headers = new Headers(request.headers)
  headers.set('host', new URL(backend).host)
  if (realToken) headers.set('token', realToken)
  else headers.delete('token')
  headers.delete('origin')
  headers.delete('referer')
  headers.delete('cf-connecting-ip')
  headers.delete('cf-ipcountry')
  headers.delete('cf-ray')
  headers.delete('cf-visitor')
  headers.delete('x-forwarded-for')
  headers.delete('x-forwarded-proto')

  try {
    // For routes where we need to parse the response body (retail order overrides),
    // force identity encoding so response.text() gets plain JSON, not compressed bytes.
    const needsBodyParse = pathname === '/adminapi/retail/order/index' && request.method === 'GET'
    if (needsBodyParse) headers.set('Accept-Encoding', 'identity')

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })
    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
    if (needsBodyParse) {
      const text = await response.text()
      try {
        const data = await applyRetailOrderOverrides(JSON.parse(text), env, backend)
        newHeaders.delete('content-encoding')
        return new Response(JSON.stringify(data), { status: response.status, headers: newHeaders })
      } catch {
        newHeaders.delete('content-encoding')
        return new Response(text, { status: response.status, headers: newHeaders })
      }
    }
    return new Response(response.body, { status: response.status, headers: newHeaders })
  } catch {
    return new Response(JSON.stringify({ code: 0, show: 0, message: 'Proxy error', data: [] }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
