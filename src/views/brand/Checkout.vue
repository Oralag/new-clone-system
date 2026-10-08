<template>
  <div class="brand-checkout">
    <!-- 零售结账 -->
    <template v-if="shopStore.shopMode !== 'wholesale'">
      <div class="bc-header">
        <h2 class="bc-title">结账</h2>
        <p class="bc-sub">安全支付 · 全球配送</p>
      </div>

      <div class="bc-layout">
        <!-- 左：表单 -->
        <div class="bc-form-col">
          <!-- 登录状态：付款下单要登录（账号=小程序会员），逛和加购不用 -->
          <div class="bc-login-bar" :class="{ on: !!webUser }">
            <template v-if="webUser">
              <span>已登录 {{ maskPhone(webUser.phone) }}<template v-if="webUser.name"> · {{ webUser.name }}</template></span>
              <button type="button" class="bc-login-link" @click="logout">退出登录</button>
            </template>
            <template v-else>
              <span>下单付款前需要先用微信扫码登录</span>
              <button type="button" class="bc-login-btn" @click="showLogin = true">扫码登录</button>
            </template>
          </div>
          <!-- 粘贴整段收货信息，自动拆到下面各个格子里 -->
          <div class="bc-section bc-paste">
            <h3 class="bc-section-title">粘贴地址自动识别</h3>
            <textarea v-model="pasteText" class="bc-textarea bc-paste-text"
              placeholder="把整段收货信息粘贴到这里，例如：&#10;张三 13800000000 内蒙古呼和浩特市赛罕区大学东街1号"
              @paste="onPasteAddress"></textarea>
            <div class="bc-paste-row">
              <span class="bc-paste-tip">{{ pasteTip }}</span>
              <button type="button" class="bc-paste-btn" :disabled="!pasteText.trim()" @click="applyPaste">识别</button>
            </div>
          </div>
          <div class="bc-section">
            <h3 class="bc-section-title">联系信息</h3>
            <div class="bc-fields">
              <div class="bc-field">
                <label class="bc-label">姓名 <span class="bc-req">*</span></label>
                <input v-model="form.name" type="text" class="bc-input" placeholder="收货人姓名" />
              </div>
              <div class="bc-field">
                <label class="bc-label">手机号 <span class="bc-req">*</span></label>
                <input v-model="form.mobile" type="tel" class="bc-input" placeholder="11位手机号" />
              </div>
              <div class="bc-field bc-field-full">
                <label class="bc-label">邮箱</label>
                <input v-model="form.email" type="email" class="bc-input" placeholder="用于接收订单通知" />
              </div>
            </div>
          </div>

          <div class="bc-section">
            <h3 class="bc-section-title">收货地址</h3>
            <div class="bc-fields">
              <div class="bc-field bc-field-full">
                <label class="bc-label">省市区 <span class="bc-req">*</span></label>
                <input v-model="form.region" type="text" class="bc-input" placeholder="如：广东省广州市天河区" />
              </div>
              <div class="bc-field bc-field-full">
                <label class="bc-label">详细地址 <span class="bc-req">*</span></label>
                <input v-model="form.address" type="text" class="bc-input" placeholder="街道/楼栋/门牌号" />
              </div>
              <div class="bc-field">
                <label class="bc-label">邮政编码</label>
                <input v-model="form.postcode" type="text" class="bc-input" placeholder="6位邮编" />
              </div>
            </div>
          </div>

          <div class="bc-section">
            <h3 class="bc-section-title">备注</h3>
            <textarea v-model="form.remark" class="bc-textarea" placeholder="特殊要求、送货时间等..."></textarea>
          </div>
        </div>

        <!-- 右：订单摘要 -->
        <div class="bc-summary-col">
          <div class="bc-summary-card">
            <h3 class="bc-section-title" style="margin-bottom:16px">订单摘要</h3>
            <div class="bc-items">
              <div v-for="item in shopStore.cart" :key="item.id" class="bc-item">
                <img :src="item.image || 'https://picsum.photos/seed/placeholder/100/100'" class="bc-item-img" referrerpolicy="no-referrer" />
                <div class="bc-item-info">
                  <p class="bc-item-name">{{ item.name }}</p>
                  <p class="bc-item-qty">× {{ item.quantity }}</p>
                </div>
                <p class="bc-item-price">¥{{ ((item.isWholesale ? item.wholesalePrice : item.price) * item.quantity).toFixed(2) }}</p>
              </div>
            </div>
            <div class="bc-summary-rows">
              <div class="bc-summary-row">
                <span>商品小计</span>
                <span>¥{{ shopStore.totalAmount.toFixed(2) }}</span>
              </div>
              <div class="bc-summary-row">
                <span>运费</span>
                <span class="bc-free-shipping" v-if="shippingFee === 0">包邮</span>
                <span v-else>¥{{ shippingFee.toFixed(2) }}</span>
              </div>
              <div class="bc-summary-row bc-total-row">
                <span>合计</span>
                <span>¥{{ totalAmount.toFixed(2) }}</span>
              </div>
            </div>
            <button class="bc-submit-btn" :disabled="submitting || !shopStore.cart.length" @click="submitOrder">
              <svg v-if="!submitting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>{{ !shopStore.cart.length ? '购物车是空的' : submitting ? '正在生成支付码...' : webUser ? '确认下单并付款' : '登录并下单付款' }}</span>
            </button>
            <p v-if="submitError" class="bc-submit-err">{{ submitError }}</p>
            <p class="bc-secure-tip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              微信扫码支付 · 付款后自动确认
            </p>
          </div>
        </div>
      </div>
    </template>

    <!-- 采购商询价 -->
    <template v-else>
      <div class="bc-header">
        <h2 class="bc-title">批发询价单</h2>
        <p class="bc-sub">提交后 1-2 工作日内商务团队联系您确认</p>
      </div>

      <div class="bc-layout">
        <div class="bc-form-col">
          <div class="bc-section">
            <h3 class="bc-section-title">公司信息</h3>
            <div class="bc-fields">
              <div class="bc-field bc-field-full">
                <label class="bc-label">公司名称 <span class="bc-req">*</span></label>
                <input v-model="wForm.company" type="text" class="bc-input" placeholder="营业执照上的名称" />
              </div>
              <div class="bc-field">
                <label class="bc-label">联系人 <span class="bc-req">*</span></label>
                <input v-model="wForm.contact" type="text" class="bc-input" />
              </div>
              <div class="bc-field">
                <label class="bc-label">手机号 <span class="bc-req">*</span></label>
                <input v-model="wForm.mobile" type="tel" class="bc-input" />
              </div>
              <div class="bc-field bc-field-full">
                <label class="bc-label">收货地址</label>
                <input v-model="wForm.address" type="text" class="bc-input" placeholder="省市区+详细地址" />
              </div>
            </div>
          </div>

          <div class="bc-section">
            <h3 class="bc-section-title">采购需求</h3>
            <div class="bc-fields">
              <div class="bc-field">
                <label class="bc-label">预计月采购量</label>
                <input v-model="wForm.volume" type="text" class="bc-input" placeholder="如：100-200件/月" />
              </div>
              <div class="bc-field">
                <label class="bc-label">期望付款方式</label>
                <select v-model="wForm.payment" class="bc-input">
                  <option value="">请选择</option>
                  <option>银行转账</option>
                  <option>月结</option>
                  <option>预付货款</option>
                </select>
              </div>
              <div class="bc-field bc-field-full">
                <label class="bc-label">补充说明</label>
                <textarea v-model="wForm.remark" class="bc-textarea" placeholder="特殊规格要求、定制需求等..."></textarea>
              </div>
            </div>
          </div>
        </div>

        <div class="bc-summary-col">
          <div class="bc-summary-card">
            <h3 class="bc-section-title" style="margin-bottom:16px">询价商品清单</h3>
            <div class="bc-items">
              <div v-for="item in shopStore.cart" :key="item.id" class="bc-item">
                <img :src="item.image || 'https://picsum.photos/seed/placeholder/100/100'" class="bc-item-img" referrerpolicy="no-referrer" />
                <div class="bc-item-info">
                  <p class="bc-item-name">{{ item.name }}</p>
                  <p class="bc-item-qty">询价 × {{ item.quantity }}</p>
                </div>
                <p class="bc-item-price" v-if="item.wholesalePrice">¥{{ item.wholesalePrice }}/件</p>
              </div>
            </div>
            <button class="bc-submit-btn bc-wholesale-btn" :disabled="submitting || !shopStore.cart.length" @click="submitInquiry">
              {{ !shopStore.cart.length ? '询价清单是空的' : submitting ? '提交中...' : '提交询价单' }}
            </button>
            <p v-if="submitError" class="bc-submit-err">{{ submitError }}</p>
            <p class="bc-secure-tip">提交后商务人员将在 1-2 个工作日内与您联系</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 零售：微信扫码付款 + 倒计时确认 -->
    <BrandWebPayDialog
      v-if="payOrder"
      :order-no="payOrder.order_no"
      :token="payOrder.token"
      :code-url="payOrder.code_url"
      :amount="payOrder.total_amount"
      :expires-at="payOrder.expires_at"
      @paid="handlePaid"
      @close="payOrder = null"
      @done="handlePayDone('/brand/products')"
      @view-orders="handlePayDone('/brand/orders')"
    />

    <BrandLoginDialog
      v-if="showLogin"
      :reason="loginThenSubmit ? '登录后继续下单付款' : undefined"
      @close="showLogin = false; loginThenSubmit = false"
      @success="handleLoggedIn"
    />

    <!-- 批发询价提交成功 -->
    <div v-if="success" class="bc-success-overlay">
      <div class="bc-success-card">
        <div class="bc-success-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h3 class="bc-success-title">询价单已提交！</h3>
        <p class="bc-success-sub">商务团队将在 1-2 工作日内联系您。</p>
        <div v-if="orderNo" class="bc-order-no">询价编号：{{ orderNo }}</div>
        <div class="bc-success-btns">
          <button class="bc-success-btn-primary" @click="goBrand('/brand/products')">继续浏览</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { useRouter } from 'vue-router'
