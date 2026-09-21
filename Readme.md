# Classroom

A school management system with three roles — administrator, teacher and student
— each seeing and able to change only what their role permits.

<img width="1440" alt="home-page" src="https://github.com/Ratangulati/Classroom/assets/116749593/fbbda03a-6ff2-42eb-9dac-249acf6139ab">
<img width="1440" alt="admin-dashboard" src="https://github.com/Ratangulati/Classroom/assets/116749593/605d6506-4330-4219-8eb6-45e2b89416ac">
<img width="1440" alt="teacher-dashboard" src="https://github.com/Ratangulati/Classroom/assets/116749593/78c1bd1b-1f0d-4195-9f53-77f4db960bd2">
<img width="1440" alt="student-dashboard" src="https://github.com/Ratangulati/Classroom/assets/116749593/cfb26b8a-e4df-40cc-a854-9756498a5de8">

## Table of Contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [How access control works](#how-access-control-works)
- [Getting started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Local setup](#local-setup)
  - [With Docker Compose](#with-docker-compose)
- [Environment variables](#environment-variables)
- [Tests](#tests)
- [Deploying to Vercel](#deploying-to-vercel)
- [API reference](#api-reference)
- [Contributing](#contributing)

## Features

**Administrator**
- Register a school and receive a join code for staff and students
- Create classes; enrol students; assign teachers and subjects
- Add, edit and remove students and teachers
- Manage the library catalogue, school events and announcements
- Edit their own account and rename the school

**Teacher**
- See only the classes they are assigned to
- Take attendance per class per day, and review the history
- Set assignments with deadlines, then read and grade submissions
- Post notices to their own classes

**Student**
- See assignments for their class, submit work, and read their grades
- See their own attendance record and percentage
- Read class notices and school announcements
- Browse the school library alongside a Google Books search

## Tech stack

**Frontend** — React 18, Vite, React Router 6, Tailwind CSS, axios
**Backend** — Node.js, Express 4, MongoDB with Mongoose, JSON Web Tokens, bcrypt
**Tests** — Vitest, Supertest, mongodb-memory-server

## How access control works

Every school is a separate tenant. A `School` document is the root, every other
record carries a `school` reference, and **every query is filtered by it** — so
one school can never read or change another's data. A record belonging to
another school returns `404`, not `403`, so the response does not reveal that it
exists.

Passwords are hashed with bcrypt and never leave the database. Signing in
returns a JWT carrying only `{ id, role, school }`, which the frontend sends as
a bearer token.

Identity is never taken from the URL. An authenticated user acts on themselves
through `/me` endpoints, and the `:id` forms are admin-only. Where a teacher
acts on a class, the server confirms that the class belongs to their school
*and* lists them as a teacher before allowing it.

Because student registration numbers and teacher emails are unique **per
school** rather than globally, teachers and students supply their school's join
code when they sign in. Administrators sign in with their email alone.

## Getting started

### Prerequisites

- Node.js 18 or newer
- A MongoDB database — locally, or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster

### Local setup

1. Clone and enter the repository:

   ```bash
   git clone https://github.com/Ratangulati/Classroom
   cd Classroom
   ```

2. Start the backend:

   ```bash
   cd backend
   npm install
   cp .env.example .env     # then set MONGO_URL and JWT_SECRET
   npm run seed             # optional: sample data, prints the logins to use
   npm run dev
   ```

   The API listens on <http://localhost:3000>.

3. Start the frontend, in a second terminal:

   ```bash
   cd frontend
   npm install
   cp .env.example .env     # VITE_API_URL=http://localhost:3000
   npm run dev
   ```

   The app is at <http://localhost:5173>.

`npm run seed` creates one school, three teachers, twenty students, four
classes, and sample attendance, assignments, notices, events and books. It
prints the school code and the accounts to sign in with. It **erases the
configured database first**, so never point it at data you care about.

### With Docker Compose

```bash
cp backend/.env.example backend/.env    # set JWT_SECRET
docker-compose up
```

This starts MongoDB, the API on port 3000 and the frontend on port 5173.

## Environment variables

**`backend/.env`**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URL` | yes | MongoDB connection string. The server refuses to start without it. |
| `JWT_SECRET` | yes | Secret used to sign tokens. Use a long random string. |
| `PORT` | no | Defaults to `3000`. Ignored on Vercel. |
| `JWT_EXPIRES_IN` | no | Token lifetime, default `7d`. |
| `FRONTEND_URL` | no | Frontend origin, allowed through CORS. Default `http://localhost:5173`. |
| `ALLOWED_ORIGINS` | no | Extra comma-separated origins, e.g. a custom domain. |

Generate a secret with:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

**`frontend/.env`**

| Variable | Required | Description |
|---|---|---|
| `VITE_API_URL` | yes | Backend origin, no trailing slash and no `/api/v1` suffix. |

## Tests

```bash
cd backend
npm test
```

135 integration tests run against an in-memory MongoDB, covering
authentication, role enforcement, cross-tenant isolation, referential
integrity, and one happy path per role. No setup is needed — the test database
starts and stops itself.

## Deploying to Vercel

The frontend and backend deploy as **two separate Vercel projects from this one
repository**, each with its own root directory.

### 1. Create a database

Create a free MongoDB Atlas cluster and a database user. Under **Network
Access**, allow `0.0.0.0/0` — Vercel functions do not have fixed IPs. Copy the
connection string; it looks like:

```
mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/classroom?retryWrites=true&w=majority
```

### 2. Deploy the backend

- **New Project** → import this repository
- **Root Directory**: `backend`
- **Framework Preset**: Other
- Environment variables:

  | Name | Value |
  |---|---|
  | `MONGO_URL` | your Atlas connection string |
  | `JWT_SECRET` | a long random string |
  | `JWT_EXPIRES_IN` | `7d` |
  | `FRONTEND_URL` | the frontend URL from step 3 (add it after that deploy) |

Deploy, then check `https://your-backend.vercel.app/api/v1/health` returns
`{"status":"ok"}`.

### 3. Deploy the frontend

- **New Project** → import the same repository again
- **Root Directory**: `frontend`
- **Framework Preset**: Vite
- Environment variable:

  | Name | Value |
  |---|---|
  | `VITE_API_URL` | `https://your-backend.vercel.app` |

### 4. Close the loop

Set `FRONTEND_URL` on the **backend** project to the frontend's URL, then
redeploy the backend so CORS accepts it.

`VITE_API_URL` is read at build time, so changing it needs a redeploy of the
frontend, not just a restart.

### 5. Create your school

Visit the deployed frontend and register an administrator at `/admin/register`.
That creates the school and shows the join code teachers and students will need.

Do not run `npm run seed` against a production database — it erases it first.

### Notes on how it is configured

- `backend/vercel.json` rewrites every path to `api/index.js`, which exports a
  handler rather than calling `app.listen()`, and connects to MongoDB lazily
  with a cached connection so concurrent invocations reuse one pool.
- `frontend/vercel.json` rewrites all paths to `index.html` so React Router
  deep links survive a page refresh.
- CORS allows `FRONTEND_URL`, anything in `ALLOWED_ORIGINS`, localhost, and
  `*.vercel.app` preview hostnames.

## API reference

All routes are prefixed with `/api/v1`. Every route except the auth endpoints
requires an `Authorization: Bearer <token>` header.

### Auth

| Method | Path | Role | Purpose |
|---|---|---|---|
| POST | `/admin/register` | — | Create a school and its first admin |
| POST | `/admin/signin` | — | Admin sign in |
| POST | `/teachers/signup` | — | Join a school with its code |
| POST | `/teachers/signin` | — | Teacher sign in |
| POST | `/students/signup` | — | Join a school with its code |
| POST | `/students/signin` | — | Student sign in |
| GET | `/me` | any | Rehydrate a session from a token |
| GET, PUT | `/admin/me` | admin | Read or update the admin account |
| PUT | `/admin/school` | admin | Rename the school |

### Classes

| Method | Path | Role |
|---|---|---|
| GET | `/class/getall` | admin, teacher |
| POST | `/class` | admin |
| GET | `/class/:classId` | any with access |
| PUT, DELETE | `/class/:classId` | admin |
| POST, DELETE | `/class/:classId/students[/:studentId]` | admin |
| POST, DELETE | `/class/:classId/teachers[/:teacherId]` | admin |
| POST, DELETE | `/class/:classId/subjects[/:subjectId]` | admin |

### Students and teachers

| Method | Path | Role |
|---|---|---|
| GET | `/students/getall`, `/teachers/getall` | admin, teacher |
| POST | `/students`, `/teachers` | admin |
| GET, PUT, DELETE | `/students/:id`, `/teachers/:id` | admin |
| GET, PUT | `/students/me`, `/teachers/me` | self |
| GET | `/students/me/class`, `/students/me/assignments`, `/students/me/notices`, `/students/me/attendance` | student |
| GET | `/teachers/me/classes`, `/teachers/me/assignments` | teacher |

### Attendance, assignments and submissions

| Method | Path | Role |
|---|---|---|
| POST, GET | `/teachers/me/classes/:classId/attendance` | teacher (own class) |
| GET | `/teachers/me/classes/:classId/all-attendance` | teacher (own class) |
| POST | `/assignments` | teacher |
| DELETE | `/assignments/:id` | teacher (own), admin |
| POST | `/assignments/:id/submissions` | student (own class) |
| GET | `/assignments/:id/submissions` | teacher (own), admin |
| PATCH | `/submissions/:id/grade` | teacher (own), admin |

### Notices, announcements, events and library

| Method | Path | Role |
|---|---|---|
| GET | `/notices/getall` | admin, teacher |
| POST | `/notices/:classId` | teacher (own class), admin |
| DELETE | `/notices/:id` | author, admin |
| GET | `/announcement/getall`, `/events/getall`, `/library/getall` | any |
| POST, DELETE | `/announcement`, `/events` | admin |
| POST, PUT, DELETE | `/library` | admin |

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).
