from datetime import date as Date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

CATEGORIES = [
    "Food", "Transport", "Housing", "Utilities", "Shopping",
    "Health", "Entertainment", "Education", "Travel", "Other",
]


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class ExpenseBase(BaseModel):
    amount: Decimal = Field(gt=0, le=Decimal("9999999999.99"), decimal_places=2)
    category: str
    date: Date
    description: str = Field(default="", max_length=255)

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(CATEGORIES)}")
        return v

    @field_validator("description")
    @classmethod
    def strip_description(cls, v: str) -> str:
        return v.strip()


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseUpdate(ExpenseBase):
    pass


class ExpenseOut(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class CategoryTotal(BaseModel):
    category: str
    total: Decimal


class Summary(BaseModel):
    month: str
    total: Decimal
    count: int
    by_category: list[CategoryTotal]


MONTH_PATTERN = r"^\d{4}-(0[1-9]|1[0-2])$"


class BudgetBase(BaseModel):
    category: str
    month: str = Field(pattern=MONTH_PATTERN)
    limit_amount: Decimal = Field(gt=0, le=Decimal("9999999999.99"), decimal_places=2)

    @field_validator("category")
    @classmethod
    def valid_category(cls, v: str) -> str:
        if v not in CATEGORIES:
            raise ValueError(f"category must be one of: {', '.join(CATEGORIES)}")
        return v


class BudgetCreate(BudgetBase):
    pass


class BudgetUpdate(BudgetBase):
    pass


class BudgetOut(BudgetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int


class BudgetStatus(BudgetOut):
    spent: Decimal
    remaining: Decimal
    percent_used: float
    state: str  # ok | warning | over


class FDBase(BaseModel):
    bank_name: str = Field(min_length=1, max_length=100)
    principal: Decimal = Field(gt=0, le=Decimal("999999999999.99"), decimal_places=2)
    interest_rate: Decimal = Field(gt=0, le=30, decimal_places=2)
    start_date: Date
    tenure_months: int = Field(ge=1, le=120)
    compounding_per_year: int = 4

    @field_validator("bank_name")
    @classmethod
    def strip_bank(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("bank_name must not be blank")
        return v

    @field_validator("compounding_per_year")
    @classmethod
    def valid_compounding(cls, v: int) -> int:
        if v not in (1, 2, 4, 12):
            raise ValueError("compounding_per_year must be 1, 2, 4 or 12")
        return v


class FDCreate(FDBase):
    pass


class FDUpdate(FDBase):
    pass


class FDOut(FDBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    maturity_amount: Decimal
    interest_earned: Decimal
    maturity_date: Date
    days_remaining: int
    status: str  # active | matured


INVESTMENT_TYPES = ["Stocks", "Mutual Funds", "Gold", "Crypto", "Other"]


class InvestmentBase(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    type: str
    amount_invested: Decimal = Field(gt=0, le=Decimal("999999999999.99"), decimal_places=2)
    current_value: Decimal = Field(ge=0, le=Decimal("999999999999.99"), decimal_places=2)
    purchase_date: Date

    @field_validator("name")
    @classmethod
    def strip_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("name must not be blank")
        return v

    @field_validator("type")
    @classmethod
    def valid_type(cls, v: str) -> str:
        if v not in INVESTMENT_TYPES:
            raise ValueError(f"type must be one of: {', '.join(INVESTMENT_TYPES)}")
        return v


class InvestmentCreate(InvestmentBase):
    pass


class InvestmentUpdate(InvestmentBase):
    pass


class InvestmentOut(InvestmentBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    gain: Decimal
    gain_percent: float


class MonthTotal(BaseModel):
    month: str
    total: Decimal
    count: int


class BudgetAdherence(BaseModel):
    total: int
    kept: int
    exceeded: int


class InvestmentTotals(BaseModel):
    count: int
    invested: Decimal
    current_value: Decimal
    gain: Decimal


class FDTotals(BaseModel):
    count: int
    active: int
    principal: Decimal
    maturity_amount: Decimal


class ReportOverview(BaseModel):
    months: int
    start_month: str
    end_month: str
    total_spent: Decimal
    monthly: list[MonthTotal]
    by_category: list[CategoryTotal]
    budgets: BudgetAdherence
    investments: InvestmentTotals
    fixed_deposits: FDTotals
