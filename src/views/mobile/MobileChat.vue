<template>
  <div class="chat-page">
    <!-- 顶部栏：企业微信风格 -->
    <div class="wx-nav-bar">
      <div class="wx-nav-left">
        <button class="nav-icon-btn" @click="showDrawer = !showDrawer" title="菜单">
          <svg width="18" height="18" viewBox="0 0 20 18" fill="#333">
            <rect y="1" width="16" height="2" rx="1"/>
            <rect y="8" width="12" height="2" rx="1"/>
            <rect y="15" width="14" height="2" rx="1"/>
          </svg>
        </button>
      </div>
      <div class="wx-nav-title">消息</div>
      <div class="wx-nav-right">
        <button class="nav-icon-btn" @click="showSearch = !showSearch" title="搜索">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
        </button>
        <button class="nav-icon-btn" @click="showChatPlus = !showChatPlus; showFabPlus = false" title="新建">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2.5">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
    </div>

    <!-- 搜索栏（常驻在顶部栏下方） -->
    <div class="chat-search-bar" @click="showSearch = true">
      <div class="chat-search-inner">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span class="chat-search-placeholder">搜索</span>
      </div>
    </div>

    <!-- 子Tab：全部 / 待办 / AI管家 -->
    <div class="chat-sub-tabs">
      <div
        v-for="tab in subTabs"
        :key="tab.key"
        class="chat-sub-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
        <span v-if="tab.key === 'todo' && friendRequests.length > 0" class="tab-badge">{{ friendRequests.length }}</span>
      </div>
    </div>

    <!-- ── 全部 Tab ── -->
    <div v-show="activeTab === 'all'" class="tab-panel">
      <!-- 消息列表 -->
      <div class="chat-list">
        <div v-if="displayedGroups.length === 0 && groups.length === 0" class="chat-empty">
          <div class="chat-empty-icon">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div class="chat-empty-text">暂无消息</div>
        </div>
        <div
          v-for="g in displayedGroups"
          :key="g.id"
          class="chat-item-wrap"
          :class="{ 'swiped': swipedId === g.id, 'one-action': canClearGroup(g) }"
        >
          <!-- 左滑操作按钮 -->
          <div class="chat-item-actions" v-if="!!swipedId && swipedId === g.id && !!g.id">
            <div v-if="canClearGroup(g)" class="action-btn clear-btn" @click.stop="clearAiHistory(); closeSwipe()">
              清空
            </div>
            <div v-if="canManageGroup(g)" class="action-btn pin-btn" @click.stop="togglePin(g)">
              {{ g.is_pinned ? '取消置顶' : '置顶' }}
            </div>
            <div v-if="canManageGroup(g)" class="action-btn delete-btn" @click.stop="deleteGroup(g)">
              删除
            </div>
          </div>
          <!-- 聊天项主体 -->
          <div
            class="chat-item"
            :class="{ 'chat-item--pinned': g.is_pinned }"
            @click="swipeMoved ? (swipeMoved = false) : (closeSwipe(), g.route ? router.push(g.route) : router.push(`/mobile/chat/${g.id}`))"
            @touchstart.passive="onSwipeStart($event, g)"
            @touchend.passive="onSwipeEnd"
            @touchmove.passive="onSwipeMove"
          >
            <div class="chat-avatar-wrap">
              <div class="chat-avatar" :style="avatarStyle(g)">{{ g.avatar_text || g.name?.[0] || '群' }}</div>
              <span v-if="g.unread > 0" class="chat-unread-dot"></span>
            </div>
            <div class="chat-body">
              <div class="chat-top">
                <span class="chat-name">{{ g.name }}<span v-if="!g.is_private && (g.type === 'group' || g.member_count > 2)" class="group-badge">群</span></span>
                <span class="chat-time">{{ g.last_time }}</span>
              </div>
              <div class="chat-bottom">
                <span class="chat-msg">{{ g.last_msg }}</span>
                <span v-if="g.unread > 0" class="chat-badge">{{ g.unread > 99 ? '99+' : g.unread }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 待办 Tab ── -->
    <div v-show="activeTab === 'todo'" class="todo-tab">

      <!-- 好友申请 -->
      <div v-if="friendRequests.length > 0" class="fr-section">
        <div class="fr-section-title">好友申请</div>
        <div v-for="req in friendRequests" :key="req.id" class="fr-row">
          <div class="fr-avatar">{{ req.from_name?.[0] || req.from_company?.[0] || '?' }}</div>
          <div class="fr-info">
            <div class="fr-name">{{ req.from_name || req.from_company }}</div>
            <div class="fr-sub">{{ req.from_company }} · {{ req.from_account }}</div>
          </div>
          <div class="fr-actions">
            <button class="fr-btn fr-reject" @click="rejectFriendRequest(req)">拒绝</button>
            <button class="fr-btn fr-accept" @click="acceptFriendRequest(req)">同意</button>
          </div>
        </div>
      </div>

      <!-- 审核待办（紧凑条目） -->
      <div v-if="pendingItems.length > 0" class="pending-section">
        <div v-for="item in pendingItems" :key="item.key" class="pending-row" @click="item.onClick?.()">
          <div class="pending-dot" :style="{ background: item.color }"></div>
          <span class="pending-label">{{ item.label }}</span>
          <span class="pending-count">{{ item.count }}条待审</span>
          <span style="color:#ccc;font-size:16px">›</span>
        </div>
      </div>

      <!-- 状态筛选 pills -->
      <div class="task-filter-row">
        <div
          v-for="f in taskFilters"
          :key="f.key"
          class="task-filter-pill"
          :class="{ active: taskFilter === f.key }"
          @click="taskFilter = f.key"
        >{{ f.label }}<span v-if="f.count > 0" class="task-pill-badge">{{ f.count }}</span></div>
      </div>

      <!-- 任务列表（简洁行式） -->
      <div class="task-list-body">
        <div v-if="filteredTodoPlans.length === 0" class="task-empty-state">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d8d8d8" stroke-width="1.5"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          <span>暂无任务</span>
        </div>

        <div
          v-for="plan in filteredTodoPlans"
          :key="plan.id"
          class="task-row-wrap"
          :class="{ swiped: swipedTaskId === plan.id }"
        >
          <div class="task-row-actions" v-if="swipedTaskId === plan.id">
            <div class="task-row-btn btn-start" @click.stop="updatePlanStatus(plan, plan.status === 'doing' ? 'todo' : 'doing')">{{ plan.status === 'doing' ? '暂停' : '开始' }}</div>
            <div class="task-row-btn btn-done" @click.stop="updatePlanStatus(plan, plan.status === 'done' ? 'todo' : 'done')">{{ plan.status === 'done' ? '撤销' : '完成' }}</div>
          </div>
          <div
            class="task-row"
            @click="swipedTaskMoved ? (swipedTaskMoved = false) : openPlanDetail(plan)"
            @touchstart.passive="onTaskSwipeStart($event, plan)"
            @touchend.passive="onTaskSwipeEnd"
            @touchmove.passive="onTaskSwipeMove"
          >
            <div class="task-row-dot" :class="'dot-' + plan.status"></div>
            <div class="task-row-body">
              <div class="task-row-title" :class="{ 'task-row-done': plan.status === 'done' }">{{ plan.title }}</div>
              <div v-if="plan.mentions?.length || plan.due_date" class="task-row-meta">
                <span v-if="plan.mentions?.length" class="task-meta-assignee">@{{ plan.mentions.map((m:any) => m.name).join(' ') }}</span>
                <span v-if="plan.due_date" class="task-meta-due" :class="{ overdue: isPlanOverdue(plan) }">{{ plan.due_date }}</span>
              </div>
            </div>
            <span class="task-row-status-tag" :class="'stag-' + plan.status">
              <span v-if="plan.status==='todo'">待办</span>
              <span v-if="plan.status==='doing'">进行中</span>
              <span v-if="plan.status==='done'">完成</span>
            </span>
          </div>
        </div>
      </div>

      <!-- 新建按钮 -->
      <div class="task-add-row">
        <button class="task-add-btn" @click="openAddPlan">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          新建任务
        </button>
      </div>
    </div>

    <!-- ── AI管家 Tab ── -->
    <div v-show="activeTab === 'ai'" class="ai-tab" @click="router.push('/mobile/ai')">
      <div class="ai-banner">
        <div class="ai-avatar">🤖</div>
        <div class="ai-info">
          <div class="ai-title">AI 管家</div>
          <div class="ai-sub">智能助手，随时为您服务 →</div>
        </div>
      </div>
    </div>

    <!-- ── 搜索结果 ── -->
    <div v-if="showSearch" class="search-fullscreen">
      <div class="chat-search-panel">
        <div class="chat-search-bar-row">
          <div class="chat-search-inner-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              v-model="searchKeyword"
              class="chat-search-input"
              placeholder="搜索聊天记录"
              autofocus
            />
            <button v-if="searchKeyword" @click="searchKeyword = ''" class="chat-search-clear">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#bbb" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button class="chat-search-cancel" @click="showSearch = false; searchKeyword = ''">取消</button>
        </div>
      </div>
      <div class="chat-search-result">
        <div class="chat-search-hint" v-if="searchResults.length === 0 && !searchLoading && searchKeyword">
          未找到 "{{ searchKeyword }}" 相关结果
        </div>
        <div v-for="r in searchResults" :key="r.id" class="chat-search-item" @click="openSearchResult(r); showSearch = false">
          <div class="chat-avatar chat-avatar--sm">{{ r.name?.[0] || '?' }}</div>
          <div class="chat-body">
            <div class="chat-top"><span class="chat-name" v-html="highlight(r.name)"></span></div>
            <div class="chat-bottom"><span class="chat-msg" v-html="highlight(r.sub)"></span></div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 左侧抽屉遮罩 ── -->
    <div v-if="showDrawer" class="drawer-mask" @click="showDrawer = false"></div>

    <!-- ── 左侧抽屉 ── -->
    <div class="drawer" :class="{ open: showDrawer }">
      <div class="drawer-scroll">
        <!-- 用户卡片 -->
        <div class="drawer-hero">
          <div class="drawer-avatar">{{ authStore.userName?.[0] || '我' }}</div>
          <div class="drawer-name">{{ authStore.userName || '用户' }}</div>
          <div class="drawer-company">{{ authStore.userInfo?.dept || authStore.userInfo?.position || '成员' }}</div>
        </div>

        <!-- 数据卡片 -->
        <div class="drawer-stats">
          <div class="drawer-stat" @click="router.push('/mobile/sale/client'); showDrawer = false">
            <div class="drawer-stat-val">{{ myStats.customerCount }}</div>
            <div class="drawer-stat-label">客户</div>
          </div>
          <div class="drawer-stat-divider" />
          <div class="drawer-stat" @click="router.push('/mobile/finance/receivable'); showDrawer = false">
            <div class="drawer-stat-val">¥{{ myStats.receivable }}</div>
            <div class="drawer-stat-label">应收款</div>
          </div>
          <div class="drawer-stat-divider" />
          <div class="drawer-stat" @click="router.push('/mobile/warehouse/stock'); showDrawer = false">
            <div class="drawer-stat-val" :style="{ color: Number(myStats.stockWarn) > 0 ? '#f53f3f' : '#1d2129' }">{{ myStats.stockWarn }}</div>
            <div class="drawer-stat-label">库存预警</div>
          </div>
        </div>

        <!-- 协作工具 -->
        <div class="drawer-section-title">协作工具</div>
        <div class="drawer-grid">
          <div class="drawer-grid-item" @click="router.push('/mobile/activity'); showDrawer = false">工作动态</div>
          <div class="drawer-grid-item" @click="router.push('/mobile/ai'); showDrawer = false">AI 管家</div>
          <div class="drawer-grid-item" @click="router.push('/mobile/meeting'); showDrawer = false">会议室</div>
          <div class="drawer-grid-item" @click="router.push('/mobile/contacts'); showDrawer = false">通讯录</div>
        </div>

        <!-- 业务管理 -->
        <div class="drawer-section-title">业务管理</div>
        <div class="drawer-menu-list">
          <div class="drawer-menu-item" @click="router.push('/dashboard'); showDrawer = false">
            <span>首页工作台</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="drawer-menu-item" @click="router.push('/portal'); showDrawer = false">
            <span>切换工作台</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="drawer-menu-item" @click="router.push('/mobile/stats'); showDrawer = false">
            <span>数据报表</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <!-- 系统 -->
        <div class="drawer-section-title">系统</div>
        <div class="drawer-menu-list">
          <div class="drawer-menu-item" @click="router.push('/setting'); showDrawer = false">
            <span>系统设置</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
          <div class="drawer-menu-item" @click="copyDrawerLink">
            <span>复制链接</span>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#c2c8d5" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </div>
        </div>

        <!-- 退出 -->
        <div class="drawer-logout-wrap">
          <button class="drawer-logout-btn" @click="handleLogout">退出登录</button>
        </div>

        <div class="drawer-version">数字游牧 ERP v3.0</div>
      </div>
    </div>

    <!-- ── + 号下拉菜单（快捷操作） ── -->
  </div>

  <!-- ── 右键/长按菜单 ── -->
  <div v-if="contextGroup" class="context-menu" :style="contextMenuStyle">
    <div class="ctx-item" @click="togglePin(contextGroup)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
      {{ contextGroup.is_pinned ? '取消置顶' : '置顶聊天' }}
    </div>
    <div class="ctx-item ctx-item--danger" @click="deleteGroup(contextGroup)">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      删除会话
    </div>
  </div>

  <!-- 所有弹窗通过 Teleport 渲染到 body，避免被 .wx-layout 的 overflow:hidden 裁剪 -->
  <Teleport to="body" v-if="isChatPage">
    <!-- 新建任务底部抽屉 -->
    <div v-if="showAddPlan" class="m-modal-mask" @click.self="showAddPlan = false">
      <div class="m-modal-sheet add-plan-sheet" @touchmove.stop>
        <div class="m-modal-header">
          <span>新建工作计划</span>
          <button class="m-modal-close" @click="showAddPlan = false">取消</button>
        </div>
        <div class="m-modal-body" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <input v-model="newPlan.title" class="plan-input" placeholder="计划标题（必填）" autofocus />
          <textarea v-model="newPlan.description" class="plan-textarea" placeholder="描述（选填）" rows="2" />
          <div class="plan-field-row">
            <label>负责人</label>
            <div class="plan-assignee-wrap">
              <div v-if="newPlan.mentions.length === 0" class="plan-assignee-placeholder" @click="showAssigneePicker = !showAssigneePicker">点击选择（可选）</div>
              <div v-else class="plan-assignee-chips" @click="showAssigneePicker = !showAssigneePicker">
                <span v-for="m in newPlan.mentions" :key="m.id" class="plan-chip">
                  {{ m.name }}
                  <span @click.stop="newPlan.mentions = newPlan.mentions.filter(x => x.id !== m.id)">×</span>
                </span>
              </div>
            </div>
          </div>
          <!-- 负责人选择器 -->
          <div v-if="showAssigneePicker" class="plan-assignee-picker">
            <div v-if="contacts.length === 0" style="font-size:13px;color:#999;padding:8px">加载中...</div>
            <div
              v-for="c in contacts"
              :key="c.id"
              class="plan-assignee-item"
              :class="{ selected: newPlan.mentions.some(m => m.id === c.id) }"
              @click="toggleAssignee(c)"
            >
              <span class="plan-assignee-avatar">{{ c.name?.[0] }}</span>
              <span>{{ c.name }}</span>
              <svg v-if="newPlan.mentions.some(m => m.id === c.id)" width="16" height="16" viewBox="0 0 24 24" fill="none"><polyline points="20 6 9 17 4 12" stroke="#2E6BE6" stroke-width="2.5" fill="none" stroke-linecap="round"/></svg>
            </div>
          </div>
          <div class="plan-field-row">
            <label>优先级</label>
            <div class="plan-priority-btns">
              <button :class="['plan-priority-btn', { active: newPlan.priority === 'high' }]" @click="newPlan.priority = 'high'">🔴 紧急</button>
              <button :class="['plan-priority-btn', { active: newPlan.priority === 'normal' }]" @click="newPlan.priority = 'normal'">📋 普通</button>
              <button :class="['plan-priority-btn', { active: newPlan.priority === 'low' }]" @click="newPlan.priority = 'low'">📌 低优</button>
            </div>
          </div>
          <div class="plan-field-row">
            <label>截止日期</label>
            <input v-model="newPlan.due_date" type="date" class="plan-input-sm" />
          </div>
        </div>
        <div class="m-modal-footer">
          <button class="plan-submit-btn" @click="createPlanFromChat" :disabled="!newPlan.title.trim() || planSubmitting">
            {{ planSubmitting ? '创建中...' : '创建任务' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 任务详情底部抽屉 -->
    <div v-if="selectedPlan" class="m-modal-mask" @click.self="selectedPlan = null">
      <div class="m-modal-sheet add-plan-sheet" @touchmove.stop>
        <div class="m-modal-header">
          <span>任务详情</span>
          <button class="m-modal-close" @click="selectedPlan = null">关闭</button>
        </div>
        <div class="m-modal-body" style="padding:16px;display:flex;flex-direction:column;gap:12px;">
          <div style="font-size:17px;font-weight:600;color:#1d2129;line-height:1.4">{{ selectedPlan.title }}</div>
          <div v-if="selectedPlan.description" style="font-size:14px;color:#4e5969;background:#f5f5f7;padding:10px;border-radius:8px">{{ selectedPlan.description }}</div>
          <div class="plan-field-row">
            <label>状态</label>
            <div class="plan-priority-btns">
              <button :class="['plan-priority-btn', { active: selectedPlan.status === 'todo' }]" @click="updatePlanStatus(selectedPlan, 'todo')">待开始</button>
              <button :class="['plan-priority-btn', { active: selectedPlan.status === 'doing' }]" @click="updatePlanStatus(selectedPlan, 'doing')">进行中</button>
              <button :class="['plan-priority-btn', { active: selectedPlan.status === 'done' }]" @click="updatePlanStatus(selectedPlan, 'done')">已完成</button>
            </div>
          </div>
          <div v-if="selectedPlan.due_date" class="plan-field-row">
            <label>截止日期</label>
            <span style="font-size:14px">{{ selectedPlan.due_date }}</span>
          </div>
          <div v-if="selectedPlan.mentions?.length" class="plan-field-row">
            <label>执行人</label>
            <span style="font-size:14px;color:#2E6BE6">{{ selectedPlan.mentions.map((m: any) => m.name).join('、') }}</span>
          </div>
        </div>
        <div class="m-modal-footer" style="display:flex;gap:10px">
          <button class="plan-delete-btn" style="flex:1" @click="deletePlan(selectedPlan)">删除任务</button>
        </div>
      </div>
    </div>

    <!-- 发起群聊 - 联系人选择面板 -->
    <div v-if="showCreateGroup" class="m-modal-mask" @click.self="showCreateGroup = false">
      <div class="m-modal-sheet m-modal-sheet-tall" @touchmove.stop>
        <div class="m-modal-header">
          <span>发起群聊</span>
          <button class="m-modal-close" @click="showCreateGroup = false">取消</button>
        </div>
        <div style="padding: 8px 16px; border-bottom: 1px solid #f2f3f5; flex-shrink: 0;">
          <input v-model="newGroupName" placeholder="群聊名称（选填）" class="group-name-input" />
          <div class="group-search-input">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input v-model="groupSearchKeyword" placeholder="搜索联系人" />
          </div>
        </div>
        <!-- 已选成员 -->
        <div v-if="selectedMembers.length > 0" class="selected-members-bar">
          <div class="selected-members-scroll">
            <div v-for="m in selectedMembers" :key="m.id" class="selected-member-chip" @click="toggleMember(m)">
              <span>{{ m.name?.[0] || '?' }}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="3"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </div>
          </div>
        </div>
        <!-- 联系人列表 -->
        <div class="m-modal-body" style="padding: 0;">
          <div v-for="c in groupFilteredContacts" :key="c.id" class="group-contact-item" :class="{ selected: selectedMembers.some(m => m.id === c.id) }" @click="toggleMember(c)">
            <div class="group-contact-avatar">{{ c.name?.[0] || '?' }}</div>
            <span class="group-contact-name">{{ c.name }}</span>
            <div class="group-contact-check">
              <svg v-if="selectedMembers.some(m => m.id === c.id)" width="18" height="18" viewBox="0 0 24 24" fill="#07c160" stroke="#fff" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="9 12 11 14 15 10"/></svg>
              <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg>
            </div>
          </div>
        </div>
        <!-- 底部确认 -->
        <div class="m-modal-footer">
          <button class="group-create-btn" :disabled="selectedMembers.length === 0 || creatingGroup" @click="doCreateGroup">
            {{ creatingGroup ? '创建中...' : `确定（${selectedMembers.length}）` }}
          </button>
        </div>
      </div>
    </div>

    <!-- ── 添加朋友弹窗 ── -->
    <div v-if="showAddFriend" class="m-modal-mask" @click.self="closeAddFriend">
      <div class="m-modal-sheet" @touchmove.stop>
        <div class="m-modal-header">
          <span>添加朋友</span>
          <button class="m-modal-close" @click="closeAddFriend">取消</button>
        </div>
        <div class="add-friend-body">
          <p class="add-friend-hint">输入对方在系统中注册的手机号</p>
          <div class="add-friend-input-row">
            <input
              v-model="addFriendPhone"
              type="tel"
              maxlength="11"
              placeholder="请输入手机号"
              class="add-friend-input"
              @keyup.enter="searchFriend"
            />
            <button class="add-friend-search-btn" :disabled="addFriendLoading" @click="searchFriend">
              {{ addFriendLoading ? '搜索中…' : '搜索' }}
            </button>
          </div>
          <!-- 搜索结果 -->
          <div v-if="addFriendSearched">
            <div v-if="addFriendResult" class="add-friend-result">
              <div class="add-friend-avatar">{{ (addFriendResult.name || addFriendResult.company_name)?.[0] || '?' }}</div>
              <div class="add-friend-info">
                <div class="add-friend-name">{{ addFriendResult.name || addFriendResult.company_name }}</div>
                <div class="add-friend-role">{{ addFriendResult.name ? addFriendResult.company_name : addFriendPhone }}</div>
              </div>
              <button v-if="!addFriendSent" class="add-friend-chat-btn" @click="sendFriendRequest">发送申请</button>
              <span v-else style="color:#07c160;font-size:13px;font-weight:500">已发送</span>
            </div>
            <div v-else class="add-friend-empty">未找到该手机号对应的用户</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ── 顶栏+菜单：聊天操作 ── -->
    <div v-if="showChatPlus" class="plus-menu-mask" @click="showChatPlus = false"></div>
    <div v-if="showChatPlus" class="plus-menu chat-plus-menu">
      <div class="plus-menu-item" @click="showCreateGroup = true; showChatPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#07c160" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        发起群聊
      </div>
      <div class="plus-menu-item" @click="router.push('/mobile/chat/new'); showChatPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
        新的聊天
      </div>
      <div class="plus-menu-item" @click="showAddFriend = true; showChatPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
        添加朋友
      </div>
    </div>

    <!-- ── 底部FAB+菜单：业务快捷操作 ── -->
    <div v-if="showFabPlus" class="plus-menu-mask" @click="showFabPlus = false"></div>
    <div v-if="showFabPlus" class="plus-menu fab-plus-menu" :style="{ left: Math.min(fabPos.x, winWidth - 160) + 'px', bottom: (winHeight - fabPos.y + 10) + 'px' }">
      <div class="fab-plus-title">快捷操作</div>
      <div class="plus-menu-item" @click="router.push('/mobile/procure/order'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2E6BE6" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="7" y1="8" x2="10" y2="8"/><line x1="7" y1="12" x2="17" y2="12"/><line x1="7" y1="16" x2="13" y2="16"/></svg>
        扫码入库
      </div>
      <div class="plus-menu-item" @click="router.push('/mobile/sale/out'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#059669" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        新建销售出库
      </div>
      <div class="plus-menu-item" @click="router.push('/cashregister'); showFabPlus = false">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d97706" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/><line x1="6" y1="14" x2="12" y2="14"/><line x1="6" y1="17" x2="10" y2="17"/></svg>
        快捷收款
      </div>
    </div>

    <!-- ── 右下角可拖动快捷操作按钮 ── -->
    <div
      class="chat-fab"
      :style="{ left: fabPos.x + 'px', top: fabPos.y + 'px', right: 'auto', bottom: 'auto' }"
      @touchstart="onFabTouchStart"
      @touchmove="onFabTouchMove"
      @touchend="onFabTouchEnd"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import http from '@/api/http'
import { getAdminList } from '@/api/setting'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

// 是否在消息页（控制FAB和弹窗只在消息页显示）
const isChatPage = computed(() => route.path === '/mobile/chat')

// 窗口尺寸（用于菜单定位）
const winWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 375)
const winHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 667)

// 固定置顶项（如 AI 管家）
const pinnedSessions = ref([
  { id: 'ai-assistant-fixed', name: 'ERP管家', avatar_text: '🤖', last_msg: 'AI 智能管家，随时为您服务', last_time: '', type: 'ai', unread: 0, is_pinned: true, route: '/mobile/ai' },
  { id: 'meeting-fixed', name: 'AI会议室', avatar_text: '🏛', last_msg: '多Agent协同 · Captain主持', last_time: '', type: 'meeting', unread: 0, is_pinned: true, route: '/mobile/meeting' },
])

const groups = ref<any[]>([])
const contacts = ref<any[]>([])
const searchKeyword = ref('')
const searchResults = ref<any[]>([])
const searchLoading = ref(false)
const showSearch = ref(false)
const showNewChat = ref(false)
const newChatKeyword = ref('')
const activeMeetingCount = ref(0)
const showDrawer = ref(false)
const myStats = ref({ customerCount: 0, receivable: '0', stockWarn: 0 })

function copyDrawerLink() {
  const url = window.location.href
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('链接已复制')
  }).catch(() => { ElMessage.info(url) })
  showDrawer.value = false
}

