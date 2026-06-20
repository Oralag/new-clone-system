<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="onAdd">{{ $t('retail.storeManagement.add') }}</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getStoreList"
          del-path="/retail/store/batchDel"
          :export-file-name="$t('retail.storeManagement.exportFileName')" :params="searchForm">
        <el-table-column :label="$t('retail.storeManagement.name')" prop="name" />
        <el-table-column :label="$t('retail.storeManagement.address')" prop="address" />
        <el-table-column :label="$t('retail.storeManagement.manager')" prop="manager_name" />
        <el-table-column :label="$t('retail.storeManagement.mobile')" prop="mobile" />
        <el-table-column :label="$t('retail.storeManagement.status')" prop="status_tag" />
        <el-table-column :label="$t('retail.storeManagement.operation')" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="onEdit(row)">{{ $t('retail.storeManagement.edit') }}</el-button>
            <el-button type="danger" link @click="onDelete(row.id)">{{ $t('retail.storeManagement.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="$t('retail.storeManagement.name')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('retail.storeManagement.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.storeManagement.address')">
          <el-input v-model="form.address" :placeholder="$t('retail.storeManagement.addressPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.storeManagement.manager')">
          <el-input v-model="form.manager_name" :placeholder="$t('retail.storeManagement.managerPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.storeManagement.mobile')">
          <el-input v-model="form.mobile" :placeholder="$t('retail.storeManagement.mobilePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.storeManagement.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="3" :placeholder="$t('retail.storeManagement.remarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('retail.storeManagement.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="onSubmit">{{ $t('retail.storeManagement.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getStoreList, createStore, updateStore, deleteStore } from '@/api/retail'

const { t } = useI18n()

const scTable = ref()
const searchForm = reactive<any>({})
const dialogVisible = ref(false)
const dialogTitle = ref('')
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

const rules = computed(() => ({
  name: [{ required: true, message: t('retail.storeManagement.nameRequired'), trigger: 'blur' }]
}))

function onAdd() {
  isEdit.value = false
  dialogTitle.value = t('retail.storeManagement.addStore')
  dialogVisible.value = true
}

function onEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = t('retail.storeManagement.editStore')
  Object.assign(form, row)
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm(t('retail.storeManagement.deleteConfirm'), t('retail.storeManagement.deleteTip'), { type: 'warning' })
  await deleteStore(id)
  ElMessage.success(t('retail.storeManagement.deleteSuccess'))
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
    ElMessage.success(isEdit.value ? t('retail.storeManagement.editSuccess') : t('retail.storeManagement.addSuccess'))
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
