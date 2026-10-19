"""The Component 1 pipeline: Model 1 gate -> Model 2 region -> Grad-CAM -> template explanation."""
import base64
import io
import time

import numpy as np
import torch
from PIL import Image
from pytorch_grad_cam import GradCAM
from pytorch_grad_cam.utils.image import show_cam_on_image
from pytorch_grad_cam.utils.model_targets import ClassifierOutputTarget

from .config import COLOURFUL_REJECT, LOW_CONFIDENCE, XRAY_ACCEPT, XRAY_REJECT
from .models import ModelRegistry
from .preprocess import load_and_prepare, to_tensor

SUPER_ORDER = ["HAND", "LEG", "OTHER"]

# expected anatomy per region (used in the rule-based explanation)
ANATOMY = {
    "Elbow to wrist":    "the radius and ulna (forearm bones)",
    "Foot and ankle":    "the ankle joint, tarsal and metatarsal bones",
    "Hip to knee":       "the pelvis/hip joint, femur or patella",
    "Knee to ankle":     "the tibia and fibula (lower-leg bones)",
    "OTHER":             "structures outside the limbs (e.g. ribs, lungs, spine or skull)",
    "Shoulder to elbow": "the clavicle, scapula, shoulder joint or humerus",
    "Wrist and hand":    "the carpal, metacarpal and finger bones",
}


def short(cls: str) -> str:
    return cls.split(" - ")[0]


def png_data_url(arr: np.ndarray) -> str:
    buf = io.BytesIO()
    Image.fromarray(arr).save(buf, format="PNG")
    return "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()


@torch.no_grad()
def predict(model, gray: np.ndarray) -> np.ndarray:
    logits = model.net(to_tensor(gray, model.mean, model.std))
    return torch.softmax(logits, dim=1)[0].numpy()


def attention_location(heat: np.ndarray) -> str:
    """Where is the hottest 10% of the heatmap? e.g. 'upper middle'."""
    yy, xx = np.nonzero(heat >= np.quantile(heat, 0.9))
    cy, cx = yy.mean() / heat.shape[0], xx.mean() / heat.shape[1]
    vertical = "upper" if cy < 1 / 3 else "lower" if cy > 2 / 3 else "central"
    horizontal = "left" if cx < 1 / 3 else "right" if cx > 2 / 3 else "middle"
    return f"{vertical} {horizontal}"


def gradcam(model, gray: np.ndarray, class_index: int) -> np.ndarray:
    """Grad-CAM of MobileNetV3 (last convolutional block) for one class -> 224x224 heatmap in 0..1."""
    x = to_tensor(gray, model.mean, model.std)
    with GradCAM(model=model.net, target_layers=[model.net.features[-1]]) as cam:
        return cam(input_tensor=x, targets=[ClassifierOutputTarget(class_index)])[0]


