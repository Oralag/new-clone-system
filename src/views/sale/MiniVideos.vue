<template>
  <div class="page-container">
    <el-card shadow="never" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:600;">看看 · 视频管理</span>
        <el-button type="primary" @click="openAdd">+ 上传视频</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" border stripe height="calc(100vh - 200px)">
        <el-table-column label="封面" width="90">
          <template #default="{ row }">
            <img v-if="row.cover_url" :src="row.cover_url" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />
            <span v-else style="color:#aaa;font-size:12px;">无封面</span>
          </template>
        </el-table-column>
        <el-table-column label="标题" prop="title" min-width="150" />
        <el-table-column label="视频链接" min-width="200">
          <template #default="{ row }">
            <a v-if="row.video_url" :href="row.video_url" target="_blank" style="color:#409eff;font-size:12px;">预览</a>
            <span v-else style="color:#aaa;">—</span>
          </template>
        </el-table-column>
        <el-table-column label="点赞" prop="like_count" width="70" align="center" />
        <el-table-column label="评论" prop="comment_count" width="70" align="center" />
        <el-table-column label="浏览" prop="view_count" width="70" align="center" />
        <el-table-column label="排序" prop="sort" width="70" align="center" />
        <el-table-column label="状态" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="130" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="del(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑视频' : '上传视频'" width="600px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="视频标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简短描述" />
        </el-form-item>

        <el-form-item label="视频文件">
          <div v-if="form.video_url" style="margin-bottom:8px;">
            <a :href="form.video_url" target="_blank" style="color:#409eff;font-size:13px;">当前视频：点击预览</a>
            <el-button size="small" text @click="form.video_url = ''">重新上传</el-button>
          </div>
          <div v-else>
            <input ref="videoInput" type="file" accept="video/*" style="display:none" @change="onVideoSelect" />
            <el-button @click="videoInput?.click()" :loading="videoUploading">
              {{ videoUploading ? `上传中 ${uploadProgress}%` : '选择视频文件' }}
            </el-button>
            <div v-if="uploadError" style="color:#f56c6c;font-size:12px;margin-top:4px;">{{ uploadError }}</div>
          </div>
        </el-form-item>

        <el-form-item label="封面图">
          <div v-if="form.cover_url" style="margin-bottom:8px;">
            <img :src="form.cover_url" style="width:80px;height:80px;object-fit:cover;border-radius:4px;" />
            <el-button size="small" text @click="form.cover_url = ''">重新上传</el-button>
          </div>
          <div v-else>
            <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="onCoverSelect" />
            <el-button @click="coverInput?.click()" :loading="coverUploading">
              {{ coverUploading ? '上传中...' : '选择封面图' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="关联商品">
          <el-select v-model="form.goods_id" placeholder="选择商品（选填）" clearable filterable style="width:100%">
            <el-option v-for="g in goodsList" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span style="margin-left:8px;font-size:12px;color:#888;">数字越大越靠前</span>
        </el-form-item>
        <el-form-item label="状态">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" active-text="上架" inactive-text="下架" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

const list = ref<any[]>([])
const goodsList = ref<{ id: number; name: string }[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const videoUploading = ref(false)
const coverUploading = ref(false)
const uploadProgress = ref(0)
const uploadError = ref('')
const videoInput = ref<HTMLInputElement>()
const coverInput = ref<HTMLInputElement>()

const form = ref({
  id: 0,
  title: '',
  description: '',
  video_url: '',
  cover_url: '',
  goods_id: null as number | null,
  sort: 0,
  status: 1,
})

const UPLOAD_URL = 'https://nomaderp.pages.dev/api/admin-upload'

async function load() {
  loading.value = true
  try {
    const [videosRes, goodsRes] = await Promise.all([
      http.get('mini/videos'),
      fetch('https://erp-server-xsji.onrender.com/miniapi/goods/list').then(r => r.json())
    ])
    list.value = videosRes.data?.list || []
    goodsList.value = (goodsRes.data?.rows || []).map((g: any) => ({ id: g.id, name: g.name }))
  } finally {
    loading.value = false
  }
}

async function uploadFile(file: File, type: 'video' | 'cover'): Promise<string> {
  const token = localStorage.getItem('erp_token') || ''
  const fd = new FormData()
  fd.append('file', file)
  fd.append('type', type)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) uploadProgress.value = Math.round(e.loaded / e.total * 100)
    }
    xhr.open('POST', UPLOAD_URL)
    xhr.setRequestHeader('token', token)
    xhr.onload = () => {
      try {
        const r = JSON.parse(xhr.responseText)
        if (r.code === 1) resolve(r.data.url)
        else reject(new Error(r.message || '上传失败'))
      } catch { reject(new Error('响应解析失败')) }
    }
    xhr.onerror = () => reject(new Error('上传失败，请检查网络连接后重试'))
    xhr.send(fd)
  })
}

async function onVideoSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  videoUploading.value = true
  uploadProgress.value = 0
  uploadError.value = ''
  try {
    form.value.video_url = await uploadFile(file, 'video')
  } catch (err: any) {
    uploadError.value = err.message || '上传失败'
  } finally {
    videoUploading.value = false
  }
}

async function onCoverSelect(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  coverUploading.value = true
  try {
    form.value.cover_url = await uploadFile(file, 'cover')
  } catch (err: any) {
    ElMessage.error(err.message || '封面上传失败')
  } finally {
    coverUploading.value = false
  }
}

function openAdd() {
  form.value = { id: 0, title: '', description: '', video_url: '', cover_url: '', goods_id: null, sort: 0, status: 1 }
  uploadError.value = ''
  dialogVisible.value = true
}

function openEdit(row: any) {
  form.value = { ...row }
  uploadError.value = ''
  dialogVisible.value = true
}

async function save() {
  if (!form.value.video_url) return ElMessage.warning('请先上传视频')
  saving.value = true
  try {
    await http.post('mini/videos/save', form.value)
    ElMessage.success('保存成功')
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function del(row: any) {
  await ElMessageBox.confirm(`确认删除「${row.title || '该视频'}」？`, '提示', { type: 'warning' })
  await http.post('mini/videos/del', { id: row.id })
  ElMessage.success('已删除')
  load()
}

onMounted(load)
</script>
