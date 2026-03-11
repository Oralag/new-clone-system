<template>
  <div class="brand-page">

    <!-- ── 收起态（已保存）── -->
    <template v-if="isCollapsed">
    <div class="brand-saved-bar">
      <div class="saved-bar-left">
        <div class="saved-avatar">{{ brand.name.charAt(0) }}</div>
        <div class="saved-info">
          <span class="saved-name">{{ brand.name }}</span>
          <span class="saved-meta">{{ brand.industry }}{{ brand.subIndustry ? ' · ' + brand.subIndustry : '' }}{{ brand.slogan ? ' · ' + brand.slogan : '' }}</span>
        </div>
      </div>
      <button class="btn-edit" @click="isCollapsed = false">编辑</button>
    </div>

    <!-- ── 一键工作流（收起态时显示）── -->
    <div v-if="isCollapsed && !autoFlow.running" class="autoflow-card">
      <div class="autoflow-header">
        <div class="autoflow-title-wrap">
          <div class="autoflow-icon">⚡</div>
          <div>
            <div class="autoflow-title">AI 自动完成工作流</div>
            <div class="autoflow-sub">为「{{ brand.name }}」一键抓取热搜、生成文案并准备发布</div>
          </div>
        </div>
      </div>
      <div class="autoflow-options">
        <div class="opt-group">
          <div class="opt-label">发布平台</div>
          <div class="opt-tags">
            <span v-for="p in afPlatforms" :key="p.key" class="opt-tag"
              :class="{ active: autoFlow.platforms.includes(p.key) }"
              @click="toggleAfPlatform(p.key)">{{ p.name }}</span>
          </div>
        </div>
        <div class="opt-group">
          <div class="opt-label">生成数量</div>
          <div class="opt-tags">
            <span v-for="n in [1, 3, 5]" :key="n" class="opt-tag"
              :class="{ active: autoFlow.count === n }"
              @click="autoFlow.count = n">{{ n }} 条</span>
          </div>
        </div>
        <div class="opt-group">
          <div class="opt-label">内容类型</div>
          <div class="opt-tags">
            <span v-for="t in contentTypes" :key="t.key" class="opt-tag"
              :class="{ active: autoFlow.contentType === t.key }"
              @click="autoFlow.contentType = t.key">{{ t.name }}</span>
          </div>
        </div>
        <div class="opt-group">
          <div class="opt-label">执行步骤</div>
          <div class="flow-steps-preview">
            <div v-for="(s, i) in afSteps" :key="i" class="flow-step-chip">
              <div class="flow-step-num">{{ i + 1 }}</div>
              <div class="flow-step-name">{{ s }}</div>
              <svg v-if="i < afSteps.length - 1" width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M10 5l3 3-3 3" stroke="#c4b5fd" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
      <button class="btn-autoflow" @click="startAutoFlow">一键启动</button>
      <div v-if="agentStore.flowResults.length > 0" class="autoflow-prev-row">
        <span class="prev-hint">上次已生成 {{ agentStore.flowResults.length }} 条内容</span>
        <button class="btn-view-result" @click="router.push('/agent/publish')">查看结果</button>
      </div>
    </div>

    <!-- ── 执行中（大面板）── -->
    <div v-if="isCollapsed && autoFlow.running" class="flow-panel">
      <div class="flow-panel-header">
        <div class="flow-panel-title">
          <span class="flow-pulse"></span>
          正在执行 AI 工作流
        </div>
        <div class="flow-panel-header-right">
          <div class="flow-panel-brand">{{ brand.name }}</div>
          <button v-if="autoFlow.step < afSteps.length" class="btn-cancel-flow" @click="cancelFlow">取消</button>
        </div>
      </div>

      <div class="flow-panel-steps">
        <div v-for="(step, i) in afSteps" :key="i" class="flow-panel-step"
          :class="{ done: i < autoFlow.step, active: i === autoFlow.step, pending: i > autoFlow.step }">
          <!-- 左侧轨道 -->
          <div class="fps-track">
            <div class="fps-dot">
              <svg v-if="i < autoFlow.step" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2.5 7l3.5 3.5 5.5-6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <span v-else-if="i === autoFlow.step" class="fps-spinner"></span>
              <span v-else class="fps-num">{{ i + 1 }}</span>
            </div>
            <div v-if="i < afSteps.length - 1" class="fps-line"></div>
          </div>
          <!-- 右侧内容 -->
          <div class="fps-content">
            <div class="fps-title">{{ step }}</div>
            <div v-if="i <= autoFlow.step && autoFlowLog[i]" class="fps-log">{{ autoFlowLog[i] }}</div>
            <div v-if="i === autoFlow.step && !autoFlowLog[i]" class="fps-log fps-log-loading">
              <span class="loading-dots"><span></span><span></span><span></span></span>
            </div>
          </div>
        </div>
      </div>

      <div v-if="autoFlow.step >= afSteps.length" class="flow-panel-done">
        <div class="done-icon">✓</div>
        <div class="done-title">工作流完成！内容已就绪</div>
        <div class="done-btns">
          <button class="btn-goto" @click="router.push('/agent/publish')">前往发布管理</button>
          <button class="btn-secondary" @click="autoFlow.running = false">关闭</button>
        </div>
      </div>
    </div>
    </template><!-- end collapsed -->

    <!-- ── 编辑态 ── -->
    <template v-else>
    <div class="page-header">
      <div>
        <h2 class="page-title">🏢 品牌 & 行业设置</h2>
        <p class="page-desc">填写后，AI 将根据你的品牌和行业自动定制内容策略</p>
      </div>
      <button class="btn-save" :class="{ saved }" @click="handleSave">
        {{ saved ? '✓ 已保存' : '💾 保存设置' }}
      </button>
    </div>

    <!-- 完成度 -->
    <div class="progress-bar-wrap">
      <div class="progress-label">资料完整度</div>
      <div class="progress-track">
        <div class="progress-fill" :style="{ width: completeness + '%' }"></div>
      </div>
      <div class="progress-pct" :class="completeness >= 80 ? 'good' : ''">{{ completeness }}%</div>
    </div>

    <div class="form-grid">

      <!-- ── 左列 ── -->
      <div class="form-col">

        <!-- 公司基本信息 -->
        <div class="section-card">
          <div class="section-title">📋 公司基本信息</div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">公司 / 品牌名称 <span class="required">*</span></label>
              <input v-model="brand.name" class="field-input" placeholder="例：游牧乳业" />
            </div>
            <div class="field">
              <AiFieldHelper
                label="品牌口号 / Slogan"
                :context="sloganContext"
                placeholder="例：来自草原的纯粹"
                v-model="brand.slogan"
              />
            </div>
          </div>

          <AiFieldHelper
            label="公司简介"
            type="textarea"
            :rows="3"
            :context="introContext"
            placeholder="简单介绍公司背景、核心产品、品牌故事..."
            v-model="brand.intro"
          />

          <div class="field-row">
            <div class="field">
              <label class="field-label">成立年份</label>
              <input v-model="brand.foundYear" class="field-input" placeholder="例：2015" type="number" />
            </div>
            <div class="field">
              <label class="field-label">公司规模</label>
              <select v-model="brand.scale" class="field-select">
                <option value="">请选择</option>
                <option>1-10人（个人/微型）</option>
                <option>10-50人（小型）</option>
                <option>50-200人（中型）</option>
                <option>200人以上（大型）</option>
              </select>
            </div>
          </div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">主要销售区域</label>
              <input v-model="brand.region" class="field-input" placeholder="例：华北、全国、出口" />
            </div>
            <div class="field">
              <label class="field-label">价格定位</label>
              <div class="price-options">
                <span v-for="p in priceLevelOptions" :key="p" class="price-tag"
                  :class="{ active: brand.priceLevel === p }" @click="brand.priceLevel = p">{{ p }}</span>
              </div>
              <input v-model="brand.priceLevel" class="field-input" style="margin-top:6px" placeholder="或自定义输入，例：中高端、高性价比..." />
            </div>
          </div>
        </div>

        <!-- 行业 & 产品 -->
        <div class="section-card">
          <div class="section-title">🏭 行业 & 产品分类</div>

          <div class="field">
            <label class="field-label">所属行业 <span class="required">*</span></label>
            <div class="industry-grid">
              <div v-for="ind in industries" :key="ind.key" class="industry-card"
                :class="{ active: brand.industry === ind.key }" @click="selectIndustry(ind.key)">
                <span class="ind-icon">{{ ind.icon }}</span>
                <span class="ind-name">{{ ind.name }}</span>
              </div>
            </div>
          </div>

          <div v-if="currentSubs.length > 0" class="field">
            <label class="field-label">细分领域 <span class="required">*</span></label>
            <div class="sub-tags">
              <span v-for="sub in currentSubs" :key="sub" class="sub-tag"
                :class="{ active: brand.subIndustry === sub }" @click="brand.subIndustry = sub">{{ sub }}</span>
            </div>
            <input v-model="brand.subIndustry" class="field-input" style="margin-top:8px" placeholder="或手动填写细分领域..." />
          </div>

          <div class="field">
            <label class="field-label">核心产品 / 服务</label>
            <div class="product-tags">
              <span v-for="(p, i) in brand.products" :key="i" class="product-chip">
                {{ p }}<span class="chip-del" @click="brand.products.splice(i, 1)">×</span>
              </span>
            </div>
            <div class="tag-input-row">
              <input v-model="newProduct" class="tag-input" placeholder="输入产品名，回车添加..." @keydown.enter="addProduct" />
              <button class="btn-add" @click="addProduct">添加</button>
              <button class="btn-ai-inline" :class="{ loading: aiLoading.products }" @click="aiSuggestProducts">
                {{ aiLoading.products ? '⏳' : '✨ AI 推荐' }}
              </button>
            </div>
          </div>

          <AiFieldHelper
            label="产品核心卖点（每行一个）"
            type="textarea"
            :rows="3"
            :context="sellingPointsContext"
            placeholder="例：&#10;草原纯天然原料&#10;零添加防腐剂&#10;传统工艺发酵48小时"
            v-model="brand.sellingPoints"
          />
        </div>

        <!-- 竞品参考 -->
        <div class="section-card">
          <div class="section-title">🔍 竞品 & 对标品牌</div>
          <div class="field">
            <label class="field-label">主要竞品品牌</label>
            <div class="product-tags">
              <span v-for="(c, i) in brand.competitors" :key="i" class="product-chip chip-red">
                {{ c }}<span class="chip-del" @click="brand.competitors.splice(i, 1)">×</span>
              </span>
            </div>
            <div class="tag-input-row">
              <input v-model="newCompetitor" class="tag-input" placeholder="输入竞品品牌名..." @keydown.enter="addCompetitor" />
              <button class="btn-add" @click="addCompetitor">添加</button>
              <button class="btn-ai-inline" :class="{ loading: aiLoading.competitors }" @click="aiSuggestCompetitors">
                {{ aiLoading.competitors ? '⏳' : '✨ AI 推荐' }}
              </button>
            </div>
          </div>
          <AiFieldHelper
            label="对标学习的账号（抖音/小红书/快手）"
            type="textarea"
            :rows="2"
            :context="referenceContext"
            placeholder="例：@伊利官方抖音、@蒙牛乳业，用于学习内容风格"
            v-model="brand.referenceAccounts"
          />
        </div>
      </div>

      <!-- ── 右列 ── -->
      <div class="form-col">

        <!-- 目标受众 -->
        <div class="section-card">
          <div class="section-title">👥 目标受众画像</div>

          <div class="field-row">
            <div class="field">
              <label class="field-label">主要年龄段</label>
              <div class="age-options">
                <span v-for="age in ageGroups" :key="age" class="age-tag"
                  :class="{ active: brand.targetAge.includes(age) }" @click="toggleAge(age)">{{ age }}</span>
              </div>
            </div>
            <div class="field">
              <label class="field-label">主要性别</label>
              <div class="gender-options">
                <span v-for="g in genders" :key="g" class="age-tag"
                  :class="{ active: brand.targetGender === g }" @click="brand.targetGender = g">{{ g }}</span>
              </div>
            </div>
          </div>

          <AiFieldHelper
            label="用户画像描述"
            type="textarea"
            :rows="3"
            :context="audienceDescContext"
            placeholder="例：25-40岁宝妈群体，注重食品安全，有一定消费能力，关注孩子健康饮食..."
            v-model="brand.audienceDesc"
          />

          <AiFieldHelper
            label="用户痛点 / 关心的问题"
            type="textarea"
            :rows="2"
            :context="audiencePainContext"
            placeholder="例：担心添加剂、希望了解原料产地、想找性价比高的优质乳品..."
            v-model="brand.audiencePain"
          />
        </div>

        <!-- 品牌调性 -->
        <div class="section-card">
          <div class="section-title">🎨 品牌调性 & 内容风格</div>

          <div class="field">
            <div class="label-with-ai">
              <label class="field-label">品牌调性（可多选）</label>
              <button class="btn-ai-label" :class="{ loading: aiLoading.tones }" @click="aiSuggestTones">
                {{ aiLoading.tones ? '⏳ 分析中...' : '✨ AI 推荐调性' }}
              </button>
            </div>
            <div class="tone-tags">
              <span v-for="tone in toneOptions" :key="tone" class="tone-tag"
                :class="{ active: brand.tones.includes(tone) }" @click="toggleTone(tone)">{{ tone }}</span>
            </div>
          </div>

          <AiFieldHelper
            label="内容禁忌 / 不想出现的内容"
            type="textarea"
            :rows="2"
            :context="taboosContext"
            placeholder="例：不涉及政治敏感、不做价格对比、不提竞品名称..."
            v-model="brand.taboos"
          />

          <!-- 广告违禁词模块 -->
          <div class="field">
            <div class="label-with-ai">
              <label class="field-label">🚫 广告违禁词</label>
              <button class="btn-ai-label" :class="{ loading: aiLoading.adForbidden }" @click="aiSuggestAdForbidden">
                {{ aiLoading.adForbidden ? '⏳ AI抓取中...' : '✨ AI 自动抓取' }}
              </button>
            </div>
            <div class="field-hint" style="margin-bottom:8px">AI 根据行业自动识别广告法违禁词，生成内容时自动规避</div>
            <div class="product-tags" v-if="brand.adForbiddenWords.length">
              <span
                v-for="(w, i) in brand.adForbiddenWords"
                :key="i"
                class="product-chip chip-red"
              >{{ w }}<span class="chip-del" @click="brand.adForbiddenWords.splice(i, 1)">×</span></span>
            </div>
            <div v-else-if="!aiLoading.adForbidden" class="empty-hint">暂无违禁词，点击「AI 自动抓取」获取行业常见违禁词</div>
            <div v-if="aiLoading.adForbidden" class="forbidden-loading">
              <span class="loading-dot"></span><span class="loading-dot"></span><span class="loading-dot"></span>
              正在根据「{{ brand.subIndustry || brand.industry || '当前行业' }}」抓取违禁词...
            </div>
            <div class="tag-input-row" style="margin-top:8px">
              <input v-model="newForbiddenWord" class="tag-input" placeholder="手动添加违禁词..." @keydown.enter="addForbiddenWord" />
              <button class="btn-add" @click="addForbiddenWord">添加</button>
            </div>
          </div>

          <div class="field">
            <label class="field-label">品牌关键词（AI 生成内容时必带）</label>
            <div class="product-tags">
              <span v-for="(kw, i) in brand.keywords" :key="i" class="product-chip chip-purple">
                {{ kw }}<span class="chip-del" @click="brand.keywords.splice(i, 1)">×</span>
              </span>
            </div>
            <div class="tag-input-row">
              <input v-model="newKeyword" class="tag-input" placeholder="例：草原、纯天然、传统工艺..." @keydown.enter="addKeyword" />
              <button class="btn-add" @click="addKeyword">添加</button>
              <button class="btn-ai-inline" :class="{ loading: aiLoading.keywords }" @click="aiSuggestKeywords">
                {{ aiLoading.keywords ? '⏳' : '✨ AI 推荐' }}
              </button>
            </div>
          </div>
        </div>

        <!-- 内容策略 -->
        <div class="section-card">
          <div class="section-title">📱 内容发布策略</div>

          <div class="field">
            <label class="field-label">发布频率</label>
            <div class="freq-options">
              <span v-for="f in freqOptions" :key="f" class="age-tag"
                :class="{ active: brand.publishFreq === f }" @click="brand.publishFreq = f">{{ f }}</span>
            </div>
          </div>

          <div class="field">
            <label class="field-label">主攻平台（影响内容侧重）</label>
            <div class="platform-checks">
              <label v-for="p in platformOptions" :key="p.key" class="plat-label">
                <input type="checkbox" :checked="brand.mainPlatforms.includes(p.key)" @change="togglePlatform(p.key)" class="hidden-cb" />
                <div class="plat-box" :class="{ active: brand.mainPlatforms.includes(p.key) }">
                  {{ p.icon }} {{ p.name }}
                </div>
              </label>
            </div>
          </div>

          <div class="field">
            <div class="label-with-ai">
              <label class="field-label">热搜关键词过滤（只抓相关内容）</label>
              <button class="btn-ai-label" :class="{ loading: aiLoading.filters }" @click="aiSuggestFilters">
                {{ aiLoading.filters ? '⏳' : '✨ AI 推荐' }}
              </button>
            </div>
            <div class="product-tags">
              <span v-for="(kw, i) in brand.trendingFilters" :key="i" class="product-chip chip-orange">
                {{ kw }}<span class="chip-del" @click="brand.trendingFilters.splice(i, 1)">×</span>
              </span>
            </div>
            <div class="tag-input-row">
              <input v-model="newFilter" class="tag-input" placeholder="例：乳制品、奶粉、健康饮食..." @keydown.enter="addFilter" />
              <button class="btn-add" @click="addFilter">添加</button>
            </div>
            <div class="field-hint">💡 留空则抓取全部热搜，填写后只显示相关话题</div>
          </div>
        </div>

        <!-- AI 提示词预览 -->
        <div class="section-card preview-card">
          <div class="section-title">🤖 AI 提示词预览</div>
          <div class="prompt-preview">{{ generatedPrompt }}</div>
          <div class="prompt-hint">以上信息将自动注入到每次 AI 生成中</div>
        </div>

      </div>
    </div>

    <!-- AI 建议弹层 -->
    <Transition name="modal">
      <div v-if="aiModal.visible" class="ai-modal-mask" @click.self="closeModal">
        <div class="ai-modal">

          <!-- Header -->
          <div class="ai-modal-header">
            <div class="ai-modal-title">
              <div class="ai-modal-icon-wrap">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                  <path d="M8 1l1.8 3.6L14 5.6l-3 2.9.7 4.1L8 10.5l-3.7 2.1.7-4.1-3-2.9 4.2-.6z" fill="currentColor"/>
                </svg>
              </div>
              <span>AI 优化建议</span>
              <span class="ai-modal-label">{{ aiModal.label }}</span>
            </div>
            <button class="modal-close" @click="closeModal">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>

          <!-- Body -->
          <div class="ai-modal-body">
            <!-- 加载中 -->
            <div v-if="aiModal.loading" class="loading-area">
              <div class="ai-spinner"></div>
              <span>正在生成 {{ VARIANTS_COUNT }} 个方案...</span>
            </div>

            <!-- 方案列表 -->
            <div v-else-if="aiModal.variants.length > 0" class="variants-list">
              <div
                v-for="(v, i) in aiModal.variants"
                :key="i"
                class="variant-card"
                :class="{ active: aiModal.activeVariant === i }"
                @click="selectVariant(i)"
              >
                <div class="variant-card-top">
                  <span class="variant-index">方案 {{ i + 1 }}</span>
                  <button
                    class="btn-adopt-inline"
                    @click.stop="adoptVariant(i)"
                  >采纳</button>
                </div>
                <div class="variant-card-text">{{ v }}</div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div v-if="aiModal.variants.length > 0 && !aiModal.loading" class="ai-modal-footer">
            <div class="footer-edit-label">编辑后采纳</div>
            <textarea
              v-model="aiModal.editableResult"
              class="editable-result"
              rows="3"
            ></textarea>
            <div class="footer-btns">
              <button class="btn-regen" :disabled="aiModal.regenLoading" @click="regenerateVariants">
                <svg v-if="!aiModal.regenLoading" width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M11 6.5a4.5 4.5 0 11-1.3-3.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
                  <path d="M9.7 1v2.5H7.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                <div v-else class="btn-spinner"></div>
                {{ aiModal.regenLoading ? '生成中...' : '换一批' }}
              </button>
              <div class="footer-right-btns">
                <button class="btn-cancel" @click="closeModal">取消</button>
                <button class="btn-adopt" @click="adoptResult">采纳并填入</button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </template><!-- end v-else editing -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, defineComponent, h } from 'vue'
