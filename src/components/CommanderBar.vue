<template>
  <!-- Commander Bar — fixed top strip across all pages -->
  <div class="commander-bar" :class="{ 'is-expanded': isExpanded }">
    <!-- Collapsed strip -->
    <div class="bar-strip" @click.self="toggleExpand">
      <!-- Left: icon + status + last message preview -->
      <div class="bar-left" @click="toggleExpand">
        <div class="bar-icon">
          <el-icon :size="15"><Cpu /></el-icon>
        </div>
        <div class="bar-status-dot" :class="isLoading ? 'dot-loading' : 'dot-online'" />
        <span class="bar-label">指挥官</span>
        <span v-if="lastMsg" class="bar-preview">{{ lastMsg }}</span>
        <span v-else class="bar-hint">用自然语言指挥 ERP 系统...</span>
      </div>

      <!-- Right: quick send + expand toggle -->
      <div class="bar-right" @click.stop>
        <input
          v-if="!isExpanded"
          ref="quickInputRef"
          v-model="quickText"
          class="bar-quick-input"
          placeholder="输入指令..."
          @keydown.enter.exact.prevent="sendQuick"
          @click.stop
        />
        <button class="bar-send-btn" :class="{ loading: isLoading }" @click.stop="isExpanded ? null : sendQuick()" :disabled="isLoading">
          <el-icon v-if="!isLoading"><Promotion /></el-icon>
          <span v-else class="mini-spinner" />
        </button>
        <button class="bar-expand-btn" @click.stop="toggleExpand" :title="isExpanded ? '收起' : '展开详情'">
          <el-icon :size="13"><ArrowDown v-if="!isExpanded" /><ArrowUp v-else /></el-icon>
        </button>
      </div>
    </div>

    <!-- Expanded panel (slides down) -->
    <transition name="bar-expand">
      <div v-if="isExpanded" class="bar-panel" @click.stop>
        <!-- Panel header -->
        <div class="panel-header">
          <div class="panel-header-info">
            <div class="panel-avatar"><el-icon :size="16"><Cpu /></el-icon></div>
            <div>
              <div class="panel-title">数字游牧 AI 助手</div>
              <div class="panel-status">{{ isLoading ? '正在处理...' : '在线 · 随时响应' }}</div>
            </div>
          </div>
          <div class="panel-actions">
            <el-tooltip content="清空对话">
              <button class="panel-icon-btn" @click="clearMessages">
                <el-icon :size="14"><Delete /></el-icon>
              </button>
            </el-tooltip>
            <button class="panel-icon-btn" @click="isExpanded = false">
              <el-icon :size="14"><Close /></el-icon>
            </button>
          </div>
        </div>

        <!-- Messages -->
        <div ref="messagesRef" class="panel-messages">
          <!-- Welcome -->
          <div v-if="messages.length === 0" class="panel-welcome">
            <el-icon :size="32" color="#165dff"><Cpu /></el-icon>
            <p class="welcome-title">你好！我是数字游牧 AI 助手</p>
            <p class="welcome-sub">用自然语言描述业务需求，我来帮你录入和查询数据</p>
            <div class="quick-prompts">
              <span v-for="p in quickPrompts" :key="p" class="quick-tag" @click="sendQuickPrompt(p)">{{ p }}</span>
            </div>
          </div>

          <div
            v-for="(msg, idx) in messages"
            :key="idx"
            class="msg-item"
            :class="msg.role === 'user' ? 'msg-user' : 'msg-assistant'"
          >
            <div class="msg-avatar">
              <el-icon v-if="msg.role === 'assistant'"><Cpu /></el-icon>
              <el-icon v-else><User /></el-icon>
            </div>
            <div class="msg-bubble">
              <AiToolCallCard
                v-for="tc in msg.toolCalls"
                :key="tc.id"
                :name="tc.name"
                :input="tc.input"
                :result="tc.result"
                :status="tc.status"
              />
              <div class="msg-text" v-html="renderMarkdown(msg.content)" />
              <div v-if="msg.navRoute" class="msg-nav">
                <el-button type="primary" size="small" @click="navigateTo(msg.navRoute!)">立即查看 →</el-button>
              </div>
              <div class="msg-time">{{ msg.time }}</div>
            </div>
          </div>

          <!-- Typing indicator -->
          <div v-if="isLoading" class="msg-item msg-assistant">
            <div class="msg-avatar"><el-icon><Cpu /></el-icon></div>
            <div class="msg-bubble">
              <div class="typing-dots"><span /><span /><span /></div>
            </div>
          </div>
        </div>

        <!-- Input area -->
        <div class="panel-input">
          <!-- Image previews -->
          <div v-if="pendingImages.length" class="pending-imgs">
            <div v-for="(img, i) in pendingImages" :key="i" class="pending-img-wrap">
              <img :src="img.previewUrl" class="pending-img-thumb" />
              <button class="pending-img-remove" @click="removePendingImage(i)">
                <el-icon :size="10"><Close /></el-icon>
              </button>
            </div>
          </div>

          <div class="input-row">
            <textarea
              ref="textareaRef"
              v-model="inputText"
              class="panel-textarea"
              rows="2"
              :placeholder="isRecording ? '正在聆听，请说话...' : '输入业务描述，Enter 发送...'"
              :disabled="isLoading"
              @keydown.enter.exact.prevent="sendMessage"
              @keydown.enter.shift.exact="inputText += '\n'"
            />
            <div class="input-btns">
              <el-tooltip content="上传图片">
                <button class="input-icon-btn" @click="openImagePicker" :disabled="isLoading">
                  <el-icon :size="14"><Picture /></el-icon>
                </button>
              </el-tooltip>
              <el-tooltip v-if="voiceSupported" :content="isRecording ? '停止' : '语音'">
                <button class="input-icon-btn" :class="{ 'mic-on': isRecording }" @click="toggleVoice" :disabled="isLoading">
                  <el-icon :size="14"><Microphone /></el-icon>
                </button>
              </el-tooltip>
              <button class="input-send-btn" :disabled="isLoading || (!inputText.trim() && !pendingImages.length)" @click="sendMessage">
                <el-icon v-if="!isLoading"><Promotion /></el-icon>
                <span v-else class="mini-spinner" />
              </button>
            </div>
          </div>
          <input ref="fileInputRef" type="file" accept="image/*" multiple style="display:none" @change="onFileChange" />
        </div>
      </div>
    </transition>
  </div>

  <!-- BOM dialog -->
  <el-dialog v-model="bomDialogVisible" title="一键设置 BOM 物料清单" width="500px" append-to-body>
    <div style="margin-bottom:12px;font-size:13px;color:#64748b">请选择成品和组成材料，系统将自动创建BOM清单。</div>
    <el-form label-width="80px">
      <el-form-item label="成品">
        <el-select v-model="bomFinished" placeholder="请选择成品" filterable style="width:100%" @focus="loadBomGoods">
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
          <el-button type="primary" link @click="bomMaterials.push({ goods_id: null, num: 1, unit_name: '' })">+ 添加材料</el-button>
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
import { Cpu, Delete, Close, User, Promotion, Picture, Microphone, ArrowDown, ArrowUp } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'
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
}

