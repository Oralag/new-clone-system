<template>
  <div class="agent-page">
    <div class="persona-grid">
      <!-- 步骤一：分身形象 -->
      <section class="p-card" :style="{ '--ac': '#8b5cf6' }">
        <div class="p-card-head">
          <span class="p-step">1</span>
          <div>
            <span class="p-title">分身形象</span>
            <p class="p-desc">上传照片或 AI 生成虚拟形象</p>
          </div>
        </div>

        <div class="avatar-list">
          <div
            v-for="p in personas" :key="p.id"
            class="avatar-item" :class="{ active: activeId === p.id }"
            @click="activeId = p.id"
          >
            <img :src="p.imageUrl" :alt="p.name" />
            <span class="avatar-name">{{ p.name }}</span>
            <button class="avatar-del" title="删除" @click.stop="removePersona(p.id)">×</button>
            <button class="avatar-zoom" title="查看大图/调整" @click.stop="openViewer(p)">🔍</button>
          </div>
          <div v-if="!personas.length" class="avatar-empty">还没有分身，先建一个 →</div>
        </div>

        <div class="p-actions">
          <el-button size="small" @click="handleUpload">📷 上传照片</el-button>
          <el-input v-model="genPrompt" size="small" placeholder="或描述虚拟形象，如：年轻女性主播，微笑，正面半身" class="gen-input" />
          <el-button size="small" type="primary" :loading="genLoading" @click="handleGenerate">✨ AI 生成</el-button>
        </div>
      </section>

      <!-- 形象大图/调整弹窗 -->
      <el-dialog v-model="viewerOpen" :title="viewerPersona?.name || '分身形象'" width="480px">
        <div v-if="viewerPersona" class="viewer-body">
          <img :src="viewerPersona.imageUrl" class="viewer-img" :alt="viewerPersona.name" />
          <el-input
            v-model="viewerPrompt" type="textarea" :rows="3"
            placeholder="写改动指令（垫图微调，保持人物不变），如：把衣服换成蓝色传统蒙古袍配银饰头饰，其他保持不变"
          />
          <div class="viewer-actions">
            <el-button type="primary" :loading="viewerLoading" @click="refinePersona">🎨 垫图微调（保持人物）</el-button>
            <el-button v-if="viewerPersona.prompt" :loading="viewerLoading" @click="regeneratePersona">🔄 整体重生成</el-button>
            <el-button @click="viewerOpen = false">关闭</el-button>
          </div>
          <p class="hint-text">垫图微调：以当前图为底，只改你指定的部分（换衣服、换背景），人脸和姿态保持。整体重生成：按描述从零重画，人物会变。微调结果会生成新形象，原图保留。</p>
        </div>
      </el-dialog>

      <!-- 步骤二：口播配音 -->
      <section class="p-card" :style="{ '--ac': '#f59e0b' }">
        <div class="p-card-head">
          <span class="p-step">2</span>
          <div>
            <span class="p-title">口播配音</span>
            <p class="p-desc">写口播文案，AI 转成语音（免费 TTS）</p>
          </div>
        </div>

        <el-input
          v-model="script" type="textarea" :rows="5"
          placeholder="留空点「AI生成」按品牌自动出文案；也可以先写几句要点，再点「AI生成」润色扩写"
        />
        <div class="p-actions">
          <el-button size="small" :loading="scriptLoading" @click="handleGenerateScript">
            ✨ AI 生成文案
          </el-button>
          <el-button size="small" type="primary" :loading="ttsLoading" :disabled="!script.trim()" @click="handleTts">
            🎙️ 生成配音
          </el-button>
          <a v-if="audioUrl" :href="audioUrl" download="voiceover.mp3" class="dl-link">下载音频</a>
        </div>
        <audio v-if="audioUrl" :src="audioUrl" controls class="audio-player" ref="audioRef"></audio>
        <p v-if="ttsError" class="err-text">{{ ttsError }}</p>
        <p v-if="scriptError" class="err-text">{{ scriptError }}</p>
      </section>

      <!-- 步骤三：形象动起来 -->
      <section class="p-card" :style="{ '--ac': '#0071e3' }">
        <div class="p-card-head">
          <span class="p-step">3</span>
          <div>
            <span class="p-title">生成分身视频</span>
            <p class="p-desc">用即梦 AI 让形象照动起来（约 1-3 分钟）</p>
          </div>
        </div>

        <el-input v-model="motionPrompt" size="small" placeholder="动作/场景描述，如：人物面向镜头自然说话，轻微点头，室内柔光" />
        <div class="p-actions">
          <el-select v-model="ratio" size="small" style="width: 90px">
            <el-option label="9:16" value="9:16" />
            <el-option label="16:9" value="16:9" />
            <el-option label="1:1" value="1:1" />
          </el-select>
          <el-button
            size="small" type="primary"
            :loading="videoLoading" :disabled="!activePersona"
            @click="handleVideo"
          >🎬 生成视频</el-button>
          <span v-if="videoStatusText" class="status-text">{{ videoStatusText }}</span>
        </div>

        <div v-if="videoUrl" class="video-wrap">
          <video :src="videoUrl" controls class="video-player" ref="videoRef"></video>
          <div class="p-actions">
            <el-button size="small" :disabled="!audioUrl" @click="playTogether">▶️ 视频+配音同步预览</el-button>
            <a :href="videoUrl" target="_blank" class="dl-link">下载视频</a>
            <el-button size="small" type="success" @click="pushToPublish">📤 推入发布队列</el-button>
          </div>
          <p class="hint-text">提示：当前版本视频与配音是分离的（无唇形同步），发布前可用剪映等工具合成。</p>
        </div>
        <p v-if="videoError" class="err-text">{{ videoError }}</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useImageUpload } from '@/composables/useImageUpload'
