# HR AI Problem Classification Web Application
## Complete Specification Prompt for Full-Stack Generation

**Version:** 1.0  
**Scope:** India-first, DPDP-compliant, self-hosted LLM, 10K→1M scalable  
**Output:** Single local web application (FastAPI + React + PostgreSQL)  

---

## 📸 Application Screenshots & Visual Tour

> Complete high-resolution visual guide available in [`docs/SCREENSHOTS.md`](./docs/SCREENSHOTS.md).

| HR Review & Triage Queue | HR Analytics Command Center |
|:---:|:---:|
| ![HR Review Queue](./docs/screenshots/06_hr_review_queue.png) | ![HR Analytics](./docs/screenshots/05_hr_analytics_dashboard.png) |

| Multi-Channel Grievance Intake (Auto-Populating Categories) | Grievance Tracking & AI Confidence Timeline |
|:---:|:---:|
| ![Submission Form](./docs/screenshots/03_submit_grievance_form.png) | ![Timeline](./docs/screenshots/04_ticket_details_timeline.png) |

| Real-Time SLA Monitor & Escalations | Systemic Pattern Cluster Alerts |
|:---:|:---:|
| ![SLA Monitor](./docs/screenshots/07_sla_compliance_monitor.png) | ![Pattern Alerts](./docs/screenshots/08_systemic_pattern_alerts.png) |

---

## 1. EXECUTIVE SUMMARY & CONTEXT

### Problem
Organizations with 10K+ employees receive employee complaints/queries via email, web forms, chat, support tickets. HR manually triages these to the right team (Payroll, Benefits, L&D, Employee Relations, Legal). Manual triage is:
- Slow (48-72 hr turnaround)
- Inconsistent (same issue routed differently)
- Misses patterns (systemic problems stay hidden)
- High risk (harassment/discrimination cases delayed)

### Solution
**HR AI Problem Classifier** – AI-driven intake system that:
- Accepts submissions from multiple channels
- Auto-classifies into 13 categories with confidence scores
- Flags sensitive cases (harassment, discrimination, legal holds)
- Detects patterns (5+ similar issues = systemic alert)
- Routes intelligently to correct HR team + escalates time-sensitive cases
- Tracks resolution with employee confirmation
- Maintains full DPDP Act 2023-compliant audit trail

### Compliance Mandate
India DPDP Act 2023 requirements:
- Data minimization (collect only needed fields)
- Purpose limitation (HR use only, no ML model training on PII)
- Security (encryption at rest/transit, access controls)
- Consent & transparency (employee consent, clear data usage)
- Right to be forgotten (ticket deletion/anonymization on request)
- Immutable audit logs (who accessed what, when, why)
- No cross-border data transfer (local DB only, no external APIs)

### Success Metrics
- **Triage time:** 48 hrs → 15 min (automated)
- **Routing accuracy:** 85%+ correct team on first route
- **Pattern detection:** Identify systemic issues within 2 days
- **SLA compliance:** 95%+ time-sensitive cases resolved within SLA
- **Scalability:** 10K employees now, 1M+ later without architecture change

---

## 2. 13 USE CASES → SYSTEM REQUIREMENTS

| # | Use Case | Actor | Trigger | System Action | Outcome |
|---|----------|-------|---------|----------------|---------|
| 1 | **Employee Self-Service Submission** | Employee | Fills form / sends email / Slack msg / support ticket | Ingest, parse, deduplicate, assign ticket ID | Confirmation email to employee with ticket #, status page link |
| 2 | **AI Multi-Classification** | System | New ticket received | LLM classifies into primary + up to 2 secondary categories (zero-shot); generates confidence score + reasoning | Ticket tagged with classifications, confidence, risk level |
| 3 | **Risk Flagging** | System | Classification output | Detect keywords (harassment, discrimination, legal, safety); flag sensitive cases | High-risk cases marked for manual review, legal CC added |
| 4 | **Pattern Detection** | System | Every 6 hours (batch) | Cluster embeddings; if 5+ similar issues in 7 days, flag as systemic | Alert sent to HR leadership + team heads |
| 5 | **Anonymous/Sensitive Escalation** | System | Ticket marked anonymous or high-risk | Blind routing (manager not informed if reporting on them); legal escalation path | Case assigned to HR Lead + General Counsel; employee keeps anonymity |
| 6 | **SLA & Escalation Timers** | System | High-risk ticket created | Start SLA clock (harassment/discrimination = 24 hrs, others = 72 hrs) | Auto-alerts at 50%, 75%, 90% of SLA; escalate to VP HR at breach |
| 7 | **HR Manual Review & Override** | HR Reviewer | New classified ticket arrives | Review classification, confidence, reasoning; accept or override; add notes | Ticket moves to routed state; audit log records reviewer + override reason |
| 8 | **Predictive Routing** | System | Ticket ready for routing | Match on classification + risk + history (similar issues in past went to Team X) | Auto-route to team; notify team via email + dashboard; create Slack notification |
| 9 | **Smart Escalation Logic** | System | Routing decision | Apply rules: Low-risk + high confidence → auto-route; high-risk → manual; pattern detected → leadership review | Ticket reaches correct team within SLA |
| 10 | **Investigation & Legal Hold** | HR Lead / Counsel | High-risk ticket (harassment, discrimination, retaliation threat) | Flag for investigation; lock ticket (no employee edits); create investigation case; send legal hold notice to relevant parties | Investigation case created; audit trail active; evidence preserved |
| 11 | **Exit Interview Integration** | HR / Exit Admin | Employee terminates; exit interview captures complaint | Flag complaint as post-termination; apply different SLA (legal hold priority); don't route to manager being reported on | Case escalated to HR Lead + Counsel; investigation initiated immediately |
| 12 | **HRIS Integration (Optional)** | System | HR team receives routed ticket | Query HRIS: employee tenure, department, manager, recent perf rating, prior complaints | Context shown in HR dashboard; risk scoring adjusted (first complaint vs repeat) |
| 13 | **Resolution & Employee Confirmation** | HR Resolver / Employee | HR team resolves issue | Notify employee; employee confirms resolved or disputes; dispute reopens case | Ticket closed or reopened; resolution time tracked; satisfaction data collected |

