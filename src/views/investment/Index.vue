<template>
  <div class="dash">

    <!-- ── 页头：标题 + 身份 + 激活 ── -->
    <header class="dash-head">
      <h1 class="dh-title">{{ t('investment.pageOverview') }}</h1>
      <div class="dh-right">
        <div class="dh-id">
          <img :src="adamAvatarUrl" class="dh-avatar" alt="ADAM" />
          <span class="dh-idtext">
            <b>ADAM <i>#1</i></b>
            <small>DIGITAL_LIFE · ENTITY_001</small>
          </span>
        </div>
        <button v-if="adamStore.core.status === 'dormant'" class="dh-activate" @click="handleActivate">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
          {{ t('investmentHome.activate') }}
        </button>
      </div>
    </header>

    <!-- ── 第一行：三张彩色指标卡 ── -->
    <div class="dash-cards">

      <!-- 资产（黄） -->
      <div class="dc dc--yellow">
        <div class="dc-pattern dc-pattern--dots"></div>
        <span class="dc-label">{{ t('investmentHome.netWorth') }}</span>
        <span class="dc-big" :class="{ neg: adamStore.core.netWorth < 0 }">¥{{ adamStore.core.netWorth.toLocaleString() }}</span>
        <div class="dc-foot">
          <div class="dc-sub">
            <span>{{ t('investmentHome.energy') }}</span>
            <b>{{ adamStore.core.energy }}%</b>
          </div>
        </div>
        <div class="dc-bar">
          <i :class="{ low: adamStore.core.energy < 30 }" :style="{ width: adamStore.core.energy + '%' }"></i>
        </div>
      </div>

      <!-- 生命体征（橙） -->
      <div class="dc dc--orange">
        <div class="dc-pattern dc-pattern--stripes"></div>
        <span class="dc-label">{{ t('investmentHome.alive') }}</span>
        <span class="dc-big">{{ adamStore.core.survivalDays }}<i class="dc-unit">d</i></span>
        <div class="dc-emotions">
          <span class="dc-emo-label">{{ t('investmentHome.emotionSpectrum') }}</span>
          <div class="dc-emo-bars">
            <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="dc-emo-item" :title="`${emotionLabels[key] || key} ${val}`">
              <span class="dc-emo-track"><i :style="{ height: Math.max(val, 6) + '%' }"></i></span>
              <small>{{ (emotionLabels[key] || key).slice(0, 1) }}</small>
            </div>
          </div>
        </div>
      </div>

      <!-- 指令 / 待审批（黑） -->
      <div class="dc dc--black">
        <template v-if="pendingAction">
          <span class="dc-label dc-label--hot">{{ t('investmentHome.pendingApproval') }}</span>
          <p class="dc-strong">{{ pendingAction.type }} · {{ pendingAction.amount }} {{ pendingAction.token || 'USDT' }}</p>
          <p class="dc-text">{{ pendingAction.reason }}</p>
          <p class="dc-meta">{{ t('investmentHome.submittedAt') }} {{ formatTime(pendingAction.createdAt) }}</p>
          <div class="dc-actions">
            <button class="dc-btn dc-btn--solid" @click="handleApprove">{{ t('investmentHome.approve') }}</button>
            <button class="dc-btn" @click="handleReject">{{ t('investmentHome.reject') }}</button>
          </div>
        </template>
        <template v-else-if="adamStore.latestRecommendation">
          <span class="dc-label">{{ t('investmentHome.latestDirective') }}</span>
          <p class="dc-strong">{{ adamStore.latestRecommendation.title }}</p>
          <p class="dc-text">{{ adamStore.latestRecommendation.thesis }}</p>
          <p class="dc-meta">
            <template v-if="adamStore.latestRecommendation.confidence">{{ t('investmentHome.confidencePrefix') }} {{ (adamStore.latestRecommendation.confidence * 100).toFixed(0) }}% · </template>{{ formatTime(adamStore.latestRecommendation.issuedAt) }}
          </p>
          <p v-if="adamStore.latestRecommendation.riskNote" class="dc-risk">⚠ {{ adamStore.latestRecommendation.riskNote }}</p>
          <div class="dc-actions">
            <button class="dc-btn dc-btn--solid" @click="handleAdoptRecommendation">{{ t('investmentHome.executed') }}</button>
            <button class="dc-btn" @click="handleSkipRecommendation">{{ t('investmentHome.skip') }}</button>
          </div>
        </template>
        <template v-else>
          <span class="dc-label">{{ t('investmentHome.latestDirective') }}</span>
          <p class="dc-strong">{{ t('investmentHome.awaitingDirective') }}</p>
          <p class="dc-text">{{ t('investmentHome.awaitingDirectiveSub') }}</p>
        </template>
      </div>
    </div>

    <!-- ── 第二行：园区地图（宽）+ 信任阶梯（窄） ── -->
    <div class="dash-mid">
      <section class="panel panel--map">
        <div class="panel-head">
          <span class="panel-title">{{ t('investment.pageCity') }}</span>
          <router-link to="/investment/city" class="panel-expand" :title="t('investment.cityMap')">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>
          </router-link>
        </div>
        <div class="map-body">
          <CityEmbed embed />
        </div>
      </section>

      <section class="panel panel--trust">
        <div class="panel-head">
          <span class="panel-title">{{ t('investmentHome.trustLadder') }}</span>
          <span class="panel-tag">{{ adamStore.core.creditLevel }}</span>
        </div>
        <div class="trust-list">
          <div
            v-for="lvl in creditLevels"
            :key="lvl.id"
            class="trust-item"
            :class="{ active: lvl.id === adamStore.core.creditLevel, past: isPastLevel(lvl.id) }"
          >
            <span class="ti-badge">{{ lvl.id }}</span>
            <span class="ti-body">
              <b>{{ lvl.name }}</b>
              <small>{{ lvl.perm }}</small>
              <span v-if="lvl.id === adamStore.core.creditLevel && nextLevelReq" class="ti-progress">
                <em :class="{ met: (adamStore.core.totalAnalyses ?? 0) >= nextLevelReq.analyses }">
                  {{ t('investmentHome.stageLabels.judge') }} {{ adamStore.core.totalAnalyses ?? 0 }}/{{ nextLevelReq.analyses }}
                </em>
                <em :class="{ met: (adamStore.core.survivalDays ?? 0) >= nextLevelReq.days }">
                  {{ t('investmentHome.alive') }} {{ adamStore.core.survivalDays }}d/{{ nextLevelReq.days }}d
                </em>
                <em>→ {{ nextLevel }}</em>
              </span>
            </span>
          </div>
        </div>
      </section>
    </div>

    <!-- ── 第三行：事件日志表格 ── -->
    <section class="panel panel--log">
      <div class="panel-head">
        <span class="panel-title">{{ t('investmentHome.eventLog') }}</span>
        <span v-if="adamStore.recentEvents.length" class="panel-tag panel-tag--count">{{ adamStore.recentEvents.length }}</span>
      </div>
      <div class="log-table">
        <div v-for="event in adamStore.recentEvents.slice(0, 15)" :key="event.id" class="log-row">
          <span class="lr-time">{{ formatTime(event.at) }}</span>
          <span class="lr-stage" :class="event.stage">{{ stageLabel(event.stage) }}</span>
          <span class="lr-text">{{ event.title }}</span>
        </div>
        <div v-if="adamStore.recentEvents.length === 0" class="log-empty">
          <b>{{ t('investmentHome.noEvents') }}</b>
          <small>{{ t('investmentHome.noEventsSub') }}</small>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, defineAsyncComponent, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdamStore } from '@/stores/adam'
