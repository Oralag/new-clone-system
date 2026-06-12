import { ref, watch } from 'vue'

export function useReconcile(storageKey: string, tableRef: any) {
  const ids = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')))

  function spliceRow(tableData: any[], idx: number, reconciled: boolean) {
    tableData.splice(idx, 1, { ...tableData[idx], _reconciled: reconciled })
  }

  // 每次表格数据加载/刷新后，用 splice 替换需要恢复的行，让 el-table 重新算 row-class-name
  watch(
    () => tableRef.value?.tableData,
    (rows: any[]) => {
      if (!rows?.length) return
      for (let i = rows.length - 1; i >= 0; i--) {
        if (ids.value.has(rows[i].id) && !rows[i]._reconciled) {
          spliceRow(rows, i, true)
        }
      }
    },
    { immediate: true }
  )

  function toggle(row: any) {
    const newVal = !row._reconciled
    if (newVal) ids.value.add(row.id)
    else ids.value.delete(row.id)
    localStorage.setItem(storageKey, JSON.stringify([...ids.value]))

    const tableData = tableRef.value?.tableData
    if (tableData) {
      const idx = tableData.findIndex((r: any) => r.id === row.id)
      if (idx !== -1) spliceRow(tableData, idx, newVal)
    }
  }

  // 包装 API 函数以支持"未核对"客户端筛选
  // filterField: 哪个 params 字段携带 'unreconciled' 值（默认 'status'）
  function createFilteredApi(apiFn: (...args: any[]) => Promise<any>, filterField = 'status') {
    return async (params: any) => {
      const filterVal = params?.[filterField]
      if (filterVal !== 'unreconciled') return apiFn(params)
      // 不把 'unreconciled' 传给后端，同时拉全量数据做客户端筛选
      const cleanParams = { ...params, [filterField]: undefined, list_rows: 10000, page: 1 }
      const res = await apiFn(cleanParams)
      const allRows: any[] = res.data?.rows ?? res.data?.list ?? []
      const filtered = allRows.filter((r: any) => !ids.value.has(Number(r.id)))
      const hasRowsKey = res.data?.rows !== undefined
      return {
        ...res,
        data: {
          ...(res.data || {}),
          ...(hasRowsKey ? { rows: filtered } : { list: filtered }),
          total: filtered.length,
        },
      }
    }
  }

  return { toggle, ids, createFilteredApi }
}
