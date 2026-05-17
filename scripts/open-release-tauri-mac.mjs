#!/usr/bin/env node
/** 仅在本地 macOS 打开 `release/tauri`（CI/GitHub Actions 跳过，避免在无界面环境调用 `open`） */
import { spawnSync } from 'node:child_process'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

if (process.env.GITHUB_ACTIONS === 'true' || process.env.CI === 'true') process.exit(0)
if (process.platform !== 'darwin') process.exit(0)

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
spawnSync('open', [resolve(root, 'release', 'tauri')], { stdio: 'inherit' })