import { TOKEN_NAME } from '@/config'
import adamAvatarUrl from '@/assets/adam-avatar.png'

const CityEmbed = defineAsyncComponent(() => import('./City.vue'))

const { t } = useI18n()
const adamStore = useAdamStore()

// ── Trust Ladder ─────────────────────────────────────────────────────────────
const creditLevels = computed(() => [
  { id: 'C',  name: t('investmentHome.creditLevels.C'),     perm: t('investmentHome.creditPerms.C') },
  { id: 'B',  name: t('investmentHome.creditLevels.B'),     perm: t('investmentHome.creditPerms.B') },
  { id: 'B+', name: t('investmentHome.creditLevels.B+'),    perm: t('investmentHome.creditPerms.B+') },
  { id: 'A',  name: t('investmentHome.creditLevels.A'),     perm: t('investmentHome.creditPerms.A') },
  { id: 'S',  name: t('investmentHome.creditLevels.S'),     perm: t('investmentHome.creditPerms.S') },
])
const levelOrder = ['C', 'B', 'B+', 'A', 'S']
const levelReqs: Record<string, { analyses: number; days: number }> = {
  B:   { analyses: 20,  days: 30  },
  'B+':{ analyses: 50,  days: 60  },
  A:   { analyses: 100, days: 90  },
  S:   { analyses: 200, days: 180 },
}

