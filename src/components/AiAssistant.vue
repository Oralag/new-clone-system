<template>
  <!-- Floating trigger button -->
  <div
    v-show="route.path !== '/mobile/apps'"
    class="ai-trigger"
    :style="{ bottom: triggerBottom + 'px', right: triggerRight + 'px' }"
    @mousedown="onTriggerDragStart"
    @touchstart.passive="onTriggerTouchStart"
    @click="onTriggerClick"
    :title="isOpen ? '关闭ERP管家' : '打开ERP管家'"
  >
    <el-icon :size="22"><ChatRound /></el-icon>
    <span class="ai-trigger-label">ERP管家</span>
    <el-badge v-if="unread > 0" :value="unread" class="ai-badge" />
  </div>

  <!-- Chat panel -->
  <transition name="chat-slide">
    <div
      v-if="isOpen"
      class="ai-chat-panel"
      :style="{ bottom: panelBottom + 'px', right: panelRight + 'px' }"
      @click.stop
    >
      <!-- Header — drag handle -->
      <div class="chat-header" @mousedown="onPanelDragStart" @touchstart.passive="onPanelTouchStart">
        <div class="chat-header-info">
          <div class="chat-avatar">
            <el-icon :size="18"><Cpu /></el-icon>
          </div>
          <div>
            <div class="chat-name">ERP 管家</div>
            <div class="chat-status">{{ isLoading ? '正在处理...' : '在线 · ERP 数据专属' }}</div>
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
          <p class="welcome-title">你好！我是 ERP 管家</p>
          <p class="welcome-sub">负责 ERP 数据录入、查询、导航，直接告诉我你要做什么</p>
          <div class="quick-prompts">
            <el-tag
              v-for="p in quickPrompts"
              :key="p"
              class="quick-tag"
              type="info"
              @click="sendQuickPrompt(p)"
            >{{ p }}</el-tag>
          </div>
          <!-- BOM快速设置 -->
          <div class="bom-quick-btn" @click="bomDialogVisible = true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
            一键设置 BOM 物料清单
          </div>
        </div>

        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="message-item"
          :class="[
            msg.role === 'user' ? 'message-user' : 'message-assistant',
            msg.isAck ? 'message-ack' : ''
          ]"
        >
          <div
            class="message-avatar"
            :style="msg.agentId && msg.role === 'assistant' ? { background: getAgentColor(msg.agentId), color: '#fff' } : {}"
            :title="msg.agentName"
          >
            <span v-if="msg.agentEmoji && msg.role === 'assistant'" class="agent-emoji">{{ msg.agentEmoji }}</span>
            <el-icon v-else-if="msg.role === 'assistant'"><Cpu /></el-icon>
            <el-icon v-else><User /></el-icon>
          </div>
          <div class="message-bubble">
            <!-- Agent 标签（非Captain且非普通assistant才显示） -->
            <div v-if="msg.agentId && msg.agentId !== 'captain' && msg.role === 'assistant'" class="agent-label" :style="{ color: getAgentColor(msg.agentId) }">
              {{ msg.agentEmoji }} {{ msg.agentName }}
            </div>
            <!-- Captain 标签 -->
            <div v-else-if="msg.agentId === 'captain' && msg.role === 'assistant'" class="agent-label captain-label">
              🎯 Captain
            </div>
            <div v-if="msg.images?.length" class="message-images">
              <img
                v-for="(url, i) in msg.images"
                :key="i"
                :src="url"
                class="message-img"
                @click="previewImage(url)"
              />
            </div>
            <AiToolCallCard
              v-for="tc in msg.toolCalls"
              :key="tc.id"
              :name="tc.name"
              :input="tc.input"
              :result="tc.result"
              :status="tc.status"
            />
            <div class="message-content" v-html="renderMarkdown(msg.content)" />
            <div v-if="msg.navRoute" class="message-nav-btn">
              <el-button type="primary" size="small" @click="navigateTo(msg.navRoute!)">立即查看 →</el-button>
            </div>
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

      <!-- 录入执行状态（自动执行，显示结果） -->
      <div v-if="pendingAction" class="action-preview">
        <div class="action-preview-title">
          <el-icon><Loading /></el-icon>
          正在录入数据...
        </div>
        <div class="action-preview-content">{{ JSON.stringify(pendingAction.data, null, 2) }}</div>
      </div>      <!-- Input area -->
      <div class="chat-input-area">
        <!-- Pending images preview -->
        <div v-if="pendingImages.length" class="pending-images">
          <div v-for="(img, idx) in pendingImages" :key="idx" class="pending-img-wrap">
            <img :src="img.previewUrl" class="pending-img" />
            <el-icon class="pending-img-remove" @click="removePendingImage(idx)"><Close /></el-icon>
          </div>
        </div>

        <textarea
          ref="textareaRef"
          v-model="inputText"
          class="chat-native-textarea"
          rows="2"
          :placeholder="isRecording ? '正在聆听，请说话...' : '输入业务描述，或上传单据图片让AI识别录入...'"
          :disabled="isLoading"
          autocomplete="off"
          autocorrect="off"
          autocapitalize="off"
          spellcheck="false"
          enterkeyhint="send"
          @keydown.enter.exact.prevent="sendMessage"
          @keydown.enter.shift.exact="inputText += '\n'"
        />
        <div class="input-footer">
          <el-tooltip content="上传单据图片">
            <el-button :icon="Picture" circle size="small" plain @click="openImagePicker" :disabled="isLoading" />
          </el-tooltip>
          <el-tooltip v-if="voiceSupported" :content="isRecording ? '点击停止' : '点击说话'">
            <el-button
              :icon="Microphone"
              circle
              size="small"
              :type="isRecording ? 'danger' : ''"
              :plain="!isRecording"
              :class="{ 'mic-active': isRecording }"
              @click.prevent="toggleVoice"
              :disabled="isLoading"
            />
          </el-tooltip>
          <el-button v-if="isIOS" :icon="Microphone" circle size="small" plain @click="showIOSVoiceTip" :disabled="isLoading" />
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

  <!-- Backdrop — click to close -->
  <transition name="fade">
    <div v-if="isOpen" class="ai-backdrop" @click="isOpen = false" />
  </transition>

  <!-- BOM 快速设置弹框 -->
  <el-dialog v-model="bomDialogVisible" title="一键设置 BOM 物料清单" width="500px" append-to-body>
    <div style="margin-bottom:12px;font-size:13px;color:#64748b">
      请选择成品和组成材料，系统将自动创建BOM清单。
    </div>
    <el-form label-width="80px">
      <el-form-item label="成品">
        <el-select v-model="bomFinished" placeholder="请选择成品" filterable style="width:100%"
          @focus="loadBomGoods">
          <el-option v-for="g in bomGoodsList" :key="g.id" :label="g.goods_name" :value="g.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="组成材料">
        <div style="display:flex;flex-direction:column;gap:8px">
          <div v-for="(item, idx) in bomMaterials" :key="idx" style="display:flex;gap:8px;align-items:center">
            <el-select v-model="item.goods_id" placeholder="选择材料" filterable style="flex:1">
              <el-option v-for="g in bomGoodsList" :key="g.id" :label="g.goods_name" :value="g.id" />
            </el-select>
            <el-input-number v-model="item.num" :min="0.01" :precision="2" style="width:110px" placeholder="用量" />
            <el-input v-model="item.unit_name" placeholder="单位" style="width:70px" />
            <el-button type="danger" link :icon="Delete" @click="bomMaterials.splice(idx, 1)" />
          </div>
          <el-button type="primary" link @click="bomMaterials.push({ goods_id: null, num: 1, unit_name: '' })">
            + 添加材料
          </el-button>
        </div>
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="bomDialogVisible = false">取消</el-button>
      <el-button type="primary" :loading="bomSaving" @click="submitBom">一键创建BOM</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ChatRound, Cpu, Delete, Close, User, Promotion, Check, Picture, Loading, Microphone } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import AiToolCallCard from './ai/AiToolCallCard.vue'
