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

    <!-- 拼多多直连模态框 -->
    <div v-if="pddModal" class="modal-mask" @click.self="pddModal = false">
      <div class="modal-box">
        <div class="modal-title">直连拼多多开放平台</div>
        <div class="modal-sub">
          在
          <a href="https://open.pinduoduo.com/application/developermanage" target="_blank" class="modal-link">拼多多开放平台</a>
          创建应用，获取以下三项凭证后填入
        </div>

        <div class="modal-form">
          <div class="form-row">
            <label>Client ID（App Key）</label>
            <input v-model="pddClientId" class="form-input" placeholder="开放平台应用的 Client ID" />
            <div class="form-hint">开放平台 → 应用管理 → 应用详情 → Client ID</div>
          </div>

          <div class="form-row">
            <label>Client Secret</label>
            <input v-model="pddClientSecret" class="form-input" type="password" placeholder="Client Secret" />
          </div>

          <div class="form-row">
            <label>Access Token</label>
            <div class="token-row">
              <input v-model="pddAccessToken" class="form-input token-input" placeholder="店铺授权后获取的 access_token" />
              <button
                class="oauth-btn"
                :disabled="!pddClientId"
                :title="pddClientId ? '跳转 PDD 授权页获取 token' : '请先填写 Client ID'"
                @click="startOAuth"
              >去授权</button>
            </div>
            <div class="form-hint">
              先填好 Client ID，点「去授权」在新标签完成授权后 token 会自动写入；
              也可在 PDD 开放平台手动复制 access_token 填入
            </div>
          </div>

          <div class="form-row">
            <label>店铺名称 <span class="label-opt">选填</span></label>
            <input v-model="pddShopName" class="form-input" placeholder="如：我的拼多多旗舰店" />
          </div>
        </div>

        <div class="modal-actions">
          <button class="modal-cancel" @click="pddModal = false">取消</button>
          <button class="modal-confirm" :disabled="pddSaving" @click="savePddConfig">
            {{ pddSaving ? '保存中...' : '保存并接入' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 其他平台中间件模态框 -->
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePlatforms } from '@/composables/usePlatforms'
import type { Platform } from '@/composables/usePlatforms'

const { platforms } = usePlatforms()
const route = useRoute()

// ── 拼多多直连 ──────────────────────────────────────────────────────────────
const pddModal = ref(false)
const pddClientId = ref('')
const pddClientSecret = ref('')
const pddAccessToken = ref('')
const pddShopName = ref('')
const pddSaving = ref(false)

const PDD_OAUTH_CALLBACK = `${location.origin}/api/pdd/oauth-callback`

function openPddModal() {
  // 预填已保存的 client_id（不回填 secret）
  fetch('/api/pdd/config').then(r => r.json()).then((d: any) => {
    if (d.client_id) pddClientId.value = d.client_id
    if (d.shop_name) pddShopName.value = d.shop_name
  }).catch(() => {})
  pddModal.value = true
}

function startOAuth() {
  if (!pddClientId.value.trim()) return
  const authUrl = `https://mms.pinduoduo.com/open.html?response_type=token&client_id=${encodeURIComponent(pddClientId.value.trim())}&redirect_uri=${encodeURIComponent(PDD_OAUTH_CALLBACK)}&state=pdd_auth`
  window.open(authUrl, '_blank', 'width=900,height=700')
}

async function savePddConfig() {
  if (!pddClientId.value.trim() || !pddClientSecret.value.trim()) {
    ElMessage({ message: '请填写 Client ID 和 Client Secret', type: 'warning' })
    return
  }
  if (!pddAccessToken.value.trim()) {
    ElMessage({ message: '请填写 Access Token（点「去授权」获取）', type: 'warning' })
    return
  }
  pddSaving.value = true
  try {
    const res = await fetch('/api/pdd/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: pddClientId.value.trim(),
        client_secret: pddClientSecret.value.trim(),
        access_token: pddAccessToken.value.trim(),
        shop_name: pddShopName.value.trim(),
      }),
    })
    const data = await res.json() as any
    if (!res.ok) throw new Error(data.error || '保存失败')

    const pdd = platforms.value.find(p => p.id === 'pdd')!
    pdd.connected = true
    pdd.shopName = pddShopName.value.trim() || '我的拼多多店铺'
    pddModal.value = false
    ElMessage({ message: '拼多多直连配置已保存，订单数据开始同步', type: 'success' })
  } catch (e: any) {
    ElMessage({ message: e.message, type: 'error' })
  } finally {
    pddSaving.value = false
  }
}

