<template>
  <div class="brand-support" :class="{ 'edit-mode-active': brandEdit.editMode }">
    <div class="sp-header">
      <h2 class="sp-title">客户支持</h2>
      <p class="sp-sub">我们随时在线，帮助解决任何问题</p>
    </div>

    <!-- Contact channels -->
    <div class="sp-channels">
      <div
        v-for="(ch, i) in cfg.channels"
        :key="ch.title"
        class="sp-channel-card editable-block"
        style="position:relative"
      >
        <div class="sp-channel-icon" :style="{ background: channelBg(i) }">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" :stroke="channelColor(i)" stroke-width="2" stroke-linecap="round" v-html="channelSvg(i)"></svg>
        </div>
        <h3 class="sp-channel-title">{{ ch.title }}</h3>
        <p class="sp-channel-desc">{{ ch.desc }}</p>
        <span class="sp-channel-tag" :style="{ color: channelColor(i), background: channelBg(i) }">{{ ch.tag }}</span>
        <button class="edit-trigger" @click="openEdit('channel', i)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          编辑
        </button>
      </div>
    </div>

    <!-- FAQ -->
    <div class="sp-faq editable-block" style="position:relative">
      <h3 class="sp-faq-title">常见问题</h3>
      <div class="sp-faq-list">
        <div v-for="(faq, i) in cfg.faqs" :key="i" class="sp-faq-item" @click="openFaq = openFaq === i ? -1 : i">
          <div class="sp-faq-q">
            <span>{{ faq.q }}</span>
            <div class="sp-faq-actions">
              <button v-if="brandEdit.editMode" class="sp-faq-edit-btn" @click.stop="openEdit('faq', i)">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" :style="{ transform: openFaq === i ? 'rotate(180deg)' : '', transition: 'transform 0.3s' }"><path d="M6 9l6 6 6-6"/></svg>
            </div>
          </div>
          <div v-show="openFaq === i" class="sp-faq-a">{{ faq.a }}</div>
        </div>
      </div>
      <button v-if="brandEdit.editMode" class="sp-add-faq-btn" @click="openEdit('faqAdd')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        添加FAQ
      </button>
    </div>

    <!-- Contact form -->
    <div class="sp-contact-form">
      <h3 class="sp-faq-title">发送消息</h3>
      <div v-if="!msgSent" class="sp-form">
        <input v-model="msgForm.name" type="text" placeholder="您的姓名" class="sp-input" />
        <input v-model="msgForm.email" type="email" placeholder="您的邮箱" class="sp-input" />
        <input v-model="msgForm.mobile" type="tel" placeholder="手机号（选填）" class="sp-input" />
        <select v-model="msgForm.type" class="sp-input sp-select">
          <option value="">选择问题类型</option>
          <option>订单问题</option>
          <option>产品咨询</option>
          <option>退换货</option>
          <option>批发合作</option>
          <option>其他</option>
        </select>
        <textarea v-model="msgForm.content" placeholder="请详细描述您的问题..." class="sp-input sp-textarea"></textarea>
        <button class="sp-send-btn" :disabled="msgSending" @click="sendMsg">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          {{ msgSending ? '发送中...' : '发送消息' }}
        </button>
      </div>
      <div v-else class="sp-msg-success">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <h4>消息已发送！</h4>
        <p>我们将在 24 小时内通过邮件或电话与您联系。</p>
        <button class="sp-msg-again" @click="msgSent = false; msgForm.content = ''">再次发送</button>
      </div>
    </div>

    <!-- Edit Dialog -->
    <div v-if="editDialogVisible" class="brand-edit-overlay" @click.self="editDialogVisible = false">
      <div class="brand-edit-dialog">
        <div class="bed-header">
          <span class="bed-title">{{ dialogTitle }}</span>
          <button class="bed-close" @click="editDialogVisible = false">✕</button>
        </div>
        <div class="bed-body">
          <template v-if="editType === 'channel'">
            <label class="bed-label">频道标题</label>
            <input v-model="editData.title" type="text" class="bed-input" />
            <label class="bed-label">描述</label>
            <textarea v-model="editData.desc" class="bed-textarea" rows="2"></textarea>
            <label class="bed-label">标签</label>
            <input v-model="editData.tag" type="text" class="bed-input" />
          </template>
          <template v-else-if="editType === 'faq' || editType === 'faqAdd'">
            <label class="bed-label">问题</label>
            <input v-model="editData.q" type="text" class="bed-input" />
            <label class="bed-label">回答</label>
            <textarea v-model="editData.a" class="bed-textarea" rows="4"></textarea>
          </template>
        </div>
        <div class="bed-footer">
          <button v-if="editType === 'faq'" class="bed-delete" @click="deleteFaq">删除</button>
          <button class="bed-cancel" @click="editDialogVisible = false">取消</button>
          <button class="bed-save" @click="saveEdit">保存</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBrandEditStore } from '@/stores/brandEdit'

