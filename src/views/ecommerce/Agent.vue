<template>
  <div class="workbench">

    <div class="spec-tabs">
      <button
        v-for="s in SPECS"
        :key="s.id"
        class="spec-tab"
        :class="{ 'spec-tab-active': activeSpec === s.id }"
        :style="activeSpec === s.id ? { '--c': s.color, '--cbg': s.colorBg } : {}"
        @click="activeSpec = s.id"
      >
        <span class="tab-emoji">{{ s.emoji }}</span>
        <span class="tab-name">{{ s.name }}</span>
      </button>
    </div>

    <div class="workbench-body">

      <section class="tasks-panel">
        <div class="tasks-hd">
          <div class="tasks-title">
            <span class="tasks-emoji">{{ currentSpec.emoji }}</span>
            {{ currentSpec.name }}快捷任务
          </div>
          <div class="tasks-sub">{{ currentSpec.tagline }}</div>
        </div>
        <div class="tasks-grid">
          <button
            v-for="task in currentSpec.tasks"
            :key="task.label"
            class="task-card"
            :style="{ '--c': currentSpec.color, '--cbg': currentSpec.colorBg }"
            @click="sendTask(task.prompt)"
          >
            <div class="task-icon">{{ task.icon }}</div>
            <div class="task-label">{{ task.label }}</div>
            <div class="task-hint">{{ task.hint }}</div>
          </button>
        </div>
      </section>

      <section class="auto-panel">
        <div class="auto-hd">
          <div class="auto-title">自动任务</div>
          <div class="auto-sub">用自然语言描述，系统自动定时运行</div>
        </div>

        <div class="auto-input-wrap">
          <input
            v-model="autoTaskInput"
            class="auto-input"
            placeholder="描述你想自动化的运营任务，比如『每天早8点推送昨日销售报告』"
            @keydown.enter="createAutoTask"
          />
          <button class="auto-submit" @click="createAutoTask">创建</button>
        </div>

        <div class="auto-examples">
          <button
            v-for="ex in AUTO_EXAMPLES"
            :key="ex"
            class="auto-ex"
            @click="autoTaskInput = ex"
          >{{ ex }}</button>
        </div>

        <div class="auto-phase-tip">功能开发中，当前为预览模式</div>

        <div v-if="autoTasks.length === 0" class="auto-empty">
          <div class="auto-empty-icon">⏰</div>
          <div class="auto-empty-text">还没有自动任务</div>
          <div class="auto-empty-sub">用自然语言描述任务，点击示例快速填入</div>
        </div>

        <div v-else class="auto-list">
          <div v-for="t in autoTasks" :key="t.id" class="auto-item">
            <div class="auto-item-left">
              <div class="auto-item-icon">{{ t.emoji }}</div>
              <div>
                <div class="auto-item-name">{{ t.name }}</div>
                <div class="auto-item-cron">{{ t.cron }}</div>
              </div>
            </div>
            <div class="auto-item-right">
              <span class="auto-badge" :class="t.active ? 'badge-on' : 'badge-off'">
                {{ t.active ? '运行中' : '暂停' }}
              </span>
              <button class="auto-del" @click="removeAutoTask(t.id)">×</button>
            </div>
          </div>
        </div>
      </section>

    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'

interface AutoTask {
  id: number
  emoji: string
  name: string
  cron: string
  active: boolean
}

