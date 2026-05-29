<template>
  <div class="channels-page">

    <div class="phase-banner">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v4M12 16h.01" stroke-linecap="round"/></svg>
      当前为规划模式——可以登记你打算接入的渠道账号信息，真实 API 对接（数据同步）在 Phase 2 开发。登记的信息不会产生任何实际连接。
    </div>

    <div class="ch-grid">
      <div v-for="ch in channels" :key="ch.id" class="ch-card" :class="{ 'ch-planned': ch.connected }">
        <div class="ch-card-hd">
          <div class="ch-logo" :style="{ background: ch.connected ? ch.color : '#e2e8f0' }">
            {{ ch.emoji }}
          </div>
          <div class="ch-info">
            <div class="ch-name">{{ ch.name }}</div>
            <div class="ch-desc">{{ ch.desc }}</div>
          </div>
          <div class="ch-badge" :class="ch.connected ? 'badge-planned' : 'badge-off'">
            {{ ch.connected ? '已登记' : '未登记' }}
          </div>
        </div>

        <div class="ch-features">
          <span v-for="f in ch.features" :key="f" class="feat-tag">{{ f }}</span>
        </div>

        <div v-if="ch.connected" class="ch-planned-info">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/></svg>
          <span>{{ ch.accountName }} · 待 Phase 2 正式对接</span>
        </div>

        <div class="ch-actions">
          <button v-if="!ch.connected" class="connect-btn" @click="openConnect(ch)">登记账号信息</button>
          <button v-else class="disconnect-btn" @click="handleDisconnect(ch)">清除登记</button>
        </div>
      </div>
    </div>

    <!-- 登记弹窗 -->
    <div v-if="showModal" class="modal-mask" @click.self="showModal = false">
      <div class="modal-box">
        <div class="modal-title">登记 {{ activeChannel?.name }}</div>
        <div class="modal-sub">仅记录账号信息，供 Phase 2 正式接入时使用，现在不会产生任何实际连接</div>

        <div class="form-group">
          <label class="form-label">AppID / 开发者ID（选填）</label>
          <input v-model="formAppId" class="form-input" placeholder="公众号/账号后台 → 开发设置 → AppID" />
        </div>
        <div class="form-group">
          <label class="form-label">账号名称</label>
          <input v-model="formName" class="form-input" :placeholder="'如：' + (activeChannel?.name ?? '') + '官方账号'" />
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="showModal = false">取消</button>
          <button class="btn-confirm" @click="confirmConnect">保存登记</button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useChannels, type Channel } from '@/composables/useChannels'

const { channels } = useChannels()

const showModal = ref(false)
const activeChannel = ref<Channel | null>(null)
const formAppId = ref('')
const formName = ref('')

function openConnect(ch: Channel) {
  activeChannel.value = ch
  formAppId.value = ''
  formName.value = ''
  showModal.value = true
}

function confirmConnect() {
  if (!formName.value.trim()) {
    ElMessage.warning('请填写账号名称')
    return
  }
  const ch = channels.value.find(c => c.id === activeChannel.value?.id)
  if (ch) {
    ch.connected = true
    ch.accountName = formName.value.trim()
  }
  showModal.value = false
  ElMessage.success(`${activeChannel.value?.name} 账号信息已登记`)
}

function handleDisconnect(ch: Channel) {
  ElMessageBox.confirm(`清除 ${ch.name} 的登记信息？`, '清除登记', {
    confirmButtonText: '确认清除', cancelButtonText: '取消', type: 'warning',
  }).then(() => {
    ch.connected = false
    ch.accountName = undefined
    ElMessage.success('已清除登记信息')
  }).catch(() => {})
}
</script>

<style scoped>
.channels-page { display: flex; flex-direction: column; gap: 16px; }

.phase-banner {
  display: flex; align-items: flex-start; gap: 8px;
  background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2);
  border-radius: 12px; padding: 12px 14px;
  font-size: 12px; color: #92400e; line-height: 1.6;
}

.ch-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.ch-card {
  background: #fff;
  border: 1px solid rgba(148,163,184,0.14);
  border-radius: 20px;
  padding: 18px;
  display: flex; flex-direction: column; gap: 12px;
  box-shadow: 0 4px 20px rgba(15,23,42,0.05);
  transition: box-shadow 0.2s;
}
.ch-planned {
  border-color: rgba(245,158,11,0.2);
  box-shadow: 0 4px 20px rgba(245,158,11,0.06);
}

