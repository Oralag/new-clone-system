<template>
  <div class="receivable-page">
    <!-- 顶部汇总 -->
    <div class="summary-bar">
      <span class="summary-item">应收总金额：<strong class="blue">{{ fmt(summaryTotal) }}</strong></span>
      <span class="summary-item">已收总金额：<strong class="green">{{ fmt(summaryPaid) }}</strong></span>
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

      <el-table :data="rows" v-loading="loading" border stripe style="width:100%" size="default">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="customer_name" label="客户名称" min-width="150" />
        <el-table-column prop="order_sn" label="出库单号" min-width="160">
          <template #default="{ row }">{{ row.order_sn || row.order_no || '—' }}</template>
        </el-table-column>
        <el-table-column label="应收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.total_amount || row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已收金额" min-width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a">¥{{ fmt(row.paid_amount || 0) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="待收欠款" min-width="120" align="right">
          <template #default="{ row }">
            <span :style="{ color: Number(row.un_pay_amount || (row.total_amount - row.paid_amount)) > 0 ? '#dc2626' : '#16a34a', fontWeight: '600' }">
              ¥{{ fmt(row.un_pay_amount ?? (Number(row.total_amount||0) - Number(row.paid_amount||0))) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="出库日期" min-width="110">
          <template #default="{ row }">{{ (row.out_date || row.created_at || '').slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="router.push('/finance/collect-receipt')">去收款</el-button>
            <el-button type="success" link size="small" @click="router.push('/sale/out')">查看出库</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="load"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Refresh } from '@element-plus/icons-vue'
import { getReceivableList } from '@/api/finance'

const router = useRouter()
const loading = ref(false)
const rows = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const searchForm = reactive({ customer_name: '', order_sn: '', date_from: '', date_to: '' })

function fmt(v: any) {
  return Number(v || 0).toFixed(2)
}

const summaryTotal = computed(() => rows.value.reduce((s, r) => s + Number(r.total_amount || r.amount || 0), 0))
const summaryPaid = computed(() => rows.value.reduce((s, r) => s + Number(r.paid_amount || 0), 0))
const summaryUnpaid = computed(() => rows.value.reduce((s, r) => {
  const unpaid = r.un_pay_amount ?? (Number(r.total_amount || r.amount || 0) - Number(r.paid_amount || 0))
  return s + Number(unpaid)
}, 0))

async function load() {
  loading.value = true
  try {
    const res = await getReceivableList({
      page: page.value,
      list_rows: pageSize.value,
      customer_name: searchForm.customer_name || undefined,
      order_sn: searchForm.order_sn || undefined,
      date_from: searchForm.date_from || undefined,
      date_to: searchForm.date_to || undefined,
    })
    rows.value = res.data?.rows ?? []
    total.value = res.data?.total ?? 0
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
.summary-item strong.red    { color: #dc2626; }

.table-card { border-radius: 12px; }

.toolbar { margin-bottom: 14px; }

.search-area {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.pagination-wrap {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
