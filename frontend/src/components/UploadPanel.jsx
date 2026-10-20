import { useState, useCallback, useRef } from 'react'

export default function UploadPanel({
  file,
  confidence,
  loading,
  status,
  onFileSelect,
  onConfidenceChange,
  onAnalyze,
}) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped && dropped.type.startsWith('image/')) onFileSelect(dropped)
  }, [onFileSelect])

  const handleDragOver = useCallback((e) => {
    e.preventDefault()
    setDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setDragging(false), [])

  const handleInputChange = useCallback((e) => {
    onFileSelect(e.target.files[0])
  }, [onFileSelect])

  const dropzoneClass = [
    'dropzone',
    dragging ? 'dragging' : '',
    file ? 'has-file' : '',
  ].filter(Boolean).join(' ')

  return (
    <section className="card upload-section">
      {/* Drop zone */}
      <div
        id="dropzone"
        className={dropzoneClass}
        onClick={() => inputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        aria-label="Upload X-ray image"
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
      >
        <span className="dropzone-icon">{file ? '✅' : '🫁'}</span>
        <p className="dropzone-text">
          {file ? 'Image selected' : 'Drop an X-ray image here'}
        </p>
        <p className="dropzone-sub">
          {file ? 'Click to change' : 'or click to browse — JPG / PNG, max 12 MB'}
        </p>
        {file && (
          <span className="dropzone-filename">
            📄 {file.name}
          </span>
        )}
        <input
          ref={inputRef}
          id="imageFile"
          type="file"
          accept="image/png,image/jpeg"
          style={{ display: 'none' }}
          onChange={handleInputChange}
        />
      </div>

      {/* Controls row */}
      <div className="controls-row">
        <div>
          <div className="field-label">
            Confidence threshold
            <span className="value-badge">{confidence.toFixed(2)}</span>
          </div>
          <input
            id="confidence"
            type="range"
            min="0.05"
            max="0.95"
            step="0.05"
            value={confidence}
            onChange={(e) => onConfidenceChange(Number(e.target.value))}
          />
        </div>

        <button
          id="analyzeButton"
          className="analyze-btn"
          type="button"
          disabled={loading || !file}
          onClick={onAnalyze}
        >
          {loading ? (
            <>
              <span className="btn-spinner" />
              Analyzing…
            </>
          ) : (
            <>
              🔬 Analyze image
            </>
          )}
        </button>
      </div>

      {/* Status bar */}
      {status.text && (
        <div
          className={`status-bar ${status.type}`}
          role="status"
          aria-live="polite"
        >
          {status.text}
        </div>
      )}
    </section>
  )
}
