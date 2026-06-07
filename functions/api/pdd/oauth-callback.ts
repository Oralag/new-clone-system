// Cloudflare Pages Function — /api/pdd/oauth-callback
// PDD OAuth 2.0 implicit flow 回调
// PDD 授权后跳转到此页面：?access_token=xxx&expires_in=xxx&state=xxx
// 此函数把 access_token 写进 KV，再跳回平台页

interface Env {
  AGENT_MEMORY: KVNamespace
}

const KV_KEY = 'pdd:config'

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const url = new URL(request.url)
  const accessToken = url.searchParams.get('access_token')
  const expiresIn = url.searchParams.get('expires_in')

  if (!accessToken) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/#/ecommerce/platforms?pdd_auth=fail' },
    })
  }

  const existing = await env.AGENT_MEMORY.get(KV_KEY)
  const prev = existing ? JSON.parse(existing) : {}

  const cfg = {
    ...prev,
    access_token: accessToken,
    token_expires_at: expiresIn
      ? new Date(Date.now() + Number(expiresIn) * 1000).toISOString()
      : '',
    connected_at: new Date().toISOString(),
  }

  await env.AGENT_MEMORY.put(KV_KEY, JSON.stringify(cfg))

  return new Response(null, {
    status: 302,
    headers: { Location: '/#/ecommerce/platforms?pdd_auth=success' },
  })
}
