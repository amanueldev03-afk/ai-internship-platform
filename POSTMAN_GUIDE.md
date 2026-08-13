# Postman API Testing Guide

## Setup Instructions

1. **Import the Collection**
   - Open Postman
   - Click "Import" and select `postman_collection.json`
   - The collection will be loaded with all endpoints and sample data

2. **Configure Environment Variables**
   - Set `base_url` to `http://localhost:8000` (or your server URL)
   - After login, copy `access` and `refresh` tokens to collection variables

## Testing Workflow

### 1. Authentication Flow (Required First Steps)

**Step 1: Register a Student**
- Endpoint: `POST /api/accounts/register/`
- Sample Data:
```json
{
  "email": "student@example.com",
  "username": "teststudent",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!"
}
```

**Step 2: Login**
- Endpoint: `POST /api/accounts/student/login/`
- Sample Data:
```json
{
  "email": "student@example.com",
  "password": "SecurePass123!"
}
```
- **Important**: Copy the `access` and `refresh` tokens from the response to your Postman collection variables

**Step 3: Verify Email (Optional)**
- You'll receive a verification email with `uid` and `token`
- Use these in the verify email endpoint

### 2. Student Profile Management

**Get Profile**
- Endpoint: `GET /api/profile/`
- Requires authentication

**Create/Update Profile**
- Endpoint: `POST /api/profile/`
- Sample Data:
```json
{
  "phone": "+1234567890",
  "country": "United States",
  "city": "New York",
  "date_of_birth": "2000-01-15",
  "bio": "Computer Science student passionate about AI and machine learning.",
  "education_level": "undergraduate",
  "field_of_study": "Computer Science",
  "university": "MIT",
  "skills": ["Python", "JavaScript", "Machine Learning", "React"],
  "interests": ["AI", "Web Development", "Data Science"],
  "experience": "2 years of web development experience",
  "internship_type": "full-time",
  "work_type": "remote",
  "compensation_preference": "paid",
  "minimum_compensation": 1500,
  "maximum_compensation": 3000,
  "compensation_currency": "USD",
  "preferred_locations": ["New York", "San Francisco", "Remote"],
  "willing_to_relocate": true,
  "preferred_industries": ["Technology", "Finance", "Healthcare"],
  "preferred_roles": ["Software Engineer", "Data Scientist", "ML Engineer"],
  "internship_duration_min_weeks": 8,
  "internship_duration_max_weeks": 12,
  "available_from": "2024-06-01"
}
```

**Upload CV**
- Endpoint: `POST /api/profile/cv/`
- Requires authentication
- Use form-data with a file upload

### 3. Internship Endpoints

**List All Internships (Public)**
- Endpoint: `GET /api/internships/`
- No authentication required

**Get Specific Internship (Public)**
- Endpoint: `GET /api/internships/{id}/`
- No authentication required

**Get Latest Internships (Public)**
- Endpoint: `GET /api/internships/latest/`
- No authentication required

**Admin: Create Internship**
- Endpoint: `POST /api/internships/admin/`
- Requires admin authentication
- Sample Data:
```json
{
  "title": "Machine Learning Engineer Intern",
  "organization_name": "Tech Innovations Inc",
  "description": "Join our team to work on cutting-edge ML projects. You will be involved in developing and deploying machine learning models for real-world applications.",
  "category": "Engineering",
  "country": "United States",
  "city": "San Francisco",
  "location_text": "San Francisco, CA (Hybrid)",
  "internship_type": "full-time",
  "work_type": "hybrid",
  "compensation_type": "paid",
  "minimum_compensation": 2000,
  "maximum_compensation": 3500,
  "compensation_currency": "USD",
  "compensation_period": "monthly",
  "required_skills": ["Python", "TensorFlow", "PyTorch", "SQL"],
  "preferred_skills": ["AWS", "Docker", "Git"],
  "duration_min_weeks": 12,
  "duration_max_weeks": 16,
  "application_url": "https://techinnovations.com/apply/ml-intern",
  "source": 1,
  "source_url": "https://techinnovations.com/careers",
  "external_id": "ML-2024-001",
  "application_deadline": "2024-12-31",
  "is_verified": true,
  "status": "active"
}
```

**Admin: Update/Delete Internship**
- Endpoints: `PUT/DELETE /api/internships/admin/{id}/`
- Requires admin authentication

### 4. Password Management

**Forgot Password**
- Endpoint: `POST /api/accounts/forgot-password/`
- Sample Data:
```json
{
  "email": "student@example.com"
}
```

**Reset Password**
- Endpoint: `POST /api/accounts/reset-password/`
- Use `uid` and `token` from password reset email
- Sample Data:
```json
{
  "uid": "MQ",
  "token": "sample_token_here",
  "password": "NewSecurePass123!",
  "password_confirm": "NewSecurePass123!"
}
```

**Change Password (Authenticated)**
- Endpoint: `POST /api/accounts/change-password/`
- Requires authentication
- Sample Data:
```json
{
  "old_password": "SecurePass123!",
  "new_password": "AnotherSecure456!",
  "new_password_confirm": "AnotherSecure456!"
}
```

## API Documentation

Access interactive API documentation:
- Swagger UI: `http://localhost:8000/api/docs/`
- ReDoc: `http://localhost:8000/api/redoc/`
- OpenAPI Schema: `http://localhost:8000/api/schema/`

## Important Notes

1. **Authentication**: Most endpoints require the `access_token` in the Authorization header
2. **Token Refresh**: Use the refresh token endpoint when access token expires
3. **Email Verification**: Some features may require email verification
4. **Admin Endpoints**: Admin-specific endpoints require admin role authentication
5. **File Uploads**: CV upload uses form-data, not JSON

## Data Validation Rules

- **Passwords**: Must be at least 8 characters, include letters and numbers
- **Email**: Must be a valid email format with real domain
- **Compensation**: If `compensation_type` is "paid", both min and max compensation are required
- **Duration**: Maximum duration must be >= minimum duration
- **Skills**: Arrays of strings for skills and interests

## Troubleshooting

**401 Unauthorized**: Check that your access token is valid and not expired
**400 Bad Request**: Verify your JSON data structure matches the expected format
**404 Not Found**: Ensure the URL is correct and the resource exists
**500 Server Error**: Check server logs for detailed error information
