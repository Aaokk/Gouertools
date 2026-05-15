const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const log = require('electron-log')
const path = require('path')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development'

/**
 * 打包后优先用 extraResources 解包出的 Resources/dist，
 * file:// + ESM/WASM 在 asar 内偶发加载失败时可避免白屏。
 */
function resolveProductionIndexHtml() {
  try {
    const resourceDist = path.join(process.resourcesPath, 'dist', 'index.html')
    if (fs.existsSync(resourceDist)) {
      return resourceDist
    }
  } catch (e) {
    log.warn('resolve ProductionIndexHtml resourcesPath:', e.message)
  }
  return path.join(__dirname, '..', 'dist', 'index.html')
}

// 配置日志
log.transports.file.level = 'debug'

function createWindow() {
  const win = new BrowserWindow({
    width: 1100,
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
    const indexPath = resolveProductionIndexHtml()
    if (!fs.existsSync(indexPath)) {
      log.error('生产环境未找到页面文件:', indexPath)
      dialog.showMessageBoxSync({
        type: 'error',
        title: 'Gouer工具包包',
        message: '无法启动：未找到页面资源。',
        detail: `路径：${indexPath}\n请确认已使用「vite build --mode electron」打包，并重新生成安装包。`
      })
      app.quit()
      return
    }
    // loadFile + hash 适配 Vue Router 的 hash 模式，比手写 file:// URL 更稳
    log.info('loadFile:', indexPath)
    win
      .loadFile(indexPath, { hash: '/' })
      .catch((err) => {
        log.error('loadFile 失败:', err)
        dialog.showMessageBoxSync({
          type: 'error',
          title: '加载失败',
          message: String(err?.message || err)
        })
      })
  }

  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    log.error('did-fail-load:', errorCode, errorDescription, validatedURL)
  })
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