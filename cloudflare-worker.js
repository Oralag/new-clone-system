export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    // ── CORS 预检 ──────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      })
    }

    const path = url.pathname

    // ════════════════════════════════════════════════
    // 移动协作 API（全部走 KV 存储，无需后端）
    // ════════════════════════════════════════════════

    // ── 群聊列表 GET /adminapi/chat/groups ──
    if (path === '/adminapi/chat/groups' && request.method === 'GET') {
      return handleChatGroups(request, env)
    }

    // ── 创建群聊 POST /adminapi/chat/groups ──
    if (path === '/adminapi/chat/groups' && request.method === 'POST') {
      return handleCreateGroup(request, env)
    }

    // ── 群详情 GET /adminapi/chat/groups/:id ──
    if (path.startsWith('/adminapi/chat/groups/') && !path.includes('/messages') && !path.includes('/members') && request.method === 'GET') {
      return handleGetGroup(request, env)
    }

    // ── 修改群名 PUT /adminapi/chat/groups/:id ──
    if (path.startsWith('/adminapi/chat/groups/') && !path.includes('/messages') && !path.includes('/members') && request.method === 'PUT') {
      return handleUpdateGroup(request, env)
    }

    // ── 退出群 DELETE /adminapi/chat/groups/:id/members/:uid ──
    if (path.match(/^\/adminapi\/chat\/groups\/\d+\/members\/\d+$/) && request.method === 'DELETE') {
      return handleQuitGroup(request, env)
    }

    // ── 群成员 GET /adminapi/chat/groups/:id/members ──
    if (path.match(/^\/adminapi\/chat\/groups\/\d+\/members$/) && request.method === 'GET') {
      return handleGetMembers(request, env)
    }

    // ── 添加成员 POST /adminapi/chat/groups/:id/members ──
    if (path.match(/^\/adminapi\/chat\/groups\/\d+\/members$/) && request.method === 'POST') {
      return handleAddMember(request, env)
    }

    // ── 消息列表 GET /adminapi/chat/groups/:id/messages ──
    if (path.match(/^\/adminapi\/chat\/groups\/\d+\/messages$/) && request.method === 'GET') {
      return handleGetMessages(request, env)
    }

    // ── 发送消息 POST /adminapi/chat/groups/:id/messages ──
    if (path.match(/^\/adminapi\/chat\/groups\/\d+\/messages$/) && request.method === 'POST') {
      return handleSendMessage(request, env)
    }

    // ── 清理消息 POST /adminapi/chat/groups/:id/cleanup ──
    if (path.match(/^\/adminapi\/chat\/groups\/\d+\/cleanup$/) && request.method === 'POST') {
      return handleCleanupMessages(request, env)
    }

    // ── 操作日志 GET /adminapi/mobile/operation-logs ──
    if (path === '/adminapi/mobile/operation-logs' && request.method === 'GET') {
      return handleOperationLogs(request, env)
    }

    // ── 通知 GET /adminapi/mobile/notifications ──
    if (path === '/adminapi/mobile/notifications' && request.method === 'GET') {
      return handleNotifications(request, env)
    }

    // ── 在线状态 GET /adminapi/mobile/online-status ──
    if (path === '/adminapi/mobile/online-status' && request.method === 'GET') {
      return handleOnlineStatus(request, env)
    }

    // ── AI 解析 POST /adminapi/ai/parse ──
    if (path === '/adminapi/ai/parse' && request.method === 'POST') {
      return handleAIParse(request, env)
    }

    // ── AI 确认录入 POST /adminapi/ai/confirm-order ──
    if (path === '/adminapi/ai/confirm-order' && request.method === 'POST') {
      return handleAIConfirm(request, env)
    }

    // ── 会议列表 GET /adminapi/meeting/recent ──
    if (path === '/adminapi/meeting/recent' && request.method === 'GET') {
      return handleMeetings(request, env)
    }

    // ── 预约会议 POST /adminapi/meeting/schedule ──
    if (path === '/adminapi/meeting/schedule' && request.method === 'POST') {
      return handleScheduleMeeting(request, env)
    }

    // ── 发起会议 POST /adminapi/meeting/create ──
    if (path === '/adminapi/meeting/create' && request.method === 'POST') {
      return handleCreateMeeting(request, env)
    }

    // ── 扫码查库存 GET /adminapi/warehouse/scan ──
    if (path === '/adminapi/warehouse/scan' && request.method === 'GET') {
      return handleScanGoods(request, env)
    }

    // ════════════════════════════════════════════════
    // 工作计划 API（@员工/agent 协作）
    // ════════════════════════════════════════════════

    // GET /adminapi/work/members — 员工 + agent 列表（@选择器用）
    if (path === '/adminapi/work/members' && request.method === 'GET') {
      return handleWorkMembers(request, env)
    }
    // GET /adminapi/work/plans — 任务列表
    if (path === '/adminapi/work/plans' && request.method === 'GET') {
      return handleWorkPlans(request, env)
    }
    // POST /adminapi/work/plans — 创建任务
    if (path === '/adminapi/work/plans' && request.method === 'POST') {
      return handleWorkPlanCreate(request, env)
    }
    // PUT /adminapi/work/plans/:id — 更新任务
    const putMatch = path.match(/^\/adminapi\/work\/plans\/(\d+)$/)
    if (putMatch && request.method === 'PUT') {
      return handleWorkPlanUpdate(request, env, Number(putMatch[1]))
    }
    // DELETE /adminapi/work/plans/:id
    const delMatch = path.match(/^\/adminapi\/work\/plans\/(\d+)$/)
    if (delMatch && request.method === 'DELETE') {
      return handleWorkPlanDelete(request, env, Number(delMatch[1]))
    }
    // POST /adminapi/work/plans/:id/remind — 手动提醒
    const remindMatch = path.match(/^\/adminapi\/work\/plans\/(\d+)\/remind$/)
    if (remindMatch && request.method === 'POST') {
      return handleWorkPlanRemind(request, env, Number(remindMatch[1]))
    }
    // POST /adminapi/work/remind-daily — 秘书agent每日跟进（可定时触发）
    if (path === '/adminapi/work/remind-daily' && request.method === 'POST') {
      return handleWorkRemindDaily(request, env)
    }

    // ════════════════════════════════════════════════
    // 已有 API（保持不变）
    // ════════════════════════════════════════════════

    // AI chat endpoint
    if (path === '/api/ai-chat') {
      return handleAIChat(request, env)
    }

    // Self-hosted register
    if (path === '/adminapi/login/register' && request.method === 'POST') {
      return handleRegister(request, env)
    }

    // Self-hosted login
    if (path === '/adminapi/login/account' && request.method === 'POST') {
      return handleLogin(request, env)
    }

    // Proxy all other requests to saas backend
    const targetUrl = 'https://saas.mzth.cn' + path + url.search
    const headers = new Headers(request.headers)
    headers.set('host', 'saas.mzth.cn')
    headers.delete('origin')
    headers.delete('referer')

    const proxyRequest = new Request(targetUrl, {
      method: request.method,
      headers,
      body: request.method !== 'GET' && request.method !== 'HEAD' ? request.body : null,
    })

    const response = await fetch(proxyRequest)
    const newHeaders = new Headers(response.headers)
    Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
    return new Response(response.body, { status: response.status, headers: newHeaders })
  }
}

