import "./App.css";
import { Routes, Route, Navigate } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorMedicalRecords from './pages/DoctorMedicalRecords';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import About from './pages/About';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';

function App() {

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Routes>
        <Route 
          path="/login" 
          element={<Login />} 
        />
        <Route 
          path="/register" 
          element={<Register />} 
        />
        <Route 
          path="/dashboard" 
          element={<ProtectedRoute><Dashboard onLogout={handleLogout} /></ProtectedRoute>} 
        />
        <Route 
          path="/medical-records-access"
          element={<ProtectedRoute><DoctorMedicalRecords onLogout={handleLogout} /></ProtectedRoute>} 
        />
        <Route 
          path="/notifications"
          element={<ProtectedRoute><Notifications onLogout={handleLogout} /></ProtectedRoute>} 
        />
        <Route 
          path="/settings"
          element={<ProtectedRoute><Settings onLogout={handleLogout} /></ProtectedRoute>} 
        />
        <Route 
          path="/about"
          element={<ProtectedRoute><About onLogout={handleLogout} /></ProtectedRoute>} 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;
