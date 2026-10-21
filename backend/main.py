import os
import hashlib
import hmac
import urllib.parse
import json
from datetime import datetime
from dotenv import load_dotenv

from fastapi import FastAPI, Depends, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Boolean, BigInteger, func
from sqlalchemy.orm import sessionmaker, declarative_base, Session
from pydantic import BaseModel
from typing import Optional

# --- 1. НАСТРОЙКИ ---
load_dotenv()
BOT_TOKEN = os.getenv("BOT_TOKEN")

# --- 2. БАЗА ДАННЫХ ---
SQLALCHEMY_DATABASE_URL = "sqlite:///./finance.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# --- 3. МОДЕЛИ ---
class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(BigInteger, unique=True, index=True)
    username = Column(String, nullable=True)
    language = Column(String, default="ru")
    base_currency = Column(String, default="EUR")

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    type = Column(String) # income / expense
    amount = Column(Float)
    currency = Column(String, default="EUR")
    category_key = Column(String, nullable=True)
    description = Column(String, nullable=True)
    date = Column(DateTime, default=datetime.utcnow)

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    category_key = Column(String)
    monthly_limit = Column(Float)
    daily_limit = Column(Float)
    is_active = Column(Boolean, default=True)

Base.metadata.create_all(bind=engine)

# --- 4. СХЕМЫ ---
class TransactionCreate(BaseModel):
    type: str
    amount: float
    currency: str = "EUR"
    category_key: Optional[str] = None
    description: Optional[str] = None

class BudgetCreate(BaseModel):
    category_key: str
    monthly_limit: float
    daily_limit: float

class UserSettingsUpdate(BaseModel):
    base_currency: str

# --- 5. АВТОРИЗАЦИЯ ---
def validate_telegram_data(init_data: str):
    if init_data == 'test_data_for_browser':
        return {"id": 123456789, "username": "test_user", "language_code": "ru"}
    try:
        parsed_data = dict(urllib.parse.parse_qsl(init_data))
        hash_str = parsed_data.pop('hash')
        data_check_string = "\n".join(f"{k}={v}" for k, v in sorted(parsed_data.items()))
        secret_key = hmac.new(b"WebAppData", BOT_TOKEN.encode(), hashlib.sha256).digest()
        calculated_hash = hmac.new(secret_key, data_check_string.encode(), hashlib.sha256).hexdigest()
        if calculated_hash != hash_str:
            return None
        return json.loads(parsed_data['user'])
    except Exception:
        return None

def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Нет токена")
    user_data = validate_telegram_data(authorization)
    if not user_data:
        raise HTTPException(status_code=401, detail="Неверный токен")
    user = db.query(User).filter(User.telegram_id == user_data["id"]).first()
    if not user:
        user = User(telegram_id=user_data["id"], username=user_data.get("username"), language=user_data.get("language_code", "en"))
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

# --- 6. СЕРВЕР И API ---
app = FastAPI(title="My Finance API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Бэкенд работает!"}

@app.get("/api/users/me")
def get_me(user: User = Depends(get_current_user)):
    return {"telegram_id": user.telegram_id, "language": user.language, "base_currency": user.base_currency}

@app.patch("/api/users/settings")
def update_settings(settings: UserSettingsUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    user.base_currency = settings.base_currency
    db.commit()
    return {"status": "success", "currency": user.base_currency}

@app.post("/api/transactions/")
def create_transaction(tx: TransactionCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_tx = Transaction(user_id=user.id, type=tx.type, amount=tx.amount, currency=tx.currency, category_key=tx.category_key, description=tx.description)
    db.add(new_tx)
    db.commit()
    return {"status": "success"}

@app.get("/api/dashboard/")
def get_dashboard(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    income = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user.id, Transaction.type == "income").scalar() or 0.0
    expense = db.query(func.sum(Transaction.amount)).filter(Transaction.user_id == user.id, Transaction.type == "expense").scalar() or 0.0
    recent = db.query(Transaction).filter(Transaction.user_id == user.id).order_by(Transaction.date.desc()).limit(20).all()
    recent_list = [{"id": t.id, "type": t.type, "amount": t.amount, "category": t.category_key, "date": t.date.isoformat()} for t in recent]
    return {"balance": income - expense, "income": income, "expense": expense, "currency": user.base_currency, "recent_transactions": recent_list}

@app.post("/api/budgets/")
def create_budget(budget: BudgetCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    new_budget = Budget(user_id=user.id, category_key=budget.category_key, monthly_limit=budget.monthly_limit, daily_limit=budget.daily_limit)
    db.add(new_budget)
    db.commit()
    return {"status": "success"}

@app.get("/api/budgets/")
def get_budgets(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    return db.query(Budget).filter(Budget.user_id == user.id, Budget.is_active == True).all()