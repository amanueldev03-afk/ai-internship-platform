import io
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.db import IntegrityError
from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

from apps.students.models import Student
from apps.internships.models import Skill
from apps.uil_profiles.models import (
    UniversityDepartment,
    UILStudentProfile,
    EmergencyContact,
    AccessibilityProfile,
    StaffProfile,
    Resume,
)
from apps.uil_profiles.tasks import parse_resume_task
from ai_engine.parsers.cv_extractor import extract_resume_data, validate_resume_file

User = get_user_model()



class UILProfilesModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="student_uil@test.com",
            password="Password123!",
            role=User.Role.STUDENT,
        )
        self.student = Student.objects.create(user=self.user)
        self.dept = UniversityDepartment.objects.create(
            university_name="Addis Ababa University",
            department_name="Computer Science",
        )

    def test_uil_student_profile_creation(self):
        profile = UILStudentProfile.objects.create(
            student=self.student,
            student_id_number="UGR/5555/15",
            campus_city="Addis Ababa",
            department="Computer Science",
            academic_year=4,
            gpa=Decimal("3.90"),
        )
        self.assertEqual(profile.student_id_number, "UGR/5555/15")
        self.assertEqual(profile.campus_city, "Addis Ababa")
        self.assertFalse(profile.is_active_for_internship)

    def test_unique_student_id_per_campus_constraint(self):
        UILStudentProfile.objects.create(
            student=self.student,
            student_id_number="UGR/DUPE/15",
            campus_city="Hawassa",
            department="Computer Science",
        )
        # Create second user and student
        user2 = User.objects.create_user(
            email="student2_uil@test.com",
            password="Password123!",
            role=User.Role.STUDENT,
        )
        student2 = Student.objects.create(user=user2)

        # Same student ID at same campus city must raise IntegrityError
        with self.assertRaises(IntegrityError):
            UILStudentProfile.objects.create(
                student=student2,
                student_id_number="UGR/DUPE/15",
                campus_city="Hawassa",
                department="Electrical Engineering",
            )

    def test_emergency_contact_and_accessibility_profile(self):
        profile = UILStudentProfile.objects.create(
            student=self.student,
            student_id_number="UGR/SEC/15",
            campus_city="Addis Ababa",
            department="Software Engineering",
        )
        ec = EmergencyContact.objects.create(
            student_profile=profile,
            contact_name="Abebe Kebede",
            relationship="Father",
            primary_phone="+251911223344",
        )
        self.assertEqual(ec.contact_name, "Abebe Kebede")

        acc = AccessibilityProfile.objects.create(
            student_profile=profile,
            requires_screen_reader=True,
            mobility_assistance_required=False,
            workplace_notes="Encrypted workplace notes text.",
        )
        acc.refresh_from_db()
        self.assertEqual(acc.workplace_notes, "Encrypted workplace notes text.")

    def test_staff_profile_creation(self):
        dean_user = User.objects.create_user(
            email="dean_eng@test.com",
            password="Password123!",
            role=User.Role.DEPT_DEAN,
        )
        staff = StaffProfile.objects.create(
            user=dean_user,
            department=self.dept,
            staff_role=User.Role.DEPT_DEAN,
            phone_number="+251911998877",
        )
        self.assertEqual(staff.staff_role, User.Role.DEPT_DEAN)
        self.assertEqual(staff.department.university_name, "Addis Ababa University")


def make_mock_pdf_bytes(
    name: str = "Amanuel Developer",
    university: str = "Addis Ababa University",
    department: str = "Software Engineering",
    email: str = "amanuel.dev@aau.edu.et",
    phone: str = "+251911223344",
    gpa: str = "3.88",
    github: str = "https://github.com/amanuel-dev",
    linkedin: str = "https://linkedin.com/in/amanuel-dev",
    skills: str = "Python, Django, React, PostgreSQL, Docker",
) -> bytes:
    stream_content = f"""BT
/F1 12 Tf
72 700 Td
({name} - {university}) Tj
0 -20 Td
({department}) Tj
0 -20 Td
(Email: {email} Phone: {phone}) Tj
0 -20 Td
(GPA: {gpa} GitHub: {github}) Tj
0 -20 Td
(LinkedIn: {linkedin}) Tj
0 -20 Td
(Skills: {skills}) Tj
ET"""
    stream_bytes = stream_content.encode("latin1")
    length = len(stream_bytes)
    pdf = f"""%PDF-1.4
1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj
2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj
3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >> endobj
4 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj
5 0 obj << /Length {length} >> stream
{stream_content}
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000244 00000 n 
0000000318 00000 n 
trailer << /Size 6 /Root 1 0 R >>
startxref
{400 + length}
%%EOF"""
    return pdf.encode("latin1")


class ResumeDocumentParsingAndWorkflowTests(TestCase):
    """
    Verification suite for Phase 5 NLP & Document Parsing:
      1. cv_extractor parses mock PDF extracting GPA, GitHub, LinkedIn, email, phone, university, skills.
      2. Celery parse_resume_task never auto-writes to student profiles, returning suggestions.
      3. Upload & status polling endpoints function correctly.
      4. Explicit confirmation endpoint updates only student-approved fields.
      5. File size (>5MB) and invalid MIME validations reject improper files.
    """

    def setUp(self):
        self.client = APIClient()

        # Seed canonical skills
        self.skill_python, _ = Skill.objects.get_or_create(name="Python", category="Backend")
        self.skill_django, _ = Skill.objects.get_or_create(name="Django", category="Backend")
        self.skill_react, _ = Skill.objects.get_or_create(name="React", category="Frontend")
        self.skill_postgres, _ = Skill.objects.get_or_create(name="PostgreSQL", category="Database")
        self.skill_docker, _ = Skill.objects.get_or_create(name="Docker", category="DevOps")

        # Create student user and baseline models
        self.user = User.objects.create_user(
            email="candidate@aau.edu.et",
            password="StrongPassword123!",
            role=User.Role.STUDENT,
            first_name="Amanuel",
            last_name="Bekele",
        )
        self.student = Student.objects.create(
            user=self.user,
            university="Addis Ababa University",
            field_of_study="Undeclared",
            current_year="2nd Year",
            preferred_city="Addis Ababa",
            work_mode="onsite",
        )
        self.uil_profile = UILStudentProfile.objects.create(
            student=self.student,
            student_id_number="AAU/9999/16",
            campus_city="Addis Ababa",
            department="Undeclared",
            academic_year=2,
            gpa=Decimal("2.50"),
            github_url="",
            is_active_for_internship=True,
        )

        self.mock_pdf_bytes = make_mock_pdf_bytes()

    def test_cv_extractor_extracts_mock_pdf_entities(self):
        """Verify that cv_extractor extracts all expected entities from a mock PDF."""
        file_obj = io.BytesIO(self.mock_pdf_bytes)
        file_obj.name = "resume.pdf"

        result = extract_resume_data(file_obj)
        data = result["data"]

        self.assertEqual(data["email"], "amanuel.dev@aau.edu.et")
        self.assertEqual(data["phone"], "+251911223344")
        self.assertEqual(data["github_url"], "https://github.com/amanuel-dev")
        self.assertEqual(data["linkedin_url"], "https://linkedin.com/in/amanuel-dev")
        self.assertEqual(data["gpa"], 3.88)
        self.assertEqual(data["education"]["institution"], "Addis Ababa University")
        self.assertEqual(data["education"]["field_of_study"], "Software Engineering")

        # Assert canonical skills match
        self.assertIn("Python", data["skills"])
        self.assertIn("Django", data["skills"])
        self.assertIn("React", data["skills"])
        self.assertIn("PostgreSQL", data["skills"])
        self.assertIn("Docker", data["skills"])

    def test_parse_resume_task_never_silently_writes_to_student_profile(self):
        """
        CRITICAL GUARDRAIL VERIFICATION:
        parse_resume_task must extract text and store parsed_data on Resume,
        but MUST NEVER modify UILStudentProfile or Student profile records.
        """
        uploaded_file = SimpleUploadedFile(
            name="amanuel_resume.pdf",
            content=self.mock_pdf_bytes,
            content_type="application/pdf",
        )
        resume = Resume.objects.create(
            student=self.uil_profile,
            file=uploaded_file,
            parsing_status=Resume.ParsingStatus.PENDING,
        )

        # Run parse task
        task_res = parse_resume_task(resume.id)
        self.assertEqual(task_res["status"], "COMPLETED")

        resume.refresh_from_db()
        self.assertEqual(resume.parsing_status, Resume.ParsingStatus.COMPLETED)
        self.assertEqual(resume.parsed_data["gpa"], 3.88)
        self.assertEqual(resume.parsed_data["github_url"], "https://github.com/amanuel-dev")

        # ASSERT DATABASE PROFILE WAS NOT MUTATED
        self.uil_profile.refresh_from_db()
        self.student.refresh_from_db()

        self.assertEqual(self.uil_profile.gpa, Decimal("2.50"), "GPA must NOT be overwritten automatically!")
        self.assertEqual(self.uil_profile.github_url, "", "GitHub URL must NOT be overwritten automatically!")
        self.assertEqual(self.uil_profile.department, "Undeclared", "Department must NOT be overwritten automatically!")
        self.assertEqual(self.student.field_of_study, "Undeclared", "Field of study must NOT be overwritten automatically!")
        self.assertEqual(self.student.skills.count(), 0, "Skills must NOT be added without explicit confirmation!")

    def test_upload_and_status_endpoints(self):
        """
        Verify POST /api/v1/uil-profiles/resume/ and GET /api/v1/uil-profiles/resume/status/<id>/
        """
        self.client.force_authenticate(user=self.user)

        pdf_file = SimpleUploadedFile(
            name="test_resume.pdf",
            content=self.mock_pdf_bytes,
            content_type="application/pdf",
        )
        upload_url = reverse("uil_profiles:resume-upload")
        response = self.client.post(
            upload_url,
            {"file": pdf_file},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertIn("id", data)
        resume_id = data["id"]

        # Ensure parse completed
        resume = Resume.objects.get(id=resume_id)
        if resume.parsing_status != Resume.ParsingStatus.COMPLETED:
            parse_resume_task(resume_id)

        # Poll status
        status_url = reverse("uil_profiles:resume-status", kwargs={"pk": resume_id})
        status_resp = self.client.get(status_url)
        self.assertEqual(status_resp.status_code, status.HTTP_200_OK)
        status_data = status_resp.json()
        self.assertEqual(status_data["parsing_status"], Resume.ParsingStatus.COMPLETED)
        self.assertIn("parsed_data", status_data)
        self.assertEqual(status_data["parsed_data"]["gpa"], 3.88)

    def test_explicit_confirmation_endpoint_updates_selected_fields(self):
        """
        Verify that student can selectively accept parsed suggestions, and ONLY
        the selected fields are committed to their profile.
        """
        uploaded_file = SimpleUploadedFile(
            name="amanuel_resume.pdf",
            content=self.mock_pdf_bytes,
            content_type="application/pdf",
        )
        resume = Resume.objects.create(
            student=self.uil_profile,
            file=uploaded_file,
            parsing_status=Resume.ParsingStatus.COMPLETED,
            parsed_data={
                "gpa": 3.88,
                "github_url": "https://github.com/amanuel-dev",
                "education": {"field_of_study": "Software Engineering", "institution": "Addis Ababa University"},
                "skills": ["Python", "Django", "React", "Docker"],
            },
        )

        self.client.force_authenticate(user=self.user)
        confirm_url = reverse("uil_profiles:resume-confirm", kwargs={"pk": resume.id})

        # Student decides to accept GPA, GitHub URL, and skills Python/Django (omitting Docker)
        payload = {
            "gpa": "3.88",
            "github_url": "https://github.com/amanuel-dev",
            "department": "Software Engineering",
            "skills": ["Python", "Django"],
        }
        response = self.client.post(confirm_url, payload, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        resp_data = response.json()
        self.assertEqual(resp_data["status"], "CONFIRMED")

        # Verify profile is now updated with the accepted fields
        self.uil_profile.refresh_from_db()
        self.student.refresh_from_db()

        self.assertEqual(self.uil_profile.gpa, Decimal("3.88"))
        self.assertEqual(self.uil_profile.github_url, "https://github.com/amanuel-dev")
        self.assertEqual(self.uil_profile.department, "Software Engineering")
        self.assertEqual(self.student.field_of_study, "Software Engineering")

        # Verify only Python and Django were added, NOT Docker
        skills = list(self.student.skills.values_list("name", flat=True))
        self.assertIn("Python", skills)
        self.assertIn("Django", skills)
        self.assertNotIn("Docker", skills)

    def test_file_size_validation_rejects_oversized_file(self):
        """Verify that resumes larger than 5MB are rejected."""
        self.client.force_authenticate(user=self.user)
        # Create 5.5MB dummy file
        oversized = SimpleUploadedFile(
            name="big_resume.pdf",
            content=b"%PDF-1.4\n" + b"0" * (6 * 1024 * 1024),
            content_type="application/pdf",
        )
        upload_url = reverse("uil_profiles:resume-upload")
        response = self.client.post(
            upload_url,
            {"file": oversized},
            format="multipart",
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.json())

