<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getWelfareList"
          del-path="/personnel/welfare/batchDel"
          export-file-name="福利管理" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="福利名称">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <el-table-column prop="name" label="福利名称" min-width="140" />
        <el-table-column prop="type_name" label="福利类型" min-width="120" />
        <el-table-column prop="amount" label="金额" width="120" />
        <el-table-column prop="period" label="周期" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getWelfareList } from '@/api/personnel'

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
