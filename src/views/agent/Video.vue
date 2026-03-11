<template>
  <div class="video-page">
    <div class="page-head">
      <div>
        <h2 class="page-title">视频生成</h2>
        <p class="page-desc">AI 自动生成短视频，支持多种风格与尺寸</p>
      </div>
      <button class="btn-generate" :disabled="generating || !canGenerate" @click="generateVideos">
        {{ generating ? '生成中...' : '生成视频' }}
      </button>
    </div>

    <div class="layout-grid">
      <section class="card config-card">
        <div class="config-block">
          <div class="card-label">脚本内容</div>
          <textarea
            v-model="script"
            class="script-area"
            rows="4"
            placeholder="输入视频内容描述，或从文案页带入..."
          />
          <div class="script-meta">
            <span>{{ script.length }} 字</span>
            <button class="link-btn" @click="$router.push('/agent/copywriting')">从文案页选择</button>
          </div>
        </div>

        <div class="config-block">
          <div class="card-label">画幅比例</div>
          <div class="ratio-grid">
            <div
              v-for="item in ratioOptions"
              :key="item.key"
              :class="['ratio-card', { active: ratio === item.key }]"
              @click="ratio = item.key"
            >
              <div class="ratio-box" :style="{ aspectRatio: item.aspect }">
                <span>{{ item.aspect }}</span>
              </div>
              <div class="ratio-name">{{ item.name }}</div>
              <div class="ratio-platforms">{{ item.platforms }}</div>
            </div>
          </div>
        </div>

        <div class="row-grid two-up">
          <div class="config-block compact">
            <div class="card-label">视频时长</div>
            <div class="seg-grid">
              <button
                v-for="item in durations"
                :key="item"
                :class="['seg-btn', { active: duration === item }]"
                @click="duration = item"
              >
                {{ item }}s
              </button>
            </div>
          </div>

          <div class="config-block compact">
            <div class="card-label">视频数量</div>
            <div class="seg-grid">
              <button
                v-for="item in [1, 2, 3]"
                :key="item"
                :class="['seg-btn', { active: count === String(item) }]"
                @click="count = String(item)"
              >
                {{ item }} 个
              </button>
            </div>
          </div>
        </div>

        <div class="config-block">
          <div class="card-label">视频风格</div>
          <div class="style-grid">
            <div
              v-for="item in styleOptions"
              :key="item.key"
              :class="['style-card', { active: style === item.key }]"
              @click="style = item.key"
            >
              <div class="style-swatch" :style="{ background: item.gradient }" />
              <div>
                <div class="style-name">{{ item.name }}</div>
                <div class="style-desc">{{ item.desc }}</div>
              </div>
            </div>
          </div>
        </div>

        <div class="config-block">
          <div class="card-label">生成模型</div>
          <div class="model-list">
            <div
              v-for="item in modelOptions"
              :key="item.key"
              :class="['model-row', { active: model === item.key }]"
              @click="model = item.key"
            >
              <div class="model-name">{{ item.name }}</div>
              <div class="model-tags">
                <span v-for="tag in item.tags" :key="tag" class="model-tag">{{ tag }}</span>
              </div>
              <div v-if="model === item.key" class="model-check">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div class="config-block">
          <div class="card-label">高级选项</div>
          <div class="adv-grid">
            <div>
              <label class="adv-label">背景音乐</label>
              <select v-model="bgMusic" class="adv-select">
                <option value="none">无音乐</option>
                <option value="upbeat">轻快活力</option>
                <option value="emotional">情感温柔</option>
                <option value="epic">史诗震撼</option>
                <option value="lofi">Lo-Fi</option>
                <option value="trending">平台热门</option>
              </select>
            </div>
            <div>
              <label class="adv-label">字幕</label>
              <select v-model="subtitle" class="adv-select">
                <option value="none">不添加</option>
                <option value="bottom">底部字幕</option>
                <option value="dynamic">动态字幕</option>
                <option value="karaoke">卡拉OK</option>
              </select>
            </div>
            <div>
              <label class="adv-label">水印</label>
              <select v-model="watermark" class="adv-select">
                <option value="none">不添加</option>
                <option value="logo">Logo</option>
                <option value="text">文字</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      <section class="card preview-card">
        <div class="card-label">预览</div>

        <div v-if="generating" class="progress-box">
          <div class="progress-circle">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <circle cx="32" cy="32" r="28" stroke="#f0f0f0" stroke-width="3" fill="none"/>
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#1a1a1a"
                stroke-width="3"
                fill="none"
                stroke-dasharray="175.9"
                :stroke-dashoffset="175.9 * (1 - progress / 100)"
                stroke-linecap="round"
                transform="rotate(-90 32 32)"
                style="transition: stroke-dashoffset 0.4s"
              />
            </svg>
            <span>{{ progress }}%</span>
          </div>
          <div class="progress-text">{{ progressText }}</div>
        </div>

        <div v-else-if="generatedVideos.length" class="video-list">
          <div v-for="(item, index) in generatedVideos" :key="index" class="video-item">
            <div class="video-thumb" :style="{ aspectRatio: currentAspectRatio }">
              <div class="thumb-play">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7 5l10 5-10 5V5z" fill="rgba(255,255,255,0.8)"/>
                </svg>
              </div>
              <span class="thumb-style">{{ item.style }}</span>
              <span class="thumb-duration">{{ duration }}s</span>
            </div>
            <div class="video-meta">
              <div class="video-title">方案 {{ index + 1 }} · {{ item.modelName }}</div>
              <div class="video-tags">
                <span>{{ item.ratio }}</span>
                <span>{{ item.style }}</span>
              </div>
            </div>
            <div class="video-actions">
              <button class="video-btn" @click="goToPublish(item)">去发布</button>
            </div>
          </div>
        </div>

        <div v-else class="preview-empty">
          <div class="preview-mock" :style="{ aspectRatio: currentAspectRatio }">
            <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
              <path d="M6 20V8l12 6-12 6z" stroke="#d0d0d0" stroke-width="1.5" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="preview-hint">视频将在此处显示</p>
        </div>

        <div class="summary-card">
          <div v-for="item in summaryItems" :key="item.label" class="summary-row">
            <span class="summary-label">{{ item.label }}</span>
            <span class="summary-value">{{ item.value }}</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTrendingStore } from '@/stores/agent'

