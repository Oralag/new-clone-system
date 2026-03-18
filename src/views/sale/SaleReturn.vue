<template>
  <div class="salereturn-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getSaleReturnList"
          del-path="/stock/SaleReturnOrder/batchDel"
          export-file-name="销售退货单" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.order_no" placeholder="退货单号" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:150px" />
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:110px">
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate">新增退货</el-button>
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
          <el-table-column prop="order_no" label="退货单号" min-width="150" />
          <el-table-column label="客户名称" min-width="140">
            <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
          </el-table-column>
          <el-table-column label="退货日期" width="110">
            <template #default="{ row }">{{ (row.return_date || row.create_time || '').slice(0, 10) }}</template>
          </el-table-column>
          <el-table-column label="退货人" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column prop="return_amount" label="退货金额" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ Number(row.return_amount || 0).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="退货原因" min-width="140" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="openEdit(row, true)">查看</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">编辑</el-button>
              <template v-if="row.status === 0">
                <el-button type="primary" link size="small" @click="handleAudit(row, 1)">审核</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, 2)">驳回</el-button>
              </template>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleAudit(row, 0)">反审核</el-button>
              <el-button type="danger" link size="small" :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
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
          <span class="form-title">{{ isReadonly ? '查看退货单' : (fd.id ? '编辑退货单' : '新增退货') }}</span>
          <el-tag v-if="isReadonly" type="success" size="small">已审核</el-tag>
        </div>
        <div class="form-actions">
          <el-button v-if="!isReadonly" type="primary" :loading="saving" @click="handleSave">
            保存 <span style="font-size:11px;opacity:0.7">(Ctrl+S)</span>
          </el-button>
        </div>
      </div>

      <div class="form-body">

        <!-- 关联销售出库单 -->
        <div class="form-section">
          <div class="sec-title">关联销售出库单</div>
          <div v-if="fd.order_id" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap">
            <el-tag type="success" size="large">{{ fd.order_sn }}</el-tag>
            <span style="color:rgba(29,29,31,0.5);font-size:13px">客户：{{ fd.customer_name }}</span>
            <span style="color:rgba(29,29,31,0.5);font-size:13px">仓库：{{ fd.warehouse_name }}</span>
            <span style="font-size:13px">
              出库总额：<b style="color:#0071e3">¥{{ Number(fd.order_total_amount||0).toFixed(2) }}</b>
            </span>
            <span style="font-size:13px">
              已收款：<b style="color:#16a34a">¥{{ Number(fd.order_collected_amount||0).toFixed(2) }}</b>
            </span>
            <el-button v-if="!isReadonly" size="small" @click="openSaleOutPicker">重新选择</el-button>
          </div>
          <el-button v-else-if="!isReadonly" type="primary" @click="openSaleOutPicker">选择销售出库单</el-button>
          <div v-else style="color:rgba(29,29,31,0.35)">—</div>
        </div>

        <!-- 基本信息卡片 -->
        <div class="form-section">
          <div class="sec-title">基本信息</div>
          <el-form ref="formRef" :model="fd" label-width="80px" :disabled="isReadonly">
            <el-row :gutter="16">
              <!-- 行1 -->
              <el-col :span="6">
                <el-form-item label="退货单号">
                  <el-input :value="fd.id ? fd.order_no : '（保存后自动生成）'" disabled placeholder="自动生成" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="客户名称" prop="customer_id"
                  :rules="[{ required: true, message: '请选择客户' }]">
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
                <el-form-item label="退货人" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" placeholder="请选择或输入退货人" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="退货日期" prop="return_date">
                  <el-date-picker v-model="fd.return_date" type="date" value-format="YYYY-MM-DD"
                    style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>

              <!-- 行2 -->
              <el-col :span="6">
                <el-form-item label="退货原因" prop="reason">
                  <el-input v-model="fd.reason" placeholder="请输入退货原因" />
                </el-form-item>
              </el-col>
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
          <div v-if="!isReadonly" class="goods-toolbar">
            <div class="toolbar-left">
              <template v-if="!fd.order_id">
                <el-button type="primary" :icon="Plus" size="small" @click="openGoodsPicker">选择商品</el-button>
                <el-button :icon="EditPen" size="small" @click="openManualAdd">新增商品</el-button>
              </template>
              <span v-else style="font-size:13px;color:rgba(29,29,31,0.5)">已从出库单导入商品，填写退货数量即可</span>
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
            <el-table-column label="规格" width="140">
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
            <el-table-column label="单位" width="70" align="center">
              <template #default="{ row }">
                <el-input v-model="row.unit_name" size="small" placeholder="单位" />
              </template>
            </el-table-column>
            <el-table-column v-if="fd.order_id" label="出库数量" width="90" align="right">
              <template #default="{ row }">{{ row.origin_num ?? '—' }}</template>
            </el-table-column>
            <el-table-column width="120">
              <template #header>
                <div class="batch-header">
                  <span>退货数量</span>
                  <el-button link type="primary" size="small" @click="batchEditField('num')">批量</el-button>
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
              <span class="settle-label">退货金额合计</span>
              <span class="settle-value primary">¥{{ fd.total_amount.toFixed(2) }}</span>
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
              <span class="settle-label">实退金额</span>
              <span class="settle-value">¥{{ fd.return_amount.toFixed(2) }}</span>
            </div>
          </div>
          <div class="settle-summary">
            <span>含税合计：<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
            <span style="margin-left:24px">实退金额：<b style="color:#dc2626;font-size:16px">¥{{ fd.return_amount.toFixed(2) }}</b></span>
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
        <span style="color:rgba(29,29,31,0.35);font-size:13px">已选 {{ selectedGoodsRows.length }} 件</span>
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
        <el-form-item label="规格">
          <el-input v-model="manualForm.spec" placeholder="规格（可选）" />
        </el-form-item>
        <el-form-item label="单位">
          <el-input v-model="manualForm.unit_name" placeholder="如：个、kg" />
        </el-form-item>
        <el-form-item label="退货数量">
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

    <!-- 选择销售出库单弹框 -->
    <el-dialog v-model="saleOutPickerVisible" title="选择销售出库单" width="780px" append-to-body>
      <div style="margin-bottom:10px;display:flex;gap:8px">
        <el-input v-model="saleOutPickerKeyword" placeholder="搜索出库单号/客户名称" clearable style="width:260px" />
      </div>
      <el-table :data="filteredSaleOutOrders" v-loading="saleOutPickerLoading" border height="380"
        highlight-current-row @current-change="onSaleOutSelect">
        <el-table-column prop="order_sn" label="出库单号" min-width="160" />
        <el-table-column prop="customer_name" label="客户" min-width="120" />
        <el-table-column prop="warehouse_name" label="仓库" width="110" />
        <el-table-column label="出库金额" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount||0).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column label="出库日期" width="110">
          <template #default="{ row }">{{ (row.out_date||row.create_time||'').slice(0,10) }}</template>
        </el-table-column>
      </el-table>
      <template #footer>
        <el-button @click="saleOutPickerVisible = false">取消</el-button>
        <el-button type="primary" :disabled="!selectedSaleOut" @click="confirmSaleOutSelect">确认选择</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Delete, Search, ArrowLeft, EditPen, Document, Upload, Camera, Paperclip } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getSaleReturnList, createSaleReturn, deleteSaleReturn, auditSaleReturn, getSaleOutList } from '@/api/sale'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getGoodsList, getGoodsCateList, getSpecList } from '@/api/goods'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import StaffSelect from '@/components/StaffSelect.vue'
