<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/stock/Scrap/batchDel"
          :export-file-name="$t('warehouse.scrap.exportFileName')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.scrap_no" :placeholder="$t('warehouse.scrap.searchScrapNo')" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" :placeholder="$t('warehouse.scrap.searchWarehouseName')" clearable style="width: 180px" />
          <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('warehouse.scrap.searchReconcileStatus')">
            <el-option :label="$t('warehouse.scrap.filterUnreconciled')" value="unreconciled" />
          </el-select>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('warehouse.scrap.btnAdd') }}</el-button>
        </template>

        <el-table-column prop="scrap_no" :label="$t('warehouse.scrap.colScrapNo')" width="160" />
        <el-table-column prop="goods_name" :label="$t('warehouse.scrap.colGoodsName')" min-width="150" />
        <el-table-column prop="num" :label="$t('warehouse.scrap.colNum')" width="100" />
        <el-table-column prop="reason" :label="$t('warehouse.scrap.colReason')" min-width="160" show-overflow-tooltip />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.scrap.colWarehouseName')" width="150" />
        <el-table-column prop="status_name" :label="$t('warehouse.scrap.colStatus')" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'info' : 'warning'" size="small">
              {{ row.status_name || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column :label="$t('warehouse.scrap.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('warehouse.scrap.btnView') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('warehouse.scrap.btnReconciled') : $t('warehouse.scrap.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('warehouse.scrap.titleAuditedCannotDelete') : ''" @click="handleDelete(row.id)">{{ $t('warehouse.scrap.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" :title="$t('warehouse.scrap.formTitle')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('warehouse.scrap.fieldWarehouse')" prop="warehouse_id" :rules="[{ required: true, message: $t('warehouse.scrap.ruleWarehouseRequired') }]">
          <el-select v-model="form.warehouse_id" :placeholder="$t('warehouse.scrap.placeholderWarehouse')" style="width: 100%"
            @change="(val: any) => onWarehouseChange(val, form)">
            <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('warehouse.scrap.fieldGoods')" prop="goods_name" :rules="[{ required: true, message: $t('warehouse.scrap.ruleGoodsRequired') }]">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="form.goods_name" :placeholder="$t('warehouse.scrap.placeholderGoods')" readonly style="flex: 1" />
            <el-button type="primary" :disabled="!form.warehouse_id" @click="openStockSelect(form)">{{ $t('warehouse.scrap.btnSelectGoods') }}</el-button>
          </div>
        </el-form-item>
        <el-form-item :label="$t('warehouse.scrap.fieldAvailableStock')" v-if="selectedStock">
          <el-tag type="info" size="large">{{ selectedStock.qty }} {{ selectedStock.unit_name || '' }}</el-tag>
        </el-form-item>
        <el-form-item :label="$t('warehouse.scrap.fieldNum')" prop="num" :rules="[{ required: true, message: $t('warehouse.scrap.ruleNumRequired') }]">
          <el-input-number v-model="form.num" :min="1" :max="selectedStock?.qty || 99999" style="width: 100%" />
        </el-form-item>
        <el-form-item :label="$t('warehouse.scrap.fieldReason')" prop="reason">
          <el-input v-model="form.reason" type="textarea" :placeholder="$t('warehouse.scrap.placeholderReason')" />
        </el-form-item>
      </template>
    </ScForm>

    <el-dialog v-model="stockSelectVisible" :title="$t('warehouse.scrap.stockDialogTitle')" width="800px" destroy-on-close>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <el-input v-model="stockKeyword" :placeholder="$t('warehouse.scrap.stockSearchPlaceholder')" clearable style="width: 220px"
          @keyup.enter="searchStockData" />
        <el-button type="primary" @click="searchStockData">{{ $t('warehouse.scrap.btnSearch') }}</el-button>
      </div>
      <el-table v-loading="stockLoading" :data="stockList" border stripe highlight-current-row
        @row-click="onStockRowClick" style="cursor: pointer">
        <el-table-column prop="goods_name" :label="$t('warehouse.scrap.colStockGoodsName')" min-width="160" />
        <el-table-column prop="goods_sn" :label="$t('warehouse.scrap.colStockGoodsSn')" width="140" />
        <el-table-column prop="unit_name" :label="$t('warehouse.scrap.colStockUnit')" width="80" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.scrap.colStockWarehouse')" width="120" />
        <el-table-column :label="$t('warehouse.scrap.colStockQty')" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.qty > 0 ? 'success' : 'danger'" size="small">{{ row.qty }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('warehouse.scrap.colStockAvgPrice')" width="100" align="right">
          <template #default="{ row }">{{ row.avg_price ? Number(row.avg_price).toFixed(2) : '—' }}</template>
        </el-table-column>
      </el-table>
      <div style="display: flex; justify-content: flex-end; margin-top: 12px">
        <el-pagination
          v-model:current-page="stockPage"
          v-model:page-size="stockPageSize"
          :total="stockTotal"
          layout="total, prev, pager, next"
          background
          @current-change="loadStockData"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import ScForm from '@/components/ScForm.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getScrapList, createScrap, deleteScrap, getWarehouseList, getStockList } from '@/api/warehouse'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'
const stockRefreshStore = useStockRefreshStore()

const { t } = useI18n()
const tableRef = ref()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_warehouse_scrap', tableRef)
const reconcileFilteredApi = createFilteredApi(getScrapList, 'reconcile_filter')
const formRef = ref()

const searchForm = reactive({
  scrap_no: '',
  warehouse_name: '',
  reconcile_filter: ''
})

const warehouseOptions = ref<any[]>([])
const selectedStock = ref<any>(null)
let currentForm: any = null

const stockSelectVisible = ref(false)
const stockLoading = ref(false)
const stockKeyword = ref('')
const stockList = ref<any[]>([])
const stockPage = ref(1)
const stockPageSize = ref(20)
const stockTotal = ref(0)
let currentWarehouseId = 0

function getGoodsTypeMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem('erp_goods_type_map') || '{}') } catch { return {} }
}

async function loadWarehouseOptions() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows || []
}

function onWarehouseChange(warehouseId: number, form: any) {
  form.goods_name = ''
  form.goods_id = undefined
  form.warehouse_name = ''
  selectedStock.value = null
  const w = warehouseOptions.value.find((item: any) => item.id === warehouseId)
  if (w) form.warehouse_name = w.name
}

function openStockSelect(form: any) {
  currentForm = form
  currentWarehouseId = form.warehouse_id
  stockKeyword.value = ''
  stockPage.value = 1
  stockSelectVisible.value = true
  loadStockData()
}

async function loadStockData() {
  stockLoading.value = true
  try {
    const keyword = stockKeyword.value.trim()
    const params: any = {
      page: keyword ? 1 : stockPage.value,
      list_rows: keyword ? 500 : stockPageSize.value,
      warehouse_id: currentWarehouseId
    }
    if (keyword) params.goods_name = keyword
    const res = await getStockList(params)
    const typeMap = getGoodsTypeMap()
    const rows = (res.data?.rows || []).map((row: any) => ({
      ...row,
      goods_type: row.goods_type ?? typeMap[Number(row.goods_id || row.id)] ?? 2,
    }))
    if (keyword) {
      const filtered = fuzzyFilterGoods(rows, keyword)
      stockTotal.value = filtered.length
      const start = (stockPage.value - 1) * stockPageSize.value
      stockList.value = filtered.slice(start, start + stockPageSize.value)
    } else {
      stockList.value = rows
      stockTotal.value = res.data?.total || 0
    }
  } finally {
    stockLoading.value = false
  }
}

function searchStockData() {
  stockPage.value = 1
  loadStockData()
}

function onStockRowClick(row: any) {
  if (currentForm) {
    currentForm.goods_name = row.goods_name
    currentForm.goods_id = row.goods_id || row.id
    currentForm.warehouse_name = row.warehouse_name
    selectedStock.value = row
  }
  stockSelectVisible.value = false
}

const openForm = () => {
  selectedStock.value = null
  formRef.value.open()
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    await createScrap(form)
    ElMessage.success(t('warehouse.scrap.msgSuccess'))
    stockRefreshStore.trigger()
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm(t('warehouse.scrap.msgConfirmDelete'), t('warehouse.scrap.msgConfirmTitle'), { type: 'warning' })
  await deleteScrap(id)
  ElMessage.success(t('warehouse.scrap.msgDeleteSuccess'))
  stockRefreshStore.trigger()
  tableRef.value.refresh()
}

onMounted(() => {
  loadWarehouseOptions()
})
</script>
