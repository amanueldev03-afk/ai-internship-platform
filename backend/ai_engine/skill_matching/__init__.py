"""
skill_matching/ — exact and fuzzy skill intersection scoring.

Business spec weight: skills = 40% of final score.

Two layers:
  1. Exact match  — lowercased string intersection (fast, no ML)
  2. Semantic match — embedding similarity for skills that don't
     share exact names but are related (e.g. "React" vs "ReactJS")

Delegates to apps.recommendations.services.recommendation_engine_v2
for the core name-based scoring already implemented there.
"""

from __future__ import annotations


def exact_skill_score(
    student_skills: list[str],
    internship_skills: list[str],
) -> float:
    """
    Name-based intersection score.
    Returns 0.0–1.0. If no required skills → neutral 0.5.
    Delegates to the existing engine implementation.
    """
    try:
        from apps.recommendations.services.recommendation_engine_v2 import (
            calculate_skill_score,
        )
        return calculate_skill_score(student_skills, internship_skills)
    except ImportError:
        return _exact_skill_score_standalone(student_skills, internship_skills)


def _exact_skill_score_standalone(
    student_skills: list[str],
    internship_skills: list[str],
) -> float:
    """Fallback — no Django required."""
    s = {sk.lower().strip() for sk in student_skills if sk}
    i = {sk.lower().strip() for sk in internship_skills if sk}
    if not i:
        return 0.5
    return len(s & i) / len(i)


def get_matched_skills(
    student_skills: list[str],
    internship_skills: list[str],
) -> list[str]:
    """Return the list of skill names that match (preserving original case)."""
    try:
        from apps.recommendations.services.recommendation_engine_v2 import (
            get_matched_skills as _get,
        )
        return _get(student_skills, internship_skills)
    except ImportError:
        s_map = {sk.lower().strip(): sk for sk in student_skills if sk}
        i_map = {sk.lower().strip(): sk for sk in internship_skills if sk}
        return [s_map[k] for k in sorted(s_map.keys() & i_map.keys())]


def normalize_skill(skill: str) -> str:
    """Apply alias normalization to a single skill name."""
    try:
        from apps.student_profiles.services.skill_normalization import (
            normalize_skills,
        )
        result = normalize_skills([skill])
        return result[0] if result else skill
    except ImportError:
        return skill.strip()
