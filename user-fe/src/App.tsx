import "./App.css";
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import MedicalRecords from './pages/MedicalRecords';
import UploadMedicalRecord from './pages/UploadMedicalRecord';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import { authService } from './services/authService';
import ProtectedRoute from './components/ProtectedRoute';

function App() {

  const handleLogout = () => {
    authService.logout();
    // No need to setIsAuthenticated here as App.tsx doesn't manage it directly now
  };

  return (
    <Routes>
      <Route 
        path="/login" 
        element={<Login />} 
      />
      <Route 
        path="/signup" 
        element={<Signup />} 
      />
      <Route 
        path="/dashboard" 
        element={<ProtectedRoute><Dashboard onLogout={handleLogout} /></ProtectedRoute>} 
      />
      <Route 
        path="/medical-records" 
        element={<ProtectedRoute><MedicalRecords onLogout={handleLogout} /></ProtectedRoute>} 
      />
      <Route 
        path="/medical-records/upload" 
        element={<ProtectedRoute><UploadMedicalRecord onLogout={handleLogout} /></ProtectedRoute>} 
      />
      <Route 
        path="/notifications" 
        element={<ProtectedRoute><Notifications onLogout={handleLogout} /></ProtectedRoute>} 
      />
      <Route 
        path="/settings" 
        element={<ProtectedRoute><Settings onLogout={handleLogout} /></ProtectedRoute>} 
      />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default App;
