const { build } = require('vite')
const { join } = require('path')
const { writeFileSync } = require('fs')

async function buildElectronApp() {
  try {
    // 构建渲染进程
    await build({
      configFile: join(__dirname, '../vite.config.js')
    })
    
    console.log('Build complete!')
  } catch (err) {
    console.error('Build failed:', err)
    process.exit(1)
  }
}

buildElectronApp() 