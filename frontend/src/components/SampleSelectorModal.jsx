import React from 'react';
import { X, Sparkles, ArrowRight, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';

export const SAMPLE_CASES = [
  {
    id: 'forearm_fracture',
    title: 'Midshaft Radius Fracture',
    region: 'Elbow to Wrist (Radius, Ulna)',
    expected: 'Fractured',
    description: 'High-contrast radiograph exhibiting displaced midshaft fracture of the radius bone.',
    fileUrl: '/samples/forearm_fracture.jpg',
    tag: 'Displaced Fracture',
    badgeClass: 'danger',
  },
  {
    id: 'wrist_hand',
    title: 'Normal Wrist & Metacarpals',
    region: 'Wrist and Hand (Carpals, Metacarpals, Phalanges)',
    expected: 'Non-Fractured',
    description: 'Anteroposterior (AP) radiograph showing intact carpal alignment and phalanges.',
    fileUrl: '/samples/wrist_hand.jpg',
    tag: 'Intact Cortices',
    badgeClass: 'success',
  },
  {
    id: 'shoulder_humerus',
    title: 'Proximal Humerus & Shoulder',
    region: 'Shoulder point to Elbow (Humerus)',
    expected: 'Humerus Region Case',
    description: 'Standard projection showing glenohumeral joint and proximal humeral shaft.',
    fileUrl: '/samples/shoulder_humerus.jpg',
    tag: 'Shoulder Region',
    badgeClass: 'info',
  }
];

export default function SampleSelectorModal({ isOpen, onClose, onSelectSample }) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog sample-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-title">
            <Sparkles size={18} className="modal-accent-icon" />
            <h3>Clinical Radiograph Library</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <p className="modal-subtitle">
          Select a verified benchmark radiograph to immediately test classification, Grad-CAM explainability, and YOLO localization without having to upload local files.
        </p>

        <div className="sample-grid">
          {SAMPLE_CASES.map((sample) => (
            <div 
              key={sample.id} 
              className="sample-card"
              onClick={() => onSelectSample(sample)}
            >
              <div className="sample-thumb-wrapper">
                <img 
                  src={sample.fileUrl} 
                  alt={sample.title} 
                  className="sample-thumb-img" 
                />
                <span className={`sample-badge ${sample.badgeClass}`}>
                  {sample.tag}
                </span>
              </div>

              <div className="sample-card-body">
                <h4 className="sample-title">{sample.title}</h4>
                <div className="sample-meta-row">
                  <span className="sample-region-text">{sample.region}</span>
                </div>
                <p className="sample-desc">{sample.description}</p>
                
                <div className="sample-action-row">
                  <span className="sample-action-text">Load & Analyze</span>
                  <ArrowRight size={14} className="sample-action-arrow" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <span className="modal-footer-note">
            All samples are calibrated for the ResNet50 classifier and YOLO11 locator pipeline.
          </span>
          <button className="btn-secondary" onClick={onClose}>
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
