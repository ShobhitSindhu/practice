from datetime import date

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, schemas
from .chat import chat_with_db
from .database import Base, engine, get_db
from .seed import seed_database

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Copilot Usage Dashboard API",
    description="Track and visualize GitHub Copilot usage across your organization",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    db = next(get_db())
    try:
        seed_database(db)
    finally:
        db.close()


# ── Dashboard ─────────────────────────────────────────────────────────────────
@app.get("/api/dashboard", response_model=schemas.DashboardOverview)
def dashboard_overview(db: Session = Depends(get_db)):
    return crud.get_dashboard_overview(db)


# ── Employees ─────────────────────────────────────────────────────────────────
@app.get("/api/employees", response_model=list[schemas.EmployeeResponse])
def list_employees(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return crud.get_employees(db, skip=skip, limit=limit)


@app.get("/api/employees/{employee_id}", response_model=schemas.EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    emp = crud.get_employee(db, employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return emp


@app.post("/api/employees", response_model=schemas.EmployeeResponse, status_code=201)
def create_employee(emp: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    return crud.create_employee(db, emp)


@app.put("/api/employees/{employee_id}", response_model=schemas.EmployeeResponse)
def update_employee(
    employee_id: int, emp: schemas.EmployeeUpdate, db: Session = Depends(get_db)
):
    updated = crud.update_employee(db, employee_id, emp)
    if not updated:
        raise HTTPException(status_code=404, detail="Employee not found")
    return updated


@app.delete("/api/employees/{employee_id}")
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    if not crud.delete_employee(db, employee_id):
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"detail": "Employee deleted"}


# ── Usage Records ─────────────────────────────────────────────────────────────
@app.get("/api/usage", response_model=list[schemas.UsageResponse])
def list_usage(
    employee_id: int | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    skip: int = 0,
    limit: int = 500,
    db: Session = Depends(get_db),
):
    return crud.get_usage_records(
        db,
        employee_id=employee_id,
        start_date=start_date,
        end_date=end_date,
        skip=skip,
        limit=limit,
    )


@app.post("/api/usage", response_model=schemas.UsageResponse, status_code=201)
def create_usage(usage: schemas.UsageCreate, db: Session = Depends(get_db)):
    emp = crud.get_employee(db, usage.employee_id)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    return crud.create_usage(db, usage)


@app.delete("/api/usage/{usage_id}")
def delete_usage(usage_id: int, db: Session = Depends(get_db)):
    if not crud.delete_usage(db, usage_id):
        raise HTTPException(status_code=404, detail="Usage record not found")
    return {"detail": "Usage record deleted"}


# ── Chat with DB ──────────────────────────────────────────────────────────────
@app.post("/api/chat", response_model=schemas.ChatResponse)
def chat_endpoint(req: schemas.ChatRequest, db: Session = Depends(get_db)):
    history = [{"role": m.role, "content": m.content} for m in req.history]
    result = chat_with_db(req.question, db, conversation_history=history)
    return result


# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok"}
