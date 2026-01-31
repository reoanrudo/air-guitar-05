from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

from database import engine, get_db, init_db, Score, PlayHistory
from schemas import (
    ScoreSubmit,
    ScoreResponse,
    PlayHistorySubmit,
    PlayHistoryResponse,
    LeaderboardResponse,
    StatsResponse,
)

app = FastAPI(title="Air Guitar Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def startup_event():
    init_db()


@app.post("/api/scores", response_model=ScoreResponse)
def submit_score(score: ScoreSubmit, db: Session = Depends(get_db)):
    db_score = Score(**score.model_dump())
    db.add(db_score)
    db.commit()
    db.refresh(db_score)
    return db_score


@app.post("/api/history", response_model=PlayHistoryResponse)
def submit_history(history: PlayHistorySubmit, db: Session = Depends(get_db)):
    db_history = PlayHistory(**history.model_dump())
    db.add(db_history)
    db.commit()
    db.refresh(db_history)
    return db_history


@app.get("/api/leaderboard", response_model=List[LeaderboardResponse])
def get_leaderboard(
    limit: int = Query(10, ge=1, le=100), db: Session = Depends(get_db)
):
    scores = db.query(Score).order_by(Score.score.desc()).limit(limit).all()
    return [
        LeaderboardResponse(
            rank=i + 1,
            player_id=s.player_id,
            score=s.score,
            max_combo=s.max_combo,
            played_at=s.played_at,
        )
        for i, s in enumerate(scores)
    ]


@app.get("/api/history/{player_id}", response_model=List[PlayHistoryResponse])
def get_player_history(
    player_id: str, limit: int = Query(20, ge=1, le=100), db: Session = Depends(get_db)
):
    histories = (
        db.query(PlayHistory)
        .filter(PlayHistory.player_id == player_id)
        .order_by(PlayHistory.played_at.desc())
        .limit(limit)
        .all()
    )
    return histories


@app.get("/api/stats/{player_id}", response_model=StatsResponse)
def get_player_stats(player_id: str, db: Session = Depends(get_db)):
    scores = db.query(Score).filter(Score.player_id == player_id).all()
    histories = db.query(PlayHistory).filter(PlayHistory.player_id == player_id).all()

    if not scores:
        return StatsResponse(
            total_plays=0,
            total_score=0,
            average_score=0,
            best_score=0,
            best_combo=0,
            perfect_rate=0.0,
        )

    total_plays = len(histories)
    total_score = sum(s.score for s in scores)
    best_score = max(s.score for s in scores)
    best_combo = max(s.max_combo for s in scores)

    total_hits = sum(s.perfect_count + s.great_count + s.miss_count for s in scores)
    perfect_hits = sum(s.perfect_count for s in scores)
    perfect_rate = (perfect_hits / total_hits * 100) if total_hits > 0 else 0.0

    average_score = total_score / len(scores) if scores else 0

    return StatsResponse(
        total_plays=total_plays,
        total_score=total_score,
        average_score=round(average_score, 2),
        best_score=best_score,
        best_combo=best_combo,
        perfect_rate=round(perfect_rate, 2),
    )


@app.get("/")
def read_root():
    return {"message": "Air Guitar Backend API", "version": "1.0.0"}
