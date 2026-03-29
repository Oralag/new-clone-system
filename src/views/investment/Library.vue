<template>
  <div class="library-page">
    <!-- 顶部栏 -->
    <div class="library-header">
      <div class="header-left">
        <span class="header-emoji">📚</span>
        <div class="header-info">
          <h2 class="header-title">知识书架</h2>
          <span class="header-sub">LIBRARY · {{ books.length }} 本藏书</span>
        </div>
      </div>
      <button class="add-btn" @click="showForm = !showForm">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M6 1v10M1 6h10"/>
        </svg>
        添加书本
      </button>
    </div>

    <!-- 添加表单 -->
    <div v-if="showForm" class="add-form">
      <div class="search-row">
        <input
          v-model="form.title"
          class="form-input search-input"
          placeholder="输入书名，如：定位、营销管理、穷查理宝典..."
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

    <!-- 书架（始终显示至少3层） -->
    <div class="bookcase">
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
              <span class="spine-author">{{ authorLabel(book.author) }}</span>
              <span class="spine-title">{{ book.title }}</span>
              <div class="spine-decor"></div>
            </div>
          </template>
        </div>
        <div class="shelf-board"></div>
        <div class="shelf-shadow"></div>
      </div>
    </div>

    <!-- 展开书本内容 -->
    <Teleport to="body">
      <Transition name="book-modal">
        <div v-if="selectedBook" class="book-overlay" @click.self="selectedBook = null">
          <div class="book-open">
            <div class="book-open-cover" :style="{ background: getCoverColor(selectedBook) }">
              <button class="close-btn" @click="selectedBook = null">&times;</button>
              <div class="cover-content">
                <div class="cover-icon">{{ selectedBook.author === 'user' ? '👤' : '🧬' }}</div>
                <h2 class="cover-title">{{ selectedBook.title }}</h2>
                <div class="cover-meta">
                  <span>{{ authorLabel(selectedBook.author) }}</span>
                  <span>{{ formatDate(selectedBook.createdAt) }}</span>
                </div>
                <div v-if="selectedBook.tags?.length" class="cover-tags">
                  <span v-for="tag in selectedBook.tags" :key="tag" class="cover-tag">{{ tag }}</span>
                </div>
              </div>
            </div>
            <div class="book-open-pages">
              <div class="pages-content">{{ selectedBook.content }}</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAdamStore } from '@/stores/adam'
import type { BookRecord } from '@/types/investment'

const adamStore = useAdamStore()

// 预置书籍：如果书架里没有就自动添加
const PRESET_BOOKS: Omit<BookRecord, 'createdAt'>[] = [
  {
    id: 'preset_marketing_mgmt',
    title: '营销管理（第16版）',
    content: `作者：菲利普·科特勒 / 凯文·莱恩·凯勒

【核心框架】

一、营销环境分析
- PESTEL分析：政治、经济、社会、技术、环境、法律六大宏观因素
- 波特五力模型：供应商议价力、买方议价力、替代品威胁、新进入者威胁、行业竞争
- SWOT矩阵：输出SO（增长）、WO（扭转）、ST（防御）、WT（撤退）四象限策略

二、STP战略
- 市场细分：地理、人口、心理、行为四维度切割市场
- 目标市场选择：无差异/差异化/集中化/微观四种覆盖策略
- 定位声明：For [目标客群] who [需求], [品牌] is [品类] that [差异化利益]
- 感知图（Perceptual Map）：可视化品牌在消费者心智中的位置

三、营销组合 4P / 7P
- 产品（Product）：核心利益→基本产品→期望产品→延伸产品→潜在产品；产品线长度/宽度/深度决策；新品开发Stage-Gate流程；PLC（导入→成长→成熟→衰退）生命周期管理
- 价格（Price）：成本加成、价值定价、心理定价（尾数/锚定/分层）、竞争定价、撇脂定价、渗透定价、动态定价
- 渠道（Place）：直销 vs 间接分销；渠道层级设计；渠道冲突管理；全渠道O2O整合
- 促销（Promotion）：IMC整合营销传播 — 广告、销售促进、公关、人员推销、直销与数字营销
- 服务扩展 3P：人员（People）、流程（Process）、有形展示（Physical Evidence）

四、消费者行为
- 购买决策5阶段：问题识别→信息搜索→方案评估→购买决策→购后行为
- 影响因素4层：文化因素→社会因素→个人因素→心理因素
- B2B采购中心6角色：发起者、使用者、影响者、决策者、批准者、购买者
- 行为经济学：损失厌恶、社会认同、稀缺效应、锚定效应、框架效应

五、品牌管理与CRM
- Keller CBBE模型：品牌认知→品牌含义→品牌反应→品牌关系
- 品牌架构：品牌屋 vs 背书品牌 vs 独立品牌
- CLV（客户终身价值）= Σ(年利润 × 留存率^t / (1+折现率)^t)
- RFM分析：最近购买时间(R)、购买频率(F)、消费金额(M)
- NPS净推荐值 = 推荐者% - 贬损者%

六、数字营销
- SEO/SEM搜索营销；社交媒体策略；内容营销漏斗（TOFU→MOFU→BOFU）
- 营销自动化；私域流量运营；AARRR海盗漏斗（获取→激活→留存→收入→推荐）
- A/B测试方法论

七、营销度量
- 营销ROI = (营销贡献利润 - 营销成本) / 营销成本
- CAC客户获取成本；LTV/CAC比率 ≥ 3为健康
- 转化率优化（CRO）；归因模型`,
    author: 'adam',
    tags: ['营销', 'STP', '4P', 'SWOT', '品牌管理'],
    linkedEventIds: [],
  },
]

