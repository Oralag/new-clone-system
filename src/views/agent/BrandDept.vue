<template>
  <div class="brand-dept">

    <DeptEmployeeCard
      name="Iris"
      role="品牌策略师"
      emoji="💎"
      desc="品牌定位 · 调性把控 · 竞品分析"
      color="#8b5cf6"
      illustId="brand"
      :stats="[
        { value: store.profiles.length, label: '品牌数' },
      ]"
    />

    <div class="three-col">

      <!-- 左侧 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#8b5cf6"></span>今日目标</div>
          <textarea v-model="todayGoal" class="goal-input" placeholder="今日品牌工作目标..." rows="3" @blur="saveGoal"/>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#6366f1"></span>快捷指令</div>
          <div class="quick-list">
            <button v-for="q in quickPrompts" :key="q.text" class="quick-item" @click="chatRef?.sendQuickPrompt(q.text)">
              <span class="quick-emoji">{{ q.emoji }}</span>
              <span class="quick-text">{{ q.text }}</span>
            </button>
          </div>
        </div>

        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#10b981"></span>品牌配置</div>
          <div class="brand-summary" v-if="store.isConfigured">
            <div class="bs-row"><span class="bs-label">品牌名</span><span class="bs-val">{{ store.brand.name }}</span></div>
            <div class="bs-row"><span class="bs-label">行业</span><span class="bs-val">{{ store.brand.industry }}</span></div>
            <div class="bs-row" v-if="store.brand.slogan"><span class="bs-label">品牌口号</span><span class="bs-val">{{ store.brand.slogan }}</span></div>
          </div>
          <div v-else class="output-empty">尚未配置品牌信息</div>
          <button class="config-btn" @click="goToBrandSettings()">
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8.5 1.5l2 2L4 10H2v-2l6.5-6.5z"/></svg>
            编辑品牌配置
          </button>
        </div>

        <!-- 渠道接入状态 -->
        <div class="panel-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#7c3aed"></span>
            渠道登记状态
            <router-link to="/agent/channels" class="panel-link-sm">管理</router-link>
          </div>
          <div class="ch-mini-list">
            <div v-for="c in channels" :key="c.id" class="ch-mini-item">
              <span class="ch-mini-icon" :style="{ background: c.connected ? c.color : '#e2e8f0' }">{{ c.emoji }}</span>
              <span class="ch-mini-name">{{ c.name }}</span>
              <span class="ch-mini-dot" :class="c.connected ? 'dot-on' : 'dot-off'"></span>
            </div>
          </div>
        </div>

      </aside>

      <!-- 中间：对话 -->
      <section class="chat-panel" :style="{ '--ac': '#8b5cf6' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">💎</span>
            <div>
              <div class="chat-agent-name">Iris · 品牌策略师</div>
              <div class="chat-agent-sub">品牌部 · 定位 & 调性 & 竞品分析</div>
            </div>
          </div>
        </div>
        <AgentChat agent-id="brand" ref="chatRef" />
      </section>

      <!-- 右侧：品牌档案 -->
      <aside class="right-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#8b5cf6"></span>品牌档案</div>
          <template v-if="store.isConfigured">
            <div class="brand-card">
              <div class="brand-card-logo">{{ store.brand.name?.slice(0,1) }}</div>
              <div class="brand-card-info">
                <div class="brand-card-name">{{ store.brand.name }}</div>
                <div class="brand-card-meta">{{ store.brand.industry }}</div>
              </div>
            </div>
            <div class="brand-attr-list">
              <div class="brand-attr" v-if="store.brand.slogan">
                <span class="attr-label">品牌口号</span>
                <span class="attr-val">{{ store.brand.slogan }}</span>
              </div>
              <div class="brand-attr" v-if="store.brand.audienceDesc">
                <span class="attr-label">受众</span>
                <span class="attr-val">{{ store.brand.audienceDesc?.slice(0, 40) }}{{ (store.brand.audienceDesc?.length || 0) > 40 ? '…' : '' }}</span>
              </div>
              <div class="brand-attr" v-if="store.brand.tone">
                <span class="attr-label">调性</span>
                <span class="attr-val">{{ store.brand.tone }}</span>
              </div>
            </div>
          </template>
          <div v-else class="output-empty">配置品牌信息后显示档案</div>
        </div>

        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd"><span class="panel-dot" style="background:#8b5cf6"></span>策略准确率</div>
          <div class="accuracy-bar">
            <div class="accuracy-label">定位精准</div>
            <div class="accuracy-track"><div class="accuracy-fill" style="width:91%"></div></div>
            <span class="accuracy-pct">91%</span>
          </div>
          <div class="accuracy-bar" style="margin-top:8px">
            <div class="accuracy-label">调性一致</div>
            <div class="accuracy-track"><div class="accuracy-fill" style="width:94%"></div></div>
            <span class="accuracy-pct">94%</span>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { useChannels } from '@/composables/useChannels'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'

const { channels } = useChannels()

const router = useRouter()
const store = useBrandStore()
const isMobile = /Android|webOS|iPhone|iPad|iPod/i.test(navigator.userAgent)
function goToBrandSettings() {
  router.push(isMobile ? '/mobile/agent/brand-settings' : '/agent/brand-settings')
}
const chatRef = ref<InstanceType<typeof AgentChat>>()

