<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCostList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="商品名称">
              <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="searchForm.date_range"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                value-format="YYYY-MM-DD"
                style="width:240px"
              />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { goods_name: '', date_range: null }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="goods_sn" label="商品编码" min-width="140" />
        <el-table-column prop="cost_price" label="成本价" min-width="100" />
        <el-table-column prop="sell_price" label="销售价" min-width="100" />
        <el-table-column prop="profit" label="利润" min-width="100" />
        <el-table-column prop="profit_rate" label="利润率" min-width="100" />
        <el-table-column prop="period" label="核算周期" min-width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import { getCostList } from '@/api/finance'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ goods_name: '', date_range: null })
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
