<template>
  <div class="commission-setting-page">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:15px;font-weight:600">提成设置</span>
          <el-button type="primary" :icon="Plus" @click="openAddDialog">添加员工提成</el-button>
        </div>
      </template>

      <el-table :data="rateRows" border stripe style="width:100%">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column prop="staffName" label="员工姓名" min-width="140" />
        <el-table-column label="提成比例（%）" width="160" align="center">
          <template #default="{ row }">
            <el-input-number
              v-model="row.rate"
              :min="0"
              :max="100"
              :precision="2"
              size="small"
              controls-position="right"
              style="width:110px"
              @change="saveRate(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ row }">
            <el-button type="danger" link size="small" @click="handleRemove(row.staffId)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="rateRows.length === 0" style="text-align:center;color:#86909c;padding:40px 0;font-size:14px">
        暂无提成设置，点击右上角「添加员工提成」开始配置
      </div>
    </el-card>

    <!-- 添加员工弹框 -->
    <el-dialog v-model="addVisible" title="添加员工提成" width="380px" append-to-body>
      <el-form :model="addForm" label-width="90px">
        <el-form-item label="选择员工" required>
          <el-select v-model="addForm.staffId" placeholder="请选择员工" filterable style="width:100%"
            @change="onStaffSelect">
            <el-option
              v-for="s in availableStaff"
              :key="s.id"
              :label="s.name"
              :value="s.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="提成比例（%）" required>
          <el-input-number v-model="addForm.rate" :min="0" :max="100" :precision="2"
            style="width:100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAdd">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getStaffList } from '@/api/personnel'
import { loadCommissionRates, saveCommissionRates, type CommissionRate } from '@/utils/commission'

const rateRows = ref<CommissionRate[]>(loadCommissionRates())
const staffOptions = ref<any[]>([])

async function loadStaff() {
  try {
    const res = await getStaffList({ list_rows: 200 })
    staffOptions.value = res.data?.rows ?? res.data?.list ?? []
  } catch { /* ignore */ }
}

onMounted(loadStaff)

// 只显示尚未添加过的员工
const availableStaff = computed(() => {
  const existingIds = new Set(rateRows.value.map(r => r.staffId))
  return staffOptions.value.filter(s => !existingIds.has(s.id))
})

function saveRate(row: CommissionRate) {
  saveCommissionRates(rateRows.value)
}

function handleRemove(staffId: number) {
  ElMessageBox.confirm('确定删除该员工的提成设置？', '提示', { type: 'warning' }).then(() => {
    rateRows.value = rateRows.value.filter(r => r.staffId !== staffId)
    saveCommissionRates(rateRows.value)
    ElMessage.success('已删除')
  })
}

// ── 添加员工 ──────────────────────────────────────────────────────────────────
const addVisible = ref(false)
const addForm = ref({ staffId: null as any, staffName: '', rate: 5 })

function openAddDialog() {
  addForm.value = { staffId: null, staffName: '', rate: 5 }
  addVisible.value = true
}

function onStaffSelect(id: any) {
  const s = staffOptions.value.find(x => x.id === id)
  addForm.value.staffName = s?.name ?? ''
}

function confirmAdd() {
  if (!addForm.value.staffId) { ElMessage.warning('请选择员工'); return }
  rateRows.value.push({
    staffId: addForm.value.staffId,
    staffName: addForm.value.staffName,
    rate: addForm.value.rate,
  })
  saveCommissionRates(rateRows.value)
  addVisible.value = false
  ElMessage.success('添加成功')
}
</script>

<style scoped>
.commission-setting-page { height: 100%; }
</style>
