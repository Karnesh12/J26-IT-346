from __future__ import annotations

import base64
import io
import logging
from contextlib import asynccontextmanager
from pathlib import Path

import numpy as np
import cv2
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image, UnidentifiedImageError
from ultralytics import YOLO


ROOT = Path(__file__).resolve().parents[1]
WEIGHTS = Path(__file__).resolve().parent / "models" / "yolov8_fracture_v1_best.pt"
MAX_UPLOAD_BYTES = 12 * 1024 * 1024
MAX_IMAGE_PIXELS = 30_000_000
logger = logging.getLogger("component4_demo")
model: YOLO | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global model
    if not WEIGHTS.is_file():
        raise RuntimeError(f"Model weights not found: {WEIGHTS}")
    model = YOLO(str(WEIGHTS))
    logger.info("Loaded segmentation model from %s", WEIGHTS)
    yield
    model = None


app = FastAPI(
    title="Component 4 Fracture Segmentation Demo",
    description="Standalone research demonstrator for fracture-mask predictions.",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/api/health")
async def health() -> dict[str, object]:
    return {"status": "ok", "model_loaded": model is not None, "model": WEIGHTS.name}


@app.post("/api/predict")
async def predict(
    file: UploadFile = File(...),
    confidence: float = Form(0.25, ge=0.05, le=0.95),
) -> dict[str, object]:
    if model is None:
        raise HTTPException(status_code=503, detail="The segmentation model is not loaded.")

    if file.content_type and not file.content_type.startswith("image/"):
        raise HTTPException(status_code=415, detail="Upload a JPG or PNG X-ray image.")

    contents = await file.read(MAX_UPLOAD_BYTES + 1)
    if not contents:
        raise HTTPException(status_code=400, detail="The uploaded file is empty.")
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image is too large. Maximum size is 12 MB.")

    try:
        with Image.open(io.BytesIO(contents)) as opened:
            opened.load()
            if opened.width * opened.height > MAX_IMAGE_PIXELS:
                raise HTTPException(status_code=413, detail="Image dimensions are too large.")
            image = opened.convert("RGB")
    except HTTPException:
        raise
    except (UnidentifiedImageError, OSError):
        raise HTTPException(status_code=415, detail="The file could not be read as an image.")

    try:
        prediction = model.predict(
            source=image,
            imgsz=640,
            conf=confidence,
            retina_masks=True,
            verbose=False,
        )[0]
    except Exception as exc:  # Return a short UI error; detailed text stays in the server log.
        logger.exception("Model inference failed")
        raise HTTPException(status_code=500, detail="The model could not process this image.") from exc

    detections: list[dict[str, object]] = []
    boxes = prediction.boxes
    masks = prediction.masks
    mask_array = masks.data.detach().cpu().numpy() if masks is not None else None

    if boxes is not None:
        scores = boxes.conf.detach().cpu().tolist()
        classes = boxes.cls.detach().cpu().tolist()
        xyxy = boxes.xyxy.detach().cpu().tolist()
        for index, (score, class_id, box) in enumerate(zip(scores, classes, xyxy)):
            area_px = None
            mask_extent = None
            major_axis_span_px = None
            short_axis_width_px = None
            image_area_percent = None
            centroid_px = None
            if mask_array is not None and index < len(mask_array):
                binary_mask = (mask_array[index] > 0).astype(np.uint8)
                area_px = int(np.count_nonzero(binary_mask))
                if area_px:
                    ys, xs = np.nonzero(binary_mask)
                    x_min, x_max = int(xs.min()), int(xs.max())
                    y_min, y_max = int(ys.min()), int(ys.max())
                    mask_extent = {
                        "width_px": x_max - x_min + 1,
                        "height_px": y_max - y_min + 1,
                        "bbox_xyxy_px": [x_min, y_min, x_max, y_max],
                    }
                    centroid_px = {"x": round(float(xs.mean()), 1), "y": round(float(ys.mean()), 1)}
                    image_area_percent = round(100.0 * area_px / (image.width * image.height), 4)
                    contours, _ = cv2.findContours(binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                    if contours:
                        all_contour_points = np.concatenate(contours, axis=0)
                        rect = cv2.minAreaRect(all_contour_points)
                        major_axis_span_px = round(float(max(rect[1])), 1)
                        short_axis_width_px = round(float(min(rect[1])), 1)
            detections.append(
                {
                    "class_name": str(prediction.names.get(int(class_id), "fractured")),
                    "confidence": round(float(score), 4),
                    "bbox_xyxy_px": [round(float(value), 1) for value in box],
                    "mask_area_px": area_px,
                    "mask_extent": mask_extent,
                    "approx_major_axis_span_px": major_axis_span_px,
                    "approx_short_axis_width_px": short_axis_width_px,
                    "mask_percent_of_image": image_area_percent,
                    "mask_centroid_px": centroid_px,
                }
            )

    overlay_bgr = prediction.plot()
    success, encoded_image = __import__("cv2").imencode(".png", overlay_bgr)
    if not success:
        raise HTTPException(status_code=500, detail="Could not create the prediction overlay.")

    overlay_base64 = base64.b64encode(encoded_image.tobytes()).decode("ascii")
    return {
        "filename": Path(file.filename or "uploaded-image").name,
        "image_width_px": image.width,
        "image_height_px": image.height,
        "confidence_threshold": confidence,
        "prediction_count": len(detections),
        "detections": detections,
        "overlay_png_base64": overlay_base64,
        "measurement_note": "Estimated region length and short-axis width describe the predicted mask in image pixels. They are exploratory shape proxies, not a fracture-gap measurement or validated clinical measurements. No physical scale is available.",
        "notice": "Research demonstration only. This output is not a medical diagnosis.",
    }
