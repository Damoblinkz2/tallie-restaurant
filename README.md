# Tallie - Restaurant Reservation API

Tallie is a Node.js + TypeScript REST API for restaurant operations with:

- Role-based authentication (`restaurant_owner`, `customer`)
- Multi-branch restaurant support
- Branch-level menu management
- Reservations, availability checks, and waitlist flows

## Tech Stack

- Node.js, TypeScript, Express
- MongoDB + Mongoose
- Joi validation
- JWT authentication (`jsonwebtoken`) + password hashing (`bcryptjs`)
- Jest + Supertest

## Core Features

- **Authentication**
  - Register/login users
  - Role-based route protection
- **Restaurant Ownership**
  - Restaurant is owned by a `restaurant_owner` user
- **Multi-Branch Support**
  - One restaurant can have many branches
  - Branches carry opening/closing hours and table capacity
- **Standalone Menu Module**
  - Managed per branch via dedicated endpoints
- **Table Management**
  - Tables are branch-scoped
- **Reservations**
  - Branch-based booking, modify/cancel/confirm/complete
  - Optional pre-order items
  - Mock kitchen “start cooking” notification 30 minutes before arrival
- **Waitlist**
  - Join waitlist, convert to reservation, remove entries

## Setup

1. Clone and install:

```bash
git clone <repository-url>
cd tallie
npm install
```

2. Create `.env`:

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tallie
NODE_ENV=development

# Auth
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRES_IN=7d
```

3. Run locally:

```bash
npm run dev
```

API base URL: `http://localhost:3000`

Health check: `GET /`

## Scripts

```bash
npm run dev
npm run clean
npm run build
npm start

npm test
npm run test:watch
npm run test:coverage
npm run test:verbose
npm run test:silent
```

## Authentication and Roles

Use `Authorization: Bearer <token>` for protected routes.

- `restaurant_owner` can create restaurants, branches, tables, and menus.
- `customer` can create reservations and waitlist entries.

## API Endpoints

### Auth (`/api/auth`)

- `POST /register`
- `POST /login`
- `GET /me` (protected)

### Restaurants (`/api/restaurants`)

- `POST /` (protected: `restaurant_owner`)
- `GET /`
- `GET /:id`

### Branches (`/api/branches`)

- `POST /` (protected: `restaurant_owner`)
- `GET /:id`
- `GET /restaurant/:restaurantId`

### Menu (`/api/menu`)

- `PATCH /branch/:branchId` (protected: `restaurant_owner`)
- `GET /branch/:branchId`

### Tables (`/api/tables`)

- `POST /` (protected: `restaurant_owner`)
- `GET /branch/:branchId`

### Reservations (`/api/reservations`)

- `POST /` (protected: `customer`)
- `PUT /:id`
- `DELETE /:id`
- `PATCH /:id/confirm`
- `PATCH /:id/complete`
- `GET /check-availability`
- `GET /by-date`
- `GET /available-slots`

### Waitlist (`/api/waitlist`)

- `POST /` (protected: `customer`)
- `GET /`
- `POST /:id/convert`
- `DELETE /:id`

## Request Notes

- Reservation and waitlist flows are **branch-based**.
- Menu is **branch-based**.
- Validation is applied at route middleware and controller level using Joi.

## Project Structure

```text
tallie/
├── config/
├── controllers/
├── data/
├── middleware/
├── models/
├── routes/
├── services/
├── tests/
├── types/
├── utils/
├── app.ts
├── index.ts
├── package.json
└── tsconfig.json
```
