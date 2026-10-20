import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Scan, 
  Layers, 
  SplitSquareHorizontal, 
  SlidersHorizontal, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2,
  Eye,
  EyeOff,
  Sun,
  Contrast,
  Sparkles,
  Crosshair,
  Info
} from 'lucide-react';

export default function ImageViewer({
  previewUrl,
  imageSize,
  result,
  loading,
  focusedBoxIndex,
  setFocusedBoxIndex,
  visibleBoxes,
  toggleBoxVisibility
}) {
  // Viewer modes: 'boxes' | 'gradcam' | 'split' | 'blend'
  const [viewMode, setViewMode] = useState('boxes');
  
  // Image PACS adjustments
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(100); // 50 to 150
  const [contrast, setContrast] = useState(100);     // 50 to 200
  const [zoom, setZoom] = useState(1);               // 0.75 to 2.5
  
  // Split Curtain position (0 - 100 percentage)
  const [splitPos, setSplitPos] = useState(50);
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  
  // Blend Opacity (0 - 100 percentage)
  const [blendOpacity, setBlendOpacity] = useState(65);

  const containerRef = useRef(null);
  const splitTrackRef = useRef(null);

  const boxes = result?.localization_boxes ?? [];
  const hasGradcam = Boolean(result?.gradcam_image);

  // If user switches to split or blend but no gradcam is available, fallback to boxes
  useEffect(() => {
    if (!hasGradcam && (viewMode === 'split' || viewMode === 'blend' || viewMode === 'gradcam')) {
      setViewMode('boxes');
    }
  }, [hasGradcam, viewMode]);

  // Handle Split Curtain Drag
  const handleSplitMove = useCallback((clientX) => {
    if (!splitTrackRef.current) return;
    const rect = splitTrackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSplitPos(percentage);
  }, []);

  const handleMouseDownSplit = (e) => {
    e.preventDefault();
    setIsDraggingSplit(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDraggingSplit) return;
      handleSplitMove(e.clientX);
    };

    const handleMouseUp = () => {
      if (isDraggingSplit) setIsDraggingSplit(false);
    };

    const handleTouchMove = (e) => {
      if (!isDraggingSplit || !e.touches[0]) return;
      handleSplitMove(e.touches[0].clientX);
    };

    if (isDraggingSplit) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDraggingSplit, handleSplitMove]);

  // Reset filters
  const resetAdjustments = () => {
    setInvert(false);
    setBrightness(100);
    setContrast(100);
    setZoom(1);
    setSplitPos(50);
    setBlendOpacity(65);
  };

  // Convert YOLO coordinates into scaled percentage styles
  function getBoxStyle(box) {
    const width = imageSize.width;
    const height = imageSize.height;

    if (!width || !height) return {};

    const x1 = Math.max(0, Math.min(box.x1, width));
    const y1 = Math.max(0, Math.min(box.y1, height));
    const x2 = Math.max(0, Math.min(box.x2, width));
    const y2 = Math.max(0, Math.min(box.y2, height));

    return {
      left: `${(x1 / width) * 100}%`,
      top: `${(y1 / height) * 100}%`,
      width: `${((x2 - x1) / width) * 100}%`,
      height: `${((y2 - y1) / height) * 100}%`,
    };
  }

  // Generate CSS filter string for medical enhancement
  const imageFilterStyle = {
    filter: `${invert ? 'invert(1) hue-rotate(180deg)' : ''} brightness(${brightness}%) contrast(${contrast}%)`,
    transform: `scale(${zoom})`,
    transformOrigin: 'center center',
    transition: isDraggingSplit ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1), filter 0.15s ease'
  };

  return (
    <section className="viewport-card">
      {/* Top Viewport Control Bar */}
      <div className="viewport-header">
        <div className="view-mode-tabs" role="tablist">
          <button
            role="tab"
            aria-selected={viewMode === 'boxes'}
            className={`view-mode-tab ${viewMode === 'boxes' ? 'active' : ''}`}
            onClick={() => setViewMode('boxes')}
            title="Standard radiograph with YOLO lesion localization"
          >
            <Crosshair size={14} />
            <span>Radiograph & Reticle</span>
            {boxes.length > 0 && <span className="tab-pill">{boxes.length}</span>}
          </button>

          <button
            role="tab"
            aria-selected={viewMode === 'gradcam'}
            disabled={!hasGradcam}
            className={`view-mode-tab ${viewMode === 'gradcam' ? 'active' : ''}`}
            onClick={() => setViewMode('gradcam')}
            title={hasGradcam ? "Deep learning feature attention heatmap" : "Analyze image to generate Grad-CAM"}
          >
            <Sparkles size={14} />
            <span>Grad-CAM Heatmap</span>
          </button>

          <button
            role="tab"
            aria-selected={viewMode === 'split'}
            disabled={!hasGradcam}
            className={`view-mode-tab ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => setViewMode('split')}
            title={hasGradcam ? "Side-by-side interactive split comparison" : "Analyze image to enable split view"}
          >
            <SplitSquareHorizontal size={14} />
            <span>Split Curtain</span>
          </button>

          <button
            role="tab"
            aria-selected={viewMode === 'blend'}
            disabled={!hasGradcam}
            className={`view-mode-tab ${viewMode === 'blend' ? 'active' : ''}`}
            onClick={() => setViewMode('blend')}
            title={hasGradcam ? "Superimpose heatmap with transparency" : "Analyze image to enable blend"}
          >
            <Layers size={14} />
            <span>Heatmap Blend</span>
          </button>
        </div>

        {/* Viewport Action Tools */}
        <div className="viewport-tools">
          <button
            className={`tool-btn ${invert ? 'active' : ''}`}
            onClick={() => setInvert(!invert)}
            title="Invert Bone Density (Grayscale Negative)"
          >
            <Contrast size={14} />
            <span className="tool-btn-text">Invert</span>
          </button>

          <div className="tool-divider" />

          <button
            className="tool-btn icon-only"
            onClick={() => setZoom(Math.max(0.75, zoom - 0.2))}
            title="Zoom Out"
            disabled={zoom <= 0.75}
          >
            <ZoomOut size={15} />
          </button>

          <span className="tool-readout" title="Current Zoom Level">
            {Math.round(zoom * 100)}%
          </span>

          <button
            className="tool-btn icon-only"
            onClick={() => setZoom(Math.min(2.5, zoom + 0.2))}
            title="Zoom In"
            disabled={zoom >= 2.5}
          >
            <ZoomIn size={15} />
          </button>

          <button
            className="tool-btn icon-only"
            onClick={resetAdjustments}
            title="Reset All Adjustments"
          >
            <RotateCcw size={14} />
          </button>
        </div>
      </div>

      {/* Secondary Slider Bar for Blend / Split Modes */}
      {viewMode === 'blend' && hasGradcam && (
        <div className="viewport-subbar">
          <span className="subbar-label">
            <Layers size={13} />
            Heatmap Opacity: {blendOpacity}%
          </span>
          <input
            type="range"
            min="10"
            max="100"
            value={blendOpacity}
            onChange={(e) => setBlendOpacity(Number(e.target.value))}
            className="range-slider"
          />
        </div>
      )}

      {/* Main Radiograph Screen Stage */}
      <div 
        className="radiograph-stage" 
        ref={containerRef}
      >
        {/* HUD Medical Reticle Accents */}
        <div className="hud-corner top-left" />
        <div className="hud-corner top-right" />
        <div className="hud-corner bottom-left" />
        <div className="hud-corner bottom-right" />

        {/* HUD Info Badges */}
        <div className="hud-overlay-info top">
          <span className="hud-tag">AP VIEW</span>
          <span className="hud-tag">FOV: 100%</span>
          {imageSize.width > 1 && (
            <span className="hud-tag mono">
              {imageSize.width} × {imageSize.height} PX
            </span>
          )}
        </div>

        <div className="hud-overlay-info bottom">
          <span className="hud-tag mono">WINDOW: BONE</span>
          {invert && <span className="hud-tag warning">INVERTED</span>}
          {viewMode === 'split' && <span className="hud-tag cyan">SPLIT: {Math.round(splitPos)}%</span>}
        </div>

        {/* AI Laser Scanner Overlay during Analysis */}
        {loading && (
          <div className="laser-scanner">
            <div className="laser-beam" />
            <div className="laser-grid-pulse" />
            <div className="laser-status-pill">
              <span className="laser-spinner" />
              <span>NEURAL SCAN IN PROGRESS...</span>
            </div>
          </div>
        )}

        {/* Radiograph Display Container */}
        {previewUrl ? (
          <div 
            className="viewport-canvas-wrapper" 
            ref={splitTrackRef}
          >
            {/* 1. BASE RADIOGRAPH / RETICLE VIEW */}
            {(viewMode === 'boxes' || viewMode === 'blend') && (
              <div className="image-layer base-layer" style={imageFilterStyle}>
                <img
                  src={previewUrl}
                  alt="Original X-ray Radiograph"
                  className="radiograph-img"
                />

                {/* YOLO Bounding Boxes Overlay (Visible in 'boxes' mode) */}
                {viewMode === 'boxes' && boxes.length > 0 && boxes.map((box, idx) => {
                  if (visibleBoxes && !visibleBoxes.has(idx)) return null;
                  const isFocused = focusedBoxIndex === idx;

                  return (
                    <div
                      key={`box-${idx}-${box.x1}-${box.y1}`}
                      className={`hud-detection-box ${isFocused ? 'focused' : ''}`}
                      style={getBoxStyle(box)}
                      onMouseEnter={() => setFocusedBoxIndex(idx)}
                      onMouseLeave={() => setFocusedBoxIndex(null)}
                      onClick={() => setFocusedBoxIndex(isFocused ? null : idx)}
                    >
                      {/* High-Tech HUD Reticle Corners */}
                      <span className="box-bracket tl" />
                      <span className="box-bracket tr" />
                      <span className="box-bracket bl" />
                      <span className="box-bracket br" />
                      <span className="box-crosshair-center" />

                      <div className="box-hud-pill">
                        <span className="box-id">Locus #{idx + 1}</span>
                        <span className="box-conf">{(box.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. GRAD-CAM STANDALONE VIEW */}
            {viewMode === 'gradcam' && hasGradcam && (
              <div className="image-layer gradcam-layer" style={imageFilterStyle}>
                <img
                  src={result.gradcam_image}
                  alt="Grad-CAM Explainability Heatmap"
                  className="radiograph-img"
                />
              </div>
            )}

            {/* 3. HEATMAP BLEND OVERLAY */}
            {viewMode === 'blend' && hasGradcam && (
              <div 
                className="image-layer blend-layer" 
                style={{
                  ...imageFilterStyle,
                  opacity: blendOpacity / 100,
                  mixBlendMode: 'screen',
                  pointerEvents: 'none'
                }}
              >
                <img
                  src={result.gradcam_image}
                  alt="Grad-CAM Blend"
                  className="radiograph-img"
                />
              </div>
            )}

            {/* 4. INTERACTIVE SPLIT CURTAIN COMPARISON */}
            {viewMode === 'split' && hasGradcam && (
              <div className="split-curtain-container" style={imageFilterStyle}>
                {/* Underneath: Grad-CAM Image */}
                <div className="split-layer-under">
                  <img
                    src={result.gradcam_image}
                    alt="Grad-CAM Underlay"
                    className="radiograph-img"
                  />
                  <span className="split-layer-badge right">Grad-CAM Heatmap</span>
                </div>

                {/* On Top: Original X-ray clipped by slider position */}
                <div 
                  className="split-layer-over" 
                  style={{ clipPath: `inset(0 ${100 - splitPos}% 0 0)` }}
                >
                  <img
                    src={previewUrl}
                    alt="Original Radiograph Overlay"
                    className="radiograph-img"
                  />
                  <span className="split-layer-badge left">Original Radiograph</span>
                </div>

                {/* Draggable Divider Line & Handle */}
                <div 
                  className={`split-divider-line ${isDraggingSplit ? 'active' : ''}`}
                  style={{ left: `${splitPos}%` }}
                  onMouseDown={handleMouseDownSplit}
                  onTouchStart={handleMouseDownSplit}
                >
                  <div className="split-handle">
                    <SplitSquareHorizontal size={16} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-viewport-placeholder">
            <Scan size={44} className="placeholder-icon" />
            <p className="placeholder-title">No Radiograph Loaded</p>
            <p className="placeholder-desc">
              Select a benchmark radiograph from the demo cases or upload a DICOM/X-ray image to initialize diagnostics.
            </p>
          </div>
        )}
      </div>

      {/* Viewport Footer Telemetry & Color Spectrum Legend */}
      <div className="viewport-footer">
        <div className="footer-left">
          {viewMode === 'boxes' && boxes.length > 0 && (
            <span className="footer-tag">
              <Crosshair size={13} className="text-cyan" />
              {boxes.length} Fracture Locus Detected by YOLO11
            </span>
          )}

          {(viewMode === 'gradcam' || viewMode === 'split' || viewMode === 'blend') && (
            <div className="gradcam-legend-bar">
              <span className="legend-label">Attention:</span>
              <span className="legend-chip low">Low (Cold)</span>
              <div className="legend-gradient" />
              <span className="legend-chip high">Critical (Hot)</span>
            </div>
          )}
        </div>

        <div className="footer-right">
          <span className="resolution-chip">
            {imageSize.width > 1 ? `${imageSize.width} × ${imageSize.height}` : 'Standby'}
          </span>
        </div>
      </div>
    </section>
  );
}
