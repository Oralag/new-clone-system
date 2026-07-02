# AGENTS.md — 数字游牧ERP 团队规范

> 这是团队共同维护的"活文档"。每当 Codex 写错变量名、弄错架构、或违反约定，
> 立刻把正确规则补进来。规则越多，Codex 越聪明。
>
> 维护方式：`git add AGENTS.md && git commit -m "docs: 纠正Codex关于XXX的错误"`

---

## 工作流程规范

### 第 3 条 — 开始前确认计划
任何涉及以下情况的任务，必须先描述改动方案，等用户确认后再动手：
- 跨多个文件的修改
- 涉及 `http.ts`、路由守卫、Pinia store、Cloudflare Worker 的改动
- 影响认证、权限、部署流程的改动

简单的单文件小改动可以直接执行。

### 第 6 条 — 改动尽量小
- 每次只改解决当前问题所必需的代码，不顺手重构周边
- 不在修 bug 时"顺便优化"无关代码
- 改动应影响尽量少的文件
- 不确定该改哪一层（前端 / Worker / API）时，先问，不要猜

---

## 项目概览

- **应用名称**: 数字游牧ERP（勿用"企禾云"，已废弃）
- **技术栈**: Vue 3 + Vite + TypeScript + Element Plus + Pinia + Vue Router + Axios
- **部署**: Cloudflare Pages — https://nomaderp.pages.dev
- **后端 API**: `https://nomaderp.pages.dev/adminapi/`（通过 Cloudflare Pages 代理到 Railway erp-server）

---

## 一、命名规范

### 变量 / 函数

| 场景 | 规范 | 示例 |
|------|------|------|
| 普通变量 | camelCase | `pageSize`, `tableData` |
| 布尔值 | `is` / `has` 前缀 | `isLoading`, `hasPermission` |
| 响应式数据 | 直接 camelCase，不加 `ref`/`reactive` 后缀 | `list`，不是 `listRef` |
| 事件处理函数 | `handle` 前缀 | `handleSubmit`, `handleSearch` |
| API 请求函数 | 动词 + 名词 | `fetchOrderList`, `createInvoice` |
| Pinia Store | `use` + 名词 + `Store` | `useAuthStore`, `usePermissionStore` |

### 文件命名

| 类型 | 规范 | 示例 |
|------|------|------|
| Vue 组件 | PascalCase | `OrderList.vue`, `AiAssistant.vue` |
| 普通 TS 文件 | camelCase | `http.ts`, `toolExecutor.ts` |
| 视图页面 | PascalCase，放在对应模块文件夹 | `views/sale/SaleOrder.vue` |

### 常量

- 全大写 + 下划线，定义在 `src/config/index.ts`
- 示例：`API_URL`, `TOKEN_NAME`, `USER_INFO_KEY`, `APP_NAME`

---

## 二、目录结构

```
src/
├── api/           # Axios 请求函数，按模块分子目录
│   ├── http.ts    # Axios 实例（唯一，勿新建）
│   ├── auth.ts    # 登录/登出 API
│   └── {module}/  # 如 sale/, finance/, warehouse/
├── components/    # 公共组件（跨页面复用）
│   └── ai/        # AI 助手相关组件
├── config/
│   └── index.ts   # 所有常量集中于此
├── layouts/
│   └── AdminLayout.vue  # 主框架（侧边栏+顶栏+标签栏）
├── router/        # 路由配置（hash 模式）
├── server/        # Vite 开发中间件 / AI 工具
│   ├── tools/     # ERP 工具 schema + 执行器
│   └── agents/    # AI 意图编排
├── stores/        # Pinia 状态管理
├── utils/         # 纯工具函数（无副作用）
└── views/         # 页面组件，按业务模块分目录
    ├── dashboard/
    ├── sale/
    ├── finance/
    └── ...
```

**原则**：
- 不在 `views/` 里放公共组件，公共组件一律在 `components/`
- 不在 `utils/` 里写有副作用的代码（不引用 store、不调用 API）
- 不新建第二个 axios 实例，统一用 `src/api/http.ts`

---

## 三、认证与 API 调用

### Token

