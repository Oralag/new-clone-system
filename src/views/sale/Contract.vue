<template>
  <div class="contract-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">

      <el-card>
        <ScTable ref="tableRef" :api-obj="filteredContractApi"
          @selection-change="(rows: any[]) => contractSelectedRows = rows"
          show-summary :summary-method="getContractSummary"
          del-path="/shop/ContractOrder/batchDel"
          :export-file-name="$t('sale.contract.exportFileName')" :params="searchForm" @reset="onSearchReset"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : (row._isGroup ? 'row-group' : (row.status === 4 ? 'row-converted' : (row.customer_name === highlightName && highlightName ? 'row-highlight' : '')))"
          :export-columns="{ order_sn: $t('sale.contract.exportColOrderSn'), customer_name: $t('sale.contract.exportColCustomer'), total_amount: $t('sale.contract.exportColAmount'), sign_date: $t('sale.contract.exportColSignDate'), expire_date: $t('sale.contract.exportColExpireDate'), admin_name: $t('sale.contract.exportColAgent'), status: $t('sale.contract.exportColStatus'), remark: $t('sale.contract.exportColRemark') }">
          <template #search>
            <el-input v-model="searchForm.contract_no" :placeholder="$t('sale.contract.placeholderContractNo')" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" :placeholder="$t('sale.contract.placeholderCustomerName')" clearable style="width:150px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('sale.contract.placeholderGoodsName')" clearable style="width:150px" />
            <el-select v-model="searchForm.status" :placeholder="$t('sale.contract.placeholderStatus')" clearable style="width:110px">
              <el-option :label="$t('sale.contract.statusPendingAudit')" :value="0" />
              <el-option :label="$t('sale.contract.statusAudited')" :value="1" />
              <el-option :label="$t('sale.contract.statusUnpaid')" value="unpaid" />
              <el-option :label="$t('sale.contract.statusPaid')" value="paid" />
              <el-option :label="$t('sale.contract.statusUnreconciled')" value="unreconciled" />
            </el-select>
            <el-date-picker :key="datePickerKey" v-model="dateRange" type="daterange" :range-separator="$t('sale.contract.dateRangeSeparator')"
              :start-placeholder="$t('sale.contract.dateStart')" :end-placeholder="$t('sale.contract.dateEnd')" value-format="YYYY-MM-DD"
              style="width:240px" unlink-panels :shortcuts="dateShortcuts" @change="onDateChange" />
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate" data-guide-id="guide-contract-create">{{ $t('sale.contract.btnCreateContract') }}</el-button>
            <el-dropdown @command="handleGroupToolbarCmd">
              <el-button type="warning">
                {{ $t('sale.contract.btnGrouping') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="__new__">{{ $t('sale.contract.btnNewGroup') }}</el-dropdown-item>
                  <el-dropdown-item v-if="foldedGroupsMeta.length > 0" divided disabled style="font-size:11px;color:#9ca3af">{{ $t('sale.contract.btnDissolveGroup') }}</el-dropdown-item>
                  <el-dropdown-item v-for="g in foldedGroupsMeta" :key="g.key" :command="`__dissolve__${g.key}`">
                    {{ g.name }}（{{ g.count }} {{ $t('sale.contract.summaryCount') }}）
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <template #selection-actions="{ selectedRows: selRows, clearSelection }">
            <el-dropdown size="small" @command="(cmd: string) => handleBatchShareCmd(cmd, selRows)">
              <el-button type="success" size="small">
                {{ $t('sale.contract.btnShare') }}({{ selRows.filter((r: any) => !r._isGroup).length }})<el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="link">{{ $t('sale.contract.shareCopyLink') }}</el-dropdown-item>
                  <el-dropdown-item command="pdf">{{ $t('sale.contract.sharePdf') }}</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
            <el-button
              type="primary" size="small"
              :loading="batchAuditing"
              @click="handleBatchAudit(selRows, clearSelection)"
            >{{ $t('sale.contract.btnBatchAudit') }}({{ selRows.filter((r: any) => r.status === 0).length }})</el-button>
            <el-dropdown split-button type="warning" size="small"
              @click="collapseSelected(selRows, clearSelection)"
              @command="(key:string) => addToGroup(key, selRows, clearSelection)">
              {{ $t('sale.contract.btnJoinGroup') }}
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item disabled style="font-size:11px;color:#9ca3af">{{ $t('sale.contract.btnJoinExistingGroup') }}</el-dropdown-item>
                  <el-dropdown-item v-if="foldedGroupsMeta.length === 0" disabled>{{ $t('sale.contract.noGroup') }}</el-dropdown-item>
                  <el-dropdown-item v-for="g in foldedGroupsMeta" :key="g.key" :command="g.key">
                    {{ g.name }}（{{ g.count }} {{ $t('sale.contract.summaryCount') }}）
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div v-if="row._isGroup" class="expand-detail">
                <div class="expand-title">{{ $t('sale.contract.expandGroupTitle') }}（{{ row._groupRows.length }} {{ $t('sale.contract.summaryCount') }}）</div>
                <el-table :data="row._groupRows" border size="small" class="expand-table">
                  <el-table-column type="expand">
                    <template #default="{row:r}">
                      <div style="padding:10px 16px">
                        <div style="font-size:12px;color:#6b7280;margin-bottom:6px">{{ $t('sale.contract.expandGoodsTitle') }}</div>
                        <el-table :data="parseItems(r.goods_info)" border size="small">
                          <el-table-column prop="goods_name" :label="$t('sale.contract.colGoodsName')" min-width="140" />
                          <el-table-column :label="$t('sale.contract.colBusiness')" width="80" align="center">
                            <template #default="{row:item}">
                              <el-tag v-if="item.line_type === 'exchange'" type="warning" size="small">{{ $t('sale.contract.businessExchange') }}</el-tag>
                              <span v-else style="color:#6b7280">{{ $t('sale.contract.businessNormal') }}</span>
                            </template>
                          </el-table-column>
                          <el-table-column prop="goods_sn" :label="$t('sale.contract.colCode')" width="110" />
                          <el-table-column prop="spec" :label="$t('sale.contract.colSpec')" width="100" />
                          <el-table-column prop="unit_name" :label="$t('sale.contract.colUnit')" width="65" align="center" />
                          <el-table-column prop="num" :label="$t('sale.contract.colQty')" width="80" align="right" />
                          <el-table-column :label="$t('sale.contract.colPriceWithTax')" width="110" align="right">
                            <template #default="{row:item}">¥{{ Number(item.price||0).toFixed(2) }}</template>
                          </el-table-column>
                          <el-table-column :label="$t('sale.contract.colTotalWithTax')" width="110" align="right">
                            <template #default="{row:item}">
                              <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                            </template>
                          </el-table-column>
                        </el-table>
                      </div>
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colContractNo')" min-width="160">
                    <template #default="{row:r}">{{ r.order_sn || r.contract_sn || '—' }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colCustomerName')" min-width="110">
                    <template #default="{row:r}">{{ r.customer_name || '—' }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colContractAmount')" width="110" align="right">
                    <template #default="{row:r}"><span style="color:#0071e3">¥{{ calcContractAmount(r).toFixed(2) }}</span></template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colReceived')" width="100" align="right">
                    <template #default="{row:r}"><span style="color:#16a34a">¥{{ getReceivedAmount(r).toFixed(2) }}</span></template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colSignDate')" width="105">
                    <template #default="{row:r}">{{ (r.sign_date||r.order_date||'').slice(0,10) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colAction')" width="80" align="center">
                    <template #default="{row:r}">
                      <el-button size="small" link type="primary" @click="openEdit(r, true)">{{ $t('sale.contract.btnView') }}</el-button>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
              <div v-else class="expand-detail">
                <div class="expand-title">{{ $t('sale.contract.expandGoodsTitle') }}</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" :label="$t('sale.contract.colGoodsName')" min-width="140" />
                  <el-table-column :label="$t('sale.contract.colBusiness')" width="80" align="center">
                    <template #default="{ row: item }">
                      <el-tag v-if="item.line_type === 'exchange'" type="warning" size="small">{{ $t('sale.contract.businessExchange') }}</el-tag>
                      <span v-else style="color:#6b7280">{{ $t('sale.contract.businessNormal') }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="goods_sn" :label="$t('sale.contract.colCode')" width="110" />
                  <el-table-column prop="spec" :label="$t('sale.contract.colSpec')" width="100" />
                  <el-table-column prop="unit_name" :label="$t('sale.contract.colUnit')" width="65" align="center" />
                  <el-table-column prop="num" :label="$t('sale.contract.colQty')" width="80" align="right" />
                  <el-table-column :label="$t('sale.contract.colPriceWithTax')" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colTotalWithTax')" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" :label="$t('sale.contract.colRemark')" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colSeq')" width="60" align="center">
            <template #default="{ row, $index }">
              <span v-if="!row._isGroup" style="color:#6b7280">{{ $index + 1 }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colContractNo')" min-width="200">
            <template #default="{ row }">
              <template v-if="row._isGroup">
                <el-input v-if="editingGroupKey === row._groupKey"
                  v-model="editingGroupName" size="small" style="width:160px"
                  @keyup.enter="saveGroupName" @blur="saveGroupName" ref="groupNameInputRef" />
                <span v-else style="color:#d97706;font-weight:600;font-size:13px;cursor:pointer"
                  :title="$t('sale.contract.tooltipRenameGroup')" @click="startEditGroupName(row._groupKey, row._groupName)">
                  {{ row._groupName || $t('sale.contract.summarySelected') }}（{{ row._groupRows.length }} {{ $t('sale.contract.summaryCount') }}）
                </span>
              </template>
              <template v-else>{{ getContractSn(row) }}</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colCustomerName')" min-width="140">
            <template #default="{ row }">
              <template v-if="!row._isGroup">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colContractAmount')" width="120" align="right">
            <template #default="{ row }">
              <span v-if="row._isGroup" style="color:#d97706;font-size:12px">{{ $t('sale.contract.goodsCount') }} ¥{{ row._groupRows.reduce((s:number,r:any)=>s+calcContractAmount(r),0).toFixed(2) }}</span>
              <span v-else style="color:#0071e3;font-weight:500">¥{{ calcContractAmount(row).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colSignDate')" width="180">
            <template #default="{ row }">
              <template v-if="row._isGroup">
                <span style="color:#92400e;font-size:12px">{{ row._maxDate }} - {{ row._minDate }}</span>
              </template>
              <template v-else>{{ (row.sign_date || row.contract_date || row.order_date || row.create_time || '').slice(0, 10) }}</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colExpireDate')" width="110">
            <template #default="{ row }">
              <template v-if="!row._isGroup">{{ fmtDt(row.expire_date) || '—' }}</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colAgent')" width="90">
            <template #default="{ row }">
              <template v-if="!row._isGroup">{{ row.admin_name || '—' }}</template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag v-if="!row._isGroup" :type="getContractStatusType(row)" size="small">
                {{ getContractStatusLabel(row) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colReceivedAmount')" width="110" align="right">
            <template #default="{ row }">
              <span v-if="!row._isGroup" style="color:#16a34a;font-weight:500">¥{{ getReceivedAmount(row).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colPendingAmount')" width="110" align="right">
            <template #default="{ row }">
              <span v-if="!row._isGroup" :style="{ color: getPendingAmount(row) > 0 ? '#dc2626' : '#6b7280', fontWeight: '500' }">
                ¥{{ getPendingAmount(row).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colReceiveStatus')" width="100" align="center">
            <template #default="{ row }">
              <template v-if="!row._isGroup">
                <el-tag v-if="row.status === 1" :type="getReceiveStatus(row).type" size="small">{{ getReceiveStatus(row).label }}</el-tag>
                <span v-else style="color:#c0c4cc;font-size:12px">—</span>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colExtraFees')" width="220" align="right">
            <template #default="{ row }">
              <template v-if="!row._isGroup">
                <template v-if="getContractFeeItems(row).length > 0">
                  <div v-for="(fee, idx) in getContractFeeItems(row)" :key="idx" style="display:flex;align-items:center;justify-content:flex-end;gap:4px;line-height:1.6">
                    <span style="font-size:11px;color:rgba(29,29,31,0.5)">{{ fee.name }}</span>
                    <span style="color:#8b5cf6;font-weight:600">¥{{ Number(fee.amount).toFixed(2) }}</span>
                    <el-tag :type="getFeeItemPayStatus(row, idx).type" size="small">{{ getFeeItemPayStatus(row, idx).label }}</el-tag>
                    <el-button v-if="getFeeItemPayStatus(row, idx).code === 'pending'" type="warning" link size="small" style="font-size:11px;padding:0" @click="openFeePayDialog(row, idx)">{{ $t('sale.contract.btnFeePay') }}</el-button>
                  </div>
                </template>
                <span v-else style="color:rgba(29,29,31,0.2)">—</span>
                <div v-if="row.status === 1" style="margin-top:2px;text-align:right">
                  <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">{{ getContractFeeItems(row).length > 0 ? $t('sale.contract.btnManageFees') : $t('sale.contract.btnAddFees') }}</el-button>
                </div>
              </template>
            </template>
          </el-table-column>
          <el-table-column :label="$t('sale.contract.colAction')" width="350" fixed="right">
            <template #default="{ row }">
              <template v-if="row._isGroup">
                <el-button type="warning" link size="small" @click="unfoldGroup(row._groupKey)">{{ $t('sale.contract.btnDissolveThisGroup') }}</el-button>
              </template>
              <template v-else>
                <span v-if="row.status === 4" style="color:#16a34a;margin-right:4px;font-weight:700">✓</span>
                <el-tag v-if="row.status === 4" type="warning" size="small" style="margin-right:8px">{{ $t('sale.contract.statusConverted') }}</el-tag>
                <el-button v-if="row.status === 1 || row.status === 4" type="primary" link size="small" @click="openEdit(row, true)">{{ $t('sale.contract.btnView') }}</el-button>
                <el-button v-else type="success" link size="small" @click="openEdit(row, false)">{{ $t('sale.contract.btnEdit') }}</el-button>
                <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleAudit(row, 1)">{{ $t('sale.contract.btnAudit') }}</el-button>
                <el-button v-if="row.status === 1 || row.status === 4" type="warning" link size="small" @click="handleAudit(row, 0)">{{ $t('sale.contract.btnReverseAudit') }}</el-button>
                <el-button v-if="(row.status === 1 || row.status === 4) && getPendingAmount(row) > 0.01" type="success" link size="small" @click="openCollectDialog(row)">{{ $t('sale.contract.btnCollect') }}</el-button>
                <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('sale.contract.btnReconciled') : $t('sale.contract.btnReconcile') }}</el-button>
                <el-button type="danger" link size="small" :disabled="row.status === 1 || row.status === 4" :title="row.status === 1 || row.status === 4 ? $t('sale.contract.titleDeleteHint') : ''" @click="handleDelete(row.id)">{{ $t('sale.contract.btnDelete') }}</el-button>
              </template>
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
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('sale.contract.btnBack') }}</el-button>
          <span class="form-title">{{ isReadonly ? $t('sale.contract.formTitleView') : (fd.id ? $t('sale.contract.formTitleEdit') : $t('sale.contract.formTitleCreate')) }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">{{ $t('sale.contract.tagAudited') }}</el-tag>
        </div>
        <div class="form-actions">
          <el-dropdown v-if="isReadonly" @command="handleShareCommand">
            <el-button type="primary">{{ $t('sale.contract.btnShare') }} <el-icon class="el-icon--right"><arrow-down /></el-icon></el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="link">{{ $t('sale.contract.shareLink') }}</el-dropdown-item>
                <el-dropdown-item command="pdf">{{ $t('sale.contract.sharePdfSend') }}</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
          <el-button v-if="isReadonly" @click="handleContractPrint">{{ $t('sale.contract.btnPrint') }}</el-button>
          <el-button v-if="isReadonly" @click="handleContractExport">{{ $t('sale.contract.btnExport') }}</el-button>
          <el-button v-if="!isReadonly" :loading="saving && !savingAndAuditing" @click="handleSave(false)" data-guide-id="guide-contract-save">
            {{ $t('sale.contract.btnSave') }}
          </el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="savingAndAuditing" @click="handleSave(true)">
            {{ $t('sale.contract.btnSaveAndAudit') }}
          </el-button>
        </div>
      </div>

      <div class="form-body" ref="formBodyRef">

        <!-- 基本信息：4列面板布局 -->
        <div class="form-section info-header-section">
          <el-form ref="formRef" :model="fd" :disabled="isReadonly">
            <div class="info-panels">

              <!-- 面板1：客户信息 -->
              <div class="info-panel">
                <div class="info-panel-title">{{ $t('sale.contract.panelCustomer') }}</div>
                <div class="info-field">
                  <span class="info-label"><span style="color:#f56c6c">*</span>&nbsp;{{ $t('sale.contract.labelCustomer') }}</span>
                  <el-form-item prop="customer_id" :rules="[{ required: true, message: $t('sale.contract.placeholderSelectCustomer') }]"
                    style="margin:0;flex:1" data-guide-id="guide-contract-customer">
                    <div style="display:flex;gap:4px;width:100%">
                      <el-select v-model="fd.customer_id" :placeholder="$t('sale.contract.placeholderSelectCustomer')" filterable style="flex:1"
                        :disabled="isReadonly" @change="onCustomerChange">
                        <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                      </el-select>
                      <el-button v-if="!isReadonly" type="primary" :icon="Plus" @click="quickAddCustomerVisible = true" />
                    </div>
                  </el-form-item>
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelLevel') }}</span>
                  <el-select v-model="fd.level_id" :placeholder="$t('sale.contract.placeholderLevel')" clearable style="flex:1"
                    :disabled="isReadonly" @change="onLevelChange">
                    <el-option v-for="lv in levelOptions" :key="lv.id" :label="lv.name" :value="lv.id" />
                  </el-select>
                </div>
              </div>

              <!-- 面板2：合同信息 -->
              <div class="info-panel">
                <div class="info-panel-title">
                  {{ $t('sale.contract.panelContract') }}
                  <span v-if="fd.id && fd.contract_no" class="info-panel-sn">（{{ fd.contract_no }}）</span>
                  <span v-else class="info-panel-sn">{{ $t('sale.contract.snAfterSave') }}</span>
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelAgent') }}</span>
                  <el-select v-model="fd.admin_id" :placeholder="$t('sale.contract.placeholderSelect')" filterable clearable style="flex:1"
                    :disabled="isReadonly" @change="onAdminChange">
                    <el-option v-for="s in staffOptions" :key="s.id" :label="s.name" :value="s.id" />
                  </el-select>
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelSignDate') }}</span>
                  <el-date-picker v-model="fd.sign_date" type="date" value-format="YYYY-MM-DD"
                    style="flex:1" :placeholder="$t('sale.contract.placeholderSelectDate')" :disabled="isReadonly" />
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelExpireDate') }}</span>
                  <el-date-picker v-model="fd.expire_date" type="date" value-format="YYYY-MM-DD"
                    style="flex:1" :placeholder="$t('sale.contract.placeholderSelectDate')" :disabled="isReadonly" />
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelCommission') }}</span>
                  <div style="display:flex;gap:4px;flex:1;align-items:center">
                    <el-input-number v-model="fd.commission_rate" :min="0" :max="100" :precision="1"
                      controls-position="right" style="flex:1" :disabled="isReadonly"
                      :placeholder="fd.admin_id ? String(getCommissionRate(fd.admin_id)) : '0'" />
                    <span style="font-size:13px;color:rgba(29,29,31,0.35)">%</span>
                    <el-button v-if="!isReadonly" link size="small" @click="goToCommissionSetting"
                      style="font-size:12px;padding:0 2px">{{ $t('sale.contract.btnCommissionSetting') }}</el-button>
                  </div>
                </div>
                <div v-if="fd.source_offer_no" class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelSourceOffer') }}</span>
                  <div style="display:flex;align-items:center;gap:6px;flex:1">
                    <el-input :value="fd.source_offer_no" disabled style="flex:1" />
                    <span v-if="calcOfferDisplayAmount > 0"
                      style="font-size:13px;color:#0071e3;font-weight:600;white-space:nowrap">
                      ¥{{ calcOfferDisplayAmount.toFixed(2) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 面板3：账户信息 -->
              <div class="info-panel">
                <div class="info-panel-title">{{ $t('sale.contract.panelAccount') }}</div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelReceiveAccount') }}</span>
                  <div style="display:flex;gap:4px;flex:1">
                    <el-select v-model="fd.receive_account" :placeholder="$t('sale.contract.placeholderSelectAccount')" clearable style="flex:1"
                      :disabled="isReadonly">
                      <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.name" />
                      <el-option :label="$t('sale.contract.optionCash')" value="现金" />
                    </el-select>
                    <el-button v-if="!isReadonly" :icon="Plus" @click="openAddFund" />
                  </div>
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelNeedInvoice') }}</span>
                  <el-switch v-model="fd.need_invoice" :disabled="isReadonly" :active-text="$t('sale.contract.switchYes')" :inactive-text="$t('sale.contract.switchNo')" />
                </div>
                <div class="info-field">
                  <span class="info-label">{{ $t('sale.contract.labelInstallment') }}</span>
                  <el-switch v-model="fd.installment" :disabled="isReadonly" :active-text="$t('sale.contract.switchYes')" :inactive-text="$t('sale.contract.switchNo')" />
                </div>
              </div>

              <!-- 面板4：金额摘要 -->
              <div class="info-panel amount-summary-panel">
                <div class="info-panel-title">{{ $t('sale.contract.panelAmountSummary') }}</div>
                <div class="amount-stat-row">
                  <span class="amount-stat-label">{{ $t('sale.contract.labelKindCount') }}</span>
                  <b class="amount-stat-value">{{ goodsKindCount }}</b>
                  <span class="amount-stat-label" style="margin-left:16px">{{ $t('sale.contract.labelTotalQty') }}</span>
                  <b class="amount-stat-value" style="color:#0071e3">{{ totalGoodsNum }}</b>
                </div>
                <div v-if="fd.discount_type !== 'none' && Number(fd.discount_value) > 0" class="amount-stat-row">
                  <span class="amount-stat-label">{{ $t('sale.contract.labelDiscountAmount') }}</span>
                  <span style="color:#16a34a;font-weight:600">
                    ¥{{ Number(fd.discount_type === 'percent' ? fd.total_amount * (fd.discount_value || 0) / 100 : fd.discount_value).toFixed(2) }}
                  </span>
                </div>
                <div v-if="fd.discount_type === 'percent' && Number(fd.discount_value) > 0" class="amount-stat-row">
                  <span class="amount-stat-label">{{ $t('sale.contract.labelDiscountRate') }}</span>
                  <span style="color:rgba(29,29,31,0.7);font-size:13px">
                    {{ fd.discount_value }}%（{{ (fd.total_amount * (fd.discount_value || 0) / 100).toFixed(2) }}）
                  </span>
                </div>
                <div class="amount-stat-row">
                  <span class="amount-stat-label">{{ $t('sale.contract.labelCumulativeReceipt') }}</span>
                  <span style="color:#16a34a;font-weight:600">
                    ¥{{ (Number(fd.receive_amount || 0) + Number(fd.prepay_amount || 0)).toFixed(2) }}
                  </span>
                </div>
                <div class="amount-receivable-row">
                  <div class="amount-stat-label" style="margin-bottom:4px">{{ $t('sale.contract.labelThisOrderReceivable') }}</div>
                  <div class="amount-receivable-value">¥ {{ finalReceivable.toFixed(2) }}</div>
                </div>
              </div>

            </div>

            <!-- 备注 & 附件 -->
            <div class="remark-row">
              <span class="remark-label">{{ $t('sale.contract.labelRemark') }}</span>
              <el-input v-model="fd.remark" type="textarea" :rows="2" :placeholder="$t('sale.contract.placeholderRemark')"
                :disabled="isReadonly" style="flex:1" />
              <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
                <span class="remark-label">{{ $t('sale.contract.labelAttachment') }}</span>
                <el-button :icon="Paperclip" :disabled="isReadonly">{{ $t('sale.contract.btnUploadAttachment') }}</el-button>
              </div>
            </div>
          </el-form>
        </div>

        <!-- 商品明细卡片 -->
        <div class="form-section">
          <!-- 工具栏 -->
          <div v-if="!isReadonly" class="goods-toolbar">
            <div class="toolbar-left">
              <el-button type="success" :icon="Document" size="small" @click="openOfferPicker">{{ $t('sale.contract.btnSelectOffer') }}</el-button>
              <el-button type="primary" :icon="Plus" size="small" @click="openNormalGoodsPicker" data-guide-id="guide-contract-goods">{{ $t('sale.contract.btnSelectGoods') }}</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">{{ $t('sale.contract.btnAddGoods') }}</el-button>
              <el-button :icon="Upload" size="small">{{ $t('sale.contract.btnImportGoods') }}</el-button>
              <el-button size="small" :type="showExchangeGroup ? 'warning' : ''" @click="showExchangeGroup = !showExchangeGroup">
                {{ showExchangeGroup ? $t('sale.contract.btnExchangeGroupCollapse') : $t('sale.contract.btnExchangeGroup') }}
              </el-button>
            </div>
            <span class="goods-count">{{ $t('sale.contract.goodsCount') }} <b>{{ fd.items.length }}</b> {{ $t('sale.contract.goodsCountUnit') }}</span>
          </div>

          <!-- 商品表格（桌面） -->
          <el-table v-if="!isMobile" :data="fd.items" border size="small" style="width:100%" :empty-text="$t('sale.contract.emptyGoodsHint')">
            <el-table-column type="index" width="45" align="center" fixed="left" />
            <el-table-column :label="$t('sale.contract.colGoodsName')" min-width="150" fixed="left">
              <template #default="{ row }">
                <el-input v-model="row.goods_name" size="small" :placeholder="$t('sale.contract.placeholderGoodsName2')" :disabled="isReadonly" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colGoodsCode')" width="120">
              <template #default="{ row }">
                <el-input v-model="row.goods_sn" size="small" :placeholder="$t('sale.contract.placeholderCode')" :disabled="isReadonly" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colSpecModel')" width="140">
              <template #default="{ row }">
                <el-select
                  v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                  v-model="row.spec"
                  size="small"
                  :placeholder="$t('sale.contract.placeholderSelectSpec')"
                  clearable
                  :disabled="isReadonly"
                  style="width:100%"
                  @focus="fetchGoodsSpecs(row.goods_id)"
                >
                  <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                </el-select>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('sale.contract.placeholderSpec')" :disabled="isReadonly"
                  @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colGoodsType')" width="80">
              <template #default="{ row }">
                <span style="font-size:12px;color:#666">{{ { 1: $t('sale.contract.goodsTypeFinished'), 2: $t('sale.contract.goodsTypeHalfFinished'), 3: $t('sale.contract.goodsTypeRawMaterial'), 4: $t('sale.contract.goodsTypeAuxMaterial') }[row.goods_type as 1|2|3|4] || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colBiz')" width="140">
              <template #default="{ row }">
                <div style="display:flex;gap:4px;align-items:center">
                  <el-select
                    v-model="row.line_type"
                    size="small"
                    :disabled="isReadonly"
                    style="width:82px"
                    @change="onItemLineTypeChange(row)"
                  >
                    <el-option :label="$t('sale.contract.bizNormal')" value="normal" />
                    <el-option :label="$t('sale.contract.bizExchange')" value="exchange" />
                  </el-select>
                  <el-tag v-if="row.line_type === 'exchange'" type="warning" size="small">
                    {{ getExchangeGroupLabel(row.exchange_group_key) }}
                  </el-tag>
                </div>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colUnit')" width="90" align="center">
              <template #default="{ row }">
                <el-select v-if="row.goods_id && goodsUnitMap[row.goods_id]?.length > 1"
                  v-model="row.unit_name" size="small" :disabled="isReadonly" style="width:100%"
                  @change="(v: string) => onItemUnitChange(row, v)">
                  <el-option v-for="u in goodsUnitMap[row.goods_id]" :key="u.unit_name" :label="u.unit_name" :value="u.unit_name" />
                </el-select>
                <el-input v-else v-model="row.unit_name" size="small" :placeholder="$t('sale.contract.placeholderUnit')" :disabled="isReadonly" />
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.contract.colBatchQty') }}</span>
                  <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('num')">{{ $t('sale.contract.batchEdit') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <div style="display:flex;gap:4px;align-items:center">
                  <el-input-number v-model="row.num" :min="0" :precision="4" size="small"
                    controls-position="right" style="flex:1;min-width:0" :disabled="isReadonly" @change="calcItemTax(row); calcTotal()" />
                  <el-button v-if="!isReadonly && isWeightUnit(row.unit_name)"
                    size="small" circle style="flex-shrink:0;width:24px;height:24px;padding:0;font-size:12px"
                    :title="$t('sale.contract.tooltipWeightCalc')" @click="openWC(row)">g</el-button>
                </div>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.contract.colPriceNoTax') }}</span>
                  <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('price_no_tax')">{{ $t('sale.contract.batchEdit') }}</el-button>
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
                  <span>{{ $t('sale.contract.colTaxRate') }}</span>
                  <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('tax_rate')">{{ $t('sale.contract.batchEdit') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-select v-model="row.tax_rate" size="small" style="width:100%" :disabled="isReadonly" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colTaxAmount')" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.contract.colPriceWithTaxHeader') }}</span>
                  <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('price')">{{ $t('sale.contract.batchEdit') }}</el-button>
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
                  <span>{{ $t('sale.contract.colSubtotalNoTax') }}</span>
                  <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('subtotal_no_tax')">{{ $t('sale.contract.batchEdit') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num||0) * (row.price_no_tax||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130" align="right">
              <template #header>
                <div class="batch-header">
                  <span>{{ $t('sale.contract.colTotalWithTaxHeader') }}</span>
                  <el-button v-if="!isReadonly" link type="primary" size="small" @click="batchEditField('total_tax')">{{ $t('sale.contract.batchEdit') }}</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isReadonly"
                  :model-value="Number(((row.num||0) * (row.price||0)).toFixed(2))"
                  :min="0" :precision="2" size="small"
                  controls-position="right" style="width:100%"
                  @change="(val: number) => onTotalTaxChange(row, val)" />
                <span v-else style="color:#0071e3;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column :label="$t('sale.contract.colRemark')" min-width="140">
              <template #default="{ row }">
                <div style="display:flex;gap:4px;align-items:center">
                  <el-input v-model="row.remark" size="small" :placeholder="$t('sale.contract.colRemark')" :disabled="isReadonly" style="flex:1" />
                  <el-tooltip v-if="!isReadonly && fd.level_id && row.goods_id > 0 && !hasLevelPrice(row.goods_id)"
                    :content="$t('sale.contract.tooltipSaveAsLevelPrice')" placement="top">
                    <el-button type="warning" link size="small" @click="saveAsLevelPrice(row)">{{ $t('sale.contract.btnSaveAsLevelPrice') }}</el-button>
                  </el-tooltip>
                  <el-tooltip v-if="!isReadonly && fd.level_id && row.goods_id > 0 && hasLevelPrice(row.goods_id) && isLevelPriceDifferent(row)"
                    :content="$t('sale.contract.tooltipUpdateLevelPrice')" placement="top">
                    <el-button type="primary" link size="small" @click="updateLevelPrice(row)">{{ $t('sale.contract.btnUpdateLevelPrice') }}</el-button>
                  </el-tooltip>
                </div>
              </template>
            </el-table-column>
            <el-table-column v-if="!isReadonly" width="45" align="center" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" link :icon="Delete" @click="removeItem($index)" />
              </template>
            </el-table-column>
          </el-table>

          <!-- 商品卡片列表（手机端） -->
          <div v-else class="mobile-goods-list">
            <div v-if="fd.items.length === 0" class="mobile-goods-empty">{{ $t('sale.contract.mobileEmptyGoods') }}</div>
            <div v-for="(row, idx) in fd.items" :key="idx" class="mobile-goods-card">
              <div class="mgc-header">
                <span class="mgc-index">{{ idx + 1 }}</span>
                <span class="mgc-name">{{ row.goods_name || $t('sale.contract.mobileUnnamed') }}</span>
                <el-tag v-if="row.line_type === 'exchange'" type="warning" size="small">{{ getExchangeGroupLabel(row.exchange_group_key) }}</el-tag>
                <el-button v-if="!isReadonly" type="danger" link :icon="Delete" size="small" @click="removeItem(idx)" />
              </div>
              <div class="mgc-row" v-if="!isReadonly">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelBiz') }}</span>
                <el-select v-model="row.line_type" size="small" style="flex:1" :disabled="isReadonly" @change="onItemLineTypeChange(row)">
                  <el-option :label="$t('sale.contract.mobileBizNormal')" value="normal" />
                  <el-option :label="$t('sale.contract.mobileBizExchange')" value="exchange" />
                </el-select>
              </div>
              <div class="mgc-row" v-if="row.spec || !isReadonly">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelSpec') }}</span>
                <el-select
                  v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                  v-model="row.spec"
                  size="small"
                  :placeholder="$t('sale.contract.placeholderSelect')"
                  clearable
                  :disabled="isReadonly"
                  style="flex:1"
                  @focus="fetchGoodsSpecs(row.goods_id)"
                >
                  <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                </el-select>
                <el-input v-else v-model="row.spec" size="small" :placeholder="$t('sale.contract.placeholderSpecModel')" :disabled="isReadonly"
                  style="flex:1" @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
              </div>
              <div class="mgc-row">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelUnit') }}</span>
                <el-select v-if="row.goods_id && goodsUnitMap[row.goods_id]?.length > 1"
                  v-model="row.unit_name" size="small" :disabled="isReadonly" style="flex:1"
                  @change="(v: string) => onItemUnitChange(row, v)">
                  <el-option v-for="u in goodsUnitMap[row.goods_id]" :key="u.unit_name" :label="u.unit_name" :value="u.unit_name" />
                </el-select>
                <el-input v-else v-model="row.unit_name" size="small" :placeholder="$t('sale.contract.placeholderUnit')" :disabled="isReadonly" style="flex:1" />
              </div>
              <div class="mgc-row">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelQty') }}</span>
                <el-input-number v-model="row.num" :min="0" :precision="4" size="small"
                  controls-position="right" style="flex:1" :disabled="isReadonly"
                  @change="calcItemTax(row); calcTotal()" />
              </div>
              <div class="mgc-row">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelPrice') }}</span>
                <el-input-number v-model="row.price" :min="0" :precision="4" size="small"
                  controls-position="right" style="flex:1" :disabled="isReadonly" @change="onPriceChange(row)" />
              </div>
              <div class="mgc-row">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelTaxRate') }}</span>
                <el-select v-model="row.tax_rate" size="small" style="flex:1" :disabled="isReadonly" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </div>
              <div class="mgc-row">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelTotal') }}</span>
                <span class="mgc-total">¥{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </div>
              <div class="mgc-row" v-if="!isReadonly">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelRemark') }}</span>
                <el-input v-model="row.remark" size="small" :placeholder="$t('sale.contract.mobileLabelRemark')" style="flex:1" />
              </div>
              <div class="mgc-row" v-else-if="row.remark">
                <span class="mgc-label">{{ $t('sale.contract.mobileLabelRemark') }}</span>
                <span style="flex:1;font-size:13px;color:#555">{{ row.remark }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 换货组 -->
        <div v-if="showExchangeGroup" class="form-section">
          <div class="sec-header">
            <div>
              <div class=”sec-title” style=”margin-bottom:2px”>{{ $t('sale.contract.secTitleExchange') }}</div>
              <div style=”font-size:12px;color:rgba(29,29,31,0.45)”>{{ $t('sale.contract.exchangeDesc') }}</div>
            </div>
            <el-button v-if="!isReadonly" type="primary" plain size="small" :icon="Plus" @click="addExchangeGroup">
              {{ $t('sale.contract.btnAddExchangeGroup') }}
            </el-button>
          </div>
          <div v-if="fd.exchange_groups.length === 0" class="exchange-empty">
            {{ $t('sale.contract.exchangeEmpty') }}
          </div>
          <div v-for="(group, groupIndex) in fd.exchange_groups" :key="group.key" class="exchange-group-card">
            <div class="exchange-group-head">
              <div style="display:flex;align-items:center;gap:8px">
                <el-tag type="warning" size="small">{{ getExchangeGroupLabel(group.key) }}</el-tag>
                <span style="font-size:13px;color:#6b7280">{{ $t('sale.contract.labelReturnAmt') }} ¥{{ calcExchangeReturnAmount(group).toFixed(2) }} / {{ $t('sale.contract.labelOutAmt') }} ¥{{ calcExchangeGroupOutAmount(group.key).toFixed(2) }}</span>
                <span :style="{fontSize:'13px',fontWeight:'600',color: calcExchangeGroupDiff(group) > 0 ? '#dc2626' : calcExchangeGroupDiff(group) < 0 ? '#16a34a' : '#6b7280'}">
                  {{ $t('sale.contract.labelDiff') }} {{ calcExchangeGroupDiff(group) > 0 ? '+' : '' }}¥{{ calcExchangeGroupDiff(group).toFixed(2) }}
                </span>
              </div>
              <el-button v-if="!isReadonly" type="danger" link size="small" @click="removeExchangeGroup(groupIndex)">{{ $t('sale.contract.btnDeleteGroup') }}</el-button>
            </div>

            <div class="exchange-grid">
              <div class="exchange-side">
                <div class="exchange-side-title">
                  <span>{{ $t('sale.contract.sideReturn') }}</span>
                  <el-dropdown v-if="!isReadonly" size="small" trigger="click" @command="(cmd: string) => handleReturnPickerCmd(cmd, groupIndex)">
                    <el-button type="primary" link size="small" :icon="Plus">{{ $t('sale.contract.btnSelectReturnGoods') }}<el-icon class="el-icon--right"><ArrowDown /></el-icon></el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item command="exchange-order">{{ $t('sale.contract.importFromContract') }}</el-dropdown-item>
                        <el-dropdown-item command="goods">{{ $t('sale.contract.importManualGoods') }}</el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>
                </div>
                <el-table :data="group.return_items" border size="small" :empty-text="$t('sale.contract.exchangeReturnEmpty')">
                  <el-table-column prop="goods_name" :label="$t('sale.contract.colGoodsShort')" min-width="140" />
                  <el-table-column prop="unit_name" :label="$t('sale.contract.colUnit')" width="64" align="center" />
                  <el-table-column :label="$t('sale.contract.colQty')" width="110">
                    <template #default="{ row }">
                      <el-input-number v-model="row.num" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" />
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colPrice')" width="110">
                    <template #default="{ row }">
                      <el-input-number v-model="row.price" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" />
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colAmount')" width="90" align="right">
                    <template #default="{ row }">¥{{ (Number(row.num || 0) * Number(row.price || 0)).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column v-if="!isReadonly" width="44" align="center">
                    <template #default="{ $index }">
                      <el-button type="danger" link :icon="Delete" @click="group.return_items.splice($index, 1)" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>

              <div class="exchange-side">
                <div class="exchange-side-title">
                  <span>{{ $t('sale.contract.sideExchangeOut') }}</span>
                  <el-button v-if="!isReadonly" type="primary" link size="small" :icon="Plus" @click="openExchangeGoodsPicker('out', groupIndex)">{{ $t('sale.contract.btnSelectExchangeOut') }}</el-button>
                </div>
                <el-table :data="getExchangeOutItems(group.key)" border size="small" :empty-text="$t('sale.contract.exchangeOutEmpty')">
                  <el-table-column prop="goods_name" :label="$t('sale.contract.colGoodsShort')" min-width="140" />
                  <el-table-column prop="unit_name" :label="$t('sale.contract.colUnit')" width="64" align="center" />
                  <el-table-column :label="$t('sale.contract.colQty')" width="110">
                    <template #default="{ row }">
                      <el-input-number v-model="row.num" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" @change="calcItemTax(row); calcTotal()" />
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colPrice')" width="110">
                    <template #default="{ row }">
                      <el-input-number v-model="row.price" :min="0" :precision="4" size="small" controls-position="right" style="width:100%" :disabled="isReadonly" @change="onPriceChange(row)" />
                    </template>
                  </el-table-column>
                  <el-table-column :label="$t('sale.contract.colAmount')" width="90" align="right">
                    <template #default="{ row }">¥{{ (Number(row.num || 0) * Number(row.price || 0)).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column v-if="!isReadonly" width="44" align="center">
                    <template #default="{ row }">
                      <el-button type="danger" link :icon="Delete" @click="removeExchangeOutItem(row)" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </div>

        <!-- 结算信息卡片 -->
        <div class="form-section settlement-section">
          <div class="sec-title">{{ $t('sale.contract.secTitleSettlement') }}</div>
          <div class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.contract.labelGoodsTotalWithTax') }}</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.contract.labelDiscountType') }}</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" :disabled="isReadonly" @change="calcSettle">
                <el-option :label="$t('sale.contract.discountNone')" value="none" />
                <el-option :label="$t('sale.contract.discountByAmount')" value="amount" />
                <el-option :label="$t('sale.contract.discountByPercent')" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? $t('sale.contract.labelDiscountPercent') : $t('sale.contract.labelDiscountAmountValue') }}</span>
              <el-input-number v-model="fd.discount_value" :min="0" :disabled="isReadonly"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.contract.labelAfterDiscount') }}</span>
              <span class="settle-value">¥{{ fd.after_discount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.contract.labelOtherIncome') }}</span>
              <el-input-number v-model="fd.income_amount" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" @change="calcSettle" />
              <span style="font-size:11px;color:rgba(29,29,31,0.35)">{{ $t('sale.contract.otherIncomeHint') }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.contract.labelExchangeDeduct') }}</span>
              <span class="settle-value" style="color:#d97706">¥{{ Number(fd.exchange_deduct || 0).toFixed(2) }}</span>
              <span style="font-size:11px;color:rgba(29,29,31,0.35)">{{ $t('sale.contract.exchangeDeductHint') }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">{{ $t('sale.contract.labelThisReceipt') }}</span>
              <el-input-number v-model="fd.receive_amount" :min="0" :max="finalReceivable" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" />
              <el-button v-if="!isReadonly" size="small" type="primary" plain
                style="margin-left:6px;padding:4px 8px;font-size:12px"
                @click="fd.receive_amount = finalReceivable">{{ $t('sale.contract.btnReceiveAll') }}</el-button>
            </div>
            <div class="settle-item" v-if="customerPrepayBalance > 0 || fd.prepay_amount > 0">
              <span class="settle-label" style="color:#16a34a">
                {{ $t('sale.contract.labelPrepayAvailable') }}
                <el-tag type="success" size="small" style="margin-left:4px">¥{{ customerPrepayBalance.toFixed(2) }}</el-tag>
              </span>
              <el-input-number
                v-model="fd.prepay_amount"
                :min="0"
                :max="Math.min(customerPrepayBalance, finalReceivable)"
                :precision="2"
                :disabled="isReadonly"
                size="small"
                style="width:130px"
                placeholder="0"
              />
              <span style="font-size:11px;color:rgba(29,29,31,0.35)">{{ $t('sale.contract.prepayHint') }}</span>
            </div>
            <!-- 附加费用：编辑时始终显示，只读时有费用才显示 -->
            <div v-if="!isReadonly || fd.fee_items.length > 0" class="settle-item fee-items-row" style="align-items:flex-start">
              <span class="settle-label" style="padding-top:6px">{{ $t('sale.contract.labelExtraFees') }}</span>
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
                    :placeholder="$t('sale.contract.placeholderFeeType')"
                  >
                    <el-option :label="$t('sale.contract.feeTypeExpress')" value="快递/物流" />
                    <el-option :label="$t('sale.contract.feeTypePackaging')" value="包装支出" />
                    <el-option :label="$t('sale.contract.feeTypePromotion')" value="推广费/线上" />
                    <el-option :label="$t('sale.contract.feeTypeToll')" value="路费/收费站" />
                    <el-option :label="$t('sale.contract.feeTypeLaborService')" value="劳务费" />
                    <el-option :label="$t('sale.contract.feeTypeOther')" value="其他支出" />
                  </el-select>
                  <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small"
                    style="width:110px;margin-left:6px" :disabled="isReadonly" :placeholder="$t('sale.contract.placeholderFeeAmount')" />
                  <el-select v-model="fee.bearer" size="small" style="width:100px;margin-left:6px" :disabled="isReadonly">
                    <el-option :label="$t('sale.contract.feeBearerBuyer')" value="buyer" />
                    <el-option :label="$t('sale.contract.feeBearerSeller')" value="seller" />
                  </el-select>
                  <el-input
                    v-model="fee.supplier_name"
                    size="small"
                    style="width:120px;margin-left:6px"
                    :disabled="isReadonly"
                    :placeholder="$t('sale.contract.placeholderFeeSupplier')"
                  />
                  <template v-if="isReadonly">
                    <el-tag :type="getFeeItemPayStatus(fd, idx).type" size="small" style="margin-left:6px">
                      {{ getFeeItemPayStatus(fd, idx).label }}
                    </el-tag>
                    <el-button
                      v-if="getFeeItemPayStatus(fd, idx).code === 'pending'"
                      type="warning" link size="small" style="margin-left:4px"
                      @click="openFeePayDialog(fd, idx)"
                    >{{ $t('sale.contract.btnFeePay') }}</el-button>
                  </template>
                  <el-button v-if="!isReadonly" type="danger" link :icon="Delete" size="small"
                    style="margin-left:6px" @click="fd.fee_items.splice(idx, 1)" />
                </div>
                <el-button v-if="!isReadonly" type="primary" link size="small" :icon="Plus"
                  style="margin-top:4px" @click="fd.fee_items.push({ name: '快递/物流', amount: 0, bearer: 'buyer', supplier_name: '' })">
                  {{ $t('sale.contract.btnAddFeeItem') }}
                </el-button>
              </div>
            </div>
          </div>
          <div class="settle-summary">
            <span>{{ $t('sale.contract.summaryNoTax') }}<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.contract.summaryTax') }}<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">{{ $t('sale.contract.summaryWithTax') }}<b>¥{{ fd.total_amount.toFixed(2) }}</b></span>
            <template v-if="fd.discount_type !== 'none' && Number(fd.discount_value) > 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryDiscount') }}<b style="color:#16a34a">-¥{{ Number(fd.discount_type === 'percent' ? fd.total_amount * (fd.discount_value || 0) / 100 : fd.discount_value).toFixed(2) }}</b></span>
            </template>
            <span style="margin-left:24px">{{ $t('sale.contract.summaryAfterDiscount') }}<b>¥{{ fd.after_discount.toFixed(2) }}</b></span>
            <template v-if="fd.fee_items.length > 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryBuyerFee') }}<b style="color:#7c3aed">¥{{ feeBuyerCost.toFixed(2) }}</b></span>
              <span v-if="feeSellerCost > 0" style="margin-left:12px">{{ $t('sale.contract.summarySellerFee') }}<b style="color:#6b7280">¥{{ feeSellerCost.toFixed(2) }}</b></span>
            </template>
            <template v-if="Number(fd.income_amount) !== 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryOtherIncome') }}<b :style="{ color: Number(fd.income_amount) > 0 ? '#16a34a' : '#dc2626' }">{{ Number(fd.income_amount) > 0 ? '-' : '+' }}¥{{ Math.abs(Number(fd.income_amount)).toFixed(2) }}</b></span>
            </template>
            <template v-if="Number(fd.exchange_deduct || 0) > 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryExchangeDeduct') }}<b style="color:#d97706">-¥{{ Number(fd.exchange_deduct || 0).toFixed(2) }}</b></span>
            </template>
            <span style="margin-left:24px">{{ $t('sale.contract.summaryFinalReceivable') }}<b style="color:#0071e3;font-size:16px">¥{{ finalReceivable.toFixed(2) }}</b></span>
            <template v-if="fd.prepay_amount > 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryPrepay') }}<b style="color:#16a34a">-¥{{ Number(fd.prepay_amount).toFixed(2) }}</b></span>
            </template>
            <template v-if="fd.receive_amount > 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryThisReceipt') }}<b style="color:#16a34a">-¥{{ Number(fd.receive_amount).toFixed(2) }}</b></span>
            </template>
            <template v-if="fd.prepay_amount > 0 || fd.receive_amount > 0">
              <span style="margin-left:24px">{{ $t('sale.contract.summaryActualPending') }}<b style="color:#dc2626;font-size:16px">¥{{ finalPending.toFixed(2) }}</b></span>
            </template>
            <span class="cost-summary-item" style="margin-left:24px">
              {{ $t('sale.contract.summaryCost') }}<b style="color:rgba(29,29,31,0.35)">¥{{ totalCost.toFixed(2) }}</b>
              <el-button type="primary" link size="small" class="cost-detail-toggle" @click="costDetailVisible = !costDetailVisible">
                {{ costDetailVisible ? $t('sale.contract.btnCostCollapse') : $t('sale.contract.btnCostDetail') }}
                <el-icon class="cost-detail-arrow" :class="{ open: costDetailVisible }"><ArrowDown /></el-icon>
              </el-button>
            </span>
            <span style="margin-left:24px">{{ $t('sale.contract.summaryNetProfit') }}<b :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626', fontSize: '16px' }">¥{{ netProfit.toFixed(2) }}</b></span>
            <span style="margin-left:12px">{{ $t('sale.contract.summaryProfitRate') }}<b :style="{ color: profitRate >= 0 ? '#16a34a' : '#dc2626' }">{{ profitRate.toFixed(1) }}%</b></span>
          </div>
          <div v-if="costDetailVisible" class="cost-detail-panel">
            <div class="cost-detail-head">
              <span>{{ $t('sale.contract.costDetailTitle') }}</span>
              <small>{{ $t('sale.contract.costDetailHint') }}</small>
            </div>
            <el-table :data="costDetailRows" size="small" border style="width:100%">
              <el-table-column prop="goods_name" :label="$t('sale.contract.colGoodsName')" min-width="180" show-overflow-tooltip />
              <el-table-column prop="goods_sn" :label="$t('sale.contract.colCode')" width="110" show-overflow-tooltip />
              <el-table-column :label="$t('sale.contract.colQty')" width="90" align="right">
                <template #default="{ row }">{{ Number(row.num || 0).toFixed(2) }} {{ row.unit_name || '' }}</template>
              </el-table-column>
              <el-table-column :label="$t('sale.contract.colAvgCost')" width="110" align="right">
                <template #default="{ row }">¥{{ Number(row.base_unit_cost || 0).toFixed(4) }}</template>
              </el-table-column>
              <el-table-column :label="$t('sale.contract.colUnitCost')" width="120" align="right">
                <template #default="{ row }">¥{{ Number(row.unit_cost || 0).toFixed(4) }}</template>
              </el-table-column>
              <el-table-column :label="$t('sale.contract.colCostSubtotal')" width="110" align="right">
                <template #default="{ row }"><strong>¥{{ Number(row.total_cost || 0).toFixed(2) }}</strong></template>
              </el-table-column>
              <el-table-column prop="warehouse_name" :label="$t('sale.contract.colWarehouse')" width="120" show-overflow-tooltip />
              <el-table-column prop="cost_source" :label="$t('sale.contract.colCostSource')" width="120">
                <template #default="{ row }">
                  <el-tag size="small" :type="row.cost_source === '仓库平均成本' ? 'success' : row.cost_source === '商品档案成本价' ? 'info' : row.cost_source === 'BOM核算' ? 'primary' : 'warning'">
                    {{ row.cost_source }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" :customer-id="fd.customer_id" @confirm="onGoodsConfirm" />

    <!-- 从已审核单据导入退回商品 -->
    <!-- 从销售合同导入退回商品 -->
    <el-dialog v-model="exchangeOrderPickerVisible" :title="$t('sale.contract.dialogExchangeOrder')" width="800px" append-to-body>
      <el-table :data="exchangeOrderPickerList" v-loading="exchangeOrderPickerLoading" border size="small" style="width:100%">
        <el-table-column prop="order_no" :label="$t('sale.contract.colContractNo2')" width="170" />
        <el-table-column :label="$t('sale.contract.colCustomer')" width="140">
          <template #default="{ row }">{{ row.customer_name || row.contact_name || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.contract.colGoods')" min-width="220">
          <template #default="{ row }">
            <span v-for="(item, i) in parseItems(row.goods_info).slice(0, 3)" :key="i" style="margin-right:6px">
              {{ item.goods_name }}×{{ item.num }}
            </span>
            <span v-if="parseItems(row.goods_info).length > 3" style="color:#999">…</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('sale.contract.colAmount')" width="100" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount || 0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="created_at" :label="$t('sale.contract.colDate')" width="100">
          <template #default="{ row }">{{ fmtDt(row.created_at) }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.contract.colAction')" width="80" align="center">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="importFromExchangeOrder(row)">{{ $t('sale.contract.btnImport') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="exchangeOrderPickerVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
      </template>
    </el-dialog>

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" :title="$t('sale.contract.dialogManualAdd')" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item :label="$t('sale.contract.labelGoodsNameReq')" :rules="[{ required: true }]">
          <el-input v-model="manualForm.goods_name" :placeholder="$t('sale.contract.placeholderGoodsNameInput')" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelGoodsCode')">
          <el-input v-model="manualForm.goods_sn" :placeholder="$t('sale.contract.placeholderGoodsCodeOpt')" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelSpecModel2')">
          <el-input v-model="manualForm.spec" :placeholder="$t('sale.contract.placeholderSpecOpt')" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelUnit2')">
          <el-input v-model="manualForm.unit_name" :placeholder="$t('sale.contract.placeholderUnitExample')" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelQty')">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelPriceWithTax')">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmManualAdd">{{ $t('sale.contract.btnConfirmAdd') }}</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="`${$t('sale.contract.dialogBatchEdit')} ${batchEditLabel}`" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" @click="confirmBatchEdit">{{ $t('sale.contract.btnConfirm') }}</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增客户弹框 -->
    <el-dialog v-model="quickAddCustomerVisible" :title="$t('sale.contract.dialogQuickAddCustomer')" width="360px" append-to-body>
      <el-form :model="quickCustomerForm" label-width="70px">
        <el-form-item :label="$t('sale.contract.labelCustomerNameReq')" required>
          <el-input v-model="quickCustomerForm.nickname" :placeholder="$t('sale.contract.placeholderCustomerNameInput')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddCustomerVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" :loading="quickCustomerSaving" @click="confirmQuickAddCustomer">{{ $t('sale.contract.btnConfirmCreate') }}</el-button>
      </template>
    </el-dialog>

    <!-- 选择报价单弹框 -->
    <el-dialog v-model="offerPickerVisible" :title="$t('sale.contract.dialogOfferPicker')" width="880px" append-to-body>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <el-input v-model="offerPickerNo" :placeholder="$t('sale.contract.placeholderOfferNo')" clearable style="width:220px"
          @input="onOfferPickerSearch" />
        <el-input v-model="offerPickerCustomer" :placeholder="$t('sale.contract.placeholderOfferCustomer')" clearable style="width:220px"
          @input="onOfferPickerSearch" />
      </div>
      <el-table
        ref="offerTableRef"
        v-loading="offerLoading"
        :data="offerOptions"
        border
        height="360"
        highlight-current-row
        @current-change="onOfferCurrentChange"
        @row-dblclick="confirmOfferPick"
      >
        <el-table-column type="index" width="50" align="center" />
        <el-table-column prop="offer_no" :label="$t('sale.contract.colOfferNo')" min-width="160" />
        <el-table-column :label="$t('sale.contract.colCustomerName')" min-width="140">
          <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.contract.colOfferDate')" width="110">
          <template #default="{ row }">{{ fmtDt(row.offer_date || row.create_time) }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.contract.colOfferExpire')" width="110">
          <template #default="{ row }">{{ fmtDt(row.expire_date) || '—' }}</template>
        </el-table-column>
        <el-table-column :label="$t('sale.contract.colOfferAmount')" width="120" align="right">
          <template #default="{ row }">¥{{ calcOfferAmount(row).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="offerPickerVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" :disabled="!selectedOffer" @click="confirmOfferPick">{{ $t('sale.contract.btnBringIn') }}</el-button>
      </template>
    </el-dialog>

    <!-- 附加费用付款弹窗 -->
    <el-dialog v-model="feePayVisible" :title="`${feePayForm.feeName} ${$t('sale.contract.feePayDialogTitle')}`" width="420px" append-to-body>
      <el-form :model="feePayForm" label-width="90px">
        <el-form-item :label="$t('sale.contract.labelSaleOrder')">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ feePayForm.orderSn }} · {{ feePayForm.customerName }}</span>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelFeeType')">
          <span style="font-weight:600">{{ feePayForm.feeName }}</span>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelFeeAmount')">
          <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelPayAccount')">
          <el-select v-model="feePayForm.fund_id" :placeholder="$t('sale.contract.placeholderSelectAccount2')" filterable style="width:100%" @change="onFeePayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelPayContact')">
          <el-input v-model="feePayForm.contact_name" :placeholder="$t('sale.contract.placeholderPayContact')" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelPayDate')">
          <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelRemark2')">
          <el-input v-model="feePayForm.remark" :placeholder="$t('sale.contract.placeholderOptional')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feePayVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" :loading="feePaySubmitting" @click="submitFeePay">{{ $t('sale.contract.btnConfirmPay') }}</el-button>
      </template>
    </el-dialog>

    <!-- 附加费用管理弹窗（列表已审核后补充/编辑费用） -->
    <el-dialog v-model="feeManageVisible" :title="$t('sale.contract.dialogManageFees')" width="620px" append-to-body>
      <div style="font-size:13px;color:rgba(29,29,31,0.5);margin-bottom:12px">
        {{ feeManageRow?.customer_name }} · {{ getContractSn(feeManageRow || {}) }}
      </div>
      <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <el-select v-model="fee.name" size="small" style="width:130px" filterable allow-create default-first-option :placeholder="$t('sale.contract.placeholderFeeType')">
          <el-option :label="$t('sale.contract.feeTypeExpress')" value="快递/物流" />
          <el-option :label="$t('sale.contract.feeTypePackaging')" value="包装支出" />
          <el-option :label="$t('sale.contract.feeTypePromotion')" value="推广费/线上" />
          <el-option :label="$t('sale.contract.feeTypeToll')" value="路费/收费站" />
          <el-option :label="$t('sale.contract.feeTypeLaborService')" value="劳务费" />
          <el-option :label="$t('sale.contract.feeTypeOther')" value="其他支出" />
        </el-select>
        <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:110px" :placeholder="$t('sale.contract.placeholderFeeAmount')" />
        <el-select v-model="fee.bearer" size="small" style="width:100px">
          <el-option :label="$t('sale.contract.feeBearerBuyer')" value="buyer" />
          <el-option :label="$t('sale.contract.feeBearerSeller')" value="seller" />
        </el-select>
        <el-input v-model="fee.supplier_name" size="small" style="width:120px" :placeholder="$t('sale.contract.placeholderFeeSupplier')" />
        <el-tag v-if="feeManageRow && getFeeItemPayStatus({ ...feeManageRow, fee_items: feeManageItems }, idx).label !== '—'"
          :type="getFeeItemPayStatus({ ...feeManageRow, fee_items: feeManageItems }, idx).type" size="small">
          {{ getFeeItemPayStatus({ ...feeManageRow, fee_items: feeManageItems }, idx).label }}
        </el-tag>
        <el-button type="danger" link size="small" :icon="Delete" @click="feeManageItems.splice(idx, 1)" />
      </div>
      <el-button type="primary" link size="small" :icon="Plus" @click="feeManageItems.push({ name: '快递/物流', amount: 0, bearer: 'buyer', supplier_name: '' })">
        {{ $t('sale.contract.btnAddFeeItem') }}
      </el-button>
      <template #footer>
        <el-button @click="feeManageVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" :loading="feeManageSaving" @click="submitFeeManage">{{ $t('sale.contract.btnSaveFees') }}</el-button>
      </template>
    </el-dialog>

    <!-- 收款弹窗 -->
    <el-dialog v-model="collectDialogVisible" :title="$t('sale.contract.dialogCollect')" width="400px" append-to-body>
      <el-form :model="collectForm" label-width="90px">
        <el-form-item :label="$t('sale.contract.labelContractRef')">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ collectForm.orderSn }} · {{ collectForm.customerName }}</span>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelUnpaidAmount')">
          <span style="font-size:15px;font-weight:700;color:#dc2626">¥{{ collectForm.unpaid.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelThisCollect')">
          <el-input-number v-model="collectForm.amount" :min="0.01" :max="collectForm.unpaid" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelCollectAccount')">
          <el-select v-model="collectForm.fund_id" :placeholder="$t('sale.contract.placeholderSelectAccount')" filterable style="width:100%" @change="onCollectFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelCollectDate')">
          <el-date-picker v-model="collectForm.collect_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('sale.contract.labelRemark2')">
          <el-input v-model="collectForm.remark" :placeholder="$t('sale.contract.placeholderOptional')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="collectDialogVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary" :loading="collectSubmitting" @click="submitCollect">{{ $t('sale.contract.btnConfirmCollect') }}</el-button>
      </template>
    </el-dialog>

    <!-- 克重换算弹窗 -->
    <el-dialog v-model="wcVisible" :title="$t('sale.contract.dialogWeightCalc')" width="340px" align-center append-to-body>
      <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0">
        <div style="background:#f8fafc;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:#1e293b">{{ wcRow?.goods_name }}</span>
          <span style="font-size:13px;color:#2563eb;font-weight:700">¥{{ wcRow?.price }}/{{ wcRow?.unit_name }}</span>
        </div>
        <div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <div @click="wcMode='weight'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='weight' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            {{ $t('sale.contract.wcModeWeight') }}
          </div>
          <div v-if="!isGramUnit(wcRow?.unit_name)" @click="wcMode='unit'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='unit' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            {{ $t('sale.contract.wcModeUnit') }}{{ wcRow?.unit_name }}{{ $t('sale.contract.wcModeUnitSuffix') }}
          </div>
          <div @click="wcMode='amount'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='amount' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            {{ $t('sale.contract.wcModeAmount') }}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <span style="width:64px;font-size:13px;color:#64748b;flex-shrink:0">
            {{ wcMode === 'weight' ? $t('sale.contract.wcLabelGrams') : wcMode === 'unit' ? wcRow?.unit_name : $t('sale.contract.wcLabelAmount') }}
          </span>
          <el-input-number v-if="wcMode==='weight'" v-model="wcGrams"
            :min="0" :precision="1" controls-position="right" style="flex:1" />
          <el-input-number v-else-if="wcMode==='unit'" v-model="wcDirectUnit"
            :min="0" :precision="4" controls-position="right" style="flex:1" />
          <el-input-number v-else v-model="wcTargetAmount"
            :min="0" :precision="2" controls-position="right" style="flex:1" />
        </div>
        <div v-if="wcMode==='weight'" style="display:flex;flex-wrap:wrap;gap:6px">
          <div v-for="preset in wcJinPresets" :key="preset.label"
            @click="wcGrams = preset.grams"
            :style="wcGrams === preset.grams
              ? 'background:#2563eb;color:#fff;border-color:#2563eb'
              : 'background:#f8fafc;color:#64748b;border-color:#e2e8f0'"
            style="padding:5px 12px;border:1.5px solid;border-radius:20px;font-size:13px;cursor:pointer;transition:all 0.12s;user-select:none">
            {{ preset.label }}
          </div>
        </div>
        <div style="background:#f0f9ff;border-radius:10px;padding:14px;text-align:center">
          <template v-if="wcMode==='weight'">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ $t('sale.contract.wcResultQty') }}</div>
            <div style="font-size:28px;font-weight:700;color:#2563eb">{{ wcResultNum.toFixed(isGramUnit(wcRow?.unit_name) ? 1 : 4) }} {{ wcRow?.unit_name }}</div>
            <div v-if="!isGramUnit(wcRow?.unit_name)" style="font-size:12px;color:#94a3b8;margin-top:4px">{{ wcGrams }}{{ $t('sale.contract.wcLabelGrams') }} ÷ {{ wcGramsPerBase }}{{ $t('sale.contract.wcLabelGrams') }}/{{ wcRow?.unit_name }}</div>
          </template>
          <template v-else-if="wcMode==='unit'">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ $t('sale.contract.wcResultAmount') }}</div>
            <div style="font-size:28px;font-weight:700;color:#2563eb">¥{{ (wcDirectUnit * (wcRow?.price || 0)).toFixed(2) }}</div>
          </template>
          <template v-else>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ $t('sale.contract.wcReverseWeight') }}</div>
            <div style="font-size:28px;font-weight:700;color:#059669">{{ wcReverseGrams.toFixed(1) }} {{ $t('sale.contract.wcLabelGrams') }}</div>
            <div v-if="!isGramUnit(wcRow?.unit_name)" style="font-size:12px;color:#94a3b8;margin-top:4px">¥{{ wcTargetAmount }} ÷ ¥{{ wcRow?.price }}/{{ wcRow?.unit_name }} × {{ wcGramsPerBase }}</div>
          </template>
        </div>
      </div>
      <template #footer>
        <el-button @click="wcVisible = false">{{ $t('sale.contract.btnCancel') }}</el-button>
        <el-button type="primary"
          :disabled="wcMode==='weight' ? wcResultNum <= 0 : wcMode==='unit' ? wcDirectUnit <= 0 : wcReverseNum <= 0"
          @click="confirmWC">{{ $t('sale.contract.btnFillQty') }}</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { useReconcile } from '@/composables/useReconcile'
import { ref, reactive, computed, onMounted, onActivated, nextTick, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Delete, Search, ArrowLeft, EditPen, Document, Upload, Paperclip, ArrowDown } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { deleteSaleOutStockFlows } from '@/utils/stockEffect'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getContractList, createContract, updateContract, deleteContract, auditContract, getContractDetail, getOfferList, getOfferDetail, auditOffer, getSaleReturnList, getSaleOutList, createSaleOut, auditSaleOut, deleteSaleOut, createSaleExchange, auditSaleExchange, getSaleExchangeList } from '@/api/sale'
import { getUnitConvert } from '@/api/goods'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSpecList, getGoodsList, getBomList } from '@/api/goods'
import { getStaffList } from '@/api/personnel'
import { getFundList, createCollectReceipt, updateCollectReceipt, getCollectReceiptList, getPayReceiptList, createPayReceipt, deletePayReceipt, getExpenseList, createExpense, deleteExpense } from '@/api/finance'
import http from '@/api/http'
import { loadLevels, loadLevelMap, getLevelPrice, setLevelPrice, hasCustomLevelPrice, type LevelItem } from '@/utils/customerLevel'
import { getCommissionRate } from '@/utils/commission'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { showLogoForCurrentUser, brandHeaderHtmlPdf } from '@/utils/brandAssets'
import { calcExchangeDeductFromItems, calcSaleContractReceivable } from '@/utils/saleContractAmount'

const isMobile = ref(window.innerWidth <= 768)
function onResize() { isMobile.value = window.innerWidth <= 768 }
onMounted(() => window.addEventListener('resize', onResize))
onUnmounted(() => window.removeEventListener('resize', onResize))

const DRAFT_KEY = 'sale_contract_draft_from_offer'
const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const router = useRouter()
const route = useRoute()
const { t } = useI18n()

function parseRemarkTag(remark: string, tag: string): string {
  const safeTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matched = String(remark || '').match(new RegExp(`\\[${safeTag}:([^\\]]+)\\]`))
  return matched?.[1]?.trim() || ''
}

function stripContractRemarkTags(remark: string): string {
  return String(remark || '')
    .replace(/\[(NO|OID|PP|FI):[^\]]+\]\s*/g, '')
    .trim()
}

function encodeFeeItems(items: any[]): string {
  return btoa(encodeURIComponent(JSON.stringify(items)))
}

function decodeFeeItems(encoded: string): any[] {
  try { return JSON.parse(decodeURIComponent(atob(encoded))) } catch { return [] }
}

function buildContractRemark() {
  const parts = [
    fd.contract_no ? `[NO:${fd.contract_no}]` : '',
    fd.source_offer_id ? `[OID:${fd.source_offer_id}]` : '',
    Number(fd.prepay_amount || 0) > 0 ? `[PP:${Number(fd.prepay_amount || 0).toFixed(2)}]` : '',
    fd.fee_items.length > 0 ? `[FI:${encodeFeeItems(fd.fee_items)}]` : '',
    String(fd.remark || '').trim(),
  ].filter(Boolean)
  return parts.join(' ')
}

function getContractOrderSn(row: any): string {
  return String(row?.order_sn || row?.contract_no || (row?.id ? `CONTRACT-${row.id}` : '')).trim()
}

function parsePrepayAmount(remark: string): number {
  return Number(parseRemarkTag(remark, 'PP') || 0)
}

function buildContractExpenseRemark(row: any) {
  const orderSn = getContractOrderSn(row)
  return `${row?.customer_name || ''} 销售订单运费（我方承担） - ${orderSn}`.trim()
}

function isAutoContractReceiptRow(row: any, orderSn: string) {
  const sn = String(row?.order_sn || row?.order_no || '').trim()
  const remark = String(row?.remark || '')
  // 后端不保存 order_sn 字段（返回空串），改为通过 remark 识别自动收款单
  const snMatch = sn === orderSn
  const remarkMatch = remark.includes(`合同自动收款 - ${orderSn}`)
    || remark.includes(`预付款核销 - ${orderSn}`)
    || remark.includes(`一键销售收款 - ${orderSn}`)
    || (remark.includes(`审核自动生成`) && (sn === orderSn || remark.includes(orderSn)))
  return snMatch ? (remark.includes(`合同自动收款`) || remark.includes(`预付款核销`) || remark.includes(`一键销售收款`) || remark.includes(`审核自动生成`)) : remarkMatch
}

function parseItems(goodsInfo: any): any[] {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

// ── 规格选项缓存（goods_id → string[]） ──────────────────────────────────────
const goodsSpecMap = reactive<Record<number, string[]>>({})

// ── 单位换算缓存（goods_id → [{unit_name, ratio}]，ratio = 1本单位=ratio基础单位） ──
const goodsUnitMap = reactive<Record<number, { unit_name: string; ratio: number }[]>>({})

async function fetchGoodsUnits(goodsId: number) {
  if (!goodsId || goodsUnitMap[goodsId] !== undefined) return
  goodsUnitMap[goodsId] = []
  try {
    const res = await getUnitConvert(goodsId)
    const rows: any[] = res.data?.rows ?? res.data ?? []
    if (rows.length > 1) goodsUnitMap[goodsId] = rows.map((r: any) => ({ unit_name: r.unit_name, ratio: Number(r.ratio) }))
  } catch { /* ignore */ }
}

function onItemUnitChange(row: any, unitName: string) {
  const units = goodsUnitMap[row.goods_id] || []
  const targetUnit = units.find(u => u.unit_name === unitName)
  const baseUnit = units.find(u => u.ratio === 1)
  if (!targetUnit || !baseUnit) return
  // 还原基础单价，再乘以新单位换算比
  const basePrice = row.unit_ratio > 0 ? Number((row.price / row.unit_ratio).toFixed(6)) : row.price
  const baseCost = row.unit_ratio > 0 ? Number((row.cost_price / row.unit_ratio).toFixed(6)) : row.cost_price
  row.unit_ratio = targetUnit.ratio
  row.price = Number((basePrice * targetUnit.ratio).toFixed(4))
  row.cost_price = Number((baseCost * targetUnit.ratio).toFixed(4))
  row.price_no_tax = row.tax_rate > 0 ? Number((row.price / (1 + row.tax_rate / 100)).toFixed(4)) : row.price
  calcTotal()
}

// ── 克重换算（散装商品） ───────────────────────────────────────────────────────
const WEIGHT_UNITS = ['斤', 'kg', '千克', '公斤', 'KG', '克', 'g', 'G', '两']
const GRAM_UNITS = ['克', 'g', 'G']  // 本身就是克，gramsPerBase=1
function isWeightUnit(unit: string) { return WEIGHT_UNITS.includes((unit || '').trim()) }
function isGramUnit(unit: string) { return GRAM_UNITS.includes((unit || '').trim()) }

const wcVisible = ref(false)
const wcRow = ref<any>(null)
const wcMode = ref<'weight' | 'unit' | 'amount'>('weight')
const wcGrams = ref(0)
const wcDirectUnit = ref(0)
const wcTargetAmount = ref(0)
const wcGramsPerBase = ref(500) // 默认500克=1斤；克单位时=1

const wcResultNum = computed(() => {
  if (!wcGrams.value || !wcGramsPerBase.value) return 0
  return wcGrams.value / wcGramsPerBase.value
})
const wcReverseGrams = computed(() => {
  if (!wcTargetAmount.value || !wcRow.value?.price) return 0
  return (wcTargetAmount.value / wcRow.value.price) * wcGramsPerBase.value
})
const wcReverseNum = computed(() => wcReverseGrams.value / wcGramsPerBase.value)

const wcJinPresets = computed(() => {
  if (isGramUnit(wcRow.value?.unit_name)) {
    return [50, 100, 150, 200, 250, 500].map(g => ({ label: `${g}${t('sale.contract.wcLabelGrams')}`, grams: g }))
  }
  const base = wcGramsPerBase.value || 500
  return [
    { label: t('sale.contract.wcPresetHalfJin'), grams: base * 0.5 },
    { label: t('sale.contract.wcPreset1Jin'), grams: base * 1 },
    { label: t('sale.contract.wcPreset2Jin'), grams: base * 2 },
    { label: t('sale.contract.wcPreset3Jin'), grams: base * 3 },
    { label: t('sale.contract.wcPreset4Jin'), grams: base * 4 },
    { label: t('sale.contract.wcPreset5Jin'), grams: base * 5 },
  ]
})

async function openWC(row: any) {
  wcRow.value = row
  wcMode.value = 'weight'
  wcGrams.value = 0
  wcDirectUnit.value = 0
  wcTargetAmount.value = 0
  wcGramsPerBase.value = isGramUnit(row.unit_name) ? 1 : 500
  if (row.goods_id && !isGramUnit(row.unit_name)) {
    const units = goodsUnitMap[row.goods_id] || []
    const gUnit = units.find((u: any) => u.unit_name === 'g')
    if (gUnit) {
      const r = Number(gUnit.ratio)
      wcGramsPerBase.value = r > 1 ? r : (r > 0 ? 1 / r : 500)
    }
  }
  wcVisible.value = true
}

function confirmWC() {
  if (!wcRow.value) return
  let num: number
  let grams: number
  if (wcMode.value === 'weight') {
    num = wcResultNum.value
    grams = wcGrams.value
  } else if (wcMode.value === 'unit') {
    num = wcDirectUnit.value
    grams = num * wcGramsPerBase.value
  } else {
    num = wcReverseNum.value
    grams = wcReverseGrams.value
  }
  wcRow.value.num = parseFloat(num.toFixed(4))
  const baseName = wcRow.value.goods_name.replace(/ \d+(\.\d+)?g$/, '')
  wcRow.value.goods_name = `${baseName} ${grams.toFixed(1)}g`
  calcItemTax(wcRow.value)
  calcTotal()
  wcVisible.value = false
}

async function fetchGoodsSpecs(goodsId: number) {
  if (!goodsId || goodsSpecMap[goodsId]?.length > 0) return
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

// spec 字段兼作 unit_linked_goods JSON 存储，显示时过滤掉 JSON 字符串
function parseDisplaySpec(raw: string | undefined | null): string {
  if (!raw) return ''
  const s = String(raw).trim()
  if (s.startsWith('{') || s.startsWith('[')) return ''
  return s
}

async function fillMissingSpecs(items: any[]) {
  const missing = items.filter(i => i.goods_id && !i.spec)
  if (!missing.length) return
  const needIds = new Set(missing.map(i => Number(i.goods_id)))
  const specMap: Record<number, string> = {}
  for (let page = 1; page <= 20 && needIds.size > 0; page++) {
    try {
      const res = await getGoodsList({ page, size: 20 })
      const rows: any[] = res.data?.rows ?? []
      if (!rows.length) break
      for (const g of rows) {
        const ds = parseDisplaySpec(g.spec)
        if (needIds.has(Number(g.id)) && ds) {
          specMap[Number(g.id)] = ds
          needIds.delete(Number(g.id))
        }
      }
    } catch { break }
  }
  for (const item of missing) {
    if (specMap[Number(item.goods_id)]) item.spec = specMap[Number(item.goods_id)]
  }
}

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

// ── 客户等级 ──────────────────────────────────────────────────────────────────
const levelOptions = ref<LevelItem[]>(loadLevels())
const levelMap = loadLevelMap()

const savedLevelPriceIds = ref<Set<number>>(new Set())
const _levelPriceKey = ref(0)

function hasLevelPrice(goodsId: number): boolean {
  if (savedLevelPriceIds.value.has(goodsId)) return true
  if (!fd.level_id) return true
  return getLevelPrice(Number(fd.level_id), goodsId) !== null
}

function isLevelPriceDifferent(row: any): boolean {
  _levelPriceKey.value // reactive dependency
  if (!fd.level_id || !row.goods_id) return false
  const stored = getLevelPrice(Number(fd.level_id), row.goods_id)
  if (stored === null) return false
  return Math.abs(Number(row.price || 0) - stored) > 0.0001
}

function saveAsLevelPrice(row: any) {
  if (!fd.level_id || !row.goods_id) return
  setLevelPrice(Number(fd.level_id), row.goods_id, row.price)
  savedLevelPriceIds.value = new Set([...savedLevelPriceIds.value, row.goods_id])
  _levelPriceKey.value++
  ElMessage.success(`${t('sale.contract.msgLevelPriceRecorded')}${row.goods_name} ${t('sale.contract.msgLevelPriceSuffix')} ¥${row.price}`)
}

function updateLevelPrice(row: any) {
  if (!fd.level_id || !row.goods_id) return
  setLevelPrice(Number(fd.level_id), row.goods_id, row.price)
  _levelPriceKey.value++
  ElMessage.success(`${t('sale.contract.msgLevelPriceUpdated')}${row.goods_name} ${t('sale.contract.msgLevelPriceSuffix')} → ¥${row.price}`)
}

// ── 资金账户 ──────────────────────────────────────────────────────────────────
const fundOptions = ref<any[]>([])
async function loadFunds() {
  try {
    const res = await getFundList({ list_rows: 100 })
    fundOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ }
}

// ── 员工选项 ──────────────────────────────────────────────────────────────────
const staffOptions = ref<any[]>([])
async function loadStaff() {
  try {
    const res = await getStaffList({ list_rows: 200 })
    staffOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ }
}

function onAdminChange(id: any) {
  const s = staffOptions.value.find(x => x.id === id)
  fd.admin_name = s?.name ?? ''
  fd.admin_id = id
  // 自动带入该员工默认提成比例，可手动覆盖
  fd.commission_rate = getCommissionRate(id)
}

function goToCommissionSetting() {
  router.push('/sale/commission-setting')
}

// ── 列表 ─────────────────────────────────────────────────────────────────────
const tableRef = ref<InstanceType<typeof ScTable>>()
const formBodyRef = ref<HTMLElement>()
const { toggle: toggleReconcile, ids: reconciledIds } = useReconcile('reconcile_sale_contract', tableRef)
const highlightName = ref('')
const contractSelectedRows = ref<any[]>([])

const GROUPS_STORAGE_KEY = 'contract_folded_groups'
function loadGroups(): Array<{key: string, ids: Set<number>, name: string}> {
  try {
    const raw = localStorage.getItem(GROUPS_STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw).map((g: any) => ({ ...g, ids: new Set<number>(g.ids) }))
  } catch { return [] }
}
function persistGroups() {
  try {
    const s = foldedGroups.value.map(g => ({ key: g.key, name: g.name, ids: [...g.ids] }))
    localStorage.setItem(GROUPS_STORAGE_KEY, JSON.stringify(s))
  } catch {}
}
const foldedGroups = ref<Array<{key: string, ids: Set<number>, name: string}>>(loadGroups())
const lastAllRows = ref<any[]>([])
const editingGroupKey = ref('')
const editingGroupName = ref('')
const groupNameInputRef = ref<any>(null)
function startEditGroupName(key: string, currentName: string) {
  editingGroupKey.value = key
  editingGroupName.value = currentName || ''
  nextTick(() => groupNameInputRef.value?.focus())
}
function saveGroupName() {
  const group = foldedGroups.value.find(g => g.key === editingGroupKey.value)
  if (group) group.name = editingGroupName.value.trim() || group.name
  editingGroupKey.value = ''
  editingGroupName.value = ''
  persistGroups()
  tableRef.value?.refresh()
}
function unfoldGroup(groupKey: string) {
  foldedGroups.value = foldedGroups.value.filter(g => g.key !== groupKey)
  persistGroups()
  tableRef.value?.refresh()
}
function collapseSelected(selRows: any[], clearSelection: () => void) {
  const realRows = selRows.filter((r: any) => !r._isGroup)
  if (!realRows.length) return
  const ids = new Set<number>(realRows.map((r: any) => r.id))
  const name = `${t('sale.contract.defaultGroupName')}${foldedGroups.value.length + 1}`
  foldedGroups.value.push({ key: `group_${Date.now()}`, ids, name })
  persistGroups()
  clearSelection()
  tableRef.value?.refresh()
}
function addToGroup(groupKey: string, selRows: any[], clearSelection: () => void) {
  const realRows = selRows.filter((r: any) => !r._isGroup)
  if (!realRows.length) return
  const group = foldedGroups.value.find(g => g.key === groupKey)
  if (!group) return
  realRows.forEach((r: any) => group.ids.add(r.id))
  persistGroups()
  clearSelection()
  tableRef.value?.refresh()
}
function addRowToGroup(rowId: number, groupKey: string) {
  if (groupKey === '__new__') {
    const name = `${t('sale.contract.defaultGroupName')}${foldedGroups.value.length + 1}`
    foldedGroups.value.push({ key: `group_${Date.now()}`, ids: new Set([rowId]), name })
  } else {
    const group = foldedGroups.value.find(g => g.key === groupKey)
    if (!group) return
    group.ids.add(rowId)
  }
  persistGroups()
  tableRef.value?.refresh()
}
function handleGroupToolbarCmd(cmd: string) {
  if (cmd === '__new__') {
    const name = `${t('sale.contract.defaultGroupName')}${foldedGroups.value.length + 1}`
    foldedGroups.value.push({ key: `group_${Date.now()}`, ids: new Set(), name })
    persistGroups()
    tableRef.value?.refresh()
  } else if (cmd.startsWith('__dissolve__')) {
    unfoldGroup(cmd.replace('__dissolve__', ''))
  }
}
const foldedGroupsMeta = computed(() => foldedGroups.value.map(g => {
  const rows = lastAllRows.value.filter((r: any) => g.ids.has(r.id))
  const dates = rows.map((r: any) => (r.order_date || r.sign_date || r.created_at || '').slice(0, 10)).filter(Boolean).sort()
  return { key: g.key, name: g.name, count: g.ids.size, minDate: dates[0] || '', maxDate: dates[dates.length - 1] || '' }
}))
const searchForm = reactive<any>({ contract_no: '', customer_name: route.query.customer_name ? String(route.query.customer_name) : '', goods_name: '', status: '', start_date: '', end_date: '' })
const dateRange = ref<any>([])
const datePickerKey = ref(0)
const dateShortcuts = computed(() => [
  { text: t('sale.contract.shortcutLastMonth'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 1); return [s, e] } },
  { text: t('sale.contract.shortcutLast3Months'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 3); return [s, e] } },
  { text: t('sale.contract.shortcutLast6Months'), value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 6); return [s, e] } },
  { text: t('sale.contract.shortcutThisYear'), value: () => { const e = new Date(); const s = new Date(e.getFullYear(), 0, 1); return [s, e] } },
  { text: t('sale.contract.shortcutLastYear'), value: () => { const y = new Date().getFullYear() - 1; return [new Date(y, 0, 1), new Date(y, 11, 31)] } },
])
function getContractRowDate(row: any): string {
  return String(row?.order_date || row?.sign_date || row?.created_at || row?.create_time || '').slice(0, 10)
}
function onDateChange(val: any) {
  if (val && val.length === 2) { searchForm.start_date = val[0]; searchForm.end_date = val[1] }
  else { searchForm.start_date = ''; searchForm.end_date = '' }
}
function onSearchReset() {
  dateRange.value = []
  datePickerKey.value++
  searchForm.start_date = ''
  searchForm.end_date = ''
  searchForm.goods_name = ''
}
const filteredContractApi = async (params: any) => {
  const { page: reqPage, list_rows: reqSize, ...restParams } = params
  // 未收款是客户端筛选，传给后端时转为 status=1（只拉已审核）
  const apiParams = { ...restParams, page: 1, list_rows: 10000 }
  if (restParams.status === 'unpaid' || restParams.status === 'paid') apiParams.status = 1
  if (restParams.status === 'unreconciled') delete apiParams.status
  const res = await getContractList(apiParams)
  // 线上平台订单（美团/微信小店/拼多多/抖音/淘宝/小红书）只在各自页面显示，不在销售合同里出现
  const ONLINE_CUSTOMER_IDS = new Set([63, 10, 12, 7, 8, 11])
  const allRows: any[] = (res.data?.rows ?? []).filter((r: any) => !ONLINE_CUSTOMER_IDS.has(Number(r.customer_id)))
  lastAllRows.value = allRows
  const allFoldedIds = new Set(foldedGroups.value.flatMap(g => [...g.ids]))
  const s = searchForm.start_date
  const e = searchForm.end_date
  let filtered = (s || e)
    ? allRows.filter((row: any) => {
        const date = getContractRowDate(row)
        if (s && date < s) return false
        if (e && date > e) return false
        return true
      })
    : allRows
  const gn = (searchForm.goods_name || '').trim()
  if (gn) {
    const kw = gn.toLowerCase()
    filtered = filtered.filter((row: any) => {
      const items: any[] = Array.isArray(row.goods_info) ? row.goods_info
        : (typeof row.goods_info === 'string' ? (() => { try { return JSON.parse(row.goods_info) } catch { return [] } })() : [])
      return items.some((item: any) => (item.goods_name || '').toLowerCase().includes(kw) || (item.goods_sn || '').toLowerCase().includes(kw))
    })
  }
  // 未收款：只保留已审核且收款状态为"未收款"的行
  if (searchForm.status === 'unpaid') {
    filtered = filtered.filter((row: any) => getReceiveStatus(row).code === 'unpaid')
  }
  // 已收款：只保留已审核且收款状态为"已收清"的行
  if (searchForm.status === 'paid') {
    filtered = filtered.filter((row: any) => getReceiveStatus(row).code === 'full-paid')
  }
  // 未核对：只保留未在本地标记为已核对的行
  if (searchForm.status === 'unreconciled') {
    filtered = filtered.filter((row: any) => !reconciledIds.value.has(Number(row.id)))
  }
  // 按日期降序排列（原先由 sort-by prop 处理，现移至此处）
  filtered.sort((a: any, b: any) => {
    const da = getContractRowDate(a), db = getContractRowDate(b)
    return db.localeCompare(da) || Number(b.id || 0) - Number(a.id || 0)
  })
  // 排除已编组的行
  if (allFoldedIds.size > 0) {
    filtered = filtered.filter((row: any) => !allFoldedIds.has(row.id))
  }
  // 商品关键词匹配函数（复用，用于穿透分组）
  const matchesGoods = (row: any) => {
    if (!gn) return true
    const kw = gn.toLowerCase()
    const items: any[] = Array.isArray(row.goods_info) ? row.goods_info
      : (typeof row.goods_info === 'string' ? (() => { try { return JSON.parse(row.goods_info) } catch { return [] } })() : [])
    return items.some((item: any) => (item.goods_name || '').toLowerCase().includes(kw) || (item.goods_sn || '').toLowerCase().includes(kw))
  }

  // 未收款筛选时不注入分组行；商品关键词筛选穿透分组内部
  const groupRows = (searchForm.status === 'unpaid' || searchForm.status === 'paid' || searchForm.status === 'unreconciled') ? [] : foldedGroups.value.map(g => {
    let rows = allRows
      .filter((r: any) => g.ids.has(r.id))
      .sort((a: any, b: any) => getContractRowDate(b).localeCompare(getContractRowDate(a)) || Number(b.id || 0) - Number(a.id || 0))
    if (gn) rows = rows.filter(matchesGoods)  // 商品关键词穿透
    if (!rows.length) return null              // 组内无匹配则整组不显示
    const dates = rows.map((r: any) => getContractRowDate(r)).filter(Boolean).sort()
    const minDate = dates[0] || ''
    const maxDate = dates[dates.length - 1] || ''
    return {
      _isGroup: true,
      _groupKey: g.key,
      _groupName: g.name,
      _groupRows: rows,
      _minDate: minDate,
      _maxDate: maxDate,
      id: `_grp_${g.key}`,
      order_date: maxDate,
      sign_date: maxDate,
    }
  }).filter(Boolean) as any[]
  const allWithGroups = [...groupRows, ...filtered].sort((a: any, b: any) => {
    const da = getContractRowDate(a), db = getContractRowDate(b)
    return db.localeCompare(da) || Number(b.id || 0) - Number(a.id || 0)
  })
  const page = Number(reqPage) || 1
  // 有筛选条件时不分页，直接显示全部
  const hasFilter = !!(searchForm.contract_no || searchForm.customer_name || searchForm.goods_name || searchForm.status !== '' || searchForm.start_date || searchForm.end_date)
  if (hasFilter) {
    return { data: { rows: allWithGroups, total: allWithGroups.length } }
  }
  const size = Number(reqSize) || 20
  return { data: { rows: allWithGroups.slice((page - 1) * size, page * size), total: allWithGroups.length } }
}
if (route.query.customer_name) highlightName.value = String(route.query.customer_name)
const showForm = ref(false)
const isReadonly = ref(false)
const showExchangeGroup = ref(false)

