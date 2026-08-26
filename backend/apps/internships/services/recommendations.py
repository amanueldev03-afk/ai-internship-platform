from .recommendation_engine_v2 import generate_recommendations


def get_student_recommendations(
    student_profile,
    internships,
    save_to_db=False,
):
    """
    Generate hybrid student recommendations using recommendation_engine_v2.
    """
    student = getattr(student_profile, "user", None)
    if not student:
        return []

    rec_results = generate_recommendations(
        student=student,
        internships=internships,
        save_to_db=save_to_db,
    )

    recommendations = []
    for res in rec_results:
        recommendations.append(
            {
                "internship": res.internship,
                "score": res.score,
                "score_breakdown": res.score_breakdown,
                "explanation": res.explanation,
            }
        )

    return recommendations