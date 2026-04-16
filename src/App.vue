<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { auth, authorizedFetch } from './services/auth'
import { users } from './services/users'
import { sessions } from './services/sessions'
import { models } from './services/models'
import { rules } from './services/rules'
import { websocket } from './services/websocket'
import { Filesystem, Directory } from '@capacitor/filesystem'
import API_BASE_URL from './services/config'

import Sidebar from './components/Sidebar.vue'
import ChatArea from './components/ChatArea.vue'
import AuthDialog from './components/AuthDialog.vue'
import SessionDialog from './components/SessionDialog.vue'
import UserDialog from './components/UserDialog.vue'
import RuleDialog from './components/RuleDialog.vue'
import ModelConfigDialog from './components/ModelConfigDialog.vue'
import AccountManager from './components/AccountManager.vue'
import OperationLogs from './components/OperationLogs.vue'
import StatsPanel from './components/StatsPanel.vue'
import SettingsDialog from './components/SettingsDialog.vue'
import DebugDialog from './components/DebugDialog.vue'

// Theme state
const isDarkMode = ref(localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches))
const sidebarOpen = ref(false)

// Auth state
const isLoggedIn = ref(false)
const currentUser = ref(null)
const showLoginDialog = ref(false)
const showRegisterDialog = ref(false)
const showForgotDialog = ref(false)

// Session state
const sessionList = ref([])
const currentSession = ref(null)
const messages = ref([])
const showCreateSession = ref(false)
const newSession = ref({
  name: '',
  userDisplayName: '',
  sessionTheme: '',
  chatRules: ''
})

// User/Rule state
const userList = ref([])
const ruleList = ref([])
const supportedModels = ref({})
const avatarUpdateTime = ref({})

// Chat config
const userConfig = ref([])
const chatMode = ref('group')
const manualMessage = ref('')
const isRunning = ref(false)
const sending = ref(false)
const activeCollapse = ref([])
const selectedRuleId = ref('')
const selectedRuleContent = ref('')

// Admin state
const showAccountManager = ref(false)
const showOperationLogs = ref(false)
const showStats = ref(false)

// Settings
const showSettingsDialog = ref(false)

// Model config
const showModelConfig = ref(false)
const globalConfig = ref({
  OPENAI: { apiKey: '', baseUrl: 'https://api.openai.com/v1', model: 'gpt-3.5-turbo', maxTokens: '2048', temperature: '0.7' },
  QWEN: { apiKey: '', baseUrl: 'https://dashscope.aliyuncs.com/api/v1', model: 'qwen-turbo', maxTokens: '2048', temperature: '0.7' },
  MINIMAX: { apiKey: '', baseUrl: 'https://api.minimax.chat/v1', model: 'minimax-2.5', maxTokens: '2048', temperature: '0.7' },
  VOLCANO: { apiKey: '', baseUrl: 'https://ark.cn-beijing.volces.com/api/v3', model: 'doubao-2.5', maxTokens: '2048', temperature: '0.7' },
  GEMINI: { apiKey: '', baseUrl: 'https://generativelanguage.googleapis.com/v1beta', model: 'gemini-2.0-flash', maxTokens: '2048', temperature: '0.7' },
  XAI: { apiKey: '', baseUrl: 'https://api.x.ai/v1', model: 'grok-2', maxTokens: '2048', temperature: '0.7' }
})
const testingModel = ref(false)

// User dialog
const showUserDialog = ref(false)
const editingUser = ref(null)

// Rule dialog
const showRuleDialog = ref(false)
const editingRule = ref(null)

// Debug dialog
const showDebugDialog = ref(false)
const debugInitialConfig = ref(null)

// History
const historyGroups = ref([])
const historyCollapseOpen = ref(false)
const currentViewMode = ref('current')
const currentHistorySnapshot = ref(null)
const historySession = ref(null)
const historyMessages = ref([])

// Speaking state
const isSpeaking = ref(false)
const currentSpeakingId = ref(null)
const isAutoSpeaking = ref(false)
const autoSpeakIndex = ref(0)

// WebSocket
// Using websocket service from services/websocket.js

// Toggle theme
const toggleTheme = () => {
  isDarkMode.value = !isDarkMode.value
  if (isDarkMode.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('data-theme', 'dark')
    localStorage.setItem('theme', 'dark')
  } else {
    document.documentElement.setAttribute('data-theme', 'light')
    document.body.setAttribute('data-theme', 'light')
    localStorage.setItem('theme', 'light')
  }
}

// Initialize theme on mount
onMounted(async () => {
  if (isDarkMode.value) {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('data-theme', 'dark')
  }

  await initAuth()
  await loadSupportedModels()
  if (isLoggedIn.value) {
    await Promise.all([
      loadSessionList(),
      loadGlobalConfig(),
      loadUserList(),
      loadRuleList(),
      loadHistoryGroups()
    ])
  }
})

// Auth methods
const initAuth = async () => {
  const accessToken = localStorage.getItem('accessToken')
  const refreshToken = localStorage.getItem('refreshToken')
  if (accessToken && refreshToken) {
    try {
      currentUser.value = await auth.me()
      isLoggedIn.value = true
    } catch (e) {
      try {
        await refreshToken()
      } catch (e) {
        clearAuth()
      }
    }
  }
}

const refreshToken = async () => {
  const refreshTokenVal = localStorage.getItem('refreshToken')
  if (!refreshTokenVal) {
    clearAuth()
    return
  }
  try {
    const data = await auth.refresh()
    currentUser.value = data.user
    isLoggedIn.value = true
  } catch (e) {
    clearAuth()
  }
}

const clearAuth = () => {
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
  currentUser.value = null
  isLoggedIn.value = false
}

