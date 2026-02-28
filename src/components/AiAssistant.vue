<template>
  <!-- Floating trigger button -->
  <div class="ai-trigger" @click="toggleChat" :title="isOpen ? '关闭AI助手' : '打开AI助手'">
    <el-icon :size="22"><ChatRound /></el-icon>
    <span class="ai-trigger-label">AI助手</span>
    <el-badge v-if="unread > 0" :value="unread" class="ai-badge" />
  </div>

  <!-- Chat panel -->
  <transition name="chat-slide">
    <div v-if="isOpen" class="ai-chat-panel" @click.stop>
      <!-- Header -->
      <div class="chat-header">
        <div class="chat-header-info">
          <div class="chat-avatar">
            <el-icon :size="18"><Cpu /></el-icon>
          </div>
          <div>
            <div class="chat-name">数字游牧 AI 助手</div>
            <div class="chat-status">{{ isLoading ? '正在输入...' : '在线' }}</div>
          </div>
        </div>
        <div class="chat-header-actions">
          <el-tooltip content="清空对话">
            <el-button :icon="Delete" circle size="small" plain @click="clearMessages" />
          </el-tooltip>
          <el-button :icon="Close" circle size="small" plain @click="isOpen = false" />
        </div>
      </div>

      <!-- Messages -->
      <div ref="messagesRef" class="chat-messages">
        <!-- Welcome message -->
        <div class="chat-welcome" v-if="messages.length === 0">
          <el-icon :size="40" color="#165dff"><Cpu /></el-icon>
          <p class="welcome-title">你好！我是数字游牧 AI 助手</p>
          <p class="welcome-sub">你可以用自然语言描述业务需求，我来帮你录入数据</p>
          <div class="quick-prompts">
            <el-tag
              v-for="p in quickPrompts"
              :key="p"
              class="quick-tag"
              type="info"
              @click="sendQuickPrompt(p)"
            >{{ p }}</el-tag>
          </div>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message-item"
          :class="msg.role === 'user' ? 'message-user' : 'message-assistant'"
        >
          <div class="message-avatar">
            <el-icon v-if="msg.role === 'assistant'"><Cpu /></el-icon>
            <el-icon v-else><User /></el-icon>
          </div>
          <div class="message-bubble">
            <div v-if="msg.images?.length" class="message-images">
              <img
                v-for="(url, i) in msg.images"
                :key="i"
                :src="url"
                class="message-img"
                @click="previewImage(url)"
              />
            </div>
            <div class="message-content" v-html="renderMarkdown(msg.content)" />
            <div class="message-time">{{ msg.time }}</div>
          </div>
        </div>

        <!-- Streaming indicator -->
        <div v-if="isLoading" class="message-item message-assistant">
          <div class="message-avatar"><el-icon><Cpu /></el-icon></div>
          <div class="message-bubble">
            <div class="typing-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
        </div>
      </div>

      <!-- Actions section for parsed data -->
      <div v-if="pendingAction" class="action-preview">
        <div class="action-preview-title">
          <el-icon><Check /></el-icon>
          检测到可录入数据，确认执行？
        </div>
        <div class="action-preview-content">{{ JSON.stringify(pendingAction.data, null, 2) }}</div>
        <div class="action-preview-buttons">
          <el-button type="primary" size="small" @click="executeAction">确认录入</el-button>
          <el-button size="small" @click="pendingAction = null">取消</el-button>
        </div>
      </div>

      <!-- Input area -->
      <div class="chat-input-area">
        <!-- Pending images preview -->
        <div v-if="pendingImages.length" class="pending-images">
          <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-img-wrap">
            <img :src="img.previewUrl" class="pending-img" />
            <el-icon class="pending-img-remove" @click="removePendingImage(idx)"><Close /></el-icon>
          </div>
        </div>

        <el-input
          v-model="inputText"
          type="textarea"
          :rows="2"
          placeholder="输入业务描述，或上传单据图片让AI识别录入..."
          resize="none"
          :disabled="isLoading"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="inputText += '\n'"
        />
        <div class="input-footer">
          <el-tooltip content="上传单据图片">
            <el-button :icon="Picture" circle size="small" plain @click="openImagePicker" :disabled="isLoading" />
          </el-tooltip>
          <input
            ref="fileInputRef"
            type="file"
            accept="image/*"
            multiple
            style="display:none"
            @change="onFileChange"
          />
          <span class="input-hint">Enter 发送 · Shift+Enter 换行</span>
          <el-button
            type="primary"
            :icon="Promotion"
            :loading="isLoading"
            :disabled="!inputText.trim() && !pendingImages.length"
            @click="sendMessage"
          >发送</el-button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ChatRound, Cpu, Delete, Close, User, Promotion, Check, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
  images?: string[]   // preview URLs (object URLs)
}

