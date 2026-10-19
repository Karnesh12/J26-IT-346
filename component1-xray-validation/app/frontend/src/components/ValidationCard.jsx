// Stage 0 (colour check) + Model 1 (X-ray validation) result.
const LABEL = {
  xray: { text: "X-ray", cls: "ok" },
  not_xray: { text: "Not an X-ray", cls: "bad" },
  uncertain: { text: "Uncertain", cls: "warn" },
};

const MODEL_NAMES = { mobilenetv3: "MobileNetV3", deit_small: "DeiT-Small" };

export default function ValidationCard({ v }) {
  const badge = LABEL[v.decision];
  const pct = (x) => `${(x * 100).toFixed(1)}%`;
  return (
    <section className="card">
      <div className="card-head">
        <h2>2 · X-ray validation <span className="muted">(Model 1)</span></h2>
        <span className={`badge ${badge.cls}`}>{badge.text}</span>
      </div>
      <p className="message">{v.message}</p>

      <div className="kv">
        <span>Colour check</span>
        <span>
          colourfulness <b>{v.colourfulness}</b>{" "}
          {v.colour_rejected
            ? <span className="tag bad">rejected (≥ {v.thresholds.colourful})</span>
            : <span className="tag ok">passed</span>}
        </span>
      </div>

      <div className="gauge-wrap">
        <div className="gauge-labels">
          <span>
            Probability of X-ray (ensemble)
            {v.colour_rejected && <span className="tag">not used – colour check already rejected</span>}
          </span>
          <b>{pct(v.p_xray)}</b>
        </div>
        <div className="gauge">
          <div className="zone bad" style={{ width: `${v.thresholds.reject * 100}%` }} />
          <div className="zone warn" style={{ width: `${(v.thresholds.accept - v.thresholds.reject) * 100}%` }} />
          <div className="zone ok" style={{ width: `${(1 - v.thresholds.accept) * 100}%` }} />
          <div className="needle" style={{ left: `${v.p_xray * 100}%` }} />
        </div>
        <div className="gauge-scale">
          <span>0</span>
          <span style={{ left: `${v.thresholds.reject * 100}%` }}>{v.thresholds.reject}</span>
          <span style={{ left: `${v.thresholds.accept * 100}%` }}>{v.thresholds.accept}</span>
          <span>1</span>
        </div>
      </div>

      <div className="kv">
        <span>Per model</span>
        <span>
          {Object.entries(v.per_model).map(([k, p]) => (
            <span key={k} className="chip">{MODEL_NAMES[k] || k}: {pct(p)}</span>
          ))}
        </span>
      </div>
    </section>
  );
}
