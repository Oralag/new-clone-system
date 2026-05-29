<template>
  <div class="creative-dept">

    <DeptEmployeeCard
      name="Leo"
      role="创意设计师"
      emoji="🎨"
      desc="海报 · 视觉设计 · 创意策略"
      color="#ec4899"
      illustId="creative"
      :stats="[
        { value: posterCount, label: '已生海报' },
        { value: publishCount, label: '已发布' },
      ]"
    />

    <div class="three-col">

      <!-- 左侧 -->
      <aside class="left-panel">
        <div class="panel-card">
          <div class="panel-hd"><span class="panel-dot" style="background:#ec4899"></span>今日目标</div>
          <textarea v-model="todayGoal" class="goal-input" placeholder="今日创意目标..." rows="3" @blur="saveGoal"/>
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
          <div class="panel-hd"><span class="panel-dot" style="background:#10b981"></span>部门状态</div>
          <div class="status-list">
            <div class="status-row"><span class="status-label">设计专员</span><span class="status-badge green">待命</span></div>
            <div class="status-row"><span class="status-label">今日海报</span><span class="status-badge blue">{{ posterCount }} 张</span></div>
            <div class="status-row"><span class="status-label">已发布</span><span class="status-badge green">{{ publishCount }} 条</span></div>
          </div>
        </div>
      </aside>

      <!-- 中间：对话 -->
      <section class="chat-panel" :style="{ '--ac': '#ec4899' }">
        <div class="chat-header">
          <div class="chat-header-left">
            <span class="chat-agent-emoji">🎨</span>
            <div>
              <div class="chat-agent-name">Leo · 创意设计师</div>
              <div class="chat-agent-sub">创意部 · 海报 & 视觉设计</div>
            </div>
          </div>
          <div class="chat-chips">
            <button class="chip-btn" @click="$router.push('/agent/poster')">生成海报</button>
            <button class="chip-btn" @click="$router.push('/agent/meeting')">发起会议</button>
          </div>
        </div>
        <div class="product-selector-row">
          <ProductSelector @change="selectedProduct = $event" />
        </div>
        <AgentChat agent-id="poster" ref="chatRef" :context-data="agentContext" />
      </section>

      <!-- 右侧：海报产出 -->
      <aside class="right-panel">
        <div class="panel-card output-card">
          <div class="panel-hd">
            <span class="panel-dot" style="background:#ec4899"></span>
            今日海报
            <span class="panel-count">{{ posterCount }}</span>
          </div>
          <div v-if="posterCount === 0" class="output-empty">暂无产出 · 开始对话生成</div>
          <div v-else class="output-list">
            <div v-for="(r, i) in agentStore.flowResults.filter(r => r.type === 'poster').slice().reverse().slice(0,5)" :key="i" class="output-item">
              <div class="output-item-top">
                <span class="output-type poster">海报</span>
                <span class="output-time">{{ r.platform || '通用' }}</span>
              </div>
              <div class="output-title">{{ r.title || r.topic || '未命名' }}</div>
            </div>
          </div>
          <button
            v-if="posterCount > 0"
            class="send-next-btn"
            @click="sendToPublish"
            :class="{ sent: sentToPublish }"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
              <path d="M2 5.5h7M6 3l3 2.5L6 8"/>
            </svg>
            {{ sentToPublish ? '已发给发布部 ✓' : '发给发布部 →' }}
          </button>
        </div>

        <div class="panel-card" style="margin-top:10px">
          <div class="panel-hd"><span class="panel-dot" style="background:#ec4899"></span>创意准确率</div>
          <div class="accuracy-bar">
            <div class="accuracy-label">视觉质量</div>
            <div class="accuracy-track"><div class="accuracy-fill" style="width:92%"></div></div>
            <span class="accuracy-pct">92%</span>
          </div>
          <div class="accuracy-bar" style="margin-top:8px">
            <div class="accuracy-label">品牌契合</div>
            <div class="accuracy-track"><div class="accuracy-fill" style="width:85%"></div></div>
            <span class="accuracy-pct">85%</span>
          </div>
        </div>
      </aside>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import { usePipelineStore } from '@/stores/pipeline'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import ProductSelector from '@/components/agent/ProductSelector.vue'
