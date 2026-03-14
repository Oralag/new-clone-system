<template>
  <div class="level-page">
    <div class="list-layout">

      <!-- 左侧：等级列表 -->
      <div class="level-panel">
        <div class="panel-header">
          <span class="panel-title">客户等级</span>
          <el-button :icon="Plus" size="small" circle @click="openLevelForm()" />
        </div>
        <div class="level-list">
          <div
            v-for="lv in levels"
            :key="lv.id"
            class="level-item"
            :class="{ active: selectedLevel?.id === lv.id }"
            @click="selectLevel(lv)"
          >
            <span class="level-name">{{ lv.name }}</span>
            <span class="level-actions">
              <el-icon class="act-icon" @click.stop="openLevelForm(lv)"><Edit /></el-icon>
              <el-icon class="act-icon danger" @click.stop="handleDeleteLevel(lv.id)"><Delete /></el-icon>
            </span>
          </div>
          <div v-if="levels.length === 0" class="panel-empty">暂无等级，点击右上角新增</div>
        </div>
      </div>

      <!-- 右侧：该等级的商品价格 -->
      <div class="price-panel">
        <template v-if="selectedLevel">
          <div class="price-header">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="panel-title">「{{ selectedLevel.name }}」等级价格</span>
              <span class="price-hint">为该等级下各商品设置专属价格，出报价单/合同时自动套用</span>
            </div>
            <el-button type="primary" :icon="Plus" size="small" @click="openPriceForm()">添加商品价格</el-button>
          </div>

          <!-- 搜索 -->
          <div class="price-search">
            <el-input v-model="priceKeyword" placeholder="搜索商品名称/编码" clearable style="width:240px" :prefix-icon="Search" />
          </div>

          <el-table :data="filteredPriceRows" border style="width:100%" empty-text="暂无价格设置，点击上方添加">
            <el-table-column type="index" label="序号" width="55" align="center" />
            <el-table-column prop="goods_sn" label="商品编码" width="130" />
            <el-table-column prop="goods_name" label="商品名称" min-width="160" />
            <el-table-column prop="unit_name" label="单位" width="80" align="center" />
            <el-table-column label="系统销售价" width="110" align="right">
              <template #default="{ row }">
                <span style="color:rgba(29,29,31,0.35)">¥{{ Number(row.sell_price || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="折扣" width="200" align="center">
              <template #default="{ row }">
                <div style="display:flex;align-items:center;gap:4px">
                  <el-input-number
                    v-model="row._discount_val"
                    :min="0.01" :max="row._discount_mode === 'pct' ? 100 : 10"
                    :precision="row._discount_mode === 'pct' ? 0 : 1"
                    :step="row._discount_mode === 'pct' ? 1 : 0.1"
                    :controls="false"
                    size="small"
                    style="width:64px"
                    @change="applyDiscount(row)"
                  />
                  <el-select v-model="row._discount_mode" size="small" style="width:72px" @change="applyDiscount(row)">
                    <el-option label="百分比" value="pct" />
                    <el-option label="折扣" value="fold" />
                  </el-select>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="等级专属价" width="140" align="right">
              <template #default="{ row }">
                <el-input-number
                  v-model="row.level_price"
                  :min="0" :precision="2"
                  size="small"
                  controls-position="right"
                  style="width:120px"
                  @change="savePriceRow(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="70" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="danger" link size="small" @click="handleDeletePrice(row.goods_id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </template>
        <div v-else class="no-selection">
          <el-empty description="请从左侧选择一个等级，设置对应的商品价格" />
        </div>
      </div>
    </div>

    <!-- 等级新增/编辑弹框 -->
    <el-dialog v-model="levelFormVisible" :title="levelFormTitle" width="360px" append-to-body>
      <el-form label-width="90px">
        <el-form-item label="等级名称">
          <el-input v-model="levelFormName" placeholder="请输入等级名称，如：批发商" @keyup.enter="handleSaveLevel" />
        </el-form-item>
        <el-form-item label="折扣百分比">
          <el-input-number
            v-model="levelFormDiscount"
            :min="1" :max="100" :precision="0"
            style="width:100%"
            placeholder="如：90 表示九折"
          />
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-top:4px">1~100，100 = 不打折，90 = 9折（出单时自动计算）</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelFormVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveLevel">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加商品价格弹框（选商品） -->
    <el-dialog v-model="priceFormVisible" title="选择商品并设置等级价" width="720px" append-to-body>
      <div style="display:flex;gap:8px;margin-bottom:10px">
        <el-input v-model="pickerKeyword" placeholder="搜索商品名称/编码" clearable style="width:240px"
          :prefix-icon="Search" @input="onPickerSearch" />
        <el-select v-model="pickerCate" placeholder="商品分类" clearable style="width:150px" @change="loadPickerGoods">
          <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>
      <el-table ref="pickerTableRef" :data="pickerGoods" v-loading="pickerLoading"
        border height="340" @selection-change="onPickerSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="goods_sn" label="商品编码" width="120" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="cate_name" label="分类" width="90" />
        <el-table-column prop="unit_name" label="单位" width="65" align="center" />
        <el-table-column prop="sell_price" label="销售价" width="90" align="right" />
      </el-table>
      <div style="margin-top:14px;display:flex;align-items:center;gap:12px">
        <span style="font-size:13px;color:rgba(29,29,31,0.5)">已选 {{ pickerSelected.length }} 件，确认后在价格表里设置具体价格。</span>
      </div>
      <template #footer>
        <el-button @click="priceFormVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!pickerSelected.length" @click="confirmAddPrices">确认添加</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getGoodsList, getGoodsCateList } from '@/api/goods'
import {
  loadLevels, saveLevels, loadLevelPrices, saveLevelPrices,
  type LevelItem
} from '@/utils/customerLevel'

// ── 等级列表 ──────────────────────────────────────────────────────────────────
const levels = ref<LevelItem[]>(loadLevels())
const selectedLevel = ref<LevelItem | null>(null)

function selectLevel(lv: LevelItem) {
  selectedLevel.value = lv
  buildPriceRows()
}

// 等级新增/编辑
const levelFormVisible = ref(false)
const levelFormTitle = ref('新增等级')
const levelFormName = ref('')
const levelFormDiscount = ref<number>(100)
let editingLevelId: number | null = null

function openLevelForm(lv?: LevelItem) {
  editingLevelId = lv ? lv.id : null
  levelFormName.value = lv ? lv.name : ''
  levelFormDiscount.value = lv?.discount ?? 100
  levelFormTitle.value = lv ? '编辑等级' : '新增等级'
  levelFormVisible.value = true
}

function handleSaveLevel() {
  const name = levelFormName.value.trim()
  if (!name) { ElMessage.warning('请输入等级名称'); return }
  const list = [...levels.value]
  if (editingLevelId !== null) {
    const idx = list.findIndex(l => l.id === editingLevelId)
    if (idx !== -1) list[idx] = { id: editingLevelId, name, discount: levelFormDiscount.value }
  } else {
    list.push({ id: Date.now(), name, discount: levelFormDiscount.value })
  }
  levels.value = list
  saveLevels(list)
  levelFormVisible.value = false
  ElMessage.success('操作成功')
}

function handleDeleteLevel(id: number) {
  ElMessageBox.confirm('确定删除该等级？该等级下的所有商品价格设置也会一并删除。', '提示', { type: 'warning' }).then(() => {
    levels.value = levels.value.filter(l => l.id !== id)
    saveLevels(levels.value)
    // 删除该等级所有价格记录
    const prices = loadLevelPrices()
    for (const key of Object.keys(prices)) {
      if (key.startsWith(`${id}_`)) delete prices[key]
    }
    saveLevelPrices(prices)
    if (selectedLevel.value?.id === id) {
      selectedLevel.value = null
      priceRows.value = []
    }
    ElMessage.success('删除成功')
  })
}

// ── 价格行（当前选中等级的所有商品价格） ──────────────────────────────────────
interface PriceRow {
  goods_id: number
  goods_name: string
  goods_sn: string
  unit_name: string
  sell_price: number
  level_price: number
  _discount_val: number     // displayed discount value
  _discount_mode: 'pct' | 'fold'  // 'pct'=百分比(0-100), 'fold'=折扣(0-10)
}

const priceRows = ref<PriceRow[]>([])
const priceKeyword = ref('')

const filteredPriceRows = computed(() => {
  if (!priceKeyword.value) return priceRows.value
  const kw = priceKeyword.value.toLowerCase()
  return priceRows.value.filter(r =>
    r.goods_name?.toLowerCase().includes(kw) || r.goods_sn?.toLowerCase().includes(kw)
  )
})

function buildPriceRows() {
  if (!selectedLevel.value) { priceRows.value = []; return }
  const prices = loadLevelPrices()
  const lvId = selectedLevel.value.id
  const prefix = `${lvId}_`
  const rows: PriceRow[] = []
  for (const key of Object.keys(prices)) {
    if (!key.startsWith(prefix)) continue
    const goodsId = Number(key.slice(prefix.length))
    const cached = goodsInfoCache.value[goodsId]
    const sellPrice = cached?.sell_price ?? 0
    const levelPrice = prices[key]
    // Compute initial discount display value (百分比 mode by default)
    const pct = sellPrice > 0 ? Math.round((levelPrice / sellPrice) * 100) : 100
    rows.push({
      goods_id: goodsId,
      goods_name: cached?.goods_name ?? `商品${goodsId}`,
      goods_sn: cached?.goods_sn ?? '',
      unit_name: cached?.unit_name ?? '',
      sell_price: sellPrice,
      level_price: levelPrice,
      _discount_val: pct,
      _discount_mode: 'pct',
    })
  }
  priceRows.value = rows
}

// Apply discount to compute level_price, then save
function applyDiscount(row: PriceRow) {
  if (!row.sell_price) return
  if (row._discount_mode === 'pct') {
    // 百分比: 90 → level_price = sell_price * 0.90
    row.level_price = parseFloat((row.sell_price * (row._discount_val / 100)).toFixed(2))
  } else {
    // 折扣: 9 → level_price = sell_price * 0.9  (9折)
    row.level_price = parseFloat((row.sell_price * (row._discount_val / 10)).toFixed(2))
  }
  savePriceRow(row)
}

function savePriceRow(row: PriceRow) {
  if (!selectedLevel.value) return
  const prices = loadLevelPrices()
  prices[`${selectedLevel.value.id}_${row.goods_id}`] = row.level_price
  saveLevelPrices(prices)
}

function handleDeletePrice(goodsId: number) {
  if (!selectedLevel.value) return
  ElMessageBox.confirm('确定删除该商品的等级价格？', '提示', { type: 'warning' }).then(() => {
    const prices = loadLevelPrices()
    delete prices[`${selectedLevel.value!.id}_${goodsId}`]
    saveLevelPrices(prices)
    priceRows.value = priceRows.value.filter(r => r.goods_id !== goodsId)
    ElMessage.success('已删除')
  })
}

// 商品信息缓存（用于显示名称/编码/单位）
const goodsInfoCache = ref<Record<number, any>>({})

// ── 商品选择器（添加价格时用） ────────────────────────────────────────────────
const priceFormVisible = ref(false)
const pickerGoods = ref<any[]>([])
const pickerLoading = ref(false)
const pickerKeyword = ref('')
const pickerCate = ref<any>('')
const pickerSelected = ref<any[]>([])
const pickerInitPrice = ref(0)
const pickerTableRef = ref()
const cateOptions = ref<any[]>([])
let pickerTimer: any

async function loadPickerGoods() {
  pickerLoading.value = true
  try {
    const res = await getGoodsList({
      keyword: pickerKeyword.value || undefined,
      cate_id: pickerCate.value || undefined,
      list_rows: 50,
    })
    pickerGoods.value = res.data?.rows ?? []
  } finally {
    pickerLoading.value = false
  }
}

function onPickerSearch() {
  clearTimeout(pickerTimer)
  pickerTimer = setTimeout(loadPickerGoods, 300)
}

function onPickerSelectionChange(rows: any[]) {
  pickerSelected.value = rows
}

function openPriceForm() {
  pickerKeyword.value = ''
  pickerCate.value = ''
  pickerSelected.value = []
  pickerInitPrice.value = 0
  priceFormVisible.value = true
  loadPickerGoods()
}

function confirmAddPrices() {
  if (!selectedLevel.value) return
  const prices = loadLevelPrices()
  const lvId = selectedLevel.value.id
  for (const g of pickerSelected.value) {
    const key = `${lvId}_${g.id}`
    if (prices[key] === undefined) {
      prices[key] = Number(g.sell_price) || 0
    }
    goodsInfoCache.value[g.id] = g
  }
  saveLevelPrices(prices)
  priceFormVisible.value = false
  buildPriceRows()
  ElMessage.success(`已添加 ${pickerSelected.value.length} 件商品，请在价格表中设置折扣或专属价格`)
}

onMounted(async () => {
  const res = await getGoodsCateList({ list_rows: 200 })
  const rc = res.data?.rows ?? []; cateOptions.value = rc.filter((c: any, i: number) => rc.findIndex((x: any) => x.name === c.name) === i)
  // 预加载商品信息到缓存，用于显示已有价格行的名称
  try {
    const res2 = await getGoodsList({ list_rows: 500 })
    const rows: any[] = res2.data?.rows ?? []
    for (const g of rows) goodsInfoCache.value[g.id] = g
  } catch {}
  // 默认选第一个等级
  if (levels.value.length) selectLevel(levels.value[0])
})
</script>

<style scoped>
.level-page {
  height: 100%;
}

.list-layout {
  display: flex;
  height: calc(100vh - 110px);
  min-height: 500px;
  gap: 12px;
}

/* 左侧等级面板 */
.level-panel {
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.panel-title { font-size: 13px; font-weight: 600; color: #1d1d1f; }

.level-list { flex: 1; overflow-y: auto; }

.level-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  cursor: pointer;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  transition: background 0.12s;
}
.level-item:hover { background: #f5f7ff; }
.level-item:hover .level-actions { opacity: 1; }
.level-item.active { background: rgba(0,113,227,0.08); color: #0071e3; font-weight: 500; }

.level-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: flex; align-items: center; gap: 4px; }
.level-discount { font-size: 11px; color: #ea580c; background: #fff7e6; border-radius: 3px; padding: 0 4px; flex-shrink: 0; }
.level-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.12s; flex-shrink: 0; }
.act-icon { font-size: 13px; color: rgba(29,29,31,0.35); cursor: pointer; padding: 2px; }
.act-icon:hover { color: #0071e3; }
.act-icon.danger:hover { color: #dc2626; }
.panel-empty { text-align: center; color: rgba(29,29,31,0.35); font-size: 12px; padding: 24px 8px; }

/* 右侧价格面板 */
.price-panel {
  flex: 1;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 16px;
}

.price-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.price-hint {
  font-size: 12px;
  color: rgba(29,29,31,0.35);
}

.price-search {
  margin-bottom: 12px;
  flex-shrink: 0;
}

.no-selection {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
