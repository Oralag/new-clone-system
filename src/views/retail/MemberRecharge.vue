<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="会员名称">
          <el-input v-model="searchForm.member_name" placeholder="请输入会员名称" clearable style="width:180px" />
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
      <ScTable ref="scTable" :api-obj="getRechargeList"
          del-path="/retail/recharge/batchDel"
          export-file-name="充值记录" :params="searchForm">
        <el-table-column label="充值单号" prop="recharge_no" />
        <el-table-column label="会员名称" prop="member_name" />
        <el-table-column label="充值金额" prop="amount" />
        <el-table-column label="赠送金额" prop="gift_amount" />
        <el-table-column label="支付方式" prop="pay_type_name" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getRechargeList } from '@/api/retail'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({ member_name: '' })

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
  searchForm.member_name = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
