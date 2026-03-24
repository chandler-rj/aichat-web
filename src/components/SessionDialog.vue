<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElForm, ElFormItem, ElInput, ElButton, ElMessage } from 'element-plus'
import { sessions } from '../services/sessions'

const props = defineProps({
  visible: Boolean
})

const emit = defineEmits(['update:visible', 'created'])

const newSession = ref({
  name: '',
  userDisplayName: '',
  sessionTheme: '',
  chatRules: ''
})

watch(() => props.visible, (val) => {
  if (val) {
    newSession.value = {
      name: '',
      userDisplayName: '',
      sessionTheme: '',
      chatRules: ''
    }
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const handleCreate = async () => {
  if (!newSession.value.name) {
    ElMessage.warning('请输入会话名称')
    return
  }

  try {
    const session = await sessions.createSession({
      name: newSession.value.name,
      userDisplayName: newSession.value.userDisplayName || '用户',
      sessionTheme: newSession.value.sessionTheme,
      replyInterval: 2000,
      userConfig: ''
    })
    ElMessage.success('会话创建成功')
    handleClose()
    emit('created', session)
  } catch (e) {
    ElMessage.error(e.message || '创建会话失败')
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="新建会话"
    width="90%"
    class="dialog--session"
  >
    <ElForm label-width="100px">
      <ElFormItem label="会话名称">
        <ElInput
          v-model="newSession.name"
          placeholder="请输入会话名称，仅作显示用"
        />
      </ElFormItem>
      <ElFormItem label="用户名称">
        <ElInput
          v-model="newSession.userDisplayName"
          placeholder="用于聊天记录中显示"
        />
      </ElFormItem>
      <ElFormItem label="对话主题">
        <ElInput
          v-model="newSession.sessionTheme"
          type="textarea"
          :rows="1"
          placeholder="请输入对话主题"
        />
      </ElFormItem>
      <ElFormItem label="重要规则">
        <ElInput
          v-model="newSession.chatRules"
          type="textarea"
          :rows="3"
          placeholder="请输入聊天的重要规则，会附加到系统提示中"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleCreate">创建</ElButton>
    </template>
  </ElDialog>
</template>