import type { ToolCallState } from './ai/composables/useAiAgent'
import { getGoodsList, createBom } from '@/api/goods'

interface Message {
  role: 'user' | 'assistant'
  content: string
  time: string
  images?: string[]
  toolCalls?: ToolCallState[]
  navRoute?: string
  // 多Agent会话字段
  agentId?: string       // 'captain' | 'copywriter' | 'poster' | ...
  agentName?: string     // 显示名称
  agentEmoji?: string    // 员工emoji
  agentColor?: string    // 员工主色
  isAck?: boolean        // 是接令回报（简短）
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

// ── Persistence ───────────────────────────────────────────────────────────────
const HISTORY_KEY = 'erp_ai_chat_history'
const MAX_HISTORY = 100  // keep at most 100 messages in storage

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw) as Message[]
  } catch {}
  return []
}

function saveHistory(msgs: Message[]) {
  try {
    const toSave = msgs.slice(-MAX_HISTORY)
    localStorage.setItem(HISTORY_KEY, JSON.stringify(toSave))
  } catch {}
}

const router = useRouter()
const route = useRoute()
const isOpen = ref(false)
const unread = ref(0)
const inputText = ref('')
const messages = ref<Message[]>(loadHistory())
const isLoading = ref(false)
const messagesRef = ref<HTMLDivElement>()
const pendingAction = ref<PendingAction | null>(null)
const pendingImages = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement>()

// persist whenever messages change
watch(messages, (val) => saveHistory(val), { deep: true })

// ── Drag positioning ──────────────────────────────────────────────────────────
const triggerBottom = ref(32)
const triggerRight = ref(32)
const panelBottom = computed(() => triggerBottom.value + 80)
const panelRight = computed(() => triggerRight.value)

let isDragging = false
let dragTarget: 'trigger' | 'panel' = 'trigger'
let startX = 0, startY = 0
let startBottom = 0, startRight = 0
let clickMoved = false

function onTriggerDragStart(e: MouseEvent) {
  isDragging = false
  clickMoved = false
  dragTarget = 'trigger'
  startX = e.clientX
  startY = e.clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  e.preventDefault()
}

