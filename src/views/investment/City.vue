<template>
  <div class="city-page" :class="{ 'city-page--embed': embed }">
    <!-- 左侧状态栏 -->
    <aside v-if="!embed" class="city-sidebar" :class="{ collapsed: sidebarCollapsed }">
      <button class="city-sidebar-toggle" @click="sidebarCollapsed = !sidebarCollapsed" :title="sidebarCollapsed ? t('city.expandSidebar') : t('city.collapseSidebar')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path v-if="sidebarCollapsed" d="M9 18l6-6-6-6"/>
          <path v-else d="M15 18l-6-6 6-6"/>
        </svg>
      </button>
      <!-- 详情面板（选中机构时） -->
      <div v-if="!sidebarCollapsed && selectedInst" class="detail-panel">
        <div class="detail-header">
          <span class="detail-emoji">{{ getEmoji(selectedInst.institutionId) }}</span>
          <div class="detail-title-wrap">
            <span class="detail-name">{{ displayInstitutionName(selectedInst.institutionId, selectedInst.name) }}</span>
            <span class="detail-status-tag" :class="selectedInst.status">{{ statusLabel(selectedInst.status) }}</span>
          </div>
          <button class="detail-close" @click="selectedId = null">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M1 1l8 8M9 1l-8 8"/>
            </svg>
          </button>
        </div>

        <!-- 进入大厅 -->
        <button
          v-if="selectedBuilding && selectedBuilding.status !== 'planned'"
          class="detail-enter-hall"
          @click="enterHall(selectedInst.institutionId)"
        >▸ {{ t('city.enterHallPrefix') }}{{ displayInstitutionName(selectedInst.institutionId, selectedInst.name) }}{{ t('city.hallSuffix') }}</button>

        <!-- 建筑信息 -->
        <div v-if="selectedBuilding" class="detail-section">
          <div class="detail-section-title">{{ t('city.buildingInfo') }}</div>
          <div class="detail-row">
            <span class="detail-label">{{ t('city.status') }}</span>
            <span class="detail-value" :class="selectedBuilding.status">{{ buildingStatusLabel(selectedBuilding.status) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('city.coordinates') }}</span>
            <span class="detail-value mono">({{ selectedBuilding.position.gridX }}, {{ selectedBuilding.position.gridY }})</span>
          </div>
          <div v-if="selectedBuilding.upgradeHistory?.length" class="detail-row">
            <span class="detail-label">{{ t('city.upgrade') }}</span>
            <span class="detail-value mono">LV.{{ selectedBuilding.upgradeHistory.length }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">{{ t('city.constructedAt') }}</span>
            <span class="detail-value mono">{{ formatDate(selectedBuilding.constructedAt) }}</span>
          </div>
        </div>

        <!-- 投资局专属：真实资产（HTX） -->
        <div v-if="selectedInst.institutionId === 'bureau'" class="detail-section fund-section">
          <div class="detail-section-title">{{ t('city.fundAccount') }}</div>
          <template v-if="adamStore.realAssets">
            <div class="fund-balance-row">
              <div class="fund-balance-block">
                <span class="fund-balance-label">{{ t('city.spotAvail') }}</span>
                <span class="fund-balance-val">{{ adamStore.realAssets.spot_usdt.toFixed(2) }} U</span>
              </div>
              <div class="fund-balance-block">
                <span class="fund-balance-label">{{ t('city.savingsBal') }}</span>
                <span class="fund-balance-val">{{ adamStore.realAssets.savings_usdt.toFixed(2) }} U</span>
              </div>
              <div class="fund-balance-block">
                <span class="fund-balance-label">{{ t('city.positionVal') }}</span>
                <span class="fund-balance-val">{{ adamStore.realAssets.position_value_usdt.toFixed(2) }} U</span>
              </div>
              <div class="fund-balance-block">
                <span class="fund-balance-label">{{ t('city.totalAssets') }}</span>
                <span class="fund-balance-val positive">{{ adamStore.realAssets.total_usdt.toFixed(2) }} U</span>
              </div>
            </div>
            <div v-for="p in adamStore.realAssets.positions" :key="p.symbol" class="ledger-row">
              <span class="ledger-dir in">◆</span>
              <span class="ledger-desc">{{ p.symbol }} × {{ p.qty }}</span>
              <span class="ledger-amount in">{{ p.value_usdt.toFixed(2) }} U</span>
              <span class="ledger-time">@{{ p.price }}</span>
            </div>
          </template>
          <div v-else class="detail-empty">{{ t('city.assetsLoading') }}</div>
        </div>

        <!-- 机构状态控制 -->
        <div class="detail-section">
          <div class="detail-section-title">{{ t('city.statusControl') }}</div>
          <div class="inst-status-control">
            <span class="cur-status" :class="selectedInst.status">{{ statusLabel(selectedInst.status) }}</span>
            <div class="status-btns">
              <button
                v-if="selectedInst.status !== 'active'"
                class="status-btn activate"
                :disabled="selectedInst.status === 'locked'"
                @click="adamStore.setInstitutionStatus(selectedInst.institutionId, 'active')"
              >{{ t('city.activate') }}</button>
              <button
                v-if="selectedInst.status === 'active'"
                class="status-btn deactivate"
                @click="adamStore.setInstitutionStatus(selectedInst.institutionId, 'idle')"
              >{{ t('city.deactivate') }}</button>
            </div>
          </div>
          <div class="status-hint" v-if="selectedInst.status !== 'active'">
            {{ t('city.inactiveHint') }}
          </div>
        </div>

        <!-- 工具列表 -->
        <div class="detail-section">
          <div class="detail-section-title">{{ t('city.tools') }} <span class="tool-count">{{ selectedInst.toolIds.length }}</span></div>
          <div v-if="selectedInst.toolIds.length" class="tool-grid">
            <button
              v-for="tid in selectedInst.toolIds"
              :key="tid"
              class="tool-chip"
              :class="{ running: toolRunning === tid, done: toolResults[tid] !== undefined && toolRunning !== tid }"
              :disabled="!!toolRunning"
              @click="executeTool(tid)"
            >
              <span class="tool-indicator" :class="{ spin: toolRunning === tid }"></span>
              {{ toolDisplayName(tid) }}
            </button>
          </div>
          <span v-else class="detail-empty">{{ t('city.noTools') }}</span>
          <!-- 工具执行结果 -->
          <div v-if="toolResultDisplay" class="tool-result-panel">
            <div class="tool-result-head">
              <span class="tool-result-name">{{ toolDisplayName(toolResultId) }}</span>
              <button class="tool-result-close" @click="toolResultDisplay = ''">×</button>
            </div>
            <pre class="tool-result-body">{{ toolResultDisplay }}</pre>
          </div>
        </div>

        <!-- 贷款审批（仅金融机构显示） -->
        <div v-if="selectedId === 'finance_gateway' && pendingLoans.length" class="detail-section">
          <div class="detail-section-title">{{ t('city.pendingLoans') }} <span class="tool-count">{{ pendingLoans.length }}</span></div>
          <div v-for="loan in pendingLoans" :key="loan.id" class="loan-item">
            <div class="loan-info">
              <span class="loan-amount">¥{{ loan.metadata?.amount }}</span>
              <span class="loan-purpose">{{ loan.metadata?.purpose }}</span>
            </div>
            <div class="loan-actions">
              <button class="loan-btn approve" @click="approveLoan(loan)">{{ t('city.approve') }}</button>
              <button class="loan-btn reject" @click="rejectLoan(loan)">{{ t('city.reject') }}</button>
            </div>
          </div>
        </div>

        <!-- 最近活动 -->
        <div class="detail-section">
          <div class="detail-section-title">{{ t('city.recentActivity') }}</div>
          <div v-if="selectedInst.recentTrace" class="detail-trace">
            <span class="trace-indicator"></span>
            {{ selectedInst.recentTrace }}
          </div>
          <div v-else class="detail-empty">{{ t('city.idle') }}</div>
          <div v-if="relatedEvents.length" class="detail-events">
            <div v-for="ev in relatedEvents" :key="ev.id" class="detail-event-item">
              <span class="detail-event-dot" :class="ev.stage"></span>
              <span class="detail-event-time">{{ formatTime(ev.at) }}</span>
              <span class="detail-event-text">{{ ev.title }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 机构列表（未选中时） -->
      <div v-show="!sidebarCollapsed && !selectedInst" class="inst-list-wrap">
        <div class="sidebar-title-bar">
          <span class="sidebar-title">{{ t('city.institutions') }}</span>
          <span class="sidebar-count">{{ adamStore.institutions.length }}</span>
        </div>
        <div class="sidebar-section" v-for="zone in zoneList" :key="zone.key">
          <div class="sidebar-section-title">
            <span class="zone-indicator" :class="zone.key"></span>
            {{ zone.label }}
          </div>
          <div
            v-for="inst in zone.items"
            :key="inst.institutionId"
            class="inst-item"
            :class="[inst.status, { selected: selectedId === inst.institutionId }]"
            @click="selectedId = inst.institutionId"
          >
            <span class="inst-emoji">{{ getEmoji(inst.institutionId) }}</span>
            <div class="inst-info">
            <span class="inst-name">{{ displayInstitutionName(inst.institutionId, inst.name) }}</span>
            <span class="inst-status-label">{{ statusLabel(inst.status) }}</span>
            </div>
            <span class="inst-dot" :class="inst.status"></span>
          </div>
        </div>
      </div>
    </aside>

    <!-- 右侧城市等轴测地图 -->
    <div class="city-main">
      <div class="iso-viewport" ref="viewportRef"
           :class="['mood-' + moodLevel]"
           @wheel.prevent="onWheel"
           @mousedown="onDragStart"
           @contextmenu.prevent
           @touchstart.prevent="onTouchStart">

        <!-- 氛围指示徽章（右上角） -->
        <div class="mood-badge" :class="moodLevel" :title="moodTitle">
          <span class="mood-emoji">{{ moodEmoji }}</span>
          <span class="mood-text">{{ moodText }}</span>
          <span class="mood-pnl">{{ moodPnlText }}</span>
        </div>

        <!-- 雨/雪/雾效果（亏损时） -->
        <div v-if="moodLevel === 'rain' || moodLevel === 'storm'" class="weather-rain">
          <div v-for="i in (moodLevel === 'storm' ? 60 : 30)" :key="i" class="raindrop"
               :style="{ left: ((i * 17) % 100) + '%', animationDelay: ((i * 0.13) % 1.5) + 's' }"></div>
        </div>

        <!-- 区域浮动标签 -->
        <div class="zone-labels">
          <div class="zone-float-label command"><b>{{ t('city.zoneLabels.command') }}</b></div>
          <div class="zone-float-label intelligence"><b>{{ t('city.zoneLabels.intelligence') }}</b></div>
          <div class="zone-float-label commerce"><b>{{ t('city.zoneLabels.commerce') }}</b></div>
          <div class="zone-float-label adam"><b>{{ t('city.zoneLabels.adam') }}</b></div>
        </div>

        <!-- ── 等轴测场景 ── -->
        <div class="iso-scene" :style="sceneStyle">

          <!-- 地面格子 -->
          <div v-for="c in groundCells" :key="c.key" class="iso-ground" :class="c.type" :style="c.style">
            <div class="ground-top"></div>
            <div class="ground-left"></div>
            <div class="ground-right"></div>
          </div>

          <!-- 装饰树木 -->
          <div v-for="tree in decorTrees" :key="tree.key" class="deco-tree" :class="tree.size"
               :style="{ left: tree.x + 'px', top: tree.y + 'px', zIndex: 50 }">
            <div class="tree-top"></div>
            <div class="tree-trunk"></div>
          </div>

          <!-- 广场周边景观小品：水池 / 绿篱花园 / 雕塑 -->
          <div v-for="d in plazaDecor" :key="d.key" class="iso-decor" :style="d.style">
            <!-- 水池 -->
            <svg v-if="d.kind === 'pond'" viewBox="-40 -22 80 44" width="96" height="53">
              <ellipse cx="0" cy="0" rx="34" ry="17" fill="#dcd2b2" stroke="#4f4839" stroke-width="1.3"/>
              <ellipse cx="0" cy="0" rx="27" ry="13" fill="#a9c6c9" stroke="#4f4839" stroke-width="1.1"/>
              <ellipse cx="-6" cy="-3" rx="10" ry="4" fill="#c3d8da" stroke="none"/>
              <ellipse cx="10" cy="4" rx="5" ry="2" fill="#c3d8da" stroke="none" opacity="0.7"/>
            </svg>
            <!-- 绿篱花园 -->
            <svg v-else-if="d.kind === 'garden'" viewBox="-42 -26 84 52" width="100" height="62">
              <polygon points="0,-20 38,-1 0,18 -38,-1" fill="#b9c298" stroke="#4f4839" stroke-width="1.3"/>
              <polygon points="0,-14 26,-1 0,12 -26,-1" fill="#e9e0c6" stroke="#4f4839" stroke-width="1"/>
              <polygon points="0,-8 14,-1 0,6 -14,-1" fill="#a3ad80" stroke="#4f4839" stroke-width="1"/>
              <circle cx="0" cy="-22" r="3.5" fill="#9aa87a" stroke="#4f4839" stroke-width="1"/>
            </svg>
            <!-- 白色雕塑小品 -->
            <svg v-else viewBox="-20 -46 40 52" width="44" height="57">
              <ellipse cx="0" cy="0" rx="13" ry="6" fill="#dcd2b2" stroke="#4f4839" stroke-width="1.2"/>
              <rect x="-7" y="-8" width="14" height="7" fill="#ece6d4" stroke="#4f4839" stroke-width="1.1"/>
              <path d="M-3,-8 q-6,-14 4,-22 q12,-9 6,-22 q14,10 0,26 q-5,8 -1,18 z" fill="#f4f0e2" stroke="#4f4839" stroke-width="1.2" stroke-linejoin="round"/>
            </svg>
          </div>

          <!-- 中央亚当雕塑广场 -->
          <div class="iso-statue" :style="statueStyle">
            <AdamStatue />
          </div>

          <!-- 建筑物（插画精灵，深度排序后渲染） -->
          <div v-for="b in sortedBuildings" :key="b.key"
               class="iso-bldg illo-mode"
               :class="{ locked: b.locked, selected: selectedId === b.instId }"
               :style="b.posStyle"
               @click.stop="selectedId = b.instId; adamSelected = false"
               @dblclick.stop="enterHall(b.instId)">

            <IlloBuilding :type="b.instId" :locked="b.locked" :selected="selectedId === b.instId" />

            <!-- 名称+状态标签牌 -->
            <div class="bldg-callout" :class="{ on: selectedId === b.instId }">
              <span class="bc-name">{{ displayBuildingName(b.instId, b.name) }}</span>
              <span class="bc-status" :class="instStatusOf(b.instId)">{{ instStatusEn(b.instId, b.locked) }}</span>
            </div>

            <!-- 选中后的进入大厅按钮 -->
            <button
              v-if="selectedId === b.instId && !b.locked"
              class="bldg-enter-btn"
              @click.stop="enterHall(b.instId)"
              >▸ {{ t('city.enterHall') }}</button>
          </div>

          <!-- ── 亚当等轴测角色 ── -->
          <div
            v-if="adamStore.core.status !== 'shutdown'"
            class="adam-character"
            :class="{
              moving: adamStore.adamPosition.isMoving,
              dormant: adamStore.core.status === 'dormant',
              survival: adamStore.core.status === 'survival',
              working: adamWorking,
              selected: adamSelected,
            }"
            :style="adamPixelStyle"
            @click.stop="selectAdam()"
          >
            <svg class="adam-body-svg" width="80" height="120" viewBox="0 0 80 120" xmlns="http://www.w3.org/2000/svg">
              <!-- 帽子 -->
              <rect x="26" y="8" width="28" height="6" :fill="adamCoatColor" rx="2"/>
              <rect x="22" y="12" width="36" height="4" :fill="adamCoatColor" rx="1"/>
              <!-- 头部 -->
              <rect x="20" y="16" width="40" height="30" :fill="adamHeadColor" rx="6"/>
              <!-- 眼睛 -->
              <rect class="adam-eye-l" x="26" y="26" width="8" height="7" :fill="adamEyeColor" rx="2"/>
              <rect class="adam-eye-r" x="46" y="26" width="8" height="7" :fill="adamEyeColor" rx="2"/>
              <rect x="27" y="27" width="3" height="3" fill="white" opacity="0.6"/>
              <rect x="47" y="27" width="3" height="3" fill="white" opacity="0.6"/>
              <!-- 嘴 -->
              <rect v-if="adamMouth === 'smile'" x="30" y="38" width="20" height="3" :fill="adamEyeColor" rx="2"/>
              <rect v-if="adamMouth === 'neutral'" x="30" y="40" width="20" height="2" fill="#8E99A4" rx="1"/>
              <rect v-if="adamMouth === 'sad'" x="30" y="42" width="20" height="3" fill="#5B8DEF" rx="2"/>
              <!-- 耳朵 -->
              <rect x="14" y="24" width="6" height="10" :fill="adamHeadColor" rx="3"/>
              <rect x="60" y="24" width="6" height="10" :fill="adamHeadColor" rx="3"/>
              <!-- 身体 -->
              <rect class="adam-leg-l" x="20" y="46" width="36" height="36" :fill="adamCoatColor" rx="4"/>
              <!-- 标志 -->
              <rect x="34" y="50" width="12" height="6" fill="white" opacity="0.15" rx="2"/>
              <!-- 手臂 -->
              <rect class="adam-arm-l" x="8" y="48" width="12" height="28" :fill="adamCoatColor" rx="4"/>
              <rect class="adam-arm-r" x="60" y="48" width="12" height="28" :fill="adamCoatColor" rx="4"/>
              <!-- 手 -->
              <rect x="9" y="74" width="10" height="8" :fill="adamHeadColor" rx="3"/>
              <rect x="61" y="74" width="10" height="8" :fill="adamHeadColor" rx="3"/>
              <!-- 腿 -->
              <rect class="adam-leg-l" x="22" y="82" width="14" height="28" :fill="adamLegColor" rx="4"/>
              <rect class="adam-leg-r" x="44" y="82" width="14" height="28" :fill="adamLegColor" rx="4"/>
              <!-- 鞋 -->
              <rect x="18" y="106" width="20" height="8" fill="#1A1A1A" rx="3"/>
              <rect x="42" y="106" width="20" height="8" fill="#1A1A1A" rx="3"/>
              <!-- 发光眼效果 -->
              <ellipse cx="30" cy="29" rx="5" ry="4" :fill="adamEyeColor" opacity="0.25"/>
              <ellipse cx="50" cy="29" rx="5" ry="4" :fill="adamEyeColor" opacity="0.25"/>
            </svg>
            <div class="adam-shadow">
              <svg width="40" height="10" viewBox="0 0 40 10"><ellipse cx="20" cy="5" rx="18" ry="4" fill="rgba(0,0,0,0.18)"/></svg>
            </div>
            <div v-if="adamStore.adamPosition.isMoving" class="adam-trail">
              <span v-for="i in 3" :key="i" class="trail-dot" :style="{ animationDelay: (i * 0.12) + 's', color: adamGlowColor }"></span>
            </div>
            <div v-if="!adamSelected && adamStore.adamPosition.activity" class="adam-bubble">
              <span class="bubble-text">{{ adamStore.adamPosition.activity }}</span>
            </div>
            <div v-if="adamSelected" class="adam-popup" @click.stop>
              <button class="adam-popup-close" @click.stop="clearSelection()">×</button>
              <div class="adam-popup-header">
                <span class="adam-popup-name">ADAM #1</span>
                <span class="adam-popup-tag" :class="adamStore.core.status">{{ adamStatusLabel }}</span>
              </div>
              <div class="adam-popup-metrics">
                <div class="adam-metric">
                  <span class="adam-metric-label">{{ t('city.budget') }}</span>
                  <span class="adam-metric-val" :class="{ warn: adamStore.core.budget <= 0 }">¥{{ adamStore.core.budget.toLocaleString() }}</span>
                </div>
                <div class="adam-metric">
                  <span class="adam-metric-label">{{ t('city.credit') }}</span>
                  <span class="adam-metric-val" :style="{ color: creditColorMap[adamStore.core.creditLevel] }">{{ adamStore.core.creditLevel }}</span>
                </div>
                <div class="adam-metric">
                  <span class="adam-metric-label">{{ t('city.energy') }}</span>
                  <span class="adam-metric-val">{{ adamStore.core.energy }}%</span>
                </div>
                <div class="adam-metric">
                  <span class="adam-metric-label">{{ t('city.survival') }}</span>
                  <span class="adam-metric-val">{{ adamStore.core.survivalDays }}{{ t('city.daysUnit') }}</span>
                </div>
              </div>
              <div class="adam-popup-section">
                <span class="adam-popup-section-title">{{ t('city.emotion') }}</span>
                <div class="adam-popup-emotions">
                  <div v-for="(val, key) in adamStore.core.emotionState" :key="key" class="adam-emo-item">
                    <span class="adam-emo-label">{{ emotionLabel(key) }}</span>
                    <div class="adam-emo-track"><div class="adam-emo-fill" :style="{ width: val + '%', background: emotionColorMap[key] }"></div></div>
                  </div>
                </div>
              </div>
              <div class="adam-popup-section">
                <span class="adam-popup-section-title">{{ t('city.messages') }}</span>
                <div v-if="latestReflections.length" class="adam-popup-messages">
                  <div v-for="r in latestReflections" :key="r.id" class="adam-msg-item">
                    <span class="adam-msg-time">{{ formatTime(r.at) }}</span>
                    <span class="adam-msg-text">{{ r.content }}</span>
                  </div>
                </div>
                <div v-else class="adam-msg-empty">{{ t('city.noMessages') }}</div>
              </div>
            </div>
          </div>

        </div><!-- /iso-scene -->

        <!-- HUD -->
        <div class="iso-hud">
          <div class="hud-item">
            <div class="hud-dot" :class="adamStore.core.status"></div>
            {{ adamHudText }}
          </div>
        </div>
        <div class="iso-controls">
            <span>{{ t('city.zoomHint') }}</span>
            <span>{{ t('city.panHint') }}</span>
            <span>{{ t('city.rotateHint') }}</span>
        </div>

      </div>
    </div>

    <!-- ═══ 右侧对话面板 ═══ -->
    <div v-if="!embed" class="city-chat" :class="{ collapsed: chatCollapsed }">
      <!-- 折叠/展开按钮 -->
      <button class="city-chat-toggle" @click="chatCollapsed = !chatCollapsed" :title="chatCollapsed ? t('city.expandChat') : t('city.collapseChat')">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
        </svg>
        <span v-if="!chatCollapsed" class="chat-toggle-label">{{ t('city.chatLabel') }}</span>
        <span v-if="!chatCollapsed" class="chat-unread-dot" :class="{ visible: chatStore.isAlive }"></span>
      </button>

      <template v-if="!chatCollapsed">
        <!-- 头部 -->
        <div class="city-chat-head">
          <span class="cch-icon">⟐</span>
          <span class="cch-title">{{ t('city.commChannel') }}</span>
          <span class="cch-status" :class="{ online: adamStore.isAlive }">{{ adamStore.isAlive ? t('city.connected') : t('city.offline') }}</span>
        </div>

        <!-- 消息区 -->
        <div ref="chatMessagesDiv" class="city-chat-messages">
          <div v-if="chatMessages.length === 0" class="city-chat-empty">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            <p>{{ t('city.chatEmptyPrompt') }}</p>
          </div>
          <div v-for="msg in chatMessages" :key="msg.id" class="cc-msg" :class="msg.role">
            <span class="cc-avatar" :class="msg.role">
              <img v-if="msg.role === 'assistant'" :src="adamAvatarUrl" class="cc-avatar-img" :alt="t('city.adamAlt')"/>
              <template v-else>U</template>
            </span>
            <div class="cc-body">
              <div class="cc-meta">
                <span class="cc-sender">{{ msg.role === 'user' ? t('city.operator') : t('city.adam') }}</span>
                <span class="cc-time">{{ msg.time }}</span>
              </div>
              <div class="cc-content" v-html="renderChatMarkdown(msg.content)"></div>
              <div v-if="msg.toolCalls?.length" class="cc-tools">
                <div v-for="call in msg.toolCalls" :key="call.id" class="cc-tool-card" :class="call.status">
                  <span class="cc-tool-dot"></span>
                  <span class="cc-tool-name">{{ toolDisplayName(call.name) }}</span>
                  <span class="cc-tool-status">{{ call.status === 'running' ? t('city.exec') : call.status === 'success' ? t('city.done') : t('city.err') }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="chatLoading" class="cc-msg assistant">
            <span class="cc-avatar assistant"><img :src="adamAvatarUrl" class="cc-avatar-img" :alt="t('city.adamAlt')"/></span>
            <div class="cc-body">
              <div class="cc-typing"><span></span><span></span><span></span></div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="city-chat-input">
          <div class="cci-row">
            <textarea
              ref="chatInputRef"
              v-model="chatInputText"
              class="cci-textarea"
              :placeholder="t('city.chatInputPlaceholder')"
              rows="1"
              @keydown.enter.exact.prevent="handleChatSend"
              @input="chatAutoResize"
            />
            <button class="cci-send" :disabled="!chatInputText.trim() || chatLoading" @click="handleChatSend">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 2L11 13M22 2L15 22L11 13L2 9L22 2Z"/>
              </svg>
            </button>
          </div>
        </div>
      </template>
    </div>

    <!-- 进入大厅像素转场 -->
    <div v-if="hallEntering" class="hall-enter-overlay">
      <div v-for="i in 12" :key="i" class="heo-strip" :style="{ animationDelay: (i % 4) * 0.06 + 's' }"></div>
      <div class="heo-text">{{ t('city.entering') }}</div>
    </div>
  </div>


  <!-- 记录投资弹窗 -->
  <div v-if="showRecordInvestmentDialog" class="dialog-mask" @click.self="showRecordInvestmentDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.recordInvestmentTitle') }}</div>
      <div class="dialog-desc">{{ t('city.recordInvestmentDesc') }}</div>
      <input v-model="riForm.symbol" type="text" class="dialog-input" :placeholder="t('city.symbolPlaceholder')" />
      <div class="dialog-row-2col">
        <select v-model="riForm.direction" class="dialog-select">
          <option value="buy">{{ t('city.buy') }}</option>
          <option value="sell">{{ t('city.sell') }}</option>
        </select>
        <input v-model="riForm.amount" type="number" class="dialog-input" :placeholder="t('city.amountPlaceholder')" min="0" />
      </div>
      <input v-model="riForm.note" type="text" class="dialog-input" :placeholder="t('city.noteOptional')" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showRecordInvestmentDialog = false">{{ t('city.cancel') }}</button>
        <button class="btn-gold" @click="handleRecordInvestment">{{ t('city.record') }}</button>
      </div>
    </div>
  </div>

  <!-- 结算分红弹窗 -->
  <div v-if="showDividendDialog" class="dialog-mask" @click.self="showDividendDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.dividendTitle') }}</div>
      <div class="dialog-desc">
        {{ t('city.dividendDesc', { credit: adamStore.core.creditLevel, userShare: dividendRatio * 100, adamShare: (1 - dividendRatio) * 100 }) }}
      </div>
      <input v-model="dvForm.totalProfit" type="number" class="dialog-input" :placeholder="t('city.dividendProfitPlaceholder')" min="0" />
      <div v-if="dvForm.totalProfit" class="dialog-calc-hint">
        {{ t('city.dividendCalc', { userShare: (parseFloat(dvForm.totalProfit) * dividendRatio).toFixed(2), adamShare: (parseFloat(dvForm.totalProfit) * (1 - dividendRatio)).toFixed(2) }) }}
      </div>
      <input v-model="dvForm.note" type="text" class="dialog-input" :placeholder="t('city.noteOptional')" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showDividendDialog = false">{{ t('common.cancel') }}</button>
        <button class="btn-gold" @click="handleSettleDividend">{{ t('city.settle') }}</button>
      </div>
    </div>
  </div>

  <!-- 执行赔付弹窗 -->
  <div v-if="showPenaltyDialog" class="dialog-mask" @click.self="showPenaltyDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.penaltyTitle') }}</div>
      <div class="dialog-desc">{{ t('city.penaltyDesc') }}</div>
      <input v-model="penForm.lossAmount" type="number" class="dialog-input" :placeholder="t('city.lossAmountPlaceholder')" min="0" />
      <div class="dialog-row-2col">
        <div class="dialog-label-input">
          <label class="dialog-field-label">{{ t('city.selfConfidenceLabel') }}</label>
          <input v-model="penForm.selfConfidence" type="number" class="dialog-input" :placeholder="t('city.percentPlaceholder')" min="0" max="100" />
        </div>
        <div class="dialog-label-input">
          <label class="dialog-field-label">{{ t('city.objectiveConfidenceLabel') }}</label>
          <input v-model="penForm.objConfidence" type="number" class="dialog-input" :placeholder="t('city.percentPlaceholder')" min="0" max="100" />
        </div>
      </div>
      <div v-if="penForm.lossAmount && penForm.objConfidence" class="dialog-calc-hint">
        {{ t('city.penaltyCalc', { amount: penaltyAmount.toFixed(2) }) }}
      </div>
      <input v-model="penForm.note" type="text" class="dialog-input" :placeholder="t('city.noteOptional')" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showPenaltyDialog = false">{{ t('common.cancel') }}</button>
        <button class="btn-gold" @click="handleApplyPenalty">{{ t('city.confirmPenalty') }}</button>
      </div>
    </div>
  </div>

  <!-- 发出指令弹窗 -->
  <div v-if="showIssueRecommDialog" class="dialog-mask" @click.self="showIssueRecommDialog = false">
    <div class="dialog-box dialog-box-wide">
      <div class="dialog-title">{{ t('city.recommendationTitle') }}</div>
      <div class="dialog-desc">{{ t('city.recommendationDesc') }}</div>
      <input v-model="recForm.title" type="text" class="dialog-input" :placeholder="t('city.recommendationTitlePlaceholder')" />
      <div class="dialog-row-2col">
        <input v-model="recForm.symbol" type="text" class="dialog-input" :placeholder="t('city.symbolPlaceholder')" />
        <select v-model="recForm.direction" class="dialog-select">
          <option value="long">{{ t('city.directionLong') }}</option>
          <option value="short">{{ t('city.directionShort') }}</option>
          <option value="hold">{{ t('city.directionHold') }}</option>
          <option value="exit">{{ t('city.directionExit') }}</option>
        </select>
      </div>
      <div class="dialog-row-2col">
        <input v-model="recForm.targetPrice" type="number" class="dialog-input" :placeholder="t('city.targetPricePlaceholder')" min="0" />
        <input v-model="recForm.stopLoss" type="number" class="dialog-input" :placeholder="t('city.stopLossPlaceholder')" min="0" />
      </div>
      <div class="dialog-label-input" style="margin-bottom:6px">
        <label class="dialog-field-label">{{ t('city.confidenceLabel', { value: recForm.confidence }) }}</label>
        <input v-model="recForm.confidence" type="range" min="0" max="100" style="width:100%;accent-color:#00D4FF" />
      </div>
      <textarea v-model="recForm.thesis" class="dialog-textarea" :placeholder="t('city.thesisPlaceholder')" rows="3"></textarea>
      <textarea v-model="recForm.riskNote" class="dialog-textarea" :placeholder="t('city.riskPlaceholder')" rows="2"></textarea>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showIssueRecommDialog = false">{{ t('common.cancel') }}</button>
        <button class="btn-gold" @click="handleIssueRecommendation">{{ t('city.sendInstruction') }}</button>
      </div>
    </div>
  </div>

  <!-- 下达任务弹窗（情报站/研究院等需要参数的AI工具） -->
  <div v-if="showTaskDialog" class="dialog-mask" @click.self="showTaskDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ taskDialogTitle }}</div>
      <div class="dialog-desc">{{ taskDialogDesc }}</div>
      <input
        v-for="field in taskDialogFields"
        :key="field.key"
        v-model="taskParams[field.key]"
        :type="field.type || 'text'"
        class="dialog-input"
        :placeholder="field.placeholder"
      />
      <!-- 工具运行中显示loading -->
      <div v-if="toolRunning === taskDialogToolId" class="dialog-running">
        <span class="tool-indicator spin"></span> {{ t('city.taskRunning') }}
      </div>
      <div v-if="taskResultText" class="task-result-box">{{ taskResultText }}</div>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showTaskDialog = false">{{ t('common.close') }}</button>
        <button class="btn-gold" :disabled="!!toolRunning" @click="handleRunTask">{{ t('city.dispatchTask') }}</button>
      </div>
    </div>
  </div>

  <!-- 保险箱弹窗 -->
  <div v-if="showVaultDialog" class="dialog-mask" @click.self="showVaultDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.vaultTitle') }}</div>
      <div class="dialog-desc">
        {{ t('city.vaultDesc', { balance: adamStore.core.survivalDays >= 7 ? vaultBalance.toLocaleString() : t('city.vaultLocked') }) }}
        <span v-if="adamStore.core.survivalDays < 7" style="color:#888;display:block;margin-top:4px">{{ t('city.vaultUnlockHint', { days: adamStore.core.survivalDays }) }}</span>
      </div>
      <div v-if="adamStore.core.survivalDays >= 7">
        <div class="dialog-row-2col" style="margin-bottom:8px">
          <button class="btn-ghost" :class="{ active: vaultAction === 'deposit' }" style="flex:1" @click="vaultAction = 'deposit'">{{ t('city.deposit') }}</button>
          <button class="btn-ghost" :class="{ active: vaultAction === 'withdraw' }" style="flex:1" @click="vaultAction = 'withdraw'">{{ t('city.withdraw') }}</button>
        </div>
        <input v-model="vaultAmount" type="number" class="dialog-input" :placeholder="vaultAction === 'deposit' ? t('city.depositAmountPlaceholder') : t('city.withdrawAmountPlaceholder')" min="0" />
      </div>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showVaultDialog = false">{{ t('common.cancel') }}</button>
        <button v-if="adamStore.core.survivalDays >= 7" class="btn-gold" @click="handleVault">{{ t('common.confirm') }}</button>
      </div>
    </div>
  </div>

  <!-- 图书馆书架弹窗 -->
  <div v-if="showLibraryDialog" class="dialog-mask" @click.self="showLibraryDialog = false">
    <div class="dialog-box dialog-box-wide">
      <div class="dialog-title">{{ t('city.libraryTitle') }}</div>
      <input v-model="librarySearch" type="text" class="dialog-input" :placeholder="t('city.librarySearchPlaceholder')" style="margin-bottom:8px" />
      <div v-if="filteredBooks.length === 0" class="detail-empty" style="padding:16px 0">{{ t('city.libraryEmpty') }}</div>
      <div v-else class="library-list">
        <div v-for="b in filteredBooks" :key="b.id" class="library-item">
          <div class="library-item-title">{{ b.title }}</div>
          <div class="library-item-meta">
            <span>{{ b.author === 'adam' ? t('city.libraryAuthorAdam') : t('city.libraryAuthorUser') }}</span>
            <span v-if="b.tags?.length">· {{ b.tags.join(' / ') }}</span>
            <span>· {{ formatTime(b.createdAt) }}</span>
          </div>
          <div class="library-item-content">{{ b.content?.slice(0, 120) }}{{ b.content?.length > 120 ? '…' : '' }}</div>
        </div>
      </div>
      <div class="dialog-actions" style="margin-top:8px">
        <button class="btn-ghost" @click="showLibraryDialog = false">{{ t('common.close') }}</button>
        <button class="btn-gold" @click="showAddBookDialog = true; showLibraryDialog = false">{{ t('city.addBook') }}</button>
      </div>
    </div>
  </div>

  <!-- 添加书籍弹窗 -->
  <div v-if="showAddBookDialog" class="dialog-mask" @click.self="showAddBookDialog = false">
    <div class="dialog-box dialog-box-wide">
      <div class="dialog-title">{{ t('city.addBookTitle') }}</div>
      <div class="dialog-desc">{{ t('city.addBookDesc') }}</div>
      <input v-model="bookForm.title" type="text" class="dialog-input" :placeholder="t('city.bookTitlePlaceholder')" />
      <input v-model="bookForm.tags" type="text" class="dialog-input" :placeholder="t('city.bookTagsPlaceholder')" />
      <textarea v-model="bookForm.content" class="dialog-textarea" :placeholder="t('city.bookContentPlaceholder')" rows="5"></textarea>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showAddBookDialog = false">{{ t('common.cancel') }}</button>
        <button class="btn-gold" @click="handleAddBook">{{ t('city.feedBook') }}</button>
      </div>
    </div>
  </div>

  <!-- 写日记弹窗（触发亚当反思） -->
  <div v-if="showReflectionDialog" class="dialog-mask" @click.self="showReflectionDialog = false">
    <div class="dialog-box dialog-box-wide">
      <div class="dialog-title">{{ t('city.reflectionTitle') }}</div>
      <div class="dialog-desc">{{ t('city.reflectionDesc') }}</div>
      <textarea v-model="reflectionPrompt" class="dialog-textarea" :placeholder="t('city.reflectionPromptPlaceholder')" rows="3"></textarea>
      <div v-if="toolRunning === 'write_reflection'" class="dialog-running">
        <span class="tool-indicator spin"></span> {{ t('city.taskRunning') }}
      </div>
      <div v-if="reflectionResultText" class="task-result-box">{{ reflectionResultText }}</div>
      <!-- 历史日记 -->
      <div v-if="adamStore.reflections.length" style="margin-top:12px">
        <div class="dialog-field-label" style="margin-bottom:6px">{{ t('city.reflectionHistory') }}</div>
        <div v-for="r in [...adamStore.reflections].reverse().slice(0,5)" :key="r.id" class="reflection-item">
          <div class="reflection-time">{{ formatTime(r.at) }}</div>
          <div class="reflection-content">{{ r.content }}</div>
        </div>
      </div>
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showReflectionDialog = false">{{ t('common.close') }}</button>
        <button class="btn-gold" :disabled="!!toolRunning" @click="handleWriteReflection">{{ t('city.startReflection') }}</button>
      </div>
    </div>
  </div>

  <!-- 迁移建筑弹窗 -->
  <div v-if="showRelocateDialog" class="dialog-mask" @click.self="showRelocateDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.relocateTitle') }}</div>
      <div class="dialog-desc">{{ t('city.relocateDesc') }}</div>
      <select v-model="relocateForm.buildingId" class="dialog-select">
        <option value="">{{ t('city.buildingSelectPlaceholder') }}</option>
        <option v-for="b in adamStore.buildings.filter(b => b.status === 'active')" :key="b.id" :value="b.id">
          {{ displayBuildingName(b.institutionId || b.type, b.name) }}（{{ b.position.gridX }}, {{ b.position.gridY }}）
        </option>
      </select>
      <div class="dialog-row-2col" style="margin-top:8px">
        <input v-model="relocateForm.newX" type="number" class="dialog-input" :placeholder="t('city.newXPlaceholder')" min="0" max="31" />
        <input v-model="relocateForm.newY" type="number" class="dialog-input" :placeholder="t('city.newYPlaceholder')" min="0" max="31" />
      </div>
      <input v-model="relocateForm.reason" type="text" class="dialog-input" :placeholder="t('city.reasonPlaceholder')" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showRelocateDialog = false">{{ t('common.cancel') }}</button>
        <button class="btn-gold" @click="handleRelocate">{{ t('city.confirmRelocate') }}</button>
      </div>
    </div>
  </div>

  <!-- 升级建筑弹窗 -->
  <div v-if="showUpgradeDialog" class="dialog-mask" @click.self="showUpgradeDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.upgradeTitle') }}</div>
      <div class="dialog-desc">{{ t('city.upgradeDesc') }}</div>
      <select v-model="upgradeForm.buildingId" class="dialog-select">
        <option value="">{{ t('city.buildingSelectPlaceholder') }}</option>
        <option v-for="b in adamStore.buildings.filter(b => b.status === 'active')" :key="b.id" :value="b.id">
          {{ displayBuildingName(b.institutionId || b.type, b.name) }}（LV.{{ b.upgradeHistory?.length || 0 }}）
        </option>
      </select>
      <input v-model="upgradeForm.newType" type="text" class="dialog-input" :placeholder="t('city.newTypePlaceholder')" style="margin-top:8px" />
      <input v-model="upgradeForm.reason" type="text" class="dialog-input" :placeholder="t('city.reasonPlaceholder')" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showUpgradeDialog = false">{{ t('common.cancel') }}</button>
        <button class="btn-gold" @click="handleUpgrade">{{ t('city.confirmUpgrade') }}</button>
      </div>
    </div>
  </div>

  <!-- ERP权限申请弹窗 -->
  <div v-if="showErpAccessDialog" class="dialog-mask" @click.self="showErpAccessDialog = false">
    <div class="dialog-box">
      <div class="dialog-title">{{ t('city.erpAccessTitle') }}</div>
      <div class="dialog-desc">{{ t('city.erpAccessDesc') }}</div>
      <select v-model="erpAccessForm.dataType" class="dialog-select">
        <option value="sales">{{ t('city.erpDataTypes.sales') }}</option>
        <option value="inventory">{{ t('city.erpDataTypes.inventory') }}</option>
        <option value="finance">{{ t('city.erpDataTypes.finance') }}</option>
        <option value="customers">{{ t('city.erpDataTypes.customers') }}</option>
        <option value="all">{{ t('city.erpDataTypes.all') }}</option>
      </select>
      <input v-model="erpAccessForm.reason" type="text" class="dialog-input" :placeholder="t('city.reasonPlaceholder')" style="margin-top:8px" />
      <div class="dialog-actions">
        <button class="btn-ghost" @click="showErpAccessDialog = false">{{ t('city.rejectAccess') }}</button>
        <button class="btn-gold" @click="handleErpAccess(true)">{{ t('city.approveAccess') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useAdamStore } from '@/stores/adam'

// embed 模式：仅渲染互动地图（供首页黄卡内嵌），隐藏侧栏与对话面板
defineProps<{ embed?: boolean }>()

// ── P&L 驱动的城市氛围 ──
const tradeStatsForMood = ref<any>(null)
async function loadMoodStats() {
  try {
    const r = await fetch('/api/adam/trade-stats').then(r => r.json())
    tradeStatsForMood.value = r
  } catch {}
}
const moodLevel = computed(() => {
  const v = parseFloat(tradeStatsForMood.value?.summary?.net_pnl_usdt || '0')
  if (v >= 5) return 'sunny'      // 大赚 - 阳光
  if (v >= 1) return 'bright'     // 小赚 - 明亮
  if (v >= -1) return 'normal'    // 持平 - 正常
  if (v >= -5) return 'rain'      // 小亏 - 阴雨
  return 'storm'                  // 巨亏 - 暴雨
})
const moodEmoji = computed(() => ({ sunny: '☀️', bright: '🌤️', normal: '⛅', rain: '🌧️', storm: '⛈️' }[moodLevel.value]))
const moodText = computed(() => t(`city.moods.${moodLevel.value}`))
const moodPnlText = computed(() => {
  const v = parseFloat(tradeStatsForMood.value?.summary?.net_pnl_usdt || '0')
  return (v > 0 ? '+' : '') + v.toFixed(2) + ' USDT'
})
const moodTitle = computed(() =>
  t('city.moodTitle', {
    pnl: moodPnlText.value,
    trades: tradeStatsForMood.value?.summary?.total_trades || 0,
  }),
)
let _moodTimer: any = null
onMounted(() => { loadMoodStats(); _moodTimer = setInterval(loadMoodStats, 60000) })
onUnmounted(() => { if (_moodTimer) clearInterval(_moodTimer) })
import IlloBuilding from './illo/IlloBuilding.vue'
import AdamStatue from './illo/AdamStatue.vue'
import { applyToolResult } from '@/utils/adamToolSync'
import { marked } from 'marked'
import type { InvestmentInstitutionId, InvestmentToolId } from '@/types/investment'
import adamAvatarUrl from '@/assets/adam-avatar.png'

marked.setOptions({ breaks: true, gfm: true })

const { t } = useI18n()
const adamStore = useAdamStore()
const router = useRouter()

// ── 中央雕塑广场（园区几何中心） ──
const STATUE_GX = 13.5
const STATUE_GY = 13.5
const statueStyle = computed(() => {
  const { x, y } = isoToScreen(STATUE_GX, STATUE_GY)
  return {
    left: x + 'px',
    top: y + 'px',
    zIndex: String(Math.round(STATUE_GX + STATUE_GY)),
  }
})

// ── 广场周边景观小品（参考全景图：水池/花园/雕塑） ──
const plazaDecor = computed(() => {
  const items = [
    { key: 'pond_nw', kind: 'pond', gx: 11.2, gy: 10.6 },
    { key: 'pond_se', kind: 'pond', gx: 15.8, gy: 16.4 },
    { key: 'garden_sw', kind: 'garden', gx: 10.6, gy: 15.8 },
    { key: 'sculpt_ne', kind: 'sculpt', gx: 16.2, gy: 11.0 },
  ]
  return items.map((i) => {
    const { x, y } = isoToScreen(i.gx, i.gy)
    return { ...i, style: { left: x + 'px', top: y + 'px', zIndex: String(Math.round(i.gx + i.gy)) } }
  })
})

// ── 建筑标签牌：机构状态 ──
function instStatusOf(instId: string): string {
  return adamStore.institutionMap[instId]?.status || 'idle'
}
function instStatusEn(instId: string, locked: boolean): string {
  if (locked) return 'LOCKED'
  const map: Record<string, string> = {
    idle: t('city.statusLabels.idle'),
    active: t('city.statusLabels.active'),
    locked: t('city.statusLabels.locked'),
    cooldown: t('city.statusLabels.cooldown'),
    disabled: t('city.statusLabels.disabled'),
    urgent: t('city.statusLabels.urgent'),
  }
  return map[instStatusOf(instId)] || t('city.statusLabels.idle')
}

// ── 进入建筑大厅（像素百叶转场后跳转） ──
const hallEntering = ref(false)
function enterHall(instId: string) {
  const bldg = adamStore.buildings.find(b => b.institutionId === instId)
  if (!bldg || bldg.status === 'planned') return
  if (hallEntering.value) return
  hallEntering.value = true
  setTimeout(() => {
    router.push(`/investment/city/hall/${instId}`)
    hallEntering.value = false
  }, 480)
}

// ── 右侧对话面板 ──
const sidebarCollapsed = ref(true)
const chatCollapsed = ref(true)
const chatStore = adamStore  // alias for template clarity
const chatMessagesDiv = ref<HTMLDivElement>()
const chatInputRef = ref<HTMLTextAreaElement>()
const chatInputText = ref('')
const chatLoading = ref(false)

const CHAT_HISTORY_KEY = 'adam_chat_history'
interface ChatToolCall { id: string; name: string; input: Record<string, any>; status: 'running' | 'success' | 'error' }
interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; time: string; toolCalls?: ChatToolCall[] }
const chatMessages = ref<ChatMsg[]>([])

async function loadChatHistory() {
  // 1. 先用 localStorage 快速渲染（避免空白）
  try {
    const raw = localStorage.getItem(CHAT_HISTORY_KEY)
    if (raw) chatMessages.value = JSON.parse(raw)
  } catch { /* ignore */ }
  // 2. 再从 KV 拉权威版本，跨设备同步
  try {
    const token = localStorage.getItem('erp_token') || ''
    if (!token) return
    const res = await fetch('/api/adam/history', { headers: { 'x-erp-token': token } })
    if (!res.ok) return
    const data = await res.json() as { messages?: Array<{ role: string; content: string; timestamp?: string }> }
    if (Array.isArray(data.messages) && data.messages.length > 0) {
      chatMessages.value = data.messages.map((m, i) => ({
        id: `srv_${i}`,
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
        time: m.timestamp ? new Date(m.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) : '',
      }))
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages.value.slice(-80)))
    }
  } catch { /* 网络失败用 localStorage 兜底 */ }
}
function persistChatHistory() {
  try { localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(chatMessages.value.slice(-80))) } catch { /* ignore */ }
  // 同步到 KV（跨设备）
  try {
    const token = localStorage.getItem('erp_token') || ''
    if (!token) return
    const msgs = chatMessages.value
      .filter(m => m.content)
      .map(m => ({ role: m.role, content: m.content, timestamp: new Date().toISOString() }))
    fetch('/api/adam/history', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ messages: msgs }),
    }).catch(() => {})
  } catch { /* ignore */ }
}
function renderChatMarkdown(content: string): string {
  const clean = isCleanChatContent(content) ? String(content) : ''
  try { return marked(clean) as string } catch { return clean }
}
function isCleanChatContent(content: unknown): boolean {
  const c = String(content ?? '').trim()
  return !!c && !/^(\s*undefined\s*)+$/i.test(c) && !/^undefined/i.test(c) && c.toLowerCase() !== 'null'
}
function getChatEventText(ev: any): string {
  const text = ev?.text ?? ev?.content
  return isCleanChatContent(text) ? String(text) : ''
}
function scrollChatToBottom() {
  nextTick(() => { if (chatMessagesDiv.value) chatMessagesDiv.value.scrollTop = chatMessagesDiv.value.scrollHeight })
}
function chatAutoResize() {
  if (!chatInputRef.value) return
  chatInputRef.value.style.height = 'auto'
  chatInputRef.value.style.height = Math.min(chatInputRef.value.scrollHeight, 100) + 'px'
}

