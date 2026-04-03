<template>
  <div class="library-page">
    <!-- 顶部栏 -->
    <div class="library-header">
      <div class="header-left">
        <span class="header-emoji">📚</span>
        <div class="header-info">
          <h2 class="header-title">图书馆</h2>
          <span class="header-sub">LIBRARY · {{ activeTab === 'knowledge' ? knowledgeModules.length + ' 个知识域' : userBooks.length + ' 本藏书' }}</span>
        </div>
      </div>
      <div class="header-right">
        <!-- Tab 切换 -->
        <div class="tab-switch">
          <button :class="['tab-btn', activeTab === 'knowledge' ? 'active' : '']" @click="activeTab = 'knowledge'">
            🧬 知识图谱
          </button>
          <button :class="['tab-btn', activeTab === 'books' ? 'active' : '']" @click="activeTab = 'books'">
            📖 藏书架
          </button>
        </div>
        <button v-if="activeTab === 'books'" class="add-btn" @click="showForm = !showForm">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M6 1v10M1 6h10"/>
          </svg>
          添加书本
        </button>
      </div>
    </div>

    <!-- ===== 知识图谱 Tab ===== -->
    <div v-if="activeTab === 'knowledge'" class="knowledge-panel">
      <div class="knowledge-intro">
        <span class="intro-icon">⚡</span>
        <span class="intro-text">亚当的认知能力域 — 内置知识结构，影响其分析判断与决策风格</span>
      </div>
      <div class="knowledge-grid">
        <div
          v-for="mod in knowledgeModules"
          :key="mod.id"
          class="knowledge-card"
          :class="{ expanded: expandedId === mod.id }"
          @click="toggleExpand(mod.id)"
        >
          <div class="card-header">
            <div class="card-icon" :style="{ background: mod.color }">{{ mod.icon }}</div>
            <div class="card-meta">
              <div class="card-title">{{ mod.title }}</div>
              <div class="card-domain">{{ mod.domain }}</div>
            </div>
            <div class="card-confidence">
              <div class="conf-bar">
                <div class="conf-fill" :style="{ width: mod.confidence + '%', background: confColor(mod.confidence) }"></div>
              </div>
              <span class="conf-num" :style="{ color: confColor(mod.confidence) }">{{ mod.confidence }}%</span>
            </div>
          </div>
          <div class="card-tags">
            <span v-for="tag in mod.tags" :key="tag" class="card-tag">{{ tag }}</span>
          </div>
          <div v-if="expandedId === mod.id" class="card-content">
            <div class="content-text">{{ mod.content }}</div>
          </div>
          <div class="card-toggle">{{ expandedId === mod.id ? '收起 ▲' : '展开 ▼' }}</div>
        </div>
      </div>
    </div>

    <!-- ===== 藏书架 Tab ===== -->
    <div v-if="activeTab === 'books'" class="books-panel">
      <!-- 添加表单 -->
      <div v-if="showForm" class="add-form">
        <div class="search-row">
          <input
            v-model="form.title"
            class="form-input search-input"
            placeholder="输入书名，如：定位、穷查理宝典、股票作手回忆录..."
            :disabled="isSearching"
            @keydown.enter.prevent="handleSearch"
          />
          <button class="search-btn" :disabled="!form.title.trim() || isSearching" @click="handleSearch">
            <template v-if="isSearching">
              <span class="searching-dot"></span> 搜索中...
            </template>
            <template v-else>🔍 搜索</template>
          </button>
        </div>
        <div v-if="searchError" class="search-error">{{ searchError }}</div>
        <div v-if="form.content" class="search-preview">
          <div class="preview-header">
            <span class="preview-title">📖 {{ form.title }}</span>
            <div v-if="form.tags" class="preview-tags">
              <span v-for="tag in form.tags.split(',')" :key="tag" class="preview-tag">{{ tag.trim() }}</span>
            </div>
          </div>
          <div class="preview-content">{{ form.content.slice(0, 500) }}{{ form.content.length > 500 ? '...' : '' }}</div>
        </div>
        <div class="form-actions">
          <button class="btn-cancel" @click="showForm = false; form.title = ''; form.content = ''; form.tags = ''; searchError = ''">取消</button>
          <button class="btn-submit" :disabled="!form.title || !form.content" @click="handleAddBook">上架</button>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="userBooks.length === 0 && !showForm" class="empty-shelf">
        <div class="empty-icon">🗂️</div>
        <div class="empty-title">藏书架还是空的</div>
        <div class="empty-desc">点击右上角「添加书本」，给亚当投喂你读过的书<br/>亚当会吸收书中框架，影响他的分析风格</div>
      </div>

      <!-- 书架（始终显示至少3层） -->
      <div v-else class="bookcase">
        <div v-for="(shelfBooks, shelfIdx) in shelves" :key="shelfIdx" class="shelf">
          <div class="shelf-books">
            <template v-if="shelfBooks.length > 0">
              <div
                v-for="book in shelfBooks"
                :key="book.id"
                class="book-spine"
                :class="{ selected: selectedBook?.id === book.id }"
                :style="bookStyle(book, shelfIdx)"
                @click="selectBook(book)"
              >
                <span class="spine-author">用户</span>
                <span class="spine-title">{{ book.title }}</span>
                <div class="spine-decor"></div>
              </div>
            </template>
          </div>
          <div class="shelf-board"></div>
          <div class="shelf-shadow"></div>
        </div>
      </div>
    </div>

    <!-- 沉浸式阅读器（微信阅读风格） -->
    <Teleport to="body">
      <Transition name="reader-fade">
        <div v-if="selectedBook" class="wx-reader" :class="'theme-' + readerTheme" @click="handleReaderClick">

          <!-- 始终可见的退出按钮 -->
          <button class="wx-fixed-back" @click.stop="closeReader">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 4L7 10l6 6"/>
            </svg>
          </button>

          <!-- 顶部栏（点击内容区中央切换显隐） -->
          <Transition name="bar-slide">
            <div v-if="showBars" class="wx-topbar" @click.stop>
              <button class="wx-back" @click="closeReader">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M13 4L7 10l6 6"/>
                </svg>
              </button>
              <div class="wx-title-wrap">
                <div class="wx-book-title">{{ selectedBook.title }}</div>
                <div class="wx-progress-bar">
                  <div class="wx-progress-fill" :style="{ width: progressPct + '%' }"></div>
                </div>
              </div>
              <div class="wx-pct">{{ progressPct }}%</div>
            </div>
          </Transition>

          <!-- 内容区 -->
          <div class="wx-content">
            <!-- 封面页 -->
            <template v-if="currentPage === 0">
              <div class="wx-cover" :style="{ background: getCoverColor(selectedBook) }">
                <div class="wx-cover-deco">❧</div>
                <h2 class="wx-cover-title">{{ selectedBook.title }}</h2>
                <div class="wx-cover-line"></div>
                <div class="wx-cover-tags">
                  <span v-for="tag in selectedBook.tags" :key="tag" class="wx-cover-tag">{{ tag }}</span>
                </div>
                <div class="wx-cover-hint">点击右侧开始阅读</div>
              </div>
            </template>
            <!-- 内容页 -->
            <template v-else>
              <Transition :name="'page-' + pageDir" mode="out-in">
                <div :key="currentPage" class="wx-page-text">
                  <div class="wx-text-body" :style="{ fontSize: fontSize + 'px' }">{{ pages[currentPage - 1] }}</div>
                  <div class="wx-page-num">{{ currentPage }} / {{ pages.length }}</div>
                </div>
              </Transition>
            </template>
          </div>

          <!-- 底部工具栏 -->
          <Transition name="bar-slide-up">
            <div v-if="showBars" class="wx-bottombar" @click.stop>
              <!-- 目录按钮 -->
              <button class="wx-tool-btn" @click="showToc = !showToc">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.8">
                  <path d="M3 5h12M3 9h8M3 13h10"/>
                </svg>
                <span>目录</span>
              </button>

              <!-- 字号 -->
              <div class="wx-fontsize">
                <button class="wx-fs-btn" @click="fontSize = Math.max(12, fontSize - 1)">A-</button>
                <span class="wx-fs-val">{{ fontSize }}</span>
                <button class="wx-fs-btn" @click="fontSize = Math.min(22, fontSize + 1)">A+</button>
              </div>

              <!-- 主题切换 -->
              <div class="wx-themes">
                <button
                  v-for="t in themes" :key="t.key"
                  class="wx-theme-dot"
                  :class="{ active: readerTheme === t.key }"
                  :style="{ background: t.color }"
                  @click="readerTheme = t.key"
                ></button>
              </div>
            </div>
          </Transition>

          <!-- 目录抽屉 -->
          <Transition name="toc-slide">
            <div v-if="showToc" class="wx-toc" @click.stop>
              <div class="wx-toc-header">
                <span>目录</span>
                <button class="wx-toc-close" @click="showToc = false">&times;</button>
              </div>
              <div class="wx-toc-list">
                <div
                  v-for="(item, i) in tocItems"
                  :key="i"
                  class="wx-toc-item"
                  :class="{ active: currentPage - 1 === i }"
                  @click="jumpToPage(i + 1); showToc = false"
                >
                  <span class="wx-toc-num">{{ i + 1 }}</span>
                  <span class="wx-toc-preview">{{ item }}</span>
                </div>
              </div>
            </div>
          </Transition>

        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useAdamStore } from '@/stores/adam'
