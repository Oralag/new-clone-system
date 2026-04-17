<template>
  <div class="order-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getProcureOrderListWithInhouse"
          :batch-del-api="batchDelProcureOrders"
          sort-by="order_date" :sort-desc="true"
          export-file-name="采购订单" :params="searchForm"
          show-summary :summary-method="getSummaryRow"
          :row-class-name="({ row }: any) => (row.order_no || row.order_sn) === highlightSn ? 'row-highlight' : ''"
          :export-columns="{ order_no: '采购单号', supplier_name: '供应商', warehouse_name: '仓库', order_date: '开单日期', delivery_date: '预计交期', admin_name: '采购人', total_amount: '含税合计', status: '状态', pay_amount: '已付金额' }">
          <template #search>
            <el-input v-model="searchForm.order_no" placeholder="采购单号" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width:160px" />
            <el-select v-model="searchForm.supplier_name" placeholder="供应商" clearable filterable style="width:160px">
              <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
            </el-select>
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:110px">
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </template>
          <template #toolbar-right>
            <div class="status-cards">
              <div class="status-card audited" @click="searchForm.status = 1; tableRef?.refresh()">
                <div class="sc-row">
                  <span class="sc-dot audited" /><span class="sc-label">已审核</span>
                </div>
                <div class="sc-row">
                  <b class="sc-num">{{ summaryData.auditedCount }}</b>
                  <span class="sc-unit">单</span>
                  <span class="sc-sep" />
                  <span class="sc-money">¥{{ summaryData.auditedAmount.toFixed(2) }}</span>
                  <span class="sc-sub">未付 <span class="c-red">¥{{ summaryData.totalUnpaid.toFixed(2) }}</span></span>
                </div>
              </div>
              <div class="status-card pending" @click="searchForm.status = 0; tableRef?.refresh()">
                <div class="sc-row">
                  <span class="sc-dot pending" /><span class="sc-label">待审核</span>
                </div>
                <div class="sc-row">
                  <b class="sc-num">{{ summaryData.pendingCount }}</b>
                  <span class="sc-unit">单</span>
                  <span class="sc-sep" />
                  <span class="sc-money">¥{{ summaryData.pendingAmount.toFixed(2) }}</span>
                </div>
              </div>
            </div>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增采购单</el-button>
            <el-button type="success" :icon="Check" :loading="batchAuditing" @click="handleBatchAudit">批量审核</el-button>
            <el-button type="warning" :icon="RefreshLeft" :loading="batchReverseAuditing" @click="handleBatchReverseAudit">批量反审核</el-button>
          </template>
          <el-table-column type="expand">
            <template #default="{ row }">
              <div class="expand-detail">
                <div class="expand-title">商品明细</div>
                <el-table :data="parseItems(row.goods_info)" border size="small" class="expand-table">
                  <el-table-column type="index" width="40" align="center" />
                  <el-table-column prop="goods_name" label="商品名称" min-width="140" />
                  <el-table-column prop="goods_sn" label="编码" width="110" />
                  <el-table-column prop="spec" label="规格" width="100" />
                  <el-table-column prop="unit_name" label="单位" width="65" align="center" />
                  <el-table-column prop="num" label="数量" width="80" align="right" />
                  <el-table-column label="含税单价" width="110" align="right">
                    <template #default="{ row: item }">¥{{ Number(item.price || 0).toFixed(2) }}</template>
                  </el-table-column>
                  <el-table-column label="含税合计" width="110" align="right">
                    <template #default="{ row: item }">
                      <span style="color:#0071e3;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="供应商" width="130">
                    <template #default="{ row: item }">{{ item.supplier_name || '—' }}</template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="采购单号" min-width="150">
            <template #default="{ row }">{{ row.order_no || row.order_sn || '—' }}</template>
          </el-table-column>
          <el-table-column label="供应商" min-width="130">
            <template #default="{ row }">{{ getOrderSupplierLabel(row) }}</template>
          </el-table-column>
          <el-table-column label="仓库" width="110">
            <template #default="{ row }">{{ row.warehouse_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="开单日期" width="110">
            <template #default="{ row }">{{ (row.order_date || row.create_time || '').slice(0, 10) }}</template>
          </el-table-column>
          <el-table-column label="预计交期" width="110">
            <template #default="{ row }">{{ fmtDt(row.delivery_date) || '—' }}</template>
          </el-table-column>
          <el-table-column label="采购人" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="含税合计" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ Number(row.after_discount ?? row.total_amount ?? 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="采购数量" width="90" align="center">
            <template #default="{ row }">
              <span style="font-weight:600">{{ calcOrderQty(row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="入库数量" width="90" align="center">
            <template #default="{ row }">
              <span v-if="getInhouseQty(row) > 0" style="color:#16a34a;font-weight:600">{{ getInhouseQty(row) }}</span>
              <span v-else style="color:rgba(29,29,31,0.2)">0</span>
            </template>
          </el-table-column>
          <el-table-column label="已付金额" width="120" align="right">
            <template #default="{ row }">
              <span v-if="getPaidAmount(row) > 0" style="color:#16a34a;font-weight:600">¥{{ getPaidAmount(row).toFixed(2) }}</span>
              <span v-else style="color:rgba(29,29,31,0.2)">¥0.00</span>
            </template>
          </el-table-column>
          <el-table-column label="付款状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag :type="getPayStatus(row).type" size="small">{{ getPayStatus(row).label }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="附加费用" width="220" align="right">
            <template #default="{ row }">
              <template v-if="getFeeItemsForRow(row).length > 0">
                <div v-for="(fee, idx) in getFeeItemsForRow(row)" :key="idx" style="display:flex;align-items:center;justify-content:flex-end;gap:4px;line-height:1.6">
                  <span style="font-size:11px;color:rgba(29,29,31,0.5)">{{ fee.name }}</span>
                  <span style="color:#8b5cf6;font-weight:600">¥{{ Number(fee.amount).toFixed(2) }}</span>
                  <el-tag :type="getFeeItemPayStatus(row, idx).type" size="small">{{ getFeeItemPayStatus(row, idx).label }}</el-tag>
                  <el-button v-if="getFeeItemPayStatus(row, idx).label === '待付'" type="warning" link size="small" style="font-size:11px;padding:0" @click="openFeePayDialog(row, idx)">付款</el-button>
                </div>
              </template>
              <span v-else style="color:rgba(29,29,31,0.2)">—</span>
              <div v-if="row.status === 1 && getFeeItemsForRow(row).length === 0" style="margin-top:2px;text-align:right">
                <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">+ 补充费用</el-button>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" min-width="120" show-overflow-tooltip />
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openEdit(row, row.status === 1)">{{ row.status === 1 ? '查看' : '编辑' }}</el-button>
              <el-button v-if="row.status === 0" type="success" link size="small" @click="handleAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 1 && getPayStatus(row).label !== '已付清'" type="success" link size="small" @click="openPayDialog(row)">付款</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleReverseAudit(row)">反审核</el-button>
              <el-button type="danger" link size="small" @click="row.status === 1 ? ElMessage.warning('请先执行【反审核】，再删除该采购合同') : handleDelete(row)">删除</el-button>
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
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isReadonly ? '查看采购单' : (fd.id ? '编辑采购单' : '新增采购单') }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">已审核</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" :loading="saving" :disabled="saving" @click="handleSave(false)">
            保存
          </el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="saving" :disabled="saving" @click="handleSave(true)">
            保存并审核
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">基本信息</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item label="采购单号">
                  <el-input :value="fd.order_no || fd.order_sn || '（保存后自动生成）'" disabled placeholder="自动生成" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="供应商" prop="supplier_id"
                  :rules="[{ required: true, message: '请选择供应商' }]">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.supplier_id" placeholder="请选择供应商" filterable style="flex:1"
                      @change="onSupplierChange">
                      <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="openAddSupplier" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="采购人" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" placeholder="请选择或输入采购人" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="开单日期" prop="order_date">
                  <el-date-picker v-model="fd.order_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item label="预计交期" prop="delivery_date">
                  <el-date-picker v-model="fd.delivery_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="仓库" prop="warehouse_id"
                  :rules="[{ required: true, message: '请选择仓库', trigger: 'change' }]">
                  <el-select v-model="fd.warehouse_id" placeholder="请选择仓库" filterable style="width:100%"
                    @change="onWarehouseChange">
                    <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="是否开票">
                  <el-switch v-model="fd.need_invoice" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="付款账户">
                  <template v-if="isReadonly">
                    <el-input :value="fd.pay_account || fd.fund_name || '—'" disabled />
                  </template>
                  <template v-else>
                    <div style="display:flex;gap:4px;width:100%">
                      <el-select v-model="fd.fund_id" placeholder="请选择账户" filterable style="flex:1" @change="onFundChange">
                        <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
                      </el-select>
                      <el-button type="primary" :icon="Plus" @click="openAddFund" />
                    </div>
                  </template>
                </el-form-item>
              </el-col>

              <!-- 行3 -->
              <el-col :span="18">
                <el-form-item label="备注">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" placeholder="请输入备注" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="附件">
                  <div class="attach-area">
                    <el-button :icon="Paperclip" @click="attachInputRef?.click()">上传附件</el-button>
                    <input ref="attachInputRef" type="file" multiple style="display:none" @change="onAttachChange" />
                    <div v-if="fd.attachments.length" class="attach-list">
                      <div v-for="(f, i) in fd.attachments" :key="i" class="attach-item">
                        <el-icon class="attach-icon"><component :is="getFileIcon(f.name)" /></el-icon>
                        <span class="attach-name" :title="f.name">{{ f.name }}</span>
                        <span class="attach-size">{{ formatSize(f.size) }}</span>
                        <el-icon class="attach-download" title="下载" @click="downloadAttach(f)"><Download /></el-icon>
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
              <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()">选择商品</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">新增商品</el-button>
              <el-button :icon="Box" size="small" @click="openBomPicker">选择BOM商品</el-button>
              <el-button :icon="Document" size="small" @click="openPlanPicker">选择采购计划</el-button>
              <el-button :icon="Upload" size="small">导入商品</el-button>
              <el-button :icon="Camera" size="small">扫码录入</el-button>
            </div>
            <span class="goods-count">共 <b>{{ fd.items.length }}</b> 件商品</span>
          </div>

          <!-- 商品表格 -->
          <el-table :data="fd.items" border size="small" style="width:100%" empty-text="请点击上方按钮添加商品">
            <el-table-column type="index" width="45" align="center" fixed="left" />
            <el-table-column label="商品名称" min-width="150" fixed="left">
              <template #default="{ row }">
                <el-input v-model="row.goods_name" size="small" placeholder="商品名称" />
              </template>
            </el-table-column>
            <el-table-column label="商品编码" width="120">
              <template #default="{ row }">
                <el-input v-model="row.goods_sn" size="small" placeholder="编码" />
              </template>
            </el-table-column>
            <el-table-column label="规格型号" width="140">
              <template #default="{ row }">
                <el-select
                  v-if="row.goods_id && goodsSpecMap[row.goods_id]?.length"
                  v-model="row.spec"
                  size="small"
                  placeholder="请选择规格"
                  clearable
                  style="width:100%"
                  @focus="fetchGoodsSpecs(row.goods_id)"
                >
                  <el-option v-for="s in goodsSpecMap[row.goods_id]" :key="s" :label="s" :value="s" />
                </el-select>
                <el-input v-else v-model="row.spec" size="small" placeholder="规格"
                  @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
              </template>
            </el-table-column>
            <el-table-column label="分类" width="100">
              <template #default="{ row }">
                <span style="font-size:12px;color:#666">{{ row.cate_name || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位" width="90" align="center">
              <template #default="{ row }">
                <el-select
                  v-if="row.goods_id && goodsUnitMap[row.goods_id]?.length > 1"
                  v-model="row.unit_name"
                  size="small"
                  style="width:100%"
                  @change="(v: string) => onUnitChange(row, v)"
                >
                  <el-option v-for="u in goodsUnitMap[row.goods_id]" :key="u.unit_name" :label="u.unit_name" :value="u.unit_name" />
                </el-select>
                <el-input v-else v-model="row.unit_name" size="small" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>采购数量</span>
                  <el-button link type="primary" size="small" @click="batchEditField('num')">批量</el-button>
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
                  <span>未税单价</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price_no_tax')">批量</el-button>
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
                  <span>税率(%)</span>
                  <el-button link type="primary" size="small" @click="batchEditField('tax_rate')">批量</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <el-select v-model="row.tax_rate" size="small" style="width:100%" @change="onTaxRateChange(row)">
                  <el-option v-for="t in taxRates" :key="t" :label="`${t}%`" :value="t" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="税额" width="100" align="right">
              <template #default="{ row }">
                <span style="color:#dc2626">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column width="130">
              <template #header>
                <div class="batch-header">
                  <span>含税单价</span>
                  <el-button link type="primary" size="small" @click="batchEditField('price')">批量</el-button>
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
                  <span>未税合计</span>
                  <el-button link type="primary" size="small" @click="batchEditField('subtotal_no_tax')">批量</el-button>
                </div>
              </template>
              <template #default="{ row }">
                <span>{{ ((row.num||0) * (row.price_no_tax||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="含税合计" width="110" align="right">
              <template #default="{ row }">
                <span style="color:#0071e3;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="批次" width="130">
              <template #default="{ row }">
                <el-input v-model="row.batch_no" size="small" placeholder="批次/打码日期" />
              </template>
            </el-table-column>
            <el-table-column label="行供应商" width="150">
              <template #default="{ row }">
                <template v-if="isReadonly">
                  <span>{{ row.supplier_name || (supplierOptions.find((s:any) => s.id === row.supplier_id)?.name) || '同整体' }}</span>
                </template>
                <el-select
                  v-else
                  v-model="row.supplier_id"
                  size="small"
                  placeholder="同整体"
                  clearable
                  filterable
                  style="width:100%"
                  @change="(val: any) => { row.supplier_name = supplierOptions.find(s => s.id === val)?.name || '' }"
                >
                  <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="110">
              <template #default="{ row }">
                <el-input v-model="row.remark" size="small" placeholder="备注" />
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
          <div class="sec-title">结算信息</div>
          <div class="settlement-grid">
            <div class="settle-item">
              <span class="settle-label">本单应付</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">折扣方式</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" :disabled="isReadonly" @change="calcSettle">
                <el-option label="无折扣" value="none" />
                <el-option label="按金额折扣" value="amount" />
                <el-option label="按百分比折扣" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? '折扣(%)' : '折扣金额' }}</span>
              <el-input-number v-model="fd.discount_value" :min="0" :disabled="isReadonly"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">折后金额</span>
              <span class="settle-value">¥{{ fd.after_discount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">本次付款</span>
              <el-input-number v-model="fd.pay_amount" :min="0" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" />
            </div>
            <!-- 附加费用列表 -->
            <div class="settle-item fee-items-row" style="align-items:flex-start">
              <span class="settle-label" style="padding-top:6px">附加费用</span>
              <div style="flex:1">
                <div v-for="(fee, idx) in fd.fee_items" :key="idx" class="fee-item-line">
                  <el-select
                    v-model="fee.name"
                    size="small"
                    style="width:120px"
                    :disabled="isReadonly"
                    filterable
                    allow-create
                    default-first-option
                    placeholder="费用类型"
                  >
                    <el-option label="运费" value="运费" />
                    <el-option label="装卸费" value="装卸费" />
                    <el-option label="检测费" value="检测费" />
                    <el-option label="包装费" value="包装费" />
                    <el-option label="仓储费" value="仓储费" />
                    <el-option label="单据支出" value="单据支出" />
                    <el-option label="其他费用" value="其他费用" />
                  </el-select>
                  <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small"
                    style="width:110px;margin-left:6px" :disabled="isReadonly" placeholder="金额" />
                  <el-select v-model="fee.bearer" size="small" style="width:110px;margin-left:6px" :disabled="isReadonly">
                    <el-option label="我方承担" value="buyer" />
                    <el-option label="供应商承担" value="seller" />
                    <el-option label="各半" value="half" />
                    <el-option label="免费" value="free" />
                  </el-select>
                  <template v-if="isReadonly">
                    <el-tag :type="getFeeItemPayStatus(fd, idx).type" size="small" style="margin-left:6px">
                      {{ getFeeItemPayStatus(fd, idx).label }}
                    </el-tag>
                    <el-button
                      v-if="getFeeItemPayStatus(fd, idx).label === '待付'"
                      type="warning" link size="small" style="margin-left:4px"
                      @click="openFeePayDialog(fd, idx)"
                    >付款</el-button>
                  </template>
                  <el-button v-if="!isReadonly" type="danger" link :icon="Delete" size="small"
                    style="margin-left:6px" @click="fd.fee_items.splice(idx, 1)" />
                </div>
                <el-button v-if="!isReadonly" type="primary" link size="small" :icon="Plus"
                  style="margin-top:4px" @click="fd.fee_items.push({ name: '运费', amount: 0, bearer: 'buyer' })">
                  添加费用项
                </el-button>
              </div>
            </div>
            <div v-if="isReadonly" class="settle-item">
              <span class="settle-label">已付金额</span>
              <span class="settle-value" style="color:#16a34a;font-weight:700">
                ¥{{ Number(fd.pay_amount || 0).toFixed(2) }}
              </span>
            </div>
            <div class="settle-item">
              <span class="settle-label">是否分期</span>
              <el-switch v-model="fd.installment" :disabled="isReadonly" active-text="是" inactive-text="否" />
            </div>
          </div>
          <div class="settle-summary">
            <span>未税合计：<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">税额合计：<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">含税合计：<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
          </div>
        </div>

      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 手动新增商品弹框 -->
    <el-dialog v-model="manualAddVisible" title="新增商品行" width="420px" append-to-body>
      <el-form :model="manualForm" label-width="80px">
        <el-form-item label="商品名称" :rules="[{ required: true }]">
          <el-input v-model="manualForm.goods_name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="商品编码">
          <el-input v-model="manualForm.goods_sn" placeholder="商品编码（可选）" />
        </el-form-item>
        <el-form-item label="规格型号">
          <el-input v-model="manualForm.spec" placeholder="规格型号（可选）" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="manualForm.unit_name" placeholder="如：个、kg" />
        </el-form-item>
        <el-form-item label="采购数量">
          <el-input-number v-model="manualForm.num" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="含税单价">
          <el-input-number v-model="manualForm.price" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="manualAddVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmManualAdd">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 批量编辑弹框 -->
    <el-dialog v-model="batchEditVisible" :title="`批量设置 ${batchEditLabel}`" width="340px" append-to-body>
      <el-form label-width="80px" style="padding:8px 0">
        <el-form-item :label="batchEditLabel">
          <el-input-number v-model="batchEditValue" :min="0" :precision="4" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="batchEditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmBatchEdit">确认</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增供应商弹框 -->
    <el-dialog v-model="addSupplierVisible" title="快速新增供应商" width="380px" append-to-body>
      <el-form :model="supplierForm" label-width="80px">
        <el-form-item label="供应商名称">
          <el-input v-model="supplierForm.name" placeholder="请输入供应商名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addSupplierVisible = false">取消</el-button>
        <el-button type="primary" :loading="addSupplierLoading" @click="submitAddSupplier">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 快速新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" title="新增资金账户" width="380px" append-to-body>
      <el-form :model="fundForm" label-width="90px">
        <el-form-item label="账户名称">
          <el-input v-model="fundForm.name" placeholder="请输入账户名称" />
        </el-form-item>
        <el-form-item label="初始余额">
          <el-input-number v-model="fundForm.balance" :min="0" :precision="2" style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addFundVisible = false">取消</el-button>
        <el-button type="primary" :loading="addFundLoading" @click="submitAddFund">确认新增</el-button>
      </template>
    </el-dialog>

    <!-- 付款弹窗 -->
    <el-dialog v-model="payDialogVisible" title="付款" width="400px" append-to-body>
      <el-form :model="payForm" label-width="90px">
        <el-form-item label="采购单">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ payForm.orderSn }} · {{ payForm.supplierName }}</span>
        </el-form-item>
        <el-form-item label="待付金额">
          <span style="font-size:15px;font-weight:700;color:#dc2626">¥{{ payForm.unpaid.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="本次付款">
          <el-input-number v-model="payForm.amount" :min="0.01" :max="payForm.unpaid" :precision="2" style="width:100%" />
        </el-form-item>
        <el-form-item label="付款账户">
          <el-select v-model="payForm.fund_id" placeholder="请选择账户" filterable style="width:100%" @change="onPayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款日期">
          <el-date-picker v-model="payForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="payForm.remark" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="payDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="paySubmitting" @click="submitPay">确认付款</el-button>
      </template>
    </el-dialog>

    <!-- 附加费用管理弹窗（已审核后从列表补充） -->
    <el-dialog v-model="feeManageVisible" title="管理附加费用" width="560px" append-to-body>
      <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5)">
        {{ feeManageRow?.order_no || feeManageRow?.order_sn }} · {{ feeManageRow?.supplier_name }}
      </div>
      <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
        <el-select v-model="fee.name" size="small" style="width:130px" filterable allow-create default-first-option placeholder="费用类型">
          <el-option label="运费" value="运费" />
          <el-option label="装卸费" value="装卸费" />
          <el-option label="检测费" value="检测费" />
          <el-option label="包装费" value="包装费" />
          <el-option label="仓储费" value="仓储费" />
          <el-option label="单据支出" value="单据支出" />
          <el-option label="其他费用" value="其他费用" />
        </el-select>
        <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:120px" placeholder="金额" />
        <el-select v-model="fee.bearer" size="small" style="width:110px">
          <el-option label="我方承担" value="buyer" />
          <el-option label="供应商承担" value="seller" />
          <el-option label="各半" value="half" />
          <el-option label="免费" value="free" />
        </el-select>
        <el-tag v-if="getFeeItemPayStatus(feeManageRow, idx).label !== '—'" :type="getFeeItemPayStatus(feeManageRow, idx).type" size="small">
          {{ getFeeItemPayStatus(feeManageRow, idx).label }}
        </el-tag>
        <el-button
          v-if="getFeeItemPayStatus(feeManageRow, idx).label === '待付'"
          type="warning" link size="small"
          @click="feeManageVisible = false; openFeePayDialog({ ...feeManageRow, fee_items: feeManageItems }, idx)"
        >付款</el-button>
        <el-button type="danger" link :icon="Delete" size="small" @click="feeManageItems.splice(idx, 1)" />
      </div>
      <el-button type="primary" link size="small" :icon="Plus" @click="feeManageItems.push({ name: '运费', amount: 0, bearer: 'buyer' })">
        添加费用项
      </el-button>
      <template #footer>
        <el-button @click="feeManageVisible = false">取消</el-button>
        <el-button type="primary" :loading="feeManageSaving" @click="submitFeeManage">保存</el-button>
      </template>
    </el-dialog>

    <!-- 费用付款弹窗（统一：运费/单据支出/其他附加费用） -->
    <el-dialog v-model="feePayVisible" :title="`${feePayForm.feeName} 付款`" width="420px" append-to-body>
      <el-form :model="feePayForm" label-width="90px">
        <el-form-item label="采购单">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ feePayForm.orderSn }} · {{ feePayForm.supplierName }}</span>
        </el-form-item>
        <el-form-item label="费用类型">
          <span style="font-weight:600">{{ feePayForm.feeName }}</span>
        </el-form-item>
        <el-form-item label="费用金额">
          <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="付款账户">
          <el-select v-model="feePayForm.fund_id" placeholder="请选择账户" filterable style="width:100%" @change="onFeePayFundChange">
            <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款对象">
          <el-select v-model="feePayForm.contact_name" filterable allow-create default-first-option style="width:100%">
            <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item label="付款日期">
          <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="feePayForm.remark" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="feePayVisible = false">取消</el-button>
        <el-button type="primary" :loading="feePaySubmitting" @click="submitFeePay">确认付款</el-button>
      </template>
    </el-dialog>

    <!-- 批量付款弹窗 -->    <el-dialog v-model="batchPayVisible" title="批量审核完成 — 立即付款" width="600px" append-to-body>
      <div style="margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">
        <el-select v-model="batchPayFundId" placeholder="选择付款账户" filterable style="width:180px" @change="onBatchPayFundChange">
          <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
        </el-select>
        <el-date-picker v-model="batchPayDate" type="date" value-format="YYYY-MM-DD" style="width:150px" placeholder="付款日期" />
        <span style="margin-left:auto;font-size:13px;color:#6b7280">共 {{ batchPayItems.length }} 笔 · 合计
          <span style="font-weight:700;color:#dc2626">¥{{ batchPayTotal.toFixed(2) }}</span>
        </span>
      </div>
      <el-table :data="batchPayItems" border size="small" max-height="320">
        <el-table-column prop="supplierName" label="供应商" min-width="110" show-overflow-tooltip />
        <el-table-column prop="orderSn" label="采购单号" min-width="130" show-overflow-tooltip />
        <el-table-column label="待付金额" width="100" align="right">
          <template #default="{ row }">
            <span style="color:#dc2626">¥{{ row.unpaid.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="本次付款" width="130">
          <template #default="{ row }">
            <el-input-number v-model="row.amount" :min="0" :max="row.unpaid" :precision="2" size="small" style="width:100%" controls-position="right" />
          </template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="batchPayVisible = false">跳过不付款</el-button>
        <el-button type="primary" :loading="batchPaySubmitting" @click="submitBatchPay">确认付款</el-button>
      </template>
    </el-dialog>
    <el-dialog v-model="bomPickerVisible" title="选择BOM商品（物料）" width="800px" append-to-body>
      <div style="display:flex;gap:12px;height:420px">
        <!-- 左：成品列表 -->
        <div style="width:220px;flex-shrink:0;border:1px solid #e4e7ed;border-radius:6px;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:10px;border-bottom:1px solid #f5f5f7;flex-shrink:0">
            <el-input v-model="bomPickerKeyword" placeholder="搜索成品" clearable size="small" :prefix-icon="Search" />
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
              style="text-align:center;color:rgba(29,29,31,0.35);font-size:13px;padding:24px 12px">暂无成品</div>
          </div>
        </div>
        <!-- 右：物料列表 -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5);flex-shrink:0">
            {{ selectedBomGoods ? `「${selectedBomGoods.goods_name}」的物料清单（可多选）` : '请从左侧选择成品' }}
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
            <el-table-column prop="material_name" label="物料名称" min-width="140" />
            <el-table-column prop="material_sn" label="物料编码" width="110" />
            <el-table-column prop="num" label="用量" width="80" align="center" />
            <el-table-column prop="unit_name" label="单位" width="70" align="center" />
            <el-table-column prop="remark" label="备注" min-width="100" show-overflow-tooltip />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span style="color:rgba(29,29,31,0.35);font-size:13px">已选 {{ selectedBomMaterials.length }} 件物料</span>
        <el-button style="margin-left:12px" @click="bomPickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedBomMaterials.length" @click="confirmBomGoods">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 采购计划选择对话框 -->
    <el-dialog v-model="planPickerVisible" title="从采购计划导入商品" width="820px" append-to-body>
      <div style="display:flex;gap:12px;height:420px">
        <!-- 左：计划列表 -->
        <div style="width:230px;flex-shrink:0;border:1px solid #e4e7ed;border-radius:6px;display:flex;flex-direction:column;overflow:hidden">
          <div style="padding:10px;border-bottom:1px solid #f5f5f7;flex-shrink:0">
            <el-input v-model="planPickerKeyword" placeholder="搜索采购计划" clearable size="small" :prefix-icon="Search" />
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
              style="text-align:center;color:rgba(29,29,31,0.35);font-size:13px;padding:24px 12px">暂无已审核的采购计划</div>
          </div>
        </div>
        <!-- 右：计划商品列表 -->
        <div style="flex:1;display:flex;flex-direction:column;overflow:hidden">
          <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5);flex-shrink:0">
            {{ selectedPlan ? `「${selectedPlan.order_sn}」的商品明细（可多选）` : '请从左侧选择采购计划' }}
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
            <el-table-column prop="goods_name" label="商品名称" min-width="140" />
            <el-table-column prop="goods_sn" label="商品编码" width="110" />
            <el-table-column prop="spec" label="规格" width="90" />
            <el-table-column prop="num" label="计划数量" width="90" align="center" />
            <el-table-column prop="unit_name" label="单位" width="65" align="center" />
            <el-table-column prop="price" label="单价" width="90" align="right" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <span style="color:rgba(29,29,31,0.35);font-size:13px">已选 {{ selectedPlanItems.length }} 件商品</span>
        <el-button style="margin-left:12px" @click="planPickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedPlanItems.length" @click="confirmPlanItems">确认导入</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated, nextTick } from 'vue'
import { Plus, Delete, ArrowLeft, EditPen, Document, Box, Upload, Camera, Paperclip, Download, Close, Check, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useRoute, useRouter } from 'vue-router'
import ScTable from '@/components/ScTable.vue'
import { getProcureOrderList, createProcureOrder, updateProcureOrder, deleteProcureOrder, getSupplierList, createSupplier, auditProcureOrder, createProcureInhouse, auditProcureInhouse, getProcureInhouseList, getProcureReturnList } from '@/api/procure'
import { getWarehouseList } from '@/api/warehouse'
import { getBomList, getBomByGoods, getSpecList, getUnitConvert } from '@/api/goods'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getFundList, createFund, getPayReceiptList, createPayReceipt, deletePayReceipt, createExpense } from '@/api/finance'
import http from '@/api/http'
import StaffSelect from '@/components/StaffSelect.vue'
import { getStaffList } from '@/api/personnel'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { fmtDt } from '@/utils/date'

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()

// ── 批量审核 / 反审核 ────────────────────────────────────────────────────────
const batchAuditing = ref(false)
const batchReverseAuditing = ref(false)

async function handleBatchAudit() {
  const selected: any[] = tableRef.value?.selectedRows ?? []
  if (!selected.length) { ElMessage.warning('请先勾选要审核的采购单'); return }
  const pending = selected.filter(r => Number(r.status) !== 1)
  if (!pending.length) { ElMessage.warning('所选采购单已全部审核'); return }
  await ElMessageBox.confirm(`确定批量审核选中的 ${pending.length} 条采购单？`, '提示', { type: 'warning' })
  batchAuditing.value = true
  let success = 0, failed = 0
  for (const row of pending) {
    try {
      await auditProcureOrder(row.id, 1)
      try {
        const existRes = await getProcureInhouseList({ order_id: row.id, list_rows: 5 })
        const existRows: any[] = existRes.data?.rows ?? []
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
          for (const r of existRows) {
            if (r.status !== 1) await auditProcureInhouse(r.id, 1)
          }
        }
      } catch (e: any) {
        console.warn('自动创建入库单失败', e?.message)
      }
      success++
    } catch { failed++ }
  }
  batchAuditing.value = false
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  await loadPaidMap()
  ElMessage.success(`批量审核完成：成功 ${success} 条${failed ? `，失败 ${failed} 条` : ''}`)
  if (success > 0) openBatchPayDialog(pending)
}

async function handleBatchReverseAudit() {
  const selected: any[] = tableRef.value?.selectedRows ?? []
  if (!selected.length) { ElMessage.warning('请先勾选要反审核的采购单'); return }
  const audited = selected.filter(r => Number(r.status) === 1)
  if (!audited.length) { ElMessage.warning('所选采购单中没有已审核的'); return }
  await ElMessageBox.confirm(`确定批量反审核选中的 ${audited.length} 条采购单？反审核将撤销入库与财务入账。`, '提示', { type: 'warning' })
  batchReverseAuditing.value = true
  let success = 0, failed = 0
  for (const row of audited) {
    try {
      try {
        const inhouseListRes = await getProcureInhouseList({ order_id: row.id, list_rows: 10 })
        for (const r of (inhouseListRes.data?.rows ?? [])) {
          if (r.status === 1) await auditProcureInhouse(r.id, 0)
        }
      } catch {}
      await auditProcureOrder(row.id, 0)
      success++
    } catch { failed++ }
  }
  batchReverseAuditing.value = false
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  loadPaidMap()
  ElMessage.success(`批量反审核完成：成功 ${success} 条${failed ? `，失败 ${failed} 条` : ''}`)
}

// ── 列表 ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const highlightSn = ref('')
const tableRef = ref<InstanceType<typeof ScTable>>()

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
    if (i === 0) return '合计'
    const label = col.label ?? ''
    if (label === '含税合计') return `¥${d.totalAmount.toFixed(2)}`
    if (label === '采购数量') return d.totalQty
    if (label === '入库数量') return d.totalInhouseQty
    if (label === '已付金额') return `¥${d.totalPaid.toFixed(2)}`
    if (label === '单据支出') return `¥${d.totalExpense.toFixed(2)}`
    return ''
  })
}