async function handleChatSend() {
  const text = chatInputText.value.trim()
  if (!text || chatLoading.value) return
  const userMsg: ChatMsg = { id: Date.now() + '', role: 'user', content: text, time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }) }
  chatMessages.value.push(userMsg)
  chatInputText.value = ''
  if (chatInputRef.value) chatInputRef.value.style.height = 'auto'
  chatLoading.value = true
  scrollChatToBottom()
  const token = localStorage.getItem('erp_token') || ''
  const assistantMsg: ChatMsg = { id: Date.now() + '_a', role: 'assistant', content: '', time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }), toolCalls: [] }
  // 30s 兜底：超时强制终止
  const abortCtrl = new AbortController()
  const timeoutId = setTimeout(() => abortCtrl.abort(), 30000)
  try {
    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({ message: text, history: chatMessages.value.slice(-20).map(m => ({ role: m.role, content: m.content })) }),
      signal: abortCtrl.signal,
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    chatMessages.value.push(assistantMsg)
    scrollChatToBottom()
    const reader = res.body!.getReader()
    const decoder = new TextDecoder()
    let buf = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buf += decoder.decode(value, { stream: true })
      const lines = buf.split('\n'); buf = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const raw = line.slice(6).trim()
        if (raw === '[DONE]') break
        try {
          const ev = JSON.parse(raw)
          if (ev.type === 'text') {
            const text = getChatEventText(ev)
            if (text) { assistantMsg.content += text; scrollChatToBottom() }
          }
          else if (ev.type === 'tool_start') { assistantMsg.toolCalls!.push({ id: ev.id, name: ev.name, input: ev.input, status: 'running' }); scrollChatToBottom() }
          else if (ev.type === 'tool_result') {
            const tc = assistantMsg.toolCalls!.find(t => t.id === ev.id)
            if (tc) { tc.status = ev.isError ? 'error' : 'success' }
            if (!ev.isError) applyToolResult(adamStore, ev.name, ev.result ?? ev.content ?? '')
            scrollChatToBottom()
          }
        } catch { /* ignore */ }
      }
    }
  } catch (e: any) {
    if (!assistantMsg.content) assistantMsg.content = t('city.connectionFailed', { message: e.message })
    if (!chatMessages.value.includes(assistantMsg)) chatMessages.value.push(assistantMsg)
  } finally {
    if (!isCleanChatContent(assistantMsg.content)) {
      assistantMsg.content = assistantMsg.toolCalls?.length
        ? t('city.chatFallbackWithTools')
        : t('city.chatFallbackSimple')
    }
    clearTimeout(timeoutId)
    chatLoading.value = false
    persistChatHistory()
    scrollChatToBottom()
  }
}

