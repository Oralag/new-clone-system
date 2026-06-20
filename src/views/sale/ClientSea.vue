<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCustomerSeaList"
          del-path="/shop/ShopCustomer/seaIndex"
          :export-file-name="$t('sale.sea.exportFileName')" :params="searchForm"
          :export-columns="{ nickname: $t('sale.sea.exportColCustomerName'), mobile: $t('sale.sea.exportColMobile'), level_name: $t('sale.sea.exportColLevelName'), source_name: $t('sale.sea.exportColSourceName'), create_time: $t('sale.sea.exportColEnterTime') }">
        <template #search>
          <el-form-item :label="$t('sale.sea.searchLabel')">
            <el-input v-model="searchForm.keyword" :placeholder="$t('sale.sea.searchPlaceholder')" clearable style="width: 180px" />
          </el-form-item>
        </template>
        <el-table-column type="index" :label="$t('sale.sea.colIndex')" width="60" />
        <el-table-column prop="nickname" :label="$t('sale.sea.colCustomerName')" min-width="150" />
        <el-table-column prop="mobile" :label="$t('sale.sea.colMobile')" width="130" />
        <el-table-column prop="level_name" :label="$t('sale.sea.colLevelName')" width="100" />
        <el-table-column prop="source_name" :label="$t('sale.sea.colSourceName')" width="100" />
        <el-table-column prop="create_time" :label="$t('sale.sea.colEnterTime')" width="160" />
        <el-table-column :label="$t('sale.sea.colAction')" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleClaim(row.id)">{{ $t('sale.sea.btnClaim') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getCustomerSeaList, claimFromSea } from '@/api/sale'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<Record<string, any>>({})

async function handleClaim(id: number) {
  await claimFromSea({ id })
  ElMessage.success(t('sale.sea.msgClaimSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container { padding: 0; }
</style>