function onTriggerTouchStart(e: TouchEvent) {
  if (e.touches.length !== 1) return
  isDragging = false
  clickMoved = false
  dragTarget = 'trigger'
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

function onPanelDragStart(e: MouseEvent) {
  // Don't drag if clicking a button inside header
  if ((e.target as HTMLElement).closest('button, .el-button')) return
  isDragging = false
  clickMoved = false
  dragTarget = 'panel'
  startX = e.clientX
  startY = e.clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('mousemove', onDragMove)
  window.addEventListener('mouseup', onDragEnd)
  e.preventDefault()
}

function onPanelTouchStart(e: TouchEvent) {
  if ((e.target as HTMLElement).closest('button, .el-button')) return
  if (e.touches.length !== 1) return
  isDragging = false
  clickMoved = false
  dragTarget = 'panel'
  startX = e.touches[0].clientX
  startY = e.touches[0].clientY
  startBottom = triggerBottom.value
  startRight = triggerRight.value
  window.addEventListener('touchmove', onTouchMove, { passive: false })
  window.addEventListener('touchend', onTouchEnd)
}

function onDragMove(e: MouseEvent) {
  const dx = e.clientX - startX
  const dy = e.clientY - startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    isDragging = true
    clickMoved = true
  }
  if (!isDragging) return
  const newRight = Math.max(8, Math.min(window.innerWidth - 80, startRight - dx))
  const newBottom = Math.max(8, Math.min(window.innerHeight - 80, startBottom - dy))
  triggerRight.value = newRight
  triggerBottom.value = newBottom
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length !== 1) return
  const dx = e.touches[0].clientX - startX
  const dy = e.touches[0].clientY - startY
  if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
    isDragging = true
    clickMoved = true
    e.preventDefault() // prevent page scroll while dragging
  }
  if (!isDragging) return
  const newRight = Math.max(8, Math.min(window.innerWidth - 80, startRight - dx))
  const newBottom = Math.max(8, Math.min(window.innerHeight - 80, startBottom - dy))
  triggerRight.value = newRight
  triggerBottom.value = newBottom
}

