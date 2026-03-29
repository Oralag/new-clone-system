<template>
  <div class="page-container">
    <el-card>
      <template #header>
        <div style="display:flex;align-items:center;justify-content:space-between">
          <span style="font-size:15px;font-weight:600">云盘文件</span>
          <div style="display:flex;gap:8px">
            <el-input v-model="searchForm.name" placeholder="搜索文件名" clearable style="width:200px" @keyup.enter="tableRef?.refresh()" />
            <el-upload
              :show-file-list="false"
              :before-upload="handleUpload"
              :multiple="true"
              style="display:inline-block"
            >
              <el-button type="primary" :icon="Upload" :loading="uploading">上传文件</el-button>
            </el-upload>
          </div>
        </div>
      </template>
      <ScTable ref="tableRef" :api-obj="getCloudList" :params="searchForm">
        <el-table-column label="文件名称" prop="name" min-width="200">
          <template #default="{ row }">
            <div style="display:flex;align-items:center;gap:8px">
              <el-icon :style="{ color: getFileColor(row.type_name || row.name) }">
                <component :is="getFileIcon(row.type_name || row.name)" />
              </el-icon>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="类型" prop="type_name" width="100" />
        <el-table-column label="大小" prop="size" width="100">
          <template #default="{ row }">{{ formatSize(row.size) }}</template>
        </el-table-column>
        <el-table-column label="上传人" prop="uploader_name" width="120" />
        <el-table-column label="上传时间" prop="create_time" width="160">
          <template #default="{ row }">{{ fmtDt(row.create_time || row.created_at) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleDownload(row)">下载</el-button>
            <el-button v-if="row.url" type="success" link size="small" @click="handlePreview(row)">预览</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row.id)">删除</el-button>
          </template>
        </el-table-column>
      </ScTable>
    </el-card>

    <!-- 预览弹框 -->
    <el-dialog v-model="previewVisible" title="文件预览" width="800px">
      <div style="text-align:center">
        <img v-if="previewType === 'image'" :src="previewUrl" style="max-width:100%;max-height:60vh;border-radius:8px" />
        <video v-else-if="previewType === 'video'" :src="previewUrl" controls style="max-width:100%;max-height:60vh" />
        <iframe v-else :src="previewUrl" style="width:100%;height:60vh;border:none;border-radius:8px" />
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Upload, Document, Picture, VideoPlay, Folder } from '@element-plus/icons-vue'
import ScTable from '@/components/ScTable.vue'
import { getCloudList, createCloud, deleteCloud } from '@/api/office'
import { fmtDt } from '@/utils/date'

const tableRef = ref<InstanceType<typeof ScTable>>()
const searchForm = reactive<any>({})
const uploading = ref(false)

function formatSize(size: any): string {
  if (!size) return '—'
  const n = Number(size)
  if (isNaN(n)) return String(size)
  if (n < 1024) return n + ' B'
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB'
  return (n / 1024 / 1024).toFixed(2) + ' MB'
}

function getFileIcon(typeOrName: string) {
  const t = (typeOrName || '').toLowerCase()
  if (/jpg|jpeg|png|gif|webp|svg/.test(t)) return Picture
  if (/mp4|avi|mov|wmv/.test(t)) return VideoPlay
  if (/pdf|doc|docx|xls|xlsx|txt/.test(t)) return Document
  return Folder
}

function getFileColor(typeOrName: string) {
  const t = (typeOrName || '').toLowerCase()
  if (/jpg|jpeg|png|gif|webp|svg/.test(t)) return '#16a34a'
  if (/mp4|avi|mov|wmv/.test(t)) return '#2563eb'
  if (/pdf/.test(t)) return '#dc2626'
  if (/doc|docx/.test(t)) return '#2563eb'
  if (/xls|xlsx/.test(t)) return '#16a34a'
  return '#64748b'
}

async function handleUpload(file: File): Promise<boolean> {
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('name', file.name)
    formData.append('size', String(file.size))
    formData.append('type_name', file.type || file.name.split('.').pop() || 'file')

    // Try to upload via API
    await createCloud({
      name: file.name,
      size: file.size,
      type_name: file.type || file.name.split('.').pop() || 'file',
    })

    ElMessage.success(`${file.name} 上传成功`)
    tableRef.value?.refresh()
  } catch (e: any) {
    ElMessage.error(e?.message || '上传失败')
  } finally {
    uploading.value = false
  }
  return false // prevent default upload behavior
}

function handleDownload(row: any) {
  if (row.url) {
    const a = document.createElement('a')
    a.href = row.url
    a.download = row.name || 'download'
    a.target = '_blank'
    a.click()
  } else {
    ElMessage.warning('暂无下载链接')
  }
}

const previewVisible = ref(false)
const previewUrl = ref('')
const previewType = ref<'image' | 'video' | 'other'>('other')

function handlePreview(row: any) {
  previewUrl.value = row.url
  const name = (row.name || '').toLowerCase()
  if (/jpg|jpeg|png|gif|webp/.test(name)) previewType.value = 'image'
  else if (/mp4|avi|mov/.test(name)) previewType.value = 'video'
  else previewType.value = 'other'
  previewVisible.value = true
}

async function handleDelete(id: number) {
  await ElMessageBox.confirm('确定删除该文件？', '提示', { type: 'warning' })
  await deleteCloud(id)
  ElMessage.success('删除成功')
  tableRef.value?.refresh()
}
</script>

<style scoped>
.page-container { height: 100%; }
</style>
