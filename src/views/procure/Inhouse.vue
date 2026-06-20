<template>
  <div class="inhouse-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="reconcileFilteredApi"
          sort-by="in_date" :sort-desc="true"
          :export-file-name="$t('procure.inhouse.exportFileName')" :params="searchForm"
          :row-filter="(row: any) => Number(row.status) === 1"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''"
          :export-columns="{ in_no: $t('procure.inhouse.colInNo'), supplier_name: $t('procure.inhouse.colSupplier'), warehouse_name: $t('procure.inhouse.colWarehouse'), in_date: $t('procure.inhouse.colInDate'), admin_name: $t('procure.inhouse.colHandler'), total_amount: $t('procure.inhouse.colTotalAmount'), status: $t('procure.inhouse.colStatus') }">
          <template #search>
            <el-input v-model="searchForm.in_no" :placeholder="$t('procure.inhouse.searchInNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.supplier_name" :placeholder="$t('procure.inhouse.searchSupplierName')" clearable style="width:150px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('procure.inhouse.searchGoodsName')" clearable style="width:150px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('procure.inhouse.searchReconcilePlaceholder')">
              <el-option :label="$t('procure.inhouse.filterUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('procure.inhouse.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('procure.inhouse.colExpandGoodsName')" min-width="140" />
                  <el-table-column prop="goods_sn" :label="$t('procure.inhouse.colExpandCode')" width="110" />
                  <el-table-column prop="spec" :label="$t('procure.inhouse.colExpandSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('procure.inhouse.colExpandUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('procure.inhouse.colExpandInNum')" width="90" align="right" />
                  <el-table-column :label="$t('procure.inhouse.colExpandPriceWithTax')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('procure.inhouse.colExpandTotalWithTax')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('procure.inhouse.colExpandRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('procure.inhouse.colIndex')" width="60" align="center" />
          <el-table-column prop="in_no" :label="$t('procure.inhouse.colInNo')" min-width="150">
            <template #default="{ row }">{{ row.in_no || row.inhouse_no || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colSupplier')" min-width="130">
            <template #default="{ row }">{{ row.supplier_name || supplierOptions.find(s => s.id === row.supplier_id)?.name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colWarehouse')" width="120">
            <template #default="{ row }">{{ row.warehouse_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colInDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.in_date || row.inhouse_date || row.create_time) }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colHandler')" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colTotalAmount')" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ calcRowTotal(row).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('procure.inhouse.tagAudited') : row.status === 2 ? $t('procure.inhouse.tagRejected') : $t('procure.inhouse.tagPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.inhouse.colActions')" width="130" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row, true)">{{ $t('procure.inhouse.actionView') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('procure.inhouse.actionReconciled') : $t('procure.inhouse.actionReconcile') }}</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('procure.inhouse.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('procure.inhouse.formTitleView') : (fd.id ? $t('procure.inhouse.formTitleEdit') : $t('procure.inhouse.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('procure.inhouse.tagAuditedForm') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" :loading="saving && !savingAndAuditing" :disabled="saving" @click="handleSave(false)">
            {{ $t('procure.inhouse.btnSave') }}
          </el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="savingAndAuditing" :disabled="saving" @click="handleSave(true)">
            {{ $t('procure.inhouse.btnSaveAndAudit') }}
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('procure.inhouse.sectionBasicInfo') }}</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelInNo')">
                  <el-input :value="fd.id ? fd.in_no : $t('procure.inhouse.inNoAutoGenerate')" disabled :placeholder="$t('procure.inhouse.inNoPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelSupplier')" prop="supplier_id"
                  :rules="[{ required: true, message: $t('procure.inhouse.supplierRequired') }]">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.supplier_id" :placeholder="$t('procure.inhouse.supplierPlaceholder')" filterable style="flex:1"
                      @change="onSupplierChange">
                      <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="openAddSupplier" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelHandler')" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('procure.inhouse.handlerPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelInDate')" prop="in_date">
                  <el-date-picker v-model="fd.in_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('procure.inhouse.datePlaceholder')" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelWarehouse')" prop="warehouse_id"
                  :rules="[{ required: true, message: $t('procure.inhouse.warehouseRequired') }]">
                  <el-select v-model="fd.warehouse_id" :placeholder="$t('procure.inhouse.warehousePlaceholder')" filterable style="width:100%"
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelIsAccept')">
                  <el-switch v-model="fd.is_accept" :active-text="$t('procure.inhouse.isAcceptYes')" :inactive-text="$t('procure.inhouse.isAcceptNo')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelPayAccount')">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.pay_account" :placeholder="$t('procure.inhouse.payAccountPlaceholder')" clearable style="flex:1">
                      <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.name" />
                      <el-option :label="$t('procure.inhouse.optionCash')" value="现金" />
                    </el-select>
                    <el-button :icon="Plus" @click="openAddFund" />
                  </div>
                </el-form-item>
              </el-col>

              <!-- 行3 -->
              <el-col :span="18">
                <el-form-item :label="$t('procure.inhouse.labelRemark')">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('procure.inhouse.remarkPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.inhouse.labelAttachment')">
                  <el-button :icon="Paperclip">{{ $t('procure.inhouse.btnUploadAttachment') }}</el-button>
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
              <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()">{{ $t('procure.inhouse.btnSelectGoods') }}</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">{{ $t('procure.inhouse.btnAddGoods') }}</el-button>
              <el-button :icon="Document" size="small" @click="openPlanPicker">{{ $t('procure.inhouse.btnSelectPlanGoods') }}</el-button>
              <el-button :icon="Upload" size="small">{{ $t('procure.inhouse.btnImportGoods') }}</el-button>
            </div>
            <span class="goods-count">{{ $t('procure.inhouse.goodsCount') }} <b>{{ fd.items.length }}</b> {{ $t('procure.inhouse.goodsCountUnit') }}</span>
          </div>

          <!-- 商品表格 -->
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('procure.inhouse.emptyGoods')">
            <el-table-column type="index" width="45" align="center" fixed="left" />
            <el-table-column :label="$t('procure.inhouse.colGoodsName')" min-width="150" fixed="left">
              <template #default="{ row }">
                <el-input v-model="row.goods_name" size="small" :placeholder="$t('procure.inhouse.goodsNamePlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colGoodsSn')" width="120">
              <template #default="{ row }">
                <el-input v-model="row.goods_sn" size="small" :placeholder="$t('procure.inhouse.goodsSnPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colSpec')" width="100">
              <template #default="{ row }">
                <el-input v-model="row.spec" size="small" :placeholder="$t('procure.inhouse.specPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colCategory')" width="100">
              <template #default="{ row }">
                <span style="font-size:12px;color:#666">{{ row.cate_name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colUnit')" width="70" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" size="small" :placeholder="$t('procure.inhouse.unitPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('procure.inhouse.colInNum') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('num')">{{ $t('procure.inhouse.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.num" :min="0" :precision="2" size="small"
                  controls-position="right" style="width:100%" @change="calcItemTax(row); calcTotal()" />
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('procure.inhouse.colPriceNoTax') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price_no_tax')">{{ $t('procure.inhouse.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.price_no_tax" :min="0" :precision="4" size="small"
                  controls-position="right" style="width:100%" @change="onPriceNoTaxChange(row)" />
              </template>
            </el-table-column>
            <el-table-column width="110">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('procure.inhouse.colTaxRate') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('tax_rate')">{{ $t('procure.inhouse.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-select v-model="row.tax_rate" size="small" style="width:100%" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colTaxAmount')" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('procure.inhouse.colPriceWithTax') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price')">{{ $t('procure.inhouse.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small"
                  controls-position="right" style="width:100%" @change="onPriceChange(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colNoTaxSubtotal')" width="110" align="right">
              <template #default="{ row }">
                <span>{{ ((row.num||0) * (row.price_no_tax||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colWithTaxSubtotal')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.inhouse.colRemark')" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" :placeholder="$t('procure.inhouse.remarkPlaceholder2')" />
              </template>
            </el-table-column>
            <el-table-column width="45" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link :icon="Delete" @click="removeItem($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 结算信息卡片 -->
        <div class="form-section settlement-section">
          <div class="sec-title">{{ $t('procure.inhouse.sectionSettle') }}</div>
          <div class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.inhouse.settlePayable') }}</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.inhouse.settleDiscountType') }}</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" @change="calcSettle">
                <el-option :label="$t('procure.inhouse.discountNone')" value="none" />
                <el-option :label="$t('procure.inhouse.discountAmount')" value="amount" />
                <el-option :label="$t('procure.inhouse.discountPercent')" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? $t('procure.inhouse.settleDiscountPercent') : $t('procure.inhouse.settleDiscountValue') }}</span>
              <el-input-number v-model="fd.discount_value" :min="0"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.inhouse.settleAfterDiscount') }}</span>
              <span class="settle-value">¥{{ fd.after_discount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.inhouse.settleCurrentPayment') }}</span>
              <el-input-number v-model="fd.pay_amount" :min="0" :precision="2"
                size="small" style="width:130px" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('procure.inhouse.settleInstallment') }}</span>
              <el-switch v-model="fd.installment" :active-text="$t('procure.inhouse.installmentYes')" :inactive-text="$t('procure.inhouse.installmentNo')" />
            </div>
          </div>
          <div class="settle-summary">
            <span>{{ $t('procure.inhouse.settleNoTaxTotal') }}<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('procure.inhouse.settleTaxTotal') }}<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('procure.inhouse.settleWithTaxTotal') }}<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="$t('procure.inhouse.dialogAddGoodsTitle')" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('procure.inhouse.labelGoodsName')">
          <el-input v-model="manualForm.goods_name" :placeholder="$t('procure.inhouse.goodsNameInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.inhouse.labelGoodsSn')">
          <el-input v-model="manualForm.goods_sn" :placeholder="$t('procure.inhouse.goodsSnInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.inhouse.labelSpec')">
          <el-input v-model="manualForm.spec" :placeholder="$t('procure.inhouse.specInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.inhouse.labelUnit')">
          <el-input v-model="manualForm.unit_name" :placeholder="$t('procure.inhouse.unitInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.inhouse.labelInNum2')">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.inhouse.labelPriceWithTax')">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('procure.inhouse.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmManualAdd">{{ $t('procure.inhouse.btnConfirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="`${$t('procure.inhouse.dialogBatchEditTitle')} ${batchEditLabel}`" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">{{ $t('procure.inhouse.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ $t('procure.inhouse.btnConfirmBatch') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增供应商弹框 -->
    <el-dialog v-model="addSupplierVisible" :title="$t('procure.inhouse.dialogAddSupplierTitle')" width="380px" append-to-body>
      <el-form :model="supplierForm" label-width="80px">
        <el-form-item :label="$t('procure.inhouse.labelSupplierName')">
          <el-input v-model="supplierForm.name" :placeholder="$t('procure.inhouse.supplierNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSupplierVisible = false">{{ $t('procure.inhouse.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addSupplierLoading" @click="submitAddSupplier">{{ $t('procure.inhouse.btnConfirmAddSupplier') }}</el-button>
      </template>
    </el-dialog>

    <!-- BOM 生产建议弹窗 -->
    <el-dialog v-model="bomSuggestVisible" :title="$t('procure.inhouse.dialogBomTitle')" width="580px" append-to-body :close-on-click-modal="false">
      <p style="color:#666;margin-bottom:16px;font-size:13px">{{ $t('procure.inhouse.bomHint') }}</p>
      <el-table :data="bomSuggestItems" border size="small">
        <el-table-column prop="goods_name" :label="$t('procure.inhouse.colBomGoodsName')" min-width="160" />
        <el-table-column :label="$t('procure.inhouse.colBomMaxQty')" width="110">
          <template #default="{ row }">{{ row.max_qty }} {{ row.unit_name }}</template>
        </el-table-column>
        <el-table-column :label="$t('procure.inhouse.colBomProduceQty')" width="160">
          <template #default="{ row }">
            <el-input-number v-model="row.produce_qty" :min="0" :max="row.max_qty" :precision="0" size="small" style="width:130px" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="bomSuggestVisible = false">{{ $t('procure.inhouse.btnSkipBom') }}</el-button>
        <el-button type="primary" :loading="bomSuggestLoading" @click="executeBomProduction">{{ $t('procure.inhouse.btnConfirmBom') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" :title="$t('procure.inhouse.dialogAddFundTitle')" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="$t('procure.inhouse.labelFundName')">
          <el-input v-model="fundForm.name" :placeholder="$t('procure.inhouse.fundNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.inhouse.labelInitBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ $t('procure.inhouse.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ $t('procure.inhouse.btnConfirmAddFund') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Plus, Delete, ArrowLeft, EditPen, Document, Upload, Paperclip } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getProcureInhouseList, createProcureInhouse, updateProcureInhouse, deleteProcureInhouse, getSupplierList, createSupplier, auditProcureInhouse } from '@/api/procure'
import { getWarehouseList } from '@/api/warehouse'
import { getFundList, createFund } from '@/api/finance'
import http from '@/api/http'
import StaffSelect from '@/components/StaffSelect.vue'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { TAX_RATES } from '@/config'
import { fmtDt } from '@/utils/date'
import { stockEffect } from '@/utils/stockEffect'
import { applyMaterialStockDelta } from '@/utils/materialStock'
import { getBomByGoods } from '@/api/goods'
import { getSyncedDefaultWarehouseId } from '@/utils/defaultWarehouse'

const { t } = useI18n()

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()

function parseItems(goodsInfo: any): any[] {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

function calcRowTotal(row: any): number {
  if (row.total_amount && Number(row.total_amount) > 0) return Number(row.total_amount)
  const items = parseItems(row.goods_info)
  return items.reduce((s: number, i: any) => {
    if (i.total_price !== undefined) return s + Number(i.total_price || 0)
    return s + (Number(i.num || 0) * Number(i.price || 0))
  }, 0)
}

// ── 列表 ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_procure_inhouse', tableRef)
const reconcileFilteredApi = createFilteredApi(getProcureInhouseList, 'reconcile_filter')
const searchForm = reactive<any>({ in_no: '', supplier_name: '', goods_name: '', reconcile_filter: '' })
const showForm = ref(false)
const isReadonly = ref(false)

// ── 供应商/仓库/分类选项 ──────────────────────────────────────────────────────
const supplierOptions = ref<any[]>([])
const warehouseOptions = ref<any[]>([])

async function loadSuppliers() {
  const res = await getSupplierList({ list_rows: 500 })
  supplierOptions.value = res.data?.rows ?? []
}
async function loadWarehouses() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows ?? []
}
onMounted(() => {
  loadSuppliers(); loadWarehouses(); loadFunds()
  if (route.query.goods_name) searchForm.goods_name = String(route.query.goods_name)
  if (route.query.in_no) searchForm.in_no = String(route.query.in_no)
})

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface InhouseItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; cate_name: string; unit_name: string
  num: number; price_no_tax: number; tax_rate: number; price: number; remark: string
}

const defaultFd = () => ({
  id: 0,
  in_no: '',
  supplier_id: null as any,
  supplier_name: '',
  admin_name: '',
  in_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  warehouse_id: null as any,
  warehouse_name: '',
  is_accept: false,
  pay_account: '',
  remark: '',
  total_amount: 0,
  discount_type: 'none' as string,
  discount_value: 0,
  after_discount: 0,
  pay_amount: 0,
  installment: false,
  items: [] as InhouseItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)
const savingAndAuditing = ref(false)

// 计算汇总
const totalNoTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0), 0)
)
const totalTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0) * (r.tax_rate || 0) / 100, 0)
)

function calcTotal() {
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
  fd.pay_amount = Math.max(0, fd.after_discount)
}

function calcItemTax(row: InhouseItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(4))
}

function onPriceNoTaxChange(row: InhouseItem) {
  calcItemTax(row)
  calcTotal()
}

function onTaxRateChange(row: InhouseItem) {
  calcItemTax(row)
  calcTotal()
}

function onPriceChange(row: InhouseItem) {
  const taxRate = row.tax_rate || 0
  if (taxRate > 0) {
    row.price_no_tax = Number((row.price / (1 + taxRate / 100)).toFixed(4))
  } else {
    row.price_no_tax = row.price
  }
  calcTotal()
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

function openCreate() {
  Object.assign(fd, defaultFd())
  isReadonly.value = false
  showForm.value = true
}

function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  calcTotal()
  isReadonly.value = readonly
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

async function handleSave(andAudit = false) {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning(t('procure.inhouse.msgFillRequired')); return
  }
  if (!fd.items.length) {
    ElMessage.warning(t('procure.inhouse.msgAddAtLeastOne')); return
  }
  // 有付款金额但未选账户时提醒
  if (Number(fd.pay_amount || 0) > 0 && !fd.pay_account) {
    try {
      await ElMessageBox.confirm(t('procure.inhouse.msgPayAccountHint'), t('procure.inhouse.msgPayAccountHintTitle'), {
        confirmButtonText: t('procure.inhouse.msgPayAccountContinue'), cancelButtonText: t('procure.inhouse.msgPayAccountGoSelect'), type: 'warning'
      })
    } catch { return }
  }
  saving.value = true
  if (andAudit) savingAndAuditing.value = true
  try {
    const payload: Record<string, any> = {
      supplier_id: fd.supplier_id,
      supplier_name: fd.supplier_name,
      admin_name: fd.admin_name,
      in_date: fd.in_date,
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      remark: fd.remark,
      total_amount: fd.total_amount,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) payload.id = fd.id
    let savedId: number
    if (fd.id) {
      await updateProcureInhouse(payload)
      savedId = fd.id
    } else {
      const res = await createProcureInhouse(payload)
      savedId = res?.data?.id || 0
    }
    if (andAudit && savedId) {
      try {
        await auditProcureInhouse(savedId, 1)
        await handleInhouseStockEffect({ ...payload, id: savedId }, 'audit')
        checkBomAfterInhouse({ ...payload, id: savedId }).catch(() => {})
        ElMessage.success(t('procure.inhouse.msgSaveAndAuditSuccess'))
      } catch (e: any) {
        ElMessage.warning(t('procure.inhouse.msgSaveSuccessAuditFailed') + (e?.message || ''))
      }
    } else {
      ElMessage.success(t('procure.inhouse.msgSaveSuccess'))
    }
    stockRefreshStore.trigger()
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.inhouse.msgSaveFailed'))
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

// ── BOM 生产建议 ──────────────────────────────────────────────────────────────
const bomSuggestVisible = ref(false)
const bomSuggestLoading = ref(false)
const bomSuggestItems = ref<any[]>([])

async function checkBomAfterInhouse(row: any) {
  try {
    const purchasedItems: any[] = Array.isArray(row.goods_info)
      ? row.goods_info : JSON.parse(row.goods_info || '[]')
    const purchasedSns = new Set(purchasedItems.map((i: any) => i.goods_sn).filter(Boolean))
    if (!purchasedSns.size) return

    const bomListRes = await http.get('/goods/BomGoods/index', { params: { page: 1, list_rows: 200 } })
    const bomList: any[] = bomListRes.data?.list || []
    if (!bomList.length) return

    const [detailResults, stockRes, defaultWhId] = await Promise.all([
      Promise.allSettled(bomList.map((bom: any) => getBomByGoods(bom.id))),
      http.get('/stock/StockAll/index', { params: { list_rows: 2000 } }),
      getSyncedDefaultWarehouseId(),
    ])

    const stockBySn: Record<string, number> = {}
    for (const s of (stockRes.data?.rows || [])) {
      if (s.goods_sn) stockBySn[s.goods_sn] = (stockBySn[s.goods_sn] || 0) + Number(s.qty || 0)
    }

    const whListRes = await http.get('/stock/WarehouseName/index', { params: { list_rows: 100 } })
    const whList: any[] = whListRes.data?.rows || []
    const defaultWh = whList.find((w: any) => w.id === defaultWhId) || whList[0] || { id: 0, name: '' }

    const suggests: any[] = []
    for (let i = 0; i < bomList.length; i++) {
      const result = detailResults[i]
      if (result.status !== 'fulfilled') continue
      const detail = result.value?.data
      if (!detail?.items?.length) continue
      // 只处理原料中包含本次采购商品的 BOM
      if (!detail.items.some((item: any) => purchasedSns.has(item.goods_sn))) continue

      let maxQty = Infinity
      for (const item of detail.items) {
        const needed = Number(item.num) || 0
        if (needed <= 0) continue
        maxQty = Math.min(maxQty, Math.floor((stockBySn[item.goods_sn] || 0) / needed))
      }
      if (!isFinite(maxQty) || maxQty <= 0) continue

      suggests.push({
        goods_name: bomList[i].goods_name,
        goods_sn: bomList[i].goods_sn,
        unit_name: bomList[i].unit_name || '',
        max_qty: maxQty,
        produce_qty: maxQty,
        rawMaterials: detail.items.map((item: any) => ({
          goods_sn: item.goods_sn || '',
          goods_name: item.goods_name || '',
          unit_name: item.unit_name || '',
          num: Number(item.num) || 0,
        })),
        warehouse_id: defaultWh.id,
        warehouse_name: defaultWh.name,
      })
    }

    if (!suggests.length) return
    bomSuggestItems.value = suggests
    bomSuggestVisible.value = true
  } catch { /* 静默失败，不影响主流程 */ }
}

async function executeBomProduction() {
  const activeItems = bomSuggestItems.value.filter(i => i.produce_qty > 0)
  if (!activeItems.length) { bomSuggestVisible.value = false; return }
  bomSuggestLoading.value = true
  try {
    for (const item of activeItems) {
      const opts = { defaultWarehouseId: item.warehouse_id, defaultWarehouseName: item.warehouse_name }
      // 成品入库
      await applyMaterialStockDelta([{
        goods_sn: item.goods_sn, goods_name: item.goods_name, unit_name: item.unit_name,
        num: item.produce_qty, warehouse_id: item.warehouse_id, warehouse_name: item.warehouse_name,
      }], { direction: 'restore', ...opts })
      // 原料扣减
      const matItems = item.rawMaterials.map((m: any) => ({
        goods_sn: m.goods_sn, goods_name: m.goods_name, unit_name: m.unit_name,
        num: m.num * item.produce_qty, warehouse_id: item.warehouse_id, warehouse_name: item.warehouse_name,
      }))
      await applyMaterialStockDelta(matItems, { direction: 'deduct', ...opts })
    }
    ElMessage.success(t('procure.inhouse.msgBomProduceSuccess') + ` ${activeItems.length} ` + t('procure.inhouse.msgBomProduceSuccessSuffix'))
    bomSuggestVisible.value = false
    stockRefreshStore.trigger()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.inhouse.msgBomProduceFailed'))
  } finally {
    bomSuggestLoading.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('procure.inhouse.msgDeleteConfirm'), t('procure.inhouse.msgPrompt'), { type: 'warning' })
  await deleteProcureInhouse(id)
  ElMessage.success(t('procure.inhouse.msgDeleteSuccess'))
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

async function handleInhouseStockEffect(row: any, type: 'audit' | 'reverse') {
  const items: any[] = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]')
  // 采购入库审核=加库存；反审核=扣库存
  await stockEffect(items, type === 'audit' ? 'restore' : 'deduct', row.warehouse_id, type === 'audit' ? 'Purchase Inbound' : 'Purchase Inbound Reverse')
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('procure.inhouse.actionAuditPass') : status === 2 ? t('procure.inhouse.actionReject') : t('procure.inhouse.actionReverseAudit')
  await ElMessageBox.confirm(`${t('procure.inhouse.msgAuditPrefix')}${action}${t('procure.inhouse.msgAuditSuffix')}`, t('procure.inhouse.msgPrompt'), { type: 'warning' })
  try {
    await auditProcureInhouse(row.id, status)
    if (status === 1) {
      await handleInhouseStockEffect(row, 'audit')
      checkBomAfterInhouse(row).catch(() => {})
    } else if (status === 0) {
      await handleInhouseStockEffect(row, 'reverse')
    }
    ElMessage.success(t('procure.inhouse.msgOperationSuccess'))
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.inhouse.msgOperationFailed'))
  }
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (fd.items.some(i => i.goods_id === g.id)) continue
    const priceNoTax = Number(g.cost_price) || 0
    fd.items.push({
      goods_id: g.id,
      goods_name: g.goods_name,
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      cate_name: g.cate_name || '',
      unit_name: g.unit_name || '',
      num: 1,
      price_no_tax: priceNoTax,
      tax_rate: 0,
      price: Number((priceNoTax * 1.13).toFixed(4)),
      remark: '',
    })
  }
  calcTotal()
}

// ── 手动新增商品 ──────────────────────────────────────────────────────────────
const manualAddVisible = ref(false)
const manualForm = reactive({
  goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, price: 0
})

function openManualAdd() {
  Object.assign(manualForm, { goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, price: 0 })
  manualAddVisible.value = true
}

function confirmManualAdd() {
  if (!manualForm.goods_name.trim()) { ElMessage.warning(t('procure.inhouse.msgGoodsNameRequired')); return }
  fd.items.push({
    goods_id: 0,
    goods_name: manualForm.goods_name,
    goods_sn: manualForm.goods_sn,
    spec: manualForm.spec,
    cate_name: '',
    unit_name: manualForm.unit_name,
    num: manualForm.num,
    price_no_tax: Number((manualForm.price / 1.13).toFixed(4)),
    tax_rate: 0,
    price: manualForm.price,
    remark: '',
  })
  calcTotal()
  manualAddVisible.value = false
}

// ── 选择采购计划商品（占位） ──────────────────────────────────────────────────
function openPlanPicker() {
  ElMessage.info(t('procure.inhouse.msgPlanGoodsInDev'))
}

// ── 批量编辑 ──────────────────────────────────────────────────────────────────
const batchEditVisible = ref(false)
const batchEditFieldKey = ref('')
const batchEditLabel = ref('')
const batchEditValue = ref(0)

const fieldLabelMap: Record<string, string> = {
  num: t('procure.inhouse.fieldInNum'),
  price_no_tax: t('procure.inhouse.fieldPriceNoTax'),
  tax_rate: t('procure.inhouse.fieldTaxRate'),
  price: t('procure.inhouse.fieldPriceWithTax'),
}

function batchEditField(field: string) {
  batchEditFieldKey.value = field
  batchEditLabel.value = fieldLabelMap[field] || field
  batchEditValue.value = 0
  batchEditVisible.value = true
}

function confirmBatchEdit() {
  const field = batchEditFieldKey.value
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
  ElMessage.success(`${t('procure.inhouse.msgBatchSetSuccess')} ${batchEditLabel.value} ${t('procure.inhouse.msgBatchSetTo')} ${batchEditValue.value}`)
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
  if (!supplierForm.name.trim()) { ElMessage.warning(t('procure.inhouse.msgSupplierRequired')); return }
  addSupplierLoading.value = true
  try {
    const res = await createSupplier({ name: supplierForm.name.trim() })
    ElMessage.success(t('procure.inhouse.msgAddSupplierSuccess'))
    addSupplierVisible.value = false
    await loadSuppliers()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.supplier_id = newId; onSupplierChange(newId) }
    else {
      const last = supplierOptions.value[supplierOptions.value.length - 1]
      if (last) { fd.supplier_id = last.id; onSupplierChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.inhouse.msgAddFailed'))
  } finally {
    addSupplierLoading.value = false
  }
}

// ── 资金账户 ──────────────────────────────────────────────────────────────────
const fundOptions = ref<any[]>([])
const addFundVisible = ref(false)
const addFundLoading = ref(false)
const fundForm = reactive({ name: '', balance: 0 })

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ }
}

function openAddFund() {
  fundForm.name = ''
  fundForm.balance = 0
  addFundVisible.value = true
}

async function submitAddFund() {
  if (!fundForm.name.trim()) { ElMessage.warning(t('procure.inhouse.msgFundNameRequired')); return }
  addFundLoading.value = true
  try {
    await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('procure.inhouse.msgAddFundSuccess'))
    addFundVisible.value = false
    await loadFunds()
    fd.pay_account = fundForm.name.trim()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.inhouse.msgAddFailed'))
  } finally {
    addFundLoading.value = false
  }
}
</script>

<style scoped>
.inhouse-page { height: 100%; }

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
  padding: 14px 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 16px 18px 14px;
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

.goods-count {
  font-size: 13px;
  color: rgba(29,29,31,0.35);
  flex-shrink: 0;
}

.batch-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 4px;
}

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
</style>