const todayGoal = ref(localStorage.getItem('brand_dept_goal') || '')
function saveGoal() { localStorage.setItem('brand_dept_goal', todayGoal.value) }

const quickPrompts = [
  { emoji: '🎯', text: '分析我们品牌的定位，和竞品有什么差异化？' },
  { emoji: '💡', text: '帮我梳理品牌的核心价值主张' },
  { emoji: '🗣️', text: '给品牌写3条slogan候选' },
  { emoji: '📊', text: '分析目标受众的核心痛点和需求' },
  { emoji: '🔍', text: '帮我做一次品牌健康度诊断' },
]
</script>

<style scoped>
.brand-dept { display: flex; flex-direction: column; gap: 14px; padding-bottom: 40px; max-width: 1400px; }
.three-col { display: grid; grid-template-columns: 220px 1fr 220px; gap: 14px; align-items: start; }
.panel-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
.panel-hd { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.panel-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.left-panel { display: flex; flex-direction: column; gap: 10px; }
.goal-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #333; background: #F8F8F6; resize: none; outline: none; font-family: inherit; line-height: 1.5; box-sizing: border-box; }
.goal-input:focus { border-color: #8b5cf6; }
.quick-list { display: flex; flex-direction: column; gap: 6px; }
.quick-item { display: flex; align-items: flex-start; gap: 7px; padding: 8px 10px; border-radius: 8px; background: #F8F8F6; border: 1px solid transparent; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.15s; }
.quick-item:hover { background: rgba(139,92,246,0.06); border-color: rgba(139,92,246,0.2); }
.quick-emoji { font-size: 13px; flex-shrink: 0; }
.quick-text { font-size: 11px; color: #555; line-height: 1.4; }

.brand-summary { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
.bs-row { display: flex; gap: 6px; align-items: baseline; }
.bs-label { font-size: 10px; color: #AAAAAA; width: 36px; flex-shrink: 0; }
.bs-val { font-size: 12px; color: #333; font-weight: 500; }
.config-btn { display: flex; align-items: center; gap: 5px; width: 100%; padding: 8px 12px; border-radius: 8px; border: 1px solid #E8E8E8; background: #F8F8F6; font-size: 11px; font-weight: 600; color: #666; cursor: pointer; font-family: inherit; transition: all 0.15s; justify-content: center; }
.config-btn:hover { border-color: #8b5cf6; color: #8b5cf6; background: rgba(139,92,246,0.04); }
.output-empty { padding: 12px 0; text-align: center; font-size: 12px; color: #CCCCCC; font-style: italic; }

.chat-panel { background: #fff; border: 1px solid #E8E8E8; border-left: 3px solid var(--ac,#8b5cf6); border-radius: 14px; padding: 16px 16px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-shrink: 0; }
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-agent-emoji { font-size: 24px; }
.chat-agent-name { font-size: 14px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.02em; }
.chat-agent-sub { font-size: 11px; color: #AAAAAA; margin-top: 1px; }
.chat-panel :deep(.agent-bar) { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; margin-bottom: 0 !important; border-top: 1px solid rgba(0,0,0,0.06) !important; }

.right-panel { display: flex; flex-direction: column; gap: 0; }
.brand-card { display: flex; align-items: center; gap: 10px; margin-bottom: 12px; }
.brand-card-logo { width: 36px; height: 36px; border-radius: 9px; background: #8b5cf6; color: #fff; font-size: 16px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.brand-card-name { font-size: 14px; font-weight: 700; color: #1A1A1A; }
.brand-card-meta { font-size: 11px; color: #AAAAAA; margin-top: 2px; }
.brand-attr-list { display: flex; flex-direction: column; gap: 8px; }
.brand-attr { display: flex; flex-direction: column; gap: 2px; padding: 7px 10px; background: #F8F8F6; border-radius: 8px; }
.attr-label { font-size: 9px; font-weight: 700; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.06em; }
.attr-val { font-size: 12px; color: #333; line-height: 1.4; }
.accuracy-bar { display: flex; align-items: center; gap: 8px; }
.accuracy-label { font-size: 11px; color: #666; width: 56px; flex-shrink: 0; }
.accuracy-track { flex: 1; height: 5px; background: #F0F0EE; border-radius: 3px; overflow: hidden; }
.accuracy-fill { height: 100%; background: #8b5cf6; border-radius: 3px; }
.accuracy-pct { font-size: 11px; font-weight: 700; color: #8b5cf6; width: 30px; text-align: right; flex-shrink: 0; }
@media (max-width: 1100px) { .three-col { grid-template-columns: 1fr; } .left-panel, .right-panel { display: none; } }

.panel-link-sm { margin-left: auto; font-size: 10px; font-weight: 600; color: #7c3aed; text-decoration: none; }
.panel-link-sm:hover { text-decoration: underline; }
.ch-mini-list { display: flex; flex-direction: column; gap: 6px; }
.ch-mini-item { display: flex; align-items: center; gap: 8px; }
.ch-mini-icon { width: 24px; height: 24px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-size: 13px; flex-shrink: 0; transition: background 0.2s; }
.ch-mini-name { flex: 1; font-size: 11px; color: #334155; font-weight: 600; }
.ch-mini-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.dot-on  { background: #10b981; }
.dot-off { background: #cbd5e1; }
</style>
