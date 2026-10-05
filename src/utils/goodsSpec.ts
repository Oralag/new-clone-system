// goods.spec 既是用户填的「规格」文字，也兼作多单位关联成品 / 多规格 SKU 的 JSON 存储。
// 约定：没有有效内部数据时只存纯文字；有内部数据时存 JSON，并在 text 字段保留用户填的规格文字。

export type SpecMeta = Record<string, any>

function parseJson(raw: unknown): SpecMeta | null {
  const s = String(raw ?? '').trim()
  if (!s.startsWith('{')) return null
  try {
    const obj = JSON.parse(s)
    return obj && typeof obj === 'object' && !Array.isArray(obj) ? obj : null
  } catch { return null }
}

/** 用户可见的规格文字 */
export function specText(raw: unknown): string {
  const obj = parseJson(raw)
  if (obj) return typeof obj.text === 'string' ? obj.text : ''
  const s = String(raw ?? '').trim()
  return s.startsWith('[') ? '' : s
}

/** 内部数据（unit_linked_goods / attrs / skus），不含 text */
export function specMeta(raw: unknown): SpecMeta {
  const obj = parseJson(raw)
  if (!obj) return {}
  const { text: _text, ...meta } = obj
  return meta
}

function isEmptyValue(v: any): boolean {
  if (v == null) return true
  if (Array.isArray(v)) return v.length === 0
  if (typeof v === 'object') return Object.keys(v).length === 0
  return false
}

/** 组合回写到 goods.spec：内部数据为空时只存文字，避免把规格文字冲成 {"unit_linked_goods":{}} */
export function composeSpec(text: unknown, meta: SpecMeta = {}): string {
  const clean: SpecMeta = {}
  for (const [k, v] of Object.entries(meta || {})) if (!isEmptyValue(v)) clean[k] = v
  const t = String(text ?? '').trim()
  if (!Object.keys(clean).length) return t
  return JSON.stringify(t ? { ...clean, text: t } : clean)
}
