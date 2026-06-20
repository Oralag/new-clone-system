<template>
  <el-drawer
    v-model="visible"
    :title="drawerTitle"
    :size="size"
    :close-on-click-modal="false"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-form
      ref="formRef"
      :model="formData"
      :rules="rules"
      :label-width="labelWidth"
      label-position="top"
      :disabled="isView"
    >
      <slot :form="formData" />
    </el-form>

    <template #footer>
      <div class="form-footer">
        <div class="create-time-note" v-if="formData.create_time">{{ t('scForm.createdAt') }}: {{ fmtDt(formData.create_time) }}</div>
        <div class="footer-btns">
          <el-button @click="handleClose">{{ t('common.close') }}</el-button>
          <template v-if="isView">
            <el-button type="primary" @click="isView = false">{{ t('common.edit') }}</el-button>
          </template>
          <template v-else>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ t('common.confirm') }}</el-button>
          </template>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { fmtDt } from '@/utils/date'

interface Props {
  title?: string
  size?: string | number
  labelWidth?: string
  rules?: FormRules
}

const { t } = useI18n()
const props = withDefaults(defineProps<Props>(), {
  title: '',
  size: '500px',
  labelWidth: '100px',
  rules: () => ({}),
})

const emit = defineEmits<{
  (e: 'submit', data: any, done: () => void): void
}>()

const visible = ref(false)
const submitting = ref(false)
const isView = ref(false)
const formData = ref<Record<string, any>>({})
const formRef = ref<FormInstance>()

const normalizedTitle = computed(() => props.title || t('scForm.defaultTitle'))
const drawerTitle = computed(() => {
  if (isView.value) {
    return normalizedTitle.value
      .replace(/^编辑/, t('common.view'))
      .replace(/^新增/, t('common.view'))
      .replace(/^Edit/, t('common.view'))
      .replace(/^New/, t('common.view'))
  }
  return normalizedTitle.value
})

function open(data?: Record<string, any>) {
  isView.value = false
  formData.value = data ? { ...data } : {}
  visible.value = true
}

function openView(data: Record<string, any>) {
  isView.value = true
  formData.value = { ...data }
  visible.value = true
}

function close() {
  visible.value = false
  isView.value = false
}

function handleClose() {
  close()
}

async function handleSubmit() {
  if (!formRef.value) return
  const valid = await formRef.value.validate().catch(() => false)
  if (!valid) return
  const done = () => close()
  emit('submit', { ...formData.value }, done)
}

function setSubmitting(val: boolean) {
  submitting.value = val
}

defineExpose({ open, openView, close, setSubmitting, formData })
</script>

<style scoped>
.form-footer {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.footer-btns {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
.create-time-note {
  font-size: 11px;
  color: #c0c4cc;
  text-align: right;
}
</style>
