<template>
  <div class="content-dept">

    <!-- ── 顶部：部门标题 ── -->
    <div class="dept-header">
      <div class="dept-header-left">
        <div class="dept-icon-badge">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="3" y="2" width="14" height="16" rx="2"/>
            <path d="M6.5 7h7M6.5 10h7M6.5 13h5"/>
          </svg>
        </div>
        <div>
          <h2 class="dept-title">内容部</h2>
          <div class="dept-subtitle">
            <span v-if="brandStore.isConfigured" class="brand-pill">
              <span class="brand-pill-dot"></span>{{ brandStore.brand.name }}
            </span>
            <span class="task-status">
              {{ copywritingResults.length + videoResults.length }} 条内容已生成
            </span>
          </div>
        </div>
      </div>
      <div class="dept-header-right">
        <router-link to="/agent/copywriting" class="dept-action-btn primary">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <path d="M1 11L3.5 5.5l5-4 2.5 2.5-4 5L1 11zM7.5 4.5l1 1"/>
          </svg>
          文案生成
        </router-link>
        <router-link to="/agent/video" class="dept-action-btn">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="1" y="3" width="8" height="7" rx="1.5"/>
            <path d="M9 5.5l3-1.5v5l-3-1.5V5.5z"/>
          </svg>
          视频脚本
        </router-link>
      </div>
    </div>

    <!-- ── 品牌未配置引导 ── -->
    <div v-if="!brandStore.isConfigured" class="brand-guide">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b45309" stroke-width="1.5" stroke-linecap="round">
        <circle cx="7" cy="7" r="6"/><path d="M7 4.5v3.5M7 9.5v.5"/>
      </svg>
      <span>建议先<router-link to="/agent/brand" class="guide-link">配置品牌信息</router-link>，内容生产将更精准符合品牌调性</span>
    </div>

    <!-- ── 主区 + Agent小窗 ── -->
    <div class="dept-main-grid">

      <!-- 左侧主区（约70%） -->
      <div class="dept-main">

        <!-- 文案工作台 -->
        <div class="work-panel">
          <div class="panel-hd">
            <div class="panel-hd-left">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="2" y="1" width="10" height="12" rx="1.5"/>
                <path d="M4.5 4.5h5M4.5 7h5M4.5 9.5h3.5"/>
              </svg>
              <span class="panel-title">文案工作台</span>
              <span class="panel-count">{{ copywritingResults.length }} 条</span>
            </div>
            <router-link to="/agent/copywriting" class="panel-link">前往生成 →</router-link>
          </div>

          <!-- 文案列表 -->
          <div v-if="copywritingResults.length > 0" class="result-table">
            <div class="table-head">
              <span>话题</span>
              <span>平台</span>
              <span>内容预览</span>
              <span>操作</span>
            </div>
            <div v-for="(item, i) in copywritingResults.slice(0, 8)" :key="i" class="table-row">
              <span class="td-topic">{{ item.topic || '未命名话题' }}</span>
              <span class="td-platform">
                <span class="platform-tag">{{ getPlatformLabel(item.platform) }}</span>
              </span>
              <span class="td-preview">{{ item.content?.slice(0, 40) }}…</span>
              <span class="td-actions">
                <button class="row-btn" @click="copyText(item.content)" title="复制">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><path d="M2 8.5V1.5h7"/>
                  </svg>
                </button>
                <router-link to="/agent/copywriting" class="row-btn" title="查看">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                    <path d="M1 6S3 2 6 2s5 4 5 4-2 4-5 4-5-4-5-4z"/><circle cx="6" cy="6" r="1.5"/>
                  </svg>
                </router-link>
              </span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="panel-empty">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" style="opacity:.25">
              <rect x="5" y="4" width="22" height="24" rx="3"/>
              <path d="M10 11h12M10 16h12M10 21h8"/>
            </svg>
            <div>暂无文案记录</div>
            <router-link to="/agent/copywriting" class="panel-link" style="margin-top:4px">去生成文案 →</router-link>
          </div>
        </div>

        <!-- 视频脚本台 -->
        <div class="work-panel" style="margin-top:14px">
          <div class="panel-hd">
            <div class="panel-hd-left">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="1" y="3" width="9" height="8" rx="1.5"/>
                <path d="M10 6l3-2v6l-3-2V6z"/>
              </svg>
              <span class="panel-title">视频脚本台</span>
              <span class="panel-count">{{ videoResults.length }} 条</span>
            </div>
            <router-link to="/agent/video" class="panel-link">前往生成 →</router-link>
          </div>

          <!-- 脚本列表 -->
          <div v-if="videoResults.length > 0" class="result-table">
            <div class="table-head">
              <span>话题</span>
              <span>时长</span>
              <span>脚本预览</span>
              <span>操作</span>
            </div>
            <div v-for="(item, i) in videoResults.slice(0, 5)" :key="i" class="table-row">
              <span class="td-topic">{{ item.topic || '未命名话题' }}</span>
              <span class="td-platform">
                <span class="platform-tag video-tag">{{ item.duration || '短视频' }}</span>
              </span>
              <span class="td-preview">{{ item.content?.slice(0, 40) }}…</span>
              <span class="td-actions">
                <button class="row-btn" @click="copyText(item.content)" title="复制">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round">
                    <rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><path d="M2 8.5V1.5h7"/>
                  </svg>
                </button>
              </span>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-else class="panel-empty">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" style="opacity:.25">
              <rect x="3" y="7" width="20" height="18" rx="3"/>
              <path d="M23 13l6-3v12l-6-3V13z"/>
            </svg>
            <div>暂无视频脚本</div>
            <router-link to="/agent/video" class="panel-link" style="margin-top:4px">去生成脚本 →</router-link>
          </div>
        </div>
      </div>

      <!-- 右侧：文案专员Agent小窗 -->
      <aside class="agent-panel" :class="{ collapsed: agentCollapsed }">
        <div class="agent-panel-hd" @click="agentCollapsed = !agentCollapsed">
          <div class="agent-panel-id">
            <span class="agent-emoji">✍️</span>
            <span class="agent-name">文案专员</span>
            <span class="agent-online-dot"></span>
          </div>
          <button class="collapse-btn" :title="agentCollapsed ? '展开' : '收起'">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path :d="agentCollapsed ? 'M2 4l4 4 4-4' : 'M2 8l4-4 4 4'"/>
            </svg>
          </button>
        </div>
        <div v-show="!agentCollapsed" class="agent-panel-body">
          <AgentChat agent-id="copywriter" />
        </div>
      </aside>
    </div>

    <!-- 复制成功提示 -->
    <div v-if="copySuccess" class="copy-toast">
      <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
        <path d="M2 6.5l3 3 6-6"/>
      </svg>
      已复制到剪贴板
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useTrendingStore } from '@/stores/agent'
import { useBrandStore } from '@/stores/brand'
import AgentChat from '@/components/agent/AgentChat.vue'

