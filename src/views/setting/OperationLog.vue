<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getOperationLogList"
          export-file-name="None" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('setting.operationLog.searchOperator')">
              <el-input v-model="searchForm.operator_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('setting.operationLog.searchAction')">
              <el-input v-model="searchForm.action" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('setting.operationLog.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('setting.operationLog.btnReset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="operator_name" :label="$t('setting.operationLog.colOperator')" min-width="120" />
        <el-table-column prop="action" :label="$t('setting.operationLog.colAction')" min-width="200" />
        <el-table-column prop="ip" :label="$t('setting.operationLog.colIp')" width="140" />
        <el-table-column prop="create_time" :label="$t('setting.operationLog.colTime')" width="180">
          <template #default="{ row }">{{ fmtDt(row.create_time) }}</template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getOperationLogList } from '@/api/setting'
import { fmtDt } from '@/utils/date'

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