const router = useRouter()
const agentStore = useTrendingStore()

const script = ref(agentStore.videoScript?.content || '')
const ratio = ref('9:16')
const duration = ref(30)
const style = ref('realistic')
const model = ref('kling')
const bgMusic = ref('upbeat')
const subtitle = ref('dynamic')
const watermark = ref('none')
const count = ref('1')
const generating = ref(false)
const progress = ref(0)
const progressText = ref('')
const generatedVideos = ref<any[]>([])

const ratioOptions = [
  { key: '9:16', name: '竖版', aspect: '9/16', platforms: '抖音 · 快手' },
  { key: '1:1', name: '方形', aspect: '1/1', platforms: '小红书' },
  { key: '16:9', name: '横版', aspect: '16/9', platforms: 'B站' },
]

const durations = [15, 30, 60]

const styleOptions = [
  { key: 'realistic', name: '真实感', desc: 'AI 真实场景', gradient: 'linear-gradient(135deg,#1e3a5f,#2d6a9f)' },
  { key: 'anime', name: '动漫风', desc: '二次元插画', gradient: 'linear-gradient(135deg,#4a1a6e,#9333ea)' },
  { key: 'cinematic', name: '电影感', desc: '大片质感', gradient: 'linear-gradient(135deg,#1a1a1a,#555)' },
  { key: 'cute', name: '可爱', desc: '萌系温柔', gradient: 'linear-gradient(135deg,#be185d,#f472b6)' },
  { key: 'tech', name: '科技感', desc: '赛博朋克', gradient: 'linear-gradient(135deg,#0c4a6e,#06b6d4)' },
  { key: 'vintage', name: '复古', desc: '胶片质感', gradient: 'linear-gradient(135deg,#78350f,#d97706)' },
]

const modelOptions = [
  { key: 'kling', name: 'Kling AI（可灵）', tags: ['快手出品', '中文优化', '推荐'] },
  { key: 'runway', name: 'Runway Gen-4', tags: ['国际顶尖', '画质优秀'] },
  { key: 'hailuo', name: '海螺 AI（MiniMax）', tags: ['国产', '速度快'] },
  { key: 'jimeng', name: '即梦 AI（字节）', tags: ['抖音生态', '风格多'] },
]

const canGenerate = computed(() => script.value.trim().length > 0)
const currentAspectRatio = computed(() => ratioOptions.find(item => item.key === ratio.value)?.aspect || '9/16')

const summaryItems = computed(() => [
  { label: '风格', value: styleOptions.find(item => item.key === style.value)?.name || '' },
  { label: '画幅', value: ratio.value },
  { label: '时长', value: `${duration.value}秒` },
  { label: '模型', value: (modelOptions.find(item => item.key === model.value)?.name || '').split('（')[0] },
  { label: '数量', value: `${count.value} 个` },
])

async function generateVideos() {
  generating.value = true
  progress.value = 0
  progressText.value = ''
  generatedVideos.value = []

  const steps = ['分析文案内容...', '生成视频脚本...', '渲染视频帧...', '合成音效...', '最终处理...']
  for (let index = 0; index < steps.length; index += 1) {
    progressText.value = steps[index]
    await new Promise(resolve => setTimeout(resolve, 600))
    progress.value = Math.round(((index + 1) / steps.length) * 100)
  }

  const styleName = styleOptions.find(item => item.key === style.value)?.name || ''
  const modelName = (modelOptions.find(item => item.key === model.value)?.name || '').split('（')[0]
  const total = parseInt(count.value, 10)
  const items = []

  for (let index = 0; index < total; index += 1) {
    items.push({
      style: styleName,
      ratio: ratio.value,
      modelName,
      script: script.value,
      duration: duration.value,
      bgMusic: bgMusic.value,
      subtitle: subtitle.value,
      watermark: watermark.value,
    })
  }

  generatedVideos.value = items
  generating.value = false
  agentStore.setVideoResults(items)
}

