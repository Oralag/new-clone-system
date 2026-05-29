<template>
  <div class="mt-page">

    <!-- 未配置状态 -->
    <div v-if="!configured" class="setup-card">
      <div class="setup-icon">🍱</div>
      <div class="setup-title">接入美团外卖</div>
      <div class="setup-desc">粘贴你的美团商家后台 Cookie，每天自动同步订单、营收、评价数据</div>

      <div class="setup-steps">
        <div class="step">
          <div class="step-num">1</div>
          <div class="step-text">用 Chrome 打开 <strong>e.waimai.meituan.com</strong> 并登录</div>
        </div>
        <div class="step">
          <div class="step-num">2</div>
          <div class="step-text">按 <kbd>F12</kbd> 打开开发者工具 → Network 标签</div>
        </div>
        <div class="step">
          <div class="step-num">3</div>
          <div class="step-text">随便点一下页面，找任意一个请求，在 Headers 里复制 <strong>Cookie</strong> 的值</div>
        </div>
        <div class="step">
          <div class="step-num">4</div>
          <div class="step-text">粘贴到下方输入框</div>
        </div>
      </div>

      <div class="setup-form">
        <div class="form-row">
          <label>店铺名称</label>
          <input v-model="shopName" class="form-input" placeholder="如：我的美团外卖店" />
        </div>
        <div class="form-row">
          <label>Cookie <span class="req">*</span></label>
          <textarea
            v-model="cookieInput"
            class="form-textarea"
            placeholder="粘贴 Cookie 字符串，通常很长，类似：_lxsdk=xxx; token=xxx; ..."
            rows="4"
          />
        </div>
        <button class="btn-primary" :disabled="saving" @click="saveConfig">
          {{ saving ? '保存中...' : '保存并连接' }}
        </button>
      </div>
    </div>

    <!-- 已配置状态：监控仪表盘 -->
    <template v-else>
      <!-- 顶部工具栏 -->
      <div class="dash-toolbar">
        <div class="dash-title">
          <span class="dash-icon">🍱</span>
          <span>{{ data?.shopName || '美团外卖' }}</span>
          <span class="dash-date">{{ selectedDate }}</span>
        </div>
        <div class="toolbar-right">
          <input type="date" v-model="selectedDate" class="date-picker" @change="loadData" />
          <button class="btn-sync" :disabled="syncing" @click="triggerSync">
            <span v-if="syncing" class="spin">⟳</span>
            {{ syncing ? '同步中...' : '立即同步' }}
          </button>
          <button class="btn-ghost" @click="configured = false">重新配置</button>
        </div>
      </div>

      <!-- 同步状态提示 -->
      <div v-if="data?.cookieExpired" class="alert-warn">
        ⚠️ Cookie 已过期，请重新登录美团商家后台，复制新的 Cookie 粘贴到配置中
        <button class="alert-btn" @click="configured = false">去更新</button>
      </div>
      <div v-if="lastSync" class="sync-info">上次同步：{{ lastSync }}</div>

      <!-- 暂无数据 -->
      <div v-if="!data && !loading" class="empty-state">
        <div class="empty-icon">📊</div>
        <div class="empty-text">暂无 {{ selectedDate }} 的数据</div>
        <button class="btn-primary" @click="triggerSync">立即拉取</button>
      </div>

      <template v-if="data">
        <!-- 核心指标 -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">今日订单</div>
            <div class="metric-value">{{ data.orders?.total ?? '--' }}</div>
            <div class="metric-sub">单</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">今日营收</div>
            <div class="metric-value">¥{{ data.orders?.revenue ?? '--' }}</div>
            <div class="metric-sub">含配送费</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">收到评价</div>
            <div class="metric-value">{{ data.reviews?.total ?? '--' }}</div>
            <div class="metric-sub">条</div>
          </div>
          <div class="metric-card" :class="{ 'metric-warn': (data.reviews?.bad ?? 0) > 0 }">
            <div class="metric-label">差评预警</div>
            <div class="metric-value">{{ data.reviews?.bad ?? 0 }}</div>
            <div class="metric-sub">≤2星</div>
          </div>
        </div>

        <!-- 热销菜品 + 差评列表 -->
        <div class="detail-grid">
          <!-- 热销菜品 -->
          <div class="detail-card">
            <div class="detail-title">🔥 热销菜品 TOP5</div>
            <div v-if="topDishes.length === 0" class="detail-empty">暂无数据</div>
            <div v-for="(dish, i) in topDishes" :key="i" class="dish-row">
              <div class="dish-rank" :class="`rank-${i + 1}`">{{ i + 1 }}</div>
              <div class="dish-name">{{ dish.foodName || dish.name || '未知菜品' }}</div>
              <div class="dish-count">{{ dish.count || dish.num || 0 }} 份</div>
            </div>
          </div>

          <!-- 差评列表 -->
          <div class="detail-card">
            <div class="detail-title">⚠️ 差评列表</div>
            <div v-if="badReviews.length === 0" class="detail-empty">今日暂无差评 🎉</div>
            <div v-for="(r, i) in badReviews" :key="i" class="review-row">
              <div class="review-star">{{ '★'.repeat(r.starLevel || r.star || 1) }}</div>
              <div class="review-text">{{ r.comment || r.content || '无内容' }}</div>
              <div class="review-time">{{ formatTime(r.postTime || r.time) }}</div>
            </div>
          </div>
        </div>
      </template>
    </template>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

