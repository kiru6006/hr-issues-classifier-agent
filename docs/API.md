# HR AI Problem Classification & Triage System - REST API Specification

**Base URL**: `http://localhost:8000/api/v1`  
**Authentication**: JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 1. Authentication Endpoints

### `POST /auth/register`
Register a new user account.
- **Request Body**:
```json
{
  "email": "user@company.com",
  "password": "password123",
  "role": "employee",
  "department": "Engineering",
  "team": "Backend",
  "consent_to_store": true
}
```

### `POST /auth/login`
Authenticate user credentials and receive JWT bearer token.
- **Request Body**:
```json
{
  "email": "employee@company.com",
  "password": "password123",
  "consent_to_store": true
}
```
- **Response (200 OK)**:
```json
{
  "access_token": "eyJhbGciOi...",
  "token_type": "bearer",
  "user": {
    "id": "4b68e998-21d3-4929-873b-b6d393608ca4",
    "email": "employee@company.com",
    "role": "employee",
    "department": "Engineering"
  }
}
```

---

## 2. Employee Grievance Endpoints

### `POST /tickets/submit`
Submit a new employee grievance. Automatically executes zero-shot AI classification, risk analysis, and SLA timer.
- **Request Body**:
```json
{
  "title": "Hospital mediclaim cashless claim rejected for surgery",
  "description": "The group health insurance provider denied pre-auth cashless cover at Apollo Hospital stating dependency limit.",
  "submission_type": "form",
  "is_anonymous": false,
  "attachments": [],
  "dpdp_consent": true
}
```
- **Response (201 Created)**:
```json
{
  "ticket_id": "8c352945-8b38-4221-a570-5bcfd658c89a",
  "status": "classified",
  "risk_level": "low",
  "confirmation_message": "Your grievance ticket #8c352945 has been received. Expected initial triage: within 336 hours under SLA.",
  "primary_category": "Benefits & Insurance",
  "requires_manual_review": false
}
```

### `GET /tickets/{ticket_id}/status`
Query grievance lifecycle, AI confidence scores, assigned team, and timeline.

### `POST /tickets/{ticket_id}/confirm-resolution`
Employee resolution confirmation & feedback loop (Use Case 13).
- **Request Body**:
```json
{
  "resolved": true,
  "feedback_score": 5,
  "feedback_text": "HR resolved the insurance claim quickly with the TPA."
}
```

### `GET /tickets/{ticket_id}/export-pdf`
DPDP Right to Access - Generates a statutory compliance PDF report for the grievance.

---

## 3. HR Operations Endpoints

### `GET /hr/review-queue`
Retrieve triage review queue filtered by risk level, category, and status.

### `POST /hr/classify-override/{ticket_id}`
Manual classification override with mandatory immutable audit reason (Use Case 7).
- **Request Body**:
```json
{
  "primary_category": "Harassment & Bullying",
  "override_reason": "Reclassifying after discovering PoSH related evidence in email trail."
}
```

### `POST /hr/route/{ticket_id}`
Assign ticket to target HR team (Use Case 8).
- **Request Body**:
```json
{
  "assigned_to_team": "legal",
  "routing_reason": "PoSH case assigned to Legal Counsel."
}
```

### `POST /hr/resolve/{ticket_id}`
Resolve ticket and record encrypted resolution notes (Use Case 13).

---

## 4. Admin & Compliance Endpoints

### `GET /admin/patterns`
Query systemic pattern clusters detected by pgvector cosine clustering.

### `POST /admin/patterns/trigger-detection`
Trigger batch clustering across sliding 7-day window.

### `GET /admin/sla-dashboard`
Executive SLA metrics breakdown by risk level and escalation queues.

### `GET /admin/audit-logs`
Query immutable audit ledger.

### `GET /admin/audit-logs/export-csv`
Export full audit ledger to CSV for statutory regulatory audits.

### `POST /admin/data-management/anonymize`
DPDP Right to be Forgotten (Section 12) - Anonymize resolved grievance records.
