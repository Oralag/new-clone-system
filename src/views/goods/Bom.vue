<template>
  <div class="bom-page">

    <!-- 左侧：BOM 成品列表 -->
    <div class="goods-panel">
      <div class="panel-header">
        <span class="panel-title">成品列表</span>
        <el-button :icon="Plus" size="small" type="primary" @click="openAddGoods">新增成品</el-button>
      </div>
      <div class="panel-search">
        <el-input v-model="goodsKeyword" placeholder="搜索成品名称" clearable size="small" :prefix-icon="Search" />
      </div>
      <div class="goods-list" v-loading="goodsLoading">
        <div
          v-for="item in filteredGoodsList"
          :key="item.goods_id"
          class="goods-item"
          :class="{ active: selectedGoods?.goods_id === item.goods_id }"
          @click="selectGoods(item)"
        >
          <div class="goods-item-info">
            <div class="goods-name">{{ item.goods_name }}</div>
            <div class="goods-sn" v-if="item.goods_sn">{{ item.goods_sn }}</div>
          </div>
          <el-icon class="goods-del" @click.stop="handleRemoveGoods(item)"><Delete /></el-icon>
        </div>
        <div v-if="!goodsLoading && filteredGoodsList.length === 0" class="empty-tip">
          暂无成品，点击新增成品
        </div>
      </div>
    </div>

    <!-- 右侧：物料清单 -->
    <div class="bom-panel">
      <div class="panel-header">
        <div style="display:flex;align-items:center;gap:10px">
          <span class="panel-title">物料清单</span>
          <el-tag v-if="selectedGoods" type="primary">{{ selectedGoods.goods_name }}</el-tag>
          <span v-else class="hint-text">请从左侧选择成品</span>
        </div>
        <el-button v-if="selectedGoods" type="primary" :icon="Plus" @click="openAddMaterial">添加物料</el-button>
      </div>

      <div class="bom-table-wrap" v-loading="bomLoading">
        <template v-if="selectedGoods">
          <!-- 工具栏 -->
          <div class="bom-toolbar">
            <div class="toolbar-left"></div>
            <div class="toolbar-right">
              <el-tooltip :content="bomSelected.length > 0 ? `将已选 ${bomSelected.length} 条物料转为采购单` : '将当前物料清单转为采购单'">
                <el-button :icon="ShoppingCart" size="small" type="success" @click="handleGotoProcure">
                  去采购{{ bomSelected.length > 0 ? `(${bomSelected.length})` : '' }}
                </el-button>
              </el-tooltip>
              <el-tooltip :content="bomSelected.length > 0 ? `导出已选 ${bomSelected.length} 条物料` : '导出当前成品BOM'">
                <el-button :icon="Download" size="small" @click="handleExportBom">
                  导出BOM{{ bomSelected.length > 0 ? `(${bomSelected.length})` : '' }}
                </el-button>
              </el-tooltip>
              <el-tooltip content="导出所有成品的完整BOM清单">
                <el-button :icon="Download" size="small" type="primary" plain @click="handleExportAllBom">
                  导出全部成品BOM
                </el-button>
              </el-tooltip>
            </div>
          </div>

          <el-table ref="bomTableRef" :data="bomList" border style="width:100%" empty-text="暂无物料，点击添加物料"
            show-summary :summary-method="getSummary"
            @selection-change="(v: any[]) => bomSelected = v">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="material_name" label="物料名称" min-width="140" />
            <el-table-column prop="material_sn" label="物料编码" width="110" />
            <el-table-column label="用量" width="150" align="center">
              <template #default="{ row }">
                <span style="font-weight:500">{{ row.num }}</span>
                <span style="color:rgba(29,29,31,0.35);margin-left:4px">{{ row.unit_name }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="_spec" label="规格" width="110" align="center" />
            <el-table-column :label="`单价(¥/单位)`" width="110" align="right">
              <template #default="{ row }">
                <el-input-number
                  v-model="row._price"
                  :min="0" :precision="6" :controls="false"
                  size="small"
                  style="width:90px"
                  placeholder="0"
                  @change="saveBomPrice(row)"
                />
              </template>
            </el-table-column>
            <el-table-column label="小计(¥)" width="100" align="right">
              <template #default="{ row }">
                <span style="font-weight:600;color:#0071e3">
                  {{ ((row._price || 0) * (row.num || 0)).toFixed(4).replace(/\.?0+$/, '') || '0' }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="remark" label="备注" min-width="100" />
            <el-table-column label="操作" width="160" fixed="right" align="center">
              <template #default="{ row }">
                <el-button type="success" link @click="openMaterialDrawer(row, true)">查看</el-button>
                <el-button type="primary" link @click="openMaterialDrawer(row, false)">编辑</el-button>
                <el-button type="danger" link @click="handleDeleteBom(row.id)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>

          <!-- 已选操作栏 -->
          <div v-if="bomSelected.length > 0" class="bom-selected-bar">
            已选 <strong>{{ bomSelected.length }}</strong> 条
            <el-button type="primary" link size="small" @click="bomTableRef?.clearSelection()">取消选择</el-button>
            <el-button type="danger" :icon="Delete" size="small" style="margin-left:auto" @click="handleBatchDeleteBom">
              批量删除({{ bomSelected.length }})
            </el-button>
          </div>
          <div class="cost-summary">
            <span class="cost-label">物料数量：</span>
            <span class="cost-count">{{ bomList.filter(r => r.material_name && r.material_name !== '（待添加物料）' && r.num > 0).length }} 种</span>
            <span class="cost-divider">|</span>
            <span class="cost-label">总成本：</span>
            <span class="cost-value">¥{{ totalCost.toFixed(4).replace(/\.?0+$/, '') || '0' }}</span>
          </div>
        </template>
        <div v-else class="no-selection">
          <el-empty description="请从左侧选择一个成品查看物料清单" />
        </div>
      </div>
    </div>

    <!-- 新增成品弹框：从商品表选择 -->
    <el-dialog v-model="addGoodsVisible" title="新增成品" width="520px" append-to-body>
      <div style="margin-bottom:12px">
        <el-input v-model="addGoodsKeyword" placeholder="搜索商品名称/编码" clearable :prefix-icon="Search"
          @input="onAddGoodsSearch" />
      </div>
      <el-table
        :data="goodsOptions"
        v-loading="addGoodsLoading"
        border
        height="320"
        highlight-current-row
        @current-change="onSelectGoodsRow"
      >
        <el-table-column prop="goods_sn" label="商品编码" width="130" />
        <el-table-column prop="goods_name" label="商品名称" min-width="160" />
        <el-table-column prop="cate_name" label="分类" width="100" />
        <el-table-column prop="unit_name" label="单位" width="70" align="center" />
      </el-table>
      <template #footer>
        <el-button @click="addGoodsVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedGoodsRow" @click="confirmAddGoods">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 添加物料：第一步选商品 -->
    <el-dialog v-model="pickGoodsVisible" title="选择物料（从商品库）" width="620px" append-to-body destroy-on-close>
      <div style="display:flex;gap:8px;margin-bottom:12px">
        <el-input v-model="pickKeyword" placeholder="搜索商品名称/编码" clearable :prefix-icon="Search"
          style="flex:1" @input="onPickSearch" />
        <el-select v-model="pickGoodsType" placeholder="类型筛选" clearable style="width:120px" @change="loadPickGoods">
          <el-option label="成品" :value="1" />
          <el-option label="半成品" :value="2" />
          <el-option label="原材料" :value="3" />
          <el-option label="辅料" :value="4" />
        </el-select>
      </div>
      <el-table :data="pickGoodsList" v-loading="pickLoading" border height="300"
        highlight-current-row @current-change="onPickRow">
        <el-table-column prop="goods_sn" label="编码" width="120" />
        <el-table-column prop="goods_name" label="名称" min-width="150" />
        <el-table-column label="类型" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="goodsTypeTag(getBomGoodsType(row))" size="small">{{ goodsTypeLabel(getBomGoodsType(row)) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="unit_name" label="单位" width="70" align="center" />
        <el-table-column prop="cost_price" label="采购价" width="90" align="right" />
      </el-table>
      <div style="margin-top:12px;padding:10px 12px;background:#f0f9ff;border-radius:6px;display:flex;align-items:center;gap:8px;font-size:13px">
        <span style="color:rgba(29,29,31,0.35);white-space:nowrap">找不到？</span>
        <el-button type="primary" size="small" :icon="Plus" @click="openGoodsFormDialog">新建商品并选中</el-button>
      </div>
      <template #footer>
        <el-button @click="pickGoodsVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!pickedRow" @click="confirmPickGoods">下一步：填用量</el-button>
      </template>
    </el-dialog>

    <!-- 完整新建商品对话框 -->
    <GoodsFormDialog ref="goodsFormDialogRef" @created="onGoodsCreated" />

    <!-- 添加/编辑/查看物料抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" width="460px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px" style="padding:0 16px" :disabled="drawerViewMode">
        <!-- 关联商品信息（只读展示） -->
        <div v-if="form.material_name" style="background:#f5f7fa;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:13px;line-height:1.8">
          <div><span style="color:rgba(29,29,31,0.35)">物料名称：</span><b>{{ form.material_name }}</b></div>
          <div v-if="form.material_sn"><span style="color:rgba(29,29,31,0.35)">物料编码：</span>{{ form.material_sn }}</div>
        </div>

        <!-- 用量 + 用量单位（同行） -->
        <el-form-item label="用量" prop="num" :rules="[{ required: true, message: '请输入用量' }]">
          <div style="display:flex;gap:8px;width:100%">
            <el-input-number v-model="form.num" :min="0" :precision="3" :step="1"
              :controls="false" style="flex:1" placeholder="数量" />
            <el-select v-model="form.unit_name" filterable allow-create
              placeholder="单位（如克、个）" style="width:130px" @change="onUnitNameChange">
              <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
            </el-select>
          </div>
          <div style="font-size:12px;color:rgba(29,29,31,0.35);margin-top:4px">
            用量单位即计算成本的单位，如填"150 克"，单价也应填每克价格。<br>
            切换单位时系统会自动换算单价（克↔斤↔千克等）
          </div>
        </el-form-item>

        <!-- 单价 -->
        <el-form-item :label="`单价(¥/${form.unit_name || '单位'})`">
          <el-input-number v-model="form._price" :min="0" :precision="6" :controls="false"
            style="width:100%" placeholder="每个用量单位的价格" />
        </el-form-item>

        <!-- 成本预览 -->
        <div v-if="form._price > 0 && form.num > 0"
          style="background:#f0f9ff;border:1px solid #bae0ff;border-radius:6px;padding:10px 14px;margin-bottom:16px;font-size:13px;line-height:2">
          <div>用量成本：<b style="color:#0071e3">¥{{ (form._price * form.num).toFixed(4) }}</b>
            <span style="color:rgba(29,29,31,0.35)">（{{ form.num }} {{ form.unit_name }} × ¥{{ form._price }}/{{ form.unit_name }}）</span>
          </div>
        </div>

        <!-- 采购换算（折叠区，辅助计算单价） -->
        <el-divider content-position="left" style="margin:0 0 12px">
          <span style="font-size:12px;color:rgba(29,29,31,0.35);cursor:pointer" @click="showBuyCalc = !showBuyCalc">
            {{ showBuyCalc ? '▾' : '▸' }} 采购换算（可选，帮你算单价）
          </span>
        </el-divider>
        <template v-if="showBuyCalc">
          <div style="background:#fffbe6;border:1px solid #ffe58f;border-radius:6px;padding:10px 14px;margin-bottom:12px;font-size:12px;color:#614700">
            例：面粉按<b>斤</b>购买，单价<b>2.5元/斤</b>，但用量单位是<b>克</b>，换算关系<b>1斤=500克</b>，
            则自动算出单价 = 2.5 ÷ 500 = <b>0.005元/克</b>
          </div>
          <el-form-item label="采购单位">
            <el-select v-model="form._buy_unit" filterable allow-create
              placeholder="采购时的单位，如：斤、千克、箱" style="width:100%" @change="recalcPrice">
              <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
            </el-select>
          </el-form-item>
          <el-form-item label="采购单价(¥)">
            <el-input-number v-model="form._buy_price" :min="0" :precision="2" :controls="false"
              style="width:100%" placeholder="每采购单位的价格" @change="recalcPrice" />
          </el-form-item>
          <el-form-item label="换算关系">
            <div style="display:flex;align-items:center;gap:6px;width:100%">
              <span style="white-space:nowrap;font-size:13px;color:#606266">1</span>
              <el-select v-model="form._buy_unit" filterable allow-create style="width:80px" size="small" @change="recalcPrice">
                <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
              </el-select>
              <span style="white-space:nowrap;font-size:13px;color:#606266">=</span>
              <el-input-number v-model="form._buy_ratio" :min="0.000001" :precision="3" :controls="false"
                style="width:90px" size="small" @change="recalcPrice" />
              <el-select v-model="form.unit_name" filterable allow-create style="width:80px" size="small" @change="recalcPrice">
                <el-option v-for="u in unitOptions" :key="u" :label="u" :value="u" />
              </el-select>
            </div>
          </el-form-item>
          <div v-if="form._buy_price > 0 && form._buy_ratio > 0 && form._buy_unit"
            style="background:#fff7e6;border:1px solid #ffd591;border-radius:6px;padding:8px 14px;margin-bottom:12px;font-size:12px">
            换算结果：¥{{ form._buy_price }} / {{ form._buy_unit }} ÷ {{ form._buy_ratio }}
            = <b style="color:#d46b08">¥{{ (form._buy_price / form._buy_ratio).toFixed(6).replace(/\.?0+$/, '') }}</b>
            / {{ form.unit_name || '用量单位' }}
            <el-button type="primary" link size="small" style="margin-left:8px" @click="applyBuyCalc">
              填入单价 →
            </el-button>
          </div>
        </template>

        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div style="display:flex;gap:8px;justify-content:flex-end;padding:12px 16px">
          <el-button @click="drawerVisible = false">关闭</el-button>
          <el-button v-if="drawerViewMode" type="primary" @click="drawerViewMode = false">编辑</el-button>
          <el-button v-else type="primary" :loading="submitting" @click="handleSubmitMaterial">{{ form.id ? '保存' : '确认添加' }}</el-button>
        </div>
      </template>
    </el-drawer>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Search, Delete, Download, ShoppingCart } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getGoodsList, createGoods, getUnitList, getSpecList, getBomList, getBomByGoods, createBom, updateBom, deleteBom } from '@/api/goods'
import GoodsFormDialog from '@/components/GoodsFormDialog.vue'
import * as XLSX from 'xlsx'
import { useRouter } from 'vue-router'

const router = useRouter()

// ── 本地单价存储 ───────────────────────────────────────────────────────────────
const BOM_PRICE_KEY = 'erp_bom_prices'  // { bomId: price }
function loadBomPrices(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(BOM_PRICE_KEY) || '{}') } catch { return {} }
}
function saveBomPrices(map: Record<number, number>) {
  localStorage.setItem(BOM_PRICE_KEY, JSON.stringify(map))
}
const bomPrices = ref<Record<number, number>>(loadBomPrices())