function onDragEnd() {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

function onTouchEnd() {
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

function onTriggerClick() {
  if (clickMoved) { clickMoved = false; return }
  toggleChat()
}

const quickPrompts = [
  '新增一个客户',
  '本月销售总额是多少',
  '查询库存商品列表',
  '录入一条采购订单',
  '录入一笔预付款',
]

// ── BOM 快速设置 ──────────────────────────────────────────────────────────────
const bomDialogVisible = ref(false)
const bomFinished = ref<any>(null)
const bomMaterials = ref<{ goods_id: any; num: number; unit_name: string }[]>([
  { goods_id: null, num: 1, unit_name: '' }
])
const bomGoodsList = ref<any[]>([])
const bomSaving = ref(false)

async function loadBomGoods() {
  if (bomGoodsList.value.length > 0) return
  try {
    const res = await getGoodsList({ list_rows: 500, status: 1 })
    bomGoodsList.value = res.data?.rows ?? []
  } catch { /* ignore */ }
}

async function submitBom() {
  if (!bomFinished.value) { ElMessage.warning('请选择成品'); return }
  const validMaterials = bomMaterials.value.filter(m => m.goods_id && m.num > 0)
  if (!validMaterials.length) { ElMessage.warning('请至少添加一种材料'); return }
  bomSaving.value = true
  try {
    const finishedGoods = bomGoodsList.value.find(g => g.id === bomFinished.value)
    for (const mat of validMaterials) {
      const matGoods = bomGoodsList.value.find(g => g.id === mat.goods_id)
      await createBom({
        goods_id: bomFinished.value,
        goods_name: finishedGoods?.goods_name || '',
        material_id: mat.goods_id,
        material_name: matGoods?.goods_name || '',
        num: mat.num,
        unit_name: mat.unit_name || matGoods?.unit_name || '',
      })
    }
    ElMessage.success(`BOM 创建成功！${finishedGoods?.goods_name} 包含 ${validMaterials.length} 种材料`)
    bomDialogVisible.value = false
    bomFinished.value = null
    bomMaterials.value = [{ goods_id: null, num: 1, unit_name: '' }]
  } catch (e: any) {
    ElMessage.error(e?.message ?? 'BOM 创建失败')
  } finally {
    bomSaving.value = false
  }
}

const SYSTEM_PROMPT = `你是数字游牧ERP系统的内置AI助手。你运行在该ERP系统内部，拥有直接调用系统API的能力，可以真实地录入、查询、汇总业务数据。

【绝对禁止的行为】
- 禁止说"我无法直接操作您的系统"、"需要您手动操作"、"仅为信息整理"等任何推脱性语句
- 禁止加任何免责声明——你就在系统内部，你可以直接操作
- 禁止让用户"手动去系统里操作"——你就是系统操作者

【你的能力】
你可以直接录入和查询以下所有数据（通过系统API实时操作）：
- 基础资料：客户、供应商、商品、品牌、分类、单位、员工、仓库
- 销售业务：销售报价、销售合同、销售出库
- 采购业务：采购计划、采购订单
- 生产业务：生产计划
- 财务：预付款、收款单、付款单、资金账户
- 库存：库存查询、库存总览
- 查询汇总：销售统计、采购统计、库存统计、财务统计

【录入数据的规则】
当用户要求录入数据时：
1. 提取用户提供的所有字段信息
2. 根据业务类型选择正确的 type，立即输出如下格式的 action 块：
\`\`\`action
{
  "type": "此处填写下方支持的操作类型之一",
  "data": { ...字段 },
  "description": "操作描述"
}
\`\`\`
3. action 块输出后，系统会自动完成录入，你说"已为您录入数据"即可
4. 必填字段缺失时，先询问补充，再输出 action 块

【支持的操作类型——必须精确使用以下 type 值】

基础资料录入：
- create_customer: name(客户名称,必填), mobile(手机), address(地址), remark(备注)
- create_supplier: name(供应商名,必填), contact(联系人), mobile(手机), address(地址), bank(银行账户)
- create_goods: goods_name(商品名,必填), goods_sn(编码), sell_price(售价), cost_price(成本价), unit_name(单位), cate_name(分类), spec(规格), barcode(条码)
- create_goods_brand: name(品牌名,必填), remark(备注)
- create_goods_cate: name(分类名,必填), remark(备注)
- create_goods_unit: name(单位名,必填)
- create_staff: name(姓名,必填), mobile(手机), dept(部门), jobs(职位)
- create_warehouse: name(仓库名,必填), remark(备注)

业务单据录入：
- create_sale_order: customer_name(客户,必填), total_amount(金额), remark(备注)
- create_procure_order: supplier_name(供应商,必填), total_amount(金额), remark(备注)
- create_collect_receipt: contact_name(收款对象,必填), amount(金额,必填), fund_id(账户ID), fund_name(账户名), receipt_date(日期), remark(备注)
- create_pay_receipt: contact_name(付款对象,必填), amount(金额,必填), fund_id(账户ID), fund_name(账户名), pay_date(日期), remark(备注)

财务录入：
- create_prepay: amount(金额,必填), pay_type("supplier"或"customer"), supplier_name(供应商名), customer_name(客户名), pay_date(日期YYYY-MM-DD), fund_id(账户ID), fund_name(付款账户), remark(备注)
- create_fund_account: name(账户名,必填), balance(初始余额)

【create_prepay 使用规则】
- 用户说"预付款"、"预付"、"付定金"、"押金"、"充值余额"等，必须使用 create_prepay
- pay_type=supplier：向供应商预付（默认）
- pay_type=customer：客户预充值/预收款

【图像识别规则】
当用户上传单据图片时（出库单、入库单、采购单、收款单等）：
1. 仔细识别图片中所有文字信息
2. 提取：单据类型、单号、日期、客户/供应商、商品明细（名称、数量、单价、合计）、金额合计、备注等
3. 根据单据类型判断对应的 action type：
   - 出库单/发货单 → create_sale_order（出库操作）
   - 入库单/采购单 → create_procure_order（采购操作）
   - 收款单/回款单 → create_collect_receipt
   - 付款单 → create_pay_receipt
4. 告知用户识别到的内容，确认后输出 action 块录入

回复简洁友好，中文。`

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

// ── Data query helpers ────────────────────────────────────────────────────────
async function fetchContextData(text: string): Promise<string> {
  const lower = text.toLowerCase()
  const results: string[] = []
  try {
    // Sales data
    if (lower.includes('销售') || lower.includes('出货') || lower.includes('收入') || lower.includes('营业额') || lower.includes('合同')) {
      const [outRes, contractRes]: any[] = await Promise.all([
        http.get('/stock/SaleOutOrder/index', { params: { list_rows: 100 } }),
        http.get('/shop/ContractOrder/index', { params: { list_rows: 50 } }),
      ])
      const outRows: any[] = outRes?.data?.rows || []
      const outTotal = outRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【销售出货单】共 ${outRows.length} 条，合计 ¥${outTotal.toFixed(2)}。最近5条：${JSON.stringify(outRows.slice(0, 5).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount, 日期: String(r.out_date || r.created_at || '').slice(0,10) })))}`)
      const contractRows: any[] = contractRes?.data?.rows || []
      const contractTotal = contractRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【销售合同】共 ${contractRows.length} 份，合计 ¥${contractTotal.toFixed(2)}`)
    }
    // Stock/inventory data
    if (lower.includes('库存') || lower.includes('库') || lower.includes('存货') || lower.includes('库存总览')) {
      const res: any = await http.get('/stock/StockAll/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      const totalVal = rows.reduce((s: number, r: any) => s + Number(r.qty || 0) * Number(r.avg_price || 0), 0)
      results.push(`【库存数据】共 ${rows.length} 种商品，库存总价值约 ¥${totalVal.toFixed(2)}。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty, 单位: r.unit_name, 仓库: r.warehouse_name })))}`)
    }
    // Customer data
    if (lower.includes('客户')) {
      const res: any = await http.get('/shop/ShopCustomer/index', { params: { list_rows: 200 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【客户数据】共 ${res?.data?.total || rows.length} 位客户。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`)
    }
    // Supplier data
    if (lower.includes('供应商')) {
      const res: any = await http.get('/procure/supplier/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【供应商数据】共 ${res?.data?.total || rows.length} 家供应商。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`)
    }
    // Goods/products data
    if (lower.includes('商品') || lower.includes('产品') || lower.includes('品牌') || lower.includes('分类')) {
      const [goodsRes, brandRes, cateRes]: any[] = await Promise.all([
        http.get('/goods/ShopGoods/index', { params: { list_rows: 100 } }),
        http.get('/goods/ShopBrand/index', { params: { list_rows: 50 } }),
        http.get('/goods/ShopGoodsCate/index', { params: { list_rows: 50 } }),
      ])
      const rows: any[] = goodsRes?.data?.rows || []
      results.push(`【商品数据】共 ${goodsRes?.data?.total || rows.length} 种。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 商品名: r.goods_name, 编码: r.goods_sn, 售价: r.sell_price, 分类: r.cate_name })))}`)
      const brands: any[] = brandRes?.data?.rows || []
      if (brands.length) results.push(`【品牌列表】${brands.map((b: any) => b.name).join('、')}`)
      const cates: any[] = cateRes?.data?.rows || []
      if (cates.length) results.push(`【商品分类】${cates.map((c: any) => c.name).join('、')}`)
    }
    // Purchase data
    if (lower.includes('采购') || lower.includes('进货')) {
      const res: any = await http.get('/stock/PurchaseOrder/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【采购订单】共 ${rows.length} 条，合计 ¥${total.toFixed(2)}。最近5条：${JSON.stringify(rows.slice(0, 5).map((r: any) => ({ 供应商: r.supplier_name, 金额: r.total_amount, 日期: String(r.order_date || r.created_at || '').slice(0,10) })))}`)
    }
    // Finance - receivables/payables
    if (lower.includes('应收') || lower.includes('应付') || lower.includes('收款') || lower.includes('付款') || lower.includes('财务')) {
      const [collectRes, payRes, receivableRes, payableRes]: any[] = await Promise.all([
        http.get('/finance/CollectReceipt/index', { params: { list_rows: 50 } }),
        http.get('/finance/PayReceipt/index', { params: { list_rows: 50 } }),
        http.get('/finance/CollectAccounts/index', { params: { list_rows: 50 } }),
        http.get('/finance/PayAccounts/index', { params: { list_rows: 50 } }),
      ])
      const collectRows: any[] = collectRes?.data?.rows || []
      const collectTotal = collectRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      results.push(`【收款单】共 ${collectRows.length} 条，合计 ¥${collectTotal.toFixed(2)}`)
      const payRows: any[] = payRes?.data?.rows || []
      const payTotal = payRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      results.push(`【付款单】共 ${payRows.length} 条，合计 ¥${payTotal.toFixed(2)}`)
      const receivable: any[] = receivableRes?.data?.rows || []
      const receivableTotal = receivable.reduce((s: number, r: any) => s + Number(r.un_receive_amount || 0), 0)
      results.push(`【应收账款】共 ${receivable.length} 笔未收，合计未收 ¥${receivableTotal.toFixed(2)}`)
      const payable: any[] = payableRes?.data?.rows || []
      const payableTotal = payable.reduce((s: number, r: any) => s + Number(r.un_pay_amount || 0), 0)
      results.push(`【应付账款】共 ${payable.length} 笔未付，合计未付 ¥${payableTotal.toFixed(2)}`)
    }
    // Fund accounts
    if (lower.includes('账户') || lower.includes('余额') || lower.includes('资金') || lower.includes('预付')) {
      const [fundRes, prepayRes]: any[] = await Promise.all([
        http.get('/finance/Fund/index', { params: { list_rows: 100 } }),
        http.get('/finance/Prepay/index', { params: { list_rows: 50 } }),
      ])
      const funds: any[] = fundRes?.data?.rows || []
      const totalBalance = funds.reduce((s: number, f: any) => s + Number(f.balance || 0), 0)
      results.push(`【资金账户】共 ${funds.length} 个账户，总余额 ¥${totalBalance.toFixed(2)}。账户明细：${JSON.stringify(funds.map((f: any) => ({ id: f.id, name: f.name, balance: f.balance })))}（录入时需用 fund_id）`)
      const prepayRows: any[] = prepayRes?.data?.rows || []
      const prepayTotal = prepayRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
      results.push(`【预付款】共 ${prepayRows.length} 条，合计 ¥${prepayTotal.toFixed(2)}。最近5条：${JSON.stringify(prepayRows.slice(0, 5).map((r: any) => ({ 单号: r.order_sn, 供应商: r.supplier_name, 客户: r.customer_name, 金额: r.amount, 日期: r.pay_date })))}`)
    }
    // Staff/employees
    if (lower.includes('员工') || lower.includes('人员') || lower.includes('职员')) {
      const res: any = await http.get('/personnel/staff/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【员工数据】共 ${res?.data?.total || rows.length} 名员工。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 姓名: r.name, 手机: r.mobile, 部门: r.dept, 职位: r.jobs })))}`)
    }
    // Warehouse
    if (lower.includes('仓库') || lower.includes('仓')) {
      const res: any = await http.get('/stock/WarehouseName/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【仓库列表】共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`)
    }
    // Production
    if (lower.includes('生产') || lower.includes('生产计划')) {
      const res: any = await http.get('/production/plan/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【生产计划】共 ${rows.length} 条。最近5条：${JSON.stringify(rows.slice(0, 5).map((r: any) => ({ 单号: r.order_sn, 商品: r.goods_name, 排产: r.schedule_num, 已生产: r.actual_num })))}`)
    }
  } catch {
    // ignore fetch errors
  }
  return results.join('\n\n')
}

// ── Agent identity helpers ────────────────────────────────────────────────────
const AGENT_COLORS: Record<string, string> = {
  captain: '#6366f1',
  copywriter: '#f59e0b',
  poster: '#ec4899',
  video: '#ef4444',
  brand: '#8b5cf6',
  publisher: '#10b981',
  trend: '#06b6d4',
}
const AGENT_EMOJIS: Record<string, string> = {
  captain: '🎯',
  copywriter: '✍️',
  poster: '🎨',
  video: '🎬',
  brand: '💎',
  publisher: '🚀',
  trend: '📈',
}
function getAgentColor(agentId: string) { return AGENT_COLORS[agentId] || '#6366f1' }
function getAgentEmoji(agentId: string) { return AGENT_EMOJIS[agentId] || '🤖' }

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

  // Fetch relevant backend data for query intent
  let contextData = ''
  if (text) {
    contextData = await fetchContextData(text)
  }

  // Build messages for API — last 20 messages, exclude image previews (not transferable)
  // Also strip any old "I cannot operate" disclaimer messages from history context
  const BAD_PHRASES = ['无法直接操作', '仅为信息整理', '需要您手动', '手动在对应系统']
  const apiMessages = messages.value
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .filter((m) => !BAD_PHRASES.some(p => m.content.includes(p)))
    .slice(-20)
    .map((m) => ({ role: m.role, content: m.content }))

  // Inject data context into the last user message if we fetched something
  if (contextData && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1]
    apiMessages[apiMessages.length - 1] = {
      role: last.role,
      content: `${last.content}\n\n[系统数据上下文]\n${contextData}`,
    }
  }

  let assistantText = ''
  // 多Agent：agentId → 对应的消息对象
  const agentMsgMap: Record<string, Message> = {}
  const assistantMsg: Message = { role: 'assistant', content: '', time: getNow(), toolCalls: [] }
  messages.value.push(assistantMsg)
  agentMsgMap['erp'] = assistantMsg

  try {
    const erpToken = localStorage.getItem('erp_token') || ''
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': erpToken,
      },
      body: JSON.stringify({
        messages: apiMessages,
        images: imagesToSend.length > 0
          ? imagesToSend.map(i => ({ data: i.data, mediaType: i.mediaType }))
          : undefined,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(errText || `HTTP ${response.status}`)
    }

    const contentType = response.headers.get('content-type') || ''

    if (contentType.includes('text/event-stream')) {
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      if (!reader) throw new Error('无法读取响应流')
      let buffer = ''
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6).trim()
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'text') {
              assistantText += parsed.text
              assistantMsg.content = assistantText
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'agent_ack') {
              // 员工接令消息 — 单独气泡，简短
              const ackMsg: Message = {
                role: 'assistant',
                content: parsed.text || '收到，开始执行。',
                time: getNow(),
                toolCalls: [],
                agentId: parsed.agentId,
                agentName: parsed.agentName,
                agentEmoji: parsed.emoji,
                agentColor: getAgentColor(parsed.agentId),
                isAck: true,
              }
              messages.value.push(ackMsg)
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'agent_thinking') {
              // 员工或Captain正在输出内容
              const aId = parsed.agentId || 'captain'
              if (!agentMsgMap[aId]) {
                const newMsg: Message = {
                  role: 'assistant',
                  content: '',
                  time: getNow(),
                  toolCalls: [],
                  agentId: aId,
                  agentName: parsed.agentName,
                  agentEmoji: parsed.emoji || getAgentEmoji(aId),
                  agentColor: getAgentColor(aId),
                }
                messages.value.push(newMsg)
                agentMsgMap[aId] = newMsg
              }
              agentMsgMap[aId].content += parsed.text || ''
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'agent_done') {
              // 员工任务完成，不需额外操作（内容已通过 agent_thinking 追加）
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'tool_start') {
              // tool_start 挂在当前活跃的agent消息上
              const activeMsg = agentMsgMap[parsed.agentId || 'captain'] || assistantMsg
              activeMsg.toolCalls!.push({ id: parsed.id, name: parsed.name, input: parsed.input || {}, status: 'running' })
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'tool_result') {
              // 找到对应的 tool call 更新状态
              for (const msg of Object.values(agentMsgMap)) {
                const tc = msg.toolCalls?.find(t => t.id === parsed.id)
                if (tc) {
                  tc.result = parsed.result
                  tc.status = (parsed.result?.startsWith('工具执行出错') || parsed.result?.startsWith('创建失败')) ? 'error' : 'success'
                  break
                }
              }
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error)
            } else if (parsed.error) {
              throw new Error(parsed.error)
            }
          } catch (parseErr: any) {
            if (parseErr.message !== data) throw parseErr
          }
        }
      }
    } else {
      // Production: Cloudflare Function returns full Anthropic JSON response
      const result = await response.json()
      if (result.error) throw new Error(result.error.message || JSON.stringify(result.error))
      assistantText = result.content?.[0]?.text ?? result.choices?.[0]?.message?.content ?? ''
      assistantMsg.content = assistantText
      nextTick(() => scrollToBottom())
    }
  } catch (e: any) {
    assistantMsg.content = `抱歉，出现了错误：${e.message}`
    if (!isOpen.value) unread.value++
  } finally {
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

async function executeAction() {
  if (!pendingAction.value) return
  const actionType = pendingAction.value.type
  try {
    const res = await http.post(pendingAction.value.apiPath, normalizeActionData(actionType, pendingAction.value.data))
    // http interceptor already unwraps code=1 responses; res = { code, data, message }
    const orderSn = res?.data?.order_sn || res?.data?.id
    const navRoute = getListRoute(actionType)
    const extra = orderSn ? `单号：${orderSn}。` : ''
    ElMessage.success('数据录入成功！')
    messages.value.push({
      role: 'assistant',
      content: `✅ 数据已成功录入系统！${extra}如需继续操作，请告诉我。`,
      time: getNow(),
      navRoute,
    })
    pendingAction.value = null
  } catch (e: any) {
    const errMsg = e.message || e.msg || JSON.stringify(e)
    ElMessage.error('录入失败：' + errMsg)
    messages.value.push({
      role: 'assistant',
      content: `❌ 录入失败：${errMsg}\n\n请告诉我正确信息，我重新帮您录入。`,
      time: getNow(),
    })
    pendingAction.value = null
  }
}

// Normalize AI-generated field names to match what each API actually expects
function normalizeActionData(type: string, data: Record<string, any>): Record<string, any> {
  const d = { ...data }
  if (type === 'create_customer') {
    // API needs: name (not nickname — confirmed from ClientList.vue handleSubmit)
    const nameVal = d.name || d.nickname || d.customer_name || d['客户名称'] || d['名称']
    if (nameVal) {
      d.name = nameVal
      delete d.nickname; delete d.customer_name; delete d['客户名称']; delete d['名称']
    }
  }
  if (type === 'create_supplier') {
    // API needs: name
    const nameVal = d.name || d.supplier_name || d.nickname || d['供应商名'] || d['名称']
    if (nameVal) {
      d.name = nameVal
      delete d.supplier_name; delete d.nickname; delete d['供应商名']; delete d['名称']
    }
  }
  if (type === 'create_goods') {
    // API needs: goods_name
    const nameVal = d.goods_name || d.name || d['商品名'] || d['商品名称']
    if (nameVal) {
      d.goods_name = nameVal
      delete d.name; delete d['商品名']; delete d['商品名称']
    }
  }
  if (type === 'create_staff') {
    // API needs: name
    const nameVal = d.name || d.staff_name || d['姓名']
    if (nameVal) {
      d.name = nameVal
      delete d.staff_name; delete d['姓名']
    }
  }
  if (type === 'create_prepay') {
    // normalize amount
    if (d['金额']) { d.amount = d['金额']; delete d['金额'] }
    if (d['付款金额']) { d.amount = d['付款金额']; delete d['付款金额'] }
    if (d['预付款']) { d.amount = d['预付款']; delete d['预付款'] }
    if (d['供应商']) { d.supplier_name = d['供应商']; delete d['供应商'] }
    if (d['客户']) { d.customer_name = d['客户']; delete d['客户'] }
    if (d['付款日期']) { d.pay_date = d['付款日期']; delete d['付款日期'] }
    if (d['账户'] || d['付款账户']) { d.fund_name = d['账户'] || d['付款账户']; delete d['账户']; delete d['付款账户'] }
    if (d['备注']) { d.remark = d['备注']; delete d['备注'] }
    // default pay_type
    if (!d.pay_type) d.pay_type = d.customer_name ? 'customer' : 'supplier'
  }
  if (type === 'create_goods_brand' || type === 'create_goods_cate' || type === 'create_goods_unit' || type === 'create_warehouse') {
    const nameVal = d.name || d['名称'] || d['品牌名'] || d['分类名'] || d['单位名'] || d['仓库名']
    if (nameVal) {
      d.name = nameVal
      delete d['名称']; delete d['品牌名']; delete d['分类名']; delete d['单位名']; delete d['仓库名']
    }
  }
  console.log('[AI Action]', type, d)
  return d
}

function getApiPath(type: string): string {
  const map: Record<string, string> = {
    create_customer: '/shop/ShopCustomer/add',
    create_supplier: '/procure/supplier/add',
    create_goods: '/goods/ShopGoods/add',
    create_goods_brand: '/goods/ShopBrand/add',
    create_goods_cate: '/goods/ShopGoodsCate/add',
    create_goods_unit: '/goods/ShopUnit/add',
    create_staff: '/personnel/staff/add',
    create_warehouse: '/stock/WarehouseName/add',
    create_sale_order: '/shop/ContractOrder/add',
    create_procure_order: '/stock/PurchaseOrder/add',
    create_collect_receipt: '/finance/CollectReceipt/add',
    create_pay_receipt: '/finance/PayReceipt/add',
    create_prepay: '/finance/Prepay/create',
    create_fund_account: '/finance/Fund/add',
  }
  return map[type] || '/unknown'
}

function getListRoute(type: string): string {
  const map: Record<string, string> = {
    create_customer:       '/sale/client',
    create_supplier:       '/procure/supplier',
    create_goods:          '/goods/info',
    create_goods_brand:    '/goods/brand',
    create_goods_cate:     '/goods/cate',
    create_goods_unit:     '/goods/unit',
    create_staff:          '/personnel/staff',
    create_warehouse:      '/warehouse/name',
    create_sale_order:     '/sale/contract',
    create_procure_order:  '/procure/order',
    create_collect_receipt:'/finance/collect-receipt',
    create_pay_receipt:    '/finance/pay-receipt',
    create_prepay:         '/finance/prepay',
    create_fund_account:   '/finance/fund',
    create_retail_order:   '/retail/order',
  }
  return map[type] || ''
}

function navigateTo(route: string) {
  if (!route) return
  router.push(route)
  isOpen.value = false
}


// iOS Safari does not support SpeechRecognition — hide the button to avoid triggering Siri
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
const SpeechRecognitionAPI = typeof window !== 'undefined' && !isIOS
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition)
  : null
