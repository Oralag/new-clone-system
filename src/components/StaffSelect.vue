<template>
  <div style="display:flex;gap:4px;width:100%">
    <el-select
      v-model="selected"
      filterable
      :placeholder="placeholder || t('staffSelect.placeholder')"
      style="flex:1"
      @change="emit('update:modelValue', selected)"
    >
      <el-option v-for="s in options" :key="s.id" :label="s.name" :value="valueKey === 'id' ? s.id : s.name" />
    </el-select>
    <el-button :icon="Plus" @click="addVisible = true" />

    <!-- 快速新增员工弹框 -->
    <el-dialog v-model="addVisible" :title="t('staffSelect.quickAddTitle')" width="360px" append-to-body>
      <el-form :model="addForm" label-width="80px">
        <el-form-item :label="t('staffSelect.labelName')" required>
          <el-input v-model="addForm.name" :placeholder="t('staffSelect.namePlaceholder')" @keyup.enter="handleAdd" />
        </el-form-item>
        <el-form-item :label="t('staffSelect.labelMobile')">
          <el-input v-model="addForm.mobile" :placeholder="t('staffSelect.mobilePlaceholder')" />
        </el-form-item>
        <el-form-item :label="t('staffSelect.labelJob')">
          <el-input v-model="addForm.job_name" :placeholder="t('staffSelect.jobPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="adding" @click="handleAdd">{{ t('staffSelect.confirmAdd') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import { getStaffList, createStaff } from '@/api/personnel'

const { t } = useI18n()

const props = withDefaults(defineProps<{
  modelValue?: any
  placeholder?: string
  valueKey?: 'id' | 'name'
}>(), {
  valueKey: 'name',
})

const emit = defineEmits<{ (e: 'update:modelValue', val: any): void }>()

const options = ref<any[]>([])
const selected = ref(props.modelValue)

watch(() => props.modelValue, v => { selected.value = v })

async function loadStaff() {
  try {
    const res = await getStaffList({ list_rows: 500 })
    options.value = res.data?.rows ?? []
  } catch { /* ignore */ }
}

// 快速新增
const addVisible = ref(false)
const adding = ref(false)
const addForm = ref({ name: '', mobile: '', job_name: '' })

async function handleAdd() {
  if (!addForm.value.name.trim()) { ElMessage.warning(t('staffSelect.nameRequired')); return }
  adding.value = true
  try {
    const name = addForm.value.name.trim()
    // setting/Admin requires account + password; auto-generate account from name
    const account = 'staff_' + name.replace(/\s+/g, '') + '_' + Date.now().toString().slice(-6)
    const res = await createStaff({ name, account, password: '123456', mobile: addForm.value.mobile, remark: addForm.value.job_name, role_id: 0 })
    ElMessage.success(t('staffSelect.addSuccess'))
    addVisible.value = false
    addForm.value = { name: '', mobile: '', job_name: '' }
    await loadStaff()
    // 自动选中新增的员工
    const newId = res.data?.id
    const newStaff = options.value.find(s => s.id === newId) ?? options.value.find(s => s.name === name)
    if (newStaff) {
      selected.value = props.valueKey === 'id' ? newStaff.id : newStaff.name
      emit('update:modelValue', selected.value)
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('staffSelect.addFailed'))
  } finally {
    adding.value = false
  }
}

onMounted(loadStaff)
</script>
