<template>
  <div class="prod-overview">

    <!-- ── 顶部：快捷操作 ──────────────────────────────────────────── -->
    <div class="quick-bar">
      <el-button type="primary" size="large" :icon="MagicStick" :loading="generating" @click="openGenerateDialog">
        一键生产成品BOM计划
      </el-button>
      <el-button :icon="Refresh" @click="loadAll">刷新数据</el-button>
    </div>

    <!-- ── 统计卡片 ───────────────────────────────────────────────── -->
    <div class="stat-cards">
      <div class="stat-card" v-for="c in statCards" :key="c.key" @click="c.path && $router.push(c.path)">
        <div class="stat-icon" :style="{ background: c.bg, color: c.color }">
          <el-icon :size="20"><component :is="c.icon" /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-label">{{ c.label }}</div>
          <div class="stat-value" :style="{ color: c.color }">{{ c.value }}</div>
          <div class="stat-sub">{{ c.sub }}</div>
        </div>
      </div>
    </div>

    <!-- ── 第二行：进行中计划 + 最近入库 ─────────────────────────────── -->
    <el-row :gutter="14" style="margin-top:14px">
      <!-- 进行中生产计划 -->
      <el-col :span="14">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15"><List /></el-icon>
              <span>进行中的生产计划</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="$router.push('/production/plan')">查看全部</el-button>
            </div>
          </template>
          <div v-if="activePlans.length === 0" class="empty-tip">暂无进行中的生产计划</div>
          <div v-else>
            <div class="plan-item" v-for="p in activePlans" :key="p.id">
              <div class="plan-main">
                <span class="plan-sn">{{ p.order_sn }}</span>
                <el-tag v-if="p.priority === '紧急'" type="danger" size="small" style="margin-left:6px">紧急</el-tag>
                <el-tag v-else-if="p.priority === '高'" type="warning" size="small" style="margin-left:6px">高</el-tag>
              </div>
              <div class="plan-goods">{{ p.goods_list_str || '—' }}</div>
              <div class="plan-progress">
                <span class="progress-label">排产</span>
                <el-progress :percentage="p.schedule_pct" :stroke-width="6" style="flex:1;min-width:80px" />
                <span class="progress-label ml8">入库</span>
                <el-progress :percentage="p.inhouse_pct" :stroke-width="6" :color="p.inhouse_pct >= 100 ? '#16a34a' : '#409eff'" style="flex:1;min-width:80px" />
              </div>
              <div class="plan-date">交货：{{ p.finish_date || '—' }}</div>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- BOM缺料预警 -->
      <el-col :span="10">
        <el-card shadow="hover">
          <template #header>
            <div class="card-header">
              <el-icon :size="15" color="#f59e0b"><Warning /></el-icon>
              <span>BOM物料库存状态</span>
              <el-button link type="primary" size="small" style="margin-left:auto" @click="$router.push('/goods/bom')">管理BOM</el-button>
            </div>
          </template>
          <div v-if="bomLoading" class="empty-tip"><el-icon class="is-loading"><Loading /></el-icon> 加载中…</div>
          <div v-else-if="bomProducts.length === 0" class="empty-tip">暂无BOM清单数据</div>
          <div v-else>
            <div class="bom-item" v-for="bp in bomProducts.slice(0,6)" :key="bp.goods_id">
              <div class="bom-name" :title="bp.goods_name">{{ bp.goods_name }}</div>
              <div class="bom-status">
                <el-tag v-if="bp.canMake > 0" type="success" size="small">可生产 {{ bp.canMake }}</el-tag>
                <el-tag v-else type="danger" size="small">物料不足</el-tag>
              </div>
            </div>
            <div v-if="bomProducts.length > 6" class="more-tip" @click="$router.push('/goods/bom')">
              还有 {{ bomProducts.length - 6 }} 个产品 →
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- ── 最近生产入库记录 ─────────────────────────────────────────── -->
    <el-card shadow="hover" style="margin-top:14px">
      <template #header>
        <div class="card-header">
          <el-icon :size="15"><Finished /></el-icon>
          <span>最近生产入库记录</span>
          <el-button link type="primary" size="small" style="margin-left:auto" @click="$router.push('/production/inhouse')">查看全部</el-button>
        </div>
      </template>
      <el-table :data="recentInhouse" size="small" stripe border>
        <el-table-column prop="order_sn" label="入库单号" width="150" />
        <el-table-column prop="goods_name" label="商品名称" min-width="140" />
        <el-table-column prop="num" label="入库数量" width="90" align="right" />
        <el-table-column prop="unit_name" label="单位" width="70" align="center" />
        <el-table-column prop="warehouse_name" label="入库仓库" min-width="110" />
        <el-table-column label="入库日期" width="110">
          <template #default="{ row }">{{ (row.in_date || row.created_at || '').slice(0,10) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
              {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- ══════════════════════════════════════════════════════════════
         一键生成成品对话框
    ══════════════════════════════════════════════════════════════ -->
    <el-dialog v-model="generateVisible" title="一键生产成品BOM计划" width="760px" :close-on-click-modal="false">
      <div class="gen-dialog">

        <!-- Step 1: 选择产品 -->
        <div class="gen-section">
          <div class="gen-section-title">
            <el-icon><GoodsFilled /></el-icon> 选择要生产的产品
          </div>
          <div class="gen-search-row">
            <el-input v-model="genSearch" placeholder="搜索产品名称…" clearable style="width:220px" @input="filterGenGoods" />
            <span class="gen-hint">共 {{ filteredGenGoods.length }} 个有BOM的产品</span>
          </div>
          <div class="gen-goods-grid">
            <div
              v-for="g in filteredGenGoods" :key="g.goods_id"
              :class="['gen-goods-card', { selected: selectedGenGoods.has(g.goods_id) }]"
              @click="toggleGenGoods(g)"
            >
              <div class="gen-goods-name">{{ g.goods_name }}</div>
              <div class="gen-goods-meta">
                <span class="gen-canmake" :class="g.canMake > 0 ? 'ok' : 'lack'">
                  可生产: {{ g.canMake }}
                </span>
              </div>
              <div v-if="selectedGenGoods.has(g.goods_id)" class="gen-qty-row" @click.stop>
                <span class="gen-qty-label">数量</span>
                <el-input-number
                  v-model="genQtyMap[g.goods_id]"
                  :min="1" :max="g.canMake || 9999"
                  size="small" controls-position="right"
                  style="width:120px"
                />
                <span class="gen-unit">{{ g.unit_name || '' }}</span>
              </div>
              <el-icon v-if="selectedGenGoods.has(g.goods_id)" class="gen-check"><Select /></el-icon>
            </div>
          </div>
          <div v-if="filteredGenGoods.length === 0" class="empty-tip">没有找到有BOM配置的产品</div>
        </div>

        <!-- Step 2: 入库仓库 + 计划日期 -->
        <div class="gen-section" v-if="selectedGenGoods.size > 0">
          <div class="gen-section-title">
            <el-icon><SetUp /></el-icon> 配置生产参数
          </div>
          <el-row :gutter="16">
            <el-col :span="12">
              <div class="field-row">
                <span class="field-label required">成品入库仓库</span>
                <el-select v-model="genWarehouse" placeholder="选择仓库" style="flex:1">
                  <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field-row">
                <span class="field-label">计划日期</span>
                <el-date-picker v-model="genDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="flex:1" />
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top:10px">
            <el-col :span="24">
              <div class="field-row">
                <span class="field-label">备注</span>
                <el-input v-model="genRemark" placeholder="可选备注" style="flex:1" />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 预览：所选产品 + BOM消耗 -->
        <div class="gen-section" v-if="genPreviewList.length > 0">
          <div class="gen-section-title">
            <el-icon><Document /></el-icon> 生产预览（BOM原料消耗）
          </div>
          <el-table :data="genPreviewList" size="small" border style="width:100%">
            <el-table-column prop="goods_name" label="成品" min-width="120" />
            <el-table-column prop="qty" label="生产数量" width="90" align="right" />
            <el-table-column prop="unit_name" label="单位" width="70" align="center" />
            <el-table-column prop="materials" label="消耗原料" min-width="200">
              <template #default="{ row }">
                <div v-for="m in row.materials" :key="m._matGoodsId || m.material_id" class="mat-row">
                  <span class="mat-name">{{ m.material_name || m.goods_name }}</span>
                  <span class="mat-qty">×{{ m.num * row.qty }}</span>
                  <el-tag size="small" :type="m.stockOk ? 'success' : 'danger'" style="margin-left:4px">
                    库存{{ m.stock_num ?? '?' }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 进度日志 -->
        <div class="gen-log" v-if="genLogs.length > 0">
          <div v-for="(log, i) in genLogs" :key="i" :class="['gen-log-item', log.type]">
            <el-icon v-if="log.type === 'success'"><CircleCheck /></el-icon>
            <el-icon v-else-if="log.type === 'error'"><CircleClose /></el-icon>
            <el-icon v-else class="is-loading"><Loading /></el-icon>
            {{ log.text }}
          </div>
        </div>

      </div>

      <template #footer>
        <el-button @click="generateVisible = false" :disabled="generating">取消</el-button>
        <el-button
          type="primary" :icon="MagicStick"
          :loading="generating"
          :disabled="selectedGenGoods.size === 0 || !genWarehouse"
          @click="doGenerate"
        >
          {{ generating ? '生成中…' : '确认一键生成' }}
        </el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  MagicStick, Refresh, List, Warning, Loading, Finished, GoodsFilled,
  SetUp, Document, CircleCheck, CircleClose, Select
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getProductionPlanList, getProductionInhouseList, createProductionPlan, auditProductionPlan, createProductionInhouse, auditProductionInhouse, createMaterial, auditMaterial } from '@/api/production'
import { getGoodsList, getBomByGoods } from '@/api/goods'
import http from '@/api/http'

// ── 统计数据 ──────────────────────────────────────────────────────
const statCards = ref([
  { key: 'total', label: '生产计划总数', value: '—', sub: '全部计划', color: '#409eff', bg: '#eff6ff', icon: 'List', path: '/production/plan' },
  { key: 'active', label: '进行中', value: '—', sub: '待完成计划', color: '#f59e0b', bg: '#fffbeb', icon: 'Warning', path: '/production/plan' },
  { key: 'done', label: '已完成', value: '—', sub: '本月完成', color: '#16a34a', bg: '#f0fdf4', icon: 'Finished', path: '/production/inhouse' },
  { key: 'inhouse', label: '成品入库单', value: '—', sub: '最近30天', color: '#7c3aed', bg: '#f5f3ff', icon: 'Box', path: '/production/inhouse' },
])

// ── 进行中的计划 ──────────────────────────────────────────────────
const activePlans = ref<any[]>([])
const recentInhouse = ref<any[]>([])

// ── BOM产品状态 ───────────────────────────────────────────────────
const bomLoading = ref(false)
const bomProducts = ref<any[]>([])
const allGoods = ref<any[]>([])
const warehouseList = ref<any[]>([])

// ── 一键生成弹窗 ─────────────────────────────────────────────────
const generateVisible = ref(false)
const generating = ref(false)
const genSearch = ref('')
const filteredGenGoods = ref<any[]>([])
const selectedGenGoods = ref<Set<number>>(new Set())
const genQtyMap = ref<Record<number, number>>({})
const genWarehouse = ref<number | null>(null)
const genDate = ref('')
const genRemark = ref('')
const genLogs = ref<{ text: string; type: 'info' | 'success' | 'error' }[]>([])

const genPreviewList = computed(() => {
  return [...selectedGenGoods.value].map(gid => {
    const g = bomProducts.value.find(b => b.goods_id === gid)
    return g ? { ...g, qty: genQtyMap.value[gid] || 1 } : null
  }).filter(Boolean)
})

// ── 加载所有数据 ─────────────────────────────────────────────────
async function loadAll() {
  await Promise.all([loadStats(), loadActivePlans(), loadRecentInhouse(), loadBomProducts(), loadWarehouses()])
}

async function loadStats() {
  try {
    const [planRes, inhouseRes] = await Promise.all([
      getProductionPlanList({ list_rows: 200 }),
      getProductionInhouseList({ list_rows: 200 }),
    ])
    const plans = planRes.data?.rows ?? planRes.data?.list ?? []
    const inhouses = inhouseRes.data?.rows ?? inhouseRes.data?.list ?? []
    const now = new Date()
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`
    statCards.value[0].value = String(plans.length)
    statCards.value[1].value = String(plans.filter((p: any) => p.status === 1).length)
    statCards.value[2].value = String(plans.filter((p: any) => p.status === 2).length)
    statCards.value[3].value = String(inhouses.filter((h: any) => (h.created_at || '').slice(0, 10) >= monthStart).length)
  } catch {}
}

async function loadActivePlans() {
  try {
    const res = await getProductionPlanList({ list_rows: 10, status: 1 })
    const list = res.data?.rows ?? res.data?.list ?? []
    activePlans.value = list.map((p: any) => ({
      ...p,
      goods_list_str: p.goods_list ? p.goods_list.map((g: any) => g.goods_name).join('、') : (p.goods_name || ''),
      schedule_pct: Math.min(100, Math.round((p.schedule_num / (p.plan_num || 1)) * 100)),
      inhouse_pct: Math.min(100, Math.round((p.inhouse_num / (p.plan_num || 1)) * 100)),
    }))
  } catch {}
}

async function loadRecentInhouse() {
  try {
    const res = await getProductionInhouseList({ list_rows: 8 })
    recentInhouse.value = res.data?.rows ?? res.data?.list ?? []
  } catch {}
}

async function loadBomProducts() {
  bomLoading.value = true
  try {
    // 获取所有商品
    const gRes = await getGoodsList({ list_rows: 500 })
    allGoods.value = gRes.data?.rows ?? gRes.data?.list ?? []
    // 获取BOM总表
    const bomRes = await http.get('/goods/ShopBom/index', { params: { list_rows: 1000 } })
    const bomAll: any[] = bomRes.data?.rows ?? bomRes.data?.list ?? []
    // 按goods_id分组
    const bomByGoods: Record<number, any[]> = {}
    for (const bom of bomAll) {
      if (!bomByGoods[bom.goods_id]) bomByGoods[bom.goods_id] = []
      bomByGoods[bom.goods_id].push(bom)
    }
    // 获取库存
    const stockRes = await http.get('/stock/StockAll/index', { params: { list_rows: 1000 } })
    const stocks: any[] = stockRes.data?.rows ?? stockRes.data?.list ?? []
    const stockMap: Record<number, number> = {}
    for (const s of stocks) {
      stockMap[s.goods_id] = (stockMap[s.goods_id] || 0) + Number(s.stock_num || 0)
    }
    // 计算每个成品可生产数量
    const result: any[] = []
    for (const [gidStr, mats] of Object.entries(bomByGoods)) {
      const gid = Number(gidStr)
      // BOM记录自带goods_name，优先用它；fallback到allGoods
      const firstMat = mats[0]
      const goods = allGoods.value.find((g: any) => g.id === gid || g.goods_id === gid)
      const goodsName = firstMat?.goods_name || goods?.goods_name || goods?.name || `商品#${gid}`
      const goodsSn = goods?.goods_sn || goods?.sn || ''
      const unitName = goods?.unit_name || firstMat?.unit_name || ''
      if (!mats.length) continue
      let canMake = Infinity
      const matsWithStock = mats.map((m: any) => {
        const matGoodsId = m.material_id || m.mat_goods_id || m.goods_id
        const stock = stockMap[matGoodsId] || 0
        const needed = Number(m.num) || 1
        const possible = Math.floor(stock / needed)
        if (possible < canMake) canMake = possible
        return { ...m, _matGoodsId: matGoodsId, stock_num: stock, stockOk: stock >= needed }
      })
      result.push({
        goods_id: gid,
        goods_name: goodsName,
        goods_sn: goodsSn,
        unit_name: unitName,
        canMake: canMake === Infinity ? 0 : canMake,
        materials: matsWithStock,
      })
    }
    bomProducts.value = result.sort((a, b) => b.canMake - a.canMake)
    filteredGenGoods.value = [...bomProducts.value]
  } catch (e) {
    console.error('loadBomProducts error', e)
  } finally {
    bomLoading.value = false
  }
}

