# Better Media

- **What is this project?** A full-stack social media platform with Twitter/X-like functionality — user profiles, posts and feeds, threaded comments, likes, follows, user blocking, and PRO subscription via Stripe. Built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, PostgreSQL (Prisma 7), JWT auth, and ImageKit CDN.

- **How do I use it?** Run `npm install`, copy `.env.example` to `.env` and fill in your database connection string, then run `npm run db:push` to set up the schema, optionally `npm run db:seed` for sample data, and `npm run dev` to start. The app runs at `http://localhost:3000`.

- **Where do I find more details?**
  - [Architecture](./docs/architecture.md) — project structure, routing, component tree, auth flow
  - [Database](./docs/database.md) — schema, models, relations, indexes
  - [API](./docs/api.md) — full API reference, endpoints, request/response formats, error codes
  - Interactive Swagger UI at `/api-docs` when the server is running
