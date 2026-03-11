<template>
  <div class="copy-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">文案生成</h2>
        <p class="page-desc">基于热搜话题，AI 定制各平台爆款文案</p>
      </div>
      <button class="btn-generate" :disabled="generating || !canGenerate" @click="generateAll">
        {{ generating ? '生成中...' : '一键生成' }}
      </button>
    </div>

    <div class="layout-grid">
      <section class="config-card card">
        <div class="config-block">
          <div class="config-label">话题</div>
          <div v-if="topics.length" class="topic-list">
            <span
              v-for="topicItem in topics"
              :key="topicItem"
              class="topic-chip"
              @click="removeTopic(topicItem)"
            >
              {{ topicItem }}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              </svg>
            </span>
          </div>
          <div class="topic-input-row">
            <input
              v-model="draftTopic"
              class="text-input"
              placeholder="输入话题..."
              @keydown.enter.prevent="addTopic"
            />
            <button class="btn-sm" @click="addTopic">添加</button>
            <button class="btn-sm btn-outline" @click="$router.push('/agent/trending')">从热搜选</button>
          </div>
        </div>

        <div class="config-block">
          <div class="config-label">平台</div>
          <div class="platform-grid">
            <label
              v-for="platform in platformOptions"
              :key="platform.key"
              :class="['plat-toggle', { active: platform.selected }]"
            >
              <input v-model="platform.selected" type="checkbox" style="display:none" />
              <span>{{ platform.name }}</span>
            </label>
          </div>
        </div>

        <div class="config-block">
          <div class="config-label">风格</div>
          <div class="style-grid">
            <button
              v-for="style in styleOptions"
              :key="style.key"
              :class="['style-btn', { active: activeStyle === style.key }]"
              @click="activeStyle = style.key"
            >
              <span class="style-name">{{ style.name }}</span>
              <span class="style-desc">{{ style.desc }}</span>
            </button>
          </div>
        </div>
      </section>

      <section class="result-card-wrap card">
        <template v-if="results.length">
          <div class="result-head">
            <span class="result-count">{{ results.length }} 条文案</span>
            <span v-if="generating" class="result-loading">AI 生成中...</span>
          </div>

          <div class="result-list">
            <article v-for="(item, index) in results" :key="`${item.platform}-${item.topic}-${index}`" class="result-card">
              <template v-if="item.content">
                <div class="result-top">
                  <div class="result-meta">
                    <span class="platform-tag">{{ item.platformName }}</span>
                    <span class="topic-tag">{{ item.topic }}</span>
                  </div>
                  <div class="result-actions">
                    <button class="icon-btn" title="重新生成" :disabled="generating" @click="regenerate(index)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <path d="M11 6.5a4.5 4.5 0 11-1.3-3.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                        <path d="M9.7 1v2.5H7.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                      </svg>
                    </button>
                    <button class="icon-btn" title="复制" @click="copyContent(item.content)">
                      <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                        <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M1 9V2a1 1 0 011-1h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                      </svg>
                    </button>
                    <button class="text-btn" @click="useForVideo(item)">用于视频</button>
                  </div>
                </div>

                <div class="content-wrap">
                  <textarea
                    v-if="item.editing"
                    v-model="item.content"
                    class="content-editor"
                    rows="5"
                    @blur="item.editing = false"
                  />
                  <div
                    v-else
                    :class="['content-text', { 'is-error': item.content.startsWith('[生成失败]') }]"
                    @dblclick="item.editing = true"
                  >
                    {{ item.content }}
                  </div>
                </div>

                <div class="result-foot">
                  <span class="char-count">{{ item.content.length }} 字</span>
                  <span class="edit-hint">双击编辑</span>
                </div>
              </template>

              <template v-else>
                <div class="skeleton-head">
                  <div class="skeleton-pill" />
                  <div class="skeleton-pill short" />
                </div>
                <div class="skeleton-line full" />
                <div class="skeleton-line mid" />
                <div class="skeleton-line short" />
              </template>
            </article>
          </div>
        </template>

        <div v-else-if="!generating" class="empty-state">
          <div class="empty-icon">
            <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
              <rect x="6" y="8" width="28" height="24" rx="3" stroke="#d0d0d0" stroke-width="1.5"/>
              <path d="M12 16h16M12 21h10M12 26h7" stroke="#d0d0d0" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="empty-text">配置话题和平台后，点击「一键生成」</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { useTrendingStore } from '@/stores/agent'

interface GeneratedCopy {
  platform: string
  platformName: string
  topic: string
  content: string
  editing: boolean
}

const router = useRouter()
const agentStore = useTrendingStore()
const brandStore = useBrandStore()

