<template>
  <div class="cr-shell">

    <!-- ── 顶栏 ── -->
    <div class="cr-topbar">
      <div class="cr-home-btn" @click="$router.push('/dashboard')" :title="$t('retail.cashRegister.backHome')">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M2 6.5L8 2l6 4.5V14a1 1 0 01-1 1H3a1 1 0 01-1-1V6.5z" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
          <path d="M6 15v-5h4v5" stroke="currentColor" stroke-width="1.4" stroke-linejoin="round"/>
        </svg>
        <span class="cr-home-text">{{ $t('retail.cashRegister.backHome') }}</span>
      </div>
      <div class="cr-brand">
        <div class="cr-brand-icon">
          <svg width="28" height="28" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect width="36" height="36" rx="8" fill="url(#crbg)"/>
            <text x="17" y="27" text-anchor="middle" font-family="'Helvetica Neue','Arial',sans-serif" font-size="26" font-weight="800" fill="#70C1F2">N</text>
            <circle cx="27" cy="8" r="4" fill="#F19D38"/>
            <defs>
              <linearGradient id="crbg" x1="0" y1="0" x2="0" y2="36" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stop-color="#1C2B48"/>
                <stop offset="100%" stop-color="#1D3974"/>
              </linearGradient>
            </defs>
          </svg>
        </div>
        <span class="cr-brand-name">{{ $t('retail.cashRegister.title') }}</span>
      </div>
      <div class="cr-top-right">
        <!-- 克重计算器按钮 -->
        <div class="cr-calc-btn" @click="openWeightCalc()" :title="$t('retail.cashRegister.weightCalcBtn')">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 3"/></svg>
          <span class="cr-calc-text">{{ $t('retail.cashRegister.weightCalcBtn') }}</span>
        </div>
        <el-select
          v-model="selectedStoreId"
          :placeholder="$t('retail.cashRegister.storePlaceholder')"
          clearable
          filterable
          size="small"
          class="cr-member-select"
          @change="onStoreChange"
        >
          <el-option v-for="s in storeList" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-select
          v-model="selectedMemberId"
          :placeholder="$t('retail.cashRegister.memberLoginPlaceholder')"
          clearable
          filterable
          size="small"
          class="cr-member-select"
          @change="onMemberChange"
        >
          <el-option v-for="m in memberList" :key="m.id"
            :label="`${m.name}  ${m.mobile}`" :value="m.id" />
        </el-select>
        <div class="cr-search-box">
          <el-icon class="cr-search-icon"><Search /></el-icon>
          <input
            ref="searchInputRef"
            v-model="keyword"
            class="cr-search-input"
            :placeholder="$t('retail.cashRegister.searchPlaceholder')"
            @input="onSearch"
            @keydown.enter="onBarcodeEnter"
          />
          <div class="cr-scan-icon" :title="$t('retail.cashRegister.barcodeScanTooltip')" @click="focusSearch">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="5" height="5"/><rect x="16" y="3" width="5" height="5"/>
              <rect x="3" y="16" width="5" height="5"/>
              <path d="M16 16h2v2M16 19h2M19 16v2M16 22h2M19 19v2h2M22 16h-1M22 22h-2"/>
            </svg>
          </div>
        </div>
        <div class="cr-new-goods-btn" @click="openQuickAdd" :title="$t('retail.cashRegister.newGoods')">
          <el-icon><Plus /></el-icon>
          <span class="cr-new-goods-text">{{ $t('retail.cashRegister.newGoods') }}</span>
        </div>
      </div>
    </div>

    <!-- ── 手机端：购物车抽屉遮罩 ── -->
    <div class="cr-drawer-mask" v-if="cartDrawerOpen" @click="cartDrawerOpen = false" />

    <!-- ── 手机端：购物车底部抽屉 ── -->
    <div class="cr-cart-drawer" :class="{ open: cartDrawerOpen }">
      <div class="cr-drawer-handle" @click="cartDrawerOpen = !cartDrawerOpen">
        <div class="cr-drawer-grip" />
      </div>
      <div class="cr-drawer-inner">
        <div class="cr-drawer-header">
          <span class="cr-drawer-title">{{ $t('retail.cashRegister.cartTitle') }}</span>
          <div class="cr-drawer-actions">
            <div class="cr-action-btn" @click="() => {}">{{ $t('retail.cashRegister.saveOrder') }}</div>
            <div class="cr-action-btn" @click="() => {}">{{ $t('retail.cashRegister.takeOrder') }}</div>
            <div class="cr-action-btn danger" @click="clearCart">{{ $t('retail.cashRegister.clearCart') }}</div>
          </div>
        </div>
        <div class="cr-drawer-list">
          <div v-if="cartItems.length === 0" class="cr-drawer-empty">
            <span>🛒</span> {{ $t('retail.cashRegister.cartEmpty') }}
          </div>
          <div
            v-for="(item, idx) in displayCartItems"
            :key="idx"
            class="cr-cart-item"
            :class="{ active: pricingTargetIndex === idx }"
            @click="setPricingTarget(idx)"
          >
            <div class="cr-cart-item-top">
              <div class="cr-cart-item-title">
                <span class="cr-cart-item-name">{{ item.goods_name }}</span>
                <span v-if="item.original_price !== item.price" class="cr-cart-item-price-note">
                  {{ $t('retail.cashRegister.originalPrice') }} ¥{{ formatMoney(item.original_price) }} → {{ $t('retail.cashRegister.dealPrice') }} ¥{{ formatMoney(item.price) }}
                </span>
              </div>
              <el-button type="danger" link size="small" :icon="Delete"
                @click.stop="removeCartItem(idx)" />
            </div>
            <div class="cr-cart-item-bottom">
              <div class="cr-qty-ctrl">
                <template v-if="item.is_bulk || / \d+\.?\d*g$/.test(item.goods_name)">
                  <button class="cr-gram-chip" @click.stop="openWeightCalcEdit(idx)">
                    {{ ((cartItems[idx].num) * (item.bulk_grams_per_base ?? 500)).toFixed(1) }}g ✎
                  </button>
                </template>
                <template v-else>
                  <button class="cr-qty-btn" @click.stop="changeQty(idx,-1)">−</button>
                  <el-input-number v-model="cartItems[idx].num" :min="0.001" :step="0.001" :precision="3"
                    controls-position="right" size="small" style="width:72px"
                    @change="calcTotal" />
                  <button class="cr-qty-btn" @click.stop="changeQty(idx,1)">+</button>
                </template>
              </div>
              <div class="cr-cart-item-amounts">
                <div class="cr-cart-item-price-row">
                  <span class="cr-cart-item-unit-label">{{ $t('retail.cashRegister.unitPrice') }}</span>
                  <el-input-number
                    v-model="cartItems[idx].price"
                    :min="0"
                    :precision="2"
                    :step="1"
                    controls-position="right"
                    size="small"
                    style="width:88px"
                    @change="calcTotal"
                    @click.stop
                  />
                </div>
                <div class="cr-cart-item-sub">
                  <span class="cr-cart-item-sub-label">{{ $t('retail.cashRegister.subtotal') }}</span>
                  <el-input-number
                    :model-value="item.line_amount"
                    :min="0.01" :precision="2" controls-position="right" size="small"
                    style="width:88px"
                    @change="(v: number) => changeSubtotal(idx, v)"
                    @click.stop
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <!-- 汇总 + 支付 -->
        <div class="cr-settle cr-drawer-settle">
          <div class="cr-settle-row">
            <span>{{ $t('retail.cashRegister.orderDate') }}</span>
            <el-date-picker v-model="orderDate" type="date" value-format="YYYY-MM-DD"
              size="small" style="width:130px" :clearable="false" />
          </div>
          <div class="cr-settle-row">
            <span>{{ $t('retail.cashRegister.goodsTotal') }}</span>
            <span>¥{{ formatMoney(totalAmount) }}</span>
          </div>
          <div class="cr-settle-row">
            <span>{{ adjustmentScopeLabel }}</span>
            <el-input-number v-model="adjustmentAmount" :min="0" :precision="2"
              controls-position="right" size="small" style="width:100px" @change="calcPay" />
          </div>
          <div class="cr-settle-row">
            <span>{{ $t('retail.cashRegister.checkoutAmount') }}</span>
            <el-input-number
              v-model="payAmount"
              :min="0"
              :precision="2"
              controls-position="right"
              size="small"
              style="width:120px"
              @update:model-value="onPayAmountChange"
            />
          </div>
          <div class="cr-pay-methods">
            <div v-for="m in payMethods" :key="m.value" class="cr-pay-btn"
              :class="{ active: payMethod === m.value }" @click="payMethod = m.value">
              {{ m.label }}
            </div>
          </div>
          <button class="cr-checkout-btn" :disabled="!cartItems.length || paying"
            @click="handleCheckout">
            <span v-if="paying">{{ $t('retail.cashRegister.processing') }}</span>
            <span v-else class="cr-checkout-label">
              <span>{{ $t('retail.cashRegister.checkout') }}</span>
              <span class="cr-checkout-price">¥{{ formatMoney(payAmount) }}</span>
            </span>
          </button>
        </div>
      </div>
    </div>

    <!-- ── 手机端：底部悬浮购物车栏 ── -->
    <div class="cr-float-bar" @click="cartItems.length && (cartDrawerOpen = !cartDrawerOpen)">
      <div class="cr-float-cart-icon" :class="{ 'has-items': cartItems.length }">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
        </svg>
        <span v-if="cartItems.length" class="cr-float-badge">{{ cartItems.length }}</span>
      </div>
      <div class="cr-float-info">
        <span v-if="!cartItems.length" class="cr-float-empty">{{ $t('retail.cashRegister.floatCartEmpty') }}</span>
        <span v-else class="cr-float-total">¥{{ formatMoney(payAmount) }}</span>
        <span v-if="cartItems.length" class="cr-float-count">{{ $t('retail.cashRegister.floatCartCount', { count: cartItems.reduce((s,i)=>s+i.num,0) }) }}</span>
      </div>
      <button v-if="cartItems.length" class="cr-float-checkout" :disabled="paying"
        @click.stop="handleCheckout">
        {{ paying ? $t('retail.cashRegister.processingShort') : $t('retail.cashRegister.checkoutShort') }}
      </button>
    </div>

    <!-- ── 主体 ── -->
    <div class="cr-body">
      <div class="cr-card">

        <!-- 左：购物车（桌面端） -->
        <div class="cr-left">
          <div class="cr-left-actions">
            <div class="cr-action-btn" @click="() => {}">{{ $t('retail.cashRegister.saveOrder') }}</div>
            <div class="cr-action-btn" @click="() => {}">{{ $t('retail.cashRegister.takeOrder') }}</div>
            <div class="cr-action-btn danger" @click="clearCart">{{ $t('retail.cashRegister.clearCart') }}</div>
          </div>
          <div class="cr-cart-area">
            <div v-if="cartItems.length === 0" class="cr-cart-empty">
              <div class="cr-empty-icon">🛒</div>
              <div class="cr-empty-text">{{ $t('retail.cashRegister.cartEmptyDesktop') }}</div>
            </div>
            <div v-else class="cr-cart-list">
              <div
                v-for="(item, idx) in displayCartItems"
                :key="idx"
                class="cr-cart-item"
                :class="{ active: pricingTargetIndex === idx }"
                @click="setPricingTarget(idx)"
              >
                <div class="cr-cart-item-top">
                  <div class="cr-cart-item-title">
                    <span class="cr-cart-item-name">{{ item.goods_name }}</span>
                    <span v-if="item.original_price !== item.price" class="cr-cart-item-price-note">
                      {{ $t('retail.cashRegister.originalPrice') }} ¥{{ formatMoney(item.original_price) }} → {{ $t('retail.cashRegister.dealPrice') }} ¥{{ formatMoney(item.price) }}
                    </span>
                  </div>
                  <el-button type="danger" link size="small" :icon="Delete"
                    @click.stop="removeCartItem(idx)" />
                </div>
                <div class="cr-cart-item-bottom">
                  <div class="cr-qty-ctrl">
                    <template v-if="item.is_bulk || / \d+\.?\d*g$/.test(item.goods_name)">
                      <button class="cr-gram-chip" @click.stop="openWeightCalcEdit(idx)">
                        {{ ((cartItems[idx].num) * (item.bulk_grams_per_base ?? 500)).toFixed(1) }}g ✎
                      </button>
                    </template>
                    <template v-else>
                      <button class="cr-qty-btn" @click.stop="changeQty(idx,-1)">−</button>
                      <el-input-number v-model="cartItems[idx].num" :min="0.001" :step="0.001" :precision="3"
                        controls-position="right" size="small" style="width:72px"
                        @change="calcTotal" />
                      <button class="cr-qty-btn" @click.stop="changeQty(idx,1)">+</button>
                    </template>
                  </div>
                  <div class="cr-cart-item-amounts">
                    <div class="cr-cart-item-price-row">
                      <span class="cr-cart-item-unit-label">{{ $t('retail.cashRegister.unitPrice') }}</span>
                      <el-input-number
                        v-model="cartItems[idx].price"
                        :min="0"
                        :precision="2"
                        :step="1"
                        controls-position="right"
                        size="small"
                        style="width:88px"
                        @change="calcTotal"
                        @click.stop
                      />
                    </div>
                    <div class="cr-cart-item-sub">
                      <span class="cr-cart-item-sub-label">{{ $t('retail.cashRegister.subtotal') }}</span>
                      <el-input-number
                        :model-value="item.line_amount"
                        :min="0.01" :precision="2" controls-position="right" size="small"
                        style="width:88px"
                        @change="(v: number) => changeSubtotal(idx, v)"
                        @click.stop
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 汇总 + 支付 -->
          <div class="cr-settle">
            <div class="cr-settle-row">
              <span>{{ $t('retail.cashRegister.orderDate') }}</span>
              <el-date-picker v-model="orderDate" type="date" value-format="YYYY-MM-DD"
                size="small" style="width:130px" :clearable="false" />
            </div>
            <div class="cr-settle-row">
              <span>{{ $t('retail.cashRegister.goodsTotal') }}</span>
              <span>¥{{ formatMoney(totalAmount) }}</span>
            </div>
            <div class="cr-settle-row">
              <span>{{ adjustmentScopeLabel }}</span>
              <el-input-number v-model="adjustmentAmount" :min="0" :precision="2"
                controls-position="right" size="small" style="width:100px" @change="calcPay" />
            </div>
            <div class="cr-settle-row">
              <span>{{ $t('retail.cashRegister.checkoutAmount') }}</span>
              <el-input-number
                v-model="payAmount"
                :min="0"
                :precision="2"
                controls-position="right"
                size="small"
                style="width:120px"
                @update:model-value="onPayAmountChange"
              />
            </div>
            <!-- 附加费用 -->
            <div class="cr-settle-row" style="align-items:flex-start;padding-top:4px">
              <span style="padding-top:6px">{{ $t('retail.cashRegister.extraFees') }}</span>
              <div style="flex:1">
                <div v-for="(fee, idx) in feeItems" :key="idx" style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                  <el-select v-model="fee.name" size="small" style="width:100px" filterable allow-create default-first-option :placeholder="$t('retail.cashRegister.feeTypePlaceholder')">
                    <el-option :label="$t('retail.cashRegister.feeTypeShipping')" value="shipping" />
                    <el-option :label="$t('retail.cashRegister.feeTypeDelivery')" value="delivery" />
                    <el-option :label="$t('retail.cashRegister.feeTypeHandling')" value="handling" />
                    <el-option :label="$t('retail.cashRegister.feeTypeOther')" value="other" />
                  </el-select>
                  <el-input-number v-model="fee.amount" :min="0" :precision="2" size="small" style="width:88px" :placeholder="$t('retail.cashRegister.feeAmountPlaceholder')" />
                  <el-button type="danger" link size="small" @click="feeItems.splice(idx,1)" style="padding:0;min-width:20px">×</el-button>
                </div>
                <el-button type="primary" link size="small" style="padding:0;font-size:12px" @click="feeItems.push(createDefaultRetailFeeItem())">{{ $t('retail.cashRegister.addFeeBtn') }}</el-button>
              </div>
            </div>
            <div v-if="feeItems.filter(f=>f.amount>0).length" class="cr-settle-row" style="font-weight:700;border-top:1px solid rgba(255,255,255,0.15);padding-top:8px;margin-top:4px">
              <span>{{ $t('retail.cashRegister.totalActual') }}</span>
              <span style="font-size:15px">¥{{ formatMoney(payAmount) }}</span>
            </div>
            <div class="cr-pay-methods">
              <div v-for="m in payMethods" :key="m.value" class="cr-pay-btn"
                :class="{ active: payMethod === m.value }" @click="payMethod = m.value">
                {{ m.label }}
              </div>
            </div>
            <button class="cr-checkout-btn" :disabled="!cartItems.length || paying"
              @click="handleCheckout">
              <span v-if="paying">{{ $t('retail.cashRegister.processing') }}</span>
              <span v-else class="cr-checkout-label">
                <span>{{ $t('retail.cashRegister.checkout') }}</span>
                <span class="cr-checkout-price">¥{{ formatMoney(payAmount) }}</span>
              </span>
            </button>
          </div>
        </div>

        <!-- 右：分类 + 商品 -->
        <div class="cr-right">
          <!-- 第一行：热销 + 全部 + 根分类 -->
          <div class="cr-cate-bar">
            <div class="cr-cate-tab" :class="{ active: activeCate === 'hot' }"
              @click="selectParentCate('hot')">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style="margin-right:3px"><path d="M12 2c0 0-6 6-6 12a6 6 0 0012 0c0-6-6-12-6-12z"/></svg>
              {{ $t('retail.cashRegister.hotProducts') }}
            </div>
            <div class="cr-cate-tab" :class="{ active: activeCate === '' && activePCate === '' }"
              @click="selectParentCate('')">{{ $t('retail.cashRegister.allCategories') }}</div>
            <div v-for="c in cateRoots" :key="c.id" class="cr-cate-tab"
              :class="{ active: activePCate === c.id || activeCate === c.id }"
              @click="selectParentCate(c.id)">
              {{ c.name }}
            </div>
          </div>
          <!-- 第二行：当前父分类的子分类 -->
          <div v-if="activePCateChildren.length" class="cr-cate-bar cr-cate-sub-bar">
            <div
              class="cr-cate-tab cr-cate-sub-tab"
              :class="{ active: activeCate === activePCate }"
              @click="activeCate = activePCate; loadGoods()"
            >{{ $t('retail.cashRegister.allSubcategories') }}</div>
            <div v-for="sub in activePCateChildren" :key="sub.id" class="cr-cate-tab cr-cate-sub-tab"
              :class="{ active: activeCate === sub.id }"
              @click="activeCate = sub.id; loadGoods()">
              {{ sub.name }}
            </div>
          </div>

          <div class="cr-goods-grid" v-loading="goodsLoading">
            <div v-for="g in goodsList" :key="g.id" class="cr-goods-card"
              @click="selectGoods(g)">
              <div class="cr-goods-name">{{ g.goods_name }}</div>
              <div class="cr-goods-prices">
                <span class="cr-goods-price">¥{{ Number(g.sell_price).toFixed(2) }}</span>
                <span v-if="Number(g.member_price) > 0" class="cr-goods-member-price">
                  ¥{{ Number(g.member_price).toFixed(2) }}{{ $t('retail.cashRegister.memberPrice') }}
                </span>
                <span v-if="isAdmin && Number(g.cost_price) > 0" class="cr-goods-cost-price">
                  {{ $t('retail.cashRegister.costPrice') }}¥{{ Number(g.cost_price).toFixed(2) }}
                </span>
              </div>
            </div>
            <div v-if="!goodsLoading && goodsList.length === 0" class="cr-goods-empty">
              <div>{{ $t('retail.cashRegister.noGoods') }}</div>
              <div class="cr-goods-empty-add" @click="openQuickAdd">
                <el-icon><Plus /></el-icon> {{ $t('retail.cashRegister.addNewGoods') }}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- 结算成功弹框 -->
    <el-dialog v-model="successVisible" :title="$t('retail.cashRegister.successTitle')" width="360px" align-center>
      <div style="text-align:center;padding:16px 0">
        <el-icon style="font-size:56px;color:#16a34a"><CircleCheckFilled /></el-icon>
        <div style="font-size:26px;font-weight:700;margin:14px 0 6px;color:#1d1d1f">
          ¥{{ formatMoney(lastPayAmount) }}
        </div>
        <div style="color:rgba(29,29,31,0.35);font-size:13px">{{ $t('retail.cashRegister.successOrderNo') }}{{ lastOrderNo }}</div>
      </div>
      <template #footer>
        <el-button type="primary" style="width:100%" @click="successVisible = false">
          {{ $t('retail.cashRegister.continueCashier') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 新建商品（含可选采购入库） -->
    <el-dialog v-model="quickAddVisible" :title="$t('retail.cashRegister.newGoodsTitle')" width="500px" align-center :close-on-click-modal="false">
      <div style="display:flex;flex-direction:column;gap:0;padding:4px 0">

        <!-- ── 商品信息 ── -->
        <el-form label-width="72px">
          <el-form-item :label="$t('retail.cashRegister.goodsName')" required>
            <el-input v-model="quickAddForm.goods_name" :placeholder="$t('retail.cashRegister.goodsNamePlaceholder')" clearable />
          </el-form-item>
          <el-form-item :label="$t('retail.cashRegister.sellPrice')" required>
            <el-input-number v-model="quickAddForm.sell_price" :min="0" :precision="2" :step="1"
              controls-position="right" style="width:100%" />
          </el-form-item>
          <el-form-item :label="$t('retail.cashRegister.costPriceLabel')">
            <el-input-number v-model="quickAddForm.cost_price" :min="0" :precision="2" :step="1"
              controls-position="right" style="width:100%" :placeholder="$t('retail.cashRegister.costPricePlaceholder')" />
          </el-form-item>
          <el-form-item :label="$t('retail.cashRegister.unit')" required>
            <el-select v-model="quickAddForm.unit_id" :placeholder="$t('retail.cashRegister.unitPlaceholder')" style="width:100%">
              <el-option v-for="u in unitList" :key="u.id" :label="u.name" :value="u.id" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('retail.cashRegister.category')">
            <el-select v-model="quickAddForm.cate_id" :placeholder="$t('retail.cashRegister.categoryPlaceholder')" clearable style="width:100%">
              <el-option v-for="c in cateTreeOptions" :key="c.id" :label="c.label" :value="c.id" />
            </el-select>
          </el-form-item>
          <el-form-item :label="$t('retail.cashRegister.barcode')">
            <el-input v-model="quickAddForm.barcode" :placeholder="$t('retail.cashRegister.barcodePlaceholder')" clearable />
          </el-form-item>
        </el-form>

        <!-- ── 采购入库（可选）── -->
        <div class="qa-procure-section">
          <div class="qa-procure-header" @click="quickAddForm.showProcure = !quickAddForm.showProcure">
            <div style="display:flex;align-items:center;gap:6px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
                <path d="M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2z"/>
                <path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/>
              </svg>
              <span>{{ $t('retail.cashRegister.procureSection') }}</span>
              <span class="qa-optional-badge">{{ $t('retail.cashRegister.procureOptional') }}</span>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              :style="quickAddForm.showProcure ? 'transform:rotate(180deg)' : ''" style="transition:0.2s">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>

          <div v-if="quickAddForm.showProcure" class="qa-procure-body">
            <el-form label-width="72px">
              <el-form-item :label="$t('retail.cashRegister.procureQty')" required>
                <el-input-number v-model="quickAddForm.procure_qty" :min="0" :precision="3" :step="1"
                  controls-position="right" style="width:100%" :placeholder="$t('retail.cashRegister.procureQtyPlaceholder')" />
              </el-form-item>
              <el-form-item :label="$t('retail.cashRegister.procurePrice')">
                <el-input-number v-model="quickAddForm.procure_price" :min="0" :precision="2" :step="1"
                  controls-position="right" style="width:100%"
                  @change="(v: number) => { quickAddForm.cost_price = v || 0 }" />
              </el-form-item>
              <el-form-item :label="$t('retail.cashRegister.procureSupplier')">
                <el-autocomplete
                  v-model="quickAddForm.procure_supplier"
                  :fetch-suggestions="(q: string, cb: any) => cb(supplierOptions.filter((s: any) => s.name.includes(q)).map((s: any) => ({ value: s.name })))"
                  :placeholder="$t('retail.cashRegister.procureSupplierPlaceholder')"
                  clearable style="width:100%"
                />
              </el-form-item>
              <el-form-item :label="$t('retail.cashRegister.procureWarehouse')">
                <el-select v-model="quickAddForm.procure_warehouse_id" :placeholder="$t('retail.cashRegister.procureWarehousePlaceholder')" style="width:100%"
                  @change="(id: number) => { const w = warehouseList.find((w: any) => w.id === id); quickAddForm.procure_warehouse_name = w?.name ?? '' }">
                  <el-option v-for="w in warehouseList" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </el-form-item>
              <el-form-item :label="$t('retail.cashRegister.procureDate')">
                <el-date-picker v-model="quickAddForm.procure_date" type="date" value-format="YYYY-MM-DD"
                  style="width:100%" :clearable="false" />
              </el-form-item>
            </el-form>
            <div class="qp-tip" style="margin-top:4px">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              {{ $t('retail.cashRegister.procureTip') }}
            </div>
          </div>
        </div>

      </div>
      <template #footer>
        <el-button @click="quickAddVisible = false">{{ $t('retail.cashRegister.cancel') }}</el-button>
        <el-button type="primary" :loading="quickAddSaving" @click="submitQuickAdd">
          {{ $t('retail.cashRegister.createAndAdd') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 克重计算器 -->
    <el-dialog v-model="weightCalcVisible" :title="$t('retail.cashRegister.weightCalcTitle')" width="340px" align-center @closed="wcEditIndex = null">
      <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0">
        <!-- 当前商品信息 -->
        <div v-if="wcGoodsName" style="background:#f8fafc;border-radius:10px;padding:12px 14px;display:flex;justify-content:space-between;align-items:center">
          <span style="font-size:13px;font-weight:600;color:#1e293b">{{ wcGoodsName }}{{ wcSpecLabel ? ' · ' + wcSpecLabel : '' }}</span>
          <span style="font-size:13px;color:#2563eb;font-weight:700">¥{{ wcPricePerJin }}/{{ wcGoodsUnit }}</span>
        </div>
        <!-- 无商品时提示 -->
        <div v-else style="font-size:12px;color:#94a3b8;text-align:center">
          {{ $t('retail.cashRegister.wcNoGoods') }}
        </div>
        <!-- 模式切换 -->
        <div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
          <div @click="wcMode='weight'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='weight' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            {{ $t('retail.cashRegister.wcModeWeight') }}
          </div>
          <div @click="wcMode='unit'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='unit' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            {{ $t('retail.cashRegister.wcModeUnit', { unit: wcGoodsUnit }) }}
          </div>
          <div @click="wcMode='amount'"
            style="flex:1;padding:7px 0;text-align:center;font-size:13px;cursor:pointer;transition:all 0.15s"
            :style="wcMode==='amount' ? 'background:#2563eb;color:#fff;font-weight:600' : 'color:#64748b;background:#f8fafc'">
            {{ $t('retail.cashRegister.wcModeAmount') }}
          </div>
        </div>
        <!-- 输入框 -->
        <div style="display:flex;align-items:center;gap:12px">
          <span style="width:64px;font-size:13px;color:#64748b;flex-shrink:0">
            {{ wcMode === 'weight' ? $t('retail.cashRegister.wcLabelWeight') : wcMode === 'unit' ? wcGoodsUnit : $t('retail.cashRegister.wcLabelAmount') }}
          </span>
          <el-input-number v-if="wcMode==='weight'" v-model="wcWeightGrams"
            :min="0" :precision="1" controls-position="right" style="flex:1" />
          <el-input-number v-else-if="wcMode==='unit'" v-model="wcDirectUnit"
            :min="0" :precision="4" controls-position="right" style="flex:1" />
          <el-input-number v-else v-model="wcTargetAmount"
            :min="0" :precision="2" controls-position="right" style="flex:1" />
        </div>
        <!-- 快捷选量（仅称重模式） -->
        <div v-if="wcMode==='weight'" style="display:flex;flex-wrap:wrap;gap:6px">
          <div v-for="preset in wcJinPresets" :key="preset.label"
            @click="wcWeightGrams = preset.grams"
            :style="wcWeightGrams === preset.grams
              ? 'background:#2563eb;color:#fff;border-color:#2563eb'
              : 'background:#f8fafc;color:#64748b;border-color:#e2e8f0'"
            style="padding:5px 12px;border:1.5px solid;border-radius:20px;font-size:13px;cursor:pointer;transition:all 0.12s;user-select:none">
            {{ preset.label }}
          </div>
        </div>
        <!-- 结果展示 -->
        <div style="background:#f0f9ff;border-radius:10px;padding:14px;text-align:center">
          <template v-if="wcMode==='weight'">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ $t('retail.cashRegister.wcDueAmount') }}</div>
            <div style="font-size:28px;font-weight:700;color:#2563eb">¥{{ wcAmount.toFixed(2) }}</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px">{{ wcWeightGrams }}g ÷ {{ wcGramsPerBaseUnit }} × ¥{{ wcPricePerJin }}/{{ wcGoodsUnit }}</div>
          </template>
          <template v-else-if="wcMode==='unit'">
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ $t('retail.cashRegister.wcDueAmount') }}</div>
            <div style="font-size:28px;font-weight:700;color:#2563eb">¥{{ (wcDirectUnit * wcPricePerJin).toFixed(2) }}</div>
          </template>
          <template v-else>
            <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ $t('retail.cashRegister.wcNeedWeight') }}</div>
            <div style="font-size:28px;font-weight:700;color:#059669">{{ wcReverseGrams.toFixed(1) }} g</div>
            <div style="font-size:12px;color:#94a3b8;margin-top:4px">¥{{ wcTargetAmount }} ÷ ¥{{ wcPricePerJin }}/{{ wcGoodsUnit }} × {{ wcGramsPerBaseUnit }}</div>
          </template>
        </div>
        <!-- 桶装快捷选项 -->
        <div v-if="wcAuxUnits.length" style="display:flex;flex-direction:column;gap:8px">
          <div style="font-size:12px;color:#64748b;font-weight:500">{{ $t('retail.cashRegister.wcPackageSell') }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <div v-for="u in wcAuxUnits" :key="u.unit_name"
              @click="addPackageToCart(u)"
              style="padding:8px 16px;background:#f0f9ff;border:1.5px solid #93c5fd;border-radius:20px;font-size:13px;cursor:pointer;transition:all 0.12s;user-select:none;color:#1d4ed8">
              {{ u.unit_name }}
              <span style="font-size:12px;color:#3b82f6;margin-left:4px">
                ¥{{ (u.sell_price && u.sell_price > 0 ? u.sell_price : wcPricePerJin * u.ratio).toFixed(2) }}
              </span>
            </div>
          </div>
        </div>
        <el-button type="primary"
          :disabled="(wcMode==='weight' ? wcAmount : wcMode==='unit' ? wcDirectUnit * wcPricePerJin : wcTargetAmount) <= 0 || !wcGoodsName"
          @click="addWeightItemToCart" style="width:100%">
          {{ wcEditIndex !== null ? $t('retail.cashRegister.wcUpdateWeight') : $t('retail.cashRegister.wcAddToCart') }}
        </el-button>
      </div>
    </el-dialog>

    <!-- 规格选择弹窗 -->
    <el-dialog v-model="specSelectVisible" :title="$t('retail.cashRegister.specSelectTitle')" width="340px" align-center>
      <div style="display:flex;flex-direction:column;gap:16px;padding:8px 0">
        <!-- 商品名 -->
        <div style="background:#f8fafc;border-radius:10px;padding:12px 14px">
          <span style="font-size:13px;font-weight:600;color:#1e293b">{{ ssGoods?.goods_name }}</span>
        </div>
        <!-- 每个规格属性 -->
        <div v-for="(attr, idx) in ssSpecAttrs" :key="idx" style="display:flex;flex-direction:column;gap:8px">
          <div style="font-size:12px;color:#64748b;font-weight:500">{{ attr.name }}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px">
            <div v-for="val in attr.values" :key="val"
              @click="ssSelectVal(idx, val)"
              :style="ssSelectedVals[idx] === val
                ? 'background:#2563eb;color:#fff;border-color:#2563eb'
                : 'background:#f8fafc;color:#64748b;border-color:#e2e8f0'"
              style="padding:6px 16px;border:1.5px solid;border-radius:20px;font-size:13px;cursor:pointer;transition:all 0.12s;user-select:none">
              {{ val }}
            </div>
          </div>
        </div>
        <!-- 无规格数据提示 -->
        <div v-if="!ssSpecAttrs.length" style="font-size:13px;color:#94a3b8;text-align:center;padding:12px 0">
          {{ $t('retail.cashRegister.specNoConfig') }}
        </div>
        <!-- 价格预览 -->
        <div v-if="ssSpecLabel" style="background:#f0f9ff;border-radius:10px;padding:14px;text-align:center">
          <div style="font-size:12px;color:#64748b;margin-bottom:4px">{{ ssSpecLabel }}</div>
          <div style="font-size:28px;font-weight:700;color:#2563eb">
            ¥{{ (ssCurrentSku?.sell_price != null ? Number(ssCurrentSku.sell_price) : Number(ssGoods?.sell_price || 0)).toFixed(2) }}
          </div>
        </div>
        <el-button type="primary"
          :disabled="ssSelectedVals.some(v => !v) || !ssSpecAttrs.length"
          @click="addSpecItemToCart" style="width:100%">
          {{ $t('retail.cashRegister.specAddToCart') }}
        </el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Search, Delete, CircleCheckFilled, Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { getGoodsList, getGoodsCateList, getUnitConvert, createGoods, getUnitList, readGoods, getSpecList, getBomList } from '@/api/goods'
import { getMemberList, createRetailOrder, getRetailOrderList, getStoreList } from '@/api/retail'
import { getSaleContractList } from '@/api/reports'
import { createProcureOrder, auditProcureOrder, createProcureInhouse, auditProcureInhouse, getSupplierList, createSupplier } from '@/api/procure'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { adjustFundBalance } from '@/utils/fund'
import { RETAIL_FUND_NAME } from '@/config'
import { useStockRefreshStore } from '@/stores/stockRefresh'
import { stockEffect } from '@/utils/stockEffect'
import { usePermissionStore } from '@/stores/permission'
import { distributeRetailItems, normalizeRetailSettlement } from '@/utils/retailPricing'

const { t } = useI18n()

const isAdmin = computed(() => !usePermissionStore().isSubAccount)

// ── 商品 ──────────────────────────────────────────────────────────────────────
const keyword = ref('')
const activeCate = ref<any>('hot')
const activePCate = ref<any>('')  // 当前选中的父分类 ID
const goodsList = ref<any[]>([])
const stockRefreshStore = useStockRefreshStore()
const goodsLoading = ref(false)
const selectedGoods = ref<any>(null)
const salesCount = ref<Record<string, number>>({})

// 分类树计算
const cateRoots = computed(() => cateList.value.filter((c: any) => !c.parent_id || c.parent_id === 0))

// 分类树：递归拍平，按层级加缩进前缀，支持任意深度
const cateTreeOptions = computed(() => {
  const result: any[] = []
  function walk(parentId: number | null, depth: number) {
    const nodes = cateList.value.filter((c: any) =>
      depth === 0 ? (!c.parent_id || c.parent_id === 0) : c.parent_id === parentId
    )
    for (const node of nodes) {
      result.push({
        id: node.id,
        label: depth === 0 ? node.name : ('　'.repeat(depth) + '└ ' + node.name),
        depth,
      })
      walk(node.id, depth + 1)
    }
  }
  walk(null, 0)
  return result
})
const activePCateChildren = computed(() => {
  if (!activePCate.value) return []
  return cateList.value.filter((c: any) => c.parent_id === activePCate.value)
})

function selectParentCate(id: any) {
  activePCate.value = id === 'hot' || id === '' ? '' : id
  activeCate.value = id
  if (id === 'hot') loadHotGoods()
  else loadGoods()
}

// 手机端购物车抽屉
const cartDrawerOpen = ref(false)

// 点击商品卡片：散装+规格→先选规格再称重；纯规格→规格弹窗；纯散装→称重弹窗；普通→直接加购物车
function selectGoods(g: any) {
  selectedGoods.value = g
  const isSpec = Number(g.multi_spec) === 1
  const isBulk = Number(g.goods_type) === 5
  if (isSpec && isBulk) {
    ssWeighAfter.value = true
    openSpecSelect(g)
  } else if (isSpec) {
    ssWeighAfter.value = false
    openSpecSelect(g)
  } else if (isBulk) {
    openWeightCalc(g)
  } else {
    addToCart(g)
  }
}

// ── 规格选择弹窗 ──────────────────────────────────────────────────────────────
const specSelectVisible = ref(false)
const ssGoods = ref<any>(null)
const ssSpecAttrs = ref<{ name: string; values: string[] }[]>([])
const ssSelectedVals = ref<string[]>([])
const ssSkuMap = ref<Record<string, any>>({})
const ssWeighAfter = ref(false) // 散装+规格：选完规格后进称重弹窗

const ssCurrentSku = computed(() => {
  const key = ssSelectedVals.value.join('|')
  return ssSkuMap.value[key] ?? null
})

const ssSpecLabel = computed(() => ssSelectedVals.value.filter(Boolean).join(' · '))

async function openSpecSelect(g: any) {
  ssGoods.value = g
  ssSpecAttrs.value = []
  ssSkuMap.value = {}
  ssSelectedVals.value = []
  specSelectVisible.value = true

  // 从后端拉完整商品数据（列表接口可能不返回 spec 大字段）
  let specSource = g.spec || ''
  try {
    const res = await readGoods(g.id)
    specSource = res.data?.spec || specSource
  } catch {}

  let loaded = false
  try {
    if (specSource) {
      const specData = JSON.parse(specSource)
      if (Array.isArray(specData.attrs) && specData.attrs.length > 0) {
        ssSpecAttrs.value = specData.attrs.filter((a: any) => a.values?.length > 0)
        ssSkuMap.value = specData.skus ?? {}
        loaded = true
      }
    }
  } catch {}

  if (!loaded) {
    // 兜底1：localStorage（同设备且已设置过规格）
    try {
      const attrsMap = JSON.parse(localStorage.getItem('erp_spec_attrs') || '{}')
      const localAttrs = (attrsMap[g.id] ?? []).filter((a: any) => a.values?.length > 0)
      if (localAttrs.length > 0) {
        ssSpecAttrs.value = localAttrs
        try {
          const skuMap = JSON.parse(localStorage.getItem('erp_sku_map') || '{}')
          ssSkuMap.value = skuMap[g.id] ?? {}
        } catch { ssSkuMap.value = {} }
        loaded = true
      }
    } catch {}
  }

  if (!loaded) {
    // 兜底2：从 ShopSpec 结构化表读规格属性（不含SKU价格）
    try {
      const specRes = await getSpecList({ goods_id: g.id, list_rows: 100 })
      const specRows: any[] = specRes.data?.rows ?? []
      if (specRows.length > 0) {
        ssSpecAttrs.value = specRows.map((r: any) => ({
          name: r.name,
          values: typeof r.values === 'string' ? r.values.split(',').map((v: string) => v.trim()).filter(Boolean) : (r.values ?? []),
        })).filter((a: any) => a.values.length > 0)
      }
    } catch {}
  }

  ssSelectedVals.value = ssSpecAttrs.value.map(() => '')
}

function ssSelectVal(attrIdx: number, val: string) {
  ssSelectedVals.value[attrIdx] = val
}

function addSpecItemToCart() {
  const sku = ssCurrentSku.value
  const g = ssGoods.value
  if (!g) return
  const specLabel = ssSpecLabel.value
  specSelectVisible.value = false

  // 散装+规格：选完规格后进入称重弹窗，把规格标签带进去
  if (ssWeighAfter.value) {
    ssWeighAfter.value = false
    const price = sku?.sell_price != null ? Number(sku.sell_price) : Number(g.sell_price) || 0
    openWeightCalc(g, specLabel, price)
    return
  }

  const price = sku?.sell_price != null ? Number(sku.sell_price) : (selectedMemberId.value && Number(g.member_price) > 0 ? Number(g.member_price) : Number(g.sell_price) || 0)
  const goodsName = specLabel ? `${g.goods_name} · ${specLabel}` : g.goods_name
  const skuKey = ssSelectedVals.value.join('|')
  cartItems.push({
    goods_id: g.id,
    goods_name: goodsName,
    goods_sn: sku?.sku_sn || g.goods_sn || '',
    unit_name: g.unit_name || '',
    price: Math.round(price * 100) / 100,
    cost_price: sku?.cost_price != null ? Number(sku.cost_price) : Number(g.cost_price || 0),
    num: 1,
    _sku_key: skuKey,
  } as any)
  pricingTargetIndex.value = cartItems.length - 1
  calcTotal()
  ElMessage.success(t('retail.cashRegister.specAdded', { name: goodsName }))
}
const cateList = ref<any[]>([])
const searchInputRef = ref<HTMLInputElement>()
let searchTimer: any

// BOM成品的成本映射：goods_sn → BOM汇总成本
const bomCostMap = ref<Map<string, number>>(new Map())

async function loadBomCosts() {
  try {
    const res = await getBomList({ list_rows: 500 })
    const entries: any[] = res.data?.list ?? res.data?.rows ?? []
    if (!entries.length) return
    const details = await Promise.all(
      entries.map(b => http.get('/goods/BomGoods/detail', { params: { id: b.id } }).catch(() => null))
    )
    const map = new Map<string, number>()
    entries.forEach((b, i) => {
      const items: any[] = details[i]?.data?.items ?? []
      const total = items.reduce((s: number, it: any) => s + Number(it.num || 0) * Number(it.price || 0), 0)
      if (b.goods_sn) map.set(b.goods_sn, total)
    })
    bomCostMap.value = map
    applyBomCosts()
  } catch { /* silent */ }
}

function applyBomCosts() {
  const map = bomCostMap.value
  if (!map.size) return
  for (const g of goodsList.value) {
    if (g.goods_sn && map.has(g.goods_sn)) {
      g.cost_price = map.get(g.goods_sn)
    }
  }
}

async function loadGoods() {
  goodsLoading.value = true
  try {
    const res = await getGoodsList({
      keyword: keyword.value || undefined,
      cate_id: activeCate.value || undefined,
      status: 1,
      list_rows: 60,
    })
    const rows: any[] = res.data?.rows ?? []
    // 按热销排序，成品(type=1)优先，散装(type=5)最后
    const typeOrder = (t: number) => t === 1 ? 0 : t === 5 ? 2 : 1
    rows.sort((a, b) => {
      const ta = typeOrder(Number(a.goods_type))
      const tb = typeOrder(Number(b.goods_type))
      if (ta !== tb) return ta - tb
      const ca = salesCount.value[String(a.id)] || 0
      const cb = salesCount.value[String(b.id)] || 0
      return cb - ca
    })
    goodsList.value = rows
    applyBomCosts()
  } finally {
    goodsLoading.value = false
  }
}

// 热销产品：从零售单统计实际销量，按销量排序商品
async function loadHotGoods() {
  goodsLoading.value = true
  try {
    // 全部商品（500条），+ 近期零售订单（500条，后端不支持 status 过滤，前端筛）
    const [goodsRes, retailRes] = await Promise.all([
      getGoodsList({ list_rows: 500 }),
      getRetailOrderList({ list_rows: 500 }).catch(() => ({ data: { rows: [] } })),
    ])
    const allGoods: any[] = goodsRes.data?.rows ?? []

    // 仅统计已审核/已完成订单（status === 1）
    const orders: any[] = (retailRes.data?.rows ?? []).filter((o: any) => Number(o.status) === 1)

    salesCount.value = {}
    for (const order of orders) {
      try {
        const items = typeof order.goods_info === 'string'
          ? JSON.parse(order.goods_info)
          : (order.goods_info ?? [])
        for (const item of items) {
          if (!item.goods_id) continue
          const gid = String(item.goods_id)
          salesCount.value[gid] = (salesCount.value[gid] || 0) + Math.max(0, Number(item.num || 1))
        }
      } catch { /* 单条订单解析失败不影响整体 */ }
    }

    // 有销量的排前面（降序），无销量的按商品ID排后面
    allGoods.sort((a, b) => {
      const ca = salesCount.value[String(a.id)] || 0
      const cb = salesCount.value[String(b.id)] || 0
      if (cb !== ca) return cb - ca
      return a.id - b.id
    })
    goodsList.value = allGoods
    applyBomCosts()
  } finally {
    goodsLoading.value = false
  }
}

function onSearch() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    if (activeCate.value === 'hot') { activePCate.value = ''; activeCate.value = '' }
    loadGoods()
  }, 300)
}