// ── 收款状态映射 ──────────────────────────────────────────────────────────────
const receiptMap = ref<Record<string, number>>({}) // key: order_sn, value: total received (cash only)
const returnCreditMap = ref<Record<string, number>>({}) // key: order_sn, value: return credit (非现金，只影响待收)
// 单据支出付款 Map：contract_order id → 已付金额
const saleExpensePaidById = ref<Record<number, number>>({})
// 附加费用付款 Map："orderId:feeName" → 已付金额
const feeItemPaidMap = ref<Record<string, number>>({})

async function loadReceiptMap() {
  try {
    const res = await getCollectReceiptList({ list_rows: 2000 })
    const rows: any[] = res?.data?.rows ?? []
    const map: Record<string, number> = {}
    const noSnReceipts: any[] = []

    for (const r of rows) {
      const sn = String(r?.order_sn || r?.order_no || '').trim()
      if (sn) {
        map[sn] = (map[sn] || 0) + Number(r.amount || 0)
      } else {
        noSnReceipts.push(r)
      }
    }

    // 来自应收款模块的收款单没有 order_sn，用 FIFO 按客户分配到最老的未收合同
    // （与 Receivable.vue 保持一致：sn 无法匹配到已审核合同的收款也归入 FIFO 池）
    {
      let contracts = lastAllRows.value.filter((r: any) => Number(r.status) === 1)
      if (!contracts.length) {
        const cRes = await getContractList({ list_rows: 10000, status: 1 })
        contracts = (cRes?.data?.rows ?? []).filter((r: any) => Number(r.status) === 1)
      }

      // 构建合同单号集合，用于判断收款单 sn 是否有效
      const contractSnSet = new Set<string>()
      for (const c of contracts) {
        if (c.order_sn) contractSnSet.add(String(c.order_sn))
        if (c.order_no)  contractSnSet.add(String(c.order_no))
      }

      // 重新分类：sn 能匹配合同 → direct map；sn 为空或匹配不到 → FIFO 池
      const map2: Record<string, number> = {}
      const unmatchedReceipts: any[] = []
      for (const r of rows) {
        const sn = String(r?.order_sn || r?.order_no || '').trim()
        if (sn && contractSnSet.has(sn)) {
          map2[sn] = (map2[sn] || 0) + Number(r.amount || 0)
        } else {
          unmatchedReceipts.push(r)
        }
      }
      // 合并到 map（覆盖最初的简单分类）
      Object.assign(map, map2)

      // 按客户分组，汇总无法直接匹配的收款金额
      const byCustomer = new Map<string, number>()
      for (const r of unmatchedReceipts) {
        const key = String(r.customer_id || r.contact_id || r.customer_name || '')
        if (!key) continue
        byCustomer.set(key, (byCustomer.get(key) || 0) + Number(r.amount || 0))
      }

      for (const [custKey, pool] of byCustomer) {
        const custContracts = contracts.filter((c: any) =>
          String(c.customer_id || '') === custKey || c.customer_name === custKey
        )
        // 与 Receivable.vue 一致：按 order_date 升序 FIFO（最老的合同优先抵扣）
        custContracts.sort((a: any, b: any) =>
          new Date(a.order_date || a.created_at || 0).getTime() -
          new Date(b.order_date || b.created_at || 0).getTime()
        )
        let remaining = pool
        for (const c of custContracts) {
          if (remaining <= 0.005) break
          const sn = String(c.order_sn || c.order_no || '').trim()
          if (!sn) continue
          const contractTotal = calcContractAmount(c)
          const alreadyPaid = map[sn] || 0
          const unpaid = Math.max(0, contractTotal - alreadyPaid)
          if (unpaid <= 0.005) continue
          const apply = Math.min(unpaid, remaining)
          map[sn] = alreadyPaid + apply
          remaining -= apply
        }
      }
    }

    // 退货冲减：已审核销售退货按客户 FIFO 抵扣合同待收（不影响已收金额，只减待收）
    const rcMap: Record<string, number> = {}
    try {
      const retRes = await http.get('/stock/SaleReturnOrder/index', { params: { status: 1, list_rows: 1000 } })
      const retRows: any[] = retRes?.data?.rows ?? []
      const returnByCustomer = new Map<string, number>()
      for (const r of retRows) {
        if (Number(r.status) !== 1) continue
        const key = String(r.customer_id || r.customer_name || '').trim()
        if (!key) continue
        const amt = Number(r.return_amount ?? r.total_amount ?? 0)
        if (amt > 0) returnByCustomer.set(key, (returnByCustomer.get(key) ?? 0) + amt)
      }
      if (returnByCustomer.size > 0) {
        let contracts2 = lastAllRows.value.filter((r: any) => Number(r.status) === 1)
        if (!contracts2.length) {
          const cRes2 = await getContractList({ list_rows: 10000, status: 1 })
          contracts2 = (cRes2?.data?.rows ?? []).filter((r: any) => Number(r.status) === 1)
        }
        for (const [custKey, credit] of returnByCustomer) {
          const custContracts = contracts2.filter((c: any) =>
            String(c.customer_id || '') === custKey || c.customer_name === custKey
          )
          custContracts.sort((a: any, b: any) =>
            new Date(a.order_date || a.created_at || 0).getTime() -
            new Date(b.order_date || b.created_at || 0).getTime()
          )
          let remaining = credit
          for (const c of custContracts) {
            if (remaining <= 0.005) break
            const sn = String(c.order_sn || c.order_no || '').trim()
            if (!sn) continue
            const contractTotal = calcContractAmount(c)
            const cashPaid = map[sn] || 0
            const unpaid = Math.max(0, contractTotal - cashPaid)
            if (unpaid <= 0.005) continue
            const apply = Math.min(unpaid, remaining)
            rcMap[sn] = (rcMap[sn] || 0) + apply  // 写入退货信用，不改 map（已收）
            remaining -= apply
          }
        }
      }
    } catch { /* ignore */ }
    returnCreditMap.value = rcMap

    receiptMap.value = map
  } catch { /* ignore */ }
  // 同时加载付款 map（单据支出 + 附加费用）
  try {
    const res2 = await getPayReceiptList({ list_rows: 2000 })
    const rows2: any[] = res2?.data?.rows ?? []
    const expMap: Record<number, number> = {}
    const feeMap: Record<string, number> = {}
    for (const r of rows2) {
      const amt = Number(r.amount || 0)
      if (!amt) continue
      const remark = String(r?.remark || '')
      const mExp = remark.match(/销售单据支出 #(\d+)/)
      if (mExp) {
        const id = Number(mExp[1])
        expMap[id] = (expMap[id] || 0) + amt
      }
      const mFee = remark.match(/销售订单附加费用\s*#(\d+):(.+?)(?:\s|\[|$)/)
      if (mFee) {
        const id = Number(mFee[1])
        const feeName = mFee[2].trim()
        const key = `${id}:${feeName}`
        feeMap[key] = (feeMap[key] || 0) + amt
      }
    }
    saleExpensePaidById.value = expMap
    feeItemPaidMap.value = feeMap
  } catch { /* ignore */ }
}

function getContractFeeItems(row: any): { name: string; amount: number; bearer: string; supplier_name: string }[] {
  let items: any[] = []
  try { items = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { items = [] }
  if (!items.length) {
    const fiTag = parseRemarkTag(row.remark || '', 'FI')
    if (fiTag) items = decodeFeeItems(fiTag)
  }
  return items
}

function getFeeItemPayStatus(row: any, idx: number): { code: string; label: string; type: string } {
  if (Number(row.status) !== 1) return { code: 'none', label: '—', type: 'info' }
  const items = getContractFeeItems(row)
  const fee = items[idx]
  if (!fee || Number(fee.amount || 0) <= 0) return { code: 'none', label: '—', type: 'info' }
  if (fee.bearer === 'seller' || fee.bearer === 'free') return { code: 'counterparty', label: t('sale.contract.feeStatusCounterparty'), type: 'info' }
  const needPay = fee.bearer === 'half' ? Number(fee.amount) / 2 : Number(fee.amount)
  const key = `${row.id}:${String(fee.name || '').trim()}`
  const paid = feeItemPaidMap.value[key] || 0
  if (paid >= needPay - 0.01) return { code: 'paid', label: t('sale.contract.feeStatusPaid'), type: 'success' }
  return { code: 'pending', label: t('sale.contract.feeStatusPending'), type: 'warning' }
}

// ── 附加费用付款弹窗 ──────────────────────────────────────────────────────────
const feePayVisible = ref(false)
const feePaySubmitting = ref(false)
const feePayForm = reactive({
  orderId: 0,
  orderSn: '',
  customerName: '',
  feeName: '',
  feeIndex: -1,
  amount: 0,
  bearer: 'buyer',
  contact_name: '',
  fund_id: null as number | null,
  fund_name: '',
  pay_date: new Date().toISOString().slice(0, 10),
  remark: '',
})

function openFeePayDialog(row: any, idx: number) {
  let items: any[] = []
  try { items = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { items = [] }
  const fee = items[idx]
  if (!fee) return
  feePayForm.orderId = row.id
  feePayForm.orderSn = getContractSn(row)
  feePayForm.customerName = row.customer_name || ''
  feePayForm.feeName = String(fee.name || '').trim()
  feePayForm.feeIndex = idx
  feePayForm.amount = Number(fee.amount || 0)
  feePayForm.bearer = fee.bearer || 'buyer'
  feePayForm.contact_name = fee.supplier_name || ''
  feePayForm.fund_id = null
  feePayForm.fund_name = ''
  feePayForm.pay_date = new Date().toISOString().slice(0, 10)
  feePayForm.remark = ''
  feePayVisible.value = true
}

function onFeePayFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  feePayForm.fund_name = f?.name || ''
}

async function submitFeePay() {
  if (!feePayForm.fund_id) { ElMessage.warning(t('sale.contract.msgSelectPayAccount')); return }
  const needPay = feePayForm.bearer === 'half' ? feePayForm.amount / 2 : feePayForm.amount
  feePaySubmitting.value = true
  try {
    await createPayReceipt({
      contact_type: 'other',
      contact_name: feePayForm.contact_name || feePayForm.feeName,
      order_sn: feePayForm.orderSn,
      order_id: feePayForm.orderId,
      amount: needPay,
      pay_date: feePayForm.pay_date,
      fund_id: feePayForm.fund_id,
      fund_name: feePayForm.fund_name,
      remark: `销售订单附加费用 #${feePayForm.orderId}:${feePayForm.feeName}${feePayForm.contact_name ? ' [' + feePayForm.contact_name + ']' : ''}${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success(t('sale.contract.msgFeePaySuccess'))
    feePayVisible.value = false
    loadReceiptMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgFeePayFailed'))
  } finally {
    feePaySubmitting.value = false
  }
}

// ── 附加费用管理弹窗（列表已审核单补充费用）────────────────────────────────
const feeManageVisible = ref(false)
const feeManageSaving = ref(false)
const feeManageRow = ref<any>(null)
const feeManageItems = ref<{ name: string; amount: number; bearer: string; supplier_name: string }[]>([])

function openFeeManageDialog(row: any) {
  feeManageRow.value = row
  feeManageItems.value = JSON.parse(JSON.stringify(getContractFeeItems(row)))
  feeManageVisible.value = true
}

async function submitFeeManage() {
  const row = feeManageRow.value
  if (!row?.id) return
  const items = feeManageItems.value.filter(f => f.name && Number(f.amount) > 0)
  feeManageSaving.value = true
  try {
    // 更新 remark 里的 [FI:] 标签（主要持久化途径）
    const rawRemark = String(row.remark || '')
    const baseRemark = rawRemark.replace(/\[FI:[^\]]+\]\s*/g, '').trim()
    const fiTag = items.length > 0 ? `[FI:${encodeFeeItems(items)}]` : ''
    const newRemark = [fiTag, baseRemark].filter(Boolean).join(' ')
    await http.post('/shop/ContractOrder/edit', {
      id: row.id,
      remark: newRemark,
      fee_items: JSON.stringify(items),
    })
    feeManageRow.value = { ...row, remark: newRemark, fee_items: items }
    ElMessage.success(t('sale.contract.msgFeeSaveSuccess'))
    feeManageVisible.value = false
    tableRef.value?.refresh()
    loadReceiptMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgFeeSaveFailed'))
  } finally {
    feeManageSaving.value = false
  }
}

function getContractSn(row: any): string {
  const taggedSn = parseRemarkTag(row?.remark || '', 'NO')
  if (taggedSn) return taggedSn
  return String(row?.order_sn || row?.contract_no || (row?.id ? `HT${String(row.id).padStart(4,'0')}` : '')).trim()
}

function hasLinkedSaleOut(row: any): boolean {
  return Boolean(
    row?.sale_out_id ||
    row?.saleout_id ||
    row?.out_id ||
    row?.linked_sale_out_id ||
    row?.converted_out_id ||
    row?.contract_out_id
  )
}

function getContractStatusLabel(row: any): string {
  const status = Number(row?.status)
  if (status === 4) return t('sale.contract.contractStatusConverted')
  if (status === 1) return hasLinkedSaleOut(row) ? t('sale.contract.contractStatusAuditedOut') : t('sale.contract.contractStatusAudited')
  if (status === 2) return t('sale.contract.contractStatusRejected')
  return t('sale.contract.contractStatusPending')
}

function getContractStatusType(row: any): string {
  const status = Number(row?.status)
  if (status === 4) return 'warning'
  if (status === 1) return 'success'
  if (status === 2) return 'danger'
  return 'info'
}

function parseContractRemark(remark: string): string {
  return stripContractRemarkTags(remark)
}

function parseSourceOfferId(remark: string): number {
  return Number(parseRemarkTag(remark, 'OID') || 0)
}

function getReceivedAmount(row: any): number {
  const sn = getContractSn(row)
  const fromMap = receiptMap.value[sn]
  if (fromMap !== undefined) return fromMap
  // 只有已审核/已转单状态才用 receive_amount 兜底，待审核合同不显示已收
  if (Number(row.status) !== 1 && Number(row.status) !== 4) return 0
  return Number(row.receive_amount || 0)
}

function getPendingAmount(row: any): number {
  const sn = getContractSn(row)
  const returnCredit = returnCreditMap.value[sn] || 0
  return Math.max(0, calcContractAmount(row) - getReceivedAmount(row) - returnCredit)
}

// ── 收款弹窗 ──────────────────────────────────────────────────────────────────
const collectDialogVisible = ref(false)
const collectSubmitting = ref(false)
const batchAuditing = ref(false)

function getContractSummary({ columns, data }: { columns: any[], data: any[] }) {
  const sel = contractSelectedRows.value
  const source = sel.length > 0 ? sel : data
  const label = sel.length > 0 ? `${t('sale.contract.summarySelected')} ${sel.length} ${t('sale.contract.summaryCount')}` : null
  const rowCount = source.reduce((s, r) => s + (r._isGroup ? (r._groupRows?.length ?? 1) : 1), 0)
  const totalAmt = source.reduce((s, r) => {
    if (r._isGroup) return s + (r._groupRows ?? []).reduce((gs: number, gr: any) => gs + calcContractAmount(gr), 0)
    return s + calcContractAmount(r)
  }, 0)
  const totalRcv = source.reduce((s, r) => {
    if (r._isGroup) return s + (r._groupRows ?? []).reduce((gs: number, gr: any) => gs + getReceivedAmount(gr), 0)
    return s + getReceivedAmount(r)
  }, 0)
  const totalPend = source.reduce((s, r) => {
    if (r._isGroup) return s + (r._groupRows ?? []).reduce((gs: number, gr: any) => gs + getPendingAmount(gr), 0)
    return s + getPendingAmount(r)
  }, 0)
  return columns.map((_col: any, i: number) => {
    if (i === 2) return label ?? t('sale.contract.summaryTotal')
    if (i === 3) return label ? '' : `${rowCount} ${t('sale.contract.summaryCount')}`
    if (i === 5) return `¥${totalAmt.toFixed(2)}`
    if (i === 10) return `¥${totalRcv.toFixed(2)}`
    if (i === 11) return `¥${totalPend.toFixed(2)}`
    return ''
  })
}
const collectForm = reactive({
  orderId: 0,
  orderSn: '',
  customerName: '',
  customerId: 0,
  unpaid: 0,
  amount: 0,
  fund_id: null as number | null,
  fund_name: '',
  collect_date: new Date().toISOString().slice(0, 10),
  remark: '',
})

function openCollectDialog(row: any) {
  const unpaid = getPendingAmount(row)
  if (unpaid <= 0) { ElMessage.info(t('sale.contract.msgContractAlreadyPaid')); return }
  collectForm.orderId = row.id
  collectForm.orderSn = row.order_sn || row.order_no || `XS${row.id}`
  collectForm.customerName = row.customer_name || ''
  collectForm.customerId = row.customer_id || 0
  collectForm.unpaid = unpaid
  collectForm.amount = unpaid
  collectForm.fund_id = null
  collectForm.fund_name = ''
  collectForm.collect_date = String(row.sign_date || row.order_date || row.contract_date || row.create_time || row.created_at || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  collectForm.remark = ''
  collectDialogVisible.value = true
}

function onCollectFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  collectForm.fund_name = f?.name || ''
}

async function submitCollect() {
  if (!collectForm.amount || collectForm.amount <= 0) { ElMessage.warning(t('sale.contract.msgFillCollectAmount')); return }
  if (!collectForm.fund_id) { ElMessage.warning(t('sale.contract.msgSelectCollectAccount')); return }
  collectSubmitting.value = true
  try {
    await createCollectReceipt({
      contact_id: collectForm.customerId,
      contact_name: collectForm.customerName,
      customer_id: collectForm.customerId,
      customer_name: collectForm.customerName,
      order_sn: collectForm.orderSn,
      order_no: collectForm.orderSn,
      amount: collectForm.amount,
      receipt_date: collectForm.collect_date,
      fund_id: collectForm.fund_id,
      fund_name: collectForm.fund_name,
      remark: `合同收款 #${collectForm.orderId}${collectForm.remark ? ' ' + collectForm.remark : ''}`,
    })
    ElMessage.success(t('sale.contract.msgCollectSuccess'))
    collectDialogVisible.value = false
    loadReceiptMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgCollectFailed'))
  } finally {
    collectSubmitting.value = false
  }
}

function getReceiveStatus(row: any): { code: string; label: string; type: string } {
  const total = calcContractAmount(row)
  const received = getReceivedAmount(row)
  if (total <= 0) return { code: 'no-need', label: t('sale.contract.receiveStatusNoNeed'), type: 'info' }
  if (received <= 0) return { code: 'unpaid', label: t('sale.contract.receiveStatusUnpaid'), type: 'danger' }
  if (received >= total - 0.01) return { code: 'full-paid', label: t('sale.contract.receiveStatusFullPaid'), type: 'success' }
  return { code: 'partial', label: t('sale.contract.receiveStatusPartial'), type: 'warning' }
}

// ── 客户选项 ──────────────────────────────────────────────────────────────────
const customerOptions = ref<any[]>([])
async function loadCustomers() {
  const res = await getSaleCustomerList({ list_rows: 500 })
  const rc = res.data?.rows ?? []
  customerOptions.value = rc.filter((c: any, i: number) => rc.findIndex((x: any) => x.id === c.id) === i)
}

// ── 预付款余额 ────────────────────────────────────────────────────────────────
const customerPrepayBalance = ref(0) // 当前选中客户的可用预付款余额
const prepayList = ref<any[]>([])    // 该客户所有预付款记录

async function loadCustomerPrepay(customerId: number) {
  if (!customerId) { customerPrepayBalance.value = 0; prepayList.value = []; return }
  try {
    const res = await http.get('/finance/Prepay/index', { params: { list_rows: 200, pay_type: 'customer' } })
    const rows: any[] = res.data?.rows ?? []
    const mine = rows.filter((r: any) => Number(r.customer_id) === customerId)
    prepayList.value = mine
    // 余额 = 预付款总额 - 已用于该客户的收款单金额
    const totalPaid = mine.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    // 查该客户收款单中备注含"预付款核销"的金额
    const receiptRes = await http.get('/finance/CollectReceipt/index', { params: { list_rows: 500, customer_id: customerId } })
    const receipts: any[] = receiptRes.data?.rows ?? []
    const usedAmount = receipts
      .filter((r: any) => String(r.remark || '').includes('预付款核销'))
      .reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    customerPrepayBalance.value = Math.max(0, totalPaid - usedAmount)
  } catch { customerPrepayBalance.value = 0 }
}

function tryAutoOpen() {
  if (!route.query.auto_open) return
  const sn = String(route.query.contract_no || '').trim()
  if (!sn) return
  const attempt = (n = 0) => {
    const row = (tableRef.value?.tableData ?? []).find((r: any) =>
      r.order_sn === sn || r.order_no === sn || r.contract_code === sn
    )
    if (row) { openEdit(row, true); return }
    if (n < 15) setTimeout(() => attempt(n + 1), 400)
  }
  attempt()
}

onMounted(async () => {
  await Promise.all([loadCustomers(), loadStaff(), loadFunds(), loadReceiptMap()])
  handleRouteFromOffer()
  if (route.query.contract_no) searchForm.contract_no = String(route.query.contract_no)
  if (route.query.customer_name) {
    const name = String(route.query.customer_name)
    searchForm.customer_name = name
    highlightName.value = name
    nextTick(() => {
      if (tableRef.value) {
        tableRef.value.searchParams.customer_name = name
        tableRef.value.refresh()
      }
    })
  }
  tryAutoOpen()
})

onActivated(() => {
  loadReceiptMap()
  if (route.query.customer_name) {
    const name = String(route.query.customer_name)
    searchForm.customer_name = name
    highlightName.value = name
    tableRef.value?.refresh()
  } else if (route.query.contract_no) {
    searchForm.contract_no = String(route.query.contract_no)
    tableRef.value?.refresh()
  }
  tryAutoOpen()
})

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface ContractItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; cate_name: string; goods_type: number; unit_name: string; unit_ratio: number
  num: number; price_no_tax: number; tax_rate: number; price: number; cost_price: number; remark: string
  line_type?: 'normal' | 'exchange'
  exchange_group_key?: string
  _total_tax?: number
}

interface ExchangeGroup {
  key: string
  return_items: ContractItem[]
  exchange_no?: string
  exchange_id?: number
  status?: string
}

const defaultFd = () => ({
  id: 0,
  contract_no: '',
  source_offer_id: 0,
  source_offer_no: '',
  customer_id: null as any,
  customer_name: '',
  level_id: null as any,
  admin_id: null as any,
  admin_name: '',
  commission_rate: 0,
  sign_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  expire_date: '',
  need_invoice: false,
  receive_account: '',
  remark: '',
  total_amount: 0,
  discount_type: 'none' as string,
  discount_value: 0,
  after_discount: 0,
  freight_amount: 0,
  freight_bearer: 'buyer' as string,
  income_amount: 0,
  exchange_deduct: 0,
  exchange_groups: [] as ExchangeGroup[],
  receive_amount: 0,
  prepay_amount: 0,   // 本次使用预付款金额
  expense_amount: 0,
  installment: false,
  fee_items: [] as { name: string; amount: number; bearer: string; supplier_name: string }[],
  items: [] as ContractItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)
const savingAndAuditing = ref(false)
const costDetailVisible = ref(false)
const goodsCostPriceMap = reactive<Record<number, number>>({})
const goodsCostSourceMap = reactive<Record<number, string>>({})
const goodsCostStockQtyMap = reactive<Record<number, number>>({})
const goodsCostWarehouseMap = reactive<Record<number, string>>({})
const goodsTypeMapLocal = reactive<Record<number, number>>({})
let goodsCostLoaded = false
let goodsCostLoading: Promise<void> | null = null

function cleanCostKey(value: any): string {
  return String(value || '').trim().replace(/\s+/g, '').toLowerCase()
}

function firstPositiveNumber(...values: any[]): number {
  for (const value of values) {
    const num = Number(value)
    if (Number.isFinite(num) && num > 0) return num
  }
  return 0
}

function applyMissingItemCosts(items: ContractItem[]) {
  for (const item of items) {
    const gid = Number(item.goods_id || 0)
    if (!gid) continue
    if (!item.goods_type && goodsTypeMapLocal[gid]) item.goods_type = goodsTypeMapLocal[gid]
    if (Number(item.cost_price || 0) > 0) continue
    const cached = Number(goodsCostPriceMap[gid] || 0)
    if (cached > 0) item.cost_price = cached
  }
}

async function loadGoodsCostMapOnce() {
  if (goodsCostLoaded) return
  if (!goodsCostLoading) {
    goodsCostLoading = (async () => {
      try {
        const [goodsResult, stockResult] = await Promise.allSettled([
          getGoodsList({ list_rows: 3000 }),
          http.get('/stock/StockAll/index', { params: { list_rows: 5000 } }),
        ])

        const goodsRows: any[] = goodsResult.status === 'fulfilled'
          ? (goodsResult.value?.data?.rows ?? goodsResult.value?.data?.list ?? [])
          : []
        const goodsById = new Map<number, any>()
        const goodsIdBySn = new Map<string, number>()
        const goodsIdByName = new Map<string, number>()
        for (const g of goodsRows) {
          const gid = Number(g?.id || 0)
          if (!gid) continue
          goodsById.set(gid, g)
          const snKey = cleanCostKey(g?.goods_sn)
          const nameKey = cleanCostKey(g?.goods_name || g?.name)
          if (snKey) goodsIdBySn.set(snKey, gid)
          if (nameKey && !goodsIdByName.has(nameKey)) goodsIdByName.set(nameKey, gid)
          const cost = firstPositiveNumber(g?.cost_price, g?.purchase_price, g?.avg_price, g?.in_price)
          if (cost > 0) {
            goodsCostPriceMap[gid] = cost
            goodsCostSourceMap[gid] = '商品档案成本价'
          }
          const gt = Number(g?.goods_type || 0)
          if (gt > 0) goodsTypeMapLocal[gid] = gt
        }

        const resolveGoodsId = (row: any, idFields: string[], snFields: string[], nameFields: string[]) => {
          for (const field of idFields) {
            const gid = Number(row?.[field] || 0)
            if (gid > 0 && goodsById.has(gid)) return gid
          }
          for (const field of snFields) {
            const gid = goodsIdBySn.get(cleanCostKey(row?.[field]))
            if (gid) return gid
          }
          for (const field of nameFields) {
            const gid = goodsIdByName.get(cleanCostKey(row?.[field]))
            if (gid) return gid
          }
          return 0
        }
        const resolveGoodsIdByTextFirst = (row: any, idFields: string[], snFields: string[], nameFields: string[]) => {
          for (const field of snFields) {
            const gid = goodsIdBySn.get(cleanCostKey(row?.[field]))
            if (gid) return gid
          }
          for (const field of nameFields) {
            const gid = goodsIdByName.get(cleanCostKey(row?.[field]))
            if (gid) return gid
          }
          for (const field of idFields) {
            const gid = Number(row?.[field] || 0)
            if (gid > 0 && goodsById.has(gid)) return gid
          }
          return 0
        }

        const stockRows: any[] = stockResult.status === 'fulfilled'
          ? (stockResult.value?.data?.rows ?? stockResult.value?.data?.list ?? stockResult.value?.data ?? [])
          : []
        const stockCostAgg: Record<number, { amount: number; qty: number; prices: number[]; warehouses: Set<string> }> = {}
        for (const r of stockRows) {
          const gid = Number(r?.goods_id || r?.id || 0)
          if (!gid) continue
          const avgCost = Number(r?.avg_price ?? r?.average_price ?? r?.cost ?? r?.cost_price ?? 0)
          if (avgCost <= 0) continue
          const qty = Math.max(0, Number(r?.qty ?? r?.stock_num ?? r?.stock ?? 0))
          if (!stockCostAgg[gid]) stockCostAgg[gid] = { amount: 0, qty: 0, prices: [], warehouses: new Set<string>() }
          if (qty > 0) {
            stockCostAgg[gid].amount += avgCost * qty
            stockCostAgg[gid].qty += qty
          }
          stockCostAgg[gid].prices.push(avgCost)
          const warehouseName = String(r?.warehouse_name || '').trim()
          if (warehouseName) stockCostAgg[gid].warehouses.add(warehouseName)
        }

        for (const gidText of Object.keys(stockCostAgg)) {
          const gid = Number(gidText)
          const agg = stockCostAgg[gid]
          const cost = agg.qty > 0
            ? agg.amount / agg.qty
            : agg.prices.reduce((s, p) => s + p, 0) / Math.max(agg.prices.length, 1)
          if (cost <= 0) continue
          goodsCostPriceMap[gid] = cost
          goodsCostSourceMap[gid] = '仓库平均成本'
          goodsCostStockQtyMap[gid] = agg.qty
          goodsCostWarehouseMap[gid] = [...agg.warehouses].join('、') || '全部仓库'
        }

        // BOM核算成本 fallback：并发拉取各BOM计划的物料明细，用物料录入单价算成品成本
        try {
          const bomPlansResult = await getBomList({ list_rows: 500 })
          const bomPlans: any[] = bomPlansResult?.data?.list ?? bomPlansResult?.data?.rows ?? []

          const getFinishedGoodsId = (row: any) => resolveGoodsIdByTextFirst(
            row,
            ['goods_id', 'finished_goods_id', 'product_goods_id'],
            ['goods_sn', 'finished_goods_sn', 'product_sn'],
            ['goods_name', 'finished_goods_name', 'product_name'],
          )
          const getMaterialGoodsId = (row: any) => resolveGoodsId(
            row,
            ['material_id', 'material_goods_id', 'goods_id'],
            ['material_sn', 'material_goods_sn', 'goods_sn', 'sn'],
            ['material_name', 'material_goods_name', 'goods_name', 'name'],
          )
          const getMaterialCost = (row: any) => {
            const mid = getMaterialGoodsId(row)
            return firstPositiveNumber(
              row?.price,
              row?.cost_price,
              row?.out_price,
              row?.in_price,
              row?.purchase_price,
              row?.avg_price,
              mid ? goodsCostPriceMap[mid] : 0,
            )
          }
          const calcBomItemsCost = (items: any[]) => {
            return items.reduce((sum, mt) => {
              const num = firstPositiveNumber(mt?.num, mt?.qty, mt?.quantity)
              const unitPrice = getMaterialCost(mt)
              return sum + (num > 0 && unitPrice > 0 ? num * unitPrice : 0)
            }, 0)
          }
          const hasMaterialFields = (row: any) => Boolean(
            row?.material_id || row?.material_goods_id || row?.material_sn ||
            row?.material_goods_sn || row?.material_name || row?.material_goods_name
          )

          // 只处理还没有成本的成品；BOM成品可能只维护了商品编码，没有 goods_id。
          const plansNeedCost = bomPlans
            .map(p => ({ plan: p, finishedGoodsId: getFinishedGoodsId(p) }))
            .filter(({ finishedGoodsId }) => finishedGoodsId > 0 && !(goodsCostPriceMap[finishedGoodsId] > 0))
          if (plansNeedCost.length > 0) {
            const directGroups = new Map<number, any[]>()
            for (const item of plansNeedCost) {
              if (!hasMaterialFields(item.plan)) continue
              const group = directGroups.get(item.finishedGoodsId) ?? []
              group.push(item.plan)
              directGroups.set(item.finishedGoodsId, group)
            }
            for (const [finishedGoodsId, rows] of directGroups) {
              const directCost = calcBomItemsCost(rows)
              if (directCost > 0) {
                goodsCostPriceMap[finishedGoodsId] = directCost
                goodsCostSourceMap[finishedGoodsId] = 'BOM核算'
                goodsCostWarehouseMap[finishedGoodsId] = '—'
              }
            }
            const detailResults = await Promise.allSettled(
              plansNeedCost
                .filter(item => !(goodsCostPriceMap[item.finishedGoodsId] > 0))
                .map(item => http.get('/goods/BomGoods/detail', { params: { id: item.plan.id } }))
            )
            const detailPlans = plansNeedCost.filter(item => !(goodsCostPriceMap[item.finishedGoodsId] > 0))
            for (let i = 0; i < detailPlans.length; i++) {
              const { finishedGoodsId } = detailPlans[i]
              const result = detailResults[i]
              if (result.status !== 'fulfilled') continue
              const data = result.value?.data ?? {}
              const items: any[] = data?.items ?? data?.rows ?? data?.list ?? []
              const bomCost = calcBomItemsCost(items)
              if (bomCost > 0) {
                goodsCostPriceMap[finishedGoodsId] = bomCost
                goodsCostSourceMap[finishedGoodsId] = 'BOM核算'
                goodsCostWarehouseMap[finishedGoodsId] = '—'
              }
            }
          }
        } catch (e) { console.warn('[BOM成本] 异常:', e) }
      } finally {
        goodsCostLoaded = true
        goodsCostLoading = null
      }
    })()
  }
  await goodsCostLoading
}

async function ensureItemCosts(items: ContractItem[]) {
  if (!Array.isArray(items) || !items.length) return
  await loadGoodsCostMapOnce()
  applyMissingItemCosts(items)
}

function resolveItemCost(row: any) {
  const gid = Number(row?.goods_id || 0)
  const baseCost = gid > 0 ? Number(goodsCostPriceMap[gid] || 0) : 0
  const unitRatio = Number(row?.unit_ratio) || 1
  if (baseCost > 0) {
    return {
      baseUnitCost: baseCost,
      unitCost: baseCost * unitRatio,
      source: goodsCostSourceMap[gid] || '仓库平均成本',
      warehouseName: goodsCostWarehouseMap[gid] || (goodsCostSourceMap[gid] === '仓库平均成本' ? '全部仓库' : '—'),
      stockQty: goodsCostStockQtyMap[gid] || 0,
    }
  }
  const itemCost = Number(row?.cost_price || 0)
  if (itemCost > 0) {
    return {
      baseUnitCost: itemCost,
      unitCost: itemCost,
      source: '单据成本',
      warehouseName: '—',
      stockQty: 0,
    }
  }
  return { baseUnitCost: 0, unitCost: 0, source: '未找到成本', warehouseName: '—', stockQty: 0 }
}

// 计算汇总
const totalNoTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0), 0)
)
const totalTax = computed(() =>
  fd.items.reduce((s, r) => s + (r.num || 0) * (r.price_no_tax || 0) * (r.tax_rate || 0) / 100, 0)
)
const freightCharge = computed(() => 0) // legacy: freight now tracked via fee_items
const finalReceivable = computed(() =>
  Math.max(0, Number(fd.after_discount || 0) - Number(fd.income_amount || 0) - Number(fd.exchange_deduct || 0))
)
const finalPending = computed(() =>
  Math.max(0, finalReceivable.value - Number(fd.prepay_amount || 0) - Number(fd.receive_amount || 0))
)
const totalCost = computed(() =>
  (fd.items as any[]).reduce((s: number, r: any) => {
    return s + Number(r.num || 0) * resolveItemCost(r).unitCost
  }, 0)
)
const costDetailRows = computed(() =>
  (fd.items as any[]).map((r: any, index: number) => {
    const cost = resolveItemCost(r)
    const num = Number(r.num || 0)
    return {
      key: `${Number(r.goods_id || 0)}_${index}`,
      goods_name: r.goods_name || '-',
      goods_sn: r.goods_sn || '',
      unit_name: r.unit_name || '',
      num,
      base_unit_cost: cost.baseUnitCost,
      unit_cost: cost.unitCost,
      total_cost: num * cost.unitCost,
      cost_source: cost.source,
      warehouse_name: cost.warehouseName,
      stock_qty: cost.stockQty,
    }
  })
)
const freightCostSeller = computed(() => 0) // legacy: freight now tracked via fee_items
const feeBuyerCost = computed(() =>
  fd.fee_items.reduce((s, f) => {
    if (f.bearer === 'seller' || f.bearer === 'free') return s
    return s + (f.bearer === 'half' ? Number(f.amount || 0) / 2 : Number(f.amount || 0))
  }, 0)
)
const feeSellerCost = computed(() =>
  fd.fee_items.reduce((s, f) => {
    if (f.bearer === 'buyer' || f.bearer === 'free') return s
    return s + (f.bearer === 'half' ? Number(f.amount || 0) / 2 : Number(f.amount || 0))
  }, 0)
)
const netProfit = computed(() =>
  Number(fd.after_discount || 0)
  - totalCost.value
  - freightCostSeller.value
  - feeBuyerCost.value
)
const profitRate = computed(() => fd.after_discount > 0 ? (netProfit.value / fd.after_discount * 100) : 0)
const goodsKindCount = computed(() => fd.items.length)
const totalGoodsNum = computed(() => fd.items.reduce((s: number, r: any) => s + Number(r.num || 0), 0))

