from functools import lru_cache

from django.conf import settings
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity


@lru_cache(maxsize=1)
def get_embedding_model():
    """
    Load the Sentence Transformer model once.
    """

    return SentenceTransformer(
        settings.EMBEDDING_MODEL_NAME
    )


def generate_embedding(text):
    """
    Convert text into an embedding vector.
    """

    if not text:
        return []

    model = get_embedding_model()

    embedding = model.encode(
        text,
        normalize_embeddings=True,
    )

    return embedding.tolist()


def build_student_text(student_profile):
    """
    Build semantic text for a student.
    """

    parts = []

    if hasattr(student_profile, "skills"):

        skills = list(
            student_profile.skills.values_list(
                "name",
                flat=True,
            )
        )

        if skills:
            parts.append(
                "Skills: "
                + ", ".join(skills)
            )

    if getattr(
        student_profile,
        "bio",
        None,
    ):
        parts.append(
            "Profile: "
            + student_profile.bio
        )

    if getattr(
        student_profile,
        "country",
        None,
    ):
        parts.append(
            "Country: "
            + student_profile.country
        )

    if getattr(
        student_profile,
        "city",
        None,
    ):
        parts.append(
            "City: "
            + student_profile.city
        )

    return "\n".join(parts)


def build_internship_text(internship):
    """
    Build semantic text for an internship.
    """

    parts = []

    if getattr(
        internship,
        "title",
        None,
    ):
        parts.append(
            "Title: "
            + internship.title
        )

    if getattr(
        internship,
        "description",
        None,
    ):
        parts.append(
            "Description: "
            + internship.description
        )

    if hasattr(
        internship,
        "required_skills",
    ):

        skills = list(
            internship.required_skills.values_list(
                "name",
                flat=True,
            )
        )

        if skills:
            parts.append(
                "Required skills: "
                + ", ".join(skills)
            )

    if getattr(
        internship,
        "category",
        None,
    ):
        parts.append(
            "Category: "
            + internship.category
        )

    if getattr(
        internship,
        "internship_type",
        None,
    ):
        parts.append(
            "Internship type: "
            + internship.internship_type
        )

    if getattr(
        internship,
        "work_type",
        None,
    ):
        parts.append(
            "Work type: "
            + internship.work_type
        )

    location_parts = []
    if getattr(
        internship,
        "country",
        None,
    ):
        location_parts.append(internship.country)
    
    if getattr(
        internship,
        "city",
        None,
    ):
        location_parts.append(internship.city)
    
    if location_parts:
        parts.append(
            "Location: "
            + ", ".join(location_parts)
        )

    return "\n".join(parts)


def generate_student_embedding(
    student_profile,
):
    """
    Generate student's embedding.
    """

    text = build_student_text(
        student_profile
    )

    return generate_embedding(text)


def generate_internship_embedding(
    internship,
):
    """
    Generate internship embedding.
    """

    text = build_internship_text(
        internship
    )

    return generate_embedding(text)


def calculate_semantic_similarity(
    student_embedding,
    internship_embedding,
):
    """
    Calculate cosine similarity.
    """

    if not student_embedding:
        return 0.0

    if not internship_embedding:
        return 0.0

    similarity = cosine_similarity(
        [student_embedding],
        [internship_embedding],
    )[0][0]

    score = similarity * 100

    return round(
        max(
            0.0,
            min(100.0, score),
        ),
        2,
    )


def update_student_embedding(
    student_profile,
):
    """
    Generate and store student's embedding.
    """

    embedding = generate_student_embedding(
        student_profile
    )

    if not validate_embedding(
        embedding
    ):
        raise ValueError(
            "Invalid student embedding."
        )

    student_profile.embedding = embedding

    student_profile.save(
        update_fields=["embedding"]
    )

    return embedding


def update_internship_embedding(
    internship,
):
    """
    Generate and store internship embedding.
    """

    embedding = generate_internship_embedding(
        internship
    )

    if not validate_embedding(
        embedding
    ):
        raise ValueError(
            "Invalid internship embedding."
        )

    internship.embedding = embedding

    internship.save(
        update_fields=["embedding"]
    )

    return embedding


def get_student_embedding(
    student_profile,
):
    """
    Get stored student embedding.
    """

    if not student_profile.embedding:

        return update_student_embedding(
            student_profile
        )

    return student_profile.embedding


def get_internship_embedding(
    internship,
):
    """
    Get stored internship embedding.
    """

    if not internship.embedding:

        return update_internship_embedding(
            internship
        )

    return internship.embedding


def calculate_stored_semantic_similarity(
    student_profile,
    internship,
):
    """
    Calculate semantic similarity using
    stored embeddings.
    """

    student_embedding = (
        get_student_embedding(
            student_profile
        )
    )

    internship_embedding = (
        get_internship_embedding(
            internship
        )
    )

    return calculate_semantic_similarity(
        student_embedding,
        internship_embedding,
    )


EMBEDDING_DIMENSION = 384


def validate_embedding(
    embedding,
):
    """
    Validate embedding dimensions.
    """

    if not embedding:
        return False

    return len(embedding) == (
        EMBEDDING_DIMENSION
    )