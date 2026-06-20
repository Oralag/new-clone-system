<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getWarningList"
          del-path="/stock/StockWarning/batchDel"
          :export-file-name="$t('warehouse.stockWarning.exportFileName')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" :placeholder="$t('warehouse.stockWarning.searchGoodsName')" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" :placeholder="$t('warehouse.stockWarning.searchWarehouseName')" clearable style="width: 180px" />
        </template>

        <el-table-column prop="goods_sn" :label="$t('warehouse.stockWarning.colGoodsSn')" width="150" />
        <el-table-column :label="$t('warehouse.stockWarning.colGoodsName')" min-width="160">
          <template #default="{ row }">
            <span>{{ row.goods_name }}</span>
            <el-tag v-if="bomGoodsSet.has(row.goods_sn)" type="warning" size="small" style="margin-left:6px;vertical-align:middle">BOM</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock_num" :label="$t('warehouse.stockWarning.colStockNum')" width="120" />
        <el-table-column prop="min_num" :label="$t('warehouse.stockWarning.colMinNum')" width="120" />
        <el-table-column prop="max_num" :label="$t('warehouse.stockWarning.colMaxNum')" width="120" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.stockWarning.colWarehouseName')" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import http from '@/api/http'
import { getWarningList } from '@/api/warehouse'

const { t: _t } = useI18n()
const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  warehouse_name: ''
})

const bomGoodsSet = ref<Set<string>>(new Set())

onMounted(async () => {
  try {
    const res = await http.get('/goods/BomGoods/index', { params: { list_rows: 500 } })
    const rows = res.data?.list ?? res.data?.rows ?? []
    bomGoodsSet.value = new Set(rows.map((b: any) => b.goods_sn).filter(Boolean))
  } catch {}
})
</script>
