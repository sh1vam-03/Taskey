# 🏗️ System Architecture & Design Document

**Version:** 1.0  
**Last Updated:** December 2025  
**Status:** Approved  

---

## 1. Executive Summary
**Taskey** is a comprehensive productivity platform engineered to help users organize tasks, track daily schedules, and analyze behavioral patterns. The system is built as a **monolithic architecture** with clear separation of concerns between the Client (Frontend) and Server (Backend), communicating via RESTful APIs.

---

## 2. High-Level Architecture

### 2.1 System Context
The system interacts with the following external actors and systems:
- **End User:** Interacts via Web Browser (Desktop/Mobile).
- **Email Service (SMTP):** Sends transactional emails (Welcome, Reset Password).
- **Database:** Persists all stateful data.

```mermaid
graph TD
    subgraph Client_Side
        Browser[Web Browser]
    end
    
    subgraph Server_Side
        LB[Load Balancer / Nginx (Prod)] --> API[Express.js Server]
        API --> Auth[Auth Module]
        API --> Core[Task Core]
        API --> Analytics[Analytics Engine]
    end
    
    subgraph Infrastructure
        DB[(PostgreSQL Database)]
    end
    
    Browser -->|HTTPS / JSON| LB
    API -->|Prisma ORM| DB
```

### 2.2 Component Design
The backend is structured using a **Layered Architecture**:

1.  **Presentation Layer (Routes):** Defines HTTP endpoints and handles request parsing.
2.  **Application Layer (Controllers):** Orchestrates business logic and data flow.
3.  **Domain Layer (Services/Models):** Encapsulates core business rules (e.g., "Cannot complete task in future").
4.  **Infrastructure Layer (Prisma/DB):** Handles data persistence.

---

## 3. Technology Specification

### 3.1 Frontend Service
-   **Framework:** Next.js 14+ (React)
    -   *Why?* SSR for SEO, efficient routing, and rich ecosystem.
-   **Styling:** Tailwind CSS
    -   *Why?* Rapid UI development and consistent design system.
-   **State Management:** React Context API + Hooks
    -   *Strategy:* `AuthContext` for global session, `SWR`/`React Query` (Planned) for server state.

### 3.2 Backend Service
-   **Runtime:** Node.js (LTS Version)
-   **Framework:** Express.js 5.0
    -   *Why?* Minimalist, high-performance, and massive community support.
-   **ORM:** Prisma Client
    -   *Why?* Type-safe database queries, auto-generated migrations.
-   **Security:**
    -   `helmet` for headers.
    -   `bcryptjs` for hashing (Work Factor: 10).
    -   `jsonwebtoken` (RS256/HS256) for statutory authentication.

### 3.3 Database
-   **System:** PostgreSQL 16+
-   **Schema Design:** 3NF (Third Normal Form) ensuring data integrity.
-   **Indexing:** B-Tree indexes on `email`, `userId`, and `taskId`.

---

## 4. Scalability & Performance Strategy
-   **Horizontal Scaling:** The backend is stateless; multiple instances can run behind a load balancer.
-   **Database:** Connection pooling (via `pg-pool`) prevents connection exhaustion.
-   **Caching (Future):** Redis implementation planned for:
    -   User Sessions (if switching from JWT).
    -   Aggregated Analytics (e.g., "Weekly Productivity").

---

## 5. Security & Compliance
-   **Authentication:** Bearer Token (JWT) Scheme.
-   **Authorization:** Role-Based Access Control (RBAC) at the Middleware level.
-   **Data Protection:**
    -   Passwords hashed (bcrypt).
    -   HTTPS enforced in production.
    -   Inputs validated (Joi/Zod) to prevent SQL Injection/XSS.
