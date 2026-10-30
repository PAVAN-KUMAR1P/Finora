from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import extract, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import schemas
from .auth import get_current_user
from .database import get_db
from .models import Budget, Expense, User

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


def _owned(budget_id: int, user: User, db: Session) -> Budget:
    budget = db.scalar(select(Budget).where(Budget.id == budget_id, Budget.user_id == user.id))
    if budget is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Budget not found")
    return budget


def _state(percent: float) -> str:
    if percent > 100:
        return "over"
    return "warning" if percent >= 80 else "ok"


@router.get("/status", response_model=list[schemas.BudgetStatus])
def budget_status(
    month: str = Query(pattern=schemas.MONTH_PATTERN),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budgets = db.scalars(
        select(Budget).where(Budget.user_id == user.id, Budget.month == month).order_by(Budget.category)
    ).all()
    year, mon = map(int, month.split("-"))
    spent_by_cat = dict(
        db.execute(
            select(Expense.category, func.sum(Expense.amount))
            .where(
                Expense.user_id == user.id,
                extract("year", Expense.date) == year,
                extract("month", Expense.date) == mon,
            )
            .group_by(Expense.category)
        ).all()
    )
    result = []
    for b in budgets:
        spent = spent_by_cat.get(b.category, Decimal("0"))
        percent = float(spent / b.limit_amount * 100)
        result.append(
            schemas.BudgetStatus(
                id=b.id,
                category=b.category,
                month=b.month,
                limit_amount=b.limit_amount,
                spent=spent,
                remaining=b.limit_amount - spent,
                percent_used=round(percent, 1),
                state=_state(percent),
            )
        )
    return result


@router.post("", response_model=schemas.BudgetOut, status_code=status.HTTP_201_CREATED)
def create_budget(data: schemas.BudgetCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budget = Budget(user_id=user.id, **data.model_dump())
    db.add(budget)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f"A {data.category} budget already exists for {data.month}")
    db.refresh(budget)
    return budget


@router.put("/{budget_id}", response_model=schemas.BudgetOut)
def update_budget(
    budget_id: int,
    data: schemas.BudgetUpdate,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    budget = _owned(budget_id, user, db)
    for field, value in data.model_dump().items():
        setattr(budget, field, value)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, f"A {data.category} budget already exists for {data.month}")
    db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_budget(budget_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_owned(budget_id, user, db))
    db.commit()
