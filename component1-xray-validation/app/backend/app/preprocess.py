"""Image preprocessing - identical to the training pipeline (notebooks model1/03 and model2/01).

EXIF orientation fix, 16-bit -> 8-bit, transparency -> black, grayscale, pad to a black square, resize to 224x224.
"""
import io

import numpy as np
import torch
from PIL import Image, ImageOps

from .config import IMG_SIZE


def colourfulness(im: Image.Image) -> float:
    """Hasler & Suesstrunk (2003) colourfulness: 0 = gray, ~15 slightly, ~33 moderately, ~45+ very colourful."""
    small = im.convert("RGB")
    small.thumbnail((256, 256))
    a = np.asarray(small, dtype=np.float32)
    rg = a[..., 0] - a[..., 1]
    yb = 0.5 * (a[..., 0] + a[..., 1]) - a[..., 2]
    return float(np.hypot(rg.std(), yb.std()) + 0.3 * np.hypot(rg.mean(), yb.mean()))


def load_and_prepare(file_bytes: bytes):
    """Raw uploaded file -> (224x224 grayscale uint8 array exactly like the training cache, colourfulness)."""
    with Image.open(io.BytesIO(file_bytes)) as im:
        im = ImageOps.exif_transpose(im)
        colour = colourfulness(im) if im.mode in ("RGB", "RGBA", "P", "CMYK", "YCbCr") else 0.0
        if im.mode in ("I;16", "I;16B", "I;16L", "I", "F"):
            a = np.asarray(im, dtype=np.float32)
            a = (a - a.min()) / max(float(a.max() - a.min()), 1.0) * 255
            im = Image.fromarray(a.astype(np.uint8))
        if im.mode == "P":
            im = im.convert("RGBA")
        if im.mode in ("RGBA", "LA"):
            background = Image.new("RGBA", im.size, (0, 0, 0, 255))
            im = Image.alpha_composite(background, im.convert("RGBA"))
        im = im.convert("L")
        w, h = im.size
        side = max(w, h)
        canvas = Image.new("L", (side, side), 0)
        canvas.paste(im, ((side - w) // 2, (side - h) // 2))
        return np.asarray(canvas.resize((IMG_SIZE, IMG_SIZE), Image.BILINEAR), dtype=np.uint8), colour


def to_tensor(gray: np.ndarray, mean, std) -> torch.Tensor:
    """224x224 uint8 -> normalised 1x3x224x224 tensor (gray copied to 3 channels, like in training)."""
    t = torch.from_numpy(gray.copy()).float().div(255).unsqueeze(0).repeat(3, 1, 1)
    mean = torch.tensor(mean).view(3, 1, 1)
    std = torch.tensor(std).view(3, 1, 1)
    return ((t - mean) / std).unsqueeze(0)
