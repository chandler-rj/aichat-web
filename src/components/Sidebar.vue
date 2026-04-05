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
  'view-history',
  'open-account-manager',
  'open-operation-logs',
  'open-stats',
  'open-model-config'
])

// 折叠状态持久化到 localStorage
const loadCollapseState = (key, defaultVal) => {
  try {
    const saved = localStorage.getItem(`sidebar_collapse_${key}`)
    return saved !== null ? JSON.parse(saved) : defaultVal
  } catch { return defaultVal }
}
const saveCollapseState = (key, val) => {
  try { localStorage.setItem(`sidebar_collapse_${key}`, JSON.stringify(val)) } catch {}
}

const sessionCollapseOpen = ref(loadCollapseState('session', true))
const userCollapseOpen = ref(loadCollapseState('user', false))
const ruleCollapseOpen = ref(loadCollapseState('rule', false))
const adminCollapseOpen = ref(loadCollapseState('admin', true))
const modelConfigCollapseOpen = ref(loadCollapseState('model', false))
const historyCollapseOpen = ref(loadCollapseState('history', false))

// 使用对象存储 refs，避免在模板中直接传递 ref（模板中 ref 会自动解包）
const collapseStates = {
  session: sessionCollapseOpen,
  user: userCollapseOpen,
  rule: ruleCollapseOpen,
  admin: adminCollapseOpen,
  model: modelConfigCollapseOpen,
  history: historyCollapseOpen,
}

