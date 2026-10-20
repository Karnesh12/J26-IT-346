import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import ImageViewer from './components/ImageViewer';
import UploadStation from './components/UploadStation';
import FindingsDashboard from './components/FindingsDashboard';
import SampleSelectorModal from './components/SampleSelectorModal';
import ClinicalReportModal from './components/ClinicalReportModal';
import Footer from './components/Footer';
import './App.css';

const API_BASE = "http://127.0.0.1:8000";
const PREDICT_URL = `${API_BASE}/predict`;

export default function App() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [imageSize, setImageSize] = useState({ width: 1, height: 1 });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Telemetry & Backend state
  const [apiInfo, setApiInfo] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);

  // Theme state: default to 'dark' for clinical radiology suite
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('orthovue-theme') || 'dark';
  });

  // Interactive Viewport states
  const [focusedBoxIndex, setFocusedBoxIndex] = useState(null);
  const [visibleBoxes, setVisibleBoxes] = useState(new Set());

  // Modals
  const [isSampleModalOpen, setIsSampleModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Sync theme with data-theme attribute
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('orthovue-theme', theme);
  }, [theme]);

  // Ping backend API status on mount
  useEffect(() => {
    async function checkApi() {
      try {
        const res = await fetch(API_BASE, { method: "GET" });
        if (res.ok) {
          const data = await res.json();
          setApiInfo(data);
          setApiOnline(true);
        } else {
          setApiOnline(false);
        }
      } catch (err) {
        console.warn("Backend API not reachable:", err);
        setApiOnline(false);
      }
    }

    checkApi();
    const interval = setInterval(checkApi, 15000);
    return () => clearInterval(interval);
  }, []);

  // Revoke object URL when preview changes
  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // Initialize visible boxes set when new result arrives
  useEffect(() => {
    if (result?.localization_boxes) {
      const allIndices = new Set(result.localization_boxes.map((_, i) => i));
      setVisibleBoxes(allIndices);
    } else {
      setVisibleBoxes(new Set());
    }
  }, [result]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Process File Selection
  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) return;

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validTypes.includes(selectedFile.type)) {
      setError("Unsupported format. Please select a JPG, PNG, or WEBP X-ray.");
      return;
    }

    setFile(selectedFile);
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreview(objectUrl);
    setResult(null);
    setError("");

    // Calculate natural image dimensions
    const img = new Image();
    img.src = objectUrl;
    img.onload = () => {
      setImageSize({
        width: img.naturalWidth,
        height: img.naturalHeight
      });
    };
  };

  // Load a Pre-packaged Benchmark Sample
  const handleSelectSample = async (sample) => {
    setIsSampleModalOpen(false);
    setError("");
    setLoading(true);

    try {
      const response = await fetch(sample.fileUrl);
      if (!response.ok) throw new Error("Could not fetch sample radiograph.");

      const blob = await response.blob();
      const sampleFile = new File([blob], `${sample.id}.jpg`, { type: 'image/jpeg' });

      setFile(sampleFile);
      const objectUrl = URL.createObjectURL(blob);
      setPreview(objectUrl);
      setResult(null);

      // Measure dimensions
      const img = new Image();
      img.src = objectUrl;
      img.onload = async () => {
        setImageSize({
          width: img.naturalWidth,
          height: img.naturalHeight
        });

        // Automatically trigger prediction for convenience
        await executePrediction(sampleFile);
      };
    } catch (err) {
      setError(`Failed to load benchmark case: ${err.message}`);
      setLoading(false);
    }
  };

  // Execute Analysis Pipeline
  const executePrediction = async (fileToAnalyze) => {
    const targetFile = fileToAnalyze || file;
    if (!targetFile) {
      setError("Please select or drop an X-ray radiograph first.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", targetFile);

      const response = await fetch(PREDICT_URL, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Image analysis pipeline failed.");
      }

      setResult(data);
    } catch (err) {
      setError(
        err.message ||
        "Unable to connect to the backend server. Please verify FastAPI is running on port 8000."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
    setImageSize({ width: 1, height: 1 });
    setFocusedBoxIndex(null);
    setVisibleBoxes(new Set());
  };

  const toggleBoxVisibility = (index) => {
    setVisibleBoxes(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <div className="orthovue-app">
      {/* 1. TOP TELEMETRY NAVIGATION */}
      <Header
        apiInfo={apiInfo}
        apiOnline={apiOnline}
        theme={theme}
        toggleTheme={toggleTheme}
        openSamples={() => setIsSampleModalOpen(true)}
        openReport={() => setIsReportModalOpen(true)}
        hasResult={Boolean(result)}
      />

      {/* 2. MAIN WORKSTATION GRID */}
      <main className="workstation-container">
        {/* Left Column: Upload Ingestion & Control Station */}
        <aside className="workstation-sidebar">
          <UploadStation
            file={file}
            preview={preview}
            loading={loading}
            error={error}
            onFileSelect={handleFileSelect}
            onAnalyze={() => executePrediction()}
            onClear={handleClear}
            onOpenSamples={() => setIsSampleModalOpen(true)}
          />

          {/* Findings Dashboard (Rendered when results are ready) */}
          <FindingsDashboard
            result={result}
            focusedBoxIndex={focusedBoxIndex}
            setFocusedBoxIndex={setFocusedBoxIndex}
            visibleBoxes={visibleBoxes}
            toggleBoxVisibility={toggleBoxVisibility}
          />
        </aside>

        {/* Center / Right Column: Primary Radiology Viewport */}
        <section className="workstation-main">
          <ImageViewer
            previewUrl={preview}
            imageSize={imageSize}
            result={result}
            loading={loading}
            focusedBoxIndex={focusedBoxIndex}
            setFocusedBoxIndex={setFocusedBoxIndex}
            visibleBoxes={visibleBoxes}
            toggleBoxVisibility={toggleBoxVisibility}
          />
        </section>
      </main>

      {/* 3. FOOTER */}
      <Footer researchNotice={result?.research_notice} />

      {/* 4. MODALS */}
      <SampleSelectorModal
        isOpen={isSampleModalOpen}
        onClose={() => setIsSampleModalOpen(false)}
        onSelectSample={handleSelectSample}
      />

      <ClinicalReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        result={result}
        previewUrl={preview}
        fileName={file?.name}
        imageSize={imageSize}
      />
    </div>
  );
}
