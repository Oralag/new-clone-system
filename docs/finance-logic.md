# 财务模块逻辑文档

> 最后更新：2026-04-06  
> 用途：排查财务数据问题、修改计算逻辑时的参考手册

---

## 一、核心原则

### 1. 未审核不记账
所有财务数据必须过滤 `status=1`（已审核/已确认），`status=0` 是未审核数据，不计入任何金额。

| 单据类型 | 过滤条件 | 说明 |
|---------|---------|------|
| 采购订单 | `status=1` | 已确认采购 |
| 销售合同 | `status=1` | 已签单 |
| 零售单 | `status === 1` | 已完成零售 |
| 采购退货 | `status=1` | 已完成退货 |
| 销售退货 | `status=1` | 已完成退货 |
| 费用单 | `payment_status !== 'pending'` | pending = 未付款，不计入支出流水 |
| 收款单 | 无需过滤（接口本身只返回已审核） | status 已是 1 |
| 付款单 | 无需过滤（接口本身只返回已审核） | status 已是 1 |

### 2. 空接口（禁止使用）
以下接口后端返回空数组，**不要调用**：
- `/finance/CollectAccounts/index` — 应收账户（空）
- `/finance/PayAccounts/index` — 应付账户（空）

替代方案见下方各模块说明。

### 3. 数据一致性要求
Overview.vue 的汇总数字必须与 FundFlow.vue 的明细合计一致。两个文件使用相同的数据来源和相同的过滤逻辑。

---

## 二、资金收支来源（income/expense）

### 收入来源（type: 'income'）

| 来源名称 | API 接口 | 金额字段 | 过滤条件 | 对象字段 |
|---------|---------|---------|---------|---------|
| 收款单 | `/finance/CollectReceipt/index` | `amount` | `amount > 0` | `customer_name / contact_name` |
| 客户预收款 | `/finance/Prepay/index` | `amount` | `pay_type === 'customer'` | `customer_name` |
| 零售单 | `/retail/order/index` | `pay_amount \|\| total_amount` | `status === 1` | `member_name / customer_name` |
| 会员充值 | `/retail/recharge/index` | `amount` | `amount > 0` | `member_name` |
| 采购退货退款 | `/procure/ProcureReturn/index` | `refund_amount` | `status=1, refund_amount > 0` | `supplier_name` |

### 支出来源（type: 'expense'）

| 来源名称 | API 接口 | 金额字段 | 过滤条件 | 对象字段 |
|---------|---------|---------|---------|---------|
| 采购付款 | `/finance/PayReceipt/index` | `amount` | `contact_type === 'supplier'` | `supplier_name` |
| 客户退款 | `/finance/PayReceipt/index` | `amount` | `contact_type === 'customer'` | `contact_name` |
| 员工费用 | `/finance/PayReceipt/index` | `amount` | `contact_type === 'staff'` | `contact_name` |
| 其他支出 | `/finance/PayReceipt/index` | `amount` | `contact_type === 'other'` | `contact_name` |
| 费用单 | `/finance/Expense/index` | `amount` | `payment_status !== 'pending'` | `name` |
| 供应商预付款 | `/finance/Prepay/index` | `amount` | `pay_type === 'supplier'` | `supplier_name` |
| 销售退货退款 | `/stock/SaleReturnOrder/index` | `refund_amount` | `status=1, refund_amount > 0` | `customer_name` |

> **注意**：付款单来源类型映射：`{ supplier: '采购付款', customer: '客户退款', staff: '员工费用', other: '其他支出' }`

---

## 三、各页面逻辑说明

### 3.1 Overview.vue — 财务概览

**文件**：`src/views/finance/Overview.vue`

#### 顶部汇总卡片（summaryCards）
```
资金余额   = 总收入 - 总支出（来自 allFlowItems）
总资金收入 = allFlowItems 中 type==='income' 的 amount 之和
总资金支出 = allFlowItems 中 type==='expense' 的 amount 之和
应付总额   = payableList 中 getPayableUnpaidAmount(r) 之和
应收总额   = receivableList 中 un_pay_amount 之和（status=1 的销售合同）
```

