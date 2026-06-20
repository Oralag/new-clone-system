// Cloudflare Pages Function — /api/adam/wallet
// GET: 查询当前绑定的钱包地址 + 链上 USDT 余额
// POST: 绑定钱包地址（链上读，不签名，只观察）

interface Env {
  AGENT_MEMORY: KVNamespace
}

const CORS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
}

function tokenKey(token: string) {
  return token.replace(/[^a-zA-Z0-9]/g, '').slice(0, 16) || 'anon'
}

// USDT 合约地址（BNB Chain，18 位精度）
const USDT_BSC = '0x55d398326f99059fF775485246999027B3197955'
const BSC_RPC = 'https://bsc-dataseed.binance.org/'

// USDT 合约地址（Base，6 位精度）— 备用
const USDT_BASE = '0xfde4c96c8593536e31f229ea8f37b2ada2699bb2'
const BASE_RPC = 'https://mainnet.base.org'

export async function getUSDTBalance(wallet: string, chain: 'bsc' | 'base'): Promise<number> {
  const config = chain === 'bsc'
    ? { rpc: BSC_RPC, contract: USDT_BSC, decimals: 18 }
    : { rpc: BASE_RPC, contract: USDT_BASE, decimals: 6 }

  try {
    const paddedAddr = wallet.toLowerCase().replace('0x', '').padStart(64, '0')
    const data = '0x70a08231' + paddedAddr

    const res = await fetch(config.rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: config.contract, data }, 'latest'],
        id: 1,
      }),
    })

    const json = await res.json() as { result?: string }
    if (!json.result || json.result === '0x' || json.result === '0x0') return 0

    const balanceWei = BigInt(json.result)
    return Number(balanceWei) / Math.pow(10, config.decimals)
  } catch {
    return 0
  }
}

export async function getWalletAddress(env: Env, tKey: string): Promise<string | null> {
  return env.AGENT_MEMORY.get(`adam:wallet_address:${tKey}`)
}

export async function getLastBalance(env: Env, tKey: string, chain: string): Promise<number> {
  const raw = await env.AGENT_MEMORY.get(`adam:wallet_balance:${tKey}:${chain}`)
  return raw ? parseFloat(raw) : 0
}

export async function setLastBalance(env: Env, tKey: string, chain: string, balance: number) {
  await env.AGENT_MEMORY.put(
    `adam:wallet_balance:${tKey}:${chain}`,
    balance.toString(),
    { expirationTtl: 365 * 24 * 60 * 60 },
  )
}

// ── GET: 查钱包绑定 + 实时余额 ────────────────────────────────────────────────

export async function onRequestGet(context: { request: Request; env: Env }) {
  const { request, env } = context
  const token = request.headers.get('x-erp-token') || ''
  const tKey = tokenKey(token)

  const address = await env.AGENT_MEMORY.get(`adam:wallet_address:${tKey}`)
  if (!address) {
    return new Response(JSON.stringify({ bound: false }), { headers: CORS })
  }

  const [bscBalance, baseBalance] = await Promise.all([
    getUSDTBalance(address, 'bsc'),
    getUSDTBalance(address, 'base'),
  ])

  return new Response(JSON.stringify({
    bound: true,
    address,
    balances: { bsc: bscBalance, base: baseBalance },
    total_usdt: bscBalance + baseBalance,
  }), { headers: CORS })
}

// ── POST: 绑定钱包地址 ───────────────────────────────────────────────────────

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context
  const token = request.headers.get('x-erp-token') || ''
  const tKey = tokenKey(token)

  let body: any = {}
  try { body = await request.json() } catch {}
  const address = (body.address as string || '').trim()

  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    return new Response(JSON.stringify({ ok: false, error: '无效的钱包地址' }), { status: 400, headers: CORS })
  }

  await env.AGENT_MEMORY.put(
    `adam:wallet_address:${tKey}`,
    address,
    { expirationTtl: 365 * 24 * 60 * 60 },
  )

  return new Response(JSON.stringify({ ok: true, address }), { headers: CORS })
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS })
}
