<template>
  <div class="page-container">
    <el-card>
      <el-form inline style="margin-bottom:8px">
        <el-form-item :label="$t('reports.profit.dateLabel')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('reports.profit.rangeSeparator')"
            :start-placeholder="$t('reports.profit.startPlaceholder')"
            :end-placeholder="$t('reports.profit.endPlaceholder')"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadData">{{ $t('reports.profit.query') }}</el-button>
          <el-button @click="onReset">{{ $t('reports.profit.reset') }}</el-button>
        </el-form-item>
      </el-form>

      <!-- 汇总栏 -->
      <div class="pf-summary" v-if="rows.length > 0">
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.totalSale') }}</span>
          <span class="pf-sum-val blue">¥{{ fmt(totalSale) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.goodsCost') }}</span>
          <span class="pf-sum-val purple">¥{{ fmt(totalCost) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.grossProfit') }}</span>
          <span class="pf-sum-val" :style="{ color: totalProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ totalProfit >= 0 ? '+' : '' }}¥{{ fmt(totalProfit) }}
          </span>
        </div>
        <div class="pf-sum-item pf-sum-divider-v"></div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.myFreight') }}</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(freightTotal) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.expenseOut') }}</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(expenseTotal) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.docExpense') }}</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(docExpenseTotal) }}</span>
        </div>
        <div class="pf-sum-item pf-sum-divider-v"></div>
        <div class="pf-sum-item">
          <span class="pf-sum-label" style="font-weight:700">{{ $t('reports.profit.netProfit') }}</span>
          <span class="pf-sum-val" :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ netProfit >= 0 ? '+' : '' }}¥{{ fmt(netProfit) }}
          </span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.grossRate') }}</span>
          <el-tag :type="overallRate >= 20 ? 'success' : overallRate > 0 ? 'warning' : 'danger'">
            {{ overallRate.toFixed(1) }}%
          </el-tag>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">{{ $t('reports.profit.netRate') }}</span>
          <el-tag :type="netRate >= 20 ? 'success' : netRate > 0 ? 'warning' : 'danger'">
            {{ netRate.toFixed(1) }}%
          </el-tag>
        </div>
      </div>

      <!-- 数据说明 -->
      <div class="pf-note">
        <el-icon><InfoFilled /></el-icon>
        {{ $t('reports.profit.note') }}
      </div>

      <!-- 切换Tab -->
      <el-tabs v-model="viewMode" style="margin-bottom:4px">
        <el-tab-pane :label="$t('reports.profit.tabGoods')" name="goods" />
        <el-tab-pane :label="$t('reports.profit.tabOrder')" name="order" />
        <el-tab-pane :label="$t('reports.profit.tabCustomer')" name="customer" />
      </el-tabs>

      <div v-if="loading" style="text-align:center;padding:40px 0">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <!-- 单品维度 -->
      <el-table v-else-if="viewMode === 'goods'" :data="rows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column prop="goods_name" :label="$t('reports.profit.colGoodsName')" min-width="140" show-overflow-tooltip />
        <el-table-column :label="$t('reports.profit.colSaleQty')" prop="num" align="right" width="80" />
        <el-table-column :label="$t('reports.profit.colSaleAmount')" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#0071e3">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colUnitCost')" align="right" width="100">
          <template #default="{ row }">
            <el-tooltip :content="row.cost_source" placement="top">
              <span style="color:#7c3aed;cursor:help">¥{{ fmt(row.unit_cost) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colTotalCost')" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#7c3aed;font-weight:600">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colGrossProfit')" align="right" width="110" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colGrossRate')" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colCostSource')" align="center" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.has_bom ? 'warning' : 'info'">
              {{ row.has_bom ? $t('reports.profit.costSourceBom') : (row.cost_source?.includes('采购均价') ? $t('reports.profit.costSourceAvgPrice') : $t('reports.profit.costSourcePrice')) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colSource')" align="center" width="70">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '零售' ? 'success' : row.source === '换货' ? 'danger' : row.source === '出库单' ? 'warning' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.profit.noData') }}</div></template>
      </el-table>

      <!-- 单据维度 -->
      <el-table v-else-if="viewMode === 'order'" :data="orderRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column type="expand" width="42">
          <template #default="{ row }">
            <div class="order-detail">
              <div class="order-detail-head">
                <span>{{ row.order_no }} 商品利润明细</span>
                <span>销售额 ¥{{ fmt(row.sale_amount) }} / 成本 ¥{{ fmt(row.cost_amount) }} / 毛利 {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}</span>
              </div>
              <el-table :data="row.items" size="small" border style="width:100%">
                <el-table-column prop="goods_name" :label="$t('reports.profit.colGoodsName')" min-width="160" show-overflow-tooltip />
                <el-table-column prop="goods_sn" :label="$t('reports.profit.colCode')" min-width="110" show-overflow-tooltip />
                <el-table-column prop="unit_name" :label="$t('reports.profit.colUnit')" width="70" align="center" />
                <el-table-column :label="$t('reports.profit.colQty')" width="90" align="right">
                  <template #default="{ row: item }">{{ fmtQty(item.qty) }}</template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colSaleAmount')" width="110" align="right">
                  <template #default="{ row: item }"><span class="blue">¥{{ fmt(item.sale_amount) }}</span></template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colUnitCost')" width="110" align="right">
                  <template #default="{ row: item }">
                    <el-tooltip :content="item.cost_source" placement="top">
                      <span class="purple" style="cursor:help">¥{{ fmt(item.unit_cost) }}</span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colTotalCost')" width="110" align="right">
                  <template #default="{ row: item }"><span class="purple">¥{{ fmt(item.cost_amount) }}</span></template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colGrossProfit')" width="110" align="right">
                  <template #default="{ row: item }">
                    <span :style="{ color: item.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                      {{ item.profit >= 0 ? '+' : '' }}¥{{ fmt(item.profit) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colGrossRate')" width="90" align="right">
                  <template #default="{ row: item }">
                    <el-tag :type="item.profit_rate >= 20 ? 'success' : item.profit_rate > 0 ? 'warning' : 'danger'" size="small">
                      {{ item.profit_rate.toFixed(1) }}%
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colCostSource')" width="120" align="center" show-overflow-tooltip>
                  <template #default="{ row: item }">
                    <el-tag size="small" :type="item.has_bom ? 'warning' : item.unit_cost > 0 ? 'info' : 'danger'">
                      {{ item.has_bom ? $t('reports.profit.costSourceBom') : item.unit_cost > 0 ? $t('reports.profit.costSourceCostPrice') : $t('reports.profit.costSourceMissing') }}
                    </el-tag>
                  </template>
                </el-table-column>
                <template #empty><div style="padding:20px 0;color:#aaa">{{ $t('reports.profit.noGoodsDetail') }}</div></template>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colOrderType')" align="center" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '零售' ? 'success' : row.source === '换货' ? 'danger' : row.source === '出库单' ? 'warning' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" :label="$t('reports.profit.colOrderNo')" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customer_name" :label="$t('reports.profit.colCustomer')" min-width="120" show-overflow-tooltip />
        <el-table-column prop="order_date" :label="$t('reports.profit.colDate')" width="100" />
        <el-table-column :label="$t('reports.profit.colSaleAmount')" align="right" width="120">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colCost')" align="right" width="120">
          <template #default="{ row }">
            <span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colGrossProfit')" align="right" width="120" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colGrossRate')" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colNetProfit')" align="right" width="120" sortable prop="net_profit">
          <template #default="{ row }">
            <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colNetRate')" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.net_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.profit.noData') }}</div></template>
      </el-table>

      <!-- 客户维度 -->
      <el-table v-else-if="viewMode === 'customer'" :data="customerRows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column type="expand" width="42">
          <template #default="{ row }">
            <div class="order-detail">
              <div class="order-detail-head">
                <span>{{ row.customer_name }} 单据明细（共 {{ row.orders.length }} 张）</span>
                <span>销售额 ¥{{ fmt(row.sale_amount) }} / 成本 ¥{{ fmt(row.cost_amount) }} / 毛利 {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}</span>
              </div>
              <el-table :data="row.orders" size="small" border style="width:100%">
                <el-table-column type="expand" width="32">
                  <template #default="{ row: o }">
                    <div style="padding:8px 12px 12px 32px;background:#f8fafc">
                      <el-table :data="o.items" size="small" border style="width:100%">
                        <el-table-column prop="goods_name" :label="$t('reports.profit.colGoodsName')" min-width="160" show-overflow-tooltip />
                        <el-table-column prop="goods_sn" :label="$t('reports.profit.colCode')" width="110" show-overflow-tooltip />
                        <el-table-column prop="unit_name" :label="$t('reports.profit.colUnit')" width="60" align="center" />
                        <el-table-column :label="$t('reports.profit.colQty')" width="80" align="right">
                          <template #default="{ row: item }">{{ fmtQty(item.qty) }}</template>
                        </el-table-column>
                        <el-table-column :label="$t('reports.profit.colSaleAmount')" width="100" align="right">
                          <template #default="{ row: item }"><span class="blue">¥{{ fmt(item.sale_amount) }}</span></template>
                        </el-table-column>
                        <el-table-column :label="$t('reports.profit.colUnitCost')" width="100" align="right">
                          <template #default="{ row: item }">
                            <el-tooltip :content="item.cost_source" placement="top">
                              <span class="purple" style="cursor:help">¥{{ fmt(item.unit_cost) }}</span>
                            </el-tooltip>
                          </template>
                        </el-table-column>
                        <el-table-column :label="$t('reports.profit.colTotalCost')" width="100" align="right">
                          <template #default="{ row: item }"><span class="purple">¥{{ fmt(item.cost_amount) }}</span></template>
                        </el-table-column>
                        <el-table-column :label="$t('reports.profit.colGrossProfit')" width="100" align="right">
                          <template #default="{ row: item }">
                            <span :style="{ color: item.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                              {{ item.profit >= 0 ? '+' : '' }}¥{{ fmt(item.profit) }}
                            </span>
                          </template>
                        </el-table-column>
                        <el-table-column :label="$t('reports.profit.colGrossRate')" width="80" align="right">
                          <template #default="{ row: item }">
                            <el-tag :type="item.profit_rate >= 20 ? 'success' : item.profit_rate > 0 ? 'warning' : 'danger'" size="small">
                              {{ item.profit_rate.toFixed(1) }}%
                            </el-tag>
                          </template>
                        </el-table-column>
                        <template #empty><div style="padding:12px 0;color:#aaa;text-align:center">{{ $t('reports.profit.noGoodsDetailInner') }}</div></template>
                      </el-table>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colOrderType')" align="center" width="80">
                  <template #default="{ row: o }">
                    <el-tag size="small" :type="o.source === '零售' ? 'success' : o.source === '换货' ? 'danger' : o.source === '出库单' ? 'warning' : 'primary'">{{ o.source }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="order_no" :label="$t('reports.profit.colOrderNo')" min-width="150" show-overflow-tooltip />
                <el-table-column prop="order_date" :label="$t('reports.profit.colDate')" width="100" />
                <el-table-column :label="$t('reports.profit.colSaleAmount')" width="110" align="right">
                  <template #default="{ row: o }"><span class="blue">¥{{ fmt(o.sale_amount) }}</span></template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colCost')" width="110" align="right">
                  <template #default="{ row: o }"><span class="purple">¥{{ fmt(o.cost_amount) }}</span></template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colGrossProfit')" width="110" align="right">
                  <template #default="{ row: o }">
                    <span :style="{ color: o.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                      {{ o.profit >= 0 ? '+' : '' }}¥{{ fmt(o.profit) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colGrossRate')" width="80" align="right">
                  <template #default="{ row: o }">
                    <el-tag :type="o.profit_rate >= 20 ? 'success' : o.profit_rate > 0 ? 'warning' : 'danger'" size="small">
                      {{ o.profit_rate.toFixed(1) }}%
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column :label="$t('reports.profit.colNetProfit')" width="110" align="right">
                  <template #default="{ row: o }">
                    <span :style="{ color: o.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                      {{ o.net_profit >= 0 ? '+' : '' }}¥{{ fmt(o.net_profit) }}
                    </span>
                  </template>
                </el-table-column>
                <template #empty><div style="padding:20px 0;color:#aaa">{{ $t('reports.profit.noOrderData') }}</div></template>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" :label="$t('reports.profit.colCustomer')" min-width="140" show-overflow-tooltip />
        <el-table-column :label="$t('reports.profit.colOrderCount')" align="right" width="70">
          <template #default="{ row }">
            <span style="color:#64748b">{{ row.orders.length }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colSaleAmount')" align="right" width="130">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colCost')" align="right" width="130">
          <template #default="{ row }">
            <span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colGrossProfit')" align="right" width="130" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colGrossRate')" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colNetProfit')" align="right" width="130" sortable prop="net_profit">
          <template #default="{ row }">
            <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('reports.profit.colNetRate')" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.net_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">{{ $t('reports.profit.noData') }}</div></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
