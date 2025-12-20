# 📡 REST API Reference

**Base URL:** `http://localhost:5000/api`  
**Content-Type:** `application/json`  

---

## 1. Authentication Module

### 1.1 Register User
Create a new user account.
- **Endpoint:** `POST /auth/signup`
- **Auth Required:** No

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `password` | string | Yes | Min 8 chars, 1 number |

#### Response (201 Created)
```json
{
  "_id": 101,
  "email": "dev@taskey.com",
  "token": "eyJhbGciOiJIUzI1NiIsIn..."
}
```

### 1.2 Login
Authenticate and receive a session token.
- **Endpoint:** `POST /auth/login`
- **Auth Required:** No

#### Response (200 OK)
Returns the same structure as Signup, including the JWT `token`.

### 1.3 Get Profile
Retrieve authenticated user's details.
- **Endpoint:** `GET /auth/me`
- **Auth Required:** Yes (Bearer Token)

---

## 2. Task Management (Draft)

### 2.1 Create Task
- **Endpoint:** `POST /tasks`
- **Auth Required:** Yes

#### Request Body
```json
{
  "title": "Finish Documentation",
  "description": "Write the API reference",
  "priority": "HIGH",     // Enum: LOW, MEDIUM, HIGH
  "dueDate": "2024-12-31T23:59:00Z"
}
```

### 2.2 Get Tasks
- **Endpoint:** `GET /tasks`
- **Query Parameters:**
    - `page` (int): Page number (default 1)
    - `limit` (int): Items per page (default 10)
    - `status` (string): Filter by `PENDING` / `COMPLETED`
    - `priority` (string): Filter by Enum

---

## 3. Error Handling Standard
All API errors follow this standardized format for easy frontend parsing.

#### Schema
```json
{
  "success": false,
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "The requested Task ID 404 does not exist.",
    "details": [] // Optional validation errors
  }
}
```

#### Common Status Codes
- `400 Bad Request`: Invalid input (e.g., missing email).
- `401 Unauthorized`: Missing or expired Token.
- `403 Forbidden`: Valid token, but insufficient permissions.
- `404 Not Found`: Resource does not exist.
- `429 Too Many Requests`: Rate limit exceeded.
- `500 Internal Server Error`: Unhandled backend exception.
