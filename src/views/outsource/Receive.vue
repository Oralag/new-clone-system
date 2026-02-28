<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getReceiveList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="收货编号">
              <el-input v-model="searchForm.receive_no" clearable style="width:180px" />
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
        <el-table-column prop="receive_no" label="收货编号" min-width="140" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="supplier_name" label="供应商" min-width="140" />
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
        <el-form-item label="供应商" prop="supplier_name">
          <el-input v-model="form.supplier_name" />
        </el-form-item>
        <el-form-item label="收货日期" prop="receive_date">
          <el-date-picker v-model="form.receive_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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
import { getReceiveList, createReceive, deleteReceive } from '@/api/outsource'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('新增收货')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = '新增收货'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createReceive(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该收货记录？', '提示', { type: 'warning' })
  await deleteReceive(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