const SPECS = [
  {
    id: 'ops_data',
    emoji: '📊',
    name: '数据官',
    color: '#0ea5e9',
    colorBg: 'rgba(14,165,233,0.08)',
    tagline: '监控销售与平台异常，主动推送洞察',
    tasks: [
      { icon: '📈', label: '今日销售晨报', hint: '基于 ERP 销售数据', prompt: '数据官，给我出今日销售晨报，从 ERP 数据分析今日订单、销售额和环比变化情况。' },
      { icon: '⚠️', label: '异常订单预警', hint: '检测退款率/取消率', prompt: '数据官，检查近期有没有异常订单情况，比如退货率或取消率突然升高，给出原因判断。' },
      { icon: '📦', label: '库存健康度', hint: '基于 ERP 库存数据', prompt: '数据官，从 ERP 库存数据给我一份库存健康度报告，列出低库存商品、滞销品和库存周转情况。' },
      { icon: '🔥', label: '热销品排名', hint: '近7日 ERP 销售记录', prompt: '数据官，统计 ERP 近7日销售记录，找出热销品排名和潜力品。' },
      { icon: '📉', label: '平台趋势分析', hint: '需平台接入后使用', prompt: '数据官，分析各平台近30天销售趋势，哪个平台增长哪个下滑，并给出调整建议。' },
      { icon: '🗓', label: '本周运营周报', hint: '销售额/订单/客单价', prompt: '数据官，生成本周运营周报，核心指标：销售额、订单数、客单价、退货率，并对比上周。' },
      { icon: '💡', label: '运营洞察建议', hint: 'AI分析+优先行动', prompt: '数据官，根据当前 ERP 数据给我3条最重要的运营洞察，以及对应的优先行动建议。' },
      { icon: '📋', label: '自定义数据查询', hint: '告诉我你要什么数据', prompt: '数据官，我需要查询一些数据，请先问我想分析什么维度，然后帮我从 ERP 中找到对应数据。' },
    ],
  },
  {
    id: 'ops_restock',
    emoji: '📦',
    name: '补货专员',
    color: '#f97316',
    colorBg: 'rgba(249,115,22,0.08)',
    tagline: '库存分析+补货建议+采购草稿',
    tasks: [
      { icon: '🚨', label: '库存预警清单', hint: '低于安全库存的商品', prompt: '补货专员，列出当前所有低于安全库存的商品，按紧急程度排序。' },
      { icon: '📝', label: '生成补货建议', hint: '结合销量计算补货量', prompt: '补货专员，根据近30天销量和当前库存，生成补货建议清单，包含建议补货数量。' },
      { icon: '🛒', label: '创建采购草稿', hint: '一键生成采购计划单', prompt: '补货专员，根据补货建议帮我创建一份采购计划草稿，列出供应商和数量。' },
      { icon: '🔄', label: '库存周转分析', hint: '周转天数+滞销风险', prompt: '补货专员，分析各商品库存周转天数，找出周转过慢有滞销风险的商品。' },
      { icon: '📊', label: '供应商对比', hint: '价格/交期/历史记录', prompt: '补货专员，帮我对比 ERP 中主要供应商的采购价格、平均交货期和历史采购记录。' },
      { icon: '🛡', label: '安全库存设置', hint: '建议各品安全库存值', prompt: '补货专员，根据历史销量波动，建议各商品的合理安全库存设置值。' },
      { icon: '📅', label: '补货时间表', hint: '未来30天补货节奏', prompt: '补货专员，制定未来30天的补货时间表，考虑旺季节点和供应商交期。' },
      { icon: '📦', label: '积压库存处理', hint: '滞销品清库策略', prompt: '补货专员，分析积压库存情况，给出清库处理建议（促销/捆绑/下架）。' },
    ],
  },
  {
    id: 'ops_customer',
    emoji: '🤝',
    name: '客户运营',
    color: '#8b5cf6',
    colorBg: 'rgba(139,92,246,0.08)',
    tagline: '客户分层+跟进策略+私域运营',
    tasks: [
      { icon: '🏆', label: 'RFM客户分层', hint: '基于 ERP 客户数据', prompt: '客户运营，用 RFM 模型对 ERP 客户数据分层，分出高价值、流失风险和潜力客户，并给出各层的跟进策略。' },
      { icon: '📞', label: '本周跟进清单', hint: '按优先级排序', prompt: '客户运营，整理本周应该跟进的客户名单，按优先级排序，并给出每个客户的跟进要点。' },
      { icon: '👑', label: 'VIP客户维护', hint: '大客户个性化策略', prompt: '客户运营，从 ERP 里分析 VIP 大客户近期消费情况，制定个性化维护方案。' },
      { icon: '😴', label: '流失预警客户', hint: '90天未购买的客户', prompt: '客户运营，找出 ERP 中90天以上未复购的客户，分析流失原因并制定唤醒方案。' },
      { icon: '🎯', label: '交叉销售机会', hint: '基于购买历史推荐', prompt: '客户运营，根据 ERP 客户历史购买记录，找出交叉销售和向上销售机会，列出具体客户和推荐商品。' },
      { icon: '🎂', label: '客户节日关怀', hint: '本月关键节日名单', prompt: '客户运营，整理本月有重要节点的客户（生日/周年/节日），制定差异化关怀方案。' },
      { icon: '💬', label: '私域运营方案', hint: '社群分层+内容节奏', prompt: '客户运营，给我一份私域运营方案，包括微信群分层逻辑、群内活动节奏、内容建议和朋友圈发文策略。' },
      { icon: '📊', label: '客户健康度报告', hint: '新客/复购/流失分析', prompt: '客户运营，生成客户健康度报告，分析 ERP 客户的新客增长、复购率、客单价变化和流失情况。' },
    ],
  },
  {
    id: 'ops_promo',
    emoji: '🎯',
    name: '活动策划',
    color: '#ef4444',
    colorBg: 'rgba(239,68,68,0.08)',
    tagline: '促销方案+GMV预测+平台活动',
    tasks: [
      { icon: '🎪', label: '近期促销方案', hint: '结合 ERP 销售现状', prompt: '活动策划，结合当前 ERP 销售数据和近期电商节点，给我3个可立即执行的促销方案，注明预期效果。' },
      { icon: '📅', label: '大促节奏日历', hint: '近3个月关键节点', prompt: '活动策划，整理近3个月的电商大促节点和行业旺季，帮我制定备战节奏和资源准备计划。' },
      { icon: '💰', label: '销售目标拆解', hint: '分解到品类/时间段', prompt: '活动策划，帮我把本月销售目标拆解到主要品类和时间段，每段设定里程碑和对应动作。' },
      { icon: '⚡', label: '限时秒杀策划', hint: '选品+折扣+执行节奏', prompt: '活动策划，策划一个限时秒杀活动：帮我从 ERP 商品中选出适合秒杀的品，建议折扣力度和执行时间段。' },
      { icon: '🎁', label: '捆绑促销组合', hint: '提客单价+去库存', prompt: '活动策划，根据 ERP 商品和库存情况，设计捆绑促销组合，同时提升客单价和消化积压库存。' },
      { icon: '🏪', label: '平台差异化策略', hint: '各平台玩法不同', prompt: '活动策划，针对抖音直播、淘宝搜索、拼多多低价这三种不同平台逻辑，分别设计差异化活动方案。' },
      { icon: '📊', label: '活动效果复盘', hint: '销售数据+ROI分析', prompt: '活动策划，帮我复盘近期促销活动的效果：从 ERP 销售数据分析活动期间的销售额、订单量和 ROI 变化。' },
      { icon: '🔮', label: '爆款孵化计划', hint: '从 ERP 找潜力品', prompt: '活动策划，从 ERP 商品销售记录中找出增速快、复购率高的潜力品，制定从冷启动到爆款的推广计划。' },
    ],
  },
]

