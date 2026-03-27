import API_BASE_URL from './config.js'

// 获取 accessToken
export const getAccessToken = () => localStorage.getItem('accessToken')
export const getRefreshToken = () => localStorage.getItem('refreshToken')

// 通用请求方法
export async function request(method, url, data = null, isFormData = false) {
  const accessToken = getAccessToken()
  const headers = {}
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`
  }

  const config = {
    method,
    headers,
    credentials: 'include'
  }

  if (data) {
    if (isFormData) {
      config.body = data
      // 如果是FormData，不设置Content-Type，让浏览器自动设置
    } else {
      headers['Content-Type'] = 'application/json'
      config.body = JSON.stringify(data)
    }
  }

  const response = await fetch(API_BASE_URL + url, config)

  // 如果返回 401（未授权/Token 过期），清除登录状态
  if (response.status === 401) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    // 刷新页面会触发重新初始化，自动跳转到登录
    window.location.reload()
    return response
  }

  return response
}

// 认证相关 API
export const auth = {
  // 获取当前用户信息
  async me() {
    const response = await request('GET', '/auth/me')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取用户信息失败')
  },

  // 登录
  async login(username, password, captchaId = '', captchaAnswer = '') {
    const response = await request('POST', '/auth/login', {
      username,
      password,
      captchaId,
      captchaAnswer
    })
    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return data
    }
    const error = await response.json()
    throw new Error(error.error || error.message || '登录失败')
  },

  // 注册
  async register(username, email, password, captchaId = '', captchaAnswer = '') {
    const response = await request('POST', '/auth/register', {
      username,
      email,
      password,
      captchaId,
      captchaAnswer
    })
    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return data
    }
    const error = await response.json()
    throw new Error(error.error || error.message || '注册失败')
  },

  // 刷新 Token
  async refresh() {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      throw new Error('没有刷新令牌')
    }
    const response = await request('POST', '/auth/refresh', { refreshToken })
    if (response.ok) {
      const data = await response.json()
      localStorage.setItem('accessToken', data.accessToken)
      localStorage.setItem('refreshToken', data.refreshToken)
      return data
    }
    throw new Error('刷新令牌失败')
  },

  // 登出
  async logout() {
    try {
      await request('POST', '/auth/logout')
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
    }
  },

  // 检查是否需要验证码
  async needsCaptcha(username = '') {
    const response = await request('GET', `/auth/needs-captcha?username=${encodeURIComponent(username)}`)
    if (response.ok) {
      const data = await response.json()
      return data.needsCaptcha
    }
    return false
  },

  // 重新发送验证邮件
  async resendVerification() {
    const response = await request('POST', '/auth/resend-verification')
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '发送失败')
    }
  },

  // 验证是否已登录
  isLoggedIn() {
    return !!getAccessToken()
  }
}

// 通用带认证的fetch请求，处理401自动退出
export async function authorizedFetch(url, config) {
  const accessToken = getAccessToken()
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }

  const response = await fetch(API_BASE_URL + url, {
    ...config,
    credentials: 'include'
  })

  // 如果返回 401（未授权/Token 过期），清除登录状态并刷新
  if (response.status === 401) {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
    window.location.reload()
  }

  return response
}

export default auth