// 采购换算额外字段 { bomId: { buy_unit, buy_price, buy_ratio } }
const BOM_EXTRAS_KEY = 'erp_bom_extras'
interface BomExtra { buy_unit: string; buy_price: number; buy_ratio: number }
function loadBomExtras(): Record<number, BomExtra> {
  try { return JSON.parse(localStorage.getItem(BOM_EXTRAS_KEY) || '{}') } catch { return {} }
}
function saveBomExtrasStore(map: Record<number, BomExtra>) {
  localStorage.setItem(BOM_EXTRAS_KEY, JSON.stringify(map))
}
const bomExtras = ref<Record<number, BomExtra>>(loadBomExtras())

function saveBomPrice(row: any) {
  const map = { ...bomPrices.value }
  if (row._price > 0) map[row.id] = row._price
  else delete map[row.id]
  bomPrices.value = map
  saveBomPrices(map)
}

// 规格本地存储（后端 BOM 表无 spec 字段）
const BOM_SPEC_KEY = 'erp_bom_specs'  // { bomId: spec }
function loadBomSpecs(): Record<number, string> {
  try { return JSON.parse(localStorage.getItem(BOM_SPEC_KEY) || '{}') } catch { return {} }
}
function saveBomSpecs(map: Record<number, string>) {
  localStorage.setItem(BOM_SPEC_KEY, JSON.stringify(map))
}
const bomSpecs = ref<Record<number, string>>(loadBomSpecs())