function normalizeReceiptAllocation() {
  const currentPrepay = Math.max(0, Number(fd.prepay_amount || 0))
  const currentReceive = Math.max(0, Number(fd.receive_amount || 0))
  const availablePrepay = Math.max(customerPrepayBalance.value, currentPrepay)
  const nextPrepay = Math.min(currentPrepay, Math.max(0, Math.min(availablePrepay, finalReceivable.value)))
  const nextReceive = Math.min(currentReceive, Math.max(0, finalReceivable.value - nextPrepay))
  fd.prepay_amount = Number(nextPrepay.toFixed(2))
  fd.receive_amount = Number(nextReceive.toFixed(2))
}

function calcContractAmount(row: any): number {
  return calcSaleContractReceivable(row)
}

function calcOfferAmount(row: any): number {
  const total = Number(row.total_amount || 0)
  const discVal = Number(row.discount_amount || row.discount_value || 0)
  const afterOffer = row.after_offer ?? row.after_discount
  if (Number.isFinite(Number(afterOffer)) && Number(afterOffer) >= 0) return Number(afterOffer)
  if (discVal > 0) return Math.max(0, total - discVal)
  return total
}

const calcOfferDisplayAmount = computed(() => {
  // Show the quoted amount for the currently selected offer in the form
  const selectedRow = offerOptions.value.find(o => o.id === fd.source_offer_id || o.offer_no === fd.source_offer_no)
  if (selectedRow) return calcOfferAmount(selectedRow)
  // Fallback to form's total amount
  return fd.total_amount || 0
})

