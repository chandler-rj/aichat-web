import { request } from './auth'

// 规则相关 API
export const rules = {
  // 获取规则列表
  async getRules() {
    const response = await request('GET', '/rules')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取规则列表失败')
  },

  // 获取单个规则
  async getRule(id) {
    const response = await request('GET', `/rules/${id}`)
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取规则信息失败')
  },

  // 创建规则
  async createRule(rule) {
    const response = await request('POST', '/rules', rule)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '创建规则失败')
  },

  // 更新规则
  async updateRule(id, rule) {
    const response = await request('PUT', `/rules/${id}`, rule)
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '更新规则失败')
  },

  // 删除规则
  async deleteRule(id) {
    await request('DELETE', `/rules/${id}`)
  }
}

export default rules