import { useRouter } from 'vue-router'
import { useBrandStore } from '@/stores/brand'
import { useTrendingStore } from '@/stores/agent'
import { ElMessage } from 'element-plus'

const router = useRouter()
const store = useBrandStore()
const brand = store.brand
const saved = ref(false)
const isCollapsed = ref(store.isConfigured)

// ── 一键工作流 ──
const afPlatforms = [
  { key: 'douyin', name: '抖音' },
  { key: 'xiaohongshu', name: '小红书' },
  { key: 'kuaishou', name: '快手' },
]
const afSteps = computed(() => {
  const typeLabel = { video: '生成视频脚本', poster: '生成图文内容', copy: '生成纯文案' }[autoFlow.contentType] || '生成内容'
  return ['抓取热搜', 'AI 分析选题', typeLabel, '进入发布']
})
const contentTypes = [
  { key: 'video', name: '视频脚本' },
  { key: 'poster', name: '图文' },
  { key: 'copy', name: '纯文案' },
]
const autoFlow = reactive({ platforms: ['douyin', 'xiaohongshu'] as string[], count: 3, running: false, step: 0, contentType: 'video' })
let flowCancelled = false

function cancelFlow() {
  flowCancelled = true
  autoFlow.running = false
  autoFlow.step = 0
  autoFlowLog.value = []
  ElMessage.info('已取消工作流')
}
function toggleAfPlatform(key: string) {
  const i = autoFlow.platforms.indexOf(key)
  if (i >= 0) { if (autoFlow.platforms.length > 1) autoFlow.platforms.splice(i, 1) }
  else autoFlow.platforms.push(key)
}
const agentStore = useTrendingStore()

