<template>
  <!-- ── 桌面端：el-dialog ── -->
  <el-dialog v-if="!isMobile" v-model="visible" :title="t('goodsSelect.title')" width="1100px" destroy-on-close>
    <div class="gs-body">
      <!-- 左侧分类树 -->
      <div class="gs-cate">
        <div class="gs-cate-item" :class="{ active: selectedCateId === null }" @click="selectCate(null)">{{ t('common.all') }}</div>
        <el-tree
          v-if="cateTree.length"
          :data="cateTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          @node-click="(n: any) => selectCate(n.id)"
        >
          <template #default="{ node, data }">
            <span class="gs-tree-node" :class="{ active: selectedCateId === data.id }">{{ node.label }}</span>
          </template>
        </el-tree>
      </div>

      <!-- 右侧内容 -->
      <div class="gs-main">
        <div class="gs-search">
          <el-input v-model="keyword" :placeholder="t('goodsSelect.searchPlaceholder')" clearable style="width: 220px" @keyup.enter="search" />
          <el-button type="primary" @click="search">{{ t('common.search') }}</el-button>
          <template v-if="props.filterGoodsIds?.length">
            <el-tag v-if="!showAllGoods" type="success" style="cursor:pointer" @click="showAllGoods = true; page = 1; loadData()">
              {{ t('goodsSelect.historyOnlyTip', { count: props.filterGoodsIds.length }) }}
            </el-tag>
            <el-tag v-else type="info" style="cursor:pointer" @click="showAllGoods = false; page = 1; loadData()">
              {{ t('goodsSelect.showAllTip') }}
            </el-tag>
          </template>
        </div>

        <el-table
          v-loading="loading"
          :data="list"
          border
          stripe
          height="420"
          @selection-change="handleSelect"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column type="index" :label="t('scTable.index')" width="55" align="center" />
          <el-table-column prop="goods_sn" :label="t('scTable.goodsCode')" width="120" />
          <el-table-column prop="goods_name" :label="t('scTable.goodsName')" min-width="150" />
          <el-table-column prop="cate_name" :label="t('goodsSelect.category')" width="110" />
          <el-table-column prop="unit_name" :label="t('scTable.unit')" width="70" align="center" />
          <el-table-column prop="stock_num" :label="t('goodsSelect.stockQty')" width="90" align="right" />
          <el-table-column prop="cost_price" :label="t('goodsSelect.costPrice')" width="90" align="right" />
          <el-table-column prop="sell_price" :label="t('goodsSelect.sellPrice')" width="90" align="right" />
        </el-table>

        <div class="gs-footer">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="loadData"
            @size-change="() => { page = 1; loadData() }"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <el-button @click="visible = false">{{ t('common.cancel') }}</el-button>
      <el-button type="primary" @click="confirm">{{ t('common.confirm') }} ({{ selected.length }})</el-button>
    </template>
  </el-dialog>

  <!-- ── 手机端：底部抽屉 ── -->
  <Teleport v-else to="body">
    <div v-if="visible" class="mgs-overlay" @click.self="visible = false">
      <div class="mgs-drawer">
        <div class="mgs-head">
          <span>{{ t('goodsSelect.title') }}</span>
          <span class="mgs-close" @click="visible = false">✕</span>
        </div>
        <div class="mgs-search-bar">
          <input v-model="keyword" class="mgs-search-input" :placeholder="t('goodsSelect.mobileSearchPlaceholder')" @input="search" />
        </div>
        <div class="mgs-list">
          <div v-if="loading" class="mgs-empty">{{ t('common.loading') }}</div>
          <div v-else-if="list.length === 0" class="mgs-empty">{{ t('goodsSelect.noResults') }}</div>
          <div
            v-for="g in list"
            :key="g.id"
            :class="['mgs-row', isSelected(g) ? 'mgs-row--on' : '']"
            @click="toggleMobile(g)"
          >
            <div class="mgs-check">
              <svg v-if="isSelected(g)" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563EB" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              <div v-else class="mgs-uncheck"></div>
            </div>
            <div class="mgs-info">
              <div class="mgs-name">{{ g.goods_name }}</div>
              <div class="mgs-meta">{{ g.goods_sn }}{{ g.unit_name ? ' · ' + g.unit_name : '' }} · {{ t('goodsSelect.stockShort', { count: g.stock_num ?? 0 }) }}</div>
            </div>
            <div class="mgs-price-col">
              <template v-if="getEffectivePrice(g) !== null && getEffectivePrice(g) !== Number(g.sell_price || 0)">
                <span class="mgs-level-price">¥{{ fmtPrice(getEffectivePrice(g)) }}</span>
                <span class="mgs-sell-price-origin">¥{{ fmtPrice(g.sell_price) }}</span>
              </template>
              <span v-else class="mgs-price">¥{{ fmtPrice(g.sell_price) }}</span>
            </div>
          </div>
        </div>
        <div class="mgs-foot">
          <button class="mgs-btn-cancel" @click="visible = false">{{ t('common.cancel') }}</button>
          <button class="mgs-btn-confirm" @click="confirm">{{ t('common.confirm') }} ({{ selected.length }})</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'