const { t } = useI18n()
import { InfoFilled, Loading } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { getContractList, getSaleExchangeList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getProcureOrderList } from '@/api/procure'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'
import { findNaiDoufuGoods } from '@/utils/goodsAlias'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'
import {
  createProfitCostContext, loadUnitConvertRows, loadBomItems,
  calcContractSaleAmount, calcRetailSaleAmount, myFreightShare,
  filterProfitExpenses, aggregateGoodsProfit, buildOrderItems,
  type ProfitCostContext, type BomItemFlat,
} from '@/utils/profitCalc'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const viewMode = ref<'goods' | 'order' | 'customer'>('goods')

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const exchangeOrders = ref<any[]>([])
const goodsList = ref<any[]>([])
const procureInhouseList = ref<any[]>([])
const bomList = ref<any[]>([])
const bomItemList = ref<BomItemFlat[]>([])
const expenseList = ref<any[]>([])
const unitConvertList = ref<any[]>([])
const procureOrders = ref<any[]>([])  // 已审核采购单（取 expense_amount 作单据附加费）

// 成本上下文 — 算法统一在 @/utils/profitCalc
const costCtx = computed<ProfitCostContext>(() => createProfitCostContext({
  goodsList: goodsList.value,
  inhouseList: procureInhouseList.value,
  bomHeaders: bomList.value,
  bomItems: bomItemList.value,
  unitConvertRows: unitConvertList.value,
}))