import BrandWebPayDialog from '@/components/BrandWebPayDialog.vue'
import BrandLoginDialog from '@/components/BrandLoginDialog.vue'
import { parseAddress } from '@/utils/parseAddress'
import {
  createWebOrder, getWebShipping, rememberWebOrder, submitWebLead, brandShopCode,
  loadWebSession, clearWebSession, getWebMe, WebNeedLoginError, type WebOrderCreated, type WebUser,
} from '@/api/brandWebOrder'

const shopStore = useShopStore()
const router = useRouter()
const submitting = ref(false)
const success = ref(false)
const orderNo = ref('')

// 运费规则在 ERP「收款设置」里配，默认包邮；实际收多少以服务端下单时算的为准
const shipRule = ref({ fee: 0, free_threshold: 0 })
const shippingFee = computed(() => {
  const { fee, free_threshold } = shipRule.value
  if (!(fee > 0)) return 0
  return free_threshold > 0 && shopStore.totalAmount >= free_threshold ? 0 : fee
})
const totalAmount = computed(() => shopStore.totalAmount + shippingFee.value)

const form = reactive({
  name: '', mobile: '', email: '',
  region: '', address: '', postcode: '', remark: '',
})

const wForm = reactive({
  company: '', contact: '', mobile: '', address: '',
  volume: '', payment: '', remark: '',
})

