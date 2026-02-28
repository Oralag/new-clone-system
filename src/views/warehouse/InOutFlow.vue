<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getFlowList" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width: 180px" />
          <el-select v-model="searchForm.type" placeholder="出入库类型" clearable style="width: 140px">
            <el-option label="入库" value="in" />
            <el-option label="出库" value="out" />
          </el-select>
          <el-date-picker
            v-model="searchForm.date_range"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width: 240px"
          />
        </template>

        <el-table-column prop="flow_no" label="流水编号" width="160" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="type_name" label="类型" width="100" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
        <el-table-column prop="operator" label="操作人" width="120" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getFlowList } from '@/api/warehouse'

const tableRef = ref()

const searchForm = reactive({
  goods_name: '',
  type: '',
  date_range: []
})
</script>
