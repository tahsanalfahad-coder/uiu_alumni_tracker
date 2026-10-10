# UIU Alumni Tracker Portal — Full-Stack Monorepo & Deployment Guide

Welcome to the **UIU Alumni Tracker Portal**, an all-in-one platform built for United International University (UIU) graduates, current students, and university administrators.

The application features complete role isolation, real-time messaging, Mongoose data models, JWT authentication, role-based authorization, and a monorepo workspace design.

---

## 🏗️ Monorepo System Architecture

The project is organized as an npm monorepo workspace:

```text
/uiu-alumni-portal
  ├── /apps
  │     ├── /main-app        <- Guest + Student + Alumni experiences (Vite, Port 5173)
  │     └── /admin-app       <- Administrator experience only (Vite, Port 5174)
  ├── /packages
  │     └── /ui              <- Shared components (Button, Card, Badge, Modal, ChatPane, etc.)
  └── /server                <- Express + Socket.IO REST/Real-time Backend API (Port 5000)
```

### Security Model
- **Admin code is not shipped to the main app**: students and alumni load `apps/main-app`, which contains no admin pages. This only hides the UI.
- **The real protection is server-side**: every `/api/admin/*` route requires a valid JWT *and* the `admin` role, verified on the API.
- **Other protections**: algorithm-pinned JWTs, no fallback secrets, enforced CORS allowlist (REST + Socket.IO), login/registration rate limiting, security headers, conversation-membership checks on chat, ownership checks on mentorship requests and job posts.
- **Public data**: the public alumni directory never exposes email addresses.

---

## 🗄️ Database Setup Options

The backend connects to MongoDB via Mongoose using the `MONGODB_URI` environment variable.

### Option A — MongoDB Atlas (Recommended, No Local Install)
1. Register for a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).
2. Create a free **M0 Cluster** (no credit card required).
3. Under **Database Access**, create a user with a username and password.
4. Under **Network Access**, add IP `0.0.0.0/0` (allows access from local dev and deployment hosts).
5. Click **Connect** -> **Drivers** and copy the connection string:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/uiu-alumni?retryWrites=true&w=majority
   ```
6. Add this `MONGODB_URI` to `server/.env`.

### Option B — Local MongoDB
1. Download and install [MongoDB Community Edition](https://www.mongodb.com/try/download/community).
2. Start the local `mongod` daemon service.
3. Configure `server/.env`:
   ```env
   MONGODB_URI=mongodb://127.0.0.1:27017/uiu-alumni
   ```

---

## ⚡ Getting Started (Local Development)

### 1. Install Workspace Dependencies
From the repository root directory, run:
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` in `server`:
```bash
cp server/.env.example server/.env
```
Edit `server/.env`. **Never commit this file** (it is in `.gitignore`).

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/uiu-alumni
JWT_SECRET=<generate - see below>
JWT_EXPIRES_IN=2h
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
ADMIN_SEED_EMAIL=admin@uiu.ac.bd
ADMIN_SEED_PASSWORD=<choose your own, 10+ characters>
```

Generate a strong `JWT_SECRET` (the server **refuses to start** without one):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Seed Initial Administrator Account
Seed the initial admin credentials into the database:
```bash
npm run seed:admin
```
*(Optional sample dataset seed: `npm run seed:data`)*

### 4. Run All Services Concurrently
Start the Express backend (port 5000), main app (port 5173), and admin app (port 5174) simultaneously:
```bash
npm run dev
```

Or start individual services:
- `npm run dev:server` (Backend API on `http://localhost:5000`)
- `npm run dev:main` (Student/Alumni Main Portal on `http://localhost:5173`)
- `npm run dev:admin` (Admin Portal on `http://localhost:5174`)

---

## 💬 Real-Time Socket.IO Chat Architecture

