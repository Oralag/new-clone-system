<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="姓名/手机号" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getMemberList" :params="searchForm">
        <el-table-column label="昵称" prop="nickname" />
        <el-table-column label="手机号" prop="mobile" />
        <el-table-column label="等级" prop="level_name" />
        <el-table-column label="余额" prop="balance" />
        <el-table-column label="积分" prop="points" />
        <el-table-column label="操作" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="onEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="form.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="form.mobile" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="等级">
          <el-input v-model="form.level_name" placeholder="请输入等级" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMemberList, createMember, updateMember, deleteMember } from '@/api/retail'

const scTable = ref()
const searchForm = reactive<any>({ keyword: '' })
const dialogVisible = ref(false)
const dialogTitle = ref('新增会员')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)

const form = reactive<any>({
  id: null,
  nickname: '',
  mobile: '',
  level_name: '',
  remark: ''
})

const rules = {
  nickname: [{ required: true, message: '请输入昵称', trigger: 'blur' }]
}

function onReset() {
  searchForm.keyword = ''
  scTable.value.loadData()
}

function onAdd() {
  isEdit.value = false
  dialogTitle.value = '新增会员'
  dialogVisible.value = true
}

function onEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑会员'
  Object.assign(form, row)
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteMember(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateMember(form)
    } else {
      await createMember(form)
    }
    ElMessage.success(isEdit.value ? '编辑成功' : '新增成功')
    dialogVisible.value = false
    scTable.value.loadData()
  } finally {
    submitLoading.value = false
  }
}

function onDialogClosed() {
  formRef.value?.resetFields()
  Object.assign(form, { id: null, nickname: '', mobile: '', level_name: '', remark: '' })
}
</script>

<style scoped>
.page-container {}
</style>