// ── 选中状态 ──
const selectedId = ref<InvestmentInstitutionId | null>(null)
const adamSelected = ref(false)

function selectAdam() {
  adamSelected.value = true
  selectedId.value = null
}
function clearSelection() {
  adamSelected.value = false
  selectedId.value = null
}

// ── 亚当行为状态 ──
const adamWorking = ref(false)
let workTimer: ReturnType<typeof setTimeout> | null = null
let idleTimer: ReturnType<typeof setTimeout> | null = null
let moveDoneTimer: ReturnType<typeof setTimeout> | null = null

// ── 亚当 SVG 属性 ──
const creditColorMap: Record<string, string> = {
  C: '#8E99A4',
  B: '#5B8DEF',
  'B+': '#4FC3F7',
  A: '#F5A623',
  S: '#E040FB',
}

const adamCoatColor = computed(() => creditColorMap[adamStore.core.creditLevel] || '#8E99A4')
const adamHeadColor = computed(() => {
  const joy = adamStore.core.emotionState.joy
  if (joy > 60) return '#FFE0B2'
  if (adamStore.core.emotionState.fear > 60) return '#E8D5E0'
  return '#F5E6D3'
})
const adamEyeColor = computed(() => {
  const { joy, anger, sorrow, fear } = adamStore.core.emotionState
  if (anger > 60) return '#FF4D4D'
  if (joy > 60) return '#00E5A0'
  if (sorrow > 60) return '#5B8DEF'
  if (fear > 60) return '#F5A623'
  return '#00D4FF'
})
const adamGlowColor = computed(() => {
  if (adamStore.core.status === 'survival') return '#FF4D4D'
  return adamEyeColor.value
})
const adamLegColor = computed(() => {
  const coat = adamCoatColor.value
  // darken coat color slightly for legs
  return coat + 'CC'
})
const adamMouth = computed(() => {
  const { joy, sorrow, anger, fear } = adamStore.core.emotionState
  if (joy > 50) return 'smile'
  if (sorrow > 50 || fear > 50) return 'sad'
  return 'neutral'
})

const adamHudText = computed(() => {
  const status = adamStore.core.status
  if (status === 'dormant') return t('city.hud.dormant')
  if (status === 'shutdown') return t('city.hud.shutdown')
  if (adamStore.adamPosition.isMoving) return t('city.hud.moving')
  if (adamWorking.value) return t('city.hud.working')
  return t('city.hud.observing')
})

const adamStatusLabel = computed(() => t(`city.statusLabels.${adamStore.core.status}`) || adamStore.core.status.toUpperCase())

function emotionLabel(key: string) {
  return t(`city.emotions.${key}`)
}
const emotionColorMap: Record<string, string> = {
  joy: '#00E5A0', anger: '#FF4D4D', sorrow: '#5B8DEF', fear: '#F5A623',
  love: '#E040FB', disgust: '#8E99A4', desire: '#FF6B35',
}

const latestReflections = computed(() =>
  [...adamStore.reflections].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5),
)

// ── 亚当位置 (等距坐标 → 屏幕坐标) ──
const adamPixelStyle = computed(() => {
  const pos = adamStore.adamPosition
  // 当移动时使用目标坐标（CSS transition会平滑过渡）
  const gx = pos.isMoving ? pos.targetGridX : pos.gridX
  const gy = pos.isMoving ? pos.targetGridY : pos.gridY
  const { x, y } = isoToScreen(gx, gy)
  const dist = Math.abs(pos.targetGridX - pos.gridX) + Math.abs(pos.targetGridY - pos.gridY)
  const duration = Math.max(1, Math.min(4, dist * 0.3))
  return {
    left: x + 'px',
    top: y + 'px',
    zIndex: String(gx + gy + 1),
    transitionDuration: pos.isMoving ? `${duration}s` : '0.3s',
  }
})

