<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="商品名称">
          <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="仓库名称">
          <el-input v-model="searchForm.warehouse_name" placeholder="请输入仓库名称" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getStockReportList" :params="searchForm">
        <el-table-column label="商品编码" prop="goods_sn" />
        <el-table-column label="商品名称" prop="goods_name" />
        <el-table-column label="分类" prop="cate_name" />
        <el-table-column label="期初库存" prop="opening_stock" />
        <el-table-column label="入库数量" prop="in_num" />
        <el-table-column label="出库数量" prop="out_num" />
        <el-table-column label="期末库存" prop="closing_stock" />
        <el-table-column label="仓库名称" prop="warehouse_name" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getStockReportList } from '@/api/reports'

const scTable = ref()
const searchForm = reactive<any>({
  goods_name: '',
  warehouse_name: ''
})

function onReset() {
  searchForm.goods_name = ''
  searchForm.warehouse_name = ''
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