---

## 3. SYSTEM ARCHITECTURE

### High-Level Data Flow

```
Employee Submission
    ↓
[Ingestion Layer] (Email, Form, Slack, Support Ticket)
    ↓
[Deduplication & Parsing] (Extract PII, normalize, validate)
    ↓
[LLM Classification] (Ollama: Llama 2 7B zero-shot)
    ↓
[Risk Flagging] (Keywords, severity rules, legal hold triggers)
    ↓
[Pattern Detection] (Async: embeddings → pgvector → clustering)
    ↓
[HR Review Queue] (If high-risk or low confidence)
    ↓
[Predictive Routing] (Historical + rules-based assignment)
    ↓
[HR Team Resolution] (HRIS context, SLA tracking, notification)
    ↓
[Employee Confirmation] (Close or reopen)
    ↓
[Analytics & Audit] (Immutable logs, pattern trends, SLA reports)
```

### Microservices Decomposition

```
┌─────────────────────────────────────────────────────────┐
│                  Load Balancer (Nginx)                  │
└──────────────────────┬──────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼────┐   ┌────▼────┐   ┌───▼────┐
    │ API    │   │ Worker  │   │ Admin  │
    │Service │   │Pool     │   │ Panel  │
    └────────┘   └────────┘   └────────┘
        │              │              │
        └──────────────┼──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    ┌───▼──────┐  ┌───▼────┐  ┌───▼────┐
    │PostgreSQL│  │ Redis  │  │ Ollama │
    │+ pgvector│  │(Cache) │  │(LLM)   │
    └──────────┘  └────────┘  └────────┘
```

### Service Responsibilities

| Service | Port | Responsibility | Async Jobs |
|---------|------|---|---|
| **FastAPI** | 8000 | REST API, auth, ticket CRUD, routing logic, HR dashboard | Classification, pattern detection, SLA monitoring |
| **Celery Workers** | (internal) | LLM inference, embeddings, pattern clustering, notifications | Every classification, batch pattern detection (6h), SLA escalation (hourly) |
| **Ollama** | 11434 | LLM inference (Llama 2 7B), zero-shot classification, reasoning | On-demand, ~500ms per classification |
| **PostgreSQL** | 5432 | Tickets, classifications, audit logs, user accounts, SLA rules | pgvector for embeddings, JSONB for flexible schemas |
| **Redis** | 6379 | Job queue (Celery), SLA timers, session cache, rate limiting | Pub/sub for real-time notifications |

---

## 4. DATA MODEL & DATABASE SCHEMA

### Core Tables

#### `tickets`
```sql
CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id VARCHAR(50) NOT NULL,
  submission_type ENUM('email', 'form', 'slack', 'support_ticket', 'exit_interview') DEFAULT 'form',
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  attachments JSONB, -- [{filename, url, mimetype}]
  is_anonymous BOOLEAN DEFAULT FALSE,
  status ENUM('new', 'classified', 'reviewed', 'routed', 'in_progress', 'resolved', 'reopened', 'escalated') DEFAULT 'new',
  risk_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'low',
  legal_hold BOOLEAN DEFAULT FALSE,
  is_pattern_flag BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP NULL,
  resolved_by_id UUID NULL,
  resolution_notes TEXT,
  employee_confirmation ENUM('pending', 'confirmed', 'disputed') DEFAULT 'pending',
  employee_feedback_score INT CHECK (employee_feedback_score >= 1 AND employee_feedback_score <= 5),
  
  -- Audit
  created_by_id UUID,
  data_minimized BOOLEAN DEFAULT FALSE, -- DPDP: right to be forgotten
  
  FOREIGN KEY (created_by_id) REFERENCES users(id)
);
```

#### `classifications`
```sql
CREATE TABLE classifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE,
  primary_category VARCHAR(50) NOT NULL, -- salary, benefits, policy, harassment, discrimination, etc.
  primary_confidence DECIMAL(3,2), -- 0.00-1.00
  secondary_categories JSONB, -- [{category, confidence}]
  reasoning TEXT, -- LLM explanation
  risk_keywords TEXT[], -- [harassment, retaliation, legal, safety]
  requires_manual_review BOOLEAN DEFAULT FALSE,
  classified_at TIMESTAMP DEFAULT NOW(),
  classified_by_id UUID, -- NULL if AI-only
  classifier_override BOOLEAN DEFAULT FALSE,
  override_reason TEXT,
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (classified_by_id) REFERENCES users(id)
);
```

#### `routings`
```sql
CREATE TABLE routings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  assigned_to_team VARCHAR(50) NOT NULL, -- payroll, benefits, learning, relations, legal, leadership
  assigned_to_user_id UUID,
  routing_reason VARCHAR(255),
  routing_confidence DECIMAL(3,2), -- based on historical accuracy
  predicted_resolution_time INT, -- hours
  routed_at TIMESTAMP DEFAULT NOW(),
  routed_by_id UUID,
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to_user_id) REFERENCES users(id),
  FOREIGN KEY (routed_by_id) REFERENCES users(id)
);
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action VARCHAR(100), -- 'viewed_ticket', 'classified', 'overrode', 'resolved', 'escalated'
  ticket_id UUID,
  resource_type VARCHAR(50), -- 'ticket', 'classification', 'routing'
  resource_id UUID,
  changes JSONB, -- before/after state
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

#### `patterns`
```sql
CREATE TABLE patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(50),
  issue_type VARCHAR(100),
  ticket_ids UUID[], -- cluster of similar tickets
  similarity_score DECIMAL(3,2),
  cluster_size INT,
  time_window_days INT DEFAULT 7,
  flagged_at TIMESTAMP DEFAULT NOW(),
  flagged_by VARCHAR(50), -- 'system' or user_id
  investigation_status ENUM('pending', 'investigating', 'resolved', 'closed') DEFAULT 'pending',
  investigation_notes TEXT,
  
  FOREIGN KEY (flagged_by) REFERENCES users(id) -- if not system
);
```

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('employee', 'hr_reviewer', 'hr_resolver', 'legal', 'hr_lead', 'admin') DEFAULT 'employee',
  department VARCHAR(100),
  team VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP,
  
  -- DPDP
  consent_to_store BOOLEAN DEFAULT FALSE,
  consent_timestamp TIMESTAMP
);
```

