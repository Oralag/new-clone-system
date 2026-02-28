<template>
  <div class="sc-table">
    <!-- Search bar -->
    <div v-if="$slots.search" class="sc-search">
      <slot name="search" />
      <div class="search-actions">
        <el-button type="primary" :icon="Search" @click="handleSearch">查询</el-button>
        <el-button :icon="Refresh" @click="handleReset">重置</el-button>
      </div>
    </div>

    <!-- Toolbar -->
    <div class="sc-toolbar">
      <div class="toolbar-left">
        <slot name="toolbar" />
      </div>
      <div class="toolbar-right">
        <el-tooltip content="刷新">
          <el-button :icon="Refresh" circle size="small" @click="refresh" />
        </el-tooltip>
      </div>
    </div>

    <!-- Table -->
    <el-table
      v-loading="loading"
      :data="tableData"
      v-bind="$attrs"
      border
      stripe
      style="width: 100%"
      @selection-change="handleSelectionChange"
    >
      <slot />
    </el-table>

    <!-- Pagination -->
    <div v-if="total > 0" class="sc-pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="total"
        :page-sizes="[20, 50, 100, 200]"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Search, Refresh } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface Props {
  apiObj: (params: any) => Promise<any>
  params?: Record<string, any>
  defaultPageSize?: number
  rowFilter?: (row: any) => boolean
}

const props = withDefaults(defineProps<Props>(), {
  params: () => ({}),
  defaultPageSize: 20,
})

const emit = defineEmits<{
  (e: 'selection-change', val: any[]): void
}>()

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const searchParams = ref<Record<string, any>>({})

async function loadData() {
  loading.value = true
  try {
    // 过滤掉空字符串/null/undefined，避免后端路由报错
    const cleanParams = (obj: Record<string, any>) =>
      Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== '' && v !== null && v !== undefined))

    const res: any = await props.apiObj({
      page: currentPage.value,
      list_rows: pageSize.value,
      ...cleanParams(props.params),
      ...cleanParams(searchParams.value),
    })
    const data = res?.data || res
    if (Array.isArray(data)) {
      tableData.value = props.rowFilter ? data.filter(props.rowFilter) : data
      total.value = tableData.value.length
    } else {
      const rows = data?.rows || data?.list || data?.data || []
      tableData.value = props.rowFilter ? rows.filter(props.rowFilter) : rows
      total.value = data?.total || 0
    }
  } catch (e) {
    // Error handled by interceptor
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  currentPage.value = 1
  loadData()
}

function handleReset() {
  searchParams.value = {}
  currentPage.value = 1
  loadData()
}

function handleSizeChange() {
  currentPage.value = 1
  loadData()
}

function handleCurrentChange() {
  loadData()
}

function refresh() {
  loadData()
}

function handleSelectionChange(val: any[]) {
  emit('selection-change', val)
}

// Expose for parent use
defineExpose({ refresh, loadData, tableData, searchParams })

onMounted(() => {
  loadData()
})

// Re-fetch when external params change
watch(
  () => props.params,
  () => {
    currentPage.value = 1
    loadData()
  },
  { deep: true },
)
</script>

<style scoped>
.sc-table {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
}

.sc-search {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f2f3f5;
  margin-bottom: 12px;
}

.search-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.sc-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar-left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.sc-pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
