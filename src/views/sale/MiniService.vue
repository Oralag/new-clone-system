<template>
  <div class="service-page">
    <el-card shadow="never" class="toolbar">
      <el-input v-model="keyword" placeholder="搜索手机号或商品" clearable style="width:280px" @keyup.enter="loadSessions" />
      <el-button type="primary" @click="loadSessions">查询</el-button>
      <el-tag type="danger" effect="light">待人工 {{ pendingCount }}</el-tag>
    </el-card>
    <div class="desk">
      <el-card shadow="never" class="session-list" v-loading="loading">
        <div v-for="item in sessions" :key="item.id" class="session-item" :class="{ active: current?.id === item.id }" @click="openSession(item)">
          <div class="session-top">
            <b>{{ item.phone || '游客' }}</b>
            <el-tag v-if="item.status === 'human_requested'" type="danger" size="small">待人工</el-tag>
            <el-tag v-else-if="item.status === 'human'" type="success" size="small">人工中</el-tag>
            <el-tag v-else size="small">Nova</el-tag>
          </div>
          <div class="product">{{ item.product_name || '通用咨询' }}</div>
          <div class="preview">{{ item.last_message || '暂无消息' }}</div>
          <div class="time">{{ formatTime(item.updated_at) }}</div>
        </div>
        <el-empty v-if="!loading && !sessions.length" description="暂无客服会话" />
      </el-card>
      <el-card shadow="never" class="conversation">
        <template v-if="current">
          <div class="conversation-head">
            <div><b>{{ current.phone || '游客' }}</b><span>{{ current.product_name || '通用咨询' }}</span></div>
            <span>会话记录保留 180 天</span>
          </div>
          <div ref="messageBox" class="messages">
            <div v-for="msg in current.messages" :key="msg.id" class="message" :class="msg.role">
              <div class="source">{{ sourceName(msg) }} · {{ formatTime(msg.created_at) }}</div>
              <div class="bubble">{{ msg.content }}</div>
            </div>
          </div>
          <div class="reply">
            <el-input v-model="reply" type="textarea" :rows="3" placeholder="输入人工回复，Ctrl / ⌘ + Enter 发送" @keydown.meta.enter="sendReply" @keydown.ctrl.enter="sendReply" />
            <el-button type="primary" :loading="sending" @click="sendReply">发送回复</el-button>
          </div>
        </template>
        <el-empty v-else description="从左侧选择一个会话" />
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const sessions = ref<any[]>([])
const current = ref<any>(null)
const keyword = ref('')
const reply = ref('')
const loading = ref(false)
const sending = ref(false)
const messageBox = ref<HTMLElement>()
const pendingCount = computed(() => sessions.value.filter(i => i.status === 'human_requested').length)
let timer: number | undefined

const formatTime = (value: string) => value ? new Date(value).toLocaleString('zh-CN', { hour12: false }) : ''
const sourceName = (msg: any) => msg.source === 'human' ? '人工客服' : msg.role === 'user' ? '客户' : msg.source === 'nova' ? 'Nova' : '系统'

async function loadSessions() {
  loading.value = true
  try {
    const res = await http.get('/mini/service/sessions', { params: { keyword: keyword.value, list_rows: 100 } })
    sessions.value = res.data.rows || []
  } finally { loading.value = false }
}
async function openSession(item: any) {
  const res = await http.get(`/mini/service/session/${item.id}`)
  current.value = res.data
  await nextTick()
  if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight
}
async function sendReply() {
  const content = reply.value.trim()
  if (!content || !current.value || sending.value) return
  sending.value = true
  try {
    const res = await http.post(`/mini/service/session/${current.value.id}/reply`, { content })
    current.value.messages.push(res.data)
    reply.value = ''
    ElMessage.success('已发送')
    await nextTick()
    if (messageBox.value) messageBox.value.scrollTop = messageBox.value.scrollHeight
    loadSessions()
  } finally { sending.value = false }
}
onMounted(() => {
  loadSessions()
  timer = window.setInterval(async () => {
    await loadSessions()
    if (current.value) await openSession(current.value)
  }, 10000)
})
onBeforeUnmount(() => timer && clearInterval(timer))
</script>

<style scoped>
.service-page { padding: 16px; height: calc(100vh - 84px); box-sizing: border-box; }
.toolbar :deep(.el-card__body) { display: flex; align-items: center; gap: 12px; }
.desk { display: grid; grid-template-columns: 340px 1fr; gap: 12px; height: calc(100% - 78px); margin-top: 12px; }
.session-list, .conversation { height: 100%; overflow: hidden; }
.session-list :deep(.el-card__body) { height: 100%; overflow-y: auto; padding: 0; }
.session-item { padding: 16px; border-bottom: 1px solid #eef0f3; cursor: pointer; }
.session-item:hover, .session-item.active { background: #eef6ff; }
.session-top { display: flex; justify-content: space-between; align-items: center; }
.product, .preview, .time { margin-top: 6px; font-size: 13px; color: #86909c; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.time { font-size: 12px; }
.conversation :deep(.el-card__body) { height: 100%; padding: 0; display: flex; flex-direction: column; }
.conversation-head { display: flex; justify-content: space-between; padding: 16px 20px; border-bottom: 1px solid #eef0f3; color: #86909c; font-size: 13px; }
.conversation-head b { color: #1d2129; margin-right: 12px; }
.messages { flex: 1; overflow-y: auto; padding: 20px; background: #f7f8fa; }
.message { max-width: 72%; margin-bottom: 16px; }
.message.user { margin-left: auto; }
.source { color: #86909c; font-size: 12px; margin-bottom: 5px; }
.message.user .source { text-align: right; }
.bubble { padding: 11px 14px; border-radius: 12px; background: white; white-space: pre-wrap; line-height: 1.6; }
.message.user .bubble { background: #315e86; color: white; }
.reply { display: flex; gap: 12px; align-items: flex-end; padding: 16px; border-top: 1px solid #eef0f3; }
.reply :deep(.el-textarea) { flex: 1; }
@media (max-width: 900px) { .desk { grid-template-columns: 260px 1fr; } }
</style>
