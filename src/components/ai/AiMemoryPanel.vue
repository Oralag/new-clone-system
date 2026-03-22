<template>
  <div class="memory-panel">
    <div class="memory-panel-header">
      <span class="memory-panel-title">偏好记忆</span>
      <el-button :icon="Close" circle size="small" plain @click="$emit('close')" />
    </div>

    <div class="memory-panel-body">
      <el-form label-position="top" size="small">
        <!-- 称呼 -->
        <el-form-item label="称呼（管家怎么叫你）">
          <el-input v-model="memory.nickName" placeholder="如：老板、张总" clearable />
        </el-form-item>

        <!-- 沟通风格 -->
        <el-form-item label="沟通风格">
          <el-radio-group v-model="memory.language">
            <el-radio value="默认">默认</el-radio>
            <el-radio value="简洁">简洁</el-radio>
            <el-radio value="详细">详细</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 常用术语 -->
        <el-form-item label="常用术语（你的说法 → 系统标准名）">
          <div class="alias-list">
            <div v-for="(val, key) in memory.aliases" :key="key" class="alias-tag">
              <el-tag closable @close="removeAlias(key as string)">{{ key }} → {{ val }}</el-tag>
            </div>
          </div>
          <div class="alias-add">
            <el-input v-model="newAliasKey" placeholder="你的说法" style="width: 45%" />
            <span style="margin: 0 4px; color: #999">→</span>
            <el-input v-model="newAliasVal" placeholder="标准术语" style="width: 45%" @keyup.enter="addAlias" />
            <el-button :icon="Plus" circle size="small" @click="addAlias" style="margin-left: 4px" />
          </div>
        </el-form-item>

        <!-- 默认仓库 -->
        <el-form-item label="默认仓库">
          <el-input v-model="memory.defaultWarehouse" placeholder="如：主仓库" clearable />
        </el-form-item>

        <!-- 常用客户 -->
        <el-form-item label="常用客户">
          <div class="tag-list">
            <el-tag v-for="(c, i) in memory.topCustomers" :key="c" closable @close="memory.topCustomers.splice(i, 1)">{{ c }}</el-tag>
          </div>
          <el-input v-model="newCustomer" placeholder="输入客户名后回车" @keyup.enter="addCustomer" clearable />
        </el-form-item>

        <!-- 常用供应商 -->
        <el-form-item label="常用供应商">
          <div class="tag-list">
            <el-tag v-for="(s, i) in memory.topSuppliers" :key="s" closable @close="memory.topSuppliers.splice(i, 1)">{{ s }}</el-tag>
          </div>
          <el-input v-model="newSupplier" placeholder="输入供应商名后回车" @keyup.enter="addSupplier" clearable />
        </el-form-item>

        <!-- 习惯 -->
        <el-form-item label="使用习惯（AI 观察到的 + 你手动添加的）">
          <div class="tag-list">
            <el-tag v-for="(h, i) in memory.habits" :key="h" closable @close="memory.habits.splice(i, 1)">{{ h }}</el-tag>
          </div>
          <el-input v-model="newHabit" placeholder="输入习惯后回车" @keyup.enter="addHabit" clearable />
        </el-form-item>

        <!-- 备注 -->
        <el-form-item label="备注">
          <el-input v-model="memory.notes" type="textarea" :rows="2" placeholder="给管家的额外说明" />
        </el-form-item>
      </el-form>
    </div>

    <div class="memory-panel-footer">
      <el-button size="small" @click="handleReset">重置</el-button>
      <el-button type="primary" size="small" @click="handleSave">保存</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserMemoryStore } from '@/stores/userMemory'

defineEmits<{ close: [] }>()

const store = useUserMemoryStore()
const memory = store.memory

const newAliasKey = ref('')
const newAliasVal = ref('')
const newCustomer = ref('')
const newSupplier = ref('')
const newHabit = ref('')

function addAlias() {
  const k = newAliasKey.value.trim()
  const v = newAliasVal.value.trim()
  if (!k || !v) return
  memory.aliases[k] = v
  newAliasKey.value = ''
  newAliasVal.value = ''
}

function removeAlias(key: string) {
  delete memory.aliases[key]
}

function addCustomer() {
  const v = newCustomer.value.trim()
  if (!v || memory.topCustomers.includes(v)) return
  if (memory.topCustomers.length >= 5) { ElMessage.warning('最多 5 个常用客户'); return }
  memory.topCustomers.push(v)
  newCustomer.value = ''
}

function addSupplier() {
  const v = newSupplier.value.trim()
  if (!v || memory.topSuppliers.includes(v)) return
  if (memory.topSuppliers.length >= 5) { ElMessage.warning('最多 5 个常用供应商'); return }
  memory.topSuppliers.push(v)
  newSupplier.value = ''
}

function addHabit() {
  const v = newHabit.value.trim()
  if (!v || memory.habits.includes(v)) return
  if (memory.habits.length >= 10) { ElMessage.warning('最多 10 条使用习惯'); return }
  memory.habits.push(v)
  newHabit.value = ''
}

function handleSave() {
  store.saveMemory()
  ElMessage.success('偏好已保存')
}

function handleReset() {
  ElMessageBox.confirm('确定清空所有偏好记忆？', '提示', { type: 'warning' }).then(() => {
    store.resetMemory()
    ElMessage.success('已重置')
  }).catch(() => {})
}
</script>

<style scoped>
.memory-panel {
  position: absolute;
  top: 48px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 20;
  background: #fff;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #e4e7ed;
}

.memory-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  border-bottom: 1px solid #ebeef5;
}

.memory-panel-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.memory-panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.memory-panel-body :deep(.el-form-item) {
  margin-bottom: 12px;
}

.memory-panel-body :deep(.el-form-item__label) {
  font-size: 12px;
  color: #606266;
  padding-bottom: 2px;
}

.alias-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.alias-add {
  display: flex;
  align-items: center;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.tag-list .el-tag {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
}

.memory-panel-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
}
</style>
