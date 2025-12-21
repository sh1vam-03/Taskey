# 🌐 Public & System API Documentation

This module details the public-facing endpoints of the Taskey application. These routes are accessible without authentication tokens and are primarily used for system monitoring and public inquiries.

**Base URL:** `http://localhost:5000/api`

---

## 1. System Health Check
**Endpoint:** `GET /health`

Used by load balancers, uptime monitors (like UptimeRobot), and container orchestrators (Kubernetes/Docker) to verify the application's operational status.

### Usage
```bash
curl -X GET http://localhost:5000/api/health
```

### Response
**Status:** `200 OK`
```json
{
  "message": "Api is working..."
}
```

---

## 2. Contact Support
**Endpoint:** `POST /public-pages/contact-us`

Allows visitors (unauthenticated users) to submit support inquiries or messages directly from the landing page.

### Request Headers
| Header | Value | Description |
|--------|-------|-------------|
| `Content-Type` | `application/json` | Required |

### Request Body Schema
| Field | Type | Required | Description | Constraints |
|-------|------|----------|-------------|-------------|
| `name` | string | **Yes** | Sender's full name | Min 2 chars |
| `email` | string | **Yes** | Sender's contact email | Valid email format |
| `subject` | string | **Yes** | Purpose of the message | Max 100 chars |
| `message` | string | **Yes** | Detailed inquiry | Max 1000 chars |

### Example Request
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@example.com",
  "subject": "Enterprise Pricing Inquiry",
  "message": "Hello, I would like to know more about the team subscription plans."
}
```

### Success Response
**Status:** `201 Created`
```json
{
  "success": true,
  "message": "Your contact us message has been sent successfully",
  "data": {
    "name": "Jane Doe",
    "subject": "Enterprise Pricing Inquiry"
  }
}
```

### Error Responses
**Status:** `400 Bad Request`
- Missing required fields.
```json
{
  "success": false,
  "message": "All fields are required"
}
```