interface ImageItem {
  previewUrl: string
  data: string
  mediaType: string
}

function isToolResultError(result: unknown): boolean {
  const text = String(result ?? '')
  return /\[FAILED\]|失败|错误|出错|Error|error/.test(text)
}

// ── Persistence ────────────────────────────────────────────────────────────────
const HISTORY_KEY = 'erp_ai_chat_history'
const MAX_HISTORY = 100

function loadHistory(): Message[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) return JSON.parse(raw) as Message[]
  } catch {}
  return []
}

function saveHistory(msgs: Message[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(msgs.slice(-MAX_HISTORY)))
  } catch {}
}

const router = useRouter()
const isExpanded = ref(false)
const inputText = ref('')
const quickText = ref('')
const messages = ref<Message[]>(loadHistory())
const isLoading = ref(false)
const messagesRef = ref<HTMLDivElement>()
const pendingImages = ref<ImageItem[]>([])
const fileInputRef = ref<HTMLInputElement>()
const textareaRef = ref<HTMLTextAreaElement>()
const quickInputRef = ref<HTMLInputElement>()

watch(messages, (val) => saveHistory(val), { deep: true })

// last assistant message preview for the bar strip
const lastMsg = computed(() => {
  for (let i = messages.value.length - 1; i >= 0; i--) {
    if (messages.value[i].role === 'assistant' && messages.value[i].content) {
      const txt = messages.value[i].content.replace(/<[^>]+>/g, '').slice(0, 60)
      return txt
    }
  }
  return ''
})

