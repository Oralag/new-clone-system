<template>
  <div class="pricing-page">

    <!-- Nav -->
    <div class="pricing-nav">
      <div class="nav-logo">
        <svg width="28" height="28" viewBox="0 0 36 36" fill="none">
          <rect width="36" height="36" rx="8" fill="url(#pg)"/>
          <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue',Arial,sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
          <circle cx="27" cy="8" r="4" fill="#F19D38"/>
          <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse"><stop offset="0%" stop-color="#1C2B48"/><stop offset="100%" stop-color="#1D3974"/></linearGradient></defs>
        </svg>
        <span class="nav-brand">数字游牧 ERP</span>
      </div>
      <button class="nav-back" @click="$router.back()">
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
        返回
      </button>
    </div>

    <!-- Hero -->
    <div class="hero-section">
      <div class="hero-tag">💎 付费版</div>
      <h1 class="hero-title">为您的企业解锁<br/><span class="hero-accent">全套数字化管理能力</span></h1>
      <p class="hero-sub">独立数据库 · 数据永久安全 · 全模块功能开放 · 专属技术支持</p>
      <div class="hero-cta">
        <a href="#contact" class="cta-primary">立即咨询开通</a>
        <a href="#modules" class="cta-secondary">查看全部功能 ↓</a>
      </div>
      <div class="hero-stats">
        <div class="stat-item">
          <div class="stat-n">14+</div>
          <div class="stat-l">核心模块</div>
        </div>
        <div class="stat-div"/>
        <div class="stat-item">
          <div class="stat-n">100+</div>
          <div class="stat-l">功能页面</div>
        </div>
        <div class="stat-div"/>
        <div class="stat-item">
          <div class="stat-n">独立</div>
          <div class="stat-l">数据库</div>
        </div>
        <div class="stat-div"/>
        <div class="stat-item">
          <div class="stat-n">永久</div>
          <div class="stat-l">数据安全</div>
        </div>
      </div>
    </div>

    <!-- Compare banner -->
    <div class="compare-section">
      <div class="compare-inner">
        <div class="compare-col trial-col">
          <div class="compare-head">体验版（当前）</div>
          <ul class="compare-list">
            <li class="no">✗ 数据共享演示环境</li>
            <li class="no">✗ 无法保存任何数据</li>
            <li class="no">✗ 新增/编辑/导入禁用</li>
            <li class="no">✗ 数据随时可能清空</li>
          </ul>
        </div>
        <div class="compare-arrow">→</div>
        <div class="compare-col paid-col">
          <div class="compare-head">💎 付费版</div>
          <ul class="compare-list">
            <li class="ok">✓ 专属独立数据库</li>
            <li class="ok">✓ 所有数据永久保存</li>
            <li class="ok">✓ 全部功能完整开放</li>
            <li class="ok">✓ 数据完全隔离安全</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Modules -->
    <div class="modules-section" id="modules">
      <div class="section-header">
        <div class="section-tag">全功能模块</div>
        <h2 class="section-title">覆盖企业经营全流程</h2>
        <p class="section-sub">从销售到财务，从仓库到人事，一套系统管理所有业务</p>
      </div>

      <div class="modules-grid">
        <div v-for="mod in modules" :key="mod.key" class="module-card">
          <div class="module-icon">{{ mod.icon }}</div>
          <div class="module-body">
            <div class="module-title">{{ mod.title }}</div>
            <div class="module-desc">{{ mod.desc }}</div>
            <div class="module-features">
              <span v-for="f in mod.features" :key="f" class="feature-tag">{{ f }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Full feature list -->
    <div class="feature-list-section">
      <div class="section-header">
        <div class="section-tag">功能清单</div>
        <h2 class="section-title">{{ totalFeatures }}+ 个功能页面，全部开放</h2>
      </div>
      <div class="feature-groups">
        <div v-for="group in featureGroups" :key="group.key" class="feature-group">
          <div class="group-head">
            <span class="group-icon">{{ group.icon }}</span>
            <span class="group-title">{{ group.title }}</span>
            <span class="group-count">{{ group.items.length }} 个功能</span>
          </div>
          <div class="group-items">
            <div v-for="item in group.items" :key="item" class="group-item">
              <span class="item-check">✓</span> {{ item }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Why section -->
    <div class="why-section">
      <div class="section-header">
        <div class="section-tag">为什么选择付费版</div>
        <h2 class="section-title">您的数据，您做主</h2>
      </div>
      <div class="why-grid">
        <div v-for="w in whyItems" :key="w.title" class="why-card">
          <div class="why-icon">{{ w.icon }}</div>
          <div class="why-title">{{ w.title }}</div>
          <div class="why-desc">{{ w.desc }}</div>
        </div>
      </div>
    </div>

    <!-- Contact / CTA -->
    <div class="contact-section" id="contact">
      <div class="contact-inner">
        <div class="contact-left">
          <div class="contact-tag">开通付费版</div>
          <h2 class="contact-title">准备好了吗？<br/>联系我们开始使用</h2>
          <p class="contact-sub">我们会为您配置专属 Railway 后端实例，迁移演示数据，并提供全程技术支持</p>
          <div class="contact-steps">
            <div class="step" v-for="(s, i) in steps" :key="s">
              <div class="step-num">{{ i + 1 }}</div>
              <div class="step-text">{{ s }}</div>
            </div>
          </div>
        </div>
        <div class="contact-right">
          <div class="contact-card">
            <div class="contact-card-title">联系方式</div>
            <div class="contact-items">
              <div class="contact-item">
                <span class="ci-icon">📱</span>
                <div>
                  <div class="ci-label">微信</div>
                  <div class="ci-value">nomad_erp</div>
                </div>
              </div>
              <div class="contact-item">
                <span class="ci-icon">📧</span>
                <div>
                  <div class="ci-label">邮箱</div>
                  <div class="ci-value">contact@nomaderp.com</div>
                </div>
              </div>
              <div class="contact-item">
                <span class="ci-icon">🌐</span>
                <div>
                  <div class="ci-label">官网</div>
                  <div class="ci-value">nomaderp.pages.dev</div>
                </div>
              </div>
            </div>
            <div class="contact-note">
              💡 告知我们您的企业名称和规模，我们将在 24 小时内回复并为您定制方案
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Footer -->
    <div class="pricing-footer">
      <span>数字游牧 ERP</span>
      <span class="footer-dot">·</span>
      <span>游牧观文化传媒出品</span>
      <span class="footer-dot">·</span>
      <span>© {{ new Date().getFullYear() }}</span>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const modules = [
  {
    key: 'customer', icon: '👥', title: '客户管理',
    desc: '全面管理客户生命周期，从公海到成交，掌握每一个商机',
    features: ['客户管理', '客户公海', '客户等级'],
  },
  {
    key: 'sale', icon: '💼', title: '销售管理',
    desc: '从报价到合同到出库，销售全流程数字化追踪',
    features: ['销售报价', '销售订单', '销售出库', '销售退货', '提成设置'],
  },
  {
    key: 'retail', icon: '🏪', title: '零售管理',
    desc: '门店收银、会员体系、积分优惠一体化管理',
    features: ['门店管理', '零售订单', '会员管理', '会员充值', '积分记录', '优惠券'],
  },
  {
    key: 'procure', icon: '📦', title: '采购管理',
    desc: '供应商管理、采购计划到入库全流程闭环',
    features: ['供应商管理', '采购计划', '采购订单', '采购入库', '采购退货'],
  },
  {
    key: 'warehouse', icon: '🏭', title: '仓库管理',
    desc: '多仓库实时库存，出入库流水，库存预警全掌控',
    features: ['库存总览', '调拨管理', '出入库流水', '盘点管理', '库存预警', '批次/序列号'],
  },
  {
    key: 'production', icon: '⚙️', title: '生产管理',
    desc: '生产计划到入库，领料退料全程追踪',
    features: ['生产总览', '生产计划', '生产入库', '领料管理', '退料管理'],
  },
  {
    key: 'outsource', icon: '🔗', title: '委外管理',
    desc: '委外加工全流程，质检收货应付账款一体化',
    features: ['委外计划', '委外入库', '收货管理', '质检管理', '应付账款'],
  },
  {
    key: 'finance', icon: '💰', title: '财务管理',
    desc: '应收应付、收付款、发票、资金流水全面财务管控',
    features: ['财务总览', '应收应付', '收款/付款单', '发票管理', '对账单', '成本核算', '资金账户'],
  },
  {
    key: 'goods', icon: '🛍️', title: '商品管理',
    desc: '商品资料、BOM清单、规格品牌完整商品体系',
    features: ['商品列表', '计量单位', '品牌管理', 'BOM清单'],
  },
  {
    key: 'reports', icon: '📊', title: '报表分析',
    desc: '销售、采购、库存、财务多维报表，数据驱动决策',
    features: ['销售统计', '销售台账', '提成报表', '采购统计', '库存报表', '利润报表', '财务报表'],
  },
  {
    key: 'office', icon: '📋', title: '办公协同',
    desc: '任务、审批、日程、报销、考勤企业内部协作全覆盖',
    features: ['任务管理', '审批流程', '工作汇报', '报销申请', '请假/加班', '外勤打卡', '云盘'],
  },
  {
    key: 'personnel', icon: '👔', title: '人事管理',
    desc: '员工档案、薪资、考勤、社保全套人力资源管理',
    features: ['员工档案', '薪资管理', '考勤管理', '社保管理', '招聘管理', '劳动合同'],
  },
  {
    key: 'setting', icon: '⚙️', title: '系统设置',
    desc: '部门角色权限、打印模板、系统参数灵活配置',
    features: ['部门管理', '角色权限', '账号管理', '打印模板', '参数设置', '操作日志'],
  },
  {
    key: 'ai', icon: '🤖', title: 'AI 智能助手',
    desc: '内置 AI 工作台，智能查询、分析、操作引导',
    features: ['智能问答', '数据分析', '操作引导', '品牌营销'],
  },
]

const featureGroups = [
  { key: 'customer', icon: '👥', title: '客户 & 销售', items: ['客户管理', '客户公海', '客户等级', '销售报价', '销售订单', '销售出库', '销售退货', '提成设置'] },
  { key: 'retail', icon: '🏪', title: '零售', items: ['门店管理', '零售订单', '零售退货', '会员管理', '会员充值', '积分记录', '优惠券'] },
  { key: 'procure', icon: '📦', title: '采购', items: ['供应商管理', '采购计划', '采购订单', '采购入库', '采购退货'] },
  { key: 'warehouse', icon: '🏭', title: '仓库', items: ['库存总览', '报废管理', '调拨管理', '出入库流水', '拣货管理', '盘点管理', '其他入库', '其他出库', '库存预警', '仓库管理', '批次管理', '序列号管理'] },
  { key: 'production', icon: '⚙️', title: '生产 & 委外', items: ['生产总览', '生产计划', '生产入库', '领料管理', '退料管理', '委外计划', '委外入库', '收货管理', '质检管理', '委外应付', '委外付款'] },
  { key: 'finance', icon: '💰', title: '财务', items: ['财务总览', '应收账款', '应付账款', '收款单', '付款单', '发票管理', '对账单', '费用管理', '资金账户', '资金流水', '成本核算', '预付款'] },
  { key: 'goods', icon: '🛍️', title: '商品', items: ['商品资料', '商品分类', '计量单位', '品牌管理', '规格设置', 'BOM清单', '商品价格'] },
  { key: 'reports', icon: '📊', title: '报表', items: ['报表总览', '销售统计', '销售台账', '提成报表', '采购统计', '库存报表', '利润报表', '财务报表'] },
  { key: 'office', icon: '📋', title: '办公', items: ['任务管理', '云盘', '日程提醒', '公告通知', '审批流程', '工作汇报', '外勤打卡', '报销申请', '请假申请', '加班申请', '出差申请'] },
  { key: 'personnel', icon: '👔', title: '人事', items: ['薪资管理', '异动记录', '离职管理', '用车管理', '考勤管理', '招聘管理', '员工档案', '劳动合同', '社保管理', '福利管理'] },
  { key: 'setting', icon: '🔧', title: '系统', items: ['部门管理', '角色管理', '职务管理', '账号管理', '参数设置', '打印模板', '操作日志', '企业信息'] },
]

const totalFeatures = computed(() => featureGroups.reduce((s, g) => s + g.items.length, 0))

const whyItems = [
  { icon: '🔒', title: '数据完全属于您', desc: '付费版为您配置专属 Railway 实例，数据库独立，任何其他租户无法访问您的数据' },
  { icon: '💾', title: '永久安全存储', desc: '体验版数据随时可能重置，付费版数据永久保存，再也不用担心数据丢失' },
  { icon: '🚀', title: '全功能解锁', desc: '体验版所有新增、编辑、导入操作均被禁用，付费版完整开放所有功能' },
  { icon: '🌐', title: '专属后端实例', desc: '独立部署在 Railway 云平台，高可用保障，性能稳定' },
  { icon: '🛠️', title: '专属技术支持', desc: '开通后提供配置迁移、使用培训和专属客服支持' },
  { icon: '📈', title: '持续功能更新', desc: '付费用户优先体验新功能，定期更新迭代，持续提升系统能力' },
]

const steps = [
  '联系我们，告知企业名称和规模',
  '我们为您配置专属 Railway 后端实例',
  '账号升级，数据迁移，立即可用',
  '提供培训文档和技术支持',
]
</script>

<style scoped>
* { box-sizing: border-box; }

.pricing-page {
  min-height: 100vh;
  background: #fff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1d2129;
}

/* ── Nav ─────────────────────────────────────────────────── */
.pricing-nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 40px;
  height: 56px;
  background: rgba(255,255,255,0.9);
  backdrop-filter: blur(20px);
  border-bottom: 1px solid #f0f0f0;
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}
.nav-brand {
  font-size: 16px;
  font-weight: 700;
  color: #1d2129;
}

.nav-back {
  display: flex;
  align-items: center;
  gap: 5px;
  background: none;
  border: 1px solid #e8eaed;
  cursor: pointer;
  font-size: 13px;
  color: #4e5969;
  padding: 6px 14px;
  border-radius: 8px;
  transition: all 0.15s;
}
.nav-back:hover { background: #f7f8fa; }

/* ── Hero ────────────────────────────────────────────────── */
.hero-section {
  text-align: center;
  padding: 80px 24px 60px;
  background: linear-gradient(180deg, #f7f9ff 0%, #fff 100%);
}

.hero-tag {
  display: inline-block;
  background: linear-gradient(135deg, #fa8c16, #d46b08);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 14px;
  border-radius: 20px;
  margin-bottom: 24px;
  letter-spacing: 0.05em;
}

.hero-title {
  font-size: clamp(32px, 5vw, 52px);
  font-weight: 900;
  line-height: 1.15;
  color: #1d2129;
  margin: 0 0 16px;
  letter-spacing: -0.02em;
}

.hero-accent {
  background: linear-gradient(135deg, #3a8ee6, #1c5dbf);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-sub {
  font-size: 16px;
  color: #86909c;
  margin: 0 0 36px;
}

.hero-cta {
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
  margin-bottom: 48px;
}

.cta-primary {
  background: linear-gradient(135deg, #fa8c16, #d46b08);
  color: #fff;
  text-decoration: none;
  font-size: 15px;
  font-weight: 700;
  padding: 14px 32px;
  border-radius: 10px;
  transition: opacity 0.15s, transform 0.15s;
}
.cta-primary:hover { opacity: 0.9; transform: translateY(-1px); }

.cta-secondary {
  background: #f7f8fa;
  color: #4e5969;
  text-decoration: none;
  font-size: 15px;
  font-weight: 600;
  padding: 14px 28px;
  border-radius: 10px;
  border: 1px solid #e8eaed;
  transition: background 0.15s;
}
.cta-secondary:hover { background: #eef0f3; }

.hero-stats {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
  flex-wrap: wrap;
  row-gap: 16px;
}

.stat-item { padding: 0 32px; text-align: center; }
.stat-n { font-size: 28px; font-weight: 900; color: #1d2129; letter-spacing: -0.02em; }
.stat-l { font-size: 12px; color: #86909c; margin-top: 2px; }
.stat-div { width: 1px; height: 36px; background: #e8eaed; }

/* ── Compare ─────────────────────────────────────────────── */
.compare-section {
  padding: 0 24px 60px;
}

.compare-inner {
  max-width: 700px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 16px;
  background: #f7f8fa;
  border-radius: 16px;
  padding: 28px 32px;
  flex-wrap: wrap;
}

.compare-col { flex: 1; min-width: 200px; }

.compare-head {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 14px;
  color: #1d2129;
}
.paid-col .compare-head { color: #fa8c16; }

.compare-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 8px; }
.compare-list li { font-size: 13px; }
.compare-list li.ok { color: #00b42a; }
.compare-list li.no { color: #c9cdd4; text-decoration: line-through; }

.compare-arrow {
  font-size: 28px;
  color: #c9cdd4;
  flex-shrink: 0;
  align-self: center;
}

/* ── Modules ─────────────────────────────────────────────── */
.modules-section {
  padding: 60px 24px;
  background: #f7f9ff;
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #3a8ee6;
  background: #e8f0fe;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 14px;
}

.section-title {
  font-size: clamp(24px, 4vw, 36px);
  font-weight: 800;
  color: #1d2129;
  margin: 0 0 10px;
  letter-spacing: -0.02em;
}

.section-sub {
  font-size: 15px;
  color: #86909c;
  margin: 0;
}

.modules-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
}

.module-card {
  background: #fff;
  border-radius: 14px;
  padding: 22px;
  border: 1.5px solid #e8eaed;
  display: flex;
  gap: 16px;
  align-items: flex-start;
  transition: box-shadow 0.2s, transform 0.2s;
}
.module-card:hover {
  box-shadow: 0 8px 32px rgba(58,142,230,0.1);
  transform: translateY(-2px);
}

.module-icon { font-size: 28px; flex-shrink: 0; }
.module-body { flex: 1; min-width: 0; }
.module-title { font-size: 15px; font-weight: 700; color: #1d2129; margin-bottom: 5px; }
.module-desc { font-size: 12px; color: #86909c; line-height: 1.5; margin-bottom: 10px; }
.module-features { display: flex; flex-wrap: wrap; gap: 4px; }
.feature-tag {
  font-size: 11px;
  color: #3a8ee6;
  background: #e8f0fe;
  padding: 2px 7px;
  border-radius: 4px;
}

/* ── Feature list ────────────────────────────────────────── */
.feature-list-section {
  padding: 60px 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.feature-groups {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.feature-group {
  border: 1.5px solid #e8eaed;
  border-radius: 12px;
  overflow: hidden;
}

.group-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #f7f8fa;
  border-bottom: 1px solid #e8eaed;
}
.group-icon { font-size: 16px; }
.group-title { font-size: 13px; font-weight: 700; color: #1d2129; flex: 1; }
.group-count { font-size: 11px; color: #86909c; background: #e8eaed; padding: 2px 7px; border-radius: 10px; }

.group-items {
  padding: 12px 16px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 0;
}

.group-item {
  width: 50%;
  font-size: 12px;
  color: #4e5969;
  padding: 2px 0;
}
.item-check { color: #00b42a; margin-right: 4px; }

/* ── Why ─────────────────────────────────────────────────── */
.why-section {
  padding: 60px 24px;
  background: #1a2332;
}

.why-section .section-tag {
  color: #fa8c16;
  background: rgba(250,140,22,0.15);
}

.why-section .section-title { color: #fff; }
.why-section .section-sub { color: rgba(255,255,255,0.5); }

.why-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
  max-width: 1100px;
  margin: 0 auto;
}

.why-card {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 14px;
  padding: 24px;
  transition: background 0.2s;
}
.why-card:hover { background: rgba(255,255,255,0.08); }

.why-icon { font-size: 28px; margin-bottom: 12px; }
.why-title { font-size: 15px; font-weight: 700; color: #fff; margin-bottom: 7px; }
.why-desc { font-size: 13px; color: rgba(255,255,255,0.5); line-height: 1.6; }

/* ── Contact ─────────────────────────────────────────────── */
.contact-section {
  padding: 80px 24px;
}

.contact-inner {
  max-width: 900px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 48px;
  align-items: start;
}

@media (max-width: 640px) {
  .contact-inner { grid-template-columns: 1fr; }
}

.contact-tag {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: #fa8c16;
  background: #fff7e6;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 16px;
}

.contact-title {
  font-size: clamp(24px, 3vw, 32px);
  font-weight: 800;
  color: #1d2129;
  margin: 0 0 12px;
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.contact-sub {
  font-size: 14px;
  color: #86909c;
  line-height: 1.6;
  margin: 0 0 28px;
}

.contact-steps { display: flex; flex-direction: column; gap: 14px; }
.step { display: flex; align-items: flex-start; gap: 12px; }
.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fa8c16;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}
.step-text { font-size: 14px; color: #4e5969; line-height: 1.5; }

.contact-card {
  background: #f7f8fa;
  border: 1.5px solid #e8eaed;
  border-radius: 16px;
  padding: 28px;
}
.contact-card-title { font-size: 16px; font-weight: 700; color: #1d2129; margin-bottom: 20px; }

.contact-items { display: flex; flex-direction: column; gap: 16px; margin-bottom: 20px; }
.contact-item { display: flex; align-items: flex-start; gap: 12px; }
.ci-icon { font-size: 20px; flex-shrink: 0; }
.ci-label { font-size: 11px; color: #86909c; margin-bottom: 2px; }
.ci-value { font-size: 14px; font-weight: 600; color: #1d2129; }

.contact-note {
  background: #fff7e6;
  border: 1px solid #ffe58f;
  border-radius: 8px;
  padding: 12px 14px;
  font-size: 12px;
  color: #874d00;
  line-height: 1.6;
}

/* ── Footer ──────────────────────────────────────────────── */
.pricing-footer {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: #c9cdd4;
  border-top: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.footer-dot { color: #e8eaed; }
</style>
