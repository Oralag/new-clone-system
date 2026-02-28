<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="scTable" :api-obj="getCloudList" :params="searchForm">
        <el-table-column label="名称" prop="name" />
        <el-table-column label="类型" prop="type_name" />
        <el-table-column label="大小" prop="size" />
        <el-table-column label="上传人" prop="uploader_name" />
      </ScTable>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'

import { getCloudList } from '@/api/office'

const scTable = ref()
const searchForm = reactive<any>({})
</script>

<style scoped>
.page-container {}
</style>
