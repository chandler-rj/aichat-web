import API_BASE_URL from './config.js'
import { getAccessToken, getRefreshToken, request } from './auth'

// 重新导出供其他模块使用
export { getAccessToken, getRefreshToken }

// 用户相关 API
export const users = {
  // 获取当前账户的所有用户
  async getUsers() {
    const response = await request('GET', '/users')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取用户列表失败')
  },

  // 获取单个用户
  async getUser(id) {
    const response = await request('GET', `/users/${id}`)
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取用户信息失败')
  },

  // 创建用户
  async createUser(user) {
    const response = await request('POST', '/users', user)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '创建用户失败')
  },

  // 更新用户
  async updateUser(id, user) {
    const response = await request('PUT', `/users/${id}`, user)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '更新用户失败')
  },

  // 删除用户
  async deleteUser(id) {
    await request('DELETE', `/users/${id}`)
  },

  // 上传头像
  async uploadAvatar(id, file) {
    const formData = new FormData()
    formData.append('file', file)
    await request('POST', `/users/${id}/avatar`, formData, true)
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