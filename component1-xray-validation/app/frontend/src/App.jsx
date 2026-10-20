import { useEffect, useState } from "react";
import { analyzeImage, checkHealth } from "./api.js";
import UploadPanel from "./components/UploadPanel.jsx";
import PreviewPanel from "./components/PreviewPanel.jsx";
import ResultsPanel from "./components/ResultsPanel.jsx";
import { Logo } from "./components/Icons.jsx";

export default function App() {
  const [backendOk, setBackendOk] = useState(null);     // null = checking
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkHealth().then(() => setBackendOk(true)).catch(() => setBackendOk(false));
  }, []);

  const reset = () => { setResult(null); setError(""); };
  const onFile = (f) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f); setPreviewUrl(URL.createObjectURL(f)); reset();
  };
  const onClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(null); reset();
  };
  const onAnalyze = async () => {
    setLoading(true); reset();
    try { setResult(await analyzeImage(file)); setBackendOk(true); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <header className="topbar">
        <div className="brand"><Logo className="accent" /> <span>BoneVision <b>AI</b></span></div>
        <div className="topbar-right">
          <span className="muted small">Component 1 · Research prototype · not for clinical use</span>
          {/* <span className={`status ${backendOk === null ? "" : backendOk ? "ok" : "bad"}`}>
            {backendOk === null ? "Checking models…" : backendOk ? "● Models ready" : "● Backend offline"}
          </span> */}
        </div>
      </header>

      <main className="content">
        <h1>X-ray Validation &amp; Region Classification</h1>
        <p className="subtitle">
          Check that the uploaded image is an X-ray, then classify the anatomical region to route the case to the
          hand or leg fracture module.
        </p>
        <div className="pipeline">
          <span>Colour check</span>→<span>Model 1: X-ray?</span>→<span>Model 2: HAND / LEG / OTHER</span>→<span>Grad-CAM + explanation</span>
        </div>

        {backendOk === false && (
          <div className="banner bad">The backend is not running. Start it in <code>app/backend</code> with
            <code>uvicorn app.main:app --reload --port 8000</code></div>
        )}
        {error && <div className="banner bad">{error}</div>}

        <div className="grid">
          <UploadPanel file={file} previewUrl={previewUrl} onFile={onFile} onClear={onClear}
                       onAnalyze={onAnalyze} loading={loading} timeMs={result?.time_ms ?? null} />
          <PreviewPanel previewUrl={previewUrl} result={result} />
          <ResultsPanel result={result} />
        </div>
      </main>

      <footer>Research prototype (SLIIT BoneVision AI, J26-IT-346) · model outputs are not a clinical diagnosis.</footer>
    </div>
  );
}
