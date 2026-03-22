<template>
  <div class="sc-table">
    <!-- Search bar + Toolbar（移动端合并一行） -->
    <div v-if="isMobile" class="sc-mobile-bar">
      <div class="mobile-search-row">
        <slot name="search" />
        <el-button type="primary" :icon="Search" @click="handleSearch" style="flex-shrink:0" />
      </div>
      <div class="mobile-toolbar-row">
        <slot name="toolbar" />
        <el-button :icon="Refresh" circle size="small" @click="refresh" style="margin-left:auto" />
      </div>
    </div>

    <!-- 桌面端 Search bar -->
    <div v-else-if="$slots.search" class="sc-search">
      <slot name="search" />
      <div class="search-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- 桌面端 Toolbar -->
    <div v-if="!isMobile" class="sc-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar" />
      </div>
      <!-- 桌面端右侧操作 -->
      <div v-if="!isMobile" class="toolbar-right">
        <el-tooltip content="导入Excel">
          <el-upload
            v-if="importApi || importPath"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :before-upload="handleImport"
            style="display:inline-block"
          >
            <el-button :icon="Upload" size="small">导入</el-button>
          </el-upload>
        </el-tooltip>
        <el-tooltip :content="selectedRows.length > 0 ? `导出已选 ${selectedRows.length} 条` : '导出全部数据'">
          <el-button :icon="Download" size="small" @click="handleExport">
            导出{{ selectedRows.length > 0 ? `(${selectedRows.length})` : '' }}
          </el-button>
        </el-tooltip>
        <slot
          v-if="selectedRows.length > 0"
          name="selection-actions"
          :selected-rows="selectedRows"
          :clear-selection="clearSelection"
          :refresh="refresh"
        />
        <el-button
          v-if="selectedRows.length > 0 && (batchDelApi || delPath)"
          type="danger"
          :icon="Delete"
          size="small"
          @click="handleBatchDelete"
        >批量删除({{ selectedRows.length }})</el-button>
        <el-tooltip content="刷新">
          <el-button :icon="Refresh" circle size="small" @click="refresh" style="margin-left:4px" />
        </el-tooltip>
      </div>
    </div>

    <!-- Table（桌面端） / 自动卡片列表（移动端） -->
    <div v-if="isMobile" class="mobile-list" v-loading="loading">
      <!-- 优先用自定义 mobile slot，否则自动生成卡片 -->
      <template v-if="$slots.mobile">
        <slot name="mobile" :rows="tableData" :loading="loading" />
      </template>
      <template v-else>
        <div v-if="!loading && !tableData.length" class="mobile-empty">暂无数据</div>
        <div v-for="row in tableData" :key="row.id ?? row.goods_id ?? JSON.stringify(row)" class="m-auto-card">
          <!-- 标题行：第一个有 prop 的列 -->
          <div class="m-auto-card__title">
            <component :is="() => {
              const first = mobileColumns.find(c => !c.isAction)
              if (!first) return '-'
              return renderColSlot(first.vnode, row) ?? (first.prop ? getCellValue(row, first.prop) : '-')
            }" />
          </div>
          <!-- 字段行：跳过第一列和操作列 -->
          <template v-for="col in mobileColumns.slice(1).filter(c => !c.isAction && (c.prop || c.vnode?.children?.default))" :key="col.prop || col.label">
            <div class="m-auto-card__row">
              <span class="m-auto-card__label">{{ col.label }}</span>
              <span class="m-auto-card__value">
                <component :is="() => renderColSlot(col.vnode, row) ?? (col.prop ? getCellValue(row, col.prop) : '-')" />
              </span>
            </div>
          </template>
          <!-- 操作列 -->
          <div v-if="mobileColumns.find(c => c.isAction)" class="m-auto-card__actions">
            <component :is="() => renderColSlot(mobileColumns.find(c => c.isAction)!.vnode, row)" />
          </div>
        </div>
      </template>
    </div>
    <div v-else class="table-scroll-wrap">
      <el-table
        ref="elTableRef"
        v-loading="loading"
        :data="tableData"
        v-bind="$attrs"
        border
        stripe
        style="width: 100%"
        @selection-change="handleSelectionChange"
      >
        <!-- Checkbox column always first -->
        <el-table-column type="selection" width="50" align="center" />
        <slot />
      </el-table>
    </div>

    <!-- Selected info bar — shown only when rows are selected -->
    <div v-if="selectedRows.length > 0" class="selected-bar">
      已选 <strong>{{ selectedRows.length }}</strong> 条
      <el-button type="primary" link size="small" @click="clearSelection">取消选择</el-button>
    </div>

    <!-- Pagination -->
    <div v-if="total > 0" class="sc-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100, 200]"
        :layout="isMobile ? 'prev, pager, next' : 'total, sizes, prev, pager, next, jumper'"
        :pager-count="isMobile ? 5 : 7"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- Import preview dialog -->
    <el-dialog
      v-model="importDialogVisible"
      title="导入预览"
      width="80%"
      append-to-body
      destroy-on-close
    >
      <div style="margin-bottom:12px;font-size:13px;color:#86909c">
        共 {{ importPreviewData.length }} 条数据，请确认后点击确认导入。
      </div>
      <el-table :data="importPreviewData.slice(0, 20)" border size="small" max-height="400">
        <el-table-column
          v-for="col in importColumns"
          :key="col"
          :prop="col"
          :label="col"
          min-width="120"
          show-overflow-tooltip
        />
      </el-table>
      <div v-if="importPreviewData.length > 20" style="margin-top:8px;font-size:12px;color:#86909c">
        仅显示前20条，实际导入全部 {{ importPreviewData.length }} 条。
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="importLoading" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, onActivated, useSlots } from 'vue'
import { Search, Refresh, Delete, Download, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as XLSX from 'xlsx'
import http from '@/api/http'

const checkMobile = () => window.innerWidth < 768
const isMobile = ref(checkMobile())
const onResize = () => { isMobile.value = checkMobile() }

interface Props {
  apiObj: (params: any) => Promise<any>
  params?: Record<string, any>
  defaultPageSize?: number
  rowFilter?: (row: any) => boolean
  sortBy?: string
  /** POST function for batch delete — receives { ids: number[] } */
  batchDelApi?: (data: { ids: number[] }) => Promise<any>
  /** API path string for batch delete, e.g. "/shop/ShopCustomer/batchDel" — alternative to batchDelApi */
  delPath?: string
  /** POST function for creating a record — used for import */
  importApi?: (data: any) => Promise<any>
  /** API path string for import — alternative to importApi */
  importPath?: string
  /** Excel filename used when exporting */
  exportFileName?: string
  /** Column labels map for export: { prop: label } — overrides auto-detection */
  exportColumns?: Record<string, string>
}

const props = withDefaults(defineProps<Props>(), {
  params: () => ({}),
  defaultPageSize: 20,
  exportFileName: '导出数据',
})

const emit = defineEmits<{
  (e: 'selection-change', val: any[]): void
}>()

const slots = useSlots()

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const searchParams = ref<Record<string, any>>({})
const selectedRows = ref<any[]>([])
const elTableRef = ref<any>()

// ── Auto-detect column prop→label from slot vnodes ────────────────────────────
function getColumnMap(): Record<string, string> {
  if (props.exportColumns && Object.keys(props.exportColumns).length) return props.exportColumns
  const map: Record<string, string> = {}
  try {
    const vnodes = slots.default?.() ?? []
    const walk = (nodes: any[]) => {
      for (const vn of nodes) {
        if (!vn) continue
        const p = vn.props
        if (p?.label) {
          // Skip special columns
          const t = p.type
          if (t === 'index' || t === 'selection' || t === 'expand') continue
          if (p.label === '操作' || p.label === '序号') continue
          if (p.prop) {
            map[p.prop] = p.label
          } else if (p['export-key']) {
            map[p['export-key']] = p.label
          }
        }
        if (vn.children?.default) {
          try { walk(vn.children.default()) } catch {}
        }
        if (Array.isArray(vn.children)) walk(vn.children)
      }
    }
    walk(vnodes)
  } catch {}
  return map
}

// ── 移动端列定义解析 ────────────────────────────────────────────────────────────
interface ColDef { prop: string; label: string; isAction: boolean; vnode: any }

const mobileColumns = computed<ColDef[]>(() => {
  const result: ColDef[] = []
  try {
    const vnodes = slots.default?.() ?? []
    const walk = (nodes: any[]) => {
      for (const vn of nodes) {
        if (!vn) continue
        const p = vn.props
        // 跳过 selection / index 列
        if (p?.type === 'selection' || p?.type === 'index') continue
        if (p?.label === '序号') continue
        if (p?.label) {
          result.push({
            prop: p.prop ?? '',
            label: p.label,
            isAction: p.label === '相关操作' || p.label === '操作',
            vnode: vn,
          })
        }
        if (Array.isArray(vn.children)) walk(vn.children)
      }
    }
    walk(vnodes)
  } catch {}
  return result
})

// 渲染某列的 default slot（用于操作列按钮）
function renderColSlot(colVnode: any, row: any): any {
  try {
    // 兼容多种 vnode children 结构
    const children = colVnode.children
    let defaultSlot: any = null
    if (children) {
      if (typeof children.default === 'function') {
        defaultSlot = children.default
      } else if (typeof children === 'function') {
        defaultSlot = children
      } else if (children.default && typeof children.default === 'object') {
        // 编译后可能是对象
        defaultSlot = children.default
      }
    }
    if (typeof defaultSlot === 'function') {
      const result = defaultSlot({ row })
      // 如果返回的是空数组或 null，返回 null 让外层降级到 prop
      if (result === null || result === undefined) return null
      if (Array.isArray(result) && result.length === 0) return null
      return result
    }
  } catch {}
  return null
}

// 从行数据取值，支持点分路径
function getCellValue(row: any, prop: string): any {
  if (!prop) return ''
  const val = prop.split('.').reduce((o, k) => o?.[k], row)
  if (val === null || val === undefined || val === '') return '-'
  return val
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const cleanParams = (obj: Record<string, any>) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined))

    const res: any = await props.apiObj({
      page: currentPage.value,
      list_rows: pageSize.value,
      ...cleanParams(props.params),
      ...cleanParams(searchParams.value),
    })
    const data = res?.data || res
    const dedup = (rows: any[]) => {
      const seen = new Set()
      return rows.filter(r => { const k = r.id ?? r.goods_id ?? JSON.stringify(r); return seen.has(k) ? false : seen.add(k) })
    }
    if (Array.isArray(data)) {
      let rows = dedup(props.rowFilter ? data.filter(props.rowFilter) : data)
      if (props.sortBy) rows = [...rows].sort((a, b) => (a[props.sortBy!] ?? 0) - (b[props.sortBy!] ?? 0))
      tableData.value = rows
      total.value = rows.length
    } else {
      let rows = dedup(data?.rows || data?.list || data?.data || [])
      if (props.rowFilter) rows = rows.filter(props.rowFilter)
      if (props.sortBy) rows = [...rows].sort((a: any, b: any) => (a[props.sortBy!] ?? 0) - (b[props.sortBy!] ?? 0))
      tableData.value = rows
      total.value = data?.total || 0
    }
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

