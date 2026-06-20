<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getBatchList"
          del-path="/stock/Batch/batchDel"
          export-file-name="批次管理" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" :placeholder="$t('warehouse.batch.searchGoodsName')" clearable style="width: 180px" />
          <el-input v-model="searchForm.batch_no" :placeholder="$t('warehouse.batch.searchBatchNo')" clearable style="width: 160px" />
        </template>

        <el-table-column prop="batch_no" :label="$t('warehouse.batch.colBatchNo')" width="160" />
        <el-table-column prop="goods_name" :label="$t('warehouse.batch.colGoodsName')" min-width="150" />
        <el-table-column prop="num" :label="$t('warehouse.batch.colNum')" width="100" />
        <el-table-column prop="produce_date" :label="$t('warehouse.batch.colProduceDate')" width="130" />
        <el-table-column prop="expire_date" :label="$t('warehouse.batch.colExpireDate')" width="130" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.batch.colWarehouseName')" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { useI18n } from 'vue-i18n'

import { getBatchList } from '@/api/warehouse'

const { t } = useI18n()
const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  batch_no: ''
})
</script>
