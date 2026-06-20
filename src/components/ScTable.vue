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
        <el-button type="primary" :icon="Search" @click="handleSearch">{{ t('common.query') }}</el-button>
        <el-button :icon="Refresh" @click="handleReset">{{ t('common.reset') }}</el-button>
      </div>
    </div>

    <!-- 桌面端 Toolbar -->
    <div v-if="!isMobile" class="sc-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar" />
      </div>
      <!-- 桌面端右侧操作 -->
      <div v-if="!isMobile" class="toolbar-right">
        <div v-if="$slots['toolbar-right']" class="toolbar-right-top">
          <slot name="toolbar-right" />
        </div>
        <div class="toolbar-right-btns">
        <el-tooltip :content="t('scTable.importExcel')">
          <el-upload
            v-if="importApi || importPath"
            :show-file-list="false"
            accept=".xlsx,.xls,.csv"
            :before-upload="handleImport"
            style="display:inline-block"
          >
            <el-button :icon="Upload" size="small">{{ t('common.import') }}</el-button>
          </el-upload>
        </el-tooltip>
        <el-tooltip :content="selectedRows.length > 0 ? t('scTable.exportSelected', { count: selectedRows.length }) : t('scTable.exportAll')">
          <el-button :icon="Download" size="small" @click="handleExport">
            {{ t('common.export') }}{{ selectedRows.length > 0 ? `(${selectedRows.length})` : '' }}
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
        >{{ t('scTable.batchDelete', { count: selectedRows.length }) }}</el-button>
        <el-tooltip :content="t('common.refresh')">
          <el-button :icon="Refresh" circle size="small" @click="refresh" style="margin-left:4px" />
        </el-tooltip>
        </div>
      </div>
    </div>

    <!-- Table（桌面端） / 自动卡片列表（移动端） -->
    <div v-if="isMobile" class="mobile-list" v-loading="loading">
      <!-- 优先用自定义 mobile slot，否则自动生成卡片 -->
      <template v-if="$slots.mobile">
        <slot name="mobile" :rows="tableData" :loading="loading" />
      </template>
      <template v-else>
        <div v-if="!loading && !tableData.length" class="mobile-empty">{{ t('common.noData') }}</div>
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
      {{ t('scTable.selectedPrefix') }} <strong>{{ selectedRows.length }}</strong> {{ t('common.items') }}
      <el-button type="primary" link size="small" @click="clearSelection">{{ t('scTable.cancelSelection') }}</el-button>
    </div>

    <!-- Pagination -->
    <div v-if="total > 0 && tableData.length < total" class="sc-pagination">
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
      :title="t('scTable.importPreview')"
      width="80%"
      append-to-body
      destroy-on-close
    >
      <div style="margin-bottom:12px;font-size:13px;color:#86909c">
        {{ t('scTable.importPreviewTip', { count: importPreviewData.length }) }}
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
        {{ t('scTable.importPreviewLimit', { count: importPreviewData.length }) }}
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="importLoading" @click="confirmImport">{{ t('scTable.confirmImport') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, onActivated, useSlots, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Refresh, Delete, Download, Upload } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

const { t, locale } = useI18n()

const checkMobile = () => window.innerWidth < 768
const isMobile = ref(checkMobile())
const onResize = () => { isMobile.value = checkMobile() }

interface Props {
  apiObj: (params: any) => Promise<any>
  params?: Record<string, any>
  defaultPageSize?: number
  rowFilter?: (row: any) => boolean
  sortBy?: string
  sortDesc?: boolean
  /** POST function for batch delete — receives { ids: number[] } */
  batchDelApi?: (data: { ids: number[] }) => Promise<any>
  /** API path string for batch delete, e.g. "/shop/ShopCustomer/batchDel" — alternative to batchDelApi */
  delPath?: string
  /** Whether records have an audit workflow — when false (default), status=1 does NOT block deletion */
  hasAudit?: boolean
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
  exportFileName: '',
})

