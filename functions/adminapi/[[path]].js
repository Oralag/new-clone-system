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
  'ai-assistant-fixed': { name: 'AI助手', position: '智能助手', avatar: '' },
  'captain': { name: 'Captain 总指挥', position: '机器人', avatar: '' },
  'copywriter': { name: '文案Agent', position: '机器人', avatar: '' },
  'poster': { name: '海报Agent', position: '机器人', avatar: '' },
  'video': { name: '视频Agent', position: '机器人', avatar: '' },
  'brand': { name: '品牌Agent', position: '机器人', avatar: '' },
  'trend': { name: '趋势Agent', position: '机器人', avatar: '' },
  'publisher': { name: '发布Agent', position: '机器人', avatar: '' },
  'designer': { name: '平面设计师', position: '机器人', avatar: '' },
  'marketing': { name: '营销顾问', position: '机器人', avatar: '' },
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
])

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

  return jsonSuccess({ ...newGroup, member_ids: allMembers.map(m => m.user_id), unread: 0, last_message: '' })
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
    const info = await getUserInfo(m.user_id, env)
    return { ...m, ...info }
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

  const msgsWithUser = await Promise.all(msgs.map(async m => {
    const info = await getUserInfo(m.sender_id, env)
    return { ...m, sender_name: info.name }
  }))

  if (userId) {
    await env.USERS_KV.put(`chat_unread:${userId}:${groupId}`, '0')
  }

  return jsonSuccess({ rows: msgsWithUser, total: msgsWithUser.length })
}

async function handleSendMessage(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { content, type = 'text' } = body
  if (!content?.trim()) return errRes('消息内容不能为空')

  const userInfo = await getUserInfo(userId, env)
  const now = new Date().toISOString()

  const msg = {
    id: nowMs() + Math.floor(Math.random() * 1000),
    group_id: groupId,
    sender_id: userId,
    sender_name: userInfo.name,
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
    if (mid === userId) continue // 不给自己加未读
    const unreadKey = `chat_unread:${mid}:${groupId}`
    const cur = parseInt(await env.USERS_KV.get(unreadKey) || '0')
    await env.USERS_KV.put(unreadKey, String(cur + 1))
  }

  await logOperation(env, userId, 'chat_message', content, { group_id: groupId, message_id: msg.id })

  return jsonSuccess(msg)
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

  // Extract the target user ID from the path
  const m = request.url.match(/\/members\/(\d+)$/)
  const targetUserId = m ? parseInt(m[1]) : null
  if (!targetUserId) return errRes('缺少用户ID')

  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (!memberMap[groupId]) return errRes('群不存在')

  memberMap[groupId] = memberMap[groupId].filter(m => m.user_id !== targetUserId)
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
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+\/members\/\d+$/) && request.method === 'DELETE') {
      return handleRemoveGroupMember(request, env)
    }

// POST /adminapi/chat/groups/:id/pin - 置顶/取消置顶会话
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
  const memberMap = memberRaw ? JSON.parse(memberMap) : {}
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
  { id: 'copywriter', name: '内容部', role: 'AI 文案' },
  { id: 'poster', name: '发布部', role: 'AI 发布' },
  { id: 'video', name: '视频部', role: 'AI 视频' },
  { id: 'brand', name: '品牌部', role: 'AI 品牌' },
  { id: 'trend', name: '情报部', role: 'AI 情报' },
  { id: 'publisher', name: '发布官', role: 'AI 发布' },
  { id: 'designer', name: '平面设计师', role: 'AI 设计' },
  { id: 'marketing', name: '营销顾问', role: 'AI 营销' },
]

// ───────────────────────────────────────────────
// Router (continued from above)
// ───────────────────────────────────────────────
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
      return handlePinGroup(request, env)
    }
    // PUT /adminapi/chat/groups/:id - 修改群名
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+$/) && request.method === 'PUT') {
      return handleRenameGroup(request, env)
    }
    // DELETE /adminapi/chat/groups/:id - 删除会话
    if (pathname.match(/^\/adminapi\/chat\/groups\/\d+$/) && request.method === 'DELETE') {
      return handleDeleteGroup(request, env)
    }
    // GET /adminapi/chat/contacts - 获取通讯录成员（员工 + Agent）
    if (pathname === '/adminapi/chat/contacts' && request.method === 'GET') {
      return handleGetContacts(request, env)
    }
    // Fallback for unhandled chat paths
    return errRes('聊天功能暂不支持')
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
