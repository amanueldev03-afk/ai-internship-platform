import logging
from dataclasses import dataclass, field

from .semantic_matching import (
    calculate_semantic_similarity,
    update_student_embedding,
    update_internship_embedding,
)

logger = logging.getLogger(__name__)


@dataclass
class RecommendationResult:
    internship: object
    score: float                        # 0.0 – 100.0 final weighted score
    explanation: list[str]
    score_breakdown: dict = field(default_factory=dict)


# --------------------------------------------------
# Weights  (must sum to 1.0)
# --------------------------------------------------
SEMANTIC_WEIGHT   = 0.40
SKILL_WEIGHT      = 0.25
PREFERENCE_WEIGHT = 0.20
LOCATION_WEIGHT   = 0.10
SALARY_WEIGHT     = 0.05


# --------------------------------------------------
# Individual score functions  (all return 0.0 – 1.0)
# --------------------------------------------------

def calculate_skill_score(student_skills, internship_skills):
    """
    Name-based intersection.
    Returns 0.0–1.0.  If no required skills → neutral 0.5.
    """
    student    = {s.lower().strip() for s in student_skills if s}
    internship = {s.lower().strip() for s in internship_skills if s}

    if not internship:
        return 0.5          # no requirements — neutral, not penalised

    matched = student & internship
    return len(matched) / len(internship)


def get_matched_skills(student_skills, internship_skills):
    s_map = {s.lower().strip(): s for s in student_skills if s}
    i_map = {s.lower().strip(): s for s in internship_skills if s}
    return [s_map[k] for k in sorted(s_map.keys() & i_map.keys())]


def _get_embedding(obj, attr, updater):
    """
    Return the stored embedding for `obj`.
    If it is missing/null, regenerate it on-the-fly and save.
    Always fetches from DB so we never use a stale ORM-cached value.
    """
    # Refresh from DB to get the latest embedding column value
    obj.refresh_from_db(fields=[attr])
    embedding = getattr(obj, attr, None)

    if not embedding:
        try:
            embedding = updater(obj)
        except Exception as e:
            logger.warning(f"Could not generate embedding for {obj}: {e}")
            embedding = None

    return embedding


def calculate_semantic_score(profile, internship):
    """
    40% weight.  Returns 0.0–1.0.
    Always reads the freshest stored embeddings.
    """
    student_embedding    = _get_embedding(profile,    "embedding", update_student_embedding)
    internship_embedding = _get_embedding(internship, "embedding", update_internship_embedding)

    if not student_embedding or not internship_embedding:
        return 0.0

    similarity = calculate_semantic_similarity(student_embedding, internship_embedding)
    return max(0.0, min(1.0, similarity / 100.0))


def passes_hard_filters(internship, profile):
    """
    Hard constraints — return False to exclude the internship entirely.
    """
    if not profile:
        return True

    if getattr(internship, "status", "active") != "active":
        return False

    # Internship type (remote / onsite / hybrid / any)
    pref_type = getattr(profile, "internship_type", "any") or "any"
    if pref_type != "any":
        if getattr(internship, "internship_type", None) != pref_type:
            return False

    # Compensation hard filter
    comp_pref = getattr(profile, "compensation_preference", "either") or "either"
    internship_comp = getattr(internship, "compensation_type", "unknown")
    if comp_pref == "paid"   and internship_comp == "unpaid":
        return False
    if comp_pref == "unpaid" and internship_comp == "paid":
        return False

    return True


def calculate_work_mode_score(internship, profile):
    """Returns 0.0–1.0."""
    if not profile:
        return 0.5

    pref = getattr(profile, "work_type", "either") or "either"
    actual = getattr(internship, "work_type", None)

    if pref in ("either", ""):
        return 1.0
    return 1.0 if actual == pref else 0.0


def calculate_location_score(internship, profile):
    """
    10% weight.  Returns 0.0–1.0.
    Scoring ladder:
      1.0 — exact city match, or remote, or willing_to_relocate
      0.75 — preferred-location match
      0.5  — same country, different city
      0.0  — no match
    """
    if not profile:
        return 0.5

    s_country  = (getattr(profile,    "country",  "") or "").lower().strip()
    s_city     = (getattr(profile,    "city",     "") or "").lower().strip()
    i_country  = (getattr(internship, "country",  "") or "").lower().strip()
    i_city     = (getattr(internship, "city",     "") or "").lower().strip()
    i_type     = getattr(internship,  "internship_type", "") or ""

    pref_locs = [
        loc.lower().strip()
        for loc in (getattr(profile, "preferred_locations", []) or [])
        if loc
    ]

    if s_city and i_city and s_city == i_city:
        return 1.0
    if i_type == "remote" or getattr(profile, "willing_to_relocate", False):
        return 1.0
    for loc in pref_locs:
        if loc and (loc in i_city or loc in i_country):
            return 0.75
    if s_country and i_country and s_country == i_country:
        return 0.5

    return 0.0