const webUser = ref<WebUser | null>(loadWebSession()?.user || null)
const showLogin = ref(false)
const loginThenSubmit = ref(false)
function maskPhone(p: string) {
  return /^\d{11}$/.test(p || '') ? `${p.slice(0, 3)}****${p.slice(7)}` : (p || '')
}
function logout() {
  clearWebSession()
  webUser.value = null
}
function handleLoggedIn(user: WebUser) {
  webUser.value = user
  showLogin.value = false
  if (!form.mobile && user.phone) form.mobile = user.phone
  if (loginThenSubmit.value) {
    loginThenSubmit.value = false
    submitOrder()
  }
}

onMounted(() => {
  // 本地记着登录，但可能已过期/会员被删：问一下后端，不行就当没登录
  if (webUser.value) {
    getWebMe().then(u => { webUser.value = u }).catch(e => { if (e instanceof WebNeedLoginError) webUser.value = null })
  }
  getWebShipping().then(r => { shipRule.value = r }).catch(() => { /* 读不到按包邮显示，下单时以服务端为准 */ })
  try {
    const stored = localStorage.getItem('brand_user_settings')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.account?.name) form.name = data.account.name
      if (data.account?.phone) form.mobile = data.account.phone
      if (data.account?.email) form.email = data.account.email
      if (data.account?.address) form.address = data.account.address
      // wholesale
      if (data.account?.name) wForm.contact = data.account.name
      if (data.account?.phone) wForm.mobile = data.account.phone
      if (data.account?.address) wForm.address = data.account.address
    }
  } catch { /* ignore */ }
})

