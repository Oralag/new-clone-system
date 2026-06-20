<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item :label="$t('reports.stock.goodsNameLabel')">
          <el-input v-model="searchForm.goods_name" :placeholder="$t('reports.stock.goodsNamePlaceholder')" clearable style="width:180px" />
        </el-form-item>
        <el-form-item :label="$t('reports.stock.warehouseLabel')">
          <el-input v-model="searchForm.warehouse_name" :placeholder="$t('reports.stock.warehousePlaceholder')" clearable style="width:150px" />
        </el-form-item>
        <el-form-item :label="$t('reports.stock.dateLabel')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('reports.stock.rangeSeparator')"
            :start-placeholder="$t('reports.stock.startPlaceholder')"
            :end-placeholder="$t('reports.stock.endPlaceholder')"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">{{ $t('reports.stock.query') }}</el-button>
          <el-button @click="onReset">{{ $t('reports.stock.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getStockReportList" :export-file-name="$t('reports.stock.exportFileName')" :params="searchForm">
        <el-table-column :label="$t('reports.stock.colGoodsSn')" prop="goods_sn" width="120" />
        <el-table-column :label="$t('reports.stock.colGoodsName')" prop="goods_name" min-width="140" />
        <el-table-column :label="$t('reports.stock.colCate')" prop="cate_name" width="100" />
        <el-table-column :label="$t('reports.stock.colUnit')" prop="unit_name" width="70" align="center" />
        <el-table-column :label="$t('reports.stock.colWarehouse')" prop="warehouse_name" min-width="110" />
        <el-table-column :label="$t('reports.stock.colQty')" prop="qty" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ fontWeight: 600, color: Number(row.qty || 0) > 0 ? '#1d1d1f' : '#ef4444' }">
              {{ row.qty || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.stock.colAvgPrice')" prop="avg_price" width="100" align="right">
          <template #default="{ row }">¥{{ Number(row.avg_price || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column :label="$t('reports.stock.colLockQty')" prop="lock_qty" width="100" align="right" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getStockReportList } from '@/api/reports'

const { t: _t } = useI18n()
const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({ goods_name: '', warehouse_name: '' })

function onDateChange(val: [string, string] | null) {
  if (val) {
    searchForm.start_date = val[0]
    searchForm.end_date = val[1]
  } else {
    delete searchForm.start_date
    delete searchForm.end_date
  }
}

function onReset() {
  searchForm.goods_name = ''
  searchForm.warehouse_name = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value?.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
