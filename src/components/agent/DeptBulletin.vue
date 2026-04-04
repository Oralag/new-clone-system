<template>
  <div class="dept-bulletin">
    <div class="dept-bulletin-hd">
      <span class="db-dot"></span>
      <span>今日任务</span>
      <button class="dept-bulletin-edit" @click="editing = !editing" :title="editing ? '完成' : '编辑'">
        <svg v-if="!editing" width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"><path d="M8.5 1.5l2 2L4 10H2v-2l6.5-6.5z"/></svg>
        <svg v-else width="10" height="10" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M2 6l3 3 5-5"/></svg>
      </button>
    </div>
    <textarea
      v-if="editing"
      v-model="text"
      class="dept-bulletin-input"
      placeholder="输入本部门工作任务..."
      rows="2"
      @blur="save"
    />
    <div v-else class="dept-bulletin-body">
      <span v-if="text">{{ text }}</span>
      <span v-else class="dept-bulletin-empty">暂无工作任务 · 点击右上角编辑</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ deptId: string }>()

const KEY_PREFIX = 'dept_bulletin_'
const editing = ref(false)
const text = ref(localStorage.getItem(KEY_PREFIX + props.deptId) || '')

function save() {
  localStorage.setItem(KEY_PREFIX + props.deptId, text.value)
  editing.value = false
}
</script>

<style scoped>
.dept-bulletin {
  background: #ffffff;
  border: 1px solid #E8E8E8;
  border-radius: 12px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.03);
}
.dept-bulletin-hd {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 700;
  color: #AAAAAA;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  flex-shrink: 0;
}
.db-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: #34d399;
  animation: dbpulse 2.5s ease-in-out infinite;
}
@keyframes dbpulse {
  0%,100% { box-shadow: 0 0 0 2px rgba(52,211,153,0.2); }
  50%      { box-shadow: 0 0 0 4px rgba(52,211,153,0.05); }
}
.dept-bulletin-edit {
  margin-left: 4px;
  background: none; border: none; cursor: pointer;
  color: #CCCCCC; padding: 2px; border-radius: 4px;
  display: flex; align-items: center; transition: color 0.15s;
}
.dept-bulletin-edit:hover { color: #0071e3; }
.dept-bulletin-body {
  flex: 1;
  font-size: 12px; color: #555555;
  line-height: 1.5; white-space: pre-wrap; word-break: break-all;
}
.dept-bulletin-empty { color: #CCCCCC; font-style: italic; }
.dept-bulletin-input {
  flex: 1;
  border: 1px solid rgba(0,0,0,0.1); border-radius: 8px;
  padding: 6px 10px; font-size: 12px; color: #1d1d1f;
  background: #f9f9fb; resize: none; outline: none;
  font-family: inherit; line-height: 1.5;
}
.dept-bulletin-input:focus { border-color: #0071e3; }
</style>

<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ deptId: string }>()

const KEY_PREFIX = 'dept_bulletin_'
const editing = ref(false)
const text = ref(localStorage.getItem(KEY_PREFIX + props.deptId) || '')

function save() {
  localStorage.setItem(KEY_PREFIX + props.deptId, text.value)
  editing.value = false
}
</script>

<style scoped>
.dept-bulletin {
  background: #ffffff;
  border: 1px solid rgba(0,0,0,0.07);
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}
.dept-bulletin-hd {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(29,29,31,0.4);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 6px;
}
.dept-bulletin-edit {
  margin-left: auto;
  background: none;
  border: none;
  cursor: pointer;
  color: rgba(29,29,31,0.35);
  padding: 2px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  transition: color 0.15s;
}
.dept-bulletin-edit:hover { color: #0071e3; }
.dept-bulletin-body {
  font-size: 12px;
  color: #1d1d1f;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
}
.dept-bulletin-empty { color: rgba(29,29,31,0.3); font-style: italic; }
.dept-bulletin-input {
  width: 100%;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 12px;
  color: #1d1d1f;
  background: #f9f9fb;
  resize: vertical;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
}
.dept-bulletin-input:focus { border-color: #0071e3; }
</style>
