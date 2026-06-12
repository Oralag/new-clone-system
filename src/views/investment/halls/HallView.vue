<template>
  <div class="hall-page" :style="cssVars">
    <!-- 进场像素百叶转场 -->
    <div v-if="entering" class="hall-enter-fx">
      <div v-for="i in 12" :key="i" class="fx-strip" :style="{ animationDelay: (i % 4) * 0.06 + 's' }"></div>
    </div>

    <!-- ── 顶部 HUD ── -->
    <header class="hall-hud">
      <button class="hud-back" @click="goBack">◀ 返回园区</button>
      <div class="hud-title-wrap">
        <span class="hud-name">{{ hall.name }}</span>
        <span class="hud-sub">{{ hall.subtitle }}</span>
      </div>
      <div class="hud-right">
        <span v-if="building" class="hud-chip">LV.{{ (building.upgradeHistory?.length || 0) + 1 }}</span>
        <span class="hud-chip status" :class="institution?.status">{{ statusLabel(institution?.status) }}</span>
        <span v-if="adamInHall" class="hud-chip adam">⟐ 亚当在馆内</span>
      </div>
    </header>

    <div class="hall-body">
      <!-- ── 像素大厅场景 ── -->
      <div class="hall-scene">
        <!-- 墙面 -->
        <div class="hall-wall">
          <div class="wall-trim"></div>
          <!-- 高窗 -->
          <div v-for="i in 3" :key="'hw' + i" class="wall-window" :style="{ left: 15 + (i - 1) * 30 + '%' }">
            <span class="ww-pane"></span><span class="ww-pane"></span>
            <span class="ww-pane"></span><span class="ww-pane"></span>
          </div>
        </div>
        <!-- 地面 -->
        <div class="hall-floor"></div>

        <!-- 陈设 -->
        <div
          v-for="(p, idx) in hall.props"
          :key="'prop' + idx"
          class="hall-prop"
          :class="[{ interactive: !!p.panel, active: !!p.panel && activePanel === p.panel }, layerOf(p)]"
          :style="{ left: p.x + '%' }"
          @click="p.panel && openPanel(p.panel)"
        >
          <!-- 柜台 -->
          <svg v-if="p.type === 'counter'" viewBox="0 0 40 22" width="160" height="88" shape-rendering="crispEdges">
            <rect x="0" y="6" width="40" height="3" :fill="hall.wallTrim" />
            <rect x="1" y="9" width="38" height="11" :fill="hall.accent" opacity="0.35" />
            <rect x="1" y="9" width="38" height="11" fill="#3a3228" opacity="0.6" />
            <rect x="3" y="11" width="10" height="7" fill="#000" opacity="0.25" />
            <rect x="15" y="11" width="10" height="7" fill="#000" opacity="0.25" />
            <rect x="27" y="11" width="10" height="7" fill="#000" opacity="0.25" />
            <rect x="0" y="20" width="40" height="2" fill="#14100a" />
            <rect x="32" y="3" width="4" height="3" fill="#f0c040" />
            <rect x="33" y="2" width="2" height="1" fill="#fff3c0" />
          </svg>
          <!-- 办公桌 -->
          <svg v-else-if="p.type === 'desk'" viewBox="0 0 30 20" width="120" height="80" shape-rendering="crispEdges">
            <rect x="8" y="2" width="12" height="8" fill="#10161e" />
            <rect x="9" y="3" width="10" height="6" :fill="hall.glow" opacity="0.85" class="px-flicker" />
            <rect x="13" y="10" width="2" height="2" fill="#10161e" />
            <rect x="0" y="12" width="30" height="3" :fill="hall.wallTrim" />
            <rect x="2" y="15" width="3" height="5" fill="#241c10" />
            <rect x="25" y="15" width="3" height="5" fill="#241c10" />
            <rect x="22" y="9" width="5" height="3" fill="#3a4a3a" />
          </svg>
          <!-- 大屏 -->
          <svg v-else-if="p.type === 'screen'" viewBox="0 0 44 28" width="198" height="126" shape-rendering="crispEdges">
            <rect x="0" y="0" width="44" height="26" fill="#0a0e14" />
            <rect x="1" y="1" width="42" height="24" fill="#0e1822" />
            <rect x="3" y="3" width="24" height="2" :fill="hall.glow" class="px-flicker" />
            <rect x="3" y="7" width="38" height="1" :fill="hall.accent" opacity="0.7" />
            <rect x="3" y="10" width="16" height="1" :fill="hall.glow" opacity="0.5" />
            <rect x="21" y="10" width="10" height="1" fill="#e05050" opacity="0.8" />
            <rect x="3" y="13" width="28" height="1" :fill="hall.glow" opacity="0.5" />
            <rect class="scan-line" x="1" y="1" width="42" height="2" fill="#ffffff" opacity="0.08" />
            <g v-for="c in 8" :key="'bar' + c">
              <rect :x="4 + (c - 1) * 5" :y="23 - barH(c)" width="3" :height="barH(c)" :fill="c % 3 === 0 ? '#e05050' : hall.accent" :opacity="0.85" />
            </g>
            <rect x="20" y="26" width="4" height="2" fill="#0a0e14" />
          </svg>
          <!-- 书架 -->
          <svg v-else-if="p.type === 'shelf'" viewBox="0 0 30 36" width="120" height="144" shape-rendering="crispEdges">
            <rect x="0" y="0" width="30" height="36" fill="#241808" />
            <rect x="1" y="1" width="28" height="34" fill="#3a2812" />
            <g v-for="row in 3" :key="'sr' + row">
              <rect x="2" :y="row * 10 + 1" width="26" height="1" fill="#241808" />
              <g v-for="b in 8" :key="'bk' + row + b">
                <rect :x="2 + (b - 1) * 3.2" :y="row * 10 - 7" width="2.4" height="8" :fill="bookColor(row, b)" />
              </g>
            </g>
          </svg>
          <!-- 档案柜 -->
          <svg v-else-if="p.type === 'cabinet'" viewBox="0 0 26 32" width="104" height="128" shape-rendering="crispEdges">
            <rect x="0" y="0" width="26" height="32" fill="#1c1610" />
            <rect x="1" y="1" width="24" height="30" fill="#4a3a26" />
            <g v-for="d in 4" :key="'dr' + d">
              <rect x="3" :y="(d - 1) * 7 + 3" width="20" height="5" fill="#5e4a30" />
              <rect x="10" :y="(d - 1) * 7 + 5" width="6" height="1" fill="#1c1610" />
              <rect x="4" :y="(d - 1) * 7 + 4" width="4" height="2" fill="#d8c8a0" opacity="0.7" />
            </g>
          </svg>
          <!-- 金库门 -->
          <svg v-else-if="p.type === 'vault'" viewBox="0 0 34 36" width="136" height="144" shape-rendering="crispEdges">
            <rect x="0" y="0" width="34" height="36" fill="#1a1e26" />
            <rect x="2" y="2" width="30" height="32" fill="#39414e" />
            <rect x="8" y="6" width="18" height="4" fill="#4c5666" />
            <rect x="6" y="10" width="22" height="16" fill="#4c5666" />
            <rect x="8" y="12" width="18" height="12" fill="#2c323e" />
            <rect x="14" y="15" width="6" height="6" fill="#f0c040" />
            <rect x="16" y="13" width="2" height="10" fill="#39414e" />
            <rect x="12" y="17" width="10" height="2" fill="#39414e" />
            <rect x="8" y="28" width="18" height="3" fill="#4c5666" />
            <rect class="px-flicker" x="27" y="4" width="2" height="2" fill="#50e070" />
          </svg>
          <!-- 盆栽 -->
          <svg v-else-if="p.type === 'plant'" viewBox="0 0 12 18" width="48" height="72" shape-rendering="crispEdges">
            <rect x="3" y="13" width="6" height="5" fill="#8a4a2a" />
            <rect x="4" y="12" width="4" height="1" fill="#6a3a20" />
            <rect x="4" y="4" width="4" height="8" fill="#3e7a3e" />
            <rect x="2" y="6" width="3" height="5" fill="#4e9a4e" />
            <rect x="7" y="5" width="3" height="6" fill="#356a35" />
            <rect x="5" y="2" width="2" height="3" fill="#4e9a4e" />
          </svg>
          <!-- 沙发 -->
          <svg v-else-if="p.type === 'sofa'" viewBox="0 0 28 16" width="112" height="64" shape-rendering="crispEdges">
            <rect x="0" y="2" width="4" height="12" :fill="hall.accent" opacity="0.7" />
            <rect x="24" y="2" width="4" height="12" :fill="hall.accent" opacity="0.7" />
            <rect x="2" y="0" width="24" height="6" :fill="hall.accent" opacity="0.55" />
            <rect x="4" y="6" width="20" height="6" :fill="hall.accent" opacity="0.85" />
            <rect x="2" y="12" width="24" height="3" fill="#1c1812" />
          </svg>
          <!-- 公告板 -->
          <svg v-else-if="p.type === 'board'" viewBox="0 0 26 20" width="104" height="80" shape-rendering="crispEdges">
            <rect x="0" y="0" width="26" height="20" fill="#3a2a14" />
            <rect x="1" y="1" width="24" height="18" fill="#d8c89c" />
            <rect x="3" y="3" width="8" height="6" fill="#f0f0e0" />
            <rect x="13" y="4" width="9" height="5" fill="#e8e0c8" />
            <rect x="4" y="11" width="10" height="6" fill="#f0e8d0" />
            <rect x="4" y="4" width="6" height="1" fill="#888" />
            <rect x="14" y="5" width="7" height="1" fill="#a66" />
            <rect x="5" y="13" width="8" height="1" fill="#888" />
            <rect x="6" y="2" width="2" height="2" fill="#e04040" />
            <rect x="16" y="3" width="2" height="2" fill="#4060e0" />
          </svg>
          <!-- 地球仪 -->
          <svg v-else-if="p.type === 'globe'" viewBox="0 0 14 22" width="56" height="88" shape-rendering="crispEdges">
            <rect x="4" y="2" width="6" height="2" fill="#3878c0" />
            <rect x="3" y="4" width="8" height="6" fill="#3878c0" />
            <rect x="4" y="4" width="3" height="3" fill="#4ea050" />
            <rect x="8" y="7" width="2" height="2" fill="#4ea050" />
            <rect x="4" y="10" width="6" height="2" fill="#3878c0" />
            <rect x="6" y="12" width="2" height="6" fill="#5a4a30" />
            <rect x="3" y="18" width="8" height="3" fill="#5a4a30" />
          </svg>
          <!-- 落地灯 -->
          <svg v-else-if="p.type === 'lamp'" viewBox="0 0 10 28" width="40" height="112" shape-rendering="crispEdges">
            <rect x="2" y="0" width="6" height="5" :fill="hall.glow" class="px-flicker" />
            <rect x="3" y="5" width="4" height="1" fill="#2a2a2a" />
            <rect x="4" y="6" width="2" height="18" fill="#2a2a2a" />
            <rect x="2" y="24" width="6" height="3" fill="#2a2a2a" />
          </svg>
          <!-- 挂钟 -->
          <svg v-else-if="p.type === 'clock'" viewBox="0 0 12 12" width="48" height="48" shape-rendering="crispEdges">
            <rect x="0" y="0" width="12" height="12" fill="#3a2c18" />
            <rect x="1" y="1" width="10" height="10" fill="#f0ead0" />
            <rect x="5" y="3" width="2" height="4" fill="#2a2018" />
            <rect x="6" y="6" width="3" height="1" fill="#2a2018" />
          </svg>
          <!-- 横幅 -->
          <svg v-else-if="p.type === 'banner'" viewBox="0 0 48 12" width="192" height="48" shape-rendering="crispEdges">
            <rect x="0" y="0" width="48" height="9" :fill="hall.accent" opacity="0.9" />
            <rect x="0" y="9" width="6" height="3" :fill="hall.accent" opacity="0.7" />
            <rect x="42" y="9" width="6" height="3" :fill="hall.accent" opacity="0.7" />
            <rect x="6" y="3" width="36" height="3" fill="#1c1812" opacity="0.7" />
          </svg>
          <!-- 柜台标签 -->
          <div v-if="p.panel" class="prop-label">{{ p.label }}<span class="prop-arrow">▾</span></div>
        </div>

        <!-- NPC 职员 -->
        <div v-for="(npc, ni) in hall.npcs" :key="'npc' + ni" class="hall-npc" :style="{ left: npc.x + '%' }">
          <div v-if="npcLineVisible" class="npc-bubble">{{ currentLine(npc, ni) }}</div>
          <svg viewBox="0 0 16 26" width="48" height="78" shape-rendering="crispEdges" class="npc-svg">
            <rect x="4" y="0" width="8" height="3" :fill="npc.coat" />
            <rect x="4" y="3" width="8" height="6" fill="#e8c8a0" />
            <rect x="5" y="5" width="2" height="2" fill="#2a2a2a" class="npc-eye" />
            <rect x="9" y="5" width="2" height="2" fill="#2a2a2a" class="npc-eye" />
            <rect x="3" y="9" width="10" height="9" :fill="npc.coat" />
            <rect x="1" y="10" width="2" height="6" :fill="npc.coat" />
            <rect x="13" y="10" width="2" height="6" :fill="npc.coat" />
            <rect x="6" y="11" width="4" height="2" fill="#fff" opacity="0.25" />
            <rect x="4" y="18" width="3" height="6" fill="#2a3038" />
            <rect x="9" y="18" width="3" height="6" fill="#2a3038" />
            <rect x="3" y="24" width="4" height="2" fill="#14100c" />
            <rect x="9" y="24" width="4" height="2" fill="#14100c" />
          </svg>
          <div class="npc-name">{{ npc.name }}</div>
        </div>

        <!-- 亚当（如果在本馆） -->
        <div v-if="adamInHall" class="hall-adam">
          <div class="npc-bubble adam-bubble">{{ adamStore.adamPosition.activity || '我在这里办点事…' }}</div>
          <svg viewBox="0 0 16 28" width="56" height="98" shape-rendering="crispEdges" class="npc-svg">
            <rect x="4" y="0" width="8" height="2" fill="#c8a030" />
            <rect x="3" y="2" width="10" height="1" fill="#c8a030" />
            <rect x="4" y="3" width="8" height="7" fill="#d8dde2" />
            <rect x="5" y="5" width="2" height="2" fill="#40c0d0" class="npc-eye" />
            <rect x="9" y="5" width="2" height="2" fill="#40c0d0" class="npc-eye" />
            <rect x="6" y="8" width="4" height="1" fill="#8e99a4" />
            <rect x="3" y="10" width="10" height="10" fill="#c8a030" />
            <rect x="1" y="11" width="2" height="7" fill="#c8a030" />
            <rect x="13" y="11" width="2" height="7" fill="#c8a030" />
            <rect x="6" y="12" width="4" height="2" fill="#fff" opacity="0.25" />
            <rect x="4" y="20" width="3" height="6" fill="#3a4048" />
            <rect x="9" y="20" width="3" height="6" fill="#3a4048" />
            <rect x="3" y="26" width="4" height="2" fill="#14100c" />
            <rect x="9" y="26" width="4" height="2" fill="#14100c" />
          </svg>
          <div class="npc-name adam-name">ADAM</div>
        </div>
      </div>

      <!-- ── 右侧业务面板 ── -->
      <aside class="hall-panel">
        <div class="panel-tabs">
          <button
            v-for="(title, key) in hall.panels"
            :key="key"
            class="panel-tab"
            :class="{ on: activePanel === key }"
            @click="openPanel(key as string)"
          >{{ title }}</button>
        </div>

        <div class="panel-body">
          <!-- ════ 投资局：资金账户 ════ -->
          <template v-if="activePanel === 'fund'">
            <div class="stat-cards">
              <div class="stat-card gold">
                <span class="stat-label">可用余额</span>
                <span class="stat-val">¥{{ fmtMoney(adamStore.core.budget) }}</span>
              </div>
              <div class="stat-card green">
                <span class="stat-label">累计入账</span>
                <span class="stat-val">¥{{ fmtMoney(adamStore.totalEarned) }}</span>
              </div>
              <div class="stat-card red">
                <span class="stat-label">累计支出</span>
                <span class="stat-val">¥{{ fmtMoney(adamStore.totalCost) }}</span>
              </div>
            </div>
            <div class="panel-section-title">充值入账</div>
            <div class="px-form">
              <input v-model="depositAmount" type="number" min="0" class="px-input" placeholder="金额（元）" />
              <input v-model="depositNote" type="text" class="px-input" placeholder="备注（可选）" />
              <button class="px-btn gold" :disabled="!Number(depositAmount)" @click="handleDeposit">确认入账</button>
            </div>
            <div class="panel-section-title">最近流水</div>
            <div v-if="!recentLedger.length" class="px-empty">暂无流水</div>
            <div v-for="e in recentLedger.slice(0, 6)" :key="e.id" class="ledger-line">
              <span class="ll-dir" :class="e.direction">{{ e.direction === 'in' ? '↑' : '↓' }}</span>
              <span class="ll-title">{{ e.title }}</span>
              <span class="ll-amt" :class="e.direction">{{ e.direction === 'in' ? '+' : '-' }}¥{{ fmtMoney(e.amount) }}</span>
            </div>
          </template>

          <!-- ════ 投资局：资金流水 ════ -->
          <template v-else-if="activePanel === 'ledger'">
            <div class="panel-section-title">全部流水 <span class="title-count">{{ adamStore.ledger.length }}</span></div>
            <div v-if="!recentLedger.length" class="px-empty">账本是空的</div>
            <div v-for="e in recentLedger" :key="e.id" class="ledger-line">
              <span class="ll-dir" :class="e.direction">{{ e.direction === 'in' ? '↑' : '↓' }}</span>
              <div class="ll-mid">
                <span class="ll-title">{{ e.title }}</span>
                <span class="ll-meta">{{ kindLabel(e.kind) }} · {{ fmtTime(e.at) }}</span>
              </div>
              <span class="ll-amt" :class="e.direction">{{ e.direction === 'in' ? '+' : '-' }}¥{{ fmtMoney(e.amount) }}</span>
            </div>
          </template>

          <!-- ════ 投资局：记录投资 ════ -->
          <template v-else-if="activePanel === 'invest'">
            <div class="panel-section-title">登记一笔投资</div>
            <div class="px-form">
              <input v-model="investForm.symbol" type="text" class="px-input" placeholder="标的（如 000001 / 黄金）" />
              <div class="px-form-row">
                <select v-model="investForm.direction" class="px-input">
                  <option value="buy">买入</option>
                  <option value="sell">卖出</option>
                </select>
                <input v-model="investForm.amount" type="number" min="0" class="px-input" placeholder="金额（元）" />
              </div>
              <input v-model="investForm.note" type="text" class="px-input" placeholder="备注（可选）" />
              <button class="px-btn gold" :disabled="!investForm.symbol || !Number(investForm.amount)" @click="handleRecordInvestment">登记入册</button>
            </div>
            <div class="panel-section-title">最近投资记录</div>
            <div v-if="!investLedger.length" class="px-empty">还没有投资记录</div>
            <div v-for="e in investLedger.slice(0, 8)" :key="e.id" class="ledger-line">
              <span class="ll-dir" :class="e.direction">{{ e.direction === 'in' ? '卖' : '买' }}</span>
              <span class="ll-title">{{ e.title }}</span>
              <span class="ll-amt" :class="e.direction">¥{{ fmtMoney(e.amount) }}</span>
            </div>
          </template>

          <!-- ════ 金融机构：贷款审批 ════ -->
          <template v-else-if="activePanel === 'loans'">
            <div class="panel-section-title">待审批 <span class="title-count">{{ pendingLoans.length }}</span></div>
            <div v-if="!pendingLoans.length" class="px-empty">当前没有待审批的贷款申请</div>
            <div v-for="loan in pendingLoans" :key="loan.id" class="loan-card">
              <div class="loan-head">
                <span class="loan-amt">¥{{ fmtMoney(Number(loan.metadata?.amount) || 0) }}</span>
                <span class="loan-time">{{ fmtTime(loan.at) }}</span>
              </div>
              <div class="loan-purpose">{{ loan.metadata?.purpose || loan.summary }}</div>
              <div class="loan-actions">
                <button class="px-btn green sm" @click="approveLoan(loan)">批准放款</button>
                <button class="px-btn red sm" @click="rejectLoan(loan)">拒绝</button>
              </div>
            </div>
            <div class="panel-section-title">历史申请</div>
            <div v-if="!historyLoans.length" class="px-empty">暂无历史记录</div>
            <div v-for="loan in historyLoans.slice(0, 8)" :key="loan.id" class="ledger-line">
              <span class="ll-dir" :class="loan.metadata?.loanStatus === 'approved' ? 'in' : 'out'">{{ loan.metadata?.loanStatus === 'approved' ? '✓' : '✗' }}</span>
              <div class="ll-mid">
                <span class="ll-title">¥{{ fmtMoney(Number(loan.metadata?.amount) || 0) }} · {{ loan.metadata?.purpose || '—' }}</span>
                <span class="ll-meta">{{ fmtTime(loan.at) }}</span>
              </div>
            </div>
          </template>

          <!-- ════ 金融机构：金库 ════ -->
          <template v-else-if="activePanel === 'vault'">
            <div class="stat-cards">
              <div class="stat-card gold">
                <span class="stat-label">金库存额</span>
                <span class="stat-val">¥{{ fmtMoney(vaultBalance) }}</span>
              </div>
              <div class="stat-card green">
                <span class="stat-label">贷款净额</span>
                <span class="stat-val">¥{{ fmtMoney(loanBalance) }}</span>
              </div>
            </div>
            <div class="panel-section-title">金库往来</div>
            <div v-if="!vaultLedger.length" class="px-empty">金库还没有往来记录</div>
            <div v-for="e in vaultLedger" :key="e.id" class="ledger-line">
              <span class="ll-dir" :class="e.direction">{{ e.kind === 'vault_deposit' ? '存' : e.kind === 'vault_release' ? '取' : e.kind === 'loan' ? '贷' : '还' }}</span>
              <div class="ll-mid">
                <span class="ll-title">{{ e.title }}</span>
                <span class="ll-meta">{{ fmtTime(e.at) }}</span>
              </div>
              <span class="ll-amt" :class="e.direction">¥{{ fmtMoney(e.amount) }}</span>
            </div>
          </template>

          <!-- ════ 研究院：研究报告 ════ -->
          <template v-else-if="activePanel === 'reports'">
            <div class="panel-section-title">研究报告 <span class="title-count">{{ researchEvents.length }}</span></div>
            <div v-if="!researchEvents.length" class="px-empty">研究院还没有产出报告</div>
            <div v-for="ev in researchEvents" :key="ev.id" class="report-card">
              <div class="report-head">
                <span class="report-dot" :class="ev.stage"></span>
                <span class="report-title">{{ ev.title }}</span>
              </div>
              <div class="report-summary">{{ ev.summary }}</div>
              <div class="report-meta">{{ fmtTime(ev.at) }}</div>
            </div>
          </template>

          <!-- ════ 研究院：投资建议 ════ -->
          <template v-else-if="activePanel === 'recs'">
            <div class="panel-section-title">投资建议 <span class="title-count">{{ recommendations.length }}</span></div>
            <div v-if="!recommendations.length" class="px-empty">还没有发出过投资建议</div>
            <div v-for="rec in recommendations" :key="rec.id" class="report-card">
              <div class="report-head">
                <span class="rec-status" :class="rec.status">{{ recStatusLabel(rec.status) }}</span>
                <span class="report-title">{{ rec.title }}</span>
                <span v-if="rec.confidence != null" class="rec-conf">{{ rec.confidence }}%</span>
              </div>
              <div class="report-summary">{{ rec.thesis }}</div>
              <div v-if="rec.riskNote" class="rec-risk">⚠ {{ rec.riskNote }}</div>
              <div class="report-meta">{{ fmtTime(rec.issuedAt) }}</div>
            </div>
          </template>

          <!-- ════ 情报站：市场信号 ════ -->
          <template v-else-if="activePanel === 'signals'">
            <div class="panel-section-title">市场信号 <span class="title-count">{{ signalEvents.length }}</span></div>
            <div v-if="!signalEvents.length" class="px-empty">监听中…暂未捕获信号</div>
            <div v-for="ev in signalEvents" :key="ev.id" class="report-card">
              <div class="report-head">
                <span class="report-dot" :class="ev.stage"></span>
                <span class="report-title">{{ ev.title }}</span>
              </div>
              <div class="report-summary">{{ ev.summary }}</div>
              <div class="report-meta">{{ fmtTime(ev.at) }}</div>
            </div>
          </template>

          <!-- ════ 情报站：事件流 ════ -->
          <template v-else-if="activePanel === 'feed'">
            <div class="panel-section-title">园区事件流</div>
            <div v-if="!adamStore.recentEvents.length" class="px-empty">园区还很安静</div>
            <div v-for="ev in adamStore.recentEvents" :key="ev.id" class="ledger-line">
              <span class="report-dot" :class="ev.stage"></span>
              <div class="ll-mid">
                <span class="ll-title">{{ ev.title }}</span>
                <span class="ll-meta">{{ fmtTime(ev.at) }}</span>
              </div>
            </div>
          </template>

          <!-- ════ 图书馆：书架 ════ -->
          <template v-else-if="activePanel === 'shelf'">
            <div class="panel-section-title">馆藏 <span class="title-count">{{ shelfBooks.length }}</span></div>
            <div v-if="!shelfBooks.length" class="px-empty">书架空空如也，去投书台投喂一本吧</div>
            <div class="book-grid">
              <div v-for="b in shelfBooks" :key="b.id" class="book-spine" :style="{ background: spineColor(b.id) }" @click="readingBook = b">
                <span class="book-spine-title">{{ b.title }}</span>
              </div>
            </div>
            <template v-if="readingBook">
              <div class="panel-section-title">
                《{{ readingBook.title }}》
                <button class="px-btn red sm float-r" @click="handleRemoveBook(readingBook.id)">下架</button>
              </div>
              <div class="book-reader">
                <div class="book-author">作者：{{ readingBook.author === 'adam' ? '亚当' : readingBook.author === 'user' ? '操作员' : readingBook.author }} · {{ fmtTime(readingBook.createdAt) }}</div>
                <div class="book-content">{{ readingBook.content }}</div>
              </div>
            </template>
          </template>

          <!-- ════ 图书馆：投喂书籍 ════ -->
          <template v-else-if="activePanel === 'donate'">
            <div class="panel-section-title">投喂一本书给亚当</div>
            <div class="px-form">
              <input v-model="bookForm.title" type="text" class="px-input" placeholder="书名" />
              <textarea v-model="bookForm.content" class="px-input px-textarea" rows="6" placeholder="内容（亚当会阅读并吸收）"></textarea>
              <button class="px-btn gold" :disabled="!bookForm.title.trim() || !bookForm.content.trim()" @click="handleDonateBook">放上书架</button>
            </div>
          </template>

          <!-- ════ 档案馆：反思卷宗 ════ -->
          <template v-else-if="activePanel === 'reflections'">
            <div class="panel-section-title">亚当的反思 <span class="title-count">{{ reflections.length }}</span></div>
            <div v-if="!reflections.length" class="px-empty">卷宗柜还是空的</div>
            <div v-for="r in reflections" :key="r.id" class="reflection-card">
              <div class="reflection-date">{{ fmtTime(r.at) }}</div>
              <div class="reflection-text">{{ r.content }}</div>
            </div>
          </template>

          <!-- ════ 档案馆：大事记 ════ -->
          <template v-else-if="activePanel === 'chronicle'">
            <div class="panel-section-title">园区大事记 <span class="title-count">{{ allEvents.length }}</span></div>
            <div v-if="!allEvents.length" class="px-empty">历史尚未开始书写</div>
            <div v-for="ev in allEvents" :key="ev.id" class="ledger-line">
              <span class="report-dot" :class="ev.stage"></span>
              <div class="ll-mid">
                <span class="ll-title">{{ ev.title }}</span>
                <span class="ll-meta">{{ fmtTime(ev.at) }} · {{ ev.summary }}</span>
              </div>
            </div>
          </template>

          <!-- ════ 通用：机构信息 ════ -->
          <template v-else>
            <div class="panel-section-title">机构状态</div>
            <div class="info-rows">
              <div class="info-row"><span>状态</span><b>{{ statusLabel(institution?.status) }}</b></div>
              <div class="info-row"><span>区域</span><b>{{ zoneLabel(institution?.zone) }}</b></div>
              <div class="info-row" v-if="building"><span>建造时间</span><b>{{ fmtTime(building.constructedAt) }}</b></div>
              <div class="info-row" v-if="institution?.recentTrace"><span>最近动态</span><b>{{ institution.recentTrace }}</b></div>
            </div>
            <div class="panel-section-title">可用工具 <span class="title-count">{{ institution?.toolIds.length || 0 }}</span></div>
            <div v-if="!institution?.toolIds.length" class="px-empty">该机构暂未开放工具</div>
            <div class="tool-tags">
              <span v-for="t in institution?.toolIds" :key="t" class="tool-tag">{{ toolNameMap[t] || t }}</span>
            </div>
            <div class="panel-section-title">最近事件</div>
            <div v-if="!hallEvents.length" class="px-empty">暂无活动记录</div>
            <div v-for="ev in hallEvents" :key="ev.id" class="ledger-line">
              <span class="report-dot" :class="ev.stage"></span>
              <div class="ll-mid">
                <span class="ll-title">{{ ev.title }}</span>
                <span class="ll-meta">{{ fmtTime(ev.at) }}</span>
              </div>
            </div>
          </template>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAdamStore } from '@/stores/adam'