const AUTO_EXAMPLES = [
  '每天早8点推送昨日运营日报',
  '每周五下午统计本周各平台销量',
  '库存低于50件时立刻提醒我',
  '每月1号生成上月经营分析报告',
]

const route = useRoute()
const activeSpec = ref('ops_restock')
const autoTaskInput = ref('')
const autoTasks = ref<AutoTask[]>([])
let nextId = 1

const currentSpec = computed(() => SPECS.find(s => s.id === activeSpec.value)!)

onMounted(() => {
  const spec = route.query.spec as string
  if (spec && SPECS.some(s => s.id === spec)) {
    activeSpec.value = spec
  }
})

function sendTask(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
  ElMessage({ message: '已填入顶部输入框，点击发送即可', type: 'info', duration: 2000 })
}

function createAutoTask() {
  const text = autoTaskInput.value.trim()
  if (!text) return

  const emojiMap: Record<string, string> = {
    '日报': '📅', '周报': '📊', '月报': '📋', '提醒': '🔔',
    '库存': '📦', '销售': '📈', '客户': '🤝', '活动': '🎯',
  }
  const emoji = Object.entries(emojiMap).find(([k]) => text.includes(k))?.[1] ?? '⏰'

  const cronHint = text.includes('每天') ? '每天执行'
    : text.includes('每周') ? '每周执行'
    : text.includes('每月') ? '每月执行'
    : (text.includes('低于') || text.includes('超过') || text.includes('当') || text.includes('时')) ? '条件触发'
    : '手动触发'

  autoTasks.value.unshift({
    id: nextId++,
    emoji,
    name: text,
    cron: cronHint,
    active: true,
  })
  autoTaskInput.value = ''
  ElMessage({ message: '自动任务已创建', type: 'success', duration: 1500 })
}

