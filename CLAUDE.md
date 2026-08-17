# CLAUDE.md — 数字游牧ERP 团队规范

> 这是团队共同维护的"活文档"。每当 Claude 写错变量名、弄错架构、或违反约定，
> 立刻把正确规则补进来。规则越多，Claude 越聪明。
>
> 维护方式：`git add CLAUDE.md && git commit -m "docs: 纠正Claude关于XXX的错误"`

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

> 记录 Claude 曾犯过的错误，防止重犯。
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

- [2026-07-02] 排查"上传没反应"时，用 `{__probe__:true}` POST `/api/brand-config` 覆盖了 KV 里整个 `brand_page_config:17747344571` 和 `brand_page_config_v1`（品牌页 25 个字段全丢，包括 heroTitle/reviews/categories/chapters/stats/values/carriers/policies/channels/faqs/theme/heroImages 等） → **铁律再次强调：任何"测试/探测"KV 写请求禁止用于生产端点。** 就算是"看一眼能不能写"也不行，因为 brand-config POST 是整对象覆盖。正确做法：
  - 想验证端点是否可写？先 GET 读一份，改一个 `__version__` 之类的次要字段，再 POST 回去，绝不能发 probe payload
  - 更好的做法：用 curl 打 KV 的 GET 端点看返回结构就够了，不要写测试
  - 排查功能问题：优先看 Network 面板 / Console，不要发合成请求
  - 事故恢复：localStorage `brand_page_config_v1` 有客户端最近一次同步的完整快照，可以整份 POST 回去恢复

- [2026-07-03] 园区地图"进入大厅"跳转 `/investment/city/hall/:id`，但路由表从未注册该路由，HallView（1234行）写完从未可达；另有"待执行转账"面板无任何生产端、永远为空 → **凡是新增页面/跳转，写完必须在路由表注册并实际点一遍；凡是审批类 UI，必须确认有对应的生产端数据源，否则删掉**

- [2026-07-02] 投资部门改版被做成在 `InvestmentLayout.vue` 里堆约 1700 行不带 scoped 的全局 CSS，用 `!important` + `nth-child` 强行覆盖所有子页面样式，还把 4200 行的 City.vue 异步加载进首页当背景装饰、模板引用了未 import 的 `adamAvatarUrl` → **铁律：视觉改版必须改组件本身的模板和 scoped 样式，禁止在布局文件里用全局 `!important` 批量覆盖子页面；禁止为了装饰引入整个业务页面组件。** 另注意：投资子页面（Market/City/Library/Archive/AdamChat）依赖 `.inv-layout` 上定义的 `--dark/--mid/--dim/--faint/--border/--card-bg/--accent/--gray` 兼容变量，重写布局时必须保留这组变量

- [2026-07-19] 权限过滤代码全对但店员仍看到全部功能，排查多轮才发现根因：**登录响应的 userInfo 不带 remark 字段（权限串存在 remark 里），`permConfig` 恒为 null，子账号全部被当成全权限**。修复：`auth.ts` 登录后调用 `ensureSubAccountRemark()`，从 `/setting/admin/index` 补拉本账号 remark。**铁律：排查权限问题先确认权限数据是否真的到了前端（看 localStorage `erp_user` 里有没有 `__perm__:` 串），再查过滤逻辑**；改完权限相关代码，必须让子账号退出重新登录才生效（localStorage 缓存的旧 userInfo 没有权限串）

- [2026-07-18] 手机端店员登录看到全部功能 → 手机端首页 `MobileWorkbench.vue` 的功能入口曾是写死列表，未接权限。**铁律：手机端任何新增功能入口/tab，必须用 `permStore.canAccessPath(path)` 过滤**；权限唯一入口是 `src/stores/permission.ts` 的 `canAccessPath`（收银台→`retail-order`，统计页→`reports-overview`/`finance-overview`），禁止在页面里自行判断权限

