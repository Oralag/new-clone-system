<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="filteredApi"
          :batch-del-api="batchDelRetailOrders"
          :export-file-name="$t('retail.retailOrder.exportFileName')" :params="searchForm" @reset="onSearchReset"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''"
          :export-columns="{ order_no: $t('retail.retailOrder.colOrderNo'), member_name: $t('retail.retailOrder.colMember'), store_name: $t('retail.retailOrder.colStore'), order_date: $t('retail.retailOrder.colDate'), total_amount: $t('retail.retailOrder.colGoodsTotal'), discount_amount: $t('retail.retailOrder.colDiscount'), pay_amount: $t('retail.retailOrder.colPaid'), pay_method: $t('retail.retailOrder.colPayMethod'), status: $t('retail.retailOrder.colStatus') }">
        <template #search>
          <el-input v-model="searchForm.order_no" :placeholder="$t('retail.retailOrder.searchOrderNo')" clearable style="width:160px" />
          <el-input v-model="searchForm.goods_name" :placeholder="$t('retail.retailOrder.searchGoodsName')" clearable style="width:140px" />
          <el-input v-model="searchForm.member_name" :placeholder="$t('retail.retailOrder.searchMemberName')" clearable style="width:140px" />
          <el-select v-model="searchForm.store_id" :placeholder="$t('retail.retailOrder.searchStore')" clearable style="width:130px">
            <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('retail.retailOrder.searchReconcile')">
            <el-option :label="$t('retail.retailOrder.searchUnreconciled')" value="unreconciled" />
          </el-select>
          <el-date-picker :key="datePickerKey" v-model="dateRange" type="daterange" :range-separator="$t('retail.retailOrder.searchDateSep')"
            :start-placeholder="$t('retail.retailOrder.searchDateStart')" :end-placeholder="$t('retail.retailOrder.searchDateEnd')" value-format="YYYY-MM-DD"
            style="width:240px" unlink-panels :shortcuts="dateShortcuts" @change="onDateChange" />
          <el-input v-model="searchForm.min_amount" :placeholder="$t('retail.retailOrder.searchMinAmount')" clearable style="width:110px" type="number" />
          <span style="color:rgba(29,29,31,0.35);font-size:13px">—</span>
          <el-input v-model="searchForm.max_amount" :placeholder="$t('retail.retailOrder.searchMaxAmount')" clearable style="width:110px" type="number" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('retail.retailOrder.addOrder') }}</el-button>
        </template>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 48px 12px">
              <el-table :data="parseGoods(row.goods_info)" size="small" border style="width:100%">
                <el-table-column prop="goods_name" :label="$t('retail.retailOrder.colGoodsName')" min-width="140" />
                <el-table-column prop="unit_name" :label="$t('retail.retailOrder.colUnit')" width="70" align="center" />
                <el-table-column prop="num" :label="$t('retail.retailOrder.colQty')" width="80" align="right" />
                <el-table-column :label="$t('retail.retailOrder.colUnitPrice')" width="100" align="right">
                  <template #default="{ row: item }">¥{{ Number(item.price).toFixed(2) }}</template>
                </el-table-column>
                <el-table-column :label="$t('retail.retailOrder.colSubtotal')" width="100" align="right">
                  <template #default="{ row: item }">
                    <span style="color:#0071e3">¥{{ (Number(item.num) * Number(item.price)).toFixed(2) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" :label="$t('retail.retailOrder.colIndex')" width="60" align="center" />
        <el-table-column :label="$t('retail.retailOrder.colOrderNo')" min-width="160">
          <template #default="{ row }">{{ row.order_sn || `LS${(row.order_date || row.created_at || '').slice(0, 10).replace(/-/g, '')}${String(row.id).padStart(3,'0')}` }}</template>
        </el-table-column>
        <el-table-column prop="member_name" :label="$t('retail.retailOrder.colMember')" min-width="100" />
        <el-table-column prop="store_name" :label="$t('retail.retailOrder.colStore')" min-width="100" />
        <el-table-column prop="total_amount" :label="$t('retail.retailOrder.colGoodsTotal')" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="discount_amount" :label="$t('retail.retailOrder.colDiscount')" width="100" align="right">
          <template #default="{ row }">
            <span :style="Number(row.discount_amount) > 0 ? 'color:#67c23a' : Number(row.discount_amount) < 0 ? 'color:#f56c6c' : ''">
              {{ Number(row.discount_amount) > 0 ? '-' : Number(row.discount_amount) < 0 ? '+' : '' }}¥{{ Math.abs(Number(row.discount_amount || 0)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="pay_amount" :label="$t('retail.retailOrder.colPaid')" width="110" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ Number(row.pay_amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pay_method" :label="$t('retail.retailOrder.colPayMethod')" width="100" align="center" />
        <el-table-column :label="$t('retail.retailOrder.colDate')" width="160">
          <template #default="{ row }">{{ fmtOrderDate(row) }}</template>
        </el-table-column>
        <el-table-column :label="$t('retail.retailOrder.colStatus')" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : 'success'" size="small">
              {{ row.status === 0 ? $t('retail.retailOrder.statusPending') : $t('retail.retailOrder.statusAudited') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('retail.retailOrder.colFees')" width="220" align="right">
          <template #default="{ row }">
            <template v-if="getFeeItemsForRow(row).length > 0">
              <div v-for="(fee, idx) in getFeeItemsForRow(row)" :key="idx" style="display:flex;align-items:center;justify-content:flex-end;gap:4px;line-height:1.6">
                <span style="font-size:11px;color:rgba(29,29,31,0.5)">{{ fee.name }}</span>
                <span style="color:#8b5cf6;font-weight:600">¥{{ Number(fee.amount).toFixed(2) }}</span>
                <el-tag :type="getFeeItemPayStatus(row, idx).type" size="small">{{ getFeeItemPayStatus(row, idx).label }}</el-tag>
                <el-button v-if="getFeeItemPayStatus(row, idx).status === 'pending'" type="warning" link size="small" style="font-size:11px;padding:0" @click="openFeePayDialog(row, idx)">{{ $t('retail.retailOrder.feeManagePayBtn') }}</el-button>
              </div>
            </template>
            <span v-else style="color:rgba(29,29,31,0.2)">—</span>
            <div v-if="row.status === 1 && getFeeItemsForRow(row).length === 0" style="margin-top:2px;text-align:right">
              <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">{{ $t('retail.retailOrder.supplementFee') }}</el-button>
            </div>
            <div v-if="row.status === 1 && getFeeItemsForRow(row).length > 0" style="margin-top:2px;text-align:right">
              <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">{{ $t('retail.retailOrder.manageFee') }}</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('retail.retailOrder.colOperation')" width="220" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('retail.retailOrder.audit') }}</el-button>
            <el-button v-else type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('retail.retailOrder.unaudit') }}</el-button>
            <el-button v-if="row.status === 0" type="success" link size="small" @click="openForm(row)">{{ $t('retail.retailOrder.edit') }}</el-button>
            <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('retail.retailOrder.reconciled') : $t('retail.retailOrder.reconcile') }}</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">{{ $t('retail.retailOrder.delete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
      <div v-if="filteredRows.length" style="display:flex;gap:24px;padding:10px 4px 0;font-size:13px;color:#666;border-top:1px solid #f0f0f0;margin-top:2px">
        <span>{{ $t('retail.retailOrder.summaryCount', { count: summary.count }) }}</span>
        <span>{{ $t('retail.retailOrder.summaryGoodsTotal') }}：<b>¥{{ summary.total_amount.toFixed(2) }}</b></span>
        <span>{{ $t('retail.retailOrder.summaryDiscount') }}：<b :style="summary.discount_amount > 0 ? 'color:#67c23a' : summary.discount_amount < 0 ? 'color:#f56c6c' : ''">{{ summary.discount_amount > 0 ? '-' : summary.discount_amount < 0 ? '+' : '' }}¥{{ Math.abs(summary.discount_amount).toFixed(2) }}</b></span>
        <span>{{ $t('retail.retailOrder.summaryPaid') }}：<b style="color:#0071e3;font-size:14px">¥{{ summary.pay_amount.toFixed(2) }}</b></span>
      </div>
    </el-card>

    <!-- Add / Edit order drawer -->
    <el-drawer v-model="drawerVisible" :title="editId ? $t('retail.retailOrder.drawerEditTitle') : $t('retail.retailOrder.drawerAddTitle')" size="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px" style="padding:0 4px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formStore')" prop="store_id">
              <el-select v-model="form.store_id" :placeholder="$t('retail.retailOrder.formStorePlaceholder')" clearable filterable style="width:100%"
                @change="onStoreChange">
                <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formMember')" prop="member_id">
              <el-select v-model="form.member_id" :placeholder="$t('retail.retailOrder.formMemberPlaceholder')" clearable filterable style="width:100%"
                @change="onMemberChange">
                <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} ${m.mobile}`" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formOrderDate')" prop="order_date">
              <el-date-picker v-model="form.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formPayMethod')" prop="pay_method">
              <el-select v-model="form.pay_method" style="width:100%">
                <el-option :label="$t('retail.retailOrder.payMethodCash')" value="cash" />
                <el-option :label="$t('retail.retailOrder.payMethodWechat')" value="wechat" />
                <el-option :label="$t('retail.retailOrder.payMethodAlipay')" value="alipay" />
                <el-option :label="$t('retail.retailOrder.payMethodBalance')" value="balance" />
                <el-option :label="$t('retail.retailOrder.payMethodCard')" value="card" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item :label="$t('retail.retailOrder.formRemark')">
              <el-input v-model="form.remark" :placeholder="$t('retail.retailOrder.formRemarkPlaceholder')" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- Goods section -->
        <div style="margin:8px 0 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600;font-size:13px">{{ $t('retail.retailOrder.formGoodsSection') }}</span>
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('retail.retailOrder.formAddGoods') }}</el-button>
        </div>
        <el-table :data="form.items" border size="small" :empty-text="$t('retail.retailOrder.formEmptyGoods')">
          <el-table-column prop="goods_name" :label="$t('retail.retailOrder.colGoodsName')" min-width="130" />
          <el-table-column prop="unit_name" :label="$t('retail.retailOrder.colUnit')" width="70" align="center" />
          <el-table-column :label="$t('retail.retailOrder.colQty')" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :min="1" size="small" controls-position="right"
                style="width:90px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('retail.retailOrder.colUnitPrice')" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" size="small"
                controls-position="right" style="width:100px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column :label="$t('retail.retailOrder.colSubtotal')" width="90" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3">¥{{ (row.num * row.price).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column width="50" align="center">
            <template #default="{ $index }">
              <el-button type="danger" link :icon="Delete" @click="form.items.splice($index,1); calcFormTotal()" />
            </template>
          </el-table-column>
        </el-table>

        <div style="display:flex;justify-content:flex-end;gap:20px;padding:10px 4px;font-size:13px">
          <span>{{ $t('retail.retailOrder.formTotal') }}：<b>¥{{ form.total_amount.toFixed(2) }}</b></span>
          <span>{{ $t('retail.retailOrder.formDiscount') }}：<el-input-number v-model="form.discount_amount" :precision="2" size="small"
            controls-position="right" style="width:100px" @change="calcFormTotal" /></span>
          <span>{{ $t('retail.retailOrder.formPaid') }}：<b style="color:#dc2626;font-size:15px">¥{{ form.pay_amount.toFixed(2) }}</b></span>
        </div>

        <!-- Additional fees -->
        <div style="margin-top:4px;border-top:1px dashed #e5e7eb;padding-top:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ $t('retail.retailOrder.formFeeSection') }}</span>
            <el-button type="primary" link size="small" :icon="Plus" @click="form.fee_items.push({ name: '运费', amount: 0, bearer: 'buyer' })">{{ $t('retail.retailOrder.formAddFee') }}</el-button>
          </div>
          <div v-for="(fee, idx) in form.fee_items" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <el-select v-model="fee.name" size="small" style="width:120px" filterable allow-create default-first-option :placeholder="$t('retail.retailOrder.formFeeTypePlaceholder')">
              <el-option :label="$t('retail.retailOrder.formFeeShipping')" value="运费" />
              <el-option :label="$t('retail.retailOrder.formFeeHandling')" value="装卸费" />
              <el-option :label="$t('retail.retailOrder.formFeeInspection')" value="检测费" />
              <el-option :label="$t('retail.retailOrder.formFeePackaging')" value="包装费" />
              <el-option :label="$t('retail.retailOrder.formFeeStorage')" value="仓储费" />
              <el-option :label="$t('retail.retailOrder.formFeeOther')" value="其他费用" />
            </el-select>
            <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:110px" :placeholder="$t('retail.retailOrder.formFeeAmountPlaceholder')" />
            <span style="font-size:12px;color:rgba(29,29,31,0.5);width:70px">{{ $t('retail.retailOrder.formFeeOurBear') }}</span>
            <el-button type="danger" link :icon="Delete" size="small" @click="form.fee_items.splice(idx, 1)" />
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">{{ $t('retail.retailOrder.cancel') }}</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('retail.retailOrder.save') }}</el-button>
      </template>
    </el-drawer>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- Additional fees management dialog -->
    <el-dialog v-model="feeManageVisible" :title="feeManageRow?.status === 1 ? $t('retail.retailOrder.feeManageTitle') : $t('retail.retailOrder.feeManageTitle2')" width="620px" append-to-body>
      <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5)">
        {{ feeManageRow?.order_sn || `LS${(feeManageRow?.order_date||'').slice(0,10).replace(/-/g,'')}${String(feeManageRow?.id||'').padStart(3,'0')}` }}
        <template v-if="feeManageRow?.member_name"> · {{ feeManageRow?.member_name }}</template>
      </div>

      <!-- Fee list (all editable; paid fees cannot be deleted) -->
      <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <el-select v-model="fee.name" size="small" style="width:130px" filterable allow-create default-first-option :placeholder="$t('retail.retailOrder.formFeeTypePlaceholder')"
          :disabled="getFeeItemPayStatus(feeManageRow, idx).status === 'paid'">
          <el-option :label="$t('retail.retailOrder.formFeeShipping')" value="运费" />
          <el-option :label="$t('retail.retailOrder.formFeeHandling')" value="装卸费" />
          <el-option :label="$t('retail.retailOrder.formFeeInspection')" value="检测费" />
          <el-option :label="$t('retail.retailOrder.formFeePackaging')" value="包装费" />
          <el-option :label="$t('retail.retailOrder.formFeeStorage')" value="仓储费" />
          <el-option :label="$t('retail.retailOrder.formFeeOther')" value="其他费用" />
        </el-select>
        <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:120px" :placeholder="$t('retail.retailOrder.formFeeAmountPlaceholder')"
          :disabled="getFeeItemPayStatus(feeManageRow, idx).status === 'paid'" />
        <span style="font-size:12px;color:rgba(29,29,31,0.5);width:55px">{{ $t('retail.retailOrder.formFeeOurBear') }}</span>
        <template v-if="feeManageRow?.status === 1">
          <el-tag :type="getFeeItemPayStatus(feeManageRow, idx).type" size="small">{{ getFeeItemPayStatus(feeManageRow, idx).label }}</el-tag>
          <el-button v-if="getFeeItemPayStatus(feeManageRow, idx).status === 'pending'" type="warning" link size="small" @click="openFeeManagePay(idx)">{{ $t('retail.retailOrder.feeManagePayBtn') }}</el-button>
        </template>
        <el-button
          v-if="getFeeItemPayStatus(feeManageRow, idx).status !== 'paid'"
          type="danger" link :icon="Delete" size="small"
          @click="removeFeeManageItem(idx)"
        />
      </div>
      <el-button type="primary" link size="small" :icon="Plus" @click="feeManageItems.push({ name: '运费', amount: 0, bearer: 'buyer' })">
        {{ $t('retail.retailOrder.formAddFee') }}
      </el-button>
      <div v-if="feeManagePayIndex >= 0" style="margin-top:12px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e5e7eb">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px;font-weight:600">
          <span>{{ $t('retail.retailOrder.feePayTitle', { name: feePayForm.feeName }) }}</span>
          <el-button link size="small" @click="feeManagePayIndex = -1">{{ $t('retail.retailOrder.feeManageCollapseBtn') }}</el-button>
        </div>
        <el-form :model="feePayForm" label-width="90px">
          <el-form-item :label="$t('retail.retailOrder.feePayAmount')">
            <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
          </el-form-item>
          <el-form-item :label="$t('retail.retailOrder.feePayAccount')">
            <el-select v-model="feePayForm.fund_id" :placeholder="$t('retail.retailOrder.feePayAccountPlaceholder')" filterable style="width:100%" @change="onFeePayFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('retail.retailOrder.feePayContact')">
            <el-input v-model="feePayForm.contact_name" :placeholder="$t('retail.retailOrder.feePayContactPlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="$t('retail.retailOrder.feePayDate')">
            <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item :label="$t('retail.retailOrder.feePayRemark')">
            <el-input v-model="feePayForm.remark" :placeholder="$t('retail.retailOrder.feePayRemarkPlaceholder')" />
          </el-form-item>
        </el-form>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
          <el-button @click="feeManagePayIndex = -1">{{ $t('retail.retailOrder.feePayCancel') }}</el-button>
          <el-button type="primary" :loading="feePaySubmitting" @click="submitFeeManagePay">{{ $t('retail.retailOrder.feePayConfirm') }}</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="feeManageVisible = false">{{ $t('retail.retailOrder.feeManageCloseBtn') }}</el-button>
        <el-button type="primary" :loading="feeManageSaving" @click="submitFeeManage">{{ $t('retail.retailOrder.feeManageSaveBtn') }}</el-button>
      </template>
    </el-dialog>

    <!-- Fee payment dialog -->
    <el-dialog v-model="feePayVisible" :title="$t('retail.retailOrder.feePayTitle', { name: feePayForm.feeName })" width="420px" append-to-body>
      <el-form :model="feePayForm" label-width="90px">
        <el-form-item :label="$t('retail.retailOrder.feePayRetailOrder')">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ feePayForm.orderSn }}</span>
        </el-form-item>
        <el-form-item :label="$t('retail.retailOrder.feePayType')">
          <span style="font-weight:600">{{ feePayForm.feeName }}</span>
        </el-form-item>
        <el-form-item :label="$t('retail.retailOrder.feePayAmount')">
          <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item :label="$t('retail.retailOrder.feePayAccount')">
          <el-select v-model="feePayForm.fund_id" :placeholder="$t('retail.retailOrder.feePayAccountPlaceholder')" filterable style="width:100%" @change="onFeePayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('retail.retailOrder.feePayContact')">
          <el-input v-model="feePayForm.contact_name" :placeholder="$t('retail.retailOrder.feePayContactPlaceholder')" clearable />
        </el-form-item>
        <el-form-item :label="$t('retail.retailOrder.feePayDate')">
          <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('retail.retailOrder.feePayRemark')">
          <el-input v-model="feePayForm.remark" :placeholder="$t('retail.retailOrder.feePayRemarkPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feePayVisible = false">{{ $t('retail.retailOrder.cancel') }}</el-button>
        <el-button type="primary" :loading="feePaySubmitting" @click="submitFeePay">{{ $t('retail.retailOrder.feePayConfirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getRetailOrderList, createRetailOrder, updateRetailOrder, deleteRetailOrder, getMemberList, getStoreList } from '@/api/retail'
import { getFundList, getPayReceiptList, createPayReceipt, deletePayReceipt } from '@/api/finance'
import http from '@/api/http'
import { RETAIL_FUND_NAME } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect, deleteRetailStockFlows } from '@/utils/stockEffect'
import { distributeRetailItems, normalizeRetailSettlement } from '@/utils/retailPricing'

const { t } = useI18n()

function fmtDt(val: string) {
  if (!val) return '-'
  const d = new Date(val)
  if (isNaN(d.getTime())) return val.slice(0, 10)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// 日期取 order_date（用户设定的业务日期），时间取 created_at（真实录入时间）
function fmtOrderDate(row: any) {
  const pad = (n: number) => String(n).padStart(2, '0')
  const dateStr = (row.order_date || row.created_at || '')
  const date = dateStr.slice(0, 10) // YYYY-MM-DD，直接用字符串，不做时区转换
  if (!date || date === '0000') return '-'
  const ts = row.created_at ? new Date(row.created_at) : null
  if (!ts || isNaN(ts.getTime())) return date
  return `${date} ${pad(ts.getHours())}:${pad(ts.getMinutes())}`
}

const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, ids: reconciledIds } = useReconcile('reconcile_retail_order', tableRef)
const stockRefreshStore = useStockRefreshStore()
// date filter stored locally — backend ignores date params, handled in filteredApi
const searchForm = reactive<any>({ order_no: '', goods_name: '', member_name: '', store_id: '', start_date: '', end_date: '', reconcile_filter: '', min_amount: '', max_amount: '' })
const dateRange = ref<any>([])
const dateShortcuts = computed(() => [
  { text: t('retail.retailOrder.shortcutLastMonth'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 1); return [s, e] } },
  { text: t('retail.retailOrder.shortcutLast3Months'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 3); return [s, e] } },
  { text: t('retail.retailOrder.shortcutLast6Months'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 6); return [s, e] } },
  { text: t('retail.retailOrder.shortcutThisYear'), value: () => { const e = new Date(); const s = new Date(e.getFullYear(), 0, 1); return [s, e] } },
  { text: t('retail.retailOrder.shortcutLastYear'), value: () => { const y = new Date().getFullYear() - 1; return [new Date(y, 0, 1), new Date(y, 11, 31)] } },
])
const datePickerKey = ref(0)

// all rows after date filtering — used for summary totals
const filteredRows = ref<any[]>([])

const filteredApi = async (params: any) => {
  const { page: reqPage, list_rows: reqSize, ...restParams } = params
  const res = await getRetailOrderList({ ...restParams, page: 1, list_rows: 10000 })
  const allRows: any[] = res.data?.rows ?? []
  const s = searchForm.start_date
  const e = searchForm.end_date
  const filtered = (s || e)
    ? allRows.filter((row: any) => {
        const date = (row.order_date || row.created_at || '').slice(0, 10)
        if (s && date < s) return false
        if (e && date > e) return false
        return true
      })
    : allRows
  filtered.sort((a: any, b: any) => {
    const da = (a.order_date || a.created_at || '')
    const db = (b.order_date || b.created_at || '')
    if (db > da) return 1
    if (db < da) return -1
    return (b.id || 0) - (a.id || 0)
  })
  let result = filtered
  if (searchForm.goods_name) {
    const kw = searchForm.goods_name.trim().toLowerCase()
    result = result.filter((row: any) => {
      const items = parseGoods(row.goods_info)
      return items.some((i: any) => (i.goods_name || i.name || '').toLowerCase().includes(kw))
    })
  }
  if (searchForm.order_no) {
    const kw = searchForm.order_no.trim().toLowerCase()
    result = result.filter((row: any) => {
      const sn = (row.order_sn || `LS${(row.order_date || row.created_at || '').slice(0, 10).replace(/-/g, '')}${String(row.id).padStart(3, '0')}`).toLowerCase()
      return sn.includes(kw)
    })
  }
  if (searchForm.member_name) {
    const kw = searchForm.member_name.trim().toLowerCase()
    result = result.filter((row: any) => (row.member_name || '').toLowerCase().includes(kw))
  }
  if (searchForm.store_id) {
    result = result.filter((row: any) => Number(row.store_id) === Number(searchForm.store_id))
  }
  if (searchForm.reconcile_filter === 'unreconciled') {
    result = result.filter((row: any) => !reconciledIds.value.has(Number(row.id)))
  }
  if (searchForm.min_amount !== '' && searchForm.min_amount !== null) {
    result = result.filter((row: any) => Number(row.pay_amount) >= Number(searchForm.min_amount))
  }
  if (searchForm.max_amount !== '' && searchForm.max_amount !== null) {
    result = result.filter((row: any) => Number(row.pay_amount) <= Number(searchForm.max_amount))
  }
  filteredRows.value = result
  const page = Number(reqPage) || 1
  const size = Number(reqSize) || 20
  return { data: { rows: result.slice((page - 1) * size, page * size), total: result.length } }
}

const summary = computed(() => {
  const rows = filteredRows.value.filter((r: any) => Number(r.status) === 1)
  return {
    count: rows.length,
    total_amount: rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0),
    discount_amount: rows.reduce((s: number, r: any) => s + Number(r.discount_amount || 0), 0),
    pay_amount: rows.reduce((s: number, r: any) => s + Number(r.pay_amount || 0), 0),
  }
})

function onDateChange(val: any) {
  if (val && val.length === 2) { searchForm.start_date = val[0]; searchForm.end_date = val[1] }
  else { searchForm.start_date = ''; searchForm.end_date = '' }
  tableRef.value?.refresh()
}

function onSearchReset() {
  dateRange.value = []
  datePickerKey.value++
}

// 门店列表
const storeList = ref<any[]>([])
// 会员列表
const memberList = ref<any[]>([])

onMounted(async () => {
  const [sr, mr] = await Promise.allSettled([
    getStoreList({ list_rows: 500 }),
    getMemberList({ list_rows: 500 }),
  ])
  if (sr.status === 'fulfilled') storeList.value = sr.value.data?.rows ?? []
  if (mr.status === 'fulfilled') memberList.value = mr.value.data?.rows ?? []
  loadFunds()
  loadFeePayMap()
})

// 表单
const drawerVisible = ref(false)
const saving = ref(false)
const editId = ref<number | null>(null)
const formRef = ref()
const form = reactive({
  store_id: null as any, store_name: '',
  member_id: null as any, member_name: '',
  order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  pay_method: 'cash', remark: '',
  items: [] as any[],
  total_amount: 0, discount_amount: 0, pay_amount: 0,
  fee_items: [] as { name: string; amount: number; bearer: string }[],
})

function openForm(row?: any) {
  editId.value = row?.id ?? null
  if (row) {
    // 编辑模式：回填已有数据，用 parseGoods 兼容字符串和数组两种格式
    const rawItems = parseGoods(row.goods_info)
    let parsedFeeItems: any[] = []
    try { parsedFeeItems = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { parsedFeeItems = [] }
    Object.assign(form, {
      store_id: row.store_id || null,
      store_name: row.store_name || '',
      member_id: row.member_id || null,
      member_name: row.member_name || '',
      order_date: row.order_date ? String(row.order_date).slice(0, 10) : new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
      pay_method: row.pay_type || row.pay_method || 'cash',
      remark: row.remark || '',
      items: rawItems.map((i: any) => ({
        goods_id: i.goods_id ?? i.id,
        goods_name: i.goods_name || i.name || '',
        goods_sn: i.goods_sn || '',
        unit_name: i.unit_name || '',
        cost_price: Number(i.cost_price || 0),
        num: Number(i.num || i.qty || 1),
        price: Number(i.price || i.sell_price || 0),
      })),
      total_amount: Number(row.total_amount || 0),
      discount_amount: Number(row.discount_amount || 0),
      pay_amount: Number(row.pay_amount || 0),
      fee_items: parsedFeeItems,
    })
  } else {
    Object.assign(form, {
      store_id: null, store_name: '',
      member_id: null, member_name: '',
      order_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
      pay_method: 'cash', remark: '', items: [],
      total_amount: 0, discount_amount: 0, pay_amount: 0,
      fee_items: [],
    })
  }
  drawerVisible.value = true
}

function onStoreChange(id: any) {
  form.store_name = storeList.value.find(s => s.id === id)?.name ?? ''
}

function onMemberChange(id: any) {
  form.member_name = memberList.value.find(m => m.id === id)?.name ?? ''
}

function calcFormTotal() {
  const total = form.items.reduce((s: number, i: any) => s + i.num * i.price, 0)
  const settlement = normalizeRetailSettlement(total, total - (form.discount_amount || 0))
  form.total_amount = settlement.totalAmount
  form.discount_amount = settlement.discountAmount
  form.pay_amount = settlement.payAmount
}

async function generateRetailNo(): Promise<string> {
  const ymd = (form.order_date || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)).replace(/-/g, '')
  try {
    const res = await getRetailOrderList({ list_rows: 500, order_date: form.order_date })
    const rows: any[] = res.data?.rows ?? []
    let maxSeq = 0
    const prefix = `LS${ymd}`
    for (const r of rows) {
      const no = r.order_sn || ''
      if (no.startsWith(prefix)) {
        const seq = parseInt(no.slice(prefix.length), 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }
    return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
  } catch {
    return `LS${ymd}001`
  }
}

async function handleSave() {
  if (!form.items.length) { ElMessage.warning(t('retail.retailOrder.warnAddGoods')); return }
  saving.value = true
  try {
    const storeIdNum = Number(form.store_id)
    const memberIdNum = Number(form.member_id)
    const normalizedItems = (form.items || []).map((i: any) => {
      const goodsIdNum = Number(i.goods_id ?? i.id)
      const num = Number(i.num || 0)
      const price = Number(i.price || 0)
      return {
        ...i,
        goods_id: Number.isFinite(goodsIdNum) && goodsIdNum > 0 ? goodsIdNum : 0,
        num: Number.isFinite(num) && num > 0 ? num : 0,
        price: Number.isFinite(price) && price >= 0 ? price : 0,
      }
    })
    const settled = distributeRetailItems(normalizedItems, form.pay_amount)
    const cleanFeeItems = form.fee_items
      .map(f => ({ name: String(f.name || '').trim(), amount: Number(f.amount || 0), bearer: f.bearer || 'buyer' }))
      .filter(f => f.name && f.amount > 0)
    const payload = {
      store_id: Number.isFinite(storeIdNum) && storeIdNum > 0 ? storeIdNum : 0,
      store_name: form.store_name || '',
      member_id: Number.isFinite(memberIdNum) && memberIdNum > 0 ? memberIdNum : 0,
      member_name: form.member_name || '',
      order_date: form.order_date,
      pay_type: form.pay_method,
      remark: form.remark || '',
      total_amount: settled.totalAmount,
      discount_amount: settled.discountAmount,
      pay_amount: settled.payAmount,
      status: 0,
      goods_info: JSON.stringify(settled.items),
      fee_items: JSON.stringify(cleanFeeItems),
    }
    if (editId.value) {
      await updateRetailOrder({ ...payload, id: editId.value })
      if (cleanFeeItems.length) saveFeeCache(editId.value, cleanFeeItems)
      ElMessage.success(t('retail.retailOrder.editSuccess'))
    } else {
      const createRes = await createRetailOrder(payload)
      const newId = createRes?.data?.id || createRes?.data?.rows?.id
      if (newId && cleanFeeItems.length) saveFeeCache(Number(newId), cleanFeeItems)
      ElMessage.success(t('retail.retailOrder.saveSuccess'))
    }
    drawerVisible.value = false
    // 清除日期筛选，确保新订单可见
    dateRange.value = []
    searchForm.start_date = ''
    searchForm.end_date = ''
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || 'Save failed')
  } finally { saving.value = false }
}

async function deductRetailFund(amount: number) {
  if (amount <= 0) return
  const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
  const funds: any[] = fundRes.data?.rows ?? []
  const retailFund = funds.find((f: any) => f.name === RETAIL_FUND_NAME)
  if (retailFund) {
    const newBalance = Number(retailFund.balance || 0) - amount
    await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: newBalance })
  }
}

async function handleAudit(row: any, status: number) {
  const items = parseGoods(row.goods_info)
  const payAmount = Number(row.pay_amount || 0)
  if (status === 1) {
    await http.post('/retail/order/audit', { id: row.id, status: 1 })
    try { await retailStockEffect(items, 'deduct', row.id) } catch (e: any) { ElMessage.warning(t('retail.retailOrder.auditStockFail')) }
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows ?? []
      const retailFund = funds.find((f: any) => f.name === RETAIL_FUND_NAME)
      if (retailFund) {
        await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: Number(retailFund.balance || 0) + payAmount })
      } else {
        await http.post('/finance/Fund/add', { name: RETAIL_FUND_NAME, type: 2, balance: payAmount, remark: 'Retail Sale Out' })
      }
    } catch (e: any) { ElMessage.warning(t('retail.retailOrder.auditFundFail')) }
    const stockDesc = items.map((i: any) => `${i.goods_name || 'item'} ×${i.num}`).join(', ')
    ElNotification({ title: t('retail.retailOrder.auditSuccessTitle'), dangerouslyUseHTMLString: true, type: 'success', duration: 5000,
      message: `<div style="font-size:12px;line-height:2">📦 ${t('retail.retailOrder.auditStockDeducted')}: ${stockDesc}<br>💰 ${RETAIL_FUND_NAME} +¥${payAmount.toFixed(2)}</div>` })
  } else {
    await http.post('/retail/order/audit', { id: row.id, status: 0 })
    try { await deleteRetailStockFlows(row.id) } catch { /* silent skip if no stock flow found */ }
    try { await deductRetailFund(payAmount) } catch (e: any) { ElMessage.warning(t('retail.retailOrder.unauditFundFail')) }
    const stockDesc = items.map((i: any) => `${i.goods_name || 'item'} ×${i.num}`).join(', ')
    ElNotification({ title: t('retail.retailOrder.unauditSuccessTitle'), dangerouslyUseHTMLString: true, type: 'warning', duration: 5000,
      message: `<div style="font-size:12px;line-height:2">📦 ${t('retail.retailOrder.unauditStockRestored')}: ${stockDesc}<br>💰 ${RETAIL_FUND_NAME} -¥${payAmount.toFixed(2)}</div>` })
  }
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  loadFeePayMap()
}

// 删除订单前清理其费用付款单（PayReceipt/del 会自动退款到对应资金账户）
async function cleanupRetailFeePayReceipts(orderId: number) {
  try {
    const res = await getPayReceiptList({ list_rows: 2000 })
    const rows: any[] = res.data?.rows ?? []
    const prefix = `零售附加费用 #${orderId}:`
    const matched = rows.filter((r: any) => String(r.remark || '').startsWith(prefix))
    for (const r of matched) {
      try { await deletePayReceipt(r.id) } catch (e: any) { console.warn('费用付款单删除失败', r.id, e?.message) }
    }
  } catch (e: any) { console.warn('查询费用付款单失败', e?.message) }
}