async function loadWarehouses() {
  try {
    const res = await http.get('/stock/WarehouseName/index', { params: { list_rows: 100 } })
    warehouseList.value = res.data?.rows ?? res.data?.list ?? []
    if (!genWarehouse.value && warehouseList.value.length) {
      genWarehouse.value = warehouseList.value[0].id
    }
  } catch {}
}

// ── 弹窗操作 ─────────────────────────────────────────────────────
function openGenerateDialog() {
  if (bomLoading.value) {
    ElMessage.warning('请先等待BOM数据加载完毕')
    return
  }
  selectedGenGoods.value = new Set()
  genQtyMap.value = {}
  genLogs.value = []
  genSearch.value = ''
  filteredGenGoods.value = [...bomProducts.value]
  generateVisible.value = true
}

function filterGenGoods() {
  const q = genSearch.value.trim().toLowerCase()
  filteredGenGoods.value = bomProducts.value.filter(g =>
    !q || g.goods_name.toLowerCase().includes(q) || (g.goods_sn || '').toLowerCase().includes(q)
  )
}

function toggleGenGoods(g: any) {
  if (selectedGenGoods.value.has(g.goods_id)) {
    selectedGenGoods.value.delete(g.goods_id)
    delete genQtyMap.value[g.goods_id]
  } else {
    selectedGenGoods.value.add(g.goods_id)
    genQtyMap.value[g.goods_id] = Math.min(g.canMake || 1, 1)
  }
  selectedGenGoods.value = new Set(selectedGenGoods.value)
}