const configured = ref(false)
const saving = ref(false)
const syncing = ref(false)
const loading = ref(false)
const shopName = ref('')
const cookieInput = ref('')
const data = ref<any>(null)
const lastSync = ref('')
const selectedDate = ref(new Date().toISOString().slice(0, 10))

const topDishes = computed(() => data.value?.topDishes || [])
const badReviews = computed(() =>
  (data.value?.reviews?.list || []).filter((r: any) => (r.starLevel || r.star || 5) <= 2)
)

function formatTime(ts: any) {
  if (!ts) return ''
  const d = new Date(typeof ts === 'number' ? ts * 1000 : ts)
  return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function checkConfig() {
  const res = await fetch('/api/meituan-config')
  const json = await res.json()
  configured.value = json.configured
  if (json.lastSync) {
    lastSync.value = new Date(json.lastSync).toLocaleString('zh-CN')
  }
}

async function saveConfig() {
  if (!cookieInput.value.trim()) {
    ElMessage.warning('请粘贴 Cookie')
    return
  }
  saving.value = true
  try {
    const res = await fetch('/api/meituan-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie: cookieInput.value, shopName: shopName.value }),
    })
    const json = await res.json()
    if (json.ok) {
      ElMessage.success('配置已保存，正在同步数据...')
      configured.value = true
      await triggerSync()
    } else {
      ElMessage.error(json.message || '保存失败')
    }
  } finally {
    saving.value = false
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await fetch(`/api/meituan-sync?date=${selectedDate.value}`)
    const json = await res.json()
    if (json.ok) {
      data.value = json
    } else {
      data.value = null
    }
  } finally {
    loading.value = false
  }
}

