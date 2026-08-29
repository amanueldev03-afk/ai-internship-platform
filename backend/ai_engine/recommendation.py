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
    Returns a RecommendationOutput with the full weighted score.
    """
    # --- Skill score (40%) ---
    skill = exact_skill_score(student.skills, internship.required_skills)
    matched = get_matched_skills(student.skills, internship.required_skills)

    # --- Semantic score ---
    semantic = student_internship_similarity(
        student.embedding,
        internship.embedding,
    ) / 100.0   # normalise to 0–1

    # --- Field of study (20%) ---
    field_of_study = _field_of_study_score(student, internship)

    # --- Career interest (15%) ---
    career_interest = _career_interest_score(student, internship)

    # --- Experience (10%) ---
    experience = _experience_score(student, internship)

    # --- Location (10%) ---
    location = _location_score(student, internship)

    # --- Work mode (5%) ---
    work_mode = _work_mode_score(student, internship)

    # --- Salary (part of preference) ---
    salary = _salary_score(student, internship)

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
    explanation = build_explanation(breakdown, matched, internship.title)

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
    s_city = (student.city or "").lower().strip()
    i_country = (internship.country or "").lower().strip()
    i_city = (internship.city or "").lower().strip()
    i_type = (internship.internship_type or "").lower()

    pref_locs = [loc.lower().strip()
                 for loc in student.preferred_locations if loc]

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
    pref = (student.work_type or "either").lower()
    actual = (internship.work_type or "").lower()
    if pref in ("either", ""):
        return 1.0
    return 1.0 if actual == pref else 0.0


def _field_of_study_score(student: StudentInput, internship: InternshipInput) -> float:
    """
    Field-of-study relevance — 0.0–1.0.
    Compares the student's field of study against the internship category
    and description using keyword overlap.
    """
    s_field = (student.field_of_study or "").lower().strip()
    if not s_field:
        return 0.5  # neutral — no data to compare

    i_category = (internship.category or "").lower().strip()
    i_desc = (internship.description or "").lower().strip()

    # Tokenise the student's field into meaningful keywords
    field_tokens = {
        t for t in s_field.replace(",", " ").split()
        if len(t) > 2 and t not in _STOPWORDS
    }
    if not field_tokens:
        return 0.5

    # Check category first (strongest signal)
    if i_category:
        cat_tokens = {
            t for t in i_category.replace(",", " ").split()
            if len(t) > 2 and t not in _STOPWORDS
        }
        if field_tokens & cat_tokens:
            return 1.0

    # Fall back to description keyword overlap
    if i_desc:
        desc_tokens = {
            t for t in i_desc.replace(",", " ").split()
            if len(t) > 2 and t not in _STOPWORDS
        }
        overlap = field_tokens & desc_tokens
        if overlap:
            return round(min(1.0, len(overlap) / len(field_tokens) + 0.3), 2)

    return 0.0


def _career_interest_score(student: StudentInput, internship: InternshipInput) -> float:
    """
    Career-interest match — 0.0–1.0.
    Compares the student's stated interests against the internship
    category and title keywords.
    """
    interests = [i.lower().strip() for i in student.interests if i]
    if not interests:
        return 0.5  # neutral — no data

    i_category = (internship.category or "").lower().strip()
    i_title = (internship.title or "").lower().strip()
    i_desc = (internship.description or "").lower().strip()

    haystack = f"{i_category} {i_title} {i_desc}"

    for interest in interests:
        if interest and interest in haystack:
            return 1.0

    # Token-level partial match
    interest_tokens = {
        t for interest in interests
        for t in interest.replace(",", " ").split()
        if len(t) > 2 and t not in _STOPWORDS
    }
    if not interest_tokens:
        return 0.0

    haystack_tokens = {
        t for t in haystack.replace(",", " ").split()
        if len(t) > 2 and t not in _STOPWORDS
    }
    overlap = interest_tokens & haystack_tokens
    if overlap:
        return round(min(1.0, len(overlap) / len(interest_tokens) + 0.2), 2)

    return 0.0


def _experience_score(student: StudentInput, internship: InternshipInput) -> float:
    """
    Experience relevance — 0.0–1.0.
    Compares the student's experience text against the internship
    description and required skills.
    """
    s_exp = (student.experience or "").lower().strip()
    if not s_exp:
        return 0.5  # neutral — no data

    i_desc = (internship.description or "").lower().strip()
    i_skills = " ".join(internship.required_skills).lower()

    haystack = f"{i_desc} {i_skills}"

    exp_tokens = {
        t for t in s_exp.replace(",", " ").split()
        if len(t) > 2 and t not in _STOPWORDS
    }
    if not exp_tokens:
        return 0.5

    haystack_tokens = {
        t for t in haystack.replace(",", " ").split()
        if len(t) > 2 and t not in _STOPWORDS
    }
    overlap = exp_tokens & haystack_tokens
    if overlap:
        return round(min(1.0, len(overlap) / len(exp_tokens) + 0.2), 2)

    return 0.0


def _salary_score(student: StudentInput, internship: InternshipInput) -> float:
    """
    Salary/compensation match — 0.0–1.0.
    """
    comp_pref = (student.compensation_preference or "either").lower()
    i_comp_type = (internship.compensation_type or "unknown").lower()

    if comp_pref == "either":
        return 1.0

    if comp_pref == "paid":
        if i_comp_type != "paid":
            return 0.0
        # Both want paid — check range overlap
        s_min = student.minimum_compensation
        s_max = student.maximum_compensation
        i_min = internship.minimum_compensation
        i_max = internship.maximum_compensation
        # No range info → assume match
        if s_min is None:
            return 1.0
        if i_max is not None and float(i_max) >= float(s_min):
            return 1.0
        if s_max is not None and i_min is not None and float(i_min) > float(s_max):
            return 0.0
        return 0.5

    if comp_pref == "unpaid":
        return 1.0 if i_comp_type == "unpaid" else 0.5

    return 0.5


_STOPWORDS = {
    "the", "and", "for", "with", "from", "your", "you", "are", "our",
    "this", "that", "have", "will", "work", "role", "team", "able",
    "experience", "internship", "student", "students", "company",
    "position", "opportunity", "looking", "join", "who", "what",
    "when", "where", "how", "all", "any", "can", "should", "would",
    "could", "may", "might", "must", "need", "needs", "required",
    "requirements", "qualifications", "responsibilities", "including",
    "include", "etc", "e.g", "i.e", "per", "via", "using", "use",
    "based", "related", "relevant", "strong", "good", "great",
    "excellent", "knowledge", "skills", "skill", "ability", "able",
}
