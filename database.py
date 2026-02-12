from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# --- НАСТРОЙКИ ДЛЯ MySQL (XAMPP) ---
# Если порт 3306 занят, поменяй на 3307 или тот, что в XAMPP
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://root:@localhost:3306/office_db"

# ВАЖНО: Для MySQL мы убрали connect_args={"check_same_thread": False}
# Эта строчка была нужна ТОЛЬКО для SQLite
engine = create_engine(SQLALCHEMY_DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()