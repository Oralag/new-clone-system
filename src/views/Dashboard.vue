<template>
  <div class="dashboard">
    <!-- Stats cards -->
    <el-row :gutter="16" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.key">
        <el-card class="stat-card" shadow="hover">
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

const stats = [
  { key: 'sale', label: '今日销售额', value: '--', sub: '环比昨日', icon: 'Money', color: '#ecf5ff' },
  { key: 'order', label: '今日订单', value: '--', sub: '待处理', icon: 'ShoppingCart', color: '#f0f9eb' },
  { key: 'customer', label: '客户总数', value: '--', sub: '本月新增', icon: 'User', color: '#fdf6ec' },
  { key: 'stock', label: '库存预警', value: '--', sub: '件商品不足', icon: 'WarningFilled', color: '#fef0f0' },
]

const quickItems = [
  { label: '收银台', path: '/cashregister', icon: 'CreditCard', color: '#e8f4fd', newWindow: true },
  { label: '客户管理', path: '/sale/client', icon: 'User', color: '#e8f0fe' },
  { label: '销售报价', path: '/sale/offer', icon: 'Document', color: '#fce8e6' },
  { label: '采购订单', path: '/procure/order', icon: 'Box', color: '#e6f4ea' },
  { label: '库存总览', path: '/warehouse/stock', icon: 'House', color: '#fef3e2' },
  { label: '应收账款', path: '/finance/receivable', icon: 'Wallet', color: '#e8eafd' },
  { label: '商品列表', path: '/goods/info', icon: 'Goods', color: '#fce8f3' },
  { label: '员工档案', path: '/personnel/staff', icon: 'Avatar', color: '#e3f2fd' },
  { label: '系统设置', path: '/setting/admin', icon: 'Setting', color: '#f3e5f5' },
]

function openNewWindow() {
  window.open('/#/cashregister', '_blank')
}

const saleTrendRef = ref<HTMLDivElement>()
const fundFlowList = ref<any[]>([])
const flowVisible = ref(false)

onMounted(async () => {
  if (saleTrendRef.value) {
    saleTrendRef.value.innerHTML = `<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#86909c;font-size:13px">暂无数据</div>`
  }
  try {
    const fundFlowRes = await http.get('/finance/fundFlow/index', { params: { list_rows: 500 } })
    fundFlowList.value = fundFlowRes.data?.rows ?? []
  } catch {}
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