#### `embeddings` (for pattern detection)
```sql
CREATE TABLE ticket_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL UNIQUE,
  embedding vector(384), -- Sentence-Transformers output size
  created_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
  INDEX ON USING ivfflat (embedding vector_cosine_ops)
);
```

---

## 5. LLM & AI LAYER SPECIFICATION

### Ollama Configuration

**Model:** Llama 2 7B (self-hosted)  
**Inference Engine:** Ollama (local container)  
**Endpoint:** `http://localhost:11434/api/generate`

### Zero-Shot Classification Prompt

```
You are an HR problem classifier. Analyze the employee ticket and classify it into ONE primary category and up to TWO secondary categories.

CATEGORIES:
1. Salary & Compensation (base pay, increment, bonus, arrears)
2. Benefits & Insurance (health, life, pension, allowances)
3. Leave & Attendance (leave policy, sick leave, WFH policy)
4. Work Policy & Procedures (office hours, code of conduct, performance mgmt)
5. Performance & Career (review, rating, promotion, training)
6. Workplace Relations & Conduct (manager conflict, peer issues, communication)
7. Harassment & Bullying (verbal abuse, intimidation, targeted behavior)
8. Discrimination (age, gender, caste, religion, disability - per Constitution)
9. Retaliation & Victimization (punitive action for complaint, whistleblower fear)
10. Health, Safety & Welfare (workplace injury, safety violation, mental health)
11. Termination & Separation (firing, layoff, VRS, notice period)
12. Legal & Compliance (contractual issues, IP, NDA, regulatory)
13. Other (none of above)

TICKET:
Title: {title}
Description: {description}
Employee Tenure: {tenure_years} years
Department: {department}

OUTPUT (JSON):
{{
  "primary_category": "category_name",
  "primary_confidence": 0.0-1.0,
  "secondary_categories": [
    {{"category": "name", "confidence": 0.0-1.0}},
    ...
  ],
  "risk_keywords": ["keyword1", "keyword2"], // detect: harassment, discrimination, retaliation, safety, legal
  "requires_manual_review": true/false, // confidence < 0.70 or risk keywords present
  "reasoning": "Brief explanation of classification decision"
}}

INSTRUCTIONS:
- Output ONLY valid JSON, no markdown.
- Be conservative with confidence scores. 0.95+ only if clear.
- If multiple categories equally likely, list all.
- Flag any risk keywords: harassment, bullying, abuse, discrimination, retaliation, safety, injury, legal, termination, illegal.
- Reason about the intent: Is the employee asking for help, reporting a problem, or escalating a concern?
```

### Embedding & Pattern Detection

**Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dim) + `sentence-transformers/paraphrase-multilingual-mpnet-base-v2` (for Indian languages)

**Workflow:**
1. Extract ticket description (text only, no PII)
2. Generate embedding via Sentence-Transformers
3. Store in `ticket_embeddings.embedding` (pgvector)
4. Batch job (every 6 hours): query `embeddings` table for last 7 days
5. Find clusters with cosine similarity > 0.75 and count ≥ 5
6. If cluster found, create `pattern` row + alert to `patterns` table + notify HR leadership

**Clustering Query:**
```sql
WITH recent AS (
  SELECT ticket_id, embedding FROM ticket_embeddings 
  WHERE created_at > NOW() - INTERVAL '7 days'
),
similarity AS (
  SELECT 
    r1.ticket_id as ticket1_id,
    r2.ticket_id as ticket2_id,
    r1.embedding <-> r2.embedding as distance
  FROM recent r1 JOIN recent r2 ON r1.ticket_id < r2.ticket_id
  WHERE r1.embedding <-> r2.embedding < 0.25 -- high similarity
)
SELECT 
  ARRAY_AGG(DISTINCT ticket1_id || ticket2_id) as cluster,
  AVG(distance) as avg_similarity,
  COUNT(*) as cluster_size
FROM similarity
GROUP BY cluster
HAVING COUNT(*) >= 5;
```

---

## 6. API SPECIFICATION

### Base URL
`http://localhost:8000/api/v1`

### Auth
All endpoints except `/auth/*` require JWT bearer token. 
- Header: `Authorization: Bearer <token>`
- Token expires: 24 hours
- Refresh: POST `/auth/refresh`

### Endpoints

#### Employee Submission
```
POST /tickets/submit
Headers: Content-Type: application/json, Authorization: Bearer <token>
Body: {
  "title": "My salary is wrong",
  "description": "I didn't receive my bonus",
  "submission_type": "form", // or email, slack, support_ticket
  "is_anonymous": false,
  "attachments": [{"filename": "proof.pdf", "url": "s3://..."}]
}
Response (201):
{
  "ticket_id": "uuid",
  "status": "new",
  "confirmation_message": "Your ticket #UUID has been received. Expected response: 24 hours."
}
```

#### Get Ticket Status (Employee)
```
GET /tickets/{ticket_id}/status
Response (200):
{
  "ticket_id": "uuid",
  "status": "in_progress",
  "classification": {
    "primary_category": "Salary & Compensation",
    "primary_confidence": 0.92,
    "secondary_categories": []
  },
  "routed_to": "Payroll Team",
  "assigned_to": "Rajesh Sharma",
  "created_at": "2024-01-10T10:00:00Z",
  "expected_resolution": "2024-01-12T10:00:00Z",
  "status_timeline": [
    {"status": "new", "timestamp": "2024-01-10T10:00:00Z"},
    {"status": "classified", "timestamp": "2024-01-10T10:05:00Z"},
    {"status": "routed", "timestamp": "2024-01-10T10:15:00Z"}
  ]
}
```

