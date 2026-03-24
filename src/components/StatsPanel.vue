<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElRow, ElCol, ElStatistic, ElMessage } from 'element-plus'
import { getAccessToken } from '../services/users'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible'])

const stats = ref({
  totalUsers: 0,
  adminUsers: 0,
  todayUsers: 0
})

watch(() => props.visible, (val) => {
  if (val) {
    loadStats()
  }
})

const loadStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/stats`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })

    if (response.ok) {
      stats.value = await response.json()
    }
  } catch (e) {
    console.error('加载统计信息失败:', e)
    ElMessage.error('加载统计信息失败')
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="统计信息"
    width="90%"
    class="dialog--stats"
    destroy-on-close
  >
    <ElRow :gutter="20">
      <ElCol :span="8">
        <ElStatistic title="总用户数" :value="stats.totalUsers" />
      </ElCol>
      <ElCol :span="8">
        <ElStatistic title="管理员数" :value="stats.adminUsers" />
      </ElCol>
      <ElCol :span="8">
        <ElStatistic title="今日注册" :value="stats.todayUsers" />
      </ElCol>
    </ElRow>
  </ElDialog>
</template>
