<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getPointsList" :params="searchForm">
        <el-table-column label="会员名称" prop="member_name" />
        <el-table-column label="类型" prop="type_name" />
        <el-table-column label="积分" prop="points" />
        <el-table-column label="余额" prop="balance" />
        <el-table-column label="备注" prop="remark" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getPointsList } from '@/api/retail'

const scTable = ref()
const searchForm = reactive<any>({})
</script>

<style scoped>
.page-container {}
</style>
