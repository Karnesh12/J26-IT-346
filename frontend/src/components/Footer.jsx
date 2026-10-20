import React from 'react';
import { ShieldAlert, Cpu, Heart } from 'lucide-react';

export default function Footer({ researchNotice }) {
  return (
    <footer className="app-footer no-print">
      <div className="footer-content">
        <div className="footer-disclaimer-row">
          <ShieldAlert size={16} className="disclaimer-alert-icon" />
          <p className="footer-disclaimer-text">
            {researchNotice ||
              "Research Prototype Only. Not intended for clinical diagnosis, patient management, or treatment decisions. All predictions must be validated by licensed medical professionals."}
          </p>
        </div>

        <div className="footer-sub-row">
          <span className="footer-copyright">
            OrthoVue AI Diagnostic Imaging Research Engine • Deep Learning Pipeline v2.0
          </span>
          <div className="footer-badges">
            <span className="footer-pill">PyTorch ResNet-50</span>
            <span className="footer-pill">Ultralytics YOLO11</span>
            <span className="footer-pill">Grad-CAM Saliency</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