import type { BookRecord } from '@/types/investment'

const adamStore = useAdamStore()

// ===== 亚当内置知识图谱模块 =====
const KNOWLEDGE_MODULES = [
  {
    id: 'km_technical',
    title: '技术分析',
    domain: '量化 · 价格行为',
    icon: '📈',
    color: 'linear-gradient(135deg, #1a3a5c, #2a5a8c)',
    confidence: 87,
    tags: ['K线形态', '均线系统', 'RSI/MACD', '成交量', '支撑阻力'],
    content: `核心方法论：道氏理论、波浪理论、K线形态识别

均线系统：5/10/20/60/120/250日均线；金叉死叉信号；均线多头/空头排列判断趋势强度

动量指标：RSI超买超卖（>70/<30）；MACD柱状图背离；KDJ随机指标；布林带宽度判断波动率

成交量分析：量价背离、天量见顶信号、缩量突破有效性判断

形态识别：头肩顶底、双顶双底、三角形整理、旗形整理、杯柄形态

局限性认知：技术分析在高流动性市场有效，小市值/低流动性标的容易被操纵；技术信号滞后于基本面变化。`,
  },
  {
    id: 'km_fundamental',
    title: '基本面分析',
    domain: '价值投资 · 财务分析',
    icon: '🏦',
    color: 'linear-gradient(135deg, #2D4A3E, #3D6A5E)',
    confidence: 92,
    tags: ['财务报表', 'DCF估值', 'PE/PB/PS', '护城河', '竞争格局'],
    content: `财务分析三表：利润表（盈利质量）、资产负债表（偿债能力）、现金流量表（造血能力）

核心指标：ROE（净资产收益率）≥15%为优质；毛利率趋势；自由现金流/净利润比值；资产负债率

估值方法：DCF贴现现金流（主观性强，适合稳定现金流企业）；PE相对估值（横向行业比较）；PB适用银行保险；EV/EBITDA适用重资产行业；PS适用高成长亏损企业

护城河识别：品牌溢价、转换成本、网络效应、成本优势、规模效应、牌照壁垒

行业分析：波特五力模型；行业景气度周期；集中度CR4/CR8；龙头溢价逻辑

局限性：财务数据滞后3-12个月；财务造假风险（关注应收账款/存货异常增长）。`,
  },
  {
    id: 'km_behavioral',
    title: '行为金融学',
    domain: '心理 · 市场非理性',
    icon: '🧠',
    color: 'linear-gradient(135deg, #5B2333, #8B3353)',
    confidence: 78,
    tags: ['认知偏差', '损失厌恶', '从众效应', '锚定效应', '过度自信'],
    content: `核心偏差清单：
• 损失厌恶：亏损的痛苦是同等收益快乐的2-2.5倍 → 导致持亏止盈
• 过度自信：高估自身判断准确率，低估不确定性 → 仓位过重
• 锚定效应：被买入价格锚定，影响理性卖出决策
• 从众行为：追涨杀跌，泡沫形成机制
• 近期偏差：过度重视最近发生的事件
• 确认偏误：只寻找支持自己观点的信息
• 处置效应：过早卖出盈利股，持有亏损股太久

市场情绪指标：恐慌贪婪指数、融资融券余额、新增开户数、IPO热度

反向运用：极度恐慌时布局，极度贪婪时减仓。`,
  },
  {
    id: 'km_macro',
    title: '宏观经济分析',
    domain: '周期 · 政策 · 汇率',
    icon: '🌍',
    color: 'linear-gradient(135deg, #4A3728, #6A5738)',
    confidence: 74,
    tags: ['利率周期', '通胀', '货币政策', '经济周期', '大类资产'],
    content: `经济周期四阶段（美林时钟）：
• 复苏期：GDP↑、通胀低 → 股票最优
• 过热期：GDP↑、通胀↑ → 大宗商品最优
• 滞胀期：GDP↓、通胀↑ → 现金最优
• 衰退期：GDP↓、通胀↓ → 债券最优

关键宏观指标：PMI（50分界线）；CPI/PPI剪刀差；M2增速；社融数据；GDP当季同比；失业率

货币政策传导：降准→银行可贷资金↑；降息→无风险利率↓→股票估值↑；量化宽松→流动性泛滥→资产通胀

汇率影响：人民币升值→外资流入A股；出口型企业承压；大宗商品进口成本下降

注意：宏观分析精度有限，更适合判断大方向和配置比例，不适合短期择时。`,
  },
  {
    id: 'km_risk',
    title: '风险管理',
    domain: '仓位 · 止损 · 对冲',
    icon: '🛡️',
    color: 'linear-gradient(135deg, #3B3560, #5B5580)',
    confidence: 83,
    tags: ['仓位管理', 'Kelly公式', 'VaR', '最大回撤', '相关性'],
    content: `仓位管理框架：
• Kelly公式：f* = (bp - q) / b，b=赔率，p=胜率，q=败率；实际使用半Kelly更安全
• 单笔风险控制：单次损失不超过总资金2%（标准）或1%（保守）
• 分散化：单只标的不超过总仓位20%；行业集中度不超过40%

止损纪律：
• 技术止损：跌破关键支撑位
• 比例止损：亏损达买入价7-8%
• 时间止损：持有X天未产生预期收益则离场

回撤管理：最大回撤>20%时强制检视持仓逻辑；连续亏损3笔后降低仓位至半仓

对冲工具：股指期货、期权保护性认沽、反向ETF

风险量化：VaR（在险价值）；压力测试；相关性分析（避免持仓高相关标的）。`,
  },
  {
    id: 'km_psychology',
    title: '交易心理',
    domain: '情绪 · 纪律 · 执行',
    icon: '🎯',
    color: 'linear-gradient(135deg, #1B4D3E, #0F3028)',
    confidence: 69,
    tags: ['纪律', '情绪管理', '复盘', '交易日志', '心流'],
    content: `交易心理的核心矛盾：人类情绪系统进化用于生存，而市场需要的是反直觉行为（人怕亏→要止损；人追涨→要逆向）

高水平交易者的心理特征：
• 结果独立：用期望值而非单次结果评价决策质量
• 过程导向：专注执行系统，不执念每笔盈亏
• 不确定性接受：承认无法预测，只能管理概率
• 快速止损无情绪：止损不是失败，是风控的执行

复盘机制：每笔交易记录"预期逻辑→实际结果→偏差原因"，每月统计胜率/盈亏比/最大单笔亏损

常见心理陷阱：
• 报复性交易（连亏后加倍下注）
• 恐惧性持仓（赚了一点点就跑）
• 希望型持仓（明知逻辑错了还死扛）

注：这是亚当目前相对薄弱的领域，情绪机制还在校准中。`,
  },
]