// ════════════════════════════════════════════════
// 工具函数
// ════════════════════════════════════════════════

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, token, Authorization',
  }
}

function jsonRes(data, status = 200) {
  return new Response(JSON.stringify({ code: 1, data }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function errRes(msg, code = 0, status = 200) {
  return new Response(JSON.stringify({ code, message: msg, data: [] }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders() },
  })
}

function nowMs() { return Date.now() }

function extractGroupId(path) {
  const m = path.match(/\/adminapi\/chat\/groups\/(\d+)/)
  return m ? parseInt(m[1]) : null
}

function extractUserId(request) {
  return request.headers.get('x-user-id') ? parseInt(request.headers.get('x-user-id')) : null
}

function getUserId(request) {
  // Priority 1: explicit x-user-id header (mobile clients can set this)
  const headerId = request.headers.get('x-user-id')
  if (headerId) return parseInt(headerId)

  // Get token — try 'token' header first, then 'Authorization' header
  let token = request.headers.get('token')
  if (!token) {
    const auth = request.headers.get('Authorization') || ''
    token = auth.replace(/^Bearer\s+/i, '').trim()
  }
  if (!token) return null

  // Local registered user: base64-encoded JSON (starts with 'local_')
  if (token.startsWith('local_')) {
    try {
      const payload = JSON.parse(atob(token.slice(6)))
      return payload.admin_id || payload.userId || payload.id
    } catch { return null }
  }

  // SaaS JWT token: decode payload without verification (only for extracting user_id)
  try {
    const parts = token.split('.')
    if (parts.length === 3) {
      // JWT uses URL-safe base64
      const raw = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const padded = raw + '='.repeat((4 - raw.length % 4) % 4)
      const payload = JSON.parse(atob(padded))
      return payload.admin_id || payload.user_id || payload.id || null
    }
  } catch (e) {
    // JWT decode failed — try as plain JSON
    try {
      const payload = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')))
      return payload.admin_id || payload.user_id || payload.id || null
    } catch {}
  }

  return null
}

async function getUserInfo(userId, env) {
  if (!userId) return { name: '未知用户', position: '成员' }
  const raw = await env.USERS_KV.get(`user_info:${userId}`)
  if (raw) return JSON.parse(raw)
  // Fetch from saas backend
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

// ════════════════════════════════════════════════
// 群聊 API
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

  // 获取用户所属群
  const userGroups = groups.filter(g => {
    const members = memberMap[g.id] || []
    return members.some(m => m.user_id === userId) || g.created_by === userId
  }).slice((page - 1) * listRows, page * listRows)

  const msgRaw = await env.USERS_KV.get('chat_messages')
  const msgMap = msgRaw ? JSON.parse(msgRaw) : {}

  const result = await Promise.all(userGroups.map(async g => {
    const msgs = (msgMap[g.id] || []).slice(-1)
    const lastMsg = msgs[0] || null
    const unreadRaw = await env.USERS_KV.get(`chat_unread:${userId}:${g.id}`)
    return {
      ...g,
      last_message: lastMsg?.content || '',
      last_message_at: lastMsg?.created_at || g.created_at,
      unread: unreadRaw ? parseInt(unreadRaw) : 0,
    }
  }))

  return jsonRes({ rows: result, total: userGroups.length })
}

async function handleCreateGroup(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { name, member_ids = [] } = body
  if (!name?.trim()) return errRes('请输入群名称')

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

  // 保存成员
  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  memberMap[newId] = allMembers.map(id => ({ user_id: id }))

  await Promise.all([
    env.USERS_KV.put('chat_groups', JSON.stringify(groups)),
    env.USERS_KV.put('chat_members', JSON.stringify(memberMap)),
  ])

  // 记录操作日志
  await logOperation(env, userId, 'chat_create', `创建群聊「${name}」`, { group_id: newId, group_name: name })

  return jsonRes({ ...newGroup, unread: 0, last_message: '' })
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

  // 获取成员详情
  const membersWithInfo = await Promise.all(members.map(async m => {
    const info = await getUserInfo(m.user_id, env)
    return { ...m, ...info }
  }))

  return jsonRes({ ...group, members: membersWithInfo })
}

async function handleUpdateGroup(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const raw = await env.USERS_KV.get('chat_groups')
  const groups = raw ? JSON.parse(raw) : []
  const idx = groups.findIndex(g => g.id === groupId)
  if (idx === -1) return errRes('群不存在')

  if (body.name) groups[idx].name = body.name.trim()
  groups[idx].updated_at = new Date().toISOString()

  await env.USERS_KV.put('chat_groups', JSON.stringify(groups))
  return jsonRes(groups[idx])
}

async function handleQuitGroup(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const parts = request.url.split('/')
  const groupId = parseInt(parts[parts.length - 2])
  const targetUid = parseInt(parts[parts.length - 1])

  if (targetUid !== userId) return errRes('无权操作')

  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (memberMap[groupId]) {
    memberMap[groupId] = memberMap[groupId].filter(m => m.user_id !== userId)
    await env.USERS_KV.put('chat_members', JSON.stringify(memberMap))
  }

  return jsonRes({ success: true })
}

async function handleGetMembers(request, env) {
  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  const memberRaw = await env.USERS_KV.get('chat_members')
  const members = memberRaw ? JSON.parse(memberRaw)[groupId] || [] : []

  const membersWithInfo = await Promise.all(members.map(async m => {
    const info = await getUserInfo(m.user_id, env)
    return { ...m, ...info }
  }))

  return jsonRes({ rows: membersWithInfo, total: members.length })
}

async function handleAddMember(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const groupId = extractGroupId(request.url)
  if (!groupId) return errRes('群不存在')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const memberRaw = await env.USERS_KV.get('chat_members')
  const memberMap = memberRaw ? JSON.parse(memberRaw) : {}
  if (!memberMap[groupId]) memberMap[groupId] = []

  const newId = body.user_id
  if (!memberMap[groupId].some(m => m.user_id === newId)) {
    memberMap[groupId].push({ user_id: newId })
    await env.USERS_KV.put('chat_members', JSON.stringify(memberMap))
  }

  const info = await getUserInfo(newId, env)
  await logOperation(env, userId, 'chat_add_member', `添加成员「${info.name}」入群`, { group_id: groupId })

  return jsonRes({ ...info, user_id: newId })
}

// ════════════════════════════════════════════════
// 消息 API
// ════════════════════════════════════════════════

async function handleGetMessages(request, env) {
  const userId = getUserId(request)
  const url = new URL(request.url)
  const groupId = extractGroupId(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '50')
  const page = parseInt(url.searchParams.get('page') || '1')
  const beforeId = url.searchParams.get('before_id')
  const afterId = url.searchParams.get('after_id')

  if (!groupId) return errRes('群不存在')

  const raw = await env.USERS_KV.get('chat_messages')
  const msgMap = raw ? JSON.parse(raw) : {}
  let msgs = msgMap[groupId] || []

  if (beforeId) {
    msgs = msgs.filter(m => m.id < parseInt(beforeId)).slice(-listRows)
  } else if (afterId) {
    msgs = msgs.filter(m => m.id > parseInt(afterId))
  } else {
    msgs = msgs.slice(-listRows)
  }

  // 填充发送者信息
  const msgsWithUser = await Promise.all(msgs.map(async m => {
    const info = await getUserInfo(m.sender_id, env)
    return { ...m, sender_name: info.name }
  }))

  // 清未读
  if (userId) {
    await env.USERS_KV.put(`chat_unread:${userId}:${groupId}`, '0')
  }

  return jsonRes({ rows: msgsWithUser, total: msgsWithUser.length })
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

  // 最多保留 2000 条
  if (msgMap[groupId].length > 2000) {
    msgMap[groupId] = msgMap[groupId].slice(-2000)
  }

  await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap))

  // 更新群的最后消息
  const groupsRaw = await env.USERS_KV.get('chat_groups')
  const groups = groupsRaw ? JSON.parse(groupsRaw) : []
  const gIdx = groups.findIndex(g => g.id === groupId)
  if (gIdx !== -1) {
    groups[gIdx].last_message_at = now
    await env.USERS_KV.put('chat_groups', JSON.stringify(groups))
  }

  // 记录操作日志
  await logOperation(env, userId, 'chat_message', content, { group_id: groupId, message_id: msg.id })

  // 如果是 AI 触发指令，尝试 AI 解析
  if (content.startsWith('@管家 ') || content.startsWith('@ai ')) {
    setTimeout(() => aiParseAndReply(env, groupId, content, userInfo), 100)
  }

  return jsonRes(msg)
}

