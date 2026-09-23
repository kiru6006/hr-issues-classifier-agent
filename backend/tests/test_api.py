import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.db import engine, Base
from app.scripts.seed_data import seed

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    seed()

@pytest.fixture
def client():
    with TestClient(app) as c:
        yield c

def test_health_check(client):
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "DPDP Act 2023" in data["compliance"]

def test_auth_login_employee(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "employee@company.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "employee@company.com"
    assert data["user"]["role"] == "employee"

def test_auth_login_hr_reviewer(client):
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@company.com", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["user"]["role"] == "hr_reviewer"

def test_submit_ticket_and_classification(client):
    # Login as employee
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "employee@company.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Submit ticket
    submit_payload = {
        "title": "Unexplained tax deduction and missing HRA allowance in salary slip",
        "description": "The July payslip shows TDS deduction of Rs. 18,000 without considering my submitted 80C and HRA rent receipts. Please rectify salary and reimburse the difference.",
        "submission_type": "form",
        "is_anonymous": False,
        "dpdp_consent": True
    }
    sub_res = client.post("/api/v1/tickets/submit", json=submit_payload, headers=headers)
    assert sub_res.status_code == 201
    data = sub_res.json()
    assert "ticket_id" in data
    assert data["primary_category"] == "Payroll"

    # Query status
    status_res = client.get(f"/api/v1/tickets/{data['ticket_id']}/status", headers=headers)
    assert status_res.status_code == 200
    status_data = status_res.json()
    assert status_data["classification"]["primary_category"] == "Payroll"
    assert len(status_data["timeline"]) > 0

def test_hr_review_queue_and_override(client):
    # Login as HR reviewer
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "reviewer@company.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get review queue
    queue_res = client.get("/api/v1/hr/review-queue", headers=headers)
    assert queue_res.status_code == 200
    queue_data = queue_res.json()
    assert "pending_count" in queue_data
    assert len(queue_data["tickets"]) > 0

    target_ticket_id = queue_data["tickets"][0]["ticket_id"]

    # Test override
    override_res = client.post(
        f"/api/v1/hr/classify-override/{target_ticket_id}",
        json={"primary_category": "Employee Relations", "override_reason": "Reclassifying after detailed review."},
        headers=headers
    )
    assert override_res.status_code == 200
    assert override_res.json()["classification"]["primary_category"] == "Employee Relations"
    assert override_res.json()["classification"]["classifier_override"] == True

def test_admin_sla_dashboard_and_audit(client):
    # Login as admin
    login_res = client.post(
        "/api/v1/auth/login",
        json={"email": "admin@company.com", "password": "password123"}
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # SLA Dashboard
    sla_res = client.get("/api/v1/admin/sla-dashboard", headers=headers)
    assert sla_res.status_code == 200
    sla_data = sla_res.json()
    assert "by_risk_level" in sla_data
    assert "total_open" in sla_data

    # Audit Logs
    audit_res = client.get("/api/v1/admin/audit-logs", headers=headers)
    assert audit_res.status_code == 200
    logs = audit_res.json()
    assert len(logs) > 0
