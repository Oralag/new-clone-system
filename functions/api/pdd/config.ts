// Cloudflare Pages Function — /api/pdd/config
// GET: 查询 PDD 凭证配置状态（不返回 secret）
// POST: 保存 PDD 凭证到 KV

interface Env {
  AGENT_MEMORY: KVNamespace
}

const KV_KEY = 'pdd:config'

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const raw = await env.AGENT_MEMORY.get(KV_KEY)
  if (!raw) {
    return Response.json({ configured: false, has_access_token: false })
  }
  const cfg = JSON.parse(raw)
  return Response.json({
    configured: !!(cfg.client_id && cfg.client_secret),
    has_access_token: !!cfg.access_token,
    client_id: cfg.client_id || '',
    shop_name: cfg.shop_name || '',
    connected_at: cfg.connected_at || '',
  })
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const body = await request.json() as any
  const { client_id, client_secret, access_token, shop_name } = body

  if (!client_id || !client_secret) {
    return Response.json({ error: '缺少 client_id 或 client_secret' }, { status: 400 })
  }

  // 合并：只有传了新值才覆盖（access_token 可能通过 OAuth 回调单独更新）
  const existing = await env.AGENT_MEMORY.get(KV_KEY)
  const prev = existing ? JSON.parse(existing) : {}

  const cfg = {
    client_id,
    client_secret,
    access_token: access_token || prev.access_token || '',
    shop_name: shop_name || prev.shop_name || '',
    connected_at: new Date().toISOString(),
  }

  await env.AGENT_MEMORY.put(KV_KEY, JSON.stringify(cfg))
  return Response.json({ ok: true, has_access_token: !!cfg.access_token })
}

export const onRequestDelete: PagesFunction<Env> = async ({ env }) => {
  await env.AGENT_MEMORY.delete(KV_KEY)
  return Response.json({ ok: true })
}
