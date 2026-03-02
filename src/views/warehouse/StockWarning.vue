<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getWarningList"
          del-path="/stock/StockWarning/batchDel"
          export-file-name="库存预警" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" placeholder="仓库名称" clearable style="width: 180px" />
        </template>

        <el-table-column prop="goods_sn" label="商品编码" width="150" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="stock_num" label="当前库存" width="120" />
        <el-table-column prop="min_num" label="最低库存" width="120" />
        <el-table-column prop="max_num" label="最高库存" width="120" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getWarningList } from '@/api/warehouse'

const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  warehouse_name: ''
})
</script>
