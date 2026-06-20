<template>
  <div class="new-receipt-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <span class="page-title">{{ t('finance.payReceiptNew.pageTitle') }}</span>
      <div class="header-actions">
        <el-button @click="router.back()">{{ t('finance.payReceiptNew.btnBack') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          {{ t('finance.payReceiptNew.btnSave') }}
        </el-button>
      </div>
    </div>

    <div class="form-body">
      <!-- 基本信息行 -->
      <el-row :gutter="24" class="info-row">
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelOrderSn') }}</label>
            <el-input v-model="fd.order_sn" :placeholder="t('finance.payReceiptNew.placeholderOrderSn')" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelPayDate') }}</label>
            <el-date-picker v-model="fd.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="info-row">
        <el-col :span="8">
          <div class="field-wrap required">
            <label class="field-label">{{ t('finance.payReceiptNew.labelSupplier') }}</label>
            <div style="display:flex;gap:6px">
              <el-select
                v-model="fd.supplier_id"
                :placeholder="t('finance.payReceiptNew.placeholderSupplier')"
                filterable
                clearable
                style="flex:1"
                @change="onSupplierChange"
              >
                <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
              <el-button type="primary" :icon="Plus" @click="quickAddSupplierVisible = true" />
            </div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelPrepay') }}</label>
            <el-input :value="fmt(fd.prepay)" readonly class="readonly-input" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelUnpayAmount') }}</label>
            <el-input :value="fmt(fd.un_pay_amount)" readonly class="readonly-input" />
          </div>
        </el-col>
      </el-row>

      <!-- 付款明细表 -->
      <div class="section-title">
        <span>{{ t('finance.payReceiptNew.sectionPayLines') }}</span>
      </div>
      <div class="pay-lines-table">
        <div class="pay-lines-header">
          <el-button type="primary" :icon="Plus" size="small" circle @click="addLine" />
          <span class="col-account">{{ t('finance.payReceiptNew.colFundAccount') }}</span>
          <span class="col-amount">{{ t('finance.payReceiptNew.colAmount') }}</span>
        </div>
        <div v-for="(line, idx) in payLines" :key="idx" class="pay-line-row">
          <span class="line-index">{{ idx + 1 }}</span>
          <div class="col-account">
            <div style="display:flex;gap:6px;align-items:center">
              <el-select v-model="line.fund_id" :placeholder="t('finance.payReceiptNew.placeholderFundAccount')" filterable clearable style="flex:1" @change="(v) => onFundChange(v, line)">
                <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
              </el-select>
              <el-button type="primary" :icon="Plus" size="small" @click="openAddFund" />
            </div>
          </div>
          <div class="col-amount">
            <el-input-number v-model="line.amount" :min="0" :precision="2" :controls="false" style="width:100%" />
          </div>
          <el-button type="danger" link :icon="Delete" @click="removeLine(idx)" style="margin-left:6px" />
        </div>
        <div class="pay-line-total">
          <span>{{ t('finance.payReceiptNew.totalLabel') }}</span>
          <span></span>
          <span class="total-amount">{{ fmt(linesTotal) }}</span>
        </div>
      </div>

      <!-- 下方字段 -->
      <el-row :gutter="24" class="info-row" style="margin-top:16px">
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelDiscountAmount') }}</label>
            <el-input-number v-model="fd.discount_amount" :min="0" :precision="2" :controls="false" style="width:100%" :placeholder="t('finance.payReceiptNew.placeholderDiscountAmount')" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelTotalAmount') }}</label>
            <el-input :value="fmt(linesTotal)" readonly class="readonly-input" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelPrepayDeduct') }}</label>
            <el-input-number v-model="fd.prepay_deduct" :min="0" :precision="2" :controls="false" style="width:100%">
              <template #suffix>
                <span style="font-size:11px;color:#dc2626">{{ t('finance.payReceiptNew.notePrepayDeduct') }}</span>
              </template>
            </el-input-number>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="info-row">
        <el-col :span="24">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelVerifyType') }}</label>
            <el-radio-group v-model="fd.verify_type">
              <el-radio value="manual">{{ t('finance.payReceiptNew.radioManual') }}</el-radio>
              <el-radio value="auto">{{ t('finance.payReceiptNew.radioAuto') }}</el-radio>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="info-row">
        <el-col :span="12">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelRemark') }}</label>
            <el-input v-model="fd.remark" type="textarea" :rows="3" :placeholder="t('finance.payReceiptNew.placeholderRemark')" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="field-wrap">
            <label class="field-label">{{ t('finance.payReceiptNew.labelAttachment') }}</label>
            <el-button :icon="UploadFilled" type="default">{{ t('finance.payReceiptNew.btnSelectFile') }}</el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 快速新增供应商 -->
    <el-dialog v-model="quickAddSupplierVisible" :title="t('finance.payReceiptNew.dialogQuickAddSupplier')" width="360px" append-to-body>
      <el-form label-width="70px">
        <el-form-item :label="t('finance.payReceiptNew.labelSupplierName')" required>
          <el-input v-model="quickSupplierName" :placeholder="t('finance.payReceiptNew.placeholderSupplierName')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddSupplierVisible = false">{{ t('finance.payReceiptNew.btnCancelQuick') }}</el-button>
        <el-button type="primary" :loading="quickSaving" @click="confirmQuickSupplier">{{ t('finance.payReceiptNew.btnConfirmQuick') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户 -->
    <el-dialog v-model="addFundVisible" :title="t('finance.payReceiptNew.dialogAddFund')" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="t('finance.payReceiptNew.labelFundName')">
          <el-input v-model="fundForm.name" :placeholder="t('finance.payReceiptNew.placeholderFundName')" />
        </el-form-item>
        <el-form-item :label="t('finance.payReceiptNew.labelFundBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ t('finance.payReceiptNew.btnCancelFund') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ t('finance.payReceiptNew.btnConfirmFund') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Delete, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { createPayReceipt, getFundList, createFund } from '@/api/finance'
import http from '@/api/http'
import { getSupplierList, createSupplier } from '@/api/procure'
import { adjustFundBalance } from '@/utils/fund'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

function fmt(v: any) { return Number(v || 0).toFixed(2) }

// 从路由参数读采购单信息（从应付款页面跳转时携带）
const routeOrderId = Number(route.query.order_id || 0)
const routeOrderNo = String(route.query.order_no || '')
// 多张欠款单时传 order_ids + order_amounts + order_sns + order_pay_amounts（逗号分隔）
const routeOrderIds = String(route.query.order_ids || '')
const parsedOrderIds = routeOrderIds
  ? routeOrderIds.split(',').map(Number).filter(Boolean)
  : routeOrderId ? [routeOrderId] : []
const routeOrderAmounts = String(route.query.order_amounts || '')
const parsedOrderAmounts = routeOrderAmounts ? routeOrderAmounts.split(',').map(Number) : []
const routeOrderSns = String(route.query.order_sns || '')
const parsedOrderSns = routeOrderSns ? routeOrderSns.split(',') : []
const routeOrderPayAmounts = String(route.query.order_pay_amounts || '')
const parsedOrderPayAmounts = routeOrderPayAmounts ? routeOrderPayAmounts.split(',').map(Number) : []
// 单笔付款专用
const routeOrderSn = String(route.query.order_sn || '')
const routeOrderPayAmount = Number(route.query.order_pay_amount || 0)
const defaultRemark = parsedOrderIds.length > 0
  ? parsedOrderIds.map(id => `采购单付款 #${id}`).join(' ')
  : ''

// 初始化时从路由参数读供应商信息
const fd = reactive({
  order_sn: '',
  pay_date: new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10),
  supplier_id: null as any,
  supplier_name: '',
  prepay: 0,
  un_pay_amount: Number(route.query.un_pay_amount || 0),
  discount_amount: 0,
  prepay_deduct: 0,
  verify_type: 'auto',
  remark: defaultRemark,
})

// 付款明细行
const payLines = ref<{ fund_id: any; fund_name: string; amount: number }[]>([
  { fund_id: null, fund_name: '', amount: 0 }
])

const linesTotal = computed(() => payLines.value.reduce((s, l) => s + Number(l.amount || 0), 0))
const validPayLines = computed(() =>
  payLines.value
    .map((line, index) => ({ ...line, _index: index }))
    .filter(line => Number(line.amount || 0) > 0)
)

function addLine() {
  payLines.value.push({ fund_id: null, fund_name: '', amount: 0 })
}
function removeLine(idx: number) {
  if (payLines.value.length > 1) payLines.value.splice(idx, 1)
}

// 供应商选项
const supplierOptions = ref<any[]>([])

function onSupplierChange(id: any) {
  const s = supplierOptions.value.find(x => x.id === id)
  fd.supplier_name = s?.name ?? ''
}

// 资金账户
const fundOptions = ref<any[]>([])

function onFundChange(id: any, line: any) {
  const f = fundOptions.value.find(x => x.id === id)
  line.fund_name = f?.name ?? ''
}

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch {}
}

// 保存
const saving = ref(false)

async function handleSave() {
  if (!fd.supplier_id) { ElMessage.warning(t('finance.payReceiptNew.msgSelectSupplier')); return }
  if (linesTotal.value <= 0) { ElMessage.warning(t('finance.payReceiptNew.msgFillAmount')); return }
  if (validPayLines.value.some(line => !line.fund_id)) {
    ElMessage.warning(t('finance.payReceiptNew.msgSelectFundAccount'))
    return
  }

  saving.value = true
  try {
    // 多张采购单路径（从应付款供应商行点"付款"）：按单拆分创建付款记录并更新 pay_amount
    if (parsedOrderIds.length > 1 && parsedOrderAmounts.length === parsedOrderIds.length) {
      const fundQueue = validPayLines.value
        .filter(l => Number(l.amount || 0) > 0)
        .map(l => ({ fund_id: l.fund_id, fund_name: l.fund_name, remaining: Number(l.amount || 0) }))

      // 记录每张单实际分配金额，用于后续更新 pay_amount
      const allocations: { orderId: number; orderSn: string; oldPay: number; allocated: number }[] = []
      let totalCreated = 0

      for (let i = 0; i < parsedOrderIds.length; i++) {
        const orderId = parsedOrderIds[i]
        const orderSn = parsedOrderSns[i] || ''
        const oldPay = parsedOrderPayAmounts[i] || 0
        let orderNeed = parsedOrderAmounts[i] || 0
        if (orderNeed <= 0) continue
        let allocated = 0

        while (orderNeed > 0.001 && fundQueue.length > 0) {
          const fund = fundQueue[0]
          const take = Math.min(orderNeed, fund.remaining)
          if (take <= 0.001) { fundQueue.shift(); continue }

          await createPayReceipt({
            order_sn: orderSn || undefined,
            pay_date: fd.pay_date,
            supplier_id: fd.supplier_id,
            supplier_name: fd.supplier_name,
            contact_type: 'supplier',
            contact_name: fd.supplier_name,
            contact_id: fd.supplier_id,
            amount: take,
            fund_id: fund.fund_id ?? 0,
            fund_name: fund.fund_name || '',
            pay_type: 'bank',
            verify_type: fd.verify_type,
            remark: `采购单付款 #${orderId}`,
          })

          fund.remaining -= take
          orderNeed -= take
          allocated += take
          totalCreated++
          if (fund.remaining <= 0.001) fundQueue.shift()
        }

        if (allocated > 0) allocations.push({ orderId, orderSn, oldPay, allocated })
      }

      // 统一扣减资金账户余额
      for (const line of validPayLines.value) {
        if (Number(line.amount || 0) > 0) {
          try { await adjustFundBalance({ fundId: line.fund_id, fundName: line.fund_name, delta: -Number(line.amount || 0) }) } catch { /* ignore */ }
        }
      }

      // 更新每张采购单的 pay_amount
      for (const { orderId, oldPay, allocated } of allocations) {
        try { await http.post('/stock/PurchaseOrder/edit', { id: orderId, pay_amount: oldPay + allocated }) } catch { /* ignore */ }
      }

      ElMessage.success(t('finance.payReceiptNew.msgSaveMultiSuccess', { count: parsedOrderIds.length, total: totalCreated }))
      router.back()
      return
    }

    // 单张采购单或无关联单据的原有逻辑
    const totalLines = validPayLines.value.length
    for (const [idx, line] of validPayLines.value.entries()) {
      const payload: Record<string, any> = {
        order_sn: fd.order_sn
          ? (totalLines === 1 ? fd.order_sn : `${fd.order_sn}-${String(idx + 1).padStart(2, '0')}`)
          : undefined,
        order_id: routeOrderId || undefined,
        pay_date: fd.pay_date,
        supplier_id: fd.supplier_id,
        supplier_name: fd.supplier_name,
        contact_type: 'supplier',
        contact_name: fd.supplier_name,
        contact_id: fd.supplier_id,
        amount: Number(line.amount || 0),
        fund_id: line.fund_id ?? 0,
        fund_name: line.fund_name || '',
        pay_type: 'bank',
        discount_amount: totalLines === 1 ? fd.discount_amount : 0,
        prepay_deduct: totalLines === 1 ? fd.prepay_deduct : 0,
        verify_type: fd.verify_type,
        remark: totalLines === 1
          ? fd.remark
          : `${fd.remark || ''}${fd.remark ? ' ' : ''}[分账户 ${idx + 1}/${totalLines}]`.trim(),
      }
      await createPayReceipt(payload)
      try {
        await adjustFundBalance({ fundId: line.fund_id, fundName: line.fund_name, delta: -Number(line.amount || 0) })
      } catch { /* 扣减失败不阻断 */ }
    }
    // 更新采购单 pay_amount
    if (routeOrderId && routeOrderPayAmount >= 0) {
      try { await http.post('/stock/PurchaseOrder/edit', { id: routeOrderId, pay_amount: routeOrderPayAmount + linesTotal.value }) } catch { /* ignore */ }
    }
    ElMessage.success(totalLines > 1 ? t('finance.payReceiptNew.msgSaveSplitSuccess', { count: totalLines }) : t('finance.payReceiptNew.msgSaveSuccess'))
    router.back()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.payReceiptNew.msgSaveFailed'))
  } finally {
    saving.value = false
  }
}

// 快速新增供应商
const quickAddSupplierVisible = ref(false)
const quickSaving = ref(false)
const quickSupplierName = ref('')

async function confirmQuickSupplier() {
  if (!quickSupplierName.value.trim()) { ElMessage.warning(t('finance.payReceiptNew.msgSupplierNameRequired')); return }
  quickSaving.value = true
  try {
    const res = await createSupplier({ name: quickSupplierName.value.trim() })
    quickAddSupplierVisible.value = false
    const sRes = await getSupplierList({ list_rows: 500 })
    supplierOptions.value = sRes.data?.rows ?? []
    const newId = res?.data?.id ?? res?.data
    if (newId) { fd.supplier_id = newId; onSupplierChange(newId) }
    ElMessage.success(t('finance.payReceiptNew.msgSupplierAddSuccess'))
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.payReceiptNew.msgSaveFailed'))
  } finally {
    quickSaving.value = false
  }
}

// 新增资金账户
const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

function openAddFund() {
  fundForm.name = ''; fundForm.balance = 0
  addFundVisible.value = true
}

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning(t('finance.payReceiptNew.msgFundNameRequired')); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('finance.payReceiptNew.msgFundAddSuccess'))
    addFundVisible.value = false
    await loadFunds()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('finance.payReceiptNew.msgSaveFailed'))
  } finally {
    addFundLoading.value = false
  }
}

