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
- **Student Profiles**: Comprehensive profile management with skills, education, and preferences
- **Internship Management**: Full CRUD operations for internship listings
- **Skill Matching**: AI-powered skill matching between students and internships
- **Application Tracking**: Track internship applications and their status
- **Saved Internships**: Allow students to save interesting opportunities
- **API Documentation**: RESTful API with DRF Spectacular for OpenAPI documentation

## 🏗️ Project Structure

```
ai-internship-platform/
├── backend/                    # Django REST Framework Backend
│   ├── apps/
│   │   ├── accounts/          # User authentication and management
│   │   │   ├── models.py       # Custom User model
│   │   │   ├── views.py        # User API views
│   │   │   ├── serializers.py  # User serializers
│   │   │   ├── urls.py         # User URL routes
│   │   │   ├── admin.py        # Admin configuration
│   │   │   └── tests.py        # User tests
│   │   ├── internships/       # Internship management
│   │   │   ├── models.py       # Internship, Skill, Source models
│   │   │   ├── views.py        # Internship API views
│   │   │   ├── serializers.py  # Internship serializers
│   │   │   ├── urls.py         # Internship URL routes
│   │   │   ├── admin.py        # Admin configuration
│   │   │   └── tests.py        # Internship tests
│   │   └── student_profiles/  # Student profile management
│   │       ├── models.py       # StudentProfile model
│   │       ├── views.py        # Profile API views
│   │       ├── serializers.py  # Profile serializers
│   │       ├── urls.py         # Profile URL routes
│   │       ├── admin.py        # Admin configuration
│   │       └── tests.py        # Profile tests
│   ├── config/                 # Django configuration
│   │   ├── settings/
│   │   │   ├── base.py         # Base settings
│   │   │   ├── development.py  # Development settings
│   │   │   └── production.py   # Production settings
│   │   ├── urls.py             # Main URL configuration
│   │   ├── wsgi.py             # WSGI configuration
│   │   └── asgi.py             # ASGI configuration
│   ├── manage.py               # Django management script
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables
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
- `POST /api/accounts/users/register/` - Register new user
- `POST /api/accounts/users/login/` - User login
- `GET /api/accounts/users/me/` - Get current user profile
- `GET /api/accounts/users/` - List all users (admin only)
- `GET /api/accounts/users/{id}/` - Get user details
- `PUT /api/accounts/users/{id}/` - Update user
- `DELETE /api/accounts/users/{id}/` - Delete user

### Internships
- `GET /api/internships/internships/` - List all internships
- `POST /api/internships/internships/` - Create internship (admin)
- `GET /api/internships/internships/{id}/` - Get internship details
- `PUT /api/internships/internships/{id}/` - Update internship (admin)
- `DELETE /api/internships/internships/{id}/` - Delete internship (admin)

### Student Profiles
- `GET /api/profiles/profiles/` - List all profiles
- `POST /api/profiles/profiles/` - Create student profile
- `GET /api/profiles/profiles/{id}/` - Get profile details
- `PUT /api/profiles/profiles/{id}/` - Update profile
- `DELETE /api/profiles/profiles/{id}/` - Delete profile

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
- CV upload

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
- User authentication system
- Custom user model with roles
- Internship management models
- Student profile models
- API serializers and views
- URL routing
- Admin configuration
- Comprehensive test coverage
- Database migrations
- PostgreSQL integration
- Environment configuration

### 🔄 In Progress
- Frontend application
- AI recommendation engine

### 📋 Planned
- Email verification
- Password reset functionality
- OAuth integration (Google)
- Advanced filtering and search
- Recommendation algorithm
- Real-time notifications
- File upload handling (CVs)
- API rate limiting
- Caching optimization
- Performance monitoring

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

### v0.1.0 (Current)
- Initial backend implementation
- User authentication system
- Internship management
- Student profiles
- Basic API endpoints
- Test coverage

---

**Note**: This project is under active development. Features and API endpoints may change as the project evolves.
