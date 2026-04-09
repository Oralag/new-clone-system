<template>
  <div class="new-receipt-page">
    <!-- 页面标题栏 -->
    <div class="page-header">
      <span class="page-title">新增付款单</span>
      <div class="header-actions">
        <el-button @click="router.back()">返回</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">
          保存 (Ctrl+S)
        </el-button>
      </div>
    </div>

    <div class="form-body">
      <!-- 基本信息行 -->
      <el-row :gutter="24" class="info-row">
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">付款单号</label>
            <el-input v-model="fd.order_sn" placeholder="付款单号（留空自动生成）" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">付款日期</label>
            <el-date-picker v-model="fd.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="info-row">
        <el-col :span="8">
          <div class="field-wrap required">
            <label class="field-label">供应商</label>
            <div style="display:flex;gap:6px">
              <el-select
                v-model="fd.supplier_id"
                placeholder="请选择供应商"
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
            <label class="field-label">预付款</label>
            <el-input :value="fmt(fd.prepay)" readonly class="readonly-input" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">当前欠款</label>
            <el-input :value="fmt(fd.un_pay_amount)" readonly class="readonly-input" />
          </div>
        </el-col>
      </el-row>

      <!-- 付款明细表 -->
      <div class="section-title">
        <span>付款</span>
      </div>
      <div class="pay-lines-table">
        <div class="pay-lines-header">
          <el-button type="primary" :icon="Plus" size="small" circle @click="addLine" />
          <span class="col-account">付款账户</span>
          <span class="col-amount">付款金额</span>
        </div>
        <div v-for="(line, idx) in payLines" :key="idx" class="pay-line-row">
          <span class="line-index">{{ idx + 1 }}</span>
          <div class="col-account">
            <div style="display:flex;gap:6px;align-items:center">
              <el-select v-model="line.fund_id" placeholder="选择付款账户" filterable clearable style="flex:1" @change="(v) => onFundChange(v, line)">
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
          <span>合计</span>
          <span></span>
          <span class="total-amount">{{ fmt(linesTotal) }}</span>
        </div>
      </div>

      <!-- 下方字段 -->
      <el-row :gutter="24" class="info-row" style="margin-top:16px">
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">优惠金额</label>
            <el-input-number v-model="fd.discount_amount" :min="0" :precision="2" :controls="false" style="width:100%" placeholder="优惠金额" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">合计金额</label>
            <el-input :value="fmt(linesTotal)" readonly class="readonly-input" />
          </div>
        </el-col>
        <el-col :span="8">
          <div class="field-wrap">
            <label class="field-label">预付款抵扣</label>
            <el-input-number v-model="fd.prepay_deduct" :min="0" :precision="2" :controls="false" style="width:100%">
              <template #suffix>
                <span style="font-size:11px;color:#dc2626">注意: 多收的金额将会自动转为供应商预付款</span>
              </template>
            </el-input-number>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="info-row">
        <el-col :span="24">
          <div class="field-wrap">
            <label class="field-label">付款单据核销</label>
            <el-radio-group v-model="fd.verify_type">
              <el-radio value="manual">手动核销</el-radio>
              <el-radio value="auto">自动核销</el-radio>
            </el-radio-group>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="24" class="info-row">
        <el-col :span="12">
          <div class="field-wrap">
            <label class="field-label">备注</label>
            <el-input v-model="fd.remark" type="textarea" :rows="3" placeholder="备注" />
          </div>
        </el-col>
        <el-col :span="6">
          <div class="field-wrap">
            <label class="field-label">附件</label>
            <el-button :icon="UploadFilled" type="default">选择文件</el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 快速新增供应商 -->
    <el-dialog v-model="quickAddSupplierVisible" title="快速新增供应商" width="360px" append-to-body>
      <el-form label-width="70px">
        <el-form-item label="名称" required>
          <el-input v-model="quickSupplierName" placeholder="请输入供应商名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddSupplierVisible = false">取消</el-button>
        <el-button type="primary" :loading="quickSaving" @click="confirmQuickSupplier">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户 -->
    <el-dialog v-model="addFundVisible" title="新增资金账户" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item label="账户名称">
          <el-input v-model="fundForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="初始余额">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">取消</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">确认新增</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Delete, UploadFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { createPayReceipt, getFundList, createFund } from '@/api/finance'
import { getSupplierList, createSupplier } from '@/api/procure'

const router = useRouter()
const route = useRoute()

function fmt(v: any) { return Number(v || 0).toFixed(2) }

// 从路由参数读采购单信息（从应付款页面跳转时携带）
const routeOrderId = Number(route.query.order_id || 0)
const routeOrderNo = String(route.query.order_no || '')

// 初始化时从路由参数读供应商信息
const fd = reactive({
  order_sn: routeOrderNo,
  pay_date: new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10),
  supplier_id: null as any,
  supplier_name: '',
  prepay: 0,
  un_pay_amount: Number(route.query.un_pay_amount || 0),
  discount_amount: 0,
  prepay_deduct: 0,
  verify_type: 'auto',
  remark: routeOrderId ? `采购单付款 #${routeOrderId}` : '',
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
  if (!fd.supplier_id) { ElMessage.warning('请选择供应商'); return }
  if (linesTotal.value <= 0) { ElMessage.warning('请填写付款金额'); return }
  if (validPayLines.value.some(line => !line.fund_id)) {
    ElMessage.warning('请为每一条付款明细选择付款账户')
    return
  }

  saving.value = true
  try {
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
    }
    ElMessage.success(totalLines > 1 ? `已按付款账户拆分保存 ${totalLines} 笔付款单` : '付款单保存成功')
    router.back()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

// 快速新增供应商
const quickAddSupplierVisible = ref(false)
const quickSaving = ref(false)
const quickSupplierName = ref('')

async function confirmQuickSupplier() {
  if (!quickSupplierName.value.trim()) { ElMessage.warning('请输入名称'); return }
  quickSaving.value = true
  try {
    const res = await createSupplier({ name: quickSupplierName.value.trim() })
    quickAddSupplierVisible.value = false
    const sRes = await getSupplierList({ list_rows: 500 })
    supplierOptions.value = sRes.data?.rows ?? []
    const newId = res?.data?.id ?? res?.data
    if (newId) { fd.supplier_id = newId; onSupplierChange(newId) }
    ElMessage.success('新增成功')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '失败')
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
  if (!fundForm.name.trim()) { ElMessage.warning('请输入账户名称'); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success('新增账户成功')
    addFundVisible.value = false
    await loadFunds()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '失败')
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
  if (route.query.supplier_id) {
    fd.supplier_id = Number(route.query.supplier_id)
    fd.supplier_name = String(route.query.supplier_name || '')
    fd.un_pay_amount = Number(route.query.un_pay_amount || 0)
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
