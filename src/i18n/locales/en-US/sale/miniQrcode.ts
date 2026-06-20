// Translations for src/views/sale/miniQrcode.vue
export default {
  // Page header
  pageTitle: 'Packaging QR Code',
  pageSub: 'Generate Mini Program QR codes for each packaging batch to track scan data',

  // Generate panel
  genCardTitle: 'Generate Mini Program QR Code',
  sceneLabel: 'Batch ID (scene)',
  scenePlaceholder: 'e.g. pkg-2026-06, box-A001',
  sceneHint: 'Use the batch ID printed on the packaging to distinguish scan sources',
  pageLabel: 'Landing Page',
  pageLottery: 'Daily Lottery',
  pageMall: 'Mall Homepage',
  sizeLabel: 'QR Code Size',
  size430: '430px (recommended for print)',
  size280: '280px (preview)',
  size1280: '1280px (high-res)',
  generateBtn: 'Generate QR Code',

  // QR result
  batchLabel: 'Batch: ',
  downloadBtn: 'Download Image',
  copyBase64Btn: 'Copy Base64',
  qrTip: 'Tip: Send the downloaded image to your designer/printer to embed in packaging layout',

  // Stats panel
  statsCardTitle: 'Scan Statistics',
  refreshBtn: 'Refresh',
  colScene: 'Batch ID',
  colTotal: 'Total Scans',
  colUniqueUsers: 'Unique Users',
  colLastScan: 'Last Scan',
  emptyStats: 'No data yet. Statistics will appear after QR codes are distributed.',

  // Messages
  warnScene: 'Please fill in the batch ID',
  successGenerate: 'Generated successfully',
  errorGenerate: 'Generation failed, please check WeChat configuration',
  successCopy: 'Copied to clipboard',
}
