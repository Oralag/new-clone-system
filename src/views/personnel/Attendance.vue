<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getAttendanceList"
          del-path="/personnel/attendance/batchDel"
          export-file-name="考勤记录" :params="searchForm">
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
        <el-table-column prop="check_in" label="上班打卡" width="160" />
        <el-table-column prop="check_out" label="下班打卡" width="160" />
        <el-table-column prop="work_hours" label="工作时长" width="110" />
        <el-table-column prop="status_name" label="状态" width="100" />
        <el-table-column prop="date" label="日期" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getAttendanceList } from '@/api/personnel'

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