const isRecording = ref(false)
const voiceSupported = ref(!!SpeechRecognitionAPI)
let recognition: any = null

function startVoice() {
  if (isRecording.value || !SpeechRecognitionAPI) return
  recognition = new SpeechRecognitionAPI()
  recognition.lang = 'zh-CN'
  recognition.continuous = false
  recognition.interimResults = false
  recognition.onstart = () => { isRecording.value = true }
  recognition.onresult = (e: any) => {
    const text = Array.from(e.results as any[])
      .map((r: any) => r[0].transcript)
      .join('')
    inputText.value = (inputText.value || '') + text
  }
  recognition.onerror = (e: any) => {
    isRecording.value = false
    if (e.error !== 'aborted') {
      const msg = e.error === 'not-allowed' ? '⚠️ 麦克风权限被拒绝' : `⚠️ 语音识别失败：${e.error}`
      messages.value = [...messages.value, { role: 'assistant', content: msg, time: getNow() }]
    }
  }
  recognition.onend = () => { isRecording.value = false }
  recognition.start()
}

function stopVoice() {
  if (recognition) { recognition.stop(); recognition = null }
  isRecording.value = false
}

function toggleVoice() {
  if (isRecording.value) stopVoice()
  else startVoice()
}

function showIOSVoiceTip() {
  ElMessage.info('请点击输入框唤起键盘，再点击键盘右下角🎤语音键说话')
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
  localStorage.removeItem(HISTORY_KEY)
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
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: grab;
  color: #fff;
  box-shadow: 0 8px 24px rgba(22, 93, 255, 0.4);
  transition: box-shadow 0.2s;
  z-index: 1000;
  gap: 2px;
  user-select: none;
}

