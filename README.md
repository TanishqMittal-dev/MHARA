# MHARA Real Estate

Express and MongoDB application for the MHARA project catalogue, account access, enquiries, site visits, and customer feedback. Phase 1 (the existing MongoDB connection and working base application) is retained. No separate phase roadmap file was present in the supplied repository, so this guide documents the implemented application and its supported workflows.

## Requirements

- Node.js 18 or newer
- MongoDB Atlas access (the existing Atlas URI remains in your local `.env`)

## Setup and run

1. Install packages with `npm install`.
2. Ensure `.env` contains `MONGO_URI`, `PORT`, and `NODE_ENV`. Set `SESSION_SECRET` to a unique random value of at least 32 characters; the local `.env` already contains a generated key. Never commit `.env`.
3. Start the server with `npm start`, or use `npm run dev` for auto-reload.
4. Open `http://localhost:5000`. The default port can be changed with `PORT`.
5. Check server/database status at `http://localhost:5000/api/health`.

`npm run seed` inserts the six initial catalogue projects only when the projects collection is empty. It never clears or overwrites existing records, and it does not create demo users, enquiries, or visits.

## Administrator setup

The first account created through signup has the `user` role. Provision an administrator from a trusted terminal by setting `ADMIN_EMAIL` and `ADMIN_PASSWORD` (at least 12 characters) in the process environment and running `npm run admin:create`. For a new account also set `ADMIN_NAME` and `ADMIN_PHONE`. If that email already exists, the script promotes the account and rotates its password. The script does not print the password. The administrator signs in through the normal login page/API.

## API overview

- `GET /api/health`: application and MongoDB status.
- `GET /api/projects`, `GET /api/projects/:id`: public catalogue and detail reads; accepts `category` and `search` on list reads.
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`, `POST /api/auth/logout`: account access with signed, HttpOnly session cookies.
- `GET /api/auth/users`, `PATCH /api/auth/users/:id`, `DELETE /api/auth/users/:id`: administrator-only user management (role changes remain limited to the provisioning script).
- `POST /api/enquiries`, `POST /api/visits`, `POST /api/feedback`: validated public submissions stored in MongoDB.
- `GET /api/enquiries`, `GET /api/visits`, `GET /api/feedback`: administrator-only paginated reads.
- `PATCH /api/enquiries/:id/status`, `PATCH /api/visits/:id/status`, `PATCH /api/feedback/:id/status`: administrator-only status changes.
- `DELETE /api/enquiries/:id`, `DELETE /api/visits/:id`, `DELETE /api/feedback/:id`: administrator-only deletion.
- `POST /api/projects`, `PATCH /api/projects/:id`, `DELETE /api/projects/:id`: administrator-only catalogue management.

Page forms and catalogue/detail pages call these APIs directly. Project links carry MongoDB IDs; enquiry and visit records may retain a project reference while preserving the existing project-name fields for compatibility.

## Data and security notes

Existing MongoDB records are preserved. Passwords are bcrypt-hashed, login sessions are signed and stored in HttpOnly cookies, public users cannot assign themselves the administrator role, and enquiry/visit/feedback records are not publicly readable. Admin routes require a current administrator account. If an older deployment used the demo admin account from the previous seeder, rotate its password with the admin provisioning command before exposing the site publicly.

## Checks

Run `npm test` for the integration smoke suite. It uses the configured MongoDB connection, creates uniquely named temporary feedback/account records, and removes them after the checks complete. The test does not seed or delete existing application data.

Password recovery email delivery is not configured; the login page directs users to contact support rather than pretending to send a reset email. Configure an email provider before adding automated recovery.
