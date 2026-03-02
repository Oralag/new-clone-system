<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getVisitList"
          del-path="/office/visit/batchDel"
          export-file-name="拜访记录" :params="searchForm">
        <el-table-column label="员工姓名" prop="staff_name" />
        <el-table-column label="地址" prop="address" />
        <el-table-column label="打卡时间" prop="check_time" />
        <el-table-column label="备注" prop="remark" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getVisitList } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({})
</script>

<style scoped>
.page-container {}
</style>
