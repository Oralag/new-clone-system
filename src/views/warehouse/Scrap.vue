<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getScrapList"
          del-path="/stock/Scrap/batchDel"
          export-file-name="报废单" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.scrap_no" placeholder="报废单编号" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" placeholder="仓库名称" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>

        <el-table-column prop="scrap_no" label="报废单编号" width="160" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="reason" label="报废原因" min-width="160" show-overflow-tooltip />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
        <el-table-column prop="status_name" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'info' : 'warning'" size="small">
              {{ row.status_name || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" title="新增报废单" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="仓库" prop="warehouse_id" :rules="[{ required: true, message: '请选择仓库' }]">
          <el-select v-model="form.warehouse_id" placeholder="请选择仓库" style="width: 100%"
            @change="(val: any) => onWarehouseChange(val, form)">
            <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="商品" prop="goods_name" :rules="[{ required: true, message: '请选择商品' }]">
          <div style="display: flex; gap: 8px; width: 100%">
            <el-input v-model="form.goods_name" placeholder="请选择商品" readonly style="flex: 1" />
            <el-button type="primary" :disabled="!form.warehouse_id" @click="openStockSelect(form)">选择</el-button>
          </div>
        </el-form-item>
        <el-form-item label="可用库存" v-if="selectedStock">
          <el-tag type="info" size="large">{{ selectedStock.qty }} {{ selectedStock.unit_name || '' }}</el-tag>
        </el-form-item>
        <el-form-item label="数量" prop="num" :rules="[{ required: true, message: '请输入数量' }]">
          <el-input-number v-model="form.num" :min="1" :max="selectedStock?.qty || 99999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="报废原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" placeholder="请输入报废原因" />
        </el-form-item>
      </template>
    </ScForm>

    <!-- 库存选择弹窗 -->
    <el-dialog v-model="stockSelectVisible" title="选择仓库商品" width="800px" destroy-on-close>
      <div style="display: flex; gap: 8px; margin-bottom: 12px">
        <el-input v-model="stockKeyword" placeholder="商品名称/编码" clearable style="width: 220px"
          @keyup.enter="searchStockData" />
        <el-button type="primary" @click="searchStockData">搜索</el-button>
      </div>
      <el-table v-loading="stockLoading" :data="stockList" border stripe highlight-current-row
        @row-click="onStockRowClick" style="cursor: pointer">
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="goods_sn" label="商品编码" width="140" />
        <el-table-column prop="unit_name" label="单位" width="80" />
        <el-table-column prop="warehouse_name" label="仓库" width="120" />
        <el-table-column label="可用库存" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="row.qty > 0 ? 'success' : 'danger'" size="small">{{ row.qty }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="移动均价" width="100" align="right">
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
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getScrapList, createScrap, deleteScrap, getWarehouseList, getStockList } from '@/api/warehouse'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'
const stockRefreshStore = useStockRefreshStore()

const tableRef = ref()
const formRef = ref()

const searchForm = reactive({
  scrap_no: '',
  warehouse_name: ''
})

// 仓库选项
const warehouseOptions = ref<any[]>([])

// 当前选中的库存项
const selectedStock = ref<any>(null)

// 当前表单引用（用于库存弹窗回填）
let currentForm: any = null

// 库存选择弹窗
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
  // 切换仓库时清空已选商品
  form.goods_name = ''
  form.goods_id = undefined
  form.warehouse_name = ''
  selectedStock.value = null
  // 回填仓库名称
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
    ElMessage.success('操作成功')
    stockRefreshStore.trigger()
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该报废单吗？', '提示', { type: 'warning' })
  await deleteScrap(id)
  ElMessage.success('删除成功')
  stockRefreshStore.trigger()
  tableRef.value.refresh()
}

onMounted(() => {
  loadWarehouseOptions()
})
</script>