function removeAutoTask(id: number) {
  autoTasks.value = autoTasks.value.filter(t => t.id !== id)
}
</script>

<style scoped>
.workbench {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.spec-tabs {
  display: flex;
  gap: 8px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  padding: 8px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.spec-tab {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  border: none;
  background: transparent;
  color: #64748b;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.18s ease;
}

.spec-tab:hover {
  background: #f8fafc;
  color: #334155;
}

.spec-tab-active {
  background: var(--cbg);
  color: var(--c);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.tab-emoji { font-size: 16px; }

.workbench-body {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 16px;
  align-items: start;
}

.tasks-panel, .auto-panel {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 20px;
  padding: 20px;
  box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05);
}

.tasks-hd {
  margin-bottom: 16px;
}

.tasks-title {
  font-size: 15px;
  font-weight: 700;
  color: #0f172a;
  display: flex;
  align-items: center;
  gap: 8px;
}

.tasks-emoji { font-size: 18px; }

.tasks-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.tasks-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 10px;
}

.task-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 12px;
  border-radius: 14px;
  border: 1px solid rgba(148, 163, 184, 0.1);
  background: #fafbfc;
  cursor: pointer;
  text-align: left;
  transition: all 0.18s ease;
}

.task-card:hover {
  background: var(--cbg);
  border-color: rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
}

.task-icon { font-size: 20px; }

.task-label {
  font-size: 13px;
  font-weight: 700;
  color: #0f172a;
}

.task-hint {
  font-size: 11px;
  color: #94a3b8;
  line-height: 1.4;
}

.auto-phase-tip {
  font-size: 10px;
  color: #94a3b8;
  margin-bottom: 8px;
  padding: 4px 8px;
  background: #f8fafc;
  border-radius: 6px;
  text-align: center;
}

.auto-hd {
  margin-bottom: 14px;
}

.auto-title {
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.auto-sub {
  margin-top: 3px;
  font-size: 11px;
  color: #64748b;
}

.auto-input-wrap {
  display: flex;
  gap: 8px;
  margin-bottom: 10px;
}

.auto-input {
  flex: 1;
  border: 1px solid rgba(148, 163, 184, 0.2);
  border-radius: 10px;
  padding: 9px 12px;
  font-size: 12px;
  color: #0f172a;
  outline: none;
  background: #f8fafc;
}

.auto-input:focus {
  border-color: rgba(13, 148, 136, 0.4);
  background: #fff;
}

.auto-submit {
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
  border-radius: 10px;
  padding: 9px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}

.auto-examples {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 16px;
}

.auto-ex {
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 999px;
  padding: 4px 10px;
  font-size: 11px;
  color: #64748b;
  background: #f8fafc;
  cursor: pointer;
  transition: all 0.15s;
}

.auto-ex:hover {
  background: rgba(13, 148, 136, 0.08);
  color: #0f766e;
  border-color: rgba(13, 148, 136, 0.2);
}

.auto-empty {
  padding: 24px 16px;
  text-align: center;
}

.auto-empty-icon { font-size: 28px; margin-bottom: 8px; }
.auto-empty-text { font-size: 13px; font-weight: 600; color: #334155; }
.auto-empty-sub { margin-top: 4px; font-size: 11px; color: #94a3b8; line-height: 1.5; }

.auto-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.auto-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid rgba(148, 163, 184, 0.1);
}

.auto-item-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.auto-item-icon { font-size: 18px; flex-shrink: 0; }

.auto-item-name {
  font-size: 12px;
  font-weight: 600;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.auto-item-cron {
  font-size: 11px;
  color: #94a3b8;
  margin-top: 2px;
}

.auto-item-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.auto-badge {
  font-size: 10px;
  font-weight: 600;
  padding: 3px 7px;
  border-radius: 999px;
}

.badge-on { background: rgba(16, 185, 129, 0.1); color: #059669; }
.badge-off { background: rgba(148, 163, 184, 0.12); color: #64748b; }

.auto-del {
  border: none;
  background: none;
  color: #94a3b8;
  cursor: pointer;
  font-size: 16px;
  line-height: 1;
  padding: 2px 4px;
  border-radius: 4px;
}

.auto-del:hover { color: #ef4444; background: rgba(239, 68, 68, 0.08); }
</style>
