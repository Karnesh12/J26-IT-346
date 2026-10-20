
from pathlib import Path
import torch

MODEL_PATH = (
    Path(__file__).resolve().parent
    / "models"
    / "resnet50_best.pth"
)

checkpoint = torch.load(
    MODEL_PATH,
    map_location="cpu",
    weights_only=True
)

print("Checkpoint keys:")
for key in checkpoint:
    print(" -", key)

print("\nFracture classes:")
print(checkpoint.get("fracture_classes", "Not saved"))

print("\nRegion classes:")
print(checkpoint.get("region_classes", "Not saved"))

print("\nImage size:")
print(checkpoint.get("image_size", "Not saved"))
