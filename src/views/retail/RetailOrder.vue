<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getRetailOrderList"
          :batch-del-api="batchDelRetailOrders"
          export-file-name="零售订单" :params="searchForm"
          :export-columns="{ order_no: '订单编号', member_name: '会员名称', store_name: '门店', order_date: '日期', total_amount: '商品合计', discount_amount: '折扣', pay_amount: '实付金额', pay_method: '支付方式', status: '状态' }">
        <template #search>
          <el-input v-model="searchForm.order_no" placeholder="订单编号" clearable style="width:160px" />
          <el-input v-model="searchForm.member_name" placeholder="会员名称" clearable style="width:140px" />
          <el-select v-model="searchForm.store_id" placeholder="门店" clearable style="width:130px">
            <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
            style="width:230px" @change="onDateChange" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增订单</el-button>
        </template>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 48px 12px">
              <el-table :data="parseGoods(row.goods_info)" size="small" border style="width:100%">
                <el-table-column prop="goods_name" label="商品名称" min-width="140" />
                <el-table-column prop="unit_name" label="单位" width="70" align="center" />
                <el-table-column prop="num" label="数量" width="80" align="right" />
                <el-table-column label="单价" width="100" align="right">
                  <template #default="{ row: item }">¥{{ Number(item.price).toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="小计" width="100" align="right">
                  <template #default="{ row: item }">
                    <span style="color:#0071e3">¥{{ (Number(item.num) * Number(item.price)).toFixed(2) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单编号" min-width="160">
          <template #default="{ row }">{{ row.order_sn || `LS${(row.order_date || row.created_at || '').slice(0, 10).replace(/-/g, '')}${String(row.id).padStart(3,'0')}` }}</template>
        </el-table-column>
        <el-table-column prop="member_name" label="会员名称" min-width="100" />
        <el-table-column prop="store_name" label="门店" min-width="100" />
        <el-table-column prop="total_amount" label="商品合计" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="discount_amount" label="折扣" width="90" align="right">
          <template #default="{ row }">¥{{ Number(row.discount_amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="pay_amount" label="实付金额" width="110" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ Number(row.pay_amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pay_method" label="支付方式" width="100" align="center" />
        <el-table-column label="订单日期" width="160">
          <template #default="{ row }">{{ fmtDt(row.created_at || row.order_date) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : 'success'" size="small">
              {{ row.status === 0 ? '未审核' : '已审核' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleAudit(row, 1)">审核</el-button>
            <el-button v-else type="warning" link size="small" @click="handleAudit(row, 0)">反审核</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 新增订单抽屉 -->
    <el-drawer v-model="drawerVisible" title="新增零售订单" size="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px" style="padding:0 4px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="门店" prop="store_id">
              <el-select v-model="form.store_id" placeholder="选择门店（可选）" clearable filterable style="width:100%"
                @change="onStoreChange">
                <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员" prop="member_id">
              <el-select v-model="form.member_id" placeholder="选择会员（可选）" clearable filterable style="width:100%"
                @change="onMemberChange">
                <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} ${m.mobile}`" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单日期" prop="order_date">
              <el-date-picker v-model="form.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付方式" prop="pay_method">
              <el-select v-model="form.pay_method" style="width:100%">
                <el-option label="现金" value="cash" />
                <el-option label="微信" value="wechat" />
                <el-option label="支付宝" value="alipay" />
                <el-option label="会员余额" value="balance" />
                <el-option label="银行卡" value="card" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="备注" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 商品明细 -->
        <div style="margin:8px 0 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600;font-size:13px">商品明细</span>
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">添加商品</el-button>
        </div>
        <el-table :data="form.items" border size="small" empty-text="请添加商品">
          <el-table-column prop="goods_name" label="商品" min-width="130" />
          <el-table-column prop="unit_name" label="单位" width="70" align="center" />
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :min="1" size="small" controls-position="right"
                style="width:90px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" size="small"
                controls-position="right" style="width:100px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="90" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3">¥{{ (row.num * row.price).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column width="50" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link :icon="Delete" @click="form.items.splice($index,1); calcFormTotal()" />
            </template>
          </el-table-column>
        </el-table>

        <div style="display:flex;justify-content:flex-end;gap:20px;padding:10px 4px;font-size:13px">
          <span>合计：<b>¥{{ form.total_amount.toFixed(2) }}</b></span>
          <span>折扣：<el-input-number v-model="form.discount_amount" :min="0" :precision="2" size="small"
            controls-position="right" style="width:100px" @change="calcFormTotal" /></span>
          <span>实付：<b style="color:#dc2626;font-size:15px">¥{{ form.pay_amount.toFixed(2) }}</b></span>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-drawer>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getRetailOrderList, createRetailOrder, deleteRetailOrder, getMemberList, getStoreList } from '@/api/retail'
import http from '@/api/http'
import { RETAIL_FUND_NAME } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect, deleteRetailStockFlows } from '@/utils/stockEffect'
import { distributeRetailItems, normalizeRetailSettlement } from '@/utils/retailPricing'

function fmtDt(val: string) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const tableRef = ref<InstanceType<typeof ScTable>>()
const stockRefreshStore = useStockRefreshStore()
const searchForm = reactive<any>({ order_no: '', member_name: '', store_id: '' })
const dateRange = ref<any>(null)

function onDateChange(val: any) {
  if (val) { searchForm.start_date = val[0]; searchForm.end_date = val[1] }
  else { delete searchForm.start_date; delete searchForm.end_date }
}

// 门店列表
const storeList = ref<any[]>([])
// 会员列表
const memberList = ref<any[]>([])

onMounted(async () => {
  const [sr, mr] = await Promise.allSettled([
    getStoreList({ list_rows: 500 }),
    getMemberList({ list_rows: 500 }),
  ])
  if (sr.status === 'fulfilled') storeList.value = sr.value.data?.rows ?? []
  if (mr.status === 'fulfilled') memberList.value = mr.value.data?.rows ?? []
})

// 表单
const drawerVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const form = reactive({
  store_id: null as any, store_name: '',
  member_id: null as any, member_name: '',
  order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  pay_method: 'cash', remark: '',
  items: [] as any[],
  total_amount: 0, discount_amount: 0, pay_amount: 0,
})

function openForm() {
  Object.assign(form, {
    store_id: null, store_name: '',
    member_id: null, member_name: '',
    order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
    pay_method: 'cash', remark: '', items: [],
    total_amount: 0, discount_amount: 0, pay_amount: 0,
  })
  drawerVisible.value = true
}

function onStoreChange(id: any) {
  form.store_name = storeList.value.find(s => s.id === id)?.name ?? ''
}

function onMemberChange(id: any) {
  form.member_name = memberList.value.find(m => m.id === id)?.name ?? ''
}

function calcFormTotal() {
  const total = form.items.reduce((s: number, i: any) => s + i.num * i.price, 0)
  const settlement = normalizeRetailSettlement(total, total - (form.discount_amount || 0))
  form.total_amount = settlement.totalAmount
  form.discount_amount = settlement.discountAmount
  form.pay_amount = settlement.payAmount
}

async function generateRetailNo(): Promise<string> {
  const ymd = (form.order_date || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)).replace(/-/g, '')
  try {
    const res = await getRetailOrderList({ list_rows: 500, order_date: form.order_date })
    const rows: any[] = res.data?.rows ?? []
    let maxSeq = 0
    const prefix = `LS${ymd}`
    for (const r of rows) {
      const no = r.order_sn || ''
      if (no.startsWith(prefix)) {
        const seq = parseInt(no.slice(prefix.length), 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
  } catch {
    return `LS${ymd}001`
  }
}

async function handleSave() {
  if (!form.items.length) { ElMessage.warning('请添加商品'); return }
  saving.value = true
  try {
    const storeIdNum = Number(form.store_id)
    const memberIdNum = Number(form.member_id)
    const normalizedItems = (form.items || []).map((i: any) => {
      const goodsIdNum = Number(i.goods_id ?? i.id)
      const num = Number(i.num || 0)
      const price = Number(i.price || 0)
      return {
        ...i,
        goods_id: Number.isFinite(goodsIdNum) && goodsIdNum > 0 ? goodsIdNum : 0,
        num: Number.isFinite(num) && num > 0 ? num : 0,
        price: Number.isFinite(price) && price >= 0 ? price : 0,
      }
    })
    const settled = distributeRetailItems(normalizedItems, form.pay_amount)
    // 新建订单默认未审核 status=0，审核时再触发库存和财务
    await createRetailOrder({
      ...form,
      total_amount: settled.totalAmount,
      discount_amount: settled.discountAmount,
      pay_amount: settled.payAmount,
      store_id: Number.isFinite(storeIdNum) && storeIdNum > 0 ? storeIdNum : 0,
      member_id: Number.isFinite(memberIdNum) && memberIdNum > 0 ? memberIdNum : 0,
      pay_type: form.pay_method,
      status: 0,
      goods_info: JSON.stringify(settled.items),
      items: undefined,
    })
    ElMessage.success('保存成功，请审核后生效库存和财务')
    drawerVisible.value = false
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || '创建失败')
  } finally { saving.value = false }
}

async function deductRetailFund(amount: number) {
  if (amount <= 0) return
  const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
  const funds: any[] = fundRes.data?.rows ?? []
  const retailFund = funds.find((f: any) => f.name === RETAIL_FUND_NAME)
  if (retailFund) {
    const newBalance = Number(retailFund.balance || 0) - amount
    await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: newBalance })
  }
}

async function handleAudit(row: any, status: number) {
  const items = parseGoods(row.goods_info)
  const payAmount = Number(row.pay_amount || 0)
  if (status === 1) {
    await http.post('/retail/order/audit', { id: row.id, status: 1 })
    try { await retailStockEffect(items, 'deduct', row.id) } catch (e: any) { ElMessage.warning('库存扣减失败，请手动处理') }
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows ?? []
      const retailFund = funds.find((f: any) => f.name === RETAIL_FUND_NAME)
      if (retailFund) {
        await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: Number(retailFund.balance || 0) + payAmount })
      } else {
        await http.post('/finance/Fund/add', { name: RETAIL_FUND_NAME, type: 2, balance: payAmount, remark: '零售单自动累计' })
      }
    } catch (e: any) { ElMessage.warning('财务更新失败，请手动处理') }
    ElMessage.success('审核成功')
  } else {
    await http.post('/retail/order/audit', { id: row.id, status: 0 })
    try {
      const found = await deleteRetailStockFlows(row.id)
      if (!found) ElMessage.warning('未找到对应库存流水，库存未变动，请手动核查')
    } catch (e: any) { ElMessage.warning('库存还原失败，请手动处理') }
    try { await deductRetailFund(payAmount) } catch (e: any) { ElMessage.warning('财务回滚失败，请手动处理') }
    ElMessage.success('已反审核')
  }
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

async function handleDelete(row: any) {
  if (row.status === 1) { ElMessage.warning('请先反审核再删除'); return }
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteRetailOrder(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function batchDelRetailOrders({ ids }: { ids: number[] }) {
  const rows: any[] = tableRef.value?.selectedRows ?? []
  const auditedRows = rows.filter((r: any) => r.status === 1)
  if (auditedRows.length) {
    const totalPay = auditedRows.reduce((s: number, r: any) => s + Number(r.pay_amount || 0), 0)
    try {
      await deductRetailFund(totalPay)
    } catch (e: any) {
      console.warn('零售账户余额回滚失败', e?.message)
    }
    for (const row of auditedRows) {
      try {
        await deleteRetailStockFlows(row.id)
      } catch { /* ignore */ }
    }
    stockRefreshStore.trigger()
  }
  return http.post('/retail/order/batchDel', { ids })
}

async function retailStockEffect(items: any[], mode: 'deduct' | 'restore', orderId?: number) {
  const remark = mode === 'deduct' ? (orderId ? `零售出库#${orderId}` : '零售出库') : '零售退货入库'
  await stockEffect(items, mode, undefined, remark)
}

function parseGoods(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  try { return JSON.parse(info) } catch { return [] }
}

const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (form.items.some((i: any) => i.goods_id === g.id)) continue
    form.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      unit_name: g.unit_name || '', price: Number(g.sell_price) || 0, cost_price: Number(g.cost_price || 0), num: 1 })
  }
  calcFormTotal()
}
</script>

<style scoped>
.page-container {}
</style>
