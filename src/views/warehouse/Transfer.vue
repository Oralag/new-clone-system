<template>
  <div class="transfer-page">

    <!-- ══════════════════════ 列表视图 ══════════════════════ -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi"
          del-path="/stock/Allocation/batchDel"
          export-file-name="调拨单" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.keyword" placeholder="调拨单号/仓库" clearable style="width:180px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" placeholder="核对状态">
              <el-option label="未核对" value="unreconciled" />
            </el-select>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增调拨单</el-button>
          </template>

          <el-table-column prop="transfer_no" label="调拨单号" min-width="150" />
          <el-table-column prop="allot_date" label="调拨日期" width="110">
            <template #default="{ row }">{{ fmtDt(row.allot_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="from_warehouse" label="调出仓库" min-width="110" />
          <el-table-column prop="to_warehouse" label="调入仓库" min-width="110" />
          <el-table-column label="入库总价" width="110" align="right">
            <template #default="{ row }">
              <b>{{ Number(row.total_amount || 0).toFixed(2) }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" min-width="130" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="240" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 1" type="warning" size="small" link @click="handleAudit(row, 0)">反审核</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? '已核对' : '核对' }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ══════════════════════ 新增/编辑/查看 表单页 ══════════════════════ -->
    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView ? '查看调拨单' : fd.id ? '编辑调拨单' : '新增调拨单' }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">已驳回</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">保存（Ctrl+S）</el-button>
        </div>
      </div>

      <div class="form-body">
        <!-- 头部字段 -->
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">调拨单号</span>
                <el-input v-model="fd.transfer_no" placeholder="不填写自动生成" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">调拨日期</span>
                <el-date-picker v-model="fd.allot_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">调出仓库</span>
                <el-select v-model="fd.from_warehouse_id" placeholder="调出仓库" style="flex:1"
                  :disabled="isView" @change="onFromWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">调入仓库</span>
                <el-select v-model="fd.to_warehouse_id" placeholder="调入仓库" style="flex:1"
                  :disabled="isView" @change="onToWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品明细工具栏 -->
        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">选择商品</el-button>
          <el-button size="small" :icon="Plus" @click="addEmptyRow">手动添加行</el-button>
          <span class="goods-summary">入库总价：<b>{{ totalAmount.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>
          入库总价：<b>{{ totalAmount.toFixed(2) }}</b>
        </div>

        <!-- 商品明细表 -->
        <div class="goods-table-wrap">
          <el-table :data="fd.items" border size="small" style="width:100%" empty-text="请点击「选择商品」添加明细">
            <el-table-column type="index" label="#" width="45" align="center" />
            <el-table-column label="商品名称" min-width="150">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_name }}</span>
                <el-input v-else v-model="row.goods_name" size="small" placeholder="商品名称" />
              </template>
            </el-table-column>
            <el-table-column label="商品编码" width="120">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_sn || '—' }}</span>
                <el-input v-else v-model="row.goods_sn" size="small" placeholder="编码" />
              </template>
            </el-table-column>
            <el-table-column label="属性" width="100">
              <template #default="{ row }">{{ row.spec || '—' }}</template>
            </el-table-column>
            <el-table-column label="商品单位" width="80" align="center">
              <template #default="{ row }">{{ row.unit_name || '—' }}</template>
            </el-table-column>
            <el-table-column label="数量" width="110" align="right">
              <template #header>
                数量
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num','数量')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.num }}</span>
              </template>
            </el-table-column>
            <el-table-column label="入库单价" width="120" align="right">
              <template #header>
                入库单价
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('in_price','入库单价')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.in_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.in_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="入库总金额" width="120" align="right">
              <template #default="{ row }">
                <b style="color:#0071e3">{{ ((row.num||0)*(row.in_price||0)).toFixed(2) }}</b>
              </template>
            </el-table-column>
            <el-table-column label="库存数量" width="90" align="right">
              <template #default="{ row }">{{ row.stock_num ?? '—' }}</template>
            </el-table-column>
            <el-table-column label="调出批次号" width="120">
              <template #header>
                调出批次号
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('out_batch_no','调出批次号')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.out_batch_no" size="small" placeholder="调出批次号" />
                <span v-else>{{ row.out_batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="调入批次号" width="120">
              <template #header>
                调入批次号
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('in_batch_no','调入批次号')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.in_batch_no" size="small" placeholder="调入批次号" />
                <span v-else>{{ row.in_batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="备注" min-width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.remark" size="small" placeholder="备注" />
                <span v-else>{{ row.remark || '' }}</span>
              </template>
            </el-table-column>
            <el-table-column v-if="!isView" label="" width="50" fixed="right">
              <template #default="{ $index }">
                <el-button type="danger" size="small" link :icon="Delete" @click="removeRow($index)" />
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 合计 + 备注 -->
        <div class="form-footer">
          <div class="footer-summary">
            <span>合计：</span>
            <span>数量 <b>{{ totalNum.toFixed(2) }}</b></span>
            <span style="margin-left:20px">入库总价 <b style="color:#0071e3">{{ totalAmount.toFixed(2) }}</b></span>
          </div>
          <div class="field-row" style="margin-top:10px">
            <span class="field-label">备注</span>
            <el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" />
          </div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />

    <!-- 批量设置弹窗 -->
    <el-dialog v-model="batchVisible" :title="`批量设置：${batchLabel}`" width="300px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" @click="applyBatch">确定</el-button>
      </template>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { fmtDt } from '@/utils/date'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getTransferList, createTransfer, updateTransfer, auditTransfer, deleteTransfer, getWarehouseList } from '@/api/warehouse'

const tableRef = ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_warehouse_transfer', tableRef)
const reconcileFilteredApi = createFilteredApi(getTransferList, 'reconcile_filter')
const searchForm = reactive({ keyword: '', reconcile_filter: '' })

// ── 视图状态 ──────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

// ── 仓库列表 ──────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  try {
    const res = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = res.data?.list || res.data?.rows || res.data?.data || []
  } catch {}
}
function onFromWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.from_warehouse = w?.name ?? ''
}
function onToWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.to_warehouse = w?.name ?? ''
}

