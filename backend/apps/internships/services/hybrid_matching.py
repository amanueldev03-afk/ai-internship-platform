from django.conf import settings

from .preference_matching import (
    calculate_preference_match,
)

from .semantic_matching import (
    calculate_stored_semantic_similarity,
)


def calculate_hybrid_match(
    student_profile,
    internship,
):
    """
    Combine rule-based preference matching
    with AI semantic matching.
    """

    preference_result = (
        calculate_preference_match(
            student_profile,
            internship,
        )
    )

    if not preference_result["eligible"]:
        return {
            "eligible": False,
            "score": 0.0,
        }

    preference_score = (
        preference_result["score"]
    )

    semantic_score = (
        calculate_stored_semantic_similarity(
            student_profile,
            internship,
        )
    )

    preference_weight = (
        settings.PREFERENCE_MATCH_WEIGHT
    )

    semantic_weight = (
        settings.SEMANTIC_MATCH_WEIGHT
    )

    final_score = (
        preference_score
        * preference_weight
        +
        semantic_score
        * semantic_weight
    )

    return {
        "eligible": True,
        "score": round(
            final_score,
            2,
        ),
        "preference_score": round(
            preference_score,
            2,
        ),
        "semantic_score": round(
            semantic_score,
            2,
        ),
        "score_breakdown": (
            preference_result[
                "scores"
            ]
        ),
        "explanation": (
            preference_result[
                "explanation"
            ]
        ),
    }