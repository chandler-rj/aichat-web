export { auth } from './auth'
export { users, getAccessToken, getRefreshToken } from './users'
export { sessions } from './sessions'
export { models } from './models'
export { rules } from './rules'
export { websocket } from './websocket'

// 导出所有服务
import auth from './auth'
import users from './users'
import sessions from './sessions'
import models from './models'
import rules from './rules'
import websocket from './websocket'

export default {
  auth,
  users,
  sessions,
  models,
  rules,
  websocket
}