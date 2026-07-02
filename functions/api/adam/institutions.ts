// GET/POST /api/adam/institutions — 机构状态读写
import type { EventContext } from '@cloudflare/workers-types'

interface Env { AGENT_MEMORY: KVNamespace }

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

function tokenToKey(token: string): string {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16)
}

export async function onRequest(ctx: EventContext<Env, string, unknown>) {
  const { request, env } = ctx
  if (request.method === 'OPTIONS') return new Response(null, { headers: CORS })

  const token = request.headers.get('x-erp-token') || ''
  if (!token) return new Response(JSON.stringify({ error: 'no token' }), { status: 401, headers: CORS })
  const tKey = tokenToKey(token)
  const kvKey = `adam:institutions:${tKey}`

  if (request.method === 'GET') {
    const stored = await env.AGENT_MEMORY.get(kvKey, 'json') as Record<string, string> | null
    return new Response(JSON.stringify({ institutions: stored || {} }), { headers: CORS })
  }

  if (request.method === 'POST') {
    // body: { institutions: { bureau: 'active', intel_station: 'idle', ... } }
    const body = await request.json() as { institutions?: Record<string, string> }
    if (!body.institutions || typeof body.institutions !== 'object') {
      return new Response(JSON.stringify({ error: 'invalid body' }), { status: 400, headers: CORS })
    }
    await env.AGENT_MEMORY.put(kvKey, JSON.stringify(body.institutions))
    return new Response(JSON.stringify({ ok: true }), { headers: CORS })
  }

  return new Response(JSON.stringify({ error: 'method not allowed' }), { status: 405, headers: CORS })
}
