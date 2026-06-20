<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getPointsList"
          del-path="/retail/points/batchDel"
          :export-file-name="$t('retail.pointsRecord.exportFileName')" :params="searchForm">
        <el-table-column :label="$t('retail.pointsRecord.memberName')" prop="member_name" />
        <el-table-column :label="$t('retail.pointsRecord.type')" prop="type_name" />
        <el-table-column :label="$t('retail.pointsRecord.points')" prop="points" />
        <el-table-column :label="$t('retail.pointsRecord.balance')" prop="balance" />
        <el-table-column :label="$t('retail.pointsRecord.remark')" prop="remark" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getPointsList } from '@/api/retail'

const scTable = ref()
const searchForm = reactive<any>({})
</script>

<style scoped>
.page-container {}
</style>