import { HALL_CONFIGS, genericHall, type HallNpc, type HallProp } from './hallConfigs'

const route = useRoute()
const router = useRouter()
const adamStore = useAdamStore()

const hallId = computed(() => String(route.params.id || ''))

const institution = computed(() => adamStore.institutions.find(i => i.institutionId === hallId.value) || null)
const building = computed(() => adamStore.buildings.find(b => b.institutionId === hallId.value) || null)

const hall = computed(() => HALL_CONFIGS[hallId.value] || genericHall(hallId.value, institution.value?.name || '未知机构'))

const cssVars = computed(() => ({
  '--h-wall': hall.value.wall,
  '--h-wall-dark': hall.value.wallDark,
  '--h-trim': hall.value.wallTrim,
  '--h-floor-a': hall.value.floorA,
  '--h-floor-b': hall.value.floorB,
  '--h-accent': hall.value.accent,
  '--h-glow': hall.value.glow,
}))

// ── 进场转场 ──
const entering = ref(true)
onMounted(() => { setTimeout(() => { entering.value = false }, 620) })

function goBack() {
  router.push('/investment/city')
}
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') goBack()
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))

// ── 面板切换 ──
const activePanel = ref('')
function resetPanel() {
  activePanel.value = hall.value.defaultPanel || Object.keys(hall.value.panels)[0] || 'info'
  readingBook.value = null
}
onMounted(resetPanel)
// 同一组件在不同大厅间复用：路由参数变了要重置面板和转场
watch(hallId, () => {
  resetPanel()
  entering.value = true
  setTimeout(() => { entering.value = false }, 620)
})
function openPanel(key: string) { activePanel.value = key }

