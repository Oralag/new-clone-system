<template>
  <div class="saleout-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="reconcileFilteredApi"
          del-path="/stock/SaleOutOrder/batchDel"
          sort-by="out_date" :sort-desc="true"
          :export-file-name="$t('sale.out.exportFileName')" :params="searchForm"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : (row.status === 1 ? 'row-audited' : '')"
          :export-columns="{ order_sn: $t('sale.out.exportColOrderSn'), customer_name: $t('sale.out.exportColCustomerName'), warehouse_name: $t('sale.out.exportColWarehouseName'), out_date: $t('sale.out.exportColOutDate'), admin_name: $t('sale.out.exportColAdminName'), total_amount: $t('sale.out.exportColTotalAmount'), after_discount: $t('sale.out.exportColAfterDiscount'), status: $t('sale.out.exportColStatus'), remark: $t('sale.out.exportColRemark') }">
          <template #search>
            <el-input v-model="searchForm.order_no" :placeholder="$t('sale.out.searchOrderNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" :placeholder="$t('sale.out.searchCustomerName')" clearable style="width:150px" />
            <el-select v-model="searchForm.status" :placeholder="$t('sale.out.searchStatus')" clearable style="width:110px">
              <el-option :label="$t('sale.out.statusPending')" :value="0" />
              <el-option :label="$t('sale.out.statusAudited')" :value="1" />
              <el-option :label="$t('sale.out.statusRejected')" :value="2" />
              <el-option :label="$t('sale.out.statusUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <!-- 新增按钮已移除：出库单由销售订单审核时自动生成 -->
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('sale.out.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('sale.out.colGoodsName')" min-width="140" />
                  <el-table-column prop="goods_sn" :label="$t('sale.out.colGoodsSn')" width="110" />
                  <el-table-column prop="spec" :label="$t('sale.out.colSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('sale.out.colUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('sale.out.colNum')" width="80" align="right" />
                  <el-table-column :label="$t('sale.out.colPriceTaxIncl')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.out.colSubtotalTaxIncl')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('sale.out.colRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('sale.out.colIndex')" width="60" align="center" />
          <el-table-column :label="$t('sale.out.colOrderNo')" min-width="150">
            <template #default="{ row }">{{ parseSaleOutNo(row) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.out.colCustomerName')" min-width="140">
            <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || $t('sale.out.dash') }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.out.colWarehouse')" width="120">
            <template #default="{ row }">{{ row.warehouse_name || $t('sale.out.dash') }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.out.colOutDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.out_date || row.create_time) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.out.colAdminName')" width="90">
            <template #default="{ row }">{{ row.admin_name || $t('sale.out.dash') }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.out.colOutAmount')" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ (Number(row.after_discount) || Number(row.total_amount || 0)).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.out.colActions')" width="370" fixed="right">
            <template #default="{ row }">
              <span v-if="row.status === 1" style="color:#16a34a;margin-right:4px;font-weight:700">✓</span>
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small" style="margin-right:8px">
                {{ row.status === 1 ? $t('sale.out.statusAudited') : row.status === 2 ? $t('sale.out.statusRejected') : $t('sale.out.statusPending') }}
              </el-tag>
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="openEdit(row, true)">{{ $t('sale.out.btnView') }}</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">{{ $t('sale.out.btnEdit') }}</el-button>
              <template v-if="row.status === 0">
                <el-button type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('sale.out.btnAudit') }}</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, 2)">{{ $t('sale.out.btnReject') }}</el-button>
              </template>
              <el-tooltip v-if="row.status === 2" :content="$t('sale.out.rejectDisabledTip')" placement="top">
                <el-button type="danger" link size="small" disabled>{{ $t('sale.out.btnReject') }}</el-button>
              </el-tooltip>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('sale.out.btnUnaudit') }}</el-button>
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="router.push('/finance/receivable')">{{ $t('sale.out.btnViewReceivable') }}</el-button>
              <el-button v-if="row.status === 1" type="success" link size="small" @click="router.push('/warehouse/stock')">{{ $t('sale.out.btnViewStock') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('sale.out.btnReconciled') : $t('sale.out.btnReconcile') }}</el-button>
              <el-button
                type="danger"
                link
                size="small"
                :disabled="row.status === 1 && !isEmptyTestSaleOut(row)"
                :title="row.status === 1 ? (isEmptyTestSaleOut(row) ? $t('sale.out.deleteEmptyTestTip') : $t('sale.out.deleteUnauditFirstTip')) : ''"
                @click="handleDelete(row)"
              >{{ $t('sale.out.btnDelete') }}</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('sale.out.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('sale.out.formTitleView') : (fd.id ? $t('sale.out.formTitleEdit') : $t('sale.out.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('sale.out.tagAudited') }}</el-tag>
          <el-tag v-if="fd.contract_id && !isReadonly" type="info" size="small">{{ $t('sale.out.tagFromContract') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-button :icon="Document" @click="handlePrint">{{ $t('sale.out.btnPrint') }}</el-button>
          <el-button v-if="!isReadonly" :loading="saving && !savingAndAuditing" @click="handleSave(false)" data-guide-id="guide-saleout-save">
            {{ $t('sale.out.btnSave') }} <span style="font-size:11px;opacity:0.7">{{ $t('sale.out.saveShortcut') }}</span>
          </el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="savingAndAuditing" @click="handleSave(true)">
            {{ $t('sale.out.btnSaveAndAudit') }}
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('sale.out.secBasic') }}</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldOrderNo')">
                  <el-input :value="fd.id ? fd.order_no : $t('sale.out.orderNoAutoGen')" disabled :placeholder="$t('sale.out.orderNoPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldCustomerName')" prop="customer_id"
                  :rules="[{ required: true, message: t('sale.out.customerRequired') }]"
                  data-guide-id="guide-saleout-basic">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.customer_id" :placeholder="$t('sale.out.customerPlaceholder')" filterable style="flex:1"
                      @change="onCustomerChange">
                      <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="quickAddCustomerVisible = true" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldAdminName')" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('sale.out.adminPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldOutDate')" prop="out_date">
                  <el-date-picker v-model="fd.out_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('sale.out.outDatePlaceholder')" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldWarehouse')" prop="warehouse_id">
                  <el-select v-model="fd.warehouse_id" :placeholder="$t('sale.out.warehousePlaceholder')" filterable style="width:100%"
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldNeedInvoice')">
                  <el-switch v-model="fd.need_invoice" :active-text="$t('sale.out.switchYes')" :inactive-text="$t('sale.out.switchNo')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldReceiveAccount')">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.receive_account" :placeholder="$t('sale.out.receiveAccountPlaceholder')" clearable style="flex:1">
                      <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.name" />
                      <el-option :label="$t('sale.out.cashOption')" :value="$t('sale.out.cashOption')" />
                    </el-select>
                    <el-button :icon="Plus" @click="openAddFund" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6" />

              <!-- 行3 -->
              <el-col :span="18">
                <el-form-item :label="$t('sale.out.fieldRemark')">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('sale.out.remarkPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.out.fieldAttachment')">
                  <el-button :icon="Paperclip">{{ $t('sale.out.btnUploadAttachment') }}</el-button>
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
              <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()" data-guide-id="guide-saleout-goods">{{ $t('sale.out.btnSelectGoods') }}</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">{{ $t('sale.out.btnAddGoods') }}</el-button>
              <el-button :icon="Upload" size="small">{{ $t('sale.out.btnImportGoods') }}</el-button>
              <el-button :icon="Camera" size="small">{{ $t('sale.out.btnScanInput') }}</el-button>
            </div>
            <span class="goods-count">{{ $t('sale.out.goodsCountPrefix') }} <b>{{ fd.items.length }}</b> {{ $t('sale.out.goodsCountSuffix') }}</span>
          </div>

          <!-- 商品表格 -->
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('sale.out.goodsEmptyText')">
            <el-table-column type="index" width="45" align="center" fixed="left" />
            <el-table-column :label="$t('sale.out.itemColGoodsName')" min-width="150" fixed="left">
              <template #default="{ row }">
                <el-input v-model="row.goods_name" size="small" :placeholder="$t('sale.out.itemGoodsNamePlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColGoodsSn')" width="120">
              <template #default="{ row }">
                <el-input v-model="row.goods_sn" size="small" :placeholder="$t('sale.out.itemGoodsSnPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColSpec')" width="140">
              <template #default="{ row }">
                <el-select
                  v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                  v-model="row.spec"
                  size="small"
                  :placeholder="$t('sale.out.itemSpecSelectPlaceholder')"
                  clearable
                  style="width:100%"
                  @focus="fetchGoodsSpecs(row.goods_id)"
                >
                  <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                </el-select>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('sale.out.itemSpecPlaceholder')"
                  @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColCate')" width="100">
              <template #default="{ row }">
                <span style="font-size:12px;color:#666">{{ row.cate_name || $t('sale.out.dash') }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColUnit')" width="70" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" size="small" :placeholder="$t('sale.out.itemUnitPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.out.itemColNum') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('num')">{{ $t('sale.out.btnBatch') }}</el-button>
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
                  <span>{{ $t('sale.out.itemColPriceNoTax') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price_no_tax')">{{ $t('sale.out.btnBatch') }}</el-button>
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
                  <span>{{ $t('sale.out.itemColTaxRate') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('tax_rate')">{{ $t('sale.out.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-select v-model="row.tax_rate" size="small" style="width:100%" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColTax')" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.out.itemColPrice') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price')">{{ $t('sale.out.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small"
                  controls-position="right" style="width:100%" @change="onPriceChange(row)" />
              </template>
            </el-table-column>
            <el-table-column width="120" align="right">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.out.itemColSubtotalNoTax') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('subtotal_no_tax')">{{ $t('sale.out.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num||0) * (row.price_no_tax||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColSubtotalTaxIncl')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColBatch')" width="130">
              <template #default="{ row }">
                <el-input v-model="row.batch_no" size="small" :placeholder="$t('sale.out.itemBatchPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.out.itemColRemark')" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" :placeholder="$t('sale.out.itemRemarkPlaceholder')" />
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
          <div class="sec-title">{{ $t('sale.out.secSettlement') }}</div>
          <div class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleReceivable') }}</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleFreight') }}</span>
              <el-input-number v-model="fd.freight_amount" :min="0" :precision="2"
                size="small" style="width:110px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleFreightBearer') }}</span>
              <el-select v-model="fd.freight_bearer" size="small" style="width:110px" @change="calcSettle">
                <el-option :label="$t('sale.out.bearerSeller')" value="seller" />
                <el-option :label="$t('sale.out.bearerBuyer')" value="buyer" />
                <el-option :label="$t('sale.out.bearerHalf')" value="half" />
                <el-option :label="$t('sale.out.bearerFree')" value="free" />
              </el-select>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleDiscountType') }}</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" @change="calcSettle">
                <el-option :label="$t('sale.out.discountNone')" value="none" />
                <el-option :label="$t('sale.out.discountAmount')" value="amount" />
                <el-option :label="$t('sale.out.discountPercent')" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? $t('sale.out.settleDiscountPercent') : $t('sale.out.settleDiscountAmount') }}</span>
              <el-input-number v-model="fd.discount_value" :min="0"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleAfterDiscount') }}</span>
              <span class="settle-value">¥{{ fd.after_discount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleIncome') }}</span>
              <el-input-number v-model="fd.income_amount" :min="0" :precision="2"
                size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleReceive') }}</span>
              <el-input-number v-model="fd.receive_amount" :min="0" :precision="2"
                size="small" style="width:130px" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.out.settleInstallment') }}</span>
              <el-switch v-model="fd.installment" :active-text="$t('sale.out.switchYes')" :inactive-text="$t('sale.out.switchNo')" />
            </div>
          </div>
          <div class="settle-summary">
            <span>{{ $t('sale.out.sumNoTax') }}<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.out.sumTax') }}<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.out.sumTaxIncl') }}<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.out.sumCost') }}<b style="color:rgba(29,29,31,0.35)">¥{{ totalCost.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.out.sumFreight') }}<b style="color:rgba(29,29,31,0.35)">¥{{ freightCost.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.out.sumNetProfit') }}<b :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize: '16px' }">¥{{ netProfit.toFixed(2) }}</b></span>
            <span style="margin-left:12px">{{ $t('sale.out.sumProfitRate') }}<b :style="{ color: profitRate >= 0 ? '#16a34a' : '#dc2626' }">{{ profitRate.toFixed(1) }}%</b></span>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="$t('sale.out.dlgManualAddTitle')" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('sale.out.manualGoodsName')" :rules="[{ required: true }]">
          <el-input v-model="manualForm.goods_name" :placeholder="$t('sale.out.manualGoodsNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.out.manualGoodsSn')">
          <el-input v-model="manualForm.goods_sn" :placeholder="$t('sale.out.manualGoodsSnPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.out.manualSpec')">
          <el-input v-model="manualForm.spec" :placeholder="$t('sale.out.manualSpecPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.out.manualUnit')">
          <el-input v-model="manualForm.unit_name" :placeholder="$t('sale.out.manualUnitPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.out.manualNum')">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.out.manualPrice')">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('sale.out.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmManualAdd">{{ $t('sale.out.btnConfirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="$t('sale.out.dlgBatchEditTitle', { label: batchEditLabel })" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">{{ $t('sale.out.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ $t('sale.out.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增客户弹框 -->
    <el-dialog v-model="quickAddCustomerVisible" :title="$t('sale.out.dlgQuickCustomerTitle')" width="360px" append-to-body>
      <el-form :model="quickCustomerForm" label-width="70px">
        <el-form-item :label="$t('sale.out.quickCustomerName')" required>
          <el-input v-model="quickCustomerForm.nickname" :placeholder="$t('sale.out.quickCustomerPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddCustomerVisible = false">{{ $t('sale.out.btnCancel') }}</el-button>
        <el-button type="primary" :loading="quickCustomerSaving" @click="confirmQuickAddCustomer">{{ $t('sale.out.btnConfirmCreate') }}</el-button>
      </template>
    </el-dialog>

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" :title="$t('sale.out.dlgAddFundTitle')" width="360px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item :label="$t('sale.out.fundName')">
          <el-input v-model="fundForm.name" :placeholder="$t('sale.out.fundNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.out.fundBalance')">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">{{ $t('sale.out.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">{{ $t('sale.out.btnConfirmAddFund') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Delete, ArrowLeft, EditPen, Document, Upload, Camera, Paperclip } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getSaleOutList, createSaleOut, updateSaleOut, deleteSaleOut, auditSaleOut, getSaleReturnList } from '@/api/sale'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSpecList } from '@/api/goods'
import { getWarehouseList } from '@/api/warehouse'
import { getFundList, createFund, getCollectReceiptList, deleteCollectReceipt } from '@/api/finance'
import http from '@/api/http'
import StaffSelect from '@/components/StaffSelect.vue'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect, deleteSaleOutStockFlows } from '@/utils/stockEffect'

const { t } = useI18n()

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

// ── 列表 ─────────────────────────────────────────────────────────────────────
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_sale_out', tableRef)
const reconcileFilteredApi = createFilteredApi(getSaleOutList)

function parseItems(goodsInfo: any): any[] {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

const goodsSpecMap = reactive<Record<number, string[]>>({})
async function fetchGoodsSpecs(goodsId: number) {
  if (!goodsId || goodsSpecMap[goodsId] !== undefined) return
  goodsSpecMap[goodsId] = []
  try {
    const res = await getSpecList({ goods_id: goodsId, list_rows: 100 })
    const specs: any[] = res.data?.rows ?? []
    const options: string[] = []
    for (const s of specs) {
      const vals = (s.spec_value || s.values || '').split(/[,，]/).map((v: string) => v.trim()).filter(Boolean)
      options.push(...vals)
    }
    goodsSpecMap[goodsId] = [...new Set(options)]
  } catch { /* ignore */ }
}
const searchForm = reactive<any>({ order_no: '', customer_name: '', status: '' })
const showForm = ref(false)
const isReadonly = ref(false)

// ── 客户选项 ──────────────────────────────────────────────────────────────────
const customerOptions = ref<any[]>([])
async function loadCustomers() {
  const res = await getSaleCustomerList({ list_rows: 500 })
  customerOptions.value = res.data?.rows ?? []
}

// ── 仓库选项 ──────────────────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows ?? []
}

function tryLoadContractData() {
  const contractData = sessionStorage.getItem('saleout_from_contract')
  if (contractData) {
    sessionStorage.removeItem('saleout_from_contract')
    try {
      const c = JSON.parse(contractData)
      openCreate()
      if (c.customer_id) { fd.customer_id = Number(c.customer_id); fd.customer_name = String(c.customer_name || '') }
      if (c.warehouse_id) { fd.warehouse_id = Number(c.warehouse_id); fd.warehouse_name = String(c.warehouse_name || '') }
      fd.admin_name = String(c.admin_name || '')
      fd.remark = t('sale.out.fromContractRemark', { sn: c.contract_sn })
      fd.contract_id = Number(c.contract_id || 0)
      fd.discount_type = String(c.discount_type || 'none')
      fd.discount_value = Number(c.discount_value || 0)
      const items = Array.isArray(c.goods_info) ? c.goods_info : JSON.parse(String(c.goods_info || '[]'))
      fd.items = items.map((i: any) => ({
        goods_id: i.goods_id || 0,
        goods_name: i.goods_name || '',
        goods_sn: i.goods_sn || '',
        spec: i.spec || '',
        cate_name: i.cate_name || '',
        unit_name: i.unit_name || '',
        batch_no: i.batch_no || '',
        num: i.num || 0,
        price_no_tax: i.price_no_tax || 0,
        tax_rate: i.tax_rate || 0,
        price: i.price || i.sell_price || 0,
        cost_price: i.cost_price || 0,
        remark: i.remark || '',
      }))
      calcTotal()
    } catch { /* ignore */ }
  }
}

onMounted(() => {
  loadCustomers(); loadWarehouses(); loadFunds()
  tryLoadContractData()
})

onActivated(() => {
  tryLoadContractData()
})

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface SaleOutItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; cate_name: string; unit_name: string; batch_no: string
  num: number; price_no_tax: number; tax_rate: number; price: number; remark: string
}

const defaultFd = () => ({
  id: 0,
  order_no: '',
  customer_id: null as any,
  customer_name: '',
  admin_name: '',
  out_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  warehouse_id: null as any,
  warehouse_name: '',
  need_invoice: false,
  receive_account: '',
  remark: '',
  total_amount: 0,
  freight_amount: 0,
  freight_bearer: 'seller' as string,
  discount_type: 'none' as string,
  discount_value: 0,
  after_discount: 0,
  income_amount: 0,
  receive_amount: 0,
  installment: false,
  items: [] as SaleOutItem[],
  contract_id: 0,
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
// 净利润 = 折后金额 - 运费（我方承担时） - 商品成本合计
const totalCost = computed(() =>
  fd.items.reduce((s, r: any) => s + (r.num || 0) * (r.cost_price || 0), 0)
)
const freightCost = computed(() =>
  fd.freight_bearer === 'seller' ? (fd.freight_amount || 0)
    : fd.freight_bearer === 'half' ? (fd.freight_amount || 0) / 2
    : 0
)
const netProfit = computed(() =>
  fd.after_discount - totalCost.value - freightCost.value
)
const profitRate = computed(() =>
  fd.after_discount > 0 ? (netProfit.value / fd.after_discount * 100) : 0
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
  fd.receive_amount = Math.max(0, fd.after_discount - (fd.income_amount || 0))
}

function calcItemTax(row: SaleOutItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(4))
}

function onPriceNoTaxChange(row: SaleOutItem) {
  calcItemTax(row)
  calcTotal()
}

function onTaxRateChange(row: SaleOutItem) {
  calcItemTax(row)
  calcTotal()
}

function onPriceChange(row: SaleOutItem) {
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

function onCustomerChange(id: any) {
  const c = customerOptions.value.find(x => x.id === id)
  fd.customer_name = c?.name || c?.nickname || ''
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
}

function parseSaleOutNo(row: any): string {
  const m = (row?.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) return m[1]
  return row?.order_sn || row?.order_no || (row?.id ? `CK${String(row.id).padStart(4, '0')}` : '')
}

async function openCreate() {
  Object.assign(fd, defaultFd())
  isReadonly.value = false
  showForm.value = true
  try {
    const today = new Date(Date.now() + 8*3600000).toISOString().slice(0,10)
    const ymd = today.replace(/-/g,'')
    const res = await getSaleOutList({ list_rows: 1000 })
    const rows: any[] = res?.data?.rows ?? []
    const todayCount = rows.filter((r: any) => (r.created_at||r.out_date||'').slice(0,10) === today).length
    fd.order_no = `CK${ymd}${String(todayCount+1).padStart(3,'0')}`
  } catch {
    const ymd = new Date(Date.now()+8*3600000).toISOString().slice(0,10).replace(/-/g,'')
    fd.order_no = `CK${ymd}001`
  }
}

function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  // 从 remark 解析出库单号
  const m = (row?.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) {
    fd.order_no = m[1]
    fd.remark = (row.remark || '').replace(/^\[NO:[^\]]+\]\s*/, '')
  }
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  calcTotal()
  fd.items.forEach((item: any) => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
  isReadonly.value = readonly
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

function handlePrint() {
  const freightBearerMap: Record<string, string> = {
    seller: t('sale.out.bearerSeller'),
    buyer: t('sale.out.bearerBuyer'),
    half: t('sale.out.bearerHalf'),
    free: t('sale.out.bearerFree'),
  }
  const items = fd.items.map((r: any, i: number) =>
    `<tr>
      <td>${i + 1}</td>
      <td>${r.goods_name}</td>
      <td>${r.spec || '-'}</td>
      <td>${r.batch_no || '-'}</td>
      <td>${r.unit_name}</td>
      <td>${r.num}</td>
      <td>¥${Number(r.price || 0).toFixed(2)}</td>
      <td>¥${((r.num || 0) * (r.price || 0)).toFixed(2)}</td>
    </tr>`
  ).join('')
  const html = `
    <html><head><title>${t('sale.out.printTitle')}</title>
    <style>
      body{font-family:'Microsoft YaHei',sans-serif;font-size:13px;padding:20px}
      h2{text-align:center;margin-bottom:4px}
      .info{display:flex;gap:40px;margin:12px 0;flex-wrap:wrap}
      .info span{color:#555}
      table{width:100%;border-collapse:collapse;margin-top:12px}
      th,td{border:1px solid #ccc;padding:6px 8px;text-align:left}
      th{background:#f5f5f5}
      .total{margin-top:12px;text-align:right;font-size:14px}
      .profit{color:${netProfit.value >= 0 ? 'green' : 'red'}}
      @media print{body{padding:0}}
    </style></head><body>
    <h2>${t('sale.out.printSaleOutTitle')}</h2>
    <div class="info">
      <span>${t('sale.out.printOrderLabel')}<b>${fd.order_no || t('sale.out.printOrderPending')}</b></span>
      <span>${t('sale.out.printCustomerLabel')}<b>${fd.customer_name}</b></span>
      <span>${t('sale.out.printDateLabel')}<b>${fd.out_date}</b></span>
      <span>${t('sale.out.printAdminLabel')}<b>${fd.admin_name || '-'}</b></span>
      <span>${t('sale.out.printFreightLabel')}<b>¥${Number(fd.freight_amount || 0).toFixed(2)}（${freightBearerMap[fd.freight_bearer] || ''}）</b></span>
    </div>
    <table><thead><tr>
      <th>${t('sale.out.printColIndex')}</th><th>${t('sale.out.printColGoodsName')}</th><th>${t('sale.out.printColSpec')}</th><th>${t('sale.out.printColBatch')}</th><th>${t('sale.out.printColUnit')}</th><th>${t('sale.out.printColNum')}</th><th>${t('sale.out.printColPrice')}</th><th>${t('sale.out.printColSubtotal')}</th>
    </tr></thead><tbody>${items}</tbody></table>
    <div class="total">
      ${t('sale.out.printSumTaxIncl')}<b style="color:#0071e3">¥${fd.total_amount.toFixed(2)}</b>
      &emsp;${t('sale.out.printNetProfit')}<b class="profit">¥${netProfit.value.toFixed(2)}</b>
      &emsp;${t('sale.out.printProfitRate')}<b class="profit">${profitRate.value.toFixed(1)}%</b>
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
    </body></html>`
  const w = window.open('', '_blank', 'width=900,height=700')
  w?.document.write(html)
  w?.document.close()
}

async function handleSave(andAudit = false) {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning(t('sale.out.msgFillRequired')); return
  }
  if (!fd.items.length) {
    ElMessage.warning(t('sale.out.msgAddAtLeastOne')); return
  }
  // 有收款金额但未选账户时提醒
  if (Number(fd.receive_amount || 0) > 0 && !fd.receive_account) {
    try {
      await ElMessageBox.confirm(t('sale.out.msgConfirmReceiveContent'), t('sale.out.msgConfirmReceiveTitle'), {
        confirmButtonText: t('sale.out.btnContinueSave'), cancelButtonText: t('sale.out.btnGoSelect'), type: 'warning'
      })
    } catch { return }
  }
  saving.value = true
  if (andAudit) savingAndAuditing.value = true
  try {
    const payload: Record<string, any> = {
      customer_id: fd.customer_id,
      customer_name: fd.customer_name,
      admin_name: fd.admin_name,
      out_date: fd.out_date,
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      remark: (() => {
        let r = (fd.remark || '').replace(/^\[NO:[^\]]+\]\s*/, '')
        if (fd.order_no) r = `[NO:${fd.order_no}]` + (r ? ' ' + r : '')
        return r
      })(),
      total_amount: fd.total_amount,
      after_discount: fd.after_discount,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) payload.id = fd.id
    let savedId = fd.id
    if (fd.id) {
      await updateSaleOut(payload)
    } else {
      const res = await createSaleOut(payload)
      savedId = res?.data?.id || 0
    }
    let auditSucceeded = false
    if (andAudit && savedId) {
      try {
        await auditSaleOut(savedId, 1)
        await handleSaleOutStockEffect({ ...payload, id: savedId, goods_info: JSON.stringify(fd.items) }, 'audit')
        stockRefreshStore.trigger()
        auditSucceeded = true
      } catch (e: any) {
        ElMessage.warning(t('sale.out.msgSaveAuditFail') + (e?.message || ''))
      }
    }
    if (!andAudit || auditSucceeded) {
      ElMessage.success(andAudit ? t('sale.out.msgSaveAuditSuccess') : t('sale.out.msgSaveSuccess'))
    }
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.out.msgSaveFail'))
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

function isEmptyTestSaleOut(row: any) {
  const items = parseItems(row?.goods_info)
  const hasAnyItem = items.some((item: any) =>
    item && (
      Number(item?.goods_id || 0) > 0
      || String(item?.goods_name || '').trim()
      || Number(item?.num || 0) > 0
    )
  )
  return Number(row?.status) === 1
    && !getSaleOutOrderKey(row)
    && !String(row?.customer_name || '').trim()
    && !String(row?.warehouse_name || '').trim()
    && !String(row?.admin_name || '').trim()
    && !hasAnyItem
}

async function handleDelete(rowOrId: any) {
  const row = typeof rowOrId === 'object' && rowOrId !== null ? rowOrId : { id: Number(rowOrId || 0) }
  if (Number(row?.status) === 1 && !isEmptyTestSaleOut(row)) {
    ElMessage.warning(t('sale.out.msgUnauditFirst'))
    return
  }
  const message = isEmptyTestSaleOut(row) ? t('sale.out.msgDeleteEmptyTestConfirm') : t('sale.out.msgDeleteConfirm')
  await ElMessageBox.confirm(message, t('sale.out.msgPromptTitle'), { type: 'warning' })
  try {
    await deleteSaleOut(Number(row.id))
    ElMessage.success(t('sale.out.msgDeleteSuccess'))
    tableRef.value?.refresh()
  } catch (e: any) {
    if (e?.message && !e.message.includes('Unexpected token')) {
      ElMessage.error(e.message)
    } else {
      ElMessage.error(t('sale.out.msgDeleteFail'))
    }
  }
}

function getSaleOutOrderKey(row: any) {
  return String(row?.order_no || row?.order_sn || row?.out_no || '').trim()
}

function isAutoSaleOutReceipt(receipt: any, row: any) {
  const orderKey = getSaleOutOrderKey(row)
  const remark = String(receipt?.remark || '')
  return Number(receipt?.saleout_id || 0) === Number(row?.id || 0)
    || (!!orderKey && remark.includes(t('sale.out.autoReceiptRemark', { sn: orderKey })))
}

async function getLinkedSaleOutReceipts(row: any) {
  const orderKey = getSaleOutOrderKey(row)
  if (!orderKey && !row?.id) return []
  try {
    const res = await getCollectReceiptList(orderKey ? { keyword: orderKey, list_rows: 500 } : { list_rows: 1000 })
    const rows: any[] = res?.data?.rows ?? res?.data?.list ?? []
    return rows.filter((receipt: any) => {
      const receiptOrderKey = String(receipt?.order_sn || receipt?.order_no || '').trim()
      return Number(receipt?.saleout_id || 0) === Number(row?.id || 0)
        || (!!orderKey && receiptOrderKey === orderKey)
    })
  } catch {
    return []
  }
}

async function getReverseAuditDependencies(row: any) {
  try {
    const returnRes = await getSaleReturnList({ list_rows: 500 })
    const returnRows: any[] = returnRes?.data?.rows ?? returnRes?.data?.list ?? []
    const auditedReturns = returnRows.filter((item: any) =>
      Number(item?.status) === 1 && Number(item?.order_id) === Number(row?.id)
    )
    if (auditedReturns.length > 0) {
      ElMessage.warning(t('sale.out.msgReturnExists', { count: auditedReturns.length }))
      return null
    }
  } catch { /* ignore */ }

  const linkedReceipts = await getLinkedSaleOutReceipts(row)
  const autoReceipts = linkedReceipts.filter((receipt: any) => isAutoSaleOutReceipt(receipt, row))
  const manualReceipts = linkedReceipts.filter((receipt: any) => !isAutoSaleOutReceipt(receipt, row))

  if (manualReceipts.length > 0) {
    ElMessage.error(t('sale.out.msgManualReceiptExists', { count: manualReceipts.length }))
    return null
  }

  return { autoReceipts }
}

async function removeAutoSaleOutReceipts(receipts: any[]) {
  for (const receipt of receipts) {
    if (!receipt?.id) continue
    await deleteCollectReceipt(Number(receipt.id))
  }
}

async function handleSaleOutStockEffect(row: any, type: 'audit' | 'reverse') {
  const items = parseItems(row.goods_info)
  try {
    if (type === 'audit') {
      await stockEffect(items, 'deduct', row.warehouse_id, t('sale.out.saleOutForStock', { id: row.id }))
    } else {
      await deleteSaleOutStockFlows(row.id)
    }
  } catch (e: any) {
    console.warn(t('sale.out.stockEffectFailLog'), e?.message)
  }
}

async function syncSaleOutCustomerBalance(row: any, mode: 'audit' | 'reverse') {
  if (!row?.customer_id) return
  const customerRes = await http.get('/shop/ShopCustomer/detail', { params: { id: row.customer_id } })
  const customer = customerRes.data
  const currentBalance = Number(customer?.balance || 0)
  const amount = Number(row?.total_amount || 0)
  const nextBalance = mode === 'audit' ? currentBalance - amount : currentBalance + amount
  await http.post('/shop/ShopCustomer/edit', { id: row.customer_id, balance: nextBalance })
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('sale.out.actionAudit') : status === 2 ? t('sale.out.actionReject') : t('sale.out.actionUnaudit')
  try {
    await ElMessageBox.confirm(t('sale.out.msgConfirmAudit', { action }), t('sale.out.msgPromptTitle'), { type: 'warning' })
  } catch { return }

  try {
    let autoReceipts: any[] = []
    let autoReceiptsRemoved = false
    let financeWarning = ''

    if (status === 0) {
      const deps = await getReverseAuditDependencies(row)
      if (!deps) return
      autoReceipts = deps.autoReceipts
    }

    try {
      await auditSaleOut(row.id, status)
    } catch (e) {
      if (status === 0 && autoReceipts.length > 0) {
        await removeAutoSaleOutReceipts(autoReceipts)
        autoReceiptsRemoved = true
        autoReceipts = []
        await auditSaleOut(row.id, status)
      } else {
        throw e
      }
    }

    // 审核通过后扣减库存
    if (status === 1) {
      try {
        await handleSaleOutStockEffect(row, 'audit')
      } catch {
        financeWarning = financeWarning ? `${financeWarning}${t('sale.out.warnStockDeductSemi')}` : t('sale.out.warnStockDeductSuffix')
      }
    }

    // 审核通过后自动创建收款单 + 扣减客户余额
    if (status === 1 && row.customer_id) {
      try {
        const sn = (() => { const m = (row.remark||'').match(/^\[NO:([^\]]+)\]/); return m ? m[1] : (row.order_sn || row.order_no || '') })()
        await http.post('/finance/CollectReceipt/add', {
          customer_id: row.customer_id,
          customer_name: row.customer_name,
          amount: Number(row.after_discount || row.total_amount || 0),
          receipt_date: new Date().toISOString().slice(0, 10),
          remark: t('sale.out.autoReceiptRemark', { sn }),
        })
      } catch {
        financeWarning = financeWarning ? `${financeWarning}${t('sale.out.warnAutoReceiptSemi')}` : t('sale.out.warnAutoReceipt')
      }
      // 扣减客户余额
      try {
        await syncSaleOutCustomerBalance(row, 'audit')
      } catch {
        financeWarning = financeWarning ? `${financeWarning}${t('sale.out.warnCustomerBalanceDeductSemi')}` : t('sale.out.warnCustomerBalanceDeduct')
      }
    }

    if (status === 0) {
      if (autoReceipts.length > 0 && !autoReceiptsRemoved) {
        try {
          await removeAutoSaleOutReceipts(autoReceipts)
        } catch {
          financeWarning = financeWarning ? `${financeWarning}${t('sale.out.warnAutoReceiptCancelSemi')}` : t('sale.out.warnAutoReceiptCancel')
        }
      }

      try {
        await syncSaleOutCustomerBalance(row, 'reverse')
      } catch {
        financeWarning = financeWarning ? `${financeWarning}${t('sale.out.warnCustomerBalanceRestoreSemi')}` : t('sale.out.warnCustomerBalanceRestore')
      }

      // 反审核：库存加回
      try {
        await handleSaleOutStockEffect(row, 'reverse')
      } catch {
        financeWarning = financeWarning ? `${financeWarning}${t('sale.out.warnStockRestoreSemi')}` : t('sale.out.warnStockRestore')
      }
    }

    if (financeWarning) {
      ElMessage.warning(t('sale.out.msgActionSuccessButWarning', { action, warning: financeWarning }))
    } else {
      const items = parseItems(row.goods_info)
      const stockDesc = items.map((i: any) => `${i.goods_name || t('sale.out.goodsFallback')} ×${i.num}`).join('、')
      const amount = Number(row.after_discount || row.total_amount || 0)
      const customerLine = row.customer_name
        ? (status === 1 ? t('sale.out.receivableInc', { amount: amount.toFixed(2), name: row.customer_name }) : t('sale.out.receivableDec', { amount: amount.toFixed(2), name: row.customer_name }))
        : ''
      const stockLine = status === 1 ? t('sale.out.stockDeducted', { detail: stockDesc }) : t('sale.out.stockRestored', { detail: stockDesc })
      ElNotification({
        title: t('sale.out.msgActionSuccess', { action }), dangerouslyUseHTMLString: true,
        type: status === 1 ? 'success' : 'warning', duration: 5000,
        message: `<div style="font-size:12px;line-height:2">${stockLine}${customerLine ? `<br>💰 ${customerLine}` : ''}</div>`,
      })
    }
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch (e: any) {
    const msg = e?.message ?? ''
    if (!msg || msg.includes('Unexpected token') || msg.includes('JSON')) {
      ElMessage.error(t('sale.out.msgOperationFail'))
    } else {
      ElMessage.error(msg)
    }
  }
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (fd.items.some(i => i.goods_id === g.id)) continue
    const priceNoTax = Number(g.sell_price) || 0
    fd.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      spec: g.spec || '', cate_name: g.cate_name || '', unit_name: g.unit_name || '',
      batch_no: '', cost_price: Number(g.cost_price) || 0, num: 1,
      price_no_tax: priceNoTax, tax_rate: 0,
      price: Number((priceNoTax * 1.13).toFixed(4)), remark: '' })
    fetchGoodsSpecs(g.id)
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
  if (!manualForm.goods_name.trim()) { ElMessage.warning(t('sale.out.msgEnterGoodsName')); return }
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

// ── 批量编辑 ──────────────────────────────────────────────────────────────────
const batchEditVisible = ref(false)
const batchEditFieldKey = ref('')
const batchEditLabel = ref('')
const batchEditValue = ref(0)

const fieldLabelMap: Record<string, string> = {
  num: t('sale.out.fieldLabelNum'),
  price_no_tax: t('sale.out.fieldLabelPriceNoTax'),
  tax_rate: t('sale.out.fieldLabelTaxRate'),
  price: t('sale.out.fieldLabelPrice'),
  subtotal_no_tax: t('sale.out.fieldLabelSubtotalNoTax'),
}

function batchEditField(field: string) {
  batchEditFieldKey.value = field
  batchEditLabel.value = fieldLabelMap[field] || field
  batchEditValue.value = 0
  batchEditVisible.value = true
}

function confirmBatchEdit() {
  const field = batchEditFieldKey.value
  if (field === 'subtotal_no_tax') {
    ElMessage.info(t('sale.out.msgSubtotalReadonly'))
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
  ElMessage.success(t('sale.out.msgBatchSetSuccess', { label: batchEditLabel.value, value: batchEditValue.value }))
}

// ── 快速新增客户 ──────────────────────────────────────────────────────────────
const quickAddCustomerVisible = ref(false)
const quickCustomerSaving = ref(false)
const quickCustomerForm = reactive({ nickname: '' })

async function confirmQuickAddCustomer() {
  if (!quickCustomerForm.nickname.trim()) {
    ElMessage.warning(t('sale.out.msgEnterCustomerName')); return
  }
  quickCustomerSaving.value = true
  try {
    const res = await createSaleCustomer({ name: quickCustomerForm.nickname })
    const newId = res.data?.id ?? res.data
    await loadCustomers()
    fd.customer_id = newId
    onCustomerChange(newId)
    quickCustomerForm.nickname = ''
    quickAddCustomerVisible.value = false
    ElMessage.success(t('sale.out.msgCustomerCreated'))
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.out.msgCustomerCreateFail'))
  } finally {
    quickCustomerSaving.value = false
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
  if (!fundForm.name.trim()) { ElMessage.warning(t('sale.out.msgEnterAccountName')); return }
  addFundLoading.value = true
  try {
    const res = await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success(t('sale.out.msgFundCreated'))
    addFundVisible.value = false
    await loadFunds()
    const newName = fundForm.name.trim()
    fd.receive_account = newName
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.out.msgFundCreateFail'))
  } finally {
    addFundLoading.value = false
  }
}
</script>

<style scoped>
.saleout-page { height: 100%; }

:deep(.row-audited) {
  background-color: #f5f5f5 !important;
  color: #aaa;
}
:deep(.row-audited) td { color: #aaa !important; }
:deep(.row-audited) .el-tag { opacity: 0.7; }
:deep(.row-audited) .el-button { opacity: 0.7; }

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
</style>
