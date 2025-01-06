<template>
  <div class="image-to-pdf">
    <div class="upload-area">
      <input
        type="file"
        @change="handleFileChange"
        accept="image/*"
        ref="fileInput"
        multiple
        style="display: none"
      >
      <div
        class="drop-zone"
        @click="triggerFileInput"
        @drop.prevent="handleDrop"
        @dragover.prevent
        @dragenter.prevent
      >
        <div class="upload-icon">🖼️</div>
        <p>点击或拖拽图片文件到此处</p>
        <p class="tip">支持多个图片，每个图片将作为一页</p>
      </div>
    </div>
    
    <div v-if="selectedFiles.length > 0" class="file-list">
      <h3>已选择 {{ selectedFiles.length }} 个文件：</h3>
      <div class="preview-grid">
        <div v-for="(file, index) in selectedFiles" :key="index" class="preview-item">
          <img :src="previewUrls[index]" :alt="file.name" class="preview-image">
          <div class="preview-info">
            <span class="file-name">{{ file.name }}</span>
            <button @click="removeFile(index)" class="remove-btn">删除</button>
          </div>
        </div>
      </div>
      <div class="actions">
        <button @click="convertToPdf" class="convert-btn" :disabled="converting">
          {{ converting ? '转换中...' : '生成PDF' }}
        </button>
      </div>
    </div>
    <Copyright />
  </div>
</template>

<script>
import { PDFDocument } from 'pdf-lib'
import Copyright from './Copyright.vue'

