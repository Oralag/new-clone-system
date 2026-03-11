<template>
  <div class="video-page">
    <div class="page-title">视频生成</div>

    <div class="two-col">
      <!-- Left: Config -->
      <div class="config-panel card">

        <!-- Content from copywriting -->
        <div class="field">
          <label class="field-label">视频内容主题</label>
          <textarea
            v-model="topic"
            class="field-textarea text-area"
            rows="3"
            placeholder="输入视频主题，或从文案页带入..."
          />
          <div v-if="agentStore.copywritingResults.length > 0" class="import-hint">
            <span class="hint-label">从文案页带入：</span>
            <span
              v-for="(cr, idx) in agentStore.copywritingResults.slice(0, 3)"
              :key="idx"
              class="import-chip"
              @click="importFromCopywriting(cr)"
            >{{ cr.topic }} · {{ platformLabels[cr.platform] || cr.platform }}</span>
          </div>
        </div>

        <!-- AI Model -->
        <div class="field">
          <label class="field-label">视频生成模型</label>
          <div class="model-grid">
            <div
              v-for="m in videoModels"
              :key="m.key"
              class="model-card"
              :class="{ active: selectedModel === m.key }"
              @click="selectedModel = m.key"
            >
              <div class="model-name">{{ m.name }}</div>
              <div class="model-desc">{{ m.desc }}</div>
              <div class="model-badge" :class="m.badgeType">{{ m.badge }}</div>
            </div>
          </div>
        </div>

        <!-- Duration -->
        <div class="field">
          <label class="field-label">视频时长</label>
          <div class="chip-group">
            <span
              v-for="d in durations"
              :key="d.value"
              class="chip"
              :class="{ active: duration === d.value }"
              @click="duration = d.value"
            >{{ d.label }}</span>
          </div>
        </div>

        <!-- Ratio -->
        <div class="field">
          <label class="field-label">画幅比例</label>
          <div class="chip-group">
            <span
              v-for="r in ratios"
              :key="r.value"
              class="chip"
              :class="{ active: ratio === r.value }"
              @click="ratio = r.value"
            >{{ r.label }}</span>
          </div>
        </div>

        <!-- Style -->
        <div class="field">
          <label class="field-label">视频风格</label>
          <div class="chip-group">
            <span
              v-for="s in videoStyles"
              :key="s"
              class="chip"
              :class="{ active: videoStyle === s }"
              @click="videoStyle = s"
            >{{ s }}</span>
          </div>
        </div>

        <!-- BGM -->
        <div class="field">
          <label class="field-label">背景音乐</label>
          <div class="chip-group">
            <span
              v-for="b in bgMusics"
              :key="b"
              class="chip"
              :class="{ active: bgMusic === b }"
              @click="bgMusic = b"
            >{{ b }}</span>
          </div>
        </div>

        <div class="btn-row">
          <button class="btn-generate" :disabled="generating || !topic.trim()" @click="generate">
            <span v-if="generating">✨ 生成中...</span>
            <span v-else>✨ 生成视频脚本</span>
          </button>
          <button v-if="result" class="btn-regen" :disabled="generating" @click="generate">
            重新生成
          </button>
        </div>

        <!-- Model Note -->
        <div class="model-note">
          <span class="note-icon">ℹ️</span>
          当前生成的是视频拍摄脚本和制作方案，可直接用于视频制作指导。
        </div>
      </div>

      <!-- Right: Result -->
      <div class="result-panel card">
        <div class="result-header">
          <span class="result-label">视频脚本</span>
          <div class="result-actions">
            <span v-if="selectedModel" class="model-tag">{{ currentModelName }}</span>
            <button v-if="result" class="btn-copy" @click="copyResult">📋 复制</button>
          </div>
        </div>

        <div v-if="!result && !generating" class="result-empty">
          <div class="empty-icon">🎬</div>
          <div class="empty-text">选择模型和参数后生成视频脚本</div>
          <div v-if="agentStore.copywritingResults.length > 0" class="hint-from-copy">
            已有文案内容，可直接带入生成
          </div>
        </div>

        <template v-else>
          <div v-if="!generating && parsedSections.length > 0" class="script-sections">
            <div v-for="sec in parsedSections" :key="sec.title" class="script-section">
              <div class="section-tag">{{ sec.title }}</div>
              <div class="section-body">{{ sec.content }}</div>
            </div>
          </div>
          <div v-else class="result-content text-area">
            <span v-if="generating && !result" class="cursor-blink">▌</span>
            {{ result }}<span v-if="generating && result" class="cursor-blink">▌</span>
          </div>
        </template>

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
const selectedModel = ref('kling')
const duration = ref('30s')
const ratio = ref('9:16')
const videoStyle = ref('写实风格')
const bgMusic = ref('轻快活泼')
const result = ref('')
const generating = ref(false)
const copied = ref(false)