.ai-trigger:hover {
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
  width: 400px;
  height: 580px;
  background: var(--card-bg);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
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
  cursor: grab;
  user-select: none;
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
  color: var(--dark);
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

.bom-quick-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #7c3aed;
  background: #f5f3ff;
  border: 1.5px solid #ddd6fe;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
}
.bom-quick-btn:hover { background: #ede9fe; border-color: #c4b5fd; }

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
  background: var(--gray);
  color: var(--dark);
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

.message-nav-btn {
  margin-top: 8px;
}

/* ── 多Agent 会话样式 ── */
.agent-emoji {
  font-size: 15px;
  line-height: 1;
}

.agent-label {
  font-size: 11px;
  font-weight: 600;
  margin-bottom: 3px;
  padding-left: 2px;
  letter-spacing: 0.3px;
}

.captain-label {
  color: #6366f1;
}

/* 接令气泡：简短、透明感 */
.message-ack .message-content {
  background: #f8f9ff;
  color: #6366f1;
  font-size: 12px;
  padding: 6px 10px;
  border: 1px solid #e0e1ff;
  border-radius: 8px;
  font-style: italic;
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

/* Backdrop for click-outside close */
.ai-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: transparent;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

.chat-native-textarea {
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: inherit;
  line-height: 1.6;
  color: var(--dark);
  background: var(--card-bg);
  resize: none;
  outline: none;
  transition: border-color 0.2s;
  display: block;
}
.chat-native-textarea:focus { border-color: #409eff; }
.chat-native-textarea:disabled { background: #f5f7fa; color: #c0c4cc; cursor: not-allowed; }
.chat-native-textarea::placeholder { color: #c0c4cc; }

.mic-active { animation: mic-pulse 1s ease-in-out infinite; }
@keyframes mic-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(245, 63, 63, 0.4); }
  50% { box-shadow: 0 0 0 6px rgba(245, 63, 63, 0); }
}

/* Mobile: full-width panel */
@media (max-width: 480px) {
  .ai-chat-panel {
    width: calc(100vw - 16px);
    height: 70vh;
    left: 8px !important;
    right: 8px !important;
    bottom: 90px !important;
  }
}
</style>
