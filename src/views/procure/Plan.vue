<template>
  <div class="plan-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/procure/ProcurePlan/batchDel"
          :export-file-name="$t('procure.plan.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.plan_no" :placeholder="$t('procure.plan.searchPlanNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.supplier_name" :placeholder="$t('procure.plan.searchSupplierName')" clearable style="width:150px" />
            <el-select v-model="searchForm.status" :placeholder="$t('procure.plan.searchStatusPlaceholder')" clearable style="width:180px"
              @change="(v: any) => { searchForm.not_status = (v === '' || v === null || v === undefined) ? 3 : '' }">
              <el-option :label="$t('procure.plan.statusPending')" :value="0" />
              <el-option :label="$t('procure.plan.statusAudited')" :value="1" />
              <el-option :label="$t('procure.plan.statusRejected')" :value="2" />
              <el-option :label="$t('procure.plan.statusInhoused')" :value="3" />
              <el-option :label="$t('procure.plan.statusUnreconciled')" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">{{ $t('procure.plan.btnAdd') }}</el-button>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">{{ $t('procure.plan.expandTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('procure.plan.colExpandGoodsName')" min-width="140" />
                  <el-table-column prop="goods_sn" :label="$t('procure.plan.colExpandCode')" width="110" />
                  <el-table-column prop="spec" :label="$t('procure.plan.colExpandSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('procure.plan.colExpandUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('procure.plan.colExpandNum')" width="80" align="right" />
                  <el-table-column :label="$t('procure.plan.colExpandPriceWithTax')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('procure.plan.colExpandTotalWithTax')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('procure.plan.colExpandRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" :label="$t('procure.plan.colIndex')" width="60" align="center" />
          <el-table-column prop="plan_no" :label="$t('procure.plan.colPlanNo')" min-width="150" />
          <el-table-column :label="$t('procure.plan.colSupplier')" min-width="130">
            <template #default="{ row }">
              {{ row.supplier_name || supplierOptions.find(s => s.id === row.supplier_id)?.name || '—' }}
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.plan.colOrderDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.plan_date || row.create_time) }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.plan.colExpectedDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.expected_date) || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.plan.colBuyer')" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('procure.plan.colPlanAmount')" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ parseItems(row.goods_info).reduce((s: number, i: any) => s + (i.num||0)*(i.price||0), 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.plan.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag
                :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : row.status === 3 ? '' : row.status === 4 ? 'info' : 'info'"
                size="small"
              >
                {{ row.status === 1 ? $t('procure.plan.statusAudited') : row.status === 2 ? $t('procure.plan.statusRejected') : row.status === 3 ? $t('procure.plan.statusInhoused') : row.status === 4 ? $t('procure.plan.statusTransferred') : $t('procure.plan.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('procure.plan.colActions')" width="250" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1 || row.status === 3" type="primary" link size="small" @click="openEdit(row, true)">{{ $t('procure.plan.actionView') }}</el-button>
              <el-button v-else-if="row.status === 4" type="info" link size="small" @click="openEdit(row, true)">{{ $t('procure.plan.actionView') }}</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">{{ $t('procure.plan.actionEdit') }}</el-button>
              <template v-if="row.status === 0">
                <el-button type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('procure.plan.actionAudit') }}</el-button>
                <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('procure.plan.actionReconciled') : $t('procure.plan.actionReconcile') }}</el-button>
              <el-button type="danger" link size="small" @click="handleAudit(row, 2)">{{ $t('procure.plan.actionReject') }}</el-button>
              </template>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('procure.plan.actionReverseAudit') }}</el-button>
              <el-button v-if="row.status === 1" type="success" link size="small" @click="handleConvertToOrder(row)">{{ $t('procure.plan.actionConvertOrder') }}</el-button>
              <el-button v-if="row.status !== 3" type="danger" link size="small" @click="handleDelete(row.id)">{{ $t('procure.plan.actionDelete') }}</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('procure.plan.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('procure.plan.formTitleView') : (fd.id ? $t('procure.plan.formTitleEdit') : $t('procure.plan.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('procure.plan.tagAudited') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" type="primary" :loading="saving" @click="handleSave">
            {{ $t('procure.plan.btnSave') }} <span style="font-size:11px;opacity:0.7">{{ $t('procure.plan.btnSaveShortcut') }}</span>
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">{{ $t('procure.plan.sectionBasicInfo') }}</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelPlanNo')">
                  <el-input :value="fd.id ? fd.plan_no : $t('procure.plan.planNoAutoGenerate')" disabled :placeholder="$t('procure.plan.planNoPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelSupplier')" prop="supplier_id"
                  :rules="[{ required: true, message: $t('procure.plan.supplierPlaceholder') }]">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.supplier_id" :placeholder="$t('procure.plan.supplierPlaceholder')" filterable style="flex:1"
                      @change="onSupplierChange">
                      <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="openAddSupplier" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelBuyer')" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" :placeholder="$t('procure.plan.buyerPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelOrderDate')" prop="plan_date">
                  <el-date-picker v-model="fd.plan_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('procure.plan.datePlaceholder')" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelExpectedDate')" prop="expected_date">
                  <el-date-picker v-model="fd.expected_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" :placeholder="$t('procure.plan.datePlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelWarehouse')" prop="warehouse_id">
                  <el-select v-model="fd.warehouse_id" :placeholder="$t('procure.plan.warehousePlaceholder')" filterable style="width:100%"
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>

              <!-- 行3 -->
              <el-col :span="18">
                <el-form-item :label="$t('procure.plan.labelRemark')">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('procure.plan.remarkPlaceholder')" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item :label="$t('procure.plan.labelAttachment')">
                  <el-button :icon="Paperclip">{{ $t('procure.plan.btnUploadAttachment') }}</el-button>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 商品明细卡片 -->
        <div class="form-section">
          <!-- 工具栏 -->
          <div class="goods-toolbar">
            <div class="toolbar-left" v-if="!isReadonly">
              <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()">{{ $t('procure.plan.btnSelectGoods') }}</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">{{ $t('procure.plan.btnAddGoods') }}</el-button>
              <el-button :icon="Upload" size="small">{{ $t('procure.plan.btnImportGoods') }}</el-button>
            </div>
            <span class="goods-count">{{ $t('procure.plan.goodsCount') }} <b>{{ fd.items.length }}</b> {{ $t('procure.plan.goodsCountUnit') }}</span>
          </div>

          <!-- 商品表格 -->
          <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('procure.plan.emptyGoods')">
            <el-table-column type="index" width="45" align="center" fixed="left" />
            <el-table-column :label="$t('procure.plan.colGoodsName')" min-width="150" fixed="left">
              <template #default="{ row }">
                <el-input v-model="row.goods_name" size="small" :placeholder="$t('procure.plan.goodsNamePlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colGoodsSn')" width="120">
              <template #default="{ row }">
                <el-input v-model="row.goods_sn" size="small" :placeholder="$t('procure.plan.goodsSnPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colSpec')" width="140">
              <template #default="{ row }">
                <el-select
                  v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                  v-model="row.spec"
                  size="small"
                  :placeholder="$t('procure.plan.specPlaceholder')"
                  clearable
                  style="width:100%"
                  @focus="fetchGoodsSpecs(row.goods_id)"
                >
                  <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                </el-select>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('procure.plan.specPlaceholder')"
                  @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colCategory')" width="100">
              <template #default="{ row }">
                <span style="font-size:12px;color:#666">{{ row.cate_name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colUnit')" width="70" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" size="small" :placeholder="$t('procure.plan.unitPlaceholder')" />
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('procure.plan.colPlanNum') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('num')">{{ $t('procure.plan.btnBatch') }}</el-button>
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
                  <span>{{ $t('procure.plan.colPriceNoTax') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price_no_tax')">{{ $t('procure.plan.btnBatch') }}</el-button>
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
                  <span>{{ $t('procure.plan.colTaxRate') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('tax_rate')">{{ $t('procure.plan.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-select v-model="row.tax_rate" size="small" style="width:100%" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colTaxAmount')" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('procure.plan.colPriceWithTax') }}</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price')">{{ $t('procure.plan.btnBatch') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small"
                  controls-position="right" style="width:100%" @change="onPriceChange(row)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colTotalWithTax')" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('procure.plan.colRemark')" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" :placeholder="$t('procure.plan.remarkPlaceholder2')" />
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
          <div class="sec-title">{{ $t('procure.plan.sectionSettle') }}</div>
          <div class="settle-summary">
            <span>{{ $t('procure.plan.settleNoTaxTotal') }}<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('procure.plan.settleTaxTotal') }}<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('procure.plan.settleWithTaxTotal') }}<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="$t('procure.plan.dialogAddGoodsTitle')" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('procure.plan.labelGoodsName')">
          <el-input v-model="manualForm.goods_name" :placeholder="$t('procure.plan.goodsNameInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelGoodsSn')">
          <el-input v-model="manualForm.goods_sn" :placeholder="$t('procure.plan.goodsSnInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelSpecModel')">
          <el-input v-model="manualForm.spec" :placeholder="$t('procure.plan.specModelPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelUnit')">
          <el-input v-model="manualForm.unit_name" :placeholder="$t('procure.plan.unitInputPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelPlanNum2')">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelPriceWithTax')">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('procure.plan.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmManualAdd">{{ $t('procure.plan.btnConfirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="`${$t('procure.plan.dialogBatchEditTitle')} ${batchEditLabel}`" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">{{ $t('procure.plan.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ $t('procure.plan.btnConfirmBatch') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增供应商弹框 -->
    <el-dialog v-model="addSupplierVisible" :title="$t('procure.plan.dialogAddSupplierTitle')" width="380px" append-to-body>
      <el-form :model="supplierForm" label-width="80px">
        <el-form-item :label="$t('procure.plan.labelSupplierName')">
          <el-input v-model="supplierForm.name" :placeholder="$t('procure.plan.supplierNamePlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSupplierVisible = false">{{ $t('procure.plan.btnCancel') }}</el-button>
        <el-button type="primary" :loading="addSupplierLoading" @click="submitAddSupplier">{{ $t('procure.plan.btnConfirmAddSupplier') }}</el-button>
      </template>
    </el-dialog>

    <!-- 入库确认弹框 -->
    <el-dialog v-model="inhouseVisible" :title="$t('procure.plan.dialogInhouseTitle')" width="520px" append-to-body>
      <el-form :model="inhouseForm" label-width="90px" v-if="inhouseRow">
        <el-form-item :label="$t('procure.plan.labelPlanLabel')">
          <span style="color:rgba(29,29,31,0.5)">{{ inhouseRow.order_sn }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelSupplierLabel')">
          <span style="color:rgba(29,29,31,0.5)">{{ inhouseRow.supplier_name || '—' }}</span>
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelInhouseWarehouse')" required>
          <el-select v-model="inhouseForm.warehouse_id" :placeholder="$t('procure.plan.inhouseWarehousePlaceholder')" style="width:100%"
            @change="(id: any) => { const w = warehouseOptions.find(x => x.id === id); inhouseForm.warehouse_name = w?.name ?? '' }">
            <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelInhouseDate')">
          <el-date-picker v-model="inhouseForm.in_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelInhouseRemark')">
          <el-input v-model="inhouseForm.remark" :placeholder="$t('procure.plan.inhouseRemarkPlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('procure.plan.labelGoodsDetail')">
          <el-table :data="parseItems(inhouseRow.goods_info)" border size="small" style="width:100%">
            <el-table-column prop="goods_name" :label="$t('procure.plan.colGoodsItem')" min-width="120" />
            <el-table-column prop="num" :label="$t('procure.plan.colGoodsNum')" width="70" align="center" />
            <el-table-column prop="unit_name" :label="$t('procure.plan.colGoodsUnit')" width="60" align="center" />
            <el-table-column prop="price" :label="$t('procure.plan.colGoodsPrice')" width="80" align="right">
              <template #default="{ row: item }">¥{{ Number(item.price||0).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="inhouseVisible = false">{{ $t('procure.plan.btnCancel') }}</el-button>
        <el-button type="primary" :loading="inhouseSaving" :disabled="!inhouseForm.warehouse_id" @click="confirmInhouse">{{ $t('procure.plan.btnConfirmInhouse') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Plus, Delete, ArrowLeft, EditPen, Upload, Paperclip } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getProcurePlanList, createProcurePlan, deleteProcurePlan, getSupplierList, createSupplier, auditProcurePlan } from '@/api/procure'
import { getWarehouseList } from '@/api/warehouse'
import { getSpecList } from '@/api/goods'
import { getStaffList } from '@/api/personnel'
import StaffSelect from '@/components/StaffSelect.vue'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

const permStore = usePermissionStore()
const router = useRouter()

// ── 列表 ─────────────────────────────────────────────────────────────────────
const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_procure_plan', tableRef)
const reconcileFilteredApi = createFilteredApi(getProcurePlanList)

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
const searchForm = reactive<any>({ plan_no: '', supplier_name: '', status: '', not_status: 3 })
const showForm = ref(false)
const isReadonly = ref(false)

// ── 供应商/仓库/分类选项 ──────────────────────────────────────────────────────
const supplierOptions = ref<any[]>([])
const warehouseOptions = ref<any[]>([])
const staffOptions = ref<any[]>([])

async function loadSuppliers() {
  const res = await getSupplierList({ list_rows: 500 })
  supplierOptions.value = res.data?.rows ?? []
}
async function loadWarehouses() {
  const res = await getWarehouseList({ list_rows: 200 })
  warehouseOptions.value = res.data?.rows ?? []
}

onMounted(() => { loadSuppliers(); loadWarehouses(); loadStaff() })

async function loadStaff() {
  try {
    const res = await getStaffList({ list_rows: 500 })
    staffOptions.value = res.data?.rows ?? []
  } catch { /* ignore */ }
}

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface PlanItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; cate_name: string; unit_name: string
  num: number; price_no_tax: number; tax_rate: number; price: number; remark: string
}

const defaultFd = () => ({
  id: 0,
  plan_no: '',
  supplier_id: null as any,
  supplier_name: '',
  admin_name: '',
  plan_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  expected_date: '',
  warehouse_id: null as any,
  warehouse_name: '',
  remark: '',
  total_amount: 0,
  items: [] as PlanItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)

// 计算汇总
const totalNoTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0), 0)
)
const totalTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0) * (r.tax_rate || 0) / 100, 0)
)

