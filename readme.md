# 🦷 Rik Dental Care Backend

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript&logoColor=white&style=for-the-badge)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white&style=for-the-badge)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-5.0-000000?logo=express&logoColor=white&style=for-the-badge)](https://expressjs.com/)
[![Prisma ORM](https://img.shields.io/badge/Prisma_ORM-7.8-2D3748?logo=prisma&logoColor=white&style=for-the-badge)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white&style=for-the-badge)](https://www.postgresql.org/)
[![Better Auth](https://img.shields.io/badge/Better_Auth-1.6-F43F5E?logo=keycdn&logoColor=white&style=for-the-badge)](https://better-auth.com/)

A production-grade, highly secure, and enterprise-ready SaaS API engine for dental clinic management and patient care. Built with **Express v5 (TypeScript)**, **Better Auth** (Session-based RBAC with Secure HTTP-Only Cookies), and **Prisma ORM** over **PostgreSQL**.

---

## 🔗 Quick Links

- **Live Demo (Staging):**

---

<!-- ## 📸 Project Preview

<div align="center">
  <img src="./public/preview.png" alt="Rik Dental Care System Overview" width="90%" style="border-radius: 8px; border: 1px solid #ddd; margin-bottom: 20px;" />
</div>

<div align="center" style="display: flex; justify-content: center; gap: 20px;">
  <img src="./public/dashboard-preview.png" alt="SaaS Clinic Dashboard View" width="44%" style="border-radius: 8px; border: 1px solid #ddd;" />
  <img src="./public/appointment-preview.png" alt="Clinical Appointment Calendar View" width="44%" style="border-radius: 8px; border: 1px solid #ddd;" />
</div>

--- -->

## 📖 Project Overview

**Rik Dental Care Backend** is a multi-tenant clinic management system designed to streamline dental workflows, enhance clinical precision, and bridge communication gaps between patients and healthcare providers.

### 🔴 The Problem It Solves

Conventional clinical administration suffers from fragmented record systems, insecure transmission of sensitive medical files (X-Rays, prescriptions), administrative overhead in booking regular/emergency slots, and delayed billing calculations.

### 🟢 The Engineering Value

Rik Dental Care delivers:

- **Secure Session-Based RBAC:** Replacing basic token auth with **Better Auth**, enforcing secure HTTP-only cookies, OAuth SSO, and strict role compliance (Patient, Manager, Admin).
- **Transactional File Safety:** A unified custom middleware combining `Multer` and `Cloudinary` with auto-rollback. If any database transaction fails during an API request, uploaded media files are immediately destroyed in the cloud, preventing orphaned storage bloat.
- **Dynamic Query Engine:** A custom-built, chainable `QueryBuilder` helper wrapping Prisma client. It evaluates HTTP query parameters to build complex search, filter, sorting, pagination, and relation projection filters in a type-safe manner.
- **Polished Document Rendering:** Core pipelines that compile medical histories and invoice tables into dynamic EJS templates and stream them to patients as professional PDFs via PDFKit.

---

## 🛠️ Tech Stack & Architecture Choices

| Layer / Role       | Technology                  | Rationale & Role in System                                                                                                             |
| :----------------- | :-------------------------- | :------------------------------------------------------------------------------------------------------------------------------------- |
| **Runtime & Core** | Node.js (v18+) & TS-Node    | Establishes a fast, type-safe executing context with modern ES Module support.                                                         |
| **Web Framework**  | Express v5.2 (Beta/Release) | Leverages modern middleware routing, native Promise rejection handling, and Express's fast request pipeline.                           |
| **Database ORM**   | Prisma ORM (v7.8)           | Employs the new Prisma Multi-file schemas feature (`prisma/schema/*.prisma`) for cleaner data boundaries and compile-time type-safety. |
| **Database**       | PostgreSQL                  | Enterprise relational storage optimized for complex relation joins (Invoices ↔ Appointments ↔ Patients ↔ Doctors).                     |
| **Authentication** | Better Auth (v1.6)          | Out-of-the-box support for Session Management, Google OAuth, email verification OTPs, and strict cookie isolation.                     |
| **File Storage**   | Cloudinary & Multer         | Secure, globally CDN-cached storage for medical prescriptions, dental profiles, and X-ray attachments.                                 |
| **Validation**     | Zod (v4.3)                  | Input sanitization schemas guarding Express controllers from payload injection and ensuring strict runtime validation.                 |
| **Mail Dispatch**  | Nodemailer & EJS            | Transactional email workflows sending custom-styled HTML templates for password resets, clinic notifications, and verification.        |
| **Doc Generation** | PDFKit & EJS                | Compiles dynamic server-side data templates into downloadable binary PDFs.                                                             |
| **Compilation**    | Tsup                        | Fast, zero-config bundler powered by esbuild to compile production-ready ES modules.                                                   |

---

## 🏗️ System Architecture & Data Flow

```mermaid
graph TD
    Client[Client App: Web/Mobile] <--> |HTTPS / Cookies| ExpressApp[Express App Engine]
    ExpressApp --> |Better Auth Middleware| AuthSvc[Session & RBAC Authenticator]
    ExpressApp --> |Zod Validator| RequestVal[Request Validator]
    RequestVal --> |Routing / Controllers| AppRoute[Router / Module Controller]
    AppRoute --> |Cloudinary API| CloudMedia[(Cloudinary Media CDN)]
    AppRoute --> |Services / QueryBuilder| DBService[Core Module Service]
    DBService --> |Transaction Block / ORM| PrismaClient[Prisma Client]
    PrismaClient <--> |SQL Queries| Postgres[(PostgreSQL Database)]
    DBService --> |Nodemailer| MailSvc[SMTP Email Dispatcher]
    DBService --> |PDFKit & EJS| PDFGen[PDF Stream Generator]
```

### 🔐 Session Authentication & Cookie Flow

1. **User Sign-In:** The client sends credentials or authenticates via Google OAuth.
2. **Session Creation:** Better Auth validates credentials and generates a secure session token stored inside the PostgreSQL DB.
3. **HTTP-Only Cookie Injection:** The token is returned inside an HTTP-only secure cookie named `rik_dental_care_session`. It is flags-isolated (`secure`, `httpOnly`, `sameSite: Lax`) to mitigate XSS and CSRF vectors.
4. **Subsequent Calls:** For every backend call, Express extracts the session, validates user metadata, and populates `req.user` with role attributes.

### 🔄 Request Lifecycle Walkthrough

1. **CORS & Parser Filters:** Request hits `app.ts` where CORS maps allowed origins and parsers extract json payloads.
2. **Auth Authentication Gate:** `requireAuth` parses cookies and assigns role-based scopes.
3. **Zod Validation Check:** Validates input parameters (`req.params`, `req.query`, `req.body`) against a schema. On failure, validation errors throw early.
4. **Media Upload Hook:** If file fields exist, `multer-storage-cloudinary` uploads files to a specific target folder.
5. **Business Logic & Rollback:** The controller executes service logic. If any DB error occurs, the global error middleware automatically rolls back uploaded assets from Cloudinary.
6. **Data Output Builder:** A standard wrapper standardizes successful responses (`statusCode`, `success: true`, `message`, `data`, `meta`).

---

## 🔌 API Endpoints Reference

### 🔐 Authentication APIs (Prefix: `/api/auth` & `/api/v1/auth`)

| Method   | Route                       | Access        | Purpose                                           | Payload Schema (Zod)          |
| :------- | :-------------------------- | :------------ | :------------------------------------------------ | :---------------------------- |
| **POST** | `/api/auth/register`        | Public        | Registers a user account                          | `email`, `password`, `name`   |
| **POST** | `/api/auth/login`           | Public        | Authenticates credentials, injects Session cookie | `email`, `password`           |
| **POST** | `/api/auth/logout`          | Public        | Invalidates current session, clears cookie        | —                             |
| **GET**  | `/api/v1/users/me`          | Authenticated | Retrieves current logged-in user details          | —                             |
| **POST** | `/api/auth/forgot-password` | Public        | Requests verification OTP to reset password       | `email`                       |
| **POST** | `/api/auth/reset-password`  | Public        | Resets password with a valid OTP                  | `email`, `otp`, `newPassword` |

### 📅 Appointment Management APIs (Prefix: `/api/v1/appointments`)

| Method     | Route        | Access        | Purpose                                                  | Payload Schema (Zod)                         |
| :--------- | :----------- | :------------ | :------------------------------------------------------- | :------------------------------------------- |
| **GET**    | `/`          | Auth User     | List appointments (Patients view theirs; Admins see all) | Query parameters (paginated)                 |
| **POST**   | `/`          | Patient       | Book a regular checkup slot                              | `scheduledAt`, `dentalServiceId`, `doctorId` |
| **POST**   | `/emergency` | Patient       | Request an urgent queue reservation                      | `scheduledAt`, `severity`, `description`     |
| **GET**    | `/:id`       | Auth User     | Fetch detailed appointment card                          | —                                            |
| **PATCH**  | `/:id`       | Admin/Manager | Update status (CONFIRMED, COMPLETED, CANCELLED)          | `status`, `scheduledAt`, `notes`             |
| **DELETE** | `/:id`       | Admin         | Soft-deletes clinical appointment record                 | —                                            |

### 💳 Invoices & Billing APIs (Prefix: `/api/v1/invoices`)

| Method   | Route           | Access    | Purpose                                     | Payload Schema (Zod)                         |
| :------- | :-------------- | :-------- | :------------------------------------------ | :------------------------------------------- |
| **GET**  | `/`             | Auth User | List invoices                               | Query parameters (filterable)                |
| **POST** | `/`             | Admin     | Create invoice with file receipt attachment | `appointmentId`, `items` (Array), `discount` |
| **GET**  | `/preview/:id`  | Auth User | Render invoice HTML template                | —                                            |
| **GET**  | `/download/:id` | Auth User | Generate and download invoice PDF           | —                                            |
| **PUT**  | `/:id`          | Admin     | Update invoice billing details              | `items`, `taxAmount`, `discountAmount`       |

---

## ✨ Features Highlight

### 💼 Clinical & SaaS Core Features

- **Multi-Tier Role Management (RBAC):** Separate patient, manager, and administrator interfaces. Managers oversee schedules; admins handle billing; patients request appointments.
- **Emergency Scheduling:** Quick emergency intake endpoints handling automated sorting and high-priority queues.
- **Dynamic Document Generation:** Compile invoice metadata directly into formatted clinical receipt PDFs containing payment breakdowns.

### 🛡️ Security & Reliability Features

- **Secure Session Pipeline:** Uses Better Auth plugins with Database Session persistence rather than stateless JWTs. Enables remote sign-out.
- **Prisma Folder Schema Separation:** Relational models are logically isolated under `prisma/schema/*.prisma` (e.g., `clinical.prisma`, `billing.prisma`, `auth.prisma`) for modular clean database design.
- **Zero-Orphan Cloud Storage:** Handled by our global middleware, ensuring failed DB creations clear uploaded assets from cloud systems immediately.

### 💻 Developer Experience (DX)

- **Dynamic Query Helper:** Supports chainable filters directly from HTTP requests:
  ```typescript
  const result = await new QueryBuilder(prisma.appointment, req.query, config)
    .where({ isDeleted: false })
    .search()
    .filter()
    .sort()
    .paginate()
    .execute();
  ```
- **Preconfigured Studio & Database Scripts:** Fast data modeling visualizer via `prisma studio`.

---

## ⚙️ Environment Variables Config

Add these variables to a local `.env` file before executing:

| Variable Name            | Purpose                                  | Example Value                                 | Required |
| :----------------------- | :--------------------------------------- | :-------------------------------------------- | :------- |
| `NODE_ENV`               | Application running environment          | `development` / `production`                  | **Yes**  |
| `PORT`                   | Local server port                        | `5000`                                        | **Yes**  |
| `DATABASE_URL`           | PostgreSQL Connection string             | `postgresql://user:pass@localhost:5432/rikdb` | **Yes**  |
| `BETTER_AUTH_SECRET`     | Cryptographic hash key for auth sessions | `f8h23n98ry98h3r92h83ry...`                   | **Yes**  |
| `BETTER_AUTH_URL`        | Endpoint base mapping of Better Auth     | `http://localhost:5000`                       | **Yes**  |
| `FRONTEND_URL`           | Base URL of React/Next.js Client         | `http://localhost:3000`                       | **Yes**  |
| `EMAIL_SENDER_SMTP_HOST` | Host address of SMTP server              | `smtp.gmail.com` / `smtp.mailtrap.io`         | **Yes**  |
| `EMAIL_SENDER_SMTP_PORT` | Port of SMTP Server                      | `587`                                         | **Yes**  |
| `EMAIL_SENDER_SMTP_USER` | Authenticating SMTP User                 | `clinic-alerts@rikdental.com`                 | **Yes**  |
| `EMAIL_SENDER_SMTP_PASS` | SMTP Password / App Specific Password    | `xxxx xxxx xxxx xxxx`                         | **Yes**  |
| `EMAIL_SENDER_SMTP_FROM` | Dispatcher name in sent headers          | `"Rik Dental Care" <alerts@rikdental.com>`    | **Yes**  |
| `CLOUDINARY_CLOUD_NAME`  | Cloudinary tenant account name           | `rik-dental-cloudinary`                       | **Yes**  |
| `CLOUDINARY_API_KEY`     | Cloudinary programmatic key              | `928374982739487`                             | **Yes**  |
| `CLOUDINARY_API_SECRET`  | Cloudinary credential secret             | `aB1cCdD2eEfFgG3...`                          | **Yes**  |

---

## 🚀 Installation & Local Setup

### 📋 Prerequisites

- Node.js (v18.x or above)
- pnpm (v10.x recommended) or npm
- PostgreSQL Instance (Local or Cloud-based Neon/Aiven)

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Rik-Dental-Care-Backend/Rik-Dental-Care-Backend.git
cd Rik-Dental-Care-Backend
```

### 2️⃣ Install Dependencies

```bash
pnpm install
```

### 3️⃣ Setup Environment Variables

Duplicate the template and fill in your local PostgreSQL, Better Auth, and SMTP credentials:

```bash
cp .env.example .env
```

### 4️⃣ Synchronize Database Schema

Generate the Prisma Client types and run structural migrations to align your PostgreSQL DB:

```bash
# Apply Prisma schema migrations
pnpm run migrate

# (Alternative) Push schema mapping directly without tracking migrations (Local only)
pnpm run push

# Generate type-safe Prisma client
pnpm run generate
```

### 5️⃣ Launch Development Server

```bash
pnpm run dev
```

The server will boot and run on `http://localhost:5000`. You can test endpoint connections using `curl http://localhost:5000/`.

### 6️⃣ Run Production Builds

Compile TypeScript code to JavaScript ES Modules:

```bash
# Build the code bundle using tsup
pnpm run build

# Start the compiled bundle
pnpm run start
```

---

## 📂 Codebase Directory Structure

```bash
rik-dental-care-backend/
 ┣ prisma/
 ┃ ┣ migrations/          # Automatically tracked database structural changes
 ┃ ┗ schema/              # Multi-file relational Prisma Schemas
 ┃ ┃ ┣ appointment.prisma # Appointment core structure & relations
 ┃ ┃ ┣ attachment.prisma  # Uploaded file attachments schema
 ┃ ┃ ┣ auth.prisma        # Better Auth tables (User, Session, Account, Verification)
 ┃ ┃ ┣ billing.prisma     # Invoice, InvoiceItem, and Payment models
 ┃ ┃ ┣ clinical.prisma    # MedicalHistory, ClinicalNote, and Prescriptions
 ┃ ┃ ┣ enum.prisma        # Shared database enums
 ┃ ┃ ┗ schema.prisma      # Base datasource and client configuration
 ┣ src/
 ┃ ┣ app/
 ┃ ┃ ┣ config/            # Env parsers and global configuration
 ┃ ┃ ┣ lib/               # Instance wrappers (Auth, Cloudinary, Prisma client)
 ┃ ┃ ┣ middleware/        # Express error handlers, file attachment guards, RBAC gates
 ┃ ┃ ┣ module/            # Domain-Driven Core Modules
 ┃ ┃ ┃ ┣ appointment/     # Controllers, routes, interfaces, and utilities for scheduling
 ┃ ┃ ┃ ┣ auth/            # Better Auth hooks, password resets, verification logic
 ┃ ┃ ┃ ┣ invoice/         # Invoicing, itemized lists, EJS renderers, PDF downloads
 ┃ ┃ ┃ ┗ ...              # Other modules (profile, chat, admin, notification)
 ┃ ┃ ┣ router/            # Express router mapping API endpoints
 ┃ ┃ ┣ shared/            # Common error classes, unified response frameworks, types
 ┃ ┃ ┣ templates/         # EJS templates for PDFs and Email layouts
 ┃ ┃ ┗ utils/             # Helper utilities (file upload, pdf generators, date formatters)
 ┃ ┣ app.ts               # Express application initialization and middleware piping
 ┃ ┗ server.ts            # Entrypoint file starting the HTTP server listener
 ┣ package.json           # Scripts, dependencies, and manifest metadata
 ┣ tsconfig.json          # TypeScript compiler instructions
 ┗ tsup.config.ts         # Output compilation mapping config
```

---

## 📄 License

This project is licensed under the **ISC License**. Refer to the [LICENSE](LICENSE) file for usage terms.
