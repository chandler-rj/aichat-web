<script setup>
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'
import { ElButton, ElInput, ElTag, ElDropdown, ElDropdownMenu, ElDropdownItem, ElSelect, ElOption, ElCollapse, ElCollapseItem, ElForm, ElFormItem, ElRadioGroup, ElRadio, ElInputNumber, ElMessage } from 'element-plus'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  isLoggedIn: Boolean,
  currentSession: Object,
  messages: Array,
  userList: Array,
  ruleList: Array,
  userConfig: Array,
  chatMode: String,
  isRunning: Boolean,
  sending: Boolean,
  manualMessage: String,
  currentViewMode: String,
  historyMessages: Array,
  historySession: Object,
  selectedRuleId: String,
  activeCollapse: Array
})

const emit = defineEmits([
  'update:manual-message',
  'send-manual',
  'start-chat',
  'stop-chat',
  'clear-messages',
  'import-history',
  'export-md',
  'export-html',
  'select-session',
  'update-session',
  'rule-select',
  'add-user',
  'remove-user',
  'switch-to-current',
  'speak-message',
  'auto-speak-all',
  'stop-speaking',
  'is-speaking',
  'current-speaking-id',
  'is-auto-speaking'
])

const chatArea = ref(null)
const localActiveCollapse = ref(props.activeCollapse || [])
const settingsExpanded = ref(false)
const usersExpanded = ref(false)
const showMoreMenu = ref(false)
const moreMenuRef = ref(null)
const showConfigDrawer = ref(false)

