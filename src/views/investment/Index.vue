<template>
  <div class="fh">

    <!-- ── 上半屏：图1 构图（左标题栏 + 中央黄色插画卡） ── -->
    <div class="fh-top">

      <!-- 左列：色彩条 + 页码点 + 大标题 + 行动按钮 -->
      <aside class="fh-left">
        <div class="fh-colors">
          <span class="fh-colors-label">Colors</span>
          <div class="fh-rail">
            <span class="rail-chevron">⌃</span>
            <router-link to="/investment/market" class="rail-dot rail-dot--gray" :title="t('investment.market')" />
            <span class="rail-dot rail-dot--yellow active" :title="t('investment.pageOverview')"></span>
            <router-link to="/investment/archive" class="rail-dot rail-dot--black" :title="t('investment.archive')" />
            <router-link to="/investment/library" class="rail-dot rail-dot--blue" :title="t('investment.library')" />
            <span class="rail-chevron">⌄</span>
          </div>
        </div>

        <div class="fh-count">
          <span></span><span class="on"></span><span></span><span></span>
          <b>01<i>/03</i></b>
        </div>

        <h2 class="fh-title">
          <span>Adam</span>
          <span>Invest,</span>
          <strong>Today</strong>
        </h2>

        <div class="fh-actions">
          <button v-if="adamStore.core.status === 'dormant'" class="fh-buy" @click="handleActivate">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            {{ t('investmentHome.activate') }}
          </button>
          <router-link v-else to="/investment/market" class="fh-buy">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            {{ t('investmentHome.enterMarket') }}
          </router-link>
          <router-link to="/investment/archive" class="fh-detail">{{ t('investmentHome.viewArchive') }}</router-link>
        </div>
      </aside>

      <!-- 中央舞台：黄色大卡 + 悬浮数据组件 -->
      <div class="fh-stage">
        <div class="fh-hero">
          <!-- 顶左：净资产播放器组件 -->
          <div class="fw fw-networth">
            <div class="fw-row">
              <span class="fw-ic">◔</span>
              <span class="fw-label">{{ t('investmentHome.netWorth') }}</span>
              <span class="fw-right">{{ t('investmentHome.energy') }} {{ adamStore.core.energy }}%</span>
            </div>
            <div class="fw-track">
              <div class="fw-fill" :class="{ low: adamStore.core.energy < 30 }" :style="{ width: adamStore.core.energy + '%' }"></div>
            </div>
            <div class="fw-value" :class="{ positive: adamStore.core.netWorth > 0, negative: adamStore.core.netWorth < 0 }">
              ¥{{ adamStore.core.netWorth.toLocaleString() }}
            </div>
          </div>

          <!-- 顶右：圆形指标组（图1 的头像圆圈排） -->
          <div class="fw fw-circles">
            <div class="circle-item">
              <span class="ci ci--orange">¥</span>
              <span class="ci-label">{{ t('investmentHome.budget') }}</span>
              <span class="ci-val">{{ shortNum(adamStore.core.budget) }}</span>
            </div>
            <div class="circle-item">
              <span class="ci ci--black">{{ adamStore.core.creditLevel }}</span>
              <span class="ci-label">{{ t('investmentHome.credit') }}</span>
              <span class="ci-val">{{ creditName }}</span>
            </div>
            <div class="circle-item">
              <span class="ci ci--white">{{ adamStore.core.survivalDays }}<i>d</i></span>
              <span class="ci-label">{{ t('investmentHome.alive') }}</span>
              <span class="ci-val">{{ sysLabel }}</span>
            </div>
            <div class="circle-item">
              <span class="ci ci--img"><img :src="adamAvatarUrl" alt="ADAM" /></span>
              <span class="ci-label">ADAM</span>
              <span class="ci-val">#1</span>
            </div>
          </div>

          <!-- 中央插画：亚当雕像 -->
          <div class="fh-illo" :class="adamStore.core.status">
            <AdamStatue class="fh-statue" />
          </div>

          <!-- 底左：身份签名 -->
          <div class="fh-identity">
            <img :src="adamAvatarUrl" class="fh-idimg" alt="亚当" />
            <span class="fh-idtext">
              <b>ADAM <i>#1</i></b>
              <small>DIGITAL_LIFE · ENTITY_001</small>
            </span>
          </div>

          <!-- 右缘悬浮圆钮：情绪波形 -->
          <div class="fh-wave" :title="t('investmentHome.emotionSpectrum')">
            <span v-for="(val, key) in adamStore.core.emotionState" :key="key" class="wave-bar" :style="{ height: Math.max(val * 0.22, 3) + 'px' }"></span>
          </div>
        </div>

        <!-- 卡下横排：情绪频谱药丸（叠压黄卡下缘） + 两个信息栏 -->
        <div class="fh-under">
          <div class="fh-emotion">
            <div class="emo-top">
              <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="emo-item" :title="`${emotionLabels[key] || key} ${val}`">
                <span class="emo-track"><i :class="emotionColor(key as string)" :style="{ height: Math.max(val, 4) + '%' }"></i></span>
                <span class="emo-name">{{ (emotionLabels[key] || key).slice(0, 1) }}</span>
              </div>
            </div>
            <div class="emo-strip">{{ t('investmentHome.emotionSpectrum') }}</div>
          </div>

          <!-- 信息栏1：最新指令（业务：采纳 / 跳过） -->
          <div class="fh-blurb">
            <template v-if="adamStore.latestRecommendation">
              <h4 class="blurb-title">{{ t('investmentHome.latestDirective') }}</h4>
              <p class="blurb-strong">{{ adamStore.latestRecommendation.title }}</p>
              <p class="blurb-text">{{ adamStore.latestRecommendation.thesis }}</p>
              <p v-if="adamStore.latestRecommendation.riskNote" class="blurb-risk">⚠ {{ adamStore.latestRecommendation.riskNote }}</p>
              <div class="blurb-meta">
                <span v-if="adamStore.latestRecommendation.confidence">{{ t('investmentHome.confidencePrefix') }} {{ (adamStore.latestRecommendation.confidence * 100).toFixed(0) }}%</span>
                <span>{{ formatTime(adamStore.latestRecommendation.issuedAt) }}</span>
              </div>
              <div class="blurb-actions">
                <button class="b-btn b-btn--solid" @click="handleAdoptRecommendation">{{ t('investmentHome.executed') }}</button>
                <button class="b-btn" @click="handleSkipRecommendation">{{ t('investmentHome.skip') }}</button>
              </div>
            </template>
            <template v-else>
              <h4 class="blurb-title">{{ t('investmentHome.latestDirective') }}</h4>
              <p class="blurb-strong">{{ t('investmentHome.awaitingDirective') }}</p>
              <p class="blurb-text">{{ t('investmentHome.awaitingDirectiveSub') }}</p>
            </template>
          </div>

          <!-- 信息栏2：待审批（业务：批准 / 否决），无待审批时显示信任等级摘要 -->
          <div class="fh-blurb">
            <template v-if="pendingAction">
              <h4 class="blurb-title blurb-title--hot">{{ t('investmentHome.pendingApproval') }}</h4>
              <p class="blurb-strong">{{ pendingAction.type }} · {{ pendingAction.amount }} {{ pendingAction.token || 'USDT' }}</p>
              <p class="blurb-text">{{ pendingAction.reason }}</p>
              <div class="blurb-meta">
                <span>{{ t('investmentHome.submittedAt') }} {{ formatTime(pendingAction.createdAt) }}</span>
              </div>
              <div class="blurb-actions">
                <button class="b-btn b-btn--solid" @click="handleApprove">{{ t('investmentHome.approve') }}</button>
                <button class="b-btn" @click="handleReject">{{ t('investmentHome.reject') }}</button>
              </div>
            </template>
            <template v-else>
              <h4 class="blurb-title">{{ t('investmentHome.trustLadder') }}</h4>
              <p class="blurb-strong">{{ adamStore.core.creditLevel }} · {{ creditName }}</p>
              <p class="blurb-text">{{ currentPerm }}</p>
              <p v-if="nextLevelReq" class="blurb-meta">
                <span :class="{ met: (adamStore.core.totalAnalyses ?? 0) >= nextLevelReq.analyses }">
                  {{ t('investmentHome.stageLabels.judge') }} {{ adamStore.core.totalAnalyses ?? 0 }}/{{ nextLevelReq.analyses }}
                </span>
                <span :class="{ met: (adamStore.core.survivalDays ?? 0) >= nextLevelReq.days }">
                  {{ t('investmentHome.alive') }} {{ adamStore.core.survivalDays }}d/{{ nextLevelReq.days }}d
                </span>
                <span>→ {{ nextLevel }}</span>
              </p>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 下半屏：信任阶梯 + 事件日志（白色圆角面板） ── -->
    <div class="fh-panels">

      <div class="fh-panel">
        <div class="panel-head">
          <span class="panel-title">{{ t('investmentHome.trustLadder') }}</span>
        </div>
        <div class="trust-row">
          <div
            v-for="lvl in creditLevels"
            :key="lvl.id"
            class="trust-cell"
            :class="{ active: lvl.id === adamStore.core.creditLevel, past: isPastLevel(lvl.id), future: isFutureLevel(lvl.id) }"
          >
            <span class="tc-badge">{{ lvl.id }}</span>
            <span class="tc-name">{{ lvl.name }}</span>
            <span class="tc-perm">{{ lvl.perm }}</span>
          </div>
        </div>
      </div>

      <div class="fh-panel">
        <div class="panel-head">
          <span class="panel-title">{{ t('investmentHome.eventLog') }}</span>
          <span v-if="adamStore.recentEvents.length" class="panel-count">{{ adamStore.recentEvents.length }}</span>
        </div>
        <div class="event-list">
          <div v-for="event in adamStore.recentEvents.slice(0, 12)" :key="event.id" class="event-row">
            <span class="ev-time">{{ formatTime(event.at) }}</span>
            <span class="ev-stage" :class="event.stage">{{ stageLabel(event.stage) }}</span>
            <span class="ev-text">{{ event.title }}</span>
          </div>
          <div v-if="adamStore.recentEvents.length === 0" class="event-empty">
            <b>{{ t('investmentHome.noEvents') }}</b>
            <small>{{ t('investmentHome.noEventsSub') }}</small>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAdamStore } from '@/stores/adam'
