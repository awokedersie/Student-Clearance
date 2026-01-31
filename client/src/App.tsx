import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentLogin from './components/student/StudentLogin';
import StudentDashboard from './components/student/StudentDashboard';
import StudentProfile from './components/student/StudentProfile';
import ClearanceRequest from './components/student/ClearanceRequest';
import ClearanceStatus from './components/student/ClearanceStatus';
import ChangePassword from './components/common/ChangePassword';
import Notifications from './components/student/Notifications';
import AdminLogin from './components/admin/AdminLogin';
import SystemDashboard from './components/admin/SystemDashboard';
import ManageStudents from './components/admin/ManageStudents';
import ManageAdmins from './components/admin/ManageAdmins';
import ClearanceSettings from './components/admin/ClearanceSettings';
import DepartmentDashboard from './components/admin/DepartmentDashboard';
import ForgotPassword from './components/common/ForgotPassword';
import AuditLogs from './components/admin/AuditLogs';

function App() {
  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route path="/login" element={<StudentLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/clearance-request" element={<ClearanceRequest />} />
        <Route path="/student/clearance-status" element={<ClearanceStatus />} />
        <Route path="/student/change-password" element={<ChangePassword />} />
        <Route path="/student/notifications" element={<Notifications />} />

        {/* Admin Routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<Navigate to="/admin/system/dashboard" replace />} />
        <Route path="/admin/system/dashboard" element={<SystemDashboard />} />
        <Route path="/admin/system/manage-students" element={<ManageStudents />} />
        <Route path="/admin/system/manage-admins" element={<ManageAdmins />} />
        <Route path="/admin/system/audit-logs" element={<AuditLogs />} />
        <Route path="/admin/clearance-settings" element={<ClearanceSettings />} />
        <Route path="/admin/departments/:deptName" element={<DepartmentDashboard />} />
        <Route path="/admin/registrar/dashboard" element={<DepartmentDashboard />} />
        <Route path="/admin/protector/dashboard" element={<DepartmentDashboard />} />
        <Route path="/admin/change-password" element={<ChangePassword />} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
