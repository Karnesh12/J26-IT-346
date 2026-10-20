
from pathlib import Path
import io

import torch
from PIL import Image, UnidentifiedImageError
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from torchvision import transforms
from ultralytics import YOLO

from classifier import load_classifier
from gradcam import generate_gradcam


# --------------------------------------------------
# 1. PATHS AND DEVICE
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parent
MODEL_DIR = BASE_DIR / "models"

DEVICE = torch.device(
    "cuda" if torch.cuda.is_available() else "cpu"
)

RESNET_PATH = MODEL_DIR / "resnet50_best.pth"
YOLO_PATH = MODEL_DIR / "yolo11n_version2_best.pt"


# --------------------------------------------------
# 2. LOAD TRAINED MODELS
# --------------------------------------------------

if not RESNET_PATH.exists():
    raise FileNotFoundError(
        f"ResNet50 checkpoint not found: {RESNET_PATH}"
    )

if not YOLO_PATH.exists():
    raise FileNotFoundError(
        f"YOLO11 checkpoint not found: {YOLO_PATH}"
    )

classifier = load_classifier(RESNET_PATH, DEVICE)
detector = YOLO(str(YOLO_PATH))

print("Fracture Recognition API initialized")
print("Device:", DEVICE)
print("ResNet50 loaded:", RESNET_PATH.name)
print("YOLO11 loaded:", YOLO_PATH.name)


# --------------------------------------------------
# 3. IMAGE PREPROCESSING
# Must match the transform used during model evaluation.
# --------------------------------------------------

IMAGE_SIZE = 224

preprocess = transforms.Compose([
    transforms.Resize((IMAGE_SIZE, IMAGE_SIZE)),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225]
    )
])


# --------------------------------------------------
# 4. CLASS LABELS
# --------------------------------------------------

FRACTURE_CLASSES = [
    "Non-Fractured",
    "Fractured"
]

REGION_CLASSES = [
    "Elbow to Wrist (Radius, Ulna)",
    "Shoulder point to Elbow (Humerus)",
    "Wrist and Hand (Carpals, Metacarpals, Phalanges)"
]


# --------------------------------------------------
# 5. DISPLAY THRESHOLDS
# Provisional only; not clinically validated.
# --------------------------------------------------

MIN_FRACTURE_CONFIDENCE = 0.70
MIN_REGION_CONFIDENCE = 0.70
YOLO_CONFIDENCE_THRESHOLD = 0.25


# --------------------------------------------------
# 6. FASTAPI APPLICATION
# --------------------------------------------------

app = FastAPI(
    title="Musculoskeletal Fracture Recognition API",
    description=(
        "Research prototype for X-ray classification, "
        "Grad-CAM visualization, and experimental localization."
    ),
    version="1.2.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)


# --------------------------------------------------
# 7. HOME ENDPOINT
# --------------------------------------------------

@app.get("/")
def home():
    return {
        "message": "Fracture Recognition API is running",
        "device": str(DEVICE),
        "classifier": "ResNet50",
        "localization_model": "YOLO11",
        "explainability": "Grad-CAM"
    }


# --------------------------------------------------
# 8. PREDICTION ENDPOINT
# --------------------------------------------------

@app.post("/predict")
async def predict(file: UploadFile = File(...)):

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail="Please upload a JPG, PNG, or WEBP image."
        )

    # Read and validate image.
    try:
        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail="The uploaded file is empty."
            )

        image = Image.open(
            io.BytesIO(content)
        ).convert("RGB")

    except HTTPException:
        raise

    except (UnidentifiedImageError, OSError, ValueError):
        raise HTTPException(
            status_code=400,
            detail="The uploaded file is not a valid image."
        )

    # --------------------------------------------------
    # A. RESNET50 CLASSIFICATION
    # --------------------------------------------------

    tensor = preprocess(image).unsqueeze(0).to(DEVICE)

    with torch.inference_mode():
        fracture_logits, region_logits = classifier(tensor)

        fracture_probs = torch.softmax(
            fracture_logits, dim=1
        )[0]

        region_probs = torch.softmax(
            region_logits, dim=1
        )[0]

    fracture_idx = int(fracture_probs.argmax().item())
    region_idx = int(region_probs.argmax().item())

    fracture_confidence = float(
        fracture_probs[fracture_idx].item()
    )

    region_confidence = float(
        region_probs[region_idx].item()
    )

    fracture_prediction = FRACTURE_CLASSES[fracture_idx]
    region_prediction = REGION_CLASSES[region_idx]

    fracture_uncertain = (
        fracture_confidence < MIN_FRACTURE_CONFIDENCE
    )

    region_uncertain = (
        region_confidence < MIN_REGION_CONFIDENCE
    )

    # Always return the predicted region.
    # Confidence is shown separately.
    fracture_status = fracture_prediction
    region_name = region_prediction

    # --------------------------------------------------
    # B. GRAD-CAM EXPLAINABILITY
    # This must run OUTSIDE inference_mode().
    # --------------------------------------------------

    gradcam_image = None

    try:
        gradcam_image = generate_gradcam(
            model=classifier,
            input_tensor=tensor,
            original_image=image,
            target_class=fracture_idx
        )

        gradcam_note = (
            "Grad-CAM highlights image areas that influenced "
            "the selected classification. It is not a verified "
            "fracture boundary or a diagnostic result."
        )

    except Exception as exc:
        print("Grad-CAM error:", repr(exc))

        gradcam_note = (
            "Grad-CAM could not be generated for this image."
        )

    # --------------------------------------------------
    # C. YOLO11 EXPERIMENTAL LOCALIZATION
    # --------------------------------------------------

    boxes = []

    try:
        detection_result = detector.predict(
            source=image,
            imgsz=640,
            conf=YOLO_CONFIDENCE_THRESHOLD,
            verbose=False,
            device=str(DEVICE)
        )[0]

        if detection_result.boxes is not None:
            for box in detection_result.boxes:
                coordinates = (
                    box.xyxy[0].detach().cpu().tolist()
                )

                boxes.append({
                    "x1": round(float(coordinates[0]), 2),
                    "y1": round(float(coordinates[1]), 2),
                    "x2": round(float(coordinates[2]), 2),
                    "y2": round(float(coordinates[3]), 2),
                    "confidence": round(
                        float(box.conf[0].item()), 4
                    )
                })

        if boxes:
            localization_note = (
                "Experimental research output. "
                "Bounding boxes may be inaccurate or incomplete."
            )
        else:
            localization_note = (
                "No bounding boxes were detected at the selected "
                "confidence threshold. This does not establish "
                "that the image is fracture-free."
            )

    except Exception as exc:
        print("YOLO localization error:", repr(exc))

        localization_note = (
            "The localization model could not complete this "
            "prediction. Classification results are separate."
        )

    # --------------------------------------------------
    # D. RETURN RESULTS TO FRONTEND
    # --------------------------------------------------

    return {
        "fracture_status": fracture_status,
        "fracture_prediction": fracture_prediction,
        "fracture_confidence": round(
            fracture_confidence, 4
        ),
        "fracture_uncertain": fracture_uncertain,

        "region": region_name,
        "region_prediction": region_prediction,
        "region_confidence": round(
            region_confidence, 4
        ),
        "region_uncertain": region_uncertain,

        "gradcam_image": gradcam_image,
        "gradcam_note": gradcam_note,

        "localization_boxes": boxes,
        "localization_note": localization_note,

        "research_notice": (
            "Research prototype only. Not intended for "
            "clinical diagnosis or treatment decisions."
        )
    }
