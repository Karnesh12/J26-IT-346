import React from 'react';
import { X, Printer, Download, ShieldCheck, Activity, Layers, Crosshair } from 'lucide-react';

export default function ClinicalReportModal({
  isOpen,
  onClose,
  result,
  previewUrl,
  fileName,
  imageSize
}) {
  if (!isOpen || !result) return null;

  const handlePrint = () => {
    window.print();
  };

  const isFractured = (result.fracture_status ?? result.fracture_prediction) === "Fractured";
  const fractureConfidence = (Number(result.fracture_confidence ?? 0) * 100).toFixed(1);
  const regionConfidence = (Number(result.region_confidence ?? 0) * 100).toFixed(1);
  const boxes = result.localization_boxes ?? [];
  const reportDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Modal Top Bar (Hidden in Print) */}
        <div className="modal-header no-print">
          <div className="modal-header-title">
            <Activity size={18} className="text-cyan" />
            <h3>Diagnostic Evaluation Summary</h3>
          </div>
          <div className="modal-header-actions">
            <button className="btn-primary-sm" onClick={handlePrint}>
              <Printer size={15} />
              <span>Print / Save PDF</span>
            </button>
            <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Official Report Document */}
        <div className="printable-report-sheet">
          {/* Report Letterhead */}
          <div className="report-letterhead">
            <div className="letterhead-brand">
              <div className="report-logo">
                <Activity size={24} />
              </div>
              <div>
                <h2>ORTHOVUE AI RESEARCH PROTOCOL</h2>
                <p>Musculoskeletal Radiographic Intelligence Report</p>
              </div>
            </div>

            <div className="report-meta">
              <div><strong>Evaluation Date:</strong> {reportDate}</div>
              <div><strong>Image File:</strong> {fileName || "radiograph_scan.jpg"}</div>
              <div><strong>Resolution:</strong> {imageSize.width} × {imageSize.height} px</div>
            </div>
          </div>

          <div className="report-divider" />

          {/* Section: Diagnostic Findings */}
          <div className="report-section">
            <h4 className="report-section-title">1. Primary Diagnostic Impression</h4>
            <div className="report-findings-grid">
              <div className="report-finding-box">
                <span className="finding-box-label">Classification Status</span>
                <strong className={`finding-status-badge ${isFractured ? 'fracture' : 'normal'}`}>
                  {result.fracture_status ?? result.fracture_prediction}
                </strong>
                <span className="finding-conf-text">{fractureConfidence}% Model Confidence</span>
              </div>

              <div className="report-finding-box">
                <span className="finding-box-label">Anatomical Region</span>
                <strong className="finding-region-text">
                  {result.region_prediction ?? result.region}
                </strong>
                <span className="finding-conf-text">{regionConfidence}% Regional Confidence</span>
              </div>
            </div>
          </div>

          {/* Section: Visual Evidentiary Side-by-Side */}
          <div className="report-section">
            <h4 className="report-section-title">2. Radiographic &amp; Explainability Evidence</h4>
            <div className="report-images-row">
              <div className="report-image-col">
                <p className="image-col-caption">A. Original Radiograph (Native)</p>
                <div className="report-img-wrapper">
                  <img src={previewUrl} alt="Original Radiograph" />
                </div>
              </div>

              {result.gradcam_image && (
                <div className="report-image-col">
                  <p className="image-col-caption">B. Grad-CAM Class Activation Saliency</p>
                  <div className="report-img-wrapper">
                    <img src={result.gradcam_image} alt="Grad-CAM Saliency" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section: Localization Table */}
          <div className="report-section">
            <h4 className="report-section-title">3. YOLO11 Lesion Localization Telemetry</h4>
            {boxes.length > 0 ? (
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Locus ID</th>
                    <th>Detector Confidence</th>
                    <th>X1 (Left)</th>
                    <th>Y1 (Top)</th>
                    <th>X2 (Right)</th>
                    <th>Y2 (Bottom)</th>
                  </tr>
                </thead>
                <tbody>
                  {boxes.map((box, i) => (
                    <tr key={i}>
                      <td>Locus #{i + 1}</td>
                      <td><strong>{(box.confidence * 100).toFixed(1)}%</strong></td>
                      <td>{box.x1} px</td>
                      <td>{box.y1} px</td>
                      <td>{box.x2} px</td>
                      <td>{box.y2} px</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="report-no-boxes">
                No focal fracture bounding coordinates identified by YOLO11 above the 0.25 confidence threshold.
              </p>
            )}
          </div>

          {/* Institutional / Prototype Disclaimer */}
          <div className="report-disclaimer">
            <ShieldCheck size={20} className="disclaimer-icon" />
            <div>
              <strong>Research Prototype Regulatory Notice:</strong>
              <p>
                This report is generated automatically by an experimental computer vision algorithm pipeline (ResNet-50 Dual-Head Classifier and YOLO11n Locator). It is intended strictly for research, academic evaluation, and testing purposes and must NOT be used as a standalone diagnostic medical device or for clinical decision making without certified board radiologist review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
