<template>
  <div class="new-chat-page">
    <!-- 联系人信息 -->
    <div class="new-chat-target" v-if="targetUser">
      <div class="new-chat-avatar">{{ targetUser.name?.[0] || '?' }}</div>
      <div class="new-chat-info">
        <div class="new-chat-name">{{ targetUser.name }}</div>
        <div class="new-chat-sub" v-if="targetUser.role_name || targetUser.dept_name">
          {{ targetUser.role_name || '' }}{{ targetUser.role_name && targetUser.dept_name ? ' · ' : '' }}{{ targetUser.dept_name || '' }}
        </div>
      </div>
    </div>

    <!-- 无联系人时：搜索选择 -->
    <div v-else class="new-chat-select">
      <div class="contacts-search">
        <div class="contacts-search-inner">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input v-model="keyword" class="contacts-search-input" placeholder="搜索联系人" />
        </div>
      </div>
      <div class="new-chat-list">
        <div
          v-for="c in filteredContacts"
          :key="c.id"
          class="contacts-item"
          @click="selectContact(c)"
        >
          <div class="contacts-avatar">{{ c.name?.[0] || '?' }}</div>
          <div class="contacts-info">
            <div class="contacts-name">{{ c.name }}</div>
            <div class="contacts-sub" v-if="c.role_name || c.dept_name">
              {{ c.role_name || '' }}{{ c.role_name && c.dept_name ? ' · ' : '' }}{{ c.dept_name || '' }}
            </div>
          </div>
        </div>
        <div v-if="filteredContacts.length === 0 && keyword" class="contacts-empty-text" style="padding:20px;text-align:center;color:#999">
          未找到联系人
        </div>
      </div>
    </div>

    <!-- 发起会话按钮 -->
    <div class="new-chat-footer" v-if="targetUser">
      <button class="new-chat-btn" :disabled="loading" @click="startChat">
        <span v-if="loading">创建中...</span>
        <span v-else>发起会话</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import { getAdminList } from '@/api/setting'
import { createChatGroup } from '@/api/chat'

const router = useRouter()
const route = useRoute()

const keyword = ref('')
const contacts = ref<any[]>([])
const targetUser = ref<any>(null)
const loading = ref(false)

// 有预填参数时直接加载目标用户
const userId = Number(route.query.userId)
const userName = route.query.name as string

const filteredContacts = computed(() => {
  const kw = keyword.value.toLowerCase().trim()
  if (!kw) return contacts.value.slice(0, 30)
  return contacts.value.filter((c: any) =>
    (c.name || '').toLowerCase().includes(kw)
  )
})

function selectContact(c: any) {
  targetUser.value = c
  keyword.value = ''
}

async function startChat() {
  if (!targetUser.value || loading.value) return
  loading.value = true
  try {
    // 1. 先查找是否有与该用户的私聊
    const res = await http.get('/chat/groups', { params: { list_rows: 200 } })
    const groups: any[] = res?.data?.rows ?? res?.rows ?? []
    const existing = groups.find((g: any) =>
      g.member_ids?.includes(targetUser.value.id) &&
      g.member_ids.length === 2
    )
    if (existing) {
      router.replace(`/mobile/chat/${existing.id}`)
      return
    }
    // 2. 没有则创建私聊群
    const newGroup = await createChatGroup({
      name: targetUser.value.name || '私聊',
      member_ids: [targetUser.value.id],
    })
    const groupId = newGroup?.data?.id ?? newGroup?.id
    router.replace(`/mobile/chat/${groupId}`)
  } catch (e) {
    console.error('创建私聊失败', e)
    alert('创建私聊失败，请重试')
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  if (userId) {
    const res = await getAdminList({ list_rows: 500 })
    const rows: any[] = res?.data?.rows ?? res?.rows ?? []
    const user = rows.find((r: any) => r.id === userId)
    if (user) {
      targetUser.value = user
    } else {
      targetUser.value = { id: userId, name: decodeURIComponent(userName || '未知') }
    }
  }
  const res2 = await getAdminList({ list_rows: 500 })
  const rows2: any[] = res2?.data?.rows ?? res2?.rows ?? []
  contacts.value = rows2
})
</script>

<style scoped>
.wx-nav-bar {
  background: #fff;
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 8px 0 4px;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: env(safe-area-inset-top, 0px);
}
.wx-nav-back {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #1d2129;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
}
.wx-nav-back:active { background: #f0f0f5; }
.wx-nav-title {
  flex: 1;
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  text-align: center;
  padding: 0 8px;
}
.wx-nav-right { width: 36px; }

.new-chat-page {
  min-height: 100vh;
  background: #f4f4f4;
  display: flex;
  flex-direction: column;
}

.new-chat-target {
  background: #fff;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 16px;
  margin: 12px;
  border-radius: 12px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}
.new-chat-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #2E6BE6;
  color: #fff;
  font-size: 20px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.new-chat-name { font-size: 18px; font-weight: 700; color: #1d2129; }
.new-chat-sub { font-size: 13px; color: #86909c; margin-top: 3px; }

.new-chat-footer {
  margin-top: auto;
  padding: 12px 16px calc(env(safe-area-inset-bottom, 0px) + 16px);
}
.new-chat-btn {
  width: 100%;
  height: 48px;
  background: #2E6BE6;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-size: 17px;
  font-weight: 600;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.new-chat-btn:active { background: #1d5ad4; }
.new-chat-btn:disabled { background: #c8d4f5; }

.contacts-search {
  padding: 10px 12px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
}
.contacts-search-inner {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f2f3f5;
  border-radius: 6px;
  padding: 7px 10px;
}
.contacts-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 15px;
  outline: none;
  color: #1d2129;
}
.new-chat-list {
  background: #fff;
  flex: 1;
}
.contacts-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
  transition: background 0.1s;
}
.contacts-item:active { background: #fafafa; }
.contacts-avatar {
  width: 42px;
  height: 42px;
  border-radius: 8px;
  background: #2E6BE6;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.contacts-name { font-size: 16px; font-weight: 500; color: #1d2129; }
.contacts-sub { font-size: 12px; color: #86909c; margin-top: 2px; }
</style>