// ── 监听移动：CSS transition 结束时标记到达 ──
watch(
  () => adamStore.adamPosition.isMoving,
  (moving) => {
    if (moving) {
      adamWorking.value = false
      // 计算移动时间，到达后触发
      const pos = adamStore.adamPosition
      const dist = Math.abs(pos.targetGridX - pos.gridX) + Math.abs(pos.targetGridY - pos.gridY)
      const duration = Math.max(1, Math.min(4, dist * 0.3)) * 1000
      if (moveDoneTimer) clearTimeout(moveDoneTimer)
      moveDoneTimer = setTimeout(() => {
        adamStore.adamArrived()
        // 到达后进入工作状态
        adamWorking.value = true
        if (workTimer) clearTimeout(workTimer)
        workTimer = setTimeout(() => {
          adamWorking.value = false
          adamStore.setAdamActivity('')
          // 工作完成后，一段时间后回到角落
          startIdleTimer()
        }, 4000)
      }, duration)
    }
  },
)

// ── 空闲计时器：空闲一段时间后回角落 ──
function startIdleTimer() {
  if (idleTimer) clearTimeout(idleTimer)
  idleTimer = setTimeout(() => {
    if (!adamStore.adamPosition.isMoving && !adamWorking.value) {
      adamStore.adamGoHome()
      // 回家的移动也要处理到达
      const pos = adamStore.adamPosition
      const dist = Math.abs(pos.targetGridX - pos.gridX) + Math.abs(pos.targetGridY - pos.gridY)
      if (dist > 0) {
        const duration = Math.max(1, Math.min(4, dist * 0.3)) * 1000
        if (moveDoneTimer) clearTimeout(moveDoneTimer)
        moveDoneTimer = setTimeout(() => {
          adamStore.adamArrived()
        }, duration)
      }
    }
  }, 8000)
}

// ── 监听事件变化 ──
const eventCount = computed(() => adamStore.events.length)
watch(eventCount, () => {
  // 新事件会在 addEvent 中触发 moveAdamTo，这里不需要额外处理
  // 但要清除空闲计时器
  if (idleTimer) clearTimeout(idleTimer)
})

// ── 页面加载时启动空闲行为 ──
onMounted(async () => {
  startIdleTimer()
  window.addEventListener('resize', onWindowResize)
  adamStore.fetchRealAssets()
  await loadChatHistory()
  // 打开时定位到最新一条消息
  scrollChatToBottom()
  // 视口尺寸要等布局稳定，分多次取景（异步内嵌时容器出现更晚）
  nextTick(() => fitToView())
  setTimeout(fitToView, 400)
  setTimeout(fitToView, 1000)
})

onUnmounted(() => {
  window.removeEventListener('resize', onWindowResize)
  if (_fitTimer) clearTimeout(_fitTimer)
  if (workTimer) clearTimeout(workTimer)
  if (idleTimer) clearTimeout(idleTimer)
  if (moveDoneTimer) clearTimeout(moveDoneTimer)
})

// ── 下达任务弹窗（通用 AI 工具，需要参数） ──
interface TaskField { key: string; placeholder: string; type?: string }
const showTaskDialog = ref(false)
const taskDialogTitle = ref('')
const taskDialogDesc = ref('')
const taskDialogToolId = ref('')
const taskDialogFields = ref<TaskField[]>([])
const taskParams = ref<Record<string, string>>({})
const taskResultText = ref('')

function getToolTaskConfig(tid: string): { title: string; desc: string; fields: TaskField[] } | null {
  const cfg: Record<string, { title: string; desc: string; fields: TaskField[] }> = {
    scan_market_news: {
      title: t('city.taskTools.scan_market_news.title'),
      desc: t('city.taskTools.scan_market_news.desc'),
      fields: [{ key: 'keywords', placeholder: t('city.taskTools.scan_market_news.keywords') }],
    },
    get_sector_heat: {
      title: t('city.taskTools.get_sector_heat.title'),
      desc: t('city.taskTools.get_sector_heat.desc'),
      fields: [{ key: 'top_n', placeholder: t('city.taskTools.get_sector_heat.top_n'), type: 'number' }],
    },
    get_northbound_flow: {
      title: t('city.taskTools.get_northbound_flow.title'),
      desc: t('city.taskTools.get_northbound_flow.desc'),
      fields: [],
    },
    get_stock_realtime: {
      title: t('city.taskTools.get_stock_realtime.title'),
      desc: t('city.taskTools.get_stock_realtime.desc'),
      fields: [{ key: 'symbol', placeholder: t('city.taskTools.get_stock_realtime.symbol') }],
    },
    get_stock_history: {
      title: t('city.taskTools.get_stock_history.title'),
      desc: t('city.taskTools.get_stock_history.desc'),
      fields: [
        { key: 'symbol', placeholder: t('city.taskTools.get_stock_history.symbol') },
        { key: 'period', placeholder: t('city.taskTools.get_stock_history.period') },
        { key: 'count', placeholder: t('city.taskTools.get_stock_history.count'), type: 'number' },
      ],
    },
    analyze_fundamentals: {
      title: t('city.taskTools.analyze_fundamentals.title'),
      desc: t('city.taskTools.analyze_fundamentals.desc'),
      fields: [{ key: 'symbol', placeholder: t('city.taskTools.analyze_fundamentals.symbol') }],
    },
    screen_stocks: {
      title: t('city.taskTools.screen_stocks.title'),
      desc: t('city.taskTools.screen_stocks.desc'),
      fields: [{ key: 'criteria', placeholder: t('city.taskTools.screen_stocks.criteria') }],
    },
    generate_research_report: {
      title: t('city.taskTools.generate_research_report.title'),
      desc: t('city.taskTools.generate_research_report.desc'),
      fields: [
        { key: 'symbol', placeholder: t('city.taskTools.generate_research_report.symbol') },
        { key: 'subject', placeholder: t('city.taskTools.generate_research_report.subject') },
        { key: 'focus', placeholder: t('city.taskTools.generate_research_report.focus') },
      ],
    },
    consult_marketing_expert: {
      title: t('city.taskTools.consult_marketing_expert.title'),
      desc: t('city.taskTools.consult_marketing_expert.desc'),
      fields: [
        { key: 'question', placeholder: t('city.taskTools.consult_marketing_expert.question') },
        { key: 'context', placeholder: t('city.taskTools.consult_marketing_expert.context') },
      ],
    },
  }
  return cfg[tid] || null
}

function openTaskDialog(tid: string) {
  const cfg = getToolTaskConfig(tid)
  if (!cfg) return
  taskDialogTitle.value = cfg.title
  taskDialogDesc.value = cfg.desc
  taskDialogToolId.value = tid
  taskDialogFields.value = cfg.fields
  taskParams.value = {}
  taskResultText.value = ''
  showTaskDialog.value = true
}

async function handleRunTask() {
  const tid = taskDialogToolId.value
  if (toolRunning.value) return
  toolRunning.value = tid
  taskResultText.value = ''

  try {
    const token = localStorage.getItem('erp_token') || ''
    // 把用户填的参数拼进消息，让AI知道该用什么参数
    const paramStr = Object.entries(taskParams.value)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}="${v}"`)
      .join('，')
    const content = paramStr
      ? t('city.executeToolWithParams', { tool: tid, params: paramStr })
      : t('city.executeToolPrompt', { tool: tid })

    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        adamState: { ...adamStore.core },
        books: adamStore.books,
        toolParams: taskParams.value,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = ''
    let streamDone = false

    while (reader && !streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { streamDone = true; break }
        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') result += data.text
          else if (data.type === 'tool_result') result += data.result || ''
        } catch { /* ignore */ }
      }
    }
    taskResultText.value = result || t('city.taskDoneNoResult')
    // 同步到主工具结果显示
    toolResults.value[tid] = result || t('city.toolDone')
    toolResultDisplay.value = result || t('city.toolDone')
    toolResultId.value = tid
  } catch (e: any) {
    taskResultText.value = t('city.executionFailed', { message: e.message })
  } finally {
    toolRunning.value = null
  }
}

// ── 保险箱弹窗 ──
const showVaultDialog = ref(false)
const vaultAction = ref<'deposit' | 'withdraw'>('deposit')
const vaultAmount = ref('')
const vaultBalance = computed(() =>
  adamStore.ledger
    .filter(e => e.kind === 'vault_deposit' || e.kind === 'vault_release')
    .reduce((s, e) => e.kind === 'vault_deposit' ? s + e.amount : s - e.amount, 0)
)

function handleVault() {
  const amount = parseFloat(vaultAmount.value)
  if (!amount || amount <= 0) return
  if (vaultAction.value === 'deposit') {
    adamStore.addLedgerEntry({
      id: `led_vault_${Date.now()}`,
      at: new Date().toISOString(),
      kind: 'vault_deposit',
      amount,
      direction: 'out',
      title: t('city.vaultDeposit', { amount }),
      linkedEventIds: [],
    })
  } else {
    if (amount > vaultBalance.value) { alert(t('city.vaultOverBalance')); return }
    adamStore.addLedgerEntry({
      id: `led_vault_${Date.now()}`,
      at: new Date().toISOString(),
      kind: 'vault_release',
      amount,
      direction: 'in',
      title: t('city.vaultWithdraw', { amount }),
      linkedEventIds: [],
    })
  }
  vaultAmount.value = ''
  showVaultDialog.value = false
}

// ── 图书馆弹窗 ──
const showLibraryDialog = ref(false)
const showAddBookDialog = ref(false)
const librarySearch = ref('')
const bookForm = ref({ title: '', tags: '', content: '' })

const filteredBooks = computed(() => {
  const q = librarySearch.value.toLowerCase()
  if (!q) return adamStore.books
  return adamStore.books.filter(b =>
    b.title?.toLowerCase().includes(q) ||
    b.tags?.some(t => t.toLowerCase().includes(q))
  )
})

function handleAddBook() {
  if (!bookForm.value.title || !bookForm.value.content) return
  adamStore.addBook({
    id: `book_${Date.now()}`,
    title: bookForm.value.title,
    content: bookForm.value.content,
    author: 'user',
    tags: bookForm.value.tags ? bookForm.value.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
    createdAt: new Date().toISOString(),
    linkedEventIds: [],
  })
  bookForm.value = { title: '', tags: '', content: '' }
  showAddBookDialog.value = false
}

// ── 档案馆反思弹窗 ──
const showReflectionDialog = ref(false)
const reflectionPrompt = ref('')
const reflectionResultText = ref('')

async function handleWriteReflection() {
  if (toolRunning.value) return
  toolRunning.value = 'write_reflection'
  reflectionResultText.value = ''
  try {
    const token = localStorage.getItem('erp_token') || ''
    const content = reflectionPrompt.value
      ? t('city.executeReflectionPrompt', { prompt: reflectionPrompt.value })
      : t('city.executeReflectionFree')
    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({
        messages: [{ role: 'user', content }],
        adamState: { ...adamStore.core },
        books: adamStore.books,
      }),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = ''
    let streamDone = false
    while (reader && !streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { streamDone = true; break }
        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') result += data.text
          else if (data.type === 'tool_result') {
            // 解析日记内容写入store
            try {
              const r = JSON.parse(data.result || '{}')
              if (r.content) {
                adamStore.addReflection({ id: r.id || `ref_${Date.now()}`, at: r.at || new Date().toISOString(), content: r.content, linkedEventIds: [] })
              }
            } catch { /* ignore */ }
            result += data.result || ''
          }
        } catch { /* ignore */ }
      }
    }
    reflectionResultText.value = result || t('city.reflectionDone')
    reflectionPrompt.value = ''
  } catch (e: any) {
    reflectionResultText.value = t('city.executionFailed', { message: e.message })
  } finally {
    toolRunning.value = null
  }
}

// ── 迁移建筑弹窗 ──
const showRelocateDialog = ref(false)
const relocateForm = ref({ buildingId: '', newX: '', newY: '', reason: '' })

function handleRelocate() {
  const bldg = adamStore.buildings.find(b => b.id === relocateForm.value.buildingId)
  if (!bldg) return
  const newX = parseInt(relocateForm.value.newX)
  const newY = parseInt(relocateForm.value.newY)
  if (isNaN(newX) || isNaN(newY)) return
  bldg.position.gridX = newX
  bldg.position.gridY = newY
  adamStore.addEvent({
    id: `ev_relocate_${Date.now()}`,
    type: 'building_relocated',
    stage: 'act',
    title: t('city.buildingRelocated', {
      name: displayBuildingName(bldg.institutionId || bldg.type, bldg.name),
      x: newX,
      y: newY,
    }),
    summary: relocateForm.value.reason || '',
    at: new Date().toISOString(),
    institutionId: (bldg.institutionId as any) || undefined,
  })
  adamStore.persist()
  relocateForm.value = { buildingId: '', newX: '', newY: '', reason: '' }
  showRelocateDialog.value = false
}

// ── 升级建筑弹窗 ──
const showUpgradeDialog = ref(false)
const upgradeForm = ref({ buildingId: '', newType: '', reason: '' })

function handleUpgrade() {
  const bldg = adamStore.buildings.find(b => b.id === upgradeForm.value.buildingId)
  if (!bldg || !upgradeForm.value.newType) return
  const fromType = bldg.type
  bldg.status = 'upgrading'
  bldg.upgradeHistory = bldg.upgradeHistory || []
  bldg.upgradeHistory.push({ at: new Date().toISOString(), fromType, toType: upgradeForm.value.newType, reason: upgradeForm.value.reason || undefined })
  bldg.type = upgradeForm.value.newType
  bldg.status = 'active'
  adamStore.addEvent({
    id: `ev_upgrade_${Date.now()}`,
    type: 'building_upgraded',
    stage: 'act',
    title: t('city.buildingUpgraded', {
      name: displayBuildingName(bldg.institutionId || bldg.type, bldg.name),
      type: upgradeForm.value.newType,
      level: bldg.upgradeHistory.length,
    }),
    summary: upgradeForm.value.reason || '',
    at: new Date().toISOString(),
    institutionId: (bldg.institutionId as any) || undefined,
  })
  adamStore.persist()
  upgradeForm.value = { buildingId: '', newType: '', reason: '' }
  showUpgradeDialog.value = false
}

// ── ERP权限申请弹窗 ──
const showErpAccessDialog = ref(false)
const erpAccessForm = ref({ dataType: 'sales', reason: '' })

function handleErpAccess(approved: boolean) {
  if (approved) {
    adamStore.addEvent({
      id: `ev_erp_${Date.now()}`,
      type: 'institution_unlocked',
      stage: 'act',
      title: t('city.erpAccessApproved', { type: erpAccessForm.value.dataType }),
      summary: erpAccessForm.value.reason || '',
      at: new Date().toISOString(),
      institutionId: 'finance_gateway',
    })
  }
  showErpAccessDialog.value = false
}

// ── 记录投资弹窗 ──
const showRecordInvestmentDialog = ref(false)
const riForm = ref({ symbol: '', direction: 'buy', amount: '', note: '' })

function handleRecordInvestment() {
  const amount = parseFloat(riForm.value.amount)
  if (!amount || amount <= 0) return
  const isBuy = riForm.value.direction === 'buy'
  const tradeNote = riForm.value.note ? `：${riForm.value.note}` : ''
  adamStore.addLedgerEntry({
    id: `led_invest_${Date.now()}`,
    at: new Date().toISOString(),
    kind: 'cost',
    amount,
    direction: isBuy ? 'out' : 'in',
    title: t('city.investTradeLedger', {
      side: isBuy ? t('city.buy') : t('city.sell'),
      symbol: riForm.value.symbol || t('city.unknownSymbol'),
      note: tradeNote,
    }),
    linkedEventIds: [],
  })
  adamStore.addEvent({
    id: `ev_invest_${Date.now()}`,
    type: 'trade_result_recorded',
    stage: 'act',
    title: t('city.investTradeEvent', {
      side: isBuy ? t('city.buy') : t('city.sell'),
      symbol: riForm.value.symbol || t('city.unknownSymbol'),
      amount,
    }),
    summary: riForm.value.note || '',
    at: new Date().toISOString(),
    institutionId: 'bureau',
  })
  riForm.value = { symbol: '', direction: 'buy', amount: '', note: '' }
  showRecordInvestmentDialog.value = false
}

// ── 结算分红弹窗 ──
const showDividendDialog = ref(false)
const dvForm = ref({ totalProfit: '', note: '' })

const dividendRatioMap: Record<string, number> = { C: 0.1, B: 0.2, 'B+': 0.3, A: 0.4, S: 0.5 }
const dividendRatio = computed(() => dividendRatioMap[adamStore.core.creditLevel] || 0.1)

function handleSettleDividend() {
  const total = parseFloat(dvForm.value.totalProfit)
  if (!total || total <= 0) return
  const userShare = parseFloat((total * dividendRatio.value).toFixed(2))
  const adamShare = parseFloat((total * (1 - dividendRatio.value)).toFixed(2))
  // 用户分红：从亚当账户扣出
  adamStore.addLedgerEntry({
    id: `led_div_user_${Date.now()}`,
    at: new Date().toISOString(),
    kind: 'dividend',
    amount: userShare,
    direction: 'out',
    title: t('city.dividendLedger', { ratio: dividendRatio.value * 100, amount: userShare, note: dvForm.value.note ? ` — ${dvForm.value.note}` : '' }),
    linkedEventIds: [],
  })
  adamStore.addEvent({
    id: `ev_div_${Date.now()}`,
    type: 'ledger_entry_created',
    stage: 'settle',
    title: t('city.dividendEvent', { total, userShare, adamShare }),
    summary: dvForm.value.note || '',
    at: new Date().toISOString(),
    institutionId: 'bureau',
  })
  dvForm.value = { totalProfit: '', note: '' }
  showDividendDialog.value = false
}

// ── 执行赔付弹窗 ──
const showPenaltyDialog = ref(false)
const penForm = ref({ lossAmount: '', selfConfidence: '', objConfidence: '', note: '' })

const penaltyAmount = computed(() => {
  const loss = parseFloat(penForm.value.lossAmount) || 0
  const obj = parseFloat(penForm.value.objConfidence) || 0
  return loss * (obj / 100) * 0.1
})

function handleApplyPenalty() {
  const loss = parseFloat(penForm.value.lossAmount)
  const obj = parseFloat(penForm.value.objConfidence)
  if (!loss || loss <= 0 || !obj) return
  const penalty = parseFloat(penaltyAmount.value.toFixed(2))
  adamStore.addLedgerEntry({
    id: `led_pen_${Date.now()}`,
    at: new Date().toISOString(),
    kind: 'penalty',
    amount: penalty,
    direction: 'out',
    title: t('city.penaltyLedger', { loss, confidence: obj, penalty, note: penForm.value.note ? ` — ${penForm.value.note}` : '' }),
    linkedEventIds: [],
  })
  adamStore.addEvent({
    id: `ev_pen_${Date.now()}`,
    type: 'dispute_resolved',
    stage: 'settle',
    title: t('city.penaltyEvent', { penalty, loss, confidence: obj }),
    summary: penForm.value.note || '',
    at: new Date().toISOString(),
    institutionId: 'bureau',
  })
  penForm.value = { lossAmount: '', selfConfidence: '', objConfidence: '', note: '' }
  showPenaltyDialog.value = false
}

// ── 发出指令弹窗 ──
const showIssueRecommDialog = ref(false)
const recForm = ref({ title: '', symbol: '', direction: 'long', targetPrice: '', stopLoss: '', confidence: 70, thesis: '', riskNote: '' })

function handleIssueRecommendation() {
  if (!recForm.value.title || !recForm.value.thesis || !recForm.value.riskNote) return
  const rec = {
    id: `rec_${Date.now()}`,
    title: recForm.value.title,
    symbol: recForm.value.symbol || undefined,
    issuedAt: new Date().toISOString(),
    confidence: recForm.value.confidence,
    status: 'issued' as const,
    thesis: recForm.value.thesis,
    riskNote: recForm.value.riskNote,
    linkedEventIds: [] as string[],
  }
  adamStore.addRecommendation(rec)
  adamStore.addEvent({
    id: `ev_rec_${Date.now()}`,
    type: 'recommendation_issued',
    stage: 'act',
    title: t('city.recommendationEvent', { title: rec.title }),
    summary: t('city.recommendationSummary', { confidence: rec.confidence, thesis: rec.thesis.slice(0, 60) }),
    at: new Date().toISOString(),
    institutionId: 'bureau',
  })
  recForm.value = { title: '', symbol: '', direction: 'long', targetPrice: '', stopLoss: '', confidence: 70, thesis: '', riskNote: '' }
  showIssueRecommDialog.value = false
}

// ── 工具执行 ──
const toolRunning = ref<string | null>(null)
const toolResults = ref<Record<string, string>>({})
const toolResultDisplay = ref('')
const toolResultId = ref('')

async function executeTool(tid: string) {
  // 拦截有专属对话框的工具，直接打开弹窗
  if (tid === 'record_investment') { showRecordInvestmentDialog.value = true; return }
  if (tid === 'settle_dividend') { showDividendDialog.value = true; return }
  if (tid === 'apply_penalty') { showPenaltyDialog.value = true; return }
  if (tid === 'issue_recommendation') { showIssueRecommDialog.value = true; return }
  if (tid === 'manage_vault') { showVaultDialog.value = true; return }
  if (tid === 'browse_books') { showLibraryDialog.value = true; return }
  if (tid === 'add_book') { showAddBookDialog.value = true; return }
  if (tid === 'write_reflection') { showReflectionDialog.value = true; return }
  if (tid === 'relocate_structure') { showRelocateDialog.value = true; return }
  if (tid === 'upgrade_structure') { showUpgradeDialog.value = true; return }
  if (tid === 'request_erp_access') { showErpAccessDialog.value = true; return }
  // 需要参数的 AI 工具 → 下达任务弹窗
  if (getToolTaskConfig(tid)) { openTaskDialog(tid); return }

  if (toolRunning.value) return
  toolRunning.value = tid
  toolResultDisplay.value = ''
  toolResultId.value = tid

  try {
    const token = localStorage.getItem('erp_token') || ''
    const res = await fetch('/api/adam-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-erp-token': token },
      body: JSON.stringify({
        messages: [{ role: 'user', content: t('city.executeToolPrompt', { tool: tid }) }],
        adamState: { ...adamStore.core },
        books: adamStore.books,
      }),
    })

    if (!res.ok) throw new Error(`HTTP ${res.status}`)

    const reader = res.body?.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let result = ''
    let streamDone = false

    while (reader && !streamDone) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue
        const payload = line.slice(6).trim()
        if (payload === '[DONE]') { streamDone = true; break }
        try {
          const data = JSON.parse(payload)
          if (data.type === 'text') result += data.text
          else if (data.type === 'tool_result') {
            result += data.result || ''
            // build_structure：解析结果并写入 store
            if (tid === 'build_structure' && data.result) {
              try {
                const r = JSON.parse(data.result)
                if (r.institution && r.building) {
                  adamStore.addInstitution(r.institution)
                  adamStore.addBuilding(r.building)
                }
              } catch { /* ignore */ }
            }
          }
        } catch { /* ignore */ }
      }
    }

    toolResults.value[tid] = result || t('city.toolDone')
    toolResultDisplay.value = result || t('city.toolDone')
  } catch (e: any) {
    toolResults.value[tid] = t('city.toolError', { message: e.message })
    toolResultDisplay.value = t('city.toolError', { message: e.message })
  } finally {
    toolRunning.value = null
  }
}

const instMap = computed(() => {
  const map: Record<string, typeof adamStore.institutions[0]> = {}
  for (const inst of adamStore.institutions) map[inst.institutionId] = inst
  return map
})

const selectedInst = computed(() =>
  selectedId.value ? adamStore.institutions.find((i) => i.institutionId === selectedId.value) || null : null,
)

const selectedBuilding = computed(() =>
  selectedId.value ? adamStore.buildings.find((b) => b.institutionId === selectedId.value) || null : null,
)

const relatedEvents = computed(() => {
  if (!selectedInst.value) return []
  return adamStore.events
    .filter((e) => e.institutionId === selectedId.value)
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, 5)
})

// ── 待审批贷款 ──
const pendingLoans = computed(() =>
  adamStore.events.filter(
    (e) => e.institutionId === 'finance_gateway' && e.metadata?.loanStatus === 'pending_approval',
  ),
)

function approveLoan(event: any) {
  const amount = Number(event.metadata?.amount) || 0
  const now = new Date().toISOString()
  const idStr = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  // 打钱进预算
  adamStore.addLedgerEntry({
    id: `led_loan_${idStr}`,
    at: now,
    kind: 'loan',
    amount,
    direction: 'in',
    title: t('city.loanReceived', { amount, purpose: event.metadata?.purpose || '' }),
    linkedEventIds: [event.id],
  })
  // 标记已审批
  event.metadata.loanStatus = 'approved'
  adamStore.persist()
}

function rejectLoan(event: any) {
  event.metadata.loanStatus = 'rejected'
  adamStore.persist()
}

// ── 左侧状态栏：按区域分组的机构 ──
const zoneList = computed(() => [
  { key: 'command', label: t('city.zoneLabels.command'), items: adamStore.institutions.filter((i) => i.zone === 'command_center') },
  { key: 'intelligence', label: t('city.zoneLabels.intelligence'), items: adamStore.institutions.filter((i) => i.zone === 'intelligence') },
  { key: 'commerce', label: t('city.zoneLabels.commerce'), items: adamStore.institutions.filter((i) => i.zone === 'commerce') },
  { key: 'adam', label: t('city.zoneLabels.adam'), items: adamStore.institutions.filter((i) => i.zone === 'adam_domain') },
])

const emojiMap: Record<string, string> = {
  bureau: '🏛', finance_gateway: '🏦', reactor: '⚡',
  intel_station: '📡', research_institute: '🔬', adam_academy: '🎓',
  data_center: '💾', risk_lab: '⚗️', arbitration_hall: '⚖️',
  ad_company: '📺', archive: '📚', corner: '🏠',
  marketing_consultancy: '📊', library: '📖',
}
function getEmoji(id: string) { return emojiMap[id] || '🏗️' }

function translated(key: string, fallback: string) {
  const value = t(key)
  return value && value !== key ? value : fallback
}

function statusLabel(status: string) {
  return translated(`city.statusLabels.${status}`, status.toUpperCase())
}

function buildingStatusLabel(status: string) {
  return translated(`city.buildingStatuses.${status}`, status)
}

function toolDisplayName(tid: string) {
  return translated(`city.toolNames.${tid}`, tid)
}

function displayInstitutionName(instId: string, fallback?: string) {
  return translated(`city.institutionNames.${instId}`, fallback || instId)
}

function displayBuildingName(instId: string, fallback?: string) {
  return translated(`city.buildingNames.${instId}`, displayInstitutionName(instId, fallback))
}

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const min = d.getMinutes().toString().padStart(2, '0')
    return `${month}/${day} ${hour}:${min}`
  } catch { return '--/-- --:--' }
}

function formatDate(iso: string) {
  try {
    const d = new Date(iso)
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`
  } catch { return '--' }
}