// 点击其他地方关闭更多菜单
const handleClickOutside = (event) => {
  if (moreMenuRef.value && !moreMenuRef.value.contains(event.target)) {
    // 检查点击的是否是菜单按钮本身（菜单按钮会单独处理）
    const moreBtn = document.querySelector('.header-more-btn')
    if (moreBtn && moreBtn.contains(event.target)) {
      return
    }
    showMoreMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const displayMessages = computed(() => {
  return props.currentViewMode === 'history' ? props.historyMessages : props.messages
})

// Available users for dropdown (not already added)
const availableUsers = computed(() => {
  return props.userList.filter(user => !props.userConfig.includes(user.id))
})

// Sync localActiveCollapse with prop changes
watch(() => props.activeCollapse, (newVal) => {
  localActiveCollapse.value = newVal || []
})

const getModelTagClass = (modelType) => {
  const classMap = {
    'OPENAI': 'model-tag model-tag--openai',
    'MINIMAX': 'model-tag model-tag--minimax',
    'VOLCANO': 'model-tag model-tag--volcano',
    'QWEN': 'model-tag model-tag--qwen',
    'GEMINI': 'model-tag model-tag--gemini',
    'XAI': 'model-tag model-tag--xai'
  }
  return classMap[modelType] || 'model-tag el-tag--info'
}

const getModelDisplayName = (modelType) => {
  const nameMap = {
    'OPENAI': 'GPT',
    'MINIMAX': 'Mini',
    'VOLCANO': '火山',
    'QWEN': '千问',
    'GEMINI': 'Gemini',
    'XAI': 'Grok'
  }
  return nameMap[modelType] || modelType
}

const getParticipantAvatarStyle = (modelType) => {
  const styleMap = {
    'OPENAI': 'background: linear-gradient(135deg, var(--success) 0%, var(--success-hover) 100%);',
    'MINIMAX': 'background: linear-gradient(135deg, var(--warning) 0%, #E09A00 100%);',
    'VOLCANO': 'background: linear-gradient(135deg, var(--danger) 0%, var(--danger-hover) 100%);',
    'QWEN': 'background: linear-gradient(135deg, #7070FF 0%, #5050D0 100%);',
    'GEMINI': 'background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);',
    'XAI': 'background: linear-gradient(135deg, #10A37F 0%, #0D7A5F 100%);'
  }
  return styleMap[modelType] || 'background: linear-gradient(135deg, var(--primary) 0%, var(--warning) 100%);'
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

const getMessageAvatar = (message) => {
  if (message.userId) {
    return `${API_BASE_URL}/users/${message.userId}/avatar`
  }
  const user = props.userList?.find(u => u.name === message.sender)
  if (user && user.id) {
    return `${API_BASE_URL}/users/${user.id}/avatar`
  }
  return 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSIjOTAzOTNiIj48Y2lyY2xlIGN4PSIxMiIgY3k9IjEyIiByPSIxMCIvPjxwYXRoIGQ9Ik0yMSAxM2gtMnYtMmgtMnYzSDl2LTJIOXYtMnYyaC0ydjJoLTJ2MmgydjJIODB2MnYyaDJ6bTAtOGgydjJoLTJ2LTJoLTJ2LTJoMnYzSDl2MmgtMnYtMmgydi0yaCJvPjwvc3ZnPg=='
}

const scrollToBottom = () => {
  nextTick(() => {
    if (chatArea.value) {
      chatArea.value.scrollTop = chatArea.value.scrollHeight
    }
  })
}

const handleMoreAction = (command) => {
  if (command === 'clear') {
    emit('clear-messages')
  } else if (command === 'import') {
    emit('import-history')
  } else if (command === 'export-md') {
    emit('export-md')
  } else if (command === 'export-html') {
    emit('export-html')
  }
}

const handleSend = () => {
  emit('send-manual')
}

watch(() => props.messages.length, () => {
  scrollToBottom()
})

const getMessageClass = (message) => {
  if (message.sender === '用户') return 'user'
  if (message.sender === '系统') return 'system'
  return 'ai'
}
</script>

<template>
  <div class="main-content" v-if="isLoggedIn && (currentSession || currentViewMode === 'history')">
    <!-- 内容头部 -->
    <div class="content-header">
      <div class="header-left">
        <div class="content-header-title">
          {{ currentViewMode === 'history' ? (historySession?.name || '历史会话') : (currentSession?.name || '') }}
        </div>
      </div>
      <div class="header-right">
        <button class="header-more-btn" @click="showMoreMenu = !showMoreMenu" v-if="currentViewMode === 'current'">⋮</button>
        <button
          v-if="currentViewMode === 'current'"
          class="btn-start"
          :class="{ 'btn-stop': isRunning }"
          @click="isRunning ? $emit('stop-chat') : $emit('start-chat')"
          data-step="start-chat"
        >
          <svg v-if="!isRunning" viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
        </button>
      </div>
    </div>

    <!-- 更多菜单 -->
    <div class="more-menu" :class="{ 'visible': showMoreMenu }" v-if="currentViewMode === 'current'" ref="moreMenuRef">
      <div class="more-menu-item" @click="handleMoreAction('clear'); showMoreMenu = false" :class="{ 'disabled': isRunning }">
        🗑 清空消息
      </div>
      <div class="more-menu-item" @click="handleMoreAction('import'); showMoreMenu = false" :class="{ 'disabled': isRunning || !currentSession }">
        📥 导入历史
      </div>
      <div class="more-menu-item" @click="handleMoreAction('export-md'); showMoreMenu = false" :class="{ 'disabled': isRunning }">
        📄 导出MD
      </div>
      <div class="more-menu-item" @click="handleMoreAction('export-html'); showMoreMenu = false" :class="{ 'disabled': isRunning }">
        📋 导出HTML
      </div>
    </div>

    <!-- 运行提示 -->
    <div v-if="isRunning" class="alert-bar alert-bar--success">
      ℹ 自动对话已启动，AI会自动回复消息
    </div>

    <!-- 历史视图提示 -->
    <div v-if="currentViewMode === 'history'" class="alert-bar alert-bar--primary" style="display: flex; justify-content: space-between; align-items: center;">
      <div>📜 您正在查看历史记录</div>
      <button class="btn-action btn-action--primary" @click="$emit('switch-to-current')">返回当前会话</button>
    </div>


    <!-- 聊天区域 -->
    <div class="chat-area" ref="chatArea">
      <!-- 朗读控制栏 -->
      <div class="alert-bar alert-bar--info" style="justify-content: flex-end;">
        <button
          v-if="!$attrs.isSpeaking && !$attrs.isAutoSpeaking"
          class="btn-text"
          :disabled="displayMessages.length === 0"
          @click="$emit('auto-speak-all')"
        >
          🔊 朗读全部消息
        </button>
        <button
          v-else
          class="btn-text btn-text--danger"
          @click="$emit('stop-speaking')"
        >
          ⏹ 停止朗读
        </button>
      </div>

      <div
        v-for="message in displayMessages"
        :key="message.id"
        class="message-item"
        :class="getMessageClass(message)"
      >
        <div class="message-header">
          <img :src="getMessageAvatar(message)" class="message-avatar" />
          <span class="message-sender">{{ message.sender }}</span>
          <ElTag v-if="message.modelType" size="small" :class="['model-tag-inline', getModelTagClass(message.modelType)]">{{ getModelDisplayName(message.modelType) }}</ElTag>
          <span class="message-time">{{ formatTime(message.createTime) }}</span>
          <div class="message-actions">
            <span
              class="message-speaker-btn"
              :class="{ 'speaking': $attrs.currentSpeakingId === message.id }"
              role="button"
              :aria-label="'朗读' + message.sender + '的消息'"
              :title="'朗读' + message.sender + '的消息'"
              @click="$emit('speak-message', message)"
            >
              🔊
            </span>
          </div>
        </div>
        <div class="message-content">{{ message.content }}</div>
      </div>

      <div v-if="isRunning" class="thinking-indicator">
        <div class="thinking-dots">
          <span></span><span></span><span></span>
        </div>
        <span>模型正在思考...</span>
      </div>
    </div>

    <!-- 手动发送消息区域 -->
    <div class="control-area" v-if="!isRunning && currentViewMode === 'current'">
      <ElInput
        :model-value="manualMessage"
        type="textarea"
        :rows="1"
        placeholder="输入消息，Ctrl+Enter 发送"
        @keyup.enter.ctrl="handleSend"
        @input="$emit('update:manual-message', $event)"
        class="send-input"
      />
      <button class="btn-send" @click="handleSend" :disabled="sending">➤</button>
    </div>
    <div v-else-if="currentViewMode === 'history'" class="mode-bar mode-bar--history">
      👁 历史记录模式 - 仅供查看
    </div>
    <div v-else class="mode-bar mode-bar--running">
      ⚡ 自动回复模式运行中，点击"停止"结束
    </div>

    <!-- 底部设置按钮 -->
    <button class="settings-trigger" @click="showConfigDrawer = true" v-if="!isRunning && currentViewMode === 'current'">⚙</button>

    <!-- 抽屉遮罩 -->
    <div class="drawer-overlay" :class="{ 'visible': showConfigDrawer }" @click="showConfigDrawer = false"></div>

    <!-- 底部配置抽屉 -->
    <div class="config-drawer" :class="{ 'visible': showConfigDrawer }" v-if="!isRunning && currentViewMode === 'current'">
      <div class="drawer-handle"></div>
      <div class="drawer-header">
        <div class="drawer-title">⚙ 会话配置</div>
        <button class="drawer-close" @click="showConfigDrawer = false">✕</button>
      </div>
      <div class="drawer-content">
        <!-- 对话设置 -->
        <div class="drawer-section">
          <div class="section-title">💬 对话设置</div>

          <div class="config-row">
            <span class="config-label">主题</span>
            <ElInput
              :model-value="currentSession?.sessionTheme"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 4 }"
              placeholder="设置对话主题..."
              @blur="$emit('update-session')"
              @input="val => currentSession && (currentSession.sessionTheme = val)"
              class="config-input"
            />
          </div>

          <div class="config-row">
            <span class="config-label">规则</span>
            <ElSelect
              :model-value="selectedRuleId"
              placeholder="选择规则"
              clearable
              class="config-input"
              @change="$emit('rule-select', $event)"
            >
              <ElOption v-for="rule in ruleList" :key="rule.id" :label="rule.name" :value="rule.id" />
            </ElSelect>
          </div>

          <div class="config-row">
            <span class="config-label">模式</span>
            <div class="radio-group">
              <div class="radio-item" :class="{ 'active': chatMode === 'group' }" @click="$emit('mode-change', 'group')">群聊</div>
              <div class="radio-item" :class="{ 'active': chatMode === 'turn' }" @click="$emit('mode-change', 'turn')">轮流</div>
            </div>
          </div>

          <div class="config-row">
            <span class="config-label">参数</span>
            <div class="param-group">
              <div class="param-item">
                <ElInputNumber
                  :model-value="currentSession?.replyInterval || 2000"
                  :min="1000"
                  :max="10000"
                  step="1000"
                  size="small"
                  @change="val => $emit('update-field', 'replyInterval', val)"
                />
                <span class="param-unit">ms</span>
              </div>
              <div class="param-item">
                <ElInputNumber
                  :model-value="currentSession?.maxHistoryMessages || 10"
                  :min="1"
                  :max="50"
                  size="small"
                  @change="val => $emit('update-field', 'maxHistoryMessages', val)"
                />
                <span class="param-unit">条</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 参与用户 -->
        <div class="drawer-section">
          <div class="section-title">👥 参与用户</div>
          <div class="participant-chips">
            <div v-for="(userId, index) in userConfig" :key="index" class="participant-chip">
              <span class="participant-avatar" :style="getParticipantAvatarStyle(userList.find(u => u.id === userId)?.modelType)">
                {{ userList.find(u => u.id === userId)?.name?.charAt(0) || '?' }}
              </span>
              <span class="participant-name">{{ userList.find(u => u.id === userId)?.name || '未选择' }}</span>
              <span v-if="userList.find(u => u.id === userId)" class="participant-model" :class="getModelTagClass(userList.find(u => u.id === userId)?.modelType).replace('model-tag model-tag--', '')">
                {{ getModelDisplayName(userList.find(u => u.id === userId)?.modelType) }}
              </span>
              <button class="participant-remove" @click="$emit('remove-user', index)">×</button>
            </div>
            <el-popover
              placement="top-start"
              :width="400"
              trigger="click"
              popper-class="user-dropdown-popper"
            >
              <template #reference>
                <button class="add-chip">+</button>
              </template>
              <div class="user-grid">
                <div
                  v-for="user in availableUsers"
                  :key="user.id"
                  class="user-grid-item"
                  @click="$emit('add-user', user.id)"
                >
                  <span class="user-dropdown-avatar" :style="getParticipantAvatarStyle(user.modelType)">
                    {{ user.name?.charAt(0) || '?' }}
                  </span>
                  <span class="user-dropdown-name">{{ user.name }}</span>
                </div>
              </div>
            </el-popover>
          </div>
          <div v-if="userConfig.length === 0" class="user-empty">暂未添加用户</div>
        </div>
      </div>
    </div>
  </div>

  <!-- 欢迎屏幕 -->
  <div v-else class="welcome-screen">
    <div class="welcome-content">
      <div class="welcome-emoji">🤖</div>
      <div class="welcome-title">欢迎来到AI聊天室</div>
      <div class="welcome-subtitle">创建会话，添加AI角色，开始一场有趣的对话实验</div>
      <div class="welcome-hint">
        <span class="hint-icon">💡</span>
        <span>提示：先在左侧创建会话并添加AI角色</span>
      </div>
    </div>
    <!-- 装饰性元素 -->
    <div class="welcome-decor decor-1"></div>
    <div class="welcome-decor decor-2"></div>
    <div class="welcome-decor decor-3"></div>
  </div>
</template>

<style scoped>
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  min-height: 0;
  overflow: visible;
}

.content-header {
  height: 44px;
  padding: 0 16px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-card);
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-shrink: 0;
  box-sizing: border-box;
}

