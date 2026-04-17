# TaskEngine Backend

Node.js API for the TaskEngine student productivity app. Built with Express, Prisma, and PostgreSQL.

## Quick Start

Want to try the app without setting up a local backend? The production backend is already deployed at `https://taskengine-backend.onrender.com`. Just install the Flutter APK (or build your own — see [Running the Flutter App Locally](#running-the-flutter-app-locally)) and register an account.

To run the backend locally, follow the steps below:
1. Clone both repos
2. Set up PostgreSQL and create the database
3. Configure `.env` with database URL, secrets, and Groq API key
4. Run migrations (first time only)
5. Start the server with `npm run dev` or `npm start`

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- (Optional) A free [Groq API key](https://console.groq.com/keys) for AI study advice

## Setup

### 1. Clone the repository

```bash
git clone https://github.com/dnstars1/taskengine-backend.git
cd taskengine-backend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up PostgreSQL

**Mac (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb taskengine
```

**Windows:**
1. Download and install PostgreSQL from https://www.postgresql.org/download/windows/
   - During install, set a password for the `postgres` user
   - Keep the default port `5432`
2. Open **Command Prompt** or **PowerShell** and create the database:
   ```powershell
   "C:\Program Files\PostgreSQL\16\bin\createdb.exe" -U postgres taskengine
   ```
   Enter the password you set during install when prompted.

**Linux (Arch/CachyOS):**
```bash
sudo pacman -S postgresql
# Initialize a local data directory (if not using system service):
initdb -D .pgdata
pg_ctl -D .pgdata -o "-p 5433 -k /tmp" start
createdb -h /tmp -p 5433 taskengine
```

**Ubuntu/Debian:**
```bash
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb taskengine
```

### 4. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database connection:

- **Mac (Homebrew):** `DATABASE_URL="postgresql://yourusername@localhost:5432/taskengine"`
- **Windows:** `DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskengine"`
- **Linux (custom):** `DATABASE_URL="postgresql://yourusername@localhost:5433/taskengine?host=/tmp"`

Generate secrets:
```bash
# JWT secret (works on Mac, Linux, Windows)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption key (Mac/Linux)
openssl rand -hex 32

# Encryption key (Windows PowerShell — alternative if openssl is not installed)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add a Groq API key for AI Study Advice (optional but recommended):
1. Sign up at https://console.groq.com
2. Go to **API Keys** → **Create API Key**
3. Add to your `.env`:
   ```
   GROQ_API_KEY="gsk_..."
   ```

If you skip this, the AI Study Advice card will fail silently and be hidden.

### 5. Run migrations

```bash
npx prisma migrate deploy
```

This creates all tables. You only need to do this once (or after pulling new migrations).

### 6. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000/api`.

Interactive API docs (Swagger UI) are at `http://localhost:3000/docs`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
| POST | /api/auth/change-password | Change password |
| GET | /api/user/profile | Get user profile |
| PUT | /api/user/settings | Update settings |
| GET | /api/assignments | List assignments |
| POST | /api/assignments | Create assignment |
| PUT | /api/assignments/:id | Update assignment |
| DELETE | /api/assignments/:id | Delete assignment |
| GET | /api/dashboard/summary | Dashboard summary |
| GET | /api/calendar/:year/:month | Calendar view |
| POST | /api/moodle/sync | Sync Moodle calendar |
| POST | /api/moodle/resync | Re-sync Moodle |
| POST | /api/moodle/disconnect | Disconnect Moodle |
| GET | /api/modules | List courses |
| POST | /api/study-sessions | Log study session |
| GET | /api/study-sessions/weekly | Weekly study stats |
| GET | /api/insights/study-advice | AI-generated study advice (Groq) |
| GET | /api/health | Health check |

## Running the Flutter App Locally

The Flutter frontend is in a separate repo: [TaskEngineFlutter](https://github.com/dnstars1/TaskEngineFlutter).

### Prerequisites
- [Flutter SDK](https://docs.flutter.dev/get-started/install) (3.11+)
- For Android: Android Studio + Android SDK
- For iOS: macOS + Xcode + CocoaPods
- For Desktop: enabled in Flutter (`flutter config --enable-<platform>-desktop`)

### Steps (all platforms)

1. Clone the Flutter repo and install dependencies:
   ```bash
   git clone https://github.com/dnstars1/TaskEngineFlutter.git
   cd TaskEngineFlutter
   flutter pub get
   ```

2. Make sure the backend is running — either locally (see Setup above) or use the hosted one at `https://taskengine-backend.onrender.com` (no setup needed).

3. Run the app:

   **Desktop (Linux / Windows / macOS):**
   ```bash
   flutter run -d linux     # Linux
   flutter run -d windows   # Windows
   flutter run -d macos     # macOS
   ```

   **Android (emulator or USB device):**
   ```bash
   flutter run -d android
   ```
   To build a release APK:
   ```bash
   flutter build apk --release
   ```
   The APK will be at `build/app/outputs/flutter-apk/app-release.apk`.

   **iOS (requires macOS + Xcode + Apple Developer account):**
   ```bash
   cd ios && pod install && cd ..
   flutter run -d ios
   ```
   To build for distribution:
   ```bash
   flutter build ios --release
   ```
   You'll need to open `ios/Runner.xcworkspace` in Xcode and configure code signing before archiving.

### Connecting to the backend

The Flutter app uses `lib/config/api_config.dart` to determine the backend URL:
- **Desktop (Linux / Windows / macOS):** `http://localhost:3000/api`
- **Android / iOS:** `https://taskengine-backend.onrender.com/api` (production)

To test mobile against your local backend, change the URL temporarily in `api_config.dart` to your computer's LAN IP, e.g., `http://192.168.1.10:3000/api`.

## Deployment Notes

- The backend is deployed on Render's free tier. The build script only runs `npx prisma generate` — migrations are applied manually via local `psql` or `npx prisma migrate deploy` to avoid long build times.
- The database is hosted on Supabase (PostgreSQL). The connection uses Supabase's transaction pooler on port 6543 for IPv4 compatibility.
- Environment variables required on Render: `DATABASE_URL`, `JWT_SECRET`, `ENCRYPTION_KEY`, `GROQ_API_KEY`.

## Troubleshooting

**"Failed to connect to database"**
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- On Linux with custom setup: `pg_ctl -D .pgdata -o "-p 5433 -k /tmp" status`

**"ENCRYPTION_KEY must be a 64-character hex string"**
- Generate a new key: `openssl rand -hex 32`
- Must be exactly 64 characters (32 bytes in hex)

**AI Study Advice card doesn't appear**
- Check that `GROQ_API_KEY` is set in `.env`
- Test the endpoint directly: `curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/insights/study-advice`
- Response is cached per user for 30 minutes — restart the server to clear

**Port already in use**
- **Mac/Linux:** `lsof -i :3000` then `kill <PID>`
- **Windows:** `netstat -ano | findstr :3000` then `taskkill /PID <PID> /F`

**Windows: `pg_ctl` or `psql` not found**
- Add PostgreSQL to your PATH: `C:\Program Files\PostgreSQL\16\bin`
- Or use the full path in commands