// ── 一键生成逻辑 ─────────────────────────────────────────────────
async function doGenerate() {
  if (!selectedGenGoods.value.size) return
  if (!genWarehouse.value) { ElMessage.warning('请选择入库仓库'); return }

  const items = genPreviewList.value as any[]

  // 检查库存充足性
  const lacking = items.filter(i => i.canMake < i.qty)
  if (lacking.length) {
    try {
      await ElMessageBox.confirm(
        `以下产品物料库存不足：${lacking.map((l: any) => l.goods_name).join('、')}，是否继续？`,
        '库存不足确认', { type: 'warning' }
      )
    } catch { return }
  }

  generating.value = true
  genLogs.value = []

  const today = genDate.value || new Date().toISOString().slice(0, 10)

  for (const item of items) {
    genLogs.value.push({ text: `开始生成：${item.goods_name} × ${item.qty}`, type: 'info' })
    try {
      // 1. 创建生产计划
      const planData = {
        plan_date: today,
        finish_date: today,
        remark: genRemark.value || '一键生成BOM计划',
        goods_list: [{ goods_id: item.goods_id, goods_name: item.goods_name, num: item.qty, unit_name: item.unit_name }],
        plan_num: item.qty,
        schedule_num: item.qty,
      }
      const planRes = await createProductionPlan(planData)
      const planId = planRes.data?.id
      genLogs.value.push({ text: `  ✓ 生产计划已创建（ID: ${planId}）`, type: 'success' })

      // 2. 审核生产计划
      if (planId) {
        await auditProductionPlan(planId, 1)
        genLogs.value.push({ text: `  ✓ 生产计划已审核通过`, type: 'success' })
      }

      // 3. 创建领料单（扣减原料库存）
      for (const mat of item.materials) {
        const needed = Number(mat.num) * item.qty
        try {
          const matData = {
            goods_id: mat._matGoodsId,
            goods_name: mat.material_name || mat.goods_name,
            num: needed,
            plan_id: planId,
            remark: `一键生成 - ${item.goods_name}`,
          }
          const matRes = await createMaterial(matData)
          const matId = matRes.data?.id
          if (matId) await auditMaterial(matId, 1)
          genLogs.value.push({ text: `  ✓ 领料：${mat.material_name || mat.goods_name} × ${needed}`, type: 'success' })
        } catch (e) {
          genLogs.value.push({ text: `  ⚠ 领料失败：${mat.material_name || mat.goods_name}（可继续）`, type: 'error' })
        }
      }

      // 4. 创建生产入库单（成品入库）
      const inhouseData = {
        plan_id: planId,
        plan_name: planRes.data?.order_sn || '',
        goods_id: item.goods_id,
        goods_name: item.goods_name,
        num: item.qty,
        unit_name: item.unit_name,
        warehouse_id: genWarehouse.value,
        in_date: today,
        remark: genRemark.value || '一键生成BOM入库',
        is_backflush: 1,
      }
      const inhouseRes = await createProductionInhouse(inhouseData)
      const inhouseId = inhouseRes.data?.id
      genLogs.value.push({ text: `  ✓ 生产入库单已创建（ID: ${inhouseId}）`, type: 'success' })

      // 5. 审核入库单（触发库存增加）
      if (inhouseId) {
        await auditProductionInhouse(inhouseId, 1)
        genLogs.value.push({ text: `  ✓ 入库审核通过 — 成品已入库`, type: 'success' })
      }

    } catch (e: any) {
      genLogs.value.push({ text: `  ✗ 失败：${e?.message || '接口错误'}`, type: 'error' })
    }
  }

  generating.value = false
  ElMessage.success('一键生成完成！')
  // 刷新数据
  loadAll()
}

