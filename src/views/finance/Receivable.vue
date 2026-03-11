<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCollectReceiptList"
          del-path="/finance/CollectReceipt/batchDel"
          export-file-name="应收账款" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="客户/单号">
              <el-input v-model="searchForm.keyword" placeholder="客户名称/合同编号" clearable style="width:180px" />
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
            <el-button @click="Object.assign(searchForm, { keyword: '', date_range: null }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <el-table-column label="客户名称" min-width="140">
          <template #default="{ row }">{{ row.contact_name || row.customer_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="合同/订单编号" min-width="160">
          <template #default="{ row }">{{ row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column label="应收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#165dff;font-weight:600">¥{{ Number(row.amount||0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="收款账户" min-width="120">
          <template #default="{ row }">{{ row.fund_name || '—' }}</template>
        </el-table-column>
        <el-table-column label="收款日期" min-width="120">
          <template #default="{ row }">{{ (row.receipt_date || row.created_at || '').slice(0,10) }}</template>
        </el-table-column>
        <el-table-column label="备注" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">{{ row.remark || '—' }}</template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { getCollectReceiptList } from '@/api/finance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ keyword: '', date_range: null })
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
