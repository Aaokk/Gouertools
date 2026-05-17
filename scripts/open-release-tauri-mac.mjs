#!/usr/bin/env node
/** 仅在 macOS 打开 `release/tauri`，避免 GitHub Actions (Windows/Linux) 因 `open` 不存在失败 */
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.platform !== 'darwin') process.exit(0)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
spawnSync('open', [resolve(root, 'release', 'tauri')], { stdio: 'inherit' })
