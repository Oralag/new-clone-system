<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getReceivableList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="客户名称">
              <el-input v-model="searchForm.customer_name" placeholder="请输入客户名称" clearable style="width:180px" />
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
            <el-button @click="Object.assign(searchForm, { customer_name: '', date_range: null }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <el-table-column prop="customer_name" label="客户名称" min-width="140" />
        <el-table-column prop="order_no" label="订单编号" min-width="160" />
        <el-table-column prop="order_amount" label="订单金额" min-width="120" />
        <el-table-column prop="received_amount" label="已收金额" min-width="120" />
        <el-table-column prop="un_receive_amount" label="未收金额" min-width="120" />
        <el-table-column prop="due_date" label="到期日期" min-width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { getReceivableList } from '@/api/finance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ customer_name: '', date_range: null })
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
