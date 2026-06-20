<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getGoodsPriceList"
          del-path="/goods/ShopGoodsPrice/batchDel"
          :export-file-name="$t('goods.price.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('goods.price.searchGoodsNameLabel')">
              <el-input v-model="searchForm.goods_name" :placeholder="$t('goods.price.searchGoodsNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('goods.price.btnSearch') }}</el-button>
            <el-button @click="Object.assign(searchForm, { goods_name: '' }); tableRef?.loadData()">{{ $t('goods.price.btnReset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="goods_sn" :label="$t('goods.price.colGoodsSn')" min-width="140" />
        <el-table-column prop="goods_name" :label="$t('goods.price.colGoodsName')" min-width="160" />
        <el-table-column prop="cost_price" :label="$t('goods.price.colCostPrice')" min-width="100" />
        <el-table-column prop="sell_price" :label="$t('goods.price.colSellPrice')" min-width="100" />
        <el-table-column prop="min_price" :label="$t('goods.price.colMinPrice')" min-width="100" />
        <el-table-column prop="vip_price" :label="$t('goods.price.colVipPrice')" min-width="100" />
        <el-table-column :label="$t('goods.price.colActions')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openForm(row)">{{ $t('goods.price.btnEditPrice') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="$t('goods.price.formTitle')" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('goods.price.formSellPriceLabel')" prop="sell_price">
          <el-input-number v-model="form.sell_price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('goods.price.formMinPriceLabel')" prop="min_price">
          <el-input-number v-model="form.min_price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('goods.price.formVipPriceLabel')" prop="vip_price">
          <el-input-number v-model="form.vip_price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getGoodsPriceList, updateGoodsPrice } from '@/api/goods'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const searchForm = reactive<any>({ goods_name: '' })

function openForm(row?: any) {
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await updateGoodsPrice(data)
    ElMessage.success(t('goods.price.msgSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
