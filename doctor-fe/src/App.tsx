import "./App.css";
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Routes, Route, Navigate } from 'react-router-dom';
import { theme } from './theme';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import DoctorMedicalRecords from './pages/DoctorMedicalRecords';
import About from './pages/About';
import ProtectedRoute from './components/ProtectedRoute';
import { authService } from './services/authService';

function App() {

  const handleLogout = () => {
    authService.logout();
  };

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
          path="/about"
          element={<ProtectedRoute><About onLogout={handleLogout} /></ProtectedRoute>} 
        />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
