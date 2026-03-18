<template>
  <div class="outsource-quality-page">
    <div v-if="!showForm">
      <el-card>
        <ScTable ref="tableRef" :api-obj="getQualityList" del-path="/outsource/quality/batchDel" export-file-name="委外质检" :params="searchForm">
          <template #search>
            <el-input v-model="searchForm.quality_no" placeholder="质检编号" clearable style="width:160px" />
            <el-input v-model="searchForm.goods_name" placeholder="商品名称" clearable style="width:160px" />
            <el-button type="primary" @click="tableRef?.loadData()">查询</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </template>
          <template #toolbar>
            <el-button type="primary" :icon="Plus" @click="openAdd">新增质检</el-button>
          </template>
          <el-table-column prop="quality_no" label="质检编号" min-width="150" />
          <el-table-column prop="supplier_name" label="供应商" min-width="130" />
          <el-table-column prop="quality_date" label="质检日期" width="110">
            <template #default="{ row }">{{ (row.quality_date||row.created_at||'').slice(0,10) }}</template>
          </el-table-column>
          <el-table-column prop="inspector" label="质检人" width="90" />
          <el-table-column label="合格率" width="90" align="center">
            <template #default="{ row }">
              <span :style="{color:qualifyRate(row)>=100?'#16a34a':qualifyRate(row)>=80?'#f59e0b':'#dc2626'}">{{ qualifyRate(row) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="90" align="center">
            <template #default="{ row }">
              <el-tag :type="row.status===1?'success':row.status===2?'danger':'info'" size="small">
                {{ row.status===1?'已审核':row.status===2?'已驳回':'待审核' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button type="success" size="small" link @click="openView(row)">查看</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="openEdit(row)">编辑</el-button>
              <el-button v-if="row.status===0" type="primary" size="small" link @click="doAudit(row,1)">审核</el-button>
              <el-button v-if="row.status===0" type="danger" size="small" link @click="doAudit(row,2)">驳回</el-button>
              <el-button v-if="row.status===1 && !permStore.isSubAccount" type="warning" size="small" link @click="doAudit(row,0)">反审核</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </ScTable>
      </el-card>
    </div>

    <div v-else class="form-page">
      <div class="form-topbar">
        <div class="form-topbar-left">
          <el-button :icon="ArrowLeft" @click="backToList">返回</el-button>
          <span class="form-title">{{ isView?'查看质检单':fd.id?'编辑质检单':'新增质检单' }}</span>
          <el-tag v-if="fd.status===1" type="success" size="small">已审核</el-tag>
          <el-tag v-else-if="fd.status===2" type="danger" size="small">已驳回</el-tag>
        </div>
        <div class="form-topbar-right" v-if="!isView">
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
        </div>
      </div>
      <div class="form-body">
        <div class="form-section">
          <el-row :gutter="16">
            <el-col :span="6"><div class="field-row"><span class="field-label">质检编号</span><el-input v-model="fd.quality_no" placeholder="不填自动生成" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6">
              <div class="field-row">
                <span class="field-label required">供应商</span>
                <el-select v-model="fd.supplier_id" placeholder="选择供应商" style="flex:1" filterable :disabled="isView" @change="onSupplierChange">
                  <el-option v-for="s in supplierOptions" :key="s.id" :label="s.name" :value="s.id" />
                </el-select>
              </div>
            </el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label required">质检日期</span><el-date-picker v-model="fd.quality_date" type="date" value-format="YYYY-MM-DD" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6"><div class="field-row"><span class="field-label">质检人</span><el-input v-model="fd.inspector" placeholder="质检人" style="flex:1" :disabled="isView" /></div></el-col>
            <el-col :span="6" style="margin-top:8px">
              <div class="field-row">
                <span class="field-label">质检结论</span>
                <el-select v-model="fd.conclusion" style="flex:1" :disabled="isView">
                  <el-option label="合格" value="合格" />
                  <el-option label="部分合格" value="部分合格" />
                  <el-option label="不合格" value="不合格" />
                </el-select>
              </div>
            </el-col>
          </el-row>
        </div>

        <div class="goods-toolbar" v-if="!isView">
          <el-button type="primary" size="small" :icon="Plus" @click="openGoodsPicker">选择商品</el-button>
          <el-button size="small" @click="addEmptyRow">手动添加行</el-button>
        </div>

        <el-table :data="fd.items" border size="small" style="width:100%" empty-text="请添加质检商品">
          <el-table-column type="index" label="#" width="45" align="center" />
          <el-table-column label="商品名称" min-width="140">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.goods_name" size="small" /><span v-else>{{ row.goods_name }}</span></template>
          </el-table-column>
          <el-table-column label="商品编码" width="110"><template #default="{ row }">{{ row.goods_sn||'—' }}</template></el-table-column>
          <el-table-column label="规格" width="100"><template #default="{ row }">{{ row.spec||'—' }}</template></el-table-column>
          <el-table-column label="单位" width="70" align="center"><template #default="{ row }">{{ row.unit_name||'—' }}</template></el-table-column>
          <el-table-column label="送检数量" width="110">
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" /><span v-else>{{ row.num }}</span></template>
          </el-table-column>
          <el-table-column label="合格数量" width="110">
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.qualified_num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" /><span v-else>{{ row.qualified_num }}</span></template>
          </el-table-column>
          <el-table-column label="不合格数量" width="120">
            <template #default="{ row }"><el-input-number v-if="!isView" v-model="row.reject_num" :min="0" :precision="2" controls-position="right" size="small" style="width:100%" /><span v-else>{{ row.reject_num }}</span></template>
          </el-table-column>
          <el-table-column label="合格率" width="85" align="center">
            <template #default="{ row }">
              <span :style="{color:rowRate(row)>=100?'#16a34a':rowRate(row)>=80?'#f59e0b':'#dc2626'}">{{ rowRate(row) }}%</span>
            </template>
          </el-table-column>
          <el-table-column label="不合格原因" min-width="120">
            <template #default="{ row }"><el-input v-if="!isView" v-model="row.reject_reason" size="small" placeholder="原因" /><span v-else>{{ row.reject_reason||'' }}</span></template>
          </el-table-column>
          <el-table-column v-if="!isView" label="" width="50" fixed="right">
            <template #default="{ $index }"><el-button type="danger" link size="small" :icon="Delete" @click="fd.items.splice($index,1)" /></template>
          </el-table-column>
        </el-table>

        <div class="form-footer">
          <div class="field-row" style="margin-top:8px"><span class="field-label">备注</span><el-input v-model="fd.remark" type="textarea" :rows="2" :disabled="isView" style="flex:1" /></div>
        </div>
      </div>
    </div>

    <el-dialog v-model="goodsPickerVisible" title="选择商品" width="760px" append-to-body>
      <el-input v-model="goodsSearch" placeholder="搜索名称/编码" clearable style="width:220px;margin-bottom:10px" @input="filterGoods" />
      <el-table :data="filteredGoods" border size="small" height="380" @selection-change="pickerSel=$event">
        <el-table-column type="selection" width="40" />
        <el-table-column prop="name" label="商品名称" min-width="140" />
        <el-table-column prop="goods_sn" label="编码" width="110" />
        <el-table-column prop="spec" label="规格" width="100" />
        <el-table-column prop="unit_name" label="单位" width="70" align="center" />
      </el-table>
      <template #footer>
        <el-button @click="goodsPickerVisible=false">取消</el-button>
        <el-button type="primary" @click="confirmGoods">确认（{{ pickerSel.length }}）</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { Plus, ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ScTable from '@/components/ScTable.vue'
import { getQualityList, createQuality, deleteQuality } from '@/api/outsource'
import { getSupplierList } from '@/api/procure'
import { getGoodsList } from '@/api/goods'
import { fuzzyFilterGoods } from '@/utils/fuzzyMatch'
import http from '@/api/http'
import { usePermissionStore } from '@/stores/permission'

const tableRef=ref<InstanceType<typeof ScTable>>()
const permStore = usePermissionStore()
const searchForm=reactive({quality_no:'',goods_name:''})
function resetSearch(){searchForm.quality_no='';searchForm.goods_name='';tableRef.value?.loadData()}
const showForm=ref(false),isView=ref(false),saving=ref(false)
const supplierOptions=ref<any[]>([])
async function loadSuppliers(){try{const r=await getSupplierList({list_rows:200});supplierOptions.value=r.data?.list||r.data?.data||[]}catch{}}
function onSupplierChange(id:any){const s=supplierOptions.value.find(x=>x.id===id);fd.supplier_name=s?.name??''}
function qualifyRate(row:any){const t=Number(row.num||0);if(!t)return 0;return Math.round((Number(row.qualified_num||0)/t)*100)}
function rowRate(row:any){const t=Number(row.num||0);if(!t)return 0;return Math.round((Number(row.qualified_num||0)/t)*100)}
function defaultFd(){return{id:0,status:0,quality_no:'',supplier_id:null as any,supplier_name:'',quality_date:new Date().toISOString().slice(0,10),inspector:'',conclusion:'合格',remark:'',items:[] as any[]}}
const fd=reactive(defaultFd())
async function openAdd(){Object.assign(fd,defaultFd());fd.items=[];isView.value=false;showForm.value=true;await loadSuppliers()}
async function openEdit(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};isView.value=false;showForm.value=true;await loadSuppliers()}
async function openView(row:any){Object.assign(fd,{...defaultFd(),...row});try{fd.items=JSON.parse(row.goods_info||'[]')}catch{fd.items=[]};isView.value=true;showForm.value=true;await loadSuppliers()}
function backToList(){showForm.value=false;tableRef.value?.refresh()}
const goodsPickerVisible=ref(false),goodsSearch=ref(''),allGoods=ref<any[]>([]),filteredGoods=ref<any[]>([]),pickerSel=ref<any[]>([])
async function openGoodsPicker(){try{const r=await getGoodsList({list_rows:500});allGoods.value=r.data?.rows||r.data?.list||r.data?.data||[]}catch{};goodsSearch.value='';filteredGoods.value=[...allGoods.value];pickerSel.value=[];goodsPickerVisible.value=true}
function filterGoods(){filteredGoods.value=fuzzyFilterGoods(allGoods.value,goodsSearch.value.trim())}
function confirmGoods(){pickerSel.value.forEach(g=>fd.items.push({goods_id:g.id,goods_name:g.name,goods_sn:g.goods_sn||'',spec:g.spec||'',unit_name:g.unit_name||'',num:1,qualified_num:1,reject_num:0,reject_reason:''}));goodsPickerVisible.value=false}
function addEmptyRow(){fd.items.push({goods_id:0,goods_name:'',goods_sn:'',spec:'',unit_name:'',num:1,qualified_num:0,reject_num:0,reject_reason:''})}
async function handleSave(){
  if(!fd.supplier_id){ElMessage.warning('请选择供应商');return}
  if(!fd.quality_date){ElMessage.warning('请选择质检日期');return}
  if(!fd.items.length){ElMessage.warning('请添加质检商品');return}
  saving.value=true
  try{await createQuality({...fd,goods_info:JSON.stringify(fd.items)});ElMessage.success('保存成功');backToList()}catch{}finally{saving.value=false}
}
async function doAudit(row:any,status:number){const labels:Record<number,string>={1:'审核',2:'驳回',0:'反审核'};await ElMessageBox.confirm(`确定${labels[status]}该质检单？`,'提示',{type:'warning'});try{await http.post('/outsource/quality/audit',{id:row.id,status});ElMessage.success('操作成功');tableRef.value?.refresh()}catch{}}
async function handleDelete(id:number){await ElMessageBox.confirm('确定删除？','提示',{type:'warning'});await deleteQuality(id);ElMessage.success('删除成功');tableRef.value?.refresh()}
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
