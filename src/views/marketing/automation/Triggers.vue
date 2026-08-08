<template>
  <div class="triggers-page">

    <div class="page-header">
      <div>
        <h2 class="page-title">触发器</h2>
        <p class="page-desc">自动化规则 · 让公司自己运转</p>
      </div>
    </div>

    <!-- 定时任务列表 -->
    <div v-if="loading" class="run-log-empty">加载中…</div>

    <div v-else-if="!tasks.length" class="empty-card">
      <div class="empty-emoji">⏰</div>
      <div class="empty-title">还没有定时任务</div>
      <div class="empty-desc">
        去工作台对 Captain 说一句就行，比如：<br />
        <span class="empty-example">"每天早上7点准备好当天的3条小红书内容"</span><br />
        到点自动按品牌配置生成文案和配图，直接进发布管理队列。
      </div>
      <button class="trigger-run-btn" @click="$router.push('/agent')">去找 Captain 安排</button>
    </div>

    <div v-else class="trigger-list">
      <div v-for="t in tasks" :key="t.id" class="trigger-card">
        <div class="trigger-card-left">
          <div class="trigger-icon" :style="{ background: '#6366f118', color: '#6366f1' }">
            <span>📋</span>
          </div>
          <div class="trigger-info">
            <div class="trigger-name">{{ t.instruction }}</div>
            <div class="trigger-desc">生成 {{ t.count }} 条内容 → 自动进入发布队列</div>
            <div class="trigger-meta">
              <span class="trigger-schedule">{{ t.repeat === 'daily' ? '每天' : '单次' }} {{ t.time }}</span>
              <span class="trigger-sep">·</span>
              <span class="trigger-last" :class="{ never: !t.lastRunDate }">
                {{ t.lastRunDate ? `上次执行 ${t.lastRunDate}：${t.lastRunResult}` : '尚未执行' }}
              </span>
            </div>
          </div>
        </div>
        <div class="trigger-card-right">
          <span class="trigger-status" :class="t.enabled ? 'on' : 'off'">
            {{ t.enabled ? '已启用' : '已停用' }}
          </span>
          <button class="toggle-btn" :disabled="t.busy" @click="toggleTask(t)">
            {{ t.enabled ? '停用' : '启用' }}
          </button>
          <button class="del-btn" :disabled="t.busy" @click="deleteTask(t)">删除</button>
        </div>
      </div>
    </div>

    <!-- 执行记录 -->
    <div class="section-hd" style="margin-top:24px">
      <h3 class="section-title">最近执行记录</h3>
    </div>

    <div class="run-log">
      <div v-if="runLog.length === 0" class="run-log-empty">暂无执行记录</div>
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
      <span>定时任务由 Captain 创建（在工作台直接说需求即可），后台每 30 分钟检查一次到期任务。生成的内容会出现在「发布管理」页面。</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

interface SchedTask {
  id: string
  instruction: string
  time: string
  repeat: 'daily' | 'once'
  count: number
  enabled: boolean
  lastRunDate: string
  lastRunResult: string
  createdAt: number
  busy?: boolean
}

const tasks = ref<SchedTask[]>([])
const loading = ref(true)

function token() { return localStorage.getItem('erp_token') || '' }

const runLog = computed(() =>
  tasks.value
    .filter(t => t.lastRunDate)
    .map(t => ({
      name: t.instruction.slice(0, 20) + (t.instruction.length > 20 ? '…' : ''),
      result: t.lastRunResult,
      time: t.lastRunDate,
      success: !t.lastRunResult.startsWith('失败'),
    }))
)

async function loadTasks() {
  loading.value = true
  try {
    const resp = await fetch('/api/scheduled-tasks', { headers: { 'x-erp-token': token() } })
    const data = await resp.json() as any
    tasks.value = data?.tasks || []
  } catch {
    tasks.value = []
  } finally {
    loading.value = false
  }
}

async function post(body: Record<string, any>) {
  const resp = await fetch('/api/scheduled-tasks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-erp-token': token() },
    body: JSON.stringify(body),
  })
  return await resp.json() as any
}

async function toggleTask(t: SchedTask) {
  t.busy = true
  try {
    const data = await post({ action: 'toggle', id: t.id })
    if (data?.code === 1) { tasks.value = data.tasks; ElMessage.success('已更新') }
    else ElMessage.error(data?.message || '操作失败')
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    t.busy = false
  }
}

async function deleteTask(t: SchedTask) {
  try {
    await ElMessageBox.confirm(`确定删除定时任务「${t.instruction.slice(0, 20)}…」？`, '提示', { type: 'warning' })
  } catch { return }
  t.busy = true
  try {
    const data = await post({ action: 'delete', id: t.id })
    if (data?.code === 1) { tasks.value = data.tasks; ElMessage.success('已删除') }
    else ElMessage.error(data?.message || '删除失败')
  } catch (e: any) {
    ElMessage.error(e?.message || '删除失败')
  } finally {
    t.busy = false
  }
}

onMounted(loadTasks)
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

/* 空状态 */
.empty-card {
  background: #ffffff; border: 1px solid #E8E8E8; border-radius: 14px;
  padding: 36px 24px; text-align: center;
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.04);
}
.empty-emoji { font-size: 32px; }
.empty-title { font-size: 15px; font-weight: 700; color: #1A1A1A; }
.empty-desc { font-size: 12.5px; color: #666666; line-height: 1.8; }
.empty-example { color: #0071e3; font-weight: 600; }

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
.trigger-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
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

.toggle-btn, .del-btn {
  padding: 6px 12px; border-radius: 8px; font-size: 12px; font-weight: 600;
  cursor: pointer; font-family: inherit; border: 1px solid #E0E0E0; background: #fff; color: #444;
  transition: all 0.15s;
}
.toggle-btn:hover:not(:disabled) { border-color: #0071e3; color: #0071e3; }
.del-btn:hover:not(:disabled) { border-color: #ef4444; color: #ef4444; }
.toggle-btn:disabled, .del-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 执行记录 */
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
