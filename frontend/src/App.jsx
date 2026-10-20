import { useState, useEffect, useCallback, useRef } from 'react'
import UploadPanel from './components/UploadPanel.jsx'
import ResultsPanel from './components/ResultsPanel.jsx'
import ImageComparison from './components/ImageComparison.jsx'

function HealthBadge() {
  const [status, setStatus] = useState('loading') // 'loading' | 'online' | 'offline'
  const [modelName, setModelName] = useState('')

  useEffect(() => {
    let cancelled = false

    async function poll() {
      for (let attempt = 0; attempt < 10; attempt++) {
        if (cancelled) return
        try {
          const controller = new AbortController()
          const timer = setTimeout(() => controller.abort(), 4000)
          const r = await fetch('/api/health', { signal: controller.signal })
          clearTimeout(timer)
          if (!r.ok) throw new Error('not ok')
          const d = await r.json()
          if (cancelled) return
          setStatus(d.model_loaded ? 'online' : 'offline')
          setModelName(d.model || '')
          return // success — stop polling
        } catch {
          if (cancelled) return
          // wait 3s before next attempt
          await new Promise(res => setTimeout(res, 3000))
        }
      }
      if (!cancelled) setStatus('offline') // exhausted retries
    }

    poll()
    return () => { cancelled = true }
  }, [])

  const label = status === 'loading' ? 'Connecting…'
              : status === 'online'  ? `Model ready · ${modelName}`
              : 'Backend offline'

  return (
    <div className="health-badge" title={label}>
      <span className={`health-dot ${status}`} />
      {label}
    </div>
  )
}

export default function App() {
  const [file, setFile]             = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [confidence, setConfidence] = useState(0.25)
  const [loading, setLoading]       = useState(false)
  const [status, setStatus]         = useState({ text: '', type: '' })
  const [result, setResult]         = useState(null)

  // Clean up object URL on unmount / file change
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl) }
  }, [previewUrl])

  const handleFileSelect = useCallback((selectedFile) => {
    if (!selectedFile) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setFile(selectedFile)
    setPreviewUrl(URL.createObjectURL(selectedFile))
    setResult(null)
    setStatus({ text: '', type: '' })
  }, [previewUrl])

  const handleAnalyze = useCallback(async () => {
    if (!file) { setStatus({ text: 'Please select an image first.', type: 'error' }); return }

    setLoading(true)
    setStatus({ text: 'Running the segmentation model…', type: 'running' })
    setResult(null)

    try {
      const form = new FormData()
      form.append('file', file)
      form.append('confidence', String(confidence))

      const response = await fetch('/api/predict', { method: 'POST', body: form })
      const data = await response.json()

      if (!response.ok) throw new Error(data.detail || 'Prediction failed.')

      setResult(data)
      setStatus({
        text: `✓ Found ${data.prediction_count} predicted region${data.prediction_count !== 1 ? 's' : ''}.`,
        type: 'success',
      })
    } catch (err) {
      setStatus({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [file, confidence])

  return (
    <div className="app">
      <header className="header">
        <div className="header-brand">
          <div className="brand-icon">🦴</div>
          <div>
            <h1 className="header-title">FractureAI</h1>
            <p className="header-sub">Component 4 · YOLOv8-seg research prototype</p>
          </div>
        </div>
        <HealthBadge />
      </header>

      <UploadPanel
        file={file}
        confidence={confidence}
        loading={loading}
        status={status}
        onFileSelect={handleFileSelect}
        onConfidenceChange={setConfidence}
        onAnalyze={handleAnalyze}
      />

      {previewUrl && (
        <ImageComparison
          originalUrl={previewUrl}
          overlayBase64={result?.overlay_png_base64 ?? null}
          filename={file?.name}
        />
      )}

      {result && <ResultsPanel result={result} />}

      <div className="notice-banner">
        <span className="notice-banner-icon">⚠️</span>
        <span>
          <strong>Research demo only.</strong> The model predicts one class, "fractured." It does not
          identify Hand/Leg, provide a diagnosis, or produce calibrated physical measurements. This
          output is not a medical diagnosis.
        </span>
      </div>
    </div>
  )
}
