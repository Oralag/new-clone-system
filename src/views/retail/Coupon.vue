<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="onAdd">新增</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getCouponList" :params="searchForm">
        <el-table-column label="名称" prop="name" />
        <el-table-column label="类型" prop="type_name" />
        <el-table-column label="折扣/减免" prop="discount" />
        <el-table-column label="最低消费" prop="min_amount" />
        <el-table-column label="发行数量" prop="total_num" />
        <el-table-column label="已用数量" prop="used_num" />
        <el-table-column label="过期日期" prop="expire_date" />
        <el-table-column label="状态" prop="status_tag" />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="onDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" title="新增优惠券" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" placeholder="请选择类型" style="width:100%">
            <el-option label="满减券" value="满减券" />
            <el-option label="折扣券" value="折扣券" />
          </el-select>
        </el-form-item>
        <el-form-item label="折扣/减免">
          <el-input-number v-model="form.discount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="最低消费">
          <el-input-number v-model="form.min_amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="发行数量">
          <el-input-number v-model="form.total_num" :min="0" :precision="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="过期日期">
          <el-date-picker v-model="form.expire_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
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
import { getCouponList, createCoupon, deleteCoupon } from '@/api/retail'

const scTable = ref()
const searchForm = reactive<any>({})
const dialogVisible = ref(false)
const submitLoading = ref(false)
const formRef = ref()

const form = reactive<any>({
  name: '',
  type: '',
  discount: 0,
  min_amount: 0,
  total_num: 0,
  expire_date: ''
})

const rules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }]
}

function onAdd() {
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录吗？', '提示', { type: 'warning' })
  await deleteCoupon(id)
  ElMessage.success('删除成功')
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await createCoupon(form)
    ElMessage.success('新增成功')
    dialogVisible.value = false
    scTable.value.loadData()
  } finally {
    submitLoading.value = false
  }
}

function onDialogClosed() {
  formRef.value?.resetFields()
  Object.assign(form, { name: '', type: '', discount: 0, min_amount: 0, total_num: 0, expire_date: '' })
}
</script>

<style scoped>
.page-container {}
</style>
