<template>
  <div class="tool-call-card" :class="statusClass">
    <!-- 头部：图标 + 名称 + 状态 + 展开按钮 -->
    <div class="card-header">
      <el-icon class="card-icon"><component :is="statusIcon" /></el-icon>
      <span class="tool-name">{{ toolLabel }}</span>
      <span class="card-status">{{ statusText }}</span>
      <button
        v-if="status === 'success' && result && result.length > 200"
        @click="isExpanded = !isExpanded"
        class="expand-btn"
      >
        {{ isExpanded ? '收起' : '展开' }}
      </button>
    </div>

    <!-- 入参 -->
    <div v-if="input && Object.keys(input).length" class="card-input">
      <span v-for="(v, k) in input" :key="k" class="param-chip">
        <b>{{ k }}</b>: {{ v }}
      </span>
    </div>

    <!-- 加载中 -->
    <div v-if="status === 'running'" class="loading-row">
      <span class="loading-text">工具执行中...</span>
    </div>

    <!-- 成功结果 -->
    <div v-if="status === 'success' && result" class="card-result" :class="{ collapsed: !isExpanded && result.length > 200 }">
      {{ result }}
    </div>
    <div v-if="status === 'success' && result && !isExpanded && result.length > 200" class="collapse-tip" @click="isExpanded = true">
      内容过长，点击展开查看全部
    </div>

    <!-- 失败信息 -->
    <div v-if="status === 'error'" class="card-result error-result">{{ result }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const props = defineProps<{
  name: string
  input?: Record<string, any>
  result?: string
  status: 'running' | 'success' | 'error'
}>()

const isExpanded = ref(false)

const toolLabels: Record<string, string> = {
  query_customers: '查询客户',
  query_suppliers: '查询供应商',
  query_goods: '查询商品',
  query_inventory: '查询库存',
  query_sales: '查询销售',
  query_purchases: '查询采购',
  query_finance: '查询财务',
  query_staff: '查询员工',
  query_warehouses: '查询仓库',
  create_customer: '新增客户',
  create_supplier: '新增供应商',
  create_goods: '新增商品',
  create_sale_order: '新增销售订单',
  create_procure_order: '新增采购订单',
  create_collect_receipt: '新增收款单',
  create_pay_receipt: '新增付款单',
  create_prepay: '新增预付款',
  create_staff: '新增员工',
  create_warehouse: '新增仓库',
  create_fund_account: '新增资金账户',
  navigate_to: '页面跳转',
}

const toolLabel = computed(() => toolLabels[props.name] || props.name)
const statusClass = computed(() => `status-${props.status}`)
const statusIcon = computed(() => {
  if (props.status === 'running') return Loading
  if (props.status === 'success') return CircleCheck
  return CircleClose
})
const statusText = computed(() => {
  if (props.status === 'running') return '执行中...'
  if (props.status === 'success') return '完成'
  return '失败'
})
</script>

<style scoped>
.tool-call-card {
  border-radius: 8px;
  padding: 8px 12px;
  margin: 4px 0;
  font-size: 12px;
  border: 1px solid var(--faint, #e4e7ed);
  background: var(--gray, #f9fafb);
}

.status-running { border-color: #a0cfff; background: #ecf5ff; }
.status-success { border-color: #b3e19d; background: #f0f9eb; }
.status-error   { border-color: #fab6b6; background: #fef0f0; }

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.status-running .card-icon { color: #409eff; animation: spin 1s linear infinite; }
.status-success .card-icon { color: #67c23a; }
.status-error   .card-icon { color: #f56c6c; }

@keyframes spin { to { transform: rotate(360deg); } }

.tool-name { flex: 1; color: var(--dark, #303133); }
.card-status { font-size: 11px; color: var(--mid, #909399); font-weight: 400; }

.expand-btn {
  padding: 1px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 11px;
  cursor: pointer;
}

.card-input {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.param-chip {
  background: var(--faint, rgba(0,0,0,0.05));
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--mid, #606266);
}

.loading-row {
  margin-top: 6px;
}
.loading-text {
  font-size: 12px;
  color: #409eff;
}

.card-result {
  margin-top: 6px;
  color: var(--mid, #606266);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.card-result.collapsed {
  max-height: 60px;
  overflow: hidden;
}

.error-result {
  color: #f56c6c;
}

.collapse-tip {
  font-size: 11px;
  color: #409eff;
  cursor: pointer;
  margin-top: 2px;
}
</style>
