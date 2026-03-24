<script setup>
import { ref, computed } from 'vue'
import { ElButton, ElTag, ElDropdown, ElDropdownMenu, ElDropdownItem, ElMessage } from 'element-plus'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  isLoggedIn: Boolean,
  currentUser: Object,
  sessionList: Array,
  currentSession: Object,
  userList: Array,
  ruleList: Array,
  historyGroups: Array,
  isRunning: Boolean,
  currentViewMode: String,
  currentHistorySnapshot: Object,
  avatarUpdateTime: Object,
  globalConfig: Object,
  showModelConfig: Boolean,
  showAccountManager: Boolean,
  showOperationLogs: Boolean,
  showStats: Boolean,
  isDarkMode: Boolean,
  class: String
})

const emit = defineEmits([
  'toggle-theme',
  'open-login',
  'open-register',
  'logout',
  'resend-verification',
  'select-session',
  'delete-session',
  'create-session',
  'toggle-user-collapse',
  'toggle-rule-collapse',
  'toggle-admin-collapse',
  'toggle-model-config-collapse',
  'toggle-history-collapse',
  'add-rule',
  'edit-rule',
  'delete-rule',
  'add-user',
  'edit-user',
  'delete-user',
  'view-history-snapshot',
  'delete-history-snapshot',
  'switch-to-current',
  'open-account-manager',
  'open-operation-logs',
  'open-stats',
  'open-model-config'
])

const userCollapseOpen = ref(false)
const ruleCollapseOpen = ref(false)
const adminCollapseOpen = ref(true)
const modelConfigCollapseOpen = ref(false)
const historyCollapseOpen = ref(false)

const getModelTagClass = (modelType) => {
  const classMap = {
    'OPENAI': 'model-tag model-tag--openai',
    'MINIMAX': 'model-tag model-tag--minimax',
    'VOLCANO': 'model-tag model-tag--volcano',
    'QWEN': 'model-tag model-tag--qwen',
    'GEMINI': 'model-tag model-tag--gemini'
  }
  return classMap[modelType] || 'model-tag el-tag--info'
}

const getModelDisplayName = (modelType) => {
  const nameMap = {
    'OPENAI': 'OpenAI GPT',
    'MINIMAX': 'MiniMax',
    'VOLCANO': '字节 火山',
    'QWEN': '阿里 千问',
    'GEMINI': 'Google Gemini'
  }
  return nameMap[modelType] || modelType
}

