// /api/scheduled-tasks — 定时任务 CRUD（Captain 创建，触发器页面管理，cron 执行）
// GET: 当前用户的任务列表
// POST: { action: 'create'|'toggle'|'delete', task?/id? }
// 存储：AGENT_MEMORY `sched:tasks:{userKey}`；用户索引 `sched:userkeys`

import { getUserKey } from '../utils/userKey'
import { verifyErpToken } from '../utils/verifyErpToken'

interface Env {
  AGENT_MEMORY: KVNamespace
}

export interface SchedTask {
  id: string
  instruction: string        // 给广告部门的任务指令，如"准备当天的3条短视频内容"
  time: string               // 'HH:MM' 北京时间
  repeat: 'daily' | 'once'
  count: number              // 生成内容条数
  genVideo: boolean          // 是否自动提交即梦视频（消耗额度）
  enabled: boolean
  lastRunDate: string        // 'YYYY-MM-DD'（北京时间）
  lastRunResult: string
  createdAt: number
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

const TASKS_KEY = (userKey: string) => `sched:tasks:${userKey}`
const INDEX_KEY = 'sched:userkeys'

export async function registerUserKey(kv: KVNamespace, userKey: string) {
  const keys = (await kv.get(INDEX_KEY, 'json')) as string[] || []
  if (!keys.includes(userKey)) {
    keys.push(userKey)
    await kv.put(INDEX_KEY, JSON.stringify(keys))
  }
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: CORS })

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const token = request.headers.get('x-erp-token') || ''
  if (!token) return Response.json({ code: 0, tasks: [] }, { status: 401, headers: CORS })
  const tasks = (await env.AGENT_MEMORY.get(TASKS_KEY(getUserKey(token)), 'json')) as SchedTask[] || []
  return Response.json({ code: 1, tasks }, { headers: CORS })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await verifyErpToken(request, env))) {
    return Response.json({ code: 0, message: '未授权' }, { status: 401, headers: CORS })
  }
  const token = request.headers.get('x-erp-token') || ''
  const userKey = getUserKey(token)
  const body = await request.json() as any
  const key = TASKS_KEY(userKey)
  let tasks = (await env.AGENT_MEMORY.get(key, 'json')) as SchedTask[] || []

  if (body.action === 'create') {
    const t = body.task || {}
    if (!t.instruction || !/^\d{2}:\d{2}$/.test(t.time || '')) {
      return Response.json({ code: 0, message: '需要 instruction 和 time(HH:MM)' }, { status: 400, headers: CORS })
    }
    const task: SchedTask = {
      id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      instruction: String(t.instruction).slice(0, 500),
      time: t.time,
      repeat: t.repeat === 'once' ? 'once' : 'daily',
      count: Math.min(Math.max(Number(t.count) || 3, 1), 10),
      genVideo: !!t.genVideo,
      enabled: true,
      lastRunDate: '',
      lastRunResult: '',
      createdAt: Date.now(),
    }
    tasks.push(task)
    await env.AGENT_MEMORY.put(key, JSON.stringify(tasks))
    await registerUserKey(env.AGENT_MEMORY, userKey)
    return Response.json({ code: 1, task }, { headers: CORS })
  }

  if (body.action === 'toggle') {
    tasks = tasks.map(t => t.id === body.id ? { ...t, enabled: !t.enabled } : t)
    await env.AGENT_MEMORY.put(key, JSON.stringify(tasks))
    return Response.json({ code: 1, tasks }, { headers: CORS })
  }

  if (body.action === 'delete') {
    tasks = tasks.filter(t => t.id !== body.id)
    await env.AGENT_MEMORY.put(key, JSON.stringify(tasks))
    return Response.json({ code: 1, tasks }, { headers: CORS })
  }

  return Response.json({ code: 0, message: '不支持的 action' }, { status: 400, headers: CORS })
}
