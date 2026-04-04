# 智能体工作流模块 · 改造设计文档
> 创建于 2026-04-04，基于 VoxYZ 风格参考

---

## 一、视觉系统

| 元素 | 值 |
|---|---|
| 模块底色 | `#F8F8F6` + 点阵纹理 `radial-gradient(circle, #d1d1d1 1px, transparent 1px)` / `background-size: 20px 20px` |
| 卡片底色 | `#FFFFFF` |
| 描边 | `1px solid #E8E8E8` |
| 主字色 | `#1A1A1A` |
| 副字色 | `#666666` |
| 次要字色 | `#999999` |
| 主色（蓝） | `#0071e3` |
| 卡片圆角 | `14px` |
| 卡片阴影 | `0 2px 8px rgba(0,0,0,0.06)` |
| 字体 | `Inter, PingFang SC, -apple-system` |

### 部门颜色表
| 部门 | 颜色 |
|---|---|
| 内容部 | `#F59E4A` |
| 创意部 | `#EC4899` |
| 品牌部 | `#8B5CF6` |
| 情报部 | `#06B6D4` |
| 发布部 | `#10B981` |
| 会议室 | `#6366F1` |
| 营销顾问（外聘） | `#059669` |
| 平面设计师（外聘） | `#E11D48` |

---

## 二、导航结构

```
【总部】
  工作台（改造）
  任务中心（新增）
  触发器（新增）

【各部门】
  内容部
  创意部
  品牌部（改为品牌设置）
  情报部
  发布部（升级为内容中心）

【外聘】
  营销顾问
  平面设计师
```

外聘视觉区分：
- 卡片右上角"外聘"角标
- 虚线描边 `border: 1.5px dashed #E8E8E8`
- 导航分组独立

---

## 三、各板块改造清单

### 3.1 AgentLayout.vue（底色+点阵纹理）
- `.agent-layout` 背景改为 `#F8F8F6` + 点阵纹理
- 侧边栏底色同步改为暖白
- 有任务在跑的部门，导航右边加绿色脉冲点

### 3.2 Dashboard.vue（工作台）
- 顶部加公司状态栏：`今日已产出X条 · X条流水线运行中`
- 部门卡片改造：
  - 顶部 130px 像素风插画头图（纯SVG，各部门专属颜色）
  - 插画内嵌英文部门名（monospace字体，全大写）
  - 底部白色区域：部门名 + 描述 + 状态点 + 今日数据
- 右侧今日数据替换为实时动态 feed（AgentLiveFeed组件）

### 3.3 任务中心（新增 TaskCenter.vue）
- 黑板区：深色背景卡片，两块：今日重点（手动）+ 进行中（自动）
- 流水线进度卡：步骤链路 + 当前进度
- 任务历史列表

### 3.4 触发器（新增 Triggers.vue）
- 第一版：固定规则展示（每天08:00抓热搜等）
- 显示运行状态和最近触发记录
- 不做用户自定义（第二版再做）

### 3.5 各部门页（DeptLayout通用组件）
- 先抽 `DeptLayout.vue` 通用组件
- 顶部员工卡：Agent头像emoji + 名字 + 状态 + 今日数据
- 布局：左边对话框，右边产出预览

### 3.6 会议室（MeetingRoom.vue）
- 顶部加流水线步骤条
- 发言卡升级：彩色左竖线 + Agent头像 + 呼吸光圈（说话中）

### 3.7 发布页（Publish.vue）
- 内容卡片升级为 VoxYZ 风格：
  - 顶部2px彩色条（按类型：文案橙/海报粉/视频红）
  - 类型标签 + 平台 + 时间，字体层次分明
  - 内容预览3行截断
  - 底部操作栏：选中/复制/发布

---

## 四、新增组件清单

| 组件 | 路径 | 说明 |
|---|---|---|
| AgentLiveFeed.vue | `src/components/agent/` | 实时动态feed |
| DeptLayout.vue | `src/components/agent/` | 部门通用布局 |
| TaskCenter.vue | `src/views/agent/` | 任务中心页面 |
| Triggers.vue | `src/views/agent/` | 触发器页面 |
| PipelineBar.vue | `src/components/agent/` | 流水线步骤条 |

---

## 五、新增Store

| Store | 说明 |
|---|---|
| `pipelineStore.ts` | 管理流水线任务状态（pending/running/done/failed） |

---

## 六、亚当联动接口

- 亚当调用Captain = POST `/api/agent-chat?agentId=captain`（SSE）
- 任务结果写入 `pipelineStore`
- 工作流模板化：第二版实现

---

## 七、已确认不动的东西

- 所有业务API逻辑
- agentRegistry.ts（Agent system prompt）
- orchestrator.ts
- 路由hash模式
- ERP其他模块（销售/采购/财务等）

---

## 八、开发顺序

1. `AgentLayout.vue` — 底色+点阵纹理+外聘分组
2. `Dashboard.vue` — 部门卡片插画头图+状态栏
3. `AgentLiveFeed.vue` — 实时动态组件
4. `pipelineStore.ts` — 任务状态管理
5. `DeptLayout.vue` — 部门通用组件
6. `Publish.vue` — 内容卡片升级
7. `MeetingRoom.vue` — 发言卡+流水线步骤条
8. `TaskCenter.vue` — 任务中心页
9. `Triggers.vue` — 触发器页