// ── 陈设布局 ──
const WALL_TYPES = new Set(['screen', 'board', 'clock', 'banner'])
function layerOf(p: HallProp) {
  if (p.layer) return p.layer
  return WALL_TYPES.has(p.type) ? 'on-wall' : 'on-floor'
}
function barH(c: number) { return 3 + ((c * 7 + 5) % 9) }
function bookColor(row: number, b: number) {
  const palette = ['#c05050', '#5080c0', '#50a060', '#c09040', '#9060b0', '#c07050', '#608898', '#a05878']
  return palette[(row * 3 + b) % palette.length]
}
function spineColor(id: string) {
  const palette = ['#7a3b3b', '#3b5a7a', '#3b6a48', '#7a623b', '#5d3b7a', '#3b6e7a']
  let h = 0
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 9973
  return palette[h % palette.length]
}

// ── NPC 台词轮播 ──
const npcLineTick = ref(0)
const npcLineVisible = ref(true)
let lineTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  lineTimer = setInterval(() => {
    npcLineVisible.value = false
    setTimeout(() => { npcLineTick.value++; npcLineVisible.value = true }, 400)
  }, 6000)
})
onUnmounted(() => { if (lineTimer) clearInterval(lineTimer) })
function currentLine(npc: HallNpc, ni: number) {
  return npc.lines[(npcLineTick.value + ni) % npc.lines.length]
}