function focusSearch() {
  searchInputRef.value?.focus()
}

// 条形码扫描：按回车键触发精准匹配
function onBarcodeEnter() {
  const code = keyword.value.trim()
  if (!code) return
  // Try exact barcode match from loaded goods
  const match = goodsList.value.find(g => g.goods_sn === code || g.barcode === code)
  if (match) {
    addToCart(match)
    keyword.value = ''
    ElMessage.success(t('retail.cashRegister.barcodeAdded', { name: match.goods_name }))
    return
  }
  // Try search
  clearTimeout(searchTimer)
  loadGoods()
}

// ── 购物车 ────────────────────────────────────────────────────────────────────
interface CartItem { goods_id: number; goods_name: string; goods_sn: string; unit_name: string; price: number; num: number; cost_price?: number; unit_ratio?: number; is_bulk?: boolean; bulk_grams_per_base?: number }

const cartItems = reactive<CartItem[]>([])

// 门店
const storeList = ref<any[]>([])
const selectedStoreId = ref<number | null>(null)
const selectedStore = computed(() => storeList.value.find((s: any) => s.id === selectedStoreId.value))
function onStoreChange(id: number) {
  localStorage.setItem('cr_store_id', String(id ?? ''))
}
const totalAmount = ref(0)
const discountAmount = ref(0)
const payAmount = ref(0)
const RETAIL_FEE_TYPE_MAP: Record<string, string> = {
  shipping: 'shipping',
  '运费': 'shipping',
  delivery: 'delivery',
  '跑腿费': 'delivery',
  handling: 'handling',
  '装卸费': 'handling',
  other: 'other',
  '其他费用': 'other',
}

