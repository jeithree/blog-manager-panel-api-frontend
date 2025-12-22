# Simple API Starter Template

A minimalist Express + Prisma API starter with essential features only.

## Features

- ✅ Express.js with TypeScript
- ✅ Prisma ORM
- ✅ Redis session store
- ✅ Basic authentication (register, login, logout)
- ✅ Session management with express-session
- ✅ Password hashing with bcrypt
- ✅ Input validation with Zod
- ✅ Basic security (Helmet, CORS)
- ✅ Error handling middleware
- ✅ File logging system

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Configure the following environment variables:

- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection string (default: redis://localhost:6379)
- `SESSION_SECRET` - Secret for session encryption
- `API_URL` - Frontend URL for CORS

3. Start Redis (required for sessions):

```bash
# Using Docker
docker run -d -p 6379:6379 redis:alpine

# Or install locally
```

4. Run Prisma migrations:

```bash
npx prisma migrate dev
```

5. Start the development server:

```bash
npm run dev
```

## API Endpoints

### Auth

- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/logout` - Logout
- `GET /api/v1/auth/session` - Get current session

### Users

- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile

## Project Structure

```
src/
├── app.ts              # Express app setup
├── server.ts           # Server entry point
├── prisma.ts           # Prisma client
├── redisClient.ts      # Redis client
├── config.ts           # Configuration
├── controllers/        # Route controllers
├── services/          # Business logic
├── middlewares/       # Express middlewares (auth, validation, error handling)
├── routes/            # Route definitions
├── types/             # TypeScript types
├── helpers/           # Helper functions (logger, password, response)
└── lib/               # Libraries (appError)
```