interface PendingAction {
  type: string
  data: Record<string, any>
  apiPath: string
}

interface ImageItem {
  previewUrl: string   // for display
  data: string         // base64 (without prefix)
  mediaType: string
}

const isOpen = ref(false)
const unread = ref(0)
const inputText = ref('')
const messages = ref<Message[]>([])
const isLoading = ref(false)
const messagesRef = ref<HTMLDivElement>()
const pendingAction = ref<PendingAction | null>(null)
const pendingImages = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement>()

const quickPrompts = [
  '新增一个客户',
  '查询本月销售情况',
  '录入一条采购订单',
  '新增员工信息',
  '创建销售报价单',
]

const SYSTEM_PROMPT = `你是数字游牧ERP系统的AI助手，帮助用户通过自然语言录入和查询业务数据。

你有以下能力：
1. 帮用户录入客户、供应商、商品、员工等基础资料
2. 帮用户创建销售订单、采购订单、报价单等业务单据
3. 解释系统功能和操作方式
4. 分析用户描述的业务场景，提取关键数据

当用户想要录入数据时，请：
1. 提取用户描述中的关键字段
2. 以JSON格式返回可录入的数据，格式如下：
   \`\`\`action
   {
     "type": "create_customer" | "create_supplier" | "create_goods" | "create_sale_order" | "create_procure_order" | "create_staff",
     "data": { ...字段 },
     "description": "操作描述"
   }
   \`\`\`
3. 如果信息不完整，主动询问缺少的必填字段

支持的操作类型及对应字段：
- create_customer: nickname(客户名称), mobile(手机), address(地址), remark(备注)
- create_supplier: name(供应商名), contact(联系人), mobile(手机), address(地址)
- create_goods: goods_name(商品名), goods_sn(编码), sell_price(售价), cost_price(成本价), unit_name(单位)
- create_staff: name(姓名), mobile(手机), dept_name(部门), jobs_name(职位), entry_date(入职日期)
- create_sale_order: customer_name(客户), total_amount(金额), remark(备注)
- create_procure_order: supplier_name(供应商), total_amount(金额), remark(备注)

回复要简洁友好，中文回答。如果用户只是问问题不需要录入数据，直接回答即可，无需输出action块。`

function toggleChat() {
  isOpen.value = !isOpen.value
  if (isOpen.value) {
    unread.value = 0
    nextTick(() => scrollToBottom())
  }
}

function getNow() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