const platformLabels: Record<string, string> = {
  douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手',
  weibo: '微博', zhihu: '知乎', bilibili: 'B站',
}

const videoModels = [
  { key: 'kling', name: '可灵 AI', desc: '快手出品，写实效果出色', badge: '推荐', badgeType: 'badge-blue' },
  { key: 'jimeng', name: '即梦 AI', desc: '字节跳动，创意风格多样', badge: '热门', badgeType: 'badge-orange' },
  { key: 'hailuo', name: '海螺 AI', desc: 'MiniMax，长视频支持好', badge: '稳定', badgeType: 'badge-green' },
  { key: 'sora', name: 'Sora', desc: 'OpenAI，画质顶级', badge: '高端', badgeType: 'badge-purple' },
  { key: 'runway', name: 'Runway Gen3', desc: '专业影视级别', badge: '专业', badgeType: 'badge-gray' },
  { key: 'pika', name: 'Pika 2.0', desc: '创意特效丰富', badge: '创意', badgeType: 'badge-pink' },
]

const durations = [
  { label: '15秒', value: '15s' },
  { label: '30秒', value: '30s' },
  { label: '60秒', value: '60s' },
  { label: '3分钟', value: '3min' },
  { label: '5分钟', value: '5min' },
]

const ratios = [
  { label: '9:16 竖屏', value: '9:16' },
  { label: '16:9 横屏', value: '16:9' },
  { label: '1:1 方形', value: '1:1' },
  { label: '4:3 经典', value: '4:3' },
]

const videoStyles = ['写实风格', '动漫风格', '赛博朋克', '古风国潮', '极简商务', '温暖治愈', '纪录片风']

const bgMusics = ['轻快活泼', '抒情温暖', '电子节拍', '古典大气', '无背景音', '自然环境音']

const systemPrompt = `你是专业视频脚本创作专家和视频制作导演，擅长为不同平台和风格创作视频拍摄脚本。
你的输出是详细的视频脚本和制作方案，包括：镜头语言、台词/旁白、画面描述、音效建议、剪辑节奏。
请按照专业视频脚本格式输出，每个镜头段落都要清晰标注。`

const currentModelName = computed(() => {
  return videoModels.find(m => m.key === selectedModel.value)?.name || ''
})

const parsedSections = computed(() => {
  if (!result.value || generating.value) return []
  const sections: { title: string; content: string }[] = []
  const patterns = [
    { key: '开头钩子', re: /【开头钩子[^\]]*】([\s\S]*?)(?=【|$)/ },
    { key: '主体内容', re: /【主体内容[^\]]*】([\s\S]*?)(?=【|$)/ },
    { key: '结尾收尾', re: /【结尾[^\]]*】([\s\S]*?)(?=【|$)/ },
    { key: '制作建议', re: /【制作建议[^\]]*】([\s\S]*?)(?=【|$)/ },
    { key: '拍摄提示', re: /【拍摄[^\]]*】([\s\S]*?)(?=【|$)/ },
    { key: '音效建议', re: /【音效[^\]]*】([\s\S]*?)(?=【|$)/ },
  ]
  for (const p of patterns) {
    const m = result.value.match(p.re)
    if (m) sections.push({ title: p.key, content: m[1].trim() })
  }
  return sections
})

onMounted(() => {
  // Auto-import from copywriting results if available
  if (agentStore.copywritingResults.length > 0) {
    const first = agentStore.copywritingResults[0]
    topic.value = first.topic || ''
  } else if (agentStore.selectedTopics.length > 0) {
    topic.value = agentStore.selectedTopics.join('、')
  }
})

function importFromCopywriting(cr: { platform: string; topic: string; content: string }) {
  topic.value = cr.topic
}

