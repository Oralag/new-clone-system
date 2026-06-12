<template>
  <div class="page-container">
    <div class="page-header">
      <h2>分销商管理</h2>
      <div class="tab-bar">
        <el-radio-group v-model="activeTab" @change="loadList">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="0">待审核</el-radio-button>
          <el-radio-button label="1">已通过</el-radio-button>
          <el-radio-button label="2">已拒绝</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border style="width:100%">
      <el-table-column label="申请人" prop="name" width="120" />
      <el-table-column label="手机号" prop="phone" width="130" />
      <el-table-column label="申请理由" prop="apply_reason" min-width="160" show-overflow-tooltip />
      <el-table-column label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
            {{ STATUS_TEXT[row.status] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="专属码" prop="code" width="100">
        <template #default="{ row }">
          <span style="font-family:monospace;font-weight:600">{{ row.code || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="佣金比例" width="100">
        <template #default="{ row }">
          <span v-if="row.status === 1">{{ row.commission_rate }}%</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="推广订单" width="90" align="center">
        <template #default="{ row }">{{ row.order_count || 0 }}</template>
      </el-table-column>
      <el-table-column label="累计佣金" width="110" align="right">
        <template #default="{ row }">
          <span v-if="row.status === 1" style="color:#c44b0a;font-weight:600">
            ¥{{ Number(row.total_commission || 0).toFixed(2) }}
          </span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="120">
        <template #default="{ row }">{{ row.created_at?.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column label="操作" width="200" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="success" @click="openApprove(row)">通过</el-button>
            <el-button size="small" type="danger" @click="handleReject(row)">拒绝</el-button>
          </template>
          <template v-else-if="row.status === 1">
            <el-button size="small" @click="openEditRate(row)">改佣金</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination">
      <el-pagination
        v-model:current-page="page"
        :page-size="20"
        :total="total"
        layout="total, prev, pager, next"
        @current-change="loadList"
      />
    </div>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approveVisible" title="通过申请" width="360px">
      <el-form label-width="80px">
        <el-form-item label="申请人">{{ approveRow?.name }}</el-form-item>
        <el-form-item label="佣金比例">
          <span style="color:#666;font-size:13px">按「分销商」等级设置自动继承，可在客户等级页调整</span>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="approveNote" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="handleApprove">确认通过</el-button>
      </template>
    </el-dialog>

    <!-- 改佣金弹窗 -->
    <el-dialog v-model="editRateVisible" title="修改佣金比例" width="320px">
      <el-form label-width="80px">
        <el-form-item label="分销商">{{ editRow?.name }}（{{ editRow?.code }}）</el-form-item>
        <el-form-item label="佣金比例">
          <el-input-number v-model="editRate" :min="1" :max="50" :precision="1" controls-position="right" />
          <span style="margin-left:8px">%</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editRateVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="handleEditRate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

const STATUS_TEXT: Record<number, string> = { 0: '待审核', 1: '已通过', 2: '已拒绝' }

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const activeTab = ref('')

const approveVisible = ref(false)
const approveRow = ref<any>(null)
const approveRate = ref(10)
const approveNote = ref('')
const acting = ref(false)

const editRateVisible = ref(false)
const editRow = ref<any>(null)
const editRate = ref(10)

async function loadList() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: 20 }
    if (activeTab.value !== '') params.status = activeTab.value
    const res = await http.get('/distributor/list', { params })
    list.value = res.data?.rows ?? []
    total.value = res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function openApprove(row: any) {
  approveRow.value = row
  approveRate.value = 10
  approveNote.value = ''
  approveVisible.value = true
}

async function handleApprove() {
  acting.value = true
  try {
    const res = await http.post('/distributor/approve', {
      id: approveRow.value.id,
      note: approveNote.value,
    })
    ElMessage.success(`已通过，专属码：${res.data?.code}`)
    approveVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    acting.value = false
  }
}

async function handleReject(row: any) {
  try {
    await ElMessageBox.prompt('拒绝理由（可选）', '确认拒绝', { confirmButtonText: '确认拒绝', cancelButtonText: '取消', inputPlaceholder: '填写原因' })
  } catch { return }
  try {
    await http.post('/distributor/reject', { id: row.id })
    ElMessage.success('已拒绝')
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  }
}

function openEditRate(row: any) {
  editRow.value = row
  editRate.value = Number(row.commission_rate)
  editRateVisible.value = true
}

async function handleEditRate() {
  acting.value = true
  try {
    await http.post('/distributor/edit', { id: editRow.value.id, commission_rate: editRate.value })
    ElMessage.success('已更新')
    editRateVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? '操作失败')
  } finally {
    acting.value = false
  }
}

onMounted(loadList)
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