// 键盘快捷键
function onKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave() }
}

onMounted(async () => {
  window.addEventListener('keydown', onKeydown)
  const [sRes] = await Promise.all([
    getSupplierList({ list_rows: 500 }),
    loadFunds(),
  ])
  supplierOptions.value = sRes.data?.rows ?? []

  // 如果从应付账款页面带参数跳转过来，预填供应商
  if (route.query.supplier_id !== undefined || route.query.supplier_name) {
    const rawId = Number(route.query.supplier_id || 0)
    const rawName = String(route.query.supplier_name || '')
    fd.un_pay_amount = Number(route.query.un_pay_amount || 0)
    // supplier_id 有效时直接用；为 0 时按名字回查；仍找不到置 null（避免显示 "0"）
    if (rawId > 0) {
      fd.supplier_id = rawId
      fd.supplier_name = rawName
    } else if (rawName) {
      const found = supplierOptions.value.find((s: any) => s.name === rawName)
      if (found) {
        fd.supplier_id = found.id
        fd.supplier_name = found.name
      } else {
        fd.supplier_id = null
        fd.supplier_name = rawName
      }
    }
  }
  // 预填付款账户（从欠款详情页选好后带过来）
  if (route.query.fund_id) {
    const fid = Number(route.query.fund_id)
    const fname = String(route.query.fund_name || '')
    payLines.value[0].fund_id = fid
    payLines.value[0].fund_name = fname || (fundOptions.value.find(f => f.id === fid)?.name ?? '')
  }
})
</script>

