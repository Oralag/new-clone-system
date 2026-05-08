<template>
  <div class="receivable-page">
    <!-- 顶部汇总 -->
    <div :class="['summary-bar', isMobile ? 'summary-bar--mobile' : '']">
      <span class="summary-item">应收总金额：<strong class="blue">{{ fmt(summaryTotal) }}</strong></span>
      <span class="summary-item">已收总金额：<strong class="green">{{ fmt(summaryPaid) }}</strong></span>
      <span class="summary-item">退货总金额：<strong class="orange">{{ fmt(summaryReturn) }}</strong></span>
      <span class="summary-item">待收欠款：<strong class="red">{{ fmt(summaryUnpaid) }}</strong></span>
    </div>

    <el-card class="table-card" data-guide-id="guide-receivable-card">
      <div class="toolbar">
        <div class="search-area">
          <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:180px" />
          <el-input v-model="searchForm.order_sn" placeholder="出库单号" clearable style="width:180px" />
          <el-date-picker
            v-model="searchForm.date_from"
            type="date"
            placeholder="开始日期"
            value-format="YYYY-MM-DD"
            style="width:140px"
          />
          <span style="color:rgba(29,29,31,0.35)">至</span>
          <el-date-picker
            v-model="searchForm.date_to"
            type="date"
            placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:140px"
          />
          <el-button type="primary" :icon="Search" @click="load">查询</el-button>
          <el-button :icon="Refresh" @click="resetSearch">重置</el-button>
        </div>
      </div>

      <!-- 手机端：卡片列表 -->
      <div v-if="isMobile" v-loading="loading" class="mobile-rec-list">
        <div v-if="!displayRows.length" class="mobile-rec-empty">暂无数据</div>
        <div v-for="row in displayRows" :key="row.id" class="mobile-rec-card">
          <div class="mrc-top">
            <span class="mrc-name">{{ row.customer_name || '—' }}</span>
            <span class="mrc-unpaid" :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a' }">
              欠款 ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </div>
          <div class="mrc-mid">{{ row.order_sn || '—' }}</div>
          <div class="mrc-row">
            <span class="mrc-label">应收</span><span class="mrc-val blue">¥{{ fmt(row.total_amount) }}</span>
            <span class="mrc-label">已收</span><span class="mrc-val green">¥{{ fmt(row.paid_amount) }}</span>
            <span class="mrc-label">日期</span><span class="mrc-val">{{ fmtDt(row.out_date) }}</span>
          </div>
        </div>
        <div class="mobile-rec-total">共 {{ total }} 条 · 待收合计 ¥{{ fmt(summaryUnpaid) }}</div>
      </div>

      <!-- PC端：表格 -->
      <el-table v-else :data="displayRows" v-loading="loading" border stripe style="width:100%" size="default">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="customer_name" label="客户名称" min-width="150" />
        <el-table-column prop="source" label="来源" width="100" />
        <el-table-column prop="order_sn" label="单据号" min-width="160">
          <template #default="{ row }">{{ row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column label="应收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.total_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.paid_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退货金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:rgba(29,29,31,0.25);font-weight:600">¥0.00</span>
          </template>
        </el-table-column>
        <el-table-column label="待收欠款" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: row.un_pay_amount > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              ¥{{ fmt(row.un_pay_amount) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="签单日期" min-width="150">
          <template #default="{ row }">{{ fmtDt(row.out_date) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="router.push('/finance/collect-receipt')">去收款</el-button>
            <el-button type="success" link size="small" @click="router.push(row.source === '样品单' ? '/sale/sample' : '/sale/out')">查看单据</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap" v-if="!isMobile">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @size-change="(s: number) => { pageSize = s; page = 1 }"
          @current-change="(p: number) => { page = p }"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'

const router = useRouter()
const loading = ref(false)
const allRows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchForm = reactive({ customer_name: '', order_sn: '', date_from: '', date_to: '' })
const isMobile = ref(window.innerWidth < 768)

function fmt(v: any) {
  return Number(v || 0).toFixed(2)
}

const filteredRows = computed(() => allRows.value)
const displayRows = computed(() => {
  const start = (page.value - 1) * pageSize.value
  return filteredRows.value.slice(start, start + pageSize.value)
})

const summaryTotal = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.total_amount || 0), 0))
const summaryPaid = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.paid_amount || r.pay_amount || 0), 0))
const summaryReturn = computed(() => 0)
const summaryUnpaid = computed(() => filteredRows.value.reduce((s, r) => s + Number(r.un_pay_amount || 0), 0))

