// API 配置
// 从环境变量读取，默认为相对路径（通过 nginx 代理）
var API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

// Capacitor Android 环境检测 - APP 运行时使用远程服务器
// 更健壮的检测：检查 navigator.userAgent 也包含 Android/Capacitor
if (typeof window !== 'undefined') {
  const isCapacitor =
    (window.Capacitor !== undefined) ||
    (navigator && navigator.userAgent && /Capacitor|Android/i.test(navigator.userAgent));
  if (isCapacitor) {
    // Android 原生环境 - 使用远程服务器（可通过环境变量覆盖）
    API_BASE_URL = import.meta.env.VITE_CAPACITOR_API_BASE_URL || 'http://123.56.55.115:8090/api';
  }
}

export { API_BASE_URL }
export default API_BASE_URL