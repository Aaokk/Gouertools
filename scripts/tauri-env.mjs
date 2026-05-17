/**
 * 让 Cargo/Rustup 优先于 Homebrew：`brew install rust` 的 toolchain 无法用 `rustup target add x86_64-apple-darwin`。
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, delimiter } from 'node:path'

/** @param {NodeJS.ProcessEnv} [baseEnv] */
export function withRustupPathFirst (baseEnv = process.env) {
  const cargoBin = join(homedir(), '.cargo', 'bin')
  if (!existsSync(join(cargoBin, 'cargo'))) return baseEnv
  const p = baseEnv.PATH || ''
  const parts = p.split(delimiter).filter(Boolean)
  const rest = parts.filter((segment) => segment !== cargoBin)
  return {
    ...baseEnv,
    PATH: rest.length ? `${cargoBin}${delimiter}${rest.join(delimiter)}` : cargoBin,
  }
}
