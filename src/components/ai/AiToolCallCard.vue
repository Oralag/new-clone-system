<template>
  <div class="tool-call-card" :class="statusClass">
    <!-- 头部：图标 + 名称 + 状态 + 展开按钮 -->
    <div class="card-header">
      <el-icon class="card-icon"><component :is="statusIcon" /></el-icon>
      <span class="tool-name">{{ toolLabel }}</span>
      <span class="card-status">{{ statusText }}</span>
      <button
        v-if="status === 'success' && result && !isVideoResult && !isImageResult && result.length > 200"
        @click="isExpanded = !isExpanded"
        class="expand-btn"
      >
        {{ isExpanded ? '收起' : '展开' }}
      </button>
    </div>

    <!-- 入参 -->
    <div v-if="input && Object.keys(input).length" class="card-input">
      <span v-for="(v, k) in input" :key="k" class="param-chip">
        <b>{{ k }}</b>: {{ v }}
      </span>
    </div>

    <!-- 加载中 -->
    <div v-if="status === 'running'" class="loading-row">
      <span class="loading-text">工具执行中...</span>
    </div>

    <!-- 成功结果 -->
    <template v-if="status === 'success' && result">
      <!-- 视频播放器 -->
      <div v-if="isVideoResult" class="card-video">
        <video controls style="max-width:100%; border-radius:6px; margin-top:8px; display:block">
          <source :src="videoSrc" type="video/mp4" />
        </video>
        <a :href="videoSrc" download="video.mp4" class="video-download-btn">⬇ 下载视频</a>
      </div>
      <!-- 图片显示 -->
      <div v-else-if="isImageResult" class="card-image">
        <img :src="imageSrc" style="max-width:100%; border-radius:6px; margin-top:8px; display:block" />
        <a :href="imageSrc" download="image.png" class="video-download-btn">⬇ 下载图片</a>
      </div>
      <!-- 普通文本结果 -->
      <div v-else class="card-result" :class="{ collapsed: !isExpanded && result.length > 200 }" v-html="renderResult(result)" @click="onResultClick"></div>
      <div v-if="!isVideoResult && !isImageResult && !isExpanded && result.length > 200" class="collapse-tip" @click="isExpanded = true">
        内容过长，点击展开查看全部
      </div>
    </template>

    <!-- 失败信息 -->
    <div v-if="status === 'error'" class="card-result error-result">{{ result }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Loading, CircleCheck, CircleClose } from '@element-plus/icons-vue'

const props = defineProps<{
  name: string
  input?: Record<string, any>
  result?: string
  status: 'running' | 'success' | 'error'
}>()

const emit = defineEmits<{ pick: [text: string] }>()

const isExpanded = ref(false)

function renderResult(text: string): string {
  const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return escaped.replace(/\[\[PICK:([^\]]+)\]\]/g, (_, inner) => {
    const parts = inner.split('|')
    const name = parts[0] || ''
    const unit = parts[1] || ''
    const price = parts[2] || ''
    const priceText = price && Number(price) > 0 ? ` ¥${price}` : ''
    const unitText = unit ? `/${unit}` : ''
    return `<button class="goods-pick-btn" data-name="${name}" data-unit="${unit}" data-price="${price}" style="display:inline-block;margin:3px;padding:4px 10px;border-radius:16px;border:1px solid #409eff;background:#ecf5ff;color:#409eff;cursor:pointer;font-size:12px">${name}${unitText}${priceText}</button>`
  })
}

function onResultClick(e: MouseEvent) {
  const btn = (e.target as HTMLElement).closest('.goods-pick-btn') as HTMLElement | null
  if (!btn) return
  const name = btn.dataset.name || ''
  const unit = btn.dataset.unit || ''
  const price = btn.dataset.price || ''
  const priceText = price && Number(price) > 0 ? `单价¥${price}` : ''
  const unitText = unit ? `/${unit}` : ''
  emit('pick', `商品选「${name}${unitText}」${priceText}，请继续完成刚才的零售录入`)
}