function normalizeRetailFeeTypeName(name: any): string {
  const raw = String(name || '').trim()
  return RETAIL_FEE_TYPE_MAP[raw] || raw
}

function createDefaultRetailFeeItem() {
  return { name: 'shipping', amount: 0, bearer: 'buyer' }
}

const feeItems = reactive<{ name: string; amount: number; bearer: string }[]>([])

function normalizedRetailFeeItems() {
  return feeItems
    .filter(fee => fee.name && fee.amount > 0)
    .map(fee => ({
      ...fee,
      name: normalizeRetailFeeTypeName(fee.name),
    }))
}
const pricingTargetIndex = ref<number | null>(null)
const displayCartItems = computed(() => distributeRetailItems(cartItems, payAmount.value, {
  targetIndex: pricingTargetIndex.value,
}).items)
const adjustmentLabel = computed(() => discountAmount.value < 0 ? t('retail.cashRegister.markupLabel') : t('retail.cashRegister.discountLabel'))
const adjustmentScopeLabel = computed(() => t('retail.cashRegister.adjustmentLabel', {
  type: adjustmentLabel.value,
  scope: pricingTargetIndex.value === null ? t('retail.cashRegister.wholeOrder') : t('retail.cashRegister.currentGoods'),
}))
const adjustmentAmount = computed({
  get: () => Math.abs(Number(discountAmount.value || 0)),
  set: (value: number) => {
    const amount = Math.max(0, Number(value || 0))
    discountAmount.value = payAmount.value > totalAmount.value ? -amount : amount
  },
})

