<template>
  <div class="offer-page">

    <!-- ── 列表页 ── -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getOfferList"
          del-path="/shop/offerOrder/batchDel"
          sort-by="offer_date" :sort-desc="true"
          export-file-name="报价单" :params="searchForm"
          :row-class-name="({ row }: any) => row.status === 4 ? 'row-converted' : ''"
          :export-columns="{ remark: '报价单号', customer_name: '客户名称', offer_date: '报价日期', expire_date: '有效期至', admin_name: '经办人', total_amount: '报价金额', discount_amount: '优惠金额', after_offer: '实付金额', status: '状态' }">>
          <template #search>
            <el-input v-model="searchForm.offer_no" placeholder="报价单号" clearable style="width:160px" />
            <el-input v-model="searchForm.customer_name" placeholder="客户名称" clearable style="width:150px" />
            <el-select v-model="searchForm.status" placeholder="状态" clearable style="width:110px">
              <el-option label="待审核" :value="0" />
              <el-option label="已审核" :value="1" />
              <el-option label="已驳回" :value="2" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openCreate" data-guide-id="guide-offer-create">新增报价</el-button>
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
          <el-table-column label="报价单号" min-width="150">
            <template #default="{ row }">{{ parseOfferNo(row) }}</template>
          </el-table-column>
          <el-table-column label="客户名称" min-width="140">
            <template #default="{ row }">{{ row.customer_name || customerOptions.find(c => c.id === row.customer_id)?.name || '—' }}</template>
          </el-table-column>
          <el-table-column label="报价日期" width="110">
            <template #default="{ row }">{{ fmtDt(row.offer_date || row.create_time) }}</template>
          </el-table-column>
          <el-table-column label="有效期至" width="110">
            <template #default="{ row }">{{ fmtDt(row.expire_date) || '—' }}</template>
          </el-table-column>
          <el-table-column label="经办人" width="90">
            <template #default="{ row }">{{ row.admin_name || '—' }}</template>
          </el-table-column>
          <el-table-column prop="total_amount" label="报价金额" width="120" align="right">
            <template #default="{ row }">
              <span style="color:#0071e3;font-weight:500">¥{{ Number(row.total_amount).toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="优惠/实付" width="140" align="right">
            <template #default="{ row }">
              <template v-if="Number(row.discount_amount) > 0">
                <span style="font-size:11px;color:#f59e0b">优惠¥{{ Number(row.discount_amount).toFixed(2) }}</span>
                <br />
                <span style="color:#16a34a;font-weight:600">实付¥{{ Number(row.after_offer || (row.total_amount - row.discount_amount)).toFixed(2) }}</span>
              </template>
              <span v-else style="color:#94a3b8;font-size:12px">无优惠</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="200" fixed="right">
            <template #default="{ row }">
              <span v-if="row.status === 4" style="color:#16a34a;margin-right:4px;font-weight:700">✓</span>
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : row.status === 4 ? 'warning' : 'info'" size="small" style="margin-right:8px">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : row.status === 4 ? '已转单' : '待审核' }}
              </el-tag>
              <el-button v-if="row.status === 1" type="primary" link size="small" @click="openEdit(row, true)">查看</el-button>
              <el-button v-else type="success" link size="small" @click="openEdit(row, false)">编辑</el-button>
              <template v-if="row.status === 0">
                <el-button type="primary" link size="small" @click="handleAudit(row, 1)">审核</el-button>
                <el-button type="danger" link size="small" @click="handleAudit(row, 2)">驳回</el-button>
              </template>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" link size="small" @click="handleAudit(row, 0)">反审核</el-button>
              <el-button v-if="row.status === 1" type="success" link size="small" @click="handleConvertToContract(row)">转销售订单</el-button>
              <el-button type="danger" link size="small" :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ── 新增/编辑全页面 ── -->
    <div v-else class="form-page">
      <div class="form-topbar">
        <div style="display:flex;align-items:center;gap:12px">
          <div class="form-title">{{ isReadonly ? '查看报价单' : (fd.id ? '编辑报价单' : '新增报价') }}</div>
          <el-tag v-if="isReadonly" type="success" size="small">已审核</el-tag>
        </div>
        <div class="form-actions">
          <el-button @click="backToList">返回</el-button>
          <el-button v-if="isReadonly" :icon="Printer" @click="handlePrint">打印</el-button>
          <el-button v-if="isReadonly" :icon="Download" @click="handleExportPdf">导出PDF</el-button>
          <el-button v-if="!isReadonly" type="primary" :loading="saving" @click="handleSave" data-guide-id="guide-offer-save">保存</el-button>
        </div>
      </div>

      <div class="form-body">
        <el-form ref="formRef" :model="fd" label-width="90px" :disabled="isReadonly">

          <!-- 基本信息 -->
          <div class="form-section">
            <div class="sec-title">基本信息</div>
            <el-row :gutter="20">
              <el-col :span="8">
                <el-form-item label="客户名称" prop="customer_id"
                  :rules="[{ required: true, message: '请选择客户' }]"
                  data-guide-id="guide-offer-customer">
                  <div style="display:flex;gap:4px;width:100%">
                    <el-select v-model="fd.customer_id" placeholder="请选择客户" filterable style="flex:1"
                      @change="onCustomerChange">
                      <el-option v-for="c in customerOptions" :key="c.id" :label="c.name || c.nickname" :value="c.id" />
                    </el-select>
                    <el-button type="primary" :icon="Plus" @click="openAddCustomer" />
                  </div>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="客户等级">
                  <el-select v-model="fd.level_id" placeholder="请选择等级（可选）" clearable style="width:100%"
                    @change="onLevelChange">
                    <el-option v-for="lv in levelOptions" :key="lv.id" :label="lv.name" :value="lv.id" />
                  </el-select>
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="报价日期" prop="offer_date">
                  <el-date-picker v-model="fd.offer_date" type="date" value-format="YYYY-MM-DD" style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="报价单号">
                  <el-input v-model="fd.offer_no" readonly placeholder="生成中..." />
                </el-form-item>
              </el-col>
              <!-- 大写金额展示 -->
              <el-col :span="24">
                <div style="background:#fff5f5;border:1px solid #ffcdd2;border-radius:6px;padding:10px 16px;margin-bottom:12px;display:flex;align-items:baseline;gap:16px;flex-wrap:wrap">
                  <span style="font-size:13px;color:rgba(29,29,31,0.35)">报价金额：</span>
                  <span style="font-size:22px;font-weight:700;color:#dc2626;letter-spacing:1px">
                    ¥{{ fd.total_amount.toFixed(2) }}
                  </span>
                  <span style="font-size:13px;color:#dc2626">
                    （{{ amountToChinese(fd.after_offer) || amountToChinese(fd.total_amount) }}）
                  </span>
                  <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
                    <span style="font-size:13px;color:rgba(29,29,31,0.35);white-space:nowrap">优惠金额：</span>
                    <el-input-number
                      v-model="fd.discount_amount"
                      :min="0" :max="fd.total_amount" :precision="2"
                      size="small" :controls="false"
                      style="width:110px"
                      @change="calcAfterOffer"
                    />
                    <template v-if="fd.discount_amount > 0 && fd.total_amount > 0">
                      <span style="font-size:12px;color:#16a34a;white-space:nowrap">
                        优惠后：¥{{ fd.after_offer.toFixed(2) }}
                      </span>
                      <span style="font-size:12px;color:#f59e0b;white-space:nowrap;background:#fef3c7;padding:2px 8px;border-radius:10px">
                        {{ discountLabel }}
                      </span>
                    </template>
                  </div>
                </div>
              </el-col>
              <el-col :span="8">
                <el-form-item label="有效期至" prop="expire_date">
                  <el-date-picker v-model="fd.expire_date" type="date" value-format="YYYY-MM-DD" style="width:100%" placeholder="请选择日期" />
                </el-form-item>
              </el-col>
              <el-col :span="8">
                <el-form-item label="经办人" prop="admin_name">
                  <StaffSelect v-model="fd.admin_name" placeholder="请选择或输入经办人" />
                </el-form-item>
              </el-col>
              <el-col :span="16">
                <el-form-item label="备注" prop="remark">
                  <el-input v-model="fd.remark" placeholder="请输入备注" />
                </el-form-item>
              </el-col>
            </el-row>
          </div>

          <!-- 商品明细 -->
          <div class="form-section">
            <div class="sec-title-row">
              <span class="sec-title">商品明细</span>
              <el-button v-if="!isReadonly" type="primary" :icon="Plus" size="small" @click="goodsSelectRef?.open()" data-guide-id="guide-offer-goods">选择商品</el-button>
            </div>

            <el-table :data="fd.items" border style="width:100%" empty-text="请点击添加商品">
              <el-table-column type="index" label="序号" width="55" align="center" />
              <el-table-column label="商品名称" min-width="160">
                <template #default="{ row }">
                  <el-input v-model="row.goods_name" placeholder="商品名称" />
                </template>
              </el-table-column>
              <el-table-column label="商品编码" width="130">
                <template #default="{ row }">
                  <el-input v-model="row.goods_sn" placeholder="编码" />
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
                  <el-input v-else v-model="row.spec" placeholder="规格"
                    @focus="row.goods_id && fetchGoodsSpecs(row.goods_id)" />
                </template>
              </el-table-column>
              <el-table-column label="单位" width="90">
                <template #default="{ row }">
                  <el-select
                    v-if="row.goods_id && goodsUnitMap[row.goods_id]?.length > 1"
                    v-model="row.unit_name"
                    size="small"
                    style="width:100%"
                  >
                    <el-option v-for="u in goodsUnitMap[row.goods_id]" :key="u" :label="u" :value="u" />
                  </el-select>
                  <el-input v-else v-model="row.unit_name" placeholder="单位"
                    @focus="row.goods_id && fetchGoodsUnits(row.goods_id, row.unit_name)" />
                </template>
              </el-table-column>
              <el-table-column label="数量" width="110">
                <template #default="{ row }">
                  <el-input-number v-model="row.num" :min="0" :precision="2" controls-position="right"
                    style="width:100%" @change="calcTotal" />
                </template>
              </el-table-column>
              <el-table-column label="单价" width="120">
                <template #default="{ row }">
                  <el-input-number v-model="row.price" :min="0" :precision="2" controls-position="right"
                    style="width:100%" @change="calcTotal" />
                </template>
              </el-table-column>
              <el-table-column label="小计" width="110" align="right">
                <template #default="{ row }">
                  <span style="color:#0071e3">¥{{ ((row.num || 0) * (row.price || 0)).toFixed(2) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" min-width="120">
                <template #default="{ row }">
                  <el-input v-model="row.remark" placeholder="备注" />
                </template>
              </el-table-column>
              <el-table-column label="操作" width="60" align="center" fixed="right">
                <template #default="{ $index }">
                  <el-button type="danger" link :icon="Delete" @click="removeItem($index)" />
                </template>
              </el-table-column>
            </el-table>

            <!-- 合计行 -->
            <div class="total-bar">
              <span>共 <b>{{ fd.items.length }}</b> 件商品</span>
              <span>合计金额：<b style="color:#0071e3;font-size:16px">¥{{ fd.total_amount.toFixed(2) }}</b></span>
            </div>
          </div>

        </el-form>
      </div>
    </div>

    <!-- 快速新增客户弹框 -->
    <el-dialog v-model="addCustomerVisible" title="快速新增客户" width="380px" append-to-body>
      <el-form :model="customerForm" label-width="80px">
        <el-form-item label="客户名称">
          <el-input v-model="customerForm.nickname" placeholder="请输入客户名称" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="customerForm.mobile" placeholder="手机号（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addCustomerVisible = false">取消</el-button>
        <el-button type="primary" :loading="addCustomerLoading" @click="submitAddCustomer">确认新增</el-button>
      </template>
    </el-dialog>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { Plus, Delete, Printer, Download } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getOfferList, createOffer, updateOffer, deleteOffer, auditOffer } from '@/api/sale'
import { getSaleCustomerList, createSaleCustomer } from '@/api/sale'
import { getSpecList, getUnitConvert } from '@/api/goods'
import http from '@/api/http'
import { loadLevels, loadLevelMap, getLevelPrice, type LevelItem } from '@/utils/customerLevel'
import StaffSelect from '@/components/StaffSelect.vue'
import { usePermissionStore } from '@/stores/permission'

// ── 列表 ─────────────────────────────────────────────────────────────────────
const permStore = usePermissionStore()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()

function parseItems(goodsInfo: any): any[] {
  if (Array.isArray(goodsInfo)) return goodsInfo
  try { return JSON.parse(goodsInfo || '[]') } catch { return [] }
}

function parseOfferNo(row: any): string {
  const m = (row.remark || '').match(/^\[NO:([^\]]+)\]/)
  if (m) return m[1]
  return row.offer_no || `BJ${String(row.id || '').padStart(4, '0')}`
}

function parseRemark(remark: string): string {
  return (remark || '').replace(/^\[NO:[^\]]+\]\s*/, '')
}

const goodsSpecMap = reactive<Record<number, string[]>>({})
async function fetchGoodsSpecs(goodsId: number, goodsSpec?: string) {
  if (!goodsId) return
  // 已有数据不重复拉；空数组允许重试（数据可能后来才写入后端）
  if (goodsSpecMap[goodsId]?.length > 0) return
  goodsSpecMap[goodsId] = []
  try {
    const res = await getSpecList({ goods_id: goodsId, list_rows: 100 })
    const specs: any[] = res.data?.rows ?? []
    const options: string[] = []
    for (const s of specs) {
      const vals = (s.spec_value || s.values || '').split(/[,，]/).map((v: string) => v.trim()).filter(Boolean)
      options.push(...vals)
    }
    // 降级：从 goods.spec JSON 字段解析（跨设备兼容）
    if (options.length === 0 && goodsSpec) {
      try {
        const parsed = JSON.parse(goodsSpec)
        if (Array.isArray(parsed.attrs)) {
          for (const attr of parsed.attrs) {
            options.push(...(attr.values ?? []))
          }
        }
      } catch {}
    }
    goodsSpecMap[goodsId] = [...new Set(options)]
  } catch {}
}

const goodsUnitMap = reactive<Record<number, string[]>>({})
async function fetchGoodsUnits(goodsId: number, baseUnit: string) {
  if (!goodsId || goodsUnitMap[goodsId]?.length > 1) return
  goodsUnitMap[goodsId] = []
  try {
    const res = await getUnitConvert(goodsId)
    const rows: any[] = res.data?.rows ?? []
    const units = [baseUnit, ...rows.map((r: any) => r.unit_name).filter(Boolean)]
    goodsUnitMap[goodsId] = [...new Set(units)]
  } catch {}
}
const searchForm = reactive<any>({ offer_no: '', customer_name: '', status: '' })
const showForm = ref(false)
const isReadonly = ref(false)

// ── 客户等级 ──────────────────────────────────────────────────────────────────
const levelOptions = ref<LevelItem[]>(loadLevels())
const levelMap = loadLevelMap()   // { customerId: levelId }

// ── 客户选项 ──────────────────────────────────────────────────────────────────
const customerOptions = ref<any[]>([])
async function loadCustomers() {
  const res = await getSaleCustomerList({ list_rows: 500 })
  customerOptions.value = res.data?.rows ?? []
}

onMounted(() => { loadCustomers() })

// ── 表单数据 ──────────────────────────────────────────────────────────────────
interface OfferItem {
  goods_id: number; goods_name: string; goods_sn: string
  spec: string; unit_name: string; num: number; price: number; remark: string
}

const defaultFd = () => ({
  id: 0,
  offer_no: '',
  customer_id: null as any,
  customer_name: '',
  level_id: null as any,
  offer_date: new Date(Date.now() + 8 * 3600000).toISOString().slice(0, 10),
  expire_date: '',
  admin_name: '',
  remark: '',
  total_amount: 0,
  discount_amount: 0,
  after_offer: 0,
  items: [] as OfferItem[],
})

const fd = reactive(defaultFd())
const formRef = ref()
const saving = ref(false)

async function openCreate() {
  Object.assign(fd, defaultFd())
  isReadonly.value = false
  showForm.value = true
  try {
    const today = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10)
    const ymd = today.replace(/-/g, '')
    const prefix = `BJ${ymd}`
    const res = await getOfferList({ list_rows: 1000 })
    const rows: any[] = res?.data?.rows ?? res?.data?.list ?? []
    let maxSeq = 0
    for (const r of rows) {
      const sn = r.order_sn || ((r.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || ''
      if (sn.startsWith(prefix)) {
        const seq = parseInt(sn.slice(prefix.length), 10)
        if (seq > maxSeq) maxSeq = seq
      }
    }
    fd.offer_no = `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
  } catch {
    const ymd = new Date(Date.now() + 8 * 3600_000).toISOString().slice(0, 10).replace(/-/g, '')
    fd.offer_no = `BJ${ymd}001`
  }
}

function openEdit(row: any, readonly = false) {
  Object.assign(fd, defaultFd(), row)
  fd.offer_no = parseOfferNo(row)
  fd.remark = parseRemark(row.remark || '')
  // 解析 goods_info JSON
  try {
    fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]')
  } catch {
    fd.items = []
  }
  calcTotal()
  fd.items.forEach(item => { if (item.goods_id) fetchGoodsSpecs(item.goods_id) })
  isReadonly.value = readonly
  showForm.value = true
}

function backToList() {  showForm.value = false
  tableRef.value?.refresh()
}

function buildPrintHtml() {
  const items: any[] = fd.items || []
  const rows = items.map((item: any, i: number) => `
    <tr>
      <td>${i + 1}</td>
      <td>${item.goods_name || ''}</td>
      <td>${item.goods_sn || ''}</td>
      <td>${item.spec || ''}</td>
      <td>${item.unit_name || ''}</td>
      <td>${item.num || 0}</td>
      <td>¥${Number(item.price || 0).toFixed(2)}</td>
      <td>¥${((item.num || 0) * (item.price || 0)).toFixed(2)}</td>
      <td>${item.remark || ''}</td>
    </tr>`).join('')
  return `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>报价单 ${fd.offer_no || ''}</title><link rel="icon" href="data:,">
  <style>
    body{font-family:SimSun,"Microsoft YaHei",Arial;font-size:12px;color:#000;margin:20px}
    h2{text-align:center;font-size:18px;margin-bottom:4px}
    .sub{text-align:center;color:#666;margin-bottom:16px;font-size:12px}
    .info{display:flex;flex-wrap:wrap;gap:8px 32px;margin-bottom:16px;font-size:12px}
    .info span{min-width:160px}
    table{width:100%;border-collapse:collapse;font-size:11px}
    th,td{border:1px solid #ccc;padding:4px 6px;text-align:left}
    th{background:#f0f0f0;font-weight:bold}
    .total{text-align:right;margin-top:8px;font-size:13px;font-weight:bold}
    .footer{margin-top:30px;display:flex;justify-content:space-between;font-size:12px}
    @media print{body{margin:0}}
  </style></head><body>
  <h2>报 价 单</h2>
  <div class="sub">数字游牧ERP</div>
  <div class="info">
    <span>报价单号：${fd.offer_no || ''}</span>
    <span>客户名称：${fd.customer_name || ''}</span>
    <span>报价日期：${fd.offer_date || ''}</span>
    <span>有效期至：${fd.expire_date || ''}</span>
    <span>经办人：${fd.admin_name || ''}</span>
  </div>
  <table>
    <thead><tr><th>序号</th><th>商品名称</th><th>编码</th><th>规格</th><th>单位</th><th>数量</th><th>单价</th><th>合计</th><th>备注</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="total">报价合计：¥${Number(fd.total_amount || 0).toFixed(2)}</div>
  ${fd.remark ? `<div style="margin-top:10px;font-size:12px">备注：${fd.remark}</div>` : ''}
  <div class="footer">
    <span>供应方签章：_______________</span>
    <span>采购方签章：_______________</span>
    <span>日期：___________</span>
  </div>
  </body></html>`
}

function handlePrint() {
  const w = window.open('', '_blank', 'width=900,height=700')
  if (!w) { ElMessage.warning('请允许弹窗'); return }
  w.document.write(buildPrintHtml())
  w.document.close()
  w.focus()
  setTimeout(() => {
    // 只移除扩展注入的图片/画布节点，不碰 table/div 等打印内容
    const ext = w.document.querySelectorAll('img, canvas, [id^="ext-"], [class*="extension"], [class*="plugin"], [data-extension]')
    ext.forEach(el => el.remove())
    w.print()
  }, 600)
}

function handleExportPdf() {
  const blob = new Blob([buildPrintHtml()], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `报价单_${fd.offer_no || fd.customer_name || ''}.html`
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success('已导出HTML文件，用浏览器打开后可另存为PDF')
}

function onCustomerChange(id: any) {
  const c = customerOptions.value.find(x => x.id === id)
  fd.customer_name = c?.name || c?.nickname || ''
  // 自动套用客户绑定的等级
  const bound = levelMap[id]
  if (bound && levelOptions.value.some(l => l.id === bound)) {
    fd.level_id = bound
  }
}

function onLevelChange() {
  // 等级变化时，如果商品明细已有数据，刷新价格
  if (!fd.items.length || !fd.level_id) return
  for (const row of fd.items) {
    if (!row.goods_id) continue
    const lp = getLevelPrice(fd.level_id, row.goods_id)
    if (lp !== null) row.price = lp
  }
  calcTotal()
  ElMessage.info('已按新等级刷新商品价格')
}

// 金额转大写
function amountToChinese(n: number): string {
  if (!n || n === 0) return '零元整'
  const fraction = ['角', '分']
  const digit = ['零', '壹', '贰', '叁', '肆', '伍', '陆', '柒', '捌', '玖']
  const unit = [['元', '万', '亿'], ['', '拾', '佰', '仟']]
  const head = n < 0 ? '负' : ''
  n = Math.abs(n)
  let s = ''
  for (let i = 0; i < fraction.length; i++) {
    s += (digit[Math.floor(n * 10 * Math.pow(10, i)) % 10] + fraction[i]).replace(/零./, '')
  }
  s = s || '整'
  n = Math.floor(n)
  for (let i = 0; i < unit[0].length && n > 0; i++) {
    let p = ''
    for (let j = 0; j < unit[1].length && n > 0; j++) {
      p = digit[n % 10] + unit[1][j] + p
      n = Math.floor(n / 10)
    }
    s = p.replace(/(零.)*零$/, '').replace(/^$/, '零') + unit[0][i] + s
  }
  return head + s.replace(/(零.)*零元/, '元').replace(/(零.)+/g, '零').replace(/^整$/, '零元整')
}

function calcTotal() {
  fd.total_amount = fd.items.reduce((sum, r) => sum + (r.num || 0) * (r.price || 0), 0)
  calcAfterOffer()
}

function calcAfterOffer() {
  fd.after_offer = Math.max(0, fd.total_amount - (fd.discount_amount || 0))
}

const discountLabel = computed(() => {
  if (!fd.discount_amount || !fd.total_amount) return ''
  const ratio = fd.after_offer / fd.total_amount
  const pct = ((1 - ratio) * 100).toFixed(1)
  const zhekouVal = (ratio * 10).toFixed(1)
  return `${zhekouVal}折 (优惠${pct}%)`
})

function removeItem(index: number) {
  fd.items.splice(index, 1)
  calcTotal()
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
      customer_id: fd.customer_id,
      remark: fd.offer_no ? `[NO:${fd.offer_no}]${fd.remark ? ' ' + fd.remark : ''}` : fd.remark,
      total_amount: fd.total_amount,
      discount_amount: fd.discount_amount || 0,
      after_offer: fd.after_offer || fd.total_amount,
      goods_info: JSON.stringify(fd.items),
    }
    if (fd.id) payload.id = fd.id
    if (fd.offer_no) payload.order_sn = fd.offer_no
    if (fd.customer_name) payload.customer_name = fd.customer_name
    if (fd.admin_name) payload.admin_name = fd.admin_name
    if (fd.offer_date) payload.offer_date = fd.offer_date
    if (fd.expire_date) payload.expire_date = fd.expire_date
    if (fd.level_id) payload.level_id = fd.level_id
    fd.id ? await updateOffer(payload) : await createOffer(payload)
    ElMessage.success('保存成功')
    backToList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该报价单？', '提示', { type: 'warning' })
  await deleteOffer(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

async function handleAudit(row: any, status: number) {
  const action = status === 1 ? '审核通过' : status === 2 ? '驳回' : '反审核'
  await ElMessageBox.confirm(`确定${action}该报价单？`, '提示', { type: 'warning' })
  try {
    await auditOffer(row.id, status)
    ElMessage.success(`${action}成功`)
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

async function handleConvertToContract(row: any) {
  const offerNo = parseOfferNo(row)
  await ElMessageBox.confirm(`确定将报价单「${offerNo}」转为销售订单？`, '转销售订单', { type: 'info' })
  let items: any[] = []
  try { items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch {}
  sessionStorage.setItem('sale_contract_draft_from_offer', JSON.stringify({
    source_offer_id: row.id,
    source_offer_no: offerNo,
    customer_id: row.customer_id,
    customer_name: row.customer_name || '',
    admin_name: row.admin_name || '',
    remark: parseRemark(row.remark || ''),
    discount_amount: Number(row.discount_amount || 0),
    after_offer: Number(row.after_offer || 0),
    items,
  }))
  router.push('/sale/contract?from=offer')
}

// ── 商品选择器 ────────────────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  for (const g of goods) {
    // 避免重复添加同一商品
    if (fd.items.some(i => i.goods_id === g.id)) continue
    // 优先使用等级专属价，否则用系统销售价
    const basePrice = Number(g.sell_price) || 0
    const levelPrice = fd.level_id ? (getLevelPrice(fd.level_id, g.id) ?? basePrice) : basePrice
    fd.items.push({
      goods_id: g.id,
      goods_name: g.goods_name,
      goods_sn: g.goods_sn || '',
      spec: '',
      unit_name: g.unit_name || '',
      num: 1,
      price: levelPrice,
      remark: '',
    })
    if (g.multi_spec === 1) fetchGoodsSpecs(g.id, g.spec)
    else goodsSpecMap[g.id] = []  // 规格未开启，清空缓存避免误显示
    if (g.multi_unit) fetchGoodsUnits(g.id, g.unit_name || '')
  }
  calcTotal()
}

// ── 快速新增客户 ──────────────────────────────────────────────────────────────
const addCustomerVisible = ref(false)
const addCustomerLoading = ref(false)
const customerForm = reactive({ nickname: '', mobile: '' })

function openAddCustomer() {
  customerForm.nickname = ''
  customerForm.mobile = ''
  addCustomerVisible.value = true
}

async function submitAddCustomer() {
  if (!customerForm.nickname.trim()) { ElMessage.warning('请输入客户名称'); return }
  addCustomerLoading.value = true
  try {
    const res = await createSaleCustomer({ name: customerForm.nickname.trim(), mobile: customerForm.mobile.trim() })
    ElMessage.success('新增客户成功')
    addCustomerVisible.value = false
    await loadCustomers()
    const newId = res.data?.id ?? res.data
    if (newId) { fd.customer_id = newId; onCustomerChange(newId) }
    else {
      const last = customerOptions.value[customerOptions.value.length - 1]
      if (last) { fd.customer_id = last.id; onCustomerChange(last.id) }
    }
  } catch (e: any) {
    ElMessage.error(e?.message ?? '新增失败')
  } finally {
    addCustomerLoading.value = false
  }
}
</script>

<style scoped>
.offer-page { height: 100%; }

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
  padding: 0 24px;
  height: 52px;
  flex-shrink: 0;
}

.form-title { font-size: 15px; font-weight: 600; color: #1d1d1f; }
.form-actions { display: flex; gap: 8px; }

.form-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-section {
  background: #fff;
  border-radius: 12px;
  border: 1px solid #e4e7ed;
  padding: 18px 20px 12px;
}

.sec-title {
  font-size: 14px;
  font-weight: 600;
  color: #1d1d1f;
  margin-bottom: 16px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f7;
}

.sec-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid #f5f5f7;
}

.total-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 4px 4px;
  font-size: 13px;
  color: rgba(29,29,31,0.5);
}
</style>