// ===== 清理旧数据 =====
onMounted(() => {
  // 清理：旧 preset_ 书、adam 伪装书、内容异常的书（AI拒绝生成时写入）
  const BAD_KEYWORDS = ['无法为你生成', '我无法', '超出了我的能力', 'Claude Code', 'Anthropic']
  const toRemove = adamStore.books.filter(b => {
    if (b.id.startsWith('preset_')) return true
    if (b.author === 'adam' && !b.type) return true
    if (b.content && BAD_KEYWORDS.some(kw => b.content.includes(kw))) return true
    return false
  })
  for (const b of toRemove) {
    adamStore.removeBook?.(b.id)
  }
})

const activeTab = ref<'knowledge' | 'books'>('knowledge')
const expandedId = ref<string | null>(null)
const showForm = ref(false)
const selectedBook = ref<BookRecord | null>(null)
const isSearching = ref(false)
const searchError = ref('')
const form = reactive({ title: '', content: '', tags: '' })

const knowledgeModules = computed(() => KNOWLEDGE_MODULES)
const userBooks = computed(() =>
  adamStore.books
    .filter(b => b.type === 'book' || b.author === 'user')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
)

const BOOKS_PER_SHELF = 6
const shelves = computed(() => {
  const result: BookRecord[][] = []
  const all = userBooks.value
  for (let i = 0; i < all.length; i += BOOKS_PER_SHELF) {
    result.push(all.slice(i, i + BOOKS_PER_SHELF))
  }
  while (result.length < 3) result.push([])
  return result
})

