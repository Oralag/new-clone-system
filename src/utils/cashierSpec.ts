// 收银台规格弹窗：把 goods.spec JSON 整理成可点的规格选项。
//
// 有的商品把「同款的另一个规格」挂在 skus[].goods_id 上，但漏写了自己。
// 例：小/奶皮（¥15）只存了 { name: "大", values: ["大奶皮"], goods_id: 大/奶皮 }，
// 弹窗就只剩「大奶皮」，小规格点不了。这里补上本商品自己的那一项。

export interface CashierSpecAttr {
  name: string
  values: string[]
}

export interface CashierSpecSku {
  sku_sn?: string
  barcode?: string
  goods_id?: number
  sell_price?: number | null
  cost_price?: number | null
}

export interface CashierHostGoods {
  id: number
  goods_name: string
  goods_sn?: string
  barcode?: string
  unit_name?: string
  sell_price?: number | string | null
  cost_price?: number | string | null
  member_price?: number | string | null
}

export interface CashierSpecModel {
  attrs: CashierSpecAttr[]
  skus: Record<string, CashierSpecSku>
  /** 本商品被补进规格列表时为 true，加购时按 sku.goods_id 落到对应商品 */
  bindLinkedGoods: boolean
}

export interface SpecCartLine {
  goods_id: number
  goods_name: string
  goods_sn: string
  unit_name: string
  price: number
  cost_price: number
}

function toNumber(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

function roundMoney(value: number): number {
  return Math.round(value * 100) / 100
}

/** 规格展示名：去掉名称里的斜杠，和已保存的「大奶皮」对齐（来源是「大/奶皮」） */
export function normalizeSpecLabel(name: string): string {
  return String(name || '').replace(/[/／]/g, '').trim()
}

function specValues(values: unknown): string[] {
  if (Array.isArray(values)) {
    return values
      .map(item => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object' && 'label' in item) return String((item as { label?: unknown }).label ?? '')
        return ''
      })
      .map(item => item.trim())
      .filter(Boolean)
  }
  if (typeof values === 'string') {
    return values.split(/[,，]/).map(item => item.trim()).filter(Boolean)
  }
  return []
}

function positiveId(value: unknown): number {
  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : 0
}

function skuIsHost(sku: CashierSpecSku | undefined, hostId: number): boolean {
  if (!sku) return false
  const id = positiveId(sku.goods_id)
  // 规格设置里 goods_id 为 0 表示「本商品」
  if (!id) return true
  return id === hostId
}

function nameLooksLikeVariant(name: string, values: string[]): boolean {
  return !!name && values.every(value => value.startsWith(name) && name.length < value.length)
}

export function withHostSpecOption(host: CashierHostGoods, raw: { attrs?: unknown; skus?: unknown }): CashierSpecModel {
  const skus: Record<string, CashierSpecSku> = {}
  if (raw?.skus && typeof raw.skus === 'object' && !Array.isArray(raw.skus)) {
    for (const [key, value] of Object.entries(raw.skus as Record<string, CashierSpecSku>)) {
      if (value && typeof value === 'object') skus[key] = { ...value }
    }
  }

  const attrs: CashierSpecAttr[] = (Array.isArray(raw?.attrs) ? raw.attrs : [])
    .map((attr: any) => ({
      name: String(attr?.name ?? '').trim(),
      values: specValues(attr?.values),
    }))
    .filter(attr => attr.values.length > 0)

  const unchanged = (): CashierSpecModel => ({ attrs, skus, bindLinkedGoods: false })

  // 多维规格是笛卡尔积，往里面塞本商品会造出不存在的组合
  if (attrs.length !== 1) return unchanged()

  const hostId = positiveId(host?.id)
  const hostName = String(host?.goods_name || '').trim()
  const hostLabel = normalizeSpecLabel(hostName)
  if (!hostId || !hostLabel) return unchanged()

  const attr = attrs[0]
  const selfRepresented = attr.values.some(value => {
    if (skuIsHost(skus[value], hostId)) return true
    const normalized = normalizeSpecLabel(value)
    return value === hostName || normalized === hostLabel
  })
  const hasForeignSku = attr.values.some(value => {
    const id = positiveId(skus[value]?.goods_id)
    return id > 0 && id !== hostId
  })
  if (selfRepresented || !hasForeignSku || attr.values.includes(hostLabel)) return unchanged()

  skus[hostLabel] = {
    sku_sn: host.goods_sn || '',
    barcode: host.barcode || '',
    goods_id: hostId,
    sell_price: toNumber(host.sell_price),
    cost_price: toNumber(host.cost_price),
  }

  return {
    attrs: [{
      name: nameLooksLikeVariant(attr.name, attr.values) ? '规格' : (attr.name || '规格'),
      values: [hostLabel, ...attr.values],
    }],
    skus,
    bindLinkedGoods: true,
  }
}

export function resolveSpecCartLine(input: {
  host: CashierHostGoods
  specLabel: string
  sku: CashierSpecSku | null
  linkedGoods?: CashierHostGoods | null
  memberSelected?: boolean
  useLinkedIdentity?: boolean
}): SpecCartLine {
  const host = input.host
  const sku = input.sku
  const specLabel = String(input.specLabel || '').trim()
  const hostId = positiveId(host.id)

  if (!input.useLinkedIdentity) {
    const price = sku?.sell_price != null
      ? toNumber(sku.sell_price)
      : (input.memberSelected && toNumber(host.member_price) > 0 ? toNumber(host.member_price) : toNumber(host.sell_price))
    return {
      goods_id: hostId,
      goods_name: specLabel ? `${host.goods_name} · ${specLabel}` : host.goods_name,
      goods_sn: sku?.sku_sn || host.goods_sn || '',
      unit_name: host.unit_name || '',
      price: roundMoney(price),
      cost_price: roundMoney(sku?.cost_price != null ? toNumber(sku.cost_price) : toNumber(host.cost_price)),
    }
  }

  const linkedId = positiveId(sku?.goods_id)
  const goodsId = linkedId || hostId
  const hostLabel = normalizeSpecLabel(host.goods_name)
  const isHostLine = goodsId === hostId && specLabel === hostLabel
  let price = sku?.sell_price != null ? toNumber(sku.sell_price) : toNumber(host.sell_price)
  if (isHostLine && input.memberSelected && toNumber(host.member_price) > 0) {
    price = toNumber(host.member_price)
  }
  const linked = input.linkedGoods && positiveId(input.linkedGoods.id) === goodsId ? input.linkedGoods : null
  return {
    goods_id: goodsId,
    goods_name: isHostLine
      ? host.goods_name
      : (linked?.goods_name || (specLabel ? `${host.goods_name} · ${specLabel}` : host.goods_name)),
    goods_sn: isHostLine ? (host.goods_sn || '') : (linked?.goods_sn || sku?.sku_sn || ''),
    unit_name: isHostLine ? (host.unit_name || '') : (linked?.unit_name || host.unit_name || ''),
    price: roundMoney(price),
    cost_price: roundMoney(sku?.cost_price != null ? toNumber(sku.cost_price) : toNumber(linked?.cost_price ?? host.cost_price)),
  }
}