const submitError = ref('')
const pasteText = ref('')
const pasteTip = ref('支持「姓名 手机 地址」任意顺序，带「收货人：」这类标签也行')

// 识别到的才填，没识别到的格子保持原样，不把顾客已经填好的清空
function applyPaste() {
  const r = parseAddress(pasteText.value)
  const got: string[] = []
  if (r.name) { form.name = r.name; got.push('姓名') }
  if (r.mobile) { form.mobile = r.mobile; got.push('手机') }
  if (r.region) { form.region = r.region; got.push('省市区') }
  if (r.address) { form.address = r.address; got.push('详细地址') }
  if (r.postcode) { form.postcode = r.postcode; got.push('邮编') }
  pasteTip.value = got.length
    ? `已识别：${got.join('、')}，请核对一下下面的信息`
    : '没认出来，请直接在下面填写'
}
function onPasteAddress() {
  // 等粘贴内容进到输入框后再识别
  setTimeout(() => { if (pasteText.value.trim()) applyPaste() }, 0)
}
const payOrder = ref<WebOrderCreated | null>(null)

// 官网链接里带了 ?shop=店铺码 的，跳转时要带着，不然到下一页就分不清是哪家店了
function goBrand(path: string, query: Record<string, string> = {}) {
  const shop = brandShopCode()
  router.push({ path, query: shop ? { ...query, shop } : query })
}

async function submitOrder() {
  submitError.value = ''
  if (!shopStore.cart.length) { submitError.value = '购物车是空的，先去挑几样吧'; return }
  if (!form.name || !form.mobile || !form.region || !form.address) {
    submitError.value = '请填写必填项（姓名、手机号、省市区、详细地址）'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.mobile)) {
    submitError.value = '请输入正确的11位手机号'
    return
  }
  const missing = shopStore.cart.filter(i => !i.erpId)
  if (missing.length) {
    submitError.value = `「${missing[0].name}」商品信息不完整，请从购物车删掉后重新加入`
    return
  }
  if (!webUser.value) {
    loginThenSubmit.value = true
    showLogin.value = true
    return
  }
  submitting.value = true
  try {
    // 价格、运费以服务端为准（按商品现价重算），这里只传商品和数量
    const order = await createWebOrder({
      items: shopStore.cart.map(i => ({ goods_id: i.erpId, qty: i.quantity })),
      contact: { name: form.name, mobile: form.mobile, region: form.region, address: form.address, postcode: form.postcode },
      remark: form.remark,
    })
    rememberWebOrder(order.order_no, order.token, form.mobile)
    payOrder.value = order
  } catch (e: any) {
    if (e instanceof WebNeedLoginError) {
      // 登录过期：重新扫码，扫完自动接着下单
      webUser.value = null
      loginThenSubmit.value = true
      showLogin.value = true
    } else {
      submitError.value = e?.message || '下单失败，请稍后再试'
    }
  } finally {
    submitting.value = false
  }
}