function toggleExpand(id: string) {
  expandedId.value = expandedId.value === id ? null : id
}

function confColor(conf: number) {
  if (conf >= 85) return '#22c55e'
  if (conf >= 70) return '#f59e0b'
  return '#ef4444'
}

// 书脊颜色方案（藏书架）
const SPINE_COLORS = [
  { bg: 'linear-gradient(180deg, #8B4513 0%, #6B3410 100%)', text: '#F5DEB3' },
  { bg: 'linear-gradient(180deg, #1a3a5c 0%, #0f2440 100%)', text: '#B8D4E8' },
  { bg: 'linear-gradient(180deg, #5B2333 0%, #3D1522 100%)', text: '#E8C4CF' },
  { bg: 'linear-gradient(180deg, #2D4A3E 0%, #1B2E26 100%)', text: '#B8D4C8' },
  { bg: 'linear-gradient(180deg, #4A3728 0%, #2E2219 100%)', text: '#D4C4A8' },
  { bg: 'linear-gradient(180deg, #3B3560 0%, #252040 100%)', text: '#C4BDE8' },
]

const COVER_COLORS = [
  'linear-gradient(135deg, #8B4513 0%, #A0522D 50%, #6B3410 100%)',
  'linear-gradient(135deg, #1a3a5c 0%, #2a5a8c 50%, #0f2440 100%)',
  'linear-gradient(135deg, #5B2333 0%, #8B3353 50%, #3D1522 100%)',
  'linear-gradient(135deg, #2D4A3E 0%, #3D6A5E 50%, #1B2E26 100%)',
  'linear-gradient(135deg, #4A3728 0%, #6A5738 50%, #2E2219 100%)',
  'linear-gradient(135deg, #3B3560 0%, #5B5580 50%, #252040 100%)',
]

function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function bookStyle(book: BookRecord, shelfIdx: number) {
  const h = hashCode(book.id + shelfIdx)
  const scheme = SPINE_COLORS[h % SPINE_COLORS.length]
  const contentLen = book.content?.length || 100
  const width = Math.max(36, Math.min(70, 36 + Math.floor(contentLen / 200) * 4))
  const height = 160 + (h % 20) - 10
  return {
    background: scheme.bg,
    color: scheme.text,
    width: `${width}px`,
    height: `${height}px`,
  }
}

function getCoverColor(book: BookRecord) {
  const h = hashCode(book.id)
  return COVER_COLORS[h % COVER_COLORS.length]
}

function selectBook(book: BookRecord) {
  selectedBook.value = book
  currentPage.value = 0
  showBars.value = false
  showToc.value = false
  pageDir.value = 'forward'
}

// 清理 Markdown 符号
function cleanContent(raw: string): string {
  return raw
    .replace(/^#{1,6}\s+/gm, '')        // ## 标题符号
    .replace(/\*\*(.+?)\*\*/g, '$1')    // **粗体**
    .replace(/\*(.+?)\*/g, '$1')        // *斜体*
    .replace(/`{1,3}[^`]*`{1,3}/g, '')  // `代码`
    .replace(/^---+$/gm, '────')        // --- 分割线
    .replace(/^\s*[-*]\s+/gm, '• ')     // - 列表项
    .replace(/\n{3,}/g, '\n\n')         // 多余空行压缩成最多一行
    .trim()
}

// 每页约600字
const CHARS_PER_PAGE = 600

const pages = computed(() => {
  const raw = selectedBook.value?.content || ''
  if (!raw) return []
  const content = cleanContent(raw)
  const result: string[] = []
  const paragraphs = content.split(/\n\n+/).filter(p => p.trim())
  let current = ''
  for (const para of paragraphs) {
    if (current.length + para.length + 1 > CHARS_PER_PAGE && current.length > 0) {
      result.push(current.trim())
      current = para
    } else {
      current = current ? current + '\n\n' + para : para
    }
  }
  if (current.trim()) result.push(current.trim())
  return result
})

// 目录：每页取前20字作为标题
const tocItems = computed(() => pages.value.map(p => p.slice(0, 20).replace(/\n/g, ' ') + '…'))

const currentPage = ref(0)
const showBars = ref(false)
const showToc = ref(false)
const pageDir = ref<'forward' | 'back'>('forward')
const fontSize = ref(16)
const readerTheme = ref<'light' | 'dark' | 'sepia'>('sepia')

const themes = [
  { key: 'light', color: '#ffffff' },
  { key: 'sepia', color: '#f5ead0' },
  { key: 'dark', color: '#1a1a1a' },
]

const progressPct = computed(() => {
  if (!pages.value.length) return 0
  return Math.round((currentPage.value / pages.value.length) * 100)
})

function closeReader() {
  selectedBook.value = null
  currentPage.value = 0
  showBars.value = false
  showToc.value = false
}

function prevPage() {
  if (currentPage.value > 0) {
    pageDir.value = 'back'
    currentPage.value--
  }
}

function nextPage() {
  if (currentPage.value <= pages.value.length - 1) {
    pageDir.value = 'forward'
    currentPage.value++
  }
}

function jumpToPage(n: number) {
  pageDir.value = n > currentPage.value ? 'forward' : 'back'
  currentPage.value = n
}

function handleReaderClick(e: MouseEvent) {
  if (showToc.value) { showToc.value = false; return }
  const el = e.currentTarget as HTMLElement
  const x = e.clientX
  const w = el.offsetWidth
  const zone = w / 3
  if (x < zone) {
    prevPage()
  } else if (x > w - zone) {
    nextPage()
  } else {
    showBars.value = !showBars.value
  }
}

function getSpineColor(book: BookRecord) {
  const h = hashCode(book.id)
  const colors = ['#5a3a1a', '#1a2a4a', '#3a1522', '#1a2e26', '#2a1a10', '#252040']
  return colors[h % colors.length]
}

function formatDate(iso: string) {
  if (!iso) return '--'
  const d = new Date(iso)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

async function handleSearch() {
  const title = form.title.trim()
  if (!title || isSearching.value) return
  isSearching.value = true
  searchError.value = ''
  form.content = ''
  form.tags = ''
  try {
    const token = localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/book-search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ title }),
    })
    const data = await res.json()
    if (!res.ok || data.error) {
      searchError.value = data.error || '搜索失败'
      return
    }
    form.content = data.content || ''
    form.tags = (data.tags || []).join(',')
  } catch (e: any) {
    searchError.value = `搜索出错：${e.message}`
  } finally {
    isSearching.value = false
  }
}

function handleAddBook() {
  if (!form.title || !form.content) return
  const tags = form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : []
  adamStore.addBook({
    id: `book_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    title: form.title,
    content: form.content,
    author: 'user',
    type: 'book',
    tags,
    createdAt: new Date().toISOString(),
    linkedEventIds: [],
  })
  form.title = ''
  form.content = ''
  form.tags = ''
  searchError.value = ''
  showForm.value = false
}
</script>

