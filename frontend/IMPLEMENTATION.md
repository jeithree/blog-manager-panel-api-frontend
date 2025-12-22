# Blog Manager Frontend

A comprehensive blog management dashboard built with Next.js, featuring AI-powered content generation.

## Features

### 🚀 Post Management

- **AI-Powered Creation Flow**: Multi-step post creation with AI assistance
  - AI-generated title suggestions
  - Automatic content generation based on category and title
  - AI-generated tags
  - AI-generated image prompts
  - Retry functionality for each generation step
- **Markdown Editor**: Dual-mode editor with live preview and code editing
- **Post Listing**: Filterable list with categories and tags
- **Post Editing**: Full edit capabilities with AI-assisted improvements
- **Publishing Options**:
  - Save as draft
  - Schedule for later
  - Publish immediately

### 📝 Content Organization

- **Blogs**: Create and manage multiple blogs with Netlify and R2 integration
- **Categories**: Organize posts by categories
- **Tags**: Flexible tagging system with AI-generated tag support
- **Authors**: Manage post authors

### 🎨 UI Components

- Modern, responsive design using Tailwind CSS
- Shadcn/ui component library
- Dark mode support
- Mobile-friendly navigation

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── dashboard/
│   │   │   ├── blogs/              # Blog management
│   │   │   ├── posts/              # Post creation & editing
│   │   │   ├── categories-tags/   # Category & tag management
│   │   │   └── page.tsx            # Dashboard home
│   │   ├── login/                  # Login page
│   │   ├── register/               # Registration page
│   │   └── layout.tsx              # Root layout
│   ├── components/
│   │   ├── ui/                     # Reusable UI components
│   │   ├── DashboardNav.tsx        # Dashboard navigation
│   │   └── MarkdownEditor.tsx      # Markdown editor with preview
│   ├── services/                   # API service layer
│   │   ├── auth.ts
│   │   ├── blog.ts
│   │   ├── post.ts
│   │   ├── category.ts
│   │   ├── tag.ts
│   │   ├── author.ts
│   │   └── creator.ts              # AI generation services
│   ├── hooks/
│   │   └── useSession.ts           # Session management hook
│   ├── lib/
│   │   ├── fetcher.ts              # API client
│   │   └── utils.ts                # Utility functions
│   └── types/                      # TypeScript types
```

## Post Creation Flow

The post creation process follows a natural, step-by-step workflow:

1. **Blog Selection**: Choose which blog to create the post for
2. **Title Generation**:
   - Select a category for AI context
   - Generate AI title suggestions
   - Choose a suggestion or enter custom title
   - Retry option available
3. **Content Generation**:
   - AI generates full post content based on title and category
   - Automatic description generation
   - AI suggests relevant tags
   - Retry option to regenerate content
   - Markdown editor with live preview
4. **Post Details**:
   - Auto-generated slug (editable)
   - Featured image upload
   - AI-generated image prompt
   - Tag management (AI-generated tags are auto-saved)
5. **Publishing**:
   - Save as draft
   - Schedule for specific date/time
   - Publish immediately

## Key Features

### Markdown Editor

- **Dual Mode**: Switch between code editing and preview
- **Live Preview**: See rendered markdown in real-time
- **Full Markdown Support**: Headers, bold, italic, links, images, code blocks, lists

### AI Integration

All AI generation steps include retry buttons:

- Title suggestions
- Post content generation
- Tag generation (auto-saved to database)
- Image prompt generation
- Post editing with change requests

### Tag Management

- AI-generated tags are automatically created if they don't exist
- Manual tag creation available
- Tags persist across the blog
- Easy tag assignment during post creation/editing

## API Integration

All services connect to the backend API:

- Automatic authentication via cookies
- Type-safe API calls
- Error handling
- Form data support for file uploads

## Getting Started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Set up environment variables:

   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:3000
   ```

3. Run the development server:

   ```bash
   npm run dev
   ```

4. Open [http://localhost:3001](http://localhost:3001)

## Environment Variables

- `NEXT_PUBLIC_API_URL`: Backend API URL (default: http://localhost:3000)

## Navigation

The dashboard includes a responsive navigation bar with:

- Overview (Dashboard home)
- Posts (List and manage posts)
- Blogs (Manage blogs)
- Categories & Tags (Content organization)
- Logout

## Authentication

The frontend uses session-based authentication:

- Login/Register pages
- Protected dashboard routes
- Automatic redirect to login if unauthenticated
- Session management with SWR

## Styling

- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: High-quality component library
- **Radix UI**: Accessible component primitives
- **Lucide React**: Beautiful icons

## Best Practices

- All forms include proper validation
- Loading states for async operations
- Error handling with user feedback
- Responsive design for all screen sizes
- Accessible components using Radix UI
- Type-safe with TypeScript
