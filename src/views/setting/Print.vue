<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getPrintList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="模板名称">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="type_name" label="模板类型" min-width="140" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getPrintList } from '@/api/setting'

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
