"""Populate the database with realistic sample data."""

import random
from datetime import date, timedelta

from sqlalchemy.orm import Session

from .models import CopilotUsage, Employee

DEPARTMENTS = ["Engineering", "Data Science", "DevOps", "QA", "Product"]
TEAMS = {
    "Engineering": ["Frontend", "Backend", "Platform", "Mobile"],
    "Data Science": ["ML Ops", "Analytics", "NLP"],
    "DevOps": ["Infrastructure", "SRE", "Cloud"],
    "QA": ["Automation", "Manual", "Performance"],
    "Product": ["Core", "Growth", "Enterprise"],
}
ROLES = ["Software Engineer", "Senior Engineer", "Staff Engineer", "Tech Lead", "Manager"]
LANGUAGES = ["Python", "TypeScript", "JavaScript", "Go", "Java", "Rust", "C#", "Ruby"]
EDITORS = ["VS Code", "IntelliJ IDEA", "Neovim", "JetBrains Rider", "Visual Studio"]

EMPLOYEES = [
    ("Alice Johnson", "alice.johnson@company.com"),
    ("Bob Smith", "bob.smith@company.com"),
    ("Carol Williams", "carol.williams@company.com"),
    ("David Brown", "david.brown@company.com"),
    ("Eva Martinez", "eva.martinez@company.com"),
    ("Frank Lee", "frank.lee@company.com"),
    ("Grace Kim", "grace.kim@company.com"),
    ("Henry Davis", "henry.davis@company.com"),
    ("Iris Patel", "iris.patel@company.com"),
    ("Jake Wilson", "jake.wilson@company.com"),
    ("Karen Chen", "karen.chen@company.com"),
    ("Liam Murphy", "liam.murphy@company.com"),
    ("Mia Garcia", "mia.garcia@company.com"),
    ("Noah Taylor", "noah.taylor@company.com"),
    ("Olivia Anderson", "olivia.anderson@company.com"),
    ("Paul Thomas", "paul.thomas@company.com"),
    ("Quinn Jackson", "quinn.jackson@company.com"),
    ("Rachel White", "rachel.white@company.com"),
    ("Sam Harris", "sam.harris@company.com"),
    ("Tina Martin", "tina.martin@company.com"),
]


def seed_database(db: Session) -> None:
    if db.query(Employee).count() > 0:
        return

    random.seed(42)
    employees: list[Employee] = []

    for name, email in EMPLOYEES:
        dept = random.choice(DEPARTMENTS)
        emp = Employee(
            name=name,
            email=email,
            department=dept,
            team=random.choice(TEAMS[dept]),
            role=random.choice(ROLES),
            copilot_enabled=random.random() > 0.1,
        )
        db.add(emp)
        employees.append(emp)

    db.flush()

    # Generate 90 days of usage data
    start = date.today() - timedelta(days=90)
    for emp in employees:
        if not emp.copilot_enabled:
            continue
        base_productivity = random.uniform(0.4, 0.9)
        preferred_langs = random.sample(LANGUAGES, k=random.randint(1, 3))
        editor = random.choice(EDITORS)

        for day_offset in range(91):
            current_date = start + timedelta(days=day_offset)
            if current_date.weekday() >= 5 and random.random() > 0.2:
                continue  # skip most weekends

            for lang in preferred_langs:
                if random.random() < 0.4:
                    continue
                suggestions_shown = random.randint(20, 200)
                accept_ratio = base_productivity * random.uniform(0.7, 1.3)
                accept_ratio = min(accept_ratio, 0.98)
                suggestions_accepted = int(suggestions_shown * accept_ratio)
                lines_suggested = suggestions_shown * random.randint(1, 5)
                lines_accepted = int(lines_suggested * accept_ratio * random.uniform(0.8, 1.0))
                active_minutes = random.randint(15, 180)
                acceptance_rate = round(suggestions_accepted / suggestions_shown * 100, 2)

                usage = CopilotUsage(
                    employee_id=emp.id,
                    usage_date=current_date,
                    suggestions_shown=suggestions_shown,
                    suggestions_accepted=suggestions_accepted,
                    lines_suggested=lines_suggested,
                    lines_accepted=lines_accepted,
                    active_time_minutes=active_minutes,
                    language=lang,
                    editor=editor,
                    acceptance_rate=acceptance_rate,
                )
                db.add(usage)

    db.commit()
