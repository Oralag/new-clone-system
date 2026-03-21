<template>
  <div class="creative-dept">

    <!-- ── 顶部：部门标题 ── -->
    <div class="dept-header">
      <div class="dept-header-left">
        <div class="dept-icon-badge">
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <circle cx="10" cy="10" r="4"/>
            <path d="M10 2v3M10 15v3M2 10h3M15 10h3M4.22 4.22l2.12 2.12M13.66 13.66l2.12 2.12M4.22 15.78l2.12-2.12M13.66 6.34l2.12-2.12"/>
          </svg>
        </div>
        <div>
          <h2 class="dept-title">创意部</h2>
          <div class="dept-subtitle">
            <span v-if="brandStore.isConfigured" class="brand-pill">
              <span class="brand-pill-dot"></span>{{ brandStore.brand.name }}
            </span>
            <span class="task-status">
              {{ posterResults.length }} 张海报已生成
            </span>
          </div>
        </div>
      </div>
      <div class="dept-header-right">
        <router-link to="/agent/poster" class="dept-action-btn primary">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="1" y="1" width="11" height="11" rx="2"/>
            <path d="M4 4h1.5M4 6.5h5M4 9h3.5"/>
            <rect x="7" y="3" width="3" height="2.5" rx=".5"/>
          </svg>
          生成海报
        </router-link>
        <button class="dept-action-btn" @click="$router.push('/agent/meeting')">
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
            <rect x="1" y="2" width="11" height="8" rx="1.5"/>
            <path d="M4.5 12h4M6.5 10v2"/>
            <circle cx="3.5" cy="6" r="1" fill="currentColor" opacity=".6"/>
            <circle cx="6.5" cy="6" r="1" fill="currentColor" opacity=".6"/>
            <circle cx="9.5" cy="6" r="1" fill="currentColor" opacity=".6"/>
          </svg>
          发起会议
        </button>
      </div>
    </div>

    <!-- ── 品牌未配置引导 ── -->
    <div v-if="!brandStore.isConfigured" class="brand-guide">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#b45309" stroke-width="1.5" stroke-linecap="round">
        <circle cx="7" cy="7" r="6"/><path d="M7 4.5v3.5M7 9.5v.5"/>
      </svg>
      <span>建议先<router-link to="/agent/brand" class="guide-link">配置品牌信息</router-link>，创意设计将更符合品牌视觉风格</span>
    </div>

    <!-- ── 主区 + Agent小窗 ── -->
    <div class="dept-main-grid">

      <!-- 左侧：海报任务板 -->
      <div class="dept-main">
        <div class="work-panel">
          <div class="panel-hd">
            <div class="panel-hd-left">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                <rect x="1" y="1" width="12" height="12" rx="2"/>
                <rect x="2.5" y="2.5" width="4" height="4" rx=".8"/>
                <path d="M8.5 4h3M8.5 6.5h3M2.5 9h9M2.5 11h6"/>
              </svg>
              <span class="panel-title">海报任务板</span>
              <span class="panel-count">{{ posterResults.length }} 项</span>
            </div>
            <router-link to="/agent/poster" class="panel-link">前往生成 →</router-link>
          </div>

          <!-- 空状态：无海报时引导去会议室发起任务 -->
          <div v-if="posterResults.length === 0" class="poster-empty">
            <div class="empty-icon-wrap">
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" style="opacity:.2">
                <rect x="6" y="6" width="36" height="36" rx="6"/>
                <rect x="10" y="10" width="14" height="14" rx="2"/>
                <path d="M28 14h10M28 20h10M10 32h28M10 38h20"/>
              </svg>
            </div>
            <div class="empty-title">暂无海报任务</div>
            <div class="empty-desc">在会议室发起创意会议，设计专员将根据议题生成配套视觉内容</div>
            <div class="empty-actions">
              <button class="empty-btn primary" @click="$router.push('/agent/meeting')">
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
                  <rect x="1" y="2" width="11" height="8" rx="1.5"/>
                  <path d="M4.5 12h4M6.5 10v2"/>
                </svg>
                去会议室发起任务
              </button>
              <router-link to="/agent/poster" class="empty-btn">
                直接生成海报 →
              </router-link>
            </div>
          </div>

          <!-- 海报卡片网格 -->
          <div v-else class="poster-grid">
            <div
              v-for="(item, i) in posterResults"
              :key="i"
              class="poster-card"
            >
              <!-- 图片缩略图 -->
              <div class="poster-thumb">
                <img v-if="item.imageUrl" :src="item.imageUrl" :alt="item.topic" class="poster-img" />
                <div v-else class="poster-placeholder">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" style="opacity:.3">
                    <rect x="3" y="3" width="18" height="18" rx="3"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <path d="M21 15l-5-5L5 21"/>
                  </svg>
                </div>
                <!-- 生成状态徽标 -->
                <div v-if="item.imageStatus" class="poster-status-badge" :class="'status-' + item.imageStatus">
                  <span v-if="item.imageStatus === 'processing'">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
                      <circle cx="5" cy="5" r="3.5" stroke-opacity=".3"/><path d="M5 1.5A3.5 3.5 0 018.5 5" stroke-linecap="round"/>
                    </svg>
                    生成中
                  </span>
                  <span v-else-if="item.imageStatus === 'done'">✓ 完成</span>
                  <span v-else-if="item.imageStatus === 'failed'">✗ 失败</span>
                </div>
              </div>
              <!-- 卡片信息 -->
              <div class="poster-info">
                <div class="poster-topic">{{ item.topic || '未命名话题' }}</div>
                <div class="poster-meta">
                  <span class="platform-tag">{{ getPlatformLabel(item.platform) }}</span>
                </div>
                <div class="poster-preview">{{ item.content?.slice(0, 50) }}…</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：设计专员Agent小窗 -->
      <aside class="agent-panel" :class="{ collapsed: agentCollapsed }">
        <div class="agent-panel-hd" @click="agentCollapsed = !agentCollapsed">
          <div class="agent-panel-id">
            <span class="agent-emoji">🎨</span>
            <span class="agent-name">设计专员</span>
            <span class="agent-online-dot"></span>
          </div>
          <button class="collapse-btn" :title="agentCollapsed ? '展开' : '收起'">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
              <path :d="agentCollapsed ? 'M2 4l4 4 4-4' : 'M2 8l4-4 4 4'"/>
            </svg>
          </button>
        </div>
        <div v-show="!agentCollapsed" class="agent-panel-body">
          <AgentChat agent-id="poster" />
        </div>
      </aside>
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