async function handleCleanupMessages(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  const groupId = extractGroupId(request.url)
  const body = await request.json().catch(() => ({}))
  const days = parseInt(body.days || '180')

  const cutoff = nowMs() - days * 24 * 3600 * 1000

  const raw = await env.USERS_KV.get('chat_messages')
  const msgMap = raw ? JSON.parse(raw) : {}
  if (msgMap[groupId]) {
    msgMap[groupId] = msgMap[groupId].filter(m => new Date(m.created_at).getTime() > cutoff)
    await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap))
  }

  await logOperation(env, userId, 'chat_cleanup', `清理 ${days} 天前消息`, { group_id: groupId })
  return jsonRes({ success: true })
}

// ════════════════════════════════════════════════
// 操作日志 API
// ════════════════════════════════════════════════

async function logOperation(env, userId, actionType, actionName, extra = {}) {
  const raw = await env.USERS_KV.get('operation_logs')
  const logs = raw ? JSON.parse(raw) : []
  const userInfo = await getUserInfo(userId, env)

  logs.push({
    id: nowMs() + Math.floor(Math.random() * 1000),
    user_id: userId,
    user_name: userInfo.name,
    action_type: actionType,
    action_name: actionName,
    detail: extra,
    created_at: new Date().toISOString(),
  })

  if (logs.length > 5000) logs.splice(0, logs.length - 5000)
  await env.USERS_KV.put('operation_logs', JSON.stringify(logs))
}

