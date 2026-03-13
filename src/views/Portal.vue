<template>
  <div class="portal-page">
    <!-- Nav -->
    <nav class="glass-nav">
      <div class="nav-logo">
        <div class="nav-logo-icon">
          <svg width="34" height="34" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#nbg1)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="nbg1" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="nav-logo-text">数字游牧</span>
      </div>
      <div class="nav-links">
      </div>
      <button class="nav-btn" @click="logout">退出登录</button>
    </nav>

    <!-- Hero — 精简为一行标题 -->
    <div class="hero-compact">
      <span class="hero-badge">
        <span class="hero-badge-dot"></span>
        <span>数字游牧 · 全球化业务管理平台</span>
      </span>
      <span class="hero-compact-title">选择您的<span class="hero-title-blue"> 工作空间</span></span>
    </div>

    <!-- Module Cards — 2 main + 1 coming -->
    <div class="cards-grid">

      <!-- ERP -->
      <div class="portal-card" @click="go('/dashboard')">
        <div class="card-bg-icon">
          <svg width="400" height="400" viewBox="0 0 48 48" fill="none" opacity="1">
            <rect x="4" y="4" width="18" height="18" rx="3" fill="currentColor"/>
            <rect x="26" y="4" width="18" height="18" rx="3" fill="currentColor"/>
            <rect x="4" y="26" width="18" height="18" rx="3" fill="currentColor"/>
            <rect x="26" y="26" width="18" height="18" rx="3" fill="currentColor"/>
          </svg>
        </div>
        <div class="card-icon card-icon-dark">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <rect x="4" y="4" width="18" height="18" rx="3" fill="white" opacity="0.9"/>
            <rect x="26" y="4" width="18" height="18" rx="3" fill="white" opacity="0.6"/>
            <rect x="4" y="26" width="18" height="18" rx="3" fill="white" opacity="0.6"/>
            <rect x="26" y="26" width="18" height="18" rx="3" fill="white" opacity="0.3"/>
          </svg>
        </div>
        <h2 class="card-title">游牧 ERP 系统</h2>
        <p class="card-desc">全球化业务管理中枢。实时监控库存、销售与财务，掌控全局。</p>
        <div class="card-tags">
          <span class="tag">销售</span>
          <span class="tag">采购</span>
          <span class="tag">仓库</span>
          <span class="tag">财务</span>
          <span class="tag">人事</span>
        </div>
        <div class="card-arrow">
          <span>管理中心</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- 智能体工作流 -->
      <div class="portal-card portal-card-blue" @click="go('/agent')">
        <div class="card-bg-icon card-bg-blue">
          <svg width="400" height="400" viewBox="0 0 24 24" fill="none" opacity="1">
            <circle cx="12" cy="8" r="5" fill="currentColor"/>
            <path d="M3 21c0-5 4-9 9-9s9 4 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <div class="card-icon card-icon-blue">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="18" r="10" fill="white" opacity="0.9"/>
            <path d="M10 42c0-7.7 6.3-14 14-14s14 6.3 14 14" stroke="white" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
            <circle cx="36" cy="36" r="6" fill="white" opacity="0.8"/>
            <path d="M33 36h6M36 33v6" stroke="#0071e3" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </div>
        <h2 class="card-title">智能体工作流</h2>
        <p class="card-desc">AI 驱动的内容自动化系统。热搜抓取、文案生成、海报制作到多平台一键发布。</p>
        <div class="card-tags">
          <span class="tag tag-blue">热搜抓取</span>
          <span class="tag tag-blue">文案生成</span>
          <span class="tag tag-blue">自动发布</span>
        </div>
        <div class="card-arrow">
          <span>立即进入</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

      <!-- Coming soon -->
      <div class="portal-card portal-card-dim">
        <div class="card-icon card-icon-dim">
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="18" stroke="currentColor" stroke-width="3" opacity="0.4"/>
            <path d="M24 16v8l5 5" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" opacity="0.4"/>
          </svg>
        </div>
        <h2 class="card-title" style="opacity:0.3">即将推出</h2>
        <p class="card-desc" style="opacity:0.2">更多功能模块敬请期待，BI数据大屏、供应链协同门户正在开发中。</p>
        <div class="card-arrow" style="opacity:0.15">
          <span>敬请期待</span>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </div>
      </div>

    </div>

    <!-- Platform Description (moved from hero) -->
    <section class="platform-desc">
      <div class="platform-desc-inner">
        <div class="hero-badge" style="justify-content:center;margin-bottom:20px">
          <span class="hero-badge-dot"></span>
          <span>下一代数字资产自动化引擎</span>
        </div>
        <p class="hero-subtitle" style="text-align:center;max-width:700px;margin:0 auto">
          融合 AI 智能体与全球化 ERP 架构，让您的业务在云端自由流动。从自动化的库存预测到智能化的广告创意生成，每一个决策都由最先进的神经网络驱动。
        </p>
      </div>
    </section>

    <!-- Neural Section -->
    <section class="neural-section">
      <div class="neural-glow"></div>
      <div class="neural-content">
        <div class="neural-left">
          <div class="neural-badge">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0071e3" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2"/>
            </svg>
            <span>AI Neural Engine v2.0</span>
          </div>
          <h2 class="neural-title">由 Claude AI<br />驱动的神经中枢</h2>
          <p class="neural-desc">融合 AI 智能体与全球化 ERP 架构，从自动化的库存预测到智能化的广告创意生成，每一个决策都由最先进的神经网络驱动。</p>
          <div class="neural-stats">
            <div class="stat"><div class="stat-num">99.9%</div><div class="stat-label">UPTIME</div></div>
            <div class="stat"><div class="stat-num">12ms</div><div class="stat-label">LATENCY</div></div>
            <div class="stat"><div class="stat-num">24/7</div><div class="stat-label">AI SUPPORT</div></div>
          </div>
        </div>
        <div class="neural-grid">
          <div class="neural-card"><div class="neural-card-icon">🌐</div><div class="neural-card-title">全球同步</div><div class="neural-card-desc">实时数据同步</div></div>
          <div class="neural-card"><div class="neural-card-icon">⚡</div><div class="neural-card-title">极速响应</div><div class="neural-card-desc">毫秒级执行</div></div>
          <div class="neural-card"><div class="neural-card-icon">🔒</div><div class="neural-card-title">端到端加密</div><div class="neural-card-desc">最高安全等级</div></div>
          <div class="neural-card"><div class="neural-card-icon">📊</div><div class="neural-card-title">实时监控</div><div class="neural-card-desc">业务全景视图</div></div>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="portal-footer">
      <div class="footer-logo">
        <div class="nav-logo-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#nbg2)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="nbg2" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span>数字游牧</span>
      </div>
      <p class="footer-sub">DESIGNED BY NOMAD LABS · GLOBAL CITIZEN PLATFORM</p>
      <p class="footer-copy">© 2026 数字游牧. All rights reserved.</p>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

