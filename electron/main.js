const { app, BrowserWindow, ipcMain, dialog, Menu } = require('electron')
const path = require('path')
const fs = require('fs')
const isDev = process.env.NODE_ENV === 'development'

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

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
}) 