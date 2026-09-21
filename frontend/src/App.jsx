import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppShell from './components/layout/AppShell';

import Home from './pages/Home';
import ChooseUser from './pages/ChooseUser';
import NotFound from './pages/NotFound';

import AdminSignIn from './pages/auth/AdminSignIn';
import AdminRegister from './pages/auth/AdminRegister';
import TeacherSignIn from './pages/auth/TeacherSignIn';
import TeacherSignUp from './pages/auth/TeacherSignUp';
import StudentSignIn from './pages/auth/StudentSignIn';
import StudentSignUp from './pages/auth/StudentSignUp';

import AdminDashboard from './pages/Admin/Dashboard';
import AdminClasses from './pages/Admin/Classes';
import AdminClassDetails from './pages/Admin/ClassDetails';
import AdminStudents from './pages/Admin/Students';
import AdminStudentDetails from './pages/Admin/StudentDetails';
import AdminTeachers from './pages/Admin/Teachers';
import AdminLibrary from './pages/Admin/Library';
import AdminEvents from './pages/Admin/Events';
import AdminAnnouncements from './pages/Admin/Announcements';
import AdminProfile from './pages/Admin/Profile';

import TeacherDashboard from './pages/Teachers/Dashboard';
import TeacherClasses from './pages/Teachers/Classes';
import TeacherClassDetails from './pages/Teachers/ClassDetails';
import TeacherAssignments from './pages/Teachers/Assignments';
import TeacherSubmissions from './pages/Teachers/Submissions';
import TeacherNotices from './pages/Teachers/Notices';
import TeacherProfile from './pages/Teachers/Profile';

import StudentDashboard from './pages/Students/Dashboard';
import StudentAssignments from './pages/Students/Assignments';
import StudentAttendance from './pages/Students/Attendance';
import StudentNotices from './pages/Students/Notices';
import StudentAnnouncements from './pages/Students/Announcements';
import StudentLibrary from './pages/Students/Library';
import StudentProfile from './pages/Students/Profile';

const App = () => (
  <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Home />} />
          <Route path="/choose" element={<ChooseUser />} />

          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/teacher/signin" element={<TeacherSignIn />} />
          <Route path="/teacher/signup" element={<TeacherSignUp />} />
          <Route path="/student/signin" element={<StudentSignIn />} />
          <Route path="/student/signup" element={<StudentSignUp />} />

          {/* Admin */}
          <Route element={<ProtectedRoute role="admin" />}>
            <Route path="/admin" element={<AppShell />}>
              <Route index element={<AdminDashboard />} />
              <Route path="classes" element={<AdminClasses />} />
              <Route path="classes/:classId" element={<AdminClassDetails />} />
              <Route path="students" element={<AdminStudents />} />
              <Route path="students/:studentId" element={<AdminStudentDetails />} />
              <Route path="teachers" element={<AdminTeachers />} />
              <Route path="library" element={<AdminLibrary />} />
              <Route path="events" element={<AdminEvents />} />
              <Route path="announcements" element={<AdminAnnouncements />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>
          </Route>

          {/* Teacher */}
          <Route element={<ProtectedRoute role="teacher" />}>
            <Route path="/teacher" element={<AppShell />}>
              <Route index element={<TeacherDashboard />} />
              <Route path="classes" element={<TeacherClasses />} />
              <Route path="classes/:classId" element={<TeacherClassDetails />} />
              <Route path="assignments" element={<TeacherAssignments />} />
              <Route
                path="assignments/:assignmentId/submissions"
                element={<TeacherSubmissions />}
              />
              <Route path="notices" element={<TeacherNotices />} />
              <Route path="profile" element={<TeacherProfile />} />
            </Route>
          </Route>

          {/* Student */}
          <Route element={<ProtectedRoute role="student" />}>
            <Route path="/student" element={<AppShell />}>
              <Route index element={<StudentDashboard />} />
              <Route path="assignments" element={<StudentAssignments />} />
              <Route path="attendance" element={<StudentAttendance />} />
              <Route path="notices" element={<StudentNotices />} />
              <Route path="announcements" element={<StudentAnnouncements />} />
              <Route path="library" element={<StudentLibrary />} />
              <Route path="profile" element={<StudentProfile />} />
            </Route>
          </Route>

          {/* Legacy paths from the previous route table */}
          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />
          <Route path="/teacher/dashboard" element={<Navigate to="/teacher" replace />} />
          <Route path="/student/dashboard" element={<Navigate to="/student" replace />} />

          <Route path="*" element={<NotFound />} />
        </Routes>

        <ToastContainer
          position="bottom-right"
          autoClose={3200}
          hideProgressBar
          newestOnTop
          closeOnClick
          theme="colored"
          toastClassName="text-sm"
        />
      </AuthProvider>
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
