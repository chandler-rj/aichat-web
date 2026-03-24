// API 配置 - 远程服务器
var API_BASE_URL = 'http://123.56.55.115:8090/api'

// Capacitor Android 环境检测
if (typeof window !== 'undefined' && window.Capacitor) {
  // Android 原生环境 - 使用远程服务器
  API_BASE_URL = 'http://123.56.55.115:8090/api'
}

export { API_BASE_URL }
export default API_BASE_URL