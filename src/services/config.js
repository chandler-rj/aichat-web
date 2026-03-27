// API 配置
// 从环境变量读取，默认为本地开发地址
var API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// Capacitor Android 环境检测 - APP 运行时使用远程服务器
if (typeof window !== 'undefined' && window.Capacitor) {
  // Android 原生环境 - 使用远程服务器（可通过环境变量覆盖）
  API_BASE_URL = import.meta.env.VITE_CAPACITOR_API_BASE_URL || 'http://123.56.55.115:8090/api'
}

export { API_BASE_URL }
export default API_BASE_URL