const formatTime = (timeStr) => {
  if (!timeStr) return ''
  const date = new Date(timeStr)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const handleAvatarError = (event) => {
  event.target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj48Y2lyY2xlIGN4PSIxNiIgY3k9IjE2IiByPSIxNCIgZmlsbD0iI2UzZTNlMyIvPjx0ZXh0IHg9IjE2IiB5PSIyMCIgZm9udC1zaXplPSIxNCIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zL1NlcmlmIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij48L3RleHQ+PC9zdmc+'
}

const getAvatarUrl = (userId) => {
  return `${API_BASE_URL}/users/${userId}/avatar`
}
</script>

<template>
  <div class="sidebar" :class="props.class">
    <div class="sidebar-header">
      <div class="sidebar-title">🤖 脑洞聊天室</div>
      <button class="theme-toggle" @click="$emit('toggle-theme')" :title="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
        <span>{{ isDarkMode ? '☀️' : '🌙' }}</span>
      </button>

      <!-- 未登录时显示登录/注册按钮 -->
      <template v-if="!isLoggedIn">
        <ElButton type="primary" @click="$emit('open-login')" class="sidebar-auth-btn">
          <i class="el-icon-user"></i> 登录
        </ElButton>
        <ElButton @click="$emit('open-register')" class="sidebar-auth-btn" style="margin-left: 0">
          <i class="el-icon-edit"></i> 注册
        </ElButton>
      </template>

      <!-- 已登录时显示用户信息和登出按钮 -->
      <template v-else>
        <div class="user-info-bar">
          <span class="user-name">{{ currentUser?.username }}</span>
          <ElTag size="small" :type="currentUser?.role === 'ADMIN' ? 'danger' : 'success'">
            {{ currentUser?.role === 'ADMIN' ? '管理员' : '用户' }}
          </ElTag>
        </div>

        <!-- 邮箱验证提示 -->
        <div v-if="currentUser && !currentUser.emailVerified" class="email-verify-notice">
          <i class="el-icon-warning"></i>
          <span>邮箱未验证</span>
          <ElButton type="text" size="small" @click="$emit('resend-verification')">重新发送验证邮件</ElButton>
        </div>

        <ElButton @click="$emit('logout')" class="sidebar-logout-btn">
          <i class="el-icon-switch-button"></i> 退出登录
        </ElButton>
      </template>
    </div>

    <!-- 登录后显示新建会话按钮 -->
    <template v-if="isLoggedIn">
      <ElButton type="primary" @click="$emit('create-session')" style="width: calc(100% - 32px); margin: 16px;" data-step="add-user" data-position="top">
        <i class="el-icon-plus"></i> 新建会话
      </ElButton>

      <div class="session-list">
        <div
          v-for="session in sessionList"
          :key="session.id"
          class="session-item"
          :class="{ active: currentSession?.id === session.id }"
          @click="$emit('select-session', session)"
        >
          <div class="session-item-content">
            <div class="session-item-name">{{ session.name }}</div>
            <div class="session-item-time">{{ formatTime(session.updateTime) }}</div>
          </div>
          <span class="session-delete-btn" @click.stop="$emit('delete-session', session.id)">🗑️</span>
        </div>
      </div>

      <!-- 规则维护区域 - 折叠面板 -->
      <div class="sidebar-collapse">
        <div class="sidebar-collapse__header">
          <span class="sidebar-module__title" @click="ruleCollapseOpen = !ruleCollapseOpen" style="flex: 1; cursor: pointer;">📋 规则维护</span>
          <i :class="['sidebar-collapse__arrow', { expanded: ruleCollapseOpen }]" @click="ruleCollapseOpen = !ruleCollapseOpen" style="cursor: pointer;"></i>
          <ElButton type="text" size="small" @click="$emit('add-rule')" class="sidebar-btn" style="margin-left: 0;">添加</ElButton>
        </div>
        <div :class="['sidebar-collapse__content', { expanded: ruleCollapseOpen }]">
          <div v-if="ruleList.length === 0" class="sidebar-empty">
            暂无规则，请添加
          </div>
          <div v-else class="sidebar-user-list">
            <div v-for="rule in ruleList" :key="rule.id" class="sidebar-user-item">
              <div class="sidebar-user-info">
                <span>{{ rule.name }}</span>
              </div>
              <div class="sidebar-user-actions">
                <ElButton type="text" size="small" @click="$emit('edit-rule', rule)" class="sidebar-btn sidebar-btn--edit">编辑</ElButton>
                <ElButton type="text" size="small" @click="$emit('delete-rule', rule.id)" class="sidebar-btn sidebar-btn--delete">删除</ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 角色配置区域 - 折叠面板 -->
      <div class="sidebar-collapse">
        <div class="sidebar-collapse__header">
          <span class="sidebar-module__title" @click="userCollapseOpen = !userCollapseOpen" style="flex: 1; cursor: pointer;">👥 角色配置</span>
          <i :class="['sidebar-collapse__arrow', { expanded: userCollapseOpen }]" @click="userCollapseOpen = !userCollapseOpen" style="cursor: pointer;"></i>
          <ElButton type="text" size="small" @click="$emit('add-user')" class="sidebar-btn" style="margin-left: 0;" data-step="add-user-btn" data-position="top">添加</ElButton>
        </div>
        <div :class="['sidebar-collapse__content', { expanded: userCollapseOpen }]">
          <div v-if="userList.length === 0" class="sidebar-empty">
            暂无用户，请添加
          </div>
          <div v-else class="sidebar-user-list">
            <div v-for="user in userList" :key="user.id" class="sidebar-user-item">
              <img :src="getAvatarUrl(user.id) + '?t=' + (avatarUpdateTime[user.id] || '')" class="sidebar-user-avatar" @error="handleAvatarError" />
              <div class="sidebar-user-info">
                <span>{{ user.name }}</span>
                <ElTag size="small" :class="getModelTagClass(user.modelType)">{{ getModelDisplayName(user.modelType) }}</ElTag>
                <span v-if="user.isHuman" class="sidebar-user-human">👤</span>
              </div>
              <div class="sidebar-user-actions">
                <ElButton type="text" size="small" @click="$emit('edit-user', user)" class="sidebar-btn sidebar-btn--edit">编辑</ElButton>
                <ElButton type="text" size="small" @click="$emit('delete-user', user.id)" class="sidebar-btn sidebar-btn--delete">删除</ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理员账户管理区域 -->
      <div v-if="isLoggedIn && currentUser?.role === 'ADMIN'" class="sidebar-collapse">
        <div class="sidebar-collapse__header">
          <span class="sidebar-module__title" @click="adminCollapseOpen = !adminCollapseOpen" style="flex: 1; cursor: pointer;">🔐 账户管理</span>
          <i :class="['sidebar-collapse__arrow', { expanded: adminCollapseOpen }]" @click="adminCollapseOpen = !adminCollapseOpen" style="cursor: pointer;"></i>
        </div>
        <div :class="['sidebar-collapse__content', { expanded: adminCollapseOpen }]">
          <ElButton type="text" size="small" @click="$emit('open-account-manager')" class="sidebar-admin-btn">
            <i class="el-icon-user"></i> 用户列表
          </ElButton>
          <ElButton type="text" size="small" @click="$emit('open-operation-logs')" class="sidebar-admin-btn">
            <i class="el-icon-document"></i> 操作日志
          </ElButton>
          <ElButton type="text" size="small" @click="$emit('open-stats')" class="sidebar-admin-btn">
            <i class="el-icon-data-line"></i> 统计信息
          </ElButton>
        </div>
      </div>

      <!-- 模型配置区域 -->
      <div class="sidebar-collapse">
        <div class="sidebar-collapse__header">
          <span class="sidebar-module__title" @click="modelConfigCollapseOpen = !modelConfigCollapseOpen" style="flex: 1; cursor: pointer;">⚙️ 模型配置</span>
          <i :class="['sidebar-collapse__arrow', { expanded: modelConfigCollapseOpen }]" @click="modelConfigCollapseOpen = !modelConfigCollapseOpen" style="cursor: pointer;"></i>
        </div>
        <div :class="['sidebar-collapse__content', { expanded: modelConfigCollapseOpen }]">
          <ElButton type="text" size="small" @click="$emit('open-model-config')" class="sidebar-admin-btn" data-step="model-config" data-position="top">
            <i class="el-icon-setting"></i> 全局设置
          </ElButton>
        </div>
      </div>

      <!-- 历史会话区域 -->
      <div class="sidebar-collapse">
        <div class="sidebar-collapse__header">
          <span class="sidebar-module__title" @click="historyCollapseOpen = !historyCollapseOpen" style="flex: 1; cursor: pointer;">📜 历史会话</span>
          <i :class="['sidebar-collapse__arrow', { expanded: historyCollapseOpen }]" @click="historyCollapseOpen = !historyCollapseOpen" style="cursor: pointer;"></i>
        </div>
        <div :class="['sidebar-collapse__content', { expanded: historyCollapseOpen }]">
          <div v-if="historyGroups.length === 0" class="sidebar-empty">
            暂无历史会话
          </div>
          <div v-else class="sidebar-history-list">
            <div v-for="group in historyGroups" :key="group.sessionId" class="sidebar-history-group">
              <div class="sidebar-history-group__title">
                {{ group.sessionName || '已删除会话' }}
              </div>
              <div class="sidebar-history-snapshots">
                <div v-for="snapshot in group.snapshots" :key="snapshot.id" class="sidebar-history-snapshot" @click="$emit('view-history-snapshot', snapshot)">
                  <span class="snapshot-time">{{ formatTime(snapshot.snapshotTime) }}</span>
                  <span v-if="currentHistorySnapshot?.id === snapshot.id" class="snapshot-active">✓</span>
                  <span class="snapshot-delete" @click.stop="$emit('delete-history-snapshot', snapshot.id)" title="删除">🗑️</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: var(--bg-sidebar);
  border-right: 1px solid var(--border-primary);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.sidebar-header {
  padding: 16px;
  border-bottom: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sidebar-title {
  font-size: var(--text-heading);
  font-weight: var(--font-bold);
  color: var(--text-title);
}

.theme-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: var(--text-heading);
  padding: 4px;
  border-radius: var(--radius-sm);
  transition: background var(--transition);
  color: var(--text-title);
}

.theme-toggle:hover {
  background: var(--bg-hover);
}

.sidebar-auth-btn {
  width: 100%;
}

.user-info-bar {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-weight: var(--font-medium);
  color: var(--text-title);
}

.email-verify-notice {
  font-size: var(--text-caption);
  color: var(--warning-text);
  background: var(--warning-light);
  padding: 8px;
  border-radius: var(--radius-sm);
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
}

.sidebar-logout-btn {
  width: 100%;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 12px;
  margin-bottom: 4px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition);
}

