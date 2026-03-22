import { defineStore } from 'pinia'
import { computed, reactive } from 'vue'
import { USER_MEMORY_KEY } from '@/config'
import { readScopedJson, writeScopedJson } from '@/utils/storageScope'

export interface UserMemory {
  nickName: string
  language: '简洁' | '详细' | '默认'
  aliases: Record<string, string>
  defaultWarehouse: string
  topCustomers: string[]
  topSuppliers: string[]
  habits: string[]
  notes: string
}

function defaultMemory(): UserMemory {
  return {
    nickName: '',
    language: '默认',
    aliases: {},
    defaultWarehouse: '',
    topCustomers: [],
    topSuppliers: [],
    habits: [],
    notes: '',
  }
}

export const useUserMemoryStore = defineStore('userMemory', () => {
  const memory = reactive<UserMemory>(readScopedJson<UserMemory>(USER_MEMORY_KEY, defaultMemory()))

  const systemPromptFragment = computed(() => {
    const lines: string[] = []
    if (memory.nickName) lines.push(`- 称呼：${memory.nickName}`)
    if (memory.language !== '默认') lines.push(`- 沟通风格：${memory.language}`)
    const aliasEntries = Object.entries(memory.aliases)
    if (aliasEntries.length) {
      lines.push(`- 常用术语：${aliasEntries.map(([k, v]) => `${k}→${v}`).join('、')}`)
    }
    if (memory.defaultWarehouse) lines.push(`- 默认仓库：${memory.defaultWarehouse}`)
    if (memory.topCustomers.length) lines.push(`- 常用客户：${memory.topCustomers.join('、')}`)
    if (memory.topSuppliers.length) lines.push(`- 常用供应商：${memory.topSuppliers.join('、')}`)
    if (memory.habits.length) lines.push(`- 习惯：${memory.habits.join('；')}`)
    if (memory.notes) lines.push(`- 备注：${memory.notes}`)
    if (lines.length === 0) return ''
    return '【用户偏好记忆】\n' + lines.join('\n')
  })

  function saveMemory() {
    writeScopedJson(USER_MEMORY_KEY, { ...memory })
  }

  function resetMemory() {
    Object.assign(memory, defaultMemory())
    writeScopedJson(USER_MEMORY_KEY, defaultMemory())
  }

  function mergeExtracted(partial: Partial<UserMemory>) {
    if (partial.nickName && !memory.nickName) memory.nickName = partial.nickName
    if (partial.language && partial.language !== '默认' && memory.language === '默认') {
      memory.language = partial.language
    }
    if (partial.aliases) {
      for (const [k, v] of Object.entries(partial.aliases)) {
        if (!memory.aliases[k]) memory.aliases[k] = v
      }
    }
    if (partial.defaultWarehouse && !memory.defaultWarehouse) {
      memory.defaultWarehouse = partial.defaultWarehouse
    }
    if (partial.topCustomers?.length) {
      const set = new Set(memory.topCustomers)
      for (const c of partial.topCustomers) { if (!set.has(c)) { set.add(c); memory.topCustomers.push(c) } }
      if (memory.topCustomers.length > 5) memory.topCustomers = memory.topCustomers.slice(-5)
    }
    if (partial.topSuppliers?.length) {
      const set = new Set(memory.topSuppliers)
      for (const s of partial.topSuppliers) { if (!set.has(s)) { set.add(s); memory.topSuppliers.push(s) } }
      if (memory.topSuppliers.length > 5) memory.topSuppliers = memory.topSuppliers.slice(-5)
    }
    if (partial.habits?.length) {
      const set = new Set(memory.habits)
      for (const h of partial.habits) { if (!set.has(h)) { set.add(h); memory.habits.push(h) } }
      if (memory.habits.length > 10) memory.habits = memory.habits.slice(-10)
    }
    saveMemory()
  }

  return { memory, systemPromptFragment, saveMemory, resetMemory, mergeExtracted }
})
