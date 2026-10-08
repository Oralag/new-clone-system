// 官网（品牌站）零售下单 / 扫码付款 / 订单查询。
// 顾客不登录，所以不走 http.ts（那个会带 ERP token、401 会跳登录页）。
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

async function call<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = {}
  const shop = brandShopCode()
  if (shop) headers['x-mini-shop'] = shop
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

export function lookupWebOrders(mobile: string) {
  const q = new URLSearchParams({ mobile, _t: String(Date.now()) })
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
