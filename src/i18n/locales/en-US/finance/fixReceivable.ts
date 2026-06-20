export default {
  pageTitle: 'Legacy Data Fix: Sales Outbound Collection',
  pageDesc: 'Scan all approved (status=1) sales outbound orders with receive_amount > 0. If the corresponding order_sn does not exist in collection receipts, auto-create the missing receipt.',
  startFix: 'Start Fix',
  clearLogs: 'Clear Logs',
  summaryText: 'Done: scanned',
  summaryScanned: 'records, need to create',
  summaryNeed: ',',
  summarySuccess: 'succeeded',
  summaryFail: 'failed',
  noLogs: 'No logs yet',
}
