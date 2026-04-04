<template>
  <div class="triggers-page">

    <div class="page-header">
      <div>
        <h2 class="page-title">触发器</h2>
        <p class="page-desc">自动化规则 · 让公司自己运转</p>
      </div>
    </div>

    <!-- 触发器列表 -->
    <div class="trigger-list">
      <div v-for="t in triggers" :key="t.id" class="trigger-card">
        <div class="trigger-card-left">
          <div class="trigger-icon" :style="{ background: t.color + '18', color: t.color }">
            <span>{{ t.emoji }}</span>
          </div>
          <div class="trigger-info">
            <div class="trigger-name">{{ t.name }}</div>
            <div class="trigger-desc">{{ t.desc }}</div>
            <div class="trigger-meta">
              <span class="trigger-schedule">{{ t.schedule }}</span>
              <span class="trigger-sep">·</span>
              <span class="trigger-last" :class="{ never: !t.lastRun }">
                {{ t.lastRun ? '上次运行：' + t.lastRun : '尚未运行' }}
              </span>
            </div>
          </div>
        </div>
        <div class="trigger-card-right">
          <span class="trigger-status" :class="t.enabled ? 'on' : 'off'">
            {{ t.enabled ? '已启用' : '已停用' }}
          </span>
          <button class="trigger-run-btn" @click="runTrigger(t)" :disabled="t.running">
            <svg v-if="!t.running" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 2l7 4-7 4V2z" fill="currentColor"/>
            </svg>
            <span v-else class="spin-sm"></span>
            {{ t.running ? '运行中' : '立即运行' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 运行记录 -->
    <div class="section-hd" style="margin-top:24px">
      <h3 class="section-title">最近运行记录</h3>
    </div>

    <div class="run-log">
      <div v-if="runLog.length === 0" class="run-log-empty">暂无运行记录</div>
      <div v-for="(log, i) in runLog" :key="i" class="run-log-item">
        <span class="log-dot" :class="log.success ? 'success' : 'fail'"></span>
        <span class="log-name">{{ log.name }}</span>
        <span class="log-result">{{ log.result }}</span>
        <span class="log-time">{{ log.time }}</span>
      </div>
    </div>

    <!-- 提示 -->
    <div class="tips-card">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#0071e3" stroke-width="1.3" stroke-linecap="round">
        <circle cx="7" cy="7" r="6"/><path d="M7 6v4M7 4.5v.5"/>
      </svg>
      <span>自定义触发规则将在第二版开放。当前为预设固定规则，由 OpenClaw 定时调度执行。</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const triggers = ref([
  {
    id: 'daily-trending',
    emoji: '📈',
    name: '每日热搜抓取',
    desc: '自动抓取抖音、小红书、微博等平台热搜',
    schedule: '每天 08:00',
    color: '#06b6d4',
    enabled: true,
    running: false,
    lastRun: '今天 08:00',
  },
  {
    id: 'weekly-plan',
    emoji: '📋',
    name: '每周内容计划',
    desc: '基于热搜数据，自动生成本周内容建议',
    schedule: '每周一 09:00',
    color: '#6366f1',
    enabled: true,
    running: false,
    lastRun: '周一 09:00',
  },
  {
    id: 'trending-alert',
    emoji: '🔔',
    name: '热搜更新推送',
    desc: '热搜榜单更新后，推送建议给 Captain',
    schedule: '热搜更新时触发',
    color: '#f59e0b',
    enabled: false,
    running: false,
    lastRun: null,
  },
  {
    id: 'monthly-review',
    emoji: '📊',
    name: '月度内容复盘',
    desc: '自动汇总本月内容数据，生成复盘报告',
    schedule: '每月1日 10:00',
    color: '#10b981',
    enabled: false,
    running: false,
    lastRun: null,
  },
])

const runLog = ref([
  { name: '每日热搜抓取', result: '抓取 48 条热搜', time: '今天 08:00', success: true },
  { name: '每周内容计划', result: '生成 5 条内容建议', time: '周一 09:00', success: true },
  { name: '每日热搜抓取', result: '抓取 52 条热搜', time: '昨天 08:00', success: true },
])

function runTrigger(t: typeof triggers.value[0]) {
  t.running = true
  ElMessage.info(`正在运行：${t.name}`)
  setTimeout(() => {
    t.running = false
    t.lastRun = '刚刚'
    runLog.value.unshift({
      name: t.name,
      result: '手动触发完成',
      time: '刚刚',
      success: true,
    })
    ElMessage.success(`${t.name} 运行完成`)
  }, 2000)
}
</script>

<style scoped>
.triggers-page {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding-bottom: 40px;
  max-width: 800px;
}

.page-header { margin-bottom: 4px; }
.page-title { font-size: 20px; font-weight: 800; color: #1A1A1A; margin: 0 0 4px; letter-spacing: -0.03em; }
.page-desc { font-size: 13px; color: #999999; margin: 0; }

/* 触发器列表 */
.trigger-list { display: flex; flex-direction: column; gap: 10px; }

.trigger-card {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  transition: box-shadow 0.15s;
}
.trigger-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }

.trigger-card-left { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 0; }
.trigger-icon {
  width: 40px; height: 40px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 18px; flex-shrink: 0;
}
.trigger-info { flex: 1; min-width: 0; }
.trigger-name { font-size: 14px; font-weight: 700; color: #1A1A1A; margin-bottom: 2px; }
.trigger-desc { font-size: 12px; color: #666666; margin-bottom: 6px; }
.trigger-meta { display: flex; align-items: center; gap: 6px; }
.trigger-schedule { font-size: 11px; font-weight: 600; color: #0071e3; background: rgba(0,113,227,0.08); padding: 2px 8px; border-radius: 20px; }
.trigger-sep { color: #CCCCCC; font-size: 11px; }
.trigger-last { font-size: 11px; color: #999999; }
.trigger-last.never { color: #CCCCCC; font-style: italic; }

.trigger-card-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
.trigger-status {
  font-size: 11px; font-weight: 700; padding: 3px 10px;
  border-radius: 20px;
}
.trigger-status.on  { background: rgba(52,211,153,0.1); color: #059669; }
.trigger-status.off { background: rgba(0,0,0,0.05); color: #AAAAAA; }

.trigger-run-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 8px;
  background: #0071e3; color: #fff;
  border: none; font-size: 12px; font-weight: 600; cursor: pointer;
  font-family: inherit; transition: background 0.15s;
}
.trigger-run-btn:hover:not(:disabled) { background: #0066cc; }
.trigger-run-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.spin-sm {
  width: 10px; height: 10px; border-radius: 50%;
  border: 1.5px solid rgba(255,255,255,0.3);
  border-top-color: white;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }

/* 运行记录 */
.section-hd { display: flex; align-items: center; gap: 10px; }
.section-title { font-size: 13px; font-weight: 700; color: #1A1A1A; margin: 0; }

.run-log {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 14px;
  overflow: hidden;
}
.run-log-empty { padding: 24px; text-align: center; font-size: 13px; color: #CCCCCC; }
.run-log-item {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 18px;
  border-bottom: 1px solid #F5F5F5;
  font-size: 13px;
}
.run-log-item:last-child { border-bottom: none; }
.log-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.log-dot.success { background: #34d399; }
.log-dot.fail    { background: #ef4444; }
.log-name { font-weight: 600; color: #1A1A1A; flex-shrink: 0; }
.log-result { flex: 1; color: #666666; }
.log-time { font-size: 11px; color: #AAAAAA; flex-shrink: 0; }

/* 提示卡 */
.tips-card {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 12px 16px;
  background: rgba(0,113,227,0.04);
  border: 1px solid rgba(0,113,227,0.12);
  border-radius: 10px;
  font-size: 12px;
  color: #666666;
  line-height: 1.5;
}
.tips-card svg { flex-shrink: 0; margin-top: 1px; }
</style>
