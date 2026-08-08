// /api/scheduled-run — 定时任务执行器（由 workers/ad-dept-cron 定时调用）
// 鉴权：x-cron-secret（与 secretary-cron 同模式）
// 流程：遍历所有用户的到期任务 → generateContentBundle（共享流水线）→ 写入 publish:staged 队列

import { generateContentBundle } from '../utils/contentGen'

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  AGENT_MEMORY: KVNamespace
  USERS_KV: KVNamespace
  CRON_SECRET?: string
}

const STAGE_TTL = 7 * 24 * 3600

function beijingNow() {
  const d = new Date(Date.now() + 8 * 3600 * 1000)
  return { date: d.toISOString().slice(0, 10), hm: d.toISOString().slice(11, 16) }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const secret = request.headers.get('x-cron-secret') || ''
  if (secret !== (env.CRON_SECRET || 'nomad-cron-2026')) {
    return Response.json({ ok: false, error: '未授权' }, { status: 401 })
  }
  if (!env.AI_API_KEY) return Response.json({ ok: false, error: '未配置 AI_API_KEY' }, { status: 500 })

  const { date: today, hm: nowHM } = beijingNow()
  const userKeys = (await env.AGENT_MEMORY.get('sched:userkeys', 'json')) as string[] || []
  const report: any[] = []

  for (const userKey of userKeys) {
    const tasksKey = `sched:tasks:${userKey}`
    const tasks = (await env.AGENT_MEMORY.get(tasksKey, 'json')) as any[] || []
    let dirty = false

    for (const task of tasks) {
      if (!task.enabled) continue
      const due = nowHM >= task.time && task.lastRunDate !== today
      if (!due) continue

      try {
        const results = await generateContentBundle(env, userKey, task.instruction, task.count || 3, `${today} 自动生成`)

        const stageKey = `publish:staged:${userKey}`
        const staged = (await env.AGENT_MEMORY.get(stageKey, 'json')) as any[] || []
        staged.push(...results)
        await env.AGENT_MEMORY.put(stageKey, JSON.stringify(staged), { expirationTtl: STAGE_TTL })

        task.lastRunDate = today
        task.lastRunResult = `生成 ${results.length} 条内容`
        if (task.repeat === 'once') task.enabled = false
        dirty = true
        report.push({ userKey, task: task.id, ok: true, count: results.length })
      } catch (e: any) {
        task.lastRunDate = today
        task.lastRunResult = `失败：${e?.message || e}`
        dirty = true
        report.push({ userKey, task: task.id, ok: false, error: e?.message })
      }
    }

    if (dirty) await env.AGENT_MEMORY.put(tasksKey, JSON.stringify(tasks))
  }

  return Response.json({ ok: true, ranAt: `${today} ${nowHM}`, report })
}
