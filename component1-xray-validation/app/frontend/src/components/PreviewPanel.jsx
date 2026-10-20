import { useEffect, useState } from "react";

// 2. X-ray preview: the uploaded image, and after analysis the model input or the Grad-CAM heatmap.
export default function PreviewPanel({ previewUrl, result }) {
  const heatmap = result?.explanation?.heatmap;
  const [view, setView] = useState("original");
  useEffect(() => setView("original"), [result, previewUrl]);

  let src = previewUrl, caption = previewUrl ? "Uploaded image" : "";
  if (result && view === "original") { src = result.input_image; caption = "Model input (224 × 224, grayscale)"; }
  if (result && view === "heatmap" && heatmap) {
    src = heatmap; caption = `${result.explanation.method} – where the model looked (red = most important)`;
  }

  return (
    <section className="card">
      <div className="card-head">
        <h2 className="card-title">2. X-ray preview</h2>
        <div className="segmented">
          <button className={view === "original" ? "on" : ""} onClick={() => setView("original")}>Original</button>
          <button className={view === "heatmap" ? "on" : ""} disabled={!heatmap}
                  title={heatmap ? "" : "Available after an X-ray is accepted"}
                  onClick={() => setView("heatmap")}>Heatmap</button>
        </div>
      </div>
      <div className={`viewer ${src ? "" : "empty-view"}`}>
        {src ? <img src={src} alt={caption} /> : <p className="viewer-empty">No image yet</p>}
        {result && <span className="viewer-badge">{result.time_ms} ms</span>}
      </div>
      <p className="muted small center caption">{caption}</p>
    </section>
  );
}
