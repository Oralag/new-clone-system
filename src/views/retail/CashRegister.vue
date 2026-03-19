<template>
  <div class="cr-shell">

    <!-- ── 顶栏 ── -->
    <div class="cr-topbar">
      <div class="cr-home-btn" @click="$router.push('/dashboard')" title="返回首页">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M6 15v-5h4v5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
        <span class="cr-home-text">返回首页</span>
      </div>
      <div class="cr-brand">
        <div class="cr-brand-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#crbg)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="crbg" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="cr-brand-name">数字游牧收银台</span>
      </div>
      <div class="cr-top-right">
        <!-- 克重计算器按钮 -->
        <div class="cr-calc-btn" @click="openWeightCalc()" title="散装计价">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>
          <span class="cr-calc-text">克重计算</span>
        </div>
        <el-select
          v-model="selectedMemberId"
          placeholder="会员登录"
          clearable
          filterable
          size="small"
          class="cr-member-select"
          @change="onMemberChange"
        >
          <el-option v-for="m in memberList" :key="m.id"
            :label="`${m.name}  ${m.mobile}`" :value="m.id" />
        </el-select>
        <div class="cr-search-box">
          <el-icon class="cr-search-icon"><Search /></el-icon>
          <input
            ref="searchInputRef"
            v-model="keyword"
            class="cr-search-input"
            placeholder="请输入条码/商品首字母缩写"
            @input="onSearch"
            @keydown.enter="onBarcodeEnter"
          />
          <div class="cr-scan-icon" title="条形码扫描" @click="focusSearch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
              <rect x="3" y="16" width="5" height="5"/>
              <path d="M16 16h2v2M16 19h2M19 16v2M16 22h2M19 19v2h2M22 16h-1M22 22h-2"/>
            </svg>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 手机端：购物车抽屉遮罩 ── -->
    <div class="cr-drawer-mask" v-if="cartDrawerOpen" @click="cartDrawerOpen = false" />

    <!-- ── 手机端：购物车底部抽屉 ── -->
    <div class="cr-cart-drawer" :class="{ open: cartDrawerOpen }">
      <div class="cr-drawer-handle" @click="cartDrawerOpen = !cartDrawerOpen">
        <div class="cr-drawer-grip" />
      </div>
      <div class="cr-drawer-inner">
        <div class="cr-drawer-header">
          <span class="cr-drawer-title">购物车</span>
          <div class="cr-drawer-actions">
            <div class="cr-action-btn" @click="() => {}">存单</div>
            <div class="cr-action-btn" @click="() => {}">取单</div>
            <div class="cr-action-btn danger" @click="clearCart">清空</div>
          </div>
        </div>
        <div class="cr-drawer-list">
          <div v-if="cartItems.length === 0" class="cr-drawer-empty">
            <span>🛒</span> 还没有商品，点击下方商品加入
          </div>
          <div v-for="(item, idx) in cartItems" :key="idx" class="cr-cart-item">
            <div class="cr-cart-item-top">
              <span class="cr-cart-item-name">{{ item.goods_name }}</span>
              <el-button type="danger" link size="small" :icon="Delete"
                @click="cartItems.splice(idx,1); calcTotal()" />
            </div>
            <div class="cr-cart-item-bottom">
              <div class="cr-qty-ctrl">
                <button class="cr-qty-btn" @click="changeQty(idx,-1)">−</button>
                <el-input-number v-model="item.num" :min="1" :precision="0"
                  controls-position="right" size="small" style="width:64px"
                  @change="calcTotal" />
                <button class="cr-qty-btn" @click="changeQty(idx,1)">+</button>
              </div>
              <span class="cr-cart-item-sub">¥{{ (item.num * item.price).toFixed(2) }}</span>
            </div>
          </div>
        </div>
        <!-- 汇总 + 支付 -->
        <div class="cr-settle cr-drawer-settle">
          <div class="cr-settle-row">
            <span>商品合计</span>
            <span>¥{{ totalAmount.toFixed(2) }}</span>
          </div>
          <div class="cr-settle-row">
            <span>折扣</span>
            <el-input-number v-model="discountAmount" :min="0" :max="totalAmount" :precision="2"
              controls-position="right" size="small" style="width:100px" @change="calcPay" />
          </div>
          <div class="cr-pay-methods">
            <div v-for="m in payMethods" :key="m.value" class="cr-pay-btn"
              :class="{ active: payMethod === m.value }" @click="payMethod = m.value">
              {{ m.label }}
            </div>
          </div>
          <button class="cr-checkout-btn" :disabled="!cartItems.length || paying"
            @click="handleCheckout">
            <span v-if="paying">处理中…</span>
            <span v-else>结&nbsp;&nbsp;算&nbsp;&nbsp;¥{{ payAmount.toFixed(2) }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── 手机端：底部悬浮购物车栏 ── -->
    <div class="cr-float-bar" @click="cartItems.length && (cartDrawerOpen = !cartDrawerOpen)">
      <div class="cr-float-cart-icon" :class="{ 'has-items': cartItems.length }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
        <span v-if="cartItems.length" class="cr-float-badge">{{ cartItems.length }}</span>
      </div>
      <div class="cr-float-info">
        <span v-if="!cartItems.length" class="cr-float-empty">点击商品加入购物车</span>
        <span v-else class="cr-float-total">¥{{ payAmount.toFixed(2) }}</span>
        <span v-if="cartItems.length" class="cr-float-count">共 {{ cartItems.reduce((s,i)=>s+i.num,0) }} 件</span>
      </div>
      <button v-if="cartItems.length" class="cr-float-checkout" :disabled="paying"
        @click.stop="handleCheckout">
        {{ paying ? '处理中' : '结算' }}
      </button>
    </div>

    <!-- ── 主体 ── -->
    <div class="cr-body">
      <div class="cr-card">

        <!-- 左：购物车（桌面端） -->
        <div class="cr-left">
          <div class="cr-left-actions">
            <div class="cr-action-btn" @click="() => {}">存单</div>
            <div class="cr-action-btn" @click="() => {}">取单</div>
            <div class="cr-action-btn danger" @click="clearCart">清空</div>
          </div>
          <div class="cr-cart-area">
            <div v-if="cartItems.length === 0" class="cr-cart-empty">
              <div class="cr-empty-icon">🛒</div>
              <div class="cr-empty-text">扫码/点选右侧商品，加入购物车结账</div>
            </div>
            <div v-else class="cr-cart-list">
              <div v-for="(item, idx) in cartItems" :key="idx" class="cr-cart-item">
                <div class="cr-cart-item-top">
                  <span class="cr-cart-item-name">{{ item.goods_name }}</span>
                  <el-button type="danger" link size="small" :icon="Delete"
                    @click="cartItems.splice(idx,1); calcTotal()" />
                </div>
                <div class="cr-cart-item-bottom">
                  <div class="cr-qty-ctrl">
                    <button class="cr-qty-btn" @click="changeQty(idx,-1)">−</button>
                    <el-input-number v-model="item.num" :min="1" :precision="0"
                      controls-position="right" size="small" style="width:64px"
                      @change="calcTotal" />
                    <button class="cr-qty-btn" @click="changeQty(idx,1)">+</button>
                  </div>
                  <span class="cr-cart-item-sub">¥{{ (item.num * item.price).toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 汇总 + 支付 -->
          <div class="cr-settle">
            <div class="cr-settle-row">
              <span>商品合计</span>
              <span>¥{{ totalAmount.toFixed(2) }}</span>
            </div>
            <div class="cr-settle-row">
              <span>折扣</span>
              <el-input-number v-model="discountAmount" :min="0" :max="totalAmount" :precision="2"
                controls-position="right" size="small" style="width:100px" @change="calcPay" />
            </div>
            <div class="cr-pay-methods">
              <div v-for="m in payMethods" :key="m.value" class="cr-pay-btn"
                :class="{ active: payMethod === m.value }" @click="payMethod = m.value">
                {{ m.label }}
              </div>
            </div>
            <button class="cr-checkout-btn" :disabled="!cartItems.length || paying"
              @click="handleCheckout">
              <span v-if="paying">处理中…</span>
              <span v-else>结&nbsp;&nbsp;算&nbsp;&nbsp;¥{{ payAmount.toFixed(2) }}</span>
            </button>
          </div>
        </div>

        <!-- 右：分类 + 商品 -->
        <div class="cr-right">
          <div class="cr-cate-bar">
            <div class="cr-cate-tab" :class="{ active: activeCate === 'hot' }"
              @click="activeCate = 'hot'; loadHotGoods()">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:3px"><path d="M12 2c0 0-6 6-6 12a6 6 0 0012 0c0-6-6-12-6-12z"/></svg>
              热销产品
            </div>
            <div class="cr-cate-tab" :class="{ active: activeCate === '' }"
              @click="activeCate = ''; loadGoods()">全部分类</div>
            <div v-for="c in cateList" :key="c.id" class="cr-cate-tab"
              :class="{ active: activeCate === c.id }"
              @click="activeCate = c.id; loadGoods()">
              {{ c.name }}
            </div>
          </div>

          <div class="cr-goods-grid" v-loading="goodsLoading">
            <div v-for="g in goodsList" :key="g.id" class="cr-goods-card"
              @click="selectGoods(g)">
              <div class="cr-goods-name">{{ g.goods_name }}</div>
              <div class="cr-goods-prices">
                <span class="cr-goods-price">¥{{ Number(g.sell_price).toFixed(2) }}</span>
                <span v-if="Number(g.member_price) > 0" class="cr-goods-member-price">
                  ¥{{ Number(g.member_price).toFixed(2) }}会员价
                </span>
              </div>
            </div>
            <div v-if="!goodsLoading && goodsList.length === 0" class="cr-goods-empty">
              暂无商品
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 结算成功弹框 -->
    <el-dialog v-model="successVisible" title="结算成功" width="360px" align-center>
      <div style="text-align:center;padding:16px 0">
        <el-icon style="font-size:56px;color:#16a34a"><CircleCheckFilled /></el-icon>
        <div style="font-size:26px;font-weight:700;margin:14px 0 6px;color:#1d1d1f">
          ¥{{ lastPayAmount.toFixed(2) }}
        </div>
        <div style="color:rgba(29,29,31,0.35);font-size:13px">订单号：{{ lastOrderNo }}</div>
      </div>
      <template #footer>
        <el-button type="primary" style="width:100%" @click="successVisible = false; clearCart()">
          继续收银
        </el-button>
      </template>
    </el-dialog>

    <!-- 克重计算器 -->
    <el-dialog v-model="weightCalcVisible" title="散装克重计价" width="340px" align-center>
      <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0">
        <!-- 当前商品信息 -->
        <div v-if="wcGoodsName" style="background:#f8fafc;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:#1e293b">{{ wcGoodsName }}</span>
          <span style="font-size:13px;color:#2563eb;font-weight:700">¥{{ wcPricePerJin }}/斤</span>
        </div>
        <!-- 无商品时提示 -->
        <div v-else style="font-size:12px;color:#94a3b8;text-align:center">
          请从右侧商品列表选择散装产品
        </div>
        <!-- 模式切换 -->
        <div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <div @click="wcMode='weight'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='weight' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            输入克数
          </div>
          <div @click="wcMode='amount'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='amount' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            输入金额
          </div>
        </div>
        <!-- 输入框 -->
        <div style="display:flex;align-items:center;gap:12px">
          <span style="width:64px;font-size:13px;color:#64748b;flex-shrink:0">
            {{ wcMode === 'weight' ? '称重（克）' : '金额（元）' }}
          </span>
          <el-input-number v-if="wcMode==='weight'" v-model="wcWeightGrams"
            :min="0" :precision="1" controls-position="right" style="flex:1" />
          <el-input-number v-else v-model="wcTargetAmount"
            :min="0" :precision="2" controls-position="right" style="flex:1" />
        </div>
        <!-- 结果展示 -->
        <div style="background:#f0f9ff;border-radius:10px;padding:14px;text-align:center">
          <template v-if="wcMode==='weight'">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">应付金额</div>
            <div style="font-size:28px;font-weight:700;color:#2563eb">¥{{ wcAmount.toFixed(2) }}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px">{{ wcWeightGrams }}克 ÷ 500 × ¥{{ wcPricePerJin }}/斤</div>
          </template>
          <template v-else>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">需要称重</div>
            <div style="font-size:28px;font-weight:700;color:#059669">{{ wcReverseGrams.toFixed(1) }} 克</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px">¥{{ wcTargetAmount }} ÷ ¥{{ wcPricePerJin }}/斤 × 500</div>
          </template>
        </div>
        <el-button type="primary"
          :disabled="(wcMode==='weight' ? wcAmount : wcTargetAmount) <= 0 || !wcGoodsName"
          @click="addWeightItemToCart" style="width:100%">
          加入购物车
        </el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Search, Delete, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getGoodsList, getGoodsCateList } from '@/api/goods'
import { getMemberList, createRetailOrder } from '@/api/retail'

// ── 商品 ──────────────────────────────────────────────────────────────────────
const keyword = ref('')
const activeCate = ref<any>('hot')
const goodsList = ref<any[]>([])
const goodsLoading = ref(false)
const selectedGoods = ref<any>(null)

// 手机端购物车抽屉
const cartDrawerOpen = ref(false)

// 点击商品卡片：选中高亮，同时加入购物车
function selectGoods(g: any) {
  selectedGoods.value = g
  addToCart(g)
}
const cateList = ref<any[]>([])
const searchInputRef = ref<HTMLInputElement>()
let searchTimer: any

async function loadGoods() {
  goodsLoading.value = true
  try {
    const res = await getGoodsList({
      keyword: keyword.value || undefined,
      cate_id: activeCate.value || undefined,
      status: 1,
      list_rows: 60,
    })
    goodsList.value = res.data?.rows ?? []
  } finally {
    goodsLoading.value = false
  }
}

// 热销产品：按销量或创建时间排序（取最新入库/常用商品）
async function loadHotGoods() {
  goodsLoading.value = true
  try {
    const res = await getGoodsList({ status: 1, list_rows: 30, sort: 'sell_count', order: 'desc' })
    let rows: any[] = res.data?.rows ?? []
    if (rows.length === 0) {
      // Fallback: just get all products
      const res2 = await getGoodsList({ status: 1, list_rows: 30 })
      rows = res2.data?.rows ?? []
    }
    goodsList.value = rows
  } finally {
    goodsLoading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (activeCate.value === 'hot') activeCate.value = ''
    loadGoods()
  }, 300)
}

function focusSearch() {
  searchInputRef.value?.focus()
}

// 条形码扫描：按回车键触发精准匹配
function onBarcodeEnter() {
  const code = keyword.value.trim()
  if (!code) return
  // Try exact barcode match from loaded goods
  const match = goodsList.value.find(g => g.goods_sn === code || g.barcode === code)
  if (match) {
    addToCart(match)
    keyword.value = ''
    ElMessage.success(`已添加：${match.goods_name}`)
    return
  }
  // Try search
  clearTimeout(searchTimer)
  loadGoods()
}

// ── 购物车 ────────────────────────────────────────────────────────────────────
interface CartItem { goods_id: number; goods_name: string; goods_sn: string; unit_name: string; price: number; num: number }

const cartItems = reactive<CartItem[]>([])
const totalAmount = ref(0)
const discountAmount = ref(0)
const payAmount = ref(0)

function addToCart(g: any) {
  const exist = cartItems.find(i => i.goods_id === g.id)
  if (exist) { exist.num++; calcTotal(); return }
  cartItems.push({
    goods_id: g.id,
    goods_name: g.goods_name,
    goods_sn: g.goods_sn || '',
    unit_name: g.unit_name || '',
    price: Number(g.sell_price) || 0,
    num: 1,
  })
  calcTotal()
  // 手机端：加入购物车后短暂提示，不自动跳转（让用户继续选商品）
}

function changeQty(idx: number, delta: number) {
  cartItems[idx].num = Math.max(1, cartItems[idx].num + delta)
  calcTotal()
}

function calcTotal() {
  totalAmount.value = cartItems.reduce((s, i) => s + i.num * i.price, 0)
  calcPay()
}

function calcPay() {
  payAmount.value = Math.max(0, totalAmount.value - (discountAmount.value || 0))
}

function clearCart() {
  cartItems.splice(0)
  discountAmount.value = 0
  totalAmount.value = 0
  payAmount.value = 0
  selectedMemberId.value = null
  selectedMember.value = null
}

// ── 会员 ──────────────────────────────────────────────────────────────────────
const memberList = ref<any[]>([])
const selectedMemberId = ref<any>(null)
const selectedMember = ref<any>(null)

function onMemberChange(id: any) {
  selectedMember.value = memberList.value.find(m => m.id === id) ?? null
}

// ── 支付方式 ──────────────────────────────────────────────────────────────────
const payMethods = [
  { label: '现金', value: 'cash' },
  { label: '微信', value: 'wechat' },
  { label: '支付宝', value: 'alipay' },
  { label: '会员余额', value: 'balance' },
  { label: '银行卡', value: 'card' },
]
const payMethod = ref('cash')

// ── 结算 ──────────────────────────────────────────────────────────────────────
const paying = ref(false)
const successVisible = ref(false)
const lastPayAmount = ref(0)
const lastOrderNo = ref('')

async function handleCheckout() {
  if (!cartItems.length) { ElMessage.warning('购物车为空'); return }
  paying.value = true
  try {
    const res = await createRetailOrder({
      order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
      member_id: selectedMemberId.value ?? 0,
      member_name: selectedMember.value?.name ?? '',
      total_amount: totalAmount.value,
      discount_amount: discountAmount.value,
      pay_amount: payAmount.value,
      pay_method: payMethod.value,
      goods_info: JSON.stringify(cartItems.map(i => ({ ...i }))),
      status: 1,
    })
    lastPayAmount.value = payAmount.value
    lastOrderNo.value = res.data?.order_no ?? res.data?.id ?? ''
    successVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message ?? '结算失败')
  } finally {
    paying.value = false
  }
}

