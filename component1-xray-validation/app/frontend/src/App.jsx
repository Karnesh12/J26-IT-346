import { useEffect, useState } from "react";
import { analyzeImage, checkHealth } from "./api.js";
import UploadPanel from "./components/UploadPanel.jsx";
import ValidationCard from "./components/ValidationCard.jsx";
import RegionCard from "./components/RegionCard.jsx";
import ExplanationCard from "./components/ExplanationCard.jsx";

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

  const onFile = (f) => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setError("");
  };

  const onAnalyze = async () => {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      setResult(await analyzeImage(file));
      setBackendOk(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <header>
        <div>
          <h1>BoneVision AI</h1>
          <p className="subtitle">Component 1 · X-ray validation and anatomical region classification</p>
        </div>
        <span className={`status ${backendOk === null ? "" : backendOk ? "ok" : "bad"}`}>
          {backendOk === null ? "Checking backend…" : backendOk ? "● Models ready" : "● Backend offline"}
        </span>
      </header>

      <div className="pipeline">
        <span>Colour check</span>→<span>Model 1: X-ray?</span>→
        <span>Model 2: HAND / LEG / OTHER</span>→<span>Grad-CAM + explanation</span>
      </div>

      <main>
        <div className="left">
          <UploadPanel file={file} previewUrl={previewUrl} onFile={onFile}
                       onAnalyze={onAnalyze} loading={loading} />
          {result && <p className="muted timing">Processed in {result.time_ms} ms</p>}
        </div>

        <div className="right">
          {backendOk === false && !result && (
            <div className="card notice bad">
              The backend is not running. Start it in the backend folder with:
              <code>uvicorn app.main:app --reload --port 8000</code>
            </div>
          )}
          {error && <div className="card notice bad">{error}</div>}
          {!result && !error && backendOk !== false && (
            <div className="card notice">Upload an image and press <b>Analyse image</b> to see the results.</div>
          )}
          {result && (
            <>
              <ValidationCard v={result.validation} />
              {result.region
                ? <RegionCard r={result.region} />
                : <div className="card notice">Region classification skipped – only images accepted as X-rays are analysed further.</div>}
              {result.explanation && <ExplanationCard e={result.explanation} inputImage={result.input_image} />}
            </>
          )}
        </div>
      </main>

      <footer>Research prototype (SLIIT BoneVision AI, J26-IT-346) – not for clinical use.</footer>
    </div>
  );
}