async function loadDrawerStats() {
  const [custRes, recRes] = await Promise.allSettled([
    http.get('/shop/ShopCustomer/index', { params: { list_rows: 1 } }),
    http.get('/finance/Receivable/index', { params: { list_rows: 100 } }),
  ])
  if (custRes.status === 'fulfilled') myStats.value.customerCount = custRes.value?.data?.total ?? 0
  if (recRes.status === 'fulfilled') {
    const rows = recRes.value?.data?.rows ?? []
    const total = rows.filter((r: any) => Number(r.status) === 1 && Number(r.un_collect || 0) > 0)
      .reduce((s: number, r: any) => s + Number(r.un_collect || 0), 0)
    myStats.value.receivable = total >= 10000 ? (total / 10000).toFixed(1) + 'w' : total.toFixed(0)
  }
}
const showChatPlus = ref(false)
const showFabPlus = ref(false)
const showCreateGroup = ref(false)
const showAddFriend = ref(false)
const addFriendPhone = ref('')
const addFriendResult = ref<any>(null)
const addFriendLoading = ref(false)
const addFriendSearched = ref(false)
const addFriendSent = ref(false)
const selectedMembers = ref<any[]>([])
const groupSearchKeyword = ref('')
const newGroupName = ref('')

// 可拖动 FAB 状态
const fabPos = ref({ x: 300, y: 600 })
const fabDragStart = ref({ x: 0, y: 0 })
const fabDragging = ref(false)
const fabMoved = ref(false)