async function load() {
  loading.value = true
  try {
    const params: any = {
      list_rows: 2000,
    }
    if (searchForm.customer_name) params.customer_name = searchForm.customer_name
    if (searchForm.order_sn) params.order_sn = searchForm.order_sn
    const receivableParams = {
      ...params,
      keyword: searchForm.customer_name || searchForm.order_sn || '',
    }
    const [contractRes, receivableRes] = await Promise.allSettled([
      http.get('/shop/ContractOrder/index', { params: { ...params, status: 1 } }),
      http.get('/finance/CollectAccounts/index', { params: receivableParams }),
    ])
    const contractRows: any[] = contractRes.status === 'fulfilled' ? (contractRes.value.data?.rows ?? []) : []
    const sampleRows: any[] = receivableRes.status === 'fulfilled' ? (receivableRes.value.data?.rows ?? []) : []
    const contractItems = contractRows
      .map((r: any) => ({
        ...r,
        source: '销售合同',
        paid_amount: Number(r.pay_amount || 0),
        un_pay_amount: Math.max(0, Number(r.total_amount || 0) - Number(r.pay_amount || 0)),
        order_sn: r.order_sn || r.order_no || '',
        out_date: r.order_date || r.created_at,
      }))
    const sampleItems = sampleRows.map((r: any) => ({
      ...r,
      source: String(r.order_sn || '').startsWith('YP') ? '样品单' : '应收单',
      paid_amount: Number(r.paid_amount || 0),
      un_pay_amount: Number(r.un_pay_amount || 0),
      out_date: r.due_date || r.created_at,
    }))
    const filtered = [...contractItems, ...sampleItems]
      .filter((r: any) => {
        if (searchForm.customer_name && !String(r.customer_name || '').includes(searchForm.customer_name)) return false
        if (searchForm.order_sn && !String(r.order_sn || r.order_no || '').includes(searchForm.order_sn)) return false
        if (r.un_pay_amount <= 0) return false
        if (searchForm.date_from && fmtDt(r.out_date) < searchForm.date_from) return false
        if (searchForm.date_to && fmtDt(r.out_date) > searchForm.date_to) return false
        return true
      })
    allRows.value = filtered
    total.value = filtered.length
  } finally {
    loading.value = false
  }
}

function resetSearch() {
  Object.assign(searchForm, { customer_name: '', order_sn: '', date_from: '', date_to: '' })
  page.value = 1
  load()
}

onMounted(load)
</script>

<style scoped>
.receivable-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.summary-bar {
  background: #fff;
  border-radius: 12px;
  padding: 14px 24px;
  display: flex;
  gap: 40px;
  border: 1px solid rgba(0,0,0,0.06);
  font-size: 14px;
  color: rgba(29,29,31,0.5);
}

.summary-item strong { font-size: 16px; }
.summary-item strong.blue   { color: #0071e3; }
.summary-item strong.green  { color: #16a34a; }
.summary-item strong.orange { color: #d97706; }
.summary-item strong.red    { color: #dc2626; }

.table-card { border-radius: 12px; }

.toolbar { margin-bottom: 14px; }

.search-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.summary-bar--mobile {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 12px;
}
.summary-bar--mobile .summary-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
}
.summary-bar--mobile .summary-item strong {
  font-size: 16px;
}

/* 手机端卡片列表 */
.mobile-rec-list { padding: 8px 0; }
.mobile-rec-empty { text-align: center; padding: 40px; color: #c2c8d5; font-size: 14px; }
.mobile-rec-card {
  background: #fff;
  border-radius: 12px;
  margin: 8px 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.mrc-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.mrc-name { font-size: 14px; font-weight: 700; color: #1d2129; }
.mrc-unpaid { font-size: 13px; font-weight: 700; }
.mrc-mid { font-size: 12px; color: #86909c; margin-bottom: 8px; }
.mrc-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
}
.mrc-label { color: #86909c; }
.mrc-val { font-weight: 600; color: #1d2129; margin-right: 6px; }
.mrc-val.blue { color: #0071e3; }
.mrc-val.green { color: #16a34a; }
.mobile-rec-total {
  text-align: center;
  padding: 12px;
  font-size: 13px;
  color: #4e5969;
  font-weight: 600;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
