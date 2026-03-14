<template>
  <div class="page-container">
    <el-card data-guide-id="guide-sale-rate-card">
      <el-form :model="searchForm" inline>
        <el-form-item label="员工姓名">
          <el-select v-model="searchForm.admin_name" placeholder="请选择员工" clearable style="width:180px">
            <el-option v-for="s in staffList" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
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
      <ScTable ref="scTable" :api-obj="getSaleRateList"
          export-file-name="销售统计" :params="searchForm">
        <el-table-column label="员工姓名" prop="admin_name" />
        <el-table-column label="订单数" prop="order_count" />
        <el-table-column label="总金额" prop="total_amount" />
        <el-table-column label="平均金额" prop="avg_amount" />
        <el-table-column label="周期" prop="period" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getSaleRateList } from '@/api/reports'
import { getStaffList } from '@/api/personnel'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const staffList = ref<any[]>([])
const searchForm = reactive<any>({ admin_name: '' })

onMounted(async () => {
  const res = await getStaffList({ list_rows: 200 })
  staffList.value = res.data?.rows ?? []
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
  searchForm.admin_name = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
