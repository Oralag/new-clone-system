<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getRoleList"
          del-path="/setting/role/batchDel"
          export-file-name="角色管理" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="角色名称">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>
        <el-table-column prop="name" label="角色名称" min-width="140" />
        <el-table-column label="权限范围" min-width="280">
          <template #default="{ row }">
            <span class="perm-tags">
              <el-tag v-for="key in getPermMenuKeys(row.remark)" :key="key" size="small" style="margin:2px">
                {{ menuKeyLabel(key) }}
              </el-tag>
              <span v-if="getPermMenuKeys(row.remark).length === 0" class="all-access">全部模块</span>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
            <el-button type="primary" size="small" link @click="openForm(row)">编辑</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 角色表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle" width="620px" :close-on-click-modal="false">
      <el-form ref="elFormRef" :model="form" label-width="80px">
        <el-form-item label="角色名称" prop="name" :rules="[{ required: true, message: '请输入角色名称' }]">
          <el-input v-model="form.name" />
        </el-form-item>

        <el-form-item label="菜单权限">
          <div class="perm-panel">
            <div class="perm-header">
              <el-checkbox v-model="selectAll" :indeterminate="isIndeterminate" @change="onSelectAll">
                全选
              </el-checkbox>
              <span class="perm-hint">不勾选 = 不能访问该模块</span>
            </div>
            <div class="perm-grid">
              <el-checkbox
                v-for="menu in allMenuData"
                :key="menu.key"
                v-model="selectedMenus[menu.key]"
                @change="onMenuChange"
              >
                {{ menu.title }}
              </el-checkbox>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getRoleList, createRole, updateRole, deleteRole } from '@/api/setting'
import { menuData } from '@/layouts/components/menuData'
import { PERM_PREFIX, type PermConfig } from '@/stores/permission'

const allMenuData = menuData

const tableRef = ref<InstanceType<typeof ScTable>>()
const elFormRef = ref<any>()
const formTitle = ref('新增角色')
const dialogVisible = ref(false)
const submitting = ref(false)
const searchForm = reactive<any>({})

const form = reactive<any>({ id: undefined, name: '' })
const selectedMenus = reactive<Record<string, boolean>>({})

// Initialize selectedMenus with all keys
allMenuData.forEach(m => { selectedMenus[m.key] = false })

const checkedCount = computed(() => Object.values(selectedMenus).filter(Boolean).length)
const selectAll = computed({
  get: () => checkedCount.value === allMenuData.length,
  set: () => {},
})
const isIndeterminate = computed(() =>
  checkedCount.value > 0 && checkedCount.value < allMenuData.length
)

function onSelectAll(val: boolean) {
  allMenuData.forEach(m => { selectedMenus[m.key] = val })
}

function onMenuChange() {}

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

// Parse perm keys from remark
function getPermMenuKeys(remark: string): string[] {
  if (!remark?.startsWith(PERM_PREFIX)) return []
  try {
    const cfg: PermConfig = JSON.parse(remark.slice(PERM_PREFIX.length))
    return cfg.menus || []
  } catch {
    return []
  }
}

function menuKeyLabel(key: string): string {
  return allMenuData.find(m => m.key === key)?.title || key
}

function openView(row: any) {
  openForm(row, true)
}

function openForm(row?: any, readonly = false) {
  formTitle.value = readonly ? '查看角色' : (row ? '编辑角色' : '新增角色')
  form.id = row?.id
  form.name = row?.name || ''

  // Parse existing permissions
  const existingKeys = getPermMenuKeys(row?.remark || '')
  if (existingKeys.length === 0) {
    // No perm config = all access (main account style)
    allMenuData.forEach(m => { selectedMenus[m.key] = true })
  } else {
    const keySet = new Set(existingKeys)
    allMenuData.forEach(m => { selectedMenus[m.key] = keySet.has(m.key) })
  }
  dialogVisible.value = true
}

async function handleSubmit() {
  await elFormRef.value?.validate()
  const menus = allMenuData.filter(m => selectedMenus[m.key]).map(m => m.key)
  const permConfig: PermConfig = { menus }
  const remark = PERM_PREFIX + JSON.stringify(permConfig)
  submitting.value = true
  try {
    const data = { id: form.id, name: form.name, remark }
    data.id ? await updateRole(data) : await createRole(data)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    tableRef.value?.refresh()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该角色？', '提示', { type: 'warning' })
  await deleteRole(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }

.perm-panel {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  width: 100%;
}

.perm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.perm-hint {
  font-size: 12px;
  color: #909399;
}

.perm-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px 4px;
}

.perm-tags { display: flex; flex-wrap: wrap; }
.all-access { color: #909399; font-size: 13px; }
</style>
