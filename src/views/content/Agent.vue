<template>
  <div class="ca-page">

    <aside class="ca-sidebar">
      <div class="ca-sidebar-title">内容专员</div>
      <div
        v-for="s in SPECS"
        :key="s.id"
        class="ca-spec-item"
        :class="{ 'ca-spec-active': activeSpec === s.id }"
        @click="activeSpec = s.id"
      >
        <div class="ca-spec-icon" :style="{ background: s.colorBg, color: s.color }">{{ s.emoji }}</div>
        <div class="ca-spec-body">
          <div class="ca-spec-name">{{ s.name }}</div>
          <div class="ca-spec-role">{{ s.role }}</div>
        </div>
      </div>

      <div class="ca-sidebar-divider"></div>
      <div class="ca-sidebar-title" style="margin-top:4px">快捷指令</div>
      <div class="ca-quick-list">
        <button
          v-for="q in currentSpec.quickPrompts"
          :key="q"
          class="ca-quick-btn"
          @click="sendTask(q)"
        >{{ q }}</button>
      </div>
    </aside>

    <main class="ca-main">
      <div class="ca-spec-banner" :style="{ '--ac': currentSpec.color, '--ac-bg': currentSpec.colorBg }">
        <div class="csb-icon">{{ currentSpec.emoji }}</div>
        <div class="csb-body">
          <div class="csb-name">{{ currentSpec.name }} · {{ currentSpec.role }}</div>
          <div class="csb-desc">{{ currentSpec.desc }}</div>
        </div>
        <div class="csb-phase">预览模式 · Phase 1</div>
      </div>

      <div class="ca-chat-area">
        <div class="ca-chat-empty">
          <div class="ce-icon">{{ currentSpec.emoji }}</div>
          <div class="ce-title">{{ currentSpec.name }} 随时待命</div>
          <div class="ce-sub">{{ currentSpec.desc }}</div>
          <div class="ce-prompts">
            <button
              v-for="q in currentSpec.quickPrompts.slice(0, 3)"
              :key="q"
              class="ce-prompt-btn"
              @click="sendTask(q)"
            >{{ q }}</button>
          </div>
        </div>
      </div>
    </main>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

const route = useRoute()

const SPECS = [
  {
    id: 'content_strategist',
    emoji: '💎', name: 'Iris', role: '内容策略师',
    color: '#7c3aed', colorBg: 'rgba(124,58,237,0.1)',
    desc: '规划内容矩阵、选题方向，结合品牌调性制定各渠道差异化内容策略。',
    quickPrompts: [
      '帮我规划下个月各渠道内容选题方向',
      '分析近期哪些内容形式在我们行业最有效',
      '给我出一套3个月的内容日历框架',
      '对比我们各渠道内容表现，指出改进重点',
    ],
  },
  {
    id: 'content_writer',
    emoji: '✍️', name: 'Maya', role: '文案专员',
    color: '#f59e0b', colorBg: 'rgba(245,158,11,0.1)',
    desc: '公众号长文、小红书笔记、视频脚本，批量生产符合各渠道风格的内容。',
    quickPrompts: [
      '写一篇公众号品牌故事文章，1500字',
      '出3条小红书种草笔记文案',
      '写一个60秒产品介绍视频脚本',
      '帮我起10个公众号标题，吸引点击',
    ],
  },
  {
    id: 'content_creative',
    emoji: '🎨', name: '创意部', role: '视觉创意',
    color: '#ef4444', colorBg: 'rgba(239,68,68,0.1)',
    desc: '封面图风格、海报设计方向、视频视觉语言，让内容颜值在线。',
    quickPrompts: [
      '出3套小红书主图视觉风格方向',
      '设计一套夏季活动海报的视觉主题',
      '给抖音主页封面提设计建议',
      '帮我梳理品牌视觉元素规范',
    ],
  },
]

const activeSpec = ref('content_writer')
const currentSpec = computed(() => SPECS.find(s => s.id === activeSpec.value) ?? SPECS[0])

onMounted(() => {
  const spec = route.query.spec as string
  if (spec && SPECS.some(s => s.id === spec)) {
    activeSpec.value = spec
  }
})

function sendTask(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
  ElMessage.success('已填入顶部输入框，点击发送即可')
}
</script>

<style scoped>
.ca-page {
  display: flex;
  gap: 14px;
  height: calc(100vh - 180px);
  min-height: 500px;
}

.ca-sidebar {
  width: 220px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 20px;
  padding: 16px 12px;
  display: flex; flex-direction: column; gap: 4px;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(15,23,42,0.05);
}

.ca-sidebar-title { font-size: 10px; font-weight: 700; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; padding: 4px 8px; margin-top: 4px; }
.ca-sidebar-divider { border: none; border-top: 1px solid rgba(148,163,184,0.12); margin: 8px 0; }

.ca-spec-item {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 10px; border-radius: 12px; cursor: pointer;
  transition: background 0.15s;
}
.ca-spec-item:hover { background: rgba(124,58,237,0.06); }
.ca-spec-active { background: rgba(124,58,237,0.08); box-shadow: inset 0 0 0 1px rgba(124,58,237,0.14); }

.ca-spec-icon { width: 34px; height: 34px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
.ca-spec-name { font-size: 13px; font-weight: 700; color: #0f172a; }
.ca-spec-role { font-size: 10px; color: #94a3b8; margin-top: 1px; }

.ca-quick-list { display: flex; flex-direction: column; gap: 4px; padding: 0 0 4px; }
.ca-quick-btn {
  text-align: left; background: #f8fafc;
  border: 1px solid rgba(148,163,184,0.14); border-radius: 8px;
  padding: 7px 10px; font-size: 11px; color: #334155; cursor: pointer; line-height: 1.4;
  transition: background 0.15s;
}
.ca-quick-btn:hover { background: rgba(124,58,237,0.06); border-color: rgba(124,58,237,0.2); color: #7c3aed; }

.ca-main {
  flex: 1; min-width: 0;
  display: flex; flex-direction: column; gap: 12px;
}

.ca-spec-banner {
  background: linear-gradient(135deg, var(--ac-bg), rgba(255,255,255,0));
  border: 1px solid rgba(148,163,184,0.14);
  border-left: 3px solid var(--ac);
  border-radius: 16px; padding: 16px 18px;
  display: flex; align-items: center; gap: 14px;
}
.csb-icon { font-size: 28px; }
.csb-body { flex: 1; }
.csb-name { font-size: 15px; font-weight: 800; color: #0f172a; }
.csb-desc { font-size: 12px; color: #64748b; margin-top: 3px; }
.csb-phase { font-size: 10px; font-weight: 600; color: #94a3b8; background: #f1f5f9; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }

.ca-chat-area {
  flex: 1; background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 20px;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 4px 20px rgba(15,23,42,0.05);
}

.ca-chat-empty { text-align: center; max-width: 360px; padding: 24px; }
.ce-icon { font-size: 40px; margin-bottom: 12px; }
.ce-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 6px; }
.ce-sub { font-size: 13px; color: #64748b; line-height: 1.6; margin-bottom: 20px; }
.ce-prompts { display: flex; flex-direction: column; gap: 8px; }
.ce-prompt-btn {
  border: 1px solid rgba(124,58,237,0.18);
  border-radius: 10px; padding: 10px 16px;
  font-size: 12px; font-weight: 600; color: #7c3aed;
  background: rgba(124,58,237,0.06); cursor: pointer; transition: background 0.15s;
  text-align: left;
}
.ce-prompt-btn:hover { background: rgba(124,58,237,0.12); }
</style>
