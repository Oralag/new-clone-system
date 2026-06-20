<template>
  <div class="page-container">
    <el-card shadow="never" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:center;">
        <span style="font-size:15px;font-weight:600;">{{ $t('sale.miniVideos.pageTitle') }}</span>
        <el-button type="primary" @click="openAdd">{{ $t('sale.miniVideos.uploadBtn') }}</el-button>
      </div>
    </el-card>

    <el-card shadow="never">
      <el-table :data="list" v-loading="loading" border stripe height="calc(100vh - 200px)">
        <el-table-column :label="$t('sale.miniVideos.colCover')" width="90">
          <template #default="{ row }">
            <img v-if="row.cover_url" :src="row.cover_url" style="width:60px;height:60px;object-fit:cover;border-radius:4px;" />
            <span v-else style="color:#aaa;font-size:12px;">{{ $t('sale.miniVideos.noCover') }}</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('sale.miniVideos.colTitle')" prop="title" min-width="150" />
        <el-table-column :label="$t('sale.miniVideos.colVideoUrl')" min-width="200">
          <template #default="{ row }">
            <a v-if="row.video_url" :href="row.video_url" target="_blank" style="color:#409eff;font-size:12px;">{{ $t('sale.miniVideos.previewLink') }}</a>
            <span v-else style="color:#aaa;">—</span>
          </template>
        </el-table-column>
        <el-table-column :label="$t('sale.miniVideos.colLike')" prop="like_count" width="70" align="center" />
        <el-table-column :label="$t('sale.miniVideos.colComment')" prop="comment_count" width="70" align="center" />
        <el-table-column :label="$t('sale.miniVideos.colView')" prop="view_count" width="70" align="center" />
        <el-table-column :label="$t('sale.miniVideos.colSort')" prop="sort" width="70" align="center" />
        <el-table-column :label="$t('sale.miniVideos.colStatus')" width="80" align="center">
          <template #default="{ row }">
            <el-tag :type="row.status === 1 ? 'success' : 'info'" size="small">{{ row.status === 1 ? $t('sale.miniVideos.statusOnShelf') : $t('sale.miniVideos.statusOffShelf') }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column :label="$t('sale.miniVideos.colAction')" width="130" align="center">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">{{ $t('sale.miniVideos.editBtn') }}</el-button>
            <el-button size="small" type="danger" @click="del(row)">{{ $t('sale.miniVideos.deleteBtn') }}</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? $t('sale.miniVideos.dialogTitleEdit') : $t('sale.miniVideos.dialogTitleAdd')" width="600px" :close-on-click-modal="false">
      <el-form :model="form" label-width="80px">
        <el-form-item :label="$t('sale.miniVideos.formTitle')">
          <el-input v-model="form.title" :placeholder="$t('sale.miniVideos.titlePlaceholder')" />
        </el-form-item>
        <el-form-item :label="$t('sale.miniVideos.formDesc')">
          <el-input v-model="form.description" type="textarea" :rows="2" :placeholder="$t('sale.miniVideos.descPlaceholder')" />
        </el-form-item>

        <el-form-item :label="$t('sale.miniVideos.formVideo')">
          <div v-if="form.video_url" style="margin-bottom:8px;">
            <a :href="form.video_url" target="_blank" style="color:#409eff;font-size:13px;">{{ $t('sale.miniVideos.currentVideo') }}</a>
            <el-button size="small" text @click="form.video_url = ''">{{ $t('sale.miniVideos.reupload') }}</el-button>
          </div>
          <div v-else>
            <input ref="videoInput" type="file" accept="video/*" style="display:none" @change="onVideoSelect" />
            <el-button @click="videoInput?.click()" :loading="videoUploading">
              {{ videoUploading ? t('sale.miniVideos.uploading', { progress: uploadProgress }) : t('sale.miniVideos.selectVideo') }}
            </el-button>
            <div v-if="uploadError" style="color:#f56c6c;font-size:12px;margin-top:4px;">{{ uploadError }}</div>
          </div>
        </el-form-item>

        <el-form-item :label="$t('sale.miniVideos.formCover')">
          <div v-if="form.cover_url" style="margin-bottom:8px;">
            <img :src="form.cover_url" style="width:80px;height:80px;object-fit:cover;border-radius:4px;" />
            <el-button size="small" text @click="form.cover_url = ''">{{ $t('sale.miniVideos.reuploadCover') }}</el-button>
          </div>
          <div v-else>
            <input ref="coverInput" type="file" accept="image/*" style="display:none" @change="onCoverSelect" />
            <el-button @click="coverInput?.click()" :loading="coverUploading">
              {{ coverUploading ? $t('sale.miniVideos.uploadingCover') : $t('sale.miniVideos.selectCover') }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item :label="$t('sale.miniVideos.formGoods')">
          <el-select v-model="form.goods_id" :placeholder="$t('sale.miniVideos.goodsPlaceholder')" clearable filterable style="width:100%">
            <el-option v-for="g in goodsList" :key="g.id" :label="g.name" :value="g.id" />
          </el-select>
        </el-form-item>
        <el-form-item :label="$t('sale.miniVideos.formSort')">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span style="margin-left:8px;font-size:12px;color:#888;">{{ $t('sale.miniVideos.sortHint') }}</span>
        </el-form-item>
        <el-form-item :label="$t('sale.miniVideos.formStatus')">
          <el-switch v-model="form.status" :active-value="1" :inactive-value="0" :active-text="$t('sale.miniVideos.statusOnShelf')" :inactive-text="$t('sale.miniVideos.statusOffShelf')" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">{{ $t('sale.miniVideos.cancelBtn') }}</el-button>
        <el-button type="primary" :loading="saving" @click="save">{{ $t('sale.miniVideos.saveBtn') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import http from '@/api/http'

const { t } = useI18n()

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
        else reject(new Error(r.message || t('sale.miniVideos.warnNoVideo')))
      } catch { reject(new Error(t('sale.miniVideos.errorParseResponse'))) }
    }
    xhr.onerror = () => reject(new Error(t('sale.miniVideos.errorNetworkUpload')))
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
    uploadError.value = err.message || t('sale.miniVideos.errorUploadFailed')
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
    ElMessage.error(err.message || t('sale.miniVideos.errorCoverUpload'))
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
  if (!form.value.video_url) return ElMessage.warning(t('sale.miniVideos.warnNoVideo'))
  saving.value = true
  try {
    await http.post('mini/videos/save', form.value)
    ElMessage.success(t('sale.miniVideos.successSave'))
    dialogVisible.value = false
    load()
  } finally {
    saving.value = false
  }
}

async function del(row: any) {
  await ElMessageBox.confirm(
    t('sale.miniVideos.confirmDeleteMsg', { title: row.title || t('sale.miniVideos.deleteBtn') }),
    t('sale.miniVideos.confirmDeleteTitle'),
    { type: 'warning' }
  )
  await http.post('mini/videos/del', { id: row.id })
  ElMessage.success(t('sale.miniVideos.successDelete'))
  load()
}

onMounted(load)
</script>
