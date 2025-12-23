# 📝 Task Management API Documentation

This module handles the CRUD operations for tasks, including categorization, prioritization, and scheduling integration.

**Base URL:** `http://localhost:5000/api/tasks`

---

## 1. Create Task
**Endpoint:** `POST /`

Creates a new task in the system.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | **Yes** | Task title (non-empty) |
| `description` | string | No | Detailed description |
| `priority` | string | No | `LOW`, `MEDIUM`, `HIGH` (Default: `MEDIUM`) |
| `dueDate` | string | No | ISO Date string (e.g. `2023-12-31T23:59:00Z`) |
| `categoryId` | number | No | ID of the category (must belong to user) |

### Success Response (201 Created)
```json
{
  "id": "uuid-string",
  "title": "Complete Project Report",
  "description": "Finalize the documentation and submit",
  "priority": "HIGH",
  "status": "PENDING",
  "dueDate": "2023-12-31T18:30:00.000Z",
  "categoryId": null,
  "userId": "user-uuid",
  "createdAt": "2023-12-25T10:00:00.000Z",
  "updatedAt": "2023-12-25T10:00:00.000Z"
}
```

---

## 2. Get All Tasks
**Endpoint:** `GET /`

Retrieves a paginated list of tasks with optional filtering and sorting.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Query Parameters
| Field | Type | Description |
|-------|------|-------------|
| `search` | string | Search term for task title |
| `priority` | string | Filter by `LOW`, `MEDIUM`, `HIGH` |
| `categoryId` | number | Filter by specific category |
| `isArchived` | boolean | `true` to show archived tasks, `false` for active |
| `sortBy` | string | Field to sort by (default: `createdAt`) |
| `sortOrder` | string | `asc` or `desc` (default: `desc`) |
| `page` | number | Page number (default: 1) |
| `limit` | number | Items per page (default: 10) |

### Success Response (200 OK)
```json
{
  "tasks": [
    {
      "id": "uuid-1",
      "title": "Task 1",
      "priority": "MEDIUM",
      "status": "PENDING",
      "category": { "id": 1, "name": "Work" }
    },
    {
      "id": "uuid-2",
      "title": "Task 2",
      "priority": "HIGH",
      "status": "COMPLETED",
      "category": null
    }
  ],
  "meta": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "totalPages": 5
  }
}
```

---

## 3. Get Single Task
**Endpoint:** `GET /:id`

Retrieves details of a specific task.

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
  "id": "uuid-1",
  "title": "Detailed Task",
  "description": "Full description here",
  "priority": "MEDIUM",
  "status": "PENDING",
  "dueDate": "2023-12-31T12:00:00.000Z",
  "schedules": [],
  "category": { "id": 1, "name": "Work" },
  "createdAt": "2023-10-01T10:00:00.000Z",
  "updatedAt": "2023-10-02T11:00:00.000Z"
}
```

---

## 4. Update Task
**Endpoint:** `PUT /:id`

Updates an existing task. Only provided fields are updated.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | **Yes** | Task UUID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body (Partial Update)
| Field | Type | Description |
|-------|------|-------------|
| `title` | string | New title |
| `description` | string | New description |
| `priority` | string | `LOW`, `MEDIUM`, `HIGH` |
| `status` | string | `PENDING`, `COMPLETED` |
| `dueDate` | string | ISO Date string |
| `categoryId` | number | Category ID |
| `isArchived` | boolean | Archive/Unarchive task |

### Success Response (200 OK)
Returns the updated task object.
```json
{
  "id": "uuid-1",
  "title": "Updated Title",
  "priority": "HIGH",
  "updatedAt": "2023-12-25T12:00:00.000Z"
  // ...other fields
}
```

---

## 5. Delete Task
**Endpoint:** `DELETE /:id`

Soft-deletes a task (marks as archived and sets deletedAt).

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
  "message": "Task deleted successfully"
}
```
