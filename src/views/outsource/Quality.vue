<template>
  <div class="outsource-quality-page">
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef"
          :row-class-name="({ row }: any) => row._reconciled ? 'row-reconciled' : ''" :api-obj="reconcileFilteredApi" del-path="/outsource/quality/batchDel" :export-file-name="$t('outsource.quality.exportFileName')" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.quality_no" :placeholder="$t('outsource.quality.searchQualityNoPlaceholder')" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" :placeholder="$t('outsource.quality.searchGoodsNamePlaceholder')" clearable style="width:160px" />
            <el-select v-model="searchForm.reconcile_filter" clearable style="width:100px" :placeholder="$t('outsource.quality.searchReconcileFilterPlaceholder')">
              <el-option :label="$t('outsource.quality.optionUnreconciled')" value="unreconciled" />
            </el-select>
            <el-button type="primary" @click="tableRef?.loadData()">{{ $t('outsource.quality.btnSearch') }}</el-button>
            <el-button @click="resetSearch">{{ $t('outsource.quality.btnReset') }}</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">{{ $t('outsource.quality.btnAdd') }}</el-button>
          </template>
          <el-table-column prop="quality_no" :label="$t('outsource.quality.colQualityNo')" min-width="150" />
          <el-table-column prop="supplier_name" :label="$t('outsource.quality.colSupplier')" min-width="130" />
          <el-table-column prop="quality_date" :label="$t('outsource.quality.colQualityDate')" width="110">
            <template #default="{ row }">{{ fmtDt(row.quality_date || row.created_at) }}</template>
          </el-table-column>
          <el-table-column prop="inspector" :label="$t('outsource.quality.colInspector')" width="90" />
          <el-table-column :label="$t('outsource.quality.colPassRate')" width="90" align="center">
            <template #default="{ row }">
              <span :style="{color:qualifyRate(row)>=100?'#16a34a':qualifyRate(row)>=80?'#f59e0b':'#dc2626'}">{{ qualifyRate(row) }}%</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colStatus')" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status===1?'success':row.status===2?'danger':'info'" size="small">
                {{ row.status===1?$t('outsource.quality.statusAudited'):row.status===2?$t('outsource.quality.statusRejected'):$t('outsource.quality.statusPending') }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colActions')" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">{{ $t('outsource.quality.btnView') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="openEdit(row)">{{ $t('outsource.quality.btnEdit') }}</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="doAudit(row,1)">{{ $t('outsource.quality.btnAudit') }}</el-button>
              <el-button v-if="row.status===0" type="danger" size="small" link @click="doAudit(row,2)">{{ $t('outsource.quality.btnReject') }}</el-button>
              <el-button v-if="row.status===1 && !permStore.isSubAccount" type="warning" size="small" link @click="doAudit(row,0)">{{ $t('outsource.quality.btnUnaudit') }}</el-button>
              <el-button :type="row._reconciled ? 'success' : 'info'" link size="small" @click="toggleReconcile(row)">{{ row._reconciled ? $t('outsource.quality.btnReconciled') : $t('outsource.quality.btnReconcile') }}</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? $t('outsource.quality.titleDeleteDisabled') : ''" @click="handleDelete(row.id)">{{ $t('outsource.quality.btnDelete') }}</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">{{ $t('outsource.quality.btnBack') }}</el-button>
          <span class="form-title">{{ isView?$t('outsource.quality.formTitleView'):fd.id?$t('outsource.quality.formTitleEdit'):$t('outsource.quality.formTitleAdd') }}</span>
          <el-tag v-if="fd.status===1" type="success" size="small">{{ $t('outsource.quality.statusAudited') }}</el-tag>
          <el-tag v-else-if="fd.status===2" type="danger" size="small">{{ $t('outsource.quality.statusRejected') }}</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">{{ $t('outsource.quality.btnSave') }}</el-button>
        </div>
      </div>
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6"><div class="field-row"><span class="field-label">{{ $t('outsource.quality.fieldQualityNo') }}</span><el-input v-model="fd.quality_no" :placeholder="$t('outsource.quality.qualityNoPlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">{{ $t('outsource.quality.fieldSupplier') }}</span>
                <el-select v-model="fd.supplier_id" :placeholder="$t('outsource.quality.supplierPlaceholder')" style="flex:1" filterable :disabled="isView" @change="onSupplierChange">
                  <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label required">{{ $t('outsource.quality.fieldQualityDate') }}</span><el-date-picker v-model="fd.quality_date" type="date" value-format="YYYY-MM-DD" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label">{{ $t('outsource.quality.fieldInspector') }}</span><el-input v-model="fd.inspector" :placeholder="$t('outsource.quality.inspectorPlaceholder')" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row">
                <span class="field-label">{{ $t('outsource.quality.fieldConclusion') }}</span>
                <el-select v-model="fd.conclusion" style="flex:1" :disabled="isView">
                  <el-option :label="$t('outsource.quality.optionQualified')" value="合格" />
                  <el-option :label="$t('outsource.quality.optionPartialQualified')" value="部分合格" />
                  <el-option :label="$t('outsource.quality.optionUnqualified')" value="不合格" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="goodsSelectRef?.open()">{{ $t('outsource.quality.btnSelectGoods') }}</el-button>
          <el-button size="small" @click="addEmptyRow">{{ $t('outsource.quality.btnAddRow') }}</el-button>
        </div>

        <el-table :data="fd.items" border size="small" style="width:100%" :empty-text="$t('outsource.quality.emptyText')">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column :label="$t('outsource.quality.colGoodsName')" min-width="140">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.goods_name" size="small" /><span v-else>{{ row.goods_name }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colGoodsSn')" width="110"><template #default="{ row }">{{ row.goods_sn||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.quality.colSpec')" width="100"><template #default="{ row }">{{ row.spec||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.quality.colUnit')" width="70" align="center"><template #default="{ row }">{{ row.unit_name||'—' }}</template></el-table-column>
          <el-table-column :label="$t('outsource.quality.colInspectQty')" width="110">
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" /><span v-else>{{ row.num }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colQualifiedQty')" width="110">
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.qualified_num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" /><span v-else>{{ row.qualified_num }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colRejectQty')" width="120">
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.reject_num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" /><span v-else>{{ row.reject_num }}</span></template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colPassRateCol')" width="85" align="center">
            <template #default="{ row }">
              <span :style="{color:rowRate(row)>=100?'#16a34a':rowRate(row)>=80?'#f59e0b':'#dc2626'}">{{ rowRate(row) }}%</span>
            </template>
          </el-table-column>
          <el-table-column :label="$t('outsource.quality.colRejectReason')" min-width="120">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.reject_reason" size="small" :placeholder="$t('outsource.quality.rejectReasonPlaceholder')" /><span v-else>{{ row.reject_reason||'' }}</span></template>
          </el-table-column>
          <el-table-column v-if="!isView" label="" width="50" fixed="right">
            <template #default="{ $index }"><el-button type="danger" link size="small" :icon="Delete" @click="fd.items.splice($index,1)" /></template>
          </el-table-column>
        </el-table>

        <div class="form-footer">
          <div class="field-row" style="margin-top:8px"><span class="field-label">{{ $t('outsource.quality.fieldRemark') }}</span><el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" /></div>
        </div>
      </div>
    </div>

    <GoodsSelect ref="goodsSelectRef" @confirm="onGoodsConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { useReconcile } from '@/composables/useReconcile'
import GoodsSelect from '@/components/GoodsSelect.vue'
import { getQualityList, createQuality, deleteQuality } from '@/api/outsource'
import { getSupplierList } from '@/api/procure'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'
import { fmtDt } from '@/utils/date'

const { t } = useI18n()
const tableRef=ref<InstanceType<typeof ScTable>>()
const { toggle: toggleReconcile, createFilteredApi } = useReconcile('reconcile_outsource_quality', tableRef)
const reconcileFilteredApi = createFilteredApi(getQualityList, 'reconcile_filter')
const permStore = usePermissionStore()
const searchForm=reactive({quality_no:'',goods_name:'',reconcile_filter:''})
function resetSearch(){searchForm.quality_no='';searchForm.goods_name='';tableRef.value?.loadData()}
const showForm=ref(false),isView=ref(false),saving=ref(false)
const supplierOptions=ref<any[]>([])
async function loadSuppliers(){try{const r=await getSupplierList({list_rows:200});supplierOptions.value=r.data?.list||r.data?.data||[]}catch{}}
function onSupplierChange(id:any){const s=supplierOptions.value.find(x=>x.id===id);fd.supplier_name=s?.name??''}
function qualifyRate(row:any){const total=Number(row.num||0);if(!total)return 0;return Math.round((Number(row.qualified_num||0)/total)*100)}
function rowRate(row:any){const total=Number(row.num||0);if(!total)return 0;return Math.round((Number(row.qualified_num||0)/total)*100)}
function defaultFd(){return{id:0,status:0,quality_no:'',supplier_id:null as any,supplier_name:'',quality_date:new Date().toISOString().slice(0,10),inspector:'',conclusion:'合格',remark:'',items:[] as any[]}}
const fd=reactive(defaultFd())
async function openAdd(){Object.assign(fd,defaultFd());fd.items=[];isView.value=false;showForm.value=true;await loadSuppliers()}
async function openEdit(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=Array.isArray(row.goods_info)?row.goods_info:JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};isView.value=false;showForm.value=true;await loadSuppliers()}
async function openView(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=Array.isArray(row.goods_info)?row.goods_info:JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};isView.value=true;showForm.value=true;await loadSuppliers()}
function backToList(){showForm.value=false;tableRef.value?.refresh()}
const goodsSelectRef = ref<InstanceType<typeof GoodsSelect>>()
function onGoodsConfirm(goods: any[]) {
  goods.forEach(g=>fd.items.push({goods_id:g.id,goods_name:g.name,goods_sn:g.goods_sn||'',spec:g.spec||'',unit_name:g.unit_name||'',num:1,qualified_num:1,reject_num:0,reject_reason:''}))
}
function addEmptyRow(){fd.items.push({goods_id:0,goods_name:'',goods_sn:'',spec:'',unit_name:'',num:1,qualified_num:0,reject_num:0,reject_reason:''})}
async function handleSave(){
  if(!fd.supplier_id){ElMessage.warning(t('outsource.quality.msgSelectSupplier'));return}
  if(!fd.quality_date){ElMessage.warning(t('outsource.quality.msgSelectQualityDate'));return}
  if(!fd.items.length){ElMessage.warning(t('outsource.quality.msgAddGoods'));return}
  saving.value=true
  try{await createQuality({...fd,goods_info:JSON.stringify(fd.items)});ElMessage.success(t('outsource.quality.msgSaveSuccess'));backToList()}catch{}finally{saving.value=false}
}
async function doAudit(row:any,status:number){
  const labels:Record<number,string>={1:t('outsource.quality.btnAudit'),2:t('outsource.quality.btnReject'),0:t('outsource.quality.btnUnaudit')}
  await ElMessageBox.confirm(t('outsource.quality.msgConfirmAudit',{action:labels[status]}),t('outsource.quality.msgTip'),{type:'warning'})
  try{await http.post('/outsource/quality/audit',{id:row.id,status});ElMessage.success(t('outsource.quality.msgSuccess'));tableRef.value?.refresh()}catch{}
}
async function handleDelete(id:number){await ElMessageBox.confirm(t('outsource.quality.msgConfirmDelete'),t('outsource.quality.msgTip'),{type:'warning'});await deleteQuality(id);ElMessage.success(t('outsource.quality.msgDeleteSuccess'));tableRef.value?.refresh()}
onMounted(loadSuppliers)
</script>

<style scoped>
.outsource-quality-page{}
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
.form-footer{padding:12px 0;border-top:1px solid #f0f0f0}
</style>
