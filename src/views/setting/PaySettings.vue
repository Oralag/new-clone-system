<template>
  <div class="page-container">
    <el-card v-loading="loading">
      <template #header>
        <div class="ps-head">
          <span class="ps-title">收款设置 · 微信支付</span>
          <el-tag v-if="info.active?.ready" type="success" size="small">已可收款</el-tag>
          <el-tag v-else type="info" size="small">未配置完整</el-tag>
        </div>
      </template>

      <el-alert v-if="info.shared_backend" type="warning" :closable="false" show-icon class="ps-alert"
        title="试用版是多家共用的服务器，不能配置在线收款。开通独立版后再来设置。" />

      <p class="ps-intro">
        小程序付款和官网扫码付款都用这里的商户号，钱直接进你自己的微信支付账户。
        资料在 <a href="https://pay.weixin.qq.com" target="_blank" rel="noopener">pay.weixin.qq.com</a>
        → 账户中心 → API 安全 里下载和设置。私钥和密钥保存后只显示「已填写」，要换就重新粘贴。
      </p>

      <el-form :model="form" label-width="150px" :disabled="info.shared_backend" class="ps-form">
        <el-form-item label="商户号">
          <el-input v-model="form.wx_mchid" placeholder="10 位左右数字" maxlength="12" />
          <div v-if="info.env_fallback?.wx_mchid" class="ps-hint">当前在用服务器配置的商户号 {{ info.active?.mchid }}，这里留空就继续用它</div>
        </el-form-item>
        <el-form-item label="AppID">
          <el-input v-model="form.wx_appid" placeholder="wx 开头 18 位，留空=用小程序的 AppID" maxlength="18" />
        </el-form-item>
        <el-form-item label="商户证书序列号">
          <el-input v-model="form.wx_cert_serial" placeholder="API 证书的序列号，40 位左右" />
        </el-form-item>
        <el-form-item label="商户私钥">
          <el-input v-model="form.wx_private_key" type="textarea" :rows="4"
            :placeholder="info.has_private_key ? '已填写（不改就留空）' : '粘贴 apiclient_key.pem 的全部内容，包括 -----BEGIN PRIVATE KEY----- 这一行'" />
          <div v-if="!info.has_private_key && info.env_fallback?.private_key" class="ps-hint">当前在用服务器配置的私钥</div>
        </el-form-item>
        <el-form-item label="APIv3 密钥">
          <el-input v-model="form.wx_apiv3_key" type="password" show-password maxlength="32"
            :placeholder="info.has_apiv3_key ? '已填写（不改就留空）' : '32 位，在 API 安全里自己设置的'" />
          <div v-if="!info.has_apiv3_key && info.env_fallback?.apiv3_key" class="ps-hint">当前在用服务器配置的 APIv3 密钥</div>
        </el-form-item>
        <el-form-item label="微信支付公钥 ID">
          <el-input v-model="form.wx_pub_key_id" placeholder="PUB_KEY_ID_ 开头" />
        </el-form-item>
        <el-form-item label="微信支付公钥">
          <el-input v-model="form.wx_platform_public_key" type="textarea" :rows="4"
            :placeholder="info.has_platform_public_key ? '已填写（不改就留空）' : '粘贴 pub_key.pem 的全部内容（用来确认付款通知真的是微信发的）'" />
          <div v-if="!info.has_platform_public_key && info.env_fallback?.platform_public_key" class="ps-hint">当前在用服务器配置的公钥</div>
        </el-form-item>
        <el-form-item label="付款通知地址">
          <span class="ps-mono">{{ info.notify_url }}</span>
          <div class="ps-hint">系统自动填给微信的，不用去商户平台设置</div>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button :loading="testing" @click="handleTest">测试连接</el-button>
          <span v-if="info.updated_at" class="ps-hint ps-inline">上次修改：{{ fmtTime(info.updated_at) }} {{ info.updated_by }}</span>
        </el-form-item>
      </el-form>

      <el-alert v-if="testResult" :type="testResult.type" :closable="false" show-icon :title="testResult.text" class="ps-alert" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { getPaySettings, savePaySettings, testPaySettings } from '@/api/setting'

const loading = ref(false)
const saving = ref(false)
const testing = ref(false)
const info = ref<any>({})
const testResult = ref<{ type: 'success' | 'warning' | 'error'; text: string } | null>(null)
const form = reactive({
  wx_mchid: '', wx_appid: '', wx_cert_serial: '', wx_pub_key_id: '',
  wx_private_key: '', wx_apiv3_key: '', wx_platform_public_key: '',
})

function fmtTime(v: string) {
  return new Date(v).toLocaleString('zh-CN', { hour12: false })
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await getPaySettings()
    info.value = res.data || {}
    form.wx_mchid = info.value.wx_mchid || ''
    form.wx_appid = info.value.wx_appid || ''
    form.wx_cert_serial = info.value.wx_cert_serial || ''
    form.wx_pub_key_id = info.value.wx_pub_key_id || ''
    form.wx_private_key = ''
    form.wx_apiv3_key = ''
    form.wx_platform_public_key = ''
  } catch { /* 拦截器已提示 */ } finally {
    loading.value = false
  }
}

async function handleSave() {
  saving.value = true
  try {
    // 密钥类字段留空 = 不改，后端只更新传了值的
    const payload: Record<string, string> = {
      wx_mchid: form.wx_mchid.trim(),
      wx_appid: form.wx_appid.trim(),
      wx_cert_serial: form.wx_cert_serial.trim(),
      wx_pub_key_id: form.wx_pub_key_id.trim(),
    }
    if (form.wx_private_key.trim()) payload.wx_private_key = form.wx_private_key
    if (form.wx_apiv3_key.trim()) payload.wx_apiv3_key = form.wx_apiv3_key.trim()
    if (form.wx_platform_public_key.trim()) payload.wx_platform_public_key = form.wx_platform_public_key
    await savePaySettings(payload)
    ElMessage.success('已保存，建议点一下「测试连接」')
    testResult.value = null
    await loadData()
  } catch { /* 拦截器已提示 */ } finally {
    saving.value = false
  }
}

async function handleTest() {
  testing.value = true
  testResult.value = null
  try {
    const res: any = await testPaySettings()
    const d = res.data || {}
    const warn = (d.missing?.length || 0) > 0 || (d.native && d.native !== 'ok')
    testResult.value = { type: warn ? 'warning' : 'success', text: res.message || '连接成功' }
  } catch (e: any) {
    testResult.value = { type: 'error', text: e?.message || '连接失败' }
  } finally {
    testing.value = false
  }
}

onMounted(loadData)
</script>

<style scoped>
.ps-head { display: flex; align-items: center; gap: 10px; }
.ps-title { font-weight: 700; }
.ps-intro { margin: 0 0 18px; color: var(--el-text-color-secondary); font-size: 13px; line-height: 1.7; max-width: 720px; }
.ps-form { max-width: 760px; }
.ps-hint { width: 100%; margin-top: 4px; font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.5; }
.ps-inline { width: auto; margin: 0 0 0 12px; }
.ps-mono { font-family: ui-monospace, Menlo, monospace; font-size: 12px; word-break: break-all; }
.ps-alert { margin-bottom: 16px; }
</style>