// Agent小窗收起状态
const agentCollapsed = ref(false)

// 海报类型的 flowResults
const posterResults = computed(() =>
  agentStore.flowResults.filter(r => r.type === 'poster')
)

// 平台名称映射
const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手',
  weibo: '微博', bilibili: 'B站', zhihu: '知乎', wechat: '微信',
}
function getPlatformLabel(p: string) {
  return PLATFORM_LABELS[p] || p || '通用'
}
</script>

<style scoped>
.creative-dept {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 40px;
}

/* 顶部部门标题栏 */
.dept-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid #ec4899;
  border-radius: 14px;
  padding: 16px 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.dept-header-left { display: flex; align-items: center; gap: 12px; }
.dept-icon-badge {
  width: 40px; height: 40px; border-radius: 11px;
  background: rgba(236,72,153,0.1);
  display: flex; align-items: center; justify-content: center;
  color: #ec4899; flex-shrink: 0;
}
.dept-title { font-size: 17px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.03em; margin: 0 0 4px; }
.dept-subtitle { display: flex; align-items: center; gap: 8px; }
.brand-pill {
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: #ec4899;
  background: rgba(236,72,153,0.08); border: 1px solid rgba(236,72,153,0.2);
  padding: 2px 9px; border-radius: 20px;
}
.brand-pill-dot { width: 5px; height: 5px; border-radius: 50%; background: #ec4899; }
.task-status { font-size: 11px; color: rgba(29,29,31,0.4); }

.dept-header-right { display: flex; gap: 8px; flex-shrink: 0; }
.dept-action-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 14px;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 10px;
  background: #f5f5f7; font-size: 12px; font-weight: 600;
  color: rgba(29,29,31,0.7); cursor: pointer; text-decoration: none; font-family: inherit;
  transition: all 0.15s;
}
.dept-action-btn:hover { background: #ebebed; color: #1d1d1f; }
.dept-action-btn.primary { background: #ec4899; color: #fff; border-color: transparent; }
.dept-action-btn.primary:hover { background: #db2777; }

/* 品牌未配置提示 */
.brand-guide {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #b45309;
  background: rgba(245,158,11,0.06);
  border: 1px solid rgba(245,158,11,0.18);
  padding: 9px 14px; border-radius: 9px;
}
.guide-link { color: #0071e3; font-weight: 600; text-decoration: none; }

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
  background: rgba(236,72,153,0.1); color: #ec4899;
  padding: 2px 7px; border-radius: 10px;
}
.panel-link { font-size: 11.5px; font-weight: 600; color: #0071e3; text-decoration: none; }
.panel-link:hover { opacity: 0.75; }

/* 空状态 */
.poster-empty {
  display: flex; flex-direction: column; align-items: center;
  padding: 48px 24px; gap: 10px; text-align: center;
}
.empty-icon-wrap { margin-bottom: 4px; }
.empty-title { font-size: 15px; font-weight: 700; color: #1d1d1f; letter-spacing: -0.02em; }
.empty-desc { font-size: 12.5px; color: rgba(29,29,31,0.4); max-width: 320px; line-height: 1.6; }
.empty-actions { display: flex; gap: 8px; margin-top: 4px; flex-wrap: wrap; justify-content: center; }
.empty-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 18px; border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.1); background: #f5f5f7;
  font-size: 12.5px; font-weight: 600; color: rgba(29,29,31,0.7);
  cursor: pointer; font-family: inherit; text-decoration: none;
  transition: all 0.15s;
}
.empty-btn:hover { background: #ebebed; color: #1d1d1f; }
.empty-btn.primary { background: #ec4899; color: #fff; border-color: transparent; }
.empty-btn.primary:hover { background: #db2777; }

/* 海报卡片网格 */
.poster-grid {
  padding: 14px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.poster-card {
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.06);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.15s, box-shadow 0.15s;
}
.poster-card:hover { transform: translateY(-2px); box-shadow: 0 5px 16px rgba(0,0,0,0.09); }

.poster-thumb {
  aspect-ratio: 4/3;
  background: #ebebed;
  position: relative;
  display: flex; align-items: center; justify-content: center;
}
.poster-img { width: 100%; height: 100%; object-fit: cover; }
.poster-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(236,72,153,0.06), rgba(99,102,241,0.06));
}

.poster-status-badge {
  position: absolute; top: 8px; right: 8px;
  display: flex; align-items: center; gap: 4px;
  font-size: 10px; font-weight: 700;
  padding: 3px 8px; border-radius: 20px;
}
.status-processing {
  background: rgba(245,158,11,0.85); color: #fff;
  animation: statusPulse 1.5s ease-in-out infinite;
}
.status-done { background: rgba(16,185,129,0.9); color: #fff; }
.status-failed { background: rgba(239,68,68,0.85); color: #fff; }
@keyframes statusPulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }

.poster-info { padding: 10px 12px 12px; }
.poster-topic { font-size: 12.5px; font-weight: 700; color: #1d1d1f; margin-bottom: 5px; line-height: 1.3; }
.poster-meta { margin-bottom: 5px; }
.platform-tag {
  font-size: 10px; font-weight: 700; color: #ec4899;
  background: rgba(236,72,153,0.1); padding: 2px 7px; border-radius: 6px;
}
.poster-preview { font-size: 11px; color: rgba(29,29,31,0.4); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

/* Agent 右侧小窗 */
.agent-panel {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 14px;
  overflow: hidden;
  position: sticky;
  top: 0;
}
.agent-panel-hd {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  cursor: pointer; user-select: none;
  background: rgba(236,72,153,0.03);
}
.agent-panel-id { display: flex; align-items: center; gap: 7px; }
.agent-emoji { font-size: 16px; }
.agent-name { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.agent-online-dot { width: 6px; height: 6px; border-radius: 50%; background: #34d399; animation: aipulse 2.5s ease-in-out infinite; }
.collapse-btn { background: none; border: none; padding: 4px; cursor: pointer; color: rgba(29,29,31,0.4); display: flex; align-items: center; }

.agent-panel-body { height: 380px; display: flex; flex-direction: column; }
.agent-panel-body :deep(.agent-chat-wrap) { border: none; border-radius: 0; box-shadow: none; height: 100%; }

@keyframes aipulse { 0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); } 50% { box-shadow: 0 0 0 4px rgba(52,211,153,0.06); } }

/* 响应式 */
@media (max-width: 900px) {
  .dept-main-grid { grid-template-columns: 1fr; }
  .agent-panel { position: relative; }
  .dept-header { flex-direction: column; align-items: flex-start; }
}
</style>
