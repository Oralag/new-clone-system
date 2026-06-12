<template>
  <div class="page-container">
    <el-card>
      <el-form inline style="margin-bottom:8px">
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="loadData"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="loading" @click="loadData">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 汇总栏 -->
      <div class="pf-summary" v-if="rows.length > 0">
        <div class="pf-sum-item">
          <span class="pf-sum-label">总销售额</span>
          <span class="pf-sum-val blue">¥{{ fmt(totalSale) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">商品成本</span>
          <span class="pf-sum-val purple">¥{{ fmt(totalCost) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">毛利润</span>
          <span class="pf-sum-val" :style="{ color: totalProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ totalProfit >= 0 ? '+' : '' }}¥{{ fmt(totalProfit) }}
          </span>
        </div>
        <div class="pf-sum-item pf-sum-divider-v"></div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">我方运费</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(freightTotal) }}</span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">费用支出</span>
          <span class="pf-sum-val" style="color:#f59e0b">−¥{{ fmt(expenseTotal) }}</span>
        </div>
        <div class="pf-sum-item pf-sum-divider-v"></div>
        <div class="pf-sum-item">
          <span class="pf-sum-label" style="font-weight:700">净利润</span>
          <span class="pf-sum-val" :style="{ color: netProfit >= 0 ? '#16a34a' : '#dc2626' }">
            {{ netProfit >= 0 ? '+' : '' }}¥{{ fmt(netProfit) }}
          </span>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">毛利率</span>
          <el-tag :type="overallRate >= 20 ? 'success' : overallRate > 0 ? 'warning' : 'danger'">
            {{ overallRate.toFixed(1) }}%
          </el-tag>
        </div>
        <div class="pf-sum-item">
          <span class="pf-sum-label">净利率</span>
          <el-tag :type="netRate >= 20 ? 'success' : netRate > 0 ? 'warning' : 'danger'">
            {{ netRate.toFixed(1) }}%
          </el-tag>
        </div>
      </div>

      <!-- 数据说明 -->
      <div class="pf-note">
        <el-icon><InfoFilled /></el-icon>
        BOM成品成本 = 各物料采购移动均价之和（无采购记录时用BOM配置价）；非BOM商品成本取采购移动均价，无记录时取商品采购价；运费按合同承担比例扣除；费用来自费用管理模块；净利润 = 毛利润 − 运费 − 费用
      </div>

      <!-- 切换Tab -->
      <el-tabs v-model="viewMode" style="margin-bottom:4px">
        <el-tab-pane label="按单品" name="goods" />
        <el-tab-pane label="按单据" name="order" />
        <el-tab-pane label="按客户" name="customer" />
      </el-tabs>

      <div v-if="loading" style="text-align:center;padding:40px 0">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
      </div>

      <!-- 单品维度 -->
      <el-table v-else-if="viewMode === 'goods'" :data="rows" style="width:100%" :default-sort="{ prop: 'profit', order: 'descending' }">
        <el-table-column prop="goods_name" label="商品名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="销售数量" prop="num" align="right" width="80" />
        <el-table-column label="销售额" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#0071e3">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位成本" align="right" width="100">
          <template #default="{ row }">
            <el-tooltip :content="row.cost_source" placement="top">
              <span style="color:#7c3aed;cursor:help">¥{{ fmt(row.unit_cost) }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="总成本" align="right" width="110">
          <template #default="{ row }">
            <span style="color:#7c3aed;font-weight:600">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" width="110" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="成本来源" align="center" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.has_bom ? 'warning' : 'info'">
              {{ row.has_bom ? 'BOM' : (row.cost_source?.includes('采购均价') ? '采购均价' : '采购价') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" align="center" width="70">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '零售' ? 'success' : row.source === '出库单' ? 'warning' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
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
                <el-table-column prop="goods_name" label="商品名称" min-width="160" show-overflow-tooltip />
                <el-table-column prop="goods_sn" label="编码" min-width="110" show-overflow-tooltip />
                <el-table-column prop="unit_name" label="单位" width="70" align="center" />
                <el-table-column label="数量" width="90" align="right">
                  <template #default="{ row: item }">{{ fmtQty(item.qty) }}</template>
                </el-table-column>
                <el-table-column label="销售额" width="110" align="right">
                  <template #default="{ row: item }"><span class="blue">¥{{ fmt(item.sale_amount) }}</span></template>
                </el-table-column>
                <el-table-column label="单位成本" width="110" align="right">
                  <template #default="{ row: item }">
                    <el-tooltip :content="item.cost_source" placement="top">
                      <span class="purple" style="cursor:help">¥{{ fmt(item.unit_cost) }}</span>
                    </el-tooltip>
                  </template>
                </el-table-column>
                <el-table-column label="总成本" width="110" align="right">
                  <template #default="{ row: item }"><span class="purple">¥{{ fmt(item.cost_amount) }}</span></template>
                </el-table-column>
                <el-table-column label="毛利润" width="110" align="right">
                  <template #default="{ row: item }">
                    <span :style="{ color: item.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                      {{ item.profit >= 0 ? '+' : '' }}¥{{ fmt(item.profit) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="毛利率" width="90" align="right">
                  <template #default="{ row: item }">
                    <el-tag :type="item.profit_rate >= 20 ? 'success' : item.profit_rate > 0 ? 'warning' : 'danger'" size="small">
                      {{ item.profit_rate.toFixed(1) }}%
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="成本来源" width="120" align="center" show-overflow-tooltip>
                  <template #default="{ row: item }">
                    <el-tag size="small" :type="item.has_bom ? 'warning' : item.unit_cost > 0 ? 'info' : 'danger'">
                      {{ item.has_bom ? 'BOM' : item.unit_cost > 0 ? '成本价' : '缺成本' }}
                    </el-tag>
                  </template>
                </el-table-column>
                <template #empty><div style="padding:20px 0;color:#aaa">这张单没有可解析的商品明细</div></template>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="单据类型" align="center" width="80">
          <template #default="{ row }">
            <el-tag size="small" :type="row.source === '零售' ? 'success' : row.source === '出库单' ? 'warning' : 'primary'">{{ row.source }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_no" label="单号" min-width="150" show-overflow-tooltip />
        <el-table-column prop="customer_name" label="客户" min-width="120" show-overflow-tooltip />
        <el-table-column prop="order_date" label="日期" width="100" />
        <el-table-column label="销售额" align="right" width="120">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成本" align="right" width="120">
          <template #default="{ row }">
            <span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" width="120" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="净利润" align="right" width="120" sortable prop="net_profit">
          <template #default="{ row }">
            <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="净利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.net_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
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
                        <el-table-column prop="goods_name" label="商品名称" min-width="160" show-overflow-tooltip />
                        <el-table-column prop="goods_sn" label="编码" width="110" show-overflow-tooltip />
                        <el-table-column prop="unit_name" label="单位" width="60" align="center" />
                        <el-table-column label="数量" width="80" align="right">
                          <template #default="{ row: item }">{{ fmtQty(item.qty) }}</template>
                        </el-table-column>
                        <el-table-column label="销售额" width="100" align="right">
                          <template #default="{ row: item }"><span class="blue">¥{{ fmt(item.sale_amount) }}</span></template>
                        </el-table-column>
                        <el-table-column label="单位成本" width="100" align="right">
                          <template #default="{ row: item }">
                            <el-tooltip :content="item.cost_source" placement="top">
                              <span class="purple" style="cursor:help">¥{{ fmt(item.unit_cost) }}</span>
                            </el-tooltip>
                          </template>
                        </el-table-column>
                        <el-table-column label="总成本" width="100" align="right">
                          <template #default="{ row: item }"><span class="purple">¥{{ fmt(item.cost_amount) }}</span></template>
                        </el-table-column>
                        <el-table-column label="毛利润" width="100" align="right">
                          <template #default="{ row: item }">
                            <span :style="{ color: item.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                              {{ item.profit >= 0 ? '+' : '' }}¥{{ fmt(item.profit) }}
                            </span>
                          </template>
                        </el-table-column>
                        <el-table-column label="毛利率" width="80" align="right">
                          <template #default="{ row: item }">
                            <el-tag :type="item.profit_rate >= 20 ? 'success' : item.profit_rate > 0 ? 'warning' : 'danger'" size="small">
                              {{ item.profit_rate.toFixed(1) }}%
                            </el-tag>
                          </template>
                        </el-table-column>
                        <template #empty><div style="padding:12px 0;color:#aaa;text-align:center">无商品明细</div></template>
                      </el-table>
                    </div>
                  </template>
                </el-table-column>
                <el-table-column label="单据类型" align="center" width="80">
                  <template #default="{ row: o }">
                    <el-tag size="small" :type="o.source === '零售' ? 'success' : o.source === '出库单' ? 'warning' : 'primary'">{{ o.source }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="order_no" label="单号" min-width="150" show-overflow-tooltip />
                <el-table-column prop="order_date" label="日期" width="100" />
                <el-table-column label="销售额" width="110" align="right">
                  <template #default="{ row: o }"><span class="blue">¥{{ fmt(o.sale_amount) }}</span></template>
                </el-table-column>
                <el-table-column label="成本" width="110" align="right">
                  <template #default="{ row: o }"><span class="purple">¥{{ fmt(o.cost_amount) }}</span></template>
                </el-table-column>
                <el-table-column label="毛利润" width="110" align="right">
                  <template #default="{ row: o }">
                    <span :style="{ color: o.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                      {{ o.profit >= 0 ? '+' : '' }}¥{{ fmt(o.profit) }}
                    </span>
                  </template>
                </el-table-column>
                <el-table-column label="毛利率" width="80" align="right">
                  <template #default="{ row: o }">
                    <el-tag :type="o.profit_rate >= 20 ? 'success' : o.profit_rate > 0 ? 'warning' : 'danger'" size="small">
                      {{ o.profit_rate.toFixed(1) }}%
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column label="净利润" width="110" align="right">
                  <template #default="{ row: o }">
                    <span :style="{ color: o.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
                      {{ o.net_profit >= 0 ? '+' : '' }}¥{{ fmt(o.net_profit) }}
                    </span>
                  </template>
                </el-table-column>
                <template #empty><div style="padding:20px 0;color:#aaa">无单据数据</div></template>
              </el-table>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="customer_name" label="客户" min-width="140" show-overflow-tooltip />
        <el-table-column label="单据数" align="right" width="70">
          <template #default="{ row }">
            <span style="color:#64748b">{{ row.orders.length }}</span>
          </template>
        </el-table-column>
        <el-table-column label="销售额" align="right" width="130">
          <template #default="{ row }">
            <span style="color:#0071e3;font-weight:600">¥{{ fmt(row.sale_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="成本" align="right" width="130">
          <template #default="{ row }">
            <span style="color:#7c3aed">¥{{ fmt(row.cost_amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="毛利润" align="right" width="130" sortable prop="profit">
          <template #default="{ row }">
            <span :style="{ color: row.profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.profit >= 0 ? '+' : '' }}¥{{ fmt(row.profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="毛利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.profit_rate >= 20 ? 'success' : row.profit_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.profit_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="净利润" align="right" width="130" sortable prop="net_profit">
          <template #default="{ row }">
            <span :style="{ color: row.net_profit >= 0 ? '#16a34a' : '#dc2626', fontWeight:600 }">
              {{ row.net_profit >= 0 ? '+' : '' }}¥{{ fmt(row.net_profit) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="净利率" align="right" width="80">
          <template #default="{ row }">
            <el-tag :type="row.net_rate >= 20 ? 'success' : row.net_rate > 0 ? 'warning' : 'danger'" size="small">
              {{ row.net_rate.toFixed(1) }}%
            </el-tag>
          </template>
        </el-table-column>
        <template #empty><div style="padding:40px 0;color:#aaa">暂无数据</div></template>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { InfoFilled, Loading } from '@element-plus/icons-vue'
import { fmtDt } from '@/utils/date'
import { getContractList } from '@/api/sale'
import { getRetailOrderList } from '@/api/retail'
import { getGoodsList, getBomList } from '@/api/goods'
import { getExpenseList } from '@/api/finance'
import http from '@/api/http'
import { findNaiDoufuGoods } from '@/utils/goodsAlias'
import { isEffectiveSaleContract } from '@/utils/saleContractStatus'

const loading = ref(false)
const dateRange = ref<[string, string] | null>(null)
const viewMode = ref<'goods' | 'order' | 'customer'>('goods')

const saleContracts = ref<any[]>([])
const retailOrders = ref<any[]>([])
const goodsList = ref<any[]>([])
const procureInhouseList = ref<any[]>([])
const bomList = ref<any[]>([])   // BOM 头（成品）
const bomItemList = ref<{ finished_sn: string; goods_sn: string; num: number; price: number }[]>([])  // BOM 物料（展平）
const expenseList = ref<any[]>([])
const unitConvertList = ref<any[]>([])

function toNum(...values: any[]): number {
  for (const v of values) {
    const n = Number(v)
    if (Number.isFinite(n) && n > 0) return n
  }
  return 0
}

function toText(...values: any[]): string {
  for (const v of values) {
    const s = String(v ?? '').trim()
    if (s) return s
  }
  return ''
}

function parseItems(info: any): any[] {
  if (!info) return []
  if (Array.isArray(info)) return info
  if (typeof info === 'object') {
    if (Array.isArray(info.goods_info)) return info.goods_info
    if (Array.isArray(info.items)) return info.items
    return []
  }
  try {
    const parsed = JSON.parse(info)
    return typeof parsed === 'string' ? parseItems(parsed) : parseItems(parsed)
  } catch {
    return []
  }
}

function itemQty(item: any): number {
  return toNum(item?.num, item?.qty, item?.quantity, item?.goods_num, item?.number, item?.count)
}

function itemPrice(item: any): number {
  return toNum(item?.price, item?.sell_price, item?.sale_price, item?.unit_price, item?.retail_price, item?.amount_price)
}

function itemLineAmount(item: any): number {
  return toNum(item?.line_amount)
}

function itemCost(item: any): number {
  return toNum(item?.cost_price, item?.cost, item?.costPrice, item?.purchase_price, item?.in_price, item?.avg_price)
}

function itemName(item: any): string {
  return toText(item?.goods_name, item?.name, item?.product_name, item?.title)
}

function itemSn(item: any): string {
  return toText(item?.goods_sn, item?.sn, item?.goods_code, item?.code, item?.barcode)
}

// 从 spec 字段解析大单位→基础单位的换算比
// 格式1: "400/箱/0.423/球" 或 "24/盒" → 首段为纯整数
// 格式2: "450g/25袋" → 某段为 "N+基础单位名"（如 "25袋" 且基础单位=袋）
function parseSpecRatio(spec: string, baseUnit = ''): number {
  if (!spec) return 1
  const segments = spec.split('/')
  // 优先：找 "N+baseUnit" 格式（如 "25袋" 且 baseUnit="袋"）
  if (baseUnit) {
    for (const seg of segments) {
      const m = seg.trim().match(/^(\d+)(.+)$/)
      if (m) {
        const n = Number(m[1])
        if (n > 1 && m[2].includes(baseUnit)) return n
      }
    }
  }
  // 兜底：首段纯整数（原有逻辑）
  const first = (segments[0] || '').trim()
  const n = Number(first)
  return Number.isInteger(n) && n > 1 ? n : 1
}

// goods_sn -> goods 快查表（用于采购成本地图的 spec 换算）
const goodsBySnMap = computed(() => {
  const m: Record<string, any> = {}
  for (const g of goodsList.value) { if (g.goods_sn) m[g.goods_sn] = g }
  return m
})

// goods_id -> { unit_name -> ratio } 换算表（来自 GoodsUnitConvert）
const unitConvertMap = computed(() => {
  const m: Record<number, Record<string, number>> = {}
  for (const r of unitConvertList.value) {
    const gid = Number(r.goods_id)
    const ratio = Number(r.ratio)
    if (!gid || !r.unit_name || !ratio) continue
    if (!m[gid]) m[gid] = {}
    m[gid][r.unit_name] = ratio
  }
  return m
})

// goods_id -> 移动加权平均价（采购入库 + BOM物料成本），兜底商品 cost_price
// 统一存基础单位（ratio=1）的成本，避免"斤"成本被当成"块儿"成本乘以数量
const goodsCostMap = computed(() => {
  const m: Record<number, number> = {}
  for (const g of goodsList.value) {
    const rawCost = toNum(g.cost_price, g.purchase_price, g.avg_price, g.in_price)
    // 若 goods.unit_name 在换算表中 ratio>1，说明它是大单位，需折算为基础单位
    const goodsUnitRatio = (g.unit_name && unitConvertMap.value[g.id])
      ? (unitConvertMap.value[g.id][g.unit_name] ?? 1)
      : 1
    m[g.id] = goodsUnitRatio > 1 ? rawCost / goodsUnitRatio : rawCost
  }
  // 采购入库移动均价（含多单位换算）
  // 预扫描：收集 unit_ratio 明确设置(>1)的记录，计算每个(sn,单位)的显式均价
  // 目的：给 unit_ratio=null 的老记录提供参考价，过滤单位录错的脏数据
  const snUnitExplicitAvg: Record<string, Record<string, number>> = {}
  for (const ih of procureInhouseList.value) {
    if (Number(ih.status) !== 1) continue
    try {
      const snUnitCost: Record<string, Record<string, number>> = {}
      const snUnitQty: Record<string, Record<string, number>> = {}
      for (const item of parseItems(ih.goods_info)) {
        const sn = itemSn(item)
        if (!sn) continue
        const explicitRatio = item.unit_ratio != null ? Number(item.unit_ratio) : null
        if (!explicitRatio || explicitRatio <= 1) continue
        const unitName = String(item.unit_name || '')
        const qty = itemQty(item)
        const price = toNum(item.price, item.price_no_tax, item.cost_price, item.in_price, item.avg_price)
        if (!unitName || qty <= 0 || price <= 0) continue
        if (!snUnitCost[sn]) { snUnitCost[sn] = {}; snUnitQty[sn] = {} }
        snUnitCost[sn][unitName] = (snUnitCost[sn][unitName] || 0) + qty * price
        snUnitQty[sn][unitName] = (snUnitQty[sn][unitName] || 0) + qty
      }
      for (const [sn, units] of Object.entries(snUnitCost)) {
        if (!snUnitExplicitAvg[sn]) snUnitExplicitAvg[sn] = {}
        for (const [u, cost] of Object.entries(units)) {
          const q = snUnitQty[sn][u]
          if (q > 0) snUnitExplicitAvg[sn][u] = cost / q
        }
      }
    } catch {}
  }

  const snTotalCost: Record<string, number> = {}
  const snTotalQty: Record<string, number> = {}
  for (const ih of procureInhouseList.value) {
    if (Number(ih.status) !== 1) continue
    try {
      for (const item of parseItems(ih.goods_info)) {
        const sn = itemSn(item)
        if (!sn) continue
        const qty = itemQty(item)
        const price = toNum(item.price, item.price_no_tax, item.cost_price, item.in_price, item.avg_price)
        if (qty > 0 && price > 0) {
          const goodsId = Number(item.goods_id || goodsBySnMap.value[sn]?.id || 0)
          const unitName = String(item.unit_name || '')
          const baseUnit = goodsBySnMap.value[sn]?.unit_name || ''
          const convertRatio = goodsId && unitName ? (unitConvertMap.value[goodsId]?.[unitName] ?? 0) : 0
          const explicitRatio = item.unit_ratio != null ? Number(item.unit_ratio) : null
          let ratio: number
          if (explicitRatio != null && explicitRatio > 1) {
            // 明确设置 >1：直接使用
            ratio = explicitRatio
          } else if (convertRatio > 1) {
            // explicit=null 或 explicit≤1（录入错误/老数据）：用显式均价验证
            // 若价格远低于同单位显式均价 × 0.25，说明是基础单位价格录错了单位 → 跳过
            const explicitAvg = snUnitExplicitAvg[sn]?.[unitName]
            if (explicitAvg != null && price < explicitAvg * 0.25) {
              ratio = 1  // 价格明显是基础单位价，单位名录错了
            } else {
              ratio = convertRatio  // 无参考或价格合理：信任 GoodsUnitConvert
            }
          } else {
            ratio = Math.max(1, parseSpecRatio(item.spec || goodsBySnMap.value[sn]?.spec || '', baseUnit))
          }
          if (unitName && baseUnit && unitName !== baseUnit && ratio === 1) continue
          snTotalCost[sn] = (snTotalCost[sn] || 0) + qty * price
          snTotalQty[sn] = (snTotalQty[sn] || 0) + qty * ratio
        }
      }
    } catch {}
  }
  // 物料移动均价（用于 BOM 成本计算优先于 BOM 配置价）
  const snAvgPrice: Record<string, number> = {}
  for (const sn in snTotalQty) {
    if (snTotalQty[sn] > 0) snAvgPrice[sn] = snTotalCost[sn] / snTotalQty[sn]
  }
  // 非 BOM 商品：用采购均价覆盖 goods.cost_price
  for (const g of goodsList.value) {
    const sn = g.goods_sn
    if (sn && snTotalQty[sn] > 0) {
      m[g.id] = snTotalCost[sn] / snTotalQty[sn]
    }
  }
  // BOM 成品：成本 = sum(物料用量 × 采购移动均价，无采购记录时兜底用BOM配置价)
  // 单位换算已在 snAvgPrice 计算时折算为基础单位，与 BOM 用量单位一致
  const bomItemsByFinished: Record<string, typeof bomItemList.value> = {}
  for (const item of bomItemList.value) {
    if (!item.finished_sn) continue
    ;(bomItemsByFinished[item.finished_sn] ??= []).push(item)
  }
  for (const [fsn, items] of Object.entries(bomItemsByFinished)) {
    const cost = items.reduce((s, mat) => {
      const price = snAvgPrice[mat.goods_sn] || mat.price || 0
      return s + mat.num * price
    }, 0)
    if (cost > 0) {
      const g = goodsList.value.find(x => x.goods_sn === fsn)
      if (g) m[g.id] = cost
    }
  }
  return m
})

// goods_id set that has BOM defined (for labeling only)
const hasBomSet = computed(() => {
  const snSet = new Set(bomList.value.map((b: any) => b.goods_sn).filter(Boolean))
  const s = new Set<number>()
  for (const g of goodsList.value) {
    if (g.goods_sn && snSet.has(g.goods_sn)) s.add(Number(g.id))
  }
  return s
})

// Cost: 优先采购入库移动均价，兜底商品 cost_price
// goodsCostMap 存的是基础单位（ratio=1）的成本；itemUnit 是订单里实际用的单位
// unitRatioHint: 订单行的 unit_ratio（null=老数据未设置；>1=明确大单位）
// 只有 hint>1 时才放大；hint=null 且单位是大单位时保守不放大（老数据单位标签可能录错）
function getUnitCost(goodsId: number, itemUnit = '', unitRatioHint: number | null = null): { unitCost: number; hasBom: boolean; costSource: string } {
  const baseCost = goodsCostMap.value[goodsId] || 0
  const convertRatio = (itemUnit && goodsId && unitConvertMap.value[goodsId])
    ? (unitConvertMap.value[goodsId][itemUnit] ?? 1)
    : 1
  // 大单位放大规则：仅当订单行明确设置 unit_ratio>1 时才放大成本
  // hint=null + 大单位 → 可能是老数据单位录错，保守使用 ratio=1
  const itemUnitRatio = (unitRatioHint != null && unitRatioHint > 1)
    ? unitRatioHint
    : (convertRatio > 1 && unitRatioHint == null) ? 1
    : convertRatio
  const c = baseCost * itemUnitRatio
  const hasBom = hasBomSet.value.has(goodsId)
  const g = goodsList.value.find(x => x.id === goodsId)
  const hasAvg = g?.goods_sn && procureInhouseList.value.length > 0
  return {
    unitCost: c,
    hasBom,
    costSource: c > 0 ? `${hasAvg ? '采购均价' : '采购价'} ¥${c.toFixed(2)}${hasBom ? '（含BOM）' : ''}` : '未设置成本价',
  }
}

function resolveGoodsId(item: any): number {
  const id = Number(item?.goods_id || item?.id || item?.product_id || item?.shop_goods_id || 0)
  const canonical = findNaiDoufuGoods(item, goodsList.value)
  if (canonical?.id) return Number(canonical.id)
  if (id > 0) return id
  const sn = itemSn(item)
  const name = itemName(item)
  const matched = goodsList.value.find(g =>
    (sn && String(g.goods_sn || '').trim() === sn) ||
    (sn && String(g.barcode || '').trim() === sn) ||
    (name && String(g.goods_name || '').trim() === name)
  )
  return Number(matched?.id || 0)
}

function getItemUnitCost(item: any): ReturnType<typeof getUnitCost> {
  const goodsId = resolveGoodsId(item)
  const itemUnit = toText(item?.unit_name, item?.unit)
  const unitRatioHint = item?.unit_ratio != null ? Number(item.unit_ratio) : null
  const byId = getUnitCost(goodsId, itemUnit, unitRatioHint)
  // BOM 优先
  if (byId.hasBom && byId.unitCost > 0) return byId
  // 采购均价优先（已含多单位换算，比合同里存的旧 cost_price 更准确）
  if (byId.unitCost > 0) return byId
  // 兜底：合同/单据里存的直接成本价
  const direct = itemCost(item)
  if (direct > 0) {
    return { unitCost: direct, hasBom: false, costSource: `单据成本 ¥${direct.toFixed(2)}` }
  }
  return byId
}

const rows = computed(() => {
  const map: Record<string, {
    goods_name: string; goods_id: number; num: number; sale_amount: number
    unit_cost: number; has_bom: boolean; cost_source: string; source: string
  }> = {}

  const add = (goodsInfo: any, source: string, discountRatio = 1, fallbackAmount = 0) => {
    if (!goodsInfo) return
    const items = parseItems(goodsInfo)
    if (!items.length) return
    const rawTotal = items.reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
    const totalQty = items.reduce((s, g) => s + itemQty(g), 0)
    try {
      for (const g of items) {
        const goodsId = resolveGoodsId(g)
        const goodsName = goodsList.value.find(x => x.id === goodsId)?.goods_name || itemName(g) || '-'
        const key = `${goodsId || itemSn(g) || goodsName}`
        const { unitCost, hasBom, costSource } = getItemUnitCost(g)
        if (!map[key]) {
          map[key] = {
            goods_name: goodsName, goods_id: goodsId,
            num: 0, sale_amount: 0,
            unit_cost: unitCost, has_bom: hasBom, cost_source: costSource, source,
          }
        } else if (!map[key].source.includes(source)) {
          map[key].source += '+' + source
        }
        const qty = itemQty(g)
        const lineAmount = itemLineAmount(g)
        const price = lineAmount > 0
          ? lineAmount / Math.max(qty, 1)
          : (rawTotal > 0 ? itemPrice(g) * discountRatio : (totalQty > 0 ? fallbackAmount / totalQty : 0))
        map[key].num += qty
        map[key].sale_amount += qty * price
      }
    } catch {}
  }

  for (const c of saleContracts.value) {
    // 计算优惠比例：实际金额 / 商品原价合计
    let actualAmount = toNum(c.after_discount, c.total_amount, c.goods_amount, c.contract_amount, c.amount)
    const contractItems = parseItems(c.goods_info)
    if (!actualAmount) {
      const lineSum = contractItems.reduce((s, g) => s + toNum(g.line_amount), 0)
      if (lineSum > 0) actualAmount = lineSum
    }
    if (!actualAmount) {
      const qtyPriceSum = contractItems.reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
      if (qtyPriceSum > 0) actualAmount = qtyPriceSum
    }
    if (!actualAmount) continue
    let rawTotal = 0
    for (const g of contractItems) rawTotal += itemQty(g) * itemPrice(g)
    const ratio = rawTotal > 0 ? actualAmount / rawTotal : 1
    add(c.goods_info, '合同', ratio, actualAmount)
  }
  for (const r of retailOrders.value) add(r.goods_info, '零售', 1, Number(r.total_amount || 0) - Number(r.discount_amount || 0))

  return Object.values(map)
    .map(r => ({
      ...r,
      cost_amount: r.num * r.unit_cost,
      profit: r.sale_amount - r.num * r.unit_cost,
      profit_rate: r.sale_amount > 0
        ? ((r.sale_amount - r.num * r.unit_cost) / r.sale_amount * 100) : 0,
    }))
    .sort((a, b) => b.profit - a.profit)
})

function buildOrderItems(goodsInfo: any, saleAmount: number) {
  const items = parseItems(goodsInfo)
  const rawTotal = items.reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
  const totalQty = items.reduce((s, g) => s + itemQty(g), 0)
  const ratio = rawTotal > 0 ? saleAmount / rawTotal : 1

  return items.map((g, index) => {
    const qty = itemQty(g)
    const goodsId = resolveGoodsId(g)
    const goods = goodsList.value.find(x => x.id === goodsId)
    const cost = getItemUnitCost(g)
    const lineSale = rawTotal > 0
      ? qty * itemPrice(g) * ratio
      : (totalQty > 0 ? saleAmount * qty / totalQty : 0)
    const costAmount = qty * cost.unitCost
    const profit = lineSale - costAmount
    return {
      key: `${goodsId || itemSn(g) || itemName(g) || index}_${index}`,
      goods_id: goodsId,
      goods_name: goods?.goods_name || itemName(g) || '-',
      goods_sn: goods?.goods_sn || itemSn(g) || '',
      unit_name: toText(g?.unit_name, g?.unit, goods?.unit_name),
      qty,
      sale_amount: lineSale,
      unit_cost: cost.unitCost,
      cost_amount: costAmount,
      profit,
      profit_rate: lineSale > 0 ? (profit / lineSale * 100) : 0,
      has_bom: cost.hasBom,
      cost_source: cost.costSource,
    }
  })
}

// 销售额为0的合同数量（数据不完整，排除出利润报表）
const skippedContractCount = ref(0)

// 单据维度：按每张合同/零售单一行
const orderRows = computed(() => {
  const result: any[] = []
  let skipped = 0

  for (const c of saleContracts.value) {
    // toNum 逐个尝试字段，只接受 > 0 的值，避免 "0.00" 字符串短路 || 链的问题
    let sale_amount = toNum(c.after_discount, c.total_amount, c.goods_amount, c.contract_amount, c.amount)
    if (!sale_amount) {
      const lineSum = parseItems(c.goods_info).reduce((s, g) => s + toNum(g.line_amount), 0)
      if (lineSum > 0) sale_amount = lineSum
    }
    if (!sale_amount) {
      const qtyPriceSum = parseItems(c.goods_info).reduce((s, g) => s + itemQty(g) * itemPrice(g), 0)
      if (qtyPriceSum > 0) sale_amount = qtyPriceSum
    }
    if (!sale_amount) { skipped++; continue }
    const items = buildOrderItems(c.goods_info, sale_amount)
    const cost_amount = items.reduce((s, item) => s + item.cost_amount, 0)
    const freight = myFreight(c)
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
    // 零售单用折后售价（total - discount），避免欠款未付时把实收当销售额
    let sale_amount = Number(r.total_amount || 0) - Number(r.discount_amount || 0)
    const items = buildOrderItems(r.goods_info, sale_amount)
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

// Freight: our share from contracts
function myFreight(row: any): number {
  const f = Number(row.freight_amount || 0)
  if (!f) return 0
  const b = row.freight_bearer
  if (b === 'seller') return f
  if (b === 'half') return f / 2
  return 0
}
const freightTotal = computed(() => saleContracts.value.reduce((s, r) => s + myFreight(r), 0))
const expenseTotal = computed(() => expenseList.value.reduce((s, r) => s + Number(r.amount || 0), 0))
const netProfit = computed(() => totalProfit.value - freightTotal.value - expenseTotal.value)
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
    const [c, r, g, ih, b, e] = await Promise.allSettled([
      getContractList(params),
      getRetailOrderList(params),
      getGoodsList({ list_rows: 3000 }),
      http.get('/procure/ProcureInhouse/index', { params: { list_rows: 1000 } }),
      getBomList({ list_rows: 500 }),
      getExpenseList(params),
    ])
    saleContracts.value      = c.status === 'fulfilled' ? (c.value?.data?.rows ?? []).filter(isEffectiveSaleContract) : []
    retailOrders.value       = r.status === 'fulfilled' ? (r.value?.data?.rows  ?? []).filter((r: any) => Number(r.status) === 1) : []
    goodsList.value          = g.status === 'fulfilled' ? (g.value?.data?.rows  ?? []) : []
    procureInhouseList.value = ih.status === 'fulfilled' ? (ih.value?.data?.rows ?? []).filter((r: any) => r.status === 1) : []
    const bomHeaders         = b.status === 'fulfilled' ? (b.value?.data?.list  ?? []) : []
    bomList.value            = bomHeaders
    expenseList.value        = e.status === 'fulfilled' ? (e.value?.data?.rows  ?? []) : []

    // GoodsUnitConvert API 不支持全量查询（不带 goods_id 返回空），必须按商品逐个查
    // BOM detail 同理，合并成一批并行请求
    const multiUnitGoods = goodsList.value.filter((g: any) => g.multi_unit)
    const [ucResults, detailResults] = await Promise.all([
      Promise.allSettled(multiUnitGoods.map((g: any) =>
        http.get('/goods/GoodsUnitConvert/index', { params: { goods_id: g.id, list_rows: 50 } })
      )),
      Promise.allSettled(bomHeaders.map((bom: any) =>
        http.get('/goods/BomGoods/detail', { params: { id: bom.id } })
      )),
    ])
    const allUcRows: any[] = []
    ucResults.forEach(res => {
      if (res.status === 'fulfilled') allUcRows.push(...(res.value?.data?.rows ?? []))
    })
    unitConvertList.value = allUcRows

    if (bomHeaders.length > 0) {
      const flatItems: typeof bomItemList.value = []
      detailResults.forEach((res, i) => {
        if (res.status !== 'fulfilled') return
        const header = bomHeaders[i]
        for (const mat of (res.value?.data?.items ?? [])) {
          flatItems.push({
            finished_sn: header.goods_sn,
            goods_sn: mat.goods_sn || '',
            num: Number(mat.num || 0),
            price: Number(mat.price || 0),
          })
        }
      })
      bomItemList.value = flatItems
    } else {
      bomItemList.value = []
    }
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
