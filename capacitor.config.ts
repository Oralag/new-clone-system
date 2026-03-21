import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.digitalnomad.erp',
  appName: '数字游牧ERP',
  webDir: 'dist',
  server: {
    // 允许访问外部 HTTPS API（如 nomaderp.pages.dev）
    allowNavigation: ['nomaderp.pages.dev', 'saas.mzth.cn'],
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  ios: {
    contentInset: 'automatic',
  },
};

export default config;
