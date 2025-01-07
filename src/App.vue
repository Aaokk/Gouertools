<template>
  <div class="app-container">
    <nav class="nav-bar">
      <router-link to="/" class="nav-link">首页</router-link>
      <router-link to="/watermark" class="nav-link">添加水印</router-link>
      <router-link to="/image-converter" class="nav-link">图片格式转换</router-link>
      <router-link to="/pdf2image" class="nav-link">PDF转图片</router-link>
      <router-link to="/image2pdf" class="nav-link">图片转PDF</router-link>
    </nav>
    <main class="main-content">
      <router-view></router-view>
    </main>
  </div>
</template>

<script>
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  overflow-y: scroll;
  overflow-x: hidden;
}

body {
  font-family: Arial, sans-serif;
  background-color: #f5f7fa;
  min-height: 100vh;
  /* 移除固定宽度，防止出现水平滚动条 */
  max-width: 100%;
  overflow-x: hidden;
  color: #606266;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.nav-bar {
  background-color: #fff;
  padding: 1rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: center;
  gap: 2rem;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-link {
  color: #2c3e50;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: all 0.3s ease;
}

.nav-link:hover {
  background-color: #ecf5ff;
  color: #409EFF;
}

.nav-link.router-link-active {
  color: #409EFF;
  background-color: #ecf5ff;
}

.main-content {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