import { useTrendingStore } from '@/stores/agent'
import { useBrandStore } from '@/stores/brand'
import { TOKEN_NAME } from '@/config'

interface Persona { id: string; name: string; imageUrl: string; prompt?: string }

const STORAGE_KEY = 'agent_personas'

const agentStore = useTrendingStore()
const brandStore = useBrandStore()
const { triggerUpload } = useImageUpload()

const personas = ref<Persona[]>(loadPersonas())
const activeId = ref<string>(personas.value[0]?.id || '')
const activePersona = computed(() => personas.value.find(p => p.id === activeId.value) || null)

const genPrompt = ref('')
const genLoading = ref(false)

const script = ref('')
const scriptLoading = ref(false)
const scriptError = ref('')
const ttsLoading = ref(false)
const ttsError = ref('')
const audioUrl = ref('')
const audioRef = ref<HTMLAudioElement>()

async function handleGenerateScript() {
  const b = brandStore.activeBrand as any
  if (!b?.name) {
    ElMessage.warning('请先在「品牌管理」里配置品牌信息')
    return
  }
  scriptError.value = ''
  scriptLoading.value = true
  const existing = script.value.trim()
  const brandLines = [
    `品牌：${b.name}${b.slogan ? '（' + b.slogan + '）' : ''}`,
    b.intro ? `简介：${String(b.intro).slice(0, 300)}` : '',
    b.sellingPoints ? `卖点：${b.sellingPoints}` : '',
    Array.isArray(b.products) && b.products.length ? `产品：${b.products.join('、')}` : '',
    b.audienceDesc ? `目标人群：${b.audienceDesc}` : '',
    b.audiencePain ? `痛点：${b.audiencePain}` : '',
    Array.isArray(b.tones) && b.tones.length ? `调性：${b.tones.join('、')}` : '',
    b.taboos ? `避忌：${b.taboos}` : '',
  ].filter(Boolean).join('\n')
  const prompt = existing
    ? `${brandLines}\n\n用户已经写了一段草稿：\n${existing}\n\n请基于品牌信息润色/扩写这段草稿，保持用户原意，输出3-5句、100-200字的短视频口播文案，口语化、第一人称、最后一句是行动号召。只输出最终文案，不要任何解释。`
    : `${brandLines}\n\n请生成一段短视频口播文案：3-5句、100-200字、口语化、第一人称、最后一句是行动号召。只输出文案本身，不要标题、不要"以下是"等前缀。`
  try {
    const resp = await fetch('/api/agent-chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token(), 'x-agent-id': 'copywriter' },
      body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], agentId: 'copywriter', brandContext: b.name, noTools: true }),
    })
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const reader = resp.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('无响应流')
    script.value = ''
    let buffer = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') continue
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'text' && ev.text) script.value += ev.text
        } catch {}
      }
    }
    if (!script.value.trim()) throw new Error('未收到文案内容')
  } catch (e: any) {
    scriptError.value = `生成文案失败：${e?.message || e}`
    ElMessage.error(scriptError.value)
  } finally {
    scriptLoading.value = false
  }
}