// 包装 API：加载完采购单后，批量查入库单并填充 inhouse_qty
async function getProcureOrderListWithInhouse(params: any) {
  const fetchParams = params.goods_name ? { ...params, list_rows: 10000, page: 1 } : params
  const res = await getProcureOrderList(fetchParams)
  const rows: any[] = res?.data?.rows ?? res?.data ?? []
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
  // 数据加载完后更新合计（用当前页 rows 计算）
  // 前端过滤：按商品名搜索
  if (params.goods_name) {
    const kw = params.goods_name.toLowerCase()
    const filtered = rows.filter((row: any) => {
      const items = Array.isArray(row.goods_info) ? row.goods_info : (() => { try { return JSON.parse(row.goods_info || '[]') } catch { return [] } })()
      return items.some((g: any) => (g.goods_name || '').toLowerCase().includes(kw))
    })
    lastSummaryRows.value = filtered
    updateSummaryFromRows(filtered)
    if (res?.data) {
      const clone = { ...res, data: { ...res.data, rows: filtered, total: filtered.length } }
      return clone
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
    const rowAmt = Number(row.after_discount ?? row.total_amount ?? 0)
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
      const total = Number(row.after_discount ?? row.total_amount ?? 0)
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
  if (!batchPayFundId.value) { ElMessage.warning('请选择付款账户'); return }
  const validItems = batchPayItems.value.filter(r => Number(r.amount) > 0)
  if (!validItems.length) { ElMessage.warning('请填写付款金额'); return }
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
          remark: `采购单付款 #${item.orderId}`,
        })
        success++
      } catch { failed++ }
    }
    ElMessage.success(`付款完成：成功 ${success} 条${failed ? `，失败 ${failed} 条` : ''}`)
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
  const total = Number(row.after_discount ?? row.total_amount ?? 0)
  const paid = getPaidAmount(row)
  const unpaid = Math.max(0, total - paid)
  if (unpaid <= 0) {
    ElMessage.info('该采购单已付清')
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
  if (!payForm.amount || payForm.amount <= 0) { ElMessage.warning('请填写付款金额'); return }
  if (!payForm.fund_id) { ElMessage.warning('请选择付款账户'); return }
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
      remark: `采购单付款 #${payForm.orderId}${payForm.remark ? ' ' + payForm.remark : ''}`,
    })
    ElMessage.success('付款成功')
    payDialogVisible.value = false
    loadPaidMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '付款失败')
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
      if (/采购单据支出|采购运费|采购附加费用/.test(remark)) continue
      const orderSn = String(r.order_sn || '').trim()
      const supplierName = String(r.supplier_name || r.contact_name || '').trim()
      let matched = false
      if (Number(r.order_id)) {
        const id = Number(r.order_id)
        idMap[id] = (idMap[id] || 0) + amount
        matched = true
      }
      const m1all = [...String(r.remark || '').matchAll(/采购单(?:自动)?付款\s+#(\d+)/g)]
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
            const orderAmt = Number(o.after_discount ?? o.total_amount ?? 0)
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
      const m = String(r.remark || '').match(/采购单据支出\s*#(\d+)/)
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
      const m = String(r.remark || '').match(/采购运费\s*#(\d+)/)
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
      const m = String(r.remark || '').match(/采购附加费用\s*#(\d+):(.+?)(?:\s|$)/)
      if (m) {
        const id = Number(m[1])
        const feeName = m[2].trim()
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
  const total = Number(row.after_discount ?? row.total_amount ?? 0)
  const paid = getPaidAmount(row)
  if (total <= 0) return { label: '—', type: 'info' }
  if (paid <= 0) return { label: '未付款', type: 'danger' }
  if (paid >= total - 0.01) return { label: '已付清', type: 'success' }
  return { label: '部分付款', type: 'warning' }
}

function getExpensePayStatus(row: any): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const expAmt = Number(row.expense_amount || 0)
  if (expAmt <= 0) return { label: '—', type: 'info' }
  const paid = expensePaidById.value[row.id] || 0
  if (paid >= expAmt - 0.01) return { label: '已付', type: 'success' }
  return { label: '待付', type: 'warning' }
}

function getFreightPayStatus(row: any): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const freightAmt = Number(row.freight_amount || 0)
  if (freightAmt <= 0) return { label: '—', type: 'info' }
  const bearer = row.freight_bearer || 'buyer'
  if (bearer === 'seller') return { label: '供应商承担', type: 'info' }
  if (bearer === 'free') return { label: '免运费', type: 'info' }
  const paid = freightPaidById.value[row.id] || 0
  const needPay = bearer === 'half' ? freightAmt / 2 : freightAmt
  if (paid >= needPay - 0.01) return { label: '已付', type: 'success' }
  return { label: '待付', type: 'warning' }
}

// ── 附加费用管理弹窗（列表里已审核单补充费用）────────────────────────────────
const feeManageVisible = ref(false)
const feeManageSaving = ref(false)
const feeManageRow = ref<any>(null)
const feeManageItems = ref<{ name: string; amount: number; bearer: string }[]>([])

function openFeeManageDialog(row: any) {
  feeManageRow.value = row
  feeManageItems.value = JSON.parse(JSON.stringify(getFeeItemsForRow(row)))
  feeManageVisible.value = true
}

async function submitFeeManage() {
  feeManageSaving.value = true
  try {
    await updateProcureOrder({
      id: feeManageRow.value.id,
      fee_items: JSON.stringify(feeManageItems.value),
    })
    ElMessage.success('费用保存成功')
    feeManageVisible.value = false
    tableRef.value?.refresh()
    loadPaidMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
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
    if (freight > 0) items.push({ name: '运费', amount: freight, bearer: row.freight_bearer || 'buyer' })
    if (expense > 0) items.push({ name: '单据支出', amount: expense, bearer: 'buyer' })
  }
  return items
}

function getFeeItemPayStatus(row: any, idx: number): { label: string; type: string } {
  if (Number(row.status) !== 1) return { label: '—', type: 'info' }
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
  if (!fee || Number(fee.amount || 0) <= 0) return { label: '—', type: 'info' }
  const bearer = fee.bearer || 'buyer'
  if (bearer === 'seller') return { label: '供应商承担', type: 'info' }
  if (bearer === 'free') return { label: '免费', type: 'info' }
  const needPay = bearer === 'half' ? Number(fee.amount) / 2 : Number(fee.amount)
  // 兼容旧格式付款记录（采购单据支出 / 采购运费）
  const oldPaid = fee.name === '单据支出' ? (expensePaidById.value[row.id] || 0)
    : fee.name === '运费' ? (freightPaidById.value[row.id] || 0) : 0
  const paid = feeItemPaidMap.value[`${row.id}:${idx}`] || feeItemPaidMap.value[`${row.id}:${fee.name}`] || oldPaid
  if (paid >= needPay - 0.01) return { label: '已付', type: 'success' }
  return { label: '待付', type: 'warning' }
}

function openFeePayDialog(row: any, idx: number) {
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
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

function onFeePayFundChange(id: number) {
  const f = fundOptions.value.find((f: any) => f.id === id)
  feePayForm.fund_name = f?.name || ''
}

async function submitFeePay() {
  if (!feePayForm.fund_id) { ElMessage.warning('请选择付款账户'); return }
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
      remark: `采购附加费用 #${feePayForm.orderId}:${feePayForm.feeName}${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success('付款成功')
    feePayVisible.value = false
    loadPaidMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '付款失败')
  } finally {
    feePaySubmitting.value = false
  }
}

function parseItems(goodsInfo: any): any[] {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

function getOrderSupplierLabel(row: any): string {
  const items = parseItems(row.goods_info)
  const rowSupplierIds = [...new Set(items.map((i: any) => Number(i.supplier_id)).filter(Boolean))]
  if (rowSupplierIds.length > 1) return '多供应商'
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

// 商品多单位换算缓存：goods_id -> [{unit_name, ratio}]
const goodsUnitMap = reactive<Record<number, { unit_name: string; ratio: number }[]>>({})
async function fetchGoodsUnits(goodsId: number, baseUnitName: string) {
  if (!goodsId || goodsUnitMap[goodsId] !== undefined) return
  goodsUnitMap[goodsId] = []
  try {
    const res = await getUnitConvert(goodsId)
    const rows: any[] = res.data?.rows ?? []
    if (rows.length) {
      goodsUnitMap[goodsId] = rows.map(r => ({ unit_name: r.unit_name, ratio: Number(r.ratio) }))
    } else {
      // 没有配置多单位，只有基础单位
      goodsUnitMap[goodsId] = baseUnitName ? [{ unit_name: baseUnitName, ratio: 1 }] : []
    }
  } catch { /* ignore */ }
}
const searchForm = reactive<any>({ order_no: route.query.order_no ? String(route.query.order_no) : '', supplier_name: '', status: '', goods_name: '' })
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
      fd.items = items.map((i: any) => ({
        goods_id: i.goods_id || 0,
        goods_name: i.goods_name || '',
        goods_sn: i.goods_sn || '',
        spec: i.spec || '',
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
      }))
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
      fd.items = items.map((i: any) => ({
        goods_id: i.goods_id || 0,
        goods_name: i.goods_name || '',
        goods_sn: i.goods_sn || '',
        spec: i.spec || '',
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
      }))
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

function generateOrderNo(): string {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  const body = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  return `PO${body}`
}

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
}

function calcItemTax(row: OrderItem) {
  const taxRate = row.tax_rate || 0
  row.price = Number((row.price_no_tax * (1 + taxRate / 100)).toFixed(4))
}

function onPriceNoTaxChange(row: OrderItem) {
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

function onFundChange(id: any) {
  const f = fundOptions.value.find(x => x.id === id)
  fd.fund_name = f?.name ?? ''
  fd.pay_account = f?.name ?? ''
}

function openCreate() {
  Object.assign(fd, defaultFd())
  fd.order_no = generateOrderNo()
  fd.order_sn = fd.order_no
  // 应用默认仓库
  const defaultWhId = Number(localStorage.getItem('erp_default_warehouse_id')) || 0
  if (defaultWhId) {
    const wh = warehouseOptions.value.find((w: any) => w.id === defaultWhId)
    if (wh) { fd.warehouse_id = wh.id; fd.warehouse_name = wh.name }
  }
  isReadonly.value = false
  showForm.value = true
}

function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  // 历史数据仓库为空时，补填默认仓库
  if (!fd.warehouse_id) {
    const defaultWhId = Number(localStorage.getItem('erp_default_warehouse_id')) || 0
    if (defaultWhId) {
      const wh = warehouseOptions.value.find((w: any) => w.id === defaultWhId)
      if (wh) { fd.warehouse_id = wh.id; fd.warehouse_name = wh.name }
    }
  }
  if (!fd.fund_id) fd.fund_id = null
  fd.order_no = fd.order_no || row.order_sn || ''
  fd.order_sn = fd.order_sn || fd.order_no || ''
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  try { fd.attachments = Array.isArray(row.attachments_info) ? row.attachments_info : JSON.parse(row.attachments_info || '[]') } catch { fd.attachments = [] }
  // 加载 fee_items，若无则从旧 freight_amount/expense_amount 迁移
  let feeItems: any[] = []
  try { feeItems = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { feeItems = [] }
  if (!feeItems.length) {
    const freight = Number(row.freight_amount || 0)
    const expense = Number(row.expense_amount || 0)
    if (freight > 0) feeItems.push({ name: '运费', amount: freight, bearer: row.freight_bearer || 'buyer' })
    if (expense > 0) feeItems.push({ name: '单据支出', amount: expense, bearer: 'buyer' })
  }
  fd.fee_items = feeItems
  fd.total_amount = fd.items.reduce((s: number, r: any) => s + (r.num || 0) * (r.price || 0), 0)
  fd.expense_amount = Number(fd.expense_amount || 0)
  // 折扣字段从后端直接读取，不重新计算，避免覆盖已保存的折后金额
  if (!row.after_discount && row.after_discount !== 0) {
    fd.after_discount = fd.total_amount
  } else {
    fd.after_discount = Number(fd.after_discount)
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
    ElMessage.warning('请填写必填项'); return
  }
  if (!fd.warehouse_id) {
    const defaultWhId = Number(localStorage.getItem('erp_default_warehouse_id')) || 0
    const fallback = defaultWhId
      ? warehouseOptions.value.find((w: any) => w.id === defaultWhId)
      : warehouseOptions.value[0]
    if (fallback) {
      fd.warehouse_id = fallback.id
      fd.warehouse_name = fallback.name
    } else {
      ElMessage.warning('请选择仓库'); return
    }
  }
  if (!fd.items.length) {
    ElMessage.warning('请至少添加一件商品'); return
  }
  // 单号唯一性校验（仅新增时）
  if (!fd.id) {
    const autoNo = fd.order_no || fd.order_sn || ''
    if (autoNo) {
      try {
        const checkRes = await getProcureOrderList({ order_no: autoNo, list_rows: 5 })
        const existing = checkRes?.data?.rows ?? []
        if (existing.length > 0) {
          ElMessage.error(`采购单号 ${autoNo} 已存在，请修改后重试`)
          return
        }
      } catch { /* 查询失败不阻断保存 */ }
    }
  }
  if (!fd.pay_amount || fd.pay_amount <= 0) {
    try {
      await ElMessageBox.confirm('本次付款金额未填写，是否继续保存？', '提示', {
        confirmButtonText: '继续保存', cancelButtonText: '去填写', type: 'warning'
      })
    } catch { return }
  }
  // 有付款金额但未选账户时提醒
  if (Number(fd.pay_amount || 0) > 0 && !fd.fund_id) {
    try {
      await ElMessageBox.confirm('已填写付款金额但未选择付款账户，是否继续保存？', '提示', {
        confirmButtonText: '继续保存', cancelButtonText: '去选择', type: 'warning'
      })
    } catch { return }
  }
  saving.value = true
  try {
    const payload: Record<string, any> = {
      supplier_id: fd.supplier_id,
      supplier_name: fd.supplier_name,
      admin_name: fd.admin_name,
      order_date: fd.order_date,
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

    ElMessage.success('保存成功')
    if (andAudit && orderId) {
      try {
        await auditProcureOrder(orderId, 1)
        // 审核后自动创建并审核入库记录，更新库存
        try {
          const items = fd.items
          const existRes = await getProcureInhouseList({ order_id: orderId, list_rows: 5 })
          const existRows: any[] = existRes.data?.rows ?? []
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
            for (const r of existRows) {
              if (r.status !== 1) {
                await auditProcureInhouse(r.id, 1)
                const rItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
                await applyInhouseStockEffect(r.warehouse_id || fd.warehouse_id || 0, r.warehouse_name || fd.warehouse_name || '', rItems, 'in')
              }
            }
          }
        } catch (e: any) {
          console.warn('自动入库失败', e?.message)
        }
        const payAmount2 = Number(fd.pay_amount || 0)
        const fundId2 = Number(fd.fund_id || 0)
        // 付款单由后端审核时自动创建，前端不重复创建
        ElMessage.success(payAmount2 > 0 && fundId2 ? '审核成功，已自动入库并记录财务' : '审核成功，已自动入库')
      } catch (e: any) {
        ElMessage.warning('保存成功，但审核失败：' + (e?.message || ''))
      }
    }
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: any) {
  if (Number(row.status) === 1) {
    ElMessage.warning('请先执行【反审核】，再删除该采购单')
    return
  }
  await ElMessageBox.confirm('确定删除该采购单？', '提示', { type: 'warning' })
  await deleteProcureOrder(row.id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function batchDelProcureOrders({ ids }: { ids: number[] }) {
  const rows: any[] = tableRef.value?.selectedRows ?? []
  const auditedRows = rows.filter((r: any) => Number(r.status) === 1)
  if (auditedRows.length) {
    ElMessage.warning(`有 ${auditedRows.length} 条已审核的采购单无法删除，请先反审核再删除`)
    return Promise.reject(new Error('存在已审核单据'))
  }
  return http.post('/stock/PurchaseOrder/batchDel', { ids })
}

async function applyInhouseStockEffect(warehouseId: number, warehouseName: string, items: any[], direction: 'in' | 'out') {
  for (const item of items) {
    if (!item.goods_id || !item.num) continue
    try {
      const stockParams: any = { goods_id: item.goods_id, list_rows: 10 }
      if (warehouseId) stockParams.warehouse_id = warehouseId
      const stockRes = await http.get('/stock/StockAll/index', { params: stockParams })
      const stock = (stockRes.data?.rows ?? [])[0]
      const delta = direction === 'in' ? Number(item.num) * Number(item.unit_ratio || 1) : -Number(item.num) * Number(item.unit_ratio || 1)
      if (stock) {
        const newQty = Math.max(0, Number(stock.qty || 0) + delta)
        await http.post('/stock/StockAll/edit', { id: stock.id, qty: newQty })
      } else if (direction === 'in') {
        await http.post('/stock/StockAll/add', {
          goods_id: item.goods_id,
          goods_name: item.goods_name || '',
          goods_sn: item.goods_sn || '',
          warehouse_id: warehouseId,
          warehouse_name: warehouseName,
          qty: Number(item.num),
        })
      }
    } catch (e: any) {
      console.warn('库存更新失败', e?.message)
    }
  }
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? '审核通过' : '驳回'
  await ElMessageBox.confirm(`确定${action}该采购单？`, '提示', { type: 'warning' })
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
        const existRes = await getProcureInhouseList({ order_id: row.id, list_rows: 5 })
        const existRows: any[] = existRes.data?.rows ?? []
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
          // 已有入库单，确保已审核，同时更新库存
          for (const r of existRows) {
            if (r.status !== 1) {
              await auditProcureInhouse(r.id, 1)
              const rItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
              await applyInhouseStockEffect(r.warehouse_id || row.warehouse_id || 0, r.warehouse_name || row.warehouse_name || '', rItems, 'in')
            }
          }
        }
      } catch (e: any) {
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
          remark: `采购单付款 #${row.id}`,
        })
      } catch (e: any) { console.warn('创建付款单失败', e?.message) }
    }
    const auditMsg = status === 1
      ? (Number(row.pay_amount || 0) > 0 && Number(row.fund_id || 0) ? '审核成功，已自动入库并记录财务' : '审核成功，已自动入库')
      : `${action}成功`
    ElMessage.success(auditMsg)
    tableRef.value?.refresh()
    loadPaidMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
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
      if (auditedCount) parts.push(`${auditedCount} 笔已审核`)
      if (pendingCount) parts.push(`${pendingCount} 笔未审核`)
      ElMessage.warning(`该采购合同存在 ${parts.join('、')} 的退货单，请先前往【采购退货】处理后，再反审核该合同`)
      return
    }
  } catch (e: any) {
    console.warn('检查退货单失败', e?.message)
  }
  await ElMessageBox.confirm('反审核将撤销入库与财务入账，确定继续？', '反审核确认', { type: 'warning' })
  try {
    // 检查单据支出付款记录，若有则提示并撤销
    const expensePaid = expensePaidById.value[row.id] || 0
    if (expensePaid > 0) {
      await ElMessageBox.confirm(
        `该采购单存在单据支出付款记录（¥${expensePaid.toFixed(2)}），反审核将同时撤销该付款记录，确定继续？`,
        '撤销单据支出付款',
        { type: 'warning', confirmButtonText: '确定撤销', cancelButtonText: '取消' }
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
        `该采购单存在运费付款记录（¥${freightPaid.toFixed(2)}），反审核将同时撤销该付款记录，确定继续？`,
        '撤销运费付款',
        { type: 'warning', confirmButtonText: '确定撤销', cancelButtonText: '取消' }
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
    // 先反审核关联的采购入库记录
    try {
      const inhouseListRes = await getProcureInhouseList({ order_id: row.id, list_rows: 10 })
      const inhouseRows: any[] = inhouseListRes.data?.rows ?? []
      for (const r of inhouseRows) {
        if (r.status === 1) {
          await auditProcureInhouse(r.id, 0)
          const rItems = Array.isArray(r.goods_info) ? r.goods_info : JSON.parse(r.goods_info || '[]')
          await applyInhouseStockEffect(r.warehouse_id || 0, r.warehouse_name || '', rItems, 'out')
        }
      }
    } catch (e: any) {
      console.warn('采购入库反审核失败', e?.message)
    }
    await auditProcureOrder(row.id, 0)
    stockRefreshStore.trigger()
    ElMessage.success('反审核成功，库存与财务已回滚')
    tableRef.value?.refresh()
    loadPaidMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
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
    const priceNoTax = Number(g.cost_price) || 0
    fd.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      spec: g.spec || '', cate_name: g.cate_name || '', unit_name: g.unit_name || '',
      num: 1, price_no_tax: priceNoTax, tax_rate: 0,
      price: Number((priceNoTax * 1.13).toFixed(4)), remark: '',
      supplier_id: null, supplier_name: '' })
    fetchGoodsSpecs(g.id)
    fetchGoodsUnits(g.id, g.unit_name || '')
  }
  calcTotal()
}

