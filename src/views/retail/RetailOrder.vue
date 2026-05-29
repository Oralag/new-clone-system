<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="filteredApi"
          :batch-del-api="batchDelRetailOrders"
          export-file-name="零售订单" :params="searchForm" @reset="onSearchReset"
          :export-columns="{ order_no: '订单编号', member_name: '会员名称', store_name: '门店', order_date: '日期', total_amount: '商品合计', discount_amount: '折扣', pay_amount: '实付金额', pay_method: '支付方式', status: '状态' }">
        <template #search>
          <el-input v-model="searchForm.order_no" placeholder="订单编号" clearable style="width:160px" />
          <el-input v-model="searchForm.member_name" placeholder="会员名称" clearable style="width:140px" />
          <el-select v-model="searchForm.store_id" placeholder="门店" clearable style="width:130px">
            <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
          <el-date-picker :key="datePickerKey" v-model="dateRange" type="daterange" range-separator="至"
            start-placeholder="开始" end-placeholder="结束" value-format="YYYY-MM-DD"
            style="width:240px" unlink-panels :shortcuts="dateShortcuts" @change="onDateChange" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增订单</el-button>
        </template>
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 48px 12px">
              <el-table :data="parseGoods(row.goods_info)" size="small" border style="width:100%">
                <el-table-column prop="goods_name" label="商品名称" min-width="140" />
                <el-table-column prop="unit_name" label="单位" width="70" align="center" />
                <el-table-column prop="num" label="数量" width="80" align="right" />
                <el-table-column label="单价" width="100" align="right">
                  <template #default="{ row: item }">¥{{ Number(item.price).toFixed(2) }}</template>
                </el-table-column>
                <el-table-column label="小计" width="100" align="right">
                  <template #default="{ row: item }">
                    <span style="color:#0071e3">¥{{ (Number(item.num) * Number(item.price)).toFixed(2) }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="订单编号" min-width="160">
          <template #default="{ row }">{{ row.order_sn || `LS${(row.order_date || row.created_at || '').slice(0, 10).replace(/-/g, '')}${String(row.id).padStart(3,'0')}` }}</template>
        </el-table-column>
        <el-table-column prop="member_name" label="会员名称" min-width="100" />
        <el-table-column prop="store_name" label="门店" min-width="100" />
        <el-table-column prop="total_amount" label="商品合计" width="110" align="right">
          <template #default="{ row }">¥{{ Number(row.total_amount).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column prop="discount_amount" label="折扣/加价" width="100" align="right">
          <template #default="{ row }">
            <span :style="Number(row.discount_amount) > 0 ? 'color:#67c23a' : Number(row.discount_amount) < 0 ? 'color:#f56c6c' : ''">
              {{ Number(row.discount_amount) > 0 ? '-' : Number(row.discount_amount) < 0 ? '+' : '' }}¥{{ Math.abs(Number(row.discount_amount || 0)).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="pay_amount" label="实付金额" width="110" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ Number(row.pay_amount).toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="pay_method" label="支付方式" width="100" align="center" />
        <el-table-column label="订单日期" width="160">
          <template #default="{ row }">{{ fmtOrderDate(row) }}</template>
        </el-table-column>
        <el-table-column label="状态" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 0 ? 'warning' : 'success'" size="small">
              {{ row.status === 0 ? '未审核' : '已审核' }}
            </el-tag>
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
            <div v-if="row.status === 1 && getFeeItemsForRow(row).length > 0" style="margin-top:2px;text-align:right">
              <el-button type="primary" link size="small" style="font-size:11px;padding:0" @click="openFeeManageDialog(row)">管理费用</el-button>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="170" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 0" type="primary" link size="small" @click="handleAudit(row, 1)">审核</el-button>
            <el-button v-else type="warning" link size="small" @click="handleAudit(row, 0)">反审核</el-button>
            <el-button v-if="row.status === 0" type="success" link size="small" @click="openForm(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
      <div v-if="filteredRows.length" style="display:flex;gap:24px;padding:10px 4px 0;font-size:13px;color:#666;border-top:1px solid #f0f0f0;margin-top:2px">
        <span>共 <b>{{ summary.count }}</b> 单</span>
        <span>商品合计：<b>¥{{ summary.total_amount.toFixed(2) }}</b></span>
        <span>折扣合计：<b :style="summary.discount_amount > 0 ? 'color:#67c23a' : summary.discount_amount < 0 ? 'color:#f56c6c' : ''">{{ summary.discount_amount > 0 ? '-' : summary.discount_amount < 0 ? '+' : '' }}¥{{ Math.abs(summary.discount_amount).toFixed(2) }}</b></span>
        <span>实付合计：<b style="color:#0071e3;font-size:14px">¥{{ summary.pay_amount.toFixed(2) }}</b></span>
      </div>
    </el-card>

    <!-- 新增/编辑订单抽屉 -->
    <el-drawer v-model="drawerVisible" :title="editId ? '编辑零售订单' : '新增零售订单'" size="720px" destroy-on-close>
      <el-form ref="formRef" :model="form" label-width="90px" style="padding:0 4px">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="门店" prop="store_id">
              <el-select v-model="form.store_id" placeholder="选择门店（可选）" clearable filterable style="width:100%"
                @change="onStoreChange">
                <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="会员" prop="member_id">
              <el-select v-model="form.member_id" placeholder="选择会员（可选）" clearable filterable style="width:100%"
                @change="onMemberChange">
                <el-option v-for="m in memberList" :key="m.id" :label="`${m.name} ${m.mobile}`" :value="m.id" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="订单日期" prop="order_date">
              <el-date-picker v-model="form.order_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="支付方式" prop="pay_method">
              <el-select v-model="form.pay_method" style="width:100%">
                <el-option label="现金" value="cash" />
                <el-option label="微信" value="wechat" />
                <el-option label="支付宝" value="alipay" />
                <el-option label="会员余额" value="balance" />
                <el-option label="银行卡" value="card" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="备注">
              <el-input v-model="form.remark" placeholder="备注" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 商品明细 -->
        <div style="margin:8px 0 10px;display:flex;align-items:center;justify-content:space-between">
          <span style="font-weight:600;font-size:13px">商品明细</span>
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">添加商品</el-button>
        </div>
        <el-table :data="form.items" border size="small" empty-text="请添加商品">
          <el-table-column prop="goods_name" label="商品" min-width="130" />
          <el-table-column prop="unit_name" label="单位" width="70" align="center" />
          <el-table-column label="数量" width="100">
            <template #default="{ row }">
              <el-input-number v-model="row.num" :min="1" size="small" controls-position="right"
                style="width:90px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="110">
            <template #default="{ row }">
              <el-input-number v-model="row.price" :min="0" :precision="2" size="small"
                controls-position="right" style="width:100px" @change="calcFormTotal" />
            </template>
          </el-table-column>
          <el-table-column label="小计" width="90" align="right">
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
          <span>合计：<b>¥{{ form.total_amount.toFixed(2) }}</b></span>
          <span>折扣：<el-input-number v-model="form.discount_amount" :precision="2" size="small"
            controls-position="right" style="width:100px" @change="calcFormTotal" /></span>
          <span>实付：<b style="color:#dc2626;font-size:15px">¥{{ form.pay_amount.toFixed(2) }}</b></span>
        </div>

        <!-- 附加费用 -->
        <div style="margin-top:4px;border-top:1px dashed #e5e7eb;padding-top:10px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
            <span style="font-size:13px;color:rgba(29,29,31,0.6)">附加费用（可选）</span>
            <el-button type="primary" link size="small" :icon="Plus" @click="form.fee_items.push({ name: '运费', amount: 0, bearer: 'buyer' })">添加费用项</el-button>
          </div>
          <div v-for="(fee, idx) in form.fee_items" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
            <el-select v-model="fee.name" size="small" style="width:120px" filterable allow-create default-first-option placeholder="费用类型">
              <el-option label="运费" value="运费" />
              <el-option label="装卸费" value="装卸费" />
              <el-option label="检测费" value="检测费" />
              <el-option label="包装费" value="包装费" />
              <el-option label="仓储费" value="仓储费" />
              <el-option label="其他费用" value="其他费用" />
            </el-select>
            <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:110px" placeholder="金额" />
            <el-select v-model="fee.bearer" size="small" style="width:110px">
              <el-option label="我方承担" value="buyer" />
              <el-option label="客户承担" value="seller" />
              <el-option label="各半" value="half" />
              <el-option label="免费" value="free" />
            </el-select>
            <el-button type="danger" link :icon="Delete" size="small" @click="form.fee_items.splice(idx, 1)" />
          </div>
        </div>
      </el-form>

      <template #footer>
        <el-button @click="drawerVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
    </el-drawer>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 附加费用管理弹窗 -->
    <el-dialog v-model="feeManageVisible" :title="feeManageRow?.status === 1 ? '查看/付款附加费用' : '管理附加费用'" width="620px" append-to-body>
      <div style="margin-bottom:8px;font-size:13px;color:rgba(29,29,31,0.5)">
        {{ feeManageRow?.order_sn || `LS${(feeManageRow?.order_date||'').slice(0,10).replace(/-/g,'')}${String(feeManageRow?.id||'').padStart(3,'0')}` }}
        <template v-if="feeManageRow?.member_name"> · {{ feeManageRow?.member_name }}</template>
      </div>

      <!-- 已审核：只读模式，只能付款不能改费用 -->
      <template v-if="feeManageRow?.status === 1">
        <el-alert v-if="!feeManageItems.length" title="暂无附加费用，如需添加请先反审核" type="info" :closable="false" show-icon style="margin-bottom:8px" />
        <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 10px;background:#fafafa;border-radius:6px">
          <span style="font-size:13px;font-weight:600;min-width:80px">{{ fee.name }}</span>
          <span style="color:#8b5cf6;font-weight:700">¥{{ Number(fee.amount).toFixed(2) }}</span>
          <span style="font-size:12px;color:rgba(29,29,31,0.4)">{{ fee.bearer === 'buyer' ? '我方承担' : fee.bearer === 'seller' ? '客户承担' : fee.bearer === 'half' ? '各半' : '免费' }}</span>
          <el-tag :type="getFeeItemPayStatus(feeManageRow, idx).type" size="small">{{ getFeeItemPayStatus(feeManageRow, idx).label }}</el-tag>
          <el-button v-if="getFeeItemPayStatus(feeManageRow, idx).label === '待付'" type="warning" link size="small" @click="openFeeManagePay(idx)">付款</el-button>
        </div>
        <div v-if="feeManageItems.length" style="font-size:12px;color:rgba(29,29,31,0.35);margin-top:4px">如需修改费用项，请先执行反审核</div>
      </template>

      <!-- 未审核：可编辑模式 -->
      <template v-else>
        <div v-for="(fee, idx) in feeManageItems" :key="idx" style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
          <el-select v-model="fee.name" size="small" style="width:130px" filterable allow-create default-first-option placeholder="费用类型">
            <el-option label="运费" value="运费" />
            <el-option label="装卸费" value="装卸费" />
            <el-option label="检测费" value="检测费" />
            <el-option label="包装费" value="包装费" />
            <el-option label="仓储费" value="仓储费" />
            <el-option label="其他费用" value="其他费用" />
          </el-select>
          <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:120px" placeholder="金额" />
          <el-select v-model="fee.bearer" size="small" style="width:110px">
            <el-option label="我方承担" value="buyer" />
            <el-option label="客户承担" value="seller" />
            <el-option label="各半" value="half" />
            <el-option label="免费" value="free" />
          </el-select>
          <el-button type="danger" link :icon="Delete" size="small" @click="removeFeeManageItem(idx)" />
        </div>
        <el-button type="primary" link size="small" :icon="Plus" @click="feeManageItems.push({ name: '运费', amount: 0, bearer: 'buyer' })">
          添加费用项
        </el-button>
      </template>
      <div v-if="feeManagePayIndex >= 0" style="margin-top:12px;padding:12px;background:#f9f9f9;border-radius:6px;border:1px solid #e5e7eb">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;font-size:13px;font-weight:600">
          <span>{{ feePayForm.feeName }}付款</span>
          <el-button link size="small" @click="feeManagePayIndex = -1">收起</el-button>
        </div>
        <el-form :model="feePayForm" label-width="90px">
          <el-form-item label="费用金额">
            <span style="font-size:15px;font-weight:700;color:#8b5cf6">¥{{ feePayForm.amount.toFixed(2) }}</span>
          </el-form-item>
          <el-form-item label="付款账户">
            <el-select v-model="feePayForm.fund_id" placeholder="请选择账户" filterable style="width:100%" @change="onFeePayFundChange">
              <el-option v-for="f in fundOptions" :key="f.id" :label="f.name" :value="f.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="付款对象">
            <el-input v-model="feePayForm.contact_name" placeholder="可选，如：快递公司等" clearable />
          </el-form-item>
          <el-form-item label="付款日期">
            <el-date-picker v-model="feePayForm.pay_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input v-model="feePayForm.remark" placeholder="可选" />
          </el-form-item>
        </el-form>
        <div style="display:flex;justify-content:flex-end;gap:8px;margin-top:8px">
          <el-button @click="feeManagePayIndex = -1">取消付款</el-button>
          <el-button type="primary" :loading="feePaySubmitting" @click="submitFeeManagePay">确认付款</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="feeManageVisible = false">关闭</el-button>
        <el-button v-if="feeManageRow?.status !== 1" type="primary" :loading="feeManageSaving" @click="submitFeeManage">保存</el-button>
      </template>
    </el-dialog>

    <!-- 费用付款弹窗 -->
    <el-dialog v-model="feePayVisible" :title="`${feePayForm.feeName} 付款`" width="420px" append-to-body>
      <el-form :model="feePayForm" label-width="90px">
        <el-form-item label="零售单">
          <span style="font-size:13px;color:rgba(29,29,31,0.6)">{{ feePayForm.orderSn }}</span>
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
          <el-input v-model="feePayForm.contact_name" placeholder="可选，如：快递公司等" clearable />
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus, Delete } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage, ElNotification } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getRetailOrderList, createRetailOrder, updateRetailOrder, deleteRetailOrder, getMemberList, getStoreList } from '@/api/retail'
import { getFundList, getPayReceiptList, createPayReceipt } from '@/api/finance'
import http from '@/api/http'
import { RETAIL_FUND_NAME } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect, deleteRetailStockFlows } from '@/utils/stockEffect'
import { distributeRetailItems, normalizeRetailSettlement } from '@/utils/retailPricing'

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
const stockRefreshStore = useStockRefreshStore()
// date filter stored locally — backend ignores date params, handled in filteredApi
const searchForm = reactive<any>({ order_no: '', member_name: '', store_id: '', start_date: '', end_date: '' })
const dateRange = ref<any>([])
const dateShortcuts = [
  { text: '最近一个月', value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 1); return [s, e] } },
  { text: '最近三个月', value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 3); return [s, e] } },
  { text: '最近六个月', value: () => { const e = new Date(); const s = new Date(); s.setMonth(s.getMonth() - 6); return [s, e] } },
  { text: '今年', value: () => { const e = new Date(); const s = new Date(e.getFullYear(), 0, 1); return [s, e] } },
  { text: '去年', value: () => { const y = new Date().getFullYear() - 1; return [new Date(y, 0, 1), new Date(y, 11, 31)] } },
]
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
  filteredRows.value = filtered
  const page = Number(reqPage) || 1
  const size = Number(reqSize) || 20
  return { data: { rows: filtered.slice((page - 1) * size, page * size), total: filtered.length } }
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
  if (!form.items.length) { ElMessage.warning('请添加商品'); return }
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
      ElMessage.success('修改成功')
    } else {
      await createRetailOrder(payload)
      ElMessage.success('保存成功，请审核后生效库存和财务')
    }
    drawerVisible.value = false
    // 清除日期筛选，确保新订单可见
    dateRange.value = []
    searchForm.start_date = ''
    searchForm.end_date = ''
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || '保存失败')
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
    try { await retailStockEffect(items, 'deduct', row.id) } catch (e: any) { ElMessage.warning('库存扣减失败，请手动处理') }
    try {
      const fundRes = await http.get('/finance/Fund/index', { params: { list_rows: 100 } })
      const funds: any[] = fundRes.data?.rows ?? []
      const retailFund = funds.find((f: any) => f.name === RETAIL_FUND_NAME)
      if (retailFund) {
        await http.post('/finance/Fund/edit', { id: retailFund.id, name: retailFund.name, balance: Number(retailFund.balance || 0) + payAmount })
      } else {
        await http.post('/finance/Fund/add', { name: RETAIL_FUND_NAME, type: 2, balance: payAmount, remark: '零售单自动累计' })
      }
    } catch (e: any) { ElMessage.warning('财务更新失败，请手动处理') }
    const stockDesc = items.map((i: any) => `${i.goods_name || '商品'} ×${i.num}`).join('、')
    ElNotification({ title: '审核成功', dangerouslyUseHTMLString: true, type: 'success', duration: 5000,
      message: `<div style="font-size:12px;line-height:2">📦 库存已扣减：${stockDesc}<br>💰 ${RETAIL_FUND_NAME} +¥${payAmount.toFixed(2)}</div>` })
  } else {
    await http.post('/retail/order/audit', { id: row.id, status: 0 })
    try { await deleteRetailStockFlows(row.id) } catch { /* 找不到流水静默跳过，库存由审核流程保证 */ }
    try { await deductRetailFund(payAmount) } catch (e: any) { ElMessage.warning('财务回滚失败，请手动处理') }
    const stockDesc = items.map((i: any) => `${i.goods_name || '商品'} ×${i.num}`).join('、')
    ElNotification({ title: '反审核成功', dangerouslyUseHTMLString: true, type: 'warning', duration: 5000,
      message: `<div style="font-size:12px;line-height:2">📦 库存已恢复：${stockDesc}<br>💰 ${RETAIL_FUND_NAME} -¥${payAmount.toFixed(2)}</div>` })
  }
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
  loadFeePayMap()
}

