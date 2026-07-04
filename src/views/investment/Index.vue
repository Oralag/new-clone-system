<template>
  <div class="fh">

    <!-- ── 上半屏：图1 构图（左标题列 + 中央黄色地图大卡） ── -->
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

        <!-- 总资产（HTX 真实余额） -->
        <div class="lcard">
          <div class="fw-row">
            <span class="fw-ic">◔</span>
            <span class="fw-label">{{ t('investmentHome.netWorth') }}</span>
            <span class="fw-right">{{ t('investmentHome.energy') }} {{ adamStore.core.energy }}%</span>
          </div>
          <div class="fw-track">
            <div class="fw-fill" :class="{ low: adamStore.core.energy < 30 }" :style="{ width: adamStore.core.energy + '%' }"></div>
          </div>
          <div class="fw-value">
            {{ ra ? ra.total_usdt.toFixed(2) : '--' }}<i class="fw-unit">USDT</i>
          </div>
          <div v-if="ra" class="fw-breakdown">
            <span>{{ t('investmentHome.spot') }} {{ ra.spot_usdt.toFixed(2) }}</span>
            <span>{{ t('investmentHome.savings') }} {{ ra.savings_usdt.toFixed(2) }}</span>
            <span>{{ t('investmentHome.position') }} {{ ra.position_value_usdt.toFixed(2) }}</span>
          </div>
        </div>

        <!-- 圆形指标排 -->
        <div class="lcard lcard--circles">
          <div class="circle-item">
            <span class="ci ci--orange">U</span>
            <span class="ci-label">{{ t('investmentHome.spot') }}</span>
            <span class="ci-val">{{ ra ? ra.spot_usdt.toFixed(2) : '--' }}</span>
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
        </div>

        <!-- 情绪频谱 -->
        <div class="fh-emotion">
          <div class="emo-top">
            <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="emo-item" :title="`${emotionLabels[key] || key} ${val}`">
              <span class="emo-track"><i :style="{ height: Math.max(val, 4) + '%' }"></i></span>
              <span class="emo-name">{{ (emotionLabels[key] || key).slice(0, 1) }}</span>
            </div>
          </div>
          <div class="emo-strip">{{ t('investmentHome.emotionSpectrum') }}</div>
        </div>

        <!-- 身份签名 -->
        <div class="fh-identity">
          <img :src="adamAvatarUrl" class="fh-idimg" alt="亚当" />
          <span class="fh-idtext">
            <b>ADAM <i>#1</i></b>
            <small>DIGITAL_LIFE · ENTITY_001</small>
          </span>
        </div>
      </aside>

      <!-- 中央舞台：黄色大卡 = 园区地图（最大模块，无叠压组件） -->
      <div class="fh-stage">
        <div class="fh-hero">
          <!-- 互动园区地图 -->
          <div class="fh-map" :class="adamStore.core.status">
            <CityEmbed embed />
          </div>

          <!-- 底右：直达全屏地图 -->
          <router-link to="/investment/city" class="fh-map-open">
            <span>{{ t('investment.cityMap') }}</span>
            <b>→</b>
          </router-link>
        </div>

        <!-- 卡下横排：指令 / 待审批 -->
        <div class="fh-under">
          <!-- 最新指令（业务：采纳 / 跳过） -->
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

          <!-- 待审批（业务：批准 / 否决），仅有待审批时显示 -->
          <div v-if="pendingAction" class="fh-blurb">
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
          </div>
        </div>
      </div>
    </div>

    <!-- ── 下半屏：机构列表 + 信任阶梯 + 事件日志 ── -->
    <div class="fh-panels">

      <section class="panel panel--inst">
        <div class="panel-head">
          <span class="panel-title">{{ t('city.institutions') }}</span>
          <span class="panel-tag panel-tag--count">{{ adamStore.institutions.length }}</span>
        </div>
        <div class="inst-list">
          <template v-for="zone in zoneList" :key="zone.key">
            <div v-if="zone.items.length" class="il-zone">
              <span class="il-zone-dot" :class="zone.key"></span>
              {{ zone.label }}
            </div>
            <div
              v-for="inst in zone.items"
              :key="inst.institutionId"
              class="il-item"
              :class="inst.status"
            >
              <span class="il-emoji">{{ getEmoji(inst.institutionId) }}</span>
              <span class="il-info">
                <b>{{ displayInstitutionName(inst.institutionId, inst.name) }}</b>
                <small>{{ statusLabel(inst.status) }}</small>
              </span>
              <span class="il-dot" :class="inst.status"></span>
            </div>
          </template>
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

