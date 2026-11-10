"""Database engine and session factory configuration."""

import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

load_dotenv()
DATABASE_URL = os.getenv('DATABASE_URL')
# ``pool_pre_ping`` detects stale connections before they are used.
engine = create_engine(DATABASE_URL, pool_pre_ping=True)
# Request handlers and scripts create short-lived sessions from this factory.
SessionLocal = sessionmaker(bind=engine)