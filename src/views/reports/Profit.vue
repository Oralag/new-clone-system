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
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getProfitList"
          export-file-name="None" :params="searchForm">
        <el-table-column label="商品名称" prop="goods_name" />
        <el-table-column label="销售金额" prop="sale_amount" />
        <el-table-column label="成本金额" prop="cost_amount" />
        <el-table-column label="毛利润" prop="gross_profit" />
        <el-table-column label="利润率" prop="profit_rate" />
        <el-table-column label="周期" prop="period" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getProfitList } from '@/api/reports'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({})

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
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