```typescript
// 正确：header key 是 'token'，不是 'Authorization'
config.headers['token'] = token

// 错误示例（勿用）：
// config.headers['Authorization'] = `Bearer ${token}`
```

- Token 存储键名：`localStorage.getItem('erp_token')` — 即 `TOKEN_NAME` 常量
- 用户信息键名：`localStorage.getItem('erp_user')` — 即 `USER_INFO_KEY` 常量

### API 响应结构

```typescript
// 后端统一返回格式
{ code: 1, data: any, message: string }

// code === 1  → 成功
// code === -1 → 未授权，需跳转登录
// 其他        → 业务错误，message 展示给用户
```

- 响应拦截已在 `http.ts` 处理，**各模块 API 函数只处理 `res.data`，不再重复判断 code**

---

## 四、路由规范

- 使用 **Hash 模式**（`createWebHashHistory`），不用 HTML5 History
- 路由 path 全小写 + 连字符：`/sale-order`，不用 `/saleOrder`
- 需要权限保护的页面不加 `meta.public`；登录页、门户页加 `meta: { public: true }`
- 超管专属页面加 `meta: { superAdmin: true }`

---

## 五、组件规范

### Element Plus 使用

- 弹框用 `ElMessageBox`，轻提示用 `ElMessage`
- 表格必须设置 `height` 或外层容器限高，防止页面撑开
- 表单验证规则写在 `rules` 对象里，不写行内

### Vue 3 Composition API

```typescript
// 正确：script setup 语法
<script setup lang="ts">
const props = defineProps<{ title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

// 不用 Options API（除非维护旧组件）
```

---

## 六、AI 助手规范

- AI 聊天走 SSE，前端用 `useAiAgent.ts` composable，不直接操作 fetch
- SSE 事件类型：`text` / `tool_start` / `tool_result` / `error` / `[DONE]`
- 工具 schema 定义在 `src/server/tools/erpTools.ts`，执行器在 `toolExecutor.ts`
- 新增 ERP 工具：先在 `erpTools.ts` 加 schema，再在 `toolExecutor.ts` 加 case
- AI 代理最多循环 5 次（防止死循环），超出直接返回结果

---

## 七、构建 & 部署

```bash
# 本地开发
npm run dev          # 端口 5173

# 构建（不跑 vue-tsc，只跑 vite build）
npm run build

# 一键部署到 Cloudflare Pages
npm run deploy
```

- **不要**在构建命令里加 `vue-tsc`，项目有已知 TS 类型错误不影响运行
- 构建产物在 `dist/`，不要提交到 Git

---

## 八、团队纠错记录

> 记录 Codex 曾犯过的错误，防止重犯。
> 格式：`- [日期] 错误描述 → 正确做法`

- [2026-03-14] 初始建立规范文档
- [2026-03-14] 下拉选项出现重复 → 从API赋值 cateOptions 时必须按 name 去重：`const rc = rows; cateOptions.value = rc.filter((c, i) => rc.findIndex(x => x.name === c.name) === i)`，禁止直接 `cateOptions.value = res.data?.rows ?? []`
- [2026-03-18] 新建客户界面财务信息面板消失 → `finance-panel` 禁止加 `v-if="formData.id"`，必须始终显示；只有"充值预付款"/"查看应收记录"操作按钮才加 `v-if="formData.id"`（文件：`src/views/sale/ClientList.vue`）
- [2026-03-18] 删除零售/采购订单后资金账户余额未更新 → 删除前必须先调用资金账户回滚逻辑（零售：扣减"零售收款账户"；采购：加回对应 fund_id 账户）；`del-path` 改用 `batchDelApi` prop 以支持删除前 hook

- [2026-03-22] AI助手创建商品/客户/供应商时允许重名 → `toolExecutor.ts` 中 `create_goods`/`create_customer`/`create_supplier` 必须先查询同名记录，已存在则拒绝创建；`orchestrator.ts` 的 create 提示词也要指导 AI 先检查重名