function addToCart(g: any) {
  const exist = cartItems.find(i => i.goods_id === g.id)
  if (exist) {
    exist.num++
    pricingTargetIndex.value = cartItems.findIndex(i => i.goods_id === g.id)
    calcTotal()
    return
  }
  // 有会员时使用会员价，价格截断到2位小数避免浮点误差
  const rawPrice = selectedMemberId.value && Number(g.member_price) > 0
    ? Number(g.member_price)
    : Number(g.sell_price) || 0
  const usePrice = Math.round(rawPrice * 100) / 100
  cartItems.push({
    goods_id: g.id,
    goods_name: g.goods_name,
    goods_sn: g.goods_sn || '',
    unit_name: g.unit_name || '',
    price: usePrice,
    cost_price: Number(g.cost_price || 0),
    num: 1,
  })
  pricingTargetIndex.value = cartItems.length - 1
  calcTotal()
  // 手机端：加入购物车后短暂提示，不自动跳转（让用户继续选商品）
}

function setPricingTarget(idx: number) {
  pricingTargetIndex.value = pricingTargetIndex.value === idx ? null : idx
}

function changeQty(idx: number, delta: number) {
  pricingTargetIndex.value = idx
  cartItems[idx].num = Math.max(0.001, parseFloat((cartItems[idx].num + delta).toFixed(3)))
  calcTotal()
}

