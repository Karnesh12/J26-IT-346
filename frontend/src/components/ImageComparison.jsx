export default function ImageComparison({ originalUrl, overlayBase64, filename }) {
  return (
    <div className="image-grid">
      <div className="image-card">
        <div className="image-card-header">
          <span className="image-card-dot" style={{ background: '#60a5fa' }} />
          Uploaded X-ray
          {filename && <span style={{ color: 'var(--text3)', fontWeight: 400 }}>· {filename}</span>}
        </div>
        <img
          id="originalImage"
          src={originalUrl}
          alt="Uploaded X-ray preview"
        />
      </div>

      <div className="image-card">
        <div className="image-card-header">
          <span className="image-card-dot" style={{ background: '#10b981' }} />
          Predicted mask overlay
        </div>
        {overlayBase64 ? (
          <img
            id="overlayImage"
            src={`data:image/png;base64,${overlayBase64}`}
            alt="Predicted segmentation overlay"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 260,
              color: 'var(--text3)',
              fontSize: '.85rem',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <span style={{ fontSize: '2rem' }}>🔍</span>
            Run analysis to see overlay
          </div>
        )}
      </div>
    </div>
  )
}