function saveRowSpec(row: any) {
  const map = { ...bomSpecs.value }
  if (row._spec) map[row.id] = row._spec
  else delete map[row.id]
  bomSpecs.value = map
  saveBomSpecs(map)
}

async function saveRowField(row: any) {
  if (!row.id || !selectedGoods.value) return
  try {
    await deleteBom(row.id)
    await createBom({
      goods_id: selectedGoods.value.goods_id,
      goods_name: selectedGoods.value.goods_name,
      goods_sn: selectedGoods.value.goods_sn || '',
      material_id: row.material_id || 0,
      material_name: row.material_name,
      material_sn: row.material_sn || '',
      num: row.num,
      unit_name: row.unit_name,
      remark: row.remark || '',
    })
    await loadBom()
  } catch {
    ElMessage.error('保存失败')
  }
}

function injectExtras(rows: any[]) {
  const prices = bomPrices.value
  const specs = bomSpecs.value
  return rows.map(r => ({ ...r, _price: prices[r.id] ?? 0, _spec: specs[r.id] ?? '' }))
}

const totalCost = computed(() =>
  bomList.value.reduce((s, r) => s + (r._price || 0) * (r.num || 0), 0)
)

function getSummary({ columns }: any) {
  return columns.map((_: any, i: number) => {
    if (i === 0) return '合计'
    if (i === 7) return `¥${totalCost.value.toFixed(2)}`  // 小计列（序号/名称/编码/用量/规格/单位/单价/小计）
    return ''
  })
}

