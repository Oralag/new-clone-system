<template>
  <div class="platforms-page">

    <section class="intro-band">
      <div class="intro-left">
        <div class="intro-title">平台接入</div>
        <div class="intro-sub">通过中间件（旺店通 / 聚水潭）统一拉取各平台订单与库存，无需逐个申请平台开发者资质</div>
      </div>
      <div class="middleware-tag">
        <span class="mw-dot"></span>
        中间件模式 — 一次接入覆盖全平台
      </div>
    </section>

    <section class="platform-grid">
      <div
        v-for="p in platforms"
        :key="p.id"
        class="pcard"
        :class="p.connected ? 'pcard-on' : ''"
      >
        <div class="pcard-head">
          <div class="pcard-icon" :style="{ background: p.connected ? p.color : '#e2e8f0' }">
            {{ p.emoji }}
          </div>
          <div class="pcard-info">
            <div class="pcard-name">{{ p.name }}</div>
            <div class="pcard-desc">{{ p.desc }}</div>
          </div>
          <div class="pcard-status" :class="p.connected ? 'status-on' : 'status-off'">
            {{ p.connected ? '已接入' : '未接入' }}
          </div>
        </div>

        <div class="pcard-features">
          <span v-for="f in p.features" :key="f" class="pcard-feat">{{ f }}</span>
        </div>

        <div class="pcard-foot">
          <span v-if="p.connected" class="pcard-sync">
            通过 {{ p.middleware || '中间件' }} 同步中
          </span>
          <span v-else class="pcard-waiting">未接入</span>
          <button
            v-if="!p.connected"
            class="pcard-btn pcard-btn-primary"
            @click="handleConnect(p)"
          >接入</button>
          <button
            v-else
            class="pcard-btn pcard-btn-ghost"
            @click="handleDisconnect(p)"
          >断开</button>
        </div>
      </div>
    </section>

    <section class="how-section">
      <div class="how-title">接入流程</div>
      <div class="how-grid">
        <div class="how-card">
          <div class="how-num">1</div>
          <div class="how-text">
            <div class="how-name">注册中间件账号</div>
            <div class="how-desc">在旺店通或聚水潭注册企业账号，完成实名认证（约1-2个工作日）</div>
          </div>
        </div>
        <div class="how-card">
          <div class="how-num">2</div>
          <div class="how-text">
            <div class="how-name">在中间件授权电商店铺</div>
            <div class="how-desc">在中间件后台扫码授权各平台店铺，无需申请平台开发者资质</div>
          </div>
        </div>
        <div class="how-card">
          <div class="how-num">3</div>
          <div class="how-text">
            <div class="how-name">填入 App Key + Secret</div>
            <div class="how-desc">在中间件后台「开放平台 → 应用管理」获取凭证，填入上方接入弹框</div>
          </div>
        </div>
        <div class="how-card">
          <div class="how-num">4</div>
          <div class="how-text">
            <div class="how-name">数据自动流入 ERP</div>
            <div class="how-desc">订单、库存、物流状态每30分钟自动同步，运营专员随即开始分析</div>
          </div>
        </div>
      </div>
    </section>

    <section class="faq-section">
      <div class="faq-title">常见问题</div>
      <div class="faq-list">
        <div v-for="faq in FAQS" :key="faq.q" class="faq-item">
          <div class="faq-q">{{ faq.q }}</div>
          <div class="faq-a">{{ faq.a }}</div>
        </div>
      </div>
    </section>

    <div v-if="configPlatform" class="modal-mask" @click.self="configPlatform = null">
      <div class="modal-box">
        <div class="modal-title">通过中间件接入 {{ configPlatform.name }}</div>
        <div class="modal-sub">在中间件后台授权店铺后，将应用凭证填入下方，系统通过中间件拉取数据</div>

        <div class="modal-form">
          <div class="form-row">
            <label>中间件</label>
            <div class="mw-selector">
              <button
                v-for="mw in MIDDLEWARES"
                :key="mw.value"
                class="mw-opt"
                :class="{ 'mw-opt-active': formMiddleware === mw.value }"
                @click="formMiddleware = mw.value"
              >{{ mw.label }}</button>
            </div>
          </div>

          <div class="form-row">
            <label>App Key</label>
            <input
              v-model="formKey"
              class="form-input"
              :placeholder="currentMiddleware.keyPlaceholder"
            />
            <div class="form-hint">{{ currentMiddleware.keyHint }}</div>
          </div>

          <div class="form-row">
            <label>App Secret</label>
            <input
              v-model="formSecret"
              class="form-input"
              type="password"
              :placeholder="currentMiddleware.secretPlaceholder"
            />
          </div>

          <div class="form-row">
            <label>店铺名称 <span class="label-opt">选填</span></label>
            <input v-model="formShop" class="form-input" placeholder="如：我的旗舰店" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-cancel" @click="configPlatform = null">取消</button>
          <button class="modal-confirm" @click="confirmConnect">确认接入</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlatforms } from '@/composables/usePlatforms'
