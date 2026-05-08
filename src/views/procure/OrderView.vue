<template>
  <div class="order-view-page">
    <div class="page-header">
      <el-button link :icon="ArrowLeft" @click="router.back()">返回</el-button>
      <span class="page-title">查看采购单</span>
      <el-tag v-if="order.status === 1" type="success" size="small">已审核</el-tag>
      <el-tag v-else type="warning" size="small">待审核</el-tag>
    </div>

    <div v-if="loading" v-loading="true" style="height:200px" />

    <template v-else-if="order.id">
      <el-card class="info-card">
        <div class="section-title">基本信息</div>
        <el-row :gutter="24">
          <el-col :span="6">
            <div class="field-item"><label>采购单号</label><span>{{ order.order_no || order.order_sn }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>供应商</label><span>{{ order.supplier_name }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>采购人</label><span>{{ order.admin_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>开单日期</label><span>{{ fmtDate(order.order_date) }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>预计交期</label><span>{{ order.delivery_date ? fmtDate(order.delivery_date) : '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>仓库</label><span>{{ order.warehouse_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>付款账户</label><span>{{ order.fund_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>是否开票</label><span>{{ order.need_invoice ? '是' : '否' }}</span></div>
          </el-col>
          <el-col :span="24">
            <div class="field-item"><label>备注</label><span>{{ order.remark || '—' }}</span></div>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="info-card">
        <el-table :data="goods" border size="small">
          <el-table-column type="index" label="序号" width="56" align="center" />
          <el-table-column label="商品名称" min-width="160">
            <template #default="{ row }">{{ row.goods_name }}</template>
          </el-table-column>
          <el-table-column label="商品编码" width="120">
            <template #default="{ row }">{{ row.goods_sn }}</template>
          </el-table-column>
          <el-table-column label="规格型号" width="110">
            <template #default="{ row }">{{ row.spec }}</template>
          </el-table-column>
          <el-table-column label="单位" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column label="采购数量" width="100" align="right">
            <template #default="{ row }">{{ row.num }}</template>
          </el-table-column>
          <el-table-column label="未税单价" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price_no_tax ?? row.price) }}</template>
          </el-table-column>
          <el-table-column label="税率(%)" width="90" align="center">
            <template #default="{ row }">{{ row.tax_rate ?? 0 }}%</template>
          </el-table-column>
          <el-table-column label="含税单价" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price) }}</template>
          </el-table-column>
          <el-table-column label="含税合计" width="120" align="right">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">{{ fmt(Number(row.price) * Number(row.num)) }}</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="info-card settle-card">
        <div class="section-title">结算信息</div>
        <div class="settle-row">
          <span>本单应付 <strong class="blue">¥{{ fmt(totalAmount) }}</strong></span>
          <span>折扣方式 <strong>{{ discountLabel }}</strong></span>
          <span>折后金额 <strong>¥{{ fmt(afterDiscount) }}</strong></span>
          <span>已付金额 <strong class="blue">¥{{ fmt(order.pay_amount) }}</strong></span>
        </div>
        <div class="settle-row" style="margin-top:8px">
          <span>未税合计：<strong>¥{{ fmt(sumNoTax) }}</strong></span>
          <span>税额合计：<strong class="red">¥{{ fmt(sumTax) }}</strong></span>
          <span>含税合计：<strong class="blue">¥{{ fmt(totalAmount) }}</strong></span>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="单据不存在" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'
import http from '@/api/http'

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
  const t = order.value.discount_type
  if (t === 'percent') return `${order.value.discount_value}折`
  if (t === 'amount') return `减${order.value.discount_value}元`
  return '无折扣'
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
