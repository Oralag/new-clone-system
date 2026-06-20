<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getAttendanceList"
          del-path="/personnel/attendance/batchDel"
          :export-file-name="$t('personnel.attendance.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.attendance.searchStaff')">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.attendance.searchDept')">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.attendance.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.attendance.btnReset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="staff_name" :label="$t('personnel.attendance.colStaff')" min-width="120" />
        <el-table-column prop="dept_name" :label="$t('personnel.attendance.colDept')" min-width="120" />
        <el-table-column prop="check_in" :label="$t('personnel.attendance.colCheckIn')" width="160" />
        <el-table-column prop="check_out" :label="$t('personnel.attendance.colCheckOut')" width="160" />
        <el-table-column prop="work_hours" :label="$t('personnel.attendance.colWorkHours')" width="110" />
        <el-table-column prop="status_name" :label="$t('personnel.attendance.colStatus')" width="100" />
        <el-table-column prop="date" :label="$t('personnel.attendance.colDate')" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getAttendanceList } from '@/api/personnel'

const { t: _t } = useI18n()
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
