# 财务模块逻辑文档

> 最后更新：2026-04-12（修复多采购单付款金额双重计数问题）  
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

## 二、基础财务恒等式与业务规则

> 这是财务逻辑的地基。修改任何财务计算前，先对照这里的恒等式验证思路是否正确。

### 2.1 核心恒等式

```
【应付账款】
应付总额 = 已审核采购单金额合计 - 累计已付款 - 采购退货冲减
欠款 ≥ 0（不能为负）
超付部分 → 转为预付款，不是负欠款

【应收账款】
应收总额 = 已审核销售合同金额合计 - 累计已收款 - 销售退货冲减
欠款 ≥ 0（不能为负）
超收部分 → 转为预收款，不是负欠款

【资金余额】
资金余额 = 所有收入流水合计 - 所有支出流水合计
（不使用后端 balance 字段，动态计算）

【单账户余额】
账户余额 = 该账户收款合计 - 该账户付款合计
所有账户余额之和 = 资金余额（必须一致）

【预付款 / 预收款】
预付款 = max(0, 累计已付 - 应付总额)   ← 多付了才有预付款
预收款 = max(0, 累计已收 - 应收总额)   ← 多收了才有预收款
```

### 2.2 单据维度规则（最容易出错）

```
欠款必须在【单据维度】计算，不能跨单据混算

✅ 正确：
  订单A 应付100，已付100 → 订单A 欠款 = 0
  订单B 应付200，已付0   → 订单B 欠款 = 200
  供应商总欠款 = 0 + 200 = 200

❌ 错误（跨单据混算）：
  供应商总应付 = 300，总已付 = 100 → 欠款 = 200（看似对，但付款没对应到具体单据，
  一旦付款单没有 supplier_id 就会漏算）

付款单必须通过 order_id / 备注 / 单号 匹配到具体采购单，才能抵扣该单欠款。
未匹配到任何采购单的付款，不能计入欠款抵扣。
```

### 2.3 退货财务规则

```
【采购退货】
退货金额 ≤ 原采购单金额
若原单未付清：退货先冲减应付（deduct_amount），剩余才退款（refund_amount）
  deduct_amount = min(退货金额, 未付余额)
  refund_amount = max(0, 退货金额 - deduct_amount)

【销售退货】
退货金额 ≤ 原销售合同金额
若原单未收清：退货先冲减应收（deduct_amount），剩余才退款（refund_amount）
逻辑同采购退货对称
```

### 2.4 收支分类规则

```
【是资金流水的】（实际钱进出账户）
  收入：收款单、零售实收、会员充值、采购退货退款（实际到账部分）
  支出：付款单、费用单（已付）、销售退货退款（实际退出部分）

【不是资金流水的】（只是凭据/权利）
  销售合同 → 应收凭据，签了合同不等于钱到账
  采购订单 → 应付凭据，下了订单不等于钱出去了
  费用单(pending) → 只是记录待付，钱还没出去

⚠️ 销售合同绝对不能计入资金收入，否则余额虚高
⚠️ 采购订单绝对不能计入资金支出，否则余额虚低
```

### 2.5 金额字段优先级

```
采购订单金额：after_discount ?? total_amount
  （有折扣时用折后价，无折扣用原价）

销售合同金额：total_amount（合同总额）
  已收：pay_amount
  待收：max(0, total_amount - pay_amount)

付款/收款单金额：amount字段（直接使用，无需计算）

⚠️ 禁止使用 row.pay_amount 作为采购单"已付金额"
   该字段是"审核时填写的本次付款额"，不是累计已付总额
   累计已付必须从付款单列表匹配计算
```

---

## 三、资金收支来源（income/expense）

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
  1. 先从 payRes（付款单）构建已付 Map（3种方式，互斥分配）：

     ⚠️ 互斥规则（每条付款记录只进一个 Map，防止双重计数）：
       - 优先级1：order_id 直接匹配 → procurePaidById[order_id]
       - 优先级2a：备注 `采购单付款 #ID`（单个ID）→ procurePaidById[id]
       - 优先级2b：备注 `采购单付款 #ID1 采购单付款 #ID2`（多个ID）→ procurePaidMultiBySup[supplier_name]
         ⚠️ 多ID不能把全额加给每个单（会导致金额 ×N 倍），必须存到供应商维度后再分摊
       - 优先级3：备注 `采购单XXXXX审核自动生成` → procurePaidBySn[sn]（历史数据）
       - 兜底（matched=false）：`order_sn@@supplier_name` → procurePaidByKey（手动付款）
     ⚠️ 用 matched 标志位控制：一旦命中优先更高的匹配就不再放入低级 Map

  2. 遍历采购订单，跳过 status !== 1（前端过滤）
  3. 按供应商 key 聚合：
     - key = `id:${supplier_id}` 或 `name:${supplier_name}`
  4. 每条订单：
     - orderAmt = after_discount ?? total_amount
     - oSn = order_sn（内部编号）
     - oNo = order_no（展示单号，审核自动生成的付款记录里存的是这个）
     ⚠️ 必须同时查两个字段：
     - paidAmt = (paidById[o.id] || 0)
                 + (paidBySn[oSn] || paidBySn[oNo] || 0)
                 + (paidByKey[oSn@@sup] || paidByKey[oNo@@sup] || 0)
     - un_pay_amount = max(0, orderAmt - paidAmt)
  5. 多ID付款分摊（paidMultiBySup）：
     - 聚合完成后，对 paidMultiBySup 里每个供应商的额外已付金额
     - 按单据 id 升序，依次冲销各单 un_pay_amount（先欠的先还）
     - Payable.vue：在 orders 循环后单独一个循环处理分摊
     - Overview.vue：在 supplierPayMap 构建后，直接加到 supplier 的 paid_amount，减少 un_pay_amount
     - Order.vue（采购单列表）：loadPaidMap 时额外查一次采购单，计算欠款后写入 idMap，再设 paidMapById
  6. applyProcureReturnsToPayableRows() 减去采购退货冲减额
  7. 追加 buildExpensePayableRows() 的待付款费用（生产成本类）
  8. 最终只保留 un_pay_amount > 0 的行

