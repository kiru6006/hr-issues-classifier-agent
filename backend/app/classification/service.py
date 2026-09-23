import json
import logging
import re
from typing import Dict, Any, List, Optional
import httpx

from app.config import settings
from app.classification.prompts import (
    CATEGORIES,
    RISK_KEYWORDS,
    CLASSIFICATION_PROMPT_TEMPLATE
)
from app.classification.schemas import ClassificationResult, SecondaryCategory

logger = logging.getLogger(__name__)

class ClassificationService:
    def __init__(self):
        self.ollama_url = f"{settings.OLLAMA_API_URL.rstrip('/')}/api/generate"
        self.model = settings.LLM_MODEL
        self.timeout = settings.LLM_TIMEOUT_SECONDS

    async def classify_ticket(
        self,
        title: str,
        description: str,
        submission_type: str = "form",
        department: str = "General"
    ) -> ClassificationResult:
        """Classify ticket via Ollama LLM with zero-shot prompting or use rule-based fallback."""
        prompt = CLASSIFICATION_PROMPT_TEMPLATE.format(
            title=title,
            description=description,
            submission_type=submission_type,
            department=department or "General"
        )

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(
                    self.ollama_url,
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                        "options": {
                            "temperature": 0.1,
                            "top_p": 0.9
                        }
                    }
                )

                if response.status_code == 200:
                    data = response.json()
                    raw_text = data.get("response", "")
                    parsed = self._parse_llm_json(raw_text)
                    if parsed:
                        return self._validate_and_normalize(parsed, title, description)

        except Exception as e:
            logger.warning(f"Ollama inference unavailable ({e}), engaging intelligent fallback classifier.")

        # Fallback intelligent classifier
        return self._heuristic_fallback_classifier(title, description, submission_type)

    def _parse_llm_json(self, raw_text: str) -> Optional[Dict[str, Any]]:
        try:
            cleaned = raw_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.error(f"Failed to parse LLM JSON output: {e}. Raw was: {raw_text[:200]}")
            return None

    def _validate_and_normalize(
        self,
        data: Dict[str, Any],
        title: str,
        description: str
    ) -> ClassificationResult:
        primary = data.get("primary_category", "Others")
        if primary not in CATEGORIES:
            primary = self._match_closest_category(primary)

        confidence = float(data.get("primary_confidence", 0.88))
        confidence = max(0.0, min(1.0, confidence))

        secondary_raw = data.get("secondary_categories", [])
        secondary: List[SecondaryCategory] = []
        for sec in secondary_raw:
            cat_name = sec.get("category", "")
            if cat_name in CATEGORIES and cat_name != primary:
                conf = max(0.0, min(1.0, float(sec.get("confidence", 0.5))))
                secondary.append(SecondaryCategory(category=cat_name, confidence=conf))

        # Risk keyword scanning
        detected_keywords = self._scan_risk_keywords(f"{title} {description}")
        llm_keywords = data.get("risk_keywords", [])
        combined_keywords = list(set(detected_keywords + [k.lower() for k in llm_keywords if isinstance(k, str)]))

        risk_level = data.get("risk_level", "low").lower()
        if combined_keywords and risk_level == "low":
            risk_level = "high"

        # Determine legal hold / critical flags
        legal_hold = False
        if any(k in ["posh", "sexual harassment", "caste", "lawsuit", "court", "threat", "physical harm"] for k in combined_keywords):
            risk_level = "critical"
            legal_hold = True
        elif any(k in ["harassment", "discrimination", "retaliation", "whistleblower", "safety violation"] for k in combined_keywords):
            if risk_level not in ["critical", "high"]:
                risk_level = "high"

        requires_review = (
            confidence < 0.75 or 
            risk_level in ["high", "critical"] or 
            bool(combined_keywords) or 
            data.get("requires_manual_review", False)
        )

        return ClassificationResult(
            primary_category=primary,
            primary_confidence=confidence,
            secondary_categories=secondary[:2],
            risk_keywords=combined_keywords,
            risk_level=risk_level,
            requires_manual_review=requires_review,
            reasoning=data.get("reasoning", "Classified using enterprise zero-shot LLM inference."),
            legal_hold=legal_hold
        )

    def _heuristic_fallback_classifier(
        self,
        title: str,
        description: str,
        submission_type: str
    ) -> ClassificationResult:
        """High-precision fallback rule engine for official HR categories and risk assessment."""
        text = f"{title} {description}".lower()

        category_scores: Dict[str, float] = {cat: 0.0 for cat in CATEGORIES}

        # Category keyword patterns
        patterns = {
            "Payroll": [
                r"\bsalary\b", r"\bpay(roll)?\b", r"\bbonus\b", r"\bincrement\b", r"\barrears\b",
                r"\bdeduction\b", r"\bwages?\b", r"\bcompensation\b", r"\bvariable pay\b", r"\bctc\b",
                r"\btax deduction\b", r"\btds\b", r"\bpayslip\b", r"\bbank account\b", r"\bcredited\b", r"\bdisbursement\b"
            ],
            "Leave & Attendance": [
                r"\bleave\b", r"\bsick leave\b", r"\bearned leave\b", r"\bmaternity\b", r"\bpaternity\b",
                r"\battendance\b", r"\bswipe\b", r"\bbiometric\b", r"\blop\b", r"\bloss of pay\b",
                r"\bwfh\b", r"\bwork from home\b", r"\bhalf day\b", r"\bcasual leave\b", r"\bholiday\b"
            ],
            "Benefits": [
                r"\binsurance\b", r"\bmediclaim\b", r"\bhealth policy\b", r"\bpension\b", r"\bprovident fund\b",
                r"\bpf\b", r"\bgratuity\b", r"\ballowance\b", r"\bgym\b", r"\breimbursement\b",
                r"\bfamily cover\b", r"\bwellness\b", r"\bmedical claim\b", r"\bcashless\b"
            ],
            "Policy & Compliance": [
                r"\bpolicy\b", r"\bprocedure\b", r"\bcode of conduct\b", r"\bdress code\b", r"\boffice hours\b",
                r"\bguideline\b", r"\bcompliance rule\b", r"\bworking hours\b", r"\bshift timing\b", r"\bnda\b",
                r"\bcontract\b", r"\bstatutory\b", r"\brules\b", r"\bdisciplinary\b"
            ],
            "Employee Relations": [
                r"\bmanager\b", r"\bcolleague\b", r"\bpeer\b", r"\bconflict\b", r"\brude\b",
                r"\bdisrespect\b", r"\bteam dynamics\b", r"\bshouting\b", r"\bargument\b", r"\bfavoritism\b",
                r"\bharass(ment)?\b", r"\bposh\b", r"\bsexual harassment\b", r"\bbully(ing)?\b", r"\bintimidat(ion|e)?\b",
                r"\bverbal abuse\b", r"\bmobbing\b", r"\bhostile\b", r"\bdiscriminat(ion|e)?\b", r"\bcaste\b",
                r"\breligion\b", r"\bgender\b", r"\bretaliat(ion|e)?\b", r"\bbias\b"
            ],
            "Recruitment & Onboarding": [
                r"\boffer letter\b", r"\bjoining\b", r"\bonboarding\b", r"\bbgv\b", r"\bbackground verification\b",
                r"\binterview\b", r"\binduction\b", r"\bprobation\b", r"\bappointment letter\b", r"\bcandidate\b",
                r"\bhiring\b", r"\bjoining documents\b"
            ],
            "Learning & Development": [
                r"\btraining\b", r"\bcertification\b", r"\bskill development\b", r"\bl&d\b", r"\blearning\b",
                r"\bworkshop\b", r"\bcourse\b", r"\bupskilling\b", r"\bmentor\b", r"\bseminar\b", r"\bstudy\b"
            ],
            "General HR Query": [
                r"\bgeneral query\b", r"\bhelpdesk\b", r"\bexperience letter\b", r"\brelieving letter\b",
                r"\baddress change\b", r"\bemployment verification\b", r"\bcertificate\b", r"\bhr question\b",
                r"\bcontact info\b", r"\bupdate details\b"
            ]
        }

        for cat, regex_list in patterns.items():
            for regex in regex_list:
                matches = re.findall(regex, text)
                if matches:
                    category_scores[cat] += len(matches) * 1.5

        # Submission type hints
        if submission_type == "exit_interview":
            category_scores["Employee Relations"] += 2.0

        # Sort categories by score
        sorted_categories = sorted(category_scores.items(), key=lambda x: x[1], reverse=True)
        top_cat, top_score = sorted_categories[0]

        if top_score == 0:
            top_cat = "Others"
            confidence = 0.65
        else:
            confidence = min(0.96, 0.75 + (top_score * 0.05))

        # Secondary categories
        secondary: List[SecondaryCategory] = []
        for cat, score in sorted_categories[1:3]:
            if score > 0:
                sec_conf = min(confidence - 0.1, max(0.4, score * 0.2))
                secondary.append(SecondaryCategory(category=cat, confidence=round(sec_conf, 2)))

        # Risk scan
        risk_keywords = self._scan_risk_keywords(text)
        
        # Risk level determination
        risk_level = "low"
        legal_hold = False
        if any(k in ["posh", "sexual harassment", "caste", "lawsuit", "court", "threat", "physical harm"] for k in risk_keywords):
            risk_level = "critical"
            legal_hold = True
        elif any(k in ["harassment", "discrimination", "retaliation", "whistleblower", "safety violation", "injury"] for k in risk_keywords):
            risk_level = "high"
        elif top_cat in ["Employee Relations"]:
            risk_level = "medium"

        requires_review = (confidence < 0.75) or (risk_level in ["high", "critical"]) or bool(risk_keywords)

        reasoning = f"Automated enterprise classifier identified {top_cat} with {int(confidence*100)}% confidence based on problem context and intent."
        if risk_keywords:
            reasoning += f" Flagged risk keywords: {', '.join(risk_keywords)}."

        return ClassificationResult(
            primary_category=top_cat,
            primary_confidence=round(confidence, 2),
            secondary_categories=secondary,
            risk_keywords=risk_keywords,
            risk_level=risk_level,
            requires_manual_review=requires_review,
            reasoning=reasoning,
            legal_hold=legal_hold
        )

    def _scan_risk_keywords(self, text: str) -> List[str]:
        found = []
        text_lower = text.lower()
        for kw in RISK_KEYWORDS:
            if re.search(r"\b" + re.escape(kw) + r"\b", text_lower):
                found.append(kw)
        return list(set(found))

    def _match_closest_category(self, raw_cat: str) -> str:
        for cat in CATEGORIES:
            if cat.lower() in raw_cat.lower() or raw_cat.lower() in cat.lower():
                return cat
        return "Others"

classification_service = ClassificationService()
