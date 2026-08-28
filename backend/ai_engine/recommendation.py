"""
recommendation.py — top-level AI engine orchestrator.

Entry point for the full matching pipeline:
  profile (StudentInput) + pool (list[InternshipInput])
  → ranked list[RecommendationOutput]

Business flow (step 3):
  For each internship:
    1. Hard filter  — skip inactive, wrong type, wrong compensation
    2. Skill score  — exact name intersection (40%)
    3. Semantic score — embedding cosine similarity (part of overall)
    4. Field/interest/experience scores — profile alignment
    5. Location + work_mode scores
    6. Weighted sum → final score 0–100
    7. Generate explanation
  Sort highest → lowest, return ranked results.

For production use, the Django views call
  apps.recommendations.services.recommendation_engine_v2.generate_recommendations()
directly (which does DB reads/writes). This module provides the same
logic as a pure-Python function for testing and standalone use.
"""

from __future__ import annotations
from ai_engine.models import (
    StudentInput,
    InternshipInput,
    ScoreBreakdown,
    RecommendationOutput,
)
from ai_engine.skill_matching import exact_skill_score, get_matched_skills
from ai_engine.semantic_matching import student_internship_similarity
from ai_engine.ranking import weighted_score, rank
from ai_engine.explanation import build_explanation


def score_single(
    student: StudentInput,
    internship: InternshipInput,
) -> RecommendationOutput:
    """
    Score one student↔internship pair.
    Returns a RecommendationOutput with score=0 stub values until
    each sub-scorer is fully implemented.
    """
    # --- Skill score (40%) ---
    skill = exact_skill_score(student.skills, internship.required_skills)
    matched = get_matched_skills(student.skills, internship.required_skills)

    # --- Semantic score ---
    semantic = student_internship_similarity(
        student.embedding,
        internship.embedding,
    ) / 100.0   # normalise to 0–1

    # --- Field of study (stub — 0.0 until field matcher is wired) ---
    field_of_study: float = 0.0

    # --- Career interest (stub) ---
    career_interest: float = 0.0

    # --- Experience (stub) ---
    experience: float = 0.0

    # --- Location (10%) ---
    location = _location_score(student, internship)

    # --- Work mode (5%) ---
    work_mode = _work_mode_score(student, internship)

    # --- Salary (carried as part of preference, stub here) ---
    salary: float = 0.0

    breakdown = ScoreBreakdown(
        skill=skill,
        semantic=semantic,
        field_of_study=field_of_study,
        career_interest=career_interest,
        experience=experience,
        location=location,
        work_mode=work_mode,
        salary=salary,
    )

    final_score = weighted_score(breakdown)
    explanation = build_explanation(breakdown, matched)

    return RecommendationOutput(
        internship_id=internship.internship_id,
        score=final_score,
        breakdown=breakdown,
        explanation=explanation,
        matched_skills=matched,
    )


def recommend(
    student: StudentInput,
    internships: list[InternshipInput],
) -> list[RecommendationOutput]:
    """
    Score all internships against the student profile and return
    ranked results (highest score first).
    """
    results = [score_single(student, i) for i in internships]
    return rank(results)


def stub_score() -> dict:
    """
    Throwaway stub — returns the minimal output shape.
    Used by the verification script (Task 0.5 check).
    """
    return {"score": 0}


# ---------------------------------------------------------------------------
# Private helpers
# ---------------------------------------------------------------------------

def _location_score(student: StudentInput, internship: InternshipInput) -> float:
    """Location match — 0.0–1.0."""
    s_country = (student.country or "").lower().strip()
    s_city    = (student.city or "").lower().strip()
    i_country = (internship.country or "").lower().strip()
    i_city    = (internship.city or "").lower().strip()
    i_type    = (internship.internship_type or "").lower()

    pref_locs = [loc.lower().strip() for loc in student.preferred_locations if loc]

    if s_city and i_city and s_city == i_city:
        return 1.0
    if i_type == "remote" or student.willing_to_relocate:
        return 1.0
    for loc in pref_locs:
        if loc and (loc in i_city or loc in i_country):
            return 0.75
    if s_country and i_country and s_country == i_country:
        return 0.5
    return 0.0


def _work_mode_score(student: StudentInput, internship: InternshipInput) -> float:
    """Work mode match — 0.0 or 1.0."""
    pref   = (student.work_type or "either").lower()
    actual = (internship.work_type or "").lower()
    if pref in ("either", ""):
        return 1.0
    return 1.0 if actual == pref else 0.0
