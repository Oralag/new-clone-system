<template>
  <div class="memory-panel">
    <div class="memory-panel-header">
      <span class="memory-panel-title">{{ t('aiMemoryPanel.title') }}</span>
      <el-button :icon="Close" circle size="small" plain @click="$emit('close')" />
    </div>

    <div class="memory-panel-body">
      <el-form label-position="top" size="small">
        <!-- 称呼 -->
        <el-form-item :label="t('aiMemoryPanel.nicknameLabel')">
          <el-input v-model="memory.nickName" :placeholder="t('aiMemoryPanel.nicknamePlaceholder')" clearable />
        </el-form-item>

        <!-- 沟通风格 -->
        <el-form-item :label="t('aiMemoryPanel.languageLabel')">
          <el-radio-group v-model="memory.language">
            <el-radio value="默认">{{ t('aiMemoryPanel.langDefault') }}</el-radio>
            <el-radio value="简洁">{{ t('aiMemoryPanel.langConcise') }}</el-radio>
            <el-radio value="详细">{{ t('aiMemoryPanel.langDetailed') }}</el-radio>
          </el-radio-group>
        </el-form-item>

        <!-- 常用术语 -->
        <el-form-item :label="t('aiMemoryPanel.aliasLabel')">
          <div class="alias-list">
            <div v-for="(val, key) in memory.aliases" :key="key" class="alias-tag">
              <el-tag closable @close="removeAlias(key as string)">{{ key }} → {{ val }}</el-tag>
            </div>
          </div>
          <div class="alias-add">
            <el-input v-model="newAliasKey" :placeholder="t('aiMemoryPanel.aliasKeyPlaceholder')" style="width: 45%" />
            <span style="margin: 0 4px; color: #999">→</span>
            <el-input v-model="newAliasVal" :placeholder="t('aiMemoryPanel.aliasValuePlaceholder')" style="width: 45%" @keyup.enter="addAlias" />
            <el-button :icon="Plus" circle size="small" @click="addAlias" style="margin-left: 4px" />
          </div>
        </el-form-item>

        <!-- 默认仓库 -->
        <el-form-item :label="t('aiMemoryPanel.defaultWarehouse')">
          <el-input v-model="memory.defaultWarehouse" :placeholder="t('aiMemoryPanel.defaultWarehousePlaceholder')" clearable />
        </el-form-item>

        <!-- 常用客户 -->
        <el-form-item :label="t('aiMemoryPanel.topCustomers')">
          <div class="tag-list">
            <el-tag v-for="(c, i) in memory.topCustomers" :key="c" closable @close="memory.topCustomers.splice(i, 1)">{{ c }}</el-tag>
          </div>
          <el-input v-model="newCustomer" :placeholder="t('aiMemoryPanel.customerPlaceholder')" @keyup.enter="addCustomer" clearable />
        </el-form-item>

        <!-- 常用供应商 -->
        <el-form-item :label="t('aiMemoryPanel.topSuppliers')">
          <div class="tag-list">
            <el-tag v-for="(s, i) in memory.topSuppliers" :key="s" closable @close="memory.topSuppliers.splice(i, 1)">{{ s }}</el-tag>
          </div>
          <el-input v-model="newSupplier" :placeholder="t('aiMemoryPanel.supplierPlaceholder')" @keyup.enter="addSupplier" clearable />
        </el-form-item>

        <!-- 习惯 -->
        <el-form-item :label="t('aiMemoryPanel.habitsLabel')">
          <div class="tag-list">
            <el-tag v-for="(h, i) in memory.habits" :key="h" closable @close="memory.habits.splice(i, 1)">{{ h }}</el-tag>
          </div>
          <el-input v-model="newHabit" :placeholder="t('aiMemoryPanel.habitPlaceholder')" @keyup.enter="addHabit" clearable />
        </el-form-item>

        <!-- 备注 -->
        <el-form-item :label="t('common.remark')">
          <el-input v-model="memory.notes" type="textarea" :rows="2" :placeholder="t('aiMemoryPanel.notesPlaceholder')" />
        </el-form-item>
      </el-form>
    </div>

    <div class="memory-panel-footer">
      <el-button size="small" @click="handleReset">{{ t('common.reset') }}</el-button>
      <el-button type="primary" size="small" @click="handleSave">{{ t('common.save') }}</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Close, Plus } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserMemoryStore } from '@/stores/userMemory'
import { useI18n } from 'vue-i18n'

defineEmits<{ close: [] }>()
const { t } = useI18n()

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
  if (memory.topCustomers.length >= 5) { ElMessage.warning(t('aiMemoryPanel.maxCustomers')); return }
  memory.topCustomers.push(v)
  newCustomer.value = ''
}

function addSupplier() {
  const v = newSupplier.value.trim()
  if (!v || memory.topSuppliers.includes(v)) return
  if (memory.topSuppliers.length >= 5) { ElMessage.warning(t('aiMemoryPanel.maxSuppliers')); return }
  memory.topSuppliers.push(v)
  newSupplier.value = ''
}

function addHabit() {
  const v = newHabit.value.trim()
  if (!v || memory.habits.includes(v)) return
  if (memory.habits.length >= 10) { ElMessage.warning(t('aiMemoryPanel.maxHabits')); return }
  memory.habits.push(v)
  newHabit.value = ''
}

function handleSave() {
  store.saveMemory()
  ElMessage.success(t('aiMemoryPanel.saved'))
}

function handleReset() {
  ElMessageBox.confirm(t('aiMemoryPanel.confirmReset'), t('common.tip'), { type: 'warning' }).then(() => {
    store.resetMemory()
    ElMessage.success(t('aiMemoryPanel.resetDone'))
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