.header-left {
  display: flex;
  align-items: center;
  min-width: 0;
  flex: 1;
  height: 100%;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.content-header-title {
  font-size: var(--text-subheading);
  font-weight: var(--font-medium);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Mobile responsive adjustments */
@media screen and (max-width: 768px) {
  .main-content {
    overflow: auto;
    min-height: 0;
    height: auto;
    flex: 1;
    -webkit-overflow-scrolling: touch;
  }

  .content-header {
    height: 44px;
    padding: 0 16px 0 calc(60px + env(safe-area-inset-left));
    box-sizing: border-box;
  }

  .header-more-btn {
    width: 36px;
    height: 36px;
    border-radius: 50%;
  }

  .config-form {
    padding: 8px;
  }

  .config-card.is-collapsed {
    margin-bottom: 4px;
  }

  .config-grid {
    grid-template-columns: 1fr;
    gap: 12px;
  }

  .config-card-header {
    padding: 8px 12px;
    min-height: 36px;
    box-sizing: border-box;
  }

  .config-card-header .collapse-hint {
    display: none;
  }

  .config-card-header .config-card-title {
    font-size: 13px;
  }

  .config-card-body {
    padding: var(--space-md);
  }

  .config-row {
    flex-wrap: nowrap;
    gap: 6px;
  }

  .config-label {
    min-width: unset;
    width: auto;
    font-size: 12px;
    flex-shrink: 0;
  }

  .user-item {
    flex-wrap: nowrap;
    gap: 6px;
  }

  .user-select {
    width: 0;
    flex: 1;
    min-width: 0;
    margin-top: 0;
  }

  .chat-area {
    padding: 12px;
  }

  .message-content {
    padding: 12px 14px;
    font-size: 15px;
  }

  .message-sender {
    font-size: 15px;
  }

  .message-speaker-btn {
    width: 44px;
    height: 44px;
    margin: -8px -10px;
  }

  .control-area {
    padding: 12px;
  }

  /* Collapsed cards more compact on mobile */
  .config-card.is-collapsed .config-card-header {
    padding: 6px 12px;
    min-height: 32px;
  }

  .config-card.is-collapsed .collapse-icon {
    font-size: 10px;
  }

  .config-card.is-collapsed .config-card-title {
    font-size: 12px;
  }
}

.alert-bar {
  padding: 8px 16px;
  font-size: var(--text-secondary);
  display: flex;
  align-items: center;
  gap: 8px;
  animation: slideDown 0.3s var(--transition-spring);
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-bar--success {
  background: var(--success-light);
  color: var(--success);
}

.alert-bar--primary {
  background: var(--primary-light);
  color: var(--primary);
}

.alert-bar--info {
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.config-form {
  padding: var(--space-lg) var(--space-xl);
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
}

.config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: var(--space-lg);
  align-items: start;
}

/* Ensure cards expand properly on mobile */
@media screen and (max-width: 768px) {
  .config-grid {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .config-card {
    width: 100%;
  }

  .config-card.is-full-width {
    grid-column: auto;
  }
}

.config-card {
  background: var(--bg-input);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  transition: var(--transition);
}

.config-card:hover {
  border-color: var(--border-accent);
  box-shadow: var(--shadow-sm);
}

.config-card.is-collapsed {
  background: var(--bg-hover);
}

.config-card.is-full-width {
  grid-column: 1 / -1;
}

.config-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  background: var(--bg-hover);
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;
}

.config-card-header:hover {
  background: var(--bg-active);
}

.config-card:not(.is-collapsed) .config-card-header {
  background: var(--bg-card);
  border-bottom: 1px solid var(--border-light);
}

.config-card-title {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  font-weight: 600;
  color: var(--text-title);
}

.collapse-icon {
  font-size: 12px;
  transition: transform 0.25s ease;
  color: var(--text-secondary);
}

.config-card:not(.is-collapsed) .collapse-icon {
  transform: rotate(0deg);
}

.config-card.is-collapsed .collapse-icon {
  transform: rotate(-90deg);
}

.collapse-hint {
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  opacity: 0.7;
}

.config-card-body {
  display: none;
  padding: var(--space-lg);
}

.config-card:not(.is-collapsed) .config-card-body {
  display: block;
}

.config-card-body > div:not(.participants) {
  display: flex;
  flex-direction: column;
}

/* ========== Config Row ========== */
.config-row {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  margin-bottom: var(--space-md);
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-label {
  min-width: 60px;
  font-size: 0.875rem;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.config-input {
  flex: 1;
}

.config-number {
  display: flex;
  align-items: center;
  gap: 4px;
}

.config-unit {
  font-size: var(--text-caption);
  color: var(--text-secondary);
}

/* ========== Participants (Chip Style) ========== */
.participants {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
}

.participant {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  background: var(--bg-card);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-full);
  transition: var(--transition-spring);
}

.participant:hover {
  border-color: var(--primary);
  transform: scale(1.02);
}

.participant-avatar {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-full);
  background: linear-gradient(135deg, var(--success) 0%, var(--primary) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-white);
}

.participant-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--text-title);
}

.participant-model {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.participant-model.gpt {
  background: var(--success-light);
  color: var(--success);
}

.participant-model.qwen {
  background: var(--qwen-bg);
  color: var(--qwen-text);
}

.participant-model.minimax {
  background: var(--warning-light);
  color: var(--warning-text);
}

.participant-model.volcano {
  background: var(--volcano-bg);
  color: var(--volcano-text);
}

.participant-model.gemini {
  background: var(--gemini-bg);
  color: var(--gemini-text);
}

.participant-remove {
  width: 20px;
  height: 20px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: var(--transition);
}

.participant-remove:hover {
  background: var(--danger);
  color: var(--text-white);
}

.participant-add {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border: 2px dashed var(--border-primary);
  border-radius: var(--radius-full);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 0.875rem;
  transition: var(--transition);
}

.participant-add:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.user-empty {
  text-align: center;
  padding: 16px;
  color: var(--text-secondary);
  font-size: var(--text-caption);
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.user-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.user-grid-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.2s;
}

.user-grid-item:hover {
  background: var(--bg-sidebar);
}

.user-dropdown-avatar {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-full);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-white);
  flex-shrink: 0;
}

