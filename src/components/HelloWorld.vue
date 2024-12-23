<script setup>
import { ref } from 'vue'

defineProps({
  msg: String,
})

const count = ref(0)
const selectedPath = ref('')

const openDirectory = async () => {
  try {
    if (!window.electron) {
      console.error('Electron API not available')
      return
    }
    const result = await window.electron.openFile()
    if (result) {
      selectedPath.value = result
    }
  } catch (error) {
    console.error('打开文件夹失败:', error)
  }
}

const saveFile = async () => {
  try {
    if (!window.electron) {
      console.error('Electron API not available')
      return
    }
    
    // 获取原始文件名（假设从selectedPath中获取）
    const originalPath = selectedPath.value
    if (!originalPath) {
      console.error('没有选择文件')
      return
    }

    // 获取文件名和扩展名
    const lastSlashIndex = originalPath.lastIndexOf('\\') // Windows路径
    const lastDotIndex = originalPath.lastIndexOf('.')
    const fileName = originalPath.substring(lastSlashIndex + 1, lastDotIndex)
    const extension = originalPath.substring(lastDotIndex)

    // 生成带时间戳的新文件名
    const now = new Date()
    const timestamp = now.getFullYear() +
      ('0' + (now.getMonth() + 1)).slice(-2) +
      ('0' + now.getDate()).slice(-2) +
      '_' +
      ('0' + now.getHours()).slice(-2) +
      ('0' + now.getMinutes()).slice(-2) +
      ('0' + now.getSeconds()).slice(-2)
    
    const suggestedName = `${fileName}_${timestamp}${extension}`
    
    // 调用保存文件对话框
    const result = await window.electron.saveFile(suggestedName)
    if (result) {
      console.log('文件已保存至:', result)
    }
  } catch (error) {
    console.error('保存文件失败:', error)
  }
}
</script>

<template>
  <div class="container">
    <h1>{{ msg }}</h1>

    <div class="card">
      <button type="button" @click="count++">计数: {{ count }}</button>
      <button @click="openDirectory">选择文件</button>
      <button @click="saveFile" :disabled="!selectedPath">保存文件</button>
      <p v-if="selectedPath">
        选择的路径: {{ selectedPath }}
      </p>
    </div>
  </div>
</template>

<style scoped>
.container {
  padding: 20px;
}

.card {
  padding: 20px;
  border-radius: 8px;
  background: #f5f5f5;
  margin: 20px 0;
}

button {
  margin-right: 10px;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  background: #4CAF50;
  color: white;
  cursor: pointer;
}

button:hover {
  background: #45a049;
}
</style>
