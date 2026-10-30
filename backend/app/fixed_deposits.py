import calendar
from datetime import date
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from . import schemas
from .auth import get_current_user
from .database import get_db
from .models import FixedDeposit, User

router = APIRouter(prefix="/api/fixed-deposits", tags=["fixed-deposits"])
CENT = Decimal("0.01")


def add_months(d: date, months: int) -> date:
    idx = d.month - 1 + months
    year, month = d.year + idx // 12, idx % 12 + 1
    return date(year, month, min(d.day, calendar.monthrange(year, month)[1]))


def maturity_amount(principal: Decimal, rate_pct: Decimal, months: int, n: int) -> Decimal:
    """A = P * (1 + r/n) ** (n * t), t in years."""
    r = rate_pct / Decimal(100)
    growth = (Decimal(1) + r / n) ** (Decimal(n) * Decimal(months) / Decimal(12))
    return (principal * growth).quantize(CENT, rounding=ROUND_HALF_UP)


def to_out(fd: FixedDeposit) -> schemas.FDOut:
    amount = maturity_amount(fd.principal, fd.interest_rate, fd.tenure_months, fd.compounding_per_year)
    maturity = add_months(fd.start_date, fd.tenure_months)
    days = (maturity - date.today()).days
    return schemas.FDOut(
        id=fd.id,
        bank_name=fd.bank_name,
        principal=fd.principal,
        interest_rate=fd.interest_rate,
        start_date=fd.start_date,
        tenure_months=fd.tenure_months,
        compounding_per_year=fd.compounding_per_year,
        maturity_amount=amount,
        interest_earned=amount - fd.principal,
        maturity_date=maturity,
        days_remaining=max(days, 0),
        status="matured" if days <= 0 else "active",
    )


def _owned(fd_id: int, user: User, db: Session) -> FixedDeposit:
    fd = db.scalar(select(FixedDeposit).where(FixedDeposit.id == fd_id, FixedDeposit.user_id == user.id))
    if fd is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Fixed deposit not found")
    return fd


@router.get("", response_model=list[schemas.FDOut])
def list_fds(user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fds = db.scalars(
        select(FixedDeposit).where(FixedDeposit.user_id == user.id).order_by(FixedDeposit.start_date.desc(), FixedDeposit.id.desc())
    ).all()
    return [to_out(f) for f in fds]


@router.post("", response_model=schemas.FDOut, status_code=status.HTTP_201_CREATED)
def create_fd(data: schemas.FDCreate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fd = FixedDeposit(user_id=user.id, **data.model_dump())
    db.add(fd)
    db.commit()
    db.refresh(fd)
    return to_out(fd)


@router.put("/{fd_id}", response_model=schemas.FDOut)
def update_fd(fd_id: int, data: schemas.FDUpdate, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    fd = _owned(fd_id, user, db)
    for field, value in data.model_dump().items():
        setattr(fd, field, value)
    db.commit()
    db.refresh(fd)
    return to_out(fd)


@router.delete("/{fd_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_fd(fd_id: int, user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    db.delete(_owned(fd_id, user, db))
    db.commit()
