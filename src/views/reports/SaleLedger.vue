<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="客户名称">
          <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable style="width:180px" />
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
      <ScTable ref="scTable" :api-obj="getSaleLedgerList"
          export-file-name="None" :params="searchForm">
        <el-table-column label="订单编号" prop="order_no" />
        <el-table-column label="客户名称" prop="customer_name" />
        <el-table-column label="商品名称" prop="goods_name" />
        <el-table-column label="数量" prop="num" />
        <el-table-column label="单价" prop="unit_price" />
        <el-table-column label="金额" prop="amount" />
        <el-table-column label="销售员" prop="salesman_name" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getSaleLedgerList } from '@/api/reports'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({
  customer_name: '',
  goods_name: ''
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
  searchForm.customer_name = ''
  searchForm.goods_name = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
