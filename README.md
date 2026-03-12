# Faculty Pedagogical Effectiveness Dashboard (FPED)

A full-stack enterprise-grade web application for evaluating, monitoring, and enhancing faculty teaching effectiveness using student feedback and academic analytics.

## 🚀 Tech Stack

### Frontend
- React.js 18 with Vite
- Tailwind CSS
- Framer Motion (animations)
- Recharts (data visualization)
- Axios (HTTP client)
- React Router DOM
- Context API (state management)
- Socket.io-client (real-time)
- React Hot Toast (notifications)
- Lucide React (icons)

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- JWT Authentication
- bcryptjs (password hashing)
- Socket.io (real-time)
- Nodemailer (email)
- PDFKit (PDF generation)
- json2csv (CSV export)

## 📋 Features

### Role-Based Access Control
- **Admin**: Full system control, user management, department & course management
- **HOD**: Department performance monitoring, faculty ranking, low performer identification
- **Faculty**: Personal dashboard, performance tracking, feedback analysis

### Admin Capabilities
- ✅ Create, edit, delete users (HOD & Faculty)
- ✅ Activate/deactivate user accounts
- ✅ Reset user passwords
- ✅ Manage departments and assign HODs
- ✅ Create and assign courses
- ✅ View system-wide analytics
- ✅ Access audit logs
- ✅ Download institutional reports

### HOD Capabilities
- ✅ View department performance dashboard
- ✅ Faculty ranking leaderboard
- ✅ Identify low-performing faculty
- ✅ Filter by semester and subject
- ✅ Generate department reports
- ✅ Performance alerts

### Faculty Capabilities
- ✅ Personal performance dashboard
- ✅ Subject-wise performance analysis
- ✅ Semester-wise trend visualization
- ✅ Compare with department average
- ✅ View feedback comments
- ✅ Improvement suggestions
- ✅ Download personal reports

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v7.0 or higher)
- npm or yarn

### Backend Setup

1. Navigate to server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
# Copy .env file and update values
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fped_dashboard
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_EXPIRE=7d
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

4. Seed database with sample data:
```bash
npm run seed
```

5. Start backend server:
```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Start development server:
```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## 🐳 Docker Setup

Run the entire application with Docker:

```bash
docker-compose up -d
```

This will start:
- MongoDB on port 27017
- Backend on port 5000
- Frontend on port 5173

## 👤 Default Login Credentials

After running the seed script, use these credentials:

**Admin:**
- Email: `admin@fped.com`
- Password: `Admin@123`

**HOD (Computer Science):**
- Email: `hod.cs@fped.com`
- Password: `Welcome@123`

**HOD (Electrical Engineering):**
- Email: `hod.ee@fped.com`
- Password: `Welcome@123`

**Faculty:**
- Email: `michael.brown@fped.com`
- Password: `Welcome@123`

- Email: `emily.davis@fped.com`
- Password: `Welcome@123`

- Email: `robert.wilson@fped.com`
- Password: `Welcome@123`

## 📊 Database Schema

### Users
- name, email, password (hashed)
- role (Admin/HOD/Faculty)
- departmentId (reference)
- isActive, mustChangePassword
- createdBy, lastLogin

### Departments
- name
- hodId (reference to User)

### Courses
- courseName, courseCode
- semester, departmentId
- assignedFaculty (reference)

### StudentFeedback
- facultyId, courseId, semester
- feedbackScores (5 parameters)
- averageScore, comment
- submittedAt

### PerformanceMetrics
- facultyId, semester
- overallScore, departmentAverage
- trend, suggestions

### AuditLogs
- userId, action, details, timestamp

### Notifications
- userId, message, type
- readStatus, createdAt

## 🔐 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Protected API routes
- Input validation
- Audit logging
- Session management

## 📱 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/change-password` - Change password
- `GET /api/auth/profile` - Get user profile

### Admin Routes (Protected)
- `POST /api/admin/users` - Create user
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `PATCH /api/admin/users/:id/toggle-status` - Toggle user status
- `POST /api/admin/users/:id/reset-password` - Reset password
- `GET /api/admin/departments` - Get departments
- `POST /api/admin/departments` - Create department
- `GET /api/admin/courses` - Get courses
- `POST /api/admin/courses` - Create course
- `GET /api/admin/stats` - System statistics
- `GET /api/admin/audit-logs` - Audit logs

### HOD Routes (Protected)
- `GET /api/hod/department-performance` - Department performance
- `GET /api/hod/faculty-ranking` - Faculty ranking
- `GET /api/hod/low-performers` - Low performers

### Faculty Routes (Protected)
- `GET /api/faculty/dashboard` - Personal dashboard
- `GET /api/faculty/subject-performance` - Subject performance
- `GET /api/faculty/semester-trend` - Semester trend

### Common Routes
- `POST /api/feedback` - Submit feedback
- `GET /api/notifications` - Get notifications
- `GET /api/reports/pdf` - Download PDF report
- `GET /api/reports/csv` - Download CSV report

## 🎨 UI Features

- Glassmorphism design
- Dark mode support
- Responsive layout
- Animated transitions
- Interactive charts (Bar, Line, Radar)
- Skeleton loaders
- Toast notifications
- Modal dialogs
- Collapsible sidebar
- Gradient highlights

## 📈 Performance Metrics

The system evaluates faculty on:
1. Content Knowledge
2. Teaching Methodology
3. Communication Skills
4. Punctuality
5. Student Engagement

## 🔄 Real-time Features

- Live notifications via Socket.io
- Instant performance updates
- Real-time dashboard refresh

## 🧪 Testing

Run backend tests:
```bash
cd server
npm test
```

Run frontend tests:
```bash
cd client
npm test
```

## 📦 Build for Production

Backend:
```bash
cd server
npm start
```

Frontend:
```bash
cd client
npm run build
npm run preview
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Support

For support, email support@fped.com or open an issue in the repository.

## 🎯 Roadmap

- [ ] Email notifications
- [ ] Advanced analytics
- [ ] Mobile app
- [ ] AI-powered suggestions
- [ ] Multi-language support
- [ ] Export to Excel
- [ ] Bulk user import
- [ ] Custom report builder

---

**Built with ❤️ for Educational Excellence**