function buildPrompt() {
  const modelName = videoModels.find(m => m.key === selectedModel.value)?.name || selectedModel.value
  // Check if we have copywriting content to reference
  const copyRef = agentStore.copywritingResults.find(cr => cr.topic === topic.value)
  const copyContext = copyRef
    ? `\n\n参考文案内容：\n${copyRef.content.slice(0, 500)}`
    : ''

  return `请为以下主题生成一个${duration.value}的短视频完整脚本。

视频主题：${topic.value}
目标模型：${modelName}（${videoModels.find(m => m.key === selectedModel.value)?.desc || ''}）
画幅比例：${ratio.value}
视频风格：${videoStyle.value}
背景音乐：${bgMusic.value}${copyContext}

请按以下格式输出：
【开头钩子】（前3秒，吸引停留）
画面：[具体画面描述]
台词/字幕：[文字内容]
镜头：[镜头类型和运动]

【主体内容】（核心信息段落）
[分2-3个段落，每个段落包含：画面、台词、镜头、时长]

【结尾收尾】（最后5秒）
画面：[结束画面]
CTA：[行动号召文字]
转场：[结束方式]

【制作建议】
- 拍摄设备：[推荐设备]
- 光线要求：[布光建议]
- 后期剪辑：[剪辑风格和特效]
- ${modelName}使用提示：[针对该模型的提示词技巧]`
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

    // Save to store
    agentStore.setVideoResults([{
      topic: topic.value,
      model: selectedModel.value,
      duration: duration.value,
      ratio: ratio.value,
      style: videoStyle.value,
      bgMusic: bgMusic.value,
      content: result.value,
    }])
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
.video-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }

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

.import-hint { margin-top: 8px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.hint-label { font-size: 11px; color: #94a3b8; white-space: nowrap; }
.import-chip {
  font-size: 11px;
  padding: 3px 10px;
  border-radius: 20px;
  background: #eff6ff;
  color: #2563eb;
  cursor: pointer;
  border: 1px solid #bfdbfe;
  transition: all 0.15s;
  max-width: 160px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.import-chip:hover { background: #dbeafe; }

.model-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 8px;
}
.model-card {
  padding: 10px;
  border: 1.5px solid #e2e8f0;
  border-radius: 9px;
  cursor: pointer;
  transition: all 0.15s;
  background: #f8fafc;
  position: relative;
  overflow: hidden;
}
.model-card:hover { border-color: #93c5fd; background: #eff6ff; }
.model-card.active { border-color: #2563eb; background: #eff6ff; }
.model-name { font-size: 12.5px; font-weight: 700; color: #1e293b; margin-bottom: 3px; }
.model-card.active .model-name { color: #2563eb; }
.model-desc { font-size: 10.5px; color: #94a3b8; line-height: 1.4; margin-bottom: 5px; }
.model-badge {
  display: inline-block;
  font-size: 10px;
  padding: 1px 7px;
  border-radius: 10px;
  font-weight: 600;
}
.badge-blue { background: #dbeafe; color: #1d4ed8; }
.badge-orange { background: #fef3c7; color: #d97706; }
.badge-green { background: #dcfce7; color: #16a34a; }
.badge-purple { background: #ede9fe; color: #7c3aed; }
.badge-gray { background: #f1f5f9; color: #475569; }
.badge-pink { background: #fce7f3; color: #be185d; }

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

.model-note {
  margin-top: 12px;
  padding: 10px 12px;
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 8px;
  font-size: 11.5px;
  color: #92400e;
  line-height: 1.5;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.note-icon { flex-shrink: 0; }

.result-panel { min-height: 400px; display: flex; flex-direction: column; position: relative; }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.result-label { font-size: 13px; font-weight: 600; color: #374151; }
.result-actions { display: flex; align-items: center; gap: 8px; }

.model-tag {
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  background: #ede9fe;
  color: #7c3aed;
  font-weight: 500;
  border: 1px solid #ddd6fe;
}

.btn-copy { padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-copy:hover { border-color: #93c5fd; color: #2563eb; }

.result-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; }
.empty-icon { font-size: 36px; }
.empty-text { font-size: 13px; color: #94a3b8; }
.hint-from-copy {
  font-size: 12px;
  color: #2563eb;
  background: #eff6ff;
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid #bfdbfe;
}

.script-sections { display: flex; flex-direction: column; gap: 12px; }
.script-section { border-radius: 9px; overflow: hidden; border: 1px solid #e2e8f0; }
.section-tag { padding: 8px 14px; font-size: 12px; font-weight: 700; background: #eff6ff; color: #2563eb; border-bottom: 1px solid #dbeafe; }
.section-body { padding: 12px 14px; font-size: 13.5px; line-height: 1.7; color: #374151; white-space: pre-wrap; background: #f8fafc; }

.result-content { flex: 1; white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1e293b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; min-height: 300px; }
.text-area { font-family: inherit; }

.cursor-blink { animation: blink 1s infinite; color: #2563eb; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }

.copy-toast { position: absolute; bottom: 16px; right: 16px; background: #22c55e; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; }

@media (max-width: 767px) {
  .two-col { grid-template-columns: 1fr; }
  .model-grid { grid-template-columns: 1fr 1fr; }
}
</style>