// ── 克重计算器 ────────────────────────────────────────────────────────────────
const weightCalcVisible = ref(false)
const wcGoodsId = ref<any>(null)
const wcGoodsName = ref('')
const wcPricePerJin = ref(0)
const wcMode = ref<'weight' | 'amount'>('weight')
const wcWeightGrams = ref(0)    // 正向：输入克数
const wcTargetAmount = ref(0)   // 反向：输入金额
// 正向：克数 → 金额
const wcAmount = computed(() => {
  if (!wcPricePerJin.value || !wcWeightGrams.value) return 0
  return (wcWeightGrams.value / 500) * wcPricePerJin.value
})
// 反向：金额 → 克数
const wcReverseGrams = computed(() => {
  if (!wcPricePerJin.value || !wcTargetAmount.value) return 0
  return (wcTargetAmount.value / wcPricePerJin.value) * 500
})

function openWeightCalc(g?: any) {
  const target = g ?? selectedGoods.value
  wcGoodsId.value = target?.id ?? null
  wcGoodsName.value = target?.goods_name ?? ''
  wcPricePerJin.value = target ? Number(target.sell_price) || 0 : 0
  wcMode.value = 'weight'
  wcWeightGrams.value = 0
  wcTargetAmount.value = 0
  weightCalcVisible.value = true
}

