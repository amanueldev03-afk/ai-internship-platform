from apps.internships.models import Skill


def sync_cv_skills_to_profile(
    student_profile,
    extracted_skills,
):
    """
    Synchronize CV-extracted skills with
    the student's existing skills.
    """

    if not extracted_skills:
        return

    skills = []

    for skill_name in extracted_skills:

        skill, _ = Skill.objects.get_or_create(
            name=skill_name
        )

        skills.append(skill)

    student_profile.skills.set(
        skills
    )