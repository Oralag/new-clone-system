<template>
  <div class="saleexchange-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="fetchSaleExchangeListWithTypeFilter"
          sort-by="created_at" :sort-desc="true"
          :export-file-name="$t('sale.exchange.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_no" :placeholder="$t('sale.exchange.searchOrderNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" :placeholder="$t('sale.exchange.searchCustomerName')" clearable style="width:150px" />
            <el-select v-model="searchForm.order_type" :placeholder="$t('sale.exchange.typeFilterPlaceholder')" clearable style="width:110px">
              <el-option :label="$t('sale.exchange.typeExchange')" value="exchange" />
              <el-option :label="$t('sale.exchange.typeReissue')" value="reissue" />
            </el-select>
            <el-select v-model="searchForm.status" :placeholder="$t('sale.exchange.status')" clearable style="width:110px">
              <el-option :label="$t('sale.exchange.statusPending')" :value="0" />
              <el-option :label="$t('sale.exchange.statusApproved')" :value="1" />
              <el-option :label="$t('sale.exchange.statusRejected')" :value="2" />
            </el-select>
          </template>
          <template #toolbar>
            <el-dropdown @command="(cmd: OrderType) => openCreate(cmd)">
              <el-button type="primary" :icon="Plus">
                {{ $t('sale.exchange.createDropdown') }} <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="exchange">{{ $t('sale.exchange.createExchange') }}</el-dropdown-item>
                  <el-dropdown-item command="reissue">{{ $t('sale.exchange.createReissue') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div v-if="parseOrderTypeFromRow(row) !== 'reissue'" class="expand-section">
                  <div class="expand-title">{{ $t('sale.exchange.expandReturnGoods') }}</div>
                  <el-table :data="parseItems(row.return_goods_info)" border size="small" class="expand-table">
                    <el-table-column type="index" width="40" align="center" />
                    <el-table-column prop="goods_name" :label="$t('sale.exchange.goodsName')" min-width="140" />
                    <el-table-column prop="goods_sn" :label="$t('sale.exchange.goodsSn')" width="110" />
                    <el-table-column prop="spec" :label="$t('sale.exchange.spec')" width="100" />
                    <el-table-column prop="unit_name" :label="$t('sale.exchange.unit')" width="65" align="center" />
                    <el-table-column prop="num" :label="$t('sale.exchange.qty')" width="80" align="right" />
                    <el-table-column :label="$t('sale.exchange.taxUnitPrice')" width="110" align="right">
                      <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('sale.exchange.taxTotal')" width="110" align="right">
                      <template #default="{ row: item }">
                        <span style="color:#dc2626;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
                <div class="expand-section" :style="{ marginTop: parseOrderTypeFromRow(row) === 'reissue' ? '0' : '12px' }">
                  <div class="expand-title">{{ parseOrderTypeFromRow(row) === 'reissue' ? $t('sale.exchange.reissueGoodsSection') : $t('sale.exchange.expandExchangeGoods') }}</div>
                  <el-table :data="parseItems(row.exchange_goods_info)" border size="small" class="expand-table">
                    <el-table-column type="index" width="40" align="center" />
                    <el-table-column prop="goods_name" :label="$t('sale.exchange.goodsName')" min-width="140" />
                    <el-table-column prop="goods_sn" :label="$t('sale.exchange.goodsSn')" width="110" />
                    <el-table-column prop="spec" :label="$t('sale.exchange.spec')" width="100" />
                    <el-table-column prop="unit_name" :label="$t('sale.exchange.unit')" width="65" align="center" />
                    <el-table-column prop="num" :label="$t('sale.exchange.qty')" width="80" align="right" />
                    <el-table-column :label="$t('sale.exchange.taxUnitPrice')" width="110" align="right">
                      <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                    </el-table-column>
                    <el-table-column :label="$t('sale.exchange.taxTotal')" width="110" align="right">
                      <template #default="{ row: item }">
                        <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('sale.exchange.seqNo')" width="60" align="center" />
          <el-table-column :label="$t('sale.exchange.colType')" width="75" align="center">
            <template #default="{ row }">
              <el-tag :type="parseOrderTypeFromRow(row) === 'reissue' ? 'warning' : 'info'" size="small" effect="plain">
                {{ parseOrderTypeFromRow(row) === 'reissue' ? $t('sale.exchange.typeReissue') : $t('sale.exchange.typeExchange') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="order_no" :label="$t('sale.exchange.orderNo')" min-width="150" />
          <el-table-column :label="$t('sale.exchange.customerName')" min-width="140">
            <template #default="{ row }">{{ row.customer_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.exchangeDate')" width="110">
            <template #default="{ row }">{{ String(row.exchange_date || row.created_at || '').slice(0, 10) }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.handler')" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.returnAmount')" width="110" align="right">
            <template #default="{ row }">
              <span v-if="parseOrderTypeFromRow(row) === 'reissue'" style="color:rgba(29,29,31,0.2)">—</span>
              <span v-else style="color:#dc2626">¥{{ Number(row.return_amount || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.exchangeAmount')" width="110" align="right">
            <template #default="{ row }">
              <span v-if="parseOrderTypeFromRow(row) === 'reissue'" style="color:rgba(29,29,31,0.2)">—</span>
              <span v-else style="color:#0071e3;font-weight:500">¥{{ Number(row.exchange_amount || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.diffAmount')" width="110" align="right">
            <template #default="{ row }">
              <span v-if="parseOrderTypeFromRow(row) === 'reissue'" style="color:rgba(29,29,31,0.2)">—</span>
              <span v-else :style="{ color: Number(row.diff_amount||0) > 0 ? '#dc2626' : Number(row.diff_amount||0) < 0 ? '#16a34a' : '' }">
                {{ Number(row.diff_amount||0) > 0 ? '+' : '' }}¥{{ Number(row.diff_amount||0).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.additionalFees')" width="200" align="right">
            <template #default="{ row }">
              <template v-if="parseFeeItemsFromRow(row).length > 0">
                <div v-for="(fee, idx) in parseFeeItemsFromRow(row)" :key="idx" style="display:flex;align-items:center;justify-content:flex-end;gap:4px;line-height:1.6">
                  <span style="font-size:11px;color:rgba(29,29,31,0.5)">{{ getFeeDisplayName(fee.name) }}</span>
                  <span style="color:#8b5cf6;font-weight:600">¥{{ Number(fee.amount).toFixed(2) }}</span>
                </div>
              </template>
              <span v-else style="color:rgba(29,29,31,0.2)">—</span>
              <div style="margin-top:2px;text-align:right">
                <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">
                  {{ parseFeeItemsFromRow(row).length > 0 ? $t('sale.exchange.manageFees') : $t('sale.exchange.addFees') }}
                </el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="reason" :label="$t('sale.exchange.reason')" min-width="140" show-overflow-tooltip />
          <el-table-column :label="$t('sale.exchange.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? $t('sale.exchange.statusApproved') : row.status === 2 ? $t('sale.exchange.statusRejected') : $t('sale.exchange.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.exchange.operation')" width="230" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="openEdit(row, true)">{{ $t('sale.exchange.view') }}</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">{{ $t('sale.exchange.edit') }}</el-button>
              <template v-if="row.status === 0">
                <el-button type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('sale.exchange.approve') }}</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, 2)">{{ $t('sale.exchange.reject') }}</el-button>
              </template>
              <el-button v-if="row.status === 1" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('sale.exchange.unapprove') }}</el-button>
              <el-button type="danger" link size="small" @click="row.status === 1 ? ElMessage.warning($t('sale.exchange.deleteAuditedWarning')) : handleDelete(row.id)">{{ $t('sale.exchange.delete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑全页面 ── -->
    <div v-else class="form-page">
      <div class="form-topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('sale.exchange.back') }}</el-button>
          <span class="form-title">{{
            isReissue
              ? (isReadonly ? $t('sale.exchange.viewReissue') : (fd.id ? $t('sale.exchange.editReissue') : $t('sale.exchange.newReissue')))
              : (isReadonly ? $t('sale.exchange.viewExchange') : (fd.id ? $t('sale.exchange.editExchange') : $t('sale.exchange.newExchange')))
          }}</span>
          <el-tag :type="isReissue ? 'warning' : 'info'" size="small" effect="plain">
            {{ isReissue ? $t('sale.exchange.typeReissue') : $t('sale.exchange.typeExchange') }}
          </el-tag>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('sale.exchange.approved') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" :loading="saving && !savingAndAuditing" @click="handleSave(false)">{{ $t('sale.exchange.save') }}</el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="savingAndAuditing" @click="handleSave(true)">{{ $t('sale.exchange.saveAndAudit') }}</el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('sale.exchange.basicInfo') }}</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.orderNo')">
                  <el-input :value="fd.id ? fd.order_no : $t('sale.exchange.orderNoPlaceholder')" disabled />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.sourceSaleOrder')">
                  <div style="display:flex;gap:6px;align-items:center;width:100%">
                    <el-tag v-if="fd.source_order_no" type="success" style="flex:1;overflow:hidden;text-overflow:ellipsis">{{ fd.source_order_no }}</el-tag>
                    <span v-else style="color:rgba(29,29,31,0.3);font-size:13px;flex:1">{{ $t('sale.exchange.sourceNotLinked') }}</span>
                    <el-button v-if="!isReadonly" size="small" @click="openSaleOutPicker">{{ fd.source_order_no ? $t('sale.exchange.reselect') : $t('sale.exchange.selectSource') }}</el-button>
                    <el-button v-if="!isReadonly && fd.source_order_no" size="small" type="danger" link @click="fd.source_order_id=0; fd.source_order_no=''">{{ $t('sale.exchange.clear') }}</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.customerName')" prop="customer_id" :rules="[{ required: true, message: $t('sale.exchange.customerRequired') }]">
                  <el-select v-model="fd.customer_id" :placeholder="$t('sale.exchange.selectCustomer')" filterable style="width:100%" @change="onCustomerChange">
                    <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.handler')" prop="warehouse_id" :rules="[{ required: true, message: $t('sale.exchange.warehouseRequired') }]">
                  <el-select v-model="fd.warehouse_id" :placeholder="$t('sale.exchange.selectWarehouse')" filterable style="width:100%" @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.handler')">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('sale.exchange.staffPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.exchangeDate')">
                  <el-date-picker v-model="fd.exchange_date" type="date" value-format="YYYY-MM-DD" style="width:100%" :placeholder="$t('sale.exchange.selectDate')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('sale.exchange.reason')">
                  <el-input v-model="fd.reason" :placeholder="isReissue ? $t('sale.exchange.reissueReasonPlaceholder') : $t('sale.exchange.exchangeReasonPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="$t('sale.exchange.remark')">
                  <el-input v-model="fd.remark" type="textarea" :rows="1" :placeholder="$t('sale.exchange.remarkPlaceholder')" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 退回商品（补发单不显示） -->
        <div v-if="!isReissue" class="form-section">
          <div class="sec-header">
            <div class="sec-title">{{ $t('sale.exchange.returnGoodsSection') }} <span class="sec-subtitle">{{ $t('sale.exchange.returnGoodsSubtitle') }}</span></div>
            <div v-if="!isReadonly" style="display:flex;gap:8px;align-items:center">
              <template v-if="fd.source_order_id">
                <span style="font-size:13px;color:rgba(29,29,31,0.5)">{{ $t('sale.exchange.importedFromOrder') }}</span>
              </template>
              <template v-else>
                <el-button type="primary" :icon="Plus" size="small" @click="openGoodsPicker('return')">{{ $t('sale.exchange.selectGoods') }}</el-button>
                <el-button :icon="EditPen" size="small" @click="openManualAdd('return')">{{ $t('sale.exchange.addManualRow') }}</el-button>
              </template>
              <span class="goods-count">{{ $t('sale.exchange.goodsCount', { count: fd.returnItems.length }) }}</span>
            </div>
          </div>
          <el-table :data="fd.returnItems" border size="small" style="width:100%" :empty-text="$t('sale.exchange.emptyReturnGoods')">
            <el-table-column type="index" width="45" align="center" />
            <el-table-column :label="$t('sale.exchange.goodsName')" min-width="150">
              <template #default="{ row }"><el-input v-model="row.goods_name" size="small" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.spec')" width="130">
              <template #default="{ row }"><el-input v-model="row.spec" size="small" :placeholder="$t('sale.exchange.specPlaceholder')" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.unit')" width="70" align="center">
              <template #default="{ row }"><el-input v-model="row.unit_name" size="small" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.returnQty')" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.num" :min="0" :precision="2" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.taxUnitPrice')" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.taxTotal')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626;font-weight:500">¥{{ ((row.num||0)*(row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.remark')" min-width="120">
              <template #default="{ row }"><el-input v-model="row.remark" size="small" :placeholder="$t('sale.exchange.remarkPlaceholderShort')" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column v-if="!isReadonly" width="45" align="center" fixed="right">
              <template #default="{ $index }"><el-button type="danger" link :icon="Delete" @click="fd.returnItems.splice($index, 1); calcTotals()" /></template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 换出商品 / 补发商品 -->
        <div class="form-section">
          <div class="sec-header">
            <div class="sec-title">
              {{ isReissue ? $t('sale.exchange.reissueGoodsSection') : $t('sale.exchange.exchangeGoodsSection') }}
              <span class="sec-subtitle">{{ isReissue ? $t('sale.exchange.reissueGoodsSubtitle') : $t('sale.exchange.exchangeGoodsSubtitle') }}</span>
            </div>
            <div v-if="!isReadonly" style="display:flex;gap:8px;align-items:center">
              <el-button size="small" @click="openExchangeOutPicker">{{ fd.exchange_source_order_no ? $t('sale.exchange.reselectSource', { no: fd.exchange_source_order_no }) : $t('sale.exchange.importFromOutOrder') }}</el-button>
              <el-button type="primary" :icon="Plus" size="small" @click="openGoodsPicker('exchange')">{{ $t('sale.exchange.selectGoods') }}</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd('exchange')">{{ $t('sale.exchange.addManualRow') }}</el-button>
              <span class="goods-count">{{ $t('sale.exchange.goodsCount', { count: fd.exchangeItems.length }) }}</span>
            </div>
          </div>
          <el-table :data="fd.exchangeItems" border size="small" style="width:100%" :empty-text="isReissue ? $t('sale.exchange.emptyReissueGoods') : $t('sale.exchange.emptyExchangeGoods')">
            <el-table-column type="index" width="45" align="center" />
            <el-table-column :label="$t('sale.exchange.goodsName')" min-width="150">
              <template #default="{ row }"><el-input v-model="row.goods_name" size="small" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.spec')" width="130">
              <template #default="{ row }"><el-input v-model="row.spec" size="small" :placeholder="$t('sale.exchange.specPlaceholder')" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.unit')" width="70" align="center">
              <template #default="{ row }"><el-input v-model="row.unit_name" size="small" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column :label="isReissue ? $t('sale.exchange.qty') : $t('sale.exchange.exchangeQty')" width="120">
              <template #default="{ row }">
                <el-input-number v-model="row.num" :min="0" :precision="2" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.taxUnitPrice')" width="130">
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" @change="calcTotals" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.taxTotal')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:500">¥{{ ((row.num||0)*(row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.exchange.remark')" min-width="120">
              <template #default="{ row }"><el-input v-model="row.remark" size="small" :placeholder="$t('sale.exchange.remarkPlaceholderShort')" :disabled="isReadonly" /></template>
            </el-table-column>
            <el-table-column v-if="!isReadonly" width="45" align="center" fixed="right">
              <template #default="{ $index }"><el-button type="danger" link :icon="Delete" @click="fd.exchangeItems.splice($index, 1); calcTotals()" /></template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 结算信息 -->
        <div class="form-section settlement-section">
          <div class="sec-title">{{ $t('sale.exchange.settlementInfo') }}</div>
          <div v-if="isReissue" class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.exchange.reissueAmountTotal') }}</span>
              <span class="settle-value" style="color:#8b5cf6">¥{{ fd.exchange_amount.toFixed(2) }}</span>
              <span class="settle-label" style="font-size:11px;color:rgba(29,29,31,0.5);margin-left:8px">{{ $t('sale.exchange.reissueAmountHint') }}</span>
            </div>
          </div>
          <div v-else class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.exchange.returnAmountTotal') }}</span>
              <span class="settle-value" style="color:#dc2626">¥{{ fd.return_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.exchange.exchangeAmountTotal') }}</span>
              <span class="settle-value primary">¥{{ fd.exchange_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.exchange.diffLabel') }}</span>
              <span class="settle-value" :style="{ color: fd.diff_amount > 0 ? '#dc2626' : fd.diff_amount < 0 ? '#16a34a' : '' }">
                {{ fd.diff_amount > 0 ? $t('sale.exchange.diffCustomerPay') : fd.diff_amount < 0 ? $t('sale.exchange.diffRefundCustomer') : '' }}¥{{ Math.abs(fd.diff_amount).toFixed(2) }}
              </span>
            </div>
          </div>
          <el-form :model="fd" label-width="90px" :disabled="isReadonly" style="margin-top:12px">
            <el-row :gutter="16">
              <el-col :span="5">
                <el-form-item :label="$t('sale.exchange.freightAmount')">
                  <el-input-number v-model="fd.freight_amount" :min="0" :precision="2" controls-position="right" style="width:100%" />
                </el-form-item>
              </el-col>
              <el-col :span="5">
                <el-form-item :label="$t('sale.exchange.freightBearer')">
                  <el-select v-model="fd.freight_bearer" style="width:100%">
                    <el-option :label="$t('sale.exchange.bearerSeller')" value="seller" />
                    <el-option :label="$t('sale.exchange.bearerBuyer')" value="buyer" />
                    <el-option :label="$t('sale.exchange.bearerHalf')" value="half" />
                    <el-option :label="$t('sale.exchange.bearerFree')" value="free" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="14">
                <el-form-item :label="$t('sale.exchange.additionalFeesLabel')">
                  <div style="width:100%">
                    <div v-for="(fee, idx) in fd.fee_items" :key="idx" style="display:flex;gap:6px;margin-bottom:4px;align-items:center">
                      <el-select v-model="fee.name" size="small" style="width:120px" filterable allow-create default-first-option :placeholder="$t('sale.exchange.feePlaceholder')" :disabled="isReadonly">
                        <el-option v-for="opt in feeTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                      </el-select>
                      <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:110px" controls-position="right" :disabled="isReadonly" :placeholder="$t('sale.exchange.feeAmountPlaceholder')" />
                      <el-select v-model="fee.bearer" size="small" style="width:100px" :disabled="isReadonly">
                        <el-option :label="$t('sale.exchange.feeBearerUs')" value="buyer" />
                        <el-option :label="$t('sale.exchange.feeBearerThem')" value="seller" />
                      </el-select>
                      <el-input v-model="fee.supplier_name" size="small" style="width:120px" :placeholder="$t('sale.exchange.feePayeePlaceholder')" :disabled="isReadonly" />
                      <el-button v-if="!isReadonly" type="danger" link :icon="Delete" size="small" @click="fd.fee_items.splice(idx, 1)" />
                    </div>
                    <el-button v-if="!isReadonly" type="primary" link size="small" :icon="Plus" style="margin-top:2px"
                      @click="fd.fee_items.push({ name: 'express', amount: 0, bearer: 'buyer', supplier_name: '' })">
                      {{ $t('sale.exchange.addFeeItem') }}
                    </el-button>
                  </div>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" :customer-id="fd.customer_id" @confirm="onGoodsConfirm" />

    <!-- 选择销售出库单弹框 -->
    <el-dialog v-model="saleOutPickerVisible" :title="$t('sale.exchange.saleOutPickerTitle')" width="780px" append-to-body>
      <div style="margin-bottom:10px">
        <el-input v-model="saleOutPickerKeyword" :placeholder="$t('sale.exchange.saleOutSearchPlaceholder')" clearable style="width:260px" />
      </div>
      <el-table :data="filteredSaleOutOrders" v-loading="saleOutPickerLoading" border height="380"
        highlight-current-row @current-change="(row: any) => selectedSaleOut = row">
        <el-table-column prop="order_sn" :label="$t('sale.exchange.colOutOrderNo')" min-width="160" />
        <el-table-column prop="customer_name" :label="$t('sale.exchange.colOutCustomer')" min-width="120" />
        <el-table-column prop="warehouse_name" :label="$t('sale.exchange.colOutWarehouse')" width="110" />
        <el-table-column :label="$t('sale.exchange.colOutAmount')" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.exchange.colOutDate')" width="110">
          <template #default="{ row }">{{ String(row.out_date || '').slice(0, 10) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="saleOutPickerVisible = false">{{ $t('sale.exchange.cancelBtn') }}</el-button>
        <el-button type="primary" :disabled="!selectedSaleOut" @click="confirmSaleOutSelect">{{ $t('sale.exchange.confirmSelect') }}</el-button>
      </template>
    </el-dialog>

    <!-- 换出来源单弹框 -->
    <el-dialog v-model="exchangeOutPickerVisible" :title="$t('sale.exchange.exchangeOutPickerTitle')" width="780px" append-to-body>
      <div style="margin-bottom:10px">
        <el-input v-model="exchangeOutPickerKeyword" :placeholder="$t('sale.exchange.saleOutSearchPlaceholder')" clearable style="width:260px" />
      </div>
      <el-table :data="filteredExchangeOutOrders" v-loading="exchangeOutPickerLoading" border height="380"
        highlight-current-row @current-change="(row: any) => selectedExchangeOut = row">
        <el-table-column prop="order_sn" :label="$t('sale.exchange.colOutOrderNo')" min-width="160" />
        <el-table-column prop="customer_name" :label="$t('sale.exchange.colOutCustomer')" min-width="120" />
        <el-table-column prop="warehouse_name" :label="$t('sale.exchange.colOutWarehouse')" width="110" />
        <el-table-column :label="$t('sale.exchange.colOutAmount')" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.exchange.colOutDate')" width="110">
          <template #default="{ row }">{{ String(row.out_date || '').slice(0, 10) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="exchangeOutPickerVisible = false">{{ $t('sale.exchange.cancelBtn') }}</el-button>
        <el-button type="primary" :disabled="!selectedExchangeOut" @click="confirmExchangeOutSelect">{{ $t('sale.exchange.confirmSelect') }}</el-button>
      </template>
    </el-dialog>

    <!-- 附加费用管理弹窗 -->
    <el-dialog v-model="feeManageVisible" :title="$t('sale.exchange.feeManageTitle')" width="620px" append-to-body>
      <div style="font-size:13px;color:rgba(29,29,31,0.5);margin-bottom:12px">
        {{ feeManageRow?.customer_name }} · {{ feeManageRow?.order_no }}
      </div>
      <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <el-select v-model="fee.name" size="small" style="width:130px" filterable allow-create default-first-option :placeholder="$t('sale.exchange.feePlaceholder')">
          <el-option v-for="opt in feeTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:110px" controls-position="right" :placeholder="$t('sale.exchange.feeAmountPlaceholder')" />
        <el-select v-model="fee.bearer" size="small" style="width:100px">
          <el-option :label="$t('sale.exchange.feeBearerUs')" value="buyer" />
          <el-option :label="$t('sale.exchange.feeBearerThem')" value="seller" />
        </el-select>
        <el-input v-model="fee.supplier_name" size="small" style="width:120px" :placeholder="$t('sale.exchange.feePayeePlaceholder')" />
        <el-button type="danger" link :icon="Delete" size="small" @click="feeManageItems.splice(idx, 1)" />
      </div>
      <el-button type="primary" link size="small" :icon="Plus" style="margin-top:4px"
        @click="feeManageItems.push({ name: 'express', amount: 0, bearer: 'buyer', supplier_name: '' })">
        {{ $t('sale.exchange.addFeeItem') }}
      </el-button>
      <template #footer>
        <el-button @click="feeManageVisible = false">{{ $t('sale.exchange.cancelBtn') }}</el-button>
        <el-button type="primary" :loading="feeManageSaving" @click="submitFeeManage">{{ $t('sale.exchange.feeManageSave') }}</el-button>
      </template>
    </el-dialog>

    <!-- 手动添加商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="manualTarget === 'return' ? $t('sale.exchange.manualAddReturnTitle') : (isReissue ? $t('sale.exchange.manualAddReissueTitle') : $t('sale.exchange.manualAddExchangeTitle'))" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('sale.exchange.manualGoodsName')" required><el-input v-model="manualForm.goods_name" :placeholder="$t('sale.exchange.manualGoodsNamePlaceholder')" /></el-form-item>
        <el-form-item :label="$t('sale.exchange.manualGoodsSn')"><el-input v-model="manualForm.goods_sn" :placeholder="$t('sale.exchange.manualGoodsSnPlaceholder')" /></el-form-item>
        <el-form-item :label="$t('sale.exchange.manualSpec')"><el-input v-model="manualForm.spec" /></el-form-item>
        <el-form-item :label="$t('sale.exchange.manualUnit')"><el-input v-model="manualForm.unit_name" :placeholder="$t('sale.exchange.manualUnitPlaceholder')" /></el-form-item>
        <el-form-item :label="$t('sale.exchange.manualQty')"><el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item :label="$t('sale.exchange.manualPrice')"><el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('sale.exchange.cancelBtn') }}</el-button>
        <el-button type="primary" @click="confirmManualAdd">{{ $t('sale.exchange.manualConfirm') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Delete, ArrowLeft, ArrowDown, EditPen } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import StaffSelect from '@/components/StaffSelect.vue'
import { getSaleExchangeList, createSaleExchange, updateSaleExchange, deleteSaleExchange, auditSaleExchange, getSaleOutList } from '@/api/sale'
import { getSaleCustomerList } from '@/api/sale'
import { getWarehouseList } from '@/api/warehouse'
import { useStockRefreshStore } from '@/stores/stockRefresh'

const { t } = useI18n()

const tableRef = ref<InstanceType<typeof ScTable>>()
const stockRefreshStore = useStockRefreshStore()

function parseItems(v: any): any[] {
  if (Array.isArray(v)) return v
  try { return JSON.parse(v || '[]') } catch { return [] }
}

const feeTypeOptions = computed(() => ([
  { value: 'express', label: t('sale.exchange.feeExpress') },
  { value: 'packing', label: t('sale.exchange.feePacking') },
  { value: 'inspection', label: t('sale.exchange.feeInspection') },
  { value: 'repair', label: t('sale.exchange.feeRepair') },
  { value: 'toll', label: t('sale.exchange.feeToll') },
  { value: 'other', label: t('sale.exchange.feeOther') },
]))

const legacyFeeNameMap: Record<string, string> = {
  '快递/物流': 'express',
  '包装支出': 'packing',
  '检测费': 'inspection',
  '维修费': 'repair',
  '路费/收费站': 'toll',
  '其他支出': 'other',
}

function normalizeFeeName(name: string) {
  const raw = String(name || '').trim()
  return legacyFeeNameMap[raw] || raw
}

function getFeeDisplayName(name: string) {
  const normalized = normalizeFeeName(name)
  return feeTypeOptions.value.find(opt => opt.value === normalized)?.label || name || ''
}

const searchForm = reactive<any>({ order_no: '', customer_name: '', status: '', order_type: '' })

// 后端没有 order_type 字段，类型藏在 remark 里 → 客户端过滤
// 注意：开启类型过滤时分页 total 会不准（属于已知限制，V1 接受）
async function fetchSaleExchangeListWithTypeFilter(params: any) {
  const { order_type, ...rest } = params || {}
  const res: any = await getSaleExchangeList(rest)
  if (!order_type) return res
  const rows = (res?.data?.rows || []).filter((r: any) => parseOrderTypeFromRow(r) === order_type)
  return { ...res, data: { ...res.data, rows, total: rows.length } }
}
const showForm = ref(false)
const isReadonly = ref(false)

const customerOptions = ref<any[]>([])
const warehouseOptions = ref<any[]>([])

async function loadCustomers() {
  const res = await getSaleCustomerList({ list_rows: 500 })
  customerOptions.value = res.data?.rows ?? []
}
async function loadWarehouses() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows ?? []
}
onMounted(() => { loadCustomers(); loadWarehouses() })

interface GoodsItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; unit_name: string; num: number; price: number; remark: string
}
interface FeeItem { name: string; amount: number; bearer: string; supplier_name: string }

type OrderType = 'exchange' | 'reissue'

// 类型存储：单据 remark 里加 [TY:reissue] 标记；缺省 = exchange
function parseOrderTypeFromRow(row: any): OrderType {
  if (row?.order_type === 'reissue') return 'reissue'
  if (/\[TY:reissue\]/.test(String(row?.remark || ''))) return 'reissue'
  return 'exchange'
}
function stripTypeTag(remark: string): string {
  return String(remark || '').replace(/\[TY:(?:reissue|exchange)\]\s*/g, '').trim()
}

function encodeFeeItems(items: FeeItem[]): string {
  return btoa(encodeURIComponent(JSON.stringify(items)))
}
function decodeFeeItems(encoded: string): FeeItem[] {
  try { return JSON.parse(decodeURIComponent(atob(encoded))) } catch { return [] }
}
function parseFeeItemsFromRow(row: any): FeeItem[] {
  try {
    const raw = row.fee_items
    if (raw && (Array.isArray(raw) ? raw.length : raw !== '[]' && raw !== '' && raw !== 'null')) {
      return (Array.isArray(raw) ? raw : JSON.parse(raw)).map((item: any) => ({
        ...item,
        name: normalizeFeeName(item?.name),
      }))
    }
  } catch {}
  const fiMatch = String(row.remark || '').match(/\[FI:([^\]]+)\]/)
  if (fiMatch) return decodeFeeItems(fiMatch[1]).map((item: any) => ({
    ...item,
    name: normalizeFeeName(item?.name),
  }))
  return []
}

const defaultFd = () => ({
  id: 0,
  order_no: '',
  order_type: 'exchange' as OrderType,
  customer_id: null as any,
  customer_name: '',
  warehouse_id: null as any,
  warehouse_name: '',
  admin_name: '',
  exchange_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  reason: '',
  remark: '',
  return_amount: 0,
  exchange_amount: 0,
  diff_amount: 0,
  freight_amount: 0,
  freight_bearer: 'seller' as string,
  expense_amount: 0,
  fee_items: [] as FeeItem[],
  source_order_id: 0,
  source_order_no: '',
  exchange_source_order_id: 0,
  exchange_source_order_no: '',
  returnItems: [] as GoodsItem[],
  exchangeItems: [] as GoodsItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)
const savingAndAuditing = ref(false)

function calcTotals() {
  fd.return_amount = fd.returnItems.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
  fd.exchange_amount = fd.exchangeItems.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
  fd.diff_amount = fd.exchange_amount - fd.return_amount
}

function onCustomerChange(val: any) {
  const c = customerOptions.value.find(x => x.id === val)
  fd.customer_name = c?.name || c?.nickname || ''
}
function onWarehouseChange(val: any) {
  const w = warehouseOptions.value.find(x => x.id === val)
  fd.warehouse_name = w?.name || ''
}

function openCreate(orderType: OrderType = 'exchange') {
  Object.assign(fd, defaultFd())
  fd.order_type = orderType
  isReadonly.value = false
  showForm.value = true
}
function openEdit(row: any, readonly: boolean) {
  Object.assign(fd, defaultFd(), row, {
    order_type: parseOrderTypeFromRow(row),
    returnItems: parseItems(row.return_goods_info),
    exchangeItems: parseItems(row.exchange_goods_info),
    fee_items: parseFeeItemsFromRow(row),
    remark: stripTypeTag(row.remark || ''),  // 显示时去掉 [TY:...] 标记
  })
  calcTotals()
  isReadonly.value = readonly
  showForm.value = true
}

const isReissue = computed(() => fd.order_type === 'reissue')
function backToList() {
  showForm.value = false
  tableRef.value?.reload()
}

async function handleSave(andAudit: boolean) {
  await formRef.value?.validate()
  // 补发单：发出商品列表必填，但退回商品强制清空（不计应收）
  if (isReissue.value) {
    if (!fd.exchangeItems.length) {
      ElMessage.warning(t('sale.exchange.emptyReissueGoods'))
      return
    }
    fd.returnItems = []
  }
  calcTotals()
  if (andAudit) { saving.value = true; savingAndAuditing.value = true }
  else saving.value = true
  try {
    const normalizedFeeItems = fd.fee_items.map(f => ({ ...f, name: normalizeFeeName(f.name) }))
    const expenseTotal = normalizedFeeItems.reduce((s, f) => s + (Number(f.amount) || 0), 0)
    const baseRemark = String(fd.remark || '')
      .replace(/\[FI:[^\]]+\]\s*/g, '')
      .replace(/\[TY:(?:reissue|exchange)\]\s*/g, '')
      .trim()
    const fiTag = normalizedFeeItems.length > 0 ? `[FI:${encodeFeeItems(normalizedFeeItems)}]` : ''
    const tyTag = isReissue.value ? '[TY:reissue]' : ''
    // 补发：return/exchange/diff 三个金额强制 0（不计应收，不进 Profit.vue 销售额）
    const isReissueSave = isReissue.value
    const payload = {
      ...fd,
      return_goods_info: fd.returnItems,
      exchange_goods_info: fd.exchangeItems,
      return_amount: isReissueSave ? 0 : fd.return_amount,
      exchange_amount: isReissueSave ? 0 : fd.exchange_amount,
      diff_amount: isReissueSave ? 0 : fd.diff_amount,
      expense_amount: expenseTotal,
      fee_items: normalizedFeeItems,
      remark: [tyTag, fiTag, baseRemark].filter(Boolean).join(' '),
    }
    delete (payload as any).returnItems
    delete (payload as any).exchangeItems
    delete (payload as any).deleted_at
    delete (payload as any).created_at
    delete (payload as any).updated_at

    let id = fd.id
    if (id) {
      await updateSaleExchange(payload)
    } else {
      delete (payload as any).id  // 不发 id=0，让后端自动生成
      const res = await createSaleExchange(payload)
      id = res.data?.id
      fd.id = id
      fd.order_no = res.data?.order_no || fd.order_no
    }
    if (andAudit && id) {
      await auditSaleExchange(id, 1)
      stockRefreshStore.trigger()
      ElMessage.success(t('sale.exchange.saveAndAuditSuccess'))
      backToList()
    } else {
      ElMessage.success(t('sale.exchange.saveSuccess'))
      if (!fd.id) backToList()
    }
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

async function handleAudit(row: any, status: number) {
  const labels: Record<number, string> = {
    1: t('sale.exchange.auditLabel1'),
    0: t('sale.exchange.auditLabel0'),
    2: t('sale.exchange.auditLabel2'),
  }
  await ElMessageBox.confirm(t('sale.exchange.auditConfirm', { action: labels[status] }), t('sale.exchange.promptTitle'), { type: 'warning' })
  await auditSaleExchange(row.id, status)
  if (status === 1 || status === 0) stockRefreshStore.trigger()
  ElMessage.success(t('sale.exchange.auditSuccess', { action: labels[status] }))
  tableRef.value?.reload()
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('sale.exchange.deleteConfirm'), t('sale.exchange.promptTitle'), { type: 'warning' })
  await deleteSaleExchange(id)
  ElMessage.success(t('sale.exchange.deleteSuccess'))
  tableRef.value?.reload()
}

// ── 关联销售出库单 ────────────────────────────────────────────────────────────
const saleOutPickerVisible = ref(false)
const saleOutPickerLoading = ref(false)
const saleOutList = ref<any[]>([])
const saleOutPickerKeyword = ref('')
const selectedSaleOut = ref<any>(null)

const filteredSaleOutOrders = computed(() => {
  const kw = saleOutPickerKeyword.value
  if (!kw) return saleOutList.value
  return saleOutList.value.filter(o => o.order_sn?.includes(kw) || o.order_no?.includes(kw) || o.customer_name?.includes(kw))
})

async function openSaleOutPicker() {
  saleOutPickerKeyword.value = ''
  selectedSaleOut.value = null
  saleOutPickerVisible.value = true
  saleOutPickerLoading.value = true
  try {
    const res = await getSaleOutList({ status: 1, list_rows: 500, ...(fd.customer_id ? { customer_id: fd.customer_id } : {}) })
    saleOutList.value = res.data?.rows ?? []
  } catch { saleOutList.value = [] }
  finally { saleOutPickerLoading.value = false }
}

function confirmSaleOutSelect() {
  const order = selectedSaleOut.value
  if (!order) return
  fd.source_order_id = order.id
  fd.source_order_no = order.order_sn || order.order_no || ''
  fd.customer_id = order.customer_id
  fd.customer_name = order.customer_name || ''
  fd.warehouse_id = order.warehouse_id
  fd.warehouse_name = order.warehouse_name || ''
  const goods = parseItems(order.goods_info)
  const mapped = goods.map((g: any) => ({
    goods_id: g.goods_id || 0,
    goods_name: g.goods_name || '',
    goods_sn: g.goods_sn || '',
    spec: g.spec || '',
    unit_name: g.unit_name || '',
    num: g.num || 0,
    price: Number(g.price || 0),
    cost_price: Number(g.cost_price || 0),
    remark: '',
  }))
  // 补发：导入到补发商品列表（用户自行调整数量为实际补发的量）
  // 换货：导入到退回商品列表
  if (isReissue.value) fd.exchangeItems = mapped
  else fd.returnItems = mapped
  calcTotals()
  saleOutPickerVisible.value = false
}

// ── 换出来源单选择 ────────────────────────────────────────────────────────────
const exchangeOutPickerVisible = ref(false)
const exchangeOutPickerLoading = ref(false)
const exchangeOutList = ref<any[]>([])
const exchangeOutPickerKeyword = ref('')
const selectedExchangeOut = ref<any>(null)

const filteredExchangeOutOrders = computed(() => {
  const kw = exchangeOutPickerKeyword.value
  if (!kw) return exchangeOutList.value
  return exchangeOutList.value.filter(o => o.order_sn?.includes(kw) || o.order_no?.includes(kw) || o.customer_name?.includes(kw))
})

async function openExchangeOutPicker() {
  exchangeOutPickerKeyword.value = ''
  selectedExchangeOut.value = null
  exchangeOutPickerVisible.value = true
  exchangeOutPickerLoading.value = true
  try {
    const res = await getSaleOutList({ status: 1, list_rows: 500, ...(fd.customer_id ? { customer_id: fd.customer_id } : {}) })
    exchangeOutList.value = res.data?.rows ?? []
  } catch { exchangeOutList.value = [] }
  finally { exchangeOutPickerLoading.value = false }
}

function confirmExchangeOutSelect() {
  const order = selectedExchangeOut.value
  if (!order) return
  fd.exchange_source_order_id = order.id
  fd.exchange_source_order_no = order.order_sn || order.order_no || ''
  const goods = parseItems(order.goods_info)
  fd.exchangeItems = goods.map((g: any) => ({
    goods_id: g.goods_id || 0,
    goods_name: g.goods_name || '',
    goods_sn: g.goods_sn || '',
    spec: g.spec || '',
    unit_name: g.unit_name || '',
    num: g.num || 0,
    price: Number(g.price || 0),
    cost_price: Number(g.cost_price || 0),
    remark: '',
  }))
  calcTotals()
  exchangeOutPickerVisible.value = false
}

// ── 附加费用管理 ──────────────────────────────────────────────────────────────
const feeManageVisible = ref(false)
const feeManageSaving = ref(false)
const feeManageRow = ref<any>(null)
const feeManageItems = ref<FeeItem[]>([])

function openFeeManageDialog(row: any) {
  feeManageRow.value = row
  feeManageItems.value = JSON.parse(JSON.stringify(parseFeeItemsFromRow(row)))
  feeManageVisible.value = true
}

async function submitFeeManage() {
  const row = feeManageRow.value
  if (!row?.id) return
  const items = feeManageItems.value
    .map(f => ({ ...f, name: normalizeFeeName(f.name) }))
    .filter(f => f.name && Number(f.amount) > 0)
  const baseRemark = String(row.remark || '').replace(/\[FI:[^\]]+\]\s*/g, '').trim()
  const fiTag = items.length > 0 ? `[FI:${encodeFeeItems(items)}]` : ''
  const newRemark = [fiTag, baseRemark].filter(Boolean).join(' ')
  const expenseTotal = items.reduce((s, f) => s + (Number(f.amount) || 0), 0)
  feeManageSaving.value = true
  try {
    await updateSaleExchange({ id: row.id, fee_items: items, remark: newRemark, expense_amount: expenseTotal })
    ElMessage.success(t('sale.exchange.feeManageSaveSuccess'))
    feeManageVisible.value = false
    tableRef.value?.reload()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.exchange.feeManageSaveFail'))
  } finally {
    feeManageSaving.value = false
  }
}

// ── 商品选择 ──────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<any>()
const currentPickerTarget = ref<'return' | 'exchange'>('return')

function openGoodsPicker(target: 'return' | 'exchange') {
  currentPickerTarget.value = target
  goodsSelectRef.value?.open()
}
function onGoodsConfirm(goods: any[]) {
  const items = goods.map(g => ({
    goods_id: g.id || g.goods_id,
    goods_name: g.name || g.goods_name,
    goods_sn: g.goods_sn || '',
    spec: g.spec || '',
    unit_name: g.unit_name || '',
    num: 1,
    price: Number(g.sell_price || g.sale_price || 0),
    remark: '',
  }))
  if (currentPickerTarget.value === 'return') {
    fd.returnItems.push(...items)
  } else {
    fd.exchangeItems.push(...items)
  }
  calcTotals()
}

// ── 手动添加 ──────────────────────────────────────────────────────────────────
const manualAddVisible = ref(false)
const manualTarget = ref<'return' | 'exchange'>('return')
const manualForm = reactive({ goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, price: 0 })

function openManualAdd(target: 'return' | 'exchange') {
  manualTarget.value = target
  Object.assign(manualForm, { goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, price: 0 })
  manualAddVisible.value = true
}
function confirmManualAdd() {
  if (!manualForm.goods_name) { ElMessage.warning(t('sale.exchange.manualGoodsNameRequired')); return }
  const item = { goods_id: 0, ...manualForm, remark: '' }
  if (manualTarget.value === 'return') fd.returnItems.push(item)
  else fd.exchangeItems.push(item)
  calcTotals()
  manualAddVisible.value = false
}
</script>

<style scoped>
.saleexchange-page { padding: 0; }
.form-page { display: flex; flex-direction: column; height: 100%; }
.form-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 20px; background: #fff; border-bottom: 1px solid #e5e5e5;
  position: sticky; top: 0; z-index: 10;
}
.form-title { font-size: 16px; font-weight: 600; color: #1d1d1f; }
.form-actions { display: flex; gap: 8px; }
.form-body { flex: 1; overflow-y: auto; padding: 16px 20px; display: flex; flex-direction: column; gap: 16px; }
.form-section { background: #fff; border-radius: 10px; padding: 16px; border: 1px solid #e5e5e5; }
.sec-title { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 14px; }
.sec-subtitle { font-size: 12px; font-weight: 400; color: rgba(29,29,31,0.5); }
.sec-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.sec-header .sec-title { margin-bottom: 0; }
.goods-count { font-size: 13px; color: rgba(29,29,31,0.5); }
.settlement-section .settlement-grid { display: flex; gap: 40px; flex-wrap: wrap; margin-bottom: 12px; }
.settle-item { display: flex; flex-direction: column; gap: 4px; }
.settle-label { font-size: 12px; color: rgba(29,29,31,0.5); }
.settle-value { font-size: 20px; font-weight: 600; color: #1d1d1f; }
.settle-value.primary { color: #0071e3; }
.expand-detail { padding: 12px 20px; background: #f9f9f9; }
.expand-section { }
.expand-title { font-size: 13px; font-weight: 600; margin-bottom: 8px; color: #1d1d1f; }
.expand-table { width: 100%; }
</style>
