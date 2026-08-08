<template>
  <div class="pc-page">
    <div class="pc-title">权限诊断</div>

    <div class="pc-card">
      <div class="pc-row"><span class="pc-label">当前账号</span><span class="pc-val">{{ account || '未登录' }}</span></div>
      <div class="pc-row"><span class="pc-label">账号类型</span><span class="pc-val">{{ permStore.isSubAccount ? '子账号' : '主账号（超管）' }}</span></div>
    </div>

    <div class="pc-card">
      <div class="pc-card-hd">① 权限串是否已到前端</div>
      <div class="pc-row">
        <span class="pc-label">本机权限串</span>
        <span class="pc-val" :class="hasLocalPerm ? 'ok' : 'bad'">{{ hasLocalPerm ? '✓ 存在' : '✗ 不存在' }}</span>
      </div>
      <div v-if="hasLocalPerm" class="pc-row">
        <span class="pc-label">解析菜单数</span>
        <span class="pc-val">{{ permStore.permConfig?.menus?.length ?? 0 }} 项</span>
      </div>
      <div v-if="hasLocalPerm" class="pc-menus">{{ (permStore.permConfig?.menus || []).join('、') || '（空）' }}</div>
      <div v-if="!hasLocalPerm && permStore.isSubAccount" class="pc-tip bad">
        权限串没到前端 → 当前被当成全权限账号，所有功能可见。往下看第②步定位原因。
      </div>
    </div>

    <div class="pc-card">
      <div class="pc-card-hd">② 服务端账号配置（实时拉取）</div>
      <div v-if="checking" class="pc-tip">检查中…</div>
      <template v-else>
        <div class="pc-row">
          <span class="pc-label">管理员接口</span>
          <span class="pc-val" :class="apiOk ? 'ok' : 'bad'">{{ apiOk ? '✓ 可访问' : '✗ 请求失败' }}</span>
        </div>
        <div v-if="apiOk" class="pc-row">
          <span class="pc-label">找到本账号</span>
          <span class="pc-val" :class="rowFound ? 'ok' : 'bad'">{{ rowFound ? '✓' : '✗ 列表里没有' }}</span>
        </div>
        <div v-if="rowFound" class="pc-row">
          <span class="pc-label">接口返回 remark 字段</span>
          <span class="pc-val" :class="rowHasRemarkField ? 'ok' : 'bad'">{{ rowHasRemarkField ? '✓' : '✗ 后端没返回该字段' }}</span>
        </div>
        <div v-if="rowFound" class="pc-row">
          <span class="pc-label">该账号已配权限串</span>
          <span class="pc-val" :class="rowHasPerm ? 'ok' : 'bad'">{{ rowHasPerm ? '✓' : '✗ 空（角色未保存到账号）' }}</span>
        </div>
        <div v-if="rowFound" class="pc-row">
          <span class="pc-label">角色</span>
          <span class="pc-val">{{ rowRoleName || '（未设置）' }}</span>
        </div>
        <div class="pc-row">
          <span class="pc-label">角色本身已配权限</span>
          <span class="pc-val" :class="roleHasPerm ? 'ok' : 'bad'">{{ roleHasPerm ? '✓ 有（已按角色生效）' : '✗ 角色是全选/未配置' }}</span>
        </div>
        <div v-if="!roleHasPerm && rowRoleName" class="pc-tip bad">
          「{{ rowRoleName }}」角色没有权限限制（等于全选）→ 该角色下所有人都能看到全部功能。
          请到 设置→角色 编辑「{{ rowRoleName }}」，取消勾选不该看的菜单后保存。
        </div>
      </template>
    </div>

    <div class="pc-card">
      <div class="pc-card-hd">③ 结果验证</div>
      <div class="pc-row">
        <span class="pc-label">统计页可见</span>
        <span class="pc-val">{{ permStore.canAccessPath('/mobile/stats') ? '是' : '否' }}</span>
      </div>
      <div class="pc-row">
        <span class="pc-label">财务总览可进</span>
        <span class="pc-val">{{ permStore.canAccessPath('/mobile/finance/overview') ? '是' : '否' }}</span>
      </div>
      <div class="pc-row">
        <span class="pc-label">收银台可见</span>
        <span class="pc-val">{{ permStore.canAccessPath('/cashregister') ? '是' : '否' }}</span>
      </div>
    </div>

    <button class="pc-btn" :disabled="syncing" @click="resync">
      {{ syncing ? '同步中…' : '重新同步权限（免退出登录）' }}
    </button>
    <div v-if="syncMsg" class="pc-tip" :class="syncOk ? 'ok' : 'bad'">{{ syncMsg }}</div>

    <div class="pc-foot">构建版本：{{ buildTag }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { usePermissionStore, PERM_PREFIX } from '@/stores/permission'
import { getAdminList, getRoleList } from '@/api/setting'
import { USER_INFO_KEY } from '@/config'

const authStore = useAuthStore()
const permStore = usePermissionStore()

// 用于确认手机上跑的是不是新包
const buildTag = '2026-07-22-rolefield'

const account = computed(() => authStore.userInfo?.account || '')
const hasLocalPerm = computed(() => {
  const r = authStore.userInfo?.remark
  return typeof r === 'string' && r.startsWith(PERM_PREFIX)
})

const checking = ref(true)
const apiOk = ref(false)
const rowFound = ref(false)
const rowHasRemarkField = ref(false)
const rowHasPerm = ref(false)
const rowRoleName = ref('')
const roleHasPerm = ref(false)
let serverRemark = ''

async function checkServer() {
  checking.value = true
  try {
    const res: any = await getAdminList({ list_rows: 500 })
    const rows = res?.data?.rows ?? res?.data?.list ?? res?.data ?? []
    apiOk.value = Array.isArray(rows)
    const me = Array.isArray(rows)
      ? rows.find((r: any) => String(r.account) === String(account.value))
      : null
    rowFound.value = !!me
    if (me) {
      rowHasRemarkField.value = Object.prototype.hasOwnProperty.call(me, 'remark')
      serverRemark = typeof me.remark === 'string' ? me.remark : ''
      rowHasPerm.value = serverRemark.startsWith(PERM_PREFIX)
      rowRoleName.value = me.role_name || ''
    }

    // 角色才是权限的真正来源：账号没副本时按角色取
    try {
      const rr: any = await getRoleList({ list_rows: 500 })
      const roles = rr?.data?.rows ?? rr?.data?.list ?? rr?.data ?? []
      if (Array.isArray(roles)) {
        const role = roles.find((r: any) =>
          (me?.role_id != null && String(r.id) === String(me.role_id)) ||
          (!!rowRoleName.value && r.name === rowRoleName.value)
        )
        // 角色权限串存在 `permissions` 字段（不是 remark）
        const rPerm = typeof role?.permissions === 'string' ? role.permissions : ''
        roleHasPerm.value = rPerm.startsWith(PERM_PREFIX)
        if (!rowHasPerm.value && roleHasPerm.value) serverRemark = rPerm
      }
    } catch { /* 角色接口失败不影响其余诊断 */ }
  } catch {
    apiOk.value = false
  } finally {
    checking.value = false
  }
}

const syncing = ref(false)
const syncMsg = ref('')
const syncOk = ref(false)

async function resync() {
  syncing.value = true
  syncMsg.value = ''
  await checkServer()
  if (rowFound.value && authStore.userInfo) {
    authStore.userInfo.remark = serverRemark
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(authStore.userInfo))
    permStore.setFromUserInfo(authStore.userInfo)
    const got = rowHasPerm.value || roleHasPerm.value
    syncOk.value = got
    syncMsg.value = got
      ? '✓ 权限已同步生效，返回首页查看'
      : `该账号和「${rowRoleName.value || '其角色'}」都没有权限限制：请到 设置→角色 编辑该角色，取消勾选不该看的菜单后保存`
  } else {
    syncOk.value = false
    syncMsg.value = '同步失败：接口不可用或列表中找不到本账号'
  }
  syncing.value = false
}