// ── 亚当是否在馆内 ──
const adamInHall = computed(() =>
  adamStore.core.status !== 'shutdown' &&
  !adamStore.adamPosition.isMoving &&
  adamStore.adamPosition.targetInstitutionId === hallId.value,
)

// ── 业务数据 ──
const recentLedger = computed(() => [...adamStore.ledger].sort((a, b) => b.at.localeCompare(a.at)))
const investLedger = computed(() => recentLedger.value.filter(e => e.kind === 'earning' || e.kind === 'cost').filter(e => /买入|卖出/.test(e.title)))

const pendingLoans = computed(() =>
  adamStore.events.filter(e => e.institutionId === 'finance_gateway' && e.metadata?.loanStatus === 'pending_approval'),
)
const historyLoans = computed(() =>
  adamStore.events
    .filter(e => e.institutionId === 'finance_gateway' && (e.metadata?.loanStatus === 'approved' || e.metadata?.loanStatus === 'rejected'))
    .sort((a, b) => b.at.localeCompare(a.at)),
)
const vaultLedger = computed(() =>
  recentLedger.value.filter(e => e.kind === 'vault_deposit' || e.kind === 'vault_release' || e.kind === 'loan' || e.kind === 'repayment'),
)
const vaultBalance = computed(() => {
  let v = 0
  for (const e of adamStore.ledger) {
    if (e.kind === 'vault_deposit') v += e.amount
    if (e.kind === 'vault_release') v -= e.amount
  }
  return Math.max(0, v)
})
const loanBalance = computed(() => {
  let v = 0
  for (const e of adamStore.ledger) {
    if (e.kind === 'loan') v += e.amount
    if (e.kind === 'repayment') v -= e.amount
  }
  return Math.max(0, v)
})

