<template>
  <div class="saleout-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getSaleOutList" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_no" placeholder="出库单号" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:150px" />
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:110px">
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增出库</el-button>
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
                      <span style="color:#165dff;font-weight:500">¥{{ ((item.num||0)*(item.price||0)).toFixed(2) }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column prop="remark" label="备注" min-width="100" />
                </el-table>
              </div>
            </template>
          </el-table-column>
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="order_no" label="出库单号" min-width="150" />
          <el-table-column prop="customer_name" label="客户名称" min-width="140" />
          <el-table-column prop="warehouse_name" label="仓库" width="120" />
          <el-table-column prop="total_amount" label="出库金额" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#165dff;font-weight:500">¥{{ Number(row.total_amount || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="{ row }">
              <el-button type="success" link size="small" @click="openEdit(row)">查看</el-button>
              <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
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
          <span class="form-title">{{ fd.id ? '编辑出库单' : '新增出库单' }}</span>
        </div>
        <div class="form-actions">
          <el-button :icon="Document" @click="handlePrint">打印出库单</el-button>
          <el-button type="primary" :loading="saving" @click="handleSave">
            保存 <span style="font-size:11px;opacity:0.7">(Ctrl+S)</span>
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">基本信息</div>
          <el-form ref="formRef" :model="fd" label-width="80px">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item label="出库单号">
                  <el-input :value="fd.id ? fd.order_no : '（保存后自动生成）'" disabled placeholder="自动生成" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="客户名称" prop="customer_id"
                  :rules="[{ required: true, message: '请选择客户' }]">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.customer_id" placeholder="请选择客户" filterable style="flex:1"
                      @change="onCustomerChange">
                      <el-option v-for="c in customerOptions" :key="c.id" :label="c.nickname" :value="c.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="quickAddCustomerVisible = true" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="经办人" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" placeholder="请选择或输入经办人" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="出库日期" prop="out_date">
                  <el-date-picker v-model="fd.out_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item label="仓库" prop="warehouse_id">
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
              <el-col :span="18">
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
          <div class="goods-toolbar">
            <div class="toolbar-left">
              <el-button type="primary" :icon="Plus" size="small" @click="openGoodsPicker">选择商品</el-button>
              <el-button :icon="EditPen" size="small" @click="openManualAdd">新增商品</el-button>
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
                <el-input v-model="row.cate_name" size="small" placeholder="分类" />
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
                  <span>出库数量</span>
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
                <span style="color:#f53f3f">{{ ((row.num||0) * (row.price_no_tax||0) * (row.tax_rate||0) / 100).toFixed(2) }}</span>
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
                <span style="color:#165dff;font-weight:500">{{ ((row.num||0) * (row.price||0)).toFixed(2) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="批次" width="130">
              <template #default="{ row }">
                <el-input v-model="row.batch_no" size="small" placeholder="批次/打码日期" />
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
              <span class="settle-label">本单应收</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">运费</span>
              <el-input-number v-model="fd.freight_amount" :min="0" :precision="2"
                size="small" style="width:110px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">运费承担</span>
              <el-select v-model="fd.freight_bearer" size="small" style="width:110px" @change="calcSettle">
                <el-option label="我方承担" value="seller" />
                <el-option label="客户承担" value="buyer" />
                <el-option label="各半" value="half" />
                <el-option label="免运费" value="free" />
              </el-select>
            </div>
            <div class="settle-item">
              <span class="settle-label">折扣方式</span>
              <el-select v-model="fd.discount_type" size="small" style="width:120px" @change="calcSettle">
                <el-option label="无折扣" value="none" />
                <el-option label="按金额折扣" value="amount" />
                <el-option label="按百分比折扣" value="percent" />
              </el-select>
            </div>
            <div class="settle-item" v-if="fd.discount_type !== 'none'">
              <span class="settle-label">{{ fd.discount_type === 'percent' ? '折扣(%)' : '折扣金额' }}</span>
              <el-input-number v-model="fd.discount_value" :min="0"
                :max="fd.discount_type === 'percent' ? 100 : fd.total_amount"
                :precision="2" size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">折后金额</span>
              <span class="settle-value">¥{{ fd.after_discount.toFixed(2) }}</span>
            </div>
            <div class="settle-item">
              <span class="settle-label">单据收入</span>
              <el-input-number v-model="fd.income_amount" :min="0" :precision="2"
                size="small" style="width:130px" @change="calcSettle" />
            </div>
            <div class="settle-item">
              <span class="settle-label">本次收款</span>
              <el-input-number v-model="fd.receive_amount" :min="0" :precision="2"
                size="small" style="width:130px" />
            </div>
            <div class="settle-item">
              <span class="settle-label">是否分期</span>
              <el-switch v-model="fd.installment" active-text="是" inactive-text="否" />
            </div>
          </div>
          <div class="settle-summary">
            <span>未税合计：<b>¥{{ totalNoTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">税额合计：<b style="color:#f53f3f">¥{{ totalTax.toFixed(2) }}</b></span>
            <span style="margin-left:24px">含税合计：<b style="color:#165dff;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
            <span style="margin-left:24px">商品成本：<b style="color:#86909c">¥{{ totalCost.toFixed(2) }}</b></span>
            <span style="margin-left:24px">运费：<b style="color:#86909c">¥{{ freightCost.toFixed(2) }}</b></span>
            <span style="margin-left:24px">净利润：<b :style="{ color: netProfit >= 0 ? '#00b42a' : '#f53f3f', fontSize: '16px' }">¥{{ netProfit.toFixed(2) }}</b></span>
            <span style="margin-left:12px">利润率：<b :style="{ color: profitRate >= 0 ? '#00b42a' : '#f53f3f' }">{{ profitRate.toFixed(1) }}%</b></span>
          </div>
        </div>

      </div>
    </div>

    <!-- 商品选择弹框 -->
    <el-dialog v-model="goodsPickerVisible" title="选择商品" width="720px" append-to-body>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <el-input v-model="goodsPickerKeyword" placeholder="搜索商品名称/编码" clearable style="width:240px"
          :prefix-icon="Search" @input="onGoodsPickerSearch" />
        <el-select v-model="goodsPickerCate" placeholder="商品分类" clearable style="width:150px"
          @change="loadGoodsOptions">
          <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </div>
      <el-table ref="goodsTableRef" :data="goodsOptions" v-loading="goodsLoading"
        border height="360" @selection-change="onGoodsSelectionChange">
        <el-table-column type="selection" width="45" />
        <el-table-column prop="goods_sn" label="商品编码" width="120" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="cate_name" label="分类" width="90" />
        <el-table-column prop="unit_name" label="单位" width="65" align="center" />
        <el-table-column prop="sell_price" label="销售价" width="90" align="right" />
      </el-table>
      <template #footer>
        <span style="color:#86909c;font-size:13px">已选 {{ selectedGoodsRows.length }} 件</span>
        <el-button style="margin-left:12px" @click="goodsPickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedGoodsRows.length" @click="confirmGoods">确认添加</el-button>
      </template>
    </el-dialog>

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
        <el-form-item label="出库数量">
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

    <!-- 新增资金账户弹框 -->
    <el-dialog v-model="addFundVisible" title="新增资金账户" width="360px" append-to-body>
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

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Delete, Search, ArrowLeft, EditPen, Document, Upload, Camera, Paperclip } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getSaleOutList, createSaleOut, deleteSaleOut } from '@/api/sale'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getGoodsList, getGoodsCateList, getSpecList } from '@/api/goods'
import { getWarehouseList } from '@/api/warehouse'
import { getFundList, createFund } from '@/api/finance'
import StaffSelect from '@/components/StaffSelect.vue'

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = [0, 1, 3, 6, 9, 10, 13, 16, 17]

// ── 列表 ─────────────────────────────────────────────────────────────────────
const tableRef = ref<InstanceType<typeof ScTable>>()

function parseItems(goodsInfo: any): any[] {
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

// ── 分类选项（商品选择器用） ──────────────────────────────────────────────────
const cateOptions = ref<any[]>([])
async function loadCates() {
  const res = await getGoodsCateList({ list_rows: 200 })
  cateOptions.value = res.data?.rows ?? []
}

onMounted(() => { loadCustomers(); loadWarehouses(); loadCates(); loadFunds() })

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
  out_date: new Date().toISOString().slice(0, 10),
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
  fd.customer_name = c?.nickname ?? ''
}

function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
}

function openCreate() {
  Object.assign(fd, defaultFd())
  showForm.value = true
}

function openEdit(row: any) {
  Object.assign(fd, defaultFd(), row)
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  calcTotal()
  fd.items.forEach((item: any) => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
  showForm.value = true
}

function backToList() {
  showForm.value = false
  tableRef.value?.refresh()
}

function handlePrint() {
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
    <html><head><title>出库单</title>
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
    <h2>销售出库单</h2>
    <div class="info">
      <span>单号：<b>${fd.order_no || '待生成'}</b></span>
      <span>客户：<b>${fd.customer_name}</b></span>
      <span>日期：<b>${fd.out_date}</b></span>
      <span>经办人：<b>${fd.admin_name || '-'}</b></span>
      <span>运费：<b>¥${Number(fd.freight_amount || 0).toFixed(2)}（${
        { seller: '我方承担', buyer: '客户承担', half: '各半', free: '免运费' }[fd.freight_bearer] || ''
      }）</b></span>
    </div>
    <table><thead><tr>
      <th>#</th><th>商品名称</th><th>规格</th><th>批次</th><th>单位</th><th>数量</th><th>单价</th><th>小计</th>
    </tr></thead><tbody>${items}</tbody></table>
    <div class="total">
      含税合计：<b style="color:#165dff">¥${fd.total_amount.toFixed(2)}</b>
      &emsp;净利润：<b class="profit">¥${netProfit.value.toFixed(2)}</b>
      &emsp;利润率：<b class="profit">${profitRate.value.toFixed(1)}%</b>
    </div>
    <script>window.onload=()=>{window.print();window.onafterprint=()=>window.close()}<\/script>
    </body></html>`
  const w = window.open('', '_blank', 'width=900,height=700')
  w?.document.write(html)
  w?.document.close()
}

async function handleSave() {
  try { await formRef.value?.validate() } catch {
    ElMessage.warning('请填写必填项'); return
  }
  if (!fd.items.length) {
    ElMessage.warning('请至少添加一件商品'); return
  }
  saving.value = true
  try {
    const payload = {
      ...fd,
      goods_info: JSON.stringify(fd.items),
      items: undefined,
    }
    await createSaleOut(payload)
    ElMessage.success('保存成功')
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该出库单？', '提示', { type: 'warning' })
  await deleteSaleOut(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsPickerVisible = ref(false)
const goodsLoading = ref(false)
const goodsOptions = ref<any[]>([])
const goodsPickerKeyword = ref('')
const goodsPickerCate = ref<any>('')
const selectedGoodsRows = ref<any[]>([])
const goodsTableRef = ref()
let searchTimer: any

async function loadGoodsOptions() {
  goodsLoading.value = true
  try {
    const res = await getGoodsList({
      keyword: goodsPickerKeyword.value || undefined,
      cate_id: goodsPickerCate.value || undefined,
      list_rows: 50,
    })
    goodsOptions.value = res.data?.rows ?? []
  } finally {
    goodsLoading.value = false
  }
}

function onGoodsPickerSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(loadGoodsOptions, 300)
}

function onGoodsSelectionChange(rows: any[]) {
  selectedGoodsRows.value = rows
}

function openGoodsPicker() {
  goodsPickerKeyword.value = ''
  goodsPickerCate.value = ''
  selectedGoodsRows.value = []
  goodsPickerVisible.value = true
  loadGoodsOptions()
}

function confirmGoods() {
  for (const g of selectedGoodsRows.value) {
    if (fd.items.some(i => i.goods_id === g.id)) continue
    const priceNoTax = Number(g.sell_price) || 0
    fd.items.push({
      goods_id: g.id,
      goods_name: g.goods_name,
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      cate_name: g.cate_name || '',
      unit_name: g.unit_name || '',
      batch_no: '',
      cost_price: Number(g.cost_price) || 0,
      num: 1,
      price_no_tax: priceNoTax,
      tax_rate: 13,
      price: Number((priceNoTax * 1.13).toFixed(4)),
      remark: '',
    } as any)
    fetchGoodsSpecs(g.id)
  }
  calcTotal()
  goodsPickerVisible.value = false
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
    tax_rate: 13,
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
  num: '出库数量',
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
    const res = await createSaleCustomer({ nickname: quickCustomerForm.nickname })
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
  if (!fundForm.name.trim()) { ElMessage.warning('请输入账户名称'); return }
  addFundLoading.value = true
  try {
    const res = await createFund({ name: fundForm.name.trim(), balance: fundForm.balance })
    ElMessage.success('新增账户成功')
    addFundVisible.value = false
    await loadFunds()
    const newName = fundForm.name.trim()
    fd.receive_account = newName
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
  } finally {
    addFundLoading.value = false
  }
}
</script>

<style scoped>
.saleout-page { height: 100%; }

.expand-detail {
  padding: 12px 20px 12px 48px;
  background: #f8faff;
}
.expand-title {
  font-size: 12px;
  font-weight: 600;
  color: #4e5969;
  margin-bottom: 8px;
}
.expand-table {
  border-radius: 4px;
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

.form-title { font-size: 15px; font-weight: 600; color: #1d2129; }
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
  border-radius: 8px;
  border: 1px solid #e4e7ed;
  padding: 16px 18px 14px;
}

.sec-title {
  font-size: 13px;
  font-weight: 600;
  color: #1d2129;
  margin-bottom: 14px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f2f3f5;
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
  color: #86909c;
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
  color: #4e5969;
  white-space: nowrap;
}

.settle-value {
  font-size: 14px;
  font-weight: 600;
  color: #1d2129;
}

.settle-value.primary {
  color: #165dff;
  font-size: 16px;
}

.settle-summary {
  border-top: 1px solid #f2f3f5;
  padding-top: 12px;
  font-size: 13px;
  color: #4e5969;
  display: flex;
  align-items: center;
}
</style>
