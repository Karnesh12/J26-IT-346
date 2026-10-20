import { useEffect, useRef, useState } from "react";
import { Check, Play, Trash, Upload } from "./Icons.jsx";

// 1. Upload X-ray: drag-and-drop or "Choose file", then a "current file" summary and the Run button.
export default function UploadPanel({ file, previewUrl, onFile, onClear, onAnalyze, loading, timeMs }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [dims, setDims] = useState(null);

  useEffect(() => {                                   // read the image size for the "current file" box
    setDims(null);
    if (!previewUrl) return;
    const img = new Image();
    img.onload = () => setDims(`${img.naturalWidth} × ${img.naturalHeight}`);
    img.src = previewUrl;
  }, [previewUrl]);

  const pick = (f) => { if (f && f.type.startsWith("image/")) onFile(f); };
  const size = file ? (file.size > 1e6 ? `${(file.size / 1e6).toFixed(1)} MB` : `${Math.round(file.size / 1e3)} KB`) : "";

  return (
    <section className="card">
      <h2 className="card-title">1. Upload X-ray</h2>
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
      >
        <Upload className="accent" />
        <p className="drop-title">Drop X-ray here</p>
        <p className="muted small">or</p>
        <button className="btn outline" onClick={() => inputRef.current.click()}>Choose file</button>
        <p className="muted small">PNG / JPG · any image can be tested</p>
        <input ref={inputRef} type="file" accept="image/*" hidden
               onChange={(e) => { pick(e.target.files[0]); e.target.value = ""; }} />
      </div>

      {file && (
        <div className="current">
          <p className="label">Current file</p>
          <div className="current-row">
            <img src={previewUrl} alt="" className="thumb" />
            <div className="current-info">
              <p className="file-name" title={file.name}>{file.name}</p>
              <p className="muted small">{size}{dims && <> · {dims}</>}</p>
              <p className="ready"><Check width="16" height="16" /> File ready</p>
            </div>
            <button className="icon-btn" title="Remove" onClick={onClear}><Trash /></button>
          </div>
        </div>
      )}

      <button className="btn primary block" disabled={!file || loading} onClick={onAnalyze}>
        <Play /> {loading ? "Running…" : "Run validation"}
      </button>
      {timeMs != null && <p className="muted small center">Processed in {timeMs} ms on CPU</p>}
    </section>
  );
}
