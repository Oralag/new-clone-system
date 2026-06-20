<template>
  <div>
    <el-card>
      <div class="toolbar">
        <div class="toolbar-left">
          <el-input v-model="search.keyword" :placeholder="$t('finance.prepay.searchPlaceholder')" clearable style="width:200px" @change="loadData" />
          <el-select v-if="!fixedType" v-model="search.pay_type" :placeholder="$t('finance.prepay.typePlaceholder')" clearable style="width:120px" @change="loadData">
            <el-option :label="$t('finance.prepay.typeCustomer')" value="customer" />
            <el-option :label="$t('finance.prepay.typeSupplier')" value="supplier" />
          </el-select>
          <el-button type="primary" :icon="Search" @click="loadData">{{ $t('common.query') }}</el-button>
        </div>
        <div class="toolbar-right">
          <el-button type="primary" :icon="Plus" @click="openCreate">{{ fixedType === 'customer' ? $t('finance.prepay.addCustomerPrepay') : $t('finance.prepay.addSupplierPrepay') }}</el-button>
        </div>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe size="small" style="width:100%;margin-top:8px" :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''">
        <el-table-column type="index" :label="$t('finance.prepay.index')" width="60" align="center" />
        <el-table-column prop="order_sn" :label="$t('finance.prepay.orderNo')" width="160" />
        <el-table-column :label="$t('finance.prepay.type')" width="110" align="center">
          <template #default="{ row }">
            <el-tag :type="row.pay_type === 'customer' ? 'success' : 'warning'" size="small">
              {{ row.pay_type === 'customer' ? $t('finance.prepay.typeCustomer') : $t('finance.prepay.typeSupplier') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.prepay.counterpart')" min-width="130">
          <template #default="{ row }">
            {{ row.pay_type === 'customer' ? (row.customer_name || '—') : (row.supplier_name || '—') }}
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.prepay.amount')" width="120" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.prepay.usedAmount')" width="110" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626">¥{{ getUsedAmount(row).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('finance.prepay.balance')" width="110" align="right">
          <template #default="{ row }">
            <span :style="{ color: getBalance(row) > 0 ? '#16a34a' : '#c0c4cc', fontWeight: '600' }">
              ¥{{ getBalance(row).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="fund_name" :label="$t('finance.prepay.fundAccount')" width="130" />
        <el-table-column prop="pay_date" :label="$t('finance.prepay.date')" width="110" />
        <el-table-column prop="admin_name" :label="$t('finance.prepay.handler')" width="80" />
        <el-table-column prop="remark" :label="$t('finance.prepay.remark')" min-width="100" show-overflow-tooltip />
        <el-table-column :label="$t('finance.prepay.operation')" width="100" align="center" fixed="right">
          <template #default="{ row }">
            <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('finance.prepay.reconciled') : $t('finance.prepay.reconcile') }}</el-button>
            <el-tooltip v-if="getUsedAmount(row) > 0" :content="$t('finance.prepay.deleteDisabledTip')" placement="top">
              <el-button link type="info" size="small" disabled>{{ $t('finance.prepay.delete') }}</el-button>
            </el-tooltip>
            <el-button v-else link type="danger" size="small" @click="handleDelete(row.id)">{{ $t('finance.prepay.delete') }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top:12px;display:flex;justify-content:flex-end;align-items:center;gap:8px">
        <span style="font-size:13px;color:#666">{{ $t('finance.prepay.totalCount', { n: total }) }}</span>
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
    <el-dialog v-model="dialogVisible" :title="fixedType === 'customer' ? $t('finance.prepay.dialogTitleCustomer') : $t('finance.prepay.dialogTitleSupplier')" width="500px" destroy-on-close>
      <el-form ref="formRef" :model="fd" label-width="100px" :rules="rules">
        <el-form-item v-if="!fixedType" :label="$t('finance.prepay.formType')" prop="pay_type">
          <el-select v-model="fd.pay_type" style="width:100%" @change="fd.customer_name='';fd.supplier_name=''">
            <el-option :label="$t('finance.prepay.typeCustomer')" value="customer" />
            <el-option :label="$t('finance.prepay.typeSupplier')" value="supplier" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="fd.pay_type === 'customer'" :label="$t('finance.prepay.formCustomerName')" prop="customer_name">
          <el-input v-model="fd.customer_name" :placeholder="$t('finance.prepay.formCustomerNamePlaceholder')" />
        </el-form-item>
        <el-form-item v-if="fd.pay_type === 'supplier'" :label="$t('finance.prepay.formSupplierName')" prop="supplier_name">
          <el-input v-model="fd.supplier_name" :placeholder="$t('finance.prepay.formSupplierNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('finance.prepay.formAmount')" prop="amount">
          <el-input-number v-model="fd.amount" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.prepay.formFundAccount')" prop="fund_id">
          <el-select v-model="fd.fund_id" style="width:100%" :placeholder="$t('finance.prepay.formFundAccountPlaceholder')" @change="onFundChange">
            <el-option v-for="f in fundList" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('finance.prepay.formDate')" prop="pay_date">
          <el-date-picker v-model="fd.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('finance.prepay.formRemark')">
          <el-input v-model="fd.remark" type="textarea" :rows="2" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('finance.prepay.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('finance.prepay.confirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'
import { buildCustomerPrepayBreakdown, getPrepayRowKey } from '@/utils/prepay'

const { t } = useI18n()
const props = defineProps<{ fixedType?: 'customer' | 'supplier' }>()

const loading = ref(false)
const saving = ref(false)
const tableData = ref<any[]>([])

const prepayReconcileIds = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem('reconcile_prepay') || '[]')))
function toggleReconcile(row: any) {
  const newVal = !row._reconciled
  if (newVal) prepayReconcileIds.value.add(row.id)
  else prepayReconcileIds.value.delete(row.id)
  localStorage.setItem('reconcile_prepay', JSON.stringify([...prepayReconcileIds.value]))
  const idx = tableData.value.findIndex((r: any) => r.id === row.id)
  if (idx !== -1) tableData.value.splice(idx, 1, { ...tableData.value[idx], _reconciled: newVal })
}
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

const rules = computed(() => ({
  pay_type: [{ required: true, message: t('finance.prepay.ruleType') }],
  amount: [{ required: true, message: t('finance.prepay.ruleAmount'), type: 'number', min: 0.01 }],
  fund_id: [{ required: true, message: t('finance.prepay.ruleFund') }],
  pay_date: [{ required: true, message: t('finance.prepay.ruleDate') }],
}))

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
    tableData.value = (pageRes.data?.rows || []).map((r: any) => ({ ...r, _reconciled: prepayReconcileIds.value.has(Number(r.id)) }))
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
    ElMessage.success(t('finance.prepay.saveSuccess'))
    dialogVisible.value = false
    loadData()
    loadFunds()
  } catch (e: any) {
    ElMessage.error(e?.message || t('finance.prepay.saveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  const row = tableData.value.find((r: any) => r.id === id)
  if (!row) { ElMessage.warning(t('finance.prepay.recordNotFound')); return }

  // 安全检查：已核销（部分/全部）的预付款不允许删除
  const usedAmount = getUsedAmount(row)
  if (usedAmount > 0) {
    ElMessage.warning(t('finance.prepay.deleteUsedWarning', { amount: usedAmount.toFixed(2) }))
    return
  }

  const amount = Number(row.amount || 0)
  const target = row.pay_type === 'customer' ? (row.customer_name || '—') : (row.supplier_name || '—')
  await ElMessageBox.confirm(
    t('finance.prepay.deleteConfirmMsg', { target, amount: amount.toFixed(2) }),
    t('finance.prepay.deleteConfirmTitle'),
    { type: 'warning', confirmButtonText: t('finance.prepay.deleteConfirmBtn'), cancelButtonText: t('finance.prepay.cancel') },
  )

  await http.post('/finance/Prepay/del', { id })

  // 回退资金账户余额
  if (row.fund_id && amount > 0) {
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows || []
      const fund = funds.find((f: any) => f.id === row.fund_id)
      if (fund) {
        const newBalance = Number(fund.balance || 0) - amount
        await http.post('/finance/Fund/edit', { id: fund.id, name: fund.name, balance: newBalance })
      }
    } catch { /* 回退失败不影响删除结果 */ }
  }

  ElMessage.success(t('finance.prepay.deleteSuccess'))
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
