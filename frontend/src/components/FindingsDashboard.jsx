import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Crosshair, 
  HelpCircle, 
  Layers, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Copy, 
  ShieldAlert, 
  Check, 
  Activity,
  Maximize2
} from 'lucide-react';

export default function FindingsDashboard({
  result,
  focusedBoxIndex,
  setFocusedBoxIndex,
  visibleBoxes,
  toggleBoxVisibility
}) {
  if (!result) return null;

  const isFractured = (result.fracture_status ?? result.fracture_prediction) === "Fractured";
  const fractureConfidence = Number(result.fracture_confidence ?? 0);
  const regionConfidence = Number(result.region_confidence ?? 0);
  const boxes = result.localization_boxes ?? [];

  return (
    <div className="findings-dashboard">
      <div className="findings-header">
        <h2 className="findings-title">
          <Activity size={18} className="text-cyan" />
          <span>Diagnostic Evaluation</span>
        </h2>
        <span className="findings-stage-badge">STAGE 02</span>
      </div>

      {/* 1. PRIMARY VERDICT HERO BANNER */}
      <div className={`verdict-card ${isFractured ? 'fracture-positive' : 'fracture-negative'}`}>
        <div className="verdict-status-row">
          <div className="verdict-icon-box">
            {isFractured ? (
              <AlertTriangle size={28} className="status-icon" />
            ) : (
              <CheckCircle2 size={28} className="status-icon" />
            )}
          </div>

          <div className="verdict-text-block">
            <span className="verdict-eyebrow">RESNET-50 CLASSIFICATION</span>
            <h3 className="verdict-title">
              {result.fracture_status ?? result.fracture_prediction ?? "Classification Complete"}
            </h3>
            <p className="verdict-sub">
              {isFractured 
                ? "Morphological indicators consistent with skeletal discontinuity."
                : "No acute cortical fracture disruption identified in this projection."}
            </p>
          </div>

          {/* Radial Confidence Gauge */}
          <div className="verdict-gauge">
            <div className="gauge-val">
              {(fractureConfidence * 100).toFixed(1)}%
            </div>
            <div className="gauge-label">CONFIDENCE</div>
          </div>
        </div>

        {/* Confidence Progress Meter */}
        <div className="confidence-meter-track">
          <div 
            className="confidence-meter-fill" 
            style={{ width: `${Math.min(100, fractureConfidence * 100)}%` }}
          />
        </div>

        {/* Low Confidence / Uncertainty Warning */}
        {result.fracture_uncertain && (
          <div className="uncertainty-callout">
            <ShieldAlert size={16} />
            <span>
              <strong>Low-Confidence Prediction (&lt; 70%):</strong> Prediction confidence does not meet high-certainty research threshold. Correlate with clinical findings.
            </span>
          </div>
        )}
      </div>

      {/* 2. ANATOMICAL REGION CARD */}
      <div className="metric-card">
        <div className="metric-card-header">
          <div className="metric-title-group">
            <Layers size={16} className="text-cyan" />
            <h4>Anatomical Localization</h4>
          </div>
          <span className="metric-badge">Multi-Task Head</span>
        </div>

        <div className="region-content">
          <div className="region-name-row">
            <span className="region-label">Predicted Skeletal Region:</span>
            <strong className="region-value">
              {result.region_prediction ?? result.region ?? "Unknown Region"}
            </strong>
          </div>

          <div className="region-bar-container">
            <div className="region-bar-label-row">
              <span>Classifier Certainty</span>
              <strong>{(regionConfidence * 100).toFixed(1)}%</strong>
            </div>
            <div className="confidence-meter-track">
              <div 
                className="confidence-meter-fill cyan" 
                style={{ width: `${Math.min(100, regionConfidence * 100)}%` }}
              />
            </div>
          </div>

          {result.region_uncertain && (
            <p className="region-uncertainty-note">
              * Low confidence region assignment. Skeletal borders may overlap.
            </p>
          )}
        </div>
      </div>

      {/* 3. YOLO11 LOCALIZATION FINDINGS */}
      <div className="metric-card">
        <div className="metric-card-header">
          <div className="metric-title-group">
            <Crosshair size={16} className="text-cyan" />
            <h4>YOLO11 Lesion Localization</h4>
          </div>
          <span className={`lesion-count-pill ${boxes.length > 0 ? 'alert' : 'neutral'}`}>
            {boxes.length > 0 ? `${boxes.length} Locus Detected` : '0 Regions'}
          </span>
        </div>

        <div className="localization-body">
          {boxes.length > 0 ? (
            <div className="detection-boxes-list">
              <p className="boxes-intro-note">
                Bounding coordinates computed on native radiograph grid. Hover to target in viewport:
              </p>

              {boxes.map((box, index) => {
                const isFocused = focusedBoxIndex === index;
                const isVisible = !visibleBoxes || visibleBoxes.has(index);

                return (
                  <div
                    key={`det-${index}`}
                    className={`detection-item-card ${isFocused ? 'focused' : ''} ${!isVisible ? 'hidden-box' : ''}`}
                    onMouseEnter={() => setFocusedBoxIndex(index)}
                    onMouseLeave={() => setFocusedBoxIndex(null)}
                  >
                    <div className="det-card-top">
                      <div className="det-card-title">
                        <span className="det-dot" />
                        <strong>Site #{index + 1}</strong>
                      </div>

                      <div className="det-card-actions">
                        <span className="det-conf-badge">
                          {(box.confidence * 100).toFixed(1)}% Conf
                        </span>

                        <button
                          className="det-toggle-btn"
                          onClick={() => toggleBoxVisibility(index)}
                          title={isVisible ? "Hide box in viewer" : "Show box in viewer"}
                        >
                          {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                        </button>
                      </div>
                    </div>

                    <div className="det-coords-row">
                      <span className="coords-label">Bounding Box:</span>
                      <code className="coords-code">
                        [{Math.round(box.x1)}, {Math.round(box.y1)}] → [{Math.round(box.x2)}, {Math.round(box.y2)}]
                      </code>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-boxes-card">
              <p className="no-boxes-title">No Focal Bounding Reticles Identified</p>
              <p className="no-boxes-desc">
                {result.localization_note ||
                  "The YOLO localization model did not detect focal fracture bounding boxes exceeding the 0.25 confidence threshold."}
              </p>
            </div>
          )}

          <div className="localization-advisory">
            <span className="advisory-icon-wrapper">
              <HelpCircle size={14} />
            </span>
            <span className="advisory-text">
              {result.localization_note || 
                "Experimental localization output. Bounding boxes are generated by YOLO11n object detector."}
            </span>
          </div>
        </div>
      </div>

      {/* 4. GRAD-CAM EXPLAINABILITY INSIGHTS */}
      <div className="metric-card">
        <div className="metric-card-header">
          <div className="metric-title-group">
            <Sparkles size={16} className="text-cyan" />
            <h4>Grad-CAM Explainability</h4>
          </div>
          <span className="metric-badge">ResNet-50 Layer4</span>
        </div>

        <div className="explainability-body">
          <p className="explain-text">
            Gradient-weighted Class Activation Mapping (Grad-CAM) calculates the spatial gradients flowing into the final convolutional layer to highlight the anatomical features driving the fracture prediction.
          </p>

          <div className="explain-legend-box">
            <div className="legend-row">
              <span className="legend-color-dot hot" />
              <span><strong>Warm Regions (Red / Orange):</strong> Critical saliency and highest deep feature activation.</span>
            </div>
            <div className="legend-row">
              <span className="legend-color-dot cold" />
              <span><strong>Cool Regions (Blue / Dark):</strong> Baseline image context with low model influence.</span>
            </div>
          </div>

          <p className="explain-footer-note">
            Use the <em>Split Curtain</em> or <em>Heatmap Blend</em> tabs in the radiograph viewport to superimpose the attention map directly over the bone structures.
          </p>
        </div>
      </div>
    </div>
  );
}
