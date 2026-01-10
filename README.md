# Blog Manager

A full-stack blog management platform built with Express.js, Prisma ORM, and Next.js, featuring multi-tenancy support, AI-powered content generation, and comprehensive blog administration capabilities.

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local Development Setup](#local-development-setup)
  - [Docker Deployment](#docker-deployment)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)

## 🌟 Overview

Blog Manager is a comprehensive content management system designed for managing multiple blogs with features including user authentication, role-based access control, content categorization, AI-assisted content creation, and image management with Cloudflare R2 integration.

## 🏗️ Architecture

The project consists of three main components:

### **API (Backend)**

- **Framework**: Express.js with TypeScript
- **Database**: MariaDB with Prisma ORM
- **Caching**: Redis for session management and caching
- **Queue System**: BullMQ for background job processing
- **Storage**: Cloudflare R2 for image storage
- **AI Integration**: OpenAI for content generation

The backend provides RESTful APIs for:

- User authentication and authorization
- Blog and post management
- Category and tag organization
- Multi-user collaboration with role-based permissions
- AI-powered content and image prompt generation
- Automated content scheduling and publishing

### **Frontend**

- **Framework**: Next.js 16 with React 19
- **UI Components**: Radix UI with TailwindCSS
- **Forms**: React Hook Form with Zod validation
- **Data Fetching**: SWR for efficient data management
- **Styling**: TailwindCSS with custom animations

The frontend provides an intuitive dashboard for:

- Blog creation and management
- Post creation with rich text editing
- Media library management
- User and permission management
- Analytics and insights

### **Worker**

A separate background worker process handles:

- Scheduled content publishing
- AI content generation tasks
- Image processing and optimization
- Bulk operations and exports

## ✨ Features

- 🔐 **Authentication & Authorization**: Secure session-based authentication with role-based access control
- 📝 **Multi-Blog Management**: Create and manage multiple blogs with independent settings
- 👥 **Team Collaboration**: Invite members with granular permissions (admin, editor, author)
- 🏷️ **Content Organization**: Categories and tags for efficient content categorization
- 🤖 **AI-Powered Content**: Generate post content, titles, and image prompts using OpenAI
- 📷 **Image Management**: Upload and manage images with Cloudflare R2 integration
- ⏰ **Scheduled Publishing**: Schedule posts for future publication
- 🔄 **Background Processing**: Asynchronous task handling with BullMQ
- 🚀 **Performance**: Redis caching for optimized response times
- 📊 **API Rate Limiting**: Protection against abuse with configurable rate limits

## 🛠️ Tech Stack

### Backend

- Node.js + TypeScript
- Express.js
- Prisma ORM
- MariaDB
- Redis
- BullMQ
- OpenAI SDK
- AWS SDK (S3 compatible for R2)
- Sharp (image processing)
- Helmet, CORS, express-session

### Frontend

- Next.js 16
- React 19
- TypeScript
- TailwindCSS
- Radix UI
- React Hook Form
- Zod
- SWR
- Lucide Icons

## 🚀 Getting Started

### Prerequisites

- Node.js (v20 or higher)
- npm or yarn
- MariaDB (v11 or higher)
- Redis (v7 or higher)
- Docker and Docker Compose (for containerized deployment)

### Local Development Setup

#### 1. Clone the repository

```bash
git clone <repository-url>
cd blog-manager
```

#### 2. Install dependencies

Install dependencies for both API and Frontend:

```bash
npm install
```

This will install the root-level dependencies. Then install dependencies for each service:

```bash
# Install API dependencies
cd api
npm install

# Install Frontend dependencies
cd ../frontend
npm install
```

#### 3. Set up environment variables

Create `.env.local` file in the `api` directory:

```bash
cd api
cp .env.example .env.local
```

Edit `api/.env.local` with your configuration:

```env
# Database
DATABASE_URL="mysql://user:password@localhost:3306/blog_manager"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Session
SESSION_SECRET=your-secure-session-secret-here

# Server
PORT=5000
NODE_ENV=development

# Cloudflare R2 (optional)
R2_ACCOUNT_ID=your-r2-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=your-bucket-name

# OpenAI (optional)
OPENAI_API_KEY=your-openai-api-key

# Netlify (optional)
NETLIFY_API_TOKEN=your-netlify-token
```

Create `.env.local` file in the `frontend` directory:

```bash
cd ../frontend
cp .env.example .env.local
```

Edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

#### 4. Set up the database

Ensure MariaDB and Redis are running locally, then run Prisma migrations:

```bash
cd api
npx prisma migrate dev
```

Optionally, seed the database:

```bash
npx prisma db seed
```

#### 5. Run the development servers

From the root directory, you can run both services:

```bash
# Run both API and Frontend
npm run dev

# Or run them separately:
npm run dev:api      # API only
npm run dev:frontend # Frontend only
npm run dev:worker   # Worker only
```

The services will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000
- **Worker**: Background process (no web interface)

### Docker Deployment

#### 1. Prepare environment files

Create `.env` files for both API and Frontend (follow the same structure as `.env.local` files above).

**Important**: For Docker deployment, update database and Redis hosts in `api/.env`:

```env
DATABASE_URL="mysql://user:password@mariadb:3306/blog_manager"
REDIS_HOST=redis
REDIS_PORT=6379
```

#### 2. Build and start all services

```bash
docker-compose up -d
```

This will:

- Start MariaDB database
- Start Redis cache
- Build and start the API server
- Build and start the background worker
- Build and start the Frontend application

#### 3. View logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api
docker-compose logs -f frontend
docker-compose logs -f worker
```

#### 4. Stop services

```bash
docker-compose down
```

To stop and remove volumes (⚠️ this will delete your data):

```bash
docker-compose down -v
```

#### 5. Rebuild after code changes

```bash
docker-compose up -d --build
```

The services will be available at:

- **Frontend**: http://localhost:3000
- **API**: http://localhost:5000 (or custom PORT from .env)

## 📁 Project Structure

```
blog-manager/
├── api/                      # Backend API
│   ├── src/
│   │   ├── app.ts           # Express app configuration
│   │   ├── server.ts        # Server entry point
│   │   ├── worker.ts        # Background worker entry point
│   │   ├── controllers/     # Route controllers
│   │   ├── services/        # Business logic
│   │   ├── routes/          # API routes
│   │   ├── middlewares/     # Express middlewares
│   │   ├── lib/             # Utilities and helpers
│   │   ├── types/           # TypeScript type definitions
│   │   └── prompts/         # AI prompts for content generation
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── migrations/      # Database migrations
│   ├── tests/               # API tests
│   ├── Dockerfile
│   └── package.json
│
├── frontend/                 # Next.js Frontend
│   ├── src/
│   │   ├── app/             # Next.js app directory
│   │   │   ├── dashboard/   # Dashboard pages
│   │   │   └── login/       # Authentication pages
│   │   ├── components/      # React components
│   │   ├── services/        # API client services
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities
│   │   └── types/           # TypeScript type definitions
│   ├── public/              # Static assets
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml        # Docker orchestration
└── package.json              # Root package.json for scripts
```

## 📚 API Documentation

All API endpoints are prefixed with `/api/v1`.

### Main API Endpoints

#### Authentication

- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/session` - Get current session

#### Admin

- `POST /api/v1/admin/create-user` - Create new user (admin only)

#### Users

- `GET /api/v1/users/me` - Get current user profile
- `PATCH /api/v1/users/me` - Update current user profile

#### Blogs

- `GET /api/v1/blogs` - List user's blogs
- `POST /api/v1/blogs` - Create new blog
- `GET /api/v1/blogs/:blogId` - Get blog details
- `PATCH /api/v1/blogs/:blogId` - Update blog
- `GET /api/v1/blogs/:blogId/members` - List blog members
- `POST /api/v1/blogs/:blogId/members` - Add blog member
- `DELETE /api/v1/blogs/:blogId/members/:userId` - Remove blog member

#### Posts

- `GET /api/v1/posts` - List posts (with query filters)
- `POST /api/v1/posts` - Create new post
- `GET /api/v1/posts/id/:postId` - Get post by ID
- `PATCH /api/v1/posts/:postId` - Update post
- `DELETE /api/v1/posts/:postId` - Delete post
- `POST /api/v1/posts/:postId/markdown` - Export post as markdown

#### Categories

- `GET /api/v1/categories` - List categories (with blogId query)
- `POST /api/v1/categories` - Create category

#### Tags

- `GET /api/v1/tags` - List tags (with blogId query)
- `POST /api/v1/tags` - Create tag

#### Authors

- `GET /api/v1/authors` - List authors (with blogId query)
- `POST /api/v1/authors` - Create author

#### AI Creator Features

- `POST /api/v1/creator/generate-title-suggestions` - Generate title suggestions
- `POST /api/v1/creator/generate-post-content` - Generate post content
- `POST /api/v1/creator/generate-post-edit` - Generate post edits
- `POST /api/v1/creator/generate-image-prompt` - Generate image prompts

#### Prompts Management

- `GET /api/v1/prompts` - List prompts (with blogId query)
- `POST /api/v1/prompts` - Create custom prompt
- `PUT /api/v1/prompts/:id` - Update prompt

#### Public API (requires API key)

- `GET /api/v1/public/posts` - Get public posts
- `GET /api/v1/public/posts/:slug` - Get public post by slug
- `GET /api/v1/public/categories` - Get public categories
- `GET /api/v1/public/tags` - Get public tags
- `GET /api/v1/public/blogs/:blogId` - Get public blog info

For detailed API documentation, refer to the route files in [api/src/routes](api/src/routes).

## 🔧 Environment Variables

### API Environment Variables

| Variable               | Description                   | Required | Default       |
| ---------------------- | ----------------------------- | -------- | ------------- |
| `DATABASE_URL`         | MariaDB connection string     | Yes      | -             |
| `REDIS_HOST`           | Redis server host             | Yes      | `localhost`   |
| `REDIS_PORT`           | Redis server port             | Yes      | `6379`        |
| `SESSION_SECRET`       | Secret for session encryption | Yes      | -             |
| `PORT`                 | API server port               | No       | `5000`        |
| `NODE_ENV`             | Environment mode              | No       | `development` |
| `R2_ACCOUNT_ID`        | Cloudflare R2 account ID      | No       | -             |
| `R2_ACCESS_KEY_ID`     | Cloudflare R2 access key      | No       | -             |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 secret key      | No       | -             |
| `R2_BUCKET_NAME`       | Cloudflare R2 bucket name     | No       | -             |
| `OPENAI_API_KEY`       | OpenAI API key                | No       | -             |
| `NETLIFY_API_TOKEN`    | Netlify API token             | No       | -             |

### Frontend Environment Variables

| Variable              | Description     | Required | Default                 |
| --------------------- | --------------- | -------- | ----------------------- |
| `NEXT_PUBLIC_API_URL` | Backend API URL | Yes      | `http://localhost:5000` |

## ⚠️ Important Notes & Limitations

### Netlify Integration Requirement

Each blog in the system requires a Netlify site ID (`netlifySiteId`) for deployment and hosting. You must have a Netlify site set up before creating a blog in this system.

### Multi-Tenancy Considerations

The current implementation uses **global configuration** for third-party services rather than per-blog configuration. The following environment variables are shared across all blogs:

- `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ACCOUNT_ID`
- `OPENAI_API_KEY`
- `NETLIFY_API_TOKEN`

**Note**: This approach is not ideal for true multi-tenancy. Future improvements will include moving these credentials to the Prisma schema to enable per-blog configuration, allowing different blogs to use different storage buckets, AI accounts, and deployment targets, but as per now, im the only one using this so im keeping like this.

## 📝 License

This project is private and proprietary.

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

---

Built with ❤️ using Express.js, Prisma, Next.js, and TypeScript
