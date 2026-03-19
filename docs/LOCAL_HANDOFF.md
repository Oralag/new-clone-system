# new-clone-system 本地交接

更新时间：2026-03-19 10:55 CST

## 当前仓库状态
- 主分支最新提交：`0dcab67`
- 提交说明：`chore: 自动备份不再写入 main 提交`
- 当前约定：后续正常改动直接在 `main` 做

## 已处理的仓库问题
1. 定时任务不再 `git push origin main`
2. 定时备份脚本改为只推送到 `backup/auto-sync`
3. 自动备份不再给本地 `main` 生成 `auto-backup` 提交
4. 当前：`main` / `origin/main` / `origin/backup/auto-sync` 已对齐

## 当前定时任务
- `0 9 * * *` -> `/Users/oralagborjigin/erp-server` 服务器备份
- `0 */3 * * *` -> `/Users/oralagborjigin/new-clone-system/scripts/auto_backup_branch.sh`

## 本轮继续处理的问题
- 用户反馈：采购退货单审核后，库存数量刷新仍未变化
- 已补两处：
  1. `src/views/procure/Return.vue`
     - 采购退货库存更新不再依赖 `returnAmount > 0`
     - 即使退货金额为 0，也应照样扣减库存
  2. `src/views/warehouse/StockAll.vue`
     - 增加对 `stockRefreshStore.version` 的监听
     - 页面 `onActivated` 时自动重拉库存数据
     - 解决标签页缓存/页面驻留导致库存页不刷新的问题

## 下次继续时建议先做
1. `git -C /Users/oralagborjigin/new-clone-system status --short`
2. 看是否已提交上述库存修复
3. 本地验证采购退货审核 -> 库存总览数字是否立即变化
4. 如确认无误，再发布/备份

## 2026-03-19 现场补充
- 已核查线上真实数据：采购退货单 `id=7` 财务已更新，但库存未扣减
- 已直接修复线上库存：
  - `stock id=7` -> `qty=5.00`
  - `stock id=8` -> `qty=5.00`
- 发现采购单 `order_id=31` 存在重复采购入库记录：`id=25`、`id=26`
- 已修代码：`src/views/procure/Order.vue` 审核采购单时前端不再重复创建采购入库，改为只走后端审核链路
