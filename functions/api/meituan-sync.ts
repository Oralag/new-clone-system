// Cloudflare Pages Function — /api/meituan-sync
// 用存储的 Cookie 调用美团商家后台内部 API，拉取每日数据

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, x-erp-token',
  'Content-Type': 'application/json',
}

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'

// 美团商家后台内部 API base
const MT_BASE = 'https://e.waimai.meituan.com'

function today() {
  return new Date().toISOString().slice(0, 10)
}

function dayStart(dateStr: string) {
  return Math.floor(new Date(dateStr + 'T00:00:00+08:00').getTime() / 1000)
}

function dayEnd(dateStr: string) {
  return Math.floor(new Date(dateStr + 'T23:59:59+08:00').getTime() / 1000)
}

async function mtFetch(path: string, cookie: string) {
  const res = await fetch(`${MT_BASE}${path}`, {
    headers: {
      'Cookie': cookie,
      'User-Agent': UA,
      'Referer': MT_BASE,
      'Accept': 'application/json, text/plain, */*',
    },
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<any>
}

async function fetchOrders(cookie: string, date: string) {
  const start = dayStart(date)
  const end = dayEnd(date)
  try {
    const data = await mtFetch(
      `/waimai/wm/api/v4/order/list.json?status=8&starttime=${start}&endtime=${end}&limit=100&offset=0`,
      cookie
    )
    const orders = data?.data?.list || data?.list || []
    const total = orders.length
    const revenue = orders.reduce((s: number, o: any) => s + (Number(o.originalPrice || o.total || 0) / 100), 0)
    return { total, revenue: revenue.toFixed(2), orders }
  } catch {
    return { total: 0, revenue: '0.00', orders: [], error: true }
  }
}

async function fetchReviews(cookie: string, date: string) {
  const start = dayStart(date)
  const end = dayEnd(date)
  try {
    const data = await mtFetch(
      `/waimai/wm/api/comment/list?starttime=${start}&endtime=${end}&limit=50&offset=0`,
      cookie
    )
    const list = data?.data?.list || data?.list || []
    const bad = list.filter((r: any) => (r.starLevel || r.star || 5) <= 2)
    return { total: list.length, bad: bad.length, list }
  } catch {
    return { total: 0, bad: 0, list: [], error: true }
  }
}

async function fetchStats(cookie: string, date: string) {
  const start = dayStart(date)
  const end = dayEnd(date)
  try {
    const data = await mtFetch(
      `/waimai/report/businessreport.json?starttime=${start}&endtime=${end}`,
      cookie
    )
    return data?.data || data || {}
  } catch {
    return { error: true }
  }
}

async function fetchTopDishes(cookie: string, date: string) {
  const start = dayStart(date)
  const end = dayEnd(date)
  try {
    const data = await mtFetch(
      `/waimai/report/foodreport.json?starttime=${start}&endtime=${end}&limit=5`,
      cookie
    )
    const list = data?.data?.list || data?.list || []
    return list.slice(0, 5)
  } catch {
    return []
  }
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { headers: CORS })

// GET /api/meituan-sync?date=2026-05-11 — 读取已缓存数据
export const onRequestGet: PagesFunction<{ USERS_KV: KVNamespace }> = async ({ request, env }) => {
  const url = new URL(request.url)
  const date = url.searchParams.get('date') || today()
  const cached = await env.USERS_KV.get(`meituan:data:${date}`)
  if (cached) {
    return new Response(cached, { headers: CORS })
  }
  return new Response(JSON.stringify({ ok: false, message: '暂无数据，请先同步' }), { headers: CORS })
}

// POST /api/meituan-sync — 触发同步
export const onRequestPost: PagesFunction<{ USERS_KV: KVNamespace }> = async ({ request, env }) => {
  const url = new URL(request.url)
  const body = await request.json().catch(() => ({})) as { date?: string }
  const date = body.date || url.searchParams.get('date') || today()

  const configRaw = await env.USERS_KV.get('meituan:config')
  if (!configRaw) {
    return new Response(JSON.stringify({ ok: false, message: '请先配置美团 Cookie' }), { headers: CORS })
  }
  const config = JSON.parse(configRaw)
  const cookie = config.cookie

  // 并行拉取所有数据
  const [orderData, reviewData, statsData, topDishes] = await Promise.all([
    fetchOrders(cookie, date),
    fetchReviews(cookie, date),
    fetchStats(cookie, date),
    fetchTopDishes(cookie, date),
  ])

  const result = {
    ok: true,
    date,
    shopName: config.shopName,
    syncedAt: new Date().toISOString(),
    orders: orderData,
    reviews: reviewData,
    stats: statsData,
    topDishes,
    cookieExpired: orderData.error && reviewData.error,
  }

  // 缓存当天数据
  await env.USERS_KV.put(`meituan:data:${date}`, JSON.stringify(result), {
    expirationTtl: 60 * 60 * 25, // 25小时后过期
  })

  // 更新最后同步时间
  await env.USERS_KV.put('meituan:config', JSON.stringify({
    ...config,
    lastSync: new Date().toISOString(),
  }))

  return new Response(JSON.stringify(result), { headers: CORS })
}
