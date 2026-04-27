from datetime import date, datetime

from pydantic import BaseModel, EmailStr, Field


# ── Employee ──────────────────────────────────────────────────────────────────
class EmployeeBase(BaseModel):
    name: str
    email: str
    department: str
    team: str
    role: str
    copilot_enabled: bool = True


class EmployeeCreate(EmployeeBase):
    pass


class EmployeeUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    department: str | None = None
    team: str | None = None
    role: str | None = None
    copilot_enabled: bool | None = None


class EmployeeResponse(EmployeeBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Copilot Usage ────────────────────────────────────────────────────────────
class UsageBase(BaseModel):
    employee_id: int
    usage_date: date
    suggestions_shown: int = 0
    suggestions_accepted: int = 0
    lines_suggested: int = 0
    lines_accepted: int = 0
    active_time_minutes: int = 0
    language: str = "Python"
    editor: str = "VS Code"


class UsageCreate(UsageBase):
    pass


class UsageResponse(UsageBase):
    id: int
    acceptance_rate: float

    model_config = {"from_attributes": True}


class UsageWithEmployee(UsageResponse):
    employee: EmployeeResponse


# ── Dashboard / Chart DTOs ───────────────────────────────────────────────────
class DailySummary(BaseModel):
    date: str
    total_suggestions_shown: int
    total_suggestions_accepted: int
    total_lines_suggested: int
    total_lines_accepted: int
    avg_acceptance_rate: float
    total_active_minutes: int


class EmployeeSummary(BaseModel):
    employee_id: int
    employee_name: str
    department: str
    team: str
    total_suggestions_shown: int
    total_suggestions_accepted: int
    total_lines_accepted: int
    total_active_minutes: int
    avg_acceptance_rate: float


class LanguageBreakdown(BaseModel):
    language: str
    total_suggestions: int
    total_accepted: int
    acceptance_rate: float


class DepartmentSummary(BaseModel):
    department: str
    employee_count: int
    total_suggestions_shown: int
    total_suggestions_accepted: int
    avg_acceptance_rate: float


class DashboardOverview(BaseModel):
    total_employees: int
    copilot_enabled_count: int
    total_suggestions_shown: int
    total_suggestions_accepted: int
    overall_acceptance_rate: float
    total_active_hours: float
    total_lines_accepted: int
    daily_trends: list[DailySummary]
    employee_summaries: list[EmployeeSummary]
    language_breakdown: list[LanguageBreakdown]
    department_summary: list[DepartmentSummary]


# ── Chat with DB ─────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    question: str
    history: list[ChatMessage] = []


class ChatResponse(BaseModel):
    answer: str
    sql: str | None = None
    results: list[dict] | None = None
    explanation: str | None = None
    error: bool = False