const quickPrompts = ['新增一个客户', '本月销售总额', '查询库存', '录入采购订单', '录入预付款']

// ── BOM ────────────────────────────────────────────────────────────────────────
const bomDialogVisible = ref(false)
const bomFinished = ref<any>(null)
const bomMaterials = ref<{ goods_id: any; num: number; unit_name: string }[]>([{ goods_id: null, num: 1, unit_name: '' }])
const bomGoodsList = ref<any[]>([])
const bomSaving = ref(false)

async function loadBomGoods() {
  if (bomGoodsList.value.length > 0) return
  try {
    const res = await getGoodsList({ list_rows: 500, status: 1 })
    bomGoodsList.value = res.data?.rows ?? []
  } catch {}
}

async function submitBom() {
  if (!bomFinished.value) { ElMessage.warning('请选择成品'); return }
  const valid = bomMaterials.value.filter(m => m.goods_id && m.num > 0)
  if (!valid.length) { ElMessage.warning('请至少添加一种材料'); return }
  bomSaving.value = true
  try {
    const finished = bomGoodsList.value.find(g => g.id === bomFinished.value)
    for (const mat of valid) {
      const matG = bomGoodsList.value.find(g => g.id === mat.goods_id)
      await createBom({ goods_id: bomFinished.value, goods_name: finished?.goods_name || '', material_id: mat.goods_id, material_name: matG?.goods_name || '', num: mat.num, unit_name: mat.unit_name || matG?.unit_name || '' })
    }
    ElMessage.success(`BOM 创建成功！${finished?.goods_name} 包含 ${valid.length} 种材料`)
    bomDialogVisible.value = false
    bomFinished.value = null
    bomMaterials.value = [{ goods_id: null, num: 1, unit_name: '' }]
  } catch (e: any) {
    ElMessage.error(e?.message ?? 'BOM 创建失败')
  } finally {
    bomSaving.value = false
  }
}

// ── Toggle ─────────────────────────────────────────────────────────────────────
function toggleExpand() {
  isExpanded.value = !isExpanded.value
  if (isExpanded.value) {
    nextTick(() => {
      scrollToBottom()
      textareaRef.value?.focus()
    })
  }
}

// ── Quick send from strip ──────────────────────────────────────────────────────
async function sendQuick() {
  const text = quickText.value.trim()
  if (!text || isLoading.value) return
  quickText.value = ''
  isExpanded.value = true
  await nextTick()
  inputText.value = text
  await sendMessage()
}

