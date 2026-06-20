<template>
  <div class="outsource-inhouse-page">
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi" del-path="/outsource/inhouse/batchDel" :export-file-name="$t('outsource.inhouse.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.in_no" :placeholder="$t('outsource.inhouse.searchInNoPlaceholder')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('outsource.inhouse.searchGoodsNamePlaceholder')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('outsource.inhouse.searchReconcileFilterPlaceholder')">
              <el-option :label="$t('outsource.inhouse.optionUnreconciled')" value="unreconciled" />
            </el-select>
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('outsource.inhouse.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('outsource.inhouse.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('outsource.inhouse.btnAdd') }}</el-button>
          </template>
          <el-table-column prop="in_no" :label="$t('outsource.inhouse.colInNo')" min-width="150" />
          <el-table-column prop="supplier_name" :label="$t('outsource.inhouse.colSupplier')" min-width="130" />
          <el-table-column prop="in_date" :label="$t('outsource.inhouse.colInDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.in_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="warehouse_name" :label="$t('outsource.inhouse.colWarehouse')" min-width="110" />
          <el-table-column prop="receiver" :label="$t('outsource.inhouse.colReceiver')" width="90" />
          <el-table-column :label="$t('outsource.inhouse.colTotalPrice')" width="110" align="right">
            <template #default="{ row }">{{ Number(row.total_price||0).toFixed(2) }}</template>
          </el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status===1?'success':row.status===2?'danger':'info'" size="small">
                {{ row.status===1?$t('outsource.inhouse.statusAudited'):row.status===2?$t('outsource.inhouse.statusRejected'):$t('outsource.inhouse.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colActions')" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('outsource.inhouse.btnView') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="openEdit(row)">{{ $t('outsource.inhouse.btnEdit') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="doAudit(row,1)">{{ $t('outsource.inhouse.btnAudit') }}</el-button>
              <el-button v-if="row.status===0" type="danger" size="small" link @click="doAudit(row,2)">{{ $t('outsource.inhouse.btnReject') }}</el-button>
              <el-button v-if="row.status===1 && !permStore.isSubAccount" type="warning" size="small" link @click="doAudit(row,0)">{{ $t('outsource.inhouse.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('outsource.inhouse.btnReconciled') : $t('outsource.inhouse.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('outsource.inhouse.titleDeleteDisabled') : ''" @click="handleDelete(row.id)">{{ $t('outsource.inhouse.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('outsource.inhouse.btnBack') }}</el-button>
          <span class="form-title">{{ isView?$t('outsource.inhouse.formTitleView'):fd.id?$t('outsource.inhouse.formTitleEdit'):$t('outsource.inhouse.formTitleAdd') }}</span>
          <el-tag v-if="fd.status===1" type="success" size="small">{{ $t('outsource.inhouse.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status===2" type="danger" size="small">{{ $t('outsource.inhouse.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('outsource.inhouse.btnSave') }}</el-button>
        </div>
      </div>
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6">
              <div class="field-row"><span class="field-label">{{ $t('outsource.inhouse.fieldInNo') }}</span><el-input v-model="fd.in_no" :placeholder="$t('outsource.inhouse.inNoPlaceholder')" style="flex:1" :disabled="isView" /></div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('outsource.inhouse.fieldSupplier') }}</span>
                <el-select v-model="fd.supplier_id" :placeholder="$t('outsource.inhouse.supplierPlaceholder')" style="flex:1" filterable :disabled="isView" @change="onSupplierChange">
                  <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6">
              <div class="field-row"><span class="field-label required">{{ $t('outsource.inhouse.fieldInDate') }}</span><el-date-picker v-model="fd.in_date" type="date" value-format="YYYY-MM-DD" style="flex:1" :disabled="isView" /></div>
            </el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('outsource.inhouse.fieldWarehouse') }}</span>
                <el-select v-model="fd.warehouse_id" :placeholder="$t('outsource.inhouse.warehousePlaceholder')" style="flex:1" :disabled="isView" @change="onWarehouseChange">
                  <el-option v-for="w in warehouseOptions" :key="w.id" :label="w.name" :value="w.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row"><span class="field-label">{{ $t('outsource.inhouse.fieldReceiver') }}</span><el-input v-model="fd.receiver" :placeholder="$t('outsource.inhouse.receiverPlaceholder')" style="flex:1" :disabled="isView" /></div>
            </el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.inhouse.fieldPayStatus') }}</span>
                <el-select v-model="fd.pay_status" style="flex:1" :disabled="isView">
                  <el-option :label="$t('outsource.inhouse.optionUnpaid')" :value="0" />
                  <el-option :label="$t('outsource.inhouse.optionPartialPaid')" :value="1" />
                  <el-option :label="$t('outsource.inhouse.optionPaidOff')" :value="2" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row"><span class="field-label">{{ $t('outsource.inhouse.fieldPaidAmount') }}</span><el-input-number v-model="fd.paid_amount" :min="0" :precision="2" controls-position="right" style="flex:1" :disabled="isView" /></div>
            </el-col>
          </el-row>
        </div>

        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('outsource.inhouse.btnSelectGoods') }}</el-button>
          <el-button size="small" @click="addEmptyRow">{{ $t('outsource.inhouse.btnAddRow') }}</el-button>
          <span class="goods-summary">{{ $t('outsource.inhouse.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b></span>
        </div>
        <div class="goods-summary-view" v-else>{{ $t('outsource.inhouse.totalPriceLabel') }}<b>{{ totalPrice.toFixed(2) }}</b></div>

        <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('outsource.inhouse.emptyText')">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column :label="$t('outsource.inhouse.colGoodsName')" min-width="140">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.goods_name" size="small" /><span v-else>{{ row.goods_name }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colGoodsSn')" width="110"><template #default="{ row }">{{ row.goods_sn||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colSpec')" width="100"><template #default="{ row }">{{ row.spec||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colUnit')" width="70" align="center"><template #default="{ row }">{{ row.unit_name||'—' }}</template></el-table-column>
          <el-table-column width="110">
            <template #header>{{ $t('outsource.inhouse.colInQty') }}<el-button v-if="!isView" link type="primary" size="small" @click="batchSet('num', $t('outsource.inhouse.colInQty'))">{{ $t('outsource.inhouse.colInQtyBatch') }}</el-button></template>
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" @change="calcRow(row)" /><span v-else>{{ row.num }}</span></template>
          </el-table-column>
          <el-table-column width="110">
            <template #header>{{ $t('outsource.inhouse.colInPrice') }}<el-button v-if="!isView" link type="primary" size="small" @click="batchSet('in_price', $t('outsource.inhouse.colInPrice'))">{{ $t('outsource.inhouse.colInPriceBatch') }}</el-button></template>
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.in_price" :min="0" :precision="4" controls-position="right" size="small" style="width:100%" @change="calcRow(row)" /><span v-else>{{ row.in_price }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colSubtotal')" width="100" align="right">
            <template #default="{ row }"><b style="color:#0071e3">{{ ((row.num||0)*(row.in_price||0)).toFixed(2) }}</b></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.inhouse.colRemark')" min-width="100">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.remark" size="small" /><span v-else>{{ row.remark||'' }}</span></template>
          </el-table-column>
          <el-table-column v-if="!isView" label="" width="50" fixed="right">
            <template #default="{ $index }"><el-button type="danger" link size="small" :icon="Delete" @click="fd.items.splice($index,1)" /></template>
          </el-table-column>
        </el-table>

        <div class="form-footer">
          <div class="footer-summary">{{ $t('outsource.inhouse.footerTotal') }} <b>{{ totalNum.toFixed(2) }}</b>&nbsp;&nbsp;{{ $t('outsource.inhouse.footerTotalPrice') }} <b style="color:#0071e3">{{ totalPrice.toFixed(2) }}</b>&nbsp;&nbsp;{{ $t('outsource.inhouse.footerUnpaid') }} <b style="color:#dc2626">{{ (totalPrice - (fd.paid_amount||0)).toFixed(2) }}</b></div>
          <div class="field-row" style="margin-top:8px"><span class="field-label">{{ $t('outsource.inhouse.fieldRemark') }}</span><el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" /></div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />
    <el-dialog v-model="batchVisible" :title="$t('outsource.inhouse.batchDialogTitle', { label: batchLabel })" width="280px" append-to-body>
      <el-input-number v-model="batchValue" :min="0" :precision="4" style="width:100%" controls-position="right" />
      <template #footer><el-button @click="batchVisible=false">{{ $t('outsource.inhouse.btnBatchCancel') }}</el-button><el-button type="primary" @click="applyBatch">{{ $t('outsource.inhouse.btnBatchConfirm') }}</el-button></template>
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
import { getOutsourceInhouseList, createOutsourceInhouse, deleteOutsourceInhouse } from '@/api/outsource'
import { getSupplierList } from '@/api/procure'
import { getWarehouseList } from '@/api/warehouse'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()
const tableRef=ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_outsource_inhouse', tableRef)
const reconcileFilteredApi = createFilteredApi(getOutsourceInhouseList, 'reconcile_filter')
const permStore = usePermissionStore()
const searchForm=reactive({in_no:'',goods_name:'',reconcile_filter:''})
function resetSearch(){searchForm.in_no='';searchForm.goods_name='';tableRef.value?.loadData()}
const showForm=ref(false),isView=ref(false),saving=ref(false)
const supplierOptions=ref<any[]>([]),warehouseOptions=ref<any[]>([])
async function loadInit(){try{const[s,w]=await Promise.all([getSupplierList({list_rows:200}),getWarehouseList({list_rows:200})]);supplierOptions.value=s.data?.list||s.data?.data||[];warehouseOptions.value=w.data?.list||w.data?.data||[]}catch{}}
function onSupplierChange(id:any){const s=supplierOptions.value.find(x=>x.id===id);fd.supplier_name=s?.name??''}
function onWarehouseChange(id:any){const w=warehouseOptions.value.find(x=>x.id===id);fd.warehouse_name=w?.name??''}
function defaultFd(){return{id:0,status:0,in_no:'',supplier_id:null as any,supplier_name:'',in_date:new Date().toISOString().slice(0,10),warehouse_id:null as any,warehouse_name:'',receiver:'',pay_status:0,paid_amount:0,remark:'',items:[] as any[],total_price:0}}
const fd=reactive(defaultFd())
function calcRow(r:any){r.row_total=(r.num||0)*(r.in_price||0)}
const totalNum=computed(()=>fd.items.reduce((s,r)=>s+(Number(r.num)||0),0))
const totalPrice=computed(()=>fd.items.reduce((s,r)=>s+(Number(r.num)||0)*(Number(r.in_price)||0),0))
async function openAdd(){Object.assign(fd,defaultFd());fd.items=[];isView.value=false;showForm.value=true;await loadInit()}
async function openEdit(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=Array.isArray(row.goods_info)?row.goods_info:JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};fd.items.forEach(calcRow);isView.value=false;showForm.value=true;await loadInit()}
async function openView(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=Array.isArray(row.goods_info)?row.goods_info:JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};fd.items.forEach(calcRow);isView.value=true;showForm.value=true;await loadInit()}
function backToList(){showForm.value=false;tableRef.value?.refresh()}
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  goods.forEach(g=>fd.items.push({goods_id:g.id,goods_name:g.name,goods_sn:g.goods_sn||'',spec:g.spec||'',unit_name:g.unit_name||'',stock_num:g.stock_num??null,num:1,in_price:0,row_total:0,remark:''}))
}
function addEmptyRow(){fd.items.push({goods_id:0,goods_name:'',goods_sn:'',spec:'',unit_name:'',num:1,in_price:0,row_total:0,remark:''})}
const batchVisible=ref(false),batchField=ref(''),batchLabel=ref(''),batchValue=ref(0)
function batchSet(f:string,l:string){batchField.value=f;batchLabel.value=l;batchValue.value=0;batchVisible.value=true}
function applyBatch(){fd.items.forEach(r=>{r[batchField.value]=batchValue.value;calcRow(r)});batchVisible.value=false}
async function handleSave(){
  if(!fd.supplier_id){ElMessage.warning(t('outsource.inhouse.msgSelectSupplier'));return}
  if(!fd.warehouse_id){ElMessage.warning(t('outsource.inhouse.msgSelectWarehouse'));return}
  if(!fd.items.length){ElMessage.warning(t('outsource.inhouse.msgAddGoods'));return}
  saving.value=true
  try{await createOutsourceInhouse({...fd,goods_info:JSON.stringify(fd.items),total_price:totalPrice.value});ElMessage.success(t('outsource.inhouse.msgSaveSuccess'));backToList()}catch{}finally{saving.value=false}
}
async function doAudit(row:any,status:number){
  const labels:Record<number,string>={1:t('outsource.inhouse.btnAudit'),2:t('outsource.inhouse.btnReject'),0:t('outsource.inhouse.btnUnaudit')}
  await ElMessageBox.confirm(t('outsource.inhouse.msgConfirmAudit',{action:labels[status]}),t('outsource.inhouse.msgTip'),{type:'warning'})
  try{await http.post('/outsource/inhouse/audit',{id:row.id,status});ElMessage.success(t('outsource.inhouse.msgSuccess'));tableRef.value?.refresh()}catch{}
}
async function handleDelete(id:number){await ElMessageBox.confirm(t('outsource.inhouse.msgConfirmDelete'),t('outsource.inhouse.msgTip'),{type:'warning'});await deleteOutsourceInhouse(id);ElMessage.success(t('outsource.inhouse.msgDeleteSuccess'));tableRef.value?.refresh()}
onMounted(loadInit)
</script>

<style scoped>
.outsource-inhouse-page{}
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