// ── 左侧成品列表（从 BOM 表 distinct 出已有成品） ────────────────────────────
const goodsList = ref<any[]>([])  // { goods_id, goods_name, goods_sn }
const goodsLoading = ref(false)
const goodsKeyword = ref('')
const selectedGoods = ref<any>(null)

const filteredGoodsList = computed(() => {
  if (!goodsKeyword.value) return goodsList.value
  return goodsList.value.filter(g =>
    g.goods_name?.includes(goodsKeyword.value) || g.goods_sn?.includes(goodsKeyword.value)
  )
})

async function loadGoodsList() {
  goodsLoading.value = true
  try {
    // 从 BOM 表拉所有记录，distinct 出成品
    const res = await getBomList({ list_rows: 1000 })
    const rows: any[] = res.data?.rows ?? []
    const map = new Map<number, any>()
    const countMap = new Map<number, number>()
    for (const r of rows) {
      if (r.goods_id) {
        if (!map.has(r.goods_id)) {
          map.set(r.goods_id, { goods_id: r.goods_id, goods_name: r.goods_name, goods_sn: r.goods_sn, material_count: 0 })
        }
        // Only count real materials (not placeholder rows)
        if (r.material_name && r.material_name !== '（待添加物料）' && r.num > 0) {
          const cur = countMap.get(r.goods_id) ?? 0
          countMap.set(r.goods_id, cur + 1)
        }
      }
    }
    goodsList.value = Array.from(map.values()).map(g => ({
      ...g,
      material_count: countMap.get(g.goods_id) ?? 0,
    }))
  } finally {
    goodsLoading.value = false
  }
}

function selectGoods(item: any) {
  selectedGoods.value = item
  loadBom()
}

// 删除成品（删除该成品的所有 BOM 物料行）
async function handleRemoveGoods(item: any) {
  await ElMessageBox.confirm(`确定从BOM中移除成品「${item.goods_name}」及其所有物料？`, '提示', { type: 'warning' })
  // 先获取该成品所有物料
  const res = await getBomByGoods(item.goods_id)
  const rows: any[] = res.data?.rows ?? []
  await Promise.all(rows.map((r: any) => deleteBom(r.id)))
  ElMessage.success('已移除')
  if (selectedGoods.value?.goods_id === item.goods_id) {
    selectedGoods.value = null
    bomList.value = []
  }
  loadGoodsList()
}