async function handleDelete(row: any) {
  if (row.status === 1) { ElMessage.warning(t('retail.retailOrder.deleteAuditedFirst')); return }
  await ElMessageBox.confirm(t('retail.retailOrder.deleteConfirm'), t('retail.retailOrder.deleteConfirmTip'), { type: 'warning' })
  await cleanupRetailFeePayReceipts(row.id)
  await deleteRetailOrder(row.id)
  removeFeeCache(row.id)
  ElMessage.success(t('retail.retailOrder.deleteSuccess'))
  tableRef.value?.refresh()
}

async function batchDelRetailOrders({ ids }: { ids: number[] }) {
  const rows: any[] = tableRef.value?.selectedRows ?? []
  const auditedRows = rows.filter((r: any) => r.status === 1)
  if (auditedRows.length) {
    const totalPay = auditedRows.reduce((s: number, r: any) => s + Number(r.pay_amount || 0), 0)
    try {
      await deductRetailFund(totalPay)
    } catch (e: any) {
      console.warn('零售账户余额回滚失败', e?.message)
    }
    for (const row of auditedRows) {
      try {
        await deleteRetailStockFlows(row.id)
      } catch { /* ignore */ }
    }
    stockRefreshStore.trigger()
  }
  for (const id of ids) {
    await cleanupRetailFeePayReceipts(id)
    removeFeeCache(id)
  }
  return http.post('/retail/order/batchDel', { ids })
}

