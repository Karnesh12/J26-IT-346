# Component 4 fracture segmentation demo

A small standalone backend and browser interface for demonstrating the trained YOLOv8-seg checkpoint. Training remains in Google Colab; this app only runs inference.

## Start the app on Windows

1. Install Python 3.10 or newer if it is not already installed.
2. Open PowerShell in the project folder, then run:

   ```powershell
   py -m venv .venv
   .\.venv\Scripts\Activate.ps1
   python -m pip install -r component4_demo\requirements.txt
   python -m uvicorn main:app --app-dir component4_demo --reload
   ```

3. Open <http://127.0.0.1:8000> in a browser.
4. Upload a de-identified/public X-ray and choose a confidence threshold. The backend returns predicted masks, confidence scores, mask area, mask width/height, estimated region length, short-axis width proxy, and image coverage in pixels or percent of image area.

The weights are loaded from `models/yolov8_fracture_v1_best.pt` once when the app starts. The `/api/health` route reports whether the model loaded; `/docs` shows the API interface.

## Scope and limits

- This is an isolated Component 4 demonstrator; it does not call or integrate Components 1–3.
- The model has one class (`fractured`) and does not classify anatomical region.
- Mask area, width, height, estimated region length, and short-axis width are exploratory pixel measurements of the predicted mask. The short-axis value is not the distance between opposing fracture edges, so it is not a fracture-gap measurement. No image calibration is available to convert pixels to millimetres.
- The prototype does not calculate validated fracture displacement, angulation, or gap.
- Outputs are for research demonstration only and are not a medical diagnosis.
- Uploaded images are processed in memory and are not stored by the app.
