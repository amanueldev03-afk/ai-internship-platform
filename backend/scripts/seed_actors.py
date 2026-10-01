#!/usr/bin/env python
import os
import sys
import django

BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.accounts.models import User

DEFAULT_PASSWORD = "Password123!"

ACTORS = [
    {
        "username": "student1",
        "email": "amanueldev03@gmail.com",
        "role": User.Role.STUDENT,
        "first_name": "Amanuel",
        "last_name": "Student",
    },
    {
        "username": "admin1",
        "email": "admin1@smartintern.et",
        "role": User.Role.ADMIN,
        "first_name": "System",
        "last_name": "Admin",
        "password": "Admin@1234",
        "is_staff": True,
        "is_superuser": True,
    },
    {
        "username": "advisor1",
        "email": "amanmuluken1621@gmail.com",
        "role": User.Role.ADVISOR,
        "first_name": "Dr. Muluken",
        "last_name": "Advisor",
    },
    {
        "username": "company_hr1",
        "email": "amanmuluken17@gmail.com",
        "role": User.Role.COMPANY_HR,
        "first_name": "TechCorp",
        "last_name": "HR Manager",
    },
    {
        "username": "mentor1",
        "email": "mentor@smartintern.et",
        "role": User.Role.COMPANY_MENTOR,
        "first_name": "TechCorp",
        "last_name": "Lead Mentor",
    },
    {
        "username": "dean1",
        "email": "dean@smartintern.et",
        "role": User.Role.DEPT_DEAN,
        "first_name": "Dean",
        "last_name": "Engineering",
    },
    {
        "username": "uil1",
        "email": "uil@smartintern.et",
        "role": User.Role.UIL_OFFICER,
        "first_name": "UIL",
        "last_name": "Head Officer",
    },
    {
        "username": "union1",
        "email": "union@smartintern.et",
        "role": User.Role.STUDENT_UNION,
        "first_name": "Student",
        "last_name": "Union Rep",
    },
    {
        "username": "dorm1",
        "email": "dorm@smartintern.et",
        "role": User.Role.DORM_ADMIN,
        "first_name": "Dormitory",
        "last_name": "Administrator",
    },
    {
        "username": "finance1",
        "email": "finance@smartintern.et",
        "role": User.Role.FINANCE_OFFICER,
        "first_name": "Finance",
        "last_name": "Officer",
    },
]

print("=== SEEDING ACTOR ACCOUNTS ===")
for actor_data in ACTORS:
    email = actor_data["email"]
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            "role": actor_data["role"],
            "first_name": actor_data["first_name"],
            "last_name": actor_data["last_name"],
            "username": actor_data.get("username"),
            "is_active": True,
            "is_email_verified": True,
            "is_approved": True,
            "is_staff": actor_data.get("is_staff", False),
            "is_superuser": actor_data.get("is_superuser", False),
        }
    )

    user.role = actor_data["role"]
    if actor_data.get("username"):
        user.username = actor_data["username"]
    user.is_active = True
    user.is_email_verified = True
    user.is_approved = True
    if actor_data.get("is_staff"):
        user.is_staff = True
    if actor_data.get("is_superuser"):
        user.is_superuser = True
    pwd = actor_data.get("password", DEFAULT_PASSWORD)
    user.set_password(pwd)
    user.save()
    print(f"Configured actor: {user.username} ({user.email}) -> {user.role} with password '{pwd}'")

print("=== SEEDING COMPLETE ===")