onMounted(checkServer)
</script>

<style scoped>
.pc-page { padding: 16px 14px 32px; background: #f5f5f5; min-height: 100%; }
.pc-title { font-size: 18px; font-weight: 700; color: #1d2129; margin-bottom: 12px; }
.pc-card { background: #fff; border-radius: 10px; padding: 12px 14px; margin-bottom: 10px; }
.pc-card-hd { font-size: 13px; font-weight: 600; color: #1d2129; margin-bottom: 8px; }
.pc-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; gap: 10px; }
.pc-label { font-size: 13px; color: #86909c; flex-shrink: 0; }
.pc-val { font-size: 13px; color: #1d2129; font-weight: 600; text-align: right; word-break: break-all; }
.pc-val.ok { color: #00b42a; }
.pc-val.bad { color: #f53f3f; }
.pc-menus { font-size: 11px; color: #86909c; line-height: 1.6; margin-top: 4px; word-break: break-all; }
.pc-tip { font-size: 12px; line-height: 1.6; margin-top: 8px; color: #86909c; }
.pc-tip.ok { color: #00b42a; }
.pc-tip.bad { color: #f53f3f; }
.pc-btn { width: 100%; padding: 12px 0; border: none; border-radius: 10px; background: #2E6BE6; color: #fff; font-size: 15px; font-weight: 600; margin-top: 4px; }
.pc-btn:disabled { opacity: 0.6; }
.pc-foot { text-align: center; font-size: 11px; color: #c2c8d5; margin-top: 14px; }
</style>