async function handleOperationLogs(request, env) {
  const url = new URL(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '30')
  const page = parseInt(url.searchParams.get('page') || '1')
  const userIdFilter = url.searchParams.get('user_id') ? parseInt(url.searchParams.get('user_id')) : null
  const scope = url.searchParams.get('scope')
  const fromDate = url.searchParams.get('from_date')

  const raw = await env.USERS_KV.get('operation_logs')
  let logs = raw ? JSON.parse(raw) : []

  // 过滤
  if (userIdFilter) logs = logs.filter(l => l.user_id === userIdFilter)
  if (fromDate) {
    const cutoff = new Date(fromDate).getTime()
    logs = logs.filter(l => new Date(l.created_at).getTime() >= cutoff)
  }

  // 最新在前
  logs.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

  const total = logs.length
  const rows = logs.slice((page - 1) * listRows, page * listRows)

  return jsonRes({ rows, total, page, list_rows: listRows })
}

// ════════════════════════════════════════════════
// 通知 API
// ════════════════════════════════════════════════

async function handleNotifications(request, env) {
  const userId = getUserId(request)
  const url = new URL(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '20')

  const raw = await env.USERS_KV.get(`notifications:${userId}`)
  let notifs = raw ? JSON.parse(raw) : []

  // 也从操作日志生成通知
  const logRaw = await env.USERS_KV.get('operation_logs')
  const logs = logRaw ? JSON.parse(logRaw) : []

  const generatedNotifs = []
  for (const log of logs.slice(0, 50)) {
    if (log.user_id === userId) continue
    const info = await getUserInfo(log.user_id, env)
    if (log.action_type === 'chat_message') {
      generatedNotifs.push({
        id: log.id,
        type: 'chat',
        title: `${info.name} 在群里发消息`,
        text: log.action_name.slice(0, 60),
        icon: '💬',
        iconBg: '#eff6ff',
        read: false,
        route: `/mobile/chat/${log.detail?.group_id}`,
        created_at: log.created_at,
      })
    }
  }

  notifs = [...generatedNotifs, ...notifs].slice(0, listRows)
  return jsonRes({ rows: notifs, total: notifs.length })
}

// ════════════════════════════════════════════════
// 在线状态 API
// ════════════════════════════════════════════════

async function handleOnlineStatus(request, env) {
  // 简化版：返回最近 30 分钟内有活动的用户
  const raw = await env.USERS_KV.get('operation_logs')
  const logs = raw ? JSON.parse(raw) : []
  const cutoff = nowMs() - 30 * 60 * 1000
  const recentLogs = logs.filter(l => new Date(l.created_at).getTime() > cutoff)
  const onlineIds = [...new Set(recentLogs.map(l => l.user_id))]
  return jsonRes(onlineIds.map(id => ({ user_id: id })))
}

// ════════════════════════════════════════════════
// AI 解析 API
// ════════════════════════════════════════════════

async function handleAIParse(request, env) {
  if (request.method !== 'POST') return errRes('Method not allowed')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { message, user_id } = body
  if (!message?.trim()) return errRes('消息内容为空')

  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) return jsonRes({ type: 'chat', response: 'AI 服务未配置，请联系管理员', confidence: 1 })

  const systemPrompt = `你是一个企业 ERP 业务助手。用户会发送自然语言描述的业务操作，你需要解析并提取结构化信息。

请用 JSON 格式回复，字段说明：
- type: 业务类型（sale-销售出库, procure-采购入库, warehouse_in-其他入库, warehouse_out-其他出库, stock_query-库存查询, customer_query-客户查询, task-任务安排, chat-普通闲聊）
- confidence: 置信度 0-1
- parsed: 解析结果对象（仅 type 不是 chat 时需要）
  - type: 同上
  - params: 具体参数
    - customer_name: 客户名称（销售时）
    - supplier_name: 供应商名称（采购时）
    - goods_name: 商品名称
    - quantity: 数量（数字）
    - unit: 单位（默认"箱"）
    - amount: 金额（数字）
    - assignee: 负责人
    - title: 任务标题（任务时）
    - due_date: 截止日期
  - raw_text: 原始文本

回复示例（仅 JSON，不要其他内容）：
{"type":"sale","confidence":0.92,"parsed":{"type":"sale","params":{"customer_name":"老王","goods_name":"奶茶","quantity":5,"unit":"箱","amount":200}}}

如果用户只是在聊天（非业务指令），回复：
{"type":"chat","confidence":1,"response":"好的，有什么可以帮您的？"}
`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'messages-2023-12-15',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: message }],
      }),
    })

    const data = await res.json()
    const text = data?.content?.[0]?.text || ''

    // 提取 JSON
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        return jsonRes(parsed)
      } catch {}
    }
    return jsonRes({ type: 'chat', response: text, confidence: 1 })
  } catch (e) {
    return jsonRes({ type: 'chat', response: `抱歉，AI 解析失败：${e.message}`, confidence: 0 })
  }
}