import type { SelectedGoods } from '@/components/agent/ProductSelector.vue'
import { ElMessage } from 'element-plus'

const agentStore = useTrendingStore()
const pipelineStore = usePipelineStore()
const chatRef = ref<InstanceType<typeof AgentChat>>()
const sentToPublish = ref(false)
const selectedProduct = ref<SelectedGoods | null>(null)

const agentContext = computed(() => {
  if (!selectedProduct.value) return {}
  const g = selectedProduct.value
  const lines = [`【内容主角商品】`]
  lines.push(`商品名称：${g.name}`)
  if (g.price) lines.push(`售价：¥${g.price}`)
  if (g.spec_name) lines.push(`规格：${g.spec_name}`)
  if (g.cate_name) lines.push(`分类：${g.cate_name}`)
  if (g.remark) lines.push(`商品描述：${g.remark}`)
  lines.push(`\n请基于以上商品信息设计海报，海报标题必须体现该商品名称，视觉风格需符合商品特性。`)
  return { productContext: lines.join('\n') }
})

const posterCount = computed(() => agentStore.flowResults.filter(r => r.type === 'poster').length)
const publishCount = computed(() => agentStore.history.filter(h => h.status === 'published').length)

const todayGoal = ref(localStorage.getItem('creative_dept_goal') || '')
function saveGoal() { localStorage.setItem('creative_dept_goal', todayGoal.value) }

const quickPrompts = [
  { emoji: '🖼️', text: '帮我设计一张小红书封面海报' },
  { emoji: '📱', text: '生成一套抖音主页视觉方案' },
  { emoji: '🎨', text: '给新品发布设计一套视觉风格' },
  { emoji: '💡', text: '分析竞品的视觉风格，给出建议' },
]

function sendToPublish() {
  const posters = agentStore.flowResults.filter(r => r.type === 'poster')
  if (posters.length === 0) return
  const latest = posters[posters.length - 1]
  const title = latest.title || latest.topic || '创意海报'
  const task = pipelineStore.tasks.find(t => t.currentStage === 2 && t.status === 'running')
  if (task) {
    pipelineStore.recordOutput(task.id, 'creative', title)
    pipelineStore.advanceStage(task.id)
  } else {
    pipelineStore.createTask(title)
    const newTask = pipelineStore.tasks[0]
    pipelineStore.advanceStage(newTask.id) // →content
    pipelineStore.advanceStage(newTask.id) // →creative
    pipelineStore.recordOutput(newTask.id, 'creative', title)
    pipelineStore.advanceStage(newTask.id) // →publish
  }
  sentToPublish.value = true
  ElMessage.success('已发给发布部，可在任务中心查看')
  setTimeout(() => { sentToPublish.value = false }, 3000)
}
</script>

