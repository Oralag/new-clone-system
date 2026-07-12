<template>
  <div class="inhouse-page">

    <!-- ── 列表视图 ─────────────────────────────────────────────────────── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
            del-path="/production/inhouse/batchDel"
            :export-file-name="$t('production.inhouse.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_sn" :placeholder="$t('production.inhouse.searchOrderSn')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('production.inhouse.searchGoodsName')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('production.inhouse.searchReconcileStatus')">
              <el-option :label="$t('production.inhouse.searchUnreconciled')" value="unreconciled" />
            </el-select>
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('production.inhouse.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('production.inhouse.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('production.inhouse.btnAdd') }}</el-button>
          </template>
          <el-table-column type="expand" width="36">
            <template #default="{ row }">
              <div class="expand-cost" :ref="(el: any) => el && triggerExpand(row)">
                <div v-if="!expandState[row.id] || expandState[row.id]?.loading" style="padding:16px 20px;color:#aaa;font-size:13px">{{ $t('production.inhouse.expandLoadingCost') }}</div>
                <template v-else-if="expandState[row.id]?.loaded">
                  <el-table :data="expandState[row.id].items" border size="small" style="margin:8px 16px;width:calc(100% - 32px)">
                    <el-table-column prop="goods_name" :label="$t('production.inhouse.expandColGoodsName')" min-width="140" />
                    <el-table-column prop="num" :label="$t('production.inhouse.expandColInQty')" width="90" align="right" />
                    <el-table-column :label="$t('production.inhouse.expandColMaterialPrice')" width="110" align="right">
                      <template #default="{ row: r }">¥{{ fmtN(r.material_price) }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('production.inhouse.expandColProcessPrice')" width="110" align="right">
                      <template #default="{ row: r }">¥{{ fmtN(r.process_price) }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('production.inhouse.expandColInPrice')" width="110" align="right">
                      <template #default="{ row: r }"><b style="color:#0071e3">¥{{ fmtN(r.in_price) }}</b></template>
                    </el-table-column>
                    <el-table-column :label="$t('production.inhouse.expandColTotalCost')" width="120" align="right">
                      <template #default="{ row: r }"><b style="color:#16a34a">¥{{ fmtN(Number(r.num||0)*Number(r.in_price||0)) }}</b></template>
                    </el-table-column>
                  </el-table>
                  <div class="expand-total">
                    {{ $t('production.inhouse.expandMaterialCost') }}<b style="color:#f59e0b">¥{{ fmtN(expandState[row.id].materialCost) }}</b>
                    &nbsp;&nbsp;{{ $t('production.inhouse.expandTotalCost') }}<b style="color:#16a34a">¥{{ fmtN(expandState[row.id].totalCost) }}</b>
                    &nbsp;&nbsp;{{ $t('production.inhouse.expandAvgPrice') }}<b style="color:#0071e3">¥{{ fmtN(expandState[row.id].avgPrice) }}</b>
                  </div>
                </template>
                <div v-else style="padding:16px 20px;color:#aaa;font-size:13px">{{ $t('production.inhouse.expandLoadFailed') }}</div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="order_sn" :label="$t('production.inhouse.colOrderSn')" min-width="150" />
          <el-table-column prop="goods_name" :label="$t('production.inhouse.colGoodsName')" min-width="150" />
          <el-table-column prop="inhouse_qty" :label="$t('production.inhouse.colInQty')" width="100" align="right" />
          <el-table-column prop="unit_name" :label="$t('production.inhouse.colUnit')" width="70" align="center" />
          <el-table-column :label="$t('production.inhouse.colInCost')" width="120" align="right">
            <template #default="{ row }">
              <b style="color:#16a34a">¥{{ fmtN(calcTotalCost(row)) }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="warehouse_name" :label="$t('production.inhouse.colWarehouse')" min-width="110" />
          <el-table-column prop="inhouse_date" :label="$t('production.inhouse.colDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.inhouse_date || row.create_time) }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.inhouse.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('production.inhouse.statusAudited') : row.status === 2 ? $t('production.inhouse.statusRejected') : $t('production.inhouse.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.inhouse.colActions')" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('production.inhouse.actionView') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">{{ $t('production.inhouse.actionEdit') }}</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">{{ $t('production.inhouse.actionAudit') }}</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleAudit(row, 2)">{{ $t('production.inhouse.actionReject') }}</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="handleAudit(row, 0)">{{ $t('production.inhouse.actionUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('production.inhouse.actionReconciled') : $t('production.inhouse.actionReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('production.inhouse.actionDeleteDisabledTip') : ''" @click="handleDelete(row.id)">{{ $t('production.inhouse.actionDelete') }}</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('production.inhouse.formBtnBack') }}</el-button>
          <span class="form-title">{{ isView ? $t('production.inhouse.formTitleView') : fd.id ? $t('production.inhouse.formTitleEdit') : $t('production.inhouse.formTitleAdd') }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">{{ $t('production.inhouse.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">{{ $t('production.inhouse.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button :loading="saving && !savingAndAuditing" @click="handleSave(false)">{{ $t('production.inhouse.formBtnSave') }}</el-button>
          <el-button type="primary" :loading="savingAndAuditing" @click="handleSave(true)">{{ $t('production.inhouse.formBtnSaveAndAudit') }}</el-button>
        </div>
      </div>

      <!-- 基本信息 -->
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <!-- 生产计划单 -->
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label required">{{ $t('production.inhouse.fieldPlanOrder') }}</span>
                <el-input v-model="fd.plan_name" :placeholder="$t('production.inhouse.fieldPlanOrderPlaceholder')" readonly style="flex:1" />
                <el-button v-if="!isView" type="primary" @click="openPlanPicker">{{ $t('production.inhouse.fieldPlanOrderBtn') }}</el-button>
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">{{ $t('production.inhouse.fieldOrderSn') }}</span>
                <el-input v-model="fd.order_sn" :placeholder="$t('production.inhouse.fieldOrderSnPlaceholder')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">{{ $t('production.inhouse.fieldInDate') }}</span>
                <el-date-picker v-model="fd.in_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="8">
              <div class="field-row">
                <span class="field-label">{{ $t('production.inhouse.fieldWarehouse') }}</span>
                <el-select v-model="fd.warehouse_id" :placeholder="$t('production.inhouse.fieldWarehousePlaceholder')" style="flex:1"
                  :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="4">
              <div class="field-row">
                <span class="field-label">{{ $t('production.inhouse.fieldBackFlush') }}</span>
                <span v-if="isView || fd.status === 1" style="flex:1;color:#666">{{ fd.back_flush ? $t('production.inhouse.fieldBackFlushOn') : $t('production.inhouse.fieldBackFlushOff') }}</span>
                <el-tooltip v-else
                  :content="hasMaterial ? $t('production.inhouse.fieldBackFlushDisabledTip') : ''"
                  :disabled="!hasMaterial"
                  placement="top">
                  <el-switch v-model="fd.back_flush" :disabled="hasMaterial" />
                </el-tooltip>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品清单 -->
        <div class="goods-section">
          <div class="goods-header">
            <span>{{ $t('production.inhouse.goodsSectionTitle') }}</span>
            <span class="goods-summary">
              {{ $t('production.inhouse.goodsSummaryCost') }}<b>{{ totalCost.toFixed(2) }}</b>
              &nbsp;&nbsp;{{ $t('production.inhouse.goodsSummaryInPrice') }}<b>{{ totalInPrice.toFixed(2) }}</b>
            </span>
          </div>
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('production.inhouse.goodsEmptyText')">
            <el-table-column type="index" width="45" align="center" />
            <el-table-column prop="goods_sn" :label="$t('production.inhouse.colGoodsSn')" width="120" />
            <el-table-column prop="goods_name" :label="$t('production.inhouse.colGoodsName')" min-width="140" />
            <el-table-column prop="spec" :label="$t('production.inhouse.colSpec')" width="110" />
            <el-table-column prop="unit_name" :label="$t('production.inhouse.colUnit')" width="65" align="center" />
            <el-table-column prop="plan_num" :label="$t('production.inhouse.colPlanNum')" width="90" align="right" />
            <el-table-column :label="$t('production.inhouse.colAvailableIn')" width="100" align="right">
              <template #default="{ row }">
                <span :style="{ color: (row.plan_num - row.already_in) > 0 ? '#16a34a' : '#dc2626' }">
                  {{ Math.max(0, (row.plan_num || 0) - (row.already_in || 0)).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colThisInQty')" width="130" align="right">
              <template #header>
                {{ $t('production.inhouse.colThisInQty') }}
                <el-button link type="primary" size="small" @click="batchSetNum">{{ $t('production.inhouse.btnBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colMaterialPrice')" width="120" align="right">
              <template #header>
                {{ $t('production.inhouse.colMaterialPrice') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('material_price')">{{ $t('production.inhouse.btnBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.material_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.material_price }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colMaterialTotal')" width="110" align="right">
              <template #header>
                {{ $t('production.inhouse.colMaterialTotal') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('material_total')">{{ $t('production.inhouse.btnBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num || 0) * (row.material_price || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colProcessPrice')" width="120" align="right">
              <template #header>
                {{ $t('production.inhouse.colProcessPrice') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('process_price')">{{ $t('production.inhouse.btnBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.process_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.process_price }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colProcessTotal')" width="110" align="right">
              <template #header>
                {{ $t('production.inhouse.colProcessTotal') }}
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSetField('process_total')">{{ $t('production.inhouse.btnBatch') }}</el-button>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num || 0) * (row.process_price || 0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colTotalCost')" width="110" align="right">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ row.total_cost?.toFixed(2) ?? '0.00' }}</b>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.inhouse.colInPrice')" width="120" align="right">
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
                <span class="field-label">{{ $t('production.inhouse.fieldRemark') }}</span>
                <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
              </div>
            </el-col>
          </el-row>
        </div>
      </div>
    </div>

    <!-- 生产计划选择弹框 -->
    <el-dialog v-model="planPickerVisible" :title="$t('production.inhouse.planPickerTitle')" width="800px" append-to-body>
      <el-table :data="planList" border size="small" height="400"
        @row-click="onSelectPlan" style="cursor:pointer">
        <el-table-column :label="$t('production.inhouse.planPickerColSn')" width="150">
          <template #default="{ row }">{{ row.order_sn || `SC${(row.plan_date||row.created_at||'').slice(0,10).replace(/-/g,'')}${String(row.id).padStart(3,'0')}` }}</template>
        </el-table-column>
        <el-table-column prop="goods_name" :label="$t('production.inhouse.planPickerColGoodsName')" min-width="150" />
        <el-table-column prop="schedule_num" :label="$t('production.inhouse.planPickerColScheduleNum')" width="100" align="right" />
        <el-table-column prop="actual_num" :label="$t('production.inhouse.planPickerColActualNum')" width="100" align="right" />
        <el-table-column prop="finish_date" :label="$t('production.inhouse.planPickerColFinishDate')" width="110">
          <template #default="{ row }">{{ fmtDt(row.finish_date) }}</template>
        </el-table-column>
        <el-table-column :label="$t('production.inhouse.planPickerColStatus')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">
              {{ row.status === 1 ? $t('production.inhouse.statusAudited') : $t('production.inhouse.statusPending') }}
            </el-tag>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <!-- 批量设置弹框 -->
    <el-dialog v-model="batchVisible" :title="$t('production.inhouse.batchSetTitle', { label: batchLabel })" width="320px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">{{ $t('production.inhouse.batchSetCancel') }}</el-button>
        <el-button type="primary" @click="applyBatch">{{ $t('production.inhouse.batchSetConfirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import { getProductionInhouseList, createProductionInhouse, updateProductionInhouse, deleteProductionInhouse, auditProductionInhouse } from '@/api/production'
import { getProductionPlanList } from '@/api/production'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { createMaterial, auditMaterial } from '@/api/production'
import { getBomByGoods } from '@/api/goods'
import { applyMaterialStockDelta } from '@/utils/materialStock'
import {
  buildProductionInhouseRemark,
  cleanProductionInhouseRemark,
  generateProductionInhouseOrderSn,
  normalizeProductionInhouseItems,
  parseProductionInhouseMeta,
  syncProductionLaborExpense,
} from '@/utils/productionInhouse'

const { t, locale } = useI18n()
const route = useRoute()
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_production_inhouse', tableRef)
const reconcileFilteredApi = createFilteredApi(getProductionInhouseList, 'reconcile_filter')
const searchForm = reactive<any>({ reconcile_filter: '' })

// ── 视图状态 ─────────────────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)
const savingAndAuditing = ref(false)
const hasMaterial = ref(false) // 该计划是否已有手工领料单

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
    admin_name: '',
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
  row.in_price = (row.material_price || 0) + (row.process_price || 0)
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

function buildItemsFromRow(row: any) {
  const meta = parseProductionInhouseMeta(row?.remark)
  if (row.goods_info) {
    try { return JSON.parse(row.goods_info) } catch {}
  }
  if (row.goods_id || row.goods_name) {
    return [{
      goods_id: row.goods_id || 0,
      goods_name: row.goods_name || '',
      goods_sn: row.goods_sn || meta.goods_sn || '',
      unit_name: row.unit_name || meta.unit_name || '',
      spec: row.spec || meta.spec || '',
      plan_num: Number(row.inhouse_qty || 0),
      already_in: 0,
      num: Number(row.inhouse_qty || 0),
      material_price: Number(meta.material_price || 0),
      process_price: Number(meta.process_price || 0),
      in_price: Number(row.in_price || meta.in_price || 0),
      total_cost: 0,
    }]
  }
  return []
}

function openEdit(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row, remark: cleanProductionInhouseRemark(row?.remark) })
  fd.items = buildItemsFromRow(row)
  fd.items.forEach(r => calcRow(r))
  isView.value = false
  showForm.value = true
  loadWarehouses()
  const planSn = row.plan_name ? row.plan_name.split(' - ')[0] : ''
  checkHasMaterial(Number(row.plan_id || 0), planSn)
}

function openView(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row, remark: cleanProductionInhouseRemark(row?.remark) })
  fd.items = buildItemsFromRow(row)
  fd.items.forEach(r => calcRow(r))
  isView.value = true
  showForm.value = true
  loadWarehouses()
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

function buildAuditStockItems(row: any) {
  const meta = parseProductionInhouseMeta(row?.remark)
  const fallbackItem = {
    goods_id: row.goods_id || 0,
    goods_name: row.goods_name || '',
    goods_sn: row.goods_sn || meta.goods_sn || '',
    num: Number(row.inhouse_qty || 0),
    unit_name: row.unit_name || meta.unit_name || '',
    avg_price: Number(row.in_price || row.avg_price || meta.in_price || 0),
    warehouse_id: row.warehouse_id || 0,
    warehouse_name: row.warehouse_name || '',
  }

  const items = (() => {
    if (!row?.goods_info) return [fallbackItem]
    try {
      const parsed = JSON.parse(row.goods_info || '[]')
      return Array.isArray(parsed) && parsed.length ? parsed : [fallbackItem]
    } catch {
      return [fallbackItem]
    }
  })()

  return items
    .map((item: any) => ({
      goods_id: item.goods_id || row.goods_id || 0,
      goods_name: item.goods_name || row.goods_name || '',
      goods_sn: item.goods_sn || row.goods_sn || meta.goods_sn || '',
      num: Number(item.num ?? item.inhouse_qty ?? row.inhouse_qty ?? 0),
      unit_name: item.unit_name || row.unit_name || meta.unit_name || '',
      avg_price: Number(item.in_price ?? item.avg_price ?? row.in_price ?? row.avg_price ?? meta.in_price ?? 0),
      warehouse_id: item.warehouse_id || row.warehouse_id || 0,
      warehouse_name: item.warehouse_name || row.warehouse_name || '',
    }))
    .filter((item: any) => (item.goods_id || item.goods_sn || item.goods_name) && item.num > 0)
}

async function syncAuditAndStock(row: any, status: 0 | 1) {
  await auditProductionInhouse(row.id, status)

  const items = buildAuditStockItems(row)
  if (!items.length) return { changedCount: 0 }

  try {
    return await applyMaterialStockDelta(items, {
      direction: status === 1 ? 'restore' : 'deduct',
      defaultWarehouseId: row.warehouse_id,
      defaultWarehouseName: row.warehouse_name || '',
    })
  } catch (error) {
    try {
      await auditProductionInhouse(row.id, status === 1 ? 0 : 1)
    } catch {}
    throw error
  }
}

function getResponseId(res: any, fallbackId = 0) {
  return Number(res?.data?.id || res?.data?.data?.id || res?.data || fallbackId || 0)
}

async function autoAuditSavedRows(rows: any[]) {
  const auditedRows: any[] = []

  try {
    for (const row of rows) {
      await syncAuditAndStock(row, 1)
      auditedRows.push(row)
    }
    return { changedCount: auditedRows.length }
  } catch (error) {
    for (const row of [...auditedRows].reverse()) {
      try {
        await syncAuditAndStock(row, 0)
      } catch {}
    }
    throw error
  }
}

// ── 检查计划是否已有手工领料单 ────────────────────────────────────────────────
async function checkHasMaterial(planId: number, planSn: string) {
  hasMaterial.value = false
  if (!planId) return
  try {
    const mRes = await http.get('/production/material/index', {
      params: { list_rows: 500, production_plan_id: planId }
    })
    const mRows: any[] = mRes.data?.rows ?? []
    for (const mr of mRows) {
      const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
      const snMatch = planSn && (mr.order_sn || '').includes(planSn)
      if ((mrPlanId === planId || snMatch) && Number(mr.status) === 1) {
        hasMaterial.value = true
        return
      }
    }
  } catch {}
}

// ── 生产计划选择器 ────────────────────────────────────────────────────────────
const planPickerVisible = ref(false)
const planList = ref<any[]>([])

async function openPlanPicker() {
  try {
    const [res, inhouseRes] = await Promise.all([
      getProductionPlanList({ list_rows: 200, status: 1 }),
      getProductionInhouseList({ list_rows: 1000 }),
    ])
    const rows = res.data?.rows ?? []
    const inhouseRows: any[] = inhouseRes.data?.rows ?? []
    const inhouseMap = new Map<number, number>()
    for (const row of inhouseRows) {
      if (Number(row.status) !== 1) continue
      const planId = Number(row.plan_id || 0)
      if (!planId) continue
      inhouseMap.set(planId, (inhouseMap.get(planId) || 0) + Number(row.inhouse_qty || 0))
    }
    planList.value = rows.map((row: any) => ({
      ...row,
      inhouse_num: Number(inhouseMap.get(Number(row.id || 0)) ?? row.inhouse_num ?? 0),
    }))
  } catch {}
  planPickerVisible.value = true
}

async function onSelectPlan(plan: any) {
  fd.plan_id = plan.id
  const planSn = plan.order_sn || `SC${(plan.plan_date||plan.created_at||'').slice(0,10).replace(/-/g,'')}${String(plan.id).padStart(3,'0')}`
  fd.plan_name = `${planSn} - ${plan.goods_name}`
  planPickerVisible.value = false

  // 查该计划已审核的领料单，汇总物料总价，同时设置 hasMaterial
  let materialTotalPrice = 0
  let materialTotalNum = 0
  hasMaterial.value = false
  try {
    const mRes = await http.get('/production/material/index', {
      params: { list_rows: 500, production_plan_id: plan.id }
    })
    const mRows: any[] = mRes.data?.rows ?? []
    const pid = Number(plan.id)
    for (const mr of mRows) {
      const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
      const snMatch = planSn && (mr.order_sn || '').includes(planSn)
      if ((mrPlanId === pid || snMatch) && Number(mr.status) === 1) {
        hasMaterial.value = true
        materialTotalPrice += Number(mr.total_price || 0)
        try {
          const items: any[] = JSON.parse(mr.goods_info || '[]')
          materialTotalNum += items.reduce((s, i) => s + Number(i.num || 0), 0)
        } catch {}
      }
    }
    // 如果按 plan_id 过滤后没有结果，再全量扫描一次（兼容后端不支持过滤的情况）
    if (!hasMaterial.value && mRows.length === 0) {
      const mRes2 = await http.get('/production/material/index', { params: { list_rows: 1000 } })
      const mRows2: any[] = mRes2.data?.rows ?? []
      for (const mr of mRows2) {
        const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
        const snMatch = planSn && (mr.order_sn || '').includes(planSn)
        if ((mrPlanId === pid || snMatch) && Number(mr.status) === 1) {
          hasMaterial.value = true
          materialTotalPrice += Number(mr.total_price || 0)
          try {
            const items: any[] = JSON.parse(mr.goods_info || '[]')
            materialTotalNum += items.reduce((s, i) => s + Number(i.num || 0), 0)
          } catch {}
        }
      }
    }
  } catch {}

  // 加载该计划的商品（从 goods_info 解析）
  try {
    const actualInhouseNum = Number(plan.inhouse_num || 0)
    let items: any[] = []
    try { items = JSON.parse(plan.goods_info || '[]') } catch {}
    if (!items.length && plan.goods_id) {
      items = [{
        goods_id: plan.goods_id,
        goods_name: plan.goods_name,
        goods_sn: plan.goods_sn || '',
        unit_name: plan.unit_name || '',
        spec: '',
        plan_num: plan.schedule_num || plan.plan_num || 0,
        already_in: actualInhouseNum,
        num: Math.max(0, (plan.schedule_num || plan.plan_num || 0) - actualInhouseNum),
        material_price: 0,
        process_price: 0,
        in_price: 0,
        total_cost: 0,
      }]
    } else {
      items = items.map((i, index) => ({
        ...i,
        plan_num: i.plan_num || i.num || 0,
        already_in: i.already_in || (items.length === 1 && index === 0 ? actualInhouseNum : 0),
        num: i.num || 0,
        material_price: i.material_price || 0,
        process_price: i.process_price || 0,
        in_price: i.in_price || 0,
        total_cost: 0,
      }))
    }

    // 自动填入物料单价：领料总价 ÷ 计划总数量
    const planTotalNum = items.reduce((s, i) => s + Number(i.num || 0), 0)
    if (materialTotalPrice > 0 && planTotalNum > 0) {
      const unitMaterialPrice = materialTotalPrice / planTotalNum
      items.forEach(item => {
        item.material_price = Number(unitMaterialPrice.toFixed(4))
      })
      ElMessage.success(t('production.inhouse.msgAutoMaterialCost', { amount: materialTotalPrice.toFixed(2) }))
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
  batchLabel.value = t('production.inhouse.batchLabelNum')
  batchValue.value = 0
  batchVisible.value = true
}

function batchSetField(field: string) {
  const labels: Record<string, string> = {
    material_price: t('production.inhouse.batchLabelMaterialPrice'),
    material_total: t('production.inhouse.batchLabelMaterialTotal'),
    process_price: t('production.inhouse.batchLabelProcessPrice'),
    process_total: t('production.inhouse.batchLabelProcessTotal'),
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
async function handleSave(andAudit = false) {
  if (!fd.plan_id) {
    ElMessage.warning(t('production.inhouse.msgSelectPlan'))
    return
  }
  if (!fd.items.length) {
    ElMessage.warning(t('production.inhouse.msgAddGoods'))
    return
  }
  saving.value = true
  if (andAudit) savingAndAuditing.value = true
  try {
    const sharedOrderSn = fd.order_sn || generateProductionInhouseOrderSn()
    fd.order_sn = sharedOrderSn
    const basePayload: any = {
      plan_id: fd.plan_id,
      plan_no: fd.plan_name,
      inhouse_date: fd.in_date,
      warehouse_id: fd.warehouse_id || 0,
      warehouse_name: fd.warehouse_name || '',
      admin_name: fd.admin_name || '',
      remark: fd.remark || '',
      inhouse_no: sharedOrderSn,
    }
    const savedRows: any[] = []
    if (fd.id) {
      // 编辑：用第一个商品更新
      const item0 = fd.items[0] || {}
      const normalizedItem0 = normalizeProductionInhouseItems([item0], {
        warehouse_id: fd.warehouse_id,
        warehouse_name: fd.warehouse_name || '',
      })
      const updatePayload = {
        ...basePayload,
        id: fd.id,
        goods_id: item0.goods_id || 0,
        goods_name: item0.goods_name || fd.items.map((i: any) => i.goods_name).join('、').slice(0, 100),
        inhouse_qty: Number(item0.num) || 0,
        remark: buildProductionInhouseRemark(fd.remark || '', normalizedItem0[0] || item0),
      }
      await updateProductionInhouse(updatePayload)
      savedRows.push({
        ...updatePayload,
        order_sn: sharedOrderSn,
        goods_sn: item0.goods_sn || '',
        unit_name: item0.unit_name || '',
        in_price: Number(item0.in_price || 0),
      })
    } else {
      // 新增：每个商品保存一条记录
      for (const item of fd.items) {
        const normalizedItem = normalizeProductionInhouseItems([item], {
          warehouse_id: fd.warehouse_id,
          warehouse_name: fd.warehouse_name || '',
        })
        const createPayload = {
          ...basePayload,
          goods_id: item.goods_id || 0,
          goods_name: item.goods_name || '',
          inhouse_qty: Number(item.num) || 0,
          remark: buildProductionInhouseRemark(fd.remark || '', normalizedItem[0] || item),
        }
        if (!createPayload.inhouse_qty) continue
        const res = await createProductionInhouse(createPayload)
        savedRows.push({
          ...createPayload,
          id: getResponseId(res),
          order_sn: res?.data?.order_sn || res?.data?.data?.order_sn || sharedOrderSn,
          goods_sn: item.goods_sn || '',
          unit_name: item.unit_name || '',
          in_price: Number(item.in_price || 0),
        })
      }
    }

    if (andAudit) {
      const { changedCount } = await autoAuditSavedRows(savedRows)

      await syncProductionLaborExpense({
        order_sn: savedRows[0]?.order_sn || sharedOrderSn,
        inhouse_date: fd.in_date || new Date().toISOString().slice(0, 10),
        admin_name: fd.admin_name || '',
        items: fd.items,
        active: true,
      })

      // 倒冲领料：按 BOM 自动生成领料单并扣减库存
      if (fd.back_flush && fd.warehouse_id) {
        try {
          // 汇总所有成品需要的原材料（BOM × 本次入库数量）
          const materialMap = new Map<number, any>()
          for (const item of fd.items) {
            const qty = Number(item.num) || 0
            if (!qty || !item.goods_id) continue
            const bomRes = await getBomByGoods(item.goods_id)
            const bomItems: any[] = bomRes.data?.list ?? bomRes.data?.rows ?? bomRes.data ?? []
            for (const bom of bomItems) {
              const matId = Number(bom.material_id || bom.goods_id)
              const need = (Number(bom.num) || 0) * qty
              if (!matId || need <= 0) continue
              if (materialMap.has(matId)) {
                materialMap.get(matId).num += need
              } else {
                materialMap.set(matId, {
                  goods_id: matId,
                  goods_name: bom.material_name || bom.goods_name || '',
                  goods_sn: bom.material_sn || bom.goods_sn || '',
                  unit_name: bom.unit_name || '',
                  num: need,
                  out_price: Number(bom.cost_price || bom.price || 0),
                  warehouse_id: fd.warehouse_id,
                  warehouse_name: fd.warehouse_name || '',
                })
              }
            }
          }

          // 补充查商品 cost_price，作为 BOM 里 out_price=0 时的 fallback
          const matItems = [...materialMap.values()]
          const missingPriceIds = matItems.filter(i => !i.out_price).map(i => i.goods_id)
          if (missingPriceIds.length) {
            try {
              const gRes = await http.get('/goods/ShopGoods/index', { params: { list_rows: 500 } })
              const gRows: any[] = gRes.data?.rows ?? []
              const costMap: Record<number, number> = {}
              for (const g of gRows) costMap[g.id] = Number(g.cost_price || 0)
              for (const i of matItems) {
                if (!i.out_price && costMap[i.goods_id]) i.out_price = costMap[i.goods_id]
              }
            } catch {}
          }
          if (matItems.length) {
            const matRes = await createMaterial({
              pick_date: fd.in_date || new Date().toISOString().slice(0, 10),
              production_plan_id: fd.plan_id || 0,
              admin_name: fd.admin_name || '',
              remark: `Back-flush - ${fd.items.map((i: any) => i.goods_name).join(', ').slice(0, 80)}`,
              goods_info: JSON.stringify(matItems),
              goods_name: matItems.map(i => i.goods_name).join(', ').slice(0, 100),
              total_price: matItems.reduce((s, i) => s + i.num * i.out_price, 0),
            })
            const matId = Number(matRes.data?.id || matRes.data?.data?.id || matRes.data)
            if (matId) {
              await auditMaterial(matId, 1)
            }
            await applyMaterialStockDelta(matItems, {
              direction: 'deduct',
              defaultWarehouseId: fd.warehouse_id,
              defaultWarehouseName: fd.warehouse_name || '',
            })
            stockRefreshStore.trigger()
            ElMessage.success(t('production.inhouse.msgBackFlushSuccess', { count: matItems.length }))
          }
        } catch (e: any) {
          ElMessage.warning(t('production.inhouse.msgBackFlushFailed', { error: e?.message ?? '' }))
        }
      }
      ElMessage.success(t('production.inhouse.msgSaveAndAuditSuccess', { count: changedCount }))
      stockRefreshStore.trigger()
    } else {
      ElMessage.success(t('production.inhouse.msgSaveSuccess'))
    }
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('production.inhouse.msgSaveFailed'))
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

// ── 审核/删除 ────────────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const actionKey = status === 1 ? 'auditActionApprove' : status === 2 ? 'auditActionReject' : 'auditActionUnaudit'
  const action = t(`production.inhouse.${actionKey}`)
  await ElMessageBox.confirm(t('production.inhouse.msgAuditConfirm', { action }), t('production.inhouse.msgAuditTip'), { type: 'warning' })
  try {
    if (status === 2) {
      await auditProductionInhouse(row.id, status)
      ElMessage.success(t('production.inhouse.msgAuditSuccess', { action, count: 0 }))
      tableRef.value?.refresh()
      return
    }

    const { changedCount } = await syncAuditAndStock(row, status as 0 | 1)
    await syncProductionLaborExpense({
      order_sn: row.order_sn || row.inhouse_no || '',
      inhouse_date: row.inhouse_date || row.in_date || row.create_time || new Date().toISOString().slice(0, 10),
      admin_name: row.admin_name || '',
      items: buildItemsFromRow(row),
      active: status === 1,
    })
    stockRefreshStore.trigger()
    ElMessage.success(
      status === 1
        ? t('production.inhouse.msgAuditSuccess', { action, count: changedCount })
        : t('production.inhouse.msgUnauditSuccess', { action, count: changedCount })
    )
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('production.inhouse.msgActionFailed'))
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('production.inhouse.msgDeleteConfirm'), t('production.inhouse.msgAuditTip'), { type: 'warning' })
  await deleteProductionInhouse(id)
  ElMessage.success(t('production.inhouse.msgDeleteSuccess'))
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function fmtN(v: any): string {
  const n = Number(v || 0)
  return isNaN(n) ? '0.00' : n.toLocaleString(locale.value === 'en-US' ? 'en-US' : 'zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCostItems(row: any): any[] {
  const meta = parseProductionInhouseMeta(row?.remark)
  if (row.goods_info) {
    try {
      const items = JSON.parse(row.goods_info)
      if (Array.isArray(items) && items.length) {
        return items.map((i: any) => ({ ...i, goods_id: i.goods_id || row.goods_id || 0 }))
      }
    } catch {}
  }
  return [{
    goods_id: row.goods_id || 0,
    goods_name: row.goods_name || '',
    num: Number(row.inhouse_qty || 0),
    material_price: Number(meta.material_price || 0),
    process_price: Number(meta.process_price || 0),
    in_price: Number(row.in_price || meta.in_price || 0),
  }]
}

// 展开行：reactive Map 存各行数据，ref 回调触发查询
const expandState = reactive<Record<number, { loading: boolean; loaded: boolean; items: any[]; materialCost: number; totalCost: number; avgPrice: number }>>({})

function triggerExpand(row: any) {
  if (expandState[row.id]?.loaded || expandState[row.id]?.loading) return
  loadExpandData(row)
}

async function loadExpandData(row: any) {

  expandState[row.id] = { loading: true, loaded: false, items: [], materialCost: 0, totalCost: 0, avgPrice: 0 }

  try {
    const base = parseCostItems(row)

    // 采购入库移动均价 + BOM物料成本，兜底商品采购价
    const avgPriceMap: Record<number, number> = {}
    try {
      const [ihRes, bomRes, gRes] = await Promise.allSettled([
        http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
        http.get('/goods/ShopBom/index', { params: { list_rows: 500 } }),
        http.get('/goods/ShopGoods/index', { params: { list_rows: 500 } }),
      ])
      const goodsRows: any[] = gRes.status === 'fulfilled' ? (gRes.value.data?.rows ?? []) : []
      for (const g of goodsRows) avgPriceMap[g.id] = Number(g.cost_price || 0)
      const snTotalCost: Record<string, number> = {}
      const snTotalQty: Record<string, number> = {}
      const ihRows: any[] = ihRes.status === 'fulfilled' ? (ihRes.value.data?.rows ?? []) : []
      for (const ih of ihRows) {
        if (Number(ih.status) !== 1) continue
        try {
          for (const item of JSON.parse(ih.goods_info || '[]')) {
            const sn = item.goods_sn
            if (!sn) continue
            const qty = Number(item.num || 0)
            const price = Number(item.price || 0)
            if (qty > 0 && price > 0) {
              snTotalCost[sn] = (snTotalCost[sn] || 0) + qty * price
              snTotalQty[sn] = (snTotalQty[sn] || 0) + qty
            }
          }
        } catch {}
      }
      // BOM产品：成品均价 = 各物料用量 × 物料采购均价 之和
      const snAvgPrice: Record<string, number> = {}
      for (const sn in snTotalQty) {
        if (snTotalQty[sn] > 0) snAvgPrice[sn] = snTotalCost[sn] / snTotalQty[sn]
      }
      const bomRows: any[] = bomRes.status === 'fulfilled' ? (bomRes.value.data?.rows ?? []) : []
      const bomMap: Record<number, { material_sn: string; num: number }[]> = {}
      for (const b of bomRows) {
        const gid = Number(b.goods_id || 0)
        if (!gid) continue
        if (!bomMap[gid]) bomMap[gid] = []
        bomMap[gid].push({ material_sn: b.material_sn || '', num: Number(b.num || 0) })
      }
      for (const gid in bomMap) {
        const g = goodsRows.find(x => x.id === Number(gid))
        const sn = g?.goods_sn
        if (!sn) continue
        let bomCost = 0
        for (const mat of bomMap[Number(gid)]) {
          bomCost += mat.num * (snAvgPrice[mat.material_sn] || 0)
        }
        if (bomCost > 0) {
          snTotalCost[sn] = bomCost
          snTotalQty[sn] = 1
        }
      }
      for (const g of goodsRows) {
        const sn = g.goods_sn
        if (sn && snTotalQty[sn] > 0) avgPriceMap[g.id] = snTotalCost[sn] / snTotalQty[sn]
      }
    } catch {}

    // 查领料总价（仅用于展示领料成本）
    let materialTotalPrice = 0
    const planId = Number(row.plan_id || 0)
    if (planId) {
      try {
        const mRes = await http.get('/production/material/index', {
          params: { list_rows: 500, production_plan_id: planId }
        })
        for (const mr of (mRes.data?.rows ?? [])) {
          if (Number(mr.production_plan_id || mr.plan_id) !== planId || Number(mr.status) !== 1) continue
          materialTotalPrice += Number(mr.total_price || 0)
        }
      } catch {}
    }

    const resolvedItems = base.map((item: any) => {
      const gid = Number(item.goods_id || 0)
      const mp = avgPriceMap[gid] || Number(item.material_price || 0)
      const pp = Number(item.process_price || 0)
      return { ...item, material_price: mp, in_price: mp + pp }
    })

    const totalCost = resolvedItems.reduce((s, r) => s + Number(r.num||0) * Number(r.in_price||0), 0)
    const totalQty = resolvedItems.reduce((s, r) => s + Number(r.num||0), 0)

    expandState[row.id] = {
      loading: false, loaded: true,
      items: resolvedItems,
      materialCost: materialTotalPrice,
      totalCost,
      avgPrice: totalQty > 0 ? totalCost / totalQty : 0,
    }
  } catch {
    expandState[row.id] = { loading: false, loaded: true, items: parseCostItems(row), materialCost: 0, totalCost: 0, avgPrice: 0 }
  }
}

function calcTotalCost(row: any): number {
  const items = parseCostItems(row)
  return items.reduce((s, r) => {
    const gid = Number(r.goods_id || 0)
    const mp = stockAvgMap.value[gid] || Number(r.material_price || 0)
    const pp = Number(r.process_price || 0)
    return s + (Number(r.num || 0) * (mp + pp))
  }, 0)
}
function calcAvgPrice(row: any): number {
  const items = parseCostItems(row)
  const totalQty = items.reduce((s, r) => s + Number(r.num || 0), 0)
  return totalQty > 0 ? calcTotalCost(row) / totalQty : 0
}

// 预加载移动加权平均价（采购入库 + BOM物料成本）供列表"入库成本"列使用
const stockAvgMap = ref<Record<number, number>>({})
async function loadStockAvg() {
  try {
    const [ihRes, bomRes, gRes] = await Promise.allSettled([
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      http.get('/goods/ShopBom/index', { params: { list_rows: 500 } }),
      http.get('/goods/ShopGoods/index', { params: { list_rows: 500 } }),
    ])
    const m: Record<number, number> = {}
    const goodsRows: any[] = gRes.status === 'fulfilled' ? (gRes.value.data?.rows ?? []) : []
    for (const g of goodsRows) m[g.id] = Number(g.cost_price || 0)
    const snTotalCost: Record<string, number> = {}
    const snTotalQty: Record<string, number> = {}
    // 采购入库
    const ihRows: any[] = ihRes.status === 'fulfilled' ? (ihRes.value.data?.rows ?? []) : []
    for (const ih of ihRows) {
      if (Number(ih.status) !== 1) continue
      try {
        for (const item of JSON.parse(ih.goods_info || '[]')) {
          const sn = item.goods_sn
          if (!sn) continue
          const qty = Number(item.num || 0)
          const price = Number(item.price || 0)
          if (qty > 0 && price > 0) {
            snTotalCost[sn] = (snTotalCost[sn] || 0) + qty * price
            snTotalQty[sn] = (snTotalQty[sn] || 0) + qty
          }
        }
      } catch {}
    }
    // BOM产品：成品均价 = 各物料用量 × 物料采购均价 之和
    const snAvgPrice: Record<string, number> = {}
    for (const sn in snTotalQty) {
      if (snTotalQty[sn] > 0) snAvgPrice[sn] = snTotalCost[sn] / snTotalQty[sn]
    }
    const bomRows: any[] = bomRes.status === 'fulfilled' ? (bomRes.value.data?.rows ?? []) : []
    const bomMap: Record<number, { material_sn: string; num: number }[]> = {}
    for (const b of bomRows) {
      const gid = Number(b.goods_id || 0)
      if (!gid) continue
      if (!bomMap[gid]) bomMap[gid] = []
      bomMap[gid].push({ material_sn: b.material_sn || '', num: Number(b.num || 0) })
    }
    for (const gid in bomMap) {
      const g = goodsRows.find(x => x.id === Number(gid))
      const sn = g?.goods_sn
      if (!sn) continue
      let bomCost = 0
      for (const mat of bomMap[Number(gid)]) {
        bomCost += mat.num * (snAvgPrice[mat.material_sn] || 0)
      }
      if (bomCost > 0) {
        snTotalCost[sn] = bomCost
        snTotalQty[sn] = 1
      }
    }
    for (const g of goodsRows) {
      const sn = g.goods_sn
      if (sn && snTotalQty[sn] > 0) m[g.id] = snTotalCost[sn] / snTotalQty[sn]
    }
    stockAvgMap.value = m
  } catch {}
}

async function initFromQuery() {
  const { plan_id, plan_name, goods_info } = route.query
  if (!plan_id) return

  await loadWarehouses()
  Object.assign(fd, defaultFd())
  fd.plan_id = Number(plan_id)

  const planItems: any[] = JSON.parse(String(goods_info || '[]'))
  fd.plan_name = String(plan_name || '')
  fd.items = []
  if (!planItems.length) { isView.value = false; showForm.value = true; checkHasMaterial(Number(plan_id), String(plan_name || '')); return }

  // 1. 查该计划已审核领料单，汇总每种商品的物料总价
  const materialPriceMap: Record<number, number> = {} // goods_id → 总金额
  const materialNumMap: Record<number, number> = {}   // goods_id → 总数量
  try {
    const mRes = await http.get('/production/material/index', { params: { list_rows: 500 } })
    const mRows: any[] = mRes.data?.rows ?? []
    const pid = Number(plan_id)
    for (const mr of mRows) {
      const mrPlanId = Number(mr.production_plan_id || mr.plan_id || 0)
      if (mrPlanId !== pid || Number(mr.status) !== 1) continue
      try {
        const items: any[] = JSON.parse(mr.goods_info || '[]')
        for (const it of items) {
          const gid = Number(it.goods_id)
          const num = Number(it.num || 0)
          const price = Number(it.out_price || it.price || 0)
          materialNumMap[gid] = (materialNumMap[gid] || 0) + num
          materialPriceMap[gid] = (materialPriceMap[gid] || 0) + num * price
        }
      } catch {}
    }
  } catch {}

  // 2. 查商品采购价作为兜底
  const costPriceMap: Record<number, number> = {}
  try {
    const goodsIds = planItems.map(gi => gi.goods_id).filter(Boolean)
    const gRes = await http.get('/goods/ShopGoods/index', { params: { list_rows: 200 } })
    const gRows: any[] = gRes.data?.rows ?? gRes.data?.list ?? []
    for (const g of gRows) {
      if (goodsIds.includes(g.id)) costPriceMap[g.id] = Number(g.cost_price || 0)
    }
  } catch {}

  // 3. 组装 items
  let hasPrice = false
  for (const gi of planItems) {
    const gid = Number(gi.goods_id)
    const num = Number(gi.num || 0)
    // 物料单价：领料单实际单价 > 商品采购价 > 0
    let materialPrice = 0
    if (materialNumMap[gid] > 0) {
      materialPrice = Number((materialPriceMap[gid] / materialNumMap[gid]).toFixed(4))
    } else if (costPriceMap[gid] > 0) {
      materialPrice = costPriceMap[gid]
    }
    if (materialPrice > 0) hasPrice = true
    const item = {
      goods_id: gid,
      goods_name: gi.goods_name,
      goods_sn: gi.goods_sn || '',
      unit_name: gi.unit_name || '',
      num,
      material_price: materialPrice,
      process_price: 0,
      in_price: materialPrice,
      total_cost: 0,
    }
    calcRow(item)
    fd.items.push(item)
  }
  if (hasPrice) ElMessage.success(t('production.inhouse.msgAutoMaterialCostSimple'))
  isView.value = false
  checkHasMaterial(Number(plan_id), String(plan_name || ''))
  showForm.value = true
}

// 防止 onMounted + onActivated 在首次加载时都触发导致重复
let _initDone = false
onMounted(async () => { _initDone = false; loadStockAvg(); await initFromQuery(); _initDone = true })
onActivated(async () => { if (_initDone) await initFromQuery() })
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

.expand-cost { background: #f8fafc; }
.expand-total { padding: 8px 20px 12px; font-size: 13px; color: rgba(29,29,31,0.5); }
</style>
