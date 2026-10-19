// Talks to the FastAPI backend (forwarded by vite.config.js to http://127.0.0.1:8000)

export async function checkHealth() {
  const res = await fetch("/api/health");
  if (!res.ok) throw new Error("Backend not reachable");
  return res.json();
}

export async function analyzeImage(file) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/analyze", { method: "POST", body: form });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.detail || `Server error (${res.status})`);
  return data;
}