async function disconnectPdd() {
  try {
    await ElMessageBox.confirm(
      '断开后将删除已保存的 PDD 凭证，停止同步订单数据，已有数据不受影响。',
      '断开拼多多',
      { confirmButtonText: '确认断开', cancelButtonText: '取消', type: 'warning' },
    )
    await fetch('/api/pdd/config', { method: 'DELETE' })
    const pdd = platforms.value.find(p => p.id === 'pdd')!
    pdd.connected = false
    pdd.shopName = ''
    ElMessage({ message: '拼多多已断开', type: 'info' })
  } catch {
    // 用户取消
  }
}

// OAuth 回调后携带 ?pdd_auth=success，检测并提示
onMounted(() => {
  if (route.query.pdd_auth === 'success') {
    fetch('/api/pdd/config').then(r => r.json()).then((d: any) => {
      const pdd = platforms.value.find(p => p.id === 'pdd')
      if (pdd && d.configured && d.has_access_token) {
        pdd.connected = true
        if (d.shop_name) pdd.shopName = d.shop_name
      }
    }).catch(() => {})
    ElMessage({ message: 'PDD 授权成功，access_token 已保存', type: 'success' })
  } else if (route.query.pdd_auth === 'fail') {
    ElMessage({ message: 'PDD 授权失败，请重试', type: 'error' })
  }
})

// ── 其他平台（中间件模式）──────────────────────────────────────────────────
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
    q: '拼多多是直连还是中间件？',
    a: '拼多多使用直连模式——通过拼多多开放平台的 OAuth 授权，直接调用官方 API 拉取订单和商品数据，无需中间件。',
  },
  {
    q: '其他平台需要自己申请开发者资质吗？',
    a: '不需要。其他平台通过旺店通/聚水潭等中间件接入，中间件持有服务商资质，你只需在中间件后台扫码授权店铺即可。',
  },
  {
    q: '数据同步有延迟吗？',
    a: '默认按需拉取，每次进入订单页自动请求最新数据。中间件支持 Webhook 实时推送（1-5分钟内），需在中间件后台开启。',
  },
  {
    q: '平台数据安全吗？',
    a: '凭证加密存储在 Cloudflare KV，仅读取订单、库存、物流数据，不涉及资金操作。OAuth 授权可随时在平台端撤销。',
  },
]

const configPlatform = ref<Platform | null>(null)
const formMiddleware = ref('wdt')
const formKey = ref('')
const formSecret = ref('')
const formShop = ref('')

const currentMiddleware = computed(
  () => MIDDLEWARES.find(m => m.value === formMiddleware.value) ?? MIDDLEWARES[0],
)

function handleConnect(p: Platform) {
  if (p.id === 'pdd') {
    openPddModal()
    return
  }
  configPlatform.value = p
  formMiddleware.value = 'wdt'
  formKey.value = ''
  formSecret.value = ''
  formShop.value = ''
}

async function handleDisconnect(p: Platform) {
  if (p.id === 'pdd') {
    await disconnectPdd()
    return
  }
  try {
    await ElMessageBox.confirm(
      `断开后将停止从 ${p.name} 同步数据，已有数据不受影响。`,
      `断开 ${p.name}`,
      { confirmButtonText: '确认断开', cancelButtonText: '取消', type: 'warning' },
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

.modal-confirm:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.modal-link {
  color: #0f766e;
  text-decoration: underline;
  font-weight: 600;
}

.token-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.token-input {
  flex: 1;
}

.oauth-btn {
  border: none;
  background: linear-gradient(135deg, #e02020, #f97316);
  color: #fff;
  border-radius: 10px;
  padding: 0 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
}

.oauth-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