onMounted(() => {
  for (const preset of PRESET_BOOKS) {
    if (!adamStore.books.find(b => b.id === preset.id)) {
      adamStore.addBook({ ...preset, createdAt: new Date().toISOString() })
    }
  }
})

const showForm = ref(false)
const selectedBook = ref<BookRecord | null>(null)
const isSearching = ref(false)
const searchError = ref('')
const form = reactive({ title: '', content: '', tags: '' })

const books = computed(() => adamStore.books)
const sortedBooks = computed(() =>
  [...books.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
)

const BOOKS_PER_SHELF = 6

const shelves = computed(() => {
  const result: BookRecord[][] = []
  const all = sortedBooks.value
  for (let i = 0; i < all.length; i += BOOKS_PER_SHELF) {
    result.push(all.slice(i, i + BOOKS_PER_SHELF))
  }
  // 至少显示3层书架
  while (result.length < 3) result.push([])
  return result
})

// 书脊颜色方案
const SPINE_COLORS = [
  { bg: 'linear-gradient(180deg, #8B4513 0%, #6B3410 100%)', text: '#F5DEB3' },
  { bg: 'linear-gradient(180deg, #1a3a5c 0%, #0f2440 100%)', text: '#B8D4E8' },
  { bg: 'linear-gradient(180deg, #5B2333 0%, #3D1522 100%)', text: '#E8C4CF' },
  { bg: 'linear-gradient(180deg, #2D4A3E 0%, #1B2E26 100%)', text: '#B8D4C8' },
  { bg: 'linear-gradient(180deg, #4A3728 0%, #2E2219 100%)', text: '#D4C4A8' },
  { bg: 'linear-gradient(180deg, #3B3560 0%, #252040 100%)', text: '#C4BDE8' },
  { bg: 'linear-gradient(180deg, #5C4033 0%, #3A2820 100%)', text: '#E0CDB8' },
  { bg: 'linear-gradient(180deg, #1B4D3E 0%, #0F3028 100%)', text: '#A8D8C4' },
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
  const colorIdx = h % SPINE_COLORS.length
  const scheme = SPINE_COLORS[colorIdx]
  // 书脊宽度根据内容长度变化
  const contentLen = book.content?.length || 100
  const width = Math.max(36, Math.min(70, 36 + Math.floor(contentLen / 200) * 4))
  // 书脊高度微变
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
}

function authorLabel(author: string) {
  if (author === 'user') return '用户'
  if (author === 'adam') return '亚当'
  if (author === 'captain') return 'Captain'
  return author
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
}
.add-btn:hover { background: rgba(139, 111, 71, 0.12); border-color: rgba(139, 111, 71, 0.5); }

/* 添加表单 */
.add-form {
  padding: 16px 18px;
  border-bottom: 1px solid var(--border);
  background: var(--faint);
}
.search-row {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}
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
.preview-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--dark);
}
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
.form-row { margin-bottom: 12px; }
.form-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  margin-bottom: 4px;
  text-transform: uppercase;
}
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
.form-textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 5px;
  background: var(--card-bg);
  color: var(--dark);
  font-size: 13px;
  outline: none;
  resize: vertical;
  font-family: inherit;
  line-height: 1.6;
  box-sizing: border-box;
}
.form-textarea:focus { border-color: #8B6F47; }
.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
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

.shelf {
  position: relative;
  margin-bottom: 8px;
}

.shelf-books {
  display: flex;
  align-items: flex-end;
  gap: 3px;
  padding: 0 24px;
  min-height: 170px;
}

/* 书脊 */
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
  left: 0;
  top: 0;
  bottom: 0;
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

/* 木板 */
.shelf-board {
  height: 12px;
  background: linear-gradient(180deg, #C4A882 0%, #A8896A 40%, #96775A 100%);
  border-radius: 0 0 2px 2px;
  box-shadow:
    0 2px 4px rgba(0,0,0,0.15),
    inset 0 1px 0 rgba(255,255,255,0.2);
  position: relative;
}
.shelf-board::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    rgba(139,111,71,0.2) 0%,
    rgba(139,111,71,0.05) 20%,
    rgba(139,111,71,0.1) 50%,
    rgba(139,111,71,0.05) 80%,
    rgba(139,111,71,0.2) 100%
  );
}
.shelf-shadow {
  height: 6px;
  background: linear-gradient(180deg, rgba(0,0,0,0.08) 0%, transparent 100%);
  margin: 0 4px;
}

