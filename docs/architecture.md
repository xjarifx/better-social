# Architecture

## Overview

Better Media is a monorepo Next.js 16 application using the App Router for both pages and API routes. The frontend and backend live in the same project, with API routes under `/api/v1` and pages under route groups `(auth)` and `(main)`.

## Project Structure

```
app/                  Next.js App Router
  (auth)/             Auth pages (login, register)
  (main)/             Main app pages (feed, profile, search, notifications, billing, etc.)
  api/v1/             API route handlers (auth, posts, users, comments, likes, follows, notifications, blocks, billing, health)
  api-docs/           Swagger UI page
components/           React components
  ui/                 Primitive UI components (button, input, dialog, etc.)
  theme/              Theme-related components
  common/             Shared components
  Feed.tsx            Feed component (post list)
  PostCard.tsx        Individual post display
  PostComposer.tsx    Post creation UI
  CommentsModal.tsx   Comments/replies modal
  TopNav.tsx          Top navigation bar
  MobileNav.tsx       Mobile navigation
  RightSidebar.tsx    Sidebar with suggestions/trends
lib/                  Core application logic
  auth.ts             JWT token verification
  cache.ts            Redis / in-memory cache abstraction
  prisma.ts           Prisma client singleton
  env.ts              Environment variable helpers
  errors.ts           Custom error classes
  openapi.ts          OpenAPI 3.0.3 spec for Swagger UI
  pagination.ts       Pagination helpers
  rate-limit.ts       Rate limiting utilities
  imagekit.ts         ImageKit upload client
  utils.ts            General utilities
  transformPost.ts    Post data transformation helpers
  context/            React context providers
    AuthContext.tsx   Authentication state
    BlockContext.tsx  Block state
  hooks/              Custom React hooks
    useComments.ts    Comments management
    useDraft.ts       Draft post persistence
  services/           API service layer (backend)
    api.ts            Client-side API call wrapper
    auth.service.ts   Auth logic
    posts.service.ts  Post CRUD and feed logic
    comments.service.ts Comment CRUD
    likes.service.ts  Like/unlike logic
    follows.service.ts Follow/unfollow logic
    notifications.service.ts Notification logic
    blocks.service.ts Block/unblock logic
    billing.service.ts Stripe integration
    user.service.ts   User profile logic
generated/            Prisma client output
prisma/
  schema.prisma       Database schema
  seed.ts             Sample data seeder
```

## Routing

| Route Group | Path | Description |
|---|---|---|
| `(auth)` | `/login`, `/register` | Unauthenticated pages |
| `(main)` | `/`, `/profile/:id`, `/search`, `/notifications`, `/billing` | Authenticated pages |
| `api/v1` | `/api/v1/*` | REST API endpoints |

The `(auth)` layout redirects authenticated users to `/`. The `(main)` layout redirects unauthenticated users to `/login`.

## Component Hierarchy

```
App Layout
  Providers (AuthContext, BlockContext, ThemeProvider)
    (auth)/layout         -> Login / Register pages
    (main)/layout         -> TopNav + Content
      HomePage             -> PostComposer + Feed tabs (For You / Following)
      ProfilePage          -> User info + PostCard list
      SearchPage           -> User search results
      NotificationsPage    -> Notification list
      BillingPage          -> Plan management
```

## Authentication Flow

1. User registers or logs in via `/api/v1/auth/register` or `/api/v1/auth/login`
2. Server returns `accessToken` (JWT, 5 min) and `refreshToken` (opaque, 30 days)
3. Client stores tokens, sends `Authorization: Bearer <accessToken>` on every request
4. API routes call `authenticateRequest()` to verify the JWT
5. When access token expires, client calls `/api/v1/auth/refresh` with the refresh token
6. Old refresh token is revoked, new pair is issued (token rotation)

## Caching

Two backends are supported:

- **Redis** — when `REDIS_URL` is set in environment
- **In-memory Map** — fallback when Redis is not configured

Both implement the same interface (`get`, `set`, `del`, `invalidatePattern`). Cache TTLs vary by domain (20s for notifications, 30s for feeds/comments, 60s for single posts, 120s for user profiles).

## Error Handling

API routes throw typed errors (`AuthError`, `NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError`) which are caught by a centralized `withErrorHandler` wrapper that returns the standard `{ success, data, error }` envelope.
