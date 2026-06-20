<template>
  <div class="bom-page">

    <!-- ── 左侧：成品列表 ── -->
    <div class="goods-panel">
      <div class="panel-header">
        <span class="panel-title">{{ $t('goods.bom.leftPanelTitle') }}</span>
        <el-button :icon="Plus" size="small" type="primary" @click="openAddGoods">{{ $t('goods.bom.btnAddFinishedGoods') }}</el-button>
      </div>
      <div class="panel-search">
        <el-input v-model="goodsKeyword" :placeholder="$t('goods.bom.searchPlaceholder')" clearable size="small" :prefix-icon="Search" />
      </div>
      <div class="goods-list" v-loading="goodsLoading">
        <div
          v-for="item in filteredGoodsList"
          :key="item.id"
          class="goods-item"
          :class="{ active: selectedBom?.id === item.id }"
          @click="selectBom(item)"
        >
          <div class="goods-item-info">
            <div class="goods-name" :class="{ 'goods-name-empty': !item.goods_name }">
              {{ item.goods_name || $t('goods.bom.goodsNameEmpty') }}
            </div>
            <div class="goods-sn" v-if="item.goods_sn">{{ item.goods_sn }}</div>
          </div>
          <el-icon class="goods-copy" @click.stop="handleCopyBom(item)"><CopyDocument /></el-icon>
          <el-icon class="goods-del" @click.stop="handleDelBom(item)"><Delete /></el-icon>
        </div>
        <div v-if="!goodsLoading && filteredGoodsList.length === 0" class="empty-tip">
          {{ $t('goods.bom.emptyTip') }}
        </div>
      </div>
    </div>

    <!-- ── 右侧：物料清单 ── -->
    <div class="bom-panel">
      <div class="panel-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="panel-title">{{ $t('goods.bom.rightPanelTitle') }}</span>
          <template v-if="selectedBom">
            <el-tag type="primary">{{ selectedBom.goods_name || $t('goods.bom.goodsNameEmpty') }}</el-tag>
            <el-tag v-if="selectedBom.spec" type="info">{{ selectedBom.spec }}</el-tag>
            <el-tag v-if="selectedBom.unit_name">{{ $t('goods.bom.unitLabel') }}{{ selectedBom.unit_name }}</el-tag>
          </template>
          <span v-else class="hint-text">{{ $t('goods.bom.hintSelectGoods') }}</span>
        </div>
        <div style="display:flex;gap:8px" v-if="selectedBom">
          <el-button size="small" @click="openEditBomInfo">{{ $t('goods.bom.btnEditGoodsInfo') }}</el-button>
          <el-button type="primary" :icon="Plus" size="small" @click="openAddMaterial">{{ $t('goods.bom.btnAddMaterial') }}</el-button>
          <el-button type="success" size="small" :disabled="currentItems.length === 0" @click="handleGotoProcure">{{ $t('goods.bom.btnGotoProcure') }}</el-button>
        </div>
      </div>

      <!-- 物料表格 -->
      <div v-if="selectedBom" class="bom-table-wrap" v-loading="itemsLoading">
        <el-table
          :data="currentItems"
          border size="small"
          style="width:100%"
          @selection-change="itemSelection = $event"
          :summary-method="getSummary"
          show-summary
        >
          <el-table-column type="selection" width="40" />
          <el-table-column :label="$t('goods.bom.colIndex')" type="index" width="50" align="center" />
          <el-table-column prop="goods_name" :label="$t('goods.bom.colMaterialName')" min-width="160" />
          <el-table-column prop="goods_sn" :label="$t('goods.bom.colMaterialCode')" width="110">
            <template #default="{ row }">{{ row.goods_sn || '—' }}</template>
          </el-table-column>
          <el-table-column prop="num" :label="$t('goods.bom.colUsage')" width="80" align="right" />
          <el-table-column prop="unit_name" :label="$t('goods.bom.colUnit')" width="65" align="center">
            <template #default="{ row }">{{ row.unit_name || '—' }}</template>
          </el-table-column>
          <el-table-column prop="price" :label="$t('goods.bom.colUnitPrice')" width="90" align="right">
            <template #default="{ row }">
              <el-input-number
                v-if="editingPriceId === row.id"
                v-model="row.price"
                :precision="2" :min="0" size="small" controls-position="right"
                style="width:80px"
                @blur="saveItemPrice(row)"
                @keyup.enter="saveItemPrice(row)"
              />
              <span v-else class="price-cell" @click="editingPriceId = row.id">
                {{ Number(row.price || 0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('goods.bom.colSubtotal')" width="90" align="right">
            <template #default="{ row }">
              <span class="subtotal">{{ (Number(row.num || 0) * Number(row.price || 0)).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('goods.bom.colActions')" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link size="small" type="danger" @click="handleDelItem(row)">{{ $t('goods.bom.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 选中操作栏 -->
        <div v-if="itemSelection.length" class="selected-bar">
          <span>{{ $t('goods.bom.selectedCount', { count: itemSelection.length }) }}</span>
          <el-button size="small" type="danger" @click="handleBatchDelItems">{{ $t('goods.bom.btnBatchDelete') }}</el-button>
        </div>

        <!-- 成本汇总 -->
        <div class="cost-summary">
          <span>{{ $t('goods.bom.costMaterialCount') }}<strong>{{ currentItems.length }}</strong>{{ $t('goods.bom.costUnit') }}</span>
          <span style="margin-left:24px">{{ $t('goods.bom.costTotalLabel') }}
            <strong class="total-price">¥ {{ totalCost }}</strong>
          </span>
        </div>
      </div>

      <div v-else class="empty-right">
        <el-icon :size="48" color="#ddd"><List /></el-icon>
        <p>{{ $t('goods.bom.emptyRight') }}</p>
      </div>
    </div>

    <!-- ── 新增/编辑 BOM 成品弹框 ── -->
    <el-dialog v-model="bomDialog.visible" :title="bomDialog.id ? $t('goods.bom.dialogEditTitle') : $t('goods.bom.dialogAddTitle')"
      width="500px" :close-on-click-modal="false" @closed="resetBomDialog">
      <el-form :model="bomDialog" label-width="80px" size="small">
        <el-form-item v-if="!bomDialog.id" :label="$t('goods.bom.fieldSelectExisting')">
          <el-select
            v-model="bomDialog.selectedGoodsId"
            filterable remote clearable
            :placeholder="$t('goods.bom.selectExistingPlaceholder')"
            :remote-method="searchBomGoods"
            :loading="bomDialog.searchLoading"
            style="width:100%"
            @change="onBomGoodsSelect"
          >
            <el-option
              v-for="g in bomDialog.searchResults"
              :key="g.id"
              :label="`${g.goods_name}${g.goods_sn ? ' (' + g.goods_sn + ')' : ''}`"
              :value="g.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('goods.bom.fieldGoodsName')" required>
          <el-input v-model="bomDialog.goods_name" :placeholder="$t('goods.bom.goodsNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.bom.fieldGoodsSn')">
          <el-input v-model="bomDialog.goods_sn" :placeholder="$t('goods.bom.goodsSnPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.bom.fieldSpec')">
          <el-input v-model="bomDialog.spec" :placeholder="$t('goods.bom.specPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('goods.bom.fieldUnit')">
          <el-input v-model="bomDialog.unit_name" :placeholder="$t('goods.bom.unitPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="bomDialog.visible = false">{{ $t('goods.bom.btnCancel') }}</el-button>
        <el-button type="primary" :loading="bomDialog.saving" @click="saveBomDialog">{{ $t('goods.bom.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- ── 添加物料弹框（两步：选物料 → 填用量） ── -->
    <el-dialog v-model="matDialog.visible" :title="$t('goods.bom.matDialogTitle')"
      width="860px" :close-on-click-modal="false" @closed="resetMatDialog">

      <!-- Step 1: 选择物料 -->
      <div v-if="matDialog.step === 1" class="pick-body">
        <div class="pick-search">
          <el-input v-model="matDialog.keyword" :placeholder="$t('goods.bom.matSearchPlaceholder')" clearable size="small"
            :prefix-icon="Search" style="width:260px" @input="filterMatGoods" />
        </div>
        <div class="pick-list" v-loading="matDialog.loading">
          <div v-for="g in matDialog.filtered" :key="g.id"
            class="pick-item" :class="{ selected: matDialog.selectedIds.has(g.id) }"
            @click="togglePickItem(g)">
            <el-checkbox :model-value="matDialog.selectedIds.has(g.id)" @change="togglePickItem(g)" />
            <div class="pick-item-info">
              <span class="pick-name">{{ g.goods_name }}</span>
              <span class="pick-sn" v-if="g.goods_sn">{{ g.goods_sn }}</span>
            </div>
            <span class="pick-spec" v-if="g.spec">{{ g.spec }}</span>
            <span class="pick-unit">{{ g.unit_name }}</span>
          </div>
          <div v-if="!matDialog.loading && matDialog.filtered.length === 0" class="empty-tip">
            {{ $t('goods.bom.noMaterial') }}
          </div>
        </div>
        <div class="pick-footer">
          {{ $t('goods.bom.selectedItems', { count: matDialog.selectedIds.size }) }}
        </div>
      </div>

      <!-- Step 2: 填写用量 -->
      <div v-if="matDialog.step === 2">
        <el-table :data="matDialog.selected" border size="small" style="width:100%">
          <el-table-column prop="goods_name" :label="$t('goods.bom.matColName')" min-width="140" />
          <el-table-column prop="goods_sn" :label="$t('goods.bom.matColCode')" width="100" />
          <el-table-column :label="$t('goods.bom.matColUsage')" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :min="0.0001" :precision="4" size="small"
                controls-position="right" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('goods.bom.matColUnit')" width="70">
            <template #default="{ row }">
              <el-input v-model="row.unit_name" size="small" :placeholder="$t('goods.bom.matColUnit')" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('goods.bom.matColUnitPrice')" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="5" size="small"
                controls-position="right" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('goods.bom.matColSubtotal')" width="80" align="right">
            <template #default="{ row }">
              {{ (Number(row.num || 0) * Number(row.price || 0)).toFixed(2) }}
            </template>
          </el-table-column>
          <el-table-column label="" width="42" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="matDialog.selected.splice($index, 1)">✕</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <template #footer>
        <template v-if="matDialog.step === 1">
          <el-button @click="matDialog.visible = false">{{ $t('goods.bom.btnCancel') }}</el-button>
          <el-button type="primary" :disabled="matDialog.selectedIds.size === 0" @click="goMatStep2">
            {{ $t('goods.bom.btnNextStep', { count: matDialog.selectedIds.size }) }}
          </el-button>
        </template>
        <template v-else>
          <el-button @click="matDialog.step = 1">{{ $t('goods.bom.btnBackReselect') }}</el-button>
          <el-button @click="matDialog.visible = false">{{ $t('goods.bom.btnCancel') }}</el-button>
          <el-button type="primary" :loading="matDialog.saving" @click="submitMatItems">{{ $t('goods.bom.btnConfirmAdd') }}</el-button>
        </template>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Delete, List, CopyDocument } from '@element-plus/icons-vue'
import http from '@/api/http'

const { t } = useI18n()

// ── 左侧成品列表 ──────────────────────────────────────────────────
const router = useRouter()
const goodsLoading = ref(false)
const goodsList = ref<any[]>([])
const goodsKeyword = ref('')
const selectedBom = ref<any>(null)

const filteredGoodsList = computed(() => {
  const kw = goodsKeyword.value.trim().toLowerCase()
  if (!kw) return goodsList.value
  return goodsList.value.filter(g =>
    g.goods_name?.toLowerCase().includes(kw) || g.goods_sn?.toLowerCase().includes(kw)
  )
})

async function loadGoodsList() {
  goodsLoading.value = true
  try {
    const res: any = await http.get('/goods/BomGoods/index', { params: { page: 1, list_rows: 200 } })
    goodsList.value = res.data?.list || []
    // If previously selected, refresh it
    if (selectedBom.value) {
      const found = goodsList.value.find(g => g.id === selectedBom.value.id)
      if (found) selectedBom.value = found
    }
  } catch (e: any) {
    ElMessage.error(e.message || t('goods.bom.msgLoadFailed'))
  } finally {
    goodsLoading.value = false
  }
}

async function selectBom(item: any) {
  selectedBom.value = item
  await loadItems(item.id)
}

// ── 右侧物料清单 ──────────────────────────────────────────────────
const itemsLoading = ref(false)
const currentItems = ref<any[]>([])
const itemSelection = ref<any[]>([])
const editingPriceId = ref<number | null>(null)

const totalCost = computed(() => {
  return currentItems.value.reduce((sum, it) => {
    return sum + Number(it.num || 0) * Number(it.price || 0)
  }, 0).toFixed(2)
})

function getSummary({ columns }: any) {
  const sums: string[] = []
  columns.forEach((_: any, index: number) => {
    if (index === 1) { sums[index] = t('goods.bom.summaryTotal'); return }
    if (index === 6) {
      const total = currentItems.value.reduce((sum, row) =>
        sum + Number(row.num || 0) * Number(row.price || 0), 0)
      sums[index] = '¥ ' + total.toFixed(2)
      return
    }
    sums[index] = ''
  })
  return sums
}

async function loadItems(bomId: number) {
  itemsLoading.value = true
  currentItems.value = []
  try {
    const res: any = await http.get('/goods/BomGoods/detail', { params: { id: bomId } })
    currentItems.value = res.data?.items || []
  } catch (e: any) {
    ElMessage.error(e.message || t('goods.bom.msgLoadMaterialFailed'))
  } finally {
    itemsLoading.value = false
  }
}

async function saveItemPrice(row: any) {
  editingPriceId.value = null
  if (!selectedBom.value) return
  // Save via edit API (full items update)
  try {
    await http.post('/goods/BomGoods/edit', {
      id: selectedBom.value.id,
      goods_name: selectedBom.value.goods_name,
      goods_sn: selectedBom.value.goods_sn,
      spec: selectedBom.value.spec,
      unit_name: selectedBom.value.unit_name,
      items: currentItems.value
    })
  } catch (e: any) {
    ElMessage.error(e.message || t('goods.bom.msgSaveFailed'))
  }
}

async function handleDelItem(row: any) {
  if (!selectedBom.value) return
  await ElMessageBox.confirm(t('goods.bom.msgConfirmDeleteMaterial', { name: row.goods_name }), t('goods.bom.msgTip'), { type: 'warning' })
  const newItems = currentItems.value.filter(it => it.id !== row.id)
  await http.post('/goods/BomGoods/edit', {
    id: selectedBom.value.id,
    goods_name: selectedBom.value.goods_name,
    goods_sn: selectedBom.value.goods_sn,
    spec: selectedBom.value.spec,
    unit_name: selectedBom.value.unit_name,
    items: newItems
  })
  ElMessage.success(t('goods.bom.msgDeleteSuccess'))
  await loadItems(selectedBom.value.id)
}

async function handleBatchDelItems() {
  if (!selectedBom.value || !itemSelection.value.length) return
  await ElMessageBox.confirm(t('goods.bom.msgConfirmBatchDelete', { count: itemSelection.value.length }), t('goods.bom.msgTip'), { type: 'warning' })
  const delIds = new Set(itemSelection.value.map((r: any) => r.id))
  const newItems = currentItems.value.filter(it => !delIds.has(it.id))
  await http.post('/goods/BomGoods/edit', {
    id: selectedBom.value.id,
    goods_name: selectedBom.value.goods_name,
    goods_sn: selectedBom.value.goods_sn,
    spec: selectedBom.value.spec,
    unit_name: selectedBom.value.unit_name,
    items: newItems
  })
  ElMessage.success(t('goods.bom.msgDeleteSuccess'))
  itemSelection.value = []
  await loadItems(selectedBom.value.id)
}

// ── BOM成品 新增/编辑弹框 ─────────────────────────────────────────
const bomDialog = ref({
  visible: false, saving: false,
  id: 0, goods_name: '', goods_sn: '', spec: '', unit_name: '',
  selectedGoodsId: null as number | null,
  searchLoading: false,
  searchResults: [] as any[]
})

async function searchBomGoods(query: string) {
  if (!query.trim()) { bomDialog.value.searchResults = []; return }
  bomDialog.value.searchLoading = true
  try {
    const res: any = await http.get('/goods/ShopGoods/index', {
      params: { page: 1, list_rows: 30, goods_name: query }
    })
    bomDialog.value.searchResults = res.data?.rows || res.data?.list || []
  } catch {
    bomDialog.value.searchResults = []
  } finally {
    bomDialog.value.searchLoading = false
  }
}

function onBomGoodsSelect(id: number | null) {
  if (!id) return
  const g = bomDialog.value.searchResults.find(x => x.id === id)
  if (!g) return
  bomDialog.value.goods_name = g.goods_name || ''
  bomDialog.value.goods_sn = g.goods_sn || ''
  bomDialog.value.spec = g.spec || ''
  bomDialog.value.unit_name = g.unit_name || ''
}

function openAddGoods() {
  resetBomDialog()
  bomDialog.value.visible = true
}

function openEditBomInfo() {
  if (!selectedBom.value) return
  Object.assign(bomDialog.value, {
    visible: true, saving: false,
    id: selectedBom.value.id,
    goods_name: selectedBom.value.goods_name,
    goods_sn: selectedBom.value.goods_sn,
    spec: selectedBom.value.spec || '',
    unit_name: selectedBom.value.unit_name || ''
  })
}

function resetBomDialog() {
  Object.assign(bomDialog.value, {
    visible: false, saving: false,
    id: 0, goods_name: '', goods_sn: '', spec: '', unit_name: '',
    selectedGoodsId: null, searchLoading: false, searchResults: []
  })
}

async function saveBomDialog() {
  if (!bomDialog.value.goods_name.trim()) return ElMessage.warning(t('goods.bom.msgGoodsNameRequired'))
  bomDialog.value.saving = true
  try {
    const url = bomDialog.value.id ? '/goods/BomGoods/edit' : '/goods/BomGoods/add'
    const payload: any = {
      goods_name: bomDialog.value.goods_name,
      goods_sn: bomDialog.value.goods_sn,
      spec: bomDialog.value.spec,
      unit_name: bomDialog.value.unit_name
    }
    if (bomDialog.value.id) payload.id = bomDialog.value.id
    await http.post(url, payload)
    ElMessage.success(bomDialog.value.id ? t('goods.bom.msgEditSuccess') : t('goods.bom.msgAddSuccess'))
    bomDialog.value.visible = false
    await loadGoodsList()
  } catch (e: any) {
    ElMessage.error(e.message || t('goods.bom.msgSaveFailed'))
  } finally {
    bomDialog.value.saving = false
  }
}

async function handleCopyBom(item: any) {
  try {
    // Load items of source BOM
    const res: any = await http.get('/goods/BomGoods/detail', { params: { id: item.id } })
    const items = (res.data?.items || []).map((it: any) => ({
      goods_name: it.goods_name, goods_sn: it.goods_sn,
      num: it.num, unit_name: it.unit_name, price: it.price
    }))
    await http.post('/goods/BomGoods/add', {
      goods_name: item.goods_name + '_复制',
      goods_sn: item.goods_sn || '',
      spec: item.spec || '',
      unit_name: item.unit_name || '',
      items
    })
    ElMessage.success(t('goods.bom.msgCopySuccess'))
    await loadGoodsList()
  } catch (e: any) {
    ElMessage.error(e.message || t('goods.bom.msgCopyFailed'))
  }
}

async function handleDelBom(item: any) {
  await ElMessageBox.confirm(t('goods.bom.msgConfirmDeleteBom', { name: item.goods_name }), t('goods.bom.msgTip'), { type: 'warning' })
  await http.post('/goods/BomGoods/del', { id: item.id })
  ElMessage.success(t('goods.bom.msgDeleteSuccess'))
  if (selectedBom.value?.id === item.id) {
    selectedBom.value = null
    currentItems.value = []
  }
  await loadGoodsList()
}

// ── 添加物料弹框 ──────────────────────────────────────────────────
const allGoods = ref<any[]>([])

const matDialog = ref({
  visible: false, loading: false, saving: false, step: 1,
  keyword: '',
  filtered: [] as any[],
  selectedIds: new Set<number>(),
  selectedMap: new Map<number, any>(),
  selected: [] as any[]
})

function openAddMaterial() {
  resetMatDialog()
  matDialog.value.visible = true
  loadAllGoods()
}

async function loadAllGoods() {
  if (allGoods.value.length) {
    filterMatGoods()
    return
  }
  matDialog.value.loading = true
  try {
    const res: any = await http.get('/goods/ShopGoods/index', { params: { page: 1, list_rows: 500 } })
    allGoods.value = (res.data?.rows || res.data?.list || [])
    filterMatGoods()
  } catch (e: any) {
    ElMessage.error(t('goods.bom.msgLoadGoodsFailed'))
  } finally {
    matDialog.value.loading = false
  }
}

function filterMatGoods() {
  const kw = matDialog.value.keyword.trim().toLowerCase()
  matDialog.value.filtered = kw
    ? allGoods.value.filter(g =>
        g.goods_name?.toLowerCase().includes(kw) || g.goods_sn?.toLowerCase().includes(kw))
    : allGoods.value
}

function togglePickItem(g: any) {
  if (matDialog.value.selectedIds.has(g.id)) {
    matDialog.value.selectedIds.delete(g.id)
    matDialog.value.selectedMap.delete(g.id)
  } else {
    matDialog.value.selectedIds.add(g.id)
    matDialog.value.selectedMap.set(g.id, g)
  }
  // trigger reactivity
  matDialog.value.selectedIds = new Set(matDialog.value.selectedIds)
}

function goMatStep2() {
  matDialog.value.selected = Array.from(matDialog.value.selectedMap.values()).map(g => ({
    goods_name: g.goods_name,
    goods_sn: g.goods_sn || '',
    num: 1,
    unit_name: g.unit_name || '',
    price: Number(g.cost_price || 0)
  }))
  matDialog.value.step = 2
}

function resetMatDialog() {
  Object.assign(matDialog.value, {
    visible: false, loading: false, saving: false, step: 1,
    keyword: '', filtered: [],
    selectedIds: new Set(), selectedMap: new Map(), selected: []
  })
}

async function submitMatItems() {
  if (!selectedBom.value) return
  matDialog.value.saving = true
  try {
    const merged = [
      ...currentItems.value.map(it => ({
        goods_name: it.goods_name, goods_sn: it.goods_sn,
        num: it.num, unit_name: it.unit_name, price: it.price
      })),
      ...matDialog.value.selected
    ]
    await http.post('/goods/BomGoods/edit', {
      id: selectedBom.value.id,
      goods_name: selectedBom.value.goods_name,
      goods_sn: selectedBom.value.goods_sn,
      spec: selectedBom.value.spec,
      unit_name: selectedBom.value.unit_name,
      items: merged
    })
    ElMessage.success(t('goods.bom.msgAddMaterialSuccess', { count: matDialog.value.selected.length }))
    matDialog.value.visible = false
    await loadItems(selectedBom.value.id)
  } catch (e: any) {
    ElMessage.error(e.message || t('goods.bom.msgAddMaterialFailed'))
  } finally {
    matDialog.value.saving = false
  }
}

onMounted(loadGoodsList)

// ── 一键采购 BOM ──────────────────────────────────────────────────
function handleGotoProcure() {
  if (!currentItems.value.length) { ElMessage.warning(t('goods.bom.msgNoBomItems')); return }
  const items = currentItems.value.map(it => ({
    goods_name: it.goods_name,
    goods_sn: it.goods_sn || '',
    spec: it.spec || '',
    unit_name: it.unit_name || '',
    num: Number(it.num || 0),
    price_no_tax: Number(it.price || 0),
    tax_rate: 0,
    price: Number(it.price || 0),
    remark: `BOM物料（${selectedBom.value?.goods_name ?? ''}）`
  }))
  sessionStorage.setItem('procure_order_from_bom', JSON.stringify({
    goods_info: JSON.stringify(items),
    remark: `来自BOM：${selectedBom.value?.goods_name ?? ''}`
  }))
  router.push({ name: 'ProcureOrder' })
}
</script>

<style scoped>
.bom-page {
  display: flex;
  height: calc(100vh - 110px);
  gap: 12px;
  padding: 12px;
  box-sizing: border-box;
}

/* ── 左侧 ── */
.goods-panel {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.panel-title {
  font-weight: 600;
  font-size: 14px;
  color: #1d1d1f;
}
.panel-search {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.goods-list {
  flex: 1;
  overflow-y: auto;
}
.goods-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  cursor: pointer;
  border-bottom: 1px solid #f7f7f7;
  transition: background 0.15s;
}
.goods-item:hover { background: #f5f7fa; }
.goods-item.active { background: #ecf5ff; }
.goods-item-info { flex: 1; min-width: 0; }
.goods-name { font-size: 13px; color: #1d1d1f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-name-empty { color: #bbb; font-style: italic; }
.goods-sn { font-size: 11px; color: #999; margin-top: 2px; }
.goods-copy { color: #ccc; font-size: 14px; flex-shrink: 0; margin-left: 6px; }
.goods-copy:hover { color: #409eff; }
.goods-del { color: #ccc; font-size: 14px; flex-shrink: 0; margin-left: 6px; }
.goods-del:hover { color: #f56c6c; }
.empty-tip { padding: 24px 12px; color: #bbb; font-size: 13px; text-align: center; }

/* ── 右侧 ── */
.bom-panel {
  flex: 1;
  min-width: 0;
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.bom-table-wrap {
  flex: 1;
  overflow: auto;
  padding: 0 12px;
}
.hint-text { color: #bbb; font-size: 13px; }

.selected-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  background: #fef9ec;
  border-top: 1px solid #faecd8;
  font-size: 13px;
  color: #e6a23c;
}

.cost-summary {
  padding: 10px 14px;
  border-top: 1px solid #f0f0f0;
  font-size: 13px;
  color: #606266;
  background: #fafafa;
  flex-shrink: 0;
}
.total-price {
  color: #e6573f;
  font-size: 16px;
}

.price-cell {
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 3px;
}
.price-cell:hover { background: #f0f7ff; color: #409eff; }
.subtotal { color: #606266; }

.empty-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ccc;
  gap: 12px;
  font-size: 14px;
}

/* ── 物料选择弹框 ── */
.pick-body { display: flex; flex-direction: column; gap: 8px; }
.pick-search { margin-bottom: 4px; }
.pick-list {
  max-height: 380px;
  overflow-y: auto;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}
.pick-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.12s;
}
.pick-item:hover { background: #f5f7fa; }
.pick-item.selected { background: #ecf5ff; }
.pick-item-info { flex: 1; min-width: 0; }
.pick-name { font-size: 13px; color: #1d1d1f; }
.pick-sn { font-size: 11px; color: #999; margin-left: 8px; }
.pick-spec { font-size: 12px; color: #909399; }
.pick-unit { font-size: 12px; color: #bbb; flex-shrink: 0; }
.pick-footer {
  font-size: 13px;
  color: #606266;
  padding-top: 4px;
  text-align: right;
}
</style>
