import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  X, 
  ArrowRight,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

export default function UploadStation({
  file,
  preview,
  loading,
  error,
  onFileSelect,
  onAnalyze,
  onClear,
  onOpenSamples
}) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      onFileSelect(droppedFile);
    }
  };

  const handleFileInputChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onFileSelect(selected);
    }
  };

  return (
    <div className="upload-station-card">
      <div className="station-header">
        <h2 className="station-title">
          <UploadCloud size={18} className="text-cyan" />
          <span>Radiograph Ingestion</span>
        </h2>
        <span className="station-badge">STAGE 01</span>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        className={`dropzone ${isDragOver ? 'drag-over' : ''} ${file ? 'has-file' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        <div className="dropzone-content">
          <div className="dropzone-icon-box">
            <UploadCloud size={28} className="dropzone-icon" />
          </div>

          <div className="dropzone-text">
            <p className="dropzone-main-text">
              {file ? file.name : "Drop X-ray radiograph here, or "}
              {!file && <span className="browse-link">browse files</span>}
            </p>
            <p className="dropzone-sub-text">
              {file 
                ? `${(file.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis`
                : "DICOM-compatible exports: JPG, PNG, WEBP (Max 25MB)"}
            </p>
          </div>
        </div>

        {file && (
          <button 
            className="clear-file-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            title="Remove file"
            aria-label="Remove file"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Primary Execution Controls */}
      <div className="station-actions">
        <button
          id="btn-analyze-radiograph"
          className="btn-analyze"
          onClick={onAnalyze}
          disabled={!file || loading}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              <span>Analyzing ResNet50 & YOLO11...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Execute Diagnostic Analysis</span>
              <ArrowRight size={15} />
            </>
          )}
        </button>

        <button
          type="button"
          className="btn-sample-trigger"
          onClick={onOpenSamples}
          disabled={loading}
        >
          <span>Or load a benchmark sample case</span>
        </button>
      </div>

      {/* Error Message Notification */}
      {error && (
        <div className="error-alert">
          <AlertCircle size={18} className="error-icon" />
          <div className="error-text">
            <strong>Diagnostic Error:</strong> {error}
          </div>
        </div>
      )}
    </div>
  );
}
