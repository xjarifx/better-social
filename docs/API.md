# API

Base URL: `/api`

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

Access tokens are JWT-based.

## Endpoints

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | /auth/register | No | Create account (username, email, password, firstName, lastName) |
| POST | /auth/login | No | Login with email/password |
| POST | /auth/logout | Yes | Log out |
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


## Content Limits

| Item | Limit |
|---|---|
| Post (FREE) | 20 chars |
| Post (PRO) | 100 chars |
| Comment | 500 chars (all plans) |

## Pagination

Paginated endpoints accept `limit` (default 20) and `offset` (default 0) and return `{ data: { ..., total, limit, offset } }`.


## Feed Algorithm

- **Following Feed:** PUBLIC posts from users the authenticated user follows, excluding blocked users and self, sorted by `createdAt DESC`.
- **For You Feed:** PUBLIC posts from 2nd-degree connections (users followed by users you follow), excluding direct followings, blocked users, and self, sorted by `createdAt DESC`. Returns empty if user follows nobody.

## Blocking Behavior

- Bidirectional — either user can block the other
- Removes all follow relationships in both directions
- Blocked users excluded from all feeds
- Prevents follows (403 if block exists)
- Check endpoint returns `blockedByMe` and `blockedByThem` flags

## Image Upload

- Provider: ImageKit CDN. Upload path: `/better-media/posts/`
- Sent as `multipart/form-data`, base64-encoded for ImageKit API
- Requires `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT`