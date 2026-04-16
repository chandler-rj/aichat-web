<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElTable, ElTableColumn, ElTag, ElPagination, ElMessage, ElMessageBox } from 'element-plus'
import { getAccessToken } from '../services/users'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible'])

const accountList = ref([])
const accountSearch = ref('')
const accountPage = ref(1)
const accountPageSize = ref(10)
const accountTotal = ref(0)

const showCreateAccount = ref(false)
const editingAccount = ref({
  id: null,
  username: '',
  email: '',
  password: '',
  role: 'USER'
})

// API Key 相关
const copyingId = ref(null)

watch(() => props.visible, (val) => {
  if (val) {
    accountPage.value = 1
    loadAccounts()
  }
})

const loadAccounts = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', accountPage.value - 1)
    params.append('size', accountPageSize.value)
    if (accountSearch.value) params.append('keyword', accountSearch.value)

    const response = await fetch(`${API_BASE_URL}/admin/accounts?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      accountList.value = data.content || data.records || []
      accountTotal.value = data.totalElements || data.total || 0
    }
  } catch (e) {
    console.error('加载账户列表失败:', e)
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const editAccount = (account) => {
  editingAccount.value = { ...account, password: '' }
  showCreateAccount.value = true
}

const saveAccount = async () => {
  try {
    if (editingAccount.value.id) {
      await fetch(`${API_BASE_URL}/admin/accounts/${editingAccount.value.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify({
          username: editingAccount.value.username,
          email: editingAccount.value.email,
          role: editingAccount.value.role
        })
      })
      ElMessage.success('更新成功')
    } else {
      await fetch(`${API_BASE_URL}/admin/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getAccessToken()}`
        },
        body: JSON.stringify(editingAccount.value)
      })
      ElMessage.success('创建成功')
    }
    showCreateAccount.value = false
    loadAccounts()
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  }
}

const toggleAccountStatus = async (account) => {
  const action = account.status === 'ACTIVE' ? 'disable' : 'enable'
  try {
    await fetch(`${API_BASE_URL}/admin/accounts/${account.id}/${action}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    ElMessage.success(action === 'disable' ? '已禁用' : '已启用')
    loadAccounts()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  }
}

const deleteAccount = async (id) => {
  try {
    await ElMessageBox.confirm('确认删除该用户?', '警告', { type: 'warning' })
    await fetch(`${API_BASE_URL}/admin/accounts/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    ElMessage.success('删除成功')
    loadAccounts()
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '删除失败')
    }
  }
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}

