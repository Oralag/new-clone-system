// 官网（品牌站）零售下单 / 扫码付款 / 我的订单。
// 顾客账号是小程序会员（扫小程序码登录），不走 http.ts（那个带 ERP token、401 会跳 ERP 登录页）。
// 走 /miniapi 代理：带 x-mini-shop 头时代理会转到这家店自己的后端，订单数据各家隔离。

export interface WebOrderItem { goods_name: string; qty: number; price: number }

export interface WebOrderCreated {
  order_no: string
  token: string
  code_url: string
  total_amount: number
  goods_amount: number
  freight_amount: number
  expires_at: string
  items: WebOrderItem[]
}

export interface WebOrderStatus {
  order_no: string
  status: number          // 0待付款 1待发货 2已发货 3已完成 4已取消 5退款中
  paid: boolean
  total_amount: number
  expires_at: string | null
  code_url: string
}

export interface WebOrderRow {
  order_no: string
  status: number
  total_amount: number
  freight_amount: number
  source: string
  created_at: string
  paid_at: string | null
  tracking_no: string
  express_company: string
  items: WebOrderItem[]
  refund?: WebRefundInfo | null
  pay_token?: string      // 自己的待付款官网单才有，换台电脑也能继续付款
}

export const WEB_ORDER_STATUS_TEXT: Record<number, string> = {
  0: '待付款', 1: '待发货', 2: '已发货', 3: '已完成', 4: '已取消', 5: '退款中',
}

// 官网链接里的 ?shop=店铺码；没有就用上次记下的（跟 shopStore.fetchProducts 同一套规则）
export function brandShopCode(): string {
  const fromUrl = new URLSearchParams(window.location.hash.split('?')[1] || '').get('shop')
  if (fromUrl) return fromUrl
  try { return localStorage.getItem('brand_shop_code') || '' } catch { return '' }
}

// ─── 登录态：按店铺分开存（各家店是各自的后端、各自的会员）────────────────
export interface WebUser { id: number; name: string; phone: string }
interface WebSession { token: string; user: WebUser }

function sessionKey() {
  return `brand_web_session_v1:${brandShopCode() || 'default'}`
}
export function loadWebSession(): WebSession | null {
  try {
    const s = JSON.parse(localStorage.getItem(sessionKey()) || 'null')
    return s && s.token ? s : null
  } catch { return null }
}
export function saveWebSession(s: WebSession) {
  try { localStorage.setItem(sessionKey(), JSON.stringify(s)) } catch { /* 存不进就只在本页有效 */ }
  window.dispatchEvent(new Event('brand-web-session'))
}
export function clearWebSession() {
  try { localStorage.removeItem(sessionKey()) } catch { /* ignore */ }
  window.dispatchEvent(new Event('brand-web-session'))
}

