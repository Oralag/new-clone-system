# 新客户实例开通手册（单租户 SaaS 起步版）

> 原则：**每个客户 = 一套全新的独立资源**。你自己的生产库、KV、Render 服务、Cloudflare 项目
> 在整个流程中**只读都不碰**。本手册配合 `scripts/prepare-instance.sh` 使用。

---

## 0. 架构速览（每客户一份）

| 资源 | 生产（你自己的，勿动） | 新客户需要新建 |
|------|----------------------|---------------|
| 前端 | Cloudflare Pages `digital-nomad` | 新 Pages 项目 `erp-<客户名>` |
| 后端 | Render `erp-server-xsji` | 新 Render 服务（同镜像/仓库） |
| 数据库 | Neon 生产库 | 新 Neon 项目（空库跑初始化） |
| KV | `AGENT_MEMORY` / `USERS_KV` 生产命名空间 | 新建两个 KV 命名空间 |
| 代码 | 本仓库（含全部历史） | 脚本导出的**净化副本**（无历史） |

## 1. 导出净化代码包

```bash
bash scripts/prepare-instance.sh <客户名>
# 产出 ../erp-instance-<客户名>/ ：全新 git 历史，无备份、无 .env、无本地配置
```

脚本自动排除的内容（为什么重要）：
- `.git/`（**192MB 历史里含数据库备份与历史敏感串，绝不能给客户**）
- `backups/`（84MB 你的真实业务数据）
- `.env` `.env.development` `.env.production`（密钥）
- `.claude/`（含本地 Token 的工具配置）
- `dist/` `node_modules/`

## 2. 新建后端（Render）

1. Render 新建 Web Service，指向净化副本仓库（或同一后端镜像）
2. 挂**新建的 Neon 数据库**，跑一遍初始化 SQL（空库结构，不导你的数据）
3. 记下服务域名 `https://erp-<客户名>.onrender.com`

## 3. 新建前端（Cloudflare Pages）

1. `wrangler pages project create erp-<客户名>`
2. 改净化副本中 `functions/adminapi/[[path]].js` 的 `DEFAULT_BACKEND` 为客户后端域名
3. 新建两个 KV 命名空间并绑定：`AGENT_MEMORY`、`USERS_KV`
4. 环境变量按 §4 清单逐项配置（全部用**新值**）
5. `npm run build && npx wrangler pages deploy dist --project-name erp-<客户名>`

## 4. 环境变量清单（Pages → Settings → Environment variables）

必填：
- `MASTER_ACCOUNT` / `MASTER_PASSWORD` — 客户后端管理员（新设，别用你的）
- `AI_API_KEY`（+ 可选 `AI_BASE_URL` `AI_MODEL`）— 建议给客户单独开 key 便于计量成本
- `CRON_SECRET` — 新随机串
- `MINI_JWT_SECRET` — 新随机串

按客户购买的功能选配：
- `ANTHROPIC_API_KEY` / `ANTHROPIC_BASE_URL`、`NVIDIA_API_KEY`、`SILICONFLOW_API_KEY`、`REPLICATE_API_TOKEN`
- `HTX_API_KEY` / `HTX_SECRET_KEY` — **客户自己的交易所 key，绝不复用你的**
- `PDD_CLIENT_ID` / `PDD_CLIENT_SECRET` / `PDD_ACCESS_TOKEN`
- `VOLC_ACCESS_KEY_ID` / `VOLC_SECRET_KEY`、`BROWSERLESS_TOKEN`、`CF_API_TOKEN`、`LOCAL_BROWSER_AUTH`

绑定：KV `AGENT_MEMORY`、`USERS_KV`（新命名空间）；Workers AI 绑定 `AI`（如用到）。

## 5. 品牌与文案替换

- `src/config/index.ts` 的 `APP_NAME` 等常量
- 登录页/门户的品牌名、Logo、页脚
- **检查所有参照原网站的文案与素材已替换为客户/中性版本**

## 6. 交付前验收（逐项点一遍）

- [ ] 登录 → 创建一条销售单 → 审核 → 库存/财务联动正确
- [ ] AI 助手对话正常（key 计费落在客户的 key 上）
- [ ] 投资模块：若客户未配 HTX key，资产显示"未配置"而非报错
- [ ] 全局搜一遍产出包：`grep -rn "ghp_\|HTX_\|nomaderp\|erp-server-xsji" .` 应无你的痕迹
- [ ] 客户实例登录你的生产地址应该**失败**（资源确实隔离）

## 7. 计费（起步版）

先人工：年费收款（对公/合规主体自行确认）→ 记录到期日 → 到期不续则 Pages 项目下线。
有 3-5 个付费客户后再考虑自动化多租户与订阅计费。

---

*安全红线：任何时候都不要把你的生产 `.env`、KV 命名空间 ID、Neon 连接串、
交易所 Key 写进客户实例；导出永远走 `prepare-instance.sh`，不要手工拷贝目录。*