// 单品维度
const rows = computed(() => {
  const docs = [
    ...saleContracts.value
      .map(c => ({ goodsInfo: c.goods_info, source: '合同', saleAmount: calcContractSaleAmount(c) }))
      .filter(d => d.saleAmount > 0),
    ...retailOrders.value
      .map(r => ({ goodsInfo: r.goods_info, source: '零售', saleAmount: calcRetailSaleAmount(r) })),
    // 换货：仅换出商品计入单品维度（退货冲减在单据维度体现，负向数量会导致聚合成本错误）
    ...exchangeOrders.value
      .filter(ex => Number(ex.exchange_amount || 0) > 0)
      .map(ex => ({ goodsInfo: ex.exchange_goods_info, source: '换货', saleAmount: Number(ex.exchange_amount || 0) })),
  ]
  return aggregateGoodsProfit(docs, costCtx.value, { aliasResolver: findNaiDoufuGoods })
})

// 销售额为0的合同数量（数据不完整，排除出利润报表）
const skippedContractCount = ref(0)

// 单据维度：按每张合同/零售单一行
const orderRows = computed(() => {
  const result: any[] = []
  let skipped = 0

  for (const c of saleContracts.value) {
    const sale_amount = calcContractSaleAmount(c)
    if (!sale_amount) { skipped++; continue }
    const items = buildOrderItems(c.goods_info, sale_amount, costCtx.value, findNaiDoufuGoods)
    const cost_amount = items.reduce((s, item) => s + item.cost_amount, 0)
    const freight = myFreightShare(c)
    const profit = sale_amount - cost_amount
    const net_profit = profit - freight
    result.push({
      source: '合同',
      order_no: ((c.remark || '').match(/^\[NO:([^\]]+)\]/) || [])[1] || c.order_sn || c.contract_no || `HT${String(c.id).padStart(4, '0')}`,
      customer_name: c.customer_name || '—',
      order_date: fmtDt(c.contract_date || c.create_time),
      sale_amount, cost_amount, profit, freight, net_profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (net_profit / sale_amount * 100) : 0,
      items,
    })
  }
  skippedContractCount.value = skipped

  for (const r of retailOrders.value) {
    const sale_amount = calcRetailSaleAmount(r)
    const items = buildOrderItems(r.goods_info, sale_amount, costCtx.value, findNaiDoufuGoods)
    const cost_amount = items.reduce((s, item) => s + item.cost_amount, 0)
    const profit = sale_amount - cost_amount
    result.push({
      source: '零售',
      order_no: r.order_sn || r.order_no || `LS${(r.order_date || r.create_time || '').slice(0, 10).replace(/-/g, '')}${String(r.id).padStart(3, '0')}`,
      customer_name: r.customer_name || r.member_name || '散客',
      order_date: fmtDt(r.order_date || r.create_time),
      sale_amount, cost_amount, profit, freight: 0, net_profit: profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      items,
    })
  }

  // 换货单：净收入 = 换出金额 - 退货金额；净成本 = 换出成本 - 退回成本（退回商品成本归还）
  for (const ex of exchangeOrders.value) {
    const exchangeAmt = Number(ex.exchange_amount || 0)
    const returnAmt = Number(ex.return_amount || 0)
    const sale_amount = exchangeAmt - returnAmt  // 差价（净收入）
    const exchangeItems = buildOrderItems(ex.exchange_goods_info, exchangeAmt, costCtx.value, findNaiDoufuGoods)
    const returnItems = buildOrderItems(ex.return_goods_info, returnAmt, costCtx.value, findNaiDoufuGoods)
    const exchangeCost = exchangeItems.reduce((s, i) => s + i.cost_amount, 0)
    const returnCost = returnItems.reduce((s, i) => s + i.cost_amount, 0)
    const cost_amount = exchangeCost - returnCost  // 净成本（退回商品成本归还）
    const freight = myFreightShare(ex)
    const profit = sale_amount - cost_amount
    const net_profit = profit - freight
    // 合并展示：换出商品正向 + 退回商品标注负向
    const allItems = [
      ...exchangeItems.map(i => ({ ...i, goods_name: `[换出] ${i.goods_name}` })),
      ...returnItems.map(i => ({
        ...i,
        goods_name: `[退回] ${i.goods_name}`,
        qty: -i.qty,
        sale_amount: -i.sale_amount,
        cost_amount: -i.cost_amount,
        profit: -i.profit,
      })),
    ]
    result.push({
      source: '换货',
      order_no: ex.order_no,
      customer_name: ex.customer_name || '—',
      order_date: fmtDt(ex.exchange_date || ex.created_at),
      sale_amount, cost_amount, profit, freight, net_profit,
      profit_rate: exchangeAmt > 0 ? (profit / exchangeAmt * 100) : 0,
      net_rate: exchangeAmt > 0 ? (net_profit / exchangeAmt * 100) : 0,
      items: allItems,
    })
  }

  return result.sort((a, b) => b.profit - a.profit)
})

