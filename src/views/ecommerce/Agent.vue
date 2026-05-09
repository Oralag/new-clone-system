<template>
  <div class="ops-agent-page">
    <section class="hero">
      <div>
        <div class="hero-title">ERP 管家 · 运营专员团队</div>
        <div class="hero-desc">
          运营人员还是要有，只是不再单独造一套平行系统。这里的做法是：由 ERP 管家统筹，下面挂数据官、补货专员、客户运营专员、活动策划专员这些工作身份。
        </div>
      </div>
      <div class="hero-actions">
        <button class="primary-btn" @click="sendCaptainPrompt('从运营视角看一下今天的销售、客户和库存，给我一个行动建议')">开始经营分析</button>
        <button class="ghost-btn" @click="router.push('/mobile')">打开移动端管家</button>
      </div>
    </section>

    <section class="grid">
      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">运营专员席位</div>
            <div class="panel-sub">还是同一个 ERP 管家，但你可以按岗位把它切成不同运营人员来用。</div>
          </div>
        </div>
        <div class="mode-grid">
          <button v-for="mode in modes" :key="mode.title" class="mode-card" @click="sendCaptainPrompt(mode.prompt)">
            <div class="mode-emoji">{{ mode.emoji }}</div>
            <div class="mode-title">{{ mode.title }}</div>
            <div class="mode-desc">{{ mode.desc }}</div>
          </button>
        </div>
      </article>

      <article class="panel">
        <div class="panel-head">
          <div>
            <div class="panel-title">运营任务</div>
            <div class="panel-sub">点一下就把任务交给管家和对应专员，不再另外维护假聊天页。</div>
          </div>
        </div>
        <div class="task-list">
          <button v-for="task in quickTasks" :key="task.title" class="task-card" @click="sendCaptainPrompt(task.prompt)">
            <div class="task-title">{{ task.title }}</div>
            <div class="task-desc">{{ task.desc }}</div>
          </button>
        </div>
      </article>
    </section>

    <section class="panel">
      <div class="panel-head">
        <div>
          <div class="panel-title">处理原则</div>
          <div class="panel-sub">这块以后只做“驾驶舱 + 管家 + 运营专员 + ERP模块跳转”，不再平行造模块。</div>
        </div>
      </div>
      <div class="principle-list">
        <div class="principle-item">运营人员存在，但它们是 ERP 管家的岗位身份，不是另一套独立系统。</div>
        <div class="principle-item">查询 ERP 数据，优先交给管家和对应专员，不单独新造一个运营数据查询页。</div>
        <div class="principle-item">真正落单据、审核、收款、出库，回到原有 ERP 模块走完整业务链路。</div>
        <div class="principle-item">运营页只负责发现问题、汇总信息、触发动作，不做假的平台状态、假的订单壳、假的客户壳。</div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const modes = [
  {
    emoji: '📊',
    title: '数据官',
    desc: '盯销售、订单、库存异常，给经营判断。',
    prompt: '切到数据官身份，给我看今天销售、订单和库存异常。',
  },
  {
    emoji: '📦',
    title: '补货专员',
    desc: '看库存预警，判断先补什么、补多少。',
    prompt: '切到补货专员身份，分析库存预警并给出补货动作。',
  },
  {
    emoji: '💬',
    title: '客户运营专员',
    desc: '盯客户跟进、私域动作和样品转化。',
    prompt: '切到客户运营专员身份，帮我整理近期客户跟进和活动建议。',
  },
  {
    emoji: '🎯',
    title: '活动策划专员',
    desc: '围绕销售目标和客户节奏出活动方案。',
    prompt: '切到活动策划专员身份，结合当前业务给我一版近期促销动作建议。',
  },
]

const quickTasks = [
  {
    title: '今日经营晨报',
    desc: '销售、库存、客户三条线各给一句判断。',
    prompt: '从经营视角给我一版今日晨报，包含销售、库存、客户三个部分。',
  },
  {
    title: '补货优先级',
    desc: '先补哪些，为什么。',
    prompt: '根据当前库存预警给我一个补货优先级清单，要简明一点。',
  },
  {
    title: '客户跟进清单',
    desc: '把本周该跟的客户列出来。',
    prompt: '帮我整理一版本周客户跟进清单，并给出简单建议。',
  },
  {
    title: '活动切入口',
    desc: '结合现在业务给促销或活动方向。',
    prompt: '结合现有销售和客户情况，给我三个近期活动切入口。',
  },
]

function sendCaptainPrompt(prompt: string) {
  window.dispatchEvent(new CustomEvent('captain-fill', { detail: prompt }))
}
</script>

<style scoped>
.ops-agent-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.hero,
.panel {
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.06);
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px;
}

.hero-title {
  font-size: 26px;
  font-weight: 800;
  color: #0f172a;
}

.hero-desc {
  margin-top: 8px;
  max-width: 820px;
  font-size: 13px;
  line-height: 1.7;
  color: #64748b;
}

.hero-actions {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 220px;
}

.grid {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 16px;
}

.panel {
  padding: 20px;
}

.panel-head {
  margin-bottom: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a;
}

.panel-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
}

.mode-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mode-card,
.task-card {
  border: 1px solid rgba(148, 163, 184, 0.12);
  border-radius: 18px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  padding: 16px;
  text-align: left;
  cursor: pointer;
}

.mode-emoji {
  font-size: 26px;
}

.mode-title,
.task-title {
  margin-top: 12px;
  font-size: 14px;
  font-weight: 700;
  color: #0f172a;
}

.mode-desc,
.task-desc {
  margin-top: 4px;
  font-size: 12px;
  color: #64748b;
  line-height: 1.6;
}

.task-list,
.principle-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.principle-item {
  border-radius: 16px;
  background: #f8fafc;
  padding: 14px;
  font-size: 13px;
  line-height: 1.7;
  color: #334155;
}

.primary-btn,
.ghost-btn {
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.primary-btn {
  border: none;
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #fff;
}

.ghost-btn {
  border: 1px solid rgba(148, 163, 184, 0.2);
  background: #fff;
  color: #334155;
}
</style>
