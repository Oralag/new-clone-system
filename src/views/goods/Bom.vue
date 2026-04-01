<template>
  <div class="bom-page">
    <el-card>
      <!-- 工具栏 -->
      <div class="toolbar">
        <el-button type="primary" size="small" @click="openAdd">新增 (F9)</el-button>
        <el-button size="small" type="danger" :disabled="!selection.length" @click="handleBatchDel">删除</el-button>
      </div>
      <!-- 搜索 -->
      <div class="search-bar">
        <el-input v-model="keyword" placeholder="搜索BOM编号/商品名称/商品编码" clearable size="small"
          style="width:260px" @change="loadData" />
        <el-button size="small" type="primary" @click="loadData">查询</el-button>
        <el-button size="small" @click="keyword=''; loadData()">重置</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe size="small"
        style="width:100%;margin-top:8px" @selection-change="selection = $event" row-key="id">
        <el-table-column type="selection" width="40" />
        <el-table-column type="expand">
          <template #default="{ row }">
            <div style="padding:8px 24px 12px">
              <el-table :data="row.items || []" border size="small" style="width:100%">
                <el-table-column prop="goods_sn" label="物料编码" width="120" />
                <el-table-column prop="goods_name" label="物料名称" min-width="160" />
                <el-table-column prop="num" label="用量" width="80" align="right" />
                <el-table-column prop="unit_name" label="单位" width="65" align="center" />
                <el-table-column prop="price" label="参考单价" width="100" align="right">
                  <template #default="{ row: r }">{{ Number(r.price || 0).toFixed(2) }}</template>
                </el-table-column>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="序号" type="index" width="55" align="center" />
        <el-table-column prop="bom_code" label="BOM编号" width="120" />
        <el-table-column prop="goods_sn" label="商品编码" width="110" />
        <el-table-column prop="goods_name" label="商品名称" min-width="180" />
        <el-table-column prop="spec" label="规格型号" width="120">
          <template #default="{ row }">{{ row.spec || '—' }}</template>
        </el-table-column>
        <el-table-column prop="unit_name" label="单位" width="65" align="center" />
        <el-table-column label="子物料数" width="80" align="center">
          <template #default="{ row }">{{ (row.items || []).length }}</template>
        </el-table-column>
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button link size="small" type="danger" @click="handleDel(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="page-bar">
        <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
          :page-sizes="[20, 50, 100]" :total="total" layout="total, sizes, prev, pager, next"
          background small @change="loadData" />
      </div>
    </el-card>

    <!-- 新增/编辑弹框 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑BOM' : '新增BOM'"
      width="780px" :close-on-click-modal="false" @closed="resetForm">
      <el-form :model="form" label-width="80px" size="small">
        <el-row :gutter="16">
          <el-col :span="12">
            <el-form-item label="商品名称" required>
              <el-input v-model="form.goods_name" placeholder="请输入成品名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="商品编码">
              <el-input v-model="form.goods_sn" placeholder="如 SP0000001" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="规格型号">
              <el-input v-model="form.spec" placeholder="如 250克" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="单位">
              <el-input v-model="form.unit_name" placeholder="如 袋/盒/瓶" />
            </el-form-item>
          </el-col>
        </el-row>

        <!-- 子物料列表 -->
        <div class="items-header">
          <span style="font-weight:500;font-size:13px">子物料清单</span>
          <el-button size="small" type="primary" @click="addItem">+ 添加物料</el-button>
        </div>
        <el-table :data="form.items" border size="small" style="width:100%;margin-top:6px">
          <el-table-column label="物料名称" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.goods_name" size="small" placeholder="物料名称" />
            </template>
          </el-table-column>
          <el-table-column label="物料编码" width="120">
            <template #default="{ row }">
              <el-input v-model="row.goods_sn" size="small" placeholder="编码" />
            </template>
          </el-table-column>
          <el-table-column label="用量" width="80">
            <template #default="{ row }">
              <el-input-number v-model="row.num" size="small" :min="0" :precision="4" controls-position="right" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="单位" width="70">
            <template #default="{ row }">
              <el-input v-model="row.unit_name" size="small" placeholder="单位" />
            </template>
          </el-table-column>
          <el-table-column label="单价" width="90">
            <template #default="{ row }">
              <el-input-number v-model="row.price" size="small" :min="0" :precision="5" controls-position="right" style="width:100%" />
            </template>
          </el-table-column>
          <el-table-column label="" width="42" align="center">
            <template #default="{ $index }">
              <el-button link type="danger" size="small" @click="form.items.splice($index, 1)">✕</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

const loading = ref(false)
const saving = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const keyword = ref('')
const selection = ref<any[]>([])
const dialogVisible = ref(false)

const defaultForm = () => ({
  id: 0,
  goods_name: '',
  goods_sn: '',
  spec: '',
  unit_name: '',
  items: [] as any[]
})
const form = ref(defaultForm())

async function loadData() {
  loading.value = true
  try {
    const res: any = await http.get('/goods/BomGoods/index', {
      params: { page: page.value, list_rows: pageSize.value, keyword: keyword.value }
    })
    const list = res.data?.list || []
    // fetch detail for each to get items (or use detail endpoint)
    // Since index doesn't return items, we need to enrich with items
    // Load items in parallel for visible rows
    await Promise.all(list.map(async (row: any) => {
      try {
        const detail: any = await http.get('/goods/BomGoods/detail', { params: { id: row.id } })
        row.items = detail.data?.items || []
      } catch { row.items = [] }
    }))
    tableData.value = list
    total.value = res.data?.total || 0
  } catch (e: any) {
    ElMessage.error(e.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openAdd() {
  form.value = defaultForm()
  dialogVisible.value = true
}

function openEdit(row: any) {
  form.value = {
    id: row.id,
    goods_name: row.goods_name,
    goods_sn: row.goods_sn,
    spec: row.spec,
    unit_name: row.unit_name,
    items: (row.items || []).map((i: any) => ({ ...i }))
  }
  dialogVisible.value = true
}

function addItem() {
  form.value.items.push({ goods_name: '', goods_sn: '', num: 1, unit_name: '', price: 0 })
}

function resetForm() {
  form.value = defaultForm()
}

async function handleSave() {
  if (!form.value.goods_name.trim()) {
    return ElMessage.warning('商品名称不能为空')
  }
  saving.value = true
  try {
    const url = form.value.id ? '/goods/BomGoods/edit' : '/goods/BomGoods/add'
    await http.post(url, form.value)
    ElMessage.success(form.value.id ? '修改成功' : '新增成功')
    dialogVisible.value = false
    loadData()
  } catch (e: any) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function handleDel(row: any) {
  await ElMessageBox.confirm(`确认删除「${row.goods_name}」的BOM？`, '提示', { type: 'warning' })
  await http.post('/goods/BomGoods/del', { id: row.id })
  ElMessage.success('删除成功')
  loadData()
}

async function handleBatchDel() {
  if (!selection.value.length) return
  await ElMessageBox.confirm(`确认删除选中的 ${selection.value.length} 条BOM？`, '提示', { type: 'warning' })
  await Promise.all(selection.value.map(r => http.post('/goods/BomGoods/del', { id: r.id })))
  ElMessage.success('删除成功')
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.bom-page { padding: 12px; }
.toolbar { display: flex; gap: 8px; margin-bottom: 8px; }
.search-bar { display: flex; gap: 8px; margin-bottom: 4px; }
.page-bar { display: flex; justify-content: flex-end; margin-top: 12px; }
.items-header { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; margin-bottom: 4px; }
</style>
