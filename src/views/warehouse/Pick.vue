<template>
  <div class="page-container">
    <el-card>
      <ScTable ref="tableRef" :api-obj="getPickList"
          del-path="/stock/Pick/batchDel"
          export-file-name="拣货单" :params="searchForm">
        <template #search>
          <el-input v-model="searchForm.pick_no" placeholder="拣货单编号" clearable style="width: 180px" />
        </template>
        <template #toolbar>
          <el-button type="primary" :icon="Plus" @click="openForm()">新增</el-button>
        </template>

        <el-table-column prop="pick_no" label="拣货单编号" width="160" />
        <el-table-column prop="goods_name" label="商品名称" min-width="150" />
        <el-table-column prop="num" label="数量" width="100" />
        <el-table-column prop="warehouse_name" label="仓库名称" width="150" />
        <el-table-column prop="status_name" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : row.status === 0 ? 'info' : 'warning'" size="small">
              {{ row.status_name || '-' }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="success" size="small" link @click="formRef?.openView(row)">查看</el-button>
              <el-button type="danger" size="small" link :disabled="row.status === 1" :title="row.status === 1 ? '请先反审核再删除' : ''" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <ScForm ref="formRef" title="新增拣货单" @submit="handleSubmit">
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
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
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
import { getPickList, createPick, deletePick } from '@/api/warehouse'

const tableRef = ref()
const formRef = ref()

const searchForm = reactive({
  pick_no: ''
})

const openForm = () => {
  formRef.value.open()
}

const handleSubmit = async (form: any, done: () => void) => {
  try {
    await createPick(form)
    ElMessage.success('操作成功')
    done()
    tableRef.value.refresh()
  } catch {
    //
  }
}

const handleDelete = async (id: number) => {
  await ElMessageBox.confirm('确定要删除该拣货单吗？', '提示', { type: 'warning' })
  await deletePick(id)
  ElMessage.success('删除成功')
  tableRef.value.refresh()
}
</script>
