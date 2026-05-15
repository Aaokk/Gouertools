/**
 * 1) CARGO_TARGET_DIR → 仓库根目录下 tauri-dist（避免卡在 src-tauri/target/… 深路径）
 * 2) 将 DMG / NSIS 安装包复制到 release/tauri/，成品路径简短好找
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, copyFileSync, statSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outTarget = resolve(root, 'tauri-dist')
process.env.CARGO_TARGET_DIR = outTarget

/** 传给 `tauri build` 的额外参数，例如 CI 上传参 */
const forwarded = process.argv.slice(2)
const runArgs = ['tauri', 'build', ...forwarded]

const run = spawnSync('npx', runArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, CARGO_TARGET_DIR: outTarget },
})

if (run.status !== 0 && run.status != null) {
  process.exit(run.status)
}
if (run.error) throw run.error

const bundleRoot = join(outTarget, 'release', 'bundle')
const flatOut = resolve(root, 'release', 'tauri')
// 每次打版版本号会变，产物文件名也会变；不清空会留下旧 DMG/EXE，容易误以为「没更新」
if (existsSync(flatOut)) {
  rmSync(flatOut, { recursive: true, force: true })
}
mkdirSync(flatOut, { recursive: true })

/** @type {string[]} */
const copied = []
for (const sub of ['dmg', 'nsis', 'msi', 'macos']) {
  const dir = join(bundleRoot, sub)
  try {
    if (!statSync(dir).isDirectory()) continue
  } catch {
    continue
  }
  for (const name of readdirSync(dir)) {
    const lower = name.toLowerCase()
    if (!(lower.endsWith('.dmg') || lower.endsWith('.exe'))) continue
    // macOS 打包链（hdiutil 等）会在 bundle 内生成 rw.<pid>.产品名.dmg，属读写临时映像，不是给用户安装的成品
    if (lower.endsWith('.dmg') && /^rw\.\d+\./i.test(name)) continue
    const src = join(dir, name)
    if (!statSync(src).isFile()) continue
    const dest = join(flatOut, name)
    copyFileSync(src, dest)
    copied.push(dest)
  }
}

if (copied.length) {
  console.info('\n[tauri-build] 已复制到简短目录 release/tauri/')
  copied.forEach((p) => console.info(' •', p))
  console.info(`\n中间产物仍在: ${bundleRoot}`)
} else {
  console.info(`\n[tauri-build] 未找到 DMG/EXE，请到 ${bundleRoot} 查看`)
}

if (
  copied.length > 0 &&
  !copied.some((p) => /\.exe$/i.test(p)) &&
  process.platform !== 'win32'
) {
  console.info(
    '\n[tauri-build] Windows 安装包（NSIS .exe）：在 Windows 环境执行 `npm run tauri:build`，' +
      '或使用 `.github/workflows/tauri-windows.yml`（GitHub Actions）。'
  )
}