const handleLogout = async () => {
  try {
    await auth.logout()
  } catch (e) {
    console.error('Logout error:', e)
  }
  clearAuth()
  ElMessage.success('已退出登录')
}

const handleAuthSuccess = async () => {
  try {
    currentUser.value = await auth.me()
    isLoggedIn.value = true
    await Promise.all([
      loadSessionList(),
      loadGlobalConfig(),
      loadUserList(),
      loadRuleList(),
      loadHistoryGroups()
    ])
  } catch (e) {
    console.error('获取用户信息失败:', e)
  }
}

const handleForgotSuccess = () => {
  showForgotDialog.value = false
  showLoginDialog.value = true
}

const resendVerificationEmail = async () => {
  try {
    await auth.resendVerification()
    ElMessage.success('验证邮件已发送，请查收邮箱')
  } catch (e) {
    ElMessage.error('发送失败，请稍后重试')
  }
}

// Load data methods
const loadSupportedModels = async () => {
  try {
    supportedModels.value = await models.getSupportedModels()
  } catch (e) {
    console.error('加载模型列表失败:', e)
  }
}

const loadGlobalConfig = async () => {
  try {
    const config = await models.getGlobalConfig()
    if (config && Object.keys(config).length > 0) {
      for (const [modelType, modelConfig] of Object.entries(globalConfig.value)) {
        if (config[modelType]) {
          globalConfig.value[modelType] = { ...modelConfig, ...config[modelType] }
        }
      }
    }
  } catch (e) {
    console.error('加载配置失败:', e)
  }
}

const loadSessionList = async () => {
  try {
    sessionList.value = await sessions.getSessions()
  } catch (e) {
    console.error('加载会话列表失败:', e)
  }
}

const loadUserList = async () => {
  try {
    userList.value = await users.getUsers()
  } catch (e) {
    console.error('加载用户列表失败:', e)
  }
}

const loadRuleList = async () => {
  try {
    ruleList.value = await rules.getRules()
  } catch (e) {
    console.error('加载规则列表失败:', e)
  }
}

const loadHistoryGroups = async () => {
  try {
    historyGroups.value = await sessions.getHistoryGroups()
  } catch (e) {
    console.error('加载历史会话失败:', e)
  }
}

// Session methods
const handleCreateSession = () => {
  showCreateSession.value = true
}

const handleSessionCreated = async (session) => {
  await loadSessionList()
  await selectSession(session)
}

const selectSession = async (session) => {
  // If in history view, exit first
  if (currentViewMode.value === 'history') {
    currentViewMode.value = 'current'
    currentHistorySnapshot.value = null
    historySession.value = null
    historyMessages.value = []
  }

  // Close sidebar on mobile
  sidebarOpen.value = false

  // Disconnect old WebSocket
  websocket.disconnect()

  await new Promise(resolve => setTimeout(resolve, 500))

  currentSession.value = session
  messages.value = []
  isRunning.value = false

  // Load messages
  try {
    messages.value = await sessions.getSession(session.id).then(s => s.messages || [])
  } catch (e) {
    console.error('加载消息失败:', e)
  }

  // Parse user config（格式：1,2,3）
  if (session.userConfig) {
    const trimmed = session.userConfig.trim()
    if (trimmed) {
      userConfig.value = trimmed.split(',').map(s => parseInt(s.trim(), 10)).filter(n => !isNaN(n))
    } else {
      userConfig.value = []
    }
  } else {
    userConfig.value = []
  }

  // Sync rule content
  if (session.chatRules) {
    currentSession.value.chatRules = session.chatRules
    const matchedRule = ruleList.value.find(r => r.content === session.chatRules)
    selectedRuleId.value = matchedRule ? matchedRule.id : ''
  } else {
    currentSession.value.chatRules = ''
    selectedRuleId.value = ''
  }

  // Check if running
  try {
    const runningResp = await authorizedFetch(`/sessions/${session.id}/running`, {
      headers: {}
    })
    isRunning.value = await runningResp.json()
  } catch (e) {
    isRunning.value = false
  }

  await loadHistoryGroups()
  connectWebSocket()
}

const deleteSession = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该会话吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await sessions.deleteSession(id)
    await loadSessionList()
    if (currentSession.value?.id === id) {
      currentSession.value = null
      messages.value = []
    }
    ElMessage.success('会话已删除')
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除会话失败:', e)
    }
  }
}

// User methods
const handleAddUser = () => {
  editingUser.value = null
  showUserDialog.value = true
}

const handleEditUser = (user) => {
  editingUser.value = user
  showUserDialog.value = true
}

const handleUserSaved = async (userId) => {
  await loadUserList()
  if (userId) {
    avatarUpdateTime.value[userId] = Date.now()
  }
}

const deleteUser = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该用户吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await users.deleteUser(id)
    ElMessage.success('用户删除成功')
    await loadUserList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除用户失败:', e)
    }
  }
}

const addUser = (userId) => {
  if (userList.value.length === 0) {
    ElMessage.warning('请先创建用户')
    return
  }
  const targetUserId = userId || userList.value[0].id
  userConfig.value.push(targetUserId)
  updateSession()
}

const removeUser = (index) => {
  userConfig.value.splice(index, 1)
  updateSession()
}

// Rule methods
const handleAddRule = () => {
  editingRule.value = { id: null, name: '', content: '' }
  showRuleDialog.value = true
}

const handleEditRule = (rule) => {
  showRuleDialog.value = true
  editingRule.value = rule
}

const handleRuleSaved = async () => {
  await loadRuleList()
}

const deleteRule = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除该规则吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await rules.deleteRule(id)
    ElMessage.success('规则已删除')
    await loadRuleList()
  } catch (e) {
    if (e !== 'cancel') {
      console.error('删除规则失败:', e)
    }
  }
}