const researchEvents = computed(() =>
  adamStore.events
    .filter(e => e.type === 'research_completed' || e.type === 'research_started' || e.institutionId === 'research_institute')
    .sort((a, b) => b.at.localeCompare(a.at)),
)
const recommendations = computed(() => [...adamStore.recommendations].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)))

const signalEvents = computed(() =>
  adamStore.events
    .filter(e => e.type === 'market_signal_detected' || e.institutionId === 'intel_station')
    .sort((a, b) => b.at.localeCompare(a.at)),
)

const shelfBooks = computed(() => adamStore.books.filter(b => b.type !== 'knowledge'))
const readingBook = ref<(typeof adamStore.books)[number] | null>(null)

const reflections = computed(() => [...adamStore.reflections].sort((a, b) => b.at.localeCompare(a.at)))
const allEvents = computed(() => [...adamStore.events].sort((a, b) => b.at.localeCompare(a.at)))
const hallEvents = computed(() => allEvents.value.filter(e => e.institutionId === hallId.value).slice(0, 10))

// ── 业务操作 ──
const depositAmount = ref('')
const depositNote = ref('')
function handleDeposit() {
  const amount = parseFloat(depositAmount.value)
  if (!amount || amount <= 0) return
  adamStore.addLedgerEntry({
    id: `ledger_${Date.now()}`,
    direction: 'in',
    amount,
    title: depositNote.value || '手动充值',
    kind: 'earning',
    at: new Date().toISOString(),
    linkedEventIds: [],
  })
  depositAmount.value = ''
  depositNote.value = ''
}