// 工作流执行详情（每步的结果）
const autoFlowLog = ref<string[]>([])

async function callFlowAI(prompt: string): Promise<string> {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-erp-token': localStorage.getItem('erp_token') || '' },
    body: JSON.stringify({ messages: [{ role: 'user', content: prompt }], systemPrompt: store.systemPrompt }),
  })
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const contentType = response.headers.get('content-type') || ''
  let text = ''
  if (contentType.includes('text/event-stream')) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('无法读取响应')
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      for (const line of decoder.decode(value, { stream: true }).split('\n')) {
        if (!line.startsWith('data: ')) continue
        const d = line.slice(6).trim()
        if (d === '[DONE]') break
        try { const p = JSON.parse(d); if (p.text) text += p.text } catch {}
      }
    }
  } else {
    const r = await response.json()
    text = r.content?.find((b: any) => b.type === 'text')?.text || ''
  }
  return text.trim()
}

async function startAutoFlow() {
  autoFlow.running = true
  autoFlow.step = 0
  autoFlowLog.value = []
  flowCancelled = false

  try {
    // 步骤1：抓取热搜
    autoFlowLog.value[0] = '正在抓取热搜数据...'
    for (const platform of autoFlow.platforms) {
      await agentStore.fetchTrending(platform)
    }
    if (flowCancelled) return
    const allItems = autoFlow.platforms.flatMap(p => (agentStore.trending as any)[p] || [])
    autoFlowLog.value[0] = `已抓取 ${allItems.length} 条热搜话题`
    autoFlow.step = 1

    // 步骤2：AI 分析选题
    autoFlowLog.value[1] = 'AI 正在分析与品牌相关的话题...'
    const topicList = allItems.slice(0, 20).map((t: any) => t.title).join('\n')
    const productInfo = brand.products?.length ? `核心产品：${brand.products.join('、')}` : ''
    const sellingInfo = brand.sellingPoints ? `产品卖点：${brand.sellingPoints}` : ''
    const selected = await callFlowAI(
      `以下是当前热搜话题列表：\n${topicList}\n\n品牌信息：\n品牌名：${brand.name}\n行业：${brand.industry} / ${brand.subIndustry}\n${productInfo}\n${sellingInfo}\n\n任务：从热搜中选出与该品牌产品最相关、最适合借势创作内容的 ${Math.min(autoFlow.count, 3)} 个话题。如果热搜中没有直接相关的，可以选关联度最高的话题并在括号内注明借势角度（如：话题名称（角度：联系到产品xxx））。只输出话题名称（含括号补充），每行一个，不要序号。`
    )
    if (flowCancelled) return
    const selectedTopics = selected.split('\n').map(s => s.trim()).filter(Boolean).slice(0, autoFlow.count)
    agentStore.setSelectedTopics(selectedTopics)
    autoFlowLog.value[1] = `已选出 ${selectedTopics.length} 个话题：${selectedTopics.join('、')}`
    autoFlow.step = 2

    // 步骤3：按 contentType 生成内容
    const platNames: Record<string, string> = { douyin: '抖音', xiaohongshu: '小红书', kuaishou: '快手' }
    const flowItems: any[] = []
    autoFlowLog.value[2] = '正在生成内容...'

    for (const pKey of autoFlow.platforms) {
      const pName = platNames[pKey] || pKey
      for (const topic of selectedTopics) {
        if (flowCancelled) return

        if (autoFlow.contentType === 'video') {
          const script = await callFlowAI(
            `请为话题「${topic}」创作一个适合${pName}的短视频脚本，格式：\n场景描述：xxx\n旁白/配音：xxx\n字幕：xxx\n时长建议：15-30秒\n符合品牌「${brand.name}」（${brand.industry}）调性，直接输出脚本内容。`
          )
          flowItems.push({ platform: pKey, platformName: pName, topic, type: 'video_script', content: script })

        } else if (autoFlow.contentType === 'poster') {
          const raw = await callFlowAI(
            `请为话题「${topic}」创作一篇${pName}图文帖子，严格按 JSON 输出：\n{"title":"标题(带emoji,25字内)","body":"正文(排版美观,500字内)","tags":["标签1","标签2","标签3","标签4"]}\n符合品牌「${brand.name}」调性，只输出JSON，不要其他内容。`
          )
          flowItems.push({ platform: pKey, platformName: pName, topic, type: 'poster', content: raw })

        } else {
          // 纯文案
          const copy = await callFlowAI(
            `请为话题「${topic}」创作一条${pName}平台的爆款文案，符合品牌「${brand.name}」（${brand.industry}）调性，结合品牌产品自然植入，直接输出文案正文。`
          )
          flowItems.push({ platform: pKey, platformName: pName, topic, type: 'copy', content: copy })
        }
      }
    }

    agentStore.setFlowResults(flowItems)
    if (flowCancelled) return
    const firstVideo = flowItems.find(i => i.type === 'video_script')
    const firstPoster = flowItems.find(i => i.type === 'poster')
    if (firstVideo) agentStore.setVideoScript({ topic: firstVideo.topic, content: firstVideo.content, platform: firstVideo.platform })
    if (firstPoster) agentStore.setPublishContent({ script: firstPoster.content, topic: firstPoster.topic, type: 'poster' })

    const typeLabel = { video: '视频脚本', poster: '图文', copy: '纯文案' }[autoFlow.contentType] || '内容'
    autoFlowLog.value[2] = `已生成 ${flowItems.length} 条${typeLabel}`
    autoFlow.step = 3

    // 步骤4：进入发布
    autoFlowLog.value[3] = '所有内容就绪，可前往发布'
    autoFlow.step = 4

  } catch (e: any) {
    ElMessage.error('工作流执行失败：' + e.message)
    autoFlow.running = false
  }
}

const newProduct = ref('')
const newCompetitor = ref('')
const newKeyword = ref('')
const newFilter = ref('')
const newForbiddenWord = ref('')

// ── AI Modal State ─────────────────────────────────────
const VARIANTS_COUNT = 3

const aiModal = ref({
  visible: false,
  label: '',
  loading: false,
  regenLoading: false,
  typing: false,
  variants: [] as string[],
  activeVariant: 0,
  displayText: '',
  editableResult: '',
  targetField: '' as keyof typeof brand,
})

const aiLoading = ref({
  products: false,
  competitors: false,
  keywords: false,
  tones: false,
  filters: false,
  adForbidden: false,
})

