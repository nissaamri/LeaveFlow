from fastapi import FastAPI
from app.routes.departments import router as departments_router
from app.routes.leave_types import router as leave_types_router
from app.routes.employees import router as employees_router
from app.routes.leave_applications import router as leave_applications_router
from app.routes.leave_balances import router as leave_balances_router
from app.routes.approvals import router as approvals_router

app = FastAPI(
    title="LeaveFlow API",
    description="Employee Leave and Workforce Management System",
    version="1.0.0"
)
app.include_router(departments_router)
app.include_router(leave_types_router)
app.include_router(employees_router)
app.include_router(leave_applications_router)
app.include_router(leave_balances_router)
app.include_router(approvals_router)

@app.get("/")
def home():
    return {
        "message": "Welcome to LeaveFlow API!",
        "status": "running"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }