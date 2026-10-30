from contextlib import asynccontextmanager
from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from . import budgets, fixed_deposits, investments, reports, schemas
from .auth import create_access_token, get_current_user, hash_password, verify_password
from .config import CORS_ORIGINS
from .database import Base, engine, get_db
from .models import Expense, User


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create tables on startup (MVP stand-in for migrations)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Finance Tracker API", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["Authorization", "Content-Type"],
)


app.include_router(budgets.router)
app.include_router(fixed_deposits.router)
app.include_router(investments.router)
app.include_router(reports.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}


# ---------- Auth ----------

@app.post("/api/auth/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register(data: schemas.UserCreate, db: Session = Depends(get_db)):
    email = data.email.lower()
    if db.scalar(select(User).where(User.email == email)):
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    user = User(email=email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    return user


@app.post("/api/auth/login", response_model=schemas.Token)
def login(data: schemas.UserCreate, db: Session = Depends(get_db)):
    user = db.scalar(select(User).where(User.email == data.email.lower()))
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Incorrect email or password")
    return schemas.Token(access_token=create_access_token(user.id))


@app.get("/api/auth/me", response_model=schemas.UserOut)
def me(user: User = Depends(get_current_user)):
    return user


# ---------- Expenses ----------

@app.get("/api/categories")
def categories():
    return schemas.CATEGORIES


def _get_owned_expense(expense_id: int, user: User, db: Session) -> Expense:
    expense = db.scalar(select(Expense).where(Expense.id == expense_id, Expense.user_id == user.id))
    if expense is None:
        # 404 (not 403) so we don't reveal whether another user's expense exists
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Expense not found")
    return expense


@app.get("/api/expenses", response_model=list[schemas.ExpenseOut])
def list_expenses(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    stmt = select(Expense).where(Expense.user_id == user.id)
    if month:
        year, mon = map(int, month.split("-"))
        stmt = stmt.where(extract("year", Expense.date) == year, extract("month", Expense.date) == mon)
    return db.scalars(stmt.order_by(Expense.date.desc(), Expense.id.desc())).all()


@app.post("/api/expenses", response_model=schemas.ExpenseOut, status_code=status.HTTP_201_CREATED)
def create_expense(data: schemas.ExpenseCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = Expense(user_id=user.id, **data.model_dump())
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return expense


@app.put("/api/expenses/{expense_id}", response_model=schemas.ExpenseOut)
def update_expense(
    expense_id: int,
    data: schemas.ExpenseUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    expense = _get_owned_expense(expense_id, user, db)
    for field, value in data.model_dump().items():
        setattr(expense, field, value)
    db.commit()
    db.refresh(expense)
    return expense


@app.delete("/api/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_expense(expense_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    expense = _get_owned_expense(expense_id, user, db)
    db.delete(expense)
    db.commit()


# ---------- Dashboard ----------

@app.get("/api/summary", response_model=schemas.Summary)
def summary(
    month: str | None = Query(default=None, pattern=r"^\d{4}-(0[1-9]|1[0-2])$"),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    month = month or date.today().strftime("%Y-%m")
    year, mon = map(int, month.split("-"))
    filters = (
        Expense.user_id == user.id,
        extract("year", Expense.date) == year,
        extract("month", Expense.date) == mon,
    )
    rows = db.execute(
        select(Expense.category, func.sum(Expense.amount), func.count())
        .where(*filters)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
    ).all()
    return schemas.Summary(
        month=month,
        total=sum((r[1] for r in rows), start=0),
        count=sum(r[2] for r in rows),
        by_category=[schemas.CategoryTotal(category=r[0], total=r[1]) for r in rows],
    )
