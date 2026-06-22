<template>
  <div class="page-container">
    <div class="page-header">
      <h2>{{ t('miniprogramRefund.title') }}</h2>
      <div class="tab-bar">
        <el-radio-group v-model="activeTab" @change="loadList">
          <el-radio-button label="">{{ t('miniprogramRefund.all') }}</el-radio-button>
          <el-radio-button label="0">{{ t('miniprogramRefund.pending') }}</el-radio-button>
          <el-radio-button label="1">{{ t('miniprogramRefund.approved') }}</el-radio-button>
          <el-radio-button label="2">{{ t('miniprogramRefund.rejected') }}</el-radio-button>
        </el-radio-group>
      </div>
    </div>

    <el-table :data="list" v-loading="loading" border style="width:100%">
      <el-table-column :label="t('miniprogramRefund.orderNo')" prop="order_no" width="160" />
      <el-table-column :label="t('miniprogramRefund.user')" prop="user_name" width="100" />
      <el-table-column :label="t('miniprogramRefund.phone')" prop="user_phone" width="130" />
      <el-table-column :label="t('miniprogramRefund.reason')" prop="reason" min-width="160" show-overflow-tooltip />
      <el-table-column :label="t('miniprogramRefund.amount')" width="100" align="right">
        <template #default="{ row }">
          <span style="color:#c44b0a;font-weight:600">¥{{ Number(row.amount).toFixed(2) }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramRefund.status')" width="90">
        <template #default="{ row }">
          <el-tag :type="row.status === 1 ? 'success' : row.status === 2 ? 'danger' : 'warning'" size="small">
            {{ statusText(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramRefund.proof')" width="100">
        <template #default="{ row }">
          <template v-if="row.images">
            <el-button size="small" @click="previewImages(row.images)">{{ t('miniprogramRefund.viewImages') }}</el-button>
          </template>
          <span v-else style="color:#ccc">{{ t('miniprogramRefund.none') }}</span>
        </template>
      </el-table-column>
      <el-table-column :label="t('miniprogramRefund.createdAt')" width="120">
        <template #default="{ row }">{{ row.created_at?.slice(0, 10) }}</template>
      </el-table-column>
      <el-table-column :label="t('miniprogramRefund.actions')" width="180" fixed="right">
        <template #default="{ row }">
          <template v-if="row.status === 0">
            <el-button size="small" type="success" @click="openHandle(row, 'approve')">{{ t('miniprogramRefund.approve') }}</el-button>
            <el-button size="small" type="danger" @click="openHandle(row, 'reject')">{{ t('miniprogramRefund.reject') }}</el-button>
          </template>
          <span v-else style="color:#999;font-size:12px">{{ row.note || '—' }}</span>
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

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleVisible" :title="handleAction === 'approve' ? t('miniprogramRefund.approveTitle') : t('miniprogramRefund.rejectTitle')" width="380px">
      <el-form label-width="80px">
        <el-form-item :label="t('miniprogramRefund.order')">{{ handleRow?.order_no }}</el-form-item>
        <el-form-item :label="t('miniprogramRefund.amount')">¥{{ Number(handleRow?.amount || 0).toFixed(2) }}</el-form-item>
        <el-form-item :label="t('miniprogramRefund.remark')">
          <el-input v-model="handleNote" :placeholder="handleAction === 'approve' ? t('miniprogramRefund.approvePlaceholder') : t('miniprogramRefund.rejectPlaceholder')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">{{ t('miniprogramRefund.cancel') }}</el-button>
        <el-button :type="handleAction === 'approve' ? 'success' : 'danger'" :loading="acting" @click="submitHandle">
          {{ handleAction === 'approve' ? t('miniprogramRefund.confirmApprove') : t('miniprogramRefund.confirmReject') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 图片预览弹窗 -->
    <el-dialog v-model="imgVisible" :title="t('miniprogramRefund.imageTitle')" width="500px">
      <div style="display:flex;flex-wrap:wrap;gap:8px;">
        <el-image
          v-for="(url, i) in previewImgs"
          :key="i"
          :src="url"
          style="width:150px;height:150px;object-fit:cover;"
          :preview-src-list="previewImgs"
          :initial-index="i"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useI18n } from 'vue-i18n'
import http from '@/api/http'

const { t } = useI18n()

function statusText(status: number) {
  if (status === 1) return t('miniprogramRefund.statusApproved')
  if (status === 2) return t('miniprogramRefund.statusRejected')
  return t('miniprogramRefund.statusPending')
}

const list = ref<any[]>([])
const loading = ref(false)
const total = ref(0)
const page = ref(1)
const activeTab = ref('')

const handleVisible = ref(false)
const handleRow = ref<any>(null)
const handleAction = ref<'approve' | 'reject'>('approve')
const handleNote = ref('')
const acting = ref(false)

const imgVisible = ref(false)
const previewImgs = ref<string[]>([])

async function loadList() {
  loading.value = true
  try {
    const params: any = { page: page.value }
    if (activeTab.value !== '') params.status = activeTab.value
    const res = await http.get('/refund/list', { params })
    list.value = res.data?.rows ?? []
    total.value = res.data?.total ?? 0
  } finally {
    loading.value = false
  }
}

function openHandle(row: any, action: 'approve' | 'reject') {
  handleRow.value = row
  handleAction.value = action
  handleNote.value = ''
  handleVisible.value = true
}

async function submitHandle() {
  acting.value = true
  try {
    const res = await http.post('/refund/handle', {
      id: handleRow.value.id,
      action: handleAction.value,
      note: handleNote.value,
    })
    ElMessage.success(res.data?.message || t('miniprogramRefund.operationSuccess'))
    handleVisible.value = false
    loadList()
  } catch (e: any) {
    ElMessage.error(e?.message ?? t('miniprogramRefund.operationFailed'))
  } finally {
    acting.value = false
  }
}

function previewImages(images: string) {
  previewImgs.value = images.split(',').filter(Boolean)
  imgVisible.value = true
}

onMounted(loadList)
</script>

<style scoped>
.page-container { padding: 20px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header h2 { margin: 0; font-size: 20px; }
.pagination { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
