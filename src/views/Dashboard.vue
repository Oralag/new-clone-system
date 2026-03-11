<template>
  <div class="dashboard">
    <!-- Stats cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.key">
        <el-card class="stat-card" shadow="hover" style="cursor:pointer" @click="router.push(stat.link)">
          <div class="stat-content">
            <div class="stat-info">
              <div class="stat-label">{{ stat.label }}</div>
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-sub">{{ stat.sub }}</div>
            </div>
            <div class="stat-icon" :style="{ background: stat.color }">
              <el-icon :size="24"><component :is="stat.icon" /></el-icon>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- Charts + Quick entries full width -->
    <el-row :gutter="16">
      <el-col :span="12">
        <el-card header="近30天销售趋势">
          <div ref="saleTrendRef" style="height: 200px" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card header="快捷入口">
          <div class="quick-list">
            <div v-for="item in quickItems" :key="item.path" class="quick-item" @click="item.newWindow ? openNewWindow() : router.push(item.path)">
              <div class="quick-icon" :style="{ background: item.color }">
                <el-icon :size="20"><component :is="item.icon" /></el-icon>
              </div>
              <span class="quick-label">{{ item.label }}</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 资金流水（折叠） -->
    <div class="flow-section">
      <div class="flow-toggle" @click="flowVisible = !flowVisible">
        <el-icon :size="13"><List /></el-icon>
        <span>资金流水明细</span>
        <el-icon :size="12" style="margin-left:auto"><component :is="flowVisible ? 'ArrowUp' : 'ArrowDown'" /></el-icon>
      </div>
      <div v-if="flowVisible" class="flow-table">
        <el-table :data="fundFlowList" size="small" border style="width:100%">
          <el-table-column prop="fund_name" label="账户" width="120" />
          <el-table-column label="类型" width="70" align="center">
            <template #default="{ row }">
              <el-tag :type="row.flow_type === 'income' ? 'success' : row.flow_type === 'refund' ? 'info' : 'danger'" size="small">
                {{ row.flow_type === 'income' ? '收入' : row.flow_type === 'refund' ? '冲红' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="金额" width="110" align="right">
            <template #default="{ row }">
              <span :style="{ color: row.flow_type === 'income' ? '#00b42a' : '#f53f3f' }">
                {{ row.flow_type === 'income' ? '+' : '-' }}¥{{ Number(row.amount||0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="摘要" min-width="160" show-overflow-tooltip />
          <el-table-column prop="created_at" label="时间" width="150" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { List, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import http from '@/api/http'

const router = useRouter()

const stats = ref([
  { key: 'sale',     label: '今日销售额', value: '--', sub: '含销售+零售',   icon: 'Money',         color: '#ecf5ff', link: '/dashboard/today-sales' },
  { key: 'order',    label: '今日订单',   value: '--', sub: '销售+零售单数', icon: 'ShoppingCart',  color: '#f0f9eb', link: '/dashboard/today-sales' },
  { key: 'customer', label: '客户总数',   value: '--', sub: '全部客户',      icon: 'User',          color: '#fdf6ec', link: '/sale/client' },
  { key: 'stock',    label: '库存预警',   value: '--', sub: '负库存+零库存', icon: 'WarningFilled', color: '#fef0f0', link: '/warehouse/stock' },
])

const quickItems = [
  { label: '收银台',   path: '/cashregister',      icon: 'CreditCard', color: '#e8f4fd', newWindow: true },
  { label: '客户管理', path: '/sale/client',        icon: 'User',       color: '#e8f0fe' },
  { label: '销售报价', path: '/sale/offer',         icon: 'Document',   color: '#fce8e6' },
  { label: '采购订单', path: '/procure/order',      icon: 'Box',        color: '#e6f4ea' },
  { label: '库存总览', path: '/warehouse/stock',    icon: 'House',      color: '#fef3e2' },
  { label: '应收账款', path: '/finance/receivable', icon: 'Wallet',     color: '#e8eafd' },
  { label: '商品列表', path: '/goods/info',         icon: 'Goods',      color: '#fce8f3' },
  { label: '员工档案', path: '/personnel/staff',    icon: 'Avatar',     color: '#e3f2fd' },
  { label: '系统设置', path: '/setting/admin',      icon: 'Setting',    color: '#f3e5f5' },
]

function openNewWindow() { window.open('/#/cashregister', '_blank') }

const saleTrendRef = ref<HTMLDivElement>()
const fundFlowList = ref<any[]>([])
const flowVisible = ref(false)

const today = (() => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
})()

onMounted(async () => {
  const [saleRes, retailRes, customerRes, procureRes, goodsRes, fundFlowRes] = await Promise.allSettled([
    http.get('/stock/SaleOutOrder/index',   { params: { list_rows: 2000 } }),
    http.get('/retail/order/index',         { params: { list_rows: 2000 } }),
    http.get('/shop/ShopCustomer/index',    { params: { list_rows: 1 } }),
    http.get('/procure/ProcureInhouse/index', { params: { list_rows: 2000 } }),
    http.get('/goods/ShopGoods/index',      { params: { list_rows: 2000, status: 1 } }),
    http.get('/finance/fundFlow/index',     { params: { list_rows: 500 } }),
  ])

  const rows = (r: PromiseSettledResult<any>) =>
    r.status === 'fulfilled' ? (r.value?.data?.rows ?? r.value?.rows ?? []) : []

  const saleRows: any[]   = rows(saleRes)
  const retailRows: any[] = rows(retailRes)

  // 今日销售额 & 订单数（前端按日期过滤）
  const todaySale   = saleRows.filter((r: any) => (r.out_date   || '').slice(0, 10) === today)
  const todayRetail = retailRows.filter((r: any) => (r.order_date || '').slice(0, 10) === today)
  const saleAmt   = todaySale.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
  const retailAmt = todayRetail.reduce((s: number, r: any) => s + Number(r.pay_amount || r.total_amount || 0), 0)
  stats.value[0].value = '¥' + (saleAmt + retailAmt).toFixed(2)
  stats.value[1].value = String(todaySale.length + todayRetail.length)

  // 客户总数
  const custData = customerRes.status === 'fulfilled' ? (customerRes.value?.data ?? customerRes.value) : {}
  stats.value[2].value = String(custData?.total ?? 0)

  // 库存预警：计算净库存，统计 <= 0
  const stockMap: Record<number, number> = {}
  rows(procureRes).forEach((r: any) => {
    if (Number(r.status) !== 1) return
    const items = typeof r.goods_info === 'string' ? JSON.parse(r.goods_info || '[]') : (r.goods_info || [])
    items.forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) + Number(i.num || 0) })
  })
  ;[...saleRows, ...retailRows].forEach((r: any) => {
    if (r.out_date !== undefined && Number(r.status) !== 1) return // 销售出库需审核
    const items = typeof r.goods_info === 'string' ? JSON.parse(r.goods_info || '[]') : (r.goods_info || [])
    items.forEach((i: any) => { stockMap[i.goods_id] = (stockMap[i.goods_id] ?? 0) - Number(i.num || 0) })
  })
  const goodsList: any[] = rows(goodsRes)
  stats.value[3].value = String(goodsList.filter(g => (stockMap[g.id] ?? 0) <= 0).length)

  // 资金流水
  if (fundFlowRes.status === 'fulfilled') {
    fundFlowList.value = fundFlowRes.value?.data?.rows ?? fundFlowRes.value?.rows ?? []
  }

  // 近30天销售趋势（销售出库 + 零售）
  if (saleTrendRef.value) {
    const days: string[] = []
    for (let i = 29; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i)
      const pad = (n: number) => String(n).padStart(2, '0')
      days.push(`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`)
    }
    const dayMap: Record<string, number> = Object.fromEntries(days.map(d => [d, 0]))
    saleRows.forEach((r: any) => {
      const d = (r.out_date || '').slice(0, 10)
      if (dayMap[d] !== undefined) dayMap[d] += Number(r.total_amount || 0)
    })
    retailRows.forEach((r: any) => {
      const d = (r.order_date || '').slice(0, 10)
      if (dayMap[d] !== undefined) dayMap[d] += Number(r.pay_amount || r.total_amount || 0)
    })
    const values = days.map(d => dayMap[d])
    const maxVal = Math.max(...values, 1)
    if (values.every(v => v === 0)) {
      saleTrendRef.value.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#86909c;font-size:13px">近30天暂无销售数据</div>`
    } else {
      const W = 400, H = 160, pL = 8, pR = 8, pT = 10, pB = 24
      const pts = values.map((v, i) => {
        const x = (pL + (i / (days.length - 1)) * (W - pL - pR)).toFixed(1)
        const y = (pT + (1 - v / maxVal) * (H - pT - pB)).toFixed(1)
        return `${x},${y}`
      })
      const area = `M${pts[0]} L${pts.join(' L')} L${W - pR},${H - pB} L${pL},${H - pB} Z`
      const labels = days.filter((_, i) => i % 5 === 0 || i === 29).map(d => {
        const i = days.indexOf(d)
        const x = (pL + (i / 29) * (W - pL - pR)).toFixed(1)
        return `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="9" fill="#86909c">${d.slice(5)}</text>`
      }).join('')
      saleTrendRef.value.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:100%" preserveAspectRatio="none">
        <defs><linearGradient id="tg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#165dff" stop-opacity="0.18"/>
          <stop offset="100%" stop-color="#165dff" stop-opacity="0.01"/>
        </linearGradient></defs>
        <path d="${area}" fill="url(#tg)"/>
        <polyline points="${pts.join(' ')}" fill="none" stroke="#165dff" stroke-width="1.5" stroke-linejoin="round" stroke-linecap="round"/>
        ${labels}</svg>`
    }
  }
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card { border-radius: 10px; }

/* 资金收支卡片 */
.finance-card {
  border-radius: 10px;
}
.finance-card :deep(.el-card__body) { padding: 12px 14px; }
.finance-content {
  display: flex;
  align-items: center;
  gap: 10px;
}
.finance-icon {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: #e6f7f0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00b42a;
  flex-shrink: 0;
}
.income-icon { background: #e6f7f0; color: #00b42a; }
.expense-icon { background: #fff0f0; color: #f53f3f; }
.balance-icon { background: #e8f0fe; color: #165dff; }
.receivable-icon { background: #e6f7f0; color: #00b42a; }
.payable-icon { background: #fff7e6; color: #ff7d00; }
.finance-label { font-size: 11px; color: #86909c; margin-bottom: 2px; }
.finance-value { font-size: 16px; font-weight: 700; line-height: 1.2; margin-bottom: 2px; }
.finance-value.income { color: #00b42a; }
.finance-value.expense { color: #f53f3f; }
.finance-value.balance { color: #165dff; }
.finance-value.receivable { color: #00b42a; }
.finance-value.payable { color: #ff7d00; }
.finance-sub { font-size: 11px; color: #c9cdd4; }

/* 账户余额 */
.balance-card :deep(.el-card__body) { padding: 14px 20px; }

.balance-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 12px;
}

.balance-list {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 0;
}

.balance-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 20px 4px 0;
  border-right: 1px solid #f0f0f0;
  margin-right: 20px;
}

.balance-name { font-size: 13px; color: #4e5969; }
.balance-amount { font-size: 15px; font-weight: 600; color: #165dff; }

.balance-total {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  font-size: 13px;
  color: #4e5969;
}

.balance-total-amount { font-size: 16px; font-weight: 700; color: #f53f3f; }
.balance-empty { font-size: 13px; color: #86909c; }

.stat-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.stat-label { font-size: 13px; color: #86909c; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: 700; color: #1d2129; line-height: 1; margin-bottom: 6px; }
.stat-sub { font-size: 12px; color: #86909c; }

.stat-icon {
  width: 52px;
  height: 52px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #165dff;
}

.quick-list { display: flex; flex-wrap: wrap; gap: 12px; }

.quick-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 10px 14px;
  border-radius: 10px;
  transition: background 0.15s;
  min-width: 68px;
}

.quick-item:hover { background: #f2f3f5; }

.quick-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #165dff;
}

.quick-label { font-size: 12px; color: #4e5969; }

/* 资金流水折叠区 */
.flow-section {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e8e8e8;
  overflow: hidden;
}
.flow-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  font-size: 12px;
  color: #86909c;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s;
}
.flow-toggle:hover { background: #f7f8fa; }
.flow-table { padding: 0 0 8px; }
</style>