// ── 右侧物料列表 ─────────────────────────────────────────────────────────────
const bomList = ref<any[]>([])
const bomLoading = ref(false)
const bomSelected = ref<any[]>([])
const bomTableRef = ref<any>()

async function loadBom() {
  if (!selectedGoods.value) return
  bomLoading.value = true
  try {
    const res = await getBomByGoods(selectedGoods.value.goods_id)
    bomList.value = injectExtras(res.data?.rows ?? [])
  } finally {
    bomLoading.value = false
  }
}

async function handleDeleteBom(id: number) {
  await ElMessageBox.confirm('确定删除该物料？', '提示', { type: 'warning' })
  await deleteBom(id)
  ElMessage.success('删除成功')
  loadBom()
  loadGoodsList() // 如果删完了刷新左侧
}

async function handleBatchDeleteBom() {
  const ids = bomSelected.value.map((r: any) => r.id).filter(Boolean)
  if (!ids.length) return
  await ElMessageBox.confirm(`确定删除选中的 ${ids.length} 条物料？`, '批量删除', { type: 'warning' })
  await Promise.all(ids.map((id: number) => deleteBom(id)))
  ElMessage.success(`已删除 ${ids.length} 条物料`)
  bomSelected.value = []
  loadBom()
  loadGoodsList()
}

// 跳转到采购订单新建页，预填当前物料清单
function handleGotoProcure() {
  const rows = bomSelected.value.length > 0 ? bomSelected.value : bomList.value
  if (!rows.length) { ElMessage.warning('暂无物料数据'); return }
  const items = rows.map(r => ({
    goods_id: 0,
    goods_name: r.material_name,
    goods_sn: r.material_sn || '',
    spec: r._spec || '',
    cate_name: '',
    unit_name: r.unit_name || '',
    batch_no: '',
    num: r.num || 1,
    price_no_tax: r._price || 0,
    tax_rate: 0,
    price: r._price || 0,
    remark: `BOM物料（${selectedGoods.value?.goods_name ?? ''}）`,
  }))
  sessionStorage.setItem('procure_order_from_bom', JSON.stringify({
    goods_info: JSON.stringify(items),
    remark: `来自BOM：${selectedGoods.value?.goods_name ?? ''}`,
  }))
  router.push({ name: 'ProcureOrder' })
}

