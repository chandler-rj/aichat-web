import { getAccessToken } from './users'
import API_BASE_URL from './config.js'

// 模型相关 API
export const models = {
  // 获取支持的模型列表
  async getSupportedModels() {
    const response = await fetch(API_BASE_URL + '/models')
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取模型列表失败')
  },

  // 获取当前账户所有已配置的模型
  async getAccountConfig() {
    const response = await fetch(API_BASE_URL + '/config', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取账户配置失败')
  },

  // 获取指定模型的账户配置（未配置返回空对象）
  async getModelConfig(modelType) {
    const response = await fetch(API_BASE_URL + `/config/${modelType}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取模型配置失败')
  },

  // 保存账户模型配置
  async saveModelConfig(modelType, config) {
    const response = await fetch(API_BASE_URL + `/config/${modelType}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(config)
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '保存配置失败')
    }
  },

  // 删除账户模型配置
  async deleteModelConfig(modelType) {
    const response = await fetch(API_BASE_URL + `/config/${modelType}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (!response.ok) {
      throw new Error('删除配置失败')
    }
  },

  // 获取模型默认参数
  async getDefaultConfig(modelType) {
    const response = await fetch(API_BASE_URL + `/config/${modelType}/defaults`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取默认参数失败')
  },

  // 获取模型配置状态
  async getModelStatus(modelType) {
    const response = await fetch(API_BASE_URL + `/config/${modelType}/status`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取配置状态失败')
  },

  // 获取当前账户已配置的模型列表
  async getConfiguredModels() {
    const response = await fetch(API_BASE_URL + '/config/list', {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    if (response.ok) {
      return await response.json()
    }
    throw new Error('获取已配置模型列表失败')
  },

  // 测试模型连接
  async testModel(modelType, config) {
    const response = await fetch(API_BASE_URL + `/models/test/${modelType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify(config)
    })
    if (response.ok) {
      return await response.json()
    }
    const error = await response.json()
    throw new Error(error.message || '测试失败')
  }
}

export default models
