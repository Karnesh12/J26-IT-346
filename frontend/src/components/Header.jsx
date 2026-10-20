import React from 'react';
import {
  Activity,
  Cpu,
  FileText,
  Layers,
  Sun,
  Moon,
  Sparkles,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

export default function Header({
  apiInfo,
  apiOnline,
  theme,
  toggleTheme,
  openSamples,
  openReport,
  hasResult
}) {
  return (
    <header className="app-header no-print">
      <div className="header-left">
        <div className="brand-badge">
          <div className="brand-pulse-wrapper">
            <span className="brand-pulse-dot" />
            <Activity className="brand-icon" size={20} />
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <span className="brand-title">ORTHOVUE</span>
              <span className="brand-tag">AI CORE</span>
            </div>
            <span className="brand-subtitle">Musculoskeletal Deep Learning Diagnostics</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="system-telemetry-bar">
          <div className={`telemetry-item ${apiOnline ? 'status-online' : 'status-offline'}`}>
            <span className="telemetry-dot" />
            <span className="telemetry-label">FASTAPI</span>
            <span className="telemetry-val">{apiOnline ? 'ONLINE' : 'DISCONNECTED'}</span>
          </div>

          <div className="telemetry-divider" />

          <div className="telemetry-item">
            <Cpu size={13} className="telemetry-icon" />
            <span className="telemetry-label">DEVICE</span>
            <span className="telemetry-val highlight">{apiInfo?.device?.toUpperCase() || 'GPU/CPU'}</span>
          </div>

          <div className="telemetry-divider" />

          <div className="telemetry-item">
            <Layers size={13} className="telemetry-icon" />
            <span className="telemetry-label">PIPELINE</span>
            <span className="telemetry-val">ResNet50 + YOLO11</span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button
          id="btn-sample-cases"
          className="header-btn secondary"
          onClick={openSamples}
          title="Browse pre-loaded clinical sample radiographs"
        >
          <Sparkles size={15} />
          <span>Demo Cases</span>
        </button>

        <button
          id="btn-export-report"
          className={`header-btn ${hasResult ? 'primary' : 'disabled'}`}
          onClick={openReport}
          disabled={!hasResult}
          title={hasResult ? "Generate formal diagnostic report" : "Analyze an image to unlock report"}
        >
          <FileText size={15} />
          <span>Diagnostic Report</span>
        </button>

        <button
          id="btn-theme-toggle"
          className="header-icon-btn"
          onClick={toggleTheme}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
      </div>
    </header>
  );
}