#### allFlowItems 计算（8个来源）
```
1. collectList     → 收款单（income）
2. retailList      → 零售单（income, status===1过滤）
3. rechargeList    → 会员充值（income）
4. payList         → 付款单（expense）
5. expenseList     → 费用单（expense, payment_status!=='pending'过滤）
6. prepayList      → 预收/预付款（customer=income, supplier=expense）
7. procureReturnFinanceList → 采购退货退款（income）
8. saleReturnFinanceList    → 销售退货退款（expense）
```

#### payableList 计算（应付）
```
数据来源：purchaseRes（/stock/PurchaseOrder/index，list_rows=2000）
⚠️ 注意：后端 status 参数无效（会被忽略），必须前端过滤！

处理步骤：
  1. 先从 payRes（付款单）构建已付 Map：
     - 按 order_sn@@supplier_name 匹配 → procurePaidByKey
     - 按备注 "采购单付款 #ID" 匹配 → procurePaidById
  2. 遍历采购订单，跳过 status !== 1（前端过滤）
  3. 按供应商 key 聚合：
     - key = `id:${supplier_id}` 或 `name:${supplier_name}`
  4. 每条订单：
     - orderAmt = after_discount ?? total_amount
     - paidAmt  = procurePaidById[id] || procurePaidByKey[sn@@sup] || 0
     - un_pay_amount = max(0, orderAmt - paidAmt)
  5. applyProcureReturnsToPayableRows() 减去采购退货冲减额
  6. 追加 buildExpensePayableRows() 的待付款费用（生产成本类）

⚠️ 禁止用 row.pay_amount 作为已付金额（该字段是"审核时填的本次付款额"，不是累计已付）
禁止使用：/finance/PayAccounts/index（返回空）
```

#### receivableList 计算（应收）
```
数据来源：contractRes（/shop/ContractOrder/index?status=1）
处理步骤：
  1. 只取 status=1 的已签单合同
  2. un_pay_amount = max(0, total_amount - pay_amount)
  3. 过滤掉 un_pay_amount <= 0 的记录

禁止使用：/finance/CollectAccounts/index（返回空）
```

#### 资金账户余额计算
```
不使用后端 balance 字段（不可靠）
动态计算：
  income = collectList 按 fund_id 汇总
  expense = payList 按 fund_id 汇总
  display_balance = income - expense
  再经 applyProcureReturnsToFundRows() 加上采购退货退款
```

#### loadAllData 完整 API 请求列表
```
getFundList()                                    → fundRes
/finance/Prepay/index                            → prepayRes
getCollectReceiptList()                          → collectRes
getPayReceiptList()                              → payRes       ← 也用于计算采购已付金额
/stock/PurchaseOrder/index（list_rows=2000）     → purchaseRes  ← 前端过滤 status===1，用于应付
/stock/SaleOutOrder/index                        → saleOutRes
/retail/order/index                              → retailRes    ← 前端过滤 status===1
getExpenseList()                                 → expenseRes
/retail/recharge/index                           → rechargeRes
/shop/ShopCustomer/index                         → clientRes
/procure/supplier/index                          → supplierRes
/procure/ProcureReturn/index?status=1            → returnRes
/stock/SaleReturnOrder/index?status=1            → saleReturnRes
getContractList()?status=1                       → contractRes  ← 用于应收 + contractList
getGoodsList()                                   → pGoodsRes
/procure/ProcureInhouse/index                    → pInhouseRes
getBomList()                                     → pBomRes
```

---

### 3.2 FundFlow.vue — 资金流水明细

**文件**：`src/views/finance/FundFlow.vue`

#### 数据来源（与 Overview.vue allFlowItems 完全一致）
```
收款单、零售单(status=1)、会员充值、付款单、费用单、预收/预付款、
采购退货退款(status=1)、销售退货退款(status=1)
```

