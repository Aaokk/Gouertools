<template>
  <div class="tool-page">
    <div class="tool-header">
      <h2>Gouer.vip EXIF 查看/清除</h2>
      <div class="divider"></div>
    </div>

    <div class="tool-body">
      <!-- 左侧 -->
      <div class="preview-stack">
        <div class="exif-actions" @click.stop>
          <button class="btn btn-secondary btn-sm" @click="fileInput.click()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg>
            选择图片
          </button>
          <button v-if="previewUrl" class="btn btn-danger btn-sm" @click="clearAndDownload">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            清除 EXIF 并下载
          </button>
        </div>

        <!-- 预览区 -->
        <div
          class="preview-area"
          @click="!previewUrl && fileInput.click()"
          @dragover.prevent @dragenter="isDragging=true" @dragleave="isDragging=false"
          @drop.prevent="onDrop" :class="{ dragging: isDragging }"
        >
          <template v-if="!previewUrl">
            <div class="placeholder-icon">
              <svg fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
            </div>
            <span class="placeholder-text">点击或拖拽图片到此处</span>
            <span class="placeholder-hint">支持 JPG、PNG、WebP，读取 EXIF 信息</span>
          </template>
          <img v-else :src="previewUrl" class="exif-preview-img" alt="预览图" />
        </div>
      </div>

      <!-- 右侧 EXIF 数据 -->
      <div class="control-panel">
        <div v-if="!exifData && !previewUrl" class="exif-empty">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
          <p>选择图片后显示 EXIF 信息</p>
        </div>

        <div v-else-if="previewUrl && !exifData" class="exif-empty">
          <p style="color:var(--color-text-muted);">该图片不含 EXIF 信息，或已清除。</p>
          <p style="font-size:11px;margin-top:4px;color:var(--color-text-muted);">（PNG、截图通常没有 EXIF）</p>
        </div>

        <template v-else-if="exifData">
          <!-- 摘要警告 -->
          <div v-if="hasGps" class="exif-warning">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
            检测到 GPS 位置信息！建议发送前清除。
          </div>

          <!-- EXIF 字段列表 -->
          <div class="exif-list">
            <div v-for="(val, key) in exifFlat" :key="key" class="exif-row">
              <span class="exif-key">{{ formatKey(key) }}</span>
              <span class="exif-val" :class="{ 'exif-gps': isGpsKey(key) }">{{ formatVal(val) }}</span>
            </div>
          </div>

          <button class="btn btn-danger" style="width:100%;" @click="clearAndDownload">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/></svg>
            清除全部 EXIF 并下载
          </button>
        </template>
      </div>
    </div>

    <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp,image/tiff" style="display:none" @change="onFileChange">
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { showToast } from '../utils/toast.js'
import { downloadBlob } from '../utils/download.js'

const fileInput  = ref(null)
const isDragging = ref(false)
const previewUrl = ref('')
const exifData   = ref(null)
const currentFile = ref(null)
const fileName   = ref('image')

const onFileChange = (e) => {
  const f = e.target.files[0]; e.target.value = ''
  if (f) loadFile(f)
}
const onDrop = (e) => {
  isDragging.value = false
  const f = e.dataTransfer.files[0]
  if (f && f.type.startsWith('image/')) loadFile(f)
}

const loadFile = async (f) => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
  fileName.value = f.name.replace(/\.[^.]+$/, '')
  currentFile.value = f
  previewUrl.value = URL.createObjectURL(f)
  exifData.value = null

  try {
    const exifr = (await import('exifr')).default
    const data = await exifr.parse(f, { gps: true, tiff: true, xmp: true, iptc: true })
    exifData.value = data || null
  } catch (err) {
    console.warn('EXIF 读取:', err)
    exifData.value = null
    showToast({ message: '无法读取 EXIF 信息，文件可能不含元数据', type: 'warning' })
  }
}

const exifFlat = computed(() => {
  if (!exifData.value) return {}
  const flat = {}
  const skip = ['thumbnail', 'ThumbnailImage', 'JpegIFByteCount']
  for (const [k, v] of Object.entries(exifData.value)) {
    if (skip.includes(k)) continue
    if (v !== null && v !== undefined && v !== '') flat[k] = v
  }
  return flat
})

const hasGps = computed(() => {
  if (!exifData.value) return false
  return 'latitude' in exifData.value || 'longitude' in exifData.value ||
         'GPSLatitude' in exifData.value || 'GPSLongitude' in exifData.value
})

const isGpsKey = (k) => /gps|latitude|longitude/i.test(k)