#### Confirm Resolution (Employee)
```
POST /tickets/{ticket_id}/confirm-resolution
Body: {
  "resolved": true, // or false (dispute)
  "feedback_score": 4, // 1-5 stars
  "feedback_text": "Issue was fixed quickly"
}
Response (200):
{
  "ticket_id": "uuid",
  "status": "resolved",
  "resolved_at": "2024-01-12T15:30:00Z",
  "message": "Thank you for confirming. Your feedback helps us improve."
}
```

#### HR Reviewer Queue
```
GET /hr/review-queue
Query: ?status=pending&risk_level=high
Response (200):
{
  "pending_count": 42,
  "high_risk_count": 5,
  "overdue_sla_count": 2,
  "tickets": [
    {
      "ticket_id": "uuid",
      "employee_id": "emp_123",
      "title": "Harassment complaint",
      "status": "classified",
      "risk_level": "critical",
      "classification": {
        "primary_category": "Harassment & Bullying",
        "primary_confidence": 0.88,
        "reasoning": "Multiple instances of targeted behavior reported."
      },
      "requires_manual_review": true,
      "created_at": "2024-01-10T10:00:00Z"
    }
  ]
}
```

#### Override Classification (HR Reviewer)
```
POST /hr/classify-override/{ticket_id}
Body: {
  "primary_category": "Discrimination",
  "reasoning": "The complaint mentions caste-based harassment, not general bullying."
}
Response (200):
{
  "ticket_id": "uuid",
  "status": "reviewed",
  "classification": {...},
  "audit_log": "Reclassified by HR Reviewer ID xyz at 2024-01-10T11:00:00Z"
}
```

#### Route Ticket
```
POST /hr/route/{ticket_id}
Body: {
  "assigned_to_team": "legal",
  "assigned_to_user_id": "user_xyz",
  "routing_reason": "High-risk discrimination case requires legal review before routing to Employee Relations"
}
Response (200):
{
  "ticket_id": "uuid",
  "status": "routed",
  "routed_to_team": "legal",
  "routed_at": "2024-01-10T11:15:00Z"
}
```

#### HR Resolution
```
POST /hr/resolve/{ticket_id}
Body: {
  "resolution_notes": "Salary corrected in payroll system. Employee will receive adjusted payment in next cycle.",
  "investigation_complete": true
}
Response (200):
{
  "ticket_id": "uuid",
  "status": "resolved",
  "notification_sent": true,
  "employee_confirmation_pending": true
}
```

#### Pattern Detection (Admin/HR Lead)
```
GET /admin/patterns
Query: ?time_window_days=7&min_cluster_size=5
Response (200):
{
  "patterns": [
    {
      "pattern_id": "uuid",
      "category": "Harassment & Bullying",
      "issue_type": "Manager intimidation",
      "ticket_ids": ["uuid1", "uuid2", "uuid3", "uuid4", "uuid5"],
      "cluster_size": 5,
      "similarity_score": 0.82,
      "flagged_at": "2024-01-10T06:00:00Z",
      "investigation_status": "pending",
      "recommendation": "Escalate to HR Lead. Investigate manager (emp_id: mgr_123) for systemic bullying."
    }
  ]
}
```

#### Audit Logs (Admin/Legal)
```
GET /admin/audit-logs
Query: ?resource_type=ticket&ticket_id=uuid&limit=50
Response (200):
{
  "logs": [
    {
      "timestamp": "2024-01-10T10:00:00Z",
      "user_id": "user_xyz",
      "action": "viewed_ticket",
      "ticket_id": "uuid",
      "resource_type": "ticket",
      "ip_address": "192.168.1.100",
      "changes": {}
    },
    {
      "timestamp": "2024-01-10T10:15:00Z",
      "user_id": "user_xyz",
      "action": "classified",
      "ticket_id": "uuid",
      "changes": {"status": ["classified", "reviewed"]}
    }
  ]
}
```

#### SLA Dashboard (HR Lead)
```
GET /admin/sla-dashboard
Response (200):
{
  "sla_metrics": {
    "total_open": 127,
    "on_sla": 121,
    "at_risk": 5, // 75%+ of SLA used
    "overdue": 1,
    "average_resolution_time_hours": 24.5
  },
  "by_risk_level": {
    "critical": {"total": 3, "on_sla": 2, "overdue": 1},
    "high": {"total": 12, "on_sla": 11, "overdue": 1},
    "medium": {"total": 50, "on_sla": 50, "overdue": 0},
    "low": {"total": 62, "on_sla": 58, "overdue": 0}
  },
  "escalations_due": [
    {
      "ticket_id": "uuid",
      "time_remaining_hours": 2,
      "sla_threshold_hours": 24,
      "assigned_to": "Team X",
      "action_required": "Escalate to VP HR"
    }
  ]
}
```

---

## 7. FRONTEND SPECIFICATION

### Tech Stack
- **Framework:** React 18 + TypeScript
- **Bundler:** Vite
- **UI Components:** Material-UI (MUI) v5 or Shadcn/ui
- **State:** TanStack Query (React Query) + Zustand
- **Forms:** React Hook Form + Zod validation
- **Charts:** Recharts (for dashboard analytics)
- **Styling:** Tailwind CSS

### Page Structure

#### Public Routes (No Auth)
```
/auth/login
  ├─ Email + Password form
  ├─ Terms acceptance (DPDP consent explicit)
  └─ "Forgot Password" link
```

#### Employee Routes (`/employee/*`)
```
/employee/dashboard
  ├─ Quick stats (My Tickets: Open, Resolved, Overdue SLA)
  ├─ Latest 5 tickets with status
  └─ Submit New Ticket button

/employee/submit-ticket
  ├─ Form:
  │  ├─ Title (required)
  │  ├─ Description (textarea, required)
  │  ├─ Category (optional, pre-populated if guess)
  │  ├─ Attachments (max 5, max 10MB each)
  │  ├─ Anonymous checkbox (if enabled)
  │  └─ DPDP consent checkbox (required)
  └─ On submit: Show ticket ID + confirmation message

/employee/tickets
  ├─ List view of all submitted tickets
  ├─ Filters: Status, Created Date, Category
  └─ Click → Detail page

/employee/tickets/{ticket_id}
  ├─ Ticket details (read-only)
  ├─ Classification display (category, confidence, reasoning)
  ├─ Status timeline (New → Classified → Reviewed → Routed → In Progress → Resolved)
  ├─ Assigned HR contact (name, email, phone)
  ├─ Resolution notes (once resolved)
  └─ Confirm Resolution button (appears when status = "resolved")
```

