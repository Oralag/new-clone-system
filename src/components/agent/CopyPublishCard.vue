<template>
  <div class="cpc-wrap" :class="`cpc-${card.platform}`">
    <!-- 平台头部 -->
    <div class="cpc-platform-bar">
      <span class="cpc-platform-icon">{{ platformEmoji }}</span>
      <span class="cpc-platform-name">{{ card.platform_name || platformLabel }}</span>
      <span class="cpc-badge">可发布</span>
    </div>

    <!-- 内容预览 -->
    <div class="cpc-content">
      <div class="cpc-title">{{ card.title }}</div>
      <div class="cpc-body">{{ card.body }}</div>
      <div class="cpc-hashtags" v-if="card.hashtags?.length">
        <span v-for="tag in card.hashtags" :key="tag" class="cpc-tag">#{{ tag }}</span>
      </div>
      <div class="cpc-meta">
        <span>{{ charCount }} 字</span>
        <span v-if="card.hashtags?.length">{{ card.hashtags.length }} 个话题</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="cpc-footer">
      <button class="cpc-publish-btn" @click="publishToplatform" :disabled="publishing">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>
        发布到{{ card.platform_name || platformLabel }}
      </button>
      <button class="cpc-copy-btn" @click="copyText" :class="{ copied }">
        {{ copied ? '✓ 已复制' : '复制文案' }}
      </button>
      <button class="cpc-save-btn" @click="saveToQueue" :class="{ saved }">
        {{ saved ? '✓ 已入队' : '存入发布' }}
      </button>
    </div>

    <!-- 手动发布引导提示（仅本地服务未运行时显示） -->
    <div v-if="showGuide" class="cpc-guide">
      <div class="cpc-guide-step done">✓ 文案已复制到剪贴板</div>
      <div class="cpc-guide-step active">→ 在{{ card.platform_name || platformLabel }}创作页粘贴（Ctrl+V / ⌘V）</div>
      <div class="cpc-guide-tip">💡 启动本地发布服务可实现全自动发布：<code>python social-publisher/server.py</code></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useTrendingStore } from '@/stores/agent'

export interface PublishCardData {
  platform: string
  platform_name?: string
  title: string
  body: string
  hashtags?: string[]
  emoji_opening?: string
}

const props = defineProps<{ card: PublishCardData }>()
const emit = defineEmits<{ (e: 'saved'): void }>()

const agentStore = useTrendingStore()
const copying = ref(false)
const copied = ref(false)
const saved = ref(false)
const publishing = ref(false)
const showGuide = ref(false)

const PLATFORM_CONFIG: Record<string, { emoji: string; label: string; url: string }> = {
  xiaohongshu: { emoji: '📕', label: '小红书', url: 'https://creator.xiaohongshu.com/publish/publish' },
  douyin: { emoji: '🎵', label: '抖音', url: 'https://creator.douyin.com/creator-micro/content/upload' },
  weibo: { emoji: '🌐', label: '微博', url: 'https://weibo.com/minipublish' },
  bilibili: { emoji: '📺', label: 'B站', url: 'https://member.bilibili.com/platform/upload/text/edit' },
  kuaishou: { emoji: '⚡', label: '快手', url: 'https://cp.kuaishou.com/article/publish/video' },
  wechat: { emoji: '📗', label: '微信公众号', url: 'https://mp.weixin.qq.com/' },
  zhihu: { emoji: '💡', label: '知乎', url: 'https://www.zhihu.com/write' },
}

const platformConfig = computed(() =>
  PLATFORM_CONFIG[props.card.platform] ?? { emoji: '📱', label: props.card.platform, url: '' }
)
const platformEmoji = computed(() => platformConfig.value.emoji)
const platformLabel = computed(() => platformConfig.value.label)

const fullText = computed(() => {
  const parts = [props.card.title, '', props.card.body]
  if (props.card.hashtags?.length) {
    parts.push('', props.card.hashtags.map(t => `#${t}`).join(' '))
  }
  return parts.join('\n')
})

const charCount = computed(() => (props.card.title + props.card.body).length)

async function copyText() {
  await navigator.clipboard.writeText(fullText.value)
  copied.value = true
  ElMessage.success('文案已复制')
  setTimeout(() => { copied.value = false }, 3000)
}

const SERVICE_KEY = 'publisher_service_url'