// 打开群聊面板时确保通讯录已加载
watch(showCreateGroup, (v) => { if (v && contacts.value.length === 0) loadContacts() })

const groupFilteredContacts = computed(() => {
  const kw = groupSearchKeyword.value.toLowerCase().trim()
  // 合并 AI助手 + 机器人Agent + 员工
  const aiBot = pinnedSessions.value.find(s => s.type === 'ai')
  const botContacts = aiBot ? [{ id: aiBot.id, name: aiBot.name, role_name: 'AI助手', _isBot: true }] : []
  // 通讯录中的机器人Agent
  const robotAgents = [
    { id: 'captain', name: 'Captain 总指挥', role_name: '机器人' },
    { id: 'copywriter', name: '文案Agent', role_name: '机器人' },
    { id: 'poster', name: '海报Agent', role_name: '机器人' },
    { id: 'video', name: '视频Agent', role_name: '机器人' },
    { id: 'brand', name: '品牌Agent', role_name: '机器人' },
    { id: 'trend', name: '趋势Agent', role_name: '机器人' },
    { id: 'publisher', name: '发布Agent', role_name: '机器人' },
    { id: 'designer', name: '平面设计师', role_name: '机器人' },
    { id: 'marketing', name: '营销顾问', role_name: '机器人' },
  ]
  const all = [...botContacts, ...robotAgents, ...contacts.value]
  if (!kw) return all
  return all.filter((c: any) => c.name?.toLowerCase().includes(kw))
})

function toggleMember(c: any) {
  const idx = selectedMembers.value.findIndex(m => m.id === c.id)
  if (idx >= 0) selectedMembers.value.splice(idx, 1)
  else selectedMembers.value.push(c)
}

const creatingGroup = ref(false)

async function doCreateGroup() {
  if (selectedMembers.value.length === 0) return
  if (creatingGroup.value) return  // 防重复
  creatingGroup.value = true
  try {
    const memberIds = selectedMembers.value.map(m => m.id)
    let name = newGroupName.value.trim()
    if (!name) {
      name = memberIds.length === 1
        ? `与${selectedMembers.value[0].name}的群聊`
        : `群聊`
    }
    const res = await http.post('/chat/groups', {
      name,
      member_ids: memberIds
    })
    showCreateGroup.value = false
    selectedMembers.value = []
    groupSearchKeyword.value = ''
    newGroupName.value = ''
    const groupId = res?.data?.id || res?.id
    if (groupId) {
      loadGroups()
      router.push(`/mobile/chat/${groupId}`)
    } else {
      loadGroups()
    }
  } catch (e) {
    alert('创建群聊失败：' + (e?.message || '未知错误'))
    showCreateGroup.value = false
    selectedMembers.value = []
    groupSearchKeyword.value = ''
    newGroupName.value = ''
  } finally {
    creatingGroup.value = false
  }
}
function closeAddFriend() {
  showAddFriend.value = false
  addFriendPhone.value = ''
  addFriendResult.value = null
  addFriendSearched.value = false
  addFriendSent.value = false
}

