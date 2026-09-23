from typing import List, Optional
from pydantic import BaseModel, Field

class SecondaryCategory(BaseModel):
    category: str
    confidence: float = Field(ge=0.0, le=1.0)

class ClassificationResult(BaseModel):
    primary_category: str
    primary_confidence: float = Field(ge=0.0, le=1.0)
    secondary_categories: List[SecondaryCategory] = []
    risk_keywords: List[str] = []
    risk_level: str = "low" # low, medium, high, critical
    requires_manual_review: bool = False
    reasoning: str
    legal_hold: bool = False