import { TOKEN_NAME } from '@/config'
import adamAvatarUrl from '@/assets/adam-avatar.png'
import AdamStatue from './illo/AdamStatue.vue'

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
const creditName = computed(() => t(`investmentHome.creditLevels.${adamStore.core.creditLevel || 'C'}`))
const currentPerm = computed(() => t(`investmentHome.creditPerms.${adamStore.core.creditLevel || 'C'}`))

function isPastLevel(id: string) {
  const cur = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder.indexOf(id) < cur
}
function isFutureLevel(id: string) {
  const cur = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder.indexOf(id) > cur
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

const sysLabel = computed(() => {
  const map: Record<string, string> = {
    dormant: t('investmentHome.statuses.dormant'),
    alive: t('investmentHome.statuses.alive'),
    survival: t('investmentHome.statuses.survival'),
    shutdown: t('investmentHome.statuses.shutdown'),
  }
  return map[adamStore.core.status] || t('investmentHome.statuses.unknown')
})

const emotionLabels = computed<Record<string, string>>(() => ({
  joy: t('investmentHome.emotionLabels.joy'),
  anger: t('investmentHome.emotionLabels.anger'),
  sorrow: t('investmentHome.emotionLabels.sorrow'),
  fear: t('investmentHome.emotionLabels.fear'),
  love: t('investmentHome.emotionLabels.love'),
  disgust: t('investmentHome.emotionLabels.disgust'),
  desire: t('investmentHome.emotionLabels.desire'),
}))

function emotionColor(key: string) {
  const map: Record<string, string> = {
    joy: 'em-gold', anger: 'em-red', sorrow: 'em-blue', fear: 'em-purple',
    love: 'em-pink', disgust: 'em-gray', desire: 'em-cyan',
  }
  return map[key] || 'em-gold'
}

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

function shortNum(n: number) {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M'
  if (Math.abs(n) >= 10_000) return (n / 10_000).toFixed(1) + 'w'
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + 'k'
  return String(n)
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
   投资首页 — 参考图1（FROGSOUND）构图
   左：色彩条 + 大标题；中：黄色插画卡 + 悬浮组件
   ═══════════════════════════════════════════════════ */

.fh {
  --ink: #131311;
  --ink-soft: rgba(19, 19, 17, 0.66);
  --ink-muted: rgba(19, 19, 17, 0.4);
  --yellow: #f6df3e;
  --orange: #f4502e;
  --blue: #adc9dc;
  --line: rgba(19, 19, 17, 0.1);

  display: flex;
  flex-direction: column;
  gap: 22px;
  color: var(--ink);
}

/* ── 上半屏 ── */
.fh-top {
  display: grid;
  grid-template-columns: 200px minmax(0, 1fr);
  gap: 30px;
  align-items: stretch;
}

/* 左列 */
.fh-left {
  display: flex;
  flex-direction: column;
  padding-top: 4px;
  min-width: 0;
}

.fh-colors-label {
  display: block;
  font-size: 11px;
  color: var(--ink-soft);
  margin-bottom: 8px;
}
.fh-rail {
  width: 40px;
  padding: 10px 0;
  border-radius: 999px;
  background: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 9px;
  box-shadow: 0 6px 18px rgba(19, 19, 17, 0.05);
}
.rail-chevron {
  font-size: 12px;
  line-height: 1;
  color: var(--ink-soft);
}
.rail-dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  display: block;
  text-decoration: none;
  transition: transform 0.15s ease;
}
.rail-dot:hover { transform: scale(1.12); }
.rail-dot--gray { background: #d5d4d0; }
.rail-dot--yellow { background: var(--yellow); }
.rail-dot--black { background: var(--ink); }
.rail-dot--blue { background: var(--blue); }
.rail-dot.active { box-shadow: 0 0 0 3px #fff, 0 0 0 4.5px rgba(19, 19, 17, 0.35); }

/* 页码点 */
.fh-count {
  display: flex;
  align-items: center;
  gap: 7px;
  margin: 34px 0 14px;
}
.fh-count span {
  width: 6px;
  height: 6px;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.18);
}
.fh-count span.on {
  width: 10px;
  height: 10px;
  background: var(--ink);
  box-shadow: 0 0 0 3px #f5f4f0, 0 0 0 4px rgba(19, 19, 17, 0.2);
}
.fh-count b {
  margin-left: 8px;
  font-size: 15px;
  font-weight: 600;
}
.fh-count b i {
  font-style: normal;
  font-weight: 400;
  color: var(--ink-muted);
  font-size: 12px;
}

/* 大标题（图1：前两行细斜体，末行超粗） */
.fh-title {
  margin: 0;
  font-size: clamp(44px, 4.4vw, 62px);
  line-height: 1.02;
  letter-spacing: -0.045em;
  font-weight: 300;
}
.fh-title span {
  display: block;
  font-style: italic;
}
.fh-title strong {
  display: block;
  margin-top: 4px;
  font-style: normal;
  font-weight: 900;
  letter-spacing: -0.04em;
}

/* 行动按钮 */
.fh-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-top: 30px;
}
.fh-buy {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  height: 42px;
  padding: 0 18px;
  border: none;
  border-radius: 10px;
  background: var(--ink);
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s ease, background 0.15s ease;
}
.fh-buy:hover { transform: translateY(-1px); background: var(--orange); }
.fh-detail {
  color: var(--ink-soft);
  font-size: 12px;
  font-style: italic;
  text-decoration: underline;
  text-underline-offset: 4px;
}
.fh-detail:hover { color: var(--ink); }

/* ── 中央舞台 ── */
.fh-stage {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

/* 黄色大卡 */
.fh-hero {
  position: relative;
  min-height: 380px;
  border-radius: 32px;
  background: var(--yellow);
  overflow: visible;
}
.fh-hero.dormant { filter: saturate(0.72); }

/* 中央插画 */
.fh-illo {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  padding-top: 34px;
}
.fh-statue { transform: scale(1.06); }
.fh-illo.dormant .fh-statue { opacity: 0.82; }

/* 悬浮组件通用 */
.fw {
  position: absolute;
  z-index: 3;
  background: #fff;
  border-radius: 18px;
  box-shadow: 0 14px 34px rgba(19, 19, 17, 0.1);
}

/* 顶左：净资产（图1 的播放器卡位） */
.fw-networth {
  top: 26px;
  left: 26px;
  width: 200px;
  padding: 13px 15px;
}
.fw-row {
  display: flex;
  align-items: center;
  gap: 6px;
}
.fw-ic { font-size: 11px; color: var(--orange); }
.fw-label {
  font-size: 10px;
  font-weight: 700;
  color: var(--ink-soft);
}
.fw-right {
  margin-left: auto;
  font-size: 10px;
  font-weight: 700;
  color: var(--ink-muted);
}
.fw-track {
  height: 5px;
  margin: 9px 0 10px;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.1);
  overflow: hidden;
}
.fw-fill {
  height: 100%;
  border-radius: 999px;
  background: var(--ink);
  transition: width 0.4s ease;
}
.fw-fill.low { background: var(--orange); }
.fw-value {
  font-size: 20px;
  font-weight: 900;
  letter-spacing: -0.03em;
}
.fw-value.positive { color: #2f7a3c; }
.fw-value.negative { color: var(--orange); }

/* 顶右：圆形指标排（图1 的头像圆圈排位） */
.fw-circles {
  top: 26px;
  right: 26px;
  padding: 12px 14px;
  display: flex;
  gap: 14px;
}
.circle-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 52px;
}
.ci {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 900;
  overflow: hidden;
}
.ci i { font-style: normal; font-size: 9px; font-weight: 700; margin-left: 1px; }
.ci--orange { background: rgba(244, 80, 46, 0.14); color: var(--orange); box-shadow: inset 0 0 0 1.5px var(--orange); }
.ci--black { background: var(--ink); color: var(--yellow); }
.ci--white { background: rgba(19, 19, 17, 0.06); color: var(--ink); }
.ci--img { background: var(--ink); }
.ci--img img { width: 100%; height: 100%; object-fit: cover; }
.ci-label {
  font-size: 9px;
  font-weight: 700;
  color: var(--ink-soft);
}
.ci-val {
  font-size: 9px;
  color: var(--ink-muted);
  max-width: 64px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 底左身份 */
.fh-identity {
  position: absolute;
  z-index: 3;
  left: 26px;
  bottom: 24px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.fh-idimg {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--ink);
}
.fh-idtext { display: flex; flex-direction: column; gap: 1px; }
.fh-idtext b {
  font-size: 15px;
  font-weight: 900;
  letter-spacing: -0.03em;
}
.fh-idtext b i {
  font-style: normal;
  color: var(--orange);
}
.fh-idtext small {
  font-size: 9px;
  color: rgba(19, 19, 17, 0.5);
}

/* 右缘情绪波形圆钮（图1 的波形圆钮位） */
.fh-wave {
  position: absolute;
  z-index: 4;
  right: -28px;
  top: 50%;
  transform: translateY(-50%);
  width: 58px;
  height: 58px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 14px 34px rgba(19, 19, 17, 0.12);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2.5px;
}
.wave-bar {
  width: 2.5px;
  border-radius: 999px;
  background: var(--ink);
  min-height: 3px;
  max-height: 26px;
}

/* ── 卡下横排 ── */
.fh-under {
  display: grid;
  grid-template-columns: 210px minmax(0, 1fr) minmax(0, 1fr);
  gap: 26px;
  align-items: start;
  margin-top: -26px;
  padding: 0 12px;
}

/* 情绪频谱药丸（叠压黄卡下缘，图1 的设置条位） */
.fh-emotion {
  position: relative;
  z-index: 5;
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 14px 34px rgba(19, 19, 17, 0.1);
}
.emo-top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 12px 14px 8px;
}
.emo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}
.emo-track {
  width: 9px;
  height: 30px;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.07);
  display: flex;
  align-items: flex-end;
  overflow: hidden;
}
.emo-track i {
  display: block;
  width: 100%;
  border-radius: 999px;
  transition: height 0.4s ease;
}
.em-gold { background: #e0b32c; }
.em-red { background: var(--orange); }
.em-blue { background: #4d7fb0; }
.em-purple { background: #7a5fd0; }
.em-pink { background: #e0679c; }
.em-gray { background: #8c8c86; }
.em-cyan { background: #3aa8a0; }
.emo-name {
  font-size: 9px;
  color: var(--ink-muted);
}
.emo-strip {
  background: var(--orange);
  color: rgba(255, 255, 255, 0.92);
  font-size: 9px;
  font-weight: 700;
  text-align: center;
  padding: 5px 0 6px;
  letter-spacing: 0.06em;
}

/* 信息栏（图1 的两段功能文案位） */
.fh-blurb {
  padding-top: 34px;
  min-width: 0;
}
.blurb-title {
  margin: 0 0 7px;
  font-size: 12px;
  font-weight: 800;
}
.blurb-title--hot { color: var(--orange); }
.blurb-strong {
  margin: 0 0 5px;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}
.blurb-text {
  margin: 0;
  font-size: 11.5px;
  line-height: 1.65;
  color: var(--ink-soft);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.blurb-risk {
  margin: 6px 0 0;
  font-size: 10.5px;
  color: var(--orange);
}
.blurb-meta {
  margin: 8px 0 0;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 10px;
  color: var(--ink-muted);
}
.blurb-meta .met { color: #2f7a3c; font-weight: 700; }
.blurb-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}
.b-btn {
  height: 30px;
  padding: 0 14px;
  border-radius: 999px;
  border: 1px solid rgba(19, 19, 17, 0.2);
  background: transparent;
  color: var(--ink);
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease, transform 0.15s ease;
}
.b-btn:hover { transform: translateY(-1px); }
.b-btn--solid {
  background: var(--ink);
  border-color: var(--ink);
  color: #fff;
}
.b-btn--solid:hover { background: var(--orange); border-color: var(--orange); }

/* ── 下半屏面板 ── */
.fh-panels {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
  gap: 20px;
}
.fh-panel {
  background: #fff;
  border-radius: 24px;
  overflow: hidden;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 15px 18px 11px;
}
.panel-title {
  font-size: 12px;
  font-weight: 800;
  color: var(--ink);
}
.panel-count {
  margin-left: auto;
  font-size: 10px;
  font-weight: 800;
  color: var(--orange);
  background: rgba(244, 80, 46, 0.1);
  padding: 2px 9px;
  border-radius: 999px;
}

/* 信任阶梯：横排五档 */
.trust-row {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  padding: 0 14px 16px;
}
.trust-cell {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 12px;
  border-radius: 16px;
  background: rgba(19, 19, 17, 0.035);
}
.trust-cell.past { opacity: 0.55; }
.trust-cell.future { opacity: 0.75; }
.trust-cell.active {
  background: var(--yellow);
  opacity: 1;
}
.tc-badge {
  width: 24px;
  height: 24px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  font-size: 11px;
  font-weight: 900;
  background: rgba(19, 19, 17, 0.08);
  color: var(--ink);
}
.trust-cell.active .tc-badge { background: var(--ink); color: var(--yellow); }
.tc-name {
  font-size: 11px;
  font-weight: 800;
}
.tc-perm {
  font-size: 9.5px;
  line-height: 1.5;
  color: var(--ink-soft);
}

/* 事件日志 */
.event-list {
  padding: 0 10px 12px;
  max-height: 264px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.event-row {
  display: grid;
  grid-template-columns: 42px 44px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 8px;
  border-radius: 12px;
}
.event-row:hover { background: rgba(19, 19, 17, 0.03); }
.ev-time {
  font-size: 10px;
  color: var(--ink-muted);
}
.ev-stage {
  font-size: 9px;
  font-weight: 800;
  text-align: center;
  padding: 2px 0;
  border-radius: 999px;
  background: rgba(19, 19, 17, 0.06);
  color: var(--ink-soft);
}
.ev-stage.act { background: rgba(244, 80, 46, 0.12); color: var(--orange); }
.ev-stage.judge { background: rgba(77, 127, 176, 0.14); color: #3d6a96; }
.ev-stage.settle { background: rgba(47, 122, 60, 0.12); color: #2f7a3c; }
.ev-text {
  font-size: 11.5px;
  color: var(--ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.event-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 30px 0;
}
.event-empty b { font-size: 12px; color: var(--ink-soft); }
.event-empty small { font-size: 10px; color: var(--ink-muted); }

/* ── 响应式 ── */
@media (max-width: 1180px) {
  .fh-top { grid-template-columns: 1fr; gap: 20px; }
  .fh-left { padding-top: 0; }
  .fh-colors { display: none; }
  .fh-count { margin-top: 0; }
  .fh-under { grid-template-columns: 1fr; gap: 14px; padding: 0; margin-top: 14px; }
  .fh-emotion { max-width: 320px; }
  .fh-blurb { padding-top: 0; }
  .fh-wave { right: 14px; }
  .fh-panels { grid-template-columns: 1fr; }
  .trust-row { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 767px) {
  .fh-title { font-size: 40px; }
  .fh-hero { min-height: 320px; }
  .fw-networth { width: 168px; top: 14px; left: 14px; }
  .fw-circles { top: auto; bottom: 70px; right: 14px; padding: 8px 10px; gap: 8px; }
  .ci { width: 32px; height: 32px; font-size: 11px; }
  .circle-item { min-width: 42px; }
  .fh-identity { left: 14px; bottom: 14px; }
  .fh-statue { transform: scale(0.8); }
}
</style>
