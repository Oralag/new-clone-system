<template>
  <div class="poster-page">
    <div class="page-title">图文海报</div>

    <div class="two-col">
      <!-- Left: Config -->
      <div class="config-panel card">
        <!-- Topic from hot search -->
        <div class="field">
          <label class="field-label">话题 / 主题</label>
          <textarea
            v-model="topic"
            class="field-textarea text-area"
            rows="2"
            placeholder="输入话题或从热搜选择..."
          />
          <div v-if="allTrendingTopics.length > 0" class="topic-chips">
            <div class="chips-label">从热搜选择：</div>
            <span
              v-for="t in allTrendingTopics.slice(0, 10)"
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

        <!-- Style -->
        <div class="field">
          <label class="field-label">图文风格</label>
          <div class="style-grid">
            <div
              v-for="s in posterStyles"
              :key="s.key"
              class="style-card"
              :class="{ active: selectedStyle === s.key }"
              @click="selectedStyle = s.key"
            >
              <div class="style-icon">{{ s.icon }}</div>
              <div class="style-name">{{ s.name }}</div>
              <div class="style-desc">{{ s.desc }}</div>
            </div>
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

        <!-- Color Theme -->
        <div class="field">
          <label class="field-label">色调风格</label>
          <div class="chip-group">
            <span
              v-for="c in colorThemes"
              :key="c"
              class="chip"
              :class="{ active: colorTheme === c }"
              @click="colorTheme = c"
            >{{ c }}</span>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-generate" :disabled="generating || !topic.trim()" @click="generate">
            <span v-if="generating">✨ 生成中...</span>
            <span v-else>✨ 一键生成</span>
          </button>
          <button v-if="result" class="btn-regen" :disabled="generating" @click="generate">
            重新生成
          </button>
        </div>
      </div>

      <!-- Right: Result -->
      <div class="result-panel card">
        <div class="result-header">
          <span class="result-label">图文内容方案</span>
          <div class="result-actions">
            <span v-if="selectedStyle" class="style-tag">{{ currentStyleName }}</span>
            <button v-if="result" class="btn-copy" @click="copyResult">📋 复制</button>
          </div>
        </div>
        <div v-if="!result && !generating" class="result-empty">
          <div class="empty-icon">🖼️</div>
          <div class="empty-text">选择风格和话题后一键生成</div>
        </div>
        <div v-else class="result-content text-area">
          <span v-if="generating && !result" class="cursor-blink">▌</span>
          {{ result }}<span v-if="generating && result" class="cursor-blink">▌</span>
        </div>
        <div v-if="copied" class="copy-toast">已复制 ✓</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useTrendingStore } from '@/stores/agent'

const agentStore = useTrendingStore()

const topic = ref('')
const platform = ref('小红书')
const selectedStyle = ref('xiaohongshu')
const colorTheme = ref('清新活泼')
const result = ref('')
const generating = ref(false)
const copied = ref(false)

const platforms = ['小红书', '抖音', '微博', '朋友圈', '公众号']

const posterStyles = [
  { key: 'xiaohongshu', name: '小红书笔记风', icon: '📔', desc: '图文排版精美，种草感强' },
  { key: 'poster', name: '大字报', icon: '📢', desc: '大字冲击力强，适合传播' },
  { key: 'moments', name: '朋友圈', icon: '💬', desc: '轻松自然，引发共鸣' },
  { key: 'promo', name: '宣传海报', icon: '🎯', desc: '专业品牌感，结构完整' },
]

const colorThemes = ['清新活泼', '简约高级', '国潮复古', '科技感', '温暖治愈', '深色高冷']

const systemPrompt = `你是专业图文创作专家，擅长为不同平台设计图文内容方案。
你的输出是文字描述形式的图文内容脚本，包含：
- 画面/版式描述（布局、配色建议）
- 标题文案（主标题、副标题）
- 正文内容
- 配图说明（描述每张图的内容和风格）
- 发布建议（时间、标签、互动引导）
请根据指定风格输出详细的图文内容方案。`

