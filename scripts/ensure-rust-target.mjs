#!/usr/bin/env node
/**
 * CI / 本地：为指定 rustc triple 安装 `rustup target add` + 校验可用 std。
 * usage: node scripts/ensure-rust-target.mjs [TRIPLE]，默认 x86_64-apple-darwin。
 */
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { withRustupPathFirst } from './tauri-env.mjs'

const target = process.argv[2]?.trim() || 'x86_64-apple-darwin'
const pathRustup = join(homedir(), '.cargo', 'bin', 'rustup')
const rustupBin = existsSync(pathRustup) ? pathRustup : 'rustup'

const env = withRustupPathFirst(process.env)

const run = spawnSync(rustupBin, ['target', 'add', target], {
  stdio: 'inherit',
  env,
})

if (run.error) {
  console.error(
    '[ensure-rust-target] 找不到 rustup。请安装：https://rustup.rs 或使用 rustup。',
  )
  console.error(run.error)
  process.exit(1)
}
if (run.status !== 0 && run.status != null) {
  process.exit(run.status)
}

const listed = spawnSync(rustupBin, ['target', 'list', '--installed'], {
  encoding: 'utf8',
  env,
})
if (listed.error || listed.status !== 0) {
  console.error('[ensure-rust-target] rustup target list --installed 失败')
  process.exit(listed.status ?? 1)
}
if (!listed.stdout.includes(target)) {
  console.error(`[ensure-rust-target] 已执行 add，但未在「已安装 target」中看到 ${target}：`)
  console.error(listed.stdout)
  process.exit(1)
}

const rustc = join(homedir(), '.cargo', 'bin', 'rustc')
if (existsSync(rustc)) {
  const lib = spawnSync(rustc, ['--print', 'target-libdir', '--target', target], {
    encoding: 'utf8',
    env,
  })
  if ((lib.status !== 0 && lib.status != null) || !(lib.stdout || '').trim()) {
    console.error(
      `[ensure-rust-target] rustc 找不到 ${target} 的标准库。\n请执行：rustup toolchain install stable && rustup default stable && rustup target add ${target}`,
    )
    if ((lib.stderr || '').trim()) console.error(lib.stderr)
    process.exit(1)
  }
}

console.info(
  `[ensure-rust-target] OK: ${target} 已就绪（PATH 优先 ~/.cargo/bin，避免沿用 Homebrew 的 Rust）。`,
)
