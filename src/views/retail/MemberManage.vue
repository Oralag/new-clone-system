<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item :label="$t('retail.memberManage.keyword')">
          <el-input v-model="searchForm.keyword" :placeholder="$t('retail.memberManage.keywordPlaceholder')" clearable style="width:200px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">{{ $t('retail.memberManage.search') }}</el-button>
          <el-button @click="onReset">{{ $t('retail.memberManage.reset') }}</el-button>
          <el-button type="primary" :icon="Plus" @click="onAdd">{{ $t('retail.memberManage.add') }}</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getMemberList"
          del-path="/retail/member/batchDel"
          :export-file-name="$t('retail.memberManage.title')" :params="searchForm">
        <el-table-column :label="$t('retail.memberManage.nickname')" prop="nickname" />
        <el-table-column :label="$t('retail.memberManage.mobile')" prop="mobile" />
        <el-table-column :label="$t('retail.memberManage.level')" prop="level_name" />
        <el-table-column :label="$t('retail.memberManage.balance')" prop="balance" />
        <el-table-column :label="$t('retail.memberManage.points')" prop="points" />
        <el-table-column :label="$t('retail.memberManage.operation')" width="150">
          <template #default="{ row }">
            <el-button type="primary" link @click="onEdit(row)">{{ $t('retail.memberManage.edit') }}</el-button>
            <el-button type="danger" link @click="onDelete(row.id)">{{ $t('retail.memberManage.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="$t('retail.memberManage.nickname')" prop="nickname">
          <el-input v-model="form.nickname" :placeholder="$t('retail.memberManage.nicknamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.memberManage.mobile')">
          <el-input v-model="form.mobile" :placeholder="$t('retail.memberManage.mobilePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.memberManage.level')">
          <el-input v-model="form.level_name" :placeholder="$t('retail.memberManage.levelPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.memberManage.remark')">
          <el-input v-model="form.remark" type="textarea" :rows="3" :placeholder="$t('retail.memberManage.remarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('retail.memberManage.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="onSubmit">{{ $t('retail.memberManage.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getMemberList, createMember, updateMember, deleteMember } from '@/api/retail'

const { t } = useI18n()

const scTable = ref()
const searchForm = reactive<any>({ keyword: '' })
const dialogVisible = ref(false)
const dialogTitle = ref('')
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

const rules = computed(() => ({
  nickname: [{ required: true, message: t('retail.memberManage.nicknameRequired'), trigger: 'blur' }]
}))

function onReset() {
  searchForm.keyword = ''
  scTable.value.loadData()
}

function onAdd() {
  isEdit.value = false
  dialogTitle.value = t('retail.memberManage.addMember')
  dialogVisible.value = true
}

function onEdit(row: any) {
  isEdit.value = true
  dialogTitle.value = t('retail.memberManage.editMember')
  Object.assign(form, row)
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm(t('retail.memberManage.deleteConfirm'), t('retail.memberManage.deleteTip'), { type: 'warning' })
  await deleteMember(id)
  ElMessage.success(t('retail.memberManage.deleteSuccess'))
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
    ElMessage.success(isEdit.value ? t('retail.memberManage.editSuccess') : t('retail.memberManage.addSuccess'))
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
