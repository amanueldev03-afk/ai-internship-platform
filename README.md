# AI Internship Recommendation Platform

An intelligent platform that uses AI to recommend internships to students based on their skills, preferences, and profile. Built with Django REST Framework and designed to help students find the perfect internship opportunities.

## 🚀 Project Overview

This platform consists of three main components:
- **Backend**: Django REST Framework API with PostgreSQL database
- **Frontend**: (To be implemented)
- **AI Engine**: (To be implemented)

## 📋 Features

### Backend Features
- **User Authentication**: Custom user model with email-based authentication
- **User Roles**: Student and Administrator roles
- **JWT Authentication**: Token-based authentication with SimpleJWT
- **Email Verification**: Email verification for new user registration
- **Password Reset**: Forgot password and reset password functionality
- **Student Profiles**: Comprehensive profile management with skills, education, and preferences
- **Internship Management**: Full CRUD operations for internship listings
- **Skill Matching**: AI-powered skill matching between students and internships
- **Recommendation Engine V2**: Advanced recommendation system with weighted scoring (semantic 40%, skills 25%, preferences 20%, location 10%, salary 5%)
- **Semantic Matching**: Uses sentence transformers to match student profiles with internship descriptions using embeddings
- **Hybrid Matching**: Combines preference-based matching with semantic similarity for more accurate recommendations
- **CV Analysis**: Intelligent CV parsing with structured data extraction (education, experience, projects, certifications)
- **AI-Powered CV Analysis**: OpenAI integration for enhanced CV data extraction with fallback to basic analysis
- **Skill Normalization**: Automatic skill name standardization and alias resolution
- **Application Tracking**: Track internship applications and their status
- **Saved Internships**: Allow students to save interesting opportunities
- **Admin Dashboard**: Dashboard for admins to manage internships and view statistics
- **Student Dashboard**: Dashboard for students to view saved internships and applications
- **CV Upload**: Upload and manage CV files with automatic text extraction
- **API Documentation**: RESTful API with DRF Spectacular for OpenAPI documentation (Swagger/ReDoc)

## 🏗️ Project Structure

```
ai-internship-platform/
├── backend/                    # Django REST Framework Backend
│   ├── apps/
│   │   ├── accounts/          # User authentication and management
│   │   │   ├── models.py       # Custom User model with UserManager
│   │   │   ├── views.py        # User API views (registration, login, logout, etc.)
│   │   │   ├── serializers.py  # User serializers
│   │   │   ├── urls.py         # User URL routes
│   │   │   ├── admin.py        # Admin configuration
│   │   │   ├── services.py     # User service functions (email, validation)
│   │   │   ├── jwt.py          # Custom JWT serializers
│   │   │   └── tests.py        # User tests
│   │   ├── internships/       # Internship management
│   │   │   ├── models.py       # Internship, Skill, Source models
│   │   │   ├── views.py        # Internship API views
│   │   │   ├── serializers.py  # Internship serializers
│   │   │   ├── urls.py         # Internship URL routes
│   │   │   ├── admin.py        # Admin configuration
│   │   │   ├── services/       # Internship services
│   │   │   │   ├── recommendations.py        # Recommendation logic
│   │   │   │   ├── preference_matching.py    # Preference matching algorithm
│   │   │   │   ├── semantic_matching.py      # Semantic matching with embeddings
│   │   │   │   ├── hybrid_matching.py        # Hybrid matching (preference + semantic)
│   │   │   │   ├── recommendation_engine_v2.py # Advanced recommendation engine with weighted scoring
│   │   │   │   └── embedding_service.py      # Embedding generation and management
│   │   │   └── tests.py        # Internship tests
│   │   └── student_profiles/  # Student profile management
│   │       ├── models.py       # StudentProfile, StudentCV models
│   │       ├── views.py        # Profile API views
│   │       ├── serializers.py  # Profile serializers
│   │       ├── urls.py         # Profile URL routes
│   │       ├── admin.py        # Admin configuration
│   │       ├── services/       # Profile services
│   │       │   ├── cv_analysis.py           # Basic CV text extraction and parsing
│   │       │   ├── ai_cv_analysis.py        # AI-powered CV analysis with OpenAI
│   │       │   ├── skill_normalization.py    # Skill name standardization
│   │       │   └── cv_extraction.py         # PDF/DOCX text extraction
│   │       └── tests.py        # Profile tests
│   ├── config/                 # Django configuration
│   │   ├── settings/
│   │   │   ├── base.py         # Base settings
│   │   │   ├── development.py  # Development settings
│   │   │   └── production.py   # Production settings
│   │   ├── urls.py             # Main URL configuration
│   │   ├── wsgi.py             # WSGI configuration
│   │   ├── asgi.py             # ASGI configuration
│   │   └── celery.py          # Celery configuration
│   ├── manage.py               # Django management script
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Environment variables
│   └── .env.example           # Environment variables template
├── frontend/                   # Frontend application (To be implemented)
├── ai_engine/                  # AI recommendation engine (To be implemented)
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 6.0.7
- **API**: Django REST Framework 3.17.2
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Django REST Framework SimpleJWT
- **API Documentation**: DRF Spectacular
- **Task Queue**: Celery with Redis
- **Testing**: Django Test Framework

## 📦 Installation

### Prerequisites
- Python 3.12+
- PostgreSQL database
- Redis (for Celery)

### Backend Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-internship-platform
```

