# ✅ Task Completion API Documentation

This module handles marking tasks as completed, undoing completion, and tracking completion history (especially for recurring tasks).

**Base URL:** `http://localhost:5000/api/tasks`

---

## 1. Complete Task
**Endpoint:** `POST /:id/complete`

Marks a specific task as completed for a given date.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Task UUID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Completion date (ISO format). Defaults to today. |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Task completed successfully"
}
```

---

## 2. Undo Task Completion
**Endpoint:** `DELETE /:id/completed`

Removes the completion status for a specific task on a given date.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Task UUID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Date of completion (YYYY-MM-DD). Defaults to today. |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Task completion undone successfully"
}
```

---

## 3. Get Completion History
**Endpoint:** `GET /:id/completed-history`

Retrieves the history of completion dates for a specific task.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Task UUID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Task completion retrieved successfully",
  "data": [
    {
      "completedDate": "2023-12-25T00:00:00.000Z",
      "completedAt": "2023-12-25T10:30:00.000Z"
    },
    {
      "completedDate": "2023-12-24T00:00:00.000Z",
      "completedAt": "2023-12-24T09:15:00.000Z"
    }
  ]
}
```

---

## 4. Bulk Complete Tasks
**Endpoint:** `POST /complete-bulk`

Marks multiple tasks as completed at once.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskIds` | string[] | **Yes** | Array of task UUIDs |
| `date` | string | No | Date of completion (YYYY-MM-DD). Defaults to today. |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Bulk tasks completed successfully",
  "data": {
    "requested": 3,
    "valid": 3,
    "completed": 2,
    "skipped": 1
  }
}
```
