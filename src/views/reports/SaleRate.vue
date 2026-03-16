<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="员工姓名">
          <el-input v-model="searchForm.admin_name" placeholder="员工姓名" clearable style="width:150px" />
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getSaleRateList" export-file-name="销售统计" :params="searchForm">
        <el-table-column label="员工姓名" prop="admin_name" min-width="100" />
        <el-table-column label="订单数" prop="order_count" width="90" align="right" />
        <el-table-column label="销售总额" prop="total_amount" width="120" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="平均金额" prop="avg_amount" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.avg_amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="周期" prop="period" min-width="100" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getSaleRateList } from '@/api/reports'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({ admin_name: '' })

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
  searchForm.admin_name = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value?.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