function changeSubtotal(idx: number, newSubtotal: number) {
  const qty = cartItems[idx]?.num
  if (!qty || qty <= 0 || !newSubtotal) return
  cartItems[idx].price = Math.round(newSubtotal / qty * 100) / 100
  calcTotal()
}

function removeCartItem(idx: number) {
  cartItems.splice(idx, 1)
  if (pricingTargetIndex.value === null) {
    calcTotal()
    return
  }
  if (pricingTargetIndex.value === idx) {
    pricingTargetIndex.value = cartItems.length ? Math.min(idx, cartItems.length - 1) : null
  } else if (pricingTargetIndex.value > idx) {
    pricingTargetIndex.value -= 1
  }
  calcTotal()
}

function calcTotal() {
  totalAmount.value = Math.round(cartItems.reduce((s, i) => s + i.num * i.price, 0) * 100) / 100
  const settlement = normalizeRetailSettlement(totalAmount.value, totalAmount.value - discountAmount.value)
  payAmount.value = settlement.payAmount
  discountAmount.value = settlement.discountAmount
}

function calcPay() {
  const settlement = normalizeRetailSettlement(totalAmount.value, (Number(totalAmount.value) || 0) - (Number(discountAmount.value) || 0))
  payAmount.value = settlement.payAmount
  discountAmount.value = settlement.discountAmount
}

function onPayAmountChange(v: number | null | undefined) {
  pricingTargetIndex.value = null  // 改结账金额时整单比例分摊，不优先扣选中商品
  const settlement = normalizeRetailSettlement(totalAmount.value, Number(v || 0))
  payAmount.value = settlement.payAmount
  discountAmount.value = settlement.discountAmount
}

function formatMoney(value: unknown) {
  return (Number(value) || 0).toFixed(2)
}

function clearCart() {
  cartItems.splice(0)
  feeItems.splice(0)
  pricingTargetIndex.value = null
  discountAmount.value = 0
  totalAmount.value = 0
  payAmount.value = 0
  selectedMemberId.value = null
  selectedMember.value = null
}

// ── 会员 ──────────────────────────────────────────────────────────────────────
const memberList = ref<any[]>([])
const selectedMemberId = ref<any>(null)
const selectedMember = ref<any>(null)

function onMemberChange(id: any) {
  selectedMember.value = memberList.value.find(m => m.id === id) ?? null
}

// ── 单据日期 ──────────────────────────────────────────────────────────────────
const orderDate = ref(new Date().toLocaleDateString('sv-SE'))

// ── 支付方式 ──────────────────────────────────────────────────────────────────
const payMethods = computed(() => [
  { label: t('retail.cashRegister.payMethodCash'), value: 'cash' },
  { label: t('retail.cashRegister.payMethodWechat'), value: 'wechat' },
  { label: t('retail.cashRegister.payMethodAlipay'), value: 'alipay' },
  { label: t('retail.cashRegister.payMethodBalance'), value: 'balance' },
  { label: t('retail.cashRegister.payMethodCard'), value: 'card' },
])
const payMethod = ref('cash')

// ── 结算 ──────────────────────────────────────────────────────────────────────
const paying = ref(false)
const successVisible = ref(false)
const lastPayAmount = ref(0)
const lastOrderNo = ref('')

// 零售库存变动：deduct=扣减，restore=加回
async function retailStockEffect(items: any[], mode: 'deduct' | 'restore', orderId?: number) {
  const remark = mode === 'deduct' ? (orderId ? `Retail outbound#${orderId}` : 'Retail outbound') : 'Retail return inbound'
  await stockEffect(items, mode, undefined, remark)
}

function extractRows(res: any): any[] {
  if (Array.isArray(res?.data?.rows)) return res.data.rows
  if (Array.isArray(res?.data?.list)) return res.data.list
  if (Array.isArray(res?.data?.data?.rows)) return res.data.data.rows
  if (Array.isArray(res?.data?.data?.list)) return res.data.data.list
  if (Array.isArray(res?.rows)) return res.rows
  if (Array.isArray(res?.list)) return res.list
  return []
}

async function handleCheckout() {
  if (!cartItems.length) { ElMessage.warning(t('retail.cashRegister.cartEmptyWarning')); return }
  // 会员余额支付验证
  if (payMethod.value === 'balance') {
    if (!selectedMemberId.value || !selectedMember.value) {
      ElMessage.warning(t('retail.cashRegister.memberRequired'))
      return
    }
    const memberBalance = Number(selectedMember.value.balance || 0)
    if (memberBalance < payAmount.value) {
      ElMessage.warning(t('retail.cashRegister.memberBalanceInsufficient', { balance: memberBalance.toFixed(2), required: payAmount.value.toFixed(2) }))
      return
    }
  }
  paying.value = true
  try {
    const storeIdNum = Number(selectedStoreId.value)
    const memberIdNum = Number(selectedMemberId.value)
    const settled = distributeRetailItems(cartItems, payAmount.value, {
      targetIndex: pricingTargetIndex.value,
    })
    const res = await createRetailOrder({
      order_date: orderDate.value,
      member_id: Number.isFinite(memberIdNum) && memberIdNum > 0 ? memberIdNum : 0,
      member_name: selectedMember.value?.name ?? '',
      store_id: Number.isFinite(storeIdNum) && storeIdNum > 0 ? storeIdNum : 0,
      store_name: selectedStore.value?.name ?? '',
      total_amount: settled.totalAmount,
      discount_amount: settled.discountAmount,
      pay_amount: settled.payAmount,
      pay_method: payMethod.value,
      pay_type: payMethod.value,
      goods_info: JSON.stringify(settled.items),
      fee_items: JSON.stringify(normalizedRetailFeeItems()),
      status: 1,
    })
    if (!res?.data?.id && !res?.data?.order_no && !res?.data?.order_sn) {
      throw new Error(t('retail.cashRegister.orderCreateUnexpected'))
    }
    const createdId = Number(res.data?.id || 0)
    const check = await getRetailOrderList({ list_rows: 200 })
    const rows: any[] = extractRows(check)
    const created = rows.find((r: any) =>
      (createdId > 0 && Number(r.id) === createdId)
    )
    if (!created) {
      throw new Error(t('retail.cashRegister.checkoutOrderMissing'))
    }
    const feesTotal = normalizedRetailFeeItems().reduce((s, f) => s + Number(f.amount), 0)
    lastPayAmount.value = settled.payAmount
    lastOrderNo.value = created.order_sn || created.id || res.data?.order_no || res.data?.id || ''
    // 收银台扣减库存
    try {
      await retailStockEffect(cartItems, 'deduct', createdId || 0)
    } catch {
      ElMessage.warning(t('retail.cashRegister.stockDeductFail'))
    }
    // 更新资金账户：商品实付（附加费用由我方承担，不计入客户收款）
    try {
      await adjustFundBalance({
        fundName: RETAIL_FUND_NAME,
        delta: settled.payAmount,
        allowCreate: true,
      })
    } catch { /* 资金更新失败不阻塞 */ }
    stockRefreshStore.trigger()
    clearCart()
    successVisible.value = true
  } catch (e: any) {
    const msg = e?.message ?? ''
    // 503 already shows a warning toast from http.ts — don't duplicate
    if (!msg.includes('503') && !msg.includes('正在启动')) {
      ElMessage.error(msg || t('retail.cashRegister.checkoutFailed'))
    }
  } finally {
    paying.value = false
  }
}

// ── 新建商品（含可选采购入库）────────────────────────────────────────────────
const warehouseList = ref<any[]>([])
const supplierOptions = ref<any[]>([])

// ── 克重计算器 ────────────────────────────────────────────────────────────────
const weightCalcVisible = ref(false)
const wcGoodsId = ref<any>(null)
const wcGoodsName = ref('')
const wcSpecLabel = ref('') // 散装+规格时携带的规格标签
const wcGoodsUnit = ref('斤')
const wcPricePerJin = ref(0)
const wcGramsPerBaseUnit = ref(500)
const wcAuxUnits = ref<{ unit_name: string; ratio: number; sell_price?: number; cost_price?: number; linked_goods_id?: number; linked_goods_name?: string }[]>([]) // 换算表里 g 对应基础单位的克数，默认500g=1斤
const wcMode = ref<'weight' | 'unit' | 'amount'>('weight')
const wcWeightGrams = ref(0)    // 正向：输入克数
const wcDirectUnit = ref(0)     // 直接输斤数
const wcTargetAmount = ref(0)   // 反向：输入金额
const wcEditIndex = ref<number | null>(null)  // 编辑已有散装购物车项时的 index
// 正向：克数 → 金额
const wcAmount = computed(() => {
  if (!wcPricePerJin.value || !wcWeightGrams.value) return 0
  return (wcWeightGrams.value / wcGramsPerBaseUnit.value) * wcPricePerJin.value
})
// 反向：金额 → 克数
const wcReverseGrams = computed(() => {
  if (!wcPricePerJin.value || !wcTargetAmount.value) return 0
  return (wcTargetAmount.value / wcPricePerJin.value) * wcGramsPerBaseUnit.value
})
// 快捷选量预设：半斤 + 1~5 整斤
const wcJinPresets = computed(() => {
  const base = wcGramsPerBaseUnit.value || 500
  return [
    { label: t('retail.cashRegister.wcPresetHalfJin'), grams: base * 0.5 },
    { label: t('retail.cashRegister.wcPreset1Jin'), grams: base * 1 },
    { label: t('retail.cashRegister.wcPreset2Jin'), grams: base * 2 },
    { label: t('retail.cashRegister.wcPreset3Jin'), grams: base * 3 },
    { label: t('retail.cashRegister.wcPreset4Jin'), grams: base * 4 },
    { label: t('retail.cashRegister.wcPreset5Jin'), grams: base * 5 },
  ]
})

