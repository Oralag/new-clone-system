/**
 * 移动端专属 API
 * 提供：新消息通知、操作日志、AI 解析、会议管理
 */
import http from './http'

// ── 操作日志（工作动态）───────────────────────

export interface OpLogParams {
  list_rows?: number
  page?: number
  user_id?: number
  scope?: string   // 'team' | 'mine'
  from_date?: string
  to_date?: string
}

export function getOperationLogs(params?: OpLogParams) {
  return http.get('/mobile/operation-logs', { params })
}

// ── 通知 ────────────────────────────────────

export interface Notification {
  id: number
  type: string
  title: string
  text: string
  icon?: string
  iconBg?: string
  read: boolean
  route?: string
  created_at: string
}

export function getNotifications(params?: { list_rows?: number; page?: number }) {
  return http.get('/mobile/notifications', { params })
}

export function markNotificationRead(id: number) {
  return http.post(`/mobile/notifications/${id}/read`)
}

// ── 在线状态 ─────────────────────────────────

export function getOnlineUserIds() {
  return http.get('/mobile/online-status')
}

// ── AI 业务解析 ───────────────────────────────

export interface AIParseResult {
  type: string        // 'sale' | 'procure' | 'stock_query' | 'customer_query' | 'task' | 'chat'
  confidence: number   // 0-1
  parsed?: {
    type: string
    params: Record<string, any>
    raw_text?: string
  }
  response?: string    // 非业务指令的闲聊回复
}

export function parseAIMessage(message: string, userId?: number) {
  return http.post<{ data: AIParseResult }>('/ai/parse', {
    message,
    user_id: userId,
  })
}

export function confirmAIOrder(parsed: AIParseResult['parsed'], extra?: Record<string, any>) {
  return http.post('/ai/confirm-order', { parsed, ...extra })
}

// ── 会议 ─────────────────────────────────────

export function getRecentMeetings(params?: { list_rows?: number }) {
  return http.get('/meeting/recent', { params })
}

export function scheduleMeeting(data: {
  title: string
  scheduled_at: string
  duration_minutes?: number
  participants?: number[]
  agenda?: string
}) {
  return http.post('/meeting/schedule', data)
}

export function joinMeetingByCode(code: string) {
  return http.post<{ meeting: any }>('/meeting/join-by-code', { code })
}

// ── 快速创建单据 ──────────────────────────────

/** 快速创建销售出库单（来自 AI 或快捷入口） */
export function quickCreateSaleOrder(data: {
  customer_id?: number
  customer_name?: string
  goods_info: Array<{ goods_id: number; goods_name: string; num: number; price: number; unit?: string }>
  total_amount: number
  ai_input?: boolean
  source?: string
}) {
  return http.post('/stock/SaleOutOrder/save', data)
}

/** 快速创建采购入库单 */
export function quickCreateProcureOrder(data: {
  supplier_id?: number
  supplier_name?: string
  goods_info: Array<{ goods_id: number; goods_name: string; num: number; price: number; unit?: string }>
  total_amount: number
  ai_input?: boolean
}) {
  return http.post('/procure/ProcureInhouse/save', data)
}

/** 扫码查询库存 */
export function scanGoodsStock(barcode: string) {
  return http.get('/warehouse/scan', { params: { barcode } })
}
