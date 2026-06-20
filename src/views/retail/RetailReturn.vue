<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/retail/return/batchDel"
          :export-file-name="$t('retail.retailReturn.exportFileName')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.return_no" :placeholder="$t('retail.retailReturn.returnNoPlaceholder')" clearable style="width:160px" />
          <el-select v-model="searchForm.status" :placeholder="$t('retail.retailReturn.statusPlaceholder')" clearable style="width:110px">
            <el-option :label="$t('retail.retailReturn.statusPending')" :value="0" />
            <el-option :label="$t('retail.retailReturn.statusAudited')" :value="1" />
            <el-option :label="$t('retail.retailReturn.statusRejected')" :value="2" />
            <el-option :label="$t('retail.retailReturn.statusUnreconciled')" value="unreconciled" />
          </el-select>
        </template>
        <el-table-column :label="$t('retail.retailReturn.returnNo')" prop="return_no" min-width="150" />
        <el-table-column :label="$t('retail.retailReturn.orderNo')" prop="order_no" min-width="150" />
        <el-table-column :label="$t('retail.retailReturn.storeName')" prop="store_name" min-width="140" />
        <el-table-column :label="$t('retail.retailReturn.amount')" prop="amount" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:500">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('retail.retailReturn.status')" width="90" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.status_tag" :type="Number(row.status) === 1 ? 'success' : Number(row.status) === 2 ? 'danger' : 'info'" size="small">
              {{ row.status_tag }}
            </el-tag>
            <el-tag v-else :type="Number(row.status) === 1 ? 'success' : Number(row.status) === 2 ? 'danger' : 'info'" size="small">
              {{ Number(row.status) === 1 ? $t('retail.retailReturn.statusAudited') : Number(row.status) === 2 ? $t('retail.retailReturn.statusRejected') : $t('retail.retailReturn.statusPending') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('retail.retailReturn.operation')" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="Number(row.status) === 0">
              <el-button type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('retail.retailReturn.audit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('retail.retailReturn.reconciled') : $t('retail.retailReturn.reconcile') }}</el-button>
              <el-button type="danger" link size="small" @click="handleAudit(row, 2)">{{ $t('retail.retailReturn.reject') }}</el-button>
            </template>
            <el-button v-if="Number(row.status) === 1" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('retail.retailReturn.unaudit') }}</el-button>
            <el-button type="danger" link size="small"
              @click="Number(row.status) === 1 ? ElMessage.warning($t('retail.retailReturn.deleteConfirmMsg')) : handleDelete(row.id)">{{ $t('retail.retailReturn.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import { getRetailReturnList, deleteRetailReturn, auditRetailReturn } from '@/api/retail'
import { adjustFundBalance } from '@/utils/fund'
import { RETAIL_FUND_NAME } from '@/config'
import http from '@/api/http'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect } from '@/utils/stockEffect'

const { t } = useI18n()
const scTable = ref()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_retail_return', scTable)
const reconcileFilteredApi = createFilteredApi(getRetailReturnList)
const stockRefreshStore = useStockRefreshStore()
const searchForm = reactive<any>({ return_no: '', status: '' })

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('retail.retailReturn.auditPass') : status === 2 ? t('retail.retailReturn.reject') : t('retail.retailReturn.unaudit')
  await ElMessageBox.confirm(t('retail.retailReturn.confirmAudit', { action }), t('retail.retailReturn.confirmTip'), { type: 'warning' })
  try {
    await auditRetailReturn(row.id, status)
    // 审核通过时：恢复库存 + 回退资金
    if (status === 1) {
      const amount = Number(row.amount || 0)
      if (amount > 0) {
        try { await adjustFundBalance({ fundName: RETAIL_FUND_NAME, delta: -amount }) } catch { /* ignore */ }
      }
      try {
        const items: any[] = JSON.parse(row.goods_info || '[]')
        if (items.length) await stockEffect(items, 'restore', undefined, '零售退货入库')
      } catch { /* ignore */ }
    }
    // 反审核：撤销库存恢复 + 撤销资金回退
    if (status === 0) {
      try {
        const items: any[] = JSON.parse(row.goods_info || '[]')
        if (items.length) await stockEffect(items, 'deduct', undefined, '零售退货反审核')
      } catch { /* ignore */ }
      const amount = Number(row.amount || 0)
      if (amount > 0) {
        try { await adjustFundBalance({ fundName: RETAIL_FUND_NAME, delta: amount }) } catch { /* ignore */ }
      }
    }
    ElMessage.success(t('retail.retailReturn.auditSuccess', { action }))
    stockRefreshStore.trigger()
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('retail.retailReturn.operationFailed'))
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('retail.retailReturn.confirmDelete'), t('retail.retailReturn.confirmTip'), { type: 'warning' })
  try {
    await deleteRetailReturn(id)
    ElMessage.success(t('retail.retailReturn.deleteSuccess'))
    scTable.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('retail.retailReturn.deleteFailed'))
  }
}
</script>

<style scoped>
.page-container {}
</style>
