from dataclasses import dataclass
from .semantic_matching import (
    calculate_semantic_similarity,
)
from apps.internships.models import Recommendation


@dataclass
class RecommendationResult:
    internship: object
    score: float
    explanation: list[str]

SEMANTIC_WEIGHT = 0.40
SKILL_WEIGHT = 0.25
PREFERENCE_WEIGHT = 0.20
LOCATION_WEIGHT = 0.10
SALARY_WEIGHT = 0.05


def calculate_skill_score(
    student_skills,
    internship_skills,
):
    student = {
        skill.lower().strip()
        for skill in student_skills
    }

    internship = {
        skill.lower().strip()
        for skill in internship_skills
    }

    if not internship:
        return 0.0

    matched = student.intersection(
        internship
    )

    return len(matched) / len(
        internship
    )



def get_matched_skills(
    student_skills,
    internship_skills,
):
    student = {
        skill.lower().strip(): skill
        for skill in student_skills
    }

    internship = {
        skill.lower().strip(): skill
        for skill in internship_skills
    }

    matched_keys = (
        set(student.keys())
        & set(internship.keys())
    )

    return [
        student[key]
        for key in sorted(matched_keys)
    ]



def calculate_semantic_score(
    student_embedding,
    internship_embedding,
):
    if not student_embedding:
        return 0.0

    if not internship_embedding:
        return 0.0

    # calculate_semantic_similarity returns a score between 0-100
    # We need to normalize it to 0-1 for our weighted calculation
    similarity = calculate_semantic_similarity(
        student_embedding,
        internship_embedding,
    )
    
    return similarity / 100.0


def passes_work_mode_filter(
    internship,
    preferences,
):
    if not preferences:
        return True

    required_mode = (
        preferences.work_mode
    )

    if not required_mode:
        return True

    if required_mode == "ANY":
        return True

    return (
        internship.work_mode
        == required_mode
    )


def passes_paid_filter(
    internship,
    preferences,
):
    if not preferences:
        return True

    if not preferences.paid_only:
        return True

    return internship.is_paid is True


def passes_type_filter(
    internship,
    preferences,
):
    if not preferences:
        return True

    required_type = (
        preferences.internship_type
    )

    if not required_type:
        return True

    return (
        internship.internship_type
        == required_type
    )



def passes_salary_filter(
    internship,
    preferences,
):
    if not preferences:
        return True

    if not internship.is_paid:
        return not preferences.paid_only

    minimum = (
        preferences.min_paid
    )

    maximum = (
        preferences.max_paid
    )

    if (
        minimum is not None
        and internship.max_paid is not None
        and internship.max_paid < minimum
    ):
        return False

    if (
        maximum is not None
        and internship.min_paid is not None
        and internship.min_paid > maximum
    ):
        return False

    return True


def passes_hard_filters(
    internship,
    preferences,
):
    return all([
        passes_work_mode_filter(
            internship,
            preferences,
        ),
        passes_paid_filter(
            internship,
            preferences,
        ),
        passes_type_filter(
            internship,
            preferences,
        ),
        passes_salary_filter(
            internship,
            preferences,
        ),
    ])


def calculate_work_mode_score(
    internship,
    preferences,
):
    if not preferences:
        return 0.0

    preferred = (
        preferences.work_mode
    )

    if not preferred:
        return 0.0

    if preferred == "ANY":
        return 1.0

    if internship.work_mode == preferred:
        return 1.0

    return 0.0



def calculate_location_score(
    internship,
    profile,
):
    if not profile:
        return 0.0

    student_country = (
        profile.country
    )

    student_city = (
        profile.city
    )

    if not student_country:
        return 0.0

    if (
        internship.country
        != student_country
    ):
        return 0.0

    if (
        student_city
        and internship.city
        == student_city
    ):
        return 1.0

    return 0.5


def calculate_salary_score(
    internship,
    preferences,
):
    if not preferences:
        return 0.0

    if not internship.is_paid:
        return 0.0

    minimum = (
        preferences.min_paid
    )

    maximum = (
        preferences.max_paid
    )

    if (
        minimum is None
        and maximum is None
    ):
        return 0.5

    internship_min = (
        internship.min_paid or 0
    )

    internship_max = (
        internship.max_paid
        or internship_min
    )

    if maximum is not None:
        if internship_min > maximum:
            return 0.0

    if minimum is not None:
        if internship_max < minimum:
            return 0.0

    return 1.0


def calculate_preference_score(
    internship,
    preferences,
    profile,
):
    work_mode = (
        calculate_work_mode_score(
            internship,
            preferences,
        )
    )

    location = (
        calculate_location_score(
            internship,
            profile,
        )
    )

    salary = (
        calculate_salary_score(
            internship,
            preferences,
        )
    )

    return (
        work_mode * 0.4
        + location * 0.3
        + salary * 0.3
    )


