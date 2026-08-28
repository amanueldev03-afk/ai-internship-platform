"""
explanation.py — human-readable match explanation generator.

Takes the ScoreBreakdown and matched_skills and produces a plain-English
list of strings shown to the student on their recommendations dashboard.

Delegates to apps.recommendations.services.recommendation_engine_v2
for the existing implementation; adds the field_of_study and
career_interest lines that the current engine doesn't yet generate.
"""

from __future__ import annotations
from ai_engine.models import ScoreBreakdown


def build_explanation(
    breakdown: ScoreBreakdown,
    matched_skills: list[str],
    internship_title: str = "",
) -> list[str]:
    """
    Generate explanation lines from score components.
    All component scores are 0.0–1.0.
    Returns a list of plain-English strings.
    """
    try:
        from apps.recommendations.services.recommendation_engine_v2 import (
            build_explanation as _build,
        )
        return _build(
            semantic=breakdown.semantic,
            skill=breakdown.skill,
            preference=(breakdown.location + breakdown.work_mode) / 2,
            location=breakdown.location,
            salary=breakdown.salary,
            matched_skills=matched_skills,
            internship=type("_", (), {"compensation_type": ""})(),
        )
    except ImportError:
        return _build_explanation_standalone(breakdown, matched_skills)


def _build_explanation_standalone(
    breakdown: ScoreBreakdown,
    matched_skills: list[str],
) -> list[str]:
    """Fallback — no Django required."""
    lines: list[str] = []

    if breakdown.semantic >= 0.80:
        lines.append("Your profile is highly similar to this internship.")
    elif breakdown.semantic >= 0.60:
        lines.append("Your profile is semantically relevant to this internship.")

    if matched_skills:
        lines.append(f"Matching skills: {', '.join(matched_skills[:5])}.")
    if breakdown.skill >= 0.70:
        lines.append("Strong match with the required technical skills.")
    elif breakdown.skill >= 0.40:
        lines.append("Several of your skills match this internship.")

    if breakdown.field_of_study >= 0.70:
        lines.append("Your field of study aligns well with this role.")

    if breakdown.career_interest >= 0.70:
        lines.append("This internship matches your stated career interests.")

    if breakdown.experience >= 0.70:
        lines.append("Your experience is relevant to this internship.")

    if breakdown.location >= 0.75:
        lines.append("Location is a great match.")
    elif breakdown.location >= 0.50:
        lines.append("Location partially matches your preferences.")

    if breakdown.work_mode == 1.0:
        lines.append("Work mode matches your preference.")

    if not lines:
        lines.append(
            "This internship was included based on your overall profile match."
        )

    return lines
