<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSocialList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="员工姓名">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="部门">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <el-table-column prop="staff_name" label="员工姓名" min-width="120" />
        <el-table-column prop="dept_name" label="部门" min-width="120" />
        <el-table-column prop="social_base" label="社保基数" width="120" />
        <el-table-column prop="company_pay" label="公司缴纳" width="120" />
        <el-table-column prop="staff_pay" label="个人缴纳" width="120" />
        <el-table-column prop="period" label="缴纳周期" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getSocialList } from '@/api/personnel'

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
