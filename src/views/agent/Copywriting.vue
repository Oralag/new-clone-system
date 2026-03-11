<template>
  <div class="copy-page">
    <div class="page-title">文案生成</div>

    <div class="two-col">
      <!-- Left: Config -->
      <div class="config-panel card">
        <!-- Topic -->
        <div class="field">
          <label class="field-label">话题 / 主题</label>
          <textarea
            v-model="topic"
            class="field-textarea text-area"
            rows="3"
            placeholder="输入话题或从热搜选择..."
          />
          <div v-if="agentStore.selectedTopics.length > 0" class="topic-chips">
            <span
              v-for="t in agentStore.selectedTopics"
              :key="t"
              class="topic-chip"
              :class="{ active: topic.includes(t) }"
              @click="addTopic(t)"
            >{{ t }}</span>
          </div>
        </div>

        <!-- Platform -->
        <div class="field">
          <label class="field-label">发布平台</label>
          <div class="chip-group">
            <span
              v-for="p in platforms"
              :key="p"
              class="chip"
              :class="{ active: platform === p }"
              @click="platform = p"
            >{{ p }}</span>
          </div>
        </div>

        <!-- Content Type -->
        <div class="field">
          <label class="field-label">内容类型</label>
          <div class="chip-group">
            <span
              v-for="ct in contentTypes"
              :key="ct"
              class="chip"
              :class="{ active: contentType === ct }"
              @click="contentType = ct"
            >{{ ct }}</span>
          </div>
        </div>

        <!-- Tone -->
        <div class="field">
          <label class="field-label">风格调性</label>
          <div class="chip-group">
            <span
              v-for="t in tones"
              :key="t"
              class="chip"
              :class="{ active: selectedTones.includes(t) }"
              @click="toggleTone(t)"
            >{{ t }}</span>
          </div>
        </div>

        <button class="btn-generate" :disabled="generating || !topic.trim()" @click="generate">
          <span v-if="generating">✨ 生成中...</span>
          <span v-else>✨ 生成文案</span>
        </button>
      </div>

      <!-- Right: Result -->
      <div class="result-panel card">
        <div class="result-header">
          <span class="result-label">生成结果</span>
          <button v-if="result" class="btn-copy" @click="copyResult">📋 复制</button>
        </div>
        <div v-if="!result && !generating" class="result-empty">
          <div class="empty-icon">✍️</div>
          <div class="empty-text">配置参数后点击生成</div>
        </div>
        <div v-else class="result-content text-area">
          <span v-if="generating && !result" class="cursor-blink">▌</span>
          {{ result }}<span v-if="generating && result" class="cursor-blink">▌</span>
        </div>
        <div v-if="copied" class="copy-toast">已复制到剪贴板 ✓</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBrandStore } from '@/stores/brand'
import { useTrendingStore } from '@/stores/agent'

const brandStore = useBrandStore()
const agentStore = useTrendingStore()

const topic = ref('')
const platform = ref('抖音')
const contentType = ref('短视频文案')
const selectedTones = ref<string[]>([])
const result = ref('')
const generating = ref(false)
const copied = ref(false)

const platforms = ['抖音', '小红书', '快手', '微博']
const contentTypes = ['短视频文案', '图文笔记', '直播话术', '评论互动']
const tones = ['幽默', '专业', '温情', '励志', '种草', '干货', '故事感']

onMounted(() => {
  if (agentStore.selectedTopics.length > 0) {
    topic.value = agentStore.selectedTopics.join('、')
  }
})

function addTopic(t: string) {
  if (!topic.value.includes(t)) {
    topic.value = topic.value ? topic.value + '、' + t : t
  }
}

function toggleTone(t: string) {
  const idx = selectedTones.value.indexOf(t)
  if (idx >= 0) selectedTones.value.splice(idx, 1)
  else selectedTones.value.push(t)
}

function buildPrompt() {
  const toneStr = selectedTones.value.length ? `风格：${selectedTones.value.join('、')}` : ''
  return `请为${platform.value}平台生成一篇${contentType.value}。\n话题：${topic.value}\n${toneStr}\n\n要求：符合${platform.value}平台调性，吸引目标用户，包含互动引导。`
}

async function generate() {
  generating.value = true
  result.value = ''
  try {
    const resp = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': localStorage.getItem('erp_token') || '',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt() }],
        system: brandStore.systemPrompt,
      }),
    })
    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') break
        try {
          const obj = JSON.parse(data)
          if (obj.type === 'text') result.value += obj.text
        } catch {}
      }
    }
  } finally {
    generating.value = false
  }
}

async function copyResult() {
  await navigator.clipboard.writeText(result.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.copy-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }

.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }

.card {
  background: #fdfefe;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 20px;
}

.field { margin-bottom: 18px; }
.field-label { display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }

.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13.5px;
  resize: vertical;
  background: #f8fafc;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.field-textarea:focus { outline: none; border-color: #93c5fd; background: #fff; }

.topic-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.topic-chip {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
  border: 1px solid #e2e8f0;
  transition: all 0.15s;
}
.topic-chip:hover, .topic-chip.active { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }

.chip-group { display: flex; flex-wrap: wrap; gap: 7px; }
.chip {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: #93c5fd; color: #2563eb; }
.chip.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 500; }

.btn-generate {
  width: 100%;
  padding: 11px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}
.btn-generate:hover { background: #1d4ed8; }
.btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

.result-panel { min-height: 400px; display: flex; flex-direction: column; position: relative; }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.result-label { font-size: 13px; font-weight: 600; color: #374151; }
.btn-copy {
  padding: 5px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  background: #f8fafc;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-copy:hover { border-color: #93c5fd; color: #2563eb; }

.result-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 36px; margin-bottom: 10px; }
.empty-text { font-size: 13px; color: #94a3b8; }

.result-content {
  flex: 1;
  white-space: pre-wrap;
  font-size: 14px;
  line-height: 1.8;
  color: #1e293b;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 14px;
  min-height: 300px;
}
.text-area { font-family: inherit; }

.cursor-blink {
  animation: blink 1s infinite;
  color: #2563eb;
}
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.copy-toast {
  position: absolute;
  bottom: 16px;
  right: 16px;
  background: #22c55e;
  color: #fff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}

@media (max-width: 767px) {
  .two-col { grid-template-columns: 1fr; }
}
</style>
