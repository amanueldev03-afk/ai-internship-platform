import logging
from dataclasses import dataclass
from .semantic_matching import (
    calculate_semantic_similarity,
)
from apps.internships.models import Recommendation

logger = logging.getLogger(__name__)


@dataclass
class RecommendationResult:
    internship: object
    score: float
    explanation: list[str]
    score_breakdown: dict = None


SEMANTIC_WEIGHT = 0.40
SKILL_WEIGHT = 0.25
PREFERENCE_WEIGHT = 0.20
LOCATION_WEIGHT = 0.10
SALARY_WEIGHT = 0.05


def calculate_skill_score(
    student_skills,
    internship_skills,
):
    """
    Calculate Skill Score (25% weight).
    Match between student skills and required internship skills.
    """
    student = {
        skill.lower().strip()
        for skill in student_skills
        if skill
    }

    internship = {
        skill.lower().strip()
        for skill in internship_skills
        if skill
    }

    if not internship:
        return 1.0 if student else 0.5

    matched = student.intersection(internship)
    return len(matched) / len(internship)


def get_matched_skills(
    student_skills,
    internship_skills,
):
    student = {
        skill.lower().strip(): skill
        for skill in student_skills
        if skill
    }

    internship = {
        skill.lower().strip(): skill
        for skill in internship_skills
        if skill
    }

    matched_keys = set(student.keys()) & set(internship.keys())
    return [student[key] for key in sorted(matched_keys)]


def calculate_semantic_score(
    student_embedding,
    internship_embedding,
):
    """
    Calculate Semantic Score (40% weight).
    CV/profile text similarity to internship description using embeddings.
    """
    if not student_embedding or not internship_embedding:
        return 0.0

    similarity = calculate_semantic_similarity(
        student_embedding,
        internship_embedding,
    )
    
    return max(0.0, min(1.0, similarity / 100.0))


def passes_hard_filters(
    internship,
    profile,
):
    """
    Apply mandatory hard constraints before scoring.
    """
    if not profile:
        return True

    # Active status check
    if getattr(internship, "status", "active") != "active":
        return False

    # Internship type filter (remote/onsite/hybrid)
    pref_type = getattr(profile, "internship_type", "any")
    if pref_type and pref_type != "any":
        if getattr(internship, "internship_type", None) != pref_type:
            return False

    # Compensation preference filter (paid/unpaid/either)
    comp_pref = getattr(profile, "compensation_preference", "either")
    if comp_pref == "paid" and getattr(internship, "compensation_type", None) == "unpaid":
        return False
    if comp_pref == "unpaid" and getattr(internship, "compensation_type", None) == "paid":
        return False

    return True


def calculate_work_mode_score(
    internship,
    profile,
):
    if not profile:
        return 0.5

    work_type_pref = getattr(profile, "work_type", "either")
    internship_work = getattr(internship, "work_type", None)

    if work_type_pref == "either" or not work_type_pref:
        return 1.0
    if internship_work == work_type_pref:
        return 1.0

    return 0.0


def calculate_location_score(
    internship,
    profile,
):
    """
    Calculate Location Score (10% weight).
    Geographic match (country/city, remote compatibility).
    """
    if not profile:
        return 0.5

    student_country = (getattr(profile, "country", "") or "").lower().strip()
    student_city = (getattr(profile, "city", "") or "").lower().strip()
    preferred_locs = [
        loc.lower().strip()
        for loc in (getattr(profile, "preferred_locations", []) or [])
        if loc
    ]

    internship_country = (getattr(internship, "country", "") or "").lower().strip()
    internship_city = (getattr(internship, "city", "") or "").lower().strip()

    # Exact city & country match
    if student_city and internship_city and student_city == internship_city:
        return 1.0

    # Remote internship or willing to relocate
    internship_type = getattr(internship, "internship_type", "")
    if internship_type == "remote" or getattr(profile, "willing_to_relocate", False):
        return 1.0

    # Same country, different city
    if student_country and internship_country and student_country == internship_country:
        return 0.5

    # Preferred location match
    for loc in preferred_locs:
        if loc and (loc in internship_city or loc in internship_country):
            return 0.75

    return 0.0


def calculate_salary_score(
    internship,
    profile,
):
    """
    Calculate Salary Score (5% weight).
    Salary range alignment between student requirements and internship.
    """
    if not profile:
        return 0.5

    comp_pref = getattr(profile, "compensation_preference", "either")
    internship_comp_type = getattr(internship, "compensation_type", "unknown")

    if comp_pref == "either":
        return 1.0

    if comp_pref == "paid":
        if internship_comp_type == "paid":
            student_min = getattr(profile, "minimum_compensation", None)
            student_max = getattr(profile, "maximum_compensation", None)
            int_min = getattr(internship, "minimum_compensation", None)
            int_max = getattr(internship, "maximum_compensation", None)

            if student_min is None or (int_max is not None and int_max >= student_min):
                return 1.0
            if student_max is not None and int_min is not None and int_min > student_max:
                return 0.0
            return 0.5
        else:
            return 0.0

    if comp_pref == "unpaid":
        if internship_comp_type == "unpaid":
            return 1.0
        return 0.5

    return 0.5


def calculate_preference_score(
    internship,
    profile,
):
    """
    Calculate Preference Score (20% weight).
    Match with student's work mode, location, and salary preferences.
    """
    work_mode = calculate_work_mode_score(internship, profile)
    location = calculate_location_score(internship, profile)
    salary = calculate_salary_score(internship, profile)

    return round((work_mode + location + salary) / 3.0, 4)


