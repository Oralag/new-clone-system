<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getWelfareList"
          del-path="/personnel/welfare/batchDel"
          :export-file-name="$t('personnel.welfare.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.welfare.searchName')">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.welfare.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.welfare.btnReset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="name" :label="$t('personnel.welfare.colName')" min-width="140" />
        <el-table-column prop="type_name" :label="$t('personnel.welfare.colTypeName')" min-width="120" />
        <el-table-column prop="amount" :label="$t('personnel.welfare.colAmount')" width="120" />
        <el-table-column prop="period" :label="$t('personnel.welfare.colPeriod')" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getWelfareList } from '@/api/personnel'

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
