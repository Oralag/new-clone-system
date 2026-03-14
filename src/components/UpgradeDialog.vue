<template>
  <el-dialog
    v-model="visible"
    :width="step === 'pay' ? '480px' : '860px'"
    :show-close="false"
    append-to-body
    align-center
    class="upgrade-dialog-wrap"
  >
    <div class="ud">
      <button class="ud-close" @click="visible = false">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>

      <!-- ══════════ STEP 1: 选套餐 ══════════ -->
      <template v-if="step === 'plan'">
        <div class="ud-layout">

          <!-- Left: plans -->
          <div class="ud-left">
            <div class="ud-brand">
              <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
                <rect width="36" height="36" rx="8" fill="url(#udg)"/>
                <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue',Arial,sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
                <circle cx="27" cy="8" r="4" fill="#F19D38"/>
                <defs><linearGradient id="udg" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#1C2B48"/><stop offset="100%" stop-color="#1D3974"/></linearGradient></defs>
              </svg>
              <span>数字游牧 · 付费版</span>
            </div>
            <h2 class="ud-headline">选择适合您的方案</h2>
            <p class="ud-sub">独立数据库 · 按需解锁 · 专属技术支持</p>

            <!-- 级别切换 Tab -->
            <div class="tier-tabs">
              <button
                class="tier-tab"
                :class="{ active: activeTier === 'vip' }"
                @click="activeTier = 'vip'; selectedBilling = 'annual'"
              >
                <span class="tier-icon">⭐</span> VIP
              </button>
              <button
                class="tier-tab svip-tab"
                :class="{ active: activeTier === 'svip' }"
                @click="activeTier = 'svip'; selectedBilling = 'annual'"
              >
                <span class="tier-icon">👑</span> SVIP
                <span class="tier-badge">推荐</span>
              </button>
            </div>

            <!-- 付款周期选择 -->
            <div class="billing-selector">
              <button
                v-for="b in billingOptions"
                :key="b.id"
                class="billing-btn"
                :class="{ active: selectedBilling === b.id }"
                @click="selectedBilling = b.id"
              >
                {{ b.label }}
                <span v-if="b.tag" class="billing-tag">{{ b.tag }}</span>
              </button>
            </div>

            <!-- 价格展示 -->
            <div class="price-display" :class="activeTier === 'svip' ? 'price-svip' : ''">
              <div class="price-main">
                <span class="price-currency">¥</span>
                <span class="price-num">{{ currentPrice.price }}</span>
                <span class="price-period">/{{ currentPrice.period }}</span>
              </div>
              <div v-if="currentPrice.note" class="price-note">{{ currentPrice.note }}</div>
            </div>
          </div>

          <!-- Right: perms comparison -->
          <div class="ud-right">
            <div class="ud-perm-title">功能对比</div>
            <div class="ud-perms">
              <div v-for="g in currentPermGroups" :key="g.label" class="perm-group">
                <div class="perm-group-label">{{ g.label }}</div>
                <div class="perm-items">
                  <div v-for="item in g.items" :key="item.text" class="perm-item">
                    <span class="perm-check" :class="item.included ? 'check-yes' : 'check-no'">
                      {{ item.included ? '✓' : '✗' }}
                    </span>
                    <span :class="item.included ? '' : 'perm-dim'">{{ item.text }}</span>
                  </div>
                </div>
              </div>
            </div>
            <button class="ud-cta" :class="activeTier === 'svip' ? 'ud-cta-svip' : ''" @click="step = 'pay'">
              确认套餐，去付款
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
            <p class="ud-cta-note">付款后我们 2 小时内为您配置专属实例并激活账号</p>
          </div>
        </div>
      </template>

      <!-- ══════════ STEP 2: 扫码付款 ══════════ -->
      <template v-if="step === 'pay'">
        <div class="pay-wrap">
          <button class="pay-back" @click="step = 'plan'">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
            返回
          </button>

          <div class="pay-header">
            <div class="pay-title">扫码完成付款</div>
            <div class="pay-plan-info">
              已选：<strong>{{ activeTier === 'svip' ? 'SVIP' : 'VIP' }} · {{ currentPrice.label }}</strong>
              <span class="pay-price">¥{{ currentPrice.price }} / {{ currentPrice.period }}</span>
            </div>
          </div>

          <div class="qr-area">
            <div class="qr-box">
              <div class="qr-placeholder">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2" opacity="0.25">
                  <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
                  <rect x="5" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="16" y="5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="5" y="16" width="3" height="3" fill="currentColor" stroke="none"/>
                  <rect x="14" y="14" width="3" height="3" fill="currentColor" stroke="none"/><rect x="18" y="14" width="3" height="3" fill="currentColor" stroke="none"/><rect x="14" y="18" width="3" height="3" fill="currentColor" stroke="none"/><rect x="18" y="18" width="3" height="3" fill="currentColor" stroke="none"/>
                </svg>
                <div class="qr-placeholder-text">微信收款码</div>
                <div class="qr-placeholder-hint">请替换为实际二维码</div>
              </div>
            </div>
            <div class="qr-wechat-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#07C160"><path d="M9.5 4C5.36 4 2 6.91 2 10.5c0 1.99 1.03 3.78 2.66 4.97L4 18l2.74-1.37C7.72 16.87 8.6 17 9.5 17c.17 0 .33 0 .5-.01A5.97 5.97 0 009.5 15c0-3.31 2.91-6 6.5-6 .17 0 .33 0 .5.01C15.79 6.64 12.94 4 9.5 4zm-1.75 3.5a1 1 0 110 2 1 1 0 010-2zm3.5 0a1 1 0 110 2 1 1 0 010-2zM16 11c-2.76 0-5 1.79-5 4s2.24 4 5 4c.66 0 1.29-.1 1.87-.3L20 20l-.57-2.28A3.92 3.92 0 0021 15c0-2.21-2.24-4-5-4zm-1.25 2.5a.75.75 0 110 1.5.75.75 0 010-1.5zm2.5 0a.75.75 0 110 1.5.75.75 0 010-1.5z"/></svg>
              微信扫码付款
            </div>
          </div>

          <div class="pay-steps">
            <div class="pay-step"><span class="ps-num">1</span>微信扫描上方二维码</div>
            <div class="pay-step"><span class="ps-num">2</span>按提示完成付款</div>
            <div class="pay-step"><span class="ps-num">3</span>付款后点击下方按钮</div>
          </div>

          <button class="pay-confirm-btn" @click="step = 'done'">
            我已完成付款 →
          </button>

          <div class="pay-alt">
            也可添加微信 <strong>nomad_erp</strong> 或发邮件至 <strong>contact@nomaderp.com</strong> 由我们协助完成
          </div>
        </div>
      </template>

      <!-- ══════════ STEP 3: 完成 ══════════ -->
      <template v-if="step === 'done'">
        <div class="done-wrap">
          <div class="done-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <div class="done-title">付款信息已提交</div>
          <div class="done-desc">我们将在 <strong>2 小时内</strong>核实付款并为您激活专属实例<br/>激活后会通过微信 / 邮件通知您</div>
          <div class="done-contact">
            如需加急，请联系：<strong>nomad_erp</strong>（微信）
          </div>
          <button class="done-close-btn" @click="visible = false">好的，知道了</button>
        </div>
      </template>

    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const visible = ref(false)
