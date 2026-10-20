function StatBox({ label, value }) {
  return (
    <div className="stat-box">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value ?? '—'}</div>
    </div>
  )
}

function ConfidenceBar({ value }) {
  return (
    <div className="conf-bar-wrapper">
      <div className="conf-bar-track">
        <div
          className="conf-bar-fill"
          style={{ width: `${Math.round(value * 100)}%` }}
        />
      </div>
    </div>
  )
}

function DetectionCard({ detection, index }) {
  const d = detection
  const confPct = (d.confidence * 100).toFixed(1)
  const extent  = d.mask_extent
    ? `${d.mask_extent.width_px} × ${d.mask_extent.height_px} px`
    : '—'
  const length  = d.approx_major_axis_span_px != null
    ? `${Number(d.approx_major_axis_span_px).toFixed(1)} px`
    : '—'
  const width   = d.approx_short_axis_width_px != null
    ? `${Number(d.approx_short_axis_width_px).toFixed(1)} px`
    : '—'
  const coverage = d.mask_percent_of_image != null
    ? `${Number(d.mask_percent_of_image).toFixed(3)}%`
    : '—'

  return (
    <div className="detection-card">
      <div className="detection-card-header">
        <span className="detection-index">{index + 1}</span>
        <span className="confidence-badge">
          {confPct}% confidence
        </span>
      </div>

      <ConfidenceBar value={d.confidence} />

      <div className="detection-stats" style={{ marginTop: 14 }}>
        <StatBox label="Class"         value={d.class_name} />
        <StatBox label="Mask area"     value={d.mask_area_px != null ? `${d.mask_area_px} px²` : null} />
        <StatBox label="Extent (W×H)"  value={extent} />
        <StatBox label="Region length" value={length} />
        <StatBox label="Short-axis"    value={width} />
        <StatBox label="Image cover"   value={coverage} />
      </div>
    </div>
  )
}

export default function ResultsPanel({ result }) {
  const { prediction_count, image_width_px, image_height_px, confidence_threshold, detections, measurement_note } = result

  return (
    <section className="card results-section">
      <div className="results-header">
        <h2 className="results-title">Prediction summary</h2>
        <div className="chips-row">
          <span className="chip green">
            🎯 {prediction_count} region{prediction_count !== 1 ? 's' : ''}
          </span>
          <span className="chip blue">
            📐 {image_width_px} × {image_height_px} px
          </span>
          <span className="chip amber">
            ⚙️ Threshold {Number(confidence_threshold).toFixed(2)}
          </span>
        </div>
      </div>

      {detections.length === 0 ? (
        <div className="no-detections">
          <div className="no-det-icon">🔎</div>
          <p>No regions were predicted above this threshold.</p>
          <p style={{ marginTop: 4, fontSize: '.8rem' }}>
            This does not rule out a fracture — try lowering the confidence threshold.
          </p>
        </div>
      ) : (
        <div className="detection-grid">
          {detections.map((d, i) => (
            <DetectionCard key={i} detection={d} index={i} />
          ))}
        </div>
      )}

      {measurement_note && (
        <div className="measurement-note">
          📏 {measurement_note} Length and short-axis width come from a rotated rectangle around the
          predicted mask. The width is not the distance between opposing fracture edges.
        </div>
      )}
    </section>
  )
}
