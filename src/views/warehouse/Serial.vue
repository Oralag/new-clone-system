<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getSerialList"
          del-path="/stock/Serial/batchDel"
          :export-file-name="$t('warehouse.serial.exportFileName')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.serial_no" :placeholder="$t('warehouse.serial.searchSerialNo')" clearable style="width: 180px" />
          <el-input v-model="searchForm.goods_name" :placeholder="$t('warehouse.serial.searchGoodsName')" clearable style="width: 180px" />
        </template>

        <el-table-column prop="serial_no" :label="$t('warehouse.serial.colSerialNo')" width="180" />
        <el-table-column prop="goods_name" :label="$t('warehouse.serial.colGoodsName')" min-width="160" />
        <el-table-column prop="status_name" :label="$t('warehouse.serial.colStatus')" width="120" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.serial.colWarehouseName')" width="150" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getSerialList } from '@/api/warehouse'

const { t: _t } = useI18n()
const tableRef = ref()

const searchForm = reactive({
  serial_no: '',
  goods_name: ''
})
</script>
