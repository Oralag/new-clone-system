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
                <span class="bc-free-shipping" v-if="shopStore.totalAmount >= 500">免运费</span>
                <span v-else>¥25.00</span>
              </div>
              <div class="bc-summary-row bc-total-row">
                <span>合计</span>
                <span>¥{{ totalAmount.toFixed(2) }}</span>
              </div>
            </div>
            <button class="bc-submit-btn" :disabled="submitting" @click="submitOrder">
              <svg v-if="!submitting" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>{{ submitting ? '提交中...' : '确认下单' }}</span>
            </button>
            <p class="bc-secure-tip">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              安全加密支付
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
            <button class="bc-submit-btn bc-wholesale-btn" :disabled="submitting" @click="submitInquiry">
              {{ submitting ? '提交中...' : '提交询价单' }}
            </button>
            <p class="bc-secure-tip">提交后商务人员将在 1-2 个工作日内与您联系</p>
          </div>
        </div>
      </div>
    </template>

    <!-- 成功状态 -->
    <div v-if="success" class="bc-success-overlay">
      <div class="bc-success-card">
        <div class="bc-success-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <h3 class="bc-success-title">{{ shopStore.shopMode === 'wholesale' ? '询价单已提交！' : '订单提交成功！' }}</h3>
        <p class="bc-success-sub">{{ shopStore.shopMode === 'wholesale' ? '商务团队将在 1-2 工作日内联系您。' : '我们将尽快安排发货，感谢您的购买！' }}</p>
        <div v-if="orderNo" class="bc-order-no">订单号：{{ orderNo }}</div>
        <div class="bc-success-btns">
          <button class="bc-success-btn-outline" @click="$router.push('/brand/orders')">查询订单</button>
          <button class="bc-success-btn-primary" @click="$router.push('/brand/products')">继续购物</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { useRouter } from 'vue-router'

const shopStore = useShopStore()
const router = useRouter()
const submitting = ref(false)
const success = ref(false)
const orderNo = ref('')

const ERP_BASE = 'https://nomaderp.pages.dev/adminapi'

const shippingFee = computed(() => shopStore.totalAmount >= 500 ? 0 : 25)
const totalAmount = computed(() => shopStore.totalAmount + shippingFee.value)

const form = reactive({
  name: '', mobile: '', email: '',
  region: '', address: '', postcode: '', remark: '',
})

const wForm = reactive({
  company: '', contact: '', mobile: '', address: '',
  volume: '', payment: '', remark: '',
})

onMounted(() => {
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

async function erpPost(path: string, body: any) {
  const res = await fetch(`${ERP_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return res.json()
}

async function submitOrder() {
  if (!form.name || !form.mobile || !form.region || !form.address) {
    alert('请填写必填项（姓名、手机号、地址）')
    return
  }
  submitting.value = true
  try {
    const goods_info = shopStore.cart.map(item => ({
      goods_id: item.erpId || 0,
      goods_name: item.name,
      num: item.quantity,
      price: item.price,
    }))
    const fullAddress = `${form.region} ${form.address}${form.postcode ? ' ' + form.postcode : ''}`
    const data = await erpPost('/shop/ContractOrder/add', {
      customer_name: form.name,
      customer_id: 0,
      total_amount: totalAmount.value,
      pay_amount: totalAmount.value,
      goods_info,
      remark: `收货人:${form.name} 手机:${form.mobile} 地址:${fullAddress}${form.remark ? ' 备注:' + form.remark : ''}`,
    })
    orderNo.value = data.data?.order_no || ('ND' + Date.now().toString().slice(-8))
    shopStore.clearCart()
    success.value = true
  } catch (e: any) {
    alert('提交失败：' + (e.message || '网络错误'))
  } finally {
    submitting.value = false
  }
}

async function submitInquiry() {
  if (!wForm.company || !wForm.contact || !wForm.mobile) {
    alert('请填写必填项（公司名称、联系人、手机号）')
    return
  }
  submitting.value = true
  try {
    const goods_info = shopStore.cart.map(item => ({
      goods_id: item.erpId || 0,
      goods_name: item.name,
      num: item.quantity,
      price: item.wholesalePrice || item.price,
    }))
    const data = await erpPost('/shop/ContractOrder/add', {
      customer_name: wForm.company,
      customer_id: 0,
      total_amount: shopStore.totalAmount,
      pay_amount: shopStore.totalAmount,
      goods_info,
      remark: `批发询价 联系人:${wForm.contact} 手机:${wForm.mobile}${wForm.address ? ' 地址:' + wForm.address : ''}${wForm.volume ? ' 月采购量:' + wForm.volume : ''}${wForm.payment ? ' 付款方式:' + wForm.payment : ''}${wForm.remark ? ' 备注:' + wForm.remark : ''}`,
    })
    orderNo.value = data.data?.order_no || ('INQ' + Date.now().toString().slice(-8))
    shopStore.clearCart()
    success.value = true
  } catch (e: any) {
    alert('提交失败：' + (e.message || '网络错误'))
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
