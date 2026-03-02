<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getBatchList"
          del-path="/stock/Batch/batchDel"
          export-file-name="批次管理" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width: 180px" />
          <el-input v-model="searchForm.batch_no" placeholder="批次号" clearable style="width: 160px" />
        </template>

        <el-table-column prop="batch_no" label="批次号" width="160" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="produce_date" label="生产日期" width="130" />
        <el-table-column prop="expire_date" label="过期日期" width="130" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getBatchList } from '@/api/warehouse'

const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  batch_no: ''
})
</script>
