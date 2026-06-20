<template>
  <div class="outsource-payment-page">
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getOutsourcePaymentList" del-path="/outsource/payment/batchDel" :export-file-name="$t('outsource.payment.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.payment_no" :placeholder="$t('outsource.payment.searchPaymentNoPlaceholder')" clearable style="width:160px" />
            <el-input v-model="searchForm.supplier_name" :placeholder="$t('outsource.payment.searchSupplierPlaceholder')" clearable style="width:160px" />
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('outsource.payment.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('outsource.payment.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('outsource.payment.btnAdd') }}</el-button>
          </template>
          <el-table-column prop="payment_no" :label="$t('outsource.payment.colPaymentNo')" min-width="150" />
          <el-table-column prop="supplier_name" :label="$t('outsource.payment.colSupplier')" min-width="130" />
          <el-table-column prop="payment_date" :label="$t('outsource.payment.colPaymentDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.payment_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="account_name" :label="$t('outsource.payment.colAccountName')" min-width="120" />
          <el-table-column :label="$t('outsource.payment.colAmount')" width="120" align="right">
            <template #default="{ row }"><b style="color:#dc2626">{{ Number(row.amount||0).toFixed(2) }}</b></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.payment.colPayMethod')" width="100" align="center">
            <template #default="{ row }">{{ row.pay_method||'—' }}</template>
          </el-table-column>
          <el-table-column :label="$t('outsource.payment.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status===1?'success':row.status===2?'danger':'info'" size="small">
                {{ row.status===1?$t('outsource.payment.statusAudited'):row.status===2?$t('outsource.payment.statusRejected'):$t('outsource.payment.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('outsource.payment.colActions')" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('outsource.payment.btnView') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="openEdit(row)">{{ $t('outsource.payment.btnEdit') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="doAudit(row,1)">{{ $t('outsource.payment.btnAudit') }}</el-button>
              <el-button v-if="row.status===0" type="danger" size="small" link @click="doAudit(row,2)">{{ $t('outsource.payment.btnReject') }}</el-button>
              <el-button v-if="row.status===1 && !permStore.isSubAccount" type="warning" size="small" link @click="doAudit(row,0)">{{ $t('outsource.payment.btnUnaudit') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('outsource.payment.titleDeleteDisabled') : ''" @click="handleDelete(row.id)">{{ $t('outsource.payment.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('outsource.payment.btnBack') }}</el-button>
          <span class="form-title">{{ isView?$t('outsource.payment.formTitleView'):fd.id?$t('outsource.payment.formTitleEdit'):$t('outsource.payment.formTitleAdd') }}</span>
          <el-tag v-if="fd.status===1" type="success" size="small">{{ $t('outsource.payment.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status===2" type="danger" size="small">{{ $t('outsource.payment.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('outsource.payment.btnSave') }}</el-button>
        </div>
      </div>
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6"><div class="field-row"><span class="field-label">{{ $t('outsource.payment.fieldPaymentNo') }}</span><el-input v-model="fd.payment_no" :placeholder="$t('outsource.payment.paymentNoPlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('outsource.payment.fieldSupplier') }}</span>
                <el-select v-model="fd.supplier_id" :placeholder="$t('outsource.payment.supplierPlaceholder')" style="flex:1" filterable :disabled="isView" @change="onSupplierChange">
                  <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label required">{{ $t('outsource.payment.fieldPaymentDate') }}</span><el-date-picker v-model="fd.payment_date" type="date" value-format="YYYY-MM-DD" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('outsource.payment.fieldAmount') }}</span>
                <el-input-number v-model="fd.amount" :min="0" :precision="2" controls-position="right" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.payment.fieldPayMethod') }}</span>
                <el-select v-model="fd.pay_method" style="flex:1" :disabled="isView">
                  <el-option :label="$t('outsource.payment.optionBankTransfer')" value="银行转账" />
                  <el-option :label="$t('outsource.payment.optionCash')" value="现金" />
                  <el-option :label="$t('outsource.payment.optionCheque')" value="支票" />
                  <el-option :label="$t('outsource.payment.optionOnlineBanking')" value="网银" />
                  <el-option :label="$t('outsource.payment.optionOther')" value="其他" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6" style="margin-top:8px"><div class="field-row"><span class="field-label">{{ $t('outsource.payment.fieldAccountName') }}</span><el-input v-model="fd.account_name" :placeholder="$t('outsource.payment.accountNamePlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6" style="margin-top:8px"><div class="field-row"><span class="field-label">{{ $t('outsource.payment.fieldPayer') }}</span><el-input v-model="fd.payer" :placeholder="$t('outsource.payment.payerPlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.payment.fieldPayPurpose') }}</span>
                <el-select v-model="fd.pay_purpose" style="flex:1" :disabled="isView">
                  <el-option :label="$t('outsource.payment.optionOutsourceFee')" value="委外加工款" />
                  <el-option :label="$t('outsource.payment.optionGoodsPayment')" value="货款" />
                  <el-option :label="$t('outsource.payment.optionDeposit')" value="定金" />
                  <el-option :label="$t('outsource.payment.optionBalance')" value="尾款" />
                  <el-option :label="$t('outsource.payment.optionOther')" value="其他" />
                </el-select>
              </div>
            </el-col>
          </el-row>
          <el-row :gutter="16" style="margin-top:8px">
            <el-col :span="12">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.payment.fieldReceiverAccount') }}</span>
                <el-input v-model="fd.receiver_account" :placeholder="$t('outsource.payment.receiverAccountPlaceholder')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
            <el-col :span="12">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.payment.fieldRemark') }}</span>
                <el-input v-model="fd.remark" :placeholder="$t('outsource.payment.remarkPlaceholder')" style="flex:1" :disabled="isView" />
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="payment-summary">
          <div class="summary-card">
            <div class="summary-label">{{ $t('outsource.payment.summaryCurrentPayment') }}</div>
            <div class="summary-value red">¥{{ Number(fd.amount||0).toFixed(2) }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">{{ $t('outsource.payment.summaryPayMethod') }}</div>
            <div class="summary-value">{{ fd.pay_method||'—' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">{{ $t('outsource.payment.summaryPayAccount') }}</div>
            <div class="summary-value">{{ fd.account_name||'—' }}</div>
          </div>
          <div class="summary-card">
            <div class="summary-label">{{ $t('outsource.payment.summarySupplier') }}</div>
            <div class="summary-value">{{ fd.supplier_name||'—' }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getOutsourcePaymentList, createOutsourcePayment, deleteOutsourcePayment } from '@/api/outsource'
import { getSupplierList } from '@/api/procure'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()
const tableRef=ref<InstanceType<typeof ScTable>>()
const permStore = usePermissionStore()
const searchForm=reactive({payment_no:'',supplier_name:''})
function resetSearch(){searchForm.payment_no='';searchForm.supplier_name='';tableRef.value?.loadData()}
const showForm=ref(false),isView=ref(false),saving=ref(false)
const supplierOptions=ref<any[]>([])
async function loadSuppliers(){try{const r=await getSupplierList({list_rows:200});supplierOptions.value=r.data?.list||r.data?.data||[]}catch{}}
function onSupplierChange(id:any){const s=supplierOptions.value.find(x=>x.id===id);fd.supplier_name=s?.name??''}
function defaultFd(){return{id:0,status:0,payment_no:'',supplier_id:null as any,supplier_name:'',payment_date:new Date().toISOString().slice(0,10),amount:0,pay_method:'银行转账',account_name:'',payer:'',pay_purpose:'委外加工款',receiver_account:'',remark:''}}
const fd=reactive(defaultFd())
async function openAdd(){Object.assign(fd,defaultFd());isView.value=false;showForm.value=true;await loadSuppliers()}
async function openEdit(row:any){Object.assign(fd,{...defaultFd(),...row});isView.value=false;showForm.value=true;await loadSuppliers()}
async function openView(row:any){Object.assign(fd,{...defaultFd(),...row});isView.value=true;showForm.value=true;await loadSuppliers()}
function backToList(){showForm.value=false;tableRef.value?.refresh()}
async function handleSave(){
  if(!fd.supplier_id){ElMessage.warning(t('outsource.payment.msgSelectSupplier'));return}
  if(!fd.amount||fd.amount<=0){ElMessage.warning(t('outsource.payment.msgInputAmount'));return}
  saving.value=true
  try{await createOutsourcePayment(fd);ElMessage.success(t('outsource.payment.msgSaveSuccess'));backToList()}catch{}finally{saving.value=false}
}
async function doAudit(row:any,status:number){
  const labels:Record<number,string>={1:t('outsource.payment.btnAudit'),2:t('outsource.payment.btnReject'),0:t('outsource.payment.btnUnaudit')}
  await ElMessageBox.confirm(t('outsource.payment.msgConfirmAudit',{action:labels[status]}),t('outsource.payment.msgTip'),{type:'warning'})
  try{await http.post('/outsource/payment/audit',{id:row.id,status});ElMessage.success(t('outsource.payment.msgSuccess'));tableRef.value?.refresh()}catch{}
}
async function handleDelete(id:number){await ElMessageBox.confirm(t('outsource.payment.msgConfirmDelete'),t('outsource.payment.msgTip'),{type:'warning'});await deleteOutsourcePayment(id);ElMessage.success(t('outsource.payment.msgDeleteSuccess'));tableRef.value?.refresh()}
onMounted(loadSuppliers)
</script>

<style scoped>
.outsource-payment-page{}
.form-page{background:#fff;min-height:calc(100vh - 80px)}
.form-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e8edf2;background:#fff;position:sticky;top:0;z-index:10}
.form-topbar-left{display:flex;align-items:center;gap:10px}
.form-title{font-size:15px;font-weight:600;color:#333}
.form-body{padding:16px}
.form-section{margin-bottom:16px}
.field-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.field-label{font-size:13px;color:#555;white-space:nowrap;flex-shrink:0;min-width:52px}
.field-label.required::before{content:'*';color:#f56c6c;margin-right:2px}
.payment-summary{display:flex;gap:12px;padding:16px;background:#f8fafc;border-radius:8px;margin-top:12px}
.summary-card{flex:1;background:#fff;border-radius:6px;padding:12px 14px;box-shadow:0 1px 4px rgba(0,0,0,.06);text-align:center}
.summary-label{font-size:12px;color:#888;margin-bottom:4px}
.summary-value{font-size:16px;font-weight:700;color:#333}
.summary-value.red{color:#dc2626}
</style>
