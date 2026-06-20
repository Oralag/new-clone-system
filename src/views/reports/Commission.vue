<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:15px;font-weight:600">{{ $t('reports.commission.title') }}</span>
          <el-button link type="primary" @click="router.push('/sale/commission-setting')">{{ $t('reports.commission.commissionSetting') }}</el-button>
        </div>
      </template>

      <el-form inline style="margin-bottom:12px">
        <el-form-item :label="$t('reports.commission.filterStaff')">
          <el-select v-model="filterStaff" :placeholder="$t('reports.commission.allStaff')" clearable style="width:150px">
            <el-option v-for="s in staffInContracts" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('reports.commission.dateRange')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('reports.commission.rangeSeparator')"
            :start-placeholder="$t('reports.commission.startDate')"
            :end-placeholder="$t('reports.commission.endDate')"
            value-format="YYYY-MM-DD"
            style="width:240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadContracts">{{ $t('reports.commission.query') }}</el-button>
          <el-button @click="onReset">{{ $t('reports.commission.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reportRows" border stripe v-loading="loading" style="width:100%">
        <el-table-column type="index" :label="$t('reports.commission.index')" width="60" align="center" />
        <el-table-column prop="staffName" :label="$t('reports.commission.staffName')" min-width="120" />
        <el-table-column prop="orderCount" :label="$t('reports.commission.orderCount')" width="90" align="center" />
        <el-table-column :label="$t('reports.commission.saleAmount')" width="130" align="right">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:500">¥{{ row.saleAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.commission.commissionRate')" width="100" align="center">
          <template #default="{ row }">
            {{ row.commissionRate }}%
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.commission.commissionAmount')" width="130" align="right">
          <template #default="{ row }">
            <span style="color:#16a34a;font-weight:600">¥{{ row.commissionAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="reportRows.length === 0 && !loading"
        style="text-align:center;color:rgba(29,29,31,0.35);padding:40px 0;font-size:14px">
        {{ $t('reports.commission.emptyHint') }}
      </div>

      <!-- Summary row -->
      <div v-if="reportRows.length > 0" class="summary-bar">
        <span>{{ $t('reports.commission.staffCount', { n: reportRows.length }) }}</span>
        <span>{{ $t('reports.commission.totalSale') }}<b style="color:#0071e3">¥{{ totalSale.toFixed(2) }}</b></span>
        <span>{{ $t('reports.commission.totalCommission') }}<b style="color:#16a34a">¥{{ totalCommission.toFixed(2) }}</b></span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { getContractList } from '@/api/sale'
import { getStaffList } from '@/api/personnel'
import { loadCommissionRates } from '@/utils/commission'

const { t: _t } = useI18n()
const router = useRouter()

const loading = ref(false)
const allContracts = ref<any[]>([])
const filterStaff = ref<any>(null)
const dateRange = ref<[string, string] | null>(null)
const staffList = ref<any[]>([])

async function loadContracts() {
  loading.value = true
  try {
    const params: any = { list_rows: 999 }
    if (dateRange.value) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
    const res = await getContractList(params)
    allContracts.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ } finally {
    loading.value = false
  }
}

onMounted(async () => {
  loadContracts()
  const res = await getStaffList({ list_rows: 200 })
  staffList.value = res.data?.rows ?? []
})

const staffInContracts = computed(() => {
  const map = new Map<number, string>()
  for (const s of staffList.value) map.set(s.id, s.name)
  for (const c of allContracts.value) {
    if (c.admin_id && c.admin_name && !map.has(c.admin_id)) map.set(c.admin_id, c.admin_name)
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const reportRows = computed(() => {
  const rates = loadCommissionRates()
  const rateMap = new Map(rates.map(r => [r.staffId, r]))

  const groups = new Map<number, { staffName: string; saleAmount: number; orderCount: number }>()

  for (const c of allContracts.value) {
    if (!c.admin_id) continue
    if (filterStaff.value && c.admin_id !== filterStaff.value) continue
    if (!groups.has(c.admin_id)) {
      groups.set(c.admin_id, { staffName: c.admin_name ?? '', saleAmount: 0, orderCount: 0 })
    }
    const g = groups.get(c.admin_id)!
    g.saleAmount += Number(c.total_amount || 0)
    g.orderCount += 1
  }

  return Array.from(groups.entries()).map(([staffId, g]) => {
    const rate = rateMap.get(staffId)?.rate ?? 0
    return {
      staffId,
      staffName: g.staffName,
      orderCount: g.orderCount,
      saleAmount: g.saleAmount,
      commissionRate: rate,
      commissionAmount: g.saleAmount * rate / 100,
    }
  })
})

const totalSale = computed(() => reportRows.value.reduce((s, r) => s + r.saleAmount, 0))
const totalCommission = computed(() => reportRows.value.reduce((s, r) => s + r.commissionAmount, 0))

function onReset() {
  filterStaff.value = null
  dateRange.value = null
  loadContracts()
}
</script>

<style scoped>
.page-container { height: 100%; }
.summary-bar {
  display: flex;
  gap: 32px;
  padding: 12px 4px 4px;
  font-size: 14px;
  color: rgba(29,29,31,0.5);
}
</style>