// 复制 API Key
const copyApiKey = async (account) => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/accounts/${account.id}/api-key`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      const data = await response.json()
      await navigator.clipboard.writeText(data.apiKey)
      copyingId.value = account.id
      ElMessage.success('API Key 已复制到剪贴板')
      setTimeout(() => {
        copyingId.value = null
      }, 2000)
    }
  } catch (e) {
    ElMessage.error('复制失败')
  }
}

// 重置 API Key
const resetApiKey = async (account) => {
  try {
    await ElMessageBox.confirm('重置后旧的 API Key 将立即失效，确定要重置吗？', '确认重置', {
      confirmButtonText: '确认重置',
      cancelButtonText: '取消',
      type: 'warning'
    })

    const response = await fetch(`${API_BASE_URL}/admin/accounts/${account.id}/regenerate-api-key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      account.apiKey = data.apiKey
      ElMessage.success('API Key 已重置')
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error(e.message || '重置失败')
    }
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="用户列表"
    width="90%"
    class="dialog--accounts"
    destroy-on-close
  >
    <ElForm inline>
      <ElFormItem label="搜索">
        <ElInput v-model="accountSearch" placeholder="搜索用户名/邮箱" style="width: 200px" />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" @click="loadAccounts">搜索</ElButton>
      </ElFormItem>
      <ElFormItem style="float: right">
        <ElButton type="primary" @click="editingAccount = { id: null, username: '', email: '', password: '', role: 'USER' }; showCreateAccount = true">创建用户</ElButton>
      </ElFormItem>
    </ElForm>

    <ElTable :data="accountList" stripe style="width: 100%">
      <ElTableColumn prop="id" label="ID" width="60" />
      <ElTableColumn prop="username" label="用户名" width="120" />
      <ElTableColumn prop="email" label="邮箱" width="180" />
      <ElTableColumn prop="role" label="角色" width="80">
        <template #default="{ row }">
          <ElTag :type="row.role === 'ADMIN' ? 'danger' : 'success'" size="small">
            {{ row.role === 'ADMIN' ? '管理员' : '用户' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="status" label="状态" width="80">
        <template #default="{ row }">
          <ElTag :type="row.status === 'ACTIVE' ? 'success' : 'danger'" size="small">
            {{ row.status === 'ACTIVE' ? '正常' : '禁用' }}
          </ElTag>
        </template>
      </ElTableColumn>
      <ElTableColumn prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.createdAt) }}
        </template>
      </ElTableColumn>
      <ElTableColumn prop="maskedApiKey" label="API Key" min-width="200">
        <template #default="{ row }">
          <div class="api-key-wrapper">
            <span v-if="row.maskedApiKey" class="api-key-cell">
              {{ row.maskedApiKey }}
            </span>
            <span v-else class="api-key-masked">未设置</span>
            <el-button
              v-if="row.maskedApiKey"
              type="text"
              size="small"
              class="copy-btn"
              :loading="copyingId === row.id"
              @click="copyApiKey(row)"
              title="复制"
            >
              📋
            </el-button>
          </div>
        </template>
      </ElTableColumn>
      <ElTableColumn label="操作" width="200">
        <template #default="{ row }">
          <el-button type="text" size="small" @click="editAccount(row)">编辑</el-button>
          <el-button type="text" size="small" @click="toggleAccountStatus(row)">
            {{ row.status === 'ACTIVE' ? '禁用' : '启用' }}
          </el-button>
          <el-button
            type="text"
            size="small"
            :style="{ color: row.maskedApiKey ? 'var(--warning)' : 'var(--success)' }"
            @click="resetApiKey(row)"
          >
            {{ row.maskedApiKey ? '重置' : '生成' }}
          </el-button>
          <el-button type="text" size="small" style="color: var(--danger)" @click="deleteAccount(row.id)">删除</el-button>
        </template>
      </ElTableColumn>
    </ElTable>

    <ElPagination
      v-model:current-page="accountPage"
      :page-size="accountPageSize"
      :total="accountTotal"
      layout="total, prev, pager, next"
      style="margin-top: 16px; text-align: right"
      @current-change="loadAccounts"
    />

    <!-- 创建/编辑账户弹窗 -->
    <ElDialog
      :model-value="showCreateAccount"
      @update:model-value="showCreateAccount = $event"
      :title="editingAccount.id ? '编辑用户' : '创建用户'"
      width="90%"
      class="dialog--account-edit"
      append-to-body
      destroy-on-close
    >
      <ElForm :model="editingAccount" label-width="80px">
        <ElFormItem label="用户名">
          <ElInput v-model="editingAccount.username" :disabled="!!editingAccount.id" />
        </ElFormItem>
        <ElFormItem label="邮箱">
          <ElInput v-model="editingAccount.email" type="email" />
        </ElFormItem>
        <ElFormItem label="密码" v-if="!editingAccount.id">
          <ElInput v-model="editingAccount.password" type="password" show-password />
        </ElFormItem>
        <ElFormItem label="角色">
          <ElInput v-model="editingAccount.role" type="text" placeholder="USER 或 ADMIN" />
        </ElFormItem>
      </ElForm>
      <template #footer>
        <ElButton @click="showCreateAccount = false">取消</ElButton>
        <ElButton type="primary" @click="saveAccount">保存</ElButton>
      </template>
    </ElDialog>
  </ElDialog>
</template>

<style scoped>
.api-key-cell {
  font-family: monospace;
  color: var(--text-secondary);
  font-size: 12px;
}

.api-key-masked {
  color: var(--warning);
  font-size: 12px;
}

.api-key-wrapper {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.copy-btn {
  padding: 2px 4px;
  font-size: 12px;
}
</style>