// ── 表单数据 ──────────────────────────────────────────────────────
function defaultFd() {
  return {
    id: 0, status: 0,
    transfer_no: '',
    allot_date: new Date().toISOString().slice(0, 10),
    from_warehouse_id: null as any, from_warehouse: '',
    to_warehouse_id: null as any, to_warehouse: '',
    remark: '',
    items: [] as any[],
    total_amount: 0,
  }
}
const fd = reactive(defaultFd())

function calcRow(row: any) {
  row.row_total = (row.num || 0) * (row.in_price || 0)
}
const totalNum = computed(() => fd.items.reduce((s, r) => s + (Number(r.num) || 0), 0))
const totalAmount = computed(() => fd.items.reduce((s, r) => s + (Number(r.num)||0) * (Number(r.in_price)||0), 0))

// ── 打开表单 ──────────────────────────────────────────────────────
async function openAdd() {
  Object.assign(fd, defaultFd())
  fd.items = []
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}
async function openEdit(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(calcRow)
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}
async function openView(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = Array.isArray(row.goods_info) ? row.goods_info : JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(calcRow)
  isView.value = true
  showForm.value = true
  await loadWarehouses()
}
function backToList() { showForm.value = false; tableRef.value?.refresh() }

// ── 商品选择 ──────────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  goods.forEach(g => {
    fd.items.push({
      goods_id: g.id,
      goods_name: g.name,
      goods_sn: g.goods_sn || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      num: 1,
      in_price: 0,
      row_total: 0,
      stock_num: g.stock_num ?? null,
      out_batch_no: '',
      in_batch_no: '',
      remark: '',
    })
  })
}
function addEmptyRow() {
  fd.items.push({ goods_id: 0, goods_name: '', goods_sn: '', spec: '', unit_name: '', num: 1, in_price: 0, row_total: 0, stock_num: null, out_batch_no: '', in_batch_no: '', remark: '' })
}
function removeRow(index: number) { fd.items.splice(index, 1) }

// ── 批量设置 ──────────────────────────────────────────────────────
const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)
function batchSet(field: string, label: string) { batchField.value = field; batchLabel.value = label; batchValue.value = 0; batchVisible.value = true }
function applyBatch() {
  fd.items.forEach(r => { r[batchField.value] = batchValue.value; calcRow(r) })
  batchVisible.value = false
}

// ── 保存 ──────────────────────────────────────────────────────────
async function handleSave() {
  if (!fd.allot_date) { ElMessage.warning('请选择调拨日期'); return }
  if (!fd.from_warehouse_id) { ElMessage.warning('请选择调出仓库'); return }
  if (!fd.to_warehouse_id) { ElMessage.warning('请选择调入仓库'); return }
  if (!fd.items.length) { ElMessage.warning('请添加商品明细'); return }
  saving.value = true
  try {
    const payload = { ...fd, goods_info: JSON.stringify(fd.items), total_amount: totalAmount.value }
    if (fd.id) {
      await updateTransfer(payload)
    } else {
      await createTransfer(payload)
    }
    ElMessage.success('保存成功')
    backToList()
  } catch { } finally { saving.value = false }
}

// ── 审核 ──────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const labels: Record<number, string> = { 1: '审核', 0: '反审核' }
  await ElMessageBox.confirm(`确定要${labels[status]}该调拨单吗？`, '提示', { type: 'warning' })
  try {
    await auditTransfer({ id: row.id, status })
    ElMessage.success('操作成功')
    tableRef.value?.refresh()
  } catch {}
}

// ── 删除 ──────────────────────────────────────────────────────────
async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该调拨单吗？', '提示', { type: 'warning' })
  await deleteTransfer(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}

onMounted(loadWarehouses)
</script>

<style scoped>
.transfer-page { padding: 0; }
.form-page { background: #fff; min-height: calc(100vh - 80px); }
.form-topbar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 16px; border-bottom: 1px solid #e8edf2;
  background: #fff; position: sticky; top: 0; z-index: 10;
}
.form-topbar-left { display: flex; align-items: center; gap: 10px; }
.form-title { font-size: 15px; font-weight: 600; color: #333; }
.form-body { padding: 16px; }
.form-section { margin-bottom: 12px; }
.field-row { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.field-label { font-size: 13px; color: #555; white-space: nowrap; flex-shrink: 0; min-width: 52px; }
.field-label.required::before { content: '*'; color: #f56c6c; margin-right: 2px; }
.goods-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 0; margin-bottom: 6px;
  border-top: 1px solid #f0f0f0;
}
.goods-summary-view { padding: 6px 0; font-size: 13px; color: #555; border-top: 1px solid #f0f0f0; margin-bottom: 6px; }
.goods-summary { margin-left: auto; font-size: 13px; color: #555; }
.goods-summary b { color: #0071e3; }
.goods-table-wrap { margin-bottom: 10px; }
.form-footer { padding: 12px 0; border-top: 1px solid #f0f0f0; }
.footer-summary { font-size: 13px; color: #555; }
.footer-summary b { color: #0071e3; }
</style>
