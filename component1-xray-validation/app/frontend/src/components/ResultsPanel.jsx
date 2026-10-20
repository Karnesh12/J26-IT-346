import { useState } from "react";
import Bars from "./Bars.jsx";
import { Alert, Bone, Check, Chevron, Cross, Info } from "./Icons.jsx";

// 3. Validation results: Model 1 (X-ray?) + Model 2 (region / route) + explanation, from the real API result.
const NAMES = { mobilenetv3: "MobileNetV3", deit_small: "DeiT-Small" };
const ROUTE = { HAND: "HAND → hand fracture module", LEG: "LEG → leg fracture module",
                OTHER: "OTHER → outside hand/leg scope, not routed" };
const STATUS = {
  xray:      { key: "accepted",  text: "Accepted",  Icon: Check, cls: "ok" },
  not_xray:  { key: "rejected",  text: "Rejected",  Icon: Cross, cls: "bad" },
  uncertain: { key: "uncertain", text: "Uncertain", Icon: Alert, cls: "warn" },
};
const pct = (x, d = 1) => `${(x * 100).toFixed(d)}%`;

export default function ResultsPanel({ result }) {
  const [showRegions, setShowRegions] = useState(false);
  const v = result?.validation, r = result?.region, e = result?.explanation;
  const st = v ? STATUS[v.decision] : null;

  return (
    <section className="card results">
      <div className="card-head">
        <h2 className="card-title">3. Validation results</h2>
        <div className="pills">
          {Object.values(STATUS).map(({ key, text, Icon, cls }) => (
            <span key={key} className={`pill ${st?.key === key ? `on ${cls}` : ""}`}><Icon width="15" height="15" /> {text}</span>
          ))}
        </div>
      </div>

      {!result && <p className="empty">Upload an image and press <b>Run validation</b>. The results of both models appear here.</p>}

      {result && (
        <>
          <div className="stats">
            {/* ---- Model 1 ---- */}
            <div className="stat">
              <p className="stat-label">X-ray validation · Model 1</p>
              <p className={`stat-value ${st.cls}`}><st.Icon /> {st.text}</p>
              <p className="muted small">X-ray probability (ensemble)</p>
              <p className="big">{pct(v.p_xray, 0)}</p>
              <div className="gauge">
                <span className="zone bad" style={{ width: `${v.thresholds.reject * 100}%` }} />
                <span className="zone warn" style={{ width: `${(v.thresholds.accept - v.thresholds.reject) * 100}%` }} />
                <span className="zone ok" style={{ width: `${(1 - v.thresholds.accept) * 100}%` }} />
                <span className="needle" style={{ left: `${v.p_xray * 100}%` }} />
              </div>
              <div className="gauge-scale"><span>0</span><span style={{ left: "30%" }}>0.3</span><span style={{ left: "70%" }}>0.7</span><span>1</span></div>
              <p className="muted small">
                Colour check: {v.colourfulness}{" "}
                {v.colour_rejected ? <span className="tag bad">rejected (≥ {v.thresholds.colourful})</span>
                                   : <span className="tag ok">passed</span>}
              </p>
            </div>

            {/* ---- Model 2 ---- */}
            <div className="stat">
              {!r && (
                <>
                  <p className="stat-label">Region · Model 2</p>
                  <p className="stat-value muted"><Bone /> Not analysed</p>
                  <p className="muted small">Skipped – only images accepted as X-rays are classified.</p>
                </>
              )}
              {r && r.routed && (
                <>
                  <p className="stat-label">Region · Model 2</p>
                  <p className="stat-value"><Bone className="accent" /> {r.fine}</p>
                  <p className="small">Route: <b>{ROUTE[r.super]}</b></p>
                  <p className="muted small">Model confidence ({r.super})</p>
                  <div className="conf"><span className="big-sm">{pct(r.super_confidence, 0)}</span>
                    <span className="conf-track"><span style={{ width: pct(r.super_confidence) }} /></span></div>
                  <p className="muted small">Sub-region confidence: {pct(r.fine_confidence, 0)}</p>
                </>
              )}
              {r && !r.routed && (
                <>
                  <p className="stat-label">Region · Model 2</p>
                  <p className="stat-value warn"><Alert /> Uncertain: {r.candidates.join(" or ")}</p>
                  <p className="small">Route: <b>not routed – human review</b></p>
                  <p className="muted small">Reason: {r.route_reason}. Ensemble leans {r.super} ({pct(r.super_confidence, 0)}).</p>
                </>
              )}
            </div>
          </div>

          {/* ---- details ---- */}
          <div className="details">
            <div className="chips">
              <span className="muted small">Model 1:</span>
              {Object.entries(v.per_model).map(([k, p]) => <span key={k} className="chip">{NAMES[k] || k} {pct(p)}</span>)}
            </div>
            {r && (
              <div className="chips">
                <span className="muted small">Model 2:</span>
                {Object.entries(r.per_model).map(([k, m]) => <span key={k} className="chip">{NAMES[k] || k}: {m.super} · {m.fine}</span>)}
                {r.models_agree_super ? <span className="tag ok">agree</span> : <span className="tag warn">disagree</span>}
              </div>
            )}
            {r && (
              <button className="link-btn" onClick={() => setShowRegions((s) => !s)}>
                {showRegions ? "Hide" : "Show"} all 7 regions <Chevron open={showRegions} />
              </button>
            )}
            {r && showRegions && (
              <div className="regions">
                <h3>HAND / LEG / OTHER</h3>
                <Bars items={Object.entries(r.super_probs).map(([label, p]) => ({ label, p })).sort((a, b) => b.p - a.p)}
                      highlight={r.super} />
                <h3>Sub-regions (7 classes)</h3>
                <Bars items={r.fine_probs.map((d) => ({ label: d.label, p: d.p, tag: d.super }))} highlight={r.fine} />
              </div>
            )}
          </div>

          {/* ---- explanation / notes ---- */}
          <div className="note info">
            <Info />
            <div>
              <p className="note-title">What does this mean?</p>
              <p>{e ? e.text : v.message}</p>
            </div>
          </div>
          {(v.decision === "uncertain" || e?.review_recommended) && (
            <div className="note warn">
              <Alert />
              <div>
                <p className="note-title">Human review required</p>
                <p>{v.decision === "uncertain"
                  ? "The system is not sure this is an X-ray. Upload a clearer X-ray or ask a person to check."
                  : "The two models disagree or confidence is low, so the image is not sent to a fracture module automatically."}</p>
              </div>
            </div>
          )}
          {e && !e.review_recommended && e.region_uncertain && (
            <div className="note subtle"><Info /><p>The exact sub-region is uncertain (neighbouring regions look similar). HAND/LEG routing is confident.</p></div>
          )}
        </>
      )}
    </section>
  );
}