.user-dropdown-name {
  font-size: 0.875rem;
  color: var(--text-body);
}

.chat-area {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  min-height: 0;
  scrollbar-width: none; /* Firefox */
}

.chat-area::-webkit-scrollbar {
  display: none; /* Chrome/Safari/Edge */
}

.message-item {
  margin-bottom: 16px;
  animation: messageIn 0.4s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes messageIn {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.message-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.message-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  color: var(--text-white);
  font-size: 14px;
  box-shadow: var(--shadow-sm);
}

.message-avatar.gpt,
.message-avatar.OPENAI {
  background: linear-gradient(135deg, var(--success) 0%, var(--success-hover) 100%);
}

.message-avatar.qwen,
.message-avatar.QWEN {
  background: linear-gradient(135deg, #7070FF 0%, #5050D0 100%);
}

.message-avatar.minimax,
.message-avatar.MINIMAX {
  background: linear-gradient(135deg, var(--warning) 0%, #E09A00 100%);
}

.message-avatar.volcano,
.message-avatar.VOLCANO {
  background: linear-gradient(135deg, var(--danger) 0%, var(--danger-hover) 100%);
}

.message-avatar.gemini,
.message-avatar.GEMINI {
  background: linear-gradient(135deg, #8B5CF6 0%, #6D28D9 100%);
}

.message-avatar.xai,
.message-avatar.XAI {
  background: linear-gradient(135deg, #10A37F 0%, #0D7A5F 100%);
}

.message-sender {
  font-weight: var(--font-semibold);
  color: var(--text-title);
}

.model-tag-inline {
  margin-left: 8px;
}

.message-time {
  font-size: var(--text-caption);
  color: var(--text-secondary);
  margin-left: auto;
}

.message-actions {
  display: flex;
  gap: 4px;
}

.message-speaker-btn {
  cursor: pointer;
  opacity: 0.6;
  transition: opacity var(--transition);
  /* Ensure larger touch target for mobile */
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin: -6px -8px;
  border-radius: 4px;
}

.message-speaker-btn:hover {
  opacity: 1;
}

.message-speaker-btn.speaking {
  opacity: 1;
  animation: pulse 1s var(--transition-spring) infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.2); }
}

.message-content {
  padding: 14px 18px;
  border-radius: var(--radius-lg);
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-word;
  position: relative;
  box-shadow: var(--shadow-sm);
}

.message-item.user .message-content {
  background: linear-gradient(135deg, var(--primary-light) 0%, #FFF5F5 100%);
  color: var(--text-title);
  margin-left: 52px;
  border-bottom-right-radius: var(--radius-sm);
}

.message-item.ai .message-content {
  background: var(--bg-card);
  color: var(--text-body);
  border: 1px solid var(--border-light);
  margin-right: 52px;
  border-bottom-left-radius: var(--radius-sm);
}

.message-item.system .message-content {
  background: linear-gradient(135deg, var(--warning-light) 0%, #FFF8E6 100%);
  color: var(--warning-text);
  font-size: var(--text-secondary);
  text-align: center;
  border: 1px dashed var(--warning);
}

.thinking-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  color: var(--text-secondary);
  font-size: var(--text-secondary);
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  background: var(--primary);
  border-radius: var(--radius-full);
  animation: dotPulse 1.2s ease-in-out infinite;
}

.thinking-dots span:nth-child(1) {
  animation-delay: 0ms;
}

.thinking-dots span:nth-child(2) {
  animation-delay: 150ms;
}

.thinking-dots span:nth-child(3) {
  animation-delay: 300ms;
}

@keyframes dotPulse {
  0%, 60%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  30% {
    transform: scale(1);
    opacity: 1;
  }
}

.control-area {
  display: flex;
  align-items: flex-end;
  padding: 12px 16px;
  border-top: 1px solid var(--border-light);
  background: var(--bg-card);
  gap: 8px;
}

.send-input {
  flex: 1;
  min-width: 0;
}

.send-input :deep(.el-textarea__inner) {
  padding: 10px 14px;
  border-radius: 20px;
  resize: none;
  min-height: 40px !important;
  max-height: 120px;
}

html[data-theme="dark"] .send-input :deep(.el-textarea__inner) {
  background: var(--bg-input);
  color: var(--text-body);
  border-color: var(--border-primary);
}

.mode-bar {
  padding: 12px 16px;
  text-align: center;
  font-size: var(--text-secondary);
  border-top: 1px solid var(--border-light);
  animation: slideUp 0.3s var(--transition-spring);
}

/* 下拉菜单最大高度和滚动 */
:deep(.user-dropdown-popper) {
  max-height: none !important;
}

/* 重置可能的 ripple 效果 */
:deep(.el-dropdown-menu__item) {
  &::after {
    display: none !important;
  }
}

/* 移除默认 outline，但保留触摸反馈 */
:deep(*:focus) {
  outline: none;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.mode-bar--history {
  background: var(--warning-light);
  color: var(--warning-text);
}

.mode-bar--running {
  background: var(--success-light);
  color: var(--success);
}

.welcome-screen {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  background: var(--bg-main);
}

/* Subtle noise texture for depth */
.welcome-screen::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  opacity: 0.03;
  pointer-events: none;
}

.welcome-content {
  text-align: center;
  z-index: 1;
  animation: welcomeIn 0.6s cubic-bezier(0.25, 1, 0.5, 1);
}

@keyframes welcomeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.welcome-emoji {
  font-size: 5rem;
  margin-bottom: 20px;
  animation: float 3s cubic-bezier(0.25, 1, 0.5, 1) infinite;
  filter: drop-shadow(0 8px 24px rgba(255, 107, 107, 0.3));
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0deg); }
  25% { transform: translateY(-8px) rotate(2deg); }
  75% { transform: translateY(-4px) rotate(-2deg); }
  50% { transform: translateY(-12px) rotate(0deg); }
}

.welcome-title {
  font-size: 2.5rem;
  font-weight: var(--font-bold);
  color: var(--text-title);
  margin-bottom: 12px;
  letter-spacing: -0.02em;
}

.welcome-subtitle {
  font-size: 1.125rem;
  color: var(--text-secondary);
  margin-bottom: 32px;
  line-height: 1.6;
}

.welcome-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  font-size: var(--text-body-size);
  color: var(--text-secondary);
  background: var(--bg-card);
  padding: 12px 20px;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border-light);
  box-shadow: 0 2px 8px rgba(45, 42, 38, 0.06);
}

