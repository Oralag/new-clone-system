<template>
  <el-drawer :model-value="modelValue" title="官网留言" size="560px" @update:model-value="emit('update:modelValue', $event)" @open="loadData">
    <div class="wl-filter">
      <el-radio-group v-model="filter" size="small" @change="loadData">
        <el-radio-button value="0">未处理</el-radio-button>
        <el-radio-button value="">全部</el-radio-button>
      </el-radio-group>
      <span class="wl-hint">批发询价、采购商申请、支持留言都在这里，提交时也会推送到你微信</span>
    </div>
    <div v-loading="loading" class="wl-list">
      <p v-if="loadError" class="wl-error">加载失败：{{ loadError }}</p>
      <p v-else-if="!loading && !rows.length" class="wl-empty">{{ filter === '0' ? '没有未处理的留言' : '还没有留言' }}</p>
      <div v-for="r in rows" :key="r.id" class="wl-card" :class="{ handled: r.handled }">
        <div class="wl-row">
          <el-tag size="small" :type="tagType(r.type)">{{ r.type_text }}</el-tag>
          <span class="wl-time">{{ fmtTime(r.created_at) }}</span>
        </div>
        <div class="wl-who">
          <b>{{ r.company || r.name }}</b>
          <span v-if="r.company">{{ r.name }}</span>
          <a v-if="r.mobile" :href="`tel:${r.mobile}`">{{ r.mobile }}</a>
          <span v-if="r.email">{{ r.email }}</span>
        </div>
        <div v-if="r.items?.length" class="wl-items">
          <div v-for="(i, idx) in r.items" :key="idx">{{ i.goods_name }} × {{ i.qty }}<span v-if="i.price"> · ¥{{ Number(i.price).toFixed(2) }}</span></div>
          <div v-if="Number(r.amount) > 0" class="wl-amount">参考金额 ¥{{ Number(r.amount).toFixed(2) }}</div>
        </div>
        <pre v-if="r.content" class="wl-content">{{ r.content }}</pre>
        <div class="wl-actions">
          <el-button v-if="!r.handled" size="small" type="primary" plain @click="setHandled(r, true)">标记已处理</el-button>
          <el-button v-else size="small" link @click="setHandled(r, false)">改回未处理</el-button>
        </div>
      </div>
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import http from '@/api/http'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean]; changed: [unhandled: number] }>()

const loading = ref(false)
const loadError = ref('')
const rows = ref<any[]>([])
const filter = ref('0')

async function loadData() {
  loading.value = true
  loadError.value = ''
  try {
    const res: any = await http.get('/mini/orders/web-leads', { params: { handled: filter.value, list_rows: 100, _t: Date.now() } })
    rows.value = res.data?.rows || []
    emit('changed', Number(res.data?.unhandled || 0))
  } catch (e: any) {
    loadError.value = e?.message || '请稍后再试'
  } finally {
    loading.value = false
  }
}

async function setHandled(r: any, handled: boolean) {
  try {
    await http.post('/mini/orders/web-leads/handle', { id: r.id, handled })
    await loadData()
  } catch { /* 拦截器已提示 */ }
}

function tagType(t: string) {
  return t === 'inquiry' ? 'warning' : t === 'wholesale_apply' ? 'success' : 'info'
}
function fmtTime(v: string) {
  return v ? new Date(v).toLocaleString('zh-CN', { hour12: false }) : ''
}

defineExpose({ loadData })
</script>

<style scoped>
.wl-filter { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
.wl-hint { font-size: 12px; color: var(--el-text-color-secondary); }
.wl-list { min-height: 120px; }
.wl-empty, .wl-error { text-align: center; color: var(--el-text-color-secondary); padding: 40px 0; font-size: 13px; }
.wl-error { color: var(--el-color-danger); }
.wl-card { border: 1px solid var(--el-border-color-lighter); border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
.wl-card.handled { opacity: 0.55; }
.wl-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.wl-time { font-size: 12px; color: var(--el-text-color-secondary); }
.wl-who { display: flex; flex-wrap: wrap; gap: 10px; font-size: 13px; margin-bottom: 6px; }
.wl-who a { color: var(--el-color-primary); }
.wl-items { font-size: 12px; color: var(--el-text-color-regular); background: var(--el-fill-color-light); border-radius: 8px; padding: 8px 10px; margin-bottom: 6px; line-height: 1.7; }
.wl-amount { font-weight: 700; margin-top: 4px; }
.wl-content { white-space: pre-wrap; font-family: inherit; font-size: 13px; margin: 0 0 6px; line-height: 1.6; }
.wl-actions { display: flex; justify-content: flex-end; }
</style>
