<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getGoodsPriceList" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="商品名称">
              <el-input v-model="searchForm.goods_name" placeholder="请输入商品名称" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="Object.assign(searchForm, { goods_name: '' }); tableRef?.loadData()">重置</el-button>
          </div>
        </template>
        <el-table-column prop="goods_sn" label="商品编码" min-width="140" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="cost_price" label="成本价" min-width="100" />
        <el-table-column prop="sell_price" label="销售价" min-width="100" />
        <el-table-column prop="min_price" label="最低价" min-width="100" />
        <el-table-column prop="vip_price" label="VIP价" min-width="100" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="openForm(row)">修改价格</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" title="修改价格" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="销售价" prop="sell_price">
          <el-input-number v-model="form.sell_price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="最低价" prop="min_price">
          <el-input-number v-model="form.min_price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="VIP价" prop="vip_price">
          <el-input-number v-model="form.vip_price" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getGoodsPriceList, updateGoodsPrice } from '@/api/goods'

const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const searchForm = reactive<any>({ goods_name: '' })

function openForm(row?: any) {
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await updateGoodsPrice(data)
    ElMessage.success('操作成功')
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
</style>
