# 🕒 Schedule API Documentation

This module handles scheduling tasks for specific dates and times, including support for recurring schedules (Daily, Weekly, Monthly). It ensures no time conflicts exist for the same user.

**Base URL:** `http://localhost:5000/api/schedules`

---

## 1. Create Schedule
**Endpoint:** `POST /`

Creates a new schedule for a task. Validates availability and recurrence rules.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `taskId` | string | **Yes** | Task UUID to schedule |
| `scheduleDate` | string | **Yes** | Date (YYYY-MM-DD) |
| `startTime` | string | **Yes** | Start time (HH:mm) |
| `endTime` | string | **Yes** | End time (HH:mm) |
| `recurrence` | string | No | `NONE`, `DAILY`, `WEEKLY`, `MONTHLY` (Default: `NONE`) |
| `repeatUntil` | string | Conditional | End date for recurrence (YYYY-MM-DD). Required if recurrence is not `NONE`. |
| `repeatOnDays` | number[] | Conditional | Array of days (1=Mon, 7=Sun). Required for `WEEKLY`. |

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Schedule created successfully",
  "data": {
    "id": 1,
    "scheduleDate": "2023-12-25T00:00:00.000Z",
    "startTime": "1970-01-01T09:00:00.000Z",
    "endTime": "1970-01-01T10:00:00.000Z",
    "recurrence": "WEEKLY",
    "taskId": "uuid-1",
    "userId": "user-uuid"
  }
}
```

---

## 2. Get All Schedules
**Endpoint:** `GET /`

Retrieves schedules within a date range or for a specific task.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Query Parameters
| Field | Type | Description |
|-------|------|-------------|
| `from` | string | Start date (YYYY-MM-DD) filter |
| `to` | string | End date (YYYY-MM-DD) filter |
| `taskId` | string | Filter schedules by Task UUID |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Schedules retrieved successfully",
  "data": [
    {
      "id": 1,
      "scheduleDate": "2023-12-25T00:00:00.000Z",
      "startTime": "1970-01-01T09:00:00.000Z",
      "endTime": "1970-01-01T10:00:00.000Z",
      "task": {
        "id": "uuid-1",
        "title": "Available Task",
        "priority": "HIGH"
      }
    }
  ]
}
```

---

## 3. Update Schedule
**Endpoint:** `PUT /:id`

Updates an existing schedule. Re-validates time conflicts and recurrence rules.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Schedule ID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body (Partial Update)
| Field | Type | Description |
|-------|------|-------------|
| `scheduleDate` | string | New date (YYYY-MM-DD) |
| `startTime` | string | New start time (HH:mm) |
| `endTime` | string | New end time (HH:mm) |
| `recurrence` | string | New recurrence type |
| `notes` | string | Additional notes for this schedule |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Schedule updated successfully",
  "data": {
    "id": 1,
    "scheduleDate": "2023-12-26T00:00:00.000Z",
    // ...updated fields
  }
}
```

---

## 4. Delete Schedule
**Endpoint:** `DELETE /:id`

Permanently deletes a schedule.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Schedule ID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Schedule deleted successfully"
}
```