// 切换采购单位时，更新 unit_ratio 字段供入库换算使用
function onUnitChange(row: any, unitName: string) {
  const units = goodsUnitMap[row.goods_id] ?? []
  const found = units.find(u => u.unit_name === unitName)
  row.unit_ratio = found ? found.ratio : 1
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
  if (!manualForm.goods_name.trim()) { ElMessage.warning('请输入商品名称'); return }
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
  ElMessage.success(`已导入 ${newItems.length} 件商品`)
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
      remark: `BOM物料（${selectedBomGoods.value?.goods_name ?? ''}）`,
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

const fieldLabelMap: Record<string, string> = {
  num: '采购数量',
  price_no_tax: '未税单价',
  tax_rate: '税率(%)',
  price: '含税单价',
  subtotal_no_tax: '未税合计',
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
    ElMessage.info('未税合计为只读计算列')
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
  ElMessage.success(`已批量设置 ${batchEditLabel.value} 为 ${batchEditValue.value}`)
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
  if (!supplierForm.name.trim()) { ElMessage.warning('请输入供应商名称'); return }
  addSupplierLoading.value = true
  try {
    const res = await createSupplier({ name: supplierForm.name.trim() })
    ElMessage.success('新增供应商成功')
    addSupplierVisible.value = false
    await loadSuppliers()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.supplier_id = newId; onSupplierChange(newId) }
    else {
      const last = supplierOptions.value[supplierOptions.value.length - 1]
      if (last) { fd.supplier_id = last.id; onSupplierChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
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
  if (!fundForm.name.trim()) { ElMessage.warning('请输入账户名称'); return }
  addFundLoading.value = true
  try {
    const res = await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success('新增账户成功')
    addFundVisible.value = false
    await loadFunds()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.fund_id = newId; onFundChange(newId) }
    else {
      const last = fundOptions.value[fundOptions.value.length - 1]
      if (last) { fd.fund_id = last.id; onFundChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
  } finally {
    addFundLoading.value = false
  }
}
</script>

<style scoped>
.order-page { height: 100%; }

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
