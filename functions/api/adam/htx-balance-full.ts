import type { EventContext } from '@cloudflare/workers-types'
interface Env { HTX_API_KEY?: string; HTX_SECRET_KEY?: string }

async function htxRequest(method: string, path: string, params: Record<string, string>, body: any, apiKey: string, secretKey: string) {
  const host = 'api.huobi.pro'
  const ts = new Date().toISOString().replace(/\.\d{3}Z$/, '')
  const baseParams: Record<string, string> = { AccessKeyId: apiKey, SignatureMethod: 'HmacSHA256', SignatureVersion: '2', Timestamp: ts, ...params }
  const queryString = Object.keys(baseParams).sort().map(k => `${encodeURIComponent(k)}=${encodeURIComponent(baseParams[k])}`).join('&')
  const stringToSign = `${method.toUpperCase()}\n${host}\n${path}\n${queryString}`
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', enc.encode(secretKey), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(stringToSign))
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig)))
  const url = `https://${host}${path}?${queryString}&Signature=${encodeURIComponent(sigB64)}`
  const res = await fetch(url, { method: method.toUpperCase(), headers: { 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(10000) })
  return res.json()
}

export async function onRequest(ctx: EventContext<Env, string, unknown>) {
  const env = ctx.env
  const ak = env.HTX_API_KEY!, sk = env.HTX_SECRET_KEY!

  const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
  const allBalances: any[] = []
  for (const a of (accts.data || [])) {
    const bal = await htxRequest('GET', `/v1/account/accounts/${a.id}/balance`, {}, null, ak, sk)
    const nonZero = (bal.data?.list || []).filter((b: any) => parseFloat(b.balance) > 0)
    if (nonZero.length > 0) {
      allBalances.push({ account_id: a.id, type: a.type, state: a.state, balances: nonZero })
    }
  }
  const earnInvests = await htxRequest('GET', '/v2/earn/invests', { accountType: 'borrow-and-earn' }, null, ak, sk).catch((e:any) => ({ error: e.message }))
  const earnInvests2 = await htxRequest('GET', '/v2/earn/invests', { accountType: 'lite-financial' }, null, ak, sk).catch((e:any) => ({ error: e.message }))

  return new Response(JSON.stringify({
    accounts: (accts.data || []).map((a:any) => ({ id: a.id, type: a.type, state: a.state })),
    non_zero_balances: allBalances,
    earn_invests_borrow: earnInvests,
    earn_invests_lite: earnInvests2,
  }, null, 2), { headers: { 'Content-Type': 'application/json' } })
}