#### 路由过滤（query参数）
```
/finance/fund-flow           → 显示全部
/finance/fund-flow?type=income  → 只显示收入
/finance/fund-flow?type=expense → 只显示支出
```
使用 `watchEffect` 监听 `route.query.type`，支持 keep-alive 缓存下的路由切换。

#### summary 卡片
```
累计收入 = items.filter(income).sum(amount)
累计支出 = items.filter(expense).sum(amount)
资金余额 = 收入 - 支出
未付款   = 待付款费用(payment_status=pending)之和
         + 已审核采购订单欠款（total_amount - 付款单累计已付，前端 status===1 过滤）
         ⚠️ 采购欠款的已付金额必须从付款单匹配，不能用 row.pay_amount
```

#### 不使用的接口（已清理）
- ~~`/finance/PayAccounts/index`~~ — 空
- ~~`/finance/CollectAccounts/index`~~ — 空
- ~~`/shop/ContractOrder/index`~~ — 合同是应收凭据，不是资金流入

---

### 3.3 Receivable.vue — 应收账款

**文件**：`src/views/finance/Receivable.vue`

```
数据来源：/shop/ContractOrder/index?status=1
字段映射：
  应收金额 = total_amount
  已收金额 = pay_amount（映射为 paid_amount）
  待收欠款 = max(0, total_amount - pay_amount)
  合同单号 = order_sn || order_no
  签单日期 = order_date || created_at

只显示 un_pay_amount > 0 的记录
```

---

### 3.4 Payable.vue — 应付账款

**文件**：`src/views/finance/Payable.vue`

```
数据来源：
  1. /stock/PurchaseOrder/index?status=1   → 采购订单
  2. /procure/ProcureReturn/index?status=1 → 采购退货（冲减用）
  3. /procure/supplier/index               → 供应商列表（标签用）
  4. getExpenseList()                      → 费用单（待付款的生产成本）

供应商聚合：
  key = supplier_id 存在 ? `id:${supplier_id}` : `name:${supplier_name}`
  多供应商（goods_info 含多个 supplier_id）: `order:${order_id}`

应付金额：
  orderAmt = after_discount ?? total_amount
  paidAmt  = pay_amount
  un_pay_amount = max(0, orderAmt - paidAmt)

最终应付 = applyProcureReturnsToPayableRows(采购聚合, 退货) + 待付费用
```

---

## 四、工具函数说明

### 4.1 procureReturnFinance.ts（采购退货财务处理）

**文件**：`src/utils/procureReturnFinance.ts`

| 函数 | 输入 | 输出 | 用途 |
|------|------|------|------|
| `normalizeProcureReturnFinanceRows` | returnRows[], fundNameMap | ProcureReturnFinanceRow[] | 标准化退货数据，计算 return/deduct/refund 金额 |
| `applyProcureReturnsToPayableRows` | payableRows[], returnRows[] | payableRows（修改版） | 应付账款减去采购退货冲减额 |
| `applyProcureReturnsToPayReceiptRows` | paymentRows[], returnRows[] | paymentRows（修改版） | 付款单分摊退款 |
| `applyProcureReturnsToFundRows` | fundRows[], returnRows[] | fundRows（修改版） | 账户余额加上采购退款到账 |

**三个金额的含义**：
```
return_amount  = 退货总金额
deduct_amount  = 冲减应付款金额（min(return_amount, 未付余额)）
refund_amount  = 需要实际退款金额（max(0, return_amount - deduct_amount)）
```

### 4.2 saleReturnFinance.ts（销售退货财务处理）

**文件**：`src/utils/saleReturnFinance.ts`

| 函数 | 输入 | 输出 | 用途 |
|------|------|------|------|
| `normalizeSaleReturnFinanceRows` | saleReturnRows[] | SaleReturnFinanceRow[] | 标准化销售退货数据 |
| `buildSaleReturnSettlementRows` | receivableRows[], returnRows[] | SaleReturnSettlementRow[] | 退货结算（计算 deduct/refund） |
| `applySaleReturnsToReceivableRows` | receivableRows[], returnRows[] | receivableRows（修改版） | 应收账款减去销售退货冲减额 |
| `applySaleReturnsToCollectReceiptRows` | collectRows[], returnRows[], receivableRows[] | collectRows（修改版） | 收款单分摊退款 |

