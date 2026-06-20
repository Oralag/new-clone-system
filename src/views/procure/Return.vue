<template>
  <div class="return-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="reconcileFilteredApi"
          sort-by="return_date" :sort-desc="true"
          :export-file-name="$t('procure.return.exportFileName')" :params="searchForm"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''"
          :export-columns="{ return_no: $t('procure.return.exportColReturnNo'), order_sn: $t('procure.return.exportColOrderSn'), supplier_name: $t('procure.return.exportColSupplierName'), return_date: $t('procure.return.exportColReturnDate'), total_amount: $t('procure.return.exportColTotalAmount'), status: $t('procure.return.exportColStatus') }">
          <template #search>
            <el-input v-model="searchForm.return_no" :placeholder="$t('procure.return.searchReturnNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.supplier_name" :placeholder="$t('procure.return.searchSupplierName')" clearable style="width:150px" />
            <el-select v-model="searchForm.status" :placeholder="$t('procure.return.searchStatusPlaceholder')" clearable style="width:110px">
              <el-option :label="$t('procure.return.statusPending')" :value="0" />
              <el-option :label="$t('procure.return.statusAudited')" :value="1" />
              <el-option :label="$t('procure.return.statusRejected')" :value="2" />
              <el-option :label="$t('procure.return.statusUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('procure.return.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('procure.return.colExpandGoodsName')" min-width="140" />
                  <el-table-column prop="spec" :label="$t('procure.return.colExpandSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('procure.return.colExpandUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('procure.return.colExpandReturnNum')" width="90" align="right" />
                  <el-table-column :label="$t('procure.return.colExpandPriceWithTax')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('procure.return.colExpandReturnAmount')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#dc2626;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('procure.return.colIndex')" width="60" align="center" />
          <el-table-column prop="return_no" :label="$t('procure.return.colReturnNo')" min-width="150" />
          <el-table-column :label="$t('procure.return.colLinkedOrder')" min-width="150">
            <template #default="{ row }">
              <span style="color:#0071e3">{{ parseMeta(row.goods_info).order_sn || row.order_sn || '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.return.colSupplier')" min-width="120">
            <template #default="{ row }">{{ row.supplier_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.return.colReturnDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.return_date || row.create_time) }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.return.colReturnAmount')" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#dc2626;font-weight:500">¥{{ (() => { const m = parseMeta(row.goods_info); const total = Number(m.total_amount || row.total_amount || 0); const unpaid = Math.max(0, Number(m.order_total_amount||0) - Number(m.order_pay_amount||0)); return Math.max(0, total - unpaid).toFixed(2) })() }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.return.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('procure.return.tagAudited') : row.status === 2 ? $t('procure.return.tagRejected') : $t('procure.return.tagPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.return.colActions')" width="130" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row, true)">{{ $t('procure.return.actionView') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('procure.return.actionReconciled') : $t('procure.return.actionReconcile') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑全页面 ── -->
    <div v-else class="form-page">
      <div class="form-topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('procure.return.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('procure.return.formTitleView') : (fd.id ? $t('procure.return.formTitleEdit') : $t('procure.return.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('procure.return.tagAuditedForm') }}</el-tag>
        </div>
        <div class="form-actions">
        </div>
      </div>

      <div class="form-body">

        <!-- 关联采购订单 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('procure.return.sectionLinkedOrder') }}</div>
          <div v-if="fd.order_id" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <el-tag type="success" size="large">{{ fd.order_sn }}</el-tag>
            <span style="color:rgba(29,29,31,0.5);font-size:13px">{{ $t('procure.return.labelSupplierInfo') }}{{ fd.supplier_name }}</span>
            <span style="color:rgba(29,29,31,0.5);font-size:13px">{{ $t('procure.return.labelWarehouseInfo') }}{{ fd.warehouse_name }}</span>
            <span style="font-size:13px">
              {{ $t('procure.return.labelOrderTotal') }}<b style="color:#0071e3">¥{{ Number(fd.order_total_amount||0).toFixed(2) }}</b>
            </span>
            <span style="font-size:13px">
              {{ $t('procure.return.labelOrderPaid') }}<b style="color:#16a34a">¥{{ Number(fd.order_pay_amount||0).toFixed(2) }}</b>
            </span>
            <span v-if="fd.order_total_amount - fd.order_pay_amount > 0" style="font-size:13px">
              {{ $t('procure.return.labelOrderUnpaid') }}<b style="color:#dc2626">¥{{ (Number(fd.order_total_amount||0) - Number(fd.order_pay_amount||0)).toFixed(2) }}</b>
            </span>
            <el-button v-if="!isReadonly" size="small" @click="openOrderPicker">{{ $t('procure.return.btnReselect') }}</el-button>
          </div>
          <el-button v-else-if="!isReadonly" type="primary" @click="openOrderPicker">{{ $t('procure.return.btnSelectOrder') }}</el-button>
          <div v-else style="color:rgba(29,29,31,0.35)">{{ $t('procure.return.emptyOrder') }}</div>
        </div>

        <!-- 退货商品 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('procure.return.sectionGoods') }}</div>
          <div v-if="!fd.order_id && !isReadonly" style="color:rgba(29,29,31,0.35);padding:20px 0;text-align:center">
            {{ $t('procure.return.hintSelectOrderFirst') }}
          </div>
          <template v-else>
            <div v-if="!isReadonly" style="margin-bottom:10px;font-size:13px;color:rgba(29,29,31,0.5)">
              {{ $t('procure.return.hintSelectAndFill') }}
            </div>
            <el-table :data="fd.items" border size="small" style="width:100%">
              <el-table-column v-if="!isReadonly" type="selection" width="45" @selection-change="onItemSelect" />
              <el-table-column type="index" width="45" align="center" />
              <el-table-column :label="$t('procure.return.colGoodsName')" min-width="150">
                <template #default="{ row }">{{ row.goods_name }}</template>
              </el-table-column>
              <el-table-column :label="$t('procure.return.colSpec')" width="100">
                <template #default="{ row }">{{ row.spec || '—' }}</template>
              </el-table-column>
              <el-table-column :label="$t('procure.return.colUnit')" width="65" align="center">
                <template #default="{ row }">{{ row.unit_name }}</template>
              </el-table-column>
              <el-table-column :label="$t('procure.return.colPurchaseNum')" width="90" align="right">
                <template #default="{ row }">{{ row.origin_num }}</template>
              </el-table-column>
              <el-table-column :label="$t('procure.return.colReturnNum')" width="130">
                <template #default="{ row }">
                  <el-input-number v-if="!isReadonly" v-model="row.num" :min="0" :max="row.origin_num"
                    :precision="2" size="small" controls-position="right" style="width:100%"
                    @change="calcTotal" />
                  <span v-else>{{ row.num }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.return.colPriceWithTax')" width="100" align="right">
                <template #default="{ row }">¥{{ Number(row.price || 0).toFixed(2) }}</template>
              </el-table-column>
              <el-table-column :label="$t('procure.return.colReturnAmountCol')" width="110" align="right">
                <template #default="{ row }">
                  <span style="color:#dc2626;font-weight:500">¥{{ ((row.num||0)*(row.price||0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </template>
        </div>

        <!-- 结算信息 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('procure.return.sectionSettle') }}</div>
          <div class="settle-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.return.settleReturnTotal') }}</span>
              <span class="settle-value" style="color:#dc2626">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item" v-if="fd.order_id">
              <span class="settle-label">{{ $t('procure.return.settleOrderTotal') }}</span>
              <span class="settle-value">¥{{ Number(fd.order_total_amount||0).toFixed(2) }}</span>
            </div>
            <div class="settle-item" v-if="fd.order_id">
              <span class="settle-label">{{ $t('procure.return.settleOrderPaid') }}</span>
              <span class="settle-value" style="color:#16a34a">¥{{ Number(fd.order_pay_amount||0).toFixed(2) }}</span>
            </div>
            <div class="settle-item" v-if="fd.order_id">
              <span class="settle-label">{{ $t('procure.return.settleOrderUnpaid') }}</span>
              <span class="settle-value" style="color:#d97706">¥{{ Math.max(0, Number(fd.order_total_amount||0) - Number(fd.order_pay_amount||0)).toFixed(2) }}</span>
            </div>
            <div class="settle-item" v-if="fd.order_id && fd.total_amount > 0">
              <span class="settle-label">{{ $t('procure.return.settleDeductPayable') }}</span>
              <span class="settle-value" style="color:#7c3aed">¥{{ Math.min(fd.total_amount, Math.max(0, Number(fd.order_total_amount||0) - Number(fd.order_pay_amount||0))).toFixed(2) }}</span>
            </div>
            <div class="settle-item" v-if="fd.order_id && fd.total_amount > 0">
              <span class="settle-label">{{ $t('procure.return.settleRefundAccount') }}</span>
              <span class="settle-value" style="color:#0071e3">¥{{ Math.max(0, fd.total_amount - Math.max(0, Number(fd.order_total_amount||0) - Number(fd.order_pay_amount||0))).toFixed(2) }}</span>
            </div>
          </div>
          <div style="margin-top:10px;color:rgba(29,29,31,0.45);font-size:12px">
            {{ $t('procure.return.settleHint') }}
          </div>
        </div>

        <!-- 备注 -->
        <div class="form-section">
          <el-form :model="fd" label-width="60px" :disabled="isReadonly">
            <el-form-item :label="$t('procure.return.labelRemark')">
              <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('procure.return.remarkPlaceholder')" />
            </el-form-item>
          </el-form>
        </div>

      </div>
    </div>

    <!-- 选择采购订单弹框 -->
    <el-dialog v-model="orderPickerVisible" :title="$t('procure.return.dialogOrderPickerTitle')" width="780px" append-to-body>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <el-input v-model="orderPickerKeyword" :placeholder="$t('procure.return.orderPickerSearchPlaceholder')" clearable style="width:260px"
          @input="filterOrders" />
      </div>
      <el-table :data="filteredOrders" v-loading="orderPickerLoading" border height="380"
        highlight-current-row @current-change="onOrderSelect">
        <el-table-column prop="order_sn" :label="$t('procure.return.colOrderNo')" min-width="160" />
        <el-table-column prop="supplier_name" :label="$t('procure.return.colOrderSupplier')" min-width="120" />
        <el-table-column prop="warehouse_name" :label="$t('procure.return.colOrderWarehouse')" width="110" />
        <el-table-column :label="$t('procure.return.colOrderAmount')" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column :label="$t('procure.return.colOrderDate')" width="110">
          <template #default="{ row }">{{ fmtDt(row.order_date) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="orderPickerVisible = false">{{ $t('procure.return.btnCancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedOrder" @click="confirmOrderSelect">{{ $t('procure.return.btnConfirmSelect') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import http from '@/api/http'
import { getProcureReturnList, createProcureReturn, deleteProcureReturn, auditProcureReturn, getProcureOrderList, updateProcureOrder } from '@/api/procure'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { adjustFundBalance } from '@/utils/fund'
import { useRoute } from 'vue-router'
import { fmtDt } from '@/utils/date'
import { stockEffect } from '@/utils/stockEffect'

const { t } = useI18n()
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const route = useRoute()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_procure_return', tableRef)
const reconcileFilteredApi = createFilteredApi(getProcureReturnList)

onMounted(() => {
  if (route.query.return_no) searchForm.return_no = String(route.query.return_no)
  if (route.query.supplier_name) searchForm.supplier_name = String(route.query.supplier_name)
})

function roundMoney(value: any) {
  return Math.round((Number(value || 0) + Number.EPSILON) * 100) / 100
}

function hasValue(value: any) {
  return value !== undefined && value !== null && value !== ''
}

function normalizeDateValue(value: any): string {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw || raw === 'null' || raw === 'undefined' || raw === '0000-00-00') return ''
  return raw.slice(0, 10)
}

function parseItems(goodsInfo: any): any[] {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return (JSON.parse(goodsInfo || '[]') as any[]).filter((i: any) => !i._meta) } catch { return [] }
}

function parseMeta(goodsInfo: any): any {
  try { return (JSON.parse(goodsInfo || '[]') as any[]).find((i: any) => i._meta) ?? {} } catch { return {} }
}

function calcItemsAmount(items: any[]) {
  return roundMoney((items || []).reduce((sum, item) => sum + Number(item.num || 0) * Number(item.price || 0), 0))
}

async function getProcureOrderRow(orderId: number, orderSn = '') {
  const requestList = [
    orderId ? { id: orderId, list_rows: 20 } : null,
    orderSn ? { order_no: orderSn, list_rows: 20 } : null,
    orderSn ? { order_sn: orderSn, list_rows: 20 } : null,
  ].filter(Boolean)

  for (const params of requestList) {
    try {
      const res = await getProcureOrderList(params)
      const rows: any[] = res.data?.rows ?? []
      const matched = rows.find((item: any) => Number(item.id) === Number(orderId))
        || rows.find((item: any) => (item.order_sn || item.order_no) === orderSn)
        || rows[0]
      if (matched) return matched
    } catch {
      // ignore and fallback
    }
  }

  return null
}

function buildProcureOrderPayload(order: any, overrides: Record<string, any>) {
  const orderDate = normalizeDateValue(order.order_date || order.created_at || order.create_time)
  const deliveryDate = normalizeDateValue(order.delivery_date)
  return {
    id: order.id,
    order_no: order.order_no || order.order_sn || '',
    order_sn: order.order_sn || order.order_no || '',
    supplier_id: order.supplier_id,
    supplier_name: order.supplier_name || '',
    admin_name: order.admin_name || '',
    order_date: orderDate,
    warehouse_id: order.warehouse_id || null,
    warehouse_name: order.warehouse_name || '',
    need_invoice: Number(order.need_invoice || 0),
    fund_id: order.fund_id || 0,
    fund_name: order.fund_name || '',
    pay_account: order.pay_account || '',
    pay_amount: roundMoney(order.pay_amount),
    remark: order.remark || '',
    total_amount: roundMoney(order.total_amount),
    freight_amount: roundMoney(order.freight_amount),
    freight_bearer: order.freight_bearer || 'buyer',
    discount_type: order.discount_type || 'none',
    discount_value: Number(order.discount_value || 0),
    after_discount: hasValue(order.after_discount) ? roundMoney(order.after_discount) : roundMoney(order.total_amount),
    expense_amount: roundMoney(order.expense_amount),
    installment: Number(order.installment || 0),
    attachments_info: typeof order.attachments_info === 'string'
      ? order.attachments_info
      : JSON.stringify(order.attachments_info || []),
    goods_info: typeof order.goods_info === 'string'
      ? order.goods_info
      : JSON.stringify(order.goods_info || []),
    ...(deliveryDate ? { delivery_date: deliveryDate } : {}),
    ...overrides,
  }
}

async function applyStockDelta(items: any[], warehouseId: number, direction: 'audit' | 'reverse') {
  // 采购退货审核=扣库存；反审核=加回库存
  await stockEffect(items, direction === 'audit' ? 'deduct' : 'restore', warehouseId, direction === 'audit' ? 'Purchase Return Out' : 'Purchase Return Reverse')
  return { items, warehouseId, direction }
}

async function rollbackStockDelta(snapshot: { items: any[], warehouseId: number, direction: 'audit' | 'reverse' }) {
  const reverseMode = snapshot.direction === 'audit' ? 'restore' : 'deduct'
  await stockEffect(snapshot.items, reverseMode, snapshot.warehouseId, 'Purchase Return Rollback').catch(() => {})
}

async function applyProcureReturnEffect(row: any, direction: 'audit' | 'reverse') {
  const items = parseItems(row.goods_info)
  const meta = parseMeta(row.goods_info)
  const warehouseId = Number(meta.warehouse_id || row.warehouse_id || 0)
  const orderId = Number(meta.order_id || row.order_id || 0)
  const orderSn = meta.order_sn || row.order_sn || row.order_no || ''
  const returnAmount = calcItemsAmount(items)

  if (!warehouseId) throw new Error(t('procure.return.errNoWarehouse'))
  if (!orderId) throw new Error(t('procure.return.errNoOrder'))

  const stockSnapshots = await applyStockDelta(items, warehouseId, direction)

  let orderRollbackPayload: Record<string, any> | null = null
  try {
    const liveOrder = await getProcureOrderRow(orderId, orderSn)
    if (!liveOrder) throw new Error(t('procure.return.errNoOrderFound'))

    const currentOrderTotal = hasValue(liveOrder.after_discount)
      ? roundMoney(liveOrder.after_discount)
      : roundMoney(liveOrder.total_amount)
    const currentRawTotal = roundMoney(liveOrder.total_amount)
    const currentAfterDiscount = hasValue(liveOrder.after_discount)
      ? roundMoney(liveOrder.after_discount)
      : currentOrderTotal
    const currentPayAmount = roundMoney(liveOrder.pay_amount)

    const unpaidAmount = Math.max(0, roundMoney(currentOrderTotal - currentPayAmount))
    const refundAmount = Math.max(0, roundMoney(returnAmount - unpaidAmount))
    const signedAmount = direction === 'audit' ? -returnAmount : returnAmount
    const nextRawTotal = Math.max(0, roundMoney(currentRawTotal + signedAmount))
    const nextAfterDiscount = Math.max(0, roundMoney(currentAfterDiscount + signedAmount))
    const nextPayAmount = direction === 'audit'
      ? Math.max(0, roundMoney(currentPayAmount - refundAmount))
      : roundMoney(currentPayAmount + refundAmount)

    orderRollbackPayload = buildProcureOrderPayload(liveOrder, {
      total_amount: currentRawTotal,
      after_discount: currentAfterDiscount,
      pay_amount: currentPayAmount,
    })

    if (returnAmount > 0) {
      await updateProcureOrder(buildProcureOrderPayload(liveOrder, {
        total_amount: nextRawTotal,
        after_discount: nextAfterDiscount,
        pay_amount: nextPayAmount,
      }))
    }

    if (refundAmount > 0) {
      await adjustFundBalance({
        fundId: Number(meta.fund_id || liveOrder.fund_id || 0) || null,
        fundName: liveOrder.fund_name || '',
        delta: direction === 'audit' ? refundAmount : -refundAmount,
      })
    }
  } catch (error) {
    try {
      if (orderRollbackPayload) {
        await updateProcureOrder(orderRollbackPayload)
      }
      await rollbackStockDelta(stockSnapshots)
    } catch (rollbackError) {
      console.warn('采购退货回滚失败', rollbackError)
    }
    throw error
  }
}

const searchForm = reactive<any>({ return_no: '', supplier_name: '', status: '' })
const showForm = ref(false)
const isReadonly = ref(false)

// ── 表单数据 ──────────────────────────────────────────────────────────────────
const defaultFd = () => ({
  id: 0,
  return_no: '',
  order_id: 0,
  order_sn: '',
  order_total_amount: 0,
  order_pay_amount: 0,
  supplier_id: null as any,
  supplier_name: '',
  warehouse_id: null as any,
  warehouse_name: '',
  fund_id: null as any,
  remark: '',
  total_amount: 0,
  items: [] as any[],
})

const fd = reactive(defaultFd())
const saving = ref(false)

function calcTotal() {
  fd.total_amount = fd.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
}

function onItemSelect(rows: any[]) {
  // 未勾选的行退货数量清零
  fd.items.forEach(item => {
    if (!rows.find(r => r.goods_id === item.goods_id && r.goods_name === item.goods_name)) {
      item.num = 0
    }
  })
  calcTotal()
}

function openCreate() {
  Object.assign(fd, defaultFd())
  isReadonly.value = false
  showForm.value = true
}

function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  const meta = parseMeta(row.goods_info)
  fd.items = parseItems(row.goods_info)
  fd.order_id = meta.order_id || row.order_id || 0
  fd.order_sn = meta.order_sn || row.order_sn || row.order_no || ''
  fd.warehouse_id = meta.warehouse_id || row.warehouse_id || null
  fd.warehouse_name = meta.warehouse_name || row.warehouse_name || ''
  fd.fund_id = meta.fund_id || row.fund_id || null
  fd.total_amount = meta.total_amount || row.total_amount || 0
  fd.order_total_amount = meta.order_total_amount || row.order_total_amount || 0
  fd.order_pay_amount = meta.order_pay_amount || row.order_pay_amount || 0
  // 还原 origin_num
  fd.items.forEach((item: any) => {
    if (!item.origin_num) item.origin_num = item.num
  })
  calcTotal()
  isReadonly.value = readonly
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

async function handleSave() {
  if (!fd.order_id) { ElMessage.warning(t('procure.return.msgSelectOrder')); return }
  const returnItems = fd.items.filter(i => (i.num || 0) > 0)
  if (!returnItems.length) { ElMessage.warning(t('procure.return.msgSelectGoods')); return }
  saving.value = true
  try {
    // 注意：procure_return 表目前只有基础列，扩展字段存入 goods_info 的 _meta 节点
    const goodsInfoWithMeta = [
      ...returnItems,
      {
        _meta: true,
        order_id: fd.order_id,
        order_sn: fd.order_sn,
        warehouse_id: fd.warehouse_id,
        warehouse_name: fd.warehouse_name,
        fund_id: fd.fund_id,
        total_amount: fd.total_amount,
        order_total_amount: fd.order_total_amount,
        order_pay_amount: fd.order_pay_amount,
      }
    ]
    const payload: Record<string, any> = {
      supplier_id: fd.supplier_id,
      supplier_name: fd.supplier_name,
      remark: fd.remark,
      goods_info: JSON.stringify(goodsInfoWithMeta),
    }
    if (fd.id) payload.id = fd.id
    await createProcureReturn(payload)
    ElMessage.success(t('procure.return.msgSaveSuccess'))
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.return.msgSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('procure.return.msgDeleteConfirm'), t('procure.return.msgPrompt'), { type: 'warning' })
  await deleteProcureReturn(id)
  ElMessage.success(t('procure.return.msgDeleteSuccess'))
  tableRef.value?.refresh()
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('procure.return.actionAuditPass') : status === 2 ? t('procure.return.actionReject') : t('procure.return.actionReverseAudit')
  const hint = status === 1 ? t('procure.return.msgAuditPassHint') : status === 0 ? t('procure.return.msgReverseHint') : ''
  await ElMessageBox.confirm(`${t('procure.return.msgAuditPrefix')}${action}${t('procure.return.msgAuditSuffix')}${hint}`, t('procure.return.msgPrompt'), { type: 'warning' })
  try {
    await auditProcureReturn(row.id, status)
    if (status === 1) await applyProcureReturnEffect(row, 'audit')
    if (status === 0) await applyProcureReturnEffect(row, 'reverse')
    ElMessage.success(t('procure.return.msgActionSuccess', { action }))
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.return.msgOperationFailed'))
  }
}

// ── 选择采购订单 ──────────────────────────────────────────────────────────────
const orderPickerVisible = ref(false)
const orderPickerLoading = ref(false)
const orderList = ref<any[]>([])
const orderPickerKeyword = ref('')
const selectedOrder = ref<any>(null)

const filteredOrders = computed(() => {
  if (!orderPickerKeyword.value) return orderList.value
  const kw = orderPickerKeyword.value
  return orderList.value.filter(o =>
    o.order_sn?.includes(kw) || o.supplier_name?.includes(kw)
  )
})

function filterOrders() { /* computed 自动更新 */ }

function onOrderSelect(row: any) {
  selectedOrder.value = row
}

async function openOrderPicker() {
  orderPickerKeyword.value = ''
  selectedOrder.value = null
  orderPickerVisible.value = true
  orderPickerLoading.value = true
  try {
    const res = await getProcureOrderList({ status: 1, list_rows: 200 })
    orderList.value = res.data?.rows ?? []
  } catch {
    orderList.value = []
  } finally {
    orderPickerLoading.value = false
  }
}

function confirmOrderSelect() {
  if (!selectedOrder.value) return
  const order = selectedOrder.value
  fd.order_id = order.id
  fd.order_sn = order.order_sn
  fd.order_total_amount = Number(order.after_discount ?? order.total_amount ?? 0)
  fd.order_pay_amount = Number(order.pay_amount || 0)
  fd.supplier_id = order.supplier_id
  fd.supplier_name = order.supplier_name
  fd.warehouse_id = order.warehouse_id
  fd.warehouse_name = order.warehouse_name
  fd.fund_id = order.fund_id

  // 从采购订单商品明细生成退货行（num默认0，origin_num=采购数量）
  const items = parseItems(order.goods_info)
  fd.items = items.map((i: any) => ({
    goods_id: i.goods_id || 0,
    goods_name: i.goods_name || '',
    goods_sn: i.goods_sn || '',
    spec: i.spec || '',
    unit_name: i.unit_name || '',
    origin_num: i.num || 0,  // 原始采购数量，作为退货上限
    num: 0,
    price: i.price || 0,
    remark: '',
  }))
  calcTotal()
  orderPickerVisible.value = false
}
</script>

<style scoped>
.return-page { height: 100%; }

.expand-detail {
  padding: 12px 20px 12px 48px;
  background: #f8faff;
}
.expand-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(29,29,31,0.5);
  margin-bottom: 8px;
}
.expand-table {
  border-radius: 8px;
  overflow: hidden;
}

.form-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  background: #f5f6fa;
}

.form-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 52px;
  flex-shrink: 0;
}

.form-title { font-size: 15px; font-weight: 600; color: #1d1d1f; }
.form-actions { display: flex; gap: 8px; }

.form-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 16px 18px 14px;
}

.sec-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f7;
  display: block;
}

.settle-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
  padding: 4px 0 6px;
}
.settle-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.settle-label {
  font-size: 12px;
  color: rgba(29,29,31,0.45);
}
.settle-value {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}
</style>
