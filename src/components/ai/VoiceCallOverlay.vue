<template>
  <teleport to="body">
    <transition name="voice-overlay">
      <div v-if="visible" class="voice-call-overlay">
        <div class="voice-call-container">
          <!-- 顶部信息 -->
          <div class="voice-call-header">
            <div class="voice-call-title">{{ t('aiAssistant.nameSpaced') }}</div>
            <div class="voice-call-status">
              {{ error || statusText }}
            </div>
            <div class="voice-call-timer">{{ formatDuration(callDuration) }}</div>
          </div>

          <!-- 中央动画圆 -->
          <div class="voice-orb-wrapper">
            <div
              class="voice-orb"
              :class="{
                'voice-orb--user': isUserSpeaking,
                'voice-orb--ai': isAiSpeaking,
                'voice-orb--processing': isProcessing,
                'voice-orb--idle': !isUserSpeaking && !isAiSpeaking && !isProcessing,
              }"
              :style="{ transform: `scale(${1 + audioLevel * 3})` }"
            >
              <div class="voice-orb-inner"></div>
            </div>
            <div class="voice-orb-ring" :class="{ 'voice-orb-ring--active': isUserSpeaking || isAiSpeaking || isProcessing }"></div>
          </div>

          <!-- 转写区域 -->
          <div class="voice-transcripts" ref="transcriptRef">
            <div
              v-for="(item, i) in transcripts"
              :key="i"
              class="voice-transcript-item"
              :class="'voice-transcript--' + item.role"
            >
              <span class="voice-transcript-role">{{ item.role === 'user' ? t('voiceCallOverlay.you') : t('voiceCallOverlay.assistant') }}:</span>
              <span class="voice-transcript-text">{{ item.text }}</span>
            </div>
            <!-- 工具调用 -->
            <div v-for="(tc, j) in toolCalls" :key="'tc-' + j" class="voice-tool-call">
              <span class="voice-tool-icon">{{ tc.status === 'running' ? '...' : tc.status === 'success' ? 'OK' : 'ERR' }}</span>
              <span class="voice-tool-name">{{ toolLabel(tc.name) }}</span>
              <span v-if="tc.result" class="voice-tool-result">{{ tc.result.slice(0, 80) }}</span>
            </div>
          </div>

          <!-- 底部按钮区 -->
          <div class="voice-call-actions">
            <!-- 按住说话按钮 -->
            <button
              class="voice-talk-btn"
              :class="{ 'voice-talk-btn--active': isUserSpeaking }"
              :disabled="isProcessing || isAiSpeaking"
              @mousedown.prevent="startRecording"
              @mouseup.prevent="stopRecording"
              @touchstart.prevent="startRecording"
              @touchend.prevent="stopRecording"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z"/>
              </svg>
              <span>{{ isUserSpeaking ? t('voiceCallOverlay.releaseSend') : isProcessing ? t('voiceCallOverlay.processing') : t('voiceCallOverlay.holdToTalk') }}</span>
            </button>

            <!-- 挂断按钮 -->
            <button class="voice-hangup-btn" @click="handleHangup">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { watch, ref, nextTick, computed } from 'vue'
import { useRealtimeVoice } from './composables/useRealtimeVoice'
import { useI18n } from 'vue-i18n'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ 'update:visible': [val: boolean] }>()
const { t } = useI18n()

const {
  isInCall, isUserSpeaking, isAiSpeaking, isProcessing, audioLevel,
  transcripts, toolCalls, error, callDuration,
  startCall, endCall, startRecording, stopRecording,
} = useRealtimeVoice()

const transcriptRef = ref<HTMLElement>()

const statusText = computed(() => {
  if (isAiSpeaking.value) return t('voiceCallOverlay.aiSpeaking')
  if (isProcessing.value) return t('voiceCallOverlay.thinking')
  if (isUserSpeaking.value) return t('voiceCallOverlay.listening')
  return t('voiceCallOverlay.idleHint')
})

// 打开时自动开始通话
watch(() => props.visible, async (val) => {
  if (val && !isInCall.value) {
    await startCall()
  }
})

// 转写滚动到底部
watch(() => transcripts.value.length, () => {
  nextTick(() => {
    if (transcriptRef.value) {
      transcriptRef.value.scrollTop = transcriptRef.value.scrollHeight
    }
  })
})