function calcTotal() {
  fd.total_amount = fd.items.reduce((s, r) => s + (r.num || 0) * (r.price || 0), 0)
  fd.exchange_deduct = Number(calcExchangeDeductFromItems(fd.items).toFixed(2))
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
  normalizeReceiptAllocation()
}

function calcItemTax(row: ContractItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(4))
}

function onPriceNoTaxChange(row: ContractItem) {
  calcItemTax(row)
  calcTotal()
}

function onTaxRateChange(row: ContractItem) {
  calcItemTax(row)
  calcTotal()
}

function onPriceChange(row: ContractItem) {
  const taxRate = row.tax_rate || 0
  if (taxRate > 0) {
    row.price_no_tax = Number((row.price / (1 + taxRate / 100)).toFixed(4))
  } else {
    row.price_no_tax = row.price
  }
  calcTotal()
}

function onTotalTaxChange(row: ContractItem, total: number) {
  const num = row.num || 0
  if (num > 0) {
    row.price = Number((total / num).toFixed(4))
    onPriceChange(row)
  }
}

function removeItem(index: number) {
  fd.items.splice(index, 1)
  calcTotal()
}

function parseExchangeGroups(value: any): ExchangeGroup[] {
  const rows = parseItems(value)
  return rows.map((group: any, index: number) => ({
    key: String(group?.key || `EX${Date.now()}${index}`),
    return_items: parseItems(group?.return_items).map(normalizeItem),
    exchange_no: group?.exchange_no || '',
    exchange_id: Number(group?.exchange_id || 0),
    status: group?.status || '',
  }))
}

