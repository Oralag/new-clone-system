<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:15px;font-weight:600">{{ $t('setting.print.pageTitle') }}</span>
          <el-tag type="info" size="small">{{ $t('setting.print.pageSubtitle') }}</el-tag>
        </div>
      </template>

      <!-- 内置模板 -->
      <div class="section-label">{{ $t('setting.print.sectionBuiltin') }}</div>
      <div class="tpl-grid">
        <div
          v-for="tpl in builtinTemplates"
          :key="tpl.key"
          class="tpl-card"
          :class="{ active: activeTpl === tpl.key }"
        >
          <div class="tpl-icon">{{ tpl.icon }}</div>
          <div class="tpl-info">
            <div class="tpl-name">{{ tpl.name }}</div>
            <div class="tpl-desc">{{ tpl.desc }}</div>
          </div>
          <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
            <el-tag size="small" type="success">{{ $t('setting.print.tagBuiltin') }}</el-tag>
            <div style="display:flex;gap:6px">
              <el-button size="small" @click="previewTpl(tpl)">{{ $t('setting.print.btnPreview') }}</el-button>
              <el-button size="small" type="primary" @click="editTpl(tpl)">{{ $t('setting.print.btnEdit') }}</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-divider>{{ $t('setting.print.dividerCustom') }}</el-divider>

      <ScTable ref="tableRef" :api-obj="getPrintList" del-path="/setting/print/batchDel"
      :export-file-name="$t('route.SettingPrint')" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.name" :placeholder="$t('setting.print.searchPlaceholder')" clearable style="width:180px" />
          <el-button type="primary" @click="tableRef?.loadData()">{{ $t('setting.print.btnSearch') }}</el-button>
          <el-button @click="resetSearch">{{ $t('setting.print.btnReset') }}</el-button>
        </template>
        <el-table-column prop="name" :label="$t('setting.print.colName')" min-width="180" />
        <el-table-column prop="type_name" :label="$t('setting.print.colType')" min-width="140" />
        <el-table-column :label="$t('setting.print.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="ElMessage.info(`模板「${row.name}」`)">{{ $t('setting.print.btnView') }}</el-button>
            <el-button type="warning" link size="small" @click="editCustomTpl(row)">{{ $t('setting.print.btnEditCustom') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 预览弹框 -->
    <el-dialog v-model="previewVisible" :title="`${$t('setting.print.previewTitlePrefix')}${currentTpl?.name}`" width="780px">
      <div v-if="currentTpl">
        <div class="preview-toolbar">
          <span class="preview-hint">{{ currentTpl.desc }}</span>
          <div style="display:flex;gap:8px">
            <el-button size="small" @click="printSample">{{ $t('setting.print.btnPrintSample') }}</el-button>
            <el-button size="small" type="primary" @click="goToPage(currentTpl.navPath)">{{ $t('setting.print.btnGoToPage') }}</el-button>
          </div>
        </div>
        <div class="tpl-preview" v-html="currentTpl.sampleHtml" />
      </div>
    </el-dialog>

    <!-- 编辑弹框 -->
    <el-dialog v-model="editVisible" :title="`${$t('setting.print.editTitlePrefix')}${editForm.name}`" width="820px" destroy-on-close>
      <el-form :model="editForm" label-width="90px" size="small">
        <el-form-item :label="$t('setting.print.formFieldName')">
          <el-input v-model="editForm.name" style="width:260px" />
        </el-form-item>
        <el-form-item :label="$t('setting.print.formFieldDesc')">
          <el-input v-model="editForm.desc" style="width:420px" />
        </el-form-item>
        <el-form-item :label="$t('setting.print.formFieldFields')">
          <el-checkbox-group v-model="editForm.fields">
            <el-checkbox v-for="f in allFields" :key="f.key" :label="f.key">{{ f.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item :label="$t('setting.print.formFieldHeader')">
          <el-input v-model="editForm.headerHtml" type="textarea" :rows="3" :placeholder="$t('setting.print.formFieldHeaderPlaceholder')" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('setting.print.formFieldFooter')">
          <el-input v-model="editForm.footerHtml" type="textarea" :rows="3" :placeholder="$t('setting.print.formFieldFooterPlaceholder')" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('setting.print.formFieldPreview')">
          <div class="tpl-preview" style="width:100%;min-height:160px" v-html="editPreviewHtml" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">{{ $t('setting.print.btnCancel') }}</el-button>
        <el-button type="primary" @click="saveTpl">{{ $t('setting.print.btnSave') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import ScTable from '@/components/ScTable.vue'
import { getPrintList } from '@/api/setting'

const { t } = useI18n()
const router = useRouter()
const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({})
const activeTpl = ref('')
const previewVisible = ref(false)
const currentTpl = ref<any>(null)

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

const builtinTemplates = computed(() => [
  {
    key: 'offer',
    name: t('setting.print.tplOfferName'),
    icon: '📋',
    desc: t('setting.print.tplOfferDesc'),
    navPath: '/sale/offer',
    sampleHtml: `<div style="font-family:SimSun,Arial;padding:16px;border:1px solid #e0e0e0;border-radius:8px;font-size:12px">
      <h3 style="text-align:center;margin:0 0 6px;font-size:16px">报 价 单</h3>
      <p style="text-align:center;color:#666;font-size:11px;margin:0 0 12px">数字游牧ERP &nbsp;·&nbsp; 编号：QT-20260316-001</p>
      <div style="display:flex;gap:24px;margin-bottom:12px;flex-wrap:wrap">
        <span>客户：示例客户有限公司</span><span>报价日期：2026-03-16</span><span>有效期至：2026-04-16</span><span>经办人：张三</span>
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:#f0f4f8"><th style="border:1px solid #ccc;padding:5px 8px">商品名称</th><th style="border:1px solid #ccc;padding:5px">规格</th><th style="border:1px solid #ccc;padding:5px">单位</th><th style="border:1px solid #ccc;padding:5px">数量</th><th style="border:1px solid #ccc;padding:5px">单价(含税)</th><th style="border:1px solid #ccc;padding:5px">合计</th></tr></thead>
        <tbody>
          <tr><td style="border:1px solid #ccc;padding:5px 8px">示例商品A</td><td style="border:1px solid #ccc;padding:5px;text-align:center">标准型</td><td style="border:1px solid #ccc;padding:5px;text-align:center">件</td><td style="border:1px solid #ccc;padding:5px;text-align:right">10</td><td style="border:1px solid #ccc;padding:5px;text-align:right">¥200.00</td><td style="border:1px solid #ccc;padding:5px;text-align:right;font-weight:600">¥2,000.00</td></tr>
          <tr><td style="border:1px solid #ccc;padding:5px 8px">示例商品B</td><td style="border:1px solid #ccc;padding:5px;text-align:center">—</td><td style="border:1px solid #ccc;padding:5px;text-align:center">箱</td><td style="border:1px solid #ccc;padding:5px;text-align:right">5</td><td style="border:1px solid #ccc;padding:5px;text-align:right">¥500.00</td><td style="border:1px solid #ccc;padding:5px;text-align:right;font-weight:600">¥2,500.00</td></tr>
        </tbody>
      </table>
      <p style="text-align:right;font-weight:700;margin:8px 0;font-size:13px">报价合计：¥4,500.00</p>
      <div style="display:flex;justify-content:space-between;margin-top:28px">
        <span>供应方签章：__________________</span><span>采购方签章：__________________</span><span>日期：___________</span>
      </div>
    </div>`,
  },
  {
    key: 'contract',
    name: t('setting.print.tplContractName'),
    icon: '📄',
    desc: t('setting.print.tplContractDesc'),
    navPath: '/sale/contract',
    sampleHtml: `<div style="font-family:SimSun,Arial;padding:16px;border:1px solid #e0e0e0;border-radius:8px;font-size:12px">
      <h3 style="text-align:center;margin:0 0 6px;font-size:16px">销 售 合 同</h3>
      <p style="text-align:center;color:#666;font-size:11px;margin:0 0 12px">数字游牧ERP &nbsp;·&nbsp; 合同编号：HT-20260316-001</p>
      <div style="display:flex;gap:24px;margin-bottom:12px;flex-wrap:wrap">
        <span>客户：示例客户有限公司</span><span>签订日期：2026-03-16</span><span>到期：2027-03-16</span>
      </div>
      <div style="font-weight:600;border-left:3px solid #0071e3;padding-left:8px;margin-bottom:8px">商品明细</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr style="background:#f0f4f8"><th style="border:1px solid #ccc;padding:5px 8px">商品名称</th><th style="border:1px solid #ccc;padding:5px">数量</th><th style="border:1px solid #ccc;padding:5px">单价</th><th style="border:1px solid #ccc;padding:5px">金额</th><th style="border:1px solid #ccc;padding:5px">备注</th></tr></thead>
        <tbody><tr><td style="border:1px solid #ccc;padding:5px 8px">示例商品A</td><td style="border:1px solid #ccc;padding:5px;text-align:right">10</td><td style="border:1px solid #ccc;padding:5px;text-align:right">¥200</td><td style="border:1px solid #ccc;padding:5px;text-align:right;font-weight:600">¥2,000</td><td style="border:1px solid #ccc;padding:5px"></td></tr></tbody>
      </table>
      <p style="text-align:right;font-weight:700;margin:8px 0;font-size:13px">合同总额：¥2,000.00</p>
      <div style="display:flex;justify-content:space-between;margin-top:36px">
        <span>甲方（买方）签章：__________________</span><span>乙方（卖方）签章：__________________</span><span>签署日期：___________</span>
      </div>
    </div>`,
  },
])

function previewTpl(tpl: any) {
  currentTpl.value = tpl
  activeTpl.value = tpl.key
  previewVisible.value = true
}

function printSample() {
  if (!currentTpl.value) return
  const w = window.open('', '_blank', 'width=800,height=600')
  if (!w) { ElMessage.warning(t('setting.print.msgPopupBlocked')); return }
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${currentTpl.value.name}</title><link rel="icon" href="data:,"><style>body{margin:20px;font-family:SimSun,Arial}@media print{body{margin:0}}</style></head><body>${currentTpl.value.sampleHtml}</body></html>`)
  w.document.close()
  setTimeout(() => { w.print() }, 300)
}

function goToPage(path: string) {
  previewVisible.value = false
  router.push(path)
}

// ——— 编辑逻辑 ———
const editVisible = ref(false)
const editForm = reactive<any>({
  name: '', desc: '', fields: [], headerHtml: '', footerHtml: '', key: '', _isBuiltin: false
})

const allFields = computed(() => [
  { key: 'code', label: t('setting.print.fieldCode') },
  { key: 'client', label: t('setting.print.fieldClient') },
  { key: 'date', label: t('setting.print.fieldDate') },
  { key: 'handler', label: t('setting.print.fieldHandler') },
  { key: 'goods_name', label: t('setting.print.fieldGoodsName') },
  { key: 'spec', label: t('setting.print.fieldSpec') },
  { key: 'unit', label: t('setting.print.fieldUnit') },
  { key: 'qty', label: t('setting.print.fieldQty') },
  { key: 'price', label: t('setting.print.fieldPrice') },
  { key: 'amount', label: t('setting.print.fieldAmount') },
  { key: 'tax_rate', label: t('setting.print.fieldTaxRate') },
  { key: 'tax_amount', label: t('setting.print.fieldTaxAmount') },
  { key: 'remark', label: t('setting.print.fieldRemark') },
  { key: 'sign', label: t('setting.print.fieldSign') },
])

const editPreviewHtml = computed(() => {
  const header = editForm.headerHtml || `<h3 style="text-align:center;margin:0 0 8px;font-size:15px">${editForm.name || '单据标题'}</h3>`
  const visibleFields = allFields.value.filter(f => editForm.fields.includes(f.key))
  const ths = visibleFields.map(f => `<th style="border:1px solid #ccc;padding:4px 8px">${f.label}</th>`).join('')
  const tds = visibleFields.map(_f => `<td style="border:1px solid #ccc;padding:4px 8px;color:#aaa">示例</td>`).join('')
  const footer = editForm.footerHtml || `<div style="display:flex;justify-content:space-between;margin-top:24px"><span>签章：__________</span><span>日期：__________</span></div>`
  return `<div style="font-family:SimSun,Arial;font-size:12px;padding:12px">
    ${header}
    <table style="width:100%;border-collapse:collapse;margin:10px 0;font-size:11px"><thead><tr style="background:#f0f4f8">${ths}</tr></thead><tbody><tr>${tds}</tr></tbody></table>
    ${footer}
  </div>`
})

function editTpl(tpl: any) {
  Object.assign(editForm, {
    name: tpl.name,
    desc: tpl.desc || '',
    fields: ['code', 'client', 'date', 'handler', 'goods_name', 'spec', 'unit', 'qty', 'price', 'amount', 'remark', 'sign'],
    headerHtml: '',
    footerHtml: '',
    key: tpl.key,
    _isBuiltin: true,
  })
  activeTpl.value = tpl.key
  editVisible.value = true
}

function editCustomTpl(row: any) {
  Object.assign(editForm, {
    name: row.name,
    desc: row.type_name || '',
    fields: row.fields || ['code', 'client', 'date', 'goods_name', 'qty', 'price', 'amount'],
    headerHtml: row.header_html || '',
    footerHtml: row.footer_html || '',
    key: row.id,
    _isBuiltin: false,
  })
  editVisible.value = true
}

function saveTpl() {
  ElMessage.success(`模板「${editForm.name}」${t('setting.print.msgTplSaved')}`)
  editVisible.value = false
}
</script>

<style scoped>
.page-container {}

.section-label {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: rgba(29,29,31,0.35);
  margin-bottom: 10px;
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 10px;
  margin-bottom: 16px;
}

.tpl-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba(0,0,0,0.08);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
  background: #fff;
}
.tpl-card:hover { border-color: #0071e3; box-shadow: 0 4px 12px rgba(0,113,227,0.1); }
.tpl-card.active { border-color: #0071e3; background: #eff6ff; }

.tpl-icon { font-size: 26px; flex-shrink: 0; }
.tpl-info { flex: 1; overflow: hidden; }
.tpl-name { font-size: 13px; font-weight: 600; color: #1d1d1f; }
.tpl-desc { font-size: 11px; color: rgba(29,29,31,0.45); margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid rgba(0,0,0,0.07);
}
.preview-hint { font-size: 12px; color: rgba(29,29,31,0.45); }
.tpl-preview { background: #f9fafb; border-radius: 8px; padding: 12px; min-height: 200px; }

.search-actions { display: flex; gap: 8px; }
</style>
