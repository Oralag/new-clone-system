<template>
  <div class="page-container">
    <el-card>
      <ScTable
        ref="tableRef"
        :api-obj="getGoodsCateList"
        :params="searchForm"
        sort-by="sort"
        :batch-del-api="batchDeleteGoodsCate"
        :import-api="createGoodsCate"
        :export-file-name="$t('goods.cate.exportFileName')"
      >
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('goods.cate.searchNameLabel')">
              <el-input v-model="searchForm.name" :placeholder="$t('goods.cate.searchNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('goods.cate.btnSearch') }}</el-button>
            <el-button @click="Object.assign(searchForm, { name: '' }); tableRef?.loadData()">{{ $t('goods.cate.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('goods.cate.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('goods.cate.colName')" min-width="160" />
        <el-table-column prop="parent_name" :label="$t('goods.cate.colParentName')" min-width="140" />
        <el-table-column prop="sort" :label="$t('goods.cate.colSort')" min-width="80" />
        <el-table-column :label="$t('goods.cate.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" link @click="openView(row)">{{ $t('goods.cate.btnView') }}</el-button>
              <el-button type="primary" link @click="openForm(row)">{{ $t('goods.cate.btnEdit') }}</el-button>
            <el-button type="danger" link @click="handleDelete(row.id)">{{ $t('goods.cate.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('goods.cate.formNameLabel')" prop="name" :rules="[{ required: true, message: $t('goods.cate.formNameRequired') }]">
          <el-input v-model="form.name" :placeholder="$t('goods.cate.formNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.cate.formParentLabel')" prop="parent_name">
          <el-input v-model="form.parent_name" :placeholder="$t('goods.cate.formParentPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.cate.formSortLabel')" prop="sort">
          <el-input-number v-model="form.sort" :min="0" style="width:100%" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getGoodsCateList, createGoodsCate, updateGoodsCate, deleteGoodsCate } from '@/api/goods'
import http from '@/api/http'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref(t('goods.cate.formTitleAdd'))
const searchForm = reactive<any>({ name: '' })

// Batch delete API wrapper
const batchDeleteGoodsCate = (data: { ids: number[] }) => http.post('/goods/ShopGoodsCate/batchDel', data)

function openView(row?: any) {
  formRef.value?.openView(row)
}

function openForm(row?: any) {
  formTitle.value = row ? t('goods.cate.formTitleEdit') : t('goods.cate.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    const { parent_name, ...payload } = data
    // 校验同名：拉取当前列表检查
    const listRes = await getGoodsCateList({ list_rows: 500 })
    const allCates: any[] = listRes.data?.rows ?? []
    const dup = allCates.find(c =>
      c.name === payload.name &&
      c.id !== payload.id
    )
    if (dup) {
      ElMessage.warning(t('goods.cate.msgDuplicateName'))
      return
    }
    payload.id ? await updateGoodsCate(payload) : await createGoodsCate(payload)
    ElMessage.success(t('goods.cate.msgSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('goods.cate.msgConfirmDelete'), t('goods.cate.msgTip'), { type: 'warning' })
  await deleteGoodsCate(id)
  ElMessage.success(t('goods.cate.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
