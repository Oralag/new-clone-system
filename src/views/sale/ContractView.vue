<template>
  <div class="contract-view-page">
    <div class="page-header">
      <el-button link :icon="ArrowLeft" @click="router.back()">{{ $t('sale.contractView.back') }}</el-button>
      <span class="page-title">{{ $t('sale.contractView.pageTitle') }}</span>
      <el-tag v-if="contract.status === 1" type="success" size="small">{{ $t('sale.contractView.statusAudited') }}</el-tag>
      <el-tag v-else type="warning" size="small">{{ $t('sale.contractView.statusPending') }}</el-tag>
    </div>

    <div v-if="loading" v-loading="true" style="height:200px" />

    <template v-else-if="contract.id">
      <el-card class="info-card">
        <div class="section-title">{{ $t('sale.contractView.basicInfo') }}</div>
        <el-row :gutter="24">
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.contractNo') }}</label><span>{{ contract.order_sn || contract.order_no }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.customerName') }}</label><span>{{ contract.customer_name }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.handler') }}</label><span>{{ contract.admin_name || $t('sale.contractView.emptyDash') }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.signDate') }}</label><span>{{ fmtDate(contract.sign_date || contract.order_date) }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.expireDate') }}</label><span>{{ contract.expire_date ? fmtDate(contract.expire_date) : $t('sale.contractView.emptyDash') }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.receiveAccount') }}</label><span>{{ contract.receive_account || $t('sale.contractView.emptyDash') }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>{{ $t('sale.contractView.needInvoice') }}</label><span>{{ contract.need_invoice ? $t('sale.contractView.yes') : $t('sale.contractView.no') }}</span></div>
          </el-col>
          <el-col :span="24">
            <div class="field-item"><label>{{ $t('sale.contractView.remark') }}</label><span>{{ contract.remark || $t('sale.contractView.emptyDash') }}</span></div>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="info-card">
        <div class="section-title">{{ $t('sale.contractView.goodsDetail') }}</div>
        <el-table :data="normalGoods" border size="small">
          <el-table-column type="index" :label="$t('sale.contractView.colIndex')" width="56" align="center" />
          <el-table-column :label="$t('sale.contractView.colGoodsName')" min-width="160">
            <template #default="{ row }">
              <el-tag v-if="row.line_type === 'exchange'" type="warning" size="small" effect="plain" style="margin-right:6px">{{ $t('sale.contractView.exchangeTag') }}</el-tag>
              {{ row.goods_name }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colGoodsSn')" width="120">
            <template #default="{ row }">{{ row.goods_sn }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colSpec')" width="100">
            <template #default="{ row }">{{ row.spec }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colUnit')" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colQty')" width="90" align="right">
            <template #default="{ row }">{{ row.num }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colPrice')" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colSubtotal')" width="120" align="right">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">{{ fmt(Number(row.price) * Number(row.num)) }}</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="feeItems.length" class="info-card">
        <div class="section-title">{{ $t('sale.contractView.extraFees') }}</div>
        <el-table :data="feeItems" border size="small">
          <el-table-column :label="$t('sale.contractView.colFeeName')" min-width="100">
            <template #default="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colAmount')" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.amount) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colBearer')" width="100">
            <template #default="{ row }">{{ row.bearer === 'seller' ? $t('sale.contractView.bearerSeller') : $t('sale.contractView.bearerBuyer') }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colSupplier')" min-width="130">
            <template #default="{ row }">{{ row.supplier_name || $t('sale.contractView.emptyDash') }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colReceiptNo')" min-width="130">
            <template #default="{ row }">{{ row.receipt_no || $t('sale.contractView.emptyDash') }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colOrderDate')" width="110">
            <template #default="{ row }">{{ row.order_date || $t('sale.contractView.emptyDash') }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="info-card settle-card">
        <div class="section-title">{{ $t('sale.contractView.settleInfo') }}</div>
        <div class="settle-row">
          <span>{{ $t('sale.contractView.totalAmount') }} <strong class="blue">¥{{ fmt(contract.total_amount) }}</strong></span>
          <span v-if="exchangeDeduct > 0">{{ $t('sale.contractView.exchangeDeduct') }} <strong style="color:#d97706">-¥{{ fmt(exchangeDeduct) }}</strong></span>
          <span>{{ $t('sale.contractView.receiveAmount') }} <strong class="blue">¥{{ fmt(contract.receive_amount) }}</strong></span>
          <span>{{ $t('sale.contractView.payAmount') }} <strong>¥{{ fmt(contract.pay_amount) }}</strong></span>
          <span>{{ $t('sale.contractView.prepayAmount') }} <strong>¥{{ fmt(contract.prepay_amount) }}</strong></span>
        </div>
      </el-card>

      <el-card v-if="returnItems.length" class="info-card exchange-card">
        <div class="section-title exchange-title">🔄 {{ $t('sale.contractView.exchangeReturnTitle') }}<span class="exchange-hint">{{ $t('sale.contractView.exchangeReturnHint') }}</span></div>
        <el-table :data="returnItems" border size="small">
          <el-table-column type="index" :label="$t('sale.contractView.colIndex')" width="56" align="center" />
          <el-table-column :label="$t('sale.contractView.colGoodsName')" min-width="160">
            <template #default="{ row }">{{ row.goods_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colSpec')" width="100">
            <template #default="{ row }">{{ row.spec }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colUnit')" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colQty')" width="90" align="right">
            <template #default="{ row }">{{ row.num }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colReturnPrice')" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colSubtotal')" width="120" align="right">
            <template #default="{ row }"><span style="color:#1e40af;font-weight:600">{{ fmt(Number(row.price) * Number(row.num)) }}</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="giftGoods.length" class="info-card gift-card">
        <div class="section-title gift-title">🎁 {{ $t('sale.contractView.giftTitle') }}<span class="gift-hint">{{ $t('sale.contractView.giftHint') }}</span></div>
        <el-table :data="giftGoods" border size="small">
          <el-table-column type="index" :label="$t('sale.contractView.colIndex')" width="56" align="center" />
          <el-table-column :label="$t('sale.contractView.colGoodsName')" min-width="160">
            <template #default="{ row }">{{ row.goods_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colGoodsSn')" width="120">
            <template #default="{ row }">{{ row.goods_sn }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colSpec')" width="100">
            <template #default="{ row }">{{ row.spec }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colUnit')" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colQty')" width="90" align="right">
            <template #default="{ row }">{{ row.num }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.contractView.colGiftRemark')" min-width="140">
            <template #default="{ row }">{{ row.remark || $t('sale.contractView.emptyDash') }}</template>
          </el-table-column>
        </el-table>
      </el-card>
    </template>

    <el-empty v-else :description="$t('sale.contractView.contractNotFound')" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const loading = ref(true)
const contract = ref<any>({})

const goods = computed(() => {
  const raw = contract.value.goods_info
  if (!raw) return []
  return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : [])
})
const normalGoods = computed(() => goods.value.filter((i: any) => i.line_type !== 'gift'))
const giftGoods = computed(() => goods.value.filter((i: any) => i.line_type === 'gift'))
const exchangeGroups = computed(() => {
  const raw = contract.value.exchange_groups
  if (!raw) return []
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw)
    return Array.isArray(arr) ? arr : []
  } catch { return [] }
})
const returnItems = computed(() =>
  exchangeGroups.value.flatMap((g: any) => Array.isArray(g.return_items) ? g.return_items : [])
)
const exchangeDeduct = computed(() => Number(contract.value.exchange_deduct || 0))

