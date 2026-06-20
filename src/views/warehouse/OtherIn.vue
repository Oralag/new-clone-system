<template>
  <div class="other-in-page">

    <!-- ══════════════════════ 列表视图 ══════════════════════ -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/stock/OtherIn/batchDel"
          export-file-name="其他入库" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.in_no" :placeholder="$t('warehouse.otherIn.searchInNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('warehouse.otherIn.searchGoodsName')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('warehouse.otherIn.searchReconcileStatus')">
              <el-option :label="$t('warehouse.otherIn.filterUnreconciled')" value="unreconciled" />
            </el-select>
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('warehouse.otherIn.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('warehouse.otherIn.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('warehouse.otherIn.btnAdd') }}</el-button>
          </template>

          <el-table-column prop="in_no" :label="$t('warehouse.otherIn.colInNo')" min-width="150" />
          <el-table-column prop="in_man" :label="$t('warehouse.otherIn.colInMan')" width="110" />
          <el-table-column prop="in_date" :label="$t('warehouse.otherIn.colInDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.in_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="warehouse_name" :label="$t('warehouse.otherIn.colWarehouseName')" min-width="110" />
          <el-table-column :label="$t('warehouse.otherIn.colTotalPrice')" width="110" align="right">
            <template #default="{ row }">
              <b>{{ Number(row.total_price || 0).toFixed(2) }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="$t('warehouse.otherIn.colRemark')" min-width="130" show-overflow-tooltip />
          <el-table-column :label="$t('warehouse.otherIn.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('warehouse.otherIn.statusAudited') : row.status === 2 ? $t('warehouse.otherIn.statusRejected') : $t('warehouse.otherIn.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('warehouse.otherIn.colActions')" width="230" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('warehouse.otherIn.btnView') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">{{ $t('warehouse.otherIn.btnEdit') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">{{ $t('warehouse.otherIn.btnAudit') }}</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleAudit(row, 2)">{{ $t('warehouse.otherIn.btnReject') }}</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="handleAudit(row, 0)">{{ $t('warehouse.otherIn.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('warehouse.otherIn.btnReconciled') : $t('warehouse.otherIn.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('warehouse.otherIn.titleAuditedCannotDelete') : ''" @click="handleDelete(row.id)">{{ $t('warehouse.otherIn.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ══════════════════════ 新增/编辑/查看 表单页 ══════════════════════ -->
    <div v-else class="form-page">
      <!-- 顶部操作栏 -->
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('warehouse.otherIn.btnBack') }}</el-button>
          <span class="form-title">{{ isView ? $t('warehouse.otherIn.formTitleView') : fd.id ? $t('warehouse.otherIn.formTitleEdit') : $t('warehouse.otherIn.formTitleAdd') }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">{{ $t('warehouse.otherIn.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">{{ $t('warehouse.otherIn.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('warehouse.otherIn.btnSave') }}</el-button>
        </div>
      </div>

      <div class="form-body">
        <!-- 头部字段行 -->
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">{{ $t('warehouse.otherIn.fieldInNo') }}</span>
                <el-input v-model="fd.in_no" :placeholder="$t('warehouse.otherIn.placeholderInNo')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">{{ $t('warehouse.otherIn.fieldInMan') }}</span>
                <el-input v-model="fd.in_man" :placeholder="$t('warehouse.otherIn.placeholderInMan')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.otherIn.fieldInDate') }}</span>
                <el-date-picker v-model="fd.in_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.otherIn.fieldWarehouse') }}</span>
                <el-select v-model="fd.warehouse_id" :placeholder="$t('warehouse.otherIn.placeholderWarehouse')" style="flex:1"
                  :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品明细工具栏 -->
        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('warehouse.otherIn.btnSelectGoods') }}</el-button>
          <el-button size="small" :icon="Plus" @click="addEmptyRow">{{ $t('warehouse.otherIn.btnAddRow') }}</el-button>
          <span class="goods-summary">{{ $t('warehouse.otherIn.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>
          {{ $t('warehouse.otherIn.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b>
        </div>

        <!-- 商品明细表 -->
        <div class="goods-table-wrap">
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('warehouse.otherIn.emptyTableText')">
            <el-table-column type="index" :label="$t('warehouse.otherIn.colIndex')" width="45" align="center" />
            <el-table-column :label="$t('warehouse.otherIn.colGoodsName')" min-width="150">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_name }}</span>
                <el-input v-else v-model="row.goods_name" size="small" :placeholder="$t('warehouse.otherIn.placeholderGoodsName')" />
              </template>
            </el-table-column>
            <el-table-column prop="goods_sn" :label="$t('warehouse.otherIn.colGoodsSn')" width="120">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_sn }}</span>
                <el-input v-else v-model="row.goods_sn" size="small" :placeholder="$t('warehouse.otherIn.placeholderGoodsSn')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colCate')" width="100">
              <template #default="{ row }">{{ row.cate_name || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colSpec')" width="110">
              <template #default="{ row }">
                <span v-if="isView">{{ row.spec || '—' }}</span>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('warehouse.otherIn.placeholderSpec')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colUnit')" width="75" align="center">
              <template #default="{ row }">{{ row.unit_name || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colNum')" width="110" align="right">
              <template #header>
                {{ $t('warehouse.otherIn.colNum') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num', t('warehouse.otherIn.colNum'))">{{ $t('warehouse.otherIn.colBatchNum') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colInPrice')" width="120" align="right">
              <template #header>
                {{ $t('warehouse.otherIn.colInPrice') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('in_price', t('warehouse.otherIn.colInPrice'))">{{ $t('warehouse.otherIn.colInPriceBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.in_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.in_price }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colInTotal')" width="120" align="right">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ ((row.num||0)*(row.in_price||0)).toFixed(2) }}</b>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colBatchNo')" width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.batch_no" size="small" :placeholder="$t('warehouse.otherIn.placeholderBatchNo')" />
                <span v-else>{{ row.batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colWarehouse')" width="120">
              <template #default="{ row }">
                <el-select v-if="!isView" v-model="row.warehouse_id" size="small" :placeholder="$t('warehouse.otherIn.placeholderWarehouse')"
                  style="width:100%" @change="(v:any) => onRowWarehouse(row, v)">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
                <span v-else>{{ row.warehouse_name || fd.warehouse_name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherIn.colItemRemark')" min-width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.remark" size="small" :placeholder="$t('warehouse.otherIn.placeholderItemRemark')" />
                <span v-else>{{ row.remark || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="!isView" label="" width="50" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" size="small" link :icon="Delete" @click="removeRow($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 合计行 + 备注 -->
        <div class="form-footer">
          <div class="footer-summary">
            <span>{{ $t('warehouse.otherIn.summaryTotal') }}</span>
            <span>{{ $t('warehouse.otherIn.summaryNum') }} <b>{{ totalNum.toFixed(2) }}</b></span>
            <span style="margin-left:20px">{{ $t('warehouse.otherIn.summaryTotalPrice') }} <b style="color:#0071e3">{{ totalPrice.toFixed(2) }}</b></span>
          </div>
          <div class="field-row" style="margin-top:10px">
            <span class="field-label">{{ $t('warehouse.otherIn.fieldRemark') }}</span>
            <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
          </div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 批量设置弹窗 -->
    <el-dialog v-model="batchVisible" :title="`${$t('warehouse.otherIn.batchSetTitle').replace('{label}', batchLabel)}`" width="300px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">{{ $t('warehouse.otherIn.btnBatchCancel') }}</el-button>
        <el-button type="primary" @click="applyBatch">{{ $t('warehouse.otherIn.btnBatchConfirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { fmtDt } from '@/utils/date'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getOtherInList, createOtherIn, updateOtherIn, deleteOtherIn, getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'

const { t } = useI18n()
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_warehouse_other_in', tableRef)
const reconcileFilteredApi = createFilteredApi(getOtherInList, 'reconcile_filter')
const searchForm = reactive({ in_no: '', goods_name: '', reconcile_filter: '' })

function resetSearch() { searchForm.in_no = ''; searchForm.goods_name = '' }

// ── 视图状态 ────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

// ── 仓库 ────────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  try {
    const res = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = res.data?.list || res.data?.rows || res.data?.data || []
  } catch {}
}
function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
  // 同步到所有没有单独设置仓库的行
  fd.items.forEach(r => { if (!r.warehouse_id) { r.warehouse_id = id; r.warehouse_name = w?.name ?? '' } })
}
function onRowWarehouse(row: any, id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  row.warehouse_name = w?.name ?? ''
}

// ── 表单数据 ────────────────────────────────────────────────────
function defaultFd() {
  return {
    id: 0, status: 0,
    in_no: '', in_man: '',
    in_date: new Date().toISOString().slice(0, 10),
    warehouse_id: null as any, warehouse_name: '',
    remark: '',
    items: [] as any[],
    total_price: 0,
  }
}
const fd = reactive(defaultFd())

function calcRow(row: any) {
  row.row_total = (row.num || 0) * (row.in_price || 0)
}
const totalNum = computed(() => fd.items.reduce((s, r) => s + (Number(r.num) || 0), 0))
const totalPrice = computed(() => fd.items.reduce((s, r) => s + (Number(r.num)||0) * (Number(r.in_price)||0), 0))

// ── 打开表单 ────────────────────────────────────────────────────
async function openAdd() {
  Object.assign(fd, defaultFd())
  fd.items = []
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}
async function openEdit(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(calcRow)
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}
async function openView(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(calcRow)
  isView.value = true
  showForm.value = true
  await loadWarehouses()
}
function backToList() { showForm.value = false; tableRef.value?.refresh() }

// ── 商品选择器 ──────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  goods.forEach(g => {
    fd.items.push({
      goods_id: g.id,
      goods_name: g.name,
      goods_sn: g.goods_sn || '',
      cate_name: g.cate_name || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      num: 1,
      in_price: 0,
      row_total: 0,
      batch_no: '',
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      remark: '',
    })
  })
}

function addEmptyRow() {
  fd.items.push({ goods_id: 0, goods_name: '', goods_sn: '', cate_name: '', spec: '', unit_name: '', num: 1, in_price: 0, row_total: 0, batch_no: '', warehouse_id: fd.warehouse_id, warehouse_name: fd.warehouse_name, remark: '' })
}
function removeRow(index: number) { fd.items.splice(index, 1) }

// ── 批量设置 ────────────────────────────────────────────────────
const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)
function batchSet(field: string, label: string) { batchField.value = field; batchLabel.value = label; batchValue.value = 0; batchVisible.value = true }
function applyBatch() {
  fd.items.forEach(r => { r[batchField.value] = batchValue.value; calcRow(r) })
  batchVisible.value = false
}

// ── 保存 ────────────────────────────────────────────────────────
async function handleSave() {
  if (!fd.in_date) { ElMessage.warning(t('warehouse.otherIn.warnSelectDate')); return }
  if (!fd.warehouse_id) { ElMessage.warning(t('warehouse.otherIn.warnSelectWarehouse')); return }
  if (!fd.items.length) { ElMessage.warning(t('warehouse.otherIn.warnAddGoods')); return }
  saving.value = true
  try {
    const payload = {
      ...fd,
      goods_info: JSON.stringify(fd.items),
      total_price: totalPrice.value,
    }
    if (fd.id) {
      payload.id = fd.id
      await updateOtherIn(payload)
    } else {
      await createOtherIn(payload)
    }
    ElMessage.success(t('warehouse.otherIn.msgSaveSuccess'))
    stockRefreshStore.trigger()
    backToList()
  } catch { } finally { saving.value = false }
}

// ── 审核 ────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const labels: Record<number, string> = { 1: t('warehouse.otherIn.auditLabel'), 2: t('warehouse.otherIn.rejectLabel'), 0: t('warehouse.otherIn.unauditLabel') }
  await ElMessageBox.confirm(t('warehouse.otherIn.msgAuditConfirm').replace('{action}', labels[status]), t('warehouse.otherIn.msgConfirmTitle'), { type: 'warning' })
  try {
    await http.post('/stock/OtherIn/audit', { id: row.id, status })
    ElMessage.success(t('warehouse.otherIn.msgSuccess'))
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch {}
}

// ── 删除 ────────────────────────────────────────────────────────
async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('warehouse.otherIn.msgConfirmDelete'), t('warehouse.otherIn.msgConfirmTitle'), { type: 'warning' })
  await deleteOtherIn(id)
  ElMessage.success(t('warehouse.otherIn.msgDeleteSuccess'))
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

onMounted(loadWarehouses)
</script>

<style scoped>
.other-in-page { padding: 0; }

.form-page { background: #fff; min-height: calc(100vh - 80px); }

.form-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-bottom: 1px solid #e8edf2;
  background: #fff; position: sticky; top: 0; z-index: 10;
}
.form-topbar-left { display: flex; align-items: center; gap: 10px; }
.form-title { font-size: 15px; font-weight: 600; color: #333; }

.form-body { padding: 16px; }
.form-section { margin-bottom: 12px; }

.field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.field-label { font-size: 13px; color: #555; white-space: nowrap; flex-shrink: 0; min-width: 52px; }
.field-label.required::before { content: '*'; color: #f56c6c; margin-right: 2px; }

.goods-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; margin-bottom: 6px;
  border-top: 1px solid #f0f0f0;
}
.goods-summary-view { padding: 6px 0; font-size: 13px; color: #555; border-top: 1px solid #f0f0f0; margin-bottom: 6px; }
.goods-summary { margin-left: auto; font-size: 13px; color: #555; }
.goods-summary b { color: #0071e3; }

.goods-table-wrap { margin-bottom: 10px; }

.form-footer { padding: 12px 0; border-top: 1px solid #f0f0f0; }
.footer-summary { font-size: 13px; color: #555; }
.footer-summary b { color: #0071e3; }
</style>
