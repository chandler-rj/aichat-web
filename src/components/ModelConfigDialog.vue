<script setup>
import { ref, watch, onMounted } from 'vue'
import { ElDialog, ElButton, ElForm, ElFormItem, ElInput, ElTag, ElEmpty, ElScrollbar, ElMessage } from 'element-plus'
import { models } from '../services/models'

const props = defineProps({
  visible: Boolean,
  supportedModels: Object
})

const emit = defineEmits(['update:visible', 'saved', 'open-debug'])

// 模型配置状态
const modelStatuses = ref({})
const loading = ref(false)
const saving = ref(false)
const testingModel = ref(false)

// 当前编辑的模型
const editingModel = ref(null)
const editingConfig = ref({})

// 模型列表
const modelList = ['OPENAI', 'QWEN', 'MINIMAX', 'VOLCANO', 'GEMINI', 'XAI']

// 模型显示名称
const modelNames = {
  OPENAI: 'OpenAI',
  QWEN: '通义千问',
  MINIMAX: 'MiniMax',
  VOLCANO: '字节跳动火山',
  GEMINI: 'Google Gemini',
  XAI: 'xAI Grok'
}

watch(() => props.visible, async (val) => {
  if (val) {
    await loadStatuses()
  }
})

const loadStatuses = async () => {
  loading.value = true
  try {
    const statuses = {}
    for (const modelType of modelList) {
      try {
        const status = await models.getModelStatus(modelType)
        statuses[modelType] = status
      } catch (e) {
        statuses[modelType] = { configured: false, hasApiKey: false, defaults: {} }
      }
    }
    modelStatuses.value = statuses
  } catch (e) {
    ElMessage.error('加载配置状态失败')
  } finally {
    loading.value = false
  }
}

const openConfig = async (modelType) => {
  editingModel.value = modelType
  try {
    // 获取当前配置（如果有）
    const config = await models.getModelConfig(modelType)
    if (config && Object.keys(config).length > 0) {
      // 使用当前配置，并补充默认参数
      const defaults = await models.getDefaultConfig(modelType)
      editingConfig.value = { ...defaults, ...config }
    } else {
      // 使用默认配置
      const defaults = await models.getDefaultConfig(modelType)
      editingConfig.value = { ...defaults }
    }
  } catch (e) {
    // 使用默认配置
    const defaults = await models.getDefaultConfig(modelType)
    editingConfig.value = { ...defaults }
  }
}

const closeConfig = () => {
  editingModel.value = null
  editingConfig.value = {}
}

const saveConfig = async () => {
  // 验证 API Key
  if (!editingConfig.value.apiKey || editingConfig.value.apiKey.trim() === '') {
    ElMessage.error('API Key 不能为空')
    return
  }

  saving.value = true
  try {
    await models.saveModelConfig(editingModel.value, editingConfig.value)
    ElMessage.success('配置已保存')
    closeConfig()
    await loadStatuses()
    emit('saved')
  } catch (e) {
    ElMessage.error(e.message || '保存失败')
  } finally {
    saving.value = false
  }
}

const deleteConfig = async () => {
  if (!confirm('确定要删除此模型配置吗？')) return

  try {
    await models.deleteModelConfig(editingModel.value)
    ElMessage.success('配置已删除')
    closeConfig()
    await loadStatuses()
  } catch (e) {
    ElMessage.error(e.message || '删除失败')
  }
}

const testConnection = async () => {
  if (!editingConfig.value.apiKey || editingConfig.value.apiKey.trim() === '') {
    ElMessage.error('请先填写 API Key')
    return
  }

  testingModel.value = true
  try {
    const result = await models.testModel(editingModel.value, editingConfig.value)
    if (result) {
      ElMessage.success('连接成功')
    } else {
      ElMessage.error('连接失败，请检查配置')
    }
  } catch (e) {
    ElMessage.error(e.message || '测试失败')
  } finally {
    testingModel.value = false
  }
}

const openDebug = () => {
  emit('open-debug', editingModel.value, editingConfig.value)
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="模型配置"
    width="90%"
    class="dialog--model"
  >
    <!-- 模型列表视图 -->
    <div v-if="!editingModel" class="model-list">
      <ElScrollbar height="400px">
        <div v-for="modelType in modelList" :key="modelType" class="model-item">
          <div class="model-info">
            <span class="model-name">{{ modelNames[modelType] || modelType }}</span>
            <ElTag v-if="modelStatuses[modelType]?.configured" type="success" size="small">已配置</ElTag>
            <ElTag v-else type="info" size="small">未配置</ElTag>
          </div>
          <div class="model-actions">
            <ElButton
              :type="modelStatuses[modelType]?.configured ? 'primary' : 'warning'"
              size="small"
              @click="openConfig(modelType)"
            >
              {{ modelStatuses[modelType]?.configured ? '查看/编辑' : '去配置' }}
            </ElButton>
          </div>
        </div>
      </ElScrollbar>
    </div>

    <!-- 配置编辑视图 -->
    <div v-else class="model-config">
      <div class="config-header">
        <ElButton size="small" @click="closeConfig">返回列表</ElButton>
        <span class="config-title">{{ modelNames[editingModel] || editingModel }}</span>
      </div>

      <ElForm label-width="120px" class="config-form">
        <ElFormItem label="API Key" required>
          <ElInput
            v-model="editingConfig.apiKey"
            placeholder="请输入 API Key"
            type="password"
            show-password
          />
        </ElFormItem>

        <ElFormItem label="API地址">
          <ElInput
            v-model="editingConfig.baseUrl"
            placeholder="https://api.openai.com/v1"
          />
        </ElFormItem>

        <ElFormItem label="模型名称">
          <ElInput
            v-model="editingConfig.model"
            placeholder="gpt-3.5-turbo"
          />
        </ElFormItem>

        <ElFormItem label="最大生成长度">
          <ElInput
            v-model="editingConfig.maxTokens"
            placeholder="2048"
          />
        </ElFormItem>

        <ElFormItem label="温度">
          <ElInput
            v-model="editingConfig.temperature"
            placeholder="0.7"
          />
        </ElFormItem>

        <ElFormItem>
          <ElButton type="primary" @click="testConnection" :loading="testingModel">测试连接</ElButton>
          <ElButton type="warning" @click="openDebug" style="margin-left: 10px">调试</ElButton>
        </ElFormItem>
      </ElForm>

      <div class="config-footer">
        <ElButton @click="closeConfig">取消</ElButton>
        <ElButton type="danger" @click="deleteConfig" v-if="modelStatuses[editingModel]?.configured">删除配置</ElButton>
        <ElButton type="primary" @click="saveConfig" :loading="saving">保存</ElButton>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
.model-list {
  padding: 10px 0;
}

.model-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-light);
}

.model-item:last-child {
  border-bottom: none;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.model-name {
  font-size: 15px;
  font-weight: 500;
}

.model-actions {
  display: flex;
  gap: 8px;
}

.model-config {
  padding: 10px 0;
}

.config-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.config-title {
  font-size: 16px;
  font-weight: 600;
}

.config-form {
  max-width: 500px;
}

.config-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}
</style>
