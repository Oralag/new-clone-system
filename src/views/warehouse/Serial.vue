<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSerialList" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.serial_no" placeholder="序列号" clearable style="width: 180px" />
          <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width: 180px" />
        </template>

        <el-table-column prop="serial_no" label="序列号" width="180" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="status_name" label="状态" width="120" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getSerialList } from '@/api/warehouse'

const tableRef = ref()

const searchForm = reactive({
  serial_no: '',
  goods_name: ''
})
</script>