async function handleAIConfirm(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { parsed, source = 'ai_bot', group_id } = body
  if (!parsed) return errRes('缺少解析数据')

  const userInfo = await getUserInfo(userId, env)

  // 根据类型生成不同的操作日志
  const typeLabels = {
    sale: '销售出库',
    procure: '采购入库',
    stock_query: '库存查询',
    customer_query: '客户查询',
    task: '任务',
  }

  const label = typeLabels[parsed.type] || 'AI录入'
  const params = parsed.params || {}

  // 记录为待审核的 AI 录入
  await logOperation(env, userId, 'ai_input', `AI录入 ${label}（待审核）`, {
    source: 'ai',
    parsed_type: parsed.type,
    params,
    status: 'pending_review',
  })

  // 如果有群聊，发送确认消息
  if (group_id) {
    const msgMapRaw = await env.USERS_KV.get('chat_messages')
    const msgMap = msgMapRaw ? JSON.parse(msgMapRaw) : {}
    if (!msgMap[group_id]) msgMap[group_id] = []

    msgMap[group_id].push({
      id: nowMs(),
      group_id,
      sender_id: 0,
      sender_name: '🦢 管家',
      type: 'ai_reply',
      content: `✅ 已录入系统，等待管理员审核后生效。\n\n📋 ${label}\n商品：${params.goods_name || '-'}\n数量：${params.quantity || '-'} ${params.unit || '箱'}\n${params.amount ? `金额：¥${params.amount}` : ''}`,
      metadata: { parsed, confidence: parsed.confidence || 0.85, confirmed: true },
      created_at: new Date().toISOString(),
    })
    await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap))
  }

  return jsonRes({ success: true, message: '已录入，等待审核' })
}

// ════════════════════════════════════════════════
// 会议 API
// ════════════════════════════════════════════════

async function handleMeetings(request, env) {
  const url = new URL(request.url)
  const listRows = parseInt(url.searchParams.get('list_rows') || '20')

  const raw = await env.USERS_KV.get('meetings')
  const meetings = raw ? JSON.parse(raw) : []

  const now = nowMs()
  const activeMeetings = meetings.filter(m => m.status === 'active')
  const upcomingMeetings = meetings.filter(m => m.status === 'scheduled' && new Date(m.scheduled_at).getTime() > now)
  const endedMeetings = meetings.filter(m => m.status === 'ended' || (m.status === 'scheduled' && new Date(m.scheduled_at).getTime() <= now))

  const result = [...activeMeetings, ...upcomingMeetings, ...endedMeetings].slice(0, listRows)
  return jsonRes({ rows: result, total: meetings.length })
}

async function handleScheduleMeeting(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { title, scheduled_at, duration_minutes = 60, participants = [], agenda } = body
  if (!title?.trim()) return errRes('请输入会议名称')
  if (!scheduled_at) return errRes('请选择开始时间')

  const userInfo = await getUserInfo(userId, env)
  const meetingId = nowMs()

  const meeting = {
    id: meetingId,
    title: title.trim(),
    scheduled_at,
    duration_minutes,
    participant_count: participants.length,
    host_id: userId,
    host_name: userInfo.name,
    participants,
    agenda: agenda || '',
    status: 'scheduled',
    created_at: new Date().toISOString(),
  }

  const raw = await env.USERS_KV.get('meetings')
  const meetings = raw ? JSON.parse(raw) : []
  meetings.push(meeting)
  await env.USERS_KV.put('meetings', JSON.stringify(meetings))

  await logOperation(env, userId, 'meeting_schedule', `预约会议「${title}」`, { meeting_id: meetingId })

  return jsonRes(meeting)
}

async function handleCreateMeeting(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('请先登录')

  let body
  try { body = await request.json() } catch { return errRes('请求格式错误') }

  const { title = '即时会议', participants = [] } = body
  const userInfo = await getUserInfo(userId, env)

  const meeting = {
    id: nowMs(),
    title: title.trim(),
    scheduled_at: new Date().toISOString(),
    duration_minutes: 60,
    participant_count: participants.length,
    host_id: userId,
    host_name: userInfo.name,
    participants,
    status: 'active',
    created_at: new Date().toISOString(),
  }

  const raw = await env.USERS_KV.get('meetings')
  const meetings = raw ? JSON.parse(raw) : []
  meetings.push(meeting)
  await env.USERS_KV.put('meetings', JSON.stringify(meetings))

  return jsonRes(meeting)
}