import { getGoodsCateList } from '@/api/goods'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'
import { getPriceByCustomer } from '@/utils/customerLevel'

const { t } = useI18n()

const props = defineProps<{ customerId?: number | null; filterGoodsIds?: number[] | null }>()

const emit = defineEmits<{
  (e: 'confirm', val: any[]): void
}>()

// ── 响应式检测 ──
const isMobile = ref(window.innerWidth <= 768)
function onResize() { isMobile.value = window.innerWidth <= 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const visible = ref(false)
const loading = ref(false)
const keyword = ref('')
const selectedCateId = ref<any>(null)
const cateOptions = ref<any[]>([])
const list = ref<any[]>([])
const selected = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const stockQtyMap = ref<Record<number, number>>({})
// 手机端用 Set 跟踪选中（桌面端用 el-table selection-change）
const mobileSelectedIds = ref<Set<number>>(new Set())
const searchListRows = 2000

interface CateNode { id: number; name: string; parent_id: any; children: CateNode[] }
function sortCateList(list: CateNode[]): CateNode[] {
  return list.slice().sort((a, b) => {
    const aFinished = a.name === '成品' ? 0 : 1
    const bFinished = b.name === '成品' ? 0 : 1
    return aFinished - bFinished
  })
}
function buildCateTree(source: any[]): CateNode[] {
  const all: CateNode[] = source.map(c => ({ ...c, children: [] }))
  const map: Record<number, CateNode> = {}
  all.forEach(c => { map[c.id] = c })
  const roots: CateNode[] = []
  all.forEach(c => {
    const pid = Number(c.parent_id ?? 0)
    if (pid && map[pid]) map[pid].children.push(c)
    else roots.push(c)
  })
  function sortTree(nodes: CateNode[]): CateNode[] {
    return sortCateList(nodes).map(n => ({ ...n, children: sortTree(n.children) }))
  }
  return sortTree(roots)
}
const cateTree = computed(() => buildCateTree(cateOptions.value))

async function loadCates() {
  try {
    const res: any = await getGoodsCateList({ list_rows: 200 })
    const rows = res?.data?.rows || res?.data?.list || res?.data?.data || []
    cateOptions.value = rows.sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
  } catch {}
}

function collectIds(id: number): number[] {
  const result = [id]
  const children = cateOptions.value.filter(c => Number(c.parent_id) === id)
  children.forEach(c => result.push(...collectIds(c.id)))
  return result
}

// 全量商品缓存（手机端 & 历史过滤模式用于本地过滤）
let allGoodsCache: any[] = []
const showAllGoods = ref(false)

function getGoodsTypeMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem('erp_goods_type_map') || '{}') } catch { return {} }
}

