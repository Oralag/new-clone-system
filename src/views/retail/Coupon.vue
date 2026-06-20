<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item>
          <el-button type="primary" :icon="Plus" @click="onAdd">{{ $t('retail.coupon.add') }}</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getCouponList"
          del-path="/retail/coupon/batchDel"
          :export-file-name="$t('retail.coupon.title')" :params="searchForm">
        <el-table-column :label="$t('retail.coupon.name')" prop="name" />
        <el-table-column :label="$t('retail.coupon.type')" prop="type_name" />
        <el-table-column :label="$t('retail.coupon.discountAmount')" prop="discount" />
        <el-table-column :label="$t('retail.coupon.minConsumption')" prop="min_amount" />
        <el-table-column :label="$t('retail.coupon.issueQty')" prop="total_num" />
        <el-table-column :label="$t('retail.coupon.usedQty')" prop="used_num" />
        <el-table-column :label="$t('retail.coupon.expireDate')" prop="expire_date" />
        <el-table-column :label="$t('retail.coupon.status')" prop="status_tag" />
        <el-table-column :label="$t('retail.coupon.operation')" width="100">
          <template #default="{ row }">
            <el-button type="danger" link @click="onDelete(row.id)">{{ $t('retail.coupon.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="$t('retail.coupon.addCoupon')" width="500px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item :label="$t('retail.coupon.name')" prop="name">
          <el-input v-model="form.name" :placeholder="$t('retail.coupon.namePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('retail.coupon.type')">
          <el-select v-model="form.type" :placeholder="$t('retail.coupon.typePlaceholder')" style="width:100%">
            <el-option :label="$t('retail.coupon.typeFull')" value="满减券" />
            <el-option :label="$t('retail.coupon.typeDiscount')" value="折扣券" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('retail.coupon.discountAmount')">
          <el-input-number v-model="form.discount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('retail.coupon.minConsumption')">
          <el-input-number v-model="form.min_amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('retail.coupon.issueQty')">
          <el-input-number v-model="form.total_num" :min="0" :precision="0" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('retail.coupon.expireDate')">
          <el-date-picker v-model="form.expire_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('retail.coupon.cancel') }}</el-button>
        <el-button type="primary" :loading="submitLoading" @click="onSubmit">{{ $t('retail.coupon.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { useI18n } from 'vue-i18n'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getCouponList, createCoupon, deleteCoupon } from '@/api/retail'

const { t } = useI18n()

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

const rules = computed(() => ({
  name: [{ required: true, message: t('retail.coupon.nameRequired'), trigger: 'blur' }]
}))

function onAdd() {
  dialogVisible.value = true
}

async function onDelete(id: number) {
  await ElMessageBox.confirm(t('retail.coupon.deleteConfirm'), t('retail.coupon.deleteTip'), { type: 'warning' })
  await deleteCoupon(id)
  ElMessage.success(t('retail.coupon.deleteSuccess'))
  scTable.value.loadData()
}

async function onSubmit() {
  await formRef.value.validate()
  submitLoading.value = true
  try {
    await createCoupon(form)
    ElMessage.success(t('retail.coupon.addSuccess'))
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
