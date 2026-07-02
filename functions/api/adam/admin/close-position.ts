interface Env {
  AGENT_MEMORY: KVNamespace
  HTX_API_KEY?: string
  HTX_SECRET_KEY?: string
  CRON_SECRET?: string
}

async function htxRequest(method: string, path: string, params: Record<string, string>, body: any, apiKey: string, secretKey: string): Promise<any> {
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
  const res = await fetch(url, { method: method.toUpperCase(), headers: { 'Content-Type': 'application/json', 'User-Agent': 'ADAM/1.0' }, ...(body ? { body: JSON.stringify(body) } : {}) })
  return res.json()
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const secret = request.headers.get('X-Cron-Secret')
  if (!env.CRON_SECRET || secret !== env.CRON_SECRET) {
    return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: CORS })
  }
  if (!env.HTX_API_KEY || !env.HTX_SECRET_KEY) {
    return new Response(JSON.stringify({ error: 'HTX API not configured' }), { status: 500, headers: CORS })
  }

  const body = await request.json() as { tKey: string; symbol: 'btcusdt' | 'ethusdt'; reason?: string }
  const { tKey, symbol, reason } = body
  if (!tKey || !['btcusdt', 'ethusdt'].includes(symbol)) {
    return new Response(JSON.stringify({ error: 'tKey and valid symbol required' }), { status: 400, headers: CORS })
  }

  const ak = env.HTX_API_KEY, sk = env.HTX_SECRET_KEY

  try {
    const accts = await htxRequest('GET', '/v1/account/accounts', {}, null, ak, sk)
    const spot = accts.data?.find((a: any) => a.type === 'spot' && a.state === 'working')
    if (!spot) return new Response(JSON.stringify({ error: 'no spot account' }), { status: 500, headers: CORS })

    const bal = await htxRequest('GET', `/v1/account/accounts/${spot.id}/balance`, {}, null, ak, sk)
    const baseCurrency = symbol.replace('usdt', '')
    const held = parseFloat(bal.data?.list?.find((b: any) => b.currency === baseCurrency && b.type === 'trade')?.balance || '0')
    if (held <= 0) return new Response(JSON.stringify({ error: `no ${baseCurrency} position to close` }), { status: 400, headers: CORS })

    const priceRes = await fetch(`https://api.huobi.pro/market/detail/merged?symbol=${symbol}`, { signal: AbortSignal.timeout(8000) })
    const priceData: any = await priceRes.json()
    const price = priceData.tick?.close || 0
    if (!price) return new Response(JSON.stringify({ error: 'failed to fetch price' }), { status: 500, headers: CORS })

    // HTX 数量精度：BTC/ETH 都是 4 位小数，必须 floor 不能 round（避免超过实际持仓）
    const heldFloor4 = Math.floor(held * 10000) / 10000
    if (heldFloor4 < 0.0001) {
      return new Response(JSON.stringify({ error: `holding ${held} ${baseCurrency} below HTX min precision 0.0001` }), { status: 400, headers: CORS })
    }
    const estimatedUsdt = heldFloor4 * price
    const amtStr = heldFloor4.toFixed(4)

    const order = await htxRequest('POST', '/v1/order/orders/place', {}, {
      'account-id': String(spot.id), symbol, type: 'sell-market',
      amount: amtStr, source: 'spot-api'
    }, ak, sk)

    if (order.status !== 'ok') {
      return new Response(JSON.stringify({ error: order['err-msg'] || 'HTX sell failed', raw: order }), { status: 500, headers: CORS })
    }

    // 写交易记录
    const trades = await env.AGENT_MEMORY.get(`adam:htx_trades:${tKey}`, 'json') as any[] | null || []
    trades.push({
      id: order.data, side: 'sell', symbol, crypto_amount: amtStr,
      estimated_usdt: estimatedUsdt, price_at_order: price,
      ts: new Date().toISOString(), source: 'admin_close', reason: reason || '规则传递者手动平仓'
    })
    await env.AGENT_MEMORY.put(`adam:htx_trades:${tKey}`, JSON.stringify(trades.slice(-50)))

    // 清理 peak price KV
    await env.AGENT_MEMORY.delete(`adam:peak_price:${tKey}:${symbol}`)

    // 写消息到 inbox 通知亚当
    const inboxKey = `adam:inbox:${tKey}`
    const inbox = (await env.AGENT_MEMORY.get(inboxKey, 'json') as any[] | null) || []
    inbox.push({
      id: `admin_close_${Date.now()}`,
      content: `📌 规则传递者手动平仓\nsymbol: ${symbol.toUpperCase()}\n数量: ${amtStr} ${baseCurrency.toUpperCase()}\n成交均价: ${price.toFixed(2)}\n实得 USDT: ~${estimatedUsdt.toFixed(4)}\n原因: ${reason || '修复 dust bug 后清理残留持仓'}`,
      timestamp: new Date().toISOString(),
      read: false,
    })
    await env.AGENT_MEMORY.put(inboxKey, JSON.stringify(inbox.slice(-30)), { expirationTtl: 60 * 60 * 24 * 7 })

    return new Response(JSON.stringify({
      ok: true, order_id: order.data, symbol, sold_crypto: amtStr,
      base_currency: baseCurrency, price_used: price, estimated_usdt: estimatedUsdt
    }), { headers: CORS })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: CORS })
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Cron-Secret',
    }
  })
}
