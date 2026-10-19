import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// The React dev server runs on http://localhost:5173.
// Every request starting with /api is forwarded to the FastAPI backend on port 8000.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://127.0.0.1:8000",
    },
  },
});