function enrichGoods(rows: any[]): any[] {
  const typeMap = getGoodsTypeMap()
  return rows.map((g: any) => ({
    ...g,
    goods_type: g.goods_type ?? typeMap[Number(g.id)] ?? 2,
    stock_num: stockQtyMap.value[Number(g.id)] ?? 0,
  }))
}

async function loadData() {
  loading.value = true
  try {
    const activeFilter = !showAllGoods.value && props.filterGoodsIds?.length
      ? new Set(props.filterGoodsIds) : null

    if (isMobile.value || activeFilter) {
      // 全量本地模式：手机端 或 客户历史过滤
      if (!allGoodsCache.length) {
        const res: any = await http.get('/goods/ShopGoods/index', { params: { list_rows: 500 } })
        allGoodsCache = enrichGoods(res?.data?.rows || res?.data?.list || [])
      }
      let rows = allGoodsCache
      if (activeFilter) rows = rows.filter((g: any) => activeFilter.has(Number(g.id)))
      if (selectedCateId.value) {
        const ids = collectIds(selectedCateId.value)
        rows = rows.filter((g: any) => ids.includes(Number(g.cate_id)))
      }
      rows = fuzzyFilterGoods(rows, keyword.value)
      total.value = rows.length
      const start = (page.value - 1) * pageSize.value
      list.value = rows.slice(start, start + pageSize.value)
    } else {
      const kw = keyword.value.trim()
      const params: any = kw
        ? { page: 1, list_rows: searchListRows, keyword: kw }
        : { page: page.value, list_rows: pageSize.value, keyword: keyword.value }
      if (selectedCateId.value) params.cate_id = selectedCateId.value
      const res: any = await http.get('/goods/ShopGoods/index', { params })
      const data = res?.data || {}
      let rows = data.rows || data.list || []
      if (selectedCateId.value) {
        const ids = collectIds(selectedCateId.value)
        rows = rows.filter((g: any) => ids.includes(Number(g.cate_id)))
      }
      rows = enrichGoods(rows)
      if (kw) {
        rows = fuzzyFilterGoods(rows, kw)
        total.value = rows.length
        const start = (page.value - 1) * pageSize.value
        list.value = rows.slice(start, start + pageSize.value)
      } else {
        list.value = rows
        total.value = data.total || 0
      }
    }
  } finally {
    loading.value = false
  }
}

function selectCate(id: number | null) {
  selectedCateId.value = id
  page.value = 1
  loadData()
}

function search() {
  page.value = 1
  loadData()
}

// 桌面端 table selection
function handleSelect(val: any[]) {
  selected.value = val
}

// 手机端 toggle
function isSelected(g: any) { return mobileSelectedIds.value.has(Number(g.id)) }
function toggleMobile(g: any) {
  const id = Number(g.id)
  if (mobileSelectedIds.value.has(id)) {
    mobileSelectedIds.value.delete(id)
    selected.value = selected.value.filter(x => Number(x.id) !== id)
  } else {
    mobileSelectedIds.value.add(id)
    selected.value = [...selected.value, g]
  }
}

function confirm() {
  emit('confirm', selected.value)
  visible.value = false
}

function fmtPrice(v: any) {
  return Number(v || 0).toFixed(2)
}

// 返回该商品对当前客户的有效价格（等级价 > 零售价）
function getEffectivePrice(g: any): number | null {
  if (props.customerId) {
    const lp = getPriceByCustomer(Number(props.customerId), Number(g.id))
    if (lp !== null) return lp
  }
  return null
}

async function open() {
  visible.value = true
  keyword.value = ''
  selectedCateId.value = null
  page.value = 1
  selected.value = []
  mobileSelectedIds.value = new Set()
  allGoodsCache = []
  showAllGoods.value = false
  if (!isMobile.value) loadCates()
  loading.value = true
  try {
    const res = await http.get('/stock/StockAll/index', { params: { list_rows: 500 } })
    const rows: any[] = res.data?.rows ?? []
    const map: Record<number, number> = {}
    for (const r of rows) {
      const gid = Number(r.goods_id)
      if (gid) map[gid] = (map[gid] || 0) + Number(r.qty || 0)
    }
    stockQtyMap.value = map
  } catch {
    stockQtyMap.value = {}
  }
  loadData()
}

