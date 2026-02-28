<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getOutsourcePayableList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="供应商">
              <el-input v-model="searchForm.supplier_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="订单编号">
              <el-input v-model="searchForm.order_no" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <el-table-column prop="supplier_name" label="供应商" min-width="140" />
        <el-table-column prop="order_no" label="订单编号" min-width="140" />
        <el-table-column prop="order_amount" label="订单金额" width="120" />
        <el-table-column prop="paid_amount" label="已付金额" width="120" />
        <el-table-column prop="un_pay_amount" label="未付金额" width="120" />
        <el-table-column prop="due_date" label="到期日期" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getOutsourcePayableList } from '@/api/outsource'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
