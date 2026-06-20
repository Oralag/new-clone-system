<template>
  <div class="ps-wrap">
    <div class="ps-label">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
      {{ t('productSelector.label') }}
    </div>

    <div class="ps-selector" @click="open = !open" ref="selectorRef">
      <span v-if="selected" class="ps-selected-name">{{ selected.name }}</span>
      <span v-else class="ps-placeholder">{{ t('productSelector.placeholder') }}</span>
      <div class="ps-meta" v-if="selected">
        <span v-if="selected.price">¥{{ selected.price }}</span>
        <span v-if="selected.cate_name">{{ selected.cate_name }}</span>
        <button class="ps-clear" @click.stop="clearSelected">×</button>
      </div>
      <svg class="ps-arrow" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" :style="{ transform: open ? 'rotate(180deg)' : '' }"><path d="M6 9l6 6 6-6"/></svg>
    </div>

    <!-- 下拉面板 -->
    <div v-if="open" class="ps-dropdown" @click.stop>
      <div class="ps-search-row">
        <input
          ref="searchRef"
          v-model="keyword"
          class="ps-search"
          :placeholder="t('productSelector.searchPlaceholder')"
          @input="onSearch"
        />
      </div>

      <div v-if="loading" class="ps-loading">{{ t('common.loading') }}</div>
      <div v-else-if="list.length === 0" class="ps-empty">{{ t('productSelector.empty') }}</div>
      <div v-else class="ps-list">
        <div
          v-for="g in list"
          :key="g.id"
          class="ps-item"
          :class="{ active: selected?.id === g.id }"
          @click="selectGoods(g)"
        >
          <div class="ps-item-img" v-if="g.img_url">
            <img :src="g.img_url" />
          </div>
          <div class="ps-item-img placeholder" v-else>{{ g.name?.charAt(0) }}</div>
          <div class="ps-item-info">
            <div class="ps-item-name">{{ g.name }}</div>
            <div class="ps-item-meta">
              <span v-if="g.price">¥{{ g.price }}</span>
              <span v-if="g.spec_name" class="ps-spec">{{ g.spec_name }}</span>
              <span v-if="g.cate_name" class="ps-cate">{{ g.cate_name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { getGoodsList } from '@/api/goods'

export interface SelectedGoods {
  id: number
  name: string
  price?: string | number
  spec_name?: string
  cate_name?: string
  unit_name?: string
  img_url?: string
  bar_code?: string
  remark?: string
}

const emit = defineEmits<{
  (e: 'change', goods: SelectedGoods | null): void
}>()

const { t } = useI18n()

const open = ref(false)
const keyword = ref('')
const loading = ref(false)
const list = ref<SelectedGoods[]>([])
const allGoods = ref<SelectedGoods[]>([])
const selected = ref<SelectedGoods | null>(null)
const selectorRef = ref<HTMLDivElement>()
const searchRef = ref<HTMLInputElement>()

async function fetchGoods() {
  loading.value = true
  try {
    const res = await getGoodsList({ pageSize: 200 })
    const rows = res.data?.rows ?? res.data?.list ?? []
    allGoods.value = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.goods_name,
      price: r.price ?? r.retail_price ?? r.sale_price,
      spec_name: r.spec_name || r.spec,
      cate_name: r.cate_name || r.category_name,
      unit_name: r.unit_name,
      img_url: r.img_url || r.image,
      bar_code: r.bar_code,
      remark: r.remark,
    }))
    list.value = allGoods.value
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

function onSearch() {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) {
    list.value = allGoods.value
    return
  }
  list.value = allGoods.value.filter(g =>
    g.name?.toLowerCase().includes(kw) ||
    g.cate_name?.toLowerCase().includes(kw) ||
    g.bar_code?.includes(kw)
  )
}

function selectGoods(g: SelectedGoods) {
  selected.value = g
  open.value = false
  keyword.value = ''
  list.value = allGoods.value
  emit('change', g)
}

function clearSelected() {
  selected.value = null
  emit('change', null)
}

watch(open, async (val) => {
  if (val) {
    if (allGoods.value.length === 0) await fetchGoods()
    await nextTick()
    searchRef.value?.focus()
  }
})

function onClickOutside(e: MouseEvent) {
  if (selectorRef.value && !selectorRef.value.closest('.ps-wrap')?.contains(e.target as Node)) {
    open.value = false
  }
}
onMounted(() => document.addEventListener('click', onClickOutside))
onUnmounted(() => document.removeEventListener('click', onClickOutside))
</script>

<style scoped>
.ps-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}
.ps-label {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: #888;
  white-space: nowrap;
}

.ps-selector {
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 180px;
  max-width: 320px;
  padding: 5px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s;
  font-size: 12px;
  position: relative;
}
.ps-selector:hover { border-color: #aaa; }
.ps-selected-name { font-weight: 600; color: #1a1a1a; flex: 1; }
.ps-placeholder { color: #bbb; flex: 1; }
.ps-meta {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  color: #999;
}
.ps-clear {
  background: none;
  border: none;
  color: #bbb;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  padding: 0 2px;
}
.ps-clear:hover { color: #666; }
.ps-arrow { color: #bbb; flex-shrink: 0; transition: transform 0.15s; }

.ps-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  z-index: 1000;
  width: 320px;
  background: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.12);
  overflow: hidden;
}

.ps-search-row {
  padding: 8px;
  border-bottom: 1px solid #f0f0f0;
}
.ps-search {
  width: 100%;
  box-sizing: border-box;
  padding: 6px 10px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 12px;
  outline: none;
  font-family: inherit;
}
.ps-search:focus { border-color: #6366f1; }

.ps-loading, .ps-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: #bbb;
}

.ps-list {
  max-height: 240px;
  overflow-y: auto;
}
.ps-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 12px;
  cursor: pointer;
  transition: background 0.1s;
  border-bottom: 1px solid #f8f8f8;
}
.ps-item:hover { background: #f8f8f8; }
.ps-item.active { background: rgba(99, 102, 241, 0.06); }

.ps-item-img {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}
.ps-item-img img { width: 100%; height: 100%; object-fit: cover; }
.ps-item-img.placeholder {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.ps-item-info { flex: 1; min-width: 0; }
.ps-item-name {
  font-size: 13px;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ps-item-meta {
  display: flex;
  gap: 6px;
  margin-top: 2px;
  font-size: 11px;
  color: #888;
}
.ps-spec, .ps-cate {
  background: #f0f0f0;
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 10px;
}
</style>
