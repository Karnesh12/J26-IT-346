
from io import BytesIO
import base64

import numpy as np
import torch
import torch.nn.functional as F
from PIL import Image


def generate_gradcam(model, input_tensor, original_image, target_class=None):
    """
    Generate a Grad-CAM overlay for the fracture classification head.

    model: trained MultiTaskResNet50
    input_tensor: preprocessed image, shape [1, 3, 224, 224]
    original_image: PIL image in RGB format
    target_class: 0 = Non-Fractured, 1 = Fractured
    """

    model.eval()
    target_layer = model.backbone.layer4
    activations = {}

    def save_activation(module, inputs, output):
        activations["features"] = output

    hook = target_layer.register_forward_hook(save_activation)

    try:
        # Grad-CAM requires gradients, so do not use torch.no_grad() here.
        with torch.enable_grad():
            model.zero_grad(set_to_none=True)

            fracture_logits, _ = model(input_tensor)

            if target_class is None:
                target_class = int(fracture_logits.argmax(dim=1).item())

            score = fracture_logits[0, target_class]

            feature_maps = activations["features"]

            gradients = torch.autograd.grad(
                outputs=score,
                inputs=feature_maps,
                retain_graph=False,
                create_graph=False
            )[0]

            # Average gradients across spatial dimensions.
            weights = gradients.mean(dim=(2, 3), keepdim=True)

            # Weighted combination of feature maps.
            cam = (weights * feature_maps).sum(dim=1, keepdim=True)
            cam = F.relu(cam)

            cam = F.interpolate(
                cam,
                size=original_image.size[::-1],
                mode="bilinear",
                align_corners=False
            )

            cam = cam[0, 0].detach().cpu().numpy()

        # Normalize heatmap between 0 and 1.
        cam_min = float(cam.min())
        cam_max = float(cam.max())

        if cam_max > cam_min:
            cam = (cam - cam_min) / (cam_max - cam_min)
        else:
            cam = np.zeros_like(cam)

        # Create a simple red heatmap overlay without extra libraries.
        gray = (cam * 255).astype(np.uint8)
        heatmap = np.zeros(
            (gray.shape[0], gray.shape[1], 3),
            dtype=np.uint8
        )
        heatmap[:, :, 0] = gray
        heatmap[:, :, 1] = (np.maximum(0, gray.astype(float) - 128) * 0.5).astype(np.uint8)

        original = np.asarray(
            original_image.convert("RGB").resize(
                original_image.size
            ),
            dtype=np.float32
        )

        overlay = (
            0.60 * original +
            0.40 * heatmap.astype(np.float32)
        ).clip(0, 255).astype(np.uint8)

        output_image = Image.fromarray(overlay)

        buffer = BytesIO()
        output_image.save(buffer, format="PNG")

        encoded = base64.b64encode(buffer.getvalue()).decode("utf-8")

        return f"data:image/png;base64,{encoded}"

    finally:
        hook.remove()
