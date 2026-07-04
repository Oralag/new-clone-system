// Cloudflare Pages Function — /api/adam/assets
// 投资模块真实资产汇总：HTX 现货 USDT + 持仓市值（BTC/ETH）+ 活期理财
// 前端首页/顶栏/投资局面板统一从这里取数，不再使用本地虚拟账本
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

async function marketPrice(symbol: string): Promise<number> {
  try {
    const r = await fetch(`https://api.huobi.pro/market/detail/merged?symbol=${symbol}`, { signal: AbortSignal.timeout(5000) })
    const d: any = await r.json()
    return d.tick?.close || 0
  } catch { return 0 }
}

export async function onRequest(ctx: EventContext<Env, string, unknown>) {
  const env = ctx.env
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
  const ak = env.HTX_API_KEY, sk = env.HTX_SECRET_KEY
  if (!ak || !sk) {
    return new Response(JSON.stringify({ error: 'HTX API Key 未配置' }), { status: 503, headers })
  }
  try {
    const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
    const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
    const earn = accts.data?.find((a: any) => a.type === 'deposit-earning')
    if (!spot) return new Response(JSON.stringify({ error: '未找到现货账户' }), { status: 502, headers })

    const [sbal, ebal, btcPrice, ethPrice] = await Promise.all([
      htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk),
      earn ? htxRequest('GET', `/v1/account/accounts/${earn.id}/balance`, {}, null, ak, sk) : Promise.resolve(null),
      marketPrice('btcusdt'),
      marketPrice('ethusdt'),
    ])

    const list: any[] = sbal?.data?.list || []
    const bal = (cur: string, type: string) => parseFloat(list.find((b: any) => b.currency === cur && b.type === type)?.balance || '0')
    const spotUsdt = bal('usdt', 'trade')
    const frozenUsdt = bal('usdt', 'frozen')
    const btcQty = bal('btc', 'trade') + bal('btc', 'frozen')
    const ethQty = bal('eth', 'trade') + bal('eth', 'frozen')

    const positions = [
      { symbol: 'BTC', qty: btcQty, price: btcPrice, value_usdt: btcQty * btcPrice },
      { symbol: 'ETH', qty: ethQty, price: ethPrice, value_usdt: ethQty * ethPrice },
    ].filter(p => p.value_usdt > 0.01)
    const positionValue = positions.reduce((s, p) => s + p.value_usdt, 0)

    const savingsUsdt = parseFloat((ebal?.data?.list || []).find((b: any) => b.currency === 'usdt')?.balance || '0')
    const total = spotUsdt + frozenUsdt + positionValue + savingsUsdt

    return new Response(JSON.stringify({
      spot_usdt: +spotUsdt.toFixed(6),
      frozen_usdt: +frozenUsdt.toFixed(6),
      savings_usdt: +savingsUsdt.toFixed(6),
      positions: positions.map(p => ({ ...p, qty: +p.qty.toFixed(8), value_usdt: +p.value_usdt.toFixed(4) })),
      position_value_usdt: +positionValue.toFixed(4),
      total_usdt: +total.toFixed(4),
      updated_at: new Date().toISOString(),
    }), { headers })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'HTX 请求失败' }), { status: 502, headers })
  }
}
