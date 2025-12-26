# 📅 Calendar API Documentation

This module provides endpoints to retrieve task schedules and completion status in various calendar views (Day, Week, Month). It aggregates data from the Schedule and TaskCompletion models.

**Base URL:** `http://localhost:5000/api/calendar`

---

## 1. Get Day View
**Endpoint:** `GET /day`

Retrieves the schedule and task status for a specific day.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | ISO Date string (e.g. `2023-12-25`). Defaults to today. |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Calendar day data fetched successfully",
  "data": {
    "date": "2023-12-25",
    "schedules": [
      {
        "scheduleId": 1,
        "taskId": "uuid-1",
        "title": "Morning Standup",
        "priority": "HIGH",
        "startTime": "09:00",
        "endTime": "09:30",
        "status": "COMPLETED",
        "notes": "Discuss blockers"
      },
      {
        "scheduleId": 2,
        "taskId": "uuid-2",
        "title": "Client Meeting",
        "priority": "MEDIUM",
        "startTime": "14:00",
        "endTime": "15:00",
        "status": "PENDING",
        "notes": null
      }
    ]
  }
}
```
*Status values*: `PENDING` (Scheduled), `COMPLETED` (Done), `MISSED` (Past due date)

---

## 2. Get Week View
**Endpoint:** `GET /week`

Retrieves the schedule for a full week surrounding the given date.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Reference date to determine the week. Defaults to today. |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Calendar week data fetched successfully",
  "data": {
    "weekStart": "2023-12-25",
    "weekEnd": "2023-12-31",
    "days": [
      {
        "date": "2023-12-25",
        "schedules": [
          {
            "scheduleId": 1,
            "title": "Task 1",
            "startTime": "09:00",
            "endTime": "10:00",
            "status": "COMPLETED"
            // ... other fields
          }
        ]
      },
      {
        "date": "2023-12-26",
        "schedules": []
      }
      // ... rest of the week
    ]
  }
}
```

---

## 3. Get Month View
**Endpoint:** `GET /month`

Retrieves the schedule for a specific month.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | No | Year (e.g. 2023). Defaults to current year. |
| `month` | number | No | Month (1-12). Defaults to current month. |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Calendar month data fetched successfully",
  "data": {
    "month": "2023-12",
    "days": {
      "2023-12-01": {
        "date": "2023-12-01",
        "schedules": [
           {
             "scheduleId": 10,
             "title": "Monthly Review",
             "startTime": "10:00",
             "endTime": "11:00",
             "status": "PENDING"
           }
        ]
      },
      // ... rest of the month
    }
  }
}
```