onMounted(loadAll)
</script>

<style scoped>
.prod-overview { padding: 16px; }

.quick-bar {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 14px;
}

/* 统计卡片 */
.stat-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 4px;
}
.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.07);
  cursor: pointer;
  transition: box-shadow 0.2s;
}
.stat-card:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.12); }
.stat-icon {
  width: 44px; height: 44px; border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-label { font-size: 12px; color: #888; }
.stat-value { font-size: 22px; font-weight: 700; line-height: 1.2; }
.stat-sub { font-size: 11px; color: #aaa; }

/* 卡片头 */
.card-header { display: flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; }

/* 进行中计划 */
.plan-item {
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}
.plan-item:last-child { border-bottom: none; }
.plan-main { display: flex; align-items: center; font-weight: 600; font-size: 13px; }
.plan-sn { color: #333; }
.plan-goods { font-size: 12px; color: #888; margin: 2px 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.plan-progress {
  display: flex; align-items: center; gap: 6px; margin: 4px 0;
  font-size: 11px; color: #888;
}
.progress-label { flex-shrink: 0; }
.ml8 { margin-left: 8px; }
.plan-date { font-size: 11px; color: #aaa; }

/* BOM状态 */
.bom-item { display: flex; align-items: center; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #f5f5f5; }
.bom-item:last-child { border-bottom: none; }
.bom-name { font-size: 13px; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; padding-right: 8px; }
.more-tip { text-align: right; font-size: 12px; color: #409eff; cursor: pointer; margin-top: 6px; }

.empty-tip { color: #aaa; font-size: 13px; text-align: center; padding: 20px 0; }

/* 生成弹窗 */
.gen-dialog { max-height: 70vh; overflow-y: auto; }
.gen-section { margin-bottom: 18px; }
.gen-section-title {
  display: flex; align-items: center; gap: 6px;
  font-size: 14px; font-weight: 600; color: #333;
  margin-bottom: 10px; padding-bottom: 6px;
  border-bottom: 2px solid #f0f0f0;
}
.gen-search-row { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.gen-hint { font-size: 12px; color: #aaa; }

.gen-goods-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  max-height: 240px;
  overflow-y: auto;
}
.gen-goods-card {
  border: 1px solid #e4e7ed; border-radius: 6px; padding: 8px 10px;
  cursor: pointer; position: relative; transition: all 0.15s;
  background: #fafafa;
}
.gen-goods-card:hover { border-color: #409eff; background: #ecf5ff; }
.gen-goods-card.selected { border-color: #409eff; background: #ecf5ff; }
.gen-goods-name { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 4px; }
.gen-goods-meta { font-size: 11px; }
.gen-canmake.ok { color: #16a34a; }
.gen-canmake.lack { color: #dc2626; }
.gen-qty-row {
  display: flex; align-items: center; gap: 6px;
  margin-top: 8px; padding-top: 6px; border-top: 1px dashed #d0e8ff;
}
.gen-qty-label { font-size: 12px; color: #666; flex-shrink: 0; }
.gen-unit { font-size: 12px; color: #888; }
.gen-check {
  position: absolute; top: 6px; right: 6px;
  color: #409eff; font-size: 16px;
}

.field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.field-label { font-size: 13px; color: #555; white-space: nowrap; flex-shrink: 0; }
.field-label.required::before { content: '*'; color: #f56c6c; margin-right: 2px; }

/* 物料预览 */
.mat-row { display: flex; align-items: center; gap: 4px; font-size: 12px; margin-bottom: 2px; }
.mat-name { color: #333; }
.mat-qty { color: #888; }

/* 操作日志 */
.gen-log {
  background: #f8fafc; border: 1px solid #e8edf2;
  border-radius: 6px; padding: 10px 12px;
  max-height: 180px; overflow-y: auto;
  font-family: monospace; font-size: 12px;
  margin-top: 12px;
}
.gen-log-item {
  display: flex; align-items: center; gap: 6px;
  padding: 2px 0; line-height: 1.6;
}
.gen-log-item.success { color: #16a34a; }
.gen-log-item.error { color: #dc2626; }
.gen-log-item.info { color: #555; }
</style>