// ════════════════════════════════════════════════
// 扫码查库存（代理到 SaaS 后端）
// ════════════════════════════════════════════════

async function handleScanGoods(request, env) {
  const url = new URL(request.url)
  const barcode = url.searchParams.get('barcode')
  if (!barcode) return errRes('请提供 barcode 参数')

  const targetUrl = `https://saas.mzth.cn/adminapi/goods/Info/index?goods_sn=${encodeURIComponent(barcode)}`
  const headers = new Headers()
  headers.set('Content-Type', 'application/json')
  headers.set('host', 'saas.mzth.cn')

  const response = await fetch(targetUrl, { headers })
  const data = await response.json()

  if (data?.data?.rows?.[0]) {
    const goods = data.data.rows[0]
    return jsonRes({
      goods_name: goods.goods_name || goods.name,
      barcode: barcode,
      stock: goods.stock || goods.nums || 0,
      unit: goods.unit || '箱',
      price: goods.price || goods.sales_price || 0,
      warning: (goods.stock || goods.nums || 0) < (goods.warning_line || 10) ? '库存低于预警线' : null,
    })
  }

  return jsonRes({ goods_name: '未知商品', barcode, stock: 0, unit: '箱', price: 0, warning: '商品未找到' })
}

// ════════════════════════════════════════════════
// AI 自动解析并回复（后台触发）
// ════════════════════════════════════════════════

async function aiParseAndReply(env, groupId, content, userInfo) {
  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) return

  const systemPrompt = `你是一个企业 ERP 业务助手。用户用自然语言描述业务操作，你需要解析并返回结构化 JSON。

回复格式（仅 JSON）：
{"type":"sale","confidence":0.9,"parsed":{"type":"sale","params":{"customer_name":"老王","goods_name":"奶茶","quantity":5,"unit":"箱","amount":200}}}

如果只是闲聊：
{"type":"chat","confidence":1,"response":"好的，有什么需要帮忙的？"}
`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-20250514',
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: 'user', content }],
      }),
    })

    const data = await res.json()
    const text = data?.content?.[0]?.text || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0])
        const params = parsed.parsed?.params || {}

        if (parsed.type !== 'chat' && parsed.confidence > 0.6) {
          // AI 识别为业务指令，发送确认卡片
          const msgMapRaw = await env.USERS_KV.get('chat_messages')
          const msgMap = msgMapRaw ? JSON.parse(msgMapRaw) : {}
          if (!msgMap[groupId]) msgMap[groupId] = []

          const typeLabels = { sale: '📦 销售出库单', procure: '🛒 采购入库单', task: '📋 任务' }
          const typeLabel = typeLabels[parsed.type] || '业务录入'

          let detailText = ''
          if (params.goods_name) detailText += `商品：${params.goods_name}\n`
          if (params.quantity) detailText += `数量：${params.quantity} ${params.unit || '箱'}\n`
          if (params.customer_name) detailText += `客户：${params.customer_name}\n`
          if (params.supplier_name) detailText += `供应商：${params.supplier_name}\n`
          if (params.amount) detailText += `金额：¥${params.amount}\n`
          if (params.assignee) detailText += `负责人：${params.assignee}\n`

          msgMap[groupId].push({
            id: nowMs() + 1,
            group_id: groupId,
            sender_id: 0,
            sender_name: '🦢 管家',
            type: 'ai_reply',
            content: `我理解您想要录入一条 ${typeLabel}，请确认以下信息是否正确：\n\n${detailText}\n✅ 点击「确认录入」我将提交到系统等待审核，或点击「修改」更正信息。`,
            metadata: parsed,
            created_at: new Date().toISOString(),
          })

          await env.USERS_KV.put('chat_messages', JSON.stringify(msgMap))
        }
      } catch {}
    }
  } catch {}
}

// ════════════════════════════════════════════════
// 已有函数（保持不变）
// ════════════════════════════════════════════════

function makeToken(account) {
  const payload = btoa(JSON.stringify({ account, t: Date.now() }))
  return `local_${payload}`
}

async function handleRegister(request, env) {
  let body
  try { body = await request.json() } catch { return jsonRes({ code: 0, message: '请求格式错误', data: [] }) }

  const { company_name, mobile, password } = body
  if (!company_name) return jsonRes({ code: 0, message: '请输入公司名称', data: [] })
  if (!mobile || !/^1[3-9]\d{9}$/.test(mobile)) return jsonRes({ code: 0, message: '请输入有效手机号', data: [] })
  if (!password || password.length < 6) return jsonRes({ code: 0, message: '密码至少6位', data: [] })

  const kv = env.USERS_KV
  if (kv) {
    const existing = await kv.get(`user:${mobile}`)
    if (existing) return jsonRes({ code: 0, message: '该手机号已注册', data: [] })
    const user = { company_name, mobile, password, created_at: Date.now(), admin_id: Date.now() }
    await kv.put(`user:${mobile}`, JSON.stringify(user))
  }

  return jsonRes({ code: 1, message: '注册成功', data: {} })
}

