# 🔐 Authentication API Documentation

This module handles the complete user lifecycle including registration, login, password management, and session control. It uses **JWT (JSON Web Tokens)** for stateless authentication.

**Base URL:** `http://localhost:5000/api/auth`

---

## 1. Register User (Signup)
**Endpoint:** `POST /signup`

Registers a new user in the system. Upon success, an OTP (One-Time Password) may be sent to the user's email for verification (depending on configuration).

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | User's full name |
| `email` | string | **Yes** | Valid email address |
| `password` | string | **Yes** | Secure password |

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "email": "user@example.com"
  }
}
```

---

## 2. Verify OTP
**Endpoint:** `POST /verify-otp`

Verifies the email address using the code sent during registration.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | User's email |
| `otp` | string | **Yes** | The 6-digit code received |

### Success Response (200 OK)
Returns the JWT token for immediate login.
```json
{
  "success": true,
  "message": "Email verified successfully",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": { ... }
  }
}
```

---

## 3. Login
**Endpoint:** `POST /login`

Authenticates an existing user and issues a JWT token.

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | Registered email |
| `password` | string | **Yes** | Account password |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1...",
    "user": {
      "id": 1,
      "name": "Jane Doe",
      "email": "jane@example.com"
    }
  }
}
```

---

## 4. Password Management

### 4.1 Forgot Password
**Endpoint:** `POST /forgot-password`

Initiates the password reset flow. Checks if the user exists and sends an OTP to their email.

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | Registered email |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully"
  }
}
```

### 4.2 Reset Password
**Endpoint:** `POST /reset-password`

Sets a new password using the verified OTP.

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | User's email |
| `otp` | string | **Yes** | 6-digit verification code |
| `password` | string | **Yes** | New secure password |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Password reset successfully"
  }
}
```

### 4.3 Resend OTP
**Endpoint:** `POST /otp-request`

Re-sends the verification code if the previous one expired.

#### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | **Yes** | User's email |

#### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "OTP resent successfully"
  }
}
```

---

## 5. Logout
**Endpoint:** `POST /logout`

Invalidates the user session. The client should also delete the stored JWT.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

## 6. Delete Account
**Endpoint:** `DELETE /me`

Permanently deletes the authenticated user's account and all associated data. This action is irreversible.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "message": "Account deleted successfully"
  }
}
```

---

## 7. Get User Profile
**Endpoint:** `GET /me`

Retrieves the profile information of the currently authenticated user.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "isEmailVerified": true,
    "createdAt": "2023-10-27T10:00:00.000Z",
    "updatedAt": "2023-10-27T10:00:00.000Z"
  }
}
```