// Session update
const updateSession = async (newVal, index) => {
  if (!currentSession.value) return
  if (newVal !== undefined && index !== undefined) {
    userConfig.value[index] = newVal
  }
  currentSession.value.userConfig = userConfig.value.join(',')
  try {
    await sessions.updateSession(currentSession.value.id, currentSession.value)
    await loadSessionList()
  } catch (e) {
    console.error('更新会话失败:', e)
  }
}

const onModeChange = (mode) => {
  chatMode.value = mode
}

const updateSessionField = async (field, value) => {
  if (!currentSession.value) return
  if (field === 'maxHistoryMessages' || field === 'replyInterval') {
    currentSession.value[field] = value
    try {
      await sessions.updateSession(currentSession.value.id, currentSession.value)
    } catch (e) {
      console.error('更新会话失败:', e)
    }
  }
}

const onRuleSelect = (ruleId) => {
  if (ruleId) {
    const rule = ruleList.value.find(r => r.id === ruleId)
    if (rule) {
      selectedRuleId.value = ruleId
      currentSession.value.chatRules = rule.content
      updateSession()
    }
  } else {
    selectedRuleId.value = ''
    currentSession.value.chatRules = ''
    updateSession()
  }
}

// Chat methods
const startChat = async () => {
  if (userConfig.value.length < 2) {
    ElMessage.warning('请至少添加2个用户参与对话')
    return
  }
  if (!currentSession.value.sessionTheme) {
    ElMessage.warning('请输入对话主题')
    return
  }
  try {
    await authorizedFetch(`/sessions/${currentSession.value.id}/start`, {
      method: 'POST',
      headers: {}
    })
    isRunning.value = true
    ElMessage.success('对话已启动')
  } catch (e) {
    isRunning.value = false
    console.error('启动对话失败:', e)
  }
}

const stopChat = async () => {
  try {
    await authorizedFetch(`/sessions/${currentSession.value.id}/stop`, {
      method: 'POST',
      headers: {}
    })
    isRunning.value = false
    ElMessage.success('对话已停止')
  } catch (e) {
    isRunning.value = true
    console.error('停止对话失败:', e)
  }
}

const connectWebSocket = () => {
  if (!currentSession.value) {
    return
  }

  const sessionId = currentSession.value.id

  websocket.connect(sessionId, (message) => {
    // 添加新消息到列表
    messages.value.push(message)
    // 滚动到底部
    nextTick(() => {
      const chatContainer = document.querySelector('.messages-container')
      if (chatContainer) {
        chatContainer.scrollTop = chatContainer.scrollHeight
      }
    })
  }, (error) => {
    console.error('App: WebSocket连接错误:', error)
    ElMessage.error('WebSocket连接失败: ' + (error.message || error))
  })
}

