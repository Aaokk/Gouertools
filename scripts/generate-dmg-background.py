#!/usr/bin/env python3
"""
生成 macOS DMG 背景图（Tauri 仅支持 background 图片，无法在卷宗窗口内单独叠文字层）。
默认：660×400，与 bundle.macOS.dmg.windowSize 一致；底部居中提示文案。

依赖：pip install pillow（开发机一般已有）
用法：python3 scripts/generate-dmg-background.py
输出：src-tauri/dmg/dmg-background.png
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "src-tauri" / "dmg" / "dmg-background.png"

# 与 tauri.conf.json → bundle.macOS.dmg.windowSize 保持一致
W, H = 660, 460
BG = "#2d2d30"
TEXT = "拖拽左边的图标到右侧文件夹！"
TEXT_FILL = "#e6e6e6"
FONT_SIZE = 17
# Finder 卷宗窗口底部有状态条/阴影，最底一行会被挡住；预留足够高度
BOTTOM_SAFE_PX = 108


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)

    font: ImageFont.ImageFont | ImageFont.FreeTypeFont | None = None
    for path, size in [
        ("/System/Library/Fonts/PingFang.ttc", FONT_SIZE),
        ("/System/Library/Fonts/Hiragino Sans GB.ttc", FONT_SIZE),
        ("/Library/Fonts/Arial Unicode.ttf", FONT_SIZE - 1),
    ]:
        try:
            font = ImageFont.truetype(path, size)
            break
        except OSError:
            continue
    if font is None:
        font = ImageFont.load_default()

    bbox = draw.textbbox((0, 0), TEXT, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    x = (W - tw) / 2
    # 文字底边距画布底边 BOTTOM_SAFE_PX，避免被底栏裁切
    y = H - BOTTOM_SAFE_PX - th
    draw.text((x, y), TEXT, fill=TEXT_FILL, font=font)
    img.save(OUT, "PNG")
    print(f"OK: {OUT} ({W}×{H})")


if __name__ == "__main__":
    main()