function makeExchangeGroupKey() {
  return `EX${Date.now()}${Math.floor(Math.random() * 1000)}`
}

function addExchangeGroup() {
  fd.exchange_groups.push({ key: makeExchangeGroupKey(), return_items: [], status: 'draft' })
}

function ensureExchangeGroup(): ExchangeGroup {
  if (!fd.exchange_groups.length) addExchangeGroup()
  return fd.exchange_groups[0]
}

function getExchangeGroupLabel(key?: string) {
  const idx = fd.exchange_groups.findIndex(group => group.key === key)
  return idx >= 0 ? `${t('sale.contract.secTitleExchange')}${idx + 1}` : t('sale.contract.bizExchange')
}

function getExchangeOutItems(key: string) {
  return fd.items.filter((item: any) => item.line_type === 'exchange' && item.exchange_group_key === key)
}

function calcExchangeReturnAmount(group: ExchangeGroup) {
  return group.return_items.reduce((sum, item) => sum + Number(item.num || 0) * Number(item.price || 0), 0)
}

function calcExchangeGroupOutAmount(key: string) {
  return getExchangeOutItems(key).reduce((sum, item) => sum + Number(item.num || 0) * Number(item.price || 0), 0)
}

function calcExchangeGroupDiff(group: ExchangeGroup) {
  return calcExchangeGroupOutAmount(group.key) - calcExchangeReturnAmount(group)
}

function onItemLineTypeChange(row: any) {
  if (row.line_type === 'exchange') {
    const group = ensureExchangeGroup()
    if (!row.exchange_group_key) row.exchange_group_key = group.key
  } else {
    row.line_type = 'normal'
    row.exchange_group_key = ''
  }
  calcTotal()
}

function removeExchangeOutItem(row: any) {
  row.line_type = 'normal'
  row.exchange_group_key = ''
  calcTotal()
}

function removeExchangeGroup(index: number) {
  const group = fd.exchange_groups[index]
  if (!group) return
  fd.items.forEach((item: any) => {
    if (item.exchange_group_key === group.key) {
      item.line_type = 'normal'
      item.exchange_group_key = ''
    }
  })
  fd.exchange_groups.splice(index, 1)
  calcTotal()
}

