<template>
  <div class="pdf-watermark">
    <div class="upload-area">
      <input
        type="file"
        @change="handleFileChange"
        accept=".pdf"
        ref="fileInput"
        style="display: none"
      >
      <div
        class="drop-zone"
        @click="triggerFileInput"
        @drop.prevent="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <div class="upload-icon">📄</div>
        <p>点击或拖拽PDF文件到此处</p>
        <p class="tip">支持多个图片，每个图片将作为一页</p>
      </div>
    </div>
    
    <div v-if="selectedFile" class="file-info">
      <h3>已选择文件：{{ selectedFile.name }}</h3>
      
      <!-- 水印设置 -->
      <div class="watermark-settings">
        <h3>水印设置</h3>
        <div class="settings-grid">
          <div class="setting-item">
            <label>水印文字：</label>
            <input v-model="watermarkText" type="text" placeholder="请输入水印文字">
          </div>
          <div class="setting-item">
            <label>字体大小：</label>
            <input v-model.number="watermarkSize" type="number" min="10" max="100" step="1">
          </div>
          <div class="setting-item">
            <label>透明度：</label>
            <input v-model.number="watermarkOpacity" type="number" min="1" max="100" step="1">
          </div>
          <div class="setting-item">
            <label>旋转角度：</label>
            <input v-model.number="watermarkRotation" type="number" min="-180" max="180" step="5">
          </div>
          <div class="setting-item">
            <label>水印密度：</label>
            <select v-model="watermarkDensity">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div class="setting-item">
            <label>水印颜色：</label>
            <input v-model="watermarkColor" type="color">
          </div>
        </div>
      </div>
      
      <div class="actions">
        <button @click="addWatermark" class="convert-btn" :disabled="processing">
          {{ processing ? '处理中...' : '添加水印' }}
        </button>
      </div>
    </div>
    <Copyright />
  </div>
</template>

<script>
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import fontkit from '@pdf-lib/fontkit'
import Copyright from './Copyright.vue'

export default {
  name: 'PdfWatermark',
  components: {
    Copyright
  },
  data() {
    return {
      selectedFile: null,
      processing: false,
      // 水印设置
      watermarkText: '',
      watermarkSize: 30,
      watermarkOpacity: 30,
      watermarkRotation: -45,
      watermarkDensity: 'medium',
      watermarkColor: '#808080',
      fontBytes: null
    }
  },
  async created() {
    // 加载中文字体
    try {
      console.log('开始加载中文字体...')
      const response = await fetch('/fonts/SourceHanSansCN-Normal.ttf')
      if (!response.ok) {
        throw new Error(`字体加载失败: ${response.status} ${response.statusText}`)
      }
      this.fontBytes = await response.arrayBuffer()
      console.log('中文字体加载成功，大小:', this.fontBytes.byteLength)
    } catch (error) {
      console.error('字体加载失败:', error)
      alert('中文字体加载失败，请确保字体文件存在')
    }
  },
  computed: {
    watermarkSpacing() {
      const spacings = {
        low: 300,
        medium: 200,
        high: 150
      }
      return spacings[this.watermarkDensity]
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    handleFileChange(event) {
      const file = event.target.files[0]
      if (file && file.type === 'application/pdf') {
        this.selectedFile = file
      } else {
        alert('请选择PDF文件')
      }
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') {
        this.selectedFile = file
      } else {
        alert('请选择PDF文件')
      }
    },
    async addWatermark() {
      if (!this.selectedFile || !this.watermarkText.trim()) {
        alert('请选择PDF文件并输入水印文字')
        return
      }

      if (!this.fontBytes) {
        alert('中文字体未能正确加载，请刷新页面重试')
        return
      }
      
      this.processing = true
      try {
        console.log('开始处理PDF...')
        const arrayBuffer = await this.selectedFile.arrayBuffer()
        const pdfDoc = await PDFDocument.load(arrayBuffer)
        
        // 注册 fontkit 并嵌入字体
        pdfDoc.registerFontkit(fontkit)
        console.log('开始嵌入字体...')
        const font = await pdfDoc.embedFont(this.fontBytes)
        
        // 转换颜色从十六进制到RGB
        const color = this.hexToRgb(this.watermarkColor)
        
        // 为每一页添加水印
        const pages = pdfDoc.getPages()
        const watermarkText = this.watermarkText.trim()
        
        for (let i = 0; i < pages.length; i++) {
          const page = pages[i]
          const { width, height } = page.getSize()
          
          // 计算水印网格，增加间距以减少水印数量
          const spacing = this.watermarkSpacing * 1.5 // 增加 50% 的间距
          const cols = Math.ceil(width / spacing)
          const rows = Math.ceil(height / spacing)
          
          // 优化：计算实际需要的水印数量
          for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
              const x = col * spacing
              const y = row * spacing
              
              // 如果水印位置完全超出页面范围，则跳过
              if (x > width + spacing || y > height + spacing) continue
              
              try {
                page.drawText(watermarkText, {
                  x,
                  y,
                  font,
                  size: this.watermarkSize,
                  opacity: this.watermarkOpacity / 100,
                  color: rgb(color.r / 255, color.g / 255, color.b / 255),
                  rotate: degrees(this.watermarkRotation)
                })
              } catch (error) {
                console.error('绘制水印文字失败:', error)
                throw new Error('水印文字绘制失败，请检查文字内容')
              }
            }
          }
        }
        
        console.log('生成带水印的PDF...')
        const pdfBytes = await pdfDoc.save({
          useObjectStreams: true,
          addDefaultPage: false,
          objectsPerTick: 50,
          updateFieldAppearances: false,
          useCompression: true  // 启用压缩
        })
        
        // 创建下载链接
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `watermarked_${this.selectedFile.name}`
        
        // 触发下载
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理
        setTimeout(() => {
          URL.revokeObjectURL(url)
        }, 1000)
        
        console.log('处理完成')
      } catch (error) {
        console.error('处理失败:', error)
        alert(`添加水印失败: ${error.message}`)
      } finally {
        this.processing = false
      }
    },
    hexToRgb(hex) {
      // 移除 # 号
      hex = hex.replace(/^#/, '')
      
      // 解析颜色值
      const bigint = parseInt(hex, 16)
      return {
        r: (bigint >> 16) & 255,
        g: (bigint >> 8) & 255,
        b: bigint & 255
      }
    }
  }
}
</script>

<style scoped>
.pdf-watermark {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1, h3 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 30px;
}

.upload-area {
  margin: 20px 0;
}

.drop-zone {
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 40px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.drop-zone:hover {
  border-color: #409EFF;
}

.upload-icon {
  font-size: 48px;
  margin-bottom: 10px;
}

.file-info {
  margin-top: 20px;
}

.watermark-settings {
  background: white;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}
.tip {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  color: #606266;
  font-size: 14px;
}

.setting-item input,
.setting-item select {
  padding: 8px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 14px;
  transition: border-color 0.3s ease;
}

.setting-item input:focus,
.setting-item select:focus {
  outline: none;
  border-color: #409EFF;
}

.setting-item input[type="number"] {
  width: 100px;
}

.setting-item input[type="color"] {
  width: 50px;
  height: 35px;
  padding: 2px;
  cursor: pointer;
}

.actions {
  text-align: center;
  margin-top: 20px;
}

.convert-btn {
  background-color: #409EFF;
  color: white;
  border: none;
  padding: 12px 30px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s ease;
}

.convert-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.convert-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}
</style> 