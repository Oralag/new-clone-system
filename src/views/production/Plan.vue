<template>
  <div class="plan-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <!-- 状态筛选 + 搜索 -->
        <div class="status-bar">
          <el-button-group size="small">
            <el-button :type="searchForm.status === '' ? 'primary' : ''" @click="setStatus('')">{{ $t('production.plan.statusAll') }}</el-button>
            <el-button :type="searchForm.status === 0 ? 'primary' : ''" @click="setStatus(0)">{{ $t('production.plan.statusNotStarted') }}</el-button>
            <el-button :type="searchForm.status === 1 ? 'primary' : ''" @click="setStatus(1)">{{ $t('production.plan.statusInProgress') }}</el-button>
            <el-button :type="searchForm.status === 2 ? 'primary' : ''" @click="setStatus(2)">{{ $t('production.plan.statusDone') }}</el-button>
          </el-button-group>
          <div class="status-bar-right">
            <el-input v-model="searchForm.order_sn" :placeholder="$t('production.plan.searchOrderSn')" clearable size="small" style="width:160px" @change="loadData" />
            <el-button size="small" type="primary" @click="loadData">{{ $t('production.plan.btnSearch') }}</el-button>
            <el-button size="small" @click="resetSearch">{{ $t('production.plan.btnReset') }}</el-button>
          </div>
        </div>

        <!-- 工具栏 -->
        <div class="toolbar">
          <el-button type="primary" size="small" @click="openCreate">{{ $t('production.plan.btnAdd') }}</el-button>
          <el-button size="small" type="danger" :disabled="!selection.length" @click="handleBatchDel">{{ $t('production.plan.btnDelete') }}</el-button>
          <el-button size="small" @click="handleExport">{{ $t('production.plan.btnExport') }}</el-button>
        </div>

        <!-- 表格 -->
        <el-table
          :data="tableData" v-loading="loading" border stripe size="small"
          style="width:100%;margin-top:8px"
          @selection-change="selection = $event"
          row-key="id"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''"
        >
          <el-table-column type="selection" width="40" />
          <el-table-column type="expand">
            <template #default="{ row }">
              <div style="padding:8px 24px 12px">
                <el-table :data="parseItems(row.goods_info)" border size="small" style="width:100%">
                  <el-table-column prop="goods_sn" :label="$t('production.plan.expandColCode')" width="120" />
                  <el-table-column prop="goods_name" :label="$t('production.plan.expandColGoodsName')" min-width="160" />
                  <el-table-column prop="spec" :label="$t('production.plan.expandColSpec')" width="120">
                    <template #default="{ row: r }">{{ r.spec || '—' }}</template>
                  </el-table-column>
                  <el-table-column prop="unit_name" :label="$t('production.plan.expandColUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('production.plan.expandColPlanNum')" width="90" align="right" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('production.plan.colIndex')" width="55" align="center" />
          <el-table-column :label="$t('production.plan.colOrderSn')" width="150">
            <template #default="{ row }">{{ row.order_sn || `SC${(row.plan_date||row.created_at||'').slice(0,10).replace(/-/g,'')}${String(row.id).padStart(3,'0')}` }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colSaleOrderSn')" width="130">
            <template #default="{ row }">{{ row.sale_order_sn || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colPlanDate')" width="105">
            <template #default="{ row }">{{ fmtDt(row.plan_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colFinishDate')" width="105">
            <template #default="{ row }">{{ row.finish_date || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colPriority')" width="80" align="center">
            <template #default="{ row }">
              <el-tag :type="row.priority === '紧急' ? 'danger' : row.priority === '高' ? 'warning' : ''" size="small">
                {{ row.priority || $t('production.plan.priorityNormal') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colScheduleNum')" width="90" align="right">
            <template #default="{ row }">{{ row.schedule_num || 0 }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colPlanNum')" width="90" align="right">
            <template #default="{ row }">{{ row.plan_num || 0 }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colInhouseNum')" width="90" align="right">
            <template #default="{ row }">{{ row.inhouse_num || 0 }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colSchedulePct')" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-progress :percentage="calcPct(row.schedule_num, row.plan_num)" :stroke-width="6" style="flex:1" :show-text="false" />
                <span style="font-size:11px;color:rgba(29,29,31,0.35);width:32px;text-align:right">{{ calcPct(row.schedule_num, row.plan_num) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colPlanPct')" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-progress :percentage="calcPct(row.actual_num, row.plan_num)" :stroke-width="6" style="flex:1" :show-text="false" />
                <span style="font-size:11px;color:rgba(29,29,31,0.35);width:32px;text-align:right">{{ calcPct(row.actual_num, row.plan_num) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colInhousePct')" width="120">
            <template #default="{ row }">
              <div style="display:flex;align-items:center;gap:4px">
                <el-progress :percentage="calcPct(row.inhouse_num, row.plan_num)" :stroke-width="6" style="flex:1" :show-text="false" color="#16a34a" />
                <span style="font-size:11px;color:rgba(29,29,31,0.35);width:32px;text-align:right">{{ calcPct(row.inhouse_num, row.plan_num) }}%</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.colFlowStatus')" width="220" align="center">
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
          <el-table-column :label="$t('production.plan.colActions')" width="220" fixed="right" align="center">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openView(row)">{{ $t('production.plan.actionView') }}</el-button>
              <el-button link type="success" size="small" @click="openEdit(row)">{{ $t('production.plan.actionEdit') }}</el-button>
              <!-- 领料按钮：已领料显示完成态，否则激活 -->
              <el-button
                v-if="!hasMaterial(row)"
                link type="warning" size="small"
                @click="goPickMaterial(row)"
              >{{ $t('production.plan.actionPickMaterial') }}</el-button>
              <el-button
                v-else
                link size="small"
                style="color:#16a34a;cursor:default"
                disabled
              >{{ $t('production.plan.actionMaterialDone') }}</el-button>
              <!-- 入库按钮：有领料才激活 -->
              <el-button
                v-if="row.inhouse_num > 0 || row.status === 2"
                link size="small"
                style="color:#16a34a;cursor:default"
                disabled
              >{{ $t('production.plan.actionInhouseDone') }}</el-button>
              <el-button
                v-else-if="hasMaterial(row)"
                link size="small" style="color:#9333ea"
                @click="goInhouse(row)"
              >{{ $t('production.plan.actionInhouse') }}</el-button>
              <el-button
                v-else
                link size="small"
                style="color:#c0c4cc;cursor:not-allowed"
                disabled
              >{{ $t('production.plan.actionInhouse') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleProdPlanReconcile(row)">{{ row._reconciled ? $t('production.plan.actionReconciled') : $t('production.plan.actionReconcile') }}</el-button>
              <el-button link type="danger" size="small" @click="handleDel(row.id)">{{ $t('production.plan.actionDelete') }}</el-button>
            </template>
          </el-table-column>
        </el-table>

        <!-- 汇总行 -->
        <div class="summary-bar">
          <span>{{ $t('production.plan.summaryTotal') }}</span>
          <span style="margin-left:32px">{{ $t('production.plan.summarySchedule', { value: totalSchedule.toFixed(2) }) }}</span>
          <span style="margin-left:16px">{{ $t('production.plan.summaryPlan', { value: totalPlan.toFixed(2) }) }}</span>
          <span style="margin-left:16px">{{ $t('production.plan.summaryInhouse', { value: totalInhouse.toFixed(2) }) }}</span>
        </div>

        <!-- 分页 -->
        <div style="margin-top:10px;display:flex;justify-content:flex-end;align-items:center;gap:8px">
          <span style="font-size:13px;color:#666">{{ $t('production.plan.paginationTotal', { total }) }}</span>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('production.plan.formBtnBack') }}</el-button>
          <span class="form-title">{{ isView ? $t('production.plan.formTitleView') : (fd.id ? $t('production.plan.formTitleEdit') : $t('production.plan.formTitleAdd')) }}</span>
        </div>
        <div v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('production.plan.formBtnSave') }}</el-button>
        </div>
      </div>

      <el-card class="form-card">
        <el-form :model="fd" label-width="90px" :disabled="isView">
          <el-row :gutter="20">
            <el-col :span="10">
              <el-form-item :label="$t('production.plan.fieldSaleOrder')">
                <div style="display:flex;gap:8px">
                  <el-input v-model="fd.sale_order_sn" :placeholder="$t('production.plan.fieldSaleOrderPlaceholder')" readonly style="flex:1" />
                  <el-button size="small" type="primary" @click="salePickerVisible = true" :disabled="isView">{{ $t('production.plan.fieldSaleOrderBtn') }}</el-button>
                </div>
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item :label="$t('production.plan.fieldOrderSn')">
                <el-input v-model="fd.order_sn" :placeholder="$t('production.plan.fieldOrderSnPlaceholder')" />
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item :label="$t('production.plan.fieldPlanDate')">
                <el-date-picker v-model="fd.plan_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="7">
              <el-form-item :label="$t('production.plan.fieldFinishDate')">
                <el-date-picker v-model="fd.finish_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
              </el-form-item>
            </el-col>
            <el-col :span="7">
              <el-form-item :label="$t('production.plan.fieldPriority')">
                <el-select v-model="fd.priority" style="width:100%">
                  <el-option :label="$t('production.plan.priorityNormal')" value="正常" />
                  <el-option :label="$t('production.plan.priorityHigh')" value="高" />
                  <el-option :label="$t('production.plan.priorityUrgent')" value="紧急" />
                  <el-option :label="$t('production.plan.priorityLow')" value="低" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- 商品清单 -->
        <div class="goods-section">
          <div class="goods-header">
            <span class="goods-title">{{ $t('production.plan.goodsSectionTitle') }}</span>
            <el-button v-if="!isView" size="small" type="primary" @click="goodsSelectRef?.open()">{{ $t('production.plan.goodsBtnSelect') }}</el-button>
          </div>
          <el-table :data="fd.items" border size="small" style="width:100%">
            <el-table-column prop="goods_sn" :label="$t('production.plan.goodsColCode')" width="120" />
            <el-table-column prop="goods_name" :label="$t('production.plan.goodsColName')" min-width="160" />
            <el-table-column :label="$t('production.plan.goodsColAttr')" width="90">
              <template #default="{ row }">{{ row.attr || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.goodsColSpec')" width="100">
              <template #default="{ row }">{{ row.spec || '—' }}</template>
            </el-table-column>
            <el-table-column prop="unit_name" :label="$t('production.plan.goodsColUnit')" width="65" align="center" />
            <el-table-column :label="$t('production.plan.goodsColActualNum')" width="100" align="right">
              <template #default="{ row }">{{ row.actual_num || 0 }}</template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.goodsColThisNum')" width="130" align="center">
              <template #default="{ row, $index }">
                <el-input-number
                  v-if="!isView"
                  v-model="fd.items[$index].num"
                  :min="0" :precision="4" size="small" style="width:110px"
                />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.goodsColStock')" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="(row.stock_qty || 0) > 0 ? 'success' : 'danger'" size="small" effect="plain">
                  {{ row.stock_qty || 0 }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column v-if="!isView" :label="$t('production.plan.goodsColActions')" width="140" align="center">
              <template #default="{ row, $index }">
                <el-button link type="primary" size="small" @click="showBomConsume(row)">{{ $t('production.plan.goodsColBomConsume') }}</el-button>
                <el-button link type="danger" size="small" @click="fd.items.splice($index, 1)">{{ $t('production.plan.goodsColDelete') }}</el-button>
              </template>
            </el-table-column>
            <el-table-column v-else :label="$t('production.plan.goodsColActions')" width="90" align="center">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="showBomConsume(row)">{{ $t('production.plan.goodsColBomConsume') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-form :model="fd" label-width="90px" :disabled="isView" style="margin-top:16px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item :label="$t('production.plan.fieldRemark')">
                <el-input v-model="fd.remark" type="textarea" :rows="3" :placeholder="$t('production.plan.fieldRemarkPlaceholder')" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <!-- BOM 物料需求 -->
        <div class="goods-section" v-if="fd.items.length">
          <div class="goods-header">
            <span class="goods-title">{{ $t('production.plan.bomSectionTitle') }}</span>
            <el-button size="small" type="warning" @click="goPickMaterial(fd)" v-if="fd.id">{{ $t('production.plan.bomBtnPickMaterial') }}</el-button>
          </div>
          <div v-if="planBomLoading" style="text-align:center;padding:24px;color:#999">{{ $t('production.plan.bomLoading') }}</div>
          <el-table v-else :data="planBomList" border size="small" style="width:100%">
            <el-table-column prop="material_name" :label="$t('production.plan.bomColMaterialName')" min-width="140" />
            <el-table-column prop="material_sn" :label="$t('production.plan.bomColMaterialSn')" width="110" />
            <el-table-column prop="_spec" :label="$t('production.plan.bomColSpec')" width="120">
              <template #default="{ row }">{{ row._spec || '—' }}</template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.bomColUnitUsage')" width="90" align="center">
              <template #default="{ row }">{{ row.num }} {{ row.unit_name }}</template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.bomColNeedQty')" width="100" align="center">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ row._need }}</b> {{ row.unit_name }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.bomColStock')" width="90" align="center">
              <template #default="{ row }">
                <el-tag :type="row._stock >= row._need ? 'success' : 'danger'" size="small" effect="plain">{{ row._stock }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column :label="$t('production.plan.bomColGap')" width="90" align="center">
              <template #default="{ row }">
                <span v-if="row._need > row._stock" style="color:#f56c6c;font-weight:600">{{ (row._need - row._stock).toFixed(2).replace(/\.?0+$/,'') }}</span>
                <span v-else style="color:#16a34a">{{ $t('production.plan.bomGapSufficient') }}</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-card>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 销售单选择器 -->
    <el-dialog v-model="salePickerVisible" :title="$t('production.plan.salePickerTitle')" width="700px" append-to-body>
      <el-table :data="saleOrders" v-loading="saleLoading" border height="360"
        highlight-current-row @current-change="currentSaleRow = $event">
        <el-table-column prop="order_sn" :label="$t('production.plan.salePickerColOrderSn')" width="160" />
        <el-table-column prop="customer_name" :label="$t('production.plan.salePickerColCustomer')" min-width="120" />
        <el-table-column :label="$t('production.plan.salePickerColDate')" width="110">
          <template #default="{ row }">{{ fmtDt(row.sign_date || row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="$t('production.plan.salePickerColAmount')" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="salePickerVisible = false">{{ $t('production.plan.salePickerBtnCancel') }}</el-button>
        <el-button type="primary" :disabled="!currentSaleRow" @click="confirmSale">{{ $t('production.plan.salePickerBtnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- BOM 消耗弹窗 -->
    <el-dialog v-model="bomVisible" :title="$t('production.plan.goodsColBomConsume') + ' - ' + bomGoodsName" width="750px" append-to-body>
      <div v-if="bomConsumeList.length === 0 && !bomLoading" style="text-align:center;padding:32px 0;color:rgba(29,29,31,0.35)">
        {{ $t('production.plan.bomConsumeEmptyTip') }}
      </div>
      <template v-else>
        <div style="margin-bottom:12px;font-size:13px;color:rgba(29,29,31,0.5)">
          {{ $t('production.plan.bomConsumeQtyInfo', { qty: bomPlanNum }) }}
        </div>
        <el-table :data="bomConsumeList" v-loading="bomLoading" border size="small" show-summary :summary-method="bomSummary">
          <el-table-column prop="material_name" :label="$t('production.plan.bomConsumeColMaterialName')" min-width="140" />
          <el-table-column prop="material_sn" :label="$t('production.plan.bomConsumeColMaterialSn')" width="110" />
          <el-table-column :label="$t('production.plan.bomConsumeColUnitUsage')" width="100" align="center">
            <template #default="{ row }">{{ row.num }} {{ row.unit_name }}</template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.bomConsumeColNeedQty')" width="110" align="center">
            <template #default="{ row }">
              <span style="font-weight:600;color:#0071e3">{{ row._need }}</span>
              <span style="color:rgba(29,29,31,0.35);margin-left:2px">{{ row.unit_name }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.bomConsumeColStock')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row._stock >= row._need ? 'success' : 'danger'" size="small" effect="plain">
                {{ row._stock }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('production.plan.bomConsumeColGap')" width="90" align="center">
            <template #default="{ row }">
              <span v-if="row._need > row._stock" style="color:#f56c6c;font-weight:600">
                {{ (row._need - row._stock).toFixed(2).replace(/\.?0+$/, '') }}
              </span>
              <span v-else style="color:#16a34a">{{ $t('production.plan.bomConsumeGapSufficient') }}</span>
            </template>
          </el-table-column>
        </el-table>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import http from '@/api/http'
import { fmtDt } from '@/utils/date'
import { getBomByGoods } from '@/api/goods'
import GoodsSelect from '@/components/GoodsSelect.vue'

const { t } = useI18n()

// ── 核对 ──────────────────────────────────────────────────────────────────────
const prodPlanReconcileIds = ref<Set<number>>(new Set(JSON.parse(localStorage.getItem('reconcile_production_plan') || '[]')))
function toggleProdPlanReconcile(row: any) {
  const newVal = !row._reconciled
  if (newVal) prodPlanReconcileIds.value.add(row.id)
  else prodPlanReconcileIds.value.delete(row.id)
  localStorage.setItem('reconcile_production_plan', JSON.stringify([...prodPlanReconcileIds.value]))
  const idx = tableData.value.findIndex((r: any) => r.id === row.id)
  if (idx !== -1) tableData.value.splice(idx, 1, { ...tableData.value[idx], _reconciled: newVal })
}

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
    const settled = await Promise.allSettled([
      http.get('/production/plan/index', { params }),
      http.get('/production/inhouse/index', { params: { list_rows: 1000 } }),
    ])
    const [res, inhouseRes] = settled.map((s: any) => s.status === 'fulfilled' ? s.value : { data: { rows: [], list: [] } })
    const rows = res.data?.rows || []
    const inhouseRows: any[] = inhouseRes.data?.rows || []
    const inhouseMap = new Map<number, number>()
    for (const inhouse of inhouseRows) {
      if (Number(inhouse.status) !== 1) continue
      const planId = Number(inhouse.plan_id || 0)
      if (!planId) continue
      inhouseMap.set(planId, (inhouseMap.get(planId) || 0) + Number(inhouse.inhouse_qty || 0))
    }
    tableData.value = rows.map((row: any) => ({
      ...row,
      inhouse_num: Number(inhouseMap.get(Number(row.id || 0)) ?? row.inhouse_num ?? 0),
      _reconciled: prodPlanReconcileIds.value.has(Number(row.id)),
    }))
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
  return hasMaterial(row) ? t('production.plan.stepMaterialDone') : t('production.plan.stepMaterialPending')
}

function getInhouseLabel(row: any) {
  if (row.inhouse_num > 0 || row.status === 2) return t('production.plan.stepInhouseDone')
  return t('production.plan.stepInhousePending')
}

// ── 跳转领料/入库 ─────────────────────────────────────────────────────────────
function goPickMaterial(row: any) {
  const planSn = row.order_sn || `SC${(row.plan_date||row.created_at||'').slice(0,10).replace(/-/g,'')}${String(row.id).padStart(3,'0')}`
  router.push({ name: 'ProductionMaterial', query: { plan_id: row.id, plan_name: planSn, goods_info: typeof row.goods_info === 'string' ? row.goods_info : JSON.stringify(row.goods_info || []) } })
}
function goInhouse(row: any) {
  const planSn = row.order_sn || `SC${(row.plan_date||row.created_at||'').slice(0,10).replace(/-/g,'')}${String(row.id).padStart(3,'0')}`
  router.push({ name: 'ProductionInhouse', query: { plan_id: row.id, plan_name: planSn, goods_info: typeof row.goods_info === 'string' ? row.goods_info : JSON.stringify(row.goods_info || []) } })
}

async function handleDel(id: number) {
  if (materialMap.value[id]) {
    ElMessageBox.alert(
      t('production.plan.msgCannotDeleteHasMaterial'),
      t('production.plan.msgCannotDeleteTitle'),
      { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: t('production.plan.msgCannotDeleteConfirm') }
    ).then(() => {
      router.push({ name: 'ProductionMaterial' })
    }).catch(() => {})
    return
  }
  await ElMessageBox.confirm(t('production.plan.msgDeleteConfirm'), t('production.plan.msgDeleteTip'), { type: 'warning' })
  await http.post('/production/plan/del', { id })
  ElMessage.success(t('production.plan.msgDeleteSuccess'))
  loadData()
}

async function handleBatchDel() {
  const blockedIds = selection.value.map(r => r.id).filter(id => materialMap.value[id])
  if (blockedIds.length) {
    ElMessageBox.alert(
      t('production.plan.msgCannotBatchDeleteHasMaterial', { count: blockedIds.length }),
      t('production.plan.msgCannotDeleteTitle'),
      { type: 'warning', dangerouslyUseHTMLString: true, confirmButtonText: t('production.plan.msgCannotDeleteConfirm') }
    ).then(() => {
      router.push({ name: 'ProductionMaterial' })
    }).catch(() => {})
    return
  }
  await ElMessageBox.confirm(t('production.plan.msgBatchDeleteConfirm', { count: selection.value.length }), t('production.plan.msgDeleteTip'), { type: 'warning' })
  await http.post('/production/plan/batchDel', { ids: selection.value.map(r => r.id) })
  ElMessage.success(t('production.plan.msgDeleteSuccess'))
  loadData()
}

function handleExport() { ElMessage.info(t('production.plan.msgExportDev')) }

const itemsVisible = ref(false)
const itemsRow = ref<any>(null)

function parseItems(info: any): any[] {
  if (Array.isArray(info)) return info
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
  if (!fd.items.length) { ElMessage.warning(t('production.plan.msgAddGoods')); return }
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
    ElMessage.success(t('production.plan.msgSaveSuccess'))
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('production.plan.msgSaveFailed', { error: '' }))
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
    ElMessage.error(t('production.plan.msgGetBomFailed'))
  } finally {
    bomLoading.value = false
  }
}

function bomSummary({ columns, data }: any) {
  return columns.map((_: any, idx: number) => {
    if (idx === 0) return t('production.plan.bomConsumeSummaryTotal')
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
