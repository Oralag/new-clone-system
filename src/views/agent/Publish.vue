<template>
  <div class="publish-page">
    <div class="page-title">发布管理</div>

    <!-- 账号未连接提示 -->
    <el-alert v-if="!accountConnected" type="warning" :closable="false" show-icon style="margin-bottom:8px">
      <template #title>
        账号未连接：请先在"账号设置"中绑定平台账号，才能发布内容。
        <el-button link type="primary" size="small" @click="goAccountSetting">去设置</el-button>
      </template>
    </el-alert>

    <!-- Filters -->
    <div class="filter-row">
      <div class="tabs-row">
        <button
          v-for="p in ['全部', ...platformOptions]"
          :key="p"
          class="tab"
          :class="{ active: filterPlatform === p }"
          @click="filterPlatform = p"
        >{{ p }}</button>
      </div>
      <div class="tabs-row">
        <button
          v-for="s in ['全部', '草稿', '待发布', '已发布']"
          :key="s"
          class="tab"
          :class="{ active: filterStatus === s }"
          @click="filterStatus = s"
        >{{ s }}</button>
      </div>
    </div>

    <!-- List -->
    <div class="card">
      <div v-if="filtered.length === 0" class="empty-state">
        <div class="empty-icon">📤</div>
        <div class="empty-text">暂无发布内容</div>
        <div class="empty-sub">在文案生成或视频脚本页面创建内容后，将在此管理发布</div>
      </div>
      <div v-else class="publish-list">
        <div v-for="(item, idx) in filtered" :key="idx" class="content-card" :class="'card-type-' + item.type">
          <!-- 卡片头部 -->
          <div class="card-head">
            <span class="platform-tag">{{ item.platformName }}</span>
            <span class="type-badge" :class="'type-' + item.type">{{ typeLabel(item.type) }}</span>
            <span class="card-topic">{{ item.topic }}</span>
            <div style="margin-left:auto;display:flex;align-items:center;gap:8px">
              <span class="status-badge" :class="statusClass(item.status || '草稿')">
                {{ item.status || '草稿' }}
              </span>
              <!-- 视频生成中状态 -->
              <span v-if="item.type === 'video_script' && item.videoStatus === 'generating'" class="video-status generating">
                <el-icon class="is-loading"><Loading /></el-icon> 视频生成中...
              </span>
              <span v-else-if="item.type === 'video_script' && item.videoStatus === 'done'" class="video-status done">
                视频已就绪
              </span>
              <!-- 配图生成中 -->
              <span v-if="item.type === 'poster' && item.imageStatus === 'generating'" class="video-status generating">
                <el-icon class="is-loading"><Loading /></el-icon> 配图生成中...
              </span>
              <span v-else-if="item.type === 'poster' && item.imageStatus === 'done'" class="video-status done">
                配图已就绪
              </span>
            </div>
          </div>

          <!-- 内容区域 -->
          <div class="card-body">
            <template v-if="item.editing">
              <el-input
                v-model="item.content"
                type="textarea"
                :rows="6"
                resize="none"
                style="width:100%"
              />
              <div class="edit-actions">
                <el-button size="small" @click="cancelEdit(item)">取消</el-button>
                <el-button size="small" type="primary" @click="saveEdit(item)">保存</el-button>
              </div>
            </template>
            <div v-else class="content-preview" @dblclick="startEdit(item)">{{ item.content }}</div>
          </div>

          <!-- 卡片底部 -->
          <div class="card-foot">
            <!-- 视频状态轮询刷新按钮 -->
            <el-button
              v-if="item.type === 'video_script' && item.videoStatus === 'generating'"
              size="small" link type="primary"
              @click="refreshVideoStatus(item)"
            >刷新状态</el-button>

            <!-- 发布时间选择 -->
            <div v-if="item.status !== '已发布'" class="publish-time-row">
              <el-radio-group v-model="item.publishMode" size="small">
                <el-radio-button label="now">立即发布</el-radio-button>
                <el-radio-button label="custom">定时发布</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-if="item.publishMode === 'custom'"
                v-model="item.scheduledTime"
                type="datetime"
                placeholder="选择发布时间"
                size="small"
                style="width:200px;margin-left:8px"
              />
            </div>

            <div style="margin-left:auto;display:flex;gap:6px">
              <el-button
                v-if="!item.editing && item.status !== '已发布'"
                size="small"
                @click="startEdit(item)"
              >编辑</el-button>
              <el-button
                size="small"
                :type="item.status === '已发布' ? 'success' : 'primary'"
                :disabled="item.status === '已发布'"
                @click="doPublish(idx)"
              >
                {{ item.status === '已发布' ? '已发布' : item.status === '待发布' ? '确认发布' : '标记发布' }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Loading } from '@element-plus/icons-vue'
import { useTrendingStore } from '@/stores/agent'

const agentStore = useTrendingStore()
const router = useRouter()

const filterPlatform = ref('全部')
const filterStatus = ref('全部')

const platformOptions = ['抖音', '小红书', '快手', '微博']

// 模拟账号是否连接（实际项目中应从 store 或 API 获取）
const accountConnected = ref(true)

function goAccountSetting() {
  router.push('/agent/account')
}

interface PublishItem {
  platform: string
  platformName: string
  topic: string
  type: string
  content: string
  status?: string
  editing?: boolean
  originalContent?: string
  videoStatus?: 'idle' | 'generating' | 'done'
  imageStatus?: 'idle' | 'generating' | 'done'
  publishMode?: 'now' | 'custom'
  scheduledTime?: string
}

