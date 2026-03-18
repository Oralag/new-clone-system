<template>
  <div class="creative-lab">
    <!-- Header -->
    <div class="page-header">
      <div class="header-left">
        <div class="header-badge">
          <span class="header-badge-dot"></span>
          <span>Experimental AI Features</span>
        </div>
        <h1 class="page-title">AI 创意实验室</h1>
        <p class="page-sub">实验性 AI 能力 · 创意无限可能</p>
      </div>
      <div class="header-right">
        <span class="new-badge">NEW</span>
      </div>
    </div>

    <!-- Feature Cards Grid -->
    <div class="feature-grid">
      <div v-for="feature in features" :key="feature.title" class="feature-card">
        <div class="feature-icon" :style="{ background: feature.color }">
          <span class="feature-emoji">{{ feature.emoji }}</span>
        </div>
        <div class="feature-body">
          <div class="feature-title">{{ feature.title }}</div>
          <div class="feature-desc">{{ feature.desc }}</div>
        </div>
      </div>
    </div>

    <!-- Main Area: Workshop + Inspiration -->
    <div class="main-area">
      <!-- Left: AI Creative Workshop (60%) -->
      <div class="workshop-panel apple-card">
        <div class="card-header">
          <div>
            <div class="card-micro">Creative Engine</div>
            <div class="card-title">创意工坊</div>
          </div>
        </div>

        <!-- Tab switcher -->
        <div class="tab-bar">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="tab-btn"
            :class="{ 'tab-btn--active': activeTab === tab.key }"
            @click="activeTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Input -->
        <div class="input-section">
          <textarea
            v-model="inputText"
            class="creative-textarea"
            placeholder="描述你的创意需求...输入品牌关键词、场景或灵感..."
            rows="4"
          ></textarea>
        </div>

        <!-- Params Row -->
        <div class="params-row">
          <div class="param-group">
            <label class="param-label">平台</label>
            <div class="param-options">
              <button
                v-for="p in platforms"
                :key="p.key"
                class="param-btn"
                :class="{ 'param-btn--active': selectedPlatform === p.key }"
                @click="selectedPlatform = p.key"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
          <div class="param-group">
            <label class="param-label">风格</label>
            <div class="param-options">
              <button
                v-for="s in styles"
                :key="s.key"
                class="param-btn"
                :class="{ 'param-btn--active': selectedStyle === s.key }"
                @click="selectedStyle = s.key"
              >
                {{ s.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Generate Button -->
        <button
          class="generate-btn"
          :class="{ 'generate-btn--loading': generating }"
          @click="handleGenerate"
          :disabled="generating"
        >
          <span v-if="!generating" class="generate-icon">✨</span>
          <span v-else class="spinner"></span>
          {{ generating ? '创意引擎运行中...' : '启动创意引擎' }}
        </button>

        <!-- Output Area -->
        <div class="output-area" :class="{ 'output-area--active': output }">
          <div v-if="!output" class="output-placeholder">
            <div class="placeholder-icon">🎯</div>
            <div class="placeholder-title">等待创意启动</div>
            <div class="placeholder-desc">填写需求，选择参数，点击「启动创意引擎」，AI 将为你生成专属创意内容。支持爆款标题、角色文案、剧情脚本、多平台变体等多种创作模式。</div>
          </div>
          <div v-else class="output-content">
            <div class="output-header">
              <span class="output-tag">{{ currentTabLabel }} · {{ currentPlatformLabel }} · {{ currentStyleLabel }}</span>
              <button class="copy-btn" @click="copyOutput">复制</button>
            </div>
            <div class="output-text">{{ output }}</div>
          </div>
        </div>
      </div>

      <!-- Right: Inspiration Panel (40%) -->
      <div class="inspiration-panel apple-card">
        <div class="card-header">
          <div>
            <div class="card-micro">Inspiration Vault</div>
            <div class="card-title">🌟 创意灵感库</div>
          </div>
        </div>
        <div class="inspiration-list">
          <div
            v-for="(tip, index) in inspirationTips"
            :key="index"
            class="inspiration-card"
            @click="applyInspiration(tip)"
          >
            <div class="inspiration-num">{{ String(index + 1).padStart(2, '0') }}</div>
            <div class="inspiration-text">{{ tip }}</div>
            <div class="inspiration-apply">用这个 →</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Stats Row -->
    <div class="stats-row apple-card">
      <div v-for="stat in bottomStats" :key="stat.label" class="bottom-stat">
        <div class="bottom-stat-value">{{ stat.value }}</div>
        <div class="bottom-stat-label">{{ stat.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

const activeTab = ref<string>('title')
const inputText = ref<string>('')
const selectedPlatform = ref<string>('douyin')
const selectedStyle = ref<string>('creative')
const generating = ref<boolean>(false)
const output = ref<string>('')

const features = [
  { emoji: '🎭', title: '角色扮演文案', desc: '让 AI 扮演 KOL 身份创作', color: '#7c3aed' },
  { emoji: '🔥', title: '爆款标题机器', desc: 'AI 生成100%爆款标题公式', color: '#f97316' },
  { emoji: '🎨', title: '视觉脚本生成', desc: '镜头画面 + 文字 + 音效全描述', color: '#ec4899' },
  { emoji: '🧠', title: '竞品内容分析', desc: '分析竞品账号内容策略', color: '#0071e3' },
  { emoji: '✨', title: '内容变体生成', desc: '一稿多版，覆盖不同平台风格', color: '#34d399' },
  { emoji: '🎬', title: '剧情脚本工坊', desc: 'AI 创作完整短剧剧本', color: '#f59e0b' },
]

const tabs = [
  { key: 'title', label: '爆款标题' },
  { key: 'role', label: '角色创作' },
  { key: 'script', label: '剧情脚本' },
  { key: 'variant', label: '变体生成' },
]

const platforms = [
  { key: 'douyin', label: '抖音' },
  { key: 'xiaohongshu', label: '小红书' },
  { key: 'kuaishou', label: '快手' },
]

const styles = [
  { key: 'creative', label: '创意实验' },
  { key: 'professional', label: '专业严肃' },
  { key: 'humor', label: '幽默搞笑' },
  { key: 'emotional', label: '情感共鸣' },
]

const inspirationTips = [
  '如果你的产品会说话，它会说什么？',
  '用一句话让陌生人立刻想买你的产品',
  '从用户最痛的痛点出发，反向讲故事',
  '借用热门影视台词，植入你的品牌场景',
  '用「第一次…的感觉」开头，触发情感共鸣',
  '假设你只有3秒钟，你会说什么？',
]

const bottomStats = [
  { value: '128', label: '今日生成次数' },
  { value: '2,841', label: '创意实验总数' },
  { value: '94%', label: '用户满意度' },
  { value: '6', label: '实验模块数' },
]

const currentTabLabel = computed(() => tabs.find(t => t.key === activeTab.value)?.label ?? '')
const currentPlatformLabel = computed(() => platforms.find(p => p.key === selectedPlatform.value)?.label ?? '')
const currentStyleLabel = computed(() => styles.find(s => s.key === selectedStyle.value)?.label ?? '')

const placeholderOutputs: Record<string, string> = {
  title: `【爆款标题示例 · ${new Date().toLocaleDateString('zh-CN')}】

1️⃣ "月薪3000，我是怎么靠它副业变10000的？"
2️⃣ "同事都问我用什么，其实就是这一个小习惯"
3️⃣ "99%的人都不知道的隐藏用法，学会了真的省钱"
4️⃣ "我妈看了都说好，你还不试试？"
5️⃣ "沉默了三年，今天终于说出这个秘密"

✅ 以上标题基于「悬念式」+「对比式」+「利益点前置」公式生成
📊 预计点击率提升 35-60%`,
  role: `【KOL 角色文案 · 时尚博主人设】

大家好，我是你们的小迷糊姐姐～

今天要分享一个让我用了就离不开的宝贝！说真的，我试过市面上大概20多款同类产品，这个是第一个让我熬夜写测评的。

首先说质感——摸起来像丝绸，但实际上是...（此处省略悬念）

最关键的是效果！我闺蜜第一次见到都问我是不是换了什么护肤品，哈哈。

碎碎念完毕，链接放在评论区第一条！💖`,
  script: `【短剧脚本 · 第1集 · 3分钟版】

场景一：办公室，下午三点
【画面】主角小林坐在电脑前，一脸愁容
【台词】小林（自言自语）：又是这道题，已经第十次了...
【音效】键盘敲击声 + 背景办公室嘈杂声

场景二：咖啡厅，同日傍晚
【画面】好友递来一张名片
【台词】好友：你试过这个吗？我用了之后整个人都不一样了
【特效】慢镜头 + 轻音乐渐入

场景三：家中，次日清晨
【画面】主角神清气爽走出门
【旁白】有时候，改变只需要一个小小的决定。`,
  variant: `【多平台内容变体】

📱 抖音版（15秒短视频文案）：
冲冲冲！姐妹们看过来，这个真的绝了，我用了一周直接下单了三件，闺蜜团全员种草！

📔 小红书版（图文笔记）：
✨ 发现宝藏了朋友们！这次真的是认真在分享。用了整整一个月，每天早上都用，皮肤状态肉眼可见在改善。
细节：质地轻薄、不油腻、没有假白、持妆力强。
总结：适合学生党和上班族，性价比超高！

⚡ 快手版（亲切接地气）：
真心话！这东西我用了就真的回不去了，大家信我，买了不后悔，不信你们试试看，不好用来骂我！`,
}

function handleGenerate() {
  if (!inputText.value.trim() && activeTab.value) {
    // Use tab default if no input
  }
  generating.value = true
  output.value = ''
  setTimeout(() => {
    generating.value = false
    output.value = placeholderOutputs[activeTab.value] || placeholderOutputs.title
  }, 2000)
}

function applyInspiration(tip: string) {
  inputText.value = tip
}

function copyOutput() {
  if (output.value) {
    navigator.clipboard.writeText(output.value).catch(() => {})
  }
}
</script>

<style scoped>
.creative-lab {
  max-width: 1100px;
  padding-bottom: 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

/* ── Header ── */
.page-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding-bottom: 28px;
  border-bottom: 1px solid rgba(0,0,0,0.06);
}

.header-badge {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 12px;
  background: rgba(124,58,237,0.08);
  border-radius: 20px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  color: #7c3aed;
  margin-bottom: 14px;
}

.header-badge-dot {
  width: 5px;
  height: 5px;
  background: #7c3aed;
  border-radius: 50%;
  animation: badgePulse 2s ease-in-out infinite;
}

@keyframes badgePulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

.page-title {
  font-size: clamp(28px, 4vw, 48px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.0;
  color: #1d1d1f;
  margin: 0 0 10px;
}

.page-sub {
  font-size: 14px;
  color: rgba(29,29,31,0.4);
  font-weight: 500;
  margin: 0;
  letter-spacing: -0.01em;
}

.new-badge {
  display: inline-flex;
  align-items: center;
  padding: 6px 16px;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  border-radius: 20px;
  font-size: 11px;
  font-weight: 800;
  color: #fff;
  letter-spacing: 0.12em;
  box-shadow: 0 4px 14px rgba(124,58,237,0.3);
}

/* ── Feature Grid ── */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.feature-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--faint, rgba(0,0,0,0.06));
  border-radius: 18px;
  padding: 18px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  transition: all 0.5s cubic-bezier(0.23,1,0.32,1);
  cursor: default;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 16px 32px rgba(0,0,0,0.07);
  border-color: rgba(0,0,0,0.09);
}

.feature-icon {
  width: 42px;
  height: 42px;
  border-radius: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: transform 0.4s cubic-bezier(0.23,1,0.32,1);
}

.feature-card:hover .feature-icon { transform: rotate(-8deg) scale(1.1); }

.feature-emoji {
  font-size: 20px;
  line-height: 1;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.15));
}

.feature-body { flex: 1; overflow: hidden; }

.feature-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark, #1d1d1f);
  margin-bottom: 3px;
  letter-spacing: -0.02em;
}