// 状态变化时自动保存
const toggleState = (key) => {
  collapseStates[key].value = !collapseStates[key].value
  saveCollapseState(key, collapseStates[key].value)
}

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
    <!-- Sidebar Header -->
    <div class="sidebar-header">
      <div class="logo">
        <div class="logo-icon">🤖</div>
        <span class="logo-text">AIChat</span>
      </div>
      <button class="theme-toggle" @click="$emit('toggle-theme')" :aria-label="isDarkMode ? '切换到浅色模式' : '切换到深色模式'">
        <span>{{ isDarkMode ? '☀️' : '🌙' }}</span>
      </button>
    </div>

    <!-- Navigation -->
    <nav class="sidebar-nav" v-if="isLoggedIn">
      <!-- 会话 Section -->
      <div class="nav-section">
        <div class="nav-section-title">会话</div>

        <!-- 当前会话 - 可展开显示会话列表 -->
        <div class="nav-item nav-item--expandable" :class="{ active: currentViewMode === 'current' }" @click="toggleState('session')">
          <span class="nav-item-icon">💬</span>
          <span class="nav-item-text">当前会话</span>
          <span v-if="sessionList.length > 0" class="nav-item-badge">{{ sessionList.length }}</span>
          <span class="nav-item-arrow" :class="{ expanded: sessionCollapseOpen }">▶</span>
        </div>
        <!-- 当前会话展开内容 -->
        <div class="nav-expand" :class="{ expanded: sessionCollapseOpen }">
          <div class="session-list">
            <ElButton type="primary" size="small" @click="$emit('create-session')" class="create-session-btn">
              <i class="el-icon-plus"></i> 新建会话
            </ElButton>
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
              <i class="session-delete-btn el-icon-delete" @click.stop="$emit('delete-session', session.id)"></i>
            </div>
            <div v-if="sessionList.length === 0" class="sidebar-empty">暂无会话</div>
          </div>
        </div>

        <div
          class="nav-item"
          :class="{ active: currentViewMode === 'history' }"
          @click="toggleState('history')"
        >
          <span class="nav-item-icon">📜</span>
          <span class="nav-item-text">历史会话</span>
          <span v-if="historyGroups.length > 0" class="nav-item-badge">{{ historyGroups.length }}</span>
          <span class="nav-item-arrow" :class="{ expanded: historyCollapseOpen }">▶</span>
        </div>
        <!-- 历史会话展开内容 -->
        <div class="nav-expand" :class="{ expanded: historyCollapseOpen }">
          <div v-if="historyGroups.length === 0" class="sidebar-empty">暂无历史会话</div>
          <div v-else class="history-list">
            <div v-for="group in historyGroups" :key="group.sessionId" class="history-group">
              <div class="history-group__title">{{ group.sessionName || '已删除会话' }}</div>
              <div class="history-snapshots">
                <div
                  v-for="snapshot in group.snapshots"
                  :key="snapshot.id"
                  class="history-snapshot"
                  :class="{ active: currentHistorySnapshot?.id === snapshot.id }"
                  @click="$emit('view-history-snapshot', snapshot)"
                >
                  <span class="snapshot-time">{{ formatTime(snapshot.snapshotTime) }}</span>
                  <i class="snapshot-delete el-icon-delete" @click.stop="$emit('delete-history-snapshot', snapshot.id)"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 管理 Section -->
      <div class="nav-section">
        <div class="nav-section-title">管理</div>

        <div class="nav-item nav-item--expandable" @click="toggleState('user')">
          <span class="nav-item-icon">👥</span>
          <span class="nav-item-text">角色配置</span>
          <span class="nav-item-arrow" :class="{ expanded: userCollapseOpen }">▶</span>
        </div>
        <!-- 角色配置展开内容 -->
        <div class="nav-expand" :class="{ expanded: userCollapseOpen }">
          <div class="expand-content">
            <ElButton type="primary" size="small" @click="$emit('add-user')" class="add-btn">
              <i class="el-icon-plus"></i> 添加角色
            </ElButton>
            <div v-if="userList.length === 0" class="sidebar-empty">暂无用户，请添加</div>
            <div v-else class="user-list">
              <div v-for="user in userList" :key="user.id" class="user-item">
                <img :src="getAvatarUrl(user.id) + '?t=' + (avatarUpdateTime[user.id] || '')" class="user-avatar" @error="handleAvatarError" />
                <div class="user-info">
                  <span class="user-name">{{ user.name }}</span>
                  <ElTag size="small" :class="getModelTagClass(user.modelType)">{{ getModelDisplayName(user.modelType) }}</ElTag>
                </div>
                <div class="user-actions">
                  <span class="icon-btn" @click="$emit('edit-user', user)" title="编辑">✏️</span>
                  <span class="icon-btn icon-btn--danger" @click="$emit('delete-user', user.id)" title="删除">🗑️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="nav-item nav-item--expandable" @click="toggleState('rule')">
          <span class="nav-item-icon">📋</span>
          <span class="nav-item-text">规则维护</span>
          <span class="nav-item-arrow" :class="{ expanded: ruleCollapseOpen }">▶</span>
        </div>
        <!-- 规则维护展开内容 -->
        <div class="nav-expand" :class="{ expanded: ruleCollapseOpen }">
          <div class="expand-content">
            <ElButton type="primary" size="small" @click="$emit('add-rule')" class="add-btn">
              <i class="el-icon-plus"></i> 添加规则
            </ElButton>
            <div v-if="ruleList.length === 0" class="sidebar-empty">暂无规则，请添加</div>
            <div v-else class="rule-list">
              <div v-for="rule in ruleList" :key="rule.id" class="rule-item">
                <span class="rule-name">{{ rule.name }}</span>
                <div class="rule-actions">
                  <span class="icon-btn" @click="$emit('edit-rule', rule)" title="编辑">✏️</span>
                  <span class="icon-btn icon-btn--danger" @click="$emit('delete-rule', rule.id)" title="删除">🗑️</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="nav-item" @click="$emit('open-model-config')">
          <span class="nav-item-icon">⚙️</span>
          <span class="nav-item-text">模型设置</span>
        </div>
      </div>

      <!-- 系统 Section (Admin only) -->
      <div class="nav-section" v-if="currentUser?.role === 'ADMIN'">
        <div class="nav-section-title">系统</div>
        <div class="nav-item" @click="$emit('open-account-manager')">
          <span class="nav-item-icon">🔐</span>
          <span class="nav-item-text">账户管理</span>
        </div>
        <div class="nav-item" @click="$emit('open-stats')">
          <span class="nav-item-icon">📊</span>
          <span class="nav-item-text">统计数据</span>
        </div>
      </div>
    </nav>

    <!-- Sidebar Footer - User Card -->
    <div class="sidebar-footer">
      <div v-if="!isLoggedIn" class="auth-buttons">
        <ElButton type="primary" @click="$emit('open-login')" class="auth-btn">
          <i class="el-icon-user"></i> 登录
        </ElButton>
        <ElButton @click="$emit('open-register')" class="auth-btn">
          <i class="el-icon-edit"></i> 注册
        </ElButton>
      </div>
      <div v-else class="user-card">
        <div class="user-avatar">{{ currentUser?.username?.charAt(0) || 'U' }}</div>
        <div class="user-info">
          <div class="user-name">{{ currentUser?.username }}</div>
          <div class="user-role">{{ currentUser?.role === 'ADMIN' ? '管理员' : '用户' }}</div>
        </div>
        <button class="user-settings-btn" @click="$emit('open-account-manager')" title="设置">
          ⚙️
        </button>
      </div>
    </div>
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
  overflow: hidden;
}

/* ========== Header ========== */
.sidebar-header {
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  position: relative;
}

.logo {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--primary) 0%, var(--success) 100%);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  box-shadow: var(--shadow-md);
  animation: logoFloat 3s ease-in-out infinite;
}

@keyframes logoFloat {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-3px) rotate(2deg); }
}

.logo-text {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--text-title);
  letter-spacing: -0.02em;
}

.theme-toggle {
  position: absolute;
  top: var(--space-lg);
  right: var(--space-lg);
  width: 36px;
  height: 36px;
  border: none;
  background: var(--bg-card);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  box-shadow: var(--shadow-sm);
  transition: var(--transition-spring);
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: var(--shadow-md);
}

