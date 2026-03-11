<template>
  <div class="poster-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">图文海报</h2>
        <p class="page-desc">AI 生成小红书 / 朋友圈风格图文海报文字内容</p>
      </div>
      <button class="btn-generate" :disabled="generating || !canGenerate" @click="generateAll">
        {{ generating ? '生成中...' : '一键生成' }}
      </button>
    </div>

    <div class="layout-grid">
      <section class="config-card card">
        <div class="config-block">
          <div class="config-label">话题 / 主题</div>
          <div v-if="topics.length" class="topic-list">
            <span v-for="topicItem in topics" :key="topicItem" class="topic-chip" @click="removeTopic(topicItem)">
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
              placeholder="输入话题或主题词..."
              @keydown.enter.prevent="addTopic"
            />
            <button class="btn-sm" @click="addTopic">添加</button>
            <button class="btn-sm btn-outline" @click="$router.push('/agent/trending')">从热搜选</button>
          </div>
        </div>

        <div class="config-block">
          <div class="config-label">海报风格</div>
          <div class="style-grid">
            <button
              v-for="style in styleOptions"
              :key="style.key"
              :class="['style-btn', { active: activeStyle === style.key }]"
              @click="activeStyle = style.key"
            >
              <span class="style-emoji">{{ style.emoji }}</span>
              <span class="style-name">{{ style.name }}</span>
              <span class="style-desc">{{ style.desc }}</span>
            </button>
          </div>
        </div>

        <div class="config-block">
          <div class="config-label">内容格式</div>
          <div class="format-grid">
            <label
              v-for="format in formatOptions"
              :key="format.key"
              :class="['format-toggle', { active: format.selected }]"
            >
              <input v-model="format.selected" type="checkbox" style="display:none" />
              <span class="format-name">{{ format.name }}</span>
              <span class="format-desc">{{ format.desc }}</span>
            </label>
          </div>
        </div>
      </section>

      <section class="result-card-wrap card">
        <template v-if="results.length">
          <div class="result-head">
            <span class="result-count">{{ results.length }} 张海报</span>
            <span v-if="generating" class="result-loading">AI 生成中...</span>
          </div>

          <div class="poster-list">
            <article
              v-for="(item, index) in results"
              :key="`${item.topic}-${item.styleKey}-${index}`"
              :class="['poster-card', `style-${item.styleKey}`]"
            >
              <template v-if="item.title">
                <div class="poster-style-tag">{{ item.styleName }}</div>
                <div :class="['poster-content', { editing: item.editing }]">
                  <textarea
                    v-if="item.editing"
                    v-model="item.title"
                    class="edit-area title-edit"
                    rows="2"
                    @blur="item.editing = false"
                  />
                  <div v-else class="poster-title" @dblclick="item.editing = true">{{ item.title }}</div>

                  <textarea
                    v-if="item.editing"
                    v-model="item.body"
                    class="edit-area body-edit"
                    rows="6"
                    @blur="item.editing = false"
                  />
                  <div v-else class="poster-body" @dblclick="item.editing = true">{{ item.body }}</div>

                  <div v-if="item.tags.length" class="poster-tags">
                    <span v-for="tag in item.tags" :key="tag" class="poster-tag">#{{ tag }}</span>
                  </div>
                </div>

                <div class="poster-actions">
                  <button class="icon-btn" title="重新生成" @click="regenerate(index)">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <path d="M11 6.5a4.5 4.5 0 11-1.3-3.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                      <path d="M9.7 1v2.5H7.2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </button>
                  <button class="icon-btn" title="复制全文" @click="copyContent(item)">
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                      <rect x="4" y="4" width="8" height="8" rx="1" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M1 9V2a1 1 0 011-1h7" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                    </svg>
                  </button>
                  <button class="text-btn" @click="useForPublish(item)">用于发布</button>
                </div>
              </template>

              <template v-else>
                <div class="skeleton-tag" />
                <div class="skeleton-title" />
                <div class="skeleton-line full" />
                <div class="skeleton-line mid" />
                <div class="skeleton-line long" />
                <div class="skeleton-tags-row">
                  <div class="skeleton-tag short" />
                  <div class="skeleton-tag shorter" />
                </div>
              </template>
            </article>
          </div>
        </template>

        <div v-else-if="!generating" class="empty-state">
          <div class="empty-icon">
            <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
              <rect x="5" y="5" width="34" height="34" rx="6" stroke="#d8d8d8" stroke-width="1.5"/>
              <rect x="10" y="10" width="14" height="10" rx="2" stroke="#d8d8d8" stroke-width="1.5"/>
              <path d="M10 26h24M10 31h18" stroke="#d8d8d8" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </div>
          <p class="empty-text">配置话题和风格后，点击「一键生成」</p>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { useBrandStore } from '@/stores/brand'
import { useTrendingStore } from '@/stores/agent'

