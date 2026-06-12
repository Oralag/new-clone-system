<template>
  <div class="level-page">
    <div class="list-layout">

      <!-- 左侧：等级列表 -->
      <div class="level-panel">
        <div class="panel-header">
          <span class="panel-title">客户等级</span>
          <el-button :icon="Plus" size="small" circle @click="openLevelForm()" />
        </div>
        <div class="level-list" v-loading="levelsLoading">
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
          <div v-if="!levelsLoading && levels.length === 0" class="panel-empty">暂无等级，点击右上角新增</div>
        </div>
      </div>

      <!-- 右侧：该等级的商品价格 -->
      <div class="price-panel">
        <template v-if="selectedLevel">
          <div class="price-header">
            <div style="display:flex;align-items:center;gap:10px">
              <span class="panel-title">「{{ selectedLevel.name }}」等级价格</span>
              <span class="price-hint">为该等级下各商品设置专属价格，小程序分销商下单时自动套用</span>
            </div>
            <el-button type="primary" :icon="Plus" size="small" @click="openPriceForm()">添加商品价格</el-button>
          </div>

          <div class="price-search">
            <el-input v-model="priceKeyword" placeholder="搜索商品名称/编码" clearable style="width:240px" :prefix-icon="Search" />
          </div>

          <el-table :data="filteredPriceRows" v-loading="pricesLoading" border style="width:100%" empty-text="暂无价格设置，点击上方添加">
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
                  @change="handleSavePriceRow(row)"
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
          <el-input v-model="levelFormName" placeholder="如：分销商、批发商" @keyup.enter="handleSaveLevel" />
        </el-form-item>
        <el-form-item label="折扣百分比">
          <el-input-number
            v-model="levelFormDiscount"
            :min="1" :max="100" :precision="0"
            style="width:100%"
            placeholder="如：90 表示九折"
          />
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-top:4px">1~100，100 = 不打折，90 = 9折</div>
        </el-form-item>
        <el-form-item label="佣金比例">
          <el-input-number
            v-model="levelFormCommission"
            :min="0" :max="50" :precision="1"
            style="width:100%"
          />
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-top:4px">分销商推广订单的佣金百分比，0 = 不参与分销</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="levelFormVisible = false">取消</el-button>
        <el-button type="primary" :loading="levelSaving" @click="handleSaveLevel">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加商品价格弹框 -->
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
      <div style="margin-top:14px">
        <span style="font-size:13px;color:rgba(29,29,31,0.5)">已选 {{ pickerSelected.length }} 件，确认后在价格表里设置具体价格。</span>
      </div>
      <template #footer>
        <el-button @click="priceFormVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!pickerSelected.length" :loading="pickerSaving" @click="confirmAddPrices">确认添加</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete, Search } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getGoodsList, getGoodsCateList } from '@/api/goods'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'
import {
  getLevels, addLevel, editLevel, delLevel,
  getLevelPrices, saveLevelPrice, delLevelPrice,
  type LevelItem,
} from '@/api/customerLevel'

// ── 等级列表 ──────────────────────────────────────────────────────────────────
const levels = ref<LevelItem[]>([])
const levelsLoading = ref(false)
const selectedLevel = ref<LevelItem | null>(null)

async function loadLevels() {
  levelsLoading.value = true
  try {
    const res = await getLevels()
    levels.value = res.data ?? []
  } finally {
    levelsLoading.value = false
  }
}

function selectLevel(lv: LevelItem) {
  selectedLevel.value = lv
  loadPriceRows()
}

// 等级新增/编辑
const levelFormVisible = ref(false)
const levelFormTitle = ref('新增等级')
const levelFormName = ref('')
const levelFormDiscount = ref<number>(100)
const levelFormCommission = ref<number>(0)
const levelSaving = ref(false)
let editingLevelId: number | null = null

