<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCostList"
          del-path="/finance/Cost/batchDel"
          :export-file-name="t('finance.cost.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="t('finance.cost.goodsName')">
              <el-input v-model="searchForm.goods_name" :placeholder="t('finance.cost.goodsNamePlaceholder')" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="t('finance.cost.dateRange')">
              <el-date-picker
                v-model="searchForm.date_range"
                type="daterange"
                :range-separator="t('finance.cost.dateRangeSeparator')"
                :start-placeholder="t('finance.cost.startDate')"
                :end-placeholder="t('finance.cost.endDate')"
                value-format="YYYY-MM-DD"
                style="width:240px"
              />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ t('finance.cost.query') }}</el-button>
            <el-button @click="Object.assign(searchForm, { goods_name: '', date_range: null }); tableRef?.loadData()">{{ t('finance.cost.reset') }}</el-button>
          </div>
        </template>
        <el-table-column prop="goods_name" :label="t('finance.cost.goodsName')" min-width="160" />
        <el-table-column prop="goods_sn" :label="t('finance.cost.goodsSn')" min-width="140" />
        <el-table-column prop="cost_price" :label="t('finance.cost.costPrice')" min-width="100" />
        <el-table-column prop="sell_price" :label="t('finance.cost.sellPrice')" min-width="100" />
        <el-table-column prop="profit" :label="t('finance.cost.profit')" min-width="100" />
        <el-table-column prop="profit_rate" :label="t('finance.cost.profitRate')" min-width="100" />
        <el-table-column prop="period" :label="t('finance.cost.period')" min-width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { getCostList } from '@/api/finance'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ goods_name: '', date_range: null })
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
