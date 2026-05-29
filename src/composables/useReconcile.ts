import { ref, watch } from 'vue'

export function useReconcile(storageKey: string, tableRef: any) {
  const ids = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem(storageKey) || '[]')))

  // 每次表格数据加载/刷新后，恢复 _reconciled 标记
  watch(
    () => tableRef.value?.tableData,
    (rows: any[]) => {
      if (!rows?.length) return
      rows.forEach((row: any) => {
        if (ids.value.has(row.id)) row._reconciled = true
      })
    },
    { immediate: true }
  )

  function toggle(row: any) {
    row._reconciled = !row._reconciled
    if (row._reconciled) ids.value.add(row.id)
    else ids.value.delete(row.id)
    localStorage.setItem(storageKey, JSON.stringify([...ids.value]))
  }

  return { toggle }
}