.hint-icon {
  font-size: var(--text-heading);
}

.welcome-decor {
  position: absolute;
  border-radius: 50%;
  /* Use radial gradient instead of blur for better performance */
}

.decor-1 {
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, var(--primary) 0%, var(--danger) 70%);
  opacity: 0.2;
  top: -150px;
  right: -100px;
  animation: decorDrift 20s ease-in-out infinite;
}

.decor-2 {
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, var(--success) 0%, var(--primary) 70%);
  opacity: 0.18;
  bottom: -100px;
  left: -80px;
  animation: decorDrift 25s ease-in-out infinite reverse;
}

.decor-3 {
  width: 200px;
  height: 200px;
  background: radial-gradient(circle, var(--warning) 0%, transparent 70%);
  opacity: 0.25;
  top: 20%;
  left: 5%;
  animation: decorDrift 15s ease-in-out infinite;
}

@keyframes decorDrift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  33% { transform: translate(30px, -20px) scale(1.05); }
  66% { transform: translate(-20px, 20px) scale(0.95); }
}

/* Model tag styles */
:deep(.model-tag) {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 2px 8px;
  line-height: 18px;
  border-radius: var(--radius-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
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

:deep(.model-tag--xai) {
  background: linear-gradient(135deg, #10A37F 0%, #0D7A5F 100%);
  color: var(--text-white);
  box-shadow: 0 2px 6px rgba(16, 163, 127, 0.3);
}

/* Reduced motion - respect user preference */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

/* ========== Header More Button ========== */
.header-more-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--bg-hover);
  border: none;
  font-size: 18px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.header-more-btn:hover {
  background: var(--bg-active);
  color: var(--text-title);
}

/* ========== Circular Buttons ========== */
.btn-circular {
  width: 36px !important;
  height: 36px !important;
  min-width: 36px !important;
  padding: 0 !important;
  border-radius: 50% !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  background: var(--primary) !important;
  border: none !important;
  color: var(--text-white) !important;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
}

.btn-circular i {
  margin: 0 !important;
  font-size: 16px !important;
}

.btn-circular:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
}

html[data-theme="dark"] .btn-circular {
  background: var(--primary) !important;
  color: var(--text-white) !important;
}

html[data-theme="dark"] .btn-circular:hover {
  background: var(--primary-hover) !important;
}

.btn-send {
  width: 44px !important;
  height: 44px !important;
  min-width: 44px !important;
  border-radius: 50% !important;
  background-color: transparent !important;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%) !important;
  border: none !important;
  color: var(--text-white) !important;
  font-size: 20px !important;
  box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3) !important;
  padding: 0 !important;
}

