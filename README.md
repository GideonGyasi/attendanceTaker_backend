# Attendance Taker Backend

Express.js backend for the Attendance Taker application.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Copy environment variables:
```bash
cp env.example .env
```

3. Configure your environment variables in `.env`

## Running the Application

```bash
npm start
```

The server will run on port 4000 by default.

## API Endpoints

- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/me` - Get current user info
- `POST /api/sessions` - Create attendance session
- `GET /api/sessions/:token` - Get session info
- `GET /api/sessions/:token/attendance.csv` - Download attendance CSV
- `GET /api/sessions/:token/attendance.pdf` - Download attendance PDF
- `POST /api/attendance` - Submit attendance
- `GET /api/admin/summary` - Get admin dashboard summary
- `GET /api/admin/sessions` - Get admin sessions
- `DELETE /api/admin/sessions/:token` - Delete session</content>
<parameter name="filePath">c:\Users\jayso\OneDrive\Desktop\New folder\attendanceTaker_backend\README.md