// Cloudflare Pages Function — /adminapi/[[path]]
// Handles KV-based register/login, chat API, and proxies other requests to backend

const DEFAULT_BACKEND = 'https://erp-server-xsji.onrender.com'

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
  const body = { code: 1, data }
  return new Response(JSON.stringify(body), {
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
  // 3. Fallback: 尝试旧 API
  try {
    const res = await fetch(`https://saas.mzth.cn/adminapi/admin/Admin/index?admin_id=${userId}`, {
      headers: { 'Content-Type': 'application/json' }
    })
    const data = await res.json()
    if (data?.data?.rows?.[0]) {
      const u = data.data.rows[0]
      const info = { name: u.name || u.account, position: u.position || '成员', dept: u.dept || '' }
      await env.USERS_KV.put(`user_info:${userId}`, JSON.stringify(info), { expirationTtl: 3600 })
      return info
    }
  } catch {}
  return { name: `用户${userId}`, position: '成员' }
}

async function logOperation(env, userId, actionType, actionName, extra = {}) {
  const raw = await env.USERS_KV.get('operation_logs')
  const logs = raw ? JSON.parse(raw) : []
  logs.push({
    id: nowMs() + Math.floor(Math.random() * 1000),
    user_id: userId,
    action_type: actionType,
    action_name: actionName,
    extra,
    created_at: new Date().toISOString(),
  })
  if (logs.length > 10000) logs.splice(0, logs.length - 10000)
  await env.USERS_KV.put('operation_logs', JSON.stringify(logs))
}

// Agent IDs（虚拟用户）
const AGENT_IDS = new Set([
  'ai-assistant-fixed',
  'captain', 'secretary', 'copywriter', 'poster', 'video', 'brand', 'trend', 'publisher', 'designer', 'marketing',
  'adam', 'nova',
])

// Agent 配置（systemPrompt 用于自动回复）
const AGENT_CONFIGS = {
  captain: { name: 'Captain', systemPrompt: '你是数字游牧广告公司的Captain总指挥，负责统筹协调所有AI专员。回复简洁专业，像指挥官一样下达指令。全程中文。' },
  secretary: { name: '秘书', systemPrompt: `你是数字游牧广告公司的秘书，是群聊的第一响应人。你的核心职责：
1. 第一时间回应群里的消息，梳理清楚用户需求
2. 跟进项目进度和待办事项，主动汇报状态
3. 根据任务性质分配给对应专员：文案→文案Agent，设计→海报Agent/平面设计师，视频→视频Agent，品牌策略→品牌Agent，热点情报→趋势Agent，发布排期→发布Agent
4. 遇到重大决策或战略问题，明确告知"这个需要请示Captain总指挥"并@captain
5. 遇到ERP业务问题（订单/库存/财务），告知"这个需要问管家"
回复简洁高效，像一个靠谱的助理。全程中文。` },
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
回复专业准确，优先给出可执行的操作指引。全程中文。` },
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
  const url = new URL(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '50')
  const page = parseInt(url.searchParams.get('page') || '1')

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const memberRaw = await env.USERS_KV.get('chat_members')
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

  const msgRaw = await env.USERS_KV.get('chat_messages')
  const msgMap = msgRaw ? JSON.parse(msgRaw) : {}

  const result = (await Promise.all(userGroups.map(async g => {
    const msgs = (msgMap[g.id] || []).slice(-1)
    const lastMsg = msgs[0] || null
    const unreadRaw = await env.USERS_KV.get(`chat_unread:${userId}:${g.id}`)
    const members = memberMap[g.id] || []
    return {
      ...g,
      member_ids: members.map(m => m.user_id),
      last_message: lastMsg?.content || '',
      last_message_at: lastMsg?.created_at || g.updated_at || g.created_at,
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

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { name, member_ids = [] } = body
  if (!name?.trim()) return errRes('请输入群名称')

  // 验证所有成员必须是通讯录里的人
  const contactIds = await getContactIds(request, env, userId)
  const invalid = member_ids.filter(id => !contactIds.has(String(id)))
  if (invalid.length > 0) return errRes(`成员 ${invalid[0]} 不在通讯录中`)

  const raw = await env.USERS_KV.get('chat_groups')
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

  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  memberMap[newId] = allMembers

  await Promise.all([
    env.USERS_KV.put('chat_groups', JSON.stringify(groups)),
    env.USERS_KV.put('chat_members', JSON.stringify(memberMap)),
  ])

  await logOperation(env, userId, 'chat_create', `创建群聊「${name}」`, { group_id: newId, group_name: name })

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

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const group = groups.find(g => g.id === groupId)
  if (!group) return errRes('群不存在')

  const memberRaw = await env.USERS_KV.get('chat_members')
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
  const url = new URL(request.url)
  const groupId = extractGroupId(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '50')
  const afterId = url.searchParams.get('after_id') ? parseInt(url.searchParams.get('after_id')) : null

  if (!groupId) return errRes('群不存在')

  const raw = await env.USERS_KV.get('chat_messages')
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

// 🤖 Agent 自动回复触发器
async function triggerAgentReplies(groupId, senderId, content, memberIds, env) {
  // 找出群里的 Agent 成员（排除发送者）
  console.log(`[AgentReply] group=${groupId}, sender=${senderId}, allMembers=${JSON.stringify(memberIds)}, hasApiKey=${!!env.ANTHROPIC_API_KEY}`)
  const agentIds = memberIds.filter(id => AGENT_IDS.has(String(id)) && String(id) !== String(senderId))
  if (agentIds.length === 0) {
    console.log(`[AgentReply] no agents found in group`)
    return
  }
  console.log(`[AgentReply] found agents: ${JSON.stringify(agentIds)}`)

  // 获取历史消息作为上下文（最近 8 条，全部作为 user 角色带发言人名字，避免AI误认身份）
  const raw = await env.USERS_KV.get('chat_messages')
  const msgMap = raw ? JSON.parse(raw) : {}
  const history = (msgMap[groupId] || []).slice(-50).map(m => ({
    role: 'user',
    content: `[${m.sender_name}]: ${m.content}`
  }))

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
          if (fallback && AGENT_CONFIGS[String(fallback)] && env.ANTHROPIC_API_KEY) {
            activeAgentIds = [String(fallback)]
          }
        }
      }
    }
    } // end else (群聊)
  } else {
    // 欢迎消息：第一个Agent发欢迎
    const firstAgentId = agentIds.find(id => AGENT_CONFIGS[String(id)] && env.ANTHROPIC_API_KEY)
    activeAgentIds = firstAgentId ? [firstAgentId] : []
  }
  for (const agentId of activeAgentIds) {
    const config = AGENT_CONFIGS[String(agentId)]
    if (!config || !env.ANTHROPIC_API_KEY) {
      console.log(`[AgentReply] skip ${agentId}: noConfig=${!config}, noKey=${!env.ANTHROPIC_API_KEY}`)
      continue
    }
    console.log(`[AgentReply] calling AI for ${agentId}...`)

    // 欢迎消息 vs 正常回复
    const userMessage = isWelcome
      ? `你好！我是${config.name}。有什么可以帮你的？`
      : content

    try {
      const apiBase = (env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com').replace(/\/$/, '')
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
          system: config.systemPrompt,
          messages: [...history, { role: 'user', content: userMessage }],
        }),
      })

      if (!res.ok) {
        console.error(`[AgentReply] API error for ${agentId}: ${res.status} ${await res.text()}`)
        continue
      }
      const data = await res.json()
      const replyText = data.content?.find(b => b.type === 'text')?.text
      if (!replyText) {
        console.error(`[AgentReply] no text in response for ${agentId}: ${JSON.stringify(data).slice(0,200)}`)
        continue
      }
      console.log(`[AgentReply] ${agentId} replied: ${replyText.slice(0, 50)}...`)

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

      const raw2 = await env.USERS_KV.get('chat_messages')
      const msgMap2 = raw2 ? JSON.parse(raw2) : {}
      if (!msgMap2[groupId]) msgMap2[groupId] = []
      msgMap2[groupId].push(agentMsg)
      await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap2))

      // 更新群最后消息
      const groupsRaw = await env.USERS_KV.get('chat_groups')
      const groups = groupsRaw ? JSON.parse(groupsRaw) : []
      const idx = groups.findIndex(g => g.id === groupId)
      if (idx !== -1) {
        groups[idx].last_message_at = now
        groups[idx].last_message = replyText.slice(0, 100)
        await env.USERS_KV.put('chat_groups', JSON.stringify(groups))
      }

      // 给群成员加未读（除了 Agent 自己）
      for (const mid of memberIds) {
        if (AGENT_IDS.has(mid)) continue
        const unreadKey = `chat_unread:${mid}:${groupId}`
        const cur = parseInt(await env.USERS_KV.get(unreadKey) || '0')
        await env.USERS_KV.put(unreadKey, String(cur + 1))
      }
    } catch (e) {
      console.error(`Agent ${agentId} reply failed:`, e)
    }
  }
}

async function handleSendMessage(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

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

  const raw = await env.USERS_KV.get('chat_messages')
  const msgMap = raw ? JSON.parse(raw) : {}
  if (!msgMap[groupId]) msgMap[groupId] = []
  msgMap[groupId].push(msg)

  if (msgMap[groupId].length > 2000) {
    msgMap[groupId] = msgMap[groupId].slice(-2000)
  }

  await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap))

  const groupsRaw = await env.USERS_KV.get('chat_groups')
  const groups = groupsRaw ? JSON.parse(groupsRaw) : []
  const gIdx = groups.findIndex(g => g.id === groupId)
  if (gIdx !== -1) {
    groups[gIdx].last_message_at = now
    groups[gIdx].last_message = content.trim().slice(0, 100)
    await env.USERS_KV.put('chat_groups', JSON.stringify(groups))
  }

  // 给群内其他成员增加未读计数
  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const memberIds = (memberMap[groupId] || []).map(m => m.user_id)
  for (const mid of memberIds) {
    if (String(mid) === String(userId)) continue // 不给自己加未读
    if (AGENT_IDS.has(String(mid))) continue // Agent不需要未读计数
    const unreadKey = `chat_unread:${mid}:${groupId}`
    const cur = parseInt(await env.USERS_KV.get(unreadKey) || '0')
    await env.USERS_KV.put(unreadKey, String(cur + 1))
  }

  await logOperation(env, userId, 'chat_message', content, { group_id: groupId, message_id: msg.id })

  // 🤖 触发 Agent 自动回复（必须在 response 前完成，Pages Functions 返回后 worker 会终止）
  let agentReplyStatus = 'no_agents'
  try {
    const agentIds = memberIds.filter(id => AGENT_IDS.has(String(id)) && String(id) !== String(userId))
    if (agentIds.length > 0) {
      agentReplyStatus = 'triggered_' + agentIds.join(',')
      await triggerAgentReplies(groupId, userId, content.trim(), memberIds, env)
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

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const memberRaw = await env.USERS_KV.get('chat_members')
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

  // 验证目标用户在通讯录中
  const contactIds = await getContactIds(request, env, userId)
  if (!contactIds.has(String(targetUserId))) return errRes('该用户不在通讯录中')

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const memberRaw = await env.USERS_KV.get('chat_members')
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
    env.USERS_KV.put('chat_groups', JSON.stringify(groups)),
    env.USERS_KV.put('chat_members', JSON.stringify(memberMap)),
  ])

  return jsonSuccess({ ...newGroup, member_ids: [uid, tid], is_private: true, existed: false })
}

async function handleGetGroupMembers(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const group = groups.find(g => g.id === groupId)
  if (!group) return errRes('群不存在')

  const memberRaw = await env.USERS_KV.get('chat_members')
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

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const newUserId = body.user_id
  if (!newUserId) return errRes('缺少 user_id')

  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (!memberMap[groupId]) memberMap[groupId] = []

  if (memberMap[groupId].some(m => m.user_id === newUserId)) {
    return errRes('该用户已在群中')
  }

  memberMap[groupId].push({ user_id: newUserId })
  await env.USERS_KV.put('chat_members', JSON.stringify(memberMap))

  return jsonSuccess({ success: true })
}

async function handleRemoveGroupMember(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  // Extract the target user ID from the path（支持数字和字符串Agent ID）
  const m = request.url.match(/\/members\/([^/?]+)/)
  const targetUserId = m ? decodeURIComponent(m[1]) : null
  if (!targetUserId) return errRes('缺少用户ID')

  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (!memberMap[groupId]) return errRes('群不存在')

  memberMap[groupId] = memberMap[groupId].filter(m => String(m.user_id) !== String(targetUserId))
  await env.USERS_KV.put('chat_members', JSON.stringify(memberMap))

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

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const days = body.days || 30
  const cutoff = Date.now() - days * 86400000

  const raw = await env.USERS_KV.get('chat_messages')
  const msgMap = raw ? JSON.parse(raw) : {}
  if (msgMap[groupId]) {
    msgMap[groupId] = msgMap[groupId].filter(m => m.created_at && new Date(m.created_at).getTime() > cutoff)
    await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap))
  }

  return jsonSuccess({ success: true, removed_before: new Date(cutoff).toISOString() })
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

      // Trial user: use cached master token
      const masterAccount = env.MASTER_ACCOUNT
      const masterPassword = env.MASTER_PASSWORD
      if (!masterAccount || !masterPassword) {
        return jsonRes({ code: 0, show: 1, message: '试用账号未配置管理员凭证，请联系管理员处理', data: [] })
      }
      const CACHE_KEY = 'master_token_cache'
      let realToken = null
      const cached = await kv.get(CACHE_KEY)
      if (cached) {
        realToken = cached
      } else {
        const masterData = await loginBackend(DEFAULT_BACKEND, { account: masterAccount, password: masterPassword })
        realToken = masterData.code === 1 ? masterData.data.token : null
        if (realToken) await kv.put(CACHE_KEY, realToken, { expirationTtl: 82800 })
      }
      if (!realToken) return jsonRes({ code: 0, show: 1, message: '登录失败，请重试', data: [] })

      const trialToken = wrapToken(realToken, DEFAULT_BACKEND, account, user.company_name, true)
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
  }

  // Not in KV — proxy to default backend (existing admin accounts)
  const data = await loginBackend(DEFAULT_BACKEND, body)
  if (data.code === 1) {
    const wrapped = wrapToken(data.data.token, DEFAULT_BACKEND, account, data.data.name || '')
    data.data.token = wrapped
    if (data.data.userInfo) data.data.userInfo.token = wrapped
  }
  return jsonRes(data)
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
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/cleanup$/) && request.method === 'POST') {
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
    // 未匹配的chat路径，打日志后返回空成功（避免前端弹错误提示）
    console.warn('[Chat fallback] unmatched path:', pathname, request.method)
    return jsonSuccess({ rows: [], total: 0 })
async function handlePinGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }
  const pinned = body.pinned !== false // 默认置顶

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => String(g.id) === String(groupId))
  if (idx < 0) return errRes('群不存在')

  // 非创建者/成员不能操作
  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const members = memberMap[groupId] || []
  if (!members.some(m => String(m.user_id) === String(userId)) && String(groups[idx].created_by) !== String(userId)) {
    return errRes('无权限')
  }

  groups[idx] = { ...groups[idx], is_pinned: pinned, updated_at: new Date().toISOString() }
  await env.USERS_KV.put('chat_groups', JSON.stringify(groups))
  return jsonSuccess({ is_pinned: pinned })
}

// PUT /adminapi/chat/groups/:id - 修改群名
async function handleRenameGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }
  const name = (body.name || '').trim()
  if (!name) return errRes('群名不能为空')

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => String(g.id) === String(groupId))
  if (idx < 0) return errRes('群不存在')

  // 非创建者/成员不能操作
  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const members = memberMap[groupId] || []
  if (!members.some(m => String(m.user_id) === String(userId)) && String(groups[idx].created_by) !== String(userId)) {
    return errRes('无权限')
  }

  groups[idx] = { ...groups[idx], name, updated_at: new Date().toISOString() }
  await env.USERS_KV.put('chat_groups', JSON.stringify(groups))

  await logOperation(env, userId, 'chat_rename', `修改群名「${name}」`, { group_id: groupId, group_name: name })

  return jsonSuccess({ name, id: groupId })
}

// DELETE /adminapi/chat/groups/:id - 删除会话
async function handleDeleteGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => String(g.id) === String(groupId))
  if (idx < 0) return errRes('群不存在')

  // 非创建者/成员不能删除
  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  const members = memberMap[groupId] || []
  if (!members.some(m => String(m.user_id) === String(userId)) && String(groups[idx].created_by) !== String(userId)) {
    return errRes('无权限')
  }

  groups.splice(idx, 1)
  delete memberMap[groupId]
  await Promise.all([
    env.USERS_KV.put('chat_groups', JSON.stringify(groups)),
    env.USERS_KV.put('chat_members', JSON.stringify(memberMap)),
    env.USERS_KV.delete(`chat_messages:${groupId}`),
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
    const userId = getUserId(request)
    if (!userId) return errRes('未登录', 401)

    // GET /adminapi/work/plans — list
    if (pathname === '/adminapi/work/plans' && request.method === 'GET') {
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

    try {
      const proxyRes = await fetch(targetUrl2, { method: 'POST', headers: headers2, body: bodyText })
      const resBody = await proxyRes.text()
      const resJson = JSON.parse(resBody)

      // Log operation on success
      if (resJson.code === 1 || resJson.code === 200) {
        const amount = bodyData.amount || '0'
        const remark = bodyData.remark || bodyData.memo || ''
        const actionName = receiptType === 'CollectReceipt'
          ? `快速收款 ¥${amount}${remark ? '（' + remark + '）' : ''}`
          : `快速付款 ¥${amount}${remark ? '（' + remark + '）' : ''}`
        if (userId2) {
          await logOperation(env, userId2, receiptType === 'CollectReceipt' ? 'quick_collect' : 'quick_pay', actionName, { amount, remark, receipt_type: receiptType, ...bodyData })
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

  if (decoded?.trial && !isTrialPassthrough(pathname)) {
    return jsonRes({
      code: 0,
      show: 1,
      message: '体验版暂不支持该功能，请升级正式版后使用',
      data: [],
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
    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })
    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
    return new Response(response.body, { status: response.status, headers: newHeaders })
  } catch {
    return new Response(JSON.stringify({ code: 0, show: 0, message: 'Proxy error', data: [] }), {
      status: 502,
      headers: { 'Content-Type': 'application/json', ...corsHeaders() },
    })
  }
}
