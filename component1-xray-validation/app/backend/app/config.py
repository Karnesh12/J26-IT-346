"""Settings for the BoneVision Component 1 backend (paths, model files, decision thresholds)."""
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent      # .../app/backend
MODEL_DIR = BASE_DIR / "models"

# trained model files (copied from Google Drive outputs/)
MODEL1_FILES = {                                       # Model 1 v2: X-ray vs non-X-ray
    "mobilenetv3": MODEL_DIR / "mobilenetv3_model1v2_best.pt",
    "deit_small":  MODEL_DIR / "deit_small_model1v2_best.pt",
}
MODEL2_FILES = {                                       # Model 2: anatomical region (7 classes)
    "mobilenetv3": MODEL_DIR / "mobilenetv3_model2_best.pt",
    "deit_small":  MODEL_DIR / "deit_small_model2_best.pt",
}

IMG_SIZE = 224

# Model 1 three-way gate (fixed in advance, see notebook model1/05_unseen_test)
XRAY_ACCEPT = 0.70      # p(X-ray) >= 0.70  -> X-ray
XRAY_REJECT = 0.30      # p(X-ray) <  0.30  -> not an X-ray, otherwise "uncertain"

# Stage 0 colour check: real X-rays are grayscale. Images at least "moderately colourful"
# (Hasler & Suesstrunk 2003 colourfulness >= 33) are rejected before Model 1.
# Tinted phone photos of X-rays (dental test photos) scored 15-24.
COLOURFUL_REJECT = 33.0

# Model 2: explanation adds a review warning below this confidence or when the two models disagree
LOW_CONFIDENCE = 0.70

# frontend addresses allowed to call the API (React dev server)
CORS_ORIGINS = ["http://localhost:5173", "http://127.0.0.1:5173"]
