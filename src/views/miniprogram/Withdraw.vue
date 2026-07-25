<template>
  <div class="page-container">
    <div class="page-header">
      <h2>分销提现审批</h2>
      <div class="tab-bar">
        <el-radio-group v-model="activeTab" @change="onTabChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="0">待审核</el-radio-button>
          <el-radio-button label="1">处理中</el-radio-button>
          <el-radio-button label="2">已打款</el-radio-button>
          <el-radio-button label="3">已拒绝</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border style="width:100%">
      <el-table-column label="申请单号" prop="id" width="90" />
      <el-table-column label="分销商" min-width="150">
        <template #default="{ row }">
          <div>
            <strong>{{ row.distributor_name || '—' }}</strong>
            <div class="sub">{{ row.distributor_code }} · {{ row.distributor_phone || '' }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="提现金额" width="120" align="right">
        <template #default="{ row }">
          <span class="amount">¥{{ Number(row.amount || 0).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收款账户" min-width="240">
        <template #default="{ row }">
          <div>
            <div>{{ row.bank_name }} · {{ row.holder_name_snapshot }}</div>
            <div class="sub monospace">{{ maskCard(row.card_no_snapshot) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="状态" width="100" align="center">
        <template #default="{ row }">
          <el-tag :type="statusType(row.status)" size="small">{{ statusText(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="申请时间" width="160">
        <template #default="{ row }">{{ formatTime(row.created_at) }}</template>
      </el-table-column>
      <el-table-column label="处理时间" width="160">
        <template #default="{ row }">{{ row.handled_at ? formatTime(row.handled_at) : '—' }}</template>
      </el-table-column>
      <el-table-column label="备注" min-width="180" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.status === 3" class="danger">拒绝：{{ row.reject_reason || '—' }}</span>
          <span v-else-if="row.status === 2" class="success">打款单号：{{ row.transfer_no || '—' }}</span>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="220" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0 || row.status === 1">
            <el-button size="small" type="success" @click="openApprove(row)">通过并打款</el-button>
            <el-button size="small" type="danger" @click="openReject(row)">拒绝</el-button>
          </template>
          <span v-else class="sub">—</span>
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

    <el-dialog v-model="approveVisible" title="确认打款" width="400px">
      <el-form label-width="90px">
        <el-form-item label="分销商">{{ approveRow?.distributor_name }}</el-form-item>
        <el-form-item label="提现金额">
          <span class="amount">¥{{ Number(approveRow?.amount || 0).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="收款账户">
          <div>
            <div>{{ approveRow?.bank_name }} · {{ approveRow?.holder_name_snapshot }}</div>
            <div class="sub monospace">{{ approveRow?.card_no_snapshot }}</div>
          </div>
        </el-form-item>
        <el-form-item label="打款单号">
          <el-input v-model="transferNo" placeholder="选填，银行流水号 / 转账凭证号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="approveVisible = false">取消</el-button>
        <el-button type="primary" :loading="acting" @click="handleApprove">确认已打款</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="rejectVisible" title="拒绝提现" width="400px">
      <el-form label-width="90px">
        <el-form-item label="分销商">{{ rejectRow?.distributor_name }}</el-form-item>
        <el-form-item label="提现金额">
          <span class="amount">¥{{ Number(rejectRow?.amount || 0).toFixed(2) }}</span>
        </el-form-item>
        <el-form-item label="拒绝原因" required>
          <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="将展示给分销商" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="danger" :loading="acting" @click="handleReject">确认拒绝</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import http from '@/api/http'

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const activeTab = ref('')

const approveVisible = ref(false)
const approveRow = ref<any>(null)
const transferNo = ref('')

const rejectVisible = ref(false)
const rejectRow = ref<any>(null)
const rejectReason = ref('')

const acting = ref(false)

function statusText(s: number) {
  return ({ 0: '待审核', 1: '处理中', 2: '已打款', 3: '已拒绝' } as any)[s] || '—'
}
function statusType(s: number): any {
  return ({ 0: 'warning', 1: 'primary', 2: 'success', 3: 'danger' } as any)[s] || 'info'
}
function maskCard(no: string) {
  if (!no) return '—'
  return no.length > 8 ? `${no.slice(0, 4)} **** **** ${no.slice(-4)}` : no
}
function formatTime(v: string) {
  if (!v) return '—'
  return v.replace('T', ' ').slice(0, 16)
}

function onTabChange() {
  page.value = 1
  loadList()
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { page: page.value, list_rows: 20 }
    if (activeTab.value !== '') params.status = activeTab.value
    const res = await http.get('/distributor/withdraw/list', { params })
    list.value = res.data?.rows ?? []
    total.value = res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function openApprove(row: any) {
  approveRow.value = row
  transferNo.value = ''
  approveVisible.value = true
}

async function handleApprove() {
  acting.value = true
  try {
    await http.post('/distributor/withdraw/approve', {
      id: approveRow.value.id,
      transfer_no: transferNo.value,
    })
    ElMessage.success('已确认打款')
    approveVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  } finally {
    acting.value = false
  }
}

function openReject(row: any) {
  rejectRow.value = row
  rejectReason.value = ''
  rejectVisible.value = true
}

async function handleReject() {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请填写拒绝原因')
    return
  }
  acting.value = true
  try {
    await http.post('/distributor/withdraw/reject', {
      id: rejectRow.value.id,
      reason: rejectReason.value,
    })
    ElMessage.success('已拒绝')
    rejectVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
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
.sub { color: #909399; font-size: 12px; margin-top: 2px; }
.monospace { font-family: monospace; }
.amount { color: #c44b0a; font-weight: 600; }
.danger { color: #f56c6c; }
.success { color: #67c23a; }
</style>
