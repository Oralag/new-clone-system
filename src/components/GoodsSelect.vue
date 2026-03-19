<template>
  <el-dialog v-model="visible" title="选择商品" width="900px" destroy-on-close>
    <div class="select-search">
      <el-input v-model="keyword" placeholder="商品名称/编码" clearable style="width: 200px" @keyup.enter="search" />
      <el-select v-model="cateId" placeholder="商品分类" clearable style="width: 140px" @change="search">
        <el-option v-for="c in cateOptions" :key="c.id" :label="c.name" :value="c.id" />
      </el-select>
      <el-button type="primary" @click="search">搜索</el-button>
    </div>

    <el-table
      v-loading="loading"
      :data="list"
      border
      stripe
      @selection-change="handleSelect"
    >
      <el-table-column type="selection" width="50" />
      <el-table-column prop="goods_sn" label="商品编码" width="140" />
      <el-table-column prop="goods_name" label="商品名称" min-width="180" />
      <el-table-column prop="cate_name" label="分类" width="120" />
      <el-table-column prop="unit_name" label="单位" width="80" />
      <el-table-column prop="sell_price" label="销售价" width="100" />
      <el-table-column prop="stock_num" label="库存" width="100" />
    </el-table>

    <div class="dialog-pagination">
      <el-pagination
        v-model:current-page="page"
        v-model:page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="loadData"
      />
    </div>

    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" @click="confirm">确定 ({{ selected.length }})</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import http from '@/api/http'
import { getGoodsCateList } from '@/api/goods'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'

const emit = defineEmits<{
  (e: 'confirm', val: any[]): void
}>()

const visible = ref(false)
const loading = ref(false)
const keyword = ref('')
const cateId = ref<any>(null)
const cateOptions = ref<any[]>([])
const list = ref<any[]>([])
const selected = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

async function loadCates() {
  try {
    const res: any = await getGoodsCateList({ list_rows: 200 })
    const rows = res?.data?.rows || res?.data?.list || res?.data?.data || []
    cateOptions.value = rows.filter((c: any, i: number) => rows.findIndex((x: any) => x.name === c.name) === i)
  } catch {}
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: pageSize.value, keyword: keyword.value }
    if (cateId.value) params.cate_id = cateId.value
    const res: any = await http.get('/shop.ShopGoods/index', { params })
    const data = res?.data || {}
    const rows = data.rows || data.list || []
    list.value = fuzzyFilterGoods(rows, keyword.value)
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function search() {
  page.value = 1
  loadData()
}

function handleSelect(val: any[]) {
  selected.value = val
}

function confirm() {
  emit('confirm', selected.value)
  visible.value = false
}

function open() {
  visible.value = true
  keyword.value = ''
  cateId.value = null
  loadCates()
  loadData()
}

defineExpose({ open })
</script>

<style scoped>
.select-search {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.dialog-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 12px;
}
</style>
