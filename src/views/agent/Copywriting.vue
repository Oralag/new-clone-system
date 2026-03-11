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
          <!-- Hot topics from trending store -->
          <div v-if="allTrendingTopics.length > 0" class="topic-chips">
            <div class="chips-label">从热搜选择：</div>
            <span
              v-for="t in allTrendingTopics.slice(0, 12)"
              :key="t"
              class="topic-chip"
              :class="{ active: topic.includes(t) }"
              @click="addTopic(t)"
            >{{ t }}</span>
          </div>
          <div v-else-if="agentStore.selectedTopics.length > 0" class="topic-chips">
            <span
              v-for="t in agentStore.selectedTopics"
              :key="t"
              class="topic-chip"
              :class="{ active: topic.includes(t) }"
              @click="addTopic(t)"
            >{{ t }}</span>
          </div>
        </div>

        <!-- Platform (multi-select) -->
        <div class="field">
          <label class="field-label">发布平台（可多选）</label>
          <div class="chip-group">
            <span
              v-for="p in platforms"
              :key="p.key"
              class="chip"
              :class="{ active: selectedPlatforms.includes(p.key) }"
              @click="togglePlatform(p.key)"
            >{{ p.label }}</span>
          </div>
          <div class="platform-hint" v-if="selectedPlatforms.length > 0">
            <span v-for="p in selectedPlatforms" :key="p" class="platform-desc">
              {{ platformDesc[p] }}
            </span>
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

        <div class="btn-row">
          <button class="btn-generate" :disabled="generating || !topic.trim() || selectedPlatforms.length === 0" @click="generate">
            <span v-if="generating">✨ 生成中...</span>
            <span v-else>✨ 生成文案</span>
          </button>
          <button v-if="result" class="btn-regen" :disabled="generating" @click="regenerate">
            重新生成
          </button>
        </div>
      </div>

      <!-- Right: Result -->
      <div class="result-panel card">
        <div class="result-header">
          <span class="result-label">生成结果</span>
          <div class="result-actions">
            <span v-if="currentPlatformLabel" class="platform-tag">{{ currentPlatformLabel }}</span>
            <!-- Platform tabs when multiple generated -->
            <div v-if="platformResults.length > 1" class="result-tabs">
              <button
                v-for="pr in platformResults"
                :key="pr.platform"
                class="result-tab"
                :class="{ active: activeResultPlatform === pr.platform }"
                @click="activeResultPlatform = pr.platform"
              >{{ pr.label }}</button>
            </div>
            <button v-if="result" class="btn-copy" @click="copyResult">📋 复制</button>
          </div>
        </div>
        <div v-if="!result && !generating" class="result-empty">
          <div class="empty-icon">✍️</div>
          <div class="empty-text">选择平台和话题后点击生成</div>
        </div>
        <div v-else class="result-content text-area">
          <span v-if="generating && !result" class="cursor-blink">▌</span>
          {{ displayResult }}<span v-if="generating" class="cursor-blink">▌</span>
        </div>
        <div v-if="copied" class="copy-toast">已复制到剪贴板 ✓</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTrendingStore } from '@/stores/agent'

const agentStore = useTrendingStore()

const topic = ref('')
const selectedPlatforms = ref<string[]>(['douyin'])
const contentType = ref('短视频文案')
const selectedTones = ref<string[]>([])
const result = ref('')
const generating = ref(false)
const copied = ref(false)
const activeResultPlatform = ref('')

interface PlatformResult {
  platform: string
  label: string
  content: string
}
const platformResults = ref<PlatformResult[]>([])

const platforms = [
  { key: 'douyin', label: '抖音' },
  { key: 'xiaohongshu', label: '小红书' },
  { key: 'kuaishou', label: '快手' },
  { key: 'weibo', label: '微博' },
  { key: 'zhihu', label: '知乎' },
]

const platformDesc: Record<string, string> = {
  douyin: '抖音：短平快、节奏感强，开头3秒留人',
  xiaohongshu: '小红书：图文笔记风格，种草感强，多用emoji',
  kuaishou: '快手：接地气、真实感，重视社区互动',
  weibo: '微博：话题标签驱动，适合热点事件讨论',
  zhihu: '知乎：适合深度内容，专业干货，有理有据',
}

const contentTypes = ['短视频文案', '图文笔记', '直播话术', '评论互动', '广告文案']
const tones = ['幽默', '专业', '温情', '励志', '种草', '干货', '故事感', '反转']

const systemPrompt = `你是专业社交媒体文案创作专家，擅长为不同平台量身定制内容。
- 抖音：短平快，开头3秒必须抓住注意力，节奏感强，善用悬念和反转
- 小红书：图文笔记风格，种草感强，多用emoji，段落短，有亲切感
- 快手：接地气，真实感强，重视情感共鸣和社区互动
- 微博：话题标签驱动，适合热点事件，简洁有力，引发转发
- 知乎：深度内容，专业干货，有理有据，适合长文
请严格按照指定平台的调性和格式输出文案，不要输出额外解释。`

