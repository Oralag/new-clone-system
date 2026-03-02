<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getParamsList"
          del-path="/setting/params/batchDel"
          export-file-name="系统参数" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="参数名称">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <el-table-column prop="name" label="参数名称" min-width="160" />
        <el-table-column prop="key" label="参数键" min-width="160" />
        <el-table-column prop="value" label="参数值" min-width="200" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="openEditForm(row)">编辑</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" title="编辑参数" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="参数值" prop="value">
          <el-input v-model="form.value" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getParamsList, updateParams } from '@/api/setting'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openEditForm(row: any) {
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await updateParams(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
