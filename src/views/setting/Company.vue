<template>
  <div class="page-container">
    <el-card title="企业信息">
      <el-form :model="form" label-width="120px" label-position="right" v-loading="loading">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item label="企业名称">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="联系电话">
              <el-input v-model="form.mobile" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="企业地址">
              <el-input v-model="form.address" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="统一信用代码">
              <el-input v-model="form.credit_code" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getCompanyInfo, updateCompanyInfo } from '@/api/setting'

const loading = ref(false)
const saving = ref(false)
const form = reactive<any>({})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getCompanyInfo()
    Object.assign(form, res.data || res)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await updateCompanyInfo(form)
    ElMessage.success('保存成功')
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container {}
</style>
