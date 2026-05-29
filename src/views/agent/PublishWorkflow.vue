<template>
  <div class="wf-page">

    <!-- ── 步骤指示条 ── -->
    <div class="wf-stepper">
      <div
        v-for="(s, i) in STEPS"
        :key="i"
        class="wf-step-item"
        :class="{ done: currentStep > i, active: currentStep === i, locked: currentStep < i }"
        @click="currentStep > i ? currentStep = i : null"
      >
        <div class="wf-step-dot">
          <svg v-if="currentStep > i" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M5 13l4 4L19 7"/></svg>
          <span v-else>{{ i + 1 }}</span>
        </div>
        <span class="wf-step-label">{{ s.label }}</span>
        <div v-if="i < STEPS.length - 1" class="wf-step-connector" :class="{ done: currentStep > i }" />
      </div>
    </div>

    <!-- ════════════════════════════════════════
         STEP 1 — 选产品 & 目标平台
    ════════════════════════════════════════ -->
    <transition name="wf-fade">
    <div v-if="currentStep === 0" class="wf-card">
      <div class="wf-card-hd">
        <span class="wf-card-icon">🎯</span>
        <div>
          <div class="wf-card-title">选择发布对象</div>
          <div class="wf-card-sub">确定要推广的商品和目标平台</div>
        </div>
      </div>

      <div class="wf-section">
        <div class="wf-field-label">品牌</div>
        <div class="wf-brand-display">
          <div class="wf-brand-avatar">{{ brandStore.brand?.name?.charAt(0) || '品' }}</div>
          <div class="wf-brand-info">
            <div class="wf-brand-name">{{ brandStore.brand?.name || '未配置品牌' }}</div>
            <div class="wf-brand-sub">{{ brandStore.brand?.slogan || brandStore.brand?.industry || '' }}</div>
          </div>
          <router-link to="/agent/brand" class="wf-brand-edit">编辑</router-link>
        </div>
      </div>

      <div class="wf-section">
        <div class="wf-field-label">主角商品 <span class="wf-optional">（可选）</span></div>
        <ProductSelector @change="selectedProduct = $event" />
        <div class="wf-hint">{{ selectedProduct ? '已选商品，AI 将使用该商品信息生成内容' : '不选则针对品牌整体推广，不绑定具体商品' }}</div>
      </div>

      <div class="wf-section">
        <div class="wf-field-label">目标平台</div>
        <div class="wf-platform-row">
          <button
            v-for="p in PLATFORMS"
            :key="p.key"
            class="wf-platform-btn"
            :class="{ active: targetPlatform === p.key }"
            @click="targetPlatform = p.key"
          >
            <span class="wf-platform-emoji">{{ p.emoji }}</span>
            {{ p.name }}
          </button>
        </div>
      </div>

      <button class="wf-next-btn" @click="currentStep = 1">
        开始创作
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
      </button>
    </div>
    </transition>

    <!-- ════════════════════════════════════════
         STEP 1 完成摘要（折叠后显示）
    ════════════════════════════════════════ -->
    <div v-if="currentStep > 0" class="wf-done-summary" @click="currentStep = 0">
      <span class="wf-done-icon">✓</span>
      <span class="wf-done-text">
        {{ selectedProduct?.name || brandStore.brand?.name || '品牌推广' }} ·
        {{ PLATFORMS.find(p => p.key === targetPlatform)?.name || '小红书' }}
      </span>
      <span class="wf-done-edit">修改</span>
    </div>

    <!-- ════════════════════════════════════════
         STEP 2 — 生成文案
    ════════════════════════════════════════ -->
    <transition name="wf-fade">
    <div v-if="currentStep === 1" class="wf-card">
      <div class="wf-card-hd">
        <span class="wf-card-icon">✍️</span>
        <div>
          <div class="wf-card-title">生成文案</div>
          <div class="wf-card-sub">Maya 将为「{{ selectedProduct?.name || brandStore.brand?.name || '品牌' }}」生成{{ PLATFORMS.find(p=>p.key===targetPlatform)?.name }}文案</div>
        </div>
      </div>

      <!-- 快捷指令 -->
      <div v-if="!pendingCopy" class="wf-quick-row">
        <button
          v-for="q in copyQuickPrompts"
          :key="q"
          class="wf-quick-btn"
          @click="sendCopyPrompt(q)"
        >{{ q }}</button>
      </div>

      <div class="wf-chat-wrap">
        <AgentChat
          ref="copyAgentRef"
          agent-id="copywriter"
          :context-data="agentContext"
          @message-complete="onCopyComplete"
        />
      </div>

      <!-- 文案确认区 -->
      <transition name="wf-fade">
      <div v-if="pendingCopy" class="wf-confirm-zone">
        <div class="wf-confirm-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          文案已生成，确认后继续
        </div>
        <CopyPublishCard :card="pendingCopy" @saved="() => {}" />
        <div class="wf-confirm-actions">
          <button class="wf-confirm-btn" @click="confirmCopy">
            确认这份文案
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="wf-retry-btn" @click="pendingCopy = null; sendCopyPrompt('重新写一版，换个角度')">重新生成</button>
        </div>
      </div>
      </transition>
    </div>
    </transition>

    <!-- Step 2 完成摘要 -->
    <div v-if="currentStep > 1 && confirmedCopy" class="wf-done-summary" @click="currentStep = 1">
      <span class="wf-done-icon">✓</span>
      <span class="wf-done-text">文案已确认：{{ confirmedCopy.title }}</span>
      <span class="wf-done-edit">修改</span>
    </div>

    <!-- ════════════════════════════════════════
         STEP 3 — 生成海报（可跳过）
    ════════════════════════════════════════ -->
    <transition name="wf-fade">
    <div v-if="currentStep === 2" class="wf-card">
      <div class="wf-card-hd">
        <span class="wf-card-icon">🎨</span>
        <div>
          <div class="wf-card-title">生成海报</div>
          <div class="wf-card-sub">Leo 将为「{{ selectedProduct?.name || brandStore.brand?.name || '品牌' }}」设计配套封面海报</div>
        </div>
        <button class="wf-skip-btn" @click="skipPoster">跳过</button>
      </div>

      <div v-if="!pendingPosterHtml" class="wf-quick-row">
        <button
          v-for="q in posterQuickPrompts"
          :key="q"
          class="wf-quick-btn"
          @click="sendPosterPrompt(q)"
        >{{ q }}</button>
      </div>

      <div class="wf-chat-wrap">
        <AgentChat
          ref="posterAgentRef"
          agent-id="poster"
          :context-data="agentContext"
          @message-complete="onPosterComplete"
        />
      </div>

      <!-- 海报确认区 -->
      <transition name="wf-fade">
      <div v-if="pendingPosterHtml" class="wf-confirm-zone">
        <div class="wf-confirm-label">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>
          海报已生成，确认后继续
        </div>
        <PosterRenderer
          :poster-html="pendingPosterHtml"
          :platform="targetPlatform"
          @saved="onPosterSaved"
        />
        <div class="wf-confirm-actions">
          <button class="wf-confirm-btn" @click="confirmPoster">
            确认这张海报
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
          <button class="wf-retry-btn" @click="pendingPosterHtml = null; sendPosterPrompt('重新设计，换个风格')">重新生成</button>
          <button class="wf-skip-btn-inline" @click="skipPoster">不需要海报</button>
        </div>
      </div>
      </transition>
    </div>
    </transition>

    <!-- Step 3 完成摘要 -->
    <div v-if="currentStep > 2" class="wf-done-summary" @click="currentStep = 2">
      <span class="wf-done-icon">✓</span>
      <span class="wf-done-text">{{ confirmedPosterHtml ? '海报已确认' : '海报已跳过' }}</span>
      <span class="wf-done-edit">修改</span>
    </div>

    <!-- ════════════════════════════════════════
         STEP 4 — 预览 & 发布
    ════════════════════════════════════════ -->
    <transition name="wf-fade">
    <div v-if="currentStep === 3" class="wf-card wf-publish-card">
      <div class="wf-card-hd">
        <span class="wf-card-icon">🚀</span>
        <div>
          <div class="wf-card-title">预览 & 发布</div>
          <div class="wf-card-sub">确认内容后一键发布到{{ PLATFORMS.find(p=>p.key===targetPlatform)?.name }}</div>
        </div>
      </div>

      <!-- 预览区 -->
      <div class="wf-preview-zone" :class="{ 'has-poster': !!confirmedPosterHtml }">

        <!-- 海报预览（已有则显示） -->
        <div v-if="confirmedPosterHtml" class="wf-preview-poster">
          <div class="wf-preview-label">封面海报</div>
          <div class="wf-poster-mini" ref="posterMiniRef">
            <div
              class="wf-poster-mini-inner"
              v-html="sanitizedPosterHtml"
              ref="posterMiniInnerRef"
            />
          </div>
          <div class="wf-poster-actions">
            <button class="wf-dl-btn" @click="downloadPoster" :disabled="dlBusy">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M12 2v14M8 12l4 4 4-4M3 20h18"/></svg>
              {{ dlBusy ? '生成中…' : '下载PNG' }}
            </button>
          </div>
        </div>

        <!-- 文案预览 -->
        <div class="wf-preview-copy" v-if="confirmedCopy">
          <div class="wf-preview-label">发布文案</div>
          <CopyPublishCard :card="confirmedCopy" @saved="() => {}" />
        </div>
      </div>

      <!-- 操作提示（发布后显示） -->
      <div v-if="publishGuideVisible" class="wf-pub-guide">
        <div class="wf-pub-guide-step done">✓ 文案已复制到剪贴板</div>
        <div v-if="confirmedPosterHtml" class="wf-pub-guide-step">→ 先下载海报PNG，在{{ PLATFORMS.find(p=>p.key===targetPlatform)?.name }}上传为封面图</div>
        <div class="wf-pub-guide-step active">→ 在{{ PLATFORMS.find(p=>p.key===targetPlatform)?.name }}创作页粘贴文案（Ctrl+V）→ 点发布</div>
      </div>

      <!-- 发布按钮 -->
      <div class="wf-pub-row">
        <button class="wf-pub-btn" @click="publishNow" :disabled="publishing || published">
          <svg v-if="!publishing && !published" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
          <span v-if="publishing">发布中…</span>
          <span v-else-if="published">✓ 已发布</span>
          <span v-else>发布到{{ PLATFORMS.find(p=>p.key===targetPlatform)?.name }} →</span>
        </button>
        <button v-if="published" class="wf-again-btn" @click="resetWorkflow">再发一条</button>
      </div>
    </div>
    </transition>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'
