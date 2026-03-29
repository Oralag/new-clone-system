// Cloudflare Pages Function — /api/agent-memory
// List all agent memories for a user, or get specific agent history

interface Env {
  AGENT_MEMORY: KVNamespace
}

const AGENT_IDS = ['captain', 'copywriter', 'poster', 'video', 'brand', 'publisher', 'trend', 'marketing']
const AGENT_META: Record<string, { name: string; emoji: string; color: string }> = {
  captain:    { name: 'Captain',   emoji: '🎯', color: '#6366f1' },
  copywriter: { name: '文案Agent', emoji: '✍️', color: '#f59e0b' },
  poster:     { name: '海报Agent', emoji: '🎨', color: '#ec4899' },
  video:      { name: '视频Agent', emoji: '🎬', color: '#ef4444' },
  brand:      { name: '品牌Agent', emoji: '💎', color: '#8b5cf6' },
  publisher:  { name: '发布Agent', emoji: '🚀', color: '#10b981' },
  trend:      { name: '趋势Agent', emoji: '📈', color: '#06b6d4' },
  marketing:  { name: '营销顾问',  emoji: '📊', color: '#059669' },
}

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
    },
  })
}

// GET /api/agent-memory — returns all agents with their message counts and last message
// GET /api/agent-memory?agentId=xxx — returns full message history for one agent
export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  const caller = url.searchParams.get('caller')  // captain | adam
  const erpToken = request.headers.get('x-erp-token') || ''

  if (!erpToken) {
    return new Response(JSON.stringify([]), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const tokenKey = erpToken.slice(-16)

  if (agentId && caller) {
    // Return caller-specific history (e.g. captain's dispatches to marketing)
    const key = `mem:${tokenKey}:${agentId}:${caller}`
    const messages = await env.AGENT_MEMORY.get(key, 'json') as any[] || []
    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  if (agentId) {
    // Return full history for one agent
    const key = `mem:${tokenKey}:${agentId}`
    const messages = await env.AGENT_MEMORY.get(key, 'json') as any[] || []
    return new Response(JSON.stringify(messages), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // Return summary for all agents
  const results = await Promise.all(AGENT_IDS.map(async (id) => {
    const key = `mem:${tokenKey}:${id}`
    const messages = await env.AGENT_MEMORY.get(key, 'json') as any[] || []
    const meta = AGENT_META[id]
    const lastMsg = messages.filter((m: any) => m.role === 'user').slice(-1)[0]
    return {
      agentId: id,
      name: meta.name,
      emoji: meta.emoji,
      color: meta.color,
      messageCount: messages.length,
      lastUserMessage: lastMsg?.content?.slice(0, 80) || '',
      messages,
    }
  }))

  return new Response(JSON.stringify(results.filter(r => r.messageCount > 0)), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}

// DELETE /api/agent-memory?agentId=xxx — clear one agent's memory
// DELETE /api/agent-memory — clear all agents' memory
export const onRequestDelete: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const agentId = url.searchParams.get('agentId')
  const caller = url.searchParams.get('caller')
  const erpToken = request.headers.get('x-erp-token') || ''

  if (!erpToken) {
    return new Response(JSON.stringify({ ok: false }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  const tokenKey = erpToken.slice(-16)

  if (agentId && caller) {
    await env.AGENT_MEMORY.delete(`mem:${tokenKey}:${agentId}:${caller}`)
  } else if (agentId) {
    await env.AGENT_MEMORY.delete(`mem:${tokenKey}:${agentId}`)
    // Also clear caller sub-keys
    await Promise.all(['captain', 'adam'].map(c => env.AGENT_MEMORY.delete(`mem:${tokenKey}:${agentId}:${c}`)))
  } else {
    await Promise.all(AGENT_IDS.map(id => env.AGENT_MEMORY.delete(`mem:${tokenKey}:${id}`)))
    // Also clear caller sub-keys for marketing
    await Promise.all(['captain', 'adam'].map(c => env.AGENT_MEMORY.delete(`mem:${tokenKey}:marketing:${c}`)))
  }

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
  })
}