def calculate_final_score(
    semantic_score,
    skill_score,
    preference_score,
    location_score,
    salary_score,
):
    score = (
        semantic_score
        * SEMANTIC_WEIGHT
        +
        skill_score
        * SKILL_WEIGHT
        +
        preference_score
        * PREFERENCE_WEIGHT
        +
        location_score
        * LOCATION_WEIGHT
        +
        salary_score
        * SALARY_WEIGHT
    )

    return round(
        score * 100,
        2,
    )



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
            "Your profile is highly "
            "similar to this internship."
        )
    elif semantic_score >= 0.60:
        explanation.append(
            "Your profile is semantically "
            "relevant to this internship."
        )

    if skill_score >= 0.70:
        explanation.append(
            "Strong match with your "
            "technical skills."
        )
    elif skill_score >= 0.40:
        explanation.append(
            "Several of your skills "
            "match this internship."
        )

    if matched_skills:
        explanation.append(
            "Matching skills: "
            + ", ".join(
                matched_skills[:5]
            )
        )

    if preference_score >= 0.80:
        explanation.append(
            "This internship matches "
            "your stated preferences."
        )

    return explanation


def save_recommendation(
    student,
    internship,
    overall_score,
    skill_score,
    location_score,
    preference_score,
):
    """
    Save recommendation to database with score breakdown.
    Returns the created Recommendation instance.
    """
    try:
        recommendation, created = Recommendation.objects.get_or_create(
            student=student,
            internship=internship,
            defaults={
                "overall_score": overall_score,
                "skill_score": skill_score * 100 if skill_score else None,
                "location_score": location_score * 100 if location_score else None,
                "interest_score": preference_score * 100 if preference_score else None,
            }
        )

        # If recommendation already exists, update the scores
        if not created:
            recommendation.overall_score = overall_score
            recommendation.skill_score = skill_score * 100 if skill_score else None
            recommendation.location_score = location_score * 100 if location_score else None
            recommendation.interest_score = preference_score * 100 if preference_score else None
            recommendation.save(update_fields=[
                "overall_score",
                "skill_score",
                "location_score",
                "interest_score",
                "updated_at",
            ])

        return recommendation
    except Exception as e:
        # Log error but don't crash the recommendation generation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Failed to save recommendation: {e}")
        return None


def generate_recommendations(
    student,
    internships,
    save_to_db=True,
):
    profile = (
        student.student_profile
    )

    preferences = (
        getattr(
            profile,
            "internship_preference",
            None,
        )
    )

    student_skills = list(
        profile.skills.values_list(
            "name",
            flat=True,
        )
    )

    results = []

    for internship in internships:

        # -----------------------------
        # HARD FILTERS
        # -----------------------------

        if not passes_hard_filters(
            internship,
            preferences,
        ):
            continue

        # -----------------------------
        # SEMANTIC
        # -----------------------------

        semantic_score = (
            calculate_semantic_score(
                profile.embedding,
                internship.embedding,
            )
        )

        # -----------------------------
        # SKILLS
        # -----------------------------

        internship_skills = list(
            internship.required_skills.values_list(
                "name",
                flat=True,
            )
        )

        skill_score = (
            calculate_skill_score(
                student_skills,
                internship_skills,
            )
        )

        matched_skills = (
            get_matched_skills(
                student_skills,
                internship_skills,
            )
        )

        # -----------------------------
        # PREFERENCES
        # -----------------------------

        preference_score = (
            calculate_preference_score(
                internship,
                preferences,
                profile,
            )
        )

        location_score = (
            calculate_location_score(
                internship,
                profile,
            )
        )

        salary_score = (
            calculate_salary_score(
                internship,
                preferences,
            )
        )

        # -----------------------------
        # FINAL SCORE
        # -----------------------------

        final_score = (
            calculate_final_score(
                semantic_score,
                skill_score,
                preference_score,
                location_score,
                salary_score,
            )
        )

        explanation = (
            build_explanation(
                semantic_score,
                skill_score,
                preference_score,
                matched_skills,
                internship,
            )
        )

        # -----------------------------
        # SAVE TO DATABASE
        # -----------------------------
        if save_to_db:
            save_recommendation(
                student=student,
                internship=internship,
                overall_score=final_score,
                skill_score=skill_score,
                location_score=location_score,
                preference_score=preference_score,
            )

        results.append(
            RecommendationResult(
                internship=internship,
                score=final_score,
                explanation=explanation,
            )
        )

    results.sort(
        key=lambda result: result.score,
        reverse=True,
    )

    return results