// 客户维度：按客户聚合单据
const customerRows = computed(() => {
  const map: Record<string, { customer_name: string; orders: any[] }> = {}
  for (const o of orderRows.value) {
    const key = o.customer_name || '—'
    if (!map[key]) map[key] = { customer_name: key, orders: [] }
    map[key].orders.push(o)
  }
  return Object.values(map).map(c => {
    const sale_amount = c.orders.reduce((s, o) => s + o.sale_amount, 0)
    const cost_amount = c.orders.reduce((s, o) => s + o.cost_amount, 0)
    const profit = c.orders.reduce((s, o) => s + o.profit, 0)
    const net_profit = c.orders.reduce((s, o) => s + o.net_profit, 0)
    return {
      customer_name: c.customer_name,
      orders: c.orders,
      sale_amount,
      cost_amount,
      profit,
      net_profit,
      profit_rate: sale_amount > 0 ? (profit / sale_amount * 100) : 0,
      net_rate: sale_amount > 0 ? (net_profit / sale_amount * 100) : 0,
    }
  }).sort((a, b) => b.profit - a.profit)
})

const totalSale = computed(() => rows.value.reduce((s, r) => s + r.sale_amount, 0))
const totalCost = computed(() => rows.value.reduce((s, r) => s + r.cost_amount, 0))
const totalProfit = computed(() => totalSale.value - totalCost.value)
const overallRate = computed(() =>
  totalSale.value > 0 ? (totalProfit.value / totalSale.value * 100) : 0
)

