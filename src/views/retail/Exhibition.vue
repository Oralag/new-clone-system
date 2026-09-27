<template>
  <div class="exhibition-page" v-loading="loading">
    <div class="heading">
      <div><h2>展会管理</h2><p>把每场展会的零售、商品成本和费用放在一起核算。</p></div>
      <el-button type="primary" @click="openEvent()">新建展会</el-button>
    </div>
    <el-alert v-if="error" :title="error" type="error" show-icon :closable="false" />
    <div class="event-select">
      <el-select v-model="selectedId" placeholder="选择展会" filterable style="width:320px" @change="loadDetail">
        <el-option v-for="event in events" :key="event.id" :value="Number(event.id)" :label="`${event.name} · ${date(event.start_date)}`" />
      </el-select>
      <el-button :disabled="!detail.exhibition" @click="openEvent(detail.exhibition)">编辑展会</el-button>
      <el-button @click="loadAll">刷新</el-button>
    </div>
    <el-empty v-if="!events.length && !loading && !error" description="新建第一场展会，然后关联零售单、录入费用。" />
    <template v-if="detail.exhibition">
      <el-card shadow="never">
        <div class="heading">
          <div><h3>{{ detail.exhibition.name }}</h3><p>{{ date(detail.exhibition.start_date) }} 至 {{ date(detail.exhibition.end_date) }} · {{ detail.exhibition.location || '地点未填写' }} · {{ detail.exhibition.owner_name || '负责人未填写' }}</p></div>
          <div class="actions">
            <el-button type="primary" @click="newOrder">新增零售单</el-button>
            <el-button @click="openCandidates">关联已有零售单</el-button>
            <el-button @click="newExpense">录入展会费用</el-button>
          </div>
        </div>
        <el-alert v-if="returnsError || stats.missingCosts" type="warning" :closable="false" show-icon :title="[returnsError, stats.missingCosts ? `${stats.missingCosts} 项商品成本缺失，当前利润仅为暂估` : ''].filter(Boolean).join('；')" />
        <div class="metrics">
          <div><span>销售净额</span><strong>¥{{ fmt(stats.revenue) }}</strong><small>已扣退货 ¥{{ fmt(stats.refund) }}</small></div>
          <div><span>售出商品成本</span><strong>¥{{ fmt(stats.cost) }}</strong><small>按订单保存的成本计算</small></div>
          <div><span>展会费用</span><strong>¥{{ fmt(stats.expenses + stats.fees) }}</strong><small>含单据附加费用 ¥{{ fmt(stats.fees) }}</small></div>
          <div :class="stats.profit < 0 ? 'loss' : 'profit'"><span>{{ returnsError || stats.missingCosts ? '暂估' : '' }}{{ stats.profit < 0 ? '亏损' : '盈利' }}</span><strong>¥{{ fmt(Math.abs(stats.profit)) }}</strong><small>销售净额 − 商品成本 − 展会费用</small></div>
        </div>
        <p>已审核零售 {{ stats.count }} 张 · 待审核 {{ stats.draftCount }} 张 · 零售实收净额 ¥{{ fmt(stats.collected) }} · 已确认待付费用 ¥{{ fmt(stats.unpaid) }}</p>
      </el-card>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="零售单" name="orders">
          <el-table :data="detail.orders" max-height="520" border>
            <el-table-column label="单号" prop="order_sn" min-width="160" />
            <el-table-column label="日期" width="115"><template #default="{row}">{{ date(row.order_date) }}</template></el-table-column>
            <el-table-column label="销售净额" width="125"><template #default="{row}">¥{{ fmt(exhibitionSaleAmount(row)) }}</template></el-table-column>
            <el-table-column label="商品成本" width="125"><template #default="{row}">{{ exhibitionOrderCost(row).missing ? '成本待补全' : `¥${fmt(exhibitionOrderCost(row).amount)}` }}</template></el-table-column>
            <el-table-column label="附加费用" width="125"><template #default="{row}">¥{{ fmt(exhibitionOrderFees(row)) }}</template></el-table-column>
            <el-table-column label="状态" width="95"><template #default="{row}"><el-tag :type="Number(row.status) === 1 ? 'success' : 'warning'">{{ Number(row.status) === 1 ? '已审核' : '未审核' }}</el-tag></template></el-table-column>
            <el-table-column label="备注" prop="remark" min-width="150" show-overflow-tooltip />
            <el-table-column label="操作" width="155"><template #default="{row}"><el-button link type="primary" @click="viewOrder(row)">查看</el-button><el-button link @click="removeOrder(row)">移出展会</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="费用明细" name="expenses">
          <p>已确认的费用计入盈亏，付款另行登记。库存样品送出或报损时，还需在库存中办理对应出库；带回的样品不记损耗。</p>
          <el-table :data="detail.expenses" max-height="520" border>
            <el-table-column label="费用单号" prop="expense_no" min-width="170" />
            <el-table-column label="费用类别" prop="name" min-width="130" />
            <el-table-column label="日期" width="115"><template #default="{row}">{{ date(row.expense_date) }}</template></el-table-column>
            <el-table-column label="金额" width="120"><template #default="{row}">¥{{ fmt(row.amount) }}</template></el-table-column>
            <el-table-column label="付款状态" width="115"><template #default="{row}"><el-tag :type="isPaid(row) ? 'success' : 'warning'">{{ isPaid(row) ? '已付款' : '待付款' }}</el-tag></template></el-table-column>
            <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
            <el-table-column label="操作" width="170"><template #default="{row}"><el-button v-if="!isPaid(row)" link type="primary" @click="openPayment(row)">登记付款</el-button><el-button v-if="Number(row.exhibition_payment_id)" link type="warning" @click="undoPayment(row)">撤销付款</el-button><el-button link @click="viewExpense(row)">查看</el-button></template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="费用分类" name="categories">
          <el-table :data="[...stats.categories, {name:'零售单附加费用', amount:stats.fees}]" max-height="480" border>
            <el-table-column label="费用类别" prop="name" /><el-table-column label="金额"><template #default="{row}">¥{{ fmt(row.amount) }}</template></el-table-column>
          </el-table>
        </el-tab-pane>
        <el-tab-pane label="关联退货" name="returns">
          <el-table :data="stats.returns" max-height="480" border><el-table-column label="退货单号" prop="return_no" /><el-table-column label="原零售单" prop="order_no" /><el-table-column label="退款金额"><template #default="{row}">¥{{ fmt(row.amount ?? row.total_amount) }}</template></el-table-column></el-table>
        </el-tab-pane>
      </el-tabs>
    </template>
    <el-dialog v-model="eventVisible" :title="eventForm.id ? '编辑展会' : '新建展会'" width="520px">
      <el-form ref="eventFormRef" :model="eventForm" :rules="rules" label-width="85px">
        <el-form-item label="展会名称" prop="name"><el-input v-model="eventForm.name" maxlength="120" /></el-form-item>
        <el-form-item label="开始日期" prop="start_date"><el-date-picker v-model="eventForm.start_date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="结束日期" prop="end_date"><el-date-picker v-model="eventForm.end_date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="地点"><el-input v-model="eventForm.location" maxlength="200" /></el-form-item>
        <el-form-item label="负责人"><el-input v-model="eventForm.owner_name" maxlength="100" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="eventForm.remark" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="eventVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitEvent">保存</el-button></template>
    </el-dialog>
    <el-dialog v-model="candidatesVisible" title="关联已有零售单" width="900px">
      <div class="actions"><el-date-picker v-model="candidateDates" type="daterange" value-format="YYYY-MM-DD" /><el-button :loading="candidatesLoading" @click="loadCandidates">读取零售单</el-button></div>
      <p>核对后勾选本次展会的单据。已属于其他展会的单据不能在这里重复归入。</p>
      <el-table ref="candidateTable" :data="candidates" max-height="420" row-key="id" border @selection-change="candidateSelection=$event">
        <el-table-column type="selection" :selectable="(row:any) => !Number(row.exhibition_id)" />
        <el-table-column label="单号" prop="order_sn" min-width="170" />
        <el-table-column label="日期" width="115"><template #default="{row}">{{ date(row.order_date) }}</template></el-table-column>
        <el-table-column label="销售净额" width="120"><template #default="{row}">¥{{ fmt(exhibitionSaleAmount(row)) }}</template></el-table-column>
        <el-table-column label="当前归属" min-width="145"><template #default="{row}">{{ eventName(row.exhibition_id) }}</template></el-table-column>
        <el-table-column label="备注" prop="remark" min-width="160" show-overflow-tooltip />
      </el-table>
      <template #footer><span>已选 {{ candidateSelection.length }} 张，销售净额 ¥{{ fmt(candidateSelection.reduce((sum,row)=>sum+exhibitionSaleAmount(row),0)) }}</span><el-button @click="candidatesVisible=false">取消</el-button><el-button type="primary" :loading="saving" :disabled="!candidateSelection.length" @click="submitCandidates">归入当前展会</el-button></template>
    </el-dialog>
    <el-dialog v-model="paymentVisible" title="登记展会费用付款" width="460px">
      <el-form label-width="90px"><el-form-item label="费用金额">¥{{ fmt(paymentExpense?.amount) }}</el-form-item><el-form-item label="付款账户"><el-select v-model="payment.fund_id" filterable><el-option v-for="fund in funds" :key="fund.id" :value="Number(fund.id)" :label="fund.name" /></el-select></el-form-item><el-form-item label="付款日期"><el-date-picker v-model="payment.pay_date" value-format="YYYY-MM-DD" /></el-form-item></el-form>
      <p>确认后生成付款单，并扣减所选资金账户余额。</p>
      <template #footer><el-button @click="paymentVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitPayment">确认登记付款</el-button></template>
    </el-dialog>
    <el-dialog v-model="expenseVisible" title="录入展会费用" width="520px">
      <el-form label-width="90px">
        <el-form-item label="所属展会"><el-input :model-value="detail.exhibition?.name || ''" disabled /></el-form-item>
        <el-form-item label="费用类别"><el-input v-model="expenseForm.name" placeholder="人工、车费、摊位费、样品等" maxlength="200" /></el-form-item>
        <el-form-item label="金额"><el-input-number v-model="expenseForm.amount" :min="0.01" :precision="2" style="width:100%" /></el-form-item>
        <el-form-item label="费用日期"><el-date-picker v-model="expenseForm.expense_date" value-format="YYYY-MM-DD" style="width:100%" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="expenseForm.remark" type="textarea" maxlength="500" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="expenseVisible=false">取消</el-button><el-button type="primary" :loading="saving" @click="submitExpense">保存费用</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onActivated } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getExhibitions, saveExhibition, getExhibitionDetail, getExhibitionCandidates, assignExhibition, payExhibitionExpense, undoExhibitionExpensePayment } from '@/api/retail/exhibition'
