<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getQualityList"
          del-path="/outsource/quality/batchDel"
          export-file-name="质检记录" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="质检编号">
              <el-input v-model="searchForm.quality_no" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="商品名称">
              <el-input v-model="searchForm.goods_name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="quality_no" label="质检编号" min-width="140" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="qualified_num" label="合格数量" width="110" />
        <el-table-column prop="reject_num" label="不合格数量" width="120" />
        <el-table-column prop="status_tag" label="状态" width="100" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="商品名称" :rules="[{ required: true, message: '请输入商品名称' }]" prop="goods_name">
          <el-input v-model="form.goods_name" />
        </el-form-item>
        <el-form-item label="数量" :rules="[{ required: true, message: '请输入数量' }]" prop="num">
          <el-input-number v-model="form.num" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="合格数量" prop="qualified_num">
          <el-input-number v-model="form.qualified_num" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="不合格数量" prop="reject_num">
          <el-input-number v-model="form.reject_num" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="3" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getQualityList, createQuality, deleteQuality } from '@/api/outsource'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增质检')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = '新增质检'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createQuality(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该质检记录？', '提示', { type: 'warning' })
  await deleteQuality(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