- [2026-07-11] 全站业务逻辑审计发现应收/应付计算在 4 处页面各自实现、口径漂移（FundFlow 未收款漏 status=4 合同/线上客户排除/退货扣减；Overview 应付漏零售附加费、附加费已付含"审核自动生成"；SupplierList 欠款用 total_amount 且不含附加费）→ **铁律：应收计算唯一入口 `src/utils/receivableCalc.ts`（buildContractReceivableItems + deductSaleReturnsByCustomer），应付计算唯一入口 `src/utils/payableCalc.ts`（buildSupplierPayableRows + buildContractFeePayableRows + buildRetailFeePayableRows）。任何页面需要应收/应付数字必须调用这两个 utils，禁止在页面内复制实现；口径要改就改 utils，所有页面自动同步。**

- [2026-08-09] 销售合同列表日期筛选后，编组行（核对历史）仍整组显示且日期区间是全历史 → **凡是给列表加的筛选条件（日期区间/状态/关键词），必须同时穿透到编组行内部**：`Contract.vue` 的 `filteredContractApi` 里 `groupRows` 从 `allRows` 取成员，必须对每个筛选条件都过滤一遍（已有 `matchesGoods`，现补 `matchesDate`），组内无匹配则 `return null` 整组隐藏。新增筛选条件时同步补穿透，禁止只改主列表的 `filtered`

- [2026-08-10] 品牌页商品图加载慢，排查中连续三次方案落空 → **记录约束和事实，别再重复踩**：
  - **用户不买域名、不花钱**。任何需要自定义域名（zone）的方案直接排除 —— 账号下 `zones` 为空，`*.pages.dev` 用不了 `/cdn-cgi/image/` 图片缩放（返回 404）
  - **Cloudflare Pages Functions 不支持 Images 绑定**（`env.IMAGES`）。Pages 只支持 KV/R2/D1/AI/Queues/Vectorize/Hyperdrive/Analytics/Service 这几类；`wrangler.toml` 里写 `[images]` 会直接报 `Configuration file for Pages projects does not support "images"` 导致部署失败
  - **诊断顺序**：量图片慢先做同域对照（静态资源 vs Worker 路径），别一上来就怪 Worker/KV。实测 Worker 读 KV 服务端只花 0.43s，纯 CDN 静态图也要 0.27s，Worker 不是瓶颈
  - **真正的原因是图存得太肥**：商品原图 800×800 存了 430KB（0.67 字节/像素，正常应 0.15–0.25）。转成同分辨率 WebP 只要 54KB，小 8 倍且画质无损 —— 优化方向是换格式，不是缩尺寸（手机 2 倍屏 270px 格子本来就需要 540px+ 的图）
  - **lazy loading 对这个页面基本无效**：整页只有约 3 屏高，Chrome 预加载范围本来就覆盖得到，加了 `loading="lazy"` 首屏该下的还是全下
  - `functions/media/[[path]].js` 读取器已支持 `.webp` 后缀，KV 里放一份 `.webp` 就能直接用，不需要改 Worker

- [2026-08-10] 品牌页图片提速只改了 Products.vue，用户点开 `/#/brand/wholesale` 发现"还是慢"→ **改图片/样式类的通用优化，必须先把同类页面全查一遍再动手，不能只改用户当时打开的那一个**。品牌前台一共 4 个组件会渲染商品图：`Products.vue`(商品列表) / `Index.vue`(`/#/brand/wholesale` 和 `/#/brand` 都是它) / `ProductDetail.vue`(详情页，13 张详情图最肥) / `Cart|Checkout|Story|Wholesale.vue`。查漏命令：`grep -c "<img" src/views/brand/*.vue` 对比 `grep -c webpUrl`
- [2026-08-10] 小程序代码有两份，差点改错 → **线上小程序是 `/Users/oralagborjigin/WeChatProjects/minicode-1/`（33 个页面、有 appid key、有分销/会员/附近门店）**；`/Users/oralagborjigin/nomad-erp-miniapp/` 是 6 月的旧脚手架副本（只有 10 个页面），已废弃，别动。改前先 `ls pages/ | wc -l` 确认
- [2026-08-10] 小程序图片走 WebP 的三个前提，缺一不可：① `<image>` 必须写 `webp="{{true}}"`（WebView 渲染模式默认不解析 WebP，Skyline 才原生支持）；② 错误回调是 `binderror`，**`binerror` 是拼错的、根本不会触发**（旧代码 5 处都写错了）；③ URL 改写走 `utils/media.wxs` + `utils/imgFallback.js` 的 `imgErr` 映射表，WebP 缺失时自动退回原图，绝不能一失败就把图清空

