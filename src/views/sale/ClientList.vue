<template>
  <div class="client-page">
    <div class="list-layout">

      <!-- 左侧分类面板 -->
      <div class="cate-panel">
        <div class="cate-header">
          <span class="cate-title">{{ $t('sale.client.cateTitle') }}</span>
          <el-button :icon="Plus" size="small" circle @click="openCateForm()" />
        </div>
        <div class="cate-search">
          <el-input v-model="cateKeyword" :placeholder="$t('sale.client.cateSearchPlaceholder')" clearable size="small" />
        </div>
        <div class="cate-tree">
          <div class="cate-item" :class="{ active: selectedCateId === null }" @click="selectCate(null)">
            {{ $t('sale.client.cateAll') }}
          </div>
          <template v-for="item in filteredCates" :key="item.id">
            <div class="cate-item" :class="{ active: selectedCateId === item.id, 'cate-item-child': !!item.pid }" @click="selectCate(item.id)">
              <span class="cate-item-name">{{ item.pid ? '└ ' : '' }}{{ item.name }}</span>
              <span class="cate-item-actions">
                <el-icon class="act-icon" @click.stop="openCateForm(item)"><Edit /></el-icon>
                <el-icon class="act-icon danger" @click.stop="handleDeleteCate(item.id)"><Delete /></el-icon>
              </span>
            </div>
          </template>
          <div v-if="filteredCates.length === 0" class="cate-empty">{{ $t('sale.client.cateEmpty') }}</div>
        </div>
      </div>

      <!-- 右侧客户列表 -->
      <div class="client-list-wrap">
        <div class="sc-table">
          <!-- 搜索栏 -->
          <div class="sc-search">
            <el-input v-model="keyword" :placeholder="$t('sale.client.searchPlaceholder')" clearable style="width:200px"
              @keyup.enter="handleSearch" />
            <div class="search-actions">
              <el-button type="primary" :icon="Search" @click="handleSearch">{{ $t('sale.client.btnQuery') }}</el-button>
              <el-button :icon="Refresh" @click="handleReset">{{ $t('sale.client.btnReset') }}</el-button>
            </div>
          </div>
          <!-- 工具栏 -->
          <div class="sc-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" :icon="Plus" @click="openForm()" data-guide-id="guide-client-create">{{ $t('sale.client.btnAddClient') }}</el-button>
            </div>
            <div class="toolbar-right">
              <el-tooltip :content="$t('sale.client.tooltipImport')">
                <el-upload
                  :show-file-list="false"
                  accept=".xlsx,.xls,.csv"
                  :before-upload="handleImport"
                  style="display:inline-block"
                >
                  <el-button :icon="Upload" size="small">{{ $t('sale.client.btnImport') }}</el-button>
                </el-upload>
              </el-tooltip>
              <el-tooltip :content="$t('sale.client.tooltipExport')">
                <el-button :icon="Download" size="small" @click="handleExport">{{ $t('sale.client.btnExport') }}</el-button>
              </el-tooltip>
            </div>
          </div>
          <!-- 已选提示 -->
          <div v-if="selectedRows.length > 0" class="selected-bar">
            {{ $t('sale.client.selectedPrefix') }} <strong>{{ selectedRows.length }}</strong> {{ $t('sale.client.selectedSuffix') }}
            <el-button type="primary" link size="small" @click="selectedRows = []">{{ $t('sale.client.btnCancelSelect') }}</el-button>
            <el-button type="danger" :icon="Delete" size="small" style="margin-left:auto" @click="handleBatchDelete">
              {{ $t('sale.client.btnBatchDelete') }}({{ selectedRows.length }})
            </el-button>
          </div>
          <!-- 手机端卡片列表 -->
          <div v-if="isMobile" v-loading="loading" class="mobile-client-list">
            <div v-if="!filteredRows.length" class="mobile-client-empty">{{ $t('sale.client.mobileEmpty') }}</div>
            <div v-for="row in filteredRows" :key="row.id" class="mobile-client-card">
              <div class="mcl-top">
                <span class="mcl-name">{{ row.nickname || row.name }}</span>
                <span class="mcl-balance" :style="{ color: getBalance(row.id) > 0 ? '#0071e3' : '#c0c4cc' }">
                  ¥{{ getBalance(row.id).toFixed(2) }}
                </span>
              </div>
              <div class="mcl-mid">
                <span class="mcl-mobile">{{ row.mobile || $t('sale.client.dash') }}</span>
                <span class="mcl-cate">{{ getCateName(row.id) || $t('sale.client.dash') }}</span>
              </div>
              <div class="mcl-actions">
                <el-button type="primary" link size="small" @click="openView(row)">{{ $t('sale.client.btnView') }}</el-button>
                <el-button type="primary" link size="small" @click="openForm(row)">{{ $t('sale.client.btnEdit') }}</el-button>
                <el-button type="danger" link size="small" @click="handleDelete(row.id)">{{ $t('sale.client.btnDelete') }}</el-button>
              </div>
            </div>
          </div>

          <!-- PC端表格 -->
          <el-table v-else :data="filteredRows" v-loading="loading" border stripe style="width:100%"
            @selection-change="(val: any[]) => selectedRows = val">
            <el-table-column type="selection" width="50" align="center" />
            <el-table-column prop="nickname" :label="$t('sale.client.colName')" min-width="150" />
            <el-table-column prop="mobile" :label="$t('sale.client.colMobile')" width="130" />
            <el-table-column :label="$t('sale.client.colCate')" width="120">
              <template #default="{ row }">
                {{ getCateName(row.id) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.client.colLevel')" width="100">
              <template #default="{ row }">
                {{ getLevelName(row.id) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.client.colSource')" width="100">
              <template #default="{ row }">
                {{ getSourceName(customerSourceMap[row.id] || row.source_id || row.source) }}
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.client.colBalance')" width="120" align="right">
              <template #default="{ row }">
                <span :style="{ color: getBalance(row.id) > 0 ? '#0071e3' : '#c0c4cc', fontWeight: '600' }">
                  ¥{{ getBalance(row.id).toFixed(2) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.client.colActions')" width="160" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="openView(row)">{{ $t('sale.client.btnView') }}</el-button>
                <el-button type="primary" size="small" link @click="openForm(row)">{{ $t('sale.client.btnEdit') }}</el-button>
                <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('sale.client.btnDelete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
          <!-- 分页 -->
          <div class="sc-pagination" v-if="total > 0 && !isMobile">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="total"
              :page-sizes="[20, 50, 100, 200]"
              layout="total, sizes, prev, pager, next, jumper"
              background
              @size-change="() => { currentPage = 1; loadData() }"
              @current-change="loadData"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 查看客户弹框 -->
    <el-dialog v-model="viewVisible" :title="$t('sale.client.dialogViewTitle')" width="480px" append-to-body>
      <el-descriptions :column="2" border>
        <el-descriptions-item :label="$t('sale.client.descName')">{{ viewRow.nickname || viewRow.name }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descMobile')">{{ viewRow.mobile || $t('sale.client.dash') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descCate')">{{ getCateName(viewRow.id) || $t('sale.client.dash') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descLevel')">{{ getLevelName(viewRow.id) || $t('sale.client.dash') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descSource')">{{ getSourceName(customerSourceMap[viewRow.id]) || $t('sale.client.dash') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descPrepay')">
          <span style="color:#16a34a;font-weight:600">¥{{ getPrepay(viewRow.id || 0).toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descSaleAmount')">
          <span style="color:#dc2626">¥{{ getSaleAmount(viewRow.id || 0).toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descBalance')">
          <span style="color:#0071e3;font-weight:600">¥{{ getBalance(viewRow.id || 0).toFixed(2) }}</span>
        </el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descAddress')" :span="2">{{ viewRow.address || $t('sale.client.dash') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descRemark')" :span="2">{{ viewRow.remark || $t('sale.client.dash') }}</el-descriptions-item>
        <el-descriptions-item :label="$t('sale.client.descCreateTime')" :span="2">{{ viewRow.create_time || viewRow.created_at || $t('sale.client.dash') }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="viewVisible = false">{{ $t('sale.client.btnClose') }}</el-button>
        <el-button type="primary" @click="viewVisible = false; openForm(viewRow)">{{ $t('sale.client.btnEdit') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增/编辑客户弹框 -->
    <!-- ⚠️ 规则：新增和编辑界面必须完全一致
         - finance-panel 不加 v-if，始终显示
         - 充值预付款按钮两种模式都显示（新增时自动先保存客户）
         - 查看应收记录 v-if="formData.id"（新增时无意义）
         - 底部按钮只有：取消 + 确定，禁止加「保存并充值」 -->
    <el-dialog v-model="formVisible" :title="formTitle" width="560px" append-to-body>
      <el-form ref="formRef" :model="formData" label-width="90px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('sale.client.formName')" prop="nickname"
              :rules="[{ required: true, message: t('sale.client.ruleNameRequired') }]"
              data-guide-id="guide-client-form-basic">
              <el-input v-model="formData.nickname" :placeholder="$t('sale.client.inputPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sale.client.formMobile')" prop="mobile">
              <el-input v-model="formData.mobile" :placeholder="$t('sale.client.inputPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sale.client.formCate')">
              <div style="display:flex;gap:4px;width:100%">
                <el-select v-model="formData.cate_id" :placeholder="$t('sale.client.selectPlaceholder')" clearable style="flex:1">
                  <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
                </el-select>
                <el-button :icon="Plus" @click="openCateForm()" />
              </div>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sale.client.formLevel')">
              <el-select v-model="formData.level_id" :placeholder="$t('sale.client.selectLevelPlaceholder')" clearable style="width:100%">
                <el-option v-for="lv in levelOptions" :key="lv.id" :label="lv.name" :value="lv.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('sale.client.formSource')">
              <el-select v-model="formData.source_id" :placeholder="$t('sale.client.selectSourcePlaceholder')" clearable style="width:100%">
                <el-option :label="$t('sale.client.sourceDirectVisit')" :value="1" />
                <el-option :label="$t('sale.client.sourceReferral')" :value="2" />
                <el-option :label="$t('sale.client.sourcePhone')" :value="3" />
                <el-option :label="$t('sale.client.sourceOnline')" :value="4" />
                <el-option :label="$t('sale.client.sourceExhibition')" :value="5" />
                <el-option :label="$t('sale.client.sourceOther')" :value="6" />
                <el-option :label="$t('sale.client.sourcePrepay')" value="prepay" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('sale.client.formAddress')">
              <el-input v-model="formData.address" :placeholder="$t('sale.client.inputPlaceholder')" />
            </el-form-item>
          </el-col>
          <el-col :span="24">
            <el-form-item :label="$t('sale.client.formRemark')">
              <el-input v-model="formData.remark" type="textarea" :rows="2" :placeholder="$t('sale.client.inputPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

      <!-- 财务信息（新增和编辑都显示） -->
      <div class="finance-panel" v-loading="financeLoading">
        <div class="finance-title">{{ $t('sale.client.financeTitle') }}</div>
        <div class="finance-grid">
          <div class="finance-item">
            <span class="fi-label">{{ $t('sale.client.financePrepayBalance') }}</span>
            <span class="fi-value green">¥{{ financeInfo.prepayBalance.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">{{ $t('sale.client.financeTotalPrepay') }}</span>
            <span class="fi-value">¥{{ financeInfo.totalPrepay.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">{{ $t('sale.client.financeTotalConsumed') }}</span>
            <span class="fi-value red">¥{{ financeInfo.totalConsumed.toFixed(2) }}</span>
          </div>
          <div class="finance-item">
            <span class="fi-label">{{ $t('sale.client.financeUnReceived') }}</span>
            <span class="fi-value orange">¥{{ financeInfo.unReceived.toFixed(2) }}</span>
          </div>
        </div>
        <div class="finance-actions">
          <el-button type="success" size="small" :icon="Plus" @click="openPrepayDialog">{{ $t('sale.client.btnRecharge') }}</el-button>
          <el-button v-if="formData.id" size="small" @click="viewReceivable">{{ $t('sale.client.btnViewReceivable') }}</el-button>
        </div>
        <!-- 预付款明细 -->
        <div v-if="formData.id && prepayRecords.length > 0" style="margin-top:10px">
          <div style="font-size:13px;font-weight:600;color:#333;margin-bottom:6px">{{ $t('sale.client.prepayRecordsTitle') }}</div>
          <el-table :data="prepayRecords" border stripe size="small" max-height="200">
            <el-table-column prop="pay_date" :label="$t('sale.client.prepayColDate')" width="100" />
            <el-table-column :label="$t('sale.client.prepayColAmount')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#16a34a;font-weight:600">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="fund_name" :label="$t('sale.client.prepayColAccount')" min-width="100" show-overflow-tooltip />
            <el-table-column prop="remark" :label="$t('sale.client.prepayColRemark')" min-width="100" show-overflow-tooltip />
            <el-table-column :label="$t('sale.client.prepayColActions')" width="70" align="center">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="handleDeletePrepay(row)">{{ $t('sale.client.btnDelete') }}</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div v-if="formData.id && formData.create_time" class="create-time-note">
        {{ $t('sale.client.createTimeNotePrefix') }}{{ formData.create_time }}
      </div>

      <template #footer>
        <el-button @click="formVisible = false">{{ $t('sale.client.btnCancel') }}</el-button>
        <el-button type="primary" :loading="formSaving" @click="handleSubmit" data-guide-id="guide-client-form-save">{{ $t('sale.client.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 充值预付款弹框 -->
    <el-dialog v-model="prepayVisible" :title="$t('sale.client.dialogPrepayTitle')" width="380px" append-to-body>
      <el-form :model="prepayForm" label-width="90px">
        <el-form-item :label="$t('sale.client.prepayFormCustomer')">
          <el-input :value="formData.nickname" disabled />
        </el-form-item>
        <el-form-item :label="$t('sale.client.prepayFormAmount')" required>
          <el-input-number v-model="prepayForm.amount" :min="0.01" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.client.prepayFormAccount')">
          <div style="display:flex;gap:4px;width:100%">
            <el-select v-model="prepayForm.account_name" :placeholder="$t('sale.client.prepayFormAccountPlaceholder')" style="flex:1">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.name" />
              <el-option :label="$t('sale.client.prepayFormCash')" value="现金" />
            </el-select>
            <el-button :icon="Plus" @click="addFundVisible = true" />
          </div>
        </el-form-item>
        <el-form-item :label="$t('sale.client.prepayFormDate')">
          <el-date-picker v-model="prepayForm.receipt_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.client.prepayFormRemark')">
          <el-input v-model="prepayForm.remark" :placeholder="$t('sale.client.prepayFormRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="prepayVisible = false">{{ $t('sale.client.btnCancel') }}</el-button>
        <el-button type="primary" :loading="prepaySaving" @click="submitPrepay">{{ $t('sale.client.btnConfirmRecharge') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" :title="$t('sale.client.dialogAddFundTitle')" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="$t('sale.client.fundFormName')">
          <el-input v-model="fundForm.name" :placeholder="$t('sale.client.fundFormNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.client.fundFormBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ $t('sale.client.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ $t('sale.client.btnConfirmAddFund') }}</el-button>
      </template>
    </el-dialog>

    <!-- 分类新增/编辑弹框 -->
    <el-dialog v-model="cateFormVisible" :title="cateFormTitle" width="360px" append-to-body>
      <el-form label-width="90px">
        <el-form-item :label="$t('sale.client.cateFormParent')">
          <el-select v-model="cateFormPid" :placeholder="$t('sale.client.cateFormParentPlaceholder')" clearable style="width:100%">
            <el-option v-for="c in cateOptions.filter(c => !c.pid)" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sale.client.cateFormName')">
          <el-input v-model="cateFormName" :placeholder="$t('sale.client.cateFormNamePlaceholder')" @keyup.enter="handleSaveCate" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="cateFormVisible = false">{{ $t('sale.client.btnCancel') }}</el-button>
        <el-button type="primary" @click="handleSaveCate">{{ $t('sale.client.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 导入预览弹框 -->
    <el-dialog v-model="importDialogVisible" :title="$t('sale.client.dialogImportTitle')" width="70%" append-to-body destroy-on-close>
      <div style="margin-bottom:10px;font-size:13px;color:rgba(29,29,31,0.35)">
        {{ $t('sale.client.importTotalPrefix') }}{{ importPreviewData.length }}{{ $t('sale.client.importTotalSuffix') }}
      </div>
      <el-table :data="importPreviewData.slice(0, 10)" border size="small" max-height="320">
        <el-table-column
          v-for="col in (importPreviewData[0] ? Object.keys(importPreviewData[0]) : [])"
          :key="col" :prop="col" :label="col" min-width="120" show-overflow-tooltip
        />
      </el-table>
      <div v-if="importPreviewData.length > 10" style="margin-top:8px;font-size:12px;color:rgba(29,29,31,0.35)">
        {{ $t('sale.client.importShowOnly10Prefix') }}{{ importPreviewData.length }}{{ $t('sale.client.importShowOnly10Suffix') }}
      </div>
      <template #footer>
        <el-button @click="importDialogVisible = false">{{ $t('sale.client.btnCancel') }}</el-button>
        <el-button type="primary" :loading="importLoading" @click="confirmImport">{{ $t('sale.client.btnConfirmImport') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Edit, Delete, Search, Refresh, Download, Upload } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { getSaleCustomerList, getSaleCustomerDetail, createSaleCustomer, updateSaleCustomer, deleteSaleCustomer, getContractList, updateContract, getOfferList, updateOffer, getSaleOutList, updateSaleOut, getSampleList, updateSample } from '@/api/sale'
import http from '@/api/http'
import * as XLSX from 'xlsx'
import { loadLevels, loadLevelMap, saveLevelMap, type LevelItem } from '@/utils/customerLevel'
import { getCollectReceiptList, createCollectReceipt, updateCollectReceipt, getReceivableList, getFundList, createFund } from '@/api/finance'

const router = useRouter()
const { t } = useI18n()

// ── 本地分类（localStorage） ──────────────────────────────────────────────────
const CATE_KEY = 'erp_customer_cates'
const CATE_MAP_KEY = 'erp_customer_cate_map'  // { customerId: cateId }

interface CateItem { id: number; name: string; pid?: number }

function loadCatesFromStorage(): CateItem[] {
  try { return JSON.parse(localStorage.getItem(CATE_KEY) || '[]') } catch { return [] }
}
function saveCatesToStorage(list: CateItem[]) {
  localStorage.setItem(CATE_KEY, JSON.stringify(list))
}

function ensureDefaultCates(list: CateItem[]): CateItem[] {
  let changed = false
  let onlineId = list.find(c => c.name === '线上' && !c.pid)?.id ?? 0
  if (!onlineId) {
    onlineId = Date.now()
    list = [...list, { id: onlineId, name: '线上' }]
    changed = true
  }
  if (!list.find(c => c.name === '美团' && c.pid === onlineId)) {
    list = [...list, { id: onlineId + 1, name: '美团', pid: onlineId }]
    changed = true
  }
  if (changed) saveCatesToStorage(list)
  return list
}
function loadCateMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(CATE_MAP_KEY) || '{}') } catch { return {} }
}
function saveCateMap(map: Record<number, number>) {
  localStorage.setItem(CATE_MAP_KEY, JSON.stringify(map))
}

const cateOptions = ref<CateItem[]>(ensureDefaultCates(loadCatesFromStorage()))
const cateMap = ref<Record<number, number>>(loadCateMap())
const cateKeyword = ref('')
const selectedCateId = ref<number | null>(null)

// ── 客户来源（localStorage） ──────────────────────────────────────────────────
const SOURCE_MAP_KEY = 'erp_customer_source_map'
function loadSourceMap(): Record<number, string | number> {
  try { return JSON.parse(localStorage.getItem(SOURCE_MAP_KEY) || '{}') } catch { return {} }
}
function saveSourceMap(map: Record<number, string | number>) {
  localStorage.setItem(SOURCE_MAP_KEY, JSON.stringify(map))
}
const customerSourceMap = ref<Record<number, string | number>>(loadSourceMap())


const LEVEL_MAP_KEY = 'erp_customer_level_map'
function loadCustomerLevelMap(): Record<number, number> {
  try { return JSON.parse(localStorage.getItem(LEVEL_MAP_KEY) || '{}') } catch { return {} }
}
function saveCustomerLevelMap(map: Record<number, number>) {
  localStorage.setItem(LEVEL_MAP_KEY, JSON.stringify(map))
}
const levelOptions = ref<LevelItem[]>(loadLevels())
const customerLevelMap = ref<Record<number, number>>(loadCustomerLevelMap())

function getLevelName(customerId: number): string {
  const levelId = customerLevelMap.value[customerId]
  if (!levelId) return ''
  return levelOptions.value.find(l => l.id === levelId)?.name ?? ''
}

const filteredCates = computed(() => {
  const kw = cateKeyword.value
  const all = kw ? cateOptions.value.filter(c => c.name.includes(kw)) : cateOptions.value
  // 按父子顺序排列：顶级→其子分类→顶级→其子分类……
  const result: CateItem[] = []
  const roots = all.filter(c => !c.pid)
  for (const root of roots) {
    result.push(root)
    result.push(...all.filter(c => c.pid === root.id))
  }
  // 孤儿子分类（父级不在结果里时直接追加）
  all.filter(c => c.pid && !roots.find(r => r.id === c.pid)).forEach(c => result.push(c))
  return result
})

function getCateName(customerId: number): string {
  const cateId = cateMap.value[customerId]
  if (!cateId) return ''
  return cateOptions.value.find(c => c.id === cateId)?.name ?? ''
}

// 分类新增/编辑
const cateFormVisible = ref(false)
const cateFormTitle = ref(t('sale.client.dialogCateAddTitle'))
const cateFormName = ref('')
const cateFormPid = ref<number | null>(null)
let editingCateId: number | null = null

function openCateForm(row?: CateItem) {
  editingCateId = row ? row.id : null
  cateFormName.value = row ? row.name : ''
  cateFormPid.value = row?.pid ?? null
  cateFormTitle.value = row ? t('sale.client.dialogCateEditTitle') : t('sale.client.dialogCateAddTitle')
  cateFormVisible.value = true
}

function handleSaveCate() {
  const name = cateFormName.value.trim()
  if (!name) { ElMessage.warning(t('sale.client.msgInputCateName')); return }
  const list = [...cateOptions.value]
  const item: CateItem = { id: editingCateId ?? Date.now(), name }
  if (cateFormPid.value) item.pid = cateFormPid.value
  if (editingCateId !== null) {
    const idx = list.findIndex(c => c.id === editingCateId)
    if (idx !== -1) list[idx] = item
  } else {
    list.push(item)
  }
  cateOptions.value = list
  saveCatesToStorage(list)
  cateFormVisible.value = false
  ElMessage.success(t('sale.client.msgOpSuccess'))
}

function handleDeleteCate(id: number) {
  ElMessageBox.confirm(t('sale.client.confirmDeleteCate'), t('sale.client.msgTipTitle'), { type: 'warning' }).then(() => {
    const list = cateOptions.value.filter(c => c.id !== id)
    cateOptions.value = list
    saveCatesToStorage(list)
    const map = { ...cateMap.value }
    for (const k of Object.keys(map)) {
      if (map[Number(k)] === id) delete map[Number(k)]
    }
    cateMap.value = map
    saveCateMap(map)
    if (selectedCateId.value === id) selectCate(null)
    else refilter()   // 刷新当前视图
    ElMessage.success(t('sale.client.msgDeleteSuccess'))
  })
}

function selectCate(id: number | null) {
  selectedCateId.value = id
  refilter()
}

// ── 客户列表（自管理，支持前端分类过滤） ─────────────────────────────────────
const allRows = ref<any[]>([])     // 当前页后端返回的全量数据
const isMobile = ref(window.innerWidth < 768)
const loading = ref(false)
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selectedRows = ref<any[]>([])
const tableRef = ref<any>()

// 按选中分类二次过滤（选父级时同时显示其所有子分类的客户）
const filteredRows = computed(() => {
  if (selectedCateId.value === null) return allRows.value
  const sid = selectedCateId.value
  const childIds = new Set<number>([sid, ...cateOptions.value.filter(c => c.pid === sid).map(c => c.id)])
  return allRows.value.filter(row => childIds.has(cateMap.value[row.id]))
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await getSaleCustomerList({
      page: currentPage.value,
      list_rows: pageSize.value,
      keyword: keyword.value || undefined,
    })
    const data = res?.data || res
    const rawRows = data?.rows || data?.list || data?.data || []
    allRows.value = rawRows.map((r: any) => ({ ...r, nickname: r.nickname || r.name || '' }))
    total.value = data?.total || 0
  } finally {
    loading.value = false
  }
}

function refilter() {
  currentPage.value = 1
  loadDataAndBalances()
}

function handleSearch() {
  currentPage.value = 1
  loadDataAndBalances()
}

function handleReset() {
  keyword.value = ''
  currentPage.value = 1
  loadDataAndBalances()
}

// ── 客户表单 ──────────────────────────────────────────────────────────────────
const formVisible = ref(false)
const formTitle = ref(t('sale.client.dialogAddTitle'))
const formSaving = ref(false)
const formRef = ref()
let originalCustomerName = ''
const formData = reactive<any>({
  id: 0, nickname: '', mobile: '', cate_id: null, level_id: null, source: null, source_id: null, address: '', remark: '',
})

function openForm(row?: any) {
  originalCustomerName = row?.nickname || row?.name || ''
  formTitle.value = row ? t('sale.client.dialogEditTitle') : t('sale.client.dialogAddTitle')
  const nextData = {
    id: 0,
    nickname: '',
    mobile: '',
    cate_id: null as any,
    level_id: null as any,
    source: null as any,
    source_id: null as any,
    address: '',
    remark: '',
    ...(row ?? {}),
  }
  nextData.cate_id = row ? (cateMap.value[row.id] ?? null) : null
  nextData.level_id = row ? (customerLevelMap.value[row.id] ?? null) : null
  nextData.source_id = row ? (customerSourceMap.value[row.id] ?? null) : null
  Object.assign(formData, nextData)
  formVisible.value = true
  // 编辑模式：加载财务信息
  if (row?.id) {
    financeInfo.prepayBalance = 0
    financeInfo.totalPrepay = 0
    financeInfo.totalConsumed = 0
    financeInfo.unReceived = 0
    loadFinanceInfo(row.id, row.nickname || row.name || '')
  }
}

async function syncCustomerName(customerId: number, newName: string, oldName: string) {
  if (!customerId || !newName || newName === oldName) return
  const fetchRows = async (fn: Function) => {
    try {
      const res = await fn({ list_rows: 2000, customer_id: customerId })
      return (res.data?.rows ?? res.data?.list ?? []) as any[]
    } catch { return [] }
  }
  const updateRows = async (rows: any[], updateFn: Function, extra?: Record<string, any>) => {
    for (const r of rows) {
      if (Number(r.customer_id) !== Number(customerId)) continue
      try { await updateFn({ id: r.id, customer_name: newName, ...extra }) } catch { /* ignore */ }
    }
  }
  const [contracts, offers, saleOuts, samples, receipts] = await Promise.all([
    fetchRows(getContractList),
    fetchRows(getOfferList),
    fetchRows(getSaleOutList),
    fetchRows(getSampleList),
    fetchRows(getCollectReceiptList),
  ])
  await Promise.all([
    updateRows(contracts, updateContract),
    updateRows(offers, updateOffer),
    updateRows(saleOuts, updateSaleOut),
    updateRows(samples, updateSample),
    updateRows(receipts, updateCollectReceipt, { contact_name: newName }),
  ])
}

async function handleSubmit() {
  try { await formRef.value?.validate() } catch { return }
  formSaving.value = true
  try {
    const payload: any = {
      name: formData.nickname,
      nickname: formData.nickname,
      mobile: formData.mobile,
      address: formData.address,
      remark: formData.remark,
    }
    if (formData.id) payload.id = formData.id
    let customerId = formData.id
    if (customerId) {
      await updateSaleCustomer(payload)
      await syncCustomerName(customerId, formData.nickname, originalCustomerName)
    } else {
      const res = await createSaleCustomer(payload)
      customerId = res.data?.id ?? res.data
    }
    // 保存分类关联到本地
    if (customerId) {
      const cMap = { ...cateMap.value }
      if (formData.cate_id) cMap[customerId] = formData.cate_id
      else delete cMap[customerId]
      cateMap.value = cMap
      saveCateMap(cMap)
      // 保存等级关联到本地
      const lMap = { ...customerLevelMap.value }
      if (formData.level_id) lMap[customerId] = formData.level_id
      else delete lMap[customerId]
      customerLevelMap.value = lMap
      saveCustomerLevelMap(lMap)
      // 保存来源到本地
      const sMap = { ...customerSourceMap.value }
      if (formData.source_id) sMap[customerId] = formData.source_id
      else delete sMap[customerId]
      customerSourceMap.value = sMap
      saveSourceMap(sMap)
    }
    ElMessage.success(t('sale.client.msgOpSuccess'))
    formVisible.value = false
    loadDataAndBalances()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.client.msgOpFail'))
  } finally {
    formSaving.value = false
  }
}

async function handleSubmitAndRecharge() {
  try { await formRef.value?.validate() } catch { return }
  formSaving.value = true
  try {
    const payload: any = {
      name: formData.nickname,
      nickname: formData.nickname,
      mobile: formData.mobile,
      address: formData.address,
      remark: formData.remark,
    }
    const res = await createSaleCustomer(payload)
    const customerId = res.data?.id ?? res.data
    if (customerId) {
      formData.id = customerId
      const cMap2 = { ...cateMap.value }
      if (formData.cate_id) cMap2[customerId] = formData.cate_id
      cateMap.value = cMap2; saveCateMap(cMap2)
      const lMap2 = { ...customerLevelMap.value }
      if (formData.level_id) lMap2[customerId] = formData.level_id
      customerLevelMap.value = lMap2; saveCustomerLevelMap(lMap2)
      const sMap2 = { ...customerSourceMap.value }
      if (formData.source_id) sMap2[customerId] = formData.source_id
      customerSourceMap.value = sMap2; saveSourceMap(sMap2)
    }
    formVisible.value = false
    loadDataAndBalances()
    await loadFinanceInfo(formData.id, formData.nickname)
    prepayForm.amount = 0
    prepayForm.account_name = ''
    prepayForm.receipt_date = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
    prepayForm.remark = t('sale.client.defaultRechargeRemark')
    prepayVisible.value = true
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.client.msgOpFail'))
  } finally {
    formSaving.value = false
  }
}

async function handleDelete(id: number) {
  // 检查是否有预付款记录，有则阻止删除
  try {
    const res = await http.get('/finance/Prepay/index', { params: { customer_id: id, pay_type: 'customer', list_rows: 1 } })
    const list: any[] = res?.data?.rows ?? res?.data?.list ?? []
    if (list.length > 0) {
      ElMessage.warning(t('sale.client.msgDeleteFailDueToPrepay'))
      return
    }
  } catch { /* 查询失败不拦截，由后端兜底 */ }
  await ElMessageBox.confirm(t('sale.client.confirmDeleteClient'), t('sale.client.msgTipTitle'), { type: 'warning' })
  await deleteSaleCustomer(id)
  const cMap = { ...cateMap.value }
  delete cMap[id]
  cateMap.value = cMap
  saveCateMap(cMap)
  const lMap = { ...customerLevelMap.value }
  delete lMap[id]
  customerLevelMap.value = lMap
  saveCustomerLevelMap(lMap)
  ElMessage.success(t('sale.client.msgDeleteSuccess'))
  loadData()
}

async function handleBatchDelete() {
  const ids = selectedRows.value.map((r: any) => r.id).filter(Boolean)
  if (!ids.length) return
  await ElMessageBox.confirm(`${t('sale.client.confirmBatchDeletePrefix')}${ids.length}${t('sale.client.confirmBatchDeleteSuffix')}`, t('sale.client.batchDeleteTitle'), { type: 'warning' })
  await http.post('/shop/ShopCustomer/batchDel', { ids })
  ElMessage.success(`${t('sale.client.msgBatchDeletedPrefix')}${ids.length}${t('sale.client.msgBatchDeletedSuffix')}`)
  selectedRows.value = []
  loadData()
}

function handleExport() {
  const rows = allRows.value
  if (!rows.length) { ElMessage.warning(t('sale.client.msgNoDataToExport')); return }
  const data = rows.map(r => ({
    [t('sale.client.exportColName')]: r.nickname || r.name,
    [t('sale.client.exportColMobile')]: r.mobile,
    [t('sale.client.exportColEmail')]: r.email,
    [t('sale.client.exportColAddress')]: r.address,
    [t('sale.client.exportColRemark')]: r.remark,
  }))
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), 'Sheet1')
  XLSX.writeFile(wb, `${t('sale.client.exportFileName')}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
  ElMessage.success(`${t('sale.client.msgExportedPrefix')}${rows.length}${t('sale.client.msgExportedSuffix')}`)
}

const importDialogVisible = ref(false)
const importPreviewData = ref<any[]>([])
const importLoading = ref(false)

function handleImport(file: File): boolean {
  const reader = new FileReader()
  reader.onload = (e) => {
    const data = new Uint8Array(e.target!.result as ArrayBuffer)
    const wb = XLSX.read(data, { type: 'array' })
    const json: any[] = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' })
    if (!json.length) { ElMessage.warning(t('sale.client.msgExcelEmpty')); return }
    importPreviewData.value = json
    importDialogVisible.value = true
  }
  reader.readAsArrayBuffer(file)
  return false
}

async function confirmImport() {
  importLoading.value = true
  let success = 0, failed = 0
  for (const row of importPreviewData.value) {
    try {
      const mapped: any = {}
      const name = row['客户名称'] || row['nickname'] || row['name']
      if (!name) { failed++; continue }
      mapped.nickname = name; mapped.name = name
      if (row['手机号'] || row['mobile']) mapped.mobile = row['手机号'] || row['mobile']
      if (row['邮箱'] || row['email']) mapped.email = row['邮箱'] || row['email']
      if (row['地址'] || row['address']) mapped.address = row['地址'] || row['address']
      if (row['备注'] || row['remark']) mapped.remark = row['备注'] || row['remark']
      await createSaleCustomer(mapped)
      success++
    } catch { failed++ }
  }
  importLoading.value = false
  importDialogVisible.value = false
  ElMessage.success(`${t('sale.client.msgImportDoneSuccessPrefix')}${success}${t('sale.client.msgImportDoneSuccessSuffix')}${failed > 0 ? `${t('sale.client.msgImportDoneFailedPrefix')}${failed}${t('sale.client.msgImportDoneFailedSuffix')}` : ''}`)
  loadData()
}

// ── 查看 ──────────────────────────────────────────────────────────────────────
const viewVisible = ref(false)
const viewRow = ref<any>({})

function openView(row: any) {
  viewRow.value = { ...row }
  viewVisible.value = true
}

const SOURCE_NAME_KEYS: Record<number, string> = {
  1: 'sale.client.sourceDirectVisit',
  2: 'sale.client.sourceReferral',
  3: 'sale.client.sourcePhone',
  4: 'sale.client.sourceOnline',
  5: 'sale.client.sourceExhibition',
  6: 'sale.client.sourceOther',
}
function getSourceName(source: any): string {
  if (source === 'prepay' || source === '预付款充值' || source === '预收款') return t('sale.client.sourcePrepay')
  const key = SOURCE_NAME_KEYS[Number(source)]
  return key ? t(key) : ''
}

// ── 财务信息 ──────────────────────────────────────────────────────────────────
const financeLoading = ref(false)
const financeInfo = reactive({
  prepayBalance: 0,
  totalPrepay: 0,
  totalConsumed: 0,
  unReceived: 0,
})
const prepayRecords = ref<any[]>([])

async function loadFinanceInfo(customerId: number, customerName: string) {
  financeLoading.value = true
  try {
    // 查预付款记录（customer类型）
    const prepayRes = await http.get('/finance/Prepay/index', { params: { customer_id: customerId, pay_type: 'customer', list_rows: 500 } })
    const prepayList: any[] = prepayRes?.data?.rows ?? prepayRes?.data?.list ?? []
    const totalPrepay = prepayList.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    prepayRecords.value = prepayList

    // 查应收账款（消费记录）
    const receivableRes = await getReceivableList({ customer_name: customerName, list_rows: 500 })
    const receivables: any[] = receivableRes?.data?.rows ?? receivableRes?.data?.list ?? []
    const totalConsumed = receivables.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    const totalReceived = receivables.reduce((s: number, r: any) => s + Number(r.received_amount || 0), 0)
    const unReceived = Math.max(0, totalConsumed - totalReceived)

    financeInfo.totalPrepay = totalPrepay
    financeInfo.totalConsumed = totalConsumed
    financeInfo.unReceived = unReceived
    financeInfo.prepayBalance = Math.max(0, totalPrepay - totalConsumed)
  } catch {
    // 静默失败，不影响主流程
  } finally {
    financeLoading.value = false
  }
}

// ── 预付款充值 ────────────────────────────────────────────────────────────────
const prepayVisible = ref(false)
const prepaySaving = ref(false)
const prepayForm = reactive({
  amount: 0,
  account_name: '',
  receipt_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  remark: t('sale.client.defaultRechargeRemark'),
})
const fundOptions = ref<any[]>([])

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res?.data?.rows ?? res?.data?.list ?? []
  } catch { /* ignore */ }
}

const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning(t('sale.client.msgInputAccountName')); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('sale.client.msgAddAccountSuccess'))
    addFundVisible.value = false
    await loadFunds()
    prepayForm.account_name = fundForm.name.trim()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.client.msgAddFail'))
  } finally {
    addFundLoading.value = false
  }
}

async function openPrepayDialog() {
  // 新增模式：先保存客户，再开充值
  if (!formData.id) {
    try { await formRef.value?.validate() } catch { return }
    formSaving.value = true
    try {
      const payload: any = { name: formData.nickname, mobile: formData.mobile, address: formData.address, remark: formData.remark }
      const res = await createSaleCustomer(payload)
      const customerId = res.data?.id ?? res.data
      if (!customerId) { ElMessage.error(t('sale.client.msgSaveCustomerFailForRecharge')); return }
      formData.id = customerId
      const cMap = { ...cateMap.value }; if (formData.cate_id) cMap[customerId] = formData.cate_id; cateMap.value = cMap; saveCateMap(cMap)
      const lMap = { ...customerLevelMap.value }; if (formData.level_id) lMap[customerId] = formData.level_id; customerLevelMap.value = lMap; saveCustomerLevelMap(lMap)
      const sMap = { ...customerSourceMap.value }; if (formData.source_id) sMap[customerId] = formData.source_id; customerSourceMap.value = sMap; saveSourceMap(sMap)
      loadData()
      await loadFinanceInfo(customerId, formData.nickname)
    } catch (e: any) {
      ElMessage.error(e?.message ?? t('sale.client.msgSaveFail')); return
    } finally {
      formSaving.value = false
    }
  }
  prepayForm.amount = 0
  prepayForm.account_name = ''
  prepayForm.receipt_date = new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
  prepayForm.remark = t('sale.client.defaultRechargeRemark')
  prepayVisible.value = true
}

async function submitPrepay() {
  if (!prepayForm.amount || prepayForm.amount <= 0) {
    ElMessage.warning(t('sale.client.msgInputRechargeAmount')); return
  }
  prepaySaving.value = true
  try {
    // 使用预付款接口，同步更新资金账户余额和客户余额
    const fundOpt = fundOptions.value.find((f: any) => f.name === prepayForm.account_name)
    await http.post('/finance/Prepay/create', {
      pay_type: 'customer',
      customer_id: formData.id,
      customer_name: formData.nickname || formData.name,
      amount: prepayForm.amount,
      fund_id: fundOpt?.id || 0,
      fund_name: prepayForm.account_name || '',
      pay_date: prepayForm.receipt_date,
      remark: prepayForm.remark || t('sale.client.defaultRechargeRemark'),
    })
    if (formData.id) {
      const sMap = { ...customerSourceMap.value, [formData.id]: 'prepay' }
      customerSourceMap.value = sMap
      saveSourceMap(sMap)
      formData.source_id = 'prepay'
      if (viewRow.value?.id === formData.id) viewRow.value = { ...viewRow.value, source_id: 'prepay' }
    }
    ElMessage.success(t('sale.client.msgRechargeSuccess'))
    prepayVisible.value = false
    await loadData()  // 重新加载列表
    // 把最新余额同步回详情弹框
    const updated = allRows.value.find((r: any) => r.id === formData.id)
    if (updated) {
      formData.balance = updated.balance
      if (viewRow.value?.id === formData.id) viewRow.value = { ...viewRow.value, balance: updated.balance }
    }
    loadFinanceInfo(formData.id, formData.nickname)
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.client.msgRechargeFail'))
  } finally {
    prepaySaving.value = false
  }
}

function viewReceivable() {
  router.push('/finance/receivable')
}

async function handleDeletePrepay(row: any) {
  const amount = Number(row.amount || 0)
  await ElMessageBox.confirm(
    `${t('sale.client.confirmDeletePrepayLine1')}\n${t('sale.client.confirmDeletePrepayLine2Prefix')}${amount.toFixed(2)}\n${t('sale.client.confirmDeletePrepayLine3')}`,
    t('sale.client.deletePrepayTitle'),
    { type: 'warning', confirmButtonText: t('sale.client.btnConfirmDelete'), cancelButtonText: t('sale.client.btnCancel') },
  )
  await http.post('/finance/Prepay/del', { id: row.id })
  // 回退资金账户余额
  if (row.fund_id && amount > 0) {
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows || []
      const fund = funds.find((f: any) => f.id === row.fund_id)
      if (fund) {
        const newBalance = Number(fund.balance || 0) - amount
        await http.post('/finance/Fund/edit', { id: fund.id, name: fund.name, balance: newBalance })
      }
    } catch { /* ignore */ }
  }
  ElMessage.success(t('sale.client.msgPrepayDeletedRefunded'))
  await loadFinanceInfo(formData.id, formData.nickname)
  await loadBalances()
}

// ── 余额 = 预付款充值 - 已审核销售单金额 ─────────────────────────────────────
const balanceMap = ref<Record<number, number>>({})
const prepayMap = ref<Record<number, number>>({})
const saleAmountMap = ref<Record<number, number>>({})

function getSaleOrderAmountValue(row: any): number {
  const total = Number(row?.total_amount || 0)
  const discType = String(row?.discount_type || 'none')
  const discVal = Number(row?.discount_value || 0)
  const afterDisc = Number(row?.after_discount)
  const freight = Number(row?.freight_amount || 0)
  const bearer = String(row?.freight_bearer || 'seller')
  const income = Number(row?.income_amount || 0)
  let base = total
  if (Number.isFinite(afterDisc) && afterDisc >= 0) base = afterDisc
  else if (discType === 'amount' && discVal > 0) base = Math.max(0, total - discVal)
  else if (discType === 'percent' && discVal > 0) base = Math.max(0, total * (1 - discVal / 100))
  const freightCharge = bearer === 'buyer' ? freight : bearer === 'half' ? freight / 2 : 0
  return Math.max(0, base + freightCharge - income)
}

async function loadBalances() {
  try {
    const prepayRes = await http.get('/finance/Prepay/index', { params: { list_rows: 1000, pay_type: 'customer' } })
    const prepays: any[] = prepayRes.data?.rows ?? prepayRes.data?.list ?? []
    const pMap: Record<number, number> = {}
    for (const p of prepays) {
      const cid = Number(p.customer_id)
      if (cid) pMap[cid] = (pMap[cid] || 0) + Number(p.amount || 0)
    }
    prepayMap.value = pMap
  } catch { /* ignore */ }

  try {
    const contractRes = await getContractList({ list_rows: 2000, status: 1 })
    const saleOrders: any[] = contractRes.data?.rows ?? contractRes.data?.list ?? []
    const sMap: Record<number, number> = {}
    for (const s of saleOrders) {
      if (Number(s.status) !== 1) continue
      const cid = Number(s.customer_id)
      if (cid) sMap[cid] = (sMap[cid] || 0) + getSaleOrderAmountValue(s)
    }
    saleAmountMap.value = sMap
  } catch { /* ignore */ }

  // 余额 = 预付款 - 销售单金额
  const bMap: Record<number, number> = {}
  const allIds = new Set([...Object.keys(prepayMap.value), ...Object.keys(saleAmountMap.value)].map(Number))
  for (const cid of allIds) {
    bMap[cid] = Math.max(0, (prepayMap.value[cid] || 0) - (saleAmountMap.value[cid] || 0))
  }
  balanceMap.value = bMap
}

function getPrepay(customerId: number): number {
  return prepayMap.value[customerId] ?? 0
}
function getSaleAmount(customerId: number): number {
  return saleAmountMap.value[customerId] ?? 0
}
function getBalance(customerId: number): number {
  return balanceMap.value[customerId] ?? 0
}

async function loadDataAndBalances() {
  await loadData()
  await loadBalances()
}

onMounted(() => {
  loadDataAndBalances()
  loadFunds()
})
</script>

<style scoped>
.client-page { height: 100%; }

.list-layout {
  display: flex;
  height: calc(100vh - 110px);
  min-height: 500px;
}

.cate-panel {
  width: 180px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  margin-right: 12px;
}

.cate-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 12px 8px;
  border-bottom: 1px solid #f5f5f7;
  flex-shrink: 0;
}

.cate-title { font-size: 13px; font-weight: 600; color: #1d1d1f; }
.cate-search { padding: 8px 10px; flex-shrink: 0; }
.cate-tree { flex: 1; overflow-y: auto; }

.cate-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  cursor: pointer;
  transition: background 0.12s;
}
.cate-item:hover { background: #f5f7ff; }
.cate-item:hover .cate-item-actions { opacity: 1; }
.cate-item.active { background: rgba(0,113,227,0.08); color: #0071e3; font-weight: 500; }

.cate-item-name { flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.cate-item-child { padding-left: 28px; font-size: 12px; color: rgba(29,29,31,0.6); }
.cate-item-actions { display: flex; gap: 4px; opacity: 0; transition: opacity 0.12s; flex-shrink: 0; }
.act-icon { font-size: 13px; color: rgba(29,29,31,0.35); cursor: pointer; padding: 2px; }
.act-icon:hover { color: #0071e3; }
.act-icon.danger:hover { color: #dc2626; }
.cate-empty { text-align: center; color: rgba(29,29,31,0.35); font-size: 12px; padding: 20px 0; }

.client-list-wrap { flex: 1; overflow: hidden; }

.sc-table { background: #fff; border-radius: 12px; padding: 16px; height: 100%; box-sizing: border-box; display: flex; flex-direction: column; }

.sc-search {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f5f5f7;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.search-actions { display: flex; gap: 8px; }

.sc-toolbar { margin-bottom: 12px; flex-shrink: 0; display: flex; justify-content: space-between; align-items: center; }
.toolbar-left { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.toolbar-right { display: flex; gap: 4px; align-items: center; }
.selected-bar { margin-bottom: 8px; padding: 6px 12px; background: #e8f3ff; border-radius: 8px; font-size: 13px; color: #0071e3; display: flex; align-items: center; gap: 8px; flex-shrink: 0; }

.sc-pagination { display: flex; justify-content: flex-end; margin-top: 16px; flex-shrink: 0; }

.finance-panel {
  margin-top: 16px;
  border-top: 1px solid #f5f5f7;
  padding-top: 12px;
}
.finance-title { font-size: 13px; font-weight: 600; color: #1d1d1f; margin-bottom: 10px; }
.finance-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }
.finance-item { background: #f5f7fa; border-radius: 10px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; }
.fi-label { font-size: 12px; color: rgba(29,29,31,0.35); }
.fi-value { font-size: 14px; font-weight: 600; color: #1d1d1f; }
.fi-value.green { color: #16a34a; }
.fi-value.red { color: #dc2626; }
.fi-value.orange { color: #ea580c; }
.finance-actions { display: flex; gap: 8px; }
.create-time-note { font-size: 11px; color: #c0c4cc; margin-top: 10px; text-align: right; }

@media (max-width: 767px) {
  .list-layout { flex-direction: column !important; height: auto !important; }
  .cate-panel { width: 100% !important; margin-right: 0 !important; margin-bottom: 8px; border-radius: 14px; max-height: none !important; overflow: visible !important; }
  .cate-search { display: none !important; }
  .cate-header { border-bottom: none !important; padding-bottom: 4px !important; }
  .cate-tree { display: flex !important; flex-direction: row !important; flex-wrap: nowrap !important; overflow-x: auto !important; overflow-y: visible !important; gap: 6px; padding: 6px 10px !important; height: auto !important; scrollbar-width: none; }
  .cate-tree::-webkit-scrollbar { display: none; }
  .cate-item { flex-shrink: 0 !important; border-radius: 20px !important; padding: 5px 14px !important; background: #f5f5f7; border: 1px solid transparent; white-space: nowrap; display: flex !important; }
  .cate-item.active { background: rgba(0,113,227,0.08) !important; color: #0071e3 !important; border-color: rgba(0,113,227,0.2) !important; }
  .cate-item-actions { display: none !important; }
  .client-list-wrap { overflow: visible !important; }
}

/* 手机端客户卡片 */
.mobile-client-list { padding: 8px 0; }
.mobile-client-empty { text-align: center; padding: 40px; color: #c2c8d5; font-size: 14px; }
.mobile-client-card {
  background: #fff;
  border-radius: 12px;
  margin: 8px 12px;
  padding: 12px 14px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.05);
}
.mcl-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.mcl-name { font-size: 14px; font-weight: 700; color: #1d2129; }
.mcl-balance { font-size: 14px; font-weight: 700; }
.mcl-mid {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #86909c;
  margin-bottom: 8px;
}
.mcl-actions {
  display: flex;
  gap: 4px;
  border-top: 1px solid #f5f5f7;
  padding-top: 8px;
  margin-top: 4px;
}
</style>
