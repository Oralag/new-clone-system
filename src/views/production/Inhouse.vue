<template>
  <div class="inhouse-page">

    <!-- ── 列表视图 ─────────────────────────────────────────────────────── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getProductionInhouseList"
            del-path="/production/inhouse/batchDel"
            export-file-name="生产入库" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_sn" placeholder="入库单号" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width:160px" />
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增生产入库</el-button>
          </template>
          <el-table-column prop="order_sn" label="入库单号" min-width="150" />
          <el-table-column prop="goods_name" label="商品名称" min-width="150" />
          <el-table-column prop="num" label="入库数量" width="100" align="right" />
          <el-table-column prop="unit_name" label="单位" width="70" align="center" />
          <el-table-column prop="warehouse_name" label="入库仓库" min-width="110" />
          <el-table-column prop="in_date" label="入库日期" width="110">
            <template #default="{ row }">{{ (row.in_date || row.created_at || '').slice(0,10) }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleAudit(row, 2)">驳回</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="handleAudit(row, 0)">反审核</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑/查看表单 ─────────────────────────────────────────── -->
    <div v-else class="form-page">
      <!-- 顶部操作栏 -->
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView ? '查看生产入库' : fd.id ? '编辑生产入库' : '新增生产入库' }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">已驳回</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">保存（Ctrl+S）</el-button>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <!-- 生产计划单 -->
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label required">生产计划单</span>
                <el-input v-model="fd.plan_name" placeholder="请选择生产计划单" readonly style="flex:1" />
                <el-button v-if="!isView" type="primary" @click="openPlanPicker">选择生产计划单</el-button>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">入库单号</span>
                <el-input v-model="fd.order_sn" placeholder="入库单号（不填写自动生成）" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">入库日期</span>
                <el-date-picker v-model="fd.in_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">入库仓库</span>
                <el-select v-model="fd.warehouse_id" placeholder="请选择仓库" style="flex:1"
                  :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="field-row">
                <span class="field-label">倒冲领料</span>
                <el-switch v-model="fd.back_flush" :disabled="isView" />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品清单 -->
        <div class="goods-section">
          <div class="goods-header">
            <span>商品清单</span>
            <span class="goods-summary">
              成本合计：<b>{{ totalCost.toFixed(2) }}</b>
              &nbsp;&nbsp;入库总价：<b>{{ totalInPrice.toFixed(2) }}</b>
            </span>
          </div>
          <el-table :data="fd.items" border size="small" style="width:100%" empty-text="请先选择生产计划单">
            <el-table-column type="index" width="45" align="center" />
            <el-table-column prop="goods_sn" label="商品编码" width="120" />
            <el-table-column prop="goods_name" label="商品名称" min-width="140" />
            <el-table-column prop="spec" label="规格型号" width="110" />
            <el-table-column prop="unit_name" label="单位" width="65" align="center" />
            <el-table-column prop="plan_num" label="生产数量" width="90" align="right" />
            <el-table-column label="可入库数量" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: (row.plan_num - row.already_in) > 0 ? '#16a34a' : '#dc2626' }">
                  {{ Math.max(0, (row.plan_num || 0) - (row.already_in || 0)).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="本次入库数量" width="130" align="right">
              <template #header>
                本次入库数量
                <el-button link type="primary" size="small" @click="batchSetNum">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column label="物料单价" width="120" align="right">
              <template #header>
                物料单价
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('material_price')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.material_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.material_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="物料合计" width="110" align="right">
              <template #header>
                物料合计
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('material_total')">批量</el-button>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num || 0) * (row.material_price || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="加工单价" width="120" align="right">
              <template #header>
                加工单价
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('process_price')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.process_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.process_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="加工合计" width="110" align="right">
              <template #header>
                加工合计
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('process_total')">批量</el-button>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num || 0) * (row.process_price || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="总成本" width="110" align="right">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ row.total_cost?.toFixed(2) ?? '0.00' }}</b>
              </template>
            </el-table-column>
            <el-table-column label="入库单价" width="120" align="right">
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.in_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.in_price }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 备注 -->
        <div class="remark-section">
          <el-row :gutter="16">
            <el-col :span="16">
              <div class="field-row">
                <span class="field-label">备注</span>
                <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 生产计划选择弹框 -->
    <el-dialog v-model="planPickerVisible" title="选择生产计划单" width="800px" append-to-body>
      <el-table :data="planList" border size="small" height="400"
        @row-click="onSelectPlan" style="cursor:pointer">
        <el-table-column prop="order_sn" label="计划单号" width="150" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="schedule_num" label="排产数量" width="100" align="right" />
        <el-table-column prop="actual_num" label="已生产" width="100" align="right" />
        <el-table-column prop="finish_date" label="完工日期" width="110">
          <template #default="{ row }">{{ (row.finish_date || '').slice(0,10) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? '已审核' : '待审核' }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 批量设置弹框 -->
    <el-dialog v-model="batchVisible" :title="`批量设置 ${batchLabel}`" width="320px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBatch">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getProductionInhouseList, createProductionInhouse, updateProductionInhouse, deleteProductionInhouse, auditProductionInhouse } from '@/api/production'
