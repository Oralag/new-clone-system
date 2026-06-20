<template>
  <div class="sample-page">
    <div v-if="!showForm">
      <div class="sample-summary">
        <div class="sum-item">
          <span>{{ $t('sale.sample.summarySamples') }}</span>
          <b>{{ summary.count }}</b>
        </div>
        <div class="sum-item">
          <span>{{ $t('sale.sample.summaryPending') }}</span>
          <b>{{ summary.pending }}</b>
        </div>
        <div class="sum-item">
          <span>{{ $t('sale.sample.summarySampleCost') }}</span>
          <b class="orange">¥{{ fmt(summary.companyCost) }}</b>
        </div>
        <div class="sum-item">
          <span>{{ $t('sale.sample.summaryReceivable') }}</span>
          <b class="blue">¥{{ fmt(summary.receivable) }}</b>
        </div>
      </div>

      <el-card>
        <ScTable
          ref="tableRef"
          :api-obj="reconcileFilteredApi"
          :export-file-name="$t('sale.sample.exportFileName')"
          sort-by="id"
          :sort-desc="true"
          :params="searchForm"
          @selection-change="() => {}"
        >
          <template #search>
            <el-input v-model="searchForm.keyword" :placeholder="$t('sale.sample.searchKeyword')" clearable style="width:210px" />
            <el-input v-model="searchForm.customer_name" :placeholder="$t('sale.sample.searchCustomerName')" clearable style="width:150px" />
            <el-select v-model="searchForm.sample_type" :placeholder="$t('sale.sample.sampleType')" clearable style="width:120px">
              <el-option :label="$t('sale.sample.typeFree')" value="free" />
              <el-option :label="$t('sale.sample.typePaid')" value="paid" />
              <el-option :label="$t('sale.sample.typeBorrow')" value="borrow" />
            </el-select>
            <el-select v-model="searchForm.status" :placeholder="$t('sale.sample.status')" clearable style="width:110px">
              <el-option :label="$t('sale.sample.statusPending')" :value="0" />
              <el-option :label="$t('sale.sample.statusApproved')" :value="1" />
              <el-option :label="$t('sale.sample.statusRejected')" :value="2" />
              <el-option :label="$t('sale.sample.statusUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('sale.sample.createSample') }}</el-button>
          </template>

          <el-table-column type="expand">
            <template #default="{ row }">
              <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                <el-table-column type="index" width="48" />
                <el-table-column prop="goods_name" :label="$t('sale.sample.goodsName')" min-width="150" />
                <el-table-column prop="goods_sn" :label="$t('sale.sample.goodsSn')" width="120" />
                <el-table-column prop="spec" :label="$t('sale.sample.spec')" width="120" />
                <el-table-column prop="unit_name" :label="$t('sale.sample.unit')" width="70" align="center" />
                <el-table-column prop="num" :label="$t('sale.sample.qty')" width="90" align="right" />
                <el-table-column :label="$t('sale.sample.costUnitPrice')" width="110" align="right">
                  <template #default="{ row: item }">¥{{ fmt(item.cost_price || item.out_price) }}</template>
                </el-table-column>
                <el-table-column prop="remark" :label="$t('sale.sample.remark')" min-width="120" />
              </el-table>
            </template>
          </el-table-column>
          <el-table-column prop="sample_no" :label="$t('sale.sample.sampleNo')" min-width="150" />
          <el-table-column :label="$t('sale.sample.colType')" width="90">
            <template #default="{ row }">
              <el-tag :type="sampleTypeMeta(row.sample_type).type" size="small">{{ sampleTypeMeta(row.sample_type).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="customer_name" :label="$t('sale.sample.customer')" min-width="150">
            <template #default="{ row }">{{ row.customer_name || row.contact_name || '—' }}</template>
          </el-table-column>
          <el-table-column prop="sample_date" :label="$t('sale.sample.sampleDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.sample_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="warehouse_name" :label="$t('sale.sample.warehouse')" width="120" />
          <el-table-column :label="$t('sale.sample.freight')" width="135" align="right">
            <template #default="{ row }">
              ¥{{ fmt(row.freight_amount) }} / {{ freightLabel(row.freight_bearer) }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.sample.receivable')" width="100" align="right">
            <template #default="{ row }"><span class="blue">¥{{ fmt(row.receivable_amount) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('sale.sample.companyCost')" width="110" align="right">
            <template #default="{ row }"><span class="orange">¥{{ fmt(row.company_cost) }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('sale.sample.expenseStatus')" width="100">
            <template #default="{ row }">{{ row.expense_payment_status === 'paid' ? $t('sale.sample.expensePaid') : $t('sale.sample.expensePending') }}</template>
          </el-table-column>
          <el-table-column prop="tracking_no" :label="$t('sale.sample.trackingNo')" min-width="140" show-overflow-tooltip />
          <el-table-column :label="$t('sale.sample.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="statusMeta(row.status).type" size="small">{{ statusMeta(row.status).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.sample.operation')" width="260" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openView(row)">{{ $t('sale.sample.view') }}</el-button>
              <el-button v-if="row.status !== 1" type="success" link size="small" @click="openEdit(row)">{{ $t('sale.sample.edit') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('sale.sample.approve') }}</el-button>
              <el-button v-if="row.status === 0" type="danger" link size="small" @click="handleAudit(row, 2)">{{ $t('sale.sample.reject') }}</el-button>
              <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('sale.sample.unapprove') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('sale.sample.reconciled') : $t('sale.sample.reconcile') }}</el-button>
              <el-button type="danger" link size="small" :disabled="row.status === 1" @click="handleDelete(row)">{{ $t('sale.sample.delete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-title-wrap">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('sale.sample.back') }}</el-button>
          <span class="form-title">{{ isView ? $t('sale.sample.viewSample') : fd.id ? $t('sale.sample.editSample') : $t('sale.sample.newSample') }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">{{ $t('sale.sample.approved') }}</el-tag>
        </div>
        <div v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('sale.sample.save') }}</el-button>
        </div>
      </div>

      <div class="form-body">
        <div class="form-section">
          <div class="sec-title">{{ $t('sale.sample.basicInfo') }}</div>
          <el-form label-width="84px" :disabled="isView">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.sampleNo')">
                  <el-input v-model="fd.sample_no" :placeholder="$t('sale.sample.sampleNoPlaceholder')" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.sampleType')">
                  <el-select v-model="fd.sample_type" style="width:100%" @change="calcTotals">
                    <el-option :label="$t('sale.sample.typeFreeSample')" value="free" />
                    <el-option :label="$t('sale.sample.typePaidSample')" value="paid" />
                    <el-option :label="$t('sale.sample.typeBorrowSample')" value="borrow" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.customer')">
                  <el-select v-model="fd.customer_id" filterable clearable style="width:100%" @change="onCustomerChange">
                    <el-option :label="$t('sale.sample.internalUse')" :value="INTERNAL_CUSTOMER_VALUE" />
                    <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.searchCustomerName')">
                  <el-input v-model="fd.customer_name" :placeholder="$t('sale.sample.customerNamePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.staff')">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('sale.sample.staffPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.sampleDate')">
                  <el-date-picker v-model="fd.sample_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.expectedReturn')">
                  <el-date-picker v-model="fd.return_date" type="date" value-format="YYYY-MM-DD" style="width:100%" :disabled="fd.sample_type !== 'borrow'" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.sample.warehouse')">
                  <el-select v-model="fd.warehouse_id" filterable style="width:100%" @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <div class="form-section">
          <div class="sec-title">{{ $t('sale.sample.sampleDetail') }}</div>
          <div v-if="!isView" class="goods-toolbar">
            <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('sale.sample.selectGoods') }}</el-button>
            <el-button size="small" :icon="Plus" @click="addEmptyRow">{{ $t('sale.sample.addManualRow') }}</el-button>
            <span>{{ $t('sale.sample.rowCount', { count: fd.items.length }) }}</span>
          </div>
          <el-table :data="fd.items" border size="small" :empty-text="$t('sale.sample.emptyGoods')">
            <el-table-column type="index" width="45" />
            <el-table-column :label="$t('sale.sample.goodsName')" min-width="150">
              <template #default="{ row }"><el-input v-model="row.goods_name" size="small" :disabled="isView" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.goodsSn')" width="120">
              <template #default="{ row }"><el-input v-model="row.goods_sn" size="small" :disabled="isView" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.spec')" width="120">
              <template #default="{ row }"><el-input v-model="row.spec" size="small" :disabled="isView" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.unit')" width="80">
              <template #default="{ row }"><el-input v-model="row.unit_name" size="small" :disabled="isView" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.qty')" width="120" align="right">
              <template #default="{ row }">
                <el-input-number v-model="row.num" :min="0" :precision="2" size="small" controls-position="right" style="width:100%" :disabled="isView" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.costUnitPrice')" width="130" align="right">
              <template #default="{ row }">
                <el-input-number v-model="row.cost_price" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isView" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.chargeUnitPrice')" width="130" align="right">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isView || fd.sample_type !== 'paid'" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.sample.remark')" min-width="120">
              <template #default="{ row }"><el-input v-model="row.remark" size="small" :disabled="isView" /></template>
            </el-table-column>
            <el-table-column v-if="!isView" width="50">
              <template #default="{ $index }">
                <el-button type="danger" link :icon="Delete" @click="removeRow($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <div class="form-section">
          <div class="sec-title">{{ $t('sale.sample.logisticsSettle') }}</div>
          <div class="settle-grid">
            <div class="settle-item">
              <span>{{ $t('sale.sample.sampleCharge') }}</span>
              <b>¥{{ fmt(chargeAmount) }}</b>
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.sampleCostLabel') }}</span>
              <b>¥{{ fmt(goodsCost) }}</b>
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.freightLabel') }}</span>
              <el-input-number v-model="fd.freight_amount" :min="0" :precision="2" size="small" :disabled="isView" @change="calcTotals" />
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.freightBearer') }}</span>
              <el-select v-model="fd.freight_bearer" size="small" :disabled="isView" @change="calcTotals">
                <el-option :label="$t('sale.sample.bearerCompany')" value="seller" />
                <el-option :label="$t('sale.sample.bearerCustomer')" value="buyer" />
                <el-option :label="$t('sale.sample.bearerHalf')" value="half" />
                <el-option :label="$t('sale.sample.bearerFree')" value="free" />
              </el-select>
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.customerReceivable') }}</span>
              <b class="blue">¥{{ fmt(fd.receivable_amount) }}</b>
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.paidAmount') }}</span>
              <el-input-number v-model="fd.paid_amount" :min="0" :max="fd.receivable_amount" :precision="2" size="small" :disabled="isView" />
            </div>
            <div class="settle-item" v-if="fd.paid_amount > 0">
              <span>{{ $t('sale.sample.receiptFund') }}</span>
              <el-select v-model="fd.receipt_fund_id" size="small" filterable :disabled="isView" @change="onReceiptFundChange">
                <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
              </el-select>
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.companyCostLabel') }}</span>
              <b class="orange">¥{{ fmt(fd.company_cost) }}</b>
            </div>
            <div class="settle-item" v-if="fd.company_cost > 0">
              <span>{{ $t('sale.sample.expenseStatusLabel') }}</span>
              <el-select v-model="fd.expense_payment_status" size="small" :disabled="isView">
                <el-option :label="$t('sale.sample.expensePending')" value="pending" />
                <el-option :label="$t('sale.sample.expensePaid')" value="paid" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.company_cost > 0 && fd.expense_payment_status === 'paid'">
              <span>{{ $t('sale.sample.expenseFund') }}</span>
              <el-select v-model="fd.expense_fund_id" size="small" filterable :disabled="isView" @change="onExpenseFundChange">
                <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
              </el-select>
            </div>
            <div class="settle-item">
              <span>{{ $t('sale.sample.courier') }}</span>
              <el-input v-model="fd.courier" size="small" :disabled="isView" />
            </div>
            <div class="settle-item wide">
              <span>{{ $t('sale.sample.trackingNoLabel') }}</span>
              <el-input v-model="fd.tracking_no" size="small" :disabled="isView" />
            </div>
          </div>
          <div class="remark-row">
            <span>{{ $t('sale.sample.remarkLabel') }}</span>
            <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" />
          </div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { ArrowLeft, Delete, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import StaffSelect from '@/components/StaffSelect.vue'
import { getWarehouseList } from '@/api/warehouse'
import { auditSample, createSample, deleteSample, getSampleList, updateSample, getSaleCustomerList } from '@/api/sale'
import { getBomByGoods, getBomList } from '@/api/goods'
import { getFundList } from '@/api/finance'
import { fmtDt } from '@/utils/date'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { getSyncedDefaultWarehouseId } from '@/utils/defaultWarehouse'

const { t } = useI18n()

const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_sale_sample', tableRef)
const reconcileFilteredApi = createFilteredApi(getSampleList)
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
const stockRefreshStore = useStockRefreshStore()

const searchForm = reactive<any>({ keyword: '', customer_name: '', sample_type: '', status: '' })
const customerOptions = ref<any[]>([])
const warehouseOptions = ref<any[]>([])
const fundOptions = ref<any[]>([])
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)
const summary = reactive({ count: 0, pending: 0, receivable: 0, companyCost: 0 })
const bomListCache = ref<any[] | null>(null)
const bomCostCache = new Map<string, number>()
const INTERNAL_CUSTOMER_VALUE = '__internal__'

function defaultFd() {
  return {
    id: 0,
    sample_no: '',
    sample_type: 'free',
    customer_id: null as any,
    customer_name: '',
    contact_name: '',
    admin_name: '',
    sample_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
    return_date: '',
    warehouse_id: null as any,
    warehouse_name: '',
    items: [] as any[],
    sample_amount: 0,
    freight_amount: 0,
    freight_bearer: 'seller',
    courier: '',
    tracking_no: '',
    receivable_amount: 0,
    paid_amount: 0,
    company_cost: 0,
    receipt_fund_id: null as any,
    receipt_fund_name: '',
    expense_payment_status: 'pending',
    expense_fund_id: null as any,
    expense_fund_name: '',
    remark: '',
    status: 0,
  }
}

const fd = reactive(defaultFd())

function fmt(v: any) {
  return Number(v || 0).toFixed(2)
}

function parseItems(goodsInfo: any) {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

function sampleTypeMeta(type: string) {
  const map: Record<string, any> = {
    free: { label: t('sale.sample.typeFree'), type: 'success' },
    paid: { label: t('sale.sample.typePaid'), type: 'primary' },
    borrow: { label: t('sale.sample.typeBorrow'), type: 'warning' },
  }
  return map[type] || map.free
}

function statusMeta(status: number) {
  const map: Record<number, any> = {
    0: { label: t('sale.sample.statusPending'), type: 'info' },
    1: { label: t('sale.sample.statusApproved'), type: 'success' },
    2: { label: t('sale.sample.statusRejected'), type: 'danger' },
  }
  return map[Number(status)] || map[0]
}

function freightLabel(value: string) {
  const map: Record<string, string> = {
    seller: t('sale.sample.freightCompany'),
    buyer: t('sale.sample.freightCustomer'),
    half: t('sale.sample.bearerHalf'),
    free: t('sale.sample.bearerFree'),
  }
  return map[value] || t('sale.sample.freightCompany')
}

const goodsCost = computed(() =>
  fd.items.reduce((sum, item) => sum + Number(item.num || 0) * Number(item.cost_price || item.out_price || 0), 0)
)
const chargeAmount = computed(() =>
  fd.sample_type === 'paid'
    ? fd.items.reduce((sum, item) => sum + Number(item.num || 0) * Number(item.price || 0), 0)
    : 0
)

function calcTotals() {
  fd.sample_amount = Number(chargeAmount.value.toFixed(2))
  const freight = Number(fd.freight_amount || 0)
  const customerFreight = fd.freight_bearer === 'buyer' ? freight : fd.freight_bearer === 'half' ? freight / 2 : 0
  const companyFreight = fd.freight_bearer === 'seller' ? freight : fd.freight_bearer === 'half' ? freight / 2 : 0
  const companySampleCost = fd.sample_type === 'paid' ? 0 : goodsCost.value
  fd.receivable_amount = Number((fd.sample_amount + customerFreight).toFixed(2))
  fd.company_cost = Number((companySampleCost + companyFreight).toFixed(2))
  if (fd.paid_amount > fd.receivable_amount) fd.paid_amount = fd.receivable_amount
  if (fd.paid_amount <= 0) {
    fd.receipt_fund_id = null
    fd.receipt_fund_name = ''
  }
  if (fd.company_cost <= 0) {
    fd.expense_payment_status = 'pending'
    fd.expense_fund_id = null
    fd.expense_fund_name = ''
  }
}

async function loadBaseData() {
  const [customers, warehouses, funds] = await Promise.allSettled([
    getSaleCustomerList({ list_rows: 500 }),
    getWarehouseList({ list_rows: 200 }),
    getFundList({ list_rows: 200 }),
  ])
  customerOptions.value = customers.status === 'fulfilled' ? (customers.value.data?.rows ?? []) : []
  warehouseOptions.value = warehouses.status === 'fulfilled' ? (warehouses.value.data?.rows ?? []) : []
  fundOptions.value = funds.status === 'fulfilled' ? (funds.value.data?.rows ?? []) : []
  await applyDefaultWarehouse()
}

async function loadSummary() {
  try {
    const res = await getSampleList({ list_rows: 1000 })
    const rows = res.data?.rows ?? []
    summary.count = rows.length
    summary.pending = rows.filter((row: any) => Number(row.status) === 0).length
    summary.receivable = rows.reduce((sum: number, row: any) => sum + Number(row.receivable_amount || 0), 0)
    summary.companyCost = rows.reduce((sum: number, row: any) => sum + Number(row.company_cost || 0), 0)
  } catch {}
}

async function openCreate() {
  Object.assign(fd, defaultFd())
  fd.items = []
  await ensureWarehouseOptionsLoaded()
  await applyDefaultWarehouse()
  isView.value = false
  showForm.value = true
}

function hydrate(row: any) {
  Object.assign(fd, defaultFd(), row)
  fd.items = parseItems(row.goods_info)
  calcTotals()
}

function openEdit(row: any) {
  hydrate(row)
  isView.value = false
  showForm.value = true
}

function openView(row: any) {
  hydrate(row)
  isView.value = true
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
  loadSummary()
}

function onCustomerChange(id: any) {
  if (id === INTERNAL_CUSTOMER_VALUE) {
    fd.customer_name = t('sale.sample.internalLabel')
    fd.contact_name = ''
    return
  }
  const c = customerOptions.value.find(item => item.id === id)
  fd.customer_name = c?.name || c?.nickname || fd.customer_name
  fd.contact_name = c?.contact || ''
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(item => item.id === id)
  fd.warehouse_name = w?.name || ''
}

function onReceiptFundChange(id: any) {
  const f = fundOptions.value.find(item => item.id === id)
  fd.receipt_fund_name = f?.name || ''
}

function onExpenseFundChange(id: any) {
  const f = fundOptions.value.find(item => item.id === id)
  fd.expense_fund_name = f?.name || ''
}

async function applyDefaultWarehouse() {
  if (fd.warehouse_id) return
  const defaultWhId = await getSyncedDefaultWarehouseId()
  const wh = warehouseOptions.value.find(item => Number(item.id) === defaultWhId)
    || warehouseOptions.value[0]
  if (!wh) return
  fd.warehouse_id = wh.id
  fd.warehouse_name = wh.name
}

async function ensureWarehouseOptionsLoaded() {
  if (warehouseOptions.value.length) return
  try {
    const res = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = res.data?.rows ?? []
  } catch {
    //
  }
}

function firstPositiveNumber(...values: any[]) {
  for (const value of values) {
    const num = Number(value)
    if (Number.isFinite(num) && num > 0) return num
  }
  return 0
}

async function resolveBomCost(goods: any) {
  const key = String(goods.id || goods.goods_id || goods.goods_sn || goods.goods_name || '')
  if (!key) return 0
  if (bomCostCache.has(key)) return bomCostCache.get(key) || 0
  if (!bomListCache.value) {
    const res = await getBomList({ list_rows: 2000 })
    bomListCache.value = res.data?.rows ?? res.data?.list ?? []
  }
  const bom = bomListCache.value.find((item: any) =>
    (goods.id && Number(item.goods_id) === Number(goods.id)) ||
    (goods.goods_sn && item.goods_sn === goods.goods_sn) ||
    (goods.goods_name && item.goods_name === goods.goods_name)
  )
  if (!bom) {
    bomCostCache.set(key, 0)
    return 0
  }
  const detailRes = await getBomByGoods(bom.id || bom.goods_id || goods.id)
  const rows: any[] = detailRes.data?.items ?? detailRes.data?.rows ?? detailRes.data?.list ?? []
  const localPrices: Record<number, number> = (() => {
    try { return JSON.parse(localStorage.getItem('erp_bom_prices') || '{}') } catch { return {} }
  })()
  const cost = rows.reduce((sum, row) => {
    const price = firstPositiveNumber(row.price, row.cost_price, row.out_price, row.in_price, localPrices[row.id])
    return sum + Number(row.num || 0) * price
  }, 0)
  const fixedCost = Number(cost.toFixed(4))
  bomCostCache.set(key, fixedCost)
  return fixedCost
}

async function resolveGoodsCost(goods: any) {
  const directCost = firstPositiveNumber(
    goods.cost_price,
    goods.costPrice,
    goods.purchase_price,
    goods.avg_price,
    goods.in_price,
    goods.out_price,
  )
  if (directCost > 0) return directCost
  try {
    return await resolveBomCost(goods)
  } catch {
    return 0
  }
}

async function onGoodsConfirm(goods: any[]) {
  if (!bomListCache.value) {
    try {
      const res = await getBomList({ list_rows: 2000 })
      bomListCache.value = res.data?.rows ?? res.data?.list ?? []
    } catch { bomListCache.value = [] }
  }

  for (const g of goods) {
    const bom = bomListCache.value!.find((item: any) =>
      (g.id && Number(item.goods_id) === Number(g.id)) ||
      (g.goods_sn && item.goods_sn === g.goods_sn) ||
      (g.goods_name && item.goods_name === g.goods_name)
    )

    if (bom?.id) {
      let expand = false
      try {
        await ElMessageBox.confirm(
          t('sale.sample.bomExpandConfirmContent', { name: g.goods_name || g.name }),
          t('sale.sample.bomExpandTitle'),
          { confirmButtonText: t('sale.sample.bomExpandConfirm'), cancelButtonText: t('sale.sample.bomExpandCancel'), type: 'info', closeOnClickModal: false }
        )
        expand = true
      } catch { expand = false }

      if (expand) {
        try {
          const detailRes = await getBomByGoods(bom.id)
          const bomItems: any[] = detailRes.data?.items ?? []
          if (bomItems.length > 0) {
            for (const item of bomItems) {
              const costPrice = await resolveGoodsCost(item)
              fd.items.push({
                goods_id: item.goods_id || 0,
                goods_name: item.goods_name || '',
                goods_sn: item.goods_sn || '',
                spec: item.spec || '',
                unit_name: item.unit_name || '',
                num: Number(item.num || 1),
                cost_price: costPrice || Number(item.price || 0),
                out_price: costPrice || Number(item.price || 0),
                price: 0,
                remark: '',
              })
            }
            calcTotals()
            continue
          }
        } catch {}
      }
    }

    const costPrice = await resolveGoodsCost(g)
    fd.items.push({
      goods_id: g.id,
      goods_name: g.goods_name || g.name || '',
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      num: 1,
      cost_price: costPrice,
      out_price: costPrice,
      price: Number(g.sell_price || 0),
      remark: '',
    })
  }
  calcTotals()
}

function addEmptyRow() {
  fd.items.push({ goods_id: 0, goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, cost_price: 0, out_price: 0, price: 0, remark: '' })
  calcTotals()
}

function removeRow(index: number) {
  fd.items.splice(index, 1)
  calcTotals()
}

async function handleSave() {
  if (!fd.customer_name && !fd.customer_id) { ElMessage.warning(t('sale.sample.msgPickCustomer')); return }
  if (!fd.sample_date) { ElMessage.warning(t('sale.sample.msgPickSampleDate')); return }
  if (!fd.warehouse_id) { ElMessage.warning(t('sale.sample.msgPickWarehouse')); return }
  if (!fd.items.length) { ElMessage.warning(t('sale.sample.msgAddItems')); return }
  calcTotals()
  if (fd.paid_amount > 0 && !fd.receipt_fund_id) { ElMessage.warning(t('sale.sample.msgReceiptFundRequired')); return }
  if (fd.company_cost > 0 && fd.expense_payment_status === 'paid' && !fd.expense_fund_id) { ElMessage.warning(t('sale.sample.msgExpenseFundRequired')); return }
  saving.value = true
  try {
    const payload = {
      ...fd,
      customer_id: fd.customer_id === INTERNAL_CUSTOMER_VALUE ? null : fd.customer_id,
      customer_name: fd.customer_id === INTERNAL_CUSTOMER_VALUE ? (fd.customer_name || t('sale.sample.internalLabel')) : fd.customer_name,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) await updateSample(payload)
    else await createSample(payload)
    ElMessage.success(t('sale.sample.msgSaveSuccess'))
    backToList()
  } finally {
    saving.value = false
  }
}

async function handleAudit(row: any, status: number) {
  const label = status === 1 ? t('sale.sample.approve') : status === 0 ? t('sale.sample.unapprove') : t('sale.sample.reject')
  if (status === 1) {
    if (Number(row.paid_amount || 0) > 0 && !Number(row.receipt_fund_id || 0)) {
      ElMessage.warning(t('sale.sample.auditPaidNeedFund'))
      return
    }
    if (Number(row.company_cost || 0) > 0 && row.expense_payment_status === 'paid' && !Number(row.expense_fund_id || 0)) {
      ElMessage.warning(t('sale.sample.auditExpenseNeedFund'))
      return
    }
  }
  await ElMessageBox.confirm(t('sale.sample.auditConfirm', { action: label }), t('sale.sample.promptTitle'), { type: 'warning' })
  await auditSample(row.id, status)
  ElMessage.success(t('sale.sample.msgOpSuccess'))
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  loadSummary()
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm(t('sale.sample.deleteConfirm'), t('sale.sample.promptTitle'), { type: 'warning' })
  await deleteSample(row.id)
  ElMessage.success(t('sale.sample.msgDeleteSuccess'))
  tableRef.value?.refresh()
  loadSummary()
}

onMounted(() => {
  loadBaseData()
  loadSummary()
})
</script>

<style scoped>
.sample-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sample-summary {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.sum-item {
  background: #fff;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sum-item span {
  color: rgba(29,29,31,0.58);
  font-size: 13px;
}

.sum-item b {
  color: #1d2129;
  font-size: 18px;
}

.blue { color: #0071e3; }
.orange { color: #d97706; }

.expand-table {
  margin: 8px 16px;
  width: calc(100% - 32px);
}

.form-page {
  background: #fff;
  min-height: calc(100vh - 90px);
}

.form-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid #e8edf2;
  background: #fff;
}

.form-title-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
}

.form-body {
  padding: 16px;
}

.form-section {
  margin-bottom: 14px;
}

.sec-title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1d2129;
}

.goods-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  color: rgba(29,29,31,0.58);
  font-size: 13px;
}

.settle-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px 16px;
}

.settle-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.settle-item.wide {
  grid-column: span 2;
}

.settle-item span,
.remark-row span {
  width: 70px;
  flex-shrink: 0;
  color: rgba(29,29,31,0.58);
  font-size: 13px;
}

.settle-item b {
  font-size: 15px;
}

.remark-row {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  margin-top: 12px;
}

@media (max-width: 900px) {
  .sample-summary,
  .settle-grid {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