async function retailStockEffect(items: any[], mode: 'deduct' | 'restore', orderId?: number) {
  const remark = mode === 'deduct' ? (orderId ? `Retail Sale Out#${orderId}` : 'Retail Sale Out') : 'Retail Return In'
  await stockEffect(items, mode, undefined, remark)
}

function parseGoods(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  try { return JSON.parse(info) } catch { return [] }
}

const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (form.items.some((i: any) => i.goods_id === g.id)) continue
    form.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      unit_name: g.unit_name || '', price: Number(g.sell_price) || 0, cost_price: Number(g.cost_price || 0), num: 1 })
  }
  calcFormTotal()
}

// ── 附加费用 ─────────────────────────────────────────────────────────────────
// 本地缓存：后端列表接口不返回 fee_items 字段，用 localStorage 持久化
const FEE_CACHE_KEY = 'retail_fee_items_cache_v1'
const feeItemsCache = ref(new Map<number, any[]>())

;(() => {
  try {
    const raw = JSON.parse(localStorage.getItem(FEE_CACHE_KEY) || '{}')
    const map = new Map<number, any[]>()
    for (const [k, v] of Object.entries(raw as Record<string, any>)) {
      if (Array.isArray(v)) map.set(Number(k), v)
    }
    feeItemsCache.value = map
  } catch {}
})()

