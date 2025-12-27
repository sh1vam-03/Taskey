# ✅ Schedule Completion API Documentation

This module handles marking scheduled tasks as completed, undoing completion, and tracking completion history. It ensures data consistency by removing missed schedule records upon completion.

**Base URL:** `http://localhost:5000/api/schedule-completion`

---

## 1. Complete Schedule
**Endpoint:** `POST /:id/complete`

Marks a specific schedule as completed.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Schedule ID to mark as completed |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Schedule marked as completed",
  "data": {
    "id": 1,
    "scheduleId": 10,
    "userId": "user-uuid",
    "completedAt": "2023-12-25T10:00:00.000Z"
  }
}
```

---

## 2. Undo Completion
**Endpoint:** `DELETE /:id/complete`

Reverts the completion status of a schedule.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Schedule ID to undo completion for |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Schedule completion undone"
}
```

---

## 3. Bulk Complete
**Endpoint:** `POST /complete-bulk`

Marks multiple schedules as completed in a single request. Skips already completed schedules.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `scheduleIds` | number[] | **Yes** | Array of Schedule IDs |

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Schedules completed successfully",
  "data": {
    "requested": 3,
    "completed": 2,
    "skipped": 1
  }
}
```

---

## 4. Get Completion History
**Endpoint:** `GET /history`

Retrieves the user's history of completed and missed schedules.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "completed": [
      {
        "scheduleId": 10,
        "taskTitle": "Morning Workout",
        "completedAt": "2023-12-25T07:30:00.000Z",
        "status": "COMPLETED"
      }
    ],
    "missed": [
      {
        "scheduleId": 5,
        "taskTitle": "Weekly Review",
        "missedAt": "2023-12-24T23:59:59.000Z",
        "status": "MISSED"
      }
    ]
  }
}
```
