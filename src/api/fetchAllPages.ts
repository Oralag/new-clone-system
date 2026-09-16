/** Fetch a complete list or reject; partial pages must never become financial totals. */
export async function fetchAllPages(fetchPage: (params: any) => Promise<any>, params: Record<string, any> = {}) {
  const rows: any[] = []
  const seen = new Set<string>()
  let expectedTotal: number | undefined
  let pageSize = 500
  for (let page = 1; page <= 10000; page++) {
    const response = await fetchPage({ ...params, page, list_rows: pageSize })
    if (response?.code !== 1) throw new Error(response?.message || '列表加载失败')
    const data = response.data
    const batch = data?.rows ?? data?.list
    if (!Array.isArray(batch)) throw new Error('列表响应格式不正确')
    const total = data?.total == null ? undefined : Number(data.total)
    if (total !== undefined && (!Number.isSafeInteger(total) || total < 0)) throw new Error('列表总数无效')
    if (page === 1) {
      expectedTotal = total
      // Some backends enforce a page-size cap. Honor their actual page size.
      const actualSize = Number(data.list_rows)
      if (Number.isSafeInteger(actualSize) && actualSize > 0) pageSize = actualSize
      else if (total !== undefined && total > batch.length && batch.length > 0) pageSize = batch.length
    } else if (total !== expectedTotal) throw new Error('加载期间数据发生变化，请重新加载')
    for (const row of batch) {
      if (row.id == null) throw new Error('列表记录缺少 ID')
      const id = String(row.id)
      if (seen.has(id)) throw new Error('分页数据重复，请重新加载')
      seen.add(id)
      rows.push(row)
    }
    if (expectedTotal !== undefined) {
      if (rows.length === expectedTotal) return { code: 1, data: { rows, total: rows.length } }
      if (!batch.length || rows.length > expectedTotal) throw new Error('列表数据不完整，请重新加载')
    } else if (batch.length < pageSize) return { code: 1, data: { rows, total: rows.length } }
  }
  throw new Error('列表分页超出范围，未生成统计')
}