// ── 等轴测参数 ──
const TILE_W = 80
const TILE_H = 40
const GROUND_SIZE = 32

// 视角角度
const rotateAngle = ref(0)
const tiltAngle = ref(0)

// 建筑配色与高度
interface BldgDef {
  emoji: string
  h: number
  top: string
  left: string
  right: string
}
const bldgDefs: Record<string, BldgDef> = {
  // 指挥中心 — 金色政府风
  bureau:             { emoji: '🏛', h: 64, top: '#F5E6B8', left: '#D4A84A', right: '#A07820' },
  // 金融机构 — 琥珀黄金融塔
  finance_gateway:    { emoji: '🏦', h: 72, top: '#FFF3C0', left: '#E8C040', right: '#C09020' },
  // 反应堆 — 深色工业橙
  reactor:            { emoji: '⚡', h: 80, top: '#2A1E08', left: '#4A2A08', right: '#3A2010' },
  // 情报站 — 青色科技
  intel_station:      { emoji: '📡', h: 76, top: '#B8EEFF', left: '#4AAED0', right: '#2880A0' },
  // 研究院 — 冷蓝实验室
  research_institute: { emoji: '🔬', h: 68, top: '#C8F0F8', left: '#5ABCCE', right: '#3A96B0' },
  // 亚当学院 — 紫色神秘
  adam_academy:       { emoji: '🎓', h: 60, top: '#E8D0FF', left: '#9B59D6', right: '#7030B0' },
  // 数据仓库 — 深蓝矩阵
  data_center:        { emoji: '💾', h: 48, top: '#1A2A3A', left: '#0A1828', right: '#081420' },
  // 风险实验室 — 深红危险
  risk_lab:           { emoji: '⚗️', h: 52, top: '#3A0808', left: '#280606', right: '#1A0404' },
  // 仲裁所 — 古朴米黄
  arbitration_hall:   { emoji: '⚖️', h: 58, top: '#FFF8D0', left: '#D4B860', right: '#A89030' },
  // 广告公司 — 霓虹粉
  ad_company:         { emoji: '📺', h: 50, top: '#2A0A1A', left: '#4A0A2A', right: '#3A0618' },
  // 档案馆 — 暖棕木质
  archive:            { emoji: '📚', h: 44, top: '#8B6040', left: '#6B4820', right: '#4A3010' },
  // 亚当角落 — 温暖绿
  corner:             { emoji: '🏠', h: 38, top: '#A8C870', left: '#7A9848', right: '#5A7830' },
  // 营销顾问所 — 商业蓝
  marketing_consultancy: { emoji: '📊', h: 62, top: '#D0E8FF', left: '#5080C0', right: '#3060A0' },
  // 图书馆 — 古典棕
  library:               { emoji: '📖', h: 54, top: '#C8A060', left: '#A07840', right: '#785820' },
}
const defaultDef: BldgDef = { emoji: '🏗️', h: 36, top: '#E0D8C8', left: '#B0A890', right: '#8A8070' }

// 等轴测坐标转屏幕坐标
function isoToScreen(gx: number, gy: number) {
  const x = (gx - gy) * (TILE_W / 2)
  const y = (gx + gy) * (TILE_H / 2)
  return { x, y }
}

// 地面格子 — 全量铺满整个地图（避免空洞），区分草地/路面
const groundCells = computed(() => {
  const cells: Array<{ key: string; style: Record<string, string>; type: 'grass' | 'road' | 'path' | 'plaza' }> = []

  // 建筑坐标集合
  const bldgCoords = new Set(adamStore.buildings.map(b => `${b.position.gridX},${b.position.gridY}`))
  // 路径集合：所有建筑周围1格
  const pathCoords = new Set<string>()
  for (const b of adamStore.buildings) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        pathCoords.add(`${b.position.gridX + dx},${b.position.gridY + dy}`)
      }
    }
  }

  // 计算需要渲染的范围（所有建筑的包围盒 + padding）
  if (adamStore.buildings.length === 0) return cells
  let minX = 999, minY = 999, maxX = 0, maxY = 0
  for (const b of adamStore.buildings) {
    minX = Math.min(minX, b.position.gridX)
    minY = Math.min(minY, b.position.gridY)
    maxX = Math.max(maxX, b.position.gridX)
    maxY = Math.max(maxY, b.position.gridY)
  }
  const PAD = 5
  minX = Math.max(0, minX - PAD)
  minY = Math.max(0, minY - PAD)
  maxX = Math.min(GROUND_SIZE - 1, maxX + PAD)
  maxY = Math.min(GROUND_SIZE - 1, maxY + PAD)

  for (let gx = minX; gx <= maxX; gx++) {
    for (let gy = minY; gy <= maxY; gy++) {
      const k = `${gx},${gy}`
      const { x, y } = isoToScreen(gx, gy)
      // 中央雕塑广场（半径2.5格内全铺石板）
      const distC = Math.hypot(gx - 13.5, gy - 13.5)
      // 十字主干道：连接四大区域
      const isMainRoad = gx === 13 || gx === 14 || gy === 13 || gy === 14
      const type = distC <= 2.5 ? 'plaza' : bldgCoords.has(k) || isMainRoad ? 'road' : pathCoords.has(k) ? 'path' : 'grass'
      cells.push({
        key: `g${gx}_${gy}`,
        type,
        style: {
          left: x + 'px',
          top: y + 'px',
          width: TILE_W + 'px',
          height: TILE_H + 'px',
        },
      })
    }
  }
  return cells
})

// 装饰树木 — 建筑之间的空隙随机放树
const decorTrees = computed(() => {
  const trees: Array<{ key: string; x: number; y: number; size: 'sm' | 'md' }> = []
  const bldgKeys = new Set(adamStore.buildings.map(b => `${b.position.gridX},${b.position.gridY}`))
  // 在已渲染格子里找草地角落种树（固定规律，不用随机，避免响应式重算）
  const treeSpots = [
    [2, 2], [6, 2], [2, 6], [10, 2], [2, 10],
    [4, 8], [8, 4], [12, 6], [6, 12], [14, 3],
    [3, 14], [16, 8], [8, 16], [18, 4], [4, 18],
  ]
  for (const [gx, gy] of treeSpots) {
    if (bldgKeys.has(`${gx},${gy}`)) continue
    const { x, y } = isoToScreen(gx, gy)
    trees.push({
      key: `tree_${gx}_${gy}`,
      x,
      y,
      size: (gx + gy) % 3 === 0 ? 'md' : 'sm',
    })
  }
  return trees
})

// 建筑物（排序：y+x 大的后渲染 = 前面覆盖后面）
const sortedBuildings = computed(() => {
  const list: Array<{
    key: string; name: string; emoji: string; locked: boolean
    instId: string
    wallH: number; windowRows: number[]
    colorTop: string; colorLeft: string; colorRight: string
    posStyle: Record<string, string>
  }> = []

  for (const b of adamStore.buildings) {
    const def = bldgDefs[b.type] || defaultDef
    const isLocked = b.status === 'planned'
    const wallH = isLocked ? Math.round(def.h * 0.5) : def.h
    const { x, y } = isoToScreen(b.position.gridX, b.position.gridY)
    const rows = Math.max(0, Math.floor((wallH - 10) / 10))

    list.push({
      key: b.id,
      name: b.name,
      emoji: def.emoji,
      locked: isLocked,
      instId: b.institutionId || b.type,
      wallH,
      windowRows: Array.from({ length: rows }, (_, i) => i),
      colorTop: def.top,
      colorLeft: def.left,
      colorRight: def.right,
      posStyle: {
        left: x + 'px',
        top: y + 'px',
        zIndex: String(b.position.gridX + b.position.gridY),
      },
    })
  }

  list.sort((a, b) => parseInt(a.posStyle.zIndex) - parseInt(b.posStyle.zIndex))
  return list
})

// ── 视口控制：缩放 + 拖拽平移 + 右键旋转 ──
const viewportRef = ref<HTMLDivElement>()
const scale = ref(0.7)
const centerIso = isoToScreen(14, 13)
const panX = ref(-centerIso.x)
const panY = ref(-centerIso.y + 120)

/** 开场自动取景：把所有建筑框进视口 */
function fitToView() {
  const vp = viewportRef.value
  if (!vp || adamStore.buildings.length === 0) return
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const b of adamStore.buildings) {
    const { x, y } = isoToScreen(b.position.gridX, b.position.gridY)
    minX = Math.min(minX, x); maxX = Math.max(maxX, x)
    minY = Math.min(minY, y); maxY = Math.max(maxY, y)
  }
  // 余量：建筑精灵向上伸出约 200px，左右各留半栋
  minX -= 200; maxX += 200
  minY -= 240; maxY += 80
  const rect = vp.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const s = Math.max(0.3, Math.min(1.4, Math.min(rect.width / (maxX - minX), rect.height / (maxY - minY))))
  scale.value = s
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  // 场景原点位于视口水平中心、顶部 60px 处
  panX.value = -cx * s
  panY.value = rect.height / 2 - 60 - cy * s
}

// 容器尺寸变化（窗口缩放/侧栏折叠）后重新取景
let _fitTimer: ReturnType<typeof setTimeout> | null = null
function scheduleFit(delay = 280) {
  if (_fitTimer) clearTimeout(_fitTimer)
  _fitTimer = setTimeout(fitToView, delay)
}
function onWindowResize() { scheduleFit() }
watch([sidebarCollapsed, chatCollapsed], () => scheduleFit())

const sceneStyle = computed(() => ({
  transform: `translate(${panX.value}px, ${panY.value}px) scale(${scale.value}) rotate(${rotateAngle.value}deg) perspective(800px) rotateX(${tiltAngle.value}deg)`,
}))

function onWheel(e: WheelEvent) {
  const d = e.deltaY > 0 ? -0.1 : 0.1
  scale.value = Math.max(0.3, Math.min(3, scale.value + d))
}

let dragging = false
let rotating = false
let dragStartX = 0
let dragStartY = 0
let panStartX = 0
let panStartY = 0
let rotateStart = 0
let tiltStart = 0

function onDragStart(e: MouseEvent) {
  if (e.button === 2) {
    rotating = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    rotateStart = rotateAngle.value
    tiltStart = tiltAngle.value
    window.addEventListener('mousemove', onRotateMove)
    window.addEventListener('mouseup', onRotateEnd)
  } else {
    dragging = true
    dragStartX = e.clientX
    dragStartY = e.clientY
    panStartX = panX.value
    panStartY = panY.value
    window.addEventListener('mousemove', onDragMove)
    window.addEventListener('mouseup', onDragEnd)
  }
}
function onDragMove(e: MouseEvent) {
  if (!dragging) return
  panX.value = panStartX + (e.clientX - dragStartX)
  panY.value = panStartY + (e.clientY - dragStartY)
}
function onDragEnd() {
  dragging = false
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
}