.ch-card-hd { display: flex; align-items: flex-start; gap: 12px; }

.ch-logo {
  width: 44px; height: 44px; border-radius: 14px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 22px; transition: background 0.2s;
}

.ch-info { flex: 1; min-width: 0; }
.ch-name { font-size: 14px; font-weight: 700; color: #0f172a; }
.ch-desc { font-size: 11px; color: #64748b; margin-top: 3px; line-height: 1.4; }

.ch-badge { font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 999px; white-space: nowrap; flex-shrink: 0; }
.badge-planned { background: rgba(245,158,11,0.1); color: #d97706; }
.badge-off     { background: rgba(148,163,184,0.1); color: #94a3b8; }

.ch-features { display: flex; flex-wrap: wrap; gap: 6px; }
.feat-tag {
  font-size: 10px; color: #475569;
  background: #f1f5f9; padding: 3px 8px; border-radius: 999px;
}

.ch-planned-info {
  display: flex; align-items: center; gap: 7px;
  font-size: 11px; color: #64748b;
  background: #f8fafc; padding: 8px 12px; border-radius: 10px;
  border: 1px solid rgba(148,163,184,0.14);
}

.ch-actions { display: flex; justify-content: flex-end; }

.connect-btn {
  border: 1px solid rgba(124,58,237,0.25);
  border-radius: 10px; padding: 8px 18px;
  font-size: 12px; font-weight: 600; color: #7c3aed;
  background: rgba(124,58,237,0.06); cursor: pointer; transition: background 0.15s;
}
.connect-btn:hover { background: rgba(124,58,237,0.12); }

.disconnect-btn {
  border: 1px solid rgba(148,163,184,0.2);
  border-radius: 10px; padding: 8px 18px;
  font-size: 12px; font-weight: 600; color: #94a3b8;
  background: #f8fafc; cursor: pointer; transition: background 0.15s;
}
.disconnect-btn:hover { background: #f1f5f9; color: #ef4444; border-color: rgba(239,68,68,0.2); }

/* Modal */
.modal-mask {
  position: fixed; inset: 0; background: rgba(15,23,42,0.4);
  backdrop-filter: blur(4px); z-index: 100;
  display: flex; align-items: center; justify-content: center;
}
.modal-box {
  background: #fff; border-radius: 20px; padding: 28px;
  width: 420px; max-width: calc(100vw - 32px);
  box-shadow: 0 24px 80px rgba(15,23,42,0.18);
}
.modal-title { font-size: 18px; font-weight: 800; color: #0f172a; margin-bottom: 4px; }
.modal-sub { font-size: 12px; color: #64748b; margin-bottom: 20px; }

.form-group { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.form-label { font-size: 12px; font-weight: 600; color: #334155; }
.form-input {
  border: 1px solid rgba(148,163,184,0.3); border-radius: 10px;
  padding: 10px 12px; font-size: 13px; color: #0f172a; outline: none;
  transition: border-color 0.15s;
}
.form-input:focus { border-color: #7c3aed; }

.modal-hint {
  display: flex; align-items: flex-start; gap: 7px;
  font-size: 11px; color: #7c3aed; line-height: 1.5;
  background: rgba(124,58,237,0.06); padding: 10px 12px; border-radius: 10px;
  margin-bottom: 20px;
}

.modal-footer { display: flex; justify-content: flex-end; gap: 10px; }
.btn-cancel {
  border: 1px solid rgba(148,163,184,0.2); border-radius: 10px; padding: 9px 20px;
  font-size: 13px; font-weight: 600; color: #64748b; background: #f8fafc; cursor: pointer;
}
.btn-cancel:hover { background: #f1f5f9; }
.btn-confirm {
  border: none; border-radius: 10px; padding: 9px 20px;
  font-size: 13px; font-weight: 600; color: #fff;
  background: linear-gradient(135deg, #7c3aed, #6d28d9); cursor: pointer;
  transition: opacity 0.15s;
}
.btn-confirm:hover { opacity: 0.88; }
</style>