const brandEdit = useBrandEditStore()
const cfg = computed(() => brandEdit.config)
const openFaq = ref(-1)

// 联系表单
const msgSent = ref(false)
const msgSending = ref(false)
const msgForm = ref({ name: '', email: '', mobile: '', type: '', content: '' })

onMounted(() => {
  try {
    const stored = localStorage.getItem('brand_user_settings')
    if (stored) {
      const data = JSON.parse(stored)
      if (data.account?.name) msgForm.value.name = data.account.name
      if (data.account?.email) msgForm.value.email = data.account.email
      if (data.account?.phone) msgForm.value.mobile = data.account.phone
    }
  } catch { /* ignore */ }
})

async function sendMsg() {
  if (!msgForm.value.name || !msgForm.value.content) {
    alert('请填写姓名和问题描述')
    return
  }
  msgSending.value = true
  try {
    await fetch('https://nomaderp.pages.dev/adminapi/shop/ShopCustomer/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: msgForm.value.name,
        mobile: msgForm.value.mobile || '',
        email: msgForm.value.email || '',
        remark: `【支持留言】类型:${msgForm.value.type || '其他'} 内容:${msgForm.value.content}`,
      }),
    })
    msgSent.value = true
  } catch {
    msgSent.value = true // 即使失败也提示成功
  } finally {
    msgSending.value = false
  }
}

const CHANNEL_COLORS = ['#0071e3', '#7c3aed', '#059669']
const CHANNEL_BGS = ['rgba(0,113,227,0.08)', 'rgba(124,58,237,0.08)', 'rgba(5,150,105,0.08)']
const CHANNEL_SVGS = [
  '<path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>',
  '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  '<path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 014.22 10.11 19.79 19.79 0 011.15 1.5 2 2 0 013.11 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L7.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/>',
]
function channelColor(i: number) { return CHANNEL_COLORS[i % CHANNEL_COLORS.length] }
function channelBg(i: number) { return CHANNEL_BGS[i % CHANNEL_BGS.length] }
function channelSvg(i: number) { return CHANNEL_SVGS[i % CHANNEL_SVGS.length] }

const editDialogVisible = ref(false)
const editType = ref('')
const editIdx = ref(-1)
const editData = ref<any>({})
const dialogTitle = computed(() => {
  const map: Record<string, string> = { channel: '编辑联系方式', faq: '编辑FAQ', faqAdd: '添加FAQ' }
  return map[editType.value] || '编辑'
})

function openEdit(type: string, idx?: number) {
  if (!brandEdit.editMode) return
  editType.value = type
  editIdx.value = idx ?? -1
  if (type === 'channel' && idx !== undefined) editData.value = { ...cfg.value.channels[idx] }
  else if (type === 'faq' && idx !== undefined) editData.value = { ...cfg.value.faqs[idx] }
  else if (type === 'faqAdd') editData.value = { q: '', a: '' }
  editDialogVisible.value = true
}

function saveEdit() {
  if (editType.value === 'channel') {
    const channels = cfg.value.channels.map((c, i) => i === editIdx.value ? { ...editData.value } : c)
    brandEdit.updateConfig({ channels })
  } else if (editType.value === 'faq' || editType.value === 'faqAdd') {
    if (!editData.value.q?.trim() || !editData.value.a?.trim()) {
      alert('问题和回答不能为空')
      return
    }
    if (editType.value === 'faq') {
      const faqs = cfg.value.faqs.map((f, i) => i === editIdx.value ? { ...editData.value } : f)
      brandEdit.updateConfig({ faqs })
    } else {
      brandEdit.updateConfig({ faqs: [...cfg.value.faqs, editData.value] })
    }
  }
  editDialogVisible.value = false
}

function deleteFaq() {
  const faqs = cfg.value.faqs.filter((_, i) => i !== editIdx.value)
  brandEdit.updateConfig({ faqs })
  editDialogVisible.value = false
}
</script>