#### HR Routes (`/hr/*`)
```
/hr/dashboard
  ├─ KPIs:
  │  ├─ Pending review count
  │  ├─ High-risk tickets
  │  ├─ Overdue SLA count
  │  └─ Avg resolution time
  ├─ Charts:
  │  ├─ Tickets by category (bar)
  │  ├─ Resolution time trend (line)
  │  └─ Risk distribution (pie)
  └─ Quick actions: Review Queue, Patterns

/hr/review-queue
  ├─ Sortable table:
  │  ├─ Ticket ID, Employee ID, Title, Status, Risk Level, Days Pending
  │  ├─ Click row → Detail page
  │  └─ Bulk actions (select multiple, mark reviewed)
  └─ Filters: Risk Level, Status, Category, Assigned To

/hr/classify/{ticket_id}
  ├─ Display:
  │  ├─ Ticket details (title, description, employee metadata from HRIS if available)
  │  ├─ AI Classification (primary, secondary, confidence, reasoning)
  │  └─ Risk flags (if any)
  ├─ Actions:
  │  ├─ Accept classification (→ Status: reviewed)
  │  ├─ Override classification (dropdown + reason)
  │  └─ Flag for manual escalation
  └─ Audit log (view who reviewed, when)

/hr/route/{ticket_id}
  ├─ Display: Classification, current assignment
  ├─ Route decision:
  │  ├─ Suggested team (based on classification + history)
  │  ├─ Suggested assignee (based on availability + skill)
  │  ├─ Override team/assignee (dropdown)
  │  └─ Add routing reason (textarea)
  └─ Confirm → Send notification to assignee

/hr/resolve/{ticket_id}
  ├─ Display: Ticket, current assignment, resolution status
  ├─ Resolution form:
  │  ├─ Resolution notes (textarea, required)
  │  ├─ Investigation complete? (checkbox)
  │  └─ Add attachments (evidence, screenshots)
  └─ Notify employee → Status: resolved, Employee confirmation pending

/hr/tickets
  ├─ Full ticket list (team view or org-wide if lead)
  ├─ Filters: Status, Risk Level, Category, Assigned To, Date Range
  ├─ Sort: By SLA, By Risk, By Age
  └─ Click → Detail page
```

#### Admin/Leadership Routes (`/admin/*`)
```
/admin/dashboard
  ├─ Executive summary:
  │  ├─ Total tickets (open, resolved, escalated)
  │  ├─ SLA metrics (on-time %, overdue count)
  │  ├─ Avg resolution time
  │  └─ High-risk case status
  ├─ Charts:
  │  ├─ Tickets by team (bar)
  │  ├─ Resolution time by category (box plot)
  │  ├─ SLA compliance trend (line)
  │  └─ Risk trend (stacked area)
  └─ Alerts: Overdue SLA, Escalations pending, Patterns detected

/admin/patterns
  ├─ Pattern detection results:
  │  ├─ List of detected clusters (5+ similar issues)
  │  ├─ Cluster detail:
  │  │  ├─ Issue type, category, ticket IDs
  │  │  ├─ Similarity score, cluster size
  │  │  ├─ Timeline (when detected)
  │  │  └─ Recommendation (escalate, investigate)
  │  └─ Investigation status tracker
  └─ Bulk actions: Create investigation, Notify leadership

/admin/audit-logs
  ├─ Immutable log of all system actions:
  │  ├─ Timestamp, User, Action, Resource, Changes
  │  └─ IP address logged
  ├─ Filters: User, Action, Date Range, Resource Type
  └─ Export to CSV (for legal/compliance)

/admin/sla-monitor
  ├─ Real-time SLA tracker:
  │  ├─ On-SLA vs At-Risk vs Overdue breakdown
  │  ├─ By risk level (critical → overdue alert)
  │  ├─ By team (which teams are bottlenecked?)
  │  └─ Escalation queue (auto-escalate in 2 hrs if overdue)
  └─ Notifications: Red alert for overdue critical cases

/admin/settings
  ├─ Configuration:
  │  ├─ SLA rules by risk level (hours)
  │  ├─ Team assignments (category → team routing)
  │  ├─ Risk keywords (update flagging rules)
  │  └─ LLM model config (Ollama endpoint, model name)
  ├─ User management:
  │  ├─ Add/remove/deactivate users
  │  ├─ Role assignment (employee, reviewer, resolver, legal, lead, admin)
  │  └─ Team assignment
  └─ DPDP compliance:
     ├─ Data retention policy (how long to keep resolved tickets)
     ├─ Right to be forgotten: Anonymize/delete old tickets
     └─ Audit log export (for compliance audits)
```

### UI Components (Reusable)

```typescript
// TicketCard.tsx - Display ticket in list
<TicketCard ticket={ticket} onClick={() => navigate(`/hr/tickets/${ticket.id}`)} />

// ClassificationBadge.tsx - Show primary category + confidence
<ClassificationBadge category={category} confidence={0.92} />

// RiskIndicator.tsx - Color-coded risk badge
<RiskIndicator level="critical" /> // Red
<RiskIndicator level="high" />     // Orange
<RiskIndicator level="medium" />   // Yellow
<RiskIndicator level="low" />      // Green

// StatusTimeline.tsx - Show ticket status progression
<StatusTimeline statuses={[
  {status: 'new', timestamp: '2024-01-10T10:00:00Z'},
  {status: 'classified', timestamp: '2024-01-10T10:05:00Z'},
  ...
]} />

// SLATimer.tsx - Show time remaining with auto-format (2h 30m)
<SLATimer ticket={ticket} />

// ConfidenceBar.tsx - Visual confidence score (0-100%)
<ConfidenceBar score={0.92} />
```