// 导出当前成品的 BOM（含成品信息）
function handleExportBom() {
  if (!selectedGoods.value) return
  const rows = bomSelected.value.length > 0 ? bomSelected.value : bomList.value
  if (!rows.length) { ElMessage.warning('暂无物料数据'); return }
  const data = rows.map(r => ({
    '成品名称': selectedGoods.value.goods_name,
    '成品编码': selectedGoods.value.goods_sn || '',
    '物料名称': r.material_name,
    '物料编码': r.material_sn || '',
    '规格': r._spec || '',
    '用量': r.num,
    '单位': r.unit_name,
    '单价(¥)': r._price || 0,
    '小计(¥)': ((r._price || 0) * (r.num || 0)).toFixed(2),
    '备注': r.remark || '',
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'BOM清单')
  const suffix = bomSelected.value.length > 0 ? `_已选${bomSelected.value.length}条` : ''
  XLSX.writeFile(wb, `BOM_${selectedGoods.value.goods_name}${suffix}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
  ElMessage.success(`已导出 ${data.length} 条物料`)
}

// 导出所有成品的完整 BOM 汇总表
async function handleExportAllBom() {
  ElMessage.info('正在获取全部BOM数据...')
  try {
    const res = await getBomList({ list_rows: 5000 })
    const allRows: any[] = res.data?.rows ?? []
    if (!allRows.length) { ElMessage.warning('暂无BOM数据'); return }
    // 注入本地价格
    const prices = bomPrices.value
    const specs = bomSpecs.value
    const data = allRows.map(r => ({
      '成品名称': r.goods_name,
      '成品编码': r.goods_sn || '',
      '物料名称': r.material_name,
      '物料编码': r.material_sn || '',
      '规格': specs[r.id] || '',
      '用量': r.num,
      '单位': r.unit_name,
      '单价(¥)': prices[r.id] || 0,
      '小计(¥)': ((prices[r.id] || 0) * (r.num || 0)).toFixed(2),
      '备注': r.remark || '',
    }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), '全部BOM')
    XLSX.writeFile(wb, `全部成品BOM_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
    ElMessage.success(`已导出 ${data.length} 条物料（共 ${new Set(allRows.map(r => r.goods_id)).size} 个成品）`)
  } catch {
    ElMessage.error('获取数据失败')
  }
}

// ── 新增成品弹框 ─────────────────────────────────────────────────────────────
const addGoodsVisible = ref(false)
const addGoodsLoading = ref(false)
const addGoodsKeyword = ref('')
const goodsOptions = ref<any[]>([])
const selectedGoodsRow = ref<any>(null)
let addSearchTimer: ReturnType<typeof setTimeout>

async function loadGoodsOptions() {
  addGoodsLoading.value = true
  try {
    const res = await getGoodsList({ keyword: addGoodsKeyword.value || undefined, list_rows: 50 })
    goodsOptions.value = res.data?.rows ?? []
  } finally {
    addGoodsLoading.value = false
  }
}

function onAddGoodsSearch() {
  clearTimeout(addSearchTimer)
  addSearchTimer = setTimeout(loadGoodsOptions, 300)
}

function onSelectGoodsRow(row: any) {
  selectedGoodsRow.value = row
}

function openAddGoods() {
  addGoodsKeyword.value = ''
  selectedGoodsRow.value = null
  addGoodsVisible.value = true
  loadGoodsOptions()
}

async function confirmAddGoods() {
  const row = selectedGoodsRow.value
  if (!row) return
  // 检查是否已经在成品列表里
  if (goodsList.value.some(g => g.goods_id === row.id)) {
    ElMessage.warning(`「${row.goods_name}」已在成品列表中`)
    return
  }
  // 新增一条占位 BOM 记录，让成品出现在左侧列表
  // 用一条 placeholder 物料（num=0），用户可以后续添加真实物料
  // 实际上只要至少有一条 bom 记录就行，先添加空的然后让用户自己加物料
  // 更简洁的方式：直接在左侧列表维护，不写 DB，但这样刷新会丢失
  // 正确做法：写一条 bom 记录占位，用户可以删
  await createBom({
    goods_id: row.id,
    goods_name: row.goods_name,
    goods_sn: row.goods_sn || '',
    material_id: 0,
    material_name: '（待添加物料）',
    material_sn: '',
    num: 0,
    unit_name: '',
    remark: '自动占位，请添加实际物料后删除此行',
  })
  ElMessage.success(`已添加成品「${row.goods_name}」，请在右侧添加物料`)
  addGoodsVisible.value = false
  await loadGoodsList()
  // 自动选中刚加的成品
  const added = goodsList.value.find(g => g.goods_id === row.id)
  if (added) selectGoods(added)
}

// ── 添加/编辑/查看物料抽屉 ────────────────────────────────────────────────────
const drawerVisible = ref(false)
const drawerViewMode = ref(false)
const showBuyCalc = ref(false)
const drawerTitle = computed(() => {
  if (drawerViewMode.value) return '查看物料'
  return form.id ? '编辑物料' : '添加物料'
})
const submitting = ref(false)
const formRef = ref()
const form = reactive<any>({
  id: 0, material_id: 0, material_name: '', material_sn: '',
  num: 1, unit_name: '', remark: '',
  _price: 0,           // 每用量单位的单价（与 unit_name 对应）
  _buy_unit: '',       // 采购单位（仅换算用）
  _buy_price: 0,       // 采购单价
  _buy_ratio: 1,       // 1采购单位 = N个用量单位
  _goods_unit: '',     // 商品原始单位（用于切换单位时自动换算）
  _goods_price: 0,     // 商品原始价格（每_goods_unit）
})

// ── 单位换算表 ────────────────────────────────────────────────────────────────
// 以克为基准: 1单位 = N克
const UNIT_GRAM_MAP: Record<string, number> = {
  '克': 1, 'g': 1, 'G': 1,
  '千克': 1000, '千克(kg)': 1000, 'kg': 1000, 'KG': 1000, 'Kg': 1000,
  '斤': 500,
  '两': 50,
  '吨': 1000000,
}
// 以毫升为基准: 1单位 = N毫升
const UNIT_ML_MAP: Record<string, number> = {
  '毫升': 1, '毫升(ml)': 1, 'ml': 1, 'ML': 1, 'mL': 1,
  '升': 1000, '升(L)': 1000, 'L': 1000, 'l': 1000,
}
// 以毫米为基准: 1单位 = N毫米
const UNIT_MM_MAP: Record<string, number> = {
  '毫米': 1, '毫米(mm)': 1, 'mm': 1,
  '厘米': 10, '厘米(cm)': 10, 'cm': 10,
  '米': 1000, '米(m)': 1000, 'm': 1,
}

/** 两个单位之间的换算比例: 1 fromUnit = ? toUnit */
function getUnitRatio(fromUnit: string, toUnit: string): number | null {
  if (fromUnit === toUnit) return 1
  for (const map of [UNIT_GRAM_MAP, UNIT_ML_MAP, UNIT_MM_MAP]) {
    const from = map[fromUnit]
    const to = map[toUnit]
    if (from !== undefined && to !== undefined) {
      return from / to
    }
  }
  return null
}

// 采购换算：点"填入单价"时把换算结果写入 _price
function applyBuyCalc() {
  if (form._buy_price > 0 && form._buy_ratio > 0) {
    form._price = parseFloat((form._buy_price / form._buy_ratio).toFixed(6))
  }
}

// 采购信息变化时自动填入单价（实时换算）
function recalcPrice() {
  if (form._buy_price > 0 && form._buy_ratio > 0) {
    form._price = parseFloat((form._buy_price / form._buy_ratio).toFixed(6))
  }
}

// 用量单位改变时，如果商品有原始价格/单位，自动换算单价
function onUnitNameChange() {
  if (!form._goods_unit || !form._goods_price || !form.unit_name) return
  const ratio = getUnitRatio(form._goods_unit, form.unit_name)
  if (ratio !== null && ratio > 0) {
    // _goods_price 是每 _goods_unit 的价格
    // 1 _goods_unit = ratio 个 form.unit_name
    // => 每 form.unit_name 的价格 = _goods_price / ratio
    form._price = parseFloat((form._goods_price / ratio).toFixed(6))
    // 同时更新采购换算区的 _buy_ratio
    form._buy_ratio = ratio
  }
}

// ── 第一步：选商品弹框 ────────────────────────────────────────────────────────
const pickGoodsVisible = ref(false)
const pickKeyword = ref('')
const pickGoodsType = ref<any>('')
const pickGoodsList = ref<any[]>([])
const pickLoading = ref(false)
const pickedRow = ref<any>(null)
let pickSearchTimer: ReturnType<typeof setTimeout>

function goodsTypeLabel(t: number) {
  return { 1: '成品', 2: '半成品', 3: '原材料', 4: '辅料' }[t] ?? '成品'
}
function goodsTypeTag(t: number): string {
  return { 1: 'success', 2: 'warning', 3: 'info', 4: '' }[t] ?? 'success'
}

// 从 localStorage 读取商品类型（与 Info.vue 共享同一个 key）
const GOODS_TYPE_KEY = 'erp_goods_type_map'
function loadGoodsTypeMapBom(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(GOODS_TYPE_KEY) || '{}') } catch { return {} }
}
function getBomGoodsType(row: any): number {
  return loadGoodsTypeMapBom()[row.id] ?? row.goods_type ?? 1
}