import AgentChat from '@/components/agent/AgentChat.vue'
import ProductSelector from '@/components/agent/ProductSelector.vue'
import CopyPublishCard from '@/components/agent/CopyPublishCard.vue'
import PosterRenderer from '@/components/agent/PosterRenderer.vue'
import type { PublishCardData } from '@/components/agent/CopyPublishCard.vue'
import type { SelectedGoods } from '@/components/agent/ProductSelector.vue'
import { useBrandStore } from '@/stores/brand'

const brandStore = useBrandStore()
const router = useRouter()

const STEPS = [
  { label: '选主题' },
  { label: '写文案' },
  { label: '做海报' },
  { label: '去发布' },
]

const PLATFORMS = [
  { key: 'xiaohongshu', name: '小红书', emoji: '📕', url: 'https://creator.xiaohongshu.com/publish/publish' },
  { key: 'douyin',      name: '抖音',   emoji: '🎵', url: 'https://creator.douyin.com/creator-micro/content/upload' },
  { key: 'weibo',       name: '微博',   emoji: '🌐', url: 'https://weibo.com/minipublish' },
]

// ── State ──
const currentStep   = ref(0)
const selectedProduct = ref<SelectedGoods | null>(null)
const targetPlatform  = ref('xiaohongshu')

// Step 2
const copyAgentRef    = ref<InstanceType<typeof AgentChat>>()
const pendingCopy     = ref<PublishCardData | null>(null)
const confirmedCopy   = ref<PublishCardData | null>(null)