interface PosterResult {
  topic: string
  styleKey: string
  styleName: string
  title: string
  body: string
  tags: string[]
  editing: boolean
}

const agentStore = useTrendingStore()
const brandStore = useBrandStore()

const topics = ref<string[]>([...agentStore.selectedTopics])
const draftTopic = ref('')
const activeStyle = ref('xiaohongshu')
const generating = ref(false)
const results = ref<PosterResult[]>([])

const styleOptions = [
  { key: 'xiaohongshu', name: '小红书', emoji: '📕', desc: '笔记风' },
  { key: 'moments', name: '朋友圈', emoji: '💬', desc: '亲切感' },
  { key: 'seeding', name: '种草', emoji: '🌿', desc: '推荐风' },
  { key: 'poster', name: '海报文', emoji: '🎨', desc: '大字报' },
  { key: 'story', name: '故事风', emoji: '📖', desc: '有代入' },
]

const formatOptions = ref([
  { key: 'title', name: '吸睛标题', desc: '带emoji', selected: true },
  { key: 'body', name: '正文分段', desc: '清晰排版', selected: true },
  { key: 'tags', name: '话题标签', desc: '#tag格式', selected: true },
  { key: 'cta', name: '互动引导', desc: '评论/收藏', selected: true },
])

const stylePromptMap: Record<string, string> = {
  xiaohongshu: '小红书笔记风格：标题吸睛带emoji，正文分段清晰，语气亲切，多用感叹号，结尾引导收藏/关注，带#话题标签',
  moments: '微信朋友圈风格：简短有力，情感真实，口语化，适合引发共鸣，不超过200字',
  seeding: '种草文案风格：突出产品/话题卖点，用“我发现了”“强烈推荐”等词，真实体验感，引导购买/尝试',
  poster: '宣传海报文字风格：短句有力，视觉冲击感强，每行不超过20字，适合放大展示',
  story: '故事叙事风格：有起承转合，代入感强，像在讲自己的亲身经历，情绪有层次',
}

const canGenerate = computed(() => topics.value.length > 0)

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
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: `你是一位专业的社交媒体图文创作专家，擅长小红书、朋友圈等平台的爆款内容创作。${systemPrompt ? `\n${systemPrompt}` : ''}\n要求：直接输出内容，不要加任何解释或前缀，不要 markdown 格式。`,
    }),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)

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

  return text.trim()
}

function parsePoster(raw: string, topic: string, styleKey: string, styleName: string): PosterResult {
  const titleMatch = raw.match(/(?:标题|主标题)[：: ]*([^\n]+)/)
  const bodyMatch = raw.match(/(?:正文|内容)[：:\n]*([\s\S]*?)(?=标签|互动|$)/)
  const tagsMatch = raw.match(/(?:标签|话题标签)[：: ]*([^\n]+)/)
  const tags = tagsMatch
    ? tagsMatch[1].split(/[、,，#\s]+/).map(item => item.trim()).filter(Boolean).slice(0, 6)
    : []

  return {
    topic,
    styleKey,
    styleName,
    title: titleMatch?.[1]?.trim() || raw.split('\n')[0]?.trim() || topic,
    body: bodyMatch?.[1]?.trim() || raw,
    tags,
    editing: false,
  }
}

function buildPrompt(topic: string, styleKey: string) {
  const styleName = styleOptions.find(item => item.key === styleKey)?.name || styleKey
  const selectedFormats = formatOptions.value.filter(item => item.selected).map(item => item.name)
  return `请围绕话题「${topic}」创作一组${styleName}图文海报文字内容。\n\n风格要求：${stylePromptMap[styleKey] || styleKey}\n内容格式：${selectedFormats.join('、')}\n\n请输出：\n1. 标题（带emoji，25字以内）\n2. 正文内容（按风格要求排版）\n3. 标签1、标签2、标签3、标签4\n4. 互动引导\n\n内容要具体、自然、可直接发布。`
}

async function generateAll() {
  generating.value = true
  results.value = []
  let hasError = false

  for (const topic of topics.value) {
    const styleName = styleOptions.find(item => item.key === activeStyle.value)?.name || activeStyle.value
    const placeholder: PosterResult = {
      topic,
      styleKey: activeStyle.value,
      styleName,
      title: '',
      body: '',
      tags: [],
      editing: false,
    }
    results.value.push(placeholder)

    try {
      const raw = await requestAi(buildPrompt(topic, activeStyle.value))
      Object.assign(placeholder, parsePoster(raw, topic, activeStyle.value, styleName))
    } catch (error: any) {
      placeholder.title = '[生成失败]'
      placeholder.body = error.message
      hasError = true
    }
  }

  generating.value = false
  if (hasError) ElMessage.error('部分内容生成失败，请检查 ANTHROPIC_API_KEY 配置')
}

async function regenerate(index: number) {
  const item = results.value[index]
  item.title = ''
  item.body = ''
  item.tags = []

  try {
    const raw = await requestAi(buildPrompt(item.topic, item.styleKey))
    Object.assign(item, parsePoster(raw, item.topic, item.styleKey, item.styleName))
  } catch {
    item.title = '[生成失败]'
    item.body = '重新生成失败'
    ElMessage.error('重新生成失败')
  }
}

async function copyContent(item: PosterResult) {
  const tags = item.tags.map(tag => `#${tag}`).join(' ')
  await navigator.clipboard.writeText(`${item.title}\n\n${item.body}\n\n${tags}`.trim())
  ElMessage.success('已复制到剪贴板')
}

function useForPublish(item: PosterResult) {
  const tags = item.tags.map(tag => `#${tag}`).join(' ')
  agentStore.setPublishContent({
    script: `${item.title}\n\n${item.body}\n\n${tags}`.trim(),
    topic: item.topic,
    type: 'image_text',
  })
  ;(window as any).location.hash = '/agent/publish'
}
</script>

<style scoped>
.poster-page {
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
  background: #fdf2f8;
  color: #db2777;
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
  border-color: #ec4899;
  box-shadow: 0 0 0 3px rgba(236, 72, 153, 0.08);
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

.btn-sm:hover,
.btn-outline:hover,
.icon-btn:hover,
.text-btn:hover {
  transform: translateY(-1px);
}

.style-grid,
.format-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.style-btn,
.format-toggle {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #334155;
  cursor: pointer;
}

.style-btn.active,
.format-toggle.active {
  border-color: #f9a8d4;
  background: #fff1f7;
}

.style-emoji {
  font-size: 16px;
}

.style-name,
.format-name {
  font-size: 13px;
  font-weight: 600;
  text-align: left;
}

.style-desc,
.format-desc {
  font-size: 12px;
  color: #94a3b8;
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
  color: #ec4899;
}

.poster-list {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.poster-card {
  border-radius: 16px;
  border: 1px solid #eceff3;
  padding: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%);
  transition: box-shadow 0.18s ease, transform 0.18s ease;
}

.poster-card:hover {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.07);
  transform: translateY(-1px);
}

.poster-style-tag {
  display: inline-flex;
  align-items: center;
  height: 24px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.8);
  color: #db2777;
  font-size: 12px;
  margin-bottom: 10px;
}

.poster-content {
  min-height: 240px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.8);
  padding: 14px;
}