async function openWeightCalc(g?: any, specLabel?: string, overridePrice?: number) {
  const target = g ?? selectedGoods.value
  wcGoodsId.value = target?.id ?? null
  wcGoodsName.value = target?.goods_name ?? ''
  wcSpecLabel.value = specLabel || ''
  wcGoodsUnit.value = target?.unit_name || '斤'
  wcPricePerJin.value = overridePrice != null ? overridePrice : (target ? Number(target.sell_price) || 0 : 0)
  wcGramsPerBaseUnit.value = 500 // 先 reset 默认值
  wcAuxUnits.value = []
  // 从换算表加载单位换算比例
  if (target?.id) {
    try {
      const res = await getUnitConvert(target.id)
      const units: any[] = res.data?.rows ?? []
      const gUnit = units.find((u: any) => u.unit_name === 'g')
      if (gUnit) {
        const r = Number(gUnit.ratio)
        wcGramsPerBaseUnit.value = r > 1 ? r : (r > 0 ? 1 / r : 500)
      }
      // 非 g 的辅助单位作为桶装快捷选项，优先使用关联BOM成品的价格
      const specObj = (() => { try { return JSON.parse(target.spec || '{}') } catch { return {} } })()
      const unitLinked: Record<string, { id: number; name: string }> = specObj.unit_linked_goods || {}
      wcAuxUnits.value = units
        .filter((u: any) => u.unit_name !== 'g')
        .map((u: any) => {
          const linked = unitLinked[u.unit_name]
          const linkedGoods = linked?.id ? goodsList.value.find((g: any) => g.id === linked.id) : null
          return {
            unit_name: u.unit_name,
            ratio: Number(u.ratio),
            sell_price: linkedGoods ? Number(linkedGoods.sell_price) || 0 : Number(u.sell_price) || 0,
            cost_price: linkedGoods ? Number(linkedGoods.cost_price) || 0 : Number(u.cost_price) || 0,
            linked_goods_id: linked?.id,
            linked_goods_name: linked?.name,
          }
        })
    } catch { /* 加载失败不影响散装称重 */ }
  }
  wcMode.value = 'weight'
  wcWeightGrams.value = 0
  wcDirectUnit.value = 0
  wcTargetAmount.value = 0
  weightCalcVisible.value = true
}

// 重新编辑购物车里某个散装商品的克重
async function openWeightCalcEdit(idx: number) {
  const item = cartItems[idx]
  const gramsPerBase = item.bulk_grams_per_base ?? 500
  wcGoodsId.value = item.goods_id
  wcGoodsName.value = item.goods_name.replace(/ \d+\.?\d*g$/, '')
  wcSpecLabel.value = ''
  wcGoodsUnit.value = item.unit_name || '斤'
  wcGramsPerBaseUnit.value = gramsPerBase
  wcPricePerJin.value = item.price
  wcWeightGrams.value = parseFloat((item.num * gramsPerBase).toFixed(1))
  wcDirectUnit.value = 0
  wcTargetAmount.value = 0
  wcMode.value = 'weight'
  wcAuxUnits.value = []
  wcEditIndex.value = idx
  // 加载换算单位
  if (item.goods_id && item.goods_id > 0) {
    try {
      const res = await getUnitConvert(item.goods_id)
      const units: any[] = res.data?.rows ?? []
      wcAuxUnits.value = units
        .filter((u: any) => u.unit_name !== 'g')
        .map((u: any) => ({ unit_name: u.unit_name, ratio: Number(u.ratio), sell_price: Number(u.sell_price) || 0, cost_price: Number(u.cost_price) || 0 }))
    } catch {}
  }
  weightCalcVisible.value = true
}

function addWeightItemToCart() {
  let finalAmount: number, finalGrams: number
  if (wcMode.value === 'weight') {
    finalAmount = wcAmount.value
    finalGrams = wcWeightGrams.value
  } else if (wcMode.value === 'unit') {
    finalGrams = wcDirectUnit.value * wcGramsPerBaseUnit.value
    finalAmount = wcDirectUnit.value * wcPricePerJin.value
  } else {
    finalAmount = wcTargetAmount.value
    finalGrams = wcReverseGrams.value
  }
  if (finalAmount <= 0) return
  const baseName = wcGoodsName.value || t('retail.cashRegister.bulkItem')
  const name = wcSpecLabel.value ? `${baseName} · ${wcSpecLabel.value}` : baseName
  const newNum = parseFloat((finalGrams / wcGramsPerBaseUnit.value).toFixed(4))
  if (wcEditIndex.value !== null) {
    // 更新已有购物车项
    const item = cartItems[wcEditIndex.value]
    item.goods_name = `${name} ${finalGrams.toFixed(1)}g`
    item.price = wcPricePerJin.value
    item.num = newNum
    item.bulk_grams_per_base = wcGramsPerBaseUnit.value
    pricingTargetIndex.value = wcEditIndex.value
    wcEditIndex.value = null
    ElMessage.success(t('retail.cashRegister.weightUpdated'))
  } else {
    cartItems.push({
      goods_id: wcGoodsId.value ?? -1,
      goods_name: `${name} ${finalGrams.toFixed(1)}g`,
      goods_sn: '',
      unit_name: wcGoodsUnit.value,
      price: wcPricePerJin.value,
      cost_price: Number(goodsList.value.find((g: any) => g.id === wcGoodsId.value)?.cost_price || 0),
      num: newNum,
      is_bulk: true,
      bulk_grams_per_base: wcGramsPerBaseUnit.value,
    })
    pricingTargetIndex.value = cartItems.length - 1
    ElMessage.success(t('retail.cashRegister.weightAdded'))
  }
  calcTotal()
  weightCalcVisible.value = false
  wcGoodsId.value = null
  wcGoodsName.value = ''
  wcSpecLabel.value = ''
  wcGoodsUnit.value = '斤'
  wcGramsPerBaseUnit.value = 500
  wcPricePerJin.value = 0
  wcWeightGrams.value = 0
  wcTargetAmount.value = 0
}

// 按桶装单位加购物车
function addPackageToCart(unit: { unit_name: string; ratio: number; sell_price?: number; cost_price?: number; linked_goods_id?: number; linked_goods_name?: string }) {
  const g = goodsList.value.find((x: any) => x.id === wcGoodsId.value)
  const price = unit.sell_price && unit.sell_price > 0
    ? unit.sell_price
    : Math.round(wcPricePerJin.value * unit.ratio * 100) / 100
  // 有关联BOM成品 → 扣成品库存；否则 → 扣基础商品（按ratio换算）
  const linkedSpec = (() => {
    try { return JSON.parse(g?.spec || '{}').unit_linked_goods?.[unit.unit_name] } catch { return null }
  })()
  const effectiveGoodsId = linkedSpec?.id || unit.linked_goods_id || wcGoodsId.value
  const effectiveGoodsName = linkedSpec?.name || unit.linked_goods_name || `${wcGoodsName.value} · ${unit.unit_name}`
  const effectiveRatio = (linkedSpec?.id || unit.linked_goods_id) ? 1 : unit.ratio
  const cost = unit.cost_price && unit.cost_price > 0 ? unit.cost_price : Number(g?.cost_price || 0) * unit.ratio
  cartItems.push({
    goods_id: effectiveGoodsId ?? -1,
    goods_name: effectiveGoodsName,
    goods_sn: '',
    unit_name: unit.unit_name,
    price,
    cost_price: cost,
    num: 1,
    unit_ratio: effectiveRatio,
  })
  pricingTargetIndex.value = cartItems.length - 1
  calcTotal()
  weightCalcVisible.value = false
  ElMessage.success(t('retail.cashRegister.packageAdded', { name: `${wcGoodsName.value} · ${unit.unit_name}` }))
}

// ── 新建商品（含可选采购入库）────────────────────────────────────────────────
const quickAddVisible = ref(false)
const quickAddSaving = ref(false)
const unitList = ref<any[]>([])
const quickAddForm = reactive({
  goods_name: '',
  sell_price: 0,
  cost_price: 0,
  cate_id: null as any,
  unit_id: null as any,
  barcode: '',
  // 采购部分（可选）
  showProcure: false,
  procure_qty: 0,
  procure_price: 0,
  procure_supplier: '',
  procure_warehouse_id: null as number | null,
  procure_warehouse_name: '',
  procure_date: new Date().toLocaleDateString('sv-SE'),
})

async function openQuickAdd() {
  quickAddForm.goods_name = keyword.value.trim()
  quickAddForm.sell_price = 0
  quickAddForm.cost_price = 0
  quickAddForm.cate_id = null
  quickAddForm.unit_id = null
  quickAddForm.barcode = ''
  quickAddForm.showProcure = false
  quickAddForm.procure_qty = 0
  quickAddForm.procure_price = 0
  quickAddForm.procure_supplier = ''
  quickAddForm.procure_date = orderDate.value
  if (!unitList.value.length) {
    const r = await getUnitList({ list_rows: 100 })
    unitList.value = r.data?.rows ?? []
  }
  if (unitList.value.length) quickAddForm.unit_id = unitList.value[0].id
  if (!warehouseList.value.length) {
    const r = await getWarehouseList({ list_rows: 100 })
    warehouseList.value = r.data?.rows ?? []
  }
  const saved = Number(localStorage.getItem('erp_default_warehouse_id'))
  const wMatch = warehouseList.value.find((w: any) => w.id === saved) ?? warehouseList.value[0]
  quickAddForm.procure_warehouse_id = wMatch?.id ?? null
  quickAddForm.procure_warehouse_name = wMatch?.name ?? ''
  if (!supplierOptions.value.length) {
    const r = await getSupplierList({ list_rows: 200 })
    supplierOptions.value = r.data?.rows ?? []
  }
  quickAddVisible.value = true
}

