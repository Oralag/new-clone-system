<template>
  <div class="publish-page">

    <DeptBulletin dept-id="publish" />

    <!-- 员工卡 -->
    <DeptEmployeeCard
      name="Nova"
      role="发布专员"
      emoji="🚀"
      desc="多平台排期 · 发布计划 · 数据复盘"
      color="#10b981"
      illustId="publish"
      :stats="[
        { value: publishedCount, label: '已发布' },
        { value: pendingCount, label: '待发布' },
      ]"
    />

    <!-- ── 发布专员指挥台 + 今日数据 ── -->
    <div class="mid-grid">
      <section class="command-section" :style="{ '--ac': '#10b981' }">
        <div class="command-header">
          <div class="command-title-group">
            <span class="agent-label">🚀 发布部</span>
            <p class="command-desc">多平台排期 · 发布计划 · 数据复盘</p>
          </div>
          <div class="command-chips">
            <button v-for="p in agentPrompts" :key="p" class="chip-btn" @click="publishChatRef?.sendQuickPrompt(p)">{{ p }}</button>
          </div>
        </div>
        <AgentChat agent-id="publisher" ref="publishChatRef" />
      </section>

      <aside class="stats-aside">
        <div class="stats-aside-title">今日数据</div>
        <div class="stats-cards">
          <div class="stat-card">
            <div class="stat-card-icon"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 2v10M6 5l3-3 3 3"/><path d="M2 13v3h14v-3"/></svg></div>
            <div class="stat-card-value">{{ publishedCount }}</div>
            <div class="stat-card-label">已发布</div>
          </div>
          <div class="stat-card">
            <div class="stat-card-icon icon-pending"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><circle cx="9" cy="9" r="7"/><path d="M9 6v4l2.5 2.5"/></svg></div>
            <div class="stat-card-value">{{ pendingCount }}</div>
            <div class="stat-card-label">待发布</div>
          </div>
        </div>
      </aside>
    </div>

    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="result-count" v-if="filtered.length">共 {{ filtered.length }} 条内容</span>
      </div>
      <div class="toolbar-right">
        <button class="btn-filter" @click="showFilter = !showFilter">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M4 8h8M6 12h4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
          筛选
          <span v-if="activeFilters" class="filter-badge">{{ activeFilters }}</span>
        </button>
        <button class="btn-batch" :disabled="selected.length === 0" @click="batchPublish">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2v8M5 7l3 3 3-3M3 12h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          批量发布{{ selected.length > 0 ? ` (${selected.length})` : '' }}
        </button>
      </div>
    </div>

    <!-- 筛选面板 -->
    <div v-if="showFilter" class="filter-panel">
      <div class="filter-group">
        <span class="filter-label">类型</span>
        <span v-for="t in typeOptions" :key="t.key" class="filter-tag"
          :class="{ active: filterType === t.key }" @click="filterType = filterType === t.key ? '' : t.key">
          {{ t.name }}
        </span>
      </div>
      <div class="filter-group">
        <span class="filter-label">平台</span>
        <span v-for="p in platformOptions" :key="p.key" class="filter-tag"
          :class="{ active: filterPlatform === p.key }" @click="filterPlatform = filterPlatform === p.key ? '' : p.key">
          {{ p.name }}
        </span>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="agentStore.flowResults.length === 0" class="empty-state">
      <div class="empty-icon">🚀</div>
      <div class="empty-title">暂无待发布内容</div>
      <div class="empty-desc">在品牌配置页点击「交给 Captain」生成内容后，这里会显示待发布的内容卡片</div>
      <button class="btn-goto-brand" @click="router.push('/agent/brand')">前往生成内容</button>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="card-grid">
      <div v-for="(item, idx) in filtered" :key="idx" class="content-card"
        :class="{ selected: selected.includes(idx) }"
        :data-type="item.type">

        <!-- 卡片头部 -->
        <div class="card-header">
          <div class="card-header-left">
            <span class="type-badge" :class="item.type">{{ typeLabel(item.type) }}</span>
            <span class="card-time">{{ cardTime(idx) }}</span>
          </div>
          <div class="card-menu" @click.stop="toggleMenu(idx)">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <circle cx="9" cy="4" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="9" r="1.2" fill="currentColor"/>
              <circle cx="9" cy="14" r="1.2" fill="currentColor"/>
            </svg>
            <div v-if="menuOpen === idx" class="dropdown-menu">
              <div class="dropdown-item" @click="editCard(idx)">编辑</div>
              <div class="dropdown-item" @click="copyContent(item)">复制文案</div>
              <div class="dropdown-item danger" @click="removeCard(idx)">删除</div>
            </div>
          </div>
        </div>

        <!-- 卡片内容 -->
        <div class="card-body" @click="toggleSelect(idx)">
          <!-- 图片 -->
          <div v-if="item.type === 'poster' && item.imageUrl" class="card-image">
            <img :src="item.imageUrl" :alt="item.topic" />
          </div>
          <!-- 视频脚本 / 文案 / 图文文字 -->
          <div class="card-text" :class="{ compact: item.type === 'poster' && item.imageUrl }" v-html="renderMd(item)" />
        </div>

        <!-- 编辑弹层 -->
        <div v-if="editingIdx === idx" class="edit-overlay" @click.self="editingIdx = -1">
          <textarea class="edit-textarea" v-model="editContent" rows="8" />
          <div class="edit-actions">
            <button class="btn-cancel-edit" @click="editingIdx = -1">取消</button>
            <button class="btn-save-edit" @click="saveEdit(idx)">保存</button>
          </div>
        </div>

        <!-- 卡片底部 -->
        <div class="card-footer">
          <div class="card-platforms">
            <span class="platform-icon" :title="item.platformName">{{ platformEmoji(item.platform) }}</span>
            <span class="platform-name">{{ item.platformName }}</span>
            <span v-if="item.topic" class="topic-chip">{{ item.topic.slice(0, 10) }}{{ item.topic.length > 10 ? '…' : '' }}</span>
          </div>
          <div class="card-footer-actions">
            <button class="btn-preview" @click="previewCard(idx)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 7s2.5-4.5 6-4.5S13 7 13 7s-2.5 4.5-6 4.5S1 7 1 7z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><circle cx="7" cy="7" r="2" stroke="currentColor" stroke-width="1.3"/></svg>
              查看
            </button>
            <button class="btn-publish" @click="publishOne(idx)">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              发布
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- 预览弹窗 -->
    <Teleport to="body">
      <div v-if="previewIdx >= 0" class="preview-overlay" @click.self="previewIdx = -1">
        <div class="preview-modal">
          <div class="preview-header">
            <div class="preview-header-left">
              <span class="type-badge" :class="filtered[previewIdx]?.type">{{ typeLabel(filtered[previewIdx]?.type || '') }}</span>
              <span class="preview-platform">{{ platformEmoji(filtered[previewIdx]?.platform || '') }} {{ filtered[previewIdx]?.platformName }}</span>
            </div>
            <button class="preview-close" @click="previewIdx = -1">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <div class="preview-body">
            <div v-if="filtered[previewIdx]?.type === 'poster' && filtered[previewIdx]?.imageUrl" class="preview-image">
              <img :src="filtered[previewIdx].imageUrl" :alt="filtered[previewIdx].topic" />
            </div>
            <div class="preview-content" v-html="renderMd(filtered[previewIdx])" />
          </div>
          <div class="preview-footer">
            <button class="btn-cancel-edit" @click="previewIdx = -1">关闭</button>
            <button class="btn-cancel-edit" @click="copyContent(filtered[previewIdx])">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.5"/><path d="M2 10V2.5A.5.5 0 012.5 2H10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              复制
            </button>
            <button class="btn-publish" @click="publishOne(previewIdx); previewIdx = -1">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
              发布
            </button>
          </div>
        </div>
      </div>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useTrendingStore } from '@/stores/agent'
