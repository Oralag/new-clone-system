<template>
  <div class="cr-shell">

    <!-- ── 顶栏 ── -->
    <div class="cr-topbar">
      <div class="cr-brand">
        <div class="cr-brand-icon">数</div>
        <span class="cr-brand-name">数字游牧收银台</span>
      </div>
      <div class="cr-top-right">
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
            v-model="keyword"
            class="cr-search-input"
            placeholder="请输入条码/商品首字母缩写"
            @input="onSearch"
          />
        </div>
      </div>
    </div>

    <!-- ── 主体 ── -->
    <div class="cr-body">
      <div class="cr-card">

        <!-- 左：购物车 -->
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
            <div class="cr-cate-tab" :class="{ active: activeCate === '' }"
              @click="activeCate = ''; loadGoods()">全部分类</div>
            <div v-for="c in cateList" :key="c.id" class="cr-cate-tab"
              :class="{ active: activeCate === c.id }"
              @click="activeCate = c.id; loadGoods()">
              {{ c.name }}
            </div>
          </div>

          <div class="cr-goods-grid" v-loading="goodsLoading">
            <div v-for="g in goodsList" :key="g.id" class="cr-goods-card" @click="addToCart(g)">
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
        <el-icon style="font-size:56px;color:#00b42a"><CircleCheckFilled /></el-icon>
        <div style="font-size:26px;font-weight:700;margin:14px 0 6px;color:#1d2129">
          ¥{{ lastPayAmount.toFixed(2) }}
        </div>
        <div style="color:#86909c;font-size:13px">订单号：{{ lastOrderNo }}</div>
      </div>
      <template #footer>
        <el-button type="primary" style="width:100%" @click="successVisible = false; clearCart()">
          继续收银
        </el-button>
      </template>
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
const activeCate = ref<any>('')
const goodsList = ref<any[]>([])
const goodsLoading = ref(false)
const cateList = ref<any[]>([])
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

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadGoods, 300)
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
      order_date: new Date().toISOString().slice(0, 10),
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

onMounted(async () => {
  const [, mc] = await Promise.all([loadGoods(), getGoodsCateList({ list_rows: 200 })])
  cateList.value = mc.data?.rows ?? []
  const mr = await getMemberList({ list_rows: 500 })
  memberList.value = mr.data?.rows ?? []
})
</script>

<style scoped>
/* ── Shell (全屏深色背景) ─────────────────────────────────────────────────── */
.cr-shell {
  position: fixed;
  inset: 0;
  background: #3e4770;
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
  padding: 0 28px;
  flex-shrink: 0;
}

.cr-brand { display: flex; align-items: center; gap: 10px; }
.cr-brand-icon {
  width: 32px; height: 32px;
  background: #fff;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; color: #3e4770;
}
.cr-brand-name { font-size: 16px; font-weight: 600; color: #fff; letter-spacing: 0.5px; }

.cr-top-right { display: flex; align-items: center; gap: 12px; }

.cr-member-select { width: 180px; }
:deep(.cr-member-select .el-input__wrapper) {
  background: rgba(255,255,255,0.15);
  border-color: rgba(255,255,255,0.25);
  box-shadow: none;
}
:deep(.cr-member-select .el-input__inner) { color: #fff; }
:deep(.cr-member-select .el-input__inner::placeholder) { color: rgba(255,255,255,0.6); }

.cr-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.25);
  border-radius: 20px;
  padding: 0 14px;
  height: 34px;
  width: 280px;
}
.cr-search-icon { color: rgba(255,255,255,0.7); font-size: 14px; flex-shrink: 0; }
.cr-search-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: #fff;
  font-size: 13px;
}
.cr-search-input::placeholder { color: rgba(255,255,255,0.55); }

/* ── 主体 ────────────────────────────────────────────────────────────────── */
.cr-body {
  flex: 1;
  overflow: hidden;
  padding: 0 28px 24px;
  display: flex;
}

.cr-card {
  flex: 1;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 8px 32px rgba(0,0,0,0.18);
}

/* ── 左：购物车 ──────────────────────────────────────────────────────────── */
.cr-left {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #f0f0f0;
  display: flex;
  flex-direction: column;
}