.poster-title,
.poster-body,
.edit-area {
  width: 100%;
  border: none;
  background: transparent;
  outline: none;
  resize: none;
  white-space: pre-wrap;
}

.poster-title,
.title-edit {
  font-size: 18px;
  line-height: 1.45;
  font-weight: 700;
  color: #111827;
  margin-bottom: 12px;
}

.poster-body,
.body-edit {
  font-size: 13px;
  line-height: 1.8;
  color: #334155;
}

.poster-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 14px;
}

.poster-tag {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(236, 72, 153, 0.08);
  color: #db2777;
  font-size: 11px;
}

.poster-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
}

.icon-btn {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  background: #fff;
  color: #475569;
}

.text-btn {
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-size: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 360px;
  color: #94a3b8;
}

.empty-icon {
  margin-bottom: 14px;
}

.empty-text {
  margin: 0;
  font-size: 13px;
}

.style-xiaohongshu { background: linear-gradient(180deg, #fff7fb 0%, #fff1f7 100%); }
.style-moments { background: linear-gradient(180deg, #f7fffb 0%, #eefcf4 100%); }
.style-seeding { background: linear-gradient(180deg, #fefce8 0%, #fff7d6 100%); }
.style-poster { background: linear-gradient(180deg, #fff7ed 0%, #ffedd5 100%); }
.style-story { background: linear-gradient(180deg, #f5f3ff 0%, #ede9fe 100%); }

.skeleton-tag,
.skeleton-title,
.skeleton-line {
  background: linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 37%, #f3f4f6 63%);
  background-size: 400% 100%;
  animation: skeleton 1.2s ease infinite;
}

.skeleton-tag {
  width: 72px;
  height: 24px;
  border-radius: 999px;
  margin-bottom: 12px;
}

.skeleton-tag.short { width: 56px; margin-bottom: 0; }
.skeleton-tag.shorter { width: 44px; margin-bottom: 0; }

.skeleton-title {
  height: 22px;
  border-radius: 10px;
  margin-bottom: 14px;
}

.skeleton-line {
  height: 12px;
  border-radius: 999px;
  margin-bottom: 10px;
}

.skeleton-line.full { width: 100%; }
.skeleton-line.mid { width: 84%; }
.skeleton-line.long { width: 92%; }

.skeleton-tags-row {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

@keyframes skeleton {
  0% { background-position: 100% 50%; }
  100% { background-position: 0 50%; }
}

@media (max-width: 900px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }

  .poster-list {
    grid-template-columns: 1fr;
  }
}
</style>