import type { Platform } from '@/composables/usePlatforms'

const { platforms } = usePlatforms()

const MIDDLEWARES = [
  {
    value: 'wdt',
    label: '旺店通',
    keyPlaceholder: '旺店通 App Key',
    secretPlaceholder: '旺店通 App Secret',
    keyHint: '旺店通后台 → 开放平台 → 我的应用 → App Key',
  },
  {
    value: 'jst',
    label: '聚水潭',
    keyPlaceholder: '聚水潭 App Key',
    secretPlaceholder: '聚水潭 App Secret',
    keyHint: '聚水潭后台 → 应用中心 → 开放应用 → App Key',
  },
  {
    value: 'other',
    label: '其他',
    keyPlaceholder: '中间件 App Key',
    secretPlaceholder: '中间件 App Secret',
    keyHint: '在中间件开放平台的应用管理页获取',
  },
]

const FAQS = [
  {
    q: '需要自己去平台申请开发者资质吗？',
    a: '不需要。中间件持有各平台的服务商资质，你只需在中间件后台扫码授权店铺即可，无需直接面对平台的开发者申请流程。',
  },
  {
    q: '中间件收费吗？',
    a: '旺店通和聚水潭均提供试用版本，商业版按功能模块和订单量收费，具体价格建议直接咨询两家官网获取最新报价。',
  },
  {
    q: '数据同步有延迟吗？',
    a: '默认每30分钟轮询同步一次。中间件支持 Webhook 实时推送（1-5分钟内），需在中间件后台开启对应配置。',
  },
  {
    q: '平台数据安全吗？',
    a: '中间件仅读取订单、库存、物流数据，不涉及资金操作。各平台的 OAuth 授权可随时在平台端撤销，数据访问完全可控。',
  },
]

const configPlatform = ref<Platform | null>(null)
const formMiddleware = ref('wdt')
const formKey = ref('')
const formSecret = ref('')
const formShop = ref('')

const currentMiddleware = computed(
  () => MIDDLEWARES.find(m => m.value === formMiddleware.value) ?? MIDDLEWARES[0]
)

function handleConnect(p: Platform) {
  configPlatform.value = p
  formMiddleware.value = 'wdt'
  formKey.value = ''
  formSecret.value = ''
  formShop.value = ''
}

async function handleDisconnect(p: Platform) {
  try {
    await ElMessageBox.confirm(
      `断开后将停止从 ${p.name} 同步数据，已有数据不受影响。`,
      `断开 ${p.name}`,
      { confirmButtonText: '确认断开', cancelButtonText: '取消', type: 'warning' }
    )
    p.connected = false
    p.shopName = ''
    ;(p as any).middleware = ''
    ElMessage({ message: `${p.name} 已断开`, type: 'info' })
  } catch {
    // 用户取消
  }
}

function confirmConnect() {
  if (!formKey.value.trim() || !formSecret.value.trim()) {
    ElMessage({ message: '请填写 App Key 和 App Secret', type: 'warning' })
    return
  }
  const p = configPlatform.value!
  p.connected = true
  p.shopName = formShop.value.trim() || p.name + '店铺'
  ;(p as any).middleware = MIDDLEWARES.find(m => m.value === formMiddleware.value)?.label ?? '中间件'
  configPlatform.value = null
  ElMessage({ message: `${p.name} 接入成功，数据同步中`, type: 'success' })
}
</script>

