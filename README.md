# Meridian Chat (Week 5)

Full-stack chat application built for the PLP MERN Stack Week 5 lab. The project combines an Express + MongoDB API with a Vite + React client, Clerk authentication, and Socket.IO for real-time messaging.

## Highlights

- Clerk-backed authentication and profile sync
- REST API for conversations, messages, and user directory data
- Socket.IO rooms that broadcast conversation updates in real time
- Tailwind-driven chat UI with conversation list, message viewport, and composer
- Environment-driven configuration for local dev and deployment

## Project Structure

```
.
├── backend            # Express + MongoDB API
└── frontend           # Vite + React client
```

## Prerequisites

- Node.js 18+ and npm
- MongoDB instance (local or hosted)
- Clerk application with JWT template configured (or integration fallback)

## Backend Environment

Create `backend/.env` with the following keys:

| Variable | Description | Example |
| --- | --- | --- |
| `PORT` | API port (defaults to 5000) | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://127.0.0.1:27017/meridian-chat` |
| `CLERK_SECRET_KEY` | Clerk secret key for server-side verification | `sk_test_...` |
| `CLERK_PUBLISHABLE_KEY` | Clerk publishable key (used to seed profile data) | `pk_test_...` |
| `CLERK_JWT_TEMPLATE` | (Optional) custom JWT template name | `integration_fallback` |
| `ALLOWED_ORIGINS` | Comma-separated list of allowed front-end origins | `http://localhost:5173` |

> `ALLOWED_ORIGINS` is applied to both Express CORS and Socket.IO. If unset, the server allows `http://localhost:5173` and `http://127.0.0.1:5173`.

## Frontend Environment

Create `frontend/.env` with:

| Variable | Description | Example |
| --- | --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `VITE_CLERK_JWT_TEMPLATE` | (Optional) template request name | `integration_fallback` |
| `VITE_API_URL` | Backend base URL | `http://localhost:5000` |
| `VITE_SOCKET_URL` | Socket.IO server URL (defaults to `VITE_API_URL`) | `http://localhost:5000` |

## Installation

```bash
# install backend dependencies
cd backend
npm install

# install frontend dependencies
cd ../frontend
npm install
```

## Running Locally

```bash
# terminal 1 - backend API + socket server
cd backend
npm run dev

# terminal 2 - frontend (Vite dev server)
cd frontend
npm run dev
```

The API listens on `http://localhost:5000` (unless you override `PORT`). The Vite dev server runs on `http://localhost:5173` by default.

### Available Scripts

Backend (`backend`):

- `npm run dev` – start API with Nodemon
- `npm start` – start API without reload

Frontend (`frontend`):

- `npm run dev` – Vite development server
- `npm run build` – production bundle
- `npm run preview` – preview production build
- `npm run lint` – run ESLint

## API Overview

All endpoints require a valid Clerk JWT (Bearer token).

- `GET /api/users` – list user directory profiles
- `POST /api/users/sync` – upsert the authenticated user's profile
- `GET /api/conversations` – list conversations that include the current user
- `POST /api/conversations` – ensure a one-to-one conversation exists
- `GET /api/conversations/:conversationId` – fetch conversation detail
- `GET /api/messages/:conversationId` – fetch message history
- `POST /api/messages` – send a message to a conversation

Health endpoints:

- `GET /` – simple readiness string
- `GET /healthz` – health check payload

## Socket Events

Clients authenticate the WebSocket connection with the same Clerk JWT (sent via `auth.token`).

- `conversation:join` – join a conversation room
- `conversation:leave` – leave a conversation room
- `message:new` – emit a new message; echoed to conversation members
- `conversation:update` – emitted when unread counts change

## Data Models

- `Conversation` – members, last message metadata, unread counts (Map keyed by Clerk ID)
- `Message` – conversation reference, sender info, text, read receipts, status
- `UserProfile` – cached Clerk profile fields for faster display

`backend/src/models` contains the full schema definitions.

## Clerk Notes

- API guards and Socket.IO middleware verify JWTs via `@clerk/backend`.
- Set `CLERK_JWT_TEMPLATE` / `VITE_CLERK_JWT_TEMPLATE` if you use a custom template; otherwise the integration fallback is used.
- Ensure the template includes the `sub`, `sid`, `email`, and image claims for profile sync.

## Troubleshooting

- **CORS/Socket errors** – confirm `ALLOWED_ORIGINS`, `VITE_API_URL`, and `VITE_SOCKET_URL` point to the same host/port.
- **401 Unauthorized** – verify Clerk keys and JWT template, and ensure the frontend retrieves tokens with `getToken`.
- **MongoDB connection failure** – check `MONGODB_URI` and that MongoDB is reachable.

## Deployment Tips

- Serve the backend behind HTTPS so Clerk JWTs are transmitted securely.
- Set production `ALLOWED_ORIGINS` and `VITE_*` URLs to the deployed front-end domain.
- Provision an Atlas or managed MongoDB instance for production workloads.

---

Repository: https://github.com/PLP-MERN-Stack-Development/Week5-Chat