// ── AI Helper Component ────────────────────────────────
// Inline component: label + input/textarea + ✨ AI button
const AiFieldHelper = defineComponent({
  props: {
    modelValue: String,
    label: String,
    type: { type: String, default: 'input' },
    rows: { type: Number, default: 3 },
    placeholder: String,
    context: Object as () => { field: string; prompt: string },
  },
  emits: ['update:modelValue'],
  setup(props, { emit }) {
    const loading = ref(false)
    const onInput = (e: Event) => emit('update:modelValue', (e.target as HTMLInputElement).value)
    const triggerAi = () => openAiModal(props.label!, props.context!.field as any, props.context!.prompt, loading)
    return () => h('div', { class: 'field' }, [
      h('div', { class: 'label-with-ai' }, [
        h('label', { class: 'field-label' }, props.label),
        h('button', {
          class: ['btn-ai-label', { loading: loading.value }],
          onClick: triggerAi,
        }, loading.value ? '⏳ 优化中...' : '✨ AI 优化'),
      ]),
      props.type === 'textarea'
        ? h('textarea', {
            value: props.modelValue,
            rows: props.rows,
            placeholder: props.placeholder,
            class: 'field-textarea',
            onInput,
          })
        : h('input', {
            value: props.modelValue,
            placeholder: props.placeholder,
            class: 'field-input',
            onInput,
          }),
    ])
  },
})

// ── Context builders ──────────────────────────────────
const baseContext = computed(() => {
  const parts = []
  if (brand.name) parts.push(`品牌名：${brand.name}`)
  if (brand.industry) parts.push(`行业：${brand.industry}`)
  if (brand.subIndustry) parts.push(`细分：${brand.subIndustry}`)
  if (brand.products.length) parts.push(`产品：${brand.products.join('、')}`)
  return parts.join('，')
})

const sloganContext = computed(() => ({
  field: 'slogan',
  prompt: `请为以下品牌创作一句简洁有力的品牌口号（10-20字）：${baseContext.value}`,
}))
const introContext = computed(() => ({
  field: 'intro',
  prompt: `请为以下品牌写一段100字左右的公司简介，突出品牌故事和核心优势：${baseContext.value}`,
}))
const sellingPointsContext = computed(() => ({
  field: 'sellingPoints',
  prompt: `请为以下品牌提炼3-5个核心产品卖点（每行一条）：${baseContext.value}${brand.intro ? '，简介：' + brand.intro : ''}`,
}))
const referenceContext = computed(() => ({
  field: 'referenceAccounts',
  prompt: `请推荐3-5个适合「${brand.subIndustry || brand.industry || '该行业'}」品牌学习的社交媒体账号，说明其内容风格特点`,
}))
const audienceDescContext = computed(() => ({
  field: 'audienceDesc',
  prompt: `请为以下品牌描述目标用户画像（年龄、职业、消费习惯、兴趣偏好等，100字左右）：${baseContext.value}，价格定位：${brand.priceLevel || '中端'}`,
}))
const audiencePainContext = computed(() => ({
  field: 'audiencePain',
  prompt: `请列出「${brand.subIndustry || brand.industry || '该行业'}」目标用户的主要痛点和关心问题（3-5条）`,
}))
const taboosContext = computed(() => ({
  field: 'taboos',
  prompt: `请列出「${brand.subIndustry || brand.industry || '该行业'}」品牌在社交媒体内容中应该注意的禁忌和风险点（3-5条）`,
}))

// ── Open modal & generate variants ───────────────────────────
function openAiModal(
  label: string,
  field: keyof typeof brand,
  _prompt: string,
  loadingRef?: { value: boolean }
) {
  if (loadingRef) loadingRef.value = true
  aiModal.value = {
    visible: true, label, loading: true, regenLoading: false,
    typing: false, variants: [], activeVariant: 0,
    displayText: '', editableResult: '', targetField: field,
  }
  generateVariants(field).then(() => {
    if (loadingRef) loadingRef.value = false
  })
}

// ── Real AI call helper ───────────────────────────────
async function callAI(prompt: string): Promise<string> {
  const response = await fetch('/api/ai-chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [{ role: 'user', content: prompt }],
      systemPrompt: '你是一位专业的品牌策划和内容营销顾问，擅长为各行业品牌提供精准、有创意的文案和策略建议。回复简洁专业，中文。',
    }),
  })
  if (!response.ok) throw new Error(`AI 请求失败 (${response.status})`)
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/event-stream')) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder()
    if (!reader) throw new Error('无法读取响应流')
    let text = ''
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      const chunk = decoder.decode(value, { stream: true })
      for (const line of chunk.split('\n')) {
        if (!line.startsWith('data: ')) continue
        const data = line.slice(6).trim()
        if (data === '[DONE]') break
        try {
          const parsed = JSON.parse(data)
          if (parsed.error) throw new Error(parsed.error)
          if (parsed.text) text += parsed.text
        } catch {}
      }
    }
    return text
  } else {
    const result = await response.json()
    if (result.error) throw new Error(result.error.message || JSON.stringify(result.error))
    const textBlock = result.content?.find((b: any) => b.type === 'text')
    return textBlock?.text ?? result.content?.[0]?.text ?? ''
  }
}

// Build brand context string for AI prompts
function buildBrandContext(): string {
  const parts: string[] = []
  if (brand.name) parts.push(`品牌名：${brand.name}`)
  if (brand.industry) parts.push(`行业：${brand.industry}`)
  if (brand.subIndustry) parts.push(`细分领域：${brand.subIndustry}`)
  if (brand.priceLevel) parts.push(`价格定位：${brand.priceLevel}`)
  if (brand.targetAge.length) parts.push(`目标年龄：${brand.targetAge.join('/')}`)
  if (brand.targetGender) parts.push(`目标性别：${brand.targetGender}`)
  if (brand.products.length) parts.push(`核心产品：${brand.products.join('、')}`)
  if (brand.sellingPoints) parts.push(`卖点：${brand.sellingPoints}`)
  if (brand.intro) parts.push(`简介：${brand.intro}`)
  if (brand.slogan) parts.push(`口号：${brand.slogan}`)
  if (brand.tones.length) parts.push(`内容调性：${brand.tones.join('、')}`)
  return parts.join('；')
}

// Prompts for each field
function getFieldPrompt(field: keyof typeof brand): string {
  const ctx = buildBrandContext()
  const rule = `严格要求：直接输出内容，不要任何前言、说明或总结。必须且只能用"【方案1】""【方案2】""【方案3】"作为分隔标记，每个标记单独一行，标记后紧跟对应方案内容。`
  const prompts: Partial<Record<keyof typeof brand, string>> = {
    slogan: `${rule}\n请为以下品牌创作3个不同风格的品牌口号/Slogan（每个10-20字，风格各异）。\n品牌信息：${ctx}`,
    intro: `${rule}\n请为以下品牌撰写3个不同版本的公司简介（每个80-120字，角度不同：一个突出历史底蕴、一个突出产品优势、一个突出用户价值）。\n品牌信息：${ctx}`,
    sellingPoints: `${rule}\n请为以下品牌提炼3组不同侧重的核心产品卖点（每组4-5条，用换行分隔，侧重角度不同：如品质、情感、功能）。\n品牌信息：${ctx}`,
    referenceAccounts: `${rule}\n请为以下品牌推荐3组适合在抖音/小红书/快手学习的对标账号（每组4个账号，附带学习理由），各组账号类型不同（如大品牌、新锐品牌、KOL）。\n品牌信息：${ctx}`,
    audienceDesc: `${rule}\n请为以下品牌描述3个不同维度的目标用户画像（每个80-100字，维度不同：如核心用户/潜在用户/高价值用户）。\n品牌信息：${ctx}`,
    audiencePain: `${rule}\n请为以下品牌总结3组目标用户的主要痛点和关心问题（每组4-5条，角度不同：如情感痛点、功能痛点、信任痛点）。\n品牌信息：${ctx}`,
    taboos: `${rule}\n请为以下品牌列举3组社交媒体内容创作的禁忌和注意事项（每组4-5条，维度不同：如合规风险、品牌形象、平台规则）。\n品牌信息：${ctx}`,
  }
  return prompts[field] || `${rule}\n请根据以下品牌信息，提供3个不同方案的建议。\n品牌信息：${ctx}`
}

// Parse "【方案X】..." or "方案X：..." format into array of 3 variants
function parseVariants(text: string): string[] {
  const blockParts = text.split(/【方案\d+】/)
  if (blockParts.length >= 3) {
    return blockParts.slice(1).map(s => s.trim()).filter(Boolean).slice(0, VARIANTS_COUNT)
  }
  const lineParts = text.split(/方案\d+[：:]\s*/)
  if (lineParts.length >= 3) {
    return lineParts.slice(1).map(s => s.trim()).filter(Boolean).slice(0, VARIANTS_COUNT)
  }
  return [text]
}

// Generate VARIANTS_COUNT different options via real AI
async function generateVariants(field: keyof typeof brand) {
  aiModal.value.loading = true
  aiModal.value.variants = []

  try {
    const prompt = getFieldPrompt(field)
    const raw = await callAI(prompt)
    console.log('[parseVariants] raw:', JSON.stringify(raw))
    const variants = parseVariants(raw)
    console.log('[parseVariants] result:', variants)
    aiModal.value.variants = variants
    aiModal.value.activeVariant = 0
    typeVariant(0)
  } catch (e: any) {
    ElMessage.error('AI 生成失败：' + e.message)
    aiModal.value.variants = ['AI 生成失败，请检查 ANTHROPIC_API_KEY 配置后重试。']
    aiModal.value.activeVariant = 0
    typeVariant(0)
  } finally {
    aiModal.value.loading = false
  }
}