- [2026-08-14] 在 `dist/` 目录里跑 `wrangler pages deploy`，导致 Functions 全部没上传，`/adminapi/*` 被 SPA 兜底返回 index.html，商品列表空、登录挂 → **部署必须在项目根目录 `/Users/oralagborjigin/new-clone-system` 执行**：`cd /Users/oralagborjigin/new-clone-system && CLOUDFLARE_API_TOKEN=xxx npx wrangler pages deploy dist --project-name digital-nomad --commit-dirty=true`。wrangler 是从**当前工作目录**找 `functions/` 的，cwd 错了就静默丢掉整个后端。部署输出里必须看到 `Compiled Worker successfully` 和 `Uploading Functions bundle` 两行，没有就是 Functions 没上去，立刻重发。

- [2026-08-15] 财务总览「账户余额」在用户机器上永久空白，Claude 连续四次误判（还在加载→时好时坏→接口失败加重试→Service Worker），全靠把失败原因打到屏幕上才定位 → 真因：`/adminapi/*` 响应**没有任何 `Cache-Control` 头**，浏览器按启发式规则把 Functions 掉线期间的一次 404 存进磁盘缓存并永久复用，表现为「同一地址在某台机器上永远 404、别处永远 200」。规则：
  - **只有一台机器复现的接口问题，先怀疑本地 HTTP 缓存**，不要从后端/并发/权限开始猜；服务端 curl 正常 + 无 SW + 域名路径都对 ⇒ 几乎必然是浏览器缓存
  - 关键数据的 GET 用 `fetch(url + "&_t=" + Date.now(), { cache: "no-store" })` 绕开缓存
  - **排查跨机器差异，不要继续推理，把失败原因渲染到界面上**（HTTP 状态 + 实际请求 URL + `navigator.serviceWorker.controller`），用户截一张图就能定位，比十轮猜测快
  - 空状态禁止和失败状态共用一套文案：`暂无数据` 和 `加载失败：原因` 必须分开，否则故障被伪装成"没数据"

- [2026-08-17] 同一个缓存问题复发：单据表单的「付款账户」下拉加载不出来 → 上次只在 `Overview.vue` 一个页面用 `fetch(no-store)` 绕过去，**病根（`/adminapi/*` 不发 `Cache-Control`）没治**，所以全站 20 多个页面的账户下拉照样中招。**只治当前那一个页面 = 没治**，同类问题必须找共同入口。正确修法（已实施）：
  - 治本：`functions/adminapi/[[path]].js` 的 `corsHeaders()` 统一加 `Cache-Control: no-store, no-cache, must-revalidate` + `Pragma: no-cache`。所有响应都经过这个函数（含代理分支的 `newHeaders.set`），一处生效全站生效。adminapi 全是带鉴权的动态数据，本来就一条都不该缓存
  - 治标：**服务端新加的 no-store 救不了已经躺在用户磁盘缓存里的旧条目** —— 浏览器认为它还新鲜，压根不会再发请求。必须换 URL 才绕得过去，所以 `getFundList` 加了 `_t: Date.now()`
  - 注意缓存按**完整 URL**分条：`list_rows=100` 和 `list_rows=200` 是两条独立缓存，修一个不等于修全部
