
import torch
import torch.nn as nn
from torchvision import models


class MultiTaskResNet50(nn.Module):
    def __init__(self):
        super().__init__()

        # Match the architecture used during training
        backbone = models.resnet50(weights=None)

        feature_count = backbone.fc.in_features
        backbone.fc = nn.Identity()

        self.backbone = backbone
        self.fracture_head = nn.Linear(feature_count, 2)
        self.region_head = nn.Linear(feature_count, 3)

    def forward(self, x):
        features = self.backbone(x)

        fracture_logits = self.fracture_head(features)
        region_logits = self.region_head(features)

        return fracture_logits, region_logits


def load_classifier(checkpoint_path, device):
    model = MultiTaskResNet50()

    checkpoint = torch.load(
        checkpoint_path,
        map_location=device,
        weights_only=True
    )

    # Extract model weights from the saved checkpoint
    if "model_state_dict" in checkpoint:
        state_dict = checkpoint["model_state_dict"]
    elif "state_dict" in checkpoint:
        state_dict = checkpoint["state_dict"]
    else:
        state_dict = checkpoint

    model.load_state_dict(state_dict)
    model.to(device)
    model.eval()

    return model
