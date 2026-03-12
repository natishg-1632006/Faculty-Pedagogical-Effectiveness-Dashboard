# FPED API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication

All protected routes require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Request:
```json
{
  "email": "admin@fped.com",
  "password": "Admin@123"
}
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "System Admin",
    "email": "admin@fped.com",
    "role": "Admin",
    "mustChangePassword": false
  }
}
```

### Change Password
**POST** `/auth/change-password` 🔒

Request:
```json
{
  "currentPassword": "Admin@123",
  "newPassword": "NewPassword@123"
}
```

### Get Profile
**GET** `/auth/profile` 🔒

---

## Admin Endpoints (Admin Only)

### User Management

#### Create User
**POST** `/admin/users` 🔒

Request:
```json
{
  "name": "John Doe",
  "email": "john@fped.com",
  "role": "Faculty",
  "departmentId": "507f1f77bcf86cd799439011"
}
```

#### Get All Users
**GET** `/admin/users` 🔒

#### Update User
**PUT** `/admin/users/:id` 🔒

Request:
```json
{
  "name": "John Updated",
  "email": "john.updated@fped.com",
  "departmentId": "507f1f77bcf86cd799439011"
}
```

#### Delete User
**DELETE** `/admin/users/:id` 🔒

#### Toggle User Status
**PATCH** `/admin/users/:id/toggle-status` 🔒

#### Reset Password
**POST** `/admin/users/:id/reset-password` 🔒

### Department Management

#### Create Department
**POST** `/admin/departments` 🔒

Request:
```json
{
  "name": "Computer Science",
  "hodId": "507f1f77bcf86cd799439011"
}
```

#### Get All Departments
**GET** `/admin/departments` 🔒

#### Update Department
**PUT** `/admin/departments/:id` 🔒

#### Delete Department
**DELETE** `/admin/departments/:id` 🔒

### Course Management

#### Create Course
**POST** `/admin/courses` 🔒

Request:
```json
{
  "courseName": "Data Structures",
  "courseCode": "CS201",
  "semester": 3,
  "departmentId": "507f1f77bcf86cd799439011",
  "assignedFaculty": "507f1f77bcf86cd799439012"
}
```

#### Get All Courses
**GET** `/admin/courses` 🔒

#### Update Course
**PUT** `/admin/courses/:id` 🔒

#### Delete Course
**DELETE** `/admin/courses/:id` 🔒

### System Monitoring

#### Get System Stats
**GET** `/admin/stats` 🔒

Response:
```json
{
  "totalUsers": 25,
  "adminCount": 2,
  "hodCount": 5,
  "facultyCount": 18,
  "departmentCount": 5,
  "courseCount": 45
}
```

#### Get Audit Logs
**GET** `/admin/audit-logs` 🔒

---

## HOD Endpoints (HOD Only)

### Get Department Performance
**GET** `/hod/department-performance` 🔒

Response:
```json
{
  "faculty": [...],
  "feedbacks": [...],
  "metrics": [...]
}
```

### Get Faculty Ranking
**GET** `/hod/faculty-ranking?semester=3` 🔒

Response:
```json
[
  {
    "facultyId": "507f1f77bcf86cd799439011",
    "name": "Prof. Michael Brown",
    "email": "michael@fped.com",
    "averageScore": "4.35",
    "feedbackCount": 12
  }
]
```

### Get Low Performers
**GET** `/hod/low-performers` 🔒

---

## Faculty Endpoints (Faculty Only)

### Get Personal Dashboard
**GET** `/faculty/dashboard` 🔒

Response:
```json
{
  "courses": [...],
  "feedbacks": [...],
  "metrics": [...],
  "overallAverage": "4.25",
  "departmentAverage": "4.10"
}
```

### Get Subject Performance
**GET** `/faculty/subject-performance` 🔒

### Get Semester Trend
**GET** `/faculty/semester-trend` 🔒

Response:
```json
[
  { "semester": 1, "averageScore": "4.10" },
  { "semester": 2, "averageScore": "4.25" },
  { "semester": 3, "averageScore": "4.35" }
]
```

---

## Common Endpoints

### Submit Feedback
**POST** `/feedback`

Request:
```json
{
  "facultyId": "507f1f77bcf86cd799439011",
  "courseId": "507f1f77bcf86cd799439012",
  "semester": 3,
  "feedbackScores": {
    "contentKnowledge": 4.5,
    "teachingMethodology": 4.2,
    "communication": 4.8,
    "punctuality": 4.0,
    "studentEngagement": 4.3
  },
  "comment": "Excellent teaching style"
}
```

### Get Notifications
**GET** `/notifications` 🔒

### Mark Notification as Read
**PATCH** `/notifications/:id/read` 🔒

### Mark All as Read
**PATCH** `/notifications/read-all` 🔒

### Download PDF Report
**GET** `/reports/pdf?facultyId=xxx&semester=3` 🔒

### Download CSV Report
**GET** `/reports/csv?departmentId=xxx` 🔒

---

## Error Responses

### 400 Bad Request
```json
{
  "message": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "message": "Not authorized, no token"
}
```

### 403 Forbidden
```json
{
  "message": "Role Admin is not authorized"
}
```

### 404 Not Found
```json
{
  "message": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "message": "Server error message"
}
```

---

## Rate Limiting

- 100 requests per 15 minutes per IP
- Authenticated users: 1000 requests per 15 minutes

## Pagination

For endpoints returning lists, use query parameters:
```
?page=1&limit=10
```

## Filtering

Use query parameters for filtering:
```
?role=Faculty&isActive=true
```

## Sorting

Use query parameters for sorting:
```
?sortBy=createdAt&order=desc
```

---

🔒 = Requires Authentication