const motionPrompt = ref('人物面向镜头自然说话，表情生动，轻微手势，室内柔光')
const ratio = ref('9:16')
const videoLoading = ref(false)
const videoError = ref('')
const videoStatusText = ref('')
const videoUrl = ref('')
const videoRef = ref<HTMLVideoElement>()
let pollTimer: ReturnType<typeof setTimeout> | null = null

function loadPersonas(): Persona[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function savePersonas() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(personas.value))
}
function token() { return localStorage.getItem(TOKEN_NAME) || '' }

function addPersona(imageUrl: string, name: string, prompt?: string) {
  const p: Persona = { id: `p_${Date.now()}`, name, imageUrl, prompt }
  personas.value.unshift(p)
  activeId.value = p.id
  savePersonas()
}

// ── 大图查看 / 调整重生成 ──
const viewerOpen = ref(false)
const viewerPersona = ref<Persona | null>(null)
const viewerPrompt = ref('')
const viewerLoading = ref(false)

function openViewer(p: Persona) {
  viewerPersona.value = p
  viewerPrompt.value = p.prompt || ''
  viewerOpen.value = true
}

// 垫图微调：以当前形象为底图，按指令改局部（换衣服/背景），人物保持不变
async function refinePersona() {
  const p = viewerPersona.value
  const instruction = viewerPrompt.value.trim()
  if (!p || !instruction) { ElMessage.warning('先写改动指令，如：把衣服换成蓝色传统蒙古袍'); return }
  viewerLoading.value = true
  try {
    const resp = await fetch('/api/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token() },
      body: JSON.stringify({ type: 'image', prompt: instruction, ratio: '3:4', image_url: p.imageUrl }),
    })
    const data = await resp.json() as any
    if (data?.url) {
      addPersona(data.url, `${p.name}·改`, instruction)
      viewerOpen.value = false
      ElMessage.success('微调完成，已生成新形象（原图保留）')
    } else {
      ElMessage.error(data?.message || '微调失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '微调失败')
  } finally {
    viewerLoading.value = false
  }
}

async function regeneratePersona() {
  const p = viewerPersona.value
  const desc = viewerPrompt.value.trim()
  if (!p || !desc) { ElMessage.warning('先写好新的形象描述'); return }
  viewerLoading.value = true
  try {
    const resp = await fetch('/api/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token() },
      body: JSON.stringify({ type: 'image', prompt: `professional portrait photo, ${desc}, facing camera, upper body, clean background, high quality`, ratio: '3:4' }),
    })
    const data = await resp.json() as any
    if (data?.url) {
      p.imageUrl = data.url
      p.prompt = desc
      p.name = desc.slice(0, 8)
      savePersonas()
      ElMessage.success('形象已按新描述重新生成')
    } else {
      ElMessage.error(data?.message || '生成失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '生成失败')
  } finally {
    viewerLoading.value = false
  }
}

async function removePersona(id: string) {
  try {
    await ElMessageBox.confirm('确定删除这个分身形象？', '提示', { type: 'warning' })
  } catch { return }
  personas.value = personas.value.filter(p => p.id !== id)
  if (activeId.value === id) activeId.value = personas.value[0]?.id || ''
  savePersonas()
}

function handleUpload() {
  triggerUpload((url) => {
    // KV 返回相对路径，转绝对 URL 供即梦拉取
    const abs = url.startsWith('http') ? url : `${location.origin}${url}`
    addPersona(abs, `分身 ${personas.value.length + 1}`)
    ElMessage.success('形象已保存')
  }, 3 / 4)
}

async function handleGenerate() {
  const desc = genPrompt.value.trim()
  if (!desc) { ElMessage.warning('先描述一下形象'); return }
  genLoading.value = true
  try {
    const resp = await fetch('/api/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token() },
      body: JSON.stringify({ type: 'image', prompt: `professional portrait photo, ${desc}, facing camera, upper body, clean background, high quality`, ratio: '3:4' }),
    })
    const data = await resp.json() as any
    if (data?.url) {
      addPersona(data.url, desc.slice(0, 8), desc)
      ElMessage.success('虚拟形象已生成，点形象上的🔍可查看大图和调整')
    } else {
      ElMessage.error(data?.message || '生成失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '生成失败')
  } finally {
    genLoading.value = false
  }
}

async function handleTts() {
  ttsLoading.value = true
  ttsError.value = ''
  try {
    const resp = await fetch('/api/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token() },
      body: JSON.stringify({ type: 'tts', prompt: script.value.trim(), lang: 'zh' }),
    })
    const data = await resp.json() as any
    if (data?.status === 'ok' && data?.audio) {
      audioUrl.value = data.audio
      ElMessage.success('配音已生成')
    } else {
      ttsError.value = data?.message || '配音生成失败'
    }
  } catch (e: any) {
    ttsError.value = e?.message || '配音生成失败'
  } finally {
    ttsLoading.value = false
  }
}

async function handleVideo() {
  if (!activePersona.value) return
  videoLoading.value = true
  videoError.value = ''
  videoUrl.value = ''
  videoStatusText.value = '提交任务中…'
  try {
    const resp = await fetch('/api/generate-media', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token() },
      body: JSON.stringify({
        type: 'video',
        prompt: motionPrompt.value.trim() || '人物面向镜头自然说话',
        ratio: ratio.value,
        image_url: activePersona.value.imageUrl,
      }),
    })
    const data = await resp.json() as any
    if (data?.status === 'ok' && data?.task_id) {
      videoStatusText.value = '生成中，约 1-3 分钟…'
      pollVideo(data.task_id, 0)
    } else {
      videoError.value = data?.message || '任务提交失败'
      videoLoading.value = false
      videoStatusText.value = ''
    }
  } catch (e: any) {
    videoError.value = e?.message || '任务提交失败'
    videoLoading.value = false
    videoStatusText.value = ''
  }
}

