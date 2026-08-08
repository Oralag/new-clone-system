# phone-bridge —— 手机控制 + 社交发布 + 支出自动记账

四个需求（控手机 / 发微信 / 发小红书 / 支出记 ERP）落成三条通道。
核心判断：**能不碰手机就不碰手机** —— 网页通道更稳、不触发风控、还能无人值守跑。

| 需求 | 通道 | 需要手机吗 | 状态 |
|---|---|---|---|
| 支出 → ERP 自动记账 | 账单 CSV → `ingest.py` → ERP API | ❌ 不需要 | ✅ 已跑通实测 |
| 小红书/抖音发布 | `../social-publisher/server.py`（social-auto-upload） | ❌ 不需要 | ✅ 已有，接上即用 |
| **iPhone 控制**（发微信/朋友圈） | `iphone-mcp`（WebDriverAgent），Claude 直接调 | ✅ iPhone | ⚙️ MCP 已连，待 4 步初始化 |
| 安卓控制（备选） | `phone.py`（adb UI 自动化） | ✅ 安卓 | ⚙️ 代码就绪，无设备 |

## iPhone 控制（已接入）

> **更正**：本文档早先写过「iOS 沙盒不允许控制第三方 App」——**那是错的**。
> iOS 有 **WebDriverAgent**（苹果自家 XCTest 框架），Appium 十年前就靠它自动化 iOS App，
> 能读控件树、点击、输入 Unicode 中文。微信、小红书都在射程内。

