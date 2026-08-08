// /api/quick-generate — 一键生成今日内容（工作台大按钮调用）
// 读品牌配置 → generateContentBundle（共享流水线）→ 写入发布暂存队列
// 前端跳转发布管理页即可看到（Publish.vue 加载时自动拉取合并）

import { generateContentBundle } from '../utils/contentGen'
import { getUserKey } from '../utils/userKey'
import { verifyErpToken } from '../utils/verifyErpToken'

interface Env {
  AI_API_KEY: string
  AI_BASE_URL?: string
  AI_MODEL?: string
  AGENT_MEMORY: KVNamespace
  USERS_KV: KVNamespace
}

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

export const onRequestOptions: PagesFunction = async () => new Response(null, { headers: CORS })

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!(await verifyErpToken(request, env))) {
    return Response.json({ code: 0, message: '未授权' }, { status: 401, headers: CORS })
  }
  if (!env.AI_API_KEY) return Response.json({ code: 0, message: '未配置 AI_API_KEY' }, { status: 500, headers: CORS })

  const token = request.headers.get('x-erp-token') || ''
  const userKey = getUserKey(token)
  const body = await request.json().catch(() => ({})) as any
  const instruction = String(body?.instruction || '根据品牌配置，生成今天要发布的社媒推广内容，选题多样化（种草/知识/场景），突出品牌卖点').slice(0, 500)
  const count = Math.min(Math.max(Number(body?.count) || 3, 1), 10)

  const today = new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(0, 10)

  try {
    const results = await generateContentBundle(env, userKey, instruction, count, today)

    const stageKey = `publish:staged:${userKey}`
    const staged = (await env.AGENT_MEMORY.get(stageKey, 'json')) as any[] || []
    staged.push(...results)
    await env.AGENT_MEMORY.put(stageKey, JSON.stringify(staged), { expirationTtl: 7 * 24 * 3600 })

    return Response.json({ code: 1, count: results.length }, { headers: CORS })
  } catch (e: any) {
    return Response.json({ code: 0, message: e?.message || '生成失败' }, { status: 500, headers: CORS })
  }
}