// ── Context data ───────────────────────────────────────────────────────────────
async function fetchContextData(text: string): Promise<string> {
  const lower = text.toLowerCase()
  const results: string[] = []
  try {
    if (lower.includes('销售') || lower.includes('出货') || lower.includes('收入') || lower.includes('营业额') || lower.includes('合同')) {
      const [outRes, contractRes]: any[] = await Promise.all([
        http.get('/stock/SaleOutOrder/index', { params: { list_rows: 100 } }),
        http.get('/shop/ContractOrder/index', { params: { list_rows: 50 } }),
      ])
      const outRows: any[] = outRes?.data?.rows || []
      const outTotal = outRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【销售出货单】共 ${outRows.length} 条，合计 ¥${outTotal.toFixed(2)}。最近5条：${JSON.stringify(outRows.slice(0, 5).map((r: any) => ({ 客户: r.customer_name, 金额: r.total_amount, 日期: fmtDt(r.out_date || r.created_at) })))}`)
      const contractRows: any[] = contractRes?.data?.rows || []
      const contractTotal = contractRows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【销售订单】共 ${contractRows.length} 份，合计 ¥${contractTotal.toFixed(2)}`)
    }
    if (lower.includes('库存') || lower.includes('存货')) {
      const res: any = await http.get('/stock/StockAll/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      const totalVal = rows.reduce((s: number, r: any) => s + Number(r.qty || 0) * Number(r.avg_price || 0), 0)
      results.push(`【库存数据】共 ${rows.length} 种商品，库存总价值约 ¥${totalVal.toFixed(2)}。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 商品: r.goods_name, 库存: r.qty, 单位: r.unit_name, 仓库: r.warehouse_name })))}`)
    }
    if (lower.includes('客户')) {
      const res: any = await http.get('/shop/ShopCustomer/index', { params: { list_rows: 200 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【客户数据】共 ${res?.data?.total || rows.length} 位客户。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 名称: r.nickname || r.name, 手机: r.mobile, 余额: r.balance })))}`)
    }
    if (lower.includes('供应商')) {
      const res: any = await http.get('/procure/supplier/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【供应商数据】共 ${res?.data?.total || rows.length} 家。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 名称: r.name, 联系人: r.contact, 手机: r.mobile })))}`)
    }
    if (lower.includes('商品') || lower.includes('产品')) {
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
    if (lower.includes('采购') || lower.includes('进货')) {
      const res: any = await http.get('/stock/PurchaseOrder/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      const total = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
      results.push(`【采购订单】共 ${rows.length} 条，合计 ¥${total.toFixed(2)}。最近5条：${JSON.stringify(rows.slice(0, 5).map((r: any) => ({ 供应商: r.supplier_name, 金额: r.total_amount, 日期: fmtDt(r.order_date || r.created_at) })))}`)
    }
    if (lower.includes('应收') || lower.includes('应付') || lower.includes('收款') || lower.includes('付款') || lower.includes('财务')) {
      const [collectRes, payRes, receivableRes, payableRes]: any[] = await Promise.all([
        http.get('/finance/CollectReceipt/index', { params: { list_rows: 50 } }),
        http.get('/finance/PayReceipt/index', { params: { list_rows: 50 } }),
        http.get('/finance/CollectAccounts/index', { params: { list_rows: 50 } }),
        http.get('/finance/PayAccounts/index', { params: { list_rows: 50 } }),
      ])
      const collectRows: any[] = collectRes?.data?.rows || []
      results.push(`【收款单】共 ${collectRows.length} 条，合计 ¥${collectRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0).toFixed(2)}`)
      const payRows: any[] = payRes?.data?.rows || []
      results.push(`【付款单】共 ${payRows.length} 条，合计 ¥${payRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0).toFixed(2)}`)
      const receivable: any[] = receivableRes?.data?.rows || []
      results.push(`【应收账款】共 ${receivable.length} 笔未收，合计未收 ¥${receivable.reduce((s: number, r: any) => s + Number(r.un_receive_amount || 0), 0).toFixed(2)}`)
      const payable: any[] = payableRes?.data?.rows || []
      results.push(`【应付账款】共 ${payable.length} 笔未付，合计未付 ¥${payable.reduce((s: number, r: any) => s + Number(r.un_pay_amount || 0), 0).toFixed(2)}`)
    }
    if (lower.includes('账户') || lower.includes('余额') || lower.includes('资金') || lower.includes('预付')) {
      const [fundRes, prepayRes]: any[] = await Promise.all([
        http.get('/finance/Fund/index', { params: { list_rows: 100 } }),
        http.get('/finance/Prepay/index', { params: { list_rows: 50 } }),
      ])
      const funds: any[] = fundRes?.data?.rows || []
      results.push(`【资金账户】共 ${funds.length} 个账户，总余额 ¥${funds.reduce((s: number, f: any) => s + Number(f.balance || 0), 0).toFixed(2)}。账户明细：${JSON.stringify(funds.map((f: any) => ({ id: f.id, name: f.name, balance: f.balance })))}（录入时需用 fund_id）`)
      const prepayRows: any[] = prepayRes?.data?.rows || []
      results.push(`【预付款】共 ${prepayRows.length} 条，合计 ¥${prepayRows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0).toFixed(2)}。最近5条：${JSON.stringify(prepayRows.slice(0, 5).map((r: any) => ({ 单号: r.order_sn, 供应商: r.supplier_name, 客户: r.customer_name, 金额: r.amount, 日期: r.pay_date })))}`)
    }
    if (lower.includes('员工') || lower.includes('人员')) {
      const res: any = await http.get('/personnel/staff/index', { params: { list_rows: 100 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【员工数据】共 ${res?.data?.total || rows.length} 名员工。前10条：${JSON.stringify(rows.slice(0, 10).map((r: any) => ({ 姓名: r.name, 手机: r.mobile, 部门: r.dept, 职位: r.jobs })))}`)
    }
    if (lower.includes('仓库') || lower.includes('仓')) {
      const res: any = await http.get('/stock/WarehouseName/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【仓库列表】共 ${rows.length} 个仓库：${rows.map((r: any) => r.name).join('、')}`)
    }
    if (lower.includes('生产')) {
      const res: any = await http.get('/production/plan/index', { params: { list_rows: 50 } })
      const rows: any[] = res?.data?.rows || []
      results.push(`【生产计划】共 ${rows.length} 条。最近5条：${JSON.stringify(rows.slice(0, 5).map((r: any) => ({ 单号: r.order_sn, 商品: r.goods_name, 排产: r.schedule_num, 已生产: r.actual_num })))}`)
    }
  } catch {}
  return results.join('\n\n')
}

// ── Send ───────────────────────────────────────────────────────────────────────
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
  nextTick(() => scrollToBottom())

  let contextData = ''
  if (text) contextData = await fetchContextData(text)

  const BAD_PHRASES = ['无法直接操作', '仅为信息整理', '需要您手动', '手动在对应系统']
  const apiMessages = messages.value
    .filter(m => m.role === 'user' || m.role === 'assistant')
    .filter(m => !BAD_PHRASES.some(p => m.content.includes(p)))
    .slice(-20)
    .map(m => ({ role: m.role, content: m.content }))

  if (contextData && apiMessages.length > 0) {
    const last = apiMessages[apiMessages.length - 1]
    apiMessages[apiMessages.length - 1] = { role: last.role, content: `${last.content}\n\n[系统数据上下文]\n${contextData}` }
  }

  let assistantText = ''
  const assistantMsg: Message = { role: 'assistant', content: '', time: getNow(), toolCalls: [] }
  messages.value.push(assistantMsg)

  try {
    const erpToken = localStorage.getItem('erp_token') || ''
    const response = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': erpToken },
      body: JSON.stringify({
        messages: apiMessages,
        images: imagesToSend.length > 0 ? imagesToSend.map(i => ({ data: i.data, mediaType: i.mediaType })) : undefined,
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
            } else if (parsed.type === 'tool_start') {
              assistantMsg.toolCalls!.push({ id: parsed.id, name: parsed.name, input: parsed.input || {}, status: 'running' })
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'tool_result') {
              const tc = assistantMsg.toolCalls!.find(t => t.id === parsed.id)
              if (tc) {
                tc.result = parsed.result
                tc.status = isToolResultError(parsed.result) ? 'error' : 'success'
              }
              nextTick(() => scrollToBottom())
            } else if (parsed.type === 'error') {
              throw new Error(parsed.error)
            }
          } catch (parseErr: any) {
            if (parseErr.message !== data) throw parseErr
          }
        }
      }
    } else {
      const result = await response.json()
      if (result.error) throw new Error(result.error.message || JSON.stringify(result.error))
      assistantText = result.content?.[0]?.text ?? result.choices?.[0]?.message?.content ?? ''
      assistantMsg.content = assistantText
      nextTick(() => scrollToBottom())
    }
  } catch (e: any) {
    assistantMsg.content = `抱歉，出现了错误：${e.message}`
  } finally {
    previewUrls.forEach(url => URL.revokeObjectURL(url))
    isLoading.value = false
    nextTick(() => scrollToBottom())
  }
}

