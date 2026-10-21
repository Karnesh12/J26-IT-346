# J26-IT-346
Hand Fracture Detection and Classification
Research project: AI-Driven Solution for Musculoskeletal Fracture Recognition
Individual component: Hand Fracture Detection and Classification
Repository: Karnesh12/J26-IT-346
Branch: hand-fracture-detection-and-classification
1. Component overview
This component uses upper-limb X-ray images to predict whether an image is fractured or non-fractured. ResNet50 is the selected classification model. The prototype also uses Grad-CAM to generate a heatmap showing image regions that influenced the classification and includes an experimental YOLO11 workflow for suspected-fracture localization using bounding boxes.
Scope note: The current dataset contains wrist/hand, elbow-to-wrist, and shoulder-to-elbow images. The reported combined results should not be interpreted as hand-only results or as evidence of leg-fracture performance. This is a research prototype, not a clinically validated diagnostic tool.

2. Component architecture
                 Upper-Limb X-ray Image
                           |
                    Image Preprocessing
                           |
                   ResNet50 Backbone
                     /           \
                    /             \
       Fracture Classification    Anatomical Region
                 Head             Classification Head
                  |
         +--------+---------+
         |        |         |
      Fracture  Confidence  Grad-CAM
      Prediction  Score     Heatmap


Upper-Limb X-ray Image
          |
  YOLO11 Localization
          |
  Suspected Fracture
     Bounding Box


Classification + Grad-CAM + YOLO11 outputs
                    |
              FastAPI Backend
                    |
            React + Vite Frontend
                    |
          Display Results to User
```
Architecture notes
- ResNet50: Selected image-classification model. It uses a shared backbone with two heads: fracture classification (2 classes) and anatomical-region classification (3 classes).
- DenseNet121: Comparison model used during evaluation.
- Grad-CAM: Generates a class-specific heatmap for visual inspection. It does not provide an exact fracture boundary and does not directly improve classification accuracy.
- YOLO11: Experimental object-detection/localization workflow. A predicted bounding box indicates a suspected region; it is not proof of a fracture. Localization performance needs further improvement and validation.
- Application: React/Vite frontend communicates with a FastAPI backend for predictions and visualizations.
3. Dataset
After removing one exact duplicate image, the dataset summary used for the reported experiments was:
Class	Number of images
Fractured	622
Non-fractured	178
Total	800


Anatomical-region categories:
Region label	Anatomical region	Example bones
0	Elbow to Wrist	Radius and ulna
1	Shoulder point to Elbow	Humerus
2	Wrist and Hand	Carpals, metacarpals, and phalanges


The dataset is imbalanced because there are substantially more fractured images than non-fractured images. It combines several upper-limb regions, so region-specific performance should be reported separately when making claims about hand/wrist images. If patient identifiers are unavailable, patient-level separation cannot be confirmed; consider this when interpreting test performance.
4. ResNet50 vs DenseNet121 results
These are the reported 120-image test-set results for the classification experiments.
Metric	ResNet50	DenseNet121
Fracture classification accuracy	92.5%	90.8%
Fracture macro F1-score	89.6%	84.4%
Anatomical-region classification accuracy	83.3%	87.5%

5. YOLO11 fracture localization
YOLO11 was explored to predict bounding boxes around suspected fracture regions. Classification predicts an image-level class, while localization predicts where a suspected region is located.
Initial pilot status
The initial localization pilot was small and had weak reported validation results:
Metric	Initial pilot result
Precision	0.0596
Recall	0.333
mAP@50	0.0325
mAP@50–95	0.0175


These results indicate that the pilot detector was not yet reliable. The small number of annotated examples limits what can be concluded. Do not present the bounding boxes as accurate or clinically dependable.
Planned localization improvements
1. Collect more diverse X-ray images.
2. Accurately annotate suspected fracture locations with bounding boxes.
3. Keep non-fractured images free of fracture boxes.
4. Compare suitable object-detection models under a consistent training and evaluation setup.
5. Evaluate on an independent held-out test set and report precision, recall, IoU, and mAP.
6. Inspect false-positive and false-negative examples before claiming improvement.
Image-level labels such as “fractured” and “non-fractured” are not sufficient by themselves to train a bounding-box detector; location annotations are required.
6. Grad-CAM explainability
Grad-CAM (Gradient-weighted Class Activation Mapping) produces a heatmap that highlights image regions that contributed to a selected class score.
- Helps visually inspect what influenced the classification.
- Can reveal whether the model appears to focus on relevant bone regions or potentially irrelevant features.
- Supports interpretation, but does not guarantee that a prediction is correct.
- Does not identify an exact fracture boundary and does not directly improve model accuracy.
7. Application design and implementation
Layer	Technology	Responsibility
Frontend	React + Vite	Image upload and display of prediction results and visualizations
Backend API	FastAPI	Receives the image and returns model outputs
Classification	PyTorch + ResNet50	Predicts fractured/non-fractured and anatomical region
Comparison model	DenseNet121	Experimental comparison
Explainability	Grad-CAM	Produces a classification heatmap
Experimental localization	YOLO11	Predicts suspected-region bounding boxes


The exact request/response fields depend on the current API implementation. Describe the displayed value as a model confidence score unless calibration has been evaluated; it is not a guaranteed probability of fracture.
8. Limitations
- The dataset is relatively small and class-imbalanced.
- The dataset includes several upper-limb regions; combined results are not equivalent to hand-only results.
- Independent patient-level separation may not be verifiable if patient identifiers are unavailable.
- YOLO11 localization pilot results are weak and require more annotated data and evaluation.
- Grad-CAM is a visual explanation, not an exact localization mask or medical proof.
- The current classifier predicts fractured versus non-fractured; it does not classify patterns such as transverse, oblique, spiral, or comminuted fractures.
- The system is a research prototype and is not validated for clinical diagnosis.
9. Future work
1. Improve YOLO11 localization and compare additional detection models.
2. Collect verified labels for fracture types and develop a separately evaluated fracture-type classifier.
3. Improve class balance and dataset diversity.
4. Evaluate the model on an independent dataset, with patient-level separation where possible.
5. Review Grad-CAM and localization outputs against expert-verified annotations.
6. Collect genuine user feedback on image upload, result clarity, and visualization usefulness.
10. How to run the prototype
Use the actual project setup and dependency versions from the repository. A typical local workflow is:
1. Install backend dependencies from backend/requirements.txt in the appropriate Python environment.
2. Ensure the required model checkpoints are available locally at the paths expected by the backend.
3. Start the FastAPI backend using the command documented in the backend setup.
4. Install frontend dependencies from frontend/package.json.
5. Start the Vite development server and open its local URL.
Model files: The .pth and .pt checkpoint files are binary model files and should not be edited as text. They may be excluded from Git due to file size; provide them separately through an approved storage method if teammates need to run the prototype.
