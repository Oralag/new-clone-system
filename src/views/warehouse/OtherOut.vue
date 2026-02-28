<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getOtherOutList" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.out_no" placeholder="出库单编号" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>

        <el-table-column prop="out_no" label="出库单编号" width="160" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
        <el-table-column prop="reason" label="出库原因" min-width="160" show-overflow-tooltip />

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
              <el-button type="danger" size="small" link @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" title="新增其他出库" @submit="handleSubmit">
      <template #default="{ form }">
        <el-form-item label="商品名称" prop="goods_name" :rules="[{ required: true, message: '请输入商品名称' }]">
          <el-input v-model="form.goods_name" placeholder="请输入商品名称" />
        </el-form-item>
        <el-form-item label="数量" prop="num" :rules="[{ required: true, message: '请输入数量' }]">
          <el-input-number v-model="form.num" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="仓库名称" prop="warehouse_name">
          <el-input v-model="form.warehouse_name" placeholder="请输入仓库名称" />
        </el-form-item>
        <el-form-item label="出库原因" prop="reason">
          <el-input v-model="form.reason" type="textarea" placeholder="请输入出库原因" />
        </el-form-item>
      </template>
    </ScForm>
  </div>
</template>

<script setup lang="ts">
import ScTable from '@/components/ScTable.vue'
import ScForm from '@/components/ScForm.vue'

import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getOtherOutList, createOtherOut, deleteOtherOut } from '@/api/warehouse'

const tableRef = ref()
const formRef = ref()

const searchForm = reactive({
  out_no: ''
})

const openForm = () => {
  formRef.value.open()
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    await createOtherOut(form)
    ElMessage.success('操作成功')
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该出库单吗？', '提示', { type: 'warning' })
  await deleteOtherOut(id)
  ElMessage.success('删除成功')
  tableRef.value.refresh()
}
</script>
