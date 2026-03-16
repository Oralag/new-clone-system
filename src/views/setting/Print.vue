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
          @click="previewTpl(tpl)"
        >
          <div class="tpl-icon">{{ tpl.icon }}</div>
          <div class="tpl-info">
            <div class="tpl-name">{{ tpl.name }}</div>
            <div class="tpl-desc">{{ tpl.desc }}</div>
          </div>
          <el-tag size="small" type="success">内置</el-tag>
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
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="ElMessage.info(`模板「${row.name}」`)">查看</el-button>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
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
  w.document.write(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${currentTpl.value.name}</title><style>body{margin:20px;font-family:SimSun,Arial}@media print{body{margin:0}}</style></head><body>${currentTpl.value.sampleHtml}</body></html>`)
  w.document.close()
  setTimeout(() => { w.print() }, 300)
}

function goToPage(path: string) {
  previewVisible.value = false
  router.push(path)
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