// Animate typing for a chosen variant
let typingTimer: ReturnType<typeof setInterval> | null = null
function typeVariant(idx: number) {
  if (typingTimer) clearInterval(typingTimer)
  const text = aiModal.value.variants[idx]
  aiModal.value.typing = true
  aiModal.value.displayText = ''
  aiModal.value.editableResult = text
  let i = 0
  typingTimer = setInterval(() => {
    if (i < text.length) {
      aiModal.value.displayText += text[i]
      i++
    } else {
      if (typingTimer) clearInterval(typingTimer)
      aiModal.value.typing = false
    }
  }, 14)
}

function selectVariant(idx: number) {
  if (aiModal.value.activeVariant === idx) return
  aiModal.value.activeVariant = idx
  aiModal.value.editableResult = aiModal.value.variants[idx]
  typeVariant(idx)
}

async function regenerateVariants() {
  aiModal.value.regenLoading = true
  await generateVariants(aiModal.value.targetField)
  aiModal.value.regenLoading = false
}

function closeModal() {
  if (typingTimer) clearInterval(typingTimer)
  aiModal.value.visible = false
}

function adoptResult() {
  const field = aiModal.value.targetField
  const val = aiModal.value.editableResult
  if (field && val) {
    ;(brand as any)[field] = val
    ElMessage.success('已采纳 AI 建议')
  }
  closeModal()
}

// ── AI tag suggestions (inline, no modal) ─────────────
async function aiSuggestProducts() {
  aiLoading.value.products = true
  try {
    const ctx = buildBrandContext()
    const raw = await callAI(`请为以下品牌推荐5-8个核心产品名称（仅列出产品名，每行一个，不要序号和解释）：\n${ctx}`)
    const suggestions = raw.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
    suggestions.forEach(s => { if (!brand.products.includes(s)) brand.products.push(s) })
    ElMessage.success(`已添加 ${suggestions.length} 个 AI 推荐产品`)
  } catch (e: any) {
    ElMessage.error('AI 推荐失败：' + e.message)
  } finally {
    aiLoading.value.products = false
  }
}

async function aiSuggestCompetitors() {
  aiLoading.value.competitors = true
  try {
    const ctx = buildBrandContext()
    const raw = await callAI(`请为以下品牌推荐5个主要竞品品牌名称（仅列出品牌名，每行一个，不要序号和解释）：\n${ctx}`)
    const suggestions = raw.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
    suggestions.forEach(s => { if (!brand.competitors.includes(s)) brand.competitors.push(s) })
    ElMessage.success(`已添加 ${suggestions.length} 个 AI 推荐竞品`)
  } catch (e: any) {
    ElMessage.error('AI 推荐失败：' + e.message)
  } finally {
    aiLoading.value.competitors = false
  }
}

async function aiSuggestKeywords() {
  aiLoading.value.keywords = true
  try {
    const ctx = buildBrandContext()
    const raw = await callAI(`请为以下品牌推荐6-8个适合在社交媒体内容中使用的品牌关键词/标签（仅列出关键词，每行一个，简短精炼，不要序号和解释）：\n${ctx}`)
    const kws = raw.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
    kws.forEach(k => { if (!brand.keywords.includes(k)) brand.keywords.push(k) })
    ElMessage.success(`已添加 ${kws.length} 个 AI 推荐关键词`)
  } catch (e: any) {
    ElMessage.error('AI 推荐失败：' + e.message)
  } finally {
    aiLoading.value.keywords = false
  }
}

async function aiSuggestTones() {
  aiLoading.value.tones = true
  try {
    const ctx = buildBrandContext()
    const raw = await callAI(`请为以下品牌推荐3-4个最适合的内容调性（从这些选项中选：专业权威、温暖亲切、年轻活力、高端大气、接地气、幽默搞笑、情感共鸣、科普知识、故事叙述、简洁直接。仅列出名称，每行一个，不要解释）：\n${ctx}`)
    const recommended = raw.split('\n').map(s => s.trim()).filter(s => s && toneOptions.includes(s))
    recommended.forEach(t => { if (!brand.tones.includes(t)) brand.tones.push(t) })
    ElMessage.success(`AI 推荐调性：${recommended.join('、')}`)
  } catch (e: any) {
    ElMessage.error('AI 推荐失败：' + e.message)
  } finally {
    aiLoading.value.tones = false
  }
}

async function aiSuggestFilters() {
  aiLoading.value.filters = true
  try {
    const ctx = buildBrandContext()
    const raw = await callAI(`请为以下品牌推荐6-8个用于抖音/小红书热搜过滤的关键词（贴合行业和产品，每行一个，简短，不要序号和解释）：\n${ctx}`)
    const filters = raw.split('\n').map(s => s.trim()).filter(s => s && !s.startsWith('#'))
    filters.forEach(f => { if (!brand.trendingFilters.includes(f)) brand.trendingFilters.push(f) })
    ElMessage.success(`已添加 ${filters.length} 个 AI 推荐过滤词`)
  } catch (e: any) {
    ElMessage.error('AI 推荐失败：' + e.message)
  } finally {
    aiLoading.value.filters = false
  }
}

async function aiSuggestAdForbidden() {
  if (!brand.industry && !brand.subIndustry) {
    ElMessage.warning('请先选择行业，AI 才能准确抓取对应违禁词')
    return
  }
  aiLoading.value.adForbidden = true
  try {
    const industry = brand.subIndustry || brand.industry
    const industryName = industries.find(i => i.key === brand.industry)?.name || industry
    const raw = await callAI(`请列出「${industryName}${brand.subIndustry ? ' / ' + brand.subIndustry : ''}」行业在中国广告法和社交媒体平台规则下的常见广告违禁词（包括极限用语、医疗保健违规词、比较类禁用语、承诺保障类违规词等），每行一个词，只输出词本身，不要序号、分类标题或解释，共30-50个。`)
    const words = raw.split('\n').map(s => s.replace(/^[\d\.\-\s]+/, '').trim()).filter(s => s.length > 0 && s.length <= 15)
    const added = words.filter(w => !brand.adForbiddenWords.includes(w))
    added.forEach(w => brand.adForbiddenWords.push(w))
    ElMessage.success(`已抓取 ${added.length} 个「${industryName}」行业广告违禁词`)
  } catch (e: any) {
    ElMessage.error('AI 抓取失败：' + e.message)
  } finally {
    aiLoading.value.adForbidden = false
  }
}

function addForbiddenWord() {
  const v = newForbiddenWord.value.trim()
  if (v && !brand.adForbiddenWords.includes(v)) brand.adForbiddenWords.push(v)
  newForbiddenWord.value = ''
}

// ── Industries ────────────────────────────────────────
const industries = [
  { key: 'food', icon: '🍽', name: '食品饮料' },
  { key: 'beauty', icon: '💄', name: '美妆护肤' },
  { key: 'fashion', icon: '👗', name: '服装服饰' },
  { key: 'ecom', icon: '🛒', name: '电商零售' },
  { key: 'edu', icon: '📚', name: '教育培训' },
  { key: 'health', icon: '💊', name: '医疗健康' },
  { key: 'tech', icon: '💻', name: '科技数码' },
  { key: 'home', icon: '🏠', name: '家居家装' },
  { key: 'travel', icon: '✈️', name: '旅游出行' },
  { key: 'finance', icon: '💰', name: '金融理财' },
  { key: 'pet', icon: '🐾', name: '宠物' },
  { key: 'other', icon: '⚙️', name: '其他行业' },
]

const subIndustries: Record<string, string[]> = {
  food: ['乳制品 / 奶制品', '烘焙糕点', '休闲零食', '饮料果汁', '调味品 / 酱料', '粮油米面', '肉禽蛋类', '有机食品', '保健食品', '进口食品'],
  beauty: ['护肤品', '彩妆', '香水', '美发', '身体护理', '男士护理'],
  fashion: ['女装', '男装', '童装', '鞋履', '箱包', '运动服饰', '内衣睡衣'],
  ecom: ['综合电商', '直播带货', '跨境电商', '社区团购', '二手闲置'],
  edu: ['K12教育', '职业技能', '语言学习', '兴趣培训', '在线课程'],
  health: ['医疗器械', '中医养生', '健身运动', '心理健康', '营养保健'],
  tech: ['手机数码', '智能家居', '软件应用', 'AI产品', '游戏'],
  home: ['家具', '家电', '装修', '厨具', '收纳整理'],
  travel: ['景区旅游', '民宿酒店', '出境游', '自驾游', '户外露营'],
  finance: ['理财投资', '保险', '贷款', '加密货币', '股票基金'],
  pet: ['宠物食品', '宠物用品', '宠物医疗', '宠物服务'],
  other: [],
}

const currentSubs = computed(() => subIndustries[brand.industry] || [])
function selectIndustry(key: string) { brand.industry = key; brand.subIndustry = '' }

const ageGroups = ['00后', '95后', '90后', '85后', '80后', '70后', '中老年']
const genders = ['不限', '偏女性', '偏男性', '均衡']
function toggleAge(age: string) {
  const i = brand.targetAge.indexOf(age)
  i > -1 ? brand.targetAge.splice(i, 1) : brand.targetAge.push(age)
}

const toneOptions = ['专业权威', '温暖亲切', '年轻活力', '高端大气', '接地气', '幽默搞笑', '情感共鸣', '科普知识', '故事叙述', '简洁直接']
const priceLevelOptions = ['亲民大众', '中端品质', '中高端', '高端精品', '奢侈顶级']
function toggleTone(tone: string) {
  const i = brand.tones.indexOf(tone)
  i > -1 ? brand.tones.splice(i, 1) : brand.tones.push(tone)
}

const freqOptions = ['每天1条', '每天2-3条', '每周3-5条', '每周1-2条']
const platformOptions = [
  { key: 'douyin', name: '抖音', icon: '🎵' },
  { key: 'xiaohongshu', name: '小红书', icon: '📕' },
  { key: 'kuaishou', name: '快手', icon: '⚡' },
]
function togglePlatform(key: string) {
  const i = brand.mainPlatforms.indexOf(key)
  i > -1 ? brand.mainPlatforms.splice(i, 1) : brand.mainPlatforms.push(key)
}

