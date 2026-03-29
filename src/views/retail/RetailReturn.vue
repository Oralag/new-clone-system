<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getRetailReturnList"
          del-path="/retail/return/batchDel"
          export-file-name="零售退货" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.return_no" placeholder="退货单号" clearable style="width:160px" />
          <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:110px">
            <el-option label="待审核" :value="0" />
            <el-option label="已审核" :value="1" />
            <el-option label="已驳回" :value="2" />
          </el-select>
        </template>
        <el-table-column label="退货单号" prop="return_no" min-width="150" />
        <el-table-column label="订单编号" prop="order_no" min-width="150" />
        <el-table-column label="门店名称" prop="store_name" min-width="140" />
        <el-table-column label="金额" prop="amount" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:500">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status_tag" :type="Number(row.status) === 1 ? 'success' : Number(row.status) === 2 ? 'danger' : 'info'" size="small">
              {{ row.status_tag }}
            </el-tag>
            <el-tag v-else :type="Number(row.status) === 1 ? 'success' : Number(row.status) === 2 ? 'danger' : 'info'" size="small">
              {{ Number(row.status) === 1 ? '已审核' : Number(row.status) === 2 ? '已驳回' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="Number(row.status) === 0">
              <el-button type="primary" link size="small" @click="handleAudit(row, 1)">审核</el-button>
              <el-button type="danger" link size="small" @click="handleAudit(row, 2)">驳回</el-button>
            </template>
            <el-button v-if="Number(row.status) === 1" type="warning" link size="small" @click="handleAudit(row, 0)">反审核</el-button>
            <el-button type="danger" link size="small"
              @click="Number(row.status) === 1 ? ElMessage.warning('请先执行【反审核】，再删除') : handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getRetailReturnList, deleteRetailReturn, auditRetailReturn } from '@/api/retail'
import { adjustFundBalance } from '@/utils/fund'
import { RETAIL_FUND_NAME } from '@/config'
import http from '@/api/http'
import { useStockRefreshStore } from '@/stores/stockRefresh'

const scTable = ref()
const stockRefreshStore = useStockRefreshStore()
const searchForm = reactive<any>({ return_no: '', status: '' })

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? '审核通过' : status === 2 ? '驳回' : '反审核'
  await ElMessageBox.confirm(`确定${action}该退货单？`, '提示', { type: 'warning' })
  try {
    await auditRetailReturn(row.id, status)
    // 审核通过时：恢复库存 + 回退资金
    if (status === 1) {
      const amount = Number(row.amount || 0)
      // 回退资金账户
      if (amount > 0) {
        try {
          await adjustFundBalance({ fundName: RETAIL_FUND_NAME, delta: -amount })
        } catch { /* ignore */ }
      }
      // 恢复库存
      try {
        const items: any[] = JSON.parse(row.goods_info || '[]')
        if (items.length) {
          const whRes = await http.get('/stock/WarehouseName/index', { params: { list_rows: 1 } })
          const defaultWh = whRes.data?.rows?.[0]
          if (defaultWh) {
            for (const item of items) {
              if (!item.goods_id || !item.num) continue
              const stockRes = await http.get('/stock/StockAll/index', {
                params: { goods_id: item.goods_id, warehouse_id: defaultWh.id, list_rows: 10 }
              })
              const stock = stockRes.data?.rows?.[0]
              if (stock) {
                const newQty = Number(stock.qty || 0) + Number(item.num)
                await http.post('/stock/StockAll/edit', { id: stock.id, qty: newQty })
              }
            }
          }
        }
      } catch { /* 库存恢复失败不阻塞 */ }
    }
    ElMessage.success(`${action}成功`)
    stockRefreshStore.trigger()
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该退货单？', '提示', { type: 'warning' })
  try {
    await deleteRetailReturn(id)
    ElMessage.success('删除成功')
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '删除失败')
  }
}
</script>

<style scoped>
.page-container {}
</style>
