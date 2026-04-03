<template>
  <div class="brand-settings">
    <div class="bst-header">
      <h2 class="bst-title">品牌设置</h2>
      <p class="bst-sub">管理您的账户信息与偏好设置</p>
    </div>

    <div class="bst-mode-card">
      <div class="bst-mode-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>
      </div>
      <div>
        <h3 class="bst-mode-title">当前模式</h3>
        <div class="bst-mode-badges">
          <span class="bst-badge blue">{{ shopStore.shopMode === 'wholesale' ? '采购商模式' : '零售模式' }}</span>
          <span v-if="shopStore.shopMode === 'wholesale'" class="bst-badge amber">批发专属</span>
        </div>
      </div>
      <button class="bst-switch-btn" @click="switchMode">切换模式</button>
    </div>

    <div class="bst-sections">
      <div class="bst-section">
        <h3 class="bst-section-title">账户信息</h3>
        <div class="bst-field-grid">
          <div class="bst-field">
            <label class="bst-label">姓名 / 公司名</label>
            <input v-model="account.name" type="text" class="bst-input" placeholder="例如: 张伟 / Nomad Trading Co." />
          </div>
          <div class="bst-field">
            <label class="bst-label">联系邮箱</label>
            <input v-model="account.email" type="email" class="bst-input" placeholder="your@email.com" />
          </div>
          <div class="bst-field">
            <label class="bst-label">联系电话</label>
            <input v-model="account.phone" type="tel" class="bst-input" placeholder="+86 138-0000-0000" />
          </div>
          <div class="bst-field">
            <label class="bst-label">收货地址</label>
            <input v-model="account.address" type="text" class="bst-input" placeholder="省/市/区 详细地址" />
          </div>
        </div>
      </div>

      <div class="bst-section">
        <h3 class="bst-section-title">偏好设置</h3>
        <div class="bst-pref-list">
          <div class="bst-pref-item">
            <div>
              <p class="bst-pref-label">订单状态通知</p>
              <p class="bst-pref-desc">通过邮件接收订单状态更新</p>
            </div>
            <div class="bst-toggle" :class="{ on: prefs.orderNotify }" @click="prefs.orderNotify = !prefs.orderNotify">
              <div class="bst-toggle-dot"></div>
            </div>
          </div>
          <div class="bst-pref-item">
            <div>
              <p class="bst-pref-label">促销活动推送</p>
              <p class="bst-pref-desc">接收新品上架和优惠活动信息</p>
            </div>
            <div class="bst-toggle" :class="{ on: prefs.promo }" @click="prefs.promo = !prefs.promo">
              <div class="bst-toggle-dot"></div>
            </div>
          </div>
          <div class="bst-pref-item">
            <div>
              <p class="bst-pref-label">周报订阅</p>
              <p class="bst-pref-desc">每周一早上收到游牧社区精选内容</p>
            </div>
            <div class="bst-toggle" :class="{ on: prefs.newsletter }" @click="prefs.newsletter = !prefs.newsletter">
              <div class="bst-toggle-dot"></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bst-save-row">
      <span v-if="saved" class="bst-saved-tip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2.5" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
        已保存
      </span>
      <button class="bst-save-btn" @click="saveSettings">保存设置</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useShopStore } from '@/stores/shopStore'

const shopStore = useShopStore()
const router = useRouter()
const saved = ref(false)

const STORAGE_KEY = 'brand_user_settings'

const account = reactive({ name: '', email: '', phone: '', address: '' })
const prefs = reactive({ orderNotify: true, promo: false, newsletter: true })

onMounted(() => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const data = JSON.parse(stored)
      if (data.account) Object.assign(account, data.account)
      if (data.prefs) Object.assign(prefs, data.prefs)
    }
  } catch { /* ignore */ }
})

function saveSettings() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ account, prefs }))
  saved.value = true
  setTimeout(() => { saved.value = false }, 2500)
}

function switchMode() {
  shopStore.setShopMode(null)
  router.push('/brand')
}
</script>

<style scoped>
.brand-settings { padding: 40px 48px 80px; max-width: 800px; }
.bst-header { margin-bottom: 32px; }
.bst-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
.bst-sub { font-size: 14px; color: rgba(29,29,31,0.45); }

.bst-mode-card {
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  border-radius: 24px; padding: 28px 32px;
  display: flex; align-items: center; gap: 20px; margin-bottom: 36px;
}
.bst-mode-icon { width: 48px; height: 48px; border-radius: 14px; background: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.bst-mode-title { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.7); margin-bottom: 8px; }
.bst-mode-badges { display: flex; gap: 8px; flex-wrap: wrap; }
.bst-badge { font-size: 11px; font-weight: 700; padding: 4px 12px; border-radius: 999px; }
.bst-badge.blue { background: rgba(255,255,255,0.2); color: #fff; }
.bst-badge.amber { background: rgba(245,158,11,0.25); color: #f59e0b; }
.bst-switch-btn {
  margin-left: auto; padding: 10px 20px;
  background: rgba(255,255,255,0.15); color: #fff;
  border-radius: 12px; font-size: 13px; font-weight: 700;
  border: 1px solid rgba(255,255,255,0.2); cursor: pointer;
  transition: background 0.2s; flex-shrink: 0;
}
.bst-switch-btn:hover { background: rgba(255,255,255,0.25); }

.bst-sections { display: flex; flex-direction: column; gap: 32px; margin-bottom: 32px; }
.bst-section { background: #fff; border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.06); }
.bst-section-title { font-size: 11px; font-weight: 700; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(29,29,31,0.4); }
.bst-field-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.bst-field { display: flex; flex-direction: column; gap: 6px; }
.bst-label { font-size: 12px; font-weight: 600; color: rgba(29,29,31,0.5); }
.bst-input { padding: 12px 16px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 14px; outline: none; transition: border-color 0.2s; font-family: inherit; }
.bst-input:focus { border-color: #7c3aed; }

.bst-pref-list { display: flex; flex-direction: column; gap: 16px; }
.bst-pref-item { display: flex; justify-content: space-between; align-items: center; padding: 4px 0; }
.bst-pref-label { font-size: 14px; font-weight: 600; margin-bottom: 3px; }
.bst-pref-desc { font-size: 12px; color: rgba(29,29,31,0.45); }
.bst-toggle { width: 44px; height: 26px; border-radius: 999px; background: #e8e8ed; cursor: pointer; position: relative; transition: background 0.3s; flex-shrink: 0; }
.bst-toggle.on { background: #7c3aed; }
.bst-toggle-dot { position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; border-radius: 50%; background: #fff; transition: transform 0.3s; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.bst-toggle.on .bst-toggle-dot { transform: translateX(18px); }

.bst-save-row { display: flex; justify-content: flex-end; align-items: center; gap: 16px; }
.bst-saved-tip { display: flex; align-items: center; gap: 5px; font-size: 13px; font-weight: 600; color: #34c759; }
.bst-save-btn { padding: 14px 36px; background: #1d1d1f; color: #fff; border-radius: 14px; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; }
.bst-save-btn:hover { background: #7c3aed; }

@media (max-width: 768px) {
  .brand-settings { padding: 24px; }
  .bst-field-grid { grid-template-columns: 1fr; }
  .bst-mode-card { flex-wrap: wrap; }
}
</style>