- [2026-04-06] 未审核单据进了库存和财务 → **铁律：所有单据必须 status===1（已审核）才能影响库存和财务。** 具体规则：
  - 零售单：审核后才扣库存、才计入财务流水和应收；`FundFlow.vue`/`Overview.vue` 统计零售单款必须 `.filter(r => r.status === 1)`
  - 采购订单：审核后才入库存；应付账款/未付款统计必须只算 `status===1` 的单子（后端不过滤，必须前端 `.filter(r => Number(r.status) === 1)`）
  - 销售合同/出库单/采购退货/销售退货：同理，未审核一律不进财务和库存
  - **禁止**用后端 `status=1` 参数来过滤（后端忽略该参数），必须在前端过滤

- [2026-04-09] 应付账款显示已付清的供应商 → `Payable.vue` 聚合后必须过滤 `un_pay_amount > 0`，付清的不显示：`rawRows.value = [...aggregated.filter(s => s.un_pay_amount > 0), ...expensePayables]`
- [2026-04-09] 供应商欠款计算不对 → `SupplierList.vue` 付款统计必须按采购单匹配（同 Payable.vue 逻辑），不能直接按 supplier_id/contact_id 加总；付款单通过 order_id、备注#ID、单号 匹配到对应已审核采购单才算

- [2026-04-09] 修了应付账款/采购单的付款匹配逻辑，但没同步 Overview.vue → **铁律：任何财务计算逻辑修改，必须同步更新 `Overview.vue` 中对应的计算代码，两处逻辑必须完全一致，不允许有任何差异**
- [2026-04-11] 出入库流水弹窗显示未审核单据 → `StockAll.vue` 的 `openFlowDialog` 中，零售出库和销售出库循环缺少 status 过滤；任何单据类型的流水循环都必须先加 `if (Number(r.status) !== 1) continue`，不允许遗漏任何一种单据类型
- [2026-04-12] 调拨管理只做了界面，审核没有联动库存变动和流水 → **铁律第一条：做任何单据功能，必须第一步考虑完整业务链：审核→库存变动→流水记录→财务影响，缺一不可，不允许只做界面不做逻辑**
- [2026-04-12] 做调拨管理没有先访问原网站对照 → **铁律第二条：修改或新增任何功能前，先在原网站（https://saas.mzth.cn/admin/）查看参考逻辑和字段，再在我们自己的网站（nomaderp.pages.dev）实际操作一遍确认现状，然后再动手开发**

- [2026-04-17] 附加费用付款同时调用 createPayReceipt + createExpense 导致流水重复 → 附加费用付款只调用 createPayReceipt（FK单），禁止再调用 createExpense；两个函数都调用会在资金流水明细里产生两条记录
- [2026-04-25] 反审核用 OtherOut 抵消库存，流水出现两条脏记录 → **铁律：反审核后库存流水里不可以有任何记录**；反审核 = 找到审核时创建的原始单据直接删除，流水自然清空；禁止用 OtherOut/OtherIn 创建反向单来抵消

- [2026-06-04] 批量写DB时整体替换商品remark字段，导致6个商品品牌图片/SKU数据全部丢失 → **铁律：任何批量DB写操作必须先READ现有字段，在内存中MERGE后再写回，绝不整体覆盖；未经用户明确确认禁止执行任何数据删除或覆盖**

- [2026-06-10] 同一remark覆盖事故再次发生（第3次），根因：bash脚本shell引号截断JSON导致读到空值再写回 → **铁律：禁止用bash/shell脚本对商品remark做任何写操作。** 唯一允许的方式：调用后端 `/goods/ShopGoods/patchBrand` 接口（PostgreSQL jsonb原子合并），该接口在DB层保证只merge指定字段，绝不覆盖其他字段。前端Info.vue保存品牌数据也必须通过此接口。

- [2026-05-29] **铁律：用户有"未提交但已部署"的本地改动时，禁止执行 `git reset --hard` / `git checkout`** → Cloudflare 是纯手动部署（与 GitHub 无连接，push 备份分支完全安全）。真正的危险是：git 操作改变本地源文件 → 之后 build+deploy → 旧版本上线。规则：
  - 做备份前必须先问用户："你有没有未提交但已部署到线上的修改？" 有的话先 `git add -A && git commit` 固化，再做 git 操作
  - `git reset --hard` 是高危操作，执行前必须确认本地文件与最后一次部署一致
  - push 到 GitHub 备份分支完全安全，不会触发 Cloudflare 自动部署
