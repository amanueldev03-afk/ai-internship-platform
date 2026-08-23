from .preference_matching import (
    calculate_preference_match,
)


from .preference_matching import (
    calculate_preference_match,
)


def get_student_recommendations(
    student_profile,
    internships,
):
    recommendations = []

    for internship in internships:

        result = calculate_preference_match(
            student_profile,
            internship,
        )

        if not result["eligible"]:
            continue

        recommendations.append(
            {
                "internship": internship,
                "score": result["score"],
                "scores": result["scores"],
                "explanation": (
                    result["explanation"]
                ),
            }
        )

    recommendations.sort(
        key=lambda item: item["score"],
        reverse=True,
    )

    return recommendations