import { getAccessToken } from './auth'
import API_BASE_URL from './config.js'

// 规则相关 API
export const rules = {
  // 获取规则列表
  async getRules() {
    const response = await fetch(API_BASE_URL + '/rules', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取规则列表失败')
  },

  // 获取单个规则
  async getRule(id) {
    const response = await fetch(API_BASE_URL + `/rules/${id}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取规则信息失败')
  },

  // 创建规则
  async createRule(rule) {
    const response = await fetch(API_BASE_URL + '/rules', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(rule)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '创建规则失败')
  },

  // 更新规则
  async updateRule(id, rule) {
    const response = await fetch(API_BASE_URL + `/rules/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(rule)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '更新规则失败')
  },

  // 删除规则
  async deleteRule(id) {
    const response = await fetch(API_BASE_URL + `/rules/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (!response.ok) {
      throw new Error('删除规则失败')
    }
  }
}

export default rules