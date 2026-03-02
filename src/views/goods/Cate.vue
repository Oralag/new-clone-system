<template>
  <div class="page-container">
    <el-card>
      <ScTable
        ref="tableRef"
        :api-obj="getGoodsCateList"
        :params="searchForm"
        sort-by="sort"
        :batch-del-api="batchDeleteGoodsCate"
        :import-api="createGoodsCate"
        export-file-name="商品分类"
      >
        <template #search>
          <el-form inline>
            <el-form-item label="分类名称">
              <el-input v-model="searchForm.name" placeholder="请输入分类名称" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { name: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="name" label="分类名称" min-width="160" />
        <el-table-column prop="parent_name" label="上级分类" min-width="140" />
        <el-table-column prop="sort" label="排序" min-width="80" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">查看</el-button>
              <el-button type="primary" link @click="openForm(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="分类名称" prop="name" :rules="[{ required: true, message: '请输入分类名称' }]">
          <el-input v-model="form.name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="上级分类" prop="parent_name">
          <el-input v-model="form.parent_name" placeholder="请输入上级分类" />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getGoodsCateList, createGoodsCate, updateGoodsCate, deleteGoodsCate } from '@/api/goods'
import http from '@/api/http'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增')
const searchForm = reactive<any>({ name: '' })

// Batch delete API wrapper
const batchDeleteGoodsCate = (data: { ids: number[] }) => http.post('/goods/ShopGoodsCate/batchDel', data)

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    const { parent_name, ...payload } = data
    payload.id ? await updateGoodsCate(payload) : await createGoodsCate(payload)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteGoodsCate(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>