function handleHangup() {
  endCall()
  emit('update:visible', false)
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

function toolLabel(name: string) { return t(`aiToolCallCard.tools.${name}`, name) }
</script>

<style scoped>
.voice-call-overlay {
  position: fixed; inset: 0; z-index: 10000;
  background: linear-gradient(135deg, #0f0c29, #302b63, #24243e);
  display: flex; align-items: center; justify-content: center;
}
.voice-call-container {
  width: 100%; max-width: 420px; height: 100vh;
  display: flex; flex-direction: column; align-items: center;
  padding: 60px 24px 40px; box-sizing: border-box;
}
.voice-call-header { text-align: center; margin-bottom: 32px; }
.voice-call-title { font-size: 22px; font-weight: 600; color: #fff; }
.voice-call-status { font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 8px; min-height: 20px; }
.voice-call-timer { font-size: 13px; color: rgba(255,255,255,0.4); margin-top: 4px; font-variant-numeric: tabular-nums; }

/* 动画圆 */
.voice-orb-wrapper { position: relative; width: 140px; height: 140px; margin-bottom: 32px; flex-shrink: 0; }
.voice-orb {
  width: 100%; height: 100%; border-radius: 50%;
  transition: transform 0.1s ease-out, background 0.3s;
  display: flex; align-items: center; justify-content: center;
}
.voice-orb--idle { background: radial-gradient(circle, #667eea 0%, #764ba2 100%); }
.voice-orb--user { background: radial-gradient(circle, #43e97b 0%, #38f9d7 100%); }
.voice-orb--ai { background: radial-gradient(circle, #fa709a 0%, #fee140 100%); }
.voice-orb--processing { background: radial-gradient(circle, #f093fb 0%, #f5576c 100%); animation: orb-breathe 1.5s ease-in-out infinite; }
.voice-orb-inner {
  width: 60%; height: 60%; border-radius: 50%;
  background: rgba(255,255,255,0.15); backdrop-filter: blur(4px);
}
.voice-orb-ring {
  position: absolute; inset: -12px; border-radius: 50%;
  border: 2px solid rgba(255,255,255,0.1);
  transition: border-color 0.3s, transform 0.3s;
}
.voice-orb-ring--active {
  border-color: rgba(255,255,255,0.3);
  animation: ring-pulse 1.5s ease-in-out infinite;
}
@keyframes ring-pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.1); opacity: 0.5; }
}
@keyframes orb-breathe {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.08); }
}

/* 转写区域 */
.voice-transcripts {
  flex: 1; width: 100%; overflow-y: auto; padding: 0 8px;
  scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.2) transparent;
}
.voice-transcript-item {
  padding: 8px 0; font-size: 14px; line-height: 1.5;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.voice-transcript--user .voice-transcript-role { color: #43e97b; }
.voice-transcript--assistant .voice-transcript-role { color: #fa709a; }
.voice-transcript-role { font-weight: 600; margin-right: 6px; }
.voice-transcript-text { color: rgba(255,255,255,0.85); }

/* 工具调用 */
.voice-tool-call {
  padding: 6px 10px; margin: 4px 0; border-radius: 6px;
  background: rgba(255,255,255,0.08); font-size: 13px; color: rgba(255,255,255,0.7);
  display: flex; align-items: center; gap: 6px;
}
.voice-tool-name { font-weight: 500; }
.voice-tool-result { color: rgba(255,255,255,0.5); font-size: 12px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }

/* 底部按钮区 */
.voice-call-actions { margin-top: 16px; display: flex; align-items: center; gap: 20px; flex-shrink: 0; }

/* 按住说话按钮 */
.voice-talk-btn {
  width: 160px; height: 56px; border-radius: 28px; border: none;
  background: #667eea; color: #fff; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 8px;
  font-size: 15px; font-weight: 500;
  transition: transform 0.15s, background 0.15s;
  user-select: none; -webkit-user-select: none;
}
.voice-talk-btn:active, .voice-talk-btn--active {
  background: #43e97b; transform: scale(1.05);
}
.voice-talk-btn:disabled {
  opacity: 0.5; cursor: not-allowed; transform: none;
}
.voice-talk-btn span { font-size: 14px; }

/* 挂断按钮 */
.voice-hangup-btn {
  width: 52px; height: 52px; border-radius: 50%; border: none;
  background: #e74c3c; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.15s, background 0.15s;
}
.voice-hangup-btn:hover { background: #c0392b; transform: scale(1.05); }
.voice-hangup-btn:active { transform: scale(0.95); }

/* 过渡动画 */
.voice-overlay-enter-active { transition: opacity 0.3s ease; }
.voice-overlay-leave-active { transition: opacity 0.2s ease; }
.voice-overlay-enter-from, .voice-overlay-leave-to { opacity: 0; }
</style>