<style scoped>
.library-page {
  max-width: 800px;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

/* 顶部栏 */
.library-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(139,111,71,0.04) 0%, transparent 100%);
  flex-wrap: wrap;
  gap: 10px;
}
.header-left { display: flex; align-items: center; gap: 12px; }
.header-emoji { font-size: 24px; }
.header-info { display: flex; flex-direction: column; gap: 2px; }
.header-title { font-size: 14px; font-weight: 700; color: var(--dark); margin: 0; }
.header-sub {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.header-right {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Tab 切换 */
.tab-switch {
  display: flex;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
}
.tab-btn {
  padding: 5px 12px;
  font-size: 11px;
  font-weight: 600;
  border: none;
  background: transparent;
  color: var(--mid);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}
.tab-btn:hover { background: var(--faint); }
.tab-btn.active {
  background: rgba(139,111,71,0.1);
  color: #8B6F47;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 5px;
  border: 1px solid rgba(139, 111, 71, 0.3);
  background: rgba(139, 111, 71, 0.06);
  color: #8B6F47;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
  white-space: nowrap;
}
.add-btn:hover { background: rgba(139, 111, 71, 0.12); border-color: rgba(139, 111, 71, 0.5); }

/* ===== 知识图谱面板 ===== */
.knowledge-panel {
  padding: 16px 18px;
}

.knowledge-intro {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(139,111,71,0.04);
  border: 1px solid rgba(139,111,71,0.1);
  border-radius: 6px;
  margin-bottom: 16px;
}
.intro-icon { font-size: 14px; }
.intro-text {
  font-size: 11px;
  color: var(--mid);
  line-height: 1.5;
}

.knowledge-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.knowledge-card {
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  background: var(--card-bg);
}
.knowledge-card:hover {
  border-color: rgba(139,111,71,0.3);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.knowledge-card.expanded {
  border-color: rgba(139,111,71,0.4);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.card-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.card-meta {
  flex: 1;
  min-width: 0;
}
.card-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 2px;
}
.card-domain {
  font-size: 10px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.04em;
}

.card-confidence {
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
}
.conf-bar {
  width: 60px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}
.conf-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.3s ease;
}
.conf-num {
  font-size: 11px;
  font-weight: 700;
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 32px;
  text-align: right;
}

.card-tags {
  display: flex;
  gap: 5px;
  flex-wrap: wrap;
  padding: 0 14px 10px;
}
.card-tag {
  font-size: 9px;
  color: var(--dim);
  background: var(--faint);
  padding: 2px 7px;
  border-radius: 3px;
  border: 1px solid var(--border);
}

.card-content {
  padding: 12px 14px;
  border-top: 1px solid var(--border);
  background: var(--faint);
}
.content-text {
  font-size: 12px;
  color: var(--mid);
  line-height: 1.8;
  white-space: pre-wrap;
}

.card-toggle {
  padding: 6px 14px;
  font-size: 10px;
  color: var(--dim);
  text-align: center;
  border-top: 1px solid var(--border);
  background: var(--faint);
  letter-spacing: 0.05em;
}

/* ===== 藏书架面板 ===== */
.books-panel {}

/* 空状态 */
.empty-shelf {
  padding: 48px 20px;
  text-align: center;
}
.empty-icon { font-size: 36px; margin-bottom: 12px; }
.empty-title {
  font-size: 14px;
  font-weight: 700;
  color: var(--dark);
  margin-bottom: 8px;
}
.empty-desc {
  font-size: 12px;
  color: var(--dim);
  line-height: 1.7;
}

/* 添加表单 */
.add-form {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--faint);
}
.search-row { display: flex; gap: 8px; margin-bottom: 12px; }
.search-input { flex: 1; }
.search-btn {
  padding: 8px 16px;
  border: 1px solid rgba(139, 111, 71, 0.3);
  border-radius: 5px;
  background: rgba(139, 111, 71, 0.08);
  color: #8B6F47;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.search-btn:hover:not(:disabled) { background: rgba(139, 111, 71, 0.15); }
.search-btn:disabled { opacity: 0.5; cursor: not-allowed; }
.searching-dot {
  display: inline-block;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: #8B6F47;
  animation: pulse 1s ease-in-out infinite;
}
@keyframes pulse { 0%,100% { opacity: 0.3; } 50% { opacity: 1; } }
.search-error {
  font-size: 12px;
  color: #dc2626;
  margin-bottom: 8px;
  padding: 6px 10px;
  background: rgba(220,38,38,0.06);
  border-radius: 4px;
}
.search-preview {
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--card-bg);
  margin-bottom: 12px;
  overflow: hidden;
}
.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}
.preview-title { font-size: 13px; font-weight: 600; color: var(--dark); }
.preview-tags { display: flex; gap: 4px; }
.preview-tag {
  font-size: 9px;
  color: #8B6F47;
  background: rgba(139,111,71,0.08);
  padding: 1px 6px;
  border-radius: 3px;
  border: 1px solid rgba(139,111,71,0.15);
}
.preview-content {
  padding: 10px 12px;
  font-size: 12px;
  color: var(--mid);
  line-height: 1.7;
  max-height: 200px;
  overflow-y: auto;
  white-space: pre-wrap;
}
.form-actions { display: flex; justify-content: flex-end; gap: 8px; }
.btn-cancel {
  padding: 6px 14px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--card-bg);
  color: var(--mid);
  font-size: 12px;
  cursor: pointer;
  font-family: inherit;
}
.btn-submit {
  padding: 6px 14px;
  border: none;
  border-radius: 5px;
  background: #8B6F47;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
.btn-submit:disabled { opacity: 0.4; cursor: not-allowed; }
.form-input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--card-bg);
  color: var(--dark);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}
