<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElTable, ElTableColumn, ElPagination, ElMessage } from 'element-plus'
import { getAccessToken } from '../services/users'
import API_BASE_URL from '../services/config'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible'])

const operationLogs = ref([])
const logPage = ref(1)
const logPageSize = ref(20)
const logTotal = ref(0)

watch(() => props.visible, (val) => {
  if (val) {
    logPage.value = 1
    loadOperationLogs()
  }
})

const loadOperationLogs = async () => {
  try {
    const params = new URLSearchParams()
    params.append('page', logPage.value - 1)
    params.append('size', logPageSize.value)

    const response = await fetch(`${API_BASE_URL}/admin/logs?${params.toString()}`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })

    if (response.ok) {
      const data = await response.json()
      operationLogs.value = data.content || data.records || []
      logTotal.value = data.totalElements || data.total || 0
    }
  } catch (e) {
    console.error('加载操作日志失败:', e)
    ElMessage.error('加载操作日志失败')
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const formatDateTime = (dateStr) => {
  if (!dateStr) return '-'
  const d = new Date(dateStr)
  return d.toLocaleString('zh-CN')
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="操作日志"
    width="90%"
    class="dialog--logs"
    destroy-on-close
  >
    <ElTable :data="operationLogs" stripe style="width: 100%">
      <ElTableColumn prop="id" label="ID" width="60" />
      <ElTableColumn prop="accountId" label="账户ID" width="80" />
      <ElTableColumn prop="action" label="操作" width="120" />
      <ElTableColumn prop="details" label="详情" />
      <ElTableColumn prop="ip" label="IP地址" width="120" />
      <ElTableColumn prop="timestamp" label="时间" width="160">
        <template #default="{ row }">
          {{ formatDateTime(row.timestamp) }}
        </template>
      </ElTableColumn>
    </ElTable>

    <ElPagination
      v-model:current-page="logPage"
      :page-size="logPageSize"
      :total="logTotal"
      layout="total, prev, pager, next"
      style="margin-top: 16px; text-align: right"
      @current-change="loadOperationLogs"
    />
  </ElDialog>
</template>
