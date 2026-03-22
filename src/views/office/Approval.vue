<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getApprovalList"
          del-path="/office/approval/batchDel"
          export-file-name="审批记录" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="标题">
              <el-input v-model="searchForm.title" placeholder="请输入标题" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="状态">
              <el-select v-model="searchForm.status" placeholder="全部状态" clearable style="width:140px">
                <el-option label="待审批" value="0" />
                <el-option label="已通过" value="1" />
                <el-option label="已驳回" value="2" />
              </el-select>
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="scTable?.loadData()">查询</el-button>
            <el-button @click="onReset">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增审批</el-button>
        </template>
        <el-table-column label="标题" prop="title" min-width="160" />
        <el-table-column label="申请人" prop="applicant_name" width="100" />
        <el-table-column label="类型" prop="type_name" width="100" />
        <el-table-column label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请时间" prop="apply_time" width="160" />
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link size="small" :disabled="row.status == 1" @click="handleAudit(row, 1)">通过</el-button>
            <el-button type="warning" link size="small" :disabled="row.status == 2" @click="handleAudit(row, 2)">驳回</el-button>
            <el-button type="primary" link size="small" @click="openForm(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="标题" prop="title" :rules="[{ required: true, message: '请输入标题' }]">
          <el-input v-model="form.title" placeholder="请输入审批标题" />
        </el-form-item>
        <el-form-item label="类型" prop="type_name">
          <el-select v-model="form.type_name" placeholder="请选择类型" style="width:100%">
            <el-option label="请假" value="请假" />
            <el-option label="报销" value="报销" />
            <el-option label="采购" value="采购" />
            <el-option label="出差" value="出差" />
            <el-option label="其他" value="其他" />
          </el-select>
        </el-form-item>
        <el-form-item label="申请人" prop="applicant_name">
          <el-input v-model="form.applicant_name" placeholder="请输入申请人" />
        </el-form-item>
        <el-form-item label="说明" prop="content">
          <el-input v-model="form.content" type="textarea" :rows="4" placeholder="请输入审批说明" />
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
import { getApprovalList, createApproval, updateApproval, deleteApproval } from '@/api/office'

const scTable = ref()
const formRef = ref()
const formTitle = ref('新增')
const searchForm = reactive<any>({ title: '', status: '' })

function statusLabel(status: any) {
  const map: Record<string, string> = { '0': '待审批', '1': '已通过', '2': '已驳回' }
  return map[String(status)] ?? '待审批'
}

function statusType(status: any) {
  const map: Record<string, string> = { '0': 'warning', '1': 'success', '2': 'danger' }
  return map[String(status)] ?? 'info'
}

function onReset() {
  searchForm.title = ''
  searchForm.status = ''
  scTable.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑' : '新增'
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    if (data.id) {
      await updateApproval(data)
    } else {
      await createApproval(data)
    }
    ElMessage.success('操作成功')
    formRef.value?.close()
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleAudit(row: any, status: number) {
  const label = status === 1 ? '通过' : '驳回'
  await ElMessageBox.confirm(`确定${label}该审批？`, '提示', { type: 'warning' })
  try {
    await updateApproval({ id: row.id, status })
    ElMessage.success(`${label}成功`)
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  try {
    await deleteApproval(id)
    ElMessage.success('删除成功')
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  }
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