async function handleDelete(row: any) {
  if (row.status === 1) { ElMessage.warning('请先反审核再删除'); return }
  await ElMessageBox.confirm('确定删除？', '提示', { type: 'warning' })
  await deleteRetailOrder(row.id)
  ElMessage.success('删除成功')
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
  return http.post('/retail/order/batchDel', { ids })
}

async function retailStockEffect(items: any[], mode: 'deduct' | 'restore', orderId?: number) {
  const remark = mode === 'deduct' ? (orderId ? `零售出库#${orderId}` : '零售出库') : '零售退货入库'
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
  let items: any[] = []
  try { items = Array.isArray(row.fee_items) ? row.fee_items : JSON.parse(row.fee_items || '[]') } catch { items = [] }
  return items
}

function getFeeItemPayStatus(row: any, idx: number): { label: string; type: string } {
  if (!row || Number(row.status) !== 1) return { label: '—', type: 'info' }
  const items = getFeeItemsForRow(row)
  const fee = items[idx]
  if (!fee || Number(fee.amount || 0) <= 0) return { label: '—', type: 'info' }
  const bearer = fee.bearer || 'buyer'
  if (bearer === 'seller') return { label: '客户承担', type: 'info' }
  if (bearer === 'free') return { label: '免费', type: 'info' }
  const needPay = bearer === 'half' ? Number(fee.amount) / 2 : Number(fee.amount)
  const paid = feeItemPaidMap.value[`${row.id}:${fee.name}`] || 0
  if (paid >= needPay - 0.01) return { label: '已付', type: 'success' }
  return { label: '待付', type: 'warning' }
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
  if (!feeManageRow.value?.id) throw new Error('零售单不存在')
  if (Number(feeManageRow.value.status) === 1) throw new Error('已审核订单不可修改费用，请先反审核')
  const items = feeManageItems.value
    .map(f => ({ name: String(f.name || '').trim(), amount: Number(f.amount || 0), bearer: f.bearer || 'buyer' }))
    .filter(f => f.name && f.amount > 0)
  const row = feeManageRow.value
  await updateRetailOrder({
    id: row.id,
    store_id: row.store_id || 0,
    store_name: row.store_name || '',
    member_id: row.member_id || 0,
    member_name: row.member_name || '',
    order_date: row.order_date || '',
    pay_type: row.pay_type || row.pay_method || 'cash',
    remark: row.remark || '',
    total_amount: row.total_amount || 0,
    discount_amount: row.discount_amount || 0,
    pay_amount: row.pay_amount || 0,
    status: 0,
    goods_info: typeof row.goods_info === 'string' ? row.goods_info : JSON.stringify(row.goods_info || []),
    fee_items: JSON.stringify(items),
  })
  feeManageItems.value = items
  feeManageRow.value = { ...feeManageRow.value, fee_items: items }
  return items
}

