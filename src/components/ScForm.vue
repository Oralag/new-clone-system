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
        <div class="create-time-note" v-if="formData.create_time">创建时间：{{ formData.create_time }}</div>
        <div class="footer-btns">
          <el-button @click="handleClose">关 闭</el-button>
          <template v-if="isView">
            <el-button type="primary" @click="isView = false">编 辑</el-button>
          </template>
          <template v-else>
            <el-button type="primary" :loading="submitting" @click="handleSubmit">确 认</el-button>
          </template>
        </div>
      </div>
    </template>
  </el-drawer>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'

interface Props {
  title?: string
  size?: string | number
  labelWidth?: string
  rules?: FormRules
}

const props = withDefaults(defineProps<Props>(), {
  title: '表单',
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

const drawerTitle = computed(() => {
  if (isView.value) return props.title.replace(/^编辑|^新增/, '查看')
  return props.title
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