const stylePromptMap: Record<string, string> = {
  xiaohongshu: `【小红书笔记风格】
排版要求：封面图吸睛+正文分段清晰+emoji点缀
格式：
🌟 封面设计建议：[描述封面图内容、配色、字体风格]
📝 标题方案：[3个标题备选]
✨ 正文内容：[分段落的图文内容，每段配图说明]
🏷️ 标签建议：[5-8个话题标签]
💡 互动钩子：[评论区引导语]`,

  poster: `【大字报风格】
排版要求：大字冲击、简洁有力、背景突出
格式：
🎯 主题大字：[核心词/金句，3-5字最佳]
📌 副标题：[补充说明，10-15字]
🖼️ 背景设计：[描述背景色彩、元素、氛围]
💥 视觉亮点：[特殊设计元素说明]
📤 传播建议：[适合哪些场景扩散]`,

  moments: `【朋友圈图文风格】
排版要求：真实自然、情感共鸣、引发互动
格式：
📸 配图建议：[1-9张图的内容描述]
✍️ 文案正文：[朋友圈文字内容，200字以内]
😊 情感触点：[能引发共鸣的细节]
💬 互动引导：[自然引出评论的结尾]`,

  promo: `【宣传海报风格】
排版要求：专业品牌感、信息层级清晰
格式：
🎨 整体设计方案：[版式、主色调、设计风格描述]
📣 主标题：[品牌/活动核心信息]
📋 副标题+正文要点：[3-5条核心卖点]
🔴 CTA按钮文案：[行动号召语]
📐 尺寸规格建议：[适合各平台的尺寸]
🌈 配色方案：[主色+辅色+文字色]`,
}

const allTrendingTopics = computed(() => {
  const all: string[] = []
  const seen = new Set<string>()
  const trending = agentStore.trendingData || agentStore.trending
  for (const list of Object.values(trending)) {
    for (const item of list) {
      if (!seen.has(item.title)) {
        seen.add(item.title)
        all.push(item.title)
      }
    }
  }
  return all
})

const currentStyleName = computed(() => {
  return posterStyles.find(s => s.key === selectedStyle.value)?.name || ''
})

onMounted(() => {
  if (agentStore.selectedTopics.length > 0) {
    topic.value = agentStore.selectedTopics[0] || ''
  }
})

function addTopic(t: string) {
  topic.value = t
}

function buildPrompt() {
  const styleGuide = stylePromptMap[selectedStyle.value] || stylePromptMap.xiaohongshu
  const styleName = posterStyles.find(s => s.key === selectedStyle.value)?.name || '图文内容'
  return `请为【${platform.value}】平台生成一套${styleName}内容方案。

话题主题：${topic.value}
色调风格：${colorTheme.value}

${styleGuide}

请按照上述格式输出完整的图文内容方案，内容要具体可执行，文案要符合${platform.value}平台调性。`
}

async function generate() {
  generating.value = true
  result.value = ''
  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt() }],
        systemPrompt,
      }),
    })
    const data = await response.json()
    result.value = data.content?.[0]?.text || ''
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
.poster-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }

.field { margin-bottom: 18px; }
.field-label { display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }

.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
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

.style-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.style-card {
  padding: 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s;
  background: #f8fafc;
}
.style-card:hover { border-color: #93c5fd; background: #eff6ff; }
.style-card.active { border-color: #2563eb; background: #eff6ff; }
.style-icon { font-size: 22px; margin-bottom: 5px; }
.style-name { font-size: 12.5px; font-weight: 600; color: #1e293b; margin-bottom: 3px; }
.style-desc { font-size: 11px; color: #94a3b8; line-height: 1.4; }
.style-card.active .style-name { color: #2563eb; }

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
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.result-label { font-size: 13px; font-weight: 600; color: #374151; }
.result-actions { display: flex; align-items: center; gap: 8px; }

.style-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  background: #fef3c7;
  color: #d97706;
  font-weight: 500;
  border: 1px solid #fde68a;
}

.btn-copy { padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; }
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
  border-radius: 12px;
  padding: 14px;
  min-height: 300px;
}
.text-area { font-family: inherit; }

.cursor-blink { animation: blink 1s infinite; color: #2563eb; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.copy-toast { position: absolute; bottom: 16px; right: 16px; background: #22c55e; color: #fff; padding: 6px 14px; border-radius: 10px; font-size: 12px; font-weight: 500; }

@media (max-width: 767px) {
  .two-col { grid-template-columns: 1fr; }
  .style-grid { grid-template-columns: 1fr 1fr; }
}
</style>
