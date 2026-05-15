<template>
  <div class="home-page">
    <!-- Hero 区 -->
    <div class="home-hero">
      <h1>工具包包</h1>
      <p>一站式图片处理，简单好用，本地运行保护隐私</p>
    </div>

    <!-- 图片处理 -->
    <div class="home-section">
      <div class="section-label">图片处理</div>
      <div class="home-grid home-grid--five">
        <router-link to="/watermark" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"/></svg>
            </div>
            <h3>添加水印</h3>
          </div>
          <div class="card-desc">为图片添加文字或图片水印，支持批量处理，实时预览</div>
        </router-link>

        <router-link to="/image-compressor" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <h3>图片压缩</h3>
          </div>
          <div class="card-desc">压缩 JPG/PNG/WebP/GIF/AVIF/SVG，保持画质，批量处理</div>
        </router-link>

        <router-link to="/image-converter" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/></svg>
            </div>
            <h3>格式转换</h3>
          </div>
          <div class="card-desc">图片格式互转 PNG / JPEG / WebP，可调质量与分辨率</div>
        </router-link>

        <router-link to="/image-cropper" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M6 2v14a2 2 0 002 2h14M18 22V8a2 2 0 00-2-2H2"/></svg>
            </div>
            <h3>图片裁剪</h3>
          </div>
          <div class="card-desc">可视化拖拽裁剪，内置一寸 / 二寸 / 护照 / 身份证比例</div>
        </router-link>

        <router-link to="/app-icon" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/></svg>
            </div>
            <h3>应用图标</h3>
          </div>
          <div class="card-desc">批量导出 Android / iOS / 网站 favicon，圆角与边距可调</div>
        </router-link>
      </div>
    </div>

    <!-- 隐私与实用 -->
    <div class="home-section">
      <div class="section-label">隐私与实用</div>
      <div class="home-grid home-grid--three">
        <router-link to="/mosaic" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/><rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><rect x="17" y="17" width="4" height="4"/></svg>
            </div>
            <h3>局部打码</h3>
          </div>
          <div class="card-desc">画笔/选框打码，马赛克 · 模糊 · 黑块，可撤销</div>
        </router-link>

        <router-link to="/exif" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            </div>
            <h3>EXIF 查看/清除</h3>
          </div>
          <div class="card-desc">查看 GPS/设备/时间等元数据，一键清除保护隐私</div>
        </router-link>

        <router-link to="/qrcode" class="tool-card">
          <div class="card-head">
            <div class="card-icon">
              <svg fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 14h3v3M17 17h3v3M14 20h3"/></svg>
            </div>
            <h3>二维码生成</h3>
          </div>
          <div class="card-desc">网址/文字/WiFi 一键生成，自定义颜色，导出 PNG/SVG</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script>
export default { name: 'Home' }
</script>

<style scoped>
.home-page {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding-bottom: var(--spacing-2xl);
}

/* Hero：与 tool-header / tool-body 同宽、同水平内边距 */
.home-hero {
  text-align: center;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: var(--spacing-md) var(--spacing-xl) var(--spacing-sm);
  box-sizing: border-box;
}

/* 分区：与工具页内容区对齐 */
.home-section {
  padding: 0 var(--spacing-xl) var(--spacing-md);
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  box-sizing: border-box;
}

.section-label {
  font-size: 11px;
  font-weight: 700;
  font-family: var(--font-heading);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  margin-bottom: var(--spacing-sm);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-label::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}

/* Grid：分区单独列数，避免「图片处理」5 个时 4+1 折行 */
.home-grid {
  display: grid;
  gap: 8px;
}

.home-grid--five {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}

.home-grid--three {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

@media (max-width: 1040px) {
  .home-grid--five {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 680px) {
  .home-grid--five {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
  .home-grid--three {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 600px) {
  .home-grid--five,
  .home-grid--three {
    grid-template-columns: 1fr;
  }
  .home-section { padding: 0 var(--spacing-md) var(--spacing-lg); }
  .home-hero {
    padding-left: var(--spacing-md);
    padding-right: var(--spacing-md);
  }
}

/* 首页卡片：图标与标题同一行，更小更紧凑（覆盖全局 .tool-card 局部样式） */
.home-grid .tool-card {
  padding: 10px 12px;
}
.home-grid .tool-card .card-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.home-grid .tool-card .card-head .card-icon {
  width: 26px;
  height: 26px;
  margin-bottom: 0;
  flex-shrink: 0;
}
.home-grid .tool-card .card-head .card-icon svg {
  width: 13px;
  height: 13px;
}
.home-grid .tool-card .card-head h3 {
  margin-bottom: 0;
  font-size: 13px;
  line-height: 1.25;
  flex: 1;
  min-width: 0;
}
.home-grid .tool-card .card-desc {
  font-size: 11px;
  line-height: 1.45;
  margin-bottom: 0;
}
</style>
