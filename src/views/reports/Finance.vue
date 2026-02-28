<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-input v-model="searchForm.type" placeholder="请输入类型" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getFinanceReportList" :params="searchForm">
        <el-table-column label="类型名称" prop="type_name" />
        <el-table-column label="收入" prop="income" />
        <el-table-column label="支出" prop="expense" />
        <el-table-column label="净额" prop="net" />
        <el-table-column label="周期" prop="period" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getFinanceReportList } from '@/api/reports'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({
  type: ''
})

function onDateChange(val: [string, string] | null) {
  if (val) {
    searchForm.start_date = val[0]
    searchForm.end_date = val[1]
  } else {
    delete searchForm.start_date
    delete searchForm.end_date
  }
}

function onReset() {
  searchForm.type = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