const localItems = ref<PublishItem[]>(
  agentStore.flowResults.map(r => ({
    ...r,
    status: '草稿',
    editing: false,
    originalContent: r.content,
    videoStatus: r.type === 'video_script' ? 'generating' : undefined,
    imageStatus: r.type === 'poster' ? 'generating' : undefined,
    publishMode: 'now',
    scheduledTime: '',
  }))
)

const filtered = computed(() => {
  return localItems.value.filter(item => {
    const matchPlatform = filterPlatform.value === '全部' || item.platformName === filterPlatform.value
    const matchStatus = filterStatus.value === '全部' || (item.status || '草稿') === filterStatus.value
    return matchPlatform && matchStatus
  })
})

function typeLabel(type: string) {
  const map: Record<string, string> = { video_script: '视频脚本', poster: '图文海报', copy: '文案' }
  return map[type] || type
}

function statusClass(status: string) {
  const map: Record<string, string> = { '草稿': 'status-draft', '待发布': 'status-pending', '已发布': 'status-done' }
  return map[status] || 'status-draft'
}

function startEdit(item: PublishItem) {
  if (item.status === '已发布') return
  item.originalContent = item.content
  item.editing = true
}

function cancelEdit(item: PublishItem) {
  item.content = item.originalContent || item.content
  item.editing = false
}

function saveEdit(item: PublishItem) {
  item.editing = false
  ElMessage.success('内容已保存')
}

function refreshVideoStatus(item: PublishItem) {
  ElMessage.info('正在刷新视频状态...')
  // 模拟轮询：随机切换为 done
  setTimeout(() => {
    if (item.videoStatus === 'generating') {
      item.videoStatus = 'done'
      ElMessage.success('视频已生成完毕！')
    }
  }, 1500)
}

function doPublish(idx: number) {
  const item = filtered.value[idx]
  const realItem = localItems.value.find(i => i === item)
  if (!realItem) return

  if (realItem.status === '草稿') {
    realItem.status = '待发布'
    ElMessage.info('已标记为待发布，请确认后正式发布')
  } else if (realItem.status === '待发布') {
    // 执行发布
    if (realItem.publishMode === 'custom' && !realItem.scheduledTime) {
      ElMessage.warning('请选择定时发布时间')
      return
    }
    realItem.status = '已发布'
    const timeStr = realItem.publishMode === 'custom'
      ? `定时发布于 ${realItem.scheduledTime}`
      : '立即发布'
    ElMessage.success(`发布成功！${timeStr}`)
  }
}
</script>

<style scoped>
.publish-page { display: flex; flex-direction: column; gap: 16px; }
.page-title { font-size: 20px; font-weight: 700; color: #1e293b; }
.filter-row { display: flex; flex-direction: column; gap: 8px; }
.tabs-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
.tab { padding: 6px 16px; border-radius: 20px; border: 1px solid #e2e8f0; background: #fdfefe; cursor: pointer; font-size: 12.5px; color: #64748b; transition: all 0.15s; }
.tab:hover { border-color: #93c5fd; color: #2563eb; }
.tab.active { background: #2563eb; border-color: #2563eb; color: #fff; font-weight: 600; }
.card { background: #fdfefe; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
.empty-state { text-align: center; padding: 48px 0; }
.empty-icon { font-size: 40px; margin-bottom: 12px; }
.empty-text { font-size: 15px; color: #64748b; font-weight: 500; margin-bottom: 6px; }
.empty-sub { font-size: 12px; color: #94a3b8; }
.publish-list { display: flex; flex-direction: column; gap: 14px; }

/* 内容卡片 */
.content-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  overflow: hidden;
  background: #fff;
}
.content-card.card-type-video_script { border-left: 3px solid #7c3aed; }
.content-card.card-type-poster { border-left: 3px solid #0ea5e9; }
.content-card.card-type-copy { border-left: 3px solid #10b981; }

.card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f8fafc;
  border-bottom: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.platform-tag { padding: 2px 8px; background: #dbeafe; color: #1d4ed8; border-radius: 8px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.type-badge { padding: 2px 8px; border-radius: 8px; font-size: 11px; font-weight: 600; flex-shrink: 0; }
.type-video_script { background: #ede9fe; color: #7c3aed; }
.type-poster { background: #e0f2fe; color: #0369a1; }
.type-copy { background: #d1fae5; color: #065f46; }
.card-topic { font-size: 13px; color: #1e293b; font-weight: 500; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.video-status { font-size: 12px; display: flex; align-items: center; gap: 4px; flex-shrink: 0; }
.video-status.generating { color: #f59e0b; }
.video-status.done { color: #10b981; }

.card-body { padding: 12px 14px; }
.content-preview {
  font-size: 13px; color: #334155; line-height: 1.7;
  white-space: pre-wrap; word-break: break-all;
  max-height: 120px; overflow-y: auto;
  cursor: text;
}
.edit-actions { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; }

.card-foot {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 14px 10px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  flex-wrap: wrap;
}
.publish-time-row { display: flex; align-items: center; gap: 6px; }

.status-badge { padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
.status-draft { background: #f1f5f9; color: #64748b; }
.status-pending { background: #fef3c7; color: #d97706; }
.status-done { background: #dcfce7; color: #16a34a; }
</style>
