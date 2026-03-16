<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:15px;font-weight:600">打印模板管理</span>
          <el-tag type="info" size="small">模板控制打印/导出的格式布局</el-tag>
        </div>
      </template>

      <!-- 内置模板 -->
      <div class="section-label">内置模板</div>
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
            <el-tag size="small" type="success">内置</el-tag>
            <div style="display:flex;gap:6px">
              <el-button size="small" @click="previewTpl(tpl)">预览</el-button>
              <el-button size="small" type="primary" @click="editTpl(tpl)">编辑</el-button>
            </div>
          </div>
        </div>
      </div>

      <el-divider>自定义模板</el-divider>

      <ScTable ref="tableRef" :api-obj="getPrintList" del-path="/setting/print/batchDel"
          export-file-name="打印模板" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.name" placeholder="模板名称" clearable style="width:180px" />
          <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </template>
        <el-table-column prop="name" label="模板名称" min-width="180" />
        <el-table-column prop="type_name" label="模板类型" min-width="140" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="ElMessage.info(`模板「${row.name}」`)">查看</el-button>
            <el-button type="warning" link size="small" @click="editCustomTpl(row)">编辑</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 预览弹框 -->
    <el-dialog v-model="previewVisible" :title="`预览：${currentTpl?.name}`" width="780px">
      <div v-if="currentTpl">
        <div class="preview-toolbar">
          <span class="preview-hint">{{ currentTpl.desc }}</span>
          <div style="display:flex;gap:8px">
            <el-button size="small" @click="printSample">打印示例</el-button>
            <el-button size="small" type="primary" @click="goToPage(currentTpl.navPath)">前往使用 →</el-button>
          </div>
        </div>
        <div class="tpl-preview" v-html="currentTpl.sampleHtml" />
      </div>
    </el-dialog>

    <!-- 编辑弹框 -->
    <el-dialog v-model="editVisible" :title="`编辑模板：${editForm.name}`" width="820px" destroy-on-close>
      <el-form :model="editForm" label-width="90px" size="small">
        <el-form-item label="模板名称">
          <el-input v-model="editForm.name" style="width:260px" />
        </el-form-item>
        <el-form-item label="模板说明">
          <el-input v-model="editForm.desc" style="width:420px" />
        </el-form-item>
        <el-form-item label="显示字段">
          <el-checkbox-group v-model="editForm.fields">
            <el-checkbox v-for="f in allFields" :key="f.key" :label="f.key">{{ f.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="表头 HTML">
          <el-input v-model="editForm.headerHtml" type="textarea" :rows="3" placeholder="可填写公司 logo / 标题 HTML，留空使用默认" style="width:100%" />
        </el-form-item>
        <el-form-item label="表尾 HTML">
          <el-input v-model="editForm.footerHtml" type="textarea" :rows="3" placeholder="可填写签章行、备注等 HTML，留空使用默认" style="width:100%" />
        </el-form-item>
        <el-form-item label="实时预览">
          <div class="tpl-preview" style="width:100%;min-height:160px" v-html="editPreviewHtml" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="saveTpl">保存模板</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import ScTable from '@/components/ScTable.vue'
import { getPrintList } from '@/api/setting'

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

const builtinTemplates = [
  {
    key: 'offer',
    name: '销售报价单',
    icon: '📋',
    desc: '「销售 > 销售报价」审核后点"打印"按钮输出',
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
    name: '销售合同',
    icon: '📄',
    desc: '「销售 > 销售合同」审核后点"打印"按钮输出',
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
]

function previewTpl(tpl: any) {
  currentTpl.value = tpl
  activeTpl.value = tpl.key
  previewVisible.value = true
}

function printSample() {
  if (!currentTpl.value) return
  const w = window.open('', '_blank', 'width=800,height=600')
  if (!w) { ElMessage.warning('请允许弹窗'); return }
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

const allFields = [
  { key: 'code', label: '单据编号' },
  { key: 'client', label: '客户名称' },
  { key: 'date', label: '日期' },
  { key: 'handler', label: '经办人' },
  { key: 'goods_name', label: '商品名称' },
  { key: 'spec', label: '规格型号' },
  { key: 'unit', label: '单位' },
  { key: 'qty', label: '数量' },
  { key: 'price', label: '单价' },
  { key: 'amount', label: '合计金额' },
  { key: 'tax_rate', label: '税率' },
  { key: 'tax_amount', label: '税额' },
  { key: 'remark', label: '备注' },
  { key: 'sign', label: '签章行' },
]

const editPreviewHtml = computed(() => {
  const header = editForm.headerHtml || `<h3 style="text-align:center;margin:0 0 8px;font-size:15px">${editForm.name || '单据标题'}</h3>`
  const visibleFields = allFields.filter(f => editForm.fields.includes(f.key))
  const ths = visibleFields.map(f => `<th style="border:1px solid #ccc;padding:4px 8px">${f.label}</th>`).join('')
  const tds = visibleFields.map(f => `<td style="border:1px solid #ccc;padding:4px 8px;color:#aaa">示例</td>`).join('')
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
  ElMessage.success(`模板「${editForm.name}」已保存`)
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
