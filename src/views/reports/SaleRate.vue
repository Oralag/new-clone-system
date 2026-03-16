<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:150px" />
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
        <el-table-column label="合同日期" prop="contract_date" width="110" />
        <el-table-column label="客户名称" prop="customer_name" min-width="120" />
        <el-table-column label="销售员" prop="admin_name" width="100" />
        <el-table-column label="合同金额" prop="total_amount" width="120" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="折后金额" prop="after_discount" width="120" align="right">
          <template #default="{ row }">¥{{ Number(row.after_discount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="已收款" prop="receive_amount" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.receive_amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="运费" prop="freight_amount" width="90" align="right">
          <template #default="{ row }">¥{{ Number(row.freight_amount || 0).toFixed(2) }}</template>
        </el-table-column>
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
const searchForm = reactive<any>({ customer_name: '' })

function onDateChange(val: [string, string] | null) {
  if (val) {
    searchForm.contract_date_start = val[0]
    searchForm.contract_date_end = val[1]
  } else {
    delete searchForm.contract_date_start
    delete searchForm.contract_date_end
  }
}

function onReset() {
  searchForm.customer_name = ''
  dateRange.value = null
  delete searchForm.contract_date_start
  delete searchForm.contract_date_end
  scTable.value?.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