<style scoped>
.platforms-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.intro-band {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  padding: 20px 22px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.intro-title {
  font-size: 20px;
  font-weight: 800;
  color: #0f172a;
}

.intro-sub {
  margin-top: 4px;
  font-size: 13px;
  color: #64748b;
}

.middleware-tag {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border-radius: 12px;
  background: rgba(13, 148, 136, 0.08);
  border: 1px solid rgba(13, 148, 136, 0.15);
  font-size: 12px;
  font-weight: 600;
  color: #0f766e;
  white-space: nowrap;
}

.mw-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #14b8a6;
  animation: pulse 2s infinite;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.platform-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 12px;
}

.pcard {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  padding: 18px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-direction: column;
  gap: 12px;
  transition: box-shadow 0.18s ease;
}

.pcard-on {
  border-color: rgba(13, 148, 136, 0.22);
  box-shadow: 0 4px 20px rgba(13, 148, 136, 0.08);
}

.pcard:hover {
  box-shadow: 0 8px 30px rgba(15, 23, 42, 0.1);
}

.pcard-head { display: flex; align-items: center; gap: 10px; }

.pcard-icon {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
  transition: background 0.2s;
}

.pcard-info { flex: 1; }
.pcard-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.pcard-desc { font-size: 11px; color: #64748b; margin-top: 2px; }

.pcard-status {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  flex-shrink: 0;
}
.status-on { background: rgba(16, 185, 129, 0.1); color: #059669; }
.status-off { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }

.pcard-features {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.pcard-feat {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  background: #f1f5f9;
  color: #475569;
}

.pcard-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pcard-sync { font-size: 11px; color: #059669; }
.pcard-waiting { font-size: 11px; color: #94a3b8; }

.pcard-btn {
  border-radius: 10px;
  padding: 7px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.pcard-btn-primary {
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
}

.pcard-btn-ghost {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  color: #64748b;
}
.pcard-btn-ghost:hover { background: #f8fafc; }

.how-section, .faq-section {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.how-title, .faq-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
  margin-bottom: 14px;
}

.how-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.how-card {
  display: flex;
  gap: 10px;
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.how-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(13, 148, 136, 0.12);
  color: #0f766e;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.how-name { font-size: 13px; font-weight: 700; color: #0f172a; }
.how-desc { margin-top: 4px; font-size: 11px; color: #64748b; line-height: 1.5; }

.faq-list { display: flex; flex-direction: column; gap: 10px; }

.faq-item {
  padding: 14px;
  border-radius: 14px;
  background: #f8fafc;
}

.faq-q { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
.faq-a { font-size: 12px; color: #64748b; line-height: 1.6; }

.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-box {
  background: #fff;
  border-radius: 24px;
  padding: 28px;
  width: 460px;
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.2);
}

.modal-title {
  font-size: 17px;
  font-weight: 800;
  color: #0f172a;
  margin-bottom: 4px;
}

.modal-sub {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 20px;
  line-height: 1.5;
}

.modal-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 20px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row label {
  font-size: 12px;
  font-weight: 600;
  color: #475569;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label-opt {
  font-size: 10px;
  font-weight: 500;
  color: #94a3b8;
  background: #f1f5f9;
  padding: 1px 6px;
  border-radius: 4px;
}

.mw-selector {
  display: flex;
  gap: 8px;
}

.mw-opt {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #f8fafc;
  font-size: 13px;
  font-weight: 600;
  color: #475569;
  cursor: pointer;
  transition: all 0.15s;
}

.mw-opt-active {
  background: rgba(13, 148, 136, 0.08);
  border-color: rgba(13, 148, 136, 0.3);
  color: #0f766e;
}

.form-input {
  border: 1px solid rgba(148, 163, 184, 0.25);
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 13px;
  color: #0f172a;
  outline: none;
  background: #fafbfc;
}

.form-input:focus {
  border-color: rgba(13, 148, 136, 0.4);
  background: #fff;
}

.form-hint {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
}

.modal-cancel {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 600;
  color: #64748b;
  cursor: pointer;
}

.modal-confirm {
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  border-radius: 12px;
  padding: 10px 20px;
  font-size: 13px;
  font-weight: 700;
  color: #fff;
  cursor: pointer;
}
</style>
