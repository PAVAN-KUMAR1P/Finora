from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import schemas
from .auth import get_current_user
from .database import get_db
from .models import Investment, User

router = APIRouter(prefix="/api/investments", tags=["investments"])


def to_out(inv: Investment) -> schemas.InvestmentOut:
    gain = inv.current_value - inv.amount_invested
    return schemas.InvestmentOut(
        id=inv.id,
        name=inv.name,
        type=inv.type,
        amount_invested=inv.amount_invested,
        current_value=inv.current_value,
        purchase_date=inv.purchase_date,
        gain=gain,
        gain_percent=round(float(gain / inv.amount_invested * 100), 2),
    )


def _owned(inv_id: int, user: User, db: Session) -> Investment:
    inv = db.scalar(select(Investment).where(Investment.id == inv_id, Investment.user_id == user.id))
    if inv is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Investment not found")
    return inv


@router.get("/types")
def types():
    return schemas.INVESTMENT_TYPES


@router.get("", response_model=list[schemas.InvestmentOut])
def list_investments(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rows = db.scalars(
        select(Investment).where(Investment.user_id == user.id).order_by(Investment.purchase_date.desc(), Investment.id.desc())
    ).all()
    return [to_out(i) for i in rows]


@router.post("", response_model=schemas.InvestmentOut, status_code=status.HTTP_201_CREATED)
def create_investment(data: schemas.InvestmentCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    inv = Investment(user_id=user.id, **data.model_dump())
    db.add(inv)
    db.commit()
    db.refresh(inv)
    return to_out(inv)


@router.put("/{inv_id}", response_model=schemas.InvestmentOut)
def update_investment(
    inv_id: int, data: schemas.InvestmentUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)
):
    inv = _owned(inv_id, user, db)
    for field, value in data.model_dump().items():
        setattr(inv, field, value)
    db.commit()
    db.refresh(inv)
    return to_out(inv)


@router.delete("/{inv_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_investment(inv_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_owned(inv_id, user, db))
    db.commit()
