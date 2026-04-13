# 移动协作模块 — 实施计划

## 项目结构
- 移动端专属 Layout: `src/layouts/MobileLayout.vue`
- 移动端页面: `src/views/mobile/`
- API: `src/api/chat.ts`, `src/api/mobile.ts`
- 类型: `src/types/mobile.ts`

## 底部 Tab 结构
```
🏠 工作台 | 💬 消息 | 👥 通讯录 | 🎙️ 会议室 | 👤 我的
```

## 待创建文件

### Layout
- `src/layouts/MobileLayout.vue` — 移动端专属布局（底部Tab + 置顶会议室区）

### 页面
- `src/views/mobile/MobileWorkbench.vue` — 工作台首页（Dashboard 精简版）
- `src/views/mobile/MobileChat.vue` — 消息列表 + 群聊
- `src/views/mobile/MobileGroupChat.vue` — 单个群聊详情
- `src/views/mobile/MobileContacts.vue` — 通讯录
- `src/views/mobile/MobileMeeting.vue` — 会议室（置顶区）
- `src/views/mobile/MobileActivity.vue` — 工作动态
- `src/views/mobile/MobileMy.vue` — 我的（更新版）
- `src/views/mobile/MobileAIBot.vue` — AI 机器人对话（管家录单 + Agent安排工作）

### API
- `src/api/chat.ts` — 群聊/消息/通讯录 API
- `src/api/mobile.ts` — 移动端专属 API（工作动态/任务）

### 数据表（后端新建）
- `chat_groups` — 群聊
- `chat_messages` — 消息
- `group_members` — 群成员
- `operation_logs` — 操作日志
- `tasks` — 任务
- `user_online_status` — 在线状态

## 路由
```
/mobile/workbench    → MobileWorkbench
/mobile/chat        → MobileChat
/mobile/chat/:id   → MobileGroupChat
/mobile/contacts    → MobileContacts
/mobile/meeting    → MobileMeeting
/mobile/activity   → MobileActivity
/mobile/my         → MobileMy
/mobile/ai-bot     → MobileAIBot
```

## 实施顺序
1. MobileLayout（框架）
2. MobileWorkbench（工作台）
3. MobileContacts（通讯录，最快出成果）
4. MobileChat + MobileGroupChat（核心聊天）
5. MobileAIBot（AI 录单机器人）
6. MobileActivity（工作动态）
7. MobileMeeting（会议室置顶）
8. 补充功能（扫码/拍照/离线等）

## 风格规范
- 主色：#0071E3（飞书蓝）
- 背景：#F5F5F7（浅灰）
- 卡片：#FFFFFF（白），圆角 16px
- 文字：#1D2129（主）/ #86909C（次）
- 间距：16px 页边距，卡片间距 12px
- 深色主题：复用 PC 端 var(--xxx) 变量
- AI 卡片：浅蓝背景 #EFF6FF
- 触控区域：最小 44px

## 消息清理
- 保留 180 天（半年）
- 手动清理按钮：群聊右上角 [...] → "清理历史消息"
- 自动清理：可选开启，每月 1 日执行

## AI 机器人
- 管家录单：默认 status=pending_review（待审核）
- 群里全员可见单据内容
- 置信度 >= 0.85：直接确认卡片
- 置信度 0.6-0.85：卡片 + 警告
- 置信度 < 0.6：要求补充信息
- 来源标记：ai_input = true

## 会议室
- 三个入口：立即开会 / 预约会议 / 输入码加入
- 参与人：从通讯录选择
- 复用 PC 端 MeetingRoom.vue 的后端 API
- 置顶在工作台 Tab 最顶部
