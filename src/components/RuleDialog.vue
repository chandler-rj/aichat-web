<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElButton, ElForm, ElFormItem, ElInput, ElMessage } from 'element-plus'
import { rules } from '../services/rules'

const props = defineProps({
  visible: Boolean,
  ruleList: Array,
  editingRule: Object
})

const emit = defineEmits(['update:visible', 'saved', 'update:editingRule'])

const currentRule = ref({
  id: null,
  name: '',
  content: ''
})

watch(() => props.editingRule, (rule) => {
  if (rule) {
    currentRule.value = { ...rule }
    emit('update:editingRule', null)
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const saveRule = async () => {
  if (!currentRule.value.name) {
    ElMessage.warning('请输入规则名称')
    return
  }

  if (!currentRule.value.content) {
    ElMessage.warning('请输入规则内容')
    return
  }

  try {
    if (currentRule.value.id) {
      await rules.updateRule(currentRule.value.id, currentRule.value)
      ElMessage.success('规则更新成功')
    } else {
      await rules.createRule(currentRule.value)
      ElMessage.success('规则创建成功')
    }
    emit('saved')
    handleClose()
  } catch (e) {
    ElMessage.error(e.message || '保存规则失败')
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    :title="currentRule.id ? '编辑规则' : '新增规则'"
    width="500px"
    class="dialog--rule"
    :close-on-click-modal="false"
  >
    <ElForm label-width="80px">
      <ElFormItem label="规则名称">
        <ElInput v-model="currentRule.name" placeholder="请输入规则名称" />
      </ElFormItem>
      <ElFormItem label="规则内容">
        <ElInput v-model="currentRule.content" type="textarea" :rows="5" placeholder="请输入规则内容" />
      </ElFormItem>
    </ElForm>
    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="saveRule">保存</ElButton>
    </template>
  </ElDialog>
</template>
