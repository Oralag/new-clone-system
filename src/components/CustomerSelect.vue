<template>
  <el-dialog v-model="visible" :title="t('customerSelect.title')" width="800px" destroy-on-close>
    <div class="select-search">
      <el-input v-model="keyword" :placeholder="t('customerSelect.searchPlaceholder')" clearable style="width: 220px" @keyup.enter="search" />
      <el-button type="primary" @click="search">{{ t('common.search') }}</el-button>
    </div>

    <el-table v-loading="loading" :data="list" border stripe @row-click="rowClick">
      <el-table-column prop="nickname" :label="t('customerSelect.customerName')" min-width="150" />
      <el-table-column prop="mobile" :label="t('customerSelect.mobile')" width="130" />
      <el-table-column prop="address" :label="t('customerSelect.address')" min-width="200" />
      <el-table-column prop="level_name" :label="t('customerSelect.customerLevel')" width="100" />
      <el-table-column :label="t('common.operation')" width="80">
        <template #default="{ row }">
          <el-button type="primary" size="small" link @click="selectRow(row)">{{ t('common.select') }}</el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="dialog-pagination">
      <el-pagination
        v-model:current-page="page"
        :total="total"
        layout="total, prev, pager, next"
        background
        @current-change="loadData"
      />
    </div>
  </el-dialog>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const { t } = useI18n()

const emit = defineEmits<{
  (e: 'confirm', val: any): void
}>()

const visible = ref(false)
const loading = ref(false)
const keyword = ref('')
const list = ref<any[]>([])
const page = ref(1)
const total = ref(0)

async function loadData() {
  loading.value = true
  try {
    const res: any = await http.get('/shop.ShopCustomer/index', {
      params: { page: page.value, list_rows: 20, keyword: keyword.value },
    })
    const data = res?.data || {}
    list.value = data.rows || []
    total.value = data.total || 0
  } finally {
    loading.value = false
  }
}

function search() { page.value = 1; loadData() }
function rowClick(row: any) { selectRow(row) }
function selectRow(row: any) { emit('confirm', row); visible.value = false }

function open() { visible.value = true; loadData() }
defineExpose({ open })
</script>

<style scoped>
.select-search { display: flex; gap: 8px; margin-bottom: 12px; }
.dialog-pagination { display: flex; justify-content: flex-end; margin-top: 12px; }
</style>
