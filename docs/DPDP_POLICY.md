# Digital Personal Data Protection (DPDP) Act 2023 Compliance Guide

## Enterprise HR AI Grievance Intake & Classification Architecture

This system has been built from the ground up to satisfy the statutory requirements of the **India Digital Personal Data Protection (DPDP) Act 2023**.

---

## 1. Data Minimization (Section 6)
- **Principle**: Only data elements directly relevant to grievance adjudication are requested.
- **Implementation**:
  - Employee ID is used rather than collecting full personal addresses or unrelated data.
  - Anonymous mode strips identifying user metadata from HR triage queues.
  - Mandatory field encryption (AES-256 / Fernet) protects sensitive grievance descriptions and resolution notes.

---

## 2. Purpose Limitation (Section 7)
- **Principle**: Personal grievance data must be processed solely for the intended resolution, triage, and systemic pattern detection.
- **Implementation**:
  - Model weights are self-hosted via local Ollama. No personal data is sent to external commercial model APIs.
  - Personal data is not utilized to train or fine-tune public models.

---

## 3. Explicit Consent & Transparency (Section 5)
- **Principle**: Consent must be freely given, specific, informed, and unambiguous.
- **Implementation**:
  - Mandatory consent checkbox is captured at submission with exact timestamp recorded in the database.
  - Clear statutory privacy notice provided on the login and submission interfaces.

---

## 4. Right to Access & Data Portability (Section 11)
- **Principle**: Employees have the right to obtain summary of data and processing activities.
- **Implementation**:
  - Real-time status tracker and audit progression timeline.
  - `GET /tickets/{ticket_id}/export-pdf` enables PDF export of grievance records and resolution findings.

---

## 5. Right to Erasure & Right to be Forgotten (Section 12)
- **Principle**: Data fiduciaries must erase data once purpose is fulfilled or consent is withdrawn.
- **Implementation**:
  - Statutory 2-year (730-day) data retention cycle.
  - `POST /admin/data-management/anonymize` redacts employee PII and descriptions while preserving non-PII audit counts.

---

## 6. Immutable Audit Trail & Accountability (Section 8)
- **Principle**: Fiduciaries must maintain accountability records.
- **Implementation**:
  - Dedicated `audit_logs` table has append-only access (no UPDATE or DELETE operations permitted).
  - Every review, classification override, and routing step logs actor, timestamp, IP address, and before/after state diff.
  - `GET /admin/audit-logs/export-csv` supports statutory audits.
