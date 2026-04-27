from datetime import date, datetime

from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Employee(Base):
    __tablename__ = "employees"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    department: Mapped[str] = mapped_column(String(255), nullable=False)
    team: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(255), nullable=False)
    copilot_enabled: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow
    )

    usage_records: Mapped[list["CopilotUsage"]] = relationship(
        back_populates="employee", cascade="all, delete-orphan"
    )


class CopilotUsage(Base):
    __tablename__ = "copilot_usage"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    employee_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("employees.id"), nullable=False
    )
    usage_date: Mapped[date] = mapped_column(Date, nullable=False)
    suggestions_shown: Mapped[int] = mapped_column(Integer, default=0)
    suggestions_accepted: Mapped[int] = mapped_column(Integer, default=0)
    lines_suggested: Mapped[int] = mapped_column(Integer, default=0)
    lines_accepted: Mapped[int] = mapped_column(Integer, default=0)
    active_time_minutes: Mapped[int] = mapped_column(Integer, default=0)
    language: Mapped[str] = mapped_column(String(100), nullable=False, default="Python")
    editor: Mapped[str] = mapped_column(
        String(100), nullable=False, default="VS Code"
    )
    acceptance_rate: Mapped[float] = mapped_column(Float, default=0.0)

    employee: Mapped["Employee"] = relationship(back_populates="usage_records")
