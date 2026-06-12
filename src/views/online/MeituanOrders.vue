<template>
  <div class="page-container">
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">美团订单</h2>
        <el-tag type="warning" size="small" style="margin-left:10px">美团闪购</el-tag>
      </div>
      <el-button type="primary" :icon="Plus" @click="openForm()">录入订单</el-button>
    </div>

    <!-- KPI 卡片 -->
    <div class="kpi-row">
      <div class="kpi-card">
        <div class="kpi-label">总订单数</div>
        <div class="kpi-val blue">{{ rows.length }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">总收入</div>
        <div class="kpi-val green">¥{{ fmt(totalAmount) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">本月收入</div>
        <div class="kpi-val blue">¥{{ fmt(monthAmount) }}</div>
      </div>
    </div>

    <!-- 筛选栏 -->
    <el-card style="margin-bottom:14px">
      <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
          start-placeholder="开始日期" end-placeholder="结束日期"
          value-format="YYYY-MM-DD" style="width:260px" @change="loadData" />
        <el-button :icon="Refresh" @click="resetFilter">重置</el-button>
      </div>
    </el-card>

    <!-- 订单列表 -->
    <el-card>
      <el-table :data="filteredRows" v-loading="loading" border size="small" style="width:100%" row-key="order_sn">
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 20px">
              <div v-if="getProducts(row.remark).length" style="display:flex;flex-wrap:wrap;gap:8px">
                <div v-for="(p, i) in getProducts(row.remark)" :key="i"
                  style="background:#f5f5f7;border-radius:8px;padding:6px 12px;font-size:12px;color:#1d1d1f">
                  <span style="font-weight:500">{{ p.name }}</span>
                  <span style="color:rgba(29,29,31,0.5);margin-left:6px">x{{ p.count }}</span>
                  <span style="color:#0071e3;margin-left:6px">¥{{ p.price }}</span>
                </div>
              </div>
              <div v-else style="color:rgba(29,29,31,0.4);font-size:12px">暂无商品明细</div>
              <div v-if="isEstimated(row.remark)" style="margin-top:6px;color:#f59e0b;font-size:11px">
                ⚠ 收入为估算值（实际以美团结算报告为准）
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单号" prop="order_sn" width="160" />
        <el-table-column label="日期" width="110">
          <template #default="{ row }">{{ fmtDate(row.order_date) }}</template>
        </el-table-column>
        <el-table-column label="平台订单号" width="200" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="color:rgba(29,29,31,0.5);font-size:12px">{{ getPlatformNo(row.remark) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商品摘要" show-overflow-tooltip>
          <template #default="{ row }">
            <span style="font-size:12px;color:#1d1d1f">{{ getProductSummary(row.remark) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="商家收入" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(Number(row.after_discount || row.total_amount)) }}</span>
            <el-icon v-if="isEstimated(row.remark)" style="color:#f59e0b;margin-left:2px;font-size:11px"><Warning /></el-icon>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'warning'" size="small">
              {{ row.status === 1 ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="80">
          <template #default="{ row }">
            <el-button v-if="row.status !== 1" type="primary" size="small" plain
              :loading="auditingId === row.id" @click="handleAudit(row)">
              审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <div style="margin-top:12px;text-align:right;color:rgba(29,29,31,0.5);font-size:12px">
        共 {{ filteredRows.length }} 条
      </div>
    </el-card>

    <!-- 录入弹框 -->
    <el-dialog v-model="formVisible" title="录入美团订单" width="480px" append-to-body>
      <el-form :model="formData" label-width="100px" ref="formRef">
        <el-form-item label="订单日期" required>
          <el-date-picker v-model="formData.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="平台单号">
          <el-input v-model="formData.platform_no" placeholder="美团订单编号（可选）" />
        </el-form-item>
        <el-form-item label="商家收入(¥)" required>
          <el-input-number v-model="formData.amount" :precision="2" :min="0" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="formData.remark" type="textarea" :rows="2" placeholder="客户姓名、商品等信息" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="formVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Refresh, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const MEITUAN_CUSTOMER_ID = 63  // 美团平台客户ID

const rows = ref<any[]>([])
const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)

const totalAmount = computed(() => rows.value.reduce((s, r) => s + Number(r.after_discount || r.total_amount || 0), 0))
const monthAmount = computed(() => {
  const now = new Date()
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return rows.value
    .filter(r => (r.order_date || '').startsWith(ym))
    .reduce((s, r) => s + Number(r.after_discount || r.total_amount || 0), 0)
})

const filteredRows = computed(() => {
  if (!dateRange.value) return rows.value
  const [start, end] = dateRange.value
  return rows.value.filter(r => {
    const d = (r.order_date || '').slice(0, 10)
    return d >= start && d <= end
  })
})

function fmt(n: number) { return n.toFixed(2) }
function fmtDate(d: string) { return d ? d.slice(0, 10) : '' }
function getPlatformNo(remark: string) {
  const m = (remark || '').match(/美团闪购订单\s*(\d+)/)
  return m ? m[1] : ''
}
function getProducts(remark: string): { name: string; price: number; count: number }[] {
  const m = (remark || '').match(/商品:\s*([^|]+)/)
  if (!m) return []
  return m[1].split(';').map(s => s.trim()).filter(Boolean).map(s => {
    const pm = s.match(/^(.+?)\s+x(\d+)\s+¥([\d.]+)$/)
    if (!pm) return null
    return { name: pm[1].trim(), count: Number(pm[2]), price: Number(pm[3]) }
  }).filter(Boolean) as { name: string; price: number; count: number }[]
}
function getProductSummary(remark: string): string {
  const products = getProducts(remark)
  if (!products.length) return ''
  if (products.length === 1) return `${products[0].name} x${products[0].count}`
  return `${products[0].name} 等${products.length}件`
}
function isEstimated(remark: string): boolean {
  return (remark || '').includes('估算值')
}

async function loadData() {
  loading.value = true
  try {
    const PAGE_SIZE = 20
    const first: any = await http.get('/shop/ContractOrder/index', { params: { page: 1, size: PAGE_SIZE } })
    const firstData = first?.data || first
    const total: number = firstData?.total || 0
    const allRows: any[] = [...(firstData?.rows || firstData?.list || [])]

    const totalPages = Math.ceil(total / PAGE_SIZE)
    const remaining = Array.from({ length: totalPages - 1 }, (_, i) =>
      http.get('/shop/ContractOrder/index', { params: { page: i + 2, size: PAGE_SIZE } })
    )
    const results = await Promise.all(remaining)
    for (const res of results) {
      const d = res?.data || res
      allRows.push(...(d?.rows || d?.list || []))
    }

    rows.value = allRows
      .filter((r: any) => Number(r.customer_id) === MEITUAN_CUSTOMER_ID)
      .sort((a: any, b: any) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime())
  } finally {
    loading.value = false
  }
}

function resetFilter() {
  dateRange.value = null
}

// 审核
const auditingId = ref<number | null>(null)
async function handleAudit(row: any) {
  auditingId.value = row.id
  try {
    await http.post('/shop/ContractOrder/audit', { id: row.id })
    ElMessage.success('审核成功')
    loadData()
  } finally {
    auditingId.value = null
  }
}

// 录入表单
const formVisible = ref(false)
const saving = ref(false)
const formData = ref({ order_date: '', platform_no: '', amount: 0, remark: '' })

function openForm() {
  formData.value = {
    order_date: new Date().toISOString().slice(0, 10),
    platform_no: '',
    amount: 0,
    remark: ''
  }
  formVisible.value = true
}

async function handleSave() {
  if (!formData.value.order_date) { ElMessage.warning('请选择订单日期'); return }
  if (!formData.value.amount) { ElMessage.warning('请填写收入金额'); return }
  saving.value = true
  try {
    const remark = [
      formData.value.platform_no ? `美团闪购订单 ${formData.value.platform_no}` : '',
      formData.value.remark
    ].filter(Boolean).join(' ')
    await http.post('/shop/ContractOrder/add', {
      customer_id: MEITUAN_CUSTOMER_ID,
      customer_name: '美团平台',
      order_date: formData.value.order_date,
      sign_date: formData.value.order_date,
      total_amount: formData.value.amount,
      after_discount: formData.value.amount,
      discount_type: 'none',
      discount_value: 0,
      freight_amount: 0,
      freight_bearer: 'buyer',
      goods_info: [],
      remark
    })
    ElMessage.success('录入成功')
    formVisible.value = false
    loadData()
  } finally {
    saving.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.header-left { display: flex; align-items: center; }
.page-title { font-size: 20px; font-weight: 600; color: #1d1d1f; margin: 0; }

.kpi-row { display: flex; gap: 14px; margin-bottom: 16px; flex-wrap: wrap; }
.kpi-card { background: #fff; border-radius: 12px; padding: 16px 22px; min-width: 130px; box-shadow: 0 1px 4px rgba(0,0,0,0.07); }
.kpi-label { font-size: 12px; color: rgba(29,29,31,0.5); margin-bottom: 6px; }
.kpi-val { font-size: 24px; font-weight: 700; }
.kpi-val.blue { color: #0071e3; }
.kpi-val.green { color: #16a34a; }
</style>