// Step 3
const posterAgentRef  = ref<InstanceType<typeof AgentChat>>()
const pendingPosterHtml   = ref<string | null>(null)
const confirmedPosterHtml = ref<string | null>(null)
const posterMiniRef       = ref<HTMLDivElement>()
const posterMiniInnerRef  = ref<HTMLDivElement>()
const dlBusy              = ref(false)

// Step 4
const publishing         = ref(false)
const published          = ref(false)
const publishGuideVisible = ref(false)

// ── Context for agents ──
const agentContext = computed(() => {
  const ctx: Record<string, string> = {}
  if (selectedProduct.value) {
    const g = selectedProduct.value
    const lines = ['【内容主角商品】', `商品名称：${g.name}`]
    if (g.price)     lines.push(`售价：¥${g.price}`)
    if (g.spec_name) lines.push(`规格：${g.spec_name}`)
    if (g.cate_name) lines.push(`分类：${g.cate_name}`)
    if (g.remark)    lines.push(`描述：${g.remark}`)
    lines.push('\n请基于以上商品信息生成内容，必须体现该商品的名称和核心卖点。')
    ctx.productContext = lines.join('\n')
  } else {
    // 品牌整体推广，不绑定具体商品
    ctx.productContext = '【内容方向：品牌整体推广】\n本次内容不针对具体商品，请围绕品牌整体形象、价值主张和用户故事进行创作。突出品牌差异化优势和品牌调性，而非具体产品功能。'
  }
  return ctx
})

