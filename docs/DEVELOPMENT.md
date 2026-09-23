# Development & Architecture Guide

## System Architecture

```
[ Employee Submission ]
       │ (Web Form / Email / Slack / Support Ticket / Exit Interview)
       ▼
[ Intake & Encryption Layer ] (AES-256 / Fernet)
       │
       ├──► [ Zero-Shot LLM Multi-Classifier ] (13 Categories + Confidence + Reasoning)
       │
       ├──► [ Semantic Embedding Generator ] (384-Dim Normalized Vector)
       │         │
       │         └──► [ Sliding 7-Day Clustering ] (≥3 similar = Systemic Alert)
       │
       ├──► [ Risk Scoring & Keyword Scan ] (PoSH, Safety, Discrimination, Legal Holds)
       │
       └──► [ SLA Matrix & Triage Dispatch ]
                 ├── Critical (24h) ──► Legal / PoSH Counsel
                 ├── High (72h)     ──► HR Review Queue
                 └── Normal         ──► Predictive Team Routing (Payroll/Benefits/Relations)
```

---

## Running Automated Backend Tests

```bash
cd backend
pytest tests/test_api.py -v
```

---

## Pre-seeded Demo Accounts

| Role | Email | Password | Primary Responsibilities |
|------|-------|----------|--------------------------|
| **Employee** | `employee@company.com` | `password123` | Submit grievances, track SLA, confirm resolution |
| **HR Reviewer** | `reviewer@company.com` | `password123` | Triage queue, review AI predictions, manual override |
| **HR Resolver** | `resolver@company.com` | `password123` | Resolve grievance, record investigation findings |
| **Legal Counsel**| `legal@company.com` | `password123` | PoSH, harassment, legal holds, regulatory compliance |
| **HR Lead** | `lead@company.com` | `password123` | Systemic pattern management, SLA oversight |
| **Admin** | `admin@company.com` | `password123` | Audit log export, DPDP right to erasure, system settings |
