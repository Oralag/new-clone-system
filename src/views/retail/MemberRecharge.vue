<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item :label="$t('retail.memberRecharge.memberName')">
          <el-input v-model="searchForm.member_name" :placeholder="$t('retail.memberRecharge.memberNamePlaceholder')" clearable style="width:180px" />
        </el-form-item>
        <el-form-item :label="$t('retail.memberRecharge.date')">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            :range-separator="$t('retail.memberRecharge.dateSeparator')"
            :start-placeholder="$t('retail.memberRecharge.dateStart')"
            :end-placeholder="$t('retail.memberRecharge.dateEnd')"
            value-format="YYYY-MM-DD"
            style="width:240px"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">{{ $t('retail.memberRecharge.search') }}</el-button>
          <el-button @click="onReset">{{ $t('retail.memberRecharge.reset') }}</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getRechargeList"
          del-path="/retail/recharge/batchDel"
          :export-file-name="$t('retail.memberRecharge.exportFileName')" :params="searchForm">
        <el-table-column :label="$t('retail.memberRecharge.rechargeNo')" prop="recharge_no" />
        <el-table-column :label="$t('retail.memberRecharge.memberName')" prop="member_name" />
        <el-table-column :label="$t('retail.memberRecharge.amount')" prop="amount" />
        <el-table-column :label="$t('retail.memberRecharge.giftAmount')" prop="gift_amount" />
        <el-table-column :label="$t('retail.memberRecharge.payType')" prop="pay_type_name" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getRechargeList } from '@/api/retail'

const scTable = ref()
const dateRange = ref<[string, string] | null>(null)
const searchForm = reactive<any>({ member_name: '' })

function onDateChange(val: [string, string] | null) {
  if (val) {
    searchForm.start_date = val[0]
    searchForm.end_date = val[1]
  } else {
    delete searchForm.start_date
    delete searchForm.end_date
  }
}

function onReset() {
  searchForm.member_name = ''
  dateRange.value = null
  delete searchForm.start_date
  delete searchForm.end_date
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
