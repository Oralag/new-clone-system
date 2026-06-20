<template>
  <div class="page-container">

    <!-- Contract template download section -->
    <el-card class="template-card">
      <div class="template-header">
        <span class="template-title">{{ $t('personnel.contract.templateSectionTitle') }}</span>
        <span class="template-tip">{{ $t('personnel.contract.templateSectionTip') }}</span>
      </div>
      <div class="template-list">
        <div class="template-item" @click="downloadTemplate('labor')">
          <div class="template-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#0071e3" stroke-width="1.8" fill="rgba(0,113,227,0.08)"/>
              <polyline points="14,2 14,8 20,8" stroke="#0071e3" stroke-width="1.8" fill="none"/>
              <line x1="12" y1="18" x2="12" y2="12" stroke="#0071e3" stroke-width="1.8"/>
              <polyline points="9,15 12,18 15,15" stroke="#0071e3" stroke-width="1.8" fill="none"/>
            </svg>
          </div>
          <div class="template-info">
            <div class="template-name">{{ $t('personnel.contract.templateLaborName') }}</div>
            <div class="template-desc">{{ $t('personnel.contract.templateLaborDesc') }}</div>
          </div>
          <el-tag type="primary" size="small">Word</el-tag>
        </div>
        <div class="template-item" @click="downloadTemplate('nda')">
          <div class="template-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" stroke="#f59e0b" stroke-width="1.8" fill="rgba(245,158,11,0.08)"/>
              <polyline points="14,2 14,8 20,8" stroke="#f59e0b" stroke-width="1.8" fill="none"/>
              <rect x="9" y="12" width="6" height="5" rx="1" stroke="#f59e0b" stroke-width="1.8" fill="none"/>
              <path d="M12 12v-2a2 2 0 1 1 4 0v0" stroke="#f59e0b" stroke-width="1.8" fill="none"/>
            </svg>
          </div>
          <div class="template-info">
            <div class="template-name">{{ $t('personnel.contract.templateNdaName') }}</div>
            <div class="template-desc">{{ $t('personnel.contract.templateNdaDesc') }}</div>
          </div>
          <el-tag type="warning" size="small">Word</el-tag>
        </div>
      </div>
    </el-card>

    <!-- Contract list -->
    <el-card>
      <ScTable ref="tableRef" :api-obj="getPersonnelContractList"
          del-path="/personnel/contract/batchDel"
          :export-file-name="$t('personnel.contract.exportFileName')" :params="searchForm">
        <template #search>
          <el-form inline>
            <el-form-item :label="$t('personnel.contract.searchStaff')">
              <el-input v-model="searchForm.staff_name" clearable style="width:180px" />
            </el-form-item>
            <el-form-item :label="$t('personnel.contract.searchContractNo')">
              <el-input v-model="searchForm.contract_no" clearable style="width:180px" />
            </el-form-item>
          </el-form>
          <div class="search-actions">
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('personnel.contract.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('personnel.contract.btnReset') }}</el-button>
          </div>
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">{{ $t('personnel.contract.btnAdd') }}</el-button>
        </template>
        <el-table-column prop="staff_name" :label="$t('personnel.contract.colStaff')" min-width="120" />
        <el-table-column prop="contract_no" :label="$t('personnel.contract.colContractNo')" min-width="140" />
        <el-table-column prop="start_date" :label="$t('personnel.contract.colStartDate')" width="120" />
        <el-table-column prop="end_date" :label="$t('personnel.contract.colEndDate')" width="120" />
        <el-table-column prop="status_tag" :label="$t('personnel.contract.colStatus')" width="100" />
        <el-table-column :label="$t('personnel.contract.colActions')" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">{{ $t('personnel.contract.btnView') }}</el-button>
            <el-button type="danger" size="small" link @click="handleDelete(row.id)">{{ $t('personnel.contract.btnDelete') }}</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>
    <ScForm ref="formRef" :title="formTitle" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item :label="$t('personnel.contract.fieldStaff')" :rules="[{ required: true, message: $t('personnel.contract.ruleStaffRequired') }]" prop="staff_name">
          <el-input v-model="form.staff_name" />
        </el-form-item>
        <el-form-item :label="$t('personnel.contract.fieldContractNo')" prop="contract_no">
          <el-input v-model="form.contract_no" />
        </el-form-item>
        <el-form-item :label="$t('personnel.contract.fieldStartDate')" prop="start_date">
          <el-date-picker v-model="form.start_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item :label="$t('personnel.contract.fieldEndDate')" prop="end_date">
          <el-date-picker v-model="form.end_date" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus } from '@element-plus/icons-vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'
import { getPersonnelContractList, createPersonnelContract, deletePersonnelContract } from '@/api/personnel'

const { t } = useI18n()
const tableRef = ref<InstanceType<typeof ScTable>>()
const formRef = ref<InstanceType<typeof ScForm>>()
const formTitle = ref('')
const searchForm = reactive<any>({})

function resetSearch() {
  Object.keys(searchForm).forEach(k => delete searchForm[k])
  tableRef.value?.loadData()
}

function openForm(row?: any) {
  formTitle.value = t('personnel.contract.formTitleAdd')
  formRef.value?.open(row)
}