function sendQuickPrompt(p: string) {
  inputText.value = p
  sendMessage()
}

function clearMessages() {
  messages.value = []
  localStorage.removeItem(HISTORY_KEY)
}

function scrollToBottom() {
  if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
}

function navigateTo(route: string) {
  if (!route) return
  router.push(route)
  isExpanded.value = false
}

function getNow() {
  return new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function renderMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
    .replace(/^- (.+)/gm, '• $1')
}

// ── Voice ──────────────────────────────────────────────────────────────────────
const isIOS = typeof window !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent)
const SpeechRecognitionAPI = typeof window !== 'undefined' && !isIOS
  ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null
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
    inputText.value = (inputText.value || '') + Array.from(e.results as any[]).map((r: any) => r[0].transcript).join('')
  }
  recognition.onerror = (e: any) => {
    isRecording.value = false
    if (e.error !== 'aborted') messages.value.push({ role: 'assistant', content: e.error === 'not-allowed' ? '⚠️ 麦克风权限被拒绝' : `⚠️ 语音识别失败：${e.error}`, time: getNow() })
  }
  recognition.onend = () => { isRecording.value = false }
  recognition.start()
}

function stopVoice() { if (recognition) { recognition.stop(); recognition = null }; isRecording.value = false }
function toggleVoice() { if (isRecording.value) stopVoice(); else startVoice() }

