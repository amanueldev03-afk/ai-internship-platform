from apps.internships.models import Skill


def sync_cv_skills_to_profile(
    student_profile,
    extracted_skills,
    source="manual",
):
    """
    Synchronize CV-extracted skills with
    the student's existing skills.

    Args:
        student_profile: The StudentProfile instance
        extracted_skills: List of skill names extracted from CV
        source: Source of the skills - "manual" or "resume" (default: "manual")
                 Phase 6 Task 6.1: Resume-extracted skills are marked with source='resume'
    """

    if not extracted_skills:
        return

    from apps.students.models import StudentSkill

    skills = []

    for skill_name in extracted_skills:

        skill, _ = Skill.objects.get_or_create(
            name=skill_name
        )

        skills.append(skill)

    # Create StudentSkill entries with the specified source
    # This replaces the simple M2M set() to allow tracking the source
    student_profile.skills.clear()
    for skill in skills:
        StudentSkill.objects.create(
            student=student_profile.student,
            skill=skill,
            source=source,
        )