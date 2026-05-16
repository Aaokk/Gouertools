#!/usr/bin/env python3
"""
合成 macOS「boxed」桌面应用图标主图（通常 1024×1024 → 再由 tauri/Xcode 导出多档）。

图层（从外到内）：
1. **outer_margin_px**：整张主图四周透明留白（常为 ~50px，对齐 Apple Design Resources）。
2. **plate_extra_inset_px**：在余下的「安全矩形」内侧再缩一圈，才把**浅色圆角底板**画上。
   Boxed App（Chrome 等）的圆角白板通常不占满整块 924²，否则在 Dock/Finder 里会比邻居显大。
3. **glyph_of_plate_frac**：Logo 最长边相对于**当前底板边长**的比例（提高可减小「白墙边距太大、字太小」）。

用法:
  python3 scripts/pad-square-icon.py macos-plate \\
    <输入.png> <输出.png> <边长px> <outer_margin_px> <plate_extra_inset_px> <glyph占底板边长比例>
  python3 scripts/pad-square-icon.py float <输入.png> <输出.png> <边长px> <内容占边长比例>

示例:
  python3 scripts/pad-square-icon.py macos-plate logo.png out.png 1024 50 48 0.92

参考：
  https://developer.apple.com/library/archive/documentation/Xcode/Reference/xcode_ref-Asset_Catalog_Format/AppIconType.html
"""
from __future__ import annotations

import sys
from PIL import Image, ImageDraw

CORNER_RADIUS_FRAC = 0.2237
DEFAULT_PLATE = (255, 255, 255, 255)


def compose_float (_inp: str, outp: str, size: int, frac: float) -> None:
  inner = max(1, int(round(size * frac)))
  img = Image.open(_inp).convert('RGBA')
  img.thumbnail((inner, inner), Image.Resampling.LANCZOS)
  canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
  x = (size - img.width) // 2
  y = (size - img.height) // 2
  canvas.paste(img, (x, y), img)
  canvas.save(outp)


def compose_macos_plate (
  _inp: str,
  outp: str,
  size: int,
  outer_margin_px: int,
  plate_extra_inset_px: int,
  glyph_of_plate_frac: float,
) -> None:
  canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
  outer = max(0, int(outer_margin_px))
  inset = max(0, int(plate_extra_inset_px))
  left = outer + inset
  top = outer + inset
  right = size - 1 - outer - inset
  bottom = size - 1 - outer - inset
  if left >= right or top >= bottom:
    raise ValueError('outer_margin + plate_extra_inset 过大，底板没有空间')

  pw = right - left + 1

  draw = ImageDraw.Draw(canvas)
  r_plate = max(6, int(round(pw * CORNER_RADIUS_FRAC)))
  draw.rounded_rectangle([(left, top), (right, bottom)], radius=r_plate, fill=DEFAULT_PLATE)

  logo_max = max(1, int(round(pw * glyph_of_plate_frac)))
  logo = Image.open(_inp).convert('RGBA')
  logo.thumbnail((logo_max, logo_max), Image.Resampling.LANCZOS)
  cx = (left + right + 1) // 2
  cy = (top + bottom + 1) // 2
  x = cx - logo.width // 2
  y = cy - logo.height // 2
  canvas.paste(logo, (x, y), logo)
  canvas.save(outp)


def main () -> None:
  argv = sys.argv[1:]
  style = argv[0] if argv else ''
  if style == 'float':
    if len(argv) < 5:
      print(__doc__.strip(), file=sys.stderr)
      sys.exit(1)
    _inp, outp, size_s, frac_s = argv[1:5]
    compose_float(_inp, outp, int(size_s, 10), float(frac_s))
    return

  if style == 'macos-plate':
    if len(argv) < 7:
      print(__doc__.strip(), file=sys.stderr)
      sys.exit(1)
    _inp, outp = argv[1], argv[2]
    size_i = int(argv[3], 10)
    outer_px = int(argv[4], 10)
    plate_inset_px = int(argv[5], 10)
    glyph_f = float(argv[6])
    compose_macos_plate(_inp, outp, size_i, outer_px, plate_inset_px, glyph_f)
    return

  print(__doc__.strip(), file=sys.stderr)
  sys.exit(1)


if __name__ == '__main__':
  main()
