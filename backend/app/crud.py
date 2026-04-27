from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from . import models, schemas


# ── Employees ─────────────────────────────────────────────────────────────────
def get_employees(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Employee).offset(skip).limit(limit).all()


def get_employee(db: Session, employee_id: int):
    return db.query(models.Employee).filter(models.Employee.id == employee_id).first()


def create_employee(db: Session, emp: schemas.EmployeeCreate):
    db_emp = models.Employee(**emp.model_dump())
    db.add(db_emp)
    db.commit()
    db.refresh(db_emp)
    return db_emp


def update_employee(db: Session, employee_id: int, emp: schemas.EmployeeUpdate):
    db_emp = get_employee(db, employee_id)
    if not db_emp:
        return None
    for key, value in emp.model_dump(exclude_unset=True).items():
        setattr(db_emp, key, value)
    db.commit()
    db.refresh(db_emp)
    return db_emp


def delete_employee(db: Session, employee_id: int):
    db_emp = get_employee(db, employee_id)
    if not db_emp:
        return False
    db.delete(db_emp)
    db.commit()
    return True


# ── Usage Records ─────────────────────────────────────────────────────────────
def get_usage_records(
    db: Session,
    employee_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = 0,
    limit: int = 500,
):
    q = db.query(models.CopilotUsage)
    if employee_id:
        q = q.filter(models.CopilotUsage.employee_id == employee_id)
    if start_date:
        q = q.filter(models.CopilotUsage.usage_date >= start_date)
    if end_date:
        q = q.filter(models.CopilotUsage.usage_date <= end_date)
    return q.order_by(models.CopilotUsage.usage_date.desc()).offset(skip).limit(limit).all()


def create_usage(db: Session, usage: schemas.UsageCreate):
    acceptance_rate = 0.0
    if usage.suggestions_shown > 0:
        acceptance_rate = round(
            usage.suggestions_accepted / usage.suggestions_shown * 100, 2
        )
    db_usage = models.CopilotUsage(
        **usage.model_dump(), acceptance_rate=acceptance_rate
    )
    db.add(db_usage)
    db.commit()
    db.refresh(db_usage)
    return db_usage


def delete_usage(db: Session, usage_id: int):
    record = db.query(models.CopilotUsage).filter(models.CopilotUsage.id == usage_id).first()
    if not record:
        return False
    db.delete(record)
    db.commit()
    return True


# ── Dashboard aggregation ────────────────────────────────────────────────────
def get_dashboard_overview(db: Session):
    employees = db.query(models.Employee).all()
    total_employees = len(employees)
    copilot_enabled = sum(1 for e in employees if e.copilot_enabled)

    usage_records = db.query(models.CopilotUsage).all()

    total_shown = sum(r.suggestions_shown for r in usage_records)
    total_accepted = sum(r.suggestions_accepted for r in usage_records)
    total_lines = sum(r.lines_accepted for r in usage_records)
    total_minutes = sum(r.active_time_minutes for r in usage_records)
    overall_rate = round(total_accepted / total_shown * 100, 2) if total_shown else 0.0

    # Daily trends
    daily: dict[str, dict] = {}
    for r in usage_records:
        d = r.usage_date.isoformat()
        if d not in daily:
            daily[d] = {
                "date": d,
                "total_suggestions_shown": 0,
                "total_suggestions_accepted": 0,
                "total_lines_suggested": 0,
                "total_lines_accepted": 0,
                "total_active_minutes": 0,
                "_rates": [],
            }
        daily[d]["total_suggestions_shown"] += r.suggestions_shown
        daily[d]["total_suggestions_accepted"] += r.suggestions_accepted
        daily[d]["total_lines_suggested"] += r.lines_suggested
        daily[d]["total_lines_accepted"] += r.lines_accepted
        daily[d]["total_active_minutes"] += r.active_time_minutes
        daily[d]["_rates"].append(r.acceptance_rate)

    daily_trends = []
    for d in sorted(daily):
        entry = daily[d]
        rates = entry.pop("_rates")
        entry["avg_acceptance_rate"] = round(sum(rates) / len(rates), 2) if rates else 0
        daily_trends.append(schemas.DailySummary(**entry))

    # Per-employee summary
    emp_map: dict[int, dict] = {}
    for r in usage_records:
        eid = r.employee_id
        if eid not in emp_map:
            emp = next((e for e in employees if e.id == eid), None)
            emp_map[eid] = {
                "employee_id": eid,
                "employee_name": emp.name if emp else "Unknown",
                "department": emp.department if emp else "",
                "team": emp.team if emp else "",
                "total_suggestions_shown": 0,
                "total_suggestions_accepted": 0,
                "total_lines_accepted": 0,
                "total_active_minutes": 0,
                "_rates": [],
            }
        emp_map[eid]["total_suggestions_shown"] += r.suggestions_shown
        emp_map[eid]["total_suggestions_accepted"] += r.suggestions_accepted
        emp_map[eid]["total_lines_accepted"] += r.lines_accepted
        emp_map[eid]["total_active_minutes"] += r.active_time_minutes
        emp_map[eid]["_rates"].append(r.acceptance_rate)

    employee_summaries = []
    for data in emp_map.values():
        rates = data.pop("_rates")
        data["avg_acceptance_rate"] = round(sum(rates) / len(rates), 2) if rates else 0
        employee_summaries.append(schemas.EmployeeSummary(**data))

    # Language breakdown
    lang_map: dict[str, dict] = {}
    for r in usage_records:
        lang = r.language
        if lang not in lang_map:
            lang_map[lang] = {"language": lang, "total_suggestions": 0, "total_accepted": 0}
        lang_map[lang]["total_suggestions"] += r.suggestions_shown
        lang_map[lang]["total_accepted"] += r.suggestions_accepted

    language_breakdown = []
    for data in lang_map.values():
        data["acceptance_rate"] = (
            round(data["total_accepted"] / data["total_suggestions"] * 100, 2)
            if data["total_suggestions"]
            else 0
        )
        language_breakdown.append(schemas.LanguageBreakdown(**data))

    # Department summary
    dept_map: dict[str, dict] = {}
    for e in employees:
        dept = e.department
        if dept not in dept_map:
            dept_map[dept] = {
                "department": dept,
                "employee_count": 0,
                "total_suggestions_shown": 0,
                "total_suggestions_accepted": 0,
            }
        dept_map[dept]["employee_count"] += 1
    for r in usage_records:
        emp = next((e for e in employees if e.id == r.employee_id), None)
        if emp:
            dept_map[emp.department]["total_suggestions_shown"] += r.suggestions_shown
            dept_map[emp.department]["total_suggestions_accepted"] += r.suggestions_accepted

    department_summary = []
    for data in dept_map.values():
        data["avg_acceptance_rate"] = (
            round(
                data["total_suggestions_accepted"]
                / data["total_suggestions_shown"]
                * 100,
                2,
            )
            if data["total_suggestions_shown"]
            else 0
        )
        department_summary.append(schemas.DepartmentSummary(**data))

    return schemas.DashboardOverview(
        total_employees=total_employees,
        copilot_enabled_count=copilot_enabled,
        total_suggestions_shown=total_shown,
        total_suggestions_accepted=total_accepted,
        overall_acceptance_rate=overall_rate,
        total_active_hours=round(total_minutes / 60, 1),
        total_lines_accepted=total_lines,
        daily_trends=daily_trends,
        employee_summaries=employee_summaries,
        language_breakdown=language_breakdown,
        department_summary=department_summary,
    )
