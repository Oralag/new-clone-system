<template>
  <div>
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search.keyword" placeholder="客户名/供应商名/单号" clearable style="width:200px" @change="loadData" />
          <el-select v-if="!fixedType" v-model="search.pay_type" placeholder="类型" clearable style="width:120px" @change="loadData">
            <el-option label="客户预收款" value="customer" />
            <el-option label="供应商预付款" value="supplier" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="loadData">查询</el-button>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="openCreate">新增{{ fixedType === 'customer' ? '预收款' : fixedType === 'supplier' ? '预付款' : '预付款' }}</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe size="small" style="width:100%;margin-top:8px">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="order_sn" label="单号" width="160" />
        <el-table-column label="类型" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.pay_type === 'customer' ? 'success' : 'warning'" size="small">
              {{ row.pay_type === 'customer' ? '客户预收款' : '供应商预付款' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="客户/供应商" min-width="130">
          <template #default="{ row }">
            {{ row.pay_type === 'customer' ? (row.customer_name || '—') : (row.supplier_name || '—') }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已核销" width="110" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626">¥{{ getUsedAmount(row).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余可用" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: getBalance(row) > 0 ? '#16a34a' : '#c0c4cc', fontWeight: '600' }">
              ¥{{ getBalance(row).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="fund_name" label="入账账户" width="130" />
        <el-table-column prop="pay_date" label="日期" width="110" />
        <el-table-column prop="admin_name" label="经办人" width="100" />
        <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column label="操作" width="80" align="center" fixed="right">
          <template #default="{ row }">
            <el-button link type="danger" size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center;gap:8px">
        <span style="font-size:13px;color:#666">共 {{ total }} 条</span>
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]"
          layout="sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 新增弹框 -->
    <el-dialog v-model="dialogVisible" :title="fixedType === 'customer' ? '新增预收款' : fixedType === 'supplier' ? '新增预付款' : '新增预付款'" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="fd" label-width="100px" :rules="rules">
        <el-form-item v-if="!fixedType" label="类型" prop="pay_type">
          <el-select v-model="fd.pay_type" style="width:100%" @change="fd.customer_name='';fd.supplier_name=''">
            <el-option label="客户预收款" value="customer" />
            <el-option label="供应商预付款" value="supplier" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="fd.pay_type === 'customer'" label="客户名称" prop="customer_name">
          <el-input v-model="fd.customer_name" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item v-if="fd.pay_type === 'supplier'" label="供应商名称" prop="supplier_name">
          <el-input v-model="fd.supplier_name" placeholder="请输入供应商名称" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="fd.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="入账账户" prop="fund_id">
          <el-select v-model="fd.fund_id" style="width:100%" placeholder="请选择账户" @change="onFundChange">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期" prop="pay_date">
          <el-date-picker v-model="fd.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="fd.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'
import { buildCustomerPrepayBreakdown, getPrepayRowKey } from '@/utils/prepay'

const props = defineProps<{ fixedType?: 'customer' | 'supplier' }>()

const loading = ref(false)
const saving = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)

const rowStatMap = ref<Record<string, { used_amount: number; balance: number }>>({})
const collectReceiptRows = ref<any[]>([])
const allMatchedRows = ref<any[]>([])

async function loadCollectReceipts() {
  try {
    const res = await http.get('/finance/CollectReceipt/index', { params: { list_rows: 2000 } })
    collectReceiptRows.value = res.data?.rows ?? []
  } catch { /* ignore */ }
}

function getUsedAmount(row: any): number {
  const key = getPrepayRowKey(row)
  return Number(rowStatMap.value[key]?.used_amount || 0)
}

function getBalance(row: any): number {
  const key = getPrepayRowKey(row)
  if (rowStatMap.value[key]) return Number(rowStatMap.value[key].balance || 0)
  return Math.max(0, Number(row.amount || 0) - getUsedAmount(row))
}

function rebuildRowStats() {
  rowStatMap.value = buildCustomerPrepayBreakdown(allMatchedRows.value, collectReceiptRows.value).rowStats
}

const search = reactive({ keyword: '', pay_type: '' })

const dialogVisible = ref(false)
const formRef = ref()
const fundList = ref<any[]>([])

const fd = reactive({
  pay_type: 'customer',
  customer_name: '',
  supplier_name: '',
  amount: 0,
  fund_id: null as number | null,
  fund_name: '',
  pay_date: new Date().toISOString().slice(0, 10),
  remark: '',
})

const rules = {
  pay_type: [{ required: true, message: '请选择类型' }],
  amount: [{ required: true, message: '请输入金额', type: 'number', min: 0.01 }],
  fund_id: [{ required: true, message: '请选择入账账户' }],
  pay_date: [{ required: true, message: '请选择日期' }],
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: pageSize.value }
    const effectiveType = props.fixedType || search.pay_type
    if (effectiveType) params.pay_type = effectiveType
    if (search.keyword) params.keyword = search.keyword
    const allParams: any = { list_rows: 2000 }
    if (effectiveType) allParams.pay_type = effectiveType
    if (search.keyword) allParams.keyword = search.keyword
    const [pageRes, allRes] = await Promise.all([
      http.get('/finance/Prepay/index', { params }),
      http.get('/finance/Prepay/index', { params: allParams }),
    ])
    tableData.value = pageRes.data?.rows || []
    total.value = pageRes.data?.total || 0
    allMatchedRows.value = allRes.data?.rows || []
    rebuildRowStats()
  } finally {
    loading.value = false
  }
}

async function loadFunds() {
  const res = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
  fundList.value = res.data?.rows || []
}

function onFundChange(id: number) {
  const f = fundList.value.find(x => x.id === id)
  fd.fund_name = f?.name || ''
}

function openCreate() {
  fd.pay_type = props.fixedType || 'customer'
  fd.customer_name = ''
  fd.supplier_name = ''
  fd.amount = 0
  fd.fund_id = null
  fd.fund_name = ''
  fd.pay_date = new Date().toISOString().slice(0, 10)
  fd.remark = ''
  dialogVisible.value = true
}

async function handleSave() {
  await formRef.value?.validate()
  saving.value = true
  try {
    await http.post('/finance/Prepay/create', { ...fd })
    ElMessage.success('录入成功，已更新账户余额')
    dialogVisible.value = false
    loadData()
    loadFunds()
  } catch (e: any) {
    ElMessage.error(e?.message || '录入失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该记录？', '提示', { type: 'warning' })
  // 找到要删除的记录，用于回退资金账户余额
  const row = tableData.value.find((r: any) => r.id === id)
  await http.post('/finance/Prepay/del', { id })
  // 回退资金账户余额
  if (row?.fund_id && Number(row?.amount) > 0) {
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows || []
      const fund = funds.find((f: any) => f.id === row.fund_id)
      if (fund) {
        const newBalance = Math.max(0, Number(fund.balance || 0) - Number(row.amount))
        await http.post('/finance/Fund/edit', { id: fund.id, name: fund.name, balance: newBalance })
      }
    } catch { /* 回退失败不影响删除结果 */ }
  }
  ElMessage.success('删除成功')
  loadData()
  loadFunds()
}

onMounted(() => {
  loadData()
  loadFunds()
  loadCollectReceipts().then(rebuildRowStats)
})
</script>

<style scoped>
.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 4px;
}
.toolbar-left { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 8px; }
</style>