export default {
  name: 'ImageToPdf',
  components: {
    Copyright
  },
  data() {
    return {
      selectedFiles: [],
      previewUrls: [],
      converting: false,
      maxImageSize: 5 * 1024 * 1024 // 5MB
    }
  },
  methods: {
    triggerFileInput() {
      this.$refs.fileInput.click()
    },
    async handleFileChange(event) {
      const files = Array.from(event.target.files)
      await this.addFiles(files)
    },
    async handleDrop(event) {
      const files = Array.from(event.dataTransfer.files).filter(file => file.type.startsWith('image/'))
      if (files.length === 0) {
        alert('请选择图片文件')
        return
      }
      await this.addFiles(files)
    },
    async addFiles(files) {
      for (const file of files) {
        if (!file.type.startsWith('image/')) {
          alert('请选择图片文件')
          continue
        }
        // 检查文件大小
        if (file.size > this.maxImageSize) {
          alert(`文件 ${file.name} 太大，请选择小于 5MB 的图片`)
          continue
        }
        this.selectedFiles.push(file)
        try {
          const url = await this.createPreviewUrl(file)
          this.previewUrls.push(url)
        } catch (error) {
          console.error('预览生成失败:', error)
          alert(`文件 ${file.name} 预览生成失败`)
          this.selectedFiles.pop()
        }
      }
    },
    createPreviewUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target.result)
        reader.onerror = (e) => reject(new Error('文件读取失败'))
        reader.readAsDataURL(file)
      })
    },
    removeFile(index) {
      URL.revokeObjectURL(this.previewUrls[index])
      this.selectedFiles.splice(index, 1)
      this.previewUrls.splice(index, 1)
    },
    async convertToPdf() {
      if (this.selectedFiles.length === 0) return
      if (this.converting) return
      
      this.converting = true
      try {
        console.log('开始创建PDF文档...')
        const pdfDoc = await PDFDocument.create()
        
        // 设置标准 A4 页面大小（595.28 x 841.89 点，1点 = 1/72 英寸）
        const pageWidth = 595.28
        const pageHeight = 841.89
        const margin = 40 // 页面边距，单位：点
        
        for (let i = 0; i < this.selectedFiles.length; i++) {
          try {
            console.log(`处理第 ${i + 1}/${this.selectedFiles.length} 个文件: ${this.selectedFiles[i].name}`)
            
            // 使用 Canvas 转换图片格式
            const imageData = await this.convertImageToJpeg(this.previewUrls[i])
            console.log(`文件 ${this.selectedFiles[i].name} 转换完成`)
            
            // 嵌入图片到PDF
            const image = await pdfDoc.embedJpg(imageData)
            console.log(`图片嵌入成功，原始尺寸: ${image.width}x${image.height}`)
            
            // 计算图片在页面中的尺寸和位置
            const maxWidth = pageWidth - (margin * 2)
            const maxHeight = pageHeight - (margin * 2)
            
            // 计算缩放比例，保持宽高比
            let scale = Math.min(
              maxWidth / image.width,
              maxHeight / image.height
            )
            
            // 如果图片比页面大，就缩小；如果比页面小，最大放大 1.5 倍
            scale = Math.min(scale, 1.5)
            
            const scaledWidth = image.width * scale
            const scaledHeight = image.height * scale
            
            // 在页面中居中显示
            const x = (pageWidth - scaledWidth) / 2
            const y = (pageHeight - scaledHeight) / 2
            
            // 添加标准 A4 页面
            const page = pdfDoc.addPage([pageWidth, pageHeight])
            
            // 在页面上绘制图片
            page.drawImage(image, {
              x,
              y,
              width: scaledWidth,
              height: scaledHeight
            })
            
            console.log(`第 ${i + 1} 页处理完成，缩放后尺寸: ${scaledWidth.toFixed(2)}x${scaledHeight.toFixed(2)}`)
          } catch (error) {
            console.error(`处理文件 ${this.selectedFiles[i].name} 时出错:`, error)
            throw new Error(`处理文件 ${this.selectedFiles[i].name} 失败: ${error.message}`)
          }
        }
        
        console.log('开始生成PDF文件...')
        const pdfBytes = await pdfDoc.save()
        console.log(`PDF生成成功，大小: ${pdfBytes.length} 字节`)
        
        // 创建下载链接
        const blob = new Blob([pdfBytes], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = 'converted-images.pdf'
        
        // 触发下载
        console.log('开始下载PDF文件...')
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理
        setTimeout(() => {
          URL.revokeObjectURL(url)
          console.log('清理完成')
        }, 1000)
        
        console.log('转换完成')
      } catch (error) {
        console.error('PDF转换失败:', error)
        alert(`PDF生成失败: ${error.message}`)
      } finally {
        this.converting = false
      }
    },
    // 使用 Canvas 将图片转换为 JPEG 格式
    convertImageToJpeg(imageUrl) {
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            canvas.width = img.width
            canvas.height = img.height
            const ctx = canvas.getContext('2d')
            ctx.fillStyle = 'white' // 设置白色背景
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            ctx.drawImage(img, 0, 0)
            
            // 转换为 JPEG 格式的 Uint8Array
            const jpegData = canvas.toDataURL('image/jpeg', 0.9)
            const base64Data = jpegData.split(',')[1]
            const binaryString = atob(base64Data)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            resolve(bytes)
          } catch (error) {
            reject(new Error('图片转换失败'))
          }
        }
        img.onerror = () => reject(new Error('图片加载失败'))
        img.src = imageUrl
      })
    },
    readFileAsBytes(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(new Uint8Array(reader.result))
        reader.onerror = (e) => reject(new Error('文件读取失败'))
        reader.readAsArrayBuffer(file)
      })
    }
  },
  beforeUnmount() {
    // 清理预览URL
    this.previewUrls.forEach(url => {
      if (url.startsWith('blob:')) {
        URL.revokeObjectURL(url)
      }
    })
  }
}
</script>

<style scoped>
.image-to-pdf {
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

.tip {
  color: #909399;
  font-size: 14px;
  margin-top: 8px;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.preview-item {
  background: white;
  border-radius: 8px;
  padding: 10px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.preview-image {
  width: 100%;
  height: 200px;
  object-fit: contain;
  border-radius: 4px;
  margin-bottom: 10px;
}

.preview-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.file-name {
  font-size: 14px;
  color: #606266;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.remove-btn {
  background-color: #f56c6c;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.3s ease;
}

.remove-btn:hover {
  background-color: #f78989;
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