⚠️ 禁止用 row.pay_amount 作为已付金额（该字段是"审核时填的本次付款额"，不是累计已付）
⚠️ 禁止使用 ||（或）替代 +（加）来累加多笔付款——同一订单可能有多笔付款分布在不同 Map，
   必须全部相加才是总已付金额
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
  oSn = order_sn（内部编号）
  oNo = order_no（展示单号）
  ⚠️ 付款匹配必须同时查 oSn 和 oNo（审核自动生成的记录存的是 order_no）
  paidAmt = (paidById[o.id] || 0)
            + (paidBySn[oSn] || paidBySn[oNo] || 0)
            + (paidByKey[oSn@@sup] || paidByKey[oNo@@sup] || 0)
  ⚠️ 用 + 而不是 ||，同一订单多笔付款必须全部累加
  ⚠️ paidMap 构建时每条记录用 matched 标志互斥分配，防止双重计数
  un_pay_amount = max(0, orderAmt - paidAmt)
  ⚠️ 禁止用 row.pay_amount 作为已付金额

最终应付 = applyProcureReturnsToPayableRows(采购聚合, 退货) + 待付费用
只显示 un_pay_amount > 0 的行
```

---

### 3.5 SupplierList.vue — 供应商列表欠款

**文件**：`src/views/procure/SupplierList.vue`

```
供应商列表和查看弹窗中显示的 欠款/累计采购/累计付款/预付款 计算规则：

累计采购（purchaseMap）：
  只算 status===1 的已审核采购单
  单一供应商：整单 total_amount 归 supplier_id
  多供应商（goods_info 含行级 supplier_id）：按行拆分，每行 num×price

累计付款（paidMap）：
  ⚠️ 必须按采购单匹配，不能直接按 supplier_id/contact_id 加总
  匹配方式与 Payable.vue 完全一致（paidById / paidBySn / paidByKey / paidMultiBySup）
  ⚠️ 同样需要同时匹配 order_sn 和 order_no 两个字段
  ⚠️ 多ID备注付款需写入 paidMultiBySup，通过 supNameToId 映射到 supplier_id 后汇总
  只统计匹配到已审核采购单的付款金额

欠款 = max(0, 累计采购 - 累计付款)
预付款 = max(0, 累计付款 - 累计采购)
```

---

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
2. 按备注 `采购单付款 #ID` 匹配（最可靠）或 `order_sn@@(supplier_name||contact_name)` 匹配累计已付金额
   ⚠️ 付款单 `supplier_name` 字段可能为空（自动生成的记录），此时取 `contact_name`
3. `欠款 = total_amount - 累计已付`
4. 同时必须前端 `filter(r.status === 1)` 只算已审核单

### Q: 后端 status 参数过滤无效（采购订单）
已确认后端 `/stock/PurchaseOrder/index?status=1` 会忽略 status 参数，返回全量数据。
**必须在前端过滤**：`.filter(r => Number(r.status) === 1)`

---

## 六、财务审查逻辑清单

> 用于定期或手动检查 ERP 数据和前端展示是否符合业务逻辑
> 最后审查日期：2026-04-06

### 6.1 单据状态审查
| 检查项 | 预期 | 异常标志 |
|--------|------|----------|
| 未审核单据 | 不计入任何财务和库存（正常业务状态） | 若出现在统计数字里则说明过滤缺失 |
| 已审核采购单 | 进入应付账款 + 库存 | 应付为0但有已审核采购单 |
| 已审核收付款单 | 进入资金流水 + 账户余额 | 流水有记录但余额不变 |

### 6.2 采购链路审查
| 检查项 | 预期 |
|--------|------|
| 应付账款 | = 已审核采购单合计 - 供应商付款单合计 - 采购退货冲减 |
| 供应商付款单 | 每条必须能匹配到对应采购单（3种匹配方式） |
| 已全额付款的采购单 | 不应出现在应付列表，不应有付款按钮 |
| 付款金额 | 不应超过采购单金额 |

