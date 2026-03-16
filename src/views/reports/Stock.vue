<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="仓库">
          <el-input v-model="searchForm.warehouse_name" placeholder="请输入仓库名称" clearable style="width:150px" />
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getStockReportList" export-file-name="库存报表" :params="searchForm">
        <el-table-column label="商品编码" prop="goods_sn" width="120" />
        <el-table-column label="商品名称" prop="goods_name" min-width="140" />
        <el-table-column label="分类" prop="cate_name" width="100" />
        <el-table-column label="单位" prop="unit_name" width="70" align="center" />
        <el-table-column label="期初库存" prop="opening_stock" width="100" align="right" />
        <el-table-column label="入库数量" prop="in_num" width="100" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">+{{ row.in_num || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库数量" prop="out_num" width="100" align="right">
          <template #default="{ row }">
            <span style="color:#ef4444">-{{ row.out_num || 0 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="期末库存" prop="closing_stock" width="100" align="right">
          <template #default="{ row }">
            <span :style="{ fontWeight: 600, color: (row.closing_stock || 0) > 0 ? '#1d1d1f' : '#ef4444' }">
              {{ row.closing_stock || 0 }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="仓库名称" prop="warehouse_name" min-width="110" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import ScTable from '@/components/ScTable.vue'
import { getStockReportList } from '@/api/reports'

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
