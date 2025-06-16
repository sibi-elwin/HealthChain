import "./App.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorMedicalRecords from './pages/DoctorMedicalRecords';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import About from './pages/About';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';
import TailwindTest from './components/TailwindTest';

function App() {

  const handleLogout = () => {
    authService.logout();
  };

  // Check if we're on the test route
  const isTestRoute = window.location.pathname === '/tailwind-test';

  // If we're on the test route, render without Material-UI providers
  if (isTestRoute) {
    return <TailwindTest />;
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
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
        <Route path="/tailwind-test" element={<TailwindTest />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