import { marked } from 'marked'
import AgentChat from '@/components/agent/AgentChat.vue'
import DeptEmployeeCard from '@/components/agent/DeptEmployeeCard.vue'
import DeptBulletin from '@/components/agent/DeptBulletin.vue'

// 发布专员
const publishChatRef = ref<InstanceType<typeof AgentChat>>()
const agentPrompts = [
  '帮我制定本周发布计划',
  '这批内容应该什么时间发效果最好？',
  '各平台发布频率建议',
]

const router = useRouter()
const agentStore = useTrendingStore()

const publishedCount = computed(() => agentStore.history.filter(h => h.status === 'published').length)
const pendingCount = computed(() => agentStore.flowResults.length)

const showFilter = ref(false)
const filterType = ref('')
const filterPlatform = ref('')
const selected = ref<number[]>([])
const menuOpen = ref(-1)
const editingIdx = ref(-1)
const editContent = ref('')
const previewIdx = ref(-1)

const typeOptions = [
  { key: 'copy', name: '文案' },
  { key: 'poster', name: '图文' },
  { key: 'video_script', name: '视频脚本' },
]

const platformOptions = computed(() => {
  const seen = new Set<string>()
  const opts: { key: string; name: string }[] = []
  for (const r of agentStore.flowResults) {
    if (!seen.has(r.platform)) {
      seen.add(r.platform)
      opts.push({ key: r.platform, name: r.platformName })
    }
  }
  return opts
})

