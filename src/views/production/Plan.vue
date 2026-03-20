<template>
  <div class="plan-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <!-- 状态筛选 + 搜索 -->
        <div class="status-bar">
          <el-button-group size="small">
            <el-button :type="searchForm.status === '' ? 'primary' : ''" @click="setStatus('')">全部</el-button>
            <el-button :type="searchForm.status === 0 ? 'primary' : ''" @click="setStatus(0)">待开始</el-button>
            <el-button :type="searchForm.status === 1 ? 'primary' : ''" @click="setStatus(1)">进行中</el-button>
            <el-button :type="searchForm.status === 2 ? 'primary' : ''" @click="setStatus(2)">已完成</el-button>
          </el-button-group>
          <div class="status-bar-right">
            <el-input v-model="searchForm.order_sn" placeholder="生产单号" clearable size="small" style="width:160px" @change="loadData" />
            <el-button size="small" type="primary" @click="loadData">查询</el-button>
            <el-button size="small" @click="resetSearch">重置</el-button>
          </div>
        </div>

        <!-- 工具栏 -->
        <div class="toolbar">
          <el-button type="primary" size="small" @click="openCreate">新增 (F9)</el-button>
          <el-button size="small" type="danger" :disabled="!selection.length" @click="handleBatchDel">删除</el-button>
          <el-button size="small" @click="handleExport">导出</el-button>
        </div>

        <!-- 表格 -->
        <el-table
          :data="tableData" v-loading="loading" border stripe size="small"
          style="width:100%;margin-top:8px"
          @selection-change="selection = $event"
          row-key="id"
        >
          <el-table-column type="selection" width="40" />
          <el-table-column type="expand">
            <template #default="{ row }">
              <div style="padding:8px 24px 12px">
                <el-table :data="parseItems(row.goods_info)" border size="small" style="width:100%">
                  <el-table-column prop="goods_sn" label="编码" width="120" />
                  <el-table-column prop="goods_name" label="商品名称" min-width="160" />
                  <el-table-column prop="spec" label="规格" width="120">
                    <template #default="{ row: r }">{{ r.spec || '—' }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_name" label="单位" width="65" align="center" />
                  <el-table-column prop="num" label="计划数量" width="90" align="right" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column label="生产单号" width="150">
            <template #default="{ row }">{{ row.order_sn || `SC${(row.plan_date||row.created_at||'').slice(0,10).replace(/-/g,'')}${String(row.id).padStart(3,'0')}` }}</template>
          </el-table-column>
          <el-table-column label="销售编号" width="130">
            <template #default="{ row }">{{ row.sale_order_sn || '—' }}</template>
          </el-table-column>
          <el-table-column label="开单日期" width="105">
            <template #default="{ row }">{{ (row.plan_date||row.created_at||'').slice(0,10) }}</template>
          </el-table-column>
          <el-table-column label="交货日期" width="105">
            <template #default="{ row }">{{ row.finish_date || '—' }}</template>
          </el-table-column>
          <el-table-column label="优先级" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === '紧急' ? 'danger' : row.priority === '高' ? 'warning' : ''" size="small">
                {{ row.priority || '正常' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="排产数量" width="90" align="right">
            <template #default="{ row }">{{ row.schedule_num || 0 }}</template>
          </el-table-column>
          <el-table-column label="生产数量" width="90" align="right">
            <template #default="{ row }">{{ row.plan_num || 0 }}</template>
          </el-table-column>
          <el-table-column label="入库数量" width="90" align="right">
            <template #default="{ row }">{{ row.inhouse_num || 0 }}</template>
          </el-table-column>
          <el-table-column label="排产进度" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-progress :percentage="calcPct(row.schedule_num, row.plan_num)" :stroke-width="6" style="flex:1" :show-text="false" />
                <span style="font-size:11px;color:rgba(29,29,31,0.35);width:32px;text-align:right">{{ calcPct(row.schedule_num, row.plan_num) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="生产进度" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-progress :percentage="calcPct(row.actual_num, row.plan_num)" :stroke-width="6" style="flex:1" :show-text="false" />
                <span style="font-size:11px;color:rgba(29,29,31,0.35);width:32px;text-align:right">{{ calcPct(row.actual_num, row.plan_num) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="入库进度" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-progress :percentage="calcPct(row.inhouse_num, row.plan_num)" :stroke-width="6" style="flex:1" :show-text="false" color="#16a34a" />
                <span style="font-size:11px;color:rgba(29,29,31,0.35);width:32px;text-align:right">{{ calcPct(row.inhouse_num, row.plan_num) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="流程状态" width="220" align="center">
            <template #default="{ row }">
              <div class="flow-steps">
                <!-- 步骤1: 领料 -->
                <div class="flow-step" :class="getStepClass(row, 'material')">
                  <div class="step-dot"></div>
                  <span class="step-label">{{ getMaterialLabel(row) }}</span>
                </div>
                <div class="flow-arrow">→</div>
                <!-- 步骤2: 入库 -->
                <div class="flow-step" :class="getStepClass(row, 'inhouse')">
                  <div class="step-dot"></div>
                  <span class="step-label">{{ getInhouseLabel(row) }}</span>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openView(row)">查看</el-button>
              <el-button link type="success" size="small" @click="openEdit(row)">编辑</el-button>
              <!-- 领料按钮：已领料显示完成态，否则激活 -->
              <el-button
                v-if="!hasMaterial(row)"
                link type="warning" size="small"
                @click="goPickMaterial(row)"
              >领料</el-button>
              <el-button
                v-else
                link size="small"
                style="color:#16a34a;cursor:default"
                disabled
              >已领料✓</el-button>
              <!-- 入库按钮：有领料才激活 -->
              <el-button
                v-if="row.inhouse_num > 0 || row.status === 2"
                link size="small"
                style="color:#16a34a;cursor:default"
                disabled
              >已入库✓</el-button>
              <el-button
                v-else-if="hasMaterial(row)"
                link size="small" style="color:#9333ea"
                @click="goInhouse(row)"
              >入库</el-button>
              <el-button
                v-else
                link size="small"
                style="color:#c0c4cc;cursor:not-allowed"
                disabled
              >入库</el-button>
              <el-button link type="danger" size="small" @click="handleDel(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 汇总行 -->
        <div class="summary-bar">
          <span>合计</span>
          <span style="margin-left:32px">排产: <b>{{ totalSchedule.toFixed(2) }}</b></span>
          <span style="margin-left:16px">生产: <b>{{ totalPlan.toFixed(2) }}</b></span>
          <span style="margin-left:16px">入库: <b>{{ totalInhouse.toFixed(2) }}</b></span>
        </div>

        <!-- 分页 -->
        <div style="margin-top:10px;display:flex;justify-content:flex-end;align-items:center;gap:8px">
          <span style="font-size:13px;color:#666">共 {{ total }} 条</span>
          <el-pagination
            v-model:current-page="page" v-model:page-size="pageSize"
            :page-sizes="[20,50,100]" layout="sizes,prev,pager,next,jumper"
            :total="total" @size-change="loadData" @current-change="loadData"
          />
        </div>
      </el-card>

    </div>

    <!-- ── 新增/编辑全页面 ── -->
    <div v-else class="form-page">
      <div class="form-topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView ? '查看生产计划' : (fd.id ? '编辑生产计划' : '新增生产计划') }}</span>
        </div>
        <div v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">保存 (Ctrl+S)</el-button>
        </div>
      </div>

      <el-card class="form-card">
        <el-form :model="fd" label-width="90px" :disabled="isView">
          <el-row :gutter="20">
            <el-col :span="10">
              <el-form-item label="关联销售">
                <div style="display:flex;gap:8px">
                  <el-input v-model="fd.sale_order_sn" placeholder="销售单号" readonly style="flex:1" />
                  <el-button size="small" type="primary" @click="salePickerVisible = true" :disabled="isView">选择销售单</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item label="生产单号">
                <el-input v-model="fd.order_sn" placeholder="不填写自动生成" />
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item label="开单日期">
                <el-date-picker v-model="fd.plan_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="7">
              <el-form-item label="交货日期">
                <el-date-picker v-model="fd.finish_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item label="优先级">
                <el-select v-model="fd.priority" style="width:100%">
                  <el-option label="正常" value="正常" />
                  <el-option label="高" value="高" />
                  <el-option label="紧急" value="紧急" />
                  <el-option label="低" value="低" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 商品清单 -->
        <div class="goods-section">
          <div class="goods-header">
            <span class="goods-title">商品清单</span>
            <el-button v-if="!isView" size="small" type="primary" @click="goodsSelectRef?.open()">+ 选择商品</el-button>
          </div>
          <el-table :data="fd.items" border size="small" style="width:100%">
            <el-table-column prop="goods_sn" label="商品编码" width="120" />
            <el-table-column prop="goods_name" label="商品名称" min-width="160" />
            <el-table-column label="属性" width="90">
              <template #default="{ row }">{{ row.attr || '—' }}</template>
            </el-table-column>
            <el-table-column label="规格型号" width="100">
              <template #default="{ row }">{{ row.spec || '—' }}</template>
            </el-table-column>
            <el-table-column prop="unit_name" label="单位" width="65" align="center" />
            <el-table-column label="已生产数量" width="100" align="right">
              <template #default="{ row }">{{ row.actual_num || 0 }}</template>
            </el-table-column>
            <el-table-column label="本次生产数量" width="130" align="center">
              <template #default="{ row, $index }">
                <el-input-number
                  v-if="!isView"
                  v-model="fd.items[$index].num"
                  :min="0" :precision="4" size="small" style="width:110px"
                />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库存数量" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="(row.stock_qty || 0) > 0 ? 'success' : 'danger'" size="small" effect="plain">
                  {{ row.stock_qty || 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="!isView" label="操作" width="140" align="center">
              <template #default="{ row, $index }">
                <el-button link type="primary" size="small" @click="showBomConsume(row)">BOM消耗</el-button>
                <el-button link type="danger" size="small" @click="fd.items.splice($index, 1)">删除</el-button>
              </template>
            </el-table-column>
            <el-table-column v-else label="操作" width="90" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="showBomConsume(row)">BOM消耗</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-form :model="fd" label-width="90px" :disabled="isView" style="margin-top:16px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="备注">
                <el-input v-model="fd.remark" type="textarea" :rows="3" placeholder="备注（可选）" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- BOM 物料需求 -->
        <div class="goods-section" v-if="fd.items.length">
          <div class="goods-header">
            <span class="goods-title">BOM 物料需求</span>
            <el-button size="small" type="warning" @click="goPickMaterial(fd)" v-if="fd.id">去领料</el-button>
          </div>
          <div v-if="planBomLoading" style="text-align:center;padding:24px;color:#999">加载中...</div>
          <el-table v-else :data="planBomList" border size="small" style="width:100%">
            <el-table-column prop="material_name" label="物料名称" min-width="140" />
            <el-table-column prop="material_sn" label="物料编码" width="110" />
            <el-table-column prop="_spec" label="规格" width="120">
              <template #default="{ row }">{{ row._spec || '—' }}</template>
            </el-table-column>
            <el-table-column label="单位用量" width="90" align="center">
              <template #default="{ row }">{{ row.num }} {{ row.unit_name }}</template>
            </el-table-column>
            <el-table-column label="需求数量" width="100" align="center">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ row._need }}</b> {{ row.unit_name }}
              </template>
            </el-table-column>
            <el-table-column label="库存" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row._stock >= row._need ? 'success' : 'danger'" size="small" effect="plain">{{ row._stock }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="缺口" width="90" align="center">
              <template #default="{ row }">
                <span v-if="row._need > row._stock" style="color:#f56c6c;font-weight:600">{{ (row._need - row._stock).toFixed(2).replace(/\.?0+$/,'') }}</span>
                <span v-else style="color:#16a34a">充足</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 销售单选择器 -->
    <el-dialog v-model="salePickerVisible" title="选择销售单" width="700px" append-to-body>
      <el-table :data="saleOrders" v-loading="saleLoading" border height="360"
        highlight-current-row @current-change="currentSaleRow = $event">
        <el-table-column prop="order_sn" label="销售单号" width="160" />
        <el-table-column prop="customer_name" label="客户" min-width="120" />
        <el-table-column label="日期" width="110">
          <template #default="{ row }">{{ (row.sign_date||row.created_at||'').slice(0,10) }}</template>
        </el-table-column>
        <el-table-column label="金额" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="salePickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!currentSaleRow" @click="confirmSale">确认选择</el-button>
      </template>
    </el-dialog>

    <!-- BOM 消耗弹窗 -->
    <el-dialog v-model="bomVisible" :title="`BOM消耗 - ${bomGoodsName}`" width="750px" append-to-body>
      <div v-if="bomConsumeList.length === 0 && !bomLoading" style="text-align:center;padding:32px 0;color:rgba(29,29,31,0.35)">
        该商品暂未配置BOM清单，请先在「商品 > BOM清单」中添加
      </div>
      <template v-else>
        <div style="margin-bottom:12px;font-size:13px;color:rgba(29,29,31,0.5)">
          生产数量: <b style="color:#0071e3;font-size:15px">{{ bomPlanNum }}</b>，以下为物料需求：
        </div>
        <el-table :data="bomConsumeList" v-loading="bomLoading" border size="small" show-summary :summary-method="bomSummary">
          <el-table-column prop="material_name" label="物料名称" min-width="140" />
          <el-table-column prop="material_sn" label="物料编码" width="110" />
          <el-table-column label="单位用量" width="100" align="center">
            <template #default="{ row }">{{ row.num }} {{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column label="需求数量" width="110" align="center">
            <template #default="{ row }">
              <span style="font-weight:600;color:#0071e3">{{ row._need }}</span>
              <span style="color:rgba(29,29,31,0.35);margin-left:2px">{{ row.unit_name }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库存" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row._stock >= row._need ? 'success' : 'danger'" size="small" effect="plain">
                {{ row._stock }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="缺口" width="90" align="center">
            <template #default="{ row }">
              <span v-if="row._need > row._stock" style="color:#f56c6c;font-weight:600">
                {{ (row._need - row._stock).toFixed(2).replace(/\.?0+$/, '') }}
              </span>
              <span v-else style="color:#16a34a">充足</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { getBomByGoods } from '@/api/goods'
import GoodsSelect from '@/components/GoodsSelect.vue'

const router = useRouter()

// ── 列表 ─────────────────────────────────────────────────────────────────────
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const selection = ref<any[]>([])
const searchForm = reactive<any>({ order_sn: '', status: '' })

const totalSchedule = computed(() => tableData.value.reduce((s, r) => s + Number(r.schedule_num || 0), 0))
const totalPlan = computed(() => tableData.value.reduce((s, r) => s + Number(r.plan_num || 0), 0))
const totalInhouse = computed(() => tableData.value.reduce((s, r) => s + Number(r.inhouse_num || 0), 0))

function calcPct(a: any, b: any) {
  const num = Number(a || 0), den = Number(b || 0)
  if (!den) return 0
  return Math.min(100, Math.round(num / den * 100))
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: pageSize.value }
    if (searchForm.order_sn) params.order_sn = searchForm.order_sn
    if (searchForm.status !== '') params.status = searchForm.status
    const res = await http.get('/production/plan/index', { params })
    tableData.value = res.data?.rows || []
    total.value = res.data?.total || 0
    // 加载每条计划的领料状态
    const ids = tableData.value.map((r: any) => r.id)
    loadMaterialStatus(ids)
  } finally { loading.value = false }
}

function setStatus(v: any) {
  searchForm.status = v
  page.value = 1
  loadData()
}

function resetSearch() {
  searchForm.order_sn = ''
  searchForm.status = ''
  page.value = 1
  loadData()
}

// ── 领料状态 map（plan_id → true 表示有已审核领料单）────────────────────────
const materialMap = ref<Record<number, boolean>>({})

async function loadMaterialStatus(planIds: number[]) {
  if (!planIds.length) return
  try {
    const res = await http.get('/production/material/index', { params: { list_rows: 500 } })
    const rows: any[] = res.data?.rows ?? []
    const map: Record<number, boolean> = {}
    for (const r of rows) {
      const pid = Number(r.production_plan_id || r.plan_id)
      if (pid && r.status === 1) map[pid] = true
    }
    materialMap.value = map
  } catch {}
}

function hasMaterial(row: any): boolean {
  return !!materialMap.value[row.id]
}

function getStepClass(row: any, step: 'material' | 'inhouse') {
  if (step === 'material') {
    return hasMaterial(row) ? 'step-done' : 'step-active'
  }
  // inhouse
  if (row.inhouse_num > 0 || row.status === 2) return 'step-done'
  if (hasMaterial(row)) return 'step-active'
  return 'step-pending'
}

function getMaterialLabel(row: any) {
  return hasMaterial(row) ? '已领料' : '待领料'
}

function getInhouseLabel(row: any) {
  if (row.inhouse_num > 0 || row.status === 2) return '已入库'
  if (hasMaterial(row)) return '待入库'
  return '待入库'
}

// ── 跳转领料/入库 ─────────────────────────────────────────────────────────────
function goPickMaterial(row: any) {
  router.push({ name: 'ProductionMaterial', query: { plan_id: row.id, plan_name: row.order_sn, goods_info: row.goods_info } })
}
function goInhouse(row: any) {
  router.push({ name: 'ProductionInhouse', query: { plan_id: row.id, plan_name: row.order_sn, goods_info: row.goods_info } })
}

async function handleDel(id: number) {
  if (materialMap.value[id]) {
    ElMessageBox.alert(
      '该生产计划已有审核通过的领料单，无法直接删除。<br/>请先前往「<b>生产 → 领料管理</b>」对领料单执行<b>反审核</b>，再删除计划。',
      '无法删除',
      { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '去领料管理' }
    ).then(() => {
      router.push({ name: 'ProductionMaterial' })
    }).catch(() => {})
    return
  }
  await ElMessageBox.confirm('确定删除该生产计划？', '提示', { type: 'warning' })
  await http.post('/production/plan/del', { id })
  ElMessage.success('删除成功')
  loadData()
}

async function handleBatchDel() {
  const blockedIds = selection.value.map(r => r.id).filter(id => materialMap.value[id])
  if (blockedIds.length) {
    ElMessageBox.alert(
      `选中的 ${blockedIds.length} 条计划已有审核通过的领料单，无法删除。<br/>请先前往「<b>生产 → 领料管理</b>」对相关领料单执行<b>反审核</b>，再删除计划。`,
      '无法删除',
      { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: '去领料管理' }
    ).then(() => {
      router.push({ name: 'ProductionMaterial' })
    }).catch(() => {})
    return
  }
  await ElMessageBox.confirm(`确定删除选中的 ${selection.value.length} 条记录？`, '提示', { type: 'warning' })
  await http.post('/production/plan/batchDel', { ids: selection.value.map(r => r.id) })
  ElMessage.success('删除成功')
  loadData()
}

function handleExport() { ElMessage.info('导出功能开发中') }

const itemsVisible = ref(false)
const itemsRow = ref<any>(null)

function parseItems(info: any): any[] {
  try { return JSON.parse(info || '[]') } catch { return [] }
}

// ── 表单 ─────────────────────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

const fd = reactive<any>({
  id: null, order_sn: '', sale_order_id: 0, sale_order_sn: '',
  plan_date: new Date().toISOString().slice(0, 10),
  finish_date: '', priority: '正常', remark: '', items: [],
})

function resetFd() {
  Object.assign(fd, {
    id: null, order_sn: '', sale_order_id: 0, sale_order_sn: '',
    plan_date: new Date().toISOString().slice(0, 10),
    finish_date: '', priority: '正常', remark: '', items: [],
  })
}

function genOrderSn() {
  const d = new Date()
  const ymd = `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}`
  const rand = String(Math.floor(Math.random()*1000)).padStart(3,'0')
  return `SC${ymd}${rand}`
}
function openCreate() { resetFd(); fd.order_sn = genOrderSn(); isView.value = false; showForm.value = true }

function openEdit(row: any) {
  Object.assign(fd, { ...row, items: parseItems(row.goods_info) })
  if (!fd.order_sn) fd.order_sn = `SC${row.id}`
  isView.value = false
  showForm.value = true
}

function openView(row: any) {
  Object.assign(fd, { ...row, items: parseItems(row.goods_info) })
  isView.value = true
  showForm.value = true
}

function backToList() { showForm.value = false; loadData() }

async function handleSave() {
  if (!fd.items.length) { ElMessage.warning('请添加商品'); return }
  saving.value = true
  try {
    const totalNum = fd.items.reduce((s: number, i: any) => s + Number(i.num || 0), 0)
    const payload = {
      ...fd,
      plan_num: totalNum,
      goods_name: fd.items.map((i: any) => i.goods_name).join('、').slice(0, 100),
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) {
      await http.post('/production/plan/edit', payload)
    } else {
      await http.post('/production/plan/add', payload)
    }
    ElMessage.success('保存成功')
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally { saving.value = false }
}

function onKeydown(e: KeyboardEvent) {
  if (showForm.value && !isView.value && (e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault(); handleSave()
  }
}

onMounted(() => {
  loadData()
  window.addEventListener('keydown', onKeydown)
})

// ── 商品選択器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (fd.items.some((i: any) => i.goods_id === g.id)) continue
    fd.items.push({
      goods_id: g.id, goods_name: g.goods_name || g.name, goods_sn: g.goods_sn || '',
      unit_name: g.unit_name || '', attr: g.attr || '', spec: g.spec || '',
      num: 1, actual_num: 0, stock_qty: g.stock_num || 0,
    })
  }
}

// ── 销售单选择器 ──────────────────────────────────────────────────────────────
const salePickerVisible = ref(false)
const saleOrders = ref<any[]>([])
const saleLoading = ref(false)
const currentSaleRow = ref<any>(null)

watch(salePickerVisible, async v => {
  if (!v) return
  saleLoading.value = true
  try {
    const res = await http.get('/shop/ContractOrder/index', { params: { list_rows: 100 } })
    saleOrders.value = res.data?.rows ?? []
  } finally { saleLoading.value = false }
})

function confirmSale() {
  if (!currentSaleRow.value) return
  fd.sale_order_sn = currentSaleRow.value.order_sn
  fd.sale_order_id = currentSaleRow.value.id
  salePickerVisible.value = false
}

// ── BOM 消耗 ──────────────────────────────────────────────────────────────────
const bomVisible = ref(false)
const bomLoading = ref(false)
const bomGoodsName = ref('')
const bomPlanNum = ref(0)
const bomConsumeList = ref<any[]>([])

async function showBomConsume(item: any) {
  bomGoodsName.value = item.goods_name || ''
  bomPlanNum.value = Number(item.num) || 0
  bomConsumeList.value = []
  bomVisible.value = true
  bomLoading.value = true
  try {
    const goodsId = item.goods_id
    // 获取 BOM 物料清单
    const bomRes = await getBomByGoods(goodsId)
    const bomRows: any[] = bomRes.data?.rows ?? []
    // 获取库存
    const stockRes = await http.get('/stock/StockAll/index', { params: { list_rows: 2000 } })
    const stockRows: any[] = stockRes.data?.rows ?? []
    // 按 goods_id 汇总库存
    const stockMap: Record<number, number> = {}
    for (const s of stockRows) {
      const gid = s.goods_id || s.material_id
      if (gid) stockMap[gid] = (stockMap[gid] || 0) + Number(s.qty || 0)
    }
    // 计算消耗
    bomConsumeList.value = bomRows
      .filter(r => r.material_name)
      .map(r => {
        const unitNum = Number(r.num) || 0
        const need = Number((unitNum * bomPlanNum.value).toFixed(4))
        const materialGoodsId = r.material_id || r.goods_id
        const stock = stockMap[materialGoodsId] || 0
        return { ...r, _need: need, _stock: stock }
      })
  } catch (e: any) {
    ElMessage.error('获取BOM数据失败')
  } finally {
    bomLoading.value = false
  }
}

function bomSummary({ columns, data }: any) {
  return columns.map((_: any, idx: number) => {
    if (idx === 0) return '合计'
    if (idx === 3) return data.reduce((s: number, r: any) => s + (r._need || 0), 0).toFixed(2).replace(/\.?0+$/, '')
    return ''
  })
}

// ── 详情页 BOM 物料汇总 ───────────────────────────────────────────────────────
const planBomList = ref<any[]>([])
const planBomLoading = ref(false)

async function loadPlanBom() {
  if (!fd.items.length) return
  planBomLoading.value = true
  try {
    const stockRes = await http.get('/stock/StockAll/index', { params: { list_rows: 2000 } })
    const stockRows: any[] = stockRes.data?.rows ?? []
    const stockMap: Record<number, number> = {}
    for (const s of stockRows) {
      const gid = s.goods_id
      if (gid) stockMap[gid] = (stockMap[gid] || 0) + Number(s.stock_num || s.qty || 0)
    }
    // 读取本地存储的规格
    let bomSpecsLocal: Record<number, string> = {}
    try { bomSpecsLocal = JSON.parse(localStorage.getItem('erp_bom_specs') || '{}') } catch { /* ignore */ }
    const result: any[] = []
    for (const item of fd.items) {
      const bomRes = await getBomByGoods(item.goods_id)
      const bomRows: any[] = bomRes.data?.rows ?? []
      for (const r of bomRows) {
        if (!r.material_name) continue
        const matGoodsId = r.material_id || r.goods_id
        const need = Number((Number(r.num) * Number(item.num || 0)).toFixed(4))
        result.push({ ...r, goods_name: item.goods_name, _need: need, _stock: stockMap[matGoodsId] || 0, _spec: bomSpecsLocal[r.id] || '' })
      }
    }
    planBomList.value = result
  } finally {
    planBomLoading.value = false
  }
}

watch(() => fd.items, (v) => { if (v.length) loadPlanBom() }, { deep: true })
</script>

<style scoped>
.plan-page { height: 100%; }

.status-bar {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.status-bar-right { display: flex; gap: 8px; align-items: center; }

.toolbar { display: flex; gap: 8px; align-items: center; }

.summary-bar {
  margin-top: 8px; padding: 8px 12px;
  background: #f8fafc; border-radius: 8px;
  font-size: 13px; color: rgba(29,29,31,0.5);
}
.summary-bar b { color: #0071e3; }

.form-page { display: flex; flex-direction: column; gap: 12px; }
.form-topbar {
  display: flex; justify-content: space-between; align-items: center;
  background: #fff; padding: 12px 16px; border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,.06);
}
.form-title { font-size: 16px; font-weight: 600; color: #1d1d1f; }

.goods-section { margin-top: 8px; }
.goods-header {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px;
}
.goods-title { font-size: 13px; font-weight: 600; color: #1d1d1f; }

/* 流程步骤 */
.flow-steps {
  display: flex; align-items: center; justify-content: center; gap: 4px;
}
.flow-step {
  display: flex; align-items: center; gap: 4px;
}
.step-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.step-label { font-size: 12px; white-space: nowrap; }
.flow-arrow { font-size: 11px; color: #c0c4cc; }

/* 待处理（灰） */
.step-pending .step-dot { background: #e5e7eb; }
.step-pending .step-label { color: #c0c4cc; }

/* 当前激活（蓝/橙） */
.step-active .step-dot { background: #f59e0b; }
.step-active .step-label { color: #f59e0b; font-weight: 600; }

/* 已完成（绿） */
.step-done .step-dot { background: #16a34a; }
.step-done .step-label { color: #16a34a; font-weight: 600; }
</style>