.feature-desc {
  font-size: 11px;
  color: var(--mid, rgba(29,29,31,0.4));
  font-weight: 500;
  line-height: 1.4;
}

/* ── Apple Card ── */
.apple-card {
  background: var(--card-bg, #ffffff);
  border: 1px solid var(--faint, rgba(0,0,0,0.06));
  border-radius: 24px;
  padding: 28px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 22px;
}

.card-micro {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: var(--dim, rgba(29,29,31,0.28));
  margin-bottom: 4px;
}

.card-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--dark, #1d1d1f);
  letter-spacing: -0.03em;
}

/* ── Main Area ── */
.main-area {
  display: grid;
  grid-template-columns: 3fr 2fr;
  gap: 16px;
  align-items: start;
}

/* Workshop Panel */
.workshop-panel { display: flex; flex-direction: column; gap: 0; }

/* Tabs */
.tab-bar {
  display: flex;
  gap: 4px;
  background: #f5f5f7;
  border-radius: 12px;
  padding: 4px;
  margin-bottom: 16px;
}

.tab-btn {
  flex: 1;
  padding: 7px 10px;
  border-radius: 9px;
  border: none;
  background: transparent;
  font-size: 12px;
  font-weight: 600;
  color: var(--mid, rgba(29,29,31,0.45));
  cursor: pointer;
  transition: all 0.2s;
  letter-spacing: -0.01em;
  white-space: nowrap;
}

