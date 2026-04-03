<template>
  <div class="wholesale-apply">
    <div class="wa-header">
      <h2 class="wa-title">申请成为采购商</h2>
      <p class="wa-sub">填写公司信息，我们将在 1-3 个工作日内审核并联系您</p>
    </div>
    <div class="wa-form">
      <div class="wa-field">
        <label class="wa-label">公司名称 <span class="wa-req">*</span></label>
        <input v-model="form.company" type="text" class="wa-input" placeholder="请输入公司全称" />
      </div>
      <div class="wa-field">
        <label class="wa-label">联系人 <span class="wa-req">*</span></label>
        <input v-model="form.contact" type="text" class="wa-input" placeholder="姓名" />
      </div>
      <div class="wa-field">
        <label class="wa-label">手机号 <span class="wa-req">*</span></label>
        <input v-model="form.mobile" type="tel" class="wa-input" placeholder="11位手机号" />
      </div>
      <div class="wa-field">
        <label class="wa-label">邮箱</label>
        <input v-model="form.email" type="email" class="wa-input" placeholder="business@example.com" />
      </div>
      <div class="wa-field">
        <label class="wa-label">主营类目</label>
        <input v-model="form.category" type="text" class="wa-input" placeholder="如：数码配件、户外装备" />
      </div>
      <div class="wa-field">
        <label class="wa-label">预计月采购量</label>
        <input v-model="form.volume" type="text" class="wa-input" placeholder="如：50-100件/月" />
      </div>
      <div class="wa-field">
        <label class="wa-label">营业执照（选填）</label>
        <input type="file" class="wa-file" accept="image/*,.pdf" @change="onFileChange" />
        <p class="wa-file-hint">支持 JPG、PNG、PDF，不超过 5MB</p>
      </div>
      <div class="wa-field">
        <label class="wa-label">备注</label>
        <textarea v-model="form.remark" class="wa-textarea" placeholder="其他需要说明的信息..."></textarea>
      </div>
      <button class="wa-submit" :disabled="submitting" @click="submit">
        {{ submitting ? '提交中...' : '提交申请' }}
      </button>
    </div>
    <div v-if="submitted" class="wa-success">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#34c759" stroke-width="2" stroke-linecap="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
      <h3>申请已提交！</h3>
      <p>我们将在 1-3 个工作日内通过手机或邮件联系您。</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
const form = reactive({ company: '', contact: '', mobile: '', email: '', category: '', volume: '', remark: '' })
const submitting = ref(false)
const submitted = ref(false)
const fileData = ref<string>('')

function onFileChange(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => { fileData.value = reader.result as string }
  reader.readAsDataURL(file)
}

async function submit() {
  if (!form.company || !form.contact || !form.mobile) {
    alert('请填写必填项')
    return
  }
  submitting.value = true
  try {
    const res = await fetch('https://nomaderp.pages.dev/adminapi/shop/ShopCustomer/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.company,
        mobile: form.mobile,
        email: form.email || '',
        remark: `【采购商申请】联系人:${form.contact} 主营:${form.category || '-'} 月采购量:${form.volume || '-'} 备注:${form.remark || '-'}`,
      }),
    })
    const json = await res.json()
    if (json.code === 1) {
      submitted.value = true
    } else {
      alert(json.message || '提交失败，请稍后重试')
    }
  } catch {
    alert('网络错误，请稍后重试')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.wholesale-apply { max-width: 600px; margin: 0 auto; padding: 48px 24px 80px; }
.wa-header { margin-bottom: 36px; }
.wa-title { font-size: 32px; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 8px; }
.wa-sub { font-size: 14px; color: rgba(29,29,31,0.45); }
.wa-form { display: flex; flex-direction: column; gap: 20px; }
.wa-field { display: flex; flex-direction: column; gap: 6px; }
.wa-label { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.wa-req { color: #ef4444; }
.wa-input, .wa-textarea {
  padding: 12px 16px; border: 1.5px solid rgba(0,0,0,0.1);
  border-radius: 12px; font-size: 14px; outline: none;
  transition: border-color 0.2s; background: #fff;
}
.wa-input:focus, .wa-textarea:focus { border-color: #7c3aed; }
.wa-textarea { min-height: 100px; resize: vertical; }
.wa-file { font-size: 13px; }
.wa-file-hint { font-size: 11px; color: rgba(29,29,31,0.4); }
.wa-submit {
  padding: 16px; background: #1d1d1f; color: #fff;
  border-radius: 14px; font-size: 15px; font-weight: 700;
  border: none; cursor: pointer; transition: background 0.2s;
}
.wa-submit:hover:not(:disabled) { background: #7c3aed; }
.wa-submit:disabled { opacity: 0.6; cursor: not-allowed; }
.wa-success { text-align: center; padding: 60px 24px; }
.wa-success svg { margin: 0 auto 16px; display: block; }
.wa-success h3 { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
.wa-success p { font-size: 14px; color: rgba(29,29,31,0.5); }

@media (max-width: 768px) {
  .wholesale-apply { padding: 24px 16px 60px; }
  .wa-title { font-size: 24px; }
  .wa-submit { padding: 14px; }
}
</style>
