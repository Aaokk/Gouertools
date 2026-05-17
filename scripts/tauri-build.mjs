/**
 * 1) CARGO_TARGET_DIR → 仓库根目录下 tauri-dist（避免卡在 src-tauri/target/… 深路径）
 * 2) 将 DMG / NSIS 安装包复制到 release/tauri/，成品路径简短好找
 */
import { spawnSync } from 'node:child_process'
import { mkdirSync, readdirSync, copyFileSync, statSync, rmSync, existsSync } from 'node:fs'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { withRustupPathFirst } from './tauri-env.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const outTarget = resolve(root, 'tauri-dist')
process.env.CARGO_TARGET_DIR = outTarget

/** 传给 `tauri build` 的额外参数，例如 CI 上传参 */
const forwarded = process.argv.slice(2)
const runArgs = ['tauri', 'build', ...forwarded]

/** Cargo：未指定 target → `$CARGO_TARGET_DIR/release/…`；`--target TRIPLE` → `$CARGO_TARGET_DIR/TRIPLE/release/…` */
function cargoTargetTripleFromArgv (argv) {
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--target' && argv[i + 1]) return argv[i + 1]
    if (typeof a === 'string' && a.startsWith('--target='))
      return a.slice('--target='.length).trim()
  }
  return null
}

/** @param {string | null} triple */
function cargoBundleRoots (triple) {
  const paths = triple
    ? [join(outTarget, triple, 'release', 'bundle'), join(outTarget, 'release', 'bundle')]
    : [join(outTarget, 'release', 'bundle')]
  return [...new Set(paths)]
}

function pickExistingBundleRoot (triple) {
  for (const p of cargoBundleRoots(triple)) {
    try {
      if (statSync(p).isDirectory()) return p
    } catch {}
  }
  return cargoBundleRoots(triple)[0]
}

const run = spawnSync('npx', runArgs, {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  env: withRustupPathFirst({ ...process.env, CARGO_TARGET_DIR: outTarget }),
})

if (run.status !== 0 && run.status != null) {
  process.exit(run.status)
}
if (run.error) throw run.error

const forwardedTriple = cargoTargetTripleFromArgv(forwarded)
const bundleRoot = pickExistingBundleRoot(forwardedTriple)
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
  console.info(`\n[tauri-build] 未找到可复制的 DMG/EXE`)
  console.info(` • 先看目录是否存在: ${bundleRoot}`)
  if (forwardedTriple) {
    console.info(
      ` • 你已使用 --target ${forwardedTriple}，Cargo bundle 往往在 ${join(
        outTarget,
        forwardedTriple,
        'release',
        'bundle',
      )}，而不是顶层 release/bundle`,
    )
  }
  console.info(` • release/tauri/ 仍会创建；若整条命令失败则无此目录`)
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

if (
  process.platform === 'darwin' &&
  process.arch === 'arm64' &&
  !forwarded.some((arg) =>
    /^x86_64-apple-darwin$/.test(arg) || /^aarch64-apple-darwin$/.test(arg))
) {
  const joined = forwarded.join(' ')
  if (!joined.includes('x86_64-apple-darwin') && !joined.includes('--target')) {
    console.info(
      '\n[tauri-build] macOS：当前为本机 aarch64 构建，产出为 Apple Silicon DMG。\n' +
        'Intel (x86_64) DMG 需：`rustup target add x86_64-apple-darwin` → `npm run tauri:build:mac-intel`。',
    )
  }
}