async function handleLogin(request, env) {
  let body
  try { body = await request.json() } catch { body = {} }

  const { account, password } = body
  const kv = env.USERS_KV

  if (kv && account && password) {
    const raw = await kv.get(`user:${account}`)
    if (raw) {
      const user = JSON.parse(raw)
      if (user.password === password) {
        const token = makeToken(account)
        await kv.put(`token:${token}`, JSON.stringify({ account, company_name: user.company_name, admin_id: user.admin_id }), { expirationTtl: 2592000 })
        return jsonRes({
          code: 1, message: '',
          data: {
            token,
            name: user.company_name,
            avatar: '',
            role_name: '企业用户',
            userInfo: { admin_id: user.admin_id, name: user.company_name, account, role_name: '企业用户', token },
          }
        })
      }
    }
  }

  const targetUrl = 'https://saas.mzth.cn/adminapi/login/account'
  const headers = new Headers({ 'Content-Type': 'application/json', 'host': 'saas.mzth.cn' })
  const response = await fetch(new Request(targetUrl, { method: 'POST', headers, body: JSON.stringify(body) }))
  const data = await response.json()
  const newHeaders = new Headers({ 'Content-Type': 'application/json' })
  Object.entries(corsHeaders()).forEach(([k, v]) => newHeaders.set(k, v))
  return new Response(JSON.stringify(data), { status: response.status, headers: newHeaders })
}