// 文案快捷指令
const copyQuickPrompts = computed(() => {
  const plat = PLATFORMS.find(p => p.key === targetPlatform.value)?.name || '小红书'
  if (selectedProduct.value) {
    const name = selectedProduct.value.name
    return [
      `给「${name}」写一篇${plat}爆款笔记`,
      `给「${name}」写3个吸引人的标题`,
      `给「${name}」写一篇种草文案`,
    ]
  }
  const brand = brandStore.brand?.name || '品牌'
  return [
    `写一篇${plat}品牌宣传文案`,
    `写一篇介绍「${brand}」核心价值的爆款笔记`,
    `写3个适合${plat}的品牌故事标题`,
  ]
})

// 海报快捷指令
const posterQuickPrompts = computed(() => {
  if (selectedProduct.value) {
    const name = selectedProduct.value.name
    return [
      `为「${name}」设计一张小红书封面`,
      `为「${name}」设计一张促销海报`,
      `为「${name}」设计极简风格海报`,
    ]
  }
  const brand = brandStore.brand?.name || '品牌'
  return [
    `为「${brand}」设计一张品牌宣传海报`,
    `为「${brand}」设计一张小红书封面图`,
    `为「${brand}」设计一张极简品牌海报`,
  ]
})

// ── Handlers ──
function sendCopyPrompt(text: string) {
  nextTick(() => copyAgentRef.value?.sendQuickPrompt(text))
}

function sendPosterPrompt(text: string) {
  nextTick(() => posterAgentRef.value?.sendQuickPrompt(text))
}

function onCopyComplete(payload: { publishCard?: PublishCardData; posterHtml?: string }) {
  if (payload.publishCard) {
    // 将平台替换为用户选择的平台
    const plat = PLATFORMS.find(p => p.key === targetPlatform.value)
    pendingCopy.value = {
      ...payload.publishCard,
      platform: targetPlatform.value,
      platform_name: plat?.name || payload.publishCard.platform_name,
    }
  }
}

function confirmCopy() {
  confirmedCopy.value = pendingCopy.value
  pendingCopy.value = null
  currentStep.value = 2
}

function onPosterComplete(payload: { publishCard?: PublishCardData; posterHtml?: string }) {
  if (payload.posterHtml) {
    pendingPosterHtml.value = payload.posterHtml
  }
}

function confirmPoster() {
  confirmedPosterHtml.value = pendingPosterHtml.value
  pendingPosterHtml.value = null
  currentStep.value = 3
}

function skipPoster() {
  confirmedPosterHtml.value = null
  pendingPosterHtml.value = null
  currentStep.value = 3
}

function onPosterSaved(_dataUrl: string) {
  // PosterRenderer 内部已存入发布队列
}

