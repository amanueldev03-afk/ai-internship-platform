import json

from django.conf import settings
from openai import OpenAI

from .skill_normalization import normalize_skills


def get_openai_client():
    """
    Return an OpenAI client if configured.
    """

    api_key = getattr(
        settings,
        "OPENAI_API_KEY",
        None,
    )

    if not api_key:
        return None

    return OpenAI(
        api_key=api_key
    )


CV_ANALYSIS_SCHEMA = {
    "type": "object",
    "properties": {
        "skills": {
            "type": "array",
            "items": {
                "type": "string"
            }
        },
        "education": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "degree": {
                        "type": "string"
                    },
                    "institution": {
                        "type": "string"
                    },
                    "field": {
                        "type": "string"
                    },
                    "start_year": {
                        "type": [
                            "integer",
                            "null"
                        ]
                    },
                    "end_year": {
                        "type": [
                            "integer",
                            "null"
                        ]
                    }
                },
                "required": [
                    "degree",
                    "institution",
                    "field",
                    "start_year",
                    "end_year"
                ],
                "additionalProperties": False
            }
        },
        "experience": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "title": {
                        "type": "string"
                    },
                    "company": {
                        "type": "string"
                    },
                    "description": {
                        "type": "string"
                    }
                },
                "required": [
                    "title",
                    "company",
                    "description"
                ],
                "additionalProperties": False
            }
        },
        "projects": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "name": {
                        "type": "string"
                    },
                    "description": {
                        "type": "string"
                    },
                    "technologies": {
                        "type": "array",
                        "items": {
                            "type": "string"
                        }
                    }
                },
                "required": [
                    "name",
                    "description",
                    "technologies"
                ],
                "additionalProperties": False
            }
        },
        "certifications": {
            "type": "array",
            "items": {
                "type": "string"
            }
        }
    },
    "required": [
        "skills",
        "education",
        "experience",
        "projects",
        "certifications"
    ],
    "additionalProperties": False
}


def build_cv_prompt(cv_text):
    return f"""
Analyze the following student's CV.

Extract only information explicitly supported
by the CV. Do not invent information.

Identify:

1. Technical and professional skills.
2. Education.
3. Work/internship experience.
4. Projects.
5. Certifications.

Normalize obvious variations where appropriate.

For example:

"Django REST Framework"
and
"Django REST API"

may be represented as a consistent skill.

Do not infer a skill merely because another
skill normally accompanies it.

CV:

{cv_text}
"""



def analyze_cv_with_ai(cv_text):
    """
    Analyze CV text using the configured AI model.

    Returns None when AI analysis is unavailable.
    """

    client = get_openai_client()

    if client is None:
        return None

    prompt = build_cv_prompt(
        cv_text
    )

    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "system",
                    "content": "You are a CV analyzer. Extract structured data from CVs in JSON format."
                },
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            response_format={"type": "json_object"},
            temperature=0.3,
        )

        text = response.choices[0].message.content

        if not text:
            return None

        return json.loads(text)

    except Exception:
        return None



def normalize_ai_result(data):
    """
    Ensure AI output has the expected structure.
    """

    if not isinstance(data, dict):
        return None

    return {
        "skills": (
            data.get("skills", [])
            if isinstance(
                data.get("skills", []),
                list,
            )
            else []
        ),
        "education": (
            data.get("education", [])
            if isinstance(
                data.get("education", []),
                list,
            )
            else []
        ),
        "experience": (
            data.get("experience", [])
            if isinstance(
                data.get("experience", []),
                list,
            )
            else []
        ),
        "projects": (
            data.get("projects", [])
            if isinstance(
                data.get("projects", []),
                list,
            )
            else []
        ),
        "certifications": (
            data.get(
                "certifications",
                [],
            )
            if isinstance(
                data.get(
                    "certifications",
                    [],
                ),
                list,
            )
            else []
        ),
    }



def merge_skills(
    basic_skills,
    ai_skills,
):
    """
    Merge deterministic and AI-extracted skills.
    """

    combined = set()

    for skill in basic_skills:
        if isinstance(skill, str):
            combined.add(
                skill.strip()
            )

    for skill in ai_skills:
        if isinstance(skill, str):
            skill = skill.strip()

            if skill:
                combined.add(skill)

    return sorted(combined)



def analyze_cv_intelligently(
    cv_text,
    basic_analysis,
):
    """
    Combine deterministic CV analysis
    with AI analysis.
    """

    ai_result = analyze_cv_with_ai(
        cv_text
    )

    if ai_result is None:
        return basic_analysis

    ai_result = normalize_ai_result(
        ai_result
    )

    if ai_result is None:
        return basic_analysis

    return {
        "skills": normalize_skills(
            merge_skills(
                basic_analysis["skills"],
                ai_result["skills"],
            )
        ),
        "education": ai_result[
            "education"
        ],
        "experience": ai_result[
            "experience"
        ],
        "projects": ai_result[
            "projects"
        ],
        "certifications": ai_result[
            "certifications"
        ],
    }