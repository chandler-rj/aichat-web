<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElSelect, ElOption, ElSwitch, ElUpload, ElMessage } from 'element-plus'
import { users } from '../services/users'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  visible: Boolean,
  user: Object, // null for create, object for edit
  supportedModels: Object
})

const emit = defineEmits(['update:visible', 'saved'])

const userForm = ref({
  id: null,
  name: '',
  modelType: 'OPENAI',
  rolePrompt: '',
  isHuman: false
})

const avatarUrl = ref('')
const pendingAvatarFile = ref(null)
const searchingAvatar = ref(false)
const isEditing = ref(false)

const loadAvatar = async (userId) => {
  // 先清除旧的 blob URL 避免内存泄漏
  if (avatarUrl.value && avatarUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarUrl.value)
  }
  avatarUrl.value = ''
  try {
    // 头像接口是公开的，不需要 Authorization header
    const response = await fetch(`${API_BASE_URL}/users/${userId}/avatar?t=${Date.now()}`)
    if (response.ok) {
      const blob = await response.blob()
      avatarUrl.value = URL.createObjectURL(blob)
    }
  } catch (e) {
    console.error('加载头像失败:', e)
  }
}

watch(() => props.user, async (newUser) => {
  if (!props.visible) return
  if (newUser) {
    isEditing.value = true
    userForm.value = { ...newUser }
    pendingAvatarFile.value = null
    await loadAvatar(newUser.id)
  } else {
    isEditing.value = false
    userForm.value = {
      id: null,
      name: '',
      modelType: 'OPENAI',
      rolePrompt: '',
      isHuman: false
    }
    avatarUrl.value = ''
    pendingAvatarFile.value = null
  }
}, { immediate: true })

// 全局 paste 事件监听
onMounted(() => {
  document.addEventListener('paste', handlePasteAvatar)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePasteAvatar)
})

const handleClose = () => {
  if (avatarUrl.value && avatarUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(avatarUrl.value)
  }
  emit('update:visible', false)
}

const beforeAvatarUpload = (file) => {
  const isImage = file.type.startsWith('image/')
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
  }
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过 2MB!')
  }
  return isImage && isLt2M
}

const handleAvatarChange = (options) => {
  const file = options.file
  if (userForm.value.id) {
    // Existing user - upload directly
    uploadAvatarDirectly(file)
  } else {
    // New user - store for later
    pendingAvatarFile.value = file
    avatarUrl.value = URL.createObjectURL(file)
    ElMessage.info('头像已选择，保存用户时会一并上传')
  }
}

const uploadAvatarDirectly = async (file) => {
  // 捕获当前 userId，避免切换用户后异步回调用到错误的 ID
  const targetUserId = userForm.value.id
  try {
    await users.uploadAvatar(targetUserId, file)
    ElMessage.success('头像上传成功')
    await loadAvatar(targetUserId)
  } catch (e) {
    ElMessage.error('头像上传失败')
  }
}

async function handlePasteAvatar(event) {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of items) {
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (!blob) continue

      // Validate
      if (blob.size > 2 * 1024 * 1024) {
        ElMessage.error('图片大小不能超过 2MB!')
        return
      }

      if (userForm.value.id) {
        // Existing user - upload directly
        await uploadAvatarDirectly(blob)
      } else {
        // New user - store for later
        pendingAvatarFile.value = blob
        avatarUrl.value = URL.createObjectURL(blob)
        ElMessage.info('头像已粘贴，保存用户时会一并上传')
      }
      return
    }
  }
  // No image found in clipboard
  ElMessage.warning('剪贴板中没有图片')
}

