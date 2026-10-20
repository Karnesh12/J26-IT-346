"""Quick test without the web server:   python check_image.py path\\to\\image.jpg

Loads the 4 models, runs the full pipeline on one image and prints the result.
"""
import json
import sys

from app.models import ModelRegistry
from app.pipeline import Pipeline

if len(sys.argv) != 2:
    sys.exit("Usage: python check_image.py path\\to\\image.jpg")

pipe = Pipeline(ModelRegistry())
with open(sys.argv[1], "rb") as f:
    res = pipe.analyze(f.read())

v = res["validation"]
print(f"\nColour check: colourfulness = {v['colourfulness']} (reject if >= {v['thresholds']['colourful']})")
print(f"Model 1: {v['decision'].upper()}  (p_xray = {v['p_xray']:.3f}; per model {json.dumps({k: round(x, 3) for k, x in v['per_model'].items()})})")
print("         " + v["message"])
if res["region"]:
    r = res["region"]
    if r["routed"]:
        print(f"Model 2: {r['super']} ({r['super_confidence']:.1%}) - region {r['fine']} ({r['fine_confidence']:.1%})")
    else:
        print(f"Model 2: UNCERTAIN {' or '.join(r['candidates'])} - {r['route_reason']}; "
              f"ensemble leans {r['super']} ({r['super_confidence']:.1%}) - not routed, human review")
    print("         per model:", r["per_model"])
    print("Explanation:", res["explanation"]["text"])
print(f"Time: {res['time_ms']} ms")
