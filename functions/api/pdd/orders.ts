// Cloudflare Pages Function — /api/pdd/orders
// 从 KV 读取 PDD 凭证，调用拼多多开放平台 API 返回订单数据

import md5 from 'md5'

interface Env {
  AGENT_MEMORY: KVNamespace
}

const KV_KEY = 'pdd:config'
const PDD_API = 'https://gsp.pinduoduo.com/gsp/api'

// PDD 状态码映射（前端统一状态）
const PDD_STATUS_MAP: Record<number, string> = {
  1: 'cancelled',   // 未付款取消
  2: 'pending',     // 已付款待发货
  3: 'shipped',     // 已发货
  4: 'completed',   // 已收货
  5: 'completed',   // 已完成
  14: 'refunded',   // 退款中
  15: 'refunded',   // 退款成功
}

async function pddRequest(
  method: string,
  params: Record<string, any>,
  clientId: string,
  secret: string,
  accessToken: string,
): Promise<any> {
  const allParams: Record<string, string> = {
    type: method,
    client_id: clientId,
    timestamp: String(Math.floor(Date.now() / 1000)),
    data_type: 'JSON',
    version: 'V1',
    ...(accessToken ? { access_token: accessToken } : {}),
  }
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      allParams[k] = typeof v === 'object' ? JSON.stringify(v) : String(v)
    }
  }
  const sortedStr = Object.keys(allParams).sort().map(k => `${k}${allParams[k]}`).join('')
  const sign = md5(secret + sortedStr + secret).toUpperCase()

  const body = new URLSearchParams({ ...allParams, sign })
  const resp = await fetch(PDD_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  })
  const data = await resp.json() as any
  if (data.error_response) {
    throw new Error(`PDD ${data.error_response.error_code}: ${data.error_response.error_msg}`)
  }
  return data
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const raw = await env.AGENT_MEMORY.get(KV_KEY)
  if (!raw) {
    return Response.json({ error: 'PDD 未配置，请先在平台接入页保存凭证', not_configured: true }, { status: 403 })
  }

  const cfg = JSON.parse(raw)
  if (!cfg.client_id || !cfg.client_secret || !cfg.access_token) {
    return Response.json({ error: 'PDD 凭证不完整，需要 client_id、client_secret 和 access_token', not_configured: true }, { status: 403 })
  }

  const url = new URL(request.url)
  const page = Number(url.searchParams.get('page') || '1')
  const pageSize = Math.min(Number(url.searchParams.get('page_size') || '20'), 50)
  const orderStatus = url.searchParams.get('order_status')
  const days = Math.min(Number(url.searchParams.get('days') || '7'), 30)
  const keyword = url.searchParams.get('keyword') || ''

  const now = Math.floor(Date.now() / 1000)
  const params: Record<string, any> = {
    start_time: now - days * 86400,
    end_time: now,
    page,
    page_size: pageSize,
  }
  if (orderStatus) params.order_status = Number(orderStatus)

  try {
    const res = await pddRequest('pdd.order.list', params, cfg.client_id, cfg.client_secret, cfg.access_token)
    const rawOrders: any[] = res?.order_list_get_response?.order_list || []
    const total: number = res?.order_list_get_response?.total_count || 0

    // 关键字过滤（PDD API 不支持关键字，在服务端过滤）
    const filtered = keyword
      ? rawOrders.filter(o =>
          o.order_sn?.includes(keyword) ||
          (o.goods_list || []).some((g: any) => g.goods_name?.includes(keyword)) ||
          o.receiver_name?.includes(keyword),
        )
      : rawOrders

    // 归一化为前端 Orders.vue 期待的格式
    const orders = filtered.map((o: any) => ({
      id: o.order_sn,
      orderNo: o.order_sn,
      platform: 'pdd',
      status: PDD_STATUS_MAP[o.order_status] || 'pending',
      amount: o.payment_amount ? Number(o.payment_amount) / 100 : 0,
      goods: (o.goods_list || []).map((g: any) => ({
        name: g.goods_name || '',
        qty: g.goods_count || 1,
        spec: g.sku_desc || '',
      })),
      customerName: o.receiver_name || '买家',
      address: [o.receiver_province, o.receiver_city, o.receiver_address].filter(Boolean).join(' '),
      createdAt: o.create_time ? new Date(o.create_time * 1000).toLocaleString('zh-CN', { hour12: false }) : '',
      pddOrderSn: o.order_sn,
      pddStatus: o.order_status,
    }))

    // 统计
    const allOrders = orders
    const stats = {
      total: allOrders.length,
      pending: allOrders.filter(o => o.status === 'pending').length,
      shipped: allOrders.filter(o => o.status === 'shipped').length,
      completed: allOrders.filter(o => o.status === 'completed').length,
      refunded: allOrders.filter(o => o.status === 'refunded').length,
    }

    return Response.json({ list: orders, total, page, pageSize, stats })
  } catch (e: any) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