// ── Search / pagination ───────────────────────────────────────────────────────
function handleSearch() { currentPage.value = 1; loadData() }
function handleReset() { searchParams.value = {}; currentPage.value = 1; loadData() }
function handleSizeChange() { currentPage.value = 1; loadData().then(scrollToTop) }
function handleCurrentChange() { loadData().then(scrollToTop) }
function refresh() { loadData() }

function scrollToTop() {
  if (window.innerWidth < 768) {
    nextTick(() => {
      // 直接找最近的可滚动祖先
      const el = document.querySelector('.page-content') as HTMLElement | null
      if (el) el.scrollTop = 0
    })
  }
}

// ── Selection ─────────────────────────────────────────────────────────────────
function handleSelectionChange(val: any[]) {
  selectedRows.value = val
  emit('selection-change', val)
}
function clearSelection() {
  elTableRef.value?.clearSelection()
}

// ── Batch delete ──────────────────────────────────────────────────────────────
async function handleBatchDelete() {
  const ids = selectedRows.value.map((r: any) => r.id).filter(Boolean)
  if (!ids.length) { ElMessage.warning('请先勾选要删除的记录'); return }
  // 拦截已审核记录
  const auditedRows = selectedRows.value.filter((r: any) => Number(r.status) === 1)
  if (auditedRows.length) {
    ElMessage.error(`选中的 ${auditedRows.length} 条记录已审核，请先反审核后再删除`)
    return
  }
  await ElMessageBox.confirm(
    `确定要删除选中的 ${ids.length} 条记录吗？此操作不可恢复。`,
    '批量删除',
    { type: 'warning', confirmButtonText: '确定删除', cancelButtonText: '取消', confirmButtonClass: 'el-button--danger' }
  )
  try {
    if (props.batchDelApi) {
      await props.batchDelApi({ ids })
    } else if (props.delPath) {
      await http.post(props.delPath, { ids })
    }
    ElMessage.success(`已删除 ${ids.length} 条记录`)
    clearSelection()
    refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '删除失败')
  }
}