function addProduct() { const v = newProduct.value.trim(); if (v && !brand.products.includes(v)) brand.products.push(v); newProduct.value = '' }
function addCompetitor() { const v = newCompetitor.value.trim(); if (v && !brand.competitors.includes(v)) brand.competitors.push(v); newCompetitor.value = '' }
function addKeyword() { const v = newKeyword.value.trim(); if (v && !brand.keywords.includes(v)) brand.keywords.push(v); newKeyword.value = '' }
function addFilter() { const v = newFilter.value.trim(); if (v && !brand.trendingFilters.includes(v)) brand.trendingFilters.push(v); newFilter.value = '' }

const completeness = computed(() => {
  let s = 0
  if (brand.name) s += 20; if (brand.industry) s += 15; if (brand.subIndustry) s += 10
  if (brand.products.length) s += 10; if (brand.sellingPoints) s += 10
  if (brand.targetAge.length) s += 10; if (brand.audienceDesc) s += 10
  if (brand.tones.length) s += 10; if (brand.mainPlatforms.length) s += 5
  return s
})

const generatedPrompt = computed(() => {
  const p: string[] = []
  if (brand.name) p.push(`品牌：${brand.name}`)
  if (brand.slogan) p.push(`口号：${brand.slogan}`)
  const iName = industries.find(i => i.key === brand.industry)?.name || ''
  if (iName) p.push(`行业：${iName}${brand.subIndustry ? ' / ' + brand.subIndustry : ''}`)
  if (brand.products.length) p.push(`核心产品：${brand.products.join('、')}`)
  if (brand.sellingPoints) p.push(`卖点：${brand.sellingPoints.split('\n').filter(Boolean).join('；')}`)
  if (brand.targetAge.length) p.push(`目标用户：${brand.targetAge.join('/')} ${brand.targetGender}`)
  if (brand.tones.length) p.push(`品牌调性：${brand.tones.join('、')}`)
  if (brand.keywords.length) p.push(`必含关键词：${brand.keywords.join('、')}`)
  if (brand.taboos) p.push(`禁忌：${brand.taboos}`)
  if (brand.adForbiddenWords.length) p.push(`广告违禁词：${brand.adForbiddenWords.join('、')}`)
  return p.length ? p.join('\n') : '请填写品牌信息后，AI 提示词将自动生成...'
})

function handleSave() {
  if (!brand.name?.trim()) {
    ElMessage.warning('请填写公司 / 品牌名称')
    return
  }
  if (!brand.industry?.trim()) {
    ElMessage.warning('请填写所属行业')
    return
  }
  if (!brand.subIndustry?.trim()) {
    ElMessage.warning('请选择细分领域')
    return
  }
  store.saveBrand()
  saved.value = true
  ElMessage.success('品牌设置已保存')
  setTimeout(() => {
    saved.value = false
    isCollapsed.value = true
  }, 1000)
}
</script>

<style scoped>
/* ── 执行大面板 ── */
.flow-panel {
  background: #fff;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px;
  padding: 28px 32px;
  margin-bottom: 20px;
}
.flow-panel-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 32px;
}
.flow-panel-header-right { display: flex; align-items: center; gap: 10px; }
.btn-cancel-flow {
  padding: 5px 14px; border-radius: 8px; border: 1.5px solid #fca5a5;
  background: #fff; color: #dc2626; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-cancel-flow:hover { background: #fef2f2; }
.flow-panel-title {
  display: flex; align-items: center; gap: 10px;
  font-size: 16px; font-weight: 700; color: #1a1a1a;
}
.flow-pulse {
  width: 10px; height: 10px; border-radius: 50%; background: #7c3aed;
  animation: fp-pulse 1.2s ease-in-out infinite;
}
@keyframes fp-pulse {
  0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 0 0 rgba(124,58,237,0.4); }
  50% { opacity: 0.8; transform: scale(1.1); box-shadow: 0 0 0 6px rgba(124,58,237,0); }
}
.flow-panel-brand {
  font-size: 12px; color: #7c3aed; background: #f5f3ff;
  padding: 4px 12px; border-radius: 20px; font-weight: 600;
}