const freightTotal = computed(() =>
  saleContracts.value.reduce((s, r) => s + myFreightShare(r), 0) +
  exchangeOrders.value.reduce((s, ex) => s + myFreightShare(ex), 0)
)
// 费用：排除未付(pending)与「采购单据支出」（货款已按商品成本计入，再扣即双重扣减）
const expenseTotal = computed(() =>
  filterProfitExpenses(expenseList.value).reduce((s, r) => s + Number(r.amount || 0), 0)
)
// 单据附加费（采购单/合同/换货单 expense_amount，不在商品成本里，需单独扣）
const docExpenseTotal = computed(() =>
  procureOrders.value.reduce((s, o) => s + Number(o.expense_amount || 0), 0) +
  saleContracts.value.reduce((s, c) => s + Number(c.expense_amount || 0), 0) +
  exchangeOrders.value.reduce((s, ex) => s + Number(ex.expense_amount || 0), 0)
)
const netProfit = computed(() => totalProfit.value - freightTotal.value - expenseTotal.value - docExpenseTotal.value)
const netRate = computed(() => totalSale.value > 0 ? (netProfit.value / totalSale.value * 100) : 0)

function fmt(v: number | string): string {
  const n = Number(v)
  return isNaN(n) ? '0.00' : n.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtQty(v: number | string): string {
  const n = Number(v)
  return isNaN(n) ? '0' : n.toLocaleString('zh-CN', { maximumFractionDigits: 3 })
}

async function loadData() {
  loading.value = true
  const params: any = { list_rows: 2000 }
  if (dateRange.value) {
    params.start_date = dateRange.value[0]
    params.end_date = dateRange.value[1]
  }
  try {
    const [c, r, ex, g, ih, b, e, po] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getSaleExchangeList({ ...params, list_rows: 2000 }),
      getGoodsList({ list_rows: 3000 }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      getBomList({ list_rows: 500 }),
      getExpenseList(params),
      getProcureOrderList({ ...params, list_rows: 2000 }),
    ])
    saleContracts.value      = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []).filter(isEffectiveSaleContract) : []
    retailOrders.value       = r.status === 'fulfilled' ? (r.value?.data?.rows  ?? []).filter((r: any) => Number(r.status) === 1) : []
    exchangeOrders.value     = ex.status === 'fulfilled' ? (ex.value?.data?.rows ?? []).filter((r: any) => Number(r.status) === 1) : []
    goodsList.value          = g.status === 'fulfilled' ? (g.value?.data?.rows  ?? []) : []
    procureInhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []).filter((r: any) => r.status === 1) : []
    const bomHeaders         = b.status === 'fulfilled' ? (b.value?.data?.list  ?? []) : []
    bomList.value            = bomHeaders
    expenseList.value        = e.status === 'fulfilled' ? (e.value?.data?.rows  ?? []) : []
    procureOrders.value      = po.status === 'fulfilled' ? (po.value?.data?.rows ?? []).filter((r: any) => Number(r.status) === 1) : []

    // 多单位换算 + BOM 物料明细（只读接口，按需逐个查）
    const [ucRows, bomItems] = await Promise.all([
      loadUnitConvertRows(http, goodsList.value),
      loadBomItems(http, bomHeaders),
    ])
    unitConvertList.value = ucRows
    bomItemList.value = bomItems
  } finally {
    loading.value = false
  }
}

function onReset() {
  dateRange.value = null
  loadData()
}

onMounted(loadData)
</script>

<style scoped>
.page-container {}
.pf-summary {
  display: flex; gap: 32px; flex-wrap: wrap;
  padding: 16px 20px; background: #f8fafc; border-radius: 12px; margin-bottom: 12px;
}
.pf-sum-item { display:flex; flex-direction:column; gap:4px; }
.pf-sum-item.pf-sum-divider-v { width:1px; background:#e8eaf0; align-self:stretch; margin:0 4px; }
.pf-sum-label { font-size:11px; color:rgba(29,29,31,0.4); }
.pf-sum-val { font-size:18px; font-weight:700; }
.blue { color:#0071e3; }
.purple { color:#7c3aed; }
.pf-note {
  display:flex; align-items:center; gap:6px; font-size:12px;
  color:rgba(29,29,31,0.4); padding:6px 0 12px;
}
.order-detail {
  padding: 12px 20px 16px 58px;
  background: #fafbff;
}
.order-detail-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  padding: 0 0 10px;
}
</style>