function buildExchangeGroupsPayload() {
  return fd.exchange_groups
    .map((group, index) => {
      const returnItems = group.return_items.map((item: any) => ({ ...item }))
      const exchangeItems = getExchangeOutItems(group.key).map((item: any) => ({ ...item }))
      return {
        key: group.key || `EX${index + 1}`,
        exchange_id: Number(group.exchange_id || 0),
        exchange_no: group.exchange_no || '',
        status: group.status || 'draft',
        return_items: returnItems,
        exchange_items: exchangeItems,
        return_amount: Number(calcExchangeReturnAmount(group).toFixed(2)),
        exchange_amount: Number(calcExchangeGroupOutAmount(group.key).toFixed(2)),
        diff_amount: Number(calcExchangeGroupDiff(group).toFixed(2)),
      }
    })
    .filter(group => group.return_items.length > 0 || group.exchange_items.length > 0)
}

async function onCustomerChange(id: any) {
  const c = customerOptions.value.find(x => x.id === id)
  fd.customer_name = c?.name || c?.nickname || ''
  fd.prepay_amount = 0
  await loadCustomerPrepay(Number(id))
  // 新建合同时自动填入可用预付款余额
  if (!fd.id && customerPrepayBalance.value > 0) {
    fd.prepay_amount = Math.min(customerPrepayBalance.value, finalReceivable.value)
  }
  // 自动套用客户绑定的等级
  const bound = levelMap[id]
  if (bound && levelOptions.value.some(l => l.id === bound)) {
    fd.level_id = bound
  }
  normalizeReceiptAllocation()
}

function onLevelChange() {
  if (!fd.items.length || !fd.level_id) return
  for (const row of fd.items) {
    if (!row.goods_id) continue
    const lp = getLevelPrice(fd.level_id, row.goods_id)
    if (lp !== null) {
      row.price = lp
      const taxRate = row.tax_rate || 0
      row.price_no_tax = taxRate > 0 ? Number((lp / (1 + taxRate / 100)).toFixed(4)) : lp
    }
  }
  calcTotal()
  ElMessage.info(t('sale.contract.msgLevelRefreshed'))
}

