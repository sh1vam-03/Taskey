# 📂 Category API Documentation

This module handles the CRUD operations for task categories. Users can create, update, and manage their own categories to organize tasks.

**Base URL:** `http://localhost:5000/api/categories`

---

## 1. Create Category
**Endpoint:** `POST /`

Creates a new custom category for the user.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | **Yes** | Category name (unique per user) |
| `color` | string | No | Hex color code (e.g. #FF5733) |
| `icon` | string | No | Icon identifier (e.g. "briefcase") |

### Success Response (201 Created)
```json
{
  "success": true,
  "message": "Category created successfully",
  "data": {
    "id": 1,
    "name": "Work",
    "color": "#FF5733",
    "icon": "briefcase",
    "userId": "user-uuid",
    "createdAt": "2023-12-25T10:00:00.000Z",
    "updatedAt": "2023-12-25T10:00:00.000Z"
  }
}
```

---

## 2. Get All Categories
**Endpoint:** `GET /`

Retrieves all categories created by the authenticated user.

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Work",
      "color": "#FF5733",
      "icon": "briefcase"
    },
    {
      "id": 2,
      "name": "Personal",
      "color": "#33FF57",
      "icon": "user"
    }
  ]
}
```

---

## 3. Get Single Category
**Endpoint:** `GET /:id`

Retrieves details of a specific category.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Category ID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Category fetched successfully",
  "data": {
    "id": 1,
    "name": "Work",
    "color": "#FF5733",
    "icon": "briefcase",
    "userId": "user-uuid"
  }
}
```

---

## 4. Update Category
**Endpoint:** `PUT /:id`

Updates an existing category. Only provided fields are updated.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Category ID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Request Body (Partial Update)
| Field | Type | Description |
|-------|------|-------------|
| `name` | string | New name |
| `color` | string | New hex color |
| `icon` | string | New icon identifier |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Category updated successfully",
  "data": {
    "id": 1,
    "name": "Office",
    "color": "#000000",
    "updatedAt": "2023-12-25T12:00:00.000Z"
    // ...other fields
  }
}
```

---

## 5. Delete Category
**Endpoint:** `DELETE /:id`

Permanently deletes a category.

### Path Parameters
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | number | **Yes** | Category ID |

### Headers
| Key | Value | Required | Description |
|-----|-------|----------|-------------|
| `Authorization` | `Bearer <token>` | **Yes** | JWT access token |

### Success Response (200 OK)
```json
{
  "success": true,
  "message": "Category deleted successfully"
}
```
