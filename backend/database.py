from sqlalchemy import create_engine, Column, Integer, String, DateTime, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

SQLALCHEMY_DATABASE_URL = "sqlite:///./air_guitar.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


class Score(Base):
    __tablename__ = "scores"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(String, index=True)
    score = Column(Integer)
    max_combo = Column(Integer)
    perfect_count = Column(Integer, default=0)
    great_count = Column(Integer, default=0)
    miss_count = Column(Integer, default=0)
    played_at = Column(DateTime, default=datetime.utcnow)


class PlayHistory(Base):
    __tablename__ = "play_history"

    id = Column(Integer, primary_key=True, index=True)
    player_id = Column(String, index=True)
    score = Column(Integer)
    max_combo = Column(Integer)
    duration_seconds = Column(Float)
    played_at = Column(DateTime, default=datetime.utcnow)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