import { getProductionPlanList } from '@/api/production'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'

const permStore = usePermissionStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({})

// ── 视图状态 ─────────────────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

// ── 表单数据 ─────────────────────────────────────────────────────────────────
function defaultFd() {
  return {
    id: 0,
    order_sn: '',
    plan_id: 0,
    plan_name: '',
    in_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
    warehouse_id: null as any,
    warehouse_name: '',
    back_flush: false,
    remark: '',
    status: 0,
    items: [] as any[],
  }
}
const fd = reactive(defaultFd())

// ── 仓库选项 ─────────────────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  try {
    const res = await getWarehouseList({ list_rows: 100 })
    warehouseOptions.value = res.data?.rows ?? []
  } catch {}
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
}

// ── 计算 ─────────────────────────────────────────────────────────────────────
function calcRow(row: any) {
  row.total_cost = ((row.num || 0) * ((row.material_price || 0) + (row.process_price || 0)))
}

const totalCost = computed(() =>
  fd.items.reduce((s, r) => s + (r.total_cost || 0), 0)
)
const totalInPrice = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.in_price || 0), 0)
)

// ── 打开表单 ─────────────────────────────────────────────────────────────────
async function openAdd() {
  Object.assign(fd, defaultFd())
  fd.items = []
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}

function openEdit(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(r => calcRow(r))
  isView.value = false
  showForm.value = true
  loadWarehouses()
}

function openView(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(r => calcRow(r))
  isView.value = true
  showForm.value = true
  loadWarehouses()
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

// ── 生产计划选择器 ────────────────────────────────────────────────────────────
const planPickerVisible = ref(false)
const planList = ref<any[]>([])

async function openPlanPicker() {
  try {
    const res = await getProductionPlanList({ list_rows: 200, status: 1 })
    planList.value = res.data?.rows ?? []
  } catch {}
  planPickerVisible.value = true
}

async function onSelectPlan(plan: any) {
  fd.plan_id = plan.id
  fd.plan_name = `${plan.order_sn} - ${plan.goods_name}`
  planPickerVisible.value = false

  // 加载该计划的商品（从 goods_info 解析）
  try {
    let items: any[] = []
    try { items = JSON.parse(plan.goods_info || '[]') } catch {}
    if (!items.length && plan.goods_id) {
      // 单品计划
      items = [{
        goods_id: plan.goods_id,
        goods_name: plan.goods_name,
        goods_sn: plan.goods_sn || '',
        unit_name: plan.unit_name || '',
        spec: '',
        plan_num: plan.schedule_num || plan.plan_num || 0,
        already_in: plan.inhouse_num || 0,
        num: Math.max(0, (plan.schedule_num || plan.plan_num || 0) - (plan.inhouse_num || 0)),
        material_price: 0,
        process_price: 0,
        in_price: 0,
        total_cost: 0,
      }]
    } else {
      items = items.map(i => ({
        ...i,
        plan_num: i.plan_num || i.num || 0,
        already_in: i.already_in || 0,
        num: i.num || 0,
        material_price: i.material_price || 0,
        process_price: i.process_price || 0,
        in_price: i.in_price || 0,
        total_cost: 0,
      }))
    }
    items.forEach(r => calcRow(r))
    fd.items = items
  } catch {}
}

// ── 批量设置 ─────────────────────────────────────────────────────────────────
const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)