const filterReceiptNo = route.query.receipt_no as string | undefined

const feeItems = computed(() => {
  const raw = contract.value.fee_items
  if (!raw) return []
  try {
    const arr = Array.isArray(raw) ? raw : JSON.parse(raw)
    const all = arr.filter((f: any) => f && f.amount)
    return filterReceiptNo ? all.filter((f: any) => f.receipt_no === filterReceiptNo) : all
  } catch { return [] }
})

function fmt(v: any) { return Number(v || 0).toFixed(2) }
function fmtDate(d: any) { return d ? String(d).slice(0, 10) : t('sale.contractView.emptyDash') }

onMounted(async () => {
  try {
    const id = route.params.id
    const res = await http.get(`/shop/ContractOrder/detail?id=${id}`)
    contract.value = res.data ?? {}
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.contract-view-page { display: flex; flex-direction: column; gap: 12px; }
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
.gift-card { background: #fffbf2; }
.gift-title { color: #d97706; }
.gift-hint { font-size: 12px; color: rgba(217,119,6,0.7); margin-left: 4px; font-weight: normal; }
.exchange-card { background: #f0f9ff; }
.exchange-title { color: #1e40af; }
.exchange-hint { font-size: 12px; color: rgba(30,64,175,0.7); margin-left: 4px; font-weight: normal; }
</style>
