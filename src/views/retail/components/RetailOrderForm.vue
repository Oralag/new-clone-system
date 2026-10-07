<template>
    <el-drawer v-model="drawerVisible" :title="editId ? $t('retail.retailOrder.drawerEditTitle') : $t('retail.retailOrder.drawerAddTitle')" size="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px" style="padding:0 4px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formStore')" prop="store_id">
              <el-select v-model="form.store_id" :placeholder="$t('retail.retailOrder.formStorePlaceholder')" clearable filterable style="width:100%"
                @change="onStoreChange">
                <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formMember')" prop="member_id">
              <el-select v-model="form.member_id" :placeholder="$t('retail.retailOrder.formMemberPlaceholder')" clearable filterable style="width:100%"
                @change="onMemberChange">
                <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} ${m.mobile}`" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formOrderDate')" prop="order_date">
              <el-date-picker v-model="form.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formPayMethod')" prop="pay_method">
              <el-select v-model="form.pay_method" style="width:100%">
                <el-option :label="$t('retail.retailOrder.payMethodCash')" value="cash" />
                <el-option :label="$t('retail.retailOrder.payMethodWechat')" value="wechat" />
                <el-option :label="$t('retail.retailOrder.payMethodAlipay')" value="alipay" />
                <el-option :label="$t('retail.retailOrder.payMethodBalance')" value="balance" />
                <el-option :label="$t('retail.retailOrder.payMethodCard')" value="card" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formRemark')">
              <el-input v-model="form.remark" :placeholder="$t('retail.retailOrder.formRemarkPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Goods section -->
        <div style="margin:8px 0 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600;font-size:13px">{{ $t('retail.retailOrder.formGoodsSection') }}</span>
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('retail.retailOrder.formAddGoods') }}</el-button>
        </div>
        <el-table :data="form.items" border size="small" :empty-text="$t('retail.retailOrder.formEmptyGoods')">
          <el-table-column prop="goods_name" :label="$t('retail.retailOrder.colGoodsName')" min-width="130" />
          <el-table-column prop="unit_name" :label="$t('retail.retailOrder.colUnit')" width="70" align="center" />
          <el-table-column :label="$t('retail.retailOrder.colQty')" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :min="1" size="small" controls-position="right"
                style="width:90px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('retail.retailOrder.colUnitPrice')" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" size="small"
                controls-position="right" style="width:100px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('retail.retailOrder.colSubtotal')" width="90" align="right">
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
          <span>{{ $t('retail.retailOrder.formTotal') }}：<b>¥{{ form.total_amount.toFixed(2) }}</b></span>
          <span>{{ $t('retail.retailOrder.formDiscount') }}：<el-input-number v-model="form.discount_amount" :precision="2" size="small"
            controls-position="right" style="width:100px" @change="calcFormTotal" /></span>
          <span>{{ $t('retail.retailOrder.formPaid') }}：<b style="color:#dc2626;font-size:15px">¥{{ form.pay_amount.toFixed(2) }}</b></span>
        </div>

        <!-- Additional fees -->
        <div style="margin-top:4px;border-top:1px dashed #e5e7eb;padding-top:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ $t('retail.retailOrder.formFeeSection') }}</span>
            <el-button type="primary" link size="small" :icon="Plus" @click="form.fee_items.push({ name: '运费', amount: 0, bearer: 'buyer' })">{{ $t('retail.retailOrder.formAddFee') }}</el-button>
          </div>
          <div v-for="(fee, idx) in form.fee_items" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <el-select v-model="fee.name" size="small" style="width:120px" filterable allow-create default-first-option :placeholder="$t('retail.retailOrder.formFeeTypePlaceholder')">
              <el-option :label="$t('retail.retailOrder.formFeeShipping')" value="运费" />
              <el-option :label="$t('retail.retailOrder.formFeeHandling')" value="装卸费" />
              <el-option :label="$t('retail.retailOrder.formFeeInspection')" value="检测费" />
              <el-option :label="$t('retail.retailOrder.formFeePackaging')" value="包装费" />
              <el-option :label="$t('retail.retailOrder.formFeeStorage')" value="仓储费" />
              <el-option :label="$t('retail.retailOrder.formFeeOther')" value="其他费用" />
            </el-select>
            <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:110px" :placeholder="$t('retail.retailOrder.formFeeAmountPlaceholder')" />
            <span style="font-size:12px;color:rgba(29,29,31,0.5);width:70px">{{ $t('retail.retailOrder.formFeeOurBear') }}</span>
            <el-button type="danger" link :icon="Delete" size="small" @click="form.fee_items.splice(idx, 1)" />
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">{{ $t('retail.retailOrder.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('retail.retailOrder.save') }}</el-button>
      </template>
    </el-drawer>
    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { createRetailOrder, updateRetailOrder, getMemberList, getStoreList } from '@/api/retail'
import { distributeRetailItems, normalizeRetailSettlement } from '@/utils/retailPricing'

// Shared create/edit drawer for retail orders (零售单页 + 展会管理).
const emit = defineEmits<{ (e: 'saved', payload: { id: number; feeItems: { name: string; amount: number; bearer: string }[] }): void }>()
const { t } = useI18n()
const today = () => new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)

const storeList = ref<any[]>([])
const memberList = ref<any[]>([])
let listsLoaded = false
async function loadLists() {
  if (listsLoaded) return
  const [sr, mr] = await Promise.allSettled([
    getStoreList({ list_rows: 500 }),
    getMemberList({ list_rows: 500 }),
  ])
  if (sr.status === 'fulfilled') storeList.value = sr.value.data?.rows ?? []
  if (mr.status === 'fulfilled') memberList.value = mr.value.data?.rows ?? []
  listsLoaded = sr.status === 'fulfilled' && mr.status === 'fulfilled'
}

const drawerVisible = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)
const formRef = ref()
const form = reactive({
  exhibition_id: 0,
  store_id: null as any, store_name: '',
  member_id: null as any, member_name: '',
  order_date: today(),
  pay_method: 'cash', remark: '',
  items: [] as any[],
  total_amount: 0, discount_amount: 0, pay_amount: 0,
  fee_items: [] as { name: string; amount: number; bearer: string }[],
})

function parseGoods(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  try { return JSON.parse(info) } catch { return [] }
}

function open(row?: any, defaults: { exhibition_id?: number; order_date?: string } = {}) {
  loadLists()
  editId.value = row?.id ?? null
  if (row) {
    // 编辑模式：回填已有数据，用 parseGoods 兼容字符串和数组两种格式
    const rawItems = parseGoods(row.goods_info)
    let parsedFeeItems: any[] = []
    try { parsedFeeItems = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { parsedFeeItems = [] }
    Object.assign(form, {
      // 保留原展会归属，编辑不能把展会单变成日常零售
      exhibition_id: Number(row.exhibition_id || 0),
      store_id: row.store_id || null,
      store_name: row.store_name || '',
      member_id: row.member_id || null,
      member_name: row.member_name || '',
      order_date: row.order_date ? String(row.order_date).slice(0, 10) : today(),
      pay_method: row.pay_type || row.pay_method || 'cash',
      remark: row.remark || '',
      items: rawItems.map((i: any) => ({
        goods_id: i.goods_id ?? i.id,
        goods_name: i.goods_name || i.name || '',
        goods_sn: i.goods_sn || '',
        unit_name: i.unit_name || '',
        cost_price: Number(i.cost_price || 0),
        num: Number(i.num || i.qty || 1),
        price: Number(i.price || i.sell_price || 0),
      })),
      total_amount: Number(row.total_amount || 0),
      discount_amount: Number(row.discount_amount || 0),
      pay_amount: Number(row.pay_amount || 0),
      fee_items: parsedFeeItems,
    })
  } else {
    Object.assign(form, {
      exhibition_id: Number(defaults.exhibition_id || 0),
      store_id: null, store_name: '',
      member_id: null, member_name: '',
      order_date: defaults.order_date || today(),
      pay_method: 'cash', remark: '', items: [],
      total_amount: 0, discount_amount: 0, pay_amount: 0,
      fee_items: [],
    })
  }
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

async function handleSave() {
  if (!form.items.length) { ElMessage.warning(t('retail.retailOrder.warnAddGoods')); return }
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
    const cleanFeeItems = form.fee_items
      .map(f => ({ name: String(f.name || '').trim(), amount: Number(f.amount || 0), bearer: f.bearer || 'buyer' }))
      .filter(f => f.name && f.amount > 0)
    const payload = {
      store_id: Number.isFinite(storeIdNum) && storeIdNum > 0 ? storeIdNum : 0,
      store_name: form.store_name || '',
      member_id: Number.isFinite(memberIdNum) && memberIdNum > 0 ? memberIdNum : 0,
      member_name: form.member_name || '',
      order_date: form.order_date,
      pay_type: form.pay_method,
      remark: form.remark || '',
      total_amount: settled.totalAmount,
      discount_amount: settled.discountAmount,
      pay_amount: settled.payAmount,
      status: 0,
      goods_info: JSON.stringify(settled.items),
      fee_items: JSON.stringify(cleanFeeItems),
      exhibition_id: Number(form.exhibition_id || 0),
    }
    let id = 0
    if (editId.value) {
      await updateRetailOrder({ ...payload, id: editId.value })
      id = editId.value
      ElMessage.success(t('retail.retailOrder.editSuccess'))
    } else {
      const createRes = await createRetailOrder(payload)
      id = Number(createRes?.data?.id || createRes?.data?.rows?.id || 0)
      ElMessage.success(t('retail.retailOrder.saveSuccess'))
    }
    drawerVisible.value = false
    emit('saved', { id, feeItems: cleanFeeItems })
  } catch (e: any) {
    ElMessage.error(e?.message || 'Save failed')
  } finally { saving.value = false }
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

defineExpose({ open })
</script>
