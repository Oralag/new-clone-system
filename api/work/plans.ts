import type { VercelRequest, VercelResponse } from '@vercel/node'

// 内存存储（Vercel serverless 冷启动会清空，仅演示用）
const plans: any[] = []

function jsonRes(data: any, status = 200) {
  return new Response(JSON.stringify({ code: 1, data }), {
    status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

function errRes(msg: string) {
  return new Response(JSON.stringify({ code: 0, message: msg }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function getUserId(req: VercelRequest): number | null {
  const token = (req.headers['token'] as string) || ''
  if (token.startsWith('local_')) {
    try {
      const payload = JSON.parse(Buffer.from(token.slice(6), 'base64').toString())
      return payload.admin_id || payload.userId || null
    } catch { return null }
  }
  return 1 // 简化：未登录也允许写入
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, token, Authorization')
  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  const userId = getUserId(req)
  const path = (req.query.path as string[]) || []
  const planId = path[0] ? Number(path[0]) : null
  const subAction = path[1]

  if (req.method === 'GET') {
    const userPlans = plans.filter(p => !userId || p.creator_id === userId)
    return res.status(200).json({ code: 1, data: { rows: userPlans, total: userPlans.length } })
  }

  if (req.method === 'POST') {
    if (!planId) {
      // 创建
      const { title, description = '', due_date = '', priority = 'normal', mentions = [] } = req.body || {}
      if (!title?.trim()) return res.status(200).json({ code: 0, message: '请填写任务标题' })
      const newPlan = {
        id: Date.now(),
        creator_id: userId || 1,
        title: title.trim(),
        description: description.trim(),
        status: 'todo',
        priority,
        mentions,
        due_date,
        follow_up: { last_remind: null, next_remind: null, remind_count: 0 },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      plans.unshift(newPlan)
      return res.status(201).json({ code: 1, data: { plan: newPlan, message: '创建成功' } })
    }
    if (subAction === 'remind') {
      const plan = plans.find(p => p.id === planId)
      if (!plan) return res.status(200).json({ code: 0, message: '任务不存在' })
      plan.follow_up.last_remind = new Date().toISOString()
      plan.follow_up.remind_count = (plan.follow_up.remind_count || 0) + 1
      return res.status(200).json({ code: 1, data: { plan, message: '提醒已发送' } })
    }
  }

  if (req.method === 'PUT' && planId) {
    const plan = plans.find(p => p.id === planId)
    if (!plan) return res.status(200).json({ code: 0, message: '任务不存在' })
    const { title, description, status, priority, mentions, due_date } = req.body || {}
    if (title !== undefined) plan.title = title
    if (description !== undefined) plan.description = description
    if (status !== undefined) plan.status = status
    if (priority !== undefined) plan.priority = priority
    if (mentions !== undefined) plan.mentions = mentions
    if (due_date !== undefined) plan.due_date = due_date
    plan.updated_at = new Date().toISOString()
    return res.status(200).json({ code: 1, data: { plan, message: '更新成功' } })
  }

  if (req.method === 'DELETE' && planId) {
    const idx = plans.findIndex(p => p.id === planId)
    if (idx === -1) return res.status(200).json({ code: 0, message: '任务不存在' })
    plans.splice(idx, 1)
    return res.status(200).json({ code: 1, data: { success: true, message: '删除成功' } })
  }

  res.status(404).json({ code: 0, message: '未找到' })
}