// HTX 真实资产（由布局层轮询，这里直接读）
const ra = computed(() => adamStore.realAssets)

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

function isPastLevel(id: string) {
  const cur = levelOrder.indexOf(adamStore.core.creditLevel || 'C')
  return levelOrder.indexOf(id) < cur
}

// ── 机构列表（与园区地图共用 adamStore.institutions） ──
const zoneList = computed(() => [
  { key: 'command', label: t('city.zoneLabels.command'), items: adamStore.institutions.filter((i) => i.zone === 'command_center') },
  { key: 'intelligence', label: t('city.zoneLabels.intelligence'), items: adamStore.institutions.filter((i) => i.zone === 'intelligence') },
  { key: 'commerce', label: t('city.zoneLabels.commerce'), items: adamStore.institutions.filter((i) => i.zone === 'commerce') },
  { key: 'adam', label: t('city.zoneLabels.adam'), items: adamStore.institutions.filter((i) => i.zone === 'adam_domain') },
])

const emojiMap: Record<string, string> = {
  bureau: '🏛', finance_gateway: '🏦', reactor: '⚡',
  intel_station: '📡', research_institute: '🔬', adam_academy: '🎓',
  data_center: '💾', risk_lab: '⚗️', arbitration_hall: '⚖️',
  ad_company: '📺', archive: '📚', corner: '🏠',
  marketing_consultancy: '📊', library: '📖',
}
function getEmoji(id: string) { return emojiMap[id] || '🏗️' }

function translated(key: string, fallback: string) {
  const value = t(key)
  return value && value !== key ? value : fallback
}
function statusLabel(status: string) {
  return translated(`city.statusLabels.${status}`, status.toUpperCase())
}
function displayInstitutionName(instId: string, fallback?: string) {
  return translated(`city.institutionNames.${instId}`, fallback || instId)
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
   投资首页 — FROGSOUND 构图
   左：标题列；中：黄色大卡 = 互动园区地图（最大模块）
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
  padding-bottom: 4px;
}

/* ── 上半屏 ── */
.fh-top {
  display: grid;
  grid-template-columns: 208px minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

/* 左列：数据卡竖排栈 */
.fh-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 4px;
  min-width: 0;
}

/* 左列白卡通用 */
.lcard {
  background: #fff;
  border-radius: 18px;
  padding: 13px 15px;
  box-shadow: 0 6px 18px rgba(19, 19, 17, 0.05);
}
.lcard--circles {
  display: flex;
  justify-content: space-between;
  padding: 12px 14px;
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

/* 行动按钮（纵向排布） */
.fh-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin: 10px 0 4px;
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

/* 黄色大卡 = 地图 */
.fh-hero {
  position: relative;
  height: 74vh;
  min-height: 580px;
  border-radius: 32px;
  background: var(--yellow);
}

/* 内嵌互动地图（占满卡身，黄色作细边框） */
.fh-map {
  position: absolute;
  z-index: 1;
  inset: 14px;
  border-radius: 24px;
  overflow: hidden;
}
.fh-map.dormant { filter: saturate(0.8); }

/* 净资产卡内部 */
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
.fw-unit {
  font-style: normal;
  font-size: 10px;
  font-weight: 700;
  margin-left: 4px;
  color: var(--ink-muted);
}
.fw-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 7px;
  font-size: 9.5px;
  color: var(--ink-soft);
}

