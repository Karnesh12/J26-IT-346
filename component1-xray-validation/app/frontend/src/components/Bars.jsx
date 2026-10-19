// Horizontal probability bars, highest first.
export default function Bars({ items, highlight }) {
  return (
    <div className="bars">
      {items.map(({ label, p, tag }) => (
        <div key={label} className={`bar-row ${label === highlight ? "top" : ""}`}>
          <span className="bar-label">
            {label} {tag && <span className="tag">{tag}</span>}
          </span>
          <span className="bar-track">
            <span className="bar-fill" style={{ width: `${Math.max(p * 100, 0.5)}%` }} />
          </span>
          <span className="bar-value">{(p * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
