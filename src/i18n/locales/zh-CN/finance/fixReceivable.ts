export default {
  pageTitle: '旧数据修复：销售出库单收款',
  pageDesc: '扫描所有已审核（status=1）且 receive_amount > 0 的销售出库单，若对应 order_sn 在收款单里不存在，则自动补建收款单。',
  startFix: '开始修复',
  clearLogs: '清空日志',
  summaryText: '执行完毕：扫描',
  summaryScanned: '条，需补录',
  summaryNeed: '条，',
  summarySuccess: '成功',
  summaryFail: '失败',
  noLogs: '暂无日志',
}
