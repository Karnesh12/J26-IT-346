"""Load the four trained models from the .pt files (no internet needed: pretrained=False + saved weights)."""
from dataclasses import dataclass, field

import timm
import torch
import torch.nn as nn
from torchvision.models import mobilenet_v3_large

from .config import MODEL1_FILES, MODEL2_FILES

IMAGENET_MEAN = [0.485, 0.456, 0.406]
IMAGENET_STD = [0.229, 0.224, 0.225]


@dataclass
class LoadedModel:
    name: str
    net: nn.Module
    mean: list
    std: list
    extra: dict = field(default_factory=dict)


def _mobilenet(num_classes: int) -> nn.Module:
    net = mobilenet_v3_large()                                   # empty network, weights come from the .pt file
    net.classifier[3] = nn.Linear(net.classifier[3].in_features, num_classes)
    return net


def _load(name: str, path, num_classes: int) -> LoadedModel:
    if not path.exists():
        raise FileNotFoundError(f"Model file not found: {path}")
    ckpt = torch.load(path, map_location="cpu", weights_only=False)
    timm_name = ckpt.get("timm_name", "torchvision")
    if name.startswith("mobilenet") or timm_name == "torchvision":
        net = _mobilenet(num_classes)
    else:
        net = timm.create_model(timm_name, pretrained=False, num_classes=num_classes)
    net.load_state_dict(ckpt["state_dict"])
    net.eval()
    return LoadedModel(name=name, net=net,
                       mean=ckpt.get("mean", IMAGENET_MEAN), std=ckpt.get("std", IMAGENET_STD),
                       extra={k: ckpt[k] for k in ("classes", "super", "epoch") if k in ckpt})


class ModelRegistry:
    """Holds all models in memory so every request is fast."""

    def __init__(self):
        self.model1 = {name: _load(name, path, 2) for name, path in MODEL1_FILES.items()}
        self.model2 = {name: _load(name, path, 7) for name, path in MODEL2_FILES.items()}

        # class names and HAND/LEG/OTHER mapping were saved inside the Model 2 checkpoints
        ref = self.model2["mobilenetv3"].extra
        self.classes = list(ref["classes"])
        self.super_map = dict(ref["super"])
        for m in self.model2.values():
            if "classes" in m.extra and list(m.extra["classes"]) != self.classes:
                raise ValueError(f"Class order differs in {m.name}")

    def summary(self) -> dict:
        return {"model1": list(self.model1), "model2": list(self.model2),
                "classes": self.classes, "super_map": self.super_map}