const EXIF_ZH = {
  // ── 基本信息 ──
  Make: '相机品牌', make: '相机品牌',
  Model: '相机型号', model: '相机型号',
  Software: '处理软件', software: '处理软件',
  DateTime: '修改时间', dateTime: '修改时间',
  DateTimeOriginal: '拍摄时间', dateTimeOriginal: '拍摄时间',
  DateTimeDigitized: '数字化时间', dateTimeDigitized: '数字化时间',
  OffsetTime: '时区偏移', offsetTime: '时区偏移',
  OffsetTimeOriginal: '拍摄时区', offsetTimeOriginal: '拍摄时区',
  ImageWidth: '图片宽度', imageWidth: '图片宽度',
  ImageHeight: '图片高度', imageHeight: '图片高度',
  ExifImageWidth: 'EXIF 宽度', exifImageWidth: 'EXIF 宽度',
  ExifImageHeight: 'EXIF 高度', exifImageHeight: 'EXIF 高度',
  PixelXDimension: '像素宽', pixelXDimension: '像素宽',
  PixelYDimension: '像素高', pixelYDimension: '像素高',
  Orientation: '方向', orientation: '方向',
  XResolution: '水平分辨率', xResolution: '水平分辨率',
  YResolution: '垂直分辨率', yResolution: '垂直分辨率',
  ResolutionUnit: '分辨率单位', resolutionUnit: '分辨率单位',
  ColorSpace: '色彩空间', colorSpace: '色彩空间',
  BitsPerSample: '色深', bitsPerSample: '色深',
  Compression: '压缩方式', compression: '压缩方式',
  PhotometricInterpretation: '色彩模型', photometricInterpretation: '色彩模型',
  SamplesPerPixel: '通道数', samplesPerPixel: '通道数',
  // ── 拍摄参数 ──
  ExposureTime: '曝光时间', exposureTime: '曝光时间',
  FNumber: '光圈 F 值', fNumber: '光圈 F 值',
  ApertureValue: '光圈', apertureValue: '光圈',
  ExposureProgram: '曝光程序', exposureProgram: '曝光程序',
  ExposureMode: '曝光模式', exposureMode: '曝光模式',
  ISOSpeedRatings: 'ISO 感光度', isoSpeedRatings: 'ISO 感光度',
  ISO: 'ISO', iso: 'ISO',
  RecommendedExposureIndex: '推荐曝光指数',
  SensitivityType: '感光度类型', sensitivityType: '感光度类型',
  ShutterSpeedValue: '快门速度', shutterSpeedValue: '快门速度',
  BrightnessValue: '亮度', brightnessValue: '亮度',
  ExposureBiasValue: '曝光补偿', exposureBiasValue: '曝光补偿',
  MaxApertureValue: '最大光圈', maxApertureValue: '最大光圈',
  MeteringMode: '测光模式', meteringMode: '测光模式',
  LightSource: '光源', lightSource: '光源',
  Flash: '闪光灯', flash: '闪光灯',
  FocalLength: '焦距', focalLength: '焦距',
  FocalLengthIn35mmFilm: '等效 35mm 焦距', focalLengthIn35mmFilm: '等效 35mm 焦距',
  SubjectDistance: '主体距离', subjectDistance: '主体距离',
  SubjectDistanceRange: '主体距离范围', subjectDistanceRange: '主体距离范围',
  WhiteBalance: '白平衡', whiteBalance: '白平衡',
  DigitalZoomRatio: '数字变焦', digitalZoomRatio: '数字变焦',
  SceneCaptureType: '场景类型', sceneCaptureType: '场景类型',
  SceneType: '场景', sceneType: '场景',
  Contrast: '对比度', contrast: '对比度',
  Saturation: '饱和度', saturation: '饱和度',
  Sharpness: '锐度', sharpness: '锐度',
  GainControl: '增益控制', gainControl: '增益控制',
  CustomRendered: '自定义渲染', customRendered: '自定义渲染',
  // ── 镜头信息 ──
  LensMake: '镜头品牌', lensMake: '镜头品牌',
  LensModel: '镜头型号', lensModel: '镜头型号',
  LensSerialNumber: '镜头序列号', lensSerialNumber: '镜头序列号',
  LensSpecification: '镜头规格', lensSpecification: '镜头规格',
  // ── 位置信息 ──
  latitude: '纬度', longitude: '经度', altitude: '海拔',
  GPSLatitude: 'GPS 纬度', gpsLatitude: 'GPS 纬度',
  GPSLongitude: 'GPS 经度', gpsLongitude: 'GPS 经度',
  GPSAltitude: 'GPS 海拔', gpsAltitude: 'GPS 海拔',
  GPSAltitudeRef: 'GPS 海拔参考', gpsAltitudeRef: 'GPS 海拔参考',
  GPSLatitudeRef: 'GPS 纬度参考', gpsLatitudeRef: 'GPS 纬度参考',
  GPSLongitudeRef: 'GPS 经度参考', gpsLongitudeRef: 'GPS 经度参考',
  GPSSpeed: 'GPS 速度', gpsSpeed: 'GPS 速度',
  GPSSpeedRef: 'GPS 速度单位', gpsSpeedRef: 'GPS 速度单位',
  GPSImgDirection: 'GPS 方向角', gpsImgDirection: 'GPS 方向角',
  GPSImgDirectionRef: 'GPS 方向参考', gpsImgDirectionRef: 'GPS 方向参考',
  GPSDateStamp: 'GPS 日期', gpsDateStamp: 'GPS 日期',
  GPSTimeStamp: 'GPS 时间', gpsTimeStamp: 'GPS 时间',
  GPSProcessingMethod: 'GPS 处理方式', gpsProcessingMethod: 'GPS 处理方式',
  GPSMapDatum: 'GPS 地图基准', gpsMapDatum: 'GPS 地图基准',
  GPSVersionID: 'GPS 版本', gpsVersionID: 'GPS 版本',
  // ── 文件与版权 ──
  Artist: '作者', artist: '作者',
  Copyright: '版权', copyright: '版权',
  ImageDescription: '图片描述', imageDescription: '图片描述',
  UserComment: '用户备注', userComment: '用户备注',
  // ── 设备与系统 ──
  HostComputer: '主机设备', hostComputer: '主机设备',
  DocumentName: '文档名称', documentName: '文档名称',
  SerialNumber: '序列号', serialNumber: '序列号',
  BodySerialNumber: '机身序列号', bodySerialNumber: '机身序列号',
  UniqueCameraModel: '相机唯一型号', uniqueCameraModel: '相机唯一型号',
  // ── 其他 ──
  SubSecTime: '子秒时间', subSecTime: '子秒时间',
  SubSecTimeOriginal: '子秒拍摄时间', subSecTimeOriginal: '子秒拍摄时间',
  SubSecTimeDigitized: '子秒数字化时间', subSecTimeDigitized: '子秒数字化时间',
  FlashpixVersion: 'Flashpix 版本', flashpixVersion: 'Flashpix 版本',
  ExifVersion: 'EXIF 版本', exifVersion: 'EXIF 版本',
  ComponentsConfiguration: '通道配置', componentsConfiguration: '通道配置',
  CompressedBitsPerPixel: '压缩 BPP', compressedBitsPerPixel: '压缩 BPP',
  InteropIndex: '互操作性', interopIndex: '互操作性',
  InteropVersion: '互操作版本', interopVersion: '互操作版本',
}