async function loadPickGoods() {
  pickLoading.value = true
  try {
    const res = await getGoodsList({
      keyword: pickKeyword.value || undefined,
      list_rows: 500,
    })
    let rows: any[] = res.data?.rows ?? []
    // 本地按类型筛选（后端无此字段）
    if (pickGoodsType.value) {
      rows = rows.filter(r => getBomGoodsType(r) === pickGoodsType.value)
    }
    pickGoodsList.value = rows
  } finally {
    pickLoading.value = false
  }
}

function onPickSearch() {
  clearTimeout(pickSearchTimer)
  pickSearchTimer = setTimeout(loadPickGoods, 300)
}

function onPickRow(row: any) { pickedRow.value = row }

// 完整新建商品对话框
const goodsFormDialogRef = ref<InstanceType<typeof GoodsFormDialog>>()

function openGoodsFormDialog() {
  goodsFormDialogRef.value?.open(2) // 默认半成品
}

async function onGoodsCreated(newGoods: any) {
  // 刷新商品列表并自动选中新建的商品
  await loadPickGoods()
  const newRow = pickGoodsList.value.find((g: any) => g.id === newGoods.id)
    ?? pickGoodsList.value.find((g: any) => g.goods_name === newGoods.goods_name)
  if (newRow) pickedRow.value = newRow
}

function openAddMaterial() {
  // 先弹商品选择器
  pickKeyword.value = ''
  pickGoodsType.value = ''
  pickedRow.value = null
  pickGoodsVisible.value = true
  loadPickGoods()
}

async function confirmPickGoods() {
  const row = pickedRow.value
  if (!row) return
  // 拉取该商品的规格，拼成一个展示字符串
  let specStr = ''
  try {
    const specRes = await getSpecList({ goods_id: row.id, list_rows: 20 })
    const specs: any[] = specRes.data?.rows ?? []
    specStr = specs.map((s: any) => `${s.spec_name}：${s.spec_value}`).join('；')
  } catch { /* 无规格也没关系 */ }

  Object.assign(form, {
    id: 0,
    material_id: row.id,
    material_name: row.goods_name,
    material_sn: row.goods_sn || '',
    unit_name: row.unit_name || '',
    _spec: specStr,
    _price: Number(row.cost_price || 0),
    _buy_unit: row.unit_name || '',
    _buy_price: Number(row.cost_price || 0),
    _buy_ratio: 1,
    num: 1,
    remark: '',
    _goods_unit: row.unit_name || '',
    _goods_price: Number(row.cost_price || 0),
  })
  pickGoodsVisible.value = false
  drawerViewMode.value = false
  drawerVisible.value = true
}

function openMaterialDrawer(row: any, viewMode: boolean) {
  const extra = bomExtras.value[row.id] || {}
  Object.assign(form, {
    id: row.id,
    material_id: row.material_id || 0,
    material_name: row.material_name,
    material_sn: row.material_sn,
    num: row.num,
    unit_name: row.unit_name,
    remark: row.remark || '',
    _price: row._price || 0,
    _buy_unit: extra.buy_unit || row.unit_name || '',
    _buy_price: extra.buy_price || 0,
    _buy_ratio: extra.buy_ratio || 1,
  })
  drawerViewMode.value = viewMode
  drawerVisible.value = true
}