function batchSetNum() {
  batchField.value = 'num'
  batchLabel.value = '本次入库数量'
  batchValue.value = 0
  batchVisible.value = true
}

function batchSetField(field: string) {
  const labels: Record<string, string> = {
    material_price: '物料单价',
    material_total: '物料合计（按数量平摊）',
    process_price: '加工单价',
    process_total: '加工合计（按数量平摊）',
  }
  batchField.value = field
  batchLabel.value = labels[field] || field
  batchValue.value = 0
  batchVisible.value = true
}

function applyBatch() {
  const field = batchField.value
  const val = batchValue.value
  for (const row of fd.items) {
    if (field === 'material_total') {
      row.material_price = row.num > 0 ? val / row.num : 0
    } else if (field === 'process_total') {
      row.process_price = row.num > 0 ? val / row.num : 0
    } else {
      row[field] = val
    }
    calcRow(row)
  }
  batchVisible.value = false
}

// ── 保存 ─────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!fd.plan_id && !fd.items.length) {
    ElMessage.warning('请选择生产计划单')
    return
  }
  saving.value = true
  try {
    const payload: any = {
      plan_id: fd.plan_id,
      order_sn: fd.order_sn || undefined,
      in_date: fd.in_date,
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      back_flush: fd.back_flush ? 1 : 0,
      remark: fd.remark,
      items: fd.items,
    }
    if (fd.id) {
      payload.id = fd.id
      await updateProductionInhouse(payload)
    } else {
      await createProductionInhouse(payload)
    }
    ElMessage.success('保存成功')
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

// ── 审核/删除 ────────────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const action = status === 1 ? '审核通过' : status === 2 ? '驳回' : '反审核'
  await ElMessageBox.confirm(`确定${action}该生产入库单？`, '提示', { type: 'warning' })
  try {
    await auditProductionInhouse(row.id, status)
    ElMessage.success(`${action}成功`)
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该生产入库记录？', '提示', { type: 'warning' })
  await deleteProductionInhouse(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}
</script>

<style scoped>
.inhouse-page { height: 100%; }

/* 表单页 */
.form-page { display: flex; flex-direction: column; height: 100%; background: #f5f6fa; }
.form-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 20px; background: #fff; border-bottom: 1px solid rgba(0,0,0,0.06);
}
.form-topbar-left { display: flex; align-items: center; gap: 10px; }
.form-title { font-size: 15px; font-weight: 600; color: #1d1d1f; }

.form-body { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
.form-section { background: #fff; border-radius: 12px; padding: 16px 20px; }

/* 字段行 */
.field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 12px; }
.field-label { font-size: 13px; color: rgba(29,29,31,0.5); white-space: nowrap; width: 70px; flex-shrink: 0; }
.field-label.required::before { content: '* '; color: #dc2626; }

/* 商品清单 */
.goods-section { background: #fff; border-radius: 12px; padding: 16px 20px; }
.goods-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 12px; font-size: 13px; font-weight: 600; color: #1d1d1f;
}
.goods-summary { font-size: 13px; color: rgba(29,29,31,0.5); font-weight: normal; }
.goods-summary b { color: #0071e3; }

.remark-section { background: #fff; border-radius: 12px; padding: 16px 20px; }
</style>
