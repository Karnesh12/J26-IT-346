import Bars from "./Bars.jsx";

// Model 2 result: HAND / LEG / OTHER plus the 7 fine regions.
const MODEL_NAMES = { mobilenetv3: "MobileNetV3", deit_small: "DeiT-Small" };
const ROUTE = {
  HAND: "→ hand fracture model",
  LEG: "→ leg fracture model",
  OTHER: "→ not routed (outside hand/leg scope)",
};

export default function RegionCard({ r }) {
  const superItems = Object.entries(r.super_probs)
    .map(([label, p]) => ({ label, p }))
    .sort((a, b) => b.p - a.p);
  const fineItems = r.fine_probs.map((d) => ({ label: d.label, p: d.p, tag: d.super }));

  return (
    <section className="card">
      <div className="card-head">
        <h2>3 · Anatomical region <span className="muted">(Model 2)</span></h2>
        <span className={`badge region ${r.super.toLowerCase()}`}>{r.super}</span>
      </div>
      <p className="headline">
        <b>{r.super}</b> X-ray ({(r.super_confidence * 100).toFixed(1)}%) – most likely{" "}
        <b>{r.fine}</b> ({(r.fine_confidence * 100).toFixed(1)}%)
      </p>
      <p className="muted route">{ROUTE[r.super]}</p>

      <h3>HAND / LEG / OTHER</h3>
      <Bars items={superItems} highlight={r.super} />

      <h3>Sub-regions (7 classes)</h3>
      <Bars items={fineItems} highlight={r.fine} />

      <div className="kv">
        <span>Ensemble members</span>
        <span>
          {Object.entries(r.per_model).map(([k, v]) => (
            <span key={k} className="chip">{MODEL_NAMES[k] || k}: {v.super} · {v.fine}</span>
          ))}
          {r.models_agree_super
            ? <span className="tag ok">agree on HAND/LEG/OTHER</span>
            : <span className="tag warn">disagree</span>}
        </span>
      </div>
    </section>
  );
}