const emit = defineEmits<{
  (e: 'selection-change', val: any[]): void
  (e: 'reset'): void
}>()

const slots = useSlots()
const exportBaseName = computed(() => props.exportFileName || t('scTable.exportFileName'))

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const searchParams = ref<Record<string, any>>({})
const selectedRows = ref<any[]>([])
const elTableRef = ref<any>()
const initialParams = ref<Record<string, any>>({})

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
          if (isActionLabel(p.label) || isIndexLabel(p.label)) continue
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
        if (isIndexLabel(p?.label)) continue
        if (p?.label) {
          result.push({
            prop: p.prop ?? '',
            label: p.label,
            isAction: isActionLabel(p.label),
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

function isActionLabel(label: any) {
  return label === '相关操作' || label === '操作' || label === t('common.operation') || label === t('scTable.relatedActions')
}

function isIndexLabel(label: any) {
  return label === '序号' || label === t('scTable.index')
}

// ── Data loading ─────────────────────────────────────────────────────────────
async function loadData() {
  loading.value = true
  try {
    const cleanParams = (obj: Record<string, any>) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined))

    // 后端不支持排序参数，有 sortBy 时拉全量数据前端排序+分页
    const useFrontendSort = !!props.sortBy
    const res: any = await props.apiObj({
      page: useFrontendSort ? 1 : currentPage.value,
      list_rows: useFrontendSort ? 10000 : pageSize.value,
      ...cleanParams(props.params),
      ...cleanParams(searchParams.value),
    })
    const data = res?.data || res
    const dedup = (rows: any[]) => {
      const seen = new Set()
      return rows.filter(r => { const k = r.id ?? r.goods_id ?? JSON.stringify(r); return seen.has(k) ? false : seen.add(k) })
    }
    const sortFn = (a: any, b: any) => {
      const va = a[props.sortBy!] ?? '', vb = b[props.sortBy!] ?? ''
      const cmp = va < vb ? -1 : va > vb ? 1 : 0
      return props.sortDesc ? -cmp : cmp
    }
    if (Array.isArray(data)) {
      let rows = dedup(props.rowFilter ? data.filter(props.rowFilter) : data)
      if (useFrontendSort) rows = [...rows].sort(sortFn)
      total.value = rows.length
      tableData.value = useFrontendSort
        ? rows.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
        : rows
    } else {
      let rows = dedup(data?.rows || data?.list || data?.data || [])
      if (props.rowFilter) rows = rows.filter(props.rowFilter)
      if (useFrontendSort) {
        rows = [...rows].sort(sortFn)
        total.value = data?.total || rows.length
        tableData.value = rows.slice((currentPage.value - 1) * pageSize.value, currentPage.value * pageSize.value)
      } else {
        tableData.value = rows
        total.value = props.rowFilter ? rows.length : (data?.total || 0)
      }
    }
  } catch {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

// ── Search / pagination ───────────────────────────────────────────────────────
function handleSearch() { currentPage.value = 1; loadData() }
function handleReset() {
  searchParams.value = {}
  if (props.params && typeof props.params === 'object') {
    const init = initialParams.value
    Object.keys(props.params).forEach(k => {
      const v = init[k]
      props.params[k] = (v === undefined ? null : Array.isArray(v) ? [] : typeof v === 'string' ? '' : v === null ? null : v)
    })
  }
  currentPage.value = 1
  emit('reset')
  loadData()
}
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
  if (!ids.length) { ElMessage.warning(t('scTable.selectRowsToDelete')); return }
  // 拦截已审核记录（仅限有审核流的模块）
  if (props.hasAudit) {
    const auditedRows = selectedRows.value.filter((r: any) => Number(r.status) === 1)
    if (auditedRows.length) {
      ElMessage.error(t('scTable.auditedRowsDeleteBlocked', { count: auditedRows.length }))
      return
    }
  }
  await ElMessageBox.confirm(
    t('scTable.confirmBatchDeleteMessage', { count: ids.length }),
    t('scTable.batchDeleteTitle'),
    { type: 'warning', confirmButtonText: t('scTable.confirmDelete'), cancelButtonText: t('common.cancel'), confirmButtonClass: 'el-button--danger' }
  )
  try {
    if (props.batchDelApi) {
      await props.batchDelApi({ ids })
    } else if (props.delPath) {
      await http.post(props.delPath, { ids })
    }
    ElMessage.success(t('scTable.deleteSuccess', { count: ids.length }))
    clearSelection()
    refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('common.deleteFailed'))
  }
}

// ── Export ────────────────────────────────────────────────────────────────────
async function handleExport() {
  const XLSX = await import('xlsx')
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
      ElMessage.error(t('scTable.exportFetchFailed'))
      return
    }
  }

  if (!rows.length) { ElMessage.warning(t('scTable.noExportData')); return }

  // Determine columns: use detected map keys (in order), or fall back to all row keys
  const detectedCols = Object.keys(colMap)
  const allKeys = detectedCols.length > 0
    ? detectedCols.filter(k => !skipKeys.has(k))
    : Object.keys(rows[0]).filter(k => !skipKeys.has(k))

  // Check if rows contain goods_info — expand each item as a separate row
  const hasGoods = rows.some(r => r.goods_info)
  const goodsCols = hasGoods
    ? [
        ['goods_name', t('scTable.goodsName')],
        ['goods_sn', t('scTable.goodsCode')],
        ['spec', t('scTable.spec')],
        ['unit_name', t('scTable.unit')],
        ['num', t('scTable.quantity')],
        ['price', t('scTable.unitPrice')],
      ]
    : []

  // Build sheet with localized headers
  const sheetData: Record<string, any>[] = []
  for (const row of rows) {
    const base: Record<string, any> = {}
    allKeys.forEach(k => {
      if (k === 'goods_info') return
      const header = colMap[k] || k
      let val = row[k] ?? ''
      if (k === 'status') val = val == 1 ? t('common.audited') : val == 2 ? t('scTable.rejected') : val == 4 ? t('scTable.converted') : t('common.pending')
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
            line[t('common.subtotal')] = ((Number(item.num) || 0) * (Number(item.price) || 0)).toFixed(2)
            sheetData.push(line)
          }
          continue
        }
      } catch {}
    }
    if (hasGoods) goodsCols.forEach(([, label]) => { base[label] = '' })
    if (hasGoods) base[t('common.subtotal')] = ''
    sheetData.push(base)
  }

  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.json_to_sheet(sheetData)
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  const suffix = selectedRows.value.length > 0 ? t('scTable.exportSelectedSuffix', { count: selectedRows.value.length }) : ''
  XLSX.writeFile(wb, `${exportBaseName.value}${suffix}_${new Date().toLocaleDateString(locale.value === 'en-US' ? 'en-US' : 'zh-CN').replace(/\//g, '-')}.xlsx`)
  ElMessage.success(t('scTable.exportSuccess', { count: rows.length }))
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
    if (!json.length) { ElMessage.warning(t('scTable.emptyExcel')); return }
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
  ElMessage.success(t('scTable.importComplete', { success, failed, failedText: failed > 0 ? t('scTable.importFailedPart', { failed }) : '' }))
  refresh()
}

// ── Expose ────────────────────────────────────────────────────────────────────
defineExpose({ refresh, loadData, tableData, searchParams, selectedRows })

onMounted(() => {
  if (props.params && typeof props.params === 'object') {
    initialParams.value = JSON.parse(JSON.stringify(props.params))
  }
  isMobile.value = checkMobile(); loadData(); window.addEventListener('resize', onResize)
})
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
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}
.toolbar-right-top {
  display: flex;
  justify-content: flex-end;
}
.toolbar-right-btns {
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
  margin-bottom: 8px;
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