.session-item:hover {
  background: var(--bg-hover);
}

.session-item.active {
  background: var(--bg-active);
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-name {
  font-weight: var(--font-medium);
  color: var(--text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item-time {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.session-delete-btn {
  opacity: 0;
  transition: opacity var(--transition);
  cursor: pointer;
  /* Ensure minimum 40x40px touch target for mobile */
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 8px;
  margin: -8px;
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.sidebar-collapse {
  border-top: 1px solid var(--border-light);
}

.sidebar-collapse__header {
  display: flex;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
}

.sidebar-module__title {
  font-weight: var(--font-medium);
  color: var(--text-body);
}

.sidebar-collapse__arrow {
  margin-left: auto;
  margin-right: 8px;
  width: 0;
  height: 0;
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 5px solid var(--text-secondary);
  transition: transform var(--transition);
}

.sidebar-collapse__arrow.expanded {
  transform: rotate(180deg);
}

.sidebar-collapse__content {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.4s var(--transition-spring);
}

.sidebar-collapse__content.expanded {
  max-height: calc(100vh - 200px);
  overflow-y: auto;
}

.sidebar-empty {
  padding: 12px 16px;
  color: var(--text-secondary);
  font-size: var(--text-secondary);
}

.sidebar-user-list {
  padding: 0 8px 8px;
}

.sidebar-user-item {
  display: flex;
  align-items: center;
  padding: 8px;
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
}

.sidebar-user-item:hover {
  background: var(--bg-hover);
}

.sidebar-user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  margin-right: 8px;
  object-fit: cover;
}

.sidebar-user-info {
  flex: 1;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.sidebar-user-human {
  font-size: var(--text-caption);
}

.sidebar-user-actions {
  display: flex;
  gap: 4px;
}

.sidebar-btn {
  padding: 2px 4px;
  font-size: var(--text-caption);
}

.sidebar-btn--edit {
  color: var(--primary);
}

.sidebar-btn--delete {
  color: var(--danger);
}

.sidebar-admin-btn {
  width: calc(100% - 32px);
  margin: 4px 16px;
  text-align: left;
}

.sidebar-history-list {
  padding: 0 8px 8px;
}

.sidebar-history-group {
  margin-bottom: 8px;
}

.sidebar-history-group__title {
  font-size: var(--text-secondary);
  font-weight: var(--font-medium);
  padding: 4px 8px;
  color: var(--text-secondary);
}

.sidebar-history-snapshot {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: var(--text-caption);
}

.sidebar-history-snapshot:hover {
  background: var(--bg-hover);
}

.snapshot-time {
  flex: 1;
  color: var(--text-secondary);
}

.snapshot-active {
  color: var(--success);
  margin-right: 4px;
}

.snapshot-delete {
  opacity: 0;
  transition: opacity var(--transition);
  /* Ensure minimum 40x40px touch target for mobile */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 28px;
  padding: 4px 8px;
  margin: -4px -8px;
}

.sidebar-history-snapshot:hover .snapshot-delete {
  opacity: 1;
}

/* Model tag styles */
:deep(.model-tag) {
  font-size: var(--text-caption);
  padding: 0 4px;
  line-height: 16px;
  border-radius: var(--radius-sm);
}

:deep(.model-tag--openai) {
  background: linear-gradient(135deg, var(--success) 0%, var(--success-hover) 100%);
  color: var(--text-white);
  box-shadow: 0 2px 6px rgba(32, 201, 151, 0.3);
}

:deep(.model-tag--minimax) {
  background: linear-gradient(135deg, var(--warning) 0%, #E09A00 100%);
  color: var(--text-white);
  box-shadow: 0 2px 6px rgba(255, 176, 32, 0.3);
}

:deep(.model-tag--volcano) {
  background: linear-gradient(135deg, var(--danger) 0%, var(--danger-hover) 100%);
  color: var(--text-white);
  box-shadow: 0 2px 6px rgba(232, 69, 69, 0.3);
}

:deep(.model-tag--qwen) {
  background: linear-gradient(135deg, #7070FF 0%, #5050D0 100%);
  color: var(--text-white);
  box-shadow: 0 2px 6px rgba(80, 80, 208, 0.3);
}

:deep(.model-tag--gemini) {
  background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
  color: var(--text-white);
  box-shadow: 0 2px 6px rgba(139, 92, 246, 0.3);
}
</style>