async function searchFriend() {
  const phone = addFriendPhone.value.trim()
  if (!phone) return
  addFriendLoading.value = true
  addFriendSearched.value = false
  addFriendResult.value = null
  addFriendSent.value = false
  try {
    const res = await http.get('/chat/users/search', { params: { phone } })
    addFriendResult.value = res?.data ?? null
  } catch {
    addFriendResult.value = null
  } finally {
    addFriendLoading.value = false
    addFriendSearched.value = true
  }
}

async function sendFriendRequest() {
  try {
    await http.post('/chat/friend-requests', { to_phone: addFriendPhone.value.trim() })
    addFriendSent.value = true
    ElMessage.success('好友申请已发送')
  } catch (e: any) {
    ElMessage.error(e?.message || '发送失败')
  }
}

const friendRequests = ref<any[]>([])

async function loadFriendRequests() {
  try {
    const res = await http.get('/chat/friend-requests/pending')
    friendRequests.value = res?.data?.rows ?? []
  } catch { friendRequests.value = [] }
}

async function acceptFriendRequest(req: any) {
  try {
    const res = await http.post(`/chat/friend-requests/${req.id}/accept`)
    ElMessage.success('已同意好友申请')
    friendRequests.value = friendRequests.value.filter(r => r.id !== req.id)
    loadGroups()
    const groupId = res?.data?.group_id
    if (groupId) router.push(`/mobile/chat/${groupId}`)
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

async function rejectFriendRequest(req: any) {
  try {
    await http.post(`/chat/friend-requests/${req.id}/reject`)
    friendRequests.value = friendRequests.value.filter(r => r.id !== req.id)
  } catch (e: any) {
    ElMessage.error(e?.message || '操作失败')
  }
}

const activeTab = ref('all')
watch(activeTab, (v) => { if (v === 'todo') loadFriendRequests() })

// 显示列表：固定置顶 + 用户置顶/普通会话（按最新时间排序，置顶优先）
// 按 id 去重，保留所有聊天（包括不在通讯录的）
const displayedGroups = computed(() => {
  const fixedIds = new Set(pinnedSessions.value.map(p => p.id))
  const seen = new Set<string>()
  const filtered = groups.value.filter(g => {
    if (!g.id) return false
    if (seen.has(g.id)) return false
    seen.add(g.id)
    return !fixedIds.has(g.id)
  })
  const sorted = [...filtered].sort((a, b) => {
    if (!!b.is_pinned !== !!a.is_pinned) return b.is_pinned ? 1 : -1
    return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime()
  })
  return [...pinnedSessions.value, ...sorted]
})

// ── 左滑操作 ──
const swipedId = ref<string | null>(null)
const swipeStartX = ref(0)
const currentSwipeItem = ref<any>(null)
const swipeMoved = ref(false) // 区分滑动 vs 点击，防止 click 事件误关
const SWIPE_THRESHOLD = 50
const contextGroup = ref<any>(null)
const contextMenuStyle = ref<any>({})

function canClearGroup(g: any) {
  return g?.type === 'ai'
}

function canManageGroup(g: any) {
  if (!g?.id || g.route) return false
  return g.type === 'group' || g.type === 'dm' || g.is_private || Number(g.member_count || 0) > 0
}

function canSwipeGroup(g: any) {
  return canClearGroup(g) || canManageGroup(g)
}

function onSwipeStart(e: TouchEvent, g: any) {
  swipeStartX.value = e.touches[0].clientX
  swipeMoved.value = false
  currentSwipeItem.value = g
}
function onSwipeMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - swipeStartX.value
  if (Math.abs(dx) > 5) swipeMoved.value = true // 有实际滑动
  // 左滑（dx < -50）显示操作按钮
  if (dx < -SWIPE_THRESHOLD && currentSwipeItem.value && canSwipeGroup(currentSwipeItem.value)) {
    swipedId.value = currentSwipeItem.value.id
  }
  // 右滑关闭
  if (dx > 10 && swipedId.value) {
    swipedId.value = null
  }
}
function onSwipeEnd() {
  swipeMoved.value = false // 每次抬手都重置，防止永远拦截点击
  currentSwipeItem.value = null
}
function closeSwipe() {
  swipedId.value = null
  currentSwipeItem.value = null
}

async function clearAiHistory() {
  try {
    // 清空前端本地缓存
    localStorage.removeItem('erp_ai_chat_history')
    localStorage.setItem('_ai_clear_flag', '1')
    ElMessage.success('ERP管家对话已清空')
    // 用整页跳转强制刷新，绕过缓存和 keep-alive 问题
    setTimeout(() => { window.location.href = '/mobile/ai' }, 300)
  } catch (e: any) {
    ElMessage.error('清空失败：' + (e.message || '未知错误'))
  }
}

async function togglePin(g: any) {
  closeSwipe()
  const pinned = !g.is_pinned
  if (pinned) {
    groups.value = groups.value.map(x => x.id === g.id ? { ...x, is_pinned: true } : x)
  } else {
    groups.value = groups.value.map(x => x.id === g.id ? { ...x, is_pinned: false } : x)
  }
  try {
    await http.post(`/chat/groups/${g.id}/pin`, { pinned })
  } catch { /* 静默失败，前端已更新 */ }
}

async function deleteGroup(g: any) {
  closeSwipe()
  // 确认对话框
  if (!confirm(`确定要删除与 "${g.name}" 的聊天吗？\n\n删除后聊天记录将无法恢复。`)) {
    return
  }
  try {
    await http.delete(`/chat/groups/${g.id}`)
    groups.value = groups.value.filter(x => x.id !== g.id)
  } catch { /* 静默失败 */ }
}

const pendingItems = ref<any[]>([])
const todoPlans = ref<any[]>([])
const showAddPlan = ref(false)
const planSubmitting = ref(false)
const selectedPlan = ref<any>(null)
const newPlan = ref({ title: '', description: '', priority: 'normal', due_date: '', mentions: [] as any[] })
const showAssigneePicker = ref(false)

function toggleAssignee(c: any) {
  const idx = newPlan.value.mentions.findIndex(m => m.id === c.id)
  if (idx >= 0) newPlan.value.mentions.splice(idx, 1)
  else newPlan.value.mentions.push({ id: c.id, name: c.name })
}

function openAddPlan() {
  newPlan.value = { title: '', description: '', priority: 'normal', due_date: '', mentions: [] }
  showAssigneePicker.value = false
  showAddPlan.value = true
}
const taskFilter = ref('all')
const taskFilters = computed(() => [
  { key: 'all', label: '全部', count: todoPlans.value.length },
  { key: 'todo', label: '待办', count: todoPlans.value.filter(p => p.status === 'todo').length },
  { key: 'doing', label: '进行中', count: todoPlans.value.filter(p => p.status === 'doing').length },
  { key: 'done', label: '已完成', count: todoPlans.value.filter(p => p.status === 'done').length },
])
const filteredTodoPlans = computed(() => {
  if (taskFilter.value === 'all') return todoPlans.value
  return todoPlans.value.filter(p => p.status === taskFilter.value)
})

// 任务左滑
const swipedTaskId = ref<any>(null)
const swipeTaskStartX = ref(0)
const swipedTaskMoved = ref(false)
const swipingTask = ref<any>(null)

function onTaskSwipeStart(e: TouchEvent, plan: any) {
  swipeTaskStartX.value = e.touches[0].clientX
  swipedTaskMoved.value = false
  swipingTask.value = plan
}
function onTaskSwipeMove(e: TouchEvent) {
  const dx = e.touches[0].clientX - swipeTaskStartX.value
  if (Math.abs(dx) > 5) swipedTaskMoved.value = true
  if (dx < -50 && swipingTask.value) swipedTaskId.value = swipingTask.value.id
  if (dx > 10 && swipedTaskId.value) swipedTaskId.value = null
}
function onTaskSwipeEnd() { swipingTask.value = null }

function isPlanOverdue(plan: any) {
  if (!plan.due_date || plan.status === 'done') return false
  return new Date(plan.due_date) < new Date()
}

function openPlanDetail(plan: any) {
  swipedTaskId.value = null
  selectedPlan.value = { ...plan }
}

async function updatePlanStatus(plan: any, status: string) {
  try {
    await http.put(`/work/plans/${plan.id}`, { status })
    plan.status = status
    const idx = todoPlans.value.findIndex(p => p.id === plan.id)
    if (idx >= 0) todoPlans.value[idx].status = status
    if (selectedPlan.value?.id === plan.id) selectedPlan.value.status = status
    swipedTaskId.value = null
  } catch { /* 静默 */ }
}

async function sendPlanRemind(plan: any) {
  try {
    const res = await http.get('/chat/groups/private/secretary')
    const groupId = res?.data?.id ?? res?.id
    if (!groupId) return
    const msg = `🔔 请跟进任务：「${plan.title}」${plan.due_date ? '，截止 ' + plan.due_date : ''}`
    await http.post('/chat/messages', { group_id: groupId, content: msg })
    alert('已通知秘书跟进')
  } catch { alert('通知失败') }
}

async function deletePlan(plan: any) {
  if (!confirm(`确定删除「${plan.title}」？`)) return
  try {
    await http.delete(`/work/plans/${plan.id}`)
    todoPlans.value = todoPlans.value.filter(p => p.id !== plan.id)
    selectedPlan.value = null
  } catch { alert('删除失败') }
}

async function createPlanFromChat() {
  if (!newPlan.value.title.trim()) return
  planSubmitting.value = true
  try {
    const res = await http.post('/work/plans', newPlan.value)
    const created = res?.data?.plan || res?.data || {}
    todoPlans.value.unshift(created)
    newPlan.value = { title: '', description: '', priority: 'normal', due_date: '', mentions: [] }
    showAddPlan.value = false
    showAssigneePicker.value = false
    // 通知秘书，带负责人
    try {
      const secRes = await http.get('/chat/groups/private/secretary')
      const gid = secRes?.data?.id ?? secRes?.id
      if (gid) {
        const due = created.due_date ? `，截止 ${created.due_date}` : ''
        const assignees = newPlan.value.mentions.length
          ? `，负责人：${newPlan.value.mentions.map(m => m.name).join('、')}`
          : ''
        await http.post('/chat/messages', { group_id: gid, content: `📋 新任务已创建：「${created.title || newPlan.value.title}」${assignees}${due}。请跟进。` })
      }
    } catch { /* 通知失败不阻断 */ }
  } catch (e: any) {
    alert('创建失败：' + (e?.message || '未知错误'))
  } finally {
    planSubmitting.value = false
  }
}

async function loadTodoPlans() {
  try {
    const res = await http.get('/work/plans', { params: { list_rows: 100 } })
    const plans = res?.data?.plans ?? res?.plans ?? []
    todoPlans.value = plans
  } catch {
    todoPlans.value = []
  }
}

const subTabs = [
  { key: 'all', label: '全部' },
  { key: 'todo', label: '待办' },
  { key: 'ai', label: 'AI管家' },
]

function avatarStyle(g: any) {
  const colors = ['#2E6BE6', '#52C41A', '#F5A623', '#F53F3F', '#722ED1', '#0FC6C2', '#EB6F29']
  const idx = (g.name || '').charCodeAt(0) % colors.length
  return { background: colors[idx] }
}

function highlight(text: string) {
  if (!text || !searchKeyword.value) return text
  const kw = searchKeyword.value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(`(${kw})`, 'gi'), '<mark>$1</mark>')
}

