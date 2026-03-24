<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { auth } from '../services/auth'
import API_BASE_URL from '../services/config'

const props = defineProps({
  visible: Boolean,
  mode: {
    type: String,
    default: 'login' // 'login' or 'register'
  }
})

const emit = defineEmits(['update:visible', 'success'])

const loginForm = ref({
  username: '',
  password: '',
  captchaId: '',
  captchaAnswer: ''
})

const registerForm = ref({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captchaId: '',
  captchaAnswer: ''
})

const captchaUrl = ref('')
const loginNeedsCaptcha = ref(false)
const authLoading = ref(false)
const authError = ref('')

watch(() => props.visible, (val) => {
  if (val) {
    authError.value = ''
    if (props.mode === 'register') {
      refreshCaptcha()
    }
  }
})

watch(() => props.mode, (val) => {
  authError.value = ''
  if (val === 'register') {
    refreshCaptcha()
  }
})

const refreshCaptcha = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/captcha/generate`)
    const data = await response.json()
    captchaUrl.value = data.image
    registerForm.value.captchaId = data.captchaId
    loginForm.value.captchaId = data.captchaId
  } catch (e) {
    console.error('获取验证码失败:', e)
  }
}

const checkLoginNeedsCaptcha = async () => {
  if (!loginForm.value.username) return
  try {
    const response = await fetch(`${API_BASE_URL}/auth/needs-captcha?username=${encodeURIComponent(loginForm.value.username)}`)
    if (response.ok) {
      const data = await response.json()
      loginNeedsCaptcha.value = data === true
      if (loginNeedsCaptcha.value) {
        refreshCaptcha()
      }
    }
  } catch (e) {
    console.error('检查验证码需求失败:', e)
  }
}

const handleClose = () => {
  emit('update:visible', false)
  authError.value = ''
  loginNeedsCaptcha.value = false
  loginForm.value = { username: '', password: '', captchaId: '', captchaAnswer: '' }
  registerForm.value = { username: '', email: '', password: '', confirmPassword: '', captchaId: '', captchaAnswer: '' }
}

const handleLogin = async () => {
  if (!loginForm.value.username || !loginForm.value.password) {
    ElMessage.warning('请输入用户名和密码')
    return
  }

  if (loginNeedsCaptcha.value && !loginForm.value.captchaAnswer) {
    ElMessage.warning('请输入图形验证码')
    return
  }

  authLoading.value = true
  authError.value = ''

  try {
    await auth.login(
      loginForm.value.username,
      loginForm.value.password,
      loginNeedsCaptcha.value ? loginForm.value.captchaId : '',
      loginNeedsCaptcha.value ? loginForm.value.captchaAnswer : ''
    )
    ElMessage.success('登录成功')
    handleClose()
    emit('success')
  } catch (e) {
    authError.value = e.message || '登录失败'
    // 如果错误提示需要验证码，自动显示验证码输入框
    if (authError.value.includes('图形验证码') || authError.value.includes('验证码')) {
      loginNeedsCaptcha.value = true
      refreshCaptcha()
      loginForm.value.captchaAnswer = ''
    }
  } finally {
    authLoading.value = false
  }
}

const handleRegister = async () => {
  if (!registerForm.value.username || !registerForm.value.email || !registerForm.value.password) {
    ElMessage.warning('请填写所有字段')
    return
  }

  if (registerForm.value.password !== registerForm.value.confirmPassword) {
    ElMessage.warning('两次密码输入不一致')
    return
  }

  if (registerForm.value.password.length < 6) {
    ElMessage.warning('密码长度不能少于6个字符')
    return
  }

  if (!registerForm.value.captchaId || !registerForm.value.captchaAnswer) {
    ElMessage.warning('请输入图形验证码')
    return
  }

  authLoading.value = true
  authError.value = ''

  try {
    await auth.register(
      registerForm.value.username,
      registerForm.value.email,
      registerForm.value.password,
      registerForm.value.captchaId,
      registerForm.value.captchaAnswer
    )
    ElMessage.success('注册成功')
    handleClose()
    emit('success')
    window.location.reload()
  } catch (e) {
    authError.value = e.message || '注册失败'
    // 如果是验证码错误，自动刷新验证码
    if (authError.value.includes('验证码') || authError.value.includes('captcha')) {
      refreshCaptcha()
      registerForm.value.captchaAnswer = ''
    }
  } finally {
    authLoading.value = false
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    :title="mode === 'login' ? '登录' : '注册'"
    width="90%"
    class="dialog--auth"
    :close-on-click-modal="false"
    @opened="mode === 'register' && refreshCaptcha()"
  >
    <!-- 登录表单 -->
    <ElForm v-if="mode === 'login'" label-width="80px">
      <ElFormItem label="用户名">
        <ElInput
          v-model="loginForm.username"
          placeholder="请输入用户名"
          @keyup.enter="handleLogin"
          @blur="checkLoginNeedsCaptcha"
        />
      </ElFormItem>
      <ElFormItem label="密码">
        <ElInput
          v-model="loginForm.password"
          type="password"
          placeholder="请输入密码"
          @keyup.enter="handleLogin"
        />
      </ElFormItem>
      <ElFormItem v-if="loginNeedsCaptcha" label="验证码">
        <div style="display: flex; gap: 10px;">
          <ElInput
            v-model="loginForm.captchaAnswer"
            placeholder="请输入验证码"
            style="flex: 1;"
            @keyup.enter="handleLogin"
          />
          <img
            :src="captchaUrl"
            @click="refreshCaptcha"
            style="height: 32px; cursor: pointer; border-radius: 4px;"
            alt="验证码"
          />
        </div>
      </ElFormItem>
      <div v-if="authError" class="auth-error">{{ authError }}</div>
    </ElForm>

    <!-- 注册表单 -->
    <ElForm v-else label-width="80px">
      <ElFormItem label="用户名">
        <ElInput
          v-model="registerForm.username"
          placeholder="请输入用户名 (3-50个字符)"
        />
      </ElFormItem>
      <ElFormItem label="邮箱">
        <ElInput
          v-model="registerForm.email"
          type="email"
          placeholder="请输入邮箱"
        />
      </ElFormItem>
      <ElFormItem label="密码">
        <ElInput
          v-model="registerForm.password"
          type="password"
          placeholder="请输入密码 (至少6个字符)"
        />
      </ElFormItem>
      <ElFormItem label="确认密码">
        <ElInput
          v-model="registerForm.confirmPassword"
          type="password"
          placeholder="请再次输入密码"
          @keyup.enter="handleRegister"
        />
      </ElFormItem>
      <ElFormItem label="验证码">
        <div style="display: flex; gap: 10px;">
          <ElInput
            v-model="registerForm.captchaAnswer"
            placeholder="请输入验证码"
            style="flex: 1;"
          />
          <img
            :src="captchaUrl"
            @click="refreshCaptcha"
            style="height: 32px; cursor: pointer; border-radius: 4px;"
            alt="验证码"
          />
        </div>
      </ElFormItem>
      <div v-if="authError" class="auth-error">{{ authError }}</div>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton v-if="mode === 'login'" type="primary" @click="handleLogin" :loading="authLoading">登录</ElButton>
      <ElButton v-else type="primary" @click="handleRegister" :loading="authLoading">注册</ElButton>
    </template>
  </ElDialog>
</template>

<style scoped>
.auth-error {
  color: var(--danger);
  font-size: var(--text-secondary);
  margin-top: 8px;
  padding: 8px;
  background: rgba(232, 69, 69, 0.1);
  border-radius: var(--radius-sm);
}
</style>