def calculate_final_score(
    semantic_score,
    skill_score,
    preference_score,
    location_score,
    salary_score,
):
    """
    Calculate final recommendation score as weighted sum:
    40% Semantic, 25% Skill, 20% Preference, 10% Location, 5% Salary.
    Returns a score between 0.0 and 100.0.
    """
    score = (
        semantic_score * SEMANTIC_WEIGHT
        + skill_score * SKILL_WEIGHT
        + preference_score * PREFERENCE_WEIGHT
        + location_score * LOCATION_WEIGHT
        + salary_score * SALARY_WEIGHT
    )

    return round(score * 100, 2)


def build_explanation(
    semantic_score,
    skill_score,
    preference_score,
    matched_skills,
    internship,
):
    explanation = []

    if semantic_score >= 0.80:
        explanation.append(
            "Your CV and profile content are highly similar to this internship."
        )
    elif semantic_score >= 0.60:
        explanation.append(
            "Your profile is semantically relevant to this internship description."
        )

    if skill_score >= 0.70:
        explanation.append("Strong match with your technical skills.")
    elif skill_score >= 0.40:
        explanation.append("Several of your skills match this internship.")

    if matched_skills:
        explanation.append(
            "Matching skills: " + ", ".join(matched_skills[:5])
        )

    if preference_score >= 0.80:
        explanation.append("This internship aligns well with your preferences.")

    return explanation


def save_recommendation(
    student,
    internship,
    overall_score,
    semantic_score,
    skill_score,
    preference_score,
    location_score,
    salary_score,
):
    """
    Save recommendation to database with score breakdown.
    Returns the created/updated Recommendation instance.
    """
    try:
        defaults = {
            "overall_score": overall_score,
            "semantic_score": round(semantic_score * 100, 2) if semantic_score is not None else None,
            "skill_score": round(skill_score * 100, 2) if skill_score is not None else None,
            "preference_score": round(preference_score * 100, 2) if preference_score is not None else None,
            "location_score": round(location_score * 100, 2) if location_score is not None else None,
            "salary_score": round(salary_score * 100, 2) if salary_score is not None else None,
            "interest_score": round(preference_score * 100, 2) if preference_score is not None else None,
        }
        recommendation, created = Recommendation.objects.get_or_create(
            student=student,
            internship=internship,
            defaults=defaults,
        )

        if not created:
            for key, val in defaults.items():
                setattr(recommendation, key, val)
            recommendation.save(update_fields=list(defaults.keys()) + ["updated_at"])

        return recommendation
    except Exception as e:
        logger.error(f"Failed to save recommendation: {e}")
        return None


def generate_recommendations(
    student,
    internships,
    save_to_db=True,
):
    """
    Generate personalized recommendations for a student based on 5-component weighted scoring:
    40% Semantic, 25% Skills, 20% Preferences, 10% Location, 5% Salary.
    """
    profile = getattr(student, "student_profile", None)
    if not profile:
        return []

    student_skills = list(
        profile.skills.values_list("name", flat=True)
    )

    # Incorporate CV extracted skills if available
    user = getattr(profile, "user", student)
    if user:
        try:
            from apps.student_profiles.models import StudentCV
            cv = StudentCV.objects.filter(student=user).first()
            if cv and cv.extracted_skills and isinstance(cv.extracted_skills, list):
                student_skills.extend(cv.extracted_skills)
        except Exception:
            pass

    results = []

    for internship in internships:

        # -----------------------------
        # HARD FILTERS
        # -----------------------------
        if not passes_hard_filters(
            internship,
            profile,
        ):
            continue

        # -----------------------------
        # 1. SEMANTIC SCORE (40%)
        # -----------------------------
        semantic_score = calculate_semantic_score(
            profile.embedding,
            internship.embedding,
        )

        # -----------------------------
        # 2. SKILLS SCORE (25%)
        # -----------------------------
        internship_skills = list(
            internship.required_skills.values_list("name", flat=True)
        )

        skill_score = calculate_skill_score(
            student_skills,
            internship_skills,
        )

        matched_skills = get_matched_skills(
            student_skills,
            internship_skills,
        )

        # -----------------------------
        # 3. PREFERENCE SCORE (20%)
        # -----------------------------
        preference_score = calculate_preference_score(
            internship,
            profile,
        )

        # -----------------------------
        # 4. LOCATION SCORE (10%)
        # -----------------------------
        location_score = calculate_location_score(
            internship,
            profile,
        )

        # -----------------------------
        # 5. SALARY SCORE (5%)
        # -----------------------------
        salary_score = calculate_salary_score(
            internship,
            profile,
        )

        # -----------------------------
        # FINAL SCORE & BREAKDOWN
        # -----------------------------
        final_score = calculate_final_score(
            semantic_score,
            skill_score,
            preference_score,
            location_score,
            salary_score,
        )

        explanation = build_explanation(
            semantic_score,
            skill_score,
            preference_score,
            matched_skills,
            internship,
        )

        score_breakdown = {
            "semantic_score": round(semantic_score * 100, 2),
            "skill_score": round(skill_score * 100, 2),
            "preference_score": round(preference_score * 100, 2),
            "location_score": round(location_score * 100, 2),
            "salary_score": round(salary_score * 100, 2),
        }

        # -----------------------------
        # SAVE TO DATABASE
        # -----------------------------
        if save_to_db:
            save_recommendation(
                student=student,
                internship=internship,
                overall_score=final_score,
                semantic_score=semantic_score,
                skill_score=skill_score,
                preference_score=preference_score,
                location_score=location_score,
                salary_score=salary_score,
            )

        results.append(
            RecommendationResult(
                internship=internship,
                score=final_score,
                explanation=explanation,
                score_breakdown=score_breakdown,
            )
        )

    results.sort(
        key=lambda result: result.score,
        reverse=True,
    )

    return results