function openLevelForm(lv?: LevelItem) {
  editingLevelId = lv ? lv.id : null
  levelFormName.value = lv ? lv.name : ''
  levelFormDiscount.value = lv?.discount ?? 100
  levelFormCommission.value = lv?.commission_rate ?? 0
  levelFormTitle.value = lv ? '编辑等级' : '新增等级'
  levelFormVisible.value = true
}

async function handleSaveLevel() {
  const name = levelFormName.value.trim()
  if (!name) { ElMessage.warning('请输入等级名称'); return }
  levelSaving.value = true
  try {
    if (editingLevelId !== null) {
      await editLevel({ id: editingLevelId, name, discount: levelFormDiscount.value, commission_rate: levelFormCommission.value })
    } else {
      await addLevel({ name, discount: levelFormDiscount.value, commission_rate: levelFormCommission.value, sort: levels.value.length })
    }
    await loadLevels()
    levelFormVisible.value = false
    ElMessage.success('操作成功')
  } finally {
    levelSaving.value = false
  }
}

async function handleDeleteLevel(id: number) {
  await ElMessageBox.confirm('确定删除该等级？该等级下的所有商品价格也会一并删除。', '提示', { type: 'warning' })
  await delLevel(id)
  if (selectedLevel.value?.id === id) { selectedLevel.value = null; priceRows.value = [] }
  await loadLevels()
  ElMessage.success('删除成功')
}

// ── 价格行 ────────────────────────────────────────────────────────────────────
interface PriceRow {
  goods_id: number
  goods_name: string
  goods_sn: string
  unit_name: string
  sell_price: number
  level_price: number
  _discount_val: number
  _discount_mode: 'pct' | 'fold'
}

const priceRows = ref<PriceRow[]>([])
const pricesLoading = ref(false)
const priceKeyword = ref('')

const filteredPriceRows = computed(() => {
  if (!priceKeyword.value) return priceRows.value
  const kw = priceKeyword.value.toLowerCase()
  return priceRows.value.filter(r =>
    r.goods_name?.toLowerCase().includes(kw) || r.goods_sn?.toLowerCase().includes(kw)
  )
})

async function loadPriceRows() {
  if (!selectedLevel.value) { priceRows.value = []; return }
  pricesLoading.value = true
  try {
    const res = await getLevelPrices(selectedLevel.value.id)
    priceRows.value = (res.data ?? []).map((p: any) => {
      const sellPrice = parseFloat(p.sell_price || 0)
      const levelPrice = parseFloat(p.level_price || 0)
      const pct = sellPrice > 0 ? Math.round((levelPrice / sellPrice) * 100) : 100
      return {
        goods_id: p.goods_id,
        goods_name: p.goods_name ?? `商品${p.goods_id}`,
        goods_sn: p.goods_sn ?? '',
        unit_name: p.unit_name ?? '',
        sell_price: sellPrice,
        level_price: levelPrice,
        _discount_val: pct,
        _discount_mode: 'pct' as const,
      }
    })
  } finally {
    pricesLoading.value = false
  }
}

function applyDiscount(row: PriceRow) {
  if (!row.sell_price) return
  if (row._discount_mode === 'pct') {
    row.level_price = parseFloat((row.sell_price * (row._discount_val / 100)).toFixed(2))
  } else {
    row.level_price = parseFloat((row.sell_price * (row._discount_val / 10)).toFixed(2))
  }
  handleSavePriceRow(row)
}

async function handleSavePriceRow(row: PriceRow) {
  if (!selectedLevel.value) return
  await saveLevelPrice(selectedLevel.value.id, row.goods_id, row.level_price)
}