const topics = ref<string[]>([...agentStore.selectedTopics])
const draftTopic = ref('')
const generating = ref(false)
const activeStyle = ref('viral')
const results = ref<GeneratedCopy[]>([])

const platformOptions = ref([
  { key: 'douyin', name: '抖音', selected: true },
  { key: 'xiaohongshu', name: '小红书', selected: true },
  { key: 'kuaishou', name: '快手', selected: true },
])

const styleOptions = [
  { key: 'viral', name: '爆款', desc: '高互动' },
  { key: 'emotional', name: '情感', desc: '引共鸣' },
  { key: 'info', name: '干货', desc: '有价值' },
  { key: 'funny', name: '搞笑', desc: '轻松风' },
  { key: 'story', name: '故事', desc: '带入感' },
]

const stylePromptMap: Record<string, string> = {
  viral: '爆款高互动风格，标题吸睛，结尾引导互动',
  emotional: '情感共鸣风格，引发情绪共鸣，拉近与用户距离',
  info: '干货价值风格，提供实用信息，引导收藏',
  funny: '幽默搞笑风格，轻松有趣，引发转发',
  story: '故事叙事风格，有代入感，真实可信',
}

const platformPromptMap: Record<string, string> = {
  douyin: '抖音（短视频文案，简短有力，适合配音，带话题标签）',
  xiaohongshu: '小红书（图文笔记风格，标题吸睛，正文分段清晰，多用 emoji，带#话题）',
  kuaishou: '快手（接地气，亲切朴实，贴近普通人生活）',
  weibo: '微博（简短口语化，带话题#，适合转发讨论）',
  bilibili: 'B站（二次元/年轻化语气，专业感强，适合长评价内容）',
  zhihu: '知乎（专业理性，有论据，适合深度内容）',
}

const canGenerate = computed(() => topics.value.length > 0 && platformOptions.value.some(item => item.selected))

function addTopic() {
  const value = draftTopic.value.trim()
  if (!value || topics.value.includes(value)) return
  topics.value.push(value)
  draftTopic.value = ''
}

function removeTopic(value: string) {
  topics.value = topics.value.filter(item => item !== value)
}

async function requestAi(prompt: string) {
  const systemPrompt = brandStore.systemPrompt
  const mergedPrompt = `你是一位专业的社交媒体文案创作专家，擅长为各大平台创作爆款内容。
${systemPrompt ? `\n${systemPrompt}\n` : ''}
要求：
- 直接输出文案正文，不要加任何解释或前缀
- 文案要自然真实，避免过度营销感
- 严格按照指定平台的内容规范和风格
- 输出纯文本，不要 markdown 格式`

  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: mergedPrompt,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    let message = `HTTP ${response.status}`
    try {
      message = JSON.parse(text)?.error || message
    } catch {
      // ignore invalid json
    }
    throw new Error(message)
  }

  const contentType = response.headers.get('content-type') || ''
  let text = ''

  if (contentType.includes('text/event-stream')) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('无法读取响应流')

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const payload = JSON.parse(raw)
          if (payload.error) throw new Error(payload.error)
          if (payload.text) text += payload.text
        } catch (error: any) {
          if (error?.message !== raw) throw error
        }
      }
    }
  } else {
    const data = await response.json()
    if (data.error) throw new Error(data.error.message || JSON.stringify(data.error))
    text = data.content?.find((item: any) => item.type === 'text')?.text
      ?? data.choices?.[0]?.message?.content
      ?? ''
  }

  return text.trim() || 'AI 未返回内容，请检查 API 配置或重试'
}

async function generateAll() {
  generating.value = true
  results.value = []

  const selectedPlatforms = platformOptions.value.filter(item => item.selected)
  const stylePrompt = stylePromptMap[activeStyle.value] || activeStyle.value
  let hasError = false

  for (const topic of topics.value) {
    for (const platform of selectedPlatforms) {
      const item: GeneratedCopy = {
        platform: platform.key,
        platformName: platform.name,
        topic,
        content: '',
        editing: false,
      }
      results.value.push(item)

      const prompt = `请围绕话题「${topic}」创作一条适合${platform.name}平台的爆款文案。

发布平台：${platformPromptMap[platform.key] || platform.name}
内容风格：${stylePrompt}

要求：
1. 结合品牌语境自然表达，不要硬广
2. 语言符合目标平台用户阅读习惯
3. 尽量带来互动感、收藏感或转发感`

      try {
        item.content = await requestAi(prompt)
      } catch (error: any) {
        item.content = `[生成失败] ${error.message}`
        hasError = true
      }
    }
  }

  generating.value = false

  if (hasError) {
    ElMessage.error('AI 生成失败，请检查 ANTHROPIC_API_KEY 配置后重试。')
  }

  agentStore.setSelectedTopics(topics.value)
  agentStore.setCopywritingResults(
    results.value
      .filter(item => !item.content.startsWith('[生成失败]'))
      .map(item => ({
        platform: item.platform,
        topic: item.topic,
        content: item.content,
        contentType: activeStyle.value,
        tones: [activeStyle.value],
      }))
  )
}