.form-input:focus { border-color: #8B6F47; }

/* ===== 书架 ===== */
.bookcase {
  padding: 20px 0 0;
  background:
    repeating-linear-gradient(
      180deg,
      transparent 0px,
      transparent 198px,
      rgba(139,111,71,0.08) 198px,
      rgba(139,111,71,0.08) 200px
    );
}
.shelf { position: relative; margin-bottom: 8px; }
.shelf-books {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  padding: 0 24px;
  min-height: 170px;
}
.book-spine {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-radius: 2px 4px 4px 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow:
    inset -2px 0 4px rgba(0,0,0,0.15),
    inset 2px 0 2px rgba(255,255,255,0.05),
    2px 2px 6px rgba(0,0,0,0.12);
  overflow: hidden;
  flex-shrink: 0;
  padding: 12px 4px;
}
.book-spine::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 3px;
  background: rgba(255,255,255,0.08);
  border-radius: 2px 0 0 2px;
}
.book-spine:hover {
  transform: translateY(-8px);
  box-shadow:
    inset -2px 0 4px rgba(0,0,0,0.15),
    inset 2px 0 2px rgba(255,255,255,0.05),
    3px 8px 16px rgba(0,0,0,0.2);
}
.book-spine.selected {
  transform: translateY(-12px);
  box-shadow:
    inset -2px 0 4px rgba(0,0,0,0.15),
    inset 2px 0 2px rgba(255,255,255,0.05),
    3px 10px 20px rgba(0,0,0,0.25);
}
.spine-author {
  font-size: 7px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  opacity: 0.7;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
  overflow: hidden;
  max-height: 40px;
}
.spine-title {
  font-size: 10px;
  font-weight: 700;
  writing-mode: vertical-rl;
  text-orientation: mixed;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-height: 100px;
  letter-spacing: 0.04em;
}
.spine-decor {
  width: 60%;
  height: 1px;
  background: currentColor;
  opacity: 0.3;
  margin-top: auto;
}
.shelf-board {
  height: 12px;
  background: linear-gradient(180deg, #C4A882 0%, #A8896A 40%, #96775A 100%);
  border-radius: 0 0 2px 2px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2);
  position: relative;
}
.shelf-board::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    rgba(139,111,71,0.2) 0%, rgba(139,111,71,0.05) 20%,
    rgba(139,111,71,0.1) 50%, rgba(139,111,71,0.05) 80%,
    rgba(139,111,71,0.2) 100%
  );
}
.shelf-shadow {
  height: 6px;
  background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 100%);
  margin: 0 4px;
}

/* ===== 沉浸式阅读器（微信阅读风格） ===== */
.wx-reader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  flex-direction: column;
  user-select: none;
  cursor: pointer;
}