import { usePermissionStore } from '@/stores/permission'

// ── 税率选项 ──────────────────────────────────────────────────────────────────
const taxRates = [0, 1, 3, 6, 9, 10, 13, 16, 17]

// ── 列表 ─────────────────────────────────────────────────────────────────────
const permStore = usePermissionStore()
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

// ── 分类选项（商品选择器用） ──────────────────────────────────────────────────
const cateOptions = ref<any[]>([])
async function loadCates() {
  const res = await getGoodsCateList({ list_rows: 200 })
  const rc = res.data?.rows ?? []; cateOptions.value = rc.filter((c: any, i: number) => rc.findIndex((x: any) => x.name === c.name) === i)
}

onMounted(() => { loadCustomers(); loadWarehouses(); loadCates() })

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
  items: [] as SaleReturnItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)

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
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
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
    ElMessage.warning('请填写必填项'); return
  }
  if (!fd.items.length) {
    ElMessage.warning('请至少添加一件商品'); return
  }
  saving.value = true
  try {
    const payload: Record<string, any> = {
      order_id: fd.order_id,
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
      goods_info: JSON.stringify(fd.items.filter(i => (i.num || 0) > 0)),
    }
    if (fd.id) payload.id = fd.id
    await createSaleReturn(payload)
    ElMessage.success('保存成功')
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该退货单？', '提示', { type: 'warning' })
  await deleteSaleReturn(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? '审核通过' : status === 2 ? '驳回' : '反审核'
  await ElMessageBox.confirm(`确定${action}该退货单？`, '提示', { type: 'warning' })
  try {
    await auditSaleReturn(row.id, status)

    // 审核通过：退货=库存加回
    if (status === 1) {
      await handleReturnStockEffect(row, 'audit')
    }
    // 反审核：撤销库存加回（重新扣减）
    if (status === 0) {
      await handleReturnStockEffect(row, 'reverse')
    }

    ElMessage.success(`${action}成功`)
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

async function handleReturnStockEffect(row: any, type: 'audit' | 'reverse') {
  const items = parseItems(row.goods_info)
  try {
    for (const item of items) {
      if (!item.goods_id || !item.num) continue
      const stockRes = await http.get('/stock/StockAll/index', {
        params: { goods_id: item.goods_id, warehouse_id: row.warehouse_id, list_rows: 10 }
      })
      const stockRows: any[] = stockRes.data?.rows ?? []
      const stock = stockRows[0]
      if (stock) {
        // 退货审核通过=库存加回(+num)；反审核=扣减(-num)
        const delta = type === 'audit' ? Number(item.num) : -Number(item.num)
        const newQty = Math.max(0, Number(stock.qty || 0) + delta)
        await http.post('/stock/StockAll/edit', { id: stock.id, qty: newQty })
      }
    }
  } catch (e: any) {
    console.warn('销售退货库存变动失败', e?.message)
  }
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
    goodsOptions.value = fuzzyFilterGoods(res.data?.rows ?? [], goodsPickerKeyword.value || '')
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
  num: '退货数量',
  price_no_tax: '未税单价',
  tax_rate: '税率(%)',
  price: '含税单价',
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
