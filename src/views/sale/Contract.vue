<template>
  <div class="contract-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getContractList"
          del-path="/shop/ContractOrder/batchDel"
          export-file-name="销售合同" :params="searchForm"
          :row-class-name="({ row }: any) => row.status === 4 ? 'row-converted' : ''"
          :export-columns="{ order_sn: '合同编号', customer_name: '客户名称', total_amount: '合同金额', sign_date: '签约日期', expire_date: '到期日期', admin_name: '经办人', status: '状态', remark: '备注' }">
          <template #search>
            <el-input v-model="searchForm.contract_no" placeholder="合同编号" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:150px" />
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:110px">
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate" data-guide-id="guide-contract-create">新增合同</el-button>
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
                  <el-table-column prop="remark" label="备注" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column label="合同编号" min-width="150">
            <template #default="{ row }">{{ getContractSn(row) }}</template>
          </el-table-column>
          <el-table-column label="客户名称" min-width="140">
            <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
          </el-table-column>
          <el-table-column prop="total_amount" label="合同金额" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ calcContractAmount(row).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="签约日期" width="110">
            <template #default="{ row }">
              {{ (row.sign_date || row.contract_date || row.create_time || '').slice(0, 10) }}
            </template>
          </el-table-column>
          <el-table-column label="到期日期" width="110">
            <template #default="{ row }">{{ (row.expire_date || '').slice(0, 10) || '—' }}</template>
          </el-table-column>
          <el-table-column label="经办人" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : row.status === 4 ? 'warning' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : row.status === 4 ? '已转单' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="已收金额" width="110" align="right">
            <template #default="{ row }">
              <span style="color:#16a34a;font-weight:500">¥{{ getReceivedAmount(row).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="待收金额" width="110" align="right">
            <template #default="{ row }">
              <span :style="{ color: getPendingAmount(row) > 0 ? '#dc2626' : '#6b7280', fontWeight: '500' }">
                ¥{{ getPendingAmount(row).toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="收款状态" width="100" align="center">
            <template #default="{ row }">
              <el-tag v-if="row.status === 1" :type="getReceiveStatus(row).type" size="small">
                {{ getReceiveStatus(row).label }}
              </el-tag>
              <span v-else style="color:#c0c4cc;font-size:12px">—</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="300" fixed="right">
            <template #default="{ row }">
              <span v-if="row.status === 4" style="color:#16a34a;margin-right:4px;font-weight:700">✓</span>
              <el-tag v-if="row.status === 4" type="warning" size="small" style="margin-right:8px">已转单</el-tag>
              <el-button v-if="row.status === 1 || row.status === 4" type="primary" link size="small" @click="openEdit(row, true)">查看</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">编辑</el-button>
              <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 1 || row.status === 4" type="warning" link size="small" @click="handleAudit(row, 0)">反审核</el-button>
              <el-button v-if="row.status === 1 && getPendingAmount(row) > 0.01" type="success" link size="small" @click="router.push('/finance/collect-receipt')">去收款</el-button>
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="handleConvertToSaleOut(row)">转出库单</el-button>
              <el-button type="danger" link size="small" :disabled="row.status === 1 || row.status === 4" :title="row.status === 1 || row.status === 4 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
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
          <span class="form-title">{{ isReadonly ? '查看合同' : (fd.id ? '编辑合同' : '新增合同') }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">已审核</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="isReadonly" @click="handleContractPrint">打印</el-button>
          <el-button v-if="isReadonly" @click="handleContractExport">导出</el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="saving" @click="handleSave" data-guide-id="guide-contract-save">
            保存 <span style="font-size:11px;opacity:0.7">(Ctrl+S)</span>
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
                <el-form-item label="合同编号">
                  <el-input :value="fd.id ? fd.contract_no : '（保存后自动生成）'" disabled placeholder="自动生成" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="客户名称" prop="customer_id"
                  :rules="[{ required: true, message: '请选择客户' }]"
                  data-guide-id="guide-contract-customer">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.customer_id" placeholder="请选择客户" filterable style="flex:1"
                      @change="onCustomerChange">
                      <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="quickAddCustomerVisible = true" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="客户等级">
                  <el-select v-model="fd.level_id" placeholder="请选择等级（可选）" clearable style="width:100%"
                    @change="onLevelChange">
                    <el-option v-for="lv in levelOptions" :key="lv.id" :label="lv.name" :value="lv.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="经办人" prop="admin_name">
                  <el-select v-model="fd.admin_id" placeholder="请选择经办人" filterable clearable style="width:100%"
                    @change="onAdminChange">
                    <el-option v-for="s in staffOptions" :key="s.id" :label="s.name" :value="s.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="提成比例">
                  <div style="display:flex;gap:4px;width:100%;align-items:center">
                    <el-input-number
                      v-model="fd.commission_rate"
                      :min="0" :max="100" :precision="1"
                      controls-position="right"
                      style="flex:1"
                      :placeholder="fd.admin_id ? String(getCommissionRate(fd.admin_id)) : '0'"
                    />
                    <span style="font-size:13px;color:rgba(29,29,31,0.35)">%</span>
                    <el-button link size="small" @click="goToCommissionSetting" style="font-size:12px;padding:0 2px">设置</el-button>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="签约日期" prop="sign_date">
                  <el-date-picker v-model="fd.sign_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item label="到期日期" prop="expire_date">
                  <el-date-picker v-model="fd.expire_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="是否开票">
                  <el-switch v-model="fd.need_invoice" active-text="是" inactive-text="否" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="收款账户">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.receive_account" placeholder="请选择账户" clearable style="flex:1">
                      <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.name" />
                      <el-option label="现金" value="现金" />
                    </el-select>
                    <el-button :icon="Plus" @click="openAddFund" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6" />

              <!-- 行3 -->
              <el-col :span="6" v-if="fd.source_offer_no">
                <el-form-item label="来源报价">
                  <div style="display:flex;align-items:center;gap:6px;width:100%">
                    <el-input :value="fd.source_offer_no" disabled style="flex:1" />
                    <span v-if="calcOfferDisplayAmount > 0" style="font-size:13px;color:#0071e3;font-weight:600;white-space:nowrap">
                      ¥{{ calcOfferDisplayAmount.toFixed(2) }}
                    </span>
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="fd.source_offer_no ? 12 : 18">
                <el-form-item label="备注">
                  <el-input v-model="fd.remark" type="textarea" :rows="2" placeholder="请输入备注" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="附件">
                  <el-button :icon="Paperclip">上传附件</el-button>
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
              <el-button type="success" :icon="Document" size="small" @click="openOfferPicker">选择报价单</el-button>
              <el-button type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()" data-guide-id="guide-contract-goods">选择商品</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">新增商品</el-button>
              <el-button :icon="Upload" size="small">导入商品</el-button>
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
            <el-table-column label="单位" width="70" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" size="small" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>数量</span>
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
              <span class="settle-label">商品含税合计</span>
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
              <span class="settle-label">其他收支</span>
              <el-input-number v-model="fd.income_amount" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" @change="calcSettle" />
              <span style="font-size:11px;color:rgba(29,29,31,0.35)">正数=额外收入，负数=额外支出</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">本次收款</span>
              <el-input-number v-model="fd.receive_amount" :min="0" :max="finalReceivable" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" />
            </div>
            <div class="settle-item" v-if="customerPrepayBalance > 0 || fd.prepay_amount > 0">
              <span class="settle-label" style="color:#16a34a">
                可用预付款
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
              <span style="font-size:11px;color:rgba(29,29,31,0.35)">审核时自动核销</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">是否分期</span>
              <el-switch v-model="fd.installment" :disabled="isReadonly" active-text="是" inactive-text="否" />
            </div>
            <div class="settle-item">
              <span class="settle-label">物流费用</span>
              <el-input-number v-model="fd.freight_amount" :min="0" :precision="2" :disabled="isReadonly"
                size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">费用承担</span>
              <el-select v-model="fd.freight_bearer" size="small" style="width:120px" :disabled="isReadonly">
                <el-option label="买方承担" value="buyer" />
                <el-option label="卖方承担" value="seller" />
                <el-option label="各付一半" value="half" />
                <el-option label="免运费" value="free" />
              </el-select>
            </div>
          </div>
          <div class="settle-summary">
            <span>未税合计：<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">税额合计：<b style="color:#dc2626">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">商品含税合计：<b>¥{{ fd.total_amount.toFixed(2) }}</b></span>
            <template v-if="fd.discount_type !== 'none' && Number(fd.discount_value) > 0">
              <span style="margin-left:24px">折扣额：<b style="color:#16a34a">-¥{{ Number(fd.discount_type === 'percent' ? fd.total_amount * (fd.discount_value || 0) / 100 : fd.discount_value).toFixed(2) }}</b></span>
            </template>
            <span style="margin-left:24px">折后金额：<b>¥{{ fd.after_discount.toFixed(2) }}</b></span>
            <template v-if="fd.freight_amount > 0">
              <span style="margin-left:24px">物流费：<b style="color:#7c3aed">¥{{ freightCharge.toFixed(2) }}</b></span>
              <span style="margin-left:8px;font-size:12px;color:rgba(29,29,31,0.35)">（{{
                fd.freight_bearer === 'buyer' ? '买方承担' :
                fd.freight_bearer === 'seller' ? '卖方承担' :
                fd.freight_bearer === 'half' ? '各付一半' : '免运费'
              }}）</span>
            </template>
            <template v-if="Number(fd.income_amount) !== 0">
              <span style="margin-left:24px">其他收支影响：<b :style="{ color: Number(fd.income_amount) > 0 ? '#16a34a' : '#dc2626' }">{{ Number(fd.income_amount) > 0 ? '-' : '+' }}¥{{ Math.abs(Number(fd.income_amount)).toFixed(2) }}</b></span>
            </template>
            <span style="margin-left:24px">最终应收：<b style="color:#0071e3;font-size:16px">¥{{ finalReceivable.toFixed(2) }}</b></span>
            <template v-if="fd.prepay_amount > 0">
              <span style="margin-left:24px">预付款核销：<b style="color:#16a34a">-¥{{ Number(fd.prepay_amount).toFixed(2) }}</b></span>
            </template>
            <template v-if="fd.receive_amount > 0">
              <span style="margin-left:24px">本次收款：<b style="color:#16a34a">-¥{{ Number(fd.receive_amount).toFixed(2) }}</b></span>
            </template>
            <template v-if="fd.prepay_amount > 0 || fd.receive_amount > 0">
              <span style="margin-left:24px">实际待收：<b style="color:#dc2626;font-size:16px">¥{{ finalPending.toFixed(2) }}</b></span>
            </template>
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
        <el-form-item label="数量">
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

    <!-- 快速新增客户弹框 -->
    <el-dialog v-model="quickAddCustomerVisible" title="快速新增客户" width="360px" append-to-body>
      <el-form :model="quickCustomerForm" label-width="70px">
        <el-form-item label="客户名称" required>
          <el-input v-model="quickCustomerForm.nickname" placeholder="请输入客户名称" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="quickAddCustomerVisible = false">取消</el-button>
        <el-button type="primary" :loading="quickCustomerSaving" @click="confirmQuickAddCustomer">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 选择报价单弹框 -->
    <el-dialog v-model="offerPickerVisible" title="选择已审核报价单" width="880px" append-to-body>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <el-input v-model="offerPickerNo" placeholder="报价单号" clearable style="width:220px"
          @input="onOfferPickerSearch" />
        <el-input v-model="offerPickerCustomer" placeholder="客户名称" clearable style="width:220px"
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
        <el-table-column prop="offer_no" label="报价单号" min-width="160" />
        <el-table-column label="客户名称" min-width="140">
          <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
        </el-table-column>
        <el-table-column label="报价日期" width="110">
          <template #default="{ row }">{{ (row.offer_date || row.create_time || '').slice(0, 10) }}</template>
        </el-table-column>
        <el-table-column label="有效期至" width="110">
          <template #default="{ row }">{{ (row.expire_date || '').slice(0, 10) || '—' }}</template>
        </el-table-column>
        <el-table-column label="报价金额" width="120" align="right">
          <template #default="{ row }">¥{{ calcOfferAmount(row).toFixed(2) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="offerPickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedOffer" @click="confirmOfferPick">带入合同</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { Plus, Delete, Search, ArrowLeft, EditPen, Document, Upload, Paperclip } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getContractList, createContract, updateContract, deleteContract, auditContract, getContractDetail, getOfferList, getOfferDetail, auditOffer, getSaleReturnList, getSaleOutList } from '@/api/sale'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSpecList } from '@/api/goods'
import { getStaffList } from '@/api/personnel'
import { getFundList, createCollectReceipt, getCollectReceiptList, getExpenseList, createExpense, deleteExpense } from '@/api/finance'
import http from '@/api/http'
import { loadLevels, loadLevelMap, getLevelPrice, type LevelItem } from '@/utils/customerLevel'
import { getCommissionRate } from '@/utils/commission'
import { usePermissionStore } from '@/stores/permission'
import { TAX_RATES } from '@/config'

const DRAFT_KEY = 'sale_contract_draft_from_offer'
const permStore = usePermissionStore()
const router = useRouter()
const route = useRoute()

function parseRemarkTag(remark: string, tag: string): string {
  const safeTag = tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const matched = String(remark || '').match(new RegExp(`\\[${safeTag}:([^\\]]+)\\]`))
  return matched?.[1]?.trim() || ''
}

function stripContractRemarkTags(remark: string): string {
  return String(remark || '')
    .replace(/\[(NO|OID|PP):[^\]]+\]\s*/g, '')
    .trim()
}

function buildContractRemark() {
  const parts = [
    fd.contract_no ? `[NO:${fd.contract_no}]` : '',
    fd.source_offer_id ? `[OID:${fd.source_offer_id}]` : '',
    Number(fd.prepay_amount || 0) > 0 ? `[PP:${Number(fd.prepay_amount || 0).toFixed(2)}]` : '',
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
  return `${row?.customer_name || ''} 销售合同运费（我方承担） - ${orderSn}`.trim()
}

function isAutoContractReceiptRow(row: any, orderSn: string) {
  const sn = String(row?.order_sn || row?.order_no || '').trim()
  const remark = String(row?.remark || '')
  if (sn !== orderSn) return false
  return remark.includes(`合同自动收款 - ${orderSn}`) || remark.includes(`预付款核销 - ${orderSn}`)
}

function parseItems(goodsInfo: any): any[] {
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

// ── 规格选项缓存（goods_id → string[]） ──────────────────────────────────────
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

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = TAX_RATES

// ── 客户等级 ──────────────────────────────────────────────────────────────────
const levelOptions = ref<LevelItem[]>(loadLevels())
const levelMap = loadLevelMap()

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
const searchForm = reactive<any>({ contract_no: '', customer_name: '', status: '' })
const showForm = ref(false)
const isReadonly = ref(false)

// ── 收款状态映射 ──────────────────────────────────────────────────────────────
const receiptMap = ref<Record<string, number>>({}) // key: order_sn, value: total received

async function loadReceiptMap() {
  try {
    const res = await getCollectReceiptList({ list_rows: 2000 })
    const rows: any[] = res?.data?.rows ?? []
    const map: Record<string, number> = {}
    for (const r of rows) {
      const sn = String(r?.order_sn || r?.order_no || '').trim()
      if (sn) map[sn] = (map[sn] || 0) + Number(r.amount || 0)
    }
    receiptMap.value = map
  } catch { /* ignore */ }
}

function getContractSn(row: any): string {
  const taggedSn = parseRemarkTag(row?.remark || '', 'NO')
  if (taggedSn) return taggedSn
  return String(row?.order_sn || row?.contract_no || (row?.id ? `HT${String(row.id).padStart(4,'0')}` : '')).trim()
}

function parseContractRemark(remark: string): string {
  return stripContractRemarkTags(remark)
}

function parseSourceOfferId(remark: string): number {
  return Number(parseRemarkTag(remark, 'OID') || 0)
}

function getReceivedAmount(row: any): number {
  const sn = getContractSn(row)
  return receiptMap.value[sn] ?? Number(row.receive_amount || 0)
}

function getPendingAmount(row: any): number {
  return Math.max(0, calcContractAmount(row) - getReceivedAmount(row))
}

function getReceiveStatus(row: any): { label: string; type: string } {
  const total = calcContractAmount(row)
  const received = getReceivedAmount(row)
  if (total <= 0) return { label: '无需收款', type: 'info' }
  if (received <= 0) return { label: '未收款', type: 'danger' }
  if (received >= total - 0.01) return { label: '已收清', type: 'success' }
  return { label: '部分收款', type: 'warning' }
}

// ── 客户选项 ──────────────────────────────────────────────────────────────────
const customerOptions = ref<any[]>([])
async function loadCustomers() {
  const res = await getSaleCustomerList({ list_rows: 500 })
  customerOptions.value = res.data?.rows ?? []
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

onMounted(async () => {
  await Promise.all([loadCustomers(), loadStaff(), loadFunds(), loadReceiptMap()])
  handleRouteFromOffer()
  if (route.query.contract_no) searchForm.contract_no = String(route.query.contract_no)
})

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface ContractItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; cate_name: string; unit_name: string
  num: number; price_no_tax: number; tax_rate: number; price: number; remark: string
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
  receive_amount: 0,
  prepay_amount: 0,   // 本次使用预付款金额
  installment: false,
  items: [] as ContractItem[],
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
const freightCharge = computed(() =>
  fd.freight_bearer === 'buyer' ? Number(fd.freight_amount || 0)
    : fd.freight_bearer === 'half' ? Number(fd.freight_amount || 0) / 2
    : 0
)
const finalReceivable = computed(() =>
  Math.max(0, Number(fd.after_discount || 0) + freightCharge.value - Number(fd.income_amount || 0))
)
// 实际待收 = 应收 - 预付款核销 - 本次收款
const finalPending = computed(() =>
  Math.max(0, finalReceivable.value - Number(fd.prepay_amount || 0) - Number(fd.receive_amount || 0))
)

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
  const total = Number(row.total_amount || 0)
  const discType = String(row.discount_type || 'none')
  const discVal = Number(row.discount_value || 0)
  const afterDisc = Number(row.after_discount)
  const freight = Number(row.freight_amount || 0)
  const bearer = String(row.freight_bearer || 'seller')
  const income = Number(row.income_amount || 0)
  let base = total
  if (Number.isFinite(afterDisc) && afterDisc >= 0) base = afterDisc
  else if (discType === 'amount' && discVal > 0) base = Math.max(0, total - discVal)
  else if (discType === 'percent' && discVal > 0) base = Math.max(0, total * (1 - discVal / 100))
  const fc = bearer === 'buyer' ? freight : bearer === 'half' ? freight / 2 : 0
  return Math.max(0, base + fc - income)
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

function removeItem(index: number) {
  fd.items.splice(index, 1)
  calcTotal()
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
  ElMessage.info('已按新等级刷新商品价格')
}

async function openCreate() {
  Object.assign(fd, defaultFd())
  isReadonly.value = false
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
  fd.remark = parseContractRemark(row.remark || '')
  fd.source_offer_id = parseSourceOfferId(row.remark || '')
  fd.prepay_amount = Number(row.prepay_amount || parsePrepayAmount(row.remark || '') || 0)
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  calcTotal()
  fd.items.forEach(item => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
  isReadonly.value = readonly
  showForm.value = true
  // 拉取完整详情，补全列表里缺失的字段（如 prepay_amount）
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
      fd.items = items.length ? items : (()=>{ try { return JSON.parse(full.goods_info||'[]') } catch { return [] } })()
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
  tableRef.value?.refresh()
}

function buildContractHtml() {
  const items: any[] = fd.items || []
  const rows = items.map((item: any, i: number) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${item.goods_name || ''}</td>
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
  <title>销售合同 ${(fd as any).contract_no || ''}</title><link rel="icon" href="data:,">
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
        <td class="sl">最终应收</td><td style="color:#0071e3"><b>¥${Math.max(0,Number(fd.after_discount||0)+(fd.freight_bearer==='buyer'?Number(fd.freight_amount||0):fd.freight_bearer==='half'?Number(fd.freight_amount||0)/2:0)-Number(fd.income_amount||0)).toFixed(2)}</b></td>
      </tr>
      <tr>
        <td class="sl">预付款核销</td><td style="color:#16a34a">${Number(fd.prepay_amount||0)>0?'-¥'+Number(fd.prepay_amount).toFixed(2):'—'}</td>
        <td class="sl">实际待收</td><td style="color:#dc2626"><b>¥${Math.max(0,Math.max(0,Number(fd.after_discount||0)+(fd.freight_bearer==='buyer'?Number(fd.freight_amount||0):fd.freight_bearer==='half'?Number(fd.freight_amount||0)/2:0)-Number(fd.income_amount||0))-Number(fd.prepay_amount||0)-Number(fd.receive_amount||0)).toFixed(2)}</b></td>
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
  if (!w) { ElMessage.warning('请允许弹窗'); return }
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
  a.download = `销售合同_${(fd as any).order_sn || (fd as any).customer_name || ''}.html`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出，用浏览器打开后可另存为PDF')
}

async function ensureContractFreightExpense(row: any) {
  const freightAmt = Number(row?.freight_amount || 0)
  const bearer = String(row?.freight_bearer || 'seller')
  if (freightAmt <= 0 || bearer !== 'seller') return

  const orderSn = getContractOrderSn(row)
  const remark = buildContractExpenseRemark({ ...row, order_sn: orderSn })
  const existing = await getExpenseList({ list_rows: 1000 })
  const rows: any[] = existing?.data?.rows ?? existing?.data?.list ?? []
  if (rows.some((item: any) => String(item?.remark || '').includes(`销售合同运费（我方承担） - ${orderSn}`))) return

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
  const targets = rows.filter((item: any) => String(item?.remark || '').includes(`销售合同运费（我方承担） - ${orderSn}`))
  for (const item of targets) {
    await deleteExpense(Number(item.id))
  }
}

async function handleSave() {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning('请填写必填项'); return
  }
  if (!fd.items.length) {
    ElMessage.warning('请至少添加一件商品'); return
  }
  if (Number(fd.receive_amount || 0) <= 0 && Number(fd.prepay_amount || 0) <= 0 && finalReceivable.value > 0) {
    try {
      await ElMessageBox.confirm('本次收款金额未填写，是否继续保存？', '提示', {
        confirmButtonText: '继续保存', cancelButtonText: '去填写', type: 'warning'
      })
    } catch { return }
  }
  saving.value = true
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
      receive_amount: fd.receive_amount,
      receive_account: fd.receive_account || '',
      need_invoice: fd.need_invoice ? 1 : 0,
      installment: fd.installment ? 1 : 0,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) payload.id = fd.id
    if (fd.contract_no) payload.order_sn = fd.contract_no
    if (fd.customer_name) payload.customer_name = fd.customer_name
    if (fd.admin_name) payload.admin_name = fd.admin_name
    if (fd.sign_date) { payload.sign_date = fd.sign_date; payload.contract_date = fd.sign_date }
    const isNew = !fd.id
    const res = fd.id ? await updateContract(payload) : await createContract(payload)
    const newId = Number(res?.data?.id || res?.data?.row?.id || res?.data?.data?.id || fd.id || 0)
    if (!fd.id && newId) fd.id = newId
    // 报价单转合同：标记报价单为已转换
    if (isNew && fd.source_offer_id) {
      try {
        await http.post('/shop/offerOrder/edit', { id: fd.source_offer_id, status: 4 })
      } catch { /* ignore */ }
    }
    // 新建合同自动审核
    if (isNew && newId) {
      try {
        await autoAuditContract(newId)
        const detail = await getContractDetail(newId)
        const row = detail?.data?.row || detail?.data || {}
        await autoCreateReceipt(row)
        await ensureContractFreightExpense(row)
      } catch (e: any) {
        ElMessage.warning(`保存成功，但自动审核未完成：${e?.message || ''}，请手动审核`)
      }
    }
    ElMessage.success('保存成功')
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function autoAuditContract(id: number) {
  if (!id) throw new Error('合同ID无效')
  await auditContract(id, 1)
  const detail = await getContractDetail(id)
  if (Number(detail?.data?.row?.status ?? detail?.data?.status ?? 0) !== 1) {
    throw new Error('自动审核未完成，请在列表手动审核')
  }
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
  const receiptDate = String(row?.sign_date || row?.contract_date || row?.create_time || '').slice(0, 10)
    || new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10)

  let existingRows: any[] = []
  try {
    const existing = await getCollectReceiptList({ keyword: orderSn, list_rows: 200 })
    existingRows = existing?.data?.rows ?? []
  } catch { /* ignore */ }

  const existingPrepay = existingRows.some((item) => isAutoContractReceiptRow(item, orderSn) && String(item?.remark || '').includes('预付款核销'))
  const existingReceive = existingRows.some((item) => isAutoContractReceiptRow(item, orderSn) && String(item?.remark || '').includes('合同自动收款'))

  const prepayAmt = Math.min(Math.max(0, Number(row?.prepay_amount || parsePrepayAmount(row?.remark || '') || fd.prepay_amount || 0)), finalAmt)
  const receiveAmt = Math.min(
    Math.max(0, Number(row?.receive_amount || 0)),
    Math.max(0, finalAmt - prepayAmt),
  )

  // 预付款核销：只登记真实核销金额，不再自动补齐剩余应收
  if (prepayAmt > 0 && customerId) {
    if (!existingPrepay) {
      await createCollectReceipt({
        contact_type: 'customer',
        customer_id: customerId, customer_name: customerName,
        contact_id: customerId, contact_name: customerName,
        amount: prepayAmt, order_sn: orderSn, order_no: orderSn,
        fund_id: Number(fundItem?.id || 0), fund_name: fundItem?.name || account || '',
        receipt_date: receiptDate, remark: `预付款核销 - ${orderSn}`,
      })
    }
  }

  if (receiveAmt > 0.01) {
    if (!existingReceive) {
      await createCollectReceipt({
        contact_type: 'customer',
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
    calcTotal()
    fd.items.forEach(item => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
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
      ? `已载入报价单 ${draft.source_offer_no}，请确认后保存合同`
      : '已载入报价数据，请确认后保存合同')
  } catch {
    ElMessage.warning('报价转合同草稿读取失败')
  }
}

function normalizeItem(t: any): ContractItem {
  const price = Number(t?.price || 0)
  const taxRate = Number(t?.tax_rate || 0)
  return {
    goods_id: Number(t?.goods_id || 0),
    goods_name: t?.goods_name || '',
    goods_sn: t?.goods_sn || '',
    spec: t?.spec || '',
    cate_name: t?.cate_name || '',
    unit_name: t?.unit_name || '',
    num: Number(t?.num || 0),
    price_no_tax: Number(t?.price_no_tax || (taxRate > 0 ? Number((price / (1 + taxRate / 100)).toFixed(4)) : price)),
    tax_rate: taxRate,
    price,
    remark: t?.remark || '',
  }
}

async function handleDelete(id: number) {
  // 检查是否有关联出库单
  try {
    const detail = await getContractDetail(id)
    const row = detail?.data?.row || detail?.data || {}
    const orderSn = getContractSn(row)
    if (orderSn) {
      const saleOutRes = await getSaleOutList({ keyword: orderSn, list_rows: 100 })
      const linkedOut = (saleOutRes?.data?.rows ?? [])
      if (linkedOut.length > 0) {
        ElMessage.error(`该合同存在 ${linkedOut.length} 笔关联出库单，请先反审核并删除出库单后再删除合同`)
        return
      }
    }
  } catch { /* ignore */ }

  // 检查是否有关联收款单
  try {
    const detail = await getContractDetail(id)
    const row = detail?.data?.row || detail?.data || {}
    const orderSn = String(row?.order_sn || row?.contract_no || '').trim()
    if (orderSn) {
      const existing = await getCollectReceiptList({ keyword: orderSn, list_rows: 500 })
      const linked = (existing?.data?.rows ?? []).filter((r: any) =>
        String(r?.order_sn || r?.order_no || '').trim() === orderSn
      )
      if (linked.length > 0) {
        ElMessage.error(`该合同存在 ${linked.length} 笔关联收款单，请先前往【财务 > 收款单】删除后再删除合同`)
        return
      }
    }
  } catch { /* ignore */ }
  await ElMessageBox.confirm('确定删除该合同？', '提示', { type: 'warning' })
  await deleteContract(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function handleAudit(row: any, status: number) {
  if (status === 2) { ElMessage.warning('驳回操作已禁用'); return }
  const action = status === 1 ? '审核通过' : '反审核'

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
          ElMessage.error(`该合同存在 ${manualLinked.length} 笔手工收款单，请先前往【财务 > 收款单】删除后再反审核`)
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
          ElMessage.warning(`该合同存在 ${auditedReturns.length} 笔已审核的退货单，请先前往【销售退货】将退货单反审核后，再反审核该合同`)
          return
        }
      }
    } catch { /* ignore */ }
  }

  try {
    await ElMessageBox.confirm(`确定${action}该合同？`, '提示', { type: 'warning' })
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
      try { await autoCreateReceipt(freshRow) } catch (e: any) { errMsg = e?.message || '自动创建收款失败' }
      try { await ensureContractFreightExpense(freshRow) } catch (e: any) { errMsg = errMsg || e?.message || '自动写入销售运费失败' }
    } else if (status === 0) {
      try { await cancelAutoReceipt(freshRow) } catch (e: any) { errMsg = e?.message || '自动撤回收款失败' }
      try { await cleanupContractFreightExpense(freshRow) } catch (e: any) { errMsg = errMsg || e?.message || '自动撤回销售运费失败' }
      // 反审核后把来源报价单状态恢复为已审核（1）
      const offerId = parseSourceOfferId(freshRow.remark || '') || parseSourceOfferId(row.remark || '')
      if (offerId) {
        try { await http.post('/shop/offerOrder/edit', { id: offerId, status: 1 }) } catch { /* ignore */ }
      }
    }
    errMsg ? ElMessage.warning(`${action}成功，但财务联动失败：${errMsg}`) : ElMessage.success(`${action}成功`)
    tableRef.value?.refresh()
    loadReceiptMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

async function handleConvertToSaleOut(row: any) {
  await ElMessageBox.confirm(`确定将销售合同「${getContractSn(row)}」转为销售出库单？`, '转出库单', { type: 'info' })
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
    const existing = await getCollectReceiptList({ keyword: orderSn, list_rows: 500 })
    // 只删除系统自动生成的收款单，手工收款单保留并由前置校验拦截
    const rows = (existing?.data?.rows ?? []).filter((r: any) =>
      isAutoContractReceiptRow(r, orderSn)
    )
    for (const r of rows) {
      try { await http.post('/finance/CollectReceipt/del', { id: Number(r.id) }) } catch { /* ignore */ }
    }
  } catch { /* ignore */ }
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    if (fd.items.some(i => i.goods_id === g.id)) continue
    const basePrice = Number(g.sell_price) || 0
    const levelPrice = fd.level_id ? (getLevelPrice(fd.level_id, g.id) ?? basePrice) : basePrice
    fd.items.push({ goods_id: g.id, goods_name: g.goods_name, goods_sn: g.goods_sn || '',
      spec: g.spec || '', cate_name: g.cate_name || '', unit_name: g.unit_name || '',
      num: 1, price_no_tax: Number(levelPrice.toFixed(4)), tax_rate: 0,
      price: Number(levelPrice.toFixed(4)), remark: '' })
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
  if (!manualForm.goods_name.trim()) { ElMessage.warning('请输入商品名称'); return }
  fd.items.push({
    goods_id: 0,
    goods_name: manualForm.goods_name,
    goods_sn: manualForm.goods_sn,
    spec: manualForm.spec,
    cate_name: '',
    unit_name: manualForm.unit_name,
    num: manualForm.num,
    price_no_tax: Number(manualForm.price.toFixed(4)),
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
  num: '数量',
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

// ── 快速新增客户 ──────────────────────────────────────────────────────────────
const quickAddCustomerVisible = ref(false)
const quickCustomerSaving = ref(false)
const quickCustomerForm = reactive({ nickname: '' })

async function confirmQuickAddCustomer() {
  if (!quickCustomerForm.nickname.trim()) {
    ElMessage.warning('请输入客户名称'); return
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
    ElMessage.success('客户创建成功')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '创建失败')
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
  if (!selectedOffer.value) { ElMessage.warning('请选择报价单'); return }
  if (fd.items.length) {
    await ElMessageBox.confirm('带入报价将覆盖当前商品明细，是否继续？', '提示', { type: 'warning' })
  }
  try {
    const detail = await getOfferDetail(Number(selectedOffer.value.id))
    const offer = detail?.data?.row || selectedOffer.value
    applyOfferToForm(offer)
    offerPickerVisible.value = false
    offerTableRef.value?.setCurrentRow?.(null)
    selectedOffer.value = null
    ElMessage.success(offer.offer_no ? `已带入报价单 ${offer.offer_no}` : '已带入报价数据')
  } catch (e: any) {
    ElMessage.error(e?.message ?? '带入报价失败')
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
  fd.items.forEach(item => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
}
</script>

<style scoped>
.contract-page { height: 100%; }

:deep(.row-converted) {
  background-color: #f5f5f5 !important;
  color: #aaa;
}
:deep(.row-converted) td { color: #aaa !important; }
:deep(.row-converted) .el-tag { opacity: 0.7; }
:deep(.row-converted) .el-button { opacity: 0.7; }

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
