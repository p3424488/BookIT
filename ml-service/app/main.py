from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.recommender import hybrid_recommendations, content_based_recommendations
from app.database import get_all_events

app = FastAPI(title="BookIt ML Service", version="1.0.0")

# Allow requests from our Node.js backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── HEALTH CHECK ─────────────────────────────────────────
@app.get("/health")
def health():
    return {
        "status": "ok",
        "message": "BookIt ML Service is running!"
    }

# ─── GET RECOMMENDATIONS ──────────────────────────────────
@app.get("/recommendations/{user_id}")
def get_recommendations(user_id: str, top_n: int = 6):
    try:
        event_ids = hybrid_recommendations(user_id, top_n)
        if not event_ids:
            # Return all events if no recommendations
            all_events = get_all_events()
            event_ids = [e['id'] for e in all_events[:top_n]]

        return {
            "userId": user_id,
            "recommendations": event_ids,
            "count": len(event_ids)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ─── GET SIMILAR EVENTS ───────────────────────────────────
@app.get("/similar/{event_id}")
def get_similar_events(event_id: str, top_n: int = 4):
    try:
        all_events = get_all_events()
        if not all_events:
            return {"similar": []}

        # Find events in same category
        target_event = next(
            (e for e in all_events if e['id'] == event_id),
            None
        )

        if not target_event:
            return {"similar": []}

        similar = [
            e['id'] for e in all_events
            if e['category'] == target_event['category']
            and e['id'] != event_id
        ][:top_n]

        return {
            "eventId": event_id,
            "similar": similar,
            "count": len(similar)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))