const agentStore = useTrendingStore()
const brandStore = useBrandStore()

// 右侧Agent小窗收起状态
const agentCollapsed = ref(false)
// 复制成功提示
const copySuccess = ref(false)

const copywritingResults = computed(() => agentStore.copywritingResults)
const videoResults = computed(() => agentStore.videoResults)

// 平台名称映射
const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手',
  weibo: '微博', bilibili: 'B站', zhihu: '知乎', wechat: '微信',
}
function getPlatformLabel(p: string) {
  return PLATFORM_LABELS[p] || p || '通用'
}

// 复制文本到剪贴板
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    copySuccess.value = true
    setTimeout(() => { copySuccess.value = false }, 2000)
  } catch {
    copySuccess.value = false
  }
}
</script>

<style scoped>
.content-dept {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 40px;
  position: relative;
}

/* 顶部部门标题栏 */
.dept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid #f59e0b;
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.dept-header-left { display: flex; align-items: center; gap: 12px; }
.dept-icon-badge {
  width: 40px; height: 40px; border-radius: 11px;
  background: rgba(245,158,11,0.1);
  display: flex; align-items: center; justify-content: center;
  color: #f59e0b; flex-shrink: 0;
}
.dept-title { font-size: 17px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.03em; margin: 0 0 4px; }
.dept-subtitle { display: flex; align-items: center; gap: 8px; }
.brand-pill {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #f59e0b;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  padding: 2px 9px; border-radius: 20px;
}
.brand-pill-dot { width: 5px; height: 5px; border-radius: 50%; background: #f59e0b; }
.task-status { font-size: 11px; color: rgba(29,29,31,0.4); }

.dept-header-right { display: flex; gap: 8px; flex-shrink: 0; }
.dept-action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 10px;
  background: #f5f5f7; font-size: 12px; font-weight: 600;
  color: rgba(29,29,31,0.7); cursor: pointer; text-decoration: none;
  transition: all 0.15s;
}
.dept-action-btn:hover { background: #ebebed; color: #1d1d1f; }
.dept-action-btn.primary { background: #f59e0b; color: #fff; border-color: transparent; }
.dept-action-btn.primary:hover { background: #d97706; }

/* 品牌未配置提示 */
.brand-guide {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #b45309;
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.18);
  padding: 9px 14px; border-radius: 9px;
}
.guide-link { color: #0071e3; font-weight: 600; text-decoration: none; }
.guide-link:hover { opacity: 0.8; }

/* 主区网格 */
.dept-main-grid {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 14px;
  align-items: start;
}
.dept-main { display: flex; flex-direction: column; }

/* 工作面板 */
.work-panel {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  overflow: hidden;
}
.panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}
.panel-hd-left { display: flex; align-items: center; gap: 7px; color: rgba(29,29,31,0.7); }
.panel-title { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.panel-count {
  font-size: 10.5px; font-weight: 700;
  background: rgba(245,158,11,0.1); color: #f59e0b;
  padding: 2px 7px; border-radius: 10px;
}
.panel-link { font-size: 11.5px; font-weight: 600; color: #0071e3; text-decoration: none; }
.panel-link:hover { opacity: 0.75; }

/* 结果表格 */
.result-table { padding: 0 4px 8px; }
.table-head {
  display: grid;
  grid-template-columns: 140px 80px 1fr 60px;
  gap: 0;
  padding: 7px 12px;
  font-size: 10px; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.07em;
  color: rgba(29,29,31,0.35);
  border-bottom: 1px solid rgba(0,0,0,0.05);
}
.table-row {
  display: grid;
  grid-template-columns: 140px 80px 1fr 60px;
  gap: 0;
  padding: 9px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.04);
  align-items: center;
  transition: background 0.1s;
}
.table-row:last-child { border-bottom: none; }
.table-row:hover { background: #f9f9fb; }

.td-topic { font-size: 12px; font-weight: 600; color: #1d1d1f; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
.td-platform { }
.platform-tag {
  font-size: 10px; font-weight: 700; color: #f59e0b;
  background: rgba(245,158,11,0.1); padding: 2px 7px; border-radius: 6px;
}
.video-tag { color: #ef4444; background: rgba(239,68,68,0.1); }
.td-preview { font-size: 12px; color: rgba(29,29,31,0.45); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; padding-right: 8px; }
.td-actions { display: flex; align-items: center; gap: 4px; }
.row-btn {
  width: 26px; height: 26px; border-radius: 7px;
  border: 1px solid rgba(0,0,0,0.08); background: #f5f5f7;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; color: rgba(29,29,31,0.5);
  transition: all 0.15s; text-decoration: none;
}
.row-btn:hover { background: #ebebed; color: #1d1d1f; border-color: rgba(0,0,0,0.12); }

/* 空状态 */
.panel-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 28px 0; gap: 6px;
  font-size: 12px; color: rgba(29,29,31,0.35); text-align: center;
}

/* Agent 右侧小窗 */
.agent-panel {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  overflow: hidden;
  position: sticky;
  top: 0;
  transition: all 0.2s;
}
.agent-panel.collapsed { }

.agent-panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer;
  user-select: none;
  background: rgba(245,158,11,0.03);
}
.agent-panel-id { display: flex; align-items: center; gap: 7px; }
.agent-emoji { font-size: 16px; }
.agent-name { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.agent-online-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399;
  animation: aipulse 2.5s ease-in-out infinite;
}
.collapse-btn { background: none; border: none; padding: 4px; cursor: pointer; color: rgba(29,29,31,0.4); display: flex; align-items: center; }

.agent-panel-body { height: 380px; display: flex; flex-direction: column; }
.agent-panel-body :deep(.agent-chat-wrap) { border: none; border-radius: 0; box-shadow: none; height: 100%; }

/* 复制成功 toast */
.copy-toast {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; align-items: center; gap: 7px;
  padding: 9px 18px; border-radius: 999px;
  background: rgba(22,163,74,0.92); color: #fff;
  font-size: 13px; font-weight: 600;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  z-index: 100; pointer-events: none;
  animation: toastIn 0.2s ease both;
}
@keyframes toastIn { from { opacity:0; transform: translateX(-50%) translateY(8px); } to { opacity:1; transform: translateX(-50%) translateY(0); } }
@keyframes aipulse { 0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); } 50% { box-shadow: 0 0 0 4px rgba(52,211,153,0.06); } }

/* 响应式 */
@media (max-width: 900px) {
  .dept-main-grid { grid-template-columns: 1fr; }
  .agent-panel { position: relative; }
  .table-head, .table-row { grid-template-columns: 1fr 70px 1fr 50px; }
  .dept-header { flex-direction: column; align-items: flex-start; }
}
@media (max-width: 600px) {
  .table-head, .table-row { grid-template-columns: 1fr 1fr; }
  .td-preview, .td-platform { display: none; }
}
</style>
