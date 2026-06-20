<template>
  <div class="page-container">
    <el-card title="企业信息">
      <el-form :model="form" label-width="120px" label-position="right" v-loading="loading">
        <el-row :gutter="24">
          <el-col :span="12">
            <el-form-item :label="$t('setting.company.fieldName')">
              <el-input v-model="form.name" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('setting.company.fieldMobile')">
              <el-input v-model="form.mobile" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('setting.company.fieldAddress')">
              <el-input v-model="form.address" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('setting.company.fieldCreditCode')">
              <el-input v-model="form.credit_code" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item>
              <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('setting.company.btnSave') }}</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </el-card>

    <el-card class="danger-zone">
      <template #header>
        <span class="danger-title">{{ $t('setting.company.dangerZoneTitle') }}</span>
      </template>
      <div class="danger-item">
        <div class="danger-desc">
          <p class="danger-name">{{ $t('setting.company.dangerInitTitle') }}</p>
          <p class="danger-hint">{{ $t('setting.company.dangerInitHint') }}</p>
        </div>
        <el-button type="danger" plain @click="handleInitAll">{{ $t('setting.company.btnInitAll') }}</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useAppStore } from '@/stores/app'
import { getCompanyInfo, updateCompanyInfo } from '@/api/setting'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()
const appStore = useAppStore()

const loading = ref(false)
const saving = ref(false)
const form = reactive<any>({})

const SAFE_RESET_KEYS = [
  'erp_theme',
  'stock_sidebar_w',
  'procure_order_from_plan',
  'procure_order_from_bom',
  'sale_contract_draft_from_offer',
  'saleout_from_contract',
  'cr_store_id',
]

async function loadData() {
  loading.value = true
  try {
    const res: any = await getCompanyInfo()
    // http拦截器返回完整响应体 {code,data,message}，企业信息在 res.data
    const info = res.data ?? res
    Object.assign(form, info)
    if (info.name) appStore.setCompanyName(info.name)
  } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    await updateCompanyInfo(form)
    if (form.name) appStore.setCompanyName(form.name)
    ElMessage.success(t('setting.company.msgSaveSuccess'))
  } finally {
    saving.value = false
  }
}

async function handleInitAll() {
  try {
    await ElMessageBox.confirm(
      t('setting.company.confirmInitMsg'),
      t('setting.company.confirmInitTitle'),
      {
        confirmButtonText: t('setting.company.confirmInitBtn'),
        cancelButtonText: t('setting.company.confirmCancelBtn'),
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )
    SAFE_RESET_KEYS.forEach((key) => localStorage.removeItem(key))
    sessionStorage.clear()
    authStore.clearAuth()
    ElMessage.success(t('setting.company.msgInitDone'))
    setTimeout(() => router.push('/login'), 1000)
  } catch {
    // 用户取消
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.danger-zone { border-color: #fde2e2; }
.danger-zone :deep(.el-card__header) { background: #fff5f5; border-bottom-color: #fde2e2; }
.danger-title { color: #f56c6c; font-weight: 600; font-size: 14px; }
.danger-item { display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.danger-desc { flex: 1; }
.danger-name { margin: 0 0 4px; font-weight: 500; color: #303133; }
.danger-hint { margin: 0; font-size: 12px; color: #909399; line-height: 1.5; }
</style>