function calcTotal() {
  fd.total_amount = fd.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
}

function calcItemTax(row: PlanItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(4))
}

function onPriceNoTaxChange(row: PlanItem) {
  calcItemTax(row)
  calcTotal()
}

function onTaxRateChange(row: PlanItem) {
  calcItemTax(row)
  calcTotal()
}

function onPriceChange(row: PlanItem) {
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
  fd.items.forEach((item: any) => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
  isReadonly.value = readonly
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

async function handleSave() {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning(t('procure.plan.msgFillRequired')); return
  }
  if (!fd.items.length) {
    ElMessage.warning(t('procure.plan.msgAddAtLeastOne')); return
  }
  saving.value = true
  try {
    // procure_plan table has very few columns — send only supplier_id, remark, goods_info
    const payload: Record<string, any> = {
      supplier_id: fd.supplier_id,
      remark: fd.remark,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) payload.id = fd.id
    if (fd.admin_name) payload.admin_name = fd.admin_name
    if (fd.plan_date) payload.plan_date = fd.plan_date
    await createProcurePlan(payload)
    ElMessage.success(t('procure.plan.msgSaveSuccess'))
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.plan.msgSaveFailed'))
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('procure.plan.msgDeleteConfirm'), t('procure.plan.msgPrompt'), { type: 'warning' })
  await deleteProcurePlan(id)
  ElMessage.success(t('procure.plan.msgDeleteSuccess'))
  tableRef.value?.refresh()
}

async function handleConvertToOrder(row: any) {
  await ElMessageBox.confirm(`${t('procure.plan.msgConvertConfirmPrefix')}${row.plan_no}${t('procure.plan.msgConvertConfirmSuffix')}`, t('procure.plan.msgConvertTitle'), { type: 'info' })
  // 标记计划为已转单 status=4
  try {
    await http.post('/procure/ProcurePlan/edit', { id: row.id, status: 4 })
  } catch (e: any) {
    console.warn('更新计划状态失败', e?.message)
  }
  tableRef.value?.refresh()
  // 用 sessionStorage 传递预填数据，避免 URL 超长
  sessionStorage.setItem('procure_order_from_plan', JSON.stringify({
    plan_id: row.id,
    supplier_id: row.supplier_id,
    supplier_name: row.supplier_name || '',
    warehouse_id: row.warehouse_id || '',
    warehouse_name: row.warehouse_name || '',
    admin_name: row.admin_name || '',
    remark: row.remark || '',
    goods_info: row.goods_info || '[]',
  }))
  router.push('/procure/order')
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? t('procure.plan.actionAuditPass') : status === 2 ? t('procure.plan.actionRejectLabel') : t('procure.plan.actionReverseAuditLabel')
  await ElMessageBox.confirm(`${t('procure.plan.msgAuditPrefix')}${action}${t('procure.plan.msgAuditSuffix')}`, t('procure.plan.msgPrompt'), { type: 'warning' })
  try {
    await auditProcurePlan(row.id, status)
    ElMessage.success(t('procure.plan.msgActionSuccess', { action }))
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.plan.msgOperationFailed'))
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
  if (!manualForm.goods_name.trim()) { ElMessage.warning(t('procure.plan.msgGoodsNameRequired')); return }
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

const fieldLabelMap = computed<Record<string, string>>(() => ({
  num: t('procure.plan.fieldPlanNum'),
  price_no_tax: t('procure.plan.fieldPriceNoTax'),
  tax_rate: t('procure.plan.fieldTaxRate'),
  price: t('procure.plan.fieldPriceWithTax'),
}))

function batchEditField(field: string) {
  batchEditFieldKey.value = field
  batchEditLabel.value = fieldLabelMap.value[field] || field
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
  ElMessage.success(`${t('procure.plan.msgBatchSetSuccess')} ${batchEditLabel.value} ${t('procure.plan.msgBatchSetTo')} ${batchEditValue.value}`)
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
  if (!supplierForm.name.trim()) { ElMessage.warning(t('procure.plan.msgSupplierRequired')); return }
  addSupplierLoading.value = true
  try {
    const res = await createSupplier({ name: supplierForm.name.trim() })
    ElMessage.success(t('procure.plan.msgAddSupplierSuccess'))
    addSupplierVisible.value = false
    await loadSuppliers()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.supplier_id = newId; onSupplierChange(newId) }
    else {
      const last = supplierOptions.value[supplierOptions.value.length - 1]
      if (last) { fd.supplier_id = last.id; onSupplierChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.plan.msgAddFailed'))
  } finally {
    addSupplierLoading.value = false
  }
}

// ── 采购计划入库 ──────────────────────────────────────────────────────────────
const inhouseVisible = ref(false)
const inhouseSaving = ref(false)
const inhouseRow = ref<any>(null)
const inhouseForm = reactive({
  warehouse_id: null as any,
  warehouse_name: '',
  in_date: new Date().toISOString().slice(0, 10),
  remark: '',
})

function openInhouse(row: any) {
  inhouseRow.value = row
  inhouseForm.warehouse_id = row.warehouse_id || null
  inhouseForm.warehouse_name = row.warehouse_name || ''
  inhouseForm.in_date = new Date().toISOString().slice(0, 10)
  inhouseForm.remark = ''
  inhouseVisible.value = true
}

async function confirmInhouse() {
  if (!inhouseForm.warehouse_id) { ElMessage.warning(t('procure.plan.msgSelectWarehouse')); return }
  inhouseSaving.value = true
  try {
    const plan = inhouseRow.value
    const items = parseItems(plan.goods_info)
    const totalAmount = items.reduce((s: number, i: any) => s + (i.num || 0) * (i.price || 0), 0)
    const res = await http.post('/procure/ProcurePlan/directInhouse', {
      plan_id: plan.id,
      supplier_id: plan.supplier_id || 0,
      supplier_name: plan.supplier_name || '',
      warehouse_id: inhouseForm.warehouse_id,
      warehouse_name: inhouseForm.warehouse_name,
      in_date: inhouseForm.in_date,
      total_amount: totalAmount,
      goods_info: plan.goods_info,
      remark: inhouseForm.remark || `${t('procure.plan.msgInhouseRemarkPrefix')}${plan.order_sn || plan.plan_no}`,
    })
    const orderSn = res?.data?.order_sn || res?.order_sn
    ElMessage.success(`${t('procure.plan.msgInhouseSuccessPrefix')}${orderSn}${t('procure.plan.msgInhouseSuccessSuffix')}`)
    inhouseVisible.value = false
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.plan.msgInhouseFailed'))
  } finally {
    inhouseSaving.value = false
  }
}

async function handleReverseInhouse(row: any) {
  await ElMessageBox.confirm(
    `${t('procure.plan.msgReverseInhouseConfirmPrefix')}${row.order_sn || row.plan_no}${t('procure.plan.msgReverseInhouseConfirmSuffix')}`,
    t('procure.plan.msgReverseInhouseTitle'),
    { type: 'warning', confirmButtonText: t('procure.plan.msgReverseInhouseConfirmBtn'), cancelButtonText: t('procure.plan.btnCancel') }
  )
  try {
    const res = await http.post('/procure/ProcurePlan/reverseInhouse', { plan_id: row.id })
    if (res?.code === 1 || res?.data?.code === 1) {
      ElMessage.success(t('procure.plan.msgReverseInhouseSuccess'))
      tableRef.value?.refresh()
    } else {
      ElMessage.error(res?.message || res?.data?.message || t('procure.plan.msgReverseInhouseFailed'))
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('procure.plan.msgReverseInhouseFailed'))
  }
}
</script>

<style scoped>
.plan-page { height: 100%; }

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

.settle-summary {
  padding-top: 4px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
  display: flex;
  align-items: center;
}
</style>
