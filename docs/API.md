# API

Base URL: `/api/v1`

## Response Envelope

All responses follow `{ success: boolean, data: T | null, error: string | null }`.

## Status Codes

| Code | Usage |
|------|-------|
| 200 | Success (GET, PATCH) |
| 201 | Created (POST) |
| 204 | No content (some DELETE) |
| 400 | Validation error / bad request |
| 401 | Authentication required / invalid token |
| 403 | Forbidden (not authorized, private resource, block) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already following, already liked, already blocked) |
| 500 | Internal server error |

## Auth

All protected endpoints require: `Authorization: Bearer <access_token>`

Access tokens are JWT-based (5 min TTL). Refresh tokens are opaque (30 day TTL) with revocation and rotation support.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Create account (username, email, password, firstName, lastName) |
| POST | /auth/login | No | Login with email/password |
| POST | /auth/logout | Yes | Revoke refresh token |
| POST | /auth/refresh | No | Rotate token pair |
| GET | /posts | Yes | Following feed (paginated) |
| POST | /posts | Yes | Create post (multipart, optional image) |
| GET | /posts/feed | Yes | Alias for GET /posts |
| GET | /posts/for-you | Yes | 2nd-degree connections feed |
| GET | /posts/:postId | Optional | Single post with top comments |
| PATCH | /posts/:postId | Yes* | Update content/visibility (* author only) |
| DELETE | /posts/:postId | Yes* | Delete post (* author only) |
| POST | /posts/:postId/likes | Yes | Like post |
| DELETE | /posts/:postId/likes | Yes | Unlike post |
| GET | /posts/:postId/likes | Yes | List users who liked |
| POST | /posts/:postId/comments | Yes | Create comment/reply |
| GET | /posts/:postId/comments | Yes | List comments (paginated) |
| PATCH | /posts/:postId/comments/:commentId | Yes* | Edit comment (* author only) |
| DELETE | /posts/:postId/comments/:commentId | Yes* | Delete comment subtree (* author only) |
| POST | /posts/:postId/comments/:commentId/likes | Yes | Like comment |
| DELETE | /posts/:postId/comments/:commentId/likes | Yes | Unlike comment |
| GET | /users/me | Yes | Get own profile |
| PATCH | /users/me | Yes | Update profile (firstName, lastName) |
| GET | /users/:userId | No | Get public profile |
| GET | /users/:userId/posts | Optional | Get user's posts |
| POST | /users/:userId/follow | Yes | Follow user |
| DELETE | /users/:userId/follow/:followingId | Yes | Unfollow |
| GET | /users/:userId/followers | Yes | List followers |
| GET | /users/:userId/following | Yes | List following |
| GET | /users/search?q= | Yes | Search users (partial match) |
| GET | /notifications | Yes | List notifications |
| GET | /notifications/:notificationId | Yes* | Get notification (* recipient only) |
| PATCH | /notifications/:notificationId | Yes* | Mark read/unread (* recipient only) |
| DELETE | /notifications/:notificationId | Yes* | Delete notification (* recipient only) |
| GET | /blocks | Yes | List blocked users |
| POST | /blocks | Yes | Block user by username |
| DELETE | /blocks | Yes | Unblock user by username |
| GET | /blocks/check/:userId | Yes | Check block status |
| GET | /billing/me | Yes | Get billing status |
| POST | /billing/create-checkout-session | Yes | Create Stripe checkout |
| POST | /billing/create-payment-intent | Yes | Create Stripe payment intent |
| GET | /billing/confirm | Yes | Confirm payment after redirect |
| POST | /billing/downgrade | Yes | Downgrade to FREE |
| POST | /billing/webhook | Stripe sig | Stripe event webhook |
| GET | /health/cache | No | Cache health check |

## Content Limits

| Item | Limit |
|---|---|
| Post (FREE) | 20 chars |
| Post (PRO) | 100 chars |
| Comment | 500 chars (all plans) |

## Pagination

Paginated endpoints accept `limit` (default 20) and `offset` (default 0) and return `{ data: { ..., total, limit, offset } }`.

## Caching

Backend: Redis (if `REDIS_URL` set) or in-memory Map fallback.

| Domain | TTL | Key Pattern |
|---|---|---|
| Following feed | 30s | `feed:{userId}:{limit}:{offset}` |
| For You feed | 30s | `for-you:{userId}:{limit}:{offset}` |
| Single post | 60s | `post:{postId}:viewer:{userId}` |
| User profile | 120s | `user:public:{userId}` |
| User timeline | 30s | `timeline:{userId}:{viewerId}:{limit}:{offset}` |
| Comments | 30s | `comments:{postId}:{parentId}:{limit}:{offset}:{userId}` |
| Notifications | 20s | `notifications:{userId}:{readFilter}:{limit}:{offset}` |

## Feed Algorithm

- **Following Feed:** PUBLIC posts from users the authenticated user follows, excluding blocked users and self, sorted by `createdAt DESC`.
- **For You Feed:** PUBLIC posts from 2nd-degree connections (users followed by users you follow), excluding direct followings, blocked users, and self, sorted by `createdAt DESC`. Returns empty if user follows nobody.

## Blocking Behavior

- Bidirectional — either user can block the other
- Removes all follow relationships in both directions
- Blocked users excluded from all feeds
- Prevents follows (403 if block exists)
- Check endpoint returns `blockedByMe` and `blockedByThem` flags

## Notification Triggers

| Action | Type | Recipient |
|---|---|---|
| Like a post | LIKE | Post author |
| Comment on a post | COMMENT | Post author |
| Follow a user | NEW_FOLLOWER | Followed user |

## Image Upload

- Provider: ImageKit CDN. Upload path: `/better-media/posts/`
- Sent as `multipart/form-data`, base64-encoded for ImageKit API
- Requires `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`

## Interactive Docs

Full OpenAPI 3.0.3 spec at `/api-docs` when the server is running.
