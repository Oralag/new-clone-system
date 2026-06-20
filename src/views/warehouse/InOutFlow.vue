<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getFlowList"
          export-file-name="出入库流水" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" :placeholder="$t('warehouse.inOutFlow.searchGoodsName')" clearable style="width: 180px" />
          <el-select v-model="searchForm.type" :placeholder="$t('warehouse.inOutFlow.searchType')" clearable style="width: 140px">
            <el-option :label="$t('warehouse.inOutFlow.typeIn')" value="in" />
            <el-option :label="$t('warehouse.inOutFlow.typeOut')" value="out" />
          </el-select>
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            :range-separator="$t('warehouse.inOutFlow.searchDateSeparator')"
            :start-placeholder="$t('warehouse.inOutFlow.searchDateStart')"
            :end-placeholder="$t('warehouse.inOutFlow.searchDateEnd')"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </template>

        <el-table-column prop="flow_no" :label="$t('warehouse.inOutFlow.colFlowNo')" width="160" />
        <el-table-column prop="goods_name" :label="$t('warehouse.inOutFlow.colGoodsName')" min-width="150" />
        <el-table-column prop="type_name" :label="$t('warehouse.inOutFlow.colType')" width="100" />
        <el-table-column prop="num" :label="$t('warehouse.inOutFlow.colNum')" width="100" />
        <el-table-column prop="warehouse_name" :label="$t('warehouse.inOutFlow.colWarehouseName')" width="150" />
        <el-table-column prop="operator" :label="$t('warehouse.inOutFlow.colOperator')" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { useI18n } from 'vue-i18n'

import { getFlowList } from '@/api/warehouse'

const { t } = useI18n()
const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  type: '',
  date_range: []
})
</script>