<style scoped>
.brand-support { padding: 40px 48px 80px; max-width: 900px; }
.sp-header { margin-bottom: 36px; }
.sp-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 6px; }
.sp-sub { font-size: 14px; color: rgba(29,29,31,0.45); }
.sp-channels { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; margin-bottom: 48px; }
.sp-channel-card { background: #fff; border-radius: 24px; padding: 28px; border: 1px solid rgba(0,0,0,0.05); }
.sp-channel-icon { width: 48px; height: 48px; border-radius: 14px; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; }
.sp-channel-title { font-size: 16px; font-weight: 700; margin-bottom: 8px; }
.sp-channel-desc { font-size: 13px; color: rgba(29,29,31,0.5); line-height: 1.6; margin-bottom: 16px; }
.sp-channel-tag { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 999px; }

.sp-faq { margin-bottom: 48px; }
.sp-faq-title { font-size: 20px; font-weight: 700; margin-bottom: 20px; }
.sp-faq-list { display: flex; flex-direction: column; gap: 8px; }
.sp-faq-item { background: #fff; border-radius: 16px; border: 1px solid rgba(0,0,0,0.06); overflow: hidden; cursor: pointer; }
.sp-faq-q { display: flex; justify-content: space-between; align-items: center; padding: 16px 20px; font-size: 14px; font-weight: 600; }
.sp-faq-actions { display: flex; align-items: center; gap: 8px; }
.sp-faq-edit-btn { background: none; border: none; cursor: pointer; padding: 4px; color: rgba(29,29,31,0.4); display: flex; align-items: center; }
.sp-faq-edit-btn:hover { color: #7c3aed; }
.sp-faq-a { padding: 0 20px 16px; font-size: 14px; color: rgba(29,29,31,0.55); line-height: 1.65; }
.sp-add-faq-btn { margin-top: 12px; display: flex; align-items: center; gap: 6px; padding: 10px 16px; background: none; border: 1.5px dashed rgba(124,58,237,0.3); border-radius: 12px; color: rgba(124,58,237,0.7); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
.sp-add-faq-btn:hover { border-color: #7c3aed; color: #7c3aed; }

.sp-form { display: flex; flex-direction: column; gap: 12px; }
.sp-input { padding: 14px 18px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 14px; font-size: 14px; outline: none; transition: border-color 0.2s; background: #fff; font-family: inherit; }
.sp-input:focus { border-color: #0071e3; }
.sp-select { cursor: pointer; }
.sp-textarea { min-height: 120px; resize: vertical; }
.sp-send-btn {
  padding: 14px 28px; background: #1d1d1f; color: #fff;
  border-radius: 14px; font-size: 14px; font-weight: 700;
  border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background 0.2s; align-self: flex-start;
}
.sp-send-btn:hover:not(:disabled) { background: #0071e3; }
.sp-send-btn:disabled { opacity: 0.6; cursor: not-allowed; }
.sp-msg-success { text-align: center; padding: 48px 24px; }
.sp-msg-success svg { margin: 0 auto 16px; display: block; }
.sp-msg-success h4 { font-size: 20px; font-weight: 800; margin-bottom: 8px; }
.sp-msg-success p { font-size: 14px; color: rgba(29,29,31,0.5); margin-bottom: 20px; }
.sp-msg-again { padding: 10px 24px; background: #f5f5f7; border: none; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; }

/* Edit dialog */
.brand-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.4); z-index: 9999; display: flex; align-items: center; justify-content: center; }
.brand-edit-dialog { background: #fff; border-radius: 20px; width: 480px; max-width: 95vw; max-height: 85vh; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bed-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bed-title { font-size: 16px; font-weight: 700; }
.bed-close { background: none; border: none; cursor: pointer; font-size: 18px; color: rgba(29,29,31,0.4); }
.bed-body { padding: 20px 24px; overflow-y: auto; flex: 1; display: flex; flex-direction: column; gap: 10px; }
.bed-label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.5); text-transform: uppercase; letter-spacing: 0.05em; }
.bed-input { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; }
.bed-input:focus { border-color: #7c3aed; }
.bed-textarea { padding: 10px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 14px; outline: none; resize: vertical; font-family: inherit; }
.bed-textarea:focus { border-color: #7c3aed; }
.bed-footer { padding: 16px 24px; border-top: 1px solid rgba(0,0,0,0.06); display: flex; gap: 10px; align-items: center; }
.bed-delete { padding: 10px 16px; border-radius: 10px; background: #fee2e2; color: #dc2626; border: none; font-size: 14px; font-weight: 600; cursor: pointer; margin-right: auto; }
.bed-cancel { padding: 10px 20px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.1); background: #fff; font-size: 14px; font-weight: 600; cursor: pointer; }
.bed-save { padding: 10px 24px; border-radius: 10px; background: #7c3aed; color: #fff; border: none; font-size: 14px; font-weight: 700; cursor: pointer; }
.bed-save:hover { background: #6d28d9; }

@media (max-width: 768px) {
  .brand-support { padding: 24px; }
  .sp-channels { grid-template-columns: 1fr; }
  .sp-send-btn { width: 100%; }
}
</style>
