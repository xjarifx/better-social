# Architecture

## Overview

Better Media is a monorepo Next.js 16 application using the App Router for both pages and API routes. The frontend and backend live in the same project, with API routes under `/api/v1` and pages under route groups `(auth)` and `(main)`.

## Project Structure

```
src/
  app/                  Next.js App Router
    (auth)/             Auth pages (login, register)
    (main)/             Main app pages (feed, profile, search, billing, etc.)
    api/                API route handlers (auth, posts, users, comments, likes, follows, blocks, billing)

  components/           React components
    index.ts            Barrel exports
    Feed.tsx            Feed component (post list)
    PostCard.tsx        Individual post display
    PostComposer.tsx    Post creation UI
    PostComposerModal.tsx Post creation modal
    EditPostModal.tsx   Post editing modal
    CommentsModal.tsx   Comments/replies modal
    ProBadge.tsx        PRO plan badge
    ProtectedRoute.tsx  Auth gate wrapper
    TopNav.tsx          Top navigation bar
    MobileNav.tsx       Mobile navigation
    RightSidebar.tsx    Sidebar with suggestions/trends
    Avatar.tsx          User avatar
    Spinner.tsx         Loading spinner
    EmptyState.tsx      Empty state placeholder
    LoadingSkeleton.tsx Skeleton loader
    ErrorMessage.tsx    Error display
    UserCard.tsx        User card component
    UserInfo.tsx        User info display
    ThemeProvider.tsx   Theme context provider
    PageTransition.tsx  Page transition wrapper
    ...

  context/              React context providers
    AuthContext.tsx     Authentication state
    BlockContext.tsx    Block state

  hooks/                Custom React hooks
    useComments.ts      Comments management
    useDraft.ts         Draft post persistence

  lib/                  Core application logic
    prisma.ts           Prisma client singleton
    errors.ts           Custom error classes
    pagination.ts       Pagination helpers
    rate-limit.ts       Rate limiting utilities
    imagekit.ts         ImageKit upload client
    utils.ts            General utilities
    transformPost.ts    Post data transformation helpers
    motion.ts           Framer motion variants
    theme.ts            Theme utilities

  services/             Server-side business logic
    auth.ts             Auth logic (register, login)
    posts.ts            Post CRUD and feed logic
    comments.ts         Comment CRUD
    likes.ts            Like/unlike logic
    follows.ts          Follow/unfollow logic
    blocks.ts           Block/unblock logic
    billing.ts          Stripe integration
    user.ts             User profile logic
    api.ts              Client-side API call wrapper

  ui/                   Primitive UI components
    index.ts            Barrel exports
    button.tsx          Button component
    input.tsx           Input component
    textarea.tsx        Textarea component
    dialog.tsx          Dialog/modal component
    dropdown-menu.tsx   Dropdown menu component
    card.tsx            Card component
    tabs.tsx            Tabs component
    avatar.tsx          Avatar UI primitive
    tooltip.tsx         Tooltip component
    separator.tsx       Separator component

  utils/                Utility functions
    auth.ts             JWT token helpers

  types/                TypeScript type definitions

generated/prisma/       Prisma client output
prisma/
  schema.prisma         Database schema
  seed.ts               Sample data seeder
```

## Routing

| Route Group | Path | Description |
|---|---|---|
| `(auth)` | `/login`, `/register` | Unauthenticated pages |
| `(main)` | `/`, `/profile/:id`, `/search`, `/billing` | Authenticated pages |
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
      BillingPage          -> Plan management
```

## Authentication Flow

1. User registers or logs in via `/api/v1/auth/register` or `/api/v1/auth/login`
2. Server returns an `accessToken` (JWT)
3. Client stores the token, sends `Authorization: Bearer <accessToken>` on every request
4. API routes call `authenticateRequest()` to verify the JWT



## Error Handling

API routes throw typed errors (`AuthError`, `NotFoundError`, `ValidationError`, `ConflictError`, `ForbiddenError`) which are caught by a centralized `withErrorHandler` wrapper that returns the standard `{ success, data, error }` envelope.
