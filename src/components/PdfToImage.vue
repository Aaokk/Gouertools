<template>
  <div class="pdf-to-image">
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
        <p>点击或拖拽图片文件到此处</p>
        <p class="tip">支持多个图片，每个图片将作为一页</p>
      </div>
    </div>
    <div v-if="selectedFile" class="file-info">
      <p>已选择文件: {{ selectedFile.name }}</p>
      <button @click="convertToImage" class="convert-btn" :disabled="converting">
        {{ converting ? '转换中...' : '开始转换' }}
      </button>
    </div>
    <div v-if="converting" class="progress">
      <p>正在转换第 {{ currentPage }} 页，共 {{ totalPages }} 页</p>
    </div>
    <div v-if="convertedImages.length > 0" class="result">
      <h2>转换结果</h2>
      <div class="image-grid">
        <div v-for="(image, index) in convertedImages" :key="index" class="image-item">
          <img :src="image" :alt="'第' + (index + 1) + '页'" />
          <a :href="image" :download="'page-' + (index + 1) + '.png'" class="download-btn">
            下载图片
          </a>
        </div>
      </div>
    </div>
    <Copyright />
  </div>
</template>

<script>
import * as pdfjsLib from 'pdfjs-dist'
import Copyright from './Copyright.vue'

// 设置 worker 路径为本地文件
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('../../public/pdf-worker/pdf.worker.min.mjs', import.meta.url).href

export default {
  name: 'PdfToImage',
  components: {
    Copyright
  },
  data() {
    return {
      selectedFile: null,
      converting: false,
      currentPage: 0,
      totalPages: 0,
      convertedImages: [],
      error: null
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
        this.convertedImages = []
      } else {
        alert('请选择PDF文件')
      }
    },
    handleDrop(event) {
      const file = event.dataTransfer.files[0]
      if (file && file.type === 'application/pdf') {
        this.selectedFile = file
        this.convertedImages = []
      } else {
        alert('请选择PDF文件')
      }
    },
    async convertToImage() {
      if (!this.selectedFile) return

      this.converting = true
      this.convertedImages = []
      this.error = null
      
      try {
        console.log('开始读取PDF文件...')
        const arrayBuffer = await this.selectedFile.arrayBuffer()
        console.log('PDF文件读取完成，开始加载PDF文档...')
        
        const loadingTask = pdfjsLib.getDocument({
          data: arrayBuffer,
          cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
          cMapPacked: true,
        })
        
        const pdf = await loadingTask.promise
        console.log(`PDF加载完成，总页数: ${pdf.numPages}`)
        this.totalPages = pdf.numPages
        
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          try {
            console.log(`开始处理第 ${pageNum} 页`)
            this.currentPage = pageNum
            
            const page = await pdf.getPage(pageNum)
            const viewport = page.getViewport({ scale: 1.5 })
            
            const canvas = document.createElement('canvas')
            const context = canvas.getContext('2d')
            
            // 设置canvas尺寸
            canvas.height = viewport.height
            canvas.width = viewport.width
            
            // 渲染PDF页面到canvas
            const renderContext = {
              canvasContext: context,
              viewport: viewport,
              enableWebGL: true
            }
            
            console.log(`开始渲染第 ${pageNum} 页`)
            await page.render(renderContext).promise
            console.log(`第 ${pageNum} 页渲染完成`)
            
            // 转换为图片并添加到结果数组
            const imageData = canvas.toDataURL('image/jpeg', 0.8)
            this.convertedImages.push(imageData)
            
            // 清理资源
            page.cleanup()
          } catch (pageError) {
            console.error(`处理第 ${pageNum} 页时出错:`, pageError)
            throw new Error(`处理第 ${pageNum} 页时失败: ${pageError.message}`)
          }
        }
        
        console.log('所有页面处理完成')
      } catch (error) {
        console.error('PDF转换错误:', error)
        this.error = error.message
        alert(`PDF转换失败: ${error.message}`)
      } finally {
        this.converting = false
      }
    }
  }
}
</script>

<style scoped>
.pdf-to-image {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}
.tip {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}
h1, h2 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 15px;
  font-size: 1.2em;
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
  margin-top: 15px;
  text-align: center;
}

.convert-btn {
  background-color: #409EFF;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 8px;
  transition: background-color 0.3s ease;
}

.convert-btn:hover:not(:disabled) {
  background-color: #66b1ff;
}

.convert-btn:disabled {
  background-color: #a0cfff;
  cursor: not-allowed;
}

.progress {
  text-align: center;
  margin: 15px 0;
  color: #409EFF;
  font-size: 14px;
}

.result {
  margin-top: 15px;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
  padding: 10px;
}

.image-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: white;
  padding: 5px;
  border-radius: 4px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.image-item img {
  max-width: 100%;
  height: 120px;
  object-fit: contain;
  margin-bottom: 5px;
  border-radius: 3px;
}

.download-btn {
  background-color: #67c23a;
  color: white;
  text-decoration: none;
  padding: 4px 8px;
  border-radius: 3px;
  font-size: 11px;
  transition: background-color 0.3s ease;
  white-space: nowrap;
}

.download-btn:hover {
  background-color: #85ce61;
}
</style> 