const step = ref<'plan' | 'pay' | 'done'>('plan')
const activeTier = ref<'vip' | 'svip'>('vip')
const selectedBilling = ref<'monthly' | 'annual' | 'lifetime'>('annual')

const billingOptions = [
  { id: 'monthly', label: '月付' },
  { id: 'annual',  label: '年付', tag: '省钱' },
  { id: 'lifetime', label: '买断' },
]

const pricing = {
  vip: {
    monthly:  { price: '39',   period: '月', label: '月付',  note: '' },
    annual:   { price: '299',  period: '年', label: '年付',  note: '相当于 ¥25/月，省 ¥169' },
    lifetime: { price: '1599',  period: '永久', label: '买断', note: '一次付清，永久使用' },
  },
  svip: {
    monthly:  { price: '129',  period: '月', label: '月付',  note: '' },
    annual:   { price: '999',  period: '年', label: '年付',  note: '相当于 ¥83/月，省 ¥549' },
    lifetime: { price: '3999', period: '永久', label: '买断', note: '一次付清，含3年专属支持' },
  },
}

const currentPrice = computed(() => pricing[activeTier.value][selectedBilling.value])

const vipPerms = [
  {
    label: '核心业务',
    items: [
      { text: '客户 / 销售 / 采购管理', included: true },
      { text: '仓库 / 零售管理', included: true },
      { text: '财务管理', included: true },
      { text: '生产 / 委外管理', included: false },
      { text: '人事管理', included: false },
    ],
  },
  {
    label: '数据与安全',
    items: [
      { text: '专属独立数据库', included: true },
      { text: '数据永久保存', included: true },
      { text: '定期自动备份', included: true },
      { text: '多账号协作（10人）', included: true },
    ],
  },
  {
    label: 'AI 与分析',
    items: [
      { text: '报表 / 数据分析', included: true },
      { text: 'AI 智能助手', included: false },
      { text: 'AI 工作流自动化', included: false },
    ],
  },
  {
    label: '服务保障',
    items: [
      { text: '使用培训文档', included: true },
      { text: '标准技术支持', included: true },
      { text: '优先专属支持', included: false },
    ],
  },
]