const formatKey = (k) => EXIF_ZH[k] || EXIF_ZH[k.charAt(0).toLowerCase() + k.slice(1)] || k

const formatVal = (v) => {
  if (v instanceof Date) return v.toLocaleString('zh-CN')
  if (typeof v === 'number') {
    // 经纬度保留 6 位，其他整数直接显示
    if (v > -180 && v < 180 && !Number.isInteger(v)) return v.toFixed(6) + '°'
    return Number.isInteger(v) ? String(v) : v.toFixed(4)
  }
  if (Array.isArray(v)) return v.map(x => typeof x === 'number' ? x.toFixed(2) : x).join(', ')
  return String(v)
}

/* 通过 Canvas 重绘来剥离 EXIF */
const clearAndDownload = () => {
  if (!previewUrl.value) return
  const img = new Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = img.naturalWidth
    canvas.height = img.naturalHeight
    canvas.getContext('2d').drawImage(img, 0, 0)
    const mime = currentFile.value?.type === 'image/png' ? 'image/png' : 'image/jpeg'
    const ext  = mime === 'image/png' ? 'png' : 'jpg'
    canvas.toBlob((blob) => {
      downloadBlob(blob, `${fileName.value}_noexif.${ext}`)
      showToast({ message: 'EXIF 已清除，图片已下载', type: 'success' })
    }, mime, 0.95)
  }
  img.src = previewUrl.value
}
</script>

<style scoped>
:deep(.tool-body) { padding-top: var(--spacing-md); }
.tool-page { flex: 1; display: flex; flex-direction: column; width: 100%; min-width: 0; }
.preview-stack { min-width: 0; width: 100%; display: flex; flex-direction: column; gap: var(--spacing-sm); }
.exif-actions { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.exif-preview-img { max-width: 100%; max-height: 100%; object-fit: contain; }

.control-panel { box-sizing: border-box; width: 100%; min-width: 0; overflow-x: hidden; display: flex; flex-direction: column; gap: var(--spacing-md); }

.exif-empty {
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 8px; padding: var(--spacing-xl); color: var(--color-text-muted); text-align: center;
  min-height: 200px; opacity: 0.6;
}

.exif-warning {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 10px 12px;
  background: rgba(201,90,74,0.10);
  border: 1px solid var(--color-destructive);
  border-radius: var(--radius-md);
  font-size: 12px; font-weight: 600; color: var(--color-destructive); line-height: 1.4;
}

.exif-list {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 460px;
  overflow-y: auto;
}
.exif-row {
  display: flex; align-items: flex-start; gap: 8px;
  padding: 7px 12px;
  border-bottom: 1px solid var(--color-border);
  font-size: 12px;
}
.exif-row:last-child { border-bottom: none; }
.exif-key {
  flex-shrink: 0; width: 110px; color: var(--color-text-muted);
  font-weight: 500; font-family: var(--font-heading); font-size: 11px;
  padding-top: 1px;
}
.exif-val {
  flex: 1; color: var(--color-foreground); word-break: break-all; line-height: 1.5;
}
.exif-gps { color: var(--color-destructive); font-weight: 600; }
</style>
