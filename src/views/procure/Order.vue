<template>
  <div class="order-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getProcureOrderListWithInhouse"
          :batch-del-api="batchDelProcureOrders"
          sort-by="_order_date_sort" :sort-desc="true"
          :export-file-name="$t('procure.order.exportFileName')" :params="searchForm" @reset="onSearchReset"
          show-summary :summary-method="getSummaryRow"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ((row.order_no || row.order_sn) === highlightSn ? 'row-highlight' : '')"
          :export-columns="{ order_no: $t('procure.order.exportColOrderNo'), supplier_name: $t('procure.order.exportColSupplier'), warehouse_name: $t('procure.order.exportColWarehouse'), order_date: $t('procure.order.exportColOrderDate'), delivery_date: $t('procure.order.exportColDeliveryDate'), admin_name: $t('procure.order.exportColBuyer'), total_amount: $t('procure.order.exportColTotalWithTax'), status: $t('procure.order.exportColStatus'), pay_amount: $t('procure.order.exportColPaidAmount') }">
          <template #search>
            <el-input v-model="searchForm.order_no" :placeholder="$t('procure.order.searchOrderNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('procure.order.searchGoodsName')" clearable style="width:160px" />
            <el-select v-model="searchForm.supplier_name" :placeholder="$t('procure.order.searchSupplier')" clearable filterable style="width:160px">
              <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
            </el-select>
            <el-select v-model="searchForm.status" :placeholder="$t('procure.order.searchStatus')" clearable style="width:110px">
              <el-option :label="$t('procure.order.searchStatusPending')" :value="0" />
              <el-option :label="$t('procure.order.searchStatusAudited')" :value="1" />
              <el-option :label="$t('procure.order.searchStatusRejected')" :value="2" />
              <el-option :label="$t('procure.order.searchStatusUnreconciled')" value="unreconciled" />
            </el-select>
            <el-date-picker :key="datePickerKey" v-model="dateRange" type="daterange" :range-separator="$t('procure.order.searchDateSeparator')"
              :start-placeholder="$t('procure.order.searchDateStart')" :end-placeholder="$t('procure.order.searchDateEnd')" value-format="YYYY-MM-DD"
              style="width:240px" unlink-panels :shortcuts="dateShortcuts" @change="onDateChange" />
          </template>
          <template #toolbar-right>
            <div class="status-cards">
              <div class="status-card audited" @click="searchForm.status = 1; tableRef?.refresh()">
                <div class="sc-row">
                  <span class="sc-dot audited" /><span class="sc-label">{{ $t('procure.order.statusCardAudited') }}</span>
                </div>
                <div class="sc-row">
                  <b class="sc-num">{{ summaryData.auditedCount }}</b>
                  <span class="sc-unit">{{ $t('procure.order.statusCardUnit') }}</span>
                  <span class="sc-sep" />
                  <span class="sc-money">¥{{ summaryData.auditedAmount.toFixed(2) }}</span>
                  <span class="sc-sub">{{ $t('procure.order.statusCardUnpaid') }} <span class="c-red">¥{{ summaryData.totalUnpaid.toFixed(2) }}</span></span>
                </div>
              </div>
              <div class="status-card pending" @click="searchForm.status = 0; tableRef?.refresh()">
                <div class="sc-row">
                  <span class="sc-dot pending" /><span class="sc-label">{{ $t('procure.order.statusCardPending') }}</span>
                </div>
                <div class="sc-row">
                  <b class="sc-num">{{ summaryData.pendingCount }}</b>
                  <span class="sc-unit">{{ $t('procure.order.statusCardUnit') }}</span>
                  <span class="sc-sep" />
                  <span class="sc-money">¥{{ summaryData.pendingAmount.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('procure.order.btnAdd') }}</el-button>
            <el-button type="success" :icon="Check" :loading="batchAuditing" @click="handleBatchAudit">{{ $t('procure.order.btnBatchAudit') }}</el-button>
            <el-button type="warning" :icon="RefreshLeft" :loading="batchReverseAuditing" @click="handleBatchReverseAudit">{{ $t('procure.order.btnBatchReverseAudit') }}</el-button>
          </template>
          <template #selection-actions="{ selectedRows: selRows }">
            <el-dropdown size="small" @command="(cmd: string) => handleBatchShareCmd(cmd, selRows)">
              <el-button type="success" size="small">
                {{ $t('procure.order.btnShare') }}({{ selRows.filter((r: any) => !r._isGroup).length }})<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="link">{{ $t('procure.order.shareLink') }}</el-dropdown-item>
                  <el-dropdown-item command="pdf">{{ $t('procure.order.sharePdf') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('procure.order.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('procure.order.colExpandGoodsName')" min-width="140" />
                  <el-table-column prop="goods_sn" :label="$t('procure.order.colExpandCode')" width="110" />
                  <el-table-column prop="spec" :label="$t('procure.order.colExpandSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('procure.order.colExpandUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('procure.order.colExpandNum')" width="80" align="right" />
                  <el-table-column :label="$t('procure.order.colExpandPriceWithTax')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('procure.order.colExpandTotalWithTax')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('procure.order.colExpandSupplier')" width="130">
                    <template #default="{ row: item }">{{ item.supplier_name || '—' }}</template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('procure.order.colExpandRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('procure.order.colIndex')" width="60" align="center" />
          <el-table-column :label="$t('procure.order.colOrderNo')" min-width="150">
            <template #default="{ row }">{{ row.order_no || row.order_sn || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colSupplier')" min-width="130">
            <template #default="{ row }">{{ getOrderSupplierLabel(row) }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colWarehouse')" width="110">
            <template #default="{ row }">{{ row.warehouse_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colOrderDate')" width="110">
            <template #default="{ row }">{{ getOrderListDate(row) || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colDeliveryDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.delivery_date) || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colBuyer')" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colTotalWithTax')" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ (Number(row.after_discount) > 0 ? Number(row.after_discount) : Number(row.total_amount ?? 0)).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('procure.order.statusAudited') : row.status === 2 ? $t('procure.order.statusRejected') : $t('procure.order.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colPurchaseQty')" width="90" align="center">
            <template #default="{ row }">
              <span style="font-weight:600">{{ calcOrderQty(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colInhouseQty')" width="90" align="center">
            <template #default="{ row }">
              <span v-if="getInhouseQty(row) > 0" style="color:#16a34a;font-weight:600">{{ getInhouseQty(row) }}</span>
              <span v-else style="color:rgba(29,29,31,0.2)">0</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colPaidAmount')" width="120" align="right">
            <template #default="{ row }">
              <span v-if="getPaidAmount(row) > 0" style="color:#16a34a;font-weight:600">¥{{ getPaidAmount(row).toFixed(2) }}</span>
              <span v-else style="color:rgba(29,29,31,0.2)">¥0.00</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colPayStatus')" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getPayStatus(row).type" size="small">{{ getPayStatus(row).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colAdditionalFees')" width="220" align="right">
            <template #default="{ row }">
              <template v-if="getFeeItemsForRow(row).length > 0">
                <div v-for="(fee, idx) in getFeeItemsForRow(row)" :key="idx" style="display:flex;align-items:center;justify-content:flex-end;gap:4px;line-height:1.6">
                  <span style="font-size:11px;color:rgba(29,29,31,0.5)">{{ getFeeTypeLabel(fee.name) }}</span>
                  <span style="color:#8b5cf6;font-weight:600">¥{{ Number(fee.amount).toFixed(2) }}</span>
                  <el-tag :type="getFeeItemPayStatus(row, idx).type" size="small">{{ getFeeItemPayStatus(row, idx).label }}</el-tag>
                  <el-button v-if="getFeeItemPayStatus(row, idx).label === $t('procure.order.feeStatusPending')" type="warning" link size="small" style="font-size:11px;padding:0" @click="openFeePayDialog(row, idx)">{{ $t('procure.order.btnFeePayNow') }}</el-button>
                </div>
              </template>
              <span v-else style="color:rgba(29,29,31,0.2)">—</span>
              <div v-if="row.status === 1 && getFeeItemsForRow(row).length === 0" style="margin-top:2px;text-align:right">
                <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">{{ $t('procure.order.btnAddFee') }}</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.order.colRemark')" prop="remark" min-width="120" show-overflow-tooltip />
          <el-table-column :label="$t('procure.order.colActions')" width="270" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row, row.status === 1)">{{ row.status === 1 ? $t('procure.order.actionView') : $t('procure.order.actionEdit') }}</el-button>
              <el-button v-if="row.status === 0" type="success" link size="small" @click="handleAudit(row, 1)">{{ $t('procure.order.actionAudit') }}</el-button>
              <el-button v-if="row.status === 1 && getPayStatus(row).label !== $t('procure.order.payStatusPaid')" type="success" link size="small" @click="openPayDialog(row)">{{ $t('procure.order.actionPay') }}</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleReverseAudit(row)">{{ $t('procure.order.actionReverseAudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('procure.order.actionReconciled') : $t('procure.order.actionReconcile') }}</el-button>
              <el-button type="danger" link size="small" @click="row.status === 1 ? ElMessage.warning($t('procure.order.msgDeleteAuditedWarning')) : handleDelete(row)">{{ $t('procure.order.actionDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑全页面 ── -->
    <div v-else class="form-page">
      <!-- 顶部操作栏 -->
      <div class="form-topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('procure.order.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('procure.order.formTitleView') : (fd.id ? $t('procure.order.formTitleEdit') : $t('procure.order.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('procure.order.tagAudited') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" :loading="saving && !savingAndAuditing" :disabled="saving" @click="handleSave(false)">
            {{ $t('procure.order.btnSave') }}
          </el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="savingAndAuditing" :disabled="saving" @click="handleSave(true)">
            {{ $t('procure.order.btnSaveAndAudit') }}
          </el-button>
          <el-dropdown v-if="isReadonly" @command="handleDetailShareCommand">
            <el-button type="primary">{{ $t('procure.order.btnShare2') }} <el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="link">{{ $t('procure.order.shareDetailLink') }}</el-dropdown-item>
                <el-dropdown-item command="pdf">{{ $t('procure.order.shareDetailPdf') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('procure.order.sectionBasicInfo') }}</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelOrderNo')">
                  <el-input :value="fd.order_no || fd.order_sn || $t('procure.order.orderNoAutoGenerate')" disabled :placeholder="$t('procure.order.orderNoPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelSupplier')" prop="supplier_id"
                  :rules="[{ required: true, message: $t('procure.order.supplierPlaceholder') }]">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.supplier_id" :placeholder="$t('procure.order.supplierPlaceholder')" filterable style="flex:1"
                      @change="onSupplierChange">
                      <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="openAddSupplier" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelBuyer')" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('procure.order.buyerPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelOrderDate')" prop="order_date">
                  <el-date-picker v-model="fd.order_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('procure.order.datePlaceholder')" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelDeliveryDate')" prop="delivery_date">
                  <el-date-picker v-model="fd.delivery_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('procure.order.datePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelWarehouse')" prop="warehouse_id"
                  :rules="[{ required: true, message: $t('procure.order.warehousePlaceholder'), trigger: 'change' }]">
                  <el-select v-model="fd.warehouse_id" :placeholder="$t('procure.order.warehousePlaceholder')" filterable style="width:100%"
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelNeedInvoice')">
                  <el-switch v-model="fd.need_invoice" :active-text="$t('procure.order.invoiceYes')" :inactive-text="$t('procure.order.invoiceNo')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelPayAccount')">
                  <template v-if="isReadonly">
                    <el-input :value="fd.pay_account || fd.fund_name || '—'" disabled />
                  </template>
                  <template v-else>
                    <div style="display:flex;gap:4px;width:100%">
                      <el-select v-model="fd.fund_id" :placeholder="$t('procure.order.payAccountPlaceholder')" filterable style="flex:1" @change="onFundChange">
                        <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
                      </el-select>
                      <el-button type="primary" :icon="Plus" @click="openAddFund" />
                    </div>
                  </template>
                </el-form-item>
              </el-col>

              <!-- 行3 -->
              <el-col :span="18">
                <el-form-item :label="$t('procure.order.labelRemark')">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('procure.order.remarkPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.order.labelAttachment')">
                  <div class="attach-area">
                    <el-button :icon="Paperclip" @click="attachInputRef?.click()">{{ $t('procure.order.btnUploadAttachment') }}</el-button>
                    <input ref="attachInputRef" type="file" multiple style="display:none" @change="onAttachChange" />
                    <div v-if="fd.attachments.length" class="attach-list">
                      <div v-for="(f, i) in fd.attachments" :key="i" class="attach-item">
                        <el-icon class="attach-icon"><component :is="getFileIcon(f.name)" /></el-icon>
                        <span class="attach-name" :title="f.name">{{ f.name }}</span>
                        <span class="attach-size">{{ formatSize(f.size) }}</span>
                        <el-icon class="attach-download" :title="$t('procure.order.attachDownloadTitle')" @click="downloadAttach(f)"><Download /></el-icon>
                        <el-icon class="attach-del" @click="removeAttach(i)"><Close /></el-icon>
                      </div>
                    </div>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 商品明细卡片 -->
        <div class="form-section">
          <!-- 工具栏 -->
          <div v-if="!isReadonly" class="goods-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()">{{ $t('procure.order.btnSelectGoods') }}</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">{{ $t('procure.order.btnAddGoods') }}</el-button>
              <el-button :icon="Box" size="small" @click="openBomPicker">{{ $t('procure.order.btnSelectBom') }}</el-button>
              <el-button :icon="Document" size="small" @click="openPlanPicker">{{ $t('procure.order.btnSelectPlan') }}</el-button>
              <el-button :icon="Upload" size="small">{{ $t('procure.order.btnImportGoods') }}</el-button>
              <el-button :icon="Camera" size="small">{{ $t('procure.order.btnScanGoods') }}</el-button>
            </div>
            <span class="goods-count">{{ $t('procure.order.goodsCount') }} <b>{{ fd.items.length }}</b> {{ $t('procure.order.goodsCountUnit') }}</span>
          </div>

          <!-- 手机端商品列表 -->
          <div class="mobile-goods-list">
            <div v-if="fd.items.length === 0" class="mobile-goods-empty">{{ $t('procure.order.mobileGoodsEmpty') }}</div>
            <div v-for="(row, index) in fd.items" :key="row.goods_id || row.goods_sn || index" class="mobile-goods-card">
              <div class="mobile-goods-head">
                <span class="mobile-goods-index">{{ index + 1 }}</span>
                <el-input
                  v-if="!isReadonly"
                  v-model="row.goods_name"
                  size="small"
                  class="mobile-goods-name-input"
                  :placeholder="$t('procure.order.goodsNamePlaceholder')"
                />
                <div v-else class="mobile-goods-name">{{ row.goods_name || $t('procure.order.mobileUnnamed') }}</div>
                <el-button v-if="!isReadonly" type="danger" link :icon="Delete" @click="removeItem(index)" />
              </div>

              <div class="mobile-goods-fields">
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colGoodsSn') }}</span>
                  <el-input v-if="!isReadonly" v-model="row.goods_sn" size="small" :placeholder="$t('procure.order.goodsSnPlaceholder')" />
                  <b v-else>{{ row.goods_sn || '—' }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colCategory') }}</span>
                  <b>{{ row.cate_name || '—' }}</b>
                </div>
                <div class="mobile-field mobile-field-full">
                  <span>{{ $t('procure.order.colSpec') }}</span>
                  <el-select
                    v-if="!isReadonly && row.goods_id && goodsSpecMap[row.goods_id]?.length"
                    v-model="row.spec"
                    size="small"
                    :placeholder="$t('procure.order.specSelectPlaceholder')"
                    clearable
                    @focus="fetchGoodsSpecs(row.goods_id)"
                    @change="(v: string) => onSpecChange(row, v)"
                  >
                    <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                  </el-select>
                  <el-input
                    v-else-if="!isReadonly"
                    v-model="row.spec"
                    size="small"
                    :placeholder="$t('procure.order.specInputPlaceholder')"
                    @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)"
                  />
                  <b v-else>{{ row.spec || '—' }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colUnit') }}</span>
                  <el-select
                    v-if="!isReadonly && row.goods_id && goodsUnitMap[row.goods_id]?.length > 1"
                    v-model="row.unit_name"
                    size="small"
                    @change="(v: string) => onUnitChange(row, v)"
                  >
                    <el-option v-for="u in goodsUnitMap[row.goods_id]" :key="u.unit_name" :label="u.unit_name" :value="u.unit_name" />
                  </el-select>
                  <el-input v-else-if="!isReadonly" v-model="row.unit_name" size="small" :placeholder="$t('procure.order.unitPlaceholder')" />
                  <b v-else>{{ row.unit_name || '—' }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colPurchaseNum') }}</span>
                  <el-input-number
                    v-if="!isReadonly"
                    v-model="row.num"
                    :min="0"
                    :precision="2"
                    size="small"
                    controls-position="right"
                    @change="calcItemTax(row); calcTotal()"
                  />
                  <b v-else>{{ row.num || 0 }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colPriceNoTax') }}</span>
                  <el-input-number
                    v-if="!isReadonly"
                    v-model="row.price_no_tax"
                    :min="0"
                    :precision="4"
                    size="small"
                    controls-position="right"
                    @change="onPriceNoTaxChange(row)"
                  />
                  <b v-else>{{ Number(row.price_no_tax || 0).toFixed(4) }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colTaxRatePct') }}</span>
                  <el-select v-if="!isReadonly" v-model="row.tax_rate" size="small" @change="onTaxRateChange(row)">
                    <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                  </el-select>
                  <b v-else>{{ row.tax_rate || 0 }}%</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colPriceWithTax') }}</span>
                  <el-input-number
                    v-if="!isReadonly"
                    v-model="row.price"
                    :min="0"
                    :precision="4"
                    size="small"
                    controls-position="right"
                    @change="onPriceChange(row)"
                  />
                  <b v-else>{{ Number(row.price || 0).toFixed(4) }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colTotalWithTax2') }}</span>
                  <el-input-number
                    v-if="!isReadonly"
                    v-model="(row as any)._total"
                    :min="0"
                    :precision="2"
                    size="small"
                    controls-position="right"
                    @change="(v: any) => onLineTotalChange(row, v)"
                  />
                  <b v-else>¥{{ getLineTotal(row).toFixed(2) }}</b>
                </div>
                <div class="mobile-field">
                  <span>{{ $t('procure.order.colBatch') }}</span>
                  <el-input v-if="!isReadonly" v-model="row.batch_no" size="small" :placeholder="$t('procure.order.batchPlaceholder')" />
                  <b v-else>{{ row.batch_no || '—' }}</b>
                </div>
                <div class="mobile-field mobile-field-full">
                  <span>{{ $t('procure.order.colRowSupplier') }}</span>
                  <el-select
                    v-if="!isReadonly"
                    v-model="row.supplier_id"
                    size="small"
                    :placeholder="$t('procure.order.rowSupplierPlaceholder')"
                    clearable
                    filterable
                    @change="(val: any) => { row.supplier_name = supplierOptions.find(s => s.id === val)?.name || '' }"
                  >
                    <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                  </el-select>
                  <b v-else>{{ row.supplier_name || (supplierOptions.find((s:any) => s.id === row.supplier_id)?.name) || $t('procure.order.rowSupplierSame') }}</b>
                </div>
                <div class="mobile-field mobile-field-full">
                  <span>{{ $t('procure.order.colRowRemark') }}</span>
                  <el-input v-if="!isReadonly" v-model="row.remark" size="small" :placeholder="$t('procure.order.remarkPlaceholder2')" />
                  <b v-else>{{ row.remark || '—' }}</b>
                </div>
              </div>

              <div class="mobile-goods-total">
                <span>{{ $t('procure.order.mobileTotalNoTax') }} <b>¥{{ ((row.num||0) * (row.price_no_tax||0)).toFixed(2) }}</b></span>
                <span>{{ $t('procure.order.mobileTotalTax') }} <b class="c-red">¥{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</b></span>
                <span>{{ $t('procure.order.mobileTotalWithTax') }} <b class="c-blue">¥{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</b></span>
              </div>
            </div>
          </div>

          <!-- 桌面端商品表格 -->
          <div class="goods-table-wrap desktop-goods-table">
            <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('procure.order.mobileGoodsEmpty')">
              <el-table-column type="index" width="45" align="center" fixed="left" />
              <el-table-column :label="$t('procure.order.colGoodsName')" min-width="150" fixed="left">
                <template #default="{ row }">
                  <el-input v-model="row.goods_name" size="small" :placeholder="$t('procure.order.goodsNamePlaceholder')" :disabled="isReadonly" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colGoodsSn')" width="120">
                <template #default="{ row }">
                  <el-input v-model="row.goods_sn" size="small" :placeholder="$t('procure.order.goodsSnPlaceholder')" :disabled="isReadonly" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colSpec')" width="140">
                <template #default="{ row }">
                  <el-select
                    v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                    v-model="row.spec"
                    size="small"
                    :placeholder="$t('procure.order.specSelectPlaceholder')"
                    clearable
                    :disabled="isReadonly"
                    style="width:100%"
                    @focus="fetchGoodsSpecs(row.goods_id)"
                    @change="(v: string) => onSpecChange(row, v)"
                  >
                    <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                  </el-select>
                  <el-input v-else v-model="row.spec" size="small" :placeholder="$t('procure.order.specInputPlaceholder')" :disabled="isReadonly"
                    @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colCategory')" width="100">
                <template #default="{ row }">
                  <span style="font-size:12px;color:#666">{{ row.cate_name || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colUnit')" width="90" align="center">
                <template #default="{ row }">
                  <el-select
                    v-if="row.goods_id && goodsUnitMap[row.goods_id]?.length > 1"
                    v-model="row.unit_name"
                    size="small"
                    :disabled="isReadonly"
                    style="width:100%"
                    @change="(v: string) => onUnitChange(row, v)"
                  >
                    <el-option v-for="u in goodsUnitMap[row.goods_id]" :key="u.unit_name" :label="u.unit_name" :value="u.unit_name" />
                  </el-select>
                  <el-input v-else v-model="row.unit_name" size="small" :placeholder="$t('procure.order.unitPlaceholder')" :disabled="isReadonly" />
                </template>
              </el-table-column>
              <el-table-column width="120">
                <template #header>
                  <div class="batch-header">
                    <span>{{ $t('procure.order.colPurchaseNum') }}</span>
                    <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('num')">{{ $t('procure.order.btnBatch') }}</el-button>
                  </div>
                </template>
                <template #default="{ row }">
                  <el-input-number v-model="row.num" :min="0" :precision="2" size="small"
                    controls-position="right" style="width:100%" :disabled="isReadonly" @change="calcItemTax(row); calcTotal()" />
                </template>
              </el-table-column>
              <el-table-column width="130">
                <template #header>
                  <div class="batch-header">
                    <span>{{ $t('procure.order.colPriceNoTax') }}</span>
                    <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('price_no_tax')">{{ $t('procure.order.btnBatch') }}</el-button>
                  </div>
                </template>
                <template #default="{ row }">
                  <el-input-number v-model="row.price_no_tax" :min="0" :precision="4" size="small"
                    controls-position="right" style="width:100%" :disabled="isReadonly" @change="onPriceNoTaxChange(row)" />
                </template>
              </el-table-column>
              <el-table-column width="110">
                <template #header>
                  <div class="batch-header">
                    <span>{{ $t('procure.order.colTaxRatePct') }}</span>
                    <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('tax_rate')">{{ $t('procure.order.btnBatch') }}</el-button>
                  </div>
                </template>
                <template #default="{ row }">
                  <el-select v-model="row.tax_rate" size="small" style="width:100%" :disabled="isReadonly" @change="onTaxRateChange(row)">
                    <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colTaxAmount')" width="100" align="right">
                <template #default="{ row }">
                  <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column width="130">
                <template #header>
                  <div class="batch-header">
                    <span>{{ $t('procure.order.colPriceWithTax') }}</span>
                    <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('price')">{{ $t('procure.order.btnBatch') }}</el-button>
                  </div>
                </template>
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="4" size="small"
                    controls-position="right" style="width:100%" :disabled="isReadonly" @change="onPriceChange(row)" />
                </template>
              </el-table-column>
              <el-table-column width="120" align="right">
                <template #header>
                  <div class="batch-header">
                    <span>{{ $t('procure.order.colSubtotalNoTax') }}</span>
                    <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('subtotal_no_tax')">{{ $t('procure.order.btnBatch') }}</el-button>
                  </div>
                </template>
                <template #default="{ row }">
                  <span>{{ ((row.num||0) * (row.price_no_tax||0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colTotalWithTax2')" width="130" align="right">
                <template #default="{ row }">
                  <el-input-number
                    v-if="!isReadonly"
                    v-model="(row as any)._total"
                    :min="0"
                    :precision="2"
                    size="small"
                    controls-position="right"
                    style="width:100%"
                    @change="(v: any) => onLineTotalChange(row, v)"
                  />
                  <span v-else style="color:#0071e3;font-weight:500">{{ getLineTotal(row).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colBatch')" width="130">
                <template #default="{ row }">
                  <el-input v-model="row.batch_no" size="small" :placeholder="$t('procure.order.batchPlaceholder')" :disabled="isReadonly" />
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colRowSupplier')" width="150">
                <template #default="{ row }">
                  <template v-if="isReadonly">
                    <span>{{ row.supplier_name || (supplierOptions.find((s:any) => s.id === row.supplier_id)?.name) || $t('procure.order.rowSupplierSame') }}</span>
                  </template>
                  <el-select
                    v-else
                    v-model="row.supplier_id"
                    size="small"
                    :placeholder="$t('procure.order.rowSupplierPlaceholder')"
                    clearable
                    filterable
                    style="width:100%"
                    @change="(val: any) => { row.supplier_name = supplierOptions.find(s => s.id === val)?.name || '' }"
                  >
                    <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                  </el-select>
                </template>
              </el-table-column>
              <el-table-column :label="$t('procure.order.colRowRemark')" min-width="110">
                <template #default="{ row }">
                  <el-input v-model="row.remark" size="small" :placeholder="$t('procure.order.remarkPlaceholder2')" :disabled="isReadonly" />
                </template>
              </el-table-column>
              <el-table-column v-if="!isReadonly" width="45" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="danger" link :icon="Delete" @click="removeItem($index)" />
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

        <!-- 结算信息卡片 -->
        <div class="form-section settlement-section">
          <div class="sec-title">{{ $t('procure.order.sectionSettle') }}</div>
          <div class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.order.settlePayable') }}</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.order.settleDiscountType') }}</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" :disabled="isReadonly" @change="calcSettle">
                <el-option :label="$t('procure.order.discountNone')" value="none" />
                <el-option :label="$t('procure.order.discountByAmount')" value="amount" />
                <el-option :label="$t('procure.order.discountByPercent')" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? $t('procure.order.settleDiscountPercentLabel') : $t('procure.order.settleDiscountAmountLabel') }}</span>
              <el-input-number v-model="fd.discount_value" :min="0" :disabled="isReadonly"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.order.settleAfterDiscount') }}</span>
              <span class="settle-value">¥{{ fd.after_discount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.order.settleCurrentPayment') }}</span>
              <el-input-number v-model="fd.pay_amount" :min="0" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" />
              <el-button v-if="!isReadonly" size="small" type="primary" plain
                style="margin-left:6px;padding:4px 8px;font-size:12px"
                @click="fd.pay_amount = fd.after_discount">{{ $t('procure.order.settleBtnFull') }}</el-button>
            </div>
            <div v-if="isReadonly" class="settle-item">
              <span class="settle-label">{{ $t('procure.order.settlePaidAmount') }}</span>
              <span class="settle-value" style="color:#16a34a;font-weight:700">
                ¥{{ Number(fd.pay_amount || 0).toFixed(2) }}
              </span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.order.settleInstallment') }}</span>
              <el-switch v-model="fd.installment" :disabled="isReadonly" :active-text="$t('procure.order.settleInstallmentYes')" :inactive-text="$t('procure.order.settleInstallmentNo')" />
            </div>
          </div>
          <div class="settle-summary" style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <span>{{ $t('procure.order.settleNoTaxTotal') }}<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
              <span style="margin-left:24px">{{ $t('procure.order.settleTaxTotal') }}<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
              <span style="margin-left:24px">{{ $t('procure.order.settleWithTaxTotal') }}<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
            </div>
            <!-- 附加费用：编辑时始终显示，只读时有费用才显示 -->
            <div v-if="!isReadonly || fd.fee_items.length > 0" class="settle-item fee-items-row" style="align-items:flex-start;margin-left:48px">
              <span class="settle-label" style="padding-top:6px">{{ $t('procure.order.settleAdditionalFees') }}</span>
              <div style="margin-left:8px">
                <div v-for="(fee, idx) in fd.fee_items" :key="idx" class="fee-item-line">
                  <el-select
                    v-model="fee.name"
                    size="small"
                    style="width:120px"
                    :disabled="isReadonly"
                    filterable
                    allow-create
                    default-first-option
                    :placeholder="$t('procure.order.feeTypePlaceholder')"
                  >
                    <el-option :label="$t('procure.order.feeTypeFreight')" value="freight" />
                    <el-option :label="$t('procure.order.feeTypeLoading')" value="loading" />
                    <el-option :label="$t('procure.order.feeTypeInspection')" value="inspection" />
                    <el-option :label="$t('procure.order.feeTypePacking')" value="packing" />
                    <el-option :label="$t('procure.order.feeTypeStorage')" value="storage" />
                    <el-option :label="$t('procure.order.feeTypeDocument')" value="document_expense" />
                    <el-option :label="$t('procure.order.feeTypeOther')" value="other" />
                  </el-select>
                  <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small"
                    style="width:110px;margin-left:6px" :disabled="isReadonly" />
                  <el-select v-model="fee.bearer" size="small" style="width:110px;margin-left:6px" :disabled="isReadonly">
                    <el-option :label="$t('procure.order.feeBearerBuyer')" value="buyer" />
                    <el-option :label="$t('procure.order.feeBearerSeller')" value="seller" />
                    <el-option :label="$t('procure.order.feeBearerHalf')" value="half" />
                    <el-option :label="$t('procure.order.feeBearerFree')" value="free" />
                  </el-select>
                  <template v-if="isReadonly">
                    <el-tag :type="getFeeItemPayStatus(fd, idx).type" size="small" style="margin-left:6px">
                      {{ getFeeItemPayStatus(fd, idx).label }}
                    </el-tag>
                    <el-button
                      v-if="getFeeItemPayStatus(fd, idx).label === $t('procure.order.feeStatusPending')"
                      type="warning" link size="small" style="margin-left:4px"
                      @click="openFeePayDialog(fd, idx)"
                    >{{ $t('procure.order.btnFeePayNow') }}</el-button>
                  </template>
                  <el-button v-if="!isReadonly" type="danger" link :icon="Delete" size="small"
                    style="margin-left:6px" @click="fd.fee_items.splice(idx, 1)" />
                </div>
                <el-button v-if="!isReadonly" type="primary" link size="small" :icon="Plus"
                  style="margin-top:4px" @click="fd.fee_items.push(createDefaultFeeItem())">
                  {{ $t('procure.order.btnAddFeeItem') }}
                </el-button>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="$t('procure.order.dialogAddGoodsTitle')" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('procure.order.labelGoodsName')" :rules="[{ required: true }]">
          <el-input v-model="manualForm.goods_name" :placeholder="$t('procure.order.goodsNameInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelGoodsSn2')">
          <el-input v-model="manualForm.goods_sn" :placeholder="$t('procure.order.goodsSnInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelSpecModel')">
          <el-input v-model="manualForm.spec" :placeholder="$t('procure.order.specModelPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelUnit2')">
          <el-input v-model="manualForm.unit_name" :placeholder="$t('procure.order.unitInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPurchaseNum2')">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPriceWithTax2')">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :loading="manualAddLoading" @click="confirmManualAdd">{{ $t('procure.order.btnConfirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="`${$t('procure.order.dialogBatchEditPrefix')} ${batchEditLabel}`" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ $t('procure.order.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增供应商弹框 -->
    <el-dialog v-model="addSupplierVisible" :title="$t('procure.order.dialogAddSupplierTitle')" width="380px" append-to-body>
      <el-form :model="supplierForm" label-width="80px">
        <el-form-item :label="$t('procure.order.labelSupplierName')">
          <el-input v-model="supplierForm.name" :placeholder="$t('procure.order.supplierNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSupplierVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addSupplierLoading" @click="submitAddSupplier">{{ $t('procure.order.btnConfirmAddSupplier') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" :title="$t('procure.order.dialogAddFundTitle')" width="380px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="$t('procure.order.labelFundName')">
          <el-input v-model="fundForm.name" :placeholder="$t('procure.order.fundNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFundBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ $t('procure.order.btnConfirmAddFund') }}</el-button>
      </template>
    </el-dialog>

    <!-- 付款弹窗 -->
    <el-dialog v-model="payDialogVisible" :title="$t('procure.order.dialogPayTitle')" width="400px" append-to-body>
      <el-form :model="payForm" label-width="90px">
        <el-form-item :label="$t('procure.order.labelPayOrder')">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ payForm.orderSn }} · {{ payForm.supplierName }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPayUnpaid')">
          <span style="font-size:15px;font-weight:700;color:#dc2626">¥{{ payForm.unpaid.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPayAmount')">
          <el-input-number v-model="payForm.amount" :min="0.01" :max="payForm.unpaid" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPayAccount2')">
          <el-select v-model="payForm.fund_id" :placeholder="$t('procure.order.payAccountPlaceholder')" filterable style="width:100%" @change="onPayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPayDate')">
          <el-date-picker v-model="payForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelPayRemark')">
          <el-input v-model="payForm.remark" :placeholder="$t('procure.order.payRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :loading="paySubmitting" @click="submitPay">{{ $t('procure.order.btnConfirmPay') }}</el-button>
      </template>
    </el-dialog>

    <!-- 附加费用管理弹窗（已审核后从列表补充） -->
    <el-dialog v-model="feeManageVisible" :title="$t('procure.order.dialogFeeManageTitle')" width="620px" append-to-body>
      <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5)">
        {{ feeManageRow?.order_no || feeManageRow?.order_sn }} · {{ feeManageRow?.supplier_name }}
      </div>
      <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <el-select v-model="fee.name" size="small" style="width:130px" filterable allow-create default-first-option :placeholder="$t('procure.order.feeTypePlaceholder')">
          <el-option :label="$t('procure.order.feeTypeFreight')" value="freight" />
          <el-option :label="$t('procure.order.feeTypeLoading')" value="loading" />
          <el-option :label="$t('procure.order.feeTypeInspection')" value="inspection" />
          <el-option :label="$t('procure.order.feeTypePacking')" value="packing" />
          <el-option :label="$t('procure.order.feeTypeStorage')" value="storage" />
          <el-option :label="$t('procure.order.feeTypeDocument')" value="document_expense" />
          <el-option :label="$t('procure.order.feeTypeOther')" value="other" />
        </el-select>
        <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:120px" />
        <el-select v-model="fee.bearer" size="small" style="width:110px">
          <el-option :label="$t('procure.order.feeBearerBuyer')" value="buyer" />
          <el-option :label="$t('procure.order.feeBearerSeller')" value="seller" />
          <el-option :label="$t('procure.order.feeBearerHalf')" value="half" />
          <el-option :label="$t('procure.order.feeBearerFree')" value="free" />
        </el-select>
        <el-tag v-if="getFeeItemPayStatus(feeManageRow, idx).label !== '—'" :type="getFeeItemPayStatus(feeManageRow, idx).type" size="small">
          {{ getFeeItemPayStatus(feeManageRow, idx).label }}
        </el-tag>
        <el-button
          v-if="getFeeItemPayStatus(feeManageRow, idx).label === $t('procure.order.feeStatusPending')"
          type="warning" link size="small"
          @click="openFeeManagePay(idx)"
        >{{ $t('procure.order.btnFeeManagePay') }}</el-button>
        <el-button type="danger" link :icon="Delete" size="small" @click="removeFeeManageItem(idx)" />
      </div>
      <el-button type="primary" link size="small" :icon="Plus" @click="feeManageItems.push(createDefaultFeeItem())">
        {{ $t('procure.order.btnAddFeeItem') }}
      </el-button>
      <div v-if="feeManagePayIndex >= 0" class="fee-manage-pay">
        <div class="fee-manage-pay-title">
          <span>{{ getFeeTypeLabel(feePayForm.feeName) }} {{ $t('procure.order.feeManagePayLabel') }}</span>
          <el-button link size="small" @click="feeManagePayIndex = -1">{{ $t('procure.order.btnFeeManageCollapse') }}</el-button>
        </div>
        <el-form :model="feePayForm" label-width="90px">
          <el-form-item :label="$t('procure.order.labelFeeAmount')">
            <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
          </el-form-item>
          <el-form-item :label="$t('procure.order.labelFeePayAccount')">
            <el-select v-model="feePayForm.fund_id" :placeholder="$t('procure.order.payAccountPlaceholder')" filterable style="width:100%" @change="onFeePayFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('procure.order.labelFeePayContact')">
            <el-select v-model="feePayForm.contact_name" filterable allow-create :placeholder="$t('procure.order.feePayContactPlaceholder')" style="width:100%" clearable>
              <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('procure.order.labelFeePayDate')">
            <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item :label="$t('procure.order.labelFeePayRemark')">
            <el-input v-model="feePayForm.remark" :placeholder="$t('procure.order.payRemarkPlaceholder')" />
          </el-form-item>
        </el-form>
        <div class="fee-manage-pay-actions">
          <el-button @click="feeManagePayIndex = -1">{{ $t('procure.order.btnCancelPay') }}</el-button>
          <el-button type="primary" :loading="feePaySubmitting" @click="submitFeeManagePay">{{ $t('procure.order.btnConfirmFeeManagePay') }}</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="feeManageVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :loading="feeManageSaving" @click="submitFeeManage">{{ $t('procure.order.btnSave2') }}</el-button>
      </template>
    </el-dialog>

    <!-- 费用付款弹窗（统一：运费/单据支出/其他附加费用） -->
    <el-dialog v-model="feePayVisible" :title="`${getFeeTypeLabel(feePayForm.feeName)} ${$t('procure.order.dialogFeePayTitleSuffix')}`" width="420px" append-to-body>
      <el-form :model="feePayForm" label-width="90px">
        <el-form-item :label="$t('procure.order.labelFeeOrder')">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ feePayForm.orderSn }} · {{ feePayForm.supplierName }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFeeType')">
          <span style="font-weight:600">{{ getFeeTypeLabel(feePayForm.feeName) }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFeeCost')">
          <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFeeAccount')">
          <el-select v-model="feePayForm.fund_id" :placeholder="$t('procure.order.payAccountPlaceholder')" filterable style="width:100%" @change="onFeePayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFeeContact')">
          <el-select v-model="feePayForm.contact_name" filterable allow-create :placeholder="$t('procure.order.feePayContactPlaceholder')" style="width:100%" clearable>
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFeeDate')">
          <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.order.labelFeeRemark')">
          <el-input v-model="feePayForm.remark" :placeholder="$t('procure.order.payRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feePayVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :loading="feePaySubmitting" @click="submitFeePay">{{ $t('procure.order.btnConfirmFeePayment') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量付款弹窗 -->    <el-dialog v-model="batchPayVisible" :title="$t('procure.order.dialogBatchPayTitle')" width="600px" append-to-body>
      <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <el-select v-model="batchPayFundId" :placeholder="$t('procure.order.batchPaySelectAccount')" filterable style="width:180px" @change="onBatchPayFundChange">
          <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-date-picker v-model="batchPayDate" type="date" value-format="YYYY-MM-DD" style="width:150px" :placeholder="$t('procure.order.batchPayDatePlaceholder')" />
        <span style="margin-left:auto;font-size:13px;color:#6b7280">{{ $t('procure.order.batchPaySummaryPrefix') }} {{ batchPayItems.length }} {{ $t('procure.order.batchPaySummaryUnit') }}
          <span style="font-weight:700;color:#dc2626">¥{{ batchPayTotal.toFixed(2) }}</span>
        </span>
      </div>
      <el-table :data="batchPayItems" border size="small" max-height="320">
        <el-table-column prop="supplierName" :label="$t('procure.order.colBatchPaySupplier')" min-width="110" show-overflow-tooltip />
        <el-table-column prop="orderSn" :label="$t('procure.order.colBatchPayOrderNo')" min-width="130" show-overflow-tooltip />
        <el-table-column :label="$t('procure.order.colBatchPayUnpaid')" width="100" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626">¥{{ row.unpaid.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('procure.order.colBatchPayAmount')" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.amount" :min="0" :max="row.unpaid" :precision="2" size="small" style="width:100%" controls-position="right" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchPayVisible = false">{{ $t('procure.order.btnSkipPay') }}</el-button>
        <el-button type="primary" :loading="batchPaySubmitting" @click="submitBatchPay">{{ $t('procure.order.btnConfirmBatchPay') }}</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="bomPickerVisible" :title="$t('procure.order.dialogBomTitle')" width="800px" append-to-body>
      <div style="display:flex;gap:12px;height:420px">
        <!-- 左：成品列表 -->
        <div style="width:220px;flex-shrink:0;border:1px solid #e4e7ed;border-radius:6px;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:10px;border-bottom:1px solid #f5f5f7;flex-shrink:0">
            <el-input v-model="bomPickerKeyword" :placeholder="$t('procure.order.bomSearchPlaceholder')" clearable size="small" :prefix-icon="Search" />
          </div>
          <div style="flex:1;overflow-y:auto" v-loading="bomPickerLoading">
            <div
              v-for="g in filteredBomGoods"
              :key="g.goods_id"
              style="padding:9px 12px;cursor:pointer;font-size:13px;transition:background 0.12s"
              :style="selectedBomGoods?.goods_id === g.goods_id ? 'background:rgba(0,113,227,0.08);color:#0071e3;font-weight:500' : 'color:rgba(29,29,31,0.5)'"
              @click="selectBomGoods(g)"
            >
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ g.goods_name }}</div>
              <div v-if="g.goods_sn" style="font-size:11px;color:rgba(29,29,31,0.35);margin-top:2px">{{ g.goods_sn }}</div>
            </div>
            <div v-if="!bomPickerLoading && filteredBomGoods.length === 0"
              style="text-align:center;color:rgba(29,29,31,0.35);font-size:13px;padding:24px 12px">{{ $t('procure.order.bomNoGoods') }}</div>
          </div>
        </div>
        <!-- 右：物料列表 -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5);flex-shrink:0">
            {{ selectedBomGoods ? `「${selectedBomGoods.goods_name}」${$t('procure.order.bomMaterialListLabel')}` : $t('procure.order.bomSelectPrompt') }}
          </div>
          <el-table
            ref="bomMaterialTableRef"
            :data="bomMaterials"
            v-loading="bomMaterialsLoading"
            border
            height="360"
            @selection-change="onBomMaterialSelectionChange"
          >
            <el-table-column type="selection" width="45" />
            <el-table-column prop="material_name" :label="$t('procure.order.colMaterialName')" min-width="140" />
            <el-table-column prop="material_sn" :label="$t('procure.order.colMaterialSn')" width="110" />
            <el-table-column prop="num" :label="$t('procure.order.colMaterialNum')" width="80" align="center" />
            <el-table-column prop="unit_name" :label="$t('procure.order.colMaterialUnit')" width="70" align="center" />
            <el-table-column prop="remark" :label="$t('procure.order.colMaterialRemark')" min-width="100" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span style="color:rgba(29,29,31,0.35);font-size:13px">{{ $t('procure.order.bomSelectedCount') }} {{ selectedBomMaterials.length }} {{ $t('procure.order.bomSelectedUnit') }}</span>
        <el-button style="margin-left:12px" @click="bomPickerVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedBomMaterials.length" @click="confirmBomGoods">{{ $t('procure.order.btnBomConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 采购计划选择对话框 -->
    <el-dialog v-model="planPickerVisible" :title="$t('procure.order.dialogPlanTitle')" width="820px" append-to-body>
      <div style="display:flex;gap:12px;height:420px">
        <!-- 左：计划列表 -->
        <div style="width:230px;flex-shrink:0;border:1px solid #e4e7ed;border-radius:6px;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:10px;border-bottom:1px solid #f5f5f7;flex-shrink:0">
            <el-input v-model="planPickerKeyword" :placeholder="$t('procure.order.planSearchPlaceholder')" clearable size="small" :prefix-icon="Search" />
          </div>
          <div style="flex:1;overflow-y:auto" v-loading="planPickerLoading">
            <div
              v-for="p in filteredPlanList" :key="p.id"
              style="padding:9px 12px;cursor:pointer;font-size:13px;transition:background 0.12s;border-bottom:1px solid #f5f5f5"
              :style="selectedPlan?.id === p.id ? 'background:rgba(0,113,227,0.08);color:#0071e3;font-weight:500' : 'color:rgba(29,29,31,0.5)'"
              @click="selectPlan(p)"
            >
              <div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ p.order_sn }}</div>
              <div style="font-size:11px;color:rgba(29,29,31,0.35);margin-top:2px">
                {{ p.supplier_name || '—' }} · {{ fmtDt(p.plan_date || p.created_at) }}
              </div>
            </div>
            <div v-if="!planPickerLoading && filteredPlanList.length === 0"
              style="text-align:center;color:rgba(29,29,31,0.35);font-size:13px;padding:24px 12px">{{ $t('procure.order.planNoAuditedPlans') }}</div>
          </div>
        </div>
        <!-- 右：计划商品列表 -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5);flex-shrink:0">
            {{ selectedPlan ? `「${selectedPlan.order_sn}」${$t('procure.order.planGoodsListLabel')}` : $t('procure.order.planSelectPrompt') }}
          </div>
          <el-table
            ref="planItemTableRef"
            :data="planItems"
            border
            height="360"
            size="small"
            @selection-change="(v: any[]) => selectedPlanItems = v"
          >
            <el-table-column type="selection" width="45" />
            <el-table-column prop="goods_name" :label="$t('procure.order.colPlanGoodsName')" min-width="140" />
            <el-table-column prop="goods_sn" :label="$t('procure.order.colPlanGoodsSn')" width="110" />
            <el-table-column prop="spec" :label="$t('procure.order.colPlanSpec')" width="90" />
            <el-table-column prop="num" :label="$t('procure.order.colPlanNum')" width="90" align="center" />
            <el-table-column prop="unit_name" :label="$t('procure.order.colPlanUnit')" width="65" align="center" />
            <el-table-column prop="price" :label="$t('procure.order.colPlanPrice')" width="90" align="right" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span style="color:rgba(29,29,31,0.35);font-size:13px">{{ $t('procure.order.planSelectedCount') }} {{ selectedPlanItems.length }} {{ $t('procure.order.planSelectedUnit') }}</span>
        <el-button style="margin-left:12px" @click="planPickerVisible = false">{{ $t('procure.order.btnCancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedPlanItems.length" @click="confirmPlanItems">{{ $t('procure.order.btnPlanConfirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted, onActivated, nextTick } from 'vue'
import { Plus, Delete, ArrowLeft, EditPen, Document, Box, Upload, Camera, Paperclip, Download, Close, Check, RefreshLeft, ArrowDown } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import { useRoute } from 'vue-router'
import ScTable from '@/components/ScTable.vue'
import { getProcureOrderList, createProcureOrder, updateProcureOrder, deleteProcureOrder, getSupplierList, createSupplier, auditProcureOrder, createProcureInhouse, auditProcureInhouse, getProcureInhouseList, getProcureReturnList } from '@/api/procure'
import { getWarehouseList } from '@/api/warehouse'
import { getBomList, getBomByGoods, getUnitConvert, updateGoods, saveUnitConvert, getGoodsList, getUnitList, createGoods } from '@/api/goods'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getFundList, createFund, getPayReceiptList, createPayReceipt, deletePayReceipt, createExpense } from '@/api/finance'
import http from '@/api/http'
import StaffSelect from '@/components/StaffSelect.vue'
import { getStaffList } from '@/api/personnel'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect } from '@/utils/stockEffect'
import { fmtDt } from '@/utils/date'
import { getSyncedDefaultWarehouseId } from '@/utils/defaultWarehouse'
import { showLogoForCurrentUser, brandHeaderHtmlPdf } from '@/utils/brandAssets'

// ── i18n ─────────────────────────────────────────────────────────────────────
const { t } = useI18n()

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()

const KAONAIPI_SN = 'SP0000053'
const KAONAIPI_BASE_UNIT = '斤'
const KAONAIPI_AUX_UNIT = '盒'
const KAONAIPI_BASE_COST = 22
const KAONAIPI_AUX_RATIO = 0.5 // 1盒=0.5斤（1斤=2盒）
const kaonaiPiRepairDone = new Set<number>()
const kaonaiPiUnitMigrating = ref(false)
let kaonaiPiJinUnitId: number | null = null

const PROCURE_FEE_TYPE_MAP: Record<string, string> = {
  freight: 'freight',
  '运费': 'freight',
  loading: 'loading',
  '装卸费': 'loading',
  inspection: 'inspection',
  '检测费': 'inspection',
  packing: 'packing',
  '包装费': 'packing',
  storage: 'storage',
  '仓储费': 'storage',
  document_expense: 'document_expense',
  document: 'document_expense',
  '单据支出': 'document_expense',
  other: 'other',
  '其他费用': 'other',
}

function normalizeFeeTypeName(name: any): string {
  const raw = String(name || '').trim()
  return PROCURE_FEE_TYPE_MAP[raw] || raw
}

function getFeeTypeLabel(name: any): string {
  const normalized = normalizeFeeTypeName(name)
  if (normalized === 'freight') return t('procure.order.feeTypeFreight')
  if (normalized === 'loading') return t('procure.order.feeTypeLoading')
  if (normalized === 'inspection') return t('procure.order.feeTypeInspection')
  if (normalized === 'packing') return t('procure.order.feeTypePacking')
  if (normalized === 'storage') return t('procure.order.feeTypeStorage')
  if (normalized === 'document_expense') return t('procure.order.feeTypeDocument')
  if (normalized === 'other') return t('procure.order.feeTypeOther')
  return String(name || '').trim()
}

function createDefaultFeeItem() {
  return { name: 'freight', amount: 0, bearer: 'buyer' }
}

function normalizeFeeItems(items: any[]): { name: string; amount: number; bearer: string }[] {
  return (items || [])
    .map((fee: any) => ({
      name: normalizeFeeTypeName(fee?.name),
      amount: Number(fee?.amount || 0),
      bearer: String(fee?.bearer || 'buyer'),
    }))
    .filter((fee) => fee.name && fee.amount >= 0)
}

function isKaoNaiPiGoods(input: any): boolean {
  return String(input?.goods_sn || '').trim().toUpperCase() === KAONAIPI_SN
}

function shouldForceKaoNaiPiJinUnit(item: any): boolean {
  if (!isKaoNaiPiGoods(item)) return false
  const priceNoTax = Number(item?.price_no_tax || 0)
  const price = Number(item?.price || 0)
  const unitName = String(item?.unit_name || '').trim()
  if (unitName === KAONAIPI_BASE_UNIT) return false
  return Math.abs(priceNoTax - KAONAIPI_BASE_COST) < 0.0001 || Math.abs(price - KAONAIPI_BASE_COST) < 0.0001
}

function applyKaoNaiPiRowDefaults(row: any) {
  if (!isKaoNaiPiGoods(row)) return
  row.unit_name = KAONAIPI_BASE_UNIT
  row.unit_ratio = 1
  row._base_price_no_tax = KAONAIPI_BASE_COST
  row.price_no_tax = KAONAIPI_BASE_COST
  if (!(Number(row.tax_rate) >= 0)) row.tax_rate = 0
  calcItemTax(row)
}

function normalizeKaoNaiPiLegacyItem(item: any): boolean {
  if (!shouldForceKaoNaiPiJinUnit(item)) return false
  item.unit_name = KAONAIPI_BASE_UNIT
  item.unit_ratio = 1
  item._base_price_no_tax = KAONAIPI_BASE_COST
  item.price_no_tax = KAONAIPI_BASE_COST
  if (!(Number(item.tax_rate) >= 0)) item.tax_rate = 0
  item.price = Number((KAONAIPI_BASE_COST * (1 + Number(item.tax_rate || 0) / 100)).toFixed(4))
  return true
}

async function repairKaoNaiPiMasterData(goods: any) {
  if (!isKaoNaiPiGoods(goods)) return
  const goodsId = Number(goods?.id || 0)
  if (!goodsId || kaonaiPiRepairDone.has(goodsId)) return
  kaonaiPiRepairDone.add(goodsId)
  try {
    if (!kaonaiPiJinUnitId) {
      const unitRes = await getUnitList({ list_rows: 500 })
      const units: any[] = unitRes?.data?.rows ?? []
      const jin = units.find((u: any) => String(u?.name || '').trim() === KAONAIPI_BASE_UNIT)
      kaonaiPiJinUnitId = jin?.id ? Number(jin.id) : null
    }
    await updateGoods({
      id: goodsId,
      unit_id: kaonaiPiJinUnitId || undefined,
      unit_name: KAONAIPI_BASE_UNIT,
      cost_price: KAONAIPI_BASE_COST,
    })
    await saveUnitConvert({
      goods_id: goodsId,
      units: [
        { unit_name: KAONAIPI_BASE_UNIT, ratio: 1 },
        { unit_name: KAONAIPI_AUX_UNIT, ratio: KAONAIPI_AUX_RATIO },
      ],
    })
    goodsUnitMap[goodsId] = [
      { unit_name: KAONAIPI_BASE_UNIT, ratio: 1, cost_price: KAONAIPI_BASE_COST },
      { unit_name: KAONAIPI_AUX_UNIT, ratio: KAONAIPI_AUX_RATIO, cost_price: Number((KAONAIPI_BASE_COST * KAONAIPI_AUX_RATIO).toFixed(2)) },
    ]
  } catch (e: any) {
    console.warn('修复烤奶皮单位主数据失败', e?.message)
  }
}

async function ensureKaoNaiPiMasterData() {
  try {
    const res = await getGoodsList({ keyword: KAONAIPI_SN, list_rows: 50 })
    const rows: any[] = res?.data?.rows ?? []
    const target = rows.find((r: any) => isKaoNaiPiGoods(r))
    if (target) await repairKaoNaiPiMasterData(target)
  } catch (e: any) {
    console.warn('检查烤奶皮主数据失败', e?.message)
  }
}

async function syncGoodsCostPriceFromItems(items: any[]) {
  const statMap = new Map<number, { qty: number; amount: number; fallback: number }>()
  for (const rawItem of (items || [])) {
    const goodsId = Number(rawItem?.goods_id || 0)
    if (!goodsId) continue
    const qty = Math.max(0, Number(rawItem?.num || 0))
    // unit_ratio: 采购单位相对于基础单位的倍率（基础单位=1）
    const unitRatio = Math.max(0.0001, Number(rawItem?.unit_ratio || 1))
    const taxRate = Math.max(0, Number(rawItem?.tax_rate || 0))
    const price = Number(rawItem?.price || 0)
    const priceNoTax = Number(rawItem?.price_no_tax || 0)
    const purchaseUnitCost = priceNoTax > 0
      ? priceNoTax
      : (price > 0 ? (taxRate > 0 ? price / (1 + taxRate / 100) : price) : 0)
    if (purchaseUnitCost <= 0) continue

    // cost_price 始终存基础单位单价；_base_price_no_tax 是 onUnitChange 维护的基础单价，优先用
    const baseUnitCost = Number(rawItem?._base_price_no_tax || 0) > 0
      ? Number(rawItem._base_price_no_tax)
      : purchaseUnitCost / unitRatio
    const baseQty = qty * unitRatio  // 换算为基础单位数量

    const current = statMap.get(goodsId) || { qty: 0, amount: 0, fallback: baseUnitCost }
    if (baseQty > 0) {
      current.qty += baseQty
      current.amount += baseUnitCost * baseQty
    } else {
      current.fallback = baseUnitCost
    }
    statMap.set(goodsId, current)
  }

  for (const [goodsId, stat] of statMap.entries()) {
    const avg = stat.qty > 0 ? (stat.amount / stat.qty) : stat.fallback
    if (avg > 0) {
      try {
        await updateGoods({ id: goodsId, cost_price: Number(avg.toFixed(4)) })
      } catch (e: any) {
        console.warn('回写商品成本价失败', goodsId, e?.message)
      }
    }
  }
}

async function migrateKaoNaiPiUnitsInPurchaseOrders() {
  if (kaonaiPiUnitMigrating.value) return
  const todayKey = new Date().toISOString().slice(0, 10)
  const migrateKey = `erp_kaonai_pi_unit_migrated_${todayKey}`
  if (localStorage.getItem(migrateKey) === '1') return

  kaonaiPiUnitMigrating.value = true
  try {
    const res = await getProcureOrderList({ list_rows: 5000, page: 1 })
    const rows: any[] = res?.data?.rows ?? []
    let fixedOrders = 0
    for (const row of rows) {
      let items: any[] = []
      try { items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { items = [] }
      if (!items.length) continue
      let changed = false
      const normalized = items.map((item: any) => {
        const next = { ...item }
        if (normalizeKaoNaiPiLegacyItem(next)) changed = true
        return next
      })
      if (!changed) continue
      try {
        await updateProcureOrder({ id: row.id, goods_info: JSON.stringify(normalized) })
        fixedOrders++
      } catch (e: any) {
        console.warn('修复采购单烤奶皮单位失败', row?.id, e?.message)
      }
    }
    localStorage.setItem(migrateKey, '1')
    if (fixedOrders > 0) {
      ElMessage.success(`Fixed unit for ${fixedOrders} order(s): KaoNaiPi -> jin`)
      tableRef.value?.refresh()
    }
  } catch (e: any) {
    console.warn('批量修复采购单单位失败', e?.message)
  } finally {
    kaonaiPiUnitMigrating.value = false
  }
}

// ── 批量审核 / 反审核 ────────────────────────────────────────────────────────
const batchAuditing = ref(false)
const batchReverseAuditing = ref(false)

async function handleBatchAudit() {
  const selected: any[] = tableRef.value?.selectedRows ?? []
  if (!selected.length) { ElMessage.warning(t('procure.order.msgBatchAuditSelectFirst')); return }
  const pending = selected.filter(r => Number(r.status) !== 1)
  if (!pending.length) { ElMessage.warning(t('procure.order.msgBatchAuditAllDone')); return }
  await ElMessageBox.confirm(`${t('procure.order.msgBatchAuditConfirmPrefix')} ${pending.length} ${t('procure.order.msgBatchAuditConfirmSuffix')}`, t('procure.order.msgPrompt'), { type: 'warning' })
  batchAuditing.value = true
  let success = 0, failed = 0
  for (const row of pending) {
    try {
      await auditProcureOrder(row.id, 1)
      try {
        const items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]')
        await syncGoodsCostPriceFromItems(items)
      } catch (e: any) {
        console.warn('批量审核回写成本价失败', row?.id, e?.message)
      }
      try {
        const _allInhouse1 = await getProcureInhouseList({ list_rows: 2000 })
        const existRows: any[] = (_allInhouse1.data?.rows ?? []).filter((r: any) => Number(r.purchase_order_id) === Number(row.id))
        if (existRows.length === 0) {
          const items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]')
          const inhouseRes = await createProcureInhouse({
            purchase_order_id: row.id,
            supplier_id: row.supplier_id,
            supplier_name: row.supplier_name,
            warehouse_id: row.warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id')) || 0,
            warehouse_name: row.warehouse_name || warehouseOptions.value.find((w: any) => w.id === (row.warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id'))))?.name || '',
            admin_name: row.admin_name || '',
            in_date: (row.order_date || row.created_at || '').slice(0, 10),
            total_amount: row.total_amount,
            remark: row.remark || '',
            goods_info: items,
          })
          const inhouseId = inhouseRes.data?.id ?? inhouseRes.data
          if (inhouseId) await auditProcureInhouse(inhouseId, 1)
        } else {
          const sorted = [...existRows].sort((a, b) => b.id - a.id)
          for (const r of sorted.slice(1)) { try { await http.post('/stock/ProcureInhouse/del', { ids: r.id }) } catch {} }
          if (sorted[0].status !== 1) await auditProcureInhouse(sorted[0].id, 1)
        }
      } catch (e: any) {
        ElMessage.error(t('procure.order.msgInhouseFailed') + (e?.message || ''))
        console.warn('自动创建入库单失败', e?.message)
      }
      success++
    } catch { failed++ }
  }
  batchAuditing.value = false
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  await loadPaidMap()
  ElMessage.success(`${t('procure.order.msgBatchAuditSuccess')} ${success}${failed ? `${t('procure.order.msgBatchAuditFailed')} ${failed}` : ''}`)
  if (success > 0) openBatchPayDialog(pending)
}

async function handleBatchReverseAudit() {
  const selected: any[] = tableRef.value?.selectedRows ?? []
  if (!selected.length) { ElMessage.warning(t('procure.order.msgBatchReverseSelectFirst')); return }
  const audited = selected.filter(r => Number(r.status) === 1)
  if (!audited.length) { ElMessage.warning(t('procure.order.msgBatchReverseNoneAudited')); return }
  await ElMessageBox.confirm(`${t('procure.order.msgBatchReverseConfirmPrefix')} ${audited.length} ${t('procure.order.msgBatchReverseConfirmSuffix')}`, t('procure.order.msgPrompt'), { type: 'warning' })
  batchReverseAuditing.value = true
  let success = 0, failed = 0

  const [inhouseRes, payRes, otherOutRes] = await Promise.all([
    getProcureInhouseList({ list_rows: 2000 }),
    getPayReceiptList({ list_rows: 2000 }),
    http.get('/stock/OtherOut/index', { params: { list_rows: 2000 } }),
  ])
  const allInhouse: any[] = inhouseRes.data?.rows ?? []
  const allPay: any[] = payRes.data?.rows ?? []
  const allOtherOut: any[] = otherOutRes.data?.rows ?? []

  for (const row of audited) {
    try {
      // 1. 反审核入库单 + 删除对应 BOM 扣料单（不创建反向单，直接删原始单据）
      const inhouseRows = allInhouse.filter((r: any) => Number(r.purchase_order_id) === Number(row.id))
      for (const r of inhouseRows) {
        if (r.status === 1) {
          await auditProcureInhouse(r.id, 0)
          const rItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const bomNames = rItems.map((i: any) => i.goods_name || i.goods_sn).filter(Boolean)
          const relatedOut = allOtherOut.filter((o: any) =>
            bomNames.some((name: string) => String(o.remark || '').includes(`BOM扣料-${name}`))
          )
          for (const o of relatedOut) {
            try {
              await http.post('/stock/OtherOut/annul', { id: o.id })
            } catch (e: any) { console.warn('删除BOM扣料单失败', o.id, e?.message) }
          }
        }
      }

      // 2. 反审核采购单
      await auditProcureOrder(row.id, 0)

      // 3. 回流财务：删除关联付款单
      const orderSn = String(row.order_no || row.order_sn || '').trim()
      const toDelete = allPay.filter((r: any) => {
        if (Number(r.order_id) === Number(row.id)) return true
        const remark = String(r.remark || '')
        if (new RegExp(`#${row.id}\\b`).test(remark)) return true
        if (orderSn && String(r.order_sn || '').trim() === orderSn) return true
        return false
      })
      for (const pay of toDelete) {
        try { await deletePayReceipt(pay.id) } catch {}
      }

      success++
    } catch { failed++ }
  }
  batchReverseAuditing.value = false
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  loadPaidMap()
  ElMessage.success(`${t('procure.order.msgBatchReverseSuccess')} ${success}${failed ? `${t('procure.order.msgBatchAuditFailed')} ${failed}` : ''}`)
}

// ── 列表 ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const highlightSn = ref('')
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, ids: reconciledIds } = useReconcile('reconcile_procure_order', tableRef)

// 合计数据
const summaryData = reactive({
  count: 0,
  totalQty: '0',
  totalInhouseQty: '0',
  totalAmount: 0,
  auditedCount: 0,
  auditedAmount: 0,
  totalPaid: 0,
  totalUnpaid: 0,
  pendingCount: 0,
  pendingAmount: 0,
  totalExpense: 0,
})
const lastSummaryRows = ref<any[]>([])

function updateSummary() {
  updateSummaryFromRows(lastSummaryRows.value)
}

function getSummaryRow({ columns }: { columns: any[] }) {
  const d = summaryData
  return columns.map((col, i) => {
    if (i === 0) return t('procure.order.summaryTotal')
    const label = col.label ?? ''
    if (label === t('procure.order.colTotalWithTax')) return `¥${d.totalAmount.toFixed(2)}`
    if (label === t('procure.order.colPurchaseQty')) return d.totalQty
    if (label === t('procure.order.colInhouseQty')) return d.totalInhouseQty
    if (label === t('procure.order.colPaidAmount')) return `¥${d.totalPaid.toFixed(2)}`
    if (label === t('procure.order.feeTypeDocument')) return `¥${d.totalExpense.toFixed(2)}`
    return ''
  })
}

function getOrderListDate(row: any) {
  return fmtDt(row?.order_date || row?.created_at || row?.create_time || row?.add_time || row?.updated_at).slice(0, 10)
}

function hydrateOrderListSortDates(rows: any[]) {
  for (const row of rows) {
    row._order_date_sort = getOrderListDate(row)
  }
}

// 包装 API：加载完采购单后，批量查入库单并填充 inhouse_qty
async function getProcureOrderListWithInhouse(params: any) {
  const isUnreconciled = params.status === 'unreconciled'
  const needClientFilter = !!(params.goods_name || params.start_date || params.end_date) || isUnreconciled
  const fetchParams = needClientFilter ? { ...params, list_rows: 10000, page: 1 } : params
  if (isUnreconciled) delete (fetchParams as any).status
  const res = await getProcureOrderList(fetchParams)
  const rows: any[] = res?.data?.rows ?? res?.data ?? []
  hydrateOrderListSortDates(rows)
  if (rows.length) {
    try {
      const inhouseRes = await getProcureInhouseList({ list_rows: 10000 })
      const inhouseRows: any[] = (inhouseRes?.data?.rows ?? []).filter((r: any) => r.status === 1)
      const qtyMap: Record<number, number> = {}
      for (const r of inhouseRows) {
        const oid = Number(r.purchase_order_id)
        if (!oid) continue
        const items = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
        const qty = items.reduce((s: number, g: any) => s + Number(g.num || 0) * Number(g.unit_ratio || 1), 0)
        qtyMap[oid] = (qtyMap[oid] || 0) + qty
      }
      for (const row of rows) {
        row.inhouse_qty = qtyMap[row.id] || 0
      }
    } catch { /* 查不到入库单不影响列表展示 */ }
  }
  // 前端过滤：按商品名 + 日期范围
  if (needClientFilter) {
    let filtered = rows
    if (params.goods_name) {
      const kw = params.goods_name.toLowerCase()
      filtered = filtered.filter((row: any) => {
        const items = Array.isArray(row.goods_info) ? row.goods_info : (() => { try { return JSON.parse(row.goods_info || '[]') } catch { return [] } })()
        return items.some((g: any) => (g.goods_name || '').toLowerCase().includes(kw))
      })
    }
    if (params.start_date || params.end_date) {
      const s = params.start_date
      const e = params.end_date
      filtered = filtered.filter((row: any) => {
        const date = (row.order_date || row.created_at || '').slice(0, 10)
        if (s && date < s) return false
        if (e && date > e) return false
        return true
      })
    }
    if (isUnreconciled) {
      filtered = filtered.filter((row: any) => !reconciledIds.value.has(Number(row.id)))
    }
    const page = Number(params.page) || 1
    const size = Number(params.list_rows) || 20
    lastSummaryRows.value = filtered
    updateSummaryFromRows(filtered)
    if (res?.data) {
      return { ...res, data: { ...res.data, rows: filtered.slice((page - 1) * size, page * size), total: filtered.length } }
    }
  }
  lastSummaryRows.value = rows
  updateSummaryFromRows(rows)
  return res
}

function updateSummaryFromRows(rows: any[]) {
  let qty = 0, inhouseQty = 0, amount = 0
  let auditedCount = 0, auditedAmount = 0, paid = 0
  let pendingCount = 0, pendingAmount = 0, expense = 0
  for (const row of rows) {
    const items = Array.isArray(row.goods_info) ? row.goods_info : (() => { try { return JSON.parse(row.goods_info || '[]') } catch { return [] } })()
    qty += items.reduce((s: number, i: any) => s + (parseFloat(i.num) || 0) * Number(i.unit_ratio || 1), 0)
    inhouseQty += Number(row.inhouse_qty || 0)
    const rowAmt = (Number(row.after_discount) > 0 ? Number(row.after_discount) : Number(row.total_amount ?? 0))
    amount += rowAmt
    expense += Number(row.expense_amount || 0)
    if (Number(row.status) === 1) {
      auditedCount++
      auditedAmount += rowAmt
      paid += getPaidAmount(row)
    } else if (Number(row.status) !== 2) {
      pendingCount++
      pendingAmount += rowAmt
    }
  }
  const fmtQty = (n: number) => n % 1 === 0 ? String(n) : n.toFixed(2)
  summaryData.count = rows.length
  summaryData.totalQty = fmtQty(qty)
  summaryData.totalInhouseQty = fmtQty(inhouseQty)
  summaryData.totalAmount = amount
  summaryData.auditedCount = auditedCount
  summaryData.auditedAmount = auditedAmount
  summaryData.totalPaid = paid
  summaryData.totalUnpaid = Math.max(0, auditedAmount - paid)
  summaryData.totalExpense = expense
  summaryData.pendingCount = pendingCount
  summaryData.pendingAmount = pendingAmount
}

function getInhouseQty(row: any): number {
  return Number(row.inhouse_qty || 0)
}

const paidMapById = ref<Record<number, number>>({})
const paidMapByKey = ref<Record<string, number>>({})
const paidMapBySn = ref<Record<string, number>>({})
const paidMapMultiSup = ref<Record<string, number>>({})
const paidMapBySupplier = ref<Record<string, number>>({})
// 单据支出付款 Map：order_id → 已付金额
const expensePaidById = ref<Record<number, number>>({})
// 运费付款 Map：order_id → 已付金额
const freightPaidById = ref<Record<number, number>>({})
// 附加费用付款 Map："order_id:feeIndex" 或 "order_id:feeName" → 已付金额
const feeItemPaidMap = ref<Record<string, number>>({})

function payKey(orderSn: string, supplierName: string): string {
  return `${String(orderSn || '').trim()}@@${String(supplierName || '').trim()}`
}

// ── 批量付款弹窗 ──────────────────────────────────────────────────────────────
const batchPayVisible = ref(false)
const batchPaySubmitting = ref(false)
const batchPayDate = ref(new Date().toISOString().slice(0, 10))
const batchPayFundId = ref<number | null>(null)
const batchPayFundName = ref('')
const batchPayItems = ref<{ orderId: number; orderSn: string; supplierName: string; unpaid: number; amount: number }[]>([])

function openBatchPayDialog(auditedRows: any[]) {
  const items = auditedRows
    .map(row => {
      const total = (Number(row.after_discount) > 0 ? Number(row.after_discount) : Number(row.total_amount ?? 0))
      const paid = getPaidAmount(row)
      const unpaid = Math.max(0, total - paid)
      return { orderId: row.id, orderSn: row.order_sn || row.order_no || `PO${row.id}`, supplierName: row.supplier_name || '', unpaid, amount: unpaid }
    })
    .filter(item => item.unpaid > 0)
  if (!items.length) return
  batchPayItems.value = items
  batchPayDate.value = new Date().toISOString().slice(0, 10)
  batchPayFundId.value = null
  batchPayFundName.value = ''
  batchPayVisible.value = true
}

function onBatchPayFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  batchPayFundName.value = f?.name || ''
}

const batchPayTotal = computed(() => batchPayItems.value.reduce((s, r) => s + Number(r.amount || 0), 0))

async function submitBatchPay() {
  if (!batchPayFundId.value) { ElMessage.warning(t('procure.order.msgSelectBatchPayAccount')); return }
  const validItems = batchPayItems.value.filter(r => Number(r.amount) > 0)
  if (!validItems.length) { ElMessage.warning(t('procure.order.msgBatchPayAmountRequired')); return }
  batchPaySubmitting.value = true
  let success = 0, failed = 0
  try {
    for (const item of validItems) {
      try {
        await createPayReceipt({
          contact_type: 'supplier',
          contact_name: item.supplierName,
          order_sn: item.orderSn,
          amount: Number(item.amount),
          pay_date: batchPayDate.value,
          fund_id: batchPayFundId.value,
          fund_name: batchPayFundName.value,
          remark: `Purchase Order Payment #${item.orderId}`,
        })
        success++
      } catch { failed++ }
    }
    ElMessage.success(`${t('procure.order.msgBatchPaySuccess')} ${success}${failed ? `${t('procure.order.msgBatchPayFailedSuffix')} ${failed}` : ''}`)
    batchPayVisible.value = false
    loadPaidMap()
    tableRef.value?.refresh()
  } finally {
    batchPaySubmitting.value = false
  }
}

// ── 付款弹窗 ─────────────────────────────────────────────────────────────────
const payDialogVisible = ref(false)
const paySubmitting = ref(false)
const payForm = reactive({
  orderId: 0,
  orderSn: '',
  supplierName: '',
  unpaid: 0,
  amount: 0,
  fund_id: null as number | null,
  fund_name: '',
  pay_date: new Date().toISOString().slice(0, 10),
  remark: '',
})

function openPayDialog(row: any) {
  const total = (Number(row.after_discount) > 0 ? Number(row.after_discount) : Number(row.total_amount ?? 0))
  const paid = getPaidAmount(row)
  const unpaid = Math.max(0, total - paid)
  if (unpaid <= 0) {
    ElMessage.info(t('procure.order.msgOrderPaidUp'))
    return
  }
  payForm.orderId = row.id
  payForm.orderSn = row.order_sn || row.order_no || `PO${row.id}`
  payForm.supplierName = row.supplier_name || ''
  payForm.unpaid = unpaid
  payForm.amount = unpaid
  payForm.fund_id = null
  payForm.fund_name = ''
  payForm.pay_date = new Date().toISOString().slice(0, 10)
  payForm.remark = ''
  payDialogVisible.value = true
}

function onPayFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  payForm.fund_name = f?.name || ''
}

async function submitPay() {
  if (!payForm.amount || payForm.amount <= 0) { ElMessage.warning(t('procure.order.msgFillPayAmount')); return }
  if (!payForm.fund_id) { ElMessage.warning(t('procure.order.msgSelectPayAccount')); return }
  paySubmitting.value = true
  try {
    // 创建付款单（后端会自动扣减资金账户余额）
    await createPayReceipt({
      contact_type: 'supplier',
      contact_name: payForm.supplierName,
      order_sn: payForm.orderSn,
      amount: payForm.amount,
      pay_date: payForm.pay_date,
      fund_id: payForm.fund_id,
      fund_name: payForm.fund_name,
      remark: `Purchase Order Payment #${payForm.orderId}${payForm.remark ? ' ' + payForm.remark : ''}`,
    })
    ElMessage.success(t('procure.order.msgPaymentSuccess'))
    payDialogVisible.value = false
    loadPaidMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgPaymentFailed'))
  } finally {
    paySubmitting.value = false
  }
}

async function loadPaidMap() {
  try {
    const res = await getPayReceiptList({ list_rows: 2000 })
    const rows: any[] = res.data?.rows ?? []
    const idMap: Record<number, number> = {}
    const keyMap: Record<string, number> = {}
    const snMap: Record<string, number> = {}
    const multiSupMap: Record<string, number> = {}
    for (const r of rows) {
      const amount = Number(r.amount || 0)
      if (!amount) continue
      const remark = String(r.remark || '')
      // 跳过单据支出/运费/附加费用付款，这些不计入货款
      if (/采购单据支出|采购运费|采购附加费用|Purchase Addon Fee/.test(remark)) continue
      const orderSn = String(r.order_sn || '').trim()
      const supplierName = String(r.supplier_name || r.contact_name || '').trim()
      let matched = false
      if (Number(r.order_id)) {
        const id = Number(r.order_id)
        idMap[id] = (idMap[id] || 0) + amount
        matched = true
      }
      const m1all = [...String(r.remark || '').matchAll(/(?:采购单(?:自动)?付款|Purchase Order Payment)\s*#(\d+)/g)]
      if (m1all.length === 1) {
        const id = Number(m1all[0][1])
        idMap[id] = (idMap[id] || 0) + amount
        matched = true
      } else if (m1all.length > 1) {
        if (supplierName) multiSupMap[supplierName] = (multiSupMap[supplierName] || 0) + amount
        matched = true
      }
      const m2 = String(r.remark || '').match(/采购单([A-Za-z0-9]+)审核自动生成/)
      if (m2) {
        const sn = m2[1].trim()
        snMap[sn] = (snMap[sn] || 0) + amount
        matched = true
      }
      // 无精确匹配时，用 order_sn@@supplier 兜底
      if (!matched && orderSn && supplierName) {
        const key = payKey(orderSn, supplierName)
        keyMap[key] = (keyMap[key] || 0) + amount
      }
    }
    // 多ID付款：拉采购单数据，按欠款顺序冲销写入 idMap
    if (Object.keys(multiSupMap).length > 0) {
      try {
        const orderRes = await getProcureOrderList({ list_rows: 1000 })
        const allOrders: any[] = orderRes.data?.rows ?? []
        for (const [supName, totalAmt] of Object.entries(multiSupMap)) {
          const supOrders = allOrders
            .filter(o => Number(o.status) === 1 && String(o.supplier_name || '').trim() === supName)
            .sort((a, b) => a.id - b.id)
          let remaining = totalAmt
          for (const o of supOrders) {
            if (remaining <= 0) break
            const orderAmt = (Number(o.after_discount) > 0 ? Number(o.after_discount) : Number(o.total_amount ?? 0))
            const alreadyPaid = (idMap[o.id] || 0)
              + (snMap[String(o.order_sn || '').trim()] || snMap[String(o.order_no || '').trim()] || 0)
              + (keyMap[payKey(String(o.order_sn || '').trim(), supName)] || keyMap[payKey(String(o.order_no || '').trim(), supName)] || 0)
            const owe = Math.max(0, orderAmt - alreadyPaid)
            const deduct = Math.min(remaining, owe)
            if (deduct > 0) {
              idMap[o.id] = (idMap[o.id] || 0) + deduct
              remaining -= deduct
            }
          }
        }
      } catch {}
    }
    paidMapById.value = idMap
    paidMapByKey.value = keyMap
    paidMapBySn.value = snMap
    paidMapMultiSup.value = multiSupMap
    // 单据支出付款 Map（去重：按 order_id + amount + pay_date + fund_id 唯一性）
    const expenseIdMap: Record<number, number> = {}
    const seenExpensePay = new Set<string>()
    for (const r of rows) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const m = String(r.remark || '').match(/(?:采购单据支出|Purchase Document Expense)\s*#(\d+)/)
      if (m) {
        const id = Number(m[1])
        // 去重：相同 order_id + amount + pay_date + fund_id 只计算一次
        const uniqueKey = `${id}|${amt}|${r.pay_date}|${r.fund_id}`
        if (seenExpensePay.has(uniqueKey)) continue
        seenExpensePay.add(uniqueKey)
        expenseIdMap[id] = (expenseIdMap[id] || 0) + amt
      }
    }
    expensePaidById.value = expenseIdMap
    // 运费付款 Map（去重）
    const freightIdMap: Record<number, number> = {}
    const seenFreightPay = new Set<string>()
    for (const r of rows) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const m = String(r.remark || '').match(/(?:采购运费|Purchase Freight)\s*#(\d+)/)
      if (m) {
        const id = Number(m[1])
        const uniqueKey = `${id}|${amt}|${r.pay_date}|${r.fund_id}`
        if (seenFreightPay.has(uniqueKey)) continue
        seenFreightPay.add(uniqueKey)
        freightIdMap[id] = (freightIdMap[id] || 0) + amt
      }
    }
    freightPaidById.value = freightIdMap
    // 新格式附加费用付款 Map："order_id:feeName" → 已付金额
    const feeMap: Record<string, number> = {}
    for (const r of rows) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const m = String(r.remark || '').match(/(?:采购附加费用|Purchase Addon Fee)\s*#(\d+):(.+?)(?:\s|$)/)
      if (m) {
        const id = Number(m[1])
        const feeName = normalizeFeeTypeName(m[2].trim())
        const key = `${id}:${feeName}`
        feeMap[key] = (feeMap[key] || 0) + amt
      }
    }
    feeItemPaidMap.value = feeMap
    updateSummary()
  } catch {}
}

function getPaidAmount(row: any): number {
  const oSn = String(row.order_sn || '').trim()
  const oNo = String(row.order_no || '').trim()
  const sup = String(row.supplier_name || '').trim()
  return (paidMapById.value[row.id] || 0)
    + (paidMapBySn.value[oSn] || paidMapBySn.value[oNo] || 0)
    + (paidMapByKey.value[payKey(oSn, sup)] || paidMapByKey.value[payKey(oNo, sup)] || 0)
}

function getPayStatus(row: any): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const total = (Number(row.after_discount) > 0 ? Number(row.after_discount) : Number(row.total_amount ?? 0))
  const paid = getPaidAmount(row)
  if (total <= 0) return { label: '—', type: 'info' }
  if (paid <= 0) return { label: t('procure.order.payStatusUnpaid'), type: 'danger' }
  if (paid >= total - 0.01) return { label: t('procure.order.payStatusPaid'), type: 'success' }
  return { label: t('procure.order.payStatusPartial'), type: 'warning' }
}

function getExpensePayStatus(row: any): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const expAmt = Number(row.expense_amount || 0)
  if (expAmt <= 0) return { label: '—', type: 'info' }
  const paid = expensePaidById.value[row.id] || 0
  if (paid >= expAmt - 0.01) return { label: t('procure.order.feeStatusPaid'), type: 'success' }
  return { label: t('procure.order.feeStatusPending'), type: 'warning' }
}

function getFreightPayStatus(row: any): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const freightAmt = Number(row.freight_amount || 0)
  if (freightAmt <= 0) return { label: '—', type: 'info' }
  const bearer = row.freight_bearer || 'buyer'
  if (bearer === 'seller') return { label: t('procure.order.feeStatusSellerPays'), type: 'info' }
  if (bearer === 'free') return { label: t('procure.order.feeStatusFree'), type: 'info' }
  const paid = freightPaidById.value[row.id] || 0
  const needPay = bearer === 'half' ? freightAmt / 2 : freightAmt
  if (paid >= needPay - 0.01) return { label: t('procure.order.feeStatusPaid'), type: 'success' }
  return { label: t('procure.order.feeStatusPending'), type: 'warning' }
}

// ── 附加费用管理弹窗（列表里已审核单补充费用）────────────────────────────────
const feeManageVisible = ref(false)
const feeManageSaving = ref(false)
const feeManageRow = ref<any>(null)
const feeManageItems = ref<{ name: string; amount: number; bearer: string }[]>([])
const feeManagePayIndex = ref(-1)

function openFeeManageDialog(row: any) {
  feeManageRow.value = row
  feeManageItems.value = JSON.parse(JSON.stringify(getFeeItemsForRow(row)))
  feeManagePayIndex.value = -1
  feeManageVisible.value = true
}

function removeFeeManageItem(idx: number) {
  feeManageItems.value.splice(idx, 1)
  if (feeManagePayIndex.value === idx) feeManagePayIndex.value = -1
  if (feeManagePayIndex.value > idx) feeManagePayIndex.value--
}

function cleanFeeManageItems() {
  return feeManageItems.value
    .map((fee) => ({
      name: normalizeFeeTypeName(fee.name),
      amount: Number(fee.amount || 0),
      bearer: fee.bearer || 'buyer',
    }))
    .filter((fee) => fee.name && fee.amount > 0)
}

async function saveFeeManageItems() {
  if (!feeManageRow.value?.id) throw new Error('采购单不存在')
  const items = cleanFeeManageItems()
  await updateProcureOrder({
    id: feeManageRow.value.id,
    fee_items: JSON.stringify(items),
  })
  feeManageItems.value = items
  feeManageRow.value = { ...feeManageRow.value, fee_items: items }
  return items
}

async function submitFeeManage() {
  feeManageSaving.value = true
  try {
    await saveFeeManageItems()
    ElMessage.success(t('procure.order.msgFeeSaveSuccess'))
    feeManageVisible.value = false
    tableRef.value?.refresh()
    loadPaidMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgFeeSaveFailed'))
  } finally {
    feeManageSaving.value = false
  }
}

// ── 费用付款弹窗（统一）────────────────────────────────────────────────────────
const feePayVisible = ref(false)
const feePaySubmitting = ref(false)
const feePayForm = reactive({
  orderId: 0,
  orderSn: '',
  supplierName: '',
  feeName: '',
  feeIndex: -1,
  amount: 0,
  bearer: 'buyer',
  fund_id: null as number | null,
  fund_name: '',
  contact_name: '',
  pay_date: new Date().toISOString().slice(0, 10),
  remark: '',
})

function getFeeItemsForRow(row: any): { name: string; amount: number; bearer: string }[] {
  let items: any[] = []
  try { items = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { items = [] }
  if (!items.length) {
    const freight = Number(row.freight_amount || 0)
    const expense = Number(row.expense_amount || 0)
    if (freight > 0) items.push({ name: 'freight', amount: freight, bearer: row.freight_bearer || 'buyer' })
    if (expense > 0) items.push({ name: 'document_expense', amount: expense, bearer: 'buyer' })
  }
  return normalizeFeeItems(items)
}

function getFeeItemPayStatus(row: any, idx: number): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
  if (!fee || Number(fee.amount || 0) <= 0) return { label: '—', type: 'info' }
  const bearer = fee.bearer || 'buyer'
  if (bearer === 'seller') return { label: t('procure.order.feeStatusSellerPays'), type: 'info' }
  if (bearer === 'free') return { label: t('procure.order.feeStatusFree'), type: 'info' }
  const needPay = bearer === 'half' ? Number(fee.amount) / 2 : Number(fee.amount)
  // 兼容旧格式付款记录（采购单据支出 / 采购运费）
  const feeType = normalizeFeeTypeName(fee.name)
  const oldPaid = feeType === 'document_expense' ? (expensePaidById.value[row.id] || 0)
    : feeType === 'freight' ? (freightPaidById.value[row.id] || 0) : 0
  const paid = feeItemPaidMap.value[`${row.id}:${idx}`] || feeItemPaidMap.value[`${row.id}:${fee.name}`] || oldPaid
  if (paid >= needPay - 0.01) return { label: t('procure.order.feeStatusPaid'), type: 'success' }
  return { label: t('procure.order.feeStatusPending'), type: 'warning' }
}

function openFeePayDialog(row: any, idx: number) {
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
  if (!fee) { ElMessage.warning(t('procure.order.msgFeeNotFound')); return }
  if (Number(fee.amount || 0) <= 0) { ElMessage.warning(t('procure.order.msgFeeAmountRequired')); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning(t('procure.order.msgFeeNoPay')); return }
  if (getFeeItemPayStatus(row, idx).label !== t('procure.order.feeStatusPending')) { ElMessage.warning(t('procure.order.msgFeeNoPayNeeded')); return }
  feePayForm.orderId = row.id
  feePayForm.orderSn = row.order_no || row.order_sn || `PO${row.id}`
  feePayForm.supplierName = row.supplier_name || ''
  feePayForm.feeName = fee.name
  feePayForm.feeIndex = idx
  feePayForm.amount = Number(fee.amount)
  feePayForm.bearer = fee.bearer || 'buyer'
  feePayForm.fund_id = null
  feePayForm.fund_name = ''
  feePayForm.contact_name = ''
  feePayForm.pay_date = new Date().toISOString().slice(0, 10)
  feePayForm.remark = ''
  feePayVisible.value = true
}

function openFeeManagePay(idx: number) {
  if (!feeManageRow.value) return
  const fee = feeManageItems.value[idx]
  if (!fee) { ElMessage.warning(t('procure.order.msgFeeNotFound')); return }
  if (Number(fee.amount || 0) <= 0) { ElMessage.warning(t('procure.order.msgFeeAmountRequired')); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning(t('procure.order.msgFeeNoPay')); return }
  openFeePayDialog({ ...feeManageRow.value, fee_items: feeManageItems.value }, idx)
  feePayVisible.value = false
  feeManagePayIndex.value = idx
}

function onFeePayFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  feePayForm.fund_name = f?.name || ''
}

async function submitFeePay() {
  if (!feePayForm.fund_id) { ElMessage.warning(t('procure.order.msgSelectPayAccount')); return }
  const needPay = feePayForm.bearer === 'half' ? feePayForm.amount / 2 : feePayForm.amount
  feePaySubmitting.value = true
  const isSystemSupplier = feePayForm.contact_name
    ? supplierOptions.value.some(s => s.name === feePayForm.contact_name)
    : false
  try {
    await createPayReceipt({
      contact_type: isSystemSupplier ? 'supplier' : 'other',
      contact_name: feePayForm.contact_name,
      order_sn: feePayForm.orderSn,
      order_id: feePayForm.orderId,
      amount: needPay,
      pay_date: feePayForm.pay_date,
      fund_id: feePayForm.fund_id,
      fund_name: feePayForm.fund_name,
      remark: `Purchase Addon Fee #${feePayForm.orderId}:${normalizeFeeTypeName(feePayForm.feeName)} [${feePayForm.supplierName}]${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success(t('procure.order.msgPaymentSuccess'))
    feePayVisible.value = false
    loadPaidMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgPaymentFailed'))
  } finally {
    feePaySubmitting.value = false
  }
}

async function submitFeeManagePay() {
  if (feeManagePayIndex.value < 0) return
  if (!feePayForm.fund_id) { ElMessage.warning(t('procure.order.msgSelectPayAccount')); return }
  const fee = feeManageItems.value[feeManagePayIndex.value]
  if (!fee) { ElMessage.warning(t('procure.order.msgFeeNotFound')); return }
  if (Number(fee.amount || 0) <= 0) { ElMessage.warning(t('procure.order.msgFeeAmountRequired')); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning(t('procure.order.msgFeeNoPay')); return }
  if (getFeeItemPayStatus({ ...feeManageRow.value, fee_items: feeManageItems.value }, feeManagePayIndex.value).label !== t('procure.order.feeStatusPending')) {
    ElMessage.warning(t('procure.order.msgFeeNoPayNeeded'))
    return
  }
  feePayForm.feeName = String(fee.name || '').trim()
  feePayForm.amount = Number(fee.amount || 0)
  feePayForm.bearer = fee.bearer || 'buyer'
  feePaySubmitting.value = true
  const isSystemSupplier = feePayForm.contact_name
    ? supplierOptions.value.some(s => s.name === feePayForm.contact_name)
    : false
  try {
    await saveFeeManageItems()
    const needPay = feePayForm.bearer === 'half' ? feePayForm.amount / 2 : feePayForm.amount
    await createPayReceipt({
      contact_type: isSystemSupplier ? 'supplier' : 'other',
      contact_name: feePayForm.contact_name,
      order_sn: feePayForm.orderSn,
      order_id: feePayForm.orderId,
      amount: needPay,
      pay_date: feePayForm.pay_date,
      fund_id: feePayForm.fund_id,
      fund_name: feePayForm.fund_name,
      remark: `Purchase Addon Fee #${feePayForm.orderId}:${normalizeFeeTypeName(feePayForm.feeName)} [${feePayForm.supplierName}]${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success(t('procure.order.msgPaymentSuccess'))
    feeManagePayIndex.value = -1
    await loadPaidMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgPaymentFailed'))
  } finally {
    feePaySubmitting.value = false
  }
}

function parseItems(goodsInfo: any): any[] {
  const raw = Array.isArray(goodsInfo) ? goodsInfo : (() => { try { return JSON.parse(goodsInfo || '[]') } catch { return [] } })()
  return raw.map((item: any) => ({ ...item, spec: sanitizeSpec(String(item.spec || '')) }))
}

function getOrderSupplierLabel(row: any): string {
  const items = parseItems(row.goods_info)
  const rowSupplierIds = [...new Set(items.map((i: any) => Number(i.supplier_id)).filter(Boolean))]
  if (rowSupplierIds.length > 1) return t('procure.order.multipleSuppliers')
  if (rowSupplierIds.length === 1) {
    const s = supplierOptions.value.find(x => x.id === rowSupplierIds[0])
    return s?.name || row.supplier_name || '—'
  }
  return row.supplier_name || supplierOptions.value.find(s => s.id === row.supplier_id)?.name || '—'
}

function calcOrderQty(row: any): string {
  const items = parseItems(row.goods_info)
  const total = items.reduce((s: number, item: any) => s + (parseFloat(item.num) || 0), 0)
  return total % 1 === 0 ? String(total) : total.toFixed(2)
}

const goodsSpecMap = reactive<Record<number, string[]>>({})
// stores parsed skus from spec JSON: { goodsId: { specVal: { sku_sn, sell_price, cost_price } } }
const goodsSkuDataMap = reactive<Record<number, Record<string, any>>>({})

function parseSpecJson(specStr: string): { options: string[]; skus: Record<string, any> } {
  try {
    const parsed = JSON.parse(specStr)
    const options: string[] = []
    for (const attr of parsed.attrs ?? []) {
      options.push(...(attr.values ?? []).filter(Boolean))
    }
    return { options: [...new Set(options)], skus: parsed.skus ?? {} }
  } catch {
    return { options: [], skus: {} }
  }
}

async function fetchGoodsSpecs(goodsId: number) {
  if (!goodsId || goodsSpecMap[goodsId] !== undefined) return
  goodsSpecMap[goodsId] = []
  try {
    const res = await getGoodsList({ id: goodsId, list_rows: 1 })
    const rows = res.data?.rows ?? []
    const g = rows[0]
    if (!g || !g.multi_spec) return
    const { options, skus } = parseSpecJson(String(g.spec || ''))
    goodsSpecMap[goodsId] = options
    goodsSkuDataMap[goodsId] = skus
  } catch { /* ignore */ }
}

function sanitizeSpec(s: string): string {
  const t = (s || '').trim()
  return (t.startsWith('{') || t.startsWith('[')) ? '' : t
}

function onSpecChange(row: any, specVal: string) {
  const sku = goodsSkuDataMap[row.goods_id]?.[specVal]
  if (sku?.sku_sn) row.goods_sn = sku.sku_sn
}

// 商品多单位换算缓存：goods_id -> [{unit_name, ratio, cost_price?}]
const goodsUnitMap = reactive<Record<number, { unit_name: string; ratio: number; cost_price?: number }[]>>({})

function readUnitCostPrices(goodsId: number): Record<string, number> {
  try { return (JSON.parse(localStorage.getItem('erp_unit_cost_prices') || '{}')[goodsId]) || {} } catch { return {} }
}

async function fetchGoodsUnits(goodsId: number, baseUnitName: string) {
  if (!goodsId || goodsUnitMap[goodsId] !== undefined) return
  goodsUnitMap[goodsId] = []
  try {
    const res = await getUnitConvert(goodsId)
    const rows: any[] = res.data?.rows ?? []
    const savedPrices = readUnitCostPrices(goodsId)
    if (rows.length) {
      goodsUnitMap[goodsId] = rows.map(r => ({
        unit_name: r.unit_name,
        ratio: Number(r.ratio),
        cost_price: savedPrices[r.unit_name] ?? 0,
      }))
    } else {
      goodsUnitMap[goodsId] = baseUnitName
        ? [{ unit_name: baseUnitName, ratio: 1, cost_price: savedPrices[baseUnitName] ?? 0 }]
        : []
    }
  } catch { /* ignore */ }
}
const searchForm = reactive<any>({ order_no: route.query.order_no ? String(route.query.order_no) : '', supplier_name: '', status: '', goods_name: '', start_date: '', end_date: '' })
const dateRange = ref<any>([])
const dateShortcuts = computed(() => [
  { text: t('procure.order.dateShortcutLastMonth'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 1); return [s, e] } },
  { text: t('procure.order.dateShortcutLast3Months'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 3); return [s, e] } },
  { text: t('procure.order.dateShortcutLast6Months'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 6); return [s, e] } },
  { text: t('procure.order.dateShortcutThisYear'), value: () => { const e = new Date(); const s = new Date(e.getFullYear(), 0, 1); return [s, e] } },
  { text: t('procure.order.dateShortcutLastYear'), value: () => { const y = new Date().getFullYear() - 1; return [new Date(y, 0, 1), new Date(y, 11, 31)] } },
])
const datePickerKey = ref(0)
function onDateChange(val: any) {
  if (val && val.length === 2) { searchForm.start_date = val[0]; searchForm.end_date = val[1] }
  else { searchForm.start_date = ''; searchForm.end_date = '' }
}
function onSearchReset() {
  dateRange.value = []
  datePickerKey.value++
  searchForm.start_date = ''
  searchForm.end_date = ''
}
if (route.query.order_no) highlightSn.value = String(route.query.order_no)
const showForm = ref(false)
const isReadonly = ref(false)

// ── 供应商/仓库/分类/资金账户选项 ─────────────────────────────────────────────
const supplierOptions = ref<any[]>([])
const warehouseOptions = ref<any[]>([])
const fundOptions = ref<any[]>([])
const staffOptions = ref<any[]>([])

async function loadSuppliers() {
  const res = await getSupplierList({ list_rows: 500 })
  supplierOptions.value = res.data?.rows ?? []
}
async function loadWarehouses() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows ?? []
}
async function loadFunds() {
  const res = await getFundList({ list_rows: 100 })
  fundOptions.value = res.data?.rows ?? []
}
async function loadStaff() {
  try {
    const res = await getStaffList({ list_rows: 500 })
    staffOptions.value = res.data?.rows ?? []
  } catch { /* ignore */ }
}

onMounted(() => {
  loadSuppliers(); loadWarehouses(); loadFunds(); loadStaff(); loadPaidMap()
  ensureKaoNaiPiMasterData()
  migrateKaoNaiPiUnitsInPurchaseOrders()
  // 从付款单跳转过来，高亮对应采购单
  if (route.query.order_no) {
    const sn = String(route.query.order_no)
    searchForm.order_no = sn
    highlightSn.value = sn
    nextTick(() => {
      if (tableRef.value) {
        tableRef.value.searchParams.order_no = sn
        tableRef.value.refresh()
      }
    })
  }
  // 从采购计划跳转过来，预填数据
  const planData = sessionStorage.getItem('procure_order_from_plan')
  if (planData) {
    sessionStorage.removeItem('procure_order_from_plan')
    try {
      const p = JSON.parse(planData)
      openCreate()
      if (p.supplier_id) {
        fd.supplier_id = Number(p.supplier_id)
        fd.supplier_name = String(p.supplier_name || '')
      }
      if (p.warehouse_id) {
        fd.warehouse_id = Number(p.warehouse_id)
        fd.warehouse_name = String(p.warehouse_name || '')
      }
      fd.admin_name = String(p.admin_name || '')
      fd.remark = String(p.remark || '')
      fd.plan_id = Number(p.plan_id || 0)
      const items = JSON.parse(String(p.goods_info || '[]'))
      fd.items = items.map((i: any) => {
        const specStr = String(i.spec || '')
        const gid = i.goods_id || 0
        if (gid && specStr.trim().startsWith('{') && goodsSpecMap[gid] === undefined) {
          const { options, skus } = parseSpecJson(specStr)
          goodsSpecMap[gid] = options
          goodsSkuDataMap[gid] = skus
        }
        return {
          goods_id: gid,
          goods_name: i.goods_name || '',
          goods_sn: i.goods_sn || '',
          spec: sanitizeSpec(specStr),
          cate_name: i.cate_name || '',
          unit_name: i.unit_name || '',
          batch_no: '',
          num: i.num || 0,
          price_no_tax: i.price_no_tax || i.price || 0,
          tax_rate: i.tax_rate || 0,
          price: i.price || 0,
          remark: i.remark || '',
          supplier_id: i.supplier_id || null,
          supplier_name: i.supplier_name || '',
        }
      })
      calcTotal()
    } catch { /* ignore */ }
  }
  checkBomData()
})

function checkBomData() {
  // 从BOM物料清单跳转过来，预填物料数据
  const bomData = sessionStorage.getItem('procure_order_from_bom')
  if (bomData) {
    sessionStorage.removeItem('procure_order_from_bom')
    try {
      const b = JSON.parse(bomData)
      openCreate()
      fd.remark = String(b.remark || '')
      const items = JSON.parse(String(b.goods_info || '[]'))
      fd.items = items.map((i: any) => {
        const specStr = String(i.spec || '')
        const gid = i.goods_id || 0
        if (gid && specStr.trim().startsWith('{') && goodsSpecMap[gid] === undefined) {
          const { options, skus } = parseSpecJson(specStr)
          goodsSpecMap[gid] = options
          goodsSkuDataMap[gid] = skus
        }
        return {
          goods_id: gid,
          goods_name: i.goods_name || '',
          goods_sn: i.goods_sn || '',
          spec: sanitizeSpec(specStr),
          cate_name: i.cate_name || '',
          unit_name: i.unit_name || '',
          batch_no: '',
          num: i.num || 0,
          price_no_tax: i.price_no_tax || i.price || 0,
          tax_rate: i.tax_rate || 0,
          price: i.price || 0,
          remark: i.remark || '',
          supplier_id: i.supplier_id || null,
          supplier_name: i.supplier_name || '',
        }
      })
      calcTotal()
    } catch { /* ignore */ }
  }
}

onActivated(() => {
  checkBomData()
  loadPaidMap()
  if (route.query.order_no) {
    const sn = String(route.query.order_no)
    searchForm.order_no = sn
    highlightSn.value = sn
    tableRef.value?.refresh()
  }
})

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface OrderItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; cate_name: string; unit_name: string; batch_no: string
  num: number; price_no_tax: number; tax_rate: number; price: number; remark: string
  unit_ratio?: number; _base_price_no_tax?: number
  supplier_id: number | null; supplier_name: string
}

interface AttachFile {
  name: string
  size: number
  type: string
  data: string   // base64 data URL
}

const defaultFd = () => ({
  id: 0,
  plan_id: 0,
  order_no: '',
  order_sn: '',
  supplier_id: null as any,
  supplier_name: '',
  admin_name: '',
  order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  delivery_date: '',
  warehouse_id: null as any,
  warehouse_name: '',
  need_invoice: false,
  fund_id: null as any,
  fund_name: '',
  pay_account: '',
  remark: '',
  total_amount: 0,
  freight_amount: 0,
  freight_bearer: 'buyer' as string,
  discount_type: 'none' as string,
  discount_value: 0,
  after_discount: 0,
  expense_amount: 0,
  pay_amount: 0,
  installment: false,
  fee_items: [] as { name: string; amount: number; bearer: string }[],
  attachments: [] as AttachFile[],
  items: [] as OrderItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)
const savingAndAuditing = ref(false)

function generateOrderNo(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const ms = String(d.getMilliseconds()).padStart(3, '0')
  const rand = Math.floor(Math.random() * 100)
  const body = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}${ms}${rand}`
  return `PO${body}`
}

function toSafeNumber(value: any): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function normalizeOrderItemMoney(item: any) {
  const taxRate = Math.max(0, toSafeNumber(item.tax_rate))
  let priceNoTax = toSafeNumber(item.price_no_tax)
  let price = toSafeNumber(item.price)

  if (priceNoTax <= 0 && price > 0) {
    priceNoTax = taxRate > 0 ? price / (1 + taxRate / 100) : price
  }
  if (price <= 0 && priceNoTax > 0) {
    price = priceNoTax * (1 + taxRate / 100)
  }
  if (taxRate === 0 && price > 0) {
    priceNoTax = price
  }

  item.tax_rate = taxRate
  item.price_no_tax = Number(priceNoTax.toFixed(6))
  item.price = Number(price.toFixed(6))
  item.num = toSafeNumber(item.num)
}

function normalizeDateValue(value: any): string {
  if (value === null || value === undefined) return ''
  const raw = String(value).trim()
  if (!raw || raw === 'null' || raw === 'undefined' || raw === '0000-00-00') return ''
  return raw.slice(0, 10)
}

// 计算汇总
const totalNoTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0), 0)
)
const totalTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0) * (r.tax_rate || 0) / 100, 0)
)

function calcTotal() {
  fd.items.forEach((item: any) => {
    normalizeOrderItemMoney(item)
    item._total = getLineTotal(item)
  })
  fd.total_amount = fd.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
  calcSettle()
}

function calcSettle() {
  if (fd.discount_type === 'none') {
    fd.after_discount = fd.total_amount
  } else if (fd.discount_type === 'amount') {
    fd.after_discount = Math.max(0, fd.total_amount - (fd.discount_value || 0))
  } else {
    fd.after_discount = fd.total_amount * (1 - (fd.discount_value || 0) / 100)
  }
}

function calcItemTax(row: OrderItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(6))
}

function onPriceNoTaxChange(row: OrderItem) {
  const unitRatio = Math.max(0.0001, Number((row as any).unit_ratio || 1))
  ;(row as any)._base_price_no_tax = Number((Number(row.price_no_tax || 0) / unitRatio).toFixed(6))
  calcItemTax(row)
  calcTotal()
}

function onTaxRateChange(row: OrderItem) {
  calcItemTax(row)
  calcTotal()
}

function onPriceChange(row: OrderItem) {
  const taxRate = row.tax_rate || 0
  if (taxRate > 0) {
    row.price_no_tax = Number((row.price / (1 + taxRate / 100)).toFixed(6))
  } else {
    row.price_no_tax = row.price
  }
  const unitRatio = Math.max(0.0001, Number((row as any).unit_ratio || 1))
  ;(row as any)._base_price_no_tax = Number((Number(row.price_no_tax || 0) / unitRatio).toFixed(6))
  ;(row as any)._total = getLineTotal(row)
  calcTotal()
}

function getLineTotal(row: OrderItem): number {
  return Number(((Number(row.num || 0)) * (Number(row.price || 0))).toFixed(2))
}

function onLineTotalChange(row: OrderItem, value: any) {
  const qty = Number(row.num || 0)
  const total = Number(value || 0)
  if (!(qty > 0)) {
    row.price = 0
    row.price_no_tax = 0
    ElMessage.warning(t('procure.order.msgLineTotalNoQty'))
    calcTotal()
    return
  }
  row.price = Number((total / qty).toFixed(6))
  onPriceChange(row)
}

function removeItem(index: number) {
  fd.items.splice(index, 1)
  calcTotal()
}

function onSupplierChange(id: any) {
  const s = supplierOptions.value.find(x => x.id === id)
  fd.supplier_name = s?.name ?? ''
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
}

function onFundChange(id: any) {
  const f = fundOptions.value.find(x => x.id === id)
  fd.fund_name = f?.name ?? ''
  fd.pay_account = f?.name ?? ''
}

async function openCreate() {
  Object.assign(fd, defaultFd())
  fd.order_no = generateOrderNo()
  fd.order_sn = fd.order_no
  // 应用默认仓库
  if (!warehouseOptions.value.length) await loadWarehouses()
  const defaultWhId = await getSyncedDefaultWarehouseId()
  if (defaultWhId) {
    const wh = warehouseOptions.value.find((w: any) => w.id === defaultWhId)
    if (wh) { fd.warehouse_id = wh.id; fd.warehouse_name = wh.name }
  }
  isReadonly.value = false
  showForm.value = true
}

async function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  fd.order_date = normalizeDateValue(fd.order_date || row?.created_at || row?.create_time)
  fd.delivery_date = normalizeDateValue(fd.delivery_date)
  // 确保仓库列表已加载
  if (!warehouseOptions.value.length) await loadWarehouses()
  // 历史数据仓库为空时，补填用户设置的默认仓库
  if (!fd.warehouse_id) {
    const defaultWhId = await getSyncedDefaultWarehouseId()
    if (defaultWhId) {
      const wh = warehouseOptions.value.find((w: any) => w.id === defaultWhId)
      if (wh) { fd.warehouse_id = wh.id; fd.warehouse_name = wh.name }
    }
  }
  if (!fd.fund_id) fd.fund_id = null
  fd.order_no = fd.order_no || row.order_sn || ''
  fd.order_sn = fd.order_sn || fd.order_no || ''
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items = (fd.items || []).map((item: any) => {
    const specStr = String(item?.spec || '')
    const gid = toSafeNumber(item?.goods_id)
    if (gid && specStr.trim().startsWith('{') && goodsSpecMap[gid] === undefined) {
      const { options, skus } = parseSpecJson(specStr)
      goodsSpecMap[gid] = options
      goodsSkuDataMap[gid] = skus
    }
    const normalized = {
      goods_id: gid,
      goods_name: String(item?.goods_name || ''),
      goods_sn: String(item?.goods_sn || ''),
      spec: sanitizeSpec(specStr),
      cate_name: String(item?.cate_name || ''),
      unit_name: String(item?.unit_name || ''),
      _current_unit_name: String(item?.unit_name || ''),
      batch_no: String(item?.batch_no || ''),
      num: toSafeNumber(item?.num),
      price_no_tax: toSafeNumber(item?.price_no_tax),
      tax_rate: toSafeNumber(item?.tax_rate),
      price: toSafeNumber(item?.price),
      remark: String(item?.remark || ''),
      unit_ratio: toSafeNumber(item?.unit_ratio) || 1,
      _base_price_no_tax: toSafeNumber(item?._base_price_no_tax),
      supplier_id: item?.supplier_id ?? null,
      supplier_name: String(item?.supplier_name || ''),
    }
    normalizeOrderItemMoney(normalized)
    normalizeKaoNaiPiLegacyItem(normalized)
    const ratio = Math.max(0.0001, Number(normalized.unit_ratio || 1))
    if (!(Number(normalized._base_price_no_tax || 0) > 0)) {
      normalized._base_price_no_tax = Number((Number(normalized.price_no_tax || 0) / ratio).toFixed(6))
    }
    return normalized
  })
  try { fd.attachments = Array.isArray(row.attachments_info) ? row.attachments_info : JSON.parse(row.attachments_info || '[]') } catch { fd.attachments = [] }
  // 加载 fee_items，若无则从旧 freight_amount/expense_amount 迁移
  let feeItems: any[] = []
  try { feeItems = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { feeItems = [] }
  if (!feeItems.length) {
    const freight = Number(row.freight_amount || 0)
    const expense = Number(row.expense_amount || 0)
    if (freight > 0) feeItems.push({ name: 'freight', amount: freight, bearer: row.freight_bearer || 'buyer' })
    if (expense > 0) feeItems.push({ name: 'document_expense', amount: expense, bearer: 'buyer' })
  }
  fd.fee_items = normalizeFeeItems(feeItems)
  calcTotal()
  fd.expense_amount = Number(fd.expense_amount || 0)
  if (!row.after_discount && row.after_discount !== 0) {
    fd.after_discount = fd.total_amount
  } else {
    fd.after_discount = Number(fd.after_discount)
  }
  // 无折扣时折后金额必须等于应付，防止浮点误差导致折后>应付
  if (fd.discount_type === 'none') {
    fd.after_discount = fd.total_amount
  }
  fd.items.forEach((item: any) => {
    if (item.goods_id) {
      fetchGoodsSpecs(item.goods_id)
      fetchGoodsUnits(item.goods_id, item.unit_name || '')
    }
  })
  isReadonly.value = readonly
  showForm.value = true
  loadPaidMap()
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
  loadPaidMap()
}

async function handleSave(andAudit = false) {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning(t('procure.order.msgFillRequired')); return
  }
  if (!fd.warehouse_id) {
    const defaultWhId = await getSyncedDefaultWarehouseId()
    const fallback = defaultWhId
      ? warehouseOptions.value.find((w: any) => w.id === defaultWhId)
      : warehouseOptions.value[0]
    if (fallback) {
      fd.warehouse_id = fallback.id
      fd.warehouse_name = fallback.name
    } else {
      ElMessage.warning(t('procure.order.msgSelectWarehouse')); return
    }
  }
  if (!fd.items.length) {
    ElMessage.warning(t('procure.order.msgAddAtLeastOne')); return
  }
  // 单号唯一性校验（仅新增时；精确匹配碰撞；最多重试 6 次，避免递归连环弹窗）
  if (!fd.id) {
    let attempts = 0
    const maxAttempts = 6
    while (attempts < maxAttempts) {
      const autoNo = fd.order_no || fd.order_sn || generateOrderNo()
      fd.order_no = autoNo
      fd.order_sn = autoNo
      attempts++
      try {
        const checkRes = await getProcureOrderList({ order_no: autoNo, order_sn: autoNo, list_rows: 20 })
        const rows = checkRes?.data?.rows ?? []
        const duplicated = rows.some((r: any) => String(r.order_no || r.order_sn || '') === autoNo)
        if (!duplicated) break
        const nextNo = generateOrderNo()
        fd.order_no = nextNo
        fd.order_sn = nextNo
        ElMessage.warning(`${autoNo} ${t('procure.order.msgOrderNoDuplicate')} ${nextNo}`)
      } catch {
        // 查询失败不阻断保存，避免被接口异常卡死
        break
      }
    }
    if (attempts >= maxAttempts) {
      ElMessage.error(t('procure.order.msgOrderNoConflict'))
      return
    }
  }
  // 只有"保存并审核"才提示未填付款；纯"保存"是草稿，不打扰
  if (andAudit && (!fd.pay_amount || fd.pay_amount <= 0)) {
    try {
      await ElMessageBox.confirm(t('procure.order.msgConfirmPayAmountEmpty'), t('procure.order.msgPrompt'), {
        confirmButtonText: t('procure.order.msgConfirmPayAmountEmptyConfirm'), cancelButtonText: t('procure.order.msgConfirmPayAmountEmptyCancel'), type: 'warning'
      })
    } catch { return }
  }
  // 有付款金额但未选账户时提醒
  if (Number(fd.pay_amount || 0) > 0 && !fd.fund_id) {
    try {
      await ElMessageBox.confirm(t('procure.order.msgConfirmNoAccount'), t('procure.order.msgPrompt'), {
        confirmButtonText: t('procure.order.msgConfirmNoAccountConfirm'), cancelButtonText: t('procure.order.msgConfirmNoAccountCancel'), type: 'warning'
      })
    } catch { return }
  }
  saving.value = true
  if (andAudit) savingAndAuditing.value = true
  try {
    const normalizedOrderDate = normalizeDateValue(fd.order_date) || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
    const normalizedDeliveryDate = normalizeDateValue(fd.delivery_date)
    calcTotal()
    const payload: Record<string, any> = {
      supplier_id: fd.supplier_id,
      supplier_name: fd.supplier_name,
      admin_name: fd.admin_name,
      order_date: normalizedOrderDate,
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      fund_id: fd.fund_id || 0,
      fund_name: fd.fund_name || '',
      pay_amount: Number(fd.pay_amount || 0),
      remark: fd.remark,
      total_amount: fd.total_amount,
      freight_amount: Number(fd.freight_amount || 0),
      discount_type: fd.discount_type,
      discount_value: Number(fd.discount_value || 0),
      after_discount: fd.after_discount,
      expense_amount: Number(fd.expense_amount || 0),
      goods_info: JSON.stringify(fd.items),
      fee_items: JSON.stringify(fd.fee_items || []),
    }
    if (normalizedDeliveryDate) payload.delivery_date = normalizedDeliveryDate
    let orderId = fd.id
    if (fd.id) {
      payload.id = fd.id
      await updateProcureOrder(payload)
    } else {
      const autoNo = fd.order_no || fd.order_sn || generateOrderNo()
      payload.order_no = autoNo
      payload.order_sn = autoNo
      const createRes = await createProcureOrder(payload)
      orderId = createRes?.data?.id || createRes?.data?.data?.id || 0
      if (orderId) fd.id = orderId
    }

    ElMessage.success(t('procure.order.msgSaveSuccess'))
    if (andAudit && orderId) {
      try {
        await auditProcureOrder(orderId, 1)
        try {
          await syncGoodsCostPriceFromItems(fd.items)
        } catch (e: any) {
          console.warn('保存并审核回写商品成本价失败', orderId, e?.message)
        }
        // 审核后自动创建并审核入库记录，更新库存
        try {
          const items = fd.items
          const _allInhouse3 = await getProcureInhouseList({ list_rows: 2000 })
          const existRows: any[] = (_allInhouse3.data?.rows ?? []).filter((r: any) => Number(r.purchase_order_id) === Number(orderId))
          if (existRows.length === 0) {
            const inhouseRes = await createProcureInhouse({
              purchase_order_id: orderId,
              supplier_id: fd.supplier_id,
              supplier_name: fd.supplier_name,
              warehouse_id: fd.warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id')) || 0,
              warehouse_name: fd.warehouse_name || warehouseOptions.value.find((w: any) => w.id === (fd.warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id'))))?.name || '',
              admin_name: fd.admin_name || '',
              in_date: (fd.order_date || '').slice(0, 10),
              total_amount: fd.total_amount,
              remark: fd.remark || '',
              goods_info: items,
            })
            const inhouseId = inhouseRes.data?.id
            if (inhouseId) {
              await auditProcureInhouse(inhouseId, 1)
              await applyInhouseStockEffect(fd.warehouse_id || 0, fd.warehouse_name || '', items, 'in')
            }
          } else {
            const sorted = [...existRows].sort((a, b) => b.id - a.id)
            for (const r of sorted.slice(1)) { try { await http.post('/stock/ProcureInhouse/del', { ids: r.id }) } catch {} }
            const keep = sorted[0]
            if (keep.status !== 1) {
              await auditProcureInhouse(keep.id, 1)
              const rItems = Array.isArray(keep.goods_info) ? keep.goods_info : JSON.parse(keep.goods_info || '[]')
              await applyInhouseStockEffect(keep.warehouse_id || fd.warehouse_id || 0, keep.warehouse_name || fd.warehouse_name || '', rItems, 'in')
            }
          }
        } catch (e: any) {
          console.warn('自动入库失败', e?.message)
        }
        const payAmount2 = Number(fd.pay_amount || 0)
        const fundId2 = Number(fd.fund_id || 0)
        // 付款单由后端审核时自动创建，前端不重复创建
        ElMessage.success(payAmount2 > 0 && fundId2 ? t('procure.order.msgAutoInhouseAndFinance') : t('procure.order.msgAutoInhouse'))
      } catch (e: any) {
        ElMessage.warning(t('procure.order.msgAuditFailed') + (e?.message || ''))
      }
    }
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgSaveFailed'))
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

async function handleDelete(row: any) {
  if (Number(row.status) === 1) {
    ElMessage.warning(t('procure.order.msgDeleteAuditedBlock'))
    return
  }
  await ElMessageBox.confirm(t('procure.order.msgDeleteConfirm'), t('procure.order.msgPrompt'), { type: 'warning' })
  await deleteProcureOrder(row.id)
  ElMessage.success(t('procure.order.msgDeleteSuccess'))
  tableRef.value?.refresh()
}

async function batchDelProcureOrders({ ids }: { ids: number[] }) {
  const rows: any[] = tableRef.value?.selectedRows ?? []
  const auditedRows = rows.filter((r: any) => Number(r.status) === 1)
  if (auditedRows.length) {
    ElMessage.warning(`${t('procure.order.msgBatchAuditedBlockPrefix')} ${auditedRows.length} ${t('procure.order.msgBatchAuditedBlockSuffix')}`)
    return Promise.reject(new Error('存在已审核单据'))
  }
  return http.post('/stock/PurchaseOrder/batchDel', { ids })
}

async function applyInhouseStockEffect(warehouseId: number, warehouseName: string, items: any[], direction: 'in' | 'out') {
  // 全量拉商品表，自建 goods_sn -> goods_id 映射
  const snToGoodsId: Record<string, number> = {}
  try {
    const goodsRes = await http.get('/goods/ShopGoods/index', { params: { list_rows: 2000 } })
    for (const g of goodsRes.data?.rows ?? []) {
      if (g.goods_sn && g.id) snToGoodsId[g.goods_sn] = g.id
    }
  } catch {}

  // 全量拉库存，按 goods_id 找该商品的第一条库存记录（用于确定仓库）
  const stockByGoodsId: Record<number, any> = {}
  try {
    const allStockRes = await http.get('/stock/StockAll/index', { params: { list_rows: 2000 } })
    for (const s of allStockRes.data?.rows ?? []) {
      const gid = s.goods_id
      if (!gid) continue
      // 优先取有库存的记录，没有则取第一条
      if (!stockByGoodsId[gid] || Number(s.qty) > Number(stockByGoodsId[gid].qty)) {
        stockByGoodsId[gid] = s
      }
    }
  } catch {}

  // 预加载BOM列表
  const bomSnMap: Record<string, number> = {}
  try {
    const bomRes = await getBomList({ list_rows: 500 })
    for (const b of bomRes.data?.list ?? bomRes.data?.rows ?? []) {
      if (b.goods_sn) bomSnMap[b.goods_sn] = b.id
    }
  } catch {}

  // 成品库存由后端 auditProcureInhouse 自动维护，此处只处理BOM原材料
  for (const item of items) {
    if (!item.num) continue
    const bomId = bomSnMap[item.goods_sn || '']
    if (!bomId) continue

    try {
      const detailRes = await getBomByGoods(bomId)
      const bomItems: any[] = detailRes.data?.items ?? []
      const finishedQty = Number(item.num) * Number(item.unit_ratio || 1)

      // 按材料实际所在仓库分组（不用采购单仓库，避免扣错记录）
      const byWarehouse: Record<string, { wh_id: number; wh_name: string; goods: any[] }> = {}
      for (const mat of bomItems) {
        if (!mat.goods_sn || !mat.num) continue
        const matGoodsId = snToGoodsId[mat.goods_sn]
        if (!matGoodsId) continue
        const matStock = stockByGoodsId[matGoodsId]
        const whId = matStock?.warehouse_id ?? 0
        const whName = matStock?.warehouse_name ?? ''
        const key = String(whId)
        if (!byWarehouse[key]) byWarehouse[key] = { wh_id: whId, wh_name: whName, goods: [] }
        byWarehouse[key].goods.push({
          goods_id: matGoodsId,
          goods_name: mat.goods_name || '',
          goods_sn: mat.goods_sn,
          num: Number(mat.num) * finishedQty,
          unit_name: mat.unit_name || '',
          price: 0,
        })
      }

      for (const wk of Object.values(byWarehouse)) {
        if (!wk.goods.length) continue
        const remark = `BOM${direction === 'in' ? '扣料' : '反审核恢复'}-${item.goods_name || item.goods_sn}`
        if (direction === 'in') {
          const addRes = await http.post('/stock/OtherOut/add', {
            warehouse_id: wk.wh_id, warehouse_name: wk.wh_name, remark, goods_info: wk.goods,
          })
          const outId = addRes.data?.id
          if (outId) await http.post('/stock/OtherOut/audit', { id: outId, status: 1 })
        } else {
          const addRes = await http.post('/stock/OtherIn/add', {
            warehouse_id: wk.wh_id, warehouse_name: wk.wh_name, remark, goods_info: wk.goods,
          })
          const inId = addRes.data?.id
          if (inId) await http.post('/stock/OtherIn/audit', { id: inId, status: 1 })
        }
      }
    } catch (e: any) {
      console.warn('BOM原材料库存操作失败', item.goods_sn, e?.message)
    }
  }
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('procure.order.msgAuditAction') : t('procure.order.msgRejectAction')
  await ElMessageBox.confirm(`${t('procure.order.msgAuditConfirmPrefix')} ${action} ${t('procure.order.msgAuditConfirmSuffix')}`, t('procure.order.msgPrompt'), { type: 'warning' })
  try {
    // 后端要求 fund_id 不为 0 才能审核；pay_amount=0 时静默填第一个账户（不影响余额）
    if (status === 1 && !Number(row.fund_id)) {
      if (!fundOptions.value.length) await loadFunds()
      const opts = fundOptions.value
      if (opts.length) {
        const f = opts[0]
        await updateProcureOrder({ id: row.id, fund_id: f.id, fund_name: f.name })
        row.fund_id = f.id
      }
    }
    await auditProcureOrder(row.id, status)
    // 审核通过后自动创建并审核采购入库记录（先检查是否已存在，避免重复）
    if (status === 1) {
      try {
        const items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]')
        await syncGoodsCostPriceFromItems(items)
      } catch (e: any) {
        console.warn('审核回写商品成本价失败', row?.id, e?.message)
      }
      try {
        const _allInhouse4 = await getProcureInhouseList({ list_rows: 2000 })
        const existRows: any[] = (_allInhouse4.data?.rows ?? []).filter((r: any) => Number(r.purchase_order_id) === Number(row.id))
        const alreadyAudited = existRows.filter((r: any) => r.status === 1)
        if (alreadyAudited.length > 0) {
          ElMessage.warning(t('procure.order.msgInhouseExistsWarning'))
          tableRef.value?.refresh()
          return
        }
        if (existRows.length === 0) {
          const items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]')
          const inhouseRes = await createProcureInhouse({
            purchase_order_id: row.id,
            supplier_id: row.supplier_id,
            supplier_name: row.supplier_name,
            warehouse_id: row.warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id')) || 0,
            warehouse_name: row.warehouse_name || warehouseOptions.value.find((w: any) => w.id === (row.warehouse_id || Number(localStorage.getItem('erp_default_warehouse_id'))))?.name || '',
            admin_name: row.admin_name || '',
            in_date: (row.order_date || row.created_at || '').slice(0, 10),
            total_amount: row.total_amount,
            remark: row.remark || '',
            goods_info: items,
          })
          const inhouseId = inhouseRes.data?.id ?? inhouseRes.data
          if (inhouseId) {
            await auditProcureInhouse(inhouseId, 1)
            // 更新后端库存表
            await applyInhouseStockEffect(row.warehouse_id || 0, row.warehouse_name || '', items, 'in')
          }
        } else {
          // 已有入库单，只取最新一条操作，多余的删掉（防重复）
          const sorted = [...existRows].sort((a, b) => b.id - a.id)
          const keep = sorted[0]
          for (const r of sorted.slice(1)) {
            try { await http.post('/stock/ProcureInhouse/del', { ids: r.id }) } catch {}
          }
          if (keep.status !== 1) {
            await auditProcureInhouse(keep.id, 1)
            const rItems = Array.isArray(keep.goods_info) ? keep.goods_info : JSON.parse(keep.goods_info || '[]')
            await applyInhouseStockEffect(keep.warehouse_id || row.warehouse_id || 0, keep.warehouse_name || row.warehouse_name || '', rItems, 'in')
          }
        }
      } catch (e: any) {
        ElMessage.error(t('procure.order.msgInhouseFailed') + (e?.message || ''))
        console.warn('自动创建采购入库记录失败', e?.message)
      }
    }
    stockRefreshStore.trigger()
    // 审核通过且有付款金额，创建付款单记录
    if (status === 1 && Number(row.pay_amount || 0) > 0 && Number(row.fund_id || 0)) {
      try {
        await createPayReceipt({
          contact_type: 'supplier',
          contact_name: row.supplier_name,
          supplier_name: row.supplier_name,
          order_sn: row.order_sn || row.order_no || '',
          order_id: row.id,
          amount: Number(row.pay_amount),
          pay_date: (row.order_date || row.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10),
          fund_id: Number(row.fund_id),
          fund_name: row.fund_name || '',
          remark: `Purchase Order Payment #${row.id}`,
        })
      } catch (e: any) { console.warn('创建付款单失败', e?.message) }
    }
    const items = Array.isArray(row.goods_info) ? row.goods_info : (() => { try { return JSON.parse(row.goods_info || '[]') } catch { return [] } })()
    const stockDesc = items.map((i: any) => `${i.goods_name || 'Goods'} ×${i.num}`).join(', ')
    const payAmount = Number(row.pay_amount || 0)
    const fundLine = payAmount > 0 && row.fund_name ? `💰 ${row.fund_name} -¥${payAmount.toFixed(2)} (Purchase Payment)` : ''
    ElNotification({
      title: status === 1 ? t('procure.order.msgAuditSuccess') : `${action} OK`,
      dangerouslyUseHTMLString: true, type: 'success', duration: 5000,
      message: `<div style="font-size:12px;line-height:2">📦 ${t('procure.order.msgStockRestored')}${stockDesc}${fundLine ? `<br>${fundLine}` : ''}</div>`,
    })
    tableRef.value?.refresh()
    loadPaidMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgOperationFailed'))
  }
}

async function handleReverseAudit(row: any) {
  // 先检查是否存在关联的退货单（order_id 存在 goods_info 的 _meta 对象中）
  try {
    const returnRes = await getProcureReturnList({ list_rows: 500 })
    const allReturns: any[] = returnRes.data?.rows ?? []
    const linkedReturns = allReturns.filter((r: any) => {
      // 顶层 order_id
      if (Number(r.order_id) === Number(row.id)) return true
      // goods_info 内 _meta.order_id
      try {
        const goods = typeof r.goods_info === 'string' ? JSON.parse(r.goods_info) : (r.goods_info || [])
        const meta = goods.find((g: any) => g._meta)
        if (meta && Number(meta.order_id) === Number(row.id)) return true
      } catch {}
      return false
    })
    if (linkedReturns.length > 0) {
      const auditedCount = linkedReturns.filter((r: any) => r.status === 1).length
      const pendingCount = linkedReturns.length - auditedCount
      const parts = []
      if (auditedCount) parts.push(`${auditedCount} ${t('procure.order.msgReverseAuditAuditedSuffix')}`)
      if (pendingCount) parts.push(`${pendingCount} ${t('procure.order.msgReverseAuditPendingSuffix')}`)
      ElMessage.warning(`${t('procure.order.msgReverseAuditHasReturnPrefix')} ${parts.join(', ')} ${t('procure.order.msgReverseAuditHasReturn')}`)
      return
    }
  } catch (e: any) {
    console.warn('检查退货单失败', e?.message)
  }
  await ElMessageBox.confirm(t('procure.order.msgReverseAuditConfirm'), t('procure.order.msgReverseAuditTitle'), { type: 'warning' })
  try {
    // 检查主付款记录（采购单付款 #ID），若有则提示并撤销
    const mainPaid = paidMapById.value[row.id] || 0
    if (mainPaid > 0) {
      await ElMessageBox.confirm(
        t('procure.order.msgRevokePayConfirmPrefix') + mainPaid.toFixed(2) + t('procure.order.msgRevokePayConfirmSuffix'),
        t('procure.order.msgRevokePayTitle'),
        { type: 'warning', confirmButtonText: t('procure.order.msgConfirmRevoke'), cancelButtonText: t('procure.order.msgCancelAction') }
      )
      try {
        const payRes = await getPayReceiptList({ list_rows: 2000 })
        const payRows: any[] = payRes.data?.rows ?? []
        const mainRecords = payRows.filter((r: any) =>
          Number(r.order_id) === Number(row.id) ||
          String(r.remark || '').match(new RegExp(`(?:采购单(?:自动)?付款|Purchase Order Payment)\\s*#${row.id}(?:\\D|$)`))
        )
        for (const rec of mainRecords) {
          await deletePayReceipt(rec.id)
        }
      } catch (e: any) { console.warn('撤销主付款记录失败', e?.message) }
    }

    // 检查单据支出付款记录，若有则提示并撤销
    const expensePaid = expensePaidById.value[row.id] || 0
    if (expensePaid > 0) {
      await ElMessageBox.confirm(
        t('procure.order.msgRevokeExpenseConfirmPrefix') + expensePaid.toFixed(2) + t('procure.order.msgRevokeExpenseConfirmSuffix'),
        t('procure.order.msgRevokeExpenseTitle'),
        { type: 'warning', confirmButtonText: t('procure.order.msgConfirmRevoke'), cancelButtonText: t('procure.order.msgCancelAction') }
      )
      // 找到对应付款单并删除
      try {
        const payRes = await getPayReceiptList({ list_rows: 2000 })
        const payRows: any[] = payRes.data?.rows ?? []
        const expenseRecords = payRows.filter((r: any) =>
          String(r.remark || '').match(new RegExp(`采购单据支出\\s*#${row.id}(?:\\D|$)`))
        )
        for (const rec of expenseRecords) {
          await deletePayReceipt(rec.id)
        }
      } catch (e: any) { console.warn('撤销单据支出付款失败', e?.message) }
    }

    // 检查运费付款记录，若有则提示并撤销
    const freightPaid = freightPaidById.value[row.id] || 0
    if (freightPaid > 0) {
      await ElMessageBox.confirm(
        t('procure.order.msgRevokeFreightConfirmPrefix') + freightPaid.toFixed(2) + t('procure.order.msgRevokeFreightConfirmSuffix'),
        t('procure.order.msgRevokeFreightTitle'),
        { type: 'warning', confirmButtonText: t('procure.order.msgConfirmRevoke'), cancelButtonText: t('procure.order.msgCancelAction') }
      )
      // 找到对应付款单并删除
      try {
        const payRes = await getPayReceiptList({ list_rows: 2000 })
        const payRows: any[] = payRes.data?.rows ?? []
        const freightRecords = payRows.filter((r: any) =>
          String(r.remark || '').match(new RegExp(`采购运费\\s*#${row.id}(?:\\D|$)`))
        )
        for (const rec of freightRecords) {
          await deletePayReceipt(rec.id)
        }
      } catch (e: any) { console.warn('撤销运费付款失败', e?.message) }
    }
    // 先反审核关联的采购入库记录（后端过滤参数无效，全量拉取后前端过滤）
    try {
      const inhouseListRes = await getProcureInhouseList({ list_rows: 2000 })
      const allInhouse: any[] = inhouseListRes.data?.rows ?? []
      const inhouseRows = allInhouse.filter((r: any) => Number(r.purchase_order_id) === Number(row.id))

      // 拉所有 BOM 扣料的其他出库单，准备删除
      const otherOutRes = await http.get('/stock/OtherOut/index', { params: { list_rows: 2000 } })
      const allOtherOut: any[] = otherOutRes.data?.rows ?? []

      for (const r of inhouseRows) {
        if (r.status === 1) {
          await auditProcureInhouse(r.id, 0)
          // 找到该入库单对应的 BOM 扣料单（通过 remark 匹配商品名），反审核并删除
          const rItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          const bomGoodsNames = rItems.map((i: any) => i.goods_name || i.goods_sn).filter(Boolean)
          const relatedOtherOut = allOtherOut.filter((o: any) =>
            bomGoodsNames.some((name: string) => String(o.remark || '').includes(`BOM扣料-${name}`))
          )
          for (const o of relatedOtherOut) {
            try {
              await http.post('/stock/OtherOut/annul', { id: o.id })
            } catch (e: any) { console.warn('删除BOM扣料单失败', o.id, e?.message) }
          }
        }
      }
    } catch (e: any) {
      console.warn('采购入库反审核失败', e?.message)
    }
    await auditProcureOrder(row.id, 0)
    stockRefreshStore.trigger()
    const rItems = Array.isArray(row.goods_info) ? row.goods_info : (() => { try { return JSON.parse(row.goods_info || '[]') } catch { return [] } })()
    const rStockDesc = rItems.map((i: any) => `${i.goods_name || 'Goods'} ×${i.num}`).join(', ')
    ElNotification({
      title: t('procure.order.msgUnauditSuccessTitle'), dangerouslyUseHTMLString: true, type: 'warning', duration: 5000,
      message: `<div style="font-size:12px;line-height:2">📦 ${t('procure.order.msgStockRestored')}${rStockDesc}<br>💰 ${t('procure.order.msgFinanceRevoked')}</div>`,
    })
    tableRef.value?.refresh()
    loadPaidMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgOperationFailed'))
  }
}

// ── 附件上传 ──────────────────────────────────────────────────────────────────
const attachInputRef = ref<HTMLInputElement>()

function onAttachChange(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    const reader = new FileReader()
    reader.onload = (ev) => {
      fd.attachments.push({
        name: file.name,
        size: file.size,
        type: file.type,
        data: ev.target!.result as string,
      })
    }
    reader.readAsDataURL(file)
  }
  // reset so same file can be re-selected
  ;(e.target as HTMLInputElement).value = ''
}

function removeAttach(index: number) {
  fd.attachments.splice(index, 1)
}

function downloadAttach(f: AttachFile) {
  const a = document.createElement('a')
  a.href = f.data
  a.download = f.name
  a.click()
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function getFileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'Picture'
  if (['pdf'].includes(ext)) return 'Document'
  if (['xls', 'xlsx'].includes(ext)) return 'Grid'
  if (['doc', 'docx'].includes(ext)) return 'Document'
  if (['zip', 'rar', '7z'].includes(ext)) return 'FolderOpened'
  return 'Paperclip'
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (fd.items.some(i => i.goods_id === g.id)) continue
    const priceNoTax = isKaoNaiPiGoods(g)
      ? KAONAIPI_BASE_COST
      : (Number(g.cost_price) || 0)
    fd.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      spec: '', cate_name: g.cate_name || '', unit_name: isKaoNaiPiGoods(g) ? KAONAIPI_BASE_UNIT : (g.unit_name || ''),
      num: 1, price_no_tax: priceNoTax, tax_rate: 0, unit_ratio: 1, _base_price_no_tax: priceNoTax,
      price: priceNoTax, remark: '',
      supplier_id: null, supplier_name: '',
      _current_unit_name: isKaoNaiPiGoods(g) ? KAONAIPI_BASE_UNIT : (g.unit_name || '') })
    if (g.multi_spec) {
      const { options, skus } = parseSpecJson(String(g.spec || ''))
      goodsSpecMap[g.id] = options
      goodsSkuDataMap[g.id] = skus
    } else {
      goodsSpecMap[g.id] = []
    }
    fetchGoodsUnits(g.id, g.unit_name || '')
    repairKaoNaiPiMasterData(g)
    applyKaoNaiPiRowDefaults(fd.items[fd.items.length - 1])
  }
  calcTotal()
}

// 切换采购单位时，更新 unit_ratio 字段供入库换算使用
function onUnitChange(row: any, unitName: string) {
  const units = goodsUnitMap[row.goods_id] ?? []

  // row.unit_name is already updated to unitName by v-model before @change fires,
  // so use _current_unit_name to look up the OLD unit's real ratio from the map.
  const oldUnitName = String((row as any)._current_unit_name || '')
  const oldUnitEntry = oldUnitName ? units.find(u => u.unit_name === oldUnitName) : null
  const prevRatio = oldUnitEntry
    ? Math.max(0.0001, Number(oldUnitEntry.ratio || 1))
    : Math.max(0.0001, Number(row.unit_ratio || 1))

  const found = units.find(u => u.unit_name === unitName)
  const nextRatio = found ? Number(found.ratio || 1) : 1
  row.unit_ratio = nextRatio
  ;(row as any)._current_unit_name = unitName

  // Keep _base_price_no_tax updated (base unit cost, used by inventory sync on audit)
  const basePriceFromPrev = Number(row.price_no_tax || 0) / prevRatio
  if (basePriceFromPrev > 0) {
    row._base_price_no_tax = Number(basePriceFromPrev.toFixed(6))
  }

  // Unit-specific cost_price from convert table (currently always null in this ERP)
  let nextPriceNoTax = Number(found?.cost_price || 0)

  // KaoNaiPi goods have hardcoded unit prices — keep special logic
  if (!(nextPriceNoTax > 0) && isKaoNaiPiGoods(row)) {
    nextPriceNoTax = unitName === KAONAIPI_AUX_UNIT
      ? Number((KAONAIPI_BASE_COST * KAONAIPI_AUX_RATIO).toFixed(4))
      : KAONAIPI_BASE_COST
  }

  if (nextPriceNoTax > 0) {
    row.price_no_tax = Number(nextPriceNoTax.toFixed(4))
    row._base_price_no_tax = Number((nextPriceNoTax / Math.max(0.0001, nextRatio)).toFixed(6))
    calcItemTax(row)
  } else {
    // No price configured for this unit: clear so user enters the actual purchase price.
    // Purchasing prices are supplier-negotiated and cannot be derived by multiplying ratio.
    row.price_no_tax = 0
    row.price = 0
  }

  calcTotal()
}

// ── 手动新增商品 ──────────────────────────────────────────────────────────────
const manualAddVisible = ref(false)
const manualAddLoading = ref(false)
const manualForm = reactive({
  goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, price: 0
})

function openManualAdd() {
  Object.assign(manualForm, { goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, price: 0 })
  manualAddVisible.value = true
}

async function confirmManualAdd() {
  if (!manualForm.goods_name.trim()) { ElMessage.warning(t('procure.order.msgGoodsNameRequired')); return }
  manualAddLoading.value = true
  let goods_id = 0
  let goods_sn = manualForm.goods_sn
  try {
    const res = await createGoods({
      goods_name: manualForm.goods_name,
      goods_sn: manualForm.goods_sn,
      spec: manualForm.spec,
      unit_name: manualForm.unit_name,
      cost_price: manualForm.price,
      sell_price: manualForm.price,
    })
    goods_id = res.data?.id ?? 0
    if (res.data?.goods_sn) goods_sn = res.data.goods_sn
    if (goods_id) ElMessage.success(t('procure.order.msgGoodsArchived') + manualForm.goods_name)
  } catch {
    ElMessage.warning(t('procure.order.msgGoodsArchiveFailed'))
  } finally {
    manualAddLoading.value = false
  }
  fd.items.push({
    goods_id,
    goods_name: manualForm.goods_name,
    goods_sn,
    spec: manualForm.spec,
    cate_name: '',
    unit_name: manualForm.unit_name,
    num: manualForm.num,
    price_no_tax: Number((manualForm.price / 1.13).toFixed(4)),
    tax_rate: 0,
    price: manualForm.price,
    remark: '',
    supplier_id: null,
    supplier_name: '',
  })
  calcTotal()
  manualAddVisible.value = false
}

// ── 采购计划选择 ──────────────────────────────────────────────────────────────
const planPickerVisible = ref(false)
const planPickerLoading = ref(false)
const planPickerKeyword = ref('')
const planList = ref<any[]>([])
const selectedPlan = ref<any>(null)
const planItems = ref<any[]>([])
const selectedPlanItems = ref<any[]>([])
const planItemTableRef = ref()

const filteredPlanList = computed(() => {
  if (!planPickerKeyword.value) return planList.value
  const kw = planPickerKeyword.value
  return planList.value.filter(p =>
    p.order_sn?.includes(kw) || p.supplier_name?.includes(kw)
  )
})

async function openPlanPicker() {
  planPickerKeyword.value = ''
  selectedPlan.value = null
  planItems.value = []
  selectedPlanItems.value = []
  planPickerVisible.value = true
  planPickerLoading.value = true
  try {
    const res = await http.get('/procure/ProcurePlan/index', { params: { status: 1, list_rows: 200 } })
    planList.value = res.data?.rows || []
  } catch {
    planList.value = []
  } finally {
    planPickerLoading.value = false
  }
}

function selectPlan(plan: any) {
  selectedPlan.value = plan
  selectedPlanItems.value = []
  planItems.value = parseItems(plan.goods_info)
}

function confirmPlanItems() {
  const newItems = selectedPlanItems.value.map(item => ({
    goods_id: item.goods_id || 0,
    goods_name: item.goods_name || '',
    goods_sn: item.goods_sn || '',
    spec: item.spec || '',
    cate_name: item.cate_name || '',
    unit_name: item.unit_name || '',
    num: item.num || 1,
    price: item.price || 0,
    total: ((item.num || 1) * (item.price || 0)),
    remark: '',
    supplier_id: null,
    supplier_name: '',
  }))
  fd.items.push(...newItems)
  calcTotal()
  // 预填供应商（如果还没填）
  if (selectedPlan.value && !fd.supplier_id) {
    fd.supplier_id = selectedPlan.value.supplier_id
    fd.supplier_name = selectedPlan.value.supplier_name || ''
  }
  // 标记该计划为已转单
  if (selectedPlan.value?.id) {
    fd.plan_id = selectedPlan.value.id
    http.post('/procure/ProcurePlan/edit', { id: selectedPlan.value.id, status: 4 }).catch(() => {})
  }
  planPickerVisible.value = false
  ElMessage.success(`${t('procure.order.msgPlanImportSuccess')} ${newItems.length} ${t('procure.order.msgPlanImportUnit')}`)
}

// ── BOM商品选择 ───────────────────────────────────────────────────────────────
const bomPickerVisible = ref(false)
const bomPickerLoading = ref(false)
const bomGoodsList = ref<any[]>([])   // 成品列表
const bomPickerKeyword = ref('')
const selectedBomGoods = ref<any>(null)
const bomMaterials = ref<any[]>([])   // 选中成品的物料
const bomMaterialsLoading = ref(false)
const selectedBomMaterials = ref<any[]>([])
const bomMaterialTableRef = ref()

const filteredBomGoods = computed(() => {
  if (!bomPickerKeyword.value) return bomGoodsList.value
  return bomGoodsList.value.filter(g =>
    g.goods_name?.includes(bomPickerKeyword.value) || g.goods_sn?.includes(bomPickerKeyword.value)
  )
})

async function openBomPicker() {
  bomPickerKeyword.value = ''
  selectedBomGoods.value = null
  bomMaterials.value = []
  selectedBomMaterials.value = []
  bomPickerVisible.value = true
  bomPickerLoading.value = true
  try {
    const res = await getBomList({ list_rows: 1000 })
    const rows: any[] = res.data?.rows ?? []
    const map = new Map<number, any>()
    for (const r of rows) {
      if (r.goods_id && !map.has(r.goods_id)) {
        map.set(r.goods_id, { goods_id: r.goods_id, goods_name: r.goods_name, goods_sn: r.goods_sn })
      }
    }
    bomGoodsList.value = Array.from(map.values())
  } finally {
    bomPickerLoading.value = false
  }
}

async function selectBomGoods(item: any) {
  selectedBomGoods.value = item
  selectedBomMaterials.value = []
  bomMaterialsLoading.value = true
  try {
    const res = await getBomByGoods(item.goods_id)
    bomMaterials.value = (res.data?.rows ?? []).filter((r: any) => r.num > 0)
  } finally {
    bomMaterialsLoading.value = false
  }
}

function onBomMaterialSelectionChange(rows: any[]) {
  selectedBomMaterials.value = rows
}

function confirmBomGoods() {
  for (const m of selectedBomMaterials.value) {
    if (fd.items.some(i => i.goods_name === m.material_name && i.goods_sn === m.material_sn)) continue
    fd.items.push({
      goods_id: 0,
      goods_name: m.material_name,
      goods_sn: m.material_sn || '',
      spec: '',
      cate_name: '',
      unit_name: m.unit_name || '',
      num: m.num || 1,
      price_no_tax: 0,
      tax_rate: 0,
      price: 0,
      remark: `BOM Material (${selectedBomGoods.value?.goods_name ?? ''})`,
      supplier_id: null,
      supplier_name: '',
    })
  }
  calcTotal()
  bomPickerVisible.value = false
}

// ── 批量编辑 ──────────────────────────────────────────────────────────────────
const batchEditVisible = ref(false)
const batchEditFieldKey = ref('')
const batchEditLabel = ref('')
const batchEditValue = ref(0)

function batchEditField(field: string) {
  const fieldLabelMap: Record<string, string> = {
    num: t('procure.order.fieldPurchaseNum'),
    price_no_tax: t('procure.order.fieldPriceNoTax'),
    tax_rate: t('procure.order.fieldTaxRate'),
    price: t('procure.order.fieldPriceWithTax'),
    subtotal_no_tax: t('procure.order.fieldSubtotalNoTax'),
  }
  batchEditFieldKey.value = field
  batchEditLabel.value = fieldLabelMap[field] || field
  batchEditValue.value = 0
  batchEditVisible.value = true
}

function confirmBatchEdit() {
  const field = batchEditFieldKey.value
  if (field === 'subtotal_no_tax') {
    ElMessage.info(t('procure.order.msgSubtotalReadonly'))
    batchEditVisible.value = false
    return
  }
  for (const row of fd.items) {
    ;(row as any)[field] = batchEditValue.value
    if (field === 'price_no_tax' || field === 'tax_rate') {
      calcItemTax(row)
    } else if (field === 'price') {
      onPriceChange(row)
    }
  }
  calcTotal()
  batchEditVisible.value = false
  ElMessage.success(`${t('procure.order.msgBatchSetSuccess')} ${batchEditLabel.value} ${t('procure.order.msgBatchSetTo')} ${batchEditValue.value}`)
}

// ── 快速新增供应商 ────────────────────────────────────────────────────────────
const addSupplierVisible = ref(false)
const addSupplierLoading = ref(false)
const supplierForm = reactive({ name: '' })

function openAddSupplier() {
  supplierForm.name = ''
  addSupplierVisible.value = true
}

async function submitAddSupplier() {
  if (!supplierForm.name.trim()) { ElMessage.warning(t('procure.order.msgSupplierRequired')); return }
  addSupplierLoading.value = true
  try {
    const res = await createSupplier({ name: supplierForm.name.trim() })
    ElMessage.success(t('procure.order.msgAddSupplierSuccess'))
    addSupplierVisible.value = false
    await loadSuppliers()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.supplier_id = newId; onSupplierChange(newId) }
    else {
      const last = supplierOptions.value[supplierOptions.value.length - 1]
      if (last) { fd.supplier_id = last.id; onSupplierChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgAddSupplierFailed'))
  } finally {
    addSupplierLoading.value = false
  }
}

// ── 快速新增资金账户 ──────────────────────────────────────────────────────────
const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

function openAddFund() {
  fundForm.name = ''
  fundForm.balance = 0
  addFundVisible.value = true
}

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning(t('procure.order.msgFundRequired')); return }
  addFundLoading.value = true
  try {
    const res = await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('procure.order.msgAddFundSuccess'))
    addFundVisible.value = false
    await loadFunds()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.fund_id = newId; onFundChange(newId) }
    else {
      const last = fundOptions.value[fundOptions.value.length - 1]
      if (last) { fd.fund_id = last.id; onFundChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.order.msgAddFundFailed'))
  } finally {
    addFundLoading.value = false
  }
}

// ── 分享功能 ─────────────────────────────────────────────────────────────────

async function handleRowShareCmd(cmd: string, row: any) {
  if (cmd === 'link') await handleRowShareLink(row)
  else if (cmd === 'pdf') await handleRowSharePdf(row)
}

async function handleRowShareLink(row: any) {
  const token = localStorage.getItem('erp_token') || ''
  if (!row.id || !token) { ElMessage.warning(t('procure.order.msgShareLinkNoId')); return }
  const base = window.location.origin + window.location.pathname
  const url = `${base}#/share/purchase-order/${row.id}?token=${encodeURIComponent(token)}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success(t('procure.order.msgShareLinkCopied'))
  } catch {
    ElMessage.info(t('procure.order.msgShareLinkManualCopy') + url)
  }
}

async function handleRowSharePdf(row: any) {
  await generatePurchaseOrderPdf([row])
}

async function handleDetailShareCommand(cmd: string) {
  if (cmd === 'link') {
    const token = localStorage.getItem('erp_token') || ''
    const id = (fd as any).id
    if (!id || !token) { ElMessage.warning(t('procure.order.msgShareLinkNoId')); return }
    const base = window.location.origin + window.location.pathname
    const url = `${base}#/share/purchase-order/${id}?token=${encodeURIComponent(token)}`
    try {
      await navigator.clipboard.writeText(url)
      ElMessage.success(t('procure.order.msgShareLinkCopied'))
    } catch {
      ElMessage.info(t('procure.order.msgShareLinkManualCopy') + url)
    }
  } else if (cmd === 'pdf') {
    const items = Array.isArray((fd as any).items) ? (fd as any).items : []
    const row = { ...(fd as any), goods_info: items }
    await generatePurchaseOrderPdf([row])
  }
}

async function handleBatchShareCmd(cmd: string, selRows: any[]) {
  if (cmd === 'link') await handleBatchShareLink(selRows)
  else if (cmd === 'pdf') await handleBatchSharePdf(selRows)
}

async function handleBatchShareLink(selRows: any[]) {
  const rows = selRows.filter((r: any) => !r._isGroup)
  if (!rows.length) { ElMessage.warning(t('procure.order.msgShareSelectFirst')); return }
  const token = localStorage.getItem('erp_token') || ''
  if (!token) { ElMessage.warning(t('procure.order.msgShareLinkExpired')); return }
  const ids = rows.map((r: any) => r.id).join(',')
  const base = window.location.origin + window.location.pathname
  const url = `${base}#/share/purchase-orders?ids=${encodeURIComponent(ids)}&token=${encodeURIComponent(token)}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success(`${t('procure.order.msgShareLinkCopiedBatch')} ${rows.length} ${t('procure.order.msgShareLinkCopiedBatchUnit')}`)
  } catch {
    ElMessage.info(t('procure.order.msgShareLinkManualCopy') + url)
  }
}

async function handleBatchSharePdf(selRows: any[]) {
  const rows = selRows.filter((r: any) => !r._isGroup)
  if (!rows.length) { ElMessage.warning(t('procure.order.msgShareSelectFirst')); return }
  await generatePurchaseOrderPdf(rows)
}

async function generatePurchaseOrderPdf(rows: any[]) {
  const msg = ElMessage({ message: `${t('procure.order.msgPdfGenerating')} ${rows.length} ${t('procure.order.msgPdfGeneratingUnit')}`, duration: 0, type: 'info' })
  try {
    const [{ jsPDF }, html2canvas] = await Promise.all([import('jspdf'), import('html2canvas')])
    const fmt2 = (v: any) => Number(v || 0).toFixed(2)
    const fmtD = (d: any) => d ? String(d).slice(0, 10) : '—'

    const grandTotal = rows.reduce((s: number, r: any) => {
      const amt = Number(r.after_discount > 0 ? r.after_discount : r.total_amount || 0)
      return s + amt
    }, 0)
    const grandUnpaid = rows.reduce((s: number, r: any) => {
      const amt = Number(r.after_discount > 0 ? r.after_discount : r.total_amount || 0)
      return s + Math.max(0, amt - Number(r.pay_amount || 0))
    }, 0)
    const supplierName = rows[0]?.supplier_name || ''
    const dateStr = new Date().toLocaleDateString('zh-CN')

    const _useLogo = showLogoForCurrentUser()
    const coverBlock = `
      <div style="background:#1d1d1f;border-radius:12px;padding:32px 40px;margin-bottom:36px;color:#fff">
        ${brandHeaderHtmlPdf(_useLogo, 'dark')}
        <div style="font-size:32px;font-weight:700;letter-spacing:1px;margin-bottom:6px">${t('procure.order.pdfTitle')}</div>
        <div style="font-size:13px;opacity:0.55;margin-bottom:24px">${t('procure.order.pdfSupplier')}${supplierName} &nbsp;·&nbsp; ${t('procure.order.pdfCount')} ${rows.length} ${t('procure.order.pdfCountUnit')} &nbsp;·&nbsp; ${dateStr}</div>
        <div style="display:flex;gap:40px;align-items:baseline">
          <div>
            <div style="font-size:12px;opacity:0.55;margin-bottom:4px">${t('procure.order.pdfTotalAmount')}</div>
            <div style="font-size:36px;font-weight:700;color:#5ac8fa">¥${fmt2(grandTotal)}</div>
          </div>
          <div>
            <div style="font-size:12px;opacity:0.55;margin-bottom:4px">${t('procure.order.pdfUnpaidBalance')}</div>
            <div style="font-size:22px;font-weight:700;color:${grandUnpaid > 0 ? '#ff9f9f' : '#7ddf9e'}">${grandUnpaid > 0 ? '¥' + fmt2(grandUnpaid) : t('procure.order.pdfAllPaid')}</div>
          </div>
          <div>
            <div style="font-size:12px;opacity:0.55;margin-bottom:4px">${t('procure.order.pdfDocCount')}</div>
            <div style="font-size:22px;font-weight:700;color:#fff">${rows.length} ${t('procure.order.pdfCountUnit')}</div>
          </div>
        </div>
      </div>`

    const orderBlocks = rows.map((row: any, idx: number) => {
      const items: any[] = (() => { try { return Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { return [] } })()
      const totalAmt = Number(row.after_discount > 0 ? row.after_discount : row.total_amount || 0)
      const paidAmt = Number(row.pay_amount || 0)
      const balance = Math.max(0, totalAmt - paidAmt)
      const goodsRows = items.map((item: any, i: number) => `
        <tr style="background:${i % 2 === 0 ? '#f9f9fb' : '#fff'}">
          <td style="padding:7px 6px">${item.goods_name || ''}</td>
          <td style="padding:7px 6px;text-align:center">${item.spec || '—'}</td>
          <td style="padding:7px 6px;text-align:center">${item.num || 0} ${item.unit_name || ''}</td>
          <td style="padding:7px 6px;text-align:right">¥${fmt2(item.price)}</td>
          <td style="padding:7px 6px;text-align:right;font-weight:600;color:#0071e3">¥${fmt2(Number(item.price) * Number(item.num))}</td>
        </tr>`).join('')
      const divider = idx > 0 ? '<div style="border-top:2px dashed #e5e5ea;margin:32px 0"></div>' : ''
      return `${divider}
        <div style="display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px">
          <div>
            <div style="font-size:13px;color:#86868b;margin-bottom:3px">${t('procure.order.pdfOrderNo')}${row.order_no || row.order_sn || ''}</div>
            <div style="font-size:15px;font-weight:700;color:#1d1d1f">${row.supplier_name || '—'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#86868b">${fmtD(row.order_date)}</div>
            <div style="font-size:11px;color:#86868b">${row.admin_name || ''}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px">
          <thead>
            <tr style="background:#1d1d1f;color:#fff">
              <th style="padding:8px 6px;text-align:left">${t('procure.order.pdfColGoodsName')}</th>
              <th style="padding:8px 6px;text-align:center">${t('procure.order.pdfColSpec')}</th>
              <th style="padding:8px 6px;text-align:center">${t('procure.order.pdfColNum')}</th>
              <th style="padding:8px 6px;text-align:right">${t('procure.order.pdfColPrice')}</th>
              <th style="padding:8px 6px;text-align:right">${t('procure.order.pdfColSubtotal')}</th>
            </tr>
          </thead>
          <tbody>${goodsRows}</tbody>
        </table>
        <div style="text-align:right;padding-top:10px;border-top:1px solid #f2f2f7">
          <div style="font-size:18px;font-weight:700;color:#0071e3;margin-bottom:3px">${t('procure.order.pdfTotalWithTax')} ¥${fmt2(totalAmt)}</div>
          ${paidAmt > 0 ? `<div style="font-size:12px;color:#86868b">${t('procure.order.pdfPaid')} <span style="color:#34c759;font-weight:600">¥${fmt2(paidAmt)}</span> &nbsp; ${t('procure.order.pdfUnpaid')} <span style="color:#ff3b30;font-weight:700">¥${fmt2(balance)}</span></div>` : ''}
        </div>`
    }).join('')

    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:PingFang SC,Microsoft YaHei,sans-serif;color:#1d1d1f;padding:40px 50px;box-sizing:border-box;'
    wrap.innerHTML = coverBlock + orderBlocks + `<div style="margin-top:32px;padding-top:14px;border-top:1px solid #e5e5ea;font-size:11px;color:#c7c7cc;text-align:center">${t('procure.order.pdfFooter')} · ${dateStr}</div>`
    document.body.appendChild(wrap)

    const canvas = await (html2canvas as any).default(wrap, { scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false })
    document.body.removeChild(wrap)

    const imgW = 210; const imgH = (canvas.height * imgW) / canvas.width
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const pageH = 297; let remainH = imgH, srcY = 0
    while (remainH > 0) {
      const sliceH = Math.min(remainH, pageH)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = Math.round((sliceH / imgH) * canvas.height)
      const ctx = sliceCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height)
      if (srcY > 0) doc.addPage()
      doc.addImage(sliceCanvas.toDataURL('image/jpeg', 0.92), 'JPEG', 0, 0, imgW, sliceH)
      srcY += sliceCanvas.height; remainH -= sliceH
    }

    msg.close()
    const filename = `${t('procure.order.pdfTitle')}_${supplierName}_${rows.length}${t('procure.order.pdfFilenameSuffix')}_${dateStr.replace(/\//g, '-')}.pdf`
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(t('procure.order.msgPdfSuccess'))
  } catch (e) {
    msg.close()
    console.error(e)
    ElMessage.error(t('procure.order.msgPdfFailed'))
  }
}
</script>

<style scoped>
.order-page {
  height: 100%;
  min-width: 0;
}

.status-cards {
  display: flex;
  gap: 10px;
}
.status-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
  padding: 10px 18px;
  cursor: pointer;
  transition: box-shadow 0.15s;
  white-space: nowrap;
}
.status-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.status-card.audited { border-left: 3px solid #16a34a; }
.status-card.pending { border-left: 3px solid #d97706; }
.sc-row {
  display: flex;
  align-items: baseline;
  gap: 6px;
}
.sc-dot {
  width: 7px; height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
  align-self: center;
}
.sc-dot.audited { background: #16a34a; }
.sc-dot.pending { background: #d97706; }
.sc-label { font-size: 12px; color: rgba(29,29,31,0.45); }
.sc-num { font-size: 22px; font-weight: 700; color: #1d1d1f; line-height: 1; }
.sc-unit { font-size: 12px; color: rgba(29,29,31,0.4); }
.sc-sep { width: 1px; height: 14px; background: #e4e7ed; align-self: center; }
.sc-money { font-size: 14px; font-weight: 600; color: #1d1d1f; }
.sc-sub { font-size: 12px; color: rgba(29,29,31,0.4); }
.c-red { color: #dc2626; }

.fee-manage-pay {
  margin-top: 14px;
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafbff;
}

.fee-manage-pay-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
  color: #1d1d1f;
}

.fee-manage-pay-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

/* 工具栏合计行 */
:deep(.toolbar-left) {
  flex-wrap: wrap;
  gap: 8px;
}
.toolbar-summary-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 0;
  padding: 6px 2px 0;
  font-size: 13px;
  flex-wrap: wrap;
}
.tsr-item {
  display: flex;
  align-items: baseline;
  gap: 5px;
  padding: 0 14px 0 0;
}
.tsr-item b { font-weight: 700; color: #1d1d1f; }
.tsr-label { font-size: 12px; color: rgba(29,29,31,0.4); }
.tsr-sep { width: 1px; height: 13px; background: #e4e7ed; margin: 0 14px 0 0; }
.tsr-tag {
  font-size: 11px; font-weight: 600;
  border-radius: 3px; padding: 1px 6px;
}
.tsr-tag.green  { color: #16a34a; background: #f0fdf4; }
.tsr-tag.orange { color: #d97706; background: #fffbeb; }
.c-blue  { color: #0071e3 !important; }
.c-green { color: #16a34a !important; }
.c-red   { color: #dc2626 !important; }

.expand-detail {
  padding: 12px 20px 12px 48px;
  background: #f8faff;
}
.expand-title {
  font-size: 12px;
  font-weight: 600;
  color: rgba(29,29,31,0.5);
  margin-bottom: 8px;
}
.expand-table {
  border-radius: 8px;
  overflow: hidden;
}

.form-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  background: #f5f6fa;
  width: 100%;
  min-width: 0;
  overflow-x: hidden;
}

.form-topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #fff;
  border-bottom: 1px solid #e4e7ed;
  padding: 0 20px;
  height: 52px;
  flex-shrink: 0;
}

.form-title { font-size: 15px; font-weight: 600; color: #1d1d1f; }
.form-actions { display: flex; gap: 8px; }

.form-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 16px 18px 14px;
  min-width: 0;
  box-sizing: border-box;
}

.sec-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f7;
  display: block;
}

/* 商品工具栏 */
.goods-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  flex-wrap: wrap;
  gap: 8px;
}

.toolbar-left {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.goods-table-wrap {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

.mobile-goods-list {
  display: none;
}

.goods-count {
  font-size: 13px;
  color: rgba(29,29,31,0.35);
  flex-shrink: 0;
}

/* 表头批量编辑 */
.batch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

/* 结算信息 */
.settlement-section {}

.settlement-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 32px;
  align-items: center;
  margin-bottom: 14px;
}

.settle-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.settle-label {
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  white-space: nowrap;
}

.settle-value {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
}

.settle-value.primary {
  color: #0071e3;
  font-size: 16px;
}

.settle-summary {
  border-top: 1px solid #f5f5f7;
  padding-top: 12px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  display: flex;
  align-items: center;
}

@media (max-width: 767px) {
  .order-page {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  .form-page,
  .form-body,
  .form-section {
    width: 100%;
    max-width: 100%;
  }

  .form-section {
    border-radius: 10px;
    overflow: hidden;
  }

  :deep(.form-section .el-row) {
    margin-left: 0 !important;
    margin-right: 0 !important;
  }

  :deep(.form-section .el-col) {
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  :deep(.el-form-item) {
    margin-right: 0;
  }

  .goods-table-wrap {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .goods-table-wrap :deep(.el-table) {
    min-width: 1120px;
  }

  .desktop-goods-table {
    display: none;
  }

  .mobile-goods-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .mobile-goods-empty {
    min-height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(29,29,31,0.35);
    font-size: 13px;
    border: 1px dashed #dcdfe6;
    border-radius: 10px;
    background: #fafbff;
  }

  .mobile-goods-card {
    border: 1px solid #e5e7eb;
    border-radius: 10px;
    background: #fff;
    overflow: hidden;
  }

  .mobile-goods-head {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr) 32px;
    align-items: center;
    gap: 8px;
    padding: 10px 10px 8px;
    border-bottom: 1px solid #f2f4f7;
    background: #fbfcff;
  }

  .mobile-goods-index {
    width: 26px;
    height: 26px;
    border-radius: 7px;
    background: #eef5ff;
    color: #0071e3;
    font-size: 13px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mobile-goods-name {
    min-width: 0;
    font-size: 15px;
    font-weight: 700;
    color: #1d1d1f;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-goods-name-input :deep(.el-input__wrapper) {
    box-shadow: none;
    background: transparent;
    padding: 0;
  }

  .mobile-goods-name-input :deep(.el-input__inner) {
    font-size: 15px;
    font-weight: 700;
    color: #1d1d1f;
  }

  .mobile-goods-fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    padding: 10px;
  }

  .mobile-field {
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .mobile-field-full {
    grid-column: 1 / -1;
  }

  .mobile-field > span {
    font-size: 12px;
    color: rgba(29,29,31,0.45);
    line-height: 1.2;
  }

  .mobile-field > b {
    min-height: 28px;
    display: flex;
    align-items: center;
    font-size: 14px;
    font-weight: 600;
    color: #1d1d1f;
    overflow-wrap: anywhere;
  }

  .mobile-field :deep(.el-select),
  .mobile-field :deep(.el-input),
  .mobile-field :deep(.el-input-number) {
    width: 100%;
  }

  .mobile-field :deep(.el-input-number .el-input__inner) {
    text-align: center;
  }

  .mobile-goods-total {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 6px;
    padding: 9px 10px 10px;
    border-top: 1px solid #f2f4f7;
    background: #fafafa;
  }

  .mobile-goods-total span {
    min-width: 0;
    font-size: 12px;
    color: rgba(29,29,31,0.5);
    white-space: nowrap;
  }

  .mobile-goods-total b {
    margin-left: 2px;
    font-size: 13px;
    font-weight: 800;
    color: #1d1d1f;
  }

  .settlement-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .settle-item,
  .fee-item-line {
    width: 100%;
    min-width: 0;
    flex-wrap: wrap;
  }

  .settle-summary {
    flex-wrap: wrap;
    gap: 8px 14px;
  }

  .settle-summary span {
    margin-left: 0 !important;
  }
}

/* 附件 */
.attach-area {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.attach-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.attach-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: #f5f7ff;
  border-radius: 10px;
  font-size: 12px;
  color: rgba(29,29,31,0.5);
}

.attach-icon {
  font-size: 14px;
  color: #0071e3;
  flex-shrink: 0;
}

.attach-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 140px;
}

.attach-size {
  color: rgba(29,29,31,0.35);
  flex-shrink: 0;
}

.attach-download {
  font-size: 13px;
  color: #0071e3;
  cursor: pointer;
  flex-shrink: 0;
  opacity: 0.7;
}
.attach-download:hover { opacity: 1; }

.attach-del {
  font-size: 13px;
  color: rgba(29,29,31,0.35);
  cursor: pointer;
  flex-shrink: 0;
}
.attach-del:hover { color: #dc2626; }

:deep(.row-highlight) { background-color: #ecf5ff !important; }
:deep(.row-highlight td) { background-color: #ecf5ff !important; }

:deep(.el-table__footer-wrapper td) {
  background: #f5f7ff !important;
  font-weight: 600;
  font-size: 13px;
  color: #1d1d1f;
}
</style>
