import { useAuthStore } from '@/stores/auth'

// 录入单据时经办人/采购人等默认填当前登录账号（员工=后台账号，id 与员工列表一致）
export function currentStaffName(): string {
  const u = useAuthStore().userInfo as any
  return String(u?.name || u?.account || '')
}

export function currentStaffId(): number | null {
  const id = Number((useAuthStore().userInfo as any)?.id || 0)
  return id || null
}
