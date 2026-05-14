<template>
  <div class="home-page">
    <div class="home-hero">
      <h1>给老婆的工具包包</h1>
      <p>一站式图片处理，简单好用</p>
    </div>
    <div class="home-cards">
      <router-link to="/watermark" class="tool-card">
        <div class="card-icon">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
        </div>
        <h3>添加水印</h3>
        <div class="card-desc">
          为图片添加文字或图片水印<br>支持批量处理，实时预览
        </div>
        <span class="card-cta">开始使用 →</span>
      </router-link>
      <router-link to="/image-compressor" class="tool-card">
        <div class="card-icon">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
        </div>
        <h3>图片压缩</h3>
        <div class="card-desc">
          压缩图片体积与尺寸<br>保持画质，即时预览效果
        </div>
        <span class="card-cta">开始使用 →</span>
      </router-link>
      <router-link to="/image-converter" class="tool-card">
        <div class="card-icon">
          <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
        </div>
        <h3>格式转换</h3>
        <div class="card-desc">
          图片格式互转 PNG / JPEG / WebP<br>可调质量与分辨率
        </div>
        <span class="card-cta">开始使用 →</span>
      </router-link>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Home'
}
</script>

<style scoped>
.home-page {
  flex: 1;
  display: flex;
  flex-direction: column;
}
</style>
