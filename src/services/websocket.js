import Stomp from 'stompjs'
import { getAccessToken } from './auth'
import API_BASE_URL from './config.js'

let stompClient = null
let messageCallback = null
let currentSubscription = null
let currentSessionId = null
let reconnectTimer = null
let isManualDisconnect = false

// Capacitor Android 环境检测 - 简化版
var WS_URL = 'ws://localhost:8080/ws'

// 如果 Capacitor 存在或非开发环境，使用远程服务器
if (typeof window !== 'undefined' && window.Capacitor) {
  WS_URL = 'ws://123.56.55.115:8090/ws'
} else if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
  // 生产环境使用当前主机
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = window.location.host;
  WS_URL = `${protocol}//${host}/ws`;
}

// 延迟重连（5秒）
const RECONNECT_DELAY = 5000

function doConnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }

  try {
    const socket = new WebSocket(WS_URL)
    stompClient = Stomp.over(socket)
    // 禁用 STOMP 的自动心跳，使用手动检测
    stompClient.heartbeat.outgoing = 0
    stompClient.heartbeat.incoming = 0

    stompClient.connect({'Authorization': `Bearer ${getAccessToken()}`}, (frame) => {
      console.log('WebSocket: Connected')
      isManualDisconnect = false

      // 重新订阅之前的 session
      if (currentSessionId && messageCallback) {
        const topic = `/topic/chat/${currentSessionId}`
        currentSubscription = stompClient.subscribe(topic, (message) => {
          try {
            const msg = JSON.parse(message.body)
            if (messageCallback) messageCallback(msg)
          } catch (e) {
            console.error('WebSocket: Parse error:', e)
          }
        }, { id: `sub-${currentSessionId}` })
      }
    }, (error) => {
      console.error('WebSocket: STOMP error:', error)
      // 非手动断开，自动重连
      if (!isManualDisconnect) {
        console.log(`WebSocket: Reconnecting in ${RECONNECT_DELAY}ms...`)
        reconnectTimer = setTimeout(doConnect, RECONNECT_DELAY)
      }
    })

    // 监听 WebSocket 断开
    socket.onclose = () => {
      console.log('WebSocket: Socket closed')
      if (!isManualDisconnect) {
        console.log(`WebSocket: Reconnecting in ${RECONNECT_DELAY}ms...`)
        reconnectTimer = setTimeout(doConnect, RECONNECT_DELAY)
      }
    }

    socket.onerror = (error) => {
      console.error('WebSocket: Socket error:', error)
    }
  } catch (e) {
    console.error('WebSocket: Setup error:', e)
    if (!isManualDisconnect) {
      reconnectTimer = setTimeout(doConnect, RECONNECT_DELAY)
    }
  }
}

export const websocket = {
  connect(sessionId, onMessage, onError = null) {
    this.disconnect()
    isManualDisconnect = false
    currentSessionId = sessionId
    messageCallback = onMessage

    doConnect()
  },

  disconnect() {
    isManualDisconnect = true
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
    if (currentSubscription) {
      try {
        currentSubscription.unsubscribe()
      } catch (e) {}
      currentSubscription = null
    }
    if (stompClient) {
      try {
        stompClient.disconnect()
      } catch (e) {}
      stompClient = null
    }
    currentSessionId = null
    messageCallback = null
  },

  async sendMessage(sessionId, content) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({ content })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '发送消息失败')
    }
    return await response.json()
  },

  async sendGroupMessage(sessionId, content) {
    const response = await fetch(`${API_BASE_URL}/sessions/${sessionId}/sendGroup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({ content })
    })
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || '发送群聊消息失败')
    }
    return await response.json()
  },

  isConnected() {
    return stompClient !== null && stompClient.connected
  }
}

export default websocket
