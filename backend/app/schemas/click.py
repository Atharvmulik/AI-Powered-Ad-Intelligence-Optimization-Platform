"""
click.py (schemas)
------------------
Pydantic models for request validation and response serialization.
"""
from pydantic import BaseModel
from typing import Optional

class ClickPredictRequest(BaseModel):
    # Numerical features — all optional (missing = filled with medians)
    I1: Optional[float] = None
    I2: Optional[float] = None
    I3: Optional[float] = None
    I4: Optional[float] = None
    I5: Optional[float] = None
    I6: Optional[float] = None
    I7: Optional[float] = None
    I8: Optional[float] = None
    I9: Optional[float] = None
    I10: Optional[float] = None
    I11: Optional[float] = None
    I12: Optional[float] = None
    I13: Optional[float] = None

    # Categorical features — all optional
    C1: Optional[str] = None
    C2: Optional[str] = None
    C3: Optional[str] = None
    C4: Optional[str] = None
    C5: Optional[str] = None
    C6: Optional[str] = None
    C7: Optional[str] = None
    C8: Optional[str] = None
    C9: Optional[str] = None
    C10: Optional[str] = None
    C11: Optional[str] = None
    C12: Optional[str] = None
    C13: Optional[str] = None
    C14: Optional[str] = None
    C15: Optional[str] = None
    C16: Optional[str] = None
    C17: Optional[str] = None
    C18: Optional[str] = None
    C19: Optional[str] = None
    C20: Optional[str] = None
    C21: Optional[str] = None
    C22: Optional[str] = None
    C23: Optional[str] = None
    C24: Optional[str] = None
    C25: Optional[str] = None
    C26: Optional[str] = None


class SHAPFeature(BaseModel):
    feature: str
    shap_value: float
    direction: str
    plain_english: str


class ClickPredictResponse(BaseModel):
    click_probability: float
    click_label: str          # HIGH / MEDIUM / LOW / VERY_LOW
    ad_decision: str          # SERVE / REVIEW / SKIP
    model: str
    inference_latency_ms: float
    prd_latency_ok: bool
    shap_explanation: list