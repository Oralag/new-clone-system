<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getStoreList"
          del-path="/retail/store/batchDel"
          export-file-name="门店列表" :params="searchForm">
        <el-table-column label="名称" prop="name" />
        <el-table-column label="地址" prop="address" />
        <el-table-column label="负责人" prop="manager_name" />
        <el-table-column label="电话" prop="mobile" />
        <el-table-column label="状态" prop="status_tag" />
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
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入地址" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-input v-model="form.manager_name" placeholder="请输入负责人" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.mobile" placeholder="请输入电话" />
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
import { getStoreList, createStore, updateStore, deleteStore } from '@/api/retail'

const scTable = ref()
const searchForm = reactive<any>({})
const dialogVisible = ref(false)
const dialogTitle = ref('新增门店')
const submitLoading = ref(false)
const formRef = ref()
const isEdit = ref(false)

const form = reactive<any>({
  id: null,
  name: '',
  address: '',
  manager_name: '',
  mobile: '',
  remark: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

function onAdd() {
  isEdit.value = false
  dialogTitle.value = '新增门店'
  dialogVisible.value = true
}

function onEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = '编辑门店'
  Object.assign(form, row)
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteStore(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    if (isEdit.value) {
      await updateStore(form)
    } else {
      await createStore(form)
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
  Object.assign(form, { id: null, name: '', address: '', manager_name: '', mobile: '', remark: '' })
}
</script>

<style scoped>
.page-container {}
</style>
