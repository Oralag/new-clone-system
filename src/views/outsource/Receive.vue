<template>
  <div class="outsource-receive-page">
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi" del-path="/outsource/receive/batchDel" :export-file-name="$t('outsource.receive.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.receive_no" :placeholder="$t('outsource.receive.searchReceiveNoPlaceholder')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('outsource.receive.searchGoodsNamePlaceholder')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('outsource.receive.searchReconcileFilterPlaceholder')">
              <el-option :label="$t('outsource.receive.optionUnreconciled')" value="unreconciled" />
            </el-select>
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('outsource.receive.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('outsource.receive.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('outsource.receive.btnAdd') }}</el-button>
          </template>
          <el-table-column prop="receive_no" :label="$t('outsource.receive.colReceiveNo')" min-width="150" />
          <el-table-column prop="supplier_name" :label="$t('outsource.receive.colSupplier')" min-width="130" />
          <el-table-column prop="receive_date" :label="$t('outsource.receive.colReceiveDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.receive_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="receiver" :label="$t('outsource.receive.colReceiver')" width="90" />
          <el-table-column :label="$t('outsource.receive.colTotalPrice')" width="110" align="right">
            <template #default="{ row }">{{ Number(row.total_price||0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column :label="$t('outsource.receive.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status===1?'success':row.status===2?'danger':'info'" size="small">
                {{ row.status===1?$t('outsource.receive.statusAudited'):row.status===2?$t('outsource.receive.statusRejected'):$t('outsource.receive.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('outsource.receive.colActions')" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('outsource.receive.btnView') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="openEdit(row)">{{ $t('outsource.receive.btnEdit') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="doAudit(row,1)">{{ $t('outsource.receive.btnAudit') }}</el-button>
              <el-button v-if="row.status===0" type="danger" size="small" link @click="doAudit(row,2)">{{ $t('outsource.receive.btnReject') }}</el-button>
              <el-button v-if="row.status===1 && !permStore.isSubAccount" type="warning" size="small" link @click="doAudit(row,0)">{{ $t('outsource.receive.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('outsource.receive.btnReconciled') : $t('outsource.receive.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('outsource.receive.titleDeleteDisabled') : ''" @click="handleDelete(row.id)">{{ $t('outsource.receive.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('outsource.receive.btnBack') }}</el-button>
          <span class="form-title">{{ isView?$t('outsource.receive.formTitleView'):fd.id?$t('outsource.receive.formTitleEdit'):$t('outsource.receive.formTitleAdd') }}</span>
          <el-tag v-if="fd.status===1" type="success" size="small">{{ $t('outsource.receive.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status===2" type="danger" size="small">{{ $t('outsource.receive.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('outsource.receive.btnSave') }}</el-button>
        </div>
      </div>
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6"><div class="field-row"><span class="field-label">{{ $t('outsource.receive.fieldReceiveNo') }}</span><el-input v-model="fd.receive_no" :placeholder="$t('outsource.receive.receiveNoPlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('outsource.receive.fieldSupplier') }}</span>
                <el-select v-model="fd.supplier_id" :placeholder="$t('outsource.receive.supplierPlaceholder')" style="flex:1" filterable :disabled="isView" @change="onSupplierChange">
                  <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label required">{{ $t('outsource.receive.fieldReceiveDate') }}</span><el-date-picker v-model="fd.receive_date" type="date" value-format="YYYY-MM-DD" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label">{{ $t('outsource.receive.fieldReceiver') }}</span><el-input v-model="fd.receiver" :placeholder="$t('outsource.receive.receiverPlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6" style="margin-top:8px"><div class="field-row"><span class="field-label">{{ $t('outsource.receive.fieldContactPhone') }}</span><el-input v-model="fd.contact_phone" :placeholder="$t('outsource.receive.contactPhonePlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.receive.fieldSettleType') }}</span>
                <el-select v-model="fd.settle_type" style="flex:1" :disabled="isView">
                  <el-option :label="$t('outsource.receive.optionCashOnDelivery')" value="现付" />
                  <el-option :label="$t('outsource.receive.optionMonthly')" value="月结" />
                  <el-option :label="$t('outsource.receive.optionCreditTerm')" value="账期" />
                  <el-option :label="$t('outsource.receive.optionPrepaid')" value="预付" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('outsource.receive.btnSelectGoods') }}</el-button>
          <el-button size="small" @click="addEmptyRow">{{ $t('outsource.receive.btnAddRow') }}</el-button>
          <span class="goods-summary">{{ $t('outsource.receive.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>{{ $t('outsource.receive.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b></div>

        <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('outsource.receive.emptyText')">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column :label="$t('outsource.receive.colGoodsName')" min-width="140">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.goods_name" size="small" /><span v-else>{{ row.goods_name }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.receive.colGoodsSn')" width="110"><template #default="{ row }">{{ row.goods_sn||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.receive.colSpec')" width="100"><template #default="{ row }">{{ row.spec||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.receive.colUnit')" width="70" align="center"><template #default="{ row }">{{ row.unit_name||'—' }}</template></el-table-column>
          <el-table-column width="110">
            <template #header>{{ $t('outsource.receive.colReceiveQty') }}<el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num', $t('outsource.receive.colReceiveQty'))">{{ $t('outsource.receive.colReceiveQtyBatch') }}</el-button></template>
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" @change="calcRow(row)" /><span v-else>{{ row.num }}</span></template>
          </el-table-column>
          <el-table-column width="110">
            <template #header>{{ $t('outsource.receive.colUnitPrice') }}<el-button v-if="!isView" link type="primary" size="small" @click="batchSet('unit_price', $t('outsource.receive.colUnitPrice'))">{{ $t('outsource.receive.colUnitPriceBatch') }}</el-button></template>
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.unit_price" :min="0" :precision="4" controls-position="right" size="small" style="width:100%" @change="calcRow(row)" /><span v-else>{{ row.unit_price }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.receive.colSubtotal')" width="100" align="right">
            <template #default="{ row }"><b style="color:#0071e3">{{ ((row.num||0)*(row.unit_price||0)).toFixed(2) }}</b></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.receive.colRemark')" min-width="100">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.remark" size="small" /><span v-else>{{ row.remark||'' }}</span></template>
          </el-table-column>
          <el-table-column v-if="!isView" label="" width="50" fixed="right">
            <template #default="{ $index }"><el-button type="danger" link size="small" :icon="Delete" @click="fd.items.splice($index,1)" /></template>
          </el-table-column>
        </el-table>

        <div class="form-footer">
          <div class="footer-summary">{{ $t('outsource.receive.footerTotal') }} <b>{{ totalNum.toFixed(2) }}</b>&nbsp;&nbsp;{{ $t('outsource.receive.footerTotalPrice') }} <b style="color:#0071e3">{{ totalPrice.toFixed(2) }}</b></div>
          <div class="field-row" style="margin-top:8px"><span class="field-label">{{ $t('outsource.receive.fieldRemark') }}</span><el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" /></div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />
    <el-dialog v-model="batchVisible" :title="$t('outsource.receive.batchDialogTitle', { label: batchLabel })" width="280px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer><el-button @click="batchVisible=false">{{ $t('outsource.receive.btnBatchCancel') }}</el-button><el-button type="primary" @click="applyBatch">{{ $t('outsource.receive.btnBatchConfirm') }}</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getReceiveList, createReceive, deleteReceive } from '@/api/outsource'
import { getSupplierList } from '@/api/procure'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()
const tableRef=ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_outsource_receive', tableRef)
const reconcileFilteredApi = createFilteredApi(getReceiveList, 'reconcile_filter')
const permStore = usePermissionStore()
const searchForm=reactive({receive_no:'',goods_name:'',reconcile_filter:''})
function resetSearch(){searchForm.receive_no='';searchForm.goods_name='';tableRef.value?.loadData()}
const showForm=ref(false),isView=ref(false),saving=ref(false)
const supplierOptions=ref<any[]>([])
async function loadSuppliers(){try{const r=await getSupplierList({list_rows:200});supplierOptions.value=r.data?.list||r.data?.data||[]}catch{}}
function onSupplierChange(id:any){const s=supplierOptions.value.find(x=>x.id===id);fd.supplier_name=s?.name??'';fd.contact_phone=s?.phone??''}
function defaultFd(){return{id:0,status:0,receive_no:'',supplier_id:null as any,supplier_name:'',receive_date:new Date().toISOString().slice(0,10),receiver:'',contact_phone:'',settle_type:'现付',remark:'',items:[] as any[],total_price:0}}
const fd=reactive(defaultFd())
function calcRow(r:any){r.row_total=(r.num||0)*(r.unit_price||0)}
const totalNum=computed(()=>fd.items.reduce((s,r)=>s+(Number(r.num)||0),0))
const totalPrice=computed(()=>fd.items.reduce((s,r)=>s+(Number(r.num)||0)*(Number(r.unit_price)||0),0))
async function openAdd(){Object.assign(fd,defaultFd());fd.items=[];isView.value=false;showForm.value=true;await loadSuppliers()}
async function openEdit(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=Array.isArray(row.goods_info)?row.goods_info:JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};fd.items.forEach(calcRow);isView.value=false;showForm.value=true;await loadSuppliers()}
async function openView(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=Array.isArray(row.goods_info)?row.goods_info:JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};fd.items.forEach(calcRow);isView.value=true;showForm.value=true;await loadSuppliers()}
function backToList(){showForm.value=false;tableRef.value?.refresh()}
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  goods.forEach(g=>fd.items.push({goods_id:g.id,goods_name:g.name,goods_sn:g.goods_sn||'',spec:g.spec||'',unit_name:g.unit_name||'',num:1,unit_price:0,row_total:0,remark:''}))
}
function addEmptyRow(){fd.items.push({goods_id:0,goods_name:'',goods_sn:'',spec:'',unit_name:'',num:1,unit_price:0,row_total:0,remark:''})}
const batchVisible=ref(false),batchField=ref(''),batchLabel=ref(''),batchValue=ref(0)
function batchSet(f:string,l:string){batchField.value=f;batchLabel.value=l;batchValue.value=0;batchVisible.value=true}
function applyBatch(){fd.items.forEach(r=>{r[batchField.value]=batchValue.value;calcRow(r)});batchVisible.value=false}
async function handleSave(){
  if(!fd.supplier_id){ElMessage.warning(t('outsource.receive.msgSelectSupplier'));return}
  if(!fd.receive_date){ElMessage.warning(t('outsource.receive.msgSelectReceiveDate'));return}
  if(!fd.items.length){ElMessage.warning(t('outsource.receive.msgAddGoods'));return}
  saving.value=true
  try{await createReceive({...fd,goods_info:JSON.stringify(fd.items),total_price:totalPrice.value});ElMessage.success(t('outsource.receive.msgSaveSuccess'));backToList()}catch{}finally{saving.value=false}
}
async function doAudit(row:any,status:number){
  const labels:Record<number,string>={1:t('outsource.receive.btnAudit'),2:t('outsource.receive.btnReject'),0:t('outsource.receive.btnUnaudit')}
  await ElMessageBox.confirm(t('outsource.receive.msgConfirmAudit',{action:labels[status]}),t('outsource.receive.msgTip'),{type:'warning'})
  try{await http.post('/outsource/receive/audit',{id:row.id,status});ElMessage.success(t('outsource.receive.msgSuccess'));tableRef.value?.refresh()}catch{}
}
async function handleDelete(id:number){await ElMessageBox.confirm(t('outsource.receive.msgConfirmDelete'),t('outsource.receive.msgTip'),{type:'warning'});await deleteReceive(id);ElMessage.success(t('outsource.receive.msgDeleteSuccess'));tableRef.value?.refresh()}
onMounted(loadSuppliers)
</script>

<style scoped>
.outsource-receive-page{}
.form-page{background:#fff;min-height:calc(100vh - 80px)}
.form-topbar{display:flex;align-items:center;justify-content:space-between;padding:10px 16px;border-bottom:1px solid #e8edf2;background:#fff;position:sticky;top:0;z-index:10}
.form-topbar-left{display:flex;align-items:center;gap:10px}
.form-title{font-size:15px;font-weight:600;color:#333}
.form-body{padding:16px}
.form-section{margin-bottom:12px}
.field-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.field-label{font-size:13px;color:#555;white-space:nowrap;flex-shrink:0;min-width:52px}
.field-label.required::before{content:'*';color:#f56c6c;margin-right:2px}
.goods-toolbar{display:flex;align-items:center;gap:8px;padding:8px 0;margin-bottom:6px;border-top:1px solid #f0f0f0}
.goods-summary-view{padding:6px 0;font-size:13px;color:#555;border-top:1px solid #f0f0f0;margin-bottom:6px}
.goods-summary{margin-left:auto;font-size:13px;color:#555}
.form-footer{padding:12px 0;border-top:1px solid #f0f0f0}
.footer-summary{font-size:13px;color:#555}
</style>
