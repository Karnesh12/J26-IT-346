# Hand Fracture Detection and Classification

**Research project:** AI-Driven Solution for Musculoskeletal Fracture Recognition  
**Individual component:** Hand Fracture Detection and Classification  
**Repository:** `Karnesh12/J26-IT-346`  
**Working branch:** `hand-fracture-detection-and-classification`

## 1. Overview

This component explores deep-learning methods for classifying upper-limb X-ray images as **fractured** or **non-fractured**. Two image-classification architectures, **ResNet50** and **DenseNet121**, were trained and compared. Based on the reported fracture-classification test results, ResNet50 was selected for the prototype.

The component workflow also includes:

- **Grad-CAM** to visualize image regions that influenced a classification score.
- **YOLO11** as an experimental approach to localize a suspected fracture region with a bounding box.
- **FastAPI** backend and a **React + Vite** frontend to demonstrate model outputs.

> **Scope and safety:** The current dataset contains wrist/hand, elbow-to-wrist, and shoulder-to-elbow images. The reported classification results are combined upper-limb results, not hand-only results. They do not demonstrate leg-fracture performance. This is a research prototype, not a clinically validated diagnostic system.

## 2. What the component does

1. **Receives hand/wrist X-ray images from Component 1**, which is responsible for the image-upload/input workflow.
2. Preprocesses the received image for the classification model.
3. Uses the selected ResNet50 model to predict **fractured** or **non-fractured**.
4. Predicts an anatomical-region category using the model's second classification head.
5. Returns the prediction and model confidence score to the application for display.
6. Generates a Grad-CAM heatmap to help inspect which image regions influenced the selected classification.
7. Can provide a YOLO11-predicted bounding box from the experimental localization workflow.


**Important distinction:** Classification predicts the image-level class. Grad-CAM is a visual explanation of the classification score. YOLO11 attempts to localize a region with a bounding box. These outputs are different and should not be treated as interchangeable.

## 3. Dataset

After removing one exact duplicate image, the dataset used in the reported classification experiments contained **800 images**.

### Fracture labels

| Class | Images |
|---|---:|
| Fractured | 622 |
| Non-fractured | 178 |
| **Total** | **800** |

### Anatomical-region labels

| Label | Region category | Examples of bones |
|---:|---|---|
| 0 | Elbow to wrist | Radius and ulna |
| 1 | Shoulder point to elbow | Humerus |
| 2 | Wrist and hand | Carpals, metacarpals, and phalanges |

The class distribution is imbalanced: there are substantially more fractured than non-fractured images. Accuracy should therefore be considered alongside precision, recall, F1-score, and the confusion matrix.

**Dataset limitations:** The dataset combines multiple upper-limb regions, so the overall results should not be described as hand-only performance. Patient identifiers were not available in the dataset information described for this experiment, so patient-level separation could not be confirmed. This is a limitation when interpreting the test results.

## 4. Classification model comparison

The following are the reported results on a **120-image test set**.

| Metric | ResNet50 | DenseNet121 |
|---|---:|---:|
| Fracture-classification accuracy | **92.5%** | 90.8% |
| Fracture macro F1-score | **89.6%** | 84.4% |
| Anatomical-region accuracy | 83.3% | **87.5%** |

### Why ResNet50 was selected

ResNet50 was selected for the final fracture-classification prototype because fracture classification is the primary objective of this component. It achieved higher fracture-classification accuracy and macro F1-score than DenseNet121 on the reported test set. DenseNet121 achieved higher anatomical-region classification accuracy, so ResNet50 should not be described as better on every task.

### Fracture-class confusion matrices

Rows represent the actual class; columns represent the predicted class. Class order is **Non-fractured, Fractured**.

**ResNet50**

| Actual / Predicted | Non-fractured | Fractured |
|---|---:|---:|
| Non-fractured | 24 | 2 |
| Fractured | 7 | 87 |

**DenseNet121**

| Actual / Predicted | Non-fractured | Fractured |
|---|---:|---:|
| Non-fractured | 16 | 10 |
| Fractured | 1 | 93 |

On this test set, ResNet50 misclassified 2 non-fractured images as fractured and missed 7 fractured images. DenseNet121 misclassified 10 non-fractured images as fractured and missed 1 fractured image. Model selection should consider the consequences of different error types, not accuracy alone.

## 5. YOLO11 bounding-box localization

YOLO11 was explored to predict a bounding box around a suspected fracture region. Unlike image classification, object detection predicts a region's location as well as a confidence score.

### Initial pilot evaluation

The initial localization pilot was small and had the following reported validation results:

| Metric | Reported result |
|---|---:|
| Precision | 0.0596 |
| Recall | 0.333 |
| mAP@50 | 0.0325 |
| mAP@50–95 | 0.0175 |

These values indicate weak localization performance in the initial pilot. The detector should be treated as experimental; its displayed boxes are model predictions, not confirmation of a fracture.

### What is required to train a bounding-box detector?

1. Gather suitable X-ray images.
2. Annotate the suspected fracture location with a bounding box using an annotation tool.
3. Export the annotations in the detector's required format, such as YOLO format.
4. Split the data into training, validation, and held-out test sets.
5. Train the detector and tune it using validation results.
6. Evaluate on the held-out test set and inspect false positives and false negatives.

Image-level labels such as “fractured” or “non-fractured” do not tell a detector where to draw a box. Bounding-box location annotations are required. Non-fractured images should not contain fracture boxes.

### Localization future work

- Increase the number and diversity of accurately annotated images.
- Review annotation quality and class definitions.
- Compare suitable detection architectures using the same data splits and evaluation procedure.
- Report precision, recall, IoU and mAP on a held-out test set.
- Compare predicted boxes against ground-truth annotations before making localization claims.

## 6. Grad-CAM explainability

**Grad-CAM** stands for *Gradient-weighted Class Activation Mapping*. It uses gradients associated with a selected class score to create a heatmap showing image regions that influenced that score.

In this component, Grad-CAM is used to:
- Inspect which regions influenced a fracture-classification prediction.
- Compare the original X-ray with the heatmap in the interface.
- Help identify possible attention to irrelevant features during error analysis.

Grad-CAM is an interpretability aid. It does not prove that a prediction is correct, does not provide an exact fracture boundary, and does not directly increase classification accuracy. Highlighted areas are not calibrated fracture probabilities.

## 7. Application implementation

| Layer | Technology | Responsibility |
|---|---|---|
| Frontend | React + Vite | Image upload and display of predictions and visualizations |
| Backend API | FastAPI | Receives the image and coordinates inference |
| Classification | PyTorch + ResNet50 | Predicts fracture status and anatomical region |
| Comparison experiment | DenseNet121 | Provides a second classification model for evaluation |
| Explainability | Grad-CAM | Creates a heatmap for visual inspection |
| Experimental localization | YOLO11 | Predicts suspected-region bounding boxes |

### Main files

```text
Fracture_Recognition_UI/
├── backend/
│   ├── main.py
│   ├── classifier.py
│   ├── gradcam.py
│   ├── requirements.txt
│   └── models/
│       ├── resnet50_best.pth
│       └── yolo11n_version2_best.pt
├── frontend/
│   ├── src/
│   ├── package.json
│   └── ...
└── README.md
```

File names and checkpoint paths should match the current local repository. DenseNet121 was used for comparison during training/evaluation; the final application uses the selected ResNet50 checkpoint.

### Run locally

Open two terminals from the project root.

**Terminal 1 — Backend (PowerShell)**

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn main:app --reload
```

If the virtual environment is already active, skip activation. The backend is expected at `http://127.0.0.1:8000`; API documentation is usually at `http://127.0.0.1:8000/docs`.

**Terminal 2 — Frontend**

```powershell
cd frontend
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173`.

These commands assume dependencies are installed and the required checkpoints exist at the paths expected by the backend. If your local environment differs, follow the project's actual setup and dependency files.

## 8. Limitations

- The dataset is relatively small and imbalanced.
- Results combine several upper-limb regions and are not hand-only metrics.
- Patient-level separation could not be confirmed from the available dataset information.
- Initial YOLO11 localization results are weak and require more annotated data and validation.
- Grad-CAM is a heatmap, not an exact segmentation mask or proof of fracture.
- The current classification task is fractured vs non-fractured; it does not classify fracture patterns such as transverse, oblique, spiral, or comminuted.
- The component does not establish leg-fracture classification performance.
- The prototype is not clinically validated and must not be used as a substitute for professional medical assessment.

## 9. Future work

1. Improve YOLO11 localization using a larger, accurately annotated dataset.
2. Train and evaluate additional localization models under a consistent setup.
3. Collect verified fracture-type labels before developing a fracture-type classifier.
4. Improve class balance and image diversity.
5. Evaluate on independent data and use patient-level separation where possible.
6. Review Grad-CAM and predicted boxes against expert-verified annotations.
7. Collect genuine user feedback on usability and clarity of the displayed results.

---

**Model-file note:** `.pth` and `.pt` files are binary model checkpoints and should not be edited as text. If excluded from Git because of file size, share them separately using the team's approved storage method.