const svipPerms = [
  {
    label: '全功能业务',
    items: [
      { text: '客户 / 销售 / 采购管理', included: true },
      { text: '仓库 / 零售管理', included: true },
      { text: '财务管理', included: true },
      { text: '生产 / 委外管理', included: true },
      { text: '人事管理', included: true },
    ],
  },
  {
    label: '数据与安全',
    items: [
      { text: '专属独立数据库', included: true },
      { text: '数据永久保存', included: true },
      { text: '定期自动备份', included: true },
      { text: '多账号协作（无限）', included: true },
    ],
  },
  {
    label: 'AI 与分析',
    items: [
      { text: '报表 / 数据分析', included: true },
      { text: 'AI 智能助手无限用', included: true },
      { text: 'AI 工作流自动化', included: true },
    ],
  },
  {
    label: '服务保障',
    items: [
      { text: '使用培训文档', included: true },
      { text: '2小时响应专属支持', included: true },
      { text: '数据迁移 + 专属配置', included: true },
    ],
  },
]

const currentPermGroups = computed(() => activeTier.value === 'svip' ? svipPerms : vipPerms)

function open() {
  step.value = 'plan'
  activeTier.value = 'vip'
  selectedBilling.value = 'annual'
  visible.value = true
}

defineExpose({ open })
</script>

<style>
.upgrade-dialog-wrap .el-dialog {
  border-radius: 24px !important;
  overflow: hidden;
  padding: 0 !important;
  transition: width 0.3s ease !important;
}
.upgrade-dialog-wrap .el-dialog__header { display: none !important; }
.upgrade-dialog-wrap .el-dialog__body { padding: 0 !important; }
</style>

<style scoped>
* { box-sizing: border-box; }

.ud {
  position: relative;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1d1d1f;
}

