import re


def normalize_text(text):
    """
    Normalize CV text before analysis.
    """

    if not text:
        return ""

    text = text.replace("\r\n", "\n")
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text)

    return text.strip()



KNOWN_SKILLS = {
    "python": "Python",
    "django": "Django",
    "flask": "Flask",
    "fastapi": "FastAPI",
    "javascript": "JavaScript",
    "typescript": "TypeScript",
    "react": "React",
    "next.js": "Next.js",
    "node.js": "Node.js",
    "java": "Java",
    "spring": "Spring",
    "c++": "C++",
    "c#": "C#",
    "php": "PHP",
    "laravel": "Laravel",
    "sql": "SQL",
    "postgresql": "PostgreSQL",
    "mysql": "MySQL",
    "mongodb": "MongoDB",
    "redis": "Redis",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "git": "Git",
    "github": "GitHub",
    "rest api": "REST API",
    "graphql": "GraphQL",
    "aws": "AWS",
    "azure": "Azure",
    "gcp": "Google Cloud",
    "machine learning": "Machine Learning",
    "deep learning": "Deep Learning",
    "tensorflow": "TensorFlow",
    "pytorch": "PyTorch",
    "scikit-learn": "scikit-learn",
    "pandas": "Pandas",
    "numpy": "NumPy",
    "figma": "Figma",
    "photoshop": "Photoshop",
    "illustrator": "Illustrator",
}


def extract_skills(text):
    """
    Extract known skills from CV text.
    """

    normalized = normalize_text(
        text
    ).lower()

    found_skills = set()

    for keyword, display_name in KNOWN_SKILLS.items():

        pattern = (
            r"(?<!\w)"
            + re.escape(keyword)
            + r"(?!\w)"
        )

        if re.search(
            pattern,
            normalized,
        ):
            found_skills.add(
                display_name
            )

    return sorted(
        found_skills
    )

SECTION_NAMES = {
    "education": [
        "education",
        "academic background",
        "academic history",
    ],
    "experience": [
        "experience",
        "work experience",
        "employment history",
        "professional experience",
    ],
    "projects": [
        "projects",
        "personal projects",
        "academic projects",
    ],
    "certifications": [
        "certifications",
        "certificates",
        "licenses",
    ],
    "skills": [
        "skills",
        "technical skills",
        "technologies",
    ],
}

def detect_section(line):
    """
    Determine whether a line represents
    a known CV section.
    """

    normalized = (
        line.strip()
        .lower()
        .rstrip(":")
    )

    for section, names in (
        SECTION_NAMES.items()
    ):

        if normalized in names:
            return section

    return None


def extract_sections(text):
    """
    Extract common sections from a CV.
    """

    lines = normalize_text(
        text
    ).splitlines()

    sections = {
        "education": [],
        "experience": [],
        "projects": [],
        "certifications": [],
        "skills": [],
    }

    current_section = None

    for line in lines:

        section = detect_section(
            line
        )

        if section:
            current_section = section
            continue

        if current_section:
            sections[
                current_section
            ].append(line.strip())

    return {
        key: "\n".join(value).strip()
        for key, value in sections.items()
    }


def extract_education(text):
    sections = extract_sections(
        text
    )

    return sections["education"]

def extract_experience(text):
    sections = extract_sections(
        text
    )

    return sections["experience"]

def extract_projects(text):
    sections = extract_sections(
        text
    )

    return sections["projects"]

def extract_certifications(text):
    sections = extract_sections(
        text
    )

    return sections[
        "certifications"
    ]


def parse_education(text):
    """Parse education text into structured format."""
    sections = extract_sections(text)
    education_text = sections["education"]
    
    if not education_text:
        return []
    
    # Simple parsing - split by lines and try to extract degree, institution, etc.
    lines = education_text.strip().split('\n')
    education_entries = []
    
    current_entry = {}
    for line in lines:
        line = line.strip()
        if not line:
            if current_entry:
                education_entries.append(current_entry)
                current_entry = {}
            continue
        
        # Try to identify degree, institution, field, years
        if any(keyword in line.lower() for keyword in ['bachelor', 'master', 'phd', 'bsc', 'msc', 'diploma']):
            current_entry['degree'] = line
        elif any(keyword in line.lower() for keyword in ['university', 'college', 'institute', 'school']):
            current_entry['institution'] = line
        elif any(keyword in line.lower() for keyword in ['computer', 'science', 'engineering', 'business', 'arts']):
            current_entry['field'] = line
        elif any(char.isdigit() for char in line):
            current_entry['years'] = line
    
    if current_entry:
        education_entries.append(current_entry)
    
    return education_entries


def parse_experience(text):
    """Parse experience text into structured format."""
    sections = extract_sections(text)
    experience_text = sections["experience"]
    
    if not experience_text:
        return []
    
    lines = experience_text.strip().split('\n')
    experience_entries = []
    
    current_entry = {}
    for line in lines:
        line = line.strip()
        if not line:
            if current_entry:
                experience_entries.append(current_entry)
                current_entry = {}
            continue
        
        # Try to identify title, company, description
        if any(keyword in line.lower() for keyword in ['developer', 'engineer', 'manager', 'intern', 'analyst']):
            current_entry['title'] = line
        elif any(keyword in line.lower() for keyword in ['at', 'inc', 'corp', 'ltd', 'company']):
            if 'title' in current_entry:
                current_entry['company'] = line
            else:
                current_entry['title'] = line
        else:
            if 'description' not in current_entry:
                current_entry['description'] = line
            else:
                current_entry['description'] += ' ' + line
    
    if current_entry:
        experience_entries.append(current_entry)
    
    return experience_entries


def parse_projects(text):
    """Parse projects text into structured format."""
    sections = extract_sections(text)
    projects_text = sections["projects"]
    
    if not projects_text:
        return []
    
    lines = projects_text.strip().split('\n')
    project_entries = []
    
    current_entry = {}
    for line in lines:
        line = line.strip()
        if not line:
            if current_entry:
                project_entries.append(current_entry)
                current_entry = {}
            continue
        
        # Try to identify project name, description, technologies
        if any(keyword in line.lower() for keyword in ['platform', 'system', 'app', 'website', 'application']):
            if 'name' not in current_entry:
                current_entry['name'] = line
            else:
                current_entry['description'] = line
        elif any(keyword in line.lower() for keyword in ['python', 'django', 'react', 'javascript', 'java', 'sql']):
            if 'technologies' not in current_entry:
                current_entry['technologies'] = [line]
            else:
                current_entry['technologies'].append(line)
        else:
            if 'name' not in current_entry:
                current_entry['name'] = line
            elif 'description' not in current_entry:
                current_entry['description'] = line
    
    if current_entry:
        project_entries.append(current_entry)
    
    return project_entries


def parse_certifications(text):
    """Parse certifications text into structured format."""
    sections = extract_sections(text)
    certifications_text = sections["certifications"]
    
    if not certifications_text:
        return []
    
    # Split by lines and filter empty
    lines = certifications_text.strip().split('\n')
    certifications = [line.strip() for line in lines if line.strip()]
    
    return certifications


def analyze_cv(text):
    """
    Analyze CV text and return structured data.
    """

    text = normalize_text(text)

    if not text:
        return {
            "skills": [],
            "education": [],
            "experience": [],
            "projects": [],
            "certifications": [],
        }

    return {
        "skills": extract_skills(text),
        "education": parse_education(text),
        "experience": parse_experience(text),
        "projects": parse_projects(text),
        "certifications": parse_certifications(text),
    }