async function submitQuickAdd() {
  const name = quickAddForm.goods_name.trim()
  if (!name) { ElMessage.warning(t('retail.cashRegister.goodsNameRequired')); return }
  if (!quickAddForm.sell_price || quickAddForm.sell_price <= 0) { ElMessage.warning(t('retail.cashRegister.sellPriceRequired')); return }
  if (!quickAddForm.unit_id) { ElMessage.warning(t('retail.cashRegister.unitRequired')); return }

  const doProcure = quickAddForm.showProcure && quickAddForm.procure_qty > 0
  if (doProcure && !quickAddForm.procure_warehouse_id) {
    ElMessage.warning(t('retail.cashRegister.warehouseRequired')); return
  }

  // 防止重名
  const dupCheck = await getGoodsList({ keyword: name, status: 1, list_rows: 10 })
  const dupRows: any[] = dupCheck.data?.rows ?? []
  if (dupRows.some((g: any) => g.goods_name === name)) {
    ElMessage.warning(t('retail.cashRegister.goodsDuplicate', { name }))
    return
  }
  quickAddSaving.value = true
  try {
    // 1. 建商品档案
    // 成本价优先用采购单价，其次用手填的成本价
    const finalCostPrice = doProcure ? quickAddForm.procure_price : quickAddForm.cost_price
    const res = await createGoods({
      goods_name: name,
      sell_price: quickAddForm.sell_price,
      cost_price: finalCostPrice,
      cate_id: quickAddForm.cate_id || 0,
      unit_id: quickAddForm.unit_id,
      barcode: quickAddForm.barcode || '',
      status: 1,
      goods_type: 1,
    })
    const newId = res?.data?.id
    if (!newId) throw new Error('Failed to create product, please retry')
    const unit = unitList.value.find((u: any) => u.id === quickAddForm.unit_id)

    // 2. 采购入库（可选）
    if (doProcure) {
      let supplierId = 0
      let supplierName = quickAddForm.procure_supplier.trim()
      if (supplierName) {
        const existing = supplierOptions.value.find((s: any) => s.name === supplierName)
        if (existing) {
          supplierId = existing.id
        } else {
          const sr = await createSupplier({ name: supplierName, contact: '', mobile: '', status: 1 })
          supplierId = sr?.data?.id ?? 0
          if (supplierId) supplierOptions.value.push({ id: supplierId, name: supplierName })
        }
      }
      const procureDate = quickAddForm.procure_date
      const orderNo = `PO${Date.now()}`
      const totalAmount = Math.round(quickAddForm.procure_qty * quickAddForm.procure_price * 100) / 100
      const goodsInfo = [{
        goods_id: newId,
        goods_name: name,
        goods_sn: '',
        unit_name: unit?.name ?? '',
        num: quickAddForm.procure_qty,
        price: quickAddForm.procure_price,
        total_price: totalAmount,
      }]
      // 创建采购订单
      const orderRes = await createProcureOrder({
        order_no: orderNo,
        order_sn: orderNo,
        order_date: procureDate,
        supplier_id: supplierId,
        supplier_name: supplierName,
        warehouse_id: quickAddForm.procure_warehouse_id,
        warehouse_name: quickAddForm.procure_warehouse_name,
        total_amount: totalAmount,
        after_discount: totalAmount,
        pay_amount: 0,
        remark: 'POS quick-add purchase receipt',
        goods_info: JSON.stringify(goodsInfo),
        status: 0,
      })
      const orderId = orderRes?.data?.id ?? orderRes?.data?.data?.id
      if (!orderId) throw new Error('Failed to create purchase order')
      // 审核采购单
      await auditProcureOrder(orderId, 1)
      // 创建入库单并审核（新单不可能已有入库单，直接建）
      const inhouseRes = await createProcureInhouse({
        purchase_order_id: orderId,
        supplier_id: supplierId,
        supplier_name: supplierName,
        warehouse_id: quickAddForm.procure_warehouse_id,
        warehouse_name: quickAddForm.procure_warehouse_name,
        in_date: procureDate,
        total_amount: totalAmount,
        remark: 'POS quick-add purchase receipt',
        goods_info: goodsInfo,
      })
      const inhouseId = inhouseRes?.data?.id ?? inhouseRes?.data
      if (inhouseId) await auditProcureInhouse(inhouseId, 1)
      stockRefreshStore.trigger()
    }

    // 3. 加入购物车
    addToCart({
      id: newId,
      goods_name: name,
      goods_sn: '',
      sell_price: quickAddForm.sell_price,
      member_price: 0,
      cost_price: finalCostPrice,
      unit_name: unit?.name ?? '',
      goods_type: 1,
    })
    quickAddVisible.value = false
    keyword.value = ''
    ElMessage.success(doProcure
      ? t('retail.cashRegister.goodsCreatedWithProcure', { name })
      : t('retail.cashRegister.goodsCreatedOnly', { name }))
  } catch (e: any) {
    ElMessage.error(e?.message || t('retail.cashRegister.operationFailed'))
  } finally {
    quickAddSaving.value = false
  }
}

onMounted(async () => {
  const [, mc] = await Promise.all([loadHotGoods(), getGoodsCateList({ list_rows: 200 }), loadBomCosts()])
  cateList.value = mc.data?.rows ?? []
  const [mr, sr] = await Promise.all([
    getMemberList({ list_rows: 500 }),
    getStoreList({ list_rows: 100 }),
  ])
  memberList.value = mr.data?.rows ?? []
  storeList.value = sr.data?.rows ?? []
  // 恢复上次选择的门店
  const savedStoreId = localStorage.getItem('cr_store_id')
  if (savedStoreId && storeList.value.find((s: any) => s.id === Number(savedStoreId))) {
    selectedStoreId.value = Number(savedStoreId)
  } else if (storeList.value.length === 1) {
    selectedStoreId.value = storeList.value[0].id
  }
})
</script>

<style scoped>
/* ── Shell ────────────────────────────────────────────────────────────────── */
.cr-shell {
  position: fixed;
  inset: 0;
  background: #f0f2f7;
  display: flex;
  flex-direction: column;
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', sans-serif;
}

