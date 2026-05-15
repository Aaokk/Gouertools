/**
 * 将多个 PNG 裸数据封装为单个 .ico（Vista+ 嵌入 PNG 格式）
 * @param {Array<{ width: number, height: number, png: Uint8Array }>} entries
 * @returns {ArrayBuffer}
 */
export function buildIcoFromPngs (entries) {
  const n = entries.length
  const headerLen = 6
  const entryLen = 16
  let dataOffset = headerLen + entryLen * n
  const parts = []

  const head = new DataView(new ArrayBuffer(6))
  head.setUint16(0, 0, true)
  head.setUint16(2, 1, true)
  head.setUint16(4, n, true)
  parts.push(new Uint8Array(head.buffer))

  for (const e of entries) {
    const row = new DataView(new ArrayBuffer(16))
    row.setUint8(0, e.width >= 256 ? 0 : e.width)
    row.setUint8(1, e.height >= 256 ? 0 : e.height)
    row.setUint8(2, 0)
    row.setUint8(3, 0)
    row.setUint16(4, 1, true)
    row.setUint16(6, 32, true)
    row.setUint32(8, e.png.byteLength, true)
    row.setUint32(12, dataOffset, true)
    dataOffset += e.png.byteLength
    parts.push(new Uint8Array(row.buffer))
  }

  for (const e of entries) {
    parts.push(e.png instanceof Uint8Array ? e.png : new Uint8Array(e.png))
  }

  const total = parts.reduce((acc, u8) => acc + u8.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const u8 of parts) {
    out.set(u8, o)
    o += u8.length
  }
  return out.buffer
}
