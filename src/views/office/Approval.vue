<template>
  <div class="page-container">
    <el-card>
      <el-form :model="searchForm" inline>
        <el-form-item label="标题">
          <el-input v-model="searchForm.title" placeholder="请输入标题" clearable style="width:180px" />
        </el-form-item>
        <el-form-item label="状态">
          <el-input v-model="searchForm.status" placeholder="请输入状态" clearable style="width:180px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="scTable.loadData()">查询</el-button>
          <el-button @click="onReset">重置</el-button>
        </el-form-item>
      </el-form>
      <ScTable ref="scTable" :api-obj="getApprovalList"
          del-path="/office/approval/batchDel"
          export-file-name="审批记录" :params="searchForm">
        <el-table-column label="标题" prop="title" />
        <el-table-column label="申请人" prop="applicant_name" />
        <el-table-column label="类型" prop="type_name" />
        <el-table-column label="状态" prop="status_tag" />
        <el-table-column label="申请时间" prop="apply_time" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getApprovalList } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({ title: '', status: '' })

function onReset() {
  searchForm.title = ''
  searchForm.status = ''
  scTable.value.loadData()
}
</script>

<style scoped>
.page-container {}
</style>