// ── 海报预览缩放 ──
const sanitizedPosterHtml = computed(() =>
  (confirmedPosterHtml.value || '').replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
)

const MINI_W = 200
watch([confirmedPosterHtml, posterMiniInnerRef], async () => {
  await nextTick()
  if (!posterMiniInnerRef.value) return
  const el = posterMiniInnerRef.value.firstElementChild as HTMLElement
  if (!el) return
  const wMatch = (confirmedPosterHtml.value || '').match(/width:\s*(\d+)px/)
  const posterW = wMatch ? parseInt(wMatch[1]) : 1080
  const s = MINI_W / posterW
  el.style.transform = `scale(${s})`
  el.style.transformOrigin = 'top left'
  const hMatch = (confirmedPosterHtml.value || '').match(/height:\s*(\d+)px/)
  const posterH = hMatch ? parseInt(hMatch[1]) : 1440
  if (posterMiniRef.value) {
    posterMiniRef.value.style.height = `${posterH * s}px`
  }
})

async function downloadPoster() {
  if (!confirmedPosterHtml.value) return
  dlBusy.value = true
  try {
    const wrapper = document.createElement('div')
    wrapper.style.cssText = 'position:fixed;left:-9999px;top:-9999px;overflow:hidden;'
    const inner = document.createElement('div')
    inner.innerHTML = sanitizedPosterHtml.value
    wrapper.appendChild(inner)
    document.body.appendChild(wrapper)
    await nextTick()
    const poster = inner.firstElementChild as HTMLElement
    const canvas = await html2canvas(poster || inner, { useCORS: true, allowTaint: true, scale: 1, backgroundColor: null })
    document.body.removeChild(wrapper)
    const link = document.createElement('a')
    link.download = `poster-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    ElMessage.success('海报已下载')
  } catch {
    ElMessage.error('下载失败，请重试')
  } finally {
    dlBusy.value = false
  }
}

// ── 发布 ──
async function publishNow() {
  if (!confirmedCopy.value) return
  publishing.value = true
  try {
    const plat = PLATFORMS.find(p => p.key === targetPlatform.value)
    const text = [confirmedCopy.value.title, '', confirmedCopy.value.body, '', (confirmedCopy.value.hashtags || []).map((t: string) => `#${t}`).join(' ')].join('\n').trim()
    await navigator.clipboard.writeText(text)
    window.open(plat?.url || PLATFORMS[0].url, '_blank')
    publishGuideVisible.value = true
    published.value = true
    ElMessage({ message: '文案已复制，在平台粘贴后发布即可 ✓', type: 'success', duration: 5000 })
  } catch {
    ElMessage.error('复制失败，请手动复制文案')
  } finally {
    publishing.value = false
  }
}

function resetWorkflow() {
  currentStep.value = 0
  selectedProduct.value = null
  pendingCopy.value = null
  confirmedCopy.value = null
  pendingPosterHtml.value = null
  confirmedPosterHtml.value = null
  published.value = false
  publishGuideVisible.value = false
}
</script>

<style scoped>
.wf-page {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-width: 760px;
  padding-bottom: 60px;
}