async function handleAIChat(request, env) {
  if (request.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  const apiKey = env.ANTHROPIC_API_KEY
  if (!apiKey) {
    return new Response(`data: ${JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' })}\n\ndata: [DONE]\n\n`,
      { headers: { 'Content-Type': 'text/event-stream', ...corsHeaders() } })
  }

  const { messages, systemPrompt } = await request.json()

  const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'messages-2023-12-15',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      stream: true,
      system: systemPrompt,
      messages,
    }),
  })

  const { readable, writable } = new TransformStream()
  const writer = writable.getWriter()
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  ;(async () => {
    const reader = anthropicRes.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') continue
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
              await writer.write(encoder.encode(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`))
            }
          } catch {}
        }
      }
    } finally {
      await writer.write(encoder.encode('data: [DONE]\n\n'))
      await writer.close()
    }
  })()

  return new Response(readable, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', ...corsHeaders() },
  })
}

// ════════════════════════════════════════════════════════════
// 工作计划 — 成员列表（员工 + agent，给 @ 选择器用）
// ════════════════════════════════════════════════════════════
async function handleWorkMembers(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('未登录', 401)

  // 固定 agent 列表（系统内置）
  const agents = [
    { id: 'agent_content', name: '内容部', type: 'agent', avatar: '📝', dept: 'agent' },
    { id: 'agent_creative', name: '创意部', type: 'agent', avatar: '🎨', dept: 'agent' },
    { id: 'agent_brand', name: '品牌部', type: 'agent', avatar: '✨', dept: 'agent' },
    { id: 'agent_secretary', name: '秘书', type: 'agent', avatar: '🤖', dept: 'agent' },
    { id: 'agent_ai', name: 'AI助手', type: 'agent', avatar: '🧠', dept: 'agent' },
  ]

  // 从 KV 读取员工账号（register 接口写进去的）
  const staffRaw = await env.USERS_KV.get('registered_users')
  const staffList = staffRaw ? JSON.parse(staffRaw) : []

  const members = [
    ...agents,
    ...staffList.map(s => ({
      id: String(s.id || s.userId),
      name: s.account || s.name || '未知',
      type: 'staff',
      avatar: '👤',
      dept: s.dept || '',
    })),
  ]

  return jsonRes({ members, total: members.length })
}

// ════════════════════════════════════════════════════════════
// 工作计划 — 列表 / 创建
// ════════════════════════════════════════════════════════════
async function handleWorkPlans(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('未登录', 401)

  const url = new URL(request.url)
  const status = url.searchParams.get('status') || ''   // todo | doing | done
  const assigned = url.searchParams.get('assigned')     // 'me' | ''

  const raw = await env.USERS_KV.get('work_plans')
  let plans = raw ? JSON.parse(raw) : []

  // 过滤：只看被 @ 的人是自己，或自己创建的
  if (assigned === 'me') {
    plans = plans.filter(p =>
      p.creator_id === userId || (p.mentions || []).some(m => m.id === String(userId))
    )
  }
  if (status) {
    plans = plans.filter(p => p.status === status)
  }

  // 按创建时间倒序
  plans.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))

  return jsonRes({ plans, total: plans.length })
}

async function handleWorkPlanCreate(request, env) {
  const userId = getUserId(request)
  if (!userId) return errRes('未登录', 401)

  const body = await request.json()
  const { title, description, mentions = [], due_date } = body

  if (!title?.trim()) return errRes('请填写任务标题')

  const now = new Date().toISOString()
  const plansRaw = await env.USERS_KV.get('work_plans')
  const plans = plansRaw ? JSON.parse(plansRaw) : []

  const newPlan = {
    id: Date.now(),
    creator_id: userId,
    title: title.trim(),
    description: description?.trim() || '',
    status: 'todo',           // todo | doing | done
    mentions,                  // [{ id, name, type, avatar }]
    due_date: due_date || '',
    follow_up: {
      last_remind: null,
      next_remind: null,
      remind_count: 0,
    },
    created_at: now,
    updated_at: now,
  }

  plans.unshift(newPlan)
  await env.USERS_KV.put('work_plans', JSON.stringify(plans))

  return jsonRes({ plan: newPlan, message: '创建成功' }, 201)
}

// ════════════════════════════════════════════════════════════
// 工作计划 — 更新（状态 / 跟进记录）
// ════════════════════════════════════════════════════════════
async function handleWorkPlanUpdate(request, env, planId) {
  const userId = getUserId(request)
  if (!userId) return errRes('未登录', 401)

  const body = await request.json()
  const plansRaw = await env.USERS_KV.get('work_plans')
  const plans = plansRaw ? JSON.parse(plansRaw) : []
  const idx = plans.findIndex(p => p.id === planId)

  if (idx === -1) return errRes('任务不存在', 404)

  const plan = plans[idx]

  // 允许更新的字段
  if (body.title !== undefined) plan.title = body.title.trim()
  if (body.description !== undefined) plan.description = body.description?.trim() || ''
  if (body.status !== undefined) plan.status = body.status
  if (body.mentions !== undefined) plan.mentions = body.mentions
  if (body.due_date !== undefined) plan.due_date = body.due_date
  if (body.follow_up !== undefined) plan.follow_up = { ...plan.follow_up, ...body.follow_up }
  plan.updated_at = new Date().toISOString()

  plans[idx] = plan
  await env.USERS_KV.put('work_plans', JSON.stringify(plans))

  return jsonRes({ plan })
}

// ════════════════════════════════════════════════════════════
// 工作计划 — 删除
// ════════════════════════════════════════════════════════════
async function handleWorkPlanDelete(request, env, planId) {
  const userId = getUserId(request)
  if (!userId) return errRes('未登录', 401)

  const plansRaw = await env.USERS_KV.get('work_plans')
  const plans = plansRaw ? JSON.parse(plansRaw) : []
  const idx = plans.findIndex(p => p.id === planId)

  if (idx === -1) return errRes('任务不存在', 404)
  if (plans[idx].creator_id !== userId) return errRes('无权限删除', 403)

  plans.splice(idx, 1)
  await env.USERS_KV.put('work_plans', JSON.stringify(plans))

  return jsonRes({ message: '删除成功' })
}

// ════════════════════════════════════════════════════════════
// 工作计划 — 手动提醒
// ════════════════════════════════════════════════════════════
async function handleWorkPlanRemind(request, env, planId) {
  const userId = getUserId(request)
  if (!userId) return errRes('未登录', 401)

  const plansRaw = await env.USERS_KV.get('work_plans')
  const plans = plansRaw ? JSON.parse(plansRaw) : []
  const plan = plans.find(p => p.id === planId)
  if (!plan) return errRes('任务不存在', 404)

  const now = new Date().toISOString()
  plan.follow_up = {
    ...plan.follow_up,
    last_remind: now,
    remind_count: (plan.follow_up?.remind_count || 0) + 1,
  }
  plan.updated_at = now

  const idx = plans.findIndex(p => p.id === planId)
  plans[idx] = plan
  await env.USERS_KV.put('work_plans', JSON.stringify(plans))

  // 生成提醒消息内容
  const mentioned = plan.mentions?.map(m => m.name).join('、') || '未知'
  const remindMsg = `📋 任务提醒：${plan.title}\n👥 执行人：${mentioned}\n⏰ 时间：${plan.due_date || '未设置'}\n💬 请及时跟进！`

  return jsonRes({
    plan,
    remind_message: remindMsg,
    message: '提醒已发送',
  })
}

// ════════════════════════════════════════════════════════════
// 秘书agent — 每日跟进（定时触发）
// 遍历所有未完成任务，向被 @ 的人发送消息提醒
// ════════════════════════════════════════════════════════════
async function handleWorkRemindDaily(request, env) {
  // 验证调用来源（可用 secret header 防刷）
  const secret = request.headers.get('x-remind-secret')
  if (secret !== env.REMINDSECRET) return errRes('无权限', 403)

  const plansRaw = await env.USERS_KV.get('work_plans')
  const plans = plansRaw ? JSON.parse(plansRaw) : []

  // 过滤：未完成 且 未在当天提醒过的
  const today = new Date().toISOString().slice(0, 10)
  const pending = plans.filter(p => {
    if (p.status === 'done') return false
    if (!p.follow_up?.last_remind) return true
    return !p.follow_up.last_remind.startsWith(today)
  })

  const results = []
  for (const plan of pending) {
    const now = new Date().toISOString()
    plan.follow_up = {
      ...plan.follow_up,
      last_remind: now,
      remind_count: (plan.follow_up?.remind_count || 0) + 1,
    }
    plan.updated_at = now

    const mentioned = plan.mentions?.map(m => m.name).join('、') || ''
    results.push({
      plan_id: plan.id,
      title: plan.title,
      mentions: plan.mentions,
      message: `📋【每日跟进】${plan.title}${mentioned ? `\n👥 @${mentioned}` : ''}${plan.due_date ? `\n⏰ 截止：${plan.due_date}` : ''}`,
    })
  }

  if (plansRaw) {
    const allPlans = JSON.parse(plansRaw)
    for (const p of pending) {
      const idx = allPlans.findIndex(ap => ap.id === p.id)
      if (idx !== -1) allPlans[idx] = p
    }
    await env.USERS_KV.put('work_plans', JSON.stringify(allPlans))
  }

  return jsonRes({
    message: `今日跟进完成，共处理 ${pending.length} 条任务`,
    tasks: results,
  })
}
