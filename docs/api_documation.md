# 📚 API Documentation Hub

**Base Server URL:** `http://localhost:5000/api`  
**Content-Type:** `application/json`

Welcome to the Taskey REST API documentation. This hub serves as the central index for all API specifications available in the system.

The API is designed around **RESTful** principles and uses standard **HTTP status codes**.

---

## 📑 Table of Contents

| Module | Description | Documentation Link |
|--------|-------------|-------------------|
| **🌐 Public API** | System Health Checks and Contact Forms. Accessible without auth. | [View Public API](./api/public_api.md) |
| **🔐 Authentication** | Signup, Login, Password Reset, and User Profile. | [View Auth API](./api/auth_api.md) |
| **📝 Task Management** | CRUD operations for Tasks. | [View Task API](./api/task_api.md) |

---

## ⚠️ Common Standards

### Response Format
All API responses generally follow this wrapper structure:
```json
{
  "success": boolean,
  "message": string,
  "data": object | array
}
```

### Error Handling
Errors are returned with appropriate HTTP codes (4xx, 5xx) and a helpful message.
- `400`: Bad Request (Validation failed)
- `401`: Unauthorized (Invalid/Missing Token)
- `404`: Not Found
- `500`: Internal Server Error

---

> **Developer Note:**
> Ensure you have your `.env` file configured correctly before making requests.