.btn-send:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4) !important;
}

html[data-theme="dark"] .btn-send {
  background-color: transparent !important;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%) !important;
  color: var(--text-white) !important;
  border-color: transparent !important;
}

html[data-theme="dark"] .btn-send:disabled {
  background-color: transparent !important;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%) !important;
  color: var(--text-white) !important;
  opacity: 0.6;
}

/* ========== Start/Stop Buttons ========== */
.btn-start {
  width: 32px;
  height: 32px;
  min-width: 32px;
  border-radius: 50%;
  background: transparent;
  border: 2px solid var(--border-primary);
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  padding: 0;
}

.btn-start:hover {
  border-color: var(--border-primary);
  color: var(--text-secondary);
}

.btn-start:active {
  transform: scale(0.95);
}

.btn-stop {
  background: transparent;
  border: 2px solid var(--border-primary);
  color: var(--text-secondary);
}

.btn-stop:hover {
  border-color: var(--border-primary);
  color: var(--text-secondary);
}

/* SVG icons in buttons */
.btn-start svg,
.btn-stop svg {
  fill: currentColor;
  display: block;
}

/* ========== Unified Action Buttons ========== */
.btn-action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: var(--text-small);
  font-weight: var(--font-medium);
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.btn-action--primary {
  background: var(--primary);
  color: var(--text-white);
}