Real-time chat is powered by **Socket.IO** integrated alongside the Express HTTP server:
- **Handshake Authentication**: Sockets pass the JWT token in `socket.handshake.auth.token`, verified server-side.
- **Room Subscriptions**: Users join rooms named `thread:<threadId>` for active conversations.
- **Instant Synchronization**: When a message is sent via REST (`POST /api/chat/threads/:id/messages`) or socket event (`send_message`), it is saved to MongoDB and instantly broadcast to room participants via `new_message`.

---

## 🚀 Live Public Deployment Guide

All four components (Database, Backend API, Main Frontend, Admin Frontend) can be deployed for free to public URLs.

### Step 1: Database Deployment (MongoDB Atlas)
- Create your M0 cluster on MongoDB Atlas as described in **Option A** above.

### Step 2: Backend API Deployment (Render.com)
1. Push your repository to GitHub.
2. Go to [Render Dashboard](https://dashboard.render.com/) -> **New** -> **Web Service**.
3. Select your GitHub repository.
4. Set **Root Directory** to `server`.
5. Set **Build Command** to `npm install`.
6. Set **Start Command** to `npm start`.
7. In the **Environment** tab, set:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = your Atlas connection string
   - `JWT_SECRET` = a freshly generated random value (never reuse your local one)
   - `JWT_EXPIRES_IN` = `2h`
   - `ADMIN_SEED_EMAIL` = your admin email
   - `ADMIN_SEED_PASSWORD` = a strong password you choose (10+ characters)
   - `ALLOWED_ORIGINS` = your final Vercel URLs (Step 5). Avoid `*` outside quick tests.
8. Deploy. Render assigns a public HTTPS URL (e.g. `https://uiu-alumni-api.onrender.com`).
9. Run the admin seed script via Render's **Shell** console: `npm run seed:admin`.

> 💡 **Note on Free-Tier Hosting**: Render web services spin down after 15 minutes of inactivity. First requests after sleeping may take 30–50 seconds to wake up.

### Step 3: Main Frontend Deployment (Vercel)
1. Go to [Vercel Dashboard](https://vercel.com/dashboard) -> **Add New Project**.
2. Select your repository and set **Root Directory** to `apps/main-app`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://uiu-alumni-api.onrender.com`
4. Deploy. Vercel generates a public URL (e.g., `https://uiu-alumni.vercel.app`).

### Step 4: Admin Frontend Deployment (Vercel)
1. In Vercel, create a **second new project** from the same GitHub repository.
2. Set **Root Directory** to `apps/admin-app`.
3. Add Environment Variable:
   - `VITE_API_BASE_URL` = `https://uiu-alumni-api.onrender.com`
4. Deploy. Vercel generates a distinct admin URL (e.g., `https://uiu-alumni-admin.vercel.app`).

### Step 5: Secure CORS Configuration
Return to Render -> Backend Web Service -> Environment Variables and update `ALLOWED_ORIGINS`:
```env
ALLOWED_ORIGINS=https://uiu-alumni.vercel.app,https://uiu-alumni-admin.vercel.app
```
Redeploy the backend service.

---

## 🧪 Automated Testing

Backend API integration tests are powered by **Jest** and **Supertest**:
```bash
npm test
```
Two kinds of tests:
- `tests/security.test.js` needs **no database** (models are stubbed) and covers secrets, CORS, access control, rate limiting and Socket.IO authorization.
- The remaining suites use an in-memory MongoDB (`mongodb-memory-server`, which downloads a MongoDB binary on first run). They **fail loudly** if no database is available, and refuse to run against any non-local database.

Test suite covers:
- Student registration & immediate login
- Pending alumni approval lifecycle
- Non-admin 403 authorization guards on `/api/admin/*`
- Invalid password 401 rejection
- Chat thread & REST message persistence

---

## 💳 Payment Gateway / Donation Notice

Payment processing on the **Alumni Donate** page operates in **Demo/Sandbox Mode**.
- Synthetic transaction IDs (`txId`) are generated upon donation submission.
- Real money is not moved, avoiding regulatory gateway registration overhead for this demonstration application.
