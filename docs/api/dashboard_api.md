# 📊 Dashboard & Analytics API Documentation

This module provides aggregated insights, performance metrics, and streak tracking for the user's tasks and schedules.

**Base URL:** `http://localhost:5000/api/dashboard`

---

## 1. Get Dashboard Overview
**Endpoint:** `GET /overview`

fetches a high-level summary of today's progress, including task counts and status distribution.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Dashboard overview fetched successfully",
  "data": {
    "today": {
      "totalTasks": 10,
      "completedTasks": 5,
      "missedTasks": 1,
      "pendingTasks": 4
    }
  }
}
```

---

## 2. Get Today's Dashboard
**Endpoint:** `GET /today`

Retrieves a detailed timeline and statistics for the current day.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Today's dashboard fetched successfully",
  "data": {
    "date": "2023-12-25",
    "stats": {
      "total": 5,
      "completed": 2,
      "missed": 0,
      "pending": 3
    },
    "timeline": [
      {
        "type": "SCHEDULED",
        "scheduleId": 101,
        "taskId": "uuid-1",
        "title": "Morning Meeting",
        "priority": "HIGH",
        "startTime": "09:00",
        "endTime": "10:00",
        "status": "COMPLETED"
      },
      {
        "type": "UNSCHEDULED",
        "taskId": "uuid-2",
        "title": "Check Emails",
        "priority": "MEDIUM",
        "startTime": null,
        "endTime": null,
        "status": "PENDING"
      }
    ]
  }
}
```

---

## 3. Get Weekly Dashboard
**Endpoint:** `GET /weekly`

Retrieves performance summary and day-by-day breakdown for a specific week.

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Any date within the desired week (YYYY-MM-DD). Defaults to today. |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Weekly dashboard fetched successfully",
  "data": {
    "weekStart": "2023-12-25",
    "weekEnd": "2023-12-31",
    "summary": {
      "total": 50,
      "completed": 40,
      "missed": 5,
      "pending": 5,
      "completionRate": 80
    },
    "days": {
      "2023-12-25": { "total": 10, "completed": 8, "missed": 1, "pending": 1 },
      "2023-12-26": { "total": 8, "completed": 8, "missed": 0, "pending": 0 }
      // ... rest of the week
    }
  }
}
```

---

## 4. Get Monthly Dashboard
**Endpoint:** `GET /monthly`

Retrieves performance summary and day-by-day breakdown for a specific month.

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | **Yes** | Year (e.g. 2023) |
| `month` | number | **Yes** | Month (1-12) |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Monthly dashboard fetched successfully",
  "data": {
    "month": "2023-12",
    "summary": {
      "total": 200,
      "completed": 150,
      "missed": 20,
      "pending": 30,
      "completionRate": 75
    },
    "days": {
      "2023-12-01": { "total": 5, "completed": 5, "missed": 0, "pending": 0 }
      // ... rest of the month
    }
  }
}
```

---

## 5. Get Streaks Overview
**Endpoint:** `GET /streaks`

Retrieves current and longest perfect day streaks.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Streak overview fetched successfully",
  "data": {
    "currentStreak": 5,
    "longestStreak": 12,
    "isActive": true
  }
}
```

---

## 6. Get Streak Calendar
**Endpoint:** `GET /streak-calendar`

Retrieves a boolean map of "perfect days" for the last N days. A perfect day is one where all scheduled and unscheduled tasks were completed with zero misses.

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `days` | number | No | Number of days to look back. Defaults to 90. |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Streak calendar fetched successfully",
  "data": {
    "2023-12-25": true,
    "2023-12-24": false,
    "2023-12-23": true
  }
}
```

---

## 7. Get Daily Performance
**Endpoint:** `GET /performance/daily`

Retrieves performance stats for a specific day.

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Date (YYYY-MM-DD). Defaults to today. |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Daily performance fetched successfully",
  "data": {
    "date": "2023-12-25",
    "total": 5,
    "completed": 4,
    "missed": 1,
    "score": 80
  }
}
```

---

## 8. Get Weekly Performance
**Endpoint:** `GET /performance/weekly`

Retrieves aggregate performance and daily breakdown for a week.

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `date` | string | No | Any date within the week (YYYY-MM-DD). Defaults to today. |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Weekly performance fetched successfully",
  "data": {
    "weekStart": "2023-12-25",
    "weekEnd": "2023-12-31",
    "percentage": 85,
    "breakdown": {
      "2023-12-25": { "total": 5, "completed": 4, "missed": 1, "score": 80 },
      "2023-12-26": { "total": 6, "completed": 6, "missed": 0, "score": 100 }
      // ... rest of the week
    }
  }
}
```

---

## 9. Get Monthly Performance
**Endpoint:** `GET /performance/monthly`

Retrieves aggregate performance and daily breakdown for a month.

### Query Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `year` | number | **Yes** | Year (e.g. 2023) |
| `month` | number | **Yes** | Month (1-12) |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Monthly performance fetched successfully",
  "data": {
    "month": "2023-12",
    "percentage": 78,
    "breakdown": {
      "2023-12-01": { "total": 4, "completed": 3, "missed": 1, "score": 75 }
      // ... rest of the month
    }
  }
}
```