function onRotateMove(e: MouseEvent) {
  if (!rotating) return
  const dx = e.clientX - dragStartX
  const dy = e.clientY - dragStartY
  rotateAngle.value = rotateStart + dx * 0.3
  tiltAngle.value = Math.max(-30, Math.min(30, tiltStart + dy * 0.3))
}
function onRotateEnd() {
  rotating = false
  window.removeEventListener('mousemove', onRotateMove)
  window.removeEventListener('mouseup', onRotateEnd)
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    pinchDist0 = getTouchDist(e)
    pinchScale0 = scale.value
    return
  }
  const t = e.touches[0]
  dragging = true
  dragStartX = t.clientX
  dragStartY = t.clientY
  panStartX = panX.value
  panStartY = panY.value
  window.addEventListener('touchmove', onTouchMove, { passive: true })
  window.addEventListener('touchend', onTouchEnd)
}
let pinchDist0 = 0
let pinchScale0 = 1
function getTouchDist(e: TouchEvent) {
  const [a, b] = [e.touches[0], e.touches[1]]
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY)
}
function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const d = getTouchDist(e)
    scale.value = Math.max(0.3, Math.min(3, pinchScale0 * (d / (pinchDist0 || 1))))
    return
  }
  if (!dragging) return
  const t = e.touches[0]
  panX.value = panStartX + (t.clientX - dragStartX)
  panY.value = panStartY + (t.clientY - dragStartY)
}
function onTouchEnd() {
  dragging = false
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
}

onUnmounted(() => {
  window.removeEventListener('mousemove', onDragMove)
  window.removeEventListener('mouseup', onDragEnd)
  window.removeEventListener('mousemove', onRotateMove)
  window.removeEventListener('mouseup', onRotateEnd)
  window.removeEventListener('touchmove', onTouchMove)
  window.removeEventListener('touchend', onTouchEnd)
})
</script>

<style scoped>
/* ═══════════════════════════════════════════════════
   生态园区 — City.vue
   Observatory-grade isometric pixel city
   ═══════════════════════════════════════════════════ */

.city-page {
  height: 100%;
  display: flex;
  gap: 0;
}

/* ── embed 模式（首页黄卡内嵌）── */
.city-page--embed { height: 100%; min-height: 0; }
.city-page--embed .city-main { border-radius: inherit; }
.city-page--embed .iso-viewport {
  min-height: 0;
  border-radius: inherit;
}
.city-page--embed .iso-controls { display: none; }
.city-page--embed .iso-hud { display: none; }
.city-page--embed .zone-labels { display: none; }
/* 顶部两角被首页悬浮组件占用，天气徽章居中放 */
.city-page--embed .mood-badge {
  top: 12px;
  right: auto;
  left: 50%;
  transform: translateX(-50%) scale(0.9);
  transform-origin: top center;
}