// 付款确认后才清购物车；没付成功购物车原样保留
function handlePaid() {
  shopStore.clearCart()
}

function handlePayDone(path: string) {
  payOrder.value = null
  goBrand(path)
}

async function submitInquiry() {
  submitError.value = ''
  if (!shopStore.cart.length) { submitError.value = '询价清单是空的'; return }
  if (!wForm.company || !wForm.contact || !wForm.mobile) {
    submitError.value = '请填写必填项（公司名称、联系人、手机号）'
    return
  }
  if (!/^1[3-9]\d{9}$/.test(wForm.mobile)) {
    submitError.value = '请输入正确的11位手机号'
    return
  }
  submitting.value = true
  try {
    const content = [
      wForm.address ? `收货地址：${wForm.address}` : '',
      wForm.volume ? `预计月采购量：${wForm.volume}` : '',
      wForm.payment ? `期望付款方式：${wForm.payment}` : '',
      wForm.remark ? `补充说明：${wForm.remark}` : '',
    ].filter(Boolean).join('\n')
    const lead = await submitWebLead({
      type: 'inquiry',
      name: wForm.contact,
      mobile: wForm.mobile,
      company: wForm.company,
      content,
      items: shopStore.cart.map(item => ({
        goods_id: item.erpId || 0,
        goods_name: item.name,
        qty: item.quantity,
        price: item.wholesalePrice || item.price,
      })),
    })
    orderNo.value = lead.no
    shopStore.clearCart()
    success.value = true
  } catch (e: any) {
    submitError.value = e?.message || '提交失败，请稍后再试'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.brand-checkout { max-width: 1100px; margin: 0 auto; padding: 40px 24px 80px; }
.bc-header { margin-bottom: 36px; }
.bc-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
.bc-sub { font-size: 14px; color: rgba(29,29,31,0.45); }

.bc-layout { display: grid; grid-template-columns: 1fr 380px; gap: 32px; align-items: start; }
.bc-login-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; margin-bottom: 16px; border-radius: 14px; background: rgba(124,58,237,0.07); color: #6d28d9; font-size: 13px; font-weight: 600; }
.bc-login-bar.on { background: rgba(52,199,89,0.1); color: #15803d; }
.bc-login-btn { flex-shrink: 0; height: 32px; padding: 0 16px; border-radius: 10px; border: none; background: #1d1d1f; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
.bc-login-btn:hover { background: #7c3aed; }
.bc-login-link { flex-shrink: 0; border: none; background: none; color: rgba(29,29,31,0.45); font-size: 12px; cursor: pointer; text-decoration: underline; }
.bc-section { background: #fff; border-radius: 20px; padding: 24px; border: 1px solid rgba(0,0,0,0.06); margin-bottom: 20px; }
.bc-section-title { font-size: 15px; font-weight: 700; margin-bottom: 16px; }
.bc-fields { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.bc-field { display: flex; flex-direction: column; gap: 6px; }
.bc-field-full { grid-column: 1 / -1; }
.bc-label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.5); }
.bc-req { color: #ef4444; }
.bc-input {
  padding: 11px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px;
  font-size: 14px; outline: none; transition: border-color 0.2s; background: #fff;
  font-family: inherit;
}
.bc-input:focus { border-color: #7c3aed; }
.bc-textarea {
  padding: 11px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px;
  font-size: 14px; outline: none; resize: vertical; min-height: 80px; font-family: inherit;
  transition: border-color 0.2s;
}
.bc-textarea:focus { border-color: #7c3aed; }

.bc-summary-col { position: sticky; top: 80px; }
.bc-summary-card { background: #f5f5f7; border-radius: 20px; padding: 24px; }
.bc-items { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
.bc-item { display: flex; align-items: center; gap: 12px; }
.bc-item-img { width: 48px; height: 48px; border-radius: 10px; object-fit: cover; }
.bc-item-info { flex: 1; }
.bc-item-name { font-size: 13px; font-weight: 600; }
.bc-item-qty { font-size: 11px; color: rgba(29,29,31,0.4); margin-top: 2px; }
.bc-item-price { font-size: 14px; font-weight: 700; }
.bc-summary-rows { border-top: 1px solid rgba(0,0,0,0.06); padding-top: 14px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px; }
.bc-summary-row { display: flex; justify-content: space-between; font-size: 14px; color: rgba(29,29,31,0.6); }
.bc-total-row { font-size: 16px; font-weight: 800; color: #1d1d1f; border-top: 1px solid rgba(0,0,0,0.06); padding-top: 10px; }
.bc-free-shipping { color: #34c759; font-weight: 700; }
.bc-submit-btn {
  width: 100%; padding: 15px; border-radius: 14px;
  background: #1d1d1f; color: #fff; border: none;
  font-size: 15px; font-weight: 700; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.2s; margin-bottom: 10px;
}
.bc-submit-btn:hover:not(:disabled) { background: #0071e3; }
.bc-submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.bc-paste-text { display: block; width: 100%; box-sizing: border-box; min-height: 72px; }
.bc-paste-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 10px; }
.bc-paste-tip { font-size: 12px; color: rgba(29,29,31,0.45); line-height: 1.5; }
.bc-paste-btn { flex-shrink: 0; height: 34px; padding: 0 18px; border-radius: 10px; border: none; background: #1d1d1f; color: #fff; font-size: 13px; font-weight: 700; cursor: pointer; }
.bc-paste-btn:hover:not(:disabled) { background: #7c3aed; }
.bc-paste-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bc-submit-err { margin: 10px 0 0; font-size: 13px; color: #dc2626; line-height: 1.5; text-align: center; }
.bc-wholesale-btn:hover:not(:disabled) { background: #d97706 !important; }
.bc-secure-tip { font-size: 11px; color: rgba(29,29,31,0.35); text-align: center; display: flex; align-items: center; justify-content: center; gap: 4px; }

/* 成功状态 */
.bc-success-overlay { position: fixed; inset: 0; background: rgba(255,255,255,0.95); z-index: 999; display: flex; align-items: center; justify-content: center; }
.bc-success-card { text-align: center; padding: 48px 32px; max-width: 420px; }
.bc-success-icon { margin: 0 auto 20px; width: 72px; height: 72px; background: rgba(52,199,89,0.12); border-radius: 50%; display: flex; align-items: center; justify-content: center; }
.bc-success-title { font-size: 24px; font-weight: 800; margin-bottom: 10px; }
.bc-success-sub { font-size: 14px; color: rgba(29,29,31,0.5); margin-bottom: 16px; line-height: 1.6; }
.bc-order-no { font-size: 13px; font-weight: 700; color: #7c3aed; background: rgba(124,58,237,0.08); padding: 8px 16px; border-radius: 10px; display: inline-block; margin-bottom: 24px; }
.bc-success-btns { display: flex; gap: 12px; }
.bc-success-btn-outline { flex: 1; padding: 12px; border-radius: 12px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bc-success-btn-primary { flex: 1; padding: 12px; border-radius: 12px; background: #1d1d1f; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }

@media (max-width: 768px) {
  .bc-layout { grid-template-columns: 1fr; }
  .bc-summary-col { position: static; }
  .bc-fields { grid-template-columns: 1fr; }
}
</style>
