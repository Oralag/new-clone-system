<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getRetailOrderList"
          :batch-del-api="batchDelRetailOrders"
          export-file-name="零售订单" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.order_no" placeholder="订单编号" clearable style="width:160px" />
          <el-input v-model="searchForm.member_name" placeholder="会员名称" clearable style="width:140px" />
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
            style="width:230px" @change="onDateChange" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增订单</el-button>
        </template>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="order_no" label="订单编号" min-width="160" />
        <el-table-column prop="member_name" label="会员名称" min-width="120" />
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
        <el-table-column prop="order_date" label="订单日期" width="110" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
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
import { getRetailOrderList, createRetailOrder, deleteRetailOrder, getMemberList } from '@/api/retail'
import http from '@/api/http'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({ order_no: '', member_name: '' })
const dateRange = ref<any>(null)

function onDateChange(val: any) {
  if (val) { searchForm.start_date = val[0]; searchForm.end_date = val[1] }
  else { delete searchForm.start_date; delete searchForm.end_date }
}

// 会员列表
const memberList = ref<any[]>([])
onMounted(async () => {
  const res = await getMemberList({ list_rows: 500 })
  memberList.value = res.data?.rows ?? []
})

// 表单
const drawerVisible = ref(false)
const saving = ref(false)
const formRef = ref()
const form = reactive({
  member_id: null as any, member_name: '',
  order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  pay_method: 'cash', remark: '',
  items: [] as any[],
  total_amount: 0, discount_amount: 0, pay_amount: 0,
})

function openForm() {
  Object.assign(form, {
    member_id: null, member_name: '', order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
    pay_method: 'cash', remark: '', items: [],
    total_amount: 0, discount_amount: 0, pay_amount: 0,
  })
  drawerVisible.value = true
}

function onMemberChange(id: any) {
  form.member_name = memberList.value.find(m => m.id === id)?.name ?? ''
}

function calcFormTotal() {
  form.total_amount = form.items.reduce((s: number, i: any) => s + i.num * i.price, 0)
  form.pay_amount = Math.max(0, form.total_amount - (form.discount_amount || 0))
}

async function handleSave() {
  if (!form.items.length) { ElMessage.warning('请添加商品'); return }
  saving.value = true
  try {
    await createRetailOrder({ ...form, goods_info: JSON.stringify(form.items), items: undefined })
    // 零售收款自动写入"零售收款账户"
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows ?? []
      const retailFund = funds.find((f: any) => f.name === '零售收款账户')
      if (retailFund) {
        const newBalance = Number(retailFund.balance || 0) + Number(form.pay_amount)
        await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: newBalance })
      } else {
        await http.post('/finance/Fund/add', { name: '零售收款账户', type: 2, balance: Number(form.pay_amount), remark: '零售单自动累计' })
      }
    } catch (e: any) {
      console.warn('零售账户更新失败', e?.message)
    }
    ElMessage.success('保存成功')
    drawerVisible.value = false
    tableRef.value?.refresh()
  } finally { saving.value = false }
}

async function deductRetailFund(amount: number) {
  if (amount <= 0) return
  const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
  const funds: any[] = fundRes.data?.rows ?? []
  const retailFund = funds.find((f: any) => f.name === '零售收款账户')
  if (retailFund) {
    const newBalance = Math.max(0, Number(retailFund.balance || 0) - amount)
    await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: newBalance })
  }
}

async function handleDelete(row: any) {
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  try {
    await deductRetailFund(Number(row.pay_amount || 0))
  } catch (e: any) {
    console.warn('零售账户余额回滚失败', e?.message)
  }
  await deleteRetailOrder(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function batchDelRetailOrders({ ids }: { ids: number[] }) {
  const rows: any[] = tableRef.value?.selectedRows ?? []
  const totalPay = rows.reduce((s: number, r: any) => s + Number(r.pay_amount || 0), 0)
  try {
    await deductRetailFund(totalPay)
  } catch (e: any) {
    console.warn('零售账户余额回滚失败', e?.message)
  }
  return http.post('/retail/order/batchDel', { ids })
}

// 商品选择器
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (form.items.some((i: any) => i.goods_id === g.id)) continue
    form.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      unit_name: g.unit_name || '', price: Number(g.sell_price) || 0, num: 1 })
  }
  calcFormTotal()
}
</script>

<style scoped>
.page-container {}
</style>
