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
  const spot = accts.data?.find((a: any) => a.type === 'spot')
  const earn = accts.data?.find((a: any) => a.type === 'deposit-earning')
  const sbal = spot ? await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk) : null
  const ebal = earn ? await htxRequest('GET', `/v1/account/accounts/${earn.id}/balance`, {}, null, ak, sk) : null
  const spotUsdt = parseFloat(sbal?.data?.list?.find((b: any) => b.currency === 'usdt' && b.type === 'trade')?.balance || '0')
  const earnUsdt = parseFloat(ebal?.data?.list?.find((b: any) => b.currency === 'usdt')?.balance || '0')
  const interest = earnUsdt - 15
  return new Response(JSON.stringify({
    spot_usdt: spotUsdt.toFixed(6),
    savings_usdt: earnUsdt.toFixed(6),
    interest_since_purchase: interest.toFixed(6),
    daily_expected: '0.004110',
    note: `本金15 USDT，活期约10%年化，每天约0.0041 USDT`
  }, null, 2), { headers: { 'Content-Type': 'application/json' } })
}