---

## 8. DPDP ACT 2023 COMPLIANCE REQUIREMENTS

### Core Principles Implemented

#### 1. Data Minimization
- **Collect only required fields:** Ticket title, description, department, submission type
- **No collection:** Salary amount (unless directly relevant), full name (use employee_id), home address
- **Omit:** Performance ratings, health data (unless directly disclosed by employee)

#### 2. Purpose Limitation
- HR ticket triage & resolution ONLY
- Explicitly prohibited: ML model training on anonymized tickets (no "learning" from data), marketing profiling, third-party sale
- Documented: Purpose shown in consent screen at submission

#### 3. Explicit Consent
- **Mandatory consent checkbox** at ticket submission:
  ```
  "I consent to Beardman HR AI storing my ticket data for HR processing, 
  investigation, and pattern detection per DPDP Act 2023. Data will be 
  retained for 2 years post-resolution then deleted."
  ```
- **Consent timestamp logged** in `users.consent_timestamp`
- **Separate consent for anonymous submission:** "I opt to submit this anonymously. My name and direct identifiers will not be shown to HR reviewers."

#### 4. Right to Access
- Employee can view their own tickets + status
- Employee can download ticket details (PDF export)
- Endpoint: `GET /employee/tickets/{ticket_id}/export-pdf`

#### 5. Right to Erasure (Right to be Forgotten)
- Admin can anonymize or delete old tickets (> 2 years post-resolution):
  - Anonymization: Replace employee_id, redact sensitive fields, retain for audit only
  - Deletion: Soft-delete (mark `data_minimized = true`, retain audit logs for legal hold cases only)
- **Implement:** `POST /admin/data-management/anonymize` + `DELETE /admin/data-management/destroy`
- **Approval required:** Admin + Legal sign-off for critical/legal-hold cases

#### 6. Security & Encryption
- **At Rest:** PostgreSQL with encryption (use PgCrypto extension for sensitive fields)
  - Encrypt: `description`, `resolution_notes`, `reasoning` (LLM explanations may contain PII inference)
  - Key storage: Environment variable `DB_ENCRYPTION_KEY` (rotate quarterly)
- **In Transit:** TLS 1.3 for all API calls
  - HTTPS only (no HTTP)
  - Certificate pinning for mobile apps (future)
- **Access Control:** Role-based (employee → own tickets only; HR reviewer → assigned tickets; legal → legal hold cases)

