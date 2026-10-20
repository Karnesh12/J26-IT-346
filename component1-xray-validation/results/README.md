# Component 1 – Result tables

Small summary tables copied from the Google Drive `outputs/` folders after running the notebooks.
Subfolders and file names are the same as on Drive (`outputs/<folder>/<file>`).
They contain only aggregated numbers – no images, no patient data.

| File | Produced by | What it shows |
|---|---|---|
| `model2/model_comparison.csv` | `notebooks/model2/03_compare_models.ipynb` | Model 2 v1 (anatomical region): MobileNetV3, EfficientNetV2-S, DeiT-Small and two ensembles on the test set (519 images) |
| `model2_v2/compare_v1_vs_v2.csv` | `notebooks/model2/07_compare_v1_v2.ipynb` | Model 2 v1 vs v2 on the old test set (519) and on 130 held-back new LEG images (newtest) |
| `model1_v2/unseen_summary_v1_vs_v2.csv` | `notebooks/model1/05_unseen_test.ipynb` | Model 1 (X-ray vs non-X-ray): v1 vs v2 on image sources never used in training |
| `model1_v3/unseen_summary_v2_vs_v3.csv` | `notebooks/model1/08_unseen_test_v3.ipynb` | Model 1: v2 vs v3 on the same unseen sources + real-world photos (dental X-ray photos, knee X-ray photos, body photos) |

## How to read them

**Model 2 comparison** – `test_acc_3` = accuracy for HAND / LEG / OTHER, `test_acc_7` and `test_macroF1_7` = the 7 sub-regions,
`ms_per_img` = inference time per image on a T4 GPU. Final choice: ensemble of DeiT-Small + MobileNetV3,
members chosen on validation macro-F1.

**Model 2 routing rule (app)** – an image is routed to a fracture module only if both models agree on
HAND/LEG/OTHER **and** the ensemble confidence is ≥ 0.70; otherwise it is marked "uncertain – human review".

**Model 1 unseen summaries** – values are **% correct** per image group at threshold 0.5
(for the "unclear" edge cases – inverted X-ray, simulated phone photo – the value is % accepted as X-ray).

## Key numbers – Model 1 (X-ray validation)

| | Model 1 v1 | Model 1 v2 ensemble | Model 1 v3 ensemble |
|---|---|---|---|
| Unseen test, correct (known images) | 85.5% (221) | 96.4% (221) · 90.3% (248, incl. body photos) | 97.2% (248) |
| Body photos from the internet accepted as X-ray | – | 16 / 25 | 0 / 25 |
| Three-way gate (≥0.7 X-ray, <0.3 not X-ray), wrong decisions on 248 images | – | 16 | 2 |

Model 1 v3 in-source test (1,503 images, notebook 07): v2 ensemble 98.9% (accepted 14/90 hand photos) → v3 ensemble 100%.

## Key numbers – Model 2 (anatomical region)

Model 2 v1 ensemble, test set: HAND/LEG/OTHER 98.7%, 7-class 92.7%, macro-F1 0.898.

**Model 2 v2** – v1 was biased towards HAND (MobileNetV3 alone called only 66.2% of new LEG images LEG).
v2 adds 380 new LEG images (after removing exact and near duplicates) and uses balanced sampling
(HAND 0.4 / LEG 0.4 / OTHER 0.2) with real-world augmentations. The decision rule was fixed before testing.

| | v1 ensemble | v2 ensemble |
|---|---|---|
| Old test (519): HAND/LEG/OTHER correct | 98.7% | 98.7% |
| Old test: wrongly routed / sent to review | 4 / 13 | 1 / 20 |
| Newtest (130 held-back LEG images): correct | 93.8% | 98.5% |
| Newtest: routed / wrongly routed | 67.7% / 5 | 99.2% / 2 |
| MobileNetV3 alone on newtest | 66.2% | 97.7% |

Decision: **v2 is used in the app.**

## Known limitations
- Model 1 v3 is more cautious on phone photos of X-rays (dental: 5 accepted, 5 uncertain, 1 rejected; 1 patient only).
- Model 2 v2 remaining newtest errors: an axial (skyline) patella view, and one image in the leg source folder that is actually an elbow (a labelling error in the source data).
- LEG data is still smaller than HAND (train: HAND 1,833 / LEG 645 / OTHER 345), and real-world tests (metal implants, phone photos) are small and informal.
- Tinted/coloured X-rays are rejected by the colour check; skull and animal X-rays are usually "uncertain".
- Not yet implemented (PP2): image quality assessment, laterality and view (AP/lateral) classification, DICOM input.