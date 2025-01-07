<template>
  <div class="home">
    <h1>给亲爱的佘泳蕻老婆(工具包包)</h1>
    <div class="menu">
      <router-link to="/watermark" class="menu-item">
        <div class="card">
          <h2>添加水印</h2>
          <p>为图片添加自定义水印</p>
        </div>
      </router-link>
      <router-link to="/image-converter" class="menu-item">
        <div class="card">
          <h2>图片格式转换</h2>
          <p>转换为常用图片格式</p>
        </div>
      </router-link>
      <router-link to="/pdf2image" class="menu-item">
        <div class="card">
          <h2>PDF转图片</h2>
          <p>PDF文件转换为图片</p>
        </div>
      </router-link>
      <router-link to="/image2pdf" class="menu-item">
        <div class="card">
          <h2>图片转PDF</h2>
          <p>多张图片合并为PDF</p>
        </div>
      </router-link>
      <router-link to="/image-compressor" class="menu-item">
        <div class="card">
          <h2>图片压缩</h2>
          <p>压缩图片大小和尺寸</p>
        </div>
      </router-link>
    </div>
    <Copyright />
  </div>
</template>

<script>
import Copyright from './Copyright.vue'

export default {
  name: 'Home',
  components: {
    Copyright
  }
}
</script>

<style scoped>
.home {
  padding: 20px;
  text-align: center;
}

h1 {
  color: #2c3e50;
  margin-bottom: 40px;
}

.menu {
  display: flex;
  justify-content: center;
  gap: 30px;
  flex-wrap: wrap;
}

.menu-item {
  text-decoration: none;
  color: inherit;
}

.card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  width: 200px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

h2 {
  color: #2c3e50;
  margin-bottom: 10px;
}

p {
  color: #666;
  font-size: 14px;
}
</style> 