<template>
  <div class="order-view-page">
    <div class="page-header">
      <el-button link :icon="ArrowLeft" @click="router.back()">{{ $t('procure.orderView.btnBack') }}</el-button>
      <span class="page-title">{{ $t('procure.orderView.pageTitle') }}</span>
      <el-tag v-if="order.status === 1" type="success" size="small">{{ $t('procure.orderView.tagAudited') }}</el-tag>
      <el-tag v-else type="warning" size="small">{{ $t('procure.orderView.tagPending') }}</el-tag>
    </div>

    <div v-if="loading" v-loading="true" style="height:200px" />

    <template v-else-if="order.id">
      <el-card class="info-card">
        <div class="section-title">{{ $t('procure.orderView.sectionBasicInfo') }}</div>
        <el-row :gutter="24">
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelOrderNo') }}</label><span>{{ order.order_no || order.order_sn }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelSupplier') }}</label><span>{{ order.supplier_name }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelBuyer') }}</label><span>{{ order.admin_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelOrderDate') }}</label><span>{{ fmtDate(order.order_date) }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelDeliveryDate') }}</label><span>{{ order.delivery_date ? fmtDate(order.delivery_date) : '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelWarehouse') }}</label><span>{{ order.warehouse_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelPayAccount') }}</label><span>{{ order.fund_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('procure.orderView.labelNeedInvoice') }}</label><span>{{ order.need_invoice ? $t('procure.orderView.invoiceYes') : $t('procure.orderView.invoiceNo') }}</span></div>
          </el-col>
          <el-col :span="24">
            <div class="field-item"><label>{{ $t('procure.orderView.labelRemark') }}</label><span>{{ order.remark || '—' }}</span></div>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="info-card">
        <el-table :data="goods" border size="small">
          <el-table-column type="index" :label="$t('procure.orderView.colIndex')" width="56" align="center" />
          <el-table-column :label="$t('procure.orderView.colGoodsName')" min-width="160">
            <template #default="{ row }">{{ row.goods_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colGoodsSn')" width="120">
            <template #default="{ row }">{{ row.goods_sn }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colSpec')" width="110">
            <template #default="{ row }">{{ row.spec }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colUnit')" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colNum')" width="100" align="right">
            <template #default="{ row }">{{ row.num }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colPriceNoTax')" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price_no_tax ?? row.price) }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colTaxRate')" width="90" align="center">
            <template #default="{ row }">{{ row.tax_rate ?? 0 }}%</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colPriceWithTax')" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price) }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.orderView.colTotalWithTax')" width="120" align="right">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">{{ fmt(Number(row.price) * Number(row.num)) }}</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="info-card settle-card">
        <div class="section-title">{{ $t('procure.orderView.sectionSettle') }}</div>
        <div class="settle-row">
          <span>{{ $t('procure.orderView.settlePayable') }} <strong class="blue">¥{{ fmt(totalAmount) }}</strong></span>
          <span>{{ $t('procure.orderView.settleDiscount') }} <strong>{{ discountLabel }}</strong></span>
          <span>{{ $t('procure.orderView.settleAfterDiscount') }} <strong>¥{{ fmt(afterDiscount) }}</strong></span>
          <span>{{ $t('procure.orderView.settlePaid') }} <strong class="blue">¥{{ fmt(order.pay_amount) }}</strong></span>
        </div>
        <div class="settle-row" style="margin-top:8px">
          <span>{{ $t('procure.orderView.settleNoTaxTotal') }}<strong>¥{{ fmt(sumNoTax) }}</strong></span>
          <span>{{ $t('procure.orderView.settleTaxTotal') }}<strong class="red">¥{{ fmt(sumTax) }}</strong></span>
          <span>{{ $t('procure.orderView.settleWithTaxTotal') }}<strong class="blue">¥{{ fmt(totalAmount) }}</strong></span>
        </div>
      </el-card>
    </template>

    <el-empty v-else :description="$t('procure.orderView.emptyDoc')" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import http from '@/api/http'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const order = ref<any>({})

const goods = computed(() => {
  const raw = order.value.goods_info
  if (!raw) return []
  return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : [])
})

const totalAmount = computed(() => Number(order.value.total_amount || 0))
const afterDiscount = computed(() => Number(order.value.after_discount || totalAmount.value))
const discountLabel = computed(() => {
  const dt = order.value.discount_type
  if (dt === 'percent') return `${order.value.discount_value}${t('procure.orderView.discountPercent')}`
  if (dt === 'amount') return `${t('procure.orderView.discountAmount')}${order.value.discount_value}${t('procure.orderView.discountAmountSuffix')}`
  return t('procure.orderView.discountNone')
})
const sumNoTax = computed(() => goods.value.reduce((s: number, g: any) => s + Number(g.price_no_tax ?? g.price) * Number(g.num), 0))
const sumTax = computed(() => totalAmount.value - sumNoTax.value)

function fmt(v: any) { return Number(v || 0).toFixed(2) }
function fmtDate(d: any) { return d ? String(d).slice(0, 10) : '—' }

onMounted(async () => {
  try {
    const id = Number(route.params.id)
    const res = await http.get('/stock/PurchaseOrder/index', { params: { list_rows: 500 } })
    const rows: any[] = res.data?.rows ?? []
    order.value = rows.find(r => r.id === id) ?? {}
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.order-view-page { display: flex; flex-direction: column; gap: 12px; }
.page-header { display: flex; align-items: center; gap: 12px; padding: 4px 0; }
.page-title { font-size: 18px; font-weight: 600; color: #1d1d1f; }
.info-card { border-radius: 12px; }
.section-title { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 16px; }
.field-item { display: flex; flex-direction: column; gap: 4px; margin-bottom: 16px; }
.field-item label { font-size: 12px; color: rgba(29,29,31,0.45); }
.field-item span { font-size: 14px; color: #1d1d1f; }
.settle-card .settle-row { display: flex; gap: 40px; font-size: 14px; color: rgba(29,29,31,0.6); }
.settle-row strong { color: #1d1d1f; }
.settle-row strong.blue { color: #0071e3; }
.settle-row strong.red { color: #dc2626; }
</style>