function go(path: string) {
  router.push(path)
}

function logout() {
  auth.logout()
  router.push('/login')
}
</script>

<style scoped>
* { box-sizing: border-box; }

.portal-page {
  min-height: 100vh;
  background: #ffffff;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  color: #1d1d1f;
  overflow-x: hidden;
}

/* ── Nav ── */
.glass-nav {
  position: sticky;
  top: 0;
  z-index: 50;
  height: 64px;
  background: rgba(255,255,255,0.72);
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
  border-bottom: 1px solid rgba(0,0,0,0.05);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 48px;
}

.nav-logo { display: flex; align-items: center; gap: 10px; cursor: pointer; }

.nav-logo-icon {
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s cubic-bezier(0.23,1,0.32,1);
}
.nav-logo-icon:hover { transform: scale(1.12) rotate(3deg); }

.nav-logo-text { font-size: 18px; font-weight: 800; letter-spacing: -0.04em; color: #1d1d1f; }

.nav-links { display: flex; gap: 40px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.16em; color: rgba(29,29,31,0.3); }
.nav-links span { cursor: pointer; transition: color 0.2s; }
.nav-links span:hover { color: #0071e3; }

.nav-btn {
  padding: 10px 24px;
  background: #0071e3;
  color: white;
  border: none;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  box-shadow: 0 6px 20px rgba(0,113,227,0.25);
  transition: all 0.2s cubic-bezier(0.23,1,0.32,1);
}
.nav-btn:hover { background: rgba(0,113,227,0.88); transform: scale(0.97); }

/* ── Hero Compact ── */
.hero-compact {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  padding: 28px 48px 20px;
  flex-wrap: wrap;
}

.hero-compact-title {
  font-size: 24px;
  font-weight: 800;
  color: #1d1d1f;
  letter-spacing: -0.03em;
  white-space: nowrap;
}

/* ── Hero ── */
.hero {
  padding: 100px 48px 72px;
  text-align: center;
  max-width: 1000px;
  margin: 0 auto;
  animation: fade-up-in 1.2s cubic-bezier(0.23,1,0.32,1) both;
}

@keyframes fade-up-in {
  from { opacity: 0; transform: translateY(40px); }
  to   { opacity: 1; transform: translateY(0); }
}

.hero-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 18px;
  background: #f5f5f7;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.06);
  margin-bottom: 40px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(29,29,31,0.5);
}

.hero-badge-dot {
  width: 6px;
  height: 6px;
  background: #0071e3;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }

.hero-title {
  font-size: clamp(56px, 10vw, 108px);
  font-weight: 900;
  letter-spacing: -0.05em;
  line-height: 0.88;
  margin: 0 0 36px;
  color: #1d1d1f;
}

.hero-title-blue { color: #0071e3; }

.hero-subtitle {
  font-size: clamp(17px, 2vw, 22px);
  color: rgba(29,29,31,0.42);
  font-weight: 500;
  line-height: 1.7;
  margin: 0;
  letter-spacing: -0.01em;
}

/* ── Cards ── */
.cards-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto 112px;
  padding: 0 48px;
}

.portal-card {
  position: relative;
  background: #f5f5f7;
  border: 1px solid rgba(0,0,0,0.05);
  border-radius: 40px;
  padding: 56px 48px;
  cursor: pointer;
  overflow: hidden;
  transition: transform 1s cubic-bezier(0.23,1,0.32,1), box-shadow 1s cubic-bezier(0.23,1,0.32,1);
  display: flex;
  flex-direction: column;
}

.portal-card:hover {
  transform: translateY(-14px) scale(1.02);
  box-shadow: 0 60px 100px rgba(0,0,0,0.09);
}

.portal-card-blue { background: #ffffff; }

.portal-card-dim { cursor: default; }
.portal-card-dim:hover { transform: none; box-shadow: none; }

.card-bg-icon {
  position: absolute;
  top: -80px;
  right: -80px;
  color: #1d1d1f;
  opacity: 0.02;
  pointer-events: none;
  transition: opacity 1s cubic-bezier(0.23,1,0.32,1);
}
.card-bg-blue { color: #0071e3; }
.portal-card:hover .card-bg-icon { opacity: 0.06; }

.card-icon {
  width: 84px;
  height: 84px;
  border-radius: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 36px;
  transition: transform 0.6s cubic-bezier(0.23,1,0.32,1);
  flex-shrink: 0;
}
.portal-card:hover .card-icon { transform: rotate(-6deg) scale(1.08); }

.card-icon-dark { background: #1d1d1f; box-shadow: 0 16px 40px rgba(0,0,0,0.22); }
.card-icon-blue  { background: #0071e3; box-shadow: 0 16px 40px rgba(0,113,227,0.3); }
.card-icon-dim   { background: rgba(29,29,31,0.06); color: rgba(29,29,31,0.25); }

.card-title {
  font-size: clamp(24px, 2.8vw, 34px);
  font-weight: 800;
  letter-spacing: -0.04em;
  color: #1d1d1f;
  margin: 0 0 16px;
  line-height: 1.05;
}

.card-desc {
  font-size: 15px;
  color: rgba(29,29,31,0.42);
  line-height: 1.7;
  margin: 0 0 24px;
  font-weight: 500;
  flex: 1;
}

.card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 32px;
}

.tag {
  padding: 5px 13px;
  background: rgba(0,0,0,0.06);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  color: rgba(29,29,31,0.45);
  letter-spacing: 0.02em;
}

.tag-blue {
  background: rgba(0,113,227,0.08);
  color: #0071e3;
}

.card-arrow {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 700;
  color: rgba(29,29,31,0.3);
  transition: gap 0.4s cubic-bezier(0.23,1,0.32,1), color 0.3s;
  letter-spacing: -0.01em;
}
.portal-card-blue .card-arrow { color: #1d1d1f; }
.portal-card:hover:not(.portal-card-dim) .card-arrow { gap: 18px; color: #1d1d1f; }
.portal-card-blue:hover .card-arrow { color: #0071e3; }

/* ── Platform Description ── */
.platform-desc {
  padding: 56px 48px;
  text-align: center;
  background: #f5f5f7;
  border-top: 1px solid rgba(0,0,0,0.04);
}
.platform-desc-inner {
  max-width: 800px;
  margin: 0 auto;
}

/* ── Neural ── */
.neural-section {
  background: #1d1d1f;
  color: white;
  padding: 120px 48px;
  position: relative;
  overflow: hidden;
}

.neural-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 900px;
  height: 900px;
  background: radial-gradient(circle, rgba(0,113,227,0.14) 0%, transparent 70%);
  pointer-events: none;
}

.neural-content {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 100px;
  align-items: center;
  position: relative;
  z-index: 1;
}

.neural-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 16px;
  background: rgba(255,255,255,0.07);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 999px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255,255,255,0.35);
  margin-bottom: 32px;
}

.neural-title {
  font-size: clamp(40px, 5.5vw, 68px);
  font-weight: 800;
  letter-spacing: -0.04em;
  line-height: 1.0;
  margin: 0 0 28px;
}

.neural-desc {
  font-size: 17px;
  color: rgba(255,255,255,0.35);
  line-height: 1.8;
  font-weight: 500;
  margin: 0 0 56px;
  max-width: 480px;
}

.neural-stats { display: flex; gap: 56px; }
.stat-num { font-size: 40px; font-weight: 800; letter-spacing: -0.04em; margin-bottom: 6px; }
.stat-label { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(255,255,255,0.18); }

.neural-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.neural-card { padding: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 28px; transition: background 0.3s, transform 0.3s cubic-bezier(0.23,1,0.32,1); cursor: default; }
.neural-card:hover { background: rgba(255,255,255,0.09); transform: translateY(-4px); }
.neural-card-icon { font-size: 26px; margin-bottom: 16px; }
.neural-card-title { font-size: 17px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 8px; }
.neural-card-desc { font-size: 13px; color: rgba(255,255,255,0.28); font-weight: 500; }

/* ── Footer ── */
.portal-footer {
  padding: 72px 48px;
  text-align: center;
  border-top: 1px solid rgba(0,0,0,0.06);
  background: #f5f5f7;
}

.footer-logo {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 16px;
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.04em;
}

.footer-sub { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(29,29,31,0.16); margin: 0 0 8px; }
.footer-copy { font-size: 11px; color: rgba(29,29,31,0.1); margin: 0; }

/* ── Responsive ── */
.hide-sm { display: inline; }

@media (max-width: 1024px) {
  .cards-grid { grid-template-columns: 1fr 1fr; }
  .portal-card-dim { grid-column: span 2; }
}

@media (max-width: 768px) {
  .glass-nav { padding: 0 20px; }
  .nav-links { display: none; }
  .hero { padding: 64px 24px 48px; }
  .hero-title { font-size: 52px; line-height: 0.92; }
  .cards-grid { grid-template-columns: 1fr; padding: 0 20px; gap: 16px; }
  .portal-card { padding: 40px 32px; border-radius: 32px; }
  .portal-card-dim { grid-column: auto; }
  .neural-content { grid-template-columns: 1fr; gap: 56px; }
  .neural-section { padding: 72px 24px; }
  .portal-footer { padding: 48px 24px; }
  .hide-sm { display: none; }
}
</style>