const nextLevel = computed(() => {
  const idx = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder[idx + 1] || null
})
const nextLevelReq = computed(() => nextLevel.value ? levelReqs[nextLevel.value] : null)

function isPastLevel(id: string) {
  const cur = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder.indexOf(id) < cur
}

// ── Pending Action ────────────────────────────────────────────────────────────
const pendingAction = ref<Record<string, any> | null>(null)

async function loadPendingAction() {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  if (!token) return
  try {
    const res = await fetch('/api/adam/approve', { headers: { 'x-erp-token': token } })
    const data = await res.json() as { pending: Record<string, any> | null }
    pendingAction.value = data.pending?.status === 'pending_approval' ? data.pending : null
  } catch {}
}

async function handleApprove() {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  await fetch('/api/adam/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-erp-token': token }, body: JSON.stringify({ decision: 'approve' }) })
  pendingAction.value = null
}

async function handleReject() {
  const token = localStorage.getItem(TOKEN_NAME) || ''
  await fetch('/api/adam/approve', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-erp-token': token }, body: JSON.stringify({ decision: 'reject' }) })
  pendingAction.value = null
}

onMounted(() => loadPendingAction())

const emotionLabels = computed<Record<string, string>>(() => ({
  joy: t('investmentHome.emotionLabels.joy'),
  anger: t('investmentHome.emotionLabels.anger'),
  sorrow: t('investmentHome.emotionLabels.sorrow'),
  fear: t('investmentHome.emotionLabels.fear'),
  love: t('investmentHome.emotionLabels.love'),
  disgust: t('investmentHome.emotionLabels.disgust'),
  desire: t('investmentHome.emotionLabels.desire'),
}))

function stageLabel(stage: string) {
  const map: Record<string, string> = {
    sense: t('investmentHome.stageLabels.sense'),
    judge: t('investmentHome.stageLabels.judge'),
    act: t('investmentHome.stageLabels.act'),
    settle: t('investmentHome.stageLabels.settle'),
    archive: t('investmentHome.stageLabels.archive'),
  }
  return map[stage] || stage.toUpperCase()
}

function handleActivate() {
  adamStore.activate()
}

function handleAdoptRecommendation() {
  const rec = adamStore.latestRecommendation
  if (!rec || rec.status === 'adopted' || rec.status === 'executed') return
  rec.status = 'adopted'
  const now = new Date().toISOString()
  const evtId = `evt_adopt_${Date.now()}`
  adamStore.addEvent({
    id: evtId,
    type: 'recommendation_adopted',
    stage: 'act',
    title: t('investmentHome.adoptionSuccess', { title: rec.title }),
    summary: rec.thesis?.slice(0, 60) || '',
    at: now,
    institutionId: 'bureau',
  })
  rec.linkedEventIds.push(evtId)
  adamStore.persist()
}

function handleSkipRecommendation() {
  const rec = adamStore.latestRecommendation
  if (!rec || rec.status === 'adopted' || rec.status === 'executed') return
  rec.status = 'archived'
  const now = new Date().toISOString()
  adamStore.addEvent({
    id: `evt_skip_${Date.now()}`,
    type: 'archive_recorded',
    stage: 'archive',
    title: t('investmentHome.skipSuccess', { title: rec.title }),
    summary: t('investmentHome.skipSuccess', { title: rec.title }),
    at: now,
    institutionId: 'bureau',
  })
  if (adamStore.core.recommendationAccuracy > 0) {
    adamStore.core.recommendationAccuracy = Math.max(0, adamStore.core.recommendationAccuracy - 2)
  }
  adamStore.persist()
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch {
    return '--:--'
  }
}
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   投资总览 — 仪表盘构图（参考图2 Inventory）
   彩色指标卡 + 大地图面板 + 表格化事件日志
   ═══════════════════════════════════════════════════ */

.dash {
  --ink: #131311;
  --ink-soft: rgba(19, 19, 17, 0.64);
  --ink-muted: rgba(19, 19, 17, 0.4);
  --yellow: #f2df4e;
  --orange: #f5904e;
  --line: rgba(19, 19, 17, 0.08);

  display: flex;
  flex-direction: column;
  gap: 16px;
  color: var(--ink);
  padding-bottom: 4px;
}

/* ── 页头 ── */
.dash-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 2px 4px 0;
}
.dh-title {
  margin: 0;
  font-size: 32px;
  font-weight: 400;
  letter-spacing: -0.02em;
}
.dh-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
.dh-id {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 6px 14px 6px 7px;
  border-radius: 999px;
  background: #fff;
}
.dh-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  object-fit: cover;
  background: var(--ink);
}
.dh-idtext {
  display: flex;
  flex-direction: column;
  gap: 0;
}
.dh-idtext b {
  font-size: 12px;
  font-weight: 900;
  letter-spacing: -0.02em;
}
.dh-idtext b i { font-style: normal; color: #e2542e; }
.dh-idtext small { font-size: 8px; color: var(--ink-muted); }
.dh-activate {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 40px;
  padding: 0 18px;
  border: none;
  border-radius: 12px;
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.15s ease, background 0.15s ease;
}
.dh-activate:hover { transform: translateY(-1px); background: #e2542e; }

/* ── 第一行：彩色指标卡 ── */
.dash-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}
.dc {
  position: relative;
  min-height: 168px;
  border-radius: 24px;
  padding: 18px 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.dc--yellow { background: var(--yellow); }
.dc--orange { background: var(--orange); }
.dc--black { background: var(--ink); color: #fff; }

/* 装饰纹理（参考图2 的半调点/斜纹） */
.dc-pattern {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.dc-pattern--dots {
  background: radial-gradient(circle at 86% 78%, rgba(19, 19, 17, 0.16) 0 1.6px, transparent 1.6px 9px);
  background-size: 18px 18px;
  mask-image: radial-gradient(circle at 88% 82%, #000 0 26%, transparent 44%);
  -webkit-mask-image: radial-gradient(circle at 88% 82%, #000 0 26%, transparent 44%);
}
.dc-pattern--stripes {
  background: repeating-linear-gradient(135deg, transparent 0 7px, rgba(19, 19, 17, 0.1) 7px 9px);
  mask-image: radial-gradient(circle at 90% 20%, #000 0 24%, transparent 42%);
  -webkit-mask-image: radial-gradient(circle at 90% 20%, #000 0 24%, transparent 42%);
}

.dc-label {
  position: relative;
  font-size: 11px;
  font-weight: 800;
  color: rgba(19, 19, 17, 0.6);
  margin-bottom: 6px;
}
.dc--black .dc-label { color: rgba(255, 255, 255, 0.55); }
.dc-label--hot { color: #f5904e !important; }

.dc-big {
  position: relative;
  font-size: 34px;
  font-weight: 900;
  letter-spacing: -0.03em;
  line-height: 1.05;
}
.dc-big.neg { color: #b3350f; }
.dc-unit {
  font-style: normal;
  font-size: 15px;
  font-weight: 700;
  margin-left: 2px;
  color: rgba(19, 19, 17, 0.55);
}

.dc-foot {
  position: relative;
  display: flex;
  gap: 22px;
  margin-top: auto;
  padding-top: 12px;
}
.dc-sub {
  display: flex;
  flex-direction: column;
  gap: 1px;
}
.dc-sub span { font-size: 9.5px; color: rgba(19, 19, 17, 0.55); font-weight: 700; }
.dc-sub b { font-size: 14px; font-weight: 800; letter-spacing: -0.02em; }
.dc-bar {
  position: relative;
  height: 5px;
  margin-top: 8px;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.14);
  overflow: hidden;
}
.dc-bar i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: var(--ink);
  transition: width 0.4s ease;
}
.dc-bar i.low { background: #b3350f; }

/* 情绪频谱（橙卡内） */
.dc-emotions {
  position: relative;
  margin-top: auto;
  padding-top: 10px;
}
.dc-emo-label {
  display: block;
  font-size: 9.5px;
  font-weight: 700;
  color: rgba(19, 19, 17, 0.55);
  margin-bottom: 6px;
}
.dc-emo-bars {
  display: flex;
  align-items: flex-end;
  gap: 10px;
}
.dc-emo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
}
.dc-emo-track {
  width: 8px;
  height: 26px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.38);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.dc-emo-track i {
  display: block;
  width: 100%;
  border-radius: 999px;
  background: var(--ink);
  transition: height 0.4s ease;
}
.dc-emo-item small { font-size: 9px; color: rgba(19, 19, 17, 0.6); }

/* 黑卡：指令 / 待审批 */
.dc-strong {
  position: relative;
  margin: 0 0 4px;
  font-size: 15px;
  font-weight: 800;
  line-height: 1.35;
}
.dc-text {
  position: relative;
  margin: 0;
  font-size: 11px;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.66);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.dc-meta {
  position: relative;
  margin: 6px 0 0;
  font-size: 9.5px;
  color: rgba(255, 255, 255, 0.44);
}
.dc-risk {
  position: relative;
  margin: 4px 0 0;
  font-size: 10px;
  color: #f5904e;
}
.dc-actions {
  position: relative;
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 12px;
}
.dc-btn {
  height: 30px;
  padding: 0 15px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: transparent;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.dc-btn:hover { background: rgba(255, 255, 255, 0.12); }
.dc-btn--solid {
  background: var(--yellow);
  border-color: var(--yellow);
  color: var(--ink);
}
.dc-btn--solid:hover { background: #fff; border-color: #fff; }

/* ── 面板通用 ── */
.panel {
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 18px 10px;
  flex-shrink: 0;
}
.panel-title {
  font-size: 12px;
  font-weight: 800;
}
.panel-tag {
  margin-left: auto;
  font-size: 10px;
  font-weight: 900;
  padding: 3px 10px;
  border-radius: 999px;
  background: var(--yellow);
  color: var(--ink);
}
.panel-tag--count { background: rgba(226, 84, 46, 0.12); color: #e2542e; }
.panel-expand {
  margin-left: auto;
  width: 28px;
  height: 28px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  color: var(--ink-soft);
  background: rgba(19, 19, 17, 0.05);
  transition: background 0.15s, color 0.15s;
}
.panel-expand:hover { background: var(--ink); color: #fff; }

/* ── 第二行：地图 + 信任阶梯 ── */
.dash-mid {
  display: grid;
  grid-template-columns: minmax(0, 1.9fr) minmax(240px, 1fr);
  gap: 14px;
  align-items: stretch;
}
.panel--map { min-height: 420px; }
.map-body {
  flex: 1;
  min-height: 0;
  margin: 0 10px 10px;
  border-radius: 18px;
  overflow: hidden;
}

/* 信任阶梯（纵向五档） */
.trust-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 0 12px 12px;
  flex: 1;
}
.trust-item {
  display: flex;
  gap: 10px;
  padding: 9px 11px;
  border-radius: 14px;
  background: rgba(19, 19, 17, 0.03);
  align-items: flex-start;
}
.trust-item.past { opacity: 0.5; }
.trust-item.active { background: var(--yellow); }
.ti-badge {
  flex-shrink: 0;
  width: 22px;
  height: 22px;
  border-radius: 7px;
  display: grid;
  place-items: center;
  font-size: 10px;
  font-weight: 900;
  background: rgba(19, 19, 17, 0.08);
}
.trust-item.active .ti-badge { background: var(--ink); color: var(--yellow); }
.ti-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}
.ti-body b { font-size: 11px; font-weight: 800; }
.ti-body small { font-size: 9.5px; line-height: 1.5; color: var(--ink-soft); }
.ti-progress {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
  margin-top: 4px;
}
.ti-progress em {
  font-style: normal;
  font-size: 9px;
  font-weight: 700;
  color: rgba(19, 19, 17, 0.55);
}
.ti-progress em.met { color: #3f7a48; }

/* ── 第三行：事件日志 ── */
.log-table {
  padding: 0 10px 12px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.log-row {
  display: grid;
  grid-template-columns: 46px 52px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 9px 8px;
  border-radius: 12px;
}
.log-row:hover { background: rgba(19, 19, 17, 0.03); }
.log-row + .log-row { border-top: 1px solid var(--line); border-radius: 0; }
.lr-time { font-size: 10px; color: var(--ink-muted); }
.lr-stage {
  font-size: 9px;
  font-weight: 800;
  text-align: center;
  padding: 3px 0;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.06);
  color: var(--ink-soft);
}
.lr-stage.act { background: rgba(226, 84, 46, 0.12); color: #e2542e; }
.lr-stage.judge { background: rgba(77, 127, 176, 0.14); color: #3d6a96; }
.lr-stage.settle { background: rgba(63, 122, 72, 0.12); color: #3f7a48; }
.lr-text {
  font-size: 11.5px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.log-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 28px 0;
}
.log-empty b { font-size: 12px; color: var(--ink-soft); }
.log-empty small { font-size: 10px; color: var(--ink-muted); }

/* ── 响应式 ── */
@media (max-width: 1240px) {
  .dash-cards { grid-template-columns: 1fr 1fr; }
  .dc--black { grid-column: 1 / -1; min-height: 140px; }
  .dash-mid { grid-template-columns: 1fr; }
  .panel--map { min-height: 360px; }
}

@media (max-width: 767px) {
  .dh-title { font-size: 24px; }
  .dh-id { display: none; }
  .dash-cards { grid-template-columns: 1fr; }
  .dc { min-height: 0; }
  .panel--map { min-height: 300px; }
}
</style>
