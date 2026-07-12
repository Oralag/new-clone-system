export default {
  pageTitle: 'Legacy Data Fix: Sales Shipment Collection',
  pageDesc: 'Scan all approved (status=1) sales shipments with receive_amount > 0. If the corresponding order_sn does not exist in receipts, auto-create the missing receipt.',
  startFix: 'Start Fix',
  clearLogs: 'Clear Logs',
  summaryText: 'Done: scanned',
  summaryScanned: 'records, need to create',
  summaryNeed: ',',
  summarySuccess: 'succeeded',
  summaryFail: 'failed',
  noLogs: 'No logs yet',
}