def calculate_salary_score(internship, profile):
    """
    5% weight.  Returns 0.0–1.0.
    """
    if not profile:
        return 0.5

    comp_pref   = getattr(profile,    "compensation_preference", "either") or "either"
    i_comp_type = getattr(internship, "compensation_type",       "unknown") or "unknown"

    if comp_pref == "either":
        return 1.0

    if comp_pref == "paid":
        if i_comp_type != "paid":
            return 0.0
        # Both want paid — check range overlap
        s_min = getattr(profile,    "minimum_compensation", None)
        s_max = getattr(profile,    "maximum_compensation", None)
        i_min = getattr(internship, "minimum_compensation", None)
        i_max = getattr(internship, "maximum_compensation", None)
        # No range info → assume match
        if s_min is None:
            return 1.0
        if i_max is not None and float(i_max) >= float(s_min):
            return 1.0
        if s_max is not None and i_min is not None and float(i_min) > float(s_max):
            return 0.0
        return 0.5

    if comp_pref == "unpaid":
        return 1.0 if i_comp_type == "unpaid" else 0.5

    return 0.5


def calculate_preference_score(internship, profile):
    """
    20% weight — average of work-mode, location, salary.
    Returns 0.0–1.0.
    """
    work_mode = calculate_work_mode_score(internship, profile)
    location  = calculate_location_score(internship, profile)
    salary    = calculate_salary_score(internship, profile)
    return round((work_mode + location + salary) / 3.0, 4)


def calculate_final_score(semantic, skill, preference, location, salary):
    """
    Weighted sum of five 0–1 component scores.
    Returns a single score in 0.0–100.0.
    """
    raw = (
        semantic   * SEMANTIC_WEIGHT
        + skill    * SKILL_WEIGHT
        + preference * PREFERENCE_WEIGHT
        + location * LOCATION_WEIGHT
        + salary   * SALARY_WEIGHT
    )
    return round(min(100.0, max(0.0, raw * 100)), 2)


def build_explanation(semantic, skill, preference, location, salary, matched_skills, internship):
    """
    Human-readable explanation strings based on component scores (all 0–1).
    """
    lines = []

    # Semantic
    if semantic >= 0.80:
        lines.append("Your CV and profile content are highly similar to this internship.")
    elif semantic >= 0.60:
        lines.append("Your profile is semantically relevant to this internship description.")
    elif semantic > 0.0:
        lines.append("Partial semantic match with this internship.")

    # Skills
    if matched_skills:
        lines.append(f"Matching skills: {', '.join(matched_skills[:5])}.")
    if skill >= 0.70:
        lines.append("Strong match with the required technical skills.")
    elif skill >= 0.40:
        lines.append("Several of your skills match this internship.")
    elif skill > 0.0:
        lines.append("Some skill overlap with this internship.")

    # Preference (work mode + location + salary combined)
    if preference >= 0.80:
        lines.append("This internship aligns well with your preferences.")
    elif preference >= 0.50:
        lines.append("This internship partially matches your preferences.")

    # Location
    if location == 1.0:
        lines.append("Location is a great match (remote or your city/country).")
    elif location == 0.75:
        lines.append("Location matches one of your preferred locations.")
    elif location == 0.5:
        lines.append("Same country as your current location.")

    # Salary
    if salary == 1.0 and getattr(internship, "compensation_type", "") == "paid":
        lines.append("Compensation range matches your expectations.")

    if not lines:
        lines.append("This internship was included based on your overall profile match.")

    return lines


# --------------------------------------------------
# Persistence
# --------------------------------------------------

def save_recommendation(student, internship, overall_score,
                        semantic, skill, preference, location, salary):
    """
    Upsert a Recommendation row — update scores but preserve feedback status.
    All component scores stored as 0–100.
    """
    from apps.recommendations.models import Recommendation

    try:
        defaults = {
            "overall_score":    overall_score,
            "semantic_score":   round(semantic   * 100, 2),
            "skill_score":      round(skill      * 100, 2),
            "preference_score": round(preference * 100, 2),
            "location_score":   round(location   * 100, 2),
            "salary_score":     round(salary     * 100, 2),
            "interest_score":   round(preference * 100, 2),  # alias
        }

        rec, created = Recommendation.objects.get_or_create(
            student=student,
            internship=internship,
            defaults=defaults,
        )

        if not created:
            for k, v in defaults.items():
                setattr(rec, k, v)
            rec.save(update_fields=list(defaults.keys()) + ["updated_at"])

        return rec

    except Exception as e:
        logger.error(f"Failed to save recommendation for internship {internship.id}: {e}")
        return None