// ── Export ────────────────────────────────────────────────────────────────────
async function handleExport() {
  const colMap = getColumnMap()
  const skipKeys = new Set(['created_at', 'updated_at', 'password', 'token', 'id'])

  let rows: any[] = []

  // If rows are selected, export only those; otherwise fetch all
  if (selectedRows.value.length > 0) {
    rows = selectedRows.value
  } else {
    try {
      const cleanParams = (obj: Record<string, any>) =>
        Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined))
      const res: any = await props.apiObj({
        page: 1,
        list_rows: 10000,
        ...cleanParams(props.params),
        ...cleanParams(searchParams.value),
      })
      const data = res?.data || res
      rows = Array.isArray(data) ? data : (data?.rows || data?.list || data?.data || [])
    } catch {
      ElMessage.error('获取导出数据失败')
      return
    }
  }

  if (!rows.length) { ElMessage.warning('暂无数据可导出'); return }

  // Determine columns: use detected map keys (in order), or fall back to all row keys
  const detectedCols = Object.keys(colMap)
  const allKeys = detectedCols.length > 0
    ? detectedCols.filter(k => !skipKeys.has(k))
    : Object.keys(rows[0]).filter(k => !skipKeys.has(k))

  // Check if rows contain goods_info — expand each item as a separate row
  const hasGoods = rows.some(r => r.goods_info)
  const goodsCols = hasGoods
    ? [['goods_name', '商品名称'], ['goods_sn', '商品编码'], ['spec', '规格'], ['unit_name', '单位'], ['num', '数量'], ['price', '单价']]
    : []

  // Build sheet with Chinese headers
  const sheetData: Record<string, any>[] = []
  for (const row of rows) {
    const base: Record<string, any> = {}
    allKeys.forEach(k => {
      if (k === 'goods_info') return
      const header = colMap[k] || k
      let val = row[k] ?? ''
      if (k === 'status') val = val == 1 ? '已审核' : val == 2 ? '已驳回' : val == 4 ? '已转单' : '待审核'
      base[header] = val
    })
    if (hasGoods && row.goods_info) {
      try {
        const items = JSON.parse(row.goods_info)
        if (Array.isArray(items) && items.length) {
          for (const item of items) {
            const line = { ...base }
            for (const [key, label] of goodsCols) {
              line[label] = item[key] ?? ''
            }
            line['小计'] = ((Number(item.num) || 0) * (Number(item.price) || 0)).toFixed(2)
            sheetData.push(line)
          }
          continue
        }
      } catch {}
    }
    if (hasGoods) goodsCols.forEach(([, label]) => { base[label] = '' })
    if (hasGoods) base['小计'] = ''
    sheetData.push(base)
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sheetData)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const suffix = selectedRows.value.length > 0 ? `(已选${selectedRows.value.length}条)` : ''
  XLSX.writeFile(wb, `${props.exportFileName}${suffix}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
  ElMessage.success(`已导出 ${rows.length} 条数据`)
}

// ── Import ────────────────────────────────────────────────────────────────────
const importDialogVisible = ref(false)
const importPreviewData = ref<any[]>([])
const importColumns = ref<string[]>([])
const importLoading = ref(false)

function handleImport(file: File): boolean {
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer)
    const wb = XLSX.read(data, { type: 'array' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' })
    if (!json.length) { ElMessage.warning('Excel文件无数据'); return }
    importPreviewData.value = json
    importColumns.value = Object.keys(json[0])
    importDialogVisible.value = true
  }
  reader.readAsArrayBuffer(file)
  return false // prevent default upload
}

async function confirmImport() {
  if (!props.importApi && !props.importPath) return
  importLoading.value = true
  let success = 0
  let failed = 0
  for (const row of importPreviewData.value) {
    try {
      if (props.importApi) {
        await props.importApi(row)
      } else if (props.importPath) {
        await http.post(props.importPath, row)
      }
      success++
    } catch {
      failed++
    }
  }
  importLoading.value = false
  importDialogVisible.value = false
  ElMessage.success(`导入完成：成功 ${success} 条${failed > 0 ? `，失败 ${failed} 条` : ''}`)
  refresh()
}

// ── Expose ────────────────────────────────────────────────────────────────────
defineExpose({ refresh, loadData, tableData, searchParams, selectedRows })

onMounted(() => { isMobile.value = checkMobile(); loadData(); window.addEventListener('resize', onResize) })
onActivated(() => { isMobile.value = checkMobile() })
onUnmounted(() => { window.removeEventListener('resize', onResize) })

watch(
  () => props.params,
  () => { currentPage.value = 1; loadData() },
  { deep: true },
)
</script>

<style scoped>
.sc-table {
  background: var(--card-bg);
  border-radius: 8px;
  padding: 16px;
}

.sc-search {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 12px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sc-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  align-items: center;
}

.toolbar-right {
  display: flex;
  align-items: center;
  gap: 4px;
}

.selected-bar {
  margin-top: 8px;
  padding: 6px 12px;
  background: #e8f3ff;
  border-radius: 4px;
  font-size: 13px;
  color: #165dff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.sc-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

@media (max-width: 767px) {
  .sc-table {
    padding: 10px;
  }

  /* 移动端搜索+新增合并区域 */
  .sc-mobile-bar {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 10px;
  }
  .mobile-search-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .mobile-search-row :deep(.el-input),
  .mobile-search-row :deep(.el-select) {
    flex: 1;
    min-width: 0;
  }
  .mobile-toolbar-row {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
  }

  /* 表格横向滚动容器，不影响页面整体宽度 */
  .table-scroll-wrap {
    overflow-x: auto;
    overflow-y: visible;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.el-table) {
    min-width: 480px;
  }

  .mobile-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding-bottom: calc(60px + env(safe-area-inset-bottom, 0px) + 12px);
  }
  .mobile-empty {
    text-align: center;
    padding: 32px 0;
    color: var(--dim);
    font-size: 13px;
  }

  /* 自动生成的移动端卡片 */
  .m-auto-card {
    background: var(--card-bg);
    border-radius: 16px;
    padding: 14px 16px;
    border: 1px solid var(--border);
    box-shadow: 0 1px 6px rgba(0,0,0,0.05);
  }
  .m-auto-card__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--dark);
    margin-bottom: 10px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-auto-card__row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 3px 0;
    font-size: 13px;
  }
  .m-auto-card__label {
    color: var(--dim);
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
    margin-right: 8px;
  }
  .m-auto-card__value {
    color: var(--dark);
    font-weight: 500;
    text-align: right;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .m-auto-card__actions {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-top: 10px;
    padding-top: 10px;
    border-top: 1px solid var(--border);
    flex-wrap: wrap;
  }

  /* 分页：固定在底部导航栏上方，不被遮挡 */
  .sc-pagination {
    position: sticky;
    bottom: calc(60px + env(safe-area-inset-bottom, 0px));
    justify-content: center;
    background: var(--gray);
    padding: 10px 0;
    margin: 0 -10px;
    z-index: 10;
  }
}
</style>