<style scoped>
.new-receipt-page {
  background: #f5f6f8;
  min-height: 100%;
  padding: 0;
}

.page-header {
  background: #fff;
  padding: 14px 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  margin-bottom: 16px;
}

.page-title {
  font-size: 16px;
  font-weight: 600;
  color: #1d1d1f;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.form-body {
  background: #fff;
  margin: 0 0 16px;
  padding: 20px 24px;
  border-radius: 10px;
}

.info-row {
  margin-bottom: 16px;
}

.field-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-wrap.required .field-label::before {
  content: '* ';
  color: #dc2626;
}

.field-label {
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  font-weight: 500;
}

.readonly-input :deep(.el-input__inner) {
  background: #f5f5f7;
  color: #1d1d1f;
  font-weight: 600;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  padding: 6px 0 10px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  margin-bottom: 10px;
}

/* 付款行表格 */
.pay-lines-table {
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 10px;
  overflow: hidden;
}

.pay-lines-header {
  display: grid;
  grid-template-columns: 40px 1fr 320px 40px;
  background: #f2f3f8;
  padding: 10px 12px;
  font-size: 13px;
  font-weight: 600;
  color: rgba(29,29,31,0.5);
  align-items: center;
  gap: 12px;
}

.pay-line-row {
  display: grid;
  grid-template-columns: 40px 1fr 320px 40px;
  padding: 8px 12px;
  border-top: 1px solid rgba(0,0,0,0.05);
  align-items: center;
  gap: 12px;
}

.line-index {
  text-align: center;
  font-size: 13px;
  color: rgba(29,29,31,0.35);
}

.col-account { flex: 1; }
.col-amount { width: 320px; }

.pay-line-total {
  display: grid;
  grid-template-columns: 40px 1fr 320px 40px;
  padding: 10px 12px;
  border-top: 1px solid rgba(0,0,0,0.06);
  background: #fafafa;
  font-size: 13px;
  font-weight: 600;
  gap: 12px;
}

.total-amount {
  font-size: 15px;
  font-weight: 700;
  color: #1d1d1f;
}
</style>