#### 7. Immutable Audit Trail
- Every action logged to `audit_logs`: who, what, when, IP address, state change
- Audit logs **cannot be edited or deleted** (design: no UPDATE or DELETE on audit_logs, only INSERT)
- Retention: Permanent (never delete audit logs, they're the compliance record)
- **DPDP Rationale:** Enables accountability, supports investigations, proves compliance

#### 8. Data Processing Agreement (DPA)
- If using third-party LLM APIs: No external APIs. Ollama is self-hosted (no DPA needed).
- If HRIS integration in future: DPA required with HRIS vendor (specify in integration scope)
- **Document:** DPDP compliance policy in `/docs/DPDP_POLICY.md`

#### 9. Transparency & Disclosure
- **Privacy Notice** (shown at login + ticket submission):
  ```
  "Your ticket will be reviewed by HR to address your concern. 
  Data is encrypted, retained for 2 years post-resolution, and 
  never shared with third parties. You have the right to access, 
  correct, or delete your data. See Privacy Policy."
  ```
- **Policy link:** `/privacy-policy` (static page)

#### 10. Data Breach Protocol
- If breach detected: Notify affected employees within 72 hours
- Implement: Breach notification email template + audit trigger
- Document: Breach log in DB (incident_logs table) for regulatory reporting

### Implementation Checklist

- [ ] Consent checkbox at submission (timestamp capture)
- [ ] Encryption for sensitive fields in DB
- [ ] Immutable audit_logs table (no UPDATE/DELETE)
- [ ] Role-based access control (employee sees only own, HR sees assigned)
- [ ] Right to erasure workflow (anonymize after 2 years)
- [ ] Privacy notice on login + submission
- [ ] Data retention policy (resolve + 2 years, then delete)
- [ ] Breach notification protocol (email + audit log)
- [ ] No external API calls (Ollama local only)
- [ ] Quarterly encryption key rotation (ops task)

---

## 9. SCALABILITY & PERFORMANCE

### Load Assumptions
- **Current:** 10,000 employees
  - Avg submissions: 200/day (~2% of workforce reporting monthly)
  - Peak: 500/day (post-policy change)
  - Avg ticket lifecycle: 5 days
  - Concurrent users: HR team of 30, employees viewing tickets (peak 200 concurrent)

- **Future:** 1,000,000 employees
  - Avg submissions: 20,000/day
  - Peak: 50,000/day
  - Concurrent users: 500+ (scale HR team proportionally)

### Bottlenecks & Solutions

| Bottleneck | Current (10K) | Solution for 1M | Technology |
|---|---|---|---|
| **LLM Inference** | 500ms/ticket, 1 Ollama instance handles 120/min | Vertical scale (GPU) + load balance inference | Ollama multi-GPU or vLLM cluster |
| **Embeddings** | 50ms/ticket, pgvector queries <100ms | Dedicated embedding service, cache results | Separate FastAPI service for embeddings |
| **Database Connections** | 10 API instances, 100 pool size | Connection pooling (PgBouncer), read replicas | PgBouncer + PostgreSQL replication |
| **Async Jobs (Celery)** | 1 worker, 50 job queue size | Horizontal scale workers, increase concurrency | Kubernetes + Celery autoscaling |
| **Pattern Detection** | Batch every 6 hours, 1-2 min runtime | Reduce interval (hourly), parallelize clustering | Spark or DuckDB for distributed compute |
| **Dashboard Queries** | Real-time aggregation, <1s response | Pre-compute metrics (Materialized Views) | PostgreSQL Materialized Views + refresh job |

### Database Optimization (1M Scale)

```sql
-- Materialized view for SLA metrics (refresh every 5 minutes)
CREATE MATERIALIZED VIEW sla_metrics AS
SELECT 
  risk_level,
  COUNT(*) as total,
  SUM(CASE WHEN status IN ('new', 'classified', 'reviewed', 'routed', 'in_progress') THEN 1 ELSE 0 END) as open_count,
  SUM(CASE WHEN DATE_PART('hour', updated_at - created_at) > sla_hours THEN 1 ELSE 0 END) as overdue_count,
  AVG(EXTRACT(EPOCH FROM resolved_at - created_at) / 3600) as avg_resolution_hours
FROM tickets t
JOIN sla_rules sr ON t.risk_level = sr.risk_level
WHERE updated_at > NOW() - INTERVAL '30 days'
GROUP BY risk_level;

-- Indexes for fast queries
CREATE INDEX idx_tickets_status ON tickets(status) WHERE status IN ('new', 'classified', 'reviewed', 'routed', 'in_progress');
CREATE INDEX idx_tickets_created_at ON tickets(created_at DESC);
CREATE INDEX idx_tickets_employee_id ON tickets(employee_id);
CREATE INDEX idx_classifications_ticket_id ON classifications(ticket_id);
CREATE INDEX idx_embeddings_created_at ON ticket_embeddings(created_at DESC);
```

### Caching Strategy

- **Redis:** Cache ticket metadata (1 min TTL), user sessions (24 hr), SLA rules (1 day)
- **Invalidation:** Clear ticket cache on classification, routing, resolution
- **Embedding cache:** Cache frequently embedded terms (common phrases in tickets)

### Async Job Priorities (Celery)

```python
# High priority: Manual classification overrides, legal holds, escalations
celery.send_task('tasks.classify_ticket', args=[ticket_id], priority=10)

# Medium priority: Routing, notifications
celery.send_task('tasks.route_ticket', args=[ticket_id], priority=5)

# Low priority: Pattern detection, analytics updates
celery.send_task('tasks.detect_patterns', priority=1)
```

### Monitoring & Alerting

- **Metrics:** Ticket processing time, LLM inference latency, DB query time, queue depth
- **Tools:** Prometheus + Grafana for visualization
- **Alerts:** 
  - LLM latency >1s → scale up Ollama
  - Queue depth >1000 → scale up Celery workers
  - DB connections >80% → scale replicas
  - SLA breach → escalate immediately

---

## 10. DEPLOYMENT & LOCAL SETUP

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 18+
- Ollama (local inference)

### Folder Structure
```
hr-ai-classifier/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py (FastAPI app)
│   │   ├── config.py (settings, env vars)
│   │   ├── auth/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   └── utils.py
│   │   ├── tickets/
│   │   │   ├── routes.py
│   │   │   ├── schemas.py
│   │   │   ├── models.py
│   │   │   └── services.py
│   │   ├── classification/
│   │   │   ├── routes.py
│   │   │   ├── service.py (LLM inference)
│   │   │   ├── prompts.py
│   │   │   └── schemas.py
│   │   ├── routing/
│   │   │   ├── routes.py
│   │   │   ├── service.py
│   │   │   └── schemas.py
│   │   ├── embeddings/
│   │   │   ├── service.py (Sentence-Transformers)
│   │   │   └── models.py
│   │   ├── patterns/
│   │   │   ├── service.py (clustering)
│   │   │   └── tasks.py (Celery)
│   │   ├── hr/
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   ├── admin/
│   │   │   ├── routes.py
│   │   │   └── schemas.py
│   │   ├── database/
│   │   │   ├── db.py (SQLAlchemy setup)
│   │   │   ├── models.py (ORM models)
│   │   │   └── migrations/ (Alembic)
│   │   └── middleware/
│   │       ├── auth.py
│   │       └── audit.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   ├── pages/
│   │   │   ├── auth/
│   │   │   │   └── Login.tsx
│   │   │   ├── employee/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── SubmitTicket.tsx
│   │   │   │   ├── MyTickets.tsx
│   │   │   │   └── TicketDetail.tsx
│   │   │   ├── hr/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── ReviewQueue.tsx
│   │   │   │   ├── Classify.tsx
│   │   │   │   ├── Route.tsx
│   │   │   │   └── Resolve.tsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.tsx
│   │   │       ├── Patterns.tsx
│   │   │       ├── AuditLogs.tsx
│   │   │       └── Settings.tsx
│   │   ├── components/
│   │   │   ├── TicketCard.tsx
│   │   │   ├── ClassificationBadge.tsx
│   │   │   ├── RiskIndicator.tsx
│   │   │   ├── StatusTimeline.tsx
│   │   │   └── SLATimer.tsx
│   │   ├── services/
│   │   │   ├── api.ts (Axios client)
│   │   │   ├── auth.ts
│   │   │   └── tickets.ts
│   │   ├── store/
│   │   │   └── zustand.ts (state)
│   │   └── styles/
│   │       └── index.css (Tailwind)
│   ├── package.json
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── Dockerfile
├── docker-compose.yml
├── docs/
│   ├── API.md (OpenAPI spec)
│   ├── DPDP_POLICY.md
│   ├── DEPLOYMENT.md
│   └── DEVELOPMENT.md
└── README.md
```

### Docker Compose Setup

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: hr_ai_db
      POSTGRES_USER: hr_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "hr_admin"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    environment:
      OLLAMA_HOST: "0.0.0.0:11434"
    volumes:
      - ollama_data:/root/.ollama
    command: serve
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:11434/api/tags"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://hr_admin:${DB_PASSWORD}@postgres:5432/hr_ai_db
      REDIS_URL: redis://redis:6379
      OLLAMA_API_URL: http://ollama:11434
      JWT_SECRET: ${JWT_SECRET}
      ENVIRONMENT: development
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      ollama:
        condition: service_healthy
    volumes:
      - ./backend:/app
    command: python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

  celery_worker:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://hr_admin:${DB_PASSWORD}@postgres:5432/hr_ai_db
      REDIS_URL: redis://redis:6379
      OLLAMA_API_URL: http://ollama:11434
    depends_on:
      - postgres
      - redis
      - ollama
    volumes:
      - ./backend:/app
    command: celery -A app.tasks worker --loglevel=info --concurrency=4

  celery_beat:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://hr_admin:${DB_PASSWORD}@postgres:5432/hr_ai_db
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis
    volumes:
      - ./backend:/app
    command: celery -A app.tasks beat --loglevel=info

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    command: npm run dev

volumes:
  postgres_data:
  ollama_data:
```

### Ollama Model Download (Pre-deployment)

```bash
# Pull model before starting containers
docker pull ollama/ollama:latest
docker run --rm -v ollama_data:/root/.ollama ollama/ollama pull llama2:7b
# or
docker run --rm -v ollama_data:/root/.ollama ollama/ollama pull mistral:7b
```

### .env.example
```
# Database
DB_PASSWORD=secure_password_here
DATABASE_URL=postgresql://hr_admin:${DB_PASSWORD}@postgres:5432/hr_ai_db

# Redis
REDIS_URL=redis://redis:6379

# API
JWT_SECRET=your_jwt_secret_key_here
API_PORT=8000
API_HOST=0.0.0.0

# LLM
OLLAMA_API_URL=http://ollama:11434
LLM_MODEL=llama2:7b  # or mistral:7b

# Environment
ENVIRONMENT=development  # or production

# DPDP Compliance
DB_ENCRYPTION_KEY=your_encryption_key_here
DATA_RETENTION_DAYS=730  # 2 years

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hr@company.com
SMTP_PASSWORD=app_password_here
```

### Quick Start

```bash
# Clone repo
git clone <repo> && cd hr-ai-classifier

# Copy env
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up -d

# Run DB migrations
docker-compose exec backend alembic upgrade head

# Seed initial data (optional)
docker-compose exec backend python -m app.scripts.seed_data

# Access
# Frontend: http://localhost:5173
# API Docs: http://localhost:8000/docs
# Redis CLI: docker-compose exec redis redis-cli
# DB: psql -h localhost -U hr_admin -d hr_ai_db
```

---

## 11. IMPLEMENTATION ROADMAP (Phased)

### Phase 1: MVP (Weeks 1-4)
- [ ] Database schema + migrations
- [ ] FastAPI core (auth, ticket CRUD)
- [ ] Ollama integration (zero-shot classification)
- [ ] React frontend (login, submit, view status, HR review)
- [ ] Basic routing logic (classification → team)
- [ ] Email notifications (submit, classify, route)

### Phase 2: AI & Patterns (Weeks 5-8)
- [ ] Embeddings (Sentence-Transformers)
- [ ] Pattern detection (clustering, batch job)
- [ ] Multi-classification support
- [ ] Confidence thresholds + manual review gate
- [ ] Audit logging (immutable)
- [ ] Risk flagging (keywords, legal holds)

### Phase 3: HR Workflow (Weeks 9-12)
- [ ] HR dashboard (KPIs, charts)
- [ ] SLA tracking + escalation alerts
- [ ] Resolution workflow (notes, confirmation)
- [ ] Investigation case creation
- [ ] Pattern investigation UI
- [ ] Admin settings (SLA rules, team routing, keywords)

### Phase 4: Scale & Compliance (Weeks 13-16)
- [ ] Celery async workers (horizontal scale)
- [ ] Database optimization (indexes, materialized views)
- [ ] Encryption (at-rest for sensitive fields)
- [ ] DPDP audit trail + data deletion workflow
- [ ] Load testing (10K → 100K concurrent)
- [ ] Deployment docs + Kubernetes manifests (optional)

---

## 12. SUCCESS CRITERIA & KPIs

- **Triage Time:** Manual 48+ hrs → Automated 15 min (320x improvement)
- **Routing Accuracy:** Baseline unknown → Target 85%+ first-time correct routing
- **Pattern Detection:** Identify systemic issues within 48 hours of 5th related ticket
- **SLA Compliance:** 95%+ of tickets resolved within SLA (critical: 24h, high: 72h, medium/low: 7 days)
- **Employee Satisfaction:** 4+ stars on resolution feedback
- **System Uptime:** 99.5% availability
- **DPDP Compliance:** 100% audit trail, zero unlogged access
- **Scalability:** Process 20K tickets/day (1M employee org) with <1s response latency

---

## 13. ADDITIONAL NOTES

### Future Enhancements (Post-MVP)
1. **HRIS Integration:** Query employee tenure, department, manager for context
2. **Predictive Analytics:** Forecast resolution time by category/team
3. **Chatbot Interface:** Slack/Teams bot for submission + status checks
4. **Exit Interview Integration:** Capture separation complaints, route to legal
5. **Analytics Export:** Dashboard → PDF reports for leadership/board
6. **Multi-Language Support:** Hindi, Tamil, Telugu for Indian orgs
7. **Anonymous Reporting:** Whistleblower integration (external hotline)
8. **Compliance Automation:** Integrate with legal hold systems, export audit trails for regulators

### Key Design Decisions

1. **Self-hosted LLM:** Ollama (no API calls, full data control, DPDP compliant)
2. **PostgreSQL + pgvector:** Single DB, no separate vector store, simpler ops
3. **Immutable audit logs:** Design ensures compliance, supports investigations
4. **Risk-based routing:** Low confidence + high risk → manual review (safe default)
5. **Pattern clustering:** Cosine similarity >0.75, cluster size ≥5 (tunable)
6. **SLA by risk:** Critical 24h, high 72h, medium 7d, low 14d (configurable)

---

## END OF SPECIFICATION

**For Claude Code Generation:**
1. Use this spec as context
2. Generate full working application (backend + frontend)
3. Include all tables, API endpoints, components listed
4. Follow folder structure exactly
5. Implement DPDP compliance requirements
6. Add docker-compose.yml for local deployment
7. Include sample seed data (5 test tickets with classifications)
8. Output: Working app ready to `docker-compose up`

**Questions during build:** Refer to relevant section above. Spec is comprehensive enough for full implementation without clarification loops.