// ── Image upload ───────────────────────────────────────────────────────────────
function openImagePicker() { fileInputRef.value?.click() }

async function onFileChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    if (!file.type.startsWith('image/')) continue
    const data = await fileToBase64(file)
    pendingImages.value.push({ previewUrl: URL.createObjectURL(file), data, mediaType: file.type })
  }
  ;(e.target as HTMLInputElement).value = ''
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function removePendingImage(idx: number) {
  URL.revokeObjectURL(pendingImages.value[idx].previewUrl)
  pendingImages.value.splice(idx, 1)
}
</script>

<style scoped>
/* ── Commander Bar ─────────────────────────────────────────────────────────── */
.commander-bar {
  position: relative;
  z-index: 500;
  flex-shrink: 0;
}

/* Collapsed strip */
.bar-strip {
  height: 34px;
  background: linear-gradient(90deg, #0f172a 0%, #1e3a5f 60%, #1a56db 100%);
  display: flex;
  align-items: center;
  padding: 0 10px 0 12px;
  gap: 0;
  cursor: pointer;
  user-select: none;
  border-bottom: 1px solid rgba(255,255,255,0.08);
}

.bar-left {
  display: flex;
  align-items: center;
  gap: 7px;
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.bar-icon {
  width: 22px;
  height: 22px;
  background: rgba(255,255,255,0.12);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #93c5fd;
  flex-shrink: 0;
}

.bar-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.dot-online { background: #34d399; box-shadow: 0 0 0 2px rgba(52,211,153,0.3); }
.dot-loading {
  background: #fbbf24;
  box-shadow: 0 0 0 2px rgba(251,191,36,0.3);
  animation: pulse-dot 1s infinite;
}
@keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }

.bar-label {
  font-size: 12px;
  font-weight: 600;
  color: #e2e8f0;
  flex-shrink: 0;
  letter-spacing: 0.02em;
}

.bar-preview {
  font-size: 12px;
  color: rgba(255,255,255,0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.bar-hint {
  font-size: 12px;
  color: rgba(255,255,255,0.3);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.bar-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.bar-quick-input {
  height: 24px;
  width: 180px;
  background: rgba(255,255,255,0.1);
  border: 1px solid rgba(255,255,255,0.15);
  border-radius: 5px;
  color: #fff;
  font-size: 12px;
  padding: 0 8px;
  outline: none;
  transition: all 0.2s;
}
.bar-quick-input::placeholder { color: rgba(255,255,255,0.35); }
.bar-quick-input:focus { background: rgba(255,255,255,0.15); border-color: rgba(255,255,255,0.3); }

.bar-send-btn, .bar-expand-btn {
  width: 24px;
  height: 24px;
  background: rgba(255,255,255,0.12);
  border: none;
  border-radius: 5px;
  color: #93c5fd;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  padding: 0;
}
.bar-send-btn:hover, .bar-expand-btn:hover { background: rgba(255,255,255,0.22); }
.bar-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.bar-expand-btn { color: rgba(255,255,255,0.6); }

/* ── Expanded panel ──────────────────────────────────────────────────────────── */
.bar-expand-enter-active,
.bar-expand-leave-active {
  transition: max-height 0.3s ease, opacity 0.2s ease;
  overflow: hidden;
}
.bar-expand-enter-from,
.bar-expand-leave-to {
  max-height: 0;
  opacity: 0;
}
.bar-expand-enter-to,
.bar-expand-leave-from {
  max-height: 520px;
  opacity: 1;
}

.bar-panel {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  height: 480px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
  flex-shrink: 0;
}

.panel-header-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.panel-avatar {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
}

.panel-status {
  font-size: 11px;
  color: #86909c;
  margin-top: 1px;
}

.panel-actions {
  display: flex;
  gap: 4px;
}

.panel-icon-btn {
  width: 28px;
  height: 28px;
  background: none;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
  transition: all 0.15s;
}
.panel-icon-btn:hover { background: #f5f5f5; color: #4e5969; }

/* Messages */
.panel-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.panel-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 0 16px;
  gap: 6px;
}
.welcome-title { font-size: 14px; font-weight: 600; color: #1d2129; margin: 0; }
.welcome-sub { font-size: 12px; color: #86909c; margin: 0; text-align: center; }

.quick-prompts {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: center;
  margin-top: 8px;
}
.quick-tag {
  padding: 4px 10px;
  background: #f0f5ff;
  color: #165dff;
  border-radius: 20px;
  font-size: 12px;
  cursor: pointer;
  border: 1px solid #c8deff;
  transition: all 0.15s;
}
.quick-tag:hover { background: #d6e6ff; }

.msg-item {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}

.msg-user { flex-direction: row-reverse; }

.msg-avatar {
  width: 28px;
  height: 28px;
  background: #f0f2f5;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #86909c;
  font-size: 14px;
  flex-shrink: 0;
}

.msg-user .msg-avatar { background: #165dff; color: #fff; }

.msg-bubble {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.msg-text {
  background: #f5f7fa;
  border-radius: 10px;
  padding: 8px 12px;
  font-size: 13px;
  color: #1d2129;
  line-height: 1.6;
}

.msg-user .msg-text {
  background: #165dff;
  color: #fff;
}

.msg-time {
  font-size: 10px;
  color: #c0c4cc;
  padding: 0 4px;
}

.msg-user .msg-time { text-align: right; }

.msg-nav { padding: 0 4px; }

/* Typing */
.typing-dots {
  display: flex;
  gap: 4px;
  padding: 10px 14px;
  background: #f5f7fa;
  border-radius: 10px;
  align-items: center;
}
.typing-dots span {
  width: 6px;
  height: 6px;
  background: #c0c4cc;
  border-radius: 50%;
  animation: typing 1.2s infinite;
}
.typing-dots span:nth-child(2) { animation-delay: 0.2s; }
.typing-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes typing { 0%,60%,100% { transform:translateY(0) } 30% { transform:translateY(-4px) } }

/* Input area */
.panel-input {
  padding: 10px 14px 12px;
  border-top: 1px solid #f0f0f0;
  background: #fff;
  flex-shrink: 0;
}

.pending-imgs {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.pending-img-wrap { position: relative; }
.pending-img-thumb { width: 48px; height: 48px; object-fit: cover; border-radius: 6px; border: 1px solid #e5e7eb; }
.pending-img-remove {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 16px;
  height: 16px;
  background: #ef4444;
  border: none;
  border-radius: 50%;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.input-row {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.panel-textarea {
  flex: 1;
  resize: none;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  color: #1d2129;
  outline: none;
  line-height: 1.5;
  font-family: inherit;
  transition: border-color 0.2s;
}
.panel-textarea:focus { border-color: #165dff; }
.panel-textarea:disabled { background: #f9fafb; }

.input-btns {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex-shrink: 0;
}

.input-icon-btn {
  width: 30px;
  height: 30px;
  background: #f5f7fa;
  border: 1px solid #e5e7eb;
  border-radius: 7px;
  color: #86909c;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  padding: 0;
}
.input-icon-btn:hover { background: #eff3ff; color: #165dff; }
.input-icon-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.input-icon-btn.mic-on { background: #fee2e2; color: #ef4444; border-color: #fca5a5; }

.input-send-btn {
  width: 30px;
  height: 64px;
  background: linear-gradient(135deg, #165dff, #0e44cc);
  border: none;
  border-radius: 8px;
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s;
  padding: 0;
}
.input-send-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.input-send-btn:hover:not(:disabled) { opacity: 0.9; }

/* Mini spinner */
.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255,255,255,0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
</style>
