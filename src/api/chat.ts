/**
 * 移动协作 — 群聊 & 消息 API
 * 后端需创建表：chat_groups / chat_messages / group_members
 */
import http from './http'

// ── 群组管理 ──────────────────────────────────

/** 获取群聊列表 */
export function getChatGroups(params?: { list_rows?: number; page?: number }) {
  return http.get('/chat/groups', { params })
}

/** 获取单个群组详情 */
export function getChatGroup(id: number) {
  return http.get(`/chat/groups/${id}`)
}

/** 创建群聊 */
export function createChatGroup(data: { name: string; member_ids: number[] }) {
  return http.post('/chat/groups', data)
}

/** 获取/设置群名 */
export function updateChatGroupName(id: number, name: string) {
  return http.put(`/chat/groups/${id}`, { name })
}

/** 退出群聊 */
export function quitChatGroup(groupId: number, userId: number) {
  return http.delete(`/chat/groups/${groupId}/members/${userId}`)
}

// ── 成员管理 ──────────────────────────────────

/** 获取群成员列表 */
export function getGroupMembers(groupId: number) {
  return http.get(`/chat/groups/${groupId}/members`)
}

/** 添加群成员 */
export function addGroupMember(groupId: number, userId: number) {
  return http.post(`/chat/groups/${groupId}/members`, { user_id: userId })
}

/** 移除群成员 */
export function removeGroupMember(groupId: number, userId: number) {
  return http.delete(`/chat/groups/${groupId}/members/${userId}`)
}

// ── 消息管理 ──────────────────────────────────

/** 获取消息列表（支持分页） */
export function getMessages(
  groupId: number,
  params?: { list_rows?: number; page?: number; before_id?: number; after_id?: number }
) {
  return http.get(`/chat/groups/${groupId}/messages`, { params })
}

/** 发送消息 */
export function sendMessage(groupId: number, data: { content: string; type?: string }) {
  return http.post(`/chat/groups/${groupId}/messages`, data)
}

/** 标记消息已读 */
export function markMessagesRead(groupId: number, messageId: number) {
  return http.post(`/chat/groups/${groupId}/read`, { last_message_id: messageId })
}

/** 获取未读数 */
export function getUnreadCount() {
  return http.get('/chat/groups/unread')
}

// ── 消息清理 ──────────────────────────────────

/** 清理历史消息（保留 N 天） */
export function cleanupMessages(groupId: number, days: number) {
  return http.post(`/chat/groups/${groupId}/cleanup`, { days })
}

// ── 在线状态 ──────────────────────────────────

/** 获取当前在线用户 ID 列表 */
export function getOnlineStatus() {
  return http.get('/mobile/online-status')
}