async function submitFeeManage() {
  feeManageSaving.value = true
  try {
    await saveFeeManageItems()
    ElMessage.success('费用保存成功')
    feeManageVisible.value = false
    tableRef.value?.refresh()
    loadFeePayMap()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
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
  if (!fee) { ElMessage.warning('费用项不存在'); return }
  if (Number(fee.amount || 0) <= 0) { ElMessage.warning('费用金额必须大于 0'); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning('该费用无需我方付款'); return }
  if (getFeeItemPayStatus(row, idx).label !== '待付') { ElMessage.warning('该费用当前不需要付款'); return }
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
  if (!fee || Number(fee.amount || 0) <= 0) { ElMessage.warning('费用金额必须大于 0'); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning('该费用无需我方付款'); return }
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
      remark: `零售附加费用 #${feePayForm.orderId}:${feePayForm.feeName}${feePayForm.remark ? ' ' + feePayForm.remark : ''}`,
    })
    ElMessage.success('付款成功')
    feePayVisible.value = false
    loadFeePayMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '付款失败')
  } finally {
    feePaySubmitting.value = false
  }
}

async function submitFeeManagePay() {
  if (feeManagePayIndex.value < 0) return
  if (!feePayForm.fund_id) { ElMessage.warning('请选择付款账户'); return }
  const fee = feeManageItems.value[feeManagePayIndex.value]
  if (!fee || Number(fee.amount || 0) <= 0) { ElMessage.warning('费用金额必须大于 0'); return }
  if (fee.bearer === 'seller' || fee.bearer === 'free') { ElMessage.warning('该费用无需我方付款'); return }
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
    ElMessage.success('付款成功')
    feeManagePayIndex.value = -1
    feeManageVisible.value = false
    loadFeePayMap()
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '付款失败')
  } finally {
    feePaySubmitting.value = false
  }
}
</script>

<style scoped>
.page-container {}
</style>