class Pipeline:
    def __init__(self, registry: ModelRegistry):
        self.reg = registry

    # ---------------- Model 1: X-ray validation ----------------
    def validate(self, gray: np.ndarray, colour: float) -> dict:
        per_model = {name: float(predict(m, gray)[1]) for name, m in self.reg.model1.items()}  # index 1 = X_RAY
        p = float(np.mean(list(per_model.values())))
        if colour >= COLOURFUL_REJECT:                                     # stage 0: X-rays are not colourful
            decision, message = "not_xray", ("This is a colour photo. X-rays are grayscale - "
                                             "please upload the X-ray image itself.")
        elif p >= XRAY_ACCEPT:
            decision, message = "xray", "This image was accepted as an X-ray."
        elif p < XRAY_REJECT:
            decision, message = "not_xray", "This image does not look like an X-ray. Please upload an X-ray image."
        else:
            decision, message = "uncertain", ("The system is not sure this is an X-ray. "
                                              "Please upload a clearer X-ray or ask a person to check.")
        return {"decision": decision, "p_xray": p, "per_model": per_model, "message": message,
                "colourfulness": round(colour, 1), "colour_rejected": colour >= COLOURFUL_REJECT,
                "thresholds": {"accept": XRAY_ACCEPT, "reject": XRAY_REJECT, "colourful": COLOURFUL_REJECT}}

    # ---------------- Model 2: anatomical region ----------------
    def region(self, gray: np.ndarray) -> dict:
        classes, smap = self.reg.classes, self.reg.super_map
        per_model_probs = {name: predict(m, gray) for name, m in self.reg.model2.items()}
        probs = np.mean(list(per_model_probs.values()), axis=0)              # ensemble = average

        def to_super(p):                                                     # HAND/LEG/OTHER = sum of sub-classes
            return {s: float(sum(p[i] for i, c in enumerate(classes) if smap[c] == s)) for s in SUPER_ORDER}

        super_probs = to_super(probs)
        sup = max(super_probs, key=super_probs.get)                          # routing decision (as in evaluation)
        in_group = [i for i, c in enumerate(classes) if smap[c] == sup]
        k = max(in_group, key=lambda i: probs[i])                            # most likely region inside that group

        per_model = {name: {"super": max(to_super(p), key=to_super(p).get), "fine": short(classes[int(p.argmax())])}
                     for name, p in per_model_probs.items()}
        return {
            "super": sup,
            "super_confidence": super_probs[sup],
            "super_probs": super_probs,
            "fine": short(classes[k]),
            "fine_index": k,
            "fine_confidence": float(probs[k]),
            "fine_probs": sorted([{"label": short(c), "super": smap[c], "p": float(probs[i])}
                                  for i, c in enumerate(classes)], key=lambda d: -d["p"]),
            "per_model": per_model,
            "models_agree_super": len({v["super"] for v in per_model.values()}) == 1,
            "models_agree_fine": len({v["fine"] for v in per_model.values()}) == 1,
        }

    # ---------------- explanation ----------------
    def explain(self, gray: np.ndarray, reg: dict) -> dict:
        heat = gradcam(self.reg.model2["mobilenetv3"], gray, reg["fine_index"])
        rgb = np.repeat(gray[..., None] / 255.0, 3, axis=2).astype(np.float32)
        overlay = show_cam_on_image(rgb, heat, use_rgb=True)
        location = attention_location(heat)
        # routing safety (HAND/LEG/OTHER) and fine-region certainty are flagged separately
        review = reg["super_confidence"] < LOW_CONFIDENCE or not reg["models_agree_super"]
        region_uncertain = reg["fine_confidence"] < LOW_CONFIDENCE or not reg["models_agree_fine"]
        text = (f'Classified as a {reg["super"]} X-ray (confidence {reg["super_confidence"]:.0%}); '
                f'most likely region "{reg["fine"]}" ({reg["fine_confidence"]:.0%}). '
                f'This region is characterised by {ANATOMY[reg["fine"]]}. '
                f"The model's attention (Grad-CAM) is strongest in the {location} part of the image.")
        if review:
            text += " Low confidence or model disagreement on HAND/LEG/OTHER - human review recommended."
        elif region_uncertain:
            text += " The exact sub-region is uncertain (neighbouring regions are similar)."
        return {"text": text, "review_recommended": review, "region_uncertain": region_uncertain,
                "attention_location": location, "heatmap": png_data_url(overlay),
                "method": "Grad-CAM (MobileNetV3)"}

    # ---------------- full pipeline ----------------
    def analyze(self, file_bytes: bytes) -> dict:
        t0 = time.perf_counter()
        gray, colour = load_and_prepare(file_bytes)
        result = {"input_image": png_data_url(gray), "validation": self.validate(gray, colour),
                  "region": None, "explanation": None}
        if result["validation"]["decision"] == "xray":                   # only real X-rays go to Model 2
            result["region"] = self.region(gray)
            result["explanation"] = self.explain(gray, result["region"])
        result["time_ms"] = round((time.perf_counter() - t0) * 1000)
        return result