.btn-action--primary:hover {
  background: var(--primary-hover);
}

html[data-theme="dark"] .btn-action--primary {
  background: var(--primary);
  color: var(--text-white);
}

html[data-theme="dark"] .btn-action--primary:hover {
  background: var(--primary-hover);
}

/* Text button style */
.btn-text {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: var(--text-small);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
}

.btn-text:hover:not(:disabled) {
  color: var(--primary);
  background: var(--bg-hover);
}

.btn-text:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-text--danger {
  color: var(--danger);
}

.btn-text--danger:hover:not(:disabled) {
  color: var(--danger-hover);
  background: var(--bg-hover);
}

html[data-theme="dark"] .btn-text {
  color: var(--text-secondary);
}

html[data-theme="dark"] .btn-text:hover:not(:disabled) {
  color: var(--primary);
}

html[data-theme="dark"] .btn-text--danger {
  color: var(--danger);
}

html[data-theme="dark"] .btn-text--danger:hover:not(:disabled) {
  color: var(--danger-hover);
}

/* ========== More Menu ========== */
.more-menu {
  position: fixed;
  top: 48px;
  right: 8px;
  background: var(--bg-card);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  opacity: 0;
  pointer-events: none;
  transform: translateY(-10px);
  transition: all 0.2s ease;
  z-index: 300;
}

.more-menu.visible {
  opacity: 1;
  pointer-events: auto;
  transform: translateY(0);
}

.more-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 20px;
  font-size: 14px;
  color: var(--text-body);
  cursor: pointer;
  transition: background 0.15s ease;
}

.more-menu-item:hover:not(.disabled) {
  background: var(--bg-hover);
}