function addWeightItemToCart() {
  const finalAmount = wcMode.value === 'weight' ? wcAmount.value : wcTargetAmount.value
  const finalGrams = wcMode.value === 'weight' ? wcWeightGrams.value : wcReverseGrams.value
  if (finalAmount <= 0) return
  const name = wcGoodsName.value || '散装商品'
  cartItems.push({
    goods_id: wcGoodsId.value ?? -1,
    goods_name: `${name} ${finalGrams.toFixed(1)}g`,
    goods_sn: '',
    unit_name: 'g',
    price: finalAmount,
    num: 1,
  })
  calcTotal()
  weightCalcVisible.value = false
  wcGoodsId.value = null
  wcGoodsName.value = ''
  wcPricePerJin.value = 0
  wcWeightGrams.value = 0
  wcTargetAmount.value = 0
  ElMessage.success('已加入购物车')
}

onMounted(async () => {
  const [, mc] = await Promise.all([loadHotGoods(), getGoodsCateList({ list_rows: 200 })])
  cateList.value = mc.data?.rows ?? []
  const mr = await getMemberList({ list_rows: 500 })
  memberList.value = mr.data?.rows ?? []
})
</script>

<style scoped>
/* ── Shell ────────────────────────────────────────────────────────────────── */
.cr-shell {
  position: fixed;
  inset: 0;
  background: #f0f2f7;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

/* ── 顶栏 ────────────────────────────────────────────────────────────────── */
.cr-topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 24px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #e8eaf0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.cr-brand { display: flex; align-items: center; gap: 10px; }
.cr-brand-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
}
.cr-brand-name { font-size: 15px; font-weight: 600; color: #1a1a2e; letter-spacing: 0.3px; }

/* 返回首页按钮 - left aligned in topbar */
.cr-home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  flex-shrink: 0;
}
.cr-home-btn:hover { background: #e2e8f0; color: #334155; }

.cr-top-right { display: flex; align-items: center; gap: 10px; }

.cr-calc-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #7c3aed;
  background: #f5f3ff; border: 1px solid #ddd6fe;
  cursor: pointer; transition: all 0.12s; user-select: none; flex-shrink: 0;
}
.cr-calc-btn:hover { background: #ede9fe; }

.cr-scan-icon {
  color: #94a3b8; cursor: pointer; padding: 2px;
  transition: color 0.12s; flex-shrink: 0;
}
.cr-scan-icon:hover { color: #3b82f6; }

.cr-member-select { width: 180px; }
:deep(.cr-member-select .el-input__wrapper) {
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: none;
}

.cr-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 0 14px;
  height: 34px;
  width: 280px;
  transition: border-color 0.15s;
}
.cr-search-box:focus-within { border-color: #3b82f6; background: #fff; }
.cr-search-icon { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
.cr-search-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #1e293b; font-size: 13px;
}
.cr-search-input::placeholder { color: #94a3b8; }

/* ── 主体 ────────────────────────────────────────────────────────────────── */
.cr-body {
  flex: 1;
  overflow: hidden;
  padding: 16px 20px 20px;
  display: flex;
}

.cr-card {
  flex: 1;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid #e8eaf0;
}

/* ── 左：购物车 ──────────────────────────────────────────────────────────── */
.cr-left {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #f0f2f7;
  display: flex;
  flex-direction: column;
  background: #fafbff;
}

.cr-left-actions {
  display: flex;
  border-bottom: 1px solid #f0f2f7;
  flex-shrink: 0;
}

.cr-action-btn {
  flex: 1; height: 42px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #64748b; cursor: pointer;
  transition: background 0.12s, color 0.12s;
  border-right: 1px solid #f0f2f7; user-select: none;
}
.cr-action-btn:last-child { border-right: none; }
.cr-action-btn:hover { background: #f1f5f9; color: #1e293b; }
.cr-action-btn.danger { color: #dc2626; }
.cr-action-btn.danger:hover { background: #fff0f0; }

.cr-cart-area { flex: 1; overflow-y: auto; padding: 8px; }
.cr-cart-area::-webkit-scrollbar { width: 4px; }
.cr-cart-area::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

.cr-cart-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; color: #cbd5e1;
}
.cr-empty-icon { font-size: 48px; opacity: 0.5; }
.cr-empty-text { font-size: 13px; text-align: center; line-height: 1.6; padding: 0 20px; }

.cr-cart-list { display: flex; flex-direction: column; gap: 6px; }

.cr-cart-item {
  border: 1px solid #e8eef8;
  border-radius: 12px;
  padding: 9px 10px;
  background: #fff;
  transition: box-shadow 0.15s;
}
.cr-cart-item:hover { box-shadow: 0 2px 8px rgba(59,130,246,0.08); }

.cr-cart-item-top {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 6px;
}
.cr-cart-item-name { font-size: 13px; font-weight: 500; color: #1e293b; flex: 1; }

.cr-cart-item-bottom {
  display: flex; align-items: center; justify-content: space-between;
}

.cr-qty-ctrl { display: flex; align-items: center; gap: 4px; }
.cr-qty-btn {
  width: 24px; height: 24px;
  border: 1px solid #e2e8f0; border-radius: 50%;
  background: #f8fafc; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; transition: all 0.1s;
}
.cr-qty-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }

.cr-cart-item-sub { font-size: 14px; font-weight: 700; color: #2563eb; }

/* ── 结算区 ──────────────────────────────────────────────────────────────── */
.cr-settle {
  flex-shrink: 0;
  border-top: 1px solid #f0f2f7;
  padding: 14px 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
  background: #fff;
}

.cr-settle-row {
  display: flex; justify-content: space-between;
  align-items: center; font-size: 13px; color: #64748b;
}
.cr-settle-row span:last-child { color: #1e293b; font-weight: 600; }

.cr-pay-methods { display: flex; flex-wrap: wrap; gap: 6px; }

.cr-pay-btn {
  padding: 5px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px; font-size: 12px; color: #64748b;
  background: #f8fafc; cursor: pointer; transition: all 0.12s; user-select: none;
}
.cr-pay-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
.cr-pay-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }

.cr-checkout-btn {
  width: 100%; height: 48px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff; border: none; border-radius: 14px;
  font-size: 17px; font-weight: 700; cursor: pointer;
  transition: all 0.15s; letter-spacing: 1px;
  box-shadow: 0 4px 16px rgba(37,99,235,0.3);
}
.cr-checkout-btn:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #1e40af); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
.cr-checkout-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── 右：分类 + 商品 ─────────────────────────────────────────────────────── */
.cr-right {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}

.cr-cate-bar {
  display: flex; align-items: center; padding: 0 16px;
  border-bottom: 1px solid #f0f2f7; flex-shrink: 0; overflow-x: auto;
  background: #fafbff;
}
.cr-cate-bar::-webkit-scrollbar { height: 0; }

.cr-cate-tab {
  padding: 12px 16px; font-size: 14px; color: #94a3b8;
  cursor: pointer; white-space: nowrap;
  border-bottom: 2px solid transparent; transition: all 0.12s; user-select: none;
}
.cr-cate-tab:hover { color: #334155; }
.cr-cate-tab.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 600; }

.cr-goods-grid {
  flex: 1; overflow-y: auto;
  padding: 14px 12px;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; align-content: start;
}
.cr-goods-grid::-webkit-scrollbar { width: 4px; }
.cr-goods-grid::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

.cr-goods-card {
  border: 1.5px solid #e8eef8;
  border-radius: 14px; padding: 14px 12px 12px;
  cursor: pointer; background: #fff;
  transition: all 0.15s; user-select: none;
}
.cr-goods-card:hover {
  border-color: #3b82f6;
  box-shadow: 0 4px 16px rgba(59,130,246,0.12);
  transform: translateY(-2px);
}
.cr-goods-card:active { transform: scale(0.97); }
.cr-goods-card.selected {
  border-color: #2563eb;
  background: #eff6ff;
  box-shadow: 0 4px 16px rgba(37,99,235,0.15);
}

.cr-goods-name {
  font-size: 13px; color: #1e293b; line-height: 1.5; margin-bottom: 10px;
  font-weight: 500; min-height: 38px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

.cr-goods-prices { display: flex; flex-direction: column; gap: 2px; }
.cr-goods-price { font-size: 15px; font-weight: 700; color: #1e293b; }
.cr-goods-member-price { font-size: 11px; color: #d97706; font-weight: 500; }

.cr-goods-empty {
  grid-column: 1/-1; text-align: center;
  color: #cbd5e1; padding: 60px 0; font-size: 14px;
}

/* ── 手机端悬浮购物车（桌面隐藏） ───────────────────────────────────────── */
.cr-float-bar,
.cr-cart-drawer,
.cr-drawer-mask { display: none; }

/* ── 响应式：≤ 768px 手机布局 ─────────────────────────────────────────────── */
@media (max-width: 768px) {

  /* 顶栏紧凑化 */
  .cr-topbar {
    height: auto;
    min-height: 52px;
    padding: 6px 10px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cr-home-text { display: none; }

  .cr-home-btn {
    padding: 6px 8px;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    justify-content: center;
  }

  .cr-brand-name { font-size: 13px; letter-spacing: 0; }
  .cr-brand-icon svg { width: 22px; height: 22px; }
  .cr-brand { gap: 6px; }

  .cr-top-right { width: 100%; gap: 6px; order: 3; }

  .cr-calc-text { display: none; }
  .cr-calc-btn {
    padding: 6px 8px; border-radius: 50%;
    width: 32px; height: 32px;
    justify-content: center; flex-shrink: 0;
  }

  .cr-member-select { width: 120px; flex-shrink: 0; }
  .cr-search-box { flex: 1; width: auto; min-width: 0; }

  /* 主体：留出底部悬浮栏高度 */
  .cr-body { padding: 0; padding-bottom: 68px; }

  .cr-card {
    border-radius: 0; border: none;
    box-shadow: none; flex-direction: column;
  }

  /* 桌面端左侧购物车在手机上隐藏 */
  .cr-left { display: none; }

  .cr-right { flex: 1; display: flex; flex-direction: column; }

  /* 商品网格：2列 */
  .cr-goods-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 10px 8px; gap: 8px;
  }

  .cr-goods-card { padding: 10px 9px 9px; border-radius: 12px; }
  .cr-goods-name { font-size: 12px; min-height: 32px; margin-bottom: 7px; }
  .cr-goods-price { font-size: 14px; }
  .cr-cate-tab { padding: 10px 12px; font-size: 13px; }

  /* ── 底部悬浮购物车栏 ── */
  .cr-float-bar {
    display: flex;
    position: fixed;
    bottom: 16px;
    left: 12px;
    right: 12px;
    height: 56px;
    background: #1e293b;
    border-radius: 18px;
    align-items: center;
    padding: 0 6px 0 10px;
    gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    z-index: 200;
    cursor: pointer;
    user-select: none;
  }

  .cr-float-cart-icon {
    position: relative;
    width: 42px; height: 42px;
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.5);
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .cr-float-cart-icon.has-items {
    background: #2563eb;
    color: #fff;
  }

  .cr-float-badge {
    position: absolute;
    top: -4px; right: -4px;
    min-width: 16px; height: 16px;
    background: #ef4444;
    color: #fff; font-size: 10px; font-weight: 700;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; line-height: 1;
    border: 1.5px solid #1e293b;
  }

  .cr-float-info {
    flex: 1; display: flex; flex-direction: column; gap: 1px;
  }
  .cr-float-empty { font-size: 13px; color: rgba(255,255,255,0.4); }
  .cr-float-total { font-size: 18px; font-weight: 700; color: #fff; line-height: 1.2; }
  .cr-float-count { font-size: 11px; color: rgba(255,255,255,0.45); }

  .cr-float-checkout {
    height: 42px; padding: 0 18px;
    background: #2563eb;
    color: #fff; border: none; border-radius: 13px;
    font-size: 15px; font-weight: 700;
    cursor: pointer; flex-shrink: 0;
    transition: background 0.15s;
  }
  .cr-float-checkout:active { background: #1d4ed8; }
  .cr-float-checkout:disabled { opacity: 0.5; }

  /* ── 购物车抽屉遮罩 ── */
  .cr-drawer-mask {
    display: block;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 300;
  }

  /* ── 购物车底部抽屉 ── */
  .cr-cart-drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 80vh;
    background: #fff;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
    z-index: 400;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .cr-cart-drawer.open { transform: translateY(0); }

  .cr-drawer-handle {
    padding: 12px 0 6px;
    display: flex; justify-content: center;
    cursor: pointer; flex-shrink: 0;
  }
  .cr-drawer-grip {
    width: 36px; height: 4px;
    background: #e2e8f0; border-radius: 2px;
  }

  .cr-drawer-inner {
    flex: 1; overflow: hidden;
    display: flex; flex-direction: column;
  }

  .cr-drawer-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 14px 10px;
    flex-shrink: 0;
    border-bottom: 1px solid #f0f2f7;
  }
  .cr-drawer-title { font-size: 15px; font-weight: 700; color: #1e293b; }

  .cr-drawer-header .cr-drawer-actions {
    display: flex; gap: 4px;
  }
  .cr-drawer-header .cr-action-btn {
    height: 30px; padding: 0 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 12px; color: #64748b;
    background: #f8fafc;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    user-select: none;
  }
  .cr-drawer-header .cr-action-btn.danger { color: #dc2626; border-color: #fecaca; background: #fff5f5; }

  .cr-drawer-list {
    flex: 1; overflow-y: auto;
    padding: 8px 12px;
  }
  .cr-drawer-list::-webkit-scrollbar { width: 0; }

  .cr-drawer-empty {
    padding: 24px 0; text-align: center;
    color: #94a3b8; font-size: 14px;
  }

  .cr-drawer-settle {
    border-top: 1px solid #f0f2f7;
    padding: 12px 14px 24px;
  }

  /* 支付方式横向滚动 */
  .cr-pay-methods { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
  .cr-pay-methods::-webkit-scrollbar { height: 0; }
  .cr-pay-btn { flex-shrink: 0; }

  .cr-checkout-btn {
    height: 52px; font-size: 16px; border-radius: 14px;
  }

  /* 购物车列表通用（抽屉内） */
  .cr-cart-item { padding: 8px 9px; border-radius: 10px; }
  .cr-cart-item-name { font-size: 12px; }
  .cr-cart-item-sub { font-size: 13px; }
}
</style>