async function openCreate() {
  Object.assign(fd, defaultFd())
  isReadonly.value = false
  showExchangeGroup.value = false
  showForm.value = true
  try {
    const today = new Date(Date.now() + 8*3600000).toISOString().slice(0,10)
    const ymd = today.replace(/-/g,'')
    const prefix = `HT${ymd}`
    const res = await getContractList({ list_rows: 1000 })
    const rows: any[] = res?.data?.rows ?? []
    let maxSeq = 0
    for (const r of rows) {
      const sn = r.order_sn || ((r.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || ''
      if (sn.startsWith(prefix)) {
        const seq = parseInt(sn.slice(prefix.length), 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }
    fd.contract_no = `${prefix}${String(maxSeq + 1).padStart(3,'0')}`
  } catch {
    const ymd = new Date(Date.now()+8*3600000).toISOString().slice(0,10).replace(/-/g,'')
    fd.contract_no = `HT${ymd}001`
  }
}

async function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  fd.contract_no = getContractSn(row)
  fd.sign_date = fd.sign_date || (row as any).order_date?.slice?.(0, 10) || fd.sign_date
  fd.remark = parseContractRemark(row.remark || '')
  fd.source_offer_id = parseSourceOfferId(row.remark || '')
  fd.prepay_amount = Number(row.prepay_amount || parsePrepayAmount(row.remark || '') || 0)
  fd.expense_amount = Number(row.expense_amount || 0)
  // 解析 fee_items；优先用字段，再从 remark [FI:] 标签恢复，最后从旧字段迁移
  try {
    const raw = row.fee_items
    fd.fee_items = raw && (Array.isArray(raw) ? raw.length : raw !== '[]' && raw !== '' && raw !== 'null')
      ? (Array.isArray(raw) ? raw : JSON.parse(raw))
      : []
  } catch { fd.fee_items = [] }
  if (!fd.fee_items.length) {
    const fiTag = parseRemarkTag(row.remark || '', 'FI')
    if (fiTag) fd.fee_items = decodeFeeItems(fiTag)
  }
  if (!fd.fee_items.length) {
    // 迁移旧字段：freight_amount + bearer，以及 expense_amount
    if (Number(row.freight_amount || 0) > 0) {
      fd.fee_items.push({ name: '运费', amount: Number(row.freight_amount), bearer: row.freight_bearer || 'buyer', supplier_name: '' })
    }
    if (Number(row.expense_amount || 0) > 0) {
      fd.fee_items.push({ name: '单据支出', amount: Number(row.expense_amount), bearer: 'buyer', supplier_name: '' })
    }
  }
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items = fd.items.map(normalizeItem)
  fd.exchange_groups = parseExchangeGroups(row.exchange_groups)
  showExchangeGroup.value = fd.exchange_groups.length > 0
  calcTotal()
  fd.items.forEach(item => { if (item.goods_id) { fetchGoodsSpecs(item.goods_id); fetchGoodsUnits(item.goods_id) } })
  isReadonly.value = readonly
  // 先立即显示表单，再在后台异步加载成本/规格数据（避免等待大请求才弹出）
  showForm.value = true
  // keep-alive 会记住上次滚动位置，打开表单时必须重置到顶部
  nextTick(() => { if (formBodyRef.value) formBodyRef.value.scrollTop = 0 })
  // 后台异步加载成本数据，加载完成后 goodsCostPriceMap 响应式更新会自动刷新成本列
  ensureItemCosts(fd.items as ContractItem[]).then(() => calcTotal())
  fillMissingSpecs(fd.items)
  // 拉取完整详情，补全列表里缺失的字段（如 prepay_amount）
  // 保留已从列表行解析好的 fee_items，避免详情接口未返回该字段时误清空
  const feeItemsFromList = fd.fee_items.slice()
  try {
    const detail = await getContractDetail(Number(row.id))
    const full = detail?.data?.row || detail?.data || {}
    if (full.id) {
      const items = fd.items // 保留已解析的 items
      Object.assign(fd, full)
      fd.contract_no = getContractSn(full)
      fd.remark = parseContractRemark(full.remark || '')
      fd.source_offer_id = parseSourceOfferId(full.remark || '')
      fd.prepay_amount = Number(full.prepay_amount || parsePrepayAmount(full.remark || '') || fd.prepay_amount || 0)
      fd.items = (items.length ? items : (()=>{ try { return Array.isArray(full.goods_info) ? full.goods_info : JSON.parse(full.goods_info||'[]') } catch { return [] } })()).map(normalizeItem)
      fd.exchange_groups = parseExchangeGroups(full.exchange_groups)
      // 重新解析 fee_items（详情可能带有已保存的 fee_items）
      // 必须在 Object.assign 之后立即修正，否则 fd.fee_items 是 API 返回的原始字符串/null，
      // 导致 await 续点处 re-render 时 .reduce()/.length 报 TypeError 使页面空白
      try {
        const rawFull = full.fee_items
        const parsed = rawFull && (Array.isArray(rawFull) ? rawFull.length : rawFull !== '[]' && rawFull !== '' && rawFull !== 'null')
          ? (Array.isArray(rawFull) ? rawFull : JSON.parse(rawFull))
          : []
        fd.fee_items = parsed  // 始终赋值，保证是数组
      } catch { fd.fee_items = [] }
      if (!Array.isArray(fd.fee_items) || !fd.fee_items.length) {
        // 从 remark [FI:] 标签恢复（后端模型可能未持久化 fee_items 字段）
        const fiTag = parseRemarkTag(full.remark || '', 'FI')
        if (fiTag) fd.fee_items = decodeFeeItems(fiTag)
      }
      if (!Array.isArray(fd.fee_items) || !fd.fee_items.length) {
        // 详情接口未返回 fee_items，用列表行已解析的数据兜底，避免覆盖为空
        fd.fee_items = feeItemsFromList.length ? feeItemsFromList : []
        if (!fd.fee_items.length) {
          if (Number(full.freight_amount || 0) > 0) fd.fee_items.push({ name: '运费', amount: Number(full.freight_amount), bearer: full.freight_bearer || 'buyer', supplier_name: '' })
          if (Number(full.expense_amount || 0) > 0) fd.fee_items.push({ name: '单据支出', amount: Number(full.expense_amount), bearer: 'buyer', supplier_name: '' })
        }
      }
      await ensureItemCosts(fd.items as ContractItem[])
      calcTotal()
    }
  } catch { /* 详情拉取失败不影响基本展示 */ }
  // 加载预付款余额，完成后如果合同本身已有记录的 prepay_amount 则保留，否则自动填入可用余额
  if (row.customer_id) {
    await loadCustomerPrepay(Number(row.customer_id))
    if (!fd.prepay_amount && customerPrepayBalance.value > 0) {
      fd.prepay_amount = Math.min(customerPrepayBalance.value, finalReceivable.value)
    }
    normalizeReceiptAllocation()
  }
}

function backToList() {
  showForm.value = false
  nextTick(() => tableRef.value?.refresh())
}

function buildContractHtml() {
  const items: any[] = fd.items || []
  const rows = items.map((item: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${item.goods_name || ''}</td>
      <td style="text-align:center">${item.line_type === 'exchange' ? '换货' : '正常'}</td>
      <td>${item.goods_sn || ''}</td>
      <td>${item.spec || ''}</td>
      <td style="text-align:center">${item.unit_name || ''}</td>
      <td style="text-align:right">${Number(item.num || 0).toFixed(2)}</td>
      <td style="text-align:right">${Number(item.price_no_tax || 0).toFixed(4)}</td>
      <td style="text-align:center">${item.tax_rate || 0}%</td>
      <td style="text-align:right;color:#dc2626">${((item.num||0)*(item.price_no_tax||0)*(item.tax_rate||0)/100).toFixed(2)}</td>
      <td style="text-align:right">${Number(item.price || 0).toFixed(4)}</td>
      <td style="text-align:right">${((item.num||0)*(item.price_no_tax||0)).toFixed(2)}</td>
      <td style="text-align:right;color:#0071e3;font-weight:600">${((item.num||0)*(item.price||0)).toFixed(2)}</td>
      <td>${item.remark || ''}</td>
    </tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>销售订单 ${(fd as any).contract_no || ''}</title><link rel="icon" href="data:,">
  <style>
    *{box-sizing:border-box}
    body{font-family:SimSun,"Microsoft YaHei",Arial;font-size:12px;color:#000;margin:0;padding:12px 20px}
    h2{text-align:center;font-size:16px;margin:0 0 3px}
    .sub{text-align:center;color:#666;margin-bottom:10px;font-size:11px}
    .info{display:grid;grid-template-columns:1fr 1fr;gap:4px 24px;margin-bottom:10px;font-size:11px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #ccc;padding:3px 5px;text-align:left}
    th{background:#f0f0f0;font-weight:bold}
    .section-title{font-weight:bold;margin:8px 0 4px;font-size:12px;border-left:3px solid #0071e3;padding-left:6px}
    .total-row{text-align:right;margin-top:6px;font-size:12px}
    .total-row b{color:#0071e3}
    .sl{background:#f5f5f5;font-weight:bold;padding:4px 8px;white-space:nowrap}
    .footer{margin-top:24px;display:flex;justify-content:space-between;font-size:11px}
    @media print{body{padding:8px 14px}@page{margin:8mm;size:A4 landscape}}
  </style></head><body>
  <h2>销 售 合 同</h2>
  <div class="sub">数字游牧ERP &nbsp;·&nbsp; 合同编号：${(fd as any).contract_no || ''}</div>
  <div class="info">
    <span>客户名称：${(fd as any).customer_name || ''}</span>
    <span>签订日期：${(fd as any).sign_date || ''}</span>
    <span>合同到期：${fd.expire_date || ''}</span>
    <span>经办人：${fd.admin_name || ''}</span>
  </div>
  <div class="section-title">商品明细</div>
  <table>
    <thead><tr>
      <th style="text-align:center">序号</th>
      <th>商品名称</th>
      <th style="text-align:center">业务</th>
      <th>编码</th>
      <th>规格</th>
      <th style="text-align:center">单位</th>
      <th style="text-align:right">数量</th>
      <th style="text-align:right">未税单价</th>
      <th style="text-align:center">税率</th>
      <th style="text-align:right">税额</th>
      <th style="text-align:right">含税单价</th>
      <th style="text-align:right">未税合计</th>
      <th style="text-align:right">含税合计</th>
      <th>备注</th>
    </tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total-row">
    <span>合同总额：<b>¥${Number(fd.total_amount || 0).toFixed(2)}</b></span>
    ${fd.freight_amount ? `&nbsp;&nbsp;运费：¥${Number(fd.freight_amount).toFixed(2)}（${fd.freight_bearer === 'buyer' ? '买方承担' : fd.freight_bearer === 'seller' ? '卖方承担' : fd.freight_bearer === 'half' ? '各付一半' : '免运费'}）` : ''}
  </div>
  <div class="section-title" style="margin-top:10px">结算信息</div>
  <table style="width:100%;border-collapse:collapse;font-size:11px;margin-top:4px">
    <colgroup><col style="width:14%"><col style="width:22%"><col style="width:14%"><col style="width:22%"><col style="width:14%"><col style="width:14%"></colgroup>
    <tbody>
      <tr>
        <td class="sl">未税合计</td><td>¥${fd.items.reduce((s:number,r:any)=>s+(r.num||0)*(r.price_no_tax||0),0).toFixed(2)}</td>
        <td class="sl">税额合计</td><td style="color:#dc2626">¥${fd.items.reduce((s:number,r:any)=>s+(r.num||0)*(r.price_no_tax||0)*(r.tax_rate||0)/100,0).toFixed(2)}</td>
        <td class="sl">商品含税合计</td><td><b>¥${Number(fd.total_amount||0).toFixed(2)}</b></td>
      </tr>
      <tr>
        <td class="sl">折扣方式</td><td>${fd.discount_type==='none'?'无折扣':fd.discount_type==='amount'?'按金额折扣':'按百分比折扣'}</td>
        <td class="sl">${fd.discount_type==='percent'?'折扣(%)':'折扣金额'}</td><td style="color:#16a34a">${fd.discount_type==='none'?'—':fd.discount_type==='percent'?Number(fd.discount_value||0).toFixed(2)+'%':'-¥'+Number(fd.discount_value||0).toFixed(2)}</td>
        <td class="sl">折后金额</td><td><b>¥${Number(fd.after_discount||0).toFixed(2)}</b></td>
      </tr>
      <tr>
        <td class="sl">物流费用</td><td style="color:#7c3aed">${fd.freight_amount?'¥'+Number(fd.freight_amount).toFixed(2)+'（'+(fd.freight_bearer==='buyer'?'买方承担':fd.freight_bearer==='seller'?'卖方承担':fd.freight_bearer==='half'?'各付一半':'免运费')+'）':'—'}</td>
        <td class="sl">其他收支</td><td>${Number(fd.income_amount||0)!==0?(Number(fd.income_amount)>0?'-':'+')+'¥'+Math.abs(Number(fd.income_amount)).toFixed(2):'—'}</td>
        <td class="sl">换货折抵</td><td style="color:#d97706">${Number(fd.exchange_deduct||0)>0?'-¥'+Number(fd.exchange_deduct||0).toFixed(2):'—'}</td>
      </tr>
      <tr>
        <td class="sl">最终应收</td><td style="color:#0071e3"><b>¥${finalReceivable.value.toFixed(2)}</b></td>
        <td class="sl">预付款核销</td><td style="color:#16a34a">${Number(fd.prepay_amount||0)>0?'-¥'+Number(fd.prepay_amount).toFixed(2):'—'}</td>
        <td class="sl">实际待收</td><td style="color:#dc2626"><b>¥${finalPending.value.toFixed(2)}</b></td>
        <td class="sl">本次收款</td><td>¥${Number(fd.receive_amount||0).toFixed(2)}</td>
      </tr>
      <tr>
        <td class="sl">是否开票</td><td>${fd.need_invoice?'是':'否'}</td>
        <td class="sl">收款账户</td><td>${fd.receive_account||'—'}</td>
        <td class="sl">分期付款</td><td>${Number(fd.installment)?'<span style="color:#0071e3">是</span>':'否'}</td>
      </tr>
    </tbody>
  </table>
  ${fd.remark ? `<div style="margin-top:6px;font-size:11px">备注：${fd.remark}</div>` : ''}
  <div class="footer">
    <span>甲方（买方）签章：_______________</span>
    <span>乙方（卖方）签章：_______________</span>
    <span>日期：___________</span>
  </div>
  </body></html>`
}

async function handleBatchShareCmd(cmd: string, selRows: any[]) {
  if (cmd === 'link') await handleBatchShare(selRows)
  else if (cmd === 'pdf') await handleBatchSharePdf(selRows)
}

async function handleBatchSharePdf(selRows: any[]) {
  const rows = selRows.filter((r: any) => !r._isGroup)
  if (!rows.length) { ElMessage.warning(t('sale.contract.msgSelectOrdersFirst')); return }
  const msg = ElMessage({ message: `${t('sale.contract.msgGeneratingBatchPdf')} ${rows.length} ${t('sale.contract.msgGeneratingBatchPdfSuffix')}`, duration: 0, type: 'info' })
  try {
    const [{ jsPDF }, html2canvas] = await Promise.all([import('jspdf'), import('html2canvas')])
    const fmt2 = (v: any) => Number(v || 0).toFixed(2)
    const fmtD = (d: any) => d ? String(d).slice(0, 10) : '—'

    const grandTotal = rows.reduce((s: number, r: any) => s + Number(r.total_amount || 0), 0)
    const grandPending = rows.reduce((s: number, r: any) => s + Math.max(0, Number(r.total_amount || 0) - Number(r.receive_amount || 0)), 0)
    const customerName = rows[0]?.customer_name || ''
    const dateStr = new Date().toLocaleDateString('zh-CN')

    // 封面汇总区
    const _useLogo = showLogoForCurrentUser()
    const coverBlock = `
      <div style="background:#1d1d1f;border-radius:12px;padding:32px 40px;margin-bottom:36px;color:#fff">
        ${brandHeaderHtmlPdf(_useLogo, 'dark')}
        <div style="font-size:32px;font-weight:700;letter-spacing:1px;margin-bottom:6px">销售订单</div>
        <div style="font-size:13px;opacity:0.55;margin-bottom:24px">客户：${customerName} &nbsp;·&nbsp; 共 ${rows.length} 份 &nbsp;·&nbsp; ${dateStr}</div>
        <div style="display:flex;gap:40px;align-items:baseline">
          <div>
            <div style="font-size:12px;opacity:0.55;margin-bottom:4px">合计金额</div>
            <div style="font-size:36px;font-weight:700;color:#5ac8fa">¥${fmt2(grandTotal)}</div>
          </div>
          <div>
            <div style="font-size:12px;opacity:0.55;margin-bottom:4px">待收余额</div>
            <div style="font-size:22px;font-weight:700;color:${grandPending > 0 ? '#ff9f9f' : '#7ddf9e'}">${grandPending > 0 ? '¥' + fmt2(grandPending) : '全部已收清'}</div>
          </div>
          <div>
            <div style="font-size:12px;opacity:0.55;margin-bottom:4px">单据数量</div>
            <div style="font-size:22px;font-weight:700;color:#fff">${rows.length} 份</div>
          </div>
        </div>
      </div>`

    const contractBlocks = rows.map((row: any, idx: number) => {
      const items: any[] = (() => { try { return Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { return [] } })()
      const totalAmt = Number(row.total_amount || 0)
      const receivedAmt = Number(row.receive_amount || 0)
      const balance = Math.max(0, totalAmt - receivedAmt)
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
            <div style="font-size:13px;color:#86868b;margin-bottom:3px">合同编号：${row.order_sn || row.contract_no || ''}</div>
            <div style="font-size:15px;font-weight:700;color:#1d1d1f">${row.customer_name || '—'}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#86868b">${fmtD(row.sign_date || row.order_date)}</div>
            <div style="font-size:11px;color:#86868b">${row.admin_name || ''}</div>
          </div>
        </div>
        <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:12px">
          <thead>
            <tr style="background:#1d1d1f;color:#fff">
              <th style="padding:8px 6px;text-align:left">商品名称</th>
              <th style="padding:8px 6px;text-align:center">规格</th>
              <th style="padding:8px 6px;text-align:center">数量</th>
              <th style="padding:8px 6px;text-align:right">单价</th>
              <th style="padding:8px 6px;text-align:right">小计</th>
            </tr>
          </thead>
          <tbody>${goodsRows}</tbody>
        </table>
        <div style="text-align:right;padding-top:10px;border-top:1px solid #f2f2f7">
          <div style="font-size:18px;font-weight:700;color:#0071e3;margin-bottom:3px">合计 ¥${fmt2(totalAmt)}</div>
          ${receivedAmt > 0 ? `<div style="font-size:12px;color:#86868b">已收款 <span style="color:#34c759;font-weight:600">¥${fmt2(receivedAmt)}</span> &nbsp; 待收 <span style="color:#ff3b30;font-weight:700">¥${fmt2(balance)}</span></div>` : ''}
        </div>`
    }).join('')

    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:PingFang SC,Microsoft YaHei,sans-serif;color:#1d1d1f;padding:40px 50px;box-sizing:border-box;'
    wrap.innerHTML = coverBlock + contractBlocks + `<div style="margin-top:32px;padding-top:14px;border-top:1px solid #e5e5ea;font-size:11px;color:#c7c7cc;text-align:center">本文件由数字游牧ERP系统生成 · ${dateStr}</div>`
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
    const filename = `销售订单_${customerName}_共${rows.length}份_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`
    const blob = doc.output('blob')
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
    ElMessage.success(t('sale.contract.msgPdfDownloaded'))
  } catch (e) {
    msg.close()
    console.error(e)
    ElMessage.error(t('sale.contract.msgPdfFailed'))
  }
}

async function handleBatchShare(selRows: any[]) {
  const rows = selRows.filter((r: any) => !r._isGroup)
  if (!rows.length) { ElMessage.warning(t('sale.contract.msgSelectOrdersFirst')); return }
  const token = localStorage.getItem('erp_token') || ''
  if (!token) { ElMessage.warning(t('sale.contract.msgLoginExpired')); return }
  const ids = rows.map((r: any) => r.id).join(',')
  const base = window.location.origin + window.location.pathname
  const url = `${base}#/share/contracts?ids=${encodeURIComponent(ids)}&token=${encodeURIComponent(token)}`
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success(`${t('sale.contract.msgBatchShareCopied')} ${rows.length} ${t('sale.contract.msgBatchShareCopiedSuffix')}`)
  } catch {
    ElMessage.info(t('sale.contract.msgShareManualCopy') + url)
  }
}

async function handleShareCommand(cmd: string) {
  if (cmd === 'link') await handleShareLink()
  else if (cmd === 'pdf') await handleSharePdf()
}

async function handleShareLink() {
  const token = localStorage.getItem('erp_token') || ''
  const id = (fd as any).id
  if (!id || !token) { ElMessage.warning(t('sale.contract.msgShareLinkFailed')); return }
  const base = window.location.origin + window.location.pathname
  const url = `${base}#/share/contract/${id}?token=${encodeURIComponent(token)}`
  if (navigator.share) {
    try {
      await navigator.share({
        title: `销售订单 ${(fd as any).contract_no || (fd as any).order_sn || ''}`,
        text: `客户：${(fd as any).customer_name || ''}\n合同金额：¥${Number((fd as any).total_amount || 0).toFixed(2)}`,
        url,
      })
      return
    } catch { /* fallthrough to clipboard */ }
  }
  try {
    await navigator.clipboard.writeText(url)
    ElMessage.success(t('sale.contract.msgShareCopied'))
  } catch {
    ElMessage.info(t('sale.contract.msgShareManualCopy') + url)
  }
}

async function handleSharePdf() {
  const id = (fd as any).id
  if (!id) { ElMessage.warning(t('sale.contract.msgNoSaveFirst')); return }
  const msg = ElMessage({ message: t('sale.contract.msgGeneratingPdf'), duration: 0, type: 'info' })
  try {
    const [{ jsPDF }, html2canvas] = await Promise.all([import('jspdf'), import('html2canvas')])

    const fmt2 = (v: any) => Number(v || 0).toFixed(2)
    const fmtD = (d: any) => d ? String(d).slice(0, 10) : '—'
    const contractNo = (fd as any).contract_no || (fd as any).order_sn || ''
    const customerName = (fd as any).customer_name || customerOptions.value.find((c: any) => c.id === (fd as any).customer_id)?.name || ''
    const signDate = fmtD((fd as any).sign_date || (fd as any).order_date)
    const items: any[] = Array.isArray((fd as any).items) ? (fd as any).items : []
    const totalAmt = Number((fd as any).total_amount || 0)
    const receivedAmt = Number((fd as any).receive_amount || 0)
    const balance = Math.max(0, totalAmt - receivedAmt)

    // ── 构建隐藏 HTML 渲染层 ──
    const wrap = document.createElement('div')
    wrap.style.cssText = 'position:fixed;left:-9999px;top:0;width:794px;background:#fff;font-family:PingFang SC,Microsoft YaHei,sans-serif;color:#1d1d1f;font-size:13px;padding:40px 50px;box-sizing:border-box;'

    const goodsRows = items.map((item: any, i: number) => `
      <tr style="background:${i % 2 === 0 ? '#f9f9fb' : '#fff'}">
        <td style="padding:8px 6px">${item.goods_name || ''}</td>
        <td style="padding:8px 6px;text-align:center">${item.spec || '—'}</td>
        <td style="padding:8px 6px;text-align:center">${item.num || 0} ${item.unit_name || ''}</td>
        <td style="padding:8px 6px;text-align:right">¥${fmt2(item.price)}</td>
        <td style="padding:8px 6px;text-align:right;font-weight:600;color:#0071e3">¥${fmt2(Number(item.price) * Number(item.num))}</td>
      </tr>`).join('')

    const _useLogo2 = showLogoForCurrentUser()
    wrap.innerHTML = `
      <div style="text-align:center;margin-bottom:28px">
        ${brandHeaderHtmlPdf(_useLogo2, 'light')}
        <div style="font-size:26px;font-weight:700;letter-spacing:1px;margin-bottom:8px">销售订单</div>
        <div style="font-size:12px;color:#86868b">合同编号：${contractNo}</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px 24px;background:#f5f5f7;border-radius:10px;padding:16px 20px;margin-bottom:20px;font-size:13px">
        <div><span style="color:#86868b">客户名称：</span><strong>${customerName}</strong></div>
        <div><span style="color:#86868b">签约日期：</span>${signDate}</div>
        <div><span style="color:#86868b">经办人：</span>${(fd as any).admin_name || '—'}</div>
        <div><span style="color:#86868b">到期日期：</span>${fmtD((fd as any).expire_date)}</div>
        <div><span style="color:#86868b">是否开票：</span>${(fd as any).need_invoice ? '是' : '否'}</div>
        ${(fd as any).remark ? `<div style="grid-column:1/-1"><span style="color:#86868b">备注：</span>${(fd as any).remark}</div>` : ''}
      </div>

      <div style="font-weight:600;font-size:13px;margin-bottom:8px;color:#86868b;letter-spacing:0.5px">商品明细</div>
      <table style="width:100%;border-collapse:collapse;font-size:13px">
        <thead>
          <tr style="background:#1d1d1f;color:#fff">
            <th style="padding:9px 6px;text-align:left;font-weight:600">商品名称</th>
            <th style="padding:9px 6px;text-align:center;font-weight:600">规格</th>
            <th style="padding:9px 6px;text-align:center;font-weight:600">数量</th>
            <th style="padding:9px 6px;text-align:right;font-weight:600">单价</th>
            <th style="padding:9px 6px;text-align:right;font-weight:600">小计</th>
          </tr>
        </thead>
        <tbody>${goodsRows}</tbody>
      </table>

      <div style="margin-top:20px;padding-top:16px;border-top:2px solid #f2f2f7;text-align:right">
        <div style="font-size:22px;font-weight:700;color:#0071e3;margin-bottom:6px">合计 ¥${fmt2(totalAmt)}</div>
        ${receivedAmt > 0 ? `<div style="font-size:13px;color:#86868b;margin-bottom:4px">已收款 <span style="color:#34c759;font-weight:600">¥${fmt2(receivedAmt)}</span></div>
        <div style="font-size:15px;font-weight:700;color:#ff3b30">待收余额 ¥${fmt2(balance)}</div>` : ''}
      </div>

      <div style="margin-top:32px;padding-top:16px;border-top:1px solid #e5e5ea;display:flex;justify-content:space-between;align-items:flex-end">
        <div style="font-size:11px;color:#c7c7cc">本合同由数字游牧ERP系统生成 · ${new Date().toLocaleDateString('zh-CN')}</div>
        <div style="font-size:11px;color:#c7c7cc">状态：${(fd as any).status === 1 ? '✓ 已审核' : '待审核'}</div>
      </div>`

    document.body.appendChild(wrap)

    const canvas = await (html2canvas as any).default(wrap, {
      scale: 2, useCORS: true, backgroundColor: '#ffffff', logging: false
    })
    document.body.removeChild(wrap)

    const imgW = 210; const imgH = (canvas.height * imgW) / canvas.width
    const doc = new jsPDF({ orientation: imgH > 297 ? 'portrait' : 'portrait', unit: 'mm', format: 'a4' })

    let remainH = imgH; let pageH = 297; let srcY = 0
    while (remainH > 0) {
      const sliceH = Math.min(remainH, pageH)
      const sliceCanvas = document.createElement('canvas')
      sliceCanvas.width = canvas.width
      sliceCanvas.height = (sliceH / imgH) * canvas.height
      const ctx = sliceCanvas.getContext('2d')!
      ctx.drawImage(canvas, 0, srcY, canvas.width, sliceCanvas.height, 0, 0, canvas.width, sliceCanvas.height)
      const imgData = sliceCanvas.toDataURL('image/jpeg', 0.92)
      if (srcY > 0) doc.addPage()
      doc.addImage(imgData, 'JPEG', 0, 0, imgW, sliceH)
      srcY += sliceCanvas.height; remainH -= sliceH
    }

    const filename = `合同_${contractNo || customerName}_${signDate}.pdf`
    const blob = doc.output('blob')
    const file = new File([blob], filename, { type: 'application/pdf' })

    msg.close()
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: filename })
    } else {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
      URL.revokeObjectURL(url)
      ElMessage.success(t('sale.contract.msgPdfDownloaded'))
    }
  } catch (e) {
    msg.close()
    console.error(e)
    ElMessage.error(t('sale.contract.msgPdfFailedPrint'))
  }
}

async function handleContractPrint() {
  // 从收款单反查预付款核销金额
  try {
    const orderSn = String((fd as any).order_sn || (fd as any).contract_no || '').trim()
    if (orderSn) {
      const res = await getCollectReceiptList({ keyword: orderSn, list_rows: 500 })
      const rows = (res?.data?.rows ?? []).filter((r: any) =>
        String(r?.order_sn || r?.order_no || '').trim() === orderSn &&
        String(r?.remark || '').includes('预付款核销')
      )
      fd.prepay_amount = rows.reduce((s: number, r: any) => s + Number(r.amount || 0), 0)
    }
  } catch { /* ignore */ }
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { ElMessage.warning(t('sale.contract.msgAllowPopup')); return }
  w.document.write(buildContractHtml())
  w.document.close()
  w.focus()
  setTimeout(() => {
    const ext = w.document.querySelectorAll('img, canvas, [id^="ext-"], [class*="extension"], [class*="plugin"], [data-extension]')
    ext.forEach(el => el.remove())
    w.print()
  }, 600)
}

function handleContractExport() {
  const blob = new Blob([buildContractHtml()], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `销售订单_${(fd as any).order_sn || (fd as any).customer_name || ''}.html`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(t('sale.contract.msgExportSuccess'))
}

async function ensureContractFreightExpense(row: any) {
  const freightAmt = Number(row?.freight_amount || 0)
  const bearer = String(row?.freight_bearer || 'seller')
  if (freightAmt <= 0 || bearer !== 'seller') return

  const orderSn = getContractOrderSn(row)
  const remark = buildContractExpenseRemark({ ...row, order_sn: orderSn })
  const existing = await getExpenseList({ list_rows: 1000 })
  const rows: any[] = existing?.data?.rows ?? existing?.data?.list ?? []
  if (rows.some((item: any) => String(item?.remark || '').includes(`销售订单运费（我方承担） - ${orderSn}`))) return

  const expenseDate = String(row?.sign_date || row?.contract_date || row?.create_time || '').slice(0, 10)
    || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)
  await createExpense({
    name: '销售运费',
    amount: freightAmt,
    expense_date: expenseDate,
    order_sn: orderSn,
    remark,
  })
}

async function cleanupContractFreightExpense(row: any) {
  const orderSn = getContractOrderSn(row)
  if (!orderSn) return
  const existing = await getExpenseList({ list_rows: 1000 })
  const rows: any[] = existing?.data?.rows ?? existing?.data?.list ?? []
  const targets = rows.filter((item: any) => String(item?.remark || '').includes(`销售订单运费（我方承担） - ${orderSn}`))
  for (const item of targets) {
    await deleteExpense(Number(item.id))
  }
}

async function handleSave(andAudit = false) {
  calcTotal()  // 确保 fd.total_amount / fd.after_discount 在发送前已从 items 重新计算
  try { await formRef.value?.validate() } catch {
    ElMessage.warning(t('sale.contract.msgFillRequired')); return
  }
  if (!fd.items.length) {
    ElMessage.warning(t('sale.contract.msgAddGoods')); return
  }
  if (Number(fd.receive_amount || 0) <= 0 && Number(fd.prepay_amount || 0) <= 0 && finalReceivable.value > 0) {
    try {
      await ElMessageBox.confirm(t('sale.contract.msgNoReceiptConfirm'), t('sale.contract.msgNoReceiptTitle'), {
        confirmButtonText: t('sale.contract.msgContinueSave'), cancelButtonText: t('sale.contract.msgGoFill'), type: 'warning'
      })
    } catch { return }
  }
  // 有收款金额必须选账户，否则收款单无法入账
  if (Number(fd.receive_amount || 0) > 0 && !fd.receive_account) {
    ElMessage.error(t('sale.contract.msgSelectAccountRequired'))
    return
  }
  saving.value = true
  if (andAudit) savingAndAuditing.value = true
  try {
    normalizeReceiptAllocation()
    const payload: Record<string, any> = {
      customer_id: fd.customer_id,
      remark: buildContractRemark(),
      total_amount: fd.total_amount,
      discount_type: fd.discount_type,
      discount_value: fd.discount_value,
      after_discount: fd.after_discount,
      freight_amount: fd.freight_amount,
      freight_bearer: fd.freight_bearer,
      income_amount: fd.income_amount,
      exchange_deduct: fd.exchange_deduct,
      exchange_groups: JSON.stringify(buildExchangeGroupsPayload()),
      receive_amount: fd.receive_amount,
      receive_account: fd.receive_account || '',
      need_invoice: fd.need_invoice ? 1 : 0,
      installment: fd.installment ? 1 : 0,
      expense_amount: Number(fd.expense_amount || 0),
      // fee_items 不直接发字段——后端 sale_contracts 表无此列，强制写入会触发
      // "column fee_items does not exist" 错误，导致降级 legacy 模式丢失 discount/receive 字段。
      // fee_items 已通过 buildContractRemark() 的 [FI:...] 标签持久化到 remark。
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) payload.id = fd.id
    if (fd.contract_no) payload.order_sn = fd.contract_no
    if (fd.customer_name) payload.customer_name = fd.customer_name
    if (fd.admin_name) payload.admin_name = fd.admin_name
    if (fd.sign_date) {
      payload.sign_date = fd.sign_date
      payload.contract_date = fd.sign_date
      payload.order_date = fd.sign_date
    }
    const isNew = !fd.id
    let res: any
    if (fd.id) {
      try {
        res = await updateContract(payload)
      } catch (e: any) {
        const msg = String(e?.message || '')
        // 双保险：即使 API 层兼容未生效，也在页面层降级为老字段保存
        if (/column \"([^\"]+)\" of relation \"sale_contracts\" does not exist/i.test(msg)) {
          const legacyPayload: Record<string, any> = {}
          const legacyCols = [
            'id',
            'order_sn',
            'order_no',
            'customer_id',
            'customer_name',
            'admin_name',
            'order_date',
            'total_amount',
            'pay_amount',
            'goods_info',
            'remark',
            'exchange_deduct',
            'exchange_groups',
            'status',
          ]
          for (const key of legacyCols) {
            if (payload[key] !== undefined) legacyPayload[key] = payload[key]
          }
          res = await http.post('/shop/ContractOrder/edit', legacyPayload)
        } else {
          throw e
        }
      }
    } else {
      res = await createContract(payload)
    }
    const newId = Number(res?.data?.id || res?.data?.row?.id || res?.data?.data?.id || fd.id || 0)
    if (!fd.id && newId) fd.id = newId
    // 报价单转合同：标记报价单为已转换
    if (isNew && fd.source_offer_id) {
      try {
        await http.post('/shop/offerOrder/edit', { id: fd.source_offer_id, status: 4 })
      } catch { /* ignore */ }
    }
    let auditSucceeded = false
    if (andAudit && newId) {
      try {
        await autoAuditContract(newId)
        // 保存并审核时同步自动生成销售出库（扣库存）
        try {
          const detail = await getContractDetail(newId)
          const row = detail?.data?.row || detail?.data || {}
          const saleOut = await autoCreateSaleOut(row)
          await autoCreateSaleExchangeOrders(row, saleOut)
        } catch (e: any) {
          throw new Error(`自动出库失败：${e?.message || '未知'}`)
        }
        // 新建和编辑都要执行：内部有去重校验，不会重复创建
        const detail2 = await getContractDetail(newId)
        const row2 = detail2?.data?.row || detail2?.data || {}
        await autoCreateReceipt(row2)
        await ensureContractFreightExpense(row2)
        auditSucceeded = true
      } catch (e: any) {
        ElMessage.warning(`${t('sale.contract.msgSavePartialFail')}${e?.message || ''}，${t('sale.contract.msgAuditSaveManual')}`)
      }
    }
    if (!andAudit || auditSucceeded) {
      ElMessage.success(andAudit ? t('sale.contract.msgSaveAndAuditSuccess') : t('sale.contract.msgSaveSuccess'))
    }
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgSaveFailed'))
  } finally {
    saving.value = false
    savingAndAuditing.value = false
  }
}

async function autoAuditContract(id: number) {
  if (!id) throw new Error('合同ID无效')
  await auditContract(id, 1)
}

async function autoCreateReceipt(row: any) {
  const orderSn = getContractOrderSn(row)
  if (!orderSn) return
  const finalAmt = calcContractAmount(row)
  if (finalAmt <= 0) return
  const customerId = Number(row?.customer_id || 0)
  const customerName = String(row?.customer_name || customerOptions.value.find(c => Number(c?.id) === customerId)?.name || '').trim()
  const account = String(row?.receive_account || '').trim()
  const fundItem = fundOptions.value.find(f => String(f?.name || '').trim() === account)
  const receiptDate = String(row?.sign_date || row?.order_date || row?.contract_date || row?.create_time || row?.created_at || fd.sign_date || '').slice(0, 10)
    || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)

  let existingRows: any[] = []
  try {
    const existing = await getCollectReceiptList({ list_rows: 1000 })
    existingRows = existing?.data?.rows ?? []
  } catch { /* ignore */ }

  const existingPrepayRow = existingRows.find((item) => isAutoContractReceiptRow(item, orderSn) && String(item?.remark || '').includes('预付款核销'))
  const existingReceiveRow = existingRows.find((item) => isAutoContractReceiptRow(item, orderSn) && !String(item?.remark || '').includes('预付款核销'))

  const prepayAmt = Math.min(Math.max(0, Number(row?.prepay_amount || parsePrepayAmount(row?.remark || '') || fd.prepay_amount || 0)), finalAmt)
  const receiveAmt = Math.min(
    Math.max(0, Number(row?.receive_amount || 0)),
    Math.max(0, finalAmt - prepayAmt),
  )

  // 预付款核销
  if (prepayAmt > 0 && customerId) {
    if (existingPrepayRow) {
      // 后端自动生成的收款单日期可能是今天，强制更新为合同日期
      const storedDate = String(existingPrepayRow.receipt_date || '').slice(0, 10)
      if (storedDate !== receiptDate) {
        try { await updateCollectReceipt({ id: existingPrepayRow.id, receipt_date: receiptDate }) } catch { /* ignore */ }
      }
    } else {
      await createCollectReceipt({
        customer_id: customerId, customer_name: customerName,
        contact_id: customerId, contact_name: customerName,
        amount: prepayAmt, order_sn: orderSn, order_no: orderSn,
        fund_id: Number(fundItem?.id || 0), fund_name: fundItem?.name || account || '',
        receipt_date: receiptDate, remark: `预付款核销 - ${orderSn}`,
      })
    }
  }

  if (receiveAmt > 0.01) {
    if (existingReceiveRow) {
      // 后端自动生成的收款单日期可能是今天，强制更新为合同日期
      const storedDate = String(existingReceiveRow.receipt_date || '').slice(0, 10)
      if (storedDate !== receiptDate) {
        try { await updateCollectReceipt({ id: existingReceiveRow.id, receipt_date: receiptDate }) } catch { /* ignore */ }
      }
    } else {
      await createCollectReceipt({
        customer_id: customerId, customer_name: customerName,
        contact_id: customerId, contact_name: customerName,
        amount: receiveAmt, order_sn: orderSn, order_no: orderSn,
        fund_id: Number(fundItem?.id || 0), fund_name: fundItem?.name || account || '',
        receipt_date: receiptDate, remark: `合同自动收款 - ${orderSn}`,
      })
    }
  }
}

async function handleRouteFromOffer() {
  if (String(route.query.from || '') !== 'offer') return
  const raw = sessionStorage.getItem(DRAFT_KEY)
  if (!raw) return
  try {
    const draft = JSON.parse(raw)
    Object.assign(fd, defaultFd())
    fd.customer_id = draft.customer_id ?? null
    fd.customer_name = draft.customer_name || ''
    fd.level_id = draft.level_id ?? null
    fd.admin_id = draft.admin_id ?? null
    fd.admin_name = draft.admin_name || ''
    fd.sign_date = draft.sign_date || fd.sign_date
    fd.expire_date = draft.expire_date || ''
    fd.source_offer_id = Number(draft.source_offer_id || 0)
    fd.source_offer_no = draft.source_offer_no || ''
    fd.remark = draft.remark || ''
    if (Number(draft.discount_amount) > 0) {
      fd.discount_type = 'amount'
      fd.discount_value = Number(draft.discount_amount)
    }
    fd.items = Array.isArray(draft.items) ? draft.items.map(normalizeItem) : []
    await ensureItemCosts(fd.items as ContractItem[])
    calcTotal()
    fd.items.forEach(item => { if (item.goods_id) { fetchGoodsSpecs(item.goods_id); fetchGoodsUnits(item.goods_id) } })
    // 生成合同编号
    try {
      const today = new Date(Date.now() + 8*3600000).toISOString().slice(0,10)
      const ymd = today.replace(/-/g,'')
      const prefix = `HT${ymd}`
      const res = await getContractList({ list_rows: 1000 })
      const rows: any[] = res?.data?.rows ?? []
      let maxSeq = 0
      for (const r of rows) {
        const sn = r.order_sn || ((r.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || ''
        if (sn.startsWith(prefix)) {
          const seq = parseInt(sn.slice(prefix.length), 10)
          if (seq > maxSeq) maxSeq = seq
        }
      }
      fd.contract_no = `${prefix}${String(maxSeq + 1).padStart(3,'0')}`
    } catch {
      const ymd = new Date(Date.now()+8*3600000).toISOString().slice(0,10).replace(/-/g,'')
      fd.contract_no = `HT${ymd}001`
    }
    isReadonly.value = false
    showForm.value = true
    sessionStorage.removeItem(DRAFT_KEY)
    ElMessage.success(draft.source_offer_no
      ? `${t('sale.contract.msgOfferDraftLoaded')} ${draft.source_offer_no}${t('sale.contract.msgOfferDraftLoadedSuffix')}`
      : t('sale.contract.msgOfferDraftFallback'))
  } catch {
    ElMessage.warning(t('sale.contract.msgOfferDraftFailed'))
  }
}

function normalizeItem(t: any): ContractItem {
  const price = Number(t?.price || 0)
  const taxRate = Number(t?.tax_rate || 0)
  return {
    goods_id: Number(t?.goods_id || 0),
    goods_name: t?.goods_name || '',
    goods_sn: t?.goods_sn || '',
    spec: parseDisplaySpec(t?.spec),
    cate_name: t?.cate_name || '',
    goods_type: Number(t?.goods_type || 0),
    unit_name: t?.unit_name || '',
    num: Number(t?.num || 0),
    price_no_tax: Number(t?.price_no_tax || (taxRate > 0 ? Number((price / (1 + taxRate / 100)).toFixed(4)) : price)),
    tax_rate: taxRate,
    price,
    cost_price: Number(t?.cost_price || 0),
    remark: t?.remark || '',
    line_type: t?.line_type === 'exchange' ? 'exchange' : 'normal',
    exchange_group_key: t?.exchange_group_key || '',
  }
}

async function handleDelete(id: number) {
  // 检查是否有关联出库单
  let orderSn = ''
  try {
    const detail = await getContractDetail(id)
    const row = detail?.data?.row || detail?.data || {}
    orderSn = getContractSn(row) || String(row?.order_sn || row?.contract_no || '').trim()
    if (orderSn) {
      const saleOutRes = await getSaleOutList({ keyword: orderSn, list_rows: 100 })
      const linkedOut = (saleOutRes?.data?.rows ?? [])
      if (linkedOut.length > 0) {
        ElMessage.error(`${t('sale.contract.msgContractHasOut')} ${linkedOut.length} ${t('sale.contract.msgContractHasOutSuffix')}`)
        return
      }
    }
  } catch { /* ignore */ }

  await ElMessageBox.confirm(t('sale.contract.msgDeleteConfirm'), t('sale.contract.msgNoReceiptTitle'), { type: 'warning' })

  // 删合同前先联动删除所有关联收款单
  if (orderSn) {
    try {
      const existing = await getCollectReceiptList({ keyword: orderSn, list_rows: 500 })
      const linked = (existing?.data?.rows ?? []).filter((r: any) =>
        String(r?.order_sn || r?.order_no || '').trim() === orderSn
      )
      for (const r of linked) {
        try { await http.post('/finance/CollectReceipt/del', { id: Number(r.id) }) } catch { /* ignore */ }
      }
    } catch { /* ignore */ }
  }

  await deleteContract(id)
  ElMessage.success(t('sale.contract.msgDeleteSuccess'))
  tableRef.value?.refresh()
}

async function autoCreateSaleOut(row: any) {
  const items = parseItems(row.goods_info)
  if (!items.length) return null
  // 取仓库：合同上有就用，没有就取第一个
  let warehouseId = row.warehouse_id || 0
  let warehouseName = row.warehouse_name || ''
  if (!warehouseId) {
    try {
      const whRes = await http.get('/stock/WarehouseName/index', { params: { list_rows: 1 } })
      const wh = whRes?.data?.rows?.[0]
      if (wh) { warehouseId = wh.id; warehouseName = wh.name }
    } catch { /* ignore */ }
  }
  const outDate = String(row.sign_date || row.contract_date || row.order_date || '').slice(0, 10) || new Date().toISOString().slice(0, 10)
  const orderSn = getContractSn(row)
  // 去重：反审核后重新审核时，旧出库单仅被设为 status=0 未删除，若不清理会产生重复。
  // 同时检查 status=1 已审核的记录——若已存在则直接跳过，避免列表"审核"和表单"保存并审核"双触发导致重复。
  try {
    // keyword 搜索不会匹配 remark 字段，必须全量拉取后本地过滤
    const existOut = await getSaleOutList({ list_rows: 500 })
    const existRows: any[] = (existOut?.data?.rows ?? []).filter((o: any) =>
      String(o.remark || '').includes(orderSn)
    )
    // 已有审核通过的出库单 → 不重复创建
    const auditedExisting = existRows.find((o: any) => Number(o.status) === 1)
    if (auditedExisting) return auditedExisting
    // 清理未审核的旧出库单
    for (const o of existRows.filter((o: any) => Number(o.status) === 0)) {
      try { await deleteSaleOut(Number(o.id)) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
  // 构建出库goods_info：若该单位有关联BOM成品，替换为成品扣库存
  const goodsInfo: any[] = []
  for (const i of items) {
    let effectiveGoodsId = i.goods_id
    let effectiveGoodsName = i.goods_name
    let effectiveRatio = i.unit_ratio || 1
    try {
      const goodsRes = await http.get('/goods/ShopGoods/read', { params: { id: i.goods_id } })
      const specObj = JSON.parse(goodsRes.data?.spec || '{}')
      const linked = specObj.unit_linked_goods?.[i.unit_name]
      if (linked?.id) {
        effectiveGoodsId = linked.id
        effectiveGoodsName = linked.name
        effectiveRatio = 1
      }
    } catch { /* 查询失败，用原始商品 */ }
    goodsInfo.push({
      goods_id: effectiveGoodsId, goods_name: effectiveGoodsName, goods_sn: i.goods_sn || '',
      spec: i.spec || '', unit_name: i.unit_name || '', unit_ratio: effectiveRatio,
      num: i.num || 1, price: i.price || 0, price_no_tax: i.price_no_tax || i.price || 0,
      tax_rate: i.tax_rate || 0, cost_price: i.cost_price || 0, remark: i.remark || '',
    })
  }
  const outRes = await createSaleOut({
    customer_id: row.customer_id,
    customer_name: row.customer_name,
    admin_name: row.admin_name || '',
    out_date: outDate,
    warehouse_id: warehouseId,
    warehouse_name: warehouseName,
    total_amount: row.total_amount,
    after_discount: row.after_discount ?? row.total_amount,
    discount_amount: row.discount_value || 0,
    freight_amount: row.freight_amount || 0,
    freight_bearer: row.freight_bearer || 'buyer',
    remark: `来自销售订单 ${orderSn}`,
    goods_info: JSON.stringify(goodsInfo),
  })
  const outId = outRes?.data?.id || outRes?.data?.lastId
  if (!outId) throw new Error(`出库单创建失败：${outRes?.data?.msg || '未知错误'}`)
  await auditSaleOut(outId, 1)
  return {
    id: outId,
    order_sn: outRes?.data?.order_sn || outRes?.data?.order_no || '',
    order_no: outRes?.data?.order_no || outRes?.data?.order_sn || '',
    warehouse_id: warehouseId,
    warehouse_name: warehouseName,
  }
}

function getExchangeGroupsFromContract(row: any): any[] {
  const groups = parseItems(row?.exchange_groups)
  return groups.filter((group: any) => parseItems(group?.return_items).length > 0 || parseItems(group?.exchange_items).length > 0)
}

async function findSaleOutForContract(row: any, preferred?: any) {
  if (preferred?.order_sn || preferred?.order_no) return preferred
  const orderSn = getContractSn(row)
  if (!orderSn) return null
  try {
    const res = await getSaleOutList({ list_rows: 500 })
    const rows: any[] = res?.data?.rows ?? []
    if (preferred?.id) {
      const byId = rows.find((item: any) => Number(item.id) === Number(preferred.id))
      if (byId) return byId
    }
    return rows.find((item: any) =>
      Number(item.status) === 1 && String(item.remark || '').includes(orderSn)
    ) || null
  } catch { return null }
}

async function autoCreateSaleExchangeOrders(row: any, saleOut?: any) {
  const groups = getExchangeGroupsFromContract(row)
  if (!groups.length) return
  const contractId = Number(row?.id || fd.id || 0)
  const contractSn = getContractSn(row)
  const out = await findSaleOutForContract(row, saleOut)
  const outNo = String(out?.order_sn || out?.order_no || '').trim()
  if (!outNo) throw new Error('未找到销售出库单号，已停止自动生成换货单以避免重复扣库存')

  let existingRows: any[] = []
  try {
    const res = await getSaleExchangeList({ list_rows: 1000 })
    existingRows = res?.data?.rows ?? []
  } catch { /* ignore */ }

  for (const group of groups) {
    const key = String(group.key || '')
    const returnItems = parseItems(group.return_items)
    const exchangeItems = parseItems(group.exchange_items)
    if (!returnItems.length || !exchangeItems.length) continue
    const exists = existingRows.find((item: any) =>
      Number(item.source_contract_id || 0) === contractId && String(item.source_exchange_group_key || '') === key
        || String(item.remark || '').includes(`[CE:${contractSn}:${key}]`)
    )
    if (exists) continue

    const returnAmount = returnItems.reduce((sum: number, item: any) => sum + Number(item.num || 0) * Number(item.price || 0), 0)
    const exchangeAmount = exchangeItems.reduce((sum: number, item: any) => sum + Number(item.num || 0) * Number(item.price || 0), 0)
    const payload: Record<string, any> = {
      customer_id: row.customer_id,
      customer_name: row.customer_name,
      admin_name: row.admin_name || '',
      warehouse_id: out?.warehouse_id || row.warehouse_id || 0,
      warehouse_name: out?.warehouse_name || row.warehouse_name || '',
      exchange_date: String(row.sign_date || row.order_date || row.contract_date || '').slice(0, 10) || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
      return_goods_info: returnItems,
      exchange_goods_info: [],  // 换货发出由合同出库单负责，此处不重复扣库存
      return_amount: Number(returnAmount.toFixed(2)),
      exchange_amount: Number(exchangeAmount.toFixed(2)),
      diff_amount: Number((exchangeAmount - returnAmount).toFixed(2)),
      reason: '销售合同内换货',
      remark: `[CE:${contractSn}:${key}] 销售合同内换货自动生成`,
      source_contract_id: contractId,
      source_contract_no: contractSn,
      source_exchange_group_key: key,
      contract_embedded: 1,
      exchange_source_order_id: Number(out?.id || 0),
      exchange_source_order_no: outNo,
    }
    const res = await createSaleExchange(payload)
    const exchangeId = Number(res?.data?.id || res?.data?.lastId || 0)
    if (exchangeId) await auditSaleExchange(exchangeId, 1)
  }
}

async function autoReverseContractExchangeOrders(row: any) {
  const contractId = Number(row?.id || 0)
  const contractSn = getContractSn(row)
  if (!contractId && !contractSn) return
  const res = await getSaleExchangeList({ list_rows: 1000 })
  const rows: any[] = res?.data?.rows ?? []
  const targets = rows.filter((item: any) =>
    Number(item.contract_embedded || 0) === 1
      && (Number(item.source_contract_id || 0) === contractId || String(item.remark || '').includes(`[CE:${contractSn}:`))
      && Number(item.status) === 1
  )
  for (const item of targets) {
    await auditSaleExchange(Number(item.id), 0)
  }
}

async function autoReverseSaleOut(row: any) {
  const orderSn = getContractSn(row)
  if (!orderSn) return
  try {
    // keyword 搜索不会匹配 remark 字段，必须全量拉取后本地过滤（与 autoCreateSaleOut 保持一致）
    const outListRes = await getSaleOutList({ list_rows: 500 })
    const outRows: any[] = (outListRes?.data?.rows ?? []).filter((o: any) =>
      String(o.remark || '').includes(orderSn) && Number(o.status) === 1
    )
    for (const out of outRows) {
      await auditSaleOut(out.id, 0)
      try { await deleteSaleOutStockFlows(out.id) } catch { /* 库存还原失败不阻塞 */ }
    }
  } catch { /* 反出库失败不阻塞合同反审核 */ }
}

async function handleBatchAudit(selRows: any[], clearSelection: () => void) {
  const pendingRows = selRows.filter((r: any) => r.status === 0)
  if (pendingRows.length === 0) { ElMessage.warning(t('sale.contract.msgNoPendingAudit')); return }
  try {
    await ElMessageBox.confirm(`${t('sale.contract.msgBatchAuditConfirm')} ${pendingRows.length} ${t('sale.contract.msgBatchAuditSuffix')}`, t('sale.contract.msgBatchAuditTitle'), { type: 'warning' })
  } catch { return }
  batchAuditing.value = true
  let ok = 0; let fail = 0
  for (const row of pendingRows) {
    try {
      await auditContract(row.id, 1)
      const detail = await getContractDetail(Number(row.id))
      const freshRow = detail?.data?.row || detail?.data || row
      const saleOut = await autoCreateSaleOut(freshRow)
      await autoCreateSaleExchangeOrders(freshRow, saleOut)
      try { await autoCreateReceipt(freshRow) } catch { /* ignore */ }
      try { await ensureContractFreightExpense(freshRow) } catch { /* ignore */ }
      ok++
    } catch {
      fail++
    }
  }
  batchAuditing.value = false
  clearSelection()
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  loadReceiptMap()
  if (fail === 0) ElMessage.success(`${t('sale.contract.msgBatchAuditDone')} ${ok} ${t('sale.contract.msgBatchAuditUnit')}`)
  else ElMessage.warning(`${t('sale.contract.msgBatchAuditFail')} ${ok} ${t('sale.contract.msgBatchAuditUnit')}${t('sale.contract.msgBatchAuditFailUnit')} ${fail} ${t('sale.contract.msgBatchAuditUnit')}`)
}

async function handleAudit(row: any, status: number) {
  if (status === 2) { ElMessage.warning(t('sale.contract.msgRejectedDisabled')); return }
  const actionLabel = status === 1 ? t('sale.contract.btnAudit') : t('sale.contract.btnReverseAudit')

  // 反审核前检查是否有关联收款单 — 有则直接拦截，必须先去收款单手动删除
  if (status === 0) {
    try {
      const orderSn = getContractOrderSn(row)
      if (orderSn) {
        const existing = await getCollectReceiptList({ keyword: orderSn, list_rows: 500 })
        const linked = (existing?.data?.rows ?? []).filter((r: any) =>
          String(r?.order_sn || r?.order_no || '').trim() === orderSn
        )
        const manualLinked = linked.filter((item: any) => !isAutoContractReceiptRow(item, orderSn))
        if (manualLinked.length > 0) {
          ElMessage.error(`${t('sale.contract.msgHasManualReceipt')} ${manualLinked.length} ${t('sale.contract.msgHasManualReceiptSuffix')}`)
          return
        }
      }
    } catch { /* ignore */ }

    // 反审核前检查是否有已审核的退货单（通过出库单关联）
    try {
      const orderSn = getContractSn(row)
      const saleOutRes = await getSaleOutList({ keyword: orderSn, list_rows: 100 })
      const saleOutIds: number[] = (saleOutRes.data?.rows ?? []).map((o: any) => o.id)
      if (saleOutIds.length > 0) {
        const returnRes = await getSaleReturnList({ list_rows: 500 })
        const allReturns: any[] = returnRes.data?.rows ?? []
        const auditedReturns = allReturns.filter((r: any) => saleOutIds.includes(Number(r.order_id)) && r.status === 1)
        if (auditedReturns.length > 0) {
          ElMessage.warning(`${t('sale.contract.msgHasReturn')} ${auditedReturns.length} ${t('sale.contract.msgHasReturnSuffix')}`)
          return
        }
      }
    } catch { /* ignore */ }
  }

  try {
    await ElMessageBox.confirm(`${t('sale.contract.msgAuditConfirm')}${actionLabel}${t('sale.contract.msgAuditSuffix')}`, t('sale.contract.msgNoReceiptTitle'), { type: 'warning' })
  } catch { return }

  try {
    // 如果是已转单状态(4)要反审核，先退回已审核(1)
    if (status === 0 && Number(row.status) === 4) {
      try { await http.post('/shop/ContractOrder/edit', { id: row.id, status: 1 }) } catch {}
    }
    await auditContract(row.id, status)
    let errMsg = ''
    let freshRow = row
    try {
      const detail = await getContractDetail(Number(row?.id))
      freshRow = detail?.data?.row || detail?.data || row
    } catch { /* ignore */ }
    if (status === 1) {
      try {
        const saleOut = await autoCreateSaleOut(freshRow)
        await autoCreateSaleExchangeOrders(freshRow, saleOut)
      } catch (e: any) { errMsg = `自动出库/换货单失败：${e?.message || '未知'}` }
      try { await autoCreateReceipt(freshRow) } catch (e: any) { errMsg = errMsg || e?.message || '自动创建收款失败' }
      try { await ensureContractFreightExpense(freshRow) } catch (e: any) { errMsg = errMsg || e?.message || '自动写入销售运费失败' }
    } else if (status === 0) {
      try { await autoReverseContractExchangeOrders(freshRow) } catch (e: any) { errMsg = e?.message || '自动反审核换货单失败' }
      try { await autoReverseSaleOut(freshRow) } catch (e: any) { errMsg = `自动反出库失败：${e?.message || '未知'}` }
      try { await cancelAutoReceipt(freshRow) } catch (e: any) { errMsg = errMsg || e?.message || '自动撤回收款失败' }
      try { await cleanupContractFreightExpense(freshRow) } catch (e: any) { errMsg = errMsg || e?.message || '自动撤回销售运费失败' }
      // 反审核后把来源报价单状态恢复为已审核（1）
      const offerId = parseSourceOfferId(freshRow.remark || '') || parseSourceOfferId(row.remark || '')
      if (offerId) {
        try { await http.post('/shop/offerOrder/edit', { id: offerId, status: 1 }) } catch { /* ignore */ }
      }
    }
    errMsg ? ElMessage.warning(t('sale.contract.msgAuditFinanceFail') + errMsg) : ElMessage.success(status === 1 ? t('sale.contract.msgAuditSuccess') : t('sale.contract.msgReverseAuditSuccess'))
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
    loadReceiptMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgOperateFailed'))
  }
}

async function handleConvertToSaleOut(row: any) {
  await ElMessageBox.confirm(`确定将销售订单「${getContractSn(row)}」转为销售出库单？`, '转出库单', { type: 'info' })
  sessionStorage.setItem('saleout_from_contract', JSON.stringify({
    contract_id: row.id,
    contract_sn: row.order_sn || '',
    customer_id: row.customer_id,
    customer_name: row.customer_name || '',
    admin_name: row.admin_name || '',
    warehouse_id: row.warehouse_id || '',
    warehouse_name: row.warehouse_name || '',
    remark: row.remark || '',
    goods_info: row.goods_info || '[]',
    discount_type: row.discount_type || 'none',
    discount_value: row.discount_value || 0,
    total_amount: row.total_amount || 0,
  }))
  // 标记合同为已转单
  try {
    await http.post('/shop/ContractOrder/edit', { id: row.id, status: 4 })
  } catch { /* ignore */ }
  router.push('/sale/out')
}

async function cancelAutoReceipt(row: any) {
  const orderSn = getContractOrderSn(row)
  if (!orderSn) return
  try {
    // 后端 keyword 只搜 order_sn 不搜 remark；拉全量后自己按 remark/order_sn 双重过滤
    const existing = await getCollectReceiptList({ list_rows: 1000 })
    const allRows: any[] = existing?.data?.rows ?? []
    const toDelete = allRows.filter((r: any) => {
      const sn = String(r?.order_sn || r?.order_no || '').trim()
      const remark = String(r?.remark || '')
      return sn === orderSn
        || remark.includes(`合同自动收款 - ${orderSn}`)
        || remark.includes(`预付款核销 - ${orderSn}`)
        || remark.includes(`一键销售收款 - ${orderSn}`)
        || (remark.includes('审核自动生成') && remark.includes(orderSn))
    })
    for (const r of toDelete) {
      try { await http.post('/finance/CollectReceipt/del', { id: Number(r.id) }) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

// ── 换货单选择器（退回商品导入）────────────────────────────────────────────────
const exchangeOrderPickerVisible = ref(false)
const exchangeOrderPickerLoading = ref(false)
const exchangeOrderPickerList = ref<any[]>([])
const exchangeOrderPickerGroupIndex = ref(-1)

async function openExchangeOrderPicker(groupIndex: number) {
  exchangeOrderPickerGroupIndex.value = groupIndex
  exchangeOrderPickerVisible.value = true
  exchangeOrderPickerLoading.value = true
  try {
    const res = await getContractList({ list_rows: 10000, status: 1 })
    const rows: any[] = res?.data?.rows ?? res?.data?.list ?? []
    const custId = Number(fd.customer_id || 0)
    const selfId = fd.id ? Number(fd.id) : 0
    exchangeOrderPickerList.value = rows
      .filter((r: any) =>
        (!custId || Number(r.customer_id) === custId) &&
        (!selfId || Number(r.id) !== selfId)
      )
      .sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  } finally {
    exchangeOrderPickerLoading.value = false
  }
}

function importFromExchangeOrder(order: any) {
  const group = fd.exchange_groups[exchangeOrderPickerGroupIndex.value]
  if (!group) return
  const items = parseItems(order.goods_info)
  for (const item of items) {
    group.return_items.push({
      goods_id: Number(item.goods_id || 0),
      goods_name: item.goods_name || '',
      goods_sn: item.goods_sn || '',
      spec: item.spec || '',
      cate_name: item.cate_name || '',
      goods_type: Number(item.goods_type || 0),
      unit_name: item.unit_name || '',
      unit_ratio: 1,
      num: Number(item.num || 0),
      price_no_tax: Number(item.price || 0),
      tax_rate: 0,
      price: Number(item.price || 0),
      cost_price: Number(item.cost_price || 0),
      remark: '',
      line_type: 'normal' as const,
      exchange_group_key: '',
    })
  }
  exchangeOrderPickerVisible.value = false
}

function handleReturnPickerCmd(cmd: string, groupIndex: number) {
  if (cmd === 'exchange-order') {
    openExchangeOrderPicker(groupIndex)
  } else {
    openExchangeGoodsPicker('return', groupIndex)
  }
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
const goodsPickerMode = ref<'normal' | 'exchangeReturn' | 'exchangeOut'>('normal')
const goodsPickerExchangeGroupIndex = ref(-1)

function openNormalGoodsPicker() {
  goodsPickerMode.value = 'normal'
  goodsPickerExchangeGroupIndex.value = -1
  goodsSelectRef.value?.open()
}

function openExchangeGoodsPicker(mode: 'return' | 'out', groupIndex: number) {
  goodsPickerMode.value = mode === 'return' ? 'exchangeReturn' : 'exchangeOut'
  goodsPickerExchangeGroupIndex.value = groupIndex
  goodsSelectRef.value?.open()
}

function normalizeGoodsPickerItem(g: any): ContractItem {
  const basePrice = Number(g.sell_price || g.sale_price || g.price) || 0
  const levelPrice = fd.level_id && g.id ? (getLevelPrice(fd.level_id, g.id) ?? basePrice) : basePrice
  return {
    goods_id: Number(g.id || g.goods_id || 0),
    goods_name: g.goods_name || g.name || '',
    goods_sn: g.goods_sn || '',
    spec: parseDisplaySpec(g.spec),
    cate_name: g.cate_name || '',
    goods_type: Number(g.goods_type || 0),
    unit_name: g.unit_name || '',
    unit_ratio: 1,
    num: 1,
    price_no_tax: Number(levelPrice.toFixed(4)),
    tax_rate: 0,
    price: Number(levelPrice.toFixed(4)),
    cost_price: Number(g.cost_price) || 0,
    remark: '',
    line_type: 'normal',
    exchange_group_key: '',
  }
}

function onGoodsConfirm(goods: any[]) {
  const mode = goodsPickerMode.value
  const group = fd.exchange_groups[goodsPickerExchangeGroupIndex.value]
  for (const g of goods) {
    const item = normalizeGoodsPickerItem(g)
    if (mode === 'exchangeReturn' && group) {
      group.return_items.push(item)
    } else {
      if (mode === 'normal' && fd.items.some(i => Number(i.goods_id) === Number(item.goods_id) && i.line_type !== 'exchange')) continue
      if (mode === 'exchangeOut' && group) {
        item.line_type = 'exchange'
        item.exchange_group_key = group.key
        // 优先使用合同里同款商品的合同价，而不是目录价
        const existingNormal = fd.items.find(i => Number(i.goods_id) === Number(item.goods_id) && i.line_type !== 'exchange')
        if (existingNormal) {
          item.price = existingNormal.price
          item.price_no_tax = existingNormal.price_no_tax
          item.tax_rate = existingNormal.tax_rate
        }
      }
      fd.items.push(item)
      if (g.multi_spec === 1) fetchGoodsSpecs(item.goods_id)
      else goodsSpecMap[item.goods_id] = []  // 规格未开启，清空缓存避免误显示
      fetchGoodsUnits(item.goods_id)
    }
  }
  void ensureItemCosts(fd.items as ContractItem[])
  calcTotal()
  goodsPickerMode.value = 'normal'
  goodsPickerExchangeGroupIndex.value = -1
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
  if (!manualForm.goods_name.trim()) { ElMessage.warning(t('sale.contract.msgGoodsNameRequired')); return }
  fd.items.push({
    goods_id: 0,
    goods_name: manualForm.goods_name,
    goods_sn: manualForm.goods_sn,
    spec: manualForm.spec,
    cate_name: '',
    goods_type: 0,
    unit_name: manualForm.unit_name,
    num: manualForm.num,
    price_no_tax: Number(manualForm.price.toFixed(4)),
    tax_rate: 0,
    price: manualForm.price,
    cost_price: 0,
    remark: '',
    line_type: 'normal',
    exchange_group_key: '',
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
  num: t('sale.contract.colBatchQty'),
  price_no_tax: t('sale.contract.colPriceNoTax'),
  tax_rate: t('sale.contract.colTaxRate'),
  price: t('sale.contract.colPriceWithTaxHeader'),
  subtotal_no_tax: t('sale.contract.colSubtotalNoTax'),
  total_tax: t('sale.contract.colTotalWithTaxHeader'),
}))

function batchEditField(field: string) {
  batchEditFieldKey.value = field
  batchEditLabel.value = fieldLabelMap.value[field] || field
  batchEditValue.value = 0
  batchEditVisible.value = true
}

function confirmBatchEdit() {
  const field = batchEditFieldKey.value
  if (field === 'subtotal_no_tax') {
    ElMessage.info(t('sale.contract.msgSubtotalReadonly'))
    batchEditVisible.value = false
    return
  }
  for (const row of fd.items) {
    if (field === 'total_tax') {
      onTotalTaxChange(row, batchEditValue.value)
    } else {
      ;(row as any)[field] = batchEditValue.value
      if (field === 'price_no_tax' || field === 'tax_rate') {
        calcItemTax(row)
      } else if (field === 'price') {
        onPriceChange(row)
      }
    }
  }
  calcTotal()
  batchEditVisible.value = false
  ElMessage.success(`${t('sale.contract.msgBatchSetSuccess')} ${batchEditLabel.value} ${t('sale.contract.msgBatchSetTo')} ${batchEditValue.value}`)
}

// ── 快速新增客户 ──────────────────────────────────────────────────────────────
const quickAddCustomerVisible = ref(false)
const quickCustomerSaving = ref(false)
const quickCustomerForm = reactive({ nickname: '' })

async function confirmQuickAddCustomer() {
  if (!quickCustomerForm.nickname.trim()) {
    ElMessage.warning(t('sale.contract.placeholderCustomerNameInput')); return
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
    ElMessage.success(t('sale.contract.msgCustomerCreated'))
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgCustomerFailed'))
  } finally {
    quickCustomerSaving.value = false
  }
}

// ── 报价单选择器 ────────────────────────────────────────────────────────────
const offerPickerVisible = ref(false)
const offerLoading = ref(false)
const offerOptions = ref<any[]>([])
const offerPickerNo = ref('')
const offerPickerCustomer = ref('')
const selectedOffer = ref<any>(null)
const offerTableRef = ref()
let offerSearchTimer: any

async function loadOfferOptions() {
  offerLoading.value = true
  try {
    const res = await getOfferList({
      status: 1,
      offer_no: offerPickerNo.value || undefined,
      customer_name: offerPickerCustomer.value || undefined,
      list_rows: 200,
    })
    offerOptions.value = res.data?.rows ?? []
  } finally {
    offerLoading.value = false
  }
}

function onOfferPickerSearch() {
  clearTimeout(offerSearchTimer)
  offerSearchTimer = setTimeout(loadOfferOptions, 300)
}

function onOfferCurrentChange(row: any) {
  selectedOffer.value = row || null
}

function openOfferPicker() {
  offerPickerNo.value = ''
  offerPickerCustomer.value = ''
  selectedOffer.value = null
  offerPickerVisible.value = true
  loadOfferOptions()
}

async function confirmOfferPick() {
  if (!selectedOffer.value) { ElMessage.warning(t('sale.contract.msgSelectOffer')); return }
  if (fd.items.length) {
    await ElMessageBox.confirm(t('sale.contract.msgOfferOverwrite'), t('sale.contract.msgNoReceiptTitle'), { type: 'warning' })
  }
  try {
    const detail = await getOfferDetail(Number(selectedOffer.value.id))
    const offer = detail?.data?.row || selectedOffer.value
    applyOfferToForm(offer)
    offerPickerVisible.value = false
    offerTableRef.value?.setCurrentRow?.(null)
    selectedOffer.value = null
    ElMessage.success(offer.offer_no ? `${t('sale.contract.msgOfferBroughtIn')} ${offer.offer_no}` : t('sale.contract.msgOfferBroughtInFallback'))
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('sale.contract.msgOfferFailed'))
  }
}

function applyOfferToForm(offer: any) {
  const items: ContractItem[] = ((() => {
    try { return JSON.parse(offer.goods_info || '[]') } catch { return [] }
  })()).map(normalizeItem)
  fd.customer_id = offer.customer_id ?? null
  fd.customer_name = offer.customer_name || ''
  fd.level_id = offer.level_id ?? null
  fd.admin_id = offer.admin_id ?? null
  fd.admin_name = offer.admin_name || ''
  fd.sign_date = offer.offer_date || fd.sign_date
  fd.expire_date = offer.expire_date || ''
  fd.source_offer_id = Number(offer.id || 0)
  fd.source_offer_no = offer.offer_no || ''
  fd.remark = offer.offer_no ? `来源报价单：${offer.offer_no}` : fd.remark || ''
  fd.items = items
  void ensureItemCosts(fd.items as ContractItem[])
  calcTotal()
  const discVal = Number(offer.discount_amount || offer.discount_value || 0)
  const afterOffer = offer.after_offer ?? offer.after_discount
  if (discVal > 0) {
    fd.discount_type = 'amount'
    fd.discount_value = discVal
  } else if (Number.isFinite(Number(afterOffer)) && Number(afterOffer) >= 0 && Number(afterOffer) < fd.total_amount) {
    fd.discount_type = 'amount'
    fd.discount_value = Number((fd.total_amount - Number(afterOffer)).toFixed(2))
  } else {
    fd.discount_type = 'none'
    fd.discount_value = 0
  }
  calcSettle()
  fd.items.forEach(item => { if (item.goods_id) { fetchGoodsSpecs(item.goods_id); fetchGoodsUnits(item.goods_id) } })
}
</script>

<style scoped>
.contract-page { height: 100%; }

.exchange-empty {
  padding: 18px;
  color: rgba(29,29,31,0.35);
  font-size: 13px;
  text-align: center;
  border: 1px dashed #d1d5db;
  border-radius: 8px;
  background: #fafafa;
}

.exchange-group-card {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}

.exchange-group-card + .exchange-group-card { margin-top: 12px; }

.exchange-group-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.exchange-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 12px;
}

.exchange-side-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  color: #374151;
  margin-bottom: 6px;
}

@media (max-width: 900px) {
  .exchange-grid { grid-template-columns: 1fr; }
}

:deep(.row-converted) {
  background-color: #f5f5f5 !important;
  color: #aaa;
}
:deep(.row-converted) td { color: #aaa !important; }
:deep(.row-converted) .el-tag { opacity: 0.7; }
:deep(.row-converted) .el-button { opacity: 0.7; }

:deep(.row-highlight) { background-color: #ecf5ff !important; }
:deep(.row-highlight) td { background-color: #ecf5ff !important; }
:deep(.row-group) { background-color: #fffbeb !important; }
:deep(.row-group) td { background-color: #fffbeb !important; border-bottom: 1px solid #fcd34d !important; }

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
  flex-shrink: 0;
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
  flex-wrap: wrap;
  gap: 4px 0;
}

.cost-summary-item {
  display: inline-flex;
  align-items: center;
}

.cost-detail-toggle {
  margin-left: 6px;
  padding: 0;
  font-size: 12px;
}

.cost-detail-arrow {
  margin-left: 2px;
  font-size: 12px;
  transition: transform 0.16s ease;
}

.cost-detail-arrow.open {
  transform: rotate(180deg);
}

.cost-detail-panel {
  margin-top: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #fbfbfd;
}

.cost-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
}

.cost-detail-head small {
  font-size: 12px;
  font-weight: 400;
  color: rgba(29,29,31,0.45);
}

/* ── 4列信息面板布局 ── */
.info-header-section {
  padding: 0;
  overflow: hidden;
}
.info-panels {
  display: grid;
  grid-template-columns: 1fr 1.3fr 1fr 1fr;
}
.info-panel {
  padding: 16px 18px;
  border-right: 1px solid #f0f0f5;
  min-width: 0;
}
.info-panel:last-child {
  border-right: none;
}
.info-panel-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f5f5f7;
}
.info-panel-sn {
  font-size: 12px;
  color: rgba(29,29,31,0.4);
  font-weight: 400;
}
.info-field {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  min-width: 0;
}
.info-label {
  font-size: 12px;
  color: rgba(29,29,31,0.5);
  white-space: nowrap;
  width: 58px;
  flex-shrink: 0;
}
.amount-summary-panel {
  background: #fafbfc;
}
.amount-stat-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}
.amount-stat-label {
  color: rgba(29,29,31,0.5);
  font-size: 12px;
  white-space: nowrap;
}
.amount-stat-value {
  font-weight: 600;
  color: #1d1d1f;
}
.amount-receivable-row {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #ebebef;
}
.amount-receivable-value {
  font-size: 22px;
  font-weight: 700;
  color: #ff4d4f;
  letter-spacing: -0.5px;
}
.remark-row {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  padding: 12px 18px 14px;
  border-top: 1px solid #f5f5f7;
}
.remark-label {
  font-size: 12px;
  color: rgba(29,29,31,0.5);
  white-space: nowrap;
  padding-top: 6px;
  flex-shrink: 0;
}

@media (max-width: 1200px) {
  .info-panels {
    grid-template-columns: 1fr 1fr;
  }
  .info-panel {
    border-bottom: 1px solid #f0f0f5;
  }
  .info-panel:nth-child(even) {
    border-right: none;
  }
}
@media (max-width: 900px) {
  .info-panels {
    grid-template-columns: 1fr;
  }
  .info-panel {
    border-right: none;
  }
}

/* ── 手机端商品卡片 ── */
.mobile-goods-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 4px 0;
}
.mobile-goods-empty {
  text-align: center;
  color: #aaa;
  font-size: 13px;
  padding: 24px 0;
}
.mobile-goods-card {
  background: #fff;
  border: 1px solid #e8e8e8;
  border-radius: 10px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.mgc-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 2px;
}
.mgc-index {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #0071e3;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mgc-name {
  flex: 1;
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.mgc-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.mgc-label {
  font-size: 12px;
  color: rgba(29,29,31,0.45);
  width: 52px;
  flex-shrink: 0;
}
.mgc-total {
  flex: 1;
  font-size: 15px;
  font-weight: 700;
  color: #0071e3;
}
</style>
