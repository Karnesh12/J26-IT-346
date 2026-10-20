
from pathlib import Path
import torch

from classifier import load_classifier

BASE_DIR = Path(__file__).resolve().parent
MODEL_PATH = BASE_DIR / "models" / "resnet50_best.pth"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

print("Device:", device)
print("Checkpoint exists:", MODEL_PATH.exists())

if not MODEL_PATH.exists():
    raise FileNotFoundError(f"Checkpoint not found: {MODEL_PATH}")

print("Loading ResNet50 checkpoint...")

model = load_classifier(MODEL_PATH, device)

print("SUCCESS: ResNet50 checkpoint loaded!")
print("Model type:", type(model).__name__)
