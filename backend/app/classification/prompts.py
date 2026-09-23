"""Categories, keywords, and system prompts for HR problem classification."""

CATEGORIES = [
    "Payroll",
    "Leave & Attendance",
    "Benefits",
    "Policy & Compliance",
    "Employee Relations",
    "Recruitment & Onboarding",
    "Learning & Development",
    "General HR Query",
    "Others"
]

RISK_KEYWORDS = [
    "harassment",
    "sexual harassment",
    "posh",
    "bullying",
    "intimidation",
    "abuse",
    "verbal abuse",
    "discrimination",
    "caste",
    "religion",
    "gender",
    "disability",
    "retaliation",
    "punitive",
    "whistleblower",
    "safety violation",
    "injury",
    "physical harm",
    "legal notice",
    "lawsuit",
    "court",
    "breach of contract",
    "unlawful",
    "illegal",
    "threat",
    "suicide",
    "depression"
]

CLASSIFICATION_PROMPT_TEMPLATE = """You are an expert HR problem classifier for an enterprise organization. Analyze the employee grievance/ticket and classify it into ONE primary category and up to TWO secondary categories from the official HR categories list.

CATEGORIES:
1. Payroll (Salary delay, incorrect salary, tax deduction / TDS issue, bonus arrears, payslip error)
2. Leave & Attendance (Leave balance issue, attendance correction, swipe / biometric issue, work-from-home / WFH request, loss of pay / LOP)
3. Benefits (Health insurance, cashless claims, medical reimbursement, wellness benefits, provident fund / PF, gratuity)
4. Policy & Compliance (Company policy clarification, code of conduct, dress code, office hours, compliance concern, statutory rules)
5. Employee Relations (Workplace conflict, manager / peer issue, harassment / PoSH concern, unfair treatment, discrimination, bullying)
6. Recruitment & Onboarding (Offer letter, joining documents, background verification, onboarding problem, probation confirmation)
7. Learning & Development (Training request, certification sponsorship, skill development, leadership courses, workshop access)
8. General HR Query (Unclear or common HR question, certificate request, address update, letter of experience)
9. Others (Any miscellaneous issue or inquiry not covered in the above categories)

TICKET DETAILS:
Title: {title}
Description: {description}
Submission Type: {submission_type}
Employee Department: {department}

OUTPUT STRICTLY VALID JSON MATCHING THIS SCHEMA:
{{
  "primary_category": "Exact Category Name from the official list above",
  "primary_confidence": 0.0 to 1.0,
  "secondary_categories": [
    {{"category": "Exact Category Name", "confidence": 0.0 to 1.0}}
  ],
  "risk_keywords": ["keyword1", "keyword2"],
  "risk_level": "low" | "medium" | "high" | "critical",
  "requires_manual_review": true | false,
  "reasoning": "Clear, concise 1-2 sentence explanation of classification decision and risk assessment."
}}

RULES:
- Be conservative with confidence scores.
- If the issue does not clearly fit into any specific category 1-8, choose "Others".
- Flag critical/high risk if PoSH, physical safety, severe harassment, discrimination, or legal litigation is mentioned.
- Output ONLY valid JSON, no markdown backticks, no introductory text.
"""
