# Database

## Overview

PostgreSQL database managed via Prisma 7 ORM. The schema is defined in `prisma/schema.prisma` and the Prisma client is generated to `generated/prisma/`.

## Models

### User (`users`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| username | String | Unique |
| email | String | Unique |
| password | String | bcryptjs hash |
| firstName | String | |
| lastName | String | |
| plan | Enum (FREE, PRO) | Default: FREE |
| planStatus | String? | Stripe subscription status |
| planStartedAt | DateTime? | |
| stripeCustomerId | String? | Unique |
| stripeSubscriptionId | String? | Unique |
| stripeCurrentPeriodEndAt | DateTime? | |
| createdAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

### Post (`posts`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| authorId | UUID | FK -> users.id |
| content | Text | FREE: max 20 chars, PRO: max 100 |
| imageUrl | String? | ImageKit CDN URL |
| visibility | Enum (PUBLIC, PRIVATE) | |
| likesCount | Int | Denormalized counter |
| commentsCount | Int | Denormalized counter |
| createdAt | DateTime | |
| updatedAt | DateTime | |
| deletedAt | DateTime? | Soft delete |

### Comment (`comments`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| postId | UUID | FK -> posts.id |
| authorId | UUID | FK -> users.id |
| parentId | UUID? | FK -> comments.id (self-referencing for replies) |
| content | Text | Max 500 chars |
| likesCount | Int | Denormalized counter |
| createdAt | DateTime | |
| updatedAt | DateTime | |

### Like (`likes`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK -> users.id |
| postId | UUID | FK -> posts.id |
| createdAt | DateTime | |
| **Unique** | (userId, postId) | One like per user per post |

### CommentLike (`comment_likes`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK -> users.id |
| commentId | UUID | FK -> comments.id |
| createdAt | DateTime | |
| **Unique** | (userId, commentId) | One like per user per comment |

### Follower (`followers`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| followerId | UUID | FK -> users.id (the user who follows) |
| followingId | UUID | FK -> users.id (the user being followed) |
| createdAt | DateTime | |
| **Unique** | (followerId, followingId) | Unidirectional follow |

### Notification (`notifications`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK -> users.id (recipient) |
| type | Enum (LIKE, COMMENT, NEW_FOLLOWER) | |
| relatedUserId | UUID | FK -> users.id (triggering user) |
| relatedPostId | UUID? | FK -> posts.id (optional, for like/comment notifications) |
| message | String | Human-readable summary |
| read | Boolean | Default: false |
| createdAt | DateTime | |

### RefreshToken (`refresh_tokens`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| userId | UUID | FK -> users.id |
| token | String | Unique, opaque string |
| expiresAt | DateTime | Default 30 days |
| revokedAt | DateTime? | Set on logout/rotation |
| createdAt | DateTime | |

### Block (`blocks`)
| Column | Type | Notes |
|---|---|---|
| id | UUID | PK |
| blockerId | UUID | FK -> users.id (user who blocks) |
| blockedId | UUID | FK -> users.id (user being blocked) |
| createdAt | DateTime | |
| **Unique** | (blockerId, blockedId) | |

## Relations Diagram

```
User --< Post          (author)
User --< Comment       (author)
User --< Like          (liker)
User --< CommentLike   (liker)
User --< Follower      (follower/following)
User --< Notification  (recipient)
User --< Notification  (triggering user)
User --< RefreshToken
User --< Block         (blocker/blocked)

Post --< Comment       (parent post)
Post --< Like          (likes on post)
Post --< Notification  (related post)

Comment --< Comment    (self-referencing, parentId for nested replies)
Comment --< CommentLike

Block -- unique(blockerId, blockedId)
Follower -- unique(followerId, followingId)
Like -- unique(userId, postId)
CommentLike -- unique(userId, commentId)
```

## Soft Deletes

Posts, comments, likes, comment likes, users, and notifications support soft deletes via a `deletedAt` timestamp. Queries filter out soft-deleted records by default.
