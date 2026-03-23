import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './layouts/DashboardLayout';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import UserManagement from './pages/UserManagement';
import DepartmentManagement from './pages/DepartmentManagement';
import CourseManagement from './pages/CourseManagement';
import HODDashboard from './pages/HODDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import FeedbackForms from './pages/FeedbackForms';
import StudentFeedback from './pages/StudentFeedback';
import ViewFeedback from './pages/ViewFeedback';
import FacultyRanking from './pages/FacultyRanking';
import PerformancePage from './pages/PerformancePage';
import FacultyPerformance from './pages/FacultyPerformance';
import FacultyCourses from './pages/FacultyCourses';
import Reports from './pages/Reports';
import Analytics from './pages/Analytics';
import AuditLogs from './pages/AuditLogs';

function App() {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ThemeProvider>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Admin Routes */}
            <Route path="/admin" element={
              <ProtectedRoute allowedRoles={['Admin']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<UserManagement />} />
              <Route path="departments" element={<DepartmentManagement />} />
              <Route path="courses" element={<CourseManagement />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="logs" element={<AuditLogs />} />
            </Route>

            {/* HOD Routes */}
            <Route path="/hod" element={
              <ProtectedRoute allowedRoles={['HOD']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<HODDashboard />} />
              <Route path="performance" element={<PerformancePage />} />
              <Route path="ranking" element={<FacultyRanking />} />
              <Route path="feedback-forms" element={<FeedbackForms />} />
              <Route path="view-feedback" element={<ViewFeedback />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            {/* Faculty Routes */}
            <Route path="/faculty" element={
              <ProtectedRoute allowedRoles={['Faculty']}>
                <DashboardLayout />
              </ProtectedRoute>
            }>
              <Route index element={<FacultyDashboard />} />
              <Route path="performance" element={<FacultyPerformance />} />
              <Route path="courses" element={<FacultyCourses />} />
              <Route path="reports" element={<Reports />} />
            </Route>

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/student-feedback" element={<StudentFeedback />} />
            <Route path="/unauthorized" element={<div className="min-h-screen flex items-center justify-center text-2xl">Unauthorized Access</div>} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </HashRouter>
  );
}

export default App;