const investForm = ref({ symbol: '', direction: 'buy' as 'buy' | 'sell', amount: '', note: '' })
function handleRecordInvestment() {
  const amount = parseFloat(investForm.value.amount)
  if (!investForm.value.symbol.trim() || !amount || amount <= 0) return
  const now = new Date().toISOString()
  const idStr = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const isBuy = investForm.value.direction === 'buy'
  adamStore.addEvent({
    id: `evt_invest_${idStr}`,
    type: 'trade_result_recorded',
    stage: 'act',
    title: `${isBuy ? '买入' : '卖出'} ${investForm.value.symbol} ¥${amount}`,
    summary: investForm.value.note || '操作员在投资局登记',
    at: now,
    institutionId: 'bureau',
  })
  adamStore.addLedgerEntry({
    id: `led_invest_${idStr}`,
    at: now,
    kind: isBuy ? 'cost' : 'earning',
    amount,
    direction: isBuy ? 'out' : 'in',
    title: `${isBuy ? '买入' : '卖出'} ${investForm.value.symbol}${investForm.value.note ? '（' + investForm.value.note + '）' : ''}`,
    linkedEventIds: [`evt_invest_${idStr}`],
  })
  investForm.value = { symbol: '', direction: 'buy', amount: '', note: '' }
}