const activeFilters = computed(() => {
  let n = 0
  if (filterType.value) n++
  if (filterPlatform.value) n++
  return n || 0
})

const filtered = computed(() => {
  return agentStore.flowResults.filter(item => {
    if (filterType.value && item.type !== filterType.value) return false
    if (filterPlatform.value && item.platform !== filterPlatform.value) return false
    return true
  })
})

function typeLabel(type: string) {
  return { copy: '文案', poster: '图文', video_script: '视频' }[type] ?? type
}

const BASE_TIME = Date.now() - 30 * 60 * 1000
function cardTime(idx: number) {
  const d = new Date(BASE_TIME + idx * 5 * 60 * 1000)
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

function platformEmoji(platform: string): string {
  const map: Record<string, string> = {
    douyin: '🎵', xiaohongshu: '📕', kuaishou: '⚡', weibo: '🌐', bilibili: '📺', zhihu: '💡',
  }
  return map[platform] ?? '📱'
}

function displayContent(item: any) {
  if (item.type === 'poster') {
    try {
      const obj = JSON.parse(item.content)
      return obj.title ? `${obj.title}\n\n${obj.body ?? ''}` : item.content
    } catch { return item.content }
  }
  return item.content
}

function renderMd(item: any) {
  return marked.parse(displayContent(item) || '') as string
}

function toggleSelect(idx: number) {
  const i = selected.value.indexOf(idx)
  if (i >= 0) selected.value.splice(i, 1)
  else selected.value.push(idx)
}

function toggleMenu(idx: number) {
  menuOpen.value = menuOpen.value === idx ? -1 : idx
  document.addEventListener('click', () => { menuOpen.value = -1 }, { once: true })
}

function editCard(idx: number) {
  menuOpen.value = -1
  const item = filtered.value[idx]
  editContent.value = displayContent(item)
  editingIdx.value = idx
}

function saveEdit(idx: number) {
  const realIdx = agentStore.flowResults.indexOf(filtered.value[idx])
  if (realIdx >= 0) {
    const updated = [...agentStore.flowResults]
    updated[realIdx] = { ...updated[realIdx], content: editContent.value }
    agentStore.setFlowResults(updated)
  }
  editingIdx.value = -1
  ElMessage.success('已保存')
}

async function copyContent(item: any) {
  menuOpen.value = -1
  await navigator.clipboard.writeText(displayContent(item))
  ElMessage.success('已复制到剪贴板')
}

async function removeCard(idx: number) {
  menuOpen.value = -1
  await ElMessageBox.confirm('确定删除这条内容？', '提示', { type: 'warning' })
  const realIdx = agentStore.flowResults.indexOf(filtered.value[idx])
  if (realIdx >= 0) {
    const updated = [...agentStore.flowResults]
    updated.splice(realIdx, 1)
    agentStore.setFlowResults(updated)
    selected.value = selected.value.filter(s => s !== idx).map(s => s > idx ? s - 1 : s)
  }
}

async function publishOne(idx: number) {
  const item = filtered.value[idx]
  try {
    ElMessage.info(`正在发布到「${item.platformName}」...`)
    let title = item.topic || '新内容'
    let content = displayContent(item)
    if (item.type === 'poster') {
      try {
        const obj = JSON.parse(item.content)
        title = obj.title || title
        content = obj.body || content
      } catch {}
    }
    // 收集图片（poster 类型有 imageUrl）
    const images: string[] = []
    if (item.imageUrl) images.push(item.imageUrl)

    const res = await fetch('/api/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ platform: item.platform, title, content, images }),
    })
    const data = await res.json()
    if (data.status === 'ok') {
      ElMessage.success(`「${item.platformName}」发布成功！🎉`)
    } else if (data.status === 'pending') {
      ElMessage.warning(data.message)
    } else {
      ElMessage.error(`发布失败：${data.message || '未知错误'}`)
    }
  } catch (e: any) {
    ElMessage.error(`发布失败：${e.message}`)
  }
}

