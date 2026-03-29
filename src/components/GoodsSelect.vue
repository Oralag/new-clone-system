<template>
  <el-dialog v-model="visible" title="选择商品" width="1100px" destroy-on-close>
    <div class="gs-body">
      <!-- 左侧分类树 -->
      <div class="gs-cate">
        <div class="gs-cate-item" :class="{ active: selectedCateId === null }" @click="selectCate(null)">全部</div>
        <el-tree
          v-if="cateTree.length"
          :data="cateTree"
          :props="{ label: 'name', children: 'children' }"
          node-key="id"
          highlight-current
          @node-click="(n: any) => selectCate(n.id)"
        >
          <template #default="{ node, data }">
            <span class="gs-tree-node" :class="{ active: selectedCateId === data.id }">{{ node.label }}</span>
          </template>
        </el-tree>
      </div>

      <!-- 右侧内容 -->
      <div class="gs-main">
        <div class="gs-search">
          <el-input v-model="keyword" placeholder="商品名称/编码" clearable style="width: 220px" @keyup.enter="search" />
          <el-button type="primary" @click="search">搜索</el-button>
        </div>

        <el-table
          v-loading="loading"
          :data="list"
          border
          stripe
          height="420"
          @selection-change="handleSelect"
        >
          <el-table-column type="selection" width="45" />
          <el-table-column type="index" label="序号" width="55" align="center" />
          <el-table-column prop="goods_sn" label="商品编码" width="120" />
          <el-table-column prop="goods_name" label="商品名称" min-width="150" />
          <el-table-column prop="cate_name" label="商品分类" width="110" />
          <el-table-column prop="unit_name" label="单位" width="70" align="center" />
          <el-table-column prop="stock_num" label="库存数量" width="90" align="right" />
          <el-table-column prop="cost_price" label="采购价" width="90" align="right" />
          <el-table-column prop="sell_price" label="销售价" width="90" align="right" />
        </el-table>

        <div class="gs-footer">
          <el-pagination
            v-model:current-page="page"
            v-model:page-size="pageSize"
            :total="total"
            :page-sizes="[20, 50, 100]"
            layout="total, sizes, prev, pager, next"
            background
            @current-change="loadData"
            @size-change="() => { page = 1; loadData() }"
          />
        </div>
      </div>
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
const selectedCateId = ref<any>(null)
const cateOptions = ref<any[]>([])
const list = ref<any[]>([])
const selected = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
// StockAll 库存 map: goods_id -> qty，打开弹窗时加载一次
const stockQtyMap = ref<Record<number, number>>({})

interface CateNode { id: number; name: string; parent_id: any; children: CateNode[] }
function buildCateTree(source: any[]): CateNode[] {
  const all: CateNode[] = source.map(c => ({ ...c, children: [] }))
  const map: Record<number, CateNode> = {}
  all.forEach(c => { map[c.id] = c })
  const roots: CateNode[] = []
  all.forEach(c => {
    const pid = Number(c.parent_id ?? 0)
    if (pid && map[pid]) map[pid].children.push(c)
    else roots.push(c)
  })
  return roots
}
const cateTree = computed(() => buildCateTree(cateOptions.value))

async function loadCates() {
  try {
    const res: any = await getGoodsCateList({ list_rows: 200 })
    const rows = res?.data?.rows || res?.data?.list || res?.data?.data || []
    cateOptions.value = rows.sort((a: any, b: any) => (a.sort ?? 0) - (b.sort ?? 0))
  } catch {}
}

// 选分类时收集该分类及所有子分类 id
function collectIds(id: number): number[] {
  const result = [id]
  const children = cateOptions.value.filter(c => Number(c.parent_id) === id)
  children.forEach(c => result.push(...collectIds(c.id)))
  return result
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: pageSize.value, keyword: keyword.value }
    if (selectedCateId.value) params.cate_id = selectedCateId.value
    const res: any = await http.get('/goods/ShopGoods/index', { params })
    const data = res?.data || {}
    let rows = data.rows || data.list || []
    if (selectedCateId.value) {
      const ids = collectIds(selectedCateId.value)
      rows = rows.filter((g: any) => ids.includes(Number(g.cate_id)))
    }
    rows = fuzzyFilterGoods(rows, keyword.value)
    // 用 StockAll 表的真实库存覆盖商品表的 stock_num
    rows = rows.map((g: any) => ({
      ...g,
      stock_num: stockQtyMap.value[Number(g.id)] ?? 0
    }))
    list.value = rows
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function selectCate(id: number | null) {
  selectedCateId.value = id
  page.value = 1
  loadData()
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

async function open() {
  visible.value = true
  keyword.value = ''
  selectedCateId.value = null
  page.value = 1
  loadCates()
  // 从 StockAll 表加载真实库存数据
  loading.value = true
  try {
    const res = await http.get('/stock/StockAll/index', { params: { list_rows: 500 } })
    const rows: any[] = res.data?.rows ?? []
    const map: Record<number, number> = {}
    for (const r of rows) {
      const gid = Number(r.goods_id)
      if (gid) map[gid] = (map[gid] || 0) + Number(r.qty || 0)
    }
    stockQtyMap.value = map
  } catch {
    stockQtyMap.value = {}
  }
  loadData()
}

defineExpose({ open })
</script>

<style scoped>
.gs-body {
  display: flex;
  gap: 0;
  height: 540px;
}

/* 左侧分类 */
.gs-cate {
  width: 160px;
  flex-shrink: 0;
  border-right: 1px solid #e4e7ed;
  overflow-y: auto;
  padding: 4px 0;
}
.gs-cate-item {
  padding: 8px 14px;
  font-size: 13px;
  color: #333;
  cursor: pointer;
  border-radius: 0;
  line-height: 1.4;
}
.gs-cate-item:hover,
.gs-cate-item.active {
  background: #ecf5ff;
  color: #409eff;
  font-weight: 500;
}
.gs-tree-node {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
}
.gs-tree-node.active {
  color: #409eff;
  font-weight: 500;
}
:deep(.el-tree-node__content) {
  height: 32px;
}
:deep(.el-tree-node__content:hover) {
  background: #ecf5ff;
}
:deep(.el-tree-node.is-current > .el-tree-node__content) {
  background: #ecf5ff;
  color: #409eff;
}

/* 右侧主区 */
.gs-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  padding-left: 12px;
}
.gs-search {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
  flex-shrink: 0;
}
.gs-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  flex-shrink: 0;
}
</style>