.flow-panel-steps { display: flex; flex-direction: column; gap: 0; }
.flow-panel-step {
  display: flex; gap: 16px;
}
.fps-track {
  display: flex; flex-direction: column; align-items: center;
  width: 32px; flex-shrink: 0;
}
.fps-dot {
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; transition: all 0.3s; position: relative; z-index: 1;
}
.flow-panel-step.done .fps-dot { background: #7c3aed; }
.flow-panel-step.active .fps-dot { background: #ede9fe; border: 2px solid #7c3aed; }
.flow-panel-step.pending .fps-dot { background: #f1f5f9; border: 2px solid #e2e8f0; }
.fps-num { font-size: 12px; font-weight: 700; color: #94a3b8; }
.fps-spinner {
  width: 12px; height: 12px; border-radius: 50%;
  border: 2px solid #c4b5fd; border-top-color: #7c3aed;
  animation: fps-spin 0.8s linear infinite; display: inline-block;
}
@keyframes fps-spin { to { transform: rotate(360deg); } }

.fps-line {
  width: 2px; flex: 1; min-height: 20px; margin: 4px 0;
  background: #e2e8f0; transition: background 0.3s;
}
.flow-panel-step.done .fps-line { background: #7c3aed; }

.fps-content {
  padding-bottom: 28px; padding-top: 4px; flex: 1;
}
.flow-panel-step:last-child .fps-content { padding-bottom: 0; }
.fps-title {
  font-size: 14px; font-weight: 600; margin-bottom: 6px;
  transition: color 0.3s;
}
.flow-panel-step.done .fps-title { color: #7c3aed; }
.flow-panel-step.active .fps-title { color: #1a1a1a; }
.flow-panel-step.pending .fps-title { color: #94a3b8; }

.fps-log {
  font-size: 13px; color: #475569; background: #f8fafc;
  border-radius: 8px; padding: 10px 14px; line-height: 1.6;
  border-left: 3px solid #c4b5fd;
}
.flow-panel-step.done .fps-log { border-left-color: #7c3aed; color: #374151; }
.fps-log-loading { border-left-color: #e2e8f0; background: #f8fafc; }

.loading-dots { display: flex; gap: 4px; align-items: center; height: 16px; }
.loading-dots span {
  width: 6px; height: 6px; border-radius: 50%; background: #c4b5fd;
  animation: ld-bounce 1.2s ease-in-out infinite;
}
.loading-dots span:nth-child(2) { animation-delay: 0.2s; }
.loading-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes ld-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }

.flow-panel-done {
  margin-top: 24px; padding-top: 24px;
  border-top: 1px solid #f0f0f0;
  text-align: center;
}
.done-icon {
  width: 48px; height: 48px; border-radius: 50%;
  background: linear-gradient(135deg, #059669, #10b981);
  color: #fff; font-size: 20px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 12px;
}
.autoflow-card {
  background: linear-gradient(135deg, #faf5ff 0%, #eff6ff 100%);
  border: 1.5px solid #c4b5fd; border-radius: 16px;
  padding: 22px 24px; margin-bottom: 20px;
}
.autoflow-header { display: flex; align-items: center; margin-bottom: 18px; }
.autoflow-title-wrap { display: flex; align-items: center; gap: 12px; }
.autoflow-icon {
  width: 40px; height: 40px; border-radius: 12px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  display: flex; align-items: center; justify-content: center; font-size: 18px;
}
.autoflow-title { font-size: 15px; font-weight: 700; color: #1a1a1a; }
.autoflow-sub { font-size: 12px; color: #7c3aed; margin-top: 2px; }
.autoflow-options { display: flex; flex-direction: column; gap: 14px; margin-bottom: 20px; }
.opt-group { display: flex; align-items: center; gap: 12px; }
.opt-label { font-size: 12px; color: #64748b; font-weight: 600; width: 56px; flex-shrink: 0; }
.opt-tags { display: flex; gap: 8px; flex-wrap: wrap; }
.opt-tag {
  padding: 5px 14px; border-radius: 20px; font-size: 12px; font-weight: 500;
  border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; transition: all 0.15s;
}
.opt-tag.active { border-color: #7c3aed; background: #7c3aed; color: #fff; }
.opt-tag:hover:not(.active) { border-color: #c4b5fd; }
.flow-steps-preview { display: flex; align-items: center; gap: 4px; flex-wrap: wrap; }
.flow-step-chip { display: flex; align-items: center; gap: 6px; }
.flow-step-num {
  width: 22px; height: 22px; border-radius: 50%;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; font-size: 11px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.flow-step-name { font-size: 12px; color: #4c1d95; font-weight: 600; }
.btn-autoflow {
  width: 100%; padding: 12px; border-radius: 12px; border: none;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
  box-shadow: 0 4px 14px rgba(124,58,237,0.3); transition: all 0.2s;
}
.btn-autoflow:hover { opacity: 0.9; transform: translateY(-1px); }
.autoflow-prev-row {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 10px; padding: 10px 14px;
  background: #f0fdf4; border-radius: 10px; border: 1px solid #86efac;
}
.prev-hint { font-size: 12px; color: #16a34a; font-weight: 500; }
.btn-view-result {
  padding: 5px 14px; border-radius: 8px; border: 1.5px solid #16a34a;
  background: #fff; color: #16a34a; font-size: 12px; font-weight: 600; cursor: pointer;
}
.btn-view-result:hover { background: #f0fdf4; }
.autoflow-running {
  background: #fff; border: 1.5px solid #e2e8f0; border-radius: 16px;
  padding: 22px 24px; margin-bottom: 20px;
}
.running-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.running-title { font-size: 14px; font-weight: 600; color: #1a1a1a; }
.running-brand { font-size: 12px; color: #7c3aed; background: #f5f3ff; padding: 3px 10px; border-radius: 20px; }
.running-steps { display: flex; margin-bottom: 20px; }
.running-step { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 8px; position: relative; }
.running-step:not(:last-child)::after {
  content: ''; position: absolute; top: 14px; left: 50%; width: 100%;
  height: 2px; background: #e2e8f0; z-index: 0;
}
.running-step.done::after { background: #7c3aed; }
.rs-icon {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; z-index: 1; position: relative;
}
.running-step.done .rs-icon { background: #7c3aed; color: #fff; }
.running-step.active .rs-icon { background: #ede9fe; color: #7c3aed; border: 2px solid #7c3aed; }
.running-step.pending .rs-icon { background: #f1f5f9; color: #94a3b8; }
.rs-label { font-size: 11px; color: #64748b; text-align: center; }
.running-step.done .rs-label { color: #7c3aed; font-weight: 600; }
.running-step.active .rs-label { color: #1a1a1a; font-weight: 600; }
.rs-log { font-size: 11px; color: #64748b; text-align: center; margin-top: 2px; max-width: 120px; line-height: 1.4; }
@keyframes af-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
.spinner-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; background: #7c3aed; animation: af-pulse 1s infinite; }
.running-done { text-align: center; padding-top: 4px; }
.done-title { font-size: 15px; font-weight: 700; color: #16a34a; margin-bottom: 14px; }
.done-btns { display: flex; gap: 10px; justify-content: center; }
.btn-goto {
  padding: 8px 24px; border-radius: 10px; border: none;
  background: linear-gradient(135deg, #7c3aed, #4f46e5); color: #fff;
  font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-secondary {
  padding: 8px 20px; border-radius: 10px; border: 1.5px solid #e2e8f0;
  background: #fff; color: #64748b; font-size: 13px; font-weight: 500; cursor: pointer;
}

/* ── 收起态 ── */
.brand-saved-bar {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 18px; background: #f0fdf4; border: 1.5px solid #86efac;
  border-radius: 14px; margin-bottom: 20px;
}
.saved-bar-left { display: flex; align-items: center; gap: 12px; }
.saved-avatar {
  width: 38px; height: 38px; border-radius: 10px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; font-size: 16px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.saved-name { font-size: 15px; font-weight: 600; color: #1a1a1a; display: block; }
.saved-meta { font-size: 12px; color: #64748b; display: block; margin-top: 2px; }
.btn-edit {
  padding: 6px 16px; border-radius: 8px; border: 1.5px solid #7c3aed;
  background: #fff; color: #7c3aed; font-size: 13px; font-weight: 600; cursor: pointer;
}
.btn-edit:hover { background: #f5f3ff; }

/* ── 浅色主题变量 ── */
.brand-page {
  padding-bottom: 60px;
  max-width: 1100px;
  --c-bg: #ffffff;
  --c-bg-soft: #f5f4f1;
  --c-border: #e8e6e1;
  --c-text: #1a1a1a;
  --c-text-2: #555;
  --c-text-3: #999;
  --c-accent: #7c3aed;
  --c-accent-bg: rgba(124,58,237,0.08);
  --c-accent-border: rgba(124,58,237,0.3);
  --c-input-bg: #fafaf9;
}

.page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
.page-title { font-size: 22px; font-weight: 700; color: var(--c-text); margin: 0 0 4px; }
.page-desc { font-size: 13px; color: var(--c-text-3); margin: 0; }
.btn-save { padding: 9px 22px; border-radius: 10px; border: none; background: linear-gradient(135deg,#7c3aed,#4f46e5); color: #fff; font-size: 14px; cursor: pointer; font-weight: 600; transition: all 0.3s; box-shadow: 0 2px 8px rgba(124,58,237,0.25); }
.btn-save.saved { background: linear-gradient(135deg,#059669,#10b981); box-shadow: 0 2px 8px rgba(16,185,129,0.25); }
.btn-save:hover { opacity: 0.88; transform: translateY(-1px); }

.progress-bar-wrap { display: flex; align-items: center; gap: 12px; margin-bottom: 28px; }
.progress-label { font-size: 12px; color: var(--c-text-3); white-space: nowrap; font-weight: 500; }
.progress-track { flex: 1; height: 5px; background: #ebe9e4; border-radius: 3px; overflow: hidden; }
.progress-fill { height: 100%; background: linear-gradient(90deg,#7c3aed,#10b981); border-radius: 3px; transition: width 0.4s ease; }
.progress-pct { font-size: 13px; color: var(--c-text-3); font-weight: 600; min-width: 36px; }
.progress-pct.good { color: #059669; }

.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
@media (max-width: 900px) { .form-grid { grid-template-columns: 1fr; } }
.form-col { display: flex; flex-direction: column; gap: 16px; }

.section-card { background: var(--c-bg); border: 1px solid var(--c-border); border-radius: 14px; padding: 20px; box-shadow: 0 1px 4px rgba(0,0,0,0.04); }
.section-title { font-size: 11px; font-weight: 700; color: var(--c-text-3); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 16px; }

/* Label + AI button row */
.label-with-ai { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
.field-label { font-size: 12px; color: var(--c-text-2); font-weight: 500; display: block; }
.required { color: #dc2626; }

.btn-ai-label {
  padding: 3px 10px; border-radius: 12px; font-size: 11px; cursor: pointer;
  border: 1px solid var(--c-accent-border); background: var(--c-accent-bg);
  color: var(--c-accent); transition: all 0.2s; white-space: nowrap; flex-shrink: 0; font-weight: 500;
}
.btn-ai-label:hover { background: rgba(124,58,237,0.14); border-color: rgba(124,58,237,0.5); }
.btn-ai-label.loading { opacity: 0.55; cursor: not-allowed; }

.btn-ai-inline {
  padding: 7px 10px; border-radius: 8px; font-size: 11px; cursor: pointer;
  border: 1px solid var(--c-accent-border); background: var(--c-accent-bg);
  color: var(--c-accent); transition: all 0.2s; white-space: nowrap; font-weight: 500;
}
.btn-ai-inline:hover { background: rgba(124,58,237,0.14); }
.btn-ai-inline.loading { opacity: 0.55; cursor: not-allowed; }

/* field styles (shared with inline component) */
:deep(.field) { margin-bottom: 14px; }
:deep(.field:last-child) { margin-bottom: 0; }
.field { margin-bottom: 14px; }
.field:last-child { margin-bottom: 0; }
.field-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.field-input, .field-select {
  width: 100%; background: var(--c-input-bg); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 9px 12px; color: var(--c-text); font-size: 13px; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
}
.field-input:focus, .field-select:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
.field-input::placeholder { color: #bbb; }
.field-select { cursor: pointer; }
.field-select option { background: #fff; color: #1a1a1a; }
:deep(.field-input), :deep(.field-textarea) {
  width: 100%; background: var(--c-input-bg); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 9px 12px; color: var(--c-text); font-size: 13px; outline: none; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
}
:deep(.field-textarea) { resize: vertical; line-height: 1.6; }
:deep(.field-input:focus), :deep(.field-textarea:focus) { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
:deep(.field-input::placeholder), :deep(.field-textarea::placeholder) { color: #bbb; }
:deep(.field-label) { font-size: 12px; color: var(--c-text-2); font-weight: 500; display: block; }
:deep(.label-with-ai) { display: flex; justify-content: space-between; align-items: center; margin-bottom: 7px; }
:deep(.btn-ai-label) {
  padding: 3px 10px; border-radius: 12px; font-size: 11px; cursor: pointer;
  border: 1px solid var(--c-accent-border); background: var(--c-accent-bg); color: var(--c-accent); white-space: nowrap; font-weight: 500;
}
:deep(.btn-ai-label:hover) { background: rgba(124,58,237,0.14); }
:deep(.btn-ai-label.loading) { opacity: 0.55; cursor: not-allowed; }
.field-textarea {
  width: 100%; background: var(--c-input-bg); border: 1px solid var(--c-border);
  border-radius: 8px; padding: 9px 12px; color: var(--c-text); font-size: 13px; outline: none;
  resize: vertical; line-height: 1.6; box-sizing: border-box; transition: border-color 0.2s, box-shadow 0.2s;
}
.field-textarea:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); background: #fff; }
.field-textarea::placeholder { color: #bbb; }
.field-hint { font-size: 11px; color: var(--c-text-3); margin-top: 6px; }

.industry-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 8px; }
.industry-card { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 6px; border-radius: 10px; border: 1px solid var(--c-border); background: var(--c-bg-soft); cursor: pointer; transition: all 0.2s; text-align: center; }
.industry-card:hover { border-color: #c4b5fd; background: rgba(124,58,237,0.04); }
.industry-card.active { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.45); }
.ind-icon { font-size: 20px; }
.ind-name { font-size: 11px; color: var(--c-text-2); }
.industry-card.active .ind-name { color: var(--c-accent); font-weight: 600; }

.sub-tags { display: flex; flex-wrap: wrap; gap: 7px; }
.sub-tag { padding: 5px 12px; border-radius: 20px; font-size: 12px; cursor: pointer; border: 1px solid var(--c-border); background: var(--c-bg-soft); color: var(--c-text-2); transition: all 0.2s; }
.sub-tag:hover { border-color: #c4b5fd; color: var(--c-accent); background: rgba(124,58,237,0.04); }
.sub-tag.active { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.45); color: var(--c-accent); font-weight: 600; }

.product-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; min-height: 10px; }
.product-chip { display: flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 16px; font-size: 12px; background: #eff6ff; border: 1px solid #bfdbfe; color: #1d4ed8; }
.chip-red { background: #fef2f2; border-color: #fecaca; color: #dc2626; }
.chip-purple { background: rgba(124,58,237,0.08); border-color: rgba(124,58,237,0.25); color: var(--c-accent); }
.chip-orange { background: #fff7ed; border-color: #fed7aa; color: #c2410c; }
.chip-del { cursor: pointer; opacity: 0.5; margin-left: 2px; }
.chip-del:hover { opacity: 1; }

.empty-hint { font-size: 12px; color: #bbb; padding: 8px 0; font-style: italic; }
.forbidden-loading { display: flex; align-items: center; gap: 6px; font-size: 12px; color: #dc2626; padding: 8px 0; opacity: 0.7; }
.loading-dot { width: 5px; height: 5px; border-radius: 50%; background: #dc2626; animation: dot-bounce 1.2s infinite; }
.loading-dot:nth-child(2) { animation-delay: 0.2s; }
.loading-dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dot-bounce { 0%,60%,100% { transform: translateY(0); } 30% { transform: translateY(-4px); } }

.tag-input-row { display: flex; gap: 6px; }
.tag-input { flex: 1; background: var(--c-input-bg); border: 1px solid var(--c-border); border-radius: 8px; padding: 7px 11px; color: var(--c-text); font-size: 12px; outline: none; transition: border-color 0.2s; }
.tag-input:focus { border-color: var(--c-accent); box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.tag-input::placeholder { color: #bbb; }
.btn-add { padding: 7px 14px; border-radius: 8px; border: 1px solid var(--c-accent-border); background: var(--c-accent-bg); color: var(--c-accent); font-size: 12px; cursor: pointer; white-space: nowrap; font-weight: 500; transition: all 0.2s; }
.btn-add:hover { background: rgba(124,58,237,0.14); }

.age-options, .gender-options, .tone-tags, .freq-options { display: flex; flex-wrap: wrap; gap: 6px; }
.age-tag { padding: 5px 12px; border-radius: 16px; font-size: 12px; cursor: pointer; border: 1px solid var(--c-border); background: var(--c-bg-soft); color: var(--c-text-2); transition: all 0.2s; user-select: none; }
.age-tag:hover { border-color: #c4b5fd; color: var(--c-accent); }
.age-tag.active { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.45); color: var(--c-accent); font-weight: 600; }
.tone-tag { padding: 6px 13px; border-radius: 16px; font-size: 12px; cursor: pointer; border: 1px solid var(--c-border); background: var(--c-bg-soft); color: var(--c-text-2); transition: all 0.2s; user-select: none; }
.tone-tag:hover { border-color: #6ee7b7; color: #059669; }
.tone-tag.active { background: rgba(16,185,129,0.1); border-color: rgba(16,185,129,0.45); color: #059669; font-weight: 600; }

.price-options { display: flex; flex-wrap: wrap; gap: 6px; }
.price-tag { padding: 5px 12px; border-radius: 16px; font-size: 12px; cursor: pointer; border: 1px solid var(--c-border); background: var(--c-bg-soft); color: var(--c-text-2); transition: all 0.2s; user-select: none; }
.price-tag:hover { border-color: #c4b5fd; color: var(--c-accent); }
.price-tag.active { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.45); color: var(--c-accent); font-weight: 600; }

.platform-checks { display: flex; gap: 10px; flex-wrap: wrap; }
.plat-label { cursor: pointer; }
.hidden-cb { display: none; }
.plat-box { padding: 8px 16px; border-radius: 10px; border: 1px solid var(--c-border); background: var(--c-bg-soft); color: var(--c-text-2); font-size: 13px; transition: all 0.2s; user-select: none; }
.plat-box:hover { border-color: #c4b5fd; color: var(--c-accent); }
.plat-box.active { background: rgba(124,58,237,0.1); border-color: rgba(124,58,237,0.45); color: var(--c-accent); font-weight: 600; }

.preview-card { border-color: rgba(124,58,237,0.2); background: rgba(124,58,237,0.03); }
.prompt-preview { font-size: 12px; color: var(--c-text-2); line-height: 1.8; white-space: pre-wrap; background: var(--c-bg-soft); border: 1px solid var(--c-border); border-radius: 8px; padding: 12px 14px; min-height: 80px; font-family: monospace; }
.prompt-hint { font-size: 11px; color: var(--c-accent); opacity: 0.7; margin-top: 10px; }

/* ── AI Modal ─────────────────────────────────────────────────── */
.ai-modal-mask {
  position: fixed; inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(6px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 20px;
}
.ai-modal {
  background: #fff;
  border-radius: 16px;
  width: 540px; max-width: 100%;
  box-shadow: 0 32px 80px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0,0,0,0.06);
  display: flex; flex-direction: column;
  max-height: 88vh; overflow: hidden;
}

/* Header */
.ai-modal-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.ai-modal-title {
  display: flex; align-items: center; gap: 8px;
  font-size: 14px; font-weight: 600; color: #1a1a1a;
}
.ai-modal-icon-wrap {
  width: 26px; height: 26px; border-radius: 7px;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  display: flex; align-items: center; justify-content: center;
  color: #fff; flex-shrink: 0;
}
.ai-modal-label {
  font-size: 12px; font-weight: 500;
  color: #7c3aed;
  background: rgba(124, 58, 237, 0.08);
  padding: 2px 8px; border-radius: 20px;
}
.modal-close {
  width: 28px; height: 28px; border-radius: 7px;
  border: none; background: transparent; color: #bbb;
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: all 0.15s; flex-shrink: 0;
}
.modal-close:hover { background: #f5f5f5; color: #555; }

/* Body */
.ai-modal-body {
  flex: 1; overflow-y: auto; padding: 16px 20px;
  min-height: 80px;
}
.loading-area { display: flex; align-items: center; gap: 10px; color: #888; font-size: 13px; padding: 8px 0; }
.ai-spinner { width: 18px; height: 18px; border-radius: 50%; border: 2px solid rgba(124,58,237,0.2); border-top-color: #7c3aed; animation: spin 0.8s linear infinite; flex-shrink: 0; }
@keyframes spin { to { transform: rotate(360deg); } }

/* Variant cards */
.variants-list { display: flex; flex-direction: column; gap: 10px; }
.variant-card {
  border: 1.5px solid #eee;
  border-radius: 10px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.15s;
  background: #fafafa;
}
.variant-card:hover { border-color: #c4b5fd; background: #faf8ff; }
.variant-card.active { border-color: #7c3aed; background: #faf8ff; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
.variant-card-top {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 8px;
}
.variant-index {
  font-size: 11px; font-weight: 600; color: #7c3aed;
  background: rgba(124,58,237,0.1); padding: 2px 8px; border-radius: 20px;
}
.btn-adopt-inline {
  padding: 4px 12px; border-radius: 6px;
  border: 1px solid rgba(124,58,237,0.3);
  background: rgba(124,58,237,0.06); color: #7c3aed;
  font-size: 12px; font-weight: 500; cursor: pointer;
  transition: all 0.15s; white-space: nowrap;
}
.btn-adopt-inline:hover { background: #7c3aed; color: #fff; border-color: #7c3aed; }
.variant-card-text {
  font-size: 13px; color: #333; line-height: 1.75; white-space: pre-wrap;
}

/* Footer */
.ai-modal-footer {
  border-top: 1px solid #f0f0f0;
  padding: 14px 20px 18px;
  flex-shrink: 0;
  background: #fdfdfd;
}
.footer-edit-label { font-size: 11px; font-weight: 600; color: #bbb; text-transform: uppercase; letter-spacing: 0.6px; margin-bottom: 8px; }
.editable-result {
  width: 100%; background: #fff;
  border: 1.5px solid #e8e8e8;
  border-radius: 9px; padding: 10px 12px;
  color: #1a1a1a; font-size: 13px; line-height: 1.7;
  resize: vertical; outline: none; box-sizing: border-box;
  font-family: inherit; transition: border-color 0.2s;
}
.editable-result:focus { border-color: #7c3aed; box-shadow: 0 0 0 3px rgba(124,58,237,0.08); }
.footer-btns {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 12px; gap: 8px;
}
.footer-right-btns { display: flex; gap: 8px; }
.btn-regen {
  display: flex; align-items: center; gap: 5px;
  padding: 7px 14px; border-radius: 8px;
  border: 1.5px solid #e8e8e8; background: #fff;
  color: #666; font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.btn-regen:hover:not(:disabled) { border-color: #7c3aed; color: #7c3aed; }
.btn-regen:disabled { opacity: 0.5; cursor: not-allowed; }
.btn-spinner { width: 12px; height: 12px; border-radius: 50%; border: 1.5px solid rgba(124,58,237,0.3); border-top-color: #7c3aed; animation: spin 0.8s linear infinite; }
.btn-cancel {
  padding: 7px 16px; border-radius: 8px;
  border: 1.5px solid #e8e8e8; background: transparent;
  color: #888; font-size: 13px; cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel:hover { border-color: #bbb; color: #444; }
.btn-adopt {
  padding: 7px 20px; border-radius: 8px; border: none;
  background: linear-gradient(135deg, #7c3aed, #4f46e5);
  color: #fff; font-size: 13px; font-weight: 600;
  cursor: pointer; box-shadow: 0 2px 8px rgba(124,58,237,0.25);
  transition: opacity 0.15s;
}
.btn-adopt:hover { opacity: 0.88; }

/* Modal transition */
.modal-enter-active, .modal-leave-active { transition: all 0.22s cubic-bezier(0.4,0,0.2,1); }
.modal-enter-from, .modal-leave-to { opacity: 0; transform: scale(0.96) translateY(8px); }
</style>
