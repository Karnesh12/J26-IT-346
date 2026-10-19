import { useRef, useState } from "react";

// Drag-and-drop or click to choose an image, with a preview.
export default function UploadPanel({ file, previewUrl, onFile, onAnalyze, loading }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);

  const pick = (f) => {
    if (f && f.type.startsWith("image/")) onFile(f);
  };

  return (
    <section className="card upload">
      <h2>1 · Upload an image</h2>
      <div
        className={`dropzone ${dragging ? "dragging" : ""}`}
        onClick={() => inputRef.current.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); pick(e.dataTransfer.files[0]); }}
      >
        {previewUrl ? (
          <img src={previewUrl} alt="Selected upload" className="preview" />
        ) : (
          <div className="dropzone-hint">
            <span className="big">⬆</span>
            <p>Drag an image here, or click to choose</p>
            <p className="muted">JPG or PNG · X-ray or any other image</p>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden
               onChange={(e) => pick(e.target.files[0])} />
      </div>
      {file && <p className="muted filename">{file.name}</p>}
      <button className="primary" disabled={!file || loading} onClick={onAnalyze}>
        {loading ? "Analysing…" : "Analyse image"}
      </button>
    </section>
  );
}