function saveFeeCache(orderId: number, items: any[]) {
  feeItemsCache.value.set(orderId, items)
  try {
    const obj: Record<string, any> = {}
    for (const [k, v] of feeItemsCache.value) obj[String(k)] = v
    localStorage.setItem(FEE_CACHE_KEY, JSON.stringify(obj))
  } catch {}
}

function removeFeeCache(orderId: number) {
  if (!feeItemsCache.value.has(orderId)) return
  feeItemsCache.value.delete(orderId)
  try {
    const obj: Record<string, any> = {}
    for (const [k, v] of feeItemsCache.value) obj[String(k)] = v
    localStorage.setItem(FEE_CACHE_KEY, JSON.stringify(obj))
  } catch {}
}

const fundOptions = ref<any[]>([])
const feeItemPaidMap = ref<Record<string, number>>({})

async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res.data?.rows ?? []
  } catch {}
}

async function loadFeePayMap() {
  try {
    const res = await getPayReceiptList({ list_rows: 2000 })
    const rows: any[] = res.data?.rows ?? []
    const feeMap: Record<string, number> = {}
    for (const r of rows) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const m = String(r.remark || '').match(/零售附加费用\s*#(\d+):(.+?)(?:\s|$)/)
      if (m) {
        const id = Number(m[1])
        const feeName = m[2].trim()
        const key = `${id}:${feeName}`
        feeMap[key] = (feeMap[key] || 0) + amt
      }
    }
    feeItemPaidMap.value = feeMap
  } catch {}
}

