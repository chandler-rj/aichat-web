<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElSelect, ElOption, ElInputNumber, ElSlider, ElMessage, ElTag } from 'element-plus'
import { getAccessToken } from '../services/users'
import API_BASE_URL from '../services/config.js'

const props = defineProps({
  visible: Boolean,
  supportedModels: Object,
  initialConfig: Object  // { modelType, apiKey, baseUrl, model, maxTokens, temperature }
})

const emit = defineEmits(['update:visible'])

const debugConfig = ref({
  modelType: 'OPENAI',
  sessionTheme: '',
  userMessage: '',
  apiKey: '',
  baseUrl: '',
  model: '',
  maxTokens: 2048,
  temperature: 0.7
})

const debugRequestJson = ref('')
const debugResponse = ref('')
const debugResponseSuccess = ref(false)
const previewLoading = ref(false)
const debugLoading = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    // Initialize with default values
    debugRequestJson.value = ''
    debugResponse.value = ''
    debugResponseSuccess.value = false

    // If initialConfig is provided, pre-fill the form
    if (props.initialConfig) {
      debugConfig.value.modelType = props.initialConfig.modelType || 'OPENAI'
      debugConfig.value.apiKey = props.initialConfig.apiKey || ''
      debugConfig.value.baseUrl = props.initialConfig.baseUrl || ''
      debugConfig.value.model = props.initialConfig.model || ''
      debugConfig.value.maxTokens = props.initialConfig.maxTokens ? parseInt(props.initialConfig.maxTokens) : 2048
      debugConfig.value.temperature = props.initialConfig.temperature ? parseFloat(props.initialConfig.temperature) : 0.7
    }
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const previewDebugJson = async () => {
  if (!debugConfig.value.userMessage) {
    ElMessage.warning('请输入用户消息')
    return
  }

  previewLoading.value = true
  try {
    const response = await fetch(`${API_BASE_URL}/models/debug/preview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({
        modelType: debugConfig.value.modelType,
        systemPrompt: debugConfig.value.sessionTheme,
        userMessage: debugConfig.value.userMessage,
        config: {
          apiKey: debugConfig.value.apiKey,
          baseUrl: debugConfig.value.baseUrl,
          model: debugConfig.value.model,
          maxTokens: debugConfig.value.maxTokens,
          temperature: debugConfig.value.temperature
        }
      })
    })

    const result = await response.json()
    if (result.success) {
      debugRequestJson.value = JSON.stringify(result.previewJson, null, 2)
      ElMessage.success('预览成功')
    } else {
      ElMessage.error(result.error || '预览失败')
    }
  } catch (e) {
    ElMessage.error(e.message || '预览失败')
  } finally {
    previewLoading.value = false
  }
}

const sendDebugRequest = async () => {
  if (!debugConfig.value.userMessage) {
    ElMessage.warning('请输入用户消息')
    return
  }

  debugLoading.value = true
  debugResponse.value = ''
  try {
    const response = await fetch(`${API_BASE_URL}/models/debug/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAccessToken()}`
      },
      body: JSON.stringify({
        modelType: debugConfig.value.modelType,
        systemPrompt: debugConfig.value.sessionTheme,
        userMessage: debugConfig.value.userMessage,
        config: {
          apiKey: debugConfig.value.apiKey,
          baseUrl: debugConfig.value.baseUrl,
          model: debugConfig.value.model,
          maxTokens: debugConfig.value.maxTokens,
          temperature: debugConfig.value.temperature
        }
      })
    })

    const result = await response.json()
    if (result.success) {
      debugRequestJson.value = JSON.stringify(result.requestJson, null, 2)
      debugResponse.value = result.response
      debugResponseSuccess.value = true
      ElMessage.success('请求成功')
    } else {
      debugResponse.value = result.error || '请求失败'
      debugResponseSuccess.value = false
      ElMessage.error(result.error || '请求失败')
    }
  } catch (e) {
    debugResponse.value = e.message || '请求失败'
    debugResponseSuccess.value = false
    ElMessage.error(e.message || '请求失败')
  } finally {
    debugLoading.value = false
  }
}

const copyJson = (jsonStr) => {
  navigator.clipboard.writeText(jsonStr).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="模型调试工具"
    width="90%"
    class="dialog--debug"
    :max-height="'80vh'"
    destroy-on-close
  >
    <ElForm label-width="100px">
      <ElFormItem label="模型类型">
        <ElSelect v-model="debugConfig.modelType" placeholder="选择模型" style="width: 100%" :disabled="!!initialConfig">
          <ElOption
            v-for="(label, type) in supportedModels"
            :key="type"
            :label="label"
            :value="type"
          />
        </ElSelect>
      </ElFormItem>
      <ElFormItem label="系统提示词">
        <ElInput
          v-model="debugConfig.sessionTheme"
          type="textarea"
          :rows="3"
          placeholder="请输入系统提示词（可选）"
        />
      </ElFormItem>
      <ElFormItem label="用户消息">
        <ElInput
          v-model="debugConfig.userMessage"
          type="textarea"
          :rows="3"
          placeholder="请输入用户消息"
        />
      </ElFormItem>
      <ElFormItem label="API Key">
        <ElInput v-model="debugConfig.apiKey" placeholder="请输入API Key" />
      </ElFormItem>
      <ElFormItem label="API地址">
        <ElInput v-model="debugConfig.baseUrl" placeholder="请输入API地址" />
      </ElFormItem>
      <ElFormItem label="模型名称">
        <ElInput v-model="debugConfig.model" placeholder="请输入模型名称" />
      </ElFormItem>
      <ElFormItem label="最大长度">
        <ElInputNumber v-model="debugConfig.maxTokens" :min="1" :max="100000" placeholder="最大生成长度" style="width: 100%" />
      </ElFormItem>
      <ElFormItem label="温度">
        <ElSlider v-model="debugConfig.temperature" :min="0" :max="2" :step="0.1" show-stops :marks="{0: '0', 1: '1', 2: '2'}" style="width: 100%" />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="info" @click="previewDebugJson" :loading="previewLoading">预览请求JSON</ElButton>
        <ElButton type="primary" @click="sendDebugRequest" :loading="debugLoading">发送请求</ElButton>
      </ElFormItem>
    </ElForm>

    <!-- 请求JSON预览 -->
    <div v-if="debugRequestJson" style="margin-top: 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
        <span style="font-weight: 500">请求JSON：</span>
        <ElButton type="text" icon="el-icon-document-copy" @click="copyJson(debugRequestJson)">复制</ElButton>
      </div>
      <ElInput
        type="textarea"
        :rows="8"
        v-model="debugRequestJson"
        readonly
        style="font-family: monospace"
      />
    </div>

    <!-- 响应结果 -->
    <div v-if="debugResponse" style="margin-top: 20px">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px">
        <span style="font-weight: 500">响应结果：</span>
        <ElTag :type="debugResponseSuccess ? 'success' : 'danger'" size="small">
          {{ debugResponseSuccess ? '成功' : '失败' }}
        </ElTag>
      </div>
      <ElInput
        type="textarea"
        :rows="8"
        v-model="debugResponse"
        readonly
        style="font-family: monospace"
      />
    </div>
  </ElDialog>
</template>