// Collect all trending topics across all platforms
const allTrendingTopics = computed(() => {
  const all: string[] = []
  const seen = new Set<string>()
  for (const list of Object.values(agentStore.trending)) {
    for (const item of list) {
      if (!seen.has(item.title)) {
        seen.add(item.title)
        all.push(item.title)
      }
    }
  }
  return all
})

const currentPlatformLabel = computed(() => {
  if (platformResults.value.length === 1) {
    return platforms.find(p => p.key === platformResults.value[0].platform)?.label || ''
  }
  return ''
})

const displayResult = computed(() => {
  if (platformResults.value.length > 1 && activeResultPlatform.value) {
    return platformResults.value.find(p => p.platform === activeResultPlatform.value)?.content || result.value
  }
  return result.value
})

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

function togglePlatform(key: string) {
  const idx = selectedPlatforms.value.indexOf(key)
  if (idx >= 0) selectedPlatforms.value.splice(idx, 1)
  else selectedPlatforms.value.push(key)
}

function toggleTone(t: string) {
  const idx = selectedTones.value.indexOf(t)
  if (idx >= 0) selectedTones.value.splice(idx, 1)
  else selectedTones.value.push(t)
}

function buildPromptForPlatform(platformKey: string) {
  const platformName = platforms.find(p => p.key === platformKey)?.label || platformKey
  const toneStr = selectedTones.value.length ? `风格调性：${selectedTones.value.join('、')}` : ''
  return `请为【${platformName}】平台生成一篇${contentType.value}。
话题：${topic.value}
${toneStr}
平台调性说明：${platformDesc[platformKey] || ''}

要求：
1. 严格符合${platformName}平台的内容调性和格式规范
2. 吸引目标用户，内容有价值
3. 包含自然的互动引导（关注/点赞/评论等）
4. 如是小红书，要加适当emoji和换行
5. 如是知乎，要有专业深度，用数据和逻辑支撑`
}

async function callAI(prompt: string): Promise<string> {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt,
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text || ''
}

async function generate() {
  generating.value = true
  result.value = ''
  platformResults.value = []
  activeResultPlatform.value = ''

  try {
    if (selectedPlatforms.value.length === 1) {
      // Single platform: stream directly
      const prompt = buildPromptForPlatform(selectedPlatforms.value[0])
      const text = await callAI(prompt)
      result.value = text
      const label = platforms.find(p => p.key === selectedPlatforms.value[0])?.label || selectedPlatforms.value[0]
      platformResults.value = [{ platform: selectedPlatforms.value[0], label, content: text }]
    } else {
      // Multi platform: generate one by one
      const results: PlatformResult[] = []
      for (const platformKey of selectedPlatforms.value) {
        const prompt = buildPromptForPlatform(platformKey)
        const label = platforms.find(p => p.key === platformKey)?.label || platformKey
        result.value = `正在生成 ${label} 文案...`
        const text = await callAI(prompt)
        results.push({ platform: platformKey, label, content: text })
      }
      platformResults.value = results
      activeResultPlatform.value = results[0].platform
      result.value = results[0].content
    }

    // Save to store
    const saveData = platformResults.value.map(pr => ({
      platform: pr.platform,
      topic: topic.value,
      content: pr.content,
      contentType: contentType.value,
      tones: [...selectedTones.value],
    }))
    agentStore.setCopywritingResults(saveData)
  } finally {
    generating.value = false
  }
}

async function regenerate() {
  await generate()
}

async function copyResult() {
  await navigator.clipboard.writeText(displayResult.value)
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

.topic-chips { margin-top: 10px; }
.chips-label { font-size: 11px; color: #94a3b8; margin-bottom: 6px; }
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
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.topic-chip:hover, .topic-chip.active { background: #dbeafe; color: #1d4ed8; border-color: #93c5fd; }

.platform-hint { margin-top: 8px; display: flex; flex-direction: column; gap: 3px; }
.platform-desc { font-size: 11px; color: #94a3b8; line-height: 1.5; }

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

.btn-row { display: flex; gap: 10px; margin-top: 4px; }
.btn-generate {
  flex: 1;
  padding: 11px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-generate:hover { background: #1d4ed8; }
.btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-regen {
  padding: 11px 18px;
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
  border-radius: 9px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}
.btn-regen:hover { border-color: #93c5fd; color: #2563eb; }
.btn-regen:disabled { opacity: 0.5; cursor: not-allowed; }

.result-panel { min-height: 400px; display: flex; flex-direction: column; position: relative; }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
.result-label { font-size: 13px; font-weight: 600; color: #374151; }
.result-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }

.platform-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 500;
  border: 1px solid #bfdbfe;
}

.result-tabs { display: flex; gap: 4px; }
.result-tab {
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.result-tab.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }

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
