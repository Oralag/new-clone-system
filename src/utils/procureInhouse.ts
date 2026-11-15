/**
 * 采购单「保存并审核」的入库编排。
 *
 * 入库单、库存和库存流水由采购入库单的审核产生，不由采购单审核产生。
 * 采购单审核只会把单据标成已审核，并在有付款金额时写付款单。
 * 因此必须先成功创建并审核入库单，再审核采购单。入库失败时不能继续付款，
 * 也不能提示「已自动入库」。
 */

export interface ProcureInhouseClient {
  list: (params?: Record<string, any>) => Promise<any>
  create: (data: Record<string, any>) => Promise<any>
  audit: (id: number, status: number) => Promise<any>
}

export interface PurchaseInhouseInput {
  orderId: number
  supplier_id?: any
  supplier_name?: string
  warehouse_id?: any
  warehouse_name?: string
  admin_name?: string
  order_date?: any
  created_at?: any
  remark?: string
  items: any[]
}

export interface PurchaseInhouseResult {
  inhouseId: number
  created: boolean
  /** 调用前就已经有已审核入库单，本次没有再写库存 */
  alreadyAudited: boolean
}

export class PurchaseFlowError extends Error {
  code: 'INHOUSE_FAILED' | 'AUDIT_AFTER_INHOUSE'
  constructor(message: string, code: 'INHOUSE_FAILED' | 'AUDIT_AFTER_INHOUSE') {
    super(message)
    this.name = 'PurchaseFlowError'
    this.code = code
  }
}

function formatYmd(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** 单据日期可能是 YYYY-MM-DD，也可能是日期对象。不能对日期对象做 slice。 */
export function normalizeInhouseDate(value: any): string {
  if (value == null || value === '') return ''
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? '' : formatYmd(value)
  }
  const raw = String(value).trim()
  if (!raw || raw === 'null' || raw === 'undefined' || raw === '0000-00-00') return ''
  const iso = raw.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`
  if (/\d{4}/.test(raw)) {
    const parsed = new Date(raw)
    if (!Number.isNaN(parsed.getTime())) return formatYmd(parsed)
  }
  return ''
}

export function inhouseRowsOf(res: any): any[] {
  const data = res?.data
  if (Array.isArray(data)) return data
  if (Array.isArray(data?.rows)) return data.rows
  if (Array.isArray(data?.data?.rows)) return data.data.rows
  return []
}

export function inhouseRecordId(res: any): number {
  const data = res?.data
  if (typeof data === 'number' && Number.isSafeInteger(data) && data > 0) return data
  if (typeof data === 'string' && /^\d+$/.test(data)) return Number(data)
  const id = Number(data?.id ?? data?.data?.id ?? 0)
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}

function linkedInhouse(rows: any[], orderId: number): any[] {
  return rows.filter((row) => Number(row?.purchase_order_id) === orderId && !row?.deleted_at)
}

async function findLinkedInhouse(api: ProcureInhouseClient, orderId: number): Promise<any[]> {
  const res = await api.list({ purchase_order_id: orderId, list_rows: 100, page: 1 })
  return linkedInhouse(inhouseRowsOf(res), orderId)
}

/**
 * 为一张采购单保证恰好有一张已审核的采购入库单。
 * 已有已审核入库单时直接返回，不再创建、不再审核。
 */
export async function ensurePurchaseOrderInhouse(
  api: ProcureInhouseClient,
  input: PurchaseInhouseInput,
  now = new Date(),
): Promise<PurchaseInhouseResult> {
  const orderId = Number(input.orderId)
  if (!Number.isSafeInteger(orderId) || orderId <= 0) {
    throw new PurchaseFlowError('采购单尚未保存，无法入库', 'INHOUSE_FAILED')
  }
  const items = Array.isArray(input.items) ? input.items : []
  const stockable = items.filter((item) => Number(item?.goods_id) > 0 && Number(item?.num) > 0)
  if (!stockable.length) {
    throw new PurchaseFlowError('采购明细里没有可入库的商品', 'INHOUSE_FAILED')
  }
  const warehouseId = Number(input.warehouse_id || 0)
  if (!Number.isSafeInteger(warehouseId) || warehouseId <= 0) {
    throw new PurchaseFlowError('请选择入库仓库', 'INHOUSE_FAILED')
  }

  let existing: any[]
  try {
    existing = await findLinkedInhouse(api, orderId)
  } catch (error: any) {
    throw new PurchaseFlowError(error?.message || '查询已有入库单失败', 'INHOUSE_FAILED')
  }

  const audited = existing.filter((row) => Number(row.status) === 1 && Number(row.id) > 0)
  if (audited.length) {
    const newest = [...audited].sort((a, b) => Number(b.id) - Number(a.id))[0]
    return { inhouseId: Number(newest.id), created: false, alreadyAudited: true }
  }

  let created = false
  let inhouseId = 0
  if (existing.length) {
    const newest = [...existing].sort((a, b) => Number(b.id) - Number(a.id))[0]
    inhouseId = Number(newest.id) || 0
  } else {
    const inDate = normalizeInhouseDate(input.order_date)
      || normalizeInhouseDate(input.created_at)
      || formatYmd(now)
    try {
      const createdRes = await api.create({
        purchase_order_id: orderId,
        supplier_id: input.supplier_id || 0,
        supplier_name: input.supplier_name || '',
        warehouse_id: warehouseId,
        warehouse_name: input.warehouse_name || '',
        admin_name: input.admin_name || '',
        in_date: inDate,
        remark: input.remark || '',
        goods_info: JSON.stringify(stockable),
      })
      created = true
      inhouseId = inhouseRecordId(createdRes)
    } catch (error: any) {
      throw new PurchaseFlowError(error?.message || '创建采购入库单失败', 'INHOUSE_FAILED')
    }
    if (!inhouseId) {
      try {
        const again = await findLinkedInhouse(api, orderId)
        const pending = again.find((row) => Number(row.status) !== 1) || again[0]
        inhouseId = Number(pending?.id) || 0
        if (inhouseId && Number(pending?.status) === 1) {
          return { inhouseId, created: true, alreadyAudited: true }
        }
      } catch (error: any) {
        throw new PurchaseFlowError(error?.message || '入库单已提交，但无法确认单号，请先核对采购入库列表，不要重复入库', 'INHOUSE_FAILED')
      }
    }
  }

  if (!inhouseId) {
    throw new PurchaseFlowError('入库单没有返回单号，已停止，避免重复入库', 'INHOUSE_FAILED')
  }

  try {
    await api.audit(inhouseId, 1)
  } catch (error: any) {
    throw new PurchaseFlowError(error?.message || '采购入库单审核失败', 'INHOUSE_FAILED')
  }
  return { inhouseId, created, alreadyAudited: false }
}

/**
 * 先入库，再审核采购单（审核才会付款）。
 * 入库抛错时不会调用审核。审核抛错时带 AUDIT_AFTER_INHOUSE，调用方不能再说「未入库」。
 */
export async function receiveThenAuditPurchase(options: {
  payAmount: number
  fundId: number
  ensureInhouse: () => Promise<unknown>
  auditOrder: () => Promise<unknown>
}): Promise<'inhouse_and_finance' | 'inhouse'> {
  await options.ensureInhouse()
  try {
    await options.auditOrder()
  } catch (error: any) {
    throw new PurchaseFlowError(error?.message || '采购单审核失败', 'AUDIT_AFTER_INHOUSE')
  }
  return Number(options.payAmount) > 0 && Number(options.fundId) > 0
    ? 'inhouse_and_finance'
    : 'inhouse'
}
