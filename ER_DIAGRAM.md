# Entity-Relationship Diagram (Text Format)

## Entities and Relationships

```
┌─────────────────────────────────────────────────────────────────────┐
│                           USER ENTITY                                │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ name: String                                                         │
│ email: String (Unique)                                               │
│ password: String (Hashed)                                            │
│ role: Enum ['Admin', 'HOD', 'Faculty']                              │
│ departmentId: ObjectId (FK → Department)                            │
│ isActive: Boolean                                                    │
│ createdBy: ObjectId (FK → User)                                     │
│ mustChangePassword: Boolean                                          │
│ lastLogin: Date                                                      │
│ createdAt: Date                                                      │
│ updatedAt: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    │ 1:N (belongs to)
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                       DEPARTMENT ENTITY                              │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ name: String (Unique)                                                │
│ hodId: ObjectId (FK → User)                                         │
│ createdAt: Date                                                      │
│ updatedAt: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    │ 1:N (has many)
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         COURSE ENTITY                                │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ courseName: String                                                   │
│ courseCode: String (Unique)                                          │
│ semester: Number                                                     │
│ departmentId: ObjectId (FK → Department)                            │
│ assignedFaculty: ObjectId (FK → User)                               │
│ createdAt: Date                                                      │
│ updatedAt: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    │ 1:N (receives)
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    STUDENT FEEDBACK ENTITY                           │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ facultyId: ObjectId (FK → User)                                     │
│ courseId: ObjectId (FK → Course)                                    │
│ semester: Number                                                     │
│ feedbackScores: {                                                    │
│   contentKnowledge: Number (1-5)                                     │
│   teachingMethodology: Number (1-5)                                  │
│   communication: Number (1-5)                                        │
│   punctuality: Number (1-5)                                          │
│   studentEngagement: Number (1-5)                                    │
│ }                                                                    │
│ averageScore: Number (Calculated)                                    │
│ comment: String                                                      │
│ submittedAt: Date                                                    │
│ createdAt: Date                                                      │
│ updatedAt: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘
                    │
                    │ 1:1 (generates)
                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                  PERFORMANCE METRICS ENTITY                          │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ facultyId: ObjectId (FK → User)                                     │
│ semester: Number                                                     │
│ overallScore: Number                                                 │
│ departmentAverage: Number                                            │
│ trend: Enum ['improving', 'declining', 'stable']                    │
│ suggestions: Array<String>                                           │
│ createdAt: Date                                                      │
│ updatedAt: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                       AUDIT LOG ENTITY                               │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ userId: ObjectId (FK → User)                                        │
│ action: String                                                       │
│ details: Mixed                                                       │
│ timestamp: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘


┌─────────────────────────────────────────────────────────────────────┐
│                      NOTIFICATION ENTITY                             │
├─────────────────────────────────────────────────────────────────────┤
│ _id: ObjectId (PK)                                                   │
│ userId: ObjectId (FK → User)                                        │
│ message: String                                                      │
│ type: Enum ['info', 'warning', 'success', 'error']                  │
│ readStatus: Boolean                                                  │
│ createdAt: Date                                                      │
│ updatedAt: Date                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Relationships Summary

### User ↔ Department
- **Type**: Many-to-One
- **Description**: Multiple users belong to one department
- **Foreign Key**: User.departmentId → Department._id

### Department ↔ User (HOD)
- **Type**: One-to-One
- **Description**: Each department has one HOD
- **Foreign Key**: Department.hodId → User._id

### User ↔ Course
- **Type**: One-to-Many
- **Description**: One faculty teaches multiple courses
- **Foreign Key**: Course.assignedFaculty → User._id

### Course ↔ Department
- **Type**: Many-to-One
- **Description**: Multiple courses belong to one department
- **Foreign Key**: Course.departmentId → Department._id

### User ↔ StudentFeedback
- **Type**: One-to-Many
- **Description**: One faculty receives multiple feedbacks
- **Foreign Key**: StudentFeedback.facultyId → User._id

### Course ↔ StudentFeedback
- **Type**: One-to-Many
- **Description**: One course has multiple feedbacks
- **Foreign Key**: StudentFeedback.courseId → Course._id

### User ↔ PerformanceMetrics
- **Type**: One-to-Many
- **Description**: One faculty has multiple performance records
- **Foreign Key**: PerformanceMetrics.facultyId → User._id

### User ↔ AuditLog
- **Type**: One-to-Many
- **Description**: One user generates multiple audit logs
- **Foreign Key**: AuditLog.userId → User._id

### User ↔ Notification
- **Type**: One-to-Many
- **Description**: One user receives multiple notifications
- **Foreign Key**: Notification.userId → User._id

### User ↔ User (Self-Reference)
- **Type**: One-to-Many
- **Description**: Admin creates other users
- **Foreign Key**: User.createdBy → User._id

## Indexes

### User Collection
- email (unique)
- role
- departmentId
- isActive

### Department Collection
- name (unique)
- hodId

### Course Collection
- courseCode (unique)
- departmentId
- assignedFaculty
- semester

### StudentFeedback Collection
- facultyId
- courseId
- semester
- submittedAt

### PerformanceMetrics Collection
- facultyId
- semester

### AuditLog Collection
- userId
- timestamp

### Notification Collection
- userId
- readStatus
- createdAt

## Constraints

1. **User Email**: Must be unique across all users
2. **Course Code**: Must be unique across all courses
3. **Department Name**: Must be unique across all departments
4. **Admin Deletion**: Cannot delete last active admin
5. **HOD Assignment**: Only users with role 'HOD' can be assigned as department HOD
6. **Faculty Assignment**: Only users with role 'Faculty' can be assigned to courses
7. **Feedback Scores**: Must be between 1 and 5
8. **Password**: Must be hashed before storage
9. **Average Score**: Auto-calculated from feedback scores