### 6.3 销售链路审查
| 检查项 | 预期 |
|--------|------|
| 应收账款 | = 已审核合同合计 - 客户收款单合计 - 销售退货冲减 |
| 客户收款单 | 每条必须能匹配到对应合同 |
| 已全额收款的合同 | 不应出现在应收列表，不应有收款按钮 |
| 退货金额 | 不应超过原始订单金额 |

### 6.4 账户余额审查
| 检查项 | 预期 |
|--------|------|
| 每个账户系统余额 | = 该账户收入流水合计 - 该账户支出流水合计 |
| 差额说明 | 账户有未录入的收支，或初始余额未对应收款单 |
| 已删除账户 | 不应再计入余额统计 |

### 6.5 流水归类审查
| 检查项 | 合法值 |
|--------|--------|
| 付款单 contact_type | supplier / customer / staff / other |
| 收款单 contact_type | customer / supplier / staff / other |
| 空值 | ❌ 不允许，归类失效导致财务分类统计不准 |
| 非法值 | ❌ 不允许 |

### 6.6 展示逻辑审查（前端）
| 检查项 | 预期 |
|--------|------|
| 应付列表 | 只显示 un_pay_amount > 0 的采购单 |
| 应收列表 | 只显示 un_pay_amount > 0 的合同 |
| 付款按钮 | 仅在 un_pay_amount > 0 时显示 |
| 收款按钮 | 仅在 un_pay_amount > 0 时显示 |
| 资金流水 | 不包含 amount <= 0 的记录 |

### 6.7 跨模块一致性审查
| 检查项 | 预期 |
|--------|------|
| 总览卡片 vs 各模块数字 | 总收入、总支出、资金余额、应付、应收数字完全一致 |
| 总览 vs 资金流水 | 同一来源，数字必须一致 |
| 账户余额合计 vs 资金余额 | 所有账户余额之和 = 资金流水余额 |

**⚠️ 死规矩：任何财务计算逻辑修改，必须同步更新 Overview.vue 中对应的计算代码。**  
两处逻辑必须完全一致，不允许有任何差异。  
涉及文件：`Payable.vue` ↔ `Overview.vue`（payableList计算），`FundFlow.vue` ↔ `Overview.vue`（allFlowItems计算）

### 6.8 已知问题 / 修复记录

#### 已修复（2026-04-12）
5. ✅ **应付款多采购单付款金额双重计数**
   - 背景：从应付款页面对同一供应商多张欠款单点"付款"，生成的付款单备注为 `采购单付款 #474 采购单付款 #476 采购单付款 #478`
   - 原因：matchAll 取到多个 ID 后，把全额（¥250）分别加给每个单，导致每张单都显示"已付 ¥250"，金额 ×N 倍
   - 修复逻辑：
     - 单个ID备注 → 直接归到 `paidById[id]`（不变）
     - 多个ID备注 → 存入 `paidMultiBySup[supplier_name]`（按供应商维度）
     - 聚合完成后，按单据 id 升序依次冲销：先算出该单已有匹配金额，剩余欠款再从 paidMultiBySup 里扣减
   - 同步修复：`Payable.vue`、`Overview.vue`、`SupplierList.vue`、`Order.vue` 四个文件
   - goPay 跳转也同步修改：多张单统一传 `order_ids`（逗号分隔），PayReceiptNew.vue 自动生成多ID备注

#### 已修复（2026-04-11）
4. ✅ **采购单付款单创建规则**
   - 付款单**只由后端审核时自动创建**，前端不创建（避免双重）
   - 编辑已有采购单时，payload **不传 order_no/order_sn**，只传 id 和其他字段
   - 后端重复检测规则：同供应商 + 同金额 + **同采购单号**（order_sn）→ 拒绝；无 order_sn 的手动付款不做重复检测
   - 收款单重复检测同理：同客户 + 同金额 + **同销售单号**（order_sn）→ 拒绝

#### 未解决
1. 🔴 **乌日力格账户余额差 ¥8,867.61**
   - 账户只有支出无收入，系统余额与流水不符
   - 原因：账户建立时疑似手动设置了初始余额，无对应收款单
   - 待处理：确认来源后补录收款单

2. 🟡 **收款单3条 contact_type 为空**
   - 单号：QTSR0000050、QTSR0000053、QTSR0000054
   - 备注里写了 [other] 但字段未存入
   - 待处理：补填 contact_type = 'other'

#### 已修复（2026-04-10）
3. ✅ **应付账款付清后仍显示欠款**（Payable.vue + Overview.vue）
   - 原因1：付款 Map 构建没有互斥，同一笔记录同时进入多个 Map 导致双重计数
   - 原因2：paidAmt 用 `||` 而不是 `+`，多笔付款只取第一个非零值
   - 原因3：只查 `order_sn`（内部编号），未查 `order_no`（展示单号），审核自动生成的付款记录存的是 order_no
   - 修复：改为互斥 matched 标志分配 Map，paidAmt 改用 `+` 累加，同时匹配 oSn 和 oNo
   - 同步：Payable.vue 和 Overview.vue 两处逻辑同时修复，保持一致

---

## 七、数据状态约定

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
