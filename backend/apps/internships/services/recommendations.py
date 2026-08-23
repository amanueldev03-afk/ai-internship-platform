from .preference_matching import (
    calculate_preference_match,
)

from .hybrid_matching import (
    calculate_hybrid_match,
)


def get_student_recommendations(
    student_profile,
    internships,
):
    """
    Generate hybrid recommendations.
    """

    recommendations = []

    for internship in internships:

        result = calculate_hybrid_match(
            student_profile,
            internship,
        )

        if not result["eligible"]:
            continue

        recommendations.append(
            {
                "internship": internship,
                "score": result["score"],
                "preference_score": (
                    result[
                        "preference_score"
                    ]
                ),
                "semantic_score": (
                    result[
                        "semantic_score"
                    ]
                ),
                "score_breakdown": (
                    result[
                        "score_breakdown"
                    ]
                ),
                "explanation": (
                    result[
                        "explanation"
                    ]
                ),
            }
        )

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return recommendations