function getFeeItemsForRow(row: any): { name: string; amount: number; bearer: string }[] {
  if (!row) return []
  // 后端为真相源；缓存仅在后端字段缺失时兜底（旧版后端）
  if (row.fee_items !== undefined && row.fee_items !== null) {
    try { return Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { return [] }
  }
  if (feeItemsCache.value.has(row.id)) return feeItemsCache.value.get(row.id)!
  return []
}

function getFeeItemPayStatus(row: any, idx: number): { label: string; type: string; status: string } {
  if (!row || Number(row.status) !== 1) return { label: '—', type: 'info', status: 'none' }
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
  if (!fee || Number(fee.amount || 0) <= 0) return { label: '—', type: 'info', status: 'none' }
  const bearer = fee.bearer || 'buyer'
  if (bearer === 'seller') return { label: t('retail.retailOrder.feeStatusCustomerBear'), type: 'info', status: 'customer' }
  if (bearer === 'free') return { label: t('retail.retailOrder.feeStatusFree'), type: 'info', status: 'free' }
  const needPay = bearer === 'half' ? Number(fee.amount) / 2 : Number(fee.amount)
  const paid = feeItemPaidMap.value[`${row.id}:${fee.name}`] || 0
  if (paid >= needPay - 0.01) return { label: t('retail.retailOrder.feeStatusPaid'), type: 'success', status: 'paid' }
  return { label: t('retail.retailOrder.feeStatusPending'), type: 'warning', status: 'pending' }
}

// 附加费用管理弹窗
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

async function saveFeeManageItems() {
  if (!feeManageRow.value?.id) throw new Error('Retail order not found')
  const items = feeManageItems.value
    .map(f => ({ name: String(f.name || '').trim(), amount: Number(f.amount || 0), bearer: f.bearer || 'buyer' }))
    .filter(f => f.name && f.amount > 0)
  const row = feeManageRow.value
  await http.post('/retail/order/saveFees', { id: row.id, fee_items: items })
  feeManageItems.value = items
  feeManageRow.value = { ...feeManageRow.value, fee_items: items }
  saveFeeCache(row.id, items)
  return items
}

async function submitFeeManage() {
  feeManageSaving.value = true
  try {
    await saveFeeManageItems()
    ElMessage.success(t('retail.retailOrder.feeSaveSuccess'))
    feeManageVisible.value = false
    tableRef.value?.refresh()
    loadFeePayMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? 'Save failed')
  } finally {
    feeManageSaving.value = false
  }
}