function previewCard(idx: number) {
  previewIdx.value = idx
}

async function batchPublish() {
  if (selected.value.length === 0) return
  for (const idx of selected.value) {
    await publishOne(idx)
  }
  selected.value = []
}
</script>

<style scoped>
.publish-page {
  padding: 0 0 40px;
  min-height: 100%;
  max-width: 1200px;
}

/* mid-grid 同 Dashboard Captain */
.mid-grid { display: grid; grid-template-columns: 1fr 240px; gap: 14px; margin-bottom: 16px; }
.command-section {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #10b981); border-radius: 14px;
  padding: 18px 18px 0; box-shadow: 0 2px 12px rgba(0,0,0,0.05); overflow: hidden;
}
.command-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
.agent-label { display: block; font-size: 13px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; margin-bottom: 3px; }
.command-desc { font-size: 11px; color: rgba(29,29,31,0.4); margin: 0; }
.command-chips { display: flex; gap: 5px; flex-wrap: wrap; align-items: flex-start; }
.chip-btn { background: #f5f5f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 4px 10px; font-size: 11px; font-weight: 500; color: rgba(29,29,31,0.6); cursor: pointer; white-space: nowrap; font-family: inherit; transition: all 0.15s; }
.chip-btn:hover { border-color: var(--ac); color: var(--ac); background: color-mix(in srgb, var(--ac) 6%, white); }
.command-section :deep(.agent-bar) { border: none !important; border-radius: 0 !important; box-shadow: none !important; background: transparent !important; margin-bottom: 0 !important; border-top: 1px solid rgba(0,0,0,0.06) !important; }

.stats-aside { background: #ffffff; border: 1px solid rgba(0,0,0,0.07); border-radius: 14px; padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05); }
.stats-aside-title { font-size: 12px; font-weight: 700; color: #1d1d1f; margin-bottom: 12px; }
.stats-cards { display: flex; flex-direction: column; gap: 8px; }
.stat-card { display: flex; align-items: center; gap: 10px; padding: 11px 12px; background: #f5f5f7; border-radius: 10px; }
.stat-card-icon { width: 32px; height: 32px; border-radius: 8px; background: rgba(16,185,129,0.08); display: flex; align-items: center; justify-content: center; color: #10b981; flex-shrink: 0; }
.icon-pending { background: rgba(245,158,11,0.08) !important; color: #f59e0b !important; }
.stat-card-value { font-size: 22px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.04em; line-height: 1; }
.stat-card-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: rgba(29,29,31,0.35); }

/* ── 工具栏 ── */
.toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}
.toolbar-right { display: flex; gap: 10px; align-items: center; }
.result-count { font-size: 13px; color: #94a3b8; }

.btn-filter {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 16px; border-radius: 10px;
  background: #ffffff; color: #1A1A1A;
  border: 1px solid #E8E8E8; font-size: 13px; cursor: pointer;
  position: relative; transition: background .15s; font-family: inherit;
}
.btn-filter:hover { background: #F8F8F6; }
.filter-badge {
  background: #0071e3; color: #fff; font-size: 11px;
  border-radius: 999px; padding: 1px 6px; margin-left: 2px;
}

.btn-batch {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 18px; border-radius: 10px;
  background: #0071e3; color: #fff;
  border: none; font-size: 13px; cursor: pointer; transition: background .15s; font-family: inherit;
}
.btn-batch:hover:not(:disabled) { background: #0066cc; }
.btn-batch:disabled { opacity: .5; cursor: not-allowed; }

/* ── 筛选面板 ── */
.filter-panel {
  background: #ffffff; border: 1px solid #E8E8E8;
  border-radius: 12px; padding: 14px 18px;
  margin-bottom: 16px; display: flex; gap: 24px; flex-wrap: wrap;
}
.filter-group { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.filter-label { font-size: 12px; color: #999999; white-space: nowrap; }
.filter-tag {
  padding: 4px 12px; border-radius: 999px; font-size: 12px;
  background: #F8F8F6; color: #666666; border: 1px solid #E8E8E8;
  cursor: pointer; transition: all .15s;
}
.filter-tag.active { background: #0071e3; color: #fff; border-color: #0071e3; }

/* ── 空状态 ── */
.empty-state {
  text-align: center; padding: 80px 20px;
}
.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 18px; font-weight: 600; color: #1A1A1A; margin-bottom: 8px; }
.empty-desc { font-size: 14px; color: #666666; margin-bottom: 24px; max-width: 360px; margin-left: auto; margin-right: auto; }
.btn-goto-brand {
  padding: 10px 24px; background: #0071e3; color: #fff;
  border: none; border-radius: 10px; font-size: 14px; cursor: pointer; font-family: inherit;
}
.btn-goto-brand:hover { background: #0066cc; }

/* ── 卡片网格 ── */
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
  align-items: start;
}

.content-card {
  background: #ffffff;
  border-radius: 14px;
  overflow: hidden;
  border: 1px solid #E8E8E8;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform .15s, box-shadow .15s;
  position: relative;
  cursor: default;
}
.content-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.09); }
.content-card.selected { border-color: #0071e3; box-shadow: 0 0 0 3px rgba(0,113,227,.1); }

/* 卡片顶部彩色条 */
.content-card::before {
  content: '';
  display: block;
  height: 3px;
  background: var(--card-accent, #0071e3);
}
.content-card[data-type='copy']         { --card-accent: #f59e0b; }
.content-card[data-type='poster']       { --card-accent: #ec4899; }
.content-card[data-type='video_script'] { --card-accent: #ef4444; }

/* 卡片头部 */
.card-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px 8px;
}
.card-header-left { display: flex; align-items: center; gap: 8px; }

.type-badge {
  font-size: 11px; font-weight: 700; padding: 2px 8px;
  border-radius: 6px; letter-spacing: .3px;
}
.type-badge.copy         { background: rgba(245,158,11,0.1);  color: #d97706; }
.type-badge.poster       { background: rgba(236,72,153,0.1);  color: #db2777; }
.type-badge.video_script { background: rgba(239,68,68,0.1);   color: #dc2626; }

.card-time { font-size: 11px; color: #999999; }

.card-menu {
  position: relative; color: #999999; cursor: pointer; padding: 4px;
  border-radius: 6px; transition: background .15s;
}
.card-menu:hover { background: #F8F8F6; color: #666666; }

.dropdown-menu {
  position: absolute; right: 0; top: 28px; z-index: 10;
  background: #ffffff; border: 1px solid #E8E8E8;
  border-radius: 10px; padding: 4px; min-width: 110px;
  box-shadow: 0 8px 24px rgba(0,0,0,.1);
}
.dropdown-item {
  padding: 8px 14px; font-size: 12px; color: #1A1A1A;
  border-radius: 7px; cursor: pointer; transition: background .1s;
}
.dropdown-item:hover { background: #F8F8F6; }
.dropdown-item.danger { color: #ef4444; }
.dropdown-item.danger:hover { background: rgba(239,68,68,.06); }

/* 卡片内容 */
.card-body {
  padding: 0 14px; cursor: pointer;
}
.card-image {
  border-radius: 10px; overflow: hidden; margin-bottom: 10px;
  background: #F8F8F6; aspect-ratio: 4/3;
}
.card-image img { width: 100%; height: 100%; object-fit: cover; display: block; }

.card-text {
  font-size: 13px; color: #333333; line-height: 1.7;
  word-break: break-word;
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical;
  overflow: hidden; padding-bottom: 12px;
}
.card-text :deep(p) { margin: 0 0 6px; }
.card-text :deep(strong) { color: #1A1A1A; }
.card-text :deep(blockquote) { margin: 0; padding-left: 10px; border-left: 2px solid #E8E8E8; color: #999999; }
.card-text.compact { -webkit-line-clamp: 2; }

/* 编辑弹层 */
.edit-overlay {
  position: absolute; inset: 0; background: rgba(255,255,255,.96);
  border-radius: 14px; padding: 14px; z-index: 20;
  display: flex; flex-direction: column; gap: 10px;
}
.edit-textarea {
  flex: 1; background: #F8F8F6; color: #1A1A1A; border: 1px solid #E8E8E8;
  border-radius: 8px; padding: 10px 12px; font-size: 13px; line-height: 1.7;
  resize: none; outline: none; font-family: inherit;
}
.edit-textarea:focus { border-color: #0071e3; }
.edit-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-cancel-edit {
  padding: 7px 16px; border-radius: 8px; background: #F8F8F6;
  color: #666666; border: 1px solid #E8E8E8; font-size: 13px; cursor: pointer; font-family: inherit;
}
.btn-save-edit {
  padding: 7px 16px; border-radius: 8px; background: #0071e3;
  color: #fff; border: none; font-size: 13px; cursor: pointer; font-family: inherit;
}

/* 卡片底部 */
.card-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px 12px; border-top: 1px solid #F0F0F0; margin-top: 4px;
}
.card-platforms { display: flex; align-items: center; gap: 6px; }
.platform-icon { font-size: 14px; }
.platform-name { font-size: 12px; color: #999999; }
.topic-chip {
  font-size: 11px; color: #999999; background: #F8F8F6;
  border-radius: 999px; padding: 2px 8px; border: 1px solid #E8E8E8;
}

.btn-publish {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 14px; border-radius: 8px;
  background: #0071e3; color: #fff;
  border: none; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit;
  transition: background .15s;
}
.btn-publish:hover { background: #0066cc; }

.card-footer-actions { display: flex; gap: 6px; align-items: center; }

.btn-preview {
  display: flex; align-items: center; gap: 5px;
  padding: 6px 12px; border-radius: 8px;
  background: transparent; color: #666666;
  border: 1px solid #E8E8E8; font-size: 12px; font-weight: 500; cursor: pointer; font-family: inherit;
  transition: all .15s;
}
.btn-preview:hover { background: #F8F8F6; color: #1A1A1A; }

/* 预览弹窗 */
.preview-overlay {
  position: fixed; inset: 0; z-index: 999;
  background: rgba(0,0,0,0.4); backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  padding: 24px;
}
.preview-modal {
  background: #ffffff; border: 1px solid #E8E8E8;
  border-radius: 16px; width: 100%; max-width: 600px;
  max-height: 80vh; display: flex; flex-direction: column;
  box-shadow: 0 24px 48px rgba(0,0,0,0.15);
}
.preview-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; border-bottom: 1px solid #F0F0F0;
}
.preview-header-left { display: flex; align-items: center; gap: 10px; }
.preview-platform { font-size: 12px; color: #999999; }
.preview-close {
  background: none; border: none; padding: 6px; cursor: pointer;
  color: #999999; border-radius: 6px; display: flex; align-items: center;
  transition: background .15s;
}
.preview-close:hover { background: #F8F8F6; color: #1A1A1A; }
.preview-body {
  flex: 1; overflow-y: auto; padding: 18px;
}
.preview-image {
  border-radius: 10px; overflow: hidden; margin-bottom: 16px;
  background: #F8F8F6;
}
.preview-image img { width: 100%; display: block; }
.preview-content {
  font-size: 14px; color: #333333; line-height: 1.8;
  word-break: break-word;
}
.preview-content :deep(p) { margin: 0 0 10px; }
.preview-content :deep(strong) { color: #1A1A1A; }
.preview-content :deep(blockquote) { margin: 0 0 10px; padding-left: 12px; border-left: 3px solid #E8E8E8; color: #999999; }
.preview-content :deep(code) { background: #1e293b; padding: 1px 5px; border-radius: 4px; font-size: 13px; }
.preview-content :deep(ul), .preview-content :deep(ol) { padding-left: 20px; margin: 0 0 10px; }
.preview-content :deep(h1), .preview-content :deep(h2), .preview-content :deep(h3) { color: #f1f5f9; margin: 0 0 8px; }
.preview-footer {
  display: flex; gap: 10px; justify-content: flex-end;
  padding: 14px 20px; border-top: 1px solid #1e293b;
}
</style>
