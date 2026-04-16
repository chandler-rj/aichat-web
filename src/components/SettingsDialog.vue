<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage, ElMessageBox } from 'element-plus'
import { getAccessToken } from '../services/users'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'logout'])

// 密码修改
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordLoading = ref(false)

// API Key 状态
const apiKey = ref('')
const apiKeyLoading = ref(false)
const copyingId = ref('main')

watch(() => props.visible, async (val) => {
  if (val) {
    loadApiKey()
  }
})

const loadApiKey = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/api-key`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      // 后端返回 maskedKey（掩码形式）和 hasKey 标志
      apiKey.value = data.hasKey ? data.maskedKey : ''
    }
  } catch (e) {
    console.error('获取API Key失败:', e)
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleChangePassword = async () => {
  if (!passwordForm.value.currentPassword) {
    ElMessage.warning('请输入旧密码')
    return
  }
  if (!passwordForm.value.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (passwordForm.value.newPassword.length < 6) {
    ElMessage.warning('密码长度不能少于6个字符')
    return
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }

  passwordLoading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/auth/password`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({
        currentPassword: passwordForm.value.currentPassword,
        newPassword: passwordForm.value.newPassword
      })
    })

    if (response.ok) {
      ElMessage.success('密码修改成功')
      passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' }
    } else {
      const data = await response.json()
      ElMessage.error(data.error || '修改失败')
    }
  } catch (e) {
    ElMessage.error('修改失败')
  } finally {
    passwordLoading.value = false
  }
}

const copyApiKey = async () => {
  try {
    await navigator.clipboard.writeText(apiKey.value)
    copyingId.value = 'main-copied'
    ElMessage.success('API Key 已复制到剪贴板')
    setTimeout(() => {
      copyingId.value = 'main'
    }, 2000)
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

const resetApiKey = async () => {
  try {
    await ElMessageBox.confirm('重置后旧的 API Key 将立即失效，确定要重置吗？', '确认重置', {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'warning'
    })

    apiKeyLoading.value = true
    const response = await fetch(`${API_BASE_URL}/auth/api-key/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      apiKey.value = data.apiKey
      ElMessage.success('API Key 已重置')
    } else {
      ElMessage.error('重置失败')
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '重置失败')
    }
  } finally {
    apiKeyLoading.value = false
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="设置"
    width="90%"
    class="dialog--settings"
    destroy-on-close
  >
    <div class="settings-content">
      <!-- 修改密码 -->
      <div class="settings-section">
        <h3 class="section-title">修改密码</h3>
        <ElForm :model="passwordForm" label-width="100px">
          <ElFormItem label="旧密码">
            <ElInput
              v-model="passwordForm.currentPassword"
              type="password"
              placeholder="请输入旧密码"
              show-password
            />
          </ElFormItem>
          <ElFormItem label="新密码">
            <ElInput
              v-model="passwordForm.newPassword"
              type="password"
              placeholder="请输入新密码（至少6位）"
              show-password
            />
          </ElFormItem>
          <ElFormItem label="确认新密码">
            <ElInput
              v-model="passwordForm.confirmPassword"
              type="password"
              placeholder="请再次输入新密码"
              show-password
              @keyup.enter="handleChangePassword"
            />
          </ElFormItem>
        </ElForm>
        <div class="section-footer">
          <ElButton type="primary" @click="handleChangePassword" :loading="passwordLoading">修改密码</ElButton>
        </div>
      </div>

      <!-- API Key -->
      <div class="settings-section">
        <h3 class="section-title">API Key</h3>
        <div class="api-key-display">
          <div class="api-key-info">
            <div v-if="apiKey" class="api-key-value">
              <code>{{ apiKey }}</code>
              <el-button
                type="text"
                size="small"
                class="copy-btn"
                @click="copyApiKey"
              >
                {{ copyingId === 'main-copied' ? '已复制!' : '📋' }}
              </el-button>
            </div>
            <div v-else class="api-key-empty">尚未生成 API Key</div>
            <div class="api-key-hint">用于 MCP 服务认证，请妥善保管</div>
          </div>
        </div>
        <div class="section-footer">
          <el-button
            :type="apiKey ? 'warning' : 'primary'"
            @click="resetApiKey"
            :loading="apiKeyLoading"
          >
            {{ apiKey ? '重置 API Key' : '生成 API Key' }}
          </el-button>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
/* Dark mode password input styling */
:deep(.el-input__wrapper) {
  background: var(--bg-input);
  box-shadow: none;
  border: 1px solid var(--border-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

:deep(.el-input__wrapper:focus-within) {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

:deep(.el-input__inner) {
  color: var(--text-body);
}

:deep(.el-input__inner::placeholder) {
  color: var(--text-secondary);
}

/* Password visibility toggle button */
:deep(.el-input__password-icon) {
  color: var(--text-secondary);
}

:deep(.el-input__password-icon:hover) {
  color: var(--primary);
}

.settings-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-section {
  background: var(--bg-hover);
  border-radius: var(--radius-md);
  padding: 16px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-title);
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border-light);
}

.section-footer {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.api-key-display {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  padding: 12px;
}

.api-key-value {
  display: flex;
  align-items: center;
  gap: 8px;
}

.api-key-value code {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-body);
  background: var(--bg-hover);
  padding: 4px 8px;
  border-radius: 4px;
  flex: 1;
  word-break: break-all;
}

.copy-btn {
  padding: 4px 8px;
  font-size: 14px;
}

.api-key-empty {
  color: var(--text-secondary);
  font-size: 13px;
}

.api-key-hint {
  margin-top: 8px;
  font-size: 12px;
  color: var(--text-secondary);
}
</style>
