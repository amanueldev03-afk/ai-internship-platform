from .semantic_matching import (
    update_internship_embedding,
)


def generate_internship_embedding_if_needed(
    internship,
):
    """
    Generate an internship embedding if it
    does not already exist.
    """

    if internship.embedding:
        return internship.embedding

    return update_internship_embedding(
        internship
    )


def regenerate_internship_embedding(
    internship,
):
    """
    Always regenerate the internship embedding.
    """

    return update_internship_embedding(
        internship
    )



from .semantic_matching import (
    update_student_embedding,
)


def generate_student_embedding_if_needed(
    student_profile,
):
    """
    Generate a student embedding if it does
    not already exist.
    """

    if student_profile.embedding:
        return student_profile.embedding

    return update_student_embedding(
        student_profile
    )


def regenerate_student_embedding(
    student_profile,
):
    """
    Always regenerate the student's embedding.
    """

    return update_student_embedding(
        student_profile
    )