/* ── 步骤条 ── */
.wf-stepper {
  display: flex;
  align-items: center;
  background: #fff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  padding: 14px 20px;
  gap: 0;
}
.wf-step-item {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  cursor: default;
  min-width: 0;
}
.wf-step-item.done { cursor: pointer; }
.wf-step-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 800;
  flex-shrink: 0;
  background: #F0F0EE;
  color: #AAA;
  transition: all 0.2s;
}
.wf-step-item.active .wf-step-dot { background: #1d1d1f; color: #fff; }
.wf-step-item.done .wf-step-dot { background: #10b981; color: #fff; }
.wf-step-label {
  font-size: 12px;
  font-weight: 600;
  color: #CCC;
  white-space: nowrap;
  transition: color 0.2s;
}
.wf-step-item.active .wf-step-label { color: #1d1d1f; }
.wf-step-item.done .wf-step-label { color: #10b981; }
.wf-step-connector {
  flex: 1;
  height: 2px;
  background: #E8E8E8;
  margin: 0 8px;
  border-radius: 1px;
  transition: background 0.3s;
}
.wf-step-connector.done { background: #10b981; }

/* ── 通用卡片 ── */
.wf-card {
  background: #fff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
.wf-card-hd {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 18px;
}
.wf-card-icon { font-size: 22px; flex-shrink: 0; }
.wf-card-title { font-size: 15px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; }
.wf-card-sub { font-size: 12px; color: #999; margin-top: 2px; }
.wf-card-hd .wf-skip-btn {
  margin-left: auto;
  font-size: 11px;
  color: #999;
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  font-family: inherit;
}
.wf-card-hd .wf-skip-btn:hover { background: #f0f0f0; }

/* ── Section / Field ── */
.wf-section { margin-bottom: 16px; }
.wf-field-label {
  font-size: 11px;
  font-weight: 700;
  color: #888;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 7px;
}
.wf-required { color: #ef4444; }
.wf-optional { color: #999; font-weight: 400; font-size: 11px; }
.wf-hint { font-size: 11px; color: #BBBB; margin-top: 6px; }

/* 品牌展示 */
.wf-brand-display {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background: #F8F8F6;
  border-radius: 10px;
}
.wf-brand-avatar {
  width: 32px; height: 32px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.wf-brand-name { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.wf-brand-sub { font-size: 11px; color: #999; margin-top: 1px; }
.wf-brand-edit {
  margin-left: auto;
  font-size: 11px; font-weight: 600;
  color: #6366f1; text-decoration: none;
}
.wf-brand-edit:hover { text-decoration: underline; }

/* 平台选择 */
.wf-platform-row { display: flex; gap: 8px; }
.wf-platform-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 14px;
  border-radius: 8px;
  border: 1.5px solid #E8E8E8;
  background: #fff;
  font-size: 12px; font-weight: 600; color: #555;
  cursor: pointer; font-family: inherit;
  transition: all 0.15s;
}
.wf-platform-btn:hover { border-color: #aaa; }
.wf-platform-btn.active { border-color: #1d1d1f; background: #1d1d1f; color: #fff; }
.wf-platform-emoji { font-size: 14px; }

/* 下一步按钮 */
.wf-next-btn {
  display: flex; align-items: center; justify-content: center; gap: 7px;
  width: 100%; padding: 13px;
  background: #1d1d1f; color: #fff;
  border: none; border-radius: 10px;
  font-size: 14px; font-weight: 700;
  cursor: pointer; font-family: inherit;
  transition: background 0.15s;
  margin-top: 4px;
}
.wf-next-btn:hover:not(:disabled) { background: #333; }
.wf-next-btn:disabled { opacity: 0.35; cursor: not-allowed; }

/* 完成摘要栏 */
.wf-done-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: rgba(16,185,129,0.06);
  border: 1px solid rgba(16,185,129,0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s;
}
.wf-done-summary:hover { background: rgba(16,185,129,0.1); }
.wf-done-icon { font-size: 13px; color: #10b981; font-weight: 800; }
.wf-done-text { flex: 1; font-size: 12px; font-weight: 600; color: #059669; }
.wf-done-edit { font-size: 11px; color: #6366f1; font-weight: 600; }

/* 快捷指令 */
.wf-quick-row {
  display: flex; flex-wrap: wrap; gap: 6px;
  margin-bottom: 12px;
}
.wf-quick-btn {
  padding: 6px 12px;
  background: #F8F8F6; border: 1px solid #E8E8E8;
  border-radius: 20px; font-size: 11px; font-weight: 500; color: #555;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.wf-quick-btn:hover { background: #f0f0ee; border-color: #ccc; }

/* 对话区 */
.wf-chat-wrap {
  border: 1px solid #F0F0EE;
  border-radius: 10px;
  overflow: hidden;
}
.wf-chat-wrap :deep(.agent-bar) {
  border: none !important; border-radius: 0 !important;
  box-shadow: none !important; background: transparent !important;
  margin-bottom: 0 !important;
}

/* 确认区 */
.wf-confirm-zone {
  margin-top: 14px;
  border-top: 1px solid #F0F0EE;
  padding-top: 14px;
}
.wf-confirm-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 700; color: #10b981;
  margin-bottom: 10px;
}
.wf-confirm-actions {
  display: flex; gap: 8px; margin-top: 12px; flex-wrap: wrap;
}
.wf-confirm-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 18px;
  background: #1d1d1f; color: #fff;
  border: none; border-radius: 8px;
  font-size: 13px; font-weight: 700;
  cursor: pointer; font-family: inherit; transition: background 0.15s;
}
.wf-confirm-btn:hover { background: #333; }
.wf-retry-btn {
  padding: 10px 16px;
  background: transparent; color: #666;
  border: 1px solid #ddd; border-radius: 8px;
  font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.wf-retry-btn:hover { border-color: #999; color: #333; }
.wf-skip-btn-inline {
  padding: 10px 14px;
  background: transparent; color: #bbb;
  border: none; border-radius: 8px;
  font-size: 11px; cursor: pointer; font-family: inherit;
}
.wf-skip-btn-inline:hover { color: #666; }

/* ── 发布卡 ── */
.wf-publish-card { border-top: 3px solid #10b981; }

.wf-preview-zone {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
}
.wf-preview-zone.has-poster {
  align-items: flex-start;
}
.wf-preview-poster {
  flex-shrink: 0;
  width: 200px;
}
.wf-preview-copy { flex: 1; }
.wf-preview-label {
  font-size: 10px; font-weight: 700; color: #AAAAAA;
  text-transform: uppercase; letter-spacing: 0.06em;
  margin-bottom: 6px;
}

/* 海报缩略图 */
.wf-poster-mini {
  width: 200px;
  overflow: hidden;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  position: relative;
}
.wf-poster-mini-inner { transform-origin: top left; }
.wf-poster-actions { margin-top: 8px; display: flex; gap: 6px; }
.wf-dl-btn {
  display: flex; align-items: center; gap: 5px;
  width: 100%; padding: 6px 10px;
  background: #1d1d1f; color: #fff;
  border: none; border-radius: 6px;
  font-size: 11px; font-weight: 600;
  cursor: pointer; font-family: inherit; justify-content: center;
  transition: background 0.15s;
}
.wf-dl-btn:hover:not(:disabled) { background: #333; }
.wf-dl-btn:disabled { opacity: 0.5; cursor: default; }

/* 操作提示 */
.wf-pub-guide {
  background: rgba(16,185,129,0.05);
  border: 1px solid rgba(16,185,129,0.15);
  border-radius: 10px;
  padding: 12px 14px;
  margin-bottom: 14px;
  display: flex; flex-direction: column; gap: 6px;
}
.wf-pub-guide-step { font-size: 12px; color: #555; }
.wf-pub-guide-step.done { color: #10b981; font-weight: 600; }
.wf-pub-guide-step.active { color: #0071e3; font-weight: 600; }

/* 发布按钮 */
.wf-pub-row { display: flex; gap: 10px; }
.wf-pub-btn {
  flex: 1;
  display: flex; align-items: center; justify-content: center; gap: 7px;
  padding: 14px;
  background: #ff375f; color: #fff;
  border: none; border-radius: 10px;
  font-size: 15px; font-weight: 800;
  cursor: pointer; font-family: inherit;
  transition: background 0.15s;
}
.wf-pub-btn:hover:not(:disabled) { background: #e0264e; }
.wf-pub-btn:disabled { opacity: 0.5; cursor: default; background: #10b981; }
.wf-again-btn {
  padding: 14px 20px;
  background: transparent; color: #555;
  border: 1px solid #ddd; border-radius: 10px;
  font-size: 13px; font-weight: 600;
  cursor: pointer; font-family: inherit;
  white-space: nowrap; transition: all 0.15s;
}
.wf-again-btn:hover { border-color: #999; }

/* ── 过渡动画 ── */
.wf-fade-enter-active, .wf-fade-leave-active { transition: opacity 0.2s, transform 0.2s; }
.wf-fade-enter-from { opacity: 0; transform: translateY(8px); }
.wf-fade-leave-to { opacity: 0; transform: translateY(-4px); }
</style>
