<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getCustomerSeaList"
          del-path="/shop/ShopCustomer/seaIndex"
          export-file-name="客户公海" :params="searchForm">
        <template #search>
          <el-form-item label="客户名称">
            <el-input v-model="searchForm.keyword" placeholder="名称/手机号" clearable style="width: 180px" />
          </el-form-item>
        </template>
        <el-table-column type="index" label="序号" width="60" />
        <el-table-column prop="nickname" label="客户名称" min-width="150" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column prop="level_name" label="客户等级" width="100" />
        <el-table-column prop="source_name" label="来源" width="100" />
        <el-table-column prop="create_time" label="进入公海时间" width="160" />
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" link @click="handleClaim(row.id)">认领</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getCustomerSeaList, claimFromSea } from '@/api/sale'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<Record<string, any>>({})

async function handleClaim(id: number) {
  await claimFromSea({ id })
  ElMessage.success('认领成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container { padding: 0; }
</style>