<style scoped>
.creative-dept { display: flex; flex-direction: column; gap: 14px; padding-bottom: 40px; max-width: 1400px; }
.three-col { display: grid; grid-template-columns: 220px 1fr 220px; gap: 14px; align-items: start; }
.panel-card { background: #fff; border: 1px solid #E8E8E8; border-radius: 14px; padding: 14px 16px; box-shadow: 0 1px 6px rgba(0,0,0,0.04); }
.panel-hd { display: flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: #AAAAAA; text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 10px; }
.panel-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.panel-count { margin-left: auto; background: #F0F0EE; color: #666; font-size: 10px; font-weight: 700; padding: 1px 7px; border-radius: 10px; }
.left-panel { display: flex; flex-direction: column; gap: 10px; }
.goal-input { width: 100%; border: 1px solid #E8E8E8; border-radius: 8px; padding: 8px 10px; font-size: 12px; color: #333; background: #F8F8F6; resize: none; outline: none; font-family: inherit; line-height: 1.5; box-sizing: border-box; }
.goal-input:focus { border-color: #ec4899; }
.quick-list { display: flex; flex-direction: column; gap: 6px; }
.quick-item { display: flex; align-items: flex-start; gap: 7px; padding: 8px 10px; border-radius: 8px; background: #F8F8F6; border: 1px solid transparent; cursor: pointer; text-align: left; font-family: inherit; transition: all 0.15s; }
.quick-item:hover { background: rgba(236,72,153,0.06); border-color: rgba(236,72,153,0.2); }
.quick-emoji { font-size: 13px; flex-shrink: 0; }
.quick-text { font-size: 11px; color: #555; line-height: 1.4; }
.status-list { display: flex; flex-direction: column; gap: 7px; }
.status-row { display: flex; align-items: center; justify-content: space-between; }
.status-label { font-size: 12px; color: #555; }
.status-badge { font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 20px; }
.status-badge.green { background: rgba(52,211,153,0.1); color: #059669; }
.status-badge.blue  { background: rgba(0,113,227,0.08); color: #0071e3; }
.chat-panel { background: #fff; border: 1px solid #E8E8E8; border-left: 3px solid var(--ac,#ec4899); border-radius: 14px; padding: 16px 16px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden; min-height: 500px; display: flex; flex-direction: column; }
.chat-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 14px; flex-shrink: 0; }
.chat-header-left { display: flex; align-items: center; gap: 10px; }
.chat-agent-emoji { font-size: 24px; }
.chat-agent-name { font-size: 14px; font-weight: 800; color: #1A1A1A; letter-spacing: -0.02em; }
.chat-agent-sub { font-size: 11px; color: #AAAAAA; margin-top: 1px; }
.chat-chips { display: flex; gap: 5px; }
.chip-btn { background: #F8F8F6; border: 1px solid #E8E8E8; border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; color: #666; cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.15s; }
.chip-btn:hover { border-color: #ec4899; color: #ec4899; }
.product-selector-row {
  padding: 8px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.05);
  background: rgba(236,72,153,0.03);
}
.chat-panel :deep(.agent-bar) { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; margin-bottom: 0 !important; border-top: 1px solid rgba(0,0,0,0.06) !important; }
.right-panel { display: flex; flex-direction: column; gap: 0; }
.output-empty { padding: 14px 0; text-align: center; font-size: 12px; color: #CCCCCC; font-style: italic; }
.output-list { display: flex; flex-direction: column; gap: 6px; }
.output-item { padding: 9px 10px; border-radius: 8px; background: #F8F8F6; cursor: pointer; transition: background 0.15s; }
.output-item:hover { background: #F0F0EE; }
.output-item-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.output-type { font-size: 9px; font-weight: 800; padding: 1px 7px; border-radius: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
.output-type.poster { background: rgba(236,72,153,0.1); color: #db2777; }
.output-time { font-size: 10px; color: #CCCCCC; }
.output-title { font-size: 12px; color: #333; line-height: 1.4; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.send-next-btn {
  display: flex; align-items: center; justify-content: center; gap: 5px;
  width: 100%; margin-top: 10px; padding: 8px;
  background: rgba(236,72,153,0.08); border: 1px solid rgba(236,72,153,0.3);
  border-radius: 8px; font-size: 12px; font-weight: 600; color: #db2777;
  cursor: pointer; font-family: inherit; transition: all 0.15s;
}
.send-next-btn:hover:not(.sent) { background: #ec4899; color: white; border-color: #ec4899; }
.send-next-btn.sent { background: rgba(52,211,153,0.1); border-color: rgba(52,211,153,0.3); color: #059669; cursor: default; }
.accuracy-bar { display: flex; align-items: center; gap: 8px; }
.accuracy-label { font-size: 11px; color: #666; width: 56px; flex-shrink: 0; }
.accuracy-track { flex: 1; height: 5px; background: #F0F0EE; border-radius: 3px; overflow: hidden; }
.accuracy-fill { height: 100%; background: #ec4899; border-radius: 3px; }
.accuracy-pct { font-size: 11px; font-weight: 700; color: #ec4899; width: 30px; text-align: right; flex-shrink: 0; }
@media (max-width: 1100px) { .three-col { grid-template-columns: 1fr; } .left-panel, .right-panel { display: none; } }
</style>