async function sendMessage() {
  const text = inputText.value.trim()
  const hasImages = pendingImages.value.length > 0
  if ((!text && !hasImages) || isLoading.value) return

  const imagesToSend = [...pendingImages.value]
  const previewUrls = imagesToSend.map(i => i.previewUrl)

  messages.value.push({
    role: 'user',
    content: text || '请识别这张单据图片，提取所有关键信息并帮我录入系统。',
    time: getNow(),
    images: previewUrls.length ? previewUrls : undefined,
  })
  inputText.value = ''
  pendingImages.value = []
  isLoading.value = true
  pendingAction.value = null
  nextTick(() => scrollToBottom())

  const apiMessages = messages.value
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-10)
    .map((m) => ({ role: m.role, content: m.content }))

  let assistantText = ''
  const assistantMsg: Message = { role: 'assistant', content: '', time: getNow() }
  messages.value.push(assistantMsg)

  try {
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: apiMessages,
        systemPrompt: SYSTEM_PROMPT,
        images: imagesToSend.length ? imagesToSend.map(i => ({ data: i.data, mediaType: i.mediaType })) : undefined,
      }),
    })

    if (!response.ok) {
      const err = await response.json()
      throw new Error(err.error || '请求失败')
    }

    const reader = response.body!.getReader()
    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const text = decoder.decode(value)
      const lines = text.split('\n')
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.text) {
              assistantText += parsed.text
              assistantMsg.content = assistantText
              nextTick(() => scrollToBottom())
            }
          } catch {}
        }
      }
    }

    // Parse action block
    const actionMatch = assistantText.match(/```action\s*([\s\S]*?)```/)
    if (actionMatch) {
      try {
        const action = JSON.parse(actionMatch[1].trim())
        pendingAction.value = {
          type: action.type,
          data: action.data,
          apiPath: getApiPath(action.type),
        }
        assistantMsg.content = assistantText.replace(/```action[\s\S]*?```/, '').trim()
      } catch {}
    }
  } catch (e: any) {
    assistantMsg.content = `抱歉，出现了错误：${e.message}`
    if (!isOpen.value) unread.value++
  } finally {
    // revoke object URLs to free memory
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

async function executeAction() {
  if (!pendingAction.value) return
  try {
    await http.post(pendingAction.value.apiPath, pendingAction.value.data)
    ElMessage.success('数据录入成功！')
    messages.value.push({
      role: 'assistant',
      content: '✅ 数据已成功录入系统！如需继续操作，请告诉我。',
      time: getNow(),
    })
    pendingAction.value = null
  } catch (e: any) {
    ElMessage.error('录入失败：' + e.message)
  }
}

function getApiPath(type: string): string {
  const map: Record<string, string> = {
    create_customer: '/shop.ShopCustomer/add',
    create_supplier: '/procure.ProcureSupplier/add',
    create_goods: '/shop.ShopGoods/add',
    create_staff: '/personnel.Staff/add',
    create_sale_order: '/shop.ContractOrder/add',
    create_procure_order: '/procure.ProcureOrder/add',
  }
  return map[type] || '/unknown'
}

function openImagePicker() {
  fileInputRef.value?.click()
}

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const data = await fileToBase64(file)
    pendingImages.value.push({
      previewUrl: URL.createObjectURL(file),
      data,
      mediaType: file.type,
    })
  }
  // reset input so same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      // strip "data:image/xxx;base64," prefix
      resolve(result.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function removePendingImage(idx: number) {
  URL.revokeObjectURL(pendingImages.value[idx].previewUrl)
  pendingImages.value.splice(idx, 1)
}

function previewImage(url: string) {
  window.open(url, '_blank')
}

function sendQuickPrompt(p: string) {
  inputText.value = p
  sendMessage()
}

function clearMessages() {
  messages.value = []
  pendingAction.value = null
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

function renderMarkdown(text: string): string {
  // Basic markdown rendering
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/^- (.+)/gm, '• $1')
}
</script>

<style scoped>
.ai-trigger {
  position: fixed;
  bottom: 32px;
  right: 32px;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.4);
  transition: all 0.2s;
  z-index: 1000;
  gap: 2px;
  user-select: none;
}

.ai-trigger:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 32px rgba(22, 93, 255, 0.5);
}

.ai-trigger-label {
  font-size: 10px;
  font-weight: 500;
  line-height: 1;
}

.ai-badge {
  position: absolute;
  top: -4px;
  right: -4px;
}