async function loadPendingItems() {
  try {
    const [procRes, retailRes] = await Promise.allSettled([
      http.get('/procure/ProcureOrder/index', { params: { list_rows: 1 } }),
      http.get('/retail/RetailOut/index', { params: { list_rows: 1 } }),
    ])
    const procRows = procRes.status === 'fulfilled' ? (procRes.value?.data?.rows ?? []) : []
    const retailRows = retailRes.status === 'fulfilled' ? (retailRes.value?.data?.rows ?? []) : []
    const pendingProc = procRows.filter((r: any) => Number(r.status) === 0)
    const pendingRetail = retailRows.filter((r: any) => Number(r.status) === 0)
    const items: any[] = []
    if (pendingProc.length > 0) {
      items.push({ key: 'procure', label: '采购单待审核', icon: '📦', color: '#2E6BE6', count: pendingProc.length, onClick: () => router.push('/mobile/procure/order') })
    }
    if (pendingRetail.length > 0) {
      items.push({ key: 'retail', label: '零售单待审核', icon: '🛒', color: '#FF6B35', count: pendingRetail.length, onClick: () => router.push('/mobile/sale/out') })
    }
    pendingItems.value = items
  } catch { pendingItems.value = [] }
}

// 从通讯录/Agent列表中查找用户名
const AGENT_NAMES: Record<string, string> = {
  'captain': 'Captain 总指挥',
  'copywriter': '文案Agent',
  'poster': '海报Agent',
  'video': '视频Agent',
  'brand': '品牌Agent',
  'trend': '趋势Agent',
  'publisher': '发布Agent',
  'designer': '平面设计师',
  'marketing': '营销顾问',
  'ai-assistant-fixed': 'ERP管家',
  'meeting-fixed': 'AI会议室',
}
function findContactName(id: string): string | null {
  // 1. Agent名
  if (AGENT_NAMES[id]) return AGENT_NAMES[id]
  // 2. 员工通讯录
  const emp = contacts.value.find((c: any) => String(c.id) === id)
  if (emp) return emp.name
  return null
}

async function loadGroups() {
  try {
    const res = await http.get('/chat/groups', { params: { list_rows: 200 } })
    const rows = res?.data?.rows ?? res?.rows ?? []
    groups.value = rows.map((r: any) => {
      const memberIds = r.member_ids ?? []
      const isPrivate = !!r.is_private || (memberIds.length === 2)
      // 私聊显示对方名字（去掉"私聊:"前缀）
      let displayName = r.name || '会话'
      if (isPrivate && memberIds.length === 2) {
        const otherId = memberIds.find((id: any) => String(id) !== String(authStore.userInfo?.id))
        if (otherId) {
          const found = findContactName(String(otherId))
          if (found) {
            displayName = found
          } else if (displayName.startsWith('私聊:')) {
            // 去掉"私聊:"前缀
            displayName = displayName.slice(3)
          }
        }
      }
      return {
        id: r.id,
        name: displayName,
        avatar_text: displayName?.[0],
        last_msg: r.last_message || r.last_msg || (r.cross_tenant ? '发消息打个招呼～' : ''),
        last_time: formatTime(r.last_message_at || r.last_time || ''),
        unread: r.unread ?? 0,
        is_pinned: r.is_pinned ?? false,
        last_message_at: r.last_message_at || '',
        member_count: r.member_count ?? memberIds.length ?? 0,
        member_ids: memberIds,
        is_private: isPrivate,
        type: memberIds.length > 2 ? 'group' : 'dm',
      }
    })
    const totalUnread = rows.reduce((s: number, r: any) => s + (r.unread ?? 0), 0)
    if (typeof uni !== 'undefined') uni.$emit('update:unread', totalUnread)
  } catch { groups.value = [] }
}

// 加载内部员工通讯录
async function loadContacts() {
  try {
    const res = await getAdminList({ list_rows: 500 })
    const rows = res?.data?.rows ?? res?.rows ?? []
    contacts.value = rows.map((r: any) => ({
      id: r.id,
      name: r.name || r.admin_name || '未知用户',
      role_name: r.role_name || '',
    }))
  } catch { contacts.value = [] }
}

async function loadActiveMeetings() {
  try {
    const res = await http.get('/meeting/active')
    const list = res?.data ?? res?.list ?? []
    activeMeetingCount.value = list.length
  } catch { activeMeetingCount.value = 0 }
}

function formatTime(ts: string) {
  if (!ts) return ''
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  if (diff < 86400000) return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
  if (diff < 7 * 86400000) return ['日','一','二','三','四','五','六'][d.getDay()]
  return `${d.getMonth() + 1}/${d.getDate()}`
}

async function doSearch() {
  if (!searchKeyword.value.trim()) { searchResults.value = []; return }
  searchLoading.value = true
  try {
    const [custRes, saleRes] = await Promise.allSettled([
      http.get('/shop/ShopCustomer/index', { params: { keywords: searchKeyword.value, list_rows: 10 } }),
      http.get('/stock/SaleOutOrder/index', { params: { keywords: searchKeyword.value, list_rows: 10 } }),
    ])
    const results: any[] = []
    if (custRes.status === 'fulfilled') {
      (custRes.value?.data?.rows ?? custRes.value?.rows ?? []).forEach((r: any) => {
        results.push({ id: r.id, type: 'customer', name: r.name || r.customer_name, sub: `客户 | ${r.phone || '无电话'}` })
      })
    }
    if (saleRes.status === 'fulfilled') {
      (saleRes.value?.data?.rows ?? saleRes.value?.rows ?? []).forEach((r: any) => {
        results.push({ id: r.id, type: 'order', name: `#${r.id} ${r.customer_name || '客户'}`, sub: `销售单 | ¥${r.total_amount || 0}` })
      })
    }
    searchResults.value = results
  } catch { searchResults.value = [] } finally { searchLoading.value = false }
}

function openSearchResult(r: any) {
  showSearch.value = false
  searchKeyword.value = ''
  if (r.type === 'customer') router.push('/mobile/sale/client')
  else if (r.type === 'order') router.push('/mobile/sale/out')
}

function handleScan() {
  // 跳扫码查库存
  router.push('/mobile/warehouse/scan')
}

function handleLogout() {
  authStore.logout()
  router.replace('/login')
  showDrawer.value = false
}

// ── 可拖动 FAB 事件处理 ──
const fabStartPos = ref({ x: 0, y: 0 })

function onFabTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  fabStartPos.value = { x: touch.clientX, y: touch.clientY }
  fabDragStart.value = { x: touch.clientX - fabPos.value.x, y: touch.clientY - fabPos.value.y }
  fabDragging.value = true
  fabMoved.value = false
}

function onFabTouchMove(e: TouchEvent) {
  if (!fabDragging.value) return
  const touch = e.touches[0]
  
  // 判断是否移动超过阈值（10px）
  const dx = touch.clientX - fabStartPos.value.x
  const dy = touch.clientY - fabStartPos.value.y
  if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
    fabMoved.value = true
    e.preventDefault() // 只在真正拖动时阻止默认行为
  }
  
  if (!fabMoved.value) return
  
  const newX = touch.clientX - fabDragStart.value.x
  const newY = touch.clientY - fabDragStart.value.y
  
  // 限制在屏幕范围内
  const margin = 10
  const fabSize = 50
  fabPos.value = {
    x: Math.max(margin, Math.min(winWidth.value - fabSize - margin, newX)),
    y: Math.max(60 + margin, Math.min(winHeight.value - fabSize - 66 - margin, newY))
  }
}

function onFabTouchEnd() {
  if (fabDragging.value && fabMoved.value) {
    // 拖动结束，吸附到屏幕边缘
    const fabSize = 50
    const margin = 10
    if (fabPos.value.x < winWidth.value / 2) {
      fabPos.value.x = margin
    } else {
      fabPos.value.x = winWidth.value - fabSize - margin
    }
  } else {
    // 没有拖动，视为点击
    showFabPlus.value = !showFabPlus.value
    showChatPlus.value = false
  }
  fabDragging.value = false
}

const filteredContacts2 = computed(() => {
  const kw = newChatKeyword.value.toLowerCase()
  if (!kw) return contacts.value.slice(0, 20)
  return contacts.value.filter((c: any) => c.name?.toLowerCase().includes(kw))
})

function startChat(c: any) {
  showNewChat.value = false
  http.post('/chat/create', { type: 'dm', target_id: c.id })
    .then((res) => { if (res?.data?.id) router.push(`/mobile/chat/${res.data.id}`) })
    .catch(() => router.push(`/mobile/chat/dm/${c.id}`))
}