/* ========== Navigation ========== */
.sidebar-nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-md);
}

/* Hide scrollbar */
.sidebar-nav::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.nav-section {
  margin-bottom: var(--space-lg);
}

.nav-section-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-xs);
}

.nav-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-md);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: var(--transition-spring);
  color: var(--text-body);
}

.nav-item:hover {
  background: var(--bg-hover);
}

.nav-item.active {
  background: var(--bg-active);
  color: var(--primary);
  font-weight: 600;
}

.nav-item-icon {
  font-size: 18px;
  width: 20px;
  text-align: center;
  flex-shrink: 0;
}

.nav-item-text {
  flex: 1;
}

.nav-item-badge {
  background: var(--primary);
  color: var(--text-white);
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  margin-left: auto;
}

.nav-item-arrow {
  font-size: 10px;
  color: var(--text-secondary);
  transition: transform 0.3s ease;
  margin-left: 4px;
}

.nav-item-arrow.expanded {
  transform: rotate(90deg);
}

/* ========== Expandable Content ========== */
.nav-expand {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.nav-expand.expanded {
  max-height: 50vh;
  overflow-y: auto;
  overflow-x: hidden;
}

/* Hide scrollbar for expandable sections */
.nav-expand::-webkit-scrollbar {
  width: 0;
  height: 0;
}

.expand-content {
  padding: 8px 8px 8px 32px;
}

.session-list,
.history-list,
.user-list,
.rule-list {
  padding: 0;
}

.session-item {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.2s ease;
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
  font-weight: 500;
  color: var(--text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-size: var(--text-secondary);
}

.session-item-time {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.session-delete-btn {
  opacity: 0;
  font-size: 14px;
  color: var(--text-secondary);
  transition: opacity 0.2s, color 0.2s;
  cursor: pointer;
  flex-shrink: 0;
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.session-delete-btn:hover {
  color: var(--danger);
}

.create-session-btn {
  width: 100%;
  margin-bottom: 8px;
}

.history-group {
  margin-bottom: 8px;
}

.history-group__title {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  padding: 4px 12px;
  font-weight: 500;
}

.history-snapshot {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: var(--radius-sm);
  transition: background 0.2s ease;
}

.history-snapshot:hover {
  background: var(--bg-hover);
}

.history-snapshot.active {
  background: var(--bg-active);
}

.snapshot-time {
  flex: 1;
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

.snapshot-delete {
  opacity: 0;
  font-size: 14px;
  color: var(--text-secondary);
  transition: opacity 0.2s, color 0.2s;
  cursor: pointer;
  flex-shrink: 0;
}

.history-snapshot:hover .snapshot-delete {
  opacity: 1;
}

.snapshot-delete:hover {
  color: var(--danger);
}

.add-btn {
  width: 100%;
  margin-bottom: 8px;
}

.sidebar-empty {
  padding: 12px;
  color: var(--text-secondary);
  font-size: var(--text-caption);
  text-align: center;
}

.user-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  gap: 8px;
}

.user-item:hover {
  background: var(--bg-hover);
}

.user-item .user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-item .user-info {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
}

.user-item .user-name {
  font-size: var(--text-caption);
  font-weight: 500;
  color: var(--text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex-shrink: 1;
  min-width: 0;
}

.user-actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 12px;
  border-radius: 4px;
  transition: background-color 0.2s;
  opacity: 0.6;
}

.icon-btn:hover {
  background: var(--bg-active);
  opacity: 1;
}

.icon-btn--danger:hover {
  background: var(--danger);
  color: white;
}

.rule-item {
  display: flex;
  align-items: center;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  margin-bottom: 4px;
  gap: 8px;
}

.rule-item:hover {
  background: var(--bg-hover);
}

.rule-name {
  flex: 1;
  font-size: var(--text-caption);
  color: var(--text-body);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rule-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s;
  flex-shrink: 0;
}

.rule-item:hover .rule-actions {
  opacity: 1;
}

/* ========== Footer ========== */
.sidebar-footer {
  padding: var(--space-md);
  border-top: 1px solid var(--border-light);
}

.auth-buttons {
  display: flex;
  gap: 8px;
}

.auth-btn {
  flex: 1;
}

.user-card {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text-white);
  font-size: 16px;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: var(--text-title);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 0.75rem;
  color: var(--text-secondary);
}

.user-settings-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  border-radius: var(--radius-sm);
  transition: var(--transition);
}

.user-settings-btn:hover {
  background: var(--bg-hover);
}

/* ========== Model tag styles ========== */
:deep(.model-tag) {
  font-size: 0.65rem;
  padding: 0 4px;
  line-height: 16px;
  border-radius: var(--radius-sm);
  flex-shrink: 0;
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