const sendManualMessage = async () => {
  if (!manualMessage.value.trim()) return
  if (userConfig.value.length === 0) {
    ElMessage.warning('请先添加用户')
    return
  }

  // Show user message immediately
  const userMessage = {
    id: Date.now(),
    sender: '用户',
    content: manualMessage.value,
    createTime: new Date().toISOString()
  }
  messages.value.push(userMessage)
  manualMessage.value = ''

  sending.value = true
  try {
    if (chatMode.value === 'group') {
      const result = await sessions.sendMessage(currentSession.value.id, { content: userMessage.content })
    } else {
      for (let i = 0; i < userConfig.value.length; i++) {
        const userId = userConfig.value[i]
        const user = userList.value.find(u => u.id === userId)
        if (!user) continue
        const response = await authorizedFetch(`/sessions/${currentSession.value.id}/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: userMessage.content,
            modelType: user.modelType,
            userId: userId,
            pushUserMessage: i > 0
          })
        })
        if (!response.ok) {
          const err = await response.json().catch(() => ({ message: `HTTP ${response.status}` }))
          throw new Error(err.message || '发送消息失败')
        }
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  } catch (e) {
    console.error('App: 发送消息失败:', e)
    ElMessage.error(e.message || '发送消息失败')
  } finally {
    sending.value = false
  }
}

const clearMessages = async () => {
  try {
    await authorizedFetch(`/sessions/${currentSession.value.id}/messages`, {
      method: 'DELETE',
      headers: {}
    })
    messages.value = []
    ElMessage.success('消息已清空')
  } catch (e) {
    console.error('清空消息失败:', e)
  }
}

// History methods
const viewHistorySnapshot = async (snapshot) => {
  try {
    historySession.value = {
      id: snapshot.sessionId,
      name: snapshot.sessionName || '已删除会话'
    }
    currentViewMode.value = 'history'
    currentHistorySnapshot.value = snapshot
    historyMessages.value = await sessions.getHistorySnapshot(snapshot.id)
  } catch (e) {
    ElMessage.error('加载历史消息失败')
    currentViewMode.value = 'current'
  }
}

const deleteHistorySnapshot = async (id) => {
  try {
    await ElMessageBox.confirm('确定要删除这条历史记录吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await authorizedFetch(`/session-history/${id}`, {
      method: 'DELETE',
      headers: {}
    })
    ElMessage.success('删除成功')
    await loadHistoryGroups()
    if (currentHistorySnapshot.value?.id === id) {
      currentViewMode.value = 'current'
      currentHistorySnapshot.value = null
      historySession.value = null
      historyMessages.value = []
    }
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

const switchToCurrentView = () => {
  currentViewMode.value = 'current'
  currentHistorySnapshot.value = null
  historySession.value = null
  historyMessages.value = []
}

const viewHistory = () => {
  currentViewMode.value = 'history'
}

const importHistory = async () => {
  if (!currentSession.value) return
  try {
    await authorizedFetch(`/session-history`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: currentSession.value.id,
        label: 'manual',
        description: ''
      })
    })
    ElMessage.success('历史导入成功')
    await loadHistoryGroups()
  } catch (e) {
    ElMessage.error('导入失败')
  }
}

const exportMd = async () => {
  try {
    const blob = await sessions.exportSession(currentSession.value.id, 'markdown')
    const fileName = `${currentSession.value.name || 'export'}_${Date.now()}.md`

    // 检测是否为移动端 (Capacitor)
    if (typeof window.Capacitor !== 'undefined') {
      // 尝试使用 Share API（更可靠）
      if (navigator.share) {
        try {
          const file = new File([blob], fileName, { type: 'text/markdown' })
          await navigator.share({
            files: [file],
            title: fileName,
            text: 'AIChat 导出'
          })
          ElMessage.success('已分享文件')
          return
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.warn('Share 失败，尝试其他方式:', shareError)
          } else {
            return // 用户取消分享
          }
        }
      }

      // 回退：尝试 Filesystem
      if (window.Capacitor.Plugins?.Filesystem) {
        try {
          const base64 = await blobToBase64(blob)
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Documents,
            recursive: true
          })
          ElMessage.success('已保存到文档: ' + fileName)
          return
        } catch (fsError) {
          console.warn('Filesystem 写入失败:', fsError)
        }
      }
    }

    // PC 端：浏览器原生下载
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('已下载: ' + fileName)
  } catch (e) {
    console.error('Export error:', e)
    ElMessage.error('导出失败: ' + (e.message || e))
  }
}

const exportHtml = async () => {
  try {
    const blob = await sessions.exportSession(currentSession.value.id, 'html')
    const fileName = `${currentSession.value.name || 'export'}_${Date.now()}.html`

    // 检测是否为移动端 (Capacitor)
    if (typeof window.Capacitor !== 'undefined') {
      // 尝试使用 Share API（更可靠）
      if (navigator.share) {
        try {
          const file = new File([blob], fileName, { type: 'text/html' })
          await navigator.share({
            files: [file],
            title: fileName,
            text: 'AIChat 导出'
          })
          ElMessage.success('已分享文件')
          return
        } catch (shareError) {
          if (shareError.name !== 'AbortError') {
            console.warn('Share 失败，尝试其他方式:', shareError)
          } else {
            return // 用户取消分享
          }
        }
      }

      // 回退：尝试 Filesystem
      if (window.Capacitor.Plugins?.Filesystem) {
        try {
          const base64 = await blobToBase64(blob)
          const result = await Filesystem.writeFile({
            path: fileName,
            data: base64,
            directory: Directory.Documents,
            recursive: true
          })
          ElMessage.success('已保存到文档: ' + fileName)
          return
        } catch (fsError) {
          console.warn('Filesystem 写入失败:', fsError)
        }
      }
    }

    // PC 端：浏览器原生下载
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    ElMessage.success('已下载: ' + fileName)
  } catch (e) {
    console.error('Export error:', e)
    ElMessage.error('导出失败: ' + (e.message || e))
  }
}

// Blob 转 Base64 工具函数
const blobToBase64 = (blob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

// Speaking methods
const speakMessage = (message) => {
  if (!('speechSynthesis' in window)) {
    ElMessage.error('您的浏览器不支持朗读功能')
    return
  }

  if (isSpeaking.value) {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
    currentSpeakingId.value = null
  }

  if (!message.content?.trim()) return

  isSpeaking.value = true
  currentSpeakingId.value = message.id

  const utterance = new SpeechSynthesisUtterance(message.content)
  utterance.lang = 'zh-CN'

  utterance.onend = () => {
    isSpeaking.value = false
    currentSpeakingId.value = null
    if (isAutoSpeaking.value) {
      speakNextInAuto()
    }
  }

  utterance.onerror = () => {
    isSpeaking.value = false
    currentSpeakingId.value = null
    if (isAutoSpeaking.value) {
      speakNextInAuto()
    }
  }

  window.speechSynthesis.speak(utterance)
}

const autoSpeakAll = () => {
  if (!('speechSynthesis' in window)) {
    ElMessage.error('您的浏览器不支持朗读功能')
    return
  }
  if (messages.value.length === 0) {
    ElMessage.warning('没有消息可朗读')
    return
  }

  stopSpeaking()
  isAutoSpeaking.value = true
  autoSpeakIndex.value = 0
  speakNextInAuto()
}

const speakNextInAuto = () => {
  if (autoSpeakIndex.value >= messages.value.length) {
    stopSpeaking()
    ElMessage.success('所有消息朗读完成')
    return
  }
  const message = messages.value[autoSpeakIndex.value]
  autoSpeakIndex.value++
  if (!message.content?.trim()) {
    speakNextInAuto()
    return
  }
  speakMessage(message)
}

const stopSpeaking = () => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  isSpeaking.value = false
  currentSpeakingId.value = null
  isAutoSpeaking.value = false
  autoSpeakIndex.value = 0
}

// Model config
const openDebugDialog = (modelType, config) => {
  debugInitialConfig.value = { modelType, ...config }
  showDebugDialog.value = true
}
</script>

<template>
  <div id="app">
    <!-- 汉堡菜单按钮 (移动端显示) -->
    <button class="hamburger-btn" @click="sidebarOpen = !sidebarOpen">
      {{ sidebarOpen ? '✕' : '☰' }}
    </button>

    <!-- 侧边栏遮罩层 -->
    <div class="sidebar-overlay" :class="{ visible: sidebarOpen }" @click="sidebarOpen = false"></div>

    <div class="app-container">
      <!-- 侧边栏 -->
      <Sidebar
        :class="{ open: sidebarOpen }"
        :isLoggedIn="isLoggedIn"
        :currentUser="currentUser"
        :sessionList="sessionList"
        :currentSession="currentSession"
        :userList="userList"
        :ruleList="ruleList"
        :historyGroups="historyGroups"
        :isRunning="isRunning"
        :currentViewMode="currentViewMode"
        :currentHistorySnapshot="currentHistorySnapshot"
        :avatarUpdateTime="avatarUpdateTime"
        :globalConfig="globalConfig"
        :showModelConfig="showModelConfig"
        :showAccountManager="showAccountManager"
        :showOperationLogs="showOperationLogs"
        :showStats="showStats"
        :isDarkMode="isDarkMode"
        @toggle-theme="toggleTheme"
        @open-login="showLoginDialog = true"
        @open-register="showRegisterDialog = true"
        @logout="handleLogout"
        @resend-verification="resendVerificationEmail"
        @select-session="selectSession"
        @delete-session="deleteSession"
        @create-session="handleCreateSession"
        @add-rule="handleAddRule"
        @edit-rule="handleEditRule"
        @delete-rule="deleteRule"
        @add-user="handleAddUser"
        @edit-user="handleEditUser"
        @delete-user="deleteUser"
        @view-history-snapshot="viewHistorySnapshot"
        @delete-history-snapshot="deleteHistorySnapshot"
        @switch-to-current="switchToCurrentView"
        @view-history="viewHistory"
        @open-account-manager="showAccountManager = true"
        @open-operation-logs="showOperationLogs = true"
        @open-stats="showStats = true"
        @open-model-config="showModelConfig = true"
        @open-settings="showSettingsDialog = true"
      />

      <!-- 主内容区 -->
      <ChatArea
        :isLoggedIn="isLoggedIn"
        :currentSession="currentSession"
        :messages="messages"
        :userList="userList"
        :ruleList="ruleList"
        :userConfig="userConfig"
        :chatMode="chatMode"
        :isRunning="isRunning"
        :sending="sending"
        :manualMessage="manualMessage"
        :currentViewMode="currentViewMode"
        :historyMessages="historyMessages"
        :historySession="historySession"
        :selectedRuleId="selectedRuleId"
        :activeCollapse="activeCollapse"
        :isSpeaking="isSpeaking"
        :currentSpeakingId="currentSpeakingId"
        :isAutoSpeaking="isAutoSpeaking"
        @update:manual-message="manualMessage = $event"
        @send-manual="sendManualMessage"
        @start-chat="startChat"
        @stop-chat="stopChat"
        @clear-messages="clearMessages"
        @import-history="importHistory"
        @export-md="exportMd"
        @export-html="exportHtml"
        @update-session="updateSession"
        @mode-change="onModeChange"
        @update-field="updateSessionField"
        @rule-select="onRuleSelect"
        @add-user="addUser"
        @remove-user="removeUser"
        @switch-to-current="switchToCurrentView"
        @speak-message="speakMessage"
        @auto-speak-all="autoSpeakAll"
        @stop-speaking="stopSpeaking"
      />
    </div>

    <!-- 登录对话框 -->
    <AuthDialog
      :visible="showLoginDialog"
      mode="login"
      @update:visible="showLoginDialog = $event"
      @success="handleAuthSuccess"
      @forgot="showForgotDialog = true"
    />

    <!-- 注册对话框 -->
    <AuthDialog
      :visible="showRegisterDialog"
      mode="register"
      @update:visible="showRegisterDialog = $event"
      @success="handleAuthSuccess"
    />

    <!-- 忘记密码对话框 -->
    <AuthDialog
      :visible="showForgotDialog"
      mode="forgot"
      @update:visible="showForgotDialog = $event"
      @success="handleForgotSuccess"
    />

    <!-- 新建会话对话框 -->
    <SessionDialog
      :visible="showCreateSession"
      @update:visible="showCreateSession = $event"
      @created="handleSessionCreated"
    />

    <!-- 角色配置对话框 -->
    <UserDialog
      :key="editingUser?.id || 'new'"
      :visible="showUserDialog"
      :user="editingUser"
      :supportedModels="supportedModels"
      @update:visible="showUserDialog = $event"
      @saved="handleUserSaved"
    />

    <!-- 规则维护对话框 -->
    <RuleDialog
      :visible="showRuleDialog"
      :ruleList="ruleList"
      :editingRule="editingRule"
      @update:visible="showRuleDialog = $event"
      @update:editingRule="editingRule = $event"
      @saved="handleRuleSaved"
    />

    <!-- 全局模型配置对话框 -->
    <ModelConfigDialog
      :visible="showModelConfig"
      :globalConfig="globalConfig"
      :supportedModels="supportedModels"
      @update:visible="showModelConfig = $event"
      @saved="loadGlobalConfig"
      @open-debug="openDebugDialog"
    />

    <!-- 账户管理对话框 -->
    <AccountManager
      :visible="showAccountManager"
      @update:visible="showAccountManager = $event"
    />

    <!-- 操作日志对话框 -->
    <OperationLogs
      :visible="showOperationLogs"
      @update:visible="showOperationLogs = $event"
    />

    <!-- 统计信息对话框 -->
    <StatsPanel
      :visible="showStats"
      @update:visible="showStats = $event"
    />

    <!-- 设置对话框 -->
    <SettingsDialog
      :visible="showSettingsDialog"
      @update:visible="showSettingsDialog = $event"
      @logout="$emit('logout')"
    />

    <!-- 模型调试对话框 -->
    <DebugDialog
      :visible="showDebugDialog"
      :supportedModels="supportedModels"
      :initialConfig="debugInitialConfig"
      @update:visible="showDebugDialog = $event"
    />
  </div>
</template>

<style>
/* Global Reset */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  height: 100%;
  font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: var(--bg-main);
  color: var(--text-body);
}

#app {
  width: 100%;
  height: 100%;
}

/* App Container */
.app-container {
  display: flex;
  width: 100%;
  height: 100%;
}

/* Hamburger Button */
.hamburger-btn {
  display: none;
  position: fixed;
  top: calc(12px + env(safe-area-inset-top));
  left: 12px;
  z-index: 1001;
  width: 44px;
  height: 44px;
  border: none;
  border-radius: var(--radius-md);
  background: var(--bg-card);
  font-size: 20px;
  cursor: pointer;
  box-shadow: var(--shadow-md);
  color: var(--text-title);
  align-items: center;
  justify-content: center;
  transition: var(--transition-spring);
}

.hamburger-btn:hover {
  background: var(--bg-hover);
}

.hamburger-btn:active {
  transform: scale(0.9);
}

/* Sidebar Overlay */
.sidebar-overlay {
  display: none;
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  backdrop-filter: blur(2px);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
  touch-action: none;
}

.sidebar-overlay.visible {
  opacity: 1;
  pointer-events: auto;
}

/* Responsive */
@media screen and (max-width: 768px) {
  .hamburger-btn {
    display: flex;
  }

  .sidebar-overlay {
    display: block;
  }

  .app-container .sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100dvh;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    padding-left: env(safe-area-inset-left);
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    box-shadow: var(--shadow-lg);
  }

  .app-container .sidebar.open {
    transform: translateX(0);
  }

  .app-container .sidebar {
    pointer-events: none;
  }

  .app-container .sidebar.open {
    pointer-events: auto;
  }

  .content-header {
    padding-left: 60px !important;
  }

  /* Dialog responsive styles */
  :deep(.el-dialog) {
    width: 95% !important;
    max-width: 95vw;
    margin: 10px auto !important;
  }

  /* Fullscreen for large dialogs on mobile */
  :deep(.el-dialog--center) {
    display: flex;
    flex-direction: column;
    justify-content: center;
    min-height: calc(100vh - 20px);
  }

  /* Form items stack on mobile */
  :deep(.el-form-item) {
    flex-direction: column;
    margin-bottom: 12px;
  }

  :deep(.el-form-item__label) {
    text-align: left;
    width: 100% !important;
    line-height: 1.4;
    margin-bottom: 4px;
  }

  :deep(.el-form-item__content) {
    width: 100% !important;
    margin-left: 0 !important;
  }

  /* Table responsive */
  :deep(.el-table) {
    font-size: var(--text-caption);
  }

  :deep(.el-table__header) {
    font-size: var(--text-caption);
  }

  /* Pagination compact on mobile */
  :deep(.el-pagination) {
    justify-content: center;
  }
}

/* Tablet and desktop - constrain large dialogs */
@media screen and (min-width: 769px) {
  :deep(.dialog--accounts),
  :deep(.dialog--logs) {
    max-width: 900px;
  }

  :deep(.dialog--model),
  :deep(.dialog--debug) {
    max-width: 700px;
  }

  :deep(.dialog--rule),
  :deep(.dialog--session),
  :deep(.dialog--user),
  :deep(.dialog--stats) {
    max-width: 500px;
  }

  :deep(.dialog--auth),
  :deep(.dialog--account-edit),
  :deep(.dialog--rule-edit) {
    max-width: 400px;
  }
}

/* ========== Element Plus Dark Mode Overrides ========== */
/* Force Element Plus components to use our CSS variables */
html[data-theme="dark"] {
  --el-bg-color: var(--bg-card);
  --el-bg-color-overlay: var(--bg-card);
  --el-text-color-primary: var(--text-title);
  --el-text-color-regular: var(--text-body);
  --el-text-color-secondary: var(--text-secondary);
  --el-border-color: var(--border-light);
  --el-border-color-light: var(--border-primary);
  --el-fill-color-blank: var(--bg-input);
  --el-fill-color: var(--bg-hover);
  --el-color-primary: var(--primary);
}

html[data-theme="dark"] .el-dialog {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

html[data-theme="dark"] .el-dialog__header {
  border-bottom: 1px solid var(--border-light);
}

html[data-theme="dark"] .el-dialog__title {
  color: var(--text-title);
}

html[data-theme="dark"] .el-form-item__label {
  color: var(--text-body);
}

html[data-theme="dark"] .el-input__wrapper {
  background: var(--bg-input);
  box-shadow: none;
  border: 1px solid var(--border-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

html[data-theme="dark"] .el-input__wrapper:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

html[data-theme="dark"] .el-input__inner {
  color: var(--text-body);
}

html[data-theme="dark"] .el-input__inner::placeholder {
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-textarea__inner {
  background: var(--bg-input);
  color: var(--text-body);
  border: 1px solid var(--border-primary);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

html[data-theme="dark"] .el-textarea__inner:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

html[data-theme="dark"] .el-select-dropdown {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

html[data-theme="dark"] .el-select-dropdown__item {
  color: var(--text-body);
}

html[data-theme="dark"] .el-select-dropdown__item.hover,
html[data-theme="dark"] .el-select-dropdown__item:hover {
  background: var(--bg-hover);
}

html[data-theme="dark"] .el-tabs__item {
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-tabs__item.is-active {
  color: var(--primary);
}

html[data-theme="dark"] .el-tabs__active-bar {
  background: var(--primary);
}

html[data-theme="dark"] .el-table {
  background: transparent;
  color: var(--text-body);
}

html[data-theme="dark"] .el-table th.el-table__cell {
  background: var(--bg-hover);
  color: var(--text-title);
}

html[data-theme="dark"] .el-table tr {
  background: transparent;
}

html[data-theme="dark"] .el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell {
  background: var(--bg-hover);
}

html[data-theme="dark"] .el-pagination {
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-pagination button {
  background: var(--bg-card);
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-pager li {
  background: var(--bg-card);
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-pager li:hover {
  color: var(--primary);
}

html[data-theme="dark"] .el-message-box {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

html[data-theme="dark"] .el-message-box__title {
  color: var(--text-title);
}

html[data-theme="dark"] .el-message-box__message {
  color: var(--text-body);
}

/* Button text colors in dark mode */
html[data-theme="dark"] .el-button {
  color: var(--text-body);
  border-color: var(--border-light);
  background: var(--bg-card);
}

html[data-theme="dark"] .el-button:hover {
  color: var(--primary);
  border-color: var(--primary);
}

html[data-theme="dark"] .el-button--primary {
  color: var(--text-white);
  background: var(--primary);
  border-color: var(--primary);
}

html[data-theme="dark"] .el-button--primary:hover {
  color: var(--text-white);
  background: var(--primary-hover);
  border-color: var(--primary-hover);
}

html[data-theme="dark"] .el-button--danger {
  color: var(--text-white);
  background: var(--danger);
  border-color: var(--danger);
}

html[data-theme="dark"] .el-button--danger:hover {
  color: var(--text-white);
  background: var(--danger-hover);
  border-color: var(--danger-hover);
}

html[data-theme="dark"] .el-button--warning {
  color: var(--text-inverse);
  background: var(--warning);
  border-color: var(--warning);
}

html[data-theme="dark"] .el-button--text {
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-button--text:hover {
  color: var(--primary);
}

/* Switch in dark mode */
html[data-theme="dark"] .el-switch {
  background: var(--border-primary);
}

html[data-theme="dark"] .el-switch.is-checked {
  background: var(--primary);
}

/* Slider in dark mode */
html[data-theme="dark"] .el-slider__runway {
  background: var(--border-primary);
}

html[data-theme="dark"] .el-slider__bar {
  background: var(--primary);
}

html[data-theme="dark"] .el-slider__button {
  border-color: var(--primary);
  background: var(--bg-card);
}

/* Collapse in dark mode */
html[data-theme="dark"] .el-collapse {
  background: transparent;
}

html[data-theme="dark"] .el-collapse-item__header {
  color: var(--text-body);
  border-bottom: 1px solid var(--border-primary);
}

html[data-theme="dark"] .el-collapse-item__content {
  color: var(--text-body);
}

/* Dropdown menu in dark mode */
html[data-theme="dark"] .el-dropdown-menu {
  background: var(--bg-card);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-dropdown-menu__item {
  color: var(--text-body);
}

html[data-theme="dark"] .el-dropdown-menu__item:hover {
  background: var(--bg-hover);
}

html[data-theme="dark"] .el-dropdown-menu__item:focus {
  background: var(--bg-hover);
}

/* Radio in dark mode */
html[data-theme="dark"] .el-radio__label {
  color: var(--text-body);
}

html[data-theme="dark"] .el-radio__input.is-checked .el-radio__inner {
  background: var(--primary);
  border-color: var(--primary);
}

/* Tag in dark mode - ensure contrast */
html[data-theme="dark"] .el-tag {
  background: var(--bg-hover);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-tag.el-tag--info {
  background: var(--bg-hover);
  color: var(--text-secondary);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-tag--danger {
  background: rgba(232, 69, 69, 0.15);
  color: var(--danger);
  border-color: transparent;
}

html[data-theme="dark"] .el-tag--success {
  background: rgba(32, 201, 151, 0.15);
  color: var(--success);
  border-color: transparent;
}

html[data-theme="dark"] .el-tag--warning {
  background: rgba(255, 176, 32, 0.15);
  color: var(--warning);
  border-color: transparent;
}

html[data-theme="dark"] .el-tag--primary {
  background: rgba(255, 107, 107, 0.15);
  color: var(--primary);
  border-color: transparent;
}

/* Checkbox in dark mode */
html[data-theme="dark"] .el-checkbox__label {
  color: var(--text-body);
}

html[data-theme="dark"] .el-checkbox__input.is-checked .el-checkbox__inner {
  background: var(--primary);
  border-color: var(--primary);
}

html[data-theme="dark"] .el-checkbox__inner {
  background: var(--bg-input);
  border-color: var(--border-primary);
}

/* Input number */
html[data-theme="dark"] .el-input-number {
  background: var(--bg-input);
}

html[data-theme="dark"] .el-input-number .el-input__wrapper {
  background: var(--bg-input);
}

/* ========== Additional Dark Mode Fixes ========== */

/* Password input visibility toggle */
html[data-theme="dark"] .el-input__password-icon,
html[data-theme="dark"] .el-input__clear {
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-input__password-icon:hover,
html[data-theme="dark"] .el-input__clear:hover {
  color: var(--primary);
}

/* Select input */
html[data-theme="dark"] .el-select__wrapper {
  background: var(--bg-input);
  border: 1px solid var(--border-primary);
  box-shadow: none;
}

html[data-theme="dark"] .el-select__wrapper:hover {
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-select__wrapper.is-focused {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(255, 107, 107, 0.2);
}

html[data-theme="dark"] .el-select__selected-item,
html[data-theme="dark"] .el-select__placeholder {
  color: var(--text-body);
}

html[data-theme="dark"] .el-select-dropdown__item {
  color: var(--text-body);
}

html[data-theme="dark"] .el-select-dropdown__item.is-selected {
  color: var(--primary);
  background: var(--bg-hover);
}

html[data-theme="dark"] .el-select-dropdown__item.is-hovering {
  background: var(--bg-hover);
}

/* Form label */
html[data-theme="dark"] .el-form-item__label {
  color: var(--text-body);
}

/* Dialog body content */
html[data-theme="dark"] .el-dialog__body {
  color: var(--text-body);
}

/* Upload component */
html[data-theme="dark"] .el-upload-dragger {
  background: var(--bg-input);
  border-color: var(--border-primary);
}

html[data-theme="dark"] .el-upload-dragger:hover {
  border-color: var(--primary);
}

html[data-theme="dark"] .el-upload__text {
  color: var(--text-secondary);
}

/* Empty state */
html[data-theme="dark"] .el-empty__description {
  color: var(--text-secondary);
}

/* Scrollbar in dark mode */
html[data-theme="dark"] .el-scrollbar__bar {
  background: var(--border-primary);
}

html[data-theme="dark"] .el-scrollbar__thumb {
  background: var(--border-light);
}

html[data-theme="dark"] .el-scrollbar__thumb:hover {
  background: var(--text-secondary);
}

/* Tooltip */
html[data-theme="dark"] .el-tooltip__popper {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

html[data-theme="dark"] .el-tooltip__popper .el-tooltip__arrow::before {
  background: var(--bg-card);
  border-color: var(--border-light);
}

/* Popover */
html[data-theme="dark"] .el-popover {
  background: var(--bg-card);
  border: 1px solid var(--border-light);
}

html[data-theme="dark"] .el-popover__title {
  color: var(--text-title);
}

/* DatePicker */
html[data-theme="dark"] .el-date-editor {
  background: var(--bg-input);
}

html[data-theme="dark"] .el-picker-panel {
  background: var(--bg-card);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-picker-panel__body {
  color: var(--text-body);
}

html[data-theme="dark"] .el-date-table td.available:hover,
html[data-theme="dark"] .el-date-table td.current:not(.disabled) {
  background: var(--bg-hover);
}

html[data-theme="dark"] .el-date-table td.in-range {
  background: var(--bg-hover);
}

/* Autocomplete */
html[data-theme="dark"] .el-autocomplete-suggestion {
  background: var(--bg-card);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-autocomplete-suggestion li {
  color: var(--text-body);
}

html[data-theme="dark"] .el-autocomplete-suggestion li:hover {
  background: var(--bg-hover);
}

/* Cascader */
html[data-theme="dark"] .el-cascader-menu {
  background: var(--bg-card);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-cascader-menu__list {
  background: var(--bg-card);
}

html[data-theme="dark"] .el-cascader-node {
  color: var(--text-body);
}

html[data-theme="dark"] .el-cascader-node:hover {
  background: var(--bg-hover);
}

html[data-theme="dark"] .el-cascader-node.in-checked-path {
  color: var(--primary);
}

/* ColorPicker */
html[data-theme="dark"] .el-color-picker__trigger {
  background: var(--bg-input);
  border-color: var(--border-primary);
}

/* Transfer */
html[data-theme="dark"] .el-transfer-panel {
  background: var(--bg-card);
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-transfer-panel__body {
  background: var(--bg-input);
}

html[data-theme="dark"] .el-transfer-panel__item {
  color: var(--text-body);
}

html[data-theme="dark"] .el-transfer-panel__item:hover {
  background: var(--bg-hover);
}

/* Steps */
html[data-theme="dark"] .el-step__title {
  color: var(--text-body);
}

html[data-theme="dark"] .el-step__description {
  color: var(--text-secondary);
}

/* Timeline */
html[data-theme="dark"] .el-timeline-item__content {
  color: var(--text-body);
}

/* Card in dialogs */
html[data-theme="dark"] .el-card {
  background: var(--bg-card);
  border-color: var(--border-light);
}

/* Alert */
html[data-theme="dark"] .el-alert__title {
  color: var(--text-body);
}

/* Loading */
html[data-theme="dark"] .el-loading-mask {
  background: rgba(0, 0, 0, 0.5);
}

html[data-theme="dark"] .el-loading-spinner .el-loading-text {
  color: var(--text-body);
}

/* Badge */
html[data-theme="dark"] .el-badge__content {
  background: var(--primary);
}

/* Progress */
html[data-theme="dark"] .el-progress__text {
  color: var(--text-secondary);
}

/* Link */
html[data-theme="dark"] .el-link__inner {
  color: var(--primary);
}

/* Divider */
html[data-theme="dark"] .el-divider {
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-divider__text {
  background: var(--bg-card);
  color: var(--text-secondary);
}

/* Avatar */
html[data-theme="dark"] .el-avatar {
  background: var(--bg-hover);
  color: var(--text-body);
}

/* Skeleton */
html[data-theme="dark"] .el-skeleton__item {
  background: linear-gradient(to right, var(--bg-hover) 8%, var(--bg-card) 18%, var(--bg-hover) 33%);
}

/* Descriptions */
html[data-theme="dark"] .el-descriptions__label {
  color: var(--text-secondary);
}

html[data-theme="dark"] .el-descriptions__content {
  color: var(--text-body);
}

/* Calendar */
html[data-theme="dark"] .el-calendar {
  background: var(--bg-card);
}

html[data-theme="dark"] .el-calendar__header {
  border-color: var(--border-light);
}

html[data-theme="dark"] .el-calendar__body {
  color: var(--text-body);
}

/* Image */
html[data-theme="dark"] .el-image__placeholder {
  background: var(--bg-hover);
}

/* Backtop */
html[data-theme="dark"] .el-backtop {
  background: var(--bg-card);
  color: var(--text-body);
}

/* Drawer */
html[data-theme="dark"] .el-drawer {
  background: var(--bg-card);
}

html[data-theme="dark"] .el-drawer__header {
  border-color: var(--border-light);
  color: var(--text-title);
}

html[data-theme="dark"] .el-drawer__body {
  color: var(--text-body);
}

/* Dropdown in dialogs */
html[data-theme="dark"] .el-dropdown-menu__item {
  color: var(--text-body);
}
</style>