function goToPublish(item: any) {
  agentStore.setPublishContent({
    script: script.value,
    topic: agentStore.videoScript?.topic || '视频脚本',
    type: 'video_script',
    video: item,
  } as any)
  router.push('/agent/publish')
}
</script>

<style scoped>
.video-page {
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
  grid-template-columns: 1.1fr 0.9fr;
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

.card-label {
  margin-bottom: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.script-area {
  width: 100%;
  border: 1px solid #dbe3ef;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.7;
  resize: vertical;
  outline: none;
}

.script-area:focus {
  border-color: #111827;
}

.script-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 12px;
  color: #94a3b8;
}

.link-btn,
.btn-generate,
.seg-btn,
.video-btn {
  border: none;
  cursor: pointer;
}

.link-btn {
  background: transparent;
  color: #2563eb;
  font-size: 12px;
}

.link-btn:hover {
  color: #111827;
}

.btn-generate {
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

.btn-generate:hover:not(:disabled),
.ratio-card:hover,
.style-card:hover,
.model-row:hover,
.video-btn:hover {
  transform: translateY(-1px);
}

.ratio-grid,
.style-grid,
.model-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.ratio-card,
.style-card,
.model-row {
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 12px 14px;
  cursor: pointer;
  transition: 0.18s ease;
}

.ratio-card.active,
.style-card.active,
.model-row.active {
  border-color: #c7d2fe;
  background: #f8faff;
}

.ratio-card {
  display: grid;
  grid-template-columns: 60px 1fr auto;
  align-items: center;
  gap: 12px;
}

.ratio-box {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
}

.ratio-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.ratio-platforms {
  font-size: 12px;
  color: #94a3b8;
}

.row-grid.two-up {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.seg-grid {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.seg-btn {
  height: 34px;
  padding: 0 12px;
  border-radius: 999px;
  background: #f8fafc;
  color: #475569;
  font-size: 12px;
}

.seg-btn.active {
  background: #111827;
  color: #fff;
}

.style-card {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  align-items: center;
}

.style-swatch {
  width: 44px;
  height: 44px;
  border-radius: 12px;
}

.style-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.style-desc {
  font-size: 12px;
  color: #94a3b8;
  margin-top: 2px;
}

.model-row {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 12px;
}

.model-name {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.model-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.model-tag {
  display: inline-flex;
  align-items: center;
  height: 22px;
  padding: 0 8px;
  border-radius: 999px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
}

.model-check {
  color: #111827;
}

.adv-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.adv-label {
  display: block;
  margin-bottom: 6px;
  font-size: 12px;
  color: #64748b;
}

.adv-select {
  width: 100%;
  height: 36px;
  border: 1px solid #dbe3ef;
  border-radius: 10px;
  padding: 0 10px;
  font-size: 12px;
  background: #fff;
}

.preview-card {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.progress-box,
.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 280px;
}

.progress-circle {
  position: relative;
  width: 64px;
  height: 64px;
  margin-bottom: 12px;
}

.progress-circle span {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #111827;
}

.progress-text,
.preview-hint {
  font-size: 13px;
  color: #94a3b8;
}

.video-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-item {
  border: 1px solid #eceff3;
  border-radius: 14px;
  padding: 12px;
  transition: box-shadow 0.18s ease;
}

.video-item:hover {
  box-shadow: 0 4px 18px rgba(15, 23, 42, 0.08);
}

.video-thumb,
.preview-mock {
  position: relative;
  width: 100%;
  border-radius: 14px;
  background: linear-gradient(135deg, #111827 0%, #374151 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.thumb-play {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}

.thumb-style,
.thumb-duration {
  position: absolute;
  bottom: 10px;
  font-size: 11px;
  color: #fff;
}

.thumb-style { left: 10px; }
.thumb-duration { right: 10px; }

.video-meta {
  margin-top: 10px;
}

.video-title {
  font-size: 13px;
  font-weight: 600;
  color: #1f2937;
}

.video-tags {
  display: flex;
  gap: 8px;
  margin-top: 6px;
  font-size: 12px;
  color: #94a3b8;
}

.video-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.video-btn {
  height: 32px;
  padding: 0 12px;
  border-radius: 8px;
  background: #111827;
  color: #fff;
  font-size: 12px;
}

.summary-card {
  margin-top: auto;
  border-top: 1px solid #eceff3;
  padding-top: 10px;
}

.summary-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 0;
}

.summary-label {
  font-size: 12px;
  color: #94a3b8;
}

.summary-value {
  font-size: 12px;
  color: #334155;
}

@media (max-width: 900px) {
  .layout-grid,
  .row-grid.two-up,
  .adv-grid {
    grid-template-columns: 1fr;
  }
}
</style>