// VIDEO_BASE64: prefix detection
const isVideoResult = computed(() => props.result?.startsWith('VIDEO_BASE64:') ?? false)
const videoSrc = computed(() => {
  if (!isVideoResult.value || !props.result) return ''
  const b64 = props.result.slice('VIDEO_BASE64:'.length)
  try {
    const binary = atob(b64)
    const arr = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
    return URL.createObjectURL(new Blob([arr], { type: 'video/mp4' }))
  } catch {
    return ''
  }
})

// IMAGE_BASE64: prefix detection
const isImageResult = computed(() => props.result?.startsWith('IMAGE_BASE64:') ?? false)
const imageSrc = computed(() => {
  if (!isImageResult.value || !props.result) return ''
  const b64 = props.result.slice('IMAGE_BASE64:'.length)
  return `data:image/png;base64,${b64}`
})

const toolLabels: Record<string, string> = {
  query_customers: '查询客户',
  query_suppliers: '查询供应商',
  query_goods: '查询商品',
  query_inventory: '查询库存',
  query_sales: '查询销售',
  query_purchases: '查询采购',
  query_finance: '查询财务',
  query_staff: '查询员工',
  query_warehouses: '查询仓库',
  create_customer: '新增客户',
  create_supplier: '新增供应商',
  create_goods: '新增商品',
  create_sale_order: '新增销售订单',
  create_procure_order: '新增采购订单',
  create_collect_receipt: '新增收款单',
  create_pay_receipt: '新增付款单',
  create_prepay: '新增预付款',
  create_staff: '新增员工',
  create_warehouse: '新增仓库',
  create_fund_account: '新增资金账户',
  navigate_to: '页面跳转',
  render_video: '渲染视频',
  render_image: '渲染图片',
  generate_image: '生成图片',
}

const toolLabel = computed(() => toolLabels[props.name] || props.name)
const statusClass = computed(() => `status-${props.status}`)
const statusIcon = computed(() => {
  if (props.status === 'running') return Loading
  if (props.status === 'success') return CircleCheck
  return CircleClose
})
const statusText = computed(() => {
  if (props.status === 'running') return '执行中...'
  if (props.status === 'success') return '完成'
  return '失败'
})
</script>

<style scoped>
.tool-call-card {
  border-radius: 8px;
  padding: 8px 12px;
  margin: 4px 0;
  font-size: 12px;
  border: 1px solid var(--faint, #e4e7ed);
  background: var(--gray, #f9fafb);
}

.status-running { border-color: #a0cfff; background: #ecf5ff; }
.status-success { border-color: #b3e19d; background: #f0f9eb; }
.status-error   { border-color: #fab6b6; background: #fef0f0; }

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
}

.status-running .card-icon { color: #409eff; animation: spin 1s linear infinite; }
.status-success .card-icon { color: #67c23a; }
.status-error   .card-icon { color: #f56c6c; }

@keyframes spin { to { transform: rotate(360deg); } }

.tool-name { flex: 1; color: var(--dark, #303133); }
.card-status { font-size: 11px; color: var(--mid, #909399); font-weight: 400; }

.expand-btn {
  padding: 1px 8px;
  border-radius: 4px;
  border: 1px solid #d1d5db;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 11px;
  cursor: pointer;
}

.card-input {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 6px;
}

.param-chip {
  background: var(--faint, rgba(0,0,0,0.05));
  border-radius: 4px;
  padding: 1px 6px;
  color: var(--mid, #606266);
}

.loading-row {
  margin-top: 6px;
}
.loading-text {
  font-size: 12px;
  color: #409eff;
}

.card-result {
  margin-top: 6px;
  color: var(--mid, #606266);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

.card-result.collapsed {
  max-height: 60px;
  overflow: hidden;
}

.error-result {
  color: #f56c6c;
}

.collapse-tip {
  font-size: 11px;
  color: #409eff;
  cursor: pointer;
  margin-top: 2px;
}

.card-video {
  margin-top: 8px;
}

.video-download-btn {
  display: inline-block;
  margin-top: 6px;
  padding: 4px 12px;
  background: #409eff;
  color: #fff;
  border-radius: 4px;
  font-size: 12px;
  text-decoration: none;
}
.video-download-btn:hover {
  background: #337ecc;
}
</style>