async function tryAutoPublish(): Promise<boolean> {
  const serviceUrl = (localStorage.getItem(SERVICE_KEY) || 'http://localhost:8765').replace(/\/$/, '')
  try {
    const health = await fetch(`${serviceUrl}/health`, { signal: AbortSignal.timeout(1500) })
    if (!health.ok) return false

    // 服务在线，发布
    const body: Record<string, any> = {
      platform: props.card.platform,
      account: 'default',
      title: props.card.title,
      body: props.card.body,
      hashtags: props.card.hashtags || [],
    }
    // 如果有图片（海报截图URL）则附上
    if ((props.card as any).imageUrl) body.images = [(props.card as any).imageUrl]

    const resp = await fetch(`${serviceUrl}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    })
    const data = await resp.json()
    if (data.success) {
      ElMessage.success(`✅ 已自动发布到${props.card.platform_name || platformLabel.value}`)
      saveToQueue(true)
      return true
    }
    ElMessage.warning(`自动发布失败：${data.message}，切换手动模式`)
    return false
  } catch {
    return false   // 服务未运行，降级
  }
}

async function publishToplatform() {
  publishing.value = true
  try {
    // 1. 先尝试本地发布服务（自动发布）
    const autoOk = await tryAutoPublish()
    if (autoOk) return

    // 2. 降级：复制文案 + 跳转到平台发布页
    const url = platformConfig.value.url
    if (!url) { ElMessage.warning('该平台暂未配置发布链接'); return }
    await navigator.clipboard.writeText(fullText.value)
    showGuide.value = true
    window.open(url, '_blank')
    saveToQueue(true)
    setTimeout(() => { showGuide.value = false }, 8000)
  } catch {
    ElMessage.error('操作失败，请手动复制文案')
  } finally {
    publishing.value = false
  }
}

function saveToQueue(markPublished = false) {
  if (saved.value && !markPublished) return
  agentStore.setFlowResults([
    ...agentStore.flowResults,
    {
      platform: props.card.platform,
      platformName: props.card.platform_name || platformLabel.value,
      topic: props.card.title,
      type: 'copy',
      content: fullText.value,
      published: markPublished,
    },
  ])
  saved.value = true
  emit('saved')
  if (!markPublished) ElMessage({ message: '已存入发布队列', type: 'success', duration: 2500 })
}
</script>

<style scoped>
.cpc-wrap {
  border-radius: 12px;
  overflow: hidden;
  border: 1.5px solid #f0f0f0;
  margin: 10px 0;
  background: #fff;
  font-family: 'PingFang SC', -apple-system, sans-serif;
}

/* 平台色 */
.cpc-xiaohongshu { border-color: rgba(255, 55, 95, 0.3); }
.cpc-douyin { border-color: rgba(0, 0, 0, 0.2); }
.cpc-weibo { border-color: rgba(230, 22, 45, 0.25); }

.cpc-platform-bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
}
.cpc-xiaohongshu .cpc-platform-bar { background: rgba(255, 55, 95, 0.04); }
.cpc-platform-icon { font-size: 14px; }
.cpc-platform-name { font-size: 12px; font-weight: 700; color: #333; }
.cpc-badge {
  margin-left: auto;
  font-size: 9px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 20px;
  background: rgba(16, 185, 129, 0.1);
  color: #059669;
  letter-spacing: 0.04em;
}

.cpc-content {
  padding: 14px 14px 10px;
}
.cpc-title {
  font-size: 15px;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.4;
  margin-bottom: 8px;
}
.cpc-body {
  font-size: 13px;
  color: #444;
  line-height: 1.7;
  white-space: pre-line;
  max-height: 160px;
  overflow-y: auto;
  margin-bottom: 10px;
}
.cpc-hashtags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-bottom: 8px;
}
.cpc-tag {
  font-size: 12px;
  font-weight: 600;
  color: #ff375f;
  background: rgba(255, 55, 95, 0.07);
  padding: 2px 8px;
  border-radius: 20px;
}
.cpc-douyin .cpc-tag { color: #333; background: rgba(0,0,0,0.06); }
.cpc-meta {
  display: flex;
  gap: 12px;
  font-size: 10px;
  color: #aaa;
}

.cpc-footer {
  display: flex;
  gap: 6px;
  padding: 10px 14px;
  border-top: 1px solid #f5f5f5;
  background: #fafafa;
}
.cpc-publish-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  font-family: inherit;
  border: none;
  background: #ff375f;
  color: #fff;
  transition: all 0.15s;
  flex: 1;
  justify-content: center;
}
.cpc-publish-btn:hover:not(:disabled) { background: #e0264e; }
.cpc-publish-btn:disabled { opacity: 0.5; cursor: default; }
.cpc-douyin .cpc-publish-btn { background: #1a1a1a; }
.cpc-douyin .cpc-publish-btn:hover:not(:disabled) { background: #333; }

.cpc-copy-btn,
.cpc-save-btn {
  padding: 7px 10px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  background: transparent;
  color: #666;
  border: 1px solid #e0e0e0;
  transition: all 0.15s;
  white-space: nowrap;
}
.cpc-copy-btn:hover:not(.copied) { border-color: #666; color: #333; }
.cpc-copy-btn.copied { color: #059669; border-color: rgba(5, 150, 105, 0.3); background: rgba(5, 150, 105, 0.05); }
.cpc-save-btn:hover:not(.saved) { border-color: #10b981; color: #059669; }
.cpc-save-btn.saved { color: #059669; border-color: rgba(5, 150, 105, 0.3); }

.cpc-guide {
  padding: 10px 14px;
  background: rgba(16, 185, 129, 0.05);
  border-top: 1px solid rgba(16, 185, 129, 0.15);
}
.cpc-guide-step {
  font-size: 12px;
  padding: 3px 0;
}
.cpc-guide-step.done { color: #059669; font-weight: 600; }
.cpc-guide-step.active { color: #0071e3; font-weight: 600; }
.cpc-guide-tip { font-size: 11px; color: #888; margin-top: 6px; }
.cpc-guide-tip code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px; font-size: 10px; }
</style>
