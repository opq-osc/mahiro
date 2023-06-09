from pathlib import Path
from typing import List

from pil_utils import BuildImage

img_dir = Path(__file__).parent / "images"


def good_news(images, texts: List[str], args):
    text = texts[0]
    frame = BuildImage.open(img_dir / "0.jpg")
    try:
        frame.draw_text(
            (50, 100, frame.width - 50, frame.height - 100),
            text,
            allow_wrap=True,
            lines_align="center",
            max_fontsize=60,
            min_fontsize=30,
            fill=(238, 0, 0),
            stroke_ratio=1 / 15,
            stroke_fill=(255, 255, 153),
        )
    except ValueError:
        pass
    return frame.save_png()