/* ===== 打开的书 Modal ===== */
.book-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
}
.book-open {
  display: flex;
  max-width: 720px;
  width: 100%;
  max-height: 80vh;
  border-radius: 4px 8px 8px 4px;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
}

.book-open-cover {
  width: 220px;
  flex-shrink: 0;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  position: relative;
  color: rgba(255,255,255,0.9);
}
.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 28px;
  height: 28px;
  border: none;
  background: rgba(0,0,0,0.2);
  color: rgba(255,255,255,0.8);
  border-radius: 50%;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
}
.close-btn:hover { background: rgba(0,0,0,0.4); }

.cover-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
}
.cover-icon { font-size: 28px; }
.cover-title {
  font-size: 18px;
  font-weight: 700;
  line-height: 1.4;
  margin: 0;
}
.cover-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  opacity: 0.7;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.cover-tags { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; }
.cover-tag {
  font-size: 9px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(255,255,255,0.15);
  color: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.1);
}

.book-open-pages {
  flex: 1;
  background: #FDF8F0;
  padding: 28px 24px;
  overflow-y: auto;
  position: relative;
  /* 纸张纹理 */
  background-image:
    repeating-linear-gradient(
      transparent 0px,
      transparent 27px,
      rgba(139,111,71,0.06) 27px,
      rgba(139,111,71,0.06) 28px
    );
}
.book-open-pages::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: linear-gradient(180deg, rgba(0,0,0,0.06), rgba(0,0,0,0.02));
}
.pages-content {
  font-size: 13px;
  line-height: 28px;
  color: #3a3024;
  white-space: pre-wrap;
  font-family: 'Georgia', 'Noto Serif SC', serif;
}

/* Modal 动画 */
.book-modal-enter-active { transition: all 0.3s ease; }
.book-modal-leave-active { transition: all 0.2s ease; }
.book-modal-enter-from { opacity: 0; }
.book-modal-enter-from .book-open { transform: scale(0.9) translateY(20px); opacity: 0; }
.book-modal-leave-to { opacity: 0; }
.book-modal-leave-to .book-open { transform: scale(0.95); opacity: 0; }

/* 移动端适配 */
@media (max-width: 640px) {
  .shelf-books { padding: 0 12px; gap: 2px; }
  .book-spine { padding: 8px 3px; }
  .spine-title { font-size: 9px; }
  .book-open { flex-direction: column; max-height: 85vh; }
  .book-open-cover { width: 100%; padding: 20px; min-height: 140px; }
  .cover-title { font-size: 16px; }
  .book-open-pages { padding: 20px 16px; }
}
</style>
