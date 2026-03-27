# TaskEngine Backend

Node.js API for the TaskEngine student productivity app. Built with Express, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 18+
- PostgreSQL 14+

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Set up PostgreSQL

**Mac (Homebrew):**
```bash
brew install postgresql@16
brew services start postgresql@16
createdb taskengine
```

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

### 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your database connection:

- **Mac (Homebrew):** `DATABASE_URL="postgresql://yourusername@localhost:5432/taskengine"`
- **Linux (custom):** `DATABASE_URL="postgresql://yourusername@localhost:5433/taskengine?host=/tmp"`

Generate secrets:
```bash
# JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Encryption key
openssl rand -hex 32
```

### 4. Run migrations

```bash
npx prisma migrate deploy
```

### 5. Start the server

```bash
# Development (auto-reload)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:3000/api`.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Create account |
| POST | /api/auth/login | Sign in |
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
| GET | /api/health | Health check |

## Troubleshooting

**"Failed to connect to database"**
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` in `.env`
- On Linux with custom setup: `pg_ctl -D .pgdata -o "-p 5433 -k /tmp" status`

**"ENCRYPTION_KEY must be a 64-character hex string"**
- Generate a new key: `openssl rand -hex 32`
- Must be exactly 64 characters (32 bytes in hex)

**Port already in use**
- Another instance may be running. Kill it: `lsof -i :3000` then `kill <PID>`
