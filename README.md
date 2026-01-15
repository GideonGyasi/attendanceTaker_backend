# Attendance Taker Backend

Express.js backend for the Attendance Taker application with Google OAuth integration.

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

## Google OAuth Setup

To enable Google sign-in, you need to set up a Google Cloud Project:

### 1. Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one

### 2. Enable Google+ API
1. Go to "APIs & Services" > "Library"
2. Search for "Google+ API" and enable it

### 3. Create OAuth 2.0 Credentials
1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Choose "Web application" as application type
5. Add authorized redirect URIs:
   - For development: `http://localhost:4000/api/auth/google/callback`
   - For production: `https://yourdomain.com/api/auth/google/callback`
6. Copy the Client ID and Client Secret to your `.env` file

### 4. Environment Variables
Add these to your `.env` file:
```
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
BACKEND_URL=http://localhost:4000
FRONTEND_URL=http://localhost:5173
SESSION_SECRET=your-super-secret-session-key
```

## Running the Application

```bash
npm start
```

The server will run on port 4000 by default.

## API Endpoints

- `POST /api/auth/register` - Register with email/password
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
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