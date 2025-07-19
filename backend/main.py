from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import random
import os

app = FastAPI()

# Enable CORS (Adjust origin in production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load paragraphs by difficulty
def load_paragraphs():
    data = {}
    difficulties = ["easy", "medium", "hard"]
    for diff in difficulties:
        filename = f"paragraphs_{diff}.txt"
        if os.path.exists(filename):
            with open(filename, "r", encoding="utf-8") as f:
                data[diff] = [line.strip() for line in f.readlines() if line.strip()]
        else:
            data[diff] = []
    return data

# Load paragraph files
paragraphs_by_difficulty = load_paragraphs()

# Fallback to paragraphs.txt if specific files not found
if not any(paragraphs_by_difficulty.values()):
    if os.path.exists("paragraphs.txt"):
        with open("paragraphs.txt", "r", encoding="utf-8") as f:
            fallback = [line.strip() for line in f.readlines() if line.strip()]
        for diff in ["easy", "medium", "hard"]:
            paragraphs_by_difficulty[diff] = fallback
    else:
        for diff in ["easy", "medium", "hard"]:
            paragraphs_by_difficulty[diff] = []

# Pydantic model for typing check
class SpeedCheckRequest(BaseModel):
    typed: str
    original: str
    time: float  # in seconds

# GET: Random paragraph by difficulty
@app.get("/get-paragraph")
def get_paragraph(difficulty: str = Query("easy", enum=["easy", "medium", "hard"])):
    paras = paragraphs_by_difficulty.get(difficulty, [])
    if not paras:
        return {"paragraph": f"No paragraphs available for {difficulty} difficulty."}
    return {"paragraph": random.choice(paras)}

# POST: Calculate WPM and accuracy
@app.post("/check-speed")
def check_speed(data: SpeedCheckRequest):
    typed_words = data.typed.strip().split()
    original_words = data.original.strip().split()

    correct = sum(t == o for t, o in zip(typed_words, original_words))
    total_words = len(typed_words)
    time_minutes = data.time / 60.0

    wpm = round(total_words / time_minutes) if time_minutes > 0 else 0
    accuracy = round((correct / len(original_words)) * 100) if original_words else 0

    return {
        "wpm": wpm,
        "accuracy": accuracy,
        "time": round(data.time, 2)
    }