async function handleSubmitMaterial() {
  await formRef.value?.validate()
  submitting.value = true
  try {
    // 如有采购换算，计算出单价
    if (form._buy_price > 0 && form._buy_ratio > 0) {
      form._price = parseFloat((form._buy_price / form._buy_ratio).toFixed(6))
    }
    const payload = {
      goods_id: selectedGoods.value.goods_id,
      goods_name: selectedGoods.value.goods_name,
      goods_sn: selectedGoods.value.goods_sn || '',
      material_id: form.material_id || 0,
      material_name: form.material_name,
      material_sn: form.material_sn,
      num: form.num,
      unit_name: form.unit_name,
      remark: form.remark,
    }
    if (form.id) {
      // 后端无 edit 接口，先删后建
      await deleteBom(form.id)
    }
    await createBom(payload)
    ElMessage.success(form.id ? '保存成功' : '添加成功')
    drawerVisible.value = false
    await loadBom()
    // 同步单价和采购换算到 localStorage（新记录 id 从刷新后列表里找）
    const newRow = bomList.value.find(r =>
      r.material_name === form.material_name && !bomPrices.value[r.id]
    )
    const targetId = newRow?.id
    if (targetId) {
      if (form._price > 0) {
        const priceMap = { ...bomPrices.value, [targetId]: form._price }
        bomPrices.value = priceMap
        saveBomPrices(priceMap)
      }
      if (form._buy_price > 0) {
        const extrasMap = { ...bomExtras.value, [targetId]: { buy_unit: form._buy_unit, buy_price: form._buy_price, buy_ratio: form._buy_ratio } }
        bomExtras.value = extrasMap
        saveBomExtrasStore(extrasMap)
      }
      bomList.value = injectExtras(bomList.value)
    }
  } finally {
    submitting.value = false
  }
}

// ── 单位选项 ──────────────────────────────────────────────────────────────────
const unitOptions = ref<string[]>(['个', '件', '套', '箱', '包', '袋', '瓶', '桶', '卷', '张', '片', '块', '粒',
  '克', '千克(kg)', '斤', '两', '吨',
  '毫升(ml)', '升(L)',
  '毫米(mm)', '厘米(cm)', '米(m)',
  '平方米(m²)', '立方米(m³)'])

async function loadUnitOptions() {
  try {
    const res = await getUnitList({ list_rows: 200 })
    const rows: any[] = res.data?.rows ?? []
    const names = rows.map((r: any) => r.name).filter(Boolean)
    // 合并系统单位和内置单位，去重
    const combined = [...new Set([...names, ...unitOptions.value])]
    unitOptions.value = combined
  } catch { /* ignore, use defaults */ }
}

onMounted(() => { loadGoodsList(); loadUnitOptions() })
</script>

<style scoped>
.bom-page {
  display: flex;
  gap: 16px;
  height: calc(100vh - 110px);
  min-height: 500px;
}

.goods-panel {
  width: 240px;
  flex-shrink: 0;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 10px;
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.panel-title { font-size: 14px; font-weight: 600; color: #1d1d1f; }
.hint-text { font-size: 13px; color: rgba(29,29,31,0.35); }

.panel-search { padding: 8px 10px; flex-shrink: 0; }

.goods-list { flex: 1; overflow-y: auto; }

.goods-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  cursor: pointer;
  transition: background 0.12s;
}
.goods-item:hover { background: #f5f7ff; }
.goods-item:hover .goods-del { opacity: 1; }
.goods-item.active { background: rgba(0,113,227,0.08); }

.goods-item-info { flex: 1; overflow: hidden; }
.goods-name { font-size: 13px; color: #1d1d1f; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.goods-sn { font-size: 11px; color: rgba(29,29,31,0.35); margin-top: 2px; }

.goods-del {
  opacity: 0;
  color: #dc2626;
  font-size: 14px;
  flex-shrink: 0;
  margin-left: 6px;
  transition: opacity 0.12s;
}
.goods-del:hover { color: #cb2a2a; }

.goods-count {
  font-size: 11px;
  color: #0071e3;
  background: rgba(0,113,227,0.08);
  border-radius: 3px;
  padding: 0 4px;
  flex-shrink: 0;
  margin-left: 4px;
  white-space: nowrap;
}

.empty-tip { text-align: center; color: rgba(29,29,31,0.35); font-size: 13px; padding: 32px 12px; }

.bom-panel {
  flex: 1;
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bom-panel .panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px 10px;
  border-bottom: 1px solid #f5f5f7;
}

.bom-table-wrap { flex: 1; overflow: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }

.bom-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
  flex-shrink: 0;
}
.toolbar-left { display: flex; align-items: center; gap: 8px; }
.toolbar-right { display: flex; align-items: center; gap: 6px; }

.bom-selected-bar {
  margin-top: 8px;
  padding: 6px 12px;
  background: #e8f3ff;
  border-radius: 8px;
  font-size: 13px;
  color: #0071e3;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cost-summary {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 10px 16px;
  background: #f5f7fa;
  border-radius: 10px;
  gap: 8px;
}
.cost-label { font-size: 14px; color: rgba(29,29,31,0.5); font-weight: 500; }
.cost-count { font-size: 16px; font-weight: 700; color: #0071e3; }
.cost-divider { color: rgba(29,29,31,0.2); margin: 0 4px; }
.cost-value { font-size: 20px; font-weight: 700; color: #dc2626; }

.no-selection {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