function createGroupChat() {
  showNewChat.value = false
  router.push('/mobile/agent/meeting')
}

watch(searchKeyword, (v) => { if (v) doSearch() })

let listPollTimer: ReturnType<typeof setInterval> | null = null

onMounted(async () => {
  loadDrawerStats()
  // 设置 FAB 初始位置（右下角）
  winWidth.value = window.innerWidth
  winHeight.value = window.innerHeight
  fabPos.value = { x: winWidth.value - 60, y: winHeight.value - 116 }

  // 先加载通讯录，再加载群组（保证私聊名字能正确显示对方名字）
  await loadContacts()
  loadGroups()
  loadActiveMeetings()
  loadPendingItems()
  loadTodoPlans()
  loadFriendRequests()
  // 每 5 秒刷新消息列表（检查新消息和未读）
  listPollTimer = setInterval(() => {
    loadGroups()
  }, 5000)
})

onUnmounted(() => {
  if (listPollTimer) clearInterval(listPollTimer)
})
</script>

<script lang="ts">
export default { name: 'MobileChat' }
</script>

<style scoped>
.chat-page {
  height: 100%;
  background: #f7f8fa;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.chat-list {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  min-height: 0;
  overscroll-behavior: contain;
}

/* tab 内容面板：撑满剩余空间，让内部滚动生效 */
.tab-panel,
.todo-tab,
.ai-tab {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.todo-section { padding: 0 0 8px; }
.todo-tab { overflow-y: auto; -webkit-overflow-scrolling: touch; }

/* 审核待办紧凑行 */
.pending-section { background: #fff; border-bottom: 1px solid #f0f0f0; }
.pending-row {
  display: flex; align-items: center; gap: 8px;
  padding: 10px 16px; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.pending-row:active { background: #f9f9f9; }
.pending-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
.pending-label { flex: 1; font-size: 14px; color: #1d2129; font-weight: 500; }
.pending-count { font-size: 12px; color: #f53f3f; font-weight: 600; }

/* 筛选pills */
.task-filter-row {
  display: flex; gap: 6px; padding: 10px 16px 8px;
  background: #fff; border-bottom: 1px solid #f5f5f5;
}
.task-filter-pill {
  display: inline-flex; align-items: center; gap: 3px;
  padding: 4px 11px; border-radius: 999px;
  font-size: 12px; font-weight: 500; color: #86909c; background: #f5f5f7;
  cursor: pointer; white-space: nowrap; -webkit-tap-highlight-color: transparent; transition: all 0.15s;
}
.task-filter-pill.active { background: #1d2129; color: #fff; }
.task-pill-badge {
  font-size: 10px; background: #f53f3f; color: #fff;
  border-radius: 999px; padding: 0 4px; min-width: 14px; text-align: center; line-height: 1.4;
}
.task-filter-pill.active .task-pill-badge { background: rgba(255,255,255,0.25); }

/* 任务列表主体 */
.task-list-body { background: #fff; }
.task-empty-state {
  display: flex; flex-direction: column; align-items: center; gap: 8px;
  padding: 40px 0; color: #c9cdd4; font-size: 13px;
}

/* 任务行 */
.task-row-wrap { position: relative; overflow: hidden; }
.task-row-actions {
  position: absolute; right: 0; top: 0; bottom: 0;
  display: flex; align-items: stretch; z-index: 1;
}
.task-row-btn {
  display: flex; align-items: center; justify-content: center;
  width: 68px; font-size: 13px; font-weight: 600; color: #fff; cursor: pointer;
}
.btn-start { background: #2E6BE6; }
.btn-done { background: #00b42a; }
.task-row-wrap.swiped > .task-row { transform: translateX(-136px); }
.task-row {
  display: flex; align-items: center; gap: 12px;
  padding: 13px 16px; background: #fff;
  border-bottom: 1px solid #f5f5f5; cursor: pointer;
  transition: transform 0.2s; position: relative; z-index: 2;
  -webkit-tap-highlight-color: transparent;
}
.task-row:active { background: #fafafa; }

/* 状态圆点 */
.task-row-dot {
  width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0;
}
.dot-todo { background: #d0d0d0; }
.dot-doing { background: #2E6BE6; }
.dot-done { background: #00b42a; }

.task-row-body { flex: 1; min-width: 0; }
.task-row-title {
  font-size: 15px; color: #1d2129; font-weight: 500;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.task-row-done { text-decoration: line-through; color: #c9cdd4; }
.task-row-meta { display: flex; gap: 8px; margin-top: 3px; }
.task-meta-assignee { font-size: 11px; color: #2E6BE6; }
.task-meta-due { font-size: 11px; color: #86909c; }
.task-meta-due.overdue { color: #f53f3f; }

/* 状态标签 */
.task-row-status-tag {
  font-size: 11px; padding: 2px 8px; border-radius: 999px; flex-shrink: 0; font-weight: 500;
}
.stag-todo { background: #f5f5f7; color: #86909c; }
.stag-doing { background: #e8f0ff; color: #2E6BE6; }
.stag-done { background: #e8fff0; color: #00b42a; }

/* 新建按钮 */
.task-add-row { padding: 12px 16px; background: #fff; border-top: 1px solid #f5f5f5; }
.task-add-btn {
  display: flex; align-items: center; justify-content: center; gap: 6px;
  width: 100%; padding: 11px; border: 1.5px dashed #d0d0d0; border-radius: 10px;
  background: transparent; font-size: 14px; color: #86909c; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: all 0.15s;
}
.task-add-btn:active { border-color: #2E6BE6; color: #2E6BE6; }

/* 新建/详情表单样式 */
.add-plan-sheet { max-height: 75dvh; min-height: auto; }
.plan-input {
  width: 100%; height: 46px; background: #f5f5f7; border: none;
  border-radius: 10px; padding: 0 14px; font-size: 15px; color: #1d2129;
  outline: none; box-sizing: border-box;
}
.plan-input:focus { background: #eef2ff; }
.plan-textarea {
  width: 100%; min-height: 60px; background: #f5f5f7; border: none;
  border-radius: 10px; padding: 12px 14px; font-size: 14px; color: #1d2129;
  resize: none; box-sizing: border-box; outline: none;
}
.plan-textarea:focus { background: #eef2ff; }
.plan-field-row {
  display: flex; align-items: center; gap: 12px;
}
.plan-field-row label {
  font-size: 13px; color: #86909c; font-weight: 500; white-space: nowrap; min-width: 52px;
}
.plan-input-sm {
  flex: 1; height: 38px; background: #f5f5f7; border: none;
  border-radius: 8px; padding: 0 12px; font-size: 14px; color: #1d2129; outline: none;
}
.plan-priority-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.plan-priority-btn {
  padding: 5px 12px; border: 1px solid #e5e6eb; border-radius: 999px;
  font-size: 13px; color: #4e5969; background: #fff; cursor: pointer;
  -webkit-tap-highlight-color: transparent; transition: all 0.15s;
}
.plan-priority-btn.active { background: #2E6BE6; color: #fff; border-color: #2E6BE6; }
.plan-assignee-wrap { flex: 1; cursor: pointer; }
.plan-assignee-placeholder { font-size: 14px; color: #c9cdd4; padding: 6px 0; }
.plan-assignee-chips { display: flex; flex-wrap: wrap; gap: 5px; }
.plan-chip {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 13px; color: #2E6BE6; background: #e8f0ff;
  padding: 3px 8px; border-radius: 999px;
}
.plan-chip span { cursor: pointer; font-size: 15px; line-height: 1; }
.plan-assignee-picker {
  background: #f7f8fa; border-radius: 10px; padding: 6px 0;
  max-height: 180px; overflow-y: auto;
}
.plan-assignee-item {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 12px; cursor: pointer; -webkit-tap-highlight-color: transparent;
}
.plan-assignee-item:active { background: #f0f4ff; }
.plan-assignee-item.selected { background: #f0f4ff; }
.plan-assignee-avatar {
  width: 28px; height: 28px; border-radius: 50%;
  background: #2E6BE6; color: #fff; display: flex;
  align-items: center; justify-content: center; font-size: 13px; font-weight: 600; flex-shrink: 0;
}
.plan-assignee-item span:nth-child(2) { flex: 1; font-size: 14px; color: #1d2129; }

.plan-submit-btn {
  width: 100%; height: 50px; background: #2E6BE6; border: none;
  border-radius: 12px; font-size: 16px; font-weight: 600; color: #fff; cursor: pointer;
}
.plan-submit-btn:disabled { background: #c9cdd4; cursor: not-allowed; }
.plan-remind-btn {
  flex: 1; height: 44px; background: #fff; border: 1px solid #2E6BE6;
  border-radius: 10px; font-size: 14px; font-weight: 500; color: #2E6BE6; cursor: pointer;
}
.plan-delete-btn {
  height: 44px; padding: 0 20px; background: #fff; border: 1px solid #ff4d4f;
  border-radius: 10px; font-size: 14px; font-weight: 500; color: #ff4d4f; cursor: pointer;
}

/* 内联新建表单（旧，保留兼容） */
.inline-add-form {
  background: #f7f8fa;
  border-radius: 12px;
  padding: 16px;
  margin: 12px 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.inline-form-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 600;
  color: #1d2129;
  padding-bottom: 12px;
  border-bottom: 1px solid #e5e6eb;
}
.inline-form-cancel {
  font-size: 14px;
  color: #86909c;
  cursor: pointer;
  padding: 4px 8px;
}
.inline-form-cancel:active {
  color: #2E6BE6;
}

/* 切换按钮行 */
.todo-toggle-row {
  display: flex;
  gap: 10px;
  padding: 8px 16px 16px;
}
.todo-done-btn {
  flex: 1;
  height: 38px;
  background: #fff;
  border: 1px solid #2E6BE6;
  border-radius: 6px;
  color: #2E6BE6;
  font-size: 14px;
  cursor: pointer;
}
.todo-done-btn:active { opacity: 0.85; }
.chat-name.done { text-decoration: line-through; color: #C9CDD4; }
.chat-time.overdue { color: #F53F3F; font-weight: 500; }

/* ── 企业微信风格顶部导航栏 ── */
.wx-nav-bar {
  background: #fff;
  display: flex;
  align-items: center;
  height: 48px;
  padding: 0 8px;
  position: sticky;
  top: 0;
  z-index: 20;
  padding-top: env(safe-area-inset-top, 0px);
}
.wx-nav-left { flex: 1; display: flex; align-items: center; }
.wx-nav-title {
  flex: 0 0 auto;
  font-size: 17px;
  font-weight: 700;
  color: #1d2129;
  text-align: center;
  padding: 0 8px;
}
.wx-nav-right { flex: 1; display: flex; align-items: center; justify-content: flex-end; gap: 2px; }
.nav-icon-btn {
  width: 40px;
  height: 40px;
  border: none;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 6px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.15s;
}
.nav-icon-btn:active { background: #f0f0f5; }

/* ── 搜索栏 ── */
.chat-search-bar {
  background: #fff;
  padding: 10px 16px;
  cursor: pointer;
  flex-shrink: 0;
}
.chat-search-inner {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f6f8;
  border-radius: 10px;
  padding: 9px 14px;
}
.chat-search-placeholder { font-size: 14px; color: #b4bbc5; }

/* ── 子Tab ── */
.chat-sub-tabs {
  background: #fff;
  display: flex;
  flex-shrink: 0;
}
.chat-sub-tab {
  flex: 1;
  text-align: center;
  padding: 11px 0;
  font-size: 15px;
  color: #86909c;
  cursor: pointer;
  position: relative;
  -webkit-tap-highlight-color: transparent;
  transition: color 0.15s;
}
.chat-sub-tab.active { color: #1d2129; font-weight: 700; }
.tab-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  background: #f53f3f;
  color: #fff;
  font-size: 10px;
  font-weight: 700;
  border-radius: 8px;
  margin-left: 4px;
  vertical-align: middle;
  line-height: 1;
}
.chat-sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 3px;
  background: #2E6BE6;
  border-radius: 2px;
}

/* ── 会议室入口 ── */
.chat-meeting-bar {
  background: #fff;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f0f0f0;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.chat-meeting-bar:active { background: #f5f5f5; }
.chat-meeting-icon {
  width: 36px;
  height: 36px;
  background: rgba(46,107,230,0.08);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.chat-meeting-text { font-size: 14px; font-weight: 600; color: #1d2129; flex: 1; }
.chat-meeting-sub { font-size: 12px; color: #F5A623; font-weight: 500; }
.chat-meeting-arrow { font-size: 18px; color: #ccc; }

/* ── 消息列表 ── */
.chat-list { background: #f7f8fa; }
.chat-empty { text-align: center; padding: 60px 0; color: #999; }
.chat-empty-icon { margin-bottom: 10px; }
.chat-empty-text { font-size: 14px; }
.chat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  cursor: pointer;
  background: #fff;
  margin-bottom: 1px;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
  position: relative;
}
.chat-item:last-child { margin-bottom: 0; }
.chat-item:active { background: #f5f7fa; }
.chat-avatar-wrap { position: relative; flex-shrink: 0; }
.chat-avatar {
  width: 50px;
  height: 50px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 17px;
  font-weight: 700;
  background: #2E6BE6;
  box-shadow: 0 2px 8px rgba(46,107,230,0.18);
}
.chat-avatar--sm { width: 40px; height: 40px; font-size: 14px; border-radius: 6px; }
.chat-avatar--meeting {
  background: rgba(99,102,241,0.12);
  color: #6366f1;
}
.chat-item--meeting {
  background: linear-gradient(135deg, rgba(99,102,241,0.04) 0%, rgba(139,92,246,0.04) 100%);
}
.chat-item--meeting:active {
  background: linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.08) 100%);
}
.chat-unread-dot {
  position: absolute;
  top: -2px;
  right: -2px;
  width: 10px;
  height: 10px;
  background: #f53f3f;
  border-radius: 50%;
  border: 2px solid #fff;
}
.chat-body { flex: 1; min-width: 0; }
.chat-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; margin-bottom: 5px; }
.chat-name { font-size: 15.5px; font-weight: 600; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; letter-spacing: 0.2px; }
.chat-time { font-size: 12px; color: #c9cdd4; flex-shrink: 0; }
.chat-bottom { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.chat-msg { font-size: 13px; color: #86909c; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; flex: 1; }
.chat-badge {
  min-width: 19px;
  height: 19px;
  background: linear-gradient(135deg, #ff4d4f, #f53f3f);
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 5.5px;
  flex-shrink: 0;
  box-shadow: 0 1px 4px rgba(245,63,63,0.35);
}
.todo-item .chat-body { min-width: 0; }
.todo-item .chat-name { font-size: 14px; }

/* ── AI管家 Tab ── */
.ai-tab { padding: 16px; }
.ai-banner {
  background: linear-gradient(135deg, #2E6BE6 0%, #4A8BF5 100%);
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: opacity 0.15s;
}
.ai-banner:active { opacity: 0.85; }
.ai-avatar { font-size: 40px; line-height: 1; }
.ai-title { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.ai-sub { font-size: 13px; color: rgba(255,255,255,0.75); }

/* ── 搜索全屏 ── */
.search-fullscreen { position: relative; z-index: 30; }
.chat-search-panel {
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  padding: 8px 12px;
}
.chat-search-bar-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.chat-search-inner-input {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f2f3f5;
  border-radius: 6px;
  padding: 7px 10px;
}
.chat-search-input {
  flex: 1;
  border: none;
  background: transparent;
  font-size: 14px;
  color: #333;
  outline: none;
}
.chat-search-input::placeholder { color: #999; }
.chat-search-clear { border: none; background: transparent; cursor: pointer; padding: 2px; display: flex; }
.chat-search-cancel { border: none; background: transparent; color: #2E6BE6; font-size: 14px; cursor: pointer; white-space: nowrap; }
.chat-search-result { background: #fff; min-height: 200px; }
.chat-search-hint { text-align: center; padding: 40px; color: #999; font-size: 14px; }
.chat-search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid #f5f5f5;
}
.chat-search-item:active { background: #f5f5f5; }
.chat-search-item :deep(mark) { background: rgba(46,107,230,0.12); color: #2E6BE6; border-radius: 2px; }

/* ── 左侧抽屉 ── */
.drawer-mask {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  z-index: 300;
  animation: fadeIn 0.2s ease;
}
.drawer {
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  width: 82vw;
  max-width: 320px;
  background: #f5f5f7;
  z-index: 301;
  transform: translateX(-100%);
  transition: transform 0.25s ease;
  display: flex;
  flex-direction: column;
  padding-top: env(safe-area-inset-top, 0px);
}
.drawer.open { transform: translateX(0); }

.drawer-scroll {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 16px);
}

/* 用户卡片 */
.drawer-hero {
  background: linear-gradient(135deg, #0071e3 0%, #005bb5 100%);
  padding: 28px 16px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.drawer-avatar {
  width: 60px; height: 60px;
  border-radius: 50%;
  background: rgba(255,255,255,0.2);
  border: 2px solid rgba(255,255,255,0.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 24px; font-weight: 700; color: #fff;
  margin-bottom: 10px;
}
.drawer-name { font-size: 18px; font-weight: 700; color: #fff; margin-bottom: 3px; }
.drawer-company { font-size: 12px; color: rgba(255,255,255,0.7); }

/* 数据卡片 */
.drawer-stats {
  display: flex; align-items: center;
  background: #fff;
  margin: -14px 12px 0;
  border-radius: 12px;
  padding: 14px 8px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  position: relative; z-index: 1;
  margin-bottom: 14px;
}
.drawer-stat { flex: 1; text-align: center; cursor: pointer; }
.drawer-stat:active { opacity: 0.7; }
.drawer-stat-val { font-size: 17px; font-weight: 800; color: #1d2129; }
.drawer-stat-label { font-size: 10px; color: #86909c; margin-top: 2px; }
.drawer-stat-divider { width: 1px; height: 24px; background: #f2f3f5; }

/* 区块标题 */
.drawer-section-title {
  font-size: 11px; font-weight: 700; color: #86909c;
  padding: 0 14px 6px;
  text-transform: uppercase; letter-spacing: 0.05em;
}

/* 协作工具 2x2 grid */
.drawer-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  padding: 0 12px 14px;
}
.drawer-grid-item {
  background: #fff;
  border-radius: 10px;
  padding: 12px;
  font-size: 13px; font-weight: 600; color: #1d2129;
  text-align: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.drawer-grid-item:active { background: #f0f5ff; }

/* 菜单列表 */
.drawer-menu-list {
  background: #fff;
  border-radius: 12px;
  margin: 0 12px 14px;
  overflow: hidden;
}
.drawer-menu-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 14px;
  font-size: 14px; font-weight: 600; color: #1d2129;
  cursor: pointer;
  border-bottom: 1px solid #f7f8fa;
  -webkit-tap-highlight-color: transparent;
}
.drawer-menu-item:last-child { border-bottom: none; }
.drawer-menu-item:active { background: #f5f5f7; }

/* 退出 */
.drawer-logout-wrap { padding: 0 12px; margin-bottom: 10px; }
.drawer-logout-btn {
  width: 100%; height: 44px;
  background: #fff; border: 1px solid #e5e6eb; border-radius: 10px;
  font-size: 14px; font-weight: 600; color: #f53f3f; cursor: pointer;
}
.drawer-logout-btn:active { background: #fff5f5; }

/* 版本 */
.drawer-version {
  text-align: center; font-size: 11px; color: #c2c8d5; padding-bottom: 8px;
}

/* ── + 号下拉菜单 ── */
.plus-menu-mask {
  position: fixed;
  inset: 0;
  z-index: 198;
}

/* 发起群聊 */
.group-search-input {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 6px 10px;
  margin-top: 6px;
}
.group-search-input input {
  border: none;
  background: none;
  outline: none;
  flex: 1;
  font-size: 14px;
}
.group-name-input {
  width: 100%;
  border: none;
  background: #f5f5f5;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}
.selected-members-bar {
  padding: 8px 16px;
  border-bottom: 1px solid #f2f3f5;
  flex-shrink: 0;
}
.selected-members-scroll {
  display: flex;
  gap: 8px;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.selected-member-chip {
  display: flex;
  align-items: center;
  gap: 2px;
  background: #e8f5e9;
  color: #07c160;
  border-radius: 14px;
  padding: 3px 8px 3px 6px;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.selected-member-chip span {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: #07c160;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
}
.group-contact-item {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  gap: 10px;
}
.group-contact-item:active { background: #f5f5f5; }
.group-contact-avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: #07c160;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  flex-shrink: 0;
}
.group-contact-name { flex: 1; font-size: 15px; color: #1d2129; }
.group-contact-check { flex-shrink: 0; }
.group-create-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: #07c160;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
}
.group-create-btn:disabled { background: #ccc; color: #fff; }

/* 添加朋友弹窗 */
.add-friend-body { padding: 20px 16px 16px; }
.add-friend-hint { font-size: 13px; color: #86909c; margin: 0 0 12px; }
.add-friend-input-row { display: flex; gap: 8px; }
.add-friend-input {
  flex: 1;
  height: 40px;
  border: 1.5px solid #e5e6eb;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 15px;
  outline: none;
  color: #1d2129;
}
.add-friend-input:focus { border-color: #2E6BE6; }
.add-friend-search-btn {
  height: 40px;
  padding: 0 16px;
  background: #2E6BE6;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}
.add-friend-search-btn:disabled { background: #ccc; }
.add-friend-result {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 20px;
  padding: 14px;
  background: #f7f8fa;
  border-radius: 10px;
}
.add-friend-avatar {
  width: 44px;
  height: 44px;
  border-radius: 10px;
  background: linear-gradient(135deg, #2E6BE6, #07c160);
  color: #fff;
  font-size: 18px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.add-friend-info { flex: 1; min-width: 0; }
.add-friend-name { font-size: 15px; font-weight: 600; color: #1d2129; }
.add-friend-role { font-size: 12px; color: #86909c; margin-top: 2px; }
.add-friend-chat-btn {
  padding: 8px 14px;
  background: #07c160;
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}
.add-friend-empty { margin-top: 20px; text-align: center; color: #86909c; font-size: 14px; padding: 20px 0; }

/* 好友申请区块 */
.fr-section { background: #fff; margin-bottom: 8px; }
.fr-section-title { padding: 12px 16px 6px; font-size: 12px; color: #86909c; font-weight: 500; }
.fr-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 16px;
  border-bottom: 1px solid #f7f8fa;
}
.fr-avatar {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: linear-gradient(135deg, #f59e0b, #ef4444);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.fr-info { flex: 1; min-width: 0; }
.fr-name { font-size: 14px; font-weight: 600; color: #1d2129; }
.fr-sub { font-size: 12px; color: #86909c; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.fr-actions { display: flex; gap: 6px; flex-shrink: 0; }
.fr-btn {
  height: 30px;
  padding: 0 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  border: none;
  cursor: pointer;
}
.fr-reject { background: #f2f3f5; color: #4e5969; }
.fr-accept { background: #07c160; color: #fff; }

/* Modal (same as MobileGroupChat) */
.m-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 100dvh;
  background: rgba(0,0,0,0.5);
  z-index: 999;
  display: flex;
  align-items: flex-end;
}
.m-modal-sheet {
  background: #fff;
  border-radius: 16px 16px 0 0;
  width: 100%;
  /* 高度用 dvh 配合 bottom padding，确保底部按钮不被 TabBar 遮挡 */
  max-height: 100dvh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.25s ease;
  box-sizing: border-box;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}
.m-modal-sheet-tall { max-height: 100dvh; }
.m-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid #f2f3f5;
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
  flex-shrink: 0;
}
.m-modal-close { border: none; background: transparent; color: #0071e3; font-size: 14px; cursor: pointer; }
.m-modal-body { flex: 1; min-height: 0; overflow-y: auto; padding: 0; padding-bottom: env(safe-area-inset-bottom, 0px); touch-action: pan-y; -webkit-overflow-scrolling: touch; }
.m-modal-footer { padding: 14px 16px; padding-bottom: calc(16px + env(safe-area-inset-bottom, 20px)); border-top: 1px solid #f2f3f5; flex-shrink: 0; }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
.plus-menu {
  position: fixed;
  background: #fff;
  border-radius: 10px;
  width: 140px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  z-index: 199;
  overflow: hidden;
  animation: fadeIn 0.15s ease;
}
.plus-menu::before {
  content: '';
  position: absolute;
  width: 12px;
  height: 12px;
  background: #fff;
  transform: rotate(45deg);
  box-shadow: -2px -2px 4px rgba(0,0,0,0.06);
}
.chat-plus-menu::before { top: -6px; right: 16px; }
.fab-plus-menu::before { bottom: -6px; right: 16px; }
.plus-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 14px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.1s;
}
.plus-menu-item:active { background: #f5f5f5; }
.plus-menu-item + .plus-menu-item { border-top: 1px solid #f0f0f0; }
.plus-menu-item svg { color: #666; flex-shrink: 0; }

/* ── 置顶标识 ── */
.chat-item--pinned { background: #fafafa; }
.chat-pin-icon { position: absolute; top: 8px; left: 4px; font-size: 10px; }
.group-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 6px;
  padding: 0 5px;
  height: 16px;
  background: #2E6BE6;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  border-radius: 3px;
  vertical-align: middle;
}

/* ── 左滑操作 ── */
.chat-item-wrap {
  position: relative;
  overflow: hidden;
}
.chat-item-actions {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  display: none;
  z-index: 1;
  align-items: center;
}
.chat-item-wrap.swiped .chat-item-actions {
  display: flex;
}
.chat-item-wrap.swiped > .chat-item {
  transform: translateX(-160px);
}
.chat-item-wrap.swiped.one-action > .chat-item {
  transform: translateX(-80px);
}
.chat-item {
  transition: transform 0.2s ease;
  position: relative;
  z-index: 2;
}
.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80px;
  height: 100%;
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
}
.pin-btn {
  background: #f5a623;
}
.clear-btn {
  background: #909399;
}
.delete-btn {
  background: #ff4d4f;
}

/* ── 右键/长按菜单 ── */
.context-menu-mask {
  position: fixed; inset: 0; z-index: 999;
  background: transparent;
}
.context-menu {
  position: fixed; z-index: 1000;
  background: rgba(255,255,255,0.98);
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.18);
  overflow: hidden;
  min-width: 140px;
  backdrop-filter: blur(10px);
}
.ctx-item {
  display: flex; align-items: center; gap: 10px;
  padding: 13px 16px;
  font-size: 14px; color: #333;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  border-bottom: 1px solid #f0f0f0;
}
.ctx-item:last-child { border-bottom: none; }
.ctx-item:active { background: #f5f5f5; }
.ctx-item svg { color: #666; flex-shrink: 0; }
.ctx-item--danger { color: #ee4444; }
.ctx-item--danger svg { color: #ee4444; }

/* ── 右下角快捷操作按钮（可拖动） ── */
.chat-fab {
  position: fixed;
  width: 50px;
  height: 50px;
  background: #2E6BE6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(46,107,230,0.4);
  -webkit-tap-highlight-color: transparent;
  z-index: 50;
  transition: transform 0.15s, box-shadow 0.15s, left 0.2s ease;
  touch-action: none;
}
.chat-fab:active { transform: scale(0.92); box-shadow: 0 2px 6px rgba(46,107,230,0.3); }

/* ── 菜单定位区分 ── */
.chat-plus-menu {
  top: 50px;
  right: 12px;
}
.fab-plus-menu {
  right: auto;
  top: auto;
}
.fab-plus-title {
  padding: 10px 16px 6px;
  font-size: 12px;
  color: #999;
  font-weight: 500;
}

@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
</style>

/* ── 新建计划弹窗样式 ── */
.task-modal-mask {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000;
  display: flex; align-items: flex-end; justify-content: center;
}
.task-modal-sheet {
  background: #fff; border-radius: 16px 16px 0 0;
  width: 100%; height: auto;
  max-height: min(92vh, 100dvh); min-height: 60vh;
  display: flex; flex-direction: column; overflow: hidden;
  animation: slideUp 0.2s ease;
  padding-bottom: env(safe-area-inset-bottom); box-sizing: border-box;
}
.task-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 16px 12px; border-bottom: 1px solid #f2f3f5; flex-shrink: 0;
  font-size: 16px; font-weight: 600; color: #1d2129;
}
.task-modal-close {
  font-size: 14px; color: #2E6BE6; background: none; border: none;
  cursor: pointer; padding: 4px 8px;
}
.task-modal-body {
  flex: 1; overflow-y: auto; padding: 16px;
  display: flex; flex-direction: column; gap: 14px;
  -webkit-overflow-scrolling: touch;
}
.task-input {
  width: 100%;
  height: 44px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 0 14px;
  font-size: 15px;
  color: #1d2129;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}
.task-input:focus { border-color: #2E6BE6; }
.task-textarea {
  width: 100%;
  min-height: 60px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 15px;
  color: #1d2129;
  resize: none;
  box-sizing: border-box;
  outline: none;
  transition: border-color 0.2s;
}
.task-textarea:focus { border-color: #2E6BE6; }
.task-field-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
}
.task-field-row label {
  font-size: 14px;
  color: #1d2129;
  font-weight: 500;
  white-space: nowrap;
  min-width: 70px;
}
.task-select {
  flex: 1;
  height: 44px;
  background: #fff;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 0 12px;
  font-size: 15px;
  color: #1d2129;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2386909c' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
}
.task-select:focus {
  border-color: #2E6BE6;
}
.task-submit-btn {
  width: 100%;
  height: 48px;
  background: linear-gradient(135deg, #2E6BE6 0%, #1d4ed8 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  box-shadow: 0 2px 8px rgba(46, 107, 230, 0.25);
}
.task-submit-btn:active {
  transform: scale(0.98);
  opacity: 0.95;
}
.task-submit-btn:disabled {
  background: #C9CDD4;
  cursor: not-allowed;
  box-shadow: none;
}