function approveLoan(event: any) {
  const amount = Number(event.metadata?.amount) || 0
  const now = new Date().toISOString()
  const idStr = `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  adamStore.addLedgerEntry({
    id: `led_loan_${idStr}`,
    at: now,
    kind: 'loan',
    amount,
    direction: 'in',
    title: `贷款到账 ¥${amount}（${event.metadata?.purpose || ''}）`,
    linkedEventIds: [event.id],
  })
  event.metadata.loanStatus = 'approved'
  adamStore.persist()
}
function rejectLoan(event: any) {
  event.metadata.loanStatus = 'rejected'
  adamStore.persist()
}

const bookForm = ref({ title: '', content: '' })
function handleDonateBook() {
  if (!bookForm.value.title.trim() || !bookForm.value.content.trim()) return
  adamStore.addBook({
    id: `book_${Date.now()}`,
    title: bookForm.value.title.trim(),
    content: bookForm.value.content.trim(),
    author: 'user',
    type: 'book',
    createdAt: new Date().toISOString(),
    linkedEventIds: [],
  })
  bookForm.value = { title: '', content: '' }
  activePanel.value = 'shelf'
}
function handleRemoveBook(id: string) {
  adamStore.removeBook(id)
  readingBook.value = null
}

// ── 文案辅助 ──
function fmtMoney(n: number) {
  return (n || 0).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
function fmtTime(iso?: string) {
  if (!iso) return '--'
  try {
    const d = new Date(iso)
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  } catch { return '--' }
}
function statusLabel(status?: string) {
  const map: Record<string, string> = { idle: '待机', active: '运转中', locked: '未解锁', cooldown: '冷却中', disabled: '停用', urgent: '紧急' }
  return map[status || ''] || '未知'
}
function zoneLabel(zone?: string) {
  const map: Record<string, string> = { command_center: '指挥中心', intelligence: '情报研究区', commerce: '商业生态区', adam_domain: '亚当领地' }
  return map[zone || ''] || '—'
}
function kindLabel(kind: string) {
  const map: Record<string, string> = { earning: '收入', cost: '支出', penalty: '赔付', dividend: '分红', loan: '贷款', repayment: '还款', vault_deposit: '入库', vault_release: '出库' }
  return map[kind] || kind
}
function recStatusLabel(s: string) {
  const map: Record<string, string> = { drafted: '草拟', issued: '已发出', adopted: '已采纳', executed: '已执行', settled: '已结算', disputed: '争议中', archived: '已归档' }
  return map[s] || s
}
const toolNameMap: Record<string, string> = {
  scan_market_news: '扫描市场新闻', get_stock_realtime: '实时行情', get_stock_history: '历史行情',
  analyze_fundamentals: '基本面分析', screen_stocks: '选股筛选', get_northbound_flow: '北向资金',
  get_sector_heat: '板块热度', generate_research_report: '研报生成', record_investment: '记录投资',
  settle_dividend: '结算分红', apply_penalty: '执行赔付', request_loan: '申请贷款', manage_vault: '保险箱管理',
  build_structure: '建造', relocate_structure: '迁移', upgrade_structure: '升级建筑',
  request_erp_access: '请求ERP权限', issue_recommendation: '发出指令', write_reflection: '写日记',
  consult_marketing_expert: '咨询营销顾问', browse_books: '查阅书架', add_book: '写书', recommend_book: '推荐书',
}
</script>

<style scoped>
.hall-page {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  flex-direction: column;
  background: var(--h-wall-dark);
  font-family: 'Courier New', ui-monospace, monospace;
  image-rendering: pixelated;
  overflow: hidden;
}

/* ── 进场百叶 ── */
.hall-enter-fx {
  position: absolute;
  inset: 0;
  z-index: 200;
  display: flex;
  flex-direction: column;
  pointer-events: none;
}
.fx-strip {
  flex: 1;
  background: #0a0a0c;
  animation: fxStrip 0.5s steps(5) forwards;
  transform-origin: left center;
}
@keyframes fxStrip {
  0% { transform: scaleX(1); }
  100% { transform: scaleX(0); }
}

/* ── HUD ── */
.hall-hud {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 10px 18px;
  background: #0e0e12;
  border-bottom: 3px solid var(--h-trim);
  flex-shrink: 0;
}
.hud-back {
  background: #1c1c24;
  color: #d8d8e0;
  border: 2px solid #3a3a48;
  padding: 6px 14px;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
}
.hud-back:hover { background: var(--h-trim); color: #0e0e12; border-color: var(--h-trim); }
.hud-title-wrap { display: flex; flex-direction: column; gap: 1px; }
.hud-name { font-size: 17px; font-weight: bold; color: var(--h-glow); letter-spacing: 2px; }
.hud-sub { font-size: 10px; color: #6a6a78; letter-spacing: 1px; }
.hud-right { margin-left: auto; display: flex; gap: 8px; align-items: center; }
.hud-chip {
  font-size: 10px;
  padding: 3px 8px;
  background: #1c1c24;
  border: 1px solid #3a3a48;
  color: #b0b0c0;
}
.hud-chip.adam { border-color: var(--h-accent); color: var(--h-glow); animation: pxBlink 2s steps(1) infinite; }
.hud-chip.status.active, .hud-chip.status.urgent { color: #60e080; border-color: #2a5a3a; }
.hud-chip.status.locked { color: #888; }
@keyframes pxBlink { 0%, 70% { opacity: 1; } 71%, 100% { opacity: 0.5; } }

/* ── 主体 ── */
.hall-body { flex: 1; display: flex; min-height: 0; }

/* ── 场景 ── */
.hall-scene {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-width: 0;
}
.hall-wall {
  position: absolute;
  left: 0; right: 0; top: 0;
  height: 58%;
  background:
    repeating-linear-gradient(90deg, transparent 0 46px, rgba(0, 0, 0, 0.12) 46px 48px),
    repeating-linear-gradient(0deg, transparent 0 30px, rgba(0, 0, 0, 0.1) 30px 32px),
    var(--h-wall);
}
.wall-trim {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 10px;
  background: var(--h-trim);
  box-shadow: 0 -4px 0 rgba(0, 0, 0, 0.25);
}
.wall-window {
  position: absolute;
  top: 8%;
  width: 84px;
  height: 64px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 5px;
  padding: 5px;
  background: #14100c;
  box-shadow: 4px 4px 0 rgba(0, 0, 0, 0.3);
}
.ww-pane {
  background: linear-gradient(180deg, #2a3e54 0 40%, #1c2c40 40% 100%);
  animation: pxWinGlow 8s steps(2) infinite;
}
@keyframes pxWinGlow {
  0%, 90%, 100% { filter: brightness(1); }
  94% { filter: brightness(1.5); }
}
.hall-floor {
  position: absolute;
  left: 0; right: 0; bottom: 0;
  height: 42%;
  background:
    repeating-conic-gradient(var(--h-floor-a) 0% 25%, var(--h-floor-b) 25% 50%) 0 0 / 64px 64px;
  box-shadow: inset 0 6px 0 rgba(0, 0, 0, 0.3);
}

/* ── 陈设 ── */
.hall-prop {
  position: absolute;
  transform: translateX(-50%);
  filter: drop-shadow(3px 4px 0 rgba(0, 0, 0, 0.35));
}
.hall-prop.on-floor { bottom: 16%; }
.hall-prop.on-wall { top: 12%; }
.hall-prop.interactive { cursor: pointer; transition: transform 0.1s steps(2); }
.hall-prop.interactive:hover { transform: translateX(-50%) translateY(-4px); }
.hall-prop.interactive.active { filter: drop-shadow(3px 4px 0 rgba(0, 0, 0, 0.35)) drop-shadow(0 0 8px var(--h-glow)); }
.prop-label {
  position: absolute;
  left: 50%;
  top: -30px;
  transform: translateX(-50%);
  white-space: nowrap;
  font-size: 11px;
  color: #0e0e12;
  background: var(--h-glow);
  padding: 3px 8px;
  box-shadow: 2px 2px 0 #000;
  pointer-events: none;
  animation: pxBob 1.6s steps(2) infinite;
}
.prop-arrow { margin-left: 4px; }
@keyframes pxBob {
  0%, 100% { transform: translateX(-50%) translateY(0); }
  50% { transform: translateX(-50%) translateY(-3px); }
}

/* ── NPC ── */
.hall-npc, .hall-adam {
  position: absolute;
  bottom: 19%;
  transform: translateX(-50%);
  text-align: center;
  z-index: 5;
}
.hall-adam { bottom: 24%; left: 46%; }
.npc-svg { animation: npcIdle 1.2s steps(2) infinite; filter: drop-shadow(2px 3px 0 rgba(0, 0, 0, 0.4)); }
@keyframes npcIdle {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}
.npc-eye { animation: npcBlink 4s steps(1) infinite; }
@keyframes npcBlink {
  0%, 92%, 100% { opacity: 1; }
  94%, 98% { opacity: 0; }
}
.npc-name {
  margin-top: 2px;
  font-size: 10px;
  color: #c8c8d8;
  background: rgba(0, 0, 0, 0.55);
  display: inline-block;
  padding: 1px 6px;
}
.adam-name { color: var(--h-glow); border: 1px solid var(--h-accent); }
.npc-bubble {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
  max-width: 240px;
  font-size: 11px;
  color: #1c1812;
  background: #f0ead8;
  padding: 5px 10px;
  box-shadow: 2px 2px 0 #000;
}
.npc-bubble::after {
  content: '';
  position: absolute;
  top: 100%;
  left: 50%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: #f0ead8;
}
.adam-bubble { background: var(--h-glow); }
.adam-bubble::after { border-top-color: var(--h-glow); }

/* ── 右侧业务面板 ── */
.hall-panel {
  width: 400px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  background: #101016;
  border-left: 3px solid var(--h-trim);
}
.panel-tabs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px;
  border-bottom: 2px solid #22222c;
}
.panel-tab {
  background: #1c1c26;
  border: 2px solid #34343f;
  color: #9898a8;
  font-family: inherit;
  font-size: 12px;
  padding: 5px 12px;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
}
.panel-tab.on {
  background: var(--h-trim);
  border-color: var(--h-trim);
  color: #0e0e12;
  font-weight: bold;
}
.panel-body {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
}
.panel-body::-webkit-scrollbar { width: 8px; }
.panel-body::-webkit-scrollbar-thumb { background: #2e2e3a; }

.panel-section-title {
  font-size: 11px;
  color: var(--h-glow);
  letter-spacing: 2px;
  margin: 16px 0 8px;
  padding-bottom: 4px;
  border-bottom: 1px dashed #34343f;
}
.panel-section-title:first-child { margin-top: 0; }
.title-count { color: #6a6a78; margin-left: 6px; }
.float-r { float: right; }

.px-empty {
  font-size: 12px;
  color: #5a5a68;
  padding: 14px 0;
  text-align: center;
}

/* 统计卡 */
.stat-cards { display: flex; gap: 8px; }
.stat-card {
  flex: 1;
  background: #1a1a22;
  border: 2px solid #30303c;
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  box-shadow: 3px 3px 0 #000;
}
.stat-card.gold { border-color: #6a5a20; }
.stat-card.green { border-color: #2a5a3a; }
.stat-card.red { border-color: #5a2a2a; }
.stat-label { font-size: 10px; color: #8a8a98; }
.stat-val { font-size: 14px; font-weight: bold; color: #e8e8f0; word-break: break-all; }
.stat-card.gold .stat-val { color: #f0c040; }
.stat-card.green .stat-val { color: #60d080; }
.stat-card.red .stat-val { color: #e07060; }

/* 表单 */
.px-form { display: flex; flex-direction: column; gap: 8px; }
.px-form-row { display: flex; gap: 8px; }
.px-form-row > * { flex: 1; min-width: 0; }
.px-input {
  background: #1a1a22;
  border: 2px solid #34343f;
  color: #e0e0e8;
  font-family: inherit;
  font-size: 13px;
  padding: 8px 10px;
  outline: none;
  width: 100%;
  box-sizing: border-box;
}
.px-input:focus { border-color: var(--h-accent); }
.px-textarea { resize: vertical; }
.px-btn {
  font-family: inherit;
  font-size: 13px;
  padding: 8px 14px;
  border: 2px solid;
  cursor: pointer;
  box-shadow: 2px 2px 0 #000;
}
.px-btn:active { transform: translate(2px, 2px); box-shadow: none; }
.px-btn:disabled { opacity: 0.4; cursor: not-allowed; }
.px-btn.gold { background: #f0c040; border-color: #f0c040; color: #1c1812; font-weight: bold; }
.px-btn.green { background: #2a5a3a; border-color: #3a7a4e; color: #b0f0c0; }
.px-btn.red { background: #4a2424; border-color: #6a3434; color: #f0b0a8; }
.px-btn.sm { font-size: 11px; padding: 4px 10px; }

/* 流水行 */
.ledger-line {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 4px;
  border-bottom: 1px solid #1e1e28;
  font-size: 12px;
}
.ll-dir { width: 18px; text-align: center; flex-shrink: 0; font-weight: bold; }
.ll-dir.in { color: #60d080; }
.ll-dir.out { color: #e07060; }
.ll-mid { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
.ll-title { color: #d0d0dc; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; }
.ll-meta { font-size: 10px; color: #62626e; }
.ll-amt { flex-shrink: 0; font-weight: bold; }
.ll-amt.in { color: #60d080; }
.ll-amt.out { color: #e07060; }

/* 贷款卡片 */
.loan-card {
  background: #1a1a22;
  border: 2px solid #34343f;
  padding: 10px;
  margin-bottom: 10px;
  box-shadow: 3px 3px 0 #000;
}
.loan-head { display: flex; justify-content: space-between; align-items: center; }
.loan-amt { font-size: 16px; font-weight: bold; color: #f0c040; }
.loan-time { font-size: 10px; color: #62626e; }
.loan-purpose { font-size: 12px; color: #b8b8c4; margin: 6px 0 10px; }
.loan-actions { display: flex; gap: 8px; }

/* 报告卡片 */
.report-card {
  background: #1a1a22;
  border-left: 3px solid var(--h-accent);
  padding: 9px 10px;
  margin-bottom: 8px;
}
.report-head { display: flex; align-items: center; gap: 6px; }
.report-title { font-size: 13px; color: #e0e0ea; font-weight: bold; flex: 1; }
.report-summary { font-size: 12px; color: #9a9aa8; margin-top: 4px; line-height: 1.6; }
.report-meta { font-size: 10px; color: #5c5c68; margin-top: 5px; }
.report-dot { width: 7px; height: 7px; flex-shrink: 0; background: #6a6a78; }
.report-dot.sense { background: #40c0d0; }
.report-dot.judge { background: #b890e8; }
.report-dot.act { background: #f0c040; }
.report-dot.settle { background: #60d080; }
.report-dot.archive { background: #8a8a98; }
.rec-status { font-size: 10px; padding: 1px 6px; background: #26262f; color: #a8a8b8; flex-shrink: 0; }
.rec-status.issued { color: #f0c040; }
.rec-status.adopted, .rec-status.executed { color: #60d080; }
.rec-status.disputed { color: #e07060; }
.rec-conf { font-size: 11px; color: var(--h-glow); flex-shrink: 0; }
.rec-risk { font-size: 11px; color: #e0a050; margin-top: 4px; }

/* 书架 */
.book-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: flex-end;
  padding: 10px 8px;
  background: #241a0e;
  border: 2px solid #3a2c18;
  box-shadow: inset 0 -6px 0 #1a1208;
}
.book-spine {
  width: 34px;
  height: 92px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 2px 2px 0 rgba(0, 0, 0, 0.4);
  transition: transform 0.1s steps(2);
}
.book-spine:hover { transform: translateY(-6px); }
.book-spine-title {
  writing-mode: vertical-rl;
  font-size: 11px;
  color: #f0e8d0;
  max-height: 84px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.book-reader { background: #1a1a22; border: 2px solid #34343f; padding: 10px; }
.book-author { font-size: 10px; color: #6a6a78; margin-bottom: 8px; }
.book-content { font-size: 12px; color: #c8c8d4; line-height: 1.8; white-space: pre-wrap; max-height: 300px; overflow-y: auto; }

/* 反思卷宗 */
.reflection-card {
  background: #211c14;
  border: 2px solid #3a3024;
  border-left: 4px solid var(--h-accent);
  padding: 10px 12px;
  margin-bottom: 10px;
}
.reflection-date { font-size: 10px; color: #6e6454; margin-bottom: 5px; }
.reflection-text { font-size: 12px; color: #d8d0bc; line-height: 1.8; white-space: pre-wrap; }

/* 信息行 */
.info-rows { display: flex; flex-direction: column; }
.info-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  padding: 7px 2px;
  border-bottom: 1px solid #1e1e28;
}
.info-row span { color: #7a7a88; flex-shrink: 0; }
.info-row b { color: #d8d8e2; text-align: right; }
.tool-tags { display: flex; flex-wrap: wrap; gap: 6px; }
.tool-tag {
  font-size: 11px;
  padding: 3px 9px;
  background: #1c1c26;
  border: 1px solid #34343f;
  color: #a8a8b8;
}

/* 像素小动效 */
.px-flicker { animation: pxFlicker 3s steps(2) infinite; }
@keyframes pxFlicker {
  0%, 86%, 100% { opacity: 1; }
  90% { opacity: 0.4; }
}
.scan-line { animation: pxScan 3.2s steps(12) infinite; }
@keyframes pxScan {
  0% { transform: translateY(0); }
  100% { transform: translateY(22px); }
}

/* 窄屏适配 */
@media (max-width: 860px) {
  .hall-body { flex-direction: column; }
  .hall-scene { min-height: 280px; }
  .hall-panel { width: 100%; flex: 1; border-left: none; border-top: 3px solid var(--h-trim); }
}
</style>