/* 圆形指标 */
.circle-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  min-width: 52px;
}
.ci {
  width: 38px;
  height: 38px;
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

/* 身份签名（左列） */
.fh-identity {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 7px 14px 7px 8px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 6px 18px rgba(19, 19, 17, 0.05);
}
.fh-idimg {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  object-fit: cover;
  background: var(--ink);
}
.fh-idtext { display: flex; flex-direction: column; gap: 1px; }
.fh-idtext b {
  font-size: 14px;
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

/* 底右：直达全屏地图 */
.fh-map-open {
  position: absolute;
  z-index: 6;
  right: 28px;
  bottom: 28px;
  display: flex;
  align-items: center;
  gap: 8px;
  height: 38px;
  padding: 0 16px;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  text-decoration: none;
  transition: transform 0.15s ease, background 0.15s ease;
}
.fh-map-open:hover { transform: translateY(-1px); background: var(--orange); }
.fh-map-open b { font-weight: 900; }

/* ── 卡下横排 ── */
.fh-under {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 26px;
  align-items: start;
  margin-top: 18px;
  padding: 0 8px;
}

/* 情绪频谱药丸（左列） */
.fh-emotion {
  border-radius: 18px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 6px 18px rgba(19, 19, 17, 0.05);
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
  background: var(--ink);
  transition: height 0.4s ease;
}
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

/* 信息栏 */
.fh-blurb {
  padding-top: 0;
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

/* ── 下半屏三面板 ── */
.fh-panels {
  display: grid;
  grid-template-columns: minmax(220px, 0.85fr) minmax(240px, 1fr) minmax(0, 1.3fr);
  gap: 16px;
  align-items: stretch;
}
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
  padding: 15px 18px 10px;
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
.panel-tag--count { background: rgba(244, 80, 46, 0.12); color: var(--orange); }

/* 机构列表 */
.inst-list {
  flex: 1;
  min-height: 0;
  max-height: 360px;
  overflow-y: auto;
  scrollbar-width: thin;
  padding: 0 10px 12px;
}
.il-zone {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 9.5px;
  font-weight: 800;
  color: var(--ink-muted);
  padding: 12px 8px 5px;
}
.il-zone-dot {
  width: 6px;
  height: 6px;
  border-radius: 2px;
  background: var(--ink-muted);
}
.il-zone-dot.command { background: #e0b32c; }
.il-zone-dot.intelligence { background: #4d7fb0; }
.il-zone-dot.commerce { background: #6aa872; }
.il-zone-dot.adam { background: #9b7fd4; }
.il-item {
  display: flex;
  align-items: center;
  gap: 9px;
  padding: 8px;
  border-radius: 12px;
  color: var(--ink);
}
.il-item.locked { opacity: 0.45; }
.il-emoji { font-size: 15px; flex-shrink: 0; }
.il-info {
  display: flex;
  flex-direction: column;
  gap: 0;
  min-width: 0;
  flex: 1;
}
.il-info b {
  font-size: 11.5px;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.il-info small { font-size: 9px; color: var(--ink-muted); }
.il-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(19, 19, 17, 0.16);
  flex-shrink: 0;
}
.il-dot.active { background: #3f9a4c; box-shadow: 0 0 0 3px rgba(63, 154, 76, 0.16); }
.il-dot.urgent { background: var(--orange); }

/* 信任阶梯 */
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
.ti-progress em.met { color: #2f7a3c; }

/* 事件日志 */
.log-table {
  padding: 0 10px 12px;
  max-height: 360px;
  overflow-y: auto;
  scrollbar-width: thin;
  flex: 1;
}
.log-row {
  display: grid;
  grid-template-columns: 42px 48px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 9px 8px;
  border-radius: 12px;
}
.log-row:hover { background: rgba(19, 19, 17, 0.03); }
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
.lr-stage.act { background: rgba(244, 80, 46, 0.12); color: var(--orange); }
.lr-stage.judge { background: rgba(77, 127, 176, 0.14); color: #3d6a96; }
.lr-stage.settle { background: rgba(63, 122, 72, 0.12); color: #2f7a3c; }
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
  .fh-top { grid-template-columns: 1fr; gap: 20px; }
  .fh-left {
    padding-top: 0;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    align-items: stretch;
  }
  .fh-colors { display: none; }
  .fh-actions { flex-direction: row; align-items: center; margin: 0; }
  .fh-under { grid-template-columns: 1fr; gap: 14px; padding: 0; margin-top: 14px; }
  .fh-panels { grid-template-columns: 1fr; }
}

@media (max-width: 767px) {
  .fh-hero { height: auto; min-height: 460px; }
  .fh-map { inset: 10px; }
  .fh-map-open { right: 18px; bottom: 18px; }
}
</style>