// 后端回 code -401 = 没登录或登录过期
export class WebNeedLoginError extends Error {}

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const shop = brandShopCode()
  if (shop) headers['x-mini-shop'] = shop
  const session = loadWebSession()
  if (session) headers['mini-token'] = session.token
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  let res: Response
  try {
    res = await fetch(`/miniapi${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
  } catch {
    throw new Error('网络连接失败，请检查网络后重试')
  }
  const data = await res.json().catch(() => null)
  if (!data) throw new Error(`服务暂时不可用（HTTP ${res.status}），请稍后再试`)
  if (data.code === -401) {
    clearWebSession()
    throw new WebNeedLoginError(data.message || '请先登录')
  }
  if (data.code !== 1) throw new Error(data.message || '请求失败，请稍后再试')
  return data.data as T
}

export function createWebOrder(payload: {
  items: { goods_id: number; qty: number }[]
  contact: { name: string; mobile: string; region: string; address: string; postcode?: string }
  remark?: string
}) {
  return call<WebOrderCreated>('POST', '/web/order/create', payload)
}

export function getWebOrderStatus(orderNo: string, token: string, checkWx = false) {
  const q = new URLSearchParams({ no: orderNo, token, _t: String(Date.now()) })
  if (checkWx) q.set('check', '1')
  return call<WebOrderStatus>('GET', `/web/order/status?${q}`)
}

// 扫码登录：start 拿小程序码，poll 等手机上确认
export function startWebLogin() {
  return call<{ sid: string; qr: string; expires_in: number }>('POST', '/web/login/start', {})
}
export function pollWebLogin(sid: string) {
  const q = new URLSearchParams({ sid, _t: String(Date.now()) })
  return call<{ status: 'waiting' | 'scanned' | 'confirmed' | 'cancelled' | 'expired'; token?: string; user?: WebUser }>('GET', `/web/login/poll?${q}`)
}
// 登录是否已开启（小程序「确认登录」页发布后后端自动打开）；没开时官网照旧按手机号查单
export function getWebLoginStatus() {
  return call<{ enabled: boolean }>('GET', `/web/login/status?_t=${Date.now()}`)
}
export function getWebMe() {
  return call<WebUser>('GET', `/web/me?_t=${Date.now()}`)
}

export function lookupWebOrders(mobile = '') {
  const q = new URLSearchParams({ _t: String(Date.now()) })
  if (mobile) q.set('mobile', mobile)
  return call<{ rows: WebOrderRow[] }>('GET', `/web/order/lookup?${q}`)
}

// 本浏览器下过的单：记住 token，订单查询里才能「继续付款」
const MY_ORDERS_KEY = 'brand_web_orders_v1'

export function rememberWebOrder(orderNo: string, token: string, mobile: string) {
  try {
    const list = loadMyWebOrders().filter(o => o.order_no !== orderNo)
    list.unshift({ order_no: orderNo, token, mobile })
    localStorage.setItem(MY_ORDERS_KEY, JSON.stringify(list.slice(0, 20)))
  } catch { /* 隐私模式等写不进去就算了 */ }
}

export function loadMyWebOrders(): { order_no: string; token: string; mobile: string }[] {
  try {
    const list = JSON.parse(localStorage.getItem(MY_ORDERS_KEY) || '[]')
    return Array.isArray(list) ? list : []
  } catch {
    return []
  }
}

// 官网留言（批发询价 / 采购商申请 / 支持留言）：存进这家店的后端并推送给老板
export function submitWebLead(payload: {
  type: 'inquiry' | 'wholesale_apply' | 'support'
  name: string
  mobile?: string
  company?: string
  email?: string
  content?: string
  items?: { goods_id: number; goods_name: string; qty: number; price: number }[]
}) {
  return call<{ id: number; no: string }>('POST', '/web/lead', payload)
}

// 官网运费规则（ERP 收款设置里配，默认包邮）
export function getWebShipping() {
  return call<{ fee: number; free_threshold: number }>('GET', `/web/shipping?_t=${Date.now()}`)
}

export interface WebRefundInfo {
  status: number          // 0处理中 1已退款 2已拒绝
  amount: number
  note: string
  reason: string
  created_at: string
  handled_at: string | null
}

export function applyWebRefund(orderNo: string, reason: string, mobile = '') {
  return call<{ amount: number }>('POST', '/web/order/refund', { no: orderNo, reason, mobile })
}

export interface WebTrackEvent { time: string; description: string; location: string }
export interface WebTrackInfo { number: string; carrier: string; status: string; events: WebTrackEvent[] }

// 物流轨迹（要登录，只能查自己的单）
export function getWebOrderTracking(orderNo: string, mobile = '') {
  return call<WebTrackInfo>('GET', `/web/order/tracking?no=${encodeURIComponent(orderNo)}&mobile=${encodeURIComponent(mobile)}&_t=${Date.now()}`)
}

export function cancelWebOrder(orderNo: string, token = '') {
  return call<Record<string, never>>('POST', '/web/order/cancel', { no: orderNo, token })
}