async function triggerSync() {
  syncing.value = true
  try {
    const res = await fetch(`/api/meituan-sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: selectedDate.value }),
    })
    const json = await res.json()
    if (json.ok) {
      data.value = json
      lastSync.value = new Date().toLocaleString('zh-CN')
      if (json.cookieExpired) {
        ElMessage.warning('Cookie 已过期，请重新配置')
      } else {
        ElMessage.success('数据同步成功')
      }
    } else {
      ElMessage.error(json.message || '同步失败')
    }
  } finally {
    syncing.value = false
  }
}

onMounted(async () => {
  await checkConfig()
  if (configured.value) {
    await loadData()
  }
})
</script>

<style scoped>
.mt-page { display: flex; flex-direction: column; gap: 14px; }

/* 未配置 */
.setup-card {
  background: #fff;
  border-radius: 20px;
  padding: 32px;
  box-shadow: 0 4px 20px rgba(15,23,42,.06);
  max-width: 600px;
  margin: 0 auto;
  text-align: center;
}
.setup-icon { font-size: 48px; margin-bottom: 12px; }
.setup-title { font-size: 20px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
.setup-desc { font-size: 13px; color: #64748b; margin-bottom: 24px; line-height: 1.6; }

.setup-steps { text-align: left; margin-bottom: 24px; display: flex; flex-direction: column; gap: 10px; }
.step { display: flex; gap: 12px; align-items: flex-start; }
.step-num {
  width: 24px; height: 24px; border-radius: 50%;
  background: rgba(13,148,136,.12); color: #0f766e;
  font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; margin-top: 1px;
}
.step-text { font-size: 13px; color: #475569; line-height: 1.5; }
kbd {
  background: #f1f5f9; border: 1px solid #e2e8f0;
  border-radius: 4px; padding: 1px 5px; font-size: 11px;
}

.setup-form { text-align: left; display: flex; flex-direction: column; gap: 14px; }
.form-row { display: flex; flex-direction: column; gap: 6px; }
.form-row label { font-size: 12px; font-weight: 600; color: #475569; }
.req { color: #ef4444; }
.form-input, .form-textarea {
  border: 1px solid rgba(148,163,184,.25); border-radius: 10px;
  padding: 10px 12px; font-size: 13px; color: #0f172a;
  outline: none; background: #fafbfc; resize: vertical;
}
.form-input:focus, .form-textarea:focus {
  border-color: rgba(13,148,136,.4); background: #fff;
}

/* 工具栏 */
.dash-toolbar {
  display: flex; align-items: center; justify-content: space-between;
  background: #fff; border-radius: 16px; padding: 14px 18px;
  box-shadow: 0 4px 20px rgba(15,23,42,.05);
}
.dash-title { display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 800; color: #0f172a; }
.dash-icon { font-size: 20px; }
.dash-date { font-size: 12px; color: #94a3b8; font-weight: 400; }
.toolbar-right { display: flex; align-items: center; gap: 8px; }
.date-picker {
  border: 1px solid rgba(148,163,184,.25); border-radius: 8px;
  padding: 7px 10px; font-size: 12px; color: #475569; outline: none;
}
.btn-sync {
  background: linear-gradient(135deg,#0f766e,#14b8a6);
  color: #fff; border: none; border-radius: 10px;
  padding: 8px 16px; font-size: 12px; font-weight: 700; cursor: pointer;
}
.btn-sync:disabled { opacity: .6; cursor: default; }
.btn-ghost {
  background: #fff; border: 1px solid rgba(148,163,184,.25);
  border-radius: 10px; padding: 8px 14px;
  font-size: 12px; color: #64748b; cursor: pointer;
}
.btn-primary {
  background: linear-gradient(135deg,#0f766e,#14b8a6);
  color: #fff; border: none; border-radius: 12px;
  padding: 12px 24px; font-size: 14px; font-weight: 700;
  cursor: pointer; width: 100%;
}
.btn-primary:disabled { opacity: .6; }
.spin { display: inline-block; animation: spin .8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.alert-warn {
  background: rgba(245,158,11,.08); border: 1px solid rgba(245,158,11,.2);
  border-radius: 12px; padding: 12px 16px; font-size: 13px; color: #92400e;
  display: flex; align-items: center; justify-content: space-between;
}
.alert-btn {
  background: #f59e0b; color: #fff; border: none;
  border-radius: 8px; padding: 5px 12px; font-size: 12px; cursor: pointer;
}
.sync-info { font-size: 11px; color: #94a3b8; text-align: right; }

.empty-state {
  background: #fff; border-radius: 20px; padding: 48px;
  text-align: center; box-shadow: 0 4px 20px rgba(15,23,42,.05);
}
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-text { font-size: 14px; color: #64748b; margin-bottom: 20px; }

/* 指标卡片 */
.metrics-grid {
  display: grid; grid-template-columns: repeat(4,1fr); gap: 12px;
}
.metric-card {
  background: #fff; border-radius: 16px; padding: 20px;
  box-shadow: 0 4px 20px rgba(15,23,42,.05); text-align: center;
}
.metric-card.metric-warn { border: 1px solid rgba(239,68,68,.2); }
.metric-label { font-size: 12px; color: #64748b; margin-bottom: 8px; }
.metric-value { font-size: 28px; font-weight: 800; color: #0f172a; line-height: 1; }
.metric-warn .metric-value { color: #ef4444; }
.metric-sub { font-size: 11px; color: #94a3b8; margin-top: 4px; }

/* 详情卡片 */
.detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.detail-card {
  background: #fff; border-radius: 16px; padding: 18px;
  box-shadow: 0 4px 20px rgba(15,23,42,.05);
}
.detail-title { font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 14px; }
.detail-empty { font-size: 13px; color: #94a3b8; text-align: center; padding: 20px 0; }

.dish-row {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 0; border-bottom: 1px solid #f1f5f9;
}
.dish-row:last-child { border-bottom: none; }
.dish-rank {
  width: 22px; height: 22px; border-radius: 6px;
  background: #f1f5f9; color: #64748b;
  font-size: 11px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.rank-1 { background: #fef3c7; color: #d97706; }
.rank-2 { background: #f1f5f9; color: #475569; }
.rank-3 { background: #fef9ee; color: #92400e; }
.dish-name { flex: 1; font-size: 13px; color: #0f172a; }
.dish-count { font-size: 12px; color: #64748b; }

.review-row {
  padding: 10px 0; border-bottom: 1px solid #f1f5f9;
}
.review-row:last-child { border-bottom: none; }
.review-star { font-size: 11px; color: #ef4444; margin-bottom: 3px; }
.review-text { font-size: 12px; color: #475569; line-height: 1.5; }
.review-time { font-size: 11px; color: #94a3b8; margin-top: 3px; }
</style>
