<template>
  <div class="transfer-page">

    <!-- ══════════════════════ 列表视图 ══════════════════════ -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/stock/Allocation/batchDel"
          :export-file-name="$t('warehouse.transfer.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.keyword" :placeholder="$t('warehouse.transfer.searchKeyword')" clearable style="width:180px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('warehouse.transfer.searchReconcileStatus')">
              <el-option :label="$t('warehouse.transfer.filterUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('warehouse.transfer.btnAdd') }}</el-button>
          </template>

          <el-table-column prop="transfer_no" :label="$t('warehouse.transfer.colTransferNo')" min-width="150" />
          <el-table-column prop="allot_date" :label="$t('warehouse.transfer.colAllotDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.allot_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="from_warehouse" :label="$t('warehouse.transfer.colFromWarehouse')" min-width="110" />
          <el-table-column prop="to_warehouse" :label="$t('warehouse.transfer.colToWarehouse')" min-width="110" />
          <el-table-column :label="$t('warehouse.transfer.colTotalAmount')" width="110" align="right">
            <template #default="{ row }">
              <b>{{ Number(row.total_amount || 0).toFixed(2) }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="$t('warehouse.transfer.colRemark')" min-width="130" show-overflow-tooltip />
          <el-table-column :label="$t('warehouse.transfer.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('warehouse.transfer.statusAudited') : row.status === 2 ? $t('warehouse.transfer.statusRejected') : $t('warehouse.transfer.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('warehouse.transfer.colActions')" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('warehouse.transfer.btnView') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">{{ $t('warehouse.transfer.btnEdit') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">{{ $t('warehouse.transfer.btnAudit') }}</el-button>
              <el-button v-if="row.status === 1" type="warning" size="small" link @click="handleAudit(row, 0)">{{ $t('warehouse.transfer.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('warehouse.transfer.btnReconciled') : $t('warehouse.transfer.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('warehouse.transfer.titleAuditedCannotDelete') : ''" @click="handleDelete(row.id)">{{ $t('warehouse.transfer.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ══════════════════════ 新增/编辑/查看 表单页 ══════════════════════ -->
    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('warehouse.transfer.btnBack') }}</el-button>
          <span class="form-title">{{ isView ? $t('warehouse.transfer.formTitleView') : fd.id ? $t('warehouse.transfer.formTitleEdit') : $t('warehouse.transfer.formTitleAdd') }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">{{ $t('warehouse.transfer.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">{{ $t('warehouse.transfer.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('warehouse.transfer.btnSave') }}</el-button>
        </div>
      </div>

      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">{{ $t('warehouse.transfer.fieldTransferNo') }}</span>
                <el-input v-model="fd.transfer_no" :placeholder="$t('warehouse.transfer.placeholderTransferNo')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.transfer.fieldAllotDate') }}</span>
                <el-date-picker v-model="fd.allot_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.transfer.fieldFromWarehouse') }}</span>
                <el-select v-model="fd.from_warehouse_id" :placeholder="$t('warehouse.transfer.placeholderFromWarehouse')" style="flex:1"
                  :disabled="isView" @change="onFromWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('warehouse.transfer.fieldToWarehouse') }}</span>
                <el-select v-model="fd.to_warehouse_id" :placeholder="$t('warehouse.transfer.placeholderToWarehouse')" style="flex:1"
                  :disabled="isView" @change="onToWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('warehouse.transfer.btnSelectGoods') }}</el-button>
          <el-button size="small" :icon="Plus" @click="addEmptyRow">{{ $t('warehouse.transfer.btnAddRow') }}</el-button>
          <span class="goods-summary">{{ $t('warehouse.transfer.totalAmountLabel') }}<b>{{ totalAmount.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>
          {{ $t('warehouse.transfer.totalAmountLabel') }}<b>{{ totalAmount.toFixed(2) }}</b>
        </div>

        <div class="goods-table-wrap">
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('warehouse.transfer.emptyTableText')">
            <el-table-column type="index" :label="$t('warehouse.transfer.colIndex')" width="45" align="center" />
            <el-table-column :label="$t('warehouse.transfer.colGoodsName')" min-width="150">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_name }}</span>
                <el-input v-else v-model="row.goods_name" size="small" :placeholder="$t('warehouse.transfer.placeholderGoodsName')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colGoodsSn')" width="120">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_sn || '—' }}</span>
                <el-input v-else v-model="row.goods_sn" size="small" :placeholder="$t('warehouse.transfer.placeholderGoodsSn')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colSpec')" width="100">
              <template #default="{ row }">{{ row.spec || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colUnit')" width="80" align="center">
              <template #default="{ row }">{{ row.unit_name || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colNum')" width="110" align="right">
              <template #header>
                {{ $t('warehouse.transfer.colNum') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num', $t('warehouse.transfer.colNum'))">{{ $t('warehouse.transfer.colBatchNum') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colInPrice')" width="120" align="right">
              <template #header>
                {{ $t('warehouse.transfer.colInPrice') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('in_price', $t('warehouse.transfer.colInPrice'))">{{ $t('warehouse.transfer.colInPriceBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.in_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.in_price }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colInTotal')" width="120" align="right">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ ((row.num||0)*(row.in_price||0)).toFixed(2) }}</b>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colStockNum')" width="90" align="right">
              <template #default="{ row }">{{ row.stock_num ?? '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colOutBatchNo')" width="120">
              <template #header>
                {{ $t('warehouse.transfer.colOutBatchNo') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('out_batch_no', $t('warehouse.transfer.colOutBatchNo'))">{{ $t('warehouse.transfer.colOutBatchNoBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.out_batch_no" size="small" :placeholder="$t('warehouse.transfer.placeholderOutBatchNo')" />
                <span v-else>{{ row.out_batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colInBatchNo')" width="120">
              <template #header>
                {{ $t('warehouse.transfer.colInBatchNo') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('in_batch_no', $t('warehouse.transfer.colInBatchNo'))">{{ $t('warehouse.transfer.colInBatchNoBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.in_batch_no" size="small" :placeholder="$t('warehouse.transfer.placeholderInBatchNo')" />
                <span v-else>{{ row.in_batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.transfer.colItemRemark')" min-width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.remark" size="small" :placeholder="$t('warehouse.transfer.placeholderItemRemark')" />
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

        <div class="form-footer">
          <div class="footer-summary">
            <span>{{ $t('warehouse.transfer.summaryTotal') }}</span>
            <span>{{ $t('warehouse.transfer.summaryNum') }} <b>{{ totalNum.toFixed(2) }}</b></span>
            <span style="margin-left:20px">{{ $t('warehouse.transfer.summaryTotalAmount') }} <b style="color:#0071e3">{{ totalAmount.toFixed(2) }}</b></span>
          </div>
          <div class="field-row" style="margin-top:10px">
            <span class="field-label">{{ $t('warehouse.transfer.fieldRemark') }}</span>
            <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
          </div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <el-dialog v-model="batchVisible" :title="$t('warehouse.transfer.batchSetTitle', { label: batchLabel })" width="300px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">{{ $t('warehouse.transfer.btnBatchCancel') }}</el-button>
        <el-button type="primary" @click="applyBatch">{{ $t('warehouse.transfer.btnBatchConfirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtDt } from '@/utils/date'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getTransferList, createTransfer, updateTransfer, auditTransfer, deleteTransfer, getWarehouseList } from '@/api/warehouse'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_warehouse_transfer', tableRef)
const reconcileFilteredApi = createFilteredApi(getTransferList, 'reconcile_filter')
const searchForm = reactive({ keyword: '', reconcile_filter: '' })

const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  try {
    const res = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = res.data?.list || res.data?.rows || res.data?.data || []
  } catch {}
}
function onFromWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.from_warehouse = w?.name ?? ''
}
function onToWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.to_warehouse = w?.name ?? ''
}

function defaultFd() {
  return {
    id: 0, status: 0,
    transfer_no: '',
    allot_date: new Date().toISOString().slice(0, 10),
    from_warehouse_id: null as any, from_warehouse: '',
    to_warehouse_id: null as any, to_warehouse: '',
    remark: '',
    items: [] as any[],
    total_amount: 0,
  }
}
const fd = reactive(defaultFd())

function calcRow(row: any) {
  row.row_total = (row.num || 0) * (row.in_price || 0)
}
const totalNum = computed(() => fd.items.reduce((s, r) => s + (Number(r.num) || 0), 0))
const totalAmount = computed(() => fd.items.reduce((s, r) => s + (Number(r.num)||0) * (Number(r.in_price)||0), 0))

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

const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  goods.forEach(g => {
    fd.items.push({
      goods_id: g.id,
      goods_name: g.name,
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      num: 1,
      in_price: 0,
      row_total: 0,
      stock_num: g.stock_num ?? null,
      out_batch_no: '',
      in_batch_no: '',
      remark: '',
    })
  })
}
function addEmptyRow() {
  fd.items.push({ goods_id: 0, goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, in_price: 0, row_total: 0, stock_num: null, out_batch_no: '', in_batch_no: '', remark: '' })
}
function removeRow(index: number) { fd.items.splice(index, 1) }

const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)
function batchSet(field: string, label: string) { batchField.value = field; batchLabel.value = label; batchValue.value = 0; batchVisible.value = true }
function applyBatch() {
  fd.items.forEach(r => { r[batchField.value] = batchValue.value; calcRow(r) })
  batchVisible.value = false
}

async function handleSave() {
  if (!fd.allot_date) { ElMessage.warning(t('warehouse.transfer.warnSelectDate')); return }
  if (!fd.from_warehouse_id) { ElMessage.warning(t('warehouse.transfer.warnSelectFromWarehouse')); return }
  if (!fd.to_warehouse_id) { ElMessage.warning(t('warehouse.transfer.warnSelectToWarehouse')); return }
  if (!fd.items.length) { ElMessage.warning(t('warehouse.transfer.warnAddGoods')); return }
  saving.value = true
  try {
    const payload = { ...fd, goods_info: JSON.stringify(fd.items), total_amount: totalAmount.value }
    if (fd.id) {
      await updateTransfer(payload)
    } else {
      await createTransfer(payload)
    }
    ElMessage.success(t('warehouse.transfer.msgSaveSuccess'))
    backToList()
  } catch { } finally { saving.value = false }
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('warehouse.transfer.auditLabel') : t('warehouse.transfer.unauditLabel')
  await ElMessageBox.confirm(t('warehouse.transfer.msgAuditConfirm', { action }), t('warehouse.transfer.msgConfirmTitle'), { type: 'warning' })
  try {
    await auditTransfer({ id: row.id, status })
    ElMessage.success(t('warehouse.transfer.msgSuccess'))
    tableRef.value?.refresh()
  } catch {}
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('warehouse.transfer.msgConfirmDelete'), t('warehouse.transfer.msgConfirmTitle'), { type: 'warning' })
  await deleteTransfer(id)
  ElMessage.success(t('warehouse.transfer.msgDeleteSuccess'))
  tableRef.value?.refresh()
}

onMounted(loadWarehouses)
</script>

<style scoped>
.transfer-page { padding: 0; }
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