### 4.3 expensePayable.ts（费用应付处理）

**文件**：`src/utils/expensePayable.ts`

```
buildExpensePayableRows(expenseRows[]):
  过滤条件：payment_status === 'pending' && isProductionLaborExpense(row) && amount > 0
  输出格式：{ __payable_source: 'expense', supplier_name, order_amount, un_pay_amount, orders[] }
```

### 4.4 supplierLabel.ts（供应商标签）

**文件**：`src/utils/supplierLabel.ts`

```
getProcureOrderSupplierLabel(order, supplierList):
  - 解析 goods_info JSON → 提取 supplier_id 列表
  - 多个不同 supplier_id → "多供应商"
  - 单个 → 从 supplierList 查名称

getPayReceiptSupplierLabel(payRow, purchaseOrders, supplierList):
  - 从 payRow.order_sn 反查采购订单
  - 找到 → getProcureOrderSupplierLabel()
  - 没找到 → payRow.supplier_name || payRow.contact_name
```

---

## 五、常见问题排查

### Q: 某个金额显示 ¥0.00
**排查步骤**：
1. 打开浏览器 Network，确认对应 API 请求是否发出
2. 检查 API 响应的 `data.rows` 是否为空
3. 确认数据的 `status` 字段值（是否全是 0？）
4. 确认计算逻辑是否有 `status=1` 过滤把数据全过滤掉了

### Q: 两个页面同一指标数字不一致
**可能原因**：
- API 请求参数不同（一个加了 status 过滤，另一个没加）
- 数据来源不同（如一个用 PayAccounts，另一个用 PurchaseOrder）
- 字段名取值不同（`pay_amount` vs `paid_amount`，`total_amount` vs `after_discount`）

### Q: 金额数字明显偏大
**可能原因**：
- 未审核数据混入（status=0 的导入数据）
- 重复计算（同一笔数据在多个来源里都出现）
- 销售合同被误算为资金收入（合同是应收凭据，不是实际到账）

### Q: 应付/未付款显示 ¥0，但采购订单列表里有"未付款"状态的单子
**原因**：采购订单的付款状态是前端从付款单里反查计算的，`row.pay_amount` 字段是"审核时填的本次付款额"，不是累计已付。
**正确算法**：
1. 从 `/finance/PayReceipt/index` 取所有付款单
2. 按 `order_sn@@supplier_name` 或备注 `采购单付款 #ID` 匹配累计已付金额
3. `欠款 = total_amount - 累计已付`
4. 同时必须前端 `filter(r.status === 1)` 只算已审核单

### Q: 后端 status 参数过滤无效（采购订单）
已确认后端 `/stock/PurchaseOrder/index?status=1` 会忽略 status 参数，返回全量数据。
**必须在前端过滤**：`.filter(r => Number(r.status) === 1)`

---

## 六、数据状态约定

| 字段 | 值 | 含义 |
|------|------|------|
| `status` | 0 | 未审核（不记账） |
| `status` | 1 | 已审核/已确认（记账） |
| `status` | 2 | 其他状态（按业务定） |
| `payment_status` | `pending` | 待付款（费用单未付，在应付里，不在支出里） |
| `payment_status` | `paid` | 已付款 |
| `pay_type` | `customer` | 客户方向（预收款 = 收入） |
| `pay_type` | `supplier` | 供应商方向（预付款 = 支出） |
| `contact_type` | `supplier` | 付款单 → 采购付款 |
| `contact_type` | `customer` | 付款单 → 客户退款 |
| `contact_type` | `staff` | 付款单 → 员工费用 |
| `contact_type` | `other` | 付款单 → 其他支出 |