/* ── 左侧状态栏 ── */
.city-sidebar {
  width: 230px;
  flex-shrink: 0;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow-y: auto;
  margin-right: 16px;
  scrollbar-width: thin;
  transition: width 0.2s ease, margin-right 0.2s ease;
}
.city-sidebar.collapsed {
  width: 40px;
  margin-right: 8px;
  overflow: hidden;
}
.city-sidebar-toggle {
  width: 100%;
  min-height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 10px;
  background: var(--card-bg);
  border: none;
  border-bottom: 1px solid var(--border);
  color: #F5A623;
  cursor: pointer;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.city-sidebar-toggle:hover {
  background: rgba(245,166,35,0.05);
}

.sidebar-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px 8px;
  border-bottom: 1px solid var(--border);
}
.sidebar-title {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.sidebar-count {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  background: var(--faint);
  padding: 1px 6px;
  border-radius: 8px;
  font-family: 'SF Mono', 'Fira Code', monospace;
}

.sidebar-section {
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
}
.sidebar-section:last-child { border-bottom: none; }
.sidebar-section-title {
  font-size: 9px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 8px;
  letter-spacing: 0.06em;
  display: flex;
  align-items: center;
  gap: 6px;
}
.zone-indicator {
  width: 3px;
  height: 10px;
  border-radius: 1px;
}
.zone-indicator.command { background: #F5A623; }
.zone-indicator.intelligence { background: #00D4FF; }
.zone-indicator.commerce { background: #059669; }
.zone-indicator.adam { background: #A78BFA; }

.inst-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: 6px;
  margin-bottom: 2px;
  transition: all 0.15s;
  cursor: pointer;
  border: 1px solid transparent;
}
.inst-item:hover {
  background: var(--faint);
  border-color: var(--border);
}
.inst-item.locked { opacity: 0.40; }
.inst-item.selected {
  background: rgba(245,166,35,0.06);
  border-color: rgba(245,166,35,0.20);
}
.inst-emoji { font-size: 15px; flex-shrink: 0; }
.inst-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.inst-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.inst-status-label {
  font-size: 8px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}
.inst-dot { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
.inst-dot.idle { background: var(--dim); opacity: 0.5; }
.inst-dot.active { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.inst-dot.locked { background: var(--border); }
.inst-dot.busy { background: #F5A623; animation: dotPulse 1.5s ease-in-out infinite; }
.inst-dot.error { background: #FF4D4D; }
@keyframes dotPulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }

/* ── 详情面板 ── */
.detail-panel {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.detail-emoji { font-size: 22px; }
.detail-title-wrap { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.detail-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--dark);
}
.detail-status-tag {
  display: inline-block;
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  width: fit-content;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.detail-status-tag.idle { background: var(--faint); color: var(--dim); }
.detail-status-tag.active { background: rgba(0,229,160,0.08); color: #00E5A0; }
.detail-status-tag.locked { background: var(--faint); color: var(--dim); }
.detail-status-tag.cooldown { background: rgba(0,212,255,0.08); color: #00D4FF; }
.detail-status-tag.urgent { background: rgba(255,77,77,0.08); color: #FF4D4D; }
.detail-close {
  width: 22px; height: 22px; border: 1px solid var(--border); background: transparent;
  border-radius: 4px; cursor: pointer; color: var(--dim);
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  transition: all 0.15s;
}
.detail-close:hover { border-color: var(--mid); color: var(--dark); }

.detail-section {
  border-top: 1px solid var(--border);
  padding-top: 10px;
}
.detail-section-title {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  margin-bottom: 8px;
  letter-spacing: 0.1em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  display: flex;
  align-items: center;
  gap: 6px;
}
.inst-status-control {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  background: var(--faint);
  border-radius: 4px;
}
.cur-status {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 3px;
  text-transform: uppercase;
  font-family: 'SF Mono', monospace;
}
.cur-status.active { color: #28C76F; background: rgba(40,199,111,0.12); }
.cur-status.idle { color: #999; background: rgba(255,255,255,0.08); }
.cur-status.locked { color: #FF9F43; background: rgba(255,159,67,0.12); }
.status-btns { display: flex; gap: 6px; }
.status-btn {
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 3px;
  border: none;
  cursor: pointer;
  font-weight: 600;
  font-family: 'SF Mono', monospace;
  letter-spacing: 0.05em;
}
.status-btn.activate {
  color: #28C76F;
  background: rgba(40,199,111,0.12);
  border: 1px solid rgba(40,199,111,0.25);
}
.status-btn.activate:hover:not(:disabled) { background: rgba(40,199,111,0.22); }
.status-btn.activate:disabled { opacity: 0.4; cursor: not-allowed; }
.status-btn.deactivate {
  color: #FF6B6B;
  background: rgba(255,107,107,0.12);
  border: 1px solid rgba(255,107,107,0.25);
}
.status-btn.deactivate:hover { background: rgba(255,107,107,0.22); }
.status-hint {
  margin-top: 6px;
  font-size: 10px;
  color: var(--dim);
  font-style: italic;
}
.tool-count {
  background: var(--faint);
  padding: 0 4px;
  border-radius: 3px;
  font-size: 8px;
}
.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 3px 0;
}
.detail-label { font-size: 11px; color: var(--dim); }
.detail-value {
  font-size: 11px;
  font-weight: 600;
  color: var(--dark);
}
.detail-value.mono { font-family: 'SF Mono', 'Fira Code', monospace; letter-spacing: 0.03em; }
.detail-value.active { color: #00E5A0; }
.detail-value.planned { color: var(--dim); }

/* 工具网格 */
.tool-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tool-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  padding: 4px 10px;
  border-radius: 4px;
  background: var(--faint);
  color: var(--mid);
  border: 1px solid var(--border);
  font-family: inherit;
  cursor: pointer;
  transition: all 0.15s;
}
.tool-chip:hover:not(:disabled) {
  background: rgba(245,166,35,0.06);
  border-color: rgba(245,166,35,0.25);
  color: #F5A623;
}
.tool-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.tool-chip.running {
  border-color: rgba(0,212,255,0.3);
  color: #00D4FF;
  background: rgba(0,212,255,0.05);
}
.tool-chip.done {
  border-color: rgba(0,229,160,0.2);
  color: #00E5A0;
}
.tool-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #00D4FF;
  opacity: 0.5;
  flex-shrink: 0;
}
.tool-chip:hover:not(:disabled) .tool-indicator { background: #F5A623; opacity: 1; }
.tool-chip.running .tool-indicator {
  background: #00D4FF;
  opacity: 1;
  animation: toolSpin 0.8s linear infinite;
}
.tool-chip.done .tool-indicator { background: #00E5A0; opacity: 1; }
@keyframes toolSpin {
  0% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); }
  50% { box-shadow: 0 0 0 3px rgba(0,212,255,0); }
  100% { box-shadow: 0 0 0 0 rgba(0,212,255,0.4); }
}

/* 工具执行结果面板 */
.tool-result-panel {
  margin-top: 8px;
  background: var(--faint);
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
}
.tool-result-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 8px;
  border-bottom: 1px solid var(--border);
  background: linear-gradient(180deg, rgba(0,212,255,0.03) 0%, transparent 100%);
}
.tool-result-name {
  font-size: 9px;
  font-weight: 700;
  color: #00D4FF;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
}
.tool-result-close {
  width: 16px;
  height: 16px;
  border: none;
  background: transparent;
  color: var(--dim);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 3px;
  transition: all 0.1s;
}
.tool-result-close:hover { background: var(--border); color: var(--dark); }
.loan-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 6px 0;
  border-bottom: 1px solid var(--border);
}
.loan-item:last-child { border-bottom: none; }
.loan-info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
.loan-amount { font-size: 13px; font-weight: 600; color: var(--bright); font-family: monospace; }
.loan-purpose { font-size: 10px; color: var(--dim); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.loan-actions { display: flex; gap: 4px; flex-shrink: 0; }
.loan-btn {
  padding: 3px 10px;
  border-radius: 4px;
  border: none;
  font-size: 11px;
  cursor: pointer;
  font-weight: 600;
}
.loan-btn.approve { background: rgba(0, 229, 160, 0.15); color: #00E5A0; }
.loan-btn.approve:hover { background: rgba(0, 229, 160, 0.3); }
.loan-btn.reject { background: rgba(255, 77, 77, 0.1); color: #FF6B6B; }
.loan-btn.reject:hover { background: rgba(255, 77, 77, 0.2); }

.tool-result-body {
  padding: 8px;
  font-size: 10px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--mid);
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 160px;
  overflow-y: auto;
  margin: 0;
  scrollbar-width: thin;
}

.detail-trace {
  font-size: 11px;
  color: var(--mid);
  line-height: 1.5;
  padding: 6px 8px;
  background: var(--faint);
  border-radius: 4px;
  margin-bottom: 8px;
  border-left: 2px solid rgba(245,166,35,0.3);
  display: flex;
  align-items: flex-start;
  gap: 6px;
}
.trace-indicator {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #F5A623;
  flex-shrink: 0;
  margin-top: 5px;
}
.detail-empty {
  font-size: 9px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  opacity: 0.5;
}
.detail-events {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.detail-event-item {
  display: flex;
  gap: 6px;
  align-items: center;
}
.detail-event-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  flex-shrink: 0;
}
.detail-event-dot.sense { background: #00D4FF; }
.detail-event-dot.judge { background: #F5A623; }
.detail-event-dot.act { background: #00E5A0; }
.detail-event-dot.settle { background: #A78BFA; }
.detail-event-dot.archive { background: var(--dim); }
.detail-event-time {
  font-size: 8px;
  color: var(--dim);
  font-family: 'SF Mono', 'Fira Code', monospace;
  min-width: 68px;
  flex-shrink: 0;
}
.detail-event-text {
  font-size: 10px;
  color: var(--mid);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── 建筑选中高亮 ── */
.iso-bldg.selected {
  filter: drop-shadow(2px 4px 4px rgba(80,100,60,0.18))
          brightness(1.12)
          drop-shadow(0 0 12px rgba(255,200,50,0.7));
}

/* ── 右侧城市 ── */
.city-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.panel {
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex: 1;
  display: flex;
  flex-direction: column;
}
.panel-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: linear-gradient(180deg, rgba(245,166,35,0.02) 0%, transparent 100%);
}
.panel-icon {
  font-size: 10px;
  color: #F5A623;
  opacity: 0.6;
}
.panel-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--dim);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.panel-badge {
  font-size: 8px;
  font-weight: 700;
  color: var(--dim);
  border: 1px solid var(--border);
  padding: 1px 5px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.05em;
  margin-left: auto;
}
.panel-badge.phase { margin-left: 4px; }

/* ═══════════════════════════════════════════
   像素风等轴测城市
   ═══════════════════════════════════════════ */
.iso-viewport {
  position: relative;
  flex: 1;
  min-height: 400px;
  overflow: hidden;
  cursor: grab;
  user-select: none;
  background:
    radial-gradient(ellipse at 50% 38%, #f7f1df 0%, #f1e9d3 55%, #eae0c6 100%);
  transition: background 1.5s ease;
}
.iso-viewport.mood-sunny {
  background:
    radial-gradient(ellipse at 50% 35%, #fff9d6 0%, #ffe9a8 55%, #f9d57a 100%);
}
.iso-viewport.mood-bright {
  background:
    radial-gradient(ellipse at 50% 36%, #fdf5e1 0%, #f6ead0 55%, #ebd8b2 100%);
}
.iso-viewport.mood-normal {
  background:
    radial-gradient(ellipse at 50% 38%, #f7f1df 0%, #f1e9d3 55%, #eae0c6 100%);
}
.iso-viewport.mood-rain {
  background:
    radial-gradient(ellipse at 50% 38%, #c4ccd6 0%, #a8b3c0 55%, #8b97a6 100%);
}
.iso-viewport.mood-storm {
  background:
    radial-gradient(ellipse at 50% 38%, #6a7280 0%, #4d5560 55%, #353c47 100%);
}
/* 氛围徽章 */
.mood-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 14px;
  font-size: 11px;
  font-family: 'SF Mono', monospace;
  font-weight: 600;
  backdrop-filter: blur(6px);
  background: rgba(255,255,255,0.85);
  color: #333;
  box-shadow: 0 2px 8px rgba(0,0,0,0.08);
  transition: all 0.3s ease;
}
.mood-badge.sunny { background: rgba(255, 232, 130, 0.9); color: #6b4f00; }
.mood-badge.bright { background: rgba(255,255,255,0.9); color: #444; }
.mood-badge.normal { background: rgba(255,255,255,0.85); color: #555; }
.mood-badge.rain { background: rgba(120,130,145,0.85); color: #fff; }
.mood-badge.storm { background: rgba(40,46,56,0.9); color: #ff8a8a; }
.mood-emoji { font-size: 14px; }
.mood-text { font-size: 11px; }
.mood-pnl { font-size: 10px; opacity: 0.8; padding-left: 4px; border-left: 1px solid rgba(0,0,0,0.15); }
.mood-badge.rain .mood-pnl, .mood-badge.storm .mood-pnl { border-left-color: rgba(255,255,255,0.2); }
/* 雨效果 */
.weather-rain {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 45;
  overflow: hidden;
}
.raindrop {
  position: absolute;
  top: -20px;
  width: 2px;
  height: 14px;
  background: linear-gradient(to bottom, transparent, rgba(180, 200, 230, 0.7));
  animation: fall 1.5s linear infinite;
}
@keyframes fall {
  to { transform: translateY(110vh); }
}
.iso-viewport:active { cursor: grabbing; }

/* 区域浮动标签 */
.zone-labels {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 10;
}
.zone-float-label {
  position: absolute;
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: #f6f0dc;
  border: 1.5px solid #4f4839;
  border-radius: 6px;
  padding: 5px 12px;
  box-shadow: 3px 3px 0 rgba(79, 72, 57, 0.18);
}
.zone-float-label b {
  font-size: 14px;
  font-weight: 900;
  color: #3c362a;
  letter-spacing: 2px;
}
.zone-float-label i {
  font-style: normal;
  font-size: 8px;
  color: #9a8f74;
  letter-spacing: 1px;
}
.zone-float-label.command { top: 14px; left: 18px; }
.zone-float-label.intelligence { top: 14px; right: 18px; }
.zone-float-label.commerce { bottom: 44px; left: 18px; }
.zone-float-label.adam { bottom: 44px; right: 18px; }

.iso-scene {
  position: relative;
  left: 50%;
  top: 60px;
  width: 0;
  height: 0;
  transform-origin: 0 0;
  transition: transform 0.05s linear;
  will-change: transform;
}

/* ── 地面三面立体地砖 ── */
.iso-ground {
  position: absolute;
  pointer-events: none;
  width: 80px;
  height: 40px;
}

/* 顶面 — 等距菱形 */
.ground-top {
  position: absolute;
  left: 0; top: 0;
  width: 80px;
  height: 40px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
}
/* 左侧面 — 平行四边形，贴菱形左下边 */
.ground-left {
  position: absolute;
  left: 0;
  top: 20px;
  width: 40px;
  height: 12px;
  clip-path: polygon(0% 0%, 100% 0%, 50% 100%, -50% 100%);
  transform: skewY(26.565deg);
  transform-origin: top left;
}
/* 右侧面 */
.ground-right {
  position: absolute;
  right: 0;
  top: 20px;
  width: 40px;
  height: 12px;
  clip-path: polygon(0% 0%, 100% 0%, 150% 100%, 50% 100%);
  transform: skewY(-26.565deg);
  transform-origin: top right;
}

/* 草坪 — 柔和灰橄榄绿（低饱和，融入纸色） */
.iso-ground.grass .ground-top {
  background: #c6cda8;
  box-shadow: inset 0 0 0 1px rgba(79, 72, 57, 0.07);
}
.iso-ground.grass .ground-left   { background: #a2aa84; }
.iso-ground.grass .ground-right  { background: #b3ba94; }

/* 小径（建筑周边1格）— 暖沙色 */
.iso-ground.path .ground-top {
  background: #ddd2b0;
  box-shadow: inset 0 0 0 1px rgba(79, 72, 57, 0.10);
}
.iso-ground.path .ground-left   { background: #b4a780; }
.iso-ground.path .ground-right  { background: #c6b992; }

/* 道路 — 浅石板 */
.iso-ground.road .ground-top {
  background: #e6ddc2;
  box-shadow: inset 0 0 0 1.5px rgba(79, 72, 57, 0.14);
}
.iso-ground.road .ground-left   { background: #bdb190; }
.iso-ground.road .ground-right  { background: #cfc3a2; }

/* 中央广场 — 亮米色铺装 */
.iso-ground.plaza .ground-top {
  background: #efe7cd;
  box-shadow: inset 0 0 0 1px rgba(79, 72, 57, 0.10);
}
.iso-ground.plaza .ground-left   { background: #c8bb9a; }
.iso-ground.plaza .ground-right  { background: #d9cdab; }

/* ── 等轴测建筑 ── */
.iso-bldg {
  position: absolute;
  width: 64px;
  height: 32px;
  cursor: pointer;
  transition: filter 0.2s;
  filter: drop-shadow(2px 4px 4px rgba(80,100,60,0.18));
}
.iso-bldg:hover {
  filter: drop-shadow(2px 4px 4px rgba(80,100,60,0.18))
          brightness(1.08)
          drop-shadow(0 0 8px rgba(255,255,255,0.5));
}
.iso-bldg.locked { opacity: 0.4; filter: saturate(0.15) brightness(0.85); }

/* 插画精灵模式：精灵底边对齐地砖中心 */
.iso-bldg.illo-mode { overflow: visible; }
.iso-bldg.illo-mode :deep(.illo-bldg) {
  position: absolute;
  left: 50%;
  bottom: -2px;
  transform: translateX(-50%);
  transition: transform 0.18s ease;
}
.iso-bldg.illo-mode:hover :deep(.illo-bldg) {
  transform: translateX(-50%) translateY(-4px);
}
.iso-bldg.illo-mode.locked { opacity: 0.9; }

/* 广场景观小品 */
.iso-decor {
  position: absolute;
  pointer-events: none;
}
.iso-decor svg {
  position: absolute;
  left: 40px;
  top: 20px;
  transform: translate(-50%, -50%);
}

/* 中央雕塑 */
.iso-statue {
  position: absolute;
  pointer-events: none;
}
.iso-statue :deep(.adam-statue) {
  position: absolute;
  left: 40px; /* 对齐地砖中心（TILE_W/2） */
  top: 20px;  /* TILE_H/2 */
  transform: translate(-50%, -82%);
}

/* 名称+状态标签牌（插画风吊牌） */
.bldg-callout {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 2px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
  background: #f6f0dc;
  border: 1.5px solid #4f4839;
  border-radius: 5px;
  padding: 2px 9px 3px;
  box-shadow: 2px 2px 0 rgba(79, 72, 57, 0.22);
  white-space: nowrap;
  pointer-events: none;
  transition: transform 0.15s ease;
}
.bldg-callout.on { transform: translateX(-50%) scale(1.12); }
.bc-name {
  font-size: 10px;
  font-weight: 800;
  color: #4f4839;
  letter-spacing: 0.5px;
}
.bc-status {
  font-size: 7px;
  font-weight: 700;
  letter-spacing: 1.5px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: #9a8f74;
}
.bc-status.active, .bc-status.urgent { color: #6d8f4e; }
.bc-status.locked, .bc-status.disabled { color: #b0543e; }
.bc-status.cooldown { color: #b08a3a; }

/* 进入大厅按钮（建筑上方） */
.bldg-enter-btn {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 110px);
  transform: translateX(-50%);
  white-space: nowrap;
  background: #4f4839;
  color: #f6f0dc;
  border: 1.5px solid #4f4839;
  border-radius: 6px;
  font-family: inherit;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1px;
  padding: 6px 14px;
  cursor: pointer;
  z-index: 30;
  box-shadow: 2.5px 2.5px 0 rgba(79, 72, 57, 0.3);
  animation: enterBtnBob 1.6s ease-in-out infinite;
}
.bldg-enter-btn:hover { background: #6d6450; }
@keyframes enterBtnBob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-5px); }
}

/* 墙体公共 */
.wall {
  position: absolute;
  bottom: 0;
  width: 32px;
}

/* 左墙 */
.wall-left {
  left: 0;
  transform-origin: bottom left;
  transform: skewY(26.565deg);
  border-right: 1px solid rgba(0,0,0,0.08);
  box-shadow: inset -1px 0 0 rgba(255,255,255,0.25);
}

/* 右墙 */
.wall-right {
  right: 0;
  transform-origin: bottom right;
  transform: skewY(-26.565deg);
  border-left: 1px solid rgba(0,0,0,0.06);
}

/* 窗户 */
.windows {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  height: 100%;
  padding: 8px 4px;
}
.win-row { display: flex; gap: 4px; }
.win {
  width: 7px;
  height: 6px;
  background: rgba(255,255,240,0.70);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 1px;
}
.wall-right .win {
  background: rgba(255,255,240,0.45);
  border-color: rgba(255,255,255,0.3);
}

/* 屋顶 — 菱形 */
.roof {
  position: absolute;
  left: 0;
  width: 64px;
  height: 32px;
  clip-path: polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%);
  box-shadow:
    inset 0 3px 0 rgba(255,255,255,0.55),
    inset 0 -1px 0 rgba(0,0,0,0.08);
}

/* 图标浮在屋顶上方 */
.bldg-icon {
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  font-size: 18px;
  line-height: 1;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25));
  z-index: 10;
}

/* 名字在建筑下方 — 始终显示 */
.bldg-name {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-top: 2px;
  font-size: 8px;
  font-weight: 700;
  color: #3d4a2e;
  white-space: nowrap;
  text-shadow: 0 1px 0 rgba(255,255,255,0.9), 0 0 4px rgba(255,255,255,0.8);
  opacity: 0.7;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
  transition: opacity 0.2s;
}
.iso-bldg:hover .bldg-name { opacity: 1; }
.iso-bldg.selected .bldg-name { opacity: 1; color: #c07000; }

/* HUD 叠加 */
.iso-hud {
  position: absolute;
  top: 10px;
  left: 14px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  z-index: 10;
}
.hud-item {
  font-size: 9px;
  font-weight: 700;
  color: #3d5030;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
  display: flex;
  align-items: center;
  gap: 6px;
  opacity: 0.6;
}
.hud-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
}
.hud-dot.alive { background: #00E5A0; box-shadow: 0 0 4px rgba(0,229,160,0.4); }
.hud-dot.dormant { background: var(--dim); }
.hud-dot.survival { background: #FF4D4D; animation: dotPulse 1s infinite; }
.hud-dot.shutdown { background: var(--dim); opacity: 0.3; }

.iso-controls {
  position: absolute;
  bottom: 10px;
  right: 14px;
  display: flex;
  gap: 10px;
  z-index: 10;
}
.iso-controls span {
  font-size: 8px;
  color: #4a5a3a;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
  opacity: 0.45;
}

/* ── 装饰树木 ── */
.deco-tree {
  position: absolute;
  pointer-events: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-10px) translateY(-52px);
  z-index: 5;
}
.deco-tree.md { transform: translateX(-14px) translateY(-64px); }

.tree-canopy {
  width: 28px;
  height: 28px;
  border-radius: 50% 50% 50% 50% / 60% 60% 40% 40%;
  background: radial-gradient(circle at 40% 35%, #8BC34A, #558B2F);
  box-shadow: inset -3px -2px 0 rgba(0,0,0,0.12), 2px 3px 4px rgba(60,80,30,0.2);
}
.deco-tree.md .tree-canopy {
  width: 36px;
  height: 36px;
}

.tree-trunk {
  width: 6px;
  height: 10px;
  background: #8D6E63;
  border-radius: 1px;
  box-shadow: inset -1px 0 0 rgba(0,0,0,0.2);
}
.deco-tree.md .tree-trunk {
  width: 8px;
  height: 13px;
}

@media (max-width: 767px) {
  .city-page { flex-direction: column; }
  .city-sidebar { width: 100%; margin-right: 0; margin-bottom: 12px; border-radius: 8px; max-height: 200px; }
  .sidebar-section { display: flex; flex-wrap: wrap; gap: 4px; padding: 8px 10px; }
  .sidebar-section-title { width: 100%; margin-bottom: 4px; }
  .inst-item { padding: 4px 6px; }
  .iso-viewport { min-height: 300px; }
  .bldg-icon { font-size: 16px; }
  .zone-labels { display: none; }
}

/* ═══════════════════════════════════════════
   亚当角色 — SVG 数字少年
   ═══════════════════════════════════════════ */

.adam-character {
  position: absolute;
  width: 80px;
  height: 120px;
  cursor: pointer;
  transition-property: left, top;
  transition-timing-function: ease-in-out;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-8px) translateY(-120px);
}
.adam-character:hover {
  filter: brightness(1.15) drop-shadow(0 0 8px rgba(0,212,255,0.4));
}
.adam-character.selected {
  filter: brightness(1.2) drop-shadow(0 0 12px rgba(245,166,35,0.6));
}

.adam-character.dormant {
  opacity: 0.7;
  filter: saturate(0.3) brightness(0.9);
}

.adam-character.survival .adam-body-svg {
  animation: survivalFlash 1.2s ease-in-out infinite;
}
@keyframes survivalFlash {
  0%, 100% { filter: none; }
  50% { filter: brightness(1.5) drop-shadow(0 0 6px rgba(255,77,77,0.8)); }
}

/* 行走动画 */
.adam-character.moving .adam-leg-l {
  animation: walkLegL 0.5s ease-in-out infinite;
  transform-origin: 33px 78px;
}
.adam-character.moving .adam-leg-r {
  animation: walkLegR 0.5s ease-in-out infinite;
  transform-origin: 47px 78px;
}
@keyframes walkLegL {
  0%, 100% { transform: rotate(-8deg); }
  50% { transform: rotate(8deg); }
}
@keyframes walkLegR {
  0%, 100% { transform: rotate(8deg); }
  50% { transform: rotate(-8deg); }
}

/* 行走时手臂摆动 */
.adam-character.moving .adam-arm-l {
  animation: walkArmL 0.5s ease-in-out infinite;
  transform-origin: 25px 42px;
}
.adam-character.moving .adam-arm-r {
  animation: walkArmR 0.5s ease-in-out infinite;
  transform-origin: 55px 42px;
}
@keyframes walkArmL {
  0%, 100% { transform: rotate(6deg); }
  50% { transform: rotate(-6deg); }
}
@keyframes walkArmR {
  0%, 100% { transform: rotate(-6deg); }
  50% { transform: rotate(6deg); }
}

/* 行走时上下弹跳 */
.adam-character.moving .adam-body-svg {
  animation: walkBounce 0.25s ease-in-out infinite;
}
@keyframes walkBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

/* 工作动画 */
.adam-character.working .adam-arm-l {
  animation: workArm 0.8s ease-in-out infinite;
  transform-origin: 25px 42px;
}
.adam-character.working .adam-arm-r {
  animation: workArm 0.8s ease-in-out infinite reverse;
  transform-origin: 55px 42px;
}
@keyframes workArm {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-15deg); }
}

/* 空闲呼吸动画 */
.adam-character:not(.moving):not(.working) .adam-body-svg {
  animation: idleBreathe 3s ease-in-out infinite;
}
@keyframes idleBreathe {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-1px); }
}

/* 地面阴影 */
.adam-shadow {
  position: absolute;
  bottom: -3px;
  left: 50%;
  transform: translateX(-50%);
}
.adam-character.moving .adam-shadow {
  animation: shadowPulse 0.5s ease-in-out infinite;
}
@keyframes shadowPulse {
  0%, 100% { transform: translateX(-50%) scaleX(1); }
  50% { transform: translateX(-50%) scaleX(0.8); }
}

/* SVG 主体 */
.adam-body-svg {
  position: relative;
  z-index: 2;
  width: 80px;
  height: 120px;
  object-fit: contain;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
}

/* 拖尾粒子 */
.adam-trail {
  position: absolute;
  bottom: 2px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 3px;
  z-index: 0;
}
.trail-dot {
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0;
  animation: trailFade 0.6s ease-out forwards;
}
@keyframes trailFade {
  0% { opacity: 0.6; transform: translateX(0); }
  100% { opacity: 0; transform: translateX(-8px); }
}

/* 状态气泡 */
.adam-bubble {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 6px;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 3px 8px;
  white-space: nowrap;
  z-index: 100;
  animation: bubbleIn 0.3s ease-out;
}
.bubble-text {
  font-size: 8px;
  font-weight: 600;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.03em;
}
.adam-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 4px solid transparent;
  border-top-color: rgba(0, 0, 0, 0.75);
}
@keyframes bubbleIn {
  0% { opacity: 0; transform: translateX(-50%) translateY(4px); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* ═══════════════════════════════════════════
   亚当浮动状态卡片
   ═══════════════════════════════════════════ */
.adam-popup {
  position: absolute;
  bottom: 100%;
  left: 50%;
  transform: translateX(-50%);
  margin-bottom: 10px;
  width: 260px;
  background: rgba(15, 15, 20, 0.92);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  padding: 12px;
  z-index: 200;
  animation: popupIn 0.25s ease-out;
  box-shadow: 0 8px 32px rgba(0,0,0,0.4);
}
.adam-popup::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 6px solid transparent;
  border-top-color: rgba(15, 15, 20, 0.92);
}
@keyframes popupIn {
  0% { opacity: 0; transform: translateX(-50%) translateY(8px) scale(0.95); }
  100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
}

.adam-popup-close {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 18px;
  height: 18px;
  border: none;
  background: transparent;
  color: rgba(255,255,255,0.4);
  font-size: 14px;
  cursor: pointer;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.adam-popup-close:hover { color: #fff; background: rgba(255,255,255,0.1); }

.adam-popup-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}
.adam-popup-name {
  font-size: 12px;
  font-weight: 800;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.08em;
}
.adam-popup-tag {
  font-size: 8px;
  font-weight: 700;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.06em;
}
.adam-popup-tag.alive { background: rgba(0,229,160,0.15); color: #00E5A0; }
.adam-popup-tag.dormant { background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.4); }
.adam-popup-tag.survival { background: rgba(255,77,77,0.15); color: #FF4D4D; }

.adam-popup-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  margin-bottom: 10px;
}
.adam-metric {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 6px;
  background: rgba(255,255,255,0.04);
  border-radius: 4px;
}
.adam-metric-label {
  font-size: 9px;
  color: rgba(255,255,255,0.4);
}
.adam-metric-val {
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.adam-metric-val.warn { color: #FF4D4D; }

.adam-popup-section {
  border-top: 1px solid rgba(255,255,255,0.06);
  padding-top: 8px;
  margin-top: 8px;
}
.adam-popup-section-title {
  font-size: 8px;
  font-weight: 700;
  color: rgba(255,255,255,0.3);
  letter-spacing: 0.12em;
  font-family: 'SF Mono', 'Fira Code', monospace;
  margin-bottom: 6px;
  display: block;
}

/* 情绪迷你条 */
.adam-popup-emotions {
  display: flex;
  flex-direction: column;
  gap: 3px;
}
.adam-emo-item {
  display: flex;
  align-items: center;
  gap: 6px;
}
.adam-emo-label {
  font-size: 8px;
  color: rgba(255,255,255,0.35);
  width: 24px;
  text-align: right;
  flex-shrink: 0;
}
.adam-emo-track {
  flex: 1;
  height: 4px;
  background: rgba(255,255,255,0.06);
  border-radius: 2px;
  overflow: hidden;
}
.adam-emo-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.5s ease;
}

/* 留言列表 */
.adam-popup-messages {
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 120px;
  overflow-y: auto;
  scrollbar-width: thin;
}
.adam-msg-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 5px 6px;
  background: rgba(255,255,255,0.03);
  border-radius: 4px;
  border-left: 2px solid rgba(0,212,255,0.3);
}
.adam-msg-time {
  font-size: 7px;
  color: rgba(255,255,255,0.25);
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.adam-msg-text {
  font-size: 10px;
  color: rgba(255,255,255,0.75);
  line-height: 1.4;
  word-break: break-all;
}
.adam-msg-empty {
  font-size: 9px;
  color: rgba(255,255,255,0.2);
  font-style: italic;
}

/* ── 资金账户 ── */
.fund-section { display: flex; flex-direction: column; gap: 8px; }
.fund-balance-row { display: flex; gap: 16px; flex-wrap: wrap; }
.fund-balance-block { display: flex; flex-direction: column; gap: 2px; }
.fund-balance-label { font-size: 9px; color: var(--muted); letter-spacing: 0.08em; }
.fund-balance-val { font-size: 14px; font-weight: 700; color: #e8e8e0; font-family: 'SF Mono', monospace; }
.fund-balance-val.positive { color: #00E5A0; }
.fund-balance-val.negative { color: #FF4D4D; }
.fund-sub-title { font-size: 9px; color: var(--muted); letter-spacing: 0.1em; }
.fund-pending { display: flex; flex-direction: column; gap: 4px; }
.transfer-card { display: flex; align-items: center; justify-content: space-between; padding: 6px 8px; background: rgba(245,166,35,0.05); border: 1px solid rgba(245,166,35,0.15); border-radius: 4px; }
.transfer-info { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.transfer-to { font-size: 11px; color: #e8e8e0; font-family: 'SF Mono', monospace; }
.transfer-amount { font-size: 12px; font-weight: 700; color: #F5A623; font-family: 'SF Mono', monospace; }
.transfer-note { font-size: 10px; color: var(--muted); }
.transfer-actions { display: flex; gap: 4px; }
.btn-sm { padding: 2px 8px !important; font-size: 10px !important; }
.ledger-row { display: flex; align-items: center; gap: 6px; padding: 4px 0; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 11px; }
.ledger-dir { font-size: 12px; width: 12px; text-align: center; }
.ledger-dir.in { color: #00E5A0; }
.ledger-dir.out { color: #FF4D4D; }
.ledger-desc { flex: 1; color: #c8c8c0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.ledger-amount { font-family: 'SF Mono', monospace; font-weight: 600; white-space: nowrap; }
.ledger-amount.in { color: #00E5A0; }
.ledger-amount.out { color: #FF4D4D; }
.ledger-time { color: var(--muted); font-size: 10px; font-family: 'SF Mono', monospace; white-space: nowrap; }

/* ── 充值弹窗 ── */
.dialog-mask { position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000; display: flex; align-items: center; justify-content: center; }
.dialog-box { background: #1a1a1e; border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 24px; width: 300px; display: flex; flex-direction: column; gap: 12px; }
.dialog-title { font-size: 13px; font-weight: 700; color: #e8e8e0; letter-spacing: 0.05em; }
.dialog-desc { font-size: 11px; color: var(--muted); }
.dialog-input { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px 10px; color: #e8e8e0; font-size: 13px; outline: none; }
.dialog-input:focus { border-color: rgba(245,166,35,0.4); }
.dialog-actions { display: flex; gap: 8px; justify-content: flex-end; }
.btn-gold { padding: 5px 14px; background: rgba(245,166,35,0.15); border: 1px solid rgba(245,166,35,0.4); border-radius: 5px; color: #F5A623; font-size: 12px; cursor: pointer; }
.btn-gold:hover { background: rgba(245,166,35,0.25); }
.btn-ghost { padding: 5px 14px; background: transparent; border: 1px solid rgba(255,255,255,0.15); border-radius: 5px; color: #888; font-size: 12px; cursor: pointer; }
.btn-ghost:hover { border-color: rgba(255,255,255,0.3); color: #aaa; }

/* 宽弹窗 */
.dialog-box-wide { width: 420px; }

/* 两列布局 */
.dialog-row-2col { display: flex; gap: 8px; }
.dialog-row-2col .dialog-input,
.dialog-row-2col .dialog-select { flex: 1; min-width: 0; }

/* 下拉选择 */
.dialog-select { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px 10px; color: #e8e8e0; font-size: 13px; outline: none; cursor: pointer; }
.dialog-select:focus { border-color: rgba(245,166,35,0.4); }
.dialog-select option { background: #1a1a1e; }

/* 字段标签输入组 */
.dialog-label-input { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }
.dialog-field-label { font-size: 10px; color: var(--muted); }

/* 计算预览 */
.dialog-calc-hint { font-size: 11px; color: #00D4FF; background: rgba(0,212,255,0.05); border: 1px solid rgba(0,212,255,0.15); border-radius: 5px; padding: 6px 10px; }

/* 文本域 */
.dialog-textarea { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 6px; padding: 8px 10px; color: #e8e8e0; font-size: 12px; outline: none; resize: vertical; font-family: inherit; line-height: 1.5; }
.dialog-textarea:focus { border-color: rgba(245,166,35,0.4); }

/* 任务执行中 */
.dialog-running { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #00D4FF; padding: 6px 0; }

/* 任务结果框 */
.task-result-box { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); border-radius: 6px; padding: 10px; font-size: 11px; color: #c8c8c0; white-space: pre-wrap; word-break: break-all; max-height: 200px; overflow-y: auto; line-height: 1.6; }

/* 图书馆列表 */
.library-list { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; }
.library-item { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 6px; padding: 10px; }
.library-item-title { font-size: 12px; font-weight: 600; color: #e8e8e0; margin-bottom: 3px; }
.library-item-meta { font-size: 10px; color: var(--muted); margin-bottom: 4px; display: flex; gap: 6px; flex-wrap: wrap; }
.library-item-content { font-size: 11px; color: #888; line-height: 1.5; }

/* 日记历史 */
.reflection-item { background: rgba(255,255,255,0.03); border-left: 2px solid rgba(0,212,255,0.3); padding: 8px 10px; margin-bottom: 6px; border-radius: 0 6px 6px 0; }
.reflection-time { font-size: 10px; color: var(--muted); margin-bottom: 4px; }
.reflection-content { font-size: 11px; color: #aaa; line-height: 1.5; white-space: pre-wrap; }

/* btn active state */
.btn-ghost.active { border-color: rgba(245,166,35,0.5); color: #F5A623; background: rgba(245,166,35,0.08); }

/* ═══════════════════════════════════════
   右侧对话面板
═══════════════════════════════════════ */
.city-chat {
  flex-shrink: 0;
  width: 300px;
  display: flex;
  flex-direction: column;
  background: var(--card-bg);
  border: 1px solid var(--border);
  border-radius: 8px;
  margin-left: 12px;
  overflow: hidden;
  transition: width 0.2s ease;
  font-family: 'SF Mono', 'Fira Code', monospace;
}
.city-chat.collapsed {
  width: 40px;
}

.city-chat-toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 12px;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  color: #F5A623;
  cursor: pointer;
  font-size: 11px;
  font-family: inherit;
  white-space: nowrap;
  width: 100%;
  flex-shrink: 0;
  transition: background 0.15s;
}
.city-chat-toggle:hover { background: rgba(245,166,35,0.05); }
.chat-toggle-label { font-weight: 700; letter-spacing: 0.1em; }
.chat-unread-dot {
  width: 5px; height: 5px; border-radius: 50%;
  background: transparent; margin-left: auto; flex-shrink: 0;
}
.chat-unread-dot.visible { background: #00E5A0; box-shadow: 0 0 4px #00E5A0; animation: pulse-dot 2s infinite; }

.city-chat-head {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 12px; border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.cch-icon { font-size: 10px; color: #00D4FF; }
.cch-title { font-size: 9px; font-weight: 700; color: var(--dim); letter-spacing: 0.12em; }
.cch-status {
  margin-left: auto; font-size: 8px; font-weight: 700; letter-spacing: 0.1em;
  padding: 2px 6px; border-radius: 3px; background: var(--faint); color: var(--dim);
}
.cch-status.online { color: #00E5A0; background: rgba(0,229,160,0.06); }

.city-chat-messages {
  flex: 1; overflow-y: auto; padding: 10px 12px;
  scrollbar-width: thin; scrollbar-color: var(--border) transparent;
  min-height: 0;
}
.city-chat-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  color: var(--dim); opacity: 0.5;
}
.city-chat-empty p { font-size: 11px; margin: 0; text-align: center; }

.cc-msg { display: flex; gap: 7px; padding: 5px 0; }
.cc-msg + .cc-msg { border-top: 1px solid var(--border); }
.cc-avatar {
  width: 18px; height: 18px; border-radius: 3px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  font-size: 8px; font-weight: 800; overflow: hidden;
}
.cc-avatar.user      { background: var(--faint); color: var(--mid); border: 1px solid var(--border); }
.cc-avatar.assistant { background: rgba(245,166,35,0.1); border: 1px solid rgba(245,166,35,0.2); }
.cc-avatar-img { width: 100%; height: 100%; object-fit: contain; display: block; }
.cc-body { flex: 1; min-width: 0; }
.cc-meta { display: flex; align-items: center; gap: 5px; margin-bottom: 3px; }
.cc-sender { font-size: 9px; font-weight: 700; letter-spacing: 0.05em; }
.cc-msg.user      .cc-sender { color: var(--mid); }
.cc-msg.assistant .cc-sender { color: #F5A623; }
.cc-time { font-size: 8px; color: var(--dim); opacity: 0.5; }
.cc-content {
  font-size: 12px; line-height: 1.6; color: var(--dark);
  font-family: 'Inter', 'PingFang SC', sans-serif; word-break: break-word;
}
.cc-msg.user .cc-content { color: var(--mid); }
.cc-content :deep(p) { margin: 0 0 4px; }
.cc-content :deep(p:last-child) { margin-bottom: 0; }
.cc-content :deep(code) { font-family: 'SF Mono', monospace; font-size: 10px; background: var(--faint); padding: 1px 3px; border-radius: 2px; color: #F5A623; }
.cc-content :deep(strong) { color: var(--dark); }
.cc-content :deep(ul), .cc-content :deep(ol) { margin: 3px 0; padding-left: 16px; }
.cc-content :deep(li) { margin: 1px 0; }

.cc-tools { display: flex; flex-direction: column; gap: 3px; margin-top: 5px; }
.cc-tool-card {
  display: flex; align-items: center; gap: 5px;
  background: var(--faint); border: 1px solid var(--border); border-radius: 3px; padding: 4px 7px;
}
.cc-tool-dot { width: 4px; height: 4px; border-radius: 50%; flex-shrink: 0; }
.cc-tool-card.running .cc-tool-dot  { background: #00D4FF; animation: indicatorPulse 1s infinite; }
.cc-tool-card.success .cc-tool-dot  { background: #00E5A0; }
.cc-tool-card.error   .cc-tool-dot  { background: #FF4D4D; }
.cc-tool-name   { font-size: 9px; color: var(--mid); flex: 1; }
.cc-tool-status { font-size: 8px; font-weight: 700; letter-spacing: 0.06em; }
.cc-tool-card.running .cc-tool-status { color: #00D4FF; }
.cc-tool-card.success .cc-tool-status { color: #00E5A0; }
.cc-tool-card.error   .cc-tool-status { color: #FF4D4D; }

.cc-typing { display: flex; gap: 3px; padding: 4px 0; }
.cc-typing span { width: 4px; height: 4px; border-radius: 50%; background: #F5A623; animation: typing 1.2s ease-in-out infinite; }
.cc-typing span:nth-child(2) { animation-delay: 0.2s; }
.cc-typing span:nth-child(3) { animation-delay: 0.4s; }

.city-chat-input {
  border-top: 1px solid var(--border);
  padding: 8px 10px 10px;
  flex-shrink: 0;
}
.cci-row {
  display: flex; align-items: flex-end; gap: 6px;
  background: var(--gray); border: 1px solid var(--border); border-radius: 6px;
  padding: 5px 7px;
}
.cci-textarea {
  flex: 1; background: transparent; border: none; outline: none; resize: none;
  color: var(--dark); font-size: 12px; line-height: 1.5;
  font-family: 'Inter', 'PingFang SC', sans-serif;
  min-height: 22px; max-height: 100px;
}
.cci-textarea::placeholder { color: var(--dim); font-size: 11px; }
.cci-send {
  flex-shrink: 0; width: 28px; height: 28px; border-radius: 5px;
  background: #F5A623; border: none; color: #0A0805;
  cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: background 0.15s;
}
.cci-send:hover:not(:disabled) { background: #FFB84D; }
.cci-send:disabled { opacity: 0.3; cursor: not-allowed; }

@media (max-width: 768px) {
  .city-chat { display: none; }
}

/* ═══════════════════════════════════════════════════
   Flipbook 风格建筑增强
   ═══════════════════════════════════════════════════ */

/* 建筑锁定遮罩 */
.bldg-locked-overlay {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 20px;
  z-index: 20;
  pointer-events: none;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5));
}

/* ── 窗口颜色 per 建筑类型 ── */
.win-bureau          { background: rgba(245,166,35,0.75) !important; }
.win-finance_gateway { background: rgba(240,204,112,0.85) !important; animation: winBlink 3s ease-in-out infinite; }
.win-reactor         { background: rgba(245,166,35,0.9) !important; animation: winBlink 1.5s ease-in-out infinite; }
.win-intel_station   { background: rgba(0,212,255,0.75) !important; animation: winBlink 2.8s ease-in-out infinite; }
.win-research_institute { background: rgba(0,229,160,0.65) !important; }
.win-data_center     { background: rgba(0,212,255,0.6) !important; animation: winBlink 2s ease-in-out infinite; }
.win-risk_lab        { background: rgba(255,77,77,0.5) !important; }
.win-marketing_consultancy { background: rgba(74,140,255,0.65) !important; }
.win-ad_company      { background: rgba(233,30,140,0.5) !important; animation: winBlink 0.8s ease-in-out infinite; }
.win-arbitration_hall { background: rgba(240,192,64,0.6) !important; }
.win-adam_academy    { background: rgba(139,92,246,0.65) !important; }
.win-archive         { background: rgba(192,57,43,0.7) !important; }
.win-corner          { background: rgba(245,180,64,0.8) !important; }
.win-library         { background: rgba(192,57,43,0.7) !important; }

@keyframes winBlink {
  0%, 90%, 100% { opacity: 1; }
  95% { opacity: 0.4; }
}

/* ── 整体建筑发光 per 类型 ── */
.bldg-type-bureau.iso-bldg {
  filter: drop-shadow(0 0 10px rgba(245,166,35,0.35)) drop-shadow(2px 4px 6px rgba(80,60,20,0.3));
}
.bldg-type-finance_gateway.iso-bldg {
  filter: drop-shadow(0 0 8px rgba(212,168,64,0.3)) drop-shadow(2px 4px 5px rgba(60,50,20,0.25));
}
.bldg-type-reactor.iso-bldg {
  filter: drop-shadow(0 0 14px rgba(245,166,35,0.5)) drop-shadow(0 0 6px rgba(255,200,0,0.4));
  animation: reactorPulse 2s ease-in-out infinite;
}
.bldg-type-intel_station.iso-bldg {
  filter: drop-shadow(0 0 10px rgba(0,212,255,0.4)) drop-shadow(2px 4px 5px rgba(0,40,60,0.3));
}
.bldg-type-research_institute.iso-bldg {
  filter: drop-shadow(0 0 8px rgba(0,229,160,0.3)) drop-shadow(2px 4px 5px rgba(0,30,40,0.25));
}
.bldg-type-data_center.iso-bldg {
  filter: drop-shadow(0 0 8px rgba(0,212,255,0.3));
}
.bldg-type-risk_lab.iso-bldg {
  filter: drop-shadow(0 0 10px rgba(255,77,77,0.35));
}
.bldg-type-ad_company.iso-bldg {
  filter: drop-shadow(0 0 12px rgba(233,30,140,0.45));
  animation: neonFlicker 3s linear infinite;
}
.bldg-type-reactor.iso-bldg .roof {
  animation: reactorRoofGlow 2s ease-in-out infinite;
}
.bldg-type-corner.iso-bldg {
  filter: drop-shadow(0 0 8px rgba(245,180,64,0.35)) drop-shadow(2px 4px 6px rgba(40,20,0,0.3));
}
.bldg-type-adam_academy.iso-bldg {
  filter: drop-shadow(0 0 12px rgba(139,92,246,0.4));
}

@keyframes reactorPulse {
  0%, 100% { filter: drop-shadow(0 0 14px rgba(245,166,35,0.5)) drop-shadow(0 0 6px rgba(255,200,0,0.4)); }
  50% { filter: drop-shadow(0 0 22px rgba(245,166,35,0.75)) drop-shadow(0 0 12px rgba(255,200,0,0.6)); }
}
@keyframes reactorRoofGlow {
  0%, 100% { background: #FFE0CC; }
  50% { background: #FFB870; }
}
@keyframes neonFlicker {
  0%, 96%, 100% { opacity: 1; }
  97% { opacity: 0.7; }
  98% { opacity: 1; }
  99% { opacity: 0.5; }
}

/* ── 屋顶装饰 ── */
.bldg-roof-dome {
  position: absolute;
  width: 16px;
  height: 10px;
  background: radial-gradient(ellipse, #FFD700 0%, #C8A030 60%, #A07820 100%);
  border-radius: 50% 50% 0 0;
  top: 2px;
  left: 50%;
  transform: translateX(-50%);
  box-shadow: 0 0 6px rgba(245,166,35,0.6);
}
.bldg-roof-antenna {
  position: absolute;
  width: 2px;
  height: 20px;
  background: linear-gradient(to top, #4A8AB8, #00D4FF);
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
}
.bldg-roof-antenna::after {
  content: '';
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 5px;
  height: 5px;
  background: #00D4FF;
  border-radius: 50%;
  box-shadow: 0 0 6px rgba(0,212,255,0.8);
  animation: antennaBlink 1.2s ease-in-out infinite;
}
@keyframes antennaBlink {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px rgba(0,212,255,0.8); }
  50% { opacity: 0.3; box-shadow: 0 0 2px rgba(0,212,255,0.3); }
}
.bldg-roof-core {
  position: absolute;
  width: 14px;
  height: 14px;
  background: radial-gradient(circle, #FFD700 0%, #F5A623 50%, transparent 100%);
  border-radius: 50%;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 0 12px rgba(245,166,35,0.9), 0 0 24px rgba(245,166,35,0.4);
  animation: coreGlow 1.5s ease-in-out infinite;
}
@keyframes coreGlow {
  0%, 100% { box-shadow: 0 0 12px rgba(245,166,35,0.9), 0 0 24px rgba(245,166,35,0.4); transform: translate(-50%,-50%) scale(1); }
  50% { box-shadow: 0 0 20px rgba(245,166,35,1), 0 0 40px rgba(245,166,35,0.6); transform: translate(-50%,-50%) scale(1.15); }
}
.bldg-roof-observatory {
  position: absolute;
  width: 18px;
  height: 9px;
  background: linear-gradient(to top, #4DB6C8, #80DEEA);
  border-radius: 50% 50% 0 0;
  top: 0px;
  left: 50%;
  transform: translateX(-50%);
  overflow: hidden;
}
.bldg-roof-observatory::after {
  content: '';
  position: absolute;
  width: 3px;
  height: 12px;
  background: #E0F7FA;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  opacity: 0.7;
}
.bldg-roof-chimney {
  position: absolute;
  width: 8px;
  height: 16px;
  background: linear-gradient(to top, #4A2E14, #3A2010);
  top: -14px;
  right: 8px;
  border-radius: 2px 2px 0 0;
}
.bldg-roof-chimney::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 3px;
  background: #2A1808;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 2px;
}

/* ── 门廊柱子（投资局） ── */
.bldg-door-pillars {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 28px;
  height: 60%;
  display: flex;
  justify-content: space-between;
}
.bldg-door-pillars::before,
.bldg-door-pillars::after {
  content: '';
  width: 4px;
  height: 100%;
  background: linear-gradient(to right, rgba(255,220,140,0.9), rgba(200,160,80,0.7));
  border-radius: 2px;
}


/* ── 插画树（圆冠+描边） ── */
.tree-top {
  width: 24px;
  height: 24px;
  background: radial-gradient(circle at 36% 30%, #bdc8a0 0%, #9dab7e 55%, #87966c 100%);
  border: 1.5px solid #4f4839;
  border-radius: 50% 50% 46% 46%;
  box-shadow: 2px 3px 0 rgba(79, 72, 57, 0.18);
}
.deco-tree.md .tree-top {
  width: 32px;
  height: 32px;
  background: radial-gradient(circle at 36% 30%, #c6d0ab 0%, #a8b58a 55%, #919f74 100%);
}
.tree-trunk {
  border-radius: 1px;
  background: #9a7450;
  border: 1.5px solid #4f4839;
  border-top: none;
}

/* ── 详情面板：进入大厅 ── */
.detail-enter-hall {
  display: block;
  width: calc(100% - 24px);
  margin: 10px 12px 2px;
  padding: 9px 0;
  background: #f0c040;
  color: #1c1812;
  border: 2px solid #1c1812;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 3px 3px 0 rgba(0,0,0,0.5);
}
.detail-enter-hall:hover { background: #ffe070; }
.detail-enter-hall:active { transform: translate(2px, 2px); box-shadow: none; }

/* ── 进入大厅像素百叶转场 ── */
.hall-enter-overlay {
  position: absolute;
  inset: 0;
  z-index: 90;
  display: flex;
  flex-direction: column;
  pointer-events: all;
}
.heo-strip {
  flex: 1;
  background: #4f4839;
  transform: scaleX(0);
  transform-origin: left center;
  animation: heoStrip 0.4s steps(5) forwards;
}
@keyframes heoStrip {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
.heo-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: #f6f0dc;
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 14px;
  letter-spacing: 4px;
  opacity: 0;
  animation: heoText 0.2s steps(1) 0.3s forwards;
}
@keyframes heoText { to { opacity: 1; } }</style>
