<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getRetailReturnList" :params="searchForm">
        <el-table-column label="退货单号" prop="return_no" />
        <el-table-column label="订单编号" prop="order_no" />
        <el-table-column label="门店名称" prop="store_name" />
        <el-table-column label="金额" prop="amount" />
        <el-table-column label="状态" prop="status_tag" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getRetailReturnList } from '@/api/retail'

const scTable = ref()
const searchForm = reactive<any>({})
</script>

<style scoped>
.page-container {}
</style>