const searchGoogleAvatar = async () => {
  const name = userForm.value.name?.trim()
  if (!name) {
    ElMessage.warning('请先输入用户名')
    return
  }

  // 捕获当前用户 ID，用于检测是否在搜索期间切换了用户
  const targetUserId = userForm.value.id

  searchingAvatar.value = true
  try {
    // Search image URL
    const searchRes = await fetch(`${API_BASE_URL}/images/search?keyword=${encodeURIComponent(name)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    const searchData = await searchRes.json()
    if (searchData.error) {
      ElMessage.error(searchData.error)
      return
    }

    if (!searchData.url) {
      ElMessage.warning('未找到相关图片')
      return
    }

    // 如果已经是 data URL（MiniMax 直接返回的 base64），直接使用
    if (searchData.url.startsWith('data:')) {
      // 检查用户是否已切换，丢弃过期响应
      if (userForm.value.id !== targetUserId) return
      avatarUrl.value = searchData.url
      const response = await fetch(searchData.url)
      const blob = await response.blob()
      const typeMatch = searchData.url.match(/data:([^;]+);base64/)
      const fileType = typeMatch ? typeMatch[1] : 'image/png'
      const extension = fileType.includes('svg') ? 'svg' : 'png'
      pendingAvatarFile.value = new File([blob], `avatar_${Date.now()}.${extension}`, { type: fileType })
      ElMessage.success('头像获取成功')
      return
    }

    ElMessage.info('正在获取图片...')

    // Fetch and convert to base64
    const fetchRes = await fetch(`${API_BASE_URL}/images/fetch?url=${encodeURIComponent(searchData.url)}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
      }
    })
    const fetchData = await fetchRes.json()
    if (fetchData.error) {
      ElMessage.error(fetchData.error)
      return
    }

    if (fetchData.data) {
      // 检查用户是否已切换，丢弃过期响应
      if (userForm.value.id !== targetUserId) return
      avatarUrl.value = fetchData.data
      const response = await fetch(fetchData.data)
      const blob = await response.blob()
      const typeMatch = fetchData.data.match(/data:([^;]+);base64/)
      const fileType = typeMatch ? typeMatch[1] : 'image/png'
      const extension = fileType.includes('svg') ? 'svg' : 'png'
      pendingAvatarFile.value = new File([blob], `avatar_${Date.now()}.${extension}`, { type: fileType })
      ElMessage.success('头像获取成功')
    }
  } catch (e) {
    ElMessage.error('搜索头像失败，请重试')
  } finally {
    searchingAvatar.value = false
  }
}

const handleSave = async () => {
  if (!userForm.value.name) {
    ElMessage.warning('请输入用户名')
    return
  }

  if (!userForm.value.modelType) {
    ElMessage.warning('请选择模型类型')
    return
  }

  // 捕获当前待上传头像，避免后续竞态
  const fileToUpload = pendingAvatarFile.value
  pendingAvatarFile.value = null  // 立即清除，防止串用到其他用户

  try {
    let createdUser
    if (isEditing.value) {
      await users.updateUser(userForm.value.id, userForm.value)
      createdUser = userForm.value
      ElMessage.success('用户更新成功')
    } else {
      createdUser = await users.createUser(userForm.value)
      ElMessage.success('用户创建成功')
    }

    // Upload avatar if pending
    if (fileToUpload) {
      await users.uploadAvatar(createdUser.id, fileToUpload)
      ElMessage.success('头像上传成功')
    }

    handleClose()
    emit('saved', createdUser.id)
  } catch (e) {
    ElMessage.error(e.message || '保存用户失败')
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="角色配置"
    width="90%"
    class="dialog--user"
  >
    <ElForm label-width="100px">
      <ElFormItem label="头像">
        <div class="avatar-paste-area" tabindex="0">
          <ElUpload
            class="avatar-uploader"
            action="#"
            :http-request="handleAvatarChange"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
          >
            <img v-if="avatarUrl" :src="avatarUrl" class="avatar" />
            <i v-else class="el-icon-plus avatar-uploader-icon"></i>
          </ElUpload>
          <div class="paste-hint">或 Ctrl+V 粘贴图片</div>
        </div>
      </ElFormItem>
      <ElFormItem label="用户名">
        <ElInput
          v-model="userForm.name"
          placeholder="请输入用户名"
        >
          <template #append>
            <ElButton @click="searchGoogleAvatar" :loading="searchingAvatar" title="从Google搜索头像">
              <i class="el-icon-search"></i> 搜索头像
            </ElButton>
          </template>
        </ElInput>
      </ElFormItem>
      <ElFormItem label="模型类型">
        <ElSelect v-model="userForm.modelType" placeholder="选择模型" style="width: 100%">
          <ElOption
            v-for="(label, type) in supportedModels"
            :key="type"
            :value="type"
          >
            {{ label }}
          </ElOption>
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="角色提示">
        <ElInput
          v-model="userForm.rolePrompt"
          type="textarea"
          :rows="3"
          placeholder="请输入角色提示词（可选）"
        />
      </ElFormItem>
      <ElFormItem label="是否是人类">
        <ElSwitch v-model="userForm.isHuman" />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleSave">保存</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.avatar-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed var(--border-primary);
  border-radius: var(--radius-md);
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-uploader:hover {
  border-color: var(--primary);
}

.avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-uploader-icon {
  font-size: var(--text-display);
  color: var(--text-secondary);
}

.avatar-paste-area {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
  outline: none;
}

.avatar-paste-area:focus-within {
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

.paste-hint {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}
</style>