2. **Navigate to backend directory**
```bash
cd backend
```

3. **Create virtual environment**
```bash
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

4. **Install dependencies**
```bash
pip install -r requirements.txt
```

5. **Configure environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

6. **Run migrations**
```bash
python manage.py makemigrations
python manage.py migrate
```

7. **Create superuser**
```bash
python manage.py createsuperuser
```

8. **Run development server**
```bash
python manage.py runserver
```

The backend API will be available at `http://localhost:8000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
# Django
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=127.0.0.1,localhost

# PostgreSQL
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=5432

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your_email@gmail.com
EMAIL_HOST_PASSWORD=your_app_password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your_email@gmail.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret

# Time Zone
TIME_ZONE=UTC
```

## 📚 API Endpoints

### Authentication
- `POST /api/accounts/register/` - Register new student
- `POST /api/accounts/admin/login/` - Admin login (username/password)
- `POST /api/accounts/student/login/` - Student login (email/password)
- `POST /api/accounts/logout/` - Logout (blacklist refresh token)
- `GET /api/accounts/me/` - Get current user profile
- `POST /api/accounts/verify-email/` - Verify email address
- `POST /api/accounts/resend-verification/` - Resend verification email
- `POST /api/accounts/forgot-password/` - Request password reset
- `POST /api/accounts/reset-password/` - Reset password with token
- `POST /api/accounts/change-password/` - Change password (authenticated)
- `POST /api/accounts/token/refresh/` - Refresh access token

### Internships (Public)
- `GET /api/internships/` - List all internships (with filtering)
- `GET /api/internships/{id}/` - Get internship details
- `GET /api/internships/latest/` - Get latest internships

### Internships (Admin)
- `POST /api/internships/admin/` - Create internship
- `GET /api/internships/admin/` - List internships (admin view)
- `GET /api/internships/admin/{id}/` - Get internship details (admin)
- `PUT /api/internships/admin/{id}/` - Update internship
- `DELETE /api/internships/admin/{id}/` - Delete internship
- `POST /api/internships/admin/sources/` - Create internship source
- `GET /api/internships/admin/sources/` - List internship sources
- `GET /api/internships/admin/sources/{id}/` - Get source details
- `PUT /api/internships/admin/sources/{id}/` - Update source
- `DELETE /api/internships/admin/sources/{id}/` - Delete source
- `POST /api/internships/admin/sources/{id}/collect/` - Collect internships from source
- `GET /api/internships/admin/collection-logs/` - View collection logs
- `POST /api/internships/admin/internships/{id}/verify/` - Verify internship
- `GET /api/internships/admin/dashboard/` - Admin dashboard statistics
- `POST /api/internships/admin/skills/` - Create skill
- `GET /api/internships/admin/skills/` - List skills
- `GET /api/internships/admin/skills/{id}/` - Get skill details
- `PUT /api/internships/admin/skills/{id}/` - Update skill
- `DELETE /api/internships/admin/skills/{id}/` - Delete skill

### Internships (Student)
- `POST /api/internships/saved/add/` - Save internship
- `GET /api/internships/saved/` - List saved internships
- `DELETE /api/internships/saved/{internship_id}/` - Unsave internship
- `POST /api/internships/applications/add/` - Apply to internship
- `GET /api/internships/applications/` - List applications
- `GET /api/internships/applications/{id}/` - Get application details
- `GET /api/internships/dashboard/` - Student dashboard
- `GET /api/internships/recommendations/` - Get personalized recommendations

### Student Profiles
- `GET /api/profile/` - Get student profile (auto-created if not exists)
- `PATCH /api/profile/` - Update student profile
- `POST /api/profile/cv/upload/` - Upload CV with structured data extraction
- `DELETE /api/profile/cv/` - Delete CV

### API Documentation
- `GET /api/docs/` - Swagger UI
- `GET /api/redoc/` - ReDoc
- `GET /api/schema/` - OpenAPI schema

### Admin Panel
- `GET /admin/` - Django admin panel

## 🧪 Testing

Run tests for all apps:
```bash
python manage.py test
```

Run tests for specific app:
```bash
python manage.py test apps.accounts
python manage.py test apps.internships
python manage.py test apps.student_profiles
```

Run tests with coverage:
```bash
coverage run --source='.' manage.py test
coverage report
```

## 🗄️ Database Models

### User Model (accounts)
- Custom user model with email-based authentication
- Fields: email, username, first_name, last_name, role, is_email_verified
- Roles: Student, Admin

### Internship Models (internships)
- **Skill**: Reusable skill for matching
- **InternshipSource**: Source of internship data
- **Internship**: Main internship listing with comprehensive details
- **SavedInternship**: User-saved internships
- **InternshipApplication**: Application tracking

### Student Profile Model (student_profiles)
- Personal information (phone, location, bio)
- Education details (level, field, university)
- Skills and interests
- Internship preferences (type, location, compensation)
- Career preferences (industries, roles)
- CV upload with structured data extraction
- StudentCV model for CV file storage and extracted data (JSON fields for education, experience, projects, certifications)

## 🚀 Deployment

### Production Setup

1. **Set DEBUG=False** in production settings
2. **Configure ALLOWED_HOSTS** with your domain
3. **Use strong SECRET_KEY**
4. **Configure production database**
5. **Set up static files serving**
6. **Configure Celery for background tasks**
7. **Set up monitoring and logging**

### Environment-Specific Settings

- Development: `config.settings.development`
- Production: `config.settings.production`

## 📝 Development Progress

### ✅ Completed
- Backend project structure
- Django apps configuration
- User authentication system with JWT
- Custom user model with UserManager
- Email verification system
- Password reset functionality
- Internship management models
- Student profile models
- API serializers and views
- URL routing
- Admin configuration
- Comprehensive test coverage (90+ tests passing)
- Database migrations
- PostgreSQL integration
- Environment configuration
- Recommendation engine with preference matching
- Semantic matching with sentence transformers
- Hybrid matching (preference + semantic)
- Recommendation Engine V2 with weighted scoring (semantic 40%, skills 25%, preferences 20%, location 10%, salary 5%)
- CV analysis with structured data extraction
- AI-powered CV analysis with OpenAI integration
- Skill normalization and alias resolution
- Internship application tracking
- Saved internships functionality
- Student and admin dashboards
- CV upload with PDF/DOCX text extraction
- API documentation (Swagger/ReDoc)

### � In Progress
- Frontend application
- Celery background task integration
- Real email service integration

### 📋 Planned
- OAuth integration (Google)
- Advanced filtering and search
- Real-time notifications
- API rate limiting
- Caching optimization
- Performance monitoring
- Data seeding and sample data
- Frontend development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- **Backend Development**: Django REST Framework
- **Frontend Development**: (To be assigned)
- **AI/ML Engineering**: (To be assigned)

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact: amanueldev03@gmail.com

## 🔄 Version History

### v0.3.0 (Current)
- Recommendation Engine V2 with weighted scoring (semantic 40%, skills 25%, preferences 20%, location 10%, salary 5%)
- Advanced hard filters (work mode, paid requirement, internship type, salary range)
- CV analysis with structured JSON data extraction
- AI-powered CV analysis with OpenAI integration and fallback
- Skill normalization with alias resolution
- StudentCV model with JSONField for structured data storage
- Enhanced recommendation API response with CV analysis data
- Updated test coverage for new features (90+ tests)
- Updated API documentation for new endpoints and response formats

### v0.2.0
- Enhanced authentication with JWT
- Email verification system
- Password reset functionality
- Recommendation engine with preference matching
- Internship application tracking
- Saved internships functionality
- Student and admin dashboards
- CV upload functionality
- Comprehensive test coverage (56 tests)
- Updated API documentation
- Fixed field name mismatches in recommendation algorithm
- All API endpoints properly documented with Swagger

### v0.1.0
- Initial backend implementation
- User authentication system
- Internship management
- Student profiles
- Basic API endpoints
- Test coverage

---

**Note**: This project is under active development. Features and API endpoints may change as the project evolves.
