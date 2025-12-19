import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import StudentDashboard from './components/StudentDashboard';
import StudentProfile from './components/StudentProfile';
import ClearanceRequest from './components/ClearanceRequest';
import ClearanceStatus from './components/ClearanceStatus';
import ChangePassword from './components/ChangePassword';
import Notifications from './components/Notifications';
import AdminLogin from './components/AdminLogin';
import SystemDashboard from './components/SystemDashboard';
import ManageStudents from './components/ManageStudents';
import ManageAdmins from './components/ManageAdmins';
import ClearanceSettings from './components/ClearanceSettings';
import DepartmentDashboard from './components/DepartmentDashboard';
import About from './components/About';
import ForgotPassword from './components/ForgotPassword';
import Contact from './components/Contact';

function App() {
  return (
    <Router>
      <Routes>
        {/* Student Routes */}
        <Route path="/login" element={<Login />} />
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
        <Route path="/admin/clearance-settings" element={<ClearanceSettings />} />
        <Route path="/admin/departments/:deptName" element={<DepartmentDashboard />} />
        <Route path="/admin/registrar/dashboard" element={<DepartmentDashboard />} />
        <Route path="/admin/protector/dashboard" element={<DepartmentDashboard />} />
        <Route path="/admin/change-password" element={<ChangePassword />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Redirects */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