.ai-chat-panel {
  position: fixed;
  bottom: 110px;
  right: 32px;
  width: 400px;
  height: 580px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  z-index: 999;
}

/* Slide transition */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.96);
}

.chat-header {
  padding: 14px 16px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}

.chat-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.chat-avatar {
  width: 34px;
  height: 34px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.chat-name {
  font-size: 14px;
  font-weight: 600;
  color: #fff;
}

.chat-status {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.7);
  margin-top: 1px;
}

.chat-header-actions {
  display: flex;
  gap: 6px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-welcome {
  text-align: center;
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.welcome-title {
  font-size: 15px;
  font-weight: 600;
  color: #1d2129;
  margin: 4px 0 0;
}

.welcome-sub {
  font-size: 12px;
  color: #86909c;
  margin: 0;
  line-height: 1.5;
}

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}

.quick-tag {
  cursor: pointer;
  transition: all 0.15s;
}

.quick-tag:hover {
  background: #165dff;
  border-color: #165dff;
  color: #fff;
}

.message-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.message-user {
  flex-direction: row-reverse;
}

.message-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 14px;
  background: #f2f3f5;
  color: #4e5969;
}

.message-user .message-avatar {
  background: #165dff;
  color: #fff;
}

.message-bubble {
  max-width: 75%;
}

.message-content {
  padding: 10px 13px;
  border-radius: 12px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
  background: #f2f3f5;
  color: #1d2129;
}

.message-user .message-content {
  background: #165dff;
  color: #fff;
  border-radius: 12px 4px 12px 12px;
}

.message-assistant .message-content {
  border-radius: 4px 12px 12px 12px;
}

.message-content code {
  background: rgba(0, 0, 0, 0.08);
  padding: 1px 4px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 12px;
}

.message-user .message-content code {
  background: rgba(255, 255, 255, 0.2);
}

.message-time {
  font-size: 11px;
  color: #c9cdd4;
  margin-top: 4px;
  padding: 0 2px;
}

.message-user .message-time {
  text-align: right;
}

.typing-dots {
  display: flex;
  gap: 4px;
  padding: 10px 13px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  background: #86909c;
  border-radius: 50%;
  animation: typing-bounce 1.2s infinite;
}

.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes typing-bounce {
  0%, 60%, 100% { transform: translateY(0); }
  30% { transform: translateY(-6px); }
}

.action-preview {
  margin: 0 12px 8px;
  background: #f0f9eb;
  border: 1px solid #b3e19d;
  border-radius: 8px;
  padding: 10px 12px;
  flex-shrink: 0;
}

.action-preview-title {
  font-size: 12px;
  font-weight: 600;
  color: #27ae60;
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 6px;
}

.action-preview-content {
  font-family: monospace;
  font-size: 11px;
  color: #4e5969;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  margin-bottom: 8px;
  background: rgba(255, 255, 255, 0.6);
  padding: 4px 6px;
  border-radius: 4px;
}

.action-preview-buttons {
  display: flex;
  gap: 8px;
}

.chat-input-area {
  padding: 12px;
  border-top: 1px solid #f2f3f5;
  flex-shrink: 0;
}

.input-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.input-hint {
  font-size: 11px;
  color: #c9cdd4;
  flex: 1;
  text-align: center;
}

/* Pending images before send */
.pending-images {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

.pending-img-wrap {
  position: relative;
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: visible;
}

.pending-img {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e4e7ed;
}

.pending-img-remove {
  position: absolute;
  top: -6px;
  right: -6px;
  width: 16px;
  height: 16px;
  background: #f53f3f;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Images inside message bubble */
.message-images {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.message-img {
  max-width: 180px;
  max-height: 180px;
  border-radius: 8px;
  object-fit: cover;
  cursor: pointer;
  border: 1px solid rgba(0,0,0,0.08);
  transition: opacity 0.15s;
}

.message-img:hover {
  opacity: 0.85;
}
</style>
