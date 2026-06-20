<template>
  <div class="order-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          :export-file-name="$t('warehouse.stockCheck.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_sn" :placeholder="$t('warehouse.stockCheck.searchOrderSn')" clearable style="width:180px" />
            <el-input v-model="searchForm.warehouse_name" :placeholder="$t('warehouse.stockCheck.searchWarehouseName')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('warehouse.stockCheck.searchReconcileStatus')">
              <el-option :label="$t('warehouse.stockCheck.filterUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('warehouse.stockCheck.btnAdd') }}</el-button>
          </template>

          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('warehouse.stockCheck.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('warehouse.stockCheck.expandColGoodsName')" min-width="140" />
                  <el-table-column prop="goods_sn" :label="$t('warehouse.stockCheck.expandColGoodsSn')" width="110" />
                  <el-table-column prop="spec" :label="$t('warehouse.stockCheck.expandColSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('warehouse.stockCheck.expandColUnit')" width="65" align="center" />
                  <el-table-column prop="system_qty" :label="$t('warehouse.stockCheck.expandColSystemQty')" width="90" align="right" />
                  <el-table-column prop="check_qty" :label="$t('warehouse.stockCheck.expandColCheckQty')" width="90" align="right" />
                  <el-table-column :label="$t('warehouse.stockCheck.expandColDiffQty')" width="90" align="right">
                    <template #default="{ row: item }">
                      <span :style="{ color: (item.check_qty - item.system_qty) !== 0 ? '#dc2626' : '#16a34a' }">
                        {{ (Number(item.check_qty||0) - Number(item.system_qty||0)).toFixed(2) }}
                      </span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('warehouse.stockCheck.expandColRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>

          <el-table-column type="index" :label="$t('warehouse.stockCheck.colIndex')" width="60" align="center" />
          <el-table-column prop="order_sn" :label="$t('warehouse.stockCheck.colOrderSn')" min-width="160" />
          <el-table-column prop="warehouse_name" :label="$t('warehouse.stockCheck.colWarehouseName')" min-width="130" />
          <el-table-column :label="$t('warehouse.stockCheck.colCheckDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.check_date) || '—' }}</template>
          </el-table-column>
          <el-table-column prop="admin_name" :label="$t('warehouse.stockCheck.colAdminName')" width="90" />
          <el-table-column :label="$t('warehouse.stockCheck.colStatus')" width="90">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
                {{ row.status === 1 ? $t('warehouse.stockCheck.statusDone') : $t('warehouse.stockCheck.statusDraft') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" :label="$t('warehouse.stockCheck.colRemark')" min-width="120" show-overflow-tooltip />
          <el-table-column :label="$t('warehouse.stockCheck.colActions')" width="160" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" size="small" link @click="openEdit(row)">{{ $t('warehouse.stockCheck.btnView') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('warehouse.stockCheck.btnReconciled') : $t('warehouse.stockCheck.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('warehouse.stockCheck.titleAuditedCannotDelete') : ''" @click="handleDelete(row.id)">{{ $t('warehouse.stockCheck.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑页 ── -->
    <div v-else class="form-page">
      <div class="form-header">
        <el-button :icon="ArrowLeft" @click="backToList">{{ $t('warehouse.stockCheck.btnBack') }}</el-button>
        <span class="form-title">{{ isEdit ? $t('warehouse.stockCheck.formTitleEdit') : $t('warehouse.stockCheck.formTitleAdd') }}</span>
        <div class="form-header-actions">
          <el-button @click="backToList">{{ $t('warehouse.stockCheck.btnCancel') }}</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('warehouse.stockCheck.btnSave') }}</el-button>
        </div>
      </div>

      <el-form ref="formRef" :model="fd" label-width="90px" class="form-body">
        <el-card class="form-card">
          <div class="form-section-title">{{ $t('warehouse.stockCheck.sectionBasicInfo') }}</div>
          <el-row :gutter="24">
            <el-col :span="8">
              <el-form-item :label="$t('warehouse.stockCheck.fieldOrderSn')">
                <el-input v-model="fd.order_sn" :placeholder="$t('warehouse.stockCheck.placeholderOrderSn')" disabled />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('warehouse.stockCheck.fieldCheckDate')" prop="check_date" :rules="[{ required: true, message: $t('warehouse.stockCheck.ruleCheckDateRequired') }]">
                <el-date-picker v-model="fd.check_date" type="date" value-format="YYYY-MM-DD"
                  :placeholder="$t('warehouse.stockCheck.placeholderCheckDate')" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('warehouse.stockCheck.fieldWarehouse')" prop="warehouse_name" :rules="[{ required: true, message: $t('warehouse.stockCheck.ruleWarehouseRequired') }]">
                <el-select v-model="fd.warehouse_name" :placeholder="$t('warehouse.stockCheck.placeholderWarehouse')" style="width:100%"
                  @change="onWarehouseChange">
                  <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.name" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item :label="$t('warehouse.stockCheck.fieldAdminName')">
                <el-input v-model="fd.admin_name" :placeholder="$t('warehouse.stockCheck.placeholderAdminName')" />
              </el-form-item>
            </el-col>
            <el-col :span="16">
              <el-form-item :label="$t('warehouse.stockCheck.fieldRemark')">
                <el-input v-model="fd.remark" :placeholder="$t('warehouse.stockCheck.placeholderRemark')" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-card>

        <el-card class="form-card" style="margin-top:16px">
          <div class="form-section-title" style="display:flex;justify-content:space-between;align-items:center">
            <span>{{ $t('warehouse.stockCheck.sectionItems') }}</span>
            <el-button type="primary" size="small" :icon="Plus" @click="addItem">{{ $t('warehouse.stockCheck.btnAddItem') }}</el-button>
          </div>
          <el-table :data="fd.items" border size="small" style="margin-top:12px">
            <el-table-column type="index" :label="$t('warehouse.stockCheck.colItemIndex')" width="55" align="center" />
            <el-table-column :label="$t('warehouse.stockCheck.colItemGoods')" min-width="160">
              <template #default="{ row, $index }">
                <el-select v-model="row.goods_id" filterable :placeholder="$t('warehouse.stockCheck.placeholderSelectGoods')"
                  style="width:100%" @change="(v) => onGoodsChange(v, $index)">
                  <el-option v-for="g in goodsList" :key="g.id"
                    :label="`${g.goods_name}${g.goods_sn ? ' ['+g.goods_sn+']' : ''}`" :value="g.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemSpec')" width="100">
              <template #default="{ row }">
                <el-input v-model="row.spec" :placeholder="$t('warehouse.stockCheck.placeholderItemSpec')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemUnit')" width="80">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" :placeholder="$t('warehouse.stockCheck.placeholderItemUnit')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemSystemQty')" width="110" align="right">
              <template #default="{ row }">
                <el-input-number v-model="row.system_qty" :min="0" :precision="2" size="small" style="width:95px" disabled />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemCheckQty')" width="110" align="right">
              <template #default="{ row }">
                <el-input-number v-model="row.check_qty" :min="0" :precision="2" size="small" style="width:95px" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemDiffQty')" width="90" align="right">
              <template #default="{ row }">
                <span :style="{ color: (row.check_qty - row.system_qty) !== 0 ? '#dc2626' : '#16a34a', fontWeight: 500 }">
                  {{ (Number(row.check_qty||0) - Number(row.system_qty||0)).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemRemark')" min-width="120">
              <template #default="{ row }">
                <el-input v-model="row.remark" :placeholder="$t('warehouse.stockCheck.placeholderItemRemark')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('warehouse.stockCheck.colItemActions')" width="60" align="center">
              <template #default="{ $index }">
                <el-button type="danger" size="small" link :icon="Delete" @click="removeItem($index)" />
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtDt } from '@/utils/date'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import { getCheckList, createCheck, deleteCheck } from '@/api/warehouse'
import http from '@/api/http'

const { t } = useI18n()
const tableRef = ref()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_stock_check', tableRef)
const reconcileFilteredApi = createFilteredApi(getCheckList, 'reconcile_filter')
const formRef = ref()
const showForm = ref(false)
const isEdit = ref(false)
const saving = ref(false)

const searchForm = reactive({ order_sn: '', warehouse_name: '', reconcile_filter: '' })

const warehouseList = ref<any[]>([])
const goodsList = ref<any[]>([])
const stockMap = ref<Record<number, number>>({})

const fd = reactive({
  id: 0,
  order_sn: '',
  check_date: new Date().toISOString().slice(0, 10),
  warehouse_name: '',
  warehouse_id: 0,
  admin_name: '',
  remark: '',
  items: [] as any[],
})

function parseItems(info: any) {
  if (Array.isArray(info)) return info
  if (!info) return []
  try { return typeof info === 'string' ? JSON.parse(info) : info } catch { return [] }
}

async function loadWarehouse() {
  const res = await http.get('/stock/WarehouseName/index', { params: { list_rows: 200 } })
  warehouseList.value = res.data?.rows || []
}

async function loadGoods() {
  const res = await http.get('/goods/ShopGoods/index', { params: { list_rows: 500 } })
  goodsList.value = res.data?.rows || []
}

async function loadStock(warehouseName: string) {
  const res = await http.get('/stock/StockAll/index', { params: { warehouse_name: warehouseName, list_rows: 500 } })
  const rows = res.data?.rows || []
  const map: Record<number, number> = {}
  for (const r of rows) map[r.goods_id] = Number(r.qty || 0)
  stockMap.value = map
  for (const item of fd.items) {
    if (item.goods_id) item.system_qty = map[item.goods_id] || 0
  }
}

function onWarehouseChange(val: string) {
  const w = warehouseList.value.find(x => x.name === val)
  fd.warehouse_id = w?.id || 0
  if (val) loadStock(val)
}

function onGoodsChange(goodsId: number, index: number) {
  const g = goodsList.value.find(x => x.id === goodsId)
  if (g) {
    fd.items[index].goods_name = g.goods_name || ''
    fd.items[index].goods_sn = g.goods_sn || ''
    fd.items[index].unit_name = g.unit_name || ''
    fd.items[index].spec = g.spec || ''
    fd.items[index].system_qty = stockMap.value[goodsId] || 0
    fd.items[index].check_qty = stockMap.value[goodsId] || 0
  }
}

function addItem() {
  fd.items.push({ goods_id: null, goods_name: '', goods_sn: '', spec: '', unit_name: '', system_qty: 0, check_qty: 0, remark: '' })
}

function removeItem(index: number) {
  fd.items.splice(index, 1)
}

function resetForm() {
  fd.id = 0
  fd.order_sn = 'CK' + Date.now().toString().slice(-8)
  fd.check_date = new Date().toISOString().slice(0, 10)
  fd.warehouse_name = ''
  fd.warehouse_id = 0
  fd.admin_name = ''
  fd.remark = ''
  fd.items = []
}

async function openCreate() {
  resetForm()
  isEdit.value = false
  await Promise.allSettled([loadWarehouse(), loadGoods()])
  showForm.value = true
}

async function openEdit(row: any) {
  resetForm()
  isEdit.value = true
  await Promise.allSettled([loadWarehouse(), loadGoods()])
  fd.id = row.id
  fd.order_sn = row.order_sn || ''
  fd.check_date = (row.check_date || '').slice(0, 10)
  fd.warehouse_name = row.warehouse_name || ''
  fd.warehouse_id = row.warehouse_id || 0
  fd.admin_name = row.admin_name || ''
  fd.remark = row.remark || ''
  fd.items = parseItems(row.goods_info)
  if (fd.warehouse_name) await loadStock(fd.warehouse_name)
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

async function handleSave() {
  try { await formRef.value?.validate() } catch { return }
  saving.value = true
  try {
    const payload = {
      order_sn: fd.order_sn,
      check_date: fd.check_date,
      warehouse_name: fd.warehouse_name,
      warehouse_id: fd.warehouse_id,
      admin_name: fd.admin_name,
      remark: fd.remark,
      goods_info: JSON.stringify(fd.items),
      status: 1,
    }
    if (fd.id) {
      await http.post('/stock/StockCheck/edit', { id: fd.id, ...payload })
    } else {
      await createCheck(payload)
    }
    ElMessage.success(t('warehouse.stockCheck.msgSaveSuccess'))
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message || t('warehouse.stockCheck.msgSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('warehouse.stockCheck.msgConfirmDelete'), t('warehouse.stockCheck.msgConfirmTitle'), { type: 'warning' })
  await deleteCheck(id)
  ElMessage.success(t('warehouse.stockCheck.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.order-page { padding: 0; }
.form-page { padding: 0 0 40px; }
.form-header {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px; background: #fff;
  border-bottom: 1px solid #e5e6eb; margin-bottom: 16px;
  position: sticky; top: 0; z-index: 10;
}
.form-title { font-size: 16px; font-weight: 600; flex: 1; }
.form-header-actions { display: flex; gap: 8px; }
.form-body { padding: 0 16px; }
.form-card { border-radius: 10px; }
.form-section-title { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 16px; }
.expand-detail { padding: 12px 24px; background: #f9fafc; }
.expand-title { font-weight: 600; margin-bottom: 8px; color: #333; }
.expand-table { border-radius: 8px; }
</style>