import { getRetailReturnList } from '@/api/retail'
import { getFundList, createExpense } from '@/api/finance'
import { calculateExhibitionFinance, exhibitionSaleAmount, exhibitionOrderCost, exhibitionOrderFees } from '@/utils/exhibitionFinance'

const router = useRouter(), route = useRoute()
const date = (value:any) => String(value || '').slice(0,10)
const fmt = (value:any) => Number(value || 0).toLocaleString('zh-CN',{minimumFractionDigits:2,maximumFractionDigits:2})
const today = () => new Date(Date.now()+8*3600000).toISOString().slice(0,10)
const events = ref<any[]>([]), selectedId = ref(Number(route.query.id) || undefined)
const detail = ref<any>({orders:[],expenses:[]}), returns = ref<any[]>([])
const loading = ref(false), saving = ref(false), error = ref(''), returnsError = ref(''), activeTab = ref('orders')
const stats = computed(()=>calculateExhibitionFinance(detail.value.orders, detail.value.expenses, returns.value))
const eventVisible = ref(false), eventFormRef = ref(), eventForm = reactive<any>({})
const rules = {name:[{required:true,message:'请填写展会名称',trigger:'blur'}],start_date:[{required:true,message:'请选择开始日期',trigger:'change'}],end_date:[{required:true,message:'请选择结束日期',trigger:'change'}]}
const candidatesVisible=ref(false),candidatesLoading=ref(false),candidateDates=ref<string[]>([]),candidates=ref<any[]>([]),candidateSelection=ref<any[]>([]),candidateTable=ref()
const paymentVisible=ref(false),paymentExpense=ref<any>(),funds=ref<any[]>([]),payment=reactive({fund_id:undefined as number|undefined,pay_date:today()})
const expenseVisible=ref(false),expenseForm=reactive({name:'',amount:0,expense_date:today(),remark:''})
const eventName=(id:any)=>Number(id) ? events.value.find(e=>Number(e.id)===Number(id))?.name || '其他展会' : '日常零售'
const isPaid=(row:any)=>Number(row.exhibition_payment_id)>0 || /【已付款】|\[已付款\]/.test(row.remark||'')
async function loadAll(){
  loading.value=true;error.value=''
  try{events.value=(await getExhibitions()).data?.rows||[];if(!events.value.some(e=>Number(e.id)===selectedId.value))selectedId.value=events.value[0]?.id;await loadDetail()}
  catch(e:any){error.value=e?.message||'读取展会失败，请重试'}finally{loading.value=false}
}
let requestVersion=0
async function loadDetail(){
  if(!selectedId.value)return
  const version=++requestVersion;loading.value=true;error.value='';returnsError.value=''
  try{
    const response=await getExhibitionDetail(selectedId.value)
    if(version!==requestVersion)return
    detail.value=response.data
    returns.value=[]
    try{
      const all:any[]=[]
      for(let page=1;page<=1000;page++){
        const r=await getRetailReturnList({page,list_rows:200});const rows=r.data?.rows||r.data?.list||[];all.push(...rows)
        if(rows.length<200 || (r.data?.total!=null && all.length>=Number(r.data.total)))break
        if(page===1000)throw Error('退货记录过多')
      }
      if(version===requestVersion)returns.value=all
    }catch{if(version===requestVersion)returnsError.value='退货记录读取失败，暂未扣除退货，请重试核对'}
  }catch(e:any){if(version===requestVersion){detail.value={orders:[],expenses:[]};error.value=e?.message||'读取展会失败'}}
  finally{if(version===requestVersion)loading.value=false}
}
function openEvent(row?:any){Object.assign(eventForm,{id:null,name:'',start_date:today(),end_date:today(),location:'',owner_name:'',remark:''},row||{});eventForm.start_date=date(eventForm.start_date);eventForm.end_date=date(eventForm.end_date);eventVisible.value=true}
async function submitEvent(){if(!await eventFormRef.value.validate().catch(()=>false))return;if(eventForm.end_date<eventForm.start_date){ElMessage.warning('结束日期不能早于开始日期');return}saving.value=true;try{const r=await saveExhibition(eventForm);selectedId.value=Number(r.data.id);eventVisible.value=false;await loadAll();ElMessage.success('展会已保存')}finally{saving.value=false}}
function newOrder(){router.push({path:'/retail/order',query:{exhibition_id:selectedId.value,create:'1'}})}
function viewOrder(row:any){router.push({path:'/retail/order',query:{exhibition_id:selectedId.value,order_no:row.order_sn}})}
function newExpense(){Object.assign(expenseForm,{name:'',amount:0,expense_date:today(),remark:''});expenseVisible.value=true}
async function submitExpense(){
  if(!expenseForm.name.trim()||Number(expenseForm.amount)<=0||!expenseForm.expense_date){ElMessage.warning('请填写费用类别、金额和日期');return}
  saving.value=true
  try{await createExpense({...expenseForm,exhibition_id:Number(selectedId.value)});expenseVisible.value=false;await loadDetail();ElMessage.success('展会费用已保存')}finally{saving.value=false}
}
function viewExpense(row:any){router.push({path:'/finance/expense',query:{exhibition_id:selectedId.value,expense_no:row.expense_no}})}
async function openCandidates(){candidateDates.value=[date(detail.value.exhibition.start_date),date(detail.value.exhibition.end_date)];candidatesVisible.value=true;await loadCandidates()}
async function loadCandidates(){if(candidateDates.value?.length!==2)return;candidatesLoading.value=true;candidates.value=[];candidateSelection.value=[];try{candidates.value=(await getExhibitionCandidates(...candidateDates.value as [string,string])).data?.rows||[]}finally{candidatesLoading.value=false}}
async function submitCandidates(){saving.value=true;try{await assignExhibition(selectedId.value!,candidateSelection.value);candidatesVisible.value=false;await loadDetail();ElMessage.success('已归入展会，原单据及库存保持原样')}finally{saving.value=false}}
async function removeOrder(row:any){try{await ElMessageBox.confirm('将此单恢复为日常零售？销售、库存和收款不会改变。','移出展会')}catch{return}await assignExhibition(0,[row]);await loadDetail()}
async function openPayment(row:any){funds.value=(await getFundList({list_rows:1000})).data?.rows||[];paymentExpense.value=row;payment.fund_id=undefined;payment.pay_date=today();paymentVisible.value=true}
async function submitPayment(){if(!payment.fund_id||!payment.pay_date){ElMessage.warning('请选择账户和付款日期');return}saving.value=true;try{await payExhibitionExpense({id:paymentExpense.value.id,...payment});paymentVisible.value=false;await loadDetail();ElMessage.success('付款已登记')}finally{saving.value=false}}
async function undoPayment(row:any){try{await ElMessageBox.confirm('撤销关联付款单并恢复资金账户余额，费用仍保留在展会中。','撤销付款')}catch{return}await undoExhibitionExpensePayment(row.id);await loadDetail()}
let mounted=false
onMounted(async()=>{await loadAll();mounted=true})
onActivated(()=>{if(mounted)loadAll()})
</script>

<style scoped>
.exhibition-page{display:flex;flex-direction:column;gap:18px}.heading{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}h2,h3{margin:0}p{color:var(--el-text-color-secondary);font-size:13px;line-height:1.7;margin:8px 0}.actions,.event-select{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px;margin-top:24px}.metrics>div{padding:18px;background:var(--el-fill-color-light);border-radius:8px;display:flex;flex-direction:column;gap:10px}.metrics span,.metrics small{color:var(--el-text-color-secondary)}.metrics strong{font-size:25px;font-variant-numeric:tabular-nums}.metrics .profit strong{color:var(--el-color-success)}.metrics .loss strong{color:var(--el-color-danger)}@media(max-width:900px){.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:480px){.metrics{grid-template-columns:1fr}}
</style>
