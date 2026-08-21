from decimal import Decimal


WEIGHTS = {
    "skills": 0.40,
    "work_mode": 0.15,
    "payment": 0.15,
    "location": 0.10,
    "internship_type": 0.10,
    "industry": 0.05,
    "duration": 0.05,
}


def calculate_skill_score(
    student_profile,
    internship,
):
    """
    Calculate skill compatibility from 0 to 100.
    """

    required_skill_ids = set(
        internship.required_skills.values_list(
            "id",
            flat=True,
        )
    )

    if not required_skill_ids:
        return 0.0

    student_skill_ids = set(
        student_profile.skills.values_list(
            "id",
            flat=True,
        )
    )

    matched_skills = (
        required_skill_ids
        & student_skill_ids
    )

    return round(
        (
            len(matched_skills)
            / len(required_skill_ids)
        ) * 100,
        2,
    )

def calculate_work_mode_score(
    student_profile,
    internship,
):
    preferred_modes = set(
        student_profile.preferred_work_modes
        or []
    )

    if not preferred_modes:
        return 50.0

    internship_mode = internship.work_mode

    if internship_mode in preferred_modes:
        return 100.0

    return 0.0


def calculate_location_score(
    student_profile,
    internship,
):
    preferred_locations = {
        location.lower()
        for location
        in (
            student_profile.preferred_locations
            or []
        )
    }

    if not preferred_locations:
        return 50.0

    internship_location = (
        internship.location or ""
    ).lower()

    if internship_location in preferred_locations:
        return 100.0

    if "remote" in preferred_locations:
        if internship.work_mode == "remote":
            return 100.0

    return 0.0

def calculate_payment_score(
    student_profile,
    internship,
):
    preference = (
        student_profile.payment_preference
        or "any"
    )

    internship_payment_type = (
        internship.payment_type
    )

    if preference == "any":
        return 100.0

    if (
        preference == "paid"
        and internship_payment_type != "paid"
    ):
        return 0.0

    if (
        preference == "unpaid"
        and internship_payment_type != "unpaid"
    ):
        return 0.0

    if preference == "unpaid":
        return 100.0

    student_min = (
        student_profile.minimum_payment
    )

    student_max = (
        student_profile.maximum_payment
    )

    internship_min = (
        internship.min_payment
    )

    internship_max = (
        internship.max_payment
    )

    if (
        student_min is None
        or student_max is None
        or internship_min is None
        or internship_max is None
    ):
        return 100.0

    if (
        internship_max < student_min
        or internship_min > student_max
    ):
        return 0.0

    return 100.0


def calculate_internship_type_score(
    student_profile,
    internship,
):
    preferred_types = set(
        student_profile.preferred_internship_types
        or []
    )

    if not preferred_types:
        return 50.0

    if internship.internship_type in preferred_types:
        return 100.0

    return 0.0

def calculate_industry_score(
    student_profile,
    internship,
):
    preferred_industries = {
        industry.lower()
        for industry
        in (
            student_profile.preferred_industries
            or []
        )
    }

    if not preferred_industries:
        return 50.0

    internship_industry = (
        internship.industry or ""
    ).lower()

    if internship_industry in preferred_industries:
        return 100.0

    return 0.0


def calculate_duration_score(
    student_profile,
    internship,
):
    student_min = (
        student_profile.preferred_duration_min
    )

    student_max = (
        student_profile.preferred_duration_max
    )

    internship_min = (
        internship.duration_min
    )

    internship_max = (
        internship.duration_max
    )

    if (
        student_min is None
        or student_max is None
        or internship_min is None
        or internship_max is None
    ):
        return 50.0

    if (
        internship_max < student_min
        or internship_min > student_max
    ):
        return 0.0

    return 100.0


def passes_hard_filters(
    student_profile,
    internship,
):
    """
    Determine whether an internship should be
    considered at all.
    """

    if internship.status != "active":
        return False

    if (
        student_profile.payment_preference
        == "paid"
        and internship.payment_type != "paid"
    ):
        return False

    if (
        student_profile.payment_preference
        == "unpaid"
        and internship.payment_type != "unpaid"
    ):
        return False

    return True



def calculate_preference_match(
    student_profile,
    internship,
):
    """
    Calculate the complete preference match.
    """

    if not passes_hard_filters(
        student_profile,
        internship,
    ):
        return {
            "eligible": False,
            "score": 0.0,
            "reason": (
                "Internship does not satisfy "
                "required conditions."
            ),
        }

    scores = {
        "skills": calculate_skill_score(
            student_profile,
            internship,
        ),

        "work_mode": calculate_work_mode_score(
            student_profile,
            internship,
        ),

        "payment": calculate_payment_score(
            student_profile,
            internship,
        ),

        "location": calculate_location_score(
            student_profile,
            internship,
        ),

        "internship_type": (
            calculate_internship_type_score(
                student_profile,
                internship,
            )
        ),

        "industry": calculate_industry_score(
            student_profile,
            internship,
        ),

        "duration": calculate_duration_score(
            student_profile,
            internship,
        ),
    }

    final_score = sum(
        scores[key] * WEIGHTS[key]
        for key in scores
    )

    return {
        "eligible": True,
        "score": round(
            final_score,
            2,
        ),
        "scores": scores,
    }