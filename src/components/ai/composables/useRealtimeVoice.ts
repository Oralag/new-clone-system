/**
 * useRealtimeVoice — 语音通话 composable
 * STT: 浏览器原生 webkitSpeechRecognition（iOS Safari 支持）
 * AI:  Cloudflare Worker → Claude
 * TTS: 浏览器原生 speechSynthesis（免费）
 */
import { ref, onUnmounted } from 'vue'
import { getStoredLocale } from '@/i18n'

export interface VoiceToolCall {
  name: string
  input: Record<string, any>
  result?: string
  status: 'running' | 'success' | 'error'
}

export interface VoiceTranscript {
  role: 'user' | 'assistant'
  text: string
}

const WORKER_URL = import.meta.env.DEV
  ? '/api/voice-chat'
  : 'https://erp-voice-relay.oralag-borjigin.workers.dev/api/voice-chat'

// 浏览器兼容
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

export function useRealtimeVoice() {
  const isInCall = ref(false)
  const isUserSpeaking = ref(false)
  const isAiSpeaking = ref(false)
  const isProcessing = ref(false)
  const audioLevel = ref(0)
  const transcripts = ref<VoiceTranscript[]>([])
  const toolCalls = ref<VoiceToolCall[]>([])
  const error = ref('')
  const callDuration = ref(0)

  let recognition: any = null
  let durationTimer: ReturnType<typeof setInterval> | null = null
  let chatHistory: { role: string; content: string }[] = []
  let isRecognizing = false

  // ── TTS：浏览器原生 ───────────────────────────────────────

  async function speak(text: string) {
    if (!text || !window.speechSynthesis) return
    isAiSpeaking.value = true
    // 取消正在播放的
    window.speechSynthesis.cancel()
    await new Promise<void>((resolve) => {
      const utter = new SpeechSynthesisUtterance(text)
      const speechLocale = getStoredLocale()
      utter.lang = speechLocale
      utter.rate = 1.0
      utter.onend = () => resolve()
      utter.onerror = () => resolve()
      const voices = window.speechSynthesis.getVoices()
      const voicePrefix = speechLocale.startsWith('en') ? 'en' : 'zh'
      const matchedVoice = voices.find(v => v.lang.startsWith(voicePrefix) && v.name.includes('Female'))
        || voices.find(v => v.lang.startsWith(voicePrefix))
      if (matchedVoice) utter.voice = matchedVoice
      window.speechSynthesis.speak(utter)
    })
    isAiSpeaking.value = false
  }

  // ── 发送文字到 Worker → Claude ───────────────────────────

  async function sendTextToWorker(userText: string) {
    isProcessing.value = true
    error.value = ''
    transcripts.value.push({ role: 'user', text: userText })
    chatHistory.push({ role: 'user', content: userText })

    try {
      const token = localStorage.getItem('erp_token') || ''
      const res = await fetch(WORKER_URL, {
        method: 'POST',
        headers: { 'x-erp-token': token, 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, history: chatHistory.slice(-6) }),
      })

      const data = await res.json()

      if (data.toolCalls?.length) {
        toolCalls.value.push(...data.toolCalls)
      }

      if (data.text) {
        transcripts.value.push({ role: 'assistant', text: data.text })
        chatHistory.push({ role: 'assistant', content: data.text })
        await speak(data.text)
      }

      if (data.error && !data.text) {
        error.value = data.error
      }
    } catch (e: any) {
      error.value = e.message || '网络错误'
    } finally {
      isProcessing.value = false
    }
  }

  // ── 录音控制（STT）───────────────────────────────────────

  function startRecording() {
    if (!recognition || isRecognizing || !isInCall.value) return
    if (isProcessing.value || isAiSpeaking.value) return
    isUserSpeaking.value = true
    isRecognizing = true
    recognition.start()
  }

  function stopRecording() {
    if (!recognition || !isRecognizing) return
    isUserSpeaking.value = false
    recognition.stop()
  }

  // ── 开始/结束通话 ────────────────────────────────────────

  async function startCall() {
    error.value = ''
    transcripts.value = []
    toolCalls.value = []
    callDuration.value = 0
    chatHistory = []

    if (!SpeechRecognition) {
      error.value = '当前浏览器不支持语音识别，请用 Safari 打开'
      return
    }

    recognition = new SpeechRecognition()
    recognition.lang = getStoredLocale()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.maxAlternatives = 1

    recognition.onresult = (event: any) => {
      const text = event.results[0]?.[0]?.transcript?.trim()
      isRecognizing = false
      if (text && isInCall.value) {
        sendTextToWorker(text)
      }
    }

    recognition.onerror = (event: any) => {
      isRecognizing = false
      isUserSpeaking.value = false
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        error.value = `识别错误: ${event.error}`
      }
    }

    recognition.onend = () => {
      isRecognizing = false
      isUserSpeaking.value = false
    }

    isInCall.value = true
    durationTimer = setInterval(() => { callDuration.value++ }, 1000)
  }

  function endCall() {
    if (recognition) {
      try { recognition.abort() } catch {}
      recognition = null
    }
    isRecognizing = false
    window.speechSynthesis?.cancel()
    if (durationTimer) { clearInterval(durationTimer); durationTimer = null }
    isInCall.value = false
    isUserSpeaking.value = false
    isAiSpeaking.value = false
    isProcessing.value = false
    audioLevel.value = 0
  }

  onUnmounted(endCall)

  return {
    isInCall,
    isUserSpeaking,
    isAiSpeaking,
    isProcessing,
    audioLevel,
    transcripts,
    toolCalls,
    error,
    callDuration,
    startCall,
    endCall,
    startRecording,
    stopRecording,
  }
}
