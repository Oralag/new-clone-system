<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:15px;font-weight:600">提成报表</span>
          <el-button link type="primary" @click="router.push('/sale/commission-setting')">提成设置</el-button>
        </div>
      </template>

      <el-form inline style="margin-bottom:12px">
        <el-form-item label="员工">
          <el-select v-model="filterStaff" placeholder="全部员工" clearable style="width:150px">
            <el-option v-for="s in staffInContracts" :key="s.id" :label="s.name" :value="s.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            style="width:240px"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="loadContracts">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="reportRows" border stripe v-loading="loading" style="width:100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="staffName" label="员工姓名" min-width="120" />
        <el-table-column prop="orderCount" label="合同数" width="90" align="center" />
        <el-table-column label="销售金额" width="130" align="right">
          <template #default="{ row }">
            <span style="color:#165dff;font-weight:500">¥{{ row.saleAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="提成比例" width="100" align="center">
          <template #default="{ row }">
            {{ row.commissionRate }}%
          </template>
        </el-table-column>
        <el-table-column label="提成金额" width="130" align="right">
          <template #default="{ row }">
            <span style="color:#00b42a;font-weight:600">¥{{ row.commissionAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="reportRows.length === 0 && !loading"
        style="text-align:center;color:#86909c;padding:40px 0;font-size:14px">
        暂无提成数据。请先在「提成设置」中配置员工提成比例，并在销售合同中选择经办人。
      </div>

      <!-- 汇总行 -->
      <div v-if="reportRows.length > 0" class="summary-bar">
        <span>共 <b>{{ reportRows.length }}</b> 名员工</span>
        <span>总销售额：<b style="color:#165dff">¥{{ totalSale.toFixed(2) }}</b></span>
        <span>总提成：<b style="color:#00b42a">¥{{ totalCommission.toFixed(2) }}</b></span>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getContractList } from '@/api/sale'
import { loadCommissionRates } from '@/utils/commission'

const router = useRouter()

const loading = ref(false)
const allContracts = ref<any[]>([])
const filterStaff = ref<any>(null)
const dateRange = ref<[string, string] | null>(null)

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

onMounted(loadContracts)

// 合同里出现过的经办人（有 admin_id 的）
const staffInContracts = computed(() => {
  const map = new Map<number, string>()
  for (const c of allContracts.value) {
    if (c.admin_id && c.admin_name) map.set(c.admin_id, c.admin_name)
  }
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const reportRows = computed(() => {
  const rates = loadCommissionRates()
  const rateMap = new Map(rates.map(r => [r.staffId, r]))

  // 按 admin_id 聚合
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
  color: #4e5969;
}
</style>
