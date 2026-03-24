import { getAccessToken } from './users'
import API_BASE_URL from './config.js'

// 会话相关 API
export const sessions = {
  // 获取会话列表
  async getSessions() {
    const response = await fetch(API_BASE_URL + '/sessions', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取会话列表失败')
  },

  // 获取单个会话
  async getSession(id) {
    const response = await fetch(API_BASE_URL + `/sessions/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取会话信息失败')
  },

  // 创建会话
  async createSession(session) {
    const response = await fetch(API_BASE_URL + '/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(session)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '创建会话失败')
  },

  // 更新会话
  async updateSession(id, session) {
    const response = await fetch(API_BASE_URL + `/sessions/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(session)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '更新会话失败')
  },

  // 删除会话
  async deleteSession(id) {
    const response = await fetch(API_BASE_URL + `/sessions/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (!response.ok) {
      throw new Error('删除会话失败')
    }
  },

  // 发送消息
  async sendMessage(sessionId, message) {
    console.log('sessions.sendMessage: 发送消息到 session', sessionId, message)
    const response = await fetch(API_BASE_URL + `/sessions/${sessionId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(message)
    })
    if (response.ok) {
      const result = await response.json()
      console.log('sessions.sendMessage: 成功', result)
      return result
    }
    // 尝试读取错误信息
    let errorMsg = '发送消息失败'
    try {
      const error = await response.json()
      errorMsg = error.message || error.error || errorMsg
    } catch (e) {
      errorMsg = `HTTP ${response.status}: ${response.statusText}`
    }
    console.error('sessions.sendMessage: 失败', errorMsg)
    throw new Error(errorMsg)
  },

  // 获取历史会话分组
  async getHistoryGroups() {
    const response = await fetch(API_BASE_URL + '/session-history', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取历史会话失败')
  },

  // 获取历史会话消息
  async getHistorySnapshot(snapshotId) {
    const response = await fetch(API_BASE_URL + `/session-history/${snapshotId}/messages`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取历史会话消息失败')
  },

  // 导出会话
  async exportSession(id, format = 'json') {
    const response = await fetch(`${API_BASE_URL}/sessions/${id}/export${format === 'html' ? '/html' : ''}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.blob()
    }
    throw new Error('导出会话失败')
  },

  // 导入历史会话
  async importHistory(file) {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(API_BASE_URL + '/sessions/import', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: formData
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '导入会话失败')
  }
}

export default sessions