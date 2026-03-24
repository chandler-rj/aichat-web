<script setup>
import { ref, watch } from 'vue'
import { ElDialog, ElButton, ElMessage } from 'element-plus'
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

const showEditDialog = ref(false)

watch(() => props.visible, (val) => {
  if (val) {
    // Dialog opened - ruleList should be loaded by parent
  }
})

// Watch for editingRule prop and auto-open edit dialog
watch(() => props.editingRule, (rule) => {
  if (rule) {
    currentRule.value = { ...rule }
    showEditDialog.value = true
    emit('update:editingRule', null) // Reset after using
  }
})

const handleClose = () => {
  emit('update:visible', false)
}

const addNewRule = () => {
  currentRule.value = { id: null, name: '', content: '' }
  showEditDialog.value = true
}

const editRule = (rule) => {
  currentRule.value = { ...rule }
  showEditDialog.value = true
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
    showEditDialog.value = false
    emit('saved')
  } catch (e) {
    ElMessage.error(e.message || '保存规则失败')
  }
}

const deleteRule = async (id) => {
  try {
    await rules.deleteRule(id)
    ElMessage.success('规则已删除')
    emit('saved')
  } catch (e) {
    ElMessage.error(e.message || '删除规则失败')
  }
}
</script>

<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="handleClose"
    title="规则维护"
    width="90%"
    class="dialog--rule"
  >
    <ElButton type="primary" @click="addNewRule" style="margin-bottom: 15px">
      新增规则
    </ElButton>

    <div style="margin-bottom: 10px;">
      <div v-for="rule in ruleList" :key="rule.id" style="border: 1px solid var(--border-primary); border-radius: var(--radius-sm); padding: 10px; margin-bottom: 8px; display: flex; justify-content: space-between; align-items: flex-start">
        <div style="flex: 1">
          <div style="font-weight: 500; color: var(--text-title); margin-bottom: 5px">{{ rule.name }}</div>
          <div style="color: var(--text-secondary); font-size: var(--text-caption); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 450px">
            {{ rule.content }}
          </div>
        </div>
        <div style="flex-shrink: 0; display: flex; gap: 5px">
          <ElButton type="primary" size="small" @click="editRule(rule)">编辑</ElButton>
          <ElButton type="danger" size="small" @click="deleteRule(rule.id)">删除</ElButton>
        </div>
      </div>
    </div>

    <!-- 编辑规则弹窗 -->
    <ElDialog
      :model-value="showEditDialog"
      @update:model-value="showEditDialog = $event"
      :title="currentRule.id ? '编辑规则' : '新增规则'"
      width="90%"
      class="dialog--rule-edit"
      append-to-body
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
        <ElButton @click="showEditDialog = false">取消</ElButton>
        <ElButton type="primary" @click="saveRule">保存</ElButton>
      </template>
    </ElDialog>
  </ElDialog>
</template>
