<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getAdminList"
          :batch-del-api="batchDeleteAdmin"
          export-file-name="管理员" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item label="账号">
              <el-input v-model="searchForm.account" clearable style="width:180px" />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="searchForm.name" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增子账号</el-button>
        </template>
        <el-table-column label="账号" min-width="140">
          <template #default="{ row }">
            <span>{{ row.account }}</span>
            <el-tag v-if="row.role_name === '超级管理员'" size="small" type="warning" style="margin-left:6px">主账户</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="role_name" label="角色" min-width="120" />
        <el-table-column prop="dept_name" label="部门" min-width="120" />
        <el-table-column prop="mobile" label="手机号" width="130" />
        <el-table-column label="权限" min-width="200">
          <template #default="{ row }">
            <span v-if="getPermGroupSummary(row.remark).length > 0" class="perm-summary-tags">
              <el-tag
                v-for="g in getPermGroupSummary(row.remark)"
                :key="g.key"
                size="small"
                type="info"
                style="margin:2px"
              >{{ g.title }}({{ g.count }})</el-tag>
            </span>
            <span v-else class="all-access">全部模块</span>
          </template>
        </el-table-column>
        <el-table-column prop="status_tag" label="状态" width="100" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
            <el-button type="primary" size="small" link @click="openForm(row)">编辑</el-button>
            <el-button v-if="row.role_name !== '超级管理员'" type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 账号表单对话框 -->
    <el-dialog v-model="dialogVisible" :title="formTitle" :width="dialogWidth" :close-on-click-modal="false">
      <el-form ref="elFormRef" :model="form" :label-width="isMobile ? '60px' : '80px'" autocomplete="off">
        <el-form-item label="账号" prop="account" :rules="[{ required: true, message: '请输入账号' }]">
          <el-input v-model="form.account" :disabled="!!form.id" />
        </el-form-item>
        <el-form-item label="姓名" prop="name" :rules="[{ required: true, message: '请输入姓名' }]">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="密码" prop="password" :rules="form.id ? [] : [{ required: true, message: '请输入密码' }]">
          <el-input v-model="form.password" type="password" show-password :placeholder="form.id ? '不修改请留空' : '请输入密码'" />
        </el-form-item>
        <el-form-item label="角色" prop="role_id">
          <el-select v-model="form.role_id" placeholder="请选择角色" style="width:100%" @change="onRoleChange" clearable>
            <el-option v-for="r in roleList" :key="r.id" :label="r.name" :value="r.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="部门" prop="dept_name">
          <el-input v-model="form.dept_name" />
        </el-form-item>
        <el-form-item label="手机号" prop="mobile">
          <el-input v-model="form.mobile" />
        </el-form-item>

        <!-- 权限预览：按模块分组 -->
        <el-form-item v-if="form.role_id" label="权限">
          <div class="perm-preview">
            <template v-if="selectedRolePermGroups.length > 0">
              <el-tag
                v-for="g in selectedRolePermGroups"
                :key="g.key"
                size="small"
                style="margin:2px"
              >{{ g.title }}({{ g.count }})</el-tag>
            </template>
            <span v-else class="all-access">全部模块</span>
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
import { ref, reactive, computed, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getAdminList, createAdmin, updateAdmin, deleteAdmin, getRoleList } from '@/api/setting'
import { menuData } from '@/layouts/components/menuData'
import { PERM_PREFIX, type PermConfig } from '@/stores/permission'

const tableRef = ref<InstanceType<typeof ScTable>>()
const elFormRef = ref<any>()
const formTitle = ref('新增子账号')
const dialogVisible = ref(false)
const submitting = ref(false)
const searchForm = reactive<any>({})
const roleList = ref<any[]>([])

const isMobile = ref(window.innerWidth < 600)
const dialogWidth = computed(() => isMobile.value ? '95vw' : '560px')

const form = reactive<any>({
  id: undefined,
  account: '',
  name: '',
  password: '',
  role_id: undefined,
  role_name: '',
  dept_name: '',
  mobile: '',
})

onMounted(async () => {
  window.addEventListener('resize', () => { isMobile.value = window.innerWidth < 600 })
  try {
    const res: any = await getRoleList({ list_rows: 200 })
    roleList.value = res?.data?.rows || res?.data?.list || res?.data || []
  } catch {}
})

function getPermMenuKeys(remark: string): string[] {
  if (!remark?.startsWith(PERM_PREFIX)) return []
  try {
    const cfg: PermConfig = JSON.parse(remark.slice(PERM_PREFIX.length))
    return cfg.menus || []
  } catch { return [] }
}

function getPermGroupSummary(remark: string) {
  const keys = new Set(getPermMenuKeys(remark))
  if (keys.size === 0) return []
  return menuData
    .map(m => ({ key: m.key, title: m.title, count: m.children.filter(c => keys.has(c.key)).length }))
    .filter(g => g.count > 0)
}

const selectedRolePermGroups = computed(() => {
  if (!form.role_id) return []
  const role = roleList.value.find(r => r.id === form.role_id)
  return getPermGroupSummary(role?.remark || '')
})

function onRoleChange(roleId: number) {
  const role = roleList.value.find(r => r.id === roleId)
  form.role_name = role?.name || ''
}

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openView(row: any) {
  formTitle.value = '查看账号'
  Object.assign(form, { ...row, password: '' })
  dialogVisible.value = true
}

function openForm(row?: any) {
  formTitle.value = row ? '编辑子账号' : '新增子账号'
  Object.assign(form, {
    id: row?.id,
    account: row?.account || '',
    name: row?.name || '',
    password: '',
    role_id: row?.role_id,
    role_name: row?.role_name || '',
    dept_name: row?.dept_name || '',
    mobile: row?.mobile || '',
  })
  dialogVisible.value = true
}

async function handleSubmit() {
  await elFormRef.value?.validate()
  const role = roleList.value.find(r => r.id === form.role_id)
  const remark = role?.remark || ''
  const payload: any = {
    id: form.id,
    account: form.account,
    name: form.name,
    role_id: form.role_id,
    role_name: form.role_name,
    dept_name: form.dept_name,
    mobile: form.mobile,
    remark,
  }
  if (form.password) payload.password = form.password

  submitting.value = true
  try {
    payload.id ? await updateAdmin(payload) : await createAdmin(payload)
    ElMessage.success('操作成功')
    dialogVisible.value = false
    tableRef.value?.refresh()
  } finally {
    submitting.value = false
  }
}

async function batchDeleteAdmin({ ids }: { ids: number[] }) {
  for (const id of ids) {
    await deleteAdmin(id)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该账号？', '提示', { type: 'warning' })
  await deleteAdmin(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container {}
.search-actions { display: flex; gap: 8px; }
.perm-summary-tags { display: flex; flex-wrap: wrap; }
.all-access { color: #909399; font-size: 13px; }
.perm-preview { display: flex; flex-wrap: wrap; }
</style>
