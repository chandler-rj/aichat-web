import { request } from './auth'

// 会话相关 API
export const sessions = {
  // 获取会话列表
  async getSessions() {
    const response = await request('GET', '/sessions')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取会话列表失败')
  },

  // 获取单个会话
  async getSession(id) {
    const response = await request('GET', '/sessions/' + id)
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取会话信息失败')
  },

  // 创建会话
  async createSession(session) {
    const response = await request('POST', '/sessions', session)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '创建会话失败')
  },

  // 更新会话
  async updateSession(id, session) {
    const response = await request('PUT', '/sessions/' + id, session)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '更新会话失败')
  },

  // 删除会话
  async deleteSession(id) {
    await request('DELETE', '/sessions/' + id)
  },

  // 发送消息
  async sendMessage(sessionId, message) {
    const response = await request('POST', '/sessions/' + sessionId + '/send', message)
    if (response.ok) {
      const result = await response.json()
      return result
    }
    // 尝试读取错误信息
    let errorMsg = '发送消息失败'
    try {
      const error = await response.json()
      errorMsg = error.message || error.error || errorMsg
    } catch (e) {
      errorMsg = 'HTTP ' + response.status + ': ' + response.statusText
    }
    console.error('sessions.sendMessage: 失败', errorMsg)
    throw new Error(errorMsg)
  },

  // 获取历史会话分组
  async getHistoryGroups() {
    const response = await request('GET', '/session-history')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取历史会话失败')
  },

  // 获取历史会话消息
  async getHistorySnapshot(snapshotId) {
    const response = await request('GET', '/session-history/' + snapshotId + '/messages')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取历史会话消息失败')
  },

  // 导出会话
  async exportSession(id, format = 'json') {
    let path = '/sessions/' + id + '/export'
    if (format === 'html') {
      path += '/html'
    }
    const response = await request('GET', path)
    if (response.ok) {
      return await response.blob()
    }
    throw new Error('导出会话失败')
  },

  // 导入历史会话
  async importHistory(file) {
    const formData = new FormData()
    formData.append('file', file)
    const response = await request('POST', '/sessions/import', formData, true)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '导入会话失败')
  }
}

export default sessions