.tab-btn--active {
  background: var(--card-bg, #ffffff);
  color: var(--dark, #1d1d1f);
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
}

/* Textarea */
.input-section { margin-bottom: 16px; }

.creative-textarea {
  width: 100%;
  border: 1px solid var(--faint, rgba(0,0,0,0.09));
  border-radius: 14px;
  padding: 14px 16px;
  font-size: 13px;
  font-family: 'Inter', -apple-system, sans-serif;
  color: var(--dark, #1d1d1f);
  background: var(--gray, #f9f9fb);
  resize: vertical;
  outline: none;
  line-height: 1.6;
  transition: border-color 0.2s, background 0.2s;
  box-sizing: border-box;
}

.creative-textarea:focus {
  border-color: rgba(0,113,227,0.4);
  background: var(--card-bg, #fff);
}

.creative-textarea::placeholder { color: var(--dim, rgba(29,29,31,0.3)); }

/* Params */
.params-row {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 18px;
}

.param-group { display: flex; align-items: center; gap: 10px; }

.param-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(29,29,31,0.4);
  white-space: nowrap;
  width: 28px;
  flex-shrink: 0;
}

.param-options { display: flex; gap: 6px; flex-wrap: wrap; }

.param-btn {
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid var(--faint, rgba(0,0,0,0.09));
  background: var(--gray, #f5f5f7);
  font-size: 11px;
  font-weight: 600;
  color: var(--mid, rgba(29,29,31,0.5));
  cursor: pointer;
  transition: all 0.15s;
}

.param-btn:hover { border-color: var(--border, rgba(0,0,0,0.15)); color: var(--dark, #1d1d1f); }

.param-btn--active {
  background: var(--dark, #1d1d1f);
  color: var(--card-bg, #fff);
  border-color: transparent;
}

/* Generate Button */
.generate-btn {
  width: 100%;
  padding: 14px;
  border-radius: 14px;
  border: none;
  background: linear-gradient(135deg, #7c3aed 0%, #a855f7 50%, #ec4899 100%);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.3s;
  letter-spacing: -0.01em;
  box-shadow: 0 4px 14px rgba(124,58,237,0.3);
  margin-bottom: 18px;
}

.generate-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(124,58,237,0.35);
}

.generate-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }

.generate-btn--loading { background: linear-gradient(135deg, #6d28d9, #9333ea, #db2777); }

.generate-icon { font-size: 16px; }

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes spin { to { transform: rotate(360deg); } }

/* Output Area */
.output-area {
  background: var(--gray, #f9f9fb);
  border: 1px solid var(--faint, rgba(0,0,0,0.06));
  border-radius: 16px;
  min-height: 160px;
  padding: 20px;
  transition: border-color 0.2s;
}

.output-area--active {
  border-color: rgba(124,58,237,0.2);
  background: var(--card-bg, #fff);
}

.output-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 16px 0;
  gap: 10px;
}

.placeholder-icon { font-size: 28px; opacity: 0.5; }

.placeholder-title {
  font-size: 13px;
  font-weight: 700;
  color: rgba(29,29,31,0.3);
  letter-spacing: -0.01em;
}

.placeholder-desc {
  font-size: 12px;
  color: rgba(29,29,31,0.25);
  line-height: 1.6;
  max-width: 380px;
  font-weight: 500;
}

.output-content { display: flex; flex-direction: column; gap: 12px; }

.output-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.output-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: rgba(124,58,237,0.6);
  background: rgba(124,58,237,0.06);
  padding: 3px 10px;
  border-radius: 20px;
}

.copy-btn {
  font-size: 12px;
  font-weight: 600;
  color: #0071e3;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
  transition: opacity 0.15s;
}

.copy-btn:hover { opacity: 0.7; }

.output-text {
  font-size: 13px;
  color: var(--dark, #1d1d1f);
  line-height: 1.75;
  white-space: pre-wrap;
  font-weight: 400;
}

/* Inspiration Panel */
.inspiration-panel { height: fit-content; }

.inspiration-list { display: flex; flex-direction: column; gap: 8px; }

.inspiration-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--faint, rgba(0,0,0,0.06));
  background: var(--gray, #f9f9fb);
  cursor: pointer;
  transition: all 0.2s;
}

.inspiration-card:hover {
  background: var(--card-bg, #fff);
  border-color: rgba(0,113,227,0.2);
  box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

.inspiration-card:hover .inspiration-apply { opacity: 1; }

.inspiration-num {
  font-size: 11px;
  font-weight: 800;
  color: var(--dim, rgba(29,29,31,0.2));
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 20px;
}

.inspiration-text {
  flex: 1;
  font-size: 12px;
  color: var(--mid, rgba(29,29,31,0.65));
  font-weight: 500;
  line-height: 1.4;
}

.inspiration-apply {
  font-size: 11px;
  font-weight: 600;
  color: #0071e3;
  opacity: 0;
  transition: opacity 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ── Bottom Stats ── */
.stats-row {
  display: flex;
  gap: 0;
  padding: 0;
  overflow: hidden;
}

.bottom-stat {
  flex: 1;
  text-align: center;
  padding: 24px 16px;
  border-right: 1px solid rgba(0,0,0,0.05);
}

.bottom-stat:last-child { border-right: none; }

.bottom-stat-value {
  font-size: 32px;
  font-weight: 800;
  color: var(--dark, #1d1d1f);
  letter-spacing: -0.04em;
  line-height: 1;
  margin-bottom: 6px;
}

.bottom-stat-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--dim, rgba(29,29,31,0.28));
}

/* ── Responsive ── */
@media (max-width: 900px) {
  .feature-grid { grid-template-columns: repeat(2, 1fr); }
  .main-area { grid-template-columns: 1fr; }
}

@media (max-width: 600px) {
  .feature-grid { grid-template-columns: 1fr; }
  .stats-row { flex-wrap: wrap; }
  .bottom-stat { min-width: 50%; border-bottom: 1px solid rgba(0,0,0,0.05); }
  .tab-bar { flex-wrap: wrap; }
  .tab-btn { flex: none; }
}
</style>
