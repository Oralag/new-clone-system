// GET /api/adam/reflections — 读亚当的交易反思（档案馆）
import type { EventContext } from '@cloudflare/workers-types'
interface Env { AGENT_MEMORY: KVNamespace }

export async function onRequest(ctx: EventContext<Env, string, unknown>) {
  const env = ctx.env
  const tKey = 'erpeyJ0IjoiZXlKa'
  const reflections = (await env.AGENT_MEMORY.get(`adam:reflections:${tKey}`, 'json') as any[] | null) || []
  return new Response(JSON.stringify({
    total: reflections.length,
    reflections: reflections.slice(-20).reverse(),  // 最近 20 条，新→旧
  }, null, 2), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
}
