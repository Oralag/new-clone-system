<template>
  <div class="brand-products">
    <div class="bp-header">
      <div>
        <h2 class="bp-title">{{ isDeliveryView ? '门店外卖商品' : '所有产品' }}</h2>
        <p class="bp-sub">
          <template v-if="isDeliveryView">
            门店外卖商品池 · 共 {{ shopStore.products.length }} 款 · 在商品管理里用「门店外卖」开关增减
          </template>
          <template v-else>
            {{ shopStore.isWholesale ? '批发采购模式 · 选好产品后可批量下载资料' : '发现适合您的完美装备' }}
          </template>
        </p>
      </div>
      <!-- 外人访客：申请下载入口 -->
      <button
        v-if="shopStore.shopMode === null && !downloadUnlocked"
        class="bp-apply-btn"
        @click="applyDialogVisible = true"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        申请下载产品资料
      </button>
      <div class="bp-cats">
        <button
          v-for="cat in FIXED_CATS"
          :key="cat.tag"
          class="bp-cat-btn"
          :class="{ active: selectedTag === cat.tag }"
          @click="selectedTag = cat.tag"
        >{{ cat.label }}</button>
      </div>
      <!-- 批发商：卡片 / 价目表 切换 -->
      <div v-if="shopStore.isWholesale && !brandEdit.editMode" class="bp-view-switch">
        <button class="bp-view-btn" :class="{ active: viewMode === 'grid' }" @click="viewMode = 'grid'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          产品卡片
        </button>
        <button class="bp-view-btn" :class="{ active: viewMode === 'table' }" @click="viewMode = 'table'">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          拿货价目表
        </button>
      </div>
      <!-- 编辑模式提示 -->
      <div v-if="brandEdit.editMode" class="bp-edit-hint">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        拖拽卡片排序 · 点击 ✏️ 编辑商品展示信息
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="shopStore.loading" class="bp-loading">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" class="spinning"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
      <span>加载产品中...</span>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!shopStore.loading && shopStore.products.length === 0" class="bp-empty">
      暂无产品
    </div>

    <!-- 筛选无结果 -->
    <div v-else-if="!shopStore.loading && filteredProducts.length === 0" class="bp-empty">
      没有找到符合条件的产品
    </div>

    <!-- 采购商：已选清单 + 批量下载 -->
    <div v-if="shopStore.isWholesale && selectedIds.length > 0" class="bp-bulk-bar">
      <span class="bp-bulk-info">已选 {{ selectedIds.length }} 件产品</span>
      <button class="bp-bulk-download" :disabled="downloading" @click="downloadSelected">
        <svg v-if="!downloading" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" class="spinning"><path d="M21 12a9 9 0 11-6.219-8.56"/></svg>
        {{ downloading ? '打包中...' : '下载所选产品资料' }}
      </button>
      <button class="bp-bulk-clear" @click="selectedIds = []">清空选择</button>
    </div>

    <!-- 批发商：档位说明条 -->
    <div v-if="isWholesaleView" class="bp-tier-bar">
      <div
        v-for="(t, i) in barTiers"
        :key="t.key"
        class="bp-tier-chip"
        :class="{ active: activeTierIdx === i }"
        @click="activeTierIdx = i"
      >
        <span class="bp-tier-name">{{ t.name }}</span>
        <span class="bp-tier-meta">{{ t.profit }} · 起批 {{ t.threshold }}</span>
      </div>
    </div>

    <!-- 产品网格（编辑模式下支持拖拽） -->
    <div
      v-show="!isWholesaleView || viewMode === 'grid'"
      class="bp-grid"
      :class="{ 'bp-grid-ws': isWholesaleView }"
      @dragover.prevent
      @drop="onDrop"
    >
      <div
        v-for="product in filteredProducts"
        :key="product.id"
        class="bp-card"
        :class="{
          'bp-card-selected': selectedIds.includes(product.id),
          'bp-card-dragging': dragId === product.id,
          'bp-card-dragover': dragOverId === product.id,
        }"
        :draggable="brandEdit.editMode"
        @dragstart="onDragStart(product.id)"
        @dragend="onDragEnd"
        @dragenter.prevent="onDragEnter(product.id)"
        @click="!brandEdit.editMode && goDetail(product.id)"
      >
        <div class="bp-card-img-wrap">
          <img :src="product.image || 'https://picsum.photos/seed/placeholder/800/600'" :alt="product.name" class="bp-card-img" referrerpolicy="no-referrer" />
          <!-- 拖拽手柄（编辑模式） -->
          <div v-if="brandEdit.editMode" class="bp-drag-handle" title="拖拽排序">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </div>
          <!-- 编辑按钮（编辑模式） -->
          <button v-if="brandEdit.editMode" class="bp-edit-btn" @click.stop="openEdit(product)" title="编辑商品展示信息">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <!-- 采购商模式：勾选框 -->
          <div v-if="shopStore.isWholesale && !brandEdit.editMode" class="bp-select-check" @click.stop="toggleSelect(product.id)">
            <svg v-if="selectedIds.includes(product.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <!-- 标签角标 -->
          <div v-if="product.tags?.length" class="bp-tag-badge" :class="tagBadgeClass(product.tags)">
            {{ tagBadgeLabel(product.tags) }}
          </div>
        </div>
        <!-- 批发商卡片：只留 名称 / 拿货价 / 按钮，把画面让给主图 -->
        <div v-if="isWholesaleView" class="bp-card-body bp-card-body-ws">
          <div class="bp-ws-line">
            <h3 class="bp-card-name">{{ product.name }}</h3>
            <span v-if="product.spec" class="bp-ws-spec">{{ product.spec }}{{ product.unit ? '/' + product.unit : '' }}</span>
          </div>
          <div class="bp-ws-price-row">
            <span class="bp-ws-price">{{ fmt(tierPrice(product)) }}</span>
            <span class="bp-ws-retail">零售 {{ fmt(product.price) }}</span>
            <span v-if="schemeOf(product) !== 'agent'" class="bp-ws-tier-tag">{{ tierOf(product).short }}</span>
            <span v-else-if="product.minOrderQuantity > 1" class="bp-moq">起订 {{ product.minOrderQuantity }}</span>
          </div>
          <template v-if="!brandEdit.editMode">
            <div class="bp-btn-row">
              <button class="bp-add-btn" @click.stop="addToCart(product)">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
                加入采购单
              </button>
              <button class="bp-dl-btn" :disabled="downloading" @click.stop="downloadOne(product)" title="下载产品资料">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              </button>
            </div>
          </template>
        </div>

        <div v-else class="bp-card-body">
          <h3 class="bp-card-name">{{ product.name }}</h3>
          <p class="bp-card-desc">{{ product.description }}</p>
          <div class="bp-card-footer">
            <div class="bp-card-price">
              <span class="bp-price">¥{{ product.price }}</span>
            </div>
            <div class="bp-card-rating">
              <svg v-for="i in 5" :key="i" width="10" height="10" viewBox="0 0 24 24"
                :fill="i <= Math.round(product.rating) ? '#f59e0b' : 'none'"
                stroke="#f59e0b" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>{{ product.rating }}</span>
            </div>
          </div>
          <template v-if="!brandEdit.editMode">
            <button class="bp-add-btn" @click.stop="addToCart(product)">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 001.99 1.61H19.4a2 2 0 001.98-1.71l1.62-9.3H6"/></svg>
              加入购物车
            </button>
          </template>
        </div>
      </div>
    </div>

    <!-- 批发商：全部产品 × 拿货价对比表（两套规则分开列） -->
    <template v-if="isWholesaleView && viewMode === 'table'">
      <section v-if="agentRows.length" class="bp-table-wrap">
        <header class="bp-table-head">
          <h3>乳制品 · 食品</h3>
          <span>代理拿货价 · 可混批</span>
        </header>
        <div class="bp-table-scroll">
          <table class="bp-table">
            <thead>
              <tr>
                <th class="bp-th-goods">产品</th>
                <th class="bp-th-spec">规格</th>
                <th v-for="(t, i) in AGENT_TIERS" :key="t.key" class="bp-th-tier" :class="{ active: activeTierIdx === i }">
                  <span class="bp-th-tier-name">{{ t.name }}</span>
                  <span class="bp-th-tier-meta">{{ t.profit }}</span>
                </th>
                <th class="bp-th-retail">零售价</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in agentRows" :key="product.id" @click="goDetail(product.id)">
                <td class="bp-td-goods">
                  <img :src="product.image" :alt="product.name" class="bp-td-img" referrerpolicy="no-referrer" />
                  <span class="bp-td-name">{{ product.name }}</span>
                </td>
                <td class="bp-td-spec">{{ product.spec || '—' }}{{ product.unit ? ' / ' + product.unit : '' }}</td>
                <td v-for="(t, i) in AGENT_TIERS" :key="t.key" class="bp-td-tier" :class="{ active: activeTierIdx === i }">
                  {{ fmt(tierPrice(product, i)) }}
                </td>
                <td class="bp-td-retail">{{ fmt(product.price) }}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td class="bp-tf-label" colspan="2">起批门槛</td>
                <td v-for="(t, i) in AGENT_TIERS" :key="t.key" class="bp-tf-tier" :class="{ active: activeTierIdx === i }">{{ t.threshold }}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p class="bp-table-note">拿货价 = 零售价 × 档位系数（初级 70% / 二级 65% / 一级 60%），零售价调整后自动同步。单位：元</p>
      </section>

      <section v-if="craftRows.length" class="bp-table-wrap">
        <header class="bp-table-head">
          <h3>文创周边</h3>
          <span>按零售价累计满额打折</span>
        </header>
        <div class="bp-table-scroll">
          <table class="bp-table">
            <thead>
              <tr>
                <th class="bp-th-goods">产品</th>
                <th class="bp-th-spec">规格</th>
                <th v-for="(t, i) in CRAFT_TIERS" :key="t.key" class="bp-th-tier" :class="{ active: activeTierIdx === i }">
                  <span class="bp-th-tier-name">{{ t.name }}</span>
                  <span class="bp-th-tier-meta">{{ t.profit }}</span>
                </th>
                <th class="bp-th-retail">零售价</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in craftRows" :key="product.id" @click="goDetail(product.id)">
                <td class="bp-td-goods">
                  <img :src="product.image" :alt="product.name" class="bp-td-img" referrerpolicy="no-referrer" />
                  <span class="bp-td-name">{{ product.name }}</span>
                </td>
                <td class="bp-td-spec">{{ product.spec || '—' }}{{ product.unit ? ' / ' + product.unit : '' }}</td>
                <td v-for="(t, i) in CRAFT_TIERS" :key="t.key" class="bp-td-tier" :class="{ active: activeTierIdx === i }">
                  {{ fmt(tierPrice(product, i)) }}
                </td>
                <td class="bp-td-retail">{{ fmt(product.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="bp-table-note">文创周边按整单零售价累计算：满 ¥3,000 打 6 折，满 ¥10,000 打 5 折。单位：元</p>
      </section>

      <section v-if="fmcgRows.length" class="bp-table-wrap">
        <header class="bp-table-head">
          <h3>休闲快消</h3>
          <span>线下专供供货价</span>
        </header>
        <div class="bp-table-scroll">
          <table class="bp-table">
            <thead>
              <tr>
                <th class="bp-th-goods">产品</th>
                <th class="bp-th-spec">规格</th>
                <th v-for="(t, i) in FMCG_TIERS" :key="t.key" class="bp-th-tier" :class="{ active: activeTierIdx === i }">
                  <span class="bp-th-tier-name">{{ t.name }}</span>
                  <span class="bp-th-tier-meta">{{ t.threshold }} 起批</span>
                </th>
                <th class="bp-th-retail">建议零售价</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="product in fmcgRows" :key="product.id" @click="goDetail(product.id)">
                <td class="bp-td-goods">
                  <img :src="product.image" :alt="product.name" class="bp-td-img" referrerpolicy="no-referrer" />
                  <span class="bp-td-name">{{ product.name }}</span>
                </td>
                <td class="bp-td-spec">{{ product.spec || '—' }}{{ product.unit ? ' / ' + product.unit : '' }}</td>
                <td v-for="(t, i) in FMCG_TIERS" :key="t.key" class="bp-td-tier" :class="{ active: activeTierIdx === i }">
                  {{ fmt(tierPrice(product, i)) }}
                </td>
                <td class="bp-td-retail">{{ fmt(product.price) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="bp-table-note">休闲快消是固定供货价，不按零售价折算 —— 在编辑模式里逐个商品填「二级/一级供货价」，没填的显示「待定」。二级 ¥899 起批 / 一级 ¥3,800 起批。单位：元</p>
      </section>
    </template>

    <!-- 编辑弹框 -->
    <div v-if="editDialogVisible" class="bp-edit-overlay" @click.self="editDialogVisible = false">
      <div class="bp-edit-dialog">
        <div class="bp-edit-dialog-header">
          <h3>编辑商品展示信息</h3>
          <button class="bp-edit-close" @click="editDialogVisible = false">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="bp-edit-dialog-body">
          <p class="bp-edit-goods-name">{{ editForm.name }}</p>

          <div class="bp-edit-field">
            <label>商品描述</label>
            <textarea v-model="editForm.description" class="bp-edit-textarea" placeholder="展示给客户看的商品描述"></textarea>
          </div>

          <div class="bp-edit-field">
            <label>主图 URL</label>
            <div class="bp-edit-input-row"><input v-model="editForm.image" class="bp-edit-input" placeholder="https://... 或点击上传" /><button class="bp-upload-btn" @click="upload(v => editForm.image = v)">上传</button></div>
            <img v-if="editForm.image" :src="editForm.image" class="bp-edit-preview" referrerpolicy="no-referrer" />
          </div>

          <div class="bp-edit-field">
            <label>轮播图（最多4张）</label>
            <div class="bp-edit-carousel">
              <div v-for="(_, i) in editForm.headerImages" :key="i" class="bp-edit-input-row">
                <input v-model="editForm.headerImages[i]" class="bp-edit-input" :placeholder="`轮播图 ${i+1} URL`" />
                <button class="bp-upload-btn" @click="upload(v => editForm.headerImages[i] = v)">上传</button>
              </div>
            </div>
          </div>

          <div class="bp-edit-field">
            <label>详情图 URL</label>
            <div class="bp-edit-input-row"><input v-model="editForm.detailImage" class="bp-edit-input" placeholder="https://... 长图详情" /><button class="bp-upload-btn" @click="upload(v => editForm.detailImage = v)">上传</button></div>
          </div>

          <div class="bp-edit-row">
            <div class="bp-edit-field">
              <label>批发价 (¥)</label>
              <input v-model.number="editForm.wholesalePrice" type="number" class="bp-edit-input" placeholder="留空则按档位系数算" />
            </div>
            <div class="bp-edit-field">
              <label>起订量 (件)</label>
              <input v-model.number="editForm.minOrderQuantity" type="number" class="bp-edit-input" placeholder="1" />
            </div>
          </div>

          <!-- 休闲快消品：固定供货价，不按零售价折算 -->
          <div class="bp-edit-row">
            <div class="bp-edit-field">
              <label>二级供货价 (¥) · 休闲快消</label>
              <input v-model.number="editForm.supplyT2" type="number" class="bp-edit-input" placeholder="¥899 起批档" />
            </div>
            <div class="bp-edit-field">
              <label>一级供货价 (¥) · 休闲快消</label>
              <input v-model.number="editForm.supplyT1" type="number" class="bp-edit-input" placeholder="¥3,800 起批档" />
            </div>
          </div>

          <div class="bp-edit-field">
            <label>分类标签</label>
            <div class="bp-edit-tags">
              <label v-for="opt in TAG_OPTIONS" :key="opt.value" class="bp-edit-tag-check" :class="{ active: editForm.tags.includes(opt.value) }" @click="toggleTag(opt.value)">
                {{ opt.label }}
              </label>
            </div>
          </div>
        </div>
        <div class="bp-edit-dialog-footer">
          <button class="bp-edit-cancel" @click="editDialogVisible = false">取消</button>
          <button class="bp-edit-save" :disabled="saving" @click="saveEdit">
            {{ saving ? '保存中...' : '保存到ERP' }}
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- 保存成功提示 -->
  <div v-if="saveToast" class="bp-toast">✓ 已保存到ERP</div>

  <!-- 申请下载弹框（外人留资） -->
  <div v-if="applyDialogVisible" class="bp-apply-overlay" @click.self="closeApplyDialog">
    <div class="bp-apply-dialog">
      <div class="bp-apply-header">
        <h3>申请下载产品资料</h3>
        <button class="bp-apply-close" @click="closeApplyDialog" aria-label="关闭">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
      <p class="bp-apply-desc">留下联系方式，通过后即可批量下载全部产品图文资料。</p>
      <div class="bp-apply-field">
        <label>手机号 <span class="bp-req">*</span></label>
        <input v-model="applyForm.mobile" type="tel" maxlength="11" placeholder="11位手机号" class="bp-apply-input" />
      </div>
      <div class="bp-apply-field">
        <label>姓名 <span class="bp-req">*</span></label>
        <input v-model="applyForm.name" type="text" placeholder="您的姓名" class="bp-apply-input" />
      </div>
      <div class="bp-apply-field">
        <label>公司名称 <span class="bp-req">*</span></label>
        <input v-model="applyForm.company" type="text" placeholder="请输入公司全称" class="bp-apply-input" />
      </div>
      <div v-if="applyError" class="bp-apply-error">{{ applyError }}</div>
      <button class="bp-apply-submit" :disabled="applying" @click="submitApply">
        {{ applying ? '提交中...' : '提交并开始下载' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue'
import { useShopStore } from '@/stores/shopStore'
import { useBrandEditStore } from '@/stores/brandEdit'
import { useRouter, useRoute } from 'vue-router'
import type { ShopProduct } from '@/stores/shopStore'
import { useImageUpload } from '@/composables/useImageUpload'
const { triggerUpload } = useImageUpload()
function upload(setter: (v: string) => void) { triggerUpload(setter) }

const shopStore = useShopStore()
const brandEdit = useBrandEditStore()
const router = useRouter()
const route = useRoute()
// ?scene=delivery 时只看门店外卖商品池
const isDeliveryView = computed(() => route.query.scene === 'delivery')
const selectedTag = ref('all')
const selectedIds = ref<string[]>([])
const downloading = ref(false)

// ── 批发商：拿货价体系 ───────────────────────────────────────────────────
// 三套规则，按商品的品牌分类（__brand__.category）走各自的档位。要调只改这一处。
//   精选（乳制品/食品）—— 拿货价 = 零售价 × 系数，零售价一改自动跟着对
//   周边（文创）      —— 按整单零售价累计满额打折
//   休闲（快消）      —— 固定供货价，逐个商品填（__brand__.supplyPrices），不按零售价折算
type Scheme = 'agent' | 'craft' | 'fmcg'
interface Tier { key: string; name: string; rate: number; profit: string; threshold: string; short: string }

const AGENT_TIERS: Tier[] = [
  { key: 'a1', name: '初级代理', rate: 0.70, profit: '利润率 30%', threshold: '¥3,900', short: '初级' },
  { key: 'a2', name: '二级代理', rate: 0.65, profit: '利润率 35%', threshold: '¥18,000', short: '二级' },
  { key: 'a3', name: '一级代理', rate: 0.60, profit: '利润率 40%', threshold: '¥38,000', short: '一级' },
]
const CRAFT_TIERS: Tier[] = [
  { key: 'c1', name: '满 ¥3,000', rate: 0.60, profit: '6 折', threshold: '¥3,000', short: '满3000·6折' },
  { key: 'c2', name: '满 ¥10,000', rate: 0.50, profit: '5 折', threshold: '¥10,000', short: '满1万·5折' },
]
const FMCG_TIERS: Tier[] = [
  { key: 't2', name: '二级供货价', rate: 0, profit: '线下专供', threshold: '¥899', short: '二级供货' },
  { key: 't1', name: '一级供货价', rate: 0, profit: '线下专供', threshold: '¥3,800', short: '一级供货' },
]
const TIER_SETS: Record<Scheme, Tier[]> = { agent: AGENT_TIERS, craft: CRAFT_TIERS, fmcg: FMCG_TIERS }

const viewMode = ref<'grid' | 'table'>('grid')
const activeTierIdx = ref(0)
const isWholesaleView = computed(() => shopStore.isWholesale)

function schemeOf(product: ShopProduct): Scheme {
  // 品牌分类优先，没填就用 ERP 商品分类兜底
  const cat = product.category || product.erpCategory || ''
  if (cat.includes('周边')) return 'craft'
  if (cat.includes('休闲')) return 'fmcg'
  return 'agent'
}
function tierOf(product: ShopProduct, idx = activeTierIdx.value): Tier {
  const list = TIER_SETS[schemeOf(product)]
  return list[Math.min(idx, list.length - 1)]
}
/** 返回 null 表示这个商品该档位还没定价（休闲快消品没填供货价） */
function tierPrice(product: ShopProduct, idx = activeTierIdx.value): number | null {
  const tier = tierOf(product, idx)
  if (schemeOf(product) === 'fmcg') {
    const v = product.supplyPrices?.[tier.key as 't1' | 't2']
    return v && v > 0 ? v : null
  }
  // 商品单独填了批发价 = 谈好的固定价，所有档位都用它
  if (product.wholesalePrice > 0) return product.wholesalePrice
  return Math.round(product.price * tier.rate * 100) / 100
}

// 档位条按当前筛选出来的商品显示对应那套；混着显示时以代理档为准
const barTiers = computed<Tier[]>(() => {
  const list = filteredProducts.value
  if (!list.length) return AGENT_TIERS
  const first = schemeOf(list[0])
  return list.every(p => schemeOf(p) === first) ? TIER_SETS[first] : AGENT_TIERS
})
// 价目表按规则分三块，各自列头不同
const agentRows = computed(() => filteredProducts.value.filter(p => schemeOf(p) === 'agent'))
const craftRows = computed(() => filteredProducts.value.filter(p => schemeOf(p) === 'craft'))
const fmcgRows = computed(() => filteredProducts.value.filter(p => schemeOf(p) === 'fmcg'))

function fmt(n: number | null): string {
  return n === null ? '待定' : '¥' + (Math.round(n * 100) / 100)
}

// ── 外人申请下载：留资表单 + 本地解锁 ──────────────────────────────────
const DOWNLOAD_UNLOCK_KEY = 'brand_download_unlocked_v1'
const downloadUnlocked = ref(false)
const applyDialogVisible = ref(false)
const applying = ref(false)
const applyError = ref('')
const applyForm = reactive({ mobile: '', name: '', company: '' })

// 离开时切回商城渠道，避免品牌首页/商城沿用外卖商品池
onUnmounted(() => shopStore.setChannel('shop'))

onMounted(() => {
  shopStore.setChannel(isDeliveryView.value ? 'delivery' : 'shop')
  try {
    if (localStorage.getItem(DOWNLOAD_UNLOCK_KEY) === '1') {
      downloadUnlocked.value = true
      if (shopStore.shopMode === null) shopStore.setShopMode('wholesale')
    }
  } catch { /* ignore */ }
})

function closeApplyDialog() {
  applyDialogVisible.value = false
  applyError.value = ''
}

async function submitApply() {
  applyError.value = ''
  const mobile = applyForm.mobile.trim()
  const name = applyForm.name.trim()
  const company = applyForm.company.trim()
  if (!/^1\d{10}$/.test(mobile)) { applyError.value = '请输入正确的11位手机号'; return }
  if (!name) { applyError.value = '请填写姓名'; return }
  if (!company) { applyError.value = '请填写公司名称'; return }
  applying.value = true
  try {
    const res = await fetch('/api/brand-download-lead', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile, name, company }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || data.code !== 1) {
      applyError.value = data?.message || '提交失败，请稍后重试'
      return
    }
    try { localStorage.setItem(DOWNLOAD_UNLOCK_KEY, '1') } catch { /* ignore */ }
    downloadUnlocked.value = true
    shopStore.setShopMode('wholesale')
    applyDialogVisible.value = false
  } catch {
    applyError.value = '网络错误，请稍后重试'
  } finally {
    applying.value = false
  }
}

// 拖拽状态
const dragId = ref<string | null>(null)
const dragOverId = ref<string | null>(null)

// 编辑弹框
const editDialogVisible = ref(false)
const saving = ref(false)
const saveToast = ref(false)
const editingProduct = ref<ShopProduct | null>(null)
const editForm = reactive({
  name: '',
  description: '',
  image: '',
  headerImages: ['', '', '', ''],
  detailImage: '',
  wholesalePrice: 0,
  supplyT2: 0,
  supplyT1: 0,
  minOrderQuantity: 1,
  tags: [] as string[],
})

// 分类条与小程序 pages/category 完全一致：
// 全部 + KV miniCategories（后台管理的顺序）+ 商品里出现过的分类（去重）+ 会员专属
const FIXED_CATS = computed(() => {
  const managed: string[] = Array.isArray((brandEdit.config as any).miniCategories)
    ? (brandEdit.config as any).miniCategories
    : []
  const dynamic = shopStore.products.map(p => p.category)
  const seen = new Set<string>()
  const cats: { label: string; tag: string }[] = [{ label: '全部', tag: 'all' }]
  for (const item of [...managed, ...dynamic]) {
    const name = String(item || '').trim()
    if (!name || seen.has(name)) continue
    seen.add(name)
    cats.push({ label: name, tag: name })
  }
  cats.push({ label: '会员专属', tag: '__member__' })
  return cats
})

const TAG_OPTIONS = [
  { value: 'new', label: '新品' },
  { value: 'hot', label: '热销' },
  { value: 'sale', label: '特惠' },
]

const filteredProducts = computed(() => {
  const keyword = router.currentRoute.value.query.q as string
  let list = selectedTag.value === 'all'
    ? shopStore.products
    : selectedTag.value === '__member__'
      ? shopStore.products.filter(p => p.memberOnly || (p.tags || []).includes('member'))
      : shopStore.products.filter(p => (p.category || '').trim() === selectedTag.value)
  if (keyword) {
    const q = keyword.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q))
  }
  return list
})

function tagBadgeLabel(tags: string[]) {
  if (tags.includes('hot')) return '热销'
  if (tags.includes('new')) return '新品'
  if (tags.includes('sale')) return '特惠'
  return ''
}

function tagBadgeClass(tags: string[]) {
  if (tags.includes('hot')) return 'badge-hot'
  if (tags.includes('new')) return 'badge-new'
  if (tags.includes('sale')) return 'badge-sale'
  return ''
}

function goDetail(id: string) {
  router.push(`/brand/product/${id}`)
}

function addToCart(product: ShopProduct) {
  // 批发模式下把当前档位拿货价带进采购单，否则购物车按 wholesalePrice(=0) 算总价
  shopStore.addToCart(
    shopStore.isWholesale
      ? { ...product, wholesalePrice: tierPrice(product, activeTierIdx.value) ?? 0 }
      : product
  )
  router.push('/brand/cart')
}

function toggleSelect(id: string) {
  const idx = selectedIds.value.indexOf(id)
  if (idx >= 0) selectedIds.value.splice(idx, 1)
  else selectedIds.value.push(id)
}

// ── 拖拽排序 ────────────────────────────────────────────────────────────────
function onDragStart(id: string) { dragId.value = id }
function onDragEnd() {
  if (dragId.value && dragOverId.value && dragId.value !== dragOverId.value) {
    const products = [...shopStore.products]
    const fromIdx = products.findIndex(p => p.id === dragId.value)
    const toIdx = products.findIndex(p => p.id === dragOverId.value)
    const [moved] = products.splice(fromIdx, 1)
    products.splice(toIdx, 0, moved)
    // 重新赋值 sort
    const updates = products.map((p, i) => ({ erpId: p.erpId, sort: i + 1 }))
    shopStore.products.splice(0, shopStore.products.length, ...products)
    shopStore.saveSortOrder(updates)
  }
  dragId.value = null
  dragOverId.value = null
}
function onDragEnter(id: string) { dragOverId.value = id }
function onDrop() { /* handled in dragend */ }

// ── 编辑弹框 ─────────────────────────────────────────────────────────────────
function openEdit(product: ShopProduct) {
  editingProduct.value = product
  editForm.name = product.name
  editForm.description = product.description
  editForm.image = product.image
  editForm.headerImages = product.headerImages?.length
    ? [...product.headerImages, '', '', '', ''].slice(0, 4)
    : ['', '', '', '']
  editForm.detailImage = product.detailImage || ''
  editForm.wholesalePrice = product.wholesalePrice
  editForm.supplyT2 = product.supplyPrices?.t2 || 0
  editForm.supplyT1 = product.supplyPrices?.t1 || 0
  editForm.minOrderQuantity = product.minOrderQuantity
  editForm.tags = [...(product.tags || [])]
  editDialogVisible.value = true
}

function toggleTag(val: string) {
  const idx = editForm.tags.indexOf(val)
  if (idx >= 0) editForm.tags.splice(idx, 1)
  else editForm.tags.push(val)
}

async function saveEdit() {
  if (!editingProduct.value) return
  saving.value = true
  try {
    await shopStore.saveBrandFields(editingProduct.value.erpId, {
      show: true,
      description: editForm.description,
      image: editForm.image,
      headerImages: editForm.headerImages.filter(s => s),
      detailImage: editForm.detailImage,
      wholesalePrice: editForm.wholesalePrice,
      supplyPrices: (editForm.supplyT2 > 0 || editForm.supplyT1 > 0)
        ? { t2: editForm.supplyT2 || 0, t1: editForm.supplyT1 || 0 }
        : null,
      minOrderQuantity: editForm.minOrderQuantity,
      tags: editForm.tags,
    })
    editDialogVisible.value = false
    saveToast.value = true
    setTimeout(() => { saveToast.value = false }, 2500)
  } finally {
    saving.value = false
  }
}

// ── Download helpers ─────────────────────────────────────────────────────────
async function fetchImageBuffer(url: string): Promise<ArrayBuffer | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    return await res.arrayBuffer()
  } catch { return null }
}

function getImageExtension(url: string): string {
  const match = url.match(/\.(png|jpg|jpeg|webp|gif)/i)
  return match ? match[1].toLowerCase() : 'jpg'
}

async function buildZipForProducts(products: ShopProduct[]): Promise<Blob> {
  const [{ default: JSZip }, { default: ExcelJS }] = await Promise.all([
    import('jszip'),
    import('exceljs'),
  ])
  const zip = new JSZip()
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('产品资料')
  sheet.columns = [
    { header: '产品名称', key: 'name', width: 24 },
    { header: '分类', key: 'category', width: 14 },
    { header: '零售价(¥)', key: 'price', width: 12 },
    { header: '批发价(¥)', key: 'wholesalePrice', width: 12 },
    { header: '起订量', key: 'minOrderQuantity', width: 10 },
    { header: '评分', key: 'rating', width: 8 },
    { header: '描述', key: 'description', width: 40 },
    { header: '缩略图', key: 'thumb', width: 16 },
  ]
  const headerRow = sheet.getRow(1)
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1D1D1F' } }
  headerRow.height = 22
  headerRow.alignment = { vertical: 'middle' }

  for (let i = 0; i < products.length; i++) {
    const p = products[i]
    const rowIndex = i + 2
    const row = sheet.addRow({ name: p.name, category: p.category, price: p.price, wholesalePrice: p.wholesalePrice, minOrderQuantity: p.minOrderQuantity, rating: p.rating, description: p.description })
    row.height = 60
    row.alignment = { vertical: 'middle', wrapText: true }
    const imgBuf = await fetchImageBuffer(p.image)
    if (imgBuf) {
      const ext = getImageExtension(p.image) as 'jpeg' | 'png' | 'gif'
      const safeExt = ['jpeg', 'png', 'gif'].includes(ext) ? ext : 'jpeg'
      const imageId = workbook.addImage({ buffer: imgBuf as Buffer, extension: safeExt })
      sheet.addImage(imageId, { tl: { col: 7, row: rowIndex - 1 }, br: { col: 8, row: rowIndex }, editAs: 'oneCell' })
    }
    const folderName = `images/${p.name}`
    const mainBuf = await fetchImageBuffer(p.image)
    if (mainBuf) zip.file(`${folderName}/主图.${getImageExtension(p.image)}`, mainBuf)
    if (p.headerImages?.length) {
      for (let j = 0; j < p.headerImages.length; j++) {
        const buf = await fetchImageBuffer(p.headerImages[j])
        if (buf) zip.file(`${folderName}/轮播图_${j+1}.${getImageExtension(p.headerImages[j])}`, buf)
      }
    }
    const detailList: string[] = []
    if (p.detailImage) detailList.push(p.detailImage)
    if (Array.isArray(p.detailImages)) {
      for (const url of p.detailImages) {
        if (url && !detailList.includes(url)) detailList.push(url)
      }
    }
    for (let k = 0; k < detailList.length; k++) {
      const buf = await fetchImageBuffer(detailList[k])
      if (!buf) continue
      const filename = detailList.length === 1
        ? `详情图.${getImageExtension(detailList[k])}`
        : `详情图_${k + 1}.${getImageExtension(detailList[k])}`
      zip.file(`${folderName}/${filename}`, buf)
    }
  }
  const excelBuffer = await workbook.xlsx.writeBuffer()
  zip.file('产品资料.xlsx', excelBuffer)
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 } })
}

function triggerDownloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

async function downloadOne(product: ShopProduct) {
  if (downloading.value) return
  downloading.value = true
  try {
    const blob = await buildZipForProducts([product])
    triggerDownloadBlob(blob, `${product.name}-产品资料.zip`)
  } finally { downloading.value = false }
}

async function downloadSelected() {
  if (downloading.value) return
  downloading.value = true
  try {
    const products = shopStore.products.filter(p => selectedIds.value.includes(p.id))
    const blob = await buildZipForProducts(products)
    triggerDownloadBlob(blob, `采购清单-${products.length}款产品.zip`)
  } finally { downloading.value = false }
}
</script>

<style scoped>
.brand-products { padding: 32px 48px 80px; max-width: 1400px; width: 100%; box-sizing: border-box; }
.bp-header { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
.bp-title { font-size: 28px; font-weight: 800; letter-spacing: -0.03em; }
.bp-sub { font-size: 13px; color: rgba(29,29,31,0.45); margin-top: 4px; }
.bp-cats { display: flex; gap: 8px; flex-wrap: wrap; }
.bp-cat-btn { padding: 7px 15px; border-radius: 999px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; background: #f5f5f7; color: rgba(29,29,31,0.5); transition: all 0.2s; }
.bp-cat-btn.active, .bp-cat-btn:hover { background: #1d1d1f; color: #fff; }
.bp-edit-hint { width: 100%; padding: 8px 16px; background: rgba(124,58,237,0.06); border: 1px dashed rgba(124,58,237,0.3); border-radius: 10px; font-size: 12px; color: #7c3aed; font-weight: 600; display: flex; align-items: center; gap: 6px; }

.bp-loading { display: flex; align-items: center; justify-content: center; gap: 12px; padding: 80px 0; color: rgba(29,29,31,0.4); font-size: 14px; }
.bp-empty { text-align: center; padding: 80px 0; color: rgba(29,29,31,0.3); font-size: 15px; }

.bp-bulk-bar { display: flex; align-items: center; gap: 12px; background: #fffbf0; border: 1px solid rgba(245,158,11,0.2); border-radius: 14px; padding: 12px 20px; margin-bottom: 20px; }
.bp-bulk-info { font-size: 13px; font-weight: 700; color: #d97706; flex: 1; }
.bp-bulk-download { display: flex; align-items: center; gap: 7px; padding: 8px 16px; background: #f59e0b; color: #1d1d1f; border-radius: 10px; font-size: 12px; font-weight: 700; border: none; cursor: pointer; transition: transform 0.2s; }
.bp-bulk-download:hover:not(:disabled) { transform: scale(1.02); }
.bp-bulk-download:disabled { opacity: 0.6; cursor: not-allowed; }
.bp-bulk-clear { padding: 8px 14px; background: transparent; color: rgba(29,29,31,0.4); border-radius: 10px; font-size: 12px; font-weight: 600; border: 1px solid rgba(0,0,0,0.1); cursor: pointer; transition: all 0.2s; }
.bp-bulk-clear:hover { background: #f5f5f7; color: #1d1d1f; }

.bp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }
.bp-card { background: #fff; border-radius: 24px; overflow: hidden; border: 2px solid transparent; cursor: pointer; transition: all 0.4s cubic-bezier(0.23,1,0.32,1); }
.bp-card:hover { transform: translateY(-6px); box-shadow: 0 24px 48px rgba(0,0,0,0.09); }
.bp-card-selected { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.1); }
.bp-card-dragging { opacity: 0.4; transform: scale(0.97); }
.bp-card-dragover { border-color: #7c3aed !important; box-shadow: 0 0 0 3px rgba(124,58,237,0.2); transform: translateY(-4px); }

.bp-card-img-wrap { position: relative; aspect-ratio: 1/1; overflow: hidden; background: #f5f5f7; }
.bp-card-img { width: 100%; height: 100%; object-fit: contain; transition: transform 0.8s ease; }
.bp-card:hover .bp-card-img { transform: scale(1.07); }

.bp-drag-handle { position: absolute; top: 10px; left: 10px; z-index: 3; width: 28px; height: 28px; border-radius: 8px; background: rgba(0,0,0,0.5); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; color: #fff; cursor: grab; }
.bp-drag-handle:active { cursor: grabbing; }
.bp-edit-btn { position: absolute; top: 10px; right: 10px; z-index: 3; width: 28px; height: 28px; border-radius: 8px; background: #7c3aed; color: #fff; border: none; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 12px rgba(124,58,237,0.4); transition: transform 0.2s; }
.bp-edit-btn:hover { transform: scale(1.1); }

.bp-select-check { position: absolute; top: 10px; left: 10px; z-index: 2; width: 24px; height: 24px; border-radius: 7px; border: 2px solid rgba(255,255,255,0.8); background: rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; backdrop-filter: blur(4px); }
.bp-card-selected .bp-select-check { background: #7c3aed; border-color: #7c3aed; }

.bp-tag-badge { position: absolute; top: 10px; right: 10px; font-size: 10px; font-weight: 700; padding: 3px 9px; border-radius: 999px; }
.badge-hot { background: #f59e0b; color: #1d1d1f; }
.badge-new { background: #0071e3; color: #fff; }
.badge-sale { background: #ef4444; color: #fff; }

.bp-card-body { padding: 16px; }
.bp-card-name { font-size: 14px; font-weight: 700; margin-bottom: 5px; }
.bp-card-desc { font-size: 12px; color: rgba(29,29,31,0.45); line-height: 1.5; margin-bottom: 10px; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.bp-card-footer { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.bp-card-price { display: flex; align-items: center; gap: 6px; }
.bp-price { font-size: 17px; font-weight: 800; color: #0071e3; }
.bp-moq { font-size: 10px; font-weight: 600; color: #d97706; background: rgba(245,158,11,0.1); padding: 2px 7px; border-radius: 999px; }
.bp-card-rating { display: flex; align-items: center; gap: 3px; }
.bp-card-rating span { font-size: 10px; color: rgba(29,29,31,0.4); font-weight: 600; }
.bp-btn-row { display: flex; gap: 8px; }
.bp-add-btn { flex: 1; padding: 9px; border-radius: 12px; background: #1d1d1f; color: #fff; font-size: 12px; font-weight: 700; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; transition: background 0.2s; }
.bp-add-btn:hover { background: #0071e3; }
.bp-dl-btn { width: 36px; border-radius: 12px; background: #f5f5f7; color: rgba(29,29,31,0.5); border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background 0.2s, color 0.2s; flex-shrink: 0; }
.bp-dl-btn:hover:not(:disabled) { background: #f59e0b; color: #1d1d1f; }
.bp-dl-btn:disabled { opacity: 0.5; cursor: not-allowed; }

/* 编辑弹框 */
.bp-edit-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.bp-edit-dialog { background: #fff; border-radius: 24px; width: 100%; max-width: 560px; max-height: 85vh; display: flex; flex-direction: column; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bp-edit-dialog-header { display: flex; align-items: center; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid rgba(0,0,0,0.06); }
.bp-edit-dialog-header h3 { font-size: 16px; font-weight: 800; }
.bp-edit-close { width: 32px; height: 32px; border-radius: 8px; background: #f5f5f7; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(29,29,31,0.5); transition: background 0.2s; }
.bp-edit-close:hover { background: #e8e8ed; color: #1d1d1f; }
.bp-edit-dialog-body { flex: 1; overflow-y: auto; padding: 20px 24px; display: flex; flex-direction: column; gap: 16px; }
.bp-edit-goods-name { font-size: 13px; font-weight: 700; color: #7c3aed; background: rgba(124,58,237,0.07); padding: 6px 12px; border-radius: 8px; }
.bp-edit-field { display: flex; flex-direction: column; gap: 6px; }
.bp-edit-field label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.6); }
.bp-edit-input { padding: 9px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; transition: border-color 0.2s; flex: 1; }
.bp-edit-input-row { display: flex; gap: 8px; align-items: center; }
.bp-upload-btn { padding: 9px 12px; background: #f5f5f7; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 12px; font-weight: 600; cursor: pointer; white-space: nowrap; transition: background 0.2s; }
.bp-upload-btn:hover { background: #e8e8ed; }
.bp-edit-input:focus { border-color: #7c3aed; }
.bp-edit-textarea { padding: 9px 12px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 10px; font-size: 13px; outline: none; min-height: 72px; resize: vertical; transition: border-color 0.2s; }
.bp-edit-textarea:focus { border-color: #7c3aed; }
.bp-edit-preview { width: 100%; max-height: 120px; object-fit: cover; border-radius: 10px; margin-top: 4px; }
.bp-edit-carousel { display: flex; flex-direction: column; gap: 6px; }
.bp-edit-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.bp-edit-tags { display: flex; gap: 8px; }
.bp-edit-tag-check { padding: 6px 14px; border-radius: 999px; font-size: 12px; font-weight: 700; background: #f5f5f7; color: rgba(29,29,31,0.5); cursor: pointer; transition: all 0.2s; user-select: none; }
.bp-edit-tag-check.active { background: #7c3aed; color: #fff; }
.bp-edit-dialog-footer { display: flex; gap: 10px; padding: 16px 24px 20px; border-top: 1px solid rgba(0,0,0,0.06); }
.bp-edit-cancel { flex: 1; padding: 12px; border-radius: 12px; background: #f5f5f7; color: rgba(29,29,31,0.6); font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; }
.bp-edit-cancel:hover { background: #e8e8ed; }
.bp-edit-save { flex: 2; padding: 12px; border-radius: 12px; background: #7c3aed; color: #fff; font-size: 14px; font-weight: 700; border: none; cursor: pointer; transition: background 0.2s; }
.bp-edit-save:hover:not(:disabled) { background: #6d28d9; }
.bp-edit-save:disabled { opacity: 0.6; cursor: not-allowed; }

/* ── 批发商：卡片/价目表 切换 ─────────────────────────────────────────── */
.bp-view-switch { display: inline-flex; gap: 3px; padding: 3px; background: #f5f5f7; border-radius: 999px; }
.bp-view-btn { display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px; border: none; border-radius: 999px; background: transparent; color: rgba(29,29,31,0.5); font-size: 12px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
.bp-view-btn.active { background: #fff; color: #1d1d1f; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

/* ── 批发商：档位切换条 ───────────────────────────────────────────────── */
.bp-tier-bar { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
.bp-tier-chip { display: flex; flex-direction: column; gap: 3px; padding: 12px 16px; border-radius: 16px; background: #f5f5f7; border: 1.5px solid transparent; cursor: pointer; transition: all 0.2s; }
.bp-tier-chip:hover { background: #eeeef0; }
.bp-tier-chip.active { background: #fff; border-color: #1d1d1f; box-shadow: 0 6px 18px rgba(0,0,0,0.07); }
.bp-tier-name { font-size: 13px; font-weight: 800; color: rgba(29,29,31,0.55); }
.bp-tier-chip.active .bp-tier-name { color: #1d1d1f; }
.bp-tier-meta { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.38); }

/* ── 批发商：紧凑卡片（把画面让给主图） ───────────────────────────────── */
.bp-card-body-ws { padding: 12px 14px 14px; }
.bp-ws-line { display: flex; align-items: baseline; gap: 6px; margin-bottom: 8px; }
.bp-ws-line .bp-card-name { margin-bottom: 0; flex: 1; min-width: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bp-ws-spec { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.35); flex-shrink: 0; }
.bp-ws-price-row { display: flex; align-items: baseline; gap: 8px; margin-bottom: 10px; }
.bp-ws-price { font-size: 19px; font-weight: 800; color: #1d1d1f; letter-spacing: -0.02em; }
.bp-ws-retail { font-size: 11px; font-weight: 600; color: rgba(29,29,31,0.35); text-decoration: line-through; }

.bp-ws-tier-tag { font-size: 10px; font-weight: 700; color: #d97706; background: rgba(245,158,11,0.12); padding: 2px 7px; border-radius: 999px; white-space: nowrap; }

/* ── 批发商：拿货价对比表 ─────────────────────────────────────────────── */
.bp-table-wrap { background: #fff; border-radius: 20px; box-shadow: 0 2px 20px rgba(0,0,0,0.05); margin-bottom: 20px; overflow: hidden; }
.bp-table-scroll { overflow-x: auto; }
.bp-table-head { display: flex; align-items: baseline; gap: 10px; padding: 18px 20px 14px; }
.bp-table-head h3 { font-size: 15px; font-weight: 800; letter-spacing: -0.02em; }
.bp-table-head span { font-size: 12px; font-weight: 600; color: rgba(29,29,31,0.4); }
.bp-table { width: 100%; border-collapse: collapse; min-width: 620px; }
.bp-table th { position: sticky; top: 0; background: #fff; text-align: right; font-size: 11px; font-weight: 700; color: rgba(29,29,31,0.4); padding: 16px 14px; border-bottom: 1.5px solid rgba(0,0,0,0.08); white-space: nowrap; }
.bp-th-goods, .bp-th-spec { text-align: left; }
.bp-th-tier { text-align: right; }
.bp-th-tier-name { display: block; font-size: 12px; font-weight: 800; color: rgba(29,29,31,0.65); }
.bp-th-tier-meta { display: block; margin-top: 2px; font-size: 10px; font-weight: 600; color: rgba(29,29,31,0.32); }
.bp-th-tier.active .bp-th-tier-name { color: #1d1d1f; }
.bp-table tbody tr { cursor: pointer; transition: background 0.15s; }
.bp-table tbody tr:hover { background: #fafafa; }
.bp-table td { padding: 12px 14px; border-bottom: 1px solid rgba(0,0,0,0.05); font-size: 13px; text-align: right; white-space: nowrap; }
.bp-td-goods { display: flex; align-items: center; gap: 10px; text-align: left; }
.bp-td-img { width: 40px; height: 40px; border-radius: 10px; object-fit: contain; background: #f5f5f7; flex-shrink: 0; }
.bp-td-name { font-size: 13px; font-weight: 700; color: #1d1d1f; }
.bp-td-spec { text-align: left; font-size: 12px; color: rgba(29,29,31,0.45); font-weight: 600; }
.bp-td-tier { font-weight: 700; color: rgba(29,29,31,0.5); font-variant-numeric: tabular-nums; }
.bp-td-tier.active { color: #1d1d1f; font-weight: 800; background: rgba(245,158,11,0.07); }
.bp-td-retail { color: rgba(29,29,31,0.35); font-weight: 600; text-decoration: line-through; font-variant-numeric: tabular-nums; }
.bp-table tfoot td { border-bottom: none; padding: 14px; font-size: 12px; font-weight: 700; background: #fafafa; }
.bp-tf-label { text-align: left; color: rgba(29,29,31,0.45); }
.bp-tf-tier { color: rgba(29,29,31,0.55); font-variant-numeric: tabular-nums; }
.bp-tf-tier.active { color: #1d1d1f; }
.bp-table-note { padding: 14px 16px 16px; font-size: 11px; color: rgba(29,29,31,0.35); line-height: 1.6; }

@keyframes spin { to { transform: rotate(360deg); } }
.spinning { animation: spin 1s linear infinite; }

@media (max-width: 768px) {
  .brand-products { padding: 20px; }
  .bp-grid { grid-template-columns: 1fr 1fr; }
  /* 批发商手机端：文字块压到最小，主图占主导 */
  .bp-grid-ws { gap: 12px; }
  .bp-grid-ws .bp-card { border-radius: 18px; }
  .bp-card-body-ws { padding: 9px 10px 10px; }
  .bp-card-body-ws .bp-card-name { font-size: 12.5px; }
  .bp-ws-line { margin-bottom: 5px; }
  .bp-ws-spec { display: none; }
  .bp-ws-price-row { gap: 5px; margin-bottom: 7px; }
  .bp-ws-price { font-size: 16px; }
  .bp-ws-retail { font-size: 10px; }
  .bp-card-body-ws .bp-moq { display: none; }
  .bp-card-body-ws .bp-add-btn { padding: 7px; font-size: 11px; border-radius: 10px; }
  .bp-card-body-ws .bp-dl-btn { width: 30px; border-radius: 10px; }
  /* 档位条改成横向滑动一行，别占掉首屏 */
  .bp-tier-bar { display: flex; gap: 8px; margin-bottom: 14px; overflow-x: auto; scrollbar-width: none; padding-bottom: 2px; }
  .bp-tier-bar::-webkit-scrollbar { display: none; }
  .bp-tier-chip { flex: 0 0 auto; padding: 8px 14px; border-radius: 12px; }
  .bp-tier-name { font-size: 12px; }
  .bp-tier-meta { font-size: 10px; }
  .bp-view-switch { width: 100%; }
  .bp-view-btn { flex: 1; justify-content: center; }
  .bp-table-wrap { border-radius: 16px; }
  .bp-table th, .bp-table td { padding: 10px 8px; }
  .bp-td-img { width: 34px; height: 34px; }
  /* 手机上产品名+规格会把价格列整个挤出屏幕，规格隐掉、产品列吸左，横滑看价格 */
  .bp-th-spec, .bp-td-spec { display: none; }
  .bp-table { min-width: 460px; }
  .bp-th-goods, .bp-td-goods { position: sticky; left: 0; z-index: 2; background: #fff; }
  .bp-table tbody tr:hover .bp-td-goods { background: #fafafa; }
  .bp-th-goods, .bp-td-goods, .bp-tf-label { box-shadow: 1px 0 0 rgba(0,0,0,0.06); }
  .bp-td-name { font-size: 12px; white-space: normal; line-height: 1.3; }
  .bp-td-goods { max-width: 132px; }
  .bp-tf-label { position: sticky; left: 0; z-index: 2; background: #fafafa; }
}

.bp-toast {
  position: fixed; bottom: 32px; left: 50%; transform: translateX(-50%);
  background: #1d1d1f; color: #fff; padding: 12px 24px; border-radius: 12px;
  font-size: 14px; font-weight: 600; z-index: 9999;
  animation: bp-toast-in 0.3s ease;
}
@keyframes bp-toast-in {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* 申请下载按钮 */
.bp-apply-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 10px 18px; background: #7c3aed; color: #fff;
  border: none; border-radius: 999px; font-size: 13px; font-weight: 700;
  cursor: pointer; transition: background 0.2s, transform 0.15s;
  box-shadow: 0 6px 16px rgba(124,58,237,0.28);
}
.bp-apply-btn:hover { background: #6d28d9; transform: translateY(-1px); }

/* 申请下载弹框 */
.bp-apply-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 20px; }
.bp-apply-dialog { background: #fff; border-radius: 24px; width: 100%; max-width: 420px; padding: 24px; box-shadow: 0 40px 80px rgba(0,0,0,0.2); }
.bp-apply-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; }
.bp-apply-header h3 { font-size: 17px; font-weight: 800; }
.bp-apply-close { width: 32px; height: 32px; border-radius: 8px; background: #f5f5f7; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; color: rgba(29,29,31,0.5); transition: background 0.2s; }
.bp-apply-close:hover { background: #e8e8ed; color: #1d1d1f; }
.bp-apply-desc { font-size: 13px; color: rgba(29,29,31,0.5); margin-bottom: 18px; line-height: 1.5; }
.bp-apply-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
.bp-apply-field label { font-size: 12px; font-weight: 700; color: rgba(29,29,31,0.7); }
.bp-req { color: #ef4444; }
.bp-apply-input { padding: 11px 14px; border: 1.5px solid rgba(0,0,0,0.1); border-radius: 12px; font-size: 14px; outline: none; transition: border-color 0.2s; }
.bp-apply-input:focus { border-color: #7c3aed; }
.bp-apply-error { font-size: 12px; color: #ef4444; margin-bottom: 12px; font-weight: 600; }
.bp-apply-submit { width: 100%; padding: 13px; background: #1d1d1f; color: #fff; border: none; border-radius: 14px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.2s; }
.bp-apply-submit:hover:not(:disabled) { background: #7c3aed; }
.bp-apply-submit:disabled { opacity: 0.6; cursor: not-allowed; }
</style>
