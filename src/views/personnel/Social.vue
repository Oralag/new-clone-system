<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSocialList"
          del-path="/personnel/social/batchDel"
          export-file-name="社保记录" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="员工姓名">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="部门">
              <el-input v-model="searchForm.dept_name" clearable style="width:180px" />
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
        <el-table-column prop="staff_name" label="员工姓名" min-width="120" />
        <el-table-column prop="dept_name" label="部门" min-width="120" />
        <el-table-column prop="social_base" label="社保基数" width="120" />
        <el-table-column prop="company_pay" label="公司缴纳" width="120" />
        <el-table-column prop="staff_pay" label="个人缴纳" width="120" />
        <el-table-column prop="period" label="缴纳周期" width="120" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" title="新增社保记录" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="员工姓名" :rules="[{ required: true, message: '请输入员工姓名' }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item label="部门" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item label="社保基数" prop="social_base">
          <el-input-number v-model="form.social_base" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="公司缴纳" prop="company_pay">
          <el-input-number v-model="form.company_pay" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="个人缴纳" prop="staff_pay">
          <el-input-number v-model="form.staff_pay" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="缴纳周期" prop="period">
          <el-input v-model="form.period" placeholder="如：2024-03" />
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
import { getSocialList, createSocial, deleteSocial } from '@/api/personnel'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm() {
  formRef.value?.open()
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createSocial(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该社保记录？', '提示', { type: 'warning' })
  await deleteSocial(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