// 费用付款弹窗
const feePayVisible = ref(false)
const feePaySubmitting = ref(false)
const feePayForm = reactive({
  orderId: 0,
  orderSn: '',
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

function openFeePayDialog(row: any, idx: number) {
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
  if (!fee) { ElMessage.warning(t('retail.retailOrder.warnFeeNotExist')); return }
  if (Number(fee.amount || 0) <= 0) { ElMessage.warning(t('retail.retailOrder.warnFeeAmountZero')); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning(t('retail.retailOrder.warnFeeNoNeedPay')); return }
  if (getFeeItemPayStatus(row, idx).status !== 'pending') { ElMessage.warning(t('retail.retailOrder.warnFeeNotPending')); return }
  feePayForm.orderId = row.id
  feePayForm.orderSn = row.order_sn || `LS${(row.order_date || '').slice(0, 10).replace(/-/g, '')}${String(row.id).padStart(3, '0')}`
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
  if (!fee || Number(fee.amount || 0) <= 0) { ElMessage.warning(t('retail.retailOrder.warnFeeAmountZero')); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning(t('retail.retailOrder.warnFeeNoNeedPay')); return }
  feePayForm.feeName = String(fee.name || '').trim()
  feePayForm.amount = Number(fee.amount || 0)
  feePayForm.bearer = fee.bearer || 'buyer'
  feePayForm.fund_id = null
  feePayForm.fund_name = ''
  feePayForm.contact_name = ''
  feePayForm.pay_date = new Date().toISOString().slice(0, 10)
  feePayForm.remark = ''
  feeManagePayIndex.value = idx
}

function onFeePayFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  feePayForm.fund_name = f?.name || ''
}

async function submitFeePay() {
  if (!feePayForm.fund_id) { ElMessage.warning(t('retail.retailOrder.warnSelectAccount')); return }
  const needPay = feePayForm.bearer === 'half' ? feePayForm.amount / 2 : feePayForm.amount
  feePaySubmitting.value = true
  try {
    await createPayReceipt({
      contact_type: 'other',
      contact_name: feePayForm.contact_name,
      order_sn: feePayForm.orderSn,
      order_id: feePayForm.orderId,
      amount: needPay,
      pay_date: feePayForm.pay_date,
      fund_id: feePayForm.fund_id,
      fund_name: feePayForm.fund_name,
      remark: `零售附加费用 #${feePayForm.orderId}:${feePayForm.feeName}${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success(t('retail.retailOrder.paySuccess'))
    feePayVisible.value = false
    loadFeePayMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('retail.retailOrder.payFailed'))
  } finally {
    feePaySubmitting.value = false
  }
}

async function submitFeeManagePay() {
  if (feeManagePayIndex.value < 0) return
  if (!feePayForm.fund_id) { ElMessage.warning(t('retail.retailOrder.warnSelectAccount')); return }
  const fee = feeManageItems.value[feeManagePayIndex.value]
  if (!fee || Number(fee.amount || 0) <= 0) { ElMessage.warning(t('retail.retailOrder.warnFeeAmountZero')); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning(t('retail.retailOrder.warnFeeNoNeedPay')); return }
  feePayForm.feeName = String(fee.name || '').trim()
  feePayForm.amount = Number(fee.amount || 0)
  feePayForm.bearer = fee.bearer || 'buyer'
  feePayForm.orderId = feeManageRow.value?.id || 0
  feePayForm.orderSn = feeManageRow.value?.order_sn || `LS${(feeManageRow.value?.order_date || '').slice(0, 10).replace(/-/g, '')}${String(feeManageRow.value?.id || '').padStart(3, '0')}`
  feePaySubmitting.value = true
  try {
    await saveFeeManageItems()
    const needPay = feePayForm.bearer === 'half' ? feePayForm.amount / 2 : feePayForm.amount
    await createPayReceipt({
      contact_type: 'other',
      contact_name: feePayForm.contact_name,
      order_sn: feePayForm.orderSn,
      order_id: feePayForm.orderId,
      amount: needPay,
      pay_date: feePayForm.pay_date,
      fund_id: feePayForm.fund_id,
      fund_name: feePayForm.fund_name,
      remark: `零售附加费用 #${feePayForm.orderId}:${feePayForm.feeName}${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success(t('retail.retailOrder.paySuccess'))
    feeManagePayIndex.value = -1
    feeManageVisible.value = false
    loadFeePayMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('retail.retailOrder.payFailed'))
  } finally {
    feePaySubmitting.value = false
  }
}
</script>

<style scoped>
.page-container {}
</style>