.more-menu-item.disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ========== Settings Trigger Button ========== */
.settings-trigger {
  position: fixed;
  bottom: 16px;
  left: 16px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary) 0%, var(--primary-hover) 100%);
  color: var(--text-white);
  border: none;
  font-size: 18px;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(255, 107, 107, 0.4);
  z-index: 200;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.settings-trigger:hover {
  transform: scale(1.05);
}

.settings-trigger:active {
  transform: scale(0.95);
}

/* ========== Drawer Overlay ========== */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 300;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.25s ease;
}

.drawer-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

/* ========== Config Drawer ========== */
.config-drawer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  background: var(--bg-card);
  border-radius: 16px 16px 0 0;
  z-index: 400;
  transform: translateY(100%);
  transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  max-height: 85vh;
  max-height: 85dvh;
  display: flex;
  flex-direction: column;
}

.config-drawer.visible {
  transform: translateY(0);
}

.drawer-handle {
  width: 36px;
  height: 4px;
  background: var(--border-light);
  border-radius: 2px;
  margin: 8px auto;
  flex-shrink: 0;
}

.drawer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 16px 12px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-title);
}

.drawer-close {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--bg-hover);
  border: none;
  font-size: 16px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;
}

.drawer-close:hover {
  background: var(--bg-active);
}

.drawer-content {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px 20px;
  -webkit-overflow-scrolling: touch;
}

/* ========== Drawer Sections ========== */
.drawer-section {
  margin-bottom: 16px;
}

.drawer-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
}

/* ========== Drawer Config Rows ========== */
.config-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.config-row:last-child {
  margin-bottom: 0;
}

.config-label {
  font-size: 13px;
  color: var(--text-secondary);
  width: 50px;
  flex-shrink: 0;
}

.config-input {
  flex: 1;
  min-width: 0;
}

.config-input :deep(.el-textarea__inner) {
  resize: none;
  min-height: 36px;
  max-height: 100px;
  overflow-y: auto;
}

/* ========== Radio Group ========== */
.radio-group {
  display: flex;
  gap: 8px;
  flex: 1;
}

.radio-item {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid var(--border-light);
  border-radius: 8px;
  background: var(--bg-input);
  cursor: pointer;
  text-align: center;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all 0.2s ease;
}

.radio-item:hover {
  border-color: var(--border-accent);
}

.radio-item.active {
  border-color: var(--primary);
  background: var(--primary-light);
  color: var(--primary);
  font-weight: 600;
}

/* ========== Param Group ========== */
.param-group {
  display: flex;
  gap: 16px;
  flex: 1;
}

.param-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.param-item :deep(.el-input-number) {
  width: 80px;
}

.param-unit {
  font-size: 12px;
  color: var(--text-secondary);
}

/* ========== Participant Chips ========== */
.participant-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.participant-chip {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px 6px 6px;
  background: var(--bg-hover);
  border-radius: 20px;
  font-size: 13px;
  transition: background 0.2s ease;
}

.participant-chip:hover {
  background: var(--bg-active);
}

.participant-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--success) 0%, var(--success-hover) 100%);
  color: var(--text-white);
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.participant-name {
  font-weight: 500;
  color: var(--text-title);
}

.participant-model {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(32, 201, 151, 0.15);
  color: var(--success);
}

.participant-model.gpt {
  background: rgba(32, 201, 151, 0.15);
  color: var(--success);
}

.participant-model.qwen {
  background: rgba(112, 112, 255, 0.15);
  color: #7070FF;
}

.participant-model.minimax {
  background: rgba(255, 176, 32, 0.15);
  color: var(--warning);
}

.participant-model.volcano {
  background: rgba(232, 69, 69, 0.15);
  color: var(--danger);
}

.participant-model.gemini {
  background: rgba(139, 92, 246, 0.15);
  color: #8B5CF6;
}

.participant-remove {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.1);
  border: none;
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 2px;
  transition: all 0.15s ease;
}

.participant-remove:hover {
  background: var(--danger);
  color: var(--text-white);
}

.add-chip {
  padding: 6px 12px;
  border: 1.5px dashed var(--border-light);
  border-radius: 20px;
  background: transparent;
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.add-chip:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-light);
}

.user-empty {
  text-align: center;
  padding: 12px;
  color: var(--text-secondary);
  font-size: 13px;
}

.user-dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 2px 0;
}

.user-dropdown-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--text-white);
  flex-shrink: 0;
}

.user-dropdown-name {
  font-size: 14px;
  color: var(--text-body);
}

/* ========== Mobile Drawer Adjustments ========== */
@media screen and (max-width: 768px) {
  .config-drawer {
    max-height: 90vh;
    max-height: 90dvh;
  }

  .drawer-content {
    padding: 12px 14px 24px;
  }

  .section-title {
    font-size: 10px;
  }

  .config-label {
    width: 44px;
    font-size: 12px;
  }
}
</style>