# --------------------------------------------------
# Helpers to pull merged student skills
# --------------------------------------------------

def _get_student_skills(profile):
    """
    Merge profile skills (manual) + CV extracted skills.
    Returns a deduplicated list of lowercase-trimmed names.
    """
    skills = list(profile.skills.values_list("name", flat=True))

    user = getattr(profile, "user", None)
    if user:
        try:
            from apps.student_profiles.models import CV as CVModel, StudentCV

            # Prefer newest completed CV
            completed_cv = (
                CVModel.objects
                .filter(student=user, processing_status=CVModel.STATUS_COMPLETED)
                .order_by("-created_at")
                .first()
            )
            cv_source = completed_cv
            if not cv_source:
                cv_source = StudentCV.objects.filter(student=user).first()

            if cv_source and isinstance(getattr(cv_source, "extracted_skills", None), list):
                skills.extend(cv_source.extracted_skills)
        except Exception:
            pass

    # Deduplicate while preserving case of first occurrence
    seen = set()
    merged = []
    for s in skills:
        key = s.lower().strip()
        if key and key not in seen:
            seen.add(key)
            merged.append(s)
    return merged


# --------------------------------------------------
# Main entry point
# --------------------------------------------------

def generate_recommendations(student, internships, save_to_db=True):
    """
    Score every active internship for this student and return a ranked list.

    Scoring:
      40 % Semantic  (embedding cosine similarity)
      25 % Skills    (name-based overlap, merged profile + CV)
      20 % Preference(work-mode + location + salary average)
      10 % Location  (city / country / remote / preferred-location)
       5 % Salary    (compensation type + range overlap)
    """
    # Always reload the profile fresh so we never score against a stale ORM object
    from apps.student_profiles.models import StudentProfile
    try:
        profile = (
            StudentProfile.objects
            .prefetch_related("skills")
            .select_related("user")
            .get(user=student)
        )
    except StudentProfile.DoesNotExist:
        logger.warning(f"No StudentProfile found for user {student.id}")
        return []

    student_skills = _get_student_skills(profile)

    results = []

    for internship in internships:
        # ---- hard filters ----
        if not passes_hard_filters(internship, profile):
            continue

        # ---- 1. semantic (40 %) — fetches fresh embeddings ----
        semantic = calculate_semantic_score(profile, internship)

        # ---- 2. skills (25 %) ----
        i_skills      = list(internship.required_skills.values_list("name", flat=True))
        skill         = calculate_skill_score(student_skills, i_skills)
        matched_skills = get_matched_skills(student_skills, i_skills)

        # ---- 3. preference (20 %) ----
        preference = calculate_preference_score(internship, profile)

        # ---- 4. location (10 %) ----
        location = calculate_location_score(internship, profile)

        # ---- 5. salary (5 %) ----
        salary = calculate_salary_score(internship, profile)

        # ---- final score ----
        final_score = calculate_final_score(semantic, skill, preference, location, salary)

        # ---- explanation ----
        explanation = build_explanation(
            semantic, skill, preference, location, salary,
            matched_skills, internship,
        )

        # ---- breakdown (0–100 per component, with weight label) ----
        score_breakdown = {
            "semantic_score":   round(semantic   * 100, 2),
            "skill_score":      round(skill      * 100, 2),
            "preference_score": round(preference * 100, 2),
            "location_score":   round(location   * 100, 2),
            "salary_score":     round(salary     * 100, 2),
            "weights": {
                "semantic":   f"{int(SEMANTIC_WEIGHT   * 100)}%",
                "skill":      f"{int(SKILL_WEIGHT      * 100)}%",
                "preference": f"{int(PREFERENCE_WEIGHT * 100)}%",
                "location":   f"{int(LOCATION_WEIGHT   * 100)}%",
                "salary":     f"{int(SALARY_WEIGHT     * 100)}%",
            },
        }

        if save_to_db:
            save_recommendation(
                student, internship, final_score,
                semantic, skill, preference, location, salary,
            )

        results.append(RecommendationResult(
            internship=internship,
            score=final_score,
            explanation=explanation,
            score_breakdown=score_breakdown,
        ))

    results.sort(key=lambda r: r.score, reverse=True)
    return results