已装 [`@blitzdev/iphone-mcp`](https://github.com/blitzdotdev/iPhone-mcp) 并接进 Claude Code
（`claude mcp add iphone -s user`，状态 ✔ Connected）。它自动帮你编译安装 WDA，不用手动签名。

**能力**（真机全支持）：`scan_ui` 控件+坐标 / `describe_screen` 完整层级 /
`device_action` 点击·滑动·输入·按键 / `get_screenshot` / `launch_app` /
外加 `http://localhost:5152?udid=...` 浏览器实时投屏。

**剩下四步**：

```bash
# 1. Xcode 路径切过去（当前指向 CommandLineTools，编译 WDA 不够）
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer

# 2. iPhone：设置 → 隐私与安全性 → 开发者模式 → 打开，重启手机
# 3. USB 连上 Mac，手机弹窗点「信任」
# 4. 重启 Claude Code（MCP 工具在会话启动时注册）
#    然后直接说：「连接我的 iPhone」
```

Xcode 需要登录 Apple ID 做签名身份（**免费账号就行**，不用付费开发者账号）。

### 为什么不用 iPhone 镜像方案

[iphoneclaw](https://github.com/NoEdgeAI/iphoneclaw) 靠 iPhone 镜像 + 视觉识别，零配置很诱人，
但**中文要用拼音打字再选字**，发中文微信/小红书错字率不能看。WDA 直接发 Unicode，所以选它。

### 微信自动化的封号风险（与平台无关，仍然成立）

微信对 UI 自动化有风控，历史上有封号先例。给客户/群发订单通知请走**企业微信机器人 webhook**
（官方接口、零风险、能直接挂 ERP 做下单自动推送）；个人号自动化保持低频 + 随机间隔。

## ⚠️ 微信自动化的封号风险

微信对 UI 自动化（模拟点击/输入）有风控，历史上有封号先例。建议：
- 优先用于「文件传输助手」等自用场景
- 给客户发通知请走企业微信机器人，不要用个人号自动化
- 真要用个人号，保持低频 + 随机间隔，别做群发

---

## 一、支出自动记账（主力，已跑通）

### 拿账单

- **微信**：微信 → 我 → 服务 → 钱包 → 账单 → 右上角常见问题 → 下载账单 → 用于个人对账 → 发到邮箱
- **支付宝**：支付宝网页版 → 账单 → 下载账单明细（GBK 编码，解析器已兼容）
- **银行**：网银导出 CSV/Excel 流水

### 跑

```bash
cd ~/new-clone-system/phone-bridge

# 1. 只解析预览，不碰 ERP
python3 ingest.py ~/Downloads/微信支付账单.csv

# 2. 比对 ERP 去重，看会写入什么（dry-run，不写库）
ERP_PASSWORD='你的密码' python3 ingest.py ~/Downloads/微信支付账单.csv --to-erp

# 3. 确认无误，真正入账
ERP_PASSWORD='你的密码' python3 ingest.py ~/Downloads/微信支付账单.csv --to-erp --commit
```

### 实测结果（2026-08-05，7 行仿真账单）

```
解析到 6 笔支出，合计 ¥3,669.70
  推广费    1 笔  ¥2,000.00      包装材料  1 笔  ¥1,200.00
  交通费    2 笔  ¥  345.20      物流运费  1 笔  ¥   86.00
  餐饮费    1 笔  ¥   38.50
```
第 7 行「已全额退款」的美团被正确排除，未计入支出。

### 三道安全阀

1. **默认 dry-run** —— 不加 `--commit` 绝不写库
2. **幂等去重** —— 交易单号以 `#KEY:xxx` 写进 remark，重复导入同一份账单自动跳过，不会重复记账
3. **只新增不修改** —— 只调 `/finance/Expense/add`，从不 edit/del 任何已有记录

### 科目归类

`ingest.py` 的 `CATEGORY_RULES` 按商家关键词自动归类（圆通→物流运费、巨量千川→推广费、
中国石化→交通费…）。归错了直接改那张表，一行一条正则，随时扩。

---

## 二、手机控制（安卓）

### 首次准备

```bash
# 1. 手机开「设置 → 关于手机 → 连点版本号7次 → 开发者选项 → USB调试」
#    USB 连上 Mac，手机弹窗点「允许」
adb devices          # 能看到设备就成了

# 2. 中文输入（adb shell input text 不支持中文，必须装这个）
curl -LO https://github.com/senzhk/ADBKeyBoard/raw/master/ADBKeyboard.apk
adb install ADBKeyboard.apk
adb shell ime enable com.android.adbkeyboard/.AdbIME
adb shell ime set com.android.adbkeyboard/.AdbIME

# 3. 想拔线用（可选）
adb tcpip 5555 && adb connect 手机IP:5555
```

### 用

```bash
python3 phone.py status                     # 看设备 + 中文输入是否就绪
python3 phone.py shot                       # 截屏到 shots/
python3 phone.py dump                       # 列出当前界面所有可点文字 + 坐标
python3 phone.py open wechat                # 打开微信
python3 phone.py tap "通讯录"                # 按文字点击
python3 phone.py type "牧区纯坊"             # 输入中文
python3 phone.py wechat "文件传输助手" "测试"  # 发微信消息
```

`dump` 是调试利器 —— 微信各版本界面不一样，脚本点不到时先 `dump` 看实际控件文字，
再改 `wechat_send()` 里的目标文字。

---

## 三、小红书发布

复用已有的 `../social-publisher/server.py`：

```bash
pip install fastapi uvicorn social-auto-upload
sau xiaohongshu login --account default     # 扫码登录，一次即可
python3 ../social-publisher/server.py       # 起在 :8765

curl -X POST localhost:8765/publish -H 'Content-Type: application/json' -d '{
  "platform":"xiaohongshu","title":"草原奶豆腐","body":"内蒙古锡林郭勒…",
  "hashtags":["奶豆腐","内蒙古特产"],"images":["https://…/1.jpg"]}'
```

---

## 文件

| 文件 | 作用 |
|---|---|
| `erp.py` | ERP 登录 + 费用读写。含 certifi SSL 修复（python.org 版 Python 缺 CA） |
| `ingest.py` | 微信/支付宝/银行账单解析 + 科目归类 + 去重 + 推送 ERP |
| `phone.py` | adb 安卓控制：截屏/控件树/点击/中文输入/微信发消息 |
| `.token` | ERP token 缓存（600 权限），自动续期 |

## 已核实的 ERP 接口（2026-08-05）

```
POST /adminapi/login/account        {account, password}      ← 字段是 account 不是 username
GET  /adminapi/finance/Expense/index?page=1&limit=N
POST /adminapi/finance/Expense/add  {name, amount, expense_date, remark, order_sn}
     返回 {id, expense_no(后端自动生成 FY+日期), fund_id, status, shop_id}
GET  /adminapi/finance/Fund/index   → 7 公司支出账户 / 8 孟根 / 9 乌日力格 /
                                       10 乌日力格额外支出 / 58 公司收入账号 / 59 零售收款账户
```