.ud-close {
  position: absolute; top: 16px; right: 16px; z-index: 10;
  width: 28px; height: 28px;
  border: none; background: rgba(0,0,0,0.06);
  border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  color: rgba(29,29,31,0.4);
  transition: background 0.15s;
}
.ud-close:hover { background: rgba(0,0,0,0.12); color: #1d1d1f; }

/* ── Layout ── */
.ud-layout {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 520px;
}

/* Left */
.ud-left {
  padding: 36px 32px;
  border-right: 1px solid rgba(0,0,0,0.06);
  display: flex; flex-direction: column;
}
.ud-brand {
  display: flex; align-items: center; gap: 9px;
  font-size: 13px; font-weight: 700; color: rgba(29,29,31,0.45);
  margin-bottom: 20px;
}
.ud-headline { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin: 0 0 6px; }
.ud-sub { font-size: 13px; color: rgba(29,29,31,0.42); font-weight: 500; margin: 0 0 20px; }

/* Tier Tabs */
.tier-tabs {
  display: flex; gap: 8px; margin-bottom: 16px;
}
.tier-tab {
  flex: 1; padding: 10px 14px;
  border: 1.5px solid rgba(0,0,0,0.1);
  border-radius: 12px; cursor: pointer;
  background: #fff;
  font-size: 14px; font-weight: 700; color: rgba(29,29,31,0.5);
  display: flex; align-items: center; justify-content: center; gap: 5px;
  transition: all 0.2s; position: relative;
}
.tier-tab:hover { border-color: rgba(0,0,0,0.2); color: #1d1d1f; }
.tier-tab.active {
  border-color: #1d1d1f; background: #1d1d1f; color: #fff;
}
.svip-tab.active {
  border-color: #7c3aed;
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}
.tier-icon { font-size: 15px; }
.tier-badge {
  position: absolute; top: -8px; right: 8px;
  font-size: 9px; font-weight: 800;
  background: #f59e0b; color: #fff;
  padding: 2px 6px; border-radius: 999px;
  letter-spacing: 0.04em;
}

/* Billing Selector */
.billing-selector {
  display: flex; gap: 6px; margin-bottom: 20px;
}
.billing-btn {
  flex: 1; padding: 8px 10px;
  border: 1.5px solid rgba(0,0,0,0.09);
  border-radius: 10px; cursor: pointer;
  background: #fff;
  font-size: 12px; font-weight: 600; color: rgba(29,29,31,0.45);
  transition: all 0.15s;
  display: flex; flex-direction: column; align-items: center; gap: 2px;
}
.billing-btn:hover { border-color: rgba(0,0,0,0.2); color: #1d1d1f; }
.billing-btn.active { border-color: #1d1d1f; background: #f5f5f7; color: #1d1d1f; }
.billing-tag {
  font-size: 9px; font-weight: 700;
  background: #34d399; color: #fff;
  padding: 1px 5px; border-radius: 999px;
}

/* Price Display */
.price-display {
  flex: 1;
  display: flex; flex-direction: column; justify-content: center;
  background: #f5f5f7;
  border-radius: 16px; padding: 24px 20px;
  margin-bottom: 0;
  border: 1.5px solid rgba(0,0,0,0.06);
}
.price-svip {
  background: linear-gradient(135deg, #f5f3ff, #ede9fe);
  border-color: rgba(124,58,237,0.15);
}
.price-main {
  display: flex; align-items: baseline; gap: 3px;
  margin-bottom: 6px;
}
.price-currency { font-size: 18px; font-weight: 700; color: #1d1d1f; }
.price-num { font-size: 48px; font-weight: 900; letter-spacing: -0.05em; color: #1d1d1f; line-height: 1; }
.price-svip .price-num { color: #7c3aed; }
.price-period { font-size: 14px; color: rgba(29,29,31,0.4); font-weight: 500; margin-left: 3px; }
.price-note { font-size: 12px; color: rgba(29,29,31,0.45); font-weight: 500; }
.price-svip .price-note { color: rgba(124,58,237,0.6); }

/* Right */
.ud-right {
  padding: 36px 32px;
  display: flex; flex-direction: column;
  background: #fafafa;
}
.ud-perm-title {
  font-size: 11px; font-weight: 700; text-transform: uppercase;
  letter-spacing: 0.1em; color: rgba(29,29,31,0.35);
  margin-bottom: 16px;
}
.ud-perms { display: flex; flex-direction: column; gap: 16px; flex: 1; }
.perm-group {}
.perm-group-label {
  font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.5);
  text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px;
}
.perm-items { display: flex; flex-direction: column; gap: 3px; }
.perm-item { font-size: 12.5px; color: #1d1d1f; font-weight: 500; display: flex; align-items: center; gap: 7px; }
.perm-check { font-weight: 800; font-size: 11px; flex-shrink: 0; width: 14px; }
.check-yes { color: #0071e3; }
.check-no { color: rgba(29,29,31,0.2); }
.perm-dim { color: rgba(29,29,31,0.3); }

.ud-cta {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: 14px;
  background: #1d1d1f; color: #fff;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  margin-top: 20px;
  transition: background 0.2s, transform 0.2s;
}
.ud-cta:hover { background: #3a3a3a; transform: scale(0.98); }
.ud-cta-svip {
  background: linear-gradient(135deg, #7c3aed, #a855f7);
}
.ud-cta-svip:hover { background: linear-gradient(135deg, #6d28d9, #9333ea); }
.ud-cta-note {
  font-size: 11px; color: rgba(29,29,31,0.35);
  text-align: center; margin-top: 10px; line-height: 1.5;
}

/* ── Pay step ── */
.pay-wrap {
  padding: 36px 40px 28px;
  display: flex; flex-direction: column; align-items: center;
}
.pay-back {
  align-self: flex-start;
  display: flex; align-items: center; gap: 5px;
  background: none; border: none; cursor: pointer;
  font-size: 13px; color: rgba(29,29,31,0.4); font-weight: 600;
  margin-bottom: 20px; padding: 0;
  transition: color 0.15s;
}
.pay-back:hover { color: #1d1d1f; }
.pay-header { text-align: center; margin-bottom: 24px; width: 100%; }
.pay-title { font-size: 20px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
.pay-plan-info { font-size: 13px; color: rgba(29,29,31,0.45); }
.pay-plan-info strong { color: #1d1d1f; }
.pay-price { margin-left: 8px; font-weight: 700; color: #1d1d1f; font-size: 14px; }

.qr-area { display: flex; flex-direction: column; align-items: center; margin-bottom: 20px; }
.qr-box {
  width: 180px; height: 180px;
  border: 1.5px solid rgba(0,0,0,0.09);
  border-radius: 16px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 10px; background: #fff;
  overflow: hidden;
}
.qr-placeholder {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
}
.qr-placeholder-text { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.35); }
.qr-placeholder-hint { font-size: 10px; color: rgba(29,29,31,0.2); }
.qr-box img { width: 100%; height: 100%; object-fit: cover; border-radius: 14px; }

.qr-wechat-icon {
  display: flex; align-items: center; gap: 5px;
  font-size: 12px; font-weight: 600; color: #07C160;
}

.pay-steps {
  display: flex; gap: 20px; margin-bottom: 24px;
  width: 100%;
}
.pay-step {
  flex: 1; display: flex; flex-direction: column; align-items: center; gap: 7px;
  font-size: 12px; color: rgba(29,29,31,0.5); text-align: center; line-height: 1.4;
}
.ps-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: #1d1d1f; color: #fff;
  font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}

.pay-confirm-btn {
  width: 100%; padding: 15px;
  background: #1d1d1f; color: #fff;
  border: none; border-radius: 12px;
  font-size: 15px; font-weight: 700; cursor: pointer;
  margin-bottom: 14px;
  transition: background 0.2s;
}
.pay-confirm-btn:hover { background: #3a3a3a; }

.pay-alt {
  font-size: 11px; color: rgba(29,29,31,0.35);
  text-align: center; line-height: 1.6;
}
.pay-alt strong { color: rgba(29,29,31,0.6); }

/* ── Done step ── */
.done-wrap {
  padding: 48px 40px 36px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
}
.done-icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: #1d1d1f;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px;
}
.done-title { font-size: 22px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 10px; }
.done-desc { font-size: 14px; color: rgba(29,29,31,0.5); line-height: 1.7; margin-bottom: 16px; }
.done-desc strong { color: #1d1d1f; }
.done-contact {
  font-size: 12px; color: rgba(29,29,31,0.38);
  background: #f5f5f7; padding: 10px 18px; border-radius: 10px;
  margin-bottom: 24px;
}
.done-contact strong { color: #1d1d1f; }
.done-close-btn {
  width: 280px; padding: 14px;
  background: #1d1d1f; color: #fff;
  border: none; border-radius: 12px;
  font-size: 14px; font-weight: 700; cursor: pointer;
  transition: background 0.2s;
}
.done-close-btn:hover { background: #3a3a3a; }

/* ── Responsive ── */
@media (max-width: 640px) {
  .ud-layout { grid-template-columns: 1fr; }
  .ud-left { border-right: none; border-bottom: 1px solid rgba(0,0,0,0.06); }
}
</style>
