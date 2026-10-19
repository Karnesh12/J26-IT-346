"""FastAPI server for BoneVision Component 1.

Run from the backend folder:   uvicorn app.main:app --reload --port 8000
Then open http://localhost:8000/docs to try the API in the browser.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .config import CORS_ORIGINS
from .models import ModelRegistry
from .pipeline import Pipeline

state = {}
MAX_UPLOAD_MB = 20


@asynccontextmanager
async def lifespan(app: FastAPI):
    registry = ModelRegistry()                       # load all 4 models once, at start-up
    state["registry"] = registry
    state["pipeline"] = Pipeline(registry)
    print("Models loaded:", registry.summary())
    yield
    state.clear()


app = FastAPI(title="BoneVision AI - Component 1", version="1.0",
              description="X-ray validation (Model 1) and anatomical region classification (Model 2)",
              lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.get("/api/health")
def health():
    return {"status": "ok", **state["registry"].summary()}


@app.post("/api/analyze")
def analyze(file: UploadFile = File(...)):              # plain def: FastAPI runs it in a worker thread
    data = file.file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Empty file.")
    if len(data) > MAX_UPLOAD_MB * 1024 * 1024:
        raise HTTPException(status_code=413, detail=f"File larger than {MAX_UPLOAD_MB} MB.")
    try:
        result = state["pipeline"].analyze(data)
    except Exception as e:                           # e.g. not an image file
        raise HTTPException(status_code=400, detail=f"Could not process this file: {e}")
    result["filename"] = file.filename
    return result
