<template>
  <div class="poster-page">
    <div class="page-title">图文海报</div>

    <div class="two-col">
      <div class="config-panel card">
        <div class="field">
          <label class="field-label">标题</label>
          <input v-model="title" class="field-input text-input" placeholder="输入海报标题..." />
        </div>

        <div class="field">
          <label class="field-label">内容描述</label>
          <textarea v-model="content" class="field-textarea text-area" rows="4" placeholder="描述海报内容要点..." />
        </div>

        <div class="field">
          <label class="field-label">视觉风格</label>
          <div class="chip-group">
            <span
              v-for="s in styles"
              :key="s"
              class="chip"
              :class="{ active: style === s }"
              @click="style = s"
            >{{ s }}</span>
          </div>
        </div>

        <div class="field">
          <label class="field-label">发布平台</label>
          <div class="chip-group">
            <span
              v-for="p in platforms"
              :key="p"
              class="chip"
              :class="{ active: platform === p }"
              @click="platform = p"
            >{{ p }}</span>
          </div>
        </div>

        <button class="btn-generate" :disabled="generating || !title.trim()" @click="generate">
          <span v-if="generating">✨ 生成中...</span>
          <span v-else>✨ 生成海报文案</span>
        </button>
      </div>

      <div class="result-panel card">
        <div class="result-header">
          <span class="result-label">海报文案建议</span>
          <button v-if="result" class="btn-copy" @click="copyResult">📋 复制</button>
        </div>
        <div v-if="!result && !generating" class="result-empty">
          <div class="empty-icon">🖼️</div>
          <div class="empty-text">填写信息后生成海报文案</div>
        </div>
        <div v-else class="result-content text-area">
          <span v-if="generating && !result" class="cursor-blink">▌</span>
          {{ result }}<span v-if="generating && result" class="cursor-blink">▌</span>
        </div>
        <div v-if="copied" class="copy-toast">已复制 ✓</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useBrandStore } from '@/stores/brand'

const brandStore = useBrandStore()

const title = ref('')
const content = ref('')
const style = ref('简约')
const platform = ref('小红书')
const result = ref('')
const generating = ref(false)
const copied = ref(false)

const styles = ['简约', '活泼', '商务', '国潮']
const platforms = ['抖音', '小红书', '快手', '微博']

function buildPrompt() {
  return `请为${platform.value}平台生成一套图文海报文案方案。\n标题：${title.value}\n内容要点：${content.value}\n视觉风格：${style.value}\n\n请提供：1. 主标题文案（3个版本）2. 副标题/slogan 3. 正文要点（3-5条）4. CTA行动号召语 5. 配色建议`
}

async function generate() {
  generating.value = true
  result.value = ''
  try {
    const resp = await fetch('/api/ai-chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-erp-token': localStorage.getItem('erp_token') || '',
      },
      body: JSON.stringify({
        messages: [{ role: 'user', content: buildPrompt() }],
        system: brandStore.systemPrompt,
      }),
    })
    const reader = resp.body!.getReader()
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value)
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data:')) continue
        const data = line.slice(5).trim()
        if (data === '[DONE]') break
        try {
          const obj = JSON.parse(data)
          if (obj.type === 'text') result.value += obj.text
        } catch {}
      }
    }
  } finally {
    generating.value = false
  }
}

async function copyResult() {
  await navigator.clipboard.writeText(result.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.poster-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; align-items: start; }
.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
.field { margin-bottom: 18px; }
.field-label { display: block; font-size: 12px; font-weight: 600; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 8px; }
.field-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13.5px;
  background: #f8fafc;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.field-input:focus { outline: none; border-color: #93c5fd; background: #fff; }
.field-textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 13.5px;
  resize: vertical;
  background: #f8fafc;
  color: #1e293b;
  font-family: inherit;
  transition: border-color 0.15s;
  box-sizing: border-box;
}
.field-textarea:focus { outline: none; border-color: #93c5fd; background: #fff; }
.chip-group { display: flex; flex-wrap: wrap; gap: 7px; }
.chip {
  padding: 5px 14px;
  border-radius: 20px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #64748b;
  font-size: 12.5px;
  cursor: pointer;
  transition: all 0.15s;
}
.chip:hover { border-color: #93c5fd; color: #2563eb; }
.chip.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 500; }
.btn-generate {
  width: 100%;
  padding: 11px;
  background: #2563eb;
  color: #fff;
  border: none;
  border-radius: 9px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}
.btn-generate:hover { background: #1d4ed8; }
.btn-generate:disabled { opacity: 0.6; cursor: not-allowed; }
.result-panel { min-height: 400px; display: flex; flex-direction: column; position: relative; }
.result-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.result-label { font-size: 13px; font-weight: 600; color: #374151; }
.btn-copy { padding: 5px 12px; border: 1px solid #e2e8f0; border-radius: 6px; background: #f8fafc; color: #64748b; font-size: 12px; cursor: pointer; transition: all 0.15s; }
.btn-copy:hover { border-color: #93c5fd; color: #2563eb; }
.result-empty { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; }
.empty-icon { font-size: 36px; margin-bottom: 10px; }
.empty-text { font-size: 13px; color: #94a3b8; }
.result-content { flex: 1; white-space: pre-wrap; font-size: 14px; line-height: 1.8; color: #1e293b; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px; min-height: 300px; }
.text-area { font-family: inherit; }
.cursor-blink { animation: blink 1s infinite; color: #2563eb; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
.copy-toast { position: absolute; bottom: 16px; right: 16px; background: #22c55e; color: #fff; padding: 6px 14px; border-radius: 6px; font-size: 12px; font-weight: 500; }
@media (max-width: 767px) { .two-col { grid-template-columns: 1fr; } }
</style>