/* 主题 */
.theme-light { background: #ffffff; color: #333; }
.theme-sepia  { background: #f5ead0; color: #4a3728; }
.theme-dark   { background: #1a1a1a; color: #c0b89a; }

/* 始终可见的退出按钮 */
.wx-fixed-back {
  position: absolute;
  top: 14px; left: 16px;
  z-index: 30;
  width: 36px; height: 36px;
  border-radius: 50%;
  border: none;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer;
  transition: all 0.15s;
  color: inherit;
}
.theme-light .wx-fixed-back { background: rgba(0,0,0,0.07); color: #333; }
.theme-sepia  .wx-fixed-back { background: rgba(74,55,40,0.12); color: #4a3728; }
.theme-dark   .wx-fixed-back { background: rgba(255,255,255,0.1); color: #c0b89a; }
.wx-fixed-back:hover { transform: scale(1.1); opacity: 0.9; }

/* 顶部栏 */
.wx-topbar {
  position: absolute;
  top: 0; left: 0; right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.theme-light .wx-topbar { background: rgba(255,255,255,0.92); border-bottom: 1px solid rgba(0,0,0,0.08); }
.theme-sepia  .wx-topbar { background: rgba(245,234,208,0.92); border-bottom: 1px solid rgba(74,55,40,0.1); }
.theme-dark   .wx-topbar { background: rgba(26,26,26,0.92);   border-bottom: 1px solid rgba(255,255,255,0.08); }

.wx-back {
  border: none; background: none; padding: 4px; cursor: pointer;
  display: flex; align-items: center; opacity: 0.6; transition: opacity 0.15s;
  color: inherit;
}
.wx-back:hover { opacity: 1; }

.wx-title-wrap { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.wx-book-title { font-size: 13px; font-weight: 600; opacity: 0.85; }
.wx-progress-bar {
  height: 2px; border-radius: 1px;
  background: rgba(128,128,128,0.2);
  overflow: hidden;
}
.wx-progress-fill {
  height: 100%;
  background: #4CAF50;
  border-radius: 1px;
  transition: width 0.3s ease;
}
.wx-pct {
  font-size: 11px;
  opacity: 0.4;
  font-family: 'SF Mono', monospace;
  min-width: 32px;
  text-align: right;
}

/* 内容区 */
.wx-content {
  flex: 1;
  display: flex;
  align-items: stretch;
  overflow: hidden;
  position: relative;
}

/* 封面 */
.wx-cover {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: rgba(255,255,255,0.92);
  text-align: center;
  padding: 40px 32px;
}
.wx-cover-deco { font-size: 32px; opacity: 0.4; font-family: Georgia, serif; }
.wx-cover-title { font-size: 28px; font-weight: 800; line-height: 1.4; margin: 0; }
.wx-cover-line { width: 48px; height: 1px; background: rgba(255,255,255,0.3); }
.wx-cover-tags { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.wx-cover-tag {
  font-size: 11px; padding: 3px 12px; border-radius: 14px;
  background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.8);
}
.wx-cover-hint {
  font-size: 11px; color: rgba(255,255,255,0.3);
  margin-top: 16px; font-family: 'SF Mono', monospace;
}

/* 正文页 */
.wx-page-text {
  flex: 1;
  padding: 64px 8vw 72px;
  display: flex;
  flex-direction: column;
  max-width: 720px;
  margin: 0 auto;
  width: 100%;
}
.wx-text-body {
  flex: 1;
  line-height: 1.75;
  white-space: pre-wrap;
  font-family: 'Georgia', 'Noto Serif SC', 'Source Han Serif CN', serif;
  word-break: break-all;
  overflow: hidden;
}
.wx-page-num {
  text-align: center;
  font-size: 11px;
  opacity: 0.3;
  font-family: 'SF Mono', monospace;
  margin-top: 20px;
  letter-spacing: 0.1em;
}

/* 底部工具栏 */
.wx-bottombar {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 14px 24px 24px;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  gap: 20px;
}
.theme-light .wx-bottombar { background: rgba(255,255,255,0.92); border-top: 1px solid rgba(0,0,0,0.08); }
.theme-sepia  .wx-bottombar { background: rgba(245,234,208,0.92); border-top: 1px solid rgba(74,55,40,0.1); }
.theme-dark   .wx-bottombar { background: rgba(26,26,26,0.92);   border-top: 1px solid rgba(255,255,255,0.08); }

.wx-tool-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  border: none; background: none; cursor: pointer; color: inherit;
  opacity: 0.6; font-size: 11px; font-family: inherit; padding: 4px 8px;
  transition: opacity 0.15s;
}
.wx-tool-btn:hover { opacity: 1; }

.wx-fontsize {
  display: flex; align-items: center; gap: 12px;
}
.wx-fs-btn {
  border: 1px solid currentColor; border-radius: 4px;
  background: none; cursor: pointer; color: inherit; opacity: 0.5;
  font-size: 12px; font-weight: 700; padding: 3px 10px;
  font-family: inherit; transition: opacity 0.15s;
}
.wx-fs-btn:hover { opacity: 1; }
.wx-fs-val { font-size: 13px; opacity: 0.6; min-width: 20px; text-align: center; }

.wx-themes {
  display: flex; align-items: center; gap: 8px;
}
.wx-theme-dot {
  width: 24px; height: 24px; border-radius: 50%;
  border: 2px solid transparent; cursor: pointer;
  transition: all 0.15s;
  box-shadow: 0 1px 4px rgba(0,0,0,0.15);
}
.wx-theme-dot.active { border-color: #4CAF50; transform: scale(1.15); }

/* 目录抽屉 */
.wx-toc {
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 280px;
  z-index: 20;
  display: flex;
  flex-direction: column;
  box-shadow: 4px 0 24px rgba(0,0,0,0.15);
}
.theme-light .wx-toc { background: #fff; }
.theme-sepia  .wx-toc { background: #f0dfc0; }
.theme-dark   .wx-toc { background: #232323; }

.wx-toc-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 18px;
  font-size: 14px; font-weight: 700;
  border-bottom: 1px solid rgba(128,128,128,0.15);
}
.wx-toc-close {
  border: none; background: none; font-size: 20px; cursor: pointer;
  color: inherit; opacity: 0.5; line-height: 1;
}
.wx-toc-close:hover { opacity: 1; }
.wx-toc-list { flex: 1; overflow-y: auto; padding: 8px 0; }
.wx-toc-item {
  display: flex; align-items: baseline; gap: 10px;
  padding: 10px 18px; cursor: pointer;
  transition: background 0.12s;
  font-size: 13px; line-height: 1.5;
}
.wx-toc-item:hover { background: rgba(128,128,128,0.08); }
.wx-toc-item.active { background: rgba(76,175,80,0.1); color: #4CAF50; }
.wx-toc-num {
  font-size: 10px; opacity: 0.35;
  font-family: 'SF Mono', monospace; min-width: 18px; flex-shrink: 0;
}
.wx-toc-preview { opacity: 0.75; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 翻页动画 */
.page-forward-enter-active,
.page-forward-leave-active,
.page-back-enter-active,
.page-back-leave-active { transition: all 0.22s ease; }

.page-forward-enter-from { opacity: 0; transform: translateX(30px); }
.page-forward-leave-to   { opacity: 0; transform: translateX(-30px); }
.page-back-enter-from    { opacity: 0; transform: translateX(-30px); }
.page-back-leave-to      { opacity: 0; transform: translateX(30px); }

/* 顶底栏动画 */
.bar-slide-enter-active, .bar-slide-leave-active { transition: all 0.2s ease; }
.bar-slide-enter-from, .bar-slide-leave-to { opacity: 0; transform: translateY(-100%); }
.bar-slide-up-enter-active, .bar-slide-up-leave-active { transition: all 0.2s ease; }
.bar-slide-up-enter-from, .bar-slide-up-leave-to { opacity: 0; transform: translateY(100%); }

/* 目录动画 */
.toc-slide-enter-active, .toc-slide-leave-active { transition: transform 0.25s ease; }
.toc-slide-enter-from, .toc-slide-leave-to { transform: translateX(-100%); }

/* 阅读器进出动画 */
.reader-fade-enter-active { transition: opacity 0.25s ease; }
.reader-fade-leave-active { transition: opacity 0.2s ease; }
.reader-fade-enter-from, .reader-fade-leave-to { opacity: 0; }

/* 移动端 */
@media (max-width: 640px) {
  .shelf-books { padding: 0 12px; gap: 2px; }
  .book-spine { padding: 8px 3px; }
  .spine-title { font-size: 9px; }
  .wx-page-text { padding: 64px 6vw 72px; }
  .wx-toc { width: 240px; }
  .tab-btn { padding: 5px 8px; font-size: 10px; }
}
</style>
