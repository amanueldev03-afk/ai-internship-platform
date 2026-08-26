# API Execution Guide - Step-by-Step Workflow

## Complete API Execution Order from Internship Creation to Recommendation

### Phase 1: Admin Setup (Required First)

#### 1. Admin Login
```
POST /api/accounts/admin/login/
Body: {"username": "admin_username", "password": "admin_password"}
Response: JWT access token for admin operations
```

#### 2. Create Skills (Required for Internships)
```
POST /api/internships/admin/skills/
Headers: Authorization: Bearer {admin_token}
Body: {
  "name": "Python",
  "description": "Programming language",
  "is_active": true
}
Response: Skill object with ID
```

#### 3. Create Internship Source (Required for Internships)
```
POST /api/internships/admin/sources/
Headers: Authorization: Bearer {admin_token}
Body: {
  "name": "Test Source",
  "source_type": "api",
  "website_url": "https://example.com",
  "description": "Test internship source",
  "is_active": true
}
Response: Source object with ID
```

#### 4. Create Internship
```
POST /api/internships/admin/
Headers: Authorization: Bearer {admin_token}
Body: {
  "title": "Software Engineer Intern",
  "organization_name": "Tech Startup",
  "description": "Build modern web applications",
  "category": "Software Development",
  "country": "United States",
  "city": "San Francisco",
  "location_text": "San Francisco, CA",
  "internship_type": "remote",
  "work_type": "full_time",
  "compensation_type": "paid",
  "minimum_compensation": 3000.00,
  "maximum_compensation": 6000.00,
  "compensation_currency": "USD",
  "compensation_period": "monthly",
  "required_skills": [1],
  "preferred_skills": ["React", "Node.js"],
  "duration_min_weeks": 12,
  "duration_max_weeks": 16,
  "application_url": "https://techstartup.com/apply",
  "source": 1,
  "source_url": "https://techstartup.com/internship",
  "external_id": "EXT99999"
}
Response: Internship object with ID (status: draft)
```

#### 5. Verify Internship (Critical for Student Visibility)
```
POST /api/internships/admin/internships/{id}/verify/
Headers: Authorization: Bearer {admin_token}
Body: {"action": "verify"}
Response: {"message": "Internship verified successfully", "status": "active"}
```

**Note**: After verification, the internship becomes visible to students via:
- GET /api/internships/ (List active internships)
- GET /api/internships/{id}/ (Get internship detail)
- GET /api/internships/latest/ (Get latest internships)

### Phase 2: Student Setup

#### 6. Student Registration
```
POST /api/accounts/student/register/
Body: {
  "email": "student@example.com",
  "username": "student_username",
  "password": "SecurePassword123!",
  "password_confirm": "SecurePassword123!"
}
Response: User object (email verification required)
```

#### 7. Student Login
```
POST /api/accounts/student/login/
Body: {
  "email": "student@example.com",
  "password": "SecurePassword123!"
}
Response: JWT access token for student operations
```

#### 8. Create/Update Student Profile
```
POST /api/profile/
Headers: Authorization: Bearer {student_token}
Body: {
  "full_name": "John Doe",
  "country": "United States",
  "city": "New York",
  "phone": "+1234567890",
  "education_level": "bachelor",
  "field_of_study": "Computer Science",
  "graduation_year": 2025,
  "gpa": 3.5
}
Response: Student profile object
```

#### 9. Add Skills to Profile
```
POST /api/profile/skills/add/
Headers: Authorization: Bearer {student_token}
Body: {
  "skill_ids": [1, 2, 3]
}
Response: Updated profile with skills
```

#### 10. Set Internship Preferences
```
POST /api/profile/preferences/
Headers: Authorization: Bearer {student_token}
Body: {
  "work_mode": "remote",
  "internship_type": "full_time",
  "paid_only": true,
  "min_paid": 2000,
  "max_paid": 5000,
  "preferred_countries": ["United States"],
  "preferred_categories": ["Software Development"]
}
Response: Updated preferences
```

### Phase 3: CV Upload (Enhances Recommendations)

#### 11. Upload CV
```
POST /api/profile/cv/upload/
Headers: Authorization: Bearer {student_token}
Content-Type: multipart/form-data
Body: file: [CV file (PDF/DOCX, max 5MB)]
Response: {
  "message": "CV uploaded successfully. Processing in background.",
  "cv_id": 1,
  "processing_status": "pending"
}
```

**CV Processing Workflow**:
1. CV is uploaded with status "pending"
2. Background task extracts text from CV
3. AI analyzes CV to extract: skills, education, experience, projects, certifications
4. Extracted skills are synced to student profile
5. Student embedding is generated for semantic matching
6. CV status updates to "completed"

#### 12. Check CV Processing Status
```
GET /api/profile/cv/status/
Headers: Authorization: Bearer {student_token}
Response: {
  "cv_id": 1,
  "processing_status": "completed",
  "extracted_skills": ["Python", "JavaScript", "React"],
  "extracted_text": "...",
  "processed_at": "2026-08-26T12:00:00Z"
}
```

### Phase 4: Internship Discovery