/* ── 顶栏 ────────────────────────────────────────────────────────────────── */
.cr-topbar {
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 0 24px;
  flex-shrink: 0;
  background: #fff;
  border-bottom: 1px solid #e8eaf0;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.cr-brand { display: flex; align-items: center; gap: 10px; }
.cr-brand-icon {
  width: 32px; height: 32px;
  display: flex; align-items: center; justify-content: center;
}
.cr-brand-name { font-size: 15px; font-weight: 600; color: #1a1a2e; letter-spacing: 0.3px; }

/* 返回首页按钮 - left aligned in topbar */
.cr-home-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.15s;
  user-select: none;
  flex-shrink: 0;
}
.cr-home-btn:hover { background: #e2e8f0; color: #334155; }

.cr-top-right { display: flex; align-items: center; gap: 10px; }

.cr-calc-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #7c3aed;
  background: #f5f3ff; border: 1px solid #ddd6fe;
  cursor: pointer; transition: all 0.12s; user-select: none; flex-shrink: 0;
}
.cr-calc-btn:hover { background: #ede9fe; }

.cr-scan-icon {
  color: #94a3b8; cursor: pointer; padding: 2px;
  transition: color 0.12s; flex-shrink: 0;
}
.cr-scan-icon:hover { color: #3b82f6; }

.cr-member-select { width: 180px; }
:deep(.cr-member-select .el-input__wrapper) {
  background: #f8fafc;
  border-color: #e2e8f0;
  box-shadow: none;
}

.cr-search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  padding: 0 14px;
  height: 34px;
  width: 280px;
  transition: border-color 0.15s;
}
.cr-search-box:focus-within { border-color: #3b82f6; background: #fff; }
.cr-search-icon { color: #94a3b8; font-size: 14px; flex-shrink: 0; }
.cr-search-input {
  flex: 1; background: transparent; border: none; outline: none;
  color: #1e293b; font-size: 13px;
}
.cr-search-input::placeholder { color: #94a3b8; }

/* ── 主体 ────────────────────────────────────────────────────────────────── */
.cr-body {
  flex: 1;
  overflow: hidden;
  padding: 16px 20px 20px;
  display: flex;
}

.cr-card {
  flex: 1;
  background: #fff;
  border-radius: 18px;
  overflow: hidden;
  display: flex;
  box-shadow: 0 4px 24px rgba(0,0,0,0.08);
  border: 1px solid #e8eaf0;
}

/* ── 左：购物车 ──────────────────────────────────────────────────────────── */
.cr-left {
  width: 300px;
  flex-shrink: 0;
  border-right: 1px solid #f0f2f7;
  display: flex;
  flex-direction: column;
  background: #fafbff;
}

.cr-left-actions {
  display: flex;
  border-bottom: 1px solid #f0f2f7;
  flex-shrink: 0;
}

.cr-action-btn {
  flex: 1; height: 42px;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; color: #64748b; cursor: pointer;
  transition: background 0.12s, color 0.12s;
  border-right: 1px solid #f0f2f7; user-select: none;
}
.cr-action-btn:last-child { border-right: none; }
.cr-action-btn:hover { background: #f1f5f9; color: #1e293b; }
.cr-action-btn.danger { color: #dc2626; }
.cr-action-btn.danger:hover { background: #fff0f0; }

.cr-cart-area { flex: 1; overflow-y: auto; padding: 8px; }
.cr-cart-area::-webkit-scrollbar { width: 4px; }
.cr-cart-area::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

.cr-cart-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px; color: #cbd5e1;
}
.cr-empty-icon { font-size: 48px; opacity: 0.5; }
.cr-empty-text { font-size: 13px; text-align: center; line-height: 1.6; padding: 0 20px; }

.cr-cart-list { display: flex; flex-direction: column; gap: 6px; }

.cr-cart-item {
  border: 1px solid #e8eef8;
  border-radius: 12px;
  padding: 9px 10px;
  background: #fff;
  transition: box-shadow 0.15s, border-color 0.15s, background 0.15s;
}
.cr-cart-item:hover { box-shadow: 0 2px 8px rgba(59,130,246,0.08); }
.cr-cart-item.active {
  border-color: #93c5fd;
  background: #f8fbff;
  box-shadow: 0 0 0 1px rgba(59,130,246,0.12);
}

.cr-cart-item-top {
  display: flex; align-items: center;
  justify-content: space-between; margin-bottom: 6px;
}
.cr-cart-item-title {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}
.cr-cart-item-name { font-size: 13px; font-weight: 500; color: #1e293b; flex: 1; }
.cr-cart-item-price-note { font-size: 11px; color: #64748b; line-height: 1.3; }

.cr-cart-item-bottom {
  display: flex; align-items: center; justify-content: space-between;
}
.cr-cart-item-amounts {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  margin-left: 8px;
}
.cr-cart-item-unit { font-size: 11px; color: #64748b; line-height: 1.2; }
.cr-cart-item-price-row {
  display: flex; align-items: center; gap: 4px; margin-bottom: 2px;
}
.cr-cart-item-unit-label { font-size: 11px; color: #64748b; flex-shrink: 0; }
:deep(.cr-cart-item-price-row .el-input-number .el-input__wrapper) {
  padding: 0 22px 0 4px; font-size: 12px;
}
:deep(.cr-cart-item-price-row .el-input-number__increase),
:deep(.cr-cart-item-price-row .el-input-number__decrease) {
  width: 18px;
}

.cr-qty-ctrl { display: flex; align-items: center; gap: 4px; }
.cr-qty-btn {
  width: 24px; height: 24px;
  border: 1px solid #e2e8f0; border-radius: 50%;
  background: #f8fafc; cursor: pointer; font-size: 14px;
  display: flex; align-items: center; justify-content: center;
  color: #64748b; transition: all 0.1s;
}
.cr-qty-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
.cr-gram-chip {
  padding: 4px 12px; border-radius: 20px;
  border: 1.5px solid #3b82f6; background: #eff6ff;
  color: #2563eb; font-size: 13px; font-weight: 600;
  cursor: pointer; white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: all 0.12s;
}
.cr-gram-chip:active { background: #dbeafe; transform: scale(0.96); }

.cr-cart-item-sub { display: flex; align-items: center; gap: 4px; }
.cr-cart-item-sub-label { font-size: 11px; color: #64748b; flex-shrink: 0; }
:deep(.cr-cart-item-sub .el-input-number .el-input__wrapper) {
  padding: 0 22px 0 4px; font-size: 12px; font-weight: 700; color: #2563eb;
}
:deep(.cr-cart-item-sub .el-input-number__increase),
:deep(.cr-cart-item-sub .el-input-number__decrease) {
  width: 18px;
}

/* ── 结算区 ──────────────────────────────────────────────────────────────── */
.cr-settle {
  flex-shrink: 0;
  border-top: 1px solid #f0f2f7;
  padding: 14px 12px 14px;
  display: flex; flex-direction: column; gap: 10px;
  background: #fff;
}

.cr-settle-row {
  display: flex; justify-content: space-between;
  align-items: center; font-size: 13px; color: #64748b;
}
.cr-settle-row span:last-child { color: #1e293b; font-weight: 600; }

.cr-pay-methods { display: flex; flex-wrap: wrap; gap: 6px; }

.cr-pay-btn {
  padding: 5px 12px;
  border: 1.5px solid #e2e8f0;
  border-radius: 20px; font-size: 12px; color: #64748b;
  background: #f8fafc; cursor: pointer; transition: all 0.12s; user-select: none;
}
.cr-pay-btn:hover { border-color: #3b82f6; color: #3b82f6; background: #eff6ff; }
.cr-pay-btn.active { background: #2563eb; border-color: #2563eb; color: #fff; }

.cr-checkout-btn {
  width: 100%; height: 48px;
  background: linear-gradient(135deg, #2563eb, #1d4ed8);
  color: #fff; border: none; border-radius: 14px;
  font-size: 17px; font-weight: 700; cursor: pointer;
  transition: all 0.15s; letter-spacing: 1px;
  box-shadow: 0 4px 16px rgba(37,99,235,0.3);
}
.cr-checkout-label {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  white-space: nowrap;
}
.cr-checkout-price {
  letter-spacing: 0;
}
.cr-checkout-btn:hover:not(:disabled) { background: linear-gradient(135deg, #1d4ed8, #1e40af); box-shadow: 0 6px 20px rgba(37,99,235,0.4); }
.cr-checkout-btn:disabled { opacity: 0.45; cursor: not-allowed; }

/* ── 右：分类 + 商品 ─────────────────────────────────────────────────────── */
.cr-right {
  flex: 1; display: flex; flex-direction: column; overflow: hidden;
}

.cr-cate-bar {
  display: flex; align-items: center; padding: 0 16px;
  border-bottom: 1px solid #f0f2f7; flex-shrink: 0; overflow-x: auto;
  background: #fafbff;
}
.cr-cate-bar::-webkit-scrollbar { height: 0; }

.cr-cate-tab {
  padding: 12px 16px; font-size: 14px; color: #94a3b8;
  cursor: pointer; white-space: nowrap;
  border-bottom: 2px solid transparent; transition: all 0.12s; user-select: none;
}
.cr-cate-tab:hover { color: #334155; }
.cr-cate-sub-bar {
  background: #f5f7ff;
  border-bottom: 1px solid #eaeef8;
}
.cr-cate-sub-tab {
  font-size: 13px;
  padding: 8px 14px;
  color: #64748b;
}
.cr-cate-sub-tab.active { color: #2563eb; border-bottom-color: #2563eb; font-weight: 600; }

.cr-goods-grid {
  flex: 1; overflow-y: auto;
  padding: 14px 12px;
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 10px; align-content: start;
}
.cr-goods-grid::-webkit-scrollbar { width: 4px; }
.cr-goods-grid::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 2px; }

.cr-goods-card {
  border: 1.5px solid #e8eef8;
  border-radius: 14px; padding: 14px 12px 12px;
  cursor: pointer; background: #fff;
  transition: all 0.15s; user-select: none;
}

.cr-goods-name {
  font-size: 13px; color: #1e293b; line-height: 1.5; margin-bottom: 10px;
  font-weight: 500; min-height: 38px;
  display: -webkit-box; -webkit-line-clamp: 2;
  -webkit-box-orient: vertical; overflow: hidden;
}

.cr-goods-prices { display: flex; flex-direction: column; gap: 2px; }
.cr-goods-price { font-size: 15px; font-weight: 700; color: #1e293b; }
.cr-goods-member-price { font-size: 11px; color: #d97706; font-weight: 500; }
.cr-goods-cost-price { font-size: 11px; color: #94a3b8; font-weight: 500; }

.cr-goods-empty {
  grid-column: 1/-1; text-align: center;
  color: #cbd5e1; padding: 60px 0; font-size: 14px;
  display: flex; flex-direction: column; align-items: center; gap: 14px;
}

.cr-goods-empty-add {
  display: flex; align-items: center; gap: 6px;
  padding: 8px 20px; border-radius: 20px;
  background: #eff6ff; border: 1.5px dashed #93c5fd;
  color: #2563eb; font-size: 13px; font-weight: 500;
  cursor: pointer; transition: all 0.15s;
}
.cr-goods-empty-add:hover { background: #dbeafe; border-color: #3b82f6; }

.cr-new-goods-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #059669;
  background: #ecfdf5; border: 1px solid #6ee7b7;
  cursor: pointer; transition: all 0.12s; user-select: none; flex-shrink: 0;
}
.cr-new-goods-btn:hover { background: #d1fae5; border-color: #34d399; }

.cr-procure-btn {
  display: flex; align-items: center; gap: 5px;
  padding: 5px 12px; border-radius: 20px;
  font-size: 12px; font-weight: 500; color: #d97706;
  background: #fffbeb; border: 1px solid #fcd34d;
  cursor: pointer; transition: all 0.12s; user-select: none; flex-shrink: 0;
}
.cr-procure-btn:hover { background: #fef3c7; border-color: #f59e0b; }

.qp-tip {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; color: #94a3b8;
  background: #f8fafc; border-radius: 8px; padding: 8px 12px;
}

/* 弹窗内采购折叠区 */
.qa-procure-section {
  border: 1.5px dashed #e2e8f0;
  border-radius: 10px;
  overflow: hidden;
  margin-top: 4px;
}
.qa-procure-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px;
  font-size: 13px; font-weight: 600; color: #475569;
  cursor: pointer; user-select: none;
  background: #f8fafc;
  transition: background 0.12s;
}
.qa-procure-header:hover { background: #f1f5f9; }
.qa-optional-badge {
  font-size: 11px; font-weight: 500;
  background: #fef3c7; color: #d97706;
  border-radius: 4px; padding: 1px 6px;
}
.qa-procure-body {
  padding: 12px 14px 4px;
  border-top: 1px solid #f0f2f7;
  background: #fff;
}

/* ── 手机端悬浮购物车（桌面隐藏） ───────────────────────────────────────── */
.cr-float-bar,
.cr-cart-drawer,
.cr-drawer-mask { display: none; }

/* ── 响应式：≤ 768px 手机布局 ─────────────────────────────────────────────── */
@media (max-width: 768px) {

  /* 顶栏紧凑化 */
  .cr-topbar {
    height: auto;
    min-height: 52px;
    padding: 6px 10px;
    flex-wrap: wrap;
    gap: 6px;
  }

  .cr-home-text { display: none; }

  .cr-home-btn {
    padding: 6px 8px;
    border-radius: 50%;
    width: 34px;
    height: 34px;
    justify-content: center;
  }

  .cr-brand-name { font-size: 13px; letter-spacing: 0; }
  .cr-brand-icon svg { width: 22px; height: 22px; }
  .cr-brand { gap: 6px; }

  .cr-top-right { width: 100%; gap: 6px; order: 3; }

  .cr-calc-text { display: none; }
  .cr-calc-btn {
    padding: 6px 8px; border-radius: 50%;
    width: 32px; height: 32px;
    justify-content: center; flex-shrink: 0;
  }

  .cr-new-goods-text { display: none; }
  .cr-new-goods-btn {
    padding: 6px 8px; border-radius: 50%;
    width: 32px; height: 32px;
    justify-content: center; flex-shrink: 0;
  }

  .cr-procure-text { display: none; }
  .cr-procure-btn {
    padding: 6px 8px; border-radius: 50%;
    width: 32px; height: 32px;
    justify-content: center; flex-shrink: 0;
  }

  .cr-member-select { width: 120px; flex-shrink: 0; }
  .cr-search-box { flex: 1; width: auto; min-width: 0; }

  /* 主体：留出底部悬浮栏高度 */
  .cr-body { padding: 0; padding-bottom: 68px; }

  .cr-card {
    border-radius: 0; border: none;
    box-shadow: none; flex-direction: column;
  }

  /* 桌面端左侧购物车在手机上隐藏 */
  .cr-left { display: none; }

  .cr-right { flex: 1; display: flex; flex-direction: column; }

  /* 商品网格：2列 */
  .cr-goods-grid {
    grid-template-columns: repeat(2, 1fr);
    padding: 10px 8px; gap: 8px;
  }

  .cr-goods-card { padding: 10px 9px 9px; border-radius: 12px; }
  .cr-goods-name { font-size: 12px; min-height: 32px; margin-bottom: 7px; }
  .cr-goods-price { font-size: 14px; }
  .cr-cate-tab { padding: 10px 12px; font-size: 13px; }

  /* ── 底部悬浮购物车栏 ── */
  .cr-float-bar {
    display: flex;
    position: fixed;
    bottom: 16px;
    left: 12px;
    right: 12px;
    height: 56px;
    background: #1e293b;
    border-radius: 18px;
    align-items: center;
    padding: 0 6px 0 10px;
    gap: 10px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.22);
    z-index: 200;
    cursor: pointer;
    user-select: none;
  }

  .cr-float-cart-icon {
    position: relative;
    width: 42px; height: 42px;
    background: rgba(255,255,255,0.1);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,255,255,0.5);
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .cr-float-cart-icon.has-items {
    background: #2563eb;
    color: #fff;
  }

  .cr-float-badge {
    position: absolute;
    top: -4px; right: -4px;
    min-width: 16px; height: 16px;
    background: #ef4444;
    color: #fff; font-size: 10px; font-weight: 700;
    border-radius: 8px;
    display: flex; align-items: center; justify-content: center;
    padding: 0 4px; line-height: 1;
    border: 1.5px solid #1e293b;
  }

  .cr-float-info {
    flex: 1; display: flex; flex-direction: column; gap: 1px;
  }
  .cr-float-empty { font-size: 13px; color: rgba(255,255,255,0.4); }
  .cr-float-total { font-size: 18px; font-weight: 700; color: #fff; line-height: 1.2; }
  .cr-float-count { font-size: 11px; color: rgba(255,255,255,0.45); }

  .cr-float-checkout {
    height: 42px; padding: 0 18px;
    background: #2563eb;
    color: #fff; border: none; border-radius: 13px;
    font-size: 15px; font-weight: 700;
    cursor: pointer; flex-shrink: 0;
    transition: background 0.15s;
  }
  .cr-float-checkout:active { background: #1d4ed8; }
  .cr-float-checkout:disabled { opacity: 0.5; }

  /* ── 购物车抽屉遮罩 ── */
  .cr-drawer-mask {
    display: block;
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.45);
    z-index: 300;
  }

  /* ── 购物车底部抽屉 ── */
  .cr-cart-drawer {
    display: flex;
    flex-direction: column;
    position: fixed;
    bottom: 0; left: 0; right: 0;
    max-height: 80vh;
    background: #fff;
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -8px 40px rgba(0,0,0,0.18);
    z-index: 400;
    transform: translateY(100%);
    transition: transform 0.3s cubic-bezier(0.32, 0.72, 0, 1);
  }
  .cr-cart-drawer.open { transform: translateY(0); }

  .cr-drawer-handle {
    padding: 12px 0 6px;
    display: flex; justify-content: center;
    cursor: pointer; flex-shrink: 0;
  }
  .cr-drawer-grip {
    width: 36px; height: 4px;
    background: #e2e8f0; border-radius: 2px;
  }

  .cr-drawer-inner {
    flex: 1; overflow: hidden;
    display: flex; flex-direction: column;
  }

  .cr-drawer-header {
    display: flex; align-items: center;
    justify-content: space-between;
    padding: 0 14px 10px;
    flex-shrink: 0;
    border-bottom: 1px solid #f0f2f7;
  }
  .cr-drawer-title { font-size: 15px; font-weight: 700; color: #1e293b; }

  .cr-drawer-header .cr-drawer-actions {
    display: flex; gap: 4px;
  }
  .cr-drawer-header .cr-action-btn {
    height: 30px; padding: 0 10px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
    font-size: 12px; color: #64748b;
    background: #f8fafc;
    cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    user-select: none;
  }
  .cr-drawer-header .cr-action-btn.danger { color: #dc2626; border-color: #fecaca; background: #fff5f5; }

  .cr-drawer-list {
    flex: 1; overflow-y: auto;
    padding: 8px 12px;
  }
  .cr-drawer-list::-webkit-scrollbar { width: 0; }

  .cr-drawer-empty {
    padding: 24px 0; text-align: center;
    color: #94a3b8; font-size: 14px;
  }

  .cr-drawer-settle {
    border-top: 1px solid #f0f2f7;
    padding: 12px 14px 24px;
  }

  /* 支付方式横向滚动 */
  .cr-pay-methods { flex-wrap: nowrap; overflow-x: auto; padding-bottom: 2px; }
  .cr-pay-methods::-webkit-scrollbar { height: 0; }
  .cr-pay-btn { flex-shrink: 0; }

  .cr-checkout-btn {
    height: 52px; font-size: 16px; border-radius: 14px;
  }

  /* 购物车列表通用（抽屉内） */
  .cr-cart-item { padding: 8px 9px; border-radius: 10px; }
  .cr-cart-item-name { font-size: 12px; }
  .cr-cart-item-sub-label { font-size: 11px; }
}
</style>
