<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getStockList" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width: 180px" />
          <el-input v-model="searchForm.warehouse_name" placeholder="仓库名称" clearable style="width: 180px" />
        </template>

        <el-table-column prop="goods_sn" label="商品编码" width="150" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="cate_name" label="分类" width="120" />
        <el-table-column prop="unit_name" label="单位" width="100" />
        <el-table-column prop="stock_num" label="库存数量" width="120" />
        <el-table-column prop="lock_num" label="锁定数量" width="120" />
        <el-table-column prop="available_num" label="可用数量" width="120" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getStockList } from '@/api/warehouse'

const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  warehouse_name: ''
})
</script>
