from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy import extract, func, select
from sqlalchemy.orm import Session

from . import schemas
from .auth import get_current_user
from .database import get_db
from .fixed_deposits import to_out as fd_out
from .models import Budget, Expense, FixedDeposit, Investment, User

router = APIRouter(prefix="/api/reports", tags=["reports"])


def _month_keys(count: int) -> list[str]:
    """The last `count` months ending at the current month, oldest first."""
    today = date.today()
    idx = today.year * 12 + today.month - 1
    return [f"{(i // 12):04d}-{(i % 12) + 1:02d}" for i in range(idx - count + 1, idx + 1)]


@router.get("/overview", response_model=schemas.ReportOverview)
def overview(
    months: int = Query(default=6, ge=1, le=24),
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    keys = _month_keys(months)
    start = date(int(keys[0][:4]), int(keys[0][5:]), 1)

    year, mon = extract("year", Expense.date), extract("month", Expense.date)

    # Spending per month (months with no spending are still returned, as zero)
    per_month = {
        f"{int(y):04d}-{int(m):02d}": (total, count)
        for y, m, total, count in db.execute(
            select(year, mon, func.sum(Expense.amount), func.count())
            .where(Expense.user_id == user.id, Expense.date >= start)
            .group_by(year, mon)
        ).all()
    }
    monthly = [
        schemas.MonthTotal(month=k, total=per_month.get(k, (Decimal("0"), 0))[0], count=per_month.get(k, (0, 0))[1])
        for k in keys
    ]

    by_category = [
        schemas.CategoryTotal(category=c, total=t)
        for c, t in db.execute(
            select(Expense.category, func.sum(Expense.amount))
            .where(Expense.user_id == user.id, Expense.date >= start)
            .group_by(Expense.category)
            .order_by(func.sum(Expense.amount).desc())
        ).all()
    ]

    # Budget adherence: a budget is "kept" when actual spend <= its limit
    budgets = db.scalars(select(Budget).where(Budget.user_id == user.id, Budget.month.in_(keys))).all()
    spent = {
        (c, f"{int(y):04d}-{int(m):02d}"): t
        for c, y, m, t in db.execute(
            select(Expense.category, year, mon, func.sum(Expense.amount))
            .where(Expense.user_id == user.id, Expense.date >= start)
            .group_by(Expense.category, year, mon)
        ).all()
    }
    exceeded = sum(1 for b in budgets if spent.get((b.category, b.month), Decimal("0")) > b.limit_amount)

    invs = db.scalars(select(Investment).where(Investment.user_id == user.id)).all()
    invested = sum((i.amount_invested for i in invs), Decimal("0"))
    current = sum((i.current_value for i in invs), Decimal("0"))

    fds = [fd_out(f) for f in db.scalars(select(FixedDeposit).where(FixedDeposit.user_id == user.id)).all()]

    return schemas.ReportOverview(
        months=months,
        start_month=keys[0],
        end_month=keys[-1],
        total_spent=sum((m.total for m in monthly), Decimal("0")),
        monthly=monthly,
        by_category=by_category,
        budgets=schemas.BudgetAdherence(total=len(budgets), kept=len(budgets) - exceeded, exceeded=exceeded),
        investments=schemas.InvestmentTotals(count=len(invs), invested=invested, current_value=current, gain=current - invested),
        fixed_deposits=schemas.FDTotals(
            count=len(fds),
            active=sum(1 for f in fds if f.status == "active"),
            principal=sum((f.principal for f in fds), Decimal("0")),
            maturity_amount=sum((f.maturity_amount for f in fds), Decimal("0")),
        ),
    )