async function handleDeletePrice(goodsId: number) {
  if (!selectedLevel.value) return
  await ElMessageBox.confirm('确定删除该商品的等级价格？', '提示', { type: 'warning' })
  await delLevelPrice(selectedLevel.value.id, goodsId)
  priceRows.value = priceRows.value.filter(r => r.goods_id !== goodsId)
  ElMessage.success('已删除')
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const priceFormVisible = ref(false)
const pickerGoods = ref<any[]>([])
const pickerLoading = ref(false)
const pickerSaving = ref(false)
const pickerKeyword = ref('')
const pickerCate = ref<any>('')
const pickerSelected = ref<any[]>([])
const pickerTableRef = ref()
const cateOptions = ref<any[]>([])
let pickerTimer: any

async function loadPickerGoods() {
  pickerLoading.value = true
  try {
    const keyword = pickerKeyword.value.trim()
    const res = await getGoodsList({ keyword: keyword || undefined, cate_id: pickerCate.value || undefined, list_rows: keyword ? 2000 : 50 })
    const rows = res.data?.rows ?? []
    pickerGoods.value = keyword ? fuzzyFilterGoods(rows, keyword) : rows
  } finally {
    pickerLoading.value = false
  }
}

function onPickerSearch() {
  clearTimeout(pickerTimer)
  pickerTimer = setTimeout(loadPickerGoods, 300)
}

function onPickerSelectionChange(rows: any[]) { pickerSelected.value = rows }

function openPriceForm() {
  pickerKeyword.value = ''
  pickerCate.value = ''
  pickerSelected.value = []
  priceFormVisible.value = true
  loadPickerGoods()
}

async function confirmAddPrices() {
  if (!selectedLevel.value) return
  pickerSaving.value = true
  try {
    const existIds = new Set(priceRows.value.map(r => r.goods_id))
    const toAdd = pickerSelected.value.filter(g => !existIds.has(g.id))
    for (const g of toAdd) {
      await saveLevelPrice(selectedLevel.value.id, g.id, parseFloat(g.sell_price) || 0)
    }
    priceFormVisible.value = false
    await loadPriceRows()
    ElMessage.success(`已添加 ${toAdd.length} 件商品，请在价格表中调整专属价格`)
  } finally {
    pickerSaving.value = false
  }
}

onMounted(async () => {
  const res = await getGoodsCateList({ list_rows: 200 })
  const rc = res.data?.rows ?? []
  cateOptions.value = rc.filter((c: any, i: number) => rc.findIndex((x: any) => x.name === c.name) === i)
  await loadLevels()
  if (levels.value.length) selectLevel(levels.value[0])
})
</script>

<style scoped>
.level-page { height: 100%; }
.list-layout { display: flex; height: calc(100vh - 110px); min-height: 500px; gap: 12px; }

.level-panel { width: 180px; flex-shrink: 0; background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; }
.panel-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 12px 8px; border-bottom: 1px solid #f5f5f7; flex-shrink: 0; }
.panel-title { font-size: 13px; font-weight: 600; color: #1d1d1f; }
.level-list { flex: 1; overflow-y: auto; }
.level-item { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; cursor: pointer; font-size: 13px; color: rgba(29,29,31,0.5); transition: background 0.12s; }
.level-item:hover { background: #f5f7ff; }
.level-item:hover .level-actions { opacity: 1; }
.level-item.active { background: rgba(0,113,227,0.08); color: #0071e3; font-weight: 500; }
.level-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.level-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.12s; flex-shrink: 0; }
.act-icon { font-size: 13px; color: rgba(29,29,31,0.35); cursor: pointer; padding: 2px; }
.act-icon:hover { color: #0071e3; }
.act-icon.danger:hover { color: #dc2626; }
.panel-empty { text-align: center; color: rgba(29,29,31,0.35); font-size: 12px; padding: 24px 8px; }

.price-panel { flex: 1; background: #fff; border: 1px solid #e4e7ed; border-radius: 12px; display: flex; flex-direction: column; overflow: hidden; padding: 16px; }
.price-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; padding-bottom: 10px; border-bottom: 1px solid #f5f5f7; flex-shrink: 0; }
.price-hint { font-size: 12px; color: rgba(29,29,31,0.35); }
.price-search { margin-bottom: 12px; flex-shrink: 0; }
.no-selection { height: 100%; display: flex; align-items: center; justify-content: center; }
</style>
