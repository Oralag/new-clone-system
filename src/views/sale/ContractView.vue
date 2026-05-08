<template>
  <div class="contract-view-page">
    <div class="page-header">
      <el-button link :icon="ArrowLeft" @click="router.back()">返回</el-button>
      <span class="page-title">查看销售合同</span>
      <el-tag v-if="contract.status === 1" type="success" size="small">已审核</el-tag>
      <el-tag v-else type="warning" size="small">待审核</el-tag>
    </div>

    <div v-if="loading" v-loading="true" style="height:200px" />

    <template v-else-if="contract.id">
      <el-card class="info-card">
        <div class="section-title">基本信息</div>
        <el-row :gutter="24">
          <el-col :span="6">
            <div class="field-item"><label>合同编号</label><span>{{ contract.order_sn || contract.order_no }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>客户名称</label><span>{{ contract.customer_name }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>经办人</label><span>{{ contract.admin_name || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>签约日期</label><span>{{ fmtDate(contract.sign_date || contract.order_date) }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>到期日期</label><span>{{ contract.expire_date ? fmtDate(contract.expire_date) : '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>收款账户</label><span>{{ contract.receive_account || '—' }}</span></div>
          </el-col>
          <el-col :span="6">
            <div class="field-item"><label>是否开票</label><span>{{ contract.need_invoice ? '是' : '否' }}</span></div>
          </el-col>
          <el-col :span="24">
            <div class="field-item"><label>备注</label><span>{{ contract.remark || '—' }}</span></div>
          </el-col>
        </el-row>
      </el-card>

      <el-card class="info-card">
        <div class="section-title">商品明细</div>
        <el-table :data="goods" border size="small">
          <el-table-column type="index" label="序号" width="56" align="center" />
          <el-table-column label="商品名称" min-width="160">
            <template #default="{ row }">{{ row.goods_name }}</template>
          </el-table-column>
          <el-table-column label="商品编码" width="120">
            <template #default="{ row }">{{ row.goods_sn }}</template>
          </el-table-column>
          <el-table-column label="规格" width="100">
            <template #default="{ row }">{{ row.spec }}</template>
          </el-table-column>
          <el-table-column label="单位" width="70" align="center">
            <template #default="{ row }">{{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column label="数量" width="90" align="right">
            <template #default="{ row }">{{ row.num }}</template>
          </el-table-column>
          <el-table-column label="单价" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.price) }}</template>
          </el-table-column>
          <el-table-column label="小计" width="120" align="right">
            <template #default="{ row }"><span style="color:#0071e3;font-weight:600">{{ fmt(Number(row.price) * Number(row.num)) }}</span></template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card v-if="feeItems.length" class="info-card">
        <div class="section-title">附加费用</div>
        <el-table :data="feeItems" border size="small">
          <el-table-column label="费用名称" min-width="100">
            <template #default="{ row }">{{ row.name }}</template>
          </el-table-column>
          <el-table-column label="金额" width="110" align="right">
            <template #default="{ row }">{{ fmt(row.amount) }}</template>
          </el-table-column>
          <el-table-column label="承担方" width="100">
            <template #default="{ row }">{{ row.bearer === 'seller' ? '卖方' : '买方' }}</template>
          </el-table-column>
          <el-table-column label="供应商" min-width="130">
            <template #default="{ row }">{{ row.supplier_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="原始单号" min-width="130">
            <template #default="{ row }">{{ row.receipt_no || '—' }}</template>
          </el-table-column>
          <el-table-column label="业务日期" width="110">
            <template #default="{ row }">{{ row.order_date || '—' }}</template>
          </el-table-column>
        </el-table>
      </el-card>

      <el-card class="info-card settle-card">
        <div class="section-title">结算信息</div>
        <div class="settle-row">
          <span>合同金额 <strong class="blue">¥{{ fmt(contract.total_amount) }}</strong></span>
          <span>已收金额 <strong class="blue">¥{{ fmt(contract.receive_amount) }}</strong></span>
          <span>已付款 <strong>¥{{ fmt(contract.pay_amount) }}</strong></span>
          <span>预付款 <strong>¥{{ fmt(contract.prepay_amount) }}</strong></span>
        </div>
      </el-card>
    </template>

    <el-empty v-else description="合同不存在" />
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
const contract = ref<any>({})

const goods = computed(() => {
  const raw = contract.value.goods_info
  if (!raw) return []
  return Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : [])
})

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
function fmtDate(d: any) { return d ? String(d).slice(0, 10) : '—' }

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
</style>
