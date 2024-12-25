const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const { autoUpdater } = require('electron-updater')
const log = require('electron-log')
const path = require('path')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development'

// 配置日志
log.transports.file.level = 'debug'
autoUpdater.logger = log

// 配置更新
autoUpdater.autoDownload = false  // 改为手动下载
autoUpdater.autoInstallOnAppQuit = false
autoUpdater.disableWebInstaller = true
autoUpdater.allowDowngrade = true
autoUpdater.forceDevUpdateConfig = true

// 获取当前系统架构
const currentArch = process.arch === 'arm64' ? 'arm64' : 'x64'

// 修改更新服务器配置
autoUpdater.setFeedURL({
  provider: 'generic',
  url: 'https://up.gouer.vip/shuiyin',
  updaterCacheDirName: 'shuiyinimg-updater'
})

// 检查更新
function checkForUpdates() {
  if (isDev) return
  
  try {
    log.info('开始检查更新...')
    log.info('当前版本:', app.getVersion())
    log.info('当前平台:', process.platform)
    log.info('当前架构:', currentArch)
    log.info('更新服务器:', autoUpdater.getFeedURL())
    log.info('缓存目录:', autoUpdater.downloadedUpdateHelper?.downloadedPath || '未知')
    
    autoUpdater.checkForUpdates().catch(err => {
      log.error('检查更新失败:', err)
    })
  } catch (error) {
    log.error('检查更新出错:', error)
  }
}

// 发现新版本
autoUpdater.on('update-available', (info) => {
  log.info('发现新版本:', info.version)
  
  // macOS 跳转网站下载
  if (process.platform === 'darwin') {
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}`,
      detail: '由于 macOS 系统限制，请前往官网下载最新版本',
      buttons: ['前往下载', '稍后更新']
    }).then((result) => {
      if (result.response === 0) {
        require('electron').shell.openExternal('https://gouer.vip/apptools/gouershuiyin.html')
      }
    })
  } 
  // Windows 使用热更新
  else {
    dialog.showMessageBox({
      type: 'info',
      title: '发现新版本',
      message: `发现新版本 ${info.version}，是否现在更新？`,
      buttons: ['更新', '稍后']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.downloadUpdate()
      }
    })
  }
})

// 更新下载进度
autoUpdater.on('download-progress', (progressObj) => {
  log.info(`下载进度: ${progressObj.percent}%`)
  // 更新任务栏进度条
  BrowserWindow.getAllWindows().forEach((window) => {
    window.setProgressBar(progressObj.percent / 100)
  })
})

// 更新下载完成
autoUpdater.on('update-downloaded', () => {
  // 仅 Windows 平台显示重启提示
  if (process.platform !== 'darwin') {
    dialog.showMessageBox({
      type: 'info',
      title: '更新就绪',
      message: '新版本已下载完成，是否立即重启应用？',
      buttons: ['重启', '稍后']
    }).then((result) => {
      if (result.response === 0) {
        autoUpdater.quitAndInstall()
      }
    })
  }
})

// 更新错误处理
autoUpdater.on('error', (err) => {
  log.error('更新错误:', err)
  
  // 对于 macOS，提示用户手动下载
  if (process.platform === 'darwin') {
    dialog.showMessageBox({
      type: 'info',
      title: '更新提示',
      message: '请前往官网下载最新版本',
      detail: 'https://gouer.vip/apptools/gouershuiyin.html',
      buttons: ['前往下载', '取消']
    }).then((result) => {
      if (result.response === 0) {
        require('electron').shell.openExternal('https://gouer.vip/apptools/gouershuiyin.html')
      }
    })
    return
  }
  
  // 其他平台显示错误信息
  dialog.showMessageBox({
    type: 'error',
    title: '更新错误',
    message: '更新过程中发生错误',
    detail: err.message,
    buttons: ['确定']
  })
})

function createWindow() {
  const win = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    autoHideMenuBar: true,
    menuBarVisible: false,
    frame: true
  })

  // 隐藏菜单栏
  win.setMenuBarVisibility(false)
  
  // 设置空菜单（适用于 macOS）
  Menu.setApplicationMenu(null)

  // 只在开发环境打开开发者工具
  if (isDev) {
    win.webContents.openDevTools()
    win.loadURL('http://localhost:5173')
  } else {
    // 生产环境
    win.loadFile(path.join(__dirname, '../dist/index.html'))
    // 移除这行，不在生产环境打开开发者工具
    // win.webContents.openDevTools()
  }

  // 添加错误处理
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('页面加载失败:', errorCode, errorDescription)
  })

  // 窗创建后检查更新
  checkForUpdates()

  // 添加窗口关闭事件处理
  win.on('close', (event) => {
    // 设置退出标志
    app.isQuitting = true
    
    // 在 macOS 上特殊处理
    if (process.platform === 'darwin') {
      app.dock.hide() // 隐藏程序坞图标
    }
  })
}

// 添加 IPC 处理器
ipcMain.handle('dialog:openFile', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  })
  if (!canceled) {
    return filePaths[0]
  }
  return null
})

// 修改选择目录的处理器
ipcMain.handle('dialog:selectDirectory', async () => {
  try {
    console.log('Showing directory dialog')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory'],
      title: '选择保存目录'
    })
    console.log('Directory dialog result:', result)
    return result
  } catch (error) {
    console.error('选择目录失败:', error)
    throw error
  }
})

// 修改保存图片的处理器
ipcMain.handle('file:saveImage', async (event, { dataUrl, path: filePath }) => {
  try {
    console.log('Saving image to:', filePath)
    const base64Data = dataUrl.replace(/^data:image\/\w+;base64,/, '')
    const buffer = Buffer.from(base64Data, 'base64')
    
    // 确保目录存在
    const dir = path.dirname(filePath)
    await fs.promises.mkdir(dir, { recursive: true })
    
    // 写入文件
    await fs.promises.writeFile(filePath, buffer)
    return { success: true }
  } catch (error) {
    console.error('保存图片失败:', error)
    throw error
  }
})

// 添加保存文件的处理程序
ipcMain.handle('dialog:saveFile', async (event, suggestedName) => {
  const result = await dialog.showSaveDialog({
    defaultPath: suggestedName,
    filters: [
      { name: '所有文件', extensions: ['*'] }
    ]
  })
  
  if (!result.canceled) {
    return result.filePath
  }
  return null
})

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// 修改窗口关闭处理
app.on('window-all-closed', () => {
  // 在 macOS 上也退出应用
  if (process.platform === 'darwin') {
    app.dock.hide() // 隐藏程序坞图标
  }
  app.quit()
})

// 添加窗口关闭前的处理
app.on('before-quit', () => {
  app.isQuitting = true
  if (process.platform === 'darwin') {
    app.dock.hide()
  }
})

// 添加将要退出处理
app.on('will-quit', () => {
  // 确保应用完全退出
  setTimeout(() => {
    if (process.platform === 'darwin') {
      app.dock.hide()
    }
    process.exit(0)
  }, 100)
}) 