#### 13. List Active Internships
```
GET /api/internships/
Headers: Authorization: Bearer {student_token}
Query Params: page, page_size, search, category, country, internship_type
Response: Paginated list of active, verified internships
```

#### 14. Get Internship Detail
```
GET /api/internships/{id}/
Headers: Authorization: Bearer {student_token}
Response: Detailed internship information
```

#### 15. Get Latest Internships
```
GET /api/internships/latest/
Headers: Authorization: Bearer {student_token}
Response: Latest 20 active, verified internships
```

### Phase 5: Student Actions

#### 16. Save Internship
```
POST /api/internships/saved/add/
Headers: Authorization: Bearer {student_token}
Body: {"internship": 1}
Response: Saved internship object
```

#### 17. Get Saved Internships
```
GET /api/internships/saved/
Headers: Authorization: Bearer {student_token}
Response: List of saved internships
```

#### 18. Remove Saved Internship
```
DELETE /api/internships/saved/{id}/
Headers: Authorization: Bearer {student_token}
Response: {"message": "Internship removed from saved internships"}
```

#### 19. Create Application
```
POST /api/internships/applications/add/
Headers: Authorization: Bearer {student_token}
Body: {
  "internship": 1,
  "notes": "Applied through company website"
}
Response: Application object with status "applied"
```

#### 20. Get Applications
```
GET /api/internships/applications/
Headers: Authorization: Bearer {student_token}
Response: List of student's applications
```

### Phase 6: Recommendations (AI-Powered)

#### 21. Get Personalized Recommendations
```
GET /api/internships/recommendations/
Headers: Authorization: Bearer {student_token}
Response: {
  "count": 10,
  "results": [
    {
      "internship": {...},
      "match_score": 85.5,
      "explanation": [
        "Your profile is highly similar to this internship.",
        "Strong match with your technical skills.",
        "Matching skills: Python, JavaScript"
      ]
    }
  ],
  "cv_analysis": {
    "has_cv": true,
    "message": "CV analysis included in recommendations"
  }
}
```

**Recommendation Scoring Logic**:
- **Semantic Score (40%)**: CV/profile text similarity to internship description using embeddings
- **Skill Score (25%)**: Match between student skills and required internship skills
- **Preference Score (20%)**: Match with student's work mode, location, salary preferences
- **Location Score (10%)**: Geographic match (country/city)
- **Salary Score (5%)**: Salary range alignment

#### 22. Get Recommendation History
```
GET /api/internships/recommendations/history/
Headers: Authorization: Bearer {student_token}
Response: List of past recommendations with score breakdown and feedback status
```

#### 23. Provide Recommendation Feedback
```
POST /api/internships/recommendations/{internship_id}/feedback/
Headers: Authorization: Bearer {student_token}
Body: {"action": "view"}  // or "save", "apply", "ignore"
Response: {
  "message": "Recommendation marked as view",
  "status": "viewed"
}
```

**Feedback Actions**:
- `view`: Mark recommendation as viewed
- `save`: Mark recommendation as saved
- `apply`: Mark recommendation as applied
- `ignore`: Mark recommendation as ignored

### Phase 7: Dashboard Views

#### 24. Student Dashboard
```
GET /api/internships/dashboard/
Headers: Authorization: Bearer {student_token}
Response: {
  "saved_internships": 5,
  "total_applications": 10,
  "applied_applications": 8,
  "interview_applications": 2,
  "accepted_applications": 1,
  "rejected_applications": 1,
  "withdrawn_applications": 0,
  "active_saved_internships": 5,
  "recent_applications": [...],
  "recent_saved_internships": [...]
}
```

### Phase 8: Admin Management (Optional)

#### 25. View Collection Logs
```
GET /api/internships/admin/collection-logs/
Headers: Authorization: Bearer {admin_token}
Response: List of internship collection runs with status and statistics
```

#### 26. Trigger Internship Collection
```
POST /api/internships/admin/sources/{id}/collect/
Headers: Authorization: Bearer {admin_token}
Response: {
  "message": "Internship collection started",
  "source": "Test Source",
  "task_id": "abc123",
  "status": "queued"
}
```

**Collection Workflow**:
1. Admin creates internship source
2. Admin triggers collection for that source
3. Background task fetches internships from source
4. Internships are created with status "draft"
5. Collection log records the results
6. Admin verifies internships to make them visible

## Critical Dependencies

### For Internship Visibility:
- Admin must create and verify internship
- Internship must have status "active" and is_verified=true
- Application deadline must not be expired

### For Recommendations:
- Student must have profile with skills
- Internships must be active and verified
- CV upload enhances semantic matching
- Student preferences improve filtering

### For Collection Logs:
- Internship source must exist and be active
- Celery must be running for background tasks
- Collection creates internships automatically

## Error Handling

All endpoints include proper error handling for:
- Authentication failures
- Permission errors
- Validation errors
- Celery task failures (graceful degradation)
- Database constraints

## Swagger Documentation

Access interactive API documentation at:
- Swagger UI: http://127.0.0.1:8000/api/docs/
- ReDoc: http://127.0.0.1:8000/api/redoc/
- Schema: http://127.0.0.1:8000/api/schema/
