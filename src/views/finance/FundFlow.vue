<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getFundFlowList"
          del-path="/finance/FundFlow/batchDel"
          export-file-name="资金流水" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="账户名称">
              <el-input v-model="searchForm.account_name" placeholder="请输入账户名称" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="类型">
              <el-input v-model="searchForm.type" placeholder="请输入类型" clearable style="width:140px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="searchForm.date_range"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width:240px"
              />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { account_name: '', type: '', date_range: null }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <el-table-column prop="flow_no" label="流水号" min-width="160" />
        <el-table-column prop="account_name" label="账户名称" min-width="140" />
        <el-table-column prop="type_name" label="类型" min-width="100" />
        <el-table-column prop="amount" label="金额" min-width="120" />
        <el-table-column prop="before_balance" label="变动前余额" min-width="120" />
        <el-table-column prop="after_balance" label="变动后余额" min-width="120" />
        <el-table-column prop="remark" label="备注" min-width="160" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { getFundFlowList } from '@/api/finance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ account_name: '', type: '', date_range: null })
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
