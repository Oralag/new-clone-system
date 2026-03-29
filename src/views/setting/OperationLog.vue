<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getOperationLogList"
          export-file-name="None" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="操作人">
              <el-input v-model="searchForm.operator_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="操作行为">
              <el-input v-model="searchForm.action" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <el-table-column prop="operator_name" label="操作人" min-width="120" />
        <el-table-column prop="action" label="操作行为" min-width="200" />
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="create_time" label="操作时间" width="180">
          <template #default="{ row }">{{ fmtDt(row.create_time) }}</template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getOperationLogList } from '@/api/setting'
import { fmtDt } from '@/utils/date'

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