async function regenerate(index: number) {
  const item = results.value[index]
  const platformPrompt = platformPromptMap[item.platform] || item.platformName
  const stylePrompt = stylePromptMap[activeStyle.value] || activeStyle.value
  const prompt = `请重新创作一条关于话题「${item.topic}」的${item.platformName}文案。

发布平台：${platformPrompt}
内容风格：${stylePrompt}

要求：和上一版有所不同，换个角度或表达方式。`

  item.content = '重新生成中...'
  try {
    item.content = await requestAi(prompt)
  } catch (error: any) {
    item.content = `[生成失败] ${error.message}`
    ElMessage.error('AI 生成失败，请检查 ANTHROPIC_API_KEY 配置后重试。')
  }
}

async function copyContent(content: string) {
  await navigator.clipboard.writeText(content)
  ElMessage.success('已复制')
}

function useForVideo(item: GeneratedCopy) {
  agentStore.setVideoScript({
    topic: item.topic,
    content: item.content,
    platform: item.platform,
  })
  router.push('/agent/video')
}
</script>

<style scoped>
.copy-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #1f2937;
}

.page-desc {
  margin: 6px 0 0;
  font-size: 13px;
  color: #94a3b8;
}

.layout-grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 16px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 18px;
}

.config-card {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.config-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.topic-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.topic-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 10px;
  border-radius: 999px;
  background: #eff6ff;
  color: #2563eb;
  font-size: 12px;
  cursor: pointer;
}

.topic-input-row {
  display: flex;
  gap: 8px;
}

.text-input {
  flex: 1;
  height: 38px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 13px;
  outline: none;
}

.text-input:focus {
  border-color: #8b5cf6;
  box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.08);
}

.btn-generate,
.btn-sm,
.btn-outline,
.icon-btn,
.text-btn {
  border: none;
  cursor: pointer;
  transition: 0.18s ease;
}

.btn-generate {
  flex-shrink: 0;
  min-width: 104px;
  height: 40px;
  padding: 0 18px;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  font-size: 13px;
  font-weight: 600;
}

.btn-generate:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn-sm {
  height: 38px;
  padding: 0 12px;
  border-radius: 10px;
  background: #111827;
  color: #fff;
  font-size: 12px;
}

.btn-outline {
  background: #fff;
  color: #475569;
  border: 1px solid #dbe3ef;
}

.platform-grid,
.style-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plat-toggle,
.style-btn {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #334155;
  font-size: 13px;
  cursor: pointer;
}

.plat-toggle.active,
.style-btn.active {
  border-color: #c4b5fd;
  background: #faf8ff;
  color: #6d28d9;
}

.style-name {
  font-weight: 600;
}

.style-desc {
  font-size: 12px;
  color: #94a3b8;
}

.result-card-wrap {
  min-width: 0;
}

.result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.result-count {
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.result-loading {
  font-size: 12px;
  color: #8b5cf6;
}

.result-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-card {
  border: 1px solid #eceff3;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
}

.result-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.result-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.platform-tag,
.topic-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  font-size: 12px;
}

.platform-tag {
  background: #eef2ff;
  color: #4f46e5;
}

.topic-tag {
  max-width: 360px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  background: #f8fafc;
  color: #475569;
}

.result-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.text-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-size: 12px;
}

.content-wrap {
  border-radius: 12px;
  background: #f8fafc;
  padding: 12px;
}

.content-text,
.content-editor {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.75;
  white-space: pre-wrap;
  resize: none;
  outline: none;
}

.content-text.is-error {
  color: #dc2626;
}

.result-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 10px;
  font-size: 12px;
  color: #94a3b8;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 320px;
  color: #94a3b8;
}

.empty-icon {
  margin-bottom: 14px;
}

.empty-text {
  margin: 0;
  font-size: 13px;
}

.skeleton-head {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}

.skeleton-pill,
.skeleton-line {
  border-radius: 999px;
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: skeleton 1.2s ease infinite;
}

.skeleton-pill {
  width: 82px;
  height: 24px;
}

.skeleton-pill.short {
  width: 60px;
}

.skeleton-line {
  height: 12px;
  margin-bottom: 10px;
}

.skeleton-line.full { width: 100%; }
.skeleton-line.mid { width: 78%; }
.skeleton-line.short { width: 62%; margin-bottom: 0; }

@keyframes skeleton {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
