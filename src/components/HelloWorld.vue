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
</script>

<template>
  <div class="container">
    <h1>{{ msg }}</h1>

    <div class="card">
      <button type="button" @click="count++">计数: {{ count }}</button>
      <button @click="openDirectory">选择文件夹</button>
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
