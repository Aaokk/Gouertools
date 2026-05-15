/**
 * 以仓库根目录 package.json 的 version 为准，写入 src-tauri/Cargo.toml 与 src-tauri/tauri.conf.json。
 * 由 tauri.conf 的 beforeDev / beforeBuild 自动执行；亦可手动：npm run sync-version
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkgPath = join(root, 'package.json')
const cargoPath = join(root, 'src-tauri', 'Cargo.toml')
const tauriConfPath = join(root, 'src-tauri', 'tauri.conf.json')

const semverish = /^[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?(\+[0-9A-Za-z.-]+)?$/

function readPkgVersion () {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'))
  const v =
    pkg && pkg.version !== undefined ? String(pkg.version).trim() : ''
  if (!v || !semverish.test(v)) {
    throw new Error(
      `sync-version-from-package: invalid or missing package.json "version" (expect semver like 1.2.3): ${JSON.stringify(v)}`
    )
  }
  return v
}

function patchCargoPackageVersion (text, newVer) {
  const lines = text.split('\n')
  let inPackage = false
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (/^\s*\[package\]\s*$/.test(line)) {
      inPackage = true
      continue
    }
    if (/^\s*\[/.test(line) && !/^\s*\[package\]/.test(line)) {
      inPackage = false
      continue
    }
    if (inPackage && /^\s*version\s*=/.test(line)) {
      lines[i] = line.replace(
        /version\s*=\s*"[^"]*"/,
        `version = "${newVer}"`
      )
      return lines.join('\n')
    }
  }
  throw new Error('sync-version-from-package: [package] version line not found in Cargo.toml')
}

function main () {
  const version = readPkgVersion()

  const cargoBefore = readFileSync(cargoPath, 'utf8')
  const cargoAfter = patchCargoPackageVersion(cargoBefore, version)
  if (cargoAfter !== cargoBefore) {
    writeFileSync(cargoPath, cargoAfter, 'utf8')
    console.log(`[sync-version] Cargo.toml version -> ${version}`)
  }

  const tauriBefore = readFileSync(tauriConfPath, 'utf8')
  const tauriJson = JSON.parse(tauriBefore)
  if (tauriJson.version !== version) {
    tauriJson.version = version
    writeFileSync(
      tauriConfPath,
      JSON.stringify(tauriJson, null, 2) + '\n',
      'utf8'
    )
    console.log(`[sync-version] tauri.conf.json version -> ${version}`)
  }
}

main()
