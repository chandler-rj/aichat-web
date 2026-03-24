import API_BASE_URL from './config.js'
import { getAccessToken, getRefreshToken } from './auth'

// 重新导出供其他模块使用
export { getAccessToken, getRefreshToken }

// 用户相关 API
export const users = {
  // 获取当前账户的所有用户
  async getUsers() {
    const response = await fetch(API_BASE_URL + '/users', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取用户列表失败')
  },

  // 获取单个用户
  async getUser(id) {
    const response = await fetch(API_BASE_URL + `/users/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取用户信息失败')
  },

  // 创建用户
  async createUser(user) {
    const response = await fetch(API_BASE_URL + '/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(user)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '创建用户失败')
  },

  // 更新用户
  async updateUser(id, user) {
    const response = await fetch(API_BASE_URL + `/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(user)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '更新用户失败')
  },

  // 删除用户
  async deleteUser(id) {
    const response = await fetch(API_BASE_URL + `/users/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (!response.ok) {
      throw new Error('删除用户失败')
    }
  },

  // 上传头像
  async uploadAvatar(id, file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(API_BASE_URL + `/users/${id}/avatar`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: formData
    })
    if (!response.ok) {
      throw new Error('上传头像失败')
    }
  },

  // 获取头像 URL
  getAvatarUrl(userId, timestamp = '') {
    return `${API_BASE_URL}/users/${userId}/avatar${timestamp ? '?t=' + timestamp : ''}`
  },

  // 检查头像是否存在
  async avatarExists(id) {
    const response = await fetch(API_BASE_URL + `/users/${id}/avatar/exists`)
    if (response.ok) {
      const data = await response.json()
      return data.exists
    }
    return false
  }
}

export default users