<template>
  <div class="other-out-page">

    <!-- ══════════════════════ 列表视图 ══════════════════════ -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/stock/OtherOut/batchDel"
      :export-file-name="$t('route.WarehouseOtherOut')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.out_no" :placeholder="$t('warehouse.otherOut.searchOutNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('warehouse.otherOut.searchGoodsName')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('warehouse.otherOut.searchReconcileStatus')">
              <el-option :label="$t('warehouse.otherOut.filterUnreconciled')" value="unreconciled" />
            </el-select>
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('warehouse.otherOut.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('warehouse.otherOut.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('warehouse.otherOut.btnAdd') }}</el-button>
          </template>

          <el-table-column prop="out_no" :label="$t('warehouse.otherOut.colOutNo')" min-width="150" />
          <el-table-column prop="out_man" :label="$t('warehouse.otherOut.colOutMan')" width="110" />
          <el-table-column prop="out_date" :label="$t('warehouse.otherOut.colOutDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.out_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="warehouse_name" :label="$t('warehouse.otherOut.colWarehouseName')" min-width="110" />
          <el-table-column :label="$t('warehouse.otherOut.colTotalPrice')" width="110" align="right">
            <template #default="{ row }">
              <b>{{ Number(row.total_price || 0).toFixed(2) }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="reason" :label="$t('warehouse.otherOut.colReason')" min-width="130" show-overflow-tooltip />
          <el-table-column :label="$t('warehouse.otherOut.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('warehouse.otherOut.statusAudited') : row.status === 2 ? $t('warehouse.otherOut.statusRejected') : $t('warehouse.otherOut.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('warehouse.otherOut.colActions')" width="230" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('warehouse.otherOut.btnView') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">{{ $t('warehouse.otherOut.btnEdit') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">{{ $t('warehouse.otherOut.btnAudit') }}</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleAudit(row, 2)">{{ $t('warehouse.otherOut.btnReject') }}</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="handleAudit(row, 0)">{{ $t('warehouse.otherOut.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('warehouse.otherOut.btnReconciled') : $t('warehouse.otherOut.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('warehouse.otherOut.titleAuditedCannotDelete') : ''" @click="handleDelete(row.id)">{{ $t('warehouse.otherOut.btnDelete') }}</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('warehouse.otherOut.btnBack') }}</el-button>
          <span class="form-title">{{ isView ? $t('warehouse.otherOut.formTitleView') : fd.id ? $t('warehouse.otherOut.formTitleEdit') : $t('warehouse.otherOut.formTitleAdd') }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">{{ $t('warehouse.otherOut.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">{{ $t('warehouse.otherOut.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('warehouse.otherOut.btnSave') }}</el-button>
        </div>
      </div>

      <div class="form-body">
        <!-- 头部字段行 -->
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">{{ $t('warehouse.otherOut.fieldOutNo') }}</span>
                <el-input v-model="fd.out_no" :placeholder="$t('warehouse.otherOut.placeholderOutNo')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">{{ $t('warehouse.otherOut.fieldOutMan') }}</span>
                <el-input v-model="fd.out_man" :placeholder="$t('warehouse.otherOut.placeholderOutMan')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.otherOut.fieldOutDate') }}</span>
                <el-date-picker v-model="fd.out_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.otherOut.fieldWarehouse') }}</span>
                <el-select v-model="fd.warehouse_id" :placeholder="$t('warehouse.otherOut.placeholderWarehouse')" style="flex:1"
                  :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top:6px">
            <el-col :span="12">
              <div class="field-row">
                <span class="field-label">{{ $t('warehouse.otherOut.fieldReason') }}</span>
                <el-input v-model="fd.reason" :placeholder="$t('warehouse.otherOut.placeholderReason')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品明细工具栏 -->
        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('warehouse.otherOut.btnSelectGoods') }}</el-button>
          <el-button size="small" :icon="Plus" @click="addEmptyRow">{{ $t('warehouse.otherOut.btnAddRow') }}</el-button>
          <span class="goods-summary">{{ $t('warehouse.otherOut.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>
          {{ $t('warehouse.otherOut.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b>
        </div>

        <!-- 商品明细表 -->
        <div class="goods-table-wrap">
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('warehouse.otherOut.emptyTableText')">
            <el-table-column type="index" :label="$t('warehouse.otherOut.colIndex')" width="45" align="center" />
            <el-table-column :label="$t('warehouse.otherOut.colGoodsName')" min-width="150">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_name }}</span>
                <el-input v-else v-model="row.goods_name" size="small" :placeholder="$t('warehouse.otherOut.placeholderGoodsName')" />
              </template>
            </el-table-column>
            <el-table-column prop="goods_sn" :label="$t('warehouse.otherOut.colGoodsSn')" width="120">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_sn }}</span>
                <el-input v-else v-model="row.goods_sn" size="small" :placeholder="$t('warehouse.otherOut.placeholderGoodsSn')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colCate')" width="100">
              <template #default="{ row }">{{ row.cate_name || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colSpec')" width="110">
              <template #default="{ row }">
                <span v-if="isView">{{ row.spec || '—' }}</span>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('warehouse.otherOut.placeholderSpec')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colUnit')" width="75" align="center">
              <template #default="{ row }">{{ row.unit_name || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colStockNum')" width="90" align="right">
              <template #default="{ row }">
                <span :style="{ color: (row.stock_num||0) > 0 ? '#16a34a' : '#dc2626' }">
                  {{ row.stock_num ?? '—' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colNum')" width="110" align="right">
              <template #header>
                {{ $t('warehouse.otherOut.colNum') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num', t('warehouse.otherOut.colNum'))">{{ $t('warehouse.otherOut.colBatchNum') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colOutPrice')" width="120" align="right">
              <template #header>
                {{ $t('warehouse.otherOut.colOutPrice') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('out_price', t('warehouse.otherOut.colOutPrice'))">{{ $t('warehouse.otherOut.colOutPriceBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.out_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.out_price }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colOutTotal')" width="120" align="right">
              <template #default="{ row }">
                <b style="color:#dc2626">{{ ((row.num||0)*(row.out_price||0)).toFixed(2) }}</b>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colBatchNo')" width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.batch_no" size="small" :placeholder="$t('warehouse.otherOut.placeholderBatchNo')" />
                <span v-else>{{ row.batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colWarehouse')" width="120">
              <template #default="{ row }">
                <el-select v-if="!isView" v-model="row.warehouse_id" size="small" :placeholder="$t('warehouse.otherOut.placeholderWarehouse')"
                  style="width:100%" @change="(v:any) => onRowWarehouse(row, v)">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
                <span v-else>{{ row.warehouse_name || fd.warehouse_name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.otherOut.colItemRemark')" min-width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.remark" size="small" :placeholder="$t('warehouse.otherOut.placeholderItemRemark')" />
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
            <span>{{ $t('warehouse.otherOut.summaryTotal') }}</span>
            <span>{{ $t('warehouse.otherOut.summaryNum') }} <b>{{ totalNum.toFixed(2) }}</b></span>
            <span style="margin-left:20px">{{ $t('warehouse.otherOut.summaryTotalPrice') }} <b style="color:#dc2626">{{ totalPrice.toFixed(2) }}</b></span>
          </div>
          <div class="field-row" style="margin-top:10px">
            <span class="field-label">{{ $t('warehouse.otherOut.fieldRemark') }}</span>
            <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
          </div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 批量设置弹窗 -->
    <el-dialog v-model="batchVisible" :title="`${$t('warehouse.otherOut.batchSetTitle').replace('{label}', batchLabel)}`" width="300px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">{{ $t('warehouse.otherOut.btnBatchCancel') }}</el-button>
        <el-button type="primary" @click="applyBatch">{{ $t('warehouse.otherOut.btnBatchConfirm') }}</el-button>
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
import { getOtherOutList, createOtherOut, updateOtherOut, deleteOtherOut, getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'

const { t } = useI18n()
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_warehouse_other_out', tableRef)
const reconcileFilteredApi = createFilteredApi(getOtherOutList, 'reconcile_filter')
const searchForm = reactive({ out_no: '', goods_name: '', reconcile_filter: '' })

function resetSearch() { searchForm.out_no = ''; searchForm.goods_name = '' }

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
    out_no: '', out_man: '',
    out_date: new Date().toISOString().slice(0, 10),
    warehouse_id: null as any, warehouse_name: '',
    reason: '', remark: '',
    items: [] as any[],
    total_price: 0,
  }
}
const fd = reactive(defaultFd())

function calcRow(row: any) {
  row.row_total = (row.num || 0) * (row.out_price || 0)
}
const totalNum = computed(() => fd.items.reduce((s, r) => s + (Number(r.num) || 0), 0))
const totalPrice = computed(() => fd.items.reduce((s, r) => s + (Number(r.num)||0) * (Number(r.out_price)||0), 0))

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
      stock_num: g.stock_num ?? null,
      num: 1,
      out_price: 0,
      row_total: 0,
      batch_no: '',
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      remark: '',
    })
  })
}

function addEmptyRow() {
  fd.items.push({ goods_id: 0, goods_name: '', goods_sn: '', cate_name: '', spec: '', unit_name: '', stock_num: null, num: 1, out_price: 0, row_total: 0, batch_no: '', warehouse_id: fd.warehouse_id, warehouse_name: fd.warehouse_name, remark: '' })
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
  if (!fd.out_date) { ElMessage.warning(t('warehouse.otherOut.warnSelectDate')); return }
  if (!fd.warehouse_id) { ElMessage.warning(t('warehouse.otherOut.warnSelectWarehouse')); return }
  if (!fd.items.length) { ElMessage.warning(t('warehouse.otherOut.warnAddGoods')); return }
  saving.value = true
  try {
    const payload = {
      ...fd,
      goods_info: JSON.stringify(fd.items),
      total_price: totalPrice.value,
    }
    if (fd.id) {
      payload.id = fd.id
      await updateOtherOut(payload)
    } else {
      await createOtherOut(payload)
    }
    ElMessage.success(t('warehouse.otherOut.msgSaveSuccess'))
    stockRefreshStore.trigger()
    backToList()
  } catch { } finally { saving.value = false }
}

// ── 审核 ────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const labels: Record<number, string> = { 1: t('warehouse.otherOut.auditLabel'), 2: t('warehouse.otherOut.rejectLabel'), 0: t('warehouse.otherOut.unauditLabel') }
  await ElMessageBox.confirm(t('warehouse.otherOut.msgAuditConfirm').replace('{action}', labels[status]), t('warehouse.otherOut.msgConfirmTitle'), { type: 'warning' })
  try {
    await http.post('/stock/OtherOut/audit', { id: row.id, status })
    ElMessage.success(t('warehouse.otherOut.msgSuccess'))
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch {}
}

// ── 删除 ────────────────────────────────────────────────────────
async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('warehouse.otherOut.msgConfirmDelete'), t('warehouse.otherOut.msgConfirmTitle'), { type: 'warning' })
  await deleteOtherOut(id)
  ElMessage.success(t('warehouse.otherOut.msgDeleteSuccess'))
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

onMounted(loadWarehouses)
</script>

<style scoped>
.other-out-page { padding: 0; }

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
.goods-summary b { color: #dc2626; }

.goods-table-wrap { margin-bottom: 10px; }

.form-footer { padding: 12px 0; border-top: 1px solid #f0f0f0; }
.footer-summary { font-size: 13px; color: #555; }
.footer-summary b { color: #dc2626; }
</style>
