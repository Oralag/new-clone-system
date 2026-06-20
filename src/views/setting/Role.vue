<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getRoleList"
          del-path="/setting/role/batchDel"
          export-file-name="角色管理" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('setting.role.searchName')">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('setting.role.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('setting.role.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('setting.role.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('setting.role.colName')" min-width="140" />
        <el-table-column :label="$t('setting.role.colPerm')" min-width="280">
          <template #default="{ row }">
            <span class="perm-summary-tags">
              <template v-if="getPermMenuKeys(row.remark).length === 0">
                <span class="all-access">{{ $t('setting.role.tagAllModules') }}</span>
              </template>
              <template v-else>
                <el-tag
                  v-for="group in getPermGroupSummary(row.remark)"
                  :key="group.key"
                  size="small"
                  type="info"
                  style="margin:2px"
                >{{ group.title }}({{ group.count }})</el-tag>
              </template>
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('setting.role.colActions')" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">{{ $t('setting.role.btnView') }}</el-button>
            <el-button type="primary" size="small" link @click="openForm(row)">{{ $t('setting.role.btnEdit') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('setting.role.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 角色表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle" :width="dialogWidth" :close-on-click-modal="false">
      <el-form ref="elFormRef" :model="form" label-width="80px">
        <el-form-item :label="$t('setting.role.fieldName')" prop="name" :rules="[{ required: true, message: t('setting.role.ruleNameRequired') }]">
          <el-input v-model="form.name" />
        </el-form-item>

        <!-- 预设角色快捷套用 -->
        <el-form-item :label="$t('setting.role.fieldPreset')">
          <div class="preset-row">
            <el-button
              v-for="(_, name) in PRESET_ROLES"
              :key="name"
              size="small"
              @click="applyPreset(name)"
            >{{ name }}</el-button>
          </div>
        </el-form-item>

        <el-form-item :label="$t('setting.role.fieldMenu')">
          <div class="perm-panel">
            <div class="perm-header">
              <el-checkbox v-model="selectAll" :indeterminate="isIndeterminate" @change="onSelectAll">{{ $t('setting.role.permSelectAll') }}</el-checkbox>
              <div class="perm-header-actions">
                <el-button link size="small" @click="expandAll">{{ $t('setting.role.permExpandAll') }}</el-button>
                <el-divider direction="vertical" />
                <el-button link size="small" @click="collapseAll">{{ $t('setting.role.permCollapseAll') }}</el-button>
              </div>
            </div>

            <!-- 按模块分组的折叠树 -->
            <div class="perm-groups">
              <div v-for="menu in allMenuData" :key="menu.key" class="perm-group">
                <div class="perm-group-header" @click="toggleGroup(menu.key)">
                  <el-icon class="group-arrow" :class="{ expanded: expandedGroups.has(menu.key) }">
                    <ArrowRight />
                  </el-icon>
                  <el-checkbox
                    :model-value="isGroupAllChecked(menu)"
                    :indeterminate="isGroupIndeterminate(menu)"
                    @change="(v: boolean) => onGroupSelectAll(menu, v)"
                    @click.stop
                  >
                    {{ menu.title }}
                  </el-checkbox>
                  <span class="group-count">{{ getGroupCheckedCount(menu) }}/{{ menu.children.length }}</span>
                </div>
                <div v-show="expandedGroups.has(menu.key)" class="perm-group-items">
                  <el-checkbox
                    v-for="child in menu.children"
                    :key="child.key"
                    v-model="selectedMenus[child.key]"
                  >{{ child.title }}</el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('setting.role.btnCancel') }}</el-button>
        <el-button type="primary" :loading="submitting" @click="handleSubmit">{{ $t('setting.role.btnConfirm') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, ArrowRight } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getRoleList, createRole, updateRole, deleteRole, getAdminList, updateAdmin } from '@/api/setting'
import { menuData } from '@/layouts/components/menuData'
import { PERM_PREFIX, type PermConfig } from '@/stores/permission'

const { t } = useI18n()

const allMenuData = menuData

// All sub-menu keys
const allChildKeys = allMenuData.flatMap(m => m.children.map(c => c.key))

// ── Preset roles ──────────────────────────────────────────────────────────────
const OFFICE_KEYS = [
  'office-task','office-cloud','office-remind','office-notice',
  'office-approval','office-work-report','office-visit',
  'office-expense','office-leave','office-overtime','office-business',
]

const PRESET_ROLES: Record<string, string[]> = {
  销售员: [
    'dashboard',
    'sale-client','sale-sea','sale-level',
    'sale-offer','sale-sample','sale-contract','sale-out','sale-return',
    'retail-order','retail-return',
    'goods-info',
    'warehouse-stock',
    'reports-sale-rate','reports-sale-ledger','reports-commission',
    ...OFFICE_KEYS,
  ],
  店长: [
    'dashboard',
    'sale-client','sale-level',
    'sale-offer','sale-sample','sale-contract','sale-out','sale-return',
    'retail-store','retail-order','retail-return','retail-customer',
    'retail-recharge','retail-points','retail-coupon',
    'goods-info',
    'warehouse-stock','warehouse-warning',
    'reports-sale-rate','reports-sale-ledger','reports-commission',
    ...OFFICE_KEYS,
  ],
  采购员: [
    'dashboard',
    'procure-supplier','procure-plan','procure-order','procure-inhouse','procure-return',
    'outsource-plan','outsource-inhouse','outsource-receive','outsource-quality',
    'warehouse-stock','warehouse-flow','warehouse-warning',
    'goods-info',
    'reports-procure','reports-stock',
    ...OFFICE_KEYS,
  ],
  仓库员: [
    'dashboard',
    'warehouse-stock','warehouse-scrap','warehouse-transfer','warehouse-flow',
    'warehouse-pick','warehouse-check','warehouse-other-in','warehouse-other-out',
    'warehouse-warning','warehouse-name','warehouse-batch','warehouse-serial',
    'procure-inhouse',
    'sale-out',
    'goods-info',
    'reports-stock',
    ...OFFICE_KEYS,
  ],
  财务: [
    'dashboard',
    'finance-overview','finance-receivable','finance-payable',
    'finance-collect-receipt','finance-pay-receipt','finance-invoice',
    'finance-statement','finance-expense','finance-fund','finance-fund-flow',
    'finance-cost','finance-prepay',
    'sale-contract','sale-out',
    'procure-order','procure-inhouse',
    'outsource-payable','outsource-payment',
    'reports-overview','reports-sale-rate','reports-sale-ledger','reports-commission',
    'reports-procure','reports-stock','reports-profit','reports-finance',
    'goods-info',
    'personnel-salary',
    ...OFFICE_KEYS,
  ],
  生产主管: [
    'dashboard',
    'production-overview','production-plan','production-inhouse',
    'production-material',
    'outsource-plan','outsource-inhouse','outsource-receive','outsource-quality',
    'procure-plan',
    'warehouse-stock','warehouse-flow','warehouse-warning',
    'goods-info','goods-bom',
    'reports-stock',
    ...OFFICE_KEYS,
  ],
}

// ── State ─────────────────────────────────────────────────────────────────────
const tableRef = ref<InstanceType<typeof ScTable>>()
const elFormRef = ref<any>()
const formTitle = ref('')
const dialogVisible = ref(false)
const submitting = ref(false)
const searchForm = reactive<any>({})
const form = reactive<any>({ id: undefined, name: '' })

// Sub-menu checkbox state
const selectedMenus = reactive<Record<string, boolean>>({})
allChildKeys.forEach(k => { selectedMenus[k] = false })

// Expanded groups state — all expanded by default
const expandedGroups = reactive(new Set<string>(allMenuData.map(m => m.key)))

// ── Computed: global select all ───────────────────────────────────────────────
const checkedCount = computed(() => Object.values(selectedMenus).filter(Boolean).length)
const selectAll = computed({
  get: () => checkedCount.value === allChildKeys.length,
  set: () => {},
})
const isIndeterminate = computed(() =>
  checkedCount.value > 0 && checkedCount.value < allChildKeys.length
)

function onSelectAll(val: boolean) {
  allChildKeys.forEach(k => { selectedMenus[k] = val })
}

// ── Computed: per-group helpers ───────────────────────────────────────────────
function getGroupCheckedCount(menu: typeof allMenuData[0]): number {
  return menu.children.filter(c => selectedMenus[c.key]).length
}

function isGroupAllChecked(menu: typeof allMenuData[0]): boolean {
  return menu.children.every(c => selectedMenus[c.key])
}

function isGroupIndeterminate(menu: typeof allMenuData[0]): boolean {
  const cnt = getGroupCheckedCount(menu)
  return cnt > 0 && cnt < menu.children.length
}

function onGroupSelectAll(menu: typeof allMenuData[0], val: boolean) {
  menu.children.forEach(c => { selectedMenus[c.key] = val })
}

// ── Expand / collapse ─────────────────────────────────────────────────────────
function toggleGroup(key: string) {
  expandedGroups.has(key) ? expandedGroups.delete(key) : expandedGroups.add(key)
}

function expandAll() {
  allMenuData.forEach(m => expandedGroups.add(m.key))
}

function collapseAll() {
  expandedGroups.clear()
}

// ── Preset apply ─────────────────────────────────────────────────────────────
function applyPreset(name: string) {
  const keys = new Set(PRESET_ROLES[name] ?? [])
  allChildKeys.forEach(k => { selectedMenus[k] = keys.has(k) })
}

// ── Dialog width (responsive) ─────────────────────────────────────────────────
const dialogWidth = computed(() =>
  window.innerWidth < 600 ? '95vw' : '680px'
)

// ── Permission parsing helpers ────────────────────────────────────────────────
function getPermMenuKeys(remark: string): string[] {
  if (!remark?.startsWith(PERM_PREFIX)) return []
  try {
    const cfg: PermConfig = JSON.parse(remark.slice(PERM_PREFIX.length))
    return cfg.menus || []
  } catch { return [] }
}

// Returns [{key, title, count}] per top-level module that has at least 1 allowed child
function getPermGroupSummary(remark: string) {
  const keys = new Set(getPermMenuKeys(remark))
  if (keys.size === 0) return []
  return allMenuData
    .map(m => ({ key: m.key, title: m.title, count: m.children.filter(c => keys.has(c.key)).length }))
    .filter(g => g.count > 0)
}

// ── Table helpers ─────────────────────────────────────────────────────────────
function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openView(row: any) {
  openForm(row, true)
}

function openForm(row?: any, readonly = false) {
  formTitle.value = readonly ? t('setting.role.formTitleView') : (row ? t('setting.role.formTitleEdit') : t('setting.role.formTitleAdd'))
  form.id = row?.id
  form.name = row?.name || ''

  const existingKeys = getPermMenuKeys(row?.remark || '')
  if (existingKeys.length === 0) {
    allChildKeys.forEach(k => { selectedMenus[k] = true })
  } else {
    const keySet = new Set(existingKeys)
    allChildKeys.forEach(k => { selectedMenus[k] = keySet.has(k) })
  }

  // Auto-expand groups that have partial selection
  allMenuData.forEach(m => {
    const cnt = getGroupCheckedCount(m)
    if (cnt > 0 && cnt < m.children.length) expandedGroups.add(m.key)
  })

  dialogVisible.value = true
}

async function handleSubmit() {
  await elFormRef.value?.validate()
  const menus = allChildKeys.filter(k => selectedMenus[k])
  const isAllSelected = menus.length === allChildKeys.length
  const remark = isAllSelected ? '' : (PERM_PREFIX + JSON.stringify({ menus } as PermConfig))
  submitting.value = true
  try {
    const data = { id: form.id, name: form.name, remark }
    data.id ? await updateRole(data) : await createRole(data)

    // 同步更新所有使用该角色的管理员账号 remark
    if (form.id) {
      try {
        const adminsRes: any = await getAdminList({ list_rows: 500 })
        const admins: any[] = adminsRes?.data?.rows || adminsRes?.data?.list || adminsRes?.data || []
        const targets = admins.filter((a: any) => a.role_id === form.id)
        await Promise.all(targets.map((a: any) => updateAdmin({ id: a.id, remark })))
      } catch {}
    }

    ElMessage.success(t('setting.role.msgOpSuccess'))
    dialogVisible.value = false
    tableRef.value?.refresh()
  } finally {
    submitting.value = false
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('setting.role.confirmDeleteMsg'), t('setting.role.confirmDeleteTitle'), { type: 'warning' })
  await deleteRole(id)
  ElMessage.success(t('setting.role.msgDeleteSuccess'))
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }

/* 列表权限摘要 */
.perm-summary-tags { display: flex; flex-wrap: wrap; }
.all-access { color: #909399; font-size: 13px; }

/* 预设角色行 */
.preset-row { display: flex; flex-wrap: wrap; gap: 6px; }

/* 权限面板 */
.perm-panel {
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 12px;
  width: 100%;
  max-height: 400px;
  overflow-y: auto;
}

.perm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f0f0f0;
}

.perm-header-actions { display: flex; align-items: center; gap: 4px; }

/* 分组 */
.perm-groups { display: flex; flex-direction: column; gap: 4px; }

.perm-group-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 4px;
  cursor: pointer;
  border-radius: 4px;
  user-select: none;
}
.perm-group-header:hover { background: #f5f7fa; }

.group-arrow {
  font-size: 12px;
  color: #909399;
  transition: transform 0.2s;
  flex-shrink: 0;
}
.group-arrow.expanded { transform: rotate(90deg); }

.group-count {
  margin-left: auto;
  font-size: 11px;
  color: #909399;
}

.perm-group-items {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px 4px;
  padding: 6px 8px 10px 24px;
  border-left: 2px solid #f0f0f0;
  margin-left: 10px;
}

@media (max-width: 600px) {
  .perm-group-items {
    grid-template-columns: repeat(2, 1fr);
    padding-left: 16px;
  }
}
</style>
