<template>
  <div class="other-out-page">

    <!-- ══════════════════════ 列表视图 ══════════════════════ -->
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getOtherOutList"
          del-path="/stock/OtherOut/batchDel"
          export-file-name="其他出库" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.out_no" placeholder="出库单号" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width:160px" />
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增其他出库</el-button>
          </template>

          <el-table-column prop="out_no" label="出库单号" min-width="150" />
          <el-table-column prop="out_man" label="出库人" width="110" />
          <el-table-column prop="out_date" label="出库日期" width="110">
            <template #default="{ row }">{{ (row.out_date || row.created_at || '').slice(0,10) }}</template>
          </el-table-column>
          <el-table-column prop="warehouse_name" label="出库仓库" min-width="110" />
          <el-table-column label="出库总价" width="110" align="right">
            <template #default="{ row }">
              <b>{{ Number(row.total_price || 0).toFixed(2) }}</b>
            </template>
          </el-table-column>
          <el-table-column prop="reason" label="出库原因" min-width="130" show-overflow-tooltip />
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'info'" size="small">
                {{ row.status === 1 ? '已审核' : row.status === 2 ? '已驳回' : '待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="230" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status === 0" type="primary" size="small" link @click="handleAudit(row, 1)">审核</el-button>
              <el-button v-if="row.status === 0" type="danger" size="small" link @click="handleAudit(row, 2)">驳回</el-button>
              <el-button v-if="row.status === 1 && !permStore.isSubAccount" type="warning" size="small" link @click="handleAudit(row, 0)">反审核</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <!-- ══════════════════════ 新增/编辑/查看 表单页 ══════════════════════ -->
    <div v-else class="form-page">
      <!-- 顶部操作栏 -->
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView ? '查看其他出库' : fd.id ? '编辑其他出库' : '新增其他出库' }}</span>
          <el-tag v-if="fd.status === 1" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="fd.status === 2" type="danger" size="small">已驳回</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">保存（Ctrl+S）</el-button>
        </div>
      </div>

      <div class="form-body">
        <!-- 头部字段行 -->
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">出库单号</span>
                <el-input v-model="fd.out_no" placeholder="不填写自动生成" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label">出库人</span>
                <el-input v-model="fd.out_man" placeholder="出库人" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">出库日期</span>
                <el-date-picker v-model="fd.out_date" type="date" value-format="YYYY-MM-DD"
                  style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">出库仓库</span>
                <el-select v-model="fd.warehouse_id" placeholder="选择仓库" style="flex:1"
                  :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top:6px">
            <el-col :span="12">
              <div class="field-row">
                <span class="field-label">出库原因</span>
                <el-input v-model="fd.reason" placeholder="请输入出库原因" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 商品明细工具栏 -->
        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">选择商品</el-button>
          <el-button size="small" :icon="Plus" @click="addEmptyRow">手动添加行</el-button>
          <span class="goods-summary">出库总价：<b>{{ totalPrice.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>
          出库总价：<b>{{ totalPrice.toFixed(2) }}</b>
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
            <el-table-column prop="goods_sn" label="商品编码" width="120">
              <template #default="{ row }">
                <span v-if="isView">{{ row.goods_sn }}</span>
                <el-input v-else v-model="row.goods_sn" size="small" placeholder="编码" />
              </template>
            </el-table-column>
            <el-table-column label="分类" width="100">
              <template #default="{ row }">{{ row.cate_name || '—' }}</template>
            </el-table-column>
            <el-table-column label="规格型号" width="110">
              <template #default="{ row }">
                <span v-if="isView">{{ row.spec || '—' }}</span>
                <el-input v-else v-model="row.spec" size="small" placeholder="规格" />
              </template>
            </el-table-column>
            <el-table-column label="单位" width="75" align="center">
              <template #default="{ row }">{{ row.unit_name || '—' }}</template>
            </el-table-column>
            <el-table-column label="库存数量" width="90" align="right">
              <template #default="{ row }">
                <span :style="{ color: (row.stock_num||0) > 0 ? '#16a34a' : '#dc2626' }">
                  {{ row.stock_num ?? '—' }}
                </span>
              </template>
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
            <el-table-column label="出库单价" width="120" align="right">
              <template #header>
                出库单价
                <el-button v-if="!isView" link type="primary" size="small" @click="batchSet('out_price','出库单价')">批量</el-button>
              </template>
              <template #default="{ row }">
                <el-input-number v-if="!isView" v-model="row.out_price" :min="0" :precision="4"
                  controls-position="right" size="small" style="width:100%" @change="calcRow(row)" />
                <span v-else>{{ row.out_price }}</span>
              </template>
            </el-table-column>
            <el-table-column label="出库总金额" width="120" align="right">
              <template #default="{ row }">
                <b style="color:#dc2626">{{ ((row.num||0)*(row.out_price||0)).toFixed(2) }}</b>
              </template>
            </el-table-column>
            <el-table-column label="批次号" width="110">
              <template #default="{ row }">
                <el-input v-if="!isView" v-model="row.batch_no" size="small" placeholder="批次号" />
                <span v-else>{{ row.batch_no || '—' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="仓库" width="120">
              <template #default="{ row }">
                <el-select v-if="!isView" v-model="row.warehouse_id" size="small" placeholder="仓库"
                  style="width:100%" @change="(v:any) => onRowWarehouse(row, v)">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
                <span v-else>{{ row.warehouse_name || fd.warehouse_name || '—' }}</span>
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

        <!-- 合计行 + 备注 -->
        <div class="form-footer">
          <div class="footer-summary">
            <span>合计：</span>
            <span>数量 <b>{{ totalNum.toFixed(2) }}</b></span>
            <span style="margin-left:20px">出库总价 <b style="color:#dc2626">{{ totalPrice.toFixed(2) }}</b></span>
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
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getOtherOutList, createOtherOut, updateOtherOut, deleteOtherOut, getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { useStockRefreshStore } from '@/stores/stockRefresh'

const permStore = usePermissionStore()
const stockRefreshStore = useStockRefreshStore()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive({ out_no: '', goods_name: '' })

function resetSearch() { searchForm.out_no = ''; searchForm.goods_name = '' }

// ── 视图状态 ────────────────────────────────────────────────────
const showForm = ref(false)
const isView = ref(false)
const saving = ref(false)

// ── 仓库 ────────────────────────────────────────────────────────
const warehouseOptions = ref<any[]>([])
async function loadWarehouses() {
  try {
    const res = await getWarehouseList({ list_rows: 200 })
    warehouseOptions.value = res.data?.list || res.data?.rows || res.data?.data || []
  } catch {}
}
function onWarehouseChange(id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  fd.warehouse_name = w?.name ?? ''
  fd.items.forEach(r => { if (!r.warehouse_id) { r.warehouse_id = id; r.warehouse_name = w?.name ?? '' } })
}
function onRowWarehouse(row: any, id: any) {
  const w = warehouseOptions.value.find(x => x.id === id)
  row.warehouse_name = w?.name ?? ''
}

// ── 表单数据 ────────────────────────────────────────────────────
function defaultFd() {
  return {
    id: 0, status: 0,
    out_no: '', out_man: '',
    out_date: new Date().toISOString().slice(0, 10),
    warehouse_id: null as any, warehouse_name: '',
    reason: '', remark: '',
    items: [] as any[],
    total_price: 0,
  }
}
const fd = reactive(defaultFd())

function calcRow(row: any) {
  row.row_total = (row.num || 0) * (row.out_price || 0)
}
const totalNum = computed(() => fd.items.reduce((s, r) => s + (Number(r.num) || 0), 0))
const totalPrice = computed(() => fd.items.reduce((s, r) => s + (Number(r.num)||0) * (Number(r.out_price)||0), 0))

// ── 打开表单 ────────────────────────────────────────────────────
async function openAdd() {
  Object.assign(fd, defaultFd())
  fd.items = []
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}
async function openEdit(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(calcRow)
  isView.value = false
  showForm.value = true
  await loadWarehouses()
}
async function openView(row: any) {
  Object.assign(fd, { ...defaultFd(), ...row })
  try { fd.items = JSON.parse(row.goods_info || '[]') } catch { fd.items = [] }
  fd.items.forEach(calcRow)
  isView.value = true
  showForm.value = true
  await loadWarehouses()
}
function backToList() { showForm.value = false; tableRef.value?.refresh() }

// ── 商品选择器 ──────────────────────────────────────────────────
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()

function onGoodsConfirm(goods: any[]) {
  goods.forEach(g => {
    fd.items.push({
      goods_id: g.id,
      goods_name: g.name,
      goods_sn: g.goods_sn || '',
      cate_name: g.cate_name || '',
      spec: g.spec || '',
      unit_name: g.unit_name || '',
      stock_num: g.stock_num ?? null,
      num: 1,
      out_price: 0,
      row_total: 0,
      batch_no: '',
      warehouse_id: fd.warehouse_id,
      warehouse_name: fd.warehouse_name,
      remark: '',
    })
  })
}

function addEmptyRow() {
  fd.items.push({ goods_id: 0, goods_name: '', goods_sn: '', cate_name: '', spec: '', unit_name: '', stock_num: null, num: 1, out_price: 0, row_total: 0, batch_no: '', warehouse_id: fd.warehouse_id, warehouse_name: fd.warehouse_name, remark: '' })
}
function removeRow(index: number) { fd.items.splice(index, 1) }

// ── 批量设置 ────────────────────────────────────────────────────
const batchVisible = ref(false)
const batchField = ref('')
const batchLabel = ref('')
const batchValue = ref(0)
function batchSet(field: string, label: string) { batchField.value = field; batchLabel.value = label; batchValue.value = 0; batchVisible.value = true }
function applyBatch() {
  fd.items.forEach(r => { r[batchField.value] = batchValue.value; calcRow(r) })
  batchVisible.value = false
}

// ── 保存 ────────────────────────────────────────────────────────
async function handleSave() {
  if (!fd.out_date) { ElMessage.warning('请选择出库日期'); return }
  if (!fd.warehouse_id) { ElMessage.warning('请选择出库仓库'); return }
  if (!fd.items.length) { ElMessage.warning('请添加商品明细'); return }
  saving.value = true
  try {
    const payload = {
      ...fd,
      goods_info: JSON.stringify(fd.items),
      total_price: totalPrice.value,
    }
    if (fd.id) {
      payload.id = fd.id
      await updateOtherOut(payload)
    } else {
      await createOtherOut(payload)
    }
    ElMessage.success('保存成功')
    stockRefreshStore.trigger()
    backToList()
  } catch { } finally { saving.value = false }
}

// ── 审核 ────────────────────────────────────────────────────────
async function handleAudit(row: any, status: number) {
  const labels: Record<number, string> = { 1: '审核', 2: '驳回', 0: '反审核' }
  await ElMessageBox.confirm(`确定要${labels[status]}该出库单吗？`, '提示', { type: 'warning' })
  try {
    await http.post('/stock/OtherOut/audit', { id: row.id, status })
    ElMessage.success('操作成功')
    stockRefreshStore.trigger()
    tableRef.value?.refresh()
  } catch {}
}

// ── 删除 ────────────────────────────────────────────────────────
async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该出库单吗？', '提示', { type: 'warning' })
  await deleteOtherOut(id)
  ElMessage.success('删除成功')
  stockRefreshStore.trigger()
  tableRef.value?.refresh()
}

onMounted(loadWarehouses)
</script>

<style scoped>
.other-out-page { padding: 0; }

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
.goods-summary b { color: #dc2626; }

.goods-table-wrap { margin-bottom: 10px; }

.form-footer { padding: 12px 0; border-top: 1px solid #f0f0f0; }
.footer-summary { font-size: 13px; color: #555; }
.footer-summary b { color: #dc2626; }
</style>