function pollVideo(taskId: string, attempt: number) {
  if (attempt > 60) {
    videoError.value = '生成超时，请稍后重试'
    videoLoading.value = false
    videoStatusText.value = ''
    return
  }
  pollTimer = setTimeout(async () => {
    try {
      const resp = await fetch('/api/video-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      })
      const data = await resp.json() as any
      // video-status 返回 { status: done|failed|processing|queued, video_url }
      if (data?.status === 'done' && data?.video_url) {
        videoUrl.value = data.video_url
        videoLoading.value = false
        videoStatusText.value = ''
        ElMessage.success('分身视频已生成')
        return
      }
      if (data?.status === 'failed' || data?.status === 'error') {
        videoError.value = data?.message || `生成失败（${data?.raw_status || '未知原因'}）`
        videoLoading.value = false
        videoStatusText.value = ''
        return
      }
      videoStatusText.value = data?.status === 'queued' ? '排队中…' : '生成中…'
      pollVideo(taskId, attempt + 1)
    } catch {
      pollVideo(taskId, attempt + 1)
    }
  }, 3000)
}

function playTogether() {
  if (videoRef.value && audioRef.value) {
    videoRef.value.currentTime = 0
    audioRef.value.currentTime = 0
    videoRef.value.muted = true
    videoRef.value.play()
    audioRef.value.play()
  }
}

const PLATFORM_LABELS: Record<string, string> = {
  douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手',
  weibo: '微博', bilibili: 'B站', zhihu: '知乎', shipinhao: '视频号',
}

function pushToPublish() {
  const activeBrand = brandStore.activeBrand as any
  const platformId = activeBrand?.mainPlatforms?.[0] || 'xiaohongshu'
  agentStore.setFlowResults([
    {
      platform: platformId,
      platformName: PLATFORM_LABELS[platformId] || platformId,
      topic: `AI分身口播 ${new Date().toLocaleDateString()}`,
      type: 'copy',
      content: script.value || 'AI 分身口播视频',
      imageUrl: activePersona.value?.imageUrl,
      videoUrl: videoUrl.value,
      videoStatus: 'done',
      published: false,
      createdAt: Date.now(),
    },
    ...agentStore.flowResults,
  ])
  ElMessage.success('已推入发布队列，去「发布管理」查看')
}

onBeforeUnmount(() => { if (pollTimer) clearTimeout(pollTimer) })
</script>

<style scoped>
.agent-page { display: flex; flex-direction: column; gap: 16px; max-width: 1200px; }
.persona-grid { display: flex; flex-direction: column; gap: 14px; }
.p-card {
  background: #ffffff; border: 1px solid rgba(0,0,0,0.07);
  border-left: 3px solid var(--ac, #8b5cf6); border-radius: 14px;
  padding: 18px; box-shadow: 0 2px 12px rgba(0,0,0,0.05);
  display: flex; flex-direction: column; gap: 12px;
}
.p-card-head { display: flex; align-items: center; gap: 10px; }
.p-step {
  width: 26px; height: 26px; border-radius: 50%; flex-shrink: 0;
  background: color-mix(in srgb, var(--ac) 12%, white); color: var(--ac);
  font-size: 13px; font-weight: 800; display: flex; align-items: center; justify-content: center;
}
.p-title { display: block; font-size: 13px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; }
.p-desc { font-size: 11px; color: rgba(29,29,31,0.4); margin: 2px 0 0; }
.p-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.gen-input { flex: 1; min-width: 200px; }

.avatar-list { display: flex; gap: 10px; flex-wrap: wrap; }
.avatar-item {
  position: relative; width: 84px; cursor: pointer; text-align: center;
  border: 2px solid transparent; border-radius: 12px; padding: 4px; transition: border-color 0.15s;
}
.avatar-item.active { border-color: var(--ac); }
.avatar-item img { width: 100%; aspect-ratio: 3/4; object-fit: cover; border-radius: 8px; display: block; }
.avatar-name { font-size: 10px; color: rgba(29,29,31,0.55); display: block; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.avatar-del {
  position: absolute; top: -4px; right: -4px; width: 18px; height: 18px; border-radius: 50%;
  background: rgba(0,0,0,0.55); color: #fff; border: none; font-size: 12px; line-height: 1;
  cursor: pointer; display: none; align-items: center; justify-content: center;
}
.avatar-item:hover .avatar-del { display: flex; }
.avatar-zoom {
  position: absolute; bottom: 22px; right: 2px; width: 22px; height: 22px; border-radius: 6px;
  background: rgba(0,0,0,0.5); border: none; font-size: 11px; cursor: pointer;
  display: none; align-items: center; justify-content: center;
}
.avatar-item:hover .avatar-zoom { display: flex; }
.viewer-body { display: flex; flex-direction: column; gap: 12px; }
.viewer-img { width: 100%; border-radius: 12px; display: block; }
.viewer-actions { display: flex; gap: 8px; }
.avatar-empty { font-size: 12px; color: rgba(29,29,31,0.35); align-self: center; padding: 20px 0; }

.audio-player { width: 100%; height: 36px; }
.video-wrap { display: flex; flex-direction: column; gap: 10px; }
.video-player { max-width: 320px; max-height: 420px; border-radius: 10px; background: #000; }
.dl-link { font-size: 12px; color: var(--ac, #0071e3); text-decoration: none; }
.dl-link:hover { text-decoration: underline; }
.status-text { font-size: 12px; color: rgba(29,29,31,0.5); }
.err-text { font-size: 12px; color: #ef4444; margin: 0; }
.hint-text { font-size: 11px; color: rgba(29,29,31,0.4); margin: 0; }
</style>