.cr-left-actions {
  display: flex;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.cr-action-btn {
  flex: 1;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: #555;
  cursor: pointer;
  transition: background 0.12s;
  border-right: 1px solid #f0f0f0;
  user-select: none;
}
.cr-action-btn:last-child { border-right: none; }
.cr-action-btn:hover { background: #f5f5f5; }
.cr-action-btn.danger { color: #f53f3f; }
.cr-action-btn.danger:hover { background: #fff0f0; }

.cr-cart-area {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.cr-cart-empty {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: #bbb;
}
.cr-empty-icon { font-size: 48px; opacity: 0.4; }
.cr-empty-text { font-size: 13px; text-align: center; line-height: 1.6; padding: 0 20px; }

.cr-cart-list { display: flex; flex-direction: column; gap: 4px; }

.cr-cart-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 8px 10px;
  background: #fafafa;
}

.cr-cart-item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}
.cr-cart-item-name { font-size: 13px; font-weight: 500; color: #1d2129; flex: 1; }

.cr-cart-item-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cr-qty-ctrl { display: flex; align-items: center; gap: 4px; }
.cr-qty-btn {
  width: 24px; height: 24px;
  border: 1px solid #ddd;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #555;
  transition: all 0.1s;
}
.cr-qty-btn:hover { border-color: #3e4770; color: #3e4770; }

.cr-cart-item-sub { font-size: 14px; font-weight: 600; color: #3e4770; }

/* ── 结算区 ──────────────────────────────────────────────────────────────── */
.cr-settle {
  flex-shrink: 0;
  border-top: 1px solid #f0f0f0;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cr-settle-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  color: #555;
}

.cr-pay-methods {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cr-pay-btn {
  padding: 4px 12px;
  border: 1px solid #ddd;
  border-radius: 20px;
  font-size: 12px;
  color: #555;
  cursor: pointer;
  transition: all 0.12s;
  user-select: none;
}
.cr-pay-btn:hover { border-color: #3e4770; color: #3e4770; }
.cr-pay-btn.active { background: #3e4770; border-color: #3e4770; color: #fff; }

.cr-checkout-btn {
  width: 100%;
  height: 46px;
  background: #3e4770;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 1px;
}
.cr-checkout-btn:hover:not(:disabled) { background: #4e5a8a; }
.cr-checkout-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── 右：分类 + 商品 ─────────────────────────────────────────────────────── */
.cr-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.cr-cate-bar {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 0 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  overflow-x: auto;
}
.cr-cate-bar::-webkit-scrollbar { height: 0; }

.cr-cate-tab {
  padding: 12px 16px;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  white-space: nowrap;
  border-bottom: 2px solid transparent;
  transition: all 0.12s;
  user-select: none;
}
.cr-cate-tab:hover { color: #3e4770; }
.cr-cate-tab.active { color: #3e4770; border-bottom-color: #3e4770; font-weight: 600; }

.cr-goods-grid {
  flex: 1;
  overflow-y: auto;
  padding: 14px 12px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  align-content: start;
}

.cr-goods-card {
  border: 1px solid #ebebeb;
  border-radius: 10px;
  padding: 14px 12px 12px;
  cursor: pointer;
  background: #fff;
  transition: all 0.15s;
  user-select: none;
}
.cr-goods-card:hover {
  border-color: #3e4770;
  box-shadow: 0 2px 8px rgba(62,71,112,0.12);
  transform: translateY(-1px);
}
.cr-goods-card:active { transform: scale(0.97); }

.cr-goods-name {
  font-size: 13px;
  color: #1d2129;
  line-height: 1.5;
  margin-bottom: 10px;
  font-weight: 500;
  min-height: 38px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.cr-goods-prices { display: flex; flex-direction: column; gap: 2px; }
.cr-goods-price { font-size: 15px; font-weight: 600; color: #333; }
.cr-goods-member-price { font-size: 12px; color: #c48a2f; }

.cr-goods-empty {
  grid-column: 1/-1;
  text-align: center;
  color: #bbb;
  padding: 60px 0;
  font-size: 14px;
}
</style>
