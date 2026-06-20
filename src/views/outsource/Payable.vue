<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getOutsourcePayableList"
          del-path="/outsource/payable/batchDel"
          :export-file-name="$t('outsource.payable.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('outsource.payable.searchSupplierLabel')">
              <el-input v-model="searchForm.supplier_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('outsource.payable.searchOrderNoLabel')">
              <el-input v-model="searchForm.order_no" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('outsource.payable.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('outsource.payable.btnReset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="supplier_name" :label="$t('outsource.payable.colSupplier')" min-width="140" />
        <el-table-column prop="order_no" :label="$t('outsource.payable.colOrderNo')" min-width="140" />
        <el-table-column prop="order_amount" :label="$t('outsource.payable.colOrderAmount')" width="120" />
        <el-table-column prop="paid_amount" :label="$t('outsource.payable.colPaidAmount')" width="120" />
        <el-table-column prop="un_pay_amount" :label="$t('outsource.payable.colUnpaidAmount')" width="120" />
        <el-table-column prop="due_date" :label="$t('outsource.payable.colDueDate')" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getOutsourcePayableList } from '@/api/outsource'

const { t: _t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
