<template>
  <div class="salereturn-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="reconcileFilteredApi"
          del-path="/stock/SaleReturnOrder/batchDel"
          sort-by="return_date" :sort-desc="true"
          :export-file-name="$t('sale.return.exportFileName')" :params="searchForm"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''">
          <template #search>
            <el-input v-model="searchForm.order_no" :placeholder="$t('sale.return.searchOrderNoPlaceholder')" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" :placeholder="$t('sale.return.searchCustomerNamePlaceholder')" clearable style="width:150px" />
            <el-select v-model="searchForm.status" :placeholder="$t('sale.return.searchStatusPlaceholder')" clearable style="width:110px">
              <el-option :label="$t('sale.return.statusPending')" :value="0" />
              <el-option :label="$t('sale.return.statusAudited')" :value="1" />
              <el-option :label="$t('sale.return.statusRejected')" :value="2" />
              <el-option :label="$t('sale.return.statusUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('sale.return.btnAddReturn') }}</el-button>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('sale.return.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('sale.return.colGoodsName')" min-width="140" />
                  <el-table-column prop="goods_sn" :label="$t('sale.return.colGoodsSn')" width="110" />
                  <el-table-column prop="spec" :label="$t('sale.return.colSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('sale.return.colUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('sale.return.colQty')" width="80" align="right" />
                  <el-table-column :label="$t('sale.return.colTaxPrice')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.return.colTaxTotal')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('sale.return.colRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('sale.return.colIndex')" width="60" align="center" />
          <el-table-column prop="order_no" :label="$t('sale.return.colReturnOrderNo')" min-width="150" />
          <el-table-column :label="$t('sale.return.colCustomerName')" min-width="140">
            <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.return.colReturnDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.created_at || row.return_date) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.return.colReturnUser')" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column prop="return_amount" :label="$t('sale.return.colReturnAmount')" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ calcRowAmount(row).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="reason" :label="$t('sale.return.colReason')" min-width="140" show-overflow-tooltip />
          <el-table-column :label="$t('sale.return.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('sale.return.statusAudited') : row.status === 2 ? $t('sale.return.statusRejected') : $t('sale.return.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.return.colAction')" width="250" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="openEdit(row, true)">{{ $t('sale.return.btnView') }}</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">{{ $t('sale.return.btnEdit') }}</el-button>
              <template v-if="row.status === 0">
                <el-button type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('sale.return.btnAudit') }}</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, 2)">{{ $t('sale.return.btnReject') }}</el-button>
              </template>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('sale.return.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('sale.return.btnReconciled') : $t('sale.return.btnReconcile') }}</el-button>
              <el-button type="danger" link size="small" @click="row.status === 1 ? ElMessage.warning($t('sale.return.warnUnauditBeforeDelete')) : handleDelete(row.id)">{{ $t('sale.return.btnDelete') }}</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('sale.return.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('sale.return.formTitleView') : (fd.id ? $t('sale.return.formTitleEdit') : $t('sale.return.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('sale.return.statusAudited') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" :loading="saving && !savingAndAuditing" @click="handleSave(false)">
            {{ $t('sale.return.btnSave') }} <span style="font-size:11px;opacity:0.7">{{ $t('sale.return.saveShortcut') }}</span>
          </el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="savingAndAuditing" @click="handleSave(true)">
            {{ $t('sale.return.btnSaveAndAudit') }}
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 关联销售出库单 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('sale.return.secLinkedSaleOut') }}</div>
          <div v-if="fd.order_id" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <el-tag type="success" size="large">{{ fd.order_sn }}</el-tag>
            <span style="color:rgba(29,29,31,0.5);font-size:13px">{{ $t('sale.return.labelCustomer') }}{{ fd.customer_name }}</span>
            <span style="color:rgba(29,29,31,0.5);font-size:13px">{{ $t('sale.return.labelWarehouse') }}{{ fd.warehouse_name }}</span>
            <span style="font-size:13px">
              {{ $t('sale.return.labelOrderTotal') }}<b style="color:#0071e3">¥{{ Number(fd.order_total_amount||0).toFixed(2) }}</b>
            </span>
            <span style="font-size:13px">
              {{ $t('sale.return.labelCollected') }}<b style="color:#16a34a">¥{{ Number(fd.order_collected_amount||0).toFixed(2) }}</b>
            </span>
            <el-button v-if="!isReadonly" size="small" @click="openSaleOutPicker">{{ $t('sale.return.btnReselect') }}</el-button>
          </div>
          <el-button v-else-if="!isReadonly" type="primary" @click="openSaleOutPicker">{{ $t('sale.return.btnSelectSaleOut') }}</el-button>
          <div v-else style="color:rgba(29,29,31,0.35)">{{ $t('sale.return.emptyDash') }}</div>
        </div>

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('sale.return.secBasicInfo') }}</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelReturnOrderNo')">
                  <el-input :value="fd.id ? fd.order_no : $t('sale.return.returnOrderNoAutoTip')" disabled :placeholder="$t('sale.return.returnOrderNoAutoPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelCustomerName')" prop="customer_id"
                  :rules="[{ required: true, message: t('sale.return.msgSelectCustomer') }]">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.customer_id" :placeholder="$t('sale.return.placeholderSelectCustomer')" filterable style="flex:1"
                      @change="onCustomerChange">
                      <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="quickAddCustomerVisible = true" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelCustomerLevel')">
                  <el-select v-model="fd.level_id" :placeholder="$t('sale.return.placeholderLevel')" clearable style="width:100%" :disabled="isReadonly" @change="onLevelChange">
                    <el-option v-for="lv in levelOptions" :key="lv.id" :label="lv.name" :value="lv.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelReturnUser')" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('sale.return.placeholderReturnUser')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelReturnDate')" prop="return_date">
                  <el-date-picker v-model="fd.return_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('sale.return.placeholderDate')" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelReason')" prop="reason">
                  <el-input v-model="fd.reason" :placeholder="$t('sale.return.placeholderReason')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelWarehouseField')" prop="warehouse_id">
                  <el-select v-model="fd.warehouse_id" :placeholder="$t('sale.return.placeholderSelectWarehouse')" filterable style="width:100%"
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelNeedInvoice')">
                  <el-switch v-model="fd.need_invoice" :active-text="$t('sale.return.switchYes')" :inactive-text="$t('sale.return.switchNo')" />
                </el-form-item>
              </el-col>
              <el-col :span="6" />

              <!-- 行3 -->
              <el-col :span="18">
                <el-form-item :label="$t('sale.return.labelRemark')">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('sale.return.placeholderRemark')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.return.labelAttachment')">
                  <el-button :icon="Paperclip">{{ $t('sale.return.btnUploadAttachment') }}</el-button>
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
              <template v-if="!fd.order_id">
                <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()">{{ $t('sale.return.btnSelectGoods') }}</el-button>
                <el-button :icon="EditPen" size="small" @click="openManualAdd">{{ $t('sale.return.btnAddGoodsManual') }}</el-button>
              </template>
              <span v-else style="font-size:13px;color:rgba(29,29,31,0.5)">{{ $t('sale.return.goodsImportedTip') }}</span>
            </div>
            <span class="goods-count">{{ $t('sale.return.goodsCountPrefix') }} <b>{{ fd.items.length }}</b> {{ $t('sale.return.goodsCountSuffix') }}</span>
          </div>

          <!-- 商品表格 -->
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('sale.return.emptyGoodsTip')">
            <el-table-column type="index" width="45" align="center" fixed="left" />
            <el-table-column :label="$t('sale.return.colGoodsName')" min-width="150" fixed="left">
              <template #default="{ row }">
                <el-input v-model="row.goods_name" size="small" :placeholder="$t('sale.return.placeholderGoodsName')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.return.colGoodsSn')" width="120">
              <template #default="{ row }">
                <el-input v-model="row.goods_sn" size="small" :placeholder="$t('sale.return.placeholderGoodsSn')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.return.colSpec')" width="140">
              <template #default="{ row }">
                <el-select
                  v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                  v-model="row.spec"
                  size="small"
                  :placeholder="$t('sale.return.placeholderSelectSpec')"
                  clearable
                  style="width:100%"
                  @focus="fetchGoodsSpecs(row.goods_id)"
                >
                  <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                </el-select>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('sale.return.placeholderSpec')"
                  @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.return.colUnit')" width="70" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" size="small" :placeholder="$t('sale.return.placeholderUnit')" />
              </template>
            </el-table-column>
            <el-table-column v-if="fd.order_id" :label="$t('sale.return.colOutQty')" width="90" align="right">
              <template #default="{ row }">{{ row.origin_num ?? '—' }}</template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.return.colReturnQty') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('num')">{{ $t('sale.return.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.num" :min="0" :max="fd.order_id && row.origin_num ? row.origin_num : undefined" :precision="2" size="small"
                  controls-position="right" style="width:100%" @change="calcItemTax(row); calcTotal()" />
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.return.colNoTaxPrice') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price_no_tax')">{{ $t('sale.return.btnBatch') }}</el-button>
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
                  <span>{{ $t('sale.return.colTaxRate') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('tax_rate')">{{ $t('sale.return.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-select v-model="row.tax_rate" size="small" style="width:100%" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.return.colTaxAmount')" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.return.colTaxPriceShort') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price')">{{ $t('sale.return.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small"
                  controls-position="right" style="width:100%" @change="onPriceChange(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.return.colTaxTotalShort')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.return.colRemark')" min-width="140">
              <template #default="{ row }">
                <div style="display:flex;gap:4px;align-items:center">
                  <el-input v-model="row.remark" size="small" :placeholder="$t('sale.return.placeholderRemarkShort')" style="flex:1" />
                  <el-tooltip v-if="fd.level_id && row.goods_id > 0 && !hasLevelPrice(row.goods_id)"
                    :content="$t('sale.return.tooltipNoLevelPrice')" placement="top">
                    <el-button type="warning" link size="small" @click="saveAsLevelPrice(row)">{{ $t('sale.return.btnRecordLevelPrice') }}</el-button>
                  </el-tooltip>
                </div>
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
          <div class="sec-title">{{ $t('sale.return.secSettlement') }}</div>
          <div class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.return.labelTotalReturnAmount') }}</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.return.labelDiscountType') }}</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" @change="calcSettle">
                <el-option :label="$t('sale.return.discountNone')" value="none" />
                <el-option :label="$t('sale.return.discountAmount')" value="amount" />
                <el-option :label="$t('sale.return.discountPercent')" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? $t('sale.return.labelDiscountPercent') : $t('sale.return.labelDiscountAmount') }}</span>
              <el-input-number v-model="fd.discount_value" :min="0"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.return.labelActualReturnAmount') }}</span>
              <span class="settle-value">¥{{ fd.return_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.return.labelRefundAccount') }}</span>
              <el-select v-model="fd.fund_id" :placeholder="$t('sale.return.placeholderRefundAccount')" clearable style="width:200px"
                :disabled="isReadonly" @change="(id: any) => { const f = fundOptions.find((x: any) => x.id === id); fd.fund_name = f?.name || '' }">
                <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
              </el-select>
            </div>
          </div>
          <div class="settle-summary">
            <span>{{ $t('sale.return.summaryTaxTotal') }}<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.return.summaryActualReturn') }}<b style="color:#dc2626;font-size:16px">¥{{ fd.return_amount.toFixed(2) }}</b></span>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" :customer-id="fd.customer_id" :filter-goods-ids="customerGoodsIds" @confirm="onGoodsConfirm" />

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="$t('sale.return.dialogManualAddTitle')" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('sale.return.colGoodsName')" :rules="[{ required: true }]">
          <el-input v-model="manualForm.goods_name" :placeholder="$t('sale.return.manualGoodsNamePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.return.colGoodsSn')">
          <el-input v-model="manualForm.goods_sn" :placeholder="$t('sale.return.manualGoodsSnPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.return.colSpec')">
          <el-input v-model="manualForm.spec" :placeholder="$t('sale.return.manualSpecPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.return.colUnit')">
          <el-input v-model="manualForm.unit_name" :placeholder="$t('sale.return.manualUnitPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.return.manualLabelReturnQty')">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.return.manualLabelTaxPrice')">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('sale.return.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmManualAdd">{{ $t('sale.return.btnConfirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="$t('sale.return.dialogBatchEditTitle', { label: batchEditLabel })" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">{{ $t('sale.return.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ $t('sale.return.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增客户弹框 -->
    <el-dialog v-model="quickAddCustomerVisible" :title="$t('sale.return.dialogQuickAddCustomerTitle')" width="360px" append-to-body>
      <el-form :model="quickCustomerForm" label-width="70px">
        <el-form-item :label="$t('sale.return.labelCustomerName')" required>
          <el-input v-model="quickCustomerForm.nickname" :placeholder="$t('sale.return.quickCustomerNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddCustomerVisible = false">{{ $t('sale.return.btnCancel') }}</el-button>
        <el-button type="primary" :loading="quickCustomerSaving" @click="confirmQuickAddCustomer">{{ $t('sale.return.btnConfirmCreate') }}</el-button>
      </template>
    </el-dialog>

    <!-- 选择销售出库单弹框 -->
    <el-dialog v-model="saleOutPickerVisible" :title="$t('sale.return.dialogPickSaleOutTitle')" width="780px" append-to-body>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <el-input v-model="saleOutPickerKeyword" :placeholder="$t('sale.return.saleOutSearchPlaceholder')" clearable style="width:260px" />
      </div>
      <el-table :data="filteredSaleOutOrders" v-loading="saleOutPickerLoading" border height="380"
        highlight-current-row @current-change="onSaleOutSelect">
        <el-table-column prop="order_sn" :label="$t('sale.return.colSaleOutOrderSn')" min-width="160" />
        <el-table-column prop="customer_name" :label="$t('sale.return.colPickCustomer')" min-width="120" />
        <el-table-column prop="warehouse_name" :label="$t('sale.return.colPickWarehouse')" width="110" />
        <el-table-column :label="$t('sale.return.colOutAmount')" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.return.colOutDate')" width="110">
          <template #default="{ row }">{{ fmtDt(row.out_date || row.create_time) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="saleOutPickerVisible = false">{{ $t('sale.return.btnCancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedSaleOut" @click="confirmSaleOutSelect">{{ $t('sale.return.btnConfirmSelect') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Delete, ArrowLeft, EditPen, Document, Upload, Camera, Paperclip } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getSaleReturnList, createSaleReturn, updateSaleReturn, deleteSaleReturn, auditSaleReturn, getSaleOutList } from '@/api/sale'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getFundList, updateFund, createPayReceipt } from '@/api/finance'
import { getSpecList } from '@/api/goods'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import StaffSelect from '@/components/StaffSelect.vue'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect } from '@/utils/stockEffect'
import { loadLevels, loadLevelMap, getLevelPrice, setLevelPrice, hasCustomLevelPrice, type LevelItem } from '@/utils/customerLevel'

const { t } = useI18n()

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

// ── 列表 ─────────────────────────────────────────────────────────────────────
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_sale_return', tableRef)
const reconcileFilteredApi = createFilteredApi(getSaleReturnList)

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

// ── 客户等级 ──────────────────────────────────────────────────────────────────
const levelOptions = ref<LevelItem[]>(loadLevels())
const levelMap = loadLevelMap()

// ── 客户历史购买商品过滤 ───────────────────────────────────────────────────────
const customerGoodsIds = ref<number[] | null>(null)

async function loadCustomerHistoryGoods(customerId: number) {
  if (!customerId) { customerGoodsIds.value = null; return }
  try {
    const res = await getSaleOutList({ customer_id: customerId, status: 1, list_rows: 500 })
    const orders = res.data?.rows ?? []
    const ids = new Set<number>()
    for (const order of orders) {
      for (const item of parseItems(order.goods_info)) {
        if (item.goods_id) ids.add(Number(item.goods_id))
      }
    }
    customerGoodsIds.value = ids.size > 0 ? Array.from(ids) : null
  } catch {
    customerGoodsIds.value = null
  }
}

// ── 仓库选项 ──────────────────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows ?? []
}

const fundOptions = ref<any[]>([])
async function loadFunds() {
  const res = await getFundList({ list_rows: 200 })
  fundOptions.value = res.data?.rows ?? []
}

onMounted(() => { loadCustomers(); loadWarehouses(); loadFunds() })

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface SaleReturnItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; unit_name: string
  num: number; price_no_tax: number; tax_rate: number; price: number; remark: string
}

const defaultFd = () => ({
  id: 0,
  order_no: '',
  order_id: 0,
  order_sn: '',
  order_total_amount: 0,
  order_collected_amount: 0,
  customer_id: null as any,
  customer_name: '',
  level_id: null as any,
  admin_name: '',
  return_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  reason: '',
  warehouse_id: null as any,
  warehouse_name: '',
  need_invoice: false,
  remark: '',
  total_amount: 0,
  discount_type: 'none' as string,
  discount_value: 0,
  return_amount: 0,
  fund_id: null as any,
  fund_name: '',
  items: [] as SaleReturnItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)
const savingAndAuditing = ref(false)

function calcTotal() {
  fd.total_amount = fd.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
  calcSettle()
}

function calcSettle() {
  if (fd.discount_type === 'none') {
    fd.return_amount = fd.total_amount
  } else if (fd.discount_type === 'amount') {
    fd.return_amount = Math.max(0, fd.total_amount - (fd.discount_value || 0))
  } else {
    fd.return_amount = fd.total_amount * (1 - (fd.discount_value || 0) / 100)
  }
}

function calcItemTax(row: SaleReturnItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(4))
}

function onPriceNoTaxChange(row: SaleReturnItem) {
  calcItemTax(row)
  calcTotal()
}

function onTaxRateChange(row: SaleReturnItem) {
  calcItemTax(row)
  calcTotal()
}

function onPriceChange(row: SaleReturnItem) {
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
  const bound = levelMap[id]
  if (bound && levelOptions.value.some(l => l.id === bound)) {
    fd.level_id = bound
  } else {
    fd.level_id = null
  }
  loadCustomerHistoryGoods(Number(id))
}

const savedLevelPriceIds = ref<Set<number>>(new Set())

function hasLevelPrice(goodsId: number): boolean {
  if (savedLevelPriceIds.value.has(goodsId)) return true
  if (!fd.level_id) return true
  return getLevelPrice(Number(fd.level_id), goodsId) !== null
}

function saveAsLevelPrice(row: any) {
  if (!fd.level_id || !row.goods_id) return
  setLevelPrice(Number(fd.level_id), row.goods_id, row.price)
  savedLevelPriceIds.value = new Set([...savedLevelPriceIds.value, row.goods_id])
  ElMessage.success(t('sale.return.msgLevelPriceSaved', { name: row.goods_name, price: row.price }))
}

function onLevelChange() {
  if (!fd.items.length || !fd.level_id) return
  for (const row of fd.items) {
    if (!row.goods_id) continue
    const lp = getLevelPrice(fd.level_id, row.goods_id)
    if (lp !== null) {
      row.price = lp
      row.price_no_tax = row.tax_rate > 0 ? Number((lp / (1 + row.tax_rate / 100)).toFixed(4)) : lp
    }
  }
  calcTotal()
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
}

function openCreate() {
  Object.assign(fd, defaultFd())
  customerGoodsIds.value = null
  isReadonly.value = false
  showForm.value = true
}

function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  // 若 DB 没存 level_id，从 levelMap 自动补
  if (!fd.level_id && row.customer_id) {
    const bound = levelMap[row.customer_id]
    fd.level_id = bound || null
  }
  calcTotal()
  fd.items.forEach((item: any) => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
  if (row.customer_id) loadCustomerHistoryGoods(Number(row.customer_id))
  else customerGoodsIds.value = null
  isReadonly.value = readonly
  showForm.value = true
}

function calcRowAmount(row: any): number {
  if (row.return_amount && Number(row.return_amount) > 0) return Number(row.return_amount)
  const items = Array.isArray(row.goods_info) ? row.goods_info : (typeof row.goods_info === 'string' ? JSON.parse(row.goods_info || '[]') : [])
  return items.reduce((s: number, it: any) => s + (Number(it.num) || 0) * (Number(it.price) || 0), 0)
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

async function handleSave(andAudit = false) {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning(t('sale.return.msgRequiredFields')); return
  }
  if (!fd.items.length) {
    ElMessage.warning(t('sale.return.msgAtLeastOneItem')); return
  }
  saving.value = true
  if (andAudit) savingAndAuditing.value = true
  try {
    const filteredItems = fd.items.filter(i => (i.num || 0) > 0)
    const payload: Record<string, any> = {
      sale_out_order_id: fd.order_id,
      order_sn: fd.order_sn,
      customer_id: fd.customer_id,
      customer_name: fd.customer_name,
      admin_name: fd.admin_name,
      return_date: fd.return_date,
      reason: fd.reason,
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      return_amount: fd.return_amount,
      remark: fd.remark,
      total_amount: fd.total_amount,
      level_id: fd.level_id || 0,
      fund_id: fd.fund_id || null,
      fund_name: fd.fund_name || '',
      goods_info: JSON.stringify(filteredItems),
    }
    let savedId = fd.id
    if (fd.id) {
      payload.id = fd.id
      await updateSaleReturn(payload)
    } else {
      const res = await createSaleReturn(payload)
      savedId = Number(res?.data?.id || res?.data?.row?.id || res?.data?.data?.id || 0)
    }

    if (andAudit && savedId) {
      try {
        await auditSaleReturn(savedId, 1)
        // 库存加回（带唯一标记，反审核时按标记找单撤销）
        await stockEffect(filteredItems, 'restore', fd.warehouse_id, `销售退货入库#${savedId}`)
        // 自动退款：有欠款→冲抵应收，无欠款→退现金付款单
        await handleReturnRefund({ ...fd, id: savedId }, 'audit')
        stockRefreshStore.trigger()
        ElMessage.success(t('sale.return.msgSaveAndAuditSuccess'))
      } catch (e: any) {
        ElMessage.warning(t('sale.return.msgSaveOkAuditFailed', { error: e?.message || '' }))
      }
    } else {
      ElMessage.success(t('sale.return.msgSaveSuccess'))
    }
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.return.msgSaveFailed'))
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('sale.return.confirmDeleteReturn'), t('sale.return.confirmTitle'), { type: 'warning' })
  await deleteSaleReturn(id)
  ElMessage.success(t('sale.return.msgDeleted'))
  tableRef.value?.refresh()
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('sale.return.actionApprove') : status === 2 ? t('sale.return.actionReject') : t('sale.return.actionUnaudit')
  await ElMessageBox.confirm(t('sale.return.confirmAuditAction', { action }), t('sale.return.confirmTitle'), { type: 'warning' })
  try {
    await auditSaleReturn(row.id, status)

    // 审核通过：库存加回 + 自动退款（有欠款→冲抵应收；无欠款→退现金）
    if (status === 1) {
      await handleReturnStockEffect(row, 'audit')
      await handleReturnRefund(row, 'audit')
    }
    // 反审核：撤销库存加回 + 撤销退款
    if (status === 0) {
      await handleReturnStockEffect(row, 'reverse')
      await handleReturnRefund(row, 'reverse')
    }

    ElMessage.success(t('sale.return.msgActionSuccess', { action }))
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.return.msgActionFailed'))
  }
}

async function annulSaleReturnStockIn(returnOrderId: number) {
  const marker = `销售退货入库#${returnOrderId}`
  const res = await http.get('/stock/OtherIn/index', { params: { list_rows: 500 } })
  const rows: any[] = res.data?.rows ?? []
  const targets = rows.filter((r: any) => String(r.remark) === marker)
  for (const r of targets) {
    await http.post('/stock/OtherIn/annul', { id: r.id })
  }
}

// 自动判断退款方式：有应收欠款→冲抵（加客户余额）；无欠款+有账户→直接退现金（创建付款单）
async function handleReturnRefund(returnData: any, type: 'audit' | 'reverse') {
  const customerId = returnData.customer_id
  const amount = Number(returnData.return_amount ?? returnData.total_amount ?? fd.return_amount ?? 0)
  const fundId = Number(returnData.fund_id || fd.fund_id || 0)
  const fundName = returnData.fund_name || fd.fund_name || ''
  const orderNo = returnData.order_no || ''
  if (!customerId || amount <= 0) return

  if (type === 'reverse') {
    // 反审核：撤销客户余额增加（无论当时走了哪条路，都尝试回滚）
    // 付款单反审核需要单独处理，这里只回滚客户余额
    try {
      const res = await http.get('/shop/ShopCustomer/detail', { params: { id: customerId } })
      const cur = Number(res.data?.balance || 0)
      await http.post('/shop/ShopCustomer/edit', { id: customerId, balance: Math.max(0, cur - amount) })
    } catch (e: any) { console.warn('客户余额回滚失败', e?.message) }
    return
  }

  // 查客户合同应收余额
  let outstanding = 0
  try {
    const res = await http.get('/shop/ContractOrder/index', { params: { customer_id: customerId, status: 1, list_rows: 500 } })
    const contracts: any[] = res.data?.rows ?? []
    for (const c of contracts) {
      const base = Number(c.after_discount) > 0 && Number(c.after_discount) <= Number(c.total_amount)
        ? Number(c.after_discount) : Number(c.total_amount || 0)
      outstanding += Math.max(0, base - Number(c.income_amount || 0))
    }
  } catch { /* 查不到时 fallback 加余额 */ }

  if (outstanding > 0 || !fundId) {
    // 有欠款 or 未指定账户：加到客户余额冲抵应收
    try {
      const res = await http.get('/shop/ShopCustomer/detail', { params: { id: customerId } })
      const cur = Number(res.data?.balance || 0)
      await http.post('/shop/ShopCustomer/edit', { id: customerId, balance: cur + amount })
    } catch (e: any) { console.warn('客户余额更新失败', e?.message) }
  } else {
    // 无欠款 + 有指定账户：直接退现金，创建付款单
    try {
      const funds: any[] = fundOptions.value
      const fund = funds.find((f: any) => f.id === fundId)
      await createPayReceipt({
        amount,
        fund_id: fundId,
        fund_name: fund?.name || fundName,
        contact_type: 'customer',
        customer_id: customerId,
        customer_name: returnData.customer_name || fd.customer_name,
        pay_date: new Date().toISOString().slice(0, 10),
        remark: `销售退货退款 ${orderNo}`.trim(),
      })
      if (fund) {
        await updateFund({ id: fund.id, name: fund.name, balance: Number(fund.balance || 0) - amount })
      }
      ElMessage.info(t('sale.return.msgRefundOrderCreated'))
    } catch (e: any) { console.warn('退款付款单创建失败', e?.message) }
  }
}

async function handleReturnStockEffect(row: any, type: 'audit' | 'reverse') {
  const items = parseItems(row.goods_info)
  try {
    if (type === 'audit') {
      await stockEffect(items, 'restore', row.warehouse_id, `销售退货入库#${row.id}`)
    } else {
      // 反审核：直接撤销审核时创建的入库单，不创建新出库单
      await annulSaleReturnStockIn(row.id)
    }
  } catch (e: any) {
    console.warn('销售退货库存变动失败', e?.message)
  }
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (fd.items.some(i => i.goods_id === g.id)) continue
    const basePrice = Number(g.sell_price) || 0
    const levelPrice = fd.level_id ? (getLevelPrice(fd.level_id, g.id) ?? basePrice) : basePrice
    fd.items.push({
      goods_id: g.id,
      goods_name: g.goods_name,
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      num: 1,
      price_no_tax: Number(levelPrice.toFixed(4)),
      tax_rate: 0,
      price: Number(levelPrice.toFixed(4)),
      remark: '',
    })
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
  if (!manualForm.goods_name.trim()) { ElMessage.warning(t('sale.return.placeholderGoodsName')); return }
  fd.items.push({
    goods_id: 0,
    goods_name: manualForm.goods_name,
    goods_sn: manualForm.goods_sn,
    spec: manualForm.spec,
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
  num: t('sale.return.fieldNum'),
  price_no_tax: t('sale.return.fieldPriceNoTax'),
  tax_rate: t('sale.return.fieldTaxRate'),
  price: t('sale.return.fieldPrice'),
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
  ElMessage.success(t('sale.return.msgBatchSetDone', { label: batchEditLabel.value, value: batchEditValue.value }))
}

// ── 快速新增客户 ──────────────────────────────────────────────────────────────
const quickAddCustomerVisible = ref(false)
const quickCustomerSaving = ref(false)
const quickCustomerForm = reactive({ nickname: '' })

async function confirmQuickAddCustomer() {
  if (!quickCustomerForm.nickname.trim()) {
    ElMessage.warning(t('sale.return.quickCustomerNamePlaceholder')); return
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
    ElMessage.success(t('sale.return.msgCustomerCreated'))
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.return.msgCreateFailed'))
  } finally {
    quickCustomerSaving.value = false
  }
}

// ── 选择销售出库单 ────────────────────────────────────────────────────────────
const saleOutPickerVisible = ref(false)
const saleOutPickerLoading = ref(false)
const saleOutList = ref<any[]>([])
const saleOutPickerKeyword = ref('')
const selectedSaleOut = ref<any>(null)

const filteredSaleOutOrders = computed(() => {
  if (!saleOutPickerKeyword.value) return saleOutList.value
  const kw = saleOutPickerKeyword.value
  return saleOutList.value.filter(o =>
    o.order_sn?.includes(kw) || o.customer_name?.includes(kw)
  )
})

function onSaleOutSelect(row: any) {
  selectedSaleOut.value = row
}

async function openSaleOutPicker() {
  saleOutPickerKeyword.value = ''
  selectedSaleOut.value = null
  saleOutPickerVisible.value = true
  saleOutPickerLoading.value = true
  try {
    const res = await getSaleOutList({ status: 1, list_rows: 200 })
    saleOutList.value = res.data?.rows ?? []
  } catch {
    saleOutList.value = []
  } finally {
    saleOutPickerLoading.value = false
  }
}

function confirmSaleOutSelect() {
  if (!selectedSaleOut.value) return
  const order = selectedSaleOut.value
  fd.order_id = order.id
  fd.order_sn = order.order_sn
  fd.order_total_amount = Number(order.total_amount || order.after_discount || 0)
  fd.order_collected_amount = Number(order.collected_amount || order.pay_amount || 0)
  fd.customer_id = order.customer_id
  fd.customer_name = order.customer_name || ''
  fd.warehouse_id = order.warehouse_id
  fd.warehouse_name = order.warehouse_name || ''
  onCustomerChange(order.customer_id)

  // 从销售出库单商品明细生成退货行（num默认0，origin_num=出库数量）
  const items = parseItems(order.goods_info)
  fd.items = items.map((i: any) => ({
    goods_id: i.goods_id || 0,
    goods_name: i.goods_name || '',
    goods_sn: i.goods_sn || '',
    spec: i.spec || '',
    unit_name: i.unit_name || '',
    origin_num: i.num || 0,
    num: 0,
    price_no_tax: Number(i.price_no_tax || i.price || 0),
    tax_rate: i.tax_rate || 0,
    price: Number(i.price || 0),
    remark: '',
  }))
  calcTotal()
  saleOutPickerVisible.value = false
}
</script>

<style scoped>
.salereturn-page { height: 100%; }

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
