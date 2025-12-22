# Simple Next.js Frontend Template

A minimalist Next.js frontend starter template that connects to the simple API backend.

## Features

- ✅ Next.js 16 with App Router
- ✅ TypeScript
- ✅ Tailwind CSS
- ✅ Shadcn/ui components (minimal set)
- ✅ React Hook Form + Zod validation
- ✅ SWR for data fetching
- ✅ Authentication (login, register)
- ✅ User dashboard & profile

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

3. Update the API URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

4. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Project Structure

```
src/
├── app/              # Next.js App Router pages
│   ├── (auth)/      # Auth pages (login, register)
│   └── dashboard/   # Protected dashboard pages
├── components/
│   └── ui/          # Shadcn/ui components
├── lib/             # Utilities (fetcher, utils)
├── hooks/           # Custom React hooks
├── services/        # API service functions
└── types/           # TypeScript types
```

## API Integration

This frontend is designed to work with the `simple-api-starter-template` backend.

Make sure your backend is running on the URL specified in `NEXT_PUBLIC_API_URL`.

## Available Pages

- `/` - Home/Landing page
- `/login` - Login page
- `/register` - Register page
- `/dashboard` - User dashboard (protected)
- `/dashboard/profile` - User profile (protected)