defineExpose({ open })
</script>

<style scoped>
/* ── 桌面端样式（不变） ── */
.gs-body {
  display: flex;
  gap: 0;
  height: 540px;
}
.gs-cate {
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  padding: 4px 0;
}
.gs-cate-item {
  padding: 8px 14px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  line-height: 1.4;
}
.gs-cate-item:hover, .gs-cate-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
.gs-tree-node { font-size: 13px; color: #333; line-height: 1.4; }
.gs-tree-node.active { color: #409eff; font-weight: 500; }
:deep(.el-tree-node__content) { height: 32px; }
:deep(.el-tree-node__content:hover) { background: #ecf5ff; }
:deep(.el-tree-node.is-current > .el-tree-node__content) { background: #ecf5ff; color: #409eff; }
.gs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding-left: 12px;
}
.gs-search { display: flex; gap: 8px; margin-bottom: 10px; flex-shrink: 0; }
.gs-footer { display: flex; justify-content: flex-end; margin-top: 10px; flex-shrink: 0; }

/* ── 手机端抽屉样式 ── */
.mgs-overlay {
  position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.5);
  display: flex; align-items: flex-end;
}
.mgs-drawer {
  width: 100%; max-height: 82vh; background: #fff;
  border-radius: 16px 16px 0 0;
  display: flex; flex-direction: column;
  overflow: hidden;
}
.mgs-head {
  display: flex; justify-content: space-between; align-items: center;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f0f0f0;
  font-size: 16px; font-weight: 600; color: #1a1a1a;
  flex-shrink: 0;
}
.mgs-close { font-size: 20px; color: #999; cursor: pointer; line-height: 1; }
.mgs-search-bar { padding: 10px 14px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0; }
.mgs-search-input {
  width: 100%; box-sizing: border-box;
  padding: 9px 12px;
  border: 1.5px solid #e5e7eb; border-radius: 8px;
  font-size: 15px; outline: none; background: #f9fafb;
}
.mgs-search-input:focus { border-color: #2563EB; background: #fff; }
.mgs-list { flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch; }
.mgs-empty { text-align: center; padding: 32px; color: #bbb; font-size: 14px; }
.mgs-row {
  display: flex; align-items: center; gap: 10px;
  padding: 12px 14px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.1s;
}
.mgs-row:active { background: #f0f6ff; }
.mgs-row--on { background: #eff6ff; }
.mgs-check { width: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.mgs-uncheck { width: 16px; height: 16px; border: 2px solid #d1d5db; border-radius: 4px; }
.mgs-info { flex: 1; min-width: 0; }
.mgs-name { font-size: 14px; font-weight: 500; color: #1d2129; }
.mgs-meta { font-size: 12px; color: #9ca3af; margin-top: 2px; }
.mgs-price-col { display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0; gap: 2px; }
.mgs-price { font-size: 13px; color: #d97706; font-weight: 500; }
.mgs-level-price { font-size: 13px; color: #2563EB; font-weight: 600; }
.mgs-sell-price-origin { font-size: 11px; color: #9ca3af; text-decoration: line-through; }
.mgs-foot {
  display: flex; gap: 10px;
  padding: 12px 14px;
  padding-bottom: max(12px, env(safe-area-inset-bottom));
  border-top: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.mgs-btn-cancel {
  flex: 1; padding: 13px 0; border-radius: 10px; border: none;
  background: #f3f4f6; color: #374151; font-size: 15px; font-weight: 600; cursor: pointer;
}
.mgs-btn-confirm {
  flex: 2; padding: 13px 0; border-radius: 10px; border: none;
  background: #2563EB; color: #fff; font-size: 15px; font-weight: 600; cursor: pointer;
}
</style>