async function handleSubmit(data: any) {
  formRef.value?.setSubmitting(true)
  try {
    await createPersonnelContract(data)
    ElMessage.success(t('personnel.contract.msgOpSuccess'))
    formRef.value?.close()
    tableRef.value?.refresh()
  } finally {
    formRef.value?.setSubmitting(false)
  }
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm(t('personnel.contract.confirmDeleteMsg'), t('personnel.contract.confirmDeleteTitle'), { type: 'warning' })
  await deletePersonnelContract(id)
  ElMessage.success(t('personnel.contract.msgDeleteSuccess'))
  tableRef.value?.refresh()
}

// ── Template download ──────────────────────────────────────────────────────────
const LABOR_CONTRACT = `劳动合同

甲方（用人单位）：_______________________________
法定代表人：_______________________________
地址：_______________________________

乙方（员工）：_______________________________
身份证号：_______________________________
联系电话：_______________________________

双方根据《中华人民共和国劳动合同法》，遵循合法、公平、平等自愿、协商一致、诚实信用的原则，订立本合同。

第一条 合同期限
本合同自 ______年______月______日起，至 ______年______月______日止。
试用期为 ______ 个月，即自 ______年______月______日至 ______年______月______日。

第二条 工作内容和工作地点
乙方担任 ______________________ 岗位，工作地点为 ______________________________。

第三条 工作时间和休息休假
甲方执行标准工时制度，每日工作不超过 8 小时，每周工作不超过 40 小时。
享有国家规定的法定节假日及年假。

第四条 劳动报酬
1. 试用期工资：人民币（税前）______元/月。
2. 转正后工资：人民币（税前）______元/月，其中绩效工资 ______元/月。
3. 甲方每月 ______ 日以银行转账方式支付上月工资。

第五条 社会保险和福利
甲方依法为乙方缴纳养老、医疗、失业、工伤、生育保险及住房公积金。

第六条 保密义务
乙方在职期间及离职后 2 年内，不得泄露甲方的商业秘密、技术信息及客户信息。

第七条 合同解除和终止
双方可依照《劳动合同法》相关规定解除或终止本合同。

第八条 违约责任
乙方在试用期内违约，无需赔偿；转正后提前离职的，应提前 30 日书面通知甲方。

甲方（盖章）：________________    乙方（签字）：________________
日期：______年______月______日    日期：______年______月______日
`

const NDA_CONTRACT = `保密协议

甲方（公司）：_______________________________
乙方（员工）：_______________________________
签署日期：______年______月______日

鉴于乙方受雇于甲方或将受雇于甲方，双方就保密事项协议如下：

第一条 保密信息范围
本协议所称"保密信息"包括但不限于：
1. 技术类：源代码、系统架构、产品设计、算法、数据库结构等；
2. 商业类：客户名单、合同内容、定价策略、财务数据、市场计划等；
3. 运营类：内部流程、供应商信息、人事信息等；
4. 甲方明确标记为"保密"的一切文件和信息。

第二条 保密义务
乙方在职期间及离职后 ____ 年内，承诺：
1. 对保密信息予以严格保密，不以任何方式泄露给第三方；
2. 未经甲方书面授权，不得复制、传播或披露保密信息；
3. 离职时，须归还或销毁所有包含保密信息的文件及设备。

第三条 竞业限制（可选）
乙方离职后 ____ 年内，不得在与甲方存在直接竞争关系的企业任职或自行创办同类企业。
竞业限制期间，甲方每月支付乙方竞业限制补偿金人民币 ______ 元。

第四条 违约责任
乙方违反本协议，须赔偿甲方因此遭受的全部损失，最低赔偿额不低于人民币 ________ 元，
并承担甲方为维权支出的合理费用（含律师费）。

第五条 例外情形
以下情形不受本协议约束：
1. 已在签署时属于公众所知的信息；
2. 乙方通过合法途径独立获得的信息；
3. 法律法规要求披露的信息。

第六条 其他
本协议与劳动合同具有同等法律效力，发生争议时，提交甲方所在地劳动仲裁委员会仲裁。

甲方（盖章）：________________    乙方（签字）：________________
日期：______年______月______日    日期：______年______月______日
`

function downloadTemplate(type: 'labor' | 'nda') {
  const content = type === 'labor' ? LABOR_CONTRACT : NDA_CONTRACT
  const filename = type === 'labor' ? '劳动合同模板.txt' : '保密协议模板.txt'
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(t(type === 'labor' ? 'personnel.contract.msgLaborDownloaded' : 'personnel.contract.msgNdaDownloaded'))
}
</script>

<style scoped>
.page-container { display: flex; flex-direction: column; gap: 16px; }
.search-actions { display: flex; gap: 8px; }

.template-card { margin-bottom: 0; }
.template-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.template-title { font-size: 14px; font-weight: 600; color: #1d1d1f; }
.template-tip { font-size: 12px; color: rgba(29,29,31,0.45); }

.template-list { display: flex; gap: 12px; flex-wrap: wrap; }

.template-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border: 1px solid #e4e7ed;
  border-radius: 14px;
  cursor: pointer;
  transition: all 0.15s;
  min-width: 280px;
  flex: 1;
  max-width: 420px;
}
.template-item:hover {
  border-color: #0071e3;
  background: rgba(0,113,227,0.03);
  box-shadow: 0 2px 12px rgba(0,113,227,0.1);
}
.template-icon { flex-shrink: 0; }
.template-info { flex: 1; }
.template-name { font-size: 14px; font-weight: 600; color: #1d1d1f; margin-bottom: 2px; }
.template-desc { font-size: 12px; color: rgba(29,29,31,0.45); }
</style>
