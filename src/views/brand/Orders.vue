<template>
  <div class="brand-orders">
    <div class="bo-header">
      <h2 class="bo-title">订单查询</h2>
      <p class="bo-sub">输入手机号或订单号查询您的订单状态</p>
    </div>
    <div class="bo-form">
      <input v-model="query" type="text" placeholder="手机号 / 订单号" class="bo-input" @keyup.enter="doSearch" />
      <button class="bo-btn" @click="doSearch" :disabled="searching">
        {{ searching ? '查询中...' : '查询' }}
      </button>
    </div>

    <div v-if="searched && !searching && results.length === 0" class="bo-empty">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(29,29,31,0.2)" stroke-width="1.5" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
      <p>未找到相关订单</p>
      <p class="bo-empty-hint">请确认手机号或订单号是否正确</p>
    </div>

    <div v-if="results.length > 0" class="bo-list">
      <div v-for="order in results" :key="order.id" class="bo-card">
        <div class="bo-card-row">
          <span class="bo-order-no">订单号：{{ order.order_no }}</span>
          <span class="bo-status" :class="statusClass(order.status)">{{ order.status_text }}</span>
        </div>
        <div class="bo-card-row">
          <span class="bo-date">下单时间：{{ order.create_time }}</span>
          <span class="bo-amount">¥{{ order.amount }}</span>
        </div>
        <div v-if="order.goods_name" class="bo-card-goods">{{ order.goods_name }}</div>
        <div v-if="order.tracking_no" class="bo-tracking">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2" stroke-linecap="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          运单号：{{ order.tracking_no }}
        </div>
      </div>
    </div>

    <!-- 查询失败提示 -->
    <div v-if="errorMsg" class="bo-error">{{ errorMsg }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const ERP_BASE = 'https://nomaderp.pages.dev/adminapi'

async function erpGet(path: string, params: Record<string, any>) {
  const url = new URL(`${ERP_BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, String(v)))
  const res = await fetch(url.toString())
  return res.json()
}

const query = ref('')
const searching = ref(false)
const searched = ref(false)
const errorMsg = ref('')
const results = ref<any[]>([])

async function doSearch() {
  const q = query.value.trim()
  if (!q) return
  searching.value = true
  searched.value = false
  errorMsg.value = ''
  results.value = []

  try {
    const isMobile = /^1[3-9]\d{9}$/.test(q)

    if (isMobile) {
      // 按手机号查客户，再查订单
      const customerJson = await erpGet('/shop/ShopCustomer/index', { mobile: q, list_rows: 1 })
      const customer = customerJson.data?.rows?.[0]
      if (customer?.id) {
        const orderJson = await erpGet('/shop/ContractOrder/index', { customer_id: customer.id, list_rows: 20 })
        results.value = (orderJson.data?.rows || []).map(formatOrder)
      }
    } else {
      // 按订单号查（支持任意格式）
      const orderJson = await erpGet('/shop/ContractOrder/index', { order_no: q, list_rows: 10 })
      results.value = (orderJson.data?.rows || []).map(formatOrder)
    }
  } catch (e: any) {
    errorMsg.value = '查询失败，请稍后再试'
  } finally {
    searching.value = false
    searched.value = true
  }
}

function formatOrder(row: any) {
  const statusMap: Record<number, string> = {
    0: '待确认', 1: '已确认', 2: '备货中', 3: '已发货', 4: '已签收', 5: '已完成', 9: '已取消'
  }
  return {
    id: row.id,
    order_no: row.order_no || row.contract_no || ('ND' + row.id),
    status: row.status ?? 0,
    status_text: statusMap[row.status] || '处理中',
    create_time: row.create_time || row.created_at || '',
    amount: row.after_discount || row.total_amount || '—',
    goods_name: row.goods_name || row.remark || '',
    tracking_no: row.tracking_no || '',
  }
}

function statusClass(status: number) {
  if (status >= 4) return 'status-done'
  if (status === 3) return 'status-shipping'
  if (status === 9) return 'status-cancel'
  return 'status-pending'
}
</script>

<style scoped>
.brand-orders { max-width: 700px; margin: 0 auto; padding: 48px 24px 80px; }
.bo-header { margin-bottom: 32px; }
.bo-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
.bo-sub { font-size: 14px; color: rgba(29,29,31,0.45); }
.bo-form { display: flex; gap: 12px; margin-bottom: 32px; }
.bo-input { flex: 1; padding: 14px 20px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 14px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.bo-input:focus { border-color: #7c3aed; }
.bo-btn { padding: 0 28px; background: #1d1d1f; color: #fff; border-radius: 14px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; white-space: nowrap; }
.bo-btn:hover:not(:disabled) { background: #7c3aed; }
.bo-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.bo-empty { text-align: center; color: rgba(29,29,31,0.4); padding: 48px 0; }
.bo-empty svg { margin: 0 auto 16px; display: block; }
.bo-empty p { font-size: 16px; font-weight: 600; margin-bottom: 6px; }
.bo-empty-hint { font-size: 13px !important; font-weight: 400 !important; color: rgba(29,29,31,0.3); }

.bo-list { display: flex; flex-direction: column; gap: 12px; }
.bo-card { background: #f5f5f7; border-radius: 16px; padding: 20px 24px; transition: box-shadow 0.2s; }
.bo-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
.bo-card-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.bo-order-no { font-size: 13px; font-weight: 700; }
.bo-status { font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; }
.status-pending { color: #d97706; background: rgba(217,119,6,0.1); }
.status-shipping { color: #0071e3; background: rgba(0,113,227,0.1); }
.status-done { color: #34c759; background: rgba(52,199,89,0.1); }
.status-cancel { color: rgba(29,29,31,0.4); background: rgba(0,0,0,0.06); }
.bo-date { font-size: 12px; color: rgba(29,29,31,0.4); }
.bo-amount { font-size: 17px; font-weight: 800; }
.bo-card-goods { font-size: 12px; color: rgba(29,29,31,0.5); margin-top: 4px; }
.bo-tracking { display: flex; align-items: center; gap: 5px; font-size: 12px; color: #0071e3; font-weight: 600; margin-top: 8px; }
.bo-error { text-align: center; color: #ef4444; font-size: 14px; padding: 24px 0; }

@media (max-width: 768px) {
  .brand-orders { padding: 24px 16px 60px; }
  .bo-title { font-size: 24px; }
  .bo-form { flex-direction: column; }
  .bo-btn { padding: 14px; }
  .bo-card { padding: 16px; }
}
</style>
