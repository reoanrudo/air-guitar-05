from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class ScoreSubmit(BaseModel):
    player_id: str = Field(..., min_length=1, max_length=50)
    score: int = Field(..., ge=0)
    max_combo: int = Field(..., ge=0)
    perfect_count: int = Field(..., ge=0)
    great_count: int = Field(..., ge=0)
    miss_count: int = Field(..., ge=0)


class PlayHistorySubmit(BaseModel):
    player_id: str = Field(..., min_length=1, max_length=50)
    score: int = Field(..., ge=0)
    max_combo: int = Field(..., ge=0)
    duration_seconds: float = Field(..., ge=0)


class ScoreResponse(BaseModel):
    id: int
    player_id: str
    score: int
    max_combo: int
    perfect_count: int
    great_count: int
    miss_count: int
    played_at: datetime

    class Config:
        from_attributes = True


class PlayHistoryResponse(BaseModel):
    id: int
    player_id: str
    score: int
    max_combo: int
    duration_seconds: float
    played_at: datetime

    class Config:
        from_attributes = True


class LeaderboardResponse(BaseModel):
    rank: int
    player_id: str
    score: int
    max_combo: int
    played_at: datetime


class StatsResponse(BaseModel):
    total_plays: int
    total_score: int
    average_score: float
    best_score: int
    best_combo: